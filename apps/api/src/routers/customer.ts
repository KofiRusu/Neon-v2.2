import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';

// Customer schemas
const CustomerProfile = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  avatar: z.string().optional(),
  engagementLevel: z.enum(['high', 'medium', 'low']),
  lastContact: z.date(),
  lifetimeValue: z.number(),
  preferredChannel: z.enum(['email', 'whatsapp', 'phone', 'chat', 'social']),
  aiPredictedAction: z.enum(['retarget', 'ignore', 'convert', 'nurture']),
  location: z.object({
    country: z.string(),
    region: z.string(),
  }),
  tags: z.array(z.string()),
  createdAt: z.date(),
});

const SentimentData = z.object({
  id: z.string(),
  customerId: z.string(),
  sentiment: z.enum(['positive', 'neutral', 'negative']),
  score: z.number().min(-1).max(1), // -1 to 1 scale
  source: z.enum(['email', 'chat', 'review', 'social', 'call']),
  content: z.string(),
  aiConfidence: z.number().min(0).max(1),
  detectedAt: z.date(),
  keywords: z.array(z.string()),
});

const SupportTicket = z.object({
  id: z.string(),
  customerId: z.string(),
  subject: z.string(),
  status: z.enum(['open', 'pending', 'resolved', 'closed']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  category: z.enum(['question', 'complaint', 'praise', 'refund', 'technical', 'billing']),
  sentimentScore: z.number().min(-1).max(1),
  escalationIndicator: z.boolean(),
  aiSuggestion: z.string(),
  content: z.string(),
  responses: z.array(
    z.object({
      id: z.string(),
      author: z.string(),
      content: z.string(),
      timestamp: z.date(),
      type: z.enum(['customer', 'agent', 'system']),
    })
  ),
  createdAt: z.date(),
  updatedAt: z.date(),
  resolvedAt: z.date().nullable(),
});

const FunnelStep = z.object({
  step: z.string(),
  visitors: z.number(),
  conversions: z.number(),
  conversionRate: z.number(),
  dropoffReasons: z.array(
    z.object({
      reason: z.string(),
      percentage: z.number(),
    })
  ),
});

const BehaviorFunnel = z.object({
  timeframe: z.string(),
  totalVisitors: z.number(),
  steps: z.array(FunnelStep),
  regionBreakdown: z.array(
    z.object({
      region: z.string(),
      visitors: z.number(),
      conversionRate: z.number(),
    })
  ),
});

// Mock data generators
function generateMockCustomers(): Array<z.infer<typeof CustomerProfile>> {
  const names = [
    'Sarah Johnson',
    'Michael Chen',
    'Emma Williams',
    'David Rodriguez',
    'Aisha Patel',
    'James Anderson',
    'Fatima Al-Zahra',
    'Lucas Silva',
    'Priya Sharma',
    'Ahmed Hassan',
    'Sofia Kowalski',
    'Rajesh Kumar',
    'Isabella Garcia',
    'Omar Benali',
    'Elena Popov',
    'Yuki Tanaka',
  ];

  const channels = ['email', 'whatsapp', 'phone', 'chat', 'social'] as const;
  const actions = ['retarget', 'ignore', 'convert', 'nurture'] as const;
  const engagements = ['high', 'medium', 'low'] as const;

  const countries = [
    { country: 'USA', region: 'North America' },
    { country: 'UAE', region: 'Middle East' },
    { country: 'UK', region: 'Europe' },
    { country: 'Germany', region: 'Europe' },
    { country: 'Singapore', region: 'APAC' },
    { country: 'Brazil', region: 'South America' },
    { country: 'India', region: 'APAC' },
    { country: 'Canada', region: 'North America' },
  ];

  const tags = [
    'vip',
    'new-customer',
    'at-risk',
    'loyal',
    'price-sensitive',
    'early-adopter',
    'high-spender',
    'referrer',
    'complaint-history',
  ];

  return names.map((name, index) => {
    const engagementLevel = engagements[Math.floor(Math.random() * engagements.length)];
    const ltv =
      engagementLevel === 'high'
        ? 5000 + Math.random() * 15000
        : engagementLevel === 'medium'
          ? 1000 + Math.random() * 4000
          : 200 + Math.random() * 800;

    return {
      id: `customer_${index + 1}`,
      name,
      email: `${name.toLowerCase().replace(' ', '.')}@example.com`,
      avatar: `https://api.dicebear.com/7.x/personas/svg?seed=${name}`,
      engagementLevel,
      lastContact: new Date(Date.now() - Math.random() * 86400000 * 30), // Last 30 days
      lifetimeValue: Math.round(ltv),
      preferredChannel: channels[Math.floor(Math.random() * channels.length)],
      aiPredictedAction: actions[Math.floor(Math.random() * actions.length)],
      location: countries[Math.floor(Math.random() * countries.length)],
      tags: tags.slice(0, 1 + Math.floor(Math.random() * 3)),
      createdAt: new Date(Date.now() - Math.random() * 86400000 * 365), // Last year
    };
  });
}

function generateMockSentimentData(): Array<z.infer<typeof SentimentData>> {
  const customers = generateMockCustomers();
  const sources = ['email', 'chat', 'review', 'social', 'call'] as const;
  const sentiments = ['positive', 'neutral', 'negative'] as const;

  const contents = {
    positive: [
      'Love the new features! Excellent customer service.',
      'Amazing product quality, exceeded expectations!',
      "Best purchase I've made this year, highly recommend.",
      'Outstanding support team, resolved my issue quickly.',
      'Fantastic user experience, very intuitive interface.',
    ],
    negative: [
      'Very disappointed with the delivery delay.',
      'Product quality is not as advertised.',
      'Customer service was unhelpful and rude.',
      'Too expensive for what you get.',
      'Interface is confusing and hard to navigate.',
    ],
    neutral: [
      'Product arrived as expected, nothing special.',
      'Standard service, meets basic requirements.',
      'Okay product, could be better.',
      'Average experience, neither good nor bad.',
      'Decent quality for the price point.',
    ],
  };

  const data: Array<z.infer<typeof SentimentData>> = [];

  // Generate last 30 days of sentiment data
  for (let i = 0; i < 150; i++) {
    const sentiment = sentiments[Math.floor(Math.random() * sentiments.length)];
    const customer = customers[Math.floor(Math.random() * customers.length)];
    const source = sources[Math.floor(Math.random() * sources.length)];

    const score =
      sentiment === 'positive'
        ? 0.3 + Math.random() * 0.7
        : sentiment === 'negative'
          ? -0.7 - Math.random() * 0.3
          : (Math.random() - 0.5) * 0.6; // -0.3 to 0.3 for neutral

    data.push({
      id: `sentiment_${i + 1}`,
      customerId: customer.id,
      sentiment,
      score,
      source,
      content: contents[sentiment][Math.floor(Math.random() * contents[sentiment].length)],
      aiConfidence: 0.7 + Math.random() * 0.3,
      detectedAt: new Date(Date.now() - Math.random() * 86400000 * 30),
      keywords:
        sentiment === 'positive'
          ? ['excellent', 'amazing', 'love']
          : sentiment === 'negative'
            ? ['disappointed', 'poor', 'terrible']
            : ['okay', 'standard', 'average'],
    });
  }

  return data.sort((a, b) => b.detectedAt.getTime() - a.detectedAt.getTime());
}

function generateMockTickets(): Array<z.infer<typeof SupportTicket>> {
  const customers = generateMockCustomers();
  const statuses = ['open', 'pending', 'resolved', 'closed'] as const;
  const priorities = ['low', 'medium', 'high', 'urgent'] as const;
  const categories = ['question', 'complaint', 'praise', 'refund', 'technical', 'billing'] as const;

  const ticketTemplates = {
    question: 'How do I access my premium features?',
    complaint: 'The product is not working as advertised',
    praise: 'Excellent service, thank you for the quick response!',
    refund: 'I would like to request a refund for my recent purchase',
    technical: "I'm experiencing login issues with my account",
    billing: "There's an incorrect charge on my billing statement",
  };

  return Array.from({ length: 25 }, (_, index) => {
    const customer = customers[Math.floor(Math.random() * customers.length)];
    const category = categories[Math.floor(Math.random() * categories.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const priority = priorities[Math.floor(Math.random() * priorities.length)];

    const sentimentScore =
      category === 'praise'
        ? 0.5 + Math.random() * 0.5
        : category === 'complaint'
          ? -0.8 - Math.random() * 0.2
          : (Math.random() - 0.5) * 0.6;

    const createdAt = new Date(Date.now() - Math.random() * 86400000 * 14); // Last 2 weeks
    const updatedAt = new Date(createdAt.getTime() + Math.random() * 86400000 * 3);

    return {
      id: `ticket_${index + 1}`,
      customerId: customer.id,
      subject: `${category.charAt(0).toUpperCase() + category.slice(1)}: ${ticketTemplates[category]}`,
      status,
      priority,
      category,
      sentimentScore,
      escalationIndicator: priority === 'urgent' || sentimentScore < -0.5,
      aiSuggestion:
        category === 'technical'
          ? 'Escalate to technical team'
          : category === 'refund'
            ? 'Review refund policy and process'
            : category === 'complaint'
              ? 'Offer compensation and follow up'
              : 'Provide standard support response',
      content: `Customer message: ${ticketTemplates[category]}\n\nAdditional details would be shown here...`,
      responses: [
        {
          id: `response_${index}_1`,
          author: customer.name,
          content: ticketTemplates[category],
          timestamp: createdAt,
          type: 'customer' as const,
        },
        ...(status !== 'open'
          ? [
              {
                id: `response_${index}_2`,
                author: 'Support Agent',
                content:
                  'Thank you for contacting us. We are looking into this issue and will get back to you shortly.',
                timestamp: updatedAt,
                type: 'agent' as const,
              },
            ]
          : []),
      ],
      createdAt,
      updatedAt,
      resolvedAt: status === 'resolved' || status === 'closed' ? updatedAt : null,
    };
  });
}

function generateMockFunnelData(): z.infer<typeof BehaviorFunnel> {
  const totalVisitors = 10000 + Math.floor(Math.random() * 5000);

  const steps = [
    {
      step: 'Visit',
      visitors: totalVisitors,
      conversions: totalVisitors,
      conversionRate: 100,
      dropoffReasons: [],
    },
    {
      step: 'View Product',
      visitors: Math.floor(totalVisitors * 0.65),
      conversions: Math.floor(totalVisitors * 0.65),
      conversionRate: 65,
      dropoffReasons: [
        { reason: 'Page load too slow', percentage: 45 },
        { reason: 'Not interested in products', percentage: 35 },
        { reason: 'Navigation issues', percentage: 20 },
      ],
    },
    {
      step: 'Add to Cart',
      visitors: Math.floor(totalVisitors * 0.25),
      conversions: Math.floor(totalVisitors * 0.25),
      conversionRate: 25,
      dropoffReasons: [
        { reason: 'Price too high', percentage: 40 },
        { reason: 'Shipping costs', percentage: 25 },
        { reason: 'Complex checkout', percentage: 20 },
        { reason: 'Security concerns', percentage: 15 },
      ],
    },
    {
      step: 'Purchase',
      visitors: Math.floor(totalVisitors * 0.08),
      conversions: Math.floor(totalVisitors * 0.08),
      conversionRate: 8,
      dropoffReasons: [
        { reason: 'Payment failed', percentage: 35 },
        { reason: 'Changed mind', percentage: 30 },
        { reason: 'Form errors', percentage: 20 },
        { reason: 'Abandoned cart', percentage: 15 },
      ],
    },
  ];

  const regions = [
    { region: 'North America', visitors: Math.floor(totalVisitors * 0.4), conversionRate: 9.2 },
    { region: 'Europe', visitors: Math.floor(totalVisitors * 0.3), conversionRate: 7.8 },
    { region: 'APAC', visitors: Math.floor(totalVisitors * 0.2), conversionRate: 6.5 },
    { region: 'Middle East', visitors: Math.floor(totalVisitors * 0.1), conversionRate: 8.9 },
  ];

  return {
    timeframe: '7d',
    totalVisitors,
    steps,
    regionBreakdown: regions,
  };
}

export const customerRouter = createTRPCRouter({
  // Get all customers with filtering
  getAllCustomers: publicProcedure
    .input(
      z.object({
        engagementLevel: z.enum(['high', 'medium', 'low', 'all']).optional().default('all'),
        aiAction: z
          .enum(['retarget', 'ignore', 'convert', 'nurture', 'all'])
          .optional()
          .default('all'),
        region: z.string().optional(),
        limit: z.number().optional().default(20),
        sortBy: z.enum(['ltv', 'engagement', 'lastContact', 'name']).optional().default('ltv'),
      })
    )
    .query(async ({ input }) => {
      try {
        let customers = generateMockCustomers();

        // Apply filters
        if (input.engagementLevel !== 'all') {
          customers = customers.filter(c => c.engagementLevel === input.engagementLevel);
        }

        if (input.aiAction !== 'all') {
          customers = customers.filter(c => c.aiPredictedAction === input.aiAction);
        }

        if (input.region) {
          customers = customers.filter(c => c.location.region === input.region);
        }

        // Sort customers
        customers.sort((a, b) => {
          switch (input.sortBy) {
            case 'ltv':
              return b.lifetimeValue - a.lifetimeValue;
            case 'engagement':
              const engagementOrder = { high: 3, medium: 2, low: 1 };
              return engagementOrder[b.engagementLevel] - engagementOrder[a.engagementLevel];
            case 'lastContact':
              return b.lastContact.getTime() - a.lastContact.getTime();
            case 'name':
              return a.name.localeCompare(b.name);
            default:
              return b.lifetimeValue - a.lifetimeValue;
          }
        });

        return {
          success: true,
          data: customers.slice(0, input.limit),
          total: customers.length,
          filters: input,
        };
      } catch (error) {
        throw new Error(
          `Failed to fetch customers: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }),

  // Get customer sentiment statistics
  getCustomerSentimentStats: publicProcedure
    .input(
      z.object({
        timeframe: z.enum(['7d', '30d', '90d']).optional().default('30d'),
      })
    )
    .query(async ({ input }) => {
      try {
        const sentimentData = generateMockSentimentData();
        const now = new Date();
        const timeframeMs =
          input.timeframe === '7d'
            ? 7 * 24 * 60 * 60 * 1000
            : input.timeframe === '30d'
              ? 30 * 24 * 60 * 60 * 1000
              : 90 * 24 * 60 * 60 * 1000;

        const filteredData = sentimentData.filter(
          item => now.getTime() - item.detectedAt.getTime() <= timeframeMs
        );

        const positive = filteredData.filter(item => item.sentiment === 'positive').length;
        const neutral = filteredData.filter(item => item.sentiment === 'neutral').length;
        const negative = filteredData.filter(item => item.sentiment === 'negative').length;
        const total = filteredData.length;

        // Generate daily sentiment data for chart
        const days = input.timeframe === '7d' ? 7 : input.timeframe === '30d' ? 30 : 90;
        const dailyData = Array.from({ length: days }, (_, i) => {
          const date = new Date(now.getTime() - (days - 1 - i) * 24 * 60 * 60 * 1000);
          const dayData = filteredData.filter(item => {
            const itemDate = new Date(item.detectedAt);
            return itemDate.toDateString() === date.toDateString();
          });

          const dayPositive = dayData.filter(item => item.sentiment === 'positive').length;
          const dayNeutral = dayData.filter(item => item.sentiment === 'neutral').length;
          const dayNegative = dayData.filter(item => item.sentiment === 'negative').length;
          const dayTotal = dayData.length;

          return {
            date: date.toISOString().split('T')[0],
            positive: dayTotal > 0 ? Math.round((dayPositive / dayTotal) * 100) : 0,
            neutral: dayTotal > 0 ? Math.round((dayNeutral / dayTotal) * 100) : 0,
            negative: dayTotal > 0 ? Math.round((dayNegative / dayTotal) * 100) : 0,
            total: dayTotal,
          };
        });

        return {
          success: true,
          data: {
            summary: {
              positive: total > 0 ? Math.round((positive / total) * 100) : 0,
              neutral: total > 0 ? Math.round((neutral / total) * 100) : 0,
              negative: total > 0 ? Math.round((negative / total) * 100) : 0,
              total,
              averageScore:
                total > 0 ? filteredData.reduce((sum, item) => sum + item.score, 0) / total : 0,
            },
            dailyData,
            topKeywords: {
              positive: ['excellent', 'amazing', 'love', 'outstanding', 'fantastic'],
              negative: ['disappointed', 'poor', 'terrible', 'awful', 'horrible'],
            },
          },
          timeframe: input.timeframe,
        };
      } catch (error) {
        throw new Error(
          `Failed to fetch sentiment stats: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }),

  // Get sentiment by customer
  getSentimentByCustomer: publicProcedure
    .input(z.object({ customerId: z.string() }))
    .query(async ({ input }) => {
      try {
        const sentimentData = generateMockSentimentData();
        const customerSentiment = sentimentData.filter(
          item => item.customerId === input.customerId
        );

        return {
          success: true,
          data: customerSentiment,
          summary: {
            total: customerSentiment.length,
            averageScore:
              customerSentiment.length > 0
                ? customerSentiment.reduce((sum, item) => sum + item.score, 0) /
                  customerSentiment.length
                : 0,
            latestSentiment:
              customerSentiment.length > 0 ? customerSentiment[0].sentiment : 'neutral',
          },
        };
      } catch (error) {
        throw new Error(
          `Failed to fetch customer sentiment: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }),

  // Get customer tickets
  getCustomerTickets: publicProcedure
    .input(
      z.object({
        status: z.enum(['open', 'pending', 'resolved', 'closed', 'all']).optional().default('all'),
        priority: z.enum(['low', 'medium', 'high', 'urgent', 'all']).optional().default('all'),
        category: z
          .enum(['question', 'complaint', 'praise', 'refund', 'technical', 'billing', 'all'])
          .optional()
          .default('all'),
        customerId: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        let tickets = generateMockTickets();

        // Apply filters
        if (input.status !== 'all') {
          tickets = tickets.filter(ticket => ticket.status === input.status);
        }

        if (input.priority !== 'all') {
          tickets = tickets.filter(ticket => ticket.priority === input.priority);
        }

        if (input.category !== 'all') {
          tickets = tickets.filter(ticket => ticket.category === input.category);
        }

        if (input.customerId) {
          tickets = tickets.filter(ticket => ticket.customerId === input.customerId);
        }

        // Sort by created date (newest first)
        tickets.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        return {
          success: true,
          data: tickets,
          summary: {
            total: tickets.length,
            escalated: tickets.filter(t => t.escalationIndicator).length,
            averageSentiment:
              tickets.length > 0
                ? tickets.reduce((sum, t) => sum + t.sentimentScore, 0) / tickets.length
                : 0,
          },
        };
      } catch (error) {
        throw new Error(
          `Failed to fetch tickets: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }),

  // Classify ticket with AI
  classifyTicket: publicProcedure
    .input(z.object({ ticketId: z.string() }))
    .query(async ({ input }) => {
      try {
        const tickets = generateMockTickets();
        const ticket = tickets.find(t => t.id === input.ticketId);

        if (!ticket) {
          throw new Error(`Ticket ${input.ticketId} not found`);
        }

        // Simulate AI classification
        const classification = {
          category: ticket.category,
          sentiment:
            ticket.sentimentScore > 0.2
              ? 'positive'
              : ticket.sentimentScore < -0.2
                ? 'negative'
                : 'neutral',
          urgency: ticket.priority,
          suggestedResponse: ticket.aiSuggestion,
          confidence: 0.85 + Math.random() * 0.15,
          tags: ['ai-classified', ticket.category, ticket.priority],
        };

        return {
          success: true,
          data: classification,
          ticket,
        };
      } catch (error) {
        throw new Error(
          `Failed to classify ticket: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }),

  // Get customer support profile
  getCustomerSupportProfile: publicProcedure
    .input(z.object({ customerId: z.string() }))
    .query(async ({ input }) => {
      try {
        const customers = generateMockCustomers();
        const tickets = generateMockTickets();
        const sentimentData = generateMockSentimentData();

        const customer = customers.find(c => c.id === input.customerId);
        if (!customer) {
          throw new Error(`Customer ${input.customerId} not found`);
        }

        const customerTickets = tickets.filter(t => t.customerId === input.customerId);
        const customerSentiment = sentimentData.filter(s => s.customerId === input.customerId);

        const profile = {
          customer,
          supportHistory: {
            totalTickets: customerTickets.length,
            openTickets: customerTickets.filter(t => t.status === 'open' || t.status === 'pending')
              .length,
            averageResolutionTime: '2.5 days',
            satisfactionScore: 4.2,
          },
          sentimentProfile: {
            overall:
              customerSentiment.length > 0
                ? customerSentiment.reduce((sum, s) => sum + s.score, 0) / customerSentiment.length
                : 0,
            trend: 'improving',
            riskLevel:
              customer.engagementLevel === 'low'
                ? 'high'
                : customer.engagementLevel === 'medium'
                  ? 'medium'
                  : 'low',
          },
          recommendations: [
            customer.engagementLevel === 'low'
              ? 'Schedule proactive outreach'
              : 'Continue current engagement',
            customerTickets.filter(t => t.category === 'complaint').length > 2
              ? 'Review complaint history'
              : 'Standard support',
            'Monitor sentiment trends',
          ],
        };

        return {
          success: true,
          data: profile,
        };
      } catch (error) {
        throw new Error(
          `Failed to fetch customer support profile: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }),

  // Get funnel statistics
  getFunnelStats: publicProcedure
    .input(
      z.object({
        timeframe: z.enum(['7d', '30d', '90d']).optional().default('7d'),
        region: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const funnelData = generateMockFunnelData();

        // Adjust data based on timeframe
        const multiplier = input.timeframe === '7d' ? 1 : input.timeframe === '30d' ? 4.3 : 13; // 90d

        const adjustedFunnel = {
          ...funnelData,
          timeframe: input.timeframe,
          totalVisitors: Math.floor(funnelData.totalVisitors * multiplier),
          steps: funnelData.steps.map(step => ({
            ...step,
            visitors: Math.floor(step.visitors * multiplier),
            conversions: Math.floor(step.conversions * multiplier),
          })),
          regionBreakdown: funnelData.regionBreakdown.map(region => ({
            ...region,
            visitors: Math.floor(region.visitors * multiplier),
          })),
        };

        return {
          success: true,
          data: adjustedFunnel,
        };
      } catch (error) {
        throw new Error(
          `Failed to fetch funnel stats: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }),

  // Get funnel dropoff reasons
  getFunnelDropoffReasons: publicProcedure
    .input(
      z.object({
        step: z.string(),
        timeframe: z.enum(['7d', '30d', '90d']).optional().default('7d'),
      })
    )
    .query(async ({ input }) => {
      try {
        const funnelData = generateMockFunnelData();
        const step = funnelData.steps.find(s => s.step === input.step);

        if (!step) {
          throw new Error(`Funnel step ${input.step} not found`);
        }

        return {
          success: true,
          data: {
            step: step.step,
            dropoffReasons: step.dropoffReasons,
            conversionRate: step.conversionRate,
            timeframe: input.timeframe,
          },
        };
      } catch (error) {
        throw new Error(
          `Failed to fetch dropoff reasons: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }),

  // Get customer analytics summary
  getCustomerAnalytics: publicProcedure
    .input(
      z.object({
        timeframe: z.enum(['7d', '30d', '90d']).optional().default('30d'),
      })
    )
    .query(async ({ input }) => {
      try {
        const customers = generateMockCustomers();
        const tickets = generateMockTickets();
        const sentimentData = generateMockSentimentData();
        const funnelData = generateMockFunnelData();

        const analytics = {
          customers: {
            total: customers.length,
            highEngagement: customers.filter(c => c.engagementLevel === 'high').length,
            atRisk: customers.filter(c => c.aiPredictedAction === 'retarget').length,
            avgLifetimeValue: Math.round(
              customers.reduce((sum, c) => sum + c.lifetimeValue, 0) / customers.length
            ),
          },
          support: {
            totalTickets: tickets.length,
            openTickets: tickets.filter(t => t.status === 'open' || t.status === 'pending').length,
            escalatedTickets: tickets.filter(t => t.escalationIndicator).length,
            avgSentimentScore:
              tickets.reduce((sum, t) => sum + t.sentimentScore, 0) / tickets.length,
          },
          sentiment: {
            overall: sentimentData.reduce((sum, s) => sum + s.score, 0) / sentimentData.length,
            positive: Math.round(
              (sentimentData.filter(s => s.sentiment === 'positive').length /
                sentimentData.length) *
                100
            ),
            negative: Math.round(
              (sentimentData.filter(s => s.sentiment === 'negative').length /
                sentimentData.length) *
                100
            ),
            trend: 'stable',
          },
          funnel: {
            conversionRate: funnelData.steps[funnelData.steps.length - 1].conversionRate,
            totalVisitors: funnelData.totalVisitors,
            dropoffRate: 100 - funnelData.steps[funnelData.steps.length - 1].conversionRate,
          },
          timeframe: input.timeframe,
        };

        return {
          success: true,
          data: analytics,
        };
      } catch (error) {
        throw new Error(
          `Failed to fetch customer analytics: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }),
});

export type CustomerRouter = typeof customerRouter;
