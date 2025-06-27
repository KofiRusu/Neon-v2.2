#!/usr/bin/env ts-node

import { prisma } from '@neon/data-model';
import { logger } from '@neon/utils';
import * as fs from 'fs';
import * as path from 'path';

interface BudgetAlert {
  type: 'warning' | 'critical' | 'exceeded';
  month: string;
  totalBudget: number;
  totalSpent: number;
  utilizationPercentage: number;
  remainingBudget: number;
  message: string;
  timestamp: Date;
}

interface CampaignAlert {
  campaignId: string;
  campaignName: string;
  monthlyBudget: number;
  totalCost: number;
  utilizationPercentage: number;
  type: 'warning' | 'exceeded';
  message: string;
}

class BudgetMonitor {
  private logsDir = path.join(process.cwd(), 'logs', 'budget');

  constructor() {
    // Ensure logs directory exists
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
  }

  async checkMonthlyBudgets(): Promise<BudgetAlert[]> {
    const currentMonth = new Date().toISOString().substring(0, 7);
    const alerts: BudgetAlert[] = [];

    try {
      const monthlyBudget = await prisma.monthlyBudget.findUnique({
        where: { month: currentMonth },
      });

      if (!monthlyBudget) {
        // Create default budget if none exists
        await prisma.monthlyBudget.create({
          data: {
            month: currentMonth,
            totalBudget: 1000.0,
            totalSpent: 0.0,
            alertThreshold: 0.8,
          },
        });
        return alerts;
      }

      const utilizationPercentage = (monthlyBudget.totalSpent / monthlyBudget.totalBudget) * 100;
      const remainingBudget = monthlyBudget.totalBudget - monthlyBudget.totalSpent;

      // Check for budget alerts
      if (monthlyBudget.totalSpent > monthlyBudget.totalBudget) {
        // Budget exceeded
        const alert: BudgetAlert = {
          type: 'exceeded',
          month: currentMonth,
          totalBudget: monthlyBudget.totalBudget,
          totalSpent: monthlyBudget.totalSpent,
          utilizationPercentage,
          remainingBudget,
          message: `🚨 BUDGET EXCEEDED: Monthly budget of $${monthlyBudget.totalBudget.toFixed(2)} has been exceeded by $${Math.abs(remainingBudget).toFixed(2)} (${utilizationPercentage.toFixed(1)}% utilization)`,
          timestamp: new Date(),
        };
        alerts.push(alert);
      } else if (utilizationPercentage >= 95) {
        // Critical threshold (95%)
        const alert: BudgetAlert = {
          type: 'critical',
          month: currentMonth,
          totalBudget: monthlyBudget.totalBudget,
          totalSpent: monthlyBudget.totalSpent,
          utilizationPercentage,
          remainingBudget,
          message: `🔥 CRITICAL: ${utilizationPercentage.toFixed(1)}% of monthly budget used. Only $${remainingBudget.toFixed(2)} remaining.`,
          timestamp: new Date(),
        };
        alerts.push(alert);
      } else if (utilizationPercentage >= monthlyBudget.alertThreshold * 100) {
        // Warning threshold (default 80%)
        const alert: BudgetAlert = {
          type: 'warning',
          month: currentMonth,
          totalBudget: monthlyBudget.totalBudget,
          totalSpent: monthlyBudget.totalSpent,
          utilizationPercentage,
          remainingBudget,
          message: `⚠️ WARNING: ${utilizationPercentage.toFixed(1)}% of monthly budget used. $${remainingBudget.toFixed(2)} remaining.`,
          timestamp: new Date(),
        };
        alerts.push(alert);
      }

      // Update alert status if needed
      if (alerts.length > 0 && !monthlyBudget.isAlertSent) {
        await prisma.monthlyBudget.update({
          where: { month: currentMonth },
          data: { isAlertSent: true },
        });
      }

      return alerts;
    } catch (error) {
      logger.error('Failed to check monthly budgets', { error }, 'BudgetMonitor');
      return alerts;
    }
  }

  async checkCampaignBudgets(): Promise<CampaignAlert[]> {
    const alerts: CampaignAlert[] = [];

    try {
      const campaignCosts = await prisma.campaignCost.findMany({
        where: {
          monthlyBudget: { not: null },
        },
        include: { campaign: true },
      });

      for (const campaignCost of campaignCosts) {
        if (!campaignCost.monthlyBudget) continue;

        const utilizationPercentage = (campaignCost.totalCost / campaignCost.monthlyBudget) * 100;

        if (campaignCost.totalCost > campaignCost.monthlyBudget) {
          alerts.push({
            campaignId: campaignCost.campaignId,
            campaignName: campaignCost.campaign.name,
            monthlyBudget: campaignCost.monthlyBudget,
            totalCost: campaignCost.totalCost,
            utilizationPercentage,
            type: 'exceeded',
            message: `Campaign "${campaignCost.campaign.name}" has exceeded budget: $${campaignCost.totalCost.toFixed(2)} / $${campaignCost.monthlyBudget.toFixed(2)}`,
          });
        } else if (utilizationPercentage >= 90) {
          alerts.push({
            campaignId: campaignCost.campaignId,
            campaignName: campaignCost.campaign.name,
            monthlyBudget: campaignCost.monthlyBudget,
            totalCost: campaignCost.totalCost,
            utilizationPercentage,
            type: 'warning',
            message: `Campaign "${campaignCost.campaign.name}" approaching budget limit: ${utilizationPercentage.toFixed(1)}% used`,
          });
        }
      }

      return alerts;
    } catch (error) {
      logger.error('Failed to check campaign budgets', { error }, 'BudgetMonitor');
      return alerts;
    }
  }

  async generateCostReport(): Promise<void> {
    const currentMonth = new Date().toISOString().substring(0, 7);
    const reportDate = new Date().toISOString();

    try {
      // Get monthly summary
      const monthlyBudget = await prisma.monthlyBudget.findUnique({
        where: { month: currentMonth },
      });

      // Get campaign costs
      const campaignCosts = await prisma.campaignCost.findMany({
        where: { currentMonth },
        include: { campaign: true },
        orderBy: { totalCost: 'desc' },
      });

      // Get agent usage breakdown
      const billingLogs = await prisma.billingLog.findMany({
        where: {
          timestamp: {
            gte: new Date(`${currentMonth}-01`),
            lt: new Date(`${currentMonth}-31T23:59:59`),
          },
        },
        orderBy: { timestamp: 'desc' },
      });

      const agentSummary = billingLogs.reduce(
        (acc, log) => {
          const type = log.agentType;
          if (!acc[type]) {
            acc[type] = { totalCost: 0, totalTokens: 0, executions: 0 };
          }
          acc[type].totalCost += log.cost;
          acc[type].totalTokens += log.tokens;
          acc[type].executions++;
          return acc;
        },
        {} as Record<string, { totalCost: number; totalTokens: number; executions: number }>
      );

      // Generate markdown report
      const report = this.generateMarkdownReport({
        reportDate,
        currentMonth,
        monthlyBudget,
        campaignCosts,
        agentSummary,
        totalExecutions: billingLogs.length,
      });

      // Save report
      const reportPath = path.join(this.logsDir, `cost-report-${currentMonth}.md`);
      fs.writeFileSync(reportPath, report);

      logger.info(`Cost report generated: ${reportPath}`, {}, 'BudgetMonitor');
    } catch (error) {
      logger.error('Failed to generate cost report', { error }, 'BudgetMonitor');
    }
  }

  private generateMarkdownReport(data: {
    reportDate: string;
    currentMonth: string;
    monthlyBudget: any;
    campaignCosts: any[];
    agentSummary: Record<string, any>;
    totalExecutions: number;
  }): string {
    const {
      reportDate,
      currentMonth,
      monthlyBudget,
      campaignCosts,
      agentSummary,
      totalExecutions,
    } = data;

    const totalSpent = monthlyBudget?.totalSpent || 0;
    const totalBudget = monthlyBudget?.totalBudget || 1000;
    const utilizationPercentage = (totalSpent / totalBudget) * 100;

    return `# Budget Report - ${currentMonth}

*Generated: ${new Date(reportDate).toLocaleString()}*

## 📊 Monthly Overview

- **Total Budget**: $${totalBudget.toFixed(2)}
- **Total Spent**: $${totalSpent.toFixed(2)}
- **Utilization**: ${utilizationPercentage.toFixed(1)}%
- **Remaining**: $${(totalBudget - totalSpent).toFixed(2)}
- **Total Executions**: ${totalExecutions}

${utilizationPercentage > 100 ? '🚨 **BUDGET EXCEEDED**' : utilizationPercentage > 90 ? '🔥 **APPROACHING LIMIT**' : '✅ **ON TRACK**'}

## 🎯 Campaign Breakdown

${
  campaignCosts.length > 0
    ? campaignCosts
        .map(
          cc =>
            `### ${cc.campaign.name} (${cc.campaign.type})
- **Cost**: $${cc.totalCost.toFixed(2)}
- **Budget**: $${cc.monthlyBudget?.toFixed(2) || 'No limit'}
- **Utilization**: ${cc.monthlyBudget ? ((cc.totalCost / cc.monthlyBudget) * 100).toFixed(1) + '%' : 'N/A'}
`
        )
        .join('\n')
    : 'No campaign costs recorded this month.'
}

## 🤖 Agent Usage

${Object.entries(agentSummary)
  .map(
    ([agentType, data]) =>
      `### ${agentType}
- **Total Cost**: $${data.totalCost.toFixed(2)}
- **Tokens Used**: ${data.totalTokens.toLocaleString()}
- **Executions**: ${data.executions}
- **Avg Cost/Execution**: $${(data.totalCost / data.executions).toFixed(4)}
`
  )
  .join('\n')}

## 💡 Cost Optimization Suggestions

${
  utilizationPercentage > 80
    ? `
- Consider implementing prompt optimization to reduce token usage
- Review high-cost agents for potential model downgrades
- Set campaign-specific budget limits for better control
- Enable budget alerts for proactive monitoring
`
    : `
- Current spending is within healthy limits
- Continue monitoring for any unusual spikes
- Consider allocating unused budget to high-performing campaigns
`
}

---
*This report was automatically generated by NeonHub Budget Monitor*
`;
  }

  async logAlert(alert: BudgetAlert | CampaignAlert, type: 'budget' | 'campaign'): Promise<void> {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${type.toUpperCase()}_ALERT: ${alert.message}\n`;

    const logFile = path.join(this.logsDir, `${type}-alerts.log`);
    fs.appendFileSync(logFile, logEntry);

    // Also create a detailed alert file for critical/exceeded alerts
    if (alert.type === 'critical' || alert.type === 'exceeded') {
      const alertFile = path.join(this.logsDir, `alert-${Date.now()}.json`);
      fs.writeFileSync(alertFile, JSON.stringify(alert, null, 2));
    }
  }

  async runFullCheck(): Promise<void> {
    logger.info('Starting budget monitoring check...', {}, 'BudgetMonitor');

    try {
      // Check monthly budgets
      const monthlyAlerts = await this.checkMonthlyBudgets();
      for (const alert of monthlyAlerts) {
        await this.logAlert(alert, 'budget');
        console.log(alert.message);
      }

      // Check campaign budgets
      const campaignAlerts = await this.checkCampaignBudgets();
      for (const alert of campaignAlerts) {
        await this.logAlert(alert, 'campaign');
        console.log(alert.message);
      }

      // Generate cost report
      await this.generateCostReport();

      logger.info(
        'Budget monitoring check completed',
        {
          monthlyAlerts: monthlyAlerts.length,
          campaignAlerts: campaignAlerts.length,
        },
        'BudgetMonitor'
      );
    } catch (error) {
      logger.error('Budget monitoring check failed', { error }, 'BudgetMonitor');
    }
  }
}

// CLI execution
if (require.main === module) {
  const monitor = new BudgetMonitor();

  const command = process.argv[2] || 'check';

  switch (command) {
    case 'check':
      monitor
        .runFullCheck()
        .then(() => {
          console.log('✅ Budget monitoring completed');
          process.exit(0);
        })
        .catch(error => {
          console.error('❌ Budget monitoring failed:', error);
          process.exit(1);
        });
      break;

    case 'report':
      monitor
        .generateCostReport()
        .then(() => {
          console.log('✅ Cost report generated');
          process.exit(0);
        })
        .catch(error => {
          console.error('❌ Report generation failed:', error);
          process.exit(1);
        });
      break;

    default:
      console.log('Usage: ts-node budget-monitor.ts [check|report]');
      process.exit(1);
  }
}

export default BudgetMonitor;
