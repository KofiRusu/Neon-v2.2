import { PrismaClient, AgentType } from '@prisma/client';

export interface AgentEfficiencyMetrics {
  agentType: AgentType;
  totalRuns: number;
  avgCost: number;
  avgTokens: number;
  avgImpactScore: number;
  conversionRate: number;
  costPerImpact: number;
  costPerConversion: number;
  qualityScore: number;
  avgRetryCount: number;
  avgExecutionTime: number;
  efficiencyRating: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR' | 'CRITICAL';
  recommendedOptimizations: string[];
}

export interface OptimizationSuggestion {
  agentType: AgentType;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  category: 'COST' | 'QUALITY' | 'SPEED' | 'RELIABILITY';
  suggestion: string;
  expectedSavings: number;
  implementationEffort: 'LOW' | 'MEDIUM' | 'HIGH';
}

export class AgentCostEfficiencyAnalyzer {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async getAgentEfficiencyMetrics(
    agentType?: AgentType,
    timeframe?: { start: Date; end: Date }
  ): Promise<AgentEfficiencyMetrics[]> {
    const whereClause: any = {};

    if (agentType) {
      whereClause.agentType = agentType;
    }

    if (timeframe) {
      whereClause.timestamp = {
        gte: timeframe.start,
        lte: timeframe.end,
      };
    }

    // Get billing logs grouped by agent type
    const billingLogs = await this.prisma.billingLog.findMany({
      where: whereClause,
      orderBy: { timestamp: 'desc' },
    });

    // Group by agent type and calculate metrics
    const agentGroups = this.groupByAgentType(billingLogs);
    const metrics: AgentEfficiencyMetrics[] = [];

    for (const [agentTypeKey, logs] of Object.entries(agentGroups)) {
      const agentMetrics = this.calculateAgentMetrics(agentTypeKey as AgentType, logs);
      metrics.push(agentMetrics);
    }

    // Sort by efficiency rating
    return metrics.sort((a, b) => {
      const ratingOrder = { CRITICAL: 0, POOR: 1, AVERAGE: 2, GOOD: 3, EXCELLENT: 4 };
      return ratingOrder[a.efficiencyRating] - ratingOrder[b.efficiencyRating];
    });
  }

  private groupByAgentType(logs: any[]): Record<string, any[]> {
    return logs.reduce(
      (groups, log) => {
        const agentType = log.agentType;
        if (!groups[agentType]) {
          groups[agentType] = [];
        }
        groups[agentType].push(log);
        return groups;
      },
      {} as Record<string, any[]>
    );
  }

  private calculateAgentMetrics(agentType: AgentType, logs: any[]): AgentEfficiencyMetrics {
    const totalRuns = logs.length;
    const totalCost = logs.reduce((sum, log) => sum + log.cost, 0);
    const totalTokens = logs.reduce((sum, log) => sum + log.tokens, 0);
    const totalImpact = logs.reduce((sum, log) => sum + (log.impactScore || 0), 0);
    const conversions = logs.filter(log => log.conversionAchieved).length;
    const totalQuality = logs.reduce((sum, log) => sum + (log.qualityScore || 0), 0);
    const totalRetries = logs.reduce((sum, log) => sum + (log.retryCount || 0), 0);
    const totalExecutionTime = logs.reduce((sum, log) => sum + (log.executionTime || 0), 0);

    const avgCost = totalCost / totalRuns;
    const avgTokens = totalTokens / totalRuns;
    const avgImpactScore = totalImpact / totalRuns;
    const conversionRate = (conversions / totalRuns) * 100;
    const costPerImpact = avgImpactScore > 0 ? avgCost / avgImpactScore : Infinity;
    const costPerConversion = conversions > 0 ? totalCost / conversions : Infinity;
    const qualityScore = totalQuality / totalRuns;
    const avgRetryCount = totalRetries / totalRuns;
    const avgExecutionTime = totalExecutionTime / totalRuns;

    const efficiencyRating = this.calculateEfficiencyRating({
      avgCost,
      avgImpactScore,
      conversionRate,
      costPerImpact,
      qualityScore,
      avgRetryCount,
    });

    const recommendedOptimizations = this.generateOptimizationRecommendations({
      agentType,
      avgCost,
      avgImpactScore,
      conversionRate,
      costPerImpact,
      qualityScore,
      avgRetryCount,
      avgExecutionTime,
    });

    return {
      agentType,
      totalRuns,
      avgCost,
      avgTokens,
      avgImpactScore,
      conversionRate,
      costPerImpact,
      costPerConversion,
      qualityScore,
      avgRetryCount,
      avgExecutionTime,
      efficiencyRating,
      recommendedOptimizations,
    };
  }

  private calculateEfficiencyRating(metrics: {
    avgCost: number;
    avgImpactScore: number;
    conversionRate: number;
    costPerImpact: number;
    qualityScore: number;
    avgRetryCount: number;
  }): 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR' | 'CRITICAL' {
    let score = 0;

    // Cost efficiency (0-25 points)
    if (metrics.avgCost < 0.01) score += 25;
    else if (metrics.avgCost < 0.05) score += 20;
    else if (metrics.avgCost < 0.1) score += 15;
    else if (metrics.avgCost < 0.2) score += 10;
    else score += 0;

    // Impact score (0-25 points)
    if (metrics.avgImpactScore > 0.8) score += 25;
    else if (metrics.avgImpactScore > 0.6) score += 20;
    else if (metrics.avgImpactScore > 0.4) score += 15;
    else if (metrics.avgImpactScore > 0.2) score += 10;
    else score += 0;

    // Conversion rate (0-25 points)
    if (metrics.conversionRate > 80) score += 25;
    else if (metrics.conversionRate > 60) score += 20;
    else if (metrics.conversionRate > 40) score += 15;
    else if (metrics.conversionRate > 20) score += 10;
    else score += 0;

    // Quality and reliability (0-25 points)
    const qualityReliabilityScore =
      metrics.qualityScore * 0.7 + (1 - Math.min(metrics.avgRetryCount, 1)) * 0.3;
    if (qualityReliabilityScore > 0.8) score += 25;
    else if (qualityReliabilityScore > 0.6) score += 20;
    else if (qualityReliabilityScore > 0.4) score += 15;
    else if (qualityReliabilityScore > 0.2) score += 10;
    else score += 0;

    if (score >= 85) return 'EXCELLENT';
    if (score >= 70) return 'GOOD';
    if (score >= 50) return 'AVERAGE';
    if (score >= 30) return 'POOR';
    return 'CRITICAL';
  }

  private generateOptimizationRecommendations(metrics: {
    agentType: AgentType;
    avgCost: number;
    avgImpactScore: number;
    conversionRate: number;
    costPerImpact: number;
    qualityScore: number;
    avgRetryCount: number;
    avgExecutionTime: number;
  }): string[] {
    const recommendations: string[] = [];

    // High cost recommendations
    if (metrics.avgCost > 0.05) {
      recommendations.push('🔻 Consider switching to gpt-4o-mini for cost reduction');
      recommendations.push('✂️ Simplify prompts to reduce token usage');
    }

    // Low impact score recommendations
    if (metrics.avgImpactScore < 0.4) {
      recommendations.push('🎯 Refine prompts to improve output relevance');
      recommendations.push('📊 Add more specific success criteria and feedback loops');
    }

    // Low conversion rate recommendations
    if (metrics.conversionRate < 40) {
      recommendations.push('🔄 Review and optimize task workflow');
      recommendations.push('📝 Add validation steps before execution');
    }

    // High retry count recommendations
    if (metrics.avgRetryCount > 0.5) {
      recommendations.push('🛠️ Implement better error handling and validation');
      recommendations.push('⚡ Add prompt engineering to reduce failures');
    }

    // Long execution time recommendations
    if (metrics.avgExecutionTime > 10000) {
      // 10+ seconds
      recommendations.push('⚡ Optimize prompt length and complexity');
      recommendations.push('🚀 Consider parallel processing for complex tasks');
    }

    // Quality recommendations
    if (metrics.qualityScore < 0.6) {
      recommendations.push('🎨 Improve prompt clarity and examples');
      recommendations.push('🔍 Add quality validation steps');
    }

    return recommendations;
  }

  async generateOptimizationSuggestions(timeframe?: {
    start: Date;
    end: Date;
  }): Promise<OptimizationSuggestion[]> {
    const metrics = await this.getAgentEfficiencyMetrics(undefined, timeframe);
    const suggestions: OptimizationSuggestion[] = [];

    for (const metric of metrics) {
      if (metric.efficiencyRating === 'CRITICAL' || metric.efficiencyRating === 'POOR') {
        // High priority optimizations for poor performers
        if (metric.avgCost > 0.1) {
          suggestions.push({
            agentType: metric.agentType,
            priority: 'HIGH',
            category: 'COST',
            suggestion: `Switch ${metric.agentType} to gpt-4o-mini model to reduce cost from $${metric.avgCost.toFixed(4)} to ~$${(metric.avgCost * 0.3).toFixed(4)} per run`,
            expectedSavings: metric.avgCost * 0.7 * metric.totalRuns,
            implementationEffort: 'LOW',
          });
        }

        if (metric.avgRetryCount > 1) {
          suggestions.push({
            agentType: metric.agentType,
            priority: 'HIGH',
            category: 'RELIABILITY',
            suggestion: `Improve ${metric.agentType} prompt engineering to reduce retry rate from ${metric.avgRetryCount.toFixed(1)} to <0.5`,
            expectedSavings: metric.avgCost * metric.avgRetryCount * 0.5 * metric.totalRuns,
            implementationEffort: 'MEDIUM',
          });
        }
      }

      if (metric.avgImpactScore < 0.5) {
        suggestions.push({
          agentType: metric.agentType,
          priority: metric.efficiencyRating === 'CRITICAL' ? 'HIGH' : 'MEDIUM',
          category: 'QUALITY',
          suggestion: `Refine ${metric.agentType} prompts to improve impact score from ${metric.avgImpactScore.toFixed(2)} to >0.7`,
          expectedSavings: 0, // Quality improvements have indirect savings
          implementationEffort: 'MEDIUM',
        });
      }
    }

    return suggestions.sort((a, b) => {
      const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  async close(): Promise<void> {
    await this.prisma.$disconnect();
  }
}

// Utility functions for easy access
export async function getTopInefficiencyAgents(
  limit: number = 3
): Promise<AgentEfficiencyMetrics[]> {
  const analyzer = new AgentCostEfficiencyAnalyzer();
  try {
    const metrics = await analyzer.getAgentEfficiencyMetrics();
    return metrics.slice(0, limit);
  } finally {
    await analyzer.close();
  }
}

export async function calculateCostPerImpact(
  agentType: AgentType,
  timeframe?: { start: Date; end: Date }
): Promise<number> {
  const analyzer = new AgentCostEfficiencyAnalyzer();
  try {
    const metrics = await analyzer.getAgentEfficiencyMetrics(agentType, timeframe);
    return metrics[0]?.costPerImpact || Infinity;
  } finally {
    await analyzer.close();
  }
}

export async function calculateCostPerConversion(
  agentType: AgentType,
  timeframe?: { start: Date; end: Date }
): Promise<number> {
  const analyzer = new AgentCostEfficiencyAnalyzer();
  try {
    const metrics = await analyzer.getAgentEfficiencyMetrics(agentType, timeframe);
    return metrics[0]?.costPerConversion || Infinity;
  } finally {
    await analyzer.close();
  }
}
