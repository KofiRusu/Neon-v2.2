import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import {
  BrandVoiceAgent,
  type BrandVoiceContext,
  type BrandVoiceResult,
} from "./brand-voice-agent";

describe("BrandVoiceAgent", () => {
  let agent: BrandVoiceAgent;

  beforeEach(() => {
    agent = new BrandVoiceAgent();
  });

  afterEach(() => {
    // Clean up any resources
  });

  describe("Basic Agent Functionality", () => {
    it("should initialize with correct properties", () => {
      expect(agent.id).toBe("brand-voice-agent");
      expect(agent.name).toBe("BrandVoiceAgent");
      expect(agent.type).toBe("brand_voice");
      expect(agent.capabilities).toContain("analyze_content");
      expect(agent.capabilities).toContain("score_content");
      expect(agent.capabilities).toContain("generate_suggestions");
    });

    it("should have required methods", () => {
      expect(typeof agent.execute).toBe("function");
      expect(typeof agent.analyzeContentPublic).toBe("function");
      expect(typeof agent.scoreContentPublic).toBe("function");
      expect(typeof agent.getSuggestionsPublic).toBe("function");
    });
  });

  describe("Content Analysis", () => {
    it("should analyze content for brand voice compliance", async () => {
      const context: BrandVoiceContext = {
        action: "analyze",
        content: "Transform your marketing with our innovative AI-powered platform.",
        contentType: "email",
      };

      const result = await agent.execute({
        task: "analyze_content",
        context,
        priority: "medium",
      });

      expect(result.success).toBe(true);
      expect(result.voiceScore).toBeDefined();
      expect(result.analysis).toBeDefined();
      expect(result.suggestions).toBeDefined();
    });

         it("should handle missing content gracefully", async () => {
       const context: BrandVoiceContext = {
         action: "analyze",
         contentType: "email",
       };

       const result = await agent.execute({
         task: "analyze_content",
         context,
         priority: "medium",
       });

       expect((result as any).success).toBe(false);
    });
  });

  describe("Content Scoring", () => {
    it("should score content for brand voice alignment", async () => {
      const context: BrandVoiceContext = {
        action: "score",
        content: "Our platform delivers exceptional results through intelligent automation.",
        brandVoiceId: "neon-brand-voice-2024",
      };

      const result = await agent.execute({
        task: "score_content",
        context,
        priority: "medium",
      });

      expect(result.success).toBe(true);
      expect(result.voiceScore).toBeDefined();
      expect(typeof result.voiceScore).toBe("number");
      expect(result.voiceScore).toBeGreaterThanOrEqual(0);
      expect(result.voiceScore).toBeLessThanOrEqual(100);
    });

         it("should handle missing content in scoring", async () => {
       const context: BrandVoiceContext = {
         action: "score",
       };

       const result = await agent.execute({
         task: "score_content",
         context,
         priority: "medium",
       });

       expect((result as any).success).toBe(false);
    });
  });

  describe("Suggestion Generation", () => {
    it("should generate improvement suggestions", async () => {
      const context: BrandVoiceContext = {
        action: "suggest",
        content: "This product is good and helps users.",
        contentType: "social",
      };

      const result = await agent.execute({
        task: "generate_suggestions",
        context,
        priority: "medium",
      });

      expect(result.success).toBe(true);
      expect(result.suggestions).toBeDefined();
      expect(Array.isArray(result.suggestions)).toBe(true);
    });
  });

  describe("Brand Profile Management", () => {
    it("should create brand voice profiles", async () => {
      const context: BrandVoiceContext = {
        action: "create_profile",
        profileData: {
          name: "Test Brand Voice",
          description: "A test brand voice profile",
          guidelines: {
            tone: "professional, innovative",
            style: "clear and direct",
          },
          keywords: ["innovation", "excellence", "results"],
          toneProfile: {
            professional: 0.8,
            friendly: 0.6,
            innovative: 0.9,
          },
        },
      };

      const result = await agent.execute({
        task: "create_profile",
        context,
        priority: "medium",
      });

      expect(result.success).toBe(true);
      expect(result.profile).toBeDefined();
      expect(result.profile.name).toBe("Test Brand Voice");
    });

    it("should handle missing profile data", async () => {
      const context: BrandVoiceContext = {
        action: "create_profile",
      };

      const result = await agent.execute({
        task: "create_profile",
        context,
        priority: "medium",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Profile data is required");
    });
  });

  describe("Guidelines Retrieval", () => {
    it("should retrieve brand guidelines", async () => {
      const context: BrandVoiceContext = {
        action: "get_guidelines",
      };

      const result = await agent.execute({
        task: "get_guidelines",
        context,
        priority: "medium",
      });

                           expect((result as any).success).toBe(true);
      expect(result.guidelines).toBeDefined();
      expect(result.guidelines!.tone).toBeDefined();
      expect(result.guidelines!.vocabulary).toBeDefined();
      expect(result.guidelines!.style).toBeDefined();
    });
  });

  describe("Audience-Specific Analysis", () => {
    it("should analyze content for specific audience segments", async () => {
      const context: BrandVoiceContext = {
        action: "analyze_audience",
        content: "Streamline your enterprise workflows with our robust API integration capabilities.",
        audienceSegment: "enterprise",
        contentType: "blog",
      };

      const result = await agent.execute({
        task: "analyze_audience",
        context,
        priority: "medium",
      });

             expect((result as any).success).toBe(true);
       expect(result.analysis).toBeDefined();
       expect((result.analysis as any).audienceSegment).toBe("enterprise");
       expect((result.analysis as any).audienceAlignment).toBeDefined();
    });

    it("should handle missing audience segment", async () => {
      const context: BrandVoiceContext = {
        action: "analyze_audience",
        content: "Test content for audience analysis",
      };

      const result = await agent.execute({
        task: "analyze_audience",
        context,
        priority: "medium",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Audience segment is required");
    });

    it("should handle unknown audience segment", async () => {
      const context: BrandVoiceContext = {
        action: "analyze_audience",
        content: "Test content for audience analysis",
        audienceSegment: "unknown" as any,
      };

      const result = await agent.execute({
        task: "analyze_audience",
        context,
        priority: "medium",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Unknown audience segment");
    });
  });

  describe("Public API Methods", () => {
    it("should provide public content analysis method", async () => {
      const result = await agent.analyzeContentPublic(
        "Our innovative platform delivers transformative results for modern businesses.",
        "email",
        "brand-voice-2024",
      );

      expect(result.success).toBe(true);
      expect(result.voiceScore).toBeDefined();
      expect(result.analysis).toBeDefined();
    });

    it("should provide public content scoring method", async () => {
      const result = await agent.scoreContentPublic(
        "Excellence through innovation - that's our commitment to your success.",
        "brand-voice-2024",
      );

      expect(result.success).toBe(true);
      expect(result.voiceScore).toBeDefined();
    });

    it("should provide public suggestions method", async () => {
      const result = await agent.getSuggestionsPublic(
        "This tool is helpful for businesses.",
        "social",
      );

      expect(result.success).toBe(true);
      expect(result.suggestions).toBeDefined();
      expect(Array.isArray(result.suggestions)).toBe(true);
    });

    it("should provide public audience analysis method", async () => {
      const result = await agent.analyzeAudienceContentPublic(
        "Leverage advanced analytics to optimize your small business operations.",
        "smb",
        "blog",
      );

      expect(result.success).toBe(true);
      expect(result.analysis).toBeDefined();
      expect(result.analysis.audienceSegment).toBe("smb");
    });
  });

  describe("Error Handling", () => {
    it("should handle unknown actions", async () => {
      const context: BrandVoiceContext = {
        action: "unknown_action" as any,
      };

      const result = await agent.execute({
        task: "unknown_task",
        context,
          priority: "medium",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Unknown action");
    });
  });

  describe("Helper Methods", () => {
    it("should provide available audience segments", () => {
      const segments = agent.getAudienceSegments();

      expect(Array.isArray(segments)).toBe(true);
      expect(segments.length).toBeGreaterThan(0);
      expect(segments[0]).toHaveProperty("segment");
      expect(segments[0]).toHaveProperty("config");
    });

    it("should provide brand configuration", () => {
      const config = agent.getBrandConfig();

      expect(config).toBeDefined();
      expect(config.tagline).toBeDefined();
      expect(config.tone).toBeDefined();
      expect(config.vocabulary).toBeDefined();
    });
  });
});
