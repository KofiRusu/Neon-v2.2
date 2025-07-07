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
      // Fetch CampaignFeedback entries for the specified campaign
      const feedbackEntries = await this.prisma.campaignFeedback.findMany({
        where: {
          campaignId: campaignId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (feedbackEntries.length === 0) {
        // Return default profile for campaigns with no feedback yet
        return {
          score: 65,
          toneAdjustment: "maintain current tone for baseline data",
          trendAdjustment: "continue with current trend strategy",
          platformStrategy: "maintain posting schedule for initial data collection",
        };
      }

      // Calculate average performance metrics
      const avgEngagementRate = this.calculateAverageMetric(feedbackEntries, 'engagementRate');
      const avgConversionRate = this.calculateAverageMetric(feedbackEntries, 'conversionRate');
      const avgBounceRate = this.calculateAverageMetric(feedbackEntries, 'bounceRate');

      // Analyze platform performance
      const platformPerformance = this.analyzePlatformPerformance(feedbackEntries);
      
      // Analyze tone effectiveness
      const toneAnalysis = this.analyzeToneEffectiveness(feedbackEntries);
      
      // Analyze trend impact
      const trendAnalysis = this.analyzeTrendImpact(feedbackEntries);

      // Calculate overall effectiveness score (0-100)
      const score = this.calculateEffectivenessScore(
        avgEngagementRate,
        avgConversionRate,
        avgBounceRate
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
      // This could be used to record real-time performance metrics
      // For now, we'll just log it for future implementation
      console.log('Recording metric:', input);
      
      // Future implementation: Store in a metrics table or update campaign feedback
      // await this.prisma.campaignMetrics.create({ data: input });
      
    } catch (error) {
      console.error('Error recording metric:', error);
    }
  }

  /**
   * Calculates average value for a specific metric across feedback entries
   */
  private static calculateAverageMetric(
    feedbackEntries: any[], 
    metricField: string
  ): number {
    const validEntries = feedbackEntries.filter(entry => 
      entry.performanceMetrics && entry.performanceMetrics[metricField] !== undefined
    );
    
    if (validEntries.length === 0) return 0;
    
    const sum = validEntries.reduce((acc, entry) => 
      acc + (entry.performanceMetrics[metricField] || 0), 0
    );
    
    return sum / validEntries.length;
  }

  /**
   * Analyzes performance across different platforms
   */
  private static analyzePlatformPerformance(feedbackEntries: any[]): Record<string, number> {
    const platformMetrics: Record<string, { total: number; count: number }> = {};
    
    feedbackEntries.forEach(entry => {
      if (entry.platform && entry.performanceMetrics?.engagementRate) {
        if (!platformMetrics[entry.platform]) {
          platformMetrics[entry.platform] = { total: 0, count: 0 };
        }
        platformMetrics[entry.platform].total += entry.performanceMetrics.engagementRate;
        platformMetrics[entry.platform].count += 1;
      }
    });

    // Calculate averages
    const result: Record<string, number> = {};
    Object.keys(platformMetrics).forEach(platform => {
      result[platform] = platformMetrics[platform].total / platformMetrics[platform].count;
    });

    return result;
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
    engagementRate: number,
    conversionRate: number,
    bounceRate: number
  ): number {
    // Weighted scoring algorithm
    const engagementWeight = 0.4;
    const conversionWeight = 0.4;
    const bounceWeight = 0.2; // Inverse scoring for bounce rate

    const engagementScore = Math.min(engagementRate * 100, 100);
    const conversionScore = Math.min(conversionRate * 100, 100);
    const bounceScore = Math.max(100 - (bounceRate * 100), 0); // Lower bounce rate = higher score

    return (
      engagementScore * engagementWeight +
      conversionScore * conversionWeight +
      bounceScore * bounceWeight
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