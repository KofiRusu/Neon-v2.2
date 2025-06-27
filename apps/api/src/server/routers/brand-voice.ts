import { z } from 'zod';
import { createTRPCRouter, publicProcedure, protectedProcedure } from '../trpc';
import { BrandVoiceAgent } from '@neon/core-agents';

// Initialize the Brand Voice Agent
const brandVoiceAgent = new BrandVoiceAgent();

// Input validation schemas
const BrandVoiceProfileSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  guidelines: z.record(z.any()),
  keywords: z.array(z.string()),
  toneProfile: z.record(z.any()),
  sampleContent: z.record(z.any()).optional(),
});

const ContentAnalysisSchema = z.object({
  content: z.string().min(1),
  contentType: z.enum(['email', 'social', 'blog', 'ad', 'general']).default('general'),
  brandVoiceId: z.string().optional(),
});

export const brandVoiceRouter = createTRPCRouter({
  // Profile Management
  createProfile: protectedProcedure
    .input(BrandVoiceProfileSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // Create brand voice profile in database
        const profile = await ctx.db.brandVoice.create({
          data: {
            name: input.name,
            description: input.description,
            guidelines: input.guidelines,
            keywords: input.keywords,
            toneProfile: input.toneProfile,
            sampleContent: input.sampleContent,
            isActive: true,
            version: '1.0',
          },
        });

        // Log the event
        await ctx.db.aIEventLog.create({
          data: {
            agent: 'BrandVoiceAgent',
            action: 'create_profile',
            metadata: {
              profileId: profile.id,
              profileName: profile.name,
            },
          },
        });

        return {
          success: true,
          profile,
        };
      } catch (error) {
        throw new Error(`Failed to create brand voice profile: ${error}`);
      }
    }),

  getProfiles: publicProcedure
    .input(
      z.object({
        includeInactive: z.boolean().default(false),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const where = input.includeInactive ? {} : { isActive: true };

      const [profiles, totalCount] = await Promise.all([
        ctx.db.brandVoice.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: input.offset,
          take: input.limit,
          include: {
            _count: {
              select: { analyses: true },
            },
          },
        }),
        ctx.db.brandVoice.count({ where }),
      ]);

      return {
        profiles,
        totalCount,
        hasMore: input.offset + input.limit < totalCount,
      };
    }),

  getProfile: publicProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const profile = await ctx.db.brandVoice.findUnique({
      where: { id: input.id },
      include: {
        analyses: {
          orderBy: { analyzedAt: 'desc' },
          take: 10,
        },
        _count: {
          select: { analyses: true },
        },
      },
    });

    if (!profile) {
      throw new Error('Brand voice profile not found');
    }

    return profile;
  }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: BrandVoiceProfileSchema.partial(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const profile = await ctx.db.brandVoice.update({
          where: { id: input.id },
          data: {
            ...input.data,
            updatedAt: new Date(),
          },
        });

        // Log the event
        await ctx.db.aIEventLog.create({
          data: {
            agent: 'BrandVoiceAgent',
            action: 'update_profile',
            metadata: {
              profileId: profile.id,
              updatedFields: Object.keys(input.data),
            },
          },
        });

        return {
          success: true,
          profile,
        };
      } catch (error) {
        throw new Error(`Failed to update brand voice profile: ${error}`);
      }
    }),

  deleteProfile: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.db.brandVoice.delete({
          where: { id: input.id },
        });

        // Log the event
        await ctx.db.aIEventLog.create({
          data: {
            agent: 'BrandVoiceAgent',
            action: 'delete_profile',
            metadata: {
              profileId: input.id,
            },
          },
        });

        return {
          success: true,
          message: 'Brand voice profile deleted successfully',
        };
      } catch (error) {
        throw new Error(`Failed to delete brand voice profile: ${error}`);
      }
    }),

  // Content Analysis
  analyzeContent: protectedProcedure
    .input(ContentAnalysisSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // Use the Brand Voice Agent to analyze content
        const result = await brandVoiceAgent.analyzeContentPublic(
          input.content,
          input.contentType,
          input.brandVoiceId
        );

        if (!result.success) {
          throw new Error(result.error || 'Content analysis failed');
        }

        // Save analysis to database if brand voice ID is provided
        let analysisRecord = null;
        if (input.brandVoiceId) {
          analysisRecord = await ctx.db.brandVoiceAnalysis.create({
            data: {
              brandVoiceId: input.brandVoiceId,
              contentType: input.contentType,
              originalText: input.content,
              voiceScore: result.voiceScore || 0,
              suggestions: result.suggestions || [],
              metadata: {
                analysis: result.analysis,
                performance: result.performance,
              },
            },
          });
        }

        // Log the event
        await ctx.db.aIEventLog.create({
          data: {
            agent: 'BrandVoiceAgent',
            action: 'analyze_content',
            metadata: {
              contentType: input.contentType,
              contentLength: input.content.length,
              voiceScore: result.voiceScore,
              brandVoiceId: input.brandVoiceId,
              analysisId: analysisRecord?.id,
            },
          },
        });

        return {
          success: true,
          voiceScore: result.voiceScore,
          suggestions: result.suggestions,
          analysis: result.analysis,
          analysisId: analysisRecord?.id,
        };
      } catch (error) {
        throw new Error(`Content analysis failed: ${error}`);
      }
    }),

  scoreContent: publicProcedure
    .input(ContentAnalysisSchema.omit({ brandVoiceId: true }))
    .query(async ({ input }) => {
      try {
        const result = await brandVoiceAgent.scoreContentPublic(input.content);

        if (!result.success) {
          throw new Error(result.error || 'Content scoring failed');
        }

        return {
          success: true,
          voiceScore: result.voiceScore,
          analysis: result.analysis,
        };
      } catch (error) {
        throw new Error(`Content scoring failed: ${error}`);
      }
    }),

  getSuggestions: publicProcedure
    .input(ContentAnalysisSchema.omit({ brandVoiceId: true }))
    .query(async ({ input }) => {
      try {
        const result = await brandVoiceAgent.getSuggestionsPublic(input.content, input.contentType);

        if (!result.success) {
          throw new Error(result.error || 'Suggestion generation failed');
        }

        return {
          success: true,
          suggestions: result.suggestions,
        };
      } catch (error) {
        throw new Error(`Suggestion generation failed: ${error}`);
      }
    }),

  // Analysis History
  getAnalysisHistory: publicProcedure
    .input(
      z.object({
        brandVoiceId: z.string().optional(),
        contentType: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const where = {
        ...(input.brandVoiceId && { brandVoiceId: input.brandVoiceId }),
        ...(input.contentType && { contentType: input.contentType }),
        ...(input.startDate &&
          input.endDate && {
            analyzedAt: {
              gte: input.startDate,
              lte: input.endDate,
            },
          }),
      };

      const [analyses, totalCount] = await Promise.all([
        ctx.db.brandVoiceAnalysis.findMany({
          where,
          orderBy: { analyzedAt: 'desc' },
          skip: input.offset,
          take: input.limit,
          include: {
            brandVoice: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        }),
        ctx.db.brandVoiceAnalysis.count({ where }),
      ]);

      return {
        analyses,
        totalCount,
        hasMore: input.offset + input.limit < totalCount,
      };
    }),

  // Guidelines Management
  getGuidelines: publicProcedure
    .input(z.object({ brandVoiceId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      if (input.brandVoiceId) {
        const profile = await ctx.db.brandVoice.findUnique({
          where: { id: input.brandVoiceId },
          select: {
            guidelines: true,
            toneProfile: true,
            keywords: true,
          },
        });

        if (!profile) {
          throw new Error('Brand voice profile not found');
        }

        return {
          success: true,
          guidelines: profile.guidelines,
          toneProfile: profile.toneProfile,
          keywords: profile.keywords,
        };
      }

      // Return default guidelines if no specific profile requested
      const result = await brandVoiceAgent.execute({
        task: 'get_guidelines',
        context: { action: 'get_guidelines' },
        priority: 'medium',
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to get guidelines');
      }

      return {
        success: true,
        guidelines: result.guidelines,
      };
    }),

  // Analytics and Metrics
  getVoiceConsistencyMetrics: publicProcedure
    .input(
      z.object({
        brandVoiceId: z.string(),
        period: z.enum(['7d', '30d', '90d']).default('30d'),
      })
    )
    .query(async ({ ctx, input }) => {
      const periodDays = {
        '7d': 7,
        '30d': 30,
        '90d': 90,
      };

      const days = periodDays[input.period];
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const analyses = await ctx.db.brandVoiceAnalysis.findMany({
        where: {
          brandVoiceId: input.brandVoiceId,
          analyzedAt: {
            gte: startDate,
          },
        },
        select: {
          voiceScore: true,
          contentType: true,
          analyzedAt: true,
        },
        orderBy: { analyzedAt: 'asc' },
      });

      // Calculate metrics
      const totalAnalyses = analyses.length;
      const averageScore =
        totalAnalyses > 0 ? analyses.reduce((sum, a) => sum + a.voiceScore, 0) / totalAnalyses : 0;

      const scoresByType = analyses.reduce(
        (acc, analysis) => {
          if (!acc[analysis.contentType]) {
            acc[analysis.contentType] = [];
          }
          acc[analysis.contentType].push(analysis.voiceScore);
          return acc;
        },
        {} as Record<string, number[]>
      );

      const consistencyByType = Object.entries(scoresByType).map(([type, scores]) => ({
        contentType: type,
        averageScore: scores.reduce((sum, score) => sum + score, 0) / scores.length,
        count: scores.length,
        consistency: calculateConsistency(scores),
      }));

      return {
        totalAnalyses,
        averageScore: Math.round(averageScore),
        consistencyByType,
        trendData: analyses.map(a => ({
          date: a.analyzedAt,
          score: a.voiceScore,
          contentType: a.contentType,
        })),
        period: input.period,
      };
    }),

  // Bulk Operations
  bulkAnalyzeContent: protectedProcedure
    .input(
      z.object({
        contents: z.array(
          z.object({
            id: z.string(),
            content: z.string(),
            contentType: z.enum(['email', 'social', 'blog', 'ad', 'general']),
          })
        ),
        brandVoiceId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const results = [];

        for (const item of input.contents) {
          const result = await brandVoiceAgent.analyzeContentPublic(
            item.content,
            item.contentType,
            input.brandVoiceId
          );

          if (result.success) {
            // Save to database
            const analysisRecord = await ctx.db.brandVoiceAnalysis.create({
              data: {
                brandVoiceId: input.brandVoiceId,
                contentId: item.id,
                contentType: item.contentType,
                originalText: item.content,
                voiceScore: result.voiceScore || 0,
                suggestions: result.suggestions || [],
                metadata: {
                  analysis: result.analysis,
                },
              },
            });

            results.push({
              id: item.id,
              success: true,
              voiceScore: result.voiceScore,
              suggestions: result.suggestions,
              analysisId: analysisRecord.id,
            });
          } else {
            results.push({
              id: item.id,
              success: false,
              error: result.error,
            });
          }
        }

        // Log the bulk operation
        await ctx.db.aIEventLog.create({
          data: {
            agent: 'BrandVoiceAgent',
            action: 'bulk_analyze',
            metadata: {
              brandVoiceId: input.brandVoiceId,
              totalItems: input.contents.length,
              successfulItems: results.filter(r => r.success).length,
            },
          },
        });

        return {
          success: true,
          results,
          summary: {
            total: input.contents.length,
            successful: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
          },
        };
      } catch (error) {
        throw new Error(`Bulk analysis failed: ${error}`);
      }
    }),
});

// Helper function for consistency calculation
function calculateConsistency(scores: number[]): number {
  if (scores.length < 2) return 100;

  const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  const variance =
    scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
  const standardDeviation = Math.sqrt(variance);

  // Convert to consistency percentage (lower std dev = higher consistency)
  const maxStdDev = 50; // Assume max possible std dev for normalization
  const consistency = Math.max(0, 100 - (standardDeviation / maxStdDev) * 100);

  return Math.round(consistency);
}
