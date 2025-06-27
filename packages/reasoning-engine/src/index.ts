import { EventEmitter } from 'events';
import Redis from 'redis';

// Types for reasoning engine
export interface ReasoningContext {
  id: string;
  sessionId: string;
  userId?: string;
  campaignId?: string;
  history: ContextEntry[];
  metadata: Record<string, any>;
  createdAt: Date;
  lastAccessed: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface ContextEntry {
  id: string;
  type: 'user_input' | 'agent_output' | 'system_message' | 'tool_call' | 'tool_result';
  content: any;
  agentId?: string;
  timestamp: Date;
  tokens?: number;
  metadata?: Record<string, any>;
}

export interface InferenceRequest {
  contextId: string;
  prompt: string;
  agentType?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  metadata?: Record<string, any>;
}

export interface InferenceResult {
  id: string;
  contextId: string;
  content: string;
  agentId?: string;
  tokensUsed: number;
  responseTime: number;
  cached: boolean;
  confidence?: number;
  metadata?: Record<string, any>;
}

export interface AgentRoute {
  agentType: string;
  priority: number;
  capabilities: string[];
  load: number;
  avgResponseTime: number;
  successRate: number;
}

// Context cache with intelligent eviction
export class ContextCache {
  private cache = new Map<string, ReasoningContext>();
  private accessOrder = new Map<string, number>();
  private maxSize: number;
  private redis?: Redis.RedisClientType;
  private metrics = {
    hits: 0,
    misses: 0,
    evictions: 0,
    totalTokens: 0,
  };

  constructor(maxSize: number = 1000, redisUrl?: string) {
    this.maxSize = maxSize;

    if (redisUrl) {
      this.redis = Redis.createClient({ url: redisUrl });
      // eslint-disable-next-line no-console
      this.redis.connect().catch(console.error);
    }
  }

  async get(contextId: string): Promise<ReasoningContext | null> {
    // Check memory cache first
    const memoryContext = this.cache.get(contextId);
    if (memoryContext) {
      this.accessOrder.set(contextId, Date.now());
      memoryContext.lastAccessed = new Date();
      this.metrics.hits++;
      return memoryContext;
    }

    // Check Redis cache
    if (this.redis) {
      try {
        const cached = await this.redis.get(`context:${contextId}`);
        if (cached) {
          const context: ReasoningContext = JSON.parse(cached);
          context.lastAccessed = new Date();

          // Store in memory cache
          this.set(context);
          this.metrics.hits++;
          return context;
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Redis cache error:', error);
      }
    }

    this.metrics.misses++;
    return null;
  }

  async set(context: ReasoningContext): Promise<void> {
    // Evict if at capacity
    if (this.cache.size >= this.maxSize) {
      await this.evictLRU();
    }

    // Update memory cache
    this.cache.set(context.id, context);
    this.accessOrder.set(context.id, Date.now());

    // Update token count
    const tokens = context.history.reduce((sum, entry) => sum + (entry.tokens || 0), 0);
    this.metrics.totalTokens += tokens;

    // Store in Redis with TTL
    if (this.redis) {
      try {
        const ttl = this.getTTL(context.priority);
        await this.redis.setEx(`context:${context.id}`, ttl, JSON.stringify(context));
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Redis cache error:', error);
      }
    }
  }

  private async evictLRU(): Promise<void> {
    if (this.accessOrder.size === 0) return;

    let oldestTime = Date.now();
    let oldestKey = '';

    for (const [key, time] of this.accessOrder.entries()) {
      if (time < oldestTime) {
        oldestTime = time;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.accessOrder.delete(oldestKey);
      this.metrics.evictions++;

      // Remove from Redis
      if (this.redis) {
        await this.redis.del(`context:${oldestKey}`);
      }
    }
  }

  private getTTL(priority: string): number {
    switch (priority) {
      case 'critical':
        return 7200; // 2 hours
      case 'high':
        return 3600; // 1 hour
      case 'medium':
        return 1800; // 30 minutes
      case 'low':
        return 900; // 15 minutes
      default:
        return 1800;
    }
  }

  getMetrics() {
    return {
      ...this.metrics,
      hitRate: this.metrics.hits / (this.metrics.hits + this.metrics.misses),
      cacheSize: this.cache.size,
      avgTokensPerContext: this.metrics.totalTokens / Math.max(this.cache.size, 1),
    };
  }
}

// Intelligent agent router
export class AgentRouter {
  private routes = new Map<string, AgentRoute>();
  private loadBalancer = new Map<string, number>();

  registerAgent(agentType: string, capabilities: string[]): void {
    this.routes.set(agentType, {
      agentType,
      priority: 1,
      capabilities,
      load: 0,
      avgResponseTime: 0,
      successRate: 1.0,
    });
    this.loadBalancer.set(agentType, 0);
  }

  findBestAgent(task: string, context: ReasoningContext): string | null {
    const candidates: Array<{ agentType: string; score: number }> = [];

    for (const [agentType, route] of this.routes.entries()) {
      if (route.capabilities.includes(task)) {
        const score = this.calculateAgentScore(route, context);
        candidates.push({ agentType, score });
      }
    }

    if (candidates.length === 0) {
      return null;
    }

    // Sort by score (higher is better)
    candidates.sort((a, b) => b.score - a.score);

    // Update load balancing
    const bestCandidate = candidates[0];
    if (!bestCandidate) return null;

    const bestAgent = bestCandidate.agentType;
    this.loadBalancer.set(bestAgent, (this.loadBalancer.get(bestAgent) || 0) + 1);

    return bestAgent;
  }

  private calculateAgentScore(route: AgentRoute, context: ReasoningContext): number {
    let score = route.successRate * 100; // Base score from success rate

    // Penalty for high load
    score -= route.load * 10;

    // Bonus for fast response times
    score += Math.max(0, (1000 - route.avgResponseTime) / 100);

    // Priority boost for high-priority contexts
    if (context.priority === 'critical') score += 50;
    else if (context.priority === 'high') score += 25;

    return Math.max(0, score);
  }

  updateAgentMetrics(agentType: string, responseTime: number, success: boolean): void {
    const route = this.routes.get(agentType);
    if (!route) return;

    // Update average response time (exponential moving average)
    route.avgResponseTime = route.avgResponseTime * 0.8 + responseTime * 0.2;

    // Update success rate (exponential moving average)
    route.successRate = route.successRate * 0.9 + (success ? 1 : 0) * 0.1;

    // Decrease load
    route.load = Math.max(0, route.load - 1);
    this.loadBalancer.set(agentType, Math.max(0, (this.loadBalancer.get(agentType) || 0) - 1));
  }

  getRouteStats(): Array<AgentRoute> {
    return Array.from(this.routes.values());
  }
}

// Main reasoning engine with streaming and caching
export class ReasoningEngine extends EventEmitter {
  private contextCache: ContextCache;
  private agentRouter: AgentRouter;
  private activeInferences = new Map<string, InferenceRequest>();
  private metrics = {
    totalInferences: 0,
    avgResponseTime: 0,
    streamingRequests: 0,
    cachedResponses: 0,
  };

  constructor(
    options: {
      maxCacheSize?: number;
      redisUrl?: string;
    } = {}
  ) {
    super();
    this.contextCache = new ContextCache(options.maxCacheSize, options.redisUrl);
    this.agentRouter = new AgentRouter();
  }

  async createContext(
    sessionId: string,
    userId?: string,
    campaignId?: string
  ): Promise<ReasoningContext> {
    const context: ReasoningContext = {
      id: `ctx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sessionId,
      ...(userId && { userId }),
      ...(campaignId && { campaignId }),
      history: [],
      metadata: {},
      createdAt: new Date(),
      lastAccessed: new Date(),
      priority: 'medium',
    };

    await this.contextCache.set(context);
    return context;
  }

  async addToContext(
    contextId: string,
    entry: Omit<ContextEntry, 'id' | 'timestamp'>
  ): Promise<void> {
    const context = await this.contextCache.get(contextId);
    if (!context) {
      throw new Error(`Context not found: ${contextId}`);
    }

    const contextEntry: ContextEntry = {
      ...entry,
      id: `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };

    context.history.push(contextEntry);
    context.lastAccessed = new Date();

    // Limit context window size (keep last 50 entries)
    if (context.history.length > 50) {
      context.history = context.history.slice(-50);
    }

    await this.contextCache.set(context);
  }

  async processInference(
    request: InferenceRequest
  ): Promise<InferenceResult | AsyncIterable<string>> {
    const startTime = Date.now();
    const inferenceId = `inf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    this.activeInferences.set(inferenceId, request);
    this.metrics.totalInferences++;

    try {
      const context = await this.contextCache.get(request.contextId);
      if (!context) {
        throw new Error(`Context not found: ${request.contextId}`);
      }

      // Check for cached response
      const cacheKey = this.generateCacheKey(request, context);
      const cachedResult = await this.getCachedResponse(cacheKey);

      if (cachedResult) {
        this.metrics.cachedResponses++;
        return cachedResult;
      }

      // Find best agent for the task
      const bestAgent = this.agentRouter.findBestAgent(request.agentType || 'general', context);

      if (request.stream) {
        this.metrics.streamingRequests++;
        return this.processStreamingInference(request, context, bestAgent);
      } else {
        return await this.processBatchInference(request, context, bestAgent);
      }
    } finally {
      this.activeInferences.delete(inferenceId);
      const responseTime = Date.now() - startTime;
      this.metrics.avgResponseTime = this.metrics.avgResponseTime * 0.9 + responseTime * 0.1;
    }
  }

  private async processBatchInference(
    request: InferenceRequest,
    _context: ReasoningContext,
    agentId: string | null
  ): Promise<InferenceResult> {
    const startTime = Date.now();

    // Mock inference - in production this would call actual AI models
    // Add realistic delay for testing
    await new Promise(resolve => setTimeout(resolve, 10));
    const mockResponse = `AI response for: ${request.prompt.substring(0, 50)}...`;
    const responseTime = Date.now() - startTime;

    const result: InferenceResult = {
      id: `result_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      contextId: request.contextId,
      content: mockResponse,
      ...(agentId && { agentId }),
      tokensUsed: Math.floor(mockResponse.length / 4), // Rough token estimate
      responseTime,
      cached: false,
      confidence: 0.95,
    };

    // Update agent metrics
    if (agentId) {
      this.agentRouter.updateAgentMetrics(agentId, responseTime, true);
    }

    // Add to context
    await this.addToContext(request.contextId, {
      type: 'agent_output',
      content: result.content,
      ...(agentId && { agentId }),
      tokens: result.tokensUsed,
    });

    return result;
  }

  private async *processStreamingInference(
    request: InferenceRequest,
    _context: ReasoningContext,
    agentId: string | null
  ): AsyncIterable<string> {
    // Mock streaming response - in production this would stream from AI models
    const fullResponse = `Streaming AI response for: ${request.prompt}`;
    const words = fullResponse.split(' ');

    for (const word of words) {
      yield `${word} `;
      await new Promise(resolve => setTimeout(resolve, 50)); // Simulate streaming delay
    }

    // Update context with full response
    await this.addToContext(request.contextId, {
      type: 'agent_output',
      content: fullResponse,
      ...(agentId && { agentId }),
      tokens: Math.floor(fullResponse.length / 4),
    });
  }

  private generateCacheKey(request: InferenceRequest, context: ReasoningContext): string {
    const contextHash = context.history
      .slice(-5)
      .map(h => h.content)
      .join('|');
    return `cache:${request.prompt}:${contextHash}:${request.agentType}`;
  }

  private async getCachedResponse(_cacheKey: string): Promise<InferenceResult | null> {
    // Simple in-memory cache for now - in production use Redis with proper TTL
    return null;
  }

  registerAgentType(agentType: string, capabilities: string[]): void {
    this.agentRouter.registerAgent(agentType, capabilities);
  }

  getMetrics() {
    return {
      ...this.metrics,
      cache: this.contextCache.getMetrics(),
      agents: this.agentRouter.getRouteStats(),
      activeInferences: this.activeInferences.size,
    };
  }

  async cleanup(): Promise<void> {
    this.removeAllListeners();
    // Additional cleanup if needed
  }
}

// Main interfaces and classes are exported inline above
