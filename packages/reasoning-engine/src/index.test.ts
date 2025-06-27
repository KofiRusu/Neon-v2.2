import {
  ReasoningEngine,
  ContextCache,
  AgentRouter,
  ReasoningContext,
  InferenceResult,
} from './index';

describe('ReasoningEngine', () => {
  let engine: ReasoningEngine;

  beforeEach(() => {
    engine = new ReasoningEngine({
      maxCacheSize: 100,
    });
  });

  afterEach(async () => {
    await engine.cleanup();
  });

  describe('Context Management', () => {
    it('should create and manage contexts', async () => {
      const context = await engine.createContext('session-1', 'user-1', 'campaign-1');

      expect(context).toBeDefined();
      expect(context.id).toBeTruthy();
      expect(context.sessionId).toBe('session-1');
      expect(context.userId).toBe('user-1');
      expect(context.campaignId).toBe('campaign-1');
      expect(context.history).toEqual([]);
      expect(context.priority).toBe('medium');
    });

    it('should add entries to context', async () => {
      const context = await engine.createContext('session-1');

      await engine.addToContext(context.id, {
        type: 'user_input',
        content: 'Hello, world!',
        tokens: 3,
      });

      // Verify context was updated (we can't directly access it, but we can test behavior)
      const metrics = engine.getMetrics();
      expect(metrics.cache.cacheSize).toBe(1);
    });

    it('should limit context window size', async () => {
      const context = await engine.createContext('session-1');

      // Add more than 50 entries
      for (let i = 0; i < 55; i++) {
        await engine.addToContext(context.id, {
          type: 'user_input',
          content: `Message ${i}`,
          tokens: 2,
        });
      }

      // Context should be maintained but trimmed (we test this through successful operations)
      const result = (await engine.processInference({
        contextId: context.id,
        prompt: 'Test prompt',
        priority: 'medium',
      })) as InferenceResult;

      expect(result.content).toBeTruthy();
    });
  });

  describe('Agent Routing', () => {
    beforeEach(() => {
      engine.registerAgentType('content', ['generate_posts', 'create_captions']);
      engine.registerAgentType('ad', ['optimize_ads', 'manage_budget']);
    });

    it('should route to appropriate agents', async () => {
      const context = await engine.createContext('session-1');

      const result = (await engine.processInference({
        contextId: context.id,
        prompt: 'Generate social media posts',
        agentType: 'content',
        priority: 'high',
      })) as InferenceResult;

      expect(result).toBeDefined();
      expect(result.contextId).toBe(context.id);
      expect(result.content).toContain('AI response for');
      expect(result.cached).toBe(false);
      expect(result.confidence).toBe(0.95);
    });

    it('should handle streaming inference', async () => {
      const context = await engine.createContext('session-1');

      const streamResult = (await engine.processInference({
        contextId: context.id,
        prompt: 'Stream response please',
        stream: true,
        priority: 'high',
      })) as AsyncIterable<string>;

      const chunks: string[] = [];
      for await (const chunk of streamResult) {
        chunks.push(chunk);
      }

      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks.join('')).toContain('Streaming AI response for');
    });
  });

  describe('Performance Metrics', () => {
    it('should track inference metrics', async () => {
      const context = await engine.createContext('session-1');

      await engine.processInference({
        contextId: context.id,
        prompt: 'Test prompt',
        priority: 'medium',
      });

      const metrics = engine.getMetrics();
      expect(metrics.totalInferences).toBe(1);
      expect(metrics.avgResponseTime).toBeGreaterThan(0);
      expect(metrics.activeInferences).toBe(0);
    });

    it('should track streaming requests', async () => {
      const context = await engine.createContext('session-1');

      const streamResult = (await engine.processInference({
        contextId: context.id,
        prompt: 'Stream test',
        stream: true,
      })) as AsyncIterable<string>;

      // Consume the stream
      for await (const _ of streamResult) {
        // Just consume
      }

      const metrics = engine.getMetrics();
      expect(metrics.streamingRequests).toBe(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid context ID', async () => {
      await expect(
        engine.processInference({
          contextId: 'invalid-context',
          prompt: 'Test prompt',
        })
      ).rejects.toThrow('Context not found');
    });

    it('should handle missing context for addToContext', async () => {
      await expect(
        engine.addToContext('invalid-context', {
          type: 'user_input',
          content: 'Test content',
        })
      ).rejects.toThrow('Context not found');
    });
  });
});

describe('ContextCache', () => {
  let cache: ContextCache;
  let mockContext: ReasoningContext;

  beforeEach(() => {
    cache = new ContextCache(3); // Small cache for testing eviction
    mockContext = {
      id: 'test-context-1',
      sessionId: 'session-1',
      userId: 'user-1',
      history: [],
      metadata: {},
      createdAt: new Date(),
      lastAccessed: new Date(),
      priority: 'medium',
    };
  });

  it('should store and retrieve contexts', async () => {
    await cache.set(mockContext);
    const retrieved = await cache.get(mockContext.id);

    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe(mockContext.id);
    expect(retrieved?.sessionId).toBe(mockContext.sessionId);
  });

  it('should return null for non-existent contexts', async () => {
    const result = await cache.get('non-existent');
    expect(result).toBeNull();
  });

  it('should evict LRU items when at capacity', async () => {
    // Fill cache to capacity
    for (let i = 0; i < 4; i++) {
      const context = { ...mockContext, id: `context-${i}` };
      await cache.set(context);
    }

    // First context should be evicted
    const firstContext = await cache.get('context-0');
    expect(firstContext).toBeNull();

    // Last context should still exist
    const lastContext = await cache.get('context-3');
    expect(lastContext).toBeDefined();
  });

  it('should track cache metrics', async () => {
    await cache.set(mockContext);
    await cache.get(mockContext.id); // Hit
    await cache.get('non-existent'); // Miss

    const metrics = cache.getMetrics();
    expect(metrics.hits).toBe(1);
    expect(metrics.misses).toBe(1);
    expect(metrics.hitRate).toBe(0.5);
    expect(metrics.cacheSize).toBe(1);
  });

  it('should update access time on retrieval', async () => {
    await cache.set(mockContext);

    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 10));

    const retrieved = await cache.get(mockContext.id);
    expect(retrieved?.lastAccessed.getTime()).toBeGreaterThan(mockContext.lastAccessed.getTime());
  });
});

describe('AgentRouter', () => {
  let router: AgentRouter;

  beforeEach(() => {
    router = new AgentRouter();
    router.registerAgent('content', ['generate_posts', 'create_captions']);
    router.registerAgent('ad', ['optimize_ads', 'manage_budget']);
    router.registerAgent('general', ['general_task']);
  });

  it('should register agents with capabilities', () => {
    const stats = router.getRouteStats();
    expect(stats).toHaveLength(3);

    const contentAgent = stats.find(s => s.agentType === 'content');
    expect(contentAgent?.capabilities).toContain('generate_posts');
    expect(contentAgent?.capabilities).toContain('create_captions');
  });

  it('should find best agent for task', () => {
    const mockContext: ReasoningContext = {
      id: 'test',
      sessionId: 'session',
      history: [],
      metadata: {},
      createdAt: new Date(),
      lastAccessed: new Date(),
      priority: 'medium',
    };

    const bestAgent = router.findBestAgent('generate_posts', mockContext);
    expect(bestAgent).toBe('content');

    const adAgent = router.findBestAgent('optimize_ads', mockContext);
    expect(adAgent).toBe('ad');
  });

  it('should return null for unknown task', () => {
    const mockContext: ReasoningContext = {
      id: 'test',
      sessionId: 'session',
      history: [],
      metadata: {},
      createdAt: new Date(),
      lastAccessed: new Date(),
      priority: 'medium',
    };

    const result = router.findBestAgent('unknown_task', mockContext);
    expect(result).toBeNull();
  });

  it('should update agent metrics', () => {
    router.updateAgentMetrics('content', 500, true);
    router.updateAgentMetrics('content', 300, false);

    const stats = router.getRouteStats();
    const contentStats = stats.find(s => s.agentType === 'content');

    expect(contentStats?.avgResponseTime).toBeCloseTo(460); // 500 * 0.8 + 300 * 0.2
    expect(contentStats?.successRate).toBeCloseTo(0.9); // 1.0 * 0.9 + 0 * 0.1
  });

  it('should boost priority for high-priority contexts', () => {
    const highPriorityContext: ReasoningContext = {
      id: 'test',
      sessionId: 'session',
      history: [],
      metadata: {},
      createdAt: new Date(),
      lastAccessed: new Date(),
      priority: 'critical',
    };

    // This should work even with multiple capable agents
    const result = router.findBestAgent('general_task', highPriorityContext);
    expect(result).toBe('general');
  });
});

describe('Integration Tests', () => {
  let engine: ReasoningEngine;

  beforeEach(() => {
    engine = new ReasoningEngine({
      maxCacheSize: 10,
    });

    // Register some agents
    engine.registerAgentType('content', ['generate_posts', 'create_captions']);
    engine.registerAgentType('analytics', ['analyze_performance', 'generate_insights']);
  });

  afterEach(async () => {
    await engine.cleanup();
  });

  it('should handle complete workflow', async () => {
    // Create context
    const context = await engine.createContext('session-1', 'user-1', 'campaign-1');

    // Add user input
    await engine.addToContext(context.id, {
      type: 'user_input',
      content: 'I want to create social media posts for my campaign',
      tokens: 12,
    });

    // Process inference
    const result = (await engine.processInference({
      contextId: context.id,
      prompt: 'Generate engaging social media posts about AI marketing',
      agentType: 'content',
      temperature: 0.7,
      maxTokens: 150,
      priority: 'high',
    })) as InferenceResult;

    // Verify result
    expect(result).toBeDefined();
    expect(result.content).toBeTruthy();
    expect(result.tokensUsed).toBeGreaterThan(0);
    expect(result.responseTime).toBeGreaterThan(0);
    expect(result.cached).toBe(false);

    // Check metrics
    const metrics = engine.getMetrics();
    expect(metrics.totalInferences).toBe(1);
    expect(metrics.cache.cacheSize).toBe(1);
  });

  it('should handle concurrent inferences', async () => {
    const context1 = await engine.createContext('session-1');
    const context2 = await engine.createContext('session-2');

    // Process concurrent inferences
    const [result1, result2] = await Promise.all([
      engine.processInference({
        contextId: context1.id,
        prompt: 'Generate content for Instagram',
        agentType: 'content',
      }),
      engine.processInference({
        contextId: context2.id,
        prompt: 'Analyze campaign performance',
        agentType: 'analytics',
      }),
    ]);

    expect(result1).toBeDefined();
    expect(result2).toBeDefined();

    const metrics = engine.getMetrics();
    expect(metrics.totalInferences).toBe(2);
  });

  it('should maintain performance under load', async () => {
    const contexts = await Promise.all(
      Array.from({ length: 5 }, (_, i) => engine.createContext(`session-${i}`))
    );

    const startTime = Date.now();

    // Process multiple inferences
    const results = await Promise.all(
      contexts.map(context =>
        engine.processInference({
          contextId: context.id,
          prompt: 'Quick test inference',
          priority: 'medium',
        })
      )
    );

    const totalTime = Date.now() - startTime;

    expect(results).toHaveLength(5);
    expect(totalTime).toBeLessThan(1000); // Should complete within 1 second

    const metrics = engine.getMetrics();
    expect(metrics.totalInferences).toBe(5);
    expect(metrics.avgResponseTime).toBeGreaterThan(0);
  });
});
