import { z } from "zod";
import { router, publicProcedure } from "../trpc/trpc";
import { getScheduler } from "@neon/core-agents";
import { SCHEDULE_TEMPLATES, CRON_PATTERNS, RETRY_PRESETS, TIMEZONE_OPTIONS, AGENT_CONFIGS, ScheduleUtils } from "@neon/core-agents/src/scheduler/schedules";

// Input validation schemas
const scheduleConfigSchema = z.object({
  agentType: z.string().min(1),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  cron: z.string().min(1),
  timezone: z.string().default("UTC"),
  enabled: z.boolean().default(true),
  config: z.record(z.any()).optional(),
  retryConfig: z.object({
    maxRetries: z.number().min(0).max(10).optional(),
    retryDelay: z.number().min(1000).max(300000).optional(),
    backoffMultiplier: z.number().min(1).max(5).optional(),
    maxRetryDelay: z.number().min(1000).max(600000).optional(),
  }).optional(),
  timeout: z.number().min(10000).max(1800000).optional(), // 10 seconds to 30 minutes
  createdBy: z.string().optional(),
});

const scheduleUpdateSchema = scheduleConfigSchema.partial().extend({
  id: z.string(),
});

export const schedulerRouter = router({
  // Get all schedules with status information
  getSchedules: publicProcedure.query(async () => {
    try {
      const scheduler = getScheduler();
      const schedules = await scheduler.getSchedules();
      
      return {
        success: true,
        data: schedules,
        metadata: {
          timestamp: new Date().toISOString(),
          count: schedules.length,
        },
      };
    } catch (error) {
      console.error('Failed to get schedules:', error);
      return {
        success: false,
        error: 'Failed to retrieve schedules',
        data: [],
        metadata: { timestamp: new Date().toISOString(), count: 0 },
      };
    }
  }),

  // Get a specific schedule by ID
  getSchedule: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      try {
        const scheduler = getScheduler();
        const schedules = await scheduler.getSchedules();
        const schedule = schedules.find(s => s.id === input.id);
        
        if (!schedule) {
          return {
            success: false,
            error: 'Schedule not found',
            data: null,
          };
        }

        return {
          success: true,
          data: schedule,
          metadata: {
            timestamp: new Date().toISOString(),
          },
        };
      } catch (error) {
        console.error('Failed to get schedule:', error);
        return {
          success: false,
          error: 'Failed to retrieve schedule',
          data: null,
        };
      }
    }),

  // Create a new schedule
  createSchedule: publicProcedure
    .input(scheduleConfigSchema)
    .mutation(async ({ input }) => {
      try {
        const scheduler = getScheduler();
        
        // Validate cron expression
        if (!ScheduleUtils.validateCron(input.cron)) {
          return {
            success: false,
            error: 'Invalid cron expression',
            data: null,
          };
        }

        // Validate agent type
        if (!AGENT_CONFIGS[input.agentType as keyof typeof AGENT_CONFIGS]) {
          return {
            success: false,
            error: `Unknown agent type: ${input.agentType}`,
            data: null,
          };
        }

        const scheduleId = await scheduler.createSchedule(input);
        
        return {
          success: true,
          data: { id: scheduleId },
          metadata: {
            timestamp: new Date().toISOString(),
            agentType: input.agentType,
            cron: input.cron,
          },
        };
      } catch (error) {
        console.error('Failed to create schedule:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to create schedule',
          data: null,
        };
      }
    }),

  // Update an existing schedule
  updateSchedule: publicProcedure
    .input(scheduleUpdateSchema)
    .mutation(async ({ input }) => {
      try {
        const scheduler = getScheduler();
        const { id, ...updates } = input;
        
        // Validate cron expression if provided
        if (updates.cron && !ScheduleUtils.validateCron(updates.cron)) {
          return {
            success: false,
            error: 'Invalid cron expression',
            data: null,
          };
        }

        await scheduler.updateSchedule(id, updates);
        
        return {
          success: true,
          data: { id },
          metadata: {
            timestamp: new Date().toISOString(),
            updated: Object.keys(updates),
          },
        };
      } catch (error) {
        console.error('Failed to update schedule:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to update schedule',
          data: null,
        };
      }
    }),

  // Delete a schedule
  deleteSchedule: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const scheduler = getScheduler();
        await scheduler.deleteSchedule(input.id);
        
        return {
          success: true,
          data: { id: input.id },
          metadata: {
            timestamp: new Date().toISOString(),
          },
        };
      } catch (error) {
        console.error('Failed to delete schedule:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to delete schedule',
          data: null,
        };
      }
    }),

  // Enable or disable a schedule
  toggleSchedule: publicProcedure
    .input(z.object({ 
      id: z.string(),
      enabled: z.boolean(),
    }))
    .mutation(async ({ input }) => {
      try {
        const scheduler = getScheduler();
        await scheduler.toggleSchedule(input.id, input.enabled);
        
        return {
          success: true,
          data: { 
            id: input.id, 
            enabled: input.enabled,
          },
          metadata: {
            timestamp: new Date().toISOString(),
            action: input.enabled ? 'enabled' : 'disabled',
          },
        };
      } catch (error) {
        console.error('Failed to toggle schedule:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to toggle schedule',
          data: null,
        };
      }
    }),

  // Manually trigger a schedule execution
  triggerSchedule: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const scheduler = getScheduler();
        const result = await scheduler.triggerSchedule(input.id);
        
        return {
          success: true,
          data: result,
          metadata: {
            timestamp: new Date().toISOString(),
            scheduleId: input.id,
            triggered: true,
          },
        };
      } catch (error) {
        console.error('Failed to trigger schedule:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to trigger schedule',
          data: null,
        };
      }
    }),

  // Get execution history for a schedule
  getExecutionHistory: publicProcedure
    .input(z.object({ 
      scheduleId: z.string(),
      limit: z.number().min(1).max(100).default(50),
    }))
    .query(async ({ input }) => {
      try {
        const scheduler = getScheduler();
        const executions = await scheduler.getExecutionHistory(input.scheduleId, input.limit);
        
        return {
          success: true,
          data: executions,
          metadata: {
            timestamp: new Date().toISOString(),
            scheduleId: input.scheduleId,
            count: executions.length,
          },
        };
      } catch (error) {
        console.error('Failed to get execution history:', error);
        return {
          success: false,
          error: 'Failed to retrieve execution history',
          data: [],
        };
      }
    }),

  // Get scheduler statistics
  getStatistics: publicProcedure.query(async () => {
    try {
      const scheduler = getScheduler();
      const stats = await scheduler.getStatistics();
      
      return {
        success: true,
        data: stats,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('Failed to get scheduler statistics:', error);
      return {
        success: false,
        error: 'Failed to retrieve statistics',
        data: {
          totalSchedules: 0,
          activeSchedules: 0,
          totalExecutions: 0,
          successfulExecutions: 0,
          failedExecutions: 0,
          averageSuccessRate: 0,
        },
      };
    }
  }),

  // Get available schedule templates
  getScheduleTemplates: publicProcedure
    .input(z.object({
      agentType: z.string().optional(),
      tag: z.string().optional(),
    }))
    .query(async ({ input }) => {
      try {
        let templates = SCHEDULE_TEMPLATES;
        
        if (input.agentType) {
          templates = ScheduleUtils.getTemplatesByAgent(input.agentType);
        } else if (input.tag) {
          templates = ScheduleUtils.getTemplatesByTag(input.tag);
        }
        
        return {
          success: true,
          data: templates,
          metadata: {
            timestamp: new Date().toISOString(),
            count: templates.length,
            filter: input.agentType ? `agentType:${input.agentType}` : input.tag ? `tag:${input.tag}` : 'none',
          },
        };
      } catch (error) {
        console.error('Failed to get schedule templates:', error);
        return {
          success: false,
          error: 'Failed to retrieve templates',
          data: [],
        };
      }
    }),

  // Create schedule from template
  createFromTemplate: publicProcedure
    .input(z.object({
      templateId: z.string(),
      overrides: z.object({
        name: z.string().optional(),
        description: z.string().optional(),
        cron: z.string().optional(),
        timezone: z.string().optional(),
        enabled: z.boolean().optional(),
        config: z.record(z.any()).optional(),
        createdBy: z.string().optional(),
      }).optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const config = ScheduleUtils.createFromTemplate(input.templateId, input.overrides);
        const scheduler = getScheduler();
        const scheduleId = await scheduler.createSchedule(config);
        
        return {
          success: true,
          data: { 
            id: scheduleId,
            templateId: input.templateId,
          },
          metadata: {
            timestamp: new Date().toISOString(),
            agentType: config.agentType,
          },
        };
      } catch (error) {
        console.error('Failed to create schedule from template:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to create schedule from template',
          data: null,
        };
      }
    }),

  // Get cron patterns
  getCronPatterns: publicProcedure.query(() => {
    return {
      success: true,
      data: CRON_PATTERNS,
      metadata: {
        timestamp: new Date().toISOString(),
        count: CRON_PATTERNS.length,
      },
    };
  }),

  // Get retry presets
  getRetryPresets: publicProcedure.query(() => {
    return {
      success: true,
      data: RETRY_PRESETS,
      metadata: {
        timestamp: new Date().toISOString(),
        count: Object.keys(RETRY_PRESETS).length,
      },
    };
  }),

  // Get timezone options
  getTimezoneOptions: publicProcedure.query(() => {
    return {
      success: true,
      data: TIMEZONE_OPTIONS,
      metadata: {
        timestamp: new Date().toISOString(),
        count: TIMEZONE_OPTIONS.length,
      },
    };
  }),

  // Get agent configurations
  getAgentConfigs: publicProcedure.query(() => {
    return {
      success: true,
      data: AGENT_CONFIGS,
      metadata: {
        timestamp: new Date().toISOString(),
        count: Object.keys(AGENT_CONFIGS).length,
      },
    };
  }),

  // Validate cron expression
  validateCron: publicProcedure
    .input(z.object({ 
      cron: z.string(),
      timezone: z.string().default("UTC"),
    }))
    .query(({ input }) => {
      try {
        const isValid = ScheduleUtils.validateCron(input.cron);
        const description = ScheduleUtils.describeCron(input.cron);
        const nextExecutions = isValid ? ScheduleUtils.getNextExecutions(input.cron, 5, input.timezone) : [];
        
        return {
          success: true,
          data: {
            isValid,
            description,
            nextExecutions,
            expression: input.cron,
            timezone: input.timezone,
          },
          metadata: {
            timestamp: new Date().toISOString(),
          },
        };
      } catch (error) {
        return {
          success: false,
          error: 'Failed to validate cron expression',
          data: {
            isValid: false,
            description: 'Invalid expression',
            nextExecutions: [],
            expression: input.cron,
            timezone: input.timezone,
          },
        };
      }
    }),

  // Get recommended schedules for an agent type
  getRecommendedSchedules: publicProcedure
    .input(z.object({ agentType: z.string() }))
    .query(({ input }) => {
      try {
        const recommendations = ScheduleUtils.getRecommendedSchedules(input.agentType);
        
        return {
          success: true,
          data: recommendations,
          metadata: {
            timestamp: new Date().toISOString(),
            agentType: input.agentType,
            count: recommendations.length,
          },
        };
      } catch (error) {
        return {
          success: false,
          error: 'Failed to get recommendations',
          data: [],
        };
      }
    }),

  // Initialize scheduler (for system startup)
  initializeScheduler: publicProcedure.mutation(async () => {
    try {
      const scheduler = getScheduler();
      await scheduler.initialize();
      
      return {
        success: true,
        data: { initialized: true },
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('Failed to initialize scheduler:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to initialize scheduler',
        data: { initialized: false },
      };
    }
  }),

  // Health check for scheduler
  healthCheck: publicProcedure.query(async () => {
    try {
      const scheduler = getScheduler();
      const stats = await scheduler.getStatistics();
      
      return {
        success: true,
        data: {
          status: 'healthy',
          uptime: process.uptime(),
          ...stats,
        },
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: 'Scheduler health check failed',
        data: {
          status: 'unhealthy',
          uptime: process.uptime(),
        },
      };
    }
  }),
}); 