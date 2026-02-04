import { Router } from 'express';
import authRoutes from './auth.routes.js';
import customerRoutes from './customer.routes.js';
import adminRoutes from './admin.routes.js';
import publicRoutes from './public.routes.js';

const router = Router();

// Public routes
router.use('/auth', authRoutes);
router.use('/products', publicRoutes);

// Protected routes
router.use('/customer', customerRoutes);
router.use('/admin', adminRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export default router;
