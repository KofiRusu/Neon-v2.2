import { PrismaClient } from '../node_modules/.prisma/client';
declare global {
  var __db__: PrismaClient | undefined;
}
declare let prisma: PrismaClient;
export { prisma as db };
//# sourceMappingURL=client.d.ts.map
