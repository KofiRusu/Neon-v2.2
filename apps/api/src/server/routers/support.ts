import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';
import {
  CustomerSupportAgent,
  type MessageClassificationInput,
  type ReplyGenerationInput,
  type SentimentAnalysisInput,
  type EscalationInput,
} from '@neon/core-agents';
import { logger } from '@neon/utils';

// Validation schemas
const MessageClassificationInputSchema = z.object({
  text: z.string().min(1, 'Message text is required'),
  customer: z
    .object({
      id: z.string().optional(),
      name: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      history: z
        .array(
          z.object({
            message: z.string(),
            timestamp: z.date(),
            channel: z.string(),
          })
        )
        .optional(),
    })
    .optional(),
  context: z
    .object({
      channel: z.enum(['whatsapp', 'email', 'chat', 'phone', 'social']),
      previousInteractions: z.number().optional(),
      customerTier: z.enum(['basic', 'premium', 'enterprise']).optional(),
    })
    .optional(),
});

const ReplyGenerationInputSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  tone: z
    .enum(['professional', 'friendly', 'empathetic', 'apologetic', 'informative'])
    .default('professional'),
  customer: z
    .object({
      name: z.string().optional(),
      tier: z.enum(['basic', 'premium', 'enterprise']).optional(),
      language: z.string().optional(),
      preferences: z.array(z.string()).optional(),
    })
    .optional(),
  context: z
    .object({
      ticketHistory: z
        .array(
          z.object({
            message: z.string(),
            response: z.string().optional(),
            timestamp: z.date(),
          })
        )
        .optional(),
      relatedArticles: z
        .array(
          z.object({
            title: z.string(),
            url: z.string(),
            relevance: z.number(),
          })
        )
        .optional(),
      previousResolution: z.string().optional(),
    })
    .optional(),
  constraints: z
    .object({
      maxLength: z.number().optional(),
      includeLinks: z.boolean().optional(),
      escalationAvailable: z.boolean().optional(),
    })
    .optional(),
});

const SentimentAnalysisInputSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  context: z
    .object({
      previousMessages: z.array(z.string()).optional(),
      customerHistory: z.string().optional(),
      interactionType: z.string().optional(),
    })
    .optional(),
});

const EscalationInputSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  ticketId: z.string().optional(),
  reason: z.string().optional(),
  customerTier: z.enum(['basic', 'premium', 'enterprise']).optional(),
  agentWorkload: z.number().optional(),
});

export const supportRouter = createTRPCRouter({
  /**
   * Classify incoming support messages using AI
   */
  classifyMessage: publicProcedure
    .input(MessageClassificationInputSchema)
    .mutation(async ({ input }) => {
      try {
        logger.info(
          'Classifying support message',
          { messageLength: input.text.length },
          'SupportRouter'
        );

        const agent = new CustomerSupportAgent();
        const result = await agent.classifyMessageAPI(input as MessageClassificationInput);

        logger.info(
          'Message classified successfully',
          { intent: result.intent, urgency: result.urgency },
          'SupportRouter'
        );

        return {
          success: true,
          data: result,
          message: 'Message classified successfully',
        };
      } catch (error) {
        logger.error(
          'Failed to classify message',
          { error: error instanceof Error ? error.message : 'Unknown error' },
          'SupportRouter'
        );
        throw new Error(
          `Failed to classify message: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }),

  /**
   * Generate AI-powered support replies
   */
  generateReply: publicProcedure.input(ReplyGenerationInputSchema).mutation(async ({ input }) => {
    try {
      logger.info(
        'Generating support reply',
        { tone: input.tone, messageLength: input.message.length },
        'SupportRouter'
      );

      const agent = new CustomerSupportAgent();
      const result = await agent.generateReplyAPI(input as ReplyGenerationInput);

      logger.info(
        'Reply generated successfully',
        { confidence: result.confidence, escalationRecommended: result.escalationRecommended },
        'SupportRouter'
      );

      return {
        success: true,
        data: result,
        message: 'Reply generated successfully',
      };
    } catch (error) {
      logger.error(
        'Failed to generate reply',
        { error: error instanceof Error ? error.message : 'Unknown error' },
        'SupportRouter'
      );
      throw new Error(
        `Failed to generate reply: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }),

  /**
   * Analyze customer sentiment using AI
   */
  analyzeSentiment: publicProcedure
    .input(SentimentAnalysisInputSchema)
    .mutation(async ({ input }) => {
      try {
        logger.info(
          'Analyzing sentiment',
          { messageLength: input.message.length },
          'SupportRouter'
        );

        const agent = new CustomerSupportAgent();
        const result = await agent.analyzeSentimentAPI(input as SentimentAnalysisInput);

        logger.info(
          'Sentiment analyzed successfully',
          { sentiment: result.sentiment, score: result.score },
          'SupportRouter'
        );

        return {
          success: true,
          data: result,
          message: 'Sentiment analyzed successfully',
        };
      } catch (error) {
        logger.error(
          'Failed to analyze sentiment',
          { error: error instanceof Error ? error.message : 'Unknown error' },
          'SupportRouter'
        );
        throw new Error(
          `Failed to analyze sentiment: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }),

  /**
   * Determine escalation requirements
   */
  checkEscalation: publicProcedure.input(EscalationInputSchema).mutation(async ({ input }) => {
    try {
      logger.info(
        'Checking escalation requirements',
        { customerTier: input.customerTier },
        'SupportRouter'
      );

      const agent = new CustomerSupportAgent();
      const result = await agent.escalateAPI(input as EscalationInput);

      logger.info(
        'Escalation check completed',
        { shouldEscalate: result.shouldEscalate, level: result.escalationLevel },
        'SupportRouter'
      );

      return {
        success: true,
        data: result,
        message: 'Escalation check completed',
      };
    } catch (error) {
      logger.error(
        'Failed to check escalation',
        { error: error instanceof Error ? error.message : 'Unknown error' },
        'SupportRouter'
      );
      throw new Error(
        `Failed to check escalation: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }),
  sendWhatsAppMessage: publicProcedure
    .input(
      z.object({
        recipient: z.string(),
        message: z.object({
          type: z.enum(['text', 'image', 'document', 'template']),
          content: z.string(),
          media: z
            .object({
              url: z.string(),
              caption: z.string().optional(),
              filename: z.string().optional(),
            })
            .optional(),
          template: z
            .object({
              name: z.string(),
              language: z.string(),
              parameters: z.array(z.string()).optional(),
            })
            .optional(),
        }),
        settings: z.object({
          businessId: z.string().optional(),
          accessToken: z.string().optional(),
          webhookUrl: z.string().optional(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      const supportAgent = new CustomerSupportAgent();
      return await supportAgent.sendMessage(input);
    }),

  createTicket: publicProcedure
    .input(
      z.object({
        ticketId: z.string().optional(),
        customer: z.object({
          name: z.string().optional(),
          email: z.string().optional(),
          phone: z.string().optional(),
          customerId: z.string().optional(),
        }),
        channel: z.enum(['whatsapp', 'email', 'chat', 'phone', 'social']),
        subject: z.string(),
        message: z.string(),
        priority: z.enum(['low', 'medium', 'high', 'critical']),
        category: z.string().optional(),
        metadata: z.record(z.any()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const supportAgent = new CustomerSupportAgent();
      return await supportAgent.createTicket(input);
    }),

  updateTicket: publicProcedure
    .input(
      z.object({
        ticketId: z.string(),
        update: z.object({
          status: z
            .enum(['open', 'in_progress', 'pending_customer', 'resolved', 'closed'])
            .optional(),
          priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
          assignedTo: z.string().optional(),
          resolution: z.string().optional(),
          satisfactionScore: z.number().min(1).max(5).optional(),
          customerConfirmed: z.boolean().optional(),
          tags: z.array(z.string()).optional(),
        }),
        agentId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const supportAgent = new CustomerSupportAgent();
      return await supportAgent.execute({
        task: 'update_ticket',
        context: input,
        priority: 'medium',
      });
    }),

  generateAutoResponse: publicProcedure
    .input(
      z.object({
        message: z.string(),
        customer: z.object({
          name: z.string().optional(),
          email: z.string().optional(),
          phone: z.string().optional(),
          customerId: z.string().optional(),
        }),
        ticketHistory: z.array(z.any()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const supportAgent = new CustomerSupportAgent();
      return await supportAgent.execute({
        task: 'auto_respond',
        context: input,
        priority: 'high',
      });
    }),

  escalateTicket: publicProcedure
    .input(
      z.object({
        ticketId: z.string(),
        reason: z.string(),
        priority: z.enum(['low', 'medium', 'high', 'critical']),
        requiredSkills: z.array(z.string()).optional(),
        urgency: z.enum(['low', 'medium', 'high']).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const supportAgent = new CustomerSupportAgent();
      return await supportAgent.execute({
        task: 'escalate_ticket',
        context: input,
        priority: 'high',
      });
    }),

  generateTicketSummary: publicProcedure
    .input(
      z.object({
        ticketId: z.string(),
      })
    )
    .query(async ({ input }) => {
      const supportAgent = new CustomerSupportAgent();
      return await supportAgent.execute({
        task: 'generate_summary',
        context: input,
        priority: 'low',
      });
    }),

  manageKnowledgeBase: publicProcedure
    .input(
      z.object({
        action: z.enum(['add_article', 'update_article', 'search_articles', 'get_suggestions']),
        data: z.any(),
      })
    )
    .mutation(async ({ input }) => {
      const supportAgent = new CustomerSupportAgent();
      return await supportAgent.execute({
        task: 'manage_knowledge_base',
        context: input,
        priority: 'medium',
      });
    }),

  getTicketAnalytics: publicProcedure
    .input(
      z.object({
        timeRange: z.object({
          start: z.date(),
          end: z.date(),
        }),
        filters: z
          .object({
            channel: z.array(z.string()).optional(),
            priority: z.array(z.string()).optional(),
            status: z.array(z.string()).optional(),
            agentId: z.string().optional(),
          })
          .optional(),
      })
    )
    .query(async ({ input: _input }) => {
      // Return support analytics (input ignored for mock data)
      return {
        data: {
          totalTickets: 1250,
          resolvedTickets: 1100,
          avgResponseTime: 15, // minutes
          avgResolutionTime: 180, // minutes
          customerSatisfaction: 4.2,
          channelBreakdown: {
            whatsapp: 45,
            email: 30,
            chat: 15,
            phone: 8,
            social: 2,
          },
          priorityBreakdown: {
            low: 35,
            medium: 45,
            high: 15,
            critical: 5,
          },
          resolutionRate: 88,
          escalationRate: 12,
          topCategories: [
            { category: 'Technical Issues', count: 350 },
            { category: 'Billing Questions', count: 280 },
            { category: 'Account Management', count: 220 },
            { category: 'Product Information', count: 180 },
            { category: 'General Inquiry', count: 120 },
          ],
        },
      };
    }),

  getSupportAgents: publicProcedure.query(async () => {
    // Return list of available support agents
    return {
      data: [
        {
          id: 'agent_001',
          name: 'Sarah Johnson',
          email: 'sarah@company.com',
          skills: ['Technical Support', 'Billing', 'Account Management'],
          status: 'online',
          currentTickets: 8,
          maxTickets: 15,
          avgResolutionTime: 120, // minutes
          satisfactionRating: 4.7,
        },
        {
          id: 'agent_002',
          name: 'Mike Chen',
          email: 'mike@company.com',
          skills: ['Product Support', 'Technical Issues', 'Integration Help'],
          status: 'online',
          currentTickets: 12,
          maxTickets: 20,
          avgResolutionTime: 95,
          satisfactionRating: 4.5,
        },
        {
          id: 'agent_003',
          name: 'Emily Rodriguez',
          email: 'emily@company.com',
          skills: ['Customer Success', 'Onboarding', 'Training'],
          status: 'busy',
          currentTickets: 6,
          maxTickets: 12,
          avgResolutionTime: 150,
          satisfactionRating: 4.8,
        },
      ],
    };
  }),

  getWhatsAppTemplates: publicProcedure.query(async () => {
    // Return available WhatsApp message templates
    return {
      data: [
        {
          id: 'welcome_new_customer',
          name: 'Welcome New Customer',
          language: 'en',
          category: 'ACCOUNT_UPDATE',
          status: 'APPROVED',
          components: [
            {
              type: 'HEADER',
              format: 'TEXT',
              text: 'Welcome to {{1}}!',
            },
            {
              type: 'BODY',
              text: 'Hi {{1}}, thank you for joining us. Your account has been created successfully.',
            },
            {
              type: 'FOOTER',
              text: 'Questions? Reply to this message.',
            },
          ],
        },
        {
          id: 'order_confirmation',
          name: 'Order Confirmation',
          language: 'en',
          category: 'ACCOUNT_UPDATE',
          status: 'APPROVED',
          components: [
            {
              type: 'HEADER',
              format: 'TEXT',
              text: 'Order Confirmed',
            },
            {
              type: 'BODY',
              text: 'Your order {{1}} has been confirmed. Total: ${{2}}. Expected delivery: {{3}}.',
            },
          ],
        },
      ],
    };
  }),

  /**
   * Get agent status and health check
   */
  getAgentStatus: publicProcedure.query(async () => {
    try {
      const agent = new CustomerSupportAgent();
      const status = await agent.getStatus();

      return {
        success: true,
        data: {
          agentId: agent.id,
          agentName: agent.name,
          type: agent.type,
          capabilities: agent.capabilities,
          status: status.status,
          performance: status.performance,
          lastExecution: status.lastExecution,
          availableFeatures: {
            aiPowered: !!process.env.OPENAI_API_KEY,
            whatsappIntegration: true, // Would be based on Twilio configuration
            knowledgeBase: true,
            sentimentAnalysis: true,
            autoEscalation: true,
            ticketManagement: true,
          },
        },
        message: 'Agent status retrieved successfully',
      };
    } catch (error) {
      logger.error(
        'Failed to get agent status',
        { error: error instanceof Error ? error.message : 'Unknown error' },
        'SupportRouter'
      );
      throw new Error(
        `Failed to get agent status: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }),
});
