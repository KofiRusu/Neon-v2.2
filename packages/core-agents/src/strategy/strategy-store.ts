import { CampaignStrategy, AgentAction } from './CampaignStrategyPlanner';
import { StrategyTemplate } from './strategy-templates';

export interface StrategyStore {
  strategies: Record<string, CampaignStrategy>;
  activeStrategy: string | null;
  executionStates: Record<string, StrategyExecutionState>;
}

export interface StrategyExecutionState {
  strategyId: string;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed';
  currentStage: string;
  completedActions: string[];
  runningActions: string[];
  failedActions: Array<{
    actionId: string;
    error: string;
    timestamp: Date;
  }>;
  startedAt?: Date;
  completedAt?: Date;
  progress: {
    totalActions: number;
    completedActions: number;
    percentage: number;
  };
  metrics: {
    totalCost: number;
    totalDuration: number;
    successRate: number;
    averageActionTime: number;
  };
  logs: Array<{
    actionId: string;
    event: 'started' | 'completed' | 'failed' | 'skipped';
    timestamp: Date;
    details?: any;
  }>;
}

export interface StrategyStorageAdapter {
  saveStrategy(strategy: CampaignStrategy): Promise<void>;
  loadStrategy(id: string): Promise<CampaignStrategy | null>;
  loadAllStrategies(): Promise<CampaignStrategy[]>;
  deleteStrategy(id: string): Promise<void>;
  updateStrategy(id: string, updates: Partial<CampaignStrategy>): Promise<void>;
  saveExecutionState(state: StrategyExecutionState): Promise<void>;
  loadExecutionState(strategyId: string): Promise<StrategyExecutionState | null>;
}

export class InMemoryStrategyAdapter implements StrategyStorageAdapter {
  private strategies: Map<string, CampaignStrategy> = new Map();
  private executionStates: Map<string, StrategyExecutionState> = new Map();

  async saveStrategy(strategy: CampaignStrategy): Promise<void> {
    this.strategies.set(strategy.id, { ...strategy });
  }

  async loadStrategy(id: string): Promise<CampaignStrategy | null> {
    return this.strategies.get(id) || null;
  }

  async loadAllStrategies(): Promise<CampaignStrategy[]> {
    return Array.from(this.strategies.values());
  }

  async deleteStrategy(id: string): Promise<void> {
    this.strategies.delete(id);
    this.executionStates.delete(id);
  }

  async updateStrategy(id: string, updates: Partial<CampaignStrategy>): Promise<void> {
    const existing = this.strategies.get(id);
    if (existing) {
      this.strategies.set(id, { ...existing, ...updates, updatedAt: new Date() });
    }
  }

  async saveExecutionState(state: StrategyExecutionState): Promise<void> {
    this.executionStates.set(state.strategyId, { ...state });
  }

  async loadExecutionState(strategyId: string): Promise<StrategyExecutionState | null> {
    return this.executionStates.get(strategyId) || null;
  }
}

export class DatabaseStrategyAdapter implements StrategyStorageAdapter {
  private prisma: any; // PrismaClient would be imported here

  constructor(prisma: any) {
    this.prisma = prisma;
  }

  async saveStrategy(strategy: CampaignStrategy): Promise<void> {
    await this.prisma.campaignStrategy.upsert({
      where: { id: strategy.id },
      update: {
        name: strategy.name,
        goal: strategy.goal,
        audience: strategy.audience,
        context: strategy.context,
        actions: strategy.actions,
        timeline: strategy.timeline,
        estimatedCost: strategy.estimatedCost,
        estimatedDuration: strategy.estimatedDuration,
        brandAlignment: strategy.brandAlignment,
        successProbability: strategy.successProbability,
        status: strategy.status,
        metadata: strategy.metadata,
        updatedAt: new Date(),
      },
      create: {
        id: strategy.id,
        name: strategy.name,
        goal: strategy.goal,
        audience: strategy.audience,
        context: strategy.context,
        actions: strategy.actions,
        timeline: strategy.timeline,
        estimatedCost: strategy.estimatedCost,
        estimatedDuration: strategy.estimatedDuration,
        brandAlignment: strategy.brandAlignment,
        successProbability: strategy.successProbability,
        status: strategy.status,
        metadata: strategy.metadata,
        createdAt: strategy.createdAt,
        updatedAt: strategy.updatedAt,
      },
    });
  }

  async loadStrategy(id: string): Promise<CampaignStrategy | null> {
    const strategy = await this.prisma.campaignStrategy.findUnique({
      where: { id },
    });
    return strategy ? this.mapDbToStrategy(strategy) : null;
  }

  async loadAllStrategies(): Promise<CampaignStrategy[]> {
    const strategies = await this.prisma.campaignStrategy.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return strategies.map(this.mapDbToStrategy);
  }

  async deleteStrategy(id: string): Promise<void> {
    await this.prisma.campaignStrategy.delete({
      where: { id },
    });
  }

  async updateStrategy(id: string, updates: Partial<CampaignStrategy>): Promise<void> {
    await this.prisma.campaignStrategy.update({
      where: { id },
      data: { ...updates, updatedAt: new Date() },
    });
  }

  async saveExecutionState(state: StrategyExecutionState): Promise<void> {
    await this.prisma.strategyExecutionState.upsert({
      where: { strategyId: state.strategyId },
      update: {
        status: state.status,
        currentStage: state.currentStage,
        completedActions: state.completedActions,
        runningActions: state.runningActions,
        failedActions: state.failedActions,
        startedAt: state.startedAt,
        completedAt: state.completedAt,
        progress: state.progress,
        metrics: state.metrics,
        logs: state.logs,
      },
      create: {
        strategyId: state.strategyId,
        status: state.status,
        currentStage: state.currentStage,
        completedActions: state.completedActions,
        runningActions: state.runningActions,
        failedActions: state.failedActions,
        startedAt: state.startedAt,
        completedAt: state.completedAt,
        progress: state.progress,
        metrics: state.metrics,
        logs: state.logs,
      },
    });
  }

  async loadExecutionState(strategyId: string): Promise<StrategyExecutionState | null> {
    const state = await this.prisma.strategyExecutionState.findUnique({
      where: { strategyId },
    });
    return state || null;
  }

  private mapDbToStrategy(dbStrategy: any): CampaignStrategy {
    return {
      id: dbStrategy.id,
      name: dbStrategy.name,
      goal: dbStrategy.goal,
      audience: dbStrategy.audience,
      context: dbStrategy.context,
      actions: dbStrategy.actions,
      timeline: dbStrategy.timeline,
      estimatedCost: dbStrategy.estimatedCost,
      estimatedDuration: dbStrategy.estimatedDuration,
      brandAlignment: dbStrategy.brandAlignment,
      successProbability: dbStrategy.successProbability,
      createdAt: dbStrategy.createdAt,
      updatedAt: dbStrategy.updatedAt,
      status: dbStrategy.status,
      metadata: dbStrategy.metadata,
    };
  }
}

export class StrategyManager {
  private adapter: StrategyStorageAdapter;
  private strategies: Map<string, CampaignStrategy> = new Map();
  private executionStates: Map<string, StrategyExecutionState> = new Map();

  constructor(adapter: StrategyStorageAdapter) {
    this.adapter = adapter;
  }

  /**
   * Save a new strategy
   */
  async saveStrategy(strategy: CampaignStrategy): Promise<void> {
    this.strategies.set(strategy.id, strategy);
    await this.adapter.saveStrategy(strategy);
  }

  /**
   * Load a strategy by ID
   */
  async loadStrategy(id: string): Promise<CampaignStrategy | null> {
    // Check cache first
    if (this.strategies.has(id)) {
      return this.strategies.get(id)!;
    }

    // Load from storage
    const strategy = await this.adapter.loadStrategy(id);
    if (strategy) {
      this.strategies.set(id, strategy);
    }
    return strategy;
  }

  /**
   * Load all strategies
   */
  async loadAllStrategies(): Promise<CampaignStrategy[]> {
    const strategies = await this.adapter.loadAllStrategies();
    strategies.forEach(strategy => {
      this.strategies.set(strategy.id, strategy);
    });
    return strategies;
  }

  /**
   * Update strategy status and metadata
   */
  async updateStrategy(id: string, updates: Partial<CampaignStrategy>): Promise<void> {
    const existing = await this.loadStrategy(id);
    if (!existing) {
      throw new Error(`Strategy ${id} not found`);
    }

    const updated = { ...existing, ...updates, updatedAt: new Date() };
    this.strategies.set(id, updated);
    await this.adapter.updateStrategy(id, updates);
  }

  /**
   * Delete a strategy
   */
  async deleteStrategy(id: string): Promise<void> {
    this.strategies.delete(id);
    this.executionStates.delete(id);
    await this.adapter.deleteStrategy(id);
  }

  /**
   * Initialize execution state for a strategy
   */
  async initializeExecution(strategyId: string): Promise<StrategyExecutionState> {
    const strategy = await this.loadStrategy(strategyId);
    if (!strategy) {
      throw new Error(`Strategy ${strategyId} not found`);
    }

    const executionState: StrategyExecutionState = {
      strategyId,
      status: 'pending',
      currentStage: strategy.timeline[0]?.stage || 'unknown',
      completedActions: [],
      runningActions: [],
      failedActions: [],
      progress: {
        totalActions: strategy.actions.length,
        completedActions: 0,
        percentage: 0,
      },
      metrics: {
        totalCost: 0,
        totalDuration: 0,
        successRate: 100,
        averageActionTime: 0,
      },
      logs: [],
    };

    this.executionStates.set(strategyId, executionState);
    await this.adapter.saveExecutionState(executionState);
    return executionState;
  }

  /**
   * Update execution state
   */
  async updateExecutionState(
    strategyId: string,
    updates: Partial<StrategyExecutionState>
  ): Promise<void> {
    const existing =
      this.executionStates.get(strategyId) || (await this.adapter.loadExecutionState(strategyId));
    if (!existing) {
      throw new Error(`Execution state for strategy ${strategyId} not found`);
    }

    const updated = { ...existing, ...updates };
    this.executionStates.set(strategyId, updated);
    await this.adapter.saveExecutionState(updated);
  }

  /**
   * Get execution state
   */
  async getExecutionState(strategyId: string): Promise<StrategyExecutionState | null> {
    if (this.executionStates.has(strategyId)) {
      return this.executionStates.get(strategyId)!;
    }

    const state = await this.adapter.loadExecutionState(strategyId);
    if (state) {
      this.executionStates.set(strategyId, state);
    }
    return state;
  }

  /**
   * Log action event
   */
  async logActionEvent(
    strategyId: string,
    actionId: string,
    event: 'started' | 'completed' | 'failed' | 'skipped',
    details?: any
  ): Promise<void> {
    const state = await this.getExecutionState(strategyId);
    if (!state) return;

    const logEntry = {
      actionId,
      event,
      timestamp: new Date(),
      details,
    };

    state.logs.push(logEntry);

    // Update action tracking
    if (event === 'started') {
      if (!state.runningActions.includes(actionId)) {
        state.runningActions.push(actionId);
      }
    } else if (event === 'completed') {
      state.runningActions = state.runningActions.filter(id => id !== actionId);
      if (!state.completedActions.includes(actionId)) {
        state.completedActions.push(actionId);
      }
    } else if (event === 'failed') {
      state.runningActions = state.runningActions.filter(id => id !== actionId);
      state.failedActions.push({
        actionId,
        error: details?.error || 'Unknown error',
        timestamp: new Date(),
      });
    }

    // Update progress
    state.progress.completedActions = state.completedActions.length;
    state.progress.percentage = (state.completedActions.length / state.progress.totalActions) * 100;

    await this.updateExecutionState(strategyId, state);
  }

  /**
   * Get strategies by status
   */
  async getStrategiesByStatus(status: CampaignStrategy['status']): Promise<CampaignStrategy[]> {
    const allStrategies = await this.loadAllStrategies();
    return allStrategies.filter(strategy => strategy.status === status);
  }

  /**
   * Get active executions
   */
  async getActiveExecutions(): Promise<StrategyExecutionState[]> {
    const allStrategies = await this.loadAllStrategies();
    const activeExecutions: StrategyExecutionState[] = [];

    for (const strategy of allStrategies) {
      const executionState = await this.getExecutionState(strategy.id);
      if (executionState && ['running', 'pending'].includes(executionState.status)) {
        activeExecutions.push(executionState);
      }
    }

    return activeExecutions;
  }

  /**
   * Clone a strategy for reuse
   */
  async cloneStrategy(sourceId: string, newName?: string): Promise<CampaignStrategy> {
    const source = await this.loadStrategy(sourceId);
    if (!source) {
      throw new Error(`Strategy ${sourceId} not found`);
    }

    const cloned: CampaignStrategy = {
      ...source,
      id: `strategy-${Date.now()}`,
      name: newName || `${source.name} (Copy)`,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.saveStrategy(cloned);
    return cloned;
  }

  /**
   * Export strategy to template
   */
  exportToTemplate(strategy: CampaignStrategy): StrategyTemplate {
    return {
      id: `template-${Date.now()}`,
      name: `${strategy.name} Template`,
      description: `Template based on ${strategy.name}`,
      category: this.inferCategory(strategy.goal.type),
      goal: strategy.goal,
      audience: strategy.audience,
      context: strategy.context,
      recommendedChannels: strategy.context.channels,
      estimatedDuration: strategy.estimatedDuration,
      complexity: this.inferComplexity(strategy.actions.length, strategy.estimatedCost),
      stages: this.extractStages(strategy),
      kpis: strategy.goal.kpis.map(kpi => ({
        metric: kpi.metric,
        description: `Target ${kpi.metric}`,
        targetRange: { min: kpi.target * 0.8, max: kpi.target * 1.2 },
      })),
      tips: [],
      successFactors: [],
      commonPitfalls: [],
    };
  }

  private inferCategory(type: string): 'product' | 'promotion' | 'engagement' | 'conversion' {
    const categoryMap: Record<string, 'product' | 'promotion' | 'engagement' | 'conversion'> = {
      product_launch: 'product',
      seasonal_promo: 'promotion',
      brand_awareness: 'engagement',
      retargeting: 'conversion',
      b2b_outreach: 'conversion',
      lead_generation: 'conversion',
    };
    return categoryMap[type] || 'engagement';
  }

  private inferComplexity(actionCount: number, cost: number): 'simple' | 'moderate' | 'complex' {
    if (actionCount <= 5 && cost < 10000) return 'simple';
    if (actionCount <= 10 && cost < 50000) return 'moderate';
    return 'complex';
  }

  private extractStages(strategy: CampaignStrategy): StrategyTemplate['stages'] {
    return strategy.timeline.map(timelineStage => ({
      name: timelineStage.stage,
      description: `Execute ${timelineStage.stage.toLowerCase()} activities`,
      agents: strategy.actions
        .filter(action => timelineStage.actions.includes(action.id))
        .map(action => action.agent),
      estimatedDuration: Math.ceil(
        (new Date(timelineStage.endDate).getTime() - new Date(timelineStage.startDate).getTime()) /
          (1000 * 60 * 60 * 24)
      ),
    }));
  }
}

// Global strategy manager instance
let globalStrategyManager: StrategyManager | null = null;

export function createStrategyManager(adapter: StrategyStorageAdapter): StrategyManager {
  globalStrategyManager = new StrategyManager(adapter);
  return globalStrategyManager;
}

export function getStrategyManager(): StrategyManager {
  if (!globalStrategyManager) {
    throw new Error('Strategy manager not initialized. Call createStrategyManager first.');
  }
  return globalStrategyManager;
}

export default StrategyManager;
