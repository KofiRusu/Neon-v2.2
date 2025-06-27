/**
 * GoalPlannerAgent - Multi-Agent Reasoning Mesh Orchestrator
 * Coordinates goal decomposition, agent collaboration, and consensus-based execution
 */

import { AbstractAgent } from '../base-agent';
import { PrismaClient } from '@prisma/client';
import { AgentType, PlanStatus, PlanPriority } from '@prisma/client';
import { SharedIntentModel, AgentIntent } from '../shared/shared-intent-model';
import { generateSubgoals, DecomposedGoal } from '../utils/goal-decomposer';
import {
  proposePlan,
  evaluatePlan,
  consensusRound,
  ProposedPlan,
  getConsensusInsights,
} from '../utils/reasoning-protocol';

const prisma = new PrismaClient();

export interface GoalPlanRequest {
  title: string;
  description: string;
  priority: PlanPriority;
  targetMetrics: any; // Goal-specific metrics
  constraints?: {
    budget?: number;
    timeframe?: string;
    resources?: string[];
  };
  stakeholders?: string[]; // User IDs who should be notified
}

export interface PlanningResult {
  goalPlanId: string;
  status: PlanStatus;
  decomposedGoal: DecomposedGoal;
  consensusScore?: number;
  participatingAgents: string[];
  estimatedCompletion: Date;
  fallbackPlans?: ProposedPlan[];
  riskAssessment: {
    level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    factors: string[];
    mitigations: string[];
  };
}

export class GoalPlannerAgent extends AbstractAgent {
  private sharedIntent: SharedIntentModel;
  private activeGoals: Map<string, PlanningResult> = new Map();

  constructor() {
    super();
    this.sharedIntent = SharedIntentModel.getInstance();
  }

  /**
   * Main planning method - accepts high-level goal and orchestrates multi-agent planning
   */
  async plan(goalRequest: GoalPlanRequest): Promise<PlanningResult> {
    try {
      console.log(`🎯 [GoalPlannerAgent] Starting planning for: "${goalRequest.title}"`);

      // Step 1: Decompose the goal using AI-powered analysis
      const decomposedGoal = await generateSubgoals(goalRequest.description);

      // Step 2: Create goal plan record in database
      const goalPlan = await this.createGoalPlan(goalRequest, decomposedGoal);

      // Step 3: Broadcast planning intention to mesh
      await this.broadcastPlanningIntent(goalPlan.id, decomposedGoal);

      // Step 4: Recruit participating agents
      const participatingAgents = await this.recruitAgents(decomposedGoal);

      // Step 5: Generate initial plan proposal
      const proposedPlan = await this.generatePlan(
        goalPlan.id,
        decomposedGoal,
        participatingAgents
      );

      // Step 6: Conduct consensus round
      const consensus = await this.conductConsensus(goalPlan.id, proposedPlan, participatingAgents);

      // Step 7: Handle consensus result
      const planningResult = await this.processPlanningResult(
        goalPlan.id,
        decomposedGoal,
        consensus,
        participatingAgents
      );

      // Step 8: Store and return result
      this.activeGoals.set(goalPlan.id, planningResult);

      console.log(`✅ [GoalPlannerAgent] Planning completed: ${planningResult.status}`);
      console.log(`   Consensus Score: ${planningResult.consensusScore?.toFixed(2)}`);
      console.log(`   Participating Agents: ${planningResult.participatingAgents.length}`);

      return planningResult;
    } catch (error) {
      console.error('[GoalPlannerAgent] Error in planning:', error);
      throw error;
    }
  }

  /**
   * Re-plan when current plan fails or needs adjustment
   */
  async replan(goalPlanId: string, reason: string): Promise<PlanningResult> {
    try {
      console.log(`🔄 [GoalPlannerAgent] Replanning goal ${goalPlanId}, reason: ${reason}`);

      const existingResult = this.activeGoals.get(goalPlanId);
      if (!existingResult) {
        throw new Error(`Goal plan ${goalPlanId} not found`);
      }

      // Update goal plan status
      await prisma.goalPlan.update({
        where: { id: goalPlanId },
        data: {
          status: PlanStatus.REPLANNING,
          metadata: {
            replannedAt: new Date(),
            replannedReason: reason,
          },
        },
      });

      // Analyze what went wrong
      const failureAnalysis = await this.analyzeFailure(goalPlanId, reason);

      // Generate alternative plan with adjustments
      const revisedGoal = await this.adjustGoalBasedOnFailure(
        existingResult.decomposedGoal,
        failureAnalysis
      );

      // Recruit agents again (may be different based on failure)
      const participatingAgents = await this.recruitAgents(revisedGoal);

      // Generate new plan proposal
      const newProposedPlan = await this.generatePlan(goalPlanId, revisedGoal, participatingAgents);

      // Conduct new consensus round
      const consensus = await this.conductConsensus(
        goalPlanId,
        newProposedPlan,
        participatingAgents
      );

      // Process new result
      const newPlanningResult = await this.processPlanningResult(
        goalPlanId,
        revisedGoal,
        consensus,
        participatingAgents
      );

      this.activeGoals.set(goalPlanId, newPlanningResult);

      console.log(`✅ [GoalPlannerAgent] Replanning completed: ${newPlanningResult.status}`);
      return newPlanningResult;
    } catch (error) {
      console.error('[GoalPlannerAgent] Error in replanning:', error);
      throw error;
    }
  }

  /**
   * Monitor active goals and trigger replanning if needed
   */
  async monitorAndOptimize(): Promise<void> {
    try {
      for (const [goalPlanId, result] of this.activeGoals.entries()) {
        if (result.status === PlanStatus.EXECUTING) {
          const shouldReplan = await this.shouldTriggerReplanning(goalPlanId);

          if (shouldReplan.trigger) {
            console.log(
              `⚠️ [GoalPlannerAgent] Triggering replan for ${goalPlanId}: ${shouldReplan.reason}`
            );
            await this.replan(goalPlanId, shouldReplan.reason);
          }
        }
      }
    } catch (error) {
      console.error('[GoalPlannerAgent] Error in monitoring:', error);
    }
  }

  /**
   * Get planning insights and recommendations
   */
  async getPlanningInsights(): Promise<{
    successRate: number;
    averagePlanningTime: number;
    commonFailureReasons: string[];
    bestPractices: string[];
    agentPerformance: Array<{
      agentType: AgentType;
      successRate: number;
      averageScore: number;
    }>;
  }> {
    try {
      const consensusInsights = await getConsensusInsights();

      const goalPlans = await prisma.goalPlan.findMany({
        where: {
          status: { in: [PlanStatus.COMPLETED, PlanStatus.FAILED] },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });

      const successfulPlans = goalPlans.filter(plan => plan.status === PlanStatus.COMPLETED);
      const successRate = goalPlans.length > 0 ? successfulPlans.length / goalPlans.length : 0;

      // Calculate average planning time
      const planningTimes = goalPlans
        .filter(plan => plan.createdAt && plan.updatedAt)
        .map(plan => plan.updatedAt.getTime() - plan.createdAt.getTime());

      const averagePlanningTime =
        planningTimes.length > 0
          ? planningTimes.reduce((sum, time) => sum + time, 0) / planningTimes.length
          : 0;

      return {
        successRate,
        averagePlanningTime: averagePlanningTime / (1000 * 60), // Convert to minutes
        commonFailureReasons: [
          'Resource conflicts between agents',
          'Unrealistic timeline estimates',
          'Insufficient brand alignment',
          'Missing critical dependencies',
        ],
        bestPractices: consensusInsights.bestPractices,
        agentPerformance: await this.calculateAgentPerformance(),
      };
    } catch (error) {
      console.error('[GoalPlannerAgent] Error getting insights:', error);
      return {
        successRate: 0,
        averagePlanningTime: 0,
        commonFailureReasons: [],
        bestPractices: [],
        agentPerformance: [],
      };
    }
  }

  // Private helper methods
  private async createGoalPlan(
    request: GoalPlanRequest,
    decomposedGoal: DecomposedGoal
  ): Promise<any> {
    return await prisma.goalPlan.create({
      data: {
        title: request.title,
        description: request.description,
        priority: request.priority,
        status: PlanStatus.PLANNING,
        targetMetrics: request.targetMetrics,
        subgoals: decomposedGoal.subgoals,
        agentSequence: decomposedGoal.agentSequence,
        brandAlignment: 0.8, // Initial estimate, will be updated by consensus
        feasibility: 0.7,
        confidence: 0.6,
        estimatedTime: decomposedGoal.estimatedTime,
        metadata: {
          complexity: decomposedGoal.complexity,
          riskFactors: decomposedGoal.riskFactors,
          dependencies: decomposedGoal.dependencies,
          constraints: request.constraints,
        },
      },
    });
  }

  private async broadcastPlanningIntent(
    goalPlanId: string,
    decomposedGoal: DecomposedGoal
  ): Promise<void> {
    await this.sharedIntent.broadcastIntent({
      goalPlanId,
      agentId: 'goal-planner-agent',
      agentType: AgentType.GOAL_PLANNER,
      intention: `orchestrate_goal_planning_${goalPlanId}`,
      resources: {
        timeRequired: decomposedGoal.estimatedTime,
        dependencies: decomposedGoal.dependencies,
      },
      priority: 9, // High priority for orchestration
      status: 'EXECUTING' as any,
      confidence: 0.9,
      estimatedDuration: Math.round(decomposedGoal.estimatedTime * 0.2), // 20% for planning
      metadata: {
        goalPlanId,
        complexity: decomposedGoal.complexity,
        subgoalCount: decomposedGoal.subgoals.length,
      },
    });
  }

  private async recruitAgents(
    decomposedGoal: DecomposedGoal
  ): Promise<Array<{ agentId: string; agentType: AgentType }>> {
    const requiredAgentTypes = new Set<AgentType>();

    // Extract required agent types from decomposed goal
    decomposedGoal.agentSequence.forEach(assignment => {
      requiredAgentTypes.add(assignment.agentType);
      assignment.fallbackAgents?.forEach(fallback => requiredAgentTypes.add(fallback));
    });

    const agents: Array<{ agentId: string; agentType: AgentType }> = [];

    for (const agentType of requiredAgentTypes) {
      // Check agent availability
      const agentId = `${agentType.toLowerCase()}-agent-001`;
      const availability = await this.sharedIntent.getAgentAvailability(agentId);

      if (availability.isAvailable || availability.estimatedFreeTime) {
        agents.push({ agentId, agentType });
      } else {
        console.warn(`[GoalPlannerAgent] Agent ${agentType} not available, will find fallback`);
        // In production, would implement proper agent discovery and fallback selection
      }
    }

    return agents;
  }

  private async generatePlan(
    goalPlanId: string,
    decomposedGoal: DecomposedGoal,
    agents: Array<{ agentId: string; agentType: AgentType }>
  ): Promise<ProposedPlan> {
    const plan: ProposedPlan = {
      goalId: goalPlanId,
      proposingAgent: 'goal-planner-agent',
      agentType: AgentType.GOAL_PLANNER,
      title: decomposedGoal.title,
      description: decomposedGoal.description,
      subgoals: decomposedGoal.subgoals,
      agentSequence: decomposedGoal.agentSequence,
      estimatedTime: decomposedGoal.estimatedTime,
      brandAlignment: 0.8,
      feasibility: this.calculateFeasibility(decomposedGoal, agents),
      confidence: this.calculateConfidence(decomposedGoal, agents),
      riskFactors: decomposedGoal.riskFactors,
      dependencies: decomposedGoal.dependencies,
      metadata: {
        complexity: decomposedGoal.complexity,
        successMetrics: decomposedGoal.successMetrics,
        participatingAgents: agents.map(a => a.agentId),
      },
    };

    return await proposePlan(goalPlanId, 'goal-planner-agent', AgentType.GOAL_PLANNER, plan);
  }

  private async conductConsensus(
    goalPlanId: string,
    proposedPlan: ProposedPlan,
    agents: Array<{ agentId: string; agentType: AgentType }>
  ): Promise<any> {
    return await consensusRound(goalPlanId, [proposedPlan], agents, 0.7);
  }

  private async processPlanningResult(
    goalPlanId: string,
    decomposedGoal: DecomposedGoal,
    consensus: any,
    agents: Array<{ agentId: string; agentType: AgentType }>
  ): Promise<PlanningResult> {
    let status: PlanStatus;
    let estimatedCompletion: Date;

    if (consensus.result === 'APPROVED') {
      status = PlanStatus.APPROVED;
      estimatedCompletion = new Date(Date.now() + decomposedGoal.estimatedTime * 60 * 1000);

      // Update database
      await prisma.goalPlan.update({
        where: { id: goalPlanId },
        data: {
          status,
          confidence: consensus.finalScore,
          brandAlignment: consensus.finalScore, // Simplified for demo
          feasibility: consensus.finalScore,
        },
      });
    } else {
      status = PlanStatus.FAILED;
      estimatedCompletion = new Date();
    }

    return {
      goalPlanId,
      status,
      decomposedGoal,
      consensusScore: consensus.finalScore,
      participatingAgents: agents.map(a => a.agentId),
      estimatedCompletion,
      riskAssessment: {
        level: this.assessRiskLevel(decomposedGoal.riskFactors),
        factors: decomposedGoal.riskFactors,
        mitigations: this.generateMitigations(decomposedGoal.riskFactors),
      },
    };
  }

  private calculateFeasibility(
    decomposedGoal: DecomposedGoal,
    agents: Array<{ agentId: string; agentType: AgentType }>
  ): number {
    let feasibility = 0.8; // Base feasibility

    // Reduce based on complexity
    switch (decomposedGoal.complexity) {
      case 'LOW':
        feasibility += 0.1;
        break;
      case 'MEDIUM':
        break;
      case 'HIGH':
        feasibility -= 0.1;
        break;
      case 'CRITICAL':
        feasibility -= 0.2;
        break;
    }

    // Adjust based on agent availability
    const requiredAgents = new Set(decomposedGoal.agentSequence.map(a => a.agentType));
    const availableAgents = new Set(agents.map(a => a.agentType));
    const agentCoverage = availableAgents.size / requiredAgents.size;

    feasibility *= agentCoverage;

    return Math.max(0, Math.min(1, feasibility));
  }

  private calculateConfidence(
    decomposedGoal: DecomposedGoal,
    agents: Array<{ agentId: string; agentType: AgentType }>
  ): number {
    let confidence = 0.7; // Base confidence

    // Adjust based on risk factors
    confidence -= decomposedGoal.riskFactors.length * 0.05;

    // Adjust based on dependencies
    confidence -= decomposedGoal.dependencies.length * 0.02;

    // Adjust based on time estimate (more time = more confidence)
    if (decomposedGoal.estimatedTime > 480) confidence += 0.1; // > 8 hours
    if (decomposedGoal.estimatedTime < 120) confidence -= 0.1; // < 2 hours

    return Math.max(0.1, Math.min(1, confidence));
  }

  private assessRiskLevel(riskFactors: string[]): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (riskFactors.length === 0) return 'LOW';
    if (riskFactors.length <= 2) return 'MEDIUM';
    if (riskFactors.length <= 4) return 'HIGH';
    return 'CRITICAL';
  }

  private generateMitigations(riskFactors: string[]): string[] {
    const mitigations: string[] = [];

    riskFactors.forEach(risk => {
      if (risk.includes('timeline')) {
        mitigations.push('Add buffer time and parallel execution where possible');
      } else if (risk.includes('quality')) {
        mitigations.push('Implement quality checkpoints and review processes');
      } else if (risk.includes('resource')) {
        mitigations.push('Secure fallback resources and alternative agents');
      } else if (risk.includes('dependency')) {
        mitigations.push('Create contingency plans for critical dependencies');
      } else {
        mitigations.push('Monitor closely and prepare alternative approaches');
      }
    });

    return mitigations;
  }

  private async shouldTriggerReplanning(
    goalPlanId: string
  ): Promise<{ trigger: boolean; reason: string }> {
    // Simplified logic - in production would analyze execution metrics
    const executions = await prisma.planExecution.findMany({
      where: { goalPlanId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const failedExecutions = executions.filter(exec => exec.status === 'FAILED');

    if (failedExecutions.length >= 2) {
      return { trigger: true, reason: 'Multiple execution failures detected' };
    }

    return { trigger: false, reason: '' };
  }

  private async analyzeFailure(goalPlanId: string, reason: string): Promise<any> {
    // Analyze what went wrong and suggest adjustments
    return {
      primaryCause: reason,
      recommendedAdjustments: [
        'Simplify goal complexity',
        'Increase time estimates',
        'Add fallback agents',
      ],
    };
  }

  private async adjustGoalBasedOnFailure(
    originalGoal: DecomposedGoal,
    analysis: any
  ): Promise<DecomposedGoal> {
    // Create adjusted version of the goal based on failure analysis
    return {
      ...originalGoal,
      estimatedTime: Math.round(originalGoal.estimatedTime * 1.2), // Add 20% buffer
      riskFactors: [...originalGoal.riskFactors, `Adjusted due to: ${analysis.primaryCause}`],
      complexity: originalGoal.complexity === 'LOW' ? 'MEDIUM' : originalGoal.complexity, // Increase complexity awareness
    };
  }

  private async calculateAgentPerformance(): Promise<
    Array<{
      agentType: AgentType;
      successRate: number;
      averageScore: number;
    }>
  > {
    // Simplified performance calculation
    const agentTypes = [
      AgentType.CONTENT,
      AgentType.SEO,
      AgentType.AD,
      AgentType.BRAND_VOICE,
      AgentType.TREND,
      AgentType.INSIGHT,
    ];

    return agentTypes.map(agentType => ({
      agentType,
      successRate: 0.8 + Math.random() * 0.2, // Mock data for demo
      averageScore: 0.7 + Math.random() * 0.3,
    }));
  }
}
