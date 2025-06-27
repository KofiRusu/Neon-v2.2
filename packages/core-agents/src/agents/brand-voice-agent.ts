import { AbstractAgent } from '../base-agent';
import type { AgentResult, AgentPayload } from '../base-agent';
import { brandVoiceConfig } from './BrandVoiceAgent/brand.config';

export interface BrandVoiceContext {
  action:
    | 'analyze'
    | 'score'
    | 'suggest'
    | 'create_profile'
    | 'get_guidelines'
    | 'analyze_audience';
  content?: string;
  contentType?: 'email' | 'social' | 'blog' | 'ad' | 'general';
  brandVoiceId?: string;
  audienceSegment?: 'enterprise' | 'smb' | 'agencies' | 'ecommerce' | 'saas';
  profileData?: {
    name: string;
    description?: string;
    guidelines: Record<string, any>;
    keywords: string[];
    toneProfile: Record<string, any>;
    sampleContent?: Record<string, any>;
  };
}

export interface BrandVoiceResult extends AgentResult {
  voiceScore?: number;
  suggestions?: Array<{
    type: 'tone' | 'vocabulary' | 'structure' | 'style';
    issue: string;
    suggestion: string;
    priority: 'low' | 'medium' | 'high';
  }>;
  profile?: any;
  guidelines?: Record<string, any>;
  analysis?: {
    toneAnalysis: Record<string, number>;
    keywordUsage: Record<string, number>;
    sentimentScore: number;
    readabilityScore: number;
    brandAlignment: number;
    wordCount: number;
    characterCount: number;
    contentType: string;
    analysisVersion: string;
  };
}

export class BrandVoiceAgent extends AbstractAgent {
  constructor() {
    super('brand-voice-agent', 'BrandVoiceAgent', 'brand_voice', [
      'analyze_content',
      'score_content',
      'generate_suggestions',
      'create_profile',
      'get_guidelines',
      'update_guidelines',
      'analyze_audience',
    ]);
  }

  async execute(payload: AgentPayload): Promise<BrandVoiceResult> {
    return this.executeWithErrorHandling(payload, async () => {
      const context = payload.context as BrandVoiceContext;

      if (!context.action) {
        throw new Error('Missing required context: action is required');
      }

      switch (context.action) {
        case 'analyze':
          return await this.analyzeContent(context);
        case 'score':
          return await this.scoreContent(context);
        case 'suggest':
          return await this.generateSuggestions(context);
        case 'create_profile':
          return await this.createBrandProfile(context);
        case 'get_guidelines':
          return await this.getGuidelines(context);
        case 'analyze_audience':
          return await this.analyzeAudienceContent(context);
        default:
          throw new Error(`Unknown action: ${context.action}`);
      }
    }) as Promise<BrandVoiceResult>;
  }

  private async analyzeContent(context: BrandVoiceContext): Promise<BrandVoiceResult> {
    if (!context.content) {
      throw new Error('Content is required for analysis');
    }

    const analysis = await this.performContentAnalysis(context.content, context.contentType);
    const voiceScore = await this.calculateVoiceScore(context.content, context.brandVoiceId);
    const suggestions = await this.generateContentSuggestions(context.content, analysis);

    return {
      success: true,
      voiceScore,
      suggestions,
      analysis,
      data: {
        contentAnalyzed: true,
        analysisTimestamp: new Date().toISOString(),
        contentLength: context.content.length,
        contentType: context.contentType || 'general',
      },
      metadata: {
        timestamp: new Date().toISOString(),
        duration: 0,
      },
    };
  }

  private async scoreContent(context: BrandVoiceContext): Promise<BrandVoiceResult> {
    if (!context.content) {
      throw new Error('Content is required for scoring');
    }

    const voiceScore = await this.calculateVoiceScore(context.content, context.brandVoiceId);
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

  private async generateSuggestions(context: BrandVoiceContext): Promise<BrandVoiceResult> {
    if (!context.content) {
      throw new Error('Content is required for suggestions');
    }

    const analysis = await this.performContentAnalysis(context.content, context.contentType);
    const suggestions = await this.generateContentSuggestions(context.content, analysis);

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

  private async createBrandProfile(context: BrandVoiceContext): Promise<BrandVoiceResult> {
    if (!context.profileData) {
      throw new Error('Profile data is required');
    }

    // In a real implementation, this would save to database
    const profile = {
      id: `brand-voice-${Date.now()}`,
      ...context.profileData,
      createdAt: new Date().toISOString(),
      version: '1.0',
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

  private async getGuidelines(context: BrandVoiceContext): Promise<BrandVoiceResult> {
    // Use centralized brand configuration
    const guidelines = {
      tone: {
        primary: brandVoiceConfig.tone.split(', ')[0],
        secondary: brandVoiceConfig.tone.split(', ')[1] || '',
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
        uniqueSellingPropositions: brandVoiceConfig.messaging.uniqueSellingPropositions,
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
        configVersion: '2.0',
      },
      metadata: {
        timestamp: new Date().toISOString(),
        duration: 0,
      },
    };
  }

  private async analyzeAudienceContent(context: BrandVoiceContext): Promise<BrandVoiceResult> {
    if (!context.content) {
      throw new Error('Content is required for audience analysis');
    }

    if (!context.audienceSegment) {
      throw new Error('Audience segment is required for audience analysis');
    }

    // Get audience-specific guidelines
    const audienceConfig = brandVoiceConfig.audienceSegments[context.audienceSegment];
    if (!audienceConfig) {
      throw new Error(`Unknown audience segment: ${context.audienceSegment}`);
    }

    // Perform standard analysis
    const standardAnalysis = await this.performContentAnalysis(
      context.content,
      context.contentType
    );

    // Add audience-specific scoring
    const audienceAlignment = this.analyzeAudienceAlignment(
      context.content,
      context.audienceSegment
    );
    const voiceScore = await this.calculateAudienceVoiceScore(
      context.content,
      context.audienceSegment
    );
    const audienceSpecificSuggestions = await this.generateAudienceSpecificSuggestions(
      context.content,
      standardAnalysis,
      context.audienceSegment
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

  private analyzeAudienceAlignment(content: string, audienceSegment: string): number {
    const audienceConfig = brandVoiceConfig.audienceSegments[audienceSegment];
    const contentLower = content.toLowerCase();

    let alignmentScore = 0;
    let totalChecks = 0;

    // Check audience-specific vocabulary
    const audienceVocab = audienceConfig.vocabulary;
    const vocabMatches = audienceVocab.filter(word =>
      contentLower.includes(word.toLowerCase())
    ).length;
    alignmentScore += (vocabMatches / audienceVocab.length) * 50;
    totalChecks++;

    // Check messaging focus alignment
    const messagingWords = audienceConfig.messagingFocus.flatMap(focus =>
      focus.toLowerCase().split(' ')
    );
    const messagingMatches = messagingWords.filter(word => contentLower.includes(word)).length;
    alignmentScore += (messagingMatches / messagingWords.length) * 50;
    totalChecks++;

    return alignmentScore / totalChecks;
  }

  private async calculateAudienceVoiceScore(
    content: string,
    audienceSegment: string
  ): Promise<number> {
    const standardScore = await this.calculateVoiceScore(content);
    const audienceAlignment = this.analyzeAudienceAlignment(content, audienceSegment);

    // Weight: 70% standard brand alignment, 30% audience-specific alignment
    return Math.round(standardScore * 0.7 + audienceAlignment * 0.3);
  }

  private async generateAudienceSpecificSuggestions(
    content: string,
    analysis: any,
    audienceSegment: string
  ): Promise<Array<any>> {
    const standardSuggestions = await this.generateContentSuggestions(content, analysis);
    const audienceSuggestions = [];

    const audienceConfig = brandVoiceConfig.audienceSegments[audienceSegment];
    const contentLower = content.toLowerCase();

    // Audience vocabulary suggestions
    const audienceVocabMatches = audienceConfig.vocabulary.filter(word =>
      contentLower.includes(word.toLowerCase())
    ).length;

    if (audienceVocabMatches === 0) {
      const topVocab = audienceConfig.vocabulary.slice(0, 3).join(', ');
      audienceSuggestions.push({
        type: 'vocabulary',
        issue: `Missing ${audienceSegment} audience vocabulary`,
        suggestion: `Consider using ${audienceSegment}-specific terms like: ${topVocab}`,
        priority: 'medium',
      });
    }

    // Tone alignment for audience
    audienceSuggestions.push({
      type: 'tone',
      issue: `Ensure tone matches ${audienceSegment} audience expectations`,
      suggestion: `Adopt a ${audienceConfig.tone} tone for the ${audienceSegment} segment`,
      priority: 'medium',
    });

    // Messaging focus suggestions
    const messagingFocusUsed = audienceConfig.messagingFocus.filter(focus =>
      contentLower.includes(focus.toLowerCase().split(' ')[0])
    ).length;

    if (messagingFocusUsed === 0) {
      const topFocus = audienceConfig.messagingFocus.slice(0, 2).join(', ');
      audienceSuggestions.push({
        type: 'style',
        issue: `Content doesn't address ${audienceSegment} priorities`,
        suggestion: `Focus on ${audienceSegment} priorities like: ${topFocus}`,
        priority: 'high',
      });
    }

    return [...standardSuggestions, ...audienceSuggestions];
  }

  private async performContentAnalysis(content: string, contentType?: string): Promise<any> {
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
      contentType: contentType || 'general',
      wordCount: content.split(/\s+/).length,
      characterCount: content.length,
      analysisVersion: '1.0',
    };
  }

  private async performQuickAnalysis(content: string): Promise<any> {
    return {
      toneAnalysis: this.analyzeTone(content),
      sentimentScore: this.analyzeSentiment(content),
      brandAlignment: this.analyzeBrandAlignment(content),
      wordCount: content.split(/\s+/).length,
      characterCount: content.length,
      readabilityScore: this.analyzeReadability(content),
      keywordUsage: this.analyzeKeywords(content),
    };
  }

  private analyzeTone(content: string): Record<string, number> {
    const contentLower = content.toLowerCase();

    // Simple tone detection based on keywords and patterns
    const toneIndicators = {
      professional: ['solution', 'implement', 'strategy', 'optimize', 'efficiency'],
      friendly: ['help', 'easy', 'simple', 'welcome', 'happy'],
      urgent: ['now', 'immediately', 'urgent', 'asap', 'quickly'],
      casual: ['hey', 'awesome', 'cool', 'great', 'nice'],
      formal: ['furthermore', 'therefore', 'consequently', 'nevertheless'],
    };

    const toneScores: Record<string, number> = {};

    for (const [tone, keywords] of Object.entries(toneIndicators)) {
      const matches = keywords.filter(keyword => contentLower.includes(keyword)).length;
      toneScores[tone] = (matches / keywords.length) * 100;
    }

    return toneScores;
  }

  private analyzeKeywords(content: string): Record<string, number> {
    // Use brand configuration keywords
    const brandKeywords = brandVoiceConfig.vocabulary.brandTerms.concat(
      brandVoiceConfig.vocabulary.preferred.slice(0, 10), // Limit preferred words for analysis
      brandVoiceConfig.vocabulary.industryTerms.slice(0, 10) // Limit industry terms for analysis
    );

    const keywordCounts: Record<string, number> = {};

    brandKeywords.forEach(keyword => {
      const regex = new RegExp(keyword, 'gi');
      const matches = content.match(regex) || [];
      keywordCounts[keyword.toLowerCase()] = matches.length;
    });

    return keywordCounts;
  }

  private analyzeSentiment(content: string): number {
    // Simple sentiment analysis based on positive/negative words
    const positiveWords = [
      'good',
      'great',
      'excellent',
      'amazing',
      'fantastic',
      'wonderful',
      'perfect',
    ];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'disappointing', 'poor'];

    const contentLower = content.toLowerCase();
    let positiveCount = 0;
    let negativeCount = 0;

    positiveWords.forEach(word => {
      if (contentLower.includes(word)) positiveCount++;
    });

    negativeWords.forEach(word => {
      if (contentLower.includes(word)) negativeCount++;
    });

    const totalWords = content.split(/\s+/).length;
    const sentimentScore = ((positiveCount - negativeCount) / totalWords) * 100;

    // Normalize to 0-100 scale
    return Math.max(0, Math.min(100, 50 + sentimentScore));
  }

  private analyzeReadability(content: string): number {
    // Simple readability score based on sentence and word length
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = content.split(/\s+/);

    if (sentences.length === 0) return 50;

    const avgWordsPerSentence = words.length / sentences.length;
    const avgCharsPerWord = content.replace(/\s+/g, '').length / words.length;

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
    const professionalMatches = professionalWords.filter(word =>
      contentLower.includes(word.toLowerCase())
    ).length;
    alignmentScore += (professionalMatches / professionalWords.length) * 25;
    totalChecks++;

    // Brand adjectives check
    const brandAdjectives = brandVoiceConfig.adjectives;
    const adjectiveMatches = brandAdjectives.filter(adj =>
      contentLower.includes(adj.toLowerCase())
    ).length;
    alignmentScore += (adjectiveMatches / brandAdjectives.length) * 25;
    totalChecks++;

    // Customer-centric check
    const customerWords = ['you', 'your', 'customer', 'user', 'client'];
    const customerMatches = customerWords.filter(word => contentLower.includes(word)).length;
    alignmentScore += Math.min(25, (customerMatches / content.split(/\s+/).length) * 100);
    totalChecks++;

    // Brand terminology check using brand config
    const brandTerms = brandVoiceConfig.vocabulary.brandTerms.map(term => term.toLowerCase());
    const brandMatches = brandTerms.filter(term => contentLower.includes(term)).length;
    alignmentScore += brandMatches > 0 ? 25 : 0;
    totalChecks++;

    // Avoid prohibited words check
    const prohibitedWords = brandVoiceConfig.vocabulary.prohibited.concat(
      brandVoiceConfig.contentFilters.avoidWords
    );
    const prohibitedMatches = prohibitedWords.filter(word =>
      contentLower.includes(word.toLowerCase())
    ).length;
    if (prohibitedMatches > 0) {
      alignmentScore -= Math.min(50, prohibitedMatches * 10); // Penalty for prohibited words
    }

    return Math.max(0, alignmentScore / totalChecks);
  }

  private async calculateVoiceScore(content: string, brandVoiceId?: string): Promise<number> {
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
        0
      )
    );
    totalScore += Math.min(100, keywordScore * 10) * weights.keywordUsage;

    return Math.round(totalScore);
  }

  private async generateContentSuggestions(content: string, analysis: any): Promise<Array<any>> {
    const suggestions = [];

    // Tone suggestions based on brand configuration
    const primaryTone = brandVoiceConfig.tone.split(', ')[0];
    if (analysis.toneAnalysis.professional < 30) {
      const preferredWords = brandVoiceConfig.vocabulary.preferred.slice(0, 5).join('", "');
      suggestions.push({
        type: 'tone',
        issue: `Content lacks ${primaryTone} tone`,
        suggestion: `Use more ${primaryTone} language like "${preferredWords}"`,
        priority: 'high',
      });
    }

    // Brand alignment suggestions
    if (analysis.brandAlignment < 50) {
      const brandTerms = brandVoiceConfig.vocabulary.brandTerms.slice(0, 3).join('", "');
      suggestions.push({
        type: 'style',
        issue: 'Low brand alignment score',
        suggestion: `Include more brand-specific terminology like "${brandTerms}" and focus on customer benefits`,
        priority: 'high',
      });
    }

    // Readability suggestions based on style guide
    if (analysis.readabilityScore < 60) {
      suggestions.push({
        type: 'structure',
        issue: 'Content may be difficult to read',
        suggestion: `Follow the brand style guide: ${brandVoiceConfig.styleGuide.sentenceLength} and ${brandVoiceConfig.styleGuide.paragraphLength}`,
        priority: 'medium',
      });
    }

    // Keyword suggestions using brand config
    const keywordCount = Object.values(analysis.keywordUsage).reduce(
      (sum: number, count: number) => sum + (count as number),
      0
    );
    if (keywordCount === 0) {
      const topBrandTerms = brandVoiceConfig.vocabulary.brandTerms.slice(0, 3).join('", "');
      suggestions.push({
        type: 'vocabulary',
        issue: 'No brand keywords detected',
        suggestion: `Include brand-relevant keywords like "${topBrandTerms}"`,
        priority: 'medium',
      });
    }

    // Sentiment suggestions
    if (analysis.sentimentScore < 40) {
      const targetEmotions = brandVoiceConfig.targetEmotions.slice(0, 3).join(', ');
      suggestions.push({
        type: 'tone',
        issue: 'Content has negative sentiment',
        suggestion: `Use more positive language that evokes ${targetEmotions}`,
        priority: 'high',
      });
    }

    // Prohibited words check
    const contentLower = content.toLowerCase();
    const prohibitedWords = brandVoiceConfig.vocabulary.prohibited.concat(
      brandVoiceConfig.contentFilters.avoidWords
    );
    const foundProhibited = prohibitedWords.filter(word =>
      contentLower.includes(word.toLowerCase())
    );
    if (foundProhibited.length > 0) {
      suggestions.push({
        type: 'vocabulary',
        issue: `Contains prohibited words: ${foundProhibited.join(', ')}`,
        suggestion: `Replace these words with preferred alternatives from the brand vocabulary`,
        priority: 'high',
      });
    }

    // Brand adjectives suggestions
    const brandAdjectives = brandVoiceConfig.adjectives;
    const adjectiveMatches = brandAdjectives.filter(adj =>
      contentLower.includes(adj.toLowerCase())
    );
    if (adjectiveMatches.length === 0) {
      const topAdjectives = brandAdjectives.slice(0, 4).join(', ');
      suggestions.push({
        type: 'vocabulary',
        issue: 'Missing brand adjectives',
        suggestion: `Consider incorporating brand adjectives like: ${topAdjectives}`,
        priority: 'low',
      });
    }

    return suggestions;
  }

  // Public methods for external integration
  async analyzeContentPublic(
    content: string,
    contentType?: string,
    brandVoiceId?: string
  ): Promise<BrandVoiceResult> {
    return this.execute({
      task: 'analyze_content',
      context: { action: 'analyze', content, contentType, brandVoiceId },
      priority: 'medium',
    });
  }

  async scoreContentPublic(content: string, brandVoiceId?: string): Promise<BrandVoiceResult> {
    return this.execute({
      task: 'score_content',
      context: { action: 'score', content, brandVoiceId },
      priority: 'medium',
    });
  }

  async getSuggestionsPublic(content: string, contentType?: string): Promise<BrandVoiceResult> {
    return this.execute({
      task: 'generate_suggestions',
      context: { action: 'suggest', content, contentType },
      priority: 'medium',
    });
  }

  async analyzeAudienceContentPublic(
    content: string,
    audienceSegment: 'enterprise' | 'smb' | 'agencies' | 'ecommerce' | 'saas',
    contentType?: string
  ): Promise<BrandVoiceResult> {
    return this.execute({
      task: 'analyze_audience',
      context: { action: 'analyze_audience', content, audienceSegment, contentType },
      priority: 'medium',
    });
  }

  // Helper method to get available audience segments
  getAudienceSegments(): Array<{ segment: string; config: any }> {
    return Object.entries(brandVoiceConfig.audienceSegments).map(([segment, config]) => ({
      segment,
      config,
    }));
  }

  // Helper method to get brand configuration
  getBrandConfig() {
    return brandVoiceConfig;
  }
}
