import { AbstractAgent } from "../base-agent";
import type { AgentResult, AgentPayload } from "../base-agent";
import { brandVoiceConfig } from "./BrandVoiceAgent/brand.config";

// Define proper interfaces instead of using 'any' types
export interface BrandVoiceGuidelines {
  tone: {
    primary: string;
    secondary: string;
    avoid: string[];
  };
  vocabulary: {
    preferred: string[];
    prohibited: string[];
    brandTerms: string[];
    industryTerms: string[];
  };
  style: {
    sentenceLength: string;
    paragraphLength: string;
    readingLevel: string;
    punctuation: string;
    formatting: Record<string, string>;
  };
  messaging: {
    tagline: string;
    mission: string;
    valueProposition: string;
    keyMessages: string[];
    uniqueSellingPropositions: string[];
  };
  targetEmotions: string[];
  adjectives: string[];
  slogans: string[];
  brandDNA: {
    personalityAsHuman: string;
    referenceBrands: string[];
    voiceSwitch: {
      b2b: string;
      b2c: string;
    };
  };
  audienceSegments: Record<string, {
    tone: string;
    vocabulary: string[];
    messagingFocus: string[];
  }>;
}

export interface BrandVoiceProfileData {
  name: string;
  description?: string;
  guidelines: Record<string, unknown>;
  keywords: string[];
  toneProfile: Record<string, unknown>;
  sampleContent?: Record<string, unknown>;
}

export interface BrandVoiceContextMetadata {
  userPersona?: string;
  behaviorTrigger?: string;
  previousInteractions?: number;
  engagementLevel?: "low" | "medium" | "high";
}

export interface BrandVoiceContext {
  action:
    | "analyze"
    | "score"
    | "suggest"
    | "create_profile"
    | "get_guidelines"
    | "analyze_audience"
    | "adapt_tone"
    | "get_tone_recommendations";
  content?: string;
  contentType?: "email" | "social" | "blog" | "ad" | "general";
  brandVoiceId?: string;
  audienceSegment?: "enterprise" | "smb" | "agencies" | "ecommerce" | "saas" | "consumer" | "investor" | "gen_z";
  targetTone?: string;
  fallbackTone?: string;
  contextMetadata?: BrandVoiceContextMetadata;
  profileData?: BrandVoiceProfileData;
}

export interface BrandVoiceAnalysis {
  toneAnalysis: Record<string, number>;
  keywordUsage: Record<string, number>;
  sentimentScore: number;
  readabilityScore: number;
  brandAlignment: number;
  segmentAlignment?: number;
  wordCount: number;
  characterCount: number;
  contentType: string;
  analysisVersion: string;
  audienceAlignment?: number;
  audienceSegment?: string;
  audienceConfig?: {
    tone: string;
    vocabulary: string[];
    messagingFocus: string[];
  };
}

export interface BrandVoiceSuggestion {
  type: "tone" | "vocabulary" | "structure" | "style";
  issue: string;
  suggestion: string;
  priority: "low" | "medium" | "high";
}

export interface BrandVoiceProfile {
  id: string;
  name: string;
  description?: string;
  guidelines: Record<string, unknown>;
  keywords: string[];
  toneProfile: Record<string, unknown>;
  sampleContent?: Record<string, unknown>;
  createdAt: string;
  version: string;
  isActive: boolean;
}

export interface ToneAdaptation {
  originalTone: string;
  adaptedTone: string;
  confidence: number;
  reasoning: string;
}

export interface ToneRecommendation {
  segment: string;
  recommendedTone: string;
  reasoning: string;
  examples: string[];
  fallbackTones: string[];
}

export interface BrandVoiceResult extends AgentResult {
  voiceScore?: number;
  toneAdaptation?: ToneAdaptation;
  suggestions?: BrandVoiceSuggestion[];
  profile?: BrandVoiceProfile;
  guidelines?: BrandVoiceGuidelines;
  analysis?: BrandVoiceAnalysis;
  toneRecommendations?: ToneRecommendation[];
}

export class BrandVoiceAgent extends AbstractAgent {
  constructor(id: string = "brand-voice-agent", name: string = "BrandVoiceAgent") {
    super(id, name, "brand_voice", [
      "tone_analysis",
      "brand_alignment",
      "audience_segmentation",
      "content_scoring",
      "tone_adaptation",
      "personalization",
    ]);
  }

  async execute(payload: AgentPayload): Promise<BrandVoiceResult> {
    const context = payload.context as BrandVoiceContext;
    const startTime = Date.now();

    try {
      let result: BrandVoiceResult;

      switch (context.action) {
        case "analyze":
          result = await this.analyzeContent(context);
          break;
        case "score":
          result = await this.scoreContent(context);
          break;
        case "suggest":
          result = await this.generateSuggestions(context);
          break;
        case "create_profile":
          result = await this.createProfile(context);
          break;
        case "get_guidelines":
          result = await this.getGuidelines(context);
          break;
        case "analyze_audience":
          result = await this.analyzeAudienceContent(context);
          break;
        case "adapt_tone":
          result = await this.adaptToneForSegment(context);
          break;
        case "get_tone_recommendations":
          result = await this.getToneRecommendations(context);
          break;
        default:
          throw new Error(`Unknown action: ${context.action}`);
      }

      const duration = Date.now() - startTime;
      result.metadata = {
        ...result.metadata,
        duration,
        timestamp: new Date().toISOString(),
      };

      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        metadata: {
          duration: Date.now() - startTime,
          timestamp: new Date().toISOString(),
        },
      };
    }
  }

  private async analyzeContent(
    context: BrandVoiceContext,
  ): Promise<BrandVoiceResult> {
    if (!context.content) {
      throw new Error("Content is required for analysis");
    }

    const analysis = await this.performContentAnalysis(
      context.content,
      context.contentType,
    );
    const voiceScore = await this.calculateVoiceScore(
      context.content,
      context.brandVoiceId,
    );
    const suggestions = await this.generateContentSuggestions(
      context.content,
      analysis,
    );

    return {
      success: true,
      voiceScore,
      suggestions,
      analysis,
      data: {
        contentAnalyzed: true,
        analysisTimestamp: new Date().toISOString(),
        contentLength: context.content.length,
        contentType: context.contentType || "general",
      },
      metadata: {
        timestamp: new Date().toISOString(),
        duration: 0,
      },
    };
  }

  private async scoreContent(
    context: BrandVoiceContext,
  ): Promise<BrandVoiceResult> {
    if (!context.content) {
      throw new Error("Content is required for scoring");
    }

    const voiceScore = await this.calculateVoiceScore(
      context.content,
      context.brandVoiceId,
    );
    const quickAnalysis = await this.performQuickAnalysis(context.content);

    return {
      success: true,
      voiceScore,
      analysis: quickAnalysis,
      data: {
        scoreCalculated: true,
        timestamp: new Date().toISOString(),
      },
      metadata: {
        timestamp: new Date().toISOString(),
        duration: 0,
      },
    };
  }

  private async generateSuggestions(
    context: BrandVoiceContext,
  ): Promise<BrandVoiceResult> {
    if (!context.content) {
      throw new Error("Content is required for suggestions");
    }

    const analysis = await this.performContentAnalysis(
      context.content,
      context.contentType,
    );
    const suggestions = await this.generateContentSuggestions(
      context.content,
      analysis,
    );

    return {
      success: true,
      suggestions,
      data: {
        suggestionsGenerated: true,
        suggestionCount: suggestions.length,
        timestamp: new Date().toISOString(),
      },
      metadata: {
        timestamp: new Date().toISOString(),
        duration: 0,
      },
    };
  }

  private async createProfile(
    context: BrandVoiceContext,
  ): Promise<BrandVoiceResult> {
    if (!context.profileData) {
      throw new Error("Profile data is required");
    }

    // In a real implementation, this would save to database
    const profile = {
      id: `brand-voice-${Date.now()}`,
      ...context.profileData,
      createdAt: new Date().toISOString(),
      version: "1.0",
      isActive: true,
    };

    return {
      success: true,
      profile,
      data: {
        profileCreated: true,
        profileId: profile.id,
        timestamp: new Date().toISOString(),
      },
      metadata: {
        timestamp: new Date().toISOString(),
        duration: 0,
      },
    };
  }

  private async getGuidelines(
    context: BrandVoiceContext,
  ): Promise<BrandVoiceResult> {
    // Use centralized brand configuration
    const guidelines = {
      tone: {
        primary: brandVoiceConfig.tone.split(", ")[0],
        secondary: brandVoiceConfig.tone.split(", ")[1] || "",
        avoid: brandVoiceConfig.contentFilters.avoidWords,
      },
      vocabulary: {
        preferred: brandVoiceConfig.vocabulary.preferred,
        prohibited: brandVoiceConfig.vocabulary.prohibited,
        brandTerms: brandVoiceConfig.vocabulary.brandTerms,
        industryTerms: brandVoiceConfig.vocabulary.industryTerms,
      },
      style: {
        sentenceLength: brandVoiceConfig.styleGuide.sentenceLength,
        paragraphLength: brandVoiceConfig.styleGuide.paragraphLength,
        readingLevel: brandVoiceConfig.styleGuide.readingLevel,
        punctuation: brandVoiceConfig.styleGuide.punctuation,
        formatting: brandVoiceConfig.styleGuide.formatting,
      },
      messaging: {
        tagline: brandVoiceConfig.tagline,
        mission: brandVoiceConfig.mission,
        valueProposition: brandVoiceConfig.messaging.valueProposition,
        keyMessages: brandVoiceConfig.messaging.keyMessages,
        uniqueSellingPropositions:
          brandVoiceConfig.messaging.uniqueSellingPropositions,
      },
      targetEmotions: brandVoiceConfig.targetEmotions,
      adjectives: brandVoiceConfig.adjectives,
      slogans: brandVoiceConfig.slogans,
      brandDNA: brandVoiceConfig.brandDNA,
      audienceSegments: brandVoiceConfig.audienceSegments,
    };

    return {
      success: true,
      guidelines,
      data: {
        guidelinesRetrieved: true,
        timestamp: new Date().toISOString(),
        configVersion: "2.0",
      },
      metadata: {
        timestamp: new Date().toISOString(),
        duration: 0,
      },
    };
  }

  private async analyzeAudienceContent(
    context: BrandVoiceContext,
  ): Promise<BrandVoiceResult> {
    if (!context.content) {
      throw new Error("Content is required for audience analysis");
    }

    if (!context.audienceSegment) {
      throw new Error("Audience segment is required for audience analysis");
    }

    // Get audience-specific guidelines
    const audienceConfig =
      brandVoiceConfig.audienceSegments[context.audienceSegment];
    if (!audienceConfig) {
      throw new Error(`Unknown audience segment: ${context.audienceSegment}`);
    }

    // Perform standard analysis
    const standardAnalysis = await this.performContentAnalysis(
      context.content,
      context.contentType,
    );

    // Add audience-specific scoring
    const audienceAlignment = this.analyzeAudienceAlignment(
      context.content,
      context.audienceSegment,
    );
    const voiceScore = await this.calculateAudienceVoiceScore(
      context.content,
      context.audienceSegment,
    );
    const audienceSpecificSuggestions =
      await this.generateAudienceSpecificSuggestions(
        context.content,
        standardAnalysis,
        context.audienceSegment,
      );

    return {
      success: true,
      voiceScore,
      suggestions: audienceSpecificSuggestions,
      analysis: {
        ...standardAnalysis,
        audienceAlignment,
        audienceSegment: context.audienceSegment,
        audienceConfig: {
          tone: audienceConfig.tone,
          vocabulary: audienceConfig.vocabulary,
          messagingFocus: audienceConfig.messagingFocus,
        },
      },
      data: {
        audienceAnalyzed: true,
        audienceSegment: context.audienceSegment,
        timestamp: new Date().toISOString(),
      },
      metadata: {
        timestamp: new Date().toISOString(),
        duration: 0,
      },
    };
  }

  private analyzeAudienceAlignment(
    content: string,
    audienceSegment: string,
  ): number {
    const audienceConfig = brandVoiceConfig.audienceSegments[audienceSegment];
    const contentLower = content.toLowerCase();

    let alignmentScore = 0;
    let totalChecks = 0;

    // Check audience-specific vocabulary
    const audienceVocab = audienceConfig.vocabulary;
    const vocabMatches = audienceVocab.filter((word) =>
      contentLower.includes(word.toLowerCase()),
    ).length;
    alignmentScore += (vocabMatches / audienceVocab.length) * 50;
    totalChecks++;

    // Check messaging focus alignment
    const messagingWords = audienceConfig.messagingFocus.flatMap((focus) =>
      focus.toLowerCase().split(" "),
    );
    const messagingMatches = messagingWords.filter((word) =>
      contentLower.includes(word),
    ).length;
    alignmentScore += (messagingMatches / messagingWords.length) * 50;
    totalChecks++;

    return alignmentScore / totalChecks;
  }

  private async calculateAudienceVoiceScore(
    content: string,
    audienceSegment: string,
  ): Promise<number> {
    const standardScore = await this.calculateVoiceScore(content);
    const audienceAlignment = this.analyzeAudienceAlignment(
      content,
      audienceSegment,
    );

    // Weight: 70% standard brand alignment, 30% audience-specific alignment
    return Math.round(standardScore * 0.7 + audienceAlignment * 0.3);
  }

  private async generateAudienceSpecificSuggestions(
    content: string,
    analysis: BrandVoiceAnalysis,
    audienceSegment: string,
  ): Promise<BrandVoiceSuggestion[]> {
    const standardSuggestions = await this.generateContentSuggestions(
      content,
      analysis,
    );
    const audienceSuggestions = [];

    const audienceConfig = brandVoiceConfig.audienceSegments[audienceSegment];
    const contentLower = content.toLowerCase();

    // Audience vocabulary suggestions
    const audienceVocabMatches = audienceConfig.vocabulary.filter((word) =>
      contentLower.includes(word.toLowerCase()),
    ).length;

    if (audienceVocabMatches === 0) {
      const topVocab = audienceConfig.vocabulary.slice(0, 3).join(", ");
      audienceSuggestions.push({
        type: "vocabulary" as const,
        issue: `Missing ${audienceSegment} audience vocabulary`,
        suggestion: `Consider using ${audienceSegment}-specific terms like: ${topVocab}`,
        priority: "medium" as const,
      });
    }

    // Tone alignment for audience
    audienceSuggestions.push({
      type: "tone" as const,
      issue: `Ensure tone matches ${audienceSegment} audience expectations`,
      suggestion: `Adopt a ${audienceConfig.tone} tone for the ${audienceSegment} segment`,
      priority: "medium" as const,
    });

    // Messaging focus suggestions
    const messagingFocusUsed = audienceConfig.messagingFocus.filter((focus) =>
      contentLower.includes(focus.toLowerCase().split(" ")[0]),
    ).length;

    if (messagingFocusUsed === 0) {
      const topFocus = audienceConfig.messagingFocus.slice(0, 2).join(", ");
      audienceSuggestions.push({
        type: "style" as const,
        issue: `Content doesn't address ${audienceSegment} priorities`,
        suggestion: `Focus on ${audienceSegment} priorities like: ${topFocus}`,
        priority: "high" as const,
      });
    }

    return [...standardSuggestions, ...audienceSuggestions];
  }

  private async performContentAnalysis(
    content: string,
    contentType?: string,
  ): Promise<BrandVoiceAnalysis> {
    // Tone analysis
    const toneAnalysis = this.analyzeTone(content);

    // Keyword analysis
    const keywordUsage = this.analyzeKeywords(content);

    // Sentiment analysis
    const sentimentScore = this.analyzeSentiment(content);

    // Readability analysis
    const readabilityScore = this.analyzeReadability(content);

    // Brand alignment
    const brandAlignment = this.analyzeBrandAlignment(content);

    return {
      toneAnalysis,
      keywordUsage,
      sentimentScore,
      readabilityScore,
      brandAlignment,
      contentType: contentType || "general",
      wordCount: content.split(/\s+/).length,
      characterCount: content.length,
      analysisVersion: "1.0",
    };
  }

  private async performQuickAnalysis(content: string): Promise<BrandVoiceAnalysis> {
    return {
      toneAnalysis: this.analyzeTone(content),
      sentimentScore: this.analyzeSentiment(content),
      brandAlignment: this.analyzeBrandAlignment(content),
      wordCount: content.split(/\s+/).length,
      characterCount: content.length,
      readabilityScore: this.analyzeReadability(content),
      keywordUsage: this.analyzeKeywords(content),
      contentType: "general",
      analysisVersion: "2.0",
    };
  }

  private analyzeTone(content: string): Record<string, number> {
    const contentLower = content.toLowerCase();

    // Simple tone detection based on keywords and patterns
    const toneIndicators = {
      professional: [
        "solution",
        "implement",
        "strategy",
        "optimize",
        "efficiency",
      ],
      friendly: ["help", "easy", "simple", "welcome", "happy"],
      urgent: ["now", "immediately", "urgent", "asap", "quickly"],
      casual: ["hey", "awesome", "cool", "great", "nice"],
      formal: ["furthermore", "therefore", "consequently", "nevertheless"],
    };

    const toneScores: Record<string, number> = {};

    for (const [tone, keywords] of Object.entries(toneIndicators)) {
      const matches = keywords.filter((keyword) =>
        contentLower.includes(keyword),
      ).length;
      toneScores[tone] = (matches / keywords.length) * 100;
    }

    return toneScores;
  }

  private analyzeKeywords(content: string): Record<string, number> {
    // Use brand configuration keywords
    const brandKeywords = brandVoiceConfig.vocabulary.brandTerms.concat(
      brandVoiceConfig.vocabulary.preferred.slice(0, 10), // Limit preferred words for analysis
      brandVoiceConfig.vocabulary.industryTerms.slice(0, 10), // Limit industry terms for analysis
    );

    const keywordCounts: Record<string, number> = {};

    brandKeywords.forEach((keyword) => {
      const regex = new RegExp(keyword, "gi");
      const matches = content.match(regex) || [];
      keywordCounts[keyword.toLowerCase()] = matches.length;
    });

    return keywordCounts;
  }

  private analyzeSentiment(content: string): number {
    // Simple sentiment analysis based on positive/negative words
    const positiveWords = [
      "good",
      "great",
      "excellent",
      "amazing",
      "fantastic",
      "wonderful",
      "perfect",
    ];
    const negativeWords = [
      "bad",
      "terrible",
      "awful",
      "horrible",
      "disappointing",
      "poor",
    ];

    const contentLower = content.toLowerCase();
    let positiveCount = 0;
    let negativeCount = 0;

    positiveWords.forEach((word) => {
      if (contentLower.includes(word)) positiveCount++;
    });

    negativeWords.forEach((word) => {
      if (contentLower.includes(word)) negativeCount++;
    });

    const totalWords = content.split(/\s+/).length;
    const sentimentScore = ((positiveCount - negativeCount) / totalWords) * 100;

    // Normalize to 0-100 scale
    return Math.max(0, Math.min(100, 50 + sentimentScore));
  }

  private analyzeReadability(content: string): number {
    // Simple readability score based on sentence and word length
    const sentences = content
      .split(/[.!?]+/)
      .filter((s) => s.trim().length > 0);
    const words = content.split(/\s+/);

    if (sentences.length === 0) return 50;

    const avgWordsPerSentence = words.length / sentences.length;
    const avgCharsPerWord = content.replace(/\s+/g, "").length / words.length;

    // Higher score for moderate complexity (easier to read)
    let readabilityScore = 100;

    if (avgWordsPerSentence > 20) readabilityScore -= 20; // Too long sentences
    if (avgWordsPerSentence < 8) readabilityScore -= 10; // Too short sentences
    if (avgCharsPerWord > 6) readabilityScore -= 15; // Too complex words

    return Math.max(0, readabilityScore);
  }

  private analyzeBrandAlignment(content: string): number {
    const contentLower = content.toLowerCase();

    // Brand voice characteristics scoring
    let alignmentScore = 0;
    let totalChecks = 0;

    // Professional tone check using brand preferred vocabulary
    const professionalWords = brandVoiceConfig.vocabulary.preferred.slice(0, 8);
    const professionalMatches = professionalWords.filter((word) =>
      contentLower.includes(word.toLowerCase()),
    ).length;
    alignmentScore += (professionalMatches / professionalWords.length) * 25;
    totalChecks++;

    // Brand adjectives check
    const brandAdjectives = brandVoiceConfig.adjectives;
    const adjectiveMatches = brandAdjectives.filter((adj) =>
      contentLower.includes(adj.toLowerCase()),
    ).length;
    alignmentScore += (adjectiveMatches / brandAdjectives.length) * 25;
    totalChecks++;

    // Customer-centric check
    const customerWords = ["you", "your", "customer", "user", "client"];
    const customerMatches = customerWords.filter((word) =>
      contentLower.includes(word),
    ).length;
    alignmentScore += Math.min(
      25,
      (customerMatches / content.split(/\s+/).length) * 100,
    );
    totalChecks++;

    // Brand terminology check using brand config
    const brandTerms = brandVoiceConfig.vocabulary.brandTerms.map((term) =>
      term.toLowerCase(),
    );
    const brandMatches = brandTerms.filter((term) =>
      contentLower.includes(term),
    ).length;
    alignmentScore += brandMatches > 0 ? 25 : 0;
    totalChecks++;

    // Avoid prohibited words check
    const prohibitedWords = brandVoiceConfig.vocabulary.prohibited.concat(
      brandVoiceConfig.contentFilters.avoidWords,
    );
    const prohibitedMatches = prohibitedWords.filter((word) =>
      contentLower.includes(word.toLowerCase()),
    ).length;
    if (prohibitedMatches > 0) {
      alignmentScore -= Math.min(50, prohibitedMatches * 10); // Penalty for prohibited words
    }

    return Math.max(0, alignmentScore / totalChecks);
  }

  private async calculateVoiceScore(
    content: string,
    brandVoiceId?: string,
  ): Promise<number> {
    const analysis = await this.performContentAnalysis(content);

    // Weight different aspects of voice consistency
    const weights = {
      toneAlignment: 0.3,
      brandAlignment: 0.25,
      readability: 0.2,
      sentiment: 0.15,
      keywordUsage: 0.1,
    };

    let totalScore = 0;
    totalScore += analysis.brandAlignment * weights.brandAlignment;
    totalScore += analysis.readabilityScore * weights.readability;
    totalScore += analysis.sentimentScore * weights.sentiment;

    // Tone alignment (prefer professional tone)
    const toneScore = analysis.toneAnalysis.professional || 0;
    totalScore += toneScore * weights.toneAlignment;

    // Keyword usage bonus
    const keywordScore = Number(
      Object.values(analysis.keywordUsage).reduce(
        (sum: number, count: number) => sum + (count as number),
        0,
      ),
    );
    totalScore += Math.min(100, keywordScore * 10) * weights.keywordUsage;

    return Math.round(totalScore);
  }

  private async generateContentSuggestions(
    content: string,
    analysis: BrandVoiceAnalysis,
  ): Promise<BrandVoiceSuggestion[]> {
    const suggestions: BrandVoiceSuggestion[] = [];

    // Tone suggestions based on brand configuration
    const primaryTone = brandVoiceConfig.tone.split(", ")[0];
    if (analysis.toneAnalysis.professional < 30) {
      const preferredWords = brandVoiceConfig.vocabulary.preferred
        .slice(0, 5)
        .join('", "');
      suggestions.push({
        type: "tone" as const,
        issue: `Content lacks ${primaryTone} tone`,
        suggestion: `Use more ${primaryTone} language like "${preferredWords}"`,
        priority: "high" as const,
      });
    }

    // Brand alignment suggestions
    if (analysis.brandAlignment < 50) {
      const brandTerms = brandVoiceConfig.vocabulary.brandTerms
        .slice(0, 3)
        .join('", "');
      suggestions.push({
        type: "style" as const,
        issue: "Low brand alignment score",
        suggestion: `Include more brand-specific terminology like "${brandTerms}" and focus on customer benefits`,
        priority: "high" as const,
      });
    }

    // Readability suggestions based on style guide
    if (analysis.readabilityScore < 60) {
      suggestions.push({
        type: "structure" as const,
        issue: "Content may be difficult to read",
        suggestion: `Follow the brand style guide: ${brandVoiceConfig.styleGuide.sentenceLength} and ${brandVoiceConfig.styleGuide.paragraphLength}`,
        priority: "medium" as const,
      });
    }

    // Keyword suggestions using brand config
    const keywordCount = Object.values(analysis.keywordUsage).reduce(
      (sum: number, count: number) => sum + (count as number),
      0,
    );
    if (keywordCount === 0) {
      const topBrandTerms = brandVoiceConfig.vocabulary.brandTerms
        .slice(0, 3)
        .join('", "');
      suggestions.push({
        type: "vocabulary" as const,
        issue: "No brand keywords detected",
        suggestion: `Include brand-relevant keywords like "${topBrandTerms}"`,
        priority: "medium" as const,
      });
    }

    // Sentiment suggestions
    if (analysis.sentimentScore < 40) {
      const targetEmotions = brandVoiceConfig.targetEmotions
        .slice(0, 3)
        .join(", ");
      suggestions.push({
        type: "tone" as const,
        issue: "Content has negative sentiment",
        suggestion: `Use more positive language that evokes ${targetEmotions}`,
        priority: "high" as const,
      });
    }

    // Prohibited words check
    const contentLower = content.toLowerCase();
    const prohibitedWords = brandVoiceConfig.vocabulary.prohibited.concat(
      brandVoiceConfig.contentFilters.avoidWords,
    );
    const foundProhibited = prohibitedWords.filter((word) =>
      contentLower.includes(word.toLowerCase()),
    );
    if (foundProhibited.length > 0) {
      suggestions.push({
        type: "vocabulary" as const,
        issue: `Contains prohibited words: ${foundProhibited.join(", ")}`,
        suggestion: `Replace these words with preferred alternatives from the brand vocabulary`,
        priority: "high" as const,
      });
    }

    // Brand adjectives suggestions
    const brandAdjectives = brandVoiceConfig.adjectives;
    const adjectiveMatches = brandAdjectives.filter((adj) =>
      contentLower.includes(adj.toLowerCase()),
    );
    if (adjectiveMatches.length === 0) {
      const topAdjectives = brandAdjectives.slice(0, 4).join(", ");
      suggestions.push({
        type: "vocabulary" as const,
        issue: "Missing brand adjectives",
        suggestion: `Consider incorporating brand adjectives like: ${topAdjectives}`,
        priority: "low" as const,
      });
    }

    return suggestions;
  }

  // Public methods for external integration
  async analyzeContentPublic(
    content: string,
    contentType?: string,
    brandVoiceId?: string,
  ): Promise<BrandVoiceResult> {
    return this.execute({
      task: "analyze_content",
      context: { action: "analyze", content, contentType, brandVoiceId },
      priority: "medium",
    });
  }

  async scoreContentPublic(
    content: string,
    brandVoiceId?: string,
  ): Promise<BrandVoiceResult> {
    return this.execute({
      task: "score_content",
      context: { action: "score", content, brandVoiceId },
      priority: "medium",
    });
  }

  async getSuggestionsPublic(
    content: string,
    contentType?: string,
  ): Promise<BrandVoiceResult> {
    return this.execute({
      task: "generate_suggestions",
      context: { action: "suggest", content, contentType },
      priority: "medium",
    });
  }

  async analyzeAudienceContentPublic(
    content: string,
    audienceSegment: "enterprise" | "smb" | "agencies" | "ecommerce" | "saas",
    contentType?: string,
  ): Promise<BrandVoiceResult> {
    return this.execute({
      task: "analyze_audience",
      context: {
        action: "analyze_audience",
        content,
        audienceSegment,
        contentType,
      },
      priority: "medium",
    });
  }

  // Helper method to get available audience segments
  getAudienceSegments(): Array<{ segment: string; config: { tone: string; vocabulary: string[]; messagingFocus: string[] } }> {
    return Object.entries(brandVoiceConfig.audienceSegments).map(
      ([segment, config]) => ({
        segment,
        config,
      }),
    );
  }

  // Helper method to get brand configuration
  getBrandConfig() {
    return brandVoiceConfig;
  }

  private async adaptToneForSegment(
    context: BrandVoiceContext,
  ): Promise<BrandVoiceResult> {
    if (!context.content) {
      throw new Error("Content is required for tone adaptation");
    }

    if (!context.audienceSegment) {
      throw new Error("Audience segment is required for tone adaptation");
    }

    // Get current tone analysis
    const currentAnalysis = await this.performContentAnalysis(
      context.content,
      context.contentType,
    );

    // Get segment-specific tone requirements
    const segmentConfig = this.getSegmentToneConfig(context.audienceSegment);
    const targetTone = context.targetTone || segmentConfig.preferredTone;
    const fallbackTone = context.fallbackTone || segmentConfig.fallbackTone;

    // Analyze tone adaptation needed
    const toneAdaptation = await this.calculateToneAdaptation(
      currentAnalysis,
      targetTone,
      fallbackTone,
      context.audienceSegment,
    );

    // Generate adapted suggestions
    const adaptedSuggestions = await this.generateToneAdaptationSuggestions(
      context.content,
      currentAnalysis,
      toneAdaptation,
      context.audienceSegment,
    );

    return {
      success: true,
      voiceScore: await this.calculateAudienceVoiceScore(
        context.content,
        context.audienceSegment,
      ),
      toneAdaptation,
      suggestions: adaptedSuggestions,
      analysis: {
        ...currentAnalysis,
        segmentAlignment: this.calculateSegmentAlignment(
          currentAnalysis,
          segmentConfig,
        ),
      },
      data: {
        toneAdapted: true,
        segment: context.audienceSegment,
        targetTone,
        fallbackTone,
        timestamp: new Date().toISOString(),
      },
      metadata: {
        timestamp: new Date().toISOString(),
        duration: 0,
      },
    };
  }

  private async getToneRecommendations(
    context: BrandVoiceContext,
  ): Promise<BrandVoiceResult> {
    const allSegments = ["enterprise", "smb", "agencies", "ecommerce", "saas", "consumer", "investor", "gen_z"];
    const recommendations = [];

    for (const segment of allSegments) {
      const segmentConfig = this.getSegmentToneConfig(segment);
      const examples = await this.generateToneExamples(segment);
      
      recommendations.push({
        segment,
        recommendedTone: segmentConfig.preferredTone,
        reasoning: segmentConfig.reasoning,
        examples,
        fallbackTones: segmentConfig.fallbackTones,
      });
    }

    return {
      success: true,
      toneRecommendations: recommendations,
      data: {
        recommendationsGenerated: true,
        totalSegments: allSegments.length,
        timestamp: new Date().toISOString(),
      },
      metadata: {
        timestamp: new Date().toISOString(),
        duration: 0,
      },
    };
  }

  private getSegmentToneConfig(segment: string): {
    preferredTone: string;
    fallbackTone: string;
    reasoning: string;
    fallbackTones: string[];
  } {
    const configs = {
      enterprise: {
        preferredTone: "authoritative and strategic",
        fallbackTone: "professional and consultative",
        reasoning: "Enterprise clients expect confidence and strategic thinking",
        fallbackTones: ["professional", "consultative", "analytical"],
      },
      smb: {
        preferredTone: "approachable and growth-focused",
        fallbackTone: "friendly and supportive",
        reasoning: "SMB clients value accessibility and practical growth solutions",
        fallbackTones: ["friendly", "supportive", "encouraging"],
      },
      agencies: {
        preferredTone: "collaborative and expertise-driven",
        fallbackTone: "professional and results-oriented",
        reasoning: "Agencies need to trust expertise while maintaining collaborative relationships",
        fallbackTones: ["professional", "results-oriented", "collaborative"],
      },
      ecommerce: {
        preferredTone: "results-driven and conversion-focused",
        fallbackTone: "practical and ROI-focused",
        reasoning: "E-commerce clients prioritize measurable results and conversions",
        fallbackTones: ["practical", "ROI-focused", "data-driven"],
      },
      saas: {
        preferredTone: "technical and innovation-focused",
        fallbackTone: "professional and feature-oriented",
        reasoning: "SaaS clients appreciate technical depth and innovation",
        fallbackTones: ["professional", "feature-oriented", "analytical"],
      },
      consumer: {
        preferredTone: "friendly and engaging",
        fallbackTone: "approachable and relatable",
        reasoning: "Consumer audiences respond to personal connection and engagement",
        fallbackTones: ["approachable", "relatable", "conversational"],
      },
      investor: {
        preferredTone: "confident and data-driven",
        fallbackTone: "analytical and strategic",
        reasoning: "Investors require confidence backed by solid data and strategic thinking",
        fallbackTones: ["analytical", "strategic", "authoritative"],
      },
      gen_z: {
        preferredTone: "authentic and trend-aware",
        fallbackTone: "casual and relatable",
        reasoning: "Gen Z values authenticity and staying current with trends",
        fallbackTones: ["casual", "relatable", "energetic"],
      },
    };

    return configs[segment as keyof typeof configs] || configs.consumer;
  }

  private async calculateToneAdaptation(
    currentAnalysis: BrandVoiceAnalysis,
    targetTone: string,
    fallbackTone: string,
    segment: string,
  ): Promise<ToneAdaptation> {
    // Determine the current dominant tone
    const toneScores = currentAnalysis.toneAnalysis;
    const currentTone = Object.entries(toneScores).reduce((a, b) =>
      toneScores[a[0] as keyof typeof toneScores] > toneScores[b[0] as keyof typeof toneScores] ? a : b,
    )[0] as string;

    // Calculate adaptation confidence based on current tone alignment
    const segmentConfig = this.getSegmentToneConfig(segment);
    const targetToneWords = targetTone.split(/\s+/);
    const currentToneAlignment = targetToneWords.some((word) =>
      currentTone.includes(word),
    );

    const adaptedTone = currentToneAlignment ? targetTone : fallbackTone;
    const confidence = currentToneAlignment ? 0.85 : 0.65;

    const reasoning = currentToneAlignment
      ? `Current tone aligns well with target ${targetTone} for ${segment} segment`
      : `Current tone doesn't align with target, using fallback ${fallbackTone} for ${segment} segment`;

    return {
      originalTone: currentTone,
      adaptedTone,
      confidence,
      reasoning,
    };
  }

  private async generateToneAdaptationSuggestions(
    content: string,
    analysis: BrandVoiceAnalysis,
    toneAdaptation: ToneAdaptation,
    segment: string,
  ): Promise<BrandVoiceSuggestion[]> {
    const suggestions: BrandVoiceSuggestion[] = [];
    const segmentConfig = this.getSegmentToneConfig(segment);

    // Tone-specific suggestions
    if (toneAdaptation.confidence < 0.7) {
      suggestions.push({
        type: "tone" as const,
        issue: `Tone doesn't fully align with ${segment} segment expectations`,
        suggestion: `Adjust tone to be more ${toneAdaptation.adaptedTone}. Consider using ${segmentConfig.reasoning.toLowerCase()}`,
        priority: "high" as const,
      });
    }

    // Vocabulary suggestions for segment
    const segmentVocab = brandVoiceConfig.audienceSegments[segment as keyof typeof brandVoiceConfig.audienceSegments];
    if (segmentVocab) {
      const contentLower = content.toLowerCase();
      const vocabMatches = segmentVocab.vocabulary.filter((word) =>
        contentLower.includes(word.toLowerCase()),
      ).length;

      if (vocabMatches < 2) {
        suggestions.push({
          type: "vocabulary" as const,
          issue: `Missing ${segment}-specific vocabulary`,
          suggestion: `Include terms like: ${segmentVocab.vocabulary.slice(0, 3).join(", ")}`,
          priority: "medium" as const,
        });
      }
    }

    // Fallback tone suggestions
    if (toneAdaptation.adaptedTone === toneAdaptation.originalTone) {
      suggestions.push({
        type: "tone" as const,
        issue: "Consider alternative tones for better segment alignment",
        suggestion: `Alternative tones for ${segment}: ${segmentConfig.fallbackTones.join(", ")}`,
        priority: "low" as const,
      });
    }

    return suggestions;
  }

  private calculateSegmentAlignment(
    analysis: BrandVoiceAnalysis,
    segmentConfig: { preferredTone: string; fallbackTone: string; reasoning: string; fallbackTones: string[] },
  ): number {
    let alignmentScore = 0;
    let totalChecks = 0;

    // Tone alignment (40% weight)
    const toneAlignment = this.calculateToneAlignment(
      analysis.toneAnalysis,
      segmentConfig.preferredTone,
    );
    alignmentScore += toneAlignment * 0.4;
    totalChecks++;

    // Brand alignment (30% weight)
    alignmentScore += analysis.brandAlignment * 0.3;
    totalChecks++;

    // Readability for segment (20% weight)
    const readabilityAlignment = this.calculateReadabilityAlignment(
      analysis.readabilityScore,
      segmentConfig.preferredTone,
    );
    alignmentScore += readabilityAlignment * 0.2;
    totalChecks++;

    // Sentiment appropriateness (10% weight)
    const sentimentAlignment = this.calculateSentimentAlignment(
      analysis.sentimentScore,
      segmentConfig.preferredTone,
    );
    alignmentScore += sentimentAlignment * 0.1;
    totalChecks++;

    return Math.round(alignmentScore);
  }

  private calculateToneAlignment(
    toneAnalysis: Record<string, number>,
    preferredTone: string,
  ): number {
    const toneWords = preferredTone.toLowerCase().split(/\s+/);
    let maxAlignment = 0;

    for (const [tone, score] of Object.entries(toneAnalysis)) {
      const toneAlignment = toneWords.some((word) =>
        tone.toLowerCase().includes(word) || word.includes(tone.toLowerCase()),
      );
      if (toneAlignment) {
        maxAlignment = Math.max(maxAlignment, score);
      }
    }

    return maxAlignment;
  }

  private calculateReadabilityAlignment(
    readabilityScore: number,
    preferredTone: string,
  ): number {
    // Adjust readability expectations based on tone
    const toneReadabilityTargets = {
      "technical": 70,
      "professional": 65,
      "casual": 80,
      "friendly": 85,
      "authoritative": 60,
      "analytical": 65,
    };

    const toneWords = preferredTone.toLowerCase().split(/\s+/);
    let targetReadability = 70; // default

    for (const [tone, target] of Object.entries(toneReadabilityTargets)) {
      if (toneWords.some((word) => word.includes(tone))) {
        targetReadability = target;
        break;
      }
    }

    // Calculate how close the readability is to the target
    const difference = Math.abs(readabilityScore - targetReadability);
    return Math.max(0, 100 - difference * 2);
  }

  private calculateSentimentAlignment(
    sentimentScore: number,
    preferredTone: string,
  ): number {
    // Map tones to expected sentiment ranges
    const toneSentimentRanges = {
      "positive": [60, 100],
      "friendly": [70, 100],
      "enthusiastic": [80, 100],
      "professional": [40, 80],
      "neutral": [30, 70],
      "authoritative": [20, 60],
      "analytical": [20, 60],
    };

    const toneWords = preferredTone.toLowerCase().split(/\s+/);
    let expectedRange = [30, 70]; // default neutral range

    for (const [tone, range] of Object.entries(toneSentimentRanges)) {
      if (toneWords.some((word) => word.includes(tone))) {
        expectedRange = range;
        break;
      }
    }

    // Check if sentiment falls within expected range
    const [min, max] = expectedRange;
    if (sentimentScore >= min && sentimentScore <= max) {
      return 100;
    }

    // Calculate penalty for being outside range
    const penalty = sentimentScore < min ? min - sentimentScore : sentimentScore - max;
    return Math.max(0, 100 - penalty * 2);
  }

  private async generateToneExamples(segment: string): Promise<string[]> {
    const examples = {
      enterprise: [
        "Streamline your operations with enterprise-grade AI automation",
        "Strategic implementation of AI-driven marketing solutions",
        "Transform your organizational efficiency with intelligent automation",
      ],
      smb: [
        "Grow your business with easy-to-use AI marketing tools",
        "Affordable automation solutions that deliver real results",
        "Simple, powerful tools to boost your marketing efforts",
      ],
      agencies: [
        "Deliver exceptional client results with our AI-powered platform",
        "Scale your agency operations with intelligent automation",
        "Partner with us to enhance your service offerings",
      ],
      ecommerce: [
        "Increase your conversion rates with AI-driven personalization",
        "Boost your ROI with data-driven marketing automation",
        "Drive more sales with intelligent customer targeting",
      ],
      saas: [
        "Integrate seamlessly with our robust API infrastructure",
        "Enhance your product with AI-powered marketing features",
        "Scale your user acquisition with intelligent automation",
      ],
      consumer: [
        "Discover the fun side of AI marketing automation",
        "Make your brand shine with personalized experiences",
        "Connect with your audience like never before",
      ],
      investor: [
        "ROI-focused AI marketing platform with proven scalability",
        "Data-driven growth metrics demonstrate market leadership",
        "Strategic positioning in the $50B marketing automation sector",
      ],
      gen_z: [
        "AI that actually gets your vibe and aesthetic",
        "Create content that hits different with our smart tools",
        "Level up your brand game with AI that's actually lit",
      ],
    };

    return examples[segment as keyof typeof examples] || examples.consumer;
  }
}

// Export as default for agent registry compatibility
export default BrandVoiceAgent;
