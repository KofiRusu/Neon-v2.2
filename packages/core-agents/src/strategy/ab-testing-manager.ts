/**
 * A/B Testing Manager - Launch, Track & Compare Campaign Variants
 * Manages the complete A/B testing lifecycle with statistical significance
 */

import { AgentMemoryStore } from '../memory/AgentMemoryStore';
import { ContentVariant, VariantCombination } from './campaign-variant-generator';

export interface ABTest {
  id: string;
  campaignId: string;
  name: string;
  status: 'draft' | 'running' | 'paused' | 'completed' | 'winner_declared';
  variants: TestVariant[];
  config: ABTestConfig;
  results: ABTestResults;
  winner?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface TestVariant {
  id: string;
  name: string;
  combination: VariantCombination;
  trafficAllocation: number; // Percentage of traffic (0-100)
  status: 'active' | 'paused' | 'winner' | 'loser';
  metrics: VariantMetrics;
}

export interface ABTestConfig {
  testType: 'split' | 'multivariate' | 'sequential';
  duration: number; // Minutes
  minSampleSize: number;
  confidenceLevel: number; // 0.95 for 95% confidence
  statisticalPower: number; // 0.8 for 80% power
  primaryMetric: 'open_rate' | 'click_rate' | 'conversion_rate' | 'revenue';
  secondaryMetrics: string[];
  autoWinner: boolean; // Automatically declare winner when statistically significant
  maxDuration: number; // Maximum test duration in minutes
  trafficSplit: 'equal' | 'weighted' | 'adaptive';
}

export interface VariantMetrics {
  impressions: number;
  opens: number;
  clicks: number;
  conversions: number;
  revenue: number;
  bounces: number;
  unsubscribes: number;
  openRate: number;
  clickRate: number;
  conversionRate: number;
  revenuePerUser: number;
  lastUpdated: Date;
}

export interface ABTestResults {
  totalImpressions: number;
  totalConversions: number;
  testProgress: number; // 0-100
  statisticalSignificance: StatisticalSignificance;
  recommendation: TestRecommendation;
  insights: string[];
  performance: PerformanceComparison[];
}

export interface StatisticalSignificance {
  isSignificant: boolean;
  pValue: number;
  confidenceInterval: [number, number];
  sampleSizeReached: boolean;
  powerAchieved: boolean;
  timeToSignificance?: number; // Estimated minutes
}

export interface TestRecommendation {
  action: 'continue' | 'declare_winner' | 'stop_test' | 'extend_duration' | 'adjust_traffic';
  reason: string;
  confidence: number;
  expectedLift: number;
  estimatedRevenue: number;
}

export interface PerformanceComparison {
  variantId: string;
  variantName: string;
  primaryMetricValue: number;
  lift: number; // Percentage improvement over control
  significance: number; // P-value
  rank: number;
  isWinner: boolean;
  isLoser: boolean;
}

export interface ABTestCreationRequest {
  campaignId: string;
  name: string;
  variants: VariantCombination[];
  config: Partial<ABTestConfig>;
  targetAudience: {
    size: number;
    segments: string[];
    filters: Record<string, any>;
  };
}

export class ABTestingManager {
  private memoryStore: AgentMemoryStore;
  private activeTests: Map<string, ABTest> = new Map();
  private updateInterval: NodeJS.Timeout | null = null;

  constructor(memoryStore: AgentMemoryStore) {
    this.memoryStore = memoryStore;
    this.startPeriodicUpdates();
  }

  /**
   * Create and launch a new A/B test
   */
  async createTest(request: ABTestCreationRequest): Promise<ABTest> {
    try {
      console.log(`🧪 Creating A/B test for campaign ${request.campaignId}`);

      // Generate default config
      const config: ABTestConfig = {
        testType: 'split',
        duration: 2880, // 48 hours default
        minSampleSize: 1000,
        confidenceLevel: 0.95,
        statisticalPower: 0.8,
        primaryMetric: 'conversion_rate',
        secondaryMetrics: ['open_rate', 'click_rate', 'revenue'],
        autoWinner: true,
        maxDuration: 10080, // 7 days max
        trafficSplit: 'equal',
        ...request.config,
      };

      // Create test variants with equal traffic allocation
      const trafficPerVariant = 100 / request.variants.length;
      const testVariants: TestVariant[] = request.variants.map((combination, index) => ({
        id: `variant_${index}`,
        name: combination.name,
        combination,
        trafficAllocation: trafficPerVariant,
        status: 'active',
        metrics: this.initializeMetrics(),
      }));

      // Create the test
      const test: ABTest = {
        id: `abtest_${Date.now()}`,
        campaignId: request.campaignId,
        name: request.name,
        status: 'draft',
        variants: testVariants,
        config,
        results: this.initializeResults(),
        createdAt: new Date(),
      };

      // Store in memory for quick access
      this.activeTests.set(test.id, test);

      // Persist to memory store
      await this.memoryStore.store(`ab_test_${test.id}`, test, [
        'ab_testing',
        'campaign',
        request.campaignId,
      ]);

      console.log(`✅ A/B test created: ${test.id}`);
      return test;
    } catch (error) {
      console.error('❌ A/B test creation failed:', error);
      throw new Error(`A/B test creation failed: ${error}`);
    }
  }

  /**
   * Start an A/B test
   */
  async startTest(testId: string): Promise<void> {
    const test = this.activeTests.get(testId);
    if (!test) {
      throw new Error(`Test ${testId} not found`);
    }

    test.status = 'running';
    test.startedAt = new Date();

    // Calculate sample size requirements
    const requiredSampleSize = this.calculateSampleSize(test.config);
    test.config.minSampleSize = Math.max(test.config.minSampleSize, requiredSampleSize);

    console.log(`🚀 A/B test started: ${testId} (Sample size: ${requiredSampleSize})`);

    // Update stored version
    await this.updateStoredTest(test);
  }

  /**
   * Update test metrics (called by campaign execution)
   */
  async updateTestMetrics(
    testId: string,
    variantId: string,
    metrics: Partial<VariantMetrics>
  ): Promise<void> {
    const test = this.activeTests.get(testId);
    if (!test || test.status !== 'running') {
      return;
    }

    const variant = test.variants.find(v => v.id === variantId);
    if (!variant) {
      return;
    }

    // Update variant metrics
    Object.assign(variant.metrics, metrics);
    variant.metrics.lastUpdated = new Date();

    // Recalculate derived metrics
    this.calculateDerivedMetrics(variant.metrics);

    // Update test results
    this.updateTestResults(test);

    // Check if test should be concluded
    if (test.config.autoWinner) {
      await this.checkTestCompletion(test);
    }
  }

  /**
   * Check if test should be completed and declare winner
   */
  private async checkTestCompletion(test: ABTest): Promise<void> {
    const significance = this.calculateStatisticalSignificance(test);
    test.results.statisticalSignificance = significance;

    const recommendation = this.generateRecommendation(test);
    test.results.recommendation = recommendation;

    // Auto-declare winner if conditions are met
    if (recommendation.action === 'declare_winner' && test.config.autoWinner) {
      await this.declareWinner(test.id);
    }

    // Auto-stop if test runs too long
    const testDuration = Date.now() - (test.startedAt?.getTime() || Date.now());
    if (testDuration > test.config.maxDuration * 60 * 1000) {
      await this.stopTest(test.id, 'max_duration_reached');
    }
  }

  /**
   * Declare the winning variant
   */
  async declareWinner(testId: string): Promise<string> {
    const test = this.activeTests.get(testId);
    if (!test) {
      throw new Error(`Test ${testId} not found`);
    }

    // Find the best performing variant
    const performance = this.calculatePerformanceComparison(test);
    const winner = performance.find(p => p.isWinner);

    if (!winner) {
      throw new Error('No clear winner found');
    }

    test.status = 'winner_declared';
    test.winner = winner.variantId;
    test.completedAt = new Date();

    // Mark winner and losers
    test.variants.forEach(variant => {
      variant.status = variant.id === winner.variantId ? 'winner' : 'loser';
    });

    console.log(
      `🏆 Winner declared for test ${testId}: ${winner.variantName} (${winner.lift.toFixed(2)}% lift)`
    );

    // Store learnings for future tests
    await this.storeLearnings(test);

    // Update stored version
    await this.updateStoredTest(test);

    return winner.variantId;
  }

  /**
   * Stop an A/B test
   */
  async stopTest(testId: string, reason: string = 'manual_stop'): Promise<void> {
    const test = this.activeTests.get(testId);
    if (!test) {
      throw new Error(`Test ${testId} not found`);
    }

    test.status = 'completed';
    test.completedAt = new Date();

    console.log(`⏹️ A/B test stopped: ${testId} (Reason: ${reason})`);

    // Store final results
    await this.updateStoredTest(test);
  }

  /**
   * Get test results and current status
   */
  async getTestResults(testId: string): Promise<ABTestResults> {
    const test = this.activeTests.get(testId);
    if (!test) {
      throw new Error(`Test ${testId} not found`);
    }

    // Update real-time calculations
    this.updateTestResults(test);

    return test.results;
  }

  /**
   * Calculate statistical significance
   */
  private calculateStatisticalSignificance(test: ABTest): StatisticalSignificance {
    if (test.variants.length < 2) {
      return {
        isSignificant: false,
        pValue: 1.0,
        confidenceInterval: [0, 0],
        sampleSizeReached: false,
        powerAchieved: false,
      };
    }

    // Get control and treatment variants
    const control = test.variants[0];
    const treatment = test.variants[1];

    // Calculate conversion rates
    const controlRate = control.metrics.conversionRate;
    const treatmentRate = treatment.metrics.conversionRate;

    // Calculate sample sizes
    const controlSample = control.metrics.impressions;
    const treatmentSample = treatment.metrics.impressions;

    // Simple z-test for proportions
    const pooledRate =
      (control.metrics.conversions + treatment.metrics.conversions) /
      (controlSample + treatmentSample);

    const standardError = Math.sqrt(
      pooledRate * (1 - pooledRate) * (1 / controlSample + 1 / treatmentSample)
    );
    const zScore = Math.abs(treatmentRate - controlRate) / standardError;

    // Calculate p-value (approximate)
    const pValue = 2 * (1 - this.normalCDF(Math.abs(zScore)));

    // Check significance
    const isSignificant = pValue < 1 - test.config.confidenceLevel;
    const sampleSizeReached = Math.min(controlSample, treatmentSample) >= test.config.minSampleSize;

    return {
      isSignificant,
      pValue,
      confidenceInterval: this.calculateConfidenceInterval(
        treatmentRate,
        controlRate,
        standardError,
        test.config.confidenceLevel
      ),
      sampleSizeReached,
      powerAchieved: isSignificant && sampleSizeReached,
      timeToSignificance: this.estimateTimeToSignificance(test),
    };
  }

  /**
   * Generate test recommendation
   */
  private generateRecommendation(test: ABTest): TestRecommendation {
    const significance = test.results.statisticalSignificance;
    const performance = this.calculatePerformanceComparison(test);
    const winner = performance.find(p => p.isWinner);

    if (significance.isSignificant && significance.sampleSizeReached && winner) {
      return {
        action: 'declare_winner',
        reason: 'Statistical significance achieved with sufficient sample size',
        confidence: 1 - significance.pValue,
        expectedLift: winner.lift,
        estimatedRevenue: this.estimateRevenue(test, winner.lift),
      };
    }

    if (!significance.sampleSizeReached) {
      return {
        action: 'continue',
        reason: 'Insufficient sample size, continue testing',
        confidence: 0.5,
        expectedLift: winner?.lift || 0,
        estimatedRevenue: 0,
      };
    }

    if (
      significance.timeToSignificance &&
      significance.timeToSignificance > test.config.maxDuration
    ) {
      return {
        action: 'stop_test',
        reason: 'Unlikely to reach significance within time limit',
        confidence: 0.3,
        expectedLift: 0,
        estimatedRevenue: 0,
      };
    }

    return {
      action: 'continue',
      reason: 'Test in progress, monitoring for significance',
      confidence: 0.7,
      expectedLift: winner?.lift || 0,
      estimatedRevenue: 0,
    };
  }

  /**
   * Calculate performance comparison between variants
   */
  private calculatePerformanceComparison(test: ABTest): PerformanceComparison[] {
    const control = test.variants[0];
    const controlMetric = this.getMetricValue(control.metrics, test.config.primaryMetric);

    const comparisons: PerformanceComparison[] = test.variants.map((variant, index) => {
      const metricValue = this.getMetricValue(variant.metrics, test.config.primaryMetric);
      const lift = index === 0 ? 0 : ((metricValue - controlMetric) / controlMetric) * 100;

      return {
        variantId: variant.id,
        variantName: variant.name,
        primaryMetricValue: metricValue,
        lift,
        significance: 0.5, // Simplified - would need proper calculation
        rank: 0,
        isWinner: false,
        isLoser: false,
      };
    });

    // Sort by performance and assign ranks
    comparisons.sort((a, b) => b.primaryMetricValue - a.primaryMetricValue);
    comparisons.forEach((comp, index) => {
      comp.rank = index + 1;
      comp.isWinner = index === 0 && comp.lift > 0;
      comp.isLoser = index === comparisons.length - 1 && comparisons.length > 2;
    });

    return comparisons;
  }

  /**
   * Helper methods
   */
  private initializeMetrics(): VariantMetrics {
    return {
      impressions: 0,
      opens: 0,
      clicks: 0,
      conversions: 0,
      revenue: 0,
      bounces: 0,
      unsubscribes: 0,
      openRate: 0,
      clickRate: 0,
      conversionRate: 0,
      revenuePerUser: 0,
      lastUpdated: new Date(),
    };
  }

  private initializeResults(): ABTestResults {
    return {
      totalImpressions: 0,
      totalConversions: 0,
      testProgress: 0,
      statisticalSignificance: {
        isSignificant: false,
        pValue: 1.0,
        confidenceInterval: [0, 0],
        sampleSizeReached: false,
        powerAchieved: false,
      },
      recommendation: {
        action: 'continue',
        reason: 'Test just started',
        confidence: 0.5,
        expectedLift: 0,
        estimatedRevenue: 0,
      },
      insights: [],
      performance: [],
    };
  }

  private calculateDerivedMetrics(metrics: VariantMetrics): void {
    metrics.openRate = metrics.impressions > 0 ? (metrics.opens / metrics.impressions) * 100 : 0;
    metrics.clickRate = metrics.opens > 0 ? (metrics.clicks / metrics.opens) * 100 : 0;
    metrics.conversionRate = metrics.clicks > 0 ? (metrics.conversions / metrics.clicks) * 100 : 0;
    metrics.revenuePerUser = metrics.impressions > 0 ? metrics.revenue / metrics.impressions : 0;
  }

  private updateTestResults(test: ABTest): void {
    test.results.totalImpressions = test.variants.reduce(
      (sum, v) => sum + v.metrics.impressions,
      0
    );
    test.results.totalConversions = test.variants.reduce(
      (sum, v) => sum + v.metrics.conversions,
      0
    );

    const elapsed = test.startedAt ? Date.now() - test.startedAt.getTime() : 0;
    test.results.testProgress = Math.min((elapsed / (test.config.duration * 60 * 1000)) * 100, 100);

    test.results.performance = this.calculatePerformanceComparison(test);
    test.results.insights = this.generateInsights(test);
  }

  private generateInsights(test: ABTest): string[] {
    const insights: string[] = [];
    const performance = test.results.performance;

    if (performance.length >= 2) {
      const best = performance[0];
      const worst = performance[performance.length - 1];

      if (best.lift > 10) {
        insights.push(
          `${best.variantName} shows strong performance with ${best.lift.toFixed(1)}% lift`
        );
      }

      if (worst.lift < -5) {
        insights.push(
          `${worst.variantName} underperforming by ${Math.abs(worst.lift).toFixed(1)}%`
        );
      }
    }

    return insights;
  }

  private getMetricValue(metrics: VariantMetrics, metricName: string): number {
    switch (metricName) {
      case 'open_rate':
        return metrics.openRate;
      case 'click_rate':
        return metrics.clickRate;
      case 'conversion_rate':
        return metrics.conversionRate;
      case 'revenue':
        return metrics.revenuePerUser;
      default:
        return metrics.conversionRate;
    }
  }

  private calculateSampleSize(config: ABTestConfig): number {
    // Simplified sample size calculation
    const alpha = 1 - config.confidenceLevel;
    const beta = 1 - config.statisticalPower;
    const effectSize = 0.05; // 5% relative improvement

    // Rough approximation
    return Math.ceil(16 / (effectSize * effectSize));
  }

  private normalCDF(x: number): number {
    // Approximation of normal CDF
    return 0.5 * (1 + this.erf(x / Math.sqrt(2)));
  }

  private erf(x: number): number {
    // Approximation of error function
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  }

  private calculateConfidenceInterval(
    treatmentRate: number,
    controlRate: number,
    standardError: number,
    confidenceLevel: number
  ): [number, number] {
    const z = this.getZScore(confidenceLevel);
    const diff = treatmentRate - controlRate;
    const margin = z * standardError;

    return [diff - margin, diff + margin];
  }

  private getZScore(confidenceLevel: number): number {
    // Z-scores for common confidence levels
    const zScores: Record<number, number> = {
      0.9: 1.645,
      0.95: 1.96,
      0.99: 2.576,
    };

    return zScores[confidenceLevel] || 1.96;
  }

  private estimateTimeToSignificance(test: ABTest): number {
    // Simplified estimation - would need more sophisticated modeling
    const currentProgress = test.results.testProgress;
    const currentPValue = test.results.statisticalSignificance.pValue;

    if (currentPValue < 0.1) {
      return test.config.duration * 0.5; // Likely to reach significance soon
    }

    return test.config.duration * 1.5; // May need more time
  }

  private estimateRevenue(test: ABTest, lift: number): number {
    const totalRevenue = test.variants.reduce((sum, v) => sum + v.metrics.revenue, 0);
    return totalRevenue * (lift / 100);
  }

  private async storeLearnings(test: ABTest): Promise<void> {
    const learnings = {
      winningVariant: test.variants.find(v => v.status === 'winner'),
      performance: test.results.performance,
      insights: test.results.insights,
      testDuration:
        test.completedAt && test.startedAt
          ? test.completedAt.getTime() - test.startedAt.getTime()
          : 0,
    };

    await this.memoryStore.store(`ab_test_learnings_${test.id}`, learnings, [
      'learnings',
      'ab_testing',
      test.campaignId,
    ]);
  }

  private async updateStoredTest(test: ABTest): Promise<void> {
    await this.memoryStore.store(`ab_test_${test.id}`, test, [
      'ab_testing',
      'campaign',
      test.campaignId,
    ]);
  }

  private startPeriodicUpdates(): void {
    // Update tests every 5 minutes
    this.updateInterval = setInterval(
      () => {
        this.activeTests.forEach(test => {
          if (test.status === 'running') {
            this.updateTestResults(test);
          }
        });
      },
      5 * 60 * 1000
    );
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }
}
