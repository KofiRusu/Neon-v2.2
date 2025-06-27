import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import {
  BrandVoiceAgent,
  type BrandVoiceContext,
  type BrandVoiceResult,
} from './brand-voice-agent';
import type { AgentPayload } from '../base-agent';

describe('BrandVoiceAgent', () => {
  let agent: BrandVoiceAgent;

  beforeEach(() => {
    agent = new BrandVoiceAgent();
  });

  afterEach(() => {
    // Clean up any resources
  });

  describe('Basic Agent Functionality', () => {
    it('should initialize with correct properties', () => {
      expect(agent.agentId).toBe('brand-voice-agent');
      expect(agent.agentName).toBe('BrandVoiceAgent');
      expect(agent.agentType).toBe('brand_voice');
      expect(agent.capabilities).toContain('analyze_content');
      expect(agent.capabilities).toContain('score_content');
      expect(agent.capabilities).toContain('generate_suggestions');
    });

    it('should have required methods', () => {
      expect(typeof agent.execute).toBe('function');
      expect(typeof agent.analyzeContentPublic).toBe('function');
      expect(typeof agent.scoreContentPublic).toBe('function');
      expect(typeof agent.getSuggestionsPublic).toBe('function');
    });
  });

  describe('Content Analysis', () => {
    it('should analyze content and return voice score', async () => {
      const content =
        'Our innovative AI-powered solution helps optimize your business strategy efficiently.';

      const result = await agent.analyzeContentPublic(content, 'general');

      expect(result.success).toBe(true);
      expect(typeof result.voiceScore).toBe('number');
      expect(result.voiceScore).toBeGreaterThan(0);
      expect(result.voiceScore).toBeLessThanOrEqual(100);
      expect(result.analysis).toBeDefined();
      expect(result.suggestions).toBeDefined();
      expect(Array.isArray(result.suggestions)).toBe(true);
    });

    it('should return higher scores for brand-aligned content', async () => {
      const brandAlignedContent =
        'NeonHub provides innovative AI-powered automation solutions to optimize your marketing strategy and drive business growth efficiently.';
      const genericContent =
        'This is just some random text without any specific brand terms or professional language.';

      const brandResult = await agent.analyzeContentPublic(brandAlignedContent, 'general');
      const genericResult = await agent.analyzeContentPublic(genericContent, 'general');

      expect(brandResult.success).toBe(true);
      expect(genericResult.success).toBe(true);
      expect(brandResult.voiceScore).toBeGreaterThan(genericResult.voiceScore!);
    });

    it('should provide detailed analysis', async () => {
      const content =
        'Our professional team delivers innovative solutions for your business needs.';

      const result = await agent.analyzeContentPublic(content, 'email');

      expect(result.success).toBe(true);
      expect(result.analysis).toBeDefined();
      expect(result.analysis!.toneAnalysis).toBeDefined();
      expect(result.analysis!.sentimentScore).toBeDefined();
      expect(result.analysis!.brandAlignment).toBeDefined();
      expect(result.analysis!.readabilityScore).toBeDefined();
      expect(result.analysis!.keywordUsage).toBeDefined();
      expect(result.analysis!.wordCount).toBeGreaterThan(0);
      expect(result.analysis!.characterCount).toBeGreaterThan(0);
    });
  });

  describe('Content Scoring', () => {
    it('should score content and return voice score', async () => {
      const content = 'Professional business solution for optimal results.';

      const result = await agent.scoreContentPublic(content);

      expect(result.success).toBe(true);
      expect(typeof result.voiceScore).toBe('number');
      expect(result.voiceScore).toBeGreaterThanOrEqual(0);
      expect(result.voiceScore).toBeLessThanOrEqual(100);
      expect(result.analysis).toBeDefined();
    });

    it('should handle empty content gracefully', async () => {
      await expect(agent.scoreContentPublic('')).rejects.toThrow('Content is required for scoring');
    });
  });

  describe('Suggestion Generation', () => {
    it('should generate suggestions for content improvement', async () => {
      const poorContent = 'bad text with terrible writing and awful grammar mistakes everywhere.';

      const result = await agent.getSuggestionsPublic(poorContent, 'general');

      expect(result.success).toBe(true);
      expect(result.suggestions).toBeDefined();
      expect(Array.isArray(result.suggestions)).toBe(true);
      expect(result.suggestions!.length).toBeGreaterThan(0);

      // Check suggestion structure
      const suggestion = result.suggestions![0];
      if (suggestion) {
        expect(suggestion.type).toBeDefined();
        expect(suggestion.issue).toBeDefined();
        expect(suggestion.suggestion).toBeDefined();
        expect(suggestion.priority).toBeDefined();
        expect(['low', 'medium', 'high']).toContain(suggestion.priority);
      }
    });

    it('should provide fewer suggestions for well-written content', async () => {
      const goodContent =
        'NeonHub delivers innovative AI-powered automation solutions that help businesses optimize their marketing strategies efficiently and professionally.';
      const poorContent = 'bad terrible awful content with no brand terms and negative sentiment.';

      const goodResult = await agent.getSuggestionsPublic(goodContent, 'general');
      const poorResult = await agent.getSuggestionsPublic(poorContent, 'general');

      expect(goodResult.success).toBe(true);
      expect(poorResult.success).toBe(true);
      expect(goodResult.suggestions!.length).toBeLessThanOrEqual(poorResult.suggestions!.length);
    });

    it('should handle missing content', async () => {
      await expect(agent.getSuggestionsPublic('')).rejects.toThrow(
        'Content is required for suggestions'
      );
    });
  });

  describe('Guidelines Management', () => {
    it('should retrieve brand voice guidelines', async () => {
      const result = (await agent.execute({
        task: 'get_guidelines',
        context: { action: 'get_guidelines' },
        priority: 'medium',
      })) as BrandVoiceResult;

      expect(result.success).toBe(true);
      expect(result.guidelines).toBeDefined();
      expect(result.guidelines!.tone).toBeDefined();
      expect(result.guidelines!.vocabulary).toBeDefined();
      expect(result.guidelines!.style).toBeDefined();
      expect(result.guidelines!.messaging).toBeDefined();
    });

    it('should have structured guidelines', async () => {
      const result = (await agent.execute({
        task: 'get_guidelines',
        context: { action: 'get_guidelines' },
        priority: 'medium',
      })) as BrandVoiceResult;

      expect(result.success).toBe(true);
      expect(result.guidelines!.tone.primary).toBeDefined();
      expect(result.guidelines!.vocabulary.preferred).toBeDefined();
      expect(Array.isArray(result.guidelines!.vocabulary.preferred)).toBe(true);
      expect(result.guidelines!.messaging.keyMessages).toBeDefined();
      expect(Array.isArray(result.guidelines!.messaging.keyMessages)).toBe(true);
    });
  });

  describe('Public API Methods', () => {
    it('should work with analyzeContentPublic', async () => {
      const content = 'Test content for analysis';
      const result = await agent.analyzeContentPublic(content, 'general');

      expect(result.success).toBe(true);
      expect(result.voiceScore).toBeDefined();
      expect(result.analysis).toBeDefined();
      expect(result.suggestions).toBeDefined();
    });

    it('should work with scoreContentPublic', async () => {
      const content = 'Test content for scoring';
      const result = await agent.scoreContentPublic(content);

      expect(result.success).toBe(true);
      expect(result.voiceScore).toBeDefined();
      expect(result.analysis).toBeDefined();
    });

    it('should work with getSuggestionsPublic', async () => {
      const content = 'Test content for suggestions';
      const result = await agent.getSuggestionsPublic(content, 'general');

      expect(result.success).toBe(true);
      expect(result.suggestions).toBeDefined();
      expect(Array.isArray(result.suggestions)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid action', async () => {
      await expect(
        agent.execute({
          task: 'invalid_action',
          context: { action: 'invalid' as any },
          priority: 'medium',
        })
      ).rejects.toThrow('Unknown action: invalid');
    });

    it('should handle missing action', async () => {
      await expect(
        agent.execute({
          task: 'missing_action',
          context: {} as BrandVoiceContext,
          priority: 'medium',
        })
      ).rejects.toThrow('Missing required context: action is required');
    });

    it('should handle missing content for analysis', async () => {
      await expect(
        agent.execute({
          task: 'analyze_content',
          context: { action: 'analyze' },
          priority: 'medium',
        })
      ).rejects.toThrow('Content is required for analysis');
    });
  });

  describe('Performance', () => {
    it('should analyze content within reasonable time', async () => {
      const content =
        'NeonHub AI-powered automation solution optimizes marketing strategies efficiently.';
      const startTime = Date.now();

      const result = await agent.analyzeContentPublic(content, 'general');
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle large content', async () => {
      const largeContent = 'NeonHub provides innovative solutions. '.repeat(100);

      const result = await agent.analyzeContentPublic(largeContent, 'blog');

      expect(result.success).toBe(true);
      expect(result.voiceScore).toBeDefined();
      expect(result.analysis!.wordCount).toBeGreaterThan(200);
    });
  });
});
