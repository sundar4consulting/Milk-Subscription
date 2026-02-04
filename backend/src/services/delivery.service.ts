import { Prisma, DeliveryStatus, DeliveryType } from '@prisma/client';
import prisma from '../config/database.js';
import { NotFoundError, BadRequestError, ForbiddenError } from '../utils/errors.js';
import { PaginationInput } from '../utils/validators.js';
import {
  startOfMonth,
  endOfMonth,
  startOfDay,
  endOfDay,
  format,
  parseISO,
  eachDayOfInterval,
} from 'date-fns';
import { calculateScheduledDeliveries } from '../utils/dateHelpers.js';

export class DeliveryService {
  /**
   * Get delivery by ID
   */
  async getById(deliveryId: string, customerId?: string) {
    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: {
        subscription: {
          include: {
            product: true,
            customer: true,
          },
        },
        adhocRequest: {
          include: {
            customer: true,
          },
        },
        adhocItem: {
          include: {
            product: true,
          },
        },
        deliveryPerson: {
          select: {
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!delivery) {
      throw new NotFoundError('Delivery not found');
    }

    // Verify ownership if customerId provided
    if (customerId) {
      const isOwner =
        delivery.subscription?.customerId === customerId ||
        delivery.adhocRequest?.customerId === customerId;

      if (!isOwner) {
        throw new ForbiddenError('Access denied');
      }
    }

    return delivery;
  }

  /**
   * Get customer deliveries
   */
  async getCustomerDeliveries(
    customerId: string,
    pagination: PaginationInput,
    filters?: {
      startDate?: string;
      endDate?: string;
      status?: DeliveryStatus;
      type?: DeliveryType;
    }
  ) {
    const { page, limit, sortBy, sortOrder } = pagination;
    const skip = (page - 1) * limit;

    // Get customer's subscription IDs
    const subscriptions = await prisma.subscription.findMany({
      where: { customerId },
      select: { id: true },
    });

    // Get customer's adhoc request IDs
    const adhocRequests = await prisma.adhocRequest.findMany({
      where: { customerId },
      select: { id: true },
    });

    const subscriptionIds = subscriptions.map((s) => s.id);
    const adhocRequestIds = adhocRequests.map((a) => a.id);

    const where: Prisma.DeliveryWhereInput = {
      OR: [
        { subscriptionId: { in: subscriptionIds } },
        { adhocRequestId: { in: adhocRequestIds } },
      ],
    };

    if (filters?.startDate) {
      where.deliveryDate = {
        ...((where.deliveryDate as any) || {}),
        gte: startOfDay(parseISO(filters.startDate)),
      };
    }

    if (filters?.endDate) {
      where.deliveryDate = {
        ...((where.deliveryDate as any) || {}),
        lte: endOfDay(parseISO(filters.endDate)),
      };
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.type) {
      where.deliveryType = filters.type;
    }

    const [deliveries, total] = await Promise.all([
      prisma.delivery.findMany({
        where,
        include: {
          subscription: {
            include: {
              product: true,
            },
          },
          adhocItem: {
            include: {
              product: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { deliveryDate: 'desc' },
      }),
      prisma.delivery.count({ where }),
    ]);

    return {
      deliveries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Report delivery issue (Customer)
   */
  async reportIssue(deliveryId: string, customerId: string, issueDescription: string) {
    const delivery = await this.getById(deliveryId, customerId);

    if (delivery.status !== DeliveryStatus.DELIVERED && delivery.status !== DeliveryStatus.PARTIAL) {
      throw new BadRequestError('Can only report issues for delivered items');
    }

    const updated = await prisma.delivery.update({
      where: { id: deliveryId },
      data: {
        issueReported: true,
        issueDescription,
      },
    });

    return updated;
  }

  /**
   * Get all deliveries (Admin)
   */
  async getAll(
    pagination: PaginationInput,
    filters?: {
      date?: string;
      startDate?: string;
      endDate?: string;
      status?: DeliveryStatus;
      type?: DeliveryType;
      deliveryPersonId?: string;
    }
  ) {
    const { page, limit, sortBy, sortOrder } = pagination;
    const skip = (page - 1) * limit;

    const where: Prisma.DeliveryWhereInput = {};

    if (filters?.date) {
      const date = parseISO(filters.date);
      where.deliveryDate = {
        gte: startOfDay(date),
        lte: endOfDay(date),
      };
    } else {
      if (filters?.startDate) {
        where.deliveryDate = {
          ...((where.deliveryDate as any) || {}),
          gte: startOfDay(parseISO(filters.startDate)),
        };
      }
      if (filters?.endDate) {
        where.deliveryDate = {
          ...((where.deliveryDate as any) || {}),
          lte: endOfDay(parseISO(filters.endDate)),
        };
      }
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.type) {
      where.deliveryType = filters.type;
    }

    if (filters?.deliveryPersonId) {
      where.deliveryPersonId = filters.deliveryPersonId;
    }

    const [deliveries, total] = await Promise.all([
      prisma.delivery.findMany({
        where,
        include: {
          subscription: {
            include: {
              product: true,
              customer: {
                include: {
                  user: {
                    select: { email: true, phone: true },
                  },
                },
              },
              address: true,
            },
          },
          adhocRequest: {
            include: {
              customer: {
                include: {
                  user: {
                    select: { email: true, phone: true },
                  },
                },
              },
              address: true,
            },
          },
          adhocItem: {
            include: {
              product: true,
            },
          },
          deliveryPerson: {
            select: { email: true, phone: true },
          },
        },
        skip,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { deliveryDate: 'desc' },
      }),
      prisma.delivery.count({ where }),
    ]);

    return {
      deliveries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get today's delivery schedule (Admin)
   */
  async getTodaySchedule() {
    const today = new Date();

    const deliveries = await prisma.delivery.findMany({
      where: {
        deliveryDate: {
          gte: startOfDay(today),
          lte: endOfDay(today),
        },
      },
      include: {
        subscription: {
          include: {
            product: true,
            customer: {
              include: {
                user: {
                  select: { email: true, phone: true },
                },
              },
            },
            address: true,
          },
        },
        adhocRequest: {
          include: {
            customer: {
              include: {
                user: {
                  select: { email: true, phone: true },
                },
              },
            },
            address: true,
          },
        },
        adhocItem: {
          include: {
            product: true,
          },
        },
        deliveryPerson: {
          select: { email: true, phone: true },
        },
      },
      orderBy: [
        { deliveryType: 'asc' },
        { status: 'asc' },
      ],
    });

    // Calculate summary
    const summary = {
      total: deliveries.length,
      scheduled: deliveries.filter((d) => d.status === DeliveryStatus.SCHEDULED).length,
      delivered: deliveries.filter((d) => d.status === DeliveryStatus.DELIVERED).length,
      partial: deliveries.filter((d) => d.status === DeliveryStatus.PARTIAL).length,
      missed: deliveries.filter((d) => d.status === DeliveryStatus.MISSED).length,
      regular: deliveries.filter((d) => d.deliveryType === DeliveryType.REGULAR).length,
      adhoc: deliveries.filter((d) => d.deliveryType === DeliveryType.ADHOC).length,
    };

    return { deliveries, summary };
  }

  /**
   * Update delivery status (Admin)
   */
  async updateStatus(
    deliveryId: string,
    data: {
      status: DeliveryStatus;
      deliveredQuantity?: number;
      notes?: string;
      deliveryPersonId?: string;
    }
  ) {
    const delivery = await this.getById(deliveryId);

    const updateData: Prisma.DeliveryUpdateInput = {
      status: data.status,
    };

    if (data.deliveredQuantity !== undefined) {
      updateData.deliveredQuantity = data.deliveredQuantity;
    }

    if (data.notes) {
      updateData.notes = data.notes;
    }

    if (data.deliveryPersonId) {
      updateData.deliveryPerson = {
        connect: { id: data.deliveryPersonId },
      };
    }

    if (data.status === DeliveryStatus.DELIVERED || data.status === DeliveryStatus.PARTIAL) {
      updateData.deliveryTime = new Date();
      if (data.deliveredQuantity === undefined) {
        updateData.deliveredQuantity = delivery.scheduledQuantity;
      }
    }

    const updated = await prisma.delivery.update({
      where: { id: deliveryId },
      data: updateData,
      include: {
        subscription: {
          include: {
            product: true,
          },
        },
        adhocItem: {
          include: {
            product: true,
          },
        },
      },
    });

    return updated;
  }

  /**
   * Bulk update delivery status (Admin)
   */
  async bulkUpdateStatus(
    deliveryIds: string[],
    data: {
      status: DeliveryStatus;
      deliveryPersonId?: string;
    }
  ) {
    const updateData: Prisma.DeliveryUpdateInput = {
      status: data.status,
    };

    if (data.deliveryPersonId) {
      updateData.deliveryPerson = {
        connect: { id: data.deliveryPersonId },
      };
    }

    if (data.status === DeliveryStatus.DELIVERED) {
      updateData.deliveryTime = new Date();
    }

    const result = await prisma.delivery.updateMany({
      where: { id: { in: deliveryIds } },
      data: {
        status: data.status,
        ...(data.deliveryPersonId && { deliveryPersonId: data.deliveryPersonId }),
        ...(data.status === DeliveryStatus.DELIVERED && { deliveryTime: new Date() }),
      },
    });

    return { updated: result.count };
  }

  /**
   * Generate delivery schedule for a date range
   * This creates delivery records for active subscriptions
   */
  async generateSchedule(startDate: string, endDate: string) {
    const start = parseISO(startDate);
    const end = parseISO(endDate);

    // Get all active subscriptions
    const subscriptions = await prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        startDate: { lte: end },
        OR: [{ endDate: null }, { endDate: { gte: start } }],
      },
      include: {
        vacations: {
          where: {
            OR: [
              {
                startDate: { lte: end },
                endDate: { gte: start },
              },
            ],
          },
        },
      },
    });

    // Get holidays in range
    const holidays = await prisma.holiday.findMany({
      where: {
        date: {
          gte: start,
          lte: end,
        },
      },
    });

    const holidayDates = holidays.map((h) => h.date);

    let created = 0;
    let skipped = 0;

    for (const subscription of subscriptions) {
      const { actualDeliveryDates } = calculateScheduledDeliveries(
        subscription.startDate,
        subscription.endDate,
        subscription.frequency,
        subscription.customDays as string[] | null,
        start,
        end,
        subscription.vacations.map((v) => ({
          startDate: v.startDate,
          endDate: v.endDate,
        })),
        holidayDates,
        subscription.pauseStartDate,
        subscription.pauseEndDate
      );

      // Get current price for the product
      const pricing = await prisma.productPricing.findFirst({
        where: {
          productId: subscription.productId,
          effectiveTo: null,
        },
        orderBy: { effectiveFrom: 'desc' },
      });

      for (const date of actualDeliveryDates) {
        try {
          await prisma.delivery.create({
            data: {
              subscriptionId: subscription.id,
              deliveryType: DeliveryType.REGULAR,
              deliveryDate: startOfDay(date),
              scheduledQuantity: subscription.quantity,
              status: DeliveryStatus.SCHEDULED,
            },
          });
          created++;
        } catch (error) {
          // Skip if delivery already exists (unique constraint)
          skipped++;
        }
      }
    }

    return { created, skipped };
  }

  /**
   * Get delivery calendar for customer
   */
  async getCustomerCalendar(customerId: string, month: number, year: number) {
    const startDate = startOfMonth(new Date(year, month - 1));
    const endDate = endOfMonth(startDate);

    // Get subscriptions
    const subscriptions = await prisma.subscription.findMany({
      where: { customerId },
      include: {
        product: true,
        vacations: {
          where: {
            OR: [
              {
                startDate: { lte: endDate },
                endDate: { gte: startDate },
              },
            ],
          },
        },
      },
    });

    // Get deliveries
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
          include: { product: true },
        },
        adhocItem: {
          include: { product: true },
        },
      },
    });

    // Get holidays
    const holidays = await prisma.holiday.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Build calendar data
    const calendar: Record<
      string,
      {
        date: string;
        deliveries: any[];
        isVacation: boolean;
        isHoliday: boolean;
        holidayName?: string;
      }
    > = {};

    const allDates = eachDayOfInterval({ start: startDate, end: endDate });

    for (const date of allDates) {
      const dateStr = format(date, 'yyyy-MM-dd');

      const isVacation = subscriptions.some((sub) =>
        sub.vacations.some(
          (v) =>
            date >= startOfDay(v.startDate) && date <= startOfDay(v.endDate)
        )
      );

      const holiday = holidays.find(
        (h) => format(h.date, 'yyyy-MM-dd') === dateStr
      );

      const dayDeliveries = deliveries.filter(
        (d) => format(d.deliveryDate, 'yyyy-MM-dd') === dateStr
      );

      calendar[dateStr] = {
        date: dateStr,
        deliveries: dayDeliveries,
        isVacation,
        isHoliday: !!holiday,
        holidayName: holiday?.name,
      };
    }

    return calendar;
  }
}

export default new DeliveryService();
