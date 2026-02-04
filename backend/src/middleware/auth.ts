import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { UnauthorizedError, ForbiddenError } from '../utils/errors.js';
import { verifyAccessToken, TokenPayload } from '../utils/jwt.js';
import prisma from '../config/database.js';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload & { status: string };
    }
  }
}

/**
 * Authentication middleware - verifies JWT token
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Access token is required');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    if (!decoded) {
      throw new UnauthorizedError('Invalid or expired access token');
    }

    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, status: true },
    });

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    if (user.status !== 'ACTIVE') {
      throw new ForbiddenError('Account is not active');
    }

    // Attach user to request
    req.user = {
      userId: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Authorization middleware - checks user roles
 */
export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role as UserRole)) {
      return next(
        new ForbiddenError('You do not have permission to perform this action')
      );
    }

    next();
  };
};

/**
 * Optional authentication - attaches user if token is valid, but doesn't require it
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    if (decoded) {
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, email: true, role: true, status: true },
      });

      if (user && user.status === 'ACTIVE') {
        req.user = {
          userId: user.id,
          email: user.email,
          role: user.role,
          status: user.status,
        };
      }
    }

    next();
  } catch {
    // If token is invalid, just continue without user
    next();
  }
};

/**
 * Check if user is admin
 */
export const isAdmin = authorize(UserRole.ADMIN);

/**
 * Check if user is customer
 */
export const isCustomer = authorize(UserRole.CUSTOMER);

/**
 * Check if user is delivery person
 */
export const isDeliveryPerson = authorize(UserRole.DELIVERY_PERSON);

/**
 * Check if user is admin or delivery person
 */
export const isStaff = authorize(UserRole.ADMIN, UserRole.DELIVERY_PERSON);
