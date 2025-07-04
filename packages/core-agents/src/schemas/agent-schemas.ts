import { z } from "zod";

// Base agent schemas
export const AgentPrioritySchema = z.enum([
  "low",
  "medium",
  "high",
  "critical",
]);
export const AgentStatusSchema = z.enum([
  "idle",
  "running",
  "error",
  "maintenance",
]);

// Content Agent Schemas
export const ContentTypeSchema = z.enum([
  "blog",
  "social_post",
  "email",
  "caption",
  "copy",
]);
export const ToneSchema = z.enum([
  "professional",
  "casual",
  "friendly",
  "authoritative",
  "playful",
]);
export const LengthSchema = z.enum(["short", "medium", "long"]);
export const PlatformSchema = z.enum([
  "facebook",
  "instagram",
  "twitter",
  "linkedin",
  "email",
]);

export const ContentGenerationInputSchema = z.object({
  type: ContentTypeSchema,
  topic: z.string().min(1, "Topic is required").max(200, "Topic too long"),
  audience: z
    .string()
    .min(1, "Audience is required")
    .max(100, "Audience description too long"),
  tone: ToneSchema,
  keywords: z
    .array(z.string().min(1).max(50))
    .max(20, "Too many keywords")
    .optional(),
  length: LengthSchema.optional(),
  platform: PlatformSchema.optional(),
});

export const ContentGenerationOutputSchema = z.object({
  content: z.string().min(1, "Content cannot be empty"),
  suggestedTitle: z.string().optional(),
  hashtags: z.array(z.string()).optional(),
  readingTime: z.number().min(0).optional(),
  seoScore: z.number().min(0).max(100).optional(),
  tokensUsed: z.number().min(0).optional(),
  success: z.boolean(),
  performance: z.number().optional(),
  metadata: z.record(z.any()).optional(),
});

// SEO Agent Schemas
export const SEOContentTypeSchema = z.enum([
  "blog",
  "page",
  "product",
  "article",
]);
export const SEOSeveritySchema = z.enum(["low", "medium", "high", "critical"]);
export const SEOImpactSchema = z.enum(["low", "medium", "high"]);
export const SEOEffortSchema = z.enum(["easy", "medium", "hard"]);
export const KeywordPositionSchema = z.enum([
  "title",
  "meta",
  "content",
  "headers",
  "url",
  "none",
]);
export const CompetitivenessSchema = z.enum(["low", "medium", "high"]);
export const SearchVolumeSchema = z.enum(["low", "medium", "high"]);
export const KeywordIntentSchema = z.enum([
  "informational",
  "navigational",
  "transactional",
  "commercial",
]);

export const SEOOptimizationInputSchema = z.object({
  content: z
    .string()
    .min(10, "Content too short for SEO analysis")
    .max(50000, "Content too long"),
  targetKeywords: z
    .array(z.string().min(1).max(100))
    .min(1, "At least one keyword required")
    .max(20, "Too many keywords"),
  contentType: SEOContentTypeSchema,
  title: z.string().max(200).optional(),
  description: z.string().max(500).optional(),
  url: z.string().url("Invalid URL format").optional(),
  focusKeyword: z.string().max(100).optional(),
  businessContext: z.string().max(1000).optional(),
  targetAudience: z.string().max(200).optional(),
});

export const KeywordAnalysisSchema = z.object({
  keyword: z.string(),
  density: z.number().min(0).max(100),
  frequency: z.number().min(0),
  position: KeywordPositionSchema,
  competitiveness: CompetitivenessSchema,
  searchVolume: SearchVolumeSchema,
  difficulty: z.number().min(0).max(100),
  opportunity: z.number().min(0).max(100),
  semanticVariants: z.array(z.string()),
});

export const SEOSuggestionSchema = z.object({
  type: z.enum([
    "title",
    "meta",
    "content",
    "keywords",
    "structure",
    "url",
    "schema",
    "technical",
  ]),
  severity: SEOSeveritySchema,
  message: z.string().min(1, "Suggestion message required"),
  currentValue: z.string().optional(),
  suggestedValue: z.string().optional(),
  impact: SEOImpactSchema,
  effort: SEOEffortSchema,
  priority: z.number().min(1).max(10),
});

export const KeywordRecommendationSchema = z.object({
  keyword: z.string(),
  relevanceScore: z.number().min(0).max(100),
  difficulty: z.number().min(0).max(100),
  opportunity: z.number().min(0).max(100),
  searchVolume: SearchVolumeSchema,
  intent: KeywordIntentSchema,
  reason: z.string().min(1, "Reason is required"),
});

export const MetaTagsInputSchema = z.object({
  topic: z.string().min(1, "Topic is required").max(200),
  content: z.string().min(10, "Content too short").max(50000),
  keywords: z.array(z.string().min(1).max(100)).max(20).optional(),
  businessContext: z.string().max(1000).optional(),
  targetAudience: z.string().max(200).optional(),
  contentType: SEOContentTypeSchema.optional(),
});

export const MetaTagsOutputSchema = z.object({
  title: z.string().min(1).max(60, "Title too long for SEO"),
  description: z.string().min(1).max(160, "Description too long for SEO"),
  slug: z.string().min(1).max(100),
  openGraphTitle: z.string().max(95).optional(),
  openGraphDescription: z.string().max(300).optional(),
  twitterTitle: z.string().max(70).optional(),
  twitterDescription: z.string().max(200).optional(),
  focusKeyword: z.string().optional(),
  semanticKeywords: z.array(z.string()).optional(),
});

export const SEOAnalysisOutputSchema = z.object({
  seoScore: z.number().min(0).max(100),
  optimizedContent: z.string().min(1),
  suggestions: z.array(SEOSuggestionSchema),
  keywords: z.array(KeywordAnalysisSchema),
  meta: z.object({
    optimizedTitle: z.string(),
    optimizedDescription: z.string(),
    suggestedUrl: z.string(),
    openGraphTitle: z.string().optional(),
    openGraphDescription: z.string().optional(),
    twitterTitle: z.string().optional(),
    twitterDescription: z.string().optional(),
  }),
  keywordRecommendations: z.array(KeywordRecommendationSchema),
  success: z.boolean(),
  performance: z.number().optional(),
  metadata: z.record(z.any()).optional(),
});

// Email Agent Schemas
export const EmailToneSchema = z.enum([
  "professional",
  "casual",
  "friendly",
  "urgent",
]);
export const EmailTypeSchema = z.enum([
  "welcome",
  "nurture",
  "promotion",
  "retention",
  "follow_up",
  "newsletter",
  "abandoned_cart",
]);
export const TriggerTypeSchema = z.enum([
  "signup",
  "purchase",
  "abandonment",
  "manual",
  "behavior",
  "date_based",
]);
export const TestMetricSchema = z.enum([
  "open_rate",
  "click_rate",
  "conversion_rate",
]);
export const TestStatusSchema = z.enum(["running", "completed", "stopped"]);
export const CustomerTierSchema = z.enum(["basic", "premium", "enterprise"]);
export const EmailChannelSchema = z.enum([
  "whatsapp",
  "email",
  "chat",
  "phone",
  "social",
]);

export const EmailSequenceInputSchema = z.object({
  topic: z.string().min(1, "Topic is required").max(200),
  audience: z.string().min(1, "Audience is required").max(200),
  businessType: z.string().max(100).optional(),
  sequenceLength: z
    .number()
    .min(1, "At least one email required")
    .max(20, "Too many emails in sequence"),
  tone: EmailToneSchema,
  goals: z.array(z.string().min(1).max(100)).max(10).optional(),
  industry: z.string().max(100).optional(),
});

export const EmailSequenceStepSchema = z.object({
  step: z.number().min(1),
  subject: z
    .string()
    .min(1, "Subject line required")
    .max(100, "Subject line too long"),
  content: z
    .string()
    .min(10, "Email content too short")
    .max(10000, "Email content too long"),
  htmlContent: z.string().optional(),
  delayDays: z.number().min(0).max(365),
  purpose: z.string().min(1, "Purpose required").max(200),
  keyPoints: z.array(z.string().min(1).max(200)).max(10),
});

export const EmailSequenceOutputSchema = z.object({
  sequenceId: z.string().min(1),
  name: z.string().min(1).max(200),
  description: z.string().min(1).max(500),
  emails: z
    .array(EmailSequenceStepSchema)
    .min(1, "At least one email required"),
  estimatedPerformance: z.object({
    openRate: z.string().regex(/^\d+\.?\d*%$/, "Invalid percentage format"),
    clickRate: z.string().regex(/^\d+\.?\d*%$/, "Invalid percentage format"),
    conversionRate: z
      .string()
      .regex(/^\d+\.?\d*%$/, "Invalid percentage format"),
  }),
  recommendations: z.array(z.string().min(1).max(500)).max(20),
  success: z.boolean(),
  performance: z.number().optional(),
  metadata: z.record(z.any()).optional(),
});

export const EmailPersonalizationInputSchema = z.object({
  baseEmail: z
    .string()
    .min(10, "Base email too short")
    .max(10000, "Base email too long"),
  userTraits: z
    .record(z.any())
    .refine(
      (traits) => Object.keys(traits).length > 0,
      "User traits cannot be empty",
    ),
  segmentData: z
    .object({
      segment: z.string().min(1).max(100),
      characteristics: z.array(z.string().min(1).max(200)).min(1).max(20),
      preferences: z.array(z.string().min(1).max(100)).max(10).optional(),
    })
    .optional(),
  businessContext: z.string().max(1000).optional(),
});

export const PersonalizationAppliedSchema = z.object({
  type: z.string().min(1).max(50),
  field: z.string().min(1).max(50),
  originalValue: z.string().max(500),
  personalizedValue: z.string().min(1).max(500),
});

export const EmailPersonalizationOutputSchema = z.object({
  personalizedSubject: z.string().min(1).max(100),
  personalizedContent: z.string().min(10).max(10000),
  personalizedHtml: z.string().optional(),
  personalizationScore: z.number().min(0).max(100),
  appliedPersonalizations: z.array(PersonalizationAppliedSchema).max(50),
  recommendations: z.array(z.string().min(1).max(500)).max(20),
  success: z.boolean(),
  performance: z.number().optional(),
  metadata: z.record(z.any()).optional(),
});

export const EmailPerformanceInputSchema = z.object({
  campaignId: z.string().min(1, "Campaign ID required").max(100),
  sent: z.number().min(0),
  delivered: z
    .number()
    .min(0)
    .max(
      z.number().refine((val, ctx) => {
        const sent = ctx.path.includes("sent") ? 0 : val; // This is a simplified check
        return val <= sent;
      }, "Delivered cannot exceed sent"),
    ),
  opens: z.number().min(0),
  clicks: z.number().min(0),
  conversions: z.number().min(0).optional(),
  unsubscribes: z.number().min(0).optional(),
  bounces: z.number().min(0).optional(),
  complaints: z.number().min(0).optional(),
  timeRange: z
    .string()
    .regex(/^\d+[hdwmy]$/, "Invalid time range format (e.g., 30d, 7d, 24h)"),
});

export const EmailMetricsSchema = z.object({
  deliveryRate: z.number().min(0).max(100),
  openRate: z.number().min(0).max(100),
  clickRate: z.number().min(0).max(100),
  conversionRate: z.number().min(0).max(100),
  unsubscribeRate: z.number().min(0).max(100),
  bounceRate: z.number().min(0).max(100),
  engagementScore: z.number().min(0).max(100),
});

export const OptimizationSuggestionSchema = z.object({
  category: z.string().min(1).max(50),
  suggestion: z.string().min(1).max(500),
  impact: z.enum(["low", "medium", "high"]),
  effort: z.enum(["easy", "medium", "hard"]),
  priority: z.number().min(1).max(10),
});

export const EmailPerformanceOutputSchema = z.object({
  score: z.number().min(0).max(100),
  metrics: EmailMetricsSchema,
  insights: z.array(z.string().min(1).max(500)).max(20),
  recommendations: z.array(z.string().min(1).max(500)).max(20),
  benchmarks: z.object({
    industry: z.string().min(1).max(50),
    openRateBenchmark: z.number().min(0).max(100),
    clickRateBenchmark: z.number().min(0).max(100),
    performance: z.enum(["above", "below", "average"]),
  }),
  optimizationSuggestions: z.array(OptimizationSuggestionSchema).max(20),
  success: z.boolean(),
  performance: z.number().optional(),
  metadata: z.record(z.any()).optional(),
});

// A/B Test Schemas
export const ABTestVariantSchema = z.object({
  name: z.string().min(1).max(100),
  subject: z.string().max(100).optional(),
  content: z.string().max(10000).optional(),
  sendTime: z.string().optional(),
  fromName: z.string().max(100).optional(),
});

export const ABTestInputSchema = z.object({
  name: z.string().min(1, "Test name required").max(200),
  variants: z
    .array(ABTestVariantSchema)
    .min(2, "At least 2 variants required")
    .max(10, "Too many variants"),
  testMetric: TestMetricSchema,
  sampleSize: z
    .number()
    .min(100, "Sample size too small")
    .max(1000000, "Sample size too large"),
  duration: z
    .number()
    .min(1, "Duration must be at least 1 day")
    .max(30, "Duration too long"),
  audience: z
    .array(
      z.object({
        email: z.string().email("Invalid email format"),
        firstName: z.string().max(50).optional(),
        lastName: z.string().max(50).optional(),
        company: z.string().max(100).optional(),
      }),
    )
    .min(1, "Audience required"),
});

// Export all schemas as a collection
export const AgentSchemas = {
  // Base schemas
  AgentPrioritySchema,
  AgentStatusSchema,

  // Content Agent
  ContentGenerationInputSchema,
  ContentGenerationOutputSchema,
  ContentTypeSchema,
  ToneSchema,
  LengthSchema,
  PlatformSchema,

  // SEO Agent
  SEOOptimizationInputSchema,
  SEOAnalysisOutputSchema,
  KeywordAnalysisSchema,
  SEOSuggestionSchema,
  KeywordRecommendationSchema,
  MetaTagsInputSchema,
  MetaTagsOutputSchema,

  // Email Agent
  EmailSequenceInputSchema,
  EmailSequenceOutputSchema,
  EmailPersonalizationInputSchema,
  EmailPersonalizationOutputSchema,
  EmailPerformanceInputSchema,
  EmailPerformanceOutputSchema,
  ABTestInputSchema,
} as const;

// Type exports
export type ContentGenerationInput = z.infer<
  typeof ContentGenerationInputSchema
>;
export type ContentGenerationOutput = z.infer<
  typeof ContentGenerationOutputSchema
>;
export type SEOOptimizationInput = z.infer<typeof SEOOptimizationInputSchema>;
export type SEOAnalysisOutput = z.infer<typeof SEOAnalysisOutputSchema>;
export type EmailSequenceInput = z.infer<typeof EmailSequenceInputSchema>;
export type EmailSequenceOutput = z.infer<typeof EmailSequenceOutputSchema>;
export type EmailPersonalizationInput = z.infer<
  typeof EmailPersonalizationInputSchema
>;
export type EmailPersonalizationOutput = z.infer<
  typeof EmailPersonalizationOutputSchema
>;
export type EmailPerformanceInput = z.infer<typeof EmailPerformanceInputSchema>;
export type EmailPerformanceOutput = z.infer<
  typeof EmailPerformanceOutputSchema
>;
export type ABTestInput = z.infer<typeof ABTestInputSchema>;
