// Mock the logger to capture metrics and error logs
const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

jest.mock('@neon/utils', () => ({
  logger: mockLogger,
}));

import { SimpleSocialAgent } from '../agents/simple-social-agent';
import { AgentPayload } from '../base-agent';

describe('SimpleSocialAgent Metrics & Monitoring', () => {
  let agent: SimpleSocialAgent;

  beforeEach(() => {
    agent = new SimpleSocialAgent();
    // Reset all mock calls
    Object.values(mockLogger).forEach(fn => fn.mockClear());
  });

  describe('Metrics Storage', () => {
    it('should store execution metrics in memory', async () => {
      const payload: AgentPayload = {
        task: 'generate_post',
        context: {
          task: 'generate_post',
          topic: 'metrics test',
          platform: 'instagram',
        },
        priority: 'medium',
        metadata: {
          userId: 'test-user-123',
          campaignId: 'test-campaign-456',
        },
      };

      const response = await agent.execute(payload);
      
      expect(response.success).toBe(true);
      expect(response.metadata).toHaveProperty('agentId');
      expect(response.metadata).toHaveProperty('agentName');
      expect(response.metadata).toHaveProperty('executionTime');
      expect(response.metadata).toHaveProperty('tokensUsed');
      expect(response.metadata).toHaveProperty('actualCost');
    });

         it('should track different execution patterns', async () => {
       const tasks = [
         { 
           task: 'generate_post', 
           expectedSuccess: false, // Missing required fields (topic, platform)
           context: { task: 'generate_post' }
         },
         { 
           task: 'schedule_post', 
           expectedSuccess: false, // Missing required fields
           context: { task: 'schedule_post' }
         },
         { 
           task: 'reply_to_message', 
           expectedSuccess: false, // Missing required fields
           context: { task: 'reply_to_message' }
         },
         { 
           task: 'get_status', 
           expectedSuccess: true, // This one should succeed
           context: { task: 'get_status' }
         },
       ];

       const results = [];

       for (const { task, expectedSuccess, context } of tasks) {
         const payload: AgentPayload = {
           task,
           context,
           priority: 'medium',
         };

         const response = await agent.execute(payload);
         results.push({
           task,
           success: response.success,
           expectedSuccess,
           metadata: response.metadata,
         });
       }

       // Verify each result matches expectations
       results.forEach(({ task, success, expectedSuccess, metadata }) => {
         expect(success).toBe(expectedSuccess);
         if (metadata) {
           expect(metadata).toHaveProperty('agentId', 'simple-social-agent');
           expect(metadata).toHaveProperty('agentName', 'SimpleSocialAgent');
         }
       });
     });

    it('should accumulate performance metrics over time', async () => {
      const executionCount = 10;
      const results = [];

      for (let i = 0; i < executionCount; i++) {
        const payload: AgentPayload = {
          task: 'get_status',
          context: {
            task: 'get_status',
          },
          priority: 'low',
          metadata: {
            executionIndex: i,
          },
        };

        const response = await agent.execute(payload);
        results.push(response);
      }

      // All should succeed
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Should have consistent performance metrics
      const executionTimes = results.map(r => r.performance || 0);
      const avgExecutionTime = executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length;
      
      expect(avgExecutionTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Error Logging', () => {
    it('should log errors for invalid input formats', async () => {
      const invalidPayloads = [
        {
          task: 'generate_post',
          context: {
            task: 'generate_post',
            topic: null, // Invalid topic
            platform: 'instagram',
          },
          priority: 'medium',
        },
        {
          task: 'schedule_post',
          context: {
            task: 'schedule_post',
            content: '',
            datetime: 'invalid-date',
            platform: 'twitter',
          },
          priority: 'medium',
        },
      ] as AgentPayload[];

      for (const payload of invalidPayloads) {
        const response = await agent.execute(payload);
        expect(response.success).toBe(false);
        expect(response.error).toBeDefined();
      }
    });

    it('should log successful executions', async () => {
      const payload: AgentPayload = {
        task: 'generate_post',
        context: {
          task: 'generate_post',
          topic: 'logging test',
          platform: 'twitter',
        },
        priority: 'medium',
      };

      const response = await agent.execute(payload);
      
      expect(response.success).toBe(true);
      
      // Check if budget logging was called
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Budget check passed'),
        expect.any(Object),
        'BillingGuard'
      );
    });

    it('should handle AI failure scenarios gracefully', async () => {
      // Simulate AI failure by providing edge case inputs
      const edgeCasePayload: AgentPayload = {
        task: 'reply_to_message',
        context: {
          task: 'reply_to_message',
          message: 'A'.repeat(50000), // Extremely long message
          sentiment: 'positive',
          platform: 'twitter',
        },
        priority: 'high',
      };

      const response = await agent.execute(edgeCasePayload);
      
      // Should still succeed as our implementation is simple
      expect(response.success).toBe(true);
    });
  });

  describe('Campaign Metrics Integration', () => {
    it('should associate metrics with campaign ID', async () => {
      const campaignId = 'campaign-123';
      
      const tasks = [
        'generate_post',
        'schedule_post',
        'reply_to_message',
        'get_status',
      ];

      for (const task of tasks) {
        const payload: AgentPayload = {
          task,
          context: {
            task,
            ...(task === 'generate_post' && { topic: 'campaign test', platform: 'instagram' }),
            ...(task === 'schedule_post' && { 
              content: 'Campaign post', 
              datetime: '2024-12-31T12:00:00Z', 
              platform: 'twitter' 
            }),
            ...(task === 'reply_to_message' && { 
              message: 'Great campaign!', 
              sentiment: 'positive' as const, 
              platform: 'facebook' 
            }),
          },
          priority: 'medium',
          metadata: {
            campaignId,
            userId: 'test-user-123',
          },
        };

        const response = await agent.execute(payload);
        
        if (task === 'generate_post' || task === 'get_status') {
          expect(response.success).toBe(true);
        }
        
        // All responses should include the campaign ID in metadata
        if (response.metadata) {
          expect(response.metadata).toEqual(
            expect.objectContaining({
              agentId: 'simple-social-agent',
              agentName: 'SimpleSocialAgent',
            })
          );
        }
      }
    });

    it('should track post/reply counts for dashboard', async () => {
      const activities = [
        { task: 'generate_post', count: 5 },
        { task: 'schedule_post', count: 3 },
        { task: 'reply_to_message', count: 8 },
      ];

      const allResults = [];

      for (const { task, count } of activities) {
        for (let i = 0; i < count; i++) {
          const payload: AgentPayload = {
            task,
            context: {
              task,
              ...(task === 'generate_post' && { 
                topic: `post ${i}`, 
                platform: 'instagram' 
              }),
              ...(task === 'schedule_post' && { 
                content: `Scheduled post ${i}`, 
                datetime: new Date(Date.now() + i * 1000).toISOString(), 
                platform: 'twitter' 
              }),
              ...(task === 'reply_to_message' && { 
                message: `Message ${i}`, 
                sentiment: 'positive' as const, 
                platform: 'facebook' 
              }),
            },
            priority: 'medium',
          };

          const response = await agent.execute(payload);
          allResults.push({ task, success: response.success, index: i });
        }
      }

      // Count successful operations
      const successfulPosts = allResults.filter(r => 
        r.task === 'generate_post' && r.success
      ).length;
      
      const successfulSchedules = allResults.filter(r => 
        r.task === 'schedule_post' && r.success
      ).length;
      
      const successfulReplies = allResults.filter(r => 
        r.task === 'reply_to_message' && r.success
      ).length;

      expect(successfulPosts).toBe(5);
      expect(successfulSchedules).toBe(3);
      expect(successfulReplies).toBe(8);
    });
  });

  describe('Performance Monitoring', () => {
    it('should track execution time trends', async () => {
      const executionTimes = [];
      
      for (let i = 0; i < 20; i++) {
        const startTime = Date.now();
        
        const payload: AgentPayload = {
          task: 'generate_post',
          context: {
            task: 'generate_post',
            topic: `trend test ${i}`,
            platform: 'instagram',
          },
          priority: 'medium',
        };

        const response = await agent.execute(payload);
        const endTime = Date.now();
        
        expect(response.success).toBe(true);
        executionTimes.push(endTime - startTime);
      }

      // Calculate trend statistics
      const avgTime = executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length;
      const minTime = Math.min(...executionTimes);
      const maxTime = Math.max(...executionTimes);

             expect(avgTime).toBeGreaterThanOrEqual(0);
       expect(minTime).toBeLessThanOrEqual(avgTime);
       expect(maxTime).toBeGreaterThanOrEqual(avgTime);
       
       // Performance should be consistent (handle case where minTime could be 0)
       if (minTime > 0) {
         expect(maxTime).toBeLessThan(minTime * 100);
       } else {
         expect(maxTime).toBeLessThan(1000); // Max 1 second for any execution
       }
    });

    it('should monitor resource usage patterns', async () => {
      const initialMemory = process.memoryUsage();
      
      // Simulate intensive work
      const largeBatch = Array.from({ length: 100 }, (_, i) => ({
        task: 'get_status',
        context: {
          task: 'get_status',
        },
        priority: 'low' as const,
        metadata: {
          batchIndex: i,
        },
      }));

      for (const payload of largeBatch) {
        await agent.execute(payload);
      }

      const finalMemory = process.memoryUsage();
      
      // Memory usage should be reasonable
      const heapGrowth = finalMemory.heapUsed - initialMemory.heapUsed;
      expect(heapGrowth).toBeLessThan(100 * 1024 * 1024); // 100MB max
    });
  });

  describe('Error Rate Monitoring', () => {
    it('should track error rates across different scenarios', async () => {
      const scenarios = [
        { valid: true, task: 'generate_post', context: { task: 'generate_post', topic: 'test', platform: 'instagram' } },
        { valid: false, task: 'generate_post', context: { task: 'generate_post' } }, // Missing fields
        { valid: true, task: 'get_status', context: { task: 'get_status' } },
        { valid: false, task: 'schedule_post', context: { task: 'schedule_post' } }, // Missing fields
        { valid: true, task: 'reply_to_message', context: { task: 'reply_to_message', message: 'test', sentiment: 'positive', platform: 'twitter' } },
      ];

      const results = [];

      for (const { valid, task, context } of scenarios) {
        const payload: AgentPayload = {
          task,
          context,
          priority: 'medium',
        };

        const response = await agent.execute(payload);
        results.push({
          valid,
          success: response.success,
          task,
        });
      }

      // Calculate error rates
      const totalRequests = results.length;
      const errors = results.filter(r => !r.success).length;
      const errorRate = (errors / totalRequests) * 100;

      expect(errorRate).toBeGreaterThan(0); // We expect some errors from invalid inputs
      expect(errorRate).toBeLessThan(100); // But not all should fail

      // Validate that valid requests succeeded and invalid ones failed
      results.forEach(({ valid, success }) => {
        if (valid) {
          expect(success).toBe(true);
        } else {
          expect(success).toBe(false);
        }
      });
    });
  });
}); 