/**
 * Campaign Runner - Core Engine for Campaign Execution
 */

import { logger, withLogging } from '@neon/utils';
import { CampaignAgent, type CampaignExecution, type CampaignPlan } from '../agents/campaign-agent';
import { getCampaignTemplate } from './campaign-templates';
import { AgentMemoryStore } from '../memory/AgentMemoryStore';

export interface CampaignRunnerConfig {
  maxConcurrentCampaigns: number;
  retryAttempts: number;
  retryDelay: number;
  monitoringInterval: number;
}

export interface CampaignSchedule {
  id: string;
  campaignId: string;
  scheduledTime: Date;
  status: 'scheduled' | 'running' | 'completed' | 'failed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  recurring?: {
    interval: 'daily' | 'weekly' | 'monthly';
    endDate?: Date;
  };
}

export interface CampaignValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  recommendations: string[];
}

export class CampaignRunner {
  private campaignAgent: CampaignAgent;
  private memoryStore: AgentMemoryStore;
  private config: CampaignRunnerConfig;
  private runningCampaigns: Map<string, CampaignExecution> = new Map();
  private scheduledCampaigns: Map<string, CampaignSchedule> = new Map();
  private monitoringTimer?: NodeJS.Timeout;

  constructor(config: Partial<CampaignRunnerConfig> = {}) {
    this.config = {
      maxConcurrentCampaigns: 5,
      retryAttempts: 3,
      retryDelay: 60000, // 1 minute
      monitoringInterval: 30000, // 30 seconds
      ...config,
    };

    this.campaignAgent = new CampaignAgent();
    this.memoryStore = new AgentMemoryStore();

    this.startMonitoring();
  }

  /**
   * Schedule a campaign for execution
   */
  async scheduleCampaign(
    campaignContext: any,
    scheduledTime: Date,
    options: {
      priority?: 'low' | 'medium' | 'high' | 'critical';
      recurring?: {
        interval: 'daily' | 'weekly' | 'monthly';
        endDate?: Date;
      };
    } = {}
  ): Promise<string> {
    return withLogging('campaign-runner', 'schedule_campaign', async () => {
      const scheduleId = `schedule_${Date.now()}`;

      // Validate campaign context
      const validation = await this.validateCampaign(campaignContext);
      if (!validation.isValid) {
        throw new Error(`Campaign validation failed: ${validation.errors.join(', ')}`);
      }

      const schedule: CampaignSchedule = {
        id: scheduleId,
        campaignId: `campaign_${Date.now()}`,
        scheduledTime,
        status: 'scheduled',
        priority: options.priority || 'medium',
        recurring: options.recurring,
      };

      this.scheduledCampaigns.set(scheduleId, schedule);

      logger.info('📅 Campaign scheduled', {
        scheduleId,
        scheduledTime: scheduledTime.toISOString(),
        priority: schedule.priority,
        goal: campaignContext.goal,
      });

      // Store in memory for persistence
      await this.memoryStore.storeMemory(
        'campaign-runner',
        'scheduled_campaign',
        {
          schedule,
          context: campaignContext,
        },
        {
          scheduleId,
          goal: campaignContext.goal,
          scheduledTime: scheduledTime.toISOString(),
        }
      );

      return scheduleId;
    });
  }

  /**
   * Execute a campaign immediately
   */
  async executeCampaign(campaignContext: any): Promise<CampaignExecution> {
    return withLogging('campaign-runner', 'execute_campaign', async () => {
      // Check concurrent campaign limits
      if (this.runningCampaigns.size >= this.config.maxConcurrentCampaigns) {
        throw new Error(
          `Maximum concurrent campaigns reached (${this.config.maxConcurrentCampaigns})`
        );
      }

      // Validate campaign
      const validation = await this.validateCampaign(campaignContext);
      if (!validation.isValid) {
        throw new Error(`Campaign validation failed: ${validation.errors.join(', ')}`);
      }

      logger.info('🚀 Executing campaign', {
        goal: campaignContext.goal,
        channels: campaignContext.channels,
        audience: campaignContext.targetAudience,
      });

      // Execute campaign using CampaignAgent
      const execution = (await this.campaignAgent.execute({
        task: 'execute_campaign',
        context: campaignContext,
      })) as CampaignExecution;

      // Track running campaign
      this.runningCampaigns.set(execution.id, execution);

      // Store execution in memory
      await this.memoryStore.storeMemory('campaign-runner', 'campaign_execution', execution, {
        executionId: execution.id,
        goal: campaignContext.goal,
        status: execution.status,
      });

      return execution;
    });
  }

  /**
   * Validate campaign configuration
   */
  async validateCampaign(campaignContext: any): Promise<CampaignValidation> {
    const validation: CampaignValidation = {
      isValid: true,
      errors: [],
      warnings: [],
      recommendations: [],
    };

    // Required fields validation
    if (!campaignContext.goal) {
      validation.errors.push('Campaign goal is required');
    }

    if (!campaignContext.channels || campaignContext.channels.length === 0) {
      validation.errors.push('At least one channel is required');
    }

    if (!campaignContext.targetAudience) {
      validation.errors.push('Target audience is required');
    }

    // Template validation
    if (campaignContext.goal) {
      const template = getCampaignTemplate(campaignContext.goal);
      if (!template) {
        validation.warnings.push(`No template found for goal: ${campaignContext.goal}`);
      } else {
        // Check if channels are supported by template
        const unsupportedChannels = campaignContext.channels?.filter(
          (channel: string) => !template.channels.includes(channel)
        );
        if (unsupportedChannels && unsupportedChannels.length > 0) {
          validation.warnings.push(
            `Channels not optimized for this goal: ${unsupportedChannels.join(', ')}`
          );
        }
      }
    }

    // Budget validation
    if (campaignContext.budget && campaignContext.budget < 100) {
      validation.warnings.push('Budget is quite low, consider increasing for better results');
    }

    // Audience validation
    if (campaignContext.targetAudience && campaignContext.targetAudience.length < 10) {
      validation.warnings.push(
        'Target audience description is very brief, consider adding more details'
      );
    }

    // Generate recommendations
    if (campaignContext.goal === 'lead_generation' && !campaignContext.leadMagnet) {
      validation.recommendations.push('Consider adding a lead magnet to improve conversion rates');
    }

    if (campaignContext.channels?.includes('email') && !campaignContext.emailList) {
      validation.recommendations.push('Specify email list size for better campaign planning');
    }

    if (!campaignContext.brandTone) {
      validation.recommendations.push('Define brand tone for consistent messaging');
    }

    validation.isValid = validation.errors.length === 0;

    return validation;
  }

  /**
   * Monitor running campaigns and scheduled campaigns
   */
  private startMonitoring(): void {
    this.monitoringTimer = setInterval(async () => {
      await this.monitorCampaigns();
      await this.processScheduledCampaigns();
    }, this.config.monitoringInterval);

    logger.info('📊 Campaign monitoring started', {
      interval: this.config.monitoringInterval,
      maxConcurrent: this.config.maxConcurrentCampaigns,
    });
  }

  /**
   * Monitor active campaigns for health and performance
   */
  private async monitorCampaigns(): Promise<void> {
    for (const [executionId, execution] of this.runningCampaigns) {
      try {
        // Check if campaign is still running
        if (execution.status === 'completed' || execution.status === 'failed') {
          this.runningCampaigns.delete(executionId);

          logger.info('📈 Campaign monitoring completed', {
            executionId,
            status: execution.status,
            progress: execution.progress,
            metrics: execution.metrics,
          });

          // Store final results
          await this.memoryStore.storeMemory(
            'campaign-runner',
            'campaign_completed',
            {
              executionId,
              finalStatus: execution.status,
              finalMetrics: execution.metrics,
              completedAt: new Date(),
            },
            {
              executionId,
              status: execution.status,
              revenue: execution.metrics.revenue.toString(),
            }
          );
        } else {
          // Monitor campaign health
          await this.checkCampaignHealth(execution);
        }
      } catch (error) {
        logger.error('Campaign monitoring error', { executionId, error });
      }
    }
  }

  /**
   * Process scheduled campaigns that are due
   */
  private async processScheduledCampaigns(): Promise<void> {
    const now = new Date();

    for (const [scheduleId, schedule] of this.scheduledCampaigns) {
      if (schedule.status === 'scheduled' && schedule.scheduledTime <= now) {
        try {
          // Check if we can run the campaign
          if (this.runningCampaigns.size >= this.config.maxConcurrentCampaigns) {
            logger.warn('⏰ Campaign delayed due to capacity', { scheduleId });
            continue;
          }

          // Get campaign context from memory
          const memories = await this.memoryStore.getRecentMemories('campaign-runner', 50);
          const campaignMemory = memories.find(m => m.data?.schedule?.id === scheduleId);

          if (!campaignMemory) {
            logger.error('Campaign context not found in memory', { scheduleId });
            schedule.status = 'failed';
            continue;
          }

          const campaignContext = campaignMemory.data.context;

          // Execute the campaign
          schedule.status = 'running';
          const execution = await this.executeCampaign(campaignContext);

          schedule.status = 'completed';
          logger.info('⏰ Scheduled campaign executed', {
            scheduleId,
            executionId: execution.id,
          });

          // Handle recurring campaigns
          if (schedule.recurring) {
            await this.scheduleRecurringCampaign(schedule, campaignContext);
          } else {
            this.scheduledCampaigns.delete(scheduleId);
          }
        } catch (error) {
          schedule.status = 'failed';
          logger.error('Scheduled campaign execution failed', { scheduleId, error });
        }
      }
    }
  }

  /**
   * Check campaign health and performance
   */
  private async checkCampaignHealth(execution: CampaignExecution): Promise<void> {
    const healthChecks = {
      stuckProgress:
        execution.progress === 0 &&
        Date.now() - new Date(execution.id.split('_')[1]).getTime() > 600000, // 10 minutes
      lowPerformance:
        execution.metrics.delivered > 100 &&
        execution.metrics.opened / execution.metrics.delivered < 0.1,
      highBounceRate:
        execution.metrics.delivered > 0 &&
        (execution.metrics.delivered - execution.metrics.opened) / execution.metrics.delivered >
          0.3,
    };

    if (healthChecks.stuckProgress) {
      logger.warn('🚨 Campaign appears stuck', {
        executionId: execution.id,
        progress: execution.progress,
        currentStep: execution.currentStep,
      });

      // Attempt to recover or flag for manual intervention
      await this.attemptCampaignRecovery(execution);
    }

    if (healthChecks.lowPerformance) {
      logger.warn('📉 Campaign performance below threshold', {
        executionId: execution.id,
        openRate: execution.metrics.opened / execution.metrics.delivered,
        delivered: execution.metrics.delivered,
      });
    }

    if (healthChecks.highBounceRate) {
      logger.warn('⚠️ High bounce rate detected', {
        executionId: execution.id,
        bounceRate:
          (execution.metrics.delivered - execution.metrics.opened) / execution.metrics.delivered,
      });
    }
  }

  /**
   * Attempt to recover a stuck campaign
   */
  private async attemptCampaignRecovery(execution: CampaignExecution): Promise<void> {
    logger.info('🔧 Attempting campaign recovery', { executionId: execution.id });

    try {
      // Get the campaign from the agent and try to resume
      const campaignFromAgent = this.campaignAgent.getCampaign(execution.id);
      if (campaignFromAgent) {
        // Log recovery attempt
        execution.agentActivity.push({
          agentId: 'campaign-runner',
          action: 'recovery_attempt',
          timestamp: new Date(),
          result: 'Attempting to recover stuck campaign',
        });
      }
    } catch (error) {
      logger.error('Campaign recovery failed', { executionId: execution.id, error });
    }
  }

  /**
   * Schedule next occurrence of a recurring campaign
   */
  private async scheduleRecurringCampaign(
    originalSchedule: CampaignSchedule,
    campaignContext: any
  ): Promise<void> {
    if (!originalSchedule.recurring) return;

    const nextScheduledTime = this.calculateNextScheduledTime(
      originalSchedule.scheduledTime,
      originalSchedule.recurring.interval
    );

    // Check if we should continue recurring
    if (
      originalSchedule.recurring.endDate &&
      nextScheduledTime > originalSchedule.recurring.endDate
    ) {
      this.scheduledCampaigns.delete(originalSchedule.id);
      logger.info('🔄 Recurring campaign series completed', { scheduleId: originalSchedule.id });
      return;
    }

    // Schedule next occurrence
    await this.scheduleCampaign(campaignContext, nextScheduledTime, {
      priority: originalSchedule.priority,
      recurring: originalSchedule.recurring,
    });

    // Remove current schedule
    this.scheduledCampaigns.delete(originalSchedule.id);
  }

  /**
   * Calculate next scheduled time for recurring campaigns
   */
  private calculateNextScheduledTime(currentTime: Date, interval: string): Date {
    const nextTime = new Date(currentTime);

    switch (interval) {
      case 'daily':
        nextTime.setDate(nextTime.getDate() + 1);
        break;
      case 'weekly':
        nextTime.setDate(nextTime.getDate() + 7);
        break;
      case 'monthly':
        nextTime.setMonth(nextTime.getMonth() + 1);
        break;
    }

    return nextTime;
  }

  /**
   * Get current status of all campaigns
   */
  getCampaignStatus(): {
    running: CampaignExecution[];
    scheduled: CampaignSchedule[];
    statistics: {
      totalRunning: number;
      totalScheduled: number;
      capacity: number;
      utilizationRate: number;
    };
  } {
    const running = Array.from(this.runningCampaigns.values());
    const scheduled = Array.from(this.scheduledCampaigns.values());

    return {
      running,
      scheduled,
      statistics: {
        totalRunning: running.length,
        totalScheduled: scheduled.length,
        capacity: this.config.maxConcurrentCampaigns,
        utilizationRate: running.length / this.config.maxConcurrentCampaigns,
      },
    };
  }

  /**
   * Cancel a scheduled campaign
   */
  async cancelScheduledCampaign(scheduleId: string): Promise<boolean> {
    const schedule = this.scheduledCampaigns.get(scheduleId);
    if (!schedule) {
      return false;
    }

    schedule.status = 'cancelled';
    this.scheduledCampaigns.delete(scheduleId);

    logger.info('❌ Campaign cancelled', { scheduleId });
    return true;
  }

  /**
   * Stop monitoring and cleanup
   */
  shutdown(): void {
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = undefined;
    }

    logger.info('🛑 Campaign runner shutdown');
  }
}
