import OpenAI from 'openai';
import { AbstractAgent } from '../base-agent';
import type { AgentPayload, AgentResult } from '../base-agent';
import type { AgentContext, ContentResult } from '../types';
import { logger, BudgetTracker } from '@neon/utils';
import { AgentType } from '@prisma/client';

// Define local interfaces for content generation
export interface ContentGenerationParams {
  topic: string;
  type: string;
  tone?: string;
  keywords?: string[];
  targetAudience?: string;
}

export interface ContentOptimizationParams {
  content: string;
  targetKeywords: string[];
  platform?: string;
}

export interface ContentAnalysisParams {
  content: string;
  metrics?: string[];
}

export interface ContentGenerationContext {
  type: 'blog' | 'social_post' | 'email' | 'caption' | 'copy';
  tone: 'professional' | 'casual' | 'friendly' | 'authoritative' | 'playful';
  audience: string;
  topic: string;
  keywords?: string[];
  length?: 'short' | 'medium' | 'long';
  platform?: 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'email';
}

export interface ContentGenerationResult extends AgentResult {
  content: string;
  suggestedTitle?: string;
  hashtags?: string[] | undefined;
  readingTime?: number;
  seoScore?: number | undefined;
  tokensUsed?: number;
}

export class ContentAgent extends AbstractAgent {
  private openai: OpenAI;

  constructor() {
    super('content-agent', 'ContentAgent', 'content', [
      'generate_content',
      'generate_blog',
      'generate_caption',
      'generate_post',
    ]);

    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    if (!process.env.OPENAI_API_KEY) {
      logger.warn(
        'OPENAI_API_KEY not found. ContentAgent will run in limited mode.',
        {},
        'ContentAgent'
      );
    }
  }

  async execute(payload: AgentPayload): Promise<AgentResult> {
    return this.executeWithErrorHandling(payload, async () => {
      const context = payload.context as ContentGenerationContext;

      // Validate input
      if (!context.topic || !context.type || !context.audience) {
        throw new Error('Missing required context: topic, type, and audience are required');
      }

      // Check budget before execution
      const budgetStatus = await BudgetTracker.checkBudgetStatus();
      if (!budgetStatus.canExecute) {
        throw new Error(
          `Budget exceeded. Current utilization: ${budgetStatus.utilizationPercentage.toFixed(1)}%`
        );
      }

      // Generate content based on type
      const result = await this.generateContent(context, payload.context?.campaignId);

      return result;
    });
  }

  private async generateContent(
    context: ContentGenerationContext,
    campaignId?: string
  ): Promise<ContentGenerationResult> {
    // Try OpenAI first, fallback to template-based if unavailable
    let content: string;
    let tokensUsed = 0;

    if (this.openai && process.env.OPENAI_API_KEY) {
      const result = await this.generateAIContent(context, campaignId);
      content = result.content;
      tokensUsed = result.tokensUsed;
    } else {
      content = await this.createContentTemplate(context);
      tokensUsed = 50; // Estimate for template-based generation
    }

    const hashtags = context.type === 'social_post' ? this.generateHashtags(context) : undefined;
    const readingTime = this.calculateReadingTime(content);
    const seoScore = context.keywords
      ? this.calculateSEOScore(content, context.keywords)
      : undefined;

    // Track cost for content generation
    await BudgetTracker.trackCost({
      agentType: AgentType.CONTENT,
      campaignId,
      tokens: tokensUsed,
      task: `generate_${context.type}`,
      metadata: {
        topic: context.topic,
        audience: context.audience,
        tone: context.tone,
        platform: context.platform,
        contentLength: content.length,
      },
      conversionAchieved: true,
      qualityScore: seoScore ? seoScore / 100 : 0.8,
    });

    return {
      content,
      suggestedTitle: this.generateTitle(context),
      hashtags,
      readingTime,
      seoScore,
      success: true,
      tokensUsed,
    };
  }

  private async generateAIContent(
    context: ContentGenerationContext,
    campaignId?: string
  ): Promise<{ content: string; tokensUsed: number }> {
    try {
      const prompt = this.buildContentPrompt(context);
      const maxTokens = this.getMaxTokensForType(context.type);

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert content creator. Generate engaging, high-quality content that resonates with the target audience and achieves the specified goals.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: maxTokens,
      });

      const aiContent = response.choices[0]?.message?.content;
      if (!aiContent) {
        throw new Error('No response from OpenAI');
      }

      // Get actual token usage from OpenAI response
      const tokensUsed = response.usage?.total_tokens || maxTokens;

      return {
        content: aiContent,
        tokensUsed,
      };
    } catch (error) {
      logger.error(
        'OpenAI content generation failed, using template fallback',
        { error },
        'ContentAgent'
      );

      // Track failed AI call
      await BudgetTracker.trackCost({
        agentType: AgentType.CONTENT,
        campaignId,
        tokens: 100, // Estimate for failed call
        task: `generate_${context.type}_failed`,
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error',
          fallback: true,
        },
        conversionAchieved: false,
        qualityScore: 0,
      });

      return {
        content: await this.createContentTemplate(context),
        tokensUsed: 50, // Estimate for template generation
      };
    }
  }

  private buildContentPrompt(context: ContentGenerationContext): string {
    const { type, topic, audience, tone, keywords = [], platform, length } = context;

    let prompt = `Generate ${length || 'appropriate'} ${type} content about "${topic}" for ${audience} with a ${tone} tone.`;

    if (keywords.length > 0) {
      prompt += ` Include these keywords naturally: ${keywords.join(', ')}.`;
    }

    if (platform) {
      prompt += ` Optimize for ${platform} platform.`;
    }

    switch (type) {
      case 'blog':
        prompt +=
          ' Include an engaging introduction, structured main content with subheadings, and a compelling conclusion. Make it SEO-friendly and informative.';
        break;
      case 'social_post':
        prompt +=
          ' Make it engaging, shareable, and include appropriate emojis. End with a call-to-action or question to encourage engagement.';
        break;
      case 'email':
        prompt +=
          ' Create a compelling subject line and email body that drives action. Be personable and include a clear call-to-action.';
        break;
      case 'caption':
        prompt +=
          ' Keep it concise, engaging, and include relevant hashtags. Perfect for accompanying visual content.';
        break;
      case 'copy':
        prompt +=
          ' Focus on persuasive, conversion-oriented copy that clearly communicates value and drives action.';
        break;
    }

    return prompt;
  }

  private getMaxTokensForType(type: string): number {
    const tokenLimits = {
      blog: 2000,
      social_post: 300,
      email: 800,
      caption: 150,
      copy: 500,
    };

    return tokenLimits[type as keyof typeof tokenLimits] || 500;
  }

  private async createContentTemplate(context: ContentGenerationContext): Promise<string> {
    const templates = {
      blog: this.generateBlogContent(context),
      social_post: this.generateSocialPost(context),
      email: this.generateEmailContent(context),
      caption: this.generateCaptionContent(context),
      copy: this.generateCopyContent(context),
    };

    return templates[context.type] || templates.copy;
  }

  private generateBlogContent(context: ContentGenerationContext): string {
    const { topic, audience, tone, keywords = [] } = context;

    return `# ${this.generateTitle(context)}

## Introduction

When it comes to ${topic}, ${audience} face unique challenges that require a ${tone} approach. ${keywords.length > 0 ? `Understanding ${keywords.join(', ')} is crucial for success.` : ''}

## Key Points

- **Strategic Insight**: ${topic} requires careful consideration of your target audience
- **Best Practices**: Implementing proven strategies that work for ${audience}
- **Action Items**: Clear steps you can take immediately

## Conclusion

By focusing on ${topic} with a ${tone} approach, you'll be able to connect more effectively with ${audience} and achieve your goals.

*This content was generated by NeonHub AI Content Agent*`;
  }

  private generateSocialPost(context: ContentGenerationContext): string {
    const { topic, audience, tone, platform } = context;

    const platformSpecific = {
      twitter: `🚀 ${topic} insight for ${audience}:\n\n${this.getToneMessage(tone, topic)}\n\nWhat's your experience? 👇`,
      instagram: `✨ ${topic} ✨\n\n${this.getToneMessage(tone, topic)}\n\nPerfect for ${audience} looking to level up! 📈`,
      linkedin: `Professional insight on ${topic} for ${audience}:\n\n${this.getToneMessage(tone, topic)}\n\nThoughts? Let's discuss in the comments.`,
      facebook: `Hey ${audience}! 👋\n\nLet's talk about ${topic}:\n\n${this.getToneMessage(tone, topic)}\n\nWho else finds this helpful?`,
    };

    return (
      platformSpecific[platform as keyof typeof platformSpecific] || platformSpecific.instagram
    );
  }

  private generateEmailContent(context: ContentGenerationContext): string {
    const { topic, audience, tone } = context;

    return `Subject: ${this.generateTitle(context)}

Hi there!

I hope this email finds you well. I wanted to share some insights about ${topic} that I think you'll find valuable.

${this.getToneMessage(tone, topic)}

This is particularly relevant for ${audience} because it addresses the core challenges you face daily.

Here's what you can do next:
1. Apply these insights to your current projects
2. Share this with your team
3. Let me know how it works for you

Best regards,
The NeonHub Team

P.S. This email was personalized by our AI Content Agent to match your interests.`;
  }

  private generateCaptionContent(context: ContentGenerationContext): string {
    const { topic, audience, tone } = context;

    return `${this.getToneMessage(tone, topic)} Perfect for ${audience} ready to take action! 💪`;
  }

  private generateCopyContent(context: ContentGenerationContext): string {
    const { topic, audience, tone } = context;

    return `${this.getToneMessage(tone, topic)}\n\nDesigned specifically for ${audience} who want results that matter.`;
  }

  private getToneMessage(tone: string, topic: string): string {
    const messages = {
      professional: `${topic} requires a strategic, data-driven approach that delivers measurable results.`,
      casual: `Here's the thing about ${topic} - it doesn't have to be complicated!`,
      friendly: `Let's chat about ${topic} and how it can make a real difference for you.`,
      authoritative: `Based on extensive research, ${topic} is a critical factor in achieving success.`,
      playful: `Ready to have some fun with ${topic}? Let's dive in and explore the possibilities! 🎉`,
    };

    return messages[tone as keyof typeof messages] || messages.professional;
  }

  private generateTitle(context: ContentGenerationContext): string {
    const { topic, audience, type } = context;

    const titles = {
      blog: `The Complete Guide to ${topic} for ${audience}`,
      social_post: `${topic} Tips for ${audience}`,
      email: `Your ${topic} Strategy Update`,
      caption: `${topic} Made Simple`,
      copy: `Transform Your ${topic} Approach`,
    };

    return titles[type] || `${topic} for ${audience}`;
  }

  private generateHashtags(context: ContentGenerationContext): string[] {
    const { topic, audience } = context;

    const baseHashtags = ['#AI', '#Marketing', '#NeonHub'];
    const topicHashtags = topic
      .split(' ')
      .map(word => `#${word.charAt(0).toUpperCase() + word.slice(1)}`);
    const audienceHashtags = audience
      .split(' ')
      .map(word => `#${word.charAt(0).toUpperCase() + word.slice(1)}`);

    return [...baseHashtags, ...topicHashtags.slice(0, 2), ...audienceHashtags.slice(0, 2)].slice(
      0,
      8
    );
  }

  private calculateReadingTime(content: string): number {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  }

  private calculateSEOScore(content: string, keywords: string[]): number {
    let score = 0;
    const contentLower = content.toLowerCase();

    keywords.forEach(keyword => {
      const keywordCount = (contentLower.match(new RegExp(keyword.toLowerCase(), 'g')) || [])
        .length;
      if (keywordCount > 0) score += 20;
      if (keywordCount > 2) score += 10;
    });

    // Basic SEO checks
    if (content.length > 300) score += 20; // Good length
    if (content.includes('##') || content.includes('#')) score += 10; // Has headers

    return Math.min(score, 100);
  }

  // New methods for Phase 1 features
  async generatePost(context: ContentGenerationContext): Promise<AgentResult> {
    return this.execute({
      task: 'generate_post',
      context,
      priority: 'medium',
    });
  }

  async generateBlog(context: ContentGenerationContext): Promise<AgentResult> {
    return this.execute({
      task: 'generate_blog',
      context: { ...context, type: 'blog', length: 'long' },
      priority: 'medium',
    });
  }

  async generateCaption(context: ContentGenerationContext): Promise<AgentResult> {
    return this.execute({
      task: 'generate_caption',
      context: { ...context, type: 'caption', length: 'short' },
      priority: 'medium',
    });
  }
}
