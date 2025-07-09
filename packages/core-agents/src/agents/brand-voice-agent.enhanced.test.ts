import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { BrandVoiceAgent, type BrandVoiceContext, type BrandVoiceResult } from './brand-voice-agent';

describe('Enhanced BrandVoiceAgent - Tone Targeting & Adaptation', () => {
  let agent: BrandVoiceAgent;

  beforeEach(() => {
    agent = new BrandVoiceAgent();
  });

  afterEach(() => {
    // Clean up any mocks or spies
    jest.clearAllMocks();
  });

  describe('Tone Adaptation for Segments', () => {
    it('should successfully adapt tone for enterprise segment', async () => {
      const context: BrandVoiceContext = {
        action: 'adapt_tone',
        content: 'Our platform helps your business grow with easy-to-use tools.',
        audienceSegment: 'enterprise',
        contentType: 'email'
      };

      const result = (await agent.execute({
        task: 'adapt_tone',
        context,
        priority: 'medium'
      })) as BrandVoiceResult;

      expect(result.success).toBe(true);
      expect(result.toneAdaptation).toBeDefined();
      expect(result.toneAdaptation?.adaptedTone).toContain('authoritative');
      expect(result.toneAdaptation?.confidence).toBeGreaterThan(0.6);
      expect(result.analysis?.segmentAlignment).toBeGreaterThan(0);
    });

    it('should apply fallback tone when target tone misalignment detected', async () => {
      const context: BrandVoiceContext = {
        action: 'adapt_tone',
        content: 'Hey there! Check out this awesome stuff we got!',
        audienceSegment: 'enterprise',
        targetTone: 'authoritative and strategic',
        fallbackTone: 'professional and consultative'
      };

      const result = (await agent.execute({
        task: 'adapt_tone',
        context,
        priority: 'medium'
      })) as BrandVoiceResult;

      expect(result.success).toBe(true);
      expect(result.toneAdaptation).toBeDefined();
      expect(result.toneAdaptation?.confidence).toBeLessThan(0.8);
      expect(result.toneAdaptation?.adaptedTone).toContain('professional');
      expect(result.toneAdaptation?.reasoning).toContain('fallback');
    });

    it('should provide segment-specific suggestions', async () => {
      const context: BrandVoiceContext = {
        action: 'adapt_tone',
        content: 'We help companies optimize their workflows.',
        audienceSegment: 'saas',
        contentType: 'blog'
      };

      const result = (await agent.execute({
        task: 'adapt_tone',
        context,
        priority: 'medium'
      })) as BrandVoiceResult;

      expect(result.success).toBe(true);
      expect(result.suggestions).toBeDefined();
      expect(result.suggestions!.length).toBeGreaterThan(0);
      
      const hasSegmentSpecificSuggestion = result.suggestions!.some(
        suggestion => suggestion.suggestion.toLowerCase().includes('saas') ||
                     suggestion.suggestion.toLowerCase().includes('technical') ||
                     suggestion.suggestion.toLowerCase().includes('api')
      );
      expect(hasSegmentSpecificSuggestion).toBe(true);
    });

    it('should handle unknown segment gracefully with fallback', async () => {
      const context: BrandVoiceContext = {
        action: 'adapt_tone',
        content: 'Hello, welcome to our platform!',
        audienceSegment: 'unknown_segment' as any,
        contentType: 'general'
      };

      const result = (await agent.execute({
        task: 'adapt_tone',
        context,
        priority: 'medium'
      })) as BrandVoiceResult;

      expect(result.success).toBe(true);
      expect(result.toneAdaptation?.adaptedTone).toContain('friendly'); // consumer fallback
    });
  });

  describe('Tone Recommendations', () => {
    it('should provide comprehensive tone recommendations for all segments', async () => {
      const context: BrandVoiceContext = {
        action: 'get_tone_recommendations'
      };

      const result = (await agent.execute({
        task: 'get_tone_recommendations',
        context,
        priority: 'medium'
      })) as BrandVoiceResult;

      expect(result.success).toBe(true);
      expect(result.toneRecommendations).toBeDefined();
      expect(result.toneRecommendations!.length).toBe(8); // All segments

      const enterpriseRec = result.toneRecommendations!.find(rec => rec.segment === 'enterprise');
      expect(enterpriseRec).toBeDefined();
      expect(enterpriseRec!.recommendedTone).toContain('authoritative');
      expect(enterpriseRec!.examples.length).toBeGreaterThan(0);
      expect(enterpriseRec!.fallbackTones.length).toBeGreaterThan(0);
    });

    it('should include reasoning and examples for each segment', async () => {
      const context: BrandVoiceContext = {
        action: 'get_tone_recommendations'
      };

      const result = (await agent.execute({
        task: 'get_tone_recommendations',
        context,
        priority: 'medium'
      })) as BrandVoiceResult;

      expect(result.success).toBe(true);
      
      result.toneRecommendations!.forEach(recommendation => {
        expect(recommendation.reasoning).toBeDefined();
        expect(recommendation.reasoning.length).toBeGreaterThan(10);
        expect(recommendation.examples.length).toBe(3);
        expect(recommendation.fallbackTones.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Segment-Specific Tone Analysis', () => {
    it('should calculate segment alignment scores correctly', async () => {
      const goodContent = 'Strategic implementation of enterprise-grade AI automation solutions that drive operational efficiency and competitive advantage.';
      
      const context: BrandVoiceContext = {
        action: 'analyze_audience',
        content: goodContent,
        audienceSegment: 'enterprise',
        contentType: 'email'
      };

      const result = (await agent.execute({
        task: 'analyze_audience',
        context,
        priority: 'medium'
      })) as BrandVoiceResult;

      expect(result.success).toBe(true);
      expect(result.analysis?.segmentAlignment).toBeGreaterThan(70);
      expect(result.voiceScore).toBeGreaterThan(70);
    });

    it('should detect poor segment alignment and provide specific suggestions', async () => {
      const poorContent = 'Hey guys! This is so cool and super easy to use!';
      
      const context: BrandVoiceContext = {
        action: 'analyze_audience',
        content: poorContent,
        audienceSegment: 'enterprise',
        contentType: 'email'
      };

      const result = (await agent.execute({
        task: 'analyze_audience',
        context,
        priority: 'medium'
      })) as BrandVoiceResult;

      expect(result.success).toBe(true);
      expect(result.analysis?.segmentAlignment).toBeLessThan(50);
      expect(result.suggestions!.length).toBeGreaterThan(0);
      
      const hasToneSuggestion = result.suggestions!.some(
        suggestion => suggestion.type === 'tone' && suggestion.priority === 'high'
      );
      expect(hasToneSuggestion).toBe(true);
    });
  });

  describe('Context-Aware Personalization', () => {
    it('should consider user persona in tone adaptation', async () => {
      const context: BrandVoiceContext = {
        action: 'adapt_tone',
        content: 'Our solution increases efficiency.',
        audienceSegment: 'enterprise',
        contextMetadata: {
          userPersona: 'CTO',
          engagementLevel: 'high',
          previousInteractions: 5
        }
      };

      const result = (await agent.execute({
        task: 'adapt_tone',
        context,
        priority: 'medium'
      })) as BrandVoiceResult;

      expect(result.success).toBe(true);
      expect(result.toneAdaptation?.confidence).toBeGreaterThan(0.7);
    });

    it('should adjust tone based on engagement level', async () => {
      const lowEngagementContext: BrandVoiceContext = {
        action: 'adapt_tone',
        content: 'Check out our new features.',
        audienceSegment: 'smb',
        contextMetadata: {
          engagementLevel: 'low',
          previousInteractions: 1
        }
      };

      const highEngagementContext: BrandVoiceContext = {
        action: 'adapt_tone',
        content: 'Check out our new features.',
        audienceSegment: 'smb',
        contextMetadata: {
          engagementLevel: 'high',
          previousInteractions: 10
        }
      };

      const lowResult = (await agent.execute({
        task: 'adapt_tone',
        context: lowEngagementContext,
        priority: 'medium'
      })) as BrandVoiceResult;

      const highResult = (await agent.execute({
        task: 'adapt_tone',
        context: highEngagementContext,
        priority: 'medium'
      })) as BrandVoiceResult;

      expect(lowResult.success).toBe(true);
      expect(highResult.success).toBe(true);
      
      // High engagement should result in more confident tone adaptation
      expect(highResult.toneAdaptation?.confidence).toBeGreaterThanOrEqual(
        lowResult.toneAdaptation?.confidence || 0
      );
    });
  });

  describe('Fallback Mechanism Testing', () => {
    it('should use fallback tone when primary tone confidence is low', async () => {
      const context: BrandVoiceContext = {
        action: 'adapt_tone',
        content: 'Sup everyone! This rocks!',
        audienceSegment: 'investor',
        targetTone: 'confident and data-driven',
        fallbackTone: 'analytical and strategic'
      };

      const result = (await agent.execute({
        task: 'adapt_tone',
        context,
        priority: 'medium'
      })) as BrandVoiceResult;

      expect(result.success).toBe(true);
      expect(result.toneAdaptation?.adaptedTone).not.toEqual(context.targetTone);
      expect(result.toneAdaptation?.adaptedTone).toEqual(context.fallbackTone);
      expect(result.toneAdaptation?.reasoning).toContain('fallback');
    });

    it('should suggest alternative fallback tones when provided fallback also fails', async () => {
      const context: BrandVoiceContext = {
        action: 'adapt_tone',
        content: 'YOLO! This is fire 🔥🔥🔥',
        audienceSegment: 'enterprise',
        targetTone: 'authoritative and strategic',
        fallbackTone: 'professional and consultative'
      };

      const result = (await agent.execute({
        task: 'adapt_tone',
        context,
        priority: 'medium'
      })) as BrandVoiceResult;

      expect(result.success).toBe(true);
      
      const hasAlternativeSuggestion = result.suggestions!.some(
        suggestion => suggestion.type === 'tone' && 
                     suggestion.suggestion.includes('Alternative tones')
      );
      expect(hasAlternativeSuggestion).toBe(true);
    });
  });

  describe('Integration with Brand Configuration', () => {
    it('should respect brand voice configuration audience segments', async () => {
      const context: BrandVoiceContext = {
        action: 'analyze_audience',
        content: 'Scalable enterprise solutions',
        audienceSegment: 'enterprise',
        contentType: 'general'
      };

      const result = (await agent.execute({
        task: 'analyze_audience',
        context,
        priority: 'medium'
      })) as BrandVoiceResult;

      expect(result.success).toBe(true);
      expect(result.analysis?.audienceSegment).toBe('enterprise');
      expect(result.analysis?.audienceConfig).toBeDefined();
      expect(result.analysis?.audienceConfig.tone).toContain('authoritative');
    });

    it('should provide brand configuration when requested', async () => {
      const brandConfig = agent.getBrandConfig();
      
      expect(brandConfig).toBeDefined();
      expect(brandConfig.audienceSegments).toBeDefined();
      expect(brandConfig.audienceSegments.enterprise).toBeDefined();
      expect(brandConfig.audienceSegments.enterprise.tone).toContain('authoritative');
      expect(brandConfig.audienceSegments.enterprise.vocabulary.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle missing content gracefully', async () => {
      const context: BrandVoiceContext = {
        action: 'adapt_tone',
        audienceSegment: 'enterprise'
      };

      const result = (await agent.execute({
        task: 'adapt_tone',
        context,
        priority: 'medium'
      })) as BrandVoiceResult;

      expect(result.success).toBe(false);
      expect(result.error).toContain('Content is required');
    });

    it('should handle missing audience segment gracefully', async () => {
      const context: BrandVoiceContext = {
        action: 'adapt_tone',
        content: 'Test content'
      };

      const result = (await agent.execute({
        task: 'adapt_tone',
        context,
        priority: 'medium'
      })) as BrandVoiceResult;

      expect(result.success).toBe(false);
      expect(result.error).toContain('Audience segment is required');
    });

    it('should handle unknown actions gracefully', async () => {
      const context: BrandVoiceContext = {
        action: 'unknown_action' as any,
        content: 'Test content'
      };

      const result = (await agent.execute({
        task: 'unknown_action',
        context,
        priority: 'medium'
      })) as BrandVoiceResult;

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown action');
    });
  });

  describe('Performance and Metadata', () => {
    it('should include execution metadata in results', async () => {
      const context: BrandVoiceContext = {
        action: 'adapt_tone',
        content: 'Test content for performance',
        audienceSegment: 'enterprise'
      };

      const startTime = Date.now();
      const result = (await agent.execute({
        task: 'adapt_tone',
        context,
        priority: 'medium'
      })) as BrandVoiceResult;
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(result.metadata).toBeDefined();
      expect(result.metadata!.timestamp).toBeDefined();
      expect(result.metadata!.duration).toBeDefined();
      expect(result.metadata!.duration).toBeGreaterThanOrEqual(0);
      expect(result.metadata!.duration).toBeLessThan(endTime - startTime + 100); // Allow some tolerance
    });

    it('should execute within reasonable time limits', async () => {
      const context: BrandVoiceContext = {
        action: 'get_tone_recommendations'
      };

      const startTime = Date.now();
      const result = (await agent.execute({
        task: 'get_tone_recommendations',
        context,
        priority: 'medium'
      })) as BrandVoiceResult;
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });
});

describe('Brand Voice Agent Capabilities', () => {
  let agent: BrandVoiceAgent;

  beforeEach(() => {
    agent = new BrandVoiceAgent();
  });

  it('should have correct version and capabilities', () => {
    expect(agent.version).toBe('2.0.0');
    expect(agent.capabilities).toContain('tone_analysis');
    expect(agent.capabilities).toContain('brand_alignment');
    expect(agent.capabilities).toContain('audience_segmentation');
    expect(agent.capabilities).toContain('tone_adaptation');
    expect(agent.capabilities).toContain('personalization');
  });
});