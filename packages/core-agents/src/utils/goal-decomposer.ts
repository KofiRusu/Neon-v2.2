/**
 * Goal Decomposer - AI-Powered Goal Analysis and Breakdown
 * Transforms high-level goals into actionable subgoals and agent assignments
 */

import { AgentType } from '@prisma/client';
import { SubGoal, AgentAssignment } from './reasoning-protocol';

export interface DecomposedGoal {
  title: string;
  description: string;
  subgoals: SubGoal[];
  agentSequence: AgentAssignment[];
  estimatedTime: number; // minutes
  complexity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskFactors: string[];
  dependencies: string[];
  successMetrics: string[];
}

export interface GoalAnalysis {
  intent: string;
  category: 'AWARENESS' | 'ENGAGEMENT' | 'CONVERSION' | 'RETENTION' | 'GROWTH';
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  resourceRequirements: {
    budget?: number;
    timeframe: string;
    humanOverSight: boolean;
    specializedSkills: string[];
  };
  targetMetrics: Array<{
    metric: string;
    target: number;
    unit: string;
    timeframe: string;
  }>;
}

/**
 * Main goal decomposition function
 */
export async function generateSubgoals(goal: string): Promise<DecomposedGoal> {
  try {
    console.log(`🎯 [GoalDecomposer] Analyzing goal: "${goal}"`);

    // Analyze the goal to understand intent and requirements
    const analysis = await analyzeGoal(goal);

    // Generate subgoals based on the analysis
    const subgoals = await createSubgoals(analysis);

    // Create agent assignment sequence
    const agentSequence = await createAgentSequence(subgoals, analysis);

    // Calculate estimated time and complexity
    const estimatedTime = calculateTotalTime(subgoals, agentSequence);
    const complexity = determineComplexity(subgoals, agentSequence);

    // Identify risk factors and dependencies
    const riskFactors = identifyRiskFactors(analysis, subgoals);
    const dependencies = extractDependencies(subgoals, agentSequence);

    // Define success metrics
    const successMetrics = generateSuccessMetrics(analysis);

    const decomposedGoal: DecomposedGoal = {
      title: `Goal: ${analysis.intent}`,
      description: goal,
      subgoals,
      agentSequence,
      estimatedTime,
      complexity,
      riskFactors,
      dependencies,
      successMetrics,
    };

    console.log(
      `✅ [GoalDecomposer] Goal decomposed into ${subgoals.length} subgoals, ${agentSequence.length} phases`
    );
    console.log(`   Complexity: ${complexity}, Estimated Time: ${Math.round(estimatedTime / 60)}h`);

    return decomposedGoal;
  } catch (error) {
    console.error('[GoalDecomposer] Error decomposing goal:', error);
    throw error;
  }
}

/**
 * Analyze goal to understand intent and category
 */
async function analyzeGoal(goal: string): Promise<GoalAnalysis> {
  const goalLower = goal.toLowerCase();

  // Extract numeric targets and timeframes
  const numericMatches = goal.match(/(\d+)(%|k|million|thousand|x)/gi) || [];
  const timeMatches = goal.match(/(\d+)\s*(day|week|month|year)s?/gi) || [];

  // Categorize goal intent
  let category: GoalAnalysis['category'] = 'ENGAGEMENT';
  if (
    goalLower.includes('awareness') ||
    goalLower.includes('reach') ||
    goalLower.includes('impressions')
  ) {
    category = 'AWARENESS';
  } else if (
    goalLower.includes('conversion') ||
    goalLower.includes('sales') ||
    goalLower.includes('revenue')
  ) {
    category = 'CONVERSION';
  } else if (
    goalLower.includes('retention') ||
    goalLower.includes('loyalty') ||
    goalLower.includes('repeat')
  ) {
    category = 'RETENTION';
  } else if (
    goalLower.includes('growth') ||
    goalLower.includes('scale') ||
    goalLower.includes('expand')
  ) {
    category = 'GROWTH';
  }

  // Determine urgency
  let urgency: GoalAnalysis['urgency'] = 'MEDIUM';
  if (
    goalLower.includes('urgent') ||
    goalLower.includes('asap') ||
    goalLower.includes('immediate')
  ) {
    urgency = 'CRITICAL';
  } else if (
    goalLower.includes('soon') ||
    timeMatches.some(match => match.includes('day') || match.includes('week'))
  ) {
    urgency = 'HIGH';
  } else if (timeMatches.some(match => match.includes('month'))) {
    urgency = 'MEDIUM';
  } else if (timeMatches.some(match => match.includes('year'))) {
    urgency = 'LOW';
  }

  // Extract target metrics
  const targetMetrics = numericMatches.map(match => {
    const value = parseInt(match.replace(/[^\d]/g, ''));
    const unit = match.replace(/[\d]/g, '');

    let metric = 'general';
    if (goalLower.includes('conversion')) metric = 'conversion_rate';
    else if (goalLower.includes('engagement')) metric = 'engagement_rate';
    else if (goalLower.includes('reach')) metric = 'reach';
    else if (goalLower.includes('revenue')) metric = 'revenue';

    return {
      metric,
      target: value,
      unit: unit || 'count',
      timeframe: timeMatches[0] || '30 days',
    };
  });

  return {
    intent: extractIntent(goal),
    category,
    urgency,
    resourceRequirements: {
      timeframe: timeMatches[0] || '30 days',
      humanOverSight: urgency === 'CRITICAL' || category === 'CONVERSION',
      specializedSkills: extractRequiredSkills(goal, category),
    },
    targetMetrics,
  };
}

/**
 * Create subgoals based on goal analysis
 */
async function createSubgoals(analysis: GoalAnalysis): Promise<SubGoal[]> {
  const subgoals: SubGoal[] = [];

  // Phase 1: Research & Analysis (always needed)
  subgoals.push({
    id: 'research_analysis',
    title: 'Market Research & Competitive Analysis',
    description: 'Analyze market conditions, competitor strategies, and identify opportunities',
    priority: 10,
    estimatedTime: 60, // 1 hour
    requiredCapabilities: ['trend_analysis', 'market_intelligence', 'competitive_research'],
    successCriteria: [
      'Market trends identified',
      'Competitor strategies analyzed',
      'Opportunity gaps documented',
      'Target audience insights gathered',
    ],
  });

  // Phase 2: Strategy Development
  subgoals.push({
    id: 'strategy_development',
    title: 'Strategic Plan Development',
    description: 'Develop comprehensive strategy aligned with business goals',
    priority: 9,
    estimatedTime: 90, // 1.5 hours
    requiredCapabilities: ['strategic_planning', 'brand_alignment', 'goal_optimization'],
    successCriteria: [
      'Strategy framework defined',
      'Brand voice consistency validated',
      'Resource allocation planned',
      'Timeline established',
    ],
  });

  // Phase 3: Content Strategy (category-specific)
  if (analysis.category === 'AWARENESS' || analysis.category === 'ENGAGEMENT') {
    subgoals.push({
      id: 'content_strategy',
      title: 'Content Strategy & Planning',
      description: 'Develop content calendar and creative concepts',
      priority: 8,
      estimatedTime: 120, // 2 hours
      requiredCapabilities: ['content_creation', 'creative_planning', 'platform_optimization'],
      successCriteria: [
        'Content calendar created',
        'Creative concepts approved',
        'Platform-specific adaptations planned',
        'Engagement tactics defined',
      ],
    });
  }

  // Phase 4: Campaign Setup (conversion-focused)
  if (analysis.category === 'CONVERSION' || analysis.category === 'GROWTH') {
    subgoals.push({
      id: 'campaign_setup',
      title: 'Campaign Infrastructure Setup',
      description: 'Set up tracking, automation, and optimization systems',
      priority: 8,
      estimatedTime: 90,
      requiredCapabilities: ['campaign_management', 'analytics_setup', 'automation_config'],
      successCriteria: [
        'Tracking systems configured',
        'Automation workflows activated',
        'A/B testing framework ready',
        'Performance baselines established',
      ],
    });
  }

  // Phase 5: Execution & Launch
  subgoals.push({
    id: 'execution_launch',
    title: 'Campaign Execution & Launch',
    description: 'Execute planned activities and launch campaigns',
    priority: 7,
    estimatedTime: getExecutionTime(analysis),
    requiredCapabilities: getExecutionCapabilities(analysis),
    successCriteria: [
      'All campaign elements activated',
      'Initial performance metrics captured',
      'Quality assurance completed',
      'Launch announcement distributed',
    ],
  });

  // Phase 6: Monitoring & Optimization
  subgoals.push({
    id: 'monitoring_optimization',
    title: 'Performance Monitoring & Optimization',
    description: 'Monitor results and continuously optimize performance',
    priority: 6,
    estimatedTime: 180, // 3 hours spread over campaign duration
    requiredCapabilities: ['performance_monitoring', 'data_analysis', 'optimization_tuning'],
    successCriteria: [
      'Performance dashboard active',
      'Optimization recommendations implemented',
      'ROI tracking operational',
      'Success metrics achieved',
    ],
  });

  return subgoals;
}

/**
 * Create agent assignment sequence
 */
async function createAgentSequence(
  subgoals: SubGoal[],
  analysis: GoalAnalysis
): Promise<AgentAssignment[]> {
  const assignments: AgentAssignment[] = [];

  // Phase 1: Research (Trend + Insight Agents)
  assignments.push({
    agentType: AgentType.TREND,
    phase: 1,
    tasks: [
      'Analyze current market trends',
      'Identify trending topics and hashtags',
      'Research competitor activities',
    ],
    dependencies: [],
    estimatedDuration: 30,
    fallbackAgents: [AgentType.INSIGHT],
  });

  assignments.push({
    agentType: AgentType.INSIGHT,
    phase: 1,
    tasks: [
      'Generate strategic insights',
      'Analyze historical performance data',
      'Identify optimization opportunities',
    ],
    dependencies: ['trend_analysis_complete'],
    estimatedDuration: 30,
  });

  // Phase 2: Planning (Brand Voice + Goal Planner)
  assignments.push({
    agentType: AgentType.BRAND_VOICE,
    phase: 2,
    tasks: ['Validate brand alignment', 'Ensure voice consistency', 'Review messaging guidelines'],
    dependencies: ['insights_complete'],
    estimatedDuration: 20,
  });

  assignments.push({
    agentType: AgentType.GOAL_PLANNER,
    phase: 2,
    tasks: ['Finalize strategic plan', 'Allocate resources', 'Set success criteria'],
    dependencies: ['brand_validation_complete'],
    estimatedDuration: 40,
  });

  // Phase 3: Content Creation (category-specific)
  if (analysis.category === 'AWARENESS' || analysis.category === 'ENGAGEMENT') {
    assignments.push({
      agentType: AgentType.CONTENT,
      phase: 3,
      tasks: [
        'Generate content concepts',
        'Create platform-specific content',
        'Optimize for engagement',
      ],
      dependencies: ['strategic_plan_complete'],
      estimatedDuration: 60,
      fallbackAgents: [AgentType.DESIGN],
    });

    assignments.push({
      agentType: AgentType.DESIGN,
      phase: 3,
      tasks: ['Create visual assets', 'Ensure design consistency', 'Optimize for platforms'],
      dependencies: ['content_concepts_ready'],
      estimatedDuration: 45,
    });
  }

  // Phase 4: Technical Setup
  if (analysis.category === 'CONVERSION') {
    assignments.push({
      agentType: AgentType.AD,
      phase: 4,
      tasks: ['Set up ad campaigns', 'Configure targeting parameters', 'Implement tracking pixels'],
      dependencies: ['content_ready'],
      estimatedDuration: 45,
    });

    assignments.push({
      agentType: AgentType.SEO,
      phase: 4,
      tasks: [
        'Optimize landing pages',
        'Implement SEO best practices',
        'Set up conversion tracking',
      ],
      dependencies: ['ad_setup_complete'],
      estimatedDuration: 30,
    });
  }

  // Phase 5: Execution (platform-specific agents)
  const executionAgents = getExecutionAgents(analysis);
  executionAgents.forEach((agentType, index) => {
    assignments.push({
      agentType,
      phase: 5,
      tasks: getPlatformTasks(agentType),
      dependencies: index === 0 ? ['setup_complete'] : [`${executionAgents[index - 1]}_launched`],
      estimatedDuration: 30,
    });
  });

  return assignments;
}

// Helper functions
function extractIntent(goal: string): string {
  // Simple intent extraction - in production, would use NLP
  const goalLower = goal.toLowerCase();

  if (
    goalLower.includes('increase') ||
    goalLower.includes('boost') ||
    goalLower.includes('improve')
  ) {
    return goal.split(/increase|boost|improve/i)[1]?.trim() || 'performance improvement';
  } else if (goalLower.includes('generate') || goalLower.includes('create')) {
    return goal.split(/generate|create/i)[1]?.trim() || 'content generation';
  } else if (goalLower.includes('launch') || goalLower.includes('start')) {
    return goal.split(/launch|start/i)[1]?.trim() || 'campaign launch';
  }

  return goal.length > 50 ? `${goal.substring(0, 50)}...` : goal;
}

function extractRequiredSkills(goal: string, category: GoalAnalysis['category']): string[] {
  const skills: string[] = [];
  const goalLower = goal.toLowerCase();

  // Base skills by category
  switch (category) {
    case 'AWARENESS':
      skills.push('brand_building', 'content_creation', 'social_media');
      break;
    case 'ENGAGEMENT':
      skills.push('community_management', 'content_optimization', 'interactive_design');
      break;
    case 'CONVERSION':
      skills.push('funnel_optimization', 'ad_management', 'analytics');
      break;
    case 'RETENTION':
      skills.push('email_marketing', 'customer_success', 'loyalty_programs');
      break;
    case 'GROWTH':
      skills.push('scaling_strategies', 'automation', 'data_analysis');
      break;
  }

  // Add specific skills based on goal content
  if (goalLower.includes('seo')) skills.push('search_optimization');
  if (goalLower.includes('email')) skills.push('email_marketing');
  if (goalLower.includes('social')) skills.push('social_media_management');
  if (goalLower.includes('video')) skills.push('video_production');
  if (goalLower.includes('design')) skills.push('graphic_design');

  return [...new Set(skills)]; // Remove duplicates
}

function getExecutionTime(analysis: GoalAnalysis): number {
  const baseTime = 60; // 1 hour base

  let multiplier = 1;
  switch (analysis.urgency) {
    case 'CRITICAL':
      multiplier = 0.7;
      break; // Faster execution
    case 'HIGH':
      multiplier = 0.8;
      break;
    case 'MEDIUM':
      multiplier = 1;
      break;
    case 'LOW':
      multiplier = 1.5;
      break; // More thorough execution
  }

  return Math.round(baseTime * multiplier);
}

function getExecutionCapabilities(analysis: GoalAnalysis): string[] {
  const capabilities = ['campaign_execution', 'quality_assurance'];

  switch (analysis.category) {
    case 'AWARENESS':
      capabilities.push('brand_amplification', 'reach_optimization');
      break;
    case 'ENGAGEMENT':
      capabilities.push('community_engagement', 'interaction_optimization');
      break;
    case 'CONVERSION':
      capabilities.push('conversion_optimization', 'funnel_management');
      break;
    case 'RETENTION':
      capabilities.push('relationship_building', 'customer_nurturing');
      break;
    case 'GROWTH':
      capabilities.push('scale_management', 'growth_hacking');
      break;
  }

  return capabilities;
}

function getExecutionAgents(analysis: GoalAnalysis): AgentType[] {
  const agents: AgentType[] = [];

  switch (analysis.category) {
    case 'AWARENESS':
    case 'ENGAGEMENT':
      agents.push(AgentType.SOCIAL_POSTING, AgentType.CONTENT);
      break;
    case 'CONVERSION':
      agents.push(AgentType.AD, AgentType.EMAIL_MARKETING);
      break;
    case 'RETENTION':
      agents.push(AgentType.EMAIL_MARKETING, AgentType.CUSTOMER_SUPPORT);
      break;
    case 'GROWTH':
      agents.push(AgentType.AD, AgentType.SEO, AgentType.SOCIAL_POSTING);
      break;
  }

  return agents;
}

function getPlatformTasks(agentType: AgentType): string[] {
  switch (agentType) {
    case AgentType.SOCIAL_POSTING:
      return ['Schedule social posts', 'Monitor engagement', 'Respond to interactions'];
    case AgentType.CONTENT:
      return ['Publish content', 'Update content calendar', 'Track content performance'];
    case AgentType.AD:
      return ['Launch ad campaigns', 'Monitor ad performance', 'Adjust targeting'];
    case AgentType.EMAIL_MARKETING:
      return ['Send email campaigns', 'Track open rates', 'Segment audiences'];
    case AgentType.SEO:
      return ['Optimize content', 'Monitor rankings', 'Update meta data'];
    default:
      return ['Execute assigned tasks', 'Monitor performance', 'Report results'];
  }
}

function calculateTotalTime(subgoals: SubGoal[], agentSequence: AgentAssignment[]): number {
  const subgoalTime = subgoals.reduce((total, subgoal) => total + subgoal.estimatedTime, 0);
  const agentTime = agentSequence.reduce(
    (total, assignment) => total + assignment.estimatedDuration,
    0
  );

  // Return the maximum of the two (assuming some parallelization)
  return Math.max(subgoalTime, agentTime);
}

function determineComplexity(
  subgoals: SubGoal[],
  agentSequence: AgentAssignment[]
): DecomposedGoal['complexity'] {
  const totalSubgoals = subgoals.length;
  const totalAgents = agentSequence.length;
  const totalTime = calculateTotalTime(subgoals, agentSequence);

  if (totalSubgoals <= 3 && totalAgents <= 3 && totalTime <= 180) return 'LOW';
  if (totalSubgoals <= 5 && totalAgents <= 6 && totalTime <= 360) return 'MEDIUM';
  if (totalSubgoals <= 8 && totalAgents <= 10 && totalTime <= 600) return 'HIGH';
  return 'CRITICAL';
}

function identifyRiskFactors(analysis: GoalAnalysis, subgoals: SubGoal[]): string[] {
  const risks: string[] = [];

  if (analysis.urgency === 'CRITICAL') {
    risks.push('Tight timeline may impact quality');
  }

  if (analysis.category === 'CONVERSION' && !analysis.targetMetrics.length) {
    risks.push('No specific conversion targets defined');
  }

  if (subgoals.length > 6) {
    risks.push('Complex goal with many dependencies');
  }

  if (analysis.resourceRequirements.humanOverSight) {
    risks.push('Requires human oversight for critical decisions');
  }

  return risks;
}

function extractDependencies(subgoals: SubGoal[], agentSequence: AgentAssignment[]): string[] {
  const dependencies = new Set<string>();

  agentSequence.forEach(assignment => {
    assignment.dependencies.forEach(dep => dependencies.add(dep));
  });

  return Array.from(dependencies);
}

function generateSuccessMetrics(analysis: GoalAnalysis): string[] {
  const metrics = ['Goal completion rate', 'Time to completion', 'Resource efficiency'];

  analysis.targetMetrics.forEach(target => {
    metrics.push(`${target.metric}: ${target.target}${target.unit} in ${target.timeframe}`);
  });

  return metrics;
}
