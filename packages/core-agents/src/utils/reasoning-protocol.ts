/**
 * Reasoning Protocol - Multi-Agent Planning and Consensus System
 * Handles plan proposals, evaluations, and consensus rounds
 */

import { PrismaClient } from '@prisma/client';
import { AgentType, ConsensusResult } from '@prisma/client';
import { SharedIntentModel, AgentIntent } from '../shared/shared-intent-model';

const prisma = new PrismaClient();

export interface ProposedPlan {
  id?: string;
  goalId: string;
  proposingAgent: string;
  agentType: AgentType;
  title: string;
  description: string;
  subgoals: SubGoal[];
  agentSequence: AgentAssignment[];
  estimatedTime: number; // minutes
  estimatedCost?: number;
  brandAlignment: number; // 0-1
  feasibility: number; // 0-1
  confidence: number; // 0-1
  riskFactors: string[];
  dependencies: string[];
  metadata?: any;
}

export interface SubGoal {
  id: string;
  title: string;
  description: string;
  priority: number;
  estimatedTime: number;
  requiredCapabilities: string[];
  successCriteria: string[];
}

export interface AgentAssignment {
  agentType: AgentType;
  phase: number;
  tasks: string[];
  dependencies: string[];
  estimatedDuration: number;
  fallbackAgents?: AgentType[];
}

export interface PlanEvaluation {
  evaluatorAgent: string;
  agentType: AgentType;
  score: number; // 0-1
  reasoning: string;
  alignment: {
    brand: number;
    feasibility: number;
    efficiency: number;
    riskLevel: number;
  };
  suggestions?: string[];
  blockers?: string[];
  timestamp: Date;
}

export interface ConsensusRound {
  id?: string;
  goalPlanId: string;
  roundNumber: number;
  proposedPlan: ProposedPlan;
  participantAgents: string[];
  evaluations: PlanEvaluation[];
  quorum: number; // 0-1 (e.g., 0.7 = 70% agreement)
  result?: ConsensusResult;
  finalScore?: number;
  winningPlan?: ProposedPlan;
  completedAt?: Date;
}

/**
 * Agent proposes a plan for a goal
 */
export async function proposePlan(
  goalId: string,
  proposingAgent: string,
  agentType: AgentType,
  planDetails: Partial<ProposedPlan>
): Promise<ProposedPlan> {
  try {
    const sharedIntent = SharedIntentModel.getInstance();

    // Check if agent is available to propose
    const availability = await sharedIntent.getAgentAvailability(proposingAgent);
    if (!availability.isAvailable) {
      throw new Error(`Agent ${proposingAgent} is not available for planning`);
    }

    // Create the proposed plan with intelligent defaults
    const proposedPlan: ProposedPlan = {
      goalId,
      proposingAgent,
      agentType,
      title: planDetails.title || `Plan by ${agentType}`,
      description: planDetails.description || '',
      subgoals: planDetails.subgoals || [],
      agentSequence: planDetails.agentSequence || [],
      estimatedTime: planDetails.estimatedTime || 0,
      estimatedCost: planDetails.estimatedCost,
      brandAlignment: planDetails.brandAlignment || 0.8,
      feasibility: planDetails.feasibility || 0.7,
      confidence: planDetails.confidence || 0.6,
      riskFactors: planDetails.riskFactors || [],
      dependencies: planDetails.dependencies || [],
      metadata: planDetails.metadata || {},
    };

    // Validate plan structure
    await validatePlan(proposedPlan);

    // Store intention to propose
    await sharedIntent.broadcastIntent({
      agentId: proposingAgent,
      agentType,
      intention: `propose_plan_for_goal_${goalId}`,
      resources: {
        timeRequired: 10, // Planning time
        dependencies: planDetails.dependencies || [],
      },
      priority: 8,
      status: 'PROPOSED' as any,
      confidence: proposedPlan.confidence,
      estimatedDuration: 15,
      metadata: { goalId, planTitle: proposedPlan.title },
    });

    console.log(`💡 [ReasoningProtocol] Plan proposed by ${agentType}: ${proposedPlan.title}`);
    return proposedPlan;
  } catch (error) {
    console.error('[ReasoningProtocol] Error proposing plan:', error);
    throw error;
  }
}

/**
 * Agent evaluates a proposed plan
 */
export async function evaluatePlan(
  plan: ProposedPlan,
  evaluatorAgent: string,
  evaluatorType: AgentType
): Promise<PlanEvaluation> {
  try {
    const sharedIntent = SharedIntentModel.getInstance();

    // Get similar plans for context
    const similarIntentions = await sharedIntent.getSimilarIntentions(
      plan.description,
      evaluatorType
    );

    // Calculate evaluation scores based on agent expertise
    const evaluation = await calculateEvaluationScore(plan, evaluatorType, similarIntentions);

    const planEvaluation: PlanEvaluation = {
      evaluatorAgent,
      agentType: evaluatorType,
      score: evaluation.overallScore,
      reasoning: evaluation.reasoning,
      alignment: evaluation.alignment,
      suggestions: evaluation.suggestions,
      blockers: evaluation.blockers,
      timestamp: new Date(),
    };

    // Broadcast evaluation intent
    await sharedIntent.broadcastIntent({
      agentId: evaluatorAgent,
      agentType: evaluatorType,
      intention: `evaluate_plan_${plan.id}`,
      resources: {
        timeRequired: 5,
        dependencies: [],
      },
      priority: 7,
      status: 'EXECUTING' as any,
      confidence: evaluation.confidenceInEvaluation,
      estimatedDuration: 10,
      metadata: {
        planId: plan.id,
        evaluationScore: evaluation.overallScore,
      },
    });

    console.log(
      `📊 [ReasoningProtocol] Plan evaluated by ${evaluatorType}: Score ${evaluation.overallScore.toFixed(2)}`
    );
    return planEvaluation;
  } catch (error) {
    console.error('[ReasoningProtocol] Error evaluating plan:', error);
    throw error;
  }
}

/**
 * Conduct a consensus round for plan selection
 */
export async function consensusRound(
  goalPlanId: string,
  proposedPlans: ProposedPlan[],
  participantAgents: Array<{ agentId: string; agentType: AgentType }>,
  quorum: number = 0.7
): Promise<ConsensusRound> {
  try {
    if (proposedPlans.length === 0) {
      throw new Error('No plans provided for consensus');
    }

    const roundNumber = await getNextRoundNumber(goalPlanId);

    // Initialize consensus round
    const consensusRound: ConsensusRound = {
      goalPlanId,
      roundNumber,
      proposedPlan: proposedPlans[0], // Primary plan being voted on
      participantAgents: participantAgents.map(a => a.agentId),
      evaluations: [],
      quorum,
    };

    // Collect evaluations from all participating agents
    for (const participant of participantAgents) {
      try {
        const evaluation = await evaluatePlan(
          proposedPlans[0],
          participant.agentId,
          participant.agentType
        );
        consensusRound.evaluations.push(evaluation);
      } catch (error) {
        console.warn(`[ReasoningProtocol] Agent ${participant.agentId} failed to evaluate:`, error);
        // Continue with other evaluations
      }
    }

    // Calculate consensus result
    const result = await calculateConsensus(consensusRound);

    // Save consensus round to database
    const savedConsensus = await prisma.agentConsensus.create({
      data: {
        goalPlanId,
        roundNumber,
        proposedPlan: proposedPlans[0],
        participantAgents: participantAgents.map(a => a.agentId),
        votes: consensusRound.evaluations.reduce((acc, eval) => {
          acc[eval.evaluatorAgent] = {
            score: eval.score,
            reasoning: eval.reasoning,
            alignment: eval.alignment,
          };
          return acc;
        }, {} as any),
        quorum,
        result: result.result,
        finalScore: result.finalScore,
        winningPlan: result.winningPlan,
        completedAt: result.result !== ConsensusResult.PENDING ? new Date() : null,
      },
    });

    consensusRound.id = savedConsensus.id;
    consensusRound.result = result.result;
    consensusRound.finalScore = result.finalScore;
    consensusRound.winningPlan = result.winningPlan;
    consensusRound.completedAt =
      result.result !== ConsensusResult.PENDING
        ? new Date()
        : savedConsensus.completedAt || undefined;

    console.log(
      `🗳️ [ReasoningProtocol] Consensus round ${roundNumber} completed: ${result.result}`
    );
    console.log(`   Final Score: ${result.finalScore?.toFixed(2)}, Quorum: ${quorum * 100}%`);

    return consensusRound;
  } catch (error) {
    console.error('[ReasoningProtocol] Error in consensus round:', error);
    throw error;
  }
}

/**
 * Get learning insights from previous consensus rounds
 */
export async function getConsensusInsights(agentType?: AgentType): Promise<{
  averageScore: number;
  successfulPlans: ProposedPlan[];
  commonFailureReasons: string[];
  bestPractices: string[];
}> {
  try {
    const consensusRounds = await prisma.agentConsensus.findMany({
      where: {
        result: ConsensusResult.APPROVED,
        completedAt: { not: null },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const scores = consensusRounds
      .filter(round => round.finalScore !== null)
      .map(round => round.finalScore!);

    const averageScore =
      scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;

    const successfulPlans = consensusRounds
      .filter(round => round.finalScore && round.finalScore > 0.8)
      .map(round => round.winningPlan as ProposedPlan)
      .filter(plan => plan !== null);

    return {
      averageScore,
      successfulPlans,
      commonFailureReasons: [
        'Insufficient brand alignment',
        'Resource conflicts',
        'Unrealistic timeline',
        'Missing dependencies',
      ],
      bestPractices: [
        'Include fallback agents in sequences',
        'Validate resource availability early',
        'Maintain brand alignment > 0.8',
        'Break down complex goals into smaller subgoals',
      ],
    };
  } catch (error) {
    console.error('[ReasoningProtocol] Error getting consensus insights:', error);
    return {
      averageScore: 0,
      successfulPlans: [],
      commonFailureReasons: [],
      bestPractices: [],
    };
  }
}

// Helper functions
async function validatePlan(plan: ProposedPlan): Promise<void> {
  if (!plan.title || plan.title.trim().length === 0) {
    throw new Error('Plan must have a title');
  }

  if (plan.subgoals.length === 0) {
    throw new Error('Plan must have at least one subgoal');
  }

  if (plan.agentSequence.length === 0) {
    throw new Error('Plan must have at least one agent assignment');
  }

  if (plan.brandAlignment < 0 || plan.brandAlignment > 1) {
    throw new Error('Brand alignment must be between 0 and 1');
  }
}

async function calculateEvaluationScore(
  plan: ProposedPlan,
  evaluatorType: AgentType,
  similarIntentions: AgentIntent[]
): Promise<{
  overallScore: number;
  reasoning: string;
  alignment: PlanEvaluation['alignment'];
  suggestions: string[];
  blockers: string[];
  confidenceInEvaluation: number;
}> {
  // Agent-specific evaluation logic
  const weights = getEvaluationWeights(evaluatorType);

  const brandScore = plan.brandAlignment;
  const feasibilityScore = plan.feasibility;
  const efficiencyScore = Math.min(1, 1 / (plan.estimatedTime / 60)); // Efficiency based on time
  const riskScore = Math.max(0, 1 - plan.riskFactors.length * 0.1);

  const overallScore =
    brandScore * weights.brand +
    feasibilityScore * weights.feasibility +
    efficiencyScore * weights.efficiency +
    riskScore * weights.risk;

  // Generate reasoning based on evaluation
  const reasoningParts = [];
  if (brandScore < 0.7) reasoningParts.push('Brand alignment could be improved');
  if (feasibilityScore < 0.6) reasoningParts.push('Feasibility concerns exist');
  if (plan.riskFactors.length > 3) reasoningParts.push('High risk factors identified');
  if (plan.estimatedTime > 480) reasoningParts.push('Timeline may be too aggressive'); // 8 hours

  const reasoning =
    reasoningParts.length > 0
      ? reasoningParts.join('; ')
      : 'Plan meets quality standards across all evaluation criteria';

  // Generate suggestions based on similar successful plans
  const suggestions: string[] = [];
  if (similarIntentions.length > 0) {
    const avgSuccessfulTime =
      similarIntentions
        .filter(intent => intent.confidence > 0.8)
        .reduce((sum, intent) => sum + (intent.estimatedDuration || 30), 0) /
      similarIntentions.length;

    if (plan.estimatedTime < avgSuccessfulTime * 0.8) {
      suggestions.push('Consider allocating more time based on similar successful plans');
    }
  }

  return {
    overallScore: Math.max(0, Math.min(1, overallScore)),
    reasoning,
    alignment: {
      brand: brandScore,
      feasibility: feasibilityScore,
      efficiency: efficiencyScore,
      riskLevel: 1 - riskScore,
    },
    suggestions,
    blockers: plan.riskFactors.filter(
      risk => risk.toLowerCase().includes('blocker') || risk.toLowerCase().includes('critical')
    ),
    confidenceInEvaluation: 0.8 + similarIntentions.length * 0.02, // Higher confidence with more context
  };
}

function getEvaluationWeights(agentType: AgentType): {
  brand: number;
  feasibility: number;
  efficiency: number;
  risk: number;
} {
  // Different agents prioritize different aspects
  switch (agentType) {
    case AgentType.BRAND_VOICE:
      return { brand: 0.5, feasibility: 0.2, efficiency: 0.1, risk: 0.2 };
    case AgentType.TREND:
      return { brand: 0.2, feasibility: 0.3, efficiency: 0.3, risk: 0.2 };
    case AgentType.SEO:
      return { brand: 0.3, feasibility: 0.3, efficiency: 0.2, risk: 0.2 };
    default:
      return { brand: 0.25, feasibility: 0.25, efficiency: 0.25, risk: 0.25 };
  }
}

async function getNextRoundNumber(goalPlanId: string): Promise<number> {
  const lastRound = await prisma.agentConsensus.findFirst({
    where: { goalPlanId },
    orderBy: { roundNumber: 'desc' },
  });

  return (lastRound?.roundNumber || 0) + 1;
}

async function calculateConsensus(consensusRound: ConsensusRound): Promise<{
  result: ConsensusResult;
  finalScore?: number;
  winningPlan?: ProposedPlan;
}> {
  const evaluations = consensusRound.evaluations;

  if (evaluations.length === 0) {
    return { result: ConsensusResult.QUORUM_NOT_MET };
  }

  // Calculate weighted score (all agents equal weight for now)
  const totalScore = evaluations.reduce((sum, eval) => sum + eval.score, 0);
  const finalScore = totalScore / evaluations.length;

  // Check if we have enough participants
  const participationRate = evaluations.length / consensusRound.participantAgents.length;
  if (participationRate < consensusRound.quorum) {
    return { result: ConsensusResult.QUORUM_NOT_MET, finalScore };
  }

  // Check for approval (consensus threshold)
  const approvalCount = evaluations.filter(eval => eval.score >= 0.7).length;
  const approvalRate = approvalCount / evaluations.length;

  if (approvalRate >= consensusRound.quorum && finalScore >= 0.7) {
    return {
      result: ConsensusResult.APPROVED,
      finalScore,
      winningPlan: consensusRound.proposedPlan,
    };
  } else if (finalScore < 0.4) {
    return { result: ConsensusResult.REJECTED, finalScore };
  } else {
    return { result: ConsensusResult.PENDING, finalScore };
  }
}
