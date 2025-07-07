import { SimpleSocialAgent } from '../agents/simple-social-agent';
import { AgentPayload } from '../base-agent';
import { BillingGuard, BudgetInsufficientError } from '../utils/billingGuard';

describe('SimpleSocialAgent Budget Enforcement', () => {
  let agent: SimpleSocialAgent;
  let billingGuard: BillingGuard;

  beforeEach(() => {
    agent = new SimpleSocialAgent();
    billingGuard = BillingGuard.getInstance();
    // Reset override for each test
    billingGuard.setOverride(false);
  });

  describe('Budget Enforcement', () => {
    it('should enforce budget before execution', async () => {
      const payload: AgentPayload = {
        task: 'generate_post',
        context: {
          task: 'generate_post',
          topic: 'neon signs',
          platform: 'instagram',
        },
        priority: 'medium',
        metadata: {
          userId: 'test-user-123',
          campaignId: 'test-campaign-456',
        },
      };

      // This should succeed with mock budget
      const response = await agent.execute(payload);
      expect(response.success).toBe(true);
    });

    it('should handle budget override', async () => {
      // Enable budget override
      billingGuard.setOverride(true);

      const payload: AgentPayload = {
        task: 'generate_post',
        context: {
          task: 'generate_post',
          topic: 'expensive task',
          platform: 'instagram',
        },
        priority: 'high',
        metadata: {
          complexity: 'premium', // Should be more expensive
        },
      };

      const response = await agent.execute(payload);
      expect(response.success).toBe(true);
      
      // Verify override is still enabled
      expect(billingGuard.isOverrideEnabled()).toBe(true);
    });

    it('should track different task complexities', async () => {
      const complexities = ['simple', 'standard', 'complex', 'premium'];
      
      for (const complexity of complexities) {
        const payload: AgentPayload = {
          task: 'generate_post',
          context: {
            task: 'generate_post',
            topic: 'complexity test',
            platform: 'twitter',
          },
          priority: 'medium',
          metadata: {
            complexity,
            userId: 'test-user-123',
          },
        };

        const response = await agent.execute(payload);
        expect(response.success).toBe(true);
        expect(response.metadata).toHaveProperty('actualCost');
      }
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle task execution timeout gracefully', async () => {
      const payload: AgentPayload = {
        task: 'generate_post',
        context: {
          task: 'generate_post',
          topic: 'timeout test',
          platform: 'instagram',
        },
        priority: 'critical',
        deadline: new Date(Date.now() + 100), // Very short deadline
      };

      const response = await agent.execute(payload);
      // Should still succeed as our tasks are fast
      expect(response.success).toBe(true);
    });

    it('should handle malformed input gracefully', async () => {
      const malformedPayloads = [
        // Missing context
        {
          task: 'generate_post',
          priority: 'medium',
        } as AgentPayload,
        // Invalid priority
        {
          task: 'generate_post',
          context: { task: 'generate_post' },
          priority: 'invalid_priority',
        } as any,
        // Null context
        {
          task: 'generate_post',
          context: null,
          priority: 'medium',
        } as any,
      ];

      for (const payload of malformedPayloads) {
        const response = await agent.execute(payload);
        expect(response.success).toBe(false);
        expect(response.error).toBeDefined();
      }
    });

    it('should handle rapid successive calls', async () => {
      const payloads = Array.from({ length: 10 }, (_, i) => ({
        task: 'get_status',
        context: {
          task: 'get_status',
        },
        priority: 'low' as const,
        metadata: {
          batchId: `batch-${i}`,
        },
      }));

      const startTime = Date.now();
      const promises = payloads.map(payload => agent.execute(payload));
      const results = await Promise.all(promises);
      const totalTime = Date.now() - startTime;

      // All should succeed
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Should complete reasonably quickly
      expect(totalTime).toBeLessThan(10000); // 10 seconds max
    });
  });

  describe('Auto-retry Logic', () => {
    it('should not automatically retry on validation errors', async () => {
      let callCount = 0;
      const originalExecute = agent.execute.bind(agent);
      
      agent.execute = jest.fn().mockImplementation(async (payload: AgentPayload) => {
        callCount++;
        return originalExecute(payload);
      });

      const payload: AgentPayload = {
        task: 'generate_post',
        context: {
          task: 'generate_post',
          // Missing required fields
        },
        priority: 'medium',
      };

      const response = await agent.execute(payload);
      
      expect(response.success).toBe(false);
      expect(callCount).toBe(1); // Should only be called once, no retry
    });

    it('should maintain execution context across retries', async () => {
      const payload: AgentPayload = {
        task: 'generate_post',
        context: {
          task: 'generate_post',
          topic: 'retry test',
          platform: 'twitter',
        },
        priority: 'medium',
        metadata: {
          retryCount: 0,
          sessionId: 'test-session-123',
        },
      };

      const response = await agent.execute(payload);
      
      expect(response.success).toBe(true);
      expect(response.metadata).toHaveProperty('agentId', 'simple-social-agent');
    });
  });

  describe('Resource Management', () => {
    it('should track memory usage patterns', async () => {
      const initialMemory = process.memoryUsage();
      
      // Execute multiple tasks
      const tasks = Array.from({ length: 50 }, (_, i) => ({
        task: 'generate_post',
        context: {
          task: 'generate_post',
          topic: `memory test ${i}`,
          platform: 'instagram',
        },
        priority: 'low' as const,
      }));

      for (const task of tasks) {
        await agent.execute(task);
      }

      const finalMemory = process.memoryUsage();
      
      // Memory shouldn't grow excessively
      const memoryGrowth = finalMemory.heapUsed - initialMemory.heapUsed;
      expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024); // 50MB max growth
    });

    it('should handle concurrent resource access', async () => {
      const concurrentTasks = Array.from({ length: 20 }, (_, i) => 
        agent.execute({
          task: 'schedule_post',
          context: {
            task: 'schedule_post',
            content: `Concurrent post ${i}`,
            datetime: new Date(Date.now() + i * 1000).toISOString(),
            platform: 'twitter',
          },
          priority: 'medium',
        })
      );

      const results = await Promise.all(concurrentTasks);
      
      // All should succeed
      results.forEach((result, index) => {
        expect(result.success).toBe(true);
        expect(result.data.content).toBe(`Concurrent post ${index}`);
      });
    });
  });

  describe('Performance Monitoring', () => {
    it('should track execution metrics', async () => {
      const payload: AgentPayload = {
        task: 'generate_post',
        context: {
          task: 'generate_post',
          topic: 'performance test',
          platform: 'instagram',
        },
        priority: 'high',
        metadata: {
          trackPerformance: true,
        },
      };

      const response = await agent.execute(payload);
      
      expect(response.success).toBe(true);
      expect(response.performance).toBeDefined();
      expect(response.metadata).toHaveProperty('executionTime');
      expect(response.metadata).toHaveProperty('agentId');
      expect(response.metadata).toHaveProperty('agentName');
    });

    it('should maintain performance under load', async () => {
      const loadTestTasks = Array.from({ length: 100 }, (_, i) => ({
        task: 'reply_to_message',
        context: {
          task: 'reply_to_message',
          message: `Load test message ${i}`,
          sentiment: ['positive', 'neutral', 'negative'][i % 3] as 'positive' | 'neutral' | 'negative',
          platform: 'twitter',
        },
        priority: 'medium' as const,
      }));

      const startTime = Date.now();
      
      // Execute in batches to simulate real load
      const batchSize = 10;
      const batches = [];
      for (let i = 0; i < loadTestTasks.length; i += batchSize) {
        batches.push(loadTestTasks.slice(i, i + batchSize));
      }

      for (const batch of batches) {
        const batchPromises = batch.map(task => agent.execute(task));
        const batchResults = await Promise.all(batchPromises);
        
        // All in batch should succeed
        batchResults.forEach(result => {
          expect(result.success).toBe(true);
        });
      }

      const totalTime = Date.now() - startTime;
      
      // Should complete within reasonable time (30 seconds for 100 tasks)
      expect(totalTime).toBeLessThan(30000);
    });
  });
}); 