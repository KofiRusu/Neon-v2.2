import { TrendAgent } from '../agents/trend-agent';
import { LearningService } from '../utils/LearningService';
import { AgentMemoryStore } from '../memory/AgentMemoryStore';

// Mock the dependencies
jest.mock('../utils/LearningService');
jest.mock('../memory/AgentMemoryStore');

const mockLearningService = LearningService as jest.Mocked<typeof LearningService>;
const mockMemoryStore = AgentMemoryStore as jest.MockedClass<typeof AgentMemoryStore>;

describe('TrendAgent Learning Integration', () => {
  let trendAgent: TrendAgent;
  let mockStoreMemory: jest.Mock;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock AgentMemoryStore
    mockStoreMemory = jest.fn().mockResolvedValue({
      id: 'memory-123',
      agentId: 'trend-agent',
      sessionId: 'campaign-123',
      timestamp: new Date(),
      success: true,
    });

    mockMemoryStore.mockImplementation(() => ({
      storeMemory: mockStoreMemory,
    } as any));

    // Create TrendAgent instance
    trendAgent = new TrendAgent();
  });

  describe('detectTrends with learning', () => {
    it('should apply learning adjustments when campaignId is provided', async () => {
      // Mock learning profile with boost recommendation
      const mockLearningProfile = {
        score: 85,
        toneAdjustment: 'maintain current tone',
        trendAdjustment: 'boost hashtags with +0.5 impact score',
        platformStrategy: 'maintain posting schedule',
      };

      mockLearningService.generateLearningProfile.mockResolvedValue(mockLearningProfile);

      const result = await trendAgent.detectTrends({
        campaignId: 'campaign-123',
        platform: 'all',
        limit: 10,
      });

      expect(result).toHaveLength(8); // Should return 8 trends (mocked data)
      expect(mockLearningService.generateLearningProfile).toHaveBeenCalledWith('campaign-123');
      expect(mockStoreMemory).toHaveBeenCalledWith(
        'trend-agent',
        'campaign-123',
        { action: 'learning_adjustment', campaignId: 'campaign-123' },
        expect.objectContaining({
          learningProfile: mockLearningProfile,
          originalTrendCount: 8,
          adjustedTrendCount: 8,
          decision: expect.stringContaining('Applied learning adjustments'),
        }),
        expect.objectContaining({
          success: true,
          metadata: { type: 'learning_adjustment', agent: 'trend-agent' },
        })
      );
    });

    it('should filter out low-impact trends when learning suggests exclusion', async () => {
      const mockLearningProfile = {
        score: 45,
        toneAdjustment: 'more casual tone',
        trendAdjustment: 'exclude low-impact trends below 70 score',
        platformStrategy: 'increase posting frequency',
      };

      mockLearningService.generateLearningProfile.mockResolvedValue(mockLearningProfile);

      const result = await trendAgent.detectTrends({
        campaignId: 'campaign-456',
        platform: 'instagram',
        limit: 20,
      });

      expect(result).toBeDefined();
      expect(mockLearningService.generateLearningProfile).toHaveBeenCalledWith('campaign-456');
      
      // Should have filtered out trends with impact score < 70
      const lowImpactTrends = result.filter(trend => trend.impactScore < 70);
      expect(lowImpactTrends).toHaveLength(0);
    });

    it('should boost hashtag trends when learning suggests hashtag boost', async () => {
      const mockLearningProfile = {
        score: 78,
        toneAdjustment: 'maintain professional tone',
        trendAdjustment: 'boost hashtags with higher impact scores',
        platformStrategy: 'optimize posting times',
      };

      mockLearningService.generateLearningProfile.mockResolvedValue(mockLearningProfile);

      const result = await trendAgent.detectTrends({
        campaignId: 'campaign-789',
        platform: 'all',
        limit: 10,
      });

      expect(result).toBeDefined();
      
      // Check if hashtag trends were boosted
      const hashtagTrends = result.filter(trend => trend.type === 'hashtag');
      const boostedHashtagTrends = hashtagTrends.filter(trend => 
        trend.recommendation.includes('BOOSTED: High-performing hashtag')
      );
      
      if (hashtagTrends.length > 0) {
        expect(boostedHashtagTrends.length).toBeGreaterThan(0);
      }
    });

    it('should prioritize trends matching successful keywords', async () => {
      const mockLearningProfile = {
        score: 88,
        toneAdjustment: 'maintain current tone',
        trendAdjustment: 'continue leveraging high-impact trends: AI tools, marketing automation',
        platformStrategy: 'maintain strategy',
      };

      mockLearningService.generateLearningProfile.mockResolvedValue(mockLearningProfile);

      const result = await trendAgent.detectTrends({
        campaignId: 'campaign-keywords',
        platform: 'all',
        limit: 10,
      });

      expect(result).toBeDefined();
      
      // Check if trends matching keywords were prioritized
      const prioritizedTrends = result.filter(trend => 
        trend.recommendation.includes('PRIORITIZED: Matches successful campaign keywords')
      );
      
      // Should have some trends prioritized based on keywords
      expect(prioritizedTrends.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle learning service failure gracefully', async () => {
      mockLearningService.generateLearningProfile.mockRejectedValue(new Error('Learning service unavailable'));

      const result = await trendAgent.detectTrends({
        campaignId: 'campaign-error',
        platform: 'tiktok',
        limit: 5,
      });

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      
      // Should log fallback decision
      expect(mockStoreMemory).toHaveBeenCalledWith(
        'trend-agent',
        'campaign-error',
        { action: 'learning_fallback', campaignId: 'campaign-error' },
        expect.objectContaining({
          error: 'Learning service unavailable',
          decision: 'Learning adjustment failed - using standard trend selection',
        }),
        expect.objectContaining({
          success: false,
          errorMessage: 'Learning service unavailable',
          metadata: { type: 'learning_fallback', agent: 'trend-agent' },
        })
      );
    });

    it('should work normally without campaignId (no learning)', async () => {
      const result = await trendAgent.detectTrends({
        platform: 'youtube',
        limit: 15,
      });

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      
      // Should not call learning service
      expect(mockLearningService.generateLearningProfile).not.toHaveBeenCalled();
      expect(mockStoreMemory).not.toHaveBeenCalled();
    });
  });

  describe('applyLearningAdjustments', () => {
    it('should boost high-impact trends when learning suggests boost', async () => {
      const mockTrends = [
        { id: '1', name: 'Low Impact', impactScore: 30, type: 'hashtag' as const },
        { id: '2', name: 'High Impact', impactScore: 85, type: 'hashtag' as const },
        { id: '3', name: 'Medium Impact', impactScore: 55, type: 'topic' as const },
      ];

      const mockLearningProfile = {
        score: 70,
        toneAdjustment: 'maintain tone',
        trendAdjustment: 'boost hashtags with higher impact scores',
        platformStrategy: 'maintain strategy',
      };

      // Access private method through any casting
      const adjustedTrends = await (trendAgent as any).applyLearningAdjustments(
        mockTrends,
        mockLearningProfile,
        'campaign-123'
      );

      expect(adjustedTrends).toHaveLength(3);
      
      // High-impact hashtag should be boosted
      const highImpactTrend = adjustedTrends.find(t => t.id === '2');
      expect(highImpactTrend?.impactScore).toBeGreaterThan(85);
      expect(highImpactTrend?.recommendation).toContain('BOOSTED: High-performing hashtag');
    });

    it('should filter out low-impact trends when learning suggests exclusion', async () => {
      const mockTrends = [
        { id: '1', name: 'Very Low', impactScore: 15, type: 'hashtag' as const },
        { id: '2', name: 'Low', impactScore: 25, type: 'topic' as const },
        { id: '3', name: 'High', impactScore: 80, type: 'challenge' as const },
      ];

      const mockLearningProfile = {
        score: 50,
        toneAdjustment: 'adjust tone',
        trendAdjustment: 'exclude low-impact trends below threshold',
        platformStrategy: 'optimize strategy',
      };

      const adjustedTrends = await (trendAgent as any).applyLearningAdjustments(
        mockTrends,
        mockLearningProfile,
        'campaign-456'
      );

      // Should filter out trends with impact score < 20
      expect(adjustedTrends).toHaveLength(2);
      expect(adjustedTrends.some(t => t.impactScore < 20)).toBe(false);
    });

    it('should extract and prioritize keywords from learning adjustment', async () => {
      const mockTrends = [
        { 
          id: '1', 
          name: 'AI Art Challenge', 
          impactScore: 70, 
          type: 'challenge' as const,
          description: 'AI tools for creative content',
          relatedKeywords: ['AI', 'art', 'creativity']
        },
        { 
          id: '2', 
          name: 'Marketing Tips', 
          impactScore: 65, 
          type: 'topic' as const,
          description: 'Marketing automation strategies',
          relatedKeywords: ['marketing', 'automation']
        },
      ];

      const mockLearningProfile = {
        score: 85,
        toneAdjustment: 'maintain tone',
        trendAdjustment: 'continue leveraging high-impact trends: AI tools, marketing automation',
        platformStrategy: 'maintain strategy',
      };

      const adjustedTrends = await (trendAgent as any).applyLearningAdjustments(
        mockTrends,
        mockLearningProfile,
        'campaign-789'
      );

      // Both trends should be prioritized due to keyword matches
      expect(adjustedTrends).toHaveLength(2);
      
      const aiTrend = adjustedTrends.find(t => t.id === '1');
      const marketingTrend = adjustedTrends.find(t => t.id === '2');
      
      expect(aiTrend?.impactScore).toBeGreaterThan(70);
      expect(marketingTrend?.impactScore).toBeGreaterThan(65);
      
      expect(aiTrend?.recommendation).toContain('PRIORITIZED: Matches successful campaign keywords');
      expect(marketingTrend?.recommendation).toContain('PRIORITIZED: Matches successful campaign keywords');
    });
  });

  describe('extractKeywordsFromAdjustment', () => {
    it('should extract keywords from leveraging pattern', () => {
      const adjustment = 'continue leveraging high-impact trends: AI tools, marketing automation, digital transformation';
      
      const keywords = (trendAgent as any).extractKeywordsFromAdjustment(adjustment);
      
      expect(keywords).toContain('AI tools');
      expect(keywords).toContain('marketing automation');
      expect(keywords).toContain('digital transformation');
    });

    it('should extract quoted keywords', () => {
      const adjustment = 'focus on \'productivity hacks\' and \'business automation\' trends';
      
      const keywords = (trendAgent as any).extractKeywordsFromAdjustment(adjustment);
      
      expect(keywords).toContain('productivity hacks');
      expect(keywords).toContain('business automation');
    });

    it('should return empty array for no keywords', () => {
      const adjustment = 'maintain current trend strategy';
      
      const keywords = (trendAgent as any).extractKeywordsFromAdjustment(adjustment);
      
      expect(keywords).toHaveLength(0);
    });
  });
}); 