// Export Prisma client
export { db } from './client';

// Re-export Prisma client for direct usage
export { PrismaClient } from '../node_modules/.prisma/client';

// Export types from the generated Prisma client
export type {
  User,
  Campaign,
  CampaignMetric,
  AIEventLog,
  UserRole,
  CampaignType,
  CampaignStatus,
  Prisma,
} from '../node_modules/.prisma/client';
