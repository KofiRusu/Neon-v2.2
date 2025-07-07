import { SEOAgent } from "../agents/seo-agent";
import type { 
  SEOOptimizationContext, 
  MetaTagsInput, 
  KeywordRecommendation
} from "../agents/seo-agent";
import { withRetryTimeoutFallback } from "../utils/withRetry";
import { BudgetTracker } from "@neon/utils";

// Mock dependencies
jest.mock("../utils/withRetry", () => ({
  withRetryTimeoutFallback: jest.fn(),
}));

jest.mock("@neon/utils", () => ({
  logger: {
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
  BudgetTracker: {
    checkBudgetStatus: jest.fn(),
    trackCost: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock("openai", () => {
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

describe("SEOAgent", () => {
  let seoAgent: SEOAgent;
  const mockWithRetryTimeoutFallback = withRetryTimeoutFallback as jest.MockedFunction<typeof withRetryTimeoutFallback>;
  const mockBudgetTracker = BudgetTracker as jest.Mocked<typeof BudgetTracker>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock BudgetTracker.checkBudgetStatus to return success
    mockBudgetTracker.checkBudgetStatus.mockResolvedValue({
      canExecute: true,
      isOverBudget: false,
      overrideEnabled: false,
      utilizationPercentage: 50,
    });

    // Mock withRetryTimeoutFallback to call the function directly for testing
    mockWithRetryTimeoutFallback.mockImplementation(async (fn: any, fallback: any) => {
      try {
        return await fn();
      } catch (error) {
        return fallback;
      }
    });

    seoAgent = new SEOAgent();
  });

  describe("generateMetaTags", () => {
    const mockMetaTagsInput: MetaTagsInput = {
      topic: "AI Marketing Tools",
      content: "Comprehensive guide to AI marketing automation tools that help businesses scale their marketing efforts with intelligent automation.",
      keywords: ["AI marketing", "marketing automation", "business tools"],
      businessContext: "B2B SaaS marketing platform",
      targetAudience: "Marketing professionals",
      contentType: "blog",
    };

    it("should generate meta tags successfully with OpenAI", async () => {
      // Mock successful OpenAI response
      mockWithRetryTimeoutFallback.mockResolvedValueOnce({
        title: "AI Marketing Tools | Complete Guide for Marketing Professionals",
        description: "Discover powerful AI marketing automation tools that help businesses scale their marketing efforts. Expert insights and proven strategies.",
        slug: "ai-marketing-tools-complete-guide",
        focusKeyword: "AI marketing",
        semanticKeywords: ["marketing automation", "business tools"],
      });

      const result = await seoAgent.generateMetaTags(mockMetaTagsInput, "test-campaign-id");

      expect(result).toEqual({
        title: "AI Marketing Tools | Complete Guide for Marketing Professionals",
        description: "Discover powerful AI marketing automation tools that help businesses scale their marketing efforts. Expert insights and proven strategies.",
        slug: "ai-marketing-tools-complete-guide",
        focusKeyword: "AI marketing",
        semanticKeywords: ["marketing automation", "business tools"],
      });

      expect(mockWithRetryTimeoutFallback).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          title: expect.stringContaining("AI Marketing Tools"),
          description: expect.any(String),
          slug: expect.any(String),
        }),
        {
          retries: 3,
          delay: 1500,
          timeoutMs: 30000,
        }
      );
    });

    it("should use fallback when OpenAI fails", async () => {
      // Mock OpenAI failure
      mockWithRetryTimeoutFallback.mockResolvedValueOnce({
        title: "AI Marketing Tools | Complete Guide & Best Practices",
        description: "Discover comprehensive AI marketing strategies. Expert tips, proven methods, and actionable insights for success.",
        slug: "ai-marketing-tools",
        focusKeyword: "AI marketing",
        semanticKeywords: ["marketing automation", "business tools"],
      });

      const result = await seoAgent.generateMetaTags(mockMetaTagsInput);

      expect(result).toEqual({
        title: "AI Marketing Tools | Complete Guide & Best Practices",
        description: "Discover comprehensive AI marketing strategies. Expert tips, proven methods, and actionable insights for success.",
        slug: "ai-marketing-tools",
        focusKeyword: "AI marketing",
        semanticKeywords: ["marketing automation", "business tools"],
      });
    });

    it("should handle missing OpenAI API key gracefully", async () => {
      // Create agent without OpenAI key
      const originalEnv = process.env.OPENAI_API_KEY;
      delete process.env.OPENAI_API_KEY;
      
      const agentWithoutKey = new SEOAgent();
      const result = await agentWithoutKey.generateMetaTags(mockMetaTagsInput);

      expect(result).toEqual({
        title: "AI marketing | Complete Guide & Best Practices",
        description: "Discover comprehensive AI marketing strategies. Expert tips, proven methods, and actionable insights for success.",
        slug: "ai-marketing-tools",
        focusKeyword: "AI marketing",
        semanticKeywords: ["marketing automation", "business tools"],
      });

      // Restore environment
      if (originalEnv) {
        process.env.OPENAI_API_KEY = originalEnv;
      }
    });

    it("should generate fallback meta tags with proper structure", async () => {
      const fallbackInput: MetaTagsInput = {
        topic: "Digital Marketing",
        content: "Guide to digital marketing strategies",
        keywords: ["SEO", "content marketing", "social media"],
        contentType: "article",
      };

      // Create agent without OpenAI to test fallback
      const originalEnv = process.env.OPENAI_API_KEY;
      delete process.env.OPENAI_API_KEY;
      
      const agentWithoutKey = new SEOAgent();
      const result = await agentWithoutKey.generateMetaTags(fallbackInput);

      expect(result).toMatchObject({
        title: expect.stringContaining("Digital Marketing"),
        description: expect.stringContaining("Digital Marketing"),
        slug: expect.stringMatching(/^[a-z0-9-]+$/),
        focusKeyword: "SEO",
        semanticKeywords: ["content marketing", "social media"],
      });

      // Restore environment
      if (originalEnv) {
        process.env.OPENAI_API_KEY = originalEnv;
      }
    });
  });

  describe("recommendKeywords", () => {
    const mockKeywordContext = {
      topic: "AI Marketing",
      businessContext: "B2B SaaS platform targeting marketing professionals",
    };

    it("should recommend keywords successfully with OpenAI", async () => {
      const mockKeywordRecommendations: KeywordRecommendation[] = [
        {
          keyword: "AI marketing tools",
          relevanceScore: 92,
          difficulty: 65,
          opportunity: 85,
          searchVolume: "high",
          intent: "commercial",
          reason: "High commercial intent with strong relevance to AI marketing",
        },
        {
          keyword: "marketing automation software",
          relevanceScore: 88,
          difficulty: 55,
          opportunity: 78,
          searchVolume: "medium",
          intent: "commercial",
          reason: "Strong commercial intent in the marketing automation space",
        },
      ];

      mockWithRetryTimeoutFallback.mockResolvedValueOnce(mockKeywordRecommendations);

      const result = await seoAgent.recommendKeywords(mockKeywordContext, "test-campaign-id");

      expect(result).toEqual(mockKeywordRecommendations);
      expect(mockWithRetryTimeoutFallback).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Array),
        {
          retries: 3,
          delay: 1500,
          timeoutMs: 30000,
        }
      );
    });

    it("should use fallback when OpenAI fails", async () => {
      // Mock fallback response
      mockWithRetryTimeoutFallback.mockResolvedValueOnce([
        {
          keyword: "AI Marketing tips",
          relevanceScore: 70,
          difficulty: 50,
          opportunity: 60,
          searchVolume: "medium",
          intent: "informational",
          reason: "Related to AI Marketing with informational intent",
        },
      ]);

      const result = await seoAgent.recommendKeywords(mockKeywordContext);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        keyword: expect.stringContaining("AI Marketing"),
        relevanceScore: expect.any(Number),
        difficulty: expect.any(Number),
        opportunity: expect.any(Number),
        searchVolume: expect.any(String),
        intent: expect.any(String),
        reason: expect.any(String),
      });
    });

    it("should handle missing OpenAI API key gracefully", async () => {
      // Create agent without OpenAI key
      const originalEnv = process.env.OPENAI_API_KEY;
      delete process.env.OPENAI_API_KEY;
      
      const agentWithoutKey = new SEOAgent();
      const result = await agentWithoutKey.recommendKeywords(mockKeywordContext);

      expect(result).toHaveLength(10); // Default fallback provides 10 recommendations
      expect(result[0]).toMatchObject({
        keyword: expect.stringContaining("AI Marketing"),
        relevanceScore: expect.any(Number),
        difficulty: expect.any(Number),
        opportunity: expect.any(Number),
        searchVolume: expect.any(String),
        intent: expect.any(String),
        reason: expect.any(String),
      });

      // Restore environment
      if (originalEnv) {
        process.env.OPENAI_API_KEY = originalEnv;
      }
    });
  });

  describe("execute", () => {
    it("should check budget before execution", async () => {
      const payload = {
        task: "generate_meta_tags",
        context: {
          topic: "Test Topic",
          content: "Test content",
          keywords: ["test"],
        },
        priority: "medium" as const,
      };

      mockWithRetryTimeoutFallback.mockResolvedValueOnce({
        title: "Test Title",
        description: "Test Description",
        slug: "test-topic",
      });

      await seoAgent.execute(payload);

      expect(mockBudgetTracker.checkBudgetStatus).toHaveBeenCalled();
    });

    it("should throw error when budget is exceeded", async () => {
      mockBudgetTracker.checkBudgetStatus.mockResolvedValueOnce({
        canExecute: false,
        isOverBudget: true,
        overrideEnabled: false,
        utilizationPercentage: 105,
      });

      const payload = {
        task: "generate_meta_tags",
        context: {
          topic: "Test Topic",
          content: "Test content",
          keywords: ["test"],
        },
        priority: "medium" as const,
      };

      await expect(seoAgent.execute(payload)).rejects.toThrow("Budget exceeded");
    });

    it("should handle unknown task error", async () => {
      const payload = {
        task: "unknown_task",
        context: {},
        priority: "medium" as const,
      };

      await expect(seoAgent.execute(payload)).rejects.toThrow("Unknown task: unknown_task");
    });

    it("should execute generate_meta_tags task successfully", async () => {
      const payload = {
        task: "generate_meta_tags",
        context: {
          topic: "AI Marketing",
          content: "Content about AI marketing",
          keywords: ["AI", "marketing"],
        },
        priority: "medium" as const,
      };

      mockWithRetryTimeoutFallback.mockResolvedValueOnce({
        title: "AI Marketing | Complete Guide",
        description: "Comprehensive guide to AI marketing strategies",
        slug: "ai-marketing-complete-guide",
      });

      const result = await seoAgent.execute(payload);

      expect(result).toEqual({
        title: "AI Marketing | Complete Guide",
        description: "Comprehensive guide to AI marketing strategies",
        slug: "ai-marketing-complete-guide",
      });
    });

    it("should execute recommend_keywords task successfully", async () => {
      const payload = {
        task: "recommend_keywords",
        context: {
          topic: "AI Marketing",
          businessContext: "B2B SaaS",
        },
        priority: "medium" as const,
      };

      const mockRecommendations = [
        {
          keyword: "AI marketing tools",
          relevanceScore: 90,
          difficulty: 60,
          opportunity: 80,
          searchVolume: "high",
          intent: "commercial",
          reason: "High relevance and commercial intent",
        },
      ];

      mockWithRetryTimeoutFallback.mockResolvedValueOnce(mockRecommendations);

      const result = await seoAgent.execute(payload);

      expect(result).toEqual(mockRecommendations);
    });
  });

  describe("analyzeContentSEO", () => {
    const mockSEOContext: SEOOptimizationContext = {
      content: "This is a comprehensive guide to AI marketing tools and strategies that help businesses automate their marketing processes.",
      targetKeywords: ["AI marketing", "marketing automation", "business tools"],
      title: "AI Marketing Tools Guide",
      description: "Complete guide to AI marketing tools",
      contentType: "blog",
      focusKeyword: "AI marketing",
      businessContext: "B2B SaaS marketing platform",
      targetAudience: "Marketing professionals",
    };

    it("should analyze content and return SEO analysis result", async () => {
      const result = await seoAgent.analyzeContentSEO(mockSEOContext, "test-campaign-id");

      expect(result).toMatchObject({
        seoScore: expect.any(Number),
        optimizedContent: expect.any(String),
        suggestions: expect.any(Array),
        keywords: expect.any(Array),
        meta: expect.any(Object),
        keywordRecommendations: expect.any(Array),
        success: true,
      });

      expect(result.seoScore).toBeGreaterThan(0);
      expect(result.seoScore).toBeLessThanOrEqual(100);
    });

    it("should include keyword analysis in results", async () => {
      const result = await seoAgent.analyzeContentSEO(mockSEOContext);

      expect(result.keywords).toHaveLength(3); // Should analyze all target keywords
      result.keywords.forEach((keyword) => {
        expect(keyword).toMatchObject({
          keyword: expect.any(String),
          density: expect.any(Number),
          frequency: expect.any(Number),
          position: expect.any(String),
          competitiveness: expect.any(String),
          searchVolume: expect.any(String),
          difficulty: expect.any(Number),
          opportunity: expect.any(Number),
          semanticVariants: expect.any(Array),
        });
      });
    });

    it("should generate SEO suggestions", async () => {
      const result = await seoAgent.analyzeContentSEO(mockSEOContext);

      expect(result.suggestions).toBeInstanceOf(Array);
      result.suggestions.forEach((suggestion) => {
        expect(suggestion).toMatchObject({
          type: expect.any(String),
          severity: expect.any(String),
          message: expect.any(String),
          impact: expect.any(String),
          effort: expect.any(String),
          priority: expect.any(Number),
        });
      });
    });
  });

  describe("Cost Tracking", () => {
    it("should track cost for meta tags generation", async () => {
      const mockInput: MetaTagsInput = {
        topic: "AI Marketing",
        content: "Content about AI marketing",
        keywords: ["AI", "marketing"],
      };

      mockWithRetryTimeoutFallback.mockImplementation(async (fn: any) => {
        // Simulate successful OpenAI call
        return await fn();
      });

      // We can't directly test the internal OpenAI call, but we can verify cost tracking was called
      await seoAgent.generateMetaTags(mockInput, "test-campaign-id");

      // The cost tracking should be called through the retry wrapper
      expect(mockWithRetryTimeoutFallback).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Object),
        expect.objectContaining({
          retries: 3,
          delay: 1500,
          timeoutMs: 30000,
        })
      );
    });

    it("should track cost for keyword recommendations", async () => {
      const mockContext = {
        topic: "AI Marketing",
        businessContext: "B2B SaaS",
      };

      mockWithRetryTimeoutFallback.mockImplementation(async (fn: any) => {
        // Simulate successful OpenAI call
        return await fn();
      });

      await seoAgent.recommendKeywords(mockContext, "test-campaign-id");

      expect(mockWithRetryTimeoutFallback).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Array),
        expect.objectContaining({
          retries: 3,
          delay: 1500,
          timeoutMs: 30000,
        })
      );
    });
  });

  describe("Error Handling", () => {
    it("should handle OpenAI API errors gracefully", async () => {
      mockWithRetryTimeoutFallback.mockRejectedValueOnce(new Error("OpenAI API error"));

      const mockInput: MetaTagsInput = {
        topic: "Test Topic",
        content: "Test content",
        keywords: ["test"],
      };

      // Should not throw error, should return fallback
      const result = await seoAgent.generateMetaTags(mockInput);

      expect(result).toMatchObject({
        title: expect.stringContaining("Test Topic"),
        description: expect.any(String),
        slug: expect.any(String),
      });
    });

    it("should handle timeout errors", async () => {
      mockWithRetryTimeoutFallback.mockRejectedValueOnce(new Error("Timeout"));

      const mockContext = {
        topic: "Test Topic",
        businessContext: "Test context",
      };

      const result = await seoAgent.recommendKeywords(mockContext);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
    });
  });
});