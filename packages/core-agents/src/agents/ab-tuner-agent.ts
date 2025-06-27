/**
 * A/B Tuner Agent - Autonomous A/B Test Optimization
 * Detects low-performing variants and requests new optimized versions
 */

import { AbstractAgent } from '../base-agent';
import { AgentMemoryStore } from '../memory/AgentMemoryStore';
import { CampaignVariantGenerator } from '../strategy/campaign-variant-generator';
import { ABTestingManager, ABTest, TestVariant } from '../strategy/ab-testing-manager';

export interface PerformanceAlert {
  testId: string;
  variantId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  reason: string;
  suggestedAction: 'pause' | 'replace' | 'modify' | 'extend_test';
  confidence: number;
  detectedAt: Date;
}

export interface OptimizationSuggestion {
  testId: string;
  type: 'variant_replacement' | 'traffic_reallocation' | 'test_extension' | 'early_termination';
  description: string;
  expectedImprovement: number;
  risk: 'low' | 'medium' | 'high';
  implementation: {
    action: string;
    parameters: Record<string, any>;
    estimatedTime: number; // minutes
  };
}

export interface ABTunerConfig {
  monitoringInterval: number; // minutes
  performanceThresholds: {
    minSampleSize: number;
    significanceLevel: number;
    underperformanceThreshold: number; // percentage below control
    stalenessThreshold: number; // hours without improvement
  };
  autoOptimization: {
    enabled: boolean;
    maxReplacements: number;
    requireApproval: boolean;
  };
}

export class ABTunerAgent extends AbstractAgent {
  private memoryStore: AgentMemoryStore;
  private variantGenerator: CampaignVariantGenerator;
  private abTestingManager: ABTestingManager;
  private config: ABTunerConfig;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private activeAlerts: Map<string, PerformanceAlert[]> = new Map();

  constructor(
    memoryStore: AgentMemoryStore,
    variantGenerator: CampaignVariantGenerator,
    abTestingManager: ABTestingManager,
    config?: Partial<ABTunerConfig>
  ) {
    super('ab-tuner-agent', {
      monitor_performance:
        'Continuously monitors A/B test performance for optimization opportunities',
      detect_underperformers: 'Identifies variants that are significantly underperforming',
      generate_replacements: 'Creates new optimized variants to replace poor performers',
      optimize_traffic: 'Dynamically adjusts traffic allocation for better results',
      provide_insights: 'Generates actionable insights for test optimization',
    });

    this.memoryStore = memoryStore;
    this.variantGenerator = variantGenerator;
    this.abTestingManager = abTestingManager;

    this.config = {
      monitoringInterval: 15, // 15 minutes
      performanceThresholds: {
        minSampleSize: 100,
        significanceLevel: 0.05,
        underperformanceThreshold: -15, // 15% worse than control
        stalenessThreshold: 4, // 4 hours
      },
      autoOptimization: {
        enabled: true,
        maxReplacements: 2,
        requireApproval: false,
      },
      ...config,
    };

    this.startMonitoring();
  }

  /**
   * Start continuous monitoring of A/B tests
   */
  private startMonitoring(): void {
    console.log(
      `🔧 ABTunerAgent starting performance monitoring (${this.config.monitoringInterval}min intervals)`
    );

    this.monitoringInterval = setInterval(
      async () => {
        try {
          await this.monitorAllTests();
        } catch (error) {
          console.error('❌ ABTunerAgent monitoring error:', error);
        }
      },
      this.config.monitoringInterval * 60 * 1000
    );
  }

  /**
   * Monitor all active A/B tests for optimization opportunities
   */
  async monitorAllTests(): Promise<void> {
    try {
      console.log('🔍 ABTunerAgent scanning for optimization opportunities...');

      // Get all running tests (mock data for now)
      const runningTests = await this.getRunningTests();

      for (const test of runningTests) {
        await this.analyzeTestPerformance(test);
      }

      console.log(`✅ Completed monitoring scan for ${runningTests.length} tests`);
    } catch (error) {
      console.error('❌ Failed to monitor tests:', error);
    }
  }

  /**
   * Analyze individual test performance and trigger optimizations
   */
  private async analyzeTestPerformance(test: ABTest): Promise<void> {
    const alerts: PerformanceAlert[] = [];
    const suggestions: OptimizationSuggestion[] = [];

    // Check each variant for performance issues
    for (const variant of test.variants) {
      const alert = await this.checkVariantPerformance(test, variant);
      if (alert) {
        alerts.push(alert);
      }
    }

    // Generate optimization suggestions
    if (alerts.length > 0) {
      const optimizations = await this.generateOptimizations(test, alerts);
      suggestions.push(...optimizations);
    }

    // Store alerts and suggestions
    this.activeAlerts.set(test.id, alerts);

    // Execute auto-optimizations if enabled
    if (this.config.autoOptimization.enabled && suggestions.length > 0) {
      await this.executeOptimizations(test, suggestions);
    }

    // Store insights for future learning
    await this.storeOptimizationInsights(test, alerts, suggestions);
  }

  /**
   * Check individual variant performance against thresholds
   */
  private async checkVariantPerformance(
    test: ABTest,
    variant: TestVariant
  ): Promise<PerformanceAlert | null> {
    // Skip control variant (first variant)
    if (test.variants.indexOf(variant) === 0) {
      return null;
    }

    const control = test.variants[0];
    const { minSampleSize, underperformanceThreshold, stalenessThreshold } =
      this.config.performanceThresholds;

    // Check sample size
    if (variant.metrics.impressions < minSampleSize) {
      return null; // Not enough data yet
    }

    // Calculate performance compared to control
    const controlMetric = this.getPrimaryMetricValue(control, test.config.primaryMetric);
    const variantMetric = this.getPrimaryMetricValue(variant, test.config.primaryMetric);
    const performanceDiff = ((variantMetric - controlMetric) / controlMetric) * 100;

    // Check for significant underperformance
    if (performanceDiff < underperformanceThreshold) {
      return {
        testId: test.id,
        variantId: variant.id,
        severity: performanceDiff < underperformanceThreshold * 2 ? 'critical' : 'high',
        reason: `Variant underperforming by ${Math.abs(performanceDiff).toFixed(1)}% vs control`,
        suggestedAction: 'replace',
        confidence: this.calculateConfidence(variant.metrics.impressions, performanceDiff),
        detectedAt: new Date(),
      };
    }

    // Check for stagnant performance
    const hoursSinceLastUpdate =
      (Date.now() - variant.metrics.lastUpdated.getTime()) / (1000 * 60 * 60);
    if (hoursSinceLastUpdate > stalenessThreshold && performanceDiff < 5) {
      return {
        testId: test.id,
        variantId: variant.id,
        severity: 'medium',
        reason: `Variant showing minimal improvement for ${hoursSinceLastUpdate.toFixed(1)} hours`,
        suggestedAction: 'modify',
        confidence: 0.7,
        detectedAt: new Date(),
      };
    }

    return null;
  }

  /**
   * Generate optimization suggestions based on performance alerts
   */
  private async generateOptimizations(
    test: ABTest,
    alerts: PerformanceAlert[]
  ): Promise<OptimizationSuggestion[]> {
    const suggestions: OptimizationSuggestion[] = [];

    for (const alert of alerts) {
      switch (alert.suggestedAction) {
        case 'replace':
          suggestions.push({
            testId: test.id,
            type: 'variant_replacement',
            description: `Replace underperforming variant ${alert.variantId} with AI-optimized alternative`,
            expectedImprovement: 15, // Estimated improvement percentage
            risk: 'medium',
            implementation: {
              action: 'generate_and_replace_variant',
              parameters: {
                variantId: alert.variantId,
                optimizationType: 'performance_boost',
                learningsSource: 'historical_data',
              },
              estimatedTime: 30,
            },
          });
          break;

        case 'modify':
          suggestions.push({
            testId: test.id,
            type: 'traffic_reallocation',
            description: `Reduce traffic to stagnant variant ${alert.variantId} and boost better performers`,
            expectedImprovement: 8,
            risk: 'low',
            implementation: {
              action: 'adjust_traffic_allocation',
              parameters: {
                variantId: alert.variantId,
                newAllocation: 25, // Reduce from current allocation
                redistributeTo: 'best_performers',
              },
              estimatedTime: 5,
            },
          });
          break;

        case 'pause':
          if (alert.severity === 'critical') {
            suggestions.push({
              testId: test.id,
              type: 'early_termination',
              description: `Pause critically underperforming variant ${alert.variantId}`,
              expectedImprovement: 10,
              risk: 'low',
              implementation: {
                action: 'pause_variant',
                parameters: {
                  variantId: alert.variantId,
                  reason: 'critical_underperformance',
                },
                estimatedTime: 2,
              },
            });
          }
          break;
      }
    }

    return suggestions;
  }

  /**
   * Execute approved optimization suggestions
   */
  private async executeOptimizations(
    test: ABTest,
    suggestions: OptimizationSuggestion[]
  ): Promise<void> {
    for (const suggestion of suggestions) {
      try {
        console.log(`🔧 Executing optimization: ${suggestion.description}`);

        switch (suggestion.type) {
          case 'variant_replacement':
            await this.replaceVariant(test, suggestion);
            break;
          case 'traffic_reallocation':
            await this.adjustTrafficAllocation(test, suggestion);
            break;
          case 'early_termination':
            await this.pauseVariant(test, suggestion);
            break;
        }

        // Log successful optimization
        console.log(`✅ Optimization completed: ${suggestion.description}`);
      } catch (error) {
        console.error(`❌ Optimization failed: ${suggestion.description}`, error);
      }
    }
  }

  /**
   * Replace underperforming variant with optimized version
   */
  private async replaceVariant(test: ABTest, suggestion: OptimizationSuggestion): Promise<void> {
    const { variantId } = suggestion.implementation.parameters;
    const originalVariant = test.variants.find(v => v.id === variantId);

    if (!originalVariant) {
      throw new Error(`Variant ${variantId} not found`);
    }

    // Generate new optimized variant
    const optimizationRequest = {
      campaignId: test.campaignId,
      content: {
        subject: 'Optimized variant based on performance data',
        body: 'AI-generated optimized content',
        cta: 'Take Action Now',
      },
      targetAudience: 'current_test_audience',
      variantTypes: ['subject', 'copy', 'cta'] as const,
      variantCount: 1,
      constraints: {
        tone: 'improvement_focused',
        keywords: ['optimization', 'performance'],
      },
    };

    const variantResult = await this.variantGenerator.generateVariants(optimizationRequest);

    if (variantResult.variants.length > 0) {
      // Create new optimized variant combination
      const newCombination = {
        id: `optimized_${Date.now()}`,
        name: `Optimized ${originalVariant.name}`,
        variants: variantResult.variants,
        expectedPerformance: variantResult.variants[0].expectedPerformance,
        riskLevel: 'medium' as const,
        testDuration: test.config.duration,
      };

      // Replace variant in test (mock implementation)
      originalVariant.combination = newCombination;
      originalVariant.name = newCombination.name;
      originalVariant.status = 'active';

      console.log(`🔄 Replaced variant ${variantId} with optimized version`);
    }
  }

  /**
   * Adjust traffic allocation between variants
   */
  private async adjustTrafficAllocation(
    test: ABTest,
    suggestion: OptimizationSuggestion
  ): Promise<void> {
    const { variantId, newAllocation } = suggestion.implementation.parameters;
    const variant = test.variants.find(v => v.id === variantId);

    if (!variant) {
      throw new Error(`Variant ${variantId} not found`);
    }

    const oldAllocation = variant.trafficAllocation;
    variant.trafficAllocation = newAllocation;

    // Redistribute the difference to other variants
    const difference = oldAllocation - newAllocation;
    const otherVariants = test.variants.filter(v => v.id !== variantId && v.status === 'active');
    const redistributePerVariant = difference / otherVariants.length;

    otherVariants.forEach(v => {
      v.trafficAllocation += redistributePerVariant;
    });

    console.log(
      `📊 Adjusted traffic allocation for ${variantId}: ${oldAllocation}% → ${newAllocation}%`
    );
  }

  /**
   * Pause underperforming variant
   */
  private async pauseVariant(test: ABTest, suggestion: OptimizationSuggestion): Promise<void> {
    const { variantId } = suggestion.implementation.parameters;
    const variant = test.variants.find(v => v.id === variantId);

    if (!variant) {
      throw new Error(`Variant ${variantId} not found`);
    }

    variant.status = 'paused';

    // Redistribute traffic to active variants
    const activeVariants = test.variants.filter(v => v.status === 'active');
    const redistributePerVariant = variant.trafficAllocation / activeVariants.length;

    activeVariants.forEach(v => {
      v.trafficAllocation += redistributePerVariant;
    });

    variant.trafficAllocation = 0;

    console.log(`⏸️ Paused underperforming variant ${variantId}`);
  }

  /**
   * Store optimization insights for machine learning
   */
  private async storeOptimizationInsights(
    test: ABTest,
    alerts: PerformanceAlert[],
    suggestions: OptimizationSuggestion[]
  ): Promise<void> {
    const insights = {
      testId: test.id,
      timestamp: new Date(),
      alerts,
      suggestions,
      testMetrics: {
        progress: test.results.testProgress,
        totalImpressions: test.results.totalImpressions,
        bestPerformingVariant: test.results.performance[0]?.variantId,
      },
      learnings: {
        underperformancePatterns: alerts.map(a => a.reason),
        optimizationTypes: suggestions.map(s => s.type),
        expectedImprovements: suggestions.map(s => s.expectedImprovement),
      },
    };

    await this.memoryStore.store(`ab_tuner_insights_${test.id}_${Date.now()}`, insights, [
      'ab_testing',
      'optimization',
      'tuning',
      test.campaignId,
    ]);
  }

  /**
   * Get current alerts for a test
   */
  async getTestAlerts(testId: string): Promise<PerformanceAlert[]> {
    return this.activeAlerts.get(testId) || [];
  }

  /**
   * Force optimization check for specific test
   */
  async optimizeTest(testId: string): Promise<OptimizationSuggestion[]> {
    const test = await this.getTestById(testId);
    if (!test) {
      throw new Error(`Test ${testId} not found`);
    }

    await this.analyzeTestPerformance(test);
    return [];
  }

  /**
   * Helper methods
   */
  private getPrimaryMetricValue(variant: TestVariant, metric: string): number {
    switch (metric) {
      case 'open_rate':
        return variant.metrics.openRate;
      case 'click_rate':
        return variant.metrics.clickRate;
      case 'conversion_rate':
        return variant.metrics.conversionRate;
      case 'revenue':
        return variant.metrics.revenuePerUser;
      default:
        return variant.metrics.conversionRate;
    }
  }

  private calculateConfidence(sampleSize: number, performanceDiff: number): number {
    // Simplified confidence calculation based on sample size and effect size
    const baseLine = Math.min(sampleSize / 1000, 1.0); // Max confidence at 1000+ samples
    const effectSize = Math.abs(performanceDiff) / 100;
    return Math.min(baseLine * (1 + effectSize), 1.0);
  }

  private async getRunningTests(): Promise<ABTest[]> {
    // Mock implementation - replace with actual data source
    return [
      {
        id: 'test_001',
        campaignId: 'campaign_001',
        name: 'Email Subject Test',
        status: 'running',
        variants: [
          {
            id: 'control',
            name: 'Control',
            combination: {} as any,
            trafficAllocation: 50,
            status: 'active',
            metrics: {
              impressions: 1000,
              opens: 250,
              clicks: 50,
              conversions: 15,
              revenue: 300,
              bounces: 10,
              unsubscribes: 2,
              openRate: 25.0,
              clickRate: 20.0,
              conversionRate: 30.0,
              revenuePerUser: 0.3,
              lastUpdated: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
            },
          },
          {
            id: 'variant_a',
            name: 'Variant A',
            combination: {} as any,
            trafficAllocation: 50,
            status: 'active',
            metrics: {
              impressions: 950,
              opens: 190,
              clicks: 30,
              conversions: 8,
              revenue: 160,
              bounces: 15,
              unsubscribes: 3,
              openRate: 20.0,
              clickRate: 15.8,
              conversionRate: 26.7,
              revenuePerUser: 0.17,
              lastUpdated: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
            },
          },
        ],
        config: {
          testType: 'split',
          duration: 2880,
          minSampleSize: 1000,
          confidenceLevel: 0.95,
          statisticalPower: 0.8,
          primaryMetric: 'conversion_rate',
          secondaryMetrics: ['open_rate', 'click_rate'],
          autoWinner: true,
          maxDuration: 7200,
          trafficSplit: 'equal',
        },
        results: {
          totalImpressions: 1950,
          totalConversions: 23,
          testProgress: 45,
          statisticalSignificance: {
            isSignificant: false,
            pValue: 0.12,
            confidenceInterval: [0, 0],
            sampleSizeReached: false,
            powerAchieved: false,
          },
          recommendation: {
            action: 'continue',
            reason: 'Insufficient data',
            confidence: 0.6,
            expectedLift: 0,
            estimatedRevenue: 0,
          },
          insights: [],
          performance: [],
        },
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        startedAt: new Date(Date.now() - 20 * 60 * 60 * 1000),
      },
    ];
  }

  private async getTestById(testId: string): Promise<ABTest | null> {
    const tests = await this.getRunningTests();
    return tests.find(t => t.id === testId) || null;
  }

  /**
   * Cleanup and shutdown
   */
  destroy(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    console.log('🔧 ABTunerAgent monitoring stopped');
  }
}
