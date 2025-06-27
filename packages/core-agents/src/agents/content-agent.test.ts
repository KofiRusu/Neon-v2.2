import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { ContentAgent, type ContentGenerationContext } from './content-agent';

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

describe('ContentAgent', () => {
  let agent: ContentAgent;
  let mockOpenAI: any;

  beforeEach(() => {
    // Reset environment
    process.env = { ...originalEnv };
    process.env.OPENAI_API_KEY = 'test-api-key';

    agent = new ContentAgent();

    // Get the mocked OpenAI instance
    const OpenAI = require('openai').default;
    mockOpenAI = new OpenAI();
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  describe('Agent initialization', () => {
    it('should instantiate correctly', () => {
      expect(agent).toBeDefined();
      expect(agent.id).toBe('content-agent');
      expect(agent.name).toBe('ContentAgent');
      expect(agent.type).toBe('content');
    });

    it('should have correct capabilities', () => {
      expect(agent.capabilities).toContain('generate_content');
      expect(agent.capabilities).toContain('generate_blog');
      expect(agent.capabilities).toContain('generate_caption');
      expect(agent.capabilities).toContain('generate_post');
    });

    it('should handle missing OpenAI API key gracefully', () => {
      delete process.env.OPENAI_API_KEY;
      const agentWithoutKey = new ContentAgent();
      expect(agentWithoutKey).toBeDefined();
    });
  });

  describe('Content generation with OpenAI', () => {
    it('should generate AI-powered blog content', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content:
                '# AI Marketing Guide\n\nThis is a comprehensive guide about AI marketing for small businesses...',
            },
          },
        ],
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const context: ContentGenerationContext = {
        type: 'blog',
        topic: 'AI marketing',
        audience: 'small business owners',
        tone: 'professional',
        keywords: ['AI', 'marketing', 'automation'],
      };

      const result = await agent.generateBlog(context);

      expect(result.success).toBe(true);
      expect(result.content).toContain('AI Marketing Guide');
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4',
          temperature: 0.7,
          max_tokens: 2000,
        })
      );
    });

    it('should generate social media captions', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content:
                '🚀 Transform your business with AI marketing! Perfect for entrepreneurs ready to scale 📈 #AI #Marketing #BusinessGrowth',
            },
          },
        ],
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const context: ContentGenerationContext = {
        type: 'caption',
        topic: 'AI marketing transformation',
        audience: 'entrepreneurs',
        tone: 'friendly',
        platform: 'instagram',
      };

      const result = await agent.generateCaption(context);

      expect(result.success).toBe(true);
      expect(result.content).toContain('AI marketing');
      expect(result.hashtags).toBeDefined();
    });

    it('should fallback to template generation when OpenAI fails', async () => {
      mockOpenAI.chat.completions.create.mockRejectedValue(new Error('OpenAI API error'));

      const context: ContentGenerationContext = {
        type: 'social_post',
        topic: 'digital marketing',
        audience: 'marketers',
        tone: 'professional',
      };

      const result = await agent.generatePost(context);

      expect(result.success).toBe(true);
      expect(result.content).toBeDefined();
      expect(result.content.length).toBeGreaterThan(0);
    });
  });

  describe('Content metrics and analysis', () => {
    it('should calculate reading time correctly', async () => {
      const context: ContentGenerationContext = {
        type: 'blog',
        topic: 'long article',
        audience: 'readers',
        tone: 'professional',
      };

      const result = await agent.generateBlog(context);

      expect(result.readingTime).toBeDefined();
      expect(typeof result.readingTime).toBe('number');
      expect(result.readingTime).toBeGreaterThan(0);
    });

    it('should calculate SEO score when keywords provided', async () => {
      const context: ContentGenerationContext = {
        type: 'blog',
        topic: 'SEO optimization',
        audience: 'digital marketers',
        tone: 'professional',
        keywords: ['SEO', 'optimization', 'search'],
      };

      const result = await agent.generateBlog(context);

      expect(result.seoScore).toBeDefined();
      expect(typeof result.seoScore).toBe('number');
      expect(result.seoScore).toBeGreaterThanOrEqual(0);
      expect(result.seoScore).toBeLessThanOrEqual(100);
    });

    it('should generate appropriate hashtags for social content', async () => {
      const context: ContentGenerationContext = {
        type: 'social_post',
        topic: 'AI marketing',
        audience: 'startups',
        tone: 'playful',
      };

      const result = await agent.generatePost(context);

      expect(result.hashtags).toBeDefined();
      expect(Array.isArray(result.hashtags)).toBe(true);
      expect(result.hashtags?.length).toBeGreaterThan(0);
      expect(result.hashtags).toContain('#AI');
    });
  });

  describe('Error handling and validation', () => {
    it('should throw error for missing required fields', async () => {
      const invalidContext = {
        type: 'blog',
        // Missing topic, audience
      } as ContentGenerationContext;

      await expect(
        agent.execute({
          task: 'generate_blog',
          context: invalidContext,
          priority: 'medium',
        })
      ).rejects.toThrow('Missing required context');
    });

    it('should handle different content types correctly', async () => {
      const types: Array<ContentGenerationContext['type']> = [
        'blog',
        'social_post',
        'email',
        'caption',
        'copy',
      ];

      for (const type of types) {
        const context: ContentGenerationContext = {
          type,
          topic: 'test topic',
          audience: 'test audience',
          tone: 'professional',
        };

        const result = await agent.execute({
          task: 'generate_content',
          context,
          priority: 'medium',
        });

        expect(result.success).toBe(true);
        expect(result.content).toBeDefined();
      }
    });
  });
});
