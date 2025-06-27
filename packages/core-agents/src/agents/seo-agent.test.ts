import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import {
  SEOAgent,
  type SEOOptimizationContext,
  type MetaTagsInput,
  type KeywordRecommendation,
} from './seo-agent';

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

describe('SEOAgent', () => {
  let agent: SEOAgent;
  let mockOpenAI: any;

  beforeEach(() => {
    // Reset environment
    process.env = { ...originalEnv };
    process.env.OPENAI_API_KEY = 'test-api-key';

    agent = new SEOAgent();

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
      expect(agent.id).toBe('seo-agent');
      expect(agent.name).toBe('SEOAgent');
      expect(agent.type).toBe('seo');
      expect(agent.capabilities).toContain('optimize_keywords');
      expect(agent.capabilities).toContain('generate_meta_tags');
      expect(agent.capabilities).toContain('recommend_keywords');
    });

    it('should handle missing OpenAI API key gracefully', () => {
      delete process.env.OPENAI_API_KEY;
      const agentWithoutKey = new SEOAgent();
      expect(agentWithoutKey).toBeDefined();
    });
  });

  describe('Meta tags generation', () => {
    it('should generate meta tags using AI when API key is available', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                title: 'SEO Marketing Guide | Expert Tips & Strategies',
                description:
                  'Learn comprehensive SEO marketing strategies from experts. Proven techniques for better rankings.',
                slug: 'seo-marketing-guide',
                focusKeyword: 'SEO marketing',
                semanticKeywords: ['search optimization', 'digital marketing'],
              }),
            },
          },
        ],
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const input: MetaTagsInput = {
        topic: 'SEO Marketing',
        content: 'This is comprehensive content about SEO marketing strategies and best practices.',
        keywords: ['SEO', 'marketing', 'search optimization'],
        businessContext: 'Digital marketing agency',
        targetAudience: 'Business owners',
        contentType: 'blog',
      };

      const result = await agent.generateMetaTags(input);

      expect(result.title).toBe('SEO Marketing Guide | Expert Tips & Strategies');
      expect(result.description).toBe(
        'Learn comprehensive SEO marketing strategies from experts. Proven techniques for better rankings.'
      );
      expect(result.slug).toBe('seo-marketing-guide');
      expect(result.focusKeyword).toBe('SEO marketing');
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledTimes(1);
    });

    it('should use fallback when OpenAI fails', async () => {
      mockOpenAI.chat.completions.create.mockRejectedValue(new Error('API Error'));

      const input: MetaTagsInput = {
        topic: 'Content Marketing',
        content: 'Content about content marketing strategies.',
        keywords: ['content marketing', 'strategy'],
        contentType: 'article',
      };

      const result = await agent.generateMetaTags(input);

      expect(result.title).toContain('content marketing');
      expect(result.description).toContain('content marketing');
      expect(result.slug).toContain('content-marketing');
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

      const input: MetaTagsInput = {
        topic: 'Digital Marketing',
        content: 'Content about digital marketing.',
        keywords: ['digital marketing'],
        contentType: 'page',
      };

      const result = await agent.generateMetaTags(input);

      expect(result.title).toBeDefined();
      expect(result.description).toBeDefined();
      expect(result.slug).toBeDefined();
    });
  });

  describe('Keyword recommendations', () => {
    it('should recommend keywords using AI', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify([
                {
                  keyword: 'SEO strategy',
                  relevanceScore: 90,
                  difficulty: 45,
                  opportunity: 80,
                  searchVolume: 'high',
                  intent: 'informational',
                  reason: 'High relevance with good search volume',
                },
                {
                  keyword: 'search engine optimization tips',
                  relevanceScore: 85,
                  difficulty: 35,
                  opportunity: 75,
                  searchVolume: 'medium',
                  intent: 'informational',
                  reason: 'Long-tail keyword with lower competition',
                },
              ]),
            },
          },
        ],
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const result = await agent.recommendKeywords({
        topic: 'SEO',
        businessContext: 'Marketing agency',
      });

      expect(result).toHaveLength(2);
      expect(result[0].keyword).toBe('SEO strategy');
      expect(result[0].relevanceScore).toBe(90);
      expect(result[1].keyword).toBe('search engine optimization tips');
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledTimes(1);
    });

    it('should use fallback keyword recommendations when AI fails', async () => {
      mockOpenAI.chat.completions.create.mockRejectedValue(new Error('API Error'));

      const result = await agent.recommendKeywords({
        topic: 'content marketing',
      });

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].keyword).toContain('content marketing');
      expect(result.every(r => r.relevanceScore)).toBe(true);
      expect(result.every(r => r.difficulty)).toBe(true);
    });
  });

  describe('Content analysis and optimization', () => {
    it('should analyze content and provide SEO suggestions', async () => {
      const context: SEOOptimizationContext = {
        content: 'This is a short piece of content about SEO. SEO is important for websites.',
        targetKeywords: ['SEO', 'search optimization'],
        focusKeyword: 'SEO',
        contentType: 'article',
        title: 'SEO Guide',
        description: 'Short description',
        businessContext: 'Marketing agency',
      };

      const result = await agent.execute({
        task: 'analyze_content',
        context,
        priority: 'medium',
      });

      expect(result.success).toBe(true);
      expect(result.data.seoScore).toBeGreaterThan(0);
      expect(result.data.keywords).toHaveLength(2);
      expect(result.data.suggestions).toBeDefined();
      expect(result.data.keywordRecommendations).toBeDefined();
    });

    it('should calculate keyword density correctly', async () => {
      const keywords = await agent.analyzeContent(
        'SEO is important. SEO helps websites rank better. Good SEO practices include keyword optimization.',
        ['SEO']
      );

      expect(keywords).toHaveLength(1);
      expect(keywords[0].keyword).toBe('SEO');
      expect(keywords[0].frequency).toBe(3);
      expect(keywords[0].density).toBeCloseTo(20, 1); // 3/15 words = 20%
    });

    it('should identify keyword positions correctly', async () => {
      const content =
        'SEO Guide: This content discusses search engine optimization and SEO best practices.';
      const keywords = await agent.analyzeContent(content, ['SEO', 'optimization']);

      const seoKeyword = keywords.find(k => k.keyword === 'SEO');
      const optimizationKeyword = keywords.find(k => k.keyword === 'optimization');

      expect(seoKeyword?.position).toBe('title'); // Appears early in content
      expect(optimizationKeyword?.position).toBe('content');
    });

    it('should generate semantic keyword variants', async () => {
      const keywords = await agent.analyzeContent(
        'Content marketing is essential for business growth.',
        ['content marketing']
      );

      expect(keywords[0].semanticVariants).toContain('content marketing guide');
      expect(keywords[0].semanticVariants).toContain('content marketing tips');
      expect(keywords[0].semanticVariants).toContain('best content marketing');
    });
  });

  describe('SEO scoring system', () => {
    it('should give high scores for well-optimized content', async () => {
      const context: SEOOptimizationContext = {
        content: `# SEO Best Practices Guide

Search engine optimization (SEO) is crucial for online success. This comprehensive guide covers SEO strategies, techniques, and best practices that will help improve your website's visibility.

## Understanding SEO Fundamentals

SEO involves optimizing your content for search engines. Good SEO practices include keyword research, content optimization, and technical improvements.

## Advanced SEO Techniques

Advanced SEO strategies focus on user experience, content quality, and semantic search optimization. These techniques help websites rank higher in search results.

## Conclusion

Implementing proper SEO strategies will significantly improve your website's search engine rankings and organic traffic.`,
        targetKeywords: ['SEO', 'search engine optimization', 'optimization'],
        focusKeyword: 'SEO',
        contentType: 'article',
        title: 'SEO Best Practices Guide | Complete Guide for 2024',
        description:
          'Learn comprehensive SEO strategies and best practices. Expert tips for improving search rankings, keyword optimization, and technical SEO implementation.',
        businessContext: 'Digital marketing',
      };

      const result = await agent.execute({
        task: 'analyze_content',
        context,
        priority: 'medium',
      });

      expect(result.data.seoScore).toBeGreaterThan(70);
    });

    it('should give lower scores for poorly optimized content', async () => {
      const context: SEOOptimizationContext = {
        content: 'Short content.',
        targetKeywords: ['missing keyword'],
        contentType: 'article',
      };

      const result = await agent.execute({
        task: 'analyze_content',
        context,
        priority: 'medium',
      });

      expect(result.data.seoScore).toBeLessThan(50);
      expect(result.data.suggestions.length).toBeGreaterThan(0);
    });
  });

  describe('Technical SEO audit', () => {
    it('should identify missing H1 tags', async () => {
      const result = await agent.execute({
        task: 'audit_technical_seo',
        context: {
          url: 'https://example.com/page',
          content: '<p>Content without proper heading structure</p>',
        },
        priority: 'medium',
      });

      const h1Suggestion = result.data.find((s: any) => s.message.includes('H1 heading'));
      expect(h1Suggestion).toBeDefined();
      expect(h1Suggestion.severity).toBe('high');
    });

    it('should identify images without alt text', async () => {
      const result = await agent.execute({
        task: 'audit_technical_seo',
        context: {
          url: 'https://example.com/page',
          content: '<h1>Title</h1><img src="image.jpg"><img src="image2.jpg" alt="Description">',
        },
        priority: 'medium',
      });

      const altTextSuggestion = result.data.find((s: any) => s.message.includes('alt text'));
      expect(altTextSuggestion).toBeDefined();
      expect(altTextSuggestion.message).toContain('1 image(s) missing alt text');
    });
  });

  describe('Schema markup generation', () => {
    it('should generate appropriate schema markup for different content types', async () => {
      const blogContext: SEOOptimizationContext = {
        content: 'Blog content about SEO',
        targetKeywords: ['SEO'],
        contentType: 'blog',
        title: 'SEO Blog Post',
        description: 'Blog about SEO',
      };

      const result = await agent.execute({
        task: 'generate_schema',
        context: blogContext,
        priority: 'medium',
      });

      expect(result.data['@type']).toBe('BlogPosting');
      expect(result.data['@context']).toBe('https://schema.org');
      expect(result.data.headline).toBe('SEO Blog Post');
    });

    it('should include proper organization details in schema', async () => {
      const context: SEOOptimizationContext = {
        content: 'Product content',
        targetKeywords: ['product'],
        contentType: 'product',
        title: 'Test Product',
      };

      const result = await agent.execute({
        task: 'generate_schema',
        context,
        priority: 'medium',
      });

      expect(result.data.author.name).toBe('NeonHub');
      expect(result.data.publisher.name).toBe('NeonHub');
    });
  });

  describe('Error handling', () => {
    it('should handle invalid context gracefully', async () => {
      const result = await agent.execute({
        task: 'optimize_keywords',
        context: {
          content: '',
          targetKeywords: [],
        },
        priority: 'medium',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing required context');
    });

    it('should handle unknown tasks', async () => {
      const result = await agent.execute({
        task: 'unknown_task',
        context: {},
        priority: 'medium',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown task');
    });
  });

  describe('URL slug generation', () => {
    it('should generate SEO-friendly URLs', async () => {
      const input: MetaTagsInput = {
        topic: 'Best SEO Tools & Techniques 2024!',
        content: 'Content about SEO tools',
        contentType: 'blog',
      };

      const result = await agent.generateMetaTags(input);

      expect(result.slug).toBe('/blog/best-seo-tools-techniques-2024');
      expect(result.slug).not.toContain('!');
      expect(result.slug).not.toContain('&');
    });

    it('should handle different content types in URLs', async () => {
      const productInput: MetaTagsInput = {
        topic: 'Premium SEO Software',
        content: 'Product description',
        contentType: 'product',
      };

      const result = await agent.generateMetaTags(productInput);

      expect(result.slug).toContain('/products/');
    });
  });

  describe('Performance tracking', () => {
    it('should track execution performance', async () => {
      const result = await agent.execute({
        task: 'generate_meta_tags',
        context: {
          topic: 'SEO',
          content: 'SEO content',
        },
        priority: 'medium',
      });

      expect(result.performance).toBeGreaterThan(0);
      expect(result.metadata?.executionTime).toBeGreaterThan(0);
      expect(result.metadata?.agentId).toBe('seo-agent');
    });

    it('should update agent status after execution', async () => {
      await agent.execute({
        task: 'generate_meta_tags',
        context: {
          topic: 'SEO',
          content: 'SEO content',
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
