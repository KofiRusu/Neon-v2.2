/**
 * AuditAgent - Autonomous Quality Control Agent for NeonHub
 *
 * Provides continuous background quality control for all other agents:
 * - Content evaluation (clarity, grammar, engagement)
 * - Hallucination detection
 * - Agent performance monitoring and logging
 */

import {
  logEvent,
  logPerformance,
  withLogging,
  logger,
  type PerformanceMetrics,
} from '@neon/utils';
import type { AgentName } from '@neon/types';

export interface ContentScore {
  clarity: number; // 0-100: How clear and understandable the content is
  grammar: number; // 0-100: Grammar and language correctness
  engagement: number; // 0-100: How engaging and compelling the content is
  overall: number; // 0-100: Overall quality score
}

export interface HallucinationResult {
  isHallucination: boolean;
  confidence: number; // 0-100: Confidence in the detection
  reasons: string[]; // Specific reasons for flagging
}

export interface AgentPerformanceData {
  agent: AgentName;
  score: number;
  metrics: Record<string, number>;
  metadata?: Record<string, unknown>;
}

/**
 * AuditAgent class for quality control and monitoring
 */
export class AuditAgent {
  private static readonly AGENT_NAME: AgentName = 'InsightAgent'; // Using InsightAgent as closest match

  /**
   * Evaluates content quality across multiple dimensions
   */
  static async evaluateContentOutput(content: string): Promise<ContentScore> {
    return withLogging(
      this.AGENT_NAME,
      'evaluate_content',
      async () => {
        try {
          // Try OpenAI evaluation first (with mock implementation for now)
          const aiScore = await this.evaluateWithAI(content);
          if (aiScore) {
            return aiScore;
          }
        } catch (error) {
          logger.warn(
            'AI evaluation failed, falling back to static analysis',
            { error },
            'AuditAgent'
          );
        }

        // Fallback to static analysis
        return this.evaluateStatically(content);
      },
      { contentLength: content.length }
    );
  }

  /**
   * Detects potential hallucinations in generated content
   */
  static async detectHallucination(content: string): Promise<boolean> {
    return withLogging(
      this.AGENT_NAME,
      'detect_hallucination',
      async () => {
        const result = await this.analyzeForHallucination(content);

        // Log detailed hallucination analysis
        await logEvent({
          agent: this.AGENT_NAME,
          action: 'hallucination_analysis',
          metadata: {
            content: `${content.substring(0, 200)}...`,
            result: result.isHallucination,
            confidence: result.confidence,
            reasons: result.reasons,
          },
          success: true,
        });

        return result.isHallucination;
      },
      { contentLength: content.length }
    );
  }

  /**
   * Logs agent performance metrics to the database
   */
  static async logAgentPerformance(
    agent: AgentName,
    score: number,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    return withLogging(
      this.AGENT_NAME,
      'log_performance',
      async () => {
        const performanceData: PerformanceMetrics = {
          agent,
          score,
          metrics: {
            overall_score: score,
            evaluation_timestamp: Date.now(),
          },
          timestamp: new Date(),
        };

        await logPerformance(performanceData);

        // Also log to agent events for detailed tracking
        await logEvent({
          agent: this.AGENT_NAME,
          action: 'performance_logged',
          metadata: {
            target_agent: agent,
            score,
            ...metadata,
          },
          success: true,
        });
      },
      { targetAgent: agent, score }
    );
  }

  /**
   * Attempts to evaluate content using AI (OpenAI API)
   * Returns null if AI evaluation fails
   */
  private static async evaluateWithAI(content: string): Promise<ContentScore | null> {
    try {
      // Mock OpenAI implementation - replace with actual OpenAI API call
      // const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

      const mockPrompt = `
        Evaluate the following content for marketing effectiveness on a scale of 0-100:
        
        Content: "${content}"
        
        Please respond with a JSON object containing:
        {
          "clarity": <score 0-100>,
          "grammar": <score 0-100>, 
          "engagement": <score 0-100>,
          "overall": <score 0-100>
        }
      `;

      // For now, return null to trigger fallback
      // TODO: Implement actual OpenAI API call
      logger.debug(
        'OpenAI evaluation prompt prepared',
        { promptPreview: mockPrompt.substring(0, 100) },
        'AuditAgent'
      );
      return null;

      /* 
      // Actual OpenAI implementation:
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: mockPrompt }],
        temperature: 0.1,
      })

      const responseText = response.choices[0]?.message?.content
      if (!responseText) return null

      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) return null

      const parsed = JSON.parse(jsonMatch[0])
      return {
        clarity: Math.max(0, Math.min(100, parsed.clarity || 0)),
        grammar: Math.max(0, Math.min(100, parsed.grammar || 0)),
        engagement: Math.max(0, Math.min(100, parsed.engagement || 0)),
        overall: Math.max(0, Math.min(100, parsed.overall || 0)),
      }
      */
    } catch (error) {
      logger.error('OpenAI evaluation error', { error }, 'AuditAgent');
      return null;
    }
  }

  /**
   * Static content evaluation based on heuristics
   */
  private static evaluateStatically(content: string): ContentScore {
    const length = content.length;
    const words = content.split(/\s+/).length;
    const sentences = content.split(/[.!?]+/).length;
    const avgWordsPerSentence = words / Math.max(1, sentences);

    // Grammar heuristics
    const grammarScore = this.calculateGrammarScore(content);

    // Clarity heuristics
    let clarityScore = 70; // Base score
    if (length > 50 && length < 500) clarityScore += 10;
    if (avgWordsPerSentence > 5 && avgWordsPerSentence < 20) clarityScore += 10;
    if (content.includes('?') || content.includes('!')) clarityScore += 5;

    // Engagement heuristics
    let engagementScore = 60; // Base score
    const actionWords = ['discover', 'learn', 'get', 'find', 'boost', 'improve', 'create'];
    const hasActionWords = actionWords.some(word => content.toLowerCase().includes(word));
    if (hasActionWords) engagementScore += 15;
    if (content.includes('!')) engagementScore += 10;
    if (content.includes('?')) engagementScore += 5;

    // Overall score (weighted average)
    const overall = Math.round(clarityScore * 0.3 + grammarScore * 0.3 + engagementScore * 0.4);

    return {
      clarity: Math.max(0, Math.min(100, clarityScore)),
      grammar: Math.max(0, Math.min(100, grammarScore)),
      engagement: Math.max(0, Math.min(100, engagementScore)),
      overall: Math.max(0, Math.min(100, overall)),
    };
  }

  /**
   * Calculate grammar score based on simple heuristics
   */
  private static calculateGrammarScore(content: string): number {
    let score = 80; // Base score

    // Check for basic capitalization
    if (content.charAt(0) === content.charAt(0).toUpperCase()) score += 5;

    // Check for proper sentence ending
    if (/[.!?]$/.test(content.trim())) score += 5;

    // Penalize excessive punctuation
    const exclamationCount = (content.match(/!/g) || []).length;
    if (exclamationCount > 3) score -= 10;

    // Check for common grammar issues
    if (content.includes('there ')) score += 2;
    if (content.includes('their ')) score += 2;
    if (content.includes("it's")) score += 2;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Analyze content for potential hallucinations
   */
  private static async analyzeForHallucination(content: string): Promise<HallucinationResult> {
    const reasons: string[] = [];
    let confidence = 0;

    // Check for obviously false claims
    const suspiciousPatterns = [
      /guaranteed.*100%/i,
      /make.*\$\d+.*day/i,
      /instant.*results/i,
      /secret.*method/i,
      /doctors hate/i,
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(content)) {
        reasons.push(`Suspicious marketing claim: ${pattern.source}`);
        confidence += 30;
      }
    }

    // Check for unrealistic numbers
    const numberMatches = content.match(/\d+(?:,\d{3})*(?:\.\d+)?/g);
    if (numberMatches) {
      for (const match of numberMatches) {
        const num = parseFloat(match.replace(/,/g, ''));
        if (num > 1000000) {
          reasons.push(`Unrealistic large number: ${match}`);
          confidence += 20;
        }
      }
    }

    // Check for contradictory statements
    if (content.includes('free') && content.includes('price')) {
      reasons.push('Contradictory pricing claims');
      confidence += 25;
    }

    const isHallucination = confidence >= 50;

    return {
      isHallucination,
      confidence: Math.min(100, confidence),
      reasons,
    };
  }

  /**
   * Comprehensive audit of another agent's output
   */
  static async auditAgentOutput(
    sourceAgent: AgentName,
    content: string,
    expectedType: 'content' | 'email' | 'ad' | 'analysis' = 'content'
  ): Promise<{
    contentScore: ContentScore;
    hallucinationDetected: boolean;
    overallRating: 'excellent' | 'good' | 'fair' | 'poor';
    recommendations: string[];
  }> {
    return withLogging(
      this.AGENT_NAME,
      'comprehensive_audit',
      async () => {
        const [contentScore, hallucinationDetected] = await Promise.all([
          this.evaluateContentOutput(content),
          this.detectHallucination(content),
        ]);

        // Determine overall rating
        let overallRating: 'excellent' | 'good' | 'fair' | 'poor';
        const overallScore = contentScore.overall;

        if (hallucinationDetected) {
          overallRating = 'poor';
        } else if (overallScore >= 85) {
          overallRating = 'excellent';
        } else if (overallScore >= 70) {
          overallRating = 'good';
        } else if (overallScore >= 50) {
          overallRating = 'fair';
        } else {
          overallRating = 'poor';
        }

        // Generate recommendations
        const recommendations: string[] = [];

        if (contentScore.clarity < 70) {
          recommendations.push('Improve content clarity and structure');
        }
        if (contentScore.grammar < 80) {
          recommendations.push('Review grammar and language usage');
        }
        if (contentScore.engagement < 60) {
          recommendations.push('Add more engaging elements and call-to-actions');
        }
        if (hallucinationDetected) {
          recommendations.push('CRITICAL: Review for false or misleading claims');
        }

        // Log comprehensive audit results
        await this.logAgentPerformance(sourceAgent, overallScore, {
          audit_type: 'comprehensive',
          content_type: expectedType,
          hallucination_detected: hallucinationDetected,
          overall_rating: overallRating,
          recommendations_count: recommendations.length,
        });

        return {
          contentScore,
          hallucinationDetected,
          overallRating,
          recommendations,
        };
      },
      { sourceAgent, contentType: expectedType, contentLength: content.length }
    );
  }
}
