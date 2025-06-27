import CrossCampaignMemoryStore, { CampaignPattern } from '../memory/CrossCampaignMemoryStore';
import { SmartScheduler } from './smart-scheduler';
import {
  PredictiveCampaignGenerator,
  PredictiveCampaignPlan,
} from './predictive-campaign-generator';
import { ContentAgent } from '../agents/content-agent';
import { BrandVoiceAgent } from '../agents/brand-voice-agent';

export interface AutoReplayConfiguration {
  confidenceThreshold: number;
  maxConcurrentReplays: number;
  minimumTimeBetweenReplays: number; // in hours
  budgetAllocation: number;
  enableContentRefresh: boolean;
  enableTimingOptimization: boolean;
  enableBrandValidation: boolean;
  testMode: boolean;
}

export interface ReplayExecution {
  id: string;
  originalPatternId: string;
  campaignPlan: PredictiveCampaignPlan;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt: Date;
  completedAt?: Date;
  performance?: {
    actualROI: number;
    predictedROI: number;
    variance: number;
    keyMetrics: Record<string, number>;
  };
  modifications: ReplayModification[];
  learnings: string[];
  errorLog?: string[];
}

export interface ReplayModification {
  type: 'content' | 'timing' | 'audience' | 'budget' | 'agent_sequence';
  description: string;
  originalValue: any;
  newValue: any;
  reason: string;
  confidence: number;
}

export interface ReplayAnalytics {
  totalReplays: number;
  successfulReplays: number;
  averageROI: number;
  topPerformingPatterns: string[];
  commonModifications: ReplayModification[];
  learningInsights: string[];
  recommendedOptimizations: string[];
}

export class AutoReplayEngine {
  private crossCampaignMemory: CrossCampaignMemoryStore;
  private smartScheduler: SmartScheduler;
  private predictiveGenerator: PredictiveCampaignGenerator;
  private contentAgent: ContentAgent;
  private brandVoiceAgent: BrandVoiceAgent;
  private configuration: AutoReplayConfiguration;
  private activeReplays: Map<string, ReplayExecution> = new Map();
  private replayHistory: ReplayExecution[] = [];
  private isRunning: boolean = false;

  constructor(config?: Partial<AutoReplayConfiguration>) {
    this.crossCampaignMemory = new CrossCampaignMemoryStore();
    this.smartScheduler = new SmartScheduler();
    this.predictiveGenerator = new PredictiveCampaignGenerator();
    this.contentAgent = new ContentAgent('auto-replay-content');
    this.brandVoiceAgent = new BrandVoiceAgent('auto-replay-brand');

    this.configuration = {
      confidenceThreshold: 85,
      maxConcurrentReplays: 3,
      minimumTimeBetweenReplays: 24,
      budgetAllocation: 10000,
      enableContentRefresh: true,
      enableTimingOptimization: true,
      enableBrandValidation: true,
      testMode: false,
      ...config,
    };
  }

  async startAutoReplay(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Auto-replay engine is already running');
    }

    this.isRunning = true;
    console.log('🚀 Auto-replay engine started');

    // Start the main monitoring loop
    this.startMonitoringLoop();
  }

  async stopAutoReplay(): Promise<void> {
    this.isRunning = false;

    // Cancel any queued replays
    for (const [id, replay] of this.activeReplays) {
      if (replay.status === 'queued') {
        replay.status = 'cancelled';
        replay.completedAt = new Date();
      }
    }

    console.log('⏹️ Auto-replay engine stopped');
  }

  async triggerManualReplay(
    patternId: string,
    overrides?: Partial<AutoReplayConfiguration>
  ): Promise<string> {
    try {
      const pattern = await this.crossCampaignMemory
        .getPatternsByScore(0)
        .then(patterns => patterns.find(p => p.id === patternId));

      if (!pattern) {
        throw new Error(`Pattern ${patternId} not found`);
      }

      const tempConfig = { ...this.configuration, ...overrides };
      const replayId = await this.executeReplay(pattern, tempConfig);

      return replayId;
    } catch (error) {
      throw new Error(`Failed to trigger manual replay: ${error.message}`);
    }
  }

  async getReplayStatus(replayId: string): Promise<ReplayExecution | null> {
    return (
      this.activeReplays.get(replayId) || this.replayHistory.find(r => r.id === replayId) || null
    );
  }

  async getReplayAnalytics(daysBack: number = 30): Promise<ReplayAnalytics> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    const relevantReplays = this.replayHistory.filter(r => r.startedAt >= cutoffDate);
    const successfulReplays = relevantReplays.filter(
      r => r.status === 'completed' && r.performance
    );

    const analytics: ReplayAnalytics = {
      totalReplays: relevantReplays.length,
      successfulReplays: successfulReplays.length,
      averageROI: 0,
      topPerformingPatterns: [],
      commonModifications: [],
      learningInsights: [],
      recommendedOptimizations: [],
    };

    if (successfulReplays.length > 0) {
      // Calculate average ROI
      analytics.averageROI =
        successfulReplays.reduce((sum, r) => sum + (r.performance?.actualROI || 0), 0) /
        successfulReplays.length;

      // Find top performing patterns
      const patternPerformance = new Map<string, number[]>();
      for (const replay of successfulReplays) {
        if (!patternPerformance.has(replay.originalPatternId)) {
          patternPerformance.set(replay.originalPatternId, []);
        }
        patternPerformance.get(replay.originalPatternId)!.push(replay.performance!.actualROI);
      }

      analytics.topPerformingPatterns = Array.from(patternPerformance.entries())
        .map(([id, rois]) => ({ id, avgROI: rois.reduce((a, b) => a + b, 0) / rois.length }))
        .sort((a, b) => b.avgROI - a.avgROI)
        .slice(0, 5)
        .map(p => p.id);

      // Analyze common modifications
      const modificationCounts = new Map<string, number>();
      for (const replay of relevantReplays) {
        for (const mod of replay.modifications) {
          const key = `${mod.type}:${mod.description}`;
          modificationCounts.set(key, (modificationCounts.get(key) || 0) + 1);
        }
      }

      analytics.commonModifications = Array.from(modificationCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([key, count]) => {
          const [type, description] = key.split(':');
          return {
            type: type as any,
            description,
            originalValue: null,
            newValue: null,
            reason: `Applied in ${count} replays`,
            confidence: (count / relevantReplays.length) * 100,
          };
        });

      // Generate learning insights
      analytics.learningInsights = this.generateLearningInsights(successfulReplays);

      // Generate optimization recommendations
      analytics.recommendedOptimizations = this.generateOptimizationRecommendations(analytics);
    }

    return analytics;
  }

  private startMonitoringLoop(): void {
    const checkInterval = 60 * 60 * 1000; // Check every hour

    const monitoringInterval = setInterval(async () => {
      if (!this.isRunning) {
        clearInterval(monitoringInterval);
        return;
      }

      try {
        await this.checkForReplayOpportunities();
        await this.monitorActiveReplays();
        await this.cleanupCompletedReplays();
      } catch (error) {
        console.error('Auto-replay monitoring error:', error);
      }
    }, checkInterval);
  }

  private async checkForReplayOpportunities(): Promise<void> {
    if (this.activeReplays.size >= this.configuration.maxConcurrentReplays) {
      return; // Too many active replays
    }

    // Get high-confidence patterns
    const highConfidencePatterns = await this.crossCampaignMemory.getPatternsByScore(
      this.configuration.confidenceThreshold
    );

    for (const pattern of highConfidencePatterns) {
      if (this.activeReplays.size >= this.configuration.maxConcurrentReplays) {
        break;
      }

      // Check if we've replayed this pattern recently
      const recentReplay = this.findRecentReplay(pattern.id);
      if (recentReplay && this.isWithinMinimumInterval(recentReplay.startedAt)) {
        continue;
      }

      // Check if pattern is suitable for replay
      if (await this.isPatternSuitableForReplay(pattern)) {
        await this.executeReplay(pattern, this.configuration);
      }
    }
  }

  private async executeReplay(
    pattern: CampaignPattern,
    config: AutoReplayConfiguration
  ): Promise<string> {
    const replayId = `replay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Create replay execution record
      const replay: ReplayExecution = {
        id: replayId,
        originalPatternId: pattern.id,
        campaignPlan: {} as PredictiveCampaignPlan, // Will be populated
        status: 'queued',
        startedAt: new Date(),
        modifications: [],
        learnings: [],
      };

      this.activeReplays.set(replayId, replay);

      // Generate campaign plan from pattern
      const campaignPlan = await this.generateCampaignFromPattern(pattern, config);
      replay.campaignPlan = campaignPlan;

      // Apply modifications if enabled
      if (config.enableContentRefresh) {
        await this.refreshContent(replay, config);
      }

      if (config.enableTimingOptimization) {
        await this.optimizeTiming(replay, config);
      }

      if (config.enableBrandValidation) {
        await this.validateBrandAlignment(replay, config);
      }

      // Execute the campaign (in test mode, we just simulate)
      if (config.testMode) {
        replay.status = 'completed';
        replay.completedAt = new Date();
        replay.performance = this.simulatePerformance(campaignPlan);
      } else {
        replay.status = 'running';
        await this.launchCampaign(replay);
      }

      console.log(
        `🔄 Auto-replay ${replayId} ${config.testMode ? 'simulated' : 'launched'} for pattern ${pattern.id}`
      );

      return replayId;
    } catch (error) {
      const replay = this.activeReplays.get(replayId);
      if (replay) {
        replay.status = 'failed';
        replay.completedAt = new Date();
        replay.errorLog = [error.message];
      }

      console.error(`Failed to execute replay ${replayId}:`, error);
      throw error;
    }
  }

  private async generateCampaignFromPattern(
    pattern: CampaignPattern,
    config: AutoReplayConfiguration
  ): Promise<PredictiveCampaignPlan> {
    // Convert pattern to campaign objective
    const objective = this.extractObjectiveFromPattern(pattern);

    // Generate campaign plan
    const plan = await this.predictiveGenerator.generateCampaignPlan(
      objective,
      config.budgetAllocation,
      30, // 30 days default timeline
      { segments: pattern.segments.demographics }
    );

    return plan;
  }

  private async refreshContent(
    replay: ReplayExecution,
    config: AutoReplayConfiguration
  ): Promise<void> {
    try {
      const pattern = await this.crossCampaignMemory
        .getPatternsByScore(0)
        .then(patterns => patterns.find(p => p.id === replay.originalPatternId));

      if (!pattern) return;

      // Generate fresh content based on winning variants
      const newContent = await this.contentAgent.generateContent({
        type: 'campaign_refresh',
        style: pattern.winningVariants.contentStyles[0] || 'professional',
        themes: replay.campaignPlan.contentStrategy.themes,
        audience: replay.campaignPlan.targetSegments[0]?.characteristics || {},
      });

      // Update campaign plan with fresh content
      replay.campaignPlan.contentStrategy.themes = [
        ...replay.campaignPlan.contentStrategy.themes.slice(0, 3),
        ...newContent.themes.slice(0, 2),
      ];

      replay.modifications.push({
        type: 'content',
        description: 'Refreshed content themes and copy',
        originalValue: pattern.winningVariants.contentStyles,
        newValue: newContent.themes,
        reason: 'Generate fresh content to avoid audience fatigue',
        confidence: 85,
      });
    } catch (error) {
      console.error('Content refresh failed:', error);
    }
  }

  private async optimizeTiming(
    replay: ReplayExecution,
    config: AutoReplayConfiguration
  ): Promise<void> {
    try {
      // Get optimal timing from smart scheduler
      const optimalSchedule = await this.smartScheduler.generateOptimalSchedule({
        campaignType: replay.campaignPlan.type,
        targetAudience: replay.campaignPlan.targetSegments[0],
        contentType: 'mixed',
        urgency: 'medium',
        duration: replay.campaignPlan.timeline.totalDuration,
      });

      // Apply timing optimizations to agent orchestration
      for (const agent of replay.campaignPlan.agentOrchestration) {
        agent.parameters = {
          ...agent.parameters,
          optimalTiming: optimalSchedule.recommendations[0]?.timing,
        };
      }

      replay.modifications.push({
        type: 'timing',
        description: 'Optimized agent execution timing',
        originalValue: 'Default timing',
        newValue: optimalSchedule.recommendations[0]?.timing,
        reason: 'Apply current optimal timing patterns',
        confidence: optimalSchedule.confidence,
      });
    } catch (error) {
      console.error('Timing optimization failed:', error);
    }
  }

  private async validateBrandAlignment(
    replay: ReplayExecution,
    config: AutoReplayConfiguration
  ): Promise<void> {
    try {
      // Validate brand alignment
      const brandAnalysis = await this.brandVoiceAgent.analyzeBrandCompliance({
        content: replay.campaignPlan.contentStrategy.themes.join(' '),
        tone: replay.campaignPlan.contentStrategy.tones[0] || 'professional',
        context: 'campaign_replay',
      });

      if (brandAnalysis.score < 80) {
        // Apply brand corrections
        const correctedTones = brandAnalysis.suggestions.map(s => s.replacement).slice(0, 3);
        replay.campaignPlan.contentStrategy.tones = correctedTones;

        replay.modifications.push({
          type: 'content',
          description: 'Applied brand voice corrections',
          originalValue: replay.campaignPlan.contentStrategy.tones,
          newValue: correctedTones,
          reason: `Brand compliance score was ${brandAnalysis.score}, applied corrections`,
          confidence: brandAnalysis.confidence,
        });
      }
    } catch (error) {
      console.error('Brand validation failed:', error);
    }
  }

  private async launchCampaign(replay: ReplayExecution): Promise<void> {
    // This would integrate with the actual campaign execution system
    // For now, we'll simulate the launch process

    setTimeout(async () => {
      try {
        // Simulate campaign execution
        const executionTime = Math.random() * 24 * 60 * 60 * 1000; // 0-24 hours

        setTimeout(() => {
          replay.status = 'completed';
          replay.completedAt = new Date();
          replay.performance = this.simulatePerformance(replay.campaignPlan);

          // Extract learnings
          replay.learnings = this.extractLearnings(replay);

          console.log(
            `✅ Auto-replay ${replay.id} completed with ROI: ${replay.performance.actualROI.toFixed(2)}`
          );
        }, executionTime);
      } catch (error) {
        replay.status = 'failed';
        replay.completedAt = new Date();
        replay.errorLog = [error.message];
      }
    }, 1000); // Start after 1 second
  }

  private simulatePerformance(plan: PredictiveCampaignPlan): ReplayExecution['performance'] {
    const variance = (Math.random() - 0.5) * 0.4; // ±20% variance
    const actualROI = plan.expectedROI * (1 + variance);

    return {
      actualROI,
      predictedROI: plan.expectedROI,
      variance: variance * 100,
      keyMetrics: {
        openRate: plan.predictedMetrics.engagement.openRate * (1 + variance * 0.5),
        clickRate: plan.predictedMetrics.engagement.clickRate * (1 + variance * 0.5),
        conversionRate: plan.predictedMetrics.engagement.conversionRate * (1 + variance * 0.5),
        impressions: plan.predictedMetrics.reach.impressions * (1 + variance * 0.3),
      },
    };
  }

  private async monitorActiveReplays(): Promise<void> {
    for (const [id, replay] of this.activeReplays) {
      if (replay.status === 'running') {
        // Check if replay has been running too long (timeout)
        const runningTime = Date.now() - replay.startedAt.getTime();
        const timeout = 48 * 60 * 60 * 1000; // 48 hours timeout

        if (runningTime > timeout) {
          replay.status = 'failed';
          replay.completedAt = new Date();
          replay.errorLog = ['Replay timed out after 48 hours'];
          console.warn(`⚠️ Auto-replay ${id} timed out`);
        }
      }
    }
  }

  private async cleanupCompletedReplays(): Promise<void> {
    for (const [id, replay] of this.activeReplays) {
      if (['completed', 'failed', 'cancelled'].includes(replay.status)) {
        // Move to history
        this.replayHistory.push(replay);
        this.activeReplays.delete(id);

        // Limit history size
        if (this.replayHistory.length > 1000) {
          this.replayHistory = this.replayHistory.slice(-500);
        }
      }
    }
  }

  private findRecentReplay(patternId: string): ReplayExecution | null {
    const allReplays = [...this.activeReplays.values(), ...this.replayHistory];
    const recentReplays = allReplays
      .filter(r => r.originalPatternId === patternId)
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());

    return recentReplays[0] || null;
  }

  private isWithinMinimumInterval(lastReplayTime: Date): boolean {
    const minInterval = this.configuration.minimumTimeBetweenReplays * 60 * 60 * 1000;
    return Date.now() - lastReplayTime.getTime() < minInterval;
  }

  private async isPatternSuitableForReplay(pattern: CampaignPattern): Promise<boolean> {
    // Check if pattern is recent enough
    const patternAge = Date.now() - pattern.createdAt.getTime();
    const maxAge = 90 * 24 * 60 * 60 * 1000; // 90 days

    if (patternAge > maxAge) {
      return false;
    }

    // Check if pattern has sufficient performance data
    if (pattern.patternScore < this.configuration.confidenceThreshold) {
      return false;
    }

    // Check if we have necessary agents available
    const requiredAgents = pattern.winningVariants.agentSequences[0]?.split('-') || [];
    // This would check actual agent availability in a real implementation

    return true;
  }

  private extractObjectiveFromPattern(pattern: CampaignPattern): string {
    // Extract campaign objective from pattern summary
    const summary = pattern.summary.toLowerCase();

    if (summary.includes('brand awareness')) {
      return 'Increase brand awareness and recognition';
    }
    if (summary.includes('lead gen')) {
      return 'Generate qualified leads for sales team';
    }
    if (summary.includes('product launch')) {
      return 'Launch new product and drive adoption';
    }

    return 'Drive engagement and conversions';
  }

  private extractLearnings(replay: ReplayExecution): string[] {
    const learnings: string[] = [];

    if (replay.performance) {
      const perf = replay.performance;

      if (perf.variance > 10) {
        learnings.push(`Performance exceeded predictions by ${perf.variance.toFixed(1)}%`);
      } else if (perf.variance < -10) {
        learnings.push(
          `Performance fell short of predictions by ${Math.abs(perf.variance).toFixed(1)}%`
        );
      }

      if (perf.actualROI > 2) {
        learnings.push('High ROI campaign - pattern is highly effective');
      }

      // Analyze modifications impact
      const contentMods = replay.modifications.filter(m => m.type === 'content');
      if (contentMods.length > 0 && perf.actualROI > perf.predictedROI) {
        learnings.push('Content modifications had positive impact');
      }
    }

    return learnings;
  }

  private generateLearningInsights(replays: ReplayExecution[]): string[] {
    const insights: string[] = [];

    // Analyze modification success rates
    const modificationImpact = new Map<string, { positive: number; total: number }>();

    for (const replay of replays) {
      const wasSuccessful =
        replay.performance && replay.performance.actualROI > replay.performance.predictedROI;

      for (const mod of replay.modifications) {
        const key = `${mod.type}:${mod.description}`;
        if (!modificationImpact.has(key)) {
          modificationImpact.set(key, { positive: 0, total: 0 });
        }

        const impact = modificationImpact.get(key)!;
        impact.total++;
        if (wasSuccessful) {
          impact.positive++;
        }
      }
    }

    // Generate insights from successful modifications
    for (const [key, impact] of modificationImpact) {
      const successRate = (impact.positive / impact.total) * 100;
      if (successRate > 70 && impact.total >= 3) {
        const [type, description] = key.split(':');
        insights.push(
          `${type} modifications (${description}) show ${successRate.toFixed(1)}% success rate`
        );
      }
    }

    return insights.slice(0, 5);
  }

  private generateOptimizationRecommendations(analytics: ReplayAnalytics): string[] {
    const recommendations: string[] = [];

    if (analytics.averageROI > 2) {
      recommendations.push('Increase replay frequency - patterns are performing well');
    } else if (analytics.averageROI < 1) {
      recommendations.push('Review pattern selection criteria - ROI is below expectations');
    }

    if (analytics.successfulReplays / analytics.totalReplays < 0.7) {
      recommendations.push('Implement stricter pattern validation before replay');
    }

    // Analyze common modifications for recommendations
    const contentMods = analytics.commonModifications.filter(m => m.type === 'content');
    if (contentMods.length > 0) {
      recommendations.push(
        'Content refresh is frequently needed - consider more dynamic content generation'
      );
    }

    return recommendations;
  }

  async cleanup(): Promise<void> {
    await this.stopAutoReplay();
    await this.crossCampaignMemory.disconnect();
    await this.predictiveGenerator.cleanup();
  }
}

export default AutoReplayEngine;
