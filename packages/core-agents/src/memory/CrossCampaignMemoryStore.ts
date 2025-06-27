import { PrismaClient } from '@prisma/client';

export interface CampaignPattern {
  id: string;
  summary: string;
  winningVariants: {
    contentStyles: string[];
    subjects: string[];
    ctaTypes: string[];
    timingWindows: string[];
    agentSequences: string[];
  };
  patternScore: number;
  segments: {
    demographics: Record<string, any>;
    behavioral: Record<string, any>;
    performance: Record<string, number>;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface PerformanceInsight {
  agentType: string;
  goalType: string;
  successRate: number;
  avgPerformance: number;
  bestCollaborations: string[];
  timeCorrelations: Record<string, number>;
  segmentAffinities: Record<string, number>;
}

export interface VariantStructure {
  type: 'subject' | 'copy' | 'visual' | 'cta' | 'timing';
  structure: string;
  performanceScore: number;
  usageCount: number;
  segments: string[];
}

export class CrossCampaignMemoryStore {
  private prisma: PrismaClient;
  private readonly SIMILARITY_THRESHOLD = 0.75;
  private readonly PATTERN_SCORE_THRESHOLD = 85;

  constructor() {
    this.prisma = new PrismaClient();
  }

  // Aggregate campaign performance across multiple runs
  async aggregatePerformanceData(campaignIds: string[]): Promise<PerformanceInsight[]> {
    const insights: PerformanceInsight[] = [];

    try {
      // Get all campaign executions for the specified campaigns
      const executions = await this.prisma.agentExecution.findMany({
        where: {
          campaignId: { in: campaignIds },
          status: 'COMPLETED',
          performance: { gt: 0 },
        },
        include: {
          agent: true,
          campaign: true,
        },
      });

      // Group by agent type and goal
      const groupedData = new Map<string, any[]>();

      for (const execution of executions) {
        const key = `${execution.agent.type}_${execution.campaign?.type}`;
        if (!groupedData.has(key)) {
          groupedData.set(key, []);
        }
        groupedData.get(key)!.push(execution);
      }

      // Calculate insights for each group
      for (const [key, data] of groupedData) {
        const [agentType, goalType] = key.split('_');

        const totalExecutions = data.length;
        const successfulExecutions = data.filter(e => (e.performance || 0) >= 70).length;
        const avgPerformance =
          data.reduce((sum, e) => sum + (e.performance || 0), 0) / totalExecutions;

        // Find best collaborations (agents that performed well together)
        const collaborations = await this.findSuccessfulCollaborations(data);

        // Time correlations
        const timeCorrelations = this.calculateTimeCorrelations(data);

        // Segment affinities
        const segmentAffinities = await this.calculateSegmentAffinities(data);

        insights.push({
          agentType,
          goalType,
          successRate: (successfulExecutions / totalExecutions) * 100,
          avgPerformance,
          bestCollaborations: collaborations.slice(0, 3),
          timeCorrelations,
          segmentAffinities,
        });
      }

      return insights;
    } catch (error) {
      console.error('Error aggregating performance data:', error);
      return [];
    }
  }

  // Detect most successful agents per goal
  async detectSuccessfulAgents(goalType: string): Promise<PerformanceInsight[]> {
    try {
      const executions = await this.prisma.agentExecution.findMany({
        where: {
          campaign: {
            type: goalType as any,
          },
          status: 'COMPLETED',
          performance: { gt: 0 },
        },
        include: {
          agent: true,
        },
      });

      // Group by agent type
      const agentPerformance = new Map<string, number[]>();

      for (const execution of executions) {
        const agentType = execution.agent.type;
        if (!agentPerformance.has(agentType)) {
          agentPerformance.set(agentType, []);
        }
        agentPerformance.get(agentType)!.push(execution.performance || 0);
      }

      // Calculate average performance for each agent type
      const insights: PerformanceInsight[] = [];
      for (const [agentType, scores] of agentPerformance) {
        const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        const successRate = (scores.filter(s => s >= 70).length / scores.length) * 100;

        insights.push({
          agentType,
          goalType,
          successRate,
          avgPerformance: avgScore,
          bestCollaborations: [],
          timeCorrelations: {},
          segmentAffinities: {},
        });
      }

      return insights.sort((a, b) => b.avgPerformance - a.avgPerformance);
    } catch (error) {
      console.error('Error detecting successful agents:', error);
      return [];
    }
  }

  // Detect high-performing variant structures
  async detectVariantStructures(): Promise<VariantStructure[]> {
    try {
      const abTests = await this.prisma.aBTest.findMany({
        where: {
          status: 'COMPLETED',
          confidence: { gt: 95 },
        },
      });

      const structures: VariantStructure[] = [];

      for (const test of abTests) {
        const variants = test.variants as any;
        const results = test.results as any;
        const winner = test.winner;

        if (winner && variants[winner]) {
          const winningVariant = variants[winner];

          // Analyze the structure of winning variants
          if (winningVariant.subject) {
            structures.push({
              type: 'subject',
              structure: this.extractSubjectStructure(winningVariant.subject),
              performanceScore: results[winner]?.performance || 0,
              usageCount: 1,
              segments: results[winner]?.segments || [],
            });
          }

          if (winningVariant.copy) {
            structures.push({
              type: 'copy',
              structure: this.extractCopyStructure(winningVariant.copy),
              performanceScore: results[winner]?.performance || 0,
              usageCount: 1,
              segments: results[winner]?.segments || [],
            });
          }

          if (winningVariant.cta) {
            structures.push({
              type: 'cta',
              structure: winningVariant.cta,
              performanceScore: results[winner]?.performance || 0,
              usageCount: 1,
              segments: results[winner]?.segments || [],
            });
          }
        }
      }

      // Consolidate similar structures
      return this.consolidateStructures(structures);
    } catch (error) {
      console.error('Error detecting variant structures:', error);
      return [];
    }
  }

  // Store aggregated results with timestamps
  async storeCampaignPattern(
    pattern: Omit<CampaignPattern, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    try {
      const stored = await this.prisma.crossCampaignMemory.create({
        data: {
          summary: pattern.summary,
          winningVariants: pattern.winningVariants,
          patternScore: pattern.patternScore,
          segments: pattern.segments,
        },
      });

      return stored.id;
    } catch (error) {
      console.error('Error storing campaign pattern:', error);
      throw error;
    }
  }

  // Retrieve patterns for analysis
  async getPatternsByScore(minScore: number = 80): Promise<CampaignPattern[]> {
    try {
      const patterns = await this.prisma.crossCampaignMemory.findMany({
        where: {
          patternScore: { gte: minScore },
        },
        orderBy: {
          patternScore: 'desc',
        },
      });

      return patterns.map(p => ({
        id: p.id,
        summary: p.summary,
        winningVariants: p.winningVariants as any,
        patternScore: p.patternScore,
        segments: p.segments as any,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      }));
    } catch (error) {
      console.error('Error retrieving patterns by score:', error);
      return [];
    }
  }

  // Get trending patterns (recent high-performers)
  async getTrendingPatterns(daysBack: number = 30): Promise<CampaignPattern[]> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysBack);

      const patterns = await this.prisma.crossCampaignMemory.findMany({
        where: {
          createdAt: { gte: cutoffDate },
          patternScore: { gte: this.PATTERN_SCORE_THRESHOLD },
        },
        orderBy: [{ patternScore: 'desc' }, { createdAt: 'desc' }],
      });

      return patterns.map(p => ({
        id: p.id,
        summary: p.summary,
        winningVariants: p.winningVariants as any,
        patternScore: p.patternScore,
        segments: p.segments as any,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      }));
    } catch (error) {
      console.error('Error retrieving trending patterns:', error);
      return [];
    }
  }

  // Calculate similarity between patterns using cosine similarity
  calculatePatternSimilarity(pattern1: CampaignPattern, pattern2: CampaignPattern): number {
    try {
      // Create feature vectors from patterns
      const features1 = this.extractPatternFeatures(pattern1);
      const features2 = this.extractPatternFeatures(pattern2);

      // Calculate cosine similarity
      let dotProduct = 0;
      let magnitude1 = 0;
      let magnitude2 = 0;

      for (let i = 0; i < Math.max(features1.length, features2.length); i++) {
        const val1 = features1[i] || 0;
        const val2 = features2[i] || 0;

        dotProduct += val1 * val2;
        magnitude1 += val1 * val1;
        magnitude2 += val2 * val2;
      }

      const magnitude = Math.sqrt(magnitude1) * Math.sqrt(magnitude2);
      return magnitude === 0 ? 0 : dotProduct / magnitude;
    } catch (error) {
      console.error('Error calculating pattern similarity:', error);
      return 0;
    }
  }

  // Private helper methods
  private async findSuccessfulCollaborations(executions: any[]): Promise<string[]> {
    // Find agent types that frequently appear together in successful campaigns
    const collaborations = new Map<string, number>();

    // Group by campaign
    const campaignGroups = new Map<string, any[]>();
    for (const exec of executions) {
      if (!campaignGroups.has(exec.campaignId)) {
        campaignGroups.set(exec.campaignId, []);
      }
      campaignGroups.get(exec.campaignId)!.push(exec);
    }

    // Find co-occurring agent types in successful campaigns
    for (const [campaignId, campaignExecs] of campaignGroups) {
      const avgPerformance =
        campaignExecs.reduce((sum, e) => sum + (e.performance || 0), 0) / campaignExecs.length;

      if (avgPerformance >= 70) {
        // Successful campaign
        const agentTypes = campaignExecs.map(e => e.agent.type);

        // Count all pairs
        for (let i = 0; i < agentTypes.length; i++) {
          for (let j = i + 1; j < agentTypes.length; j++) {
            const pair = [agentTypes[i], agentTypes[j]].sort().join('-');
            collaborations.set(pair, (collaborations.get(pair) || 0) + 1);
          }
        }
      }
    }

    return Array.from(collaborations.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([pair, count]) => pair);
  }

  private calculateTimeCorrelations(executions: any[]): Record<string, number> {
    const hourlyPerformance = new Map<number, number[]>();

    for (const exec of executions) {
      const hour = exec.startedAt.getHours();
      if (!hourlyPerformance.has(hour)) {
        hourlyPerformance.set(hour, []);
      }
      hourlyPerformance.get(hour)!.push(exec.performance || 0);
    }

    const correlations: Record<string, number> = {};
    for (const [hour, performances] of hourlyPerformance) {
      const avgPerformance = performances.reduce((sum, p) => sum + p, 0) / performances.length;
      correlations[`hour_${hour}`] = avgPerformance;
    }

    return correlations;
  }

  private async calculateSegmentAffinities(executions: any[]): Promise<Record<string, number>> {
    // This would analyze campaign metadata to find segment patterns
    // For now, return mock data
    return {
      young_adults: 85,
      professionals: 78,
      tech_enthusiasts: 92,
    };
  }

  private extractSubjectStructure(subject: string): string {
    // Analyze subject line structure
    const hasEmoji =
      /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/u.test(
        subject
      );
    const hasNumbers = /\d/.test(subject);
    const hasQuestion = subject.includes('?');
    const hasUrgency = /urgent|now|today|limited|hurry/i.test(subject);
    const length = subject.length;

    let structure = '';
    if (hasEmoji) structure += 'emoji_';
    if (hasNumbers) structure += 'numbers_';
    if (hasQuestion) structure += 'question_';
    if (hasUrgency) structure += 'urgency_';

    if (length < 30) structure += 'short';
    else if (length < 50) structure += 'medium';
    else structure += 'long';

    return structure;
  }

  private extractCopyStructure(copy: string): string {
    // Analyze copy structure
    const wordCount = copy.split(' ').length;
    const hasCallout = /hey|hi|hello/i.test(copy);
    const hasSocial = /share|like|follow|tag/i.test(copy);
    const hasAction = /click|buy|get|download|sign up|join/i.test(copy);

    let structure = '';
    if (hasCallout) structure += 'personal_';
    if (hasSocial) structure += 'social_';
    if (hasAction) structure += 'action_';

    if (wordCount < 20) structure += 'short';
    else if (wordCount < 50) structure += 'medium';
    else structure += 'long';

    return structure;
  }

  private consolidateStructures(structures: VariantStructure[]): VariantStructure[] {
    const consolidated = new Map<string, VariantStructure>();

    for (const structure of structures) {
      const key = `${structure.type}_${structure.structure}`;

      if (consolidated.has(key)) {
        const existing = consolidated.get(key)!;
        existing.performanceScore = (existing.performanceScore + structure.performanceScore) / 2;
        existing.usageCount += structure.usageCount;
        existing.segments = [...new Set([...existing.segments, ...structure.segments])];
      } else {
        consolidated.set(key, { ...structure });
      }
    }

    return Array.from(consolidated.values()).sort(
      (a, b) => b.performanceScore - a.performanceScore
    );
  }

  private extractPatternFeatures(pattern: CampaignPattern): number[] {
    const features: number[] = [];

    // Pattern score
    features.push(pattern.patternScore);

    // Winning variants features
    const variants = pattern.winningVariants;
    features.push(variants.contentStyles?.length || 0);
    features.push(variants.subjects?.length || 0);
    features.push(variants.ctaTypes?.length || 0);
    features.push(variants.timingWindows?.length || 0);
    features.push(variants.agentSequences?.length || 0);

    // Segment features
    const segments = pattern.segments;
    features.push(Object.keys(segments.demographics || {}).length);
    features.push(Object.keys(segments.behavioral || {}).length);
    features.push(Object.keys(segments.performance || {}).length);

    return features;
  }

  // Cleanup old patterns
  async cleanupOldPatterns(daysToKeep: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const result = await this.prisma.crossCampaignMemory.deleteMany({
        where: {
          createdAt: { lt: cutoffDate },
          patternScore: { lt: 60 }, // Only delete low-performing old patterns
        },
      });

      return result.count;
    } catch (error) {
      console.error('Error cleaning up old patterns:', error);
      return 0;
    }
  }

  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}

export default CrossCampaignMemoryStore;
