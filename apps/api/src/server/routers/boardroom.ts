import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';

// Mock type definitions
interface BoardroomReportConfig {
  reportType: string;
  theme: string;
  quarter?: string;
  timeframe: { start: string; end: string };
  includeForecasts: boolean;
  includeCampaigns: string[];
  includeAgents: string[];
  confidenceThreshold: number;
  maxSlides: number;
}

type PresentationTheme = 'NEON_GLASS' | 'EXECUTIVE_DARK' | 'CMO_LITE' | 'BRANDED' | 'MINIMAL';
type OutputFormat = 'MARKDOWN' | 'HTML' | 'PDF' | 'PPTX';

// Mock PresentationBuilder and other services
const mockPresentationBuilder = {
  buildPresentation: async (report: unknown, config: unknown) => {
    return {
      id: 'pres-001',
      title: 'Mock Presentation',
      metadata: {
        slideCount: 12,
        theme: 'NEON_GLASS',
        generationTime: 1500,
      },
      downloadUrls: {
        pdf: '/downloads/presentation.pdf',
        pptx: '/downloads/presentation.pptx',
      },
    };
  },
};

const mockSchedulerAgent = {
  scheduleReport: async (config: unknown) => {
    return {
      id: 'schedule-001',
      nextRun: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      frequency: 'weekly',
    };
  },
};

// Input validation schemas
const BoardroomReportConfigSchema = z.object({
  reportType: z
    .enum([
      'QBR',
      'MONTHLY_STRATEGY',
      'CAMPAIGN_POSTMORTEM',
      'ANNUAL_REVIEW',
      'BOARD_PRESENTATION',
      'INVESTOR_UPDATE',
    ])
    .default('QBR'),
  theme: z
    .enum(['NEON_GLASS', 'EXECUTIVE_DARK', 'CMO_LITE', 'BRANDED', 'MINIMAL'])
    .default('NEON_GLASS'),
  quarter: z.string().optional(),
  timeframe: z.object({
    start: z.string(),
    end: z.string(),
  }),
  includeForecasts: z.boolean().default(true),
  includeCampaigns: z.array(z.string()).default([]),
  includeAgents: z.array(z.string()).default([]),
  confidenceThreshold: z.number().min(0).max(1).default(0.7),
  maxSlides: z.number().min(5).max(30).default(15),
});

const PresentationConfigSchema = z.object({
  theme: z
    .enum(['NEON_GLASS', 'EXECUTIVE_DARK', 'CMO_LITE', 'BRANDED', 'MINIMAL'])
    .default('NEON_GLASS'),
  formats: z.array(z.enum(['MARKDOWN', 'HTML', 'PDF', 'PPTX'])).default(['HTML', 'PDF']),
  includeTableOfContents: z.boolean().default(true),
  includeCoverPage: z.boolean().default(true),
  includeAppendix: z.boolean().default(true),
  pageSize: z.enum(['A4', 'Letter', '16:9', '4:3']).default('16:9'),
  orientation: z.enum(['portrait', 'landscape']).default('landscape'),
  customBranding: z
    .object({
      logoUrl: z.string().optional(),
      primaryColor: z.string(),
      secondaryColor: z.string(),
      fontFamily: z.string(),
      companyName: z.string(),
      tagline: z.string().optional(),
    })
    .optional(),
});

const ForecastConfigSchema = z.object({
  metricTypes: z
    .array(
      z.enum([
        'roas',
        'conversion_rate',
        'click_through_rate',
        'cost_per_acquisition',
        'brand_alignment_score',
        'engagement_rate',
        'revenue',
        'leads',
        'impressions',
        'reach',
        'agent_efficiency',
      ])
    )
    .default(['roas', 'brand_alignment_score', 'revenue']),
  projectionPeriods: z
    .array(z.enum(['1_month', '3_months', '6_months', '12_months', '24_months']))
    .default(['3_months', '6_months']),
  confidenceThreshold: z.number().min(0).max(1).default(0.7),
  includeSeasonality: z.boolean().default(true),
  includeTrends: z.boolean().default(true),
  benchmarkComparison: z.boolean().default(true),
  riskAssessment: z.boolean().default(true),
  chartGeneration: z.boolean().default(true),
});

const FiltersSchema = z.object({
  reportTypes: z.array(z.string()).optional(),
  dateRange: z
    .object({
      start: z.string(),
      end: z.string(),
    })
    .optional(),
  themes: z.array(z.string()).optional(),
  confidenceThreshold: z.number().min(0).max(1).optional(),
  includeArchived: z.boolean().default(false),
});

const PaginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  sortBy: z.enum(['createdAt', 'overallScore', 'title', 'reportType']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Mock implementations to replace missing modules
const mockBoardroomReportAgent = {
  generateReport: async (config: BoardroomReportConfig) => {
    return {
      id: 'report-001',
      title: 'Mock Quarterly Report',
      subtitle: 'Generated Report',
      reportType: config.reportType,
      quarter: config.quarter,
      theme: config.theme,
      overallScore: 87,
      brandHealthScore: 91,
      overallROAS: 3.4,
      totalRevenue: 1250000,
      keyTakeaways: ['Mock takeaway 1', 'Mock takeaway 2'],
      strategicRecommendations: ['Mock recommendation 1', 'Mock recommendation 2'],
      nextQuarterGoals: ['Mock goal 1', 'Mock goal 2'],
      slides: [],
      forecasts: [],
      generationTime: 2500,
      confidenceScore: 0.85,
      createdAt: new Date(),
      dataPoints: 150,
    };
  },
};

const mockForecastInsightEngine = {
  generateForecast: async (params: Record<string, unknown>) => {
    return {
      forecast: {
        nextQuarter: {
          revenue: 140000,
          growth: 18.5,
          confidence: 0.85,
        },
        nextMonth: {
          revenue: 45000,
          growth: 12.3,
          confidence: 0.92,
        },
      },
      insights: [
        'Revenue trending upward',
        'Strong social media performance',
        'Email campaigns showing improvement',
      ],
      generatedAt: new Date(),
    };
  },
};

// Initialize services
const boardroomReportAgent = mockBoardroomReportAgent;
const forecastEngine = mockForecastInsightEngine;
const presentationBuilder = mockPresentationBuilder;
const schedulerAgent = mockSchedulerAgent;

export const boardroomRouter = createTRPCRouter({
  // Generate a new boardroom report
  generateReport: publicProcedure
    .input(
      z.object({
        config: BoardroomReportConfigSchema,
        presentationConfig: PresentationConfigSchema.optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        console.log('[BoardroomAPI] Generating boardroom report with config:', input.config);

        const startTime = Date.now();

        // Generate the boardroom report
        const report = await boardroomReportAgent.generateReport({
          reportType: input.config.reportType,
          theme: input.config.theme,
          quarter: input.config.quarter,
          timeframe: input.config.timeframe,
          includeForecasts: input.config.includeForecasts,
          includeCampaigns: input.config.includeCampaigns,
          includeAgents: input.config.includeAgents,
          confidenceThreshold: input.config.confidenceThreshold,
          maxSlides: input.config.maxSlides,
        } as BoardroomReportConfig);

        // Generate presentation if config provided
        let presentation = null;
        if (input.presentationConfig) {
          presentation = await presentationBuilder.buildPresentation(report, {
            theme: input.presentationConfig.theme as PresentationTheme,
            format: input.presentationConfig.formats.map(f => f as OutputFormat),
            includeTableOfContents: input.presentationConfig.includeTableOfContents,
            includeCoverPage: input.presentationConfig.includeCoverPage,
            includeAppendix: input.presentationConfig.includeAppendix,
            customBranding: input.presentationConfig.customBranding,
            pageSize: input.presentationConfig.pageSize,
            orientation: input.presentationConfig.orientation,
          });
        }

        const generationTime = Date.now() - startTime;

        console.log(`[BoardroomAPI] Report generated successfully in ${generationTime}ms`);

        return {
          success: true,
          data: {
            report: {
              id: report.id,
              title: report.title,
              subtitle: report.subtitle,
              reportType: report.reportType,
              quarter: report.quarter,
              theme: report.theme,
              overallScore: report.overallScore,
              brandHealthScore: report.brandHealthScore,
              overallROAS: report.overallROAS,
              totalRevenue: report.totalRevenue,
              keyTakeaways: report.keyTakeaways,
              strategicRecommendations: report.strategicRecommendations,
              nextQuarterGoals: report.nextQuarterGoals,
              slides: report.slides.map(slide => ({
                slideNumber: slide.slideNumber,
                slideType: slide.slideType,
                title: slide.title,
                subtitle: slide.subtitle,
                keyTakeaway: slide.keyTakeaway,
                businessContext: slide.businessContext,
                recommendation: slide.recommendation,
                theme: slide.theme,
                layout: slide.layout,
              })),
              forecasts: report.forecasts.map(forecast => ({
                metricName: forecast.metricName,
                currentValue: forecast.currentValue,
                projectedValue: forecast.projectedValue,
                projectionPeriod: forecast.projectionPeriod,
                confidenceLevel: forecast.confidenceLevel,
                businessImpact: forecast.businessImpact,
                strategicPriority: forecast.strategicPriority,
                actionRequired: forecast.actionRequired,
              })),
              generationTime: report.generationTime,
              confidenceScore: report.confidenceScore,
              createdAt: report.createdAt,
            },
            presentation: presentation
              ? {
                  id: presentation.id,
                  title: presentation.title,
                  slideCount: presentation.metadata.slideCount,
                  theme: presentation.metadata.theme,
                  downloadUrls: presentation.downloadUrls,
                  generationTime: presentation.metadata.generationTime,
                }
              : null,
            metadata: {
              totalGenerationTime: generationTime,
              slidesGenerated: report.slides.length,
              forecastsGenerated: report.forecasts.length,
              dataPoints: report.dataPoints,
            },
          },
        };
      } catch (error) {
        console.error('[BoardroomAPI] Error generating report:', error);

        return {
          success: false,
          error: {
            code: 'GENERATION_FAILED',
            message: error instanceof Error ? error.message : 'Failed to generate boardroom report',
            details: error instanceof Error ? error.stack : undefined,
          },
        };
      }
    }),

  // Get existing boardroom reports with filtering and pagination
  getReports: publicProcedure
    .input(
      z.object({
        filters: FiltersSchema.optional(),
        pagination: PaginationSchema.optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        console.log('[BoardroomAPI] Fetching reports with filters:', input.filters);

        // Mock report data - in production this would query the database
        const mockReports = [
          {
            id: 'qbr_2024_q1',
            title: 'Q1 2024 Quarterly Business Review',
            subtitle: 'Strategic Performance & Forward Outlook',
            reportType: 'QBR',
            quarter: 'Q1 2024',
            theme: 'NEON_GLASS',
            overallScore: 87,
            brandHealthScore: 91,
            overallROAS: 3.4,
            totalRevenue: 1250000,
            slidesCount: 12,
            forecastsCount: 5,
            confidenceScore: 0.82,
            generationTime: 2847,
            createdAt: '2024-01-15T10:30:00Z',
            updatedAt: '2024-01-15T10:35:00Z',
            status: 'completed',
            viewCount: 24,
            downloadCount: 8,
          },
          {
            id: 'monthly_2024_03',
            title: 'March 2024 Strategic Overview',
            subtitle: 'Monthly Performance & Optimization Insights',
            reportType: 'MONTHLY_STRATEGY',
            theme: 'EXECUTIVE_DARK',
            overallScore: 92,
            brandHealthScore: 89,
            overallROAS: 3.6,
            totalRevenue: 485000,
            slidesCount: 8,
            forecastsCount: 3,
            confidenceScore: 0.89,
            generationTime: 1823,
            createdAt: '2024-03-31T16:45:00Z',
            updatedAt: '2024-03-31T16:48:00Z',
            status: 'completed',
            viewCount: 18,
            downloadCount: 5,
          },
          {
            id: 'campaign_winter_2024',
            title: 'Winter Campaign Postmortem',
            subtitle: 'Holiday Campaign Performance Analysis',
            reportType: 'CAMPAIGN_POSTMORTEM',
            theme: 'CMO_LITE',
            overallScore: 94,
            brandHealthScore: 88,
            overallROAS: 4.2,
            totalRevenue: 890000,
            slidesCount: 10,
            forecastsCount: 2,
            confidenceScore: 0.91,
            generationTime: 1456,
            createdAt: '2024-02-15T09:15:00Z',
            updatedAt: '2024-02-15T09:18:00Z',
            status: 'completed',
            viewCount: 32,
            downloadCount: 12,
          },
        ];

        // Apply filters
        let filteredReports = mockReports;

        if (input.filters?.reportTypes?.length) {
          filteredReports = filteredReports.filter(report =>
            input.filters!.reportTypes!.includes(report.reportType)
          );
        }

        if (input.filters?.themes?.length) {
          filteredReports = filteredReports.filter(report =>
            input.filters!.themes!.includes(report.theme)
          );
        }

        if (input.filters?.confidenceThreshold) {
          filteredReports = filteredReports.filter(
            report => report.confidenceScore >= input.filters!.confidenceThreshold!
          );
        }

        if (input.filters?.dateRange) {
          const startDate = new Date(input.filters.dateRange.start);
          const endDate = new Date(input.filters.dateRange.end);
          filteredReports = filteredReports.filter(report => {
            const reportDate = new Date(report.createdAt);
            return reportDate >= startDate && reportDate <= endDate;
          });
        }

        // Apply sorting
        const pagination = input.pagination || {
          page: 1,
          limit: 10,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        };

        filteredReports.sort((a, b) => {
          const aValue = a[pagination.sortBy as keyof typeof a];
          const bValue = b[pagination.sortBy as keyof typeof b];

          if (pagination.sortOrder === 'asc') {
            return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
          } else {
            return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
          }
        });

        // Apply pagination
        const startIndex = (pagination.page - 1) * pagination.limit;
        const endIndex = startIndex + pagination.limit;
        const paginatedReports = filteredReports.slice(startIndex, endIndex);

        return {
          success: true,
          data: {
            reports: paginatedReports,
            pagination: {
              page: pagination.page,
              limit: pagination.limit,
              total: filteredReports.length,
              pages: Math.ceil(filteredReports.length / pagination.limit),
              hasNext: endIndex < filteredReports.length,
              hasPrev: pagination.page > 1,
            },
            summary: {
              totalReports: filteredReports.length,
              averageScore:
                filteredReports.reduce((sum, r) => sum + r.overallScore, 0) /
                filteredReports.length,
              averageROAS:
                filteredReports.reduce((sum, r) => sum + r.overallROAS, 0) / filteredReports.length,
              totalRevenue: filteredReports.reduce((sum, r) => sum + r.totalRevenue, 0),
              reportTypes: [...new Set(filteredReports.map(r => r.reportType))],
            },
          },
        };
      } catch (error) {
        console.error('[BoardroomAPI] Error fetching reports:', error);

        return {
          success: false,
          error: {
            code: 'FETCH_FAILED',
            message: 'Failed to fetch boardroom reports',
            details: error instanceof Error ? error.message : undefined,
          },
        };
      }
    }),

  // Get a specific report by ID
  getReport: publicProcedure
    .input(
      z.object({
        reportId: z.string(),
        includeSlideContent: z.boolean().default(false),
        includeForecastDetails: z.boolean().default(false),
      })
    )
    .query(async ({ input }) => {
      try {
        console.log(`[BoardroomAPI] Fetching report: ${input.reportId}`);

        // Mock report retrieval - in production this would query the database
        const mockReport = {
          id: input.reportId,
          title: 'Q1 2024 Quarterly Business Review',
          subtitle: 'Strategic Performance & Forward Outlook',
          reportType: 'QBR',
          quarter: 'Q1 2024',
          theme: 'NEON_GLASS',
          overallScore: 87,
          brandHealthScore: 91,
          overallROAS: 3.4,
          totalRevenue: 1250000,
          totalBudget: 950000,
          totalSpend: 890000,
          costSavings: 60000,
          keyTakeaways: [
            'Exceeded ROAS targets by 13% across all campaigns',
            'Brand alignment improved by 15% quarter-over-quarter',
            'AI agent efficiency increased by 28%',
            'Video content strategy yielding 87% success rate',
          ],
          strategicRecommendations: [
            'Scale high-performing video content campaigns',
            'Implement cross-platform brand consistency guidelines',
            'Invest in advanced AI agent collaboration',
            'Expand to emerging social platforms',
          ],
          nextQuarterGoals: [
            'Achieve 4.0+ ROAS across all campaigns',
            'Launch integrated omnichannel strategy',
            'Implement predictive campaign optimization',
            'Expand to 3 new market segments',
          ],
          timeframeCovered: {
            start: '2024-01-01',
            end: '2024-03-31',
          },
          campaignsCovered: ['camp_1', 'camp_2', 'camp_3'],
          agentsCovered: ['CONTENT', 'AD', 'SOCIAL_POSTING', 'BRAND_VOICE'],
          marketPosition: 'COMPETITIVE',
          competitiveAdvantage: [
            'Advanced AI agent orchestration',
            'Superior brand consistency automation',
            'Cross-campaign pattern recognition',
          ],
          slides: input.includeSlideContent
            ? [
                {
                  slideNumber: 1,
                  slideType: 'TITLE',
                  title: 'Q1 2024 Strategic Review',
                  subtitle: 'Executive Performance Summary',
                  keyTakeaway: 'Comprehensive strategic overview of Q1 performance',
                  theme: 'NEON_GLASS',
                  layout: 'title',
                },
                {
                  slideNumber: 2,
                  slideType: 'EXECUTIVE_SUMMARY',
                  title: 'Executive Summary',
                  subtitle: 'Key Performance Indicators & Strategic Insights',
                  keyTakeaway:
                    'Achieved 87% overall performance score with strong ROAS and brand alignment',
                  businessContext: 'High-level performance overview for board decision making',
                  recommendation:
                    'Continue current strategy with increased investment in top-performing areas',
                  theme: 'NEON_GLASS',
                  layout: 'content',
                },
                {
                  slideNumber: 3,
                  slideType: 'FINANCIAL_OVERVIEW',
                  title: 'Financial Performance',
                  subtitle: 'Budget Allocation & Revenue Generation',
                  keyTakeaway: 'Generated 3.4x ROAS with 7% budget savings',
                  businessContext: 'Financial efficiency and revenue generation performance',
                  recommendation: 'Reallocate savings to high-performing campaign types',
                  theme: 'NEON_GLASS',
                  layout: 'split',
                },
              ]
            : undefined,
          forecasts: input.includeForecastDetails
            ? [
                {
                  metricName: 'Overall ROAS',
                  currentValue: 3.4,
                  projectedValue: 3.8,
                  projectionPeriod: '3_MONTHS',
                  projectionType: 'TREND_BASED',
                  confidenceLevel: 0.85,
                  methodology: 'exponential_smoothing_with_trend',
                  dataQuality: 0.92,
                  businessImpact: 125000,
                  strategicPriority: 'HIGH',
                  actionRequired: true,
                  assumptions: [
                    'Continued optimization of high-performing campaigns',
                    'Stable market conditions',
                    'No major platform algorithm changes',
                  ],
                  riskFactors: ['Increased competition in Q2', 'Potential iOS privacy updates'],
                  opportunities: [
                    'New TikTok advertising features',
                    'AI-powered creative optimization',
                  ],
                },
              ]
            : undefined,
          generationTime: 2847,
          dataPoints: 156,
          confidenceScore: 0.82,
          createdAt: '2024-01-15T10:30:00Z',
          updatedAt: '2024-01-15T10:35:00Z',
          viewCount: 24,
          downloadCount: 8,
          lastViewed: '2024-01-20T14:22:00Z',
          sharedWith: ['user_1', 'user_2'],
          exportedFormats: ['PDF', 'HTML'],
          markdownContent: input.includeSlideContent
            ? '# Q1 2024 Strategic Review\n\n...'
            : undefined,
          htmlContent: input.includeSlideContent ? '<!DOCTYPE html>...' : undefined,
        };

        return {
          success: true,
          data: mockReport,
        };
      } catch (error) {
        console.error(`[BoardroomAPI] Error fetching report ${input.reportId}:`, error);

        return {
          success: false,
          error: {
            code: 'REPORT_NOT_FOUND',
            message: `Report ${input.reportId} not found`,
            details: error instanceof Error ? error.message : undefined,
          },
        };
      }
    }),

  // Generate forecasts for boardroom insights
  generateForecasts: publicProcedure
    .input(
      z.object({
        config: ForecastConfigSchema,
        reportContext: z
          .object({
            timeframe: z.object({
              start: z.string(),
              end: z.string(),
            }),
            includeCampaigns: z.array(z.string()).default([]),
            includeAgents: z.array(z.string()).default([]),
          })
          .optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        console.log('[BoardroomAPI] Generating forecasts with config:', input.config);

        const startTime = Date.now();

        // Convert input to engine format
        const forecastConfig: ForecastConfiguration = {
          metricTypes: input.config.metricTypes.map(m => m.toUpperCase()) as MetricType[],
          projectionPeriods: input.config.projectionPeriods.map(p =>
            p.toUpperCase()
          ) as ProjectionPeriod[],
          confidenceThreshold: input.config.confidenceThreshold,
          includeSeasonality: input.config.includeSeasonality,
          includeTrends: input.config.includeTrends,
          benchmarkComparison: input.config.benchmarkComparison,
          riskAssessment: input.config.riskAssessment,
          chartGeneration: input.config.chartGeneration,
        };

        // Generate forecasts
        const forecasts = await forecastEngine.generateForecasts(forecastConfig);

        const generationTime = Date.now() - startTime;

        console.log(
          `[BoardroomAPI] Generated ${forecasts.length} forecasts in ${generationTime}ms`
        );

        return {
          success: true,
          data: {
            forecasts: forecasts.map(forecast => ({
              metricName: forecast.metricName,
              currentValue: forecast.currentValue,
              projectedValue: forecast.projectedValue,
              projectionPeriod: forecast.projectionPeriod,
              projectionType: forecast.projectionType,
              confidenceLevel: forecast.confidenceLevel,
              methodology: forecast.methodology,
              dataQuality: forecast.dataQuality,
              trendStrength: forecast.trendStrength,
              seasonalityFactor: forecast.seasonalityFactor,
              businessImpact: forecast.businessImpact,
              strategicPriority: forecast.strategicPriority,
              actionRequired: forecast.actionRequired,
              recommendedActions: forecast.recommendedActions,
              assumptions: forecast.assumptions,
              riskFactors: forecast.riskFactors.map(risk => ({
                type: risk.type,
                severity: risk.severity,
                probability: risk.probability,
                description: risk.description,
                impact: risk.impact,
                mitigation: risk.mitigation,
              })),
              opportunities: forecast.opportunities.map(opp => ({
                type: opp.type,
                potential: opp.potential,
                description: opp.description,
                timeframe: opp.timeframe,
                requirements: opp.requirements,
                expectedImpact: opp.expectedImpact,
              })),
              chartData: forecast.chartData,
              benchmarkData: forecast.benchmarkData,
              generatedAt: forecast.generatedAt,
              expiresAt: forecast.expiresAt,
              modelVersion: forecast.modelVersion,
            })),
            metadata: {
              generationTime,
              totalForecasts: forecasts.length,
              averageConfidence:
                forecasts.reduce((sum, f) => sum + f.confidenceLevel, 0) / forecasts.length,
              highPriorityCount: forecasts.filter(
                f => f.strategicPriority === 'HIGH' || f.strategicPriority === 'CRITICAL'
              ).length,
              actionRequiredCount: forecasts.filter(f => f.actionRequired).length,
            },
          },
        };
      } catch (error) {
        console.error('[BoardroomAPI] Error generating forecasts:', error);

        return {
          success: false,
          error: {
            code: 'FORECAST_GENERATION_FAILED',
            message: 'Failed to generate forecasts',
            details: error instanceof Error ? error.message : undefined,
          },
        };
      }
    }),

  // Get analytics for the boardroom dashboard
  getAnalytics: publicProcedure
    .input(
      z.object({
        timeframe: z
          .object({
            start: z.string(),
            end: z.string(),
          })
          .optional(),
        includeComparisons: z.boolean().default(true),
        includeBreakdowns: z.boolean().default(true),
      })
    )
    .query(async ({ input }) => {
      try {
        console.log('[BoardroomAPI] Fetching analytics for timeframe:', input.timeframe);

        // Mock analytics data - in production this would query real data
        const mockAnalytics = {
          overview: {
            totalReports: 24,
            reportsThisMonth: 3,
            averageGenerationTime: 2156,
            averageConfidenceScore: 0.84,
            totalSlides: 156,
            totalForecasts: 45,
          },
          performance: {
            reportSuccessRate: 0.96,
            averageViewsPerReport: 18.4,
            averageDownloadsPerReport: 6.2,
            mostPopularTheme: 'NEON_GLASS',
            mostRequestedReportType: 'QBR',
          },
          trends: {
            monthlyGeneration: [
              { month: 'Jan', reports: 8, avgScore: 85 },
              { month: 'Feb', reports: 6, avgScore: 87 },
              { month: 'Mar', reports: 10, avgScore: 89 },
            ],
            scoreDistribution: [
              { range: '90-100', count: 12 },
              { range: '80-89', count: 8 },
              { range: '70-79', count: 3 },
              { range: '60-69', count: 1 },
            ],
            themeUsage: [
              { theme: 'NEON_GLASS', count: 12, percentage: 50 },
              { theme: 'EXECUTIVE_DARK', count: 8, percentage: 33 },
              { theme: 'CMO_LITE', count: 4, percentage: 17 },
            ],
          },
          forecasting: {
            totalForecasts: 45,
            averageAccuracy: 0.87,
            highConfidenceForecasts: 32,
            actionRequiredForecasts: 18,
            metricsTracked: [
              'ROAS',
              'Brand Alignment',
              'Revenue',
              'Agent Efficiency',
              'Conversion Rate',
            ],
          },
          systemHealth: {
            agentsActive: 12,
            agentsTotal: 12,
            lastReportGenerated: '2024-03-28T10:15:00Z',
            dataFreshness: 'real-time',
            averageResponseTime: 1.2,
            errorRate: 0.02,
          },
        };

        if (input.includeComparisons) {
          mockAnalytics['comparisons'] = {
            previousPeriod: {
              totalReports: 18,
              averageScore: 81,
              change: '+33%',
            },
            yearOverYear: {
              totalReports: 156,
              averageScore: 79,
              change: '+54%',
            },
          };
        }

        if (input.includeBreakdowns) {
          mockAnalytics['breakdowns'] = {
            byReportType: [
              { type: 'QBR', count: 12, avgScore: 88 },
              { type: 'MONTHLY_STRATEGY', count: 8, avgScore: 85 },
              { type: 'CAMPAIGN_POSTMORTEM', count: 4, avgScore: 91 },
            ],
            byAgent: [
              { agent: 'Content Agent', usage: 24, performance: 0.92 },
              { agent: 'Brand Voice Agent', usage: 22, performance: 0.96 },
              { agent: 'Ad Agent', usage: 18, performance: 0.89 },
            ],
            byCampaignType: [
              { type: 'PRODUCT_LAUNCH', reports: 8, avgROAS: 3.8 },
              { type: 'BRAND_AWARENESS', reports: 6, avgROAS: 2.9 },
              { type: 'LEAD_GENERATION', reports: 10, avgROAS: 4.1 },
            ],
          };
        }

        return {
          success: true,
          data: mockAnalytics,
        };
      } catch (error) {
        console.error('[BoardroomAPI] Error fetching analytics:', error);

        return {
          success: false,
          error: {
            code: 'ANALYTICS_FETCH_FAILED',
            message: 'Failed to fetch analytics data',
            details: error instanceof Error ? error.message : undefined,
          },
        };
      }
    }),

  // Schedule a boardroom report
  scheduleReport: publicProcedure
    .input(
      z.object({
        scheduleConfig: z.object({
          name: z.string(),
          type: z.enum(['QBR', 'MONTHLY_STRATEGY', 'WEEKLY_DIGEST', 'CAMPAIGN_POSTMORTEM']),
          frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY']),
          time: z.object({
            hour: z.number().min(0).max(23),
            minute: z.number().min(0).max(59),
            timezone: z.string().default('UTC'),
          }),
          enabled: z.boolean().default(true),
        }),
        reportConfig: BoardroomReportConfigSchema,
        deliveryConfig: z.object({
          recipients: z.array(
            z.object({
              email: z.string().email(),
              name: z.string(),
              role: z.enum(['CMO', 'MARKETING_MANAGER', 'ANALYST', 'EXECUTIVE']),
              formats: z.array(z.string()).default(['PDF']),
            })
          ),
          channels: z.array(z.enum(['email', 'slack', 'notion'])).default(['email']),
        }),
      })
    )
    .mutation(async ({ input }) => {
      try {
        console.log('[BoardroomAPI] Scheduling report:', input.scheduleConfig.name);

        // Mock schedule creation - in production this would persist to database
        const scheduleId = `schedule_${Date.now()}`;

        // Calculate next run time
        const nextRun = new Date();
        switch (input.scheduleConfig.frequency) {
          case 'DAILY':
            nextRun.setDate(nextRun.getDate() + 1);
            break;
          case 'WEEKLY':
            nextRun.setDate(nextRun.getDate() + 7);
            break;
          case 'MONTHLY':
            nextRun.setMonth(nextRun.getMonth() + 1);
            nextRun.setDate(1);
            break;
          case 'QUARTERLY':
            nextRun.setMonth(nextRun.getMonth() + 3);
            nextRun.setDate(1);
            break;
        }

        nextRun.setHours(input.scheduleConfig.time.hour, input.scheduleConfig.time.minute, 0, 0);

        const schedule = {
          id: scheduleId,
          name: input.scheduleConfig.name,
          type: input.scheduleConfig.type,
          frequency: input.scheduleConfig.frequency,
          time: input.scheduleConfig.time,
          enabled: input.scheduleConfig.enabled,
          reportConfig: input.reportConfig,
          deliveryConfig: input.deliveryConfig,
          nextRun: nextRun.toISOString(),
          createdAt: new Date().toISOString(),
          lastRun: null,
          runCount: 0,
          successCount: 0,
        };

        console.log(
          `[BoardroomAPI] Schedule created: ${scheduleId}, next run: ${nextRun.toISOString()}`
        );

        return {
          success: true,
          data: {
            schedule,
            message: `Report scheduled successfully. Next run: ${nextRun.toLocaleDateString()} at ${nextRun.toLocaleTimeString()}`,
          },
        };
      } catch (error) {
        console.error('[BoardroomAPI] Error scheduling report:', error);

        return {
          success: false,
          error: {
            code: 'SCHEDULE_CREATION_FAILED',
            message: 'Failed to create report schedule',
            details: error instanceof Error ? error.message : undefined,
          },
        };
      }
    }),

  // Get scheduled reports
  getSchedules: publicProcedure
    .input(
      z.object({
        includeDisabled: z.boolean().default(false),
      })
    )
    .query(async ({ input }) => {
      try {
        console.log('[BoardroomAPI] Fetching schedules, includeDisabled:', input.includeDisabled);

        // Mock schedule data
        const mockSchedules = [
          {
            id: 'schedule_monthly_qbr',
            name: 'Monthly QBR',
            type: 'QBR',
            frequency: 'MONTHLY',
            time: { hour: 6, minute: 0, timezone: 'UTC' },
            enabled: true,
            nextRun: '2024-04-01T06:00:00Z',
            lastRun: '2024-03-01T06:00:00Z',
            runCount: 3,
            successCount: 3,
            createdAt: '2024-01-01T00:00:00Z',
          },
          {
            id: 'schedule_weekly_digest',
            name: 'Weekly Performance Digest',
            type: 'WEEKLY_DIGEST',
            frequency: 'WEEKLY',
            time: { hour: 17, minute: 0, timezone: 'UTC' },
            enabled: true,
            nextRun: '2024-03-29T17:00:00Z',
            lastRun: '2024-03-22T17:00:00Z',
            runCount: 12,
            successCount: 11,
            createdAt: '2024-01-01T00:00:00Z',
          },
          {
            id: 'schedule_disabled_test',
            name: 'Test Schedule (Disabled)',
            type: 'MONTHLY_STRATEGY',
            frequency: 'MONTHLY',
            time: { hour: 12, minute: 0, timezone: 'UTC' },
            enabled: false,
            nextRun: null,
            lastRun: null,
            runCount: 0,
            successCount: 0,
            createdAt: '2024-02-15T00:00:00Z',
          },
        ];

        let filteredSchedules = mockSchedules;
        if (!input.includeDisabled) {
          filteredSchedules = mockSchedules.filter(schedule => schedule.enabled);
        }

        return {
          success: true,
          data: {
            schedules: filteredSchedules,
            summary: {
              total: filteredSchedules.length,
              enabled: filteredSchedules.filter(s => s.enabled).length,
              disabled: filteredSchedules.filter(s => !s.enabled).length,
              nextRun: filteredSchedules
                .filter(s => s.enabled && s.nextRun)
                .sort((a, b) => a.nextRun!.localeCompare(b.nextRun!))[0]?.nextRun,
            },
          },
        };
      } catch (error) {
        console.error('[BoardroomAPI] Error fetching schedules:', error);

        return {
          success: false,
          error: {
            code: 'SCHEDULES_FETCH_FAILED',
            message: 'Failed to fetch report schedules',
            details: error instanceof Error ? error.message : undefined,
          },
        };
      }
    }),
});

export default boardroomRouter;
