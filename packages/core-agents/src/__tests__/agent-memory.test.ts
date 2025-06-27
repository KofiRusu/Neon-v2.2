import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { AgentMemoryStore, MemoryEntry, MemoryMetrics } from '../memory/AgentMemoryStore';
import { PerformanceTuner, AgentPerformanceProfile } from '../tuner/PerformanceTuner';

// Mock PrismaClient
const mockPrismaClient = {
  agentMemory: {
    create: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    deleteMany: jest.fn(),
  },
  $queryRaw: jest.fn(),
};

// Mock data generators
const generateMockMemoryEntry = (overrides: Partial<MemoryEntry> = {}): MemoryEntry => ({
  id: 'mem-123',
  agentId: 'content-agent',
  sessionId: 'session-456',
  userId: 'user-789',
  input: { task: 'generate content', content: 'test content' },
  output: { success: true, data: 'generated content' },
  timestamp: new Date(),
  score: 85,
  tokensUsed: 1200,
  cost: 0.024,
  executionTime: 3500,
  success: true,
  metadata: { version: '1.0' },
  ...overrides,
});

const generateMockMetrics = (overrides: Partial<MemoryMetrics> = {}): MemoryMetrics => ({
  totalRuns: 100,
  successRate: 95.0,
  averageCost: 0.025,
  averageTokens: 1250,
  averageExecutionTime: 3200,
  averageScore: 87,
  totalCost: 2.5,
  totalTokens: 125000,
  costTrend: [
    { date: '2024-01-01', cost: 0.03 },
    { date: '2024-01-02', cost: 0.025 },
    { date: '2024-01-03', cost: 0.02 },
  ],
  performanceTrend: [
    { date: '2024-01-01', executionTime: 3800 },
    { date: '2024-01-02', executionTime: 3200 },
    { date: '2024-01-03', executionTime: 2800 },
  ],
  successTrend: [
    { date: '2024-01-01', successRate: 92 },
    { date: '2024-01-02', successRate: 95 },
    { date: '2024-01-03', successRate: 97 },
  ],
  ...overrides,
});

describe('AgentMemoryStore', () => {
  let memoryStore: AgentMemoryStore;

  beforeEach(() => {
    jest.clearAllMocks();
    memoryStore = new AgentMemoryStore(mockPrismaClient as any);
  });

  describe('storeMemory', () => {
    test('should store a memory entry successfully', async () => {
      const mockEntry = generateMockMemoryEntry();
      mockPrismaClient.agentMemory.create.mockResolvedValue(mockEntry);

      const result = await memoryStore.storeMemory(
        'content-agent',
        'session-123',
        { task: 'test task' },
        { success: true },
        {
          userId: 'user-456',
          tokensUsed: 1000,
          cost: 0.02,
          executionTime: 2500,
          success: true,
        }
      );

      expect(mockPrismaClient.agentMemory.create).toHaveBeenCalledWith({
        data: {
          agentId: 'content-agent',
          sessionId: 'session-123',
          userId: 'user-456',
          input: { task: 'test task' },
          output: { success: true },
          tokensUsed: 1000,
          cost: 0.02,
          executionTime: 2500,
          success: true,
          score: undefined,
          errorMessage: undefined,
          metadata: {
            userId: 'user-456',
            tokensUsed: 1000,
            cost: 0.02,
            executionTime: 2500,
            success: true,
          },
        },
      });
      expect(result).toEqual(mockEntry);
    });

    test('should handle missing metadata gracefully', async () => {
      const mockEntry = generateMockMemoryEntry();
      mockPrismaClient.agentMemory.create.mockResolvedValue(mockEntry);

      await memoryStore.storeMemory(
        'content-agent',
        'session-123',
        { task: 'test task' },
        { success: true }
      );

      expect(mockPrismaClient.agentMemory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tokensUsed: 0,
          cost: 0,
          executionTime: 0,
          success: true,
          metadata: null,
        }),
      });
    });
  });

  describe('getMemories', () => {
    test('should retrieve memories with default options', async () => {
      const mockEntries = [generateMockMemoryEntry(), generateMockMemoryEntry({ id: 'mem-456' })];
      mockPrismaClient.agentMemory.findMany.mockResolvedValue(mockEntries);

      const result = await memoryStore.getMemories();

      expect(mockPrismaClient.agentMemory.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { timestamp: 'desc' },
        take: 50,
        skip: 0,
      });
      expect(result).toHaveLength(2);
    });

    test('should filter by agentId and date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      mockPrismaClient.agentMemory.findMany.mockResolvedValue([]);

      await memoryStore.getMemories({
        agentId: 'content-agent',
        startDate,
        endDate,
        successOnly: true,
        limit: 25,
      });

      expect(mockPrismaClient.agentMemory.findMany).toHaveBeenCalledWith({
        where: {
          agentId: 'content-agent',
          success: true,
          timestamp: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: { timestamp: 'desc' },
        take: 25,
        skip: 0,
      });
    });
  });

  describe('getAgentMetrics', () => {
    test('should calculate comprehensive metrics', async () => {
      const mockEntries = [
        generateMockMemoryEntry({
          cost: 0.02,
          tokensUsed: 1000,
          executionTime: 2000,
          success: true,
          score: 90,
        }),
        generateMockMemoryEntry({
          cost: 0.03,
          tokensUsed: 1500,
          executionTime: 3000,
          success: true,
          score: 85,
        }),
        generateMockMemoryEntry({
          cost: 0.01,
          tokensUsed: 800,
          executionTime: 1500,
          success: false,
        }),
      ];

      // Mock the getMemories call
      jest.spyOn(memoryStore, 'getMemories').mockResolvedValue(mockEntries);

      const metrics = await memoryStore.getAgentMetrics('content-agent', 30);

      expect(metrics.totalRuns).toBe(3);
      expect(metrics.successRate).toBeCloseTo(66.67, 1); // 2/3 * 100
      expect(metrics.averageCost).toBeCloseTo(0.02, 2); // (0.02 + 0.03 + 0.01) / 3
      expect(metrics.averageTokens).toBeCloseTo(1100, 0); // (1000 + 1500 + 800) / 3
      expect(metrics.averageExecutionTime).toBeCloseTo(2166.67, 1); // (2000 + 3000 + 1500) / 3
      expect(metrics.averageScore).toBeCloseTo(87.5, 1); // (90 + 85) / 2
      expect(metrics.totalCost).toBeCloseTo(0.06, 2);
      expect(metrics.totalTokens).toBe(3300);
    });

    test('should return zero metrics for no data', async () => {
      jest.spyOn(memoryStore, 'getMemories').mockResolvedValue([]);

      const metrics = await memoryStore.getAgentMetrics('content-agent', 30);

      expect(metrics).toEqual({
        totalRuns: 0,
        successRate: 0,
        averageCost: 0,
        averageTokens: 0,
        averageExecutionTime: 0,
        totalCost: 0,
        totalTokens: 0,
        costTrend: [],
        performanceTrend: [],
        successTrend: [],
      });
    });
  });

  describe('getLastSuccessfulRuns', () => {
    test('should retrieve last successful runs', async () => {
      const mockEntries = [generateMockMemoryEntry({ success: true })];
      jest.spyOn(memoryStore, 'getMemories').mockResolvedValue(mockEntries);

      const result = await memoryStore.getLastSuccessfulRuns('content-agent', 5);

      expect(memoryStore.getMemories).toHaveBeenCalledWith({
        agentId: 'content-agent',
        successOnly: true,
        limit: 5,
        sortBy: 'timestamp',
        sortOrder: 'desc',
      });
      expect(result).toEqual(mockEntries);
    });
  });

  describe('clearOldMemories', () => {
    test('should clear memories older than specified days', async () => {
      mockPrismaClient.agentMemory.deleteMany.mockResolvedValue({ count: 25 });

      const result = await memoryStore.clearOldMemories(90);

      expect(mockPrismaClient.agentMemory.deleteMany).toHaveBeenCalledWith({
        where: {
          timestamp: {
            lt: expect.any(Date),
          },
        },
      });
      expect(result).toBe(25);
    });
  });

  describe('updateMemoryScore', () => {
    test('should update memory score and metadata', async () => {
      mockPrismaClient.agentMemory.update.mockResolvedValue({});

      await memoryStore.updateMemoryScore('mem-123', 95, { feedback: 'excellent' });

      expect(mockPrismaClient.agentMemory.update).toHaveBeenCalledWith({
        where: { id: 'mem-123' },
        data: {
          score: 95,
          metadata: { feedback: 'excellent' },
        },
      });
    });
  });
});

describe('PerformanceTuner', () => {
  let memoryStore: AgentMemoryStore;
  let performanceTuner: PerformanceTuner;

  beforeEach(() => {
    memoryStore = new AgentMemoryStore(mockPrismaClient as any);
    performanceTuner = new PerformanceTuner(memoryStore);
  });

  describe('analyzeAgent', () => {
    test('should generate comprehensive performance profile', async () => {
      const mockMetrics = generateMockMetrics({
        averageCost: 0.15, // High cost to trigger recommendation
        averageExecutionTime: 25000, // Slow execution to trigger recommendation
        successRate: 75, // Low success rate to trigger recommendation
      });

      jest.spyOn(memoryStore, 'getAgentMetrics').mockResolvedValue(mockMetrics);
      jest.spyOn(memoryStore, 'getAllAgentMetrics').mockResolvedValue({
        'content-agent': mockMetrics,
        'seo-agent': generateMockMetrics(),
      });

      const profile = await performanceTuner.analyzeAgent('content-agent', 30);

      expect(profile.agentId).toBe('content-agent');
      expect(profile.agentName).toBe('Content Agent');
      expect(profile.healthScore).toBeLessThan(80); // Should be low due to issues
      expect(profile.overallHealth).toMatch(/poor|critical|fair/);
      expect(profile.recommendations).toHaveLength(3); // Cost, performance, reliability
      expect(profile.recommendations[0].severity).toMatch(/high|critical/);
    });

    test('should handle excellent performance', async () => {
      const excellentMetrics = generateMockMetrics({
        averageCost: 0.01, // Excellent cost
        averageExecutionTime: 800, // Fast execution
        successRate: 98, // High success rate
        averageScore: 95,
      });

      jest.spyOn(memoryStore, 'getAgentMetrics').mockResolvedValue(excellentMetrics);
      jest.spyOn(memoryStore, 'getAllAgentMetrics').mockResolvedValue({
        'content-agent': excellentMetrics,
      });

      const profile = await performanceTuner.analyzeAgent('content-agent', 30);

      expect(profile.healthScore).toBeGreaterThan(90);
      expect(profile.overallHealth).toBe('excellent');
      expect(profile.recommendations).toHaveLength(0); // No recommendations needed
    });
  });

  describe('analyzeSystem', () => {
    test('should provide system-wide analysis', async () => {
      const mockMetrics = {
        'content-agent': generateMockMetrics({ averageCost: 0.15, successRate: 75 }),
        'seo-agent': generateMockMetrics({ averageCost: 0.02, successRate: 95 }),
        'email-agent': generateMockMetrics({ averageCost: 0.03, successRate: 90 }),
      };

      jest.spyOn(memoryStore, 'getAllAgentMetrics').mockResolvedValue(mockMetrics);

      // Mock analyzeAgent for each agent
      jest
        .spyOn(performanceTuner, 'analyzeAgent')
        .mockResolvedValueOnce({
          agentId: 'content-agent',
          agentName: 'Content Agent',
          overallHealth: 'poor',
          healthScore: 60,
          recommendations: [
            {
              type: 'cost',
              severity: 'high',
              title: 'High Cost',
              description: 'Cost is too high',
              recommendation: 'Optimize',
              expectedImpact: '30% reduction',
              dataSupport: {
                metric: 'cost',
                currentValue: 0.15,
                benchmarkValue: 0.05,
                trend: 'stable',
              },
              suggestedActions: [],
            },
          ],
        } as AgentPerformanceProfile)
        .mockResolvedValueOnce({
          agentId: 'seo-agent',
          agentName: 'SEO Agent',
          overallHealth: 'excellent',
          healthScore: 95,
          recommendations: [],
        } as AgentPerformanceProfile)
        .mockResolvedValueOnce({
          agentId: 'email-agent',
          agentName: 'Email Agent',
          overallHealth: 'good',
          healthScore: 85,
          recommendations: [],
        } as AgentPerformanceProfile);

      const systemAnalysis = await performanceTuner.analyzeSystem(30);

      expect(systemAnalysis.totalAgents).toBe(3);
      expect(systemAnalysis.topPerformers).toHaveLength(3);
      expect(systemAnalysis.topPerformers[0].agentId).toBe('seo-agent'); // Highest score
      expect(systemAnalysis.underperformers).toHaveLength(1);
      expect(systemAnalysis.underperformers[0].agentId).toBe('content-agent');
      expect(systemAnalysis.systemRecommendations.length).toBeGreaterThan(0);
    });
  });

  describe('recommendation generation', () => {
    test('should generate cost optimization recommendations', async () => {
      const highCostMetrics = generateMockMetrics({
        averageCost: 0.3, // Very high cost
        totalCost: 30.0,
      });

      jest.spyOn(memoryStore, 'getAgentMetrics').mockResolvedValue(highCostMetrics);
      jest.spyOn(memoryStore, 'getAllAgentMetrics').mockResolvedValue({
        'content-agent': highCostMetrics,
      });

      const profile = await performanceTuner.analyzeAgent('content-agent', 30);
      const costRecommendation = profile.recommendations.find(r => r.type === 'cost');

      expect(costRecommendation).toBeDefined();
      expect(costRecommendation!.severity).toBe('critical');
      expect(costRecommendation!.title).toContain('Cost');
      expect(costRecommendation!.suggestedActions.length).toBeGreaterThan(0);
      expect(costRecommendation!.expectedImpact).toContain('$');
    });

    test('should generate performance recommendations', async () => {
      const slowMetrics = generateMockMetrics({
        averageExecutionTime: 35000, // Very slow
      });

      jest.spyOn(memoryStore, 'getAgentMetrics').mockResolvedValue(slowMetrics);
      jest.spyOn(memoryStore, 'getAllAgentMetrics').mockResolvedValue({
        'content-agent': slowMetrics,
      });

      const profile = await performanceTuner.analyzeAgent('content-agent', 30);
      const perfRecommendation = profile.recommendations.find(r => r.type === 'performance');

      expect(perfRecommendation).toBeDefined();
      expect(perfRecommendation!.title).toContain('Execution Time');
      expect(
        perfRecommendation!.suggestedActions.some(action =>
          action.action.toLowerCase().includes('caching')
        )
      ).toBe(true);
    });

    test('should generate reliability recommendations', async () => {
      const unreliableMetrics = generateMockMetrics({
        successRate: 65, // Poor success rate
      });

      jest.spyOn(memoryStore, 'getAgentMetrics').mockResolvedValue(unreliableMetrics);
      jest.spyOn(memoryStore, 'getAllAgentMetrics').mockResolvedValue({
        'content-agent': unreliableMetrics,
      });

      const profile = await performanceTuner.analyzeAgent('content-agent', 30);
      const reliabilityRecommendation = profile.recommendations.find(r => r.type === 'reliability');

      expect(reliabilityRecommendation).toBeDefined();
      expect(reliabilityRecommendation!.severity).toBe('critical');
      expect(reliabilityRecommendation!.title).toContain('Success Rate');
      expect(
        reliabilityRecommendation!.suggestedActions.some(action =>
          action.action.toLowerCase().includes('retry')
        )
      ).toBe(true);
    });
  });

  describe('health score calculation', () => {
    test('should calculate accurate health scores', async () => {
      const testCases = [
        {
          metrics: generateMockMetrics({
            successRate: 98,
            averageCost: 0.01,
            averageExecutionTime: 1000,
            averageTokens: 100,
          }),
          expectedRange: [90, 100], // Excellent
        },
        {
          metrics: generateMockMetrics({
            successRate: 85,
            averageCost: 0.08,
            averageExecutionTime: 8000,
            averageTokens: 800,
          }),
          expectedRange: [60, 80], // Fair to good
        },
        {
          metrics: generateMockMetrics({
            successRate: 60,
            averageCost: 0.5,
            averageExecutionTime: 40000,
            averageTokens: 3000,
          }),
          expectedRange: [0, 40], // Poor to critical
        },
      ];

      for (const testCase of testCases) {
        jest.spyOn(memoryStore, 'getAgentMetrics').mockResolvedValue(testCase.metrics);
        jest.spyOn(memoryStore, 'getAllAgentMetrics').mockResolvedValue({
          'test-agent': testCase.metrics,
        });

        const profile = await performanceTuner.analyzeAgent('test-agent', 30);

        expect(profile.healthScore).toBeGreaterThanOrEqual(testCase.expectedRange[0]);
        expect(profile.healthScore).toBeLessThanOrEqual(testCase.expectedRange[1]);
      }
    });
  });

  describe('trend analysis', () => {
    test('should correctly identify improving trends', async () => {
      const improvingMetrics = generateMockMetrics({
        costTrend: [
          { date: '2024-01-01', cost: 0.05 },
          { date: '2024-01-02', cost: 0.04 },
          { date: '2024-01-03', cost: 0.03 },
          { date: '2024-01-04', cost: 0.02 },
        ],
        performanceTrend: [
          { date: '2024-01-01', executionTime: 5000 },
          { date: '2024-01-02', executionTime: 4000 },
          { date: '2024-01-03', executionTime: 3000 },
          { date: '2024-01-04', executionTime: 2000 },
        ],
      });

      jest.spyOn(memoryStore, 'getAgentMetrics').mockResolvedValue(improvingMetrics);
      jest.spyOn(memoryStore, 'getAllAgentMetrics').mockResolvedValue({
        'content-agent': improvingMetrics,
      });

      const profile = await performanceTuner.analyzeAgent('content-agent', 30);

      expect(profile.trends.costTrend).toBe('improving');
      expect(profile.trends.performanceTrend).toBe('improving');
    });

    test('should correctly identify declining trends', async () => {
      const decliningMetrics = generateMockMetrics({
        costTrend: [
          { date: '2024-01-01', cost: 0.02 },
          { date: '2024-01-02', cost: 0.03 },
          { date: '2024-01-03', cost: 0.04 },
          { date: '2024-01-04', cost: 0.05 },
        ],
      });

      jest.spyOn(memoryStore, 'getAgentMetrics').mockResolvedValue(decliningMetrics);
      jest.spyOn(memoryStore, 'getAllAgentMetrics').mockResolvedValue({
        'content-agent': decliningMetrics,
      });

      const profile = await performanceTuner.analyzeAgent('content-agent', 30);

      expect(profile.trends.costTrend).toBe('declining');
    });
  });
});

describe('Integration Tests', () => {
  test('should work end-to-end from memory storage to performance analysis', async () => {
    // This would be a more comprehensive integration test
    // that exercises the entire flow from storing memories
    // to generating performance recommendations
    expect(true).toBe(true); // Placeholder
  });
});
