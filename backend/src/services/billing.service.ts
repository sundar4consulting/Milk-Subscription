import { Prisma, BillStatus, DeliveryStatus, DeliveryType, PaymentStatus } from '@prisma/client';
import prisma from '../config/database.js';
import { NotFoundError, BadRequestError, ForbiddenError } from '../utils/errors.js';
import { PaginationInput } from '../utils/validators.js';
import {
  startOfMonth,
  endOfMonth,
  format,
  addDays,
  parseISO,
} from 'date-fns';
import { generateBillNumber, getBillingPeriod } from '../utils/dateHelpers.js';

export class BillingService {
  /**
   * Get bill by ID
   */
  async getBillById(billId: string, customerId?: string) {
    const bill = await prisma.bill.findUnique({
      where: { id: billId },
      include: {
        items: {
          include: {
            product: true,
            subscription: true,
          },
        },
        payments: true,
        customer: {
          include: {
            user: {
              select: { email: true, phone: true },
            },
          },
        },
      },
    });

    if (!bill) {
      throw new NotFoundError('Bill not found');
    }

    if (customerId && bill.customerId !== customerId) {
      throw new ForbiddenError('Access denied');
    }

    return bill;
  }

  /**
   * Get customer bills
   */
  async getCustomerBills(customerId: string, pagination: PaginationInput) {
    const { page, limit, sortBy, sortOrder } = pagination;
    const skip = (page - 1) * limit;

    const [bills, total] = await Promise.all([
      prisma.bill.findMany({
        where: { customerId },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          payments: true,
        },
        skip,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { billingPeriodEnd: 'desc' },
      }),
      prisma.bill.count({ where: { customerId } }),
    ]);

    return {
      bills,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Generate bill for a customer for a billing period
   */
  async generateBill(customerId: string, billingPeriodStart: Date, billingPeriodEnd: Date) {
    // Check if bill already exists for this period
    const existingBill = await prisma.bill.findFirst({
      where: {
        customerId,
        billingPeriodStart,
        billingPeriodEnd,
      },
    });

    if (existingBill) {
      throw new BadRequestError('Bill already exists for this period');
    }

    // Get customer profile
    const customer = await prisma.customerProfile.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundError('Customer not found');
    }

    // Get all deliveries for the billing period
    const deliveries = await prisma.delivery.findMany({
      where: {
        OR: [
          { subscription: { customerId } },
          { adhocRequest: { customerId } },
        ],
        deliveryDate: {
          gte: billingPeriodStart,
          lte: billingPeriodEnd,
        },
      },
      include: {
        subscription: {
          include: {
            product: {
              include: {
                pricing: {
                  where: { effectiveTo: null },
                  orderBy: { effectiveFrom: 'desc' },
                  take: 1,
                },
              },
            },
          },
        },
        adhocItem: {
          include: {
            product: true,
          },
        },
      },
    });

    // Get vacations for the period
    const vacations = await prisma.vacation.findMany({
      where: {
        subscription: { customerId },
        OR: [
          {
            startDate: { lte: billingPeriodEnd },
            endDate: { gte: billingPeriodStart },
          },
        ],
      },
    });

    // Get holidays for the period
    const holidays = await prisma.holiday.findMany({
      where: {
        date: {
          gte: billingPeriodStart,
          lte: billingPeriodEnd,
        },
      },
    });

    // Calculate totals
    let totalScheduledDeliveries = 0;
    let actualDeliveries = 0;
    let missedDeliveries = 0;
    let vacationDays = 0;
    let adhocDeliveries = 0;
    let regularSubtotal = 0;
    let adhocAmount = 0;

    // Group deliveries by product for bill items
    const billItemsMap = new Map<
      string,
      {
        productId: string;
        subscriptionId: string | null;
        description: string;
        quantity: number;
        unitPrice: number;
        itemType: DeliveryType;
      }
    >();

    for (const delivery of deliveries) {
      totalScheduledDeliveries++;

      if (delivery.deliveryType === DeliveryType.REGULAR) {
        if (delivery.status === DeliveryStatus.DELIVERED || delivery.status === DeliveryStatus.PARTIAL) {
          actualDeliveries++;
          const quantity = Number(delivery.deliveredQuantity || delivery.scheduledQuantity);
          const product = delivery.subscription?.product;
          const unitPrice = product?.pricing[0] ? Number(product.pricing[0].pricePerUnit) : 0;
          const amount = quantity * unitPrice;
          regularSubtotal += amount;

          const key = `regular-${delivery.subscription?.productId}`;
          const existing = billItemsMap.get(key);
          if (existing) {
            existing.quantity += quantity;
          } else {
            billItemsMap.set(key, {
              productId: delivery.subscription?.productId || '',
              subscriptionId: delivery.subscriptionId,
              description: `${product?.name || 'Product'} - Regular Delivery`,
              quantity,
              unitPrice,
              itemType: DeliveryType.REGULAR,
            });
          }
        } else if (delivery.status === DeliveryStatus.MISSED) {
          missedDeliveries++;
        }
      } else if (delivery.deliveryType === DeliveryType.ADHOC) {
        if (delivery.status === DeliveryStatus.DELIVERED || delivery.status === DeliveryStatus.PARTIAL) {
          adhocDeliveries++;
          const quantity = Number(delivery.deliveredQuantity || delivery.scheduledQuantity);
          const unitPrice = delivery.adhocItem ? Number(delivery.adhocItem.unitPrice) : 0;
          const amount = quantity * unitPrice;
          adhocAmount += amount;

          const key = `adhoc-${delivery.adhocItem?.productId}`;
          const existing = billItemsMap.get(key);
          if (existing) {
            existing.quantity += quantity;
          } else {
            billItemsMap.set(key, {
              productId: delivery.adhocItem?.productId || '',
              subscriptionId: null,
              description: `${delivery.adhocItem?.product?.name || 'Product'} - Ad-hoc Delivery`,
              quantity,
              unitPrice,
              itemType: DeliveryType.ADHOC,
            });
          }
        }
      }
    }

    // Count vacation days (approximate)
    vacationDays = vacations.length > 0
      ? vacations.reduce((sum, v) => {
          const start = v.startDate > billingPeriodStart ? v.startDate : billingPeriodStart;
          const end = v.endDate < billingPeriodEnd ? v.endDate : billingPeriodEnd;
          return sum + Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        }, 0)
      : 0;

    const subtotal = regularSubtotal + adhocAmount;

    // Get tax settings
    const taxSetting = await prisma.systemSettings.findUnique({
      where: { key: 'tax_percentage' },
    });
    const taxPercentage = (taxSetting?.value as any)?.gst || 0;
    const taxAmount = (subtotal * taxPercentage) / 100;

    // Get customer wallet for credits
    const wallet = await prisma.customerWallet.findUnique({
      where: { customerId },
    });
    const creditsApplied = wallet ? Math.min(Number(wallet.balance), subtotal + taxAmount) : 0;

    const totalAmount = subtotal + taxAmount - creditsApplied;

    // Calculate due date (10th of next month or 10 days after generation)
    const dueDate = addDays(billingPeriodEnd, 10);

    // Create bill
    const bill = await prisma.bill.create({
      data: {
        customerId,
        billNumber: generateBillNumber(customerId, billingPeriodEnd),
        billingPeriodStart,
        billingPeriodEnd,
        totalScheduledDeliveries,
        actualDeliveries,
        vacationDays,
        missedDeliveries,
        holidayDays: holidays.length,
        adhocDeliveries,
        adhocAmount,
        regularSubtotal,
        subtotal,
        taxAmount,
        discountAmount: 0,
        creditsApplied,
        totalAmount,
        dueDate,
        status: BillStatus.GENERATED,
        generatedAt: new Date(),
        items: {
          create: Array.from(billItemsMap.values()).map((item) => ({
            productId: item.productId,
            subscriptionId: item.subscriptionId,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice,
            itemType: item.itemType,
          })),
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    // Deduct credits from wallet if applied
    if (creditsApplied > 0 && wallet) {
      await prisma.customerWallet.update({
        where: { id: wallet.id },
        data: {
          balance: { decrement: creditsApplied },
        },
      });

      await prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'DEBIT',
          amount: creditsApplied,
          referenceType: 'PAYMENT',
          referenceId: bill.id,
          description: `Credits applied to bill ${bill.billNumber}`,
        },
      });
    }

    return bill;
  }

  /**
   * Generate bills for all customers for a billing period (Admin)
   */
  async generateBillsForPeriod(billingPeriodStart: Date, billingPeriodEnd: Date) {
    // Get all customers with active subscriptions or deliveries in the period
    const customers = await prisma.customerProfile.findMany({
      where: {
        OR: [
          {
            subscriptions: {
              some: {
                status: 'ACTIVE',
              },
            },
          },
        ],
      },
    });

    const results = {
      generated: 0,
      skipped: 0,
      errors: [] as Array<{ customerId: string; error: string }>,
    };

    for (const customer of customers) {
      try {
        await this.generateBill(customer.id, billingPeriodStart, billingPeriodEnd);
        results.generated++;
      } catch (error) {
        if (error instanceof BadRequestError && error.message.includes('already exists')) {
          results.skipped++;
        } else {
          results.errors.push({
            customerId: customer.id,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    }

    return results;
  }

  /**
   * Get all bills (Admin)
   */
  async getAllBills(
    pagination: PaginationInput,
    filters?: {
      status?: BillStatus;
      startDate?: string;
      endDate?: string;
      customerId?: string;
    }
  ) {
    const { page, limit, sortBy, sortOrder } = pagination;
    const skip = (page - 1) * limit;

    const where: Prisma.BillWhereInput = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.customerId) {
      where.customerId = filters.customerId;
    }

    if (filters?.startDate) {
      where.billingPeriodStart = { gte: parseISO(filters.startDate) };
    }

    if (filters?.endDate) {
      where.billingPeriodEnd = { lte: parseISO(filters.endDate) };
    }

    const [bills, total] = await Promise.all([
      prisma.bill.findMany({
        where,
        include: {
          customer: {
            include: {
              user: {
                select: { email: true, phone: true },
              },
            },
          },
          payments: true,
        },
        skip,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
      }),
      prisma.bill.count({ where }),
    ]);

    return {
      bills,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update bill status (Admin)
   */
  async updateBillStatus(billId: string, status: BillStatus) {
    const bill = await this.getBillById(billId);

    const updated = await prisma.bill.update({
      where: { id: billId },
      data: { status },
    });

    return updated;
  }

  /**
   * Record a payment
   */
  async recordPayment(data: {
    billId: string;
    customerId: string;
    amount: number;
    paymentMethod: string;
    transactionId?: string;
    notes?: string;
  }) {
    const bill = await this.getBillById(data.billId, data.customerId);

    // Calculate total paid
    const totalPaid = bill.payments
      .filter((p) => p.status === PaymentStatus.SUCCESS)
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const remainingAmount = Number(bill.totalAmount) - totalPaid;

    if (data.amount > remainingAmount) {
      throw new BadRequestError(`Payment amount exceeds remaining balance of ${remainingAmount}`);
    }

    const payment = await prisma.payment.create({
      data: {
        billId: data.billId,
        customerId: data.customerId,
        amount: data.amount,
        paymentMethod: data.paymentMethod as any,
        transactionId: data.transactionId,
        status: PaymentStatus.SUCCESS,
        paymentDate: new Date(),
        notes: data.notes,
      },
    });

    // Update bill status
    const newTotalPaid = totalPaid + data.amount;
    let newStatus = bill.status;

    if (newTotalPaid >= Number(bill.totalAmount)) {
      newStatus = BillStatus.PAID;
    } else if (newTotalPaid > 0) {
      newStatus = BillStatus.PARTIAL;
    }

    if (newStatus !== bill.status) {
      await prisma.bill.update({
        where: { id: data.billId },
        data: { status: newStatus },
      });
    }

    return payment;
  }

  /**
   * Get consolidated dashboard data for customer
   */
  async getConsolidatedDashboard(customerId: string, month: number, year: number) {
    const startDate = startOfMonth(new Date(year, month - 1));
    const endDate = endOfMonth(startDate);

    // Get deliveries for the month
    const deliveries = await prisma.delivery.findMany({
      where: {
        OR: [
          { subscription: { customerId } },
          { adhocRequest: { customerId } },
        ],
        deliveryDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        subscription: {
          include: {
            product: {
              include: {
                pricing: {
                  where: { effectiveTo: null },
                  orderBy: { effectiveFrom: 'desc' },
                  take: 1,
                },
              },
            },
          },
        },
        adhocItem: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { deliveryDate: 'asc' },
    });

    // Get vacations
    const vacations = await prisma.vacation.findMany({
      where: {
        subscription: { customerId },
        OR: [
          {
            startDate: { lte: endDate },
            endDate: { gte: startDate },
          },
        ],
      },
    });

    // Get bill for the month
    const bill = await prisma.bill.findFirst({
      where: {
        customerId,
        billingPeriodStart: startDate,
        billingPeriodEnd: endDate,
      },
      include: {
        payments: true,
      },
    });

    // Calculate summary
    let totalMilkDelivered = 0;
    let totalDeliveries = 0;
    let regularDeliveries = 0;
    let adhocDeliveries = 0;
    let missedDeliveries = 0;
    let regularAmount = 0;
    let adhocAmount = 0;

    const deliveryDetails: Array<{
      date: string;
      product: string;
      quantity: number;
      rate: number;
      amount: number;
      type: string;
      status: string;
    }> = [];

    const productDistribution: Record<string, number> = {};
    const dailyConsumption: Record<string, number> = {};

    for (const delivery of deliveries) {
      const dateStr = format(delivery.deliveryDate, 'yyyy-MM-dd');
      const quantity = Number(delivery.deliveredQuantity || delivery.scheduledQuantity);

      let product: any;
      let rate = 0;

      if (delivery.deliveryType === DeliveryType.REGULAR) {
        product = delivery.subscription?.product;
        rate = product?.pricing[0] ? Number(product.pricing[0].pricePerUnit) : 0;

        if (delivery.status === DeliveryStatus.DELIVERED || delivery.status === DeliveryStatus.PARTIAL) {
          regularDeliveries++;
          totalMilkDelivered += quantity;
          regularAmount += quantity * rate;
        } else if (delivery.status === DeliveryStatus.MISSED) {
          missedDeliveries++;
        }
      } else {
        product = delivery.adhocItem?.product;
        rate = delivery.adhocItem ? Number(delivery.adhocItem.unitPrice) : 0;

        if (delivery.status === DeliveryStatus.DELIVERED || delivery.status === DeliveryStatus.PARTIAL) {
          adhocDeliveries++;
          totalMilkDelivered += quantity;
          adhocAmount += quantity * rate;
        }
      }

      totalDeliveries++;

      // Track for analytics
      if (product) {
        productDistribution[product.name] = (productDistribution[product.name] || 0) + quantity;
      }
      dailyConsumption[dateStr] = (dailyConsumption[dateStr] || 0) + quantity;

      deliveryDetails.push({
        date: dateStr,
        product: product?.name || 'Unknown',
        quantity,
        rate,
        amount: quantity * rate,
        type: delivery.deliveryType,
        status: delivery.status,
      });
    }

    // Calculate vacation savings (estimated)
    const vacationDays = vacations.reduce((sum, v) => {
      const start = v.startDate > startDate ? v.startDate : startDate;
      const end = v.endDate < endDate ? v.endDate : endDate;
      return sum + Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    }, 0);

    // Calculate missed delivery credits (estimated)
    const avgDailyRate = regularDeliveries > 0 ? regularAmount / regularDeliveries : 0;
    const missedCredits = missedDeliveries * avgDailyRate;
    const vacationCredits = vacationDays * avgDailyRate;

    // Payment status
    const totalPaid = bill?.payments
      .filter((p) => p.status === PaymentStatus.SUCCESS)
      .reduce((sum, p) => sum + Number(p.amount), 0) || 0;

    const totalAmount = regularAmount + adhocAmount;
    const netPayable = totalAmount - missedCredits;

    return {
      summary: {
        period: { start: format(startDate, 'yyyy-MM-dd'), end: format(endDate, 'yyyy-MM-dd') },
        totalMilkDelivered,
        totalDeliveries,
        regularDeliveries,
        adhocDeliveries,
        vacationDays,
        missedDeliveries,
        totalAmount,
        regularAmount,
        adhocAmount,
        creditsApplied: missedCredits + vacationCredits,
        netPayable,
        paymentStatus: bill?.status || 'PENDING',
        totalPaid,
      },
      deliveries: deliveryDetails,
      analytics: {
        dailyConsumption: Object.entries(dailyConsumption).map(([date, quantity]) => ({
          date,
          quantity,
        })),
        productDistribution: Object.entries(productDistribution).map(([name, quantity]) => ({
          name,
          quantity,
        })),
      },
    };
  }
}

export default new BillingService();
