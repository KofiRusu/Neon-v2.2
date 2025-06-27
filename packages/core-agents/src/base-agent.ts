import { z } from 'zod';
import { logger } from '@neon/utils';
import { AgentMemoryStore } from './memory/AgentMemoryStore';

// Base schemas for agent communication
export const AgentPayloadSchema = z.object({
  task: z.string(),
  context: z.record(z.any()).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  deadline: z.date().optional(),
  metadata: z.record(z.any()).optional(),
});

export const AgentResultSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  performance: z.number().optional(),
  metadata: z.record(z.any()).optional(),
});

export const AgentStatusSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  status: z.enum(['idle', 'running', 'error', 'maintenance']),
  lastExecution: z.date().optional(),
  performance: z.number().optional(),
  capabilities: z.array(z.string()),
});

export type AgentPayload = z.infer<typeof AgentPayloadSchema>;
export type AgentResult = z.infer<typeof AgentResultSchema>;
export type AgentStatus = z.infer<typeof AgentStatusSchema>;

export interface BaseAgent {
  id: string;
  name: string;
  type: string;
  capabilities: string[];

  execute(payload: AgentPayload): Promise<AgentResult>;
  getStatus(): Promise<AgentStatus>;
  validatePayload(payload: AgentPayload): boolean;
  getCapabilities(): string[];
}

export abstract class AbstractAgent implements BaseAgent {
  public readonly id: string;
  public readonly name: string;
  public readonly type: string;
  public readonly capabilities: string[];

  protected status: 'idle' | 'running' | 'error' | 'maintenance' = 'idle';
  protected lastExecution?: Date;
  protected performance?: number;
  protected memoryStore: AgentMemoryStore;

  constructor(
    id: string,
    name: string,
    type: string,
    capabilities: string[] = [],
    memoryStore?: AgentMemoryStore
  ) {
    this.id = id;
    this.name = name;
    this.type = type;
    this.capabilities = capabilities;
    this.memoryStore = memoryStore || new AgentMemoryStore();
  }

  abstract execute(payload: AgentPayload): Promise<AgentResult>;

  async getStatus(): Promise<AgentStatus> {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      status: this.status,
      lastExecution: this.lastExecution,
      performance: this.performance,
      capabilities: this.capabilities,
    };
  }

  validatePayload(payload: AgentPayload): boolean {
    try {
      AgentPayloadSchema.parse(payload);
      return true;
    } catch (error) {
      logger.error(
        `Invalid payload for agent ${this.name}`,
        { error, agentName: this.name },
        'AgentValidation'
      );
      return false;
    }
  }

  getCapabilities(): string[] {
    return this.capabilities;
  }

  protected setStatus(status: 'idle' | 'running' | 'error' | 'maintenance'): void {
    this.status = status;
  }

  protected setPerformance(performance: number): void {
    this.performance = performance;
  }

  protected setLastExecution(date: Date): void {
    this.lastExecution = date;
  }

  protected async executeWithErrorHandling(
    payload: AgentPayload,
    executionFn: () => Promise<unknown>
  ): Promise<AgentResult> {
    const startTime = Date.now();
    const sessionId = payload.metadata?.sessionId || `session-${Date.now()}`;
    const userId = payload.metadata?.userId;

    try {
      this.setStatus('running');

      if (!this.validatePayload(payload)) {
        throw new Error('Invalid payload');
      }

      const result = await executionFn();
      const executionTime = Date.now() - startTime;

      this.setStatus('idle');
      this.setLastExecution(new Date());
      this.setPerformance(executionTime);

      const agentResult = {
        success: true,
        data: result,
        performance: executionTime,
        metadata: {
          agentId: this.id,
          agentName: this.name,
          executionTime,
          timestamp: new Date().toISOString(),
        },
      };

      // Store successful execution in memory
      await this.storeMemory(sessionId, payload, agentResult, {
        userId,
        executionTime,
        success: true,
        tokensUsed: this.extractTokensUsed(result),
        cost: this.estimateCost(result),
      });

      return agentResult;
    } catch (error) {
      this.setStatus('error');
      const executionTime = Date.now() - startTime;

      const agentResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        performance: executionTime,
        metadata: {
          agentId: this.id,
          agentName: this.name,
          error: error instanceof Error ? error.stack : error,
          timestamp: new Date().toISOString(),
        },
      };

      // Store failed execution in memory
      await this.storeMemory(sessionId, payload, agentResult, {
        userId,
        executionTime,
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        tokensUsed: 0,
        cost: 0,
      });

      return agentResult;
    }
  }

  /**
   * Store execution in memory for learning and analysis
   */
  protected async storeMemory(
    sessionId: string,
    input: AgentPayload,
    output: AgentResult,
    metadata: {
      userId?: string;
      executionTime: number;
      success: boolean;
      tokensUsed?: number;
      cost?: number;
      score?: number;
      errorMessage?: string;
    }
  ): Promise<void> {
    try {
      await this.memoryStore.storeMemory(this.id, sessionId, input, output, metadata);
    } catch (error) {
      logger.error(
        `Failed to store memory for agent ${this.name}`,
        { error, agentId: this.id },
        'AgentMemory'
      );
    }
  }

  /**
   * Get last successful runs for context
   */
  protected async getLastSuccessfulRuns(count: number = 3): Promise<any[]> {
    try {
      const memories = await this.memoryStore.getLastSuccessfulRuns(this.id, count);
      return memories.map(m => ({
        input: m.input,
        output: m.output,
        timestamp: m.timestamp,
        executionTime: m.executionTime,
      }));
    } catch (error) {
      logger.error(
        `Failed to retrieve successful runs for agent ${this.name}`,
        { error, agentId: this.id },
        'AgentMemory'
      );
      return [];
    }
  }

  /**
   * Extract tokens used from result (override in specific agents)
   */
  protected extractTokensUsed(result: unknown): number {
    // Default implementation - agents can override for specific token tracking
    if (typeof result === 'object' && result !== null && 'tokensUsed' in result) {
      return (result as any).tokensUsed || 0;
    }
    return 0;
  }

  /**
   * Estimate cost from result (override in specific agents)
   */
  protected estimateCost(result: unknown): number {
    // Default implementation - agents can override for specific cost calculation
    const tokens = this.extractTokensUsed(result);
    // Rough estimate: $0.002 per 1K tokens (GPT-4 pricing)
    return (tokens / 1000) * 0.002;
  }

  /**
   * Get agent performance metrics
   */
  async getPerformanceMetrics(days: number = 30): Promise<any> {
    try {
      return await this.memoryStore.getAgentMetrics(this.id, days);
    } catch (error) {
      logger.error(
        `Failed to get performance metrics for agent ${this.name}`,
        { error, agentId: this.id },
        'AgentMemory'
      );
      return null;
    }
  }
}

// Agent factory for creating agent instances
export class AgentFactory {
  private static agents = new Map<
    string,
    new (id: string, name: string, ...args: unknown[]) => BaseAgent
  >();

  static registerAgent(
    type: string,
    agentClass: new (id: string, name: string, ...args: unknown[]) => BaseAgent
  ): void {
    this.agents.set(type, agentClass);
  }

  static createAgent(type: string, id: string, name: string, ...args: unknown[]): BaseAgent {
    const AgentClass = this.agents.get(type);
    if (!AgentClass) {
      throw new Error(`Unknown agent type: ${type}`);
    }
    return new AgentClass(id, name, ...args);
  }

  static getAvailableTypes(): string[] {
    return Array.from(this.agents.keys());
  }
}

// Agent manager for orchestrating multiple agents
export class AgentManager {
  private agents = new Map<string, BaseAgent>();

  registerAgent(agent: BaseAgent): void {
    this.agents.set(agent.id, agent);
  }

  getAgent(id: string): BaseAgent | undefined {
    return this.agents.get(id);
  }

  getAllAgents(): BaseAgent[] {
    return Array.from(this.agents.values());
  }

  async executeAgent(id: string, payload: AgentPayload): Promise<AgentResult> {
    const agent = this.getAgent(id);
    if (!agent) {
      throw new Error(`Agent not found: ${id}`);
    }
    return await agent.execute(payload);
  }

  async getAgentStatus(id: string): Promise<AgentStatus | null> {
    const agent = this.getAgent(id);
    if (!agent) {
      return null;
    }
    return await agent.getStatus();
  }

  async getAllAgentStatuses(): Promise<AgentStatus[]> {
    const statuses = await Promise.all(this.getAllAgents().map(agent => agent.getStatus()));
    return statuses;
  }

  getAgentsByType(type: string): BaseAgent[] {
    return this.getAllAgents().filter(agent => agent.type === type);
  }

  getAgentsByCapability(capability: string): BaseAgent[] {
    return this.getAllAgents().filter(agent => agent.getCapabilities().includes(capability));
  }
}
