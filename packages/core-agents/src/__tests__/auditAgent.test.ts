/**
 * Tests for AuditAgent - Quality Control Agent
 */

import { AuditAgent } from '../auditAgent';
import { logEvent, logPerformance } from '@neon/utils';

// Mock the database logging utilities
jest.mock('@neon/utils', () => ({
  logEvent: jest.fn(),
  logPerformance: jest.fn(),
  withLogging: jest.fn((_agent, _action, fn, _metadata) => {
    // Execute the function directly for testing
    return fn();
  }),
}));

const mockLogEvent = logEvent as jest.MockedFunction<typeof logEvent>;
const mockLogPerformance = logPerformance as jest.MockedFunction<typeof logPerformance>;

describe('AuditAgent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress console warnings during tests
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('evaluateContentOutput', () => {
    it('should evaluate high-quality content with good scores', async () => {
      const content =
        'Discover the amazing benefits of our new product! It will help you improve your daily routine and boost your productivity.';

      const result = await AuditAgent.evaluateContentOutput(content);

      expect(result).toMatchObject({
        clarity: expect.any(Number),
        grammar: expect.any(Number),
        engagement: expect.any(Number),
        overall: expect.any(Number),
      });

      // Check that all scores are within valid range
      expect(result.clarity).toBeGreaterThanOrEqual(0);
      expect(result.clarity).toBeLessThanOrEqual(100);
      expect(result.grammar).toBeGreaterThanOrEqual(0);
      expect(result.grammar).toBeLessThanOrEqual(100);
      expect(result.engagement).toBeGreaterThanOrEqual(0);
      expect(result.engagement).toBeLessThanOrEqual(100);
      expect(result.overall).toBeGreaterThanOrEqual(0);
      expect(result.overall).toBeLessThanOrEqual(100);

      // High-quality content should score reasonably well
      expect(result.overall).toBeGreaterThan(50);
    });

    it('should evaluate poor-quality content with lower scores', async () => {
      const content = 'bad content no caps no punctuation';

      const result = await AuditAgent.evaluateContentOutput(content);

      expect(result.grammar).toBeLessThan(90); // Should be penalized for poor grammar
      expect(result.clarity).toBeLessThan(90); // Should be penalized for lack of structure
    });

    it('should handle empty content gracefully', async () => {
      const result = await AuditAgent.evaluateContentOutput('');

      expect(result).toMatchObject({
        clarity: expect.any(Number),
        grammar: expect.any(Number),
        engagement: expect.any(Number),
        overall: expect.any(Number),
      });
    });

    it('should boost engagement score for action words', async () => {
      const contentWithActionWords =
        'Learn how to boost your productivity and discover amazing results!';
      const contentWithoutActionWords = 'This is some regular text without any special words.';

      const resultWith = await AuditAgent.evaluateContentOutput(contentWithActionWords);
      const resultWithout = await AuditAgent.evaluateContentOutput(contentWithoutActionWords);

      expect(resultWith.engagement).toBeGreaterThan(resultWithout.engagement);
    });
  });

  describe('detectHallucination', () => {
    it('should detect obvious hallucinations', async () => {
      const suspiciousContent =
        'Make $10,000 per day with this guaranteed 100% method! Instant results guaranteed!';

      const result = await AuditAgent.detectHallucination(suspiciousContent);

      expect(result).toBe(true);
      expect(mockLogEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          agent: 'InsightAgent',
          action: 'hallucination_analysis',
          metadata: expect.objectContaining({
            result: true,
            confidence: expect.any(Number),
            reasons: expect.any(Array),
          }),
          success: true,
        })
      );
    });

    it('should not flag legitimate content', async () => {
      const legitimateContent =
        'Our product offers great value and can help improve your workflow efficiency.';

      const result = await AuditAgent.detectHallucination(legitimateContent);

      expect(result).toBe(false);
      expect(mockLogEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'hallucination_analysis',
          metadata: expect.objectContaining({
            result: false,
          }),
        })
      );
    });

    it('should detect contradictory pricing claims', async () => {
      const contradictoryContent = 'Get this amazing free product for the low price of $99!';

      const result = await AuditAgent.detectHallucination(contradictoryContent);

      expect(result).toBe(true);
    });

    it('should flag unrealistic large numbers', async () => {
      const unrealisticContent = 'This method helped 50,000,000 people in just one week!';

      const result = await AuditAgent.detectHallucination(unrealisticContent);

      expect(result).toBe(true);
    });
  });

  describe('logAgentPerformance', () => {
    it('should log agent performance metrics', async () => {
      await AuditAgent.logAgentPerformance('ContentAgent', 85, {
        test: 'metadata',
        source: 'unit_test',
      });

      expect(mockLogPerformance).toHaveBeenCalledWith(
        expect.objectContaining({
          agent: 'ContentAgent',
          score: 85,
          metrics: expect.objectContaining({
            overall_score: 85,
            evaluation_timestamp: expect.any(Number),
          }),
          timestamp: expect.any(Date),
        })
      );

      expect(mockLogEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          agent: 'InsightAgent',
          action: 'performance_logged',
          metadata: expect.objectContaining({
            target_agent: 'ContentAgent',
            score: 85,
            test: 'metadata',
            source: 'unit_test',
          }),
          success: true,
        })
      );
    });

    it('should handle performance logging without metadata', async () => {
      await AuditAgent.logAgentPerformance('AdAgent', 72);

      expect(mockLogPerformance).toHaveBeenCalledWith(
        expect.objectContaining({
          agent: 'AdAgent',
          score: 72,
        })
      );
    });
  });

  describe('auditAgentOutput', () => {
    it('should perform comprehensive audit of agent output', async () => {
      const content = 'Create amazing content that will boost engagement and improve your results!';

      const result = await AuditAgent.auditAgentOutput('ContentAgent', content, 'content');

      expect(result).toMatchObject({
        contentScore: expect.objectContaining({
          clarity: expect.any(Number),
          grammar: expect.any(Number),
          engagement: expect.any(Number),
          overall: expect.any(Number),
        }),
        hallucinationDetected: expect.any(Boolean),
        overallRating: expect.stringMatching(/^(excellent|good|fair|poor)$/),
        recommendations: expect.any(Array),
      });
    });

    it('should rate content as poor if hallucination is detected', async () => {
      const hallucinatedContent = 'Make $50,000 per day guaranteed with this secret method!';

      const result = await AuditAgent.auditAgentOutput('ContentAgent', hallucinatedContent);

      expect(result.hallucinationDetected).toBe(true);
      expect(result.overallRating).toBe('poor');
      expect(result.recommendations).toContain('CRITICAL: Review for false or misleading claims');
    });

    it('should provide specific recommendations based on scores', async () => {
      const poorContent = 'bad content';

      const result = await AuditAgent.auditAgentOutput('ContentAgent', poorContent);

      // Should contain recommendations for improvement
      expect(result.recommendations.length).toBeGreaterThan(0);

      // Check for specific recommendation types
      const recommendationText = result.recommendations.join(' ');
      expect(
        recommendationText.includes('clarity') ||
          recommendationText.includes('grammar') ||
          recommendationText.includes('engaging')
      ).toBe(true);
    });

    it('should rate excellent content appropriately', async () => {
      // Mock a high-scoring evaluation for this test
      const excellentContent =
        "Discover how our innovative solution can transform your business! Learn about cutting-edge features that boost productivity and improve your team's efficiency. Get started today and see amazing results!";

      const result = await AuditAgent.auditAgentOutput('ContentAgent', excellentContent);

      expect(result.hallucinationDetected).toBe(false);
      // The rating depends on the actual scoring, but should be good or excellent for quality content
      expect(['excellent', 'good']).toContain(result.overallRating);
    });

    it('should log comprehensive audit results', async () => {
      const content = 'Test content for auditing';

      await AuditAgent.auditAgentOutput('OutreachAgent', content, 'email');

      expect(mockLogPerformance).toHaveBeenCalled();

      // Check that the logged metadata includes audit-specific information
      const logCall = mockLogPerformance.mock.calls[0]?.[0];
      expect(logCall?.agent).toBe('OutreachAgent');
      expect(logCall?.score).toBeDefined();
    });
  });

  describe('static evaluation methods', () => {
    it('should calculate grammar scores correctly', async () => {
      const goodGrammar =
        'This is a well-written sentence with proper capitalization and punctuation.';
      const poorGrammar = 'this has no caps and no ending';

      const goodResult = await AuditAgent.evaluateContentOutput(goodGrammar);
      const poorResult = await AuditAgent.evaluateContentOutput(poorGrammar);

      expect(goodResult.grammar).toBeGreaterThan(poorResult.grammar);
    });

    it('should handle content of different lengths appropriately', async () => {
      const shortContent = 'Hi!';
      const mediumContent =
        'This is a medium-length piece of content that should score well for clarity and engagement.';
      const longContent =
        'This is a very long piece of content that goes on and on and on without much substance or value, potentially making it less clear and engaging for readers who are looking for concise and actionable information that can help them achieve their goals quickly and efficiently.';

      const shortResult = await AuditAgent.evaluateContentOutput(shortContent);
      const mediumResult = await AuditAgent.evaluateContentOutput(mediumContent);
      await AuditAgent.evaluateContentOutput(longContent);

      // Medium content should generally score better than very short or very long
      expect(mediumResult.clarity).toBeGreaterThanOrEqual(shortResult.clarity);
    });
  });
});
