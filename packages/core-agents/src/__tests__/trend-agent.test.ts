import { TrendAgent } from '../agents/trend-agent';
import { AgentPayload } from '../base-agent';

// Mock data for testing
const mockTrendData = [
  {
    id: 'trend_1',
    name: 'AI Art Challenge',
    platform: 'instagram',
    mentions: 25000,
    type: 'challenge' as const,
    impactScore: 85,
    velocity: 45,
    confidence: 0.87,
    description: 'Users creating art with AI tools and sharing before/after comparisons',
    recommendation: 'Create tutorial content showing AI art creation process with your brand',
    detectedAt: new Date('2024-01-15T10:00:00Z'),
    expiresAt: new Date('2024-02-15T10:00:00Z'),
    relatedKeywords: ['AI', 'art', 'challenge', 'creative'],
    metrics: {
      mentions: 25000,
      engagement: 125000,
      reach: 500000,
      growth: 22,
    },
  },
  {
    id: 'trend_2',
    name: '#ProductivityHacks2024',
    platform: 'tiktok',
    mentions: 15000,
    type: 'hashtag' as const,
    impactScore: 78,
    velocity: 32,
    confidence: 0.82,
    description: 'Short-form videos showing productivity tips and tools',
    recommendation: 'Share quick productivity tips related to your industry expertise',
    detectedAt: new Date('2024-01-14T08:00:00Z'),
    expiresAt: null,
    relatedKeywords: ['productivity', 'tips', 'efficiency'],
    metrics: {
      mentions: 15000,
      engagement: 75000,
      reach: 300000,
      growth: 16,
    },
  },
  {
    id: 'trend_3',
    name: 'Minimalist Aesthetic',
    platform: 'youtube',
    mentions: 8000,
    type: 'style' as const,
    impactScore: 72,
    velocity: 18,
    confidence: 0.75,
    description: 'Clean, minimal design approaches across all content types',
    recommendation: 'Redesign visual content with minimal, clean aesthetics',
    detectedAt: new Date('2024-01-13T14:00:00Z'),
    expiresAt: new Date('2024-03-13T14:00:00Z'),
    relatedKeywords: ['minimalist', 'design', 'aesthetic'],
    metrics: {
      mentions: 8000,
      engagement: 40000,
      reach: 160000,
      growth: 9,
    },
  },
];

describe('TrendAgent', () => {
  let trendAgent: TrendAgent;

  beforeEach(() => {
    trendAgent = new TrendAgent();
  });

  describe('Initialization', () => {
    it('should initialize with correct default values', () => {
      expect(trendAgent.id).toBe('trend-agent');
      expect(trendAgent.name).toBe('TrendAgent');
      expect(trendAgent.type).toBe('trend');
      expect(trendAgent.capabilities).toContain('detect_trends');
      expect(trendAgent.capabilities).toContain('predict_performance');
      expect(trendAgent.capabilities).toContain('get_trend_pulse');
      expect(trendAgent.capabilities).toContain('get_status');
    });

    it('should initialize with custom id and name', () => {
      const customAgent = new TrendAgent('custom-trend-agent', 'CustomTrendAgent');
      expect(customAgent.id).toBe('custom-trend-agent');
      expect(customAgent.name).toBe('CustomTrendAgent');
    });
  });

  describe('detectTrends', () => {
    it('should detect trends with default parameters', async () => {
      const payload: AgentPayload = {
        task: 'detect_trends',
        context: {},
      };

      const result = await trendAgent.execute(payload);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeGreaterThan(0);
      expect(result.data.length).toBeLessThanOrEqual(20); // Default limit
    });

    it('should detect trends with platform filter', async () => {
      const payload: AgentPayload = {
        task: 'detect_trends',
        context: {
          platform: 'instagram',
          limit: 10,
        },
      };

      const result = await trendAgent.execute(payload);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeLessThanOrEqual(10);
      
      // All trends should be from Instagram
      result.data.forEach((trend: any) => {
        expect(trend.platform).toBe('instagram');
      });
    });

    it('should detect trends with sorting options', async () => {
      const payload: AgentPayload = {
        task: 'detect_trends',
        context: {
          sortBy: 'velocity',
          limit: 5,
        },
      };

      const result = await trendAgent.execute(payload);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      
      // Should be sorted by velocity in descending order
      for (let i = 0; i < result.data.length - 1; i++) {
        expect(result.data[i].velocity).toBeGreaterThanOrEqual(result.data[i + 1].velocity);
      }
    });

    it('should validate trend data structure', async () => {
      const payload: AgentPayload = {
        task: 'detect_trends',
        context: { limit: 1 },
      };

      const result = await trendAgent.execute(payload);
      expect(result.success).toBe(true);
      
      const trend = result.data[0];
      expect(trend).toHaveProperty('id');
      expect(trend).toHaveProperty('name');
      expect(trend).toHaveProperty('platform');
      expect(trend).toHaveProperty('mentions');
      expect(trend).toHaveProperty('type');
      expect(trend).toHaveProperty('impactScore');
      expect(trend).toHaveProperty('velocity');
      expect(trend).toHaveProperty('confidence');
      expect(trend).toHaveProperty('description');
      expect(trend).toHaveProperty('recommendation');
      expect(trend).toHaveProperty('detectedAt');
      expect(trend).toHaveProperty('relatedKeywords');
      expect(trend).toHaveProperty('metrics');
      
      // Validate metrics structure
      expect(trend.metrics).toHaveProperty('mentions');
      expect(trend.metrics).toHaveProperty('engagement');
      expect(trend.metrics).toHaveProperty('reach');
      expect(trend.metrics).toHaveProperty('growth');
    });

    it('should validate score bounds', async () => {
      const payload: AgentPayload = {
        task: 'detect_trends',
        context: { limit: 10 },
      };

      const result = await trendAgent.execute(payload);
      expect(result.success).toBe(true);
      
      result.data.forEach((trend: any) => {
        expect(trend.impactScore).toBeGreaterThanOrEqual(0);
        expect(trend.impactScore).toBeLessThanOrEqual(100);
        expect(trend.confidence).toBeGreaterThanOrEqual(0);
        expect(trend.confidence).toBeLessThanOrEqual(1);
        expect(trend.velocity).toBeGreaterThanOrEqual(-100);
        expect(trend.velocity).toBeLessThanOrEqual(100);
      });
    });

    it('should handle invalid platform filter', async () => {
      const payload: AgentPayload = {
        task: 'detect_trends',
        context: {
          platform: 'invalid-platform',
        },
      };

      const result = await trendAgent.execute(payload);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid enum value');
    });

    it('should handle invalid limit values', async () => {
      const payload: AgentPayload = {
        task: 'detect_trends',
        context: {
          limit: 0, // Invalid: should be min 1
        },
      };

      const result = await trendAgent.execute(payload);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Number must be greater than or equal to 1');
    });

    it('should handle limit exceeding maximum', async () => {
      const payload: AgentPayload = {
        task: 'detect_trends',
        context: {
          limit: 150, // Invalid: should be max 100
        },
      };

      const result = await trendAgent.execute(payload);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Number must be less than or equal to 100');
    });
  });

  describe('predictPerformance', () => {
    it('should predict performance for single trend', async () => {
      const payload: AgentPayload = {
        task: 'predict_performance',
        context: {
          trendIds: ['trend_1'],
          campaignId: 'campaign_123',
        },
      };

      const result = await trendAgent.execute(payload);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBe(1);
      
      const prediction = result.data[0];
      expect(prediction).toHaveProperty('id');
      expect(prediction).toHaveProperty('campaignId');
      expect(prediction).toHaveProperty('trendId');
      expect(prediction).toHaveProperty('score');
      expect(prediction).toHaveProperty('rationale');
      expect(prediction).toHaveProperty('predictedImpact');
      expect(prediction).toHaveProperty('timeframe');
      expect(prediction).toHaveProperty('factors');
      expect(prediction).toHaveProperty('riskLevel');
      expect(prediction).toHaveProperty('actionItems');
      expect(prediction).toHaveProperty('confidence');
      expect(prediction).toHaveProperty('createdAt');
      
      expect(prediction.trendId).toBe('trend_1');
      expect(prediction.campaignId).toBe('campaign_123');
    });

    it('should predict performance for multiple trends', async () => {
      const payload: AgentPayload = {
        task: 'predict_performance',
        context: {
          trendIds: ['trend_1', 'trend_2', 'trend_3'],
        },
      };

      const result = await trendAgent.execute(payload);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBe(3);
      
      const trendIds = result.data.map((p: any) => p.trendId);
      expect(trendIds).toContain('trend_1');
      expect(trendIds).toContain('trend_2');
      expect(trendIds).toContain('trend_3');
    });

    it('should apply brand context adjustments', async () => {
      const payload: AgentPayload = {
        task: 'predict_performance',
        context: {
          trendIds: ['trend_1'],
          brandContext: {
            industry: 'tech',
            audience: 'young',
            budget: 50000,
          },
        },
      };

      const result = await trendAgent.execute(payload);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBe(1);
      
      const prediction = result.data[0];
      expect(prediction.rationale).toContain('tech');
    });

    it('should validate prediction score bounds', async () => {
      const payload: AgentPayload = {
        task: 'predict_performance',
        context: {
          trendIds: ['trend_1', 'trend_2'],
        },
      };

      const result = await trendAgent.execute(payload);
      expect(result.success).toBe(true);
      
      result.data.forEach((prediction: any) => {
        expect(prediction.score).toBeGreaterThanOrEqual(0);
        expect(prediction.score).toBeLessThanOrEqual(100);
        expect(prediction.predictedImpact).toBeGreaterThanOrEqual(0);
        expect(prediction.predictedImpact).toBeLessThanOrEqual(100);
        expect(prediction.confidence).toBeGreaterThanOrEqual(0);
        expect(prediction.confidence).toBeLessThanOrEqual(1);
        expect(['low', 'medium', 'high']).toContain(prediction.riskLevel);
      });
    });

    it('should handle empty trend IDs array', async () => {
      const payload: AgentPayload = {
        task: 'predict_performance',
        context: {
          trendIds: [],
        },
      };

      const result = await trendAgent.execute(payload);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Array must contain at least 1 element');
    });

    it('should handle missing trend IDs', async () => {
      const payload: AgentPayload = {
        task: 'predict_performance',
        context: {},
      };

      const result = await trendAgent.execute(payload);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Required');
    });

    it('should validate risk level values', async () => {
      const payload: AgentPayload = {
        task: 'predict_performance',
        context: {
          trendIds: ['trend_1'],
        },
      };

      const result = await trendAgent.execute(payload);
      expect(result.success).toBe(true);
      
      const prediction = result.data[0];
      expect(['low', 'medium', 'high']).toContain(prediction.riskLevel);
    });

    it('should validate arrays structure', async () => {
      const payload: AgentPayload = {
        task: 'predict_performance',
        context: {
          trendIds: ['trend_1'],
        },
      };

      const result = await trendAgent.execute(payload);
      expect(result.success).toBe(true);
      
      const prediction = result.data[0];
      expect(Array.isArray(prediction.factors)).toBe(true);
      expect(Array.isArray(prediction.actionItems)).toBe(true);
      expect(prediction.factors.length).toBeGreaterThan(0);
      expect(prediction.actionItems.length).toBeGreaterThan(0);
    });
  });

  describe('getTrendPulse', () => {
    it('should get trend pulse with default parameters', async () => {
      const payload: AgentPayload = {
        task: 'get_trend_pulse',
        context: {},
      };

      const result = await trendAgent.execute(payload);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data).toHaveProperty('timestamp');
      expect(result.data).toHaveProperty('hotTrends');
      expect(result.data).toHaveProperty('risingTrends');
      expect(result.data).toHaveProperty('analytics');
      expect(result.data).toHaveProperty('insights');
      expect(result.data).toHaveProperty('predictions');
      
      expect(Array.isArray(result.data.hotTrends)).toBe(true);
      expect(Array.isArray(result.data.risingTrends)).toBe(true);
      expect(Array.isArray(result.data.insights)).toBe(true);
      expect(Array.isArray(result.data.predictions)).toBe(true);
    });

    it('should include geo data when requested', async () => {
      const payload: AgentPayload = {
        task: 'get_trend_pulse',
        context: {
          includeGeoData: true,
        },
      };

      const result = await trendAgent.execute(payload);
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('geoData');
      expect(result.data.geoData).toHaveProperty('topRegions');
      expect(result.data.geoData).toHaveProperty('emerging');
    });

    it('should exclude predictions when not requested', async () => {
      const payload: AgentPayload = {
        task: 'get_trend_pulse',
        context: {
          includePredictions: false,
        },
      };

      const result = await trendAgent.execute(payload);
      expect(result.success).toBe(true);
      expect(result.data).not.toHaveProperty('predictions');
    });

    it('should validate analytics structure', async () => {
      const payload: AgentPayload = {
        task: 'get_trend_pulse',
        context: {},
      };

      const result = await trendAgent.execute(payload);
      expect(result.success).toBe(true);
      
      const analytics = result.data.analytics;
      expect(analytics).toHaveProperty('timeframe');
      expect(analytics).toHaveProperty('totalTrends');
      expect(analytics).toHaveProperty('hotTrends');
      expect(analytics).toHaveProperty('risingTrends');
      expect(analytics).toHaveProperty('avgImpactScore');
      expect(analytics).toHaveProperty('avgConfidence');
      expect(analytics).toHaveProperty('platformDistribution');
      
      expect(typeof analytics.totalTrends).toBe('number');
      expect(typeof analytics.hotTrends).toBe('number');
      expect(typeof analytics.risingTrends).toBe('number');
      expect(typeof analytics.avgImpactScore).toBe('number');
      expect(typeof analytics.avgConfidence).toBe('number');
    });
  });

  describe('analyzeTrendImpact', () => {
    it('should analyze trend impact with valid trend ID', async () => {
      const payload: AgentPayload = {
        task: 'analyze_trend_impact',
        context: {
          trendId: 'trend_1',
          campaignData: {
            budget: 25000,
            type: 'social_media',
          },
        },
      };

      const result = await trendAgent.execute(payload);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data).toHaveProperty('trend');
      expect(result.data).toHaveProperty('impactAnalysis');
      expect(result.data).toHaveProperty('recommendations');
      expect(result.data).toHaveProperty('competitorAnalysis');
      
      const impactAnalysis = result.data.impactAnalysis;
      expect(impactAnalysis).toHaveProperty('estimatedReachIncrease');
      expect(impactAnalysis).toHaveProperty('engagementBoost');
      expect(impactAnalysis).toHaveProperty('conversionUplift');
      expect(impactAnalysis).toHaveProperty('riskFactors');
      
      expect(Array.isArray(impactAnalysis.riskFactors)).toBe(true);
      expect(Array.isArray(result.data.recommendations)).toBe(true);
    });

    it('should handle missing trend ID', async () => {
      const payload: AgentPayload = {
        task: 'analyze_trend_impact',
        context: {},
      };

      const result = await trendAgent.execute(payload);
      expect(result.success).toBe(false);
      expect(result.error).toContain('trendId is required');
    });

    it('should handle non-existent trend ID', async () => {
      const payload: AgentPayload = {
        task: 'analyze_trend_impact',
        context: {
          trendId: 'non_existent_trend',
        },
      };

      const result = await trendAgent.execute(payload);
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should include budget-specific recommendations', async () => {
      const payload: AgentPayload = {
        task: 'analyze_trend_impact',
        context: {
          trendId: 'trend_1',
          campaignData: {
            budget: 50000, // High budget
          },
        },
      };

      const result = await trendAgent.execute(payload);
      expect(result.success).toBe(true);
      expect(result.data.recommendations).toContain('Consider paid promotion to amplify reach');
    });
  });

  describe('getTrendingTopics', () => {
    it('should get trending topics with summary', async () => {
      const payload: AgentPayload = {
        task: 'get_trending_topics',
        context: { limit: 5 },
      };

      const result = await trendAgent.execute(payload);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data).toHaveProperty('trends');
      expect(result.data).toHaveProperty('summary');
      expect(result.data).toHaveProperty('recommendations');
      
      const summary = result.data.summary;
      expect(summary).toHaveProperty('totalTrends');
      expect(summary).toHaveProperty('avgImpactScore');
      expect(summary).toHaveProperty('avgConfidence');
      expect(summary).toHaveProperty('platforms');
      expect(summary).toHaveProperty('categories');
      
      const recommendations = result.data.recommendations;
      expect(recommendations).toHaveProperty('immediate');
      expect(recommendations).toHaveProperty('emerging');
      expect(recommendations).toHaveProperty('stable');
      
      expect(Array.isArray(recommendations.immediate)).toBe(true);
      expect(Array.isArray(recommendations.emerging)).toBe(true);
      expect(Array.isArray(recommendations.stable)).toBe(true);
    });

    it('should categorize trends correctly', async () => {
      const payload: AgentPayload = {
        task: 'get_trending_topics',
        context: { limit: 10 },
      };

      const result = await trendAgent.execute(payload);
      expect(result.success).toBe(true);
      
      const recommendations = result.data.recommendations;
      
      // Immediate trends should have high velocity and confidence
      recommendations.immediate.forEach((trend: any) => {
        expect(trend.velocity).toBeGreaterThan(30);
        expect(trend.confidence).toBeGreaterThan(0.8);
      });
      
      // Emerging trends should have medium velocity
      recommendations.emerging.forEach((trend: any) => {
        expect(trend.velocity).toBeGreaterThan(10);
        expect(trend.velocity).toBeLessThanOrEqual(30);
      });
      
      // Stable trends should have high impact but low velocity
      recommendations.stable.forEach((trend: any) => {
        expect(trend.impactScore).toBeGreaterThan(70);
        expect(trend.velocity).toBeLessThanOrEqual(10);
      });
    });
  });

  describe('getStatus', () => {
    it('should get trend agent status', async () => {
      const payload: AgentPayload = {
        task: 'get_status',
        context: {},
      };

      const result = await trendAgent.execute(payload);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data).toHaveProperty('id');
      expect(result.data).toHaveProperty('name');
      expect(result.data).toHaveProperty('type');
      expect(result.data).toHaveProperty('status');
      expect(result.data).toHaveProperty('capabilities');
      expect(result.data).toHaveProperty('trendMetrics');
      expect(result.data).toHaveProperty('performance');
      
      const trendMetrics = result.data.trendMetrics;
      expect(trendMetrics).toHaveProperty('activeTrends');
      expect(trendMetrics).toHaveProperty('lastAnalysis');
      expect(trendMetrics).toHaveProperty('dataFreshness');
      expect(trendMetrics).toHaveProperty('platformCoverage');
      expect(trendMetrics).toHaveProperty('analysisCapabilities');
      
      const performance = result.data.performance;
      expect(performance).toHaveProperty('predictionAccuracy');
      expect(performance).toHaveProperty('trendDetectionSpeed');
      expect(performance).toHaveProperty('dataProcessingRate');
      
      expect(Array.isArray(trendMetrics.platformCoverage)).toBe(true);
      expect(Array.isArray(trendMetrics.analysisCapabilities)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle unknown task', async () => {
      const payload: AgentPayload = {
        task: 'unknown_task',
        context: {},
      };

      const result = await trendAgent.execute(payload);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown task');
    });

    it('should handle invalid input validation', async () => {
      const payload: AgentPayload = {
        task: 'detect_trends',
        context: {
          limit: 'invalid', // Should be number
        },
      };

      const result = await trendAgent.execute(payload);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Expected number');
    });

    it('should handle execution errors gracefully', async () => {
      const payload: AgentPayload = {
        task: 'predict_performance',
        context: {
          trendIds: ['trend_1'],
        },
      };

      // Mock a method to throw an error
      jest.spyOn(trendAgent as any, 'generateTrendPrediction').mockRejectedValue(new Error('API Error'));

      const result = await trendAgent.execute(payload);
      expect(result.success).toBe(false);
      expect(result.error).toContain('API Error');
    });
  });

  describe('Performance', () => {
    it('should complete trend detection within reasonable time', async () => {
      const startTime = Date.now();
      
      const payload: AgentPayload = {
        task: 'detect_trends',
        context: { limit: 50 },
      };

      const result = await trendAgent.execute(payload);
      const executionTime = Date.now() - startTime;
      
      expect(result.success).toBe(true);
      expect(executionTime).toBeLessThan(5000); // Should complete in under 5 seconds
    });

    it('should handle multiple trend predictions efficiently', async () => {
      const startTime = Date.now();
      
      const payload: AgentPayload = {
        task: 'predict_performance',
        context: {
          trendIds: ['trend_1', 'trend_2', 'trend_3', 'trend_4', 'trend_5'],
        },
      };

      const result = await trendAgent.execute(payload);
      const executionTime = Date.now() - startTime;
      
      expect(result.success).toBe(true);
      expect(result.data.length).toBe(5);
      expect(executionTime).toBeLessThan(3000); // Should complete in under 3 seconds
    });
  });

  describe('Trend Classification', () => {
    it('should classify trends by type correctly', async () => {
      const payload: AgentPayload = {
        task: 'detect_trends',
        context: { limit: 10 },
      };

      const result = await trendAgent.execute(payload);
      expect(result.success).toBe(true);
      
      const validTypes = ['hashtag', 'sound', 'influencer', 'topic', 'challenge', 'format', 'style'];
      
      result.data.forEach((trend: any) => {
        expect(validTypes).toContain(trend.type);
      });
    });

    it('should have consistent trend data relationships', async () => {
      const payload: AgentPayload = {
        task: 'detect_trends',
        context: { limit: 5 },
      };

      const result = await trendAgent.execute(payload);
      expect(result.success).toBe(true);
      
      result.data.forEach((trend: any) => {
        // Growth should correlate with velocity
        expect(Math.abs(trend.metrics.growth - trend.velocity * 0.5)).toBeLessThan(10);
        
        // Engagement should be higher than mentions
        expect(trend.metrics.engagement).toBeGreaterThan(trend.metrics.mentions);
        
        // Reach should be higher than engagement
        expect(trend.metrics.reach).toBeGreaterThan(trend.metrics.engagement);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty context', async () => {
      const payload: AgentPayload = {
        task: 'detect_trends',
        context: {},
      };

      const result = await trendAgent.execute(payload);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should handle null values in context gracefully', async () => {
      const payload: AgentPayload = {
        task: 'get_trend_pulse',
        context: {
          includeGeoData: null,
          includePredictions: null,
        },
      };

      const result = await trendAgent.execute(payload);
      // Should fail validation due to null values, but handle gracefully
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle large limit values', async () => {
      const payload: AgentPayload = {
        task: 'detect_trends',
        context: { limit: 100 }, // Maximum allowed
      };

      const result = await trendAgent.execute(payload);
      expect(result.success).toBe(true);
      expect(result.data.length).toBeLessThanOrEqual(100);
    });
  });
}); 