import { z } from 'zod';
import { createTRPCRouter, publicProcedure, protectedProcedure } from '../server/trpc';
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
});
