import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

interface Config {
  env: string;
  port: number;
  host: string;
  cors: {
    origin: string;
    credentials: boolean;
  };
  jwt: {
    secret: string;
    accessExpiry: string;
    refreshExpiry: string;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  logging: {
    level: string;
  };
  database: {
    url: string;
  };
  email: {
    host: string;
    port: number;
    user: string;
    password: string;
    from: string;
  };
  upload: {
    maxFileSize: number;
    uploadDir: string;
  };
  payment: {
    gateway: string;
    stripeSecretKey: string;
    stripeWebhookSecret: string;
  };
}

const config: Config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),
  host: process.env.HOST || 'localhost',
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-in-production',
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
  logging: {
    level: process.env.LOG_LEVEL || 'debug',
  },
  database: {
    url: process.env.DATABASE_URL || '',
  },
  email: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASSWORD || '',
    from: process.env.FROM_EMAIL || 'noreply@milksubscription.com',
  },
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10),
    uploadDir: process.env.UPLOAD_DIR || './uploads',
  },
  payment: {
    gateway: process.env.PAYMENT_GATEWAY || 'stripe',
    stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  },
};

export default config;
