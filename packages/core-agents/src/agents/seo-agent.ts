import { AbstractAgent } from "../base-agent";
import type { AgentResult, AgentPayload } from "../base-agent";
import OpenAI from "openai";
import { logger } from "@neon/utils";
import { withRetryTimeoutFallback } from "../utils/withRetry";
import { PrismaClient } from "@neon/data-model";

// AgentType is exported from the agent interface for consistency
// type AgentType = "SEO" | "CONTENT" | "EMAIL_MARKETING" | "SOCIAL_POSTING" | "CUSTOMER_SUPPORT" | "AD" | "OUTREACH" | "TREND" | "INSIGHT" | "DESIGN";

export interface SEOOptimizationContext {
  content: string;
  targetKeywords: string[];
  title?: string;
  description?: string;
  url?: string;
  contentType: "blog" | "page" | "product" | "article";
  focusKeyword?: string;
  businessContext?: string;
  targetAudience?: string;
}

export interface SEOAnalysisResult extends AgentResult {
  seoScore: number;
  optimizedContent: string;
  suggestions: SEOSuggestion[];
  keywords: KeywordAnalysis[];
  meta: {
    optimizedTitle: string;
    optimizedDescription: string;
    suggestedUrl: string;
    openGraphTitle?: string;
    openGraphDescription?: string;
    twitterTitle?: string;
    twitterDescription?: string;
  };
  competitorInsights?: CompetitorInsight[];
  keywordRecommendations: KeywordRecommendation[];
}

export interface SEOSuggestion {
  type:
    | "title"
    | "meta"
    | "content"
    | "keywords"
    | "structure"
    | "url"
    | "schema"
    | "technical";
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  currentValue?: string;
  suggestedValue?: string;
  impact: "low" | "medium" | "high";
  effort: "easy" | "medium" | "hard";
  priority: number; // 1-10, 10 being highest
}

export interface KeywordAnalysis {
  keyword: string;
  density: number;
  frequency: number;
  position: "title" | "meta" | "content" | "headers" | "url" | "none";
  competitiveness: "low" | "medium" | "high";
  searchVolume: "low" | "medium" | "high";
  difficulty: number; // 1-100
  opportunity: number; // 1-100
  semanticVariants: string[];
}

export interface KeywordRecommendation {
  keyword: string;
  relevanceScore: number;
  difficulty: number;
  opportunity: number;
  searchVolume: "low" | "medium" | "high";
  intent: "informational" | "navigational" | "transactional" | "commercial";
  reason: string;
  metadata?: {
    executionTime?: number;
    cost?: number;
    tokens?: number;
    model?: string;
    fallbackUsed?: boolean;
    [key: string]: any;
  };
}

export interface CompetitorInsight {
  domain: string;
  title: string;
  description: string;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
}

export interface MetaTagsInput {
  topic: string;
  content: string;
  keywords?: string[];
  businessContext?: string;
  targetAudience?: string;
  contentType?: "blog" | "page" | "product" | "article";
}

export interface MetaTagsOutput {
  title: string;
  description: string;
  slug: string;
  openGraphTitle?: string;
  openGraphDescription?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  focusKeyword?: string;
  semanticKeywords?: string[];
  metadata?: {
    executionTime?: number;
    cost?: number;
    tokens?: number;
    model?: string;
    fallbackUsed?: boolean;
    [key: string]: any;
  };
}

// Comprehensive fallback functions for when AI services fail
export function fallbackSEOOutput(context: SEOOptimizationContext): SEOAnalysisResult {
  const fallbackKeywords = generateFallbackKeywords(context.targetKeywords);
  const fallbackSuggestions = generateFallbackSuggestions(context);
  const fallbackMeta = generateFallbackMeta(context);
  const fallbackContent = generateFallbackContent(context);
  const fallbackRecommendations = generateFallbackKeywordRecommendations(context.targetKeywords[0] || "content");
  
  return {
    seoScore: calculateFallbackSEOScore(context),
    optimizedContent: fallbackContent,
    suggestions: fallbackSuggestions,
    keywords: fallbackKeywords,
    meta: fallbackMeta,
    keywordRecommendations: fallbackRecommendations,
    success: true,
    metadata: {
      fallbackMode: true,
      fallbackReason: "AI service unavailable",
      timestamp: new Date().toISOString(),
      agentId: "seo-agent",
    },
  };
}

function generateFallbackKeywords(targetKeywords: string[]): KeywordAnalysis[] {
  return targetKeywords.map((keyword, index) => ({
    keyword,
    density: Math.max(0.5, 2.0 - (index * 0.3)), // Realistic density range
    frequency: Math.max(1, 3 - index),
    position: index === 0 ? "title" : "content",
    competitiveness: index < 2 ? "medium" : "low",
    searchVolume: index < 2 ? "high" : "medium",
    difficulty: 40 + (index * 5),
    opportunity: Math.max(60, 80 - (index * 5)),
    semanticVariants: [
      `${keyword} guide`,
      `${keyword} tips`,
      `best ${keyword}`,
      `${keyword} strategy`,
    ],
  }));
}

function generateFallbackSuggestions(context: SEOOptimizationContext): SEOSuggestion[] {
  const suggestions: SEOSuggestion[] = [];
  
  if (!context.title || context.title.length < 30) {
    suggestions.push({
      type: "title",
      severity: "high",
      message: "Title optimization needed - should be 50-60 characters with target keyword",
      currentValue: context.title || "No title",
      suggestedValue: `${context.focusKeyword || context.targetKeywords[0]} | Complete Guide & Best Practices`,
      impact: "high",
      effort: "easy",
      priority: 10,
    });
  }
  
  if (!context.description || context.description.length < 120) {
    suggestions.push({
      type: "meta",
      severity: "high", 
      message: "Meta description needs optimization - should be 150-160 characters",
      currentValue: context.description || "No description",
      suggestedValue: `Comprehensive ${context.focusKeyword || context.targetKeywords[0]} guide with expert tips, proven strategies, and actionable insights for success.`,
      impact: "high",
      effort: "easy",
      priority: 9,
    });
  }
  
  if (context.content.length < 300) {
    suggestions.push({
      type: "content",
      severity: "medium",
      message: "Content length should be increased for better SEO performance",
      currentValue: `${context.content.length} words`,
      suggestedValue: "300+ words with structured headings and keyword optimization",
      impact: "medium",
      effort: "medium",
      priority: 7,
    });
  }
  
  return suggestions;
}

function generateFallbackMeta(context: SEOOptimizationContext): any {
  const primaryKeyword = context.focusKeyword || context.targetKeywords[0] || "content";
  
  return {
    optimizedTitle: `${primaryKeyword} | Complete Guide & Best Practices`,
    optimizedDescription: `Comprehensive ${primaryKeyword} guide with expert tips, proven strategies, and actionable insights for success.`,
    suggestedUrl: generateSEOFriendlyUrlFallback(context.title || primaryKeyword, context.contentType),
    openGraphTitle: `${primaryKeyword} - Expert Guide & Strategies`,
    openGraphDescription: `Discover proven ${primaryKeyword} techniques and strategies that deliver results.`,
    twitterTitle: `${primaryKeyword} Guide`,
    twitterDescription: `Expert ${primaryKeyword} tips and strategies for success.`,
  };
}

function generateFallbackContent(context: SEOOptimizationContext): string {
  const primaryKeyword = context.focusKeyword || context.targetKeywords[0] || "content";
  
  // Simple content optimization - ensure keyword appears in first paragraph
  let optimizedContent = context.content;
  
  if (!optimizedContent.toLowerCase().includes(primaryKeyword.toLowerCase())) {
    optimizedContent = `Understanding ${primaryKeyword} is essential for success. ${optimizedContent}`;
  }
  
  // Add basic SEO improvements
  if (!optimizedContent.includes("#") && !optimizedContent.includes("<h")) {
    optimizedContent = `# ${primaryKeyword} Guide\n\n${optimizedContent}`;
  }
  
  return optimizedContent;
}

function generateFallbackKeywordRecommendations(topic: string): KeywordRecommendation[] {
  const baseKeywords = [
    `${topic} guide`,
    `${topic} tips`,
    `best ${topic}`,
    `${topic} strategy`,
    `how to ${topic}`,
    `${topic} benefits`,
    `${topic} examples`,
    `${topic} tools`,
    `${topic} techniques`,
    `${topic} best practices`,
  ];

  return baseKeywords.map((keyword, index) => ({
    keyword,
    relevanceScore: 85 - index * 2,
    difficulty: 35 + index * 3,
    opportunity: 80 - index * 3,
    searchVolume: index < 3 ? "high" : index < 6 ? "medium" : "low",
    intent: index < 2 ? "informational" : index < 5 ? "commercial" : "informational",
    reason: `Relevant long-tail keyword for ${topic} with good search potential`,
  }));
}

function calculateFallbackSEOScore(context: SEOOptimizationContext): number {
  let score = 60; // Base fallback score
  
  if (context.title && context.title.length >= 30 && context.title.length <= 60) score += 10;
  if (context.description && context.description.length >= 120 && context.description.length <= 160) score += 10;
  if (context.content.length >= 300) score += 10;
  if (context.content.includes("#") || context.content.includes("<h")) score += 5;
  if (context.targetKeywords.length > 0) score += 5;
  
  return Math.min(100, score);
}

function generateSEOFriendlyUrlFallback(title: string, contentType: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
    
  const prefixMap = {
    blog: "/blog/",
    article: "/articles/",
    page: "/",
    product: "/products/",
  };
  
  return `${prefixMap[contentType as keyof typeof prefixMap] || "/"}${slug}`;
}

export class SEOAgent extends AbstractAgent {
  private openai: OpenAI;
  private prisma: PrismaClient;

  constructor() {
    super("seo-agent", "SEOAgent", "seo", [
      "optimize_keywords",
      "analyze_content",
      "generate_meta_tags",
      "analyze_competitors",
      "recommend_keywords",
      "generate_schema",
      "audit_technical_seo",
    ]);

    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Initialize Prisma client for database persistence
    this.prisma = new PrismaClient();

    if (!process.env.OPENAI_API_KEY) {
      logger.warn(
        "OPENAI_API_KEY not found. SEO Agent will run in limited mode.",
        {},
        "SEOAgent",
      );
    }
  }

  async execute(payload: AgentPayload): Promise<AgentResult> {
    return this.executeWithErrorHandling(payload, async () => {
      const { task, context } = payload;

      switch (task) {
        case "optimize_keywords":
          return await this.optimizeForSEO(context as SEOOptimizationContext);
        case "analyze_content":
          return await this.analyzeContentSEO(
            context as SEOOptimizationContext,
          );
        case "generate_meta_tags":
          return await this.generateMetaTagsAI(context as MetaTagsInput);
        case "recommend_keywords":
          return await this.recommendKeywords(
            context as { topic: string; businessContext?: string },
          );
        case "analyze_competitors":
          return await this.analyzeCompetitors(
            context as { keywords: string[]; industry?: string },
          );
        case "generate_schema":
          return await this.generateSchemaMarkup(
            context as SEOOptimizationContext,
          );
        case "audit_technical_seo":
          return await this.auditTechnicalSEO(
            context as { url: string; content: string },
          );
        default:
          throw new Error(`Unknown task: ${task}`);
      }
    });
  }

  /**
   * Generate meta tags using OpenAI with retry/timeout/fallback
   */
  async generateMetaTags(input: MetaTagsInput): Promise<MetaTagsOutput> {
    const {
      topic,
      content,
      keywords = [],
      businessContext,
      targetAudience,
      contentType = "article",
    } = input;

    if (!this.openai) {
      return this.generateMetaTagsFallback(input);
    }

    const startTime = Date.now();
    
    return await withRetryTimeoutFallback(
      async () => {
        const response = await this.openai.chat.completions.create({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: "You are an expert SEO specialist. Generate high-quality, optimized meta tags that improve search rankings and click-through rates.",
            },
            {
              role: "user",
              content: this.buildMetaTagsPrompt(
                topic,
                content,
                keywords,
                businessContext,
                targetAudience,
                contentType,
              ),
            },
          ],
          temperature: 0.7,
          max_tokens: 800,
        });

        const aiOutput = response.choices[0]?.message?.content;
        if (!aiOutput) {
          throw new Error("No response from OpenAI");
        }

        const metaOutput = this.parseMetaTagOutput(aiOutput, topic);
        
        // Add performance and cost metadata
        return {
          ...metaOutput,
          metadata: {
            ...metaOutput.metadata,
            executionTime: Date.now() - startTime,
            tokens: response.usage?.total_tokens || 0,
            model: "gpt-4",
          },
        };
      },
      async () => {
        logger.warn(
          "OpenAI meta tags generation failed after retries, using fallback",
          { topic, contentType },
          "SEOAgent",
        );
        return this.generateMetaTagsFallback(input);
      },
      { retries: 3, delay: 1500, timeoutMs: 30000 }
    );
  }

  /**
   * Recommend keywords using AI with retry/timeout/fallback
   */
  async recommendKeywords(context: {
    topic: string;
    businessContext?: string;
  }): Promise<KeywordRecommendation[]> {
    const { topic, businessContext } = context;

    if (!this.openai) {
      return this.generateKeywordRecommendationsFallback(topic);
    }

    const startTime = Date.now();

    const prompt = `
As an SEO expert, recommend 15-20 high-value keywords for the topic: "${topic}"
${businessContext ? `Business context: ${businessContext}` : ""}

For each keyword, consider:
- Search volume potential
- Competition level  
- Commercial intent
- Relevance to topic
- Long-tail opportunities

Format as JSON array with structure:
{
  "keyword": "example keyword",
  "relevanceScore": 85,
  "difficulty": 45,
  "opportunity": 78,
  "searchVolume": "medium",
  "intent": "commercial",
  "reason": "High commercial intent with moderate competition"
}

Focus on a mix of head terms and long-tail keywords. Include variations and semantic keywords.
`;

    return await withRetryTimeoutFallback(
      async () => {
        const response = await this.openai.chat.completions.create({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: "You are an expert SEO keyword researcher. Generate high-value keyword recommendations with accurate search intent classification.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.6,
          max_tokens: 1500,
        });

        const aiOutput = response.choices[0]?.message?.content;
        if (!aiOutput) {
          throw new Error("No keyword recommendations from OpenAI");
        }

        const recommendations = this.parseKeywordRecommendations(aiOutput, topic);
        
        // Add performance metadata to each recommendation
        return recommendations.map(rec => ({
          ...rec,
          metadata: {
            executionTime: Date.now() - startTime,
            tokens: response.usage?.total_tokens || 0,
            model: "gpt-4",
          },
        }));
      },
      async () => {
        logger.warn(
          "OpenAI keyword recommendations failed after retries, using fallback",
          { topic, businessContext },
          "SEOAgent",
        );
        const fallbackRecommendations = this.generateKeywordRecommendationsFallback(topic);
        // Add consistent metadata structure for fallback
        return fallbackRecommendations.map(rec => ({
          ...rec,
          metadata: {
            executionTime: Date.now() - startTime,
            tokens: 0,
            model: "fallback",
            fallbackUsed: true,
          },
        }));
      },
      { retries: 3, delay: 1500, timeoutMs: 30000 }
    );
  }

  /**
   * Analyze content for SEO optimization with comprehensive tracking
   */
  async analyzeContentSEO(
    context: SEOOptimizationContext,
  ): Promise<SEOAnalysisResult> {
    const startTime = Date.now();
    const fallbacksUsed: string[] = [];
    let totalCost = 0;
    let totalTokens = 0;

    try {
      // Perform keyword analysis (local computation, no API calls)
      const keywords = await this.analyzeKeywords(
        context.content,
        context.targetKeywords,
      );

      // Generate SEO suggestions (local computation)
      const suggestions = await this.generateSEOSuggestions(context, keywords);

      // Optimize content using AI (with fallback)
      let optimizedContent: string;
      try {
        optimizedContent = await this.optimizeContentWithAI(context);
      } catch (error) {
        logger.warn("Content optimization failed, using fallback", { error });
        optimizedContent = this.optimizeContent(context);
        fallbacksUsed.push("content_optimization");
      }

      // Optimize metadata (local computation with some AI calls)
      const meta = await this.optimizeMetadata(context);

      // Get keyword recommendations (with fallback)
      let keywordRecommendations: KeywordRecommendation[];
      try {
        keywordRecommendations = await this.recommendKeywords({
          topic: context.focusKeyword || context.targetKeywords[0] || "content",
          ...(context.businessContext && {
            businessContext: context.businessContext,
          }),
        });
        
        // Extract cost/token info if available
        if (keywordRecommendations[0]?.metadata) {
          totalCost += keywordRecommendations[0].metadata.cost || 0;
          totalTokens += keywordRecommendations[0].metadata.tokens || 0;
        }
      } catch (error) {
        logger.warn("Keyword recommendations failed, using fallback", { error });
        keywordRecommendations = this.generateKeywordRecommendationsFallback(
          context.focusKeyword || context.targetKeywords[0] || "content"
        );
        fallbacksUsed.push("keyword_recommendations");
      }

      // Calculate SEO score
      const seoScore = this.calculateSEOScore(context, keywords, suggestions);

      const executionTime = Date.now() - startTime;

      return {
        seoScore,
        optimizedContent,
        suggestions,
        keywords,
        meta,
        keywordRecommendations,
        success: true,
        metadata: {
          executionTime,
          totalCost,
          totalTokens,
          fallbacksUsed,
          agentId: "seo-agent",
          timestamp: new Date().toISOString(),
          performanceMetrics: {
            keywordAnalysisTime: executionTime * 0.1, // Estimated
            contentOptimizationTime: executionTime * 0.4,
            metadataOptimizationTime: executionTime * 0.2,
            recommendationTime: executionTime * 0.3,
          },
        },
      };
    } catch (error) {
      logger.error("SEO content analysis failed", { error }, "SEOAgent");
      
      // Return fallback analysis
      return fallbackSEOOutput(context);
    }
  }

  /**
   * Complete SEO optimization workflow
   */
  private async optimizeForSEO(
    context: SEOOptimizationContext,
  ): Promise<SEOAnalysisResult> {
    // Validate input
    if (
      !context.content ||
      !context.targetKeywords ||
      context.targetKeywords.length === 0
    ) {
      throw new Error(
        "Missing required context: content and targetKeywords are required",
      );
    }

    return this.analyzeContentSEO(context);
  }

  /**
   * Generate enhanced meta tags using AI
   */
  private async generateMetaTagsAI(
    input: MetaTagsInput,
  ): Promise<MetaTagsOutput> {
    return this.generateMetaTags(input);
  }

  /**
   * Build prompt for meta tags generation
   */
  private buildMetaTagsPrompt(
    topic: string,
    content: string,
    keywords: string[],
    businessContext?: string,
    targetAudience?: string,
    contentType?: string,
  ): string {
    return `
Generate SEO-optimized meta tags for the following content:

Topic: ${topic}
Content Type: ${contentType}
Target Keywords: ${keywords.join(", ")}
${businessContext ? `Business Context: ${businessContext}` : ""}
${targetAudience ? `Target Audience: ${targetAudience}` : ""}

Content Preview: ${content.substring(0, 500)}...

Please generate:
1. Title (50-60 characters, include primary keyword)
2. Meta Description (150-160 characters, compelling and keyword-rich)
3. URL Slug (SEO-friendly, lowercase, hyphens)
4. Open Graph Title (can be slightly different from meta title)
5. Open Graph Description (can be more engaging than meta description)
6. Twitter Title
7. Twitter Description
8. Focus Keyword (primary keyword to target)
9. Semantic Keywords (related terms to include)

Format as JSON:
{
  "title": "...",
  "description": "...",
  "slug": "...",
  "openGraphTitle": "...",
  "openGraphDescription": "...",
  "twitterTitle": "...",
  "twitterDescription": "...",
  "focusKeyword": "...",
  "semanticKeywords": ["...", "..."]
}
`;
  }

  /**
   * Parse OpenAI output for meta tags
   */
  private parseMetaTagOutput(
    raw: string,
    fallbackTopic: string,
  ): MetaTagsOutput {
    try {
      // Try to extract JSON from the response
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          title: parsed.title || `${fallbackTopic} | Professional Guide`,
          description:
            parsed.description ||
            `Comprehensive guide to ${fallbackTopic}. Expert insights and actionable strategies.`,
          slug:
            parsed.slug ||
            this.generateSEOFriendlyUrl(fallbackTopic, "article"),
          openGraphTitle: parsed.openGraphTitle,
          openGraphDescription: parsed.openGraphDescription,
          twitterTitle: parsed.twitterTitle,
          twitterDescription: parsed.twitterDescription,
          focusKeyword: parsed.focusKeyword,
          semanticKeywords: parsed.semanticKeywords || [],
        };
      }

      // Fallback parsing using regex
      return this.parseMetaTagsWithRegex(raw, fallbackTopic);
    } catch (error) {
      logger.error(
        "Failed to parse meta tag output",
        { error, raw },
        "SEOAgent",
      );
      return this.generateMetaTagsFallback({
        topic: fallbackTopic,
        content: "",
      });
    }
  }

  /**
   * Parse meta tags using regex when JSON parsing fails
   */
  private parseMetaTagsWithRegex(
    raw: string,
    fallbackTopic: string,
  ): MetaTagsOutput {
    const titleMatch = raw.match(/title[:"']\s*["']?([^"'\n]+)["']?/i);
    const descMatch = raw.match(/description[:"']\s*["']?([^"'\n]+)["']?/i);
    const slugMatch = raw.match(/slug[:"']\s*["']?([^"'\n]+)["']?/i);

    return {
      title: titleMatch?.[1]?.trim() || `${fallbackTopic} | Expert Guide`,
      description:
        descMatch?.[1]?.trim() ||
        `Discover everything about ${fallbackTopic}. Professional insights and proven strategies.`,
      slug:
        slugMatch?.[1]?.trim() ||
        this.generateSEOFriendlyUrl(fallbackTopic, "article"),
    };
  }

  /**
   * Fallback meta tags generation when AI is not available
   */
  private generateMetaTagsFallback(input: MetaTagsInput): MetaTagsOutput {
    const { topic, keywords = [], contentType = "article" } = input;
    const primaryKeyword = keywords[0] || topic;

    return {
      title: `${primaryKeyword} | Complete Guide & Best Practices`,
      description: `Discover comprehensive ${primaryKeyword} strategies. Expert tips, proven methods, and actionable insights for success.`,
      slug: this.generateSEOFriendlyUrl(topic, contentType),
      focusKeyword: primaryKeyword,
      semanticKeywords: keywords.slice(1, 4),
    };
  }

  /**
   * Parse keyword recommendations from AI output
   */
  private parseKeywordRecommendations(
    raw: string,
    fallbackTopic: string,
  ): KeywordRecommendation[] {
    try {
      const jsonMatch = raw.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed.map((item: any) => ({
          keyword: item.keyword || `${fallbackTopic} tips`,
          relevanceScore: item.relevanceScore || 70,
          difficulty: item.difficulty || 50,
          opportunity: item.opportunity || 60,
          searchVolume: item.searchVolume || "medium",
          intent: item.intent || "informational",
          reason: item.reason || "Relevant to main topic",
        }));
      }
    } catch (error) {
      logger.error(
        "Failed to parse keyword recommendations",
        { error, raw },
        "SEOAgent",
      );
    }

    return this.generateKeywordRecommendationsFallback(fallbackTopic);
  }

  /**
   * Fallback keyword recommendations
   */
  private generateKeywordRecommendationsFallback(
    topic: string,
  ): KeywordRecommendation[] {
    const baseKeywords = [
      `${topic} guide`,
      `${topic} tips`,
      `best ${topic}`,
      `${topic} strategy`,
      `how to ${topic}`,
      `${topic} benefits`,
      `${topic} examples`,
      `${topic} tools`,
      `${topic} techniques`,
      `${topic} best practices`,
    ];

    return baseKeywords.map((keyword, index) => ({
      keyword,
      relevanceScore: 85 - index * 2,
      difficulty: 40 + index * 3,
      opportunity: 75 - index * 2,
      searchVolume: index < 3 ? "high" : index < 6 ? "medium" : "low",
      intent:
        index < 2
          ? "informational"
          : index < 5
            ? "commercial"
            : "informational",
      reason: `Relevant long-tail keyword for ${topic}`,
    }));
  }

  /**
   * Optimize content using AI with retry/timeout/fallback
   */
  private async optimizeContentWithAI(
    context: SEOOptimizationContext,
  ): Promise<string> {
    if (!this.openai) {
      return this.optimizeContent(context);
    }

    const prompt = `
As an SEO expert, optimize this content for search engines while maintaining readability:

Target Keywords: ${context.targetKeywords.join(", ")}
Focus Keyword: ${context.focusKeyword || context.targetKeywords[0]}
Content Type: ${context.contentType}

Original Content:
${context.content}

Optimize for:
- Natural keyword placement (1-2% density)
- Semantic keywords and variations
- Clear headings and structure
- Internal linking opportunities
- User engagement and readability
- E-A-T (Expertise, Authoritativeness, Trustworthiness)

Return the optimized content maintaining the original structure and tone.
`;

    return await withRetryTimeoutFallback(
      async () => {
        const response = await this.openai.chat.completions.create({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: "You are an expert SEO content optimizer. Enhance content for search engines while preserving readability and user engagement.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.3,
          max_tokens: 2000,
        });

        const optimizedContent = response.choices[0]?.message?.content || this.optimizeContent(context);
        
        return optimizedContent;
      },
      async () => {
        logger.warn(
          "AI content optimization failed after retries, using fallback",
          { 
            contentType: context.contentType,
            keywordCount: context.targetKeywords.length,
            contentLength: context.content.length 
          },
          "SEOAgent",
        );
        return this.optimizeContent(context);
      },
      { retries: 3, delay: 1500, timeoutMs: 30000 }
    );
  }

  /**
   * Generate competitors analysis
   */
  private async analyzeCompetitors(context: {
    keywords: string[];
    industry?: string;
  }): Promise<CompetitorInsight[]> {
    // This would integrate with tools like SEMrush, Ahrefs, or SimilarWeb in production
    // For now, return mock data structure
    return [
      {
        domain: "competitor1.com",
        title: `Leading Platform for ${context.keywords[0]}`,
        description: "Comprehensive solution for modern businesses",
        strengths: [
          "Strong brand authority",
          "High-quality content",
          "Good technical SEO",
        ],
        weaknesses: ["Limited social media presence", "Slow page speed"],
        opportunities: ["Target long-tail keywords", "Improve local SEO"],
      },
    ];
  }

  /**
   * Generate schema markup
   */
  private async generateSchemaMarkup(
    context: SEOOptimizationContext,
  ): Promise<Record<string, any>> {
    const schemaTypes = {
      blog: "BlogPosting",
      article: "Article",
      product: "Product",
      page: "WebPage",
    };

    return {
      "@context": "https://schema.org",
      "@type": schemaTypes[context.contentType] || "Article",
      headline: context.title || "Article Title",
      description: context.description || "Article description",
      keywords: context.targetKeywords.join(", "),
      author: {
        "@type": "Organization",
        name: "NeonHub",
      },
      publisher: {
        "@type": "Organization",
        name: "NeonHub",
      },
      datePublished: new Date().toISOString(),
      dateModified: new Date().toISOString(),
    };
  }

  /**
   * Audit technical SEO
   */
  private async auditTechnicalSEO(context: {
    url: string;
    content: string;
  }): Promise<SEOSuggestion[]> {
    const suggestions: SEOSuggestion[] = [];
    const { content } = context;

    // Check content structure
    if (!content.includes("<h1") && !content.includes("#")) {
      suggestions.push({
        type: "structure",
        severity: "high",
        message:
          "Missing H1 heading. Every page should have exactly one H1 tag.",
        impact: "high",
        effort: "easy",
        priority: 9,
        suggestedValue: "Add a descriptive H1 heading with your target keyword",
      });
    }

    // Check for images without alt text
    const imgRegex = /<img[^>]+>/gi;
    const images = content.match(imgRegex) || [];
    const imagesWithoutAlt = images.filter((img) => !img.includes("alt="));

    if (imagesWithoutAlt.length > 0) {
      suggestions.push({
        type: "technical",
        severity: "medium",
        message: `${imagesWithoutAlt.length} image(s) missing alt text for accessibility and SEO.`,
        impact: "medium",
        effort: "easy",
        priority: 7,
        suggestedValue: "Add descriptive alt text to all images",
      });
    }

    return suggestions;
  }

  private async analyzeKeywords(
    content: string,
    targetKeywords: string[],
  ): Promise<KeywordAnalysis[]> {
    const contentLower = content.toLowerCase();
    const wordCount = content.split(/\s+/).length;

    return targetKeywords.map((keyword) => {
      const keywordLower = keyword.toLowerCase();
      const frequency = (
        contentLower.match(new RegExp(keywordLower, "g")) || []
      ).length;
      const density = (frequency / wordCount) * 100;

      // Enhanced position analysis
      let position: KeywordAnalysis["position"] = "none";
      if (contentLower.includes(keywordLower)) {
        if (contentLower.indexOf(keywordLower) < 100) position = "title";
        else if (
          content.includes("#") &&
          content
            .split("#")
            .some((section) => section.toLowerCase().includes(keywordLower))
        )
          position = "headers";
        else position = "content";
      }

      return {
        keyword,
        density,
        frequency,
        position,
        competitiveness: this.estimateCompetitiveness(keyword),
        searchVolume: this.estimateSearchVolume(keyword),
        difficulty: this.calculateKeywordDifficulty(keyword),
        opportunity: this.calculateKeywordOpportunity(keyword, density),
        semanticVariants: this.generateSemanticVariants(keyword),
      };
    });
  }

  private calculateKeywordDifficulty(keyword: string): number {
    // Enhanced difficulty calculation
    const words = keyword.split(" ");
    let difficulty = 50; // Base difficulty

    // Single word keywords are harder
    if (words.length === 1) difficulty += 30;
    else if (words.length === 2) difficulty += 10;
    else difficulty -= 10; // Long-tail keywords are easier

    // Common competitive terms
    const competitiveTerms = ["best", "top", "review", "buy", "cheap", "free"];
    if (competitiveTerms.some((term) => keyword.toLowerCase().includes(term))) {
      difficulty += 20;
    }

    return Math.min(100, Math.max(10, difficulty));
  }

  private calculateKeywordOpportunity(
    keyword: string,
    currentDensity: number,
  ): number {
    let opportunity = 50; // Base opportunity

    // Low current density means high opportunity
    if (currentDensity < 0.5) opportunity += 30;
    else if (currentDensity > 2.5) opportunity -= 20;

    // Long-tail keywords often have better opportunities
    const words = keyword.split(" ");
    if (words.length >= 3) opportunity += 20;

    return Math.min(100, Math.max(10, opportunity));
  }

  private generateSemanticVariants(keyword: string): string[] {
    // Simple semantic variant generation - in production, use NLP libraries
    const words = keyword.split(" ");
    const variants: string[] = [];

    // Add plurals
    words.forEach((word) => {
      if (!word.endsWith("s")) variants.push(`${word}s`);
    });

    // Add common variations
    variants.push(`${keyword} guide`);
    variants.push(`${keyword} tips`);
    variants.push(`best ${keyword}`);

    return variants.slice(0, 5);
  }

  private estimateCompetitiveness(keyword: string): "low" | "medium" | "high" {
    const words = keyword.split(" ");
    if (words.length >= 3) return "low"; // Long-tail keywords
    if (words.length === 2) return "medium";
    return "high"; // Single-word keywords
  }

  private estimateSearchVolume(keyword: string): "low" | "medium" | "high" {
    const highVolumeWords = [
      "marketing",
      "business",
      "online",
      "digital",
      "strategy",
      "tips",
      "guide",
      "best",
    ];
    const hasHighVolumeWord = highVolumeWords.some((word) =>
      keyword.toLowerCase().includes(word),
    );

    if (hasHighVolumeWord) return "high";
    if (keyword.split(" ").length <= 2) return "medium";
    return "low";
  }

  private async generateSEOSuggestions(
    context: SEOOptimizationContext,
    keywords: KeywordAnalysis[],
  ): Promise<SEOSuggestion[]> {
    const suggestions: SEOSuggestion[] = [];
    const { content, title, description, focusKeyword } = context;

    // Enhanced title optimization
    if (!title || title.length < 30) {
      suggestions.push({
        type: "title",
        severity: "high",
        message: "Title is too short or missing. Aim for 50-60 characters.",
        currentValue: title || "No title",
        suggestedValue: await this.generateOptimalTitle(context, keywords),
        impact: "high",
        effort: "easy",
        priority: 10,
      });
    }

    // Enhanced meta description optimization
    if (!description || description.length < 120) {
      suggestions.push({
        type: "meta",
        severity: "high",
        message:
          "Meta description is too short or missing. Aim for 150-160 characters.",
        currentValue: description || "No description",
        suggestedValue: await this.generateOptimalDescription(
          context,
          keywords,
        ),
        impact: "high",
        effort: "easy",
        priority: 9,
      });
    }

    // Enhanced keyword density analysis
    keywords.forEach((keyword) => {
      if (keyword.density < 0.5) {
        suggestions.push({
          type: "keywords",
          severity: "medium",
          message: `Keyword "${keyword.keyword}" density is too low (${keyword.density.toFixed(1)}%). Consider including it more naturally.`,
          currentValue: `${keyword.density.toFixed(1)}%`,
          suggestedValue: "1-2%",
          impact: "medium",
          effort: "medium",
          priority: 6,
        });
      } else if (keyword.density > 3) {
        suggestions.push({
          type: "keywords",
          severity: "high",
          message: `Keyword "${keyword.keyword}" density is too high (${keyword.density.toFixed(1)}%). This may be seen as keyword stuffing.`,
          currentValue: `${keyword.density.toFixed(1)}%`,
          suggestedValue: "1-2%",
          impact: "medium",
          effort: "easy",
          priority: 7,
        });
      }
    });

    // Content structure analysis
    if (!content.includes("#") && !content.includes("<h")) {
      suggestions.push({
        type: "structure",
        severity: "medium",
        message:
          "Content lacks headers. Use H1, H2, H3 tags to improve structure and SEO.",
        suggestedValue: "Add meaningful headers with target keywords",
        impact: "medium",
        effort: "easy",
        priority: 8,
      });
    }

    // Focus keyword in title check
    if (
      focusKeyword &&
      title &&
      !title.toLowerCase().includes(focusKeyword.toLowerCase())
    ) {
      suggestions.push({
        type: "title",
        severity: "high",
        message: `Focus keyword "${focusKeyword}" not found in title.`,
        currentValue: title,
        suggestedValue: `Include "${focusKeyword}" in title`,
        impact: "high",
        effort: "easy",
        priority: 9,
      });
    }

    // Content length analysis
    const wordCount = content.split(/\s+/).length;
    if (wordCount < 300) {
      suggestions.push({
        type: "content",
        severity: "medium",
        message: `Content is too short (${wordCount} words). Aim for at least 300 words for better SEO.`,
        currentValue: `${wordCount} words`,
        suggestedValue: "300+ words",
        impact: "medium",
        effort: "medium",
        priority: 5,
      });
    }

    return suggestions.sort((a, b) => b.priority - a.priority);
  }

  private optimizeContent(context: SEOOptimizationContext): string {
    let optimizedContent = context.content;
    const { targetKeywords, focusKeyword } = context;

    // Ensure focus keyword appears in first paragraph
    if (
      focusKeyword &&
      !optimizedContent
        .substring(0, 200)
        .toLowerCase()
        .includes(focusKeyword.toLowerCase())
    ) {
      const firstParagraph = optimizedContent.split("\n\n")[0];
      if (firstParagraph) {
        const optimizedFirstParagraph = `${firstParagraph} Understanding ${focusKeyword} is crucial for success.`;
        optimizedContent = optimizedContent.replace(
          firstParagraph,
          optimizedFirstParagraph,
        );
      }
    }

    // Add internal linking suggestions
    if (!optimizedContent.includes("[") && !optimizedContent.includes("(")) {
      optimizedContent += `\n\n*Internal linking opportunities: Consider linking to related content about ${targetKeywords
        .slice(0, 2)
        .join(", ")}.*`;
    }

    return optimizedContent;
  }

  private async optimizeMetadata(context: SEOOptimizationContext) {
    const keywords = await this.analyzeKeywords(
      context.content,
      context.targetKeywords,
    );

    return {
      optimizedTitle: await this.generateOptimalTitle(context, keywords),
      optimizedDescription: await this.generateOptimalDescription(
        context,
        keywords,
      ),
      suggestedUrl: this.generateSEOFriendlyUrl(
        context.title ||
          context.focusKeyword ||
          context.targetKeywords[0] ||
          "content",
        context.contentType,
      ),
    };
  }

  private async generateOptimalTitle(
    context: SEOOptimizationContext,
    keywords: KeywordAnalysis[],
  ): Promise<string> {
    const { title, focusKeyword, contentType } = context;
    const highPriorityKeyword = focusKeyword || keywords[0]?.keyword || "Guide";

    if (title && title.length >= 30 && title.length <= 60) {
      return title; // Already optimal
    }

    const titleTemplates = {
      blog: `${highPriorityKeyword}: Complete Guide & Best Practices`,
      page: `${highPriorityKeyword} Solutions | Professional Services`,
      product: `Best ${highPriorityKeyword} | Premium Quality & Value`,
      article: `${highPriorityKeyword}: Expert Tips & Strategies`,
    };

    const generatedTitle =
      titleTemplates[contentType] || titleTemplates.article;

    // Ensure it's within optimal length
    return generatedTitle.length <= 60
      ? generatedTitle
      : `${generatedTitle.substring(0, 57)}...`;
  }

  private async generateOptimalDescription(
    context: SEOOptimizationContext,
    keywords: KeywordAnalysis[],
  ): Promise<string> {
    const { description, focusKeyword, targetKeywords } = context;
    const primaryKeyword = focusKeyword || keywords[0]?.keyword || "solution";
    const secondaryKeywords = targetKeywords.slice(0, 2).join(", ");

    if (description && description.length >= 120 && description.length <= 160) {
      return description; // Already optimal
    }

    const metaDescription =
      `Discover comprehensive ${primaryKeyword} strategies and tips. ` +
      `Learn about ${secondaryKeywords} with our expert guidance. ` +
      `Get actionable insights and proven results today.`;

    // Ensure it's within optimal length
    return metaDescription.length <= 160
      ? metaDescription
      : `${metaDescription.substring(0, 157)}...`;
  }

  private generateSEOFriendlyUrl(title: string, contentType: string): string {
    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/-+/g, "-") // Replace multiple hyphens with single
      .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens

    const typePrefix = {
      blog: "blog",
      page: "",
      product: "products",
      article: "articles",
    };

    const prefix = typePrefix[contentType as keyof typeof typePrefix] || "";
    return prefix ? `/${prefix}/${baseSlug}` : `/${baseSlug}`;
  }

  private calculateSEOScore(
    context: SEOOptimizationContext,
    keywords: KeywordAnalysis[],
    suggestions: SEOSuggestion[],
  ): number {
    let score = 100;
    const { content, title, description } = context;

    // Deduct points for issues based on severity and priority
    suggestions.forEach((suggestion) => {
      const severityMultiplier = {
        critical: 25,
        high: 15,
        medium: 10,
        low: 5,
      };

      score -=
        severityMultiplier[suggestion.severity] * (suggestion.priority / 10);
    });

    // Bonus points for good practices
    if (title && title.length >= 30 && title.length <= 60) score += 10;
    if (description && description.length >= 120 && description.length <= 160)
      score += 10;
    if (content.includes("#") || content.includes("<h")) score += 5; // Has headers
    if (content.split(/\s+/).length >= 300) score += 10; // Good length

    // Enhanced keyword optimization bonus
    const wellOptimizedKeywords = keywords.filter(
      (k) => k.density >= 0.5 && k.density <= 2.5,
    );
    score += wellOptimizedKeywords.length * 5;

    // Bonus for keyword positioning
    const keywordsInTitle = keywords.filter((k) => k.position === "title");
    score += keywordsInTitle.length * 8;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  // Database persistence methods for TASK 005
  
  /**
   * Save SEO analysis results to database
   */
  async saveSEOAnalysis(
    analysis: SEOAnalysisResult,
    context: SEOOptimizationContext & { url?: string },
    campaignId?: string,
  ): Promise<{ seoEntryId: string; analysisId: string; keywordIds: string[] }> {
    try {
      // 1. Save SEO Entry
      const seoEntry = await this.prisma.sEOEntry.create({
        data: {
          campaignId: campaignId || null,
          url: context.url || "unknown",
          metadata: {
            title: context.title,
            description: context.description,
            contentType: context.contentType,
            targetKeywords: context.targetKeywords,
            focusKeyword: context.focusKeyword,
            meta: analysis.meta,
            executionTime: analysis.metadata?.executionTime || 0,
            agentVersion: "1.0",
          } as any,
        },
      });

      // 2. Save SEO Analysis
      const seoAnalysis = await this.prisma.sEOAnalysis.create({
        data: {
          campaignId: campaignId || null,
          seoEntryId: seoEntry.id,
          pageUrl: context.url || "unknown",
          score: analysis.seoScore,
          issues: analysis.suggestions as any,
          keywords: analysis.keywords as any,
          suggestions: analysis.suggestions as any,
          metadata: {
            executionTime: analysis.metadata?.executionTime || 0,
            totalCost: analysis.metadata?.totalCost || 0,
            totalTokens: analysis.metadata?.totalTokens || 0,
            fallbacksUsed: analysis.metadata?.fallbacksUsed || [],
            agentId: analysis.metadata?.agentId || "seo-agent",
            timestamp: analysis.metadata?.timestamp || new Date().toISOString(),
          } as any,
          agentType: "SEO",
          version: "1.0",
        },
      });

      // 3. Save Keyword Suggestions
      const keywordPromises = analysis.keywordRecommendations.map((keyword) =>
        this.prisma.keywordSuggestion.create({
          data: {
            campaignId: campaignId || null,
            keyword: keyword.keyword,
            relevance: keyword.relevanceScore,
            difficulty: keyword.difficulty,
            opportunity: keyword.opportunity,
            searchVolume: keyword.searchVolume,
            intent: keyword.intent,
            reason: keyword.reason,
            source: "ai_generated",
          },
        })
      );

      const savedKeywords = await Promise.all(keywordPromises);

      logger.info(
        "SEO analysis saved to database successfully",
        {
          seoEntryId: seoEntry.id,
          analysisId: seoAnalysis.id,
          keywordCount: savedKeywords.length,
          campaignId,
        },
        "SEOAgent",
      );

      return {
        seoEntryId: seoEntry.id,
        analysisId: seoAnalysis.id,
        keywordIds: savedKeywords.map((k) => k.id),
      };
    } catch (error) {
      logger.error(
        "Failed to save SEO analysis to database",
        { error, campaignId, url: context.url },
        "SEOAgent",
      );
      throw error;
    }
  }

  /**
   * Retrieve historical SEO analyses for a campaign
   */
  async getHistoricalSEOAnalyses(
    campaignId: string,
    limit: number = 10,
  ): Promise<Array<{
    id: string;
    pageUrl: string;
    score: number;
    createdAt: Date;
    metadata: any;
    seoEntry: {
      url: string;
      metadata: any;
    };
  }>> {
    try {
      const analyses = await this.prisma.sEOAnalysis.findMany({
        where: { campaignId },
        include: {
          seoEntry: {
            select: {
              url: true,
              metadata: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      });

      return analyses as any;
    } catch (error) {
      logger.error(
        "Failed to retrieve historical SEO analyses",
        { error, campaignId },
        "SEOAgent",
      );
      return [];
    }
  }

  /**
   * Get keyword suggestions for a campaign
   */
  async getKeywordSuggestions(
    campaignId: string,
    limit: number = 20,
  ): Promise<Array<{
    id: string;
    keyword: string;
    relevance: number | null;
    difficulty: number | null;
    opportunity: number | null;
    searchVolume: string | null;
    intent: string | null;
    reason: string | null;
    createdAt: Date;
  }>> {
    try {
      const keywords = await this.prisma.keywordSuggestion.findMany({
        where: { campaignId },
        orderBy: [
          { relevance: "desc" },
          { createdAt: "desc" },
        ],
        take: limit,
      });

      return keywords;
    } catch (error) {
      logger.error(
        "Failed to retrieve keyword suggestions",
        { error, campaignId },
        "SEOAgent",
      );
      return [];
    }
  }

  /**
   * Bulk analyze multiple URLs for a campaign
   */
  async bulkAnalyzeURLs(
    urls: string[],
    campaignId?: string,
    targetKeywords: string[] = [],
  ): Promise<Array<{ url: string; analysis: SEOAnalysisResult | null; error?: string }>> {
    const results: Array<{ url: string; analysis: SEOAnalysisResult | null; error?: string }> = [];

    for (const url of urls) {
      try {
        // For bulk analysis, we'd normally fetch content from the URL
        // For now, we'll create a mock context
        const mockContext: SEOOptimizationContext = {
          content: `Content analysis for ${url}. This would normally be fetched from the URL.`,
          targetKeywords: targetKeywords.length > 0 ? targetKeywords : ["SEO", "optimization"],
          url,
          contentType: "page",
          focusKeyword: targetKeywords[0] || "SEO",
        };

        const analysis = await this.analyzeContentSEO(mockContext);
        
        // Save to database if campaignId provided
        if (campaignId) {
          await this.saveSEOAnalysis(analysis, { ...mockContext, url }, campaignId);
        }

        results.push({ url, analysis });
        
        // Add small delay to avoid overwhelming external services
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        logger.error(
          "Failed to analyze URL in bulk operation",
          { error, url, campaignId },
          "SEOAgent",
        );
        results.push({ 
          url, 
          analysis: null, 
          error: error instanceof Error ? error.message : "Unknown error" 
        });
      }
    }

    logger.info(
      "Bulk URL analysis completed",
      { 
        totalUrls: urls.length,
        successful: results.filter(r => r.analysis).length,
        failed: results.filter(r => r.error).length,
        campaignId 
      },
      "SEOAgent",
    );

    return results;
  }

  /**
   * Get SEO performance trends for a campaign
   */
  async getSEOPerformanceTrends(
    campaignId: string,
    days: number = 30,
  ): Promise<{
    averageScore: number;
    scoreHistory: Array<{ date: string; score: number; url: string }>;
    topKeywords: Array<{ keyword: string; frequency: number; avgRelevance: number }>;
    commonIssues: Array<{ type: string; count: number; severity: string }>;
  }> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const analyses = await this.prisma.sEOAnalysis.findMany({
        where: {
          campaignId,
          createdAt: { gte: startDate },
        },
        include: {
          seoEntry: true,
        },
        orderBy: { createdAt: "asc" },
      });

      const keywords = await this.prisma.keywordSuggestion.findMany({
        where: {
          campaignId,
          createdAt: { gte: startDate },
        },
      });

      // Calculate trends
      const averageScore = analyses.length > 0 
        ? analyses.reduce((sum, a) => sum + a.score, 0) / analyses.length 
        : 0;

      const scoreHistory = analyses.map(a => ({
        date: a.createdAt.toISOString().split('T')[0],
        score: a.score,
        url: a.pageUrl,
      }));

      // Aggregate keyword data
      const keywordMap = new Map<string, { count: number; totalRelevance: number }>();
      keywords.forEach(k => {
        const existing = keywordMap.get(k.keyword) || { count: 0, totalRelevance: 0 };
        keywordMap.set(k.keyword, {
          count: existing.count + 1,
          totalRelevance: existing.totalRelevance + (k.relevance || 0),
        });
      });

      const topKeywords = Array.from(keywordMap.entries())
        .map(([keyword, data]) => ({
          keyword,
          frequency: data.count,
          avgRelevance: data.totalRelevance / data.count,
        }))
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 10);

      // Aggregate common issues
      const issueMap = new Map<string, { count: number; severity: string }>();
      analyses.forEach(a => {
        const issues = Array.isArray(a.issues) ? a.issues : [];
        issues.forEach((issue: any) => {
          const key = `${issue.type}_${issue.severity}`;
          const existing = issueMap.get(key) || { count: 0, severity: issue.severity };
          issueMap.set(key, {
            count: existing.count + 1,
            severity: issue.severity,
          });
        });
      });

      const commonIssues = Array.from(issueMap.entries())
        .map(([key, data]) => ({
          type: key.split('_')[0],
          count: data.count,
          severity: data.severity,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return {
        averageScore,
        scoreHistory,
        topKeywords,
        commonIssues,
      };
    } catch (error) {
      logger.error(
        "Failed to get SEO performance trends",
        { error, campaignId, days },
        "SEOAgent",
      );
      return {
        averageScore: 0,
        scoreHistory: [],
        topKeywords: [],
        commonIssues: [],
      };
    }
  }

  // Public methods for Phase 1 integration
  async optimizeKeywords(
    context: SEOOptimizationContext,
  ): Promise<AgentResult> {
    return this.execute({
      task: "optimize_keywords",
      context,
      priority: "medium",
    });
  }

  async analyzeContent(
    content: string,
    keywords: string[],
  ): Promise<KeywordAnalysis[]> {
    return this.analyzeKeywords(content, keywords);
  }
}

// Export as default for agent registry compatibility
export default SEOAgent;
