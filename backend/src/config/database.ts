import { PrismaClient } from '@prisma/client';
import config from './index.js';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Prevent multiple Prisma instances in development
const prisma = global.prisma || new PrismaClient({
  log: config.env === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (config.env !== 'production') {
  global.prisma = prisma;
}

export default prisma;
