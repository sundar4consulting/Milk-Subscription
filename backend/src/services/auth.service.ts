import bcrypt from 'bcryptjs';
import { UserRole, UserStatus } from '@prisma/client';
import prisma from '../config/database.js';
import {
  generateTokens,
  verifyRefreshToken,
  TokenPayload,
} from '../utils/jwt.js';
import {
  BadRequestError,
  UnauthorizedError,
  ConflictError,
  NotFoundError,
} from '../utils/errors.js';
import { RegisterInput, LoginInput } from '../utils/validators.js';

const SALT_ROUNDS = 10;

export class AuthService {
  /**
   * Register a new customer
   */
  async register(data: RegisterInput) {
    // Check if email already exists
    const existingEmail = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingEmail) {
      throw new ConflictError('Email already registered');
    }

    // Check if phone already exists
    const existingPhone = await prisma.user.findUnique({
      where: { phone: data.phone },
    });

    if (existingPhone) {
      throw new ConflictError('Phone number already registered');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

    // Create user with customer profile
    const user = await prisma.user.create({
      data: {
        email: data.email,
        phone: data.phone,
        passwordHash,
        role: UserRole.CUSTOMER,
        status: UserStatus.ACTIVE,
        customerProfile: {
          create: {
            firstName: data.firstName,
            lastName: data.lastName,
            wallet: {
              create: {
                balance: 0,
              },
            },
          },
        },
      },
      include: {
        customerProfile: true,
      },
    });

    // Generate tokens
    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const tokens = generateTokens(tokenPayload);

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: user.id,
        expiresAt: tokens.refreshTokenExpiry,
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profile: user.customerProfile,
      },
      ...tokens,
    };
  }

  /**
   * Login user
   */
  async login(data: LoginInput) {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: data.email },
      include: {
        customerProfile: true,
      },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Check password
    const isValidPassword = await bcrypt.compare(data.password, user.passwordHash);

    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Check user status
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedError('Account is not active');
    }

    // Generate tokens
    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const tokens = generateTokens(tokenPayload);

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: user.id,
        expiresAt: tokens.refreshTokenExpiry,
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profile: user.customerProfile,
      },
      ...tokens,
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string) {
    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    if (!decoded) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    // Check if refresh token exists in database
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!storedToken) {
      throw new UnauthorizedError('Refresh token not found');
    }

    // Check if token is expired
    if (storedToken.expiresAt < new Date()) {
      // Delete expired token
      await prisma.refreshToken.delete({ where: { id: storedToken.id } });
      throw new UnauthorizedError('Refresh token has expired');
    }

    // Check user status
    if (storedToken.user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedError('Account is not active');
    }

    // Generate new tokens
    const tokenPayload: TokenPayload = {
      userId: storedToken.user.id,
      email: storedToken.user.email,
      role: storedToken.user.role,
    };

    const tokens = generateTokens(tokenPayload);

    // Delete old refresh token and store new one
    await prisma.$transaction([
      prisma.refreshToken.delete({ where: { id: storedToken.id } }),
      prisma.refreshToken.create({
        data: {
          token: tokens.refreshToken,
          userId: storedToken.user.id,
          expiresAt: tokens.refreshTokenExpiry,
        },
      }),
    ]);

    return tokens;
  }

  /**
   * Logout user
   */
  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      // Delete specific refresh token
      await prisma.refreshToken.deleteMany({
        where: {
          userId,
          token: refreshToken,
        },
      });
    } else {
      // Delete all refresh tokens for user
      await prisma.refreshToken.deleteMany({
        where: { userId },
      });
    }
  }

  /**
   * Request password reset
   */
  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Return success even if user not found (security)
      return { message: 'If email exists, reset instructions will be sent' };
    }

    // TODO: Generate reset token and send email
    // For now, just return success
    return { message: 'If email exists, reset instructions will be sent' };
  }

  /**
   * Reset password
   */
  async resetPassword(token: string, newPassword: string) {
    // TODO: Implement token verification
    // For now, throw not implemented
    throw new BadRequestError('Password reset not implemented yet');
  }

  /**
   * Change password
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);

    if (!isValidPassword) {
      throw new BadRequestError('Current password is incorrect');
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    // Invalidate all refresh tokens
    await prisma.refreshToken.deleteMany({
      where: { userId },
    });

    return { message: 'Password changed successfully' };
  }

  /**
   * Get current user
   */
  async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        customerProfile: {
          include: {
            addresses: {
              where: { isActive: true },
            },
            wallet: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      profile: user.customerProfile,
    };
  }
}

export default new AuthService();
