import { Prisma, SubscriptionStatus, SubscriptionFrequency } from '@prisma/client';
import prisma from '../config/database.js';
import { NotFoundError, BadRequestError, ForbiddenError } from '../utils/errors.js';
import {
  CreateSubscriptionInput,
  UpdateSubscriptionInput,
  PaginationInput,
} from '../utils/validators.js';
import { addDays, isBefore, startOfDay, format } from 'date-fns';

export class SubscriptionService {
  /**
   * Create a new subscription
   */
  async create(customerId: string, data: CreateSubscriptionInput) {
    // Verify customer exists
    const customer = await prisma.customerProfile.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundError('Customer not found');
    }

    // Verify product exists and is active
    const product = await prisma.product.findUnique({
      where: { id: data.productId },
    });

    if (!product || !product.isActive) {
      throw new NotFoundError('Product not found or inactive');
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

    // Validate start date (must be at least tomorrow)
    const startDate = new Date(data.startDate);
    const minStartDate = addDays(startOfDay(new Date()), 1);

    if (isBefore(startDate, minStartDate)) {
      throw new BadRequestError('Start date must be at least tomorrow');
    }

    // Validate custom days if frequency is CUSTOM
    if (data.frequency === 'CUSTOM' && (!data.customDays || data.customDays.length === 0)) {
      throw new BadRequestError('Custom days are required for custom frequency');
    }

    // Create subscription
    const subscription = await prisma.subscription.create({
      data: {
        customerId,
        productId: data.productId,
        addressId: data.addressId,
        quantity: data.quantity,
        frequency: data.frequency as SubscriptionFrequency,
        customDays: data.customDays || null,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        status: SubscriptionStatus.ACTIVE,
      },
      include: {
        product: true,
        address: true,
      },
    });

    // Create subscription history
    await prisma.subscriptionHistory.create({
      data: {
        subscriptionId: subscription.id,
        changeType: 'CREATED',
        newValues: {
          productId: data.productId,
          quantity: data.quantity,
          frequency: data.frequency,
          customDays: data.customDays,
          startDate: data.startDate,
        },
        changedBy: customer.userId,
      },
    });

    return subscription;
  }

  /**
   * Get subscription by ID
   */
  async getById(subscriptionId: string, customerId?: string) {
    const whereClause: Prisma.SubscriptionWhereUniqueInput = {
      id: subscriptionId,
    };

    const subscription = await prisma.subscription.findUnique({
      where: whereClause,
      include: {
        product: {
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
        },
        address: true,
        vacations: {
          orderBy: { startDate: 'asc' },
        },
        history: {
          orderBy: { changedAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!subscription) {
      throw new NotFoundError('Subscription not found');
    }

    // If customerId provided, verify ownership
    if (customerId && subscription.customerId !== customerId) {
      throw new ForbiddenError('Access denied');
    }

    return subscription;
  }

  /**
   * Get all subscriptions for a customer
   */
  async getByCustomer(customerId: string, pagination: PaginationInput) {
    const { page, limit, sortBy, sortOrder } = pagination;
    const skip = (page - 1) * limit;

    const [subscriptions, total] = await Promise.all([
      prisma.subscription.findMany({
        where: { customerId },
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
          address: true,
        },
        skip,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
      }),
      prisma.subscription.count({ where: { customerId } }),
    ]);

    return {
      subscriptions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update subscription
   */
  async update(subscriptionId: string, customerId: string, data: UpdateSubscriptionInput) {
    const subscription = await this.getById(subscriptionId, customerId);

    // Cannot modify cancelled or expired subscriptions
    if (subscription.status === 'CANCELLED' || subscription.status === 'EXPIRED') {
      throw new BadRequestError('Cannot modify cancelled or expired subscription');
    }

    const previousValues = {
      productId: subscription.productId,
      quantity: Number(subscription.quantity),
      frequency: subscription.frequency,
      customDays: subscription.customDays,
    };

    // Validate custom days if frequency is changing to CUSTOM
    if (data.frequency === 'CUSTOM' && (!data.customDays || data.customDays.length === 0)) {
      throw new BadRequestError('Custom days are required for custom frequency');
    }

    // Update subscription
    const updated = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        ...(data.productId && { productId: data.productId }),
        ...(data.quantity && { quantity: data.quantity }),
        ...(data.frequency && { frequency: data.frequency as SubscriptionFrequency }),
        ...(data.customDays && { customDays: data.customDays }),
      },
      include: {
        product: true,
        address: true,
      },
    });

    // Get customer profile for history
    const customer = await prisma.customerProfile.findUnique({
      where: { id: customerId },
    });

    // Create subscription history
    await prisma.subscriptionHistory.create({
      data: {
        subscriptionId,
        changeType: 'MODIFIED',
        previousValues,
        newValues: data,
        changedBy: customer?.userId || customerId,
      },
    });

    return updated;
  }

  /**
   * Pause subscription
   */
  async pause(subscriptionId: string, customerId: string, pauseStartDate: string, pauseEndDate: string) {
    const subscription = await this.getById(subscriptionId, customerId);

    if (subscription.status !== 'ACTIVE') {
      throw new BadRequestError('Only active subscriptions can be paused');
    }

    const start = new Date(pauseStartDate);
    const end = new Date(pauseEndDate);

    // Validate dates
    if (isBefore(start, startOfDay(new Date()))) {
      throw new BadRequestError('Pause start date cannot be in the past');
    }

    if (isBefore(end, start)) {
      throw new BadRequestError('Pause end date must be after start date');
    }

    // Max pause duration: 30 days
    const maxPauseDays = 30;
    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays > maxPauseDays) {
      throw new BadRequestError(`Maximum pause duration is ${maxPauseDays} days`);
    }

    const updated = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: SubscriptionStatus.PAUSED,
        pauseStartDate: start,
        pauseEndDate: end,
      },
      include: {
        product: true,
        address: true,
      },
    });

    // Get customer profile for history
    const customer = await prisma.customerProfile.findUnique({
      where: { id: customerId },
    });

    // Create subscription history
    await prisma.subscriptionHistory.create({
      data: {
        subscriptionId,
        changeType: 'PAUSED',
        newValues: { pauseStartDate, pauseEndDate },
        changedBy: customer?.userId || customerId,
      },
    });

    return updated;
  }

  /**
   * Resume subscription
   */
  async resume(subscriptionId: string, customerId: string) {
    const subscription = await this.getById(subscriptionId, customerId);

    if (subscription.status !== 'PAUSED') {
      throw new BadRequestError('Only paused subscriptions can be resumed');
    }

    const updated = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: SubscriptionStatus.ACTIVE,
        pauseStartDate: null,
        pauseEndDate: null,
      },
      include: {
        product: true,
        address: true,
      },
    });

    // Get customer profile for history
    const customer = await prisma.customerProfile.findUnique({
      where: { id: customerId },
    });

    // Create subscription history
    await prisma.subscriptionHistory.create({
      data: {
        subscriptionId,
        changeType: 'RESUMED',
        changedBy: customer?.userId || customerId,
      },
    });

    return updated;
  }

  /**
   * Cancel subscription
   */
  async cancel(subscriptionId: string, customerId: string, reason?: string) {
    const subscription = await this.getById(subscriptionId, customerId);

    if (subscription.status === 'CANCELLED') {
      throw new BadRequestError('Subscription is already cancelled');
    }

    const updated = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: SubscriptionStatus.CANCELLED,
        cancellationReason: reason,
        cancelledAt: new Date(),
      },
      include: {
        product: true,
        address: true,
      },
    });

    // Get customer profile for history
    const customer = await prisma.customerProfile.findUnique({
      where: { id: customerId },
    });

    // Create subscription history
    await prisma.subscriptionHistory.create({
      data: {
        subscriptionId,
        changeType: 'CANCELLED',
        newValues: { reason },
        changedBy: customer?.userId || customerId,
      },
    });

    return updated;
  }

  /**
   * Get all subscriptions (Admin)
   */
  async getAll(pagination: PaginationInput, filters?: {
    status?: SubscriptionStatus;
    productId?: string;
    frequency?: SubscriptionFrequency;
  }) {
    const { page, limit, sortBy, sortOrder } = pagination;
    const skip = (page - 1) * limit;

    const where: Prisma.SubscriptionWhereInput = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.productId) {
      where.productId = filters.productId;
    }

    if (filters?.frequency) {
      where.frequency = filters.frequency;
    }

    const [subscriptions, total] = await Promise.all([
      prisma.subscription.findMany({
        where,
        include: {
          product: true,
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
      prisma.subscription.count({ where }),
    ]);

    return {
      subscriptions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

export default new SubscriptionService();
