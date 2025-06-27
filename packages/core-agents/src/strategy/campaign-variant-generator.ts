/**
 * Campaign Variant Generator - A/B Testing Content Creation
 * Generates multiple content variations for testing optimization
 */

import { AbstractAgent } from '../base-agent';
import { AgentMemoryStore } from '../memory/AgentMemoryStore';

export interface ContentVariant {
  id: string;
  type: 'subject' | 'copy' | 'visual' | 'cta' | 'timing';
  original: string;
  variant: string;
  confidence: number;
  brandAlignment: number;
  expectedPerformance: number;
  tags: string[];
}

export interface VariantGenerationRequest {
  campaignId: string;
  content: {
    subject?: string;
    body?: string;
    cta?: string;
    visualTheme?: string;
  };
  targetAudience: string;
  variantTypes: Array<'subject' | 'copy' | 'visual' | 'cta' | 'timing'>;
  variantCount: number; // How many variants per type
  constraints?: {
    maxLength?: number;
    tone?: string;
    keywords?: string[];
    brandGuidelines?: string[];
  };
}

export interface VariantGenerationResult {
  campaignId: string;
  variants: ContentVariant[];
  combinations: VariantCombination[];
  recommendations: {
    highestConfidence: string[];
    brandAligned: string[];
    experimental: string[];
  };
  generatedAt: Date;
}

export interface VariantCombination {
  id: string;
  name: string;
  variants: ContentVariant[];
  expectedPerformance: number;
  riskLevel: 'low' | 'medium' | 'high';
  testDuration: number; // minutes
}

export class CampaignVariantGenerator extends AbstractAgent {
  private memoryStore: AgentMemoryStore;

  constructor(memoryStore: AgentMemoryStore) {
    super('campaign-variant-generator', {
      generate_variants: 'Creates multiple content variations for A/B testing',
      analyze_performance: 'Analyzes which variant types perform best historically',
      optimize_generation: 'Improves variant quality based on past results',
      merge_winners: 'Combines best-performing elements from multiple variants',
    });

    this.memoryStore = memoryStore;
  }

  /**
   * Generate content variants for A/B testing
   */
  async generateVariants(request: VariantGenerationRequest): Promise<VariantGenerationResult> {
    try {
      console.log(
        `🔀 Generating ${request.variantCount} variants for campaign ${request.campaignId}`
      );

      // Retrieve historical performance data for this audience
      const historicalData = await this.memoryStore.recall(
        `audience_performance_${request.targetAudience}`
      );

      const variants: ContentVariant[] = [];

      // Generate variants for each requested type
      for (const variantType of request.variantTypes) {
        const typeVariants = await this.generateVariantsByType(
          variantType,
          request,
          historicalData
        );
        variants.push(...typeVariants);
      }

      // Create smart combinations
      const combinations = this.createVariantCombinations(variants, request.variantCount);

      // Generate recommendations
      const recommendations = this.generateRecommendations(variants, combinations);

      const result: VariantGenerationResult = {
        campaignId: request.campaignId,
        variants,
        combinations,
        recommendations,
        generatedAt: new Date(),
      };

      // Store for future optimization
      await this.memoryStore.store(`variant_generation_${request.campaignId}`, result, [
        'ab_testing',
        'content_generation',
        request.targetAudience,
      ]);

      return result;
    } catch (error) {
      console.error('❌ Variant generation failed:', error);
      throw new Error(`Variant generation failed: ${error}`);
    }
  }

  /**
   * Generate variants for a specific content type
   */
  private async generateVariantsByType(
    type: ContentVariant['type'],
    request: VariantGenerationRequest,
    historicalData: any
  ): Promise<ContentVariant[]> {
    const variants: ContentVariant[] = [];

    switch (type) {
      case 'subject':
        variants.push(...(await this.generateSubjectVariants(request, historicalData)));
        break;
      case 'copy':
        variants.push(...(await this.generateCopyVariants(request, historicalData)));
        break;
      case 'visual':
        variants.push(...(await this.generateVisualVariants(request, historicalData)));
        break;
      case 'cta':
        variants.push(...(await this.generateCTAVariants(request, historicalData)));
        break;
      case 'timing':
        variants.push(...(await this.generateTimingVariants(request, historicalData)));
        break;
    }

    return variants;
  }

  /**
   * Generate subject line variants
   */
  private async generateSubjectVariants(
    request: VariantGenerationRequest,
    historicalData: any
  ): Promise<ContentVariant[]> {
    const originalSubject = request.content.subject || 'Your Campaign Update';

    // Use historical data to determine what works for this audience
    const topPerformingPatterns = historicalData?.subjectPatterns || [
      'personalization',
      'urgency',
      'curiosity',
      'benefit-focused',
      'question-based',
    ];

    const variants: ContentVariant[] = [];

    // Generate variants based on proven patterns
    for (let i = 0; i < request.variantCount; i++) {
      const pattern = topPerformingPatterns[i % topPerformingPatterns.length];
      let variantSubject = originalSubject;
      let confidence = 0.75;

      switch (pattern) {
        case 'personalization':
          variantSubject = `{{firstName}}, ${originalSubject.toLowerCase()}`;
          confidence = 0.82;
          break;
        case 'urgency':
          variantSubject = `🔥 Limited Time: ${originalSubject}`;
          confidence = 0.78;
          break;
        case 'curiosity':
          variantSubject = `The secret behind ${originalSubject.toLowerCase()}`;
          confidence = 0.75;
          break;
        case 'benefit-focused':
          variantSubject = `Get 3x better results: ${originalSubject}`;
          confidence = 0.8;
          break;
        case 'question-based':
          variantSubject = `Ready to ${originalSubject.toLowerCase()}?`;
          confidence = 0.73;
          break;
      }

      variants.push({
        id: `subject_${pattern}_${i}`,
        type: 'subject',
        original: originalSubject,
        variant: variantSubject,
        confidence,
        brandAlignment: this.calculateBrandAlignment(variantSubject, request.constraints),
        expectedPerformance: confidence * 0.9 + Math.random() * 0.2,
        tags: [pattern, 'subject_line'],
      });
    }

    return variants;
  }

  /**
   * Generate email copy variants
   */
  private async generateCopyVariants(
    request: VariantGenerationRequest,
    historicalData: any
  ): Promise<ContentVariant[]> {
    const originalCopy = request.content.body || 'Welcome to our campaign!';
    const variants: ContentVariant[] = [];

    const copyStyles = [
      'conversational',
      'professional',
      'storytelling',
      'data_driven',
      'emotional',
    ];

    for (let i = 0; i < request.variantCount; i++) {
      const style = copyStyles[i % copyStyles.length];
      let variantCopy = originalCopy;
      let confidence = 0.7;

      // Generate style-specific variations
      switch (style) {
        case 'conversational':
          variantCopy = `Hey there! ${originalCopy} Let me know what you think!`;
          confidence = 0.75;
          break;
        case 'professional':
          variantCopy = `Dear Valued Customer,\n\n${originalCopy}\n\nBest regards,\nThe Team`;
          confidence = 0.72;
          break;
        case 'storytelling':
          variantCopy = `Here's what happened when we ${originalCopy.toLowerCase()}...\n\n[Story continues]`;
          confidence = 0.78;
          break;
        case 'data_driven':
          variantCopy = `Based on our analysis, ${originalCopy} Here are the numbers...`;
          confidence = 0.73;
          break;
        case 'emotional':
          variantCopy = `This means so much to us... ${originalCopy} ❤️`;
          confidence = 0.76;
          break;
      }

      variants.push({
        id: `copy_${style}_${i}`,
        type: 'copy',
        original: originalCopy,
        variant: variantCopy,
        confidence,
        brandAlignment: this.calculateBrandAlignment(variantCopy, request.constraints),
        expectedPerformance: confidence * 0.85 + Math.random() * 0.3,
        tags: [style, 'email_copy'],
      });
    }

    return variants;
  }

  /**
   * Generate visual theme variants
   */
  private async generateVisualVariants(
    request: VariantGenerationRequest,
    historicalData: any
  ): Promise<ContentVariant[]> {
    const originalVisual = request.content.visualTheme || 'modern_minimal';
    const variants: ContentVariant[] = [];

    const visualThemes = [
      'neon_futuristic',
      'clean_professional',
      'warm_friendly',
      'bold_dramatic',
      'elegant_luxury',
    ];

    for (let i = 0; i < request.variantCount; i++) {
      const theme = visualThemes[i % visualThemes.length];

      variants.push({
        id: `visual_${theme}_${i}`,
        type: 'visual',
        original: originalVisual,
        variant: theme,
        confidence: 0.7 + Math.random() * 0.25,
        brandAlignment: this.calculateVisualBrandAlignment(theme),
        expectedPerformance: 0.65 + Math.random() * 0.3,
        tags: [theme, 'visual_design'],
      });
    }

    return variants;
  }

  /**
   * Generate CTA variants
   */
  private async generateCTAVariants(
    request: VariantGenerationRequest,
    historicalData: any
  ): Promise<ContentVariant[]> {
    const originalCTA = request.content.cta || 'Learn More';
    const variants: ContentVariant[] = [];

    const ctaStyles = [
      'action_focused',
      'benefit_focused',
      'urgency_focused',
      'curiosity_focused',
      'social_proof',
    ];

    const ctaTemplates = {
      action_focused: ['Get Started Now', 'Take Action', 'Join Today', 'Start Your Journey'],
      benefit_focused: [
        'Get Your Free Trial',
        'Unlock Premium',
        'Save 50% Today',
        'Double Your Results',
      ],
      urgency_focused: ['Limited Time Offer', 'Only 24 Hours Left', "Don't Miss Out", 'Act Fast'],
      curiosity_focused: [
        "See What's Inside",
        'Discover the Secret',
        'Find Out How',
        'Reveal the Answer',
      ],
      social_proof: [
        'Join 10K+ Users',
        'See Why Others Choose Us',
        'Trusted by Thousands',
        'Be Part of the Community',
      ],
    };

    for (let i = 0; i < request.variantCount; i++) {
      const style = ctaStyles[i % ctaStyles.length];
      const templates = ctaTemplates[style];
      const variantCTA = templates[Math.floor(Math.random() * templates.length)];

      variants.push({
        id: `cta_${style}_${i}`,
        type: 'cta',
        original: originalCTA,
        variant: variantCTA,
        confidence: 0.75 + Math.random() * 0.2,
        brandAlignment: this.calculateBrandAlignment(variantCTA, request.constraints),
        expectedPerformance: 0.7 + Math.random() * 0.25,
        tags: [style, 'call_to_action'],
      });
    }

    return variants;
  }

  /**
   * Generate timing variants
   */
  private async generateTimingVariants(
    request: VariantGenerationRequest,
    historicalData: any
  ): Promise<ContentVariant[]> {
    const variants: ContentVariant[] = [];

    // Optimal sending times based on historical data
    const optimalTimes = historicalData?.optimalTimes || [
      { day: 'Tuesday', hour: 10, performance: 0.85 },
      { day: 'Wednesday', hour: 14, performance: 0.82 },
      { day: 'Thursday', hour: 9, performance: 0.8 },
      { day: 'Friday', hour: 11, performance: 0.78 },
      { day: 'Saturday', hour: 13, performance: 0.75 },
    ];

    for (let i = 0; i < Math.min(request.variantCount, optimalTimes.length); i++) {
      const timing = optimalTimes[i];

      variants.push({
        id: `timing_${timing.day}_${timing.hour}_${i}`,
        type: 'timing',
        original: 'Default send time',
        variant: `${timing.day} at ${timing.hour}:00`,
        confidence: timing.performance,
        brandAlignment: 0.9, // Timing doesn't affect brand alignment much
        expectedPerformance: timing.performance,
        tags: ['timing', timing.day.toLowerCase()],
      });
    }

    return variants;
  }

  /**
   * Create smart combinations of variants
   */
  private createVariantCombinations(
    variants: ContentVariant[],
    maxCombinations: number
  ): VariantCombination[] {
    const combinations: VariantCombination[] = [];

    // Group variants by type
    const variantsByType = variants.reduce(
      (acc, variant) => {
        if (!acc[variant.type]) acc[variant.type] = [];
        acc[variant.type].push(variant);
        return acc;
      },
      {} as Record<string, ContentVariant[]>
    );

    // Create combinations by mixing high-performing variants
    for (let i = 0; i < maxCombinations; i++) {
      const combination: ContentVariant[] = [];
      let totalPerformance = 0;
      let riskLevel: 'low' | 'medium' | 'high' = 'low';

      // Pick one variant from each type
      Object.entries(variantsByType).forEach(([type, typeVariants]) => {
        if (typeVariants.length > 0) {
          // Weighted selection based on performance
          const variant = this.selectVariantByPerformance(typeVariants, i);
          combination.push(variant);
          totalPerformance += variant.expectedPerformance;

          if (variant.expectedPerformance < 0.7) riskLevel = 'high';
          else if (variant.expectedPerformance < 0.8) riskLevel = 'medium';
        }
      });

      const avgPerformance = totalPerformance / combination.length;

      combinations.push({
        id: `combination_${i}`,
        name: `Test Variant ${String.fromCharCode(65 + i)}`, // A, B, C, etc.
        variants: combination,
        expectedPerformance: avgPerformance,
        riskLevel,
        testDuration: this.calculateTestDuration(avgPerformance, riskLevel),
      });
    }

    return combinations.sort((a, b) => b.expectedPerformance - a.expectedPerformance);
  }

  /**
   * Select variant using weighted performance selection
   */
  private selectVariantByPerformance(variants: ContentVariant[], seed: number): ContentVariant {
    // Sort by performance and add some randomization
    const sorted = variants.sort((a, b) => b.expectedPerformance - a.expectedPerformance);

    // Use seed to create deterministic but varied selection
    const index = Math.floor((seed * 0.3 + Math.random() * 0.7) * sorted.length);
    return sorted[Math.min(index, sorted.length - 1)];
  }

  /**
   * Generate recommendations for testing
   */
  private generateRecommendations(variants: ContentVariant[], combinations: VariantCombination[]) {
    const highConfidenceVariants = variants.filter(v => v.confidence > 0.8).map(v => v.id);

    const brandAlignedVariants = variants.filter(v => v.brandAlignment > 0.85).map(v => v.id);

    const experimentalVariants = variants
      .filter(v => v.confidence < 0.7 && v.expectedPerformance > 0.75)
      .map(v => v.id);

    return {
      highestConfidence: highConfidenceVariants.slice(0, 3),
      brandAligned: brandAlignedVariants.slice(0, 3),
      experimental: experimentalVariants.slice(0, 2),
    };
  }

  /**
   * Calculate brand alignment score
   */
  private calculateBrandAlignment(content: string, constraints?: any): number {
    let score = 0.8; // Base score

    if (constraints?.tone) {
      // Check if content matches desired tone
      if (constraints.tone === 'professional' && content.includes('Dear')) score += 0.1;
      if (constraints.tone === 'casual' && content.includes('Hey')) score += 0.1;
    }

    if (constraints?.keywords) {
      // Check keyword inclusion
      const keywordMatches = constraints.keywords.filter((keyword: string) =>
        content.toLowerCase().includes(keyword.toLowerCase())
      ).length;
      score += (keywordMatches / constraints.keywords.length) * 0.1;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Calculate visual brand alignment
   */
  private calculateVisualBrandAlignment(theme: string): number {
    const brandThemes = {
      neon_futuristic: 0.95, // Matches NeonHub brand
      clean_professional: 0.75,
      warm_friendly: 0.65,
      bold_dramatic: 0.8,
      elegant_luxury: 0.7,
    };

    return brandThemes[theme as keyof typeof brandThemes] || 0.7;
  }

  /**
   * Calculate optimal test duration based on performance and risk
   */
  private calculateTestDuration(performance: number, riskLevel: string): number {
    let baseDuration = 1440; // 24 hours in minutes

    if (riskLevel === 'high') baseDuration *= 2; // Test longer for risky variants
    if (performance > 0.85) baseDuration *= 0.75; // Test shorter for high-confidence variants

    return Math.round(baseDuration);
  }

  /**
   * Merge winning elements from multiple variants
   */
  async mergeWinningVariants(
    winningVariants: ContentVariant[],
    performanceData: Record<string, number>
  ): Promise<ContentVariant> {
    // Find the best-performing element from each type
    const bestByType: Record<string, ContentVariant> = {};

    winningVariants.forEach(variant => {
      const performance = performanceData[variant.id] || 0;
      if (
        !bestByType[variant.type] ||
        performance > (performanceData[bestByType[variant.type].id] || 0)
      ) {
        bestByType[variant.type] = variant;
      }
    });

    // Create merged variant
    const mergedVariant: ContentVariant = {
      id: `merged_${Date.now()}`,
      type: 'copy', // Default type for merged content
      original: 'Original content',
      variant: 'Merged best-performing elements',
      confidence: 0.9, // High confidence from proven elements
      brandAlignment:
        Object.values(bestByType).reduce((sum, v) => sum + v.brandAlignment, 0) /
        Object.keys(bestByType).length,
      expectedPerformance:
        Object.values(bestByType).reduce((sum, v) => sum + v.expectedPerformance, 0) /
        Object.keys(bestByType).length,
      tags: ['merged', 'optimized', ...Object.values(bestByType).flatMap(v => v.tags)],
    };

    return mergedVariant;
  }
}
