import { Router } from 'express';
import { asyncHandler } from '../middleware/index.js';
import { validate } from '../middleware/validate.js';
import { authService } from '../services/index.js';
import { sendSuccess, sendCreated } from '../utils/errors.js';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
} from '../utils/validators.js';

const router = Router();

/**
 * POST /api/auth/register
 * Register a new customer
 */
router.post(
  '/register',
  validate(registerSchema),
  asyncHandler(async (req, res) => {
    const result = await authService.register(req.body);
    sendCreated(res, 'Registration successful', result);
  })
);

/**
 * POST /api/auth/login
 * Login user
 */
router.post(
  '/login',
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const result = await authService.login(req.body);
    sendSuccess(res, 'Login successful', result);
  })
);

/**
 * POST /api/auth/refresh-token
 * Refresh access token
 */
router.post(
  '/refresh-token',
  validate(refreshTokenSchema),
  asyncHandler(async (req, res) => {
    const result = await authService.refreshToken(req.body.refreshToken);
    sendSuccess(res, 'Token refreshed successfully', result);
  })
);

/**
 * POST /api/auth/logout
 * Logout user
 */
router.post(
  '/logout',
  asyncHandler(async (req, res) => {
    const authHeader = req.headers.authorization;
    const userId = req.body.userId;
    const refreshToken = req.body.refreshToken;

    if (userId) {
      await authService.logout(userId, refreshToken);
    }

    sendSuccess(res, 'Logged out successfully');
  })
);

/**
 * POST /api/auth/forgot-password
 * Request password reset
 */
router.post(
  '/forgot-password',
  validate(forgotPasswordSchema),
  asyncHandler(async (req, res) => {
    const result = await authService.forgotPassword(req.body.email);
    sendSuccess(res, result.message);
  })
);

export default router;
