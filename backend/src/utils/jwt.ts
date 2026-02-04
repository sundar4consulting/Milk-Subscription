import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';
import config from '../config/index.js';
import { UserRole } from '@prisma/client';

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface DecodedToken extends JwtPayload, TokenPayload {}

/**
 * Generate access token
 */
export function generateAccessToken(payload: TokenPayload): string {
  const options: SignOptions = {
    expiresIn: config.jwt.accessExpiry,
    issuer: 'milk-subscription-platform',
    subject: payload.userId,
  };

  return jwt.sign(payload, config.jwt.secret, options);
}

/**
 * Generate refresh token
 */
export function generateRefreshToken(payload: TokenPayload): string {
  const options: SignOptions = {
    expiresIn: config.jwt.refreshExpiry,
    issuer: 'milk-subscription-platform',
    subject: payload.userId,
  };

  return jwt.sign({ ...payload, type: 'refresh' }, config.jwt.secret, options);
}

/**
 * Verify access token
 */
export function verifyAccessToken(token: string): DecodedToken | null {
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as DecodedToken;
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Verify refresh token
 */
export function verifyRefreshToken(token: string): DecodedToken | null {
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as DecodedToken & { type?: string };
    if (decoded.type !== 'refresh') {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Decode token without verification (for expired token handling)
 */
export function decodeToken(token: string): DecodedToken | null {
  try {
    const decoded = jwt.decode(token) as DecodedToken;
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Get token expiry date
 */
export function getTokenExpiry(token: string): Date | null {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) {
    return null;
  }
  return new Date(decoded.exp * 1000);
}

/**
 * Generate tokens pair
 */
export function generateTokens(payload: TokenPayload): {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiry: Date;
  refreshTokenExpiry: Date;
} {
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  return {
    accessToken,
    refreshToken,
    accessTokenExpiry: getTokenExpiry(accessToken) || new Date(),
    refreshTokenExpiry: getTokenExpiry(refreshToken) || new Date(),
  };
}
