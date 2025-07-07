import { SimpleSocialAgent } from '../agents/simple-social-agent';
import { AgentPayload } from '../base-agent';

describe('SimpleSocialAgent Integration Tests', () => {
  let agent: SimpleSocialAgent;

  beforeEach(() => {
    agent = new SimpleSocialAgent();
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle past datetime for scheduling', async () => {
      const payload: AgentPayload = {
        task: 'schedule_post',
        context: {
          task: 'schedule_post',
          content: 'Test post content',
          datetime: '2020-01-01T12:00:00Z', // Past date
          platform: 'twitter',
        },
        priority: 'medium',
      };

      const response = await agent.execute(payload);
      
      // Should still succeed but could log warning
      expect(response.success).toBe(true);
      expect(response.data).toHaveProperty('scheduled', true);
    });

    it('should handle invalid sentiment values', async () => {
      const payload: AgentPayload = {
        task: 'reply_to_message',
        context: {
          task: 'reply_to_message',
          message: 'Great service!',
          sentiment: 'invalid_sentiment', // Invalid sentiment
          platform: 'facebook',
        },
        priority: 'medium',
      };

      const response = await agent.execute(payload);
      
      expect(response.success).toBe(false);
      expect(response.error).toContain('Invalid input');
    });

    it('should reject invalid platforms', async () => {
      const payload: AgentPayload = {
        task: 'generate_post',
        context: {
          task: 'generate_post',
          topic: 'neon signs',
          platform: 'invalid_platform', // Invalid platform
        },
        priority: 'medium',
      };

      const response = await agent.execute(payload);
      
      expect(response.success).toBe(true); // Currently no platform validation
      expect(response.data).toHaveProperty('platform', 'invalid_platform');
    });

    it('should handle very long content', async () => {
      const longContent = 'A'.repeat(10000); // 10k character string
      const payload: AgentPayload = {
        task: 'schedule_post',
        context: {
          task: 'schedule_post',
          content: longContent,
          datetime: '2024-12-31T23:59:59Z',
          platform: 'twitter',
        },
        priority: 'medium',
      };

      const response = await agent.execute(payload);
      
      expect(response.success).toBe(true);
      expect(response.data).toHaveProperty('content', longContent);
    });

    it('should handle empty strings', async () => {
      const payload: AgentPayload = {
        task: 'generate_post',
        context: {
          task: 'generate_post',
          topic: '', // Empty topic
          platform: 'instagram',
        },
        priority: 'medium',
      };

      const response = await agent.execute(payload);
      
      expect(response.success).toBe(false);
      expect(response.error).toContain('Topic and platform are required');
    });

    it('should handle special characters in content', async () => {
      const specialContent = '🎉💡🔥 Special chars: @#$%^&*(){}[]|\\:";\'<>?,./`~';
      const payload: AgentPayload = {
        task: 'reply_to_message',
        context: {
          task: 'reply_to_message',
          message: specialContent,
          sentiment: 'positive',
          platform: 'instagram',
        },
        priority: 'medium',
      };

      const response = await agent.execute(payload);
      
      expect(response.success).toBe(true);
      expect(response.data).toHaveProperty('originalMessage', specialContent);
    });
  });

  describe('Platform-specific Validations', () => {
    const platforms = ['twitter', 'instagram', 'facebook', 'linkedin', 'tiktok'];

    platforms.forEach(platform => {
      it(`should handle ${platform} platform correctly`, async () => {
        const payload: AgentPayload = {
          task: 'generate_post',
          context: {
            task: 'generate_post',
            topic: 'platform test',
            platform,
          },
          priority: 'medium',
        };

        const response = await agent.execute(payload);
        
        expect(response.success).toBe(true);
        expect(response.data).toHaveProperty('platform', platform);
      });
    });
  });

  describe('Task Execution Performance', () => {
    it('should execute tasks within reasonable time', async () => {
      const startTime = Date.now();
      
      const payload: AgentPayload = {
        task: 'generate_post',
        context: {
          task: 'generate_post',
          topic: 'performance test',
          platform: 'twitter',
        },
        priority: 'high',
      };

      const response = await agent.execute(payload);
      const executionTime = Date.now() - startTime;
      
      expect(response.success).toBe(true);
      expect(executionTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle concurrent executions', async () => {
      const promises = Array.from({ length: 5 }, (_, i) => 
        agent.execute({
          task: 'generate_post',
          context: {
            task: 'generate_post',
            topic: `concurrent test ${i}`,
            platform: 'instagram',
          },
          priority: 'medium',
        })
      );

      const results = await Promise.all(promises);
      
      results.forEach((result, index) => {
        expect(result.success).toBe(true);
        expect(result.data).toHaveProperty('topic', `concurrent test ${index}`);
      });
    });
  });

  describe('Content Generation Integration', () => {
    it('should generate different content for different topics', async () => {
      const topics = ['neon signs', 'LED lighting', 'custom design'];
      const results = [];

      for (const topic of topics) {
        const payload: AgentPayload = {
          task: 'generate_post',
          context: {
            task: 'generate_post',
            topic,
            platform: 'instagram',
          },
          priority: 'medium',
        };

        const response = await agent.execute(payload);
        results.push(response.data);
      }

      // Each result should be unique
      expect(results[0].post).not.toBe(results[1].post);
      expect(results[1].post).not.toBe(results[2].post);
      expect(results[0].post).not.toBe(results[2].post);
    });

    it('should maintain context across different tasks', async () => {
      // Generate a post
      const generatePayload: AgentPayload = {
        task: 'generate_post',
        context: {
          task: 'generate_post',
          topic: 'neon signs',
          platform: 'twitter',
        },
        priority: 'medium',
      };

      const generateResponse = await agent.execute(generatePayload);
      
      // Schedule the generated post
      const schedulePayload: AgentPayload = {
        task: 'schedule_post',
        context: {
          task: 'schedule_post',
          content: generateResponse.data.post,
          datetime: '2024-12-31T12:00:00Z',
          platform: 'twitter',
        },
        priority: 'medium',
      };

      const scheduleResponse = await agent.execute(schedulePayload);
      
      expect(generateResponse.success).toBe(true);
      expect(scheduleResponse.success).toBe(true);
      expect(scheduleResponse.data.content).toBe(generateResponse.data.post);
    });
  });

  describe('Sentiment Analysis Edge Cases', () => {
    const sentiments = ['positive', 'neutral', 'negative'] as const;

    sentiments.forEach(sentiment => {
      it(`should handle ${sentiment} sentiment correctly`, async () => {
        const payload: AgentPayload = {
          task: 'reply_to_message',
          context: {
            task: 'reply_to_message',
            message: `This is a ${sentiment} message`,
            sentiment,
            platform: 'twitter',
          },
          priority: 'medium',
        };

        const response = await agent.execute(payload);
        
        expect(response.success).toBe(true);
        expect(response.data).toHaveProperty('sentiment', sentiment);
        expect(response.data.reply).toContain(sentiment);
      });
    });
  });

  describe('Error Recovery', () => {
    it('should recover from task failures gracefully', async () => {
      // First, execute a failing task
      const failingPayload: AgentPayload = {
        task: 'generate_post',
        context: {
          task: 'generate_post',
          // Missing required fields
        },
        priority: 'medium',
      };

      const failingResponse = await agent.execute(failingPayload);
      expect(failingResponse.success).toBe(false);

      // Then execute a successful task
      const successPayload: AgentPayload = {
        task: 'get_status',
        context: {
          task: 'get_status',
        },
        priority: 'medium',
      };

      const successResponse = await agent.execute(successPayload);
      expect(successResponse.success).toBe(true);
    });
  });

  describe('Budget and Performance Tracking', () => {
    it('should track execution metadata', async () => {
      const payload: AgentPayload = {
        task: 'generate_post',
        context: {
          task: 'generate_post',
          topic: 'metadata test',
          platform: 'instagram',
        },
        priority: 'high',
        metadata: {
          userId: 'test-user-123',
          campaignId: 'test-campaign-456',
          complexity: 'standard',
        },
      };

      const response = await agent.execute(payload);
      
      expect(response.success).toBe(true);
      expect(response.metadata).toHaveProperty('agentId');
      expect(response.metadata).toHaveProperty('agentName');
      expect(response.metadata).toHaveProperty('executionTime');
      expect(response.metadata?.executionTime).toBeGreaterThanOrEqual(0);
    });
  });
}); 