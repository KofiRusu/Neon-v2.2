import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { EmailMarketingAgent } from "@neon/core-agents";
import {
  EmailSequenceInputSchema,
  EmailSequenceOutputSchema,
} from "@neon/core-agents/src/schemas/agent-schemas";
import { AgentPayload } from "@neon/core-agents";

// Mock OpenAI
jest.mock("openai", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  name: "Test Email Sequence",
                  emails: [
                    {
                      step: 1,
                      subject: "Welcome to our platform",
                      content: "Thank you for joining us!",
                      delayDays: 0,
                      purpose: "Welcome",
                      keyPoints: ["Welcome message"],
                    },
                  ],
                  recommendations: ["Test regularly"],
                }),
              },
            },
          ],
          usage: { total_tokens: 300 },
        }),
      },
    },
  })),
}));

// Mock logger
jest.mock("@neon/utils", () => ({
  logger: { warn: jest.fn(), error: jest.fn(), info: jest.fn() },
}));

describe("EmailMarketingAgent", () => {
  let emailAgent: EmailMarketingAgent;

  beforeEach(() => {
    emailAgent = new EmailMarketingAgent();
    jest.clearAllMocks();
  });

  describe("Initialization", () => {
    it("should initialize correctly", () => {
      expect(emailAgent.id).toBe("email-marketing-agent");
      expect(emailAgent.name).toBe("EmailMarketingAgent");
      expect(emailAgent.type).toBe("email");
      expect(emailAgent.getCapabilities()).toContain("generate_email_sequence");
    });
  });

  describe("Input Validation", () => {
    it("should validate email sequence input", () => {
      const validInput = {
        topic: "Product Onboarding",
        audience: "New users",
        sequenceLength: 3,
        tone: "professional" as const,
      };

      const result = EmailSequenceInputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it("should reject invalid input", () => {
      const invalidInput = {
        topic: "",
        audience: "test",
        sequenceLength: 25, // Too many emails
      };

      const result = EmailSequenceInputSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });
  });

  describe("Email Generation", () => {
    const validContext = {
      topic: "Product Onboarding",
      audience: "New customers",
      sequenceLength: 3,
      tone: "friendly" as const,
      goals: ["engagement", "conversion"],
    };

    it("should generate email sequence successfully", async () => {
      const payload: AgentPayload = {
        task: "generate_email_sequence",
        context: validContext,
        priority: "medium",
      };

      const result = await emailAgent.execute(payload);

      expect(result.success).toBe(true);
      expect(result.data.sequenceId).toBeDefined();
      expect(result.data.name).toBeDefined();
      expect(Array.isArray(result.data.emails)).toBe(true);
      expect(result.data.emails.length).toBeGreaterThan(0);
    });

    it("should personalize email successfully", async () => {
      const payload: AgentPayload = {
        task: "personalize_email",
        context: {
          baseEmail: "Hello, this is a test email.",
          userTraits: { name: "John", company: "Test Corp" },
          segmentData: {
            segment: "enterprise",
            characteristics: ["large company"],
          },
        },
        priority: "medium",
      };

      const result = await emailAgent.execute(payload);

      expect(result.success).toBe(true);
      expect(result.data.personalizedSubject).toBeDefined();
      expect(result.data.personalizedContent).toBeDefined();
      expect(result.data.personalizationScore).toBeGreaterThanOrEqual(0);
    });

    it("should analyze email performance successfully", async () => {
      const payload: AgentPayload = {
        task: "analyze_performance",
        context: {
          campaignId: "test-campaign",
          sent: 1000,
          delivered: 950,
          opens: 300,
          clicks: 50,
          timeRange: "30d",
        },
        priority: "medium",
      };

      const result = await emailAgent.execute(payload);

      expect(result.success).toBe(true);
      expect(result.data.score).toBeGreaterThanOrEqual(0);
      expect(result.data.metrics).toBeDefined();
      expect(Array.isArray(result.data.insights)).toBe(true);
    });
  });

  describe("A/B Testing", () => {
    it("should create A/B test successfully", async () => {
      const payload: AgentPayload = {
        task: "create_ab_test",
        context: {
          name: "Subject Line Test",
          variants: [
            { name: "Variant A", subject: "Welcome!" },
            { name: "Variant B", subject: "Get Started Today!" },
          ],
          testMetric: "open_rate",
          sampleSize: 1000,
          duration: 7,
          audience: [{ email: "test@example.com" }],
        },
        priority: "medium",
      };

      const result = await emailAgent.execute(payload);

      expect(result.success).toBe(true);
      expect(result.data.testId).toBeDefined();
      expect(result.data.variants).toBeDefined();
      expect(result.data.variants.length).toBe(2);
    });
  });

  describe("Error Handling", () => {
    it("should handle unknown task", async () => {
      const payload: AgentPayload = {
        task: "unknown_task",
        context: {},
        priority: "medium",
      };

      const result = await emailAgent.execute(payload);
      expect(result.success).toBe(false);
      expect(result.error).toContain("Unknown task");
    });

    it("should handle AI failure gracefully", async () => {
      const mockOpenAI = jest.requireMock("openai").default;
      const mockInstance = new mockOpenAI();
      mockInstance.chat.completions.create.mockRejectedValueOnce(
        new Error("API Error"),
      );

      const payload: AgentPayload = {
        task: "generate_email_sequence",
        context: {
          topic: "Test",
          audience: "Test audience",
          sequenceLength: 1,
          tone: "professional",
        },
        priority: "medium",
      };

      const result = await emailAgent.execute(payload);

      // Should still succeed with fallback
      expect(result.success).toBe(true);
      expect(result.data.emails).toBeDefined();
    });
  });

  describe("Output Validation", () => {
    it("should produce valid output schema", async () => {
      const payload: AgentPayload = {
        task: "generate_email_sequence",
        context: {
          topic: "Product Launch",
          audience: "Customers",
          sequenceLength: 2,
          tone: "professional",
        },
        priority: "medium",
      };

      const result = await emailAgent.execute(payload);
      expect(result.success).toBe(true);

      const validation = EmailSequenceOutputSchema.safeParse(result.data);
      expect(validation.success).toBe(true);
    });
  });

  describe("Performance Tracking", () => {
    it("should track execution performance", async () => {
      const payload: AgentPayload = {
        task: "generate_email_sequence",
        context: {
          topic: "Test",
          audience: "Test audience",
          sequenceLength: 1,
          tone: "professional",
        },
        priority: "medium",
      };

      const result = await emailAgent.execute(payload);

      expect(result.success).toBe(true);
      expect(result.performance).toBeDefined();
      expect(typeof result.performance).toBe("number");
    });
  });
});
