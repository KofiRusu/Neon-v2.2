import { PrismaClient } from '../node_modules/.prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __db__: PrismaClient | undefined;
}

let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.__db__) {
    global.__db__ = new PrismaClient({
      log: ['query', 'error', 'warn'],
    });
  }
  prisma = global.__db__;
}

export { prisma as db };
