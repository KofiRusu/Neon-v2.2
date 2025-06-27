import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { CustomerSupportAgent } from './support-agent';

// Mock OpenAI
jest.mock('openai', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn(),
        },
      },
    })),
  };
});

// Mock environment variables
const originalEnv = process.env;

describe('CustomerSupportAgent', () => {
  let agent: CustomerSupportAgent;
  let mockOpenAI: any;

  beforeEach(() => {
    // Reset environment
    process.env = { ...originalEnv };
    process.env.OPENAI_API_KEY = 'test-api-key';

    agent = new CustomerSupportAgent();

    // Get the mocked OpenAI instance
    const OpenAI = require('openai').default;
    mockOpenAI = new OpenAI();
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  describe('Agent initialization', () => {
    it('should initialize with correct properties', () => {
      expect(agent.id).toBe('customer-support-agent');
      expect(agent.name).toBe('CustomerSupportAgent');
      expect(agent.type).toBe('support');
      expect(agent.capabilities).toContain('classify_message');
      expect(agent.capabilities).toContain('generate_reply');
      expect(agent.capabilities).toContain('analyze_sentiment');
      expect(agent.capabilities).toContain('escalate_ticket');
    });

    it('should handle missing OpenAI API key gracefully', () => {
      delete process.env.OPENAI_API_KEY;
      const agentWithoutKey = new CustomerSupportAgent();
      expect(agentWithoutKey).toBeDefined();
    });
  });

  describe('Message classification', () => {
    it('should classify message using AI when API key is available', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                intent: 'complaint',
                category: 'Product Issue',
                subcategory: 'Defective Product',
                confidence: 0.92,
                urgency: 'high',
                requiresHuman: true,
                suggestedActions: ['escalate_to_specialist', 'offer_replacement'],
                keywords: ['broken', 'defective', 'not working'],
                entities: [{ type: 'product_id', value: 'NEON-001', confidence: 0.95 }],
              }),
            },
          },
        ],
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const input = {
        text: 'My neon sign NEON-001 is broken and not working at all. This is unacceptable!',
        customer: {
          id: 'customer_123',
          name: 'John Doe',
          email: 'john@example.com',
        },
        context: {
          channel: 'email',
          customerTier: 'premium',
        },
      };

      const result = await agent.classifyMessageAPI(input);

      expect(result.intent).toBe('complaint');
      expect(result.category).toBe('Product Issue');
      expect(result.confidence).toBe(0.92);
      expect(result.urgency).toBe('high');
      expect(result.requiresHuman).toBe(true);
      expect(result.keywords).toContain('broken');
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledTimes(1);
    });

    it('should use fallback when OpenAI fails', async () => {
      mockOpenAI.chat.completions.create.mockRejectedValue(new Error('API Error'));

      const input = {
        text: 'I need a refund for my order',
        customer: { name: 'Jane Smith' },
      };

      const result = await agent.classifyMessageAPI(input);

      expect(result.intent).toBe('refund');
      expect(result.urgency).toBe('high');
      expect(result.requiresHuman).toBe(true);
      expect(result.confidence).toBe(0.6);
    });

    it('should handle malformed AI response gracefully', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'Invalid JSON response from AI',
            },
          },
        ],
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const input: MessageClassificationInput = {
        text: 'How do I reset my password?',
      };

      const result = await agent.classifyMessageAPI(input);

      expect(result.intent).toBeDefined();
      expect(result.category).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should classify different types of messages correctly in fallback mode', async () => {
      mockOpenAI.chat.completions.create.mockRejectedValue(new Error('API Error'));

      const testCases = [
        { text: 'This is terrible service, I hate this!', expectedIntent: 'complaint' },
        { text: 'How do I use this feature?', expectedIntent: 'support' },
        { text: 'There is a bug in the application', expectedIntent: 'bug_report' },
        { text: 'Can you help me with my bill?', expectedIntent: 'billing' },
        { text: 'Hello there', expectedIntent: 'general' },
      ];

      for (const testCase of testCases) {
        const result = await agent.classifyMessageAPI({ text: testCase.text });
        expect(result.intent).toBe(testCase.expectedIntent);
      }
    });
  });

  describe('Reply generation', () => {
    it('should generate AI-powered reply', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                reply:
                  'Hi John, I understand your frustration with the defective neon sign. I sincerely apologize for this issue.',
                tone: 'empathetic',
                confidence: 0.95,
                suggestedFollowUps: ['Confirm shipping address'],
                escalationRecommended: false,
                estimatedResolutionTime: 24,
                requiredActions: [{ action: 'arrange_replacement', priority: 'high' }],
                relatedResources: [{ type: 'article', title: 'Product Replacement Policy' }],
              }),
            },
          },
        ],
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const input = {
        message: 'My neon sign is defective and not working',
        tone: 'empathetic',
        customer: { name: 'John' },
      };

      const result = await agent.generateReplyAPI(input);

      expect(result.reply).toContain('John');
      expect(result.tone).toBe('empathetic');
      expect(result.confidence).toBe(0.95);
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledTimes(1);
    });

    it('should use fallback reply when AI fails', async () => {
      mockOpenAI.chat.completions.create.mockRejectedValue(new Error('API Error'));

      const input: ReplyGenerationInput = {
        message: 'I need help',
        tone: 'professional',
        customer: { name: 'Alice' },
      };

      const result = await agent.generateReplyAPI(input);

      expect(result.reply).toContain('Alice');
      expect(result.reply).toContain('Thank you for reaching out');
      expect(result.tone).toBe('professional');
      expect(result.confidence).toBe(0.5);
    });

    it('should handle different tones appropriately', async () => {
      const tones = ['professional', 'friendly', 'empathetic', 'apologetic', 'informative'];

      for (const tone of tones) {
        const input: ReplyGenerationInput = {
          message: 'I have a question about my account',
          tone: tone as any,
        };

        const result = await agent.generateReplyAPI(input);
        expect(result.tone).toBe(tone);
      }
    });
  });

  describe('Sentiment analysis', () => {
    it('should analyze sentiment using AI', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                sentiment: 'negative',
                score: -0.8,
                confidence: 0.94,
                emotions: [{ emotion: 'frustrated', intensity: 0.9 }],
                urgencyIndicators: ['immediately'],
                escalationTriggers: ['terrible'],
                customerSatisfactionRisk: 'high',
              }),
            },
          },
        ],
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const input = {
        message: 'This is terrible service! I need this fixed immediately!',
      };

      const result = await agent.analyzeSentimentAPI(input);

      expect(result.sentiment).toBe('negative');
      expect(result.score).toBe(-0.8);
      expect(result.confidence).toBe(0.94);
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledTimes(1);
    });

    it('should use fallback sentiment analysis when AI fails', async () => {
      mockOpenAI.chat.completions.create.mockRejectedValue(new Error('API Error'));

      const testCases = [
        { text: 'This is amazing, I love it!', expectedSentiment: 'positive' },
        { text: 'This is terrible and I hate it!', expectedSentiment: 'negative' },
        { text: 'How do I change my settings?', expectedSentiment: 'neutral' },
      ];

      for (const testCase of testCases) {
        const result = await agent.analyzeSentimentAPI({ message: testCase.text });
        expect(result.sentiment).toBe(testCase.expectedSentiment);
      }
    });

    it('should detect urgency indicators correctly', async () => {
      mockOpenAI.chat.completions.create.mockRejectedValue(new Error('API Error'));

      const input: SentimentAnalysisInput = {
        message: "This is urgent! I need help immediately, it's an emergency!",
      };

      const result = await agent.analyzeSentimentAPI(input);

      expect(result.urgencyIndicators).toContain('urgent');
      expect(result.urgencyIndicators).toContain('immediately');
      expect(result.urgencyIndicators).toContain('emergency');
    });
  });

  describe('Escalation logic', () => {
    it('should recommend escalation for critical issues', async () => {
      const input = {
        message: 'This is a critical system failure!',
        classification: {
          intent: 'bug_report',
          category: 'Technical Issue',
          confidence: 0.95,
          urgency: 'critical',
          requiresHuman: true,
          suggestedActions: [],
          keywords: ['critical'],
          entities: [],
        },
        customerTier: 'enterprise',
      };

      const result = await agent.escalateAPI(input);

      expect(result.shouldEscalate).toBe(true);
      expect(result.escalationLevel).toBe('manager');
      expect(result.urgency).toBe('critical');
    });

    it('should not escalate simple inquiries', async () => {
      const input: EscalationInput = {
        message: 'How do I change my password?',
        classification: {
          intent: 'inquiry',
          category: 'Account Help',
          confidence: 0.9,
          urgency: 'low',
          requiresHuman: false,
          suggestedActions: [],
          keywords: ['password'],
          entities: [],
        },
        sentiment: {
          sentiment: 'neutral',
          score: 0.1,
          confidence: 0.8,
          emotions: [],
          urgencyIndicators: [],
          escalationTriggers: [],
          customerSatisfactionRisk: 'low',
        },
        customerTier: 'basic',
      };

      const result = await agent.escalateAPI(input);

      expect(result.shouldEscalate).toBe(false);
    });

    it('should escalate based on customer tier', async () => {
      const input: EscalationInput = {
        message: 'I have an issue with the service',
        classification: {
          intent: 'complaint',
          category: 'Service Issue',
          confidence: 0.8,
          urgency: 'high',
          requiresHuman: false,
          suggestedActions: [],
          keywords: [],
          entities: [],
        },
        customerTier: 'enterprise',
      };

      const result = await agent.escalateAPI(input);

      expect(result.shouldEscalate).toBe(true);
      expect(result.escalationLevel).toBe('specialist');
    });

    it('should escalate based on agent workload', async () => {
      const input: EscalationInput = {
        message: 'I need help with something',
        agentWorkload: 20, // Over the threshold of 15
      };

      const result = await agent.escalateAPI(input);

      expect(result.shouldEscalate).toBe(true);
    });
  });

  describe('Ticket management', () => {
    it('should create tickets successfully', async () => {
      const input = {
        subject: 'Unable to login',
        message: 'I cannot log into my account',
        channel: 'email',
        customer: { name: 'John Doe' },
      };

      const result = await agent.createTicket(input);

      expect(result.success).toBe(true);
      expect(result.ticket).toBeDefined();
      expect(result.ticket.subject).toBe('Unable to login');
    });

    it('should update tickets successfully', async () => {
      // First create a ticket
      const createInput = {
        subject: 'Test ticket',
        message: 'Test message',
        channel: 'chat',
        customer: { name: 'Test User' },
      };

      const createResult = await agent.createTicket(createInput);
      const ticketId = createResult.ticket.id;

      // Then update it
      const updateInput = {
        ticketId,
        update: {
          status: 'in_progress',
          assignedTo: 'agent_001',
          priority: 'high',
        },
      };

      const updateResult = await agent.updateTicket(updateInput);

      expect(updateResult.success).toBe(true);
      expect(updateResult.ticket.status).toBe('in_progress');
      expect(updateResult.ticket.assignedTo).toBe('agent_001');
      expect(updateResult.ticket.priority).toBe('high');
    });

    it('should handle updating non-existent tickets', async () => {
      const updateInput = {
        ticketId: 'non_existent_ticket',
        update: { status: 'closed' },
      };

      const result = await agent.updateTicket(updateInput);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Ticket not found');
    });
  });

  describe('WhatsApp integration', () => {
    it('should send WhatsApp messages', async () => {
      const input = {
        recipient: '+1234567890',
        message: {
          type: 'text' as const,
          content: 'Hello! How can we help you today?',
        },
        settings: {
          businessId: 'business_123',
          accessToken: 'token_456',
        },
      };

      const result = await agent.sendMessage(input);

      expect(result.success).toBe(true);
      expect(result.messageId).toMatch(/^whatsapp_/);
      expect(result.status).toBe('sent');
      expect(result.estimatedDelivery).toBeDefined();
    });
  });

  describe('Auto-response system', () => {
    it('should generate auto-responses with classification', async () => {
      const input = {
        message: 'I need help with my billing',
        customer: {
          name: 'Sarah Johnson',
          email: 'sarah@example.com',
        },
      };

      const result = await agent.autoRespond(input);

      expect(result.success).toBe(true);
      expect(result.response).toBeDefined();
      expect(result.classification).toBeDefined();
      expect(result.classification.intent).toBe('billing');
      expect(result.shouldEscalate).toBeDefined();
    });
  });

  describe('Knowledge base management', () => {
    it('should search knowledge base articles', async () => {
      const input = {
        action: 'search_articles',
        data: { query: 'password' },
      };

      const result = await agent.manageKnowledgeBase(input);

      expect(result.success).toBe(true);
      expect(result.articles).toBeDefined();
      expect(result.total).toBeGreaterThanOrEqual(0);
    });

    it('should add knowledge base articles', async () => {
      const input = {
        action: 'add_article',
        data: {
          title: 'How to Update Payment Method',
          content: 'To update your payment method...',
          category: 'Billing',
          tags: ['payment', 'billing'],
          author: 'Support Team',
        },
      };

      const result = await agent.manageKnowledgeBase(input);

      expect(result.success).toBe(true);
      expect(result.article).toBeDefined();
      expect(result.article.title).toBe('How to Update Payment Method');
      expect(result.article.id).toMatch(/^article_/);
    });

    it('should get suggested articles based on message', async () => {
      const input = {
        action: 'get_suggestions',
        data: { message: 'I forgot my password and cannot login' },
      };

      const result = await agent.manageKnowledgeBase(input);

      expect(result.success).toBe(true);
      expect(result.suggestions).toBeDefined();
      expect(result.total).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Ticket summary generation', () => {
    it('should generate ticket summaries', async () => {
      // Create a ticket first
      const createInput = {
        subject: 'Login Issue',
        message: 'Cannot access account',
        channel: 'email',
        category: 'Account Management',
      };

      const createResult = await agent.createTicket(createInput);
      const ticketId = createResult.ticket.id;

      // Generate summary
      const summaryResult = await agent.generateTicketSummary({ ticketId });

      expect(summaryResult.success).toBe(true);
      expect(summaryResult.summary).toBeDefined();
      expect(summaryResult.summary.ticketId).toBe(ticketId);
      expect(summaryResult.summary.status).toBe('open');
    });

    it('should handle non-existent tickets in summary generation', async () => {
      const result = await agent.generateTicketSummary({ ticketId: 'non_existent' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Ticket not found');
    });
  });

  describe('Agent execution workflow', () => {
    it('should handle classify_message task', async () => {
      const result = await agent.execute({
        task: 'classify_message',
        context: {
          text: 'I have a billing question',
        },
        priority: 'medium',
      });

      expect(result.success).toBe(true);
      expect(result.data.intent).toBeDefined();
    });

    it('should handle generate_reply task', async () => {
      const result = await agent.execute({
        task: 'generate_reply',
        context: {
          message: 'Can you help me?',
          tone: 'friendly',
          customer: { name: 'Alice' },
        },
        priority: 'medium',
      });

      expect(result.success).toBe(true);
      expect(result.data.reply).toBeDefined();
      expect(result.data.tone).toBe('friendly');
    });

    it('should handle analyze_sentiment task', async () => {
      const result = await agent.execute({
        task: 'analyze_sentiment',
        context: {
          message: 'I am very frustrated with this service!',
        },
        priority: 'medium',
      });

      expect(result.success).toBe(true);
      expect(result.data.sentiment).toBe('negative');
    });

    it('should handle escalate_ticket task', async () => {
      const result = await agent.execute({
        task: 'escalate_ticket',
        context: {
          message: 'This is urgent!',
          customerTier: 'enterprise',
        },
        priority: 'high',
      });

      expect(result.success).toBe(true);
      expect(result.data.shouldEscalate).toBeDefined();
    });

    it('should handle unknown tasks gracefully', async () => {
      const result = await agent.execute({
        task: 'unknown_task',
        context: {},
        priority: 'medium',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown task');
    });
  });

  describe('Performance tracking', () => {
    it('should track execution performance', async () => {
      const result = await agent.execute({
        task: 'classify_message',
        context: {
          text: 'Performance test message',
        },
        priority: 'medium',
      });

      expect(result.performance).toBeGreaterThan(0);
      expect(result.metadata?.executionTime).toBeGreaterThan(0);
      expect(result.metadata?.agentId).toBe('customer-support-agent');
    });

    it('should update agent status after execution', async () => {
      await agent.execute({
        task: 'classify_message',
        context: {
          text: 'Status test message',
        },
        priority: 'medium',
      });

      const status = await agent.getStatus();
      expect(status.lastExecution).toBeDefined();
      expect(status.performance).toBeGreaterThan(0);
      expect(status.status).toBe('idle');
    });
  });

  describe('Error handling', () => {
    it('should handle OpenAI timeout gracefully', async () => {
      mockOpenAI.chat.completions.create.mockImplementation(
        () =>
          new Promise((_, reject) => setTimeout(() => reject(new Error('Request timeout')), 100))
      );

      const input: MessageClassificationInput = {
        text: 'Timeout test message',
      };

      const result = await agent.classifyMessageAPI(input);
      expect(result.intent).toBeDefined();
      expect(result.category).toBeDefined();
    });

    it('should validate input parameters', async () => {
      // Test with empty message
      const result = await agent.classifyMessageAPI({ text: '' });
      expect(result.intent).toBeDefined();
    });
  });

  describe('Customer satisfaction tracking', () => {
    it('should track customer satisfaction metrics', async () => {
      const result = await agent.execute({
        task: 'track_satisfaction',
        context: {},
        priority: 'low',
      });

      expect(result.success).toBe(true);
      expect(result.data.satisfaction).toBeDefined();
      expect(result.data.satisfaction.score).toBeGreaterThan(0);
    });
  });

  describe('Queue management', () => {
    it('should manage ticket queue metrics', async () => {
      const result = await agent.execute({
        task: 'manage_queue',
        context: {},
        priority: 'low',
      });

      expect(result.success).toBe(true);
      expect(result.data.queue).toBeDefined();
      expect(result.data.queue.total).toBeGreaterThanOrEqual(0);
      expect(result.data.queue.avgWaitTime).toBeGreaterThan(0);
    });
  });
});
