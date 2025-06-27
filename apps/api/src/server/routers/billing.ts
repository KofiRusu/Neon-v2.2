import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { prisma } from '@neon/data-model';
import { AgentType } from '@prisma/client';

// Agent cost mapping (cost per 1K tokens)
export const AGENT_COST_PER_1K_TOKENS = {
  CONTENT: 0.04,
  SEO: 0.03,
  EMAIL_MARKETING: 0.05,
  SOCIAL_POSTING: 0.03,
  CUSTOMER_SUPPORT: 0.04,
  AD: 0.06,
  OUTREACH: 0.04,
  TREND: 0.03,
  INSIGHT: 0.05,
  DESIGN: 0.07,
  BRAND_VOICE: 0.04,
  GOAL_PLANNER: 0.05,
  PATTERN_MINER: 0.04,
  SEGMENT_ANALYZER: 0.05,
} as const;

// Global budget override flag
let BUDGET_OVERRIDE_ENABLED = false;

export const billingRouter = createTRPCRouter({
  // Log agent execution cost
  logAgentCost: publicProcedure
    .input(
      z.object({
        agentType: z.nativeEnum(AgentType),
        campaignId: z.string().optional(),
        tokens: z.number().min(0),
        task: z.string().optional(),
        executionId: z.string().optional(),
        metadata: z.any().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { agentType, campaignId, tokens, task, executionId, metadata } = input;

      // Calculate cost based on agent type and tokens
      const costPer1K = AGENT_COST_PER_1K_TOKENS[agentType] || 0.04;
      const cost = (tokens / 1000) * costPer1K;

      // Log the billing entry
      const billingLog = await prisma.billingLog.create({
        data: {
          agentType,
          campaignId,
          tokens,
          cost,
          task,
          executionId,
          metadata,
        },
      });

      // Update campaign cost if campaign is specified
      if (campaignId) {
        const currentMonth = new Date().toISOString().substring(0, 7); // Format: "2024-01"

        await prisma.campaignCost.upsert({
          where: {
            campaignId,
          },
          update: {
            totalCost: {
              increment: cost,
            },
            currentMonth,
          },
          create: {
            campaignId,
            totalCost: cost,
            currentMonth,
          },
        });
      }

      // Update monthly budget
      const currentMonth = new Date().toISOString().substring(0, 7);
      await prisma.monthlyBudget.upsert({
        where: {
          month: currentMonth,
        },
        update: {
          totalSpent: {
            increment: cost,
          },
        },
        create: {
          month: currentMonth,
          totalSpent: cost,
        },
      });

      return billingLog;
    }),

  // Get campaign spend data
  getCampaignSpend: publicProcedure
    .input(
      z.object({
        campaignId: z.string(),
        month: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const { campaignId, month } = input;
      const currentMonth = month || new Date().toISOString().substring(0, 7);

      // Get campaign cost summary
      const campaignCost = await prisma.campaignCost.findUnique({
        where: { campaignId },
        include: { campaign: true },
      });

      // Get detailed billing logs for the campaign
      const billingLogs = await prisma.billingLog.findMany({
        where: {
          campaignId,
          timestamp: {
            gte: new Date(`${currentMonth}-01`),
            lt: new Date(`${currentMonth}-31T23:59:59`),
          },
        },
        orderBy: { timestamp: 'desc' },
      });

      // Group by agent type
      const agentCosts = billingLogs.reduce(
        (acc, log) => {
          const agentType = log.agentType;
          if (!acc[agentType]) {
            acc[agentType] = {
              totalCost: 0,
              totalTokens: 0,
              executions: 0,
            };
          }
          acc[agentType].totalCost += log.cost;
          acc[agentType].totalTokens += log.tokens;
          acc[agentType].executions++;
          return acc;
        },
        {} as Record<string, { totalCost: number; totalTokens: number; executions: number }>
      );

      return {
        campaignCost,
        agentCosts,
        billingLogs,
        totalSpent: billingLogs.reduce((sum, log) => sum + log.cost, 0),
      };
    }),

  // Get agent cost breakdown
  getAgentCosts: publicProcedure
    .input(
      z.object({
        month: z.string().optional(),
        agentType: z.nativeEnum(AgentType).optional(),
      })
    )
    .query(async ({ input }) => {
      const { month, agentType } = input;
      const currentMonth = month || new Date().toISOString().substring(0, 7);

      const whereClause = {
        timestamp: {
          gte: new Date(`${currentMonth}-01`),
          lt: new Date(`${currentMonth}-31T23:59:59`),
        },
        ...(agentType && { agentType }),
      };

      const billingLogs = await prisma.billingLog.findMany({
        where: whereClause,
        include: { campaign: true },
        orderBy: { timestamp: 'desc' },
      });

      // Group by agent type
      const agentSummary = billingLogs.reduce(
        (acc, log) => {
          const type = log.agentType;
          if (!acc[type]) {
            acc[type] = {
              totalCost: 0,
              totalTokens: 0,
              executions: 0,
              campaigns: new Set(),
            };
          }
          acc[type].totalCost += log.cost;
          acc[type].totalTokens += log.tokens;
          acc[type].executions++;
          if (log.campaignId) {
            acc[type].campaigns.add(log.campaignId);
          }
          return acc;
        },
        {} as Record<
          string,
          { totalCost: number; totalTokens: number; executions: number; campaigns: Set<string> }
        >
      );

      // Convert sets to arrays for JSON serialization
      const agentSummaryFormatted = Object.entries(agentSummary).map(([agentType, data]) => ({
        agentType,
        totalCost: data.totalCost,
        totalTokens: data.totalTokens,
        executions: data.executions,
        campaignCount: data.campaigns.size,
        averageCostPerExecution: data.executions > 0 ? data.totalCost / data.executions : 0,
      }));

      return {
        agentSummary: agentSummaryFormatted,
        billingLogs,
        totalSpent: billingLogs.reduce((sum, log) => sum + log.cost, 0),
      };
    }),

  // Get monthly spend summary (for admin dashboard)
  getMonthlySpendSummary: publicProcedure
    .input(
      z.object({
        month: z.string(),
      })
    )
    .query(async ({ input }) => {
      const { month } = input;

      // Get monthly budget
      const monthlyBudget = await prisma.monthlyBudget.findUnique({
        where: { month },
      });

      // Get all campaigns with costs this month
      const campaignCosts = await prisma.campaignCost.findMany({
        where: { currentMonth: month },
        include: { campaign: true },
        orderBy: { totalCost: 'desc' },
      });

      // Get billing logs for detailed breakdown
      const billingLogs = await prisma.billingLog.findMany({
        where: {
          timestamp: {
            gte: new Date(`${month}-01`),
            lt: new Date(`${month}-31T23:59:59`),
          },
        },
        include: { campaign: true },
        orderBy: { timestamp: 'desc' },
      });

      // Prepare campaign breakdown with agent details
      const campaignBreakdown = campaignCosts.map(campaignCost => {
        const campaignLogs = billingLogs.filter(log => log.campaignId === campaignCost.campaignId);

        // Group by agent type for this campaign
        const agents = campaignLogs.reduce(
          (acc, log) => {
            const agentType = log.agentType;
            if (!acc[agentType]) {
              acc[agentType] = {
                cost: 0,
                tokens: 0,
                executions: 0,
              };
            }
            acc[agentType].cost += log.cost;
            acc[agentType].tokens += log.tokens;
            acc[agentType].executions++;
            return acc;
          },
          {} as Record<string, { cost: number; tokens: number; executions: number }>
        );

        return {
          id: campaignCost.campaignId,
          name: campaignCost.campaign.name,
          type: campaignCost.campaign.type,
          cost: campaignCost.totalCost,
          tokens: campaignLogs.reduce((sum, log) => sum + log.tokens, 0),
          executions: campaignLogs.length,
          agents,
        };
      });

      const totalSpent = monthlyBudget?.totalSpent || 0;
      const budgetAmount = monthlyBudget?.totalBudget || 1000;
      const utilizationPercentage = (totalSpent / budgetAmount) * 100;
      const remainingBudget = budgetAmount - totalSpent;
      const isOverBudget = totalSpent > budgetAmount;
      const isNearBudget = utilizationPercentage >= (monthlyBudget?.alertThreshold || 0.8) * 100;

      return {
        budgetAmount,
        totalSpent,
        utilizationPercentage,
        remainingBudget,
        isOverBudget,
        isNearBudget,
        totalExecutions: billingLogs.length,
        campaignBreakdown,
      };
    }),

  // Get all campaigns spend (for admin dashboard)
  getAllCampaignsSpend: publicProcedure.input(z.object({})).query(async () => {
    // Get all campaign costs
    const campaignCosts = await prisma.campaignCost.findMany({
      include: { campaign: true },
      orderBy: { totalCost: 'desc' },
    });

    return campaignCosts.map(campaignCost => ({
      id: campaignCost.campaignId,
      name: campaignCost.campaign.name,
      type: campaignCost.campaign.type,
      totalCost: campaignCost.totalCost,
      monthlyBudget: campaignCost.monthlyBudget,
      currentMonth: campaignCost.currentMonth,
      lastUpdated: campaignCost.lastUpdated,
    }));
  }),

  // Set monthly budget cap (for admin dashboard)
  setMonthlyBudgetCap: publicProcedure
    .input(
      z.object({
        month: z.string(),
        amount: z.number().min(0),
      })
    )
    .mutation(async ({ input }) => {
      const { month, amount } = input;

      const updatedBudget = await prisma.monthlyBudget.upsert({
        where: { month },
        update: {
          totalBudget: amount,
        },
        create: {
          month,
          totalBudget: amount,
          totalSpent: 0,
        },
      });

      return updatedBudget;
    }),

  // Set budget override (for admin dashboard)
  setBudgetOverride: publicProcedure
    .input(
      z.object({
        enabled: z.boolean(),
        month: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const { enabled } = input;

      // Set global override flag
      BUDGET_OVERRIDE_ENABLED = enabled;

      // Log this action for audit purposes
      console.log(
        `Budget override ${enabled ? 'ENABLED' : 'DISABLED'} at ${new Date().toISOString()}`
      );

      return { success: true, overrideEnabled: BUDGET_OVERRIDE_ENABLED };
    }),

  // Check if budget is exceeded (for agents to use before executing)
  checkBudgetStatus: publicProcedure
    .input(
      z.object({
        month: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const { month } = input;
      const currentMonth = month || new Date().toISOString().substring(0, 7);

      const monthlyBudget = await prisma.monthlyBudget.findUnique({
        where: { month: currentMonth },
      });

      if (!monthlyBudget) {
        return {
          canExecute: true,
          isOverBudget: false,
          overrideEnabled: BUDGET_OVERRIDE_ENABLED,
          utilizationPercentage: 0,
        };
      }

      const isOverBudget = monthlyBudget.totalSpent > monthlyBudget.totalBudget;
      const utilizationPercentage = (monthlyBudget.totalSpent / monthlyBudget.totalBudget) * 100;
      const canExecute = !isOverBudget || BUDGET_OVERRIDE_ENABLED;

      return {
        canExecute,
        isOverBudget,
        overrideEnabled: BUDGET_OVERRIDE_ENABLED,
        utilizationPercentage,
        totalSpent: monthlyBudget.totalSpent,
        totalBudget: monthlyBudget.totalBudget,
        remainingBudget: monthlyBudget.totalBudget - monthlyBudget.totalSpent,
      };
    }),

  // Get monthly budget summary (legacy method)
  getMonthlySummary: publicProcedure
    .input(
      z.object({
        month: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const { month } = input;
      const currentMonth = month || new Date().toISOString().substring(0, 7);

      // Get monthly budget
      const monthlyBudget = await prisma.monthlyBudget.findUnique({
        where: { month: currentMonth },
      });

      // Get all campaigns with costs this month
      const campaignCosts = await prisma.campaignCost.findMany({
        where: { currentMonth },
        include: { campaign: true },
        orderBy: { totalCost: 'desc' },
      });

      // Get billing logs for detailed breakdown
      const billingLogs = await prisma.billingLog.findMany({
        where: {
          timestamp: {
            gte: new Date(`${currentMonth}-01`),
            lt: new Date(`${currentMonth}-31T23:59:59`),
          },
        },
        orderBy: { timestamp: 'desc' },
        take: 50, // Recent 50 transactions
      });

      // Calculate projections
      const currentDate = new Date();
      const monthStart = new Date(`${currentMonth}-01`);
      const daysInMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0
      ).getDate();
      const daysPassed = Math.max(1, currentDate.getDate() - monthStart.getDate());
      const dailySpendRate = (monthlyBudget?.totalSpent || 0) / daysPassed;
      const projectedSpend = dailySpendRate * daysInMonth;

      return {
        monthlyBudget: monthlyBudget || {
          month: currentMonth,
          totalBudget: 1000,
          totalSpent: 0,
          alertThreshold: 0.8,
          isAlertSent: false,
        },
        campaignCosts,
        billingLogs,
        projectedSpend,
        budgetUtilization: monthlyBudget
          ? (monthlyBudget.totalSpent / monthlyBudget.totalBudget) * 100
          : 0,
        isOverBudget: monthlyBudget ? monthlyBudget.totalSpent > monthlyBudget.totalBudget : false,
        isNearBudget: monthlyBudget
          ? monthlyBudget.totalSpent / monthlyBudget.totalBudget >= monthlyBudget.alertThreshold
          : false,
      };
    }),

  // Update monthly budget
  updateMonthlyBudget: publicProcedure
    .input(
      z.object({
        month: z.string(),
        totalBudget: z.number().min(0),
        alertThreshold: z.number().min(0).max(1).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { month, totalBudget, alertThreshold } = input;

      const updatedBudget = await prisma.monthlyBudget.upsert({
        where: { month },
        update: {
          totalBudget,
          ...(alertThreshold && { alertThreshold }),
        },
        create: {
          month,
          totalBudget,
          alertThreshold: alertThreshold || 0.8,
        },
      });

      return updatedBudget;
    }),

  // Set campaign budget
  setCampaignBudget: publicProcedure
    .input(
      z.object({
        campaignId: z.string(),
        monthlyBudget: z.number().min(0),
      })
    )
    .mutation(async ({ input }) => {
      const { campaignId, monthlyBudget } = input;
      const currentMonth = new Date().toISOString().substring(0, 7);

      const updatedCampaign = await prisma.campaignCost.upsert({
        where: { campaignId },
        update: {
          monthlyBudget,
          currentMonth,
        },
        create: {
          campaignId,
          monthlyBudget,
          currentMonth,
        },
      });

      return updatedCampaign;
    }),

  // Get cost constants
  getCostConstants: publicProcedure.query(async () => {
    return {
      agentCosts: AGENT_COST_PER_1K_TOKENS,
      lastUpdated: new Date().toISOString(),
    };
  }),
});
