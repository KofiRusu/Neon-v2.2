'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.db = void 0;
const client_1 = require('../node_modules/.prisma/client');
let prisma;
if (process.env.NODE_ENV === 'production') {
  exports.db = prisma = new client_1.PrismaClient();
} else {
  if (!global.__db__) {
    global.__db__ = new client_1.PrismaClient({
      log: ['query', 'error', 'warn'],
    });
  }
  exports.db = prisma = global.__db__;
}
//# sourceMappingURL=client.js.map
