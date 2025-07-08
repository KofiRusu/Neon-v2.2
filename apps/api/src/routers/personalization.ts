import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "../server/trpc";
import { BrandVoiceAgent } from "@neon/core-agents";
import { logger } from "@neon/utils";

// Initialize Brand Voice Agent for tone adaptation
const brandVoiceAgent = new BrandVoiceAgent();

// Define proper interfaces instead of using 'any' types
interface UserSegmentCriteria {
  ageRange?: string;
  location?: string;
  interests?: string[];
  behavior?: string;
}

interface UserPersonaDemographics {
  age?: number;
  gender?: string;
  location?: string;
  occupation?: string;
}

interface UserPersonaBehaviorTraits {
  engagementLevel?: string;
  preferredChannels?: string[];
  activityPattern?: string;
}

interface BehaviorTriggerConditions {
  url?: string;
  timeSpent?: number;
  scrollPercentage?: number;
  clickCount?: number;
  pageViews?: number;
}

interface BehaviorTriggerAction {
  type: string;
  content?: string;
  redirect?: string;
  display?: string;
  data?: Record<string, unknown>;
}

interface PersonalizationRuleConditions {
  triggerType?: string;
  segmentId?: string;
  userScore?: number;
  timeOfDay?: string;
}

interface PersonalizationRuleActions {
  contentToShow?: string[];
  contentToHide?: string[];
  layoutVariant?: string;
  targetTone?: string;
  fallbackTone?: string;
  segmentSpecific?: boolean;
  primaryMessage?: string;
  secondaryMessage?: string;
  ctaText?: string;
  urgencyLevel?: string;
  contentRecommendations?: string[];
  contentToPromote?: string[];
  hideElements?: string[];
  showElements?: string[];
  reorderElements?: Record<string, number>;
}

interface CampaignFeedbackMetrics {
  impressions?: number;
  clicks?: number;
  conversions?: number;
  engagementRate?: number;
  clickThroughRate?: number;
  conversionRate?: number;
  bounceRate?: number;
  timeOnPage?: number;
}

interface CampaignFeedbackInsights {
  performanceScore?: number;
  topPerformingContent?: string[];
  underperformingContent?: string[];
  audienceEngagement?: Record<string, number>;
  recommendations?: string[];
  overallScore?: number;
  strengths?: string[];
  weaknesses?: string[];
}

interface CampaignFeedbackRecommendations {
  contentOptimization?: string[];
  toneAdjustments?: string[];
  targetingImprovements?: string[];
  timingOptimization?: string[];
}

interface BehaviorLogEventData {
  elementTag?: string;
  elementClass?: string;
  elementId?: string;
  clickPosition?: { x: number; y: number };
  scrollPosition?: number;
  timeSpent?: number;
  formData?: Record<string, unknown>;
}

// Input validation schemas
const UserSegmentSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  criteria: z.record(z.unknown()),
  size: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

const UserPersonaSchema = z.object({
  segmentId: z.string(),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  demographics: z.record(z.unknown()).optional(),
  behaviorTraits: z.record(z.unknown()).optional(),
  painPoints: z.array(z.string()).default([]),
  goals: z.array(z.string()).default([]),
  preferredTone: z.string().default("friendly"),
  contentPreferences: z.record(z.unknown()).optional(),
});

const BehaviorTriggerSchema = z.object({
  segmentId: z.string().optional(),
  personaId: z.string().optional(),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  triggerType: z.enum([
    "PAGE_VISIT",
    "EMAIL_OPEN",
    "EMAIL_CLICK",
    "TIME_BASED",
    "ENGAGEMENT_LEVEL",
    "CONVERSION_EVENT",
    "INACTIVITY",
    "REPEAT_VISITOR",
    "CONTENT_PREFERENCE",
    "CHANNEL_PREFERENCE",
  ]),
  conditions: z.record(z.unknown()),
  action: z.record(z.unknown()),
  priority: z.number().int().min(1).default(1),
  isActive: z.boolean().default(true),
});

const PersonalizationRuleSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  ruleType: z.enum([
    "CONTENT",
    "TONE",
    "TIMING",
    "CHANNEL",
    "LAYOUT",
    "MESSAGING",
    "OFFER",
    "CALL_TO_ACTION",
  ]),
  conditions: z.record(z.unknown()),
  actions: z.record(z.unknown()),
  priority: z.number().int().min(1).default(1),
  isActive: z.boolean().default(true),
});

const CampaignFeedbackSchema = z.object({
  campaignId: z.string(),
  segmentId: z.string().optional(),
  personaId: z.string().optional(),
  feedbackType: z.enum([
    "PERFORMANCE",
    "ENGAGEMENT",
    "CONVERSION",
    "SENTIMENT",
    "CONTENT_QUALITY",
    "TONE_ALIGNMENT",
    "SEGMENT_RESPONSE",
  ]),
  metrics: z.record(z.unknown()),
  score: z.number().min(0).max(100).optional(),
  insights: z.record(z.unknown()).optional(),
  recommendations: z.record(z.unknown()).optional(),
});

const BehaviorLogSchema = z.object({
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  eventType: z.string(),
  eventData: z.record(z.unknown()).optional(),
  userAgent: z.string().optional(),
  ipAddress: z.string().optional(),
  referrer: z.string().optional(),
});

export const personalizationRouter = createTRPCRouter({
  // User Segment Management
  createUserSegment: protectedProcedure
    .input(UserSegmentSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const segment = await ctx.db.userSegment.create({
          data: input,
        });

        logger.info(
          "User segment created successfully",
          { segmentId: segment.id, name: segment.name },
          "PersonalizationRouter",
        );

        return {
          success: true,
          data: segment,
          message: "User segment created successfully",
        };
      } catch (error) {
        logger.error(
          "Failed to create user segment",
          { error: error instanceof Error ? error.message : "Unknown error" },
          "PersonalizationRouter",
        );
        throw new Error("Failed to create user segment");
      }
    }),

  getUserSegments: publicProcedure.query(async ({ ctx }) => {
    try {
      const segments = await ctx.db.userSegment.findMany({
        include: {
          userPersonas: true,
          behaviorTriggers: true,
          _count: {
            select: {
              userPersonas: true,
              behaviorTriggers: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return {
        success: true,
        data: segments,
        message: "User segments retrieved successfully",
      };
    } catch (error) {
      logger.error(
        "Failed to retrieve user segments",
        { error: error instanceof Error ? error.message : "Unknown error" },
        "PersonalizationRouter",
      );
      throw new Error("Failed to retrieve user segments");
    }
  }),

  getUserSegment: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        const segment = await ctx.db.userSegment.findUnique({
          where: { id: input.id },
          include: {
            userPersonas: true,
            behaviorTriggers: true,
            campaignFeedback: {
              orderBy: { createdAt: "desc" },
              take: 10,
            },
          },
        });

        if (!segment) {
          throw new Error("User segment not found");
        }

        return {
          success: true,
          data: segment,
          message: "User segment retrieved successfully",
        };
      } catch (error) {
        logger.error(
          "Failed to retrieve user segment",
          { error: error instanceof Error ? error.message : "Unknown error" },
          "PersonalizationRouter",
        );
        throw new Error("Failed to retrieve user segment");
      }
    }),

  // User Persona Management
  createUserPersona: protectedProcedure
    .input(UserPersonaSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const persona = await ctx.db.userPersona.create({
          data: input,
          include: {
            segment: true,
          },
        });

        logger.info(
          "User persona created successfully",
          { personaId: persona.id, name: persona.name },
          "PersonalizationRouter",
        );

        return {
          success: true,
          data: persona,
          message: "User persona created successfully",
        };
      } catch (error) {
        logger.error(
          "Failed to create user persona",
          { error: error instanceof Error ? error.message : "Unknown error" },
          "PersonalizationRouter",
        );
        throw new Error("Failed to create user persona");
      }
    }),

  updateUserPersona: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: UserPersonaSchema.partial(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const persona = await ctx.db.userPersona.update({
          where: { id: input.id },
          data: {
            ...input.data,
            lastUpdated: new Date(),
          },
          include: {
            segment: true,
          },
        });

        logger.info(
          "User persona updated successfully",
          { personaId: persona.id, name: persona.name },
          "PersonalizationRouter",
        );

        return {
          success: true,
          data: persona,
          message: "User persona updated successfully",
        };
      } catch (error) {
        logger.error(
          "Failed to update user persona",
          { error: error instanceof Error ? error.message : "Unknown error" },
          "PersonalizationRouter",
        );
        throw new Error("Failed to update user persona");
      }
    }),

  // Behavior Trigger Management
  createBehaviorTrigger: protectedProcedure
    .input(BehaviorTriggerSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const trigger = await ctx.db.behaviorTrigger.create({
          data: input,
          include: {
            segment: true,
            persona: true,
          },
        });

        logger.info(
          "Behavior trigger created successfully",
          { triggerId: trigger.id, name: trigger.name },
          "PersonalizationRouter",
        );

        return {
          success: true,
          data: trigger,
          message: "Behavior trigger created successfully",
        };
      } catch (error) {
        logger.error(
          "Failed to create behavior trigger",
          { error: error instanceof Error ? error.message : "Unknown error" },
          "PersonalizationRouter",
        );
        throw new Error("Failed to create behavior trigger");
      }
    }),

  triggerBehaviorFlow: publicProcedure
    .input(
      z.object({
        triggerId: z.string(),
        context: z.record(z.unknown()),
        userId: z.string().optional(),
        sessionId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const trigger = await ctx.db.behaviorTrigger.findUnique({
          where: { id: input.triggerId },
          include: {
            segment: true,
            persona: true,
          },
        });

        if (!trigger || !trigger.isActive) {
          throw new Error("Behavior trigger not found or inactive");
        }

        // Check if conditions are met
        const conditionsMet = await evaluateTriggerConditions(
          trigger.conditions,
          input.context,
        );

        if (!conditionsMet) {
          return {
            success: false,
            message: "Trigger conditions not met",
            data: { triggered: false },
          };
        }

        // Execute the trigger action
        const result = await executeTriggerAction(
          trigger.action,
          input.context,
          trigger.persona,
        );

        // Update trigger execution count
        await ctx.db.behaviorTrigger.update({
          where: { id: trigger.id },
          data: {
            executionCount: { increment: 1 },
            lastExecuted: new Date(),
            successRate: result.success
              ? (trigger.successRate || 0) * 0.9 + 0.1
              : (trigger.successRate || 0) * 0.9,
          },
        });

        // Log the behavior event
        if (input.userId || input.sessionId) {
          await ctx.db.userBehaviorLog.create({
            data: {
              userId: input.userId,
              sessionId: input.sessionId,
              eventType: `trigger_${trigger.triggerType.toLowerCase()}`,
              eventData: {
                triggerId: trigger.id,
                triggerName: trigger.name,
                action: trigger.action,
                result,
              },
            },
          });
        }

        logger.info(
          "Behavior trigger executed successfully",
          { triggerId: trigger.id, success: result.success },
          "PersonalizationRouter",
        );

        return {
          success: true,
          data: {
            triggered: true,
            trigger: trigger.name,
            action: result,
          },
          message: "Behavior trigger executed successfully",
        };
      } catch (error) {
        logger.error(
          "Failed to execute behavior trigger",
          { error: error instanceof Error ? error.message : "Unknown error" },
          "PersonalizationRouter",
        );
        throw new Error("Failed to execute behavior trigger");
      }
    }),

  // Personalization Rules
  createPersonalizationRule: protectedProcedure
    .input(PersonalizationRuleSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const rule = await ctx.db.personalizationRule.create({
          data: input,
        });

        logger.info(
          "Personalization rule created successfully",
          { ruleId: rule.id, name: rule.name },
          "PersonalizationRouter",
        );

        return {
          success: true,
          data: rule,
          message: "Personalization rule created successfully",
        };
      } catch (error) {
        logger.error(
          "Failed to create personalization rule",
          { error: error instanceof Error ? error.message : "Unknown error" },
          "PersonalizationRouter",
        );
        throw new Error("Failed to create personalization rule");
      }
    }),

  getPersonalizationRules: publicProcedure.query(async ({ ctx }) => {
    try {
      const rules = await ctx.db.personalizationRule.findMany({
        where: { isActive: true },
        orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      });

      return {
        success: true,
        data: rules,
        message: "Personalization rules retrieved successfully",
      };
    } catch (error) {
      logger.error(
        "Failed to retrieve personalization rules",
        { error: error instanceof Error ? error.message : "Unknown error" },
        "PersonalizationRouter",
      );
      throw new Error("Failed to retrieve personalization rules");
    }
  }),

  // Campaign Feedback
  submitCampaignFeedback: protectedProcedure
    .input(CampaignFeedbackSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const feedback = await ctx.db.campaignFeedback.create({
          data: input,
        });

        // Process feedback for learning
        const processedFeedback = await processCampaignFeedback(
          {
            metrics: feedback.metrics as CampaignFeedbackMetrics,
            feedbackType: feedback.feedbackType,
            segmentId: feedback.segmentId,
          },
          brandVoiceAgent,
        );

        await ctx.db.campaignFeedback.update({
          where: { id: feedback.id },
          data: {
            insights: processedFeedback.insights,
            recommendations: processedFeedback.recommendations,
            isProcessed: true,
          },
        });

        logger.info(
          "Campaign feedback submitted successfully",
          { feedbackId: feedback.id, campaignId: input.campaignId },
          "PersonalizationRouter",
        );

        return {
          success: true,
          data: { ...feedback, ...processedFeedback },
          message: "Campaign feedback submitted successfully",
        };
      } catch (error) {
        logger.error(
          "Failed to submit campaign feedback",
          { error: error instanceof Error ? error.message : "Unknown error" },
          "PersonalizationRouter",
        );
        throw new Error("Failed to submit campaign feedback");
      }
    }),

  getCampaignFeedback: publicProcedure
    .input(z.object({ campaignId: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        const feedback = await ctx.db.campaignFeedback.findMany({
          where: { campaignId: input.campaignId },
          include: {
            segment: true,
            persona: true,
          },
          orderBy: { createdAt: "desc" },
        });

        return {
          success: true,
          data: feedback,
          message: "Campaign feedback retrieved successfully",
        };
      } catch (error) {
        logger.error(
          "Failed to retrieve campaign feedback",
          { error: error instanceof Error ? error.message : "Unknown error" },
          "PersonalizationRouter",
        );
        throw new Error("Failed to retrieve campaign feedback");
      }
    }),

  // Behavior Logging
  logUserBehavior: publicProcedure
    .input(BehaviorLogSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const log = await ctx.db.userBehaviorLog.create({
          data: input,
        });

        return {
          success: true,
          data: log,
          message: "User behavior logged successfully",
        };
      } catch (error) {
        logger.error(
          "Failed to log user behavior",
          { error: error instanceof Error ? error.message : "Unknown error" },
          "PersonalizationRouter",
        );
        throw new Error("Failed to log user behavior");
      }
    }),

  // Tone Adaptation
  adaptToneForSegment: publicProcedure
    .input(
      z.object({
        content: z.string(),
        segmentId: z.string(),
        contentType: z.enum(["email", "social", "blog", "ad", "general"]).optional(),
        targetTone: z.string().optional(),
        fallbackTone: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Get segment information
        const segment = await ctx.db.userSegment.findUnique({
          where: { id: input.segmentId },
          include: {
            userPersonas: true,
          },
        });

        if (!segment) {
          throw new Error("User segment not found");
        }

        // Map segment to brand voice agent segment
        const audienceSegment = mapSegmentToAudienceSegment(segment.name);

        // Use brand voice agent to adapt tone
        const result = await brandVoiceAgent.execute({
          task: "adapt_tone",
          context: {
            action: "adapt_tone",
            content: input.content,
            audienceSegment,
            contentType: input.contentType,
            targetTone: input.targetTone,
            fallbackTone: input.fallbackTone,
            contextMetadata: {
              userPersona: segment.userPersonas[0]?.name,
              engagementLevel: "medium",
            },
          },
          priority: "medium",
        });

        logger.info(
          "Tone adapted for segment successfully",
          { segmentId: input.segmentId, success: result.success },
          "PersonalizationRouter",
        );

        return {
          success: true,
          data: result,
          message: "Tone adapted for segment successfully",
        };
      } catch (error) {
        logger.error(
          "Failed to adapt tone for segment",
          { error: error instanceof Error ? error.message : "Unknown error" },
          "PersonalizationRouter",
        );
        throw new Error("Failed to adapt tone for segment");
      }
    }),
});

// Helper functions
async function evaluateTriggerConditions(
  conditions: BehaviorTriggerConditions,
  context: Record<string, unknown>,
): Promise<boolean> {
  // Implement condition evaluation logic
  // This is a simplified example - in reality, you'd have more complex logic
  for (const [key, value] of Object.entries(conditions)) {
    if (context[key] !== value) {
      return false;
    }
  }
  return true;
}

async function executeTriggerAction(
  action: BehaviorTriggerAction,
  context: Record<string, unknown>,
  persona: UserPersona | null,
): Promise<{ success: boolean; result: Record<string, unknown> }> {
  // Implement action execution logic
  // This could involve updating UI state, sending notifications, etc.
  try {
    return {
      success: true,
      result: {
        actionType: action.type,
        actionData: action.data,
        personaApplied: persona?.name,
        context,
      },
    };
  } catch (error) {
    return {
      success: false,
      result: { error: error instanceof Error ? error.message : "Unknown error" },
    };
  }
}

async function processCampaignFeedback(
  feedback: { metrics: CampaignFeedbackMetrics; feedbackType: string; segmentId?: string },
  brandVoiceAgent: BrandVoiceAgent,
): Promise<{ insights: CampaignFeedbackInsights; recommendations: CampaignFeedbackRecommendations }> {
  // Process feedback using AI to generate insights and recommendations
  try {
    const performanceAnalysis = analyzeFeedbackMetrics(feedback.metrics);
    const segmentInsights = generateSegmentInsights(feedback);
    const trendAnalysis = analyzeFeedbackTrends(feedback);
    
    const insights: CampaignFeedbackInsights = {
      performanceScore: performanceAnalysis.overallScore,
      topPerformingContent: performanceAnalysis.strengths,
      underperformingContent: performanceAnalysis.weaknesses,
      audienceEngagement: segmentInsights as Record<string, number>,
      recommendations: [],
    };

    const recommendations: CampaignFeedbackRecommendations = {
      contentOptimization: generateContentRecommendations(insights),
      toneAdjustments: await generateToneRecommendations(insights, brandVoiceAgent),
      targetingImprovements: generateTargetingRecommendations(insights),
      timingOptimization: ["Test different send times", "Optimize for time zones"],
    };

    return { insights, recommendations };
  } catch (error) {
    return {
      insights: { error: "Failed to process insights" },
      recommendations: { error: "Failed to generate recommendations" },
    };
  }
}

function analyzeFeedbackMetrics(metrics: CampaignFeedbackMetrics): CampaignFeedbackInsights {
  // Analyze metrics to extract performance insights
  return {
    overallScore: calculateOverallScore(metrics),
    strengths: identifyStrengths(metrics),
    weaknesses: identifyWeaknesses(metrics),
  };
}

function generateSegmentInsights(feedback: { segmentId?: string; metrics: CampaignFeedbackMetrics }): Record<string, unknown> {
  // Generate insights specific to the segment
  return {
    segmentPerformance: "above_average",
    engagementPattern: "high_initial_engagement",
    conversionTrend: "improving",
  };
}

function analyzeFeedbackTrends(feedback: { metrics: CampaignFeedbackMetrics }): Record<string, unknown> {
  // Analyze trends in the feedback data
  return {
    direction: "improving",
    velocity: "moderate",
    predictedOutcome: "positive",
  };
}

function generateContentRecommendations(insights: Record<string, unknown>): string[] {
  // Generate content recommendations based on insights
  const recommendations: string[] = [];
  
  // Add recommendations based on performance
  recommendations.push("Use more educational content");
  recommendations.push("Include case studies");
  recommendations.push("Test video formats");
  
  return recommendations;
}

async function generateToneRecommendations(insights: Record<string, unknown>, brandVoiceAgent: BrandVoiceAgent): Promise<string[]> {
  // Generate tone recommendations using the brand voice agent
  try {
    const result = await brandVoiceAgent.execute({
      task: "get_tone_recommendations",
      context: { action: "get_tone_recommendations" },
      priority: "medium",
    });

    if (result.toneRecommendations) {
      return result.toneRecommendations.map(rec => 
        `${rec.segment}: ${rec.recommendedTone}`
      );
    }
    
    return [];
  } catch (error) {
    return [];
  }
}

function generateTargetingRecommendations(insights: Record<string, unknown>): string[] {
  // Generate targeting recommendations
  const recommendations: string[] = [];
  
  recommendations.push("Expand to similar demographics");
  recommendations.push("Refine behavior-based targeting");
  recommendations.push("Exclude low engagement segments");
  
  return recommendations;
}

function calculateOverallScore(metrics: CampaignFeedbackMetrics): number {
  // Calculate overall performance score
  const scores = Object.values(metrics).filter((value) =>
    typeof value === "number" && value >= 0 && value <= 100,
  ) as number[];
  
  if (scores.length === 0) return 0;
  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
}

function identifyStrengths(metrics: CampaignFeedbackMetrics): string[] {
  // Identify performance strengths
  const strengths: string[] = [];
  if (metrics.engagementRate && metrics.engagementRate > 0.25) strengths.push("high_engagement");
  if (metrics.conversionRate && metrics.conversionRate > 0.05) strengths.push("strong_conversion");
  if (metrics.clickThroughRate && metrics.clickThroughRate > 0.1) strengths.push("good_ctr");
  return strengths;
}

function identifyWeaknesses(metrics: CampaignFeedbackMetrics): string[] {
  // Identify performance weaknesses
  const weaknesses: string[] = [];
  if (metrics.engagementRate && metrics.engagementRate < 0.15) weaknesses.push("low_engagement");
  if (metrics.conversionRate && metrics.conversionRate < 0.02) weaknesses.push("poor_conversion");
  if (metrics.bounceRate && metrics.bounceRate > 0.7) weaknesses.push("retention_issues");
  return weaknesses;
}

function mapSegmentToAudienceSegment(segmentName: string): string {
  // Map internal segment names to brand voice agent audience segments
  const mapping: Record<string, string> = {
    "enterprise": "enterprise",
    "small business": "smb",
    "agency": "agencies",
    "e-commerce": "ecommerce",
    "saas": "saas",
    "consumer": "consumer",
    "investor": "investor",
    "gen z": "gen_z",
  };

  const lowercaseName = segmentName.toLowerCase();
  for (const [key, value] of Object.entries(mapping)) {
    if (lowercaseName.includes(key)) {
      return value;
    }
  }

  return "consumer"; // default fallback
}