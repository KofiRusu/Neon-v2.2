/**
 * Multi-Agent Planner Engine - Real-Time Planning Orchestration System
 * Manages the complete lifecycle of goal planning, consensus, and execution
 */

import { PrismaClient } from '@prisma/client';
import { AgentType, PlanStatus, ExecutionStatus } from '@prisma/client';
import { GoalPlannerAgent, GoalPlanRequest, PlanningResult } from '../agents/goal-planner-agent';
import { SharedIntentModel } from '../shared/shared-intent-model';
import { EventEmitter } from 'events';

const prisma = new PrismaClient();

export interface PlanningRequest {
  id?: string;
  goalRequest: GoalPlanRequest;
  source: 'MANUAL' | 'AUTOMATED' | 'TRIGGERED';
  userId?: string;
  campaignId?: string;
  parentGoalId?: string; // For sub-goals
}

export interface ExecutionMonitor {
  goalPlanId: string;
  currentPhase: number;
  executingAgent: string;
  status: ExecutionStatus;
  progress: number; // 0-1
  startedAt: Date;
  expectedCompletion: Date;
  blockers: string[];
  fallbacksAvailable: string[];
}

export interface PlannerEngineState {
  activePlans: number;
  queuedRequests: number;
  agentsInUse: Array<{ agentType: AgentType; goalPlanId: string }>;
  systemLoad: number; // 0-1
  averageConsensusTime: number; // milliseconds
  successRate: number; // 0-1
}

export class MultiAgentPlannerEngine extends EventEmitter {
  private static instance: MultiAgentPlannerEngine;
  private goalPlannerAgent: GoalPlannerAgent;
  private sharedIntent: SharedIntentModel;
  private requestQueue: PlanningRequest[] = [];
  private executionMonitors: Map<string, ExecutionMonitor> = new Map();
  private isProcessing: boolean = false;
  private processingInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.goalPlannerAgent = new GoalPlannerAgent();
    this.sharedIntent = SharedIntentModel.getInstance();
  }

  static getInstance(): MultiAgentPlannerEngine {
    if (!MultiAgentPlannerEngine.instance) {
      MultiAgentPlannerEngine.instance = new MultiAgentPlannerEngine();
    }
    return MultiAgentPlannerEngine.instance;
  }

  /**
   * Start the planning engine with real-time processing
   */
  async start(): Promise<void> {
    try {
      console.log('🚀 [MultiAgentPlannerEngine] Starting real-time planning engine...');

      this.isProcessing = true;

      // Start the main processing loop
      this.processingInterval = setInterval(async () => {
        await this.processQueue();
        await this.monitorExecutions();
        await this.optimizeResources();
      }, 5000); // Process every 5 seconds

      // Set up event listeners
      this.setupEventListeners();

      // Initialize monitoring for existing active plans
      await this.initializeExistingPlans();

      console.log('✅ [MultiAgentPlannerEngine] Planning engine started successfully');
      this.emit('engine:started');
    } catch (error) {
      console.error('[MultiAgentPlannerEngine] Error starting engine:', error);
      throw error;
    }
  }

  /**
   * Stop the planning engine
   */
  async stop(): Promise<void> {
    console.log('🛑 [MultiAgentPlannerEngine] Stopping planning engine...');

    this.isProcessing = false;

    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }

    this.emit('engine:stopped');
    console.log('✅ [MultiAgentPlannerEngine] Planning engine stopped');
  }

  /**
   * Submit a new planning request to the queue
   */
  async submitGoal(
    goalRequest: GoalPlanRequest,
    options: {
      source?: 'MANUAL' | 'AUTOMATED' | 'TRIGGERED';
      userId?: string;
      campaignId?: string;
      parentGoalId?: string;
      priority?: 'HIGH' | 'NORMAL' | 'LOW';
    } = {}
  ): Promise<string> {
    try {
      const request: PlanningRequest = {
        id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        goalRequest,
        source: options.source || 'MANUAL',
        userId: options.userId,
        campaignId: options.campaignId,
        parentGoalId: options.parentGoalId,
      };

      // Add to queue with priority handling
      if (options.priority === 'HIGH') {
        this.requestQueue.unshift(request);
      } else {
        this.requestQueue.push(request);
      }

      console.log(
        `📥 [MultiAgentPlannerEngine] Goal submitted: "${goalRequest.title}" (Queue: ${this.requestQueue.length})`
      );

      this.emit('goal:submitted', { requestId: request.id, title: goalRequest.title });

      return request.id!;
    } catch (error) {
      console.error('[MultiAgentPlannerEngine] Error submitting goal:', error);
      throw error;
    }
  }

  /**
   * Get the current state of the planning engine
   */
  async getEngineState(): Promise<PlannerEngineState> {
    try {
      const activePlans = await prisma.goalPlan.count({
        where: { status: { in: [PlanStatus.EXECUTING, PlanStatus.APPROVED] } },
      });

      const agentsInUse = Array.from(this.executionMonitors.values()).map(monitor => ({
        agentType: AgentType.GOAL_PLANNER, // Simplified for demo
        goalPlanId: monitor.goalPlanId,
      }));

      // Calculate system load based on active resources
      const systemLoad = Math.min(1, (activePlans + this.requestQueue.length) / 10);

      // Get recent consensus timing
      const recentConsensus = await prisma.agentConsensus.findMany({
        where: {
          completedAt: { not: null },
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });

      const averageConsensusTime =
        recentConsensus.length > 0
          ? recentConsensus.reduce((sum, consensus) => {
              return sum + (consensus.completedAt!.getTime() - consensus.createdAt.getTime());
            }, 0) / recentConsensus.length
          : 0;

      // Calculate success rate
      const recentPlans = await prisma.goalPlan.findMany({
        where: {
          status: { in: [PlanStatus.COMPLETED, PlanStatus.FAILED] },
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // Last 7 days
        },
      });

      const successfulPlans = recentPlans.filter(plan => plan.status === PlanStatus.COMPLETED);
      const successRate = recentPlans.length > 0 ? successfulPlans.length / recentPlans.length : 0;

      return {
        activePlans,
        queuedRequests: this.requestQueue.length,
        agentsInUse,
        systemLoad,
        averageConsensusTime,
        successRate,
      };
    } catch (error) {
      console.error('[MultiAgentPlannerEngine] Error getting engine state:', error);
      return {
        activePlans: 0,
        queuedRequests: this.requestQueue.length,
        agentsInUse: [],
        systemLoad: 0,
        averageConsensusTime: 0,
        successRate: 0,
      };
    }
  }

  /**
   * Get execution monitoring data for active plans
   */
  getExecutionMonitors(): ExecutionMonitor[] {
    return Array.from(this.executionMonitors.values());
  }

  /**
   * Trigger manual replanning for a specific goal
   */
  async triggerReplanning(goalPlanId: string, reason: string): Promise<void> {
    try {
      console.log(`🔄 [MultiAgentPlannerEngine] Manual replanning triggered for ${goalPlanId}`);

      await this.goalPlannerAgent.replan(goalPlanId, reason);

      this.emit('plan:replanned', { goalPlanId, reason });
    } catch (error) {
      console.error('[MultiAgentPlannerEngine] Error triggering replanning:', error);
      throw error;
    }
  }

  /**
   * Get insights and analytics from the planning engine
   */
  async getAnalytics(): Promise<{
    throughput: { goalsPerHour: number; averageQueueTime: number };
    performance: { successRate: number; averagePlanningTime: number };
    bottlenecks: Array<{ type: string; description: string; severity: 'LOW' | 'MEDIUM' | 'HIGH' }>;
    recommendations: string[];
  }> {
    try {
      const state = await this.getEngineState();

      // Calculate throughput (simplified)
      const recentCompleted = await prisma.goalPlan.count({
        where: {
          status: PlanStatus.COMPLETED,
          updatedAt: { gte: new Date(Date.now() - 60 * 60 * 1000) }, // Last hour
        },
      });

      const bottlenecks = [];
      if (state.systemLoad > 0.8) {
        bottlenecks.push({
          type: 'HIGH_LOAD',
          description: 'System load is high, consider scaling agents',
          severity: 'HIGH' as const,
        });
      }

      if (state.averageConsensusTime > 30000) {
        // 30 seconds
        bottlenecks.push({
          type: 'SLOW_CONSENSUS',
          description: 'Consensus rounds taking too long',
          severity: 'MEDIUM' as const,
        });
      }

      const recommendations = [];
      if (state.successRate < 0.8) {
        recommendations.push('Review goal complexity and adjust decomposition strategies');
      }
      if (this.requestQueue.length > 5) {
        recommendations.push('Consider adding more agent capacity for faster processing');
      }

      return {
        throughput: {
          goalsPerHour: recentCompleted,
          averageQueueTime: this.requestQueue.length * 2, // Rough estimate
        },
        performance: {
          successRate: state.successRate,
          averagePlanningTime: state.averageConsensusTime / 1000, // Convert to seconds
        },
        bottlenecks,
        recommendations,
      };
    } catch (error) {
      console.error('[MultiAgentPlannerEngine] Error getting analytics:', error);
      return {
        throughput: { goalsPerHour: 0, averageQueueTime: 0 },
        performance: { successRate: 0, averagePlanningTime: 0 },
        bottlenecks: [],
        recommendations: [],
      };
    }
  }

  // Private methods for internal engine operations
  private async processQueue(): Promise<void> {
    if (!this.isProcessing || this.requestQueue.length === 0) return;

    try {
      // Check system capacity
      const state = await this.getEngineState();
      if (state.systemLoad > 0.9) {
        console.log('⚠️ [MultiAgentPlannerEngine] System at capacity, delaying queue processing');
        return;
      }

      // Process next request in queue
      const request = this.requestQueue.shift();
      if (!request) return;

      console.log(`⚡ [MultiAgentPlannerEngine] Processing goal: "${request.goalRequest.title}"`);

      this.emit('goal:processing', { requestId: request.id, title: request.goalRequest.title });

      // Execute planning through GoalPlannerAgent
      const planningResult = await this.goalPlannerAgent.plan(request.goalRequest);

      // Set up execution monitoring
      if (planningResult.status === PlanStatus.APPROVED) {
        await this.setupExecutionMonitoring(planningResult);
      }

      this.emit('goal:planned', {
        requestId: request.id,
        goalPlanId: planningResult.goalPlanId,
        status: planningResult.status,
        consensusScore: planningResult.consensusScore,
      });

      console.log(`✅ [MultiAgentPlannerEngine] Goal planned: ${planningResult.status}`);
    } catch (error) {
      console.error('[MultiAgentPlannerEngine] Error processing queue:', error);
      this.emit('goal:error', { error: error.message });
    }
  }

  private async monitorExecutions(): Promise<void> {
    for (const [goalPlanId, monitor] of this.executionMonitors.entries()) {
      try {
        // Check execution progress
        const executions = await prisma.planExecution.findMany({
          where: { goalPlanId },
          orderBy: { createdAt: 'desc' },
        });

        const currentExecution = executions[0];
        if (!currentExecution) continue;

        // Update monitor state
        monitor.status = currentExecution.status;
        monitor.progress = this.calculateProgress(executions);

        // Check for failures or blockers
        if (currentExecution.status === ExecutionStatus.FAILED) {
          console.log(`❌ [MultiAgentPlannerEngine] Execution failed for ${goalPlanId}`);
          await this.handleExecutionFailure(goalPlanId, currentExecution);
        }

        // Check for timeouts
        if (monitor.expectedCompletion < new Date() && monitor.status === ExecutionStatus.RUNNING) {
          console.log(`⏰ [MultiAgentPlannerEngine] Execution timeout for ${goalPlanId}`);
          await this.handleExecutionTimeout(goalPlanId);
        }

        this.emit('execution:updated', { goalPlanId, monitor });
      } catch (error) {
        console.error(`[MultiAgentPlannerEngine] Error monitoring execution ${goalPlanId}:`, error);
      }
    }
  }

  private async optimizeResources(): Promise<void> {
    try {
      // Clean up completed executions from monitoring
      for (const [goalPlanId, monitor] of this.executionMonitors.entries()) {
        if (
          monitor.status === ExecutionStatus.COMPLETED ||
          monitor.status === ExecutionStatus.FAILED
        ) {
          this.executionMonitors.delete(goalPlanId);
          this.emit('execution:completed', { goalPlanId, finalStatus: monitor.status });
        }
      }

      // Trigger agent memory cleanup
      await this.sharedIntent.cleanup();

      // Optimize goal planner agent
      await this.goalPlannerAgent.monitorAndOptimize();
    } catch (error) {
      console.error('[MultiAgentPlannerEngine] Error during optimization:', error);
    }
  }

  private setupEventListeners(): void {
    // Listen for system events and respond accordingly
    this.on('goal:submitted', data => {
      console.log(`📢 [Event] Goal submitted: ${data.title}`);
    });

    this.on('goal:planned', data => {
      console.log(`📢 [Event] Goal planned: ${data.goalPlanId} - ${data.status}`);
    });

    this.on('execution:updated', data => {
      console.log(
        `📢 [Event] Execution updated: ${data.goalPlanId} - ${Math.round(data.monitor.progress * 100)}%`
      );
    });
  }

  private async initializeExistingPlans(): Promise<void> {
    const activePlans = await prisma.goalPlan.findMany({
      where: { status: { in: [PlanStatus.EXECUTING, PlanStatus.APPROVED] } },
    });

    for (const plan of activePlans) {
      // Create monitoring for existing plans
      const monitor: ExecutionMonitor = {
        goalPlanId: plan.id,
        currentPhase: 1,
        executingAgent: 'system',
        status: ExecutionStatus.RUNNING,
        progress: 0,
        startedAt: plan.createdAt,
        expectedCompletion: new Date(
          plan.createdAt.getTime() + (plan.estimatedTime || 60) * 60 * 1000
        ),
        blockers: [],
        fallbacksAvailable: [],
      };

      this.executionMonitors.set(plan.id, monitor);
    }

    console.log(
      `🔄 [MultiAgentPlannerEngine] Initialized monitoring for ${activePlans.length} existing plans`
    );
  }

  private async setupExecutionMonitoring(planningResult: PlanningResult): Promise<void> {
    const monitor: ExecutionMonitor = {
      goalPlanId: planningResult.goalPlanId,
      currentPhase: 1,
      executingAgent: planningResult.participatingAgents[0] || 'unknown',
      status: ExecutionStatus.PENDING,
      progress: 0,
      startedAt: new Date(),
      expectedCompletion: planningResult.estimatedCompletion,
      blockers: [],
      fallbacksAvailable: planningResult.fallbackPlans?.map(p => p.proposingAgent) || [],
    };

    this.executionMonitors.set(planningResult.goalPlanId, monitor);
    console.log(
      `👀 [MultiAgentPlannerEngine] Execution monitoring setup for ${planningResult.goalPlanId}`
    );
  }

  private calculateProgress(executions: any[]): number {
    if (executions.length === 0) return 0;

    const completedSteps = executions.filter(
      exec => exec.status === ExecutionStatus.COMPLETED
    ).length;
    const totalSteps = executions.reduce((sum, exec) => sum + (exec.totalSteps || 1), 0);

    return totalSteps > 0 ? completedSteps / totalSteps : 0;
  }

  private async handleExecutionFailure(goalPlanId: string, execution: any): Promise<void> {
    const errorMessage = execution.errors?.[0]?.message || 'Unknown execution error';

    // Trigger replanning through GoalPlannerAgent
    await this.goalPlannerAgent.replan(goalPlanId, `Execution failure: ${errorMessage}`);

    this.emit('execution:failed', { goalPlanId, error: errorMessage });
  }

  private async handleExecutionTimeout(goalPlanId: string): Promise<void> {
    await this.goalPlannerAgent.replan(goalPlanId, 'Execution timeout exceeded');

    this.emit('execution:timeout', { goalPlanId });
  }
}
