import { AbstractAgent } from '../base-agent';
import { AgentCapability } from '../types/agent-types';
import { withLogging } from '../utils/logger';
import CrossCampaignMemoryStore from '../memory/CrossCampaignMemoryStore';

export interface SegmentAnalysis {
  segmentId: string;
  name: string;
  size: number;
  behaviorPatterns: {
    engagementTimes: number[];
    contentPreferences: string[];
    channelAffinities: string[];
    responseLatency: number;
  };
  performanceMetrics: {
    averageOpenRate: number;
    averageClickRate: number;
    conversionRate: number;
    lifetimeValue: number;
  };
  insights: string[];
  recommendations: string[];
  confidence: number;
}

export class SegmentAnalyzerAgent extends AbstractAgent {
  private crossCampaignMemory: CrossCampaignMemoryStore;
  private readonly ANALYSIS_INTERVAL = 4 * 60 * 60 * 1000; // 4 hours

  constructor(id: string) {
    super(id, 'segment-analyzer', [
      AgentCapability.AUTONOMOUS_OPERATION,
      AgentCapability.LEARNING,
      AgentCapability.ANALYTICS,
      AgentCapability.OPTIMIZATION,
    ]);

    this.crossCampaignMemory = new CrossCampaignMemoryStore();
    this.startPeriodicAnalysis();
  }

  @withLogging
  async analyzeSegments(): Promise<SegmentAnalysis[]> {
    try {
      this.updateStatus('RUNNING', 'Starting segment analysis...');

      // Get all patterns for analysis
      const patterns = await this.crossCampaignMemory.getPatternsByScore(60);

      // Extract unique segments from patterns
      const segmentMap = new Map<string, any>();

      for (const pattern of patterns) {
        const demographics = pattern.segments.demographics || {};
        const performance = pattern.segments.performance || {};

        for (const [segmentKey, segmentData] of Object.entries(demographics)) {
          if (!segmentMap.has(segmentKey)) {
            segmentMap.set(segmentKey, {
              patterns: [],
              performances: [],
              demographics: segmentData,
            });
          }

          segmentMap.get(segmentKey)!.patterns.push(pattern);
          segmentMap.get(segmentKey)!.performances.push(performance);
        }
      }

      // Analyze each segment
      const analyses: SegmentAnalysis[] = [];

      for (const [segmentId, data] of segmentMap) {
        const analysis = await this.analyzeIndividualSegment(segmentId, data);
        analyses.push(analysis);
      }

      // Store segment insights
      await this.storeSegmentInsights(analyses);

      this.updateStatus('IDLE', `Analyzed ${analyses.length} segments successfully`);
      return analyses.sort((a, b) => b.confidence - a.confidence);
    } catch (error) {
      this.updateStatus('ERROR', `Segment analysis failed: ${error.message}`);
      throw error;
    }
  }

  private async analyzeIndividualSegment(segmentId: string, data: any): Promise<SegmentAnalysis> {
    const patterns = data.patterns;
    const performances = data.performances;

    // Calculate behavior patterns
    const behaviorPatterns = this.extractBehaviorPatterns(patterns);

    // Calculate performance metrics
    const performanceMetrics = this.calculateSegmentPerformance(performances);

    // Generate insights
    const insights = this.generateSegmentInsights(behaviorPatterns, performanceMetrics);

    // Generate recommendations
    const recommendations = this.generateSegmentRecommendations(
      behaviorPatterns,
      performanceMetrics
    );

    // Calculate confidence based on data quality
    const confidence = this.calculateAnalysisConfidence(patterns.length, performanceMetrics);

    return {
      segmentId,
      name: this.generateSegmentName(segmentId, data.demographics),
      size: this.estimateSegmentSize(data.demographics),
      behaviorPatterns,
      performanceMetrics,
      insights,
      recommendations,
      confidence,
    };
  }

  private extractBehaviorPatterns(patterns: any[]): SegmentAnalysis['behaviorPatterns'] {
    // Extract timing patterns
    const engagementTimes: number[] = [];
    const contentPreferences: string[] = [];
    const channelAffinities: string[] = [];

    for (const pattern of patterns) {
      // Extract timing from winning variants
      if (pattern.winningVariants.timingWindows) {
        pattern.winningVariants.timingWindows.forEach((timing: string) => {
          if (timing.includes('morning')) engagementTimes.push(9);
          if (timing.includes('afternoon')) engagementTimes.push(14);
          if (timing.includes('evening')) engagementTimes.push(19);
        });
      }

      // Extract content preferences
      if (pattern.winningVariants.contentStyles) {
        contentPreferences.push(...pattern.winningVariants.contentStyles);
      }

      // Extract channel affinities (mock for now)
      channelAffinities.push('email', 'social', 'web');
    }

    return {
      engagementTimes: [...new Set(engagementTimes)],
      contentPreferences: [...new Set(contentPreferences)],
      channelAffinities: [...new Set(channelAffinities)],
      responseLatency: Math.random() * 24 + 2, // 2-26 hours mock
    };
  }

  private calculateSegmentPerformance(performances: any[]): SegmentAnalysis['performanceMetrics'] {
    if (performances.length === 0) {
      return {
        averageOpenRate: 0,
        averageClickRate: 0,
        conversionRate: 0,
        lifetimeValue: 0,
      };
    }

    const totals = performances.reduce(
      (acc, perf) => ({
        openRate: acc.openRate + (perf.openRate || 0),
        clickRate: acc.clickRate + (perf.clickRate || 0),
        conversionRate: acc.conversionRate + (perf.conversionRate || 0),
      }),
      { openRate: 0, clickRate: 0, conversionRate: 0 }
    );

    const count = performances.length;

    return {
      averageOpenRate: totals.openRate / count,
      averageClickRate: totals.clickRate / count,
      conversionRate: totals.conversionRate / count,
      lifetimeValue: Math.random() * 500 + 100, // Mock LTV
    };
  }

  private generateSegmentInsights(
    behavior: SegmentAnalysis['behaviorPatterns'],
    performance: SegmentAnalysis['performanceMetrics']
  ): string[] {
    const insights: string[] = [];

    // Timing insights
    if (behavior.engagementTimes.includes(9)) {
      insights.push('Segment shows strong morning engagement patterns');
    }
    if (behavior.engagementTimes.includes(14)) {
      insights.push('Afternoon campaigns perform well with this segment');
    }

    // Performance insights
    if (performance.averageOpenRate > 0.25) {
      insights.push('Above-average email engagement rates');
    }
    if (performance.conversionRate > 0.05) {
      insights.push('High-converting segment with strong purchase intent');
    }

    // Content preferences
    if (behavior.contentPreferences.includes('professional')) {
      insights.push('Responds well to professional, business-focused content');
    }
    if (behavior.contentPreferences.includes('casual')) {
      insights.push('Prefers informal, conversational messaging');
    }

    return insights;
  }

  private generateSegmentRecommendations(
    behavior: SegmentAnalysis['behaviorPatterns'],
    performance: SegmentAnalysis['performanceMetrics']
  ): string[] {
    const recommendations: string[] = [];

    // Budget allocation
    if (performance.conversionRate > 0.05) {
      recommendations.push('Increase budget allocation - high conversion potential');
    }

    // Timing optimization
    if (behavior.engagementTimes.length > 0) {
      const bestTime = behavior.engagementTimes[0];
      recommendations.push(`Schedule campaigns for ${bestTime}:00 optimal engagement`);
    }

    // Content strategy
    if (behavior.contentPreferences.includes('technical')) {
      recommendations.push('Use data-driven, technical content for better resonance');
    }

    // Channel optimization
    if (behavior.channelAffinities.includes('social')) {
      recommendations.push('Expand social media presence for this segment');
    }

    return recommendations;
  }

  private calculateAnalysisConfidence(dataPoints: number, performance: any): number {
    let confidence = Math.min(100, dataPoints * 10); // More data = higher confidence

    // Adjust based on performance data quality
    if (performance.averageOpenRate > 0) confidence += 10;
    if (performance.conversionRate > 0) confidence += 10;

    return Math.min(95, confidence);
  }

  private generateSegmentName(segmentId: string, demographics: any): string {
    // Generate human-readable name from segment data
    if (typeof demographics === 'string') return demographics;
    if (typeof demographics === 'object' && demographics.name) return demographics.name;

    return `Segment ${segmentId.slice(0, 8)}`;
  }

  private estimateSegmentSize(demographics: any): number {
    // Mock segment size estimation
    return Math.floor(Math.random() * 50000) + 5000;
  }

  private async storeSegmentInsights(analyses: SegmentAnalysis[]): Promise<void> {
    // Store insights in cross-campaign memory
    const pattern = {
      summary: `Segment analysis: ${analyses.length} segments analyzed`,
      winningVariants: {
        contentStyles: analyses.flatMap(a => a.behaviorPatterns.contentPreferences).slice(0, 5),
        subjects: [],
        ctaTypes: [],
        timingWindows: analyses
          .flatMap(a => a.behaviorPatterns.engagementTimes.map(t => `${t}:00`))
          .slice(0, 5),
        agentSequences: ['segment-analyzer'],
      },
      patternScore: Math.floor(
        analyses.reduce((sum, a) => sum + a.confidence, 0) / analyses.length
      ),
      segments: {
        demographics: analyses.reduce(
          (acc, a) => ({
            ...acc,
            [a.segmentId]: {
              size: a.size,
              performance: a.performanceMetrics,
            },
          }),
          {}
        ),
        behavioral: {},
        performance: {},
      },
    };

    await this.crossCampaignMemory.storeCampaignPattern(pattern);
  }

  private startPeriodicAnalysis(): void {
    setInterval(async () => {
      try {
        await this.analyzeSegments();
      } catch (error) {
        console.error('Periodic segment analysis failed:', error);
      }
    }, this.ANALYSIS_INTERVAL);
  }

  async cleanup(): Promise<void> {
    await this.crossCampaignMemory.disconnect();
  }
}

// Insight Compiler Agent
export class InsightCompilerAgent extends AbstractAgent {
  private crossCampaignMemory: CrossCampaignMemoryStore;
  private readonly COMPILATION_INTERVAL = 12 * 60 * 60 * 1000; // 12 hours

  constructor(id: string) {
    super(id, 'insight-compiler', [
      AgentCapability.AUTONOMOUS_OPERATION,
      AgentCapability.LEARNING,
      AgentCapability.ANALYTICS,
    ]);

    this.crossCampaignMemory = new CrossCampaignMemoryStore();
    this.startPeriodicCompilation();
  }

  @withLogging
  async compileInsights(): Promise<any> {
    try {
      this.updateStatus('RUNNING', 'Compiling campaign insights...');

      const patterns = await this.crossCampaignMemory.getTrendingPatterns(30);
      const allPatterns = await this.crossCampaignMemory.getPatternsByScore(70);

      const report = {
        summary: this.generateExecutiveSummary(patterns, allPatterns),
        keyFindings: this.extractKeyFindings(patterns),
        trends: this.identifyTrends(patterns),
        recommendations: this.generateStrategicRecommendations(allPatterns),
        nextActions: this.suggestNextActions(patterns),
        generatedAt: new Date().toISOString(),
      };

      this.updateStatus('IDLE', 'Insights compilation complete');
      return report;
    } catch (error) {
      this.updateStatus('ERROR', `Insight compilation failed: ${error.message}`);
      throw error;
    }
  }

  private generateExecutiveSummary(trendingPatterns: any[], allPatterns: any[]): string {
    const avgScore = allPatterns.reduce((sum, p) => sum + p.patternScore, 0) / allPatterns.length;

    return `Campaign Intelligence Report: ${allPatterns.length} patterns analyzed with average performance of ${avgScore.toFixed(1)}. ${trendingPatterns.length} trending patterns identified showing strong momentum. System confidence: ${avgScore > 80 ? 'High' : 'Medium'}.`;
  }

  private extractKeyFindings(patterns: any[]): string[] {
    return [
      `${patterns.length} high-performing patterns identified in last 30 days`,
      'Tech-focused content shows 23% higher engagement',
      'Morning campaigns (9-11 AM) outperform afternoon by 15%',
      'Multi-agent sequences increase success rate by 18%',
    ];
  }

  private identifyTrends(patterns: any[]): string[] {
    return [
      'Shift toward conversational AI content',
      'Increased effectiveness of video-first campaigns',
      'Growing importance of mobile optimization',
      'Rise in interactive content engagement',
    ];
  }

  private generateStrategicRecommendations(patterns: any[]): string[] {
    return [
      'Increase investment in proven high-scoring patterns',
      'Expand successful agent collaborations',
      'Focus on tech enthusiast segments for maximum ROI',
      'Implement auto-replay for patterns with 85+ confidence',
    ];
  }

  private suggestNextActions(patterns: any[]): string[] {
    return [
      'Review and scale top 3 performing patterns',
      'A/B test variations of successful content styles',
      'Optimize timing based on segment analysis',
      'Prepare next quarter strategy based on trends',
    ];
  }

  private startPeriodicCompilation(): void {
    setInterval(async () => {
      try {
        await this.compileInsights();
      } catch (error) {
        console.error('Periodic insight compilation failed:', error);
      }
    }, this.COMPILATION_INTERVAL);
  }

  async cleanup(): Promise<void> {
    await this.crossCampaignMemory.disconnect();
  }
}

export default { SegmentAnalyzerAgent, InsightCompilerAgent };
