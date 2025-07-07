import { ContentAgent } from '../agents/content-agent';
import { AgentPayload } from '../base-agent';

// Mock OpenAI
jest.mock('openai', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [
              {
                message: {
                  content: 'Generated AI content for testing purposes.',
                },
              },
            ],
            usage: {
              total_tokens: 150,
            },
          }),
        },
      },
    })),
  };
});

// Mock BudgetTracker
jest.mock('@neon/utils', () => ({
  logger: {
    warn: jest.fn(),
    error: jest.fn(),
  },
  BudgetTracker: {
    checkBudgetStatus: jest.fn().mockResolvedValue({
      canExecute: true,
      utilizationPercentage: 45,
    }),
    trackCost: jest.fn().mockResolvedValue(true),
  },
}));

describe('ContentAgent - Enhanced Enterprise Version', () => {
  let contentAgent: ContentAgent;
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.OPENAI_API_KEY = 'test-api-key';
    contentAgent = new ContentAgent();
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with correct default values', () => {
      expect(contentAgent.id).toBe('content-agent');
      expect(contentAgent.name).toBe('ContentAgent');
      expect(contentAgent.type).toBe('content');
      expect(contentAgent.capabilities).toContain('generate_content');
      expect(contentAgent.capabilities).toContain('optimize_content');
      expect(contentAgent.capabilities).toContain('personalize_content');
      expect(contentAgent.capabilities).toContain('rewrite_content');
      expect(contentAgent.capabilities).toContain('analyze_brand_voice');
      expect(contentAgent.capabilities).toContain('integrate_trends');
      expect(contentAgent.capabilities).toContain('get_status');
    });

    it('should handle missing OpenAI API key gracefully', () => {
      delete process.env.OPENAI_API_KEY;
      const agentWithoutKey = new ContentAgent();
      expect(agentWithoutKey).toBeDefined();
    });
  });

  describe('generateContent', () => {
    it('should generate content with valid input', async () => {
      const payload: AgentPayload = {
        task: 'generate_content',
        context: {
          topic: 'AI marketing strategies',
          type: 'blog',
          audience: 'digital marketers',
          tone: 'professional',
          keywords: ['AI', 'marketing', 'automation'],
          length: 'long',
        },
      };

      const result = await contentAgent.execute(payload);
      expect(result.success).toBe(true);
      expect(result.data.content).toBeDefined();
      expect(result.data.suggestedTitle).toBeDefined();
      expect(result.data.readingTime).toBeDefined();
      expect(result.data.seoScore).toBeDefined();
    });

    it('should validate input using Zod schema', async () => {
      const payload: AgentPayload = {
        task: 'generate_content',
        context: {
          topic: '', // Invalid: empty topic
          type: 'blog',
          audience: 'marketers',
        },
      };

      const result = await contentAgent.execute(payload);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Topic is required');
    });

    it('should handle different content types', async () => {
      const contentTypes = ['blog', 'social_post', 'email', 'caption', 'copy', 'ad_copy', 'product_description'];
      
      for (const type of contentTypes) {
        const payload: AgentPayload = {
          task: 'generate_content',
          context: {
            topic: 'test topic',
            type,
            audience: 'test audience',
            tone: 'professional',
          },
        };

        const result = await contentAgent.execute(payload);
        expect(result.success).toBe(true);
        expect(result.data.content).toBeDefined();
      }
    });

    it('should handle different tones', async () => {
      const tones = ['professional', 'casual', 'friendly', 'authoritative', 'playful', 'witty', 'inspirational', 'urgent'];
      
      for (const tone of tones) {
        const payload: AgentPayload = {
          task: 'generate_content',
          context: {
            topic: 'productivity tips',
            type: 'social_post',
            audience: 'professionals',
            tone,
          },
        };

        const result = await contentAgent.execute(payload);
        expect(result.success).toBe(true);
        expect(result.data.content).toBeDefined();
      }
    });

    it('should generate platform-specific content', async () => {
      const platforms = ['facebook', 'instagram', 'twitter', 'linkedin', 'email', 'website', 'tiktok', 'youtube'];
      
      for (const platform of platforms) {
        const payload: AgentPayload = {
          task: 'generate_content',
          context: {
            topic: 'brand awareness',
            type: 'social_post',
            audience: 'young adults',
            platform,
          },
        };

        const result = await contentAgent.execute(payload);
        expect(result.success).toBe(true);
        expect(result.data.content).toBeDefined();
      }
    });

    it('should integrate trend data when provided', async () => {
      const payload: AgentPayload = {
        task: 'generate_content',
        context: {
          topic: 'social media trends',
          type: 'social_post',
          audience: 'content creators',
          trendIds: ['trend_1', 'trend_2'],
          includeHashtags: true,
        },
      };

      const result = await contentAgent.execute(payload);
      expect(result.success).toBe(true);
      expect(result.data.content).toBeDefined();
    });

    it('should handle personalization variables', async () => {
      const payload: AgentPayload = {
        task: 'generate_content',
        context: {
          topic: 'customer appreciation',
          type: 'email',
          audience: 'customers',
          personalizationVariables: {
            name: 'John',
            company: 'TechCorp',
            product: 'Marketing Suite',
          },
        },
      };

      const result = await contentAgent.execute(payload);
      expect(result.success).toBe(true);
      expect(result.data.content).toBeDefined();
    });

    it('should validate enum values', async () => {
      const payload: AgentPayload = {
        task: 'generate_content',
        context: {
          topic: 'test',
          type: 'invalid_type', // Invalid enum value
          audience: 'test audience',
        },
      };

      const result = await contentAgent.execute(payload);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid enum value');
    });
  });

  describe('optimizeContent', () => {
    it('should optimize content with valid input', async () => {
      const payload: AgentPayload = {
        task: 'optimize_content',
        context: {
          content: 'This is some basic content that needs optimization.',
          targetKeywords: ['optimization', 'content', 'marketing'],
          platform: 'instagram',
          goals: ['engagement', 'reach'],
        },
      };

      const result = await contentAgent.execute(payload);
      expect(result.success).toBe(true);
      expect(result.data.originalContent).toBeDefined();
      expect(result.data.optimizedContent).toBeDefined();
      expect(result.data.optimizations).toBeDefined();
      expect(result.data.expectedImprovement).toBeDefined();
      expect(Array.isArray(result.data.optimizations)).toBe(true);
    });

    it('should require at least one keyword', async () => {
      const payload: AgentPayload = {
        task: 'optimize_content',
        context: {
          content: 'Content to optimize',
          targetKeywords: [], // Invalid: empty array
          goals: ['engagement'],
        },
      };

      const result = await contentAgent.execute(payload);
      expect(result.success).toBe(false);
      expect(result.error).toContain('At least one keyword is required');
    });

    it('should require at least one goal', async () => {
      const payload: AgentPayload = {
        task: 'optimize_content',
        context: {
          content: 'Content to optimize',
          targetKeywords: ['keyword'],
          goals: [], // Invalid: empty array
        },
      };

      const result = await contentAgent.execute(payload);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Array must contain at least 1 element');
    });

    it('should handle different optimization goals', async () => {
      const goals = [['engagement'], ['reach'], ['conversions'], ['brand_awareness'], ['lead_generation']];
      
      for (const goalSet of goals) {
        const payload: AgentPayload = {
          task: 'optimize_content',
          context: {
            content: 'Content for optimization',
            targetKeywords: ['test'],
            goals: goalSet,
          },
        };

        const result = await contentAgent.execute(payload);
        expect(result.success).toBe(true);
        expect(result.data.optimizations).toBeDefined();
      }
    });

    it('should include performance metrics when provided', async () => {
      const payload: AgentPayload = {
        task: 'optimize_content',
        context: {
          content: 'Existing content',
          targetKeywords: ['performance'],
          goals: ['engagement'],
          currentPerformance: {
            likes: 100,
            shares: 25,
            comments: 15,
            reach: 1000,
            clickThroughRate: 2.5,
          },
        },
      };

      const result = await contentAgent.execute(payload);
      expect(result.success).toBe(true);
      expect(result.data.analysis).toBeDefined();
    });
  });

  describe('personalizeContent', () => {
    it('should personalize content with variables', async () => {
      const payload: AgentPayload = {
        task: 'personalize_content',
        context: {
          templateContent: 'Hello {{name}}, welcome to {{company}}! Check out our {{product}}.',
          variables: {
            name: 'Sarah',
            company: 'NeonHub',
            product: 'AI Marketing Suite',
          },
          audience: 'new customers',
          tone: 'friendly',
        },
      };

      const result = await contentAgent.execute(payload);
      expect(result.success).toBe(true);
      expect(result.data.originalTemplate).toBeDefined();
      expect(result.data.personalizedContent).toBeDefined();
      expect(result.data.personalizedContent).toContain('Sarah');
      expect(result.data.personalizedContent).toContain('NeonHub');
      expect(result.data.personalizedContent).toContain('AI Marketing Suite');
      expect(result.data.variablesUsed).toBeDefined();
    });

    it('should require at least one variable', async () => {
      const payload: AgentPayload = {
        task: 'personalize_content',
        context: {
          templateContent: 'Template without variables',
          variables: {}, // Invalid: empty variables
          audience: 'customers',
        },
      };

      const result = await contentAgent.execute(payload);
      expect(result.success).toBe(false);
      expect(result.error).toContain('At least one personalization variable is required');
    });

    it('should handle missing template content', async () => {
      const payload: AgentPayload = {
        task: 'personalize_content',
        context: {
          templateContent: '', // Invalid: empty template
          variables: { name: 'John' },
          audience: 'customers',
        },
      };

      const result = await contentAgent.execute(payload);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Template content is required');
    });
  });

  describe('rewriteContent', () => {
    it('should rewrite content with new tone', async () => {
      const payload: AgentPayload = {
        task: 'rewrite_content',
        context: {
          originalContent: 'This is amazing content that will blow your mind!',
          newTone: 'professional',
          keepLength: true,
          preserveKeyPoints: true,
        },
      };

      const result = await contentAgent.execute(payload);
      expect(result.success).toBe(true);
      expect(result.data.originalContent).toBeDefined();
      expect(result.data.rewrittenContent).toBeDefined();
      expect(result.data.changes).toBeDefined();
      expect(result.data.changes.tone).toBe('professional');
    });

    it('should handle platform-specific rewrites', async () => {
      const payload: AgentPayload = {
        task: 'rewrite_content',
        context: {
          originalContent: 'Long form content that needs to be adapted for social media.',
          newTone: 'casual',
          newPlatform: 'twitter',
          newAudience: 'young professionals',
        },
      };

      const result = await contentAgent.execute(payload);
      expect(result.success).toBe(true);
      expect(result.data.changes.platform).toBe('twitter');
      expect(result.data.changes.audience).toBe('young professionals');
    });

    it('should require original content', async () => {
      const payload: AgentPayload = {
        task: 'rewrite_content',
        context: {
          originalContent: '', // Invalid: empty content
          newTone: 'professional',
        },
      };

      const result = await contentAgent.execute(payload);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Original content is required');
    });
  });

  describe('analyzeBrandVoice', () => {
    it('should analyze content for brand voice compliance', async () => {
      const payload: AgentPayload = {
        task: 'analyze_brand_voice',
        context: {
          content: 'This is professional content that aligns with our brand guidelines.',
          brandVoiceId: 'brand_voice_123',
        },
      };

      const result = await contentAgent.execute(payload);
      expect(result.success).toBe(true);
      expect(result.data.overallScore).toBeDefined();
      expect(result.data.toneMatch).toBeDefined();
      expect(result.data.keywordUsage).toBeDefined();
      expect(result.data.brandAlignment).toBeDefined();
      expect(result.data.suggestions).toBeDefined();
      expect(Array.isArray(result.data.suggestions)).toBe(true);
    });

    it('should work without brand voice ID', async () => {
      const payload: AgentPayload = {
        task: 'analyze_brand_voice',
        context: {
          content: 'Content to analyze for brand voice compliance.',
        },
      };

      const result = await contentAgent.execute(payload);
      expect(result.success).toBe(true);
      expect(result.data.brandVoiceId).toBe('default');
    });

    it('should require content for analysis', async () => {
      const payload: AgentPayload = {
        task: 'analyze_brand_voice',
        context: {
          brandVoiceId: 'brand_voice_123',
          // Missing content
        },
      };

      const result = await contentAgent.execute(payload);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Content is required for brand voice analysis');
    });
  });

  describe('integrateTrends', () => {
    it('should integrate trending topics into content', async () => {
      const payload: AgentPayload = {
        task: 'integrate_trends',
        context: {
          content: 'Original content about marketing strategies.',
          trendIds: ['trend_1', 'trend_2', 'trend_3'],
          platform: 'instagram',
        },
      };

      const result = await contentAgent.execute(payload);
      expect(result.success).toBe(true);
      expect(result.data.originalContent).toBeDefined();
      expect(result.data.trendIntegratedContent).toBeDefined();
      expect(result.data.trendsUsed).toEqual(['trend_1', 'trend_2', 'trend_3']);
      expect(result.data.platform).toBe('instagram');
    });

    it('should require content for trend integration', async () => {
      const payload: AgentPayload = {
        task: 'integrate_trends',
        context: {
          trendIds: ['trend_1'],
          platform: 'instagram',
          // Missing content
        },
      };

      const result = await contentAgent.execute(payload);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Content is required for trend integration');
    });
  });

  describe('getStatus', () => {
    it('should return content agent status', async () => {
      const payload: AgentPayload = {
        task: 'get_status',
        context: {},
      };

      const result = await contentAgent.execute(payload);
      expect(result.success).toBe(true);
      expect(result.data.id).toBe('content-agent');
      expect(result.data.name).toBe('ContentAgent');
      expect(result.data.type).toBe('content');
      expect(result.data.contentMetrics).toBeDefined();
      expect(result.data.performance).toBeDefined();
      expect(result.data.contentMetrics.contentTypesSupported).toBeDefined();
      expect(result.data.contentMetrics.platformsSupported).toBeDefined();
      expect(result.data.contentMetrics.tonesAvailable).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle unknown task', async () => {
      const payload: AgentPayload = {
        task: 'unknown_task',
        context: {},
      };

      const result = await contentAgent.execute(payload);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown task');
    });

    it('should handle budget exceeded scenario', async () => {
      const { BudgetTracker } = require('@neon/utils');
      BudgetTracker.checkBudgetStatus.mockResolvedValueOnce({
        canExecute: false,
        utilizationPercentage: 105,
      });

      const payload: AgentPayload = {
        task: 'generate_content',
        context: {
          topic: 'test',
          type: 'blog',
          audience: 'test audience',
        },
      };

      const result = await contentAgent.execute(payload);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Budget exceeded');
    });

    it('should handle OpenAI API failures gracefully', async () => {
      const OpenAI = require('openai').default;
      const mockOpenAI = new OpenAI();
      mockOpenAI.chat.completions.create.mockRejectedValueOnce(new Error('API Error'));

      const payload: AgentPayload = {
        task: 'generate_content',
        context: {
          topic: 'test topic',
          type: 'blog',
          audience: 'test audience',
        },
      };

      const result = await contentAgent.execute(payload);
      expect(result.success).toBe(true); // Should fallback to templates
      expect(result.data.content).toBeDefined();
    });
  });

  describe('Performance', () => {
    it('should complete content generation within reasonable time', async () => {
      const startTime = Date.now();
      
      const payload: AgentPayload = {
        task: 'generate_content',
        context: {
          topic: 'marketing automation',
          type: 'blog',
          audience: 'marketing professionals',
          length: 'long',
        },
      };

      const result = await contentAgent.execute(payload);
      const executionTime = Date.now() - startTime;
      
      expect(result.success).toBe(true);
      expect(executionTime).toBeLessThan(5000); // Should complete in under 5 seconds
    });

    it('should handle multiple content types efficiently', async () => {
      const startTime = Date.now();
      
      const contentTypes = ['blog', 'social_post', 'email', 'caption', 'copy'];
      const promises = contentTypes.map(type => 
        contentAgent.execute({
          task: 'generate_content',
          context: {
            topic: 'productivity',
            type,
            audience: 'professionals',
          },
        })
      );

      const results = await Promise.all(promises);
      const executionTime = Date.now() - startTime;
      
      expect(results.every(r => r.success)).toBe(true);
      expect(executionTime).toBeLessThan(10000); // Should complete all in under 10 seconds
    });
  });

  describe('Content Quality', () => {
    it('should generate content with consistent structure', async () => {
      const payload: AgentPayload = {
        task: 'generate_content',
        context: {
          topic: 'digital transformation',
          type: 'blog',
          audience: 'business leaders',
          keywords: ['digital', 'transformation', 'technology'],
        },
      };

      const result = await contentAgent.execute(payload);
      expect(result.success).toBe(true);
      expect(result.data.content.length).toBeGreaterThan(30);
      expect(result.data.readingTime).toBeGreaterThan(0);
      expect(result.data.seoScore).toBeGreaterThanOrEqual(0);
      expect(result.data.seoScore).toBeLessThanOrEqual(100);
    });

    it('should maintain brand voice consistency', async () => {
      const payload: AgentPayload = {
        task: 'generate_content',
        context: {
          topic: 'customer service',
          type: 'email',
          audience: 'customers',
          tone: 'professional',
          brandVoiceId: 'brand_voice_123',
        },
      };

      const result = await contentAgent.execute(payload);
      expect(result.success).toBe(true);
      
      // Analyze the generated content
      const analysisPayload: AgentPayload = {
        task: 'analyze_brand_voice',
        context: {
          content: result.data.content,
          brandVoiceId: 'brand_voice_123',
        },
      };

      const analysis = await contentAgent.execute(analysisPayload);
      expect(analysis.success).toBe(true);
      expect(analysis.data.overallScore).toBeGreaterThan(70); // Should maintain good brand voice compliance
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty context gracefully', async () => {
      const payload: AgentPayload = {
        task: 'generate_content',
        context: {},
      };

      const result = await contentAgent.execute(payload);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle extremely long content topics', async () => {
      const longTopic = 'a'.repeat(1000);
      const payload: AgentPayload = {
        task: 'generate_content',
        context: {
          topic: longTopic,
          type: 'social_post',
          audience: 'general',
        },
      };

      const result = await contentAgent.execute(payload);
      expect(result.success).toBe(true);
      expect(result.data.content).toBeDefined();
    });

    it('should handle special characters in content', async () => {
      const payload: AgentPayload = {
        task: 'generate_content',
        context: {
          topic: 'Test with émojis 🚀 and spëcial chäractërs',
          type: 'social_post',
          audience: 'international users',
          includeEmojis: true,
        },
      };

      const result = await contentAgent.execute(payload);
      expect(result.success).toBe(true);
      expect(result.data.content).toBeDefined();
    });
  });
}); 