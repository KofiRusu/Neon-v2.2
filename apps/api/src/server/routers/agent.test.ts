import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { agentRouter } from './agent';
import { createTRPCMockContext } from '../__test__/helpers/mock-context';

describe('agentRouter', () => {
  let mockContext: ReturnType<typeof createTRPCMockContext>;

  beforeEach(() => {
    mockContext = createTRPCMockContext();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getLogs', () => {
    it('should return agent logs successfully', async () => {
      const mockLogs = [
        { id: '1', agent: 'ContentAgent', action: 'generate', createdAt: new Date() },
        { id: '2', agent: 'SEOAgent', action: 'optimize', createdAt: new Date() },
      ];

      mockContext.prisma.aIEventLog.findMany.mockResolvedValue(mockLogs);

      const caller = agentRouter.createCaller(mockContext);
      const result = await caller.getLogs({});

      expect(result).toEqual(mockLogs);
      expect(mockContext.prisma.aIEventLog.findMany).toHaveBeenCalled();
    });
  });

  describe('logEvent', () => {
    it('should log agent event successfully', async () => {
      const mockEvent = {
        id: '1',
        agent: 'ContentAgent',
        action: 'generate_content',
        metadata: {},
        createdAt: new Date(),
      };

      mockContext.prisma.aIEventLog.create.mockResolvedValue(mockEvent);
      mockContext.session = {
        user: {
          id: 'user1',
          email: 'test@example.com',
          name: 'Test User',
          role: 'USER',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        expires: new Date(Date.now() + 1000 * 60 * 60 * 24),
      };

      const caller = agentRouter.createCaller(mockContext);
      const result = await caller.logEvent({
        agent: 'ContentAgent',
        action: 'generate_content',
        metadata: { topic: 'AI trends' },
      });

      expect(result).toEqual(mockEvent);
      expect(mockContext.prisma.aIEventLog.create).toHaveBeenCalledWith({
        data: {
          agent: 'ContentAgent',
          action: 'generate_content',
          metadata: { topic: 'AI trends' },
        },
      });
    });
  });

  describe('getActivitySummary', () => {
    it('should return activity summary', async () => {
      mockContext.prisma.aIEventLog.count.mockResolvedValue(100);
      mockContext.prisma.aIEventLog.groupBy.mockResolvedValue([
        { agent: 'ContentAgent', _count: { id: 50 } },
        { agent: 'SEOAgent', _count: { id: 30 } },
      ]);

      const caller = agentRouter.createCaller(mockContext);
      const result = await caller.getActivitySummary({});

      expect(result).toEqual({
        totalEvents: 100,
        agentBreakdown: [
          { agent: 'ContentAgent', count: 50 },
          { agent: 'SEOAgent', count: 30 },
        ],
      });
    });
  });
});
