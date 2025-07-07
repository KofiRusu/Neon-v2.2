import { logger } from "@neon/utils";
import * as fs from "fs/promises";
import * as path from "path";

// Enhanced metrics interface for dashboard integration
export interface FallbackMetricsData {
  timestamp: string;
  agentType: string;
  messageType: 'sms' | 'whatsapp';
  originalRecipient: string;
  success: boolean;
  service: string;
  fallbackUsed: boolean;
  fallbackReason?: string;
  retryCount: number;
  executionTime: number; // milliseconds
  cost?: number;
}

// Aggregated metrics for dashboard display
export interface FallbackSummary {
  period: string; // 'hour', 'day', 'week', 'month'
  totalMessages: number;
  successfulMessages: number;
  fallbackMessages: number;
  fallbackRate: number; // percentage
  avgExecutionTime: number;
  primaryServiceUptime: number; // percentage
  fallbacksByService: Record<string, number>;
  fallbacksByReason: Record<string, number>;
  costSavings?: number; // estimated savings from fallbacks vs failed messages
}

export class FallbackMetricsLogger {
  private static logDir = path.join(process.cwd(), "logs", "fallback-metrics");
  private static maxLogFileSize = 10 * 1024 * 1024; // 10MB
  private static maxLogFiles = 5;

  static async ensureLogDir(): Promise<void> {
    try {
      await fs.mkdir(this.logDir, { recursive: true });
    } catch (error) {
      logger.error("Failed to create fallback metrics log directory", { error });
    }
  }

  static async logFallbackEvent(data: FallbackMetricsData): Promise<void> {
    try {
      await this.ensureLogDir();
      
      const logFile = path.join(this.logDir, `fallback-metrics-${this.getDateString()}.jsonl`);
      const logEntry = JSON.stringify({
        ...data,
        loggedAt: new Date().toISOString(),
      }) + '\n';

      await fs.appendFile(logFile, logEntry);
      
      // Rotate logs if needed
      await this.rotateLogsIfNeeded();

      // Also log to structured logger for real-time monitoring
      logger.info("Fallback event logged", {
        ...data,
        component: "TwilioFallback",
      });

    } catch (error) {
      logger.error("Failed to log fallback metrics", { error, data });
    }
  }

  static async getDailyMetrics(date?: string): Promise<FallbackSummary | null> {
    try {
      const targetDate = date || this.getDateString();
      const logFile = path.join(this.logDir, `fallback-metrics-${targetDate}.jsonl`);
      
      const fileContent = await fs.readFile(logFile, 'utf-8');
      const events = fileContent
        .split('\n')
        .filter(line => line.trim())
        .map(line => JSON.parse(line) as FallbackMetricsData);

      return this.calculateSummary(events, 'day');
    } catch (error) {
      logger.warn("Failed to read daily metrics", { error, date });
      return null;
    }
  }

  static async getWeeklyMetrics(): Promise<FallbackSummary | null> {
    try {
      const events: FallbackMetricsData[] = [];
      const today = new Date();
      
      // Get logs from the last 7 days
      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateString = this.formatDate(date);
        
        try {
          const logFile = path.join(this.logDir, `fallback-metrics-${dateString}.jsonl`);
          const fileContent = await fs.readFile(logFile, 'utf-8');
          const dayEvents = fileContent
            .split('\n')
            .filter(line => line.trim())
            .map(line => JSON.parse(line) as FallbackMetricsData);
          
          events.push(...dayEvents);
        } catch {
          // Skip missing log files
        }
      }

      return this.calculateSummary(events, 'week');
    } catch (error) {
      logger.warn("Failed to read weekly metrics", { error });
      return null;
    }
  }

  static async getRecentEvents(limit: number = 100): Promise<FallbackMetricsData[]> {
    try {
      const logFile = path.join(this.logDir, `fallback-metrics-${this.getDateString()}.jsonl`);
      const fileContent = await fs.readFile(logFile, 'utf-8');
      const events = fileContent
        .split('\n')
        .filter(line => line.trim())
        .map(line => JSON.parse(line) as FallbackMetricsData)
        .slice(-limit); // Get the last N events

      return events;
    } catch (error) {
      logger.warn("Failed to read recent events", { error });
      return [];
    }
  }

  private static calculateSummary(events: FallbackMetricsData[], period: string): FallbackSummary {
    const totalMessages = events.length;
    const successfulMessages = events.filter(e => e.success).length;
    const fallbackMessages = events.filter(e => e.fallbackUsed).length;
    const fallbackRate = totalMessages > 0 ? (fallbackMessages / totalMessages) * 100 : 0;

    const avgExecutionTime = events.length > 0 
      ? events.reduce((sum, e) => sum + e.executionTime, 0) / events.length 
      : 0;

    const primaryServiceMessages = events.filter(e => !e.fallbackUsed).length;
    const primaryServiceUptime = totalMessages > 0 
      ? (primaryServiceMessages / totalMessages) * 100 
      : 100;

    const fallbacksByService: Record<string, number> = {};
    const fallbacksByReason: Record<string, number> = {};

    events.filter(e => e.fallbackUsed).forEach(event => {
      fallbacksByService[event.service] = (fallbacksByService[event.service] || 0) + 1;
      if (event.fallbackReason) {
        fallbacksByReason[event.fallbackReason] = (fallbacksByReason[event.fallbackReason] || 0) + 1;
      }
    });

    return {
      period,
      totalMessages,
      successfulMessages,
      fallbackMessages,
      fallbackRate,
      avgExecutionTime,
      primaryServiceUptime,
      fallbacksByService,
      fallbacksByReason,
    };
  }

  private static async rotateLogsIfNeeded(): Promise<void> {
    try {
      const files = await fs.readdir(this.logDir);
      const logFiles = files
        .filter(f => f.startsWith('fallback-metrics-') && f.endsWith('.jsonl'))
        .sort()
        .reverse();

      // Remove old files if we have too many
      if (logFiles.length > this.maxLogFiles) {
        const filesToDelete = logFiles.slice(this.maxLogFiles);
        for (const file of filesToDelete) {
          await fs.unlink(path.join(this.logDir, file));
        }
      }

      // Check current file size and rotate if needed
      const currentLogFile = `fallback-metrics-${this.getDateString()}.jsonl`;
      const currentLogPath = path.join(this.logDir, currentLogFile);
      
      try {
        const stats = await fs.stat(currentLogPath);
        if (stats.size > this.maxLogFileSize) {
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const archiveName = `fallback-metrics-${this.getDateString()}-${timestamp}.jsonl`;
          await fs.rename(currentLogPath, path.join(this.logDir, archiveName));
        }
      } catch {
        // File doesn't exist yet, which is fine
      }
    } catch (error) {
      logger.error("Failed to rotate logs", { error });
    }
  }

  private static getDateString(): string {
    return this.formatDate(new Date());
  }

  private static formatDate(date: Date): string {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  }

  // Dashboard API methods
  static async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'down';
    twilioUptime: number;
    fallbackRate: number;
    lastHourMetrics: FallbackSummary | null;
  }> {
    try {
      const recentEvents = await this.getRecentEvents(50);
      const lastHour = recentEvents.filter(e => {
        const eventTime = new Date(e.timestamp);
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        return eventTime > oneHourAgo;
      });

      const lastHourMetrics = this.calculateSummary(lastHour, 'hour');
      const twilioUptime = lastHourMetrics.primaryServiceUptime;
      const fallbackRate = lastHourMetrics.fallbackRate;

      let status: 'healthy' | 'degraded' | 'down' = 'healthy';
      if (twilioUptime < 50) {
        status = 'down';
      } else if (twilioUptime < 90 || fallbackRate > 20) {
        status = 'degraded';
      }

      return {
        status,
        twilioUptime,
        fallbackRate,
        lastHourMetrics,
      };
    } catch (error) {
      logger.error("Failed to get health status", { error });
      return {
        status: 'down',
        twilioUptime: 0,
        fallbackRate: 100,
        lastHourMetrics: null,
      };
    }
  }

  // Alert thresholds
  static async checkAlertThresholds(): Promise<{
    alerts: Array<{
      type: 'high_fallback_rate' | 'service_down' | 'performance_degraded';
      severity: 'warning' | 'critical';
      message: string;
      timestamp: string;
    }>;
  }> {
    const alerts: any[] = [];
    const healthStatus = await this.getHealthStatus();

    // High fallback rate alert
    if (healthStatus.fallbackRate > 50) {
      alerts.push({
        type: 'high_fallback_rate',
        severity: 'critical',
        message: `Fallback rate is ${healthStatus.fallbackRate.toFixed(1)}% - Primary service may be down`,
        timestamp: new Date().toISOString(),
      });
    } else if (healthStatus.fallbackRate > 20) {
      alerts.push({
        type: 'high_fallback_rate',
        severity: 'warning',
        message: `Fallback rate is ${healthStatus.fallbackRate.toFixed(1)}% - Service degradation detected`,
        timestamp: new Date().toISOString(),
      });
    }

    // Service down alert
    if (healthStatus.twilioUptime < 50) {
      alerts.push({
        type: 'service_down',
        severity: 'critical',
        message: `Twilio uptime is ${healthStatus.twilioUptime.toFixed(1)}% - Primary service appears to be down`,
        timestamp: new Date().toISOString(),
      });
    }

    // Performance degraded alert
    if (healthStatus.lastHourMetrics && healthStatus.lastHourMetrics.avgExecutionTime > 10000) {
      alerts.push({
        type: 'performance_degraded',
        severity: 'warning',
        message: `Average execution time is ${(healthStatus.lastHourMetrics.avgExecutionTime / 1000).toFixed(1)}s - Performance degradation detected`,
        timestamp: new Date().toISOString(),
      });
    }

    return { alerts };
  }
}

// Export singleton instance for global use
export const fallbackMetricsLogger = FallbackMetricsLogger; 