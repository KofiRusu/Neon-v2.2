import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { ContentAgent, SEOAgent, EmailMarketingAgent } from "@neon/core-agents";
import { logger } from "@neon/utils";

// Zod schemas for agent inputs
const ContentGenerationSchema = z.object({
  type: z.enum(["blog", "social_post", "email", "caption", "copy"]),
  topic: z.string().min(1, "Topic is required"),
  audience: z.string().min(1, "Audience is required"),
  tone: z.enum([
    "professional",
    "casual",
    "friendly",
    "authoritative",
    "playful",
  ]),
  keywords: z.array(z.string()).optional(),
  length: z.enum(["short", "medium", "long"]).optional(),
  platform: z
    .enum(["facebook", "instagram", "twitter", "linkedin", "email"])
    .optional(),
});

const SEOOptimizationSchema = z.object({
  content: z.string().min(1, "Content is required"),
  targetKeywords: z
    .array(z.string())
    .min(1, "At least one target keyword is required"),
  contentType: z.enum(["blog", "page", "product", "article"]),
  title: z.string().optional(),
  description: z.string().optional(),
  url: z.string().url().optional(),
  focusKeyword: z.string().optional(),
  businessContext: z.string().optional(),
  targetAudience: z.string().optional(),
});

const SEOMetaTagsSchema = z.object({
  topic: z.string().min(1, "Topic is required"),
  content: z.string().min(1, "Content is required"),
  keywords: z.array(z.string()).optional(),
  businessContext: z.string().optional(),
  targetAudience: z.string().optional(),
  contentType: z.enum(["blog", "page", "product", "article"]).optional(),
});

const EmailSequenceSchema = z.object({
  topic: z.string().min(1, "Topic is required"),
  audience: z.string().min(1, "Audience is required"),
  businessType: z.string().optional(),
  sequenceLength: z.number().min(1).max(10).default(3),
  tone: z
    .enum(["professional", "casual", "friendly", "urgent"])
    .default("professional"),
  goals: z.array(z.string()).optional(),
  industry: z.string().optional(),
});

const EmailPersonalizationSchema = z.object({
  baseEmail: z.string().min(1, "Base email content is required"),
  userTraits: z.record(z.any()),
  segmentData: z
    .object({
      segment: z.string(),
      characteristics: z.array(z.string()),
      preferences: z.array(z.string()).optional(),
    })
    .optional(),
  businessContext: z.string().optional(),
});

const EmailPerformanceSchema = z.object({
  campaignId: z.string().min(1, "Campaign ID is required"),
  sent: z.number().min(0),
  delivered: z.number().min(0),
  opens: z.number().min(0),
  clicks: z.number().min(0),
  conversions: z.number().min(0).optional(),
  unsubscribes: z.number().min(0).optional(),
  bounces: z.number().min(0).optional(),
  complaints: z.number().min(0).optional(),
  timeRange: z.string().default("30d"),
});

// Agent execution schema
const AgentExecutionSchema = z.object({
  agentType: z.enum(["content", "seo", "email"]),
  task: z.string(),
  context: z.record(z.any()),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  metadata: z.record(z.any()).optional(),
});

// Initialize agent instances
const contentAgent = new ContentAgent();
const seoAgent = new SEOAgent();
const emailAgent = new EmailMarketingAgent();

export const agentsRouter = router({
  // Health check for all agents
  health: publicProcedure.query(async () => {
    try {
      const agentStatuses = await Promise.all([
        contentAgent.getStatus(),
        seoAgent.getStatus(),
        emailAgent.getStatus(),
      ]);

      return {
        success: true,
        timestamp: new Date().toISOString(),
        agents: {
          content: agentStatuses[0],
          seo: agentStatuses[1],
          email: agentStatuses[2],
        },
        systemStatus: agentStatuses.every((status) => status.status !== "error")
          ? "healthy"
          : "degraded",
      };
    } catch (error) {
      logger.error("Agent health check failed", { error }, "AgentsRouter");
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to check agent health",
      });
    }
  }),

  // Generic agent execution endpoint
  execute: publicProcedure
    .input(AgentExecutionSchema)
    .mutation(async ({ input }) => {
      try {
        const { agentType, task, context, priority, metadata } = input;

        let agent;
        switch (agentType) {
          case "content":
            agent = contentAgent;
            break;
          case "seo":
            agent = seoAgent;
            break;
          case "email":
            agent = emailAgent;
            break;
          default:
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Unknown agent type: ${agentType}`,
            });
        }

        const result = await agent.execute({
          task,
          context,
          priority,
          metadata,
        });

        logger.info(
          `Agent execution completed`,
          {
            agentType,
            task,
            success: result.success,
            performance: result.performance,
          },
          "AgentsRouter",
        );

        return result;
      } catch (error) {
        logger.error(
          "Agent execution failed",
          { error, input },
          "AgentsRouter",
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error ? error.message : "Agent execution failed",
        });
      }
    }),

  // Content Agent endpoints
  content: router({
    // Generate content
    generate: publicProcedure
      .input(ContentGenerationSchema)
      .mutation(async ({ input }) => {
        try {
          const result = await contentAgent.execute({
            task: "generate_content",
            context: input,
            priority: "medium",
          });

          return result;
        } catch (error) {
          logger.error(
            "Content generation failed",
            { error, input },
            "ContentAgent",
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message:
              error instanceof Error
                ? error.message
                : "Content generation failed",
          });
        }
      }),

    // Generate blog post
    generateBlog: publicProcedure
      .input(ContentGenerationSchema.omit({ type: true }))
      .mutation(async ({ input }) => {
        try {
          const result = await contentAgent.execute({
            task: "generate_blog",
            context: { ...input, type: "blog", length: "long" },
            priority: "medium",
          });

          return result;
        } catch (error) {
          logger.error(
            "Blog generation failed",
            { error, input },
            "ContentAgent",
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message:
              error instanceof Error ? error.message : "Blog generation failed",
          });
        }
      }),

    // Generate social post
    generatePost: publicProcedure
      .input(ContentGenerationSchema.omit({ type: true }))
      .mutation(async ({ input }) => {
        try {
          const result = await contentAgent.execute({
            task: "generate_post",
            context: { ...input, type: "social_post" },
            priority: "medium",
          });

          return result;
        } catch (error) {
          logger.error(
            "Post generation failed",
            { error, input },
            "ContentAgent",
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message:
              error instanceof Error ? error.message : "Post generation failed",
          });
        }
      }),

    // Generate caption
    generateCaption: publicProcedure
      .input(ContentGenerationSchema.omit({ type: true }))
      .mutation(async ({ input }) => {
        try {
          const result = await contentAgent.execute({
            task: "generate_caption",
            context: { ...input, type: "caption", length: "short" },
            priority: "medium",
          });

          return result;
        } catch (error) {
          logger.error(
            "Caption generation failed",
            { error, input },
            "ContentAgent",
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message:
              error instanceof Error
                ? error.message
                : "Caption generation failed",
          });
        }
      }),
  }),

  // SEO Agent endpoints
  seo: router({
    // Analyze content for SEO
    analyzeContent: publicProcedure
      .input(SEOOptimizationSchema)
      .mutation(async ({ input }) => {
        try {
          const result = await seoAgent.execute({
            task: "analyze_content",
            context: input,
            priority: "medium",
          });

          return result;
        } catch (error) {
          logger.error(
            "SEO content analysis failed",
            { error, input },
            "SEOAgent",
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message:
              error instanceof Error ? error.message : "SEO analysis failed",
          });
        }
      }),

    // Optimize keywords
    optimizeKeywords: publicProcedure
      .input(SEOOptimizationSchema)
      .mutation(async ({ input }) => {
        try {
          const result = await seoAgent.execute({
            task: "optimize_keywords",
            context: input,
            priority: "medium",
          });

          return result;
        } catch (error) {
          logger.error(
            "Keyword optimization failed",
            { error, input },
            "SEOAgent",
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message:
              error instanceof Error
                ? error.message
                : "Keyword optimization failed",
          });
        }
      }),

    // Generate meta tags
    generateMetaTags: publicProcedure
      .input(SEOMetaTagsSchema)
      .mutation(async ({ input }) => {
        try {
          const result = await seoAgent.execute({
            task: "generate_meta_tags",
            context: input,
            priority: "medium",
          });

          return result;
        } catch (error) {
          logger.error(
            "Meta tags generation failed",
            { error, input },
            "SEOAgent",
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message:
              error instanceof Error
                ? error.message
                : "Meta tags generation failed",
          });
        }
      }),

    // Recommend keywords
    recommendKeywords: publicProcedure
      .input(
        z.object({
          topic: z.string().min(1, "Topic is required"),
          businessContext: z.string().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        try {
          const result = await seoAgent.execute({
            task: "recommend_keywords",
            context: input,
            priority: "medium",
          });

          return result;
        } catch (error) {
          logger.error(
            "Keyword recommendations failed",
            { error, input },
            "SEOAgent",
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message:
              error instanceof Error
                ? error.message
                : "Keyword recommendations failed",
          });
        }
      }),

    // Generate schema markup
    generateSchema: publicProcedure
      .input(SEOOptimizationSchema)
      .mutation(async ({ input }) => {
        try {
          const result = await seoAgent.execute({
            task: "generate_schema",
            context: input,
            priority: "medium",
          });

          return result;
        } catch (error) {
          logger.error(
            "Schema generation failed",
            { error, input },
            "SEOAgent",
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message:
              error instanceof Error
                ? error.message
                : "Schema generation failed",
          });
        }
      }),

    // Technical SEO audit
    auditTechnicalSEO: publicProcedure
      .input(
        z.object({
          url: z.string().url("Valid URL is required"),
          content: z.string().min(1, "Content is required"),
        }),
      )
      .mutation(async ({ input }) => {
        try {
          const result = await seoAgent.execute({
            task: "audit_technical_seo",
            context: input,
            priority: "medium",
          });

          return result;
        } catch (error) {
          logger.error(
            "Technical SEO audit failed",
            { error, input },
            "SEOAgent",
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message:
              error instanceof Error
                ? error.message
                : "Technical SEO audit failed",
          });
        }
      }),
  }),

  // Email Agent endpoints
  email: router({
    // Generate email sequence
    generateSequence: publicProcedure
      .input(EmailSequenceSchema)
      .mutation(async ({ input }) => {
        try {
          const result = await emailAgent.execute({
            task: "generate_email_sequence",
            context: input,
            priority: "medium",
          });

          return result;
        } catch (error) {
          logger.error(
            "Email sequence generation failed",
            { error, input },
            "EmailAgent",
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message:
              error instanceof Error
                ? error.message
                : "Email sequence generation failed",
          });
        }
      }),

    // Personalize email
    personalizeEmail: publicProcedure
      .input(EmailPersonalizationSchema)
      .mutation(async ({ input }) => {
        try {
          const result = await emailAgent.execute({
            task: "personalize_email",
            context: input,
            priority: "medium",
          });

          return result;
        } catch (error) {
          logger.error(
            "Email personalization failed",
            { error, input },
            "EmailAgent",
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message:
              error instanceof Error
                ? error.message
                : "Email personalization failed",
          });
        }
      }),

    // Analyze email performance
    analyzePerformance: publicProcedure
      .input(EmailPerformanceSchema)
      .mutation(async ({ input }) => {
        try {
          const result = await emailAgent.execute({
            task: "analyze_performance",
            context: input,
            priority: "medium",
          });

          return result;
        } catch (error) {
          logger.error(
            "Email performance analysis failed",
            { error, input },
            "EmailAgent",
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message:
              error instanceof Error
                ? error.message
                : "Email performance analysis failed",
          });
        }
      }),

    // Generate subject lines
    generateSubjectLines: publicProcedure
      .input(
        z.object({
          topic: z.string().min(1, "Topic is required"),
          audience: z.string().min(1, "Audience is required"),
          tone: z
            .enum(["professional", "casual", "friendly", "urgent"])
            .default("professional"),
          count: z.number().min(1).max(20).default(5),
        }),
      )
      .mutation(async ({ input }) => {
        try {
          const result = await emailAgent.execute({
            task: "generate_subject_lines",
            context: input,
            priority: "medium",
          });

          return result;
        } catch (error) {
          logger.error(
            "Subject line generation failed",
            { error, input },
            "EmailAgent",
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message:
              error instanceof Error
                ? error.message
                : "Subject line generation failed",
          });
        }
      }),

    // Create newsletter
    createNewsletter: publicProcedure
      .input(
        z.object({
          topic: z.string().min(1, "Topic is required"),
          audience: z.string().min(1, "Audience is required"),
          sections: z.array(z.string()).optional(),
          tone: z
            .enum(["professional", "casual", "friendly"])
            .default("professional"),
        }),
      )
      .mutation(async ({ input }) => {
        try {
          const result = await emailAgent.execute({
            task: "create_newsletter",
            context: input,
            priority: "medium",
          });

          return result;
        } catch (error) {
          logger.error(
            "Newsletter creation failed",
            { error, input },
            "EmailAgent",
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message:
              error instanceof Error
                ? error.message
                : "Newsletter creation failed",
          });
        }
      }),
  }),

  // Agent management endpoints
  getAgentTypes: publicProcedure.query(() => {
    return {
      success: true,
      data: ["content", "seo", "email"],
    };
  }),

  getAgentCapabilities: publicProcedure
    .input(
      z.object({
        agentType: z.enum(["content", "seo", "email"]),
      }),
    )
    .query(({ input }) => {
      const capabilities = {
        content: contentAgent.getCapabilities(),
        seo: seoAgent.getCapabilities(),
        email: emailAgent.getCapabilities(),
      };

      return {
        success: true,
        data: {
          agentType: input.agentType,
          capabilities: capabilities[input.agentType],
        },
      };
    }),

  getAgentStatus: publicProcedure
    .input(
      z.object({
        agentType: z.enum(["content", "seo", "email"]),
      }),
    )
    .query(async ({ input }) => {
      try {
        let status;
        switch (input.agentType) {
          case "content":
            status = await contentAgent.getStatus();
            break;
          case "seo":
            status = await seoAgent.getStatus();
            break;
          case "email":
            status = await emailAgent.getStatus();
            break;
        }

        return {
          success: true,
          data: status,
        };
      } catch (error) {
        logger.error(
          "Failed to get agent status",
          { error, agentType: input.agentType },
          "AgentsRouter",
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get agent status",
        });
      }
    }),
});

export type AgentsRouter = typeof agentsRouter;
