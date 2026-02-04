import { Prisma, UserRole, UserStatus } from '@prisma/client';
import prisma from '../config/database.js';
import { NotFoundError, BadRequestError, ForbiddenError } from '../utils/errors.js';
import { PaginationInput, AddressInput } from '../utils/validators.js';

export class CustomerService {
  /**
   * Get customer profile by user ID
   */
  async getProfileByUserId(userId: string) {
    const customer = await prisma.customerProfile.findFirst({
      where: {
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            role: true,
            status: true,
          },
        },
        addresses: {
          where: { isActive: true },
          orderBy: { isDefault: 'desc' },
        },
        wallet: true,
      },
    });

    if (!customer) {
      throw new NotFoundError('Customer profile not found');
    }

    return customer;
  }

  /**
   * Get customer profile by profile ID
   */
  async getProfileById(profileId: string) {
    const customer = await prisma.customerProfile.findUnique({
      where: { id: profileId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            role: true,
            status: true,
          },
        },
        addresses: {
          where: { isActive: true },
          orderBy: { isDefault: 'desc' },
        },
        wallet: true,
        subscriptions: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!customer) {
      throw new NotFoundError('Customer profile not found');
    }

    return customer;
  }

  /**
   * Update customer profile
   */
  async updateProfile(
    userId: string,
    data: { firstName?: string; lastName?: string; phone?: string }
  ) {
    const customer = await this.getProfileByUserId(userId);

    // Update profile
    if (data.firstName || data.lastName) {
      await prisma.customerProfile.update({
        where: { id: customer.id },
        data: {
          ...(data.firstName && { firstName: data.firstName }),
          ...(data.lastName && { lastName: data.lastName }),
        },
      });
    }

    // Update phone if provided
    if (data.phone) {
      await prisma.user.update({
        where: { id: userId },
        data: { phone: data.phone },
      });
    }

    return this.getProfileByUserId(userId);
  }

  /**
   * Get customer addresses
   */
  async getAddresses(customerId: string) {
    const addresses = await prisma.address.findMany({
      where: {
        customerId,
        isActive: true,
      },
      orderBy: { isDefault: 'desc' },
    });

    return addresses;
  }

  /**
   * Add a new address
   */
  async addAddress(customerId: string, data: AddressInput) {
    // If this is the default address, unset other defaults
    if (data.isDefault) {
      await prisma.address.updateMany({
        where: { customerId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.create({
      data: {
        customerId,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        country: data.country,
        latitude: data.latitude,
        longitude: data.longitude,
        isDefault: data.isDefault ?? false,
        isActive: true,
      },
    });

    return address;
  }

  /**
   * Update an address
   */
  async updateAddress(customerId: string, addressId: string, data: Partial<AddressInput>) {
    const address = await prisma.address.findFirst({
      where: { id: addressId, customerId, isActive: true },
    });

    if (!address) {
      throw new NotFoundError('Address not found');
    }

    // If setting as default, unset other defaults
    if (data.isDefault) {
      await prisma.address.updateMany({
        where: { customerId, isDefault: true, id: { not: addressId } },
        data: { isDefault: false },
      });
    }

    const updated = await prisma.address.update({
      where: { id: addressId },
      data: {
        ...(data.addressLine1 && { addressLine1: data.addressLine1 }),
        ...(data.addressLine2 !== undefined && { addressLine2: data.addressLine2 }),
        ...(data.city && { city: data.city }),
        ...(data.state && { state: data.state }),
        ...(data.postalCode && { postalCode: data.postalCode }),
        ...(data.country && { country: data.country }),
        ...(data.latitude !== undefined && { latitude: data.latitude }),
        ...(data.longitude !== undefined && { longitude: data.longitude }),
        ...(data.isDefault !== undefined && { isDefault: data.isDefault }),
      },
    });

    return updated;
  }

  /**
   * Delete an address (soft delete)
   */
  async deleteAddress(customerId: string, addressId: string) {
    const address = await prisma.address.findFirst({
      where: { id: addressId, customerId, isActive: true },
    });

    if (!address) {
      throw new NotFoundError('Address not found');
    }

    // Check if address is used in active subscriptions
    const activeSubscriptions = await prisma.subscription.count({
      where: {
        addressId,
        status: 'ACTIVE',
      },
    });

    if (activeSubscriptions > 0) {
      throw new BadRequestError(
        'Cannot delete address used in active subscriptions'
      );
    }

    await prisma.address.update({
      where: { id: addressId },
      data: { isActive: false },
    });

    return { message: 'Address deleted successfully' };
  }

  /**
   * Get all customers (Admin)
   */
  async getAllCustomers(
    pagination: PaginationInput,
    filters?: {
      status?: UserStatus;
      search?: string;
    }
  ) {
    const { page, limit, sortBy, sortOrder } = pagination;
    const skip = (page - 1) * limit;

    const where: Prisma.CustomerProfileWhereInput = {};

    if (filters?.status) {
      where.user = {
        status: filters.status,
      };
    }

    if (filters?.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { user: { email: { contains: filters.search, mode: 'insensitive' } } },
        { user: { phone: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }

    const [customers, total] = await Promise.all([
      prisma.customerProfile.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              phone: true,
              role: true,
              status: true,
              createdAt: true,
            },
          },
          addresses: {
            where: { isActive: true, isDefault: true },
            take: 1,
          },
          subscriptions: {
            where: { status: 'ACTIVE' },
            include: { product: true },
          },
          _count: {
            select: {
              subscriptions: true,
              bills: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: sortBy
          ? sortBy === 'email'
            ? { user: { email: sortOrder } }
            : { [sortBy]: sortOrder }
          : { createdAt: 'desc' },
      }),
      prisma.customerProfile.count({ where }),
    ]);

    return {
      customers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update customer status (Admin)
   */
  async updateCustomerStatus(profileId: string, status: UserStatus) {
    const customer = await this.getProfileById(profileId);

    await prisma.user.update({
      where: { id: customer.userId },
      data: { status },
    });

    return this.getProfileById(profileId);
  }

  /**
   * Get customer wallet
   */
  async getWallet(customerId: string) {
    const wallet = await prisma.customerWallet.findUnique({
      where: { customerId },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!wallet) {
      // Create wallet if doesn't exist
      const newWallet = await prisma.customerWallet.create({
        data: {
          customerId,
          balance: 0,
        },
        include: {
          transactions: true,
        },
      });
      return newWallet;
    }

    return wallet;
  }

  /**
   * Get wallet transactions
   */
  async getWalletTransactions(customerId: string, pagination: PaginationInput) {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const wallet = await prisma.customerWallet.findUnique({
      where: { customerId },
    });

    if (!wallet) {
      return {
        transactions: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
      };
    }

    const [transactions, total] = await Promise.all([
      prisma.walletTransaction.findMany({
        where: { walletId: wallet.id },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.walletTransaction.count({ where: { walletId: wallet.id } }),
    ]);

    return {
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Add credit to wallet (Admin)
   */
  async addWalletCredit(
    customerId: string,
    amount: number,
    referenceType: string,
    description: string
  ) {
    let wallet = await prisma.customerWallet.findUnique({
      where: { customerId },
    });

    if (!wallet) {
      wallet = await prisma.customerWallet.create({
        data: { customerId, balance: 0 },
      });
    }

    const [updatedWallet] = await prisma.$transaction([
      prisma.customerWallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: amount } },
      }),
      prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'CREDIT',
          amount,
          referenceType: referenceType as any,
          description,
        },
      }),
    ]);

    return updatedWallet;
  }
}

export default new CustomerService();
