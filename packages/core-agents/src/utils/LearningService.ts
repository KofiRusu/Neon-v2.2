import { PrismaClient } from '@neon/data-model';

export type MetricInput = {
  campaignId: string;
  contentId?: string;
  platform: string;
  metricType: 'engagement' | 'conversion' | 'bounce';
  value: number;
};

export type LearningProfile = {
  score: number;              // 0-100 effectiveness
  toneAdjustment: string;     // e.g., "more casual"
  trendAdjustment: string;    // e.g., "exclude low-impact hashtags"
  platformStrategy: string;   // e.g., "increase posting frequency"
};

export class LearningService {
  private static prisma = new PrismaClient();

  /**
   * Generates a learning profile based on campaign feedback and performance data
   * @param campaignId - The ID of the campaign to analyze
   * @returns Promise<LearningProfile> - AI-generated optimization recommendations
   */
  static async generateLearningProfile(campaignId: string): Promise<LearningProfile> {
    try {
      // Fetch campaign metrics for the specified campaign
      const campaignMetrics = await this.prisma.campaignMetric.findMany({
        where: {
          campaignId: campaignId,
        },
        orderBy: {
          timestamp: 'desc',
        },
        take: 30, // Get last 30 metrics for analysis
      });

      if (campaignMetrics.length === 0) {
        // Return default profile for campaigns with no metrics yet
        return {
          score: 65,
          toneAdjustment: "maintain current tone for baseline data",
          trendAdjustment: "continue with current trend strategy",
          platformStrategy: "maintain posting schedule for initial data collection",
        };
      }

      // Calculate average performance metrics
      const avgImpressions = this.calculateAverageImpressions(campaignMetrics);
      const avgCtr = this.calculateAverageCtr(campaignMetrics);
      const avgConversions = this.calculateAverageConversions(campaignMetrics);

      // Analyze platform performance (using existing data structure)
      const platformPerformance = this.analyzePlatformPerformance(campaignMetrics);
      
      // Analyze tone effectiveness (mock for now)
      const toneAnalysis = this.analyzeToneEffectiveness(campaignMetrics);
      
      // Analyze trend impact (mock for now)
      const trendAnalysis = this.analyzeTrendImpact(campaignMetrics);

      // Calculate overall effectiveness score (0-100)
      const score = this.calculateEffectivenessScore(
        avgImpressions,
        avgCtr,
        avgConversions
      );

      // Generate AI-powered recommendations
      const toneAdjustment = this.generateToneRecommendation(toneAnalysis, score);
      const trendAdjustment = this.generateTrendRecommendation(trendAnalysis, score);
      const platformStrategy = this.generatePlatformStrategy(platformPerformance, score);

      return {
        score: Math.round(score),
        toneAdjustment,
        trendAdjustment,
        platformStrategy,
      };

    } catch (error) {
      console.error('Error generating learning profile:', error);
      
      // Return fallback profile with conservative recommendations
      return {
        score: 72,
        toneAdjustment: "make tone slightly more casual",
        trendAdjustment: "boost hashtags with +0.5 impact score",
        platformStrategy: "post earlier on Instagram and LinkedIn",
      };
    }
  }

  /**
   * Records a new metric input for learning analysis
   * @param input - MetricInput data to record
   */
  static async recordMetric(input: MetricInput): Promise<void> {
    try {
      // Record the metric in the campaign metrics table
      await this.prisma.campaignMetric.create({
        data: {
          campaignId: input.campaignId,
          impressions: input.metricType === 'engagement' ? Math.round(input.value * 1000) : 0,
          ctr: input.metricType === 'engagement' ? input.value : 0,
          conversions: input.metricType === 'conversion' ? Math.round(input.value * 100) : 0,
          timestamp: new Date(),
        },
      });
      
    } catch (error) {
      console.error('Error recording metric:', error);
    }
  }

  /**
   * Calculates average impressions from campaign metrics
   */
  private static calculateAverageImpressions(metrics: any[]): number {
    if (metrics.length === 0) return 0;
    const sum = metrics.reduce((acc, metric) => acc + (metric.impressions || 0), 0);
    return sum / metrics.length;
  }

  /**
   * Calculates average CTR from campaign metrics
   */
  private static calculateAverageCtr(metrics: any[]): number {
    if (metrics.length === 0) return 0;
    const sum = metrics.reduce((acc, metric) => acc + (metric.ctr || 0), 0);
    return sum / metrics.length;
  }

  /**
   * Calculates average conversions from campaign metrics
   */
  private static calculateAverageConversions(metrics: any[]): number {
    if (metrics.length === 0) return 0;
    const sum = metrics.reduce((acc, metric) => acc + (metric.conversions || 0), 0);
    return sum / metrics.length;
  }

  /**
   * Analyzes performance across different platforms (mock implementation)
   */
  private static analyzePlatformPerformance(metrics: any[]): Record<string, number> {
    // Mock analysis based on metrics - would need platform field in real implementation
    return {
      'instagram': 0.85,
      'facebook': 0.72,
      'linkedin': 0.78,
      'twitter': 0.65,
    };
  }

  /**
   * Analyzes effectiveness of different tones
   */
  private static analyzeToneEffectiveness(feedbackEntries: any[]): Record<string, number> {
    // Mock analysis for now - would analyze tone from content and correlate with performance
    return {
      'professional': 72,
      'casual': 85,
      'friendly': 78,
      'authoritative': 65,
    };
  }

  /**
   * Analyzes impact of different trends
   */
  private static analyzeTrendImpact(feedbackEntries: any[]): { avgImpact: number; bestPerformers: string[] } {
    // Mock analysis for now - would analyze trend keywords and their performance
    return {
      avgImpact: 0.7,
      bestPerformers: ['AI tools', 'marketing automation', 'digital transformation'],
    };
  }

  /**
   * Calculates overall effectiveness score
   */
  private static calculateEffectivenessScore(
    impressions: number,
    ctr: number,
    conversions: number
  ): number {
    // Weighted scoring algorithm based on available metrics
    const impressionWeight = 0.3;
    const ctrWeight = 0.4;
    const conversionWeight = 0.3;

    // Normalize metrics to 0-100 scale
    const impressionScore = Math.min((impressions / 10000) * 100, 100); // Normalize to 10k impressions
    const ctrScore = Math.min(ctr * 100, 100); // CTR is already a percentage
    const conversionScore = Math.min((conversions / 100) * 100, 100); // Normalize to 100 conversions

    return (
      impressionScore * impressionWeight +
      ctrScore * ctrWeight +
      conversionScore * conversionWeight
    );
  }

  /**
   * Generates tone recommendation based on analysis
   */
  private static generateToneRecommendation(toneAnalysis: Record<string, number>, score: number): string {
    if (score < 60) {
      return "switch to more casual and friendly tone to improve engagement";
    } else if (score < 75) {
      return "make tone slightly more casual while maintaining professionalism";
    } else {
      return "maintain current tone - performing well";
    }
  }

  /**
   * Generates trend recommendation based on analysis
   */
  private static generateTrendRecommendation(trendAnalysis: { avgImpact: number; bestPerformers: string[] }, score: number): string {
    if (trendAnalysis.avgImpact < 0.5) {
      return "focus on trending topics with higher impact scores (>0.7)";
    } else if (trendAnalysis.avgImpact < 0.7) {
      return "boost hashtags with +0.5 impact score and reduce low-performing keywords";
    } else {
      return `continue leveraging high-impact trends: ${trendAnalysis.bestPerformers.slice(0, 2).join(', ')}`;
    }
  }

  /**
   * Generates platform strategy recommendation
   */
  private static generatePlatformStrategy(platformPerformance: Record<string, number>, score: number): string {
    const platforms = Object.keys(platformPerformance);
    
    if (platforms.length === 0) {
      return "expand to multiple platforms for better reach";
    }

    const bestPlatform = platforms.reduce((best, current) => 
      platformPerformance[current] > platformPerformance[best] ? current : best
    );

    const worstPlatform = platforms.reduce((worst, current) => 
      platformPerformance[current] < platformPerformance[worst] ? current : worst
    );

    if (score < 65) {
      return `focus budget on ${bestPlatform} and optimize ${worstPlatform} posting times`;
    } else {
      return `maintain ${bestPlatform} strategy and increase frequency on ${worstPlatform}`;
    }
  }

  /**
   * Gets learning insights for a specific platform
   */
  static async getPlatformInsights(campaignId: string, platform: string): Promise<{
    bestPostingTimes: string[];
    optimalFrequency: string;
    contentRecommendations: string[];
  }> {
    // Mock data for now - would analyze actual platform performance
    return {
      bestPostingTimes: ['9:00 AM', '2:00 PM', '7:00 PM'],
      optimalFrequency: '2-3 posts per day',
      contentRecommendations: [
        'Include more visual content',
        'Use trending hashtags',
        'Add call-to-action buttons',
      ],
    };
  }

  /**
   * Gets content optimization suggestions
   */
  static async getContentOptimizations(campaignId: string): Promise<{
    lengthRecommendation: string;
    hashtagStrategy: string;
    visualRecommendations: string[];
  }> {
    // Mock data for now - would analyze content performance patterns
    return {
      lengthRecommendation: 'Keep posts between 80-120 characters for optimal engagement',
      hashtagStrategy: 'Use 3-5 targeted hashtags with high trend scores',
      visualRecommendations: [
        'Include branded graphics',
        'Use consistent color scheme',
        'Add video content when possible',
      ],
    };
  }
} 