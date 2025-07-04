import {
  describe,
  it,
  expect,
  beforeEach,
  jest,
  afterEach,
} from "@jest/globals";
import { SEOAgent } from "@neon/core-agents";
import {
  SEOOptimizationInputSchema,
  SEOAnalysisOutputSchema,
  MetaTagsInputSchema,
} from "@neon/core-agents/src/schemas/agent-schemas";
import { AgentPayload } from "@neon/core-agents";

// Mock OpenAI
jest.mock("openai", () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    title: "Optimized SEO Title for Testing",
                    description:
                      "This is an optimized meta description for SEO testing purposes with target keywords.",
                    slug: "optimized-seo-title-testing",
                    focusKeyword: "SEO testing",
                    semanticKeywords: [
                      "optimization",
                      "search engine",
                      "testing",
                    ],
                  }),
                },
              },
            ],
            usage: {
              total_tokens: 200,
            },
          }),
        },
      },
    })),
  };
});

// Mock logger
jest.mock("@neon/utils", () => ({
  logger: {
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

describe("SEOAgent", () => {
  let seoAgent: SEOAgent;

  beforeEach(() => {
    seoAgent = new SEOAgent();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Initialization", () => {
    it("should initialize with correct properties", () => {
      expect(seoAgent.id).toBe("seo-agent");
      expect(seoAgent.name).toBe("SEOAgent");
      expect(seoAgent.type).toBe("seo");
      expect(seoAgent.getCapabilities()).toEqual([
        "optimize_keywords",
        "analyze_content",
        "generate_meta_tags",
        "analyze_competitors",
        "recommend_keywords",
        "generate_schema",
        "audit_technical_seo",
      ]);
    });

    it("should get agent status", async () => {
      const status = await seoAgent.getStatus();

      expect(status.id).toBe("seo-agent");
      expect(status.name).toBe("SEOAgent");
      expect(status.type).toBe("seo");
      expect(status.status).toBe("idle");
    });
  });

  describe("Input Validation", () => {
    it("should validate SEO optimization input", () => {
      const validInput = {
        content:
          "This is a comprehensive blog post about digital marketing strategies that help businesses grow their online presence.",
        targetKeywords: [
          "digital marketing",
          "online presence",
          "business growth",
        ],
        contentType: "blog" as const,
        title: "Digital Marketing Strategies for Business Growth",
        description: "Learn effective digital marketing strategies",
        focusKeyword: "digital marketing",
        targetAudience: "Small business owners",
      };

      const result = SEOOptimizationInputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it("should reject invalid SEO optimization input", () => {
      const invalidInput = {
        content: "Short", // Too short for SEO analysis
        targetKeywords: [], // Empty keywords array
        contentType: "invalid_type",
      };

      const result = SEOOptimizationInputSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it("should validate meta tags input", () => {
      const validInput = {
        topic: "Digital Marketing Strategies",
        content:
          "This is a comprehensive guide about digital marketing strategies for modern businesses.",
        keywords: ["digital marketing", "strategies", "business"],
        contentType: "blog" as const,
      };

      const result = MetaTagsInputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });
  });

  describe("SEO Content Analysis", () => {
    const validContext = {
      content:
        "Digital marketing is essential for modern businesses. Effective digital marketing strategies include SEO, content marketing, and social media. Businesses need comprehensive digital marketing solutions to compete online.",
      targetKeywords: ["digital marketing", "SEO", "content marketing"],
      contentType: "blog" as const,
      title: "Digital Marketing Guide",
      focusKeyword: "digital marketing",
      targetAudience: "Business owners",
    };

    it("should analyze content for SEO successfully", async () => {
      const payload: AgentPayload = {
        task: "analyze_content",
        context: validContext,
        priority: "medium",
      };

      const result = await seoAgent.execute(payload);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.seoScore).toBeGreaterThanOrEqual(0);
      expect(result.data.seoScore).toBeLessThanOrEqual(100);
      expect(result.data.optimizedContent).toBeDefined();
      expect(result.data.suggestions).toBeDefined();
      expect(Array.isArray(result.data.suggestions)).toBe(true);
      expect(result.data.keywords).toBeDefined();
      expect(Array.isArray(result.data.keywords)).toBe(true);
    });

    it("should optimize keywords successfully", async () => {
      const payload: AgentPayload = {
        task: "optimize_keywords",
        context: validContext,
        priority: "medium",
      };

      const result = await seoAgent.execute(payload);

      expect(result.success).toBe(true);
      expect(result.data.keywords).toBeDefined();
      expect(result.data.keywords.length).toBeGreaterThan(0);
    });

    it("should handle missing required context for SEO analysis", async () => {
      const payload: AgentPayload = {
        task: "analyze_content",
        context: {
          content: "Some content",
          // Missing targetKeywords
        },
        priority: "medium",
      };

      const result = await seoAgent.execute(payload);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Missing required context");
    });
  });

  describe("Meta Tags Generation", () => {
    it("should generate meta tags successfully", async () => {
      const payload: AgentPayload = {
        task: "generate_meta_tags",
        context: {
          topic: "Digital Marketing Strategies",
          content:
            "Comprehensive guide to digital marketing strategies for businesses.",
          keywords: ["digital marketing", "strategies", "business"],
          contentType: "blog",
          targetAudience: "Business owners",
        },
        priority: "medium",
      };

      const result = await seoAgent.execute(payload);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.title).toBeDefined();
      expect(result.data.description).toBeDefined();
      expect(result.data.slug).toBeDefined();
      expect(result.data.title.length).toBeLessThanOrEqual(60);
      expect(result.data.description.length).toBeLessThanOrEqual(160);
    });

    it("should handle AI failure gracefully for meta tags", async () => {
      // Mock OpenAI to throw an error
      const mockOpenAI = jest.requireMock("openai").default;
      const mockInstance = new mockOpenAI();
      mockInstance.chat.completions.create.mockRejectedValueOnce(
        new Error("OpenAI API Error"),
      );

      const payload: AgentPayload = {
        task: "generate_meta_tags",
        context: {
          topic: "Test Topic",
          content: "Test content for meta tags generation.",
          keywords: ["test", "meta tags"],
        },
        priority: "medium",
      };

      const result = await seoAgent.execute(payload);

      // Should still succeed with fallback
      expect(result.success).toBe(true);
      expect(result.data.title).toBeDefined();
      expect(result.data.description).toBeDefined();
    });
  });

  describe("Keyword Recommendations", () => {
    it("should recommend keywords successfully", async () => {
      const payload: AgentPayload = {
        task: "recommend_keywords",
        context: {
          topic: "Digital Marketing",
          businessContext: "SaaS company targeting small businesses",
        },
        priority: "medium",
      };

      const result = await seoAgent.execute(payload);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeGreaterThan(0);

      // Check keyword recommendation structure
      result.data.forEach((keyword: any) => {
        expect(keyword.keyword).toBeDefined();
        expect(keyword.relevanceScore).toBeGreaterThanOrEqual(0);
        expect(keyword.relevanceScore).toBeLessThanOrEqual(100);
        expect(keyword.difficulty).toBeGreaterThanOrEqual(0);
        expect(keyword.difficulty).toBeLessThanOrEqual(100);
        expect(keyword.opportunity).toBeGreaterThanOrEqual(0);
        expect(keyword.opportunity).toBeLessThanOrEqual(100);
        expect(["low", "medium", "high"]).toContain(keyword.searchVolume);
        expect([
          "informational",
          "navigational",
          "transactional",
          "commercial",
        ]).toContain(keyword.intent);
      });
    });
  });

  describe("Technical SEO Audit", () => {
    it("should perform technical SEO audit successfully", async () => {
      const payload: AgentPayload = {
        task: "audit_technical_seo",
        context: {
          url: "https://example.com/test-page",
          content:
            '<h1>Test Page</h1><p>This is test content for SEO audit.</p><img src="test.jpg">',
        },
        priority: "medium",
      };

      const result = await seoAgent.execute(payload);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
    });

    it("should identify SEO issues in technical audit", async () => {
      const payload: AgentPayload = {
        task: "audit_technical_seo",
        context: {
          url: "https://example.com/test-page",
          content: '<p>Content without proper headings</p><img src="test.jpg">', // Missing H1, img without alt
        },
        priority: "medium",
      };

      const result = await seoAgent.execute(payload);

      expect(result.success).toBe(true);
      expect(result.data.length).toBeGreaterThan(0);

      // Should identify missing H1 and alt text issues
      const suggestions = result.data;
      const hasH1Issue = suggestions.some((s: any) => s.message.includes("H1"));
      const hasAltTextIssue = suggestions.some((s: any) =>
        s.message.includes("alt"),
      );

      expect(hasH1Issue || hasAltTextIssue).toBe(true);
    });
  });

  describe("Schema Markup Generation", () => {
    it("should generate schema markup successfully", async () => {
      const payload: AgentPayload = {
        task: "generate_schema",
        context: {
          content: "This is a blog post about digital marketing.",
          targetKeywords: ["digital marketing"],
          contentType: "blog",
          title: "Digital Marketing Guide",
          description: "Complete guide to digital marketing",
        },
        priority: "medium",
      };

      const result = await seoAgent.execute(payload);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data["@context"]).toBe("https://schema.org");
      expect(result.data["@type"]).toBeDefined();
      expect(result.data.headline).toBeDefined();
    });
  });

  describe("Competitor Analysis", () => {
    it("should analyze competitors successfully", async () => {
      const payload: AgentPayload = {
        task: "analyze_competitors",
        context: {
          keywords: ["digital marketing", "SEO tools"],
          industry: "Marketing Technology",
        },
        priority: "medium",
      };

      const result = await seoAgent.execute(payload);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);

      if (result.data.length > 0) {
        const competitor = result.data[0];
        expect(competitor.domain).toBeDefined();
        expect(competitor.title).toBeDefined();
        expect(competitor.strengths).toBeDefined();
        expect(competitor.weaknesses).toBeDefined();
        expect(competitor.opportunities).toBeDefined();
      }
    });
  });

  describe("Error Handling", () => {
    it("should handle unknown task gracefully", async () => {
      const payload: AgentPayload = {
        task: "unknown_seo_task",
        context: {
          content: "Test content",
          targetKeywords: ["test"],
          contentType: "blog",
        },
        priority: "medium",
      };

      const result = await seoAgent.execute(payload);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Unknown task");
    });

    it("should handle malformed JSON in AI response", async () => {
      // Mock OpenAI to return malformed JSON
      const mockOpenAI = jest.requireMock("openai").default;
      const mockInstance = new mockOpenAI();
      mockInstance.chat.completions.create.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: "This is not valid JSON for meta tags",
            },
          },
        ],
      });

      const payload: AgentPayload = {
        task: "generate_meta_tags",
        context: {
          topic: "Test Topic",
          content: "Test content",
        },
        priority: "medium",
      };

      const result = await seoAgent.execute(payload);

      // Should still succeed with fallback
      expect(result.success).toBe(true);
      expect(result.data.title).toBeDefined();
    });
  });

  describe("Output Validation", () => {
    it("should produce valid output schema for SEO analysis", async () => {
      const payload: AgentPayload = {
        task: "analyze_content",
        context: {
          content:
            "Digital marketing strategies for modern businesses include SEO, content marketing, and social media optimization.",
          targetKeywords: ["digital marketing", "SEO", "content marketing"],
          contentType: "blog",
          focusKeyword: "digital marketing",
        },
        priority: "medium",
      };

      const result = await seoAgent.execute(payload);

      expect(result.success).toBe(true);

      // Validate output against schema
      const validation = SEOAnalysisOutputSchema.safeParse(result.data);
      expect(validation.success).toBe(true);
    });
  });

  describe("Keyword Analysis Functions", () => {
    it("should analyze keyword density correctly", async () => {
      const payload: AgentPayload = {
        task: "analyze_content",
        context: {
          content:
            "Digital marketing is the future. Digital marketing strategies help businesses grow. Effective digital marketing requires planning.",
          targetKeywords: ["digital marketing"],
          contentType: "blog",
        },
        priority: "medium",
      };

      const result = await seoAgent.execute(payload);

      expect(result.success).toBe(true);
      const keywords = result.data.keywords;
      const digitalMarketingKeyword = keywords.find(
        (k: any) => k.keyword === "digital marketing",
      );

      expect(digitalMarketingKeyword).toBeDefined();
      expect(digitalMarketingKeyword.frequency).toBeGreaterThan(0);
      expect(digitalMarketingKeyword.density).toBeGreaterThan(0);
    });

    it("should identify keyword positions correctly", async () => {
      const payload: AgentPayload = {
        task: "analyze_content",
        context: {
          content:
            "# Digital Marketing Guide\n\nThis comprehensive guide covers digital marketing strategies.",
          targetKeywords: ["digital marketing"],
          contentType: "blog",
          title: "Digital Marketing Guide",
        },
        priority: "medium",
      };

      const result = await seoAgent.execute(payload);

      expect(result.success).toBe(true);
      const keywords = result.data.keywords;
      const digitalMarketingKeyword = keywords.find(
        (k: any) => k.keyword === "digital marketing",
      );

      expect(digitalMarketingKeyword).toBeDefined();
      expect(["title", "headers", "content"]).toContain(
        digitalMarketingKeyword.position,
      );
    });
  });

  describe("SEO Scoring", () => {
    it("should calculate SEO score based on content quality", async () => {
      const goodContent = {
        content:
          "# Digital Marketing Strategies\n\nDigital marketing is essential for modern businesses. This comprehensive guide covers SEO, content marketing, social media, and email marketing strategies. Learn how to implement effective digital marketing campaigns.",
        targetKeywords: ["digital marketing", "SEO", "content marketing"],
        contentType: "blog" as const,
        title: "Digital Marketing Strategies Guide",
        description: "Complete guide to digital marketing strategies",
        focusKeyword: "digital marketing",
      };

      const payload: AgentPayload = {
        task: "analyze_content",
        context: goodContent,
        priority: "medium",
      };

      const result = await seoAgent.execute(payload);

      expect(result.success).toBe(true);
      expect(result.data.seoScore).toBeGreaterThan(50); // Should have decent score
    });

    it("should give lower score for poor content", async () => {
      const poorContent = {
        content: "Short content",
        targetKeywords: ["digital marketing", "SEO"],
        contentType: "blog" as const,
      };

      const payload: AgentPayload = {
        task: "analyze_content",
        context: poorContent,
        priority: "medium",
      };

      const result = await seoAgent.execute(payload);

      expect(result.success).toBe(true);
      expect(result.data.seoScore).toBeLessThan(50); // Should have lower score
    });
  });

  describe("Performance Tracking", () => {
    it("should track execution performance", async () => {
      const payload: AgentPayload = {
        task: "analyze_content",
        context: {
          content: "Test content for performance tracking.",
          targetKeywords: ["test"],
          contentType: "blog",
        },
        priority: "medium",
      };

      const result = await seoAgent.execute(payload);

      expect(result.success).toBe(true);
      expect(result.performance).toBeDefined();
      expect(typeof result.performance).toBe("number");
    });
  });

  describe("Integration Tests", () => {
    it("should handle complex SEO workflow", async () => {
      const content =
        "Digital marketing has revolutionized business. SEO optimization is crucial for online visibility. Content marketing drives engagement.";

      // Step 1: Analyze content
      const analysisResult = await seoAgent.execute({
        task: "analyze_content",
        context: {
          content,
          targetKeywords: ["digital marketing", "SEO", "content marketing"],
          contentType: "blog",
          focusKeyword: "digital marketing",
        },
        priority: "medium",
      });

      expect(analysisResult.success).toBe(true);

      // Step 2: Generate meta tags
      const metaResult = await seoAgent.execute({
        task: "generate_meta_tags",
        context: {
          topic: "Digital Marketing Guide",
          content,
          keywords: ["digital marketing", "SEO"],
        },
        priority: "medium",
      });

      expect(metaResult.success).toBe(true);

      // Step 3: Get keyword recommendations
      const keywordResult = await seoAgent.execute({
        task: "recommend_keywords",
        context: {
          topic: "digital marketing",
          businessContext: "Marketing agency",
        },
        priority: "medium",
      });

      expect(keywordResult.success).toBe(true);

      // All steps should be successful
      expect(analysisResult.data.seoScore).toBeDefined();
      expect(metaResult.data.title).toBeDefined();
      expect(keywordResult.data.length).toBeGreaterThan(0);
    });
  });

  describe("Public API Methods", () => {
    it("should expose analyzeContent method", async () => {
      const content = "Test content for SEO analysis";
      const keywords = ["test", "SEO"];

      const result = await seoAgent.analyzeContent(content, keywords);

      expect(Array.isArray(result)).toBe(true);
    });
  });
});
