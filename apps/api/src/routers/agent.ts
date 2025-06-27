import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { getRegisteredAgentTypes, executeAgentCommand } from '@neon/core-agents';

// Type definitions
interface AgentMetadata {
  id: string;
  name: string;
  type: string;
  description: string;
  capabilities: string[];
  status: 'active' | 'inactive' | 'error';
  lastExecuted?: Date;
  totalExecutions: number;
  averageExecutionTime: number;
}

interface AgentHealth {
  agentId: string;
  status: 'healthy' | 'warning' | 'critical';
  uptime: number;
  successRate: number;
  errorRate: number;
  lastHealthCheck: Date;
  metrics: {
    cpuUsage: number;
    memoryUsage: number;
    responseTime: number;
  };
}

interface ExecutionLog {
  id: string;
  agentId: string;
  command: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
}

export const agentRouter = router({
  // Get all registered agent types
  getTypes: publicProcedure.query(async () => {
    try {
      const types = getRegisteredAgentTypes();
      return {
        success: true,
        data: types,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch agent types',
      };
    }
  }),

  // Get agent metadata
  getMetadata: publicProcedure
    .input(
      z.object({
        agentType: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        // Mock implementation - replace with actual metadata fetching
        const mockMetadata: AgentMetadata[] = [
          {
            id: 'content-001',
            name: 'Content Agent',
            type: 'CONTENT',
            description: 'Generates marketing content',
            capabilities: ['content-generation', 'copywriting', 'seo-optimization'],
            status: 'active',
            lastExecuted: new Date(),
            totalExecutions: 1234,
            averageExecutionTime: 2500,
          },
          {
            id: 'ad-001',
            name: 'Ad Agent',
            type: 'AD',
            description: 'Optimizes advertising campaigns',
            capabilities: ['ad-optimization', 'targeting', 'budget-management'],
            status: 'active',
            lastExecuted: new Date(),
            totalExecutions: 856,
            averageExecutionTime: 3200,
          },
        ];

        const filteredData = input.agentType
          ? mockMetadata.filter(agent => agent.type === input.agentType)
          : mockMetadata;

        return {
          success: true,
          data: filteredData,
        };
      } catch (error) {
        return {
          success: false,
          error: 'Failed to fetch agent metadata',
        };
      }
    }),

  // Get agent health status
  getHealth: publicProcedure
    .input(
      z.object({
        agentId: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        // Mock implementation
        const mockHealth: AgentHealth[] = [
          {
            agentId: 'content-001',
            status: 'healthy',
            uptime: 99.9,
            successRate: 98.5,
            errorRate: 1.5,
            lastHealthCheck: new Date(),
            metrics: {
              cpuUsage: 25.3,
              memoryUsage: 67.8,
              responseTime: 850,
            },
          },
        ];

        const filteredData = input.agentId
          ? mockHealth.filter(health => health.agentId === input.agentId)
          : mockHealth;

        return {
          success: true,
          data: filteredData,
        };
      } catch (error) {
        return {
          success: false,
          error: 'Failed to fetch agent health',
        };
      }
    }),

  // Execute agent command
  execute: publicProcedure
    .input(
      z.object({
        agentType: z.string(),
        command: z.string(),
        parameters: z.record(z.unknown()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const result = await executeAgentCommand(input.command, input.agentType, input.parameters);

        return {
          success: true,
          data: result,
        };
      } catch (error) {
        return {
          success: false,
          error: 'Failed to execute agent command',
        };
      }
    }),

  // Get execution logs
  getLogs: publicProcedure
    .input(
      z.object({
        agentId: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      try {
        // Mock implementation
        const mockLogs: ExecutionLog[] = [
          {
            id: 'exec-001',
            agentId: 'content-001',
            command: 'generate-content',
            status: 'completed',
            startTime: new Date(Date.now() - 5000),
            endTime: new Date(),
            duration: 5000,
            input: { topic: 'AI marketing', length: 500 },
            output: { content: 'Generated marketing content...' },
          },
        ];

        const filteredLogs = input.agentId
          ? mockLogs.filter(log => log.agentId === input.agentId)
          : mockLogs;

        const paginatedLogs = filteredLogs.slice(input.offset, input.offset + input.limit);

        return {
          success: true,
          data: {
            logs: paginatedLogs,
            total: filteredLogs.length,
            hasMore: input.offset + input.limit < filteredLogs.length,
          },
        };
      } catch (error) {
        return {
          success: false,
          error: 'Failed to fetch execution logs',
        };
      }
    }),

  // Agent performance metrics
  getPerformance: publicProcedure
    .input(
      z.object({
        agentType: z.string().optional(),
        timeRange: z.enum(['1h', '24h', '7d', '30d']).default('24h'),
      })
    )
    .query(async ({ input }) => {
      try {
        // Mock performance data - using input for filtering
        const mockPerformance = {
          agentType: input.agentType || 'ALL',
          timeRange: input.timeRange,
          executionCount: 150,
          successRate: 98.5,
          averageResponseTime: 2500,
          errorCount: 3,
          totalCost: 45.67,
          metrics: [
            { timestamp: new Date(Date.now() - 3600000), value: 95.2 },
            { timestamp: new Date(Date.now() - 7200000), value: 97.8 },
            { timestamp: new Date(Date.now() - 10800000), value: 98.1 },
          ],
        };

        return {
          success: true,
          data: mockPerformance,
        };
      } catch (error) {
        return {
          success: false,
          error: 'Failed to fetch performance metrics',
        };
      }
    }),
});
