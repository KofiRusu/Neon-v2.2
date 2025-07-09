import { 
  AgentType, 
  ActionType, 
  ActionStatus, 
  ActionPriority,
  AgentMetric,
  AgentActionLog,
  AgentActionRule,
  PrismaClient 
} from '@neon/data-model';

import { 
  PerformanceActionsRegistry, 
  ActionExecutionParams, 
  ActionExecutionResult,
  TriggerCondition,
  performanceActionsRegistry,
  COMMON_TRIGGER_CONDITIONS
} from '../actions/performanceActions';

import { AgentMetricsAggregator } from '../metrics/AgentMetricsAggregator';

export interface ActionRunnerConfig {
  runInterval?: number; // minutes between runs
  maxConcurrentActions?: number;
  enableAutoRun?: boolean;
  retryConfig?: {
    maxRetries: number;
    retryDelay: number; // seconds
    backoffMultiplier: number;
  };
  alertConfig?: {
    webhookUrl?: string;
    emailRecipients?: string[];
    slackChannel?: string;
  };
}

export interface ActionTrigger {
  ruleId: string;
  agentType: AgentType;
  actionType: ActionType;
  condition: TriggerCondition;
  priority: ActionPriority;
  actionConfig: Record<string, any>;
  enabled: boolean;
  lastTriggered?: Date;
  triggerCount: number;
  cooldownUntil?: Date;
}

export interface ActionRunResult {
  triggeredActions: number;
  successfulActions: number;
  failedActions: number;
  skippedActions: number;
  executionTime: number;
  errors: Array<{ action: string; error: string }>;
  summary: string;
}

export class AgentActionRunner {
  private prisma: PrismaClient;
  private registry: PerformanceActionsRegistry;
  private metricsAggregator: AgentMetricsAggregator;
  private config: ActionRunnerConfig;
  private isRunning: boolean = false;
  private runInterval?: NodeJS.Timeout;
  private activeActions: Map<string, Promise<ActionExecutionResult>> = new Map();
  
  constructor(
    prisma: PrismaClient, 
    metricsAggregator: AgentMetricsAggregator,
    config: ActionRunnerConfig = {}
  ) {
    this.prisma = prisma;
    this.registry = performanceActionsRegistry;
    this.metricsAggregator = metricsAggregator;
    this.config = {
      runInterval: config.runInterval || 15, // 15 minutes default
      maxConcurrentActions: config.maxConcurrentActions || 10,
      enableAutoRun: config.enableAutoRun ?? true,
      retryConfig: {
        maxRetries: config.retryConfig?.maxRetries || 3,
        retryDelay: config.retryConfig?.retryDelay || 30,
        backoffMultiplier: config.retryConfig?.backoffMultiplier || 2,
        ...config.retryConfig
      },
      alertConfig: config.alertConfig || {},
      ...config
    };
    
    if (this.config.enableAutoRun) {
      this.startAutoRun();
    }
  }
  
  public startAutoRun(): void {
    if (this.runInterval) {
      clearInterval(this.runInterval);
    }
    
    this.runInterval = setInterval(async () => {
      if (!this.isRunning) {
        try {
          await this.runActionChecks();
        } catch (error) {
          console.error('Error in auto-run action checks:', error);
        }
      }
    }, this.config.runInterval! * 60 * 1000); // Convert minutes to milliseconds
    
    console.log(`AgentActionRunner auto-run started (interval: ${this.config.runInterval} minutes)`);
  }
  
  public stopAutoRun(): void {
    if (this.runInterval) {
      clearInterval(this.runInterval);
      this.runInterval = undefined;
    }
    console.log('AgentActionRunner auto-run stopped');
  }
  
  public async runActionChecks(): Promise<ActionRunResult> {
    if (this.isRunning) {
      console.log('Action checks already running, skipping...');
      return {
        triggeredActions: 0,
        successfulActions: 0,
        failedActions: 0,
        skippedActions: 0,
        executionTime: 0,
        errors: [],
        summary: 'Skipped - already running'
      };
    }
    
    const startTime = Date.now();
    this.isRunning = true;
    
    try {
      console.log('Starting agent action checks...');
      
      // Get all active action rules
      const actionRules = await this.getActiveActionRules();
      console.log(`Found ${actionRules.length} active action rules`);
      
      // Get recent metrics for evaluation
      const recentMetrics = await this.getRecentMetrics();
      console.log(`Evaluating ${recentMetrics.length} recent metrics`);
      
      // Evaluate rules against metrics
      const triggeredActions = await this.evaluateRules(actionRules, recentMetrics);
      console.log(`Found ${triggeredActions.length} triggered actions`);
      
      // Execute triggered actions
      const executionResults = await this.executeActions(triggeredActions);
      
      const executionTime = Date.now() - startTime;
      
      const result: ActionRunResult = {
        triggeredActions: triggeredActions.length,
        successfulActions: executionResults.filter(r => r.success).length,
        failedActions: executionResults.filter(r => !r.success).length,
        skippedActions: 0,
        executionTime,
        errors: executionResults
          .filter(r => !r.success)
          .map(r => ({ action: r.actionType || 'unknown', error: r.errorDetails || 'Unknown error' })),
        summary: this.generateRunSummary(executionResults, executionTime)
      };
      
      console.log(`Action run completed: ${result.summary}`);
      
      // Send alerts if configured
      if (result.failedActions > 0) {
        await this.sendAlerts(result);
      }
      
      return result;
      
    } catch (error) {
      console.error('Error in action checks:', error);
      const executionTime = Date.now() - startTime;
      
      return {
        triggeredActions: 0,
        successfulActions: 0,
        failedActions: 1,
        skippedActions: 0,
        executionTime,
        errors: [{ action: 'system', error: error instanceof Error ? error.message : 'Unknown error' }],
        summary: `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    } finally {
      this.isRunning = false;
    }
  }
  
  private async getActiveActionRules(): Promise<AgentActionRule[]> {
    return await this.prisma.agentActionRule.findMany({
      where: { enabled: true },
      orderBy: [
        { priority: 'desc' },
        { updatedAt: 'desc' }
      ]
    });
  }
  
  private async getRecentMetrics(): Promise<AgentMetric[]> {
    const lookbackHours = 4; // Look back 4 hours for metrics
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - lookbackHours);
    
    return await this.prisma.agentMetric.findMany({
      where: {
        timestamp: {
          gte: cutoffTime
        }
      },
      orderBy: { timestamp: 'desc' },
      take: 10000 // Limit to avoid memory issues
    });
  }
  
  private async evaluateRules(rules: AgentActionRule[], metrics: AgentMetric[]): Promise<ActionTrigger[]> {
    const triggers: ActionTrigger[] = [];
    
    for (const rule of rules) {
      try {
        // Check if rule is in cooldown
        if (rule.cooldownPeriod && rule.lastTriggered) {
          const cooldownEnd = new Date(rule.lastTriggered.getTime() + rule.cooldownPeriod * 60 * 1000);
          if (new Date() < cooldownEnd) {
            continue; // Skip rule in cooldown
          }
        }
        
        // Filter metrics relevant to this rule
        const relevantMetrics = metrics.filter(metric => 
          metric.agentType === rule.agentType &&
          metric.metricType === rule.metricType &&
          (!rule.metricSubtype || metric.metricSubtype === rule.metricSubtype) &&
          (!rule.category || metric.category === rule.category) &&
          this.matchesCampaignFilters(metric, rule.campaignIds) &&
          this.matchesRegionFilters(metric, rule.regions) &&
          this.matchesPlatformFilters(metric, rule.platforms)
        );
        
        if (relevantMetrics.length === 0) {
          continue; // No relevant metrics
        }
        
        // Evaluate condition
        const isTriggered = await this.evaluateCondition(rule, relevantMetrics);
        
        if (isTriggered) {
          triggers.push({
            ruleId: rule.id,
            agentType: rule.agentType,
            actionType: rule.actionType,
            condition: {
              metricType: rule.metricType,
              metricSubtype: rule.metricSubtype,
              category: rule.category,
              condition: rule.condition as any,
              threshold: rule.threshold,
              timeWindow: rule.timeWindow,
              consecutiveCount: rule.consecutiveCount,
              cooldownPeriod: rule.cooldownPeriod
            },
            priority: rule.priority,
            actionConfig: rule.actionConfig as Record<string, any>,
            enabled: rule.enabled,
            lastTriggered: rule.lastTriggered,
            triggerCount: rule.triggerCount,
            cooldownUntil: rule.cooldownPeriod ? 
              new Date(Date.now() + rule.cooldownPeriod * 60 * 1000) : undefined
          });
        }
      } catch (error) {
        console.error(`Error evaluating rule ${rule.id}:`, error);
      }
    }
    
    return triggers;
  }
  
  private matchesCampaignFilters(metric: AgentMetric, campaignIds: string[]): boolean {
    if (!campaignIds || campaignIds.length === 0) return true;
    return !!(metric.campaignId && campaignIds.includes(metric.campaignId));
  }
  
  private matchesRegionFilters(metric: AgentMetric, regions: string[]): boolean {
    if (!regions || regions.length === 0) return true;
    return !!(metric.region && regions.includes(metric.region));
  }
  
  private matchesPlatformFilters(metric: AgentMetric, platforms: any[]): boolean {
    if (!platforms || platforms.length === 0) return true;
    return !!(metric.platform && platforms.includes(metric.platform));
  }
  
  private async evaluateCondition(rule: AgentActionRule, metrics: AgentMetric[]): Promise<boolean> {
    const { condition, threshold, timeWindow, consecutiveCount } = rule;
    
    // Sort metrics by timestamp (newest first)
    const sortedMetrics = metrics.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    // Apply time window filter if specified
    let filteredMetrics = sortedMetrics;
    if (timeWindow) {
      const cutoffTime = new Date(Date.now() - timeWindow * 60 * 1000);
      filteredMetrics = sortedMetrics.filter(m => m.timestamp >= cutoffTime);
    }
    
    if (filteredMetrics.length === 0) {
      return false;
    }
    
    switch (condition) {
      case 'greater_than':
        return this.checkGreaterThan(filteredMetrics, threshold, consecutiveCount);
      
      case 'less_than':
        return this.checkLessThan(filteredMetrics, threshold, consecutiveCount);
      
      case 'equals':
        return this.checkEquals(filteredMetrics, threshold, consecutiveCount);
      
      case 'change_percent':
        return this.checkChangePercent(filteredMetrics, threshold);
      
      default:
        console.warn(`Unknown condition type: ${condition}`);
        return false;
    }
  }
  
  private checkGreaterThan(metrics: AgentMetric[], threshold: number, consecutiveCount?: number): boolean {
    if (!consecutiveCount || consecutiveCount <= 1) {
      return metrics.some(m => m.value > threshold);
    }
    
    // Check for consecutive violations
    let consecutiveViolations = 0;
    for (const metric of metrics) {
      if (metric.value > threshold) {
        consecutiveViolations++;
        if (consecutiveViolations >= consecutiveCount) {
          return true;
        }
      } else {
        consecutiveViolations = 0;
      }
    }
    
    return false;
  }
  
  private checkLessThan(metrics: AgentMetric[], threshold: number, consecutiveCount?: number): boolean {
    if (!consecutiveCount || consecutiveCount <= 1) {
      return metrics.some(m => m.value < threshold);
    }
    
    // Check for consecutive violations
    let consecutiveViolations = 0;
    for (const metric of metrics) {
      if (metric.value < threshold) {
        consecutiveViolations++;
        if (consecutiveViolations >= consecutiveCount) {
          return true;
        }
      } else {
        consecutiveViolations = 0;
      }
    }
    
    return false;
  }
  
  private checkEquals(metrics: AgentMetric[], threshold: number, consecutiveCount?: number): boolean {
    if (!consecutiveCount || consecutiveCount <= 1) {
      return metrics.some(m => Math.abs(m.value - threshold) < 0.001); // Handle floating point precision
    }
    
    // Check for consecutive violations
    let consecutiveViolations = 0;
    for (const metric of metrics) {
      if (Math.abs(metric.value - threshold) < 0.001) {
        consecutiveViolations++;
        if (consecutiveViolations >= consecutiveCount) {
          return true;
        }
      } else {
        consecutiveViolations = 0;
      }
    }
    
    return false;
  }
  
  private checkChangePercent(metrics: AgentMetric[], threshold: number): boolean {
    if (metrics.length < 2) return false;
    
    const latest = metrics[0];
    const previous = metrics[1];
    
    if (previous.value === 0) return false;
    
    const changePercent = ((latest.value - previous.value) / previous.value) * 100;
    return threshold > 0 ? changePercent >= threshold : changePercent <= threshold;
  }
  
  private async executeActions(triggers: ActionTrigger[]): Promise<(ActionExecutionResult & { actionType?: string })[]> {
    const results: (ActionExecutionResult & { actionType?: string })[] = [];
    
    // Group triggers by priority
    const priorityGroups = this.groupTriggersByPriority(triggers);
    
    // Execute by priority (highest first)
    for (const [priority, triggerGroup] of priorityGroups) {
      console.log(`Executing ${triggerGroup.length} ${priority} priority actions`);
      
      // Execute actions in parallel (up to maxConcurrentActions)
      const chunks = this.chunkArray(triggerGroup, this.config.maxConcurrentActions!);
      
      for (const chunk of chunks) {
        const chunkResults = await Promise.all(
          chunk.map(trigger => this.executeAction(trigger))
        );
        results.push(...chunkResults);
      }
    }
    
    return results;
  }
  
  private groupTriggersByPriority(triggers: ActionTrigger[]): Map<string, ActionTrigger[]> {
    const groups = new Map<string, ActionTrigger[]>();
    
    for (const trigger of triggers) {
      const priority = trigger.priority;
      if (!groups.has(priority)) {
        groups.set(priority, []);
      }
      groups.get(priority)!.push(trigger);
    }
    
    // Sort by priority (EMERGENCY > CRITICAL > HIGH > MEDIUM > LOW)
    const sortedEntries = Array.from(groups.entries()).sort(([a], [b]) => {
      const priorityOrder = { EMERGENCY: 0, CRITICAL: 1, HIGH: 2, MEDIUM: 3, LOW: 4 };
      return (priorityOrder[a as keyof typeof priorityOrder] || 5) - 
             (priorityOrder[b as keyof typeof priorityOrder] || 5);
    });
    
    return new Map(sortedEntries);
  }
  
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
  
  private async executeAction(trigger: ActionTrigger): Promise<ActionExecutionResult & { actionType?: string }> {
    const startTime = Date.now();
    
    try {
      console.log(`Executing action: ${trigger.actionType} for agent: ${trigger.agentType}`);
      
      // Create action log entry
      const actionLog = await this.createActionLog(trigger);
      
      // Get action executor
      const executor = this.registry.getAction(trigger.actionType);
      if (!executor) {
        throw new Error(`No executor found for action type: ${trigger.actionType}`);
      }
      
      // Prepare execution parameters
      const params: ActionExecutionParams = {
        agentName: `${trigger.agentType}_agent`,
        agentType: trigger.agentType,
        campaignId: trigger.actionConfig.campaignId,
        metricId: trigger.actionConfig.metricId,
        triggerValue: trigger.actionConfig.triggerValue || 0,
        threshold: trigger.condition.threshold,
        actionConfig: trigger.actionConfig,
        metadata: {
          ruleId: trigger.ruleId,
          triggeredAt: new Date().toISOString(),
          priority: trigger.priority
        }
      };
      
      // Validate parameters
      const isValid = await executor.validate(params);
      if (!isValid) {
        throw new Error('Action parameters validation failed');
      }
      
      // Execute with retry logic
      const result = await this.executeWithRetry(executor, params);
      
      // Update action log
      await this.updateActionLog(actionLog.id, result, Date.now() - startTime);
      
      // Update rule trigger count and last triggered
      await this.updateRuleTriggerStats(trigger.ruleId);
      
      return { ...result, actionType: trigger.actionType };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Action execution failed: ${trigger.actionType}`, error);
      
      const failureResult: ActionExecutionResult = {
        success: false,
        message: `Action execution failed: ${errorMessage}`,
        errorDetails: errorMessage
      };
      
      return { ...failureResult, actionType: trigger.actionType };
    }
  }
  
  private async executeWithRetry(
    executor: any, 
    params: ActionExecutionParams
  ): Promise<ActionExecutionResult> {
    let lastError: Error | null = null;
    const maxRetries = this.config.retryConfig!.maxRetries;
    const baseDelay = this.config.retryConfig!.retryDelay * 1000; // Convert to milliseconds
    const backoffMultiplier = this.config.retryConfig!.backoffMultiplier;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await executor.execute(params);
        
        if (result.success) {
          return result;
        }
        
        // If not successful but no exception, treat as retriable error
        if (attempt < maxRetries) {
          const delay = baseDelay * Math.pow(backoffMultiplier, attempt);
          await this.delay(delay);
          continue;
        }
        
        return result; // Return failed result on final attempt
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt < maxRetries) {
          const delay = baseDelay * Math.pow(backoffMultiplier, attempt);
          console.log(`Retrying action execution in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
          await this.delay(delay);
        }
      }
    }
    
    return {
      success: false,
      message: `Action failed after ${maxRetries} retries`,
      errorDetails: lastError?.message || 'Unknown error'
    };
  }
  
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  private async createActionLog(trigger: ActionTrigger): Promise<AgentActionLog> {
    return await this.prisma.agentActionLog.create({
      data: {
        agentName: `${trigger.agentType}_agent`,
        agentType: trigger.agentType,
        actionType: trigger.actionType,
        campaignId: trigger.actionConfig.campaignId,
        metricId: trigger.actionConfig.metricId,
        triggerValue: trigger.actionConfig.triggerValue || 0,
        threshold: trigger.condition.threshold,
        condition: trigger.condition.condition,
        status: ActionStatus.PENDING,
        priority: trigger.priority,
        maxRetries: this.config.retryConfig!.maxRetries,
        metadata: {
          ruleId: trigger.ruleId,
          triggerCondition: trigger.condition,
          actionConfig: trigger.actionConfig
        }
      }
    });
  }
  
  private async updateActionLog(
    actionLogId: string, 
    result: ActionExecutionResult, 
    executionTime: number
  ): Promise<void> {
    await this.prisma.agentActionLog.update({
      where: { id: actionLogId },
      data: {
        status: result.success ? ActionStatus.COMPLETED : ActionStatus.FAILED,
        completedAt: new Date(),
        notes: result.message,
        errorMessage: result.errorDetails,
        impactMetrics: result.impactMetrics,
        rollbackData: result.rollbackData,
        metadata: {
          executionTime,
          result: result.data
        }
      }
    });
  }
  
  private async updateRuleTriggerStats(ruleId: string): Promise<void> {
    await this.prisma.agentActionRule.update({
      where: { id: ruleId },
      data: {
        lastTriggered: new Date(),
        triggerCount: { increment: 1 }
      }
    });
  }
  
  private generateRunSummary(results: (ActionExecutionResult & { actionType?: string })[], executionTime: number): string {
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const total = results.length;
    
    return `Executed ${total} actions in ${executionTime}ms - ${successful} successful, ${failed} failed`;
  }
  
  private async sendAlerts(result: ActionRunResult): Promise<void> {
    if (!this.config.alertConfig) return;
    
    const alertMessage = `AgentActionRunner Alert: ${result.failedActions} actions failed\n` +
                        `Summary: ${result.summary}\n` +
                        `Errors: ${result.errors.map(e => `${e.action}: ${e.error}`).join(', ')}`;
    
    console.log('Sending alert:', alertMessage);
    
    // Implementation would depend on configured alert channels
    // This is a placeholder for actual alert implementation
  }
  
  // Public methods for manual control
  
  public async triggerAction(
    agentType: AgentType,
    actionType: ActionType,
    actionConfig: Record<string, any>,
    campaignId?: string
  ): Promise<ActionExecutionResult> {
    const executor = this.registry.getAction(actionType);
    if (!executor) {
      throw new Error(`No executor found for action type: ${actionType}`);
    }
    
    const params: ActionExecutionParams = {
      agentName: `${agentType}_agent`,
      agentType,
      campaignId,
      triggerValue: 0,
      actionConfig,
      metadata: {
        manualTrigger: true,
        triggeredAt: new Date().toISOString()
      }
    };
    
    return await this.executeWithRetry(executor, params);
  }
  
  public async getActionLogs(
    filters: {
      agentType?: AgentType;
      actionType?: ActionType;
      campaignId?: string;
      status?: ActionStatus;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    } = {}
  ): Promise<AgentActionLog[]> {
    const { limit = 100, ...whereClause } = filters;
    
    return await this.prisma.agentActionLog.findMany({
      where: whereClause,
      orderBy: { executedAt: 'desc' },
      take: limit
    });
  }
  
  public async getActionStats(): Promise<{
    totalActions: number;
    successfulActions: number;
    failedActions: number;
    averageExecutionTime: number;
    actionsByType: Record<string, number>;
    actionsByAgent: Record<string, number>;
  }> {
    const logs = await this.prisma.agentActionLog.findMany({
      where: {
        executedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    });
    
    const successful = logs.filter(l => l.status === ActionStatus.COMPLETED);
    const failed = logs.filter(l => l.status === ActionStatus.FAILED);
    
    const actionsByType: Record<string, number> = {};
    const actionsByAgent: Record<string, number> = {};
    
    for (const log of logs) {
      actionsByType[log.actionType] = (actionsByType[log.actionType] || 0) + 1;
      actionsByAgent[log.agentType] = (actionsByAgent[log.agentType] || 0) + 1;
    }
    
    return {
      totalActions: logs.length,
      successfulActions: successful.length,
      failedActions: failed.length,
      averageExecutionTime: logs.reduce((acc, log) => {
        const metadata = log.metadata as any;
        return acc + (metadata?.executionTime || 0);
      }, 0) / logs.length,
      actionsByType,
      actionsByAgent
    };
  }
  
  public getRunnerStatus(): {
    isRunning: boolean;
    autoRunEnabled: boolean;
    runInterval: number;
    activeActions: number;
    config: ActionRunnerConfig;
  } {
    return {
      isRunning: this.isRunning,
      autoRunEnabled: !!this.runInterval,
      runInterval: this.config.runInterval!,
      activeActions: this.activeActions.size,
      config: this.config
    };
  }
  
  public async cleanup(): Promise<void> {
    this.stopAutoRun();
    
    // Wait for active actions to complete or timeout after 30 seconds
    const timeout = 30000;
    const start = Date.now();
    
    while (this.activeActions.size > 0 && (Date.now() - start) < timeout) {
      await this.delay(1000);
    }
    
    this.activeActions.clear();
    console.log('AgentActionRunner cleanup completed');
  }
}

// Export missing functions and classes
export function createActionRule(config: {
  agentType: AgentType;
  actionType: ActionType;
  metricType: string;
  condition: string;
  threshold: number;
  priority: ActionPriority;
  enabled?: boolean;
}): Partial<AgentActionRule> {
  return {
    agentType: config.agentType,
    actionType: config.actionType,
    metricType: config.metricType,
    condition: config.condition,
    threshold: config.threshold,
    priority: config.priority,
    enabled: config.enabled ?? true,
    triggerCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

export class ActionExecutor {
  constructor(
    public actionType: ActionType,
    public name: string,
    public description: string
  ) {}

  async validate(params: ActionExecutionParams): Promise<boolean> {
    return !!(params.agentType && params.actionConfig);
  }

  async execute(params: ActionExecutionParams): Promise<ActionExecutionResult> {
    return {
      success: true,
      message: `Action ${this.actionType} executed successfully`,
      executionTime: Date.now(),
      metadata: params.metadata
    };
  }
} 