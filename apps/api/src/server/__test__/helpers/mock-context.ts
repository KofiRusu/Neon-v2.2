import { jest } from '@jest/globals';

// Mock context type based on expected tRPC context structure
interface MockContext {
  db: MockPrismaClient;
  prisma: MockPrismaClient;
  session: MockSession | null;
  logger: MockLogger;
  req: MockRequest;
  res: MockResponse;
}

interface MockRequest {
  headers: Record<string, string>;
  body: Record<string, unknown>;
  method: string;
  url: string;
}

interface MockResponse {
  status: jest.Mock<number>;
  json: jest.Mock<Record<string, unknown>>;
  send: jest.Mock<string>;
}

interface MockPrismaClient {
  user: {
    findUnique: jest.Mock;
    findMany: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    count: jest.Mock;
  };
  aIEventLog: {
    findUnique: jest.Mock;
    findMany: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    count: jest.Mock;
    groupBy: jest.Mock;
  };
  agent: {
    findUnique: jest.Mock;
    findMany: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    count: jest.Mock;
  };
  agentExecution: {
    findUnique: jest.Mock;
    findMany: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    count: jest.Mock;
  };
  campaign: {
    findUnique: jest.Mock;
    findMany: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    count: jest.Mock;
  };
  content: {
    findUnique: jest.Mock;
    findMany: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    count: jest.Mock;
  };
  analytics: {
    findUnique: jest.Mock;
    findMany: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    count: jest.Mock;
    aggregate: jest.Mock;
    groupBy: jest.Mock;
  };
  lead: {
    findUnique: jest.Mock;
    findMany: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    count: jest.Mock;
  };
  trend: {
    findUnique: jest.Mock;
    findMany: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    count: jest.Mock;
  };
  abTest: {
    findUnique: jest.Mock;
    findMany: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    count: jest.Mock;
  };
  designTemplate: {
    findUnique: jest.Mock;
    findMany: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    count: jest.Mock;
  };
  $transaction: jest.Mock;
  $connect: jest.Mock;
  $disconnect: jest.Mock;
}

interface MockSession {
  user: MockUser;
  expires: Date;
}

interface MockUser {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

interface MockLogger {
  info: jest.Mock;
  error: jest.Mock;
  warn: jest.Mock;
  debug: jest.Mock;
}

export function createTRPCMockContext(): MockContext {
  return {
    db: {
      user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      aIEventLog: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
        groupBy: jest.fn(),
      },
      agent: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      agentExecution: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      campaign: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      content: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      analytics: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
        aggregate: jest.fn(),
        groupBy: jest.fn(),
      },
      lead: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      trend: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      abTest: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      designTemplate: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      $transaction: jest.fn(),
      $connect: jest.fn(),
      $disconnect: jest.fn(),
    },
    prisma: {} as unknown as MockPrismaClient, // alias for db - will use db property instead
    session: null,
    logger: {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    },
    req: {
      headers: {},
      body: {},
      method: 'GET',
      url: '/',
    },
    res: {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    },
  };
}

export function createMockUser(): MockUser {
  return {
    id: 'user1',
    email: 'test@example.com',
    name: 'Test User',
    role: 'USER',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function createMockSession(user = createMockUser()): MockSession {
  return {
    user,
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24 hours
  };
}

export function createMockAgent(): Record<string, unknown> {
  return {
    id: 'agent1',
    name: 'Test Agent',
    type: 'CONTENT',
    status: 'ACTIVE',
    capabilities: {},
    settings: {},
    version: '1.0.0',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function createMockCampaign(): Record<string, unknown> {
  return {
    id: 'campaign1',
    name: 'Test Campaign',
    description: 'Test campaign description',
    type: 'SOCIAL_MEDIA',
    status: 'ACTIVE',
    budget: 1000,
    startDate: new Date(),
    endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 30 days
    userId: 'user1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function createMockExecution(): Record<string, unknown> {
  return {
    id: 'execution1',
    agentId: 'agent1',
    campaignId: 'campaign1',
    userId: 'user1',
    task: 'test_task',
    payload: {},
    result: null,
    status: 'PENDING',
    performance: null,
    error: null,
    startedAt: new Date(),
    completedAt: null,
    metadata: {},
  };
}
