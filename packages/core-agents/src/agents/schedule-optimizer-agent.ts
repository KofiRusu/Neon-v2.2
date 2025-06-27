/**
 * Schedule Optimizer Agent - Autonomous Timing Intelligence
 * Learns optimal send times by audience/agent type and continuously improves scheduling
 */

import { AbstractAgent } from '../base-agent';
import { AgentMemoryStore } from '../memory/AgentMemoryStore';
import { SmartScheduler, ScheduleSlot, PerformanceData } from '../strategy/smart-scheduler';

export interface TimingInsight {
  audienceSegment: string;
  contentType: string;
  optimalTime: {
    dayOfWeek: number;
    hour: number;
    timezone: string;
  };
  performance: {
    avgOpenRate: number;
    avgClickRate: number;
    avgConversionRate: number;
    confidence: number;
    sampleSize: number;
  };
  seasonalTrends: Record<string, number>;
  lastUpdated: Date;
}

export interface SchedulingOptimization {
  campaignId: string;
  originalSchedule: ScheduleSlot[];
  optimizedSchedule: ScheduleSlot[];
  expectedImprovement: number;
  confidence: number;
  reasoning: string[];
  appliedAt: Date;
}

export interface AudienceBehaviorPattern {
  segment: string;
  activeHours: number[];
  preferredDays: number[];
  responsiveTimeWindows: {
    start: number; // hour
    end: number; // hour
    performance: number;
  }[];
  seasonalPreferences: Record<string, number>;
  competitorAnalysis: {
    lowCompetitionWindows: number[];
    highCompetitionWindows: number[];
  };
}

export interface ScheduleOptimizerConfig {
  learningInterval: number; // minutes
  minSampleSize: number;
  significanceThreshold: number;
  optimizationFrequency: number; // hours
  adaptiveLearning: {
    enabled: boolean;
    learningRate: number;
    memoryDecay: number;
  };
}

export class ScheduleOptimizerAgent extends AbstractAgent {
  private memoryStore: AgentMemoryStore;
  private smartScheduler: SmartScheduler;
  private config: ScheduleOptimizerConfig;
  private learningInterval: NodeJS.Timeout | null = null;
  private timingInsights: Map<string, TimingInsight[]> = new Map();
  private behaviorPatterns: Map<string, AudienceBehaviorPattern> = new Map();

  constructor(
    memoryStore: AgentMemoryStore,
    smartScheduler: SmartScheduler,
    config?: Partial<ScheduleOptimizerConfig>
  ) {
    super('schedule-optimizer-agent', {
      analyze_timing_performance: 'Analyzes historical timing performance across audience segments',
      learn_optimal_windows:
        'Identifies and learns optimal sending windows for different audiences',
      optimize_schedules: 'Automatically optimizes campaign schedules based on learned insights',
      adapt_to_changes: 'Adapts scheduling recommendations to changing audience behaviors',
      predict_performance: 'Predicts performance for different timing strategies',
    });

    this.memoryStore = memoryStore;
    this.smartScheduler = smartScheduler;

    this.config = {
      learningInterval: 30, // 30 minutes
      minSampleSize: 50,
      significanceThreshold: 0.05,
      optimizationFrequency: 6, // 6 hours
      adaptiveLearning: {
        enabled: true,
        learningRate: 0.1,
        memoryDecay: 0.95,
      },
      ...config,
    };

    this.startLearning();
  }

  /**
   * Start continuous learning process
   */
  private startLearning(): void {
    console.log(
      `📚 ScheduleOptimizerAgent starting continuous learning (${this.config.learningInterval}min intervals)`
    );

    this.learningInterval = setInterval(
      async () => {
        try {
          await this.performLearningCycle();
        } catch (error) {
          console.error('❌ ScheduleOptimizerAgent learning error:', error);
        }
      },
      this.config.learningInterval * 60 * 1000
    );

    // Initial learning
    this.performLearningCycle();
  }

  /**
   * Execute a complete learning cycle
   */
  async performLearningCycle(): Promise<void> {
    try {
      console.log('🧠 ScheduleOptimizerAgent performing learning cycle...');

      // Analyze recent campaign performance
      await this.analyzeRecentPerformance();

      // Update timing insights
      await this.updateTimingInsights();

      // Learn audience behavior patterns
      await this.learnAudienceBehaviors();

      // Generate optimizations for active campaigns
      await this.optimizeActiveCampaigns();

      // Store learnings
      await this.storeLearnings();

      console.log('✅ ScheduleOptimizerAgent learning cycle completed');
    } catch (error) {
      console.error('❌ Learning cycle failed:', error);
    }
  }

  /**
   * Analyze recent campaign performance for timing insights
   */
  private async analyzeRecentPerformance(): Promise<void> {
    // Mock implementation - replace with actual data
    const recentCampaigns = await this.getRecentCampaignData();

    for (const campaign of recentCampaigns) {
      const insight = await this.extractTimingInsight(campaign);
      if (insight) {
        this.addTimingInsight(insight);
      }
    }
  }

  /**
   * Extract timing insights from campaign data
   */
  private async extractTimingInsight(campaignData: any): Promise<TimingInsight | null> {
    if (!campaignData.schedule || !campaignData.performance) {
      return null;
    }

    const schedule = campaignData.schedule;
    const performance = campaignData.performance;

    // Calculate performance metrics
    const avgOpenRate = (performance.opens / performance.sent) * 100;
    const avgClickRate = (performance.clicks / performance.opens) * 100;
    const avgConversionRate = (performance.conversions / performance.clicks) * 100;

    return {
      audienceSegment: campaignData.audienceSegment,
      contentType: campaignData.contentType,
      optimalTime: {
        dayOfWeek: new Date(schedule.timestamp).getDay(),
        hour: new Date(schedule.timestamp).getHours(),
        timezone: schedule.timezone,
      },
      performance: {
        avgOpenRate,
        avgClickRate,
        avgConversionRate,
        confidence: this.calculateConfidence(performance.sent, avgConversionRate),
        sampleSize: performance.sent,
      },
      seasonalTrends: {
        current: this.getCurrentSeasonMultiplier(),
        trend: this.calculateTrend(campaignData.historicalPerformance),
      },
      lastUpdated: new Date(),
    };
  }

  /**
   * Add timing insight to knowledge base
   */
  private addTimingInsight(insight: TimingInsight): void {
    const key = `${insight.audienceSegment}_${insight.contentType}`;
    const insights = this.timingInsights.get(key) || [];

    // Check if similar insight exists
    const existingIndex = insights.findIndex(
      i =>
        i.optimalTime.dayOfWeek === insight.optimalTime.dayOfWeek &&
        i.optimalTime.hour === insight.optimalTime.hour
    );

    if (existingIndex >= 0) {
      // Update existing insight with weighted average
      const existing = insights[existingIndex];
      const weight =
        insight.performance.sampleSize /
        (existing.performance.sampleSize + insight.performance.sampleSize);

      existing.performance.avgOpenRate =
        existing.performance.avgOpenRate * (1 - weight) + insight.performance.avgOpenRate * weight;
      existing.performance.avgClickRate =
        existing.performance.avgClickRate * (1 - weight) +
        insight.performance.avgClickRate * weight;
      existing.performance.avgConversionRate =
        existing.performance.avgConversionRate * (1 - weight) +
        insight.performance.avgConversionRate * weight;
      existing.performance.sampleSize += insight.performance.sampleSize;
      existing.lastUpdated = new Date();
    } else {
      // Add new insight
      insights.push(insight);
    }

    this.timingInsights.set(key, insights);
  }

  /**
   * Update timing insights based on new performance data
   */
  private async updateTimingInsights(): Promise<void> {
    // Apply adaptive learning to existing insights
    if (this.config.adaptiveLearning.enabled) {
      for (const [key, insights] of this.timingInsights.entries()) {
        for (const insight of insights) {
          // Apply memory decay to older insights
          const ageInDays = (Date.now() - insight.lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
          const decayFactor = Math.pow(this.config.adaptiveLearning.memoryDecay, ageInDays);

          insight.performance.confidence *= decayFactor;

          // Remove insights with very low confidence
          if (insight.performance.confidence < 0.1) {
            const index = insights.indexOf(insight);
            insights.splice(index, 1);
          }
        }

        // Sort by performance
        insights.sort((a, b) => b.performance.avgConversionRate - a.performance.avgConversionRate);
        this.timingInsights.set(key, insights);
      }
    }
  }

  /**
   * Learn audience behavior patterns from data
   */
  private async learnAudienceBehaviors(): Promise<void> {
    const audiences = await this.getUniqueAudiences();

    for (const audience of audiences) {
      const pattern = await this.analyzeAudienceBehavior(audience);
      if (pattern) {
        this.behaviorPatterns.set(audience, pattern);
      }
    }
  }

  /**
   * Analyze individual audience behavior patterns
   */
  private async analyzeAudienceBehavior(audience: string): Promise<AudienceBehaviorPattern | null> {
    const audienceData = await this.getAudienceData(audience);

    if (!audienceData || audienceData.length < this.config.minSampleSize) {
      return null;
    }

    // Analyze active hours
    const hourlyActivity = new Array(24).fill(0);
    const dailyActivity = new Array(7).fill(0);

    audienceData.forEach(data => {
      const hour = new Date(data.timestamp).getHours();
      const day = new Date(data.timestamp).getDay();

      hourlyActivity[hour] += data.engagement;
      dailyActivity[day] += data.engagement;
    });

    // Find peak hours and days
    const activeHours = hourlyActivity
      .map((activity, hour) => ({ hour, activity }))
      .filter(h => h.activity > 0)
      .sort((a, b) => b.activity - a.activity)
      .slice(0, 8)
      .map(h => h.hour);

    const preferredDays = dailyActivity
      .map((activity, day) => ({ day, activity }))
      .filter(d => d.activity > 0)
      .sort((a, b) => b.activity - a.activity)
      .slice(0, 5)
      .map(d => d.day);

    // Identify responsive time windows
    const responsiveTimeWindows = this.identifyTimeWindows(hourlyActivity);

    // Analyze seasonal preferences
    const seasonalPreferences = this.analyzeSeasonalTrends(audienceData);

    // Competitive analysis
    const competitorAnalysis = await this.analyzeCompetition(audience);

    return {
      segment: audience,
      activeHours,
      preferredDays,
      responsiveTimeWindows,
      seasonalPreferences,
      competitorAnalysis,
    };
  }

  /**
   * Identify responsive time windows from hourly activity
   */
  private identifyTimeWindows(
    hourlyActivity: number[]
  ): AudienceBehaviorPattern['responsiveTimeWindows'] {
    const windows = [];
    let windowStart = -1;
    const threshold = Math.max(...hourlyActivity) * 0.7; // 70% of peak activity

    for (let hour = 0; hour < 24; hour++) {
      if (hourlyActivity[hour] >= threshold) {
        if (windowStart === -1) {
          windowStart = hour;
        }
      } else if (windowStart !== -1) {
        // End of window
        windows.push({
          start: windowStart,
          end: hour - 1,
          performance:
            hourlyActivity.slice(windowStart, hour).reduce((a, b) => a + b, 0) /
            (hour - windowStart),
        });
        windowStart = -1;
      }
    }

    // Handle window that extends to end of day
    if (windowStart !== -1) {
      windows.push({
        start: windowStart,
        end: 23,
        performance:
          hourlyActivity.slice(windowStart).reduce((a, b) => a + b, 0) / (24 - windowStart),
      });
    }

    return windows;
  }

  /**
   * Optimize schedules for active campaigns
   */
  private async optimizeActiveCampaigns(): Promise<void> {
    const activeCampaigns = await this.getActiveCampaigns();

    for (const campaign of activeCampaigns) {
      const optimization = await this.generateScheduleOptimization(campaign);

      if (optimization && optimization.expectedImprovement > 5) {
        // 5% improvement threshold
        await this.applyScheduleOptimization(optimization);
      }
    }
  }

  /**
   * Generate schedule optimization for a campaign
   */
  private async generateScheduleOptimization(
    campaign: any
  ): Promise<SchedulingOptimization | null> {
    const audienceInsights = this.timingInsights.get(
      `${campaign.audience}_${campaign.contentType}`
    );
    const behaviorPattern = this.behaviorPatterns.get(campaign.audience);

    if (!audienceInsights || !behaviorPattern) {
      return null;
    }

    // Find best performing time insights
    const bestInsights = audienceInsights
      .filter(i => i.performance.confidence > 0.7)
      .sort((a, b) => b.performance.avgConversionRate - a.performance.avgConversionRate)
      .slice(0, 3);

    if (bestInsights.length === 0) {
      return null;
    }

    // Generate optimized schedule slots
    const optimizedSchedule: ScheduleSlot[] = bestInsights.map((insight, index) => ({
      id: `optimized_${campaign.id}_${index}`,
      timestamp: this.calculateOptimalTimestamp(insight.optimalTime),
      timezone: insight.optimalTime.timezone,
      dayOfWeek: this.getDayName(insight.optimalTime.dayOfWeek),
      hour: insight.optimalTime.hour,
      minute: 0,
      audience: {
        segment: campaign.audience,
        size: campaign.audienceSize,
        expectedEngagement: insight.performance.avgConversionRate / 100,
      },
      priority: index === 0 ? 'primary' : 'secondary',
      performance: {
        historical: {
          openRate: insight.performance.avgOpenRate,
          clickRate: insight.performance.avgClickRate,
          conversionRate: insight.performance.avgConversionRate,
          engagementScore: insight.performance.avgConversionRate,
          sampleSize: insight.performance.sampleSize,
          lastUpdated: insight.lastUpdated,
        },
        predicted: {
          openRate: insight.performance.avgOpenRate * 1.1, // 10% optimization boost
          clickRate: insight.performance.avgClickRate * 1.08,
          conversionRate: insight.performance.avgConversionRate * 1.05,
          engagementScore: insight.performance.avgConversionRate * 1.1,
          sampleSize: 0,
          lastUpdated: new Date(),
        },
      },
    }));

    // Calculate expected improvement
    const currentPerformance = campaign.currentSchedule?.performance || 0;
    const optimizedPerformance = optimizedSchedule[0].performance.predicted.conversionRate;
    const expectedImprovement =
      ((optimizedPerformance - currentPerformance) / currentPerformance) * 100;

    // Generate reasoning
    const reasoning = [
      `Historical data shows ${bestInsights[0].performance.avgConversionRate.toFixed(1)}% conversion rate for ${this.getDayName(bestInsights[0].optimalTime.dayOfWeek)} at ${bestInsights[0].optimalTime.hour}:00`,
      `Audience ${campaign.audience} shows peak activity during selected time windows`,
      `${bestInsights[0].performance.sampleSize} data points support this optimization`,
      `Expected improvement: ${expectedImprovement.toFixed(1)}%`,
    ];

    return {
      campaignId: campaign.id,
      originalSchedule: campaign.currentSchedule ? [campaign.currentSchedule] : [],
      optimizedSchedule,
      expectedImprovement,
      confidence: bestInsights[0].performance.confidence,
      reasoning,
      appliedAt: new Date(),
    };
  }

  /**
   * Apply schedule optimization to campaign
   */
  private async applyScheduleOptimization(optimization: SchedulingOptimization): Promise<void> {
    try {
      console.log(`📅 Applying schedule optimization to campaign ${optimization.campaignId}`);
      console.log(`Expected improvement: ${optimization.expectedImprovement.toFixed(1)}%`);

      // Update campaign schedule (mock implementation)
      // In real implementation, this would update the actual campaign scheduling system

      // Store optimization decision
      await this.memoryStore.store(
        `schedule_optimization_${optimization.campaignId}_${Date.now()}`,
        optimization,
        ['scheduling', 'optimization', 'applied']
      );

      console.log(`✅ Schedule optimization applied successfully`);
    } catch (error) {
      console.error(`❌ Failed to apply schedule optimization:`, error);
    }
  }

  /**
   * Store learnings for future use
   */
  private async storeLearnings(): Promise<void> {
    const learnings = {
      timingInsights: Array.from(this.timingInsights.entries()),
      behaviorPatterns: Array.from(this.behaviorPatterns.entries()),
      timestamp: new Date(),
      agentVersion: '1.0',
    };

    await this.memoryStore.store(`schedule_optimizer_learnings_${Date.now()}`, learnings, [
      'scheduling',
      'learning',
      'insights',
    ]);
  }

  /**
   * Get optimal schedule for new campaign
   */
  async getOptimalSchedule(
    audience: string,
    contentType: string,
    urgency: 'low' | 'medium' | 'high' = 'medium'
  ): Promise<ScheduleSlot[]> {
    const insights = this.timingInsights.get(`${audience}_${contentType}`);
    const behaviorPattern = this.behaviorPatterns.get(audience);

    if (!insights || insights.length === 0) {
      // Fallback to default scheduling
      return this.getDefaultSchedule(audience, contentType);
    }

    // Filter by urgency
    let candidateInsights = insights.filter(i => i.performance.confidence > 0.5);

    if (urgency === 'high') {
      // For high urgency, prefer immediate availability
      candidateInsights = candidateInsights.filter(i =>
        this.isTimeSlotAvailable(i.optimalTime, 'immediate')
      );
    }

    return candidateInsights.slice(0, 3).map((insight, index) => ({
      id: `optimal_${audience}_${index}`,
      timestamp: this.calculateOptimalTimestamp(insight.optimalTime),
      timezone: insight.optimalTime.timezone,
      dayOfWeek: this.getDayName(insight.optimalTime.dayOfWeek),
      hour: insight.optimalTime.hour,
      minute: 0,
      audience: {
        segment: audience,
        size: 1000, // Default size
        expectedEngagement: insight.performance.avgConversionRate / 100,
      },
      priority: index === 0 ? 'primary' : 'secondary',
      performance: {
        historical: {
          openRate: insight.performance.avgOpenRate,
          clickRate: insight.performance.avgClickRate,
          conversionRate: insight.performance.avgConversionRate,
          engagementScore: insight.performance.avgConversionRate,
          sampleSize: insight.performance.sampleSize,
          lastUpdated: insight.lastUpdated,
        },
        predicted: {
          openRate: insight.performance.avgOpenRate * 1.05,
          clickRate: insight.performance.avgClickRate * 1.03,
          conversionRate: insight.performance.avgConversionRate * 1.02,
          engagementScore: insight.performance.avgConversionRate * 1.05,
          sampleSize: 0,
          lastUpdated: new Date(),
        },
      },
    }));
  }

  /**
   * Update performance data from campaign results
   */
  async updatePerformanceData(
    campaignId: string,
    schedule: ScheduleSlot,
    actualPerformance: PerformanceData
  ): Promise<void> {
    // Forward to SmartScheduler for its learning
    await this.smartScheduler.updatePerformanceData(campaignId, schedule, actualPerformance);

    // Also learn from this data
    const insight: TimingInsight = {
      audienceSegment: schedule.audience.segment,
      contentType: 'email', // Default - should be passed as parameter
      optimalTime: {
        dayOfWeek: new Date(schedule.timestamp).getDay(),
        hour: schedule.hour,
        timezone: schedule.timezone,
      },
      performance: {
        avgOpenRate: actualPerformance.openRate,
        avgClickRate: actualPerformance.clickRate,
        avgConversionRate: actualPerformance.conversionRate,
        confidence: this.calculateConfidence(
          actualPerformance.sampleSize,
          actualPerformance.conversionRate
        ),
        sampleSize: actualPerformance.sampleSize,
      },
      seasonalTrends: {
        current: this.getCurrentSeasonMultiplier(),
      },
      lastUpdated: new Date(),
    };

    this.addTimingInsight(insight);
  }

  /**
   * Helper methods
   */
  private calculateOptimalTimestamp(optimalTime: TimingInsight['optimalTime']): Date {
    const now = new Date();
    const targetDate = new Date(now);

    // Find next occurrence of target day
    const currentDay = now.getDay();
    const daysToAdd = (optimalTime.dayOfWeek - currentDay + 7) % 7;
    targetDate.setDate(now.getDate() + (daysToAdd === 0 ? 7 : daysToAdd));

    targetDate.setHours(optimalTime.hour, 0, 0, 0);

    return targetDate;
  }

  private isTimeSlotAvailable(optimalTime: TimingInsight['optimalTime'], urgency: string): boolean {
    const now = new Date();
    const target = this.calculateOptimalTimestamp(optimalTime);
    const hoursUntil = (target.getTime() - now.getTime()) / (1000 * 60 * 60);

    switch (urgency) {
      case 'immediate':
        return hoursUntil <= 2;
      case 'high':
        return hoursUntil <= 24;
      case 'medium':
        return hoursUntil <= 72;
      default:
        return true;
    }
  }

  private getDayName(dayOfWeek: number): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayOfWeek];
  }

  private getCurrentSeasonMultiplier(): number {
    const month = new Date().getMonth();
    // Simple seasonal adjustment
    if (month >= 2 && month <= 4) return 1.1; // Spring
    if (month >= 5 && month <= 7) return 0.9; // Summer
    if (month >= 8 && month <= 10) return 1.2; // Fall
    return 0.8; // Winter
  }

  private calculateTrend(historicalData: any[]): number {
    if (!historicalData || historicalData.length < 2) return 1.0;

    const recent = historicalData.slice(-3);
    const older = historicalData.slice(-6, -3);

    const recentAvg = recent.reduce((sum, d) => sum + d.performance, 0) / recent.length;
    const olderAvg = older.reduce((sum, d) => sum + d.performance, 0) / older.length;

    return recentAvg / olderAvg;
  }

  private calculateConfidence(sampleSize: number, performance: number): number {
    const baseLine = Math.min(sampleSize / 500, 1.0);
    const performanceBonus = Math.min(performance / 100, 0.2);
    return Math.min(baseLine + performanceBonus, 1.0);
  }

  // Mock data methods - replace with actual data sources
  private async getRecentCampaignData(): Promise<any[]> {
    return [
      {
        id: 'campaign_001',
        audienceSegment: 'premium_users',
        contentType: 'email',
        schedule: {
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
          timezone: 'UTC',
        },
        performance: {
          sent: 1000,
          opens: 280,
          clicks: 56,
          conversions: 18,
        },
        historicalPerformance: [{ performance: 0.25 }, { performance: 0.28 }, { performance: 0.3 }],
      },
    ];
  }

  private async getUniqueAudiences(): Promise<string[]> {
    return ['premium_users', 'new_users', 'engaged_users', 'at_risk_users'];
  }

  private async getAudienceData(audience: string): Promise<any[]> {
    // Mock engagement data
    return Array.from({ length: 100 }, (_, i) => ({
      timestamp: new Date(Date.now() - i * 60 * 60 * 1000),
      engagement: Math.random() * 100,
    }));
  }

  private analyzeSeasonalTrends(audienceData: any[]): Record<string, number> {
    return {
      spring: 1.1,
      summer: 0.9,
      fall: 1.2,
      winter: 0.8,
    };
  }

  private async analyzeCompetition(
    audience: string
  ): Promise<AudienceBehaviorPattern['competitorAnalysis']> {
    return {
      lowCompetitionWindows: [6, 7, 8, 14, 15, 20, 21],
      highCompetitionWindows: [9, 10, 11, 16, 17, 18, 19],
    };
  }

  private async getActiveCampaigns(): Promise<any[]> {
    return [
      {
        id: 'active_001',
        audience: 'premium_users',
        contentType: 'email',
        audienceSize: 5000,
        currentSchedule: {
          performance: 0.25,
        },
      },
    ];
  }

  private getDefaultSchedule(audience: string, contentType: string): ScheduleSlot[] {
    // Return sensible defaults when no learned data is available
    return [
      {
        id: 'default_optimal',
        timestamp: new Date(Date.now() + 24 * 60 * 60 * 1000),
        timezone: 'UTC',
        dayOfWeek: 'Tuesday',
        hour: 10,
        minute: 0,
        audience: {
          segment: audience,
          size: 1000,
          expectedEngagement: 0.75,
        },
        priority: 'primary',
        performance: {
          historical: {
            openRate: 25,
            clickRate: 5,
            conversionRate: 2.5,
            engagementScore: 75,
            sampleSize: 100,
            lastUpdated: new Date(),
          },
          predicted: {
            openRate: 27,
            clickRate: 5.5,
            conversionRate: 3,
            engagementScore: 80,
            sampleSize: 0,
            lastUpdated: new Date(),
          },
        },
      },
    ];
  }

  /**
   * Cleanup and shutdown
   */
  destroy(): void {
    if (this.learningInterval) {
      clearInterval(this.learningInterval);
      this.learningInterval = null;
    }
    console.log('📚 ScheduleOptimizerAgent learning stopped');
  }
}
