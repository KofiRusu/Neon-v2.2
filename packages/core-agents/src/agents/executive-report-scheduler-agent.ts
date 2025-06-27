import { BaseAgent } from '../BaseAgent';
import { AgentResult, AgentType } from '../../types';
import { ExecutiveReportCompilerAgent } from './executive-report-compiler-agent';
import { ReportType, ReportPriority } from '../../../data-model/src';

interface SchedulerConfig {
  enableWeeklyDigest: boolean;
  enableCampaignSummaries: boolean;
  enableAgentPerformanceReports: boolean;
  enableBrandAudits: boolean;
  weeklyDigestDay: number; // 0 = Sunday, 1 = Monday, etc.
  weeklyDigestHour: number; // 0-23
  campaignCompletionReports: boolean;
  performanceThresholds: {
    lowROAS: number;
    highROAS: number;
    lowConversionRate: number;
    criticalBrandAlignment: number;
  };
  notificationChannels: {
    email: boolean;
    slack: boolean;
    dashboard: boolean;
  };
}

interface NotificationPayload {
  type: 'REPORT_READY' | 'ALERT' | 'SUMMARY' | 'SYSTEM_STATUS';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  message: string;
  data?: any;
  recipients: string[];
  channels: string[];
}

export class ExecutiveReportSchedulerAgent extends BaseAgent {
  public type: AgentType = 'EXECUTIVE_REPORT_SCHEDULER';
  private reportCompiler: ExecutiveReportCompilerAgent;
  private isRunning: boolean = false;
  private scheduleInterval: NodeJS.Timeout | null = null;
  private lastExecution: Date | null = null;

  constructor(apiKey: string) {
    super(apiKey);
    this.reportCompiler = new ExecutiveReportCompilerAgent(apiKey);
  }

  async execute(goal: string, context: any = {}, config: SchedulerConfig): Promise<AgentResult> {
    try {
      console.log('🕐 ExecutiveReportScheduler: Starting autonomous reporting engine...');

      if (this.isRunning) {
        return {
          success: true,
          data: { status: 'already_running', lastExecution: this.lastExecution },
          confidence: 1.0,
          reasoning: 'ExecutiveReportScheduler is already running autonomously',
        };
      }

      // Start the autonomous scheduler
      await this.startAutonomousScheduler(config);

      // Perform initial system check and generate reports if needed
      const initialResults = await this.performInitialSystemCheck(config);

      this.isRunning = true;
      this.lastExecution = new Date();

      return {
        success: true,
        data: {
          status: 'started',
          initialReports: initialResults.reportsGenerated,
          notifications: initialResults.notificationsSent,
          nextScheduledRun: this.getNextScheduledRun(config),
          schedulerConfig: config,
        },
        confidence: 0.95,
        reasoning: `ExecutiveReportScheduler started successfully. Generated ${initialResults.reportsGenerated} initial reports and sent ${initialResults.notificationsSent} notifications.`,
        nextSteps: [
          'Monitor system performance continuously',
          'Generate weekly digest reports automatically',
          'Send alerts for critical performance issues',
          'Compile agent performance reports monthly',
        ],
      };
    } catch (error) {
      console.error('ExecutiveReportScheduler failed to start:', error);
      return {
        success: false,
        data: { error: error.message },
        confidence: 0.1,
        reasoning: `Failed to start ExecutiveReportScheduler: ${error.message}`,
      };
    }
  }

  private async startAutonomousScheduler(config: SchedulerConfig): Promise<void> {
    // Clear any existing scheduler
    if (this.scheduleInterval) {
      clearInterval(this.scheduleInterval);
    }

    // Run every hour to check for scheduled tasks
    this.scheduleInterval = setInterval(
      async () => {
        await this.checkAndExecuteScheduledTasks(config);
      },
      60 * 60 * 1000
    ); // 1 hour

    console.log('✅ Autonomous scheduler started - checking every hour for scheduled tasks');
  }

  private async checkAndExecuteScheduledTasks(config: SchedulerConfig): Promise<void> {
    try {
      const now = new Date();
      console.log(`🔍 ExecutiveReportScheduler: Checking scheduled tasks at ${now.toISOString()}`);

      // Check for weekly digest generation
      if (config.enableWeeklyDigest && this.shouldGenerateWeeklyDigest(now, config)) {
        await this.generateWeeklyDigest(config);
      }

      // Check for campaign completion reports
      if (config.enableCampaignSummaries) {
        await this.checkForCompletedCampaigns(config);
      }

      // Check for monthly agent performance reports
      if (config.enableAgentPerformanceReports && this.shouldGenerateMonthlyAgentReport(now)) {
        await this.generateAgentPerformanceReport(config);
      }

      // Check for quarterly brand audits
      if (config.enableBrandAudits && this.shouldGenerateQuarterlyBrandAudit(now)) {
        await this.generateBrandConsistencyAudit(config);
      }

      // Monitor system health and send alerts if needed
      await this.monitorSystemHealth(config);

      this.lastExecution = now;
    } catch (error) {
      console.error('Error in scheduled task execution:', error);
      await this.sendNotification({
        type: 'ALERT',
        priority: 'HIGH',
        title: 'ExecutiveReportScheduler Error',
        message: `Scheduled task execution failed: ${error.message}`,
        recipients: ['admin@neonhub.ai'],
        channels: ['email', 'dashboard'],
      });
    }
  }

  private async performInitialSystemCheck(
    config: SchedulerConfig
  ): Promise<{ reportsGenerated: number; notificationsSent: number }> {
    let reportsGenerated = 0;
    let notificationsSent = 0;

    console.log('🔍 Performing initial system check...');

    // Check if weekly digest is overdue
    const lastWeeklyDigest = await this.getLastReportDate('WEEKLY_DIGEST');
    if (!lastWeeklyDigest || this.isReportOverdue(lastWeeklyDigest, 7)) {
      console.log('📊 Weekly digest overdue - generating now...');
      await this.generateWeeklyDigest(config);
      reportsGenerated++;
    }

    // Check for critical performance issues
    const criticalIssues = await this.identifyCriticalIssues(config);
    if (criticalIssues.length > 0) {
      for (const issue of criticalIssues) {
        await this.sendNotification({
          type: 'ALERT',
          priority: 'CRITICAL',
          title: `Critical Performance Alert: ${issue.title}`,
          message: issue.description,
          data: issue.data,
          recipients: ['cmo@company.com', 'marketing-leads@company.com'],
          channels: ['email', 'slack', 'dashboard'],
        });
        notificationsSent++;
      }
    }

    // Send welcome notification
    await this.sendNotification({
      type: 'SYSTEM_STATUS',
      priority: 'MEDIUM',
      title: 'ExecutiveReportScheduler Active',
      message:
        'Autonomous executive reporting is now active. You will receive scheduled reports and performance alerts.',
      recipients: ['cmo@company.com'],
      channels: ['dashboard'],
    });
    notificationsSent++;

    return { reportsGenerated, notificationsSent };
  }

  private shouldGenerateWeeklyDigest(now: Date, config: SchedulerConfig): boolean {
    const dayOfWeek = now.getDay();
    const hour = now.getHours();

    return (
      dayOfWeek === config.weeklyDigestDay &&
      hour === config.weeklyDigestHour &&
      !this.hasGeneratedTodayReport('WEEKLY_DIGEST')
    );
  }

  private shouldGenerateMonthlyAgentReport(now: Date): boolean {
    const dayOfMonth = now.getDate();
    const hour = now.getHours();

    // Generate on the 1st of each month at 9 AM
    return dayOfMonth === 1 && hour === 9 && !this.hasGeneratedTodayReport('AGENT_PERFORMANCE');
  }

  private shouldGenerateQuarterlyBrandAudit(now: Date): boolean {
    const month = now.getMonth();
    const dayOfMonth = now.getDate();
    const hour = now.getHours();

    // Generate on the 1st of January, April, July, October at 10 AM
    const quarterMonths = [0, 3, 6, 9]; // Jan, Apr, Jul, Oct
    return (
      quarterMonths.includes(month) &&
      dayOfMonth === 1 &&
      hour === 10 &&
      !this.hasGeneratedTodayReport('BRAND_CONSISTENCY_AUDIT')
    );
  }

  private async generateWeeklyDigest(config: SchedulerConfig): Promise<void> {
    try {
      console.log('📊 Generating weekly performance digest...');

      const reportConfig = {
        reportType: ReportType.WEEKLY_DIGEST,
        timeframe: {
          start: this.getWeekStart(),
          end: new Date(),
          period: 'weekly' as const,
        },
        minBusinessImpact: 0.3,
        maxInsights: 15,
      };

      const report = await this.reportCompiler.execute(
        'Generate weekly executive digest',
        {},
        reportConfig
      );

      if (report.success) {
        await this.sendNotification({
          type: 'REPORT_READY',
          priority: 'MEDIUM',
          title: 'Weekly Performance Digest Ready',
          message: `Your weekly intelligence digest is ready with ${report.data.insightCount} insights and ${report.data.recommendations?.length || 0} recommendations.`,
          data: {
            reportId: report.data.reportId,
            businessImpact: report.data.businessImpact,
            keyFindings: report.data.keyFindings,
          },
          recipients: ['cmo@company.com', 'marketing-leads@company.com'],
          channels: ['email', 'dashboard'],
        });

        console.log(`✅ Weekly digest generated successfully: ${report.data.reportId}`);
      }
    } catch (error) {
      console.error('Failed to generate weekly digest:', error);
    }
  }

  private async checkForCompletedCampaigns(config: SchedulerConfig): Promise<void> {
    // Mock implementation - in real system, this would query the database
    const completedCampaigns = await this.getRecentlyCompletedCampaigns();

    for (const campaign of completedCampaigns) {
      if (!campaign.hasGeneratedSummary) {
        console.log(`📈 Generating summary for completed campaign: ${campaign.name}`);

        const reportConfig = {
          reportType: ReportType.CAMPAIGN_SUMMARY,
          timeframe: {
            start: campaign.startDate,
            end: campaign.endDate,
            period: 'campaign' as const,
          },
          includeCampaigns: [campaign.id],
        };

        const report = await this.reportCompiler.execute(
          'Generate campaign completion summary',
          {},
          reportConfig
        );

        if (report.success) {
          await this.sendNotification({
            type: 'REPORT_READY',
            priority: campaign.performance > 2.0 ? 'HIGH' : 'MEDIUM',
            title: `Campaign Summary: ${campaign.name}`,
            message: `Performance summary available for completed campaign. ROAS: ${campaign.performance}x`,
            data: {
              reportId: report.data.reportId,
              campaignId: campaign.id,
              performance: campaign.performance,
            },
            recipients: ['campaign-manager@company.com', 'cmo@company.com'],
            channels: ['email', 'dashboard'],
          });
        }
      }
    }
  }

  private async generateAgentPerformanceReport(config: SchedulerConfig): Promise<void> {
    try {
      console.log('🤖 Generating monthly agent performance report...');

      const reportConfig = {
        reportType: ReportType.AGENT_PERFORMANCE,
        timeframe: {
          start: this.getMonthStart(),
          end: new Date(),
          period: 'monthly' as const,
        },
      };

      const report = await this.reportCompiler.execute(
        'Generate monthly agent performance report',
        {},
        reportConfig
      );

      if (report.success) {
        await this.sendNotification({
          type: 'REPORT_READY',
          priority: 'MEDIUM',
          title: 'Monthly Agent Performance Report',
          message: `Agent performance analysis for ${new Date().toLocaleDateString('en-US', { month: 'long' })} is ready. System health: ${(report.data.businessImpact * 100).toFixed(1)}%`,
          data: {
            reportId: report.data.reportId,
            systemHealth: report.data.businessImpact,
          },
          recipients: ['tech-lead@company.com', 'cmo@company.com'],
          channels: ['email', 'dashboard'],
        });
      }
    } catch (error) {
      console.error('Failed to generate agent performance report:', error);
    }
  }

  private async generateBrandConsistencyAudit(config: SchedulerConfig): Promise<void> {
    try {
      console.log('🎨 Generating quarterly brand consistency audit...');

      const reportConfig = {
        reportType: ReportType.BRAND_CONSISTENCY_AUDIT,
        timeframe: {
          start: this.getQuarterStart(),
          end: new Date(),
          period: 'quarterly' as const,
        },
      };

      const report = await this.reportCompiler.execute(
        'Generate quarterly brand consistency audit',
        {},
        reportConfig
      );

      if (report.success) {
        await this.sendNotification({
          type: 'REPORT_READY',
          priority: 'HIGH',
          title: 'Quarterly Brand Consistency Audit',
          message:
            'Comprehensive brand alignment analysis for the quarter is complete. Review recommended for strategic planning.',
          data: {
            reportId: report.data.reportId,
            brandScore: report.data.businessImpact,
          },
          recipients: ['brand-manager@company.com', 'cmo@company.com'],
          channels: ['email', 'dashboard'],
        });
      }
    } catch (error) {
      console.error('Failed to generate brand consistency audit:', error);
    }
  }

  private async monitorSystemHealth(config: SchedulerConfig): Promise<void> {
    // Mock system health checks
    const healthMetrics = {
      agentSuccessRate: 0.91,
      avgCampaignROAS: 1.85,
      systemUptime: 0.998,
      costEfficiency: 0.87,
      brandAlignment: 0.84,
    };

    // Check for issues requiring immediate attention
    const issues: string[] = [];

    if (healthMetrics.agentSuccessRate < 0.8) {
      issues.push(
        `Agent success rate below threshold: ${(healthMetrics.agentSuccessRate * 100).toFixed(1)}%`
      );
    }

    if (healthMetrics.avgCampaignROAS < config.performanceThresholds.lowROAS) {
      issues.push(`Average ROAS below target: ${healthMetrics.avgCampaignROAS}x`);
    }

    if (healthMetrics.brandAlignment < config.performanceThresholds.criticalBrandAlignment) {
      issues.push(
        `Brand alignment critically low: ${(healthMetrics.brandAlignment * 100).toFixed(1)}%`
      );
    }

    if (issues.length > 0) {
      await this.sendNotification({
        type: 'ALERT',
        priority: 'HIGH',
        title: 'System Health Alert',
        message: `${issues.length} performance issues detected requiring attention.`,
        data: { issues, metrics: healthMetrics },
        recipients: ['cmo@company.com', 'tech-lead@company.com'],
        channels: ['email', 'slack', 'dashboard'],
      });
    }
  }

  private async sendNotification(payload: NotificationPayload): Promise<void> {
    try {
      console.log(`📢 Sending ${payload.type} notification: ${payload.title}`);

      // Mock notification sending - in real implementation, this would integrate with:
      // - Email service (SendGrid, AWS SES, etc.)
      // - Slack API
      // - Dashboard notification system
      // - Push notifications

      const notificationData = {
        id: `notif_${Date.now()}`,
        ...payload,
        timestamp: new Date().toISOString(),
        delivered: true,
      };

      // Log notification for debugging
      console.log(`✅ Notification sent successfully:`, {
        type: payload.type,
        priority: payload.priority,
        title: payload.title,
        channels: payload.channels,
        recipients: payload.recipients.length,
      });

      // In real implementation, store in notification log
      // await this.storeNotificationLog(notificationData);
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }

  // Helper methods
  private async getLastReportDate(reportType: string): Promise<Date | null> {
    // Mock implementation - in real system, query database
    return null;
  }

  private isReportOverdue(lastDate: Date, dayThreshold: number): boolean {
    const daysSince = (Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysSince > dayThreshold;
  }

  private hasGeneratedTodayReport(reportType: string): boolean {
    // Mock implementation - in real system, check database
    return false;
  }

  private async identifyCriticalIssues(
    config: SchedulerConfig
  ): Promise<Array<{ title: string; description: string; data: any }>> {
    // Mock critical issues detection
    return [
      {
        title: 'Campaign Performance Decline',
        description: '2 campaigns showing ROAS below 1.0 in the last 24 hours',
        data: { campaigns: ['holiday_promo', 'q1_launch'], threshold: 1.0 },
      },
    ];
  }

  private async getRecentlyCompletedCampaigns(): Promise<Array<any>> {
    // Mock completed campaigns
    return [
      {
        id: 'campaign_001',
        name: 'Holiday Promotion 2024',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-15'),
        performance: 2.1,
        hasGeneratedSummary: false,
      },
    ];
  }

  private getWeekStart(): Date {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday start
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - daysToSubtract);
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
  }

  private getMonthStart(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }

  private getQuarterStart(): Date {
    const now = new Date();
    const quarter = Math.floor(now.getMonth() / 3);
    return new Date(now.getFullYear(), quarter * 3, 1);
  }

  private getNextScheduledRun(config: SchedulerConfig): string {
    const now = new Date();
    const nextWeekly = new Date();

    // Calculate next weekly digest
    const daysUntilDigest = (config.weeklyDigestDay - now.getDay() + 7) % 7;
    nextWeekly.setDate(now.getDate() + (daysUntilDigest || 7));
    nextWeekly.setHours(config.weeklyDigestHour, 0, 0, 0);

    return nextWeekly.toISOString();
  }

  public stop(): void {
    if (this.scheduleInterval) {
      clearInterval(this.scheduleInterval);
      this.scheduleInterval = null;
    }
    this.isRunning = false;
    console.log('🛑 ExecutiveReportScheduler stopped');
  }
}
