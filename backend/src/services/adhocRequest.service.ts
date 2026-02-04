import { Prisma, AdhocRequestStatus, AdhocItemStatus } from '@prisma/client';
import prisma from '../config/database.js';
import { NotFoundError, BadRequestError, ForbiddenError } from '../utils/errors.js';
import {
  CreateAdhocRequestInput,
  ReviewAdhocRequestInput,
  PaginationInput,
} from '../utils/validators.js';
import {
  generateAdhocRequestNumber,
  isValidAdhocDate,
} from '../utils/dateHelpers.js';
import { addDays, startOfDay, isBefore, format, addHours } from 'date-fns';

export class AdhocRequestService {
  private async getSystemSettings() {
    const settings = await prisma.systemSettings.findMany({
      where: {
        key: {
          in: [
            'adhoc_min_advance_days',
            'adhoc_max_advance_days',
            'adhoc_default_capacity',
            'adhoc_cancel_before_hours',
          ],
        },
      },
    });

    const settingsMap: Record<string, any> = {};
    settings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    return {
      minAdvanceDays: (settingsMap['adhoc_min_advance_days'] as any)?.days || 1,
      maxAdvanceDays: (settingsMap['adhoc_max_advance_days'] as any)?.days || 30,
      defaultCapacity: (settingsMap['adhoc_default_capacity'] as any)?.capacity || 50,
      cancelBeforeHours: (settingsMap['adhoc_cancel_before_hours'] as any)?.hours || 12,
    };
  }

  /**
   * Create a new adhoc request
   */
  async create(customerId: string, data: CreateAdhocRequestInput) {
    const settings = await this.getSystemSettings();

    // Verify customer exists
    const customer = await prisma.customerProfile.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundError('Customer not found');
    }

    // Verify address belongs to customer
    const address = await prisma.address.findFirst({
      where: {
        id: data.addressId,
        customerId,
        isActive: true,
      },
    });

    if (!address) {
      throw new NotFoundError('Address not found');
    }

    // Validate each item
    let totalEstimatedCost = 0;
    const validatedItems: Array<{
      productId: string;
      requestedDate: Date;
      quantity: number;
      unitPrice: number;
      estimatedCost: number;
    }> = [];

    for (const item of data.items) {
      // Validate date
      const requestedDate = new Date(item.requestedDate);
      const dateValidation = isValidAdhocDate(
        requestedDate,
        settings.minAdvanceDays,
        settings.maxAdvanceDays
      );

      if (!dateValidation.valid) {
        throw new BadRequestError(
          `Invalid date ${item.requestedDate}: ${dateValidation.reason}`
        );
      }

      // Check if date is blocked
      const capacity = await prisma.adhocCapacity.findUnique({
        where: { date: startOfDay(requestedDate) },
      });

      if (capacity?.isBlocked) {
        throw new BadRequestError(
          `Date ${item.requestedDate} is blocked for adhoc requests: ${capacity.blockReason || 'No reason provided'}`
        );
      }

      // Verify product and get current price
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        include: {
          pricing: {
            where: {
              effectiveTo: null,
            },
            orderBy: {
              effectiveFrom: 'desc',
            },
            take: 1,
          },
        },
      });

      if (!product || !product.isActive) {
        throw new NotFoundError(`Product ${item.productId} not found or inactive`);
      }

      if (product.pricing.length === 0) {
        throw new BadRequestError(`No pricing found for product ${product.name}`);
      }

      const unitPrice = Number(product.pricing[0].pricePerUnit);
      const estimatedCost = unitPrice * item.quantity;
      totalEstimatedCost += estimatedCost;

      validatedItems.push({
        productId: item.productId,
        requestedDate: startOfDay(requestedDate),
        quantity: item.quantity,
        unitPrice,
        estimatedCost,
      });
    }

    // Create adhoc request with items
    const request = await prisma.adhocRequest.create({
      data: {
        customerId,
        addressId: data.addressId,
        requestNumber: generateAdhocRequestNumber(),
        status: AdhocRequestStatus.PENDING,
        totalEstimatedCost,
        notes: data.notes,
        items: {
          create: validatedItems.map((item) => ({
            productId: item.productId,
            requestedDate: item.requestedDate,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            estimatedCost: item.estimatedCost,
            status: AdhocItemStatus.PENDING,
          })),
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        address: true,
      },
    });

    return request;
  }

  /**
   * Get adhoc request by ID
   */
  async getById(requestId: string, customerId?: string) {
    const request = await prisma.adhocRequest.findUnique({
      where: { id: requestId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        address: true,
        customer: {
          include: {
            user: {
              select: {
                email: true,
                phone: true,
              },
            },
          },
        },
        reviewedByUser: {
          select: {
            email: true,
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundError('Adhoc request not found');
    }

    // If customerId provided, verify ownership
    if (customerId && request.customerId !== customerId) {
      throw new ForbiddenError('Access denied');
    }

    return request;
  }

  /**
   * Get all adhoc requests for a customer
   */
  async getByCustomer(
    customerId: string,
    pagination: PaginationInput,
    status?: AdhocRequestStatus
  ) {
    const { page, limit, sortBy, sortOrder } = pagination;
    const skip = (page - 1) * limit;

    const where: Prisma.AdhocRequestWhereInput = { customerId };
    if (status) {
      where.status = status;
    }

    const [requests, total] = await Promise.all([
      prisma.adhocRequest.findMany({
        where,
        include: {
          items: {
            include: {
              product: true,
            },
          },
          address: true,
        },
        skip,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
      }),
      prisma.adhocRequest.count({ where }),
    ]);

    return {
      requests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Cancel adhoc request (Customer)
   */
  async cancel(requestId: string, customerId: string) {
    const request = await this.getById(requestId, customerId);
    const settings = await this.getSystemSettings();

    if (request.status !== AdhocRequestStatus.PENDING) {
      // For approved requests, check time constraint
      if (request.status === AdhocRequestStatus.APPROVED) {
        // Find earliest delivery date
        const earliestDate = request.items
          .filter((i) => i.status === AdhocItemStatus.APPROVED)
          .map((i) => new Date(i.requestedDate))
          .sort((a, b) => a.getTime() - b.getTime())[0];

        if (earliestDate) {
          const cancelDeadline = addHours(earliestDate, -settings.cancelBeforeHours);
          if (isBefore(new Date(), cancelDeadline) === false) {
            throw new BadRequestError(
              `Cannot cancel approved request less than ${settings.cancelBeforeHours} hours before delivery`
            );
          }
        }
      } else {
        throw new BadRequestError('Only pending or approved requests can be cancelled');
      }
    }

    const updated = await prisma.adhocRequest.update({
      where: { id: requestId },
      data: {
        status: AdhocRequestStatus.CANCELLED,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    return updated;
  }

  /**
   * Update pending adhoc request (Customer)
   */
  async update(requestId: string, customerId: string, data: CreateAdhocRequestInput) {
    const existingRequest = await this.getById(requestId, customerId);

    if (existingRequest.status !== AdhocRequestStatus.PENDING) {
      throw new BadRequestError('Only pending requests can be modified');
    }

    // Delete existing items and recreate
    await prisma.adhocRequestItem.deleteMany({
      where: { adhocRequestId: requestId },
    });

    // Create new validated items (similar to create logic)
    const settings = await this.getSystemSettings();
    let totalEstimatedCost = 0;
    const validatedItems: Array<{
      productId: string;
      requestedDate: Date;
      quantity: number;
      unitPrice: number;
      estimatedCost: number;
    }> = [];

    for (const item of data.items) {
      const requestedDate = new Date(item.requestedDate);
      const dateValidation = isValidAdhocDate(
        requestedDate,
        settings.minAdvanceDays,
        settings.maxAdvanceDays
      );

      if (!dateValidation.valid) {
        throw new BadRequestError(
          `Invalid date ${item.requestedDate}: ${dateValidation.reason}`
        );
      }

      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        include: {
          pricing: {
            where: { effectiveTo: null },
            orderBy: { effectiveFrom: 'desc' },
            take: 1,
          },
        },
      });

      if (!product || !product.isActive || product.pricing.length === 0) {
        throw new NotFoundError(`Product ${item.productId} not found or has no pricing`);
      }

      const unitPrice = Number(product.pricing[0].pricePerUnit);
      const estimatedCost = unitPrice * item.quantity;
      totalEstimatedCost += estimatedCost;

      validatedItems.push({
        productId: item.productId,
        requestedDate: startOfDay(requestedDate),
        quantity: item.quantity,
        unitPrice,
        estimatedCost,
      });
    }

    // Update request with new items
    const updated = await prisma.adhocRequest.update({
      where: { id: requestId },
      data: {
        addressId: data.addressId,
        totalEstimatedCost,
        notes: data.notes,
        items: {
          create: validatedItems.map((item) => ({
            productId: item.productId,
            requestedDate: item.requestedDate,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            estimatedCost: item.estimatedCost,
            status: AdhocItemStatus.PENDING,
          })),
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        address: true,
      },
    });

    return updated;
  }

  /**
   * Get all adhoc requests (Admin)
   */
  async getAll(
    pagination: PaginationInput,
    filters?: {
      status?: AdhocRequestStatus;
      customerId?: string;
      startDate?: string;
      endDate?: string;
    }
  ) {
    const { page, limit, sortBy, sortOrder } = pagination;
    const skip = (page - 1) * limit;

    const where: Prisma.AdhocRequestWhereInput = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.customerId) {
      where.customerId = filters.customerId;
    }

    if (filters?.startDate || filters?.endDate) {
      where.items = {
        some: {
          requestedDate: {
            ...(filters.startDate && { gte: new Date(filters.startDate) }),
            ...(filters.endDate && { lte: new Date(filters.endDate) }),
          },
        },
      };
    }

    const [requests, total] = await Promise.all([
      prisma.adhocRequest.findMany({
        where,
        include: {
          items: {
            include: {
              product: true,
            },
          },
          address: true,
          customer: {
            include: {
              user: {
                select: {
                  email: true,
                  phone: true,
                },
              },
            },
          },
        },
        skip,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
      }),
      prisma.adhocRequest.count({ where }),
    ]);

    return {
      requests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Review adhoc request (Admin)
   */
  async review(requestId: string, adminUserId: string, data: ReviewAdhocRequestInput) {
    const request = await this.getById(requestId);

    if (request.status !== AdhocRequestStatus.PENDING) {
      throw new BadRequestError('Only pending requests can be reviewed');
    }

    const settings = await this.getSystemSettings();

    if (data.action === 'approve') {
      // Approve all items
      await prisma.adhocRequestItem.updateMany({
        where: { adhocRequestId: requestId },
        data: { status: AdhocItemStatus.APPROVED },
      });

      // Update capacity for each date
      for (const item of request.items) {
        await this.updateCapacity(new Date(item.requestedDate), 1);
      }

      const updated = await prisma.adhocRequest.update({
        where: { id: requestId },
        data: {
          status: AdhocRequestStatus.APPROVED,
          adminNotes: data.adminNotes,
          reviewedBy: adminUserId,
          reviewedAt: new Date(),
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      // Create deliveries for approved items
      await this.createDeliveriesForApprovedItems(updated);

      return updated;
    } else if (data.action === 'reject') {
      // Reject all items
      await prisma.adhocRequestItem.updateMany({
        where: { adhocRequestId: requestId },
        data: {
          status: AdhocItemStatus.REJECTED,
          rejectionReason: data.adminNotes || 'Request rejected by admin',
        },
      });

      const updated = await prisma.adhocRequest.update({
        where: { id: requestId },
        data: {
          status: AdhocRequestStatus.REJECTED,
          adminNotes: data.adminNotes,
          reviewedBy: adminUserId,
          reviewedAt: new Date(),
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      return updated;
    } else if (data.action === 'partial' && data.itemDecisions) {
      // Partial approval
      for (const decision of data.itemDecisions) {
        await prisma.adhocRequestItem.update({
          where: { id: decision.itemId },
          data: {
            status: decision.approved ? AdhocItemStatus.APPROVED : AdhocItemStatus.REJECTED,
            rejectionReason: decision.approved ? null : decision.rejectionReason,
          },
        });

        if (decision.approved) {
          const item = request.items.find((i) => i.id === decision.itemId);
          if (item) {
            await this.updateCapacity(new Date(item.requestedDate), 1);
          }
        }
      }

      const approvedCount = data.itemDecisions.filter((d) => d.approved).length;
      const status =
        approvedCount === 0
          ? AdhocRequestStatus.REJECTED
          : approvedCount === data.itemDecisions.length
          ? AdhocRequestStatus.APPROVED
          : AdhocRequestStatus.PARTIALLY_APPROVED;

      const updated = await prisma.adhocRequest.update({
        where: { id: requestId },
        data: {
          status,
          adminNotes: data.adminNotes,
          reviewedBy: adminUserId,
          reviewedAt: new Date(),
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      // Create deliveries for approved items
      await this.createDeliveriesForApprovedItems(updated);

      return updated;
    }

    throw new BadRequestError('Invalid review action');
  }

  /**
   * Update capacity for a date
   */
  private async updateCapacity(date: Date, increment: number) {
    const normalizedDate = startOfDay(date);

    await prisma.adhocCapacity.upsert({
      where: { date: normalizedDate },
      update: {
        currentApproved: {
          increment,
        },
      },
      create: {
        date: normalizedDate,
        currentApproved: increment,
      },
    });
  }

  /**
   * Create deliveries for approved adhoc items
   */
  private async createDeliveriesForApprovedItems(request: any) {
    const approvedItems = request.items.filter(
      (i: any) => i.status === AdhocItemStatus.APPROVED
    );

    for (const item of approvedItems) {
      await prisma.delivery.create({
        data: {
          adhocRequestId: request.id,
          adhocItemId: item.id,
          deliveryType: 'ADHOC',
          deliveryDate: new Date(item.requestedDate),
          scheduledQuantity: item.quantity,
          status: 'SCHEDULED',
        },
      });
    }
  }

  /**
   * Get capacity for a date range
   */
  async getCapacity(startDate: string, endDate: string) {
    const settings = await this.getSystemSettings();

    const capacities = await prisma.adhocCapacity.findMany({
      where: {
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      orderBy: { date: 'asc' },
    });

    // Create a map for easy lookup
    const capacityMap = new Map(
      capacities.map((c) => [format(c.date, 'yyyy-MM-dd'), c])
    );

    // Generate dates in range with capacity info
    const result: Array<{
      date: string;
      maxCapacity: number;
      currentApproved: number;
      available: number;
      isBlocked: boolean;
      blockReason: string | null;
    }> = [];

    let current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {
      const dateStr = format(current, 'yyyy-MM-dd');
      const capacity = capacityMap.get(dateStr);

      const maxCapacity = capacity?.maxAdhocRequests || settings.defaultCapacity;
      const currentApproved = capacity?.currentApproved || 0;

      result.push({
        date: dateStr,
        maxCapacity,
        currentApproved,
        available: Math.max(0, maxCapacity - currentApproved),
        isBlocked: capacity?.isBlocked || false,
        blockReason: capacity?.blockReason || null,
      });

      current = addDays(current, 1);
    }

    return result;
  }

  /**
   * Update capacity settings for a date (Admin)
   */
  async updateCapacitySettings(
    date: string,
    settings: { maxAdhocRequests?: number; isBlocked?: boolean; blockReason?: string }
  ) {
    const normalizedDate = startOfDay(new Date(date));

    const updated = await prisma.adhocCapacity.upsert({
      where: { date: normalizedDate },
      update: settings,
      create: {
        date: normalizedDate,
        ...settings,
      },
    });

    return updated;
  }

  /**
   * Get adhoc request analytics (Admin)
   */
  async getAnalytics(startDate: string, endDate: string) {
    const requests = await prisma.adhocRequest.findMany({
      where: {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
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

    const totalRequests = requests.length;
    const statusCounts: Record<string, number> = {};
    const productCounts: Record<string, number> = {};
    let totalRevenue = 0;
    let approvedCount = 0;

    for (const request of requests) {
      statusCounts[request.status] = (statusCounts[request.status] || 0) + 1;

      if (
        request.status === AdhocRequestStatus.APPROVED ||
        request.status === AdhocRequestStatus.PARTIALLY_APPROVED
      ) {
        for (const item of request.items) {
          if (item.status === AdhocItemStatus.APPROVED) {
            approvedCount++;
            totalRevenue += Number(item.estimatedCost);
            productCounts[item.product.name] =
              (productCounts[item.product.name] || 0) + 1;
          }
        }
      }
    }

    return {
      totalRequests,
      statusCounts,
      approvalRate:
        totalRequests > 0
          ? ((statusCounts[AdhocRequestStatus.APPROVED] || 0) / totalRequests) * 100
          : 0,
      totalApprovedItems: approvedCount,
      totalRevenue,
      topProducts: Object.entries(productCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, count })),
    };
  }
}

export default new AdhocRequestService();
