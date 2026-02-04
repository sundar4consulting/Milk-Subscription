import { Router } from 'express';
import { asyncHandler, optionalAuth } from '../middleware/index.js';
import { validate } from '../middleware/validate.js';
import { productService } from '../services/index.js';
import prisma from '../config/database.js';
import { sendSuccess } from '../utils/errors.js';
import { paginationSchema } from '../utils/validators.js';

const router = Router();

/**
 * GET /api/products
 * List available products (public)
 */
router.get(
  '/',
  validate(paginationSchema, 'query'),
  asyncHandler(async (req, res) => {
    const result = await productService.getAll(req.query as any, false);
    sendSuccess(res, 'Products retrieved successfully', result.products, result.pagination);
  })
);

/**
 * GET /api/products/:id
 * Get product details (public)
 */
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const product = await productService.getById(req.params.id);
    
    if (!product.isActive) {
      throw new (await import('../utils/errors.js')).NotFoundError('Product not found');
    }

    sendSuccess(res, 'Product retrieved successfully', product);
  })
);

/**
 * GET /api/service-areas
 * List service areas (public)
 */
router.get(
  '/service-areas',
  asyncHandler(async (req, res) => {
    const setting = await prisma.systemSettings.findUnique({
      where: { key: 'service_areas' },
    });

    const serviceAreas = (setting?.value as any)?.cities || [];
    sendSuccess(res, 'Service areas retrieved successfully', serviceAreas);
  })
);

export default router;
