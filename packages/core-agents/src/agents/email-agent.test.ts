import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import {
  EmailMarketingAgent,
  type EmailSequenceInput,
  type PersonalizationInput,
  type EmailPerformanceData,
  type ABTestInput,
} from './email-agent';

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

describe('EmailMarketingAgent', () => {
  let agent: EmailMarketingAgent;
  let mockOpenAI: any;

  beforeEach(() => {
    // Reset environment
    process.env = { ...originalEnv };
    process.env.OPENAI_API_KEY = 'test-api-key';

    agent = new EmailMarketingAgent();

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
      expect(agent.id).toBe('email-marketing-agent');
      expect(agent.name).toBe('EmailMarketingAgent');
      expect(agent.type).toBe('email');
      expect(agent.capabilities).toContain('generate_email_sequence');
      expect(agent.capabilities).toContain('personalize_email');
      expect(agent.capabilities).toContain('analyze_performance');
      expect(agent.capabilities).toContain('create_ab_test');
    });

    it('should handle missing OpenAI API key gracefully', () => {
      delete process.env.OPENAI_API_KEY;
      const agentWithoutKey = new EmailMarketingAgent();
      expect(agentWithoutKey).toBeDefined();
    });
  });

  describe('Email sequence generation', () => {
    it('should generate email sequence using AI when API key is available', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                name: 'Welcome Email Sequence',
                description: 'Onboard new customers effectively',
                emails: [
                  {
                    step: 1,
                    subject: 'Welcome to Our Platform!',
                    content: 'Hi there! Welcome to our amazing platform...',
                    delayDays: 0,
                    purpose: 'Welcome and introduce platform',
                    keyPoints: ['Platform introduction', 'Key features'],
                  },
                  {
                    step: 2,
                    subject: 'Get Started with These Tips',
                    content: "Now that you're here, let's get you started...",
                    delayDays: 3,
                    purpose: 'Education and onboarding',
                    keyPoints: ['Getting started tips', 'Best practices'],
                  },
                ],
                recommendations: ['Test different subject lines', 'Personalize content'],
              }),
            },
          },
        ],
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const input: EmailSequenceInput = {
        topic: 'Customer Onboarding',
        audience: 'New customers',
        businessType: 'SaaS',
        sequenceLength: 2,
        tone: 'friendly',
        goals: ['onboarding', 'engagement'],
        industry: 'technology',
      };

      const result = await agent.generateSequence(input);

      expect(result.name).toBe('Welcome Email Sequence');
      expect(result.emails).toHaveLength(2);
      expect(result.emails[0].subject).toBe('Welcome to Our Platform!');
      expect(result.estimatedPerformance.openRate).toBeDefined();
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledTimes(1);
    });

    it('should use fallback when OpenAI fails', async () => {
      mockOpenAI.chat.completions.create.mockRejectedValue(new Error('API Error'));

      const input: EmailSequenceInput = {
        topic: 'Product Launch',
        audience: 'Existing customers',
        sequenceLength: 3,
      };

      const result = await agent.generateSequence(input);

      expect(result.sequenceId).toBeDefined();
      expect(result.name).toContain('Product Launch');
      expect(result.emails).toHaveLength(3);
      expect(result.recommendations).toContain('Test different subject lines');
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

      const input: EmailSequenceInput = {
        topic: 'Newsletter Campaign',
        audience: 'Subscribers',
      };

      const result = await agent.generateSequence(input);

      expect(result.sequenceId).toBeDefined();
      expect(result.name).toBeDefined();
      expect(result.emails).toBeDefined();
    });
  });

  describe('Email personalization', () => {
    it('should personalize email using AI', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                personalizedSubject: 'Hi John! Your exclusive tech industry update',
                personalizedContent:
                  'Hi John,\n\nAs a tech industry professional, you might be interested in our latest features specifically designed for companies like TechCorp...',
                personalizationScore: 92,
                appliedPersonalizations: [
                  {
                    type: 'Name-based',
                    field: 'greeting',
                    originalValue: 'Hi there',
                    personalizedValue: 'Hi John',
                  },
                  {
                    type: 'Industry-based',
                    field: 'content',
                    originalValue: 'general features',
                    personalizedValue: 'tech industry features',
                  },
                ],
                recommendations: [
                  'Add location-based content',
                  'Include recent activity references',
                ],
              }),
            },
          },
        ],
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const input: PersonalizationInput = {
        baseEmail: 'Hi there,\n\nHere are some updates you might find interesting...',
        userTraits: {
          firstName: 'John',
          company: 'TechCorp',
          industry: 'technology',
          role: 'CTO',
        },
        segmentData: {
          segment: 'tech_leaders',
          characteristics: ['decision_maker', 'early_adopter'],
          preferences: ['technical_content', 'case_studies'],
        },
        businessContext: 'B2B SaaS platform',
      };

      const result = await agent.personalize(input);

      expect(result.personalizedSubject).toBe('Hi John! Your exclusive tech industry update');
      expect(result.personalizedContent).toContain('John');
      expect(result.personalizedContent).toContain('TechCorp');
      expect(result.personalizationScore).toBe(92);
      expect(result.appliedPersonalizations).toHaveLength(2);
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledTimes(1);
    });

    it('should use fallback personalization when AI fails', async () => {
      mockOpenAI.chat.completions.create.mockRejectedValue(new Error('API Error'));

      const input: PersonalizationInput = {
        baseEmail: 'Hi there,\n\nWelcome to our platform!',
        userTraits: {
          firstName: 'Jane',
          company: 'StartupCorp',
        },
      };

      const result = await agent.personalize(input);

      expect(result.personalizedSubject).toContain('Jane');
      expect(result.personalizedContent).toContain('Jane');
      expect(result.personalizationScore).toBeGreaterThan(0);
      expect(result.appliedPersonalizations).toHaveLength(1);
    });
  });

  describe('Performance analysis', () => {
    it('should analyze email performance with AI insights', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                insights: [
                  'Open rate is 28% above industry average',
                  'Mobile opens account for 72% of total opens',
                  'Tuesday sends show highest engagement',
                  'Subject lines with personalization perform 15% better',
                ],
                recommendations: [
                  'Continue mobile-first email design',
                  'Schedule more campaigns for Tuesday mornings',
                  'Increase personalization across all campaigns',
                  'Test emoji usage in subject lines',
                ],
              }),
            },
          },
        ],
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const performanceData: EmailPerformanceData = {
        campaignId: 'campaign_123',
        sent: 10000,
        delivered: 9850,
        opens: 2955,
        clicks: 590,
        conversions: 118,
        unsubscribes: 15,
        bounces: 150,
        timeRange: '30d',
      };

      const result = await agent.analyzePerformance(performanceData);

      expect(result.score).toBeGreaterThan(0);
      expect(result.metrics.openRate).toBeCloseTo(30, 1);
      expect(result.metrics.clickRate).toBeCloseTo(20, 1);
      expect(result.insights).toContain('Open rate is 28% above industry average');
      expect(result.recommendations).toContain('Continue mobile-first email design');
      expect(result.benchmarks.industry).toBe('General');
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledTimes(1);
    });

    it('should calculate metrics correctly', async () => {
      const performanceData: EmailPerformanceData = {
        campaignId: 'test_campaign',
        sent: 1000,
        delivered: 980,
        opens: 196,
        clicks: 39,
        conversions: 8,
        timeRange: '7d',
      };

      const result = await agent.analyzePerformance(performanceData);

      expect(result.metrics.deliveryRate).toBeCloseTo(98, 1);
      expect(result.metrics.openRate).toBeCloseTo(20, 1);
      expect(result.metrics.clickRate).toBeCloseTo(19.9, 1);
      expect(result.metrics.conversionRate).toBeCloseTo(20.5, 1);
    });

    it('should provide optimization suggestions based on metrics', async () => {
      const performanceData: EmailPerformanceData = {
        campaignId: 'low_performance',
        sent: 1000,
        delivered: 900, // Low delivery rate
        opens: 144, // 16% open rate - below average
        clicks: 14, // Low click rate
        conversions: 1,
        timeRange: '7d',
      };

      const result = await agent.analyzePerformance(performanceData);

      expect(result.optimizationSuggestions.length).toBeGreaterThan(0);
      expect(result.optimizationSuggestions.some(s => s.category === 'Subject Lines')).toBe(true);
      expect(result.optimizationSuggestions.some(s => s.category === 'Content')).toBe(true);
      expect(result.optimizationSuggestions.some(s => s.category === 'Deliverability')).toBe(true);
    });
  });

  describe('A/B testing', () => {
    it('should create and analyze A/B tests', async () => {
      const input: ABTestInput = {
        name: 'Subject Line Test',
        variants: [
          {
            name: 'Variant A - Direct',
            subject: 'Your order is ready',
            content: 'Your order #1234 is ready for pickup.',
          },
          {
            name: 'Variant B - Personalized',
            subject: 'John, your order is ready!',
            content: 'Hi John, your order #1234 is ready for pickup.',
          },
        ],
        testMetric: 'open_rate',
        sampleSize: 1000,
        duration: 24,
        audience: [],
      };

      const result = await agent.runABTest(input);

      expect(result.testId).toBeDefined();
      expect(result.status).toBe('running');
      expect(result.variants).toHaveLength(2);
      expect(result.variants[0].id).toBe('variant_A');
      expect(result.variants[1].id).toBe('variant_B');
      expect(result.winner).toBeDefined();
      expect(result.insights.length).toBeGreaterThan(0);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should throw error for insufficient variants', async () => {
      const input: ABTestInput = {
        name: 'Invalid Test',
        variants: [{ name: 'Only One Variant' }],
        testMetric: 'click_rate',
        sampleSize: 500,
        duration: 12,
        audience: [],
      };

      await expect(agent.runABTest(input)).rejects.toThrow('A/B test requires at least 2 variants');
    });

    it('should calculate performance metrics for each variant', async () => {
      const input: ABTestInput = {
        name: 'Performance Test',
        variants: [{ name: 'Control' }, { name: 'Treatment' }],
        testMetric: 'conversion_rate',
        sampleSize: 2000,
        duration: 48,
        audience: [],
      };

      const result = await agent.runABTest(input);

      result.variants.forEach(variant => {
        expect(variant.performance.sent).toBeGreaterThan(0);
        expect(variant.performance.opens).toBeLessThanOrEqual(variant.performance.sent);
        expect(variant.performance.clicks).toBeLessThanOrEqual(variant.performance.opens);
        expect(variant.performance.conversions).toBeLessThanOrEqual(variant.performance.clicks);
        expect(variant.performance.openRate).toBeGreaterThan(0);
        expect(variant.confidence).toBeGreaterThanOrEqual(50);
        expect(variant.confidence).toBeLessThanOrEqual(95);
      });
    });

    it('should identify winner correctly', async () => {
      const input: ABTestInput = {
        name: 'Winner Test',
        variants: [{ name: 'A' }, { name: 'B' }, { name: 'C' }],
        testMetric: 'click_rate',
        sampleSize: 1500,
        duration: 24,
        audience: [],
      };

      const result = await agent.runABTest(input);

      const winner = result.variants.find(v => v.isWinner);
      expect(winner).toBeDefined();
      expect(result.winner).toBe(winner?.id);

      // Winner should have highest performance for the test metric
      const winnerMetric = winner?.performance.clickRate || 0;
      result.variants.forEach(variant => {
        if (variant.id !== winner?.id) {
          expect(winnerMetric).toBeGreaterThanOrEqual(variant.performance.clickRate);
        }
      });
    });
  });

  describe('Agent execution workflow', () => {
    it('should handle generate_email_sequence task', async () => {
      const result = await agent.execute({
        task: 'generate_email_sequence',
        context: {
          topic: 'Product Demo',
          audience: 'Prospects',
          sequenceLength: 2,
        },
        priority: 'medium',
      });

      expect(result.success).toBe(true);
      expect(result.data.sequenceId).toBeDefined();
      expect(result.data.emails).toBeDefined();
    });

    it('should handle personalize_email task', async () => {
      const result = await agent.execute({
        task: 'personalize_email',
        context: {
          baseEmail: 'Hello! Check out our new features.',
          userTraits: { firstName: 'Alice', company: 'TechStart' },
        },
        priority: 'medium',
      });

      expect(result.success).toBe(true);
      expect(result.data.personalizedSubject).toBeDefined();
      expect(result.data.personalizedContent).toBeDefined();
    });

    it('should handle analyze_performance task', async () => {
      const result = await agent.execute({
        task: 'analyze_performance',
        context: {
          campaignId: 'test_123',
          sent: 1000,
          delivered: 980,
          opens: 200,
          clicks: 40,
          timeRange: '7d',
        },
        priority: 'medium',
      });

      expect(result.success).toBe(true);
      expect(result.data.score).toBeDefined();
      expect(result.data.metrics).toBeDefined();
      expect(result.data.insights).toBeDefined();
    });

    it('should handle create_ab_test task', async () => {
      const result = await agent.execute({
        task: 'create_ab_test',
        context: {
          name: 'Test Campaign',
          variants: [{ name: 'A' }, { name: 'B' }],
          testMetric: 'open_rate',
          sampleSize: 500,
          duration: 24,
          audience: [],
        },
        priority: 'medium',
      });

      expect(result.success).toBe(true);
      expect(result.data.testId).toBeDefined();
      expect(result.data.variants).toHaveLength(2);
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

  describe('Performance scoring', () => {
    it('should calculate accurate performance scores', async () => {
      // High performance metrics
      const highPerformData: EmailPerformanceData = {
        campaignId: 'high_perf',
        sent: 1000,
        delivered: 990, // 99% delivery
        opens: 350, // 35.4% open rate
        clicks: 70, // 20% CTR
        conversions: 14, // 20% conversion rate
        timeRange: '7d',
      };

      const highResult = await agent.analyzePerformance(highPerformData);
      expect(highResult.score).toBeGreaterThan(80);

      // Low performance metrics
      const lowPerformData: EmailPerformanceData = {
        campaignId: 'low_perf',
        sent: 1000,
        delivered: 850, // 85% delivery
        opens: 85, // 10% open rate
        clicks: 4, // 4.7% CTR
        conversions: 0, // 0% conversion rate
        timeRange: '7d',
      };

      const lowResult = await agent.analyzePerformance(lowPerformData);
      expect(lowResult.score).toBeLessThan(50);
    });

    it('should compare against industry benchmarks', async () => {
      const data: EmailPerformanceData = {
        campaignId: 'benchmark_test',
        sent: 1000,
        delivered: 980,
        opens: 250, // 25.5% open rate (above 21.3% benchmark)
        clicks: 30, // 12% CTR (above 2.6% benchmark)
        conversions: 6,
        timeRange: '30d',
      };

      const result = await agent.analyzePerformance(data);
      expect(result.benchmarks.performance).toBe('above');
      expect(result.benchmarks.openRateBenchmark).toBe(21.3);
      expect(result.benchmarks.clickRateBenchmark).toBe(2.6);
    });
  });

  describe('Error handling', () => {
    it('should handle OpenAI timeout gracefully', async () => {
      mockOpenAI.chat.completions.create.mockImplementation(
        () =>
          new Promise((_, reject) => setTimeout(() => reject(new Error('Request timeout')), 100))
      );

      const input: EmailSequenceInput = {
        topic: 'Timeout Test',
        audience: 'Test users',
      };

      const result = await agent.generateSequence(input);
      expect(result.sequenceId).toBeDefined();
      expect(result.name).toContain('Timeout Test');
    });

    it('should validate input parameters', async () => {
      // Missing required fields
      const invalidInput = {} as EmailSequenceInput;

      const result = await agent.generateSequence(invalidInput);
      expect(result.sequenceId).toBeDefined(); // Should still return fallback
    });
  });

  describe('Template management', () => {
    it('should initialize with default templates', () => {
      const status = agent.getStatus();
      expect(status).toBeDefined();
    });

    it('should handle additional campaign features', async () => {
      const sendResult = await agent.execute({
        task: 'send_campaign',
        context: { campaignData: 'test' },
        priority: 'high',
      });

      expect(sendResult.success).toBe(true);

      const templateResult = await agent.execute({
        task: 'manage_templates',
        context: { action: 'list' },
        priority: 'low',
      });

      expect(templateResult.success).toBe(true);
    });
  });

  describe('Performance tracking', () => {
    it('should track execution performance', async () => {
      const result = await agent.execute({
        task: 'generate_email_sequence',
        context: {
          topic: 'Performance Test',
          audience: 'Test users',
        },
        priority: 'medium',
      });

      expect(result.performance).toBeGreaterThan(0);
      expect(result.metadata?.executionTime).toBeGreaterThan(0);
      expect(result.metadata?.agentId).toBe('email-marketing-agent');
    });

    it('should update agent status after execution', async () => {
      await agent.execute({
        task: 'generate_email_sequence',
        context: {
          topic: 'Status Test',
          audience: 'Test users',
        },
        priority: 'medium',
      });

      const status = await agent.getStatus();
      expect(status.lastExecution).toBeDefined();
      expect(status.performance).toBeGreaterThan(0);
      expect(status.status).toBe('idle');
    });
  });
});
