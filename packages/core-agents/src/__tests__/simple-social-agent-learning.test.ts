import { SimpleSocialAgent } from '../agents/simple-social-agent';
import { LearningService } from '../utils/LearningService';

// Mock the dependencies
jest.mock('../utils/LearningService');

const mockLearningService = LearningService as jest.Mocked<typeof LearningService>;

describe('SimpleSocialAgent Learning Integration', () => {
  let socialAgent: SimpleSocialAgent;
  let mockStoreMemory: jest.Mock;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock storeMemory function
    mockStoreMemory = jest.fn().mockResolvedValue({
      id: 'memory-123',
      agentId: 'simple-social-agent',
      sessionId: 'campaign-123',
      timestamp: new Date(),
      success: true,
    });

    // Create SimpleSocialAgent instance
    socialAgent = new SimpleSocialAgent();
    
    // Inject mock memory store
    (socialAgent as any).memoryStore = {
      storeMemory: mockStoreMemory,
    };
  });

  describe('schedulePost with learning', () => {
    it('should apply timing adjustments when learning suggests earlier posting', async () => {
      const mockLearningProfile = {
        score: 85,
        toneAdjustment: 'maintain current tone',
        trendAdjustment: 'continue current trends',
        platformStrategy: 'post earlier on Instagram and LinkedIn',
      };

      mockLearningService.generateLearningProfile.mockResolvedValue(mockLearningProfile);

      const result = await socialAgent.execute({
        task: 'schedule_post',
        context: {
          content: 'Test post content',
          datetime: '2024-01-15T14:00:00.000Z', // 2 PM
          platform: 'instagram',
          campaignId: 'campaign-123'
        }
      });

      expect(result.success).toBe(true);
      expect(result.data.scheduled).toBe(true);
      expect(result.data.timingAdjusted).toBe(true);
      expect(result.data.datetime).toBe('2024-01-15T12:00:00.000Z'); // 2 hours earlier
      expect(result.data.platformAdjustments).toContain('Moved post 2 hours earlier on instagram');
      
      expect(mockLearningService.generateLearningProfile).toHaveBeenCalledWith('campaign-123');
      
      // Check that memory store was called for the learning adjustment
      expect(mockStoreMemory).toHaveBeenCalledWith(
        'simple-social-agent',
        'campaign-123',
        expect.objectContaining({
          action: 'schedule_learning_adjustment',
          platform: 'instagram'
        }),
        expect.objectContaining({
          learningProfile: mockLearningProfile,
          platformAdjustments: expect.arrayContaining(['Moved post 2 hours earlier on instagram']),
        }),
        expect.objectContaining({
          success: true,
          metadata: { type: 'learning_adjustment', agent: 'simple-social-agent' }
        })
      );
    });

    it('should apply timing adjustments when learning suggests later posting', async () => {
      const mockLearningProfile = {
        score: 72,
        toneAdjustment: 'make slightly more casual',
        trendAdjustment: 'boost trending hashtags',
        platformStrategy: 'post later on Twitter for better engagement',
      };

      mockLearningService.generateLearningProfile.mockResolvedValue(mockLearningProfile);

      const result = await socialAgent.execute({
        task: 'schedule_post',
        context: {
          content: 'Test tweet',
          datetime: '2024-01-15T10:00:00.000Z', // 10 AM
          platform: 'twitter',
          campaignId: 'campaign-456'
        }
      });

      expect(result.success).toBe(true);
      expect(result.data.scheduled).toBe(true);
      expect(result.data.timingAdjusted).toBe(true);
      expect(result.data.datetime).toBe('2024-01-15T12:00:00.000Z'); // 2 hours later
      expect(result.data.platformAdjustments).toContain('Moved post 2 hours later on twitter');
    });

    it('should suppress post when learning suggests pausing platform', async () => {
      const mockLearningProfile = {
        score: 45,
        toneAdjustment: 'make more engaging tone',
        trendAdjustment: 'focus on higher-impact trends',
        platformStrategy: 'pause Facebook posting due to poor performance',
      };

      mockLearningService.generateLearningProfile.mockResolvedValue(mockLearningProfile);

      const result = await socialAgent.execute({
        task: 'schedule_post',
        context: {
          content: 'Facebook post content',
          datetime: '2024-01-15T16:00:00.000Z',
          platform: 'facebook',
          campaignId: 'campaign-789'
        }
      });

      expect(result.success).toBe(true);
      expect(result.data.scheduled).toBe(false);
      expect(result.data.skipped).toBe(true);
      expect(result.data.reason).toBe('Platform suppressed based on learning insights');
      expect(result.data.platformAdjustments).toContain('Platform facebook suppressed due to poor performance');
    });

    it('should apply budget focus adjustments', async () => {
      const mockLearningProfile = {
        score: 78,
        toneAdjustment: 'maintain professional tone',
        trendAdjustment: 'continue leveraging successful trends',
        platformStrategy: 'focus budget on Instagram and LinkedIn for better ROI',
      };

      mockLearningService.generateLearningProfile.mockResolvedValue(mockLearningProfile);

      const result = await socialAgent.execute({
        task: 'schedule_post',
        context: {
          content: 'Test post on non-focus platform',
          datetime: '2024-01-15T15:00:00.000Z',
          platform: 'twitter', // Not in focus platforms
          campaignId: 'campaign-focus'
        }
      });

      expect(result.success).toBe(true);
      expect(result.data.scheduled).toBe(false);
      expect(result.data.skipped).toBe(true);
      expect(result.data.platformAdjustments).toContain('Platform twitter deprioritized - focusing budget on instagram, linkedin');
    });

    it('should apply performance-based timing optimization for low-performing campaigns', async () => {
      const mockLearningProfile = {
        score: 35, // Low performance score
        toneAdjustment: 'switch to more engaging tone',
        trendAdjustment: 'exclude low-impact trends',
        platformStrategy: 'optimize posting times for better performance',
      };

      mockLearningService.generateLearningProfile.mockResolvedValue(mockLearningProfile);

      const result = await socialAgent.execute({
        task: 'schedule_post',
        context: {
          content: 'Instagram post',
          datetime: '2024-01-15T02:00:00.000Z', // 2 AM - suboptimal time
          platform: 'instagram',
          campaignId: 'campaign-lowperf'
        }
      });

      expect(result.success).toBe(true);
      expect(result.data.scheduled).toBe(true);
      expect(result.data.timingAdjusted).toBe(true);
      expect(result.data.datetime).toBe('2024-01-15T06:00:00.000Z'); // Optimized to 6 AM
      expect(result.data.platformAdjustments).toContain('Optimized timing for low-performing campaign on instagram');
    });

    it('should recommend frequency adjustments', async () => {
      const mockLearningProfile = {
        score: 88,
        toneAdjustment: 'maintain excellent tone',
        trendAdjustment: 'continue with successful trends',
        platformStrategy: 'increase frequency on LinkedIn and decrease frequency on TikTok',
      };

      mockLearningService.generateLearningProfile.mockResolvedValue(mockLearningProfile);

      const result = await socialAgent.execute({
        task: 'schedule_post',
        context: {
          content: 'LinkedIn professional post',
          datetime: '2024-01-15T13:00:00.000Z',
          platform: 'linkedin',
          campaignId: 'campaign-freq'
        }
      });

      expect(result.success).toBe(true);
      expect(result.data.scheduled).toBe(true);
      expect(result.data.platformAdjustments).toContain('Increase posting frequency on linkedin');
    });

    it('should handle learning service failure gracefully', async () => {
      mockLearningService.generateLearningProfile.mockRejectedValue(new Error('Learning service unavailable'));

      const result = await socialAgent.execute({
        task: 'schedule_post',
        context: {
          content: 'Test post',
          datetime: '2024-01-15T12:00:00.000Z',
          platform: 'instagram',
          campaignId: 'campaign-error'
        }
      });

      expect(result.success).toBe(true);
      expect(result.data.scheduled).toBe(true);
      expect(result.data.datetime).toBe('2024-01-15T12:00:00.000Z'); // No change
      expect(result.data.timingAdjusted).toBe(false);
      
      // Should log fallback decision
      expect(mockStoreMemory).toHaveBeenCalledWith(
        'simple-social-agent',
        'campaign-error',
        expect.objectContaining({
          action: 'schedule_learning_fallback'
        }),
        expect.objectContaining({
          error: 'Learning service unavailable',
          decision: 'Learning adjustment failed - using standard scheduling'
        }),
        expect.objectContaining({
          success: false,
          metadata: { type: 'learning_fallback', agent: 'simple-social-agent' }
        })
      );
    });

    it('should work normally without campaignId (no learning)', async () => {
      const result = await socialAgent.execute({
        task: 'schedule_post',
        context: {
          content: 'Regular post without learning',
          datetime: '2024-01-15T15:00:00.000Z',
          platform: 'twitter'
          // No campaignId
        }
      });

      expect(result.success).toBe(true);
      expect(result.data.scheduled).toBe(true);
      expect(result.data.datetime).toBe('2024-01-15T15:00:00.000Z'); // No change
      expect(result.data.timingAdjusted).toBe(false);
      expect(result.data.learningDecision).toBe('No learning applied - no campaignId provided');
      
      // Should not call learning service
      expect(mockLearningService.generateLearningProfile).not.toHaveBeenCalled();
      
      // Should not call memory store for learning-specific actions (may be called by base agent for execution logging)
      const learningCalls = mockStoreMemory.mock.calls.filter(call => 
        call[2] && typeof call[2] === 'object' && 
        (call[2].action === 'schedule_learning_adjustment' || call[2].action === 'schedule_learning_fallback')
      );
      expect(learningCalls).toHaveLength(0);
    });
  });

  describe('platform-specific timing optimization', () => {
    it('should optimize Instagram posting times correctly', async () => {
      const optimizedTime = (socialAgent as any).getOptimizedPostTime('instagram', '2024-01-15T03:00:00.000Z');
      expect(optimizedTime).toBe('2024-01-15T06:00:00.000Z'); // 6 AM
    });

    it('should optimize Facebook posting times correctly', async () => {
      const optimizedTime = (socialAgent as any).getOptimizedPostTime('facebook', '2024-01-15T05:00:00.000Z');
      expect(optimizedTime).toBe('2024-01-15T09:00:00.000Z'); // 9 AM
    });

    it('should optimize Twitter posting times correctly', async () => {
      const optimizedTime = (socialAgent as any).getOptimizedPostTime('twitter', '2024-01-15T06:00:00.000Z');
      expect(optimizedTime).toBe('2024-01-15T08:00:00.000Z'); // 8 AM (6 AM -> 8 AM)
    });

    it('should optimize LinkedIn posting times correctly', async () => {
      const optimizedTime = (socialAgent as any).getOptimizedPostTime('linkedin', '2024-01-15T22:00:00.000Z');
      expect(optimizedTime).toBe('2024-01-16T08:00:00.000Z'); // Next day 8 AM
    });

    it('should handle invalid datetime gracefully', async () => {
      const originalTime = 'invalid-datetime';
      const optimizedTime = (socialAgent as any).getOptimizedPostTime('instagram', originalTime);
      expect(optimizedTime).toBe(originalTime); // Should return original if invalid
    });
  });

  describe('time adjustment utilities', () => {
    it('should adjust post time correctly', async () => {
      const originalTime = '2024-01-15T12:00:00.000Z';
      const adjustedTime = (socialAgent as any).adjustPostTime(originalTime, -2); // 2 hours earlier
      expect(adjustedTime).toBe('2024-01-15T10:00:00.000Z');
    });

    it('should handle positive hour offsets', async () => {
      const originalTime = '2024-01-15T08:00:00.000Z';
      const adjustedTime = (socialAgent as any).adjustPostTime(originalTime, 4); // 4 hours later
      expect(adjustedTime).toBe('2024-01-15T12:00:00.000Z');
    });

    it('should handle invalid datetime gracefully', async () => {
      const invalidTime = 'not-a-date';
      const adjustedTime = (socialAgent as any).adjustPostTime(invalidTime, 2);
      expect(adjustedTime).toBe(invalidTime); // Should return original if invalid
    });
  });

  describe('platform extraction utilities', () => {
    it('should extract platforms from strategy text correctly', async () => {
      const strategy = 'focus budget on Instagram and LinkedIn for better engagement on Twitter';
      const platforms = (socialAgent as any).extractPlatformsFromStrategy(strategy);
      expect(platforms).toEqual(['instagram', 'linkedin', 'twitter']);
    });

    it('should handle strategy with no platforms', async () => {
      const strategy = 'optimize posting times for better performance';
      const platforms = (socialAgent as any).extractPlatformsFromStrategy(strategy);
      expect(platforms).toEqual([]);
    });

    it('should handle strategy with single platform', async () => {
      const strategy = 'increase posting frequency on YouTube';
      const platforms = (socialAgent as any).extractPlatformsFromStrategy(strategy);
      expect(platforms).toEqual(['youtube']);
    });
  });

  describe('complex learning scenarios', () => {
    it('should handle multiple adjustments in single strategy', async () => {
      const mockLearningProfile = {
        score: 65,
        toneAdjustment: 'maintain tone',
        trendAdjustment: 'boost hashtags',
        platformStrategy: 'post earlier on Instagram, increase frequency on LinkedIn, and pause Facebook',
      };

      mockLearningService.generateLearningProfile.mockResolvedValue(mockLearningProfile);

      const result = await socialAgent.execute({
        task: 'schedule_post',
        context: {
          content: 'Multi-adjustment test',
          datetime: '2024-01-15T14:00:00.000Z',
          platform: 'instagram',
          campaignId: 'campaign-multi'
        }
      });

      expect(result.success).toBe(true);
      expect(result.data.scheduled).toBe(true);
      expect(result.data.timingAdjusted).toBe(true);
      expect(result.data.datetime).toBe('2024-01-15T12:00:00.000Z'); // Earlier
      expect(result.data.platformAdjustments).toContain('Moved post 2 hours earlier on instagram');
    });

    it('should prioritize timing optimization over other adjustments for low scores', async () => {
      const mockLearningProfile = {
        score: 25, // Very low score
        toneAdjustment: 'completely revise tone',
        trendAdjustment: 'focus on high-impact trends only',
        platformStrategy: 'optimize all posting times for better engagement',
      };

      mockLearningService.generateLearningProfile.mockResolvedValue(mockLearningProfile);

      const result = await socialAgent.execute({
        task: 'schedule_post',
        context: {
          content: 'Low performance campaign post',
          datetime: '2024-01-15T01:00:00.000Z', // Very poor time
          platform: 'facebook',
          campaignId: 'campaign-lowscore'
        }
      });

      expect(result.success).toBe(true);
      expect(result.data.scheduled).toBe(true);
      expect(result.data.timingAdjusted).toBe(true);
      expect(result.data.datetime).toBe('2024-01-15T09:00:00.000Z'); // Optimized time
      expect(result.data.platformAdjustments).toContain('Optimized timing for low-performing campaign on facebook');
    });
  });
}); 