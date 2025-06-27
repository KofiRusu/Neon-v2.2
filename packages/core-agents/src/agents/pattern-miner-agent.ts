import { AbstractAgent } from '../base-agent';
import { AgentCapability } from '../types/agent-types';
import { withLogging } from '../utils/logger';
import CrossCampaignMemoryStore, {
  CampaignPattern,
  PerformanceInsight,
} from '../memory/CrossCampaignMemoryStore';

export interface PatternMiningResult {
  patterns: CampaignPattern[];
  insights: {
    totalCampaignsAnalyzed: number;
    patternsFound: number;
    topAgentCollaborations: string[];
    timeCorrelations: Record<string, number>;
    segmentInsights: Record<string, number>;
  };
  recommendations: string[];
}

export interface MiningConfiguration {
  minCampaigns: number;
  scoreThreshold: number;
  similarityThreshold: number;
  daysToAnalyze: number;
  includeActiveTests: boolean;
}

export class PatternMinerAgent extends AbstractAgent {
  private memoryStore: CrossCampaignMemoryStore;
  private lastMiningTime: Date | null = null;
  private readonly MINING_INTERVAL = 6 * 60 * 60 * 1000; // 6 hours in milliseconds

  constructor(id: string, config?: Partial<MiningConfiguration>) {
    super(id, 'pattern-miner', [
      AgentCapability.AUTONOMOUS_OPERATION,
      AgentCapability.LEARNING,
      AgentCapability.ANALYTICS,
      AgentCapability.OPTIMIZATION,
    ]);

    this.memoryStore = new CrossCampaignMemoryStore();
    this.startPeriodicMining();
  }

  @withLogging
  async minePatterns(
    config: MiningConfiguration = this.getDefaultConfig()
  ): Promise<PatternMiningResult> {
    try {
      this.updateStatus('RUNNING', 'Starting pattern mining analysis...');

      // Get recent campaigns for analysis
      const campaigns = await this.getRecentCampaigns(config.daysToAnalyze);

      if (campaigns.length < config.minCampaigns) {
        this.updateStatus(
          'IDLE',
          `Insufficient campaigns for analysis (${campaigns.length} < ${config.minCampaigns})`
        );
        return this.createEmptyResult();
      }

      const campaignIds = campaigns.map(c => c.id);

      // Aggregate performance data
      const performanceInsights = await this.memoryStore.aggregatePerformanceData(campaignIds);

      // Find successful patterns
      const successfulPatterns = await this.findSuccessfulPatterns(campaigns, config);

      // Detect agent collaboration patterns
      const collaborationPatterns = await this.detectCollaborationPatterns(campaignIds);

      // Analyze timing correlations
      const timeCorrelations = await this.analyzeTimeCorrelations(campaignIds);

      // Segment analysis
      const segmentInsights = await this.analyzeSegmentPerformance(campaignIds);

      // Store discovered patterns
      const storedPatterns: CampaignPattern[] = [];
      for (const pattern of successfulPatterns) {
        if (pattern.patternScore >= config.scoreThreshold) {
          const patternId = await this.memoryStore.storeCampaignPattern(pattern);
          storedPatterns.push({ ...pattern, id: patternId });
        }
      }

      // Generate recommendations
      const recommendations = this.generateRecommendations(performanceInsights, storedPatterns);

      this.updateStatus(
        'IDLE',
        `Mining complete. Found ${storedPatterns.length} high-value patterns.`
      );
      this.lastMiningTime = new Date();

      return {
        patterns: storedPatterns,
        insights: {
          totalCampaignsAnalyzed: campaigns.length,
          patternsFound: storedPatterns.length,
          topAgentCollaborations: collaborationPatterns.slice(0, 5),
          timeCorrelations,
          segmentInsights,
        },
        recommendations,
      };
    } catch (error) {
      this.updateStatus('ERROR', `Pattern mining failed: ${error.message}`);
      throw error;
    }
  }

  @withLogging
  async findReusableSequences(minSimilarity: number = 0.75): Promise<CampaignPattern[]> {
    try {
      // Get all stored patterns
      const existingPatterns = await this.memoryStore.getPatternsByScore(60);

      // Find patterns with high similarity that can be reused
      const reusableSequences: CampaignPattern[] = [];
      const processedPatterns = new Set<string>();

      for (let i = 0; i < existingPatterns.length; i++) {
        if (processedPatterns.has(existingPatterns[i].id)) continue;

        const currentPattern = existingPatterns[i];
        const similarPatterns = [currentPattern];

        for (let j = i + 1; j < existingPatterns.length; j++) {
          if (processedPatterns.has(existingPatterns[j].id)) continue;

          const similarity = this.memoryStore.calculatePatternSimilarity(
            currentPattern,
            existingPatterns[j]
          );

          if (similarity >= minSimilarity) {
            similarPatterns.push(existingPatterns[j]);
            processedPatterns.add(existingPatterns[j].id);
          }
        }

        // If we found similar patterns, create a reusable sequence
        if (similarPatterns.length > 1) {
          const mergedPattern = this.mergePatterns(similarPatterns);
          reusableSequences.push(mergedPattern);
        }

        processedPatterns.add(currentPattern.id);
      }

      return reusableSequences.sort((a, b) => b.patternScore - a.patternScore);
    } catch (error) {
      this.updateStatus('ERROR', `Failed to find reusable sequences: ${error.message}`);
      throw error;
    }
  }

  @withLogging
  async analyzeAgentCollaboration(): Promise<Record<string, any>> {
    try {
      const campaigns = await this.getRecentCampaigns(90);
      const collaborationAnalysis: Record<string, any> = {};

      // Analyze agent pair performance
      const agentPairs = new Map<
        string,
        { count: number; avgPerformance: number; campaigns: string[] }
      >();

      for (const campaign of campaigns) {
        const executions = await this.getCampaignExecutions(campaign.id);
        const agentTypes = executions.map(e => e.agent.type);
        const avgPerformance =
          executions.reduce((sum, e) => sum + (e.performance || 0), 0) / executions.length;

        // Analyze all agent pairs in this campaign
        for (let i = 0; i < agentTypes.length; i++) {
          for (let j = i + 1; j < agentTypes.length; j++) {
            const pair = [agentTypes[i], agentTypes[j]].sort().join('-');

            if (!agentPairs.has(pair)) {
              agentPairs.set(pair, { count: 0, avgPerformance: 0, campaigns: [] });
            }

            const pairData = agentPairs.get(pair)!;
            pairData.count++;
            pairData.avgPerformance = (pairData.avgPerformance + avgPerformance) / 2;
            pairData.campaigns.push(campaign.id);
          }
        }
      }

      // Find the most successful collaborations
      collaborationAnalysis.topPairs = Array.from(agentPairs.entries())
        .filter(([_, data]) => data.count >= 3) // At least 3 campaigns together
        .sort((a, b) => b[1].avgPerformance - a[1].avgPerformance)
        .slice(0, 10)
        .map(([pair, data]) => ({
          agents: pair,
          performance: data.avgPerformance,
          frequency: data.count,
          campaigns: data.campaigns,
        }));

      // Analyze sequential patterns
      collaborationAnalysis.sequentialPatterns = await this.findSequentialPatterns(campaigns);

      return collaborationAnalysis;
    } catch (error) {
      this.updateStatus('ERROR', `Agent collaboration analysis failed: ${error.message}`);
      throw error;
    }
  }

  // Start periodic mining every 6 hours
  private startPeriodicMining(): void {
    setInterval(async () => {
      try {
        await this.minePatterns();
      } catch (error) {
        console.error('Periodic pattern mining failed:', error);
      }
    }, this.MINING_INTERVAL);
  }

  private async getRecentCampaigns(daysBack: number): Promise<any[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    // This would typically query the database
    // For now, return mock data
    return [
      {
        id: 'camp1',
        name: 'Brand Awareness Q1',
        type: 'CONTENT_GENERATION',
        status: 'COMPLETED',
        createdAt: new Date('2024-01-15'),
        performance: 85,
      },
      {
        id: 'camp2',
        name: 'Lead Gen Campaign',
        type: 'B2B_OUTREACH',
        status: 'COMPLETED',
        createdAt: new Date('2024-01-20'),
        performance: 92,
      },
      {
        id: 'camp3',
        name: 'Product Launch',
        type: 'SOCIAL_MEDIA',
        status: 'COMPLETED',
        createdAt: new Date('2024-01-25'),
        performance: 78,
      },
    ];
  }

  private async getCampaignExecutions(campaignId: string): Promise<any[]> {
    // Mock campaign executions
    return [
      {
        id: 'exec1',
        agent: { type: 'CONTENT' },
        performance: 85,
        startedAt: new Date('2024-01-15T10:00:00Z'),
      },
      {
        id: 'exec2',
        agent: { type: 'EMAIL_MARKETING' },
        performance: 90,
        startedAt: new Date('2024-01-15T11:00:00Z'),
      },
      {
        id: 'exec3',
        agent: { type: 'SOCIAL_POSTING' },
        performance: 82,
        startedAt: new Date('2024-01-15T12:00:00Z'),
      },
    ];
  }

  private async findSuccessfulPatterns(
    campaigns: any[],
    config: MiningConfiguration
  ): Promise<CampaignPattern[]> {
    const patterns: CampaignPattern[] = [];

    for (const campaign of campaigns) {
      if (campaign.performance >= config.scoreThreshold) {
        const executions = await this.getCampaignExecutions(campaign.id);

        // Extract pattern from successful campaign
        const pattern: Omit<CampaignPattern, 'id' | 'createdAt' | 'updatedAt'> = {
          summary: `Successful ${campaign.type} pattern from ${campaign.name}`,
          winningVariants: {
            contentStyles: this.extractContentStyles(executions),
            subjects: this.extractSubjects(executions),
            ctaTypes: this.extractCTATypes(executions),
            timingWindows: this.extractTimingWindows(executions),
            agentSequences: this.extractAgentSequences(executions),
          },
          patternScore: campaign.performance,
          segments: {
            demographics: { age: '25-45', location: 'urban' },
            behavioral: { engagement: 'high', loyalty: 'medium' },
            performance: { openRate: 0.25, clickRate: 0.08, conversionRate: 0.03 },
          },
        };

        patterns.push(pattern as CampaignPattern);
      }
    }

    return patterns;
  }

  private async detectCollaborationPatterns(campaignIds: string[]): Promise<string[]> {
    const collaborations: string[] = [];

    for (const campaignId of campaignIds) {
      const executions = await this.getCampaignExecutions(campaignId);
      const agentTypes = executions.map(e => e.agent.type);

      // Create collaboration signature
      const signature = agentTypes.sort().join('-');
      collaborations.push(signature);
    }

    // Find most common collaborations
    const collaborationCounts = new Map<string, number>();
    for (const collab of collaborations) {
      collaborationCounts.set(collab, (collaborationCounts.get(collab) || 0) + 1);
    }

    return Array.from(collaborationCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([collab, count]) => collab);
  }

  private async analyzeTimeCorrelations(campaignIds: string[]): Promise<Record<string, number>> {
    const timeCorrelations: Record<string, number> = {};

    for (const campaignId of campaignIds) {
      const executions = await this.getCampaignExecutions(campaignId);

      for (const execution of executions) {
        const hour = execution.startedAt.getHours();
        const key = `hour_${hour}`;

        if (!timeCorrelations[key]) {
          timeCorrelations[key] = 0;
        }
        timeCorrelations[key] += execution.performance || 0;
      }
    }

    // Normalize by count
    const counts: Record<string, number> = {};
    for (const campaignId of campaignIds) {
      const executions = await this.getCampaignExecutions(campaignId);
      for (const execution of executions) {
        const key = `hour_${execution.startedAt.getHours()}`;
        counts[key] = (counts[key] || 0) + 1;
      }
    }

    for (const [key, total] of Object.entries(timeCorrelations)) {
      timeCorrelations[key] = total / (counts[key] || 1);
    }

    return timeCorrelations;
  }

  private async analyzeSegmentPerformance(campaignIds: string[]): Promise<Record<string, number>> {
    // Mock segment analysis
    return {
      young_professionals: 88,
      small_business: 92,
      enterprise: 76,
      tech_startups: 95,
      retail: 82,
    };
  }

  private async findSequentialPatterns(campaigns: any[]): Promise<any[]> {
    const sequentialPatterns: any[] = [];

    for (const campaign of campaigns) {
      const executions = await this.getCampaignExecutions(campaign.id);
      const sequence = executions
        .sort((a, b) => a.startedAt.getTime() - b.startedAt.getTime())
        .map(e => e.agent.type);

      sequentialPatterns.push({
        campaignId: campaign.id,
        sequence,
        performance: campaign.performance,
        duration: this.calculateSequenceDuration(executions),
      });
    }

    return sequentialPatterns
      .filter(p => p.performance >= 80)
      .sort((a, b) => b.performance - a.performance);
  }

  private mergePatterns(patterns: CampaignPattern[]): CampaignPattern {
    const merged: CampaignPattern = {
      id: `merged_${Date.now()}`,
      summary: `Merged pattern from ${patterns.length} similar campaigns`,
      winningVariants: {
        contentStyles: [],
        subjects: [],
        ctaTypes: [],
        timingWindows: [],
        agentSequences: [],
      },
      patternScore: 0,
      segments: {
        demographics: {},
        behavioral: {},
        performance: {},
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Merge winning variants
    for (const pattern of patterns) {
      merged.winningVariants.contentStyles.push(...pattern.winningVariants.contentStyles);
      merged.winningVariants.subjects.push(...pattern.winningVariants.subjects);
      merged.winningVariants.ctaTypes.push(...pattern.winningVariants.ctaTypes);
      merged.winningVariants.timingWindows.push(...pattern.winningVariants.timingWindows);
      merged.winningVariants.agentSequences.push(...pattern.winningVariants.agentSequences);
    }

    // Remove duplicates
    merged.winningVariants.contentStyles = [...new Set(merged.winningVariants.contentStyles)];
    merged.winningVariants.subjects = [...new Set(merged.winningVariants.subjects)];
    merged.winningVariants.ctaTypes = [...new Set(merged.winningVariants.ctaTypes)];
    merged.winningVariants.timingWindows = [...new Set(merged.winningVariants.timingWindows)];
    merged.winningVariants.agentSequences = [...new Set(merged.winningVariants.agentSequences)];

    // Average pattern score
    merged.patternScore = patterns.reduce((sum, p) => sum + p.patternScore, 0) / patterns.length;

    return merged;
  }

  private generateRecommendations(
    insights: PerformanceInsight[],
    patterns: CampaignPattern[]
  ): string[] {
    const recommendations: string[] = [];

    // Agent collaboration recommendations
    if (insights.length > 0) {
      const topAgent = insights[0];
      recommendations.push(
        `Focus on ${topAgent.agentType} agents for ${topAgent.goalType} campaigns (${topAgent.successRate.toFixed(1)}% success rate)`
      );
    }

    // Pattern-based recommendations
    if (patterns.length > 0) {
      const topPattern = patterns[0];
      recommendations.push(
        `Leverage the "${topPattern.summary}" pattern for similar campaigns (score: ${topPattern.patternScore})`
      );

      if (topPattern.winningVariants.agentSequences.length > 0) {
        recommendations.push(
          `Use agent sequence: ${topPattern.winningVariants.agentSequences[0]} for optimal results`
        );
      }
    }

    // Timing recommendations
    recommendations.push('Schedule campaigns during peak performance hours (10-11 AM and 2-3 PM)');

    // Segment recommendations
    recommendations.push('Target tech-savvy segments first as they show highest engagement rates');

    return recommendations;
  }

  private extractContentStyles(executions: any[]): string[] {
    return ['professional', 'casual', 'technical'];
  }

  private extractSubjects(executions: any[]): string[] {
    return ['question_medium', 'urgency_short', 'emoji_action_medium'];
  }

  private extractCTATypes(executions: any[]): string[] {
    return ['Learn More', 'Get Started', 'Download Now'];
  }

  private extractTimingWindows(executions: any[]): string[] {
    return ['morning', 'afternoon', 'weekday'];
  }

  private extractAgentSequences(executions: any[]): string[] {
    const sequence = executions
      .sort((a, b) => a.startedAt.getTime() - b.startedAt.getTime())
      .map(e => e.agent.type)
      .join('-');
    return [sequence];
  }

  private calculateSequenceDuration(executions: any[]): number {
    if (executions.length === 0) return 0;

    const sorted = executions.sort((a, b) => a.startedAt.getTime() - b.startedAt.getTime());
    return sorted[sorted.length - 1].startedAt.getTime() - sorted[0].startedAt.getTime();
  }

  private getDefaultConfig(): MiningConfiguration {
    return {
      minCampaigns: 5,
      scoreThreshold: 70,
      similarityThreshold: 0.75,
      daysToAnalyze: 90,
      includeActiveTests: false,
    };
  }

  private createEmptyResult(): PatternMiningResult {
    return {
      patterns: [],
      insights: {
        totalCampaignsAnalyzed: 0,
        patternsFound: 0,
        topAgentCollaborations: [],
        timeCorrelations: {},
        segmentInsights: {},
      },
      recommendations: [
        'Insufficient data for pattern analysis. Run more campaigns to enable pattern mining.',
      ],
    };
  }

  async cleanup(): Promise<void> {
    await this.memoryStore.disconnect();
  }
}

export default PatternMinerAgent;
