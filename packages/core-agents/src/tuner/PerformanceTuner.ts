import { AgentMemoryStore, MemoryEntry, MemoryMetrics } from '../memory/AgentMemoryStore';

export interface TuningRecommendation {
  type: 'cost' | 'performance' | 'accuracy' | 'reliability';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  recommendation: string;
  expectedImpact: string;
  dataSupport: {
    metric: string;
    currentValue: number;
    benchmarkValue: number;
    trend: 'improving' | 'declining' | 'stable';
  };
  suggestedActions: Array<{
    action: string;
    priority: 'low' | 'medium' | 'high';
    estimatedEffort: 'low' | 'medium' | 'high';
  }>;
}

export interface AgentPerformanceProfile {
  agentId: string;
  agentName: string;
  overallHealth: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  healthScore: number; // 0-100
  metrics: MemoryMetrics;
  recommendations: TuningRecommendation[];
  benchmarkComparison: {
    costEfficiency: 'above_average' | 'average' | 'below_average';
    executionSpeed: 'above_average' | 'average' | 'below_average';
    reliability: 'above_average' | 'average' | 'below_average';
    accuracy: 'above_average' | 'average' | 'below_average';
  };
  trends: {
    costTrend: 'improving' | 'stable' | 'declining';
    performanceTrend: 'improving' | 'stable' | 'declining';
    successTrend: 'improving' | 'stable' | 'declining';
  };
}

export interface SystemWideAnalysis {
  totalAgents: number;
  overallHealth: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  totalCost: number;
  costTrend: 'improving' | 'stable' | 'declining';
  averageSuccessRate: number;
  topPerformers: Array<{ agentId: string; score: number }>;
  underperformers: Array<{ agentId: string; issues: string[] }>;
  systemRecommendations: TuningRecommendation[];
  criticalIssues: Array<{
    agentId: string;
    issue: string;
    impact: 'high' | 'critical';
    urgency: 'immediate' | 'soon' | 'scheduled';
  }>;
}

export class PerformanceTuner {
  private memoryStore: AgentMemoryStore;

  // Performance benchmarks (these could be configurable)
  private benchmarks = {
    costPerRun: {
      excellent: 0.01,
      good: 0.05,
      fair: 0.1,
      poor: 0.25,
    },
    executionTime: {
      excellent: 1000, // 1 second
      good: 5000, // 5 seconds
      fair: 15000, // 15 seconds
      poor: 30000, // 30 seconds
    },
    successRate: {
      excellent: 95,
      good: 90,
      fair: 80,
      poor: 70,
    },
    tokenEfficiency: {
      excellent: 100, // tokens per success
      good: 500,
      fair: 1000,
      poor: 2000,
    },
  };

  constructor(memoryStore: AgentMemoryStore) {
    this.memoryStore = memoryStore;
  }

  /**
   * Analyze performance for a specific agent
   */
  async analyzeAgent(agentId: string, days: number = 30): Promise<AgentPerformanceProfile> {
    const metrics = await this.memoryStore.getAgentMetrics(agentId, days);
    const recommendations = await this.generateRecommendations(agentId, metrics, days);
    const healthScore = this.calculateHealthScore(metrics);
    const overallHealth = this.determineHealthStatus(healthScore);

    // Get all agent metrics for benchmarking
    const allMetrics = await this.memoryStore.getAllAgentMetrics(days);
    const benchmarkComparison = this.compareToBenchmarks(metrics, allMetrics);
    const trends = this.analyzeTrends(metrics);

    return {
      agentId,
      agentName: this.getAgentName(agentId),
      overallHealth,
      healthScore,
      metrics,
      recommendations,
      benchmarkComparison,
      trends,
    };
  }

  /**
   * Analyze system-wide performance
   */
  async analyzeSystem(days: number = 30): Promise<SystemWideAnalysis> {
    const allMetrics = await this.memoryStore.getAllAgentMetrics(days);
    const agentProfiles = await Promise.all(
      Object.keys(allMetrics).map(agentId => this.analyzeAgent(agentId, days))
    );

    const totalCost = Object.values(allMetrics).reduce((sum, m) => sum + m.totalCost, 0);
    const averageSuccessRate =
      Object.values(allMetrics).reduce((sum, m) => sum + m.successRate, 0) /
      Object.keys(allMetrics).length;

    const topPerformers = agentProfiles
      .map(p => ({ agentId: p.agentId, score: p.healthScore }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    const underperformers = agentProfiles
      .filter(p => p.overallHealth === 'poor' || p.overallHealth === 'critical')
      .map(p => ({
        agentId: p.agentId,
        issues: p.recommendations
          .filter(r => r.severity === 'high' || r.severity === 'critical')
          .map(r => r.title),
      }));

    const criticalIssues = agentProfiles.flatMap(p =>
      p.recommendations
        .filter(r => r.severity === 'critical')
        .map(r => ({
          agentId: p.agentId,
          issue: r.title,
          impact: r.severity === 'critical' ? 'critical' : ('high' as 'critical' | 'high'),
          urgency: 'immediate' as 'immediate' | 'soon' | 'scheduled',
        }))
    );

    const systemRecommendations = this.generateSystemRecommendations(agentProfiles, allMetrics);
    const overallHealth = this.determineSystemHealth(agentProfiles);
    const costTrend = this.determineSystemCostTrend(allMetrics);

    return {
      totalAgents: Object.keys(allMetrics).length,
      overallHealth,
      totalCost,
      costTrend,
      averageSuccessRate,
      topPerformers,
      underperformers,
      systemRecommendations,
      criticalIssues,
    };
  }

  /**
   * Generate tuning recommendations for an agent
   */
  private async generateRecommendations(
    agentId: string,
    metrics: MemoryMetrics,
    days: number
  ): Promise<TuningRecommendation[]> {
    const recommendations: TuningRecommendation[] = [];

    // Cost analysis
    if (metrics.averageCost > this.benchmarks.costPerRun.fair) {
      const costTrend = this.determineTrend(metrics.costTrend);
      recommendations.push({
        type: 'cost',
        severity: metrics.averageCost > this.benchmarks.costPerRun.poor ? 'critical' : 'high',
        title: 'High Cost Per Execution',
        description: `Average cost of $${metrics.averageCost.toFixed(4)} per run is above benchmark.`,
        recommendation:
          'Consider using a more cost-effective model or optimizing prompts to reduce token usage.',
        expectedImpact: `Could reduce costs by 30-50% (estimated savings: $${(metrics.totalCost * 0.4).toFixed(2)}/month)`,
        dataSupport: {
          metric: 'averageCost',
          currentValue: metrics.averageCost,
          benchmarkValue: this.benchmarks.costPerRun.good,
          trend: costTrend,
        },
        suggestedActions: [
          {
            action: 'Switch to GPT-3.5-turbo for non-critical tasks',
            priority: 'high',
            estimatedEffort: 'low',
          },
          {
            action: 'Optimize prompt length and complexity',
            priority: 'medium',
            estimatedEffort: 'medium',
          },
          {
            action: 'Implement intelligent model selection based on task complexity',
            priority: 'medium',
            estimatedEffort: 'high',
          },
        ],
      });
    }

    // Performance analysis
    if (metrics.averageExecutionTime > this.benchmarks.executionTime.fair) {
      const perfTrend = this.determineTrend(metrics.performanceTrend);
      recommendations.push({
        type: 'performance',
        severity:
          metrics.averageExecutionTime > this.benchmarks.executionTime.poor ? 'high' : 'medium',
        title: 'Slow Execution Time',
        description: `Average execution time of ${(metrics.averageExecutionTime / 1000).toFixed(2)}s is above optimal range.`,
        recommendation: 'Optimize agent logic, implement caching, or consider parallel processing.',
        expectedImpact: 'Could improve response time by 40-60%',
        dataSupport: {
          metric: 'averageExecutionTime',
          currentValue: metrics.averageExecutionTime,
          benchmarkValue: this.benchmarks.executionTime.good,
          trend: perfTrend,
        },
        suggestedActions: [
          {
            action: 'Implement response caching for repeated queries',
            priority: 'high',
            estimatedEffort: 'medium',
          },
          {
            action: 'Optimize API calls and reduce unnecessary processing',
            priority: 'high',
            estimatedEffort: 'low',
          },
          {
            action: 'Consider asynchronous processing for non-critical tasks',
            priority: 'medium',
            estimatedEffort: 'high',
          },
        ],
      });
    }

    // Reliability analysis
    if (metrics.successRate < this.benchmarks.successRate.fair) {
      const successTrend = this.determineTrend(metrics.successTrend);
      recommendations.push({
        type: 'reliability',
        severity: metrics.successRate < this.benchmarks.successRate.poor ? 'critical' : 'high',
        title: 'Low Success Rate',
        description: `Success rate of ${metrics.successRate.toFixed(1)}% is below acceptable threshold.`,
        recommendation: 'Implement better error handling, retry logic, and input validation.',
        expectedImpact: `Could improve success rate to 90%+ (${(90 - metrics.successRate).toFixed(1)}% improvement)`,
        dataSupport: {
          metric: 'successRate',
          currentValue: metrics.successRate,
          benchmarkValue: this.benchmarks.successRate.good,
          trend: successTrend,
        },
        suggestedActions: [
          {
            action: 'Implement exponential backoff retry logic',
            priority: 'high',
            estimatedEffort: 'low',
          },
          {
            action: 'Add comprehensive input validation',
            priority: 'high',
            estimatedEffort: 'medium',
          },
          {
            action: 'Implement fallback strategies for common failure modes',
            priority: 'medium',
            estimatedEffort: 'high',
          },
        ],
      });
    }

    // Token efficiency analysis
    const tokenEfficiency = metrics.totalTokens / Math.max(metrics.totalRuns, 1);
    if (tokenEfficiency > this.benchmarks.tokenEfficiency.fair) {
      recommendations.push({
        type: 'cost',
        severity: tokenEfficiency > this.benchmarks.tokenEfficiency.poor ? 'high' : 'medium',
        title: 'Inefficient Token Usage',
        description: `Average ${tokenEfficiency.toFixed(0)} tokens per run suggests prompt optimization opportunities.`,
        recommendation: 'Refactor prompts to be more concise while maintaining effectiveness.',
        expectedImpact: 'Could reduce token usage by 25-40%',
        dataSupport: {
          metric: 'tokenEfficiency',
          currentValue: tokenEfficiency,
          benchmarkValue: this.benchmarks.tokenEfficiency.good,
          trend: 'stable',
        },
        suggestedActions: [
          {
            action: 'Review and optimize prompt templates',
            priority: 'medium',
            estimatedEffort: 'medium',
          },
          {
            action: 'Remove unnecessary context and examples',
            priority: 'medium',
            estimatedEffort: 'low',
          },
          {
            action: 'Implement dynamic context loading',
            priority: 'low',
            estimatedEffort: 'high',
          },
        ],
      });
    }

    return recommendations.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }

  /**
   * Calculate overall health score for an agent
   */
  private calculateHealthScore(metrics: MemoryMetrics): number {
    let score = 100;

    // Success rate weight: 40%
    const successPenalty = Math.max(
      0,
      (this.benchmarks.successRate.good - metrics.successRate) * 0.4
    );
    score -= successPenalty;

    // Cost efficiency weight: 30%
    const costMultiplier = metrics.averageCost / this.benchmarks.costPerRun.good;
    const costPenalty = Math.min(30, Math.max(0, (costMultiplier - 1) * 15));
    score -= costPenalty;

    // Performance weight: 20%
    const perfMultiplier = metrics.averageExecutionTime / this.benchmarks.executionTime.good;
    const perfPenalty = Math.min(20, Math.max(0, (perfMultiplier - 1) * 10));
    score -= perfPenalty;

    // Token efficiency weight: 10%
    const tokenEfficiency = metrics.averageTokens / Math.max(metrics.totalRuns, 1);
    const tokenMultiplier = tokenEfficiency / this.benchmarks.tokenEfficiency.good;
    const tokenPenalty = Math.min(10, Math.max(0, (tokenMultiplier - 1) * 5));
    score -= tokenPenalty;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Determine health status from score
   */
  private determineHealthStatus(
    score: number
  ): 'excellent' | 'good' | 'fair' | 'poor' | 'critical' {
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'fair';
    if (score >= 40) return 'poor';
    return 'critical';
  }

  /**
   * Compare agent metrics to benchmarks and other agents
   */
  private compareToBenchmarks(
    metrics: MemoryMetrics,
    allMetrics: Record<string, MemoryMetrics>
  ): AgentPerformanceProfile['benchmarkComparison'] {
    const allValues = Object.values(allMetrics);

    const avgCost = allValues.reduce((sum, m) => sum + m.averageCost, 0) / allValues.length;
    const avgExecTime =
      allValues.reduce((sum, m) => sum + m.averageExecutionTime, 0) / allValues.length;
    const avgSuccessRate = allValues.reduce((sum, m) => sum + m.successRate, 0) / allValues.length;
    const avgTokens = allValues.reduce((sum, m) => sum + m.averageTokens, 0) / allValues.length;

    return {
      costEfficiency: this.compareToAverage(metrics.averageCost, avgCost, 'lower_better'),
      executionSpeed: this.compareToAverage(
        metrics.averageExecutionTime,
        avgExecTime,
        'lower_better'
      ),
      reliability: this.compareToAverage(metrics.successRate, avgSuccessRate, 'higher_better'),
      accuracy: metrics.averageScore
        ? this.compareToAverage(metrics.averageScore, 75, 'higher_better')
        : 'average',
    };
  }

  /**
   * Analyze trends from metrics
   */
  private analyzeTrends(metrics: MemoryMetrics): AgentPerformanceProfile['trends'] {
    return {
      costTrend: this.determineTrend(metrics.costTrend),
      performanceTrend: this.determineTrend(metrics.performanceTrend),
      successTrend: this.determineTrend(metrics.successTrend),
    };
  }

  /**
   * Determine trend direction from trend data
   */
  private determineTrend(
    trendData: Array<{ date: string; [key: string]: any }>
  ): 'improving' | 'stable' | 'declining' {
    if (trendData.length < 2) return 'stable';

    const values = trendData
      .map(d => Object.values(d).find(v => typeof v === 'number') as number)
      .filter(v => v !== undefined);
    if (values.length < 2) return 'stable';

    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));

    const firstAvg = firstHalf.reduce((sum, v) => sum + v, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, v) => sum + v, 0) / secondHalf.length;

    const changePercent = Math.abs((secondAvg - firstAvg) / firstAvg) * 100;

    if (changePercent < 5) return 'stable';

    // For cost and execution time, lower is better
    const key = trendData[0] && Object.keys(trendData[0]).find(k => k !== 'date');
    const isLowerBetter = key === 'cost' || key === 'executionTime';

    if (isLowerBetter) {
      return secondAvg < firstAvg ? 'improving' : 'declining';
    } else {
      return secondAvg > firstAvg ? 'improving' : 'declining';
    }
  }

  /**
   * Compare value to average
   */
  private compareToAverage(
    value: number,
    average: number,
    direction: 'higher_better' | 'lower_better'
  ): 'above_average' | 'average' | 'below_average' {
    const threshold = 0.1; // 10% threshold
    const ratio = value / average;

    if (direction === 'higher_better') {
      if (ratio > 1 + threshold) return 'above_average';
      if (ratio < 1 - threshold) return 'below_average';
      return 'average';
    } else {
      if (ratio < 1 - threshold) return 'above_average';
      if (ratio > 1 + threshold) return 'below_average';
      return 'average';
    }
  }

  /**
   * Generate system-wide recommendations
   */
  private generateSystemRecommendations(
    profiles: AgentPerformanceProfile[],
    allMetrics: Record<string, MemoryMetrics>
  ): TuningRecommendation[] {
    const recommendations: TuningRecommendation[] = [];

    // System cost analysis
    const totalCost = Object.values(allMetrics).reduce((sum, m) => sum + m.totalCost, 0);
    const highCostAgents = profiles.filter(
      p => p.metrics.averageCost > this.benchmarks.costPerRun.fair
    );

    if (highCostAgents.length > 0) {
      recommendations.push({
        type: 'cost',
        severity: 'high',
        title: 'System-Wide Cost Optimization Opportunity',
        description: `${highCostAgents.length} agents have above-average costs, representing $${totalCost.toFixed(2)} in monthly spend.`,
        recommendation: 'Implement centralized cost management and model selection strategy.',
        expectedImpact: `Potential monthly savings of $${(totalCost * 0.3).toFixed(2)}`,
        dataSupport: {
          metric: 'systemCost',
          currentValue: totalCost,
          benchmarkValue: totalCost * 0.7,
          trend: 'stable',
        },
        suggestedActions: [
          {
            action: 'Deploy intelligent model routing based on task complexity',
            priority: 'high',
            estimatedEffort: 'high',
          },
          {
            action: 'Implement shared prompt optimization across agents',
            priority: 'medium',
            estimatedEffort: 'medium',
          },
        ],
      });
    }

    return recommendations;
  }

  /**
   * Determine system-wide health
   */
  private determineSystemHealth(
    profiles: AgentPerformanceProfile[]
  ): 'excellent' | 'good' | 'fair' | 'poor' | 'critical' {
    const avgHealthScore = profiles.reduce((sum, p) => sum + p.healthScore, 0) / profiles.length;
    return this.determineHealthStatus(avgHealthScore);
  }

  /**
   * Determine system cost trend
   */
  private determineSystemCostTrend(
    allMetrics: Record<string, MemoryMetrics>
  ): 'improving' | 'stable' | 'declining' {
    const allCostTrends = Object.values(allMetrics).map(m => this.determineTrend(m.costTrend));
    const improvingCount = allCostTrends.filter(t => t === 'improving').length;
    const decliningCount = allCostTrends.filter(t => t === 'declining').length;

    if (improvingCount > decliningCount) return 'improving';
    if (decliningCount > improvingCount) return 'declining';
    return 'stable';
  }

  /**
   * Get agent display name
   */
  private getAgentName(agentId: string): string {
    const agentNames: Record<string, string> = {
      'content-agent': 'Content Agent',
      'seo-agent': 'SEO Agent',
      'email-agent': 'Email Agent',
      'social-agent': 'Social Agent',
      'support-agent': 'Support Agent',
      'ad-agent': 'Ad Agent',
      'outreach-agent': 'Outreach Agent',
      'trend-agent': 'Trend Agent',
      'insight-agent': 'Insight Agent',
      'design-agent': 'Design Agent',
      'brand-voice-agent': 'Brand Voice Agent',
    };

    return agentNames[agentId] || agentId;
  }
}

export default PerformanceTuner;
