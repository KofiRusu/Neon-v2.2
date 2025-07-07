import { PrismaClient } from "@neon/data-model";
import { logger } from "@neon/utils";
import { AbstractAgent } from "../base-agent";
import { SEOAlertAgent } from "../agents/seo-alert-agent";
import { TrendAgent } from "../agents/trend-agent";
import { ContentAgent } from "../agents/content-agent";
import cron from "node-cron";
import { CronJob } from "cron";

export interface ScheduleConfig {
  id?: string;
  agentType: string;
  name?: string;
  description?: string;
  cron: string;
  timezone?: string;
  enabled?: boolean;
  config?: Record<string, any>;
  retryConfig?: RetryConfig;
  timeout?: number;
  createdBy?: string;
}

export interface RetryConfig {
  maxRetries?: number;
  retryDelay?: number; // milliseconds
  backoffMultiplier?: number;
  maxRetryDelay?: number; // milliseconds
}

export interface ExecutionResult {
  success: boolean;
  result?: any;
  error?: string;
  duration: number;
  retryAttempt: number;
}

export interface ScheduleStatus {
  id: string;
  agentType: string;
  name?: string;
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
  lastStatus?: string;
  executionCount: number;
  successCount: number;
  failureCount: number;
  successRate: number;
}

export class AgentScheduler {
  private prisma: PrismaClient;
  private jobs: Map<string, CronJob> = new Map();
  private agents: Map<string, typeof AbstractAgent> = new Map();
  private isInitialized = false;
  private defaultRetryConfig: RetryConfig = {
    maxRetries: 3,
    retryDelay: 5000, // 5 seconds
    backoffMultiplier: 2,
    maxRetryDelay: 60000, // 1 minute
  };

  constructor() {
    this.prisma = new PrismaClient();
    this.registerAgents();
  }

  /**
   * Register available agent types for scheduling
   */
  private registerAgents() {
    this.agents.set("SEOAlertAgent", SEOAlertAgent);
    this.agents.set("TrendAgent", TrendAgent);
    this.agents.set("ContentAgent", ContentAgent);
    // Add more agents as needed
  }

  /**
   * Initialize the scheduler and load all active schedules
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.warn("AgentScheduler already initialized", {}, "AgentScheduler");
      return;
    }

    try {
      logger.info("Initializing AgentScheduler...", {}, "AgentScheduler");
      
      // Load all enabled schedules from database
      const schedules = await this.prisma.agentSchedule.findMany({
        where: { enabled: true },
      });

      logger.info(`Loading ${schedules.length} active schedules`, {}, "AgentScheduler");

      // Create cron jobs for each schedule
      for (const schedule of schedules) {
        await this.createCronJob(schedule);
      }

      // Update next run times for all schedules
      await this.updateNextRunTimes();

      this.isInitialized = true;
      logger.info("AgentScheduler initialized successfully", {}, "AgentScheduler");
    } catch (error) {
      logger.error("Failed to initialize AgentScheduler", error as Error, "AgentScheduler");
      throw error;
    }
  }

  /**
   * Create a new schedule
   */
  async createSchedule(config: ScheduleConfig): Promise<string> {
    try {
      // Validate cron expression
      if (!cron.validate(config.cron)) {
        throw new Error(`Invalid cron expression: ${config.cron}`);
      }

      // Validate agent type
      if (!this.agents.has(config.agentType)) {
        throw new Error(`Unknown agent type: ${config.agentType}`);
      }

      // Calculate next run time
      const nextRun = this.calculateNextRun(config.cron, config.timezone);

      // Create schedule in database
      const schedule = await this.prisma.agentSchedule.create({
        data: {
          agentType: config.agentType,
          name: config.name,
          description: config.description,
          cron: config.cron,
          timezone: config.timezone || "UTC",
          enabled: config.enabled ?? true,
          config: config.config || {},
          retryConfig: config.retryConfig || this.defaultRetryConfig,
          timeout: config.timeout || 300000, // 5 minutes default
          nextRun,
          lastStatus: "pending",
          createdBy: config.createdBy,
        },
      });

      // Create cron job if enabled
      if (schedule.enabled) {
        await this.createCronJob(schedule);
      }

      logger.info(`Created schedule ${schedule.id} for ${config.agentType}`, { scheduleId: schedule.id }, "AgentScheduler");
      return schedule.id;
    } catch (error) {
      logger.error("Failed to create schedule", error as Error, "AgentScheduler");
      throw error;
    }
  }

  /**
   * Update an existing schedule
   */
  async updateSchedule(id: string, updates: Partial<ScheduleConfig>): Promise<void> {
    try {
      const schedule = await this.prisma.agentSchedule.findUnique({ where: { id } });
      if (!schedule) {
        throw new Error(`Schedule ${id} not found`);
      }

      // Validate cron expression if updating
      if (updates.cron && !cron.validate(updates.cron)) {
        throw new Error(`Invalid cron expression: ${updates.cron}`);
      }

      // Calculate new next run time if cron or timezone changed
      let nextRun = schedule.nextRun;
      if (updates.cron || updates.timezone) {
        const cronExpression = updates.cron || schedule.cron;
        const timezone = updates.timezone || schedule.timezone;
        nextRun = this.calculateNextRun(cronExpression, timezone);
      }

      // Update schedule in database
      await this.prisma.agentSchedule.update({
        where: { id },
        data: {
          ...updates,
          nextRun,
          updatedAt: new Date(),
        },
      });

      // Recreate cron job
      this.stopCronJob(id);
      const updatedSchedule = await this.prisma.agentSchedule.findUnique({ where: { id } });
      if (updatedSchedule && updatedSchedule.enabled) {
        await this.createCronJob(updatedSchedule);
      }

      logger.info(`Updated schedule ${id}`, { scheduleId: id }, "AgentScheduler");
    } catch (error) {
      logger.error(`Failed to update schedule ${id}`, error as Error, "AgentScheduler");
      throw error;
    }
  }

  /**
   * Delete a schedule
   */
  async deleteSchedule(id: string): Promise<void> {
    try {
      // Stop the cron job
      this.stopCronJob(id);

      // Delete from database (cascade will delete executions)
      await this.prisma.agentSchedule.delete({ where: { id } });

      logger.info(`Deleted schedule ${id}`, { scheduleId: id }, "AgentScheduler");
    } catch (error) {
      logger.error(`Failed to delete schedule ${id}`, error as Error, "AgentScheduler");
      throw error;
    }
  }

  /**
   * Enable/disable a schedule
   */
  async toggleSchedule(id: string, enabled: boolean): Promise<void> {
    try {
      await this.prisma.agentSchedule.update({
        where: { id },
        data: { enabled },
      });

      if (enabled) {
        const schedule = await this.prisma.agentSchedule.findUnique({ where: { id } });
        if (schedule) {
          await this.createCronJob(schedule);
        }
      } else {
        this.stopCronJob(id);
      }

      logger.info(`${enabled ? 'Enabled' : 'Disabled'} schedule ${id}`, { scheduleId: id }, "AgentScheduler");
    } catch (error) {
      logger.error(`Failed to toggle schedule ${id}`, error as Error, "AgentScheduler");
      throw error;
    }
  }

  /**
   * Manually trigger a schedule execution
   */
  async triggerSchedule(id: string): Promise<ExecutionResult> {
    try {
      const schedule = await this.prisma.agentSchedule.findUnique({ where: { id } });
      if (!schedule) {
        throw new Error(`Schedule ${id} not found`);
      }

      logger.info(`Manually triggering schedule ${id}`, { scheduleId: id }, "AgentScheduler");
      return await this.executeAgent(schedule);
    } catch (error) {
      logger.error(`Failed to trigger schedule ${id}`, error as Error, "AgentScheduler");
      throw error;
    }
  }

  /**
   * Get all schedules with status information
   */
  async getSchedules(): Promise<ScheduleStatus[]> {
    try {
      const schedules = await this.prisma.agentSchedule.findMany({
        orderBy: { createdAt: "desc" },
      });

      return schedules.map(schedule => ({
        id: schedule.id,
        agentType: schedule.agentType,
        name: schedule.name || undefined,
        enabled: schedule.enabled,
        lastRun: schedule.lastRun || undefined,
        nextRun: schedule.nextRun || undefined,
        lastStatus: schedule.lastStatus || undefined,
        executionCount: schedule.executionCount,
        successCount: schedule.successCount,
        failureCount: schedule.failureCount,
        successRate: schedule.executionCount > 0 
          ? (schedule.successCount / schedule.executionCount) * 100 
          : 0,
      }));
    } catch (error) {
      logger.error("Failed to get schedules", error as Error, "AgentScheduler");
      throw error;
    }
  }

  /**
   * Get execution history for a schedule
   */
  async getExecutionHistory(scheduleId: string, limit: number = 50): Promise<any[]> {
    try {
      const executions = await this.prisma.scheduleExecution.findMany({
        where: { scheduleId },
        orderBy: { startedAt: "desc" },
        take: limit,
      });

      return executions;
    } catch (error) {
      logger.error(`Failed to get execution history for ${scheduleId}`, error as Error, "AgentScheduler");
      throw error;
    }
  }

  /**
   * Create a cron job for a schedule
   */
  private async createCronJob(schedule: any): Promise<void> {
    try {
      const job = new CronJob(
        schedule.cron,
        async () => {
          await this.executeAgent(schedule);
        },
        null,
        false, // Don't start immediately
        schedule.timezone || "UTC"
      );

      this.jobs.set(schedule.id, job);
      job.start();

      logger.info(`Created cron job for schedule ${schedule.id}`, {
        scheduleId: schedule.id,
        cron: schedule.cron,
        agentType: schedule.agentType,
      }, "AgentScheduler");
    } catch (error) {
      logger.error(`Failed to create cron job for schedule ${schedule.id}`, error as Error, "AgentScheduler");
      throw error;
    }
  }

  /**
   * Stop a cron job
   */
  private stopCronJob(scheduleId: string): void {
    const job = this.jobs.get(scheduleId);
    if (job) {
      job.stop();
      job.destroy();
      this.jobs.delete(scheduleId);
      logger.info(`Stopped cron job for schedule ${scheduleId}`, { scheduleId }, "AgentScheduler");
    }
  }

  /**
   * Execute an agent with retry logic
   */
  private async executeAgent(schedule: any, retryAttempt: number = 0): Promise<ExecutionResult> {
    const startTime = Date.now();
    let executionId: string | null = null;

    try {
      // Create execution record
      const execution = await this.prisma.scheduleExecution.create({
        data: {
          scheduleId: schedule.id,
          agentType: schedule.agentType,
          status: "running",
          retryAttempt,
        },
      });
      executionId = execution.id;

      // Update schedule status
      await this.prisma.agentSchedule.update({
        where: { id: schedule.id },
        data: {
          lastStatus: "running",
          lastRun: new Date(),
        },
      });

      logger.info(`Executing ${schedule.agentType} (schedule: ${schedule.id}, attempt: ${retryAttempt + 1})`, {
        scheduleId: schedule.id,
        agentType: schedule.agentType,
        retryAttempt,
      }, "AgentScheduler");

      // Get agent class
      const AgentClass = this.agents.get(schedule.agentType);
      if (!AgentClass) {
        throw new Error(`Agent type ${schedule.agentType} not registered`);
      }

      // Create agent instance and execute
      const agent = new AgentClass();
      const result = await Promise.race([
        agent.execute({
          task: this.getDefaultTask(schedule.agentType),
          context: schedule.config || {},
        }),
        this.createTimeoutPromise(schedule.timeout || 300000),
      ]);

      const duration = Date.now() - startTime;

      // Update execution record
      await this.prisma.scheduleExecution.update({
        where: { id: executionId },
        data: {
          status: "success",
          completedAt: new Date(),
          duration,
          result,
        },
      });

      // Update schedule statistics
      await this.prisma.agentSchedule.update({
        where: { id: schedule.id },
        data: {
          lastStatus: "success",
          lastError: null,
          executionCount: { increment: 1 },
          successCount: { increment: 1 },
          nextRun: this.calculateNextRun(schedule.cron, schedule.timezone),
        },
      });

      logger.info(`Successfully executed ${schedule.agentType} (${duration}ms)`, {
        scheduleId: schedule.id,
        agentType: schedule.agentType,
        duration,
      }, "AgentScheduler");

      return {
        success: true,
        result,
        duration,
        retryAttempt,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      logger.error(`Failed to execute ${schedule.agentType}`, error as Error, "AgentScheduler", {
        scheduleId: schedule.id,
        retryAttempt,
        duration,
      });

      // Update execution record
      if (executionId) {
        await this.prisma.scheduleExecution.update({
          where: { id: executionId },
          data: {
            status: "failed",
            completedAt: new Date(),
            duration,
            error: errorMessage,
          },
        });
      }

      // Check if we should retry
      const retryConfig = schedule.retryConfig || this.defaultRetryConfig;
      const shouldRetry = retryAttempt < (retryConfig.maxRetries || 0);

      if (shouldRetry) {
        const delay = this.calculateRetryDelay(retryAttempt, retryConfig);
        logger.info(`Retrying ${schedule.agentType} in ${delay}ms (attempt ${retryAttempt + 2})`, {
          scheduleId: schedule.id,
          delay,
        }, "AgentScheduler");

        await this.sleep(delay);
        return await this.executeAgent(schedule, retryAttempt + 1);
      } else {
        // No more retries, mark as failed
        await this.prisma.agentSchedule.update({
          where: { id: schedule.id },
          data: {
            lastStatus: "failed",
            lastError: errorMessage,
            executionCount: { increment: 1 },
            failureCount: { increment: 1 },
            nextRun: this.calculateNextRun(schedule.cron, schedule.timezone),
          },
        });

        return {
          success: false,
          error: errorMessage,
          duration,
          retryAttempt,
        };
      }
    }
  }

  /**
   * Calculate next run time based on cron expression
   */
  private calculateNextRun(cronExpression: string, timezone: string = "UTC"): Date {
    try {
      const job = new CronJob(cronExpression, () => {}, null, false, timezone);
      return job.nextDate().toJSDate();
    } catch (error) {
      logger.error("Failed to calculate next run time", error as Error, "AgentScheduler");
      // Fallback to 1 hour from now
      return new Date(Date.now() + 60 * 60 * 1000);
    }
  }

  /**
   * Update next run times for all schedules
   */
  private async updateNextRunTimes(): Promise<void> {
    try {
      const schedules = await this.prisma.agentSchedule.findMany({
        where: { enabled: true },
      });

      for (const schedule of schedules) {
        const nextRun = this.calculateNextRun(schedule.cron, schedule.timezone);
        await this.prisma.agentSchedule.update({
          where: { id: schedule.id },
          data: { nextRun },
        });
      }
    } catch (error) {
      logger.error("Failed to update next run times", error as Error, "AgentScheduler");
    }
  }

  /**
   * Get default task for agent type
   */
  private getDefaultTask(agentType: string): string {
    const defaultTasks = {
      SEOAlertAgent: "monitor_seo_performance",
      TrendAgent: "analyze_trends",
      ContentAgent: "generate_content",
    };
    return defaultTasks[agentType as keyof typeof defaultTasks] || "execute";
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private calculateRetryDelay(retryAttempt: number, retryConfig: RetryConfig): number {
    const baseDelay = retryConfig.retryDelay || 5000;
    const multiplier = retryConfig.backoffMultiplier || 2;
    const maxDelay = retryConfig.maxRetryDelay || 60000;

    const delay = baseDelay * Math.pow(multiplier, retryAttempt);
    return Math.min(delay, maxDelay);
  }

  /**
   * Create a timeout promise
   */
  private createTimeoutPromise(timeoutMs: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Agent execution timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Shutdown the scheduler
   */
  async shutdown(): Promise<void> {
    logger.info("Shutting down AgentScheduler...", {}, "AgentScheduler");
    
    // Stop all cron jobs
    for (const [scheduleId, job] of this.jobs.entries()) {
      job.stop();
      job.destroy();
      logger.info(`Stopped cron job ${scheduleId}`, { scheduleId }, "AgentScheduler");
    }
    
    this.jobs.clear();
    await this.prisma.$disconnect();
    this.isInitialized = false;
    
    logger.info("AgentScheduler shutdown complete", {}, "AgentScheduler");
  }

  /**
   * Get scheduler statistics
   */
  async getStatistics(): Promise<{
    totalSchedules: number;
    activeSchedules: number;
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    averageSuccessRate: number;
  }> {
    try {
      const schedules = await this.prisma.agentSchedule.findMany();
      const totalSchedules = schedules.length;
      const activeSchedules = schedules.filter(s => s.enabled).length;
      
      const totalExecutions = schedules.reduce((sum, s) => sum + s.executionCount, 0);
      const successfulExecutions = schedules.reduce((sum, s) => sum + s.successCount, 0);
      const failedExecutions = schedules.reduce((sum, s) => sum + s.failureCount, 0);
      const averageSuccessRate = totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0;

      return {
        totalSchedules,
        activeSchedules,
        totalExecutions,
        successfulExecutions,
        failedExecutions,
        averageSuccessRate,
      };
    } catch (error) {
      logger.error("Failed to get scheduler statistics", error as Error, "AgentScheduler");
      throw error;
    }
  }
}

// Singleton instance
let schedulerInstance: AgentScheduler | null = null;

export function getScheduler(): AgentScheduler {
  if (!schedulerInstance) {
    schedulerInstance = new AgentScheduler();
  }
  return schedulerInstance;
}

export async function initializeScheduler(): Promise<AgentScheduler> {
  const scheduler = getScheduler();
  await scheduler.initialize();
  return scheduler;
} 