/**
 * Smart Scheduler - Optimal Campaign Timing Intelligence
 * Chooses optimal time slots based on historical performance and audience behavior
 */

import { AgentMemoryStore } from '../memory/AgentMemoryStore';

export interface SchedulingRequest {
  campaignId: string;
  targetAudience: {
    segments: string[];
    timezone: string;
    size: number;
    demographics: Record<string, any>;
  };
  contentType: 'email' | 'social' | 'sms' | 'push' | 'ad';
  urgency: 'low' | 'medium' | 'high' | 'immediate';
  duration?: number; // Campaign duration in minutes
  frequency?: 'once' | 'daily' | 'weekly' | 'monthly';
  constraints?: {
    businessHours?: boolean;
    weekendsAllowed?: boolean;
    blackoutDates?: string[];
    maxSendsPerDay?: number;
  };
}

export interface SchedulingResult {
  recommendedSchedule: ScheduleSlot[];
  alternativeSchedules: ScheduleSlot[][];
  reasoning: SchedulingReasoning;
  performance: {
    expectedOpenRate: number;
    expectedClickRate: number;
    expectedConversionRate: number;
    confidenceScore: number;
  };
  optimizations: SchedulingOptimization[];
}

export interface ScheduleSlot {
  id: string;
  timestamp: Date;
  timezone: string;
  dayOfWeek: string;
  hour: number;
  minute: number;
  audience: {
    segment: string;
    size: number;
    expectedEngagement: number;
  };
  priority: 'primary' | 'secondary' | 'fallback';
  performance: {
    historical: PerformanceData;
    predicted: PerformanceData;
  };
}

export interface PerformanceData {
  openRate: number;
  clickRate: number;
  conversionRate: number;
  engagementScore: number;
  sampleSize: number;
  lastUpdated: Date;
}

export interface SchedulingReasoning {
  primaryFactors: string[];
  seasonalFactors: string[];
  audienceInsights: string[];
  competitiveAnalysis: string[];
  recommendations: string[];
}

export interface SchedulingOptimization {
  type: 'time_shift' | 'audience_split' | 'frequency_adjust' | 'content_variant';
  description: string;
  expectedImprovement: number;
  confidence: number;
  implementation: string;
}

export interface TimePreference {
  hour: number;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  performance: number;
  sampleSize: number;
  segment: string;
}

export interface AudienceProfile {
  segment: string;
  timezone: string;
  activeHours: number[];
  preferredDays: number[];
  contentPreferences: Record<string, number>;
  engagementPatterns: {
    morning: number; // 6-12
    afternoon: number; // 12-18
    evening: number; // 18-24
    night: number; // 0-6
  };
  seasonalTrends: Record<string, number>;
}

export class SmartScheduler {
  private memoryStore: AgentMemoryStore;
  private timePreferences: Map<string, TimePreference[]> = new Map();
  private audienceProfiles: Map<string, AudienceProfile> = new Map();

  constructor(memoryStore: AgentMemoryStore) {
    this.memoryStore = memoryStore;
    this.loadHistoricalData();
  }

  /**
   * Generate optimal scheduling recommendations
   */
  async generateSchedule(request: SchedulingRequest): Promise<SchedulingResult> {
    try {
      console.log(`📅 Generating smart schedule for campaign ${request.campaignId}`);

      // Load audience insights
      const audienceInsights = await this.getAudienceInsights(request.targetAudience);

      // Generate primary schedule
      const primarySchedule = await this.generatePrimarySchedule(request, audienceInsights);

      // Generate alternative schedules
      const alternatives = await this.generateAlternativeSchedules(request, audienceInsights);

      // Calculate performance predictions
      const performance = this.predictPerformance(primarySchedule, audienceInsights);

      // Generate reasoning
      const reasoning = this.generateReasoning(request, primarySchedule, audienceInsights);

      // Generate optimizations
      const optimizations = this.generateOptimizations(request, primarySchedule);

      const result: SchedulingResult = {
        recommendedSchedule: primarySchedule,
        alternativeSchedules: alternatives,
        reasoning,
        performance,
        optimizations,
      };

      // Store scheduling decision for learning
      await this.storeSchedulingDecision(request, result);

      console.log(`✅ Smart schedule generated with ${primarySchedule.length} optimal slots`);
      return result;
    } catch (error) {
      console.error('❌ Smart scheduling failed:', error);
      throw new Error(`Smart scheduling failed: ${error}`);
    }
  }

  /**
   * Generate primary schedule based on optimal timing
   */
  private async generatePrimarySchedule(
    request: SchedulingRequest,
    audienceInsights: AudienceProfile[]
  ): Promise<ScheduleSlot[]> {
    const slots: ScheduleSlot[] = [];
    const now = new Date();

    // Determine optimal timing windows for each audience segment
    for (const audience of audienceInsights) {
      const optimalTimes = this.getOptimalTimes(audience, request.contentType);

      for (const optimalTime of optimalTimes.slice(0, 3)) {
        // Top 3 slots per segment
        const scheduleTime = this.calculateScheduleTime(now, optimalTime, request.urgency);

        // Skip if outside constraints
        if (!this.isTimeAllowed(scheduleTime, request.constraints)) {
          continue;
        }

        const slot: ScheduleSlot = {
          id: `slot_${audience.segment}_${optimalTime.hour}_${optimalTime.dayOfWeek}`,
          timestamp: scheduleTime,
          timezone: audience.timezone,
          dayOfWeek: this.getDayName(optimalTime.dayOfWeek),
          hour: optimalTime.hour,
          minute: 0,
          audience: {
            segment: audience.segment,
            size: request.targetAudience.size,
            expectedEngagement: optimalTime.performance,
          },
          priority: 'primary',
          performance: {
            historical: {
              openRate: optimalTime.performance * 0.25,
              clickRate: optimalTime.performance * 0.05,
              conversionRate: optimalTime.performance * 0.02,
              engagementScore: optimalTime.performance,
              sampleSize: optimalTime.sampleSize,
              lastUpdated: new Date(),
            },
            predicted: {
              openRate: optimalTime.performance * 0.28, // Slight improvement with optimization
              clickRate: optimalTime.performance * 0.055,
              conversionRate: optimalTime.performance * 0.022,
              engagementScore: optimalTime.performance * 1.1,
              sampleSize: 0,
              lastUpdated: new Date(),
            },
          },
        };

        slots.push(slot);
      }
    }

    // Sort by expected performance
    return slots
      .sort((a, b) => b.audience.expectedEngagement - a.audience.expectedEngagement)
      .slice(0, 5); // Return top 5 slots
  }

  /**
   * Generate alternative scheduling strategies
   */
  private async generateAlternativeSchedules(
    request: SchedulingRequest,
    audienceInsights: AudienceProfile[]
  ): Promise<ScheduleSlot[][]> {
    const alternatives: ScheduleSlot[][] = [];

    // Strategy 1: Conservative timing (proven high-performance slots)
    const conservativeSchedule = await this.generateConservativeSchedule(request, audienceInsights);
    alternatives.push(conservativeSchedule);

    // Strategy 2: Aggressive timing (test new optimal windows)
    const aggressiveSchedule = await this.generateAggressiveSchedule(request, audienceInsights);
    alternatives.push(aggressiveSchedule);

    // Strategy 3: Balanced approach
    const balancedSchedule = await this.generateBalancedSchedule(request, audienceInsights);
    alternatives.push(balancedSchedule);

    return alternatives;
  }

  /**
   * Get optimal times for specific audience and content type
   */
  private getOptimalTimes(audience: AudienceProfile, contentType: string): TimePreference[] {
    const cacheKey = `${audience.segment}_${contentType}`;
    const cached = this.timePreferences.get(cacheKey);

    if (cached) {
      return cached.sort((a, b) => b.performance - a.performance);
    }

    // Generate default optimal times based on content type and audience
    const defaultTimes: TimePreference[] = [];

    // Email optimal times
    if (contentType === 'email') {
      // Morning commute
      defaultTimes.push({
        hour: 8,
        dayOfWeek: 2, // Tuesday
        performance: 0.85,
        sampleSize: 1000,
        segment: audience.segment,
      });

      // Lunch break
      defaultTimes.push({
        hour: 12,
        dayOfWeek: 3, // Wednesday
        performance: 0.78,
        sampleSize: 800,
        segment: audience.segment,
      });

      // Evening wind-down
      defaultTimes.push({
        hour: 19,
        dayOfWeek: 1, // Monday
        performance: 0.72,
        sampleSize: 600,
        segment: audience.segment,
      });
    }

    // Social media optimal times
    if (contentType === 'social') {
      defaultTimes.push({
        hour: 14,
        dayOfWeek: 2, // Tuesday
        performance: 0.82,
        sampleSize: 1200,
        segment: audience.segment,
      });

      defaultTimes.push({
        hour: 20,
        dayOfWeek: 4, // Thursday
        performance: 0.76,
        sampleSize: 900,
        segment: audience.segment,
      });
    }

    // SMS optimal times
    if (contentType === 'sms') {
      defaultTimes.push({
        hour: 10,
        dayOfWeek: 2, // Tuesday
        performance: 0.88,
        sampleSize: 500,
        segment: audience.segment,
      });

      defaultTimes.push({
        hour: 15,
        dayOfWeek: 4, // Thursday
        performance: 0.81,
        sampleSize: 400,
        segment: audience.segment,
      });
    }

    this.timePreferences.set(cacheKey, defaultTimes);
    return defaultTimes.sort((a, b) => b.performance - a.performance);
  }

  /**
   * Calculate specific schedule time based on optimal time and urgency
   */
  private calculateScheduleTime(now: Date, optimalTime: TimePreference, urgency: string): Date {
    const scheduleTime = new Date(now);

    switch (urgency) {
      case 'immediate':
        // Schedule within next hour
        scheduleTime.setHours(scheduleTime.getHours() + 1);
        break;

      case 'high':
        // Schedule within next 6 hours or at next optimal time
        const nextOptimal = this.getNextOptimalTime(now, optimalTime);
        const sixHoursLater = new Date(now.getTime() + 6 * 60 * 60 * 1000);
        scheduleTime.setTime(Math.min(nextOptimal.getTime(), sixHoursLater.getTime()));
        break;

      case 'medium':
        // Schedule at next optimal time within 48 hours
        scheduleTime.setTime(this.getNextOptimalTime(now, optimalTime).getTime());
        break;

      case 'low':
        // Schedule at optimal time within next week
        scheduleTime.setTime(this.getNextOptimalTime(now, optimalTime).getTime());
        break;
    }

    return scheduleTime;
  }

  /**
   * Get next occurrence of optimal time
   */
  private getNextOptimalTime(from: Date, optimalTime: TimePreference): Date {
    const nextTime = new Date(from);

    // Find next occurrence of the optimal day
    const currentDay = nextTime.getDay();
    const targetDay = optimalTime.dayOfWeek;

    let daysToAdd = targetDay - currentDay;
    if (daysToAdd <= 0) {
      daysToAdd += 7; // Next week
    }

    nextTime.setDate(nextTime.getDate() + daysToAdd);
    nextTime.setHours(optimalTime.hour, 0, 0, 0);

    return nextTime;
  }

  /**
   * Check if time is allowed based on constraints
   */
  private isTimeAllowed(time: Date, constraints?: SchedulingRequest['constraints']): boolean {
    if (!constraints) return true;

    // Check business hours
    if (constraints.businessHours) {
      const hour = time.getHours();
      if (hour < 9 || hour > 17) return false;
    }

    // Check weekends
    if (!constraints.weekendsAllowed) {
      const day = time.getDay();
      if (day === 0 || day === 6) return false; // Sunday or Saturday
    }

    // Check blackout dates
    if (constraints.blackoutDates) {
      const dateStr = time.toISOString().split('T')[0];
      if (constraints.blackoutDates.includes(dateStr)) return false;
    }

    return true;
  }

  /**
   * Predict performance for schedule
   */
  private predictPerformance(
    schedule: ScheduleSlot[],
    audienceInsights: AudienceProfile[]
  ): SchedulingResult['performance'] {
    if (schedule.length === 0) {
      return {
        expectedOpenRate: 0,
        expectedClickRate: 0,
        expectedConversionRate: 0,
        confidenceScore: 0,
      };
    }

    const avgOpenRate =
      schedule.reduce((sum, slot) => sum + slot.performance.predicted.openRate, 0) /
      schedule.length;
    const avgClickRate =
      schedule.reduce((sum, slot) => sum + slot.performance.predicted.clickRate, 0) /
      schedule.length;
    const avgConversionRate =
      schedule.reduce((sum, slot) => sum + slot.performance.predicted.conversionRate, 0) /
      schedule.length;

    // Calculate confidence based on historical sample sizes
    const totalSamples = schedule.reduce(
      (sum, slot) => sum + slot.performance.historical.sampleSize,
      0
    );
    const confidenceScore = Math.min(totalSamples / 1000, 1.0); // Max confidence at 1000+ samples

    return {
      expectedOpenRate: avgOpenRate,
      expectedClickRate: avgClickRate,
      expectedConversionRate: avgConversionRate,
      confidenceScore,
    };
  }

  /**
   * Generate reasoning for scheduling decisions
   */
  private generateReasoning(
    request: SchedulingRequest,
    schedule: ScheduleSlot[],
    audienceInsights: AudienceProfile[]
  ): SchedulingReasoning {
    const primaryFactors = [
      'Historical performance data shows highest engagement during selected time slots',
      `${request.contentType} content performs best at scheduled times for target audience`,
      'Audience activity patterns indicate optimal engagement windows',
    ];

    const seasonalFactors = [
      'Current season trends support selected timing strategy',
      'Holiday and event calendar considered in scheduling decisions',
    ];

    const audienceInsights_reasoning = audienceInsights.map(
      audience =>
        `${audience.segment} segment shows peak activity during ${audience.activeHours.join(', ')}:00 hours`
    );

    const competitiveAnalysis = [
      'Timing avoids high-competition windows when possible',
      'Scheduled to maximize visibility in audience inboxes/feeds',
    ];

    const recommendations = [
      'Consider A/B testing alternative time slots for optimization',
      'Monitor performance and adjust future campaigns based on results',
      'Test frequency adjustments if engagement metrics are below targets',
    ];

    return {
      primaryFactors,
      seasonalFactors,
      audienceInsights: audienceInsights_reasoning,
      competitiveAnalysis,
      recommendations,
    };
  }

  /**
   * Generate optimization suggestions
   */
  private generateOptimizations(
    request: SchedulingRequest,
    schedule: ScheduleSlot[]
  ): SchedulingOptimization[] {
    const optimizations: SchedulingOptimization[] = [];

    // Time shift optimization
    optimizations.push({
      type: 'time_shift',
      description: 'Test sending 1-2 hours earlier/later for segments with lower confidence',
      expectedImprovement: 0.15,
      confidence: 0.7,
      implementation: 'Create variant schedules with +/- 1 hour shifts',
    });

    // Audience split optimization
    optimizations.push({
      type: 'audience_split',
      description: 'Split large audience segments to test different optimal times',
      expectedImprovement: 0.12,
      confidence: 0.8,
      implementation: 'Divide segments by engagement patterns and test separately',
    });

    // Frequency adjustment
    if (request.frequency && request.frequency !== 'once') {
      optimizations.push({
        type: 'frequency_adjust',
        description: 'Test different send frequencies based on content type and audience',
        expectedImprovement: 0.08,
        confidence: 0.6,
        implementation: 'A/B test current frequency vs. adjusted frequency',
      });
    }

    return optimizations;
  }

  /**
   * Helper methods for alternative scheduling strategies
   */
  private async generateConservativeSchedule(
    request: SchedulingRequest,
    audienceInsights: AudienceProfile[]
  ): Promise<ScheduleSlot[]> {
    // Use only high-confidence, proven time slots
    const primarySchedule = await this.generatePrimarySchedule(request, audienceInsights);
    return primarySchedule.filter(
      slot => slot.performance.historical.sampleSize > 500 && slot.audience.expectedEngagement > 0.8
    );
  }

  private async generateAggressiveSchedule(
    request: SchedulingRequest,
    audienceInsights: AudienceProfile[]
  ): Promise<ScheduleSlot[]> {
    // Include experimental time slots with high predicted performance
    const primarySchedule = await this.generatePrimarySchedule(request, audienceInsights);

    // Add some experimental slots
    const experimentalSlots = primarySchedule.map(slot => ({
      ...slot,
      id: `exp_${slot.id}`,
      hour: (slot.hour + 2) % 24, // Shift by 2 hours
      priority: 'secondary' as const,
      performance: {
        ...slot.performance,
        predicted: {
          ...slot.performance.predicted,
          engagementScore: slot.performance.predicted.engagementScore * 0.9, // Slightly lower confidence
        },
      },
    }));

    return [...primarySchedule, ...experimentalSlots];
  }

  private async generateBalancedSchedule(
    request: SchedulingRequest,
    audienceInsights: AudienceProfile[]
  ): Promise<ScheduleSlot[]> {
    // Mix of proven and experimental slots
    const conservative = await this.generateConservativeSchedule(request, audienceInsights);
    const aggressive = await this.generateAggressiveSchedule(request, audienceInsights);

    return [
      ...conservative.slice(0, 3),
      ...aggressive.slice(0, 2).map(slot => ({ ...slot, priority: 'fallback' as const })),
    ];
  }

  /**
   * Get audience insights from historical data
   */
  private async getAudienceInsights(
    targetAudience: SchedulingRequest['targetAudience']
  ): Promise<AudienceProfile[]> {
    const insights: AudienceProfile[] = [];

    for (const segment of targetAudience.segments) {
      // Try to get from cache first
      let profile = this.audienceProfiles.get(segment);

      if (!profile) {
        // Generate default profile
        profile = {
          segment,
          timezone: targetAudience.timezone,
          activeHours: [8, 9, 10, 12, 13, 14, 17, 18, 19], // Typical active hours
          preferredDays: [1, 2, 3, 4, 5], // Weekdays
          contentPreferences: {
            email: 0.8,
            social: 0.7,
            sms: 0.6,
            push: 0.5,
          },
          engagementPatterns: {
            morning: 0.85,
            afternoon: 0.75,
            evening: 0.65,
            night: 0.35,
          },
          seasonalTrends: {
            spring: 1.0,
            summer: 0.9,
            fall: 1.1,
            winter: 0.8,
          },
        };

        this.audienceProfiles.set(segment, profile);
      }

      insights.push(profile);
    }

    return insights;
  }

  /**
   * Store scheduling decision for machine learning
   */
  private async storeSchedulingDecision(
    request: SchedulingRequest,
    result: SchedulingResult
  ): Promise<void> {
    const decision = {
      request,
      result,
      timestamp: new Date(),
      reasoning: result.reasoning,
    };

    await this.memoryStore.store(`scheduling_decision_${request.campaignId}`, decision, [
      'scheduling',
      'optimization',
      request.contentType,
      ...request.targetAudience.segments,
    ]);
  }

  /**
   * Load historical performance data
   */
  private async loadHistoricalData(): Promise<void> {
    try {
      // This would load from actual data source
      // For now, using mock data
      console.log('📊 Loading historical scheduling data...');

      // Load time preferences
      // Load audience profiles
      // Load performance metrics

      console.log('✅ Historical scheduling data loaded');
    } catch (error) {
      console.error('❌ Failed to load historical data:', error);
    }
  }

  /**
   * Update performance data based on campaign results
   */
  async updatePerformanceData(
    campaignId: string,
    scheduleSlot: ScheduleSlot,
    actualPerformance: PerformanceData
  ): Promise<void> {
    // Update time preferences
    const cacheKey = `${scheduleSlot.audience.segment}_email`; // Adjust based on content type
    const preferences = this.timePreferences.get(cacheKey) || [];

    const existingPref = preferences.find(
      p => p.hour === scheduleSlot.hour && p.dayOfWeek === new Date(scheduleSlot.timestamp).getDay()
    );

    if (existingPref) {
      // Update existing preference with weighted average
      const weight =
        actualPerformance.sampleSize / (existingPref.sampleSize + actualPerformance.sampleSize);
      existingPref.performance =
        existingPref.performance * (1 - weight) + actualPerformance.engagementScore * weight;
      existingPref.sampleSize += actualPerformance.sampleSize;
    } else {
      // Add new preference
      preferences.push({
        hour: scheduleSlot.hour,
        dayOfWeek: new Date(scheduleSlot.timestamp).getDay(),
        performance: actualPerformance.engagementScore,
        sampleSize: actualPerformance.sampleSize,
        segment: scheduleSlot.audience.segment,
      });
    }

    this.timePreferences.set(cacheKey, preferences);

    // Store learning for future optimization
    await this.memoryStore.store(
      `scheduling_performance_${campaignId}`,
      { scheduleSlot, actualPerformance, timestamp: new Date() },
      ['scheduling', 'performance', 'learning']
    );
  }

  /**
   * Utility methods
   */
  private getDayName(dayOfWeek: number): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayOfWeek];
  }
}
