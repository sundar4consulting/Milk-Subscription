import { Prisma } from '@prisma/client';
import prisma from '../config/database.js';
import { NotFoundError, BadRequestError } from '../utils/errors.js';
import { PaginationInput, ProductInput } from '../utils/validators.js';

export class ProductService {
  /**
   * Get all products
   */
  async getAll(pagination: PaginationInput, includeInactive = false) {
    const { page, limit, sortBy, sortOrder } = pagination;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = includeInactive ? {} : { isActive: true };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          pricing: {
            where: { effectiveTo: null },
            orderBy: { effectiveFrom: 'desc' },
            take: 1,
          },
        },
        skip,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { name: 'asc' },
      }),
      prisma.product.count({ where }),
    ]);

    return {
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get product by ID
   */
  async getById(productId: string) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        pricing: {
          orderBy: { effectiveFrom: 'desc' },
        },
      },
    });

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    return product;
  }

  /**
   * Create a new product
   */
  async create(data: ProductInput, initialPrice: number) {
    const product = await prisma.product.create({
      data: {
        name: data.name,
        description: data.description,
        unit: data.unit as any,
        unitQuantity: data.unitQuantity,
        imageUrl: data.imageUrl,
        isActive: data.isActive ?? true,
        pricing: {
          create: {
            pricePerUnit: initialPrice,
            effectiveFrom: new Date(),
          },
        },
      },
      include: {
        pricing: true,
      },
    });

    return product;
  }

  /**
   * Update product
   */
  async update(productId: string, data: Partial<ProductInput>) {
    await this.getById(productId);

    const product = await prisma.product.update({
      where: { id: productId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.unit && { unit: data.unit as any }),
        ...(data.unitQuantity && { unitQuantity: data.unitQuantity }),
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
      include: {
        pricing: {
          where: { effectiveTo: null },
          orderBy: { effectiveFrom: 'desc' },
          take: 1,
        },
      },
    });

    return product;
  }

  /**
   * Set new pricing for a product
   */
  async setPricing(productId: string, pricePerUnit: number, effectiveFrom: Date) {
    await this.getById(productId);

    // End current pricing
    await prisma.productPricing.updateMany({
      where: {
        productId,
        effectiveTo: null,
      },
      data: {
        effectiveTo: new Date(effectiveFrom.getTime() - 1), // Day before new price
      },
    });

    // Create new pricing
    const pricing = await prisma.productPricing.create({
      data: {
        productId,
        pricePerUnit,
        effectiveFrom,
      },
    });

    return pricing;
  }

  /**
   * Get pricing history for a product
   */
  async getPricingHistory(productId: string) {
    await this.getById(productId);

    const pricing = await prisma.productPricing.findMany({
      where: { productId },
      orderBy: { effectiveFrom: 'desc' },
    });

    return pricing;
  }

  /**
   * Delete product (soft delete by deactivating)
   */
  async delete(productId: string) {
    await this.getById(productId);

    // Check if product has active subscriptions
    const activeSubscriptions = await prisma.subscription.count({
      where: {
        productId,
        status: 'ACTIVE',
      },
    });

    if (activeSubscriptions > 0) {
      throw new BadRequestError(
        `Cannot delete product with ${activeSubscriptions} active subscription(s). Deactivate the product instead.`
      );
    }

    const product = await prisma.product.update({
      where: { id: productId },
      data: { isActive: false },
    });

    return product;
  }

  /**
   * Get current price for a product
   */
  async getCurrentPrice(productId: string): Promise<number> {
    const pricing = await prisma.productPricing.findFirst({
      where: {
        productId,
        effectiveTo: null,
      },
      orderBy: { effectiveFrom: 'desc' },
    });

    if (!pricing) {
      throw new NotFoundError('No active pricing found for product');
    }

    return Number(pricing.pricePerUnit);
  }
}

export default new ProductService();
