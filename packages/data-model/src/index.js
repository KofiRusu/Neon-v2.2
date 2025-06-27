'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.PrismaClient = exports.db = void 0;
// Export Prisma client
var client_1 = require('./client');
Object.defineProperty(exports, 'db', {
  enumerable: true,
  get: function () {
    return client_1.db;
  },
});
// Re-export Prisma client for direct usage
var client_2 = require('../node_modules/.prisma/client');
Object.defineProperty(exports, 'PrismaClient', {
  enumerable: true,
  get: function () {
    return client_2.PrismaClient;
  },
});
//# sourceMappingURL=index.js.map
