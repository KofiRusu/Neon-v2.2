import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { db as prisma } from '@neon/data-model';

// Define AgentType enum locally (should be added to data model exports)
enum AgentType {
  CONTENT = 'CONTENT',
  SEO = 'SEO',
  EMAIL_MARKETING = 'EMAIL_MARKETING',
  SOCIAL_POSTING = 'SOCIAL_POSTING',
  CUSTOMER_SUPPORT = 'CUSTOMER_SUPPORT',
  AD = 'AD',
  OUTREACH = 'OUTREACH',
  TREND = 'TREND',
  INSIGHT = 'INSIGHT',
  DESIGN = 'DESIGN',
  BRAND_VOICE = 'BRAND_VOICE',
  GOAL_PLANNER = 'GOAL_PLANNER',
  PATTERN_MINER = 'PATTERN_MINER',
  SEGMENT_ANALYZER = 'SEGMENT_ANALYZER',
}

// Input schemas
const campaignExecutionVolumeSchema = z.object({
  campaignId: z.string(),
  timeRange: z.enum(['24h', '7d', '30d']).default('24h'),
  groupBy: z.enum(['hour', 'day']).default('hour'),
});

const sentimentTrendsSchema = z.object({
  region: z.string().default('UAE'),
  language: z.enum(['ar', 'en', 'all']).default('all'),
  timeRange: z.enum(['24h', '7d', '30d']).default('7d'),
  campaignId: z.string().optional(),
});

const pacingForecastSchema = z.object({
  campaignId: z.string(),
  budget: z.number(),
  spendSoFar: z.number(),
  daysElapsed: z.number(),
  totalDays: z.number(),
});

const budgetOptimizationSchema = z.object({
  campaignId: z.string(),
  currentRoi: z.number(),
  targetRoi: z.number().default(2.0),
  timeWindow: z.number().default(7), // days
});

export const launchIntelligenceRouter = createTRPCRouter({
  // Get campaign execution volume metrics
  getCampaignExecutionVolume: publicProcedure
    .input(campaignExecutionVolumeSchema)
    .query(async ({ input }) => {
      const { campaignId, timeRange, groupBy } = input;

      // Calculate time range
      const now = new Date();
      const startDate = new Date();
      switch (timeRange) {
        case '24h':
          startDate.setHours(now.getHours() - 24);
          break;
        case '7d':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(now.getDate() - 30);
          break;
      }

      // Get execution metrics
      const metrics = await prisma.campaignExecutionMetric.findMany({
        where: {
          campaignId,
          date: {
            gte: startDate,
          },
        },
        include: {
          campaign: {
            select: { name: true, type: true },
          },
        },
        orderBy: { date: 'asc' },
      });

      // Group and aggregate data
      const grouped = metrics.reduce(
        (acc, metric) => {
          const key =
            groupBy === 'hour'
              ? `${metric.date.toISOString().substring(0, 13)}:00:00Z`
              : metric.date.toISOString().substring(0, 10);

          if (!acc[key]) {
            acc[key] = {
              timestamp: key,
              totalExecutions: 0,
              successfulExecutions: 0,
              failedExecutions: 0,
              totalCost: 0,
              avgExecutionTime: 0,
              agentBreakdown: {} as Record<string, number>,
            };
          }

          acc[key].totalExecutions += metric.executionCount;
          acc[key].successfulExecutions += metric.successCount;
          acc[key].failedExecutions += metric.failureCount;
          acc[key].totalCost += metric.totalCost;
          acc[key].avgExecutionTime += metric.avgExecutionTime;
          acc[key].agentBreakdown[metric.agentType] =
            (acc[key].agentBreakdown[metric.agentType] || 0) + metric.executionCount;

          return acc;
        },
        {} as Record<string, any>
      );

      const volumeData = Object.values(grouped);

      // Calculate totals and trends
      const totalExecutions = volumeData.reduce((sum, d) => sum + d.totalExecutions, 0);
      const totalCost = volumeData.reduce((sum, d) => sum + d.totalCost, 0);
      const avgSuccessRate =
        volumeData.length > 0
          ? volumeData.reduce(
              (sum, d) => sum + d.successfulExecutions / (d.totalExecutions || 1),
              0
            ) / volumeData.length
          : 0;

      // Calculate trend (comparing first half vs second half)
      const midpoint = Math.floor(volumeData.length / 2);
      const firstHalf = volumeData.slice(0, midpoint);
      const secondHalf = volumeData.slice(midpoint);

      const firstHalfAvg =
        firstHalf.length > 0
          ? firstHalf.reduce((sum, d) => sum + d.totalExecutions, 0) / firstHalf.length
          : 0;
      const secondHalfAvg =
        secondHalf.length > 0
          ? secondHalf.reduce((sum, d) => sum + d.totalExecutions, 0) / secondHalf.length
          : 0;

      const trend = firstHalfAvg > 0 ? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100 : 0;

      return {
        volumeData,
        summary: {
          totalExecutions,
          totalCost,
          avgSuccessRate: avgSuccessRate * 100,
          trend: {
            direction: trend > 5 ? 'up' : trend < -5 ? 'down' : 'stable',
            percentage: Math.abs(trend),
          },
        },
        campaignInfo: metrics[0]?.campaign || null,
      };
    }),

  // Get sentiment trends for region and language
  getSentimentTrends: publicProcedure.input(sentimentTrendsSchema).query(async ({ input }) => {
    const { region, language, timeRange, campaignId } = input;

    const startDate = new Date();
    switch (timeRange) {
      case '24h':
        startDate.setHours(startDate.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
    }

    const whereClause = {
      region,
      createdAt: { gte: startDate },
      ...(language !== 'all' && { language }),
      ...(campaignId && { campaignId }),
    };

    const sentimentData = await prisma.sentimentAnalysis.findMany({
      where: whereClause,
      orderBy: { createdAt: 'asc' },
      include: {
        campaign: {
          select: { name: true },
        },
      },
    });

    // Group by day and sentiment
    const dailyTrends = sentimentData.reduce(
      (acc, item) => {
        const day = item.createdAt.toISOString().substring(0, 10);

        if (!acc[day]) {
          acc[day] = {
            date: day,
            positive: 0,
            negative: 0,
            neutral: 0,
            total: 0,
            avgScore: 0,
            languages: { ar: 0, en: 0 },
            sources: {} as Record<string, number>,
          };
        }

        acc[day][item.sentiment as keyof (typeof acc)[typeof day]]++;
        acc[day].total++;
        acc[day].avgScore += item.score;
        acc[day].languages[item.language as keyof (typeof acc)[typeof day]['languages']]++;
        acc[day].sources[item.source] = (acc[day].sources[item.source] || 0) + 1;

        return acc;
      },
      {} as Record<string, any>
    );

    // Calculate averages
    Object.values(dailyTrends).forEach((day: any) => {
      day.avgScore = day.total > 0 ? day.avgScore / day.total : 0;
      day.positivePercent = day.total > 0 ? (day.positive / day.total) * 100 : 0;
      day.negativePercent = day.total > 0 ? (day.negative / day.total) * 100 : 0;
      day.neutralPercent = day.total > 0 ? (day.neutral / day.total) * 100 : 0;
    });

    const trends = Object.values(dailyTrends);

    // Calculate overall statistics
    const totalMentions = sentimentData.length;
    const avgSentimentScore =
      totalMentions > 0
        ? sentimentData.reduce((sum, item) => sum + item.score, 0) / totalMentions
        : 0;

    const sentimentBreakdown = sentimentData.reduce(
      (acc, item) => {
        acc[item.sentiment] = (acc[item.sentiment] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const languageBreakdown = sentimentData.reduce(
      (acc, item) => {
        acc[item.language] = (acc[item.language] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      trends,
      summary: {
        totalMentions,
        avgSentimentScore,
        sentimentBreakdown,
        languageBreakdown,
        dominantSentiment: Object.keys(sentimentBreakdown).reduce(
          (a, b) => (sentimentBreakdown[a] > sentimentBreakdown[b] ? a : b),
          'neutral'
        ),
      },
    };
  }),

  // Get budget pacing forecast
  getPacingForecast: publicProcedure.input(pacingForecastSchema).query(async ({ input }) => {
    const { campaignId, budget, spendSoFar, daysElapsed, totalDays } = input;

    // Get historical pacing data
    const pacingData = await prisma.budgetPacing.findMany({
      where: { campaignId },
      orderBy: { dayOfCampaign: 'asc' },
    });

    // Calculate current pacing metrics
    const dailyBudget = budget / totalDays;
    const plannedSpendToDate = dailyBudget * daysElapsed;
    const pacingVariance =
      spendSoFar > 0 ? ((spendSoFar - plannedSpendToDate) / plannedSpendToDate) * 100 : 0;
    const currentDailyRate = daysElapsed > 0 ? spendSoFar / daysElapsed : 0;
    const projectedTotal = currentDailyRate * totalDays;
    const remainingDays = totalDays - daysElapsed;
    const remainingBudget = budget - spendSoFar;
    const recommendedDailySpend = remainingDays > 0 ? remainingBudget / remainingDays : 0;

    // Forecast scenarios
    const scenarios = {
      current_pace: {
        name: 'Current Pace',
        projectedTotal,
        budgetUtilization: (projectedTotal / budget) * 100,
        dailySpend: currentDailyRate,
      },
      planned_pace: {
        name: 'Planned Pace',
        projectedTotal: budget,
        budgetUtilization: 100,
        dailySpend: dailyBudget,
      },
      recommended_pace: {
        name: 'Recommended Pace',
        projectedTotal: budget,
        budgetUtilization: 100,
        dailySpend: recommendedDailySpend,
      },
    };

    // Calculate pacing status
    let pacingStatus = 'on_track';
    if (Math.abs(pacingVariance) > 20) {
      pacingStatus = pacingVariance > 0 ? 'overspending' : 'underspending';
    }

    // Get performance data for ROI calculation
    const performanceData = pacingData.reduce(
      (acc, day) => {
        acc.totalRevenue += day.revenue || 0;
        acc.totalConversions += day.conversions || 0;
        acc.totalClicks += day.clicks || 0;
        acc.totalImpressions += day.impressions || 0;
        return acc;
      },
      {
        totalRevenue: 0,
        totalConversions: 0,
        totalClicks: 0,
        totalImpressions: 0,
      }
    );

    const currentRoi = spendSoFar > 0 ? performanceData.totalRevenue / spendSoFar : 0;

    return {
      currentPacing: {
        spendSoFar,
        plannedSpendToDate,
        variance: pacingVariance,
        status: pacingStatus,
        daysElapsed,
        remainingDays,
        remainingBudget,
      },
      forecast: scenarios,
      performance: {
        currentRoi,
        conversions: performanceData.totalConversions,
        ctr:
          performanceData.totalImpressions > 0
            ? (performanceData.totalClicks / performanceData.totalImpressions) * 100
            : 0,
        conversionRate:
          performanceData.totalClicks > 0
            ? (performanceData.totalConversions / performanceData.totalClicks) * 100
            : 0,
      },
      recommendations: {
        dailySpendAdjustment: recommendedDailySpend - currentDailyRate,
        pacingAction:
          pacingStatus === 'overspending'
            ? 'reduce_spend'
            : pacingStatus === 'underspending'
              ? 'increase_spend'
              : 'maintain',
      },
    };
  }),

  // Get launch optimization recommendations
  getLaunchOptimizations: publicProcedure
    .input(budgetOptimizationSchema)
    .query(async ({ input }) => {
      const { campaignId, currentRoi, targetRoi, timeWindow } = input;

      // Get recent optimization history
      const existingOptimizations = await prisma.budgetOptimization.findMany({
        where: {
          campaignId,
          createdAt: {
            gte: new Date(Date.now() - timeWindow * 24 * 60 * 60 * 1000),
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Get campaign performance data
      const pacingData = await prisma.budgetPacing.findMany({
        where: {
          campaignId,
          date: {
            gte: new Date(Date.now() - timeWindow * 24 * 60 * 60 * 1000),
          },
        },
        orderBy: { date: 'desc' },
      });

      // Calculate performance trends
      const avgRoi =
        pacingData.length > 0
          ? pacingData.reduce((sum, day) => sum + (day.roi || 0), 0) / pacingData.length
          : 0;

      const roiTrend =
        pacingData.length >= 2
          ? ((pacingData[0].roi || 0) - (pacingData[pacingData.length - 1].roi || 0)) /
            (pacingData[pacingData.length - 1].roi || 1)
          : 0;

      // Generate recommendations
      const recommendations = [];

      if (currentRoi < targetRoi) {
        if (roiTrend < -0.1) {
          // ROI is declining
          recommendations.push({
            type: 'decrease_budget',
            priority: 'high',
            title: 'Reduce Budget - Declining ROI',
            description: `ROI has dropped ${(Math.abs(roiTrend) * 100).toFixed(1)}% recently. Consider reducing spend to improve efficiency.`,
            confidence: 0.8,
            expectedImprovement: 0.3,
            action: 'reduce_daily_budget',
            parameters: { reduction: 0.2 },
          });
        } else {
          recommendations.push({
            type: 'optimize_targeting',
            priority: 'medium',
            title: 'Optimize Targeting',
            description: 'ROI below target. Consider refining audience targeting or ad creative.',
            confidence: 0.6,
            expectedImprovement: 0.2,
            action: 'review_targeting',
            parameters: { focus: 'high_converting_segments' },
          });
        }
      }

      if (currentRoi > targetRoi * 1.5) {
        // Very high ROI - opportunity to scale
        recommendations.push({
          type: 'increase_budget',
          priority: 'high',
          title: 'Scale Up - High ROI',
          description: `ROI is ${currentRoi.toFixed(1)}x, well above target. Consider increasing budget to capture more conversions.`,
          confidence: 0.9,
          expectedImprovement: 0.4,
          action: 'increase_daily_budget',
          parameters: { increase: 0.3 },
        });
      }

      // Check for budget pacing issues
      const latestPacing = pacingData[0];
      if (latestPacing && Math.abs(latestPacing.variance) > 25) {
        recommendations.push({
          type: 'pacing_adjustment',
          priority: latestPacing.variance > 0 ? 'high' : 'medium',
          title: `${latestPacing.variance > 0 ? 'Overspending' : 'Underspending'} Alert`,
          description: `Campaign is ${latestPacing.variance > 0 ? 'over' : 'under'}spending by ${Math.abs(latestPacing.variance).toFixed(1)}%.`,
          confidence: 0.9,
          expectedImprovement: 0.2,
          action: latestPacing.variance > 0 ? 'reduce_daily_budget' : 'increase_daily_budget',
          parameters: { adjustment: Math.abs(latestPacing.variance) / 100 },
        });
      }

      return {
        recommendations,
        metrics: {
          currentRoi,
          avgRoi,
          targetRoi,
          roiTrend: roiTrend * 100, // as percentage
          pacingVariance: latestPacing?.variance || 0,
        },
        history: existingOptimizations.map(opt => ({
          type: opt.recommendationType,
          appliedAt: opt.appliedAt,
          status: opt.status,
          confidence: opt.confidence,
        })),
      };
    }),

  // Get launch alerts
  getLaunchAlerts: publicProcedure
    .input(
      z.object({
        campaignId: z.string().optional(),
        region: z.string().default('UAE'),
        severity: z.enum(['info', 'warning', 'critical']).optional(),
        resolved: z.boolean().optional(),
        limit: z.number().default(20),
      })
    )
    .query(async ({ input }) => {
      const { campaignId, region, severity, resolved, limit } = input;

      const alerts = await prisma.launchAlert.findMany({
        where: {
          ...(campaignId && { campaignId }),
          region,
          ...(severity && { severity }),
          ...(resolved !== undefined && { isResolved: resolved }),
        },
        include: {
          campaign: {
            select: { name: true, type: true },
          },
        },
        orderBy: [
          { severity: 'desc' }, // Critical first
          { createdAt: 'desc' },
        ],
        take: limit,
      });

      const alertsByType = alerts.reduce(
        (acc, alert) => {
          acc[alert.alertType] = (acc[alert.alertType] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      const alertsBySeverity = alerts.reduce(
        (acc, alert) => {
          acc[alert.severity] = (acc[alert.severity] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      return {
        alerts,
        summary: {
          total: alerts.length,
          unresolved: alerts.filter(a => !a.isResolved).length,
          critical: alerts.filter(a => a.severity === 'critical').length,
          byType: alertsByType,
          bySeverity: alertsBySeverity,
        },
      };
    }),

  // Create or update execution metrics
  trackExecution: publicProcedure
    .input(
      z.object({
        campaignId: z.string(),
        agentType: z.nativeEnum(AgentType),
        success: z.boolean(),
        executionTime: z.number(),
        cost: z.number(),
        region: z.string().default('UAE'),
      })
    )
    .mutation(async ({ input }) => {
      const { campaignId, agentType, success, executionTime, cost, region } = input;

      const now = new Date();
      const hour = now.getHours();
      const date = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      await prisma.campaignExecutionMetric.upsert({
        where: {
          campaignId_agentType_date_hour: {
            campaignId,
            agentType,
            date,
            hour,
          },
        },
        update: {
          executionCount: { increment: 1 },
          successCount: success ? { increment: 1 } : undefined,
          failureCount: !success ? { increment: 1 } : undefined,
          totalCost: { increment: cost },
          avgExecutionTime: {
            // Update running average
            increment: executionTime,
          },
        },
        create: {
          campaignId,
          agentType,
          date,
          hour,
          region,
          executionCount: 1,
          successCount: success ? 1 : 0,
          failureCount: success ? 0 : 1,
          totalCost: cost,
          avgExecutionTime: executionTime,
        },
      });

      return { success: true };
    }),

  // Create sentiment analysis entry
  trackSentiment: publicProcedure
    .input(
      z.object({
        text: z.string(),
        platform: z.enum([
          'FACEBOOK',
          'INSTAGRAM',
          'TIKTOK',
          'TWITTER',
          'LINKEDIN',
          'YOUTUBE',
          'EMAIL',
          'WEBSITE',
        ]),
        language: z.string(),
        campaignId: z.string().optional(),
        source: z.string(),
        region: z.string().default('UAE'),
        metadata: z.any().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { text, platform, language, campaignId, source, region, metadata } = input;

      // Simple sentiment analysis (in production, use proper NLP service)
      const sentiment = analyzeSentiment(text, language);

      await prisma.sentimentAnalysis.create({
        data: {
          text,
          platform,
          language,
          campaignId,
          source,
          region,
          sentiment: sentiment.label,
          score: sentiment.score,
          confidence: sentiment.confidence,
          metadata,
        },
      });

      return { success: true, sentiment };
    }),
});

// Simple sentiment analysis function (replace with proper NLP service)
function analyzeSentiment(text: string, language: string) {
  const positiveWords =
    language === 'ar'
      ? ['ممتاز', 'رائع', 'جيد', 'مذهل', 'أحب', 'سعيد', 'مفيد']
      : ['great', 'amazing', 'good', 'excellent', 'love', 'happy', 'awesome'];

  const negativeWords =
    language === 'ar'
      ? ['سيء', 'فظيع', 'مشكلة', 'صعب', 'أكره', 'محزن', 'مروع']
      : ['bad', 'terrible', 'hate', 'awful', 'worst', 'sad', 'horrible'];

  const lowerText = text.toLowerCase();
  let score = 0;
  let totalWords = 0;

  positiveWords.forEach(word => {
    const matches = (lowerText.match(new RegExp(word.toLowerCase(), 'g')) || []).length;
    score += matches * 0.1;
    totalWords += matches;
  });

  negativeWords.forEach(word => {
    const matches = (lowerText.match(new RegExp(word.toLowerCase(), 'g')) || []).length;
    score -= matches * 0.1;
    totalWords += matches;
  });

  // Normalize score to -1 to 1 range
  score = Math.max(-1, Math.min(1, score));

  const label = score > 0.1 ? 'positive' : score < -0.1 ? 'negative' : 'neutral';
  const confidence = totalWords > 0 ? Math.min(1, totalWords * 0.3) : 0.5;

  return { label, score, confidence };
}
