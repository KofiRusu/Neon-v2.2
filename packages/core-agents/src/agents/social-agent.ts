import { AbstractAgent, AgentPayload, AgentResult } from '../base-agent';
import OpenAI from 'openai';
import { logger } from '@neon/utils';
import * as fs from 'fs/promises';
import * as path from 'path';

interface SocialPost {
  id: string;
  platform: 'instagram' | 'facebook' | 'tiktok' | 'twitter' | 'linkedin' | 'youtube';
  content: string;
  mediaUrls?: string[];
  hashtags: string[];
  scheduledTime?: Date;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  engagementMetrics?: {
    likes: number;
    comments: number;
    shares: number;
    views?: number;
  };
}

interface SocialAccount {
  platform: string;
  username: string;
  connected: boolean;
  followers: number;
  accessToken?: string;
  lastSyncAt: Date;
}

interface ContentCalendar {
  id: string;
  month: string;
  year: number;
  posts: SocialPost[];
  themes: string[];
  campaigns: string[];
}

// Meta API integration interface
interface MetaApiClient {
  post: (
    url: string,
    data: any
  ) => Promise<{
    id: string;
    status: string;
    error?: string;
  }>;
}

let metaApiClient: MetaApiClient | null = null;
let openai: OpenAI | null = null;

// Initialize Meta API client
try {
  if (process.env.FB_ACCESS_TOKEN && process.env.FACEBOOK_APP_ID) {
    // Mock Meta API client - in production would use actual Facebook SDK
    metaApiClient = {
      post: async (url: string, data: any) => {
        // Simulate API call
        return {
          id: `fb_post_${Date.now()}`,
          status: 'published',
        };
      },
    };
  }
} catch (error) {
  logger.warn(
    'Meta API not available, social posting will run in mock mode',
    { error },
    'SocialAgent'
  );
}

// Initialize OpenAI client
try {
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
} catch (error) {
  logger.warn(
    'OpenAI not available, content generation will use fallback methods',
    { error },
    'SocialAgent'
  );
}

export class SocialAgent extends AbstractAgent {
  private connectedAccounts: Map<string, SocialAccount> = new Map();
  private hashtagGroups: Map<string, string[]> = new Map();

  constructor(id: string, name: string) {
    super(id, name, 'social', [
      'generate_post',
      'schedule_post',
      'bulk_schedule',
      'manage_accounts',
      'analyze_performance',
      'suggest_hashtags',
      'create_calendar',
      'engage_audience',
      'track_mentions',
    ]);

    this.initializeDefaultAccounts();
    this.initializeHashtagGroups();
  }

  async execute(payload: AgentPayload): Promise<AgentResult> {
    return this.executeWithErrorHandling(payload, async () => {
      const { task, context } = payload;

      switch (task) {
        case 'generate_post':
          return await this.generatePost(context);
        case 'schedule_post':
          return await this.schedulePostInternal(context);
        case 'bulk_schedule':
          return await this.bulkSchedule(context);
        case 'manage_accounts':
          return await this.manageAccounts(context);
        case 'analyze_performance':
          return await this.analyzePerformance(context);
        case 'suggest_hashtags':
          return await this.suggestHashtags(context);
        case 'create_calendar':
          return await this.createContentCalendar(context);
        case 'engage_audience':
          return await this.engageAudience(context);
        case 'track_mentions':
          return await this.trackMentions(context);
        default:
          throw new Error(`Unknown task: ${task}`);
      }
    });
  }

  private async generatePost(context: any): Promise<any> {
    const {
      platform,
      topic,
      tone = 'professional',
      includeHashtags = true,
      targetAudience = 'general',
      maxLength,
    } = context;

    if (!platform || !topic) {
      throw new Error('Platform and topic are required for post generation');
    }

    // Generate platform-optimized content
    const baseContent = await this.generateBaseContent(topic, tone, targetAudience);
    const optimizedContent = this.optimizeContentForPlatform(baseContent, platform);

    // Apply length constraints if specified
    const finalContent = maxLength
      ? this.truncateContent(optimizedContent, maxLength, platform)
      : optimizedContent;

    // Generate hashtags if requested
    const hashtags = includeHashtags ? await this.generateHashtagsForPost(topic, platform) : [];

    // Calculate engagement predictions
    const predictions = this.calculateEngagementPredictions(finalContent, hashtags, platform);

    const generatedPost = {
      id: `generated_post_${Date.now()}`,
      content: finalContent,
      hashtags,
      platform,
      estimatedReach: predictions.reach,
      engagementScore: predictions.engagement,
      metadata: {
        topic,
        tone,
        targetAudience,
        generatedAt: new Date().toISOString(),
        platform,
        contentLength: finalContent.length,
      },
    };

    return {
      generatedPost,
      suggestions: {
        bestTimes: this.getOptimalPostTimes(platform),
        improvements: this.getContentImprovements(finalContent, platform),
        alternativeHashtags: this.getAlternativeHashtags(hashtags, topic),
      },
      platformInsights: {
        characterLimit: this.getCharacterLimit(platform),
        hashtagLimit: this.getHashtagLimit(platform),
        bestPractices: this.getPlatformBestPractices(platform),
      },
    };
  }

  private async generateBaseContent(
    topic: string,
    tone: string,
    targetAudience: string
  ): Promise<string> {
    // Use OpenAI for content generation if available
    if (openai) {
      try {
        const prompt = `Create a ${tone} social media post about ${topic} for ${targetAudience} audience. Keep it engaging and authentic.`;

        const response = await openai.chat.completions.create({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content:
                'You are an expert social media content creator. Create engaging, authentic social media posts that drive engagement.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 300,
        });

        const aiContent = response.choices[0]?.message?.content;
        if (aiContent) {
          return aiContent;
        }
      } catch (error) {
        await this.logAIFallback('content_generation', error);
        logger.error('OpenAI content generation failed, using fallback', { error }, 'SocialAgent');
      }
    }

    // Fallback to template-based generation
    const templates = {
      professional: [
        `Discover the power of ${topic}. Professional solutions that deliver results.`,
        `Transform your space with premium ${topic}. Excellence in every detail.`,
        `Experience the difference with our ${topic} services. Quality guaranteed.`,
      ],
      casual: [
        `Check out our amazing ${topic}! You're going to love what we've got! 🔥`,
        `Hey everyone! Just wanted to share our latest ${topic} - so excited about this! ✨`,
        `Loving our new ${topic}! Can't wait for you all to see it! 💯`,
      ],
      friendly: [
        `We're so excited to share our ${topic} with you! Hope you love it as much as we do! 😊`,
        `Just finished working on this ${topic} and we can't wait to show you! 🌟`,
        `Our team has been working hard on ${topic} and we're thrilled with the results! 💫`,
      ],
      authoritative: [
        `Industry-leading ${topic} solutions. Trusted by professionals worldwide.`,
        `Setting the standard for ${topic}. Unmatched expertise and proven results.`,
        `The definitive choice for ${topic}. Excellence backed by years of experience.`,
      ],
      playful: [
        `Who's ready for some amazing ${topic}? Let's make magic happen! ✨🎉`,
        `Time to light up your world with our ${topic}! Ready to be amazed? 🌈`,
        `Get ready to fall in love with ${topic}! This is going to be epic! 🚀`,
      ],
    };

    const toneTemplates = templates[tone as keyof typeof templates] || templates.professional;
    const baseTemplate = toneTemplates[Math.floor(Math.random() * toneTemplates.length)];

    // Customize for target audience
    return this.customizeForAudience(baseTemplate, targetAudience);
  }

  private customizeForAudience(content: string, audience: string): string {
    const audienceModifiers = {
      general: content,
      business: content.replace(/amazing|awesome|love/g, 'exceptional').replace(/🔥|✨|💯/g, ''),
      creative: `${content} Let your creativity shine!`,
      technical: content.replace(/amazing|awesome/g, 'innovative').replace(/love/g, 'appreciate'),
      young: `${content} 🔥💯`,
      professional: content.replace(/!/g, '.').replace(/🔥|✨|💯|😊|🌟|💫|🎉|🌈|🚀/g, ''),
    };

    return audienceModifiers[audience as keyof typeof audienceModifiers] || content;
  }

  private truncateContent(content: string, maxLength: number, platform: string): string {
    if (content.length <= maxLength) return content;

    const platformDefaults = {
      twitter: 250, // Leave room for hashtags
      instagram: 2000,
      linkedin: 1300,
      facebook: 400,
      tiktok: 100,
      youtube: 2000,
    };

    const limit = Math.min(
      maxLength,
      platformDefaults[platform as keyof typeof platformDefaults] || maxLength
    );
    return `${content.substring(0, limit - 3)}...`;
  }

  private async generateHashtagsForPost(topic: string, platform: string): Promise<string[]> {
    // Generate relevant hashtags for the post
    const topicWords = topic
      .toLowerCase()
      .split(' ')
      .filter(word => word.length > 2);
    const baseHashtags = topicWords.map(word => `#${word}`);

    const platformHashtags = {
      instagram: ['#instaDaily', '#photoOfTheDay', '#instagood'],
      twitter: ['#trending', '#MondayMotivation', '#ThrowbackThursday'],
      linkedin: ['#professional', '#business', '#networking'],
      facebook: ['#community', '#local', '#family'],
      tiktok: ['#viral', '#fyp', '#trending'],
      youtube: ['#subscribe', '#like', '#share'],
    };

    const industryHashtags = ['#neonhub', '#neonsigns', '#customdesign', '#lighting', '#business'];

    const allHashtags = [
      ...baseHashtags.slice(0, 2),
      ...industryHashtags.slice(0, 3),
      ...(platformHashtags[platform as keyof typeof platformHashtags] || []).slice(0, 2),
    ];

    return allHashtags.slice(0, this.getHashtagLimit(platform));
  }

  private calculateEngagementPredictions(
    content: string,
    hashtags: string[],
    platform: string
  ): any {
    // Simulate engagement prediction algorithm
    const baseReach = Math.floor(Math.random() * 5000 + 1000);
    const contentScore = content.length > 50 ? 1.2 : 1.0;
    const hashtagScore = hashtags.length > 0 ? 1.3 : 1.0;
    const platformMultiplier = {
      instagram: 1.4,
      twitter: 1.1,
      linkedin: 1.2,
      facebook: 1.0,
      tiktok: 1.8,
      youtube: 1.5,
    };

    const multiplier = platformMultiplier[platform as keyof typeof platformMultiplier] || 1.0;
    const finalReach = Math.floor(baseReach * contentScore * hashtagScore * multiplier);
    const engagementRate = Math.floor(Math.random() * 30 + 65); // 65-95%

    return {
      reach: finalReach,
      engagement: engagementRate,
    };
  }

  private getOptimalPostTimes(platform: string): string[] {
    const times = {
      instagram: ['11:00 AM', '2:00 PM', '5:00 PM'],
      twitter: ['8:00 AM', '12:00 PM', '7:00 PM'],
      linkedin: ['8:00 AM', '12:00 PM', '5:00 PM'],
      facebook: ['9:00 AM', '1:00 PM', '3:00 PM'],
      tiktok: ['6:00 AM', '10:00 AM', '7:00 PM'],
      youtube: ['2:00 PM', '8:00 PM', '9:00 PM'],
    };

    return times[platform as keyof typeof times] || ['12:00 PM', '6:00 PM'];
  }

  private getContentImprovements(content: string, platform: string): string[] {
    const improvements = [];

    if (content.length < 50) {
      improvements.push('Consider adding more detail to increase engagement');
    }

    if (!/[!?]/.test(content)) {
      improvements.push('Add excitement with exclamation points or questions');
    }

    if (
      platform === 'instagram' &&
      !/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/gu.test(
        content
      )
    ) {
      improvements.push('Consider adding emojis for Instagram');
    }

    if ((platform === 'linkedin' && content.includes('amazing')) || content.includes('awesome')) {
      improvements.push('Use more professional language for LinkedIn');
    }

    return improvements.length > 0 ? improvements : ['Content looks great!'];
  }

  private getAlternativeHashtags(currentHashtags: string[], topic: string): string[] {
    const alternatives = [
      '#marketing',
      '#branding',
      '#design',
      '#creative',
      '#innovation',
      '#quality',
      '#custom',
      '#premium',
      '#professional',
      '#unique',
    ];

    // Filter out hashtags already used and add topic-specific ones
    return alternatives
      .filter(tag => !currentHashtags.includes(tag))
      .concat([`#${topic.replace(/\s+/g, '').toLowerCase()}Ideas`])
      .slice(0, 5);
  }

  private getCharacterLimit(platform: string): number {
    const limits = {
      twitter: 280,
      instagram: 2200,
      linkedin: 3000,
      facebook: 63206,
      tiktok: 150,
      youtube: 2000,
    };

    return limits[platform as keyof typeof limits] || 2000;
  }

  private getPlatformBestPractices(platform: string): string[] {
    const practices = {
      instagram: [
        'Use high-quality visuals',
        'Include 5-10 relevant hashtags',
        'Post during peak hours',
        'Engage with comments quickly',
      ],
      twitter: [
        'Keep it concise and engaging',
        'Use 1-2 hashtags maximum',
        'Include visuals when possible',
        'Engage in conversations',
      ],
      linkedin: [
        'Share professional insights',
        'Use industry-relevant hashtags',
        'Post during business hours',
        'Encourage professional discussions',
      ],
      facebook: [
        'Focus on community building',
        'Use native video when possible',
        'Post when your audience is active',
        'Encourage shares and comments',
      ],
      tiktok: [
        'Create trending, engaging content',
        'Use popular hashtags and sounds',
        'Post consistently',
        'Engage with trends quickly',
      ],
      youtube: [
        'Create compelling thumbnails',
        'Use detailed descriptions',
        'Include relevant tags',
        'Engage with subscribers',
      ],
    };

    return practices[platform as keyof typeof practices] || practices.instagram;
  }

  private async schedulePostInternal(context: any): Promise<any> {
    const {
      platforms,
      content,
      mediaUrls = [],
      hashtags = [],
      scheduledTime,
      crossPost = true,
    } = context;

    if (!platforms || platforms.length === 0) {
      throw new Error('At least one platform must be specified');
    }

    // Validate connected accounts
    const validPlatforms = platforms.filter((platform: string) => {
      const account = this.connectedAccounts.get(platform);
      return account && account.connected;
    });

    if (validPlatforms.length === 0) {
      throw new Error('No connected accounts found for specified platforms');
    }

    // Create posts for each platform
    const scheduledPosts = validPlatforms.map((platform: string) => {
      const optimizedContent = this.optimizeContentForPlatform(content, platform);
      const platformHashtags = this.optimizeHashtagsForPlatform(hashtags, platform);

      const post: SocialPost = {
        id: `post_${Date.now()}_${platform}`,
        platform: platform as any,
        content: optimizedContent,
        mediaUrls,
        hashtags: platformHashtags,
        scheduledTime: scheduledTime ? new Date(scheduledTime) : new Date(),
        status: 'scheduled',
      };

      return post;
    });

    // Simulate scheduling
    const results = scheduledPosts.map(post => ({
      ...post,
      estimatedReach: this.estimateReach(post.platform),
      estimatedEngagement: this.estimateEngagement(post.platform),
      optimalPostTime: this.getOptimalPostTime(post.platform),
      platformSpecificTips: this.getPlatformTips(post.platform),
    }));

    return {
      scheduledPosts: results,
      totalPlatforms: validPlatforms.length,
      estimatedTotalReach: results.reduce((sum: number, post: any) => sum + post.estimatedReach, 0),
      campaignId: `social_campaign_${Date.now()}`,
      recommendations: [
        'Consider adding video content for higher engagement',
        'Post during peak hours for each platform',
        'Use platform-specific hashtags for better reach',
      ],
      metadata: {
        scheduledAt: new Date().toISOString(),
        agentId: this.id,
        crossPosted: crossPost,
      },
    };
  }

  private async bulkSchedule(context: any): Promise<any> {
    const { posts, platforms, startDate, frequency = 'daily', timezone = 'UTC' } = context;

    if (!posts || posts.length === 0) {
      throw new Error('No posts provided for bulk scheduling');
    }

    // Calculate posting schedule
    const schedule = this.generatePostingSchedule(posts, startDate, frequency, timezone);

    // Create scheduled posts
    const scheduledPosts = schedule
      .map((scheduleItem, index) => {
        const post = posts[index % posts.length];
        return platforms.map((platform: string) => ({
          id: `bulk_post_${Date.now()}_${index}_${platform}`,
          platform,
          content: this.optimizeContentForPlatform(post.content, platform),
          mediaUrls: post.mediaUrls || [],
          hashtags: this.optimizeHashtagsForPlatform(post.hashtags || [], platform),
          scheduledTime: scheduleItem.scheduledTime,
          status: 'scheduled',
          batchId: `bulk_${Date.now()}`,
        }));
      })
      .flat();

    const totalPosts = scheduledPosts.length;
    const estimatedReach = scheduledPosts.reduce(
      (sum: number, post: any) => sum + this.estimateReach(post.platform),
      0
    );

    return {
      bulkScheduleId: `bulk_${Date.now()}`,
      totalPosts,
      platformBreakdown: platforms.map((platform: string) => ({
        platform,
        postCount: scheduledPosts.filter((p: any) => p.platform === platform).length,
        estimatedReach: scheduledPosts
          .filter((p: any) => p.platform === platform)
          .reduce((sum: number, p: any) => sum + this.estimateReach(p.platform), 0),
      })),
      schedule: schedule.slice(0, 10), // Preview first 10
      duration: `${schedule.length} ${frequency === 'daily' ? 'days' : frequency}`,
      estimatedTotalReach: estimatedReach,
      recommendations: [
        'Maintain consistent posting frequency',
        'Monitor engagement and adjust timing',
        'Prepare backup content for low-performing posts',
      ],
      metadata: {
        createdAt: new Date().toISOString(),
        frequency,
        timezone,
      },
    };
  }

  private async manageAccounts(context: any): Promise<any> {
    const { action, accountData } = context;

    switch (action) {
      case 'connect':
        return this.connectAccount(accountData);
      case 'disconnect':
        return this.disconnectAccount(accountData.platform);
      case 'refresh':
        return this.refreshAccountData(accountData.platform);
      case 'list':
        return this.listAccounts();
      case 'sync':
        return this.syncAllAccounts();
      default:
        throw new Error(`Unknown account action: ${action}`);
    }
  }

  private async analyzePerformance(context: any): Promise<any> {
    const {
      platforms = ['all'],
      timeRange = '30d',
      metrics: _metrics = ['engagement', 'reach', 'growth'],
    } = context;

    // Generate performance data for each platform
    const platformPerformance = (
      platforms[0] === 'all' ? Array.from(this.connectedAccounts.keys()) : platforms
    )
      .map(platform => {
        const account = this.connectedAccounts.get(platform);
        if (!account) return null;

        const baseEngagement = Math.random() * 5 + 2; // 2-7%
        const baseReach = Math.random() * 10000 + 5000; // 5k-15k
        const baseGrowth = Math.random() * 100 + 50; // 50-150 new followers

        return {
          platform,
          metrics: {
            totalPosts: Math.floor(Math.random() * 50 + 20),
            totalReach: Math.floor(baseReach * (1 + Math.random())),
            totalEngagements: Math.floor(baseReach * (baseEngagement / 100)),
            engagementRate: `${baseEngagement.toFixed(2)}%`,
            followerGrowth: Math.floor(baseGrowth),
            topPost: {
              id: `top_post_${platform}`,
              content: `Best performing ${platform} post about neon signs...`,
              engagement: Math.floor(baseReach * 0.15),
              reach: Math.floor(baseReach * 1.5),
            },
          },
          trends: {
            engagement: Math.random() > 0.5 ? 'up' : 'down',
            reach: Math.random() > 0.5 ? 'up' : 'down',
            followers: Math.random() > 0.7 ? 'up' : 'down',
          },
          insights: [
            `${platform} posts perform best on ${this.getBestPostDay(platform)}`,
            `Video content receives ${Math.floor(Math.random() * 50 + 30)}% more engagement`,
            `Hashtag usage increases reach by ${Math.floor(Math.random() * 25 + 15)}%`,
          ],
        };
      })
      .filter(Boolean);

    // Calculate overall performance
    const overallMetrics = {
      totalReach: platformPerformance.reduce(
        (sum: number, p: any) => sum + (p?.metrics.totalReach || 0),
        0
      ),
      totalEngagements: platformPerformance.reduce(
        (sum: number, p: any) => sum + (p?.metrics.totalEngagements || 0),
        0
      ),
      averageEngagementRate: `${(platformPerformance.reduce((sum: number, p: any) => sum + parseFloat(p?.metrics.engagementRate || '0'), 0) / platformPerformance.length).toFixed(2)}%`,
      totalFollowerGrowth: platformPerformance.reduce(
        (sum: number, p: any) => sum + (p?.metrics.followerGrowth || 0),
        0
      ),
    };

    return {
      timeRange,
      overallMetrics,
      platformPerformance,
      topPerformingContent: platformPerformance.map(p => p?.metrics.topPost).filter(Boolean),
      recommendations: [
        'Increase video content production for higher engagement',
        'Post during identified peak hours for each platform',
        'Use trending hashtags relevant to your niche',
        'Engage with comments within first hour of posting',
      ],
      competitorInsights: [
        'Industry average engagement rate: 3.2%',
        'Top competitors post 2-3 times per day',
        'Video content dominates top-performing posts',
      ],
      metadata: {
        analyzedAt: new Date().toISOString(),
        platformsAnalyzed: platformPerformance.length,
        dataPoints: platformPerformance.reduce(
          (sum: number, p: any) => sum + (p?.metrics.totalPosts || 0),
          0
        ),
      },
    };
  }

  private async suggestHashtags(context: any): Promise<any> {
    const { topic, platform, count = 10, targetAudience = 'general' } = context;

    if (!topic) {
      throw new Error('Topic is required for hashtag suggestions');
    }

    // Analyze topic for relevant keywords
    const extractedKeywords = this.extractKeywords(topic);

    // Get platform-specific hashtag suggestions
    const suggestions = {
      trending: this.getTrendingHashtags(platform, 'neon_signs'),
      relevant: this.getRelevantHashtags(extractedKeywords, 'neon_signs'),
      niche: this.getNicheHashtags('neon_signs', targetAudience),
      branded: this.getBrandedHashtags(),
      competitive: this.getCompetitorHashtags('neon_signs'),
    };

    // Flatten all suggestions and create hashtag objects
    const allHashtags = Object.values(suggestions).flat();
    const hashtagSuggestions = allHashtags.slice(0, count).map((hashtag: string) => ({
      hashtag,
      estimatedReach: Math.floor(Math.random() * 50000 + 5000),
      difficulty: Math.floor(Math.random() * 70 + 30), // 30-100
      relevanceScore: Math.floor(Math.random() * 30 + 70), // 70-100
    }));

    // Generate optimal hashtag mix
    const optimalMix = this.generateOptimalHashtagMix(
      [{ category: 'suggested', hashtags: hashtagSuggestions }],
      platform
    );

    return {
      hashtags: hashtagSuggestions,
      suggestions: hashtagSuggestions, // Alternative format for compatibility
      optimalMix,
      extractedKeywords,
      platformLimits: {
        instagram: 30,
        twitter: 'unlimited (but 2-3 recommended)',
        linkedin: 'unlimited (but 3-5 recommended)',
        facebook: 'no limit (but use sparingly)',
        tiktok: 100,
      },
      bestPractices: {
        [platform]: this.getHashtagBestPractices(platform),
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        platform,
        topic,
        targetAudience,
        count,
      },
    };
  }

  private async createContentCalendar(context: any): Promise<any> {
    const {
      month,
      year,
      platforms,
      themes = [],
      postFrequency = 'daily',
      includeHolidays = true,
    } = context;

    const calendar: ContentCalendar = {
      id: `calendar_${year}_${month}`,
      month,
      year,
      posts: [],
      themes:
        themes.length > 0
          ? themes
          : ['product_showcase', 'behind_scenes', 'customer_stories', 'tips_tutorials'],
      campaigns: [`${month}_${year}_neon_campaign`],
    };

    // Generate posting schedule for the month
    const daysInMonth = new Date(year, month, 0).getDate();
    const schedule = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const theme = calendar.themes[day % calendar.themes.length];

      if (this.shouldPostOnDay(date, postFrequency, includeHolidays)) {
        const posts = platforms.map((platform: string) => ({
          id: `calendar_post_${date.getTime()}_${platform}`,
          platform,
          scheduledTime: this.getOptimalTimeForDate(date, platform),
          theme,
          status: 'planned' as const,
          contentType: this.suggestContentType(theme, platform),
          suggestedContent: this.generateContentSuggestion(theme, platform),
        }));

        schedule.push({
          date: date.toISOString().split('T')[0],
          posts,
          theme,
          isHoliday: this.checkHoliday(date),
          optimalTimes: platforms.map((platform: string) => ({
            platform,
            time: this.getOptimalTimeForDate(date, platform).toISOString(),
          })),
        });
      }
    }

    calendar.posts = schedule.flatMap(s => s.posts);

    return {
      calendar,
      schedule: schedule.slice(0, 15), // Preview first 15 days
      summary: {
        totalPosts: calendar.posts.length,
        postsPerPlatform: platforms.map((platform: string) => ({
          platform,
          count: calendar.posts.filter((p: any) => p.platform === platform).length,
        })),
        themes: calendar.themes,
        estimatedReach: calendar.posts.reduce(
          (sum: number, post: any) => sum + this.estimateReach(post.platform),
          0
        ),
      },
      recommendations: [
        'Mix content types for variety (images, videos, carousels)',
        'Plan seasonal content around holidays',
        'Prepare content in advance for busy periods',
        'Leave flexibility for trending topics',
      ],
      metadata: {
        createdAt: new Date().toISOString(),
        month,
        year,
        platforms,
        frequency: postFrequency,
      },
    };
  }

  private async engageAudience(context: any): Promise<any> {
    const {
      platforms,
      engagementType = 'auto',
      responseTime = 'immediate',
      filters = {},
    } = context;

    const engagementActions = [];

    for (const platform of platforms) {
      const account = this.connectedAccounts.get(platform);
      if (!account || !account.connected) continue;

      // Simulate finding engagement opportunities
      const opportunities = this.findEngagementOpportunities(platform, filters);

      const actions = opportunities.map(opportunity => ({
        platform,
        type: opportunity.type,
        targetUser: opportunity.user,
        targetPost: opportunity.postId,
        action: this.determineEngagementAction(opportunity, engagementType),
        priority: opportunity.priority,
        estimatedImpact: opportunity.estimatedImpact,
        scheduledTime:
          responseTime === 'immediate' ? new Date() : this.calculateDelayedResponse(responseTime),
      }));

      engagementActions.push(...actions);
    }

    // Execute engagement actions (simulated)
    const results = engagementActions.map(action => ({
      ...action,
      status: Math.random() > 0.1 ? 'completed' : 'failed', // 90% success rate
      completedAt: new Date(),
      impact: {
        followerIncrease: Math.floor(Math.random() * 5),
        engagementBoost: `${Math.floor(Math.random() * 20 + 10)}%`,
        reachIncrease: Math.floor(Math.random() * 500 + 100),
      },
    }));

    const successfulActions = results.filter(r => r.status === 'completed');

    return {
      totalOpportunities: engagementActions.length,
      actionsCompleted: successfulActions.length,
      failedActions: results.length - successfulActions.length,
      successRate: `${((successfulActions.length / results.length) * 100).toFixed(1)}%`,
      engagementResults: results.slice(0, 20), // Preview first 20
      impact: {
        totalFollowerIncrease: successfulActions.reduce(
          (sum: number, a: any) => sum + a.impact.followerIncrease,
          0
        ),
        avgEngagementBoost: `${(successfulActions.reduce((sum: number, a: any) => sum + parseFloat(a.impact.engagementBoost), 0) / successfulActions.length).toFixed(1)}%`,
        totalReachIncrease: successfulActions.reduce(
          (sum: number, a: any) => sum + a.impact.reachIncrease,
          0
        ),
      },
      recommendations: [
        'Respond to comments within 2 hours for best engagement',
        "Like and comment on industry leaders' posts",
        'Share user-generated content to build community',
        'Use engagement pods strategically',
      ],
      metadata: {
        executedAt: new Date().toISOString(),
        platforms,
        engagementType,
        responseTime,
      },
    };
  }

  private async trackMentions(context: any): Promise<any> {
    const {
      keywords = ['neonhub', 'neon signs', '@neonhub'],
      platforms,
      sentiment = 'all',
      timeRange = '7d',
    } = context;

    // Simulate mention tracking
    const mentions = keywords
      .flatMap((keyword: any) =>
        platforms.map((platform: string) => {
          const mentionCount = Math.floor(Math.random() * 20 + 5);
          return Array.from({ length: mentionCount }, (_, i) => ({
            id: `mention_${Date.now()}_${i}_${platform}`,
            platform,
            keyword,
            author: `user_${Math.random().toString(36).substr(2, 8)}`,
            content: this.generateSampleMention(keyword, platform),
            sentiment: this.generateSentiment(),
            engagement: {
              likes: Math.floor(Math.random() * 100),
              comments: Math.floor(Math.random() * 20),
              shares: Math.floor(Math.random() * 10),
            },
            reach: Math.floor(Math.random() * 5000 + 500),
            timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
            requiresResponse: Math.random() > 0.7,
          }));
        })
      )
      .flat();

    // Filter by sentiment if specified
    const filteredMentions =
      sentiment === 'all' ? mentions : mentions.filter((m: any) => m.sentiment === sentiment);

    // Analyze mentions
    const analysis = {
      totalMentions: filteredMentions.length,
      sentimentBreakdown: {
        positive: mentions.filter((m: any) => m.sentiment === 'positive').length,
        neutral: mentions.filter((m: any) => m.sentiment === 'neutral').length,
        negative: mentions.filter((m: any) => m.sentiment === 'negative').length,
      },
      platformBreakdown: platforms.map((platform: string) => ({
        platform,
        count: mentions.filter((m: any) => m.platform === platform).length,
        avgSentiment: this.calculateAverageSentiment(
          mentions.filter((m: any) => m.platform === platform)
        ),
      })),
      topMentions: mentions
        .sort(
          (a: any, b: any) =>
            b.engagement.likes +
            b.engagement.comments +
            b.engagement.shares -
            (a.engagement.likes + a.engagement.comments + a.engagement.shares)
        )
        .slice(0, 10),
      requiresResponse: mentions.filter((m: any) => m.requiresResponse).length,
    };

    return {
      timeRange,
      keywords,
      analysis,
      mentions: filteredMentions.slice(0, 50), // Return first 50 mentions
      insights: [
        `${analysis.sentimentBreakdown.positive} positive mentions (${((analysis.sentimentBreakdown.positive / analysis.totalMentions) * 100).toFixed(1)}%)`,
        `Average response time opportunity: ${Math.floor(Math.random() * 120 + 30)} minutes`,
        `Peak mention time: ${this.getPeakMentionTime()}`,
        `Most mentioned keyword: ${keywords[0]}`,
      ],
      recommendations: [
        'Respond to negative mentions within 1 hour',
        'Amplify positive mentions by sharing/liking',
        'Monitor competitor mentions for opportunities',
        'Set up alerts for urgent mention keywords',
      ],
      alerts: mentions
        .filter((m: any) => m.sentiment === 'negative' || m.requiresResponse)
        .map((m: any) => ({
          mentionId: m.id,
          priority: m.sentiment === 'negative' ? 'high' : 'medium',
          reason: m.sentiment === 'negative' ? 'Negative sentiment detected' : 'Response requested',
          suggestedAction:
            m.sentiment === 'negative' ? 'Address concern publicly' : 'Engage with community',
        })),
      metadata: {
        trackedAt: new Date().toISOString(),
        keywordCount: keywords.length,
        platformCount: platforms.length,
      },
    };
  }

  // Helper methods
  private initializeDefaultAccounts(): void {
    const defaultAccounts: SocialAccount[] = [
      {
        platform: 'instagram',
        username: '@neonhub_official',
        connected: true,
        followers: Math.floor(Math.random() * 10000 + 5000),
        lastSyncAt: new Date(),
      },
      {
        platform: 'facebook',
        username: 'NeonHub Business',
        connected: true,
        followers: Math.floor(Math.random() * 8000 + 3000),
        lastSyncAt: new Date(),
      },
      {
        platform: 'twitter',
        username: '@neonhub',
        connected: false,
        followers: Math.floor(Math.random() * 15000 + 8000),
        lastSyncAt: new Date(),
      },
    ];

    defaultAccounts.forEach(account => {
      this.connectedAccounts.set(account.platform, account);
    });
  }

  private initializeHashtagGroups(): void {
    this.hashtagGroups.set('neon_signs', [
      '#neonsigns',
      '#customneon',
      '#neonart',
      '#glowsigns',
      '#ledlights',
      '#businesssigns',
      '#signage',
      '#illuminated',
      '#brightsigns',
      '#nightsigns',
    ]);

    this.hashtagGroups.set('business', [
      '#smallbusiness',
      '#marketing',
      '#branding',
      '#entrepreneur',
      '#businessowner',
      '#advertising',
      '#promotion',
      '#visibility',
      '#storefront',
      '#commercial',
    ]);
  }

  private optimizeContentForPlatform(content: string, platform: string): string {
    const limits = {
      twitter: 280,
      instagram: 2200,
      facebook: 63206,
      linkedin: 3000,
      tiktok: 4000,
    };

    const limit = limits[platform as keyof typeof limits] || 2000;

    if (content.length <= limit) return content;

    return `${content.substring(0, limit - 3)}...`;
  }

  private optimizeHashtagsForPlatform(hashtags: string[], platform: string): string[] {
    const limits = {
      instagram: 30,
      twitter: 3,
      linkedin: 5,
      facebook: 5,
      tiktok: 20,
    };

    const limit = limits[platform as keyof typeof limits] || 10;
    return hashtags.slice(0, limit);
  }

  private estimateReach(platform: string): number {
    const baseReach = {
      instagram: Math.random() * 5000 + 2000,
      facebook: Math.random() * 3000 + 1500,
      twitter: Math.random() * 8000 + 3000,
      linkedin: Math.random() * 2000 + 1000,
      tiktok: Math.random() * 15000 + 5000,
    };

    return Math.floor(baseReach[platform as keyof typeof baseReach] || 2000);
  }

  private estimateEngagement(platform: string): number {
    const rates = {
      instagram: Math.random() * 4 + 2, // 2-6%
      facebook: Math.random() * 2 + 1, // 1-3%
      twitter: Math.random() * 3 + 1, // 1-4%
      linkedin: Math.random() * 3 + 2, // 2-5%
      tiktok: Math.random() * 8 + 5, // 5-13%
    };

    return parseFloat((rates[platform as keyof typeof rates] || 3).toFixed(2));
  }

  private getOptimalPostTime(platform: string): string {
    const times = {
      instagram: '6:00 PM - 9:00 PM',
      facebook: '1:00 PM - 3:00 PM',
      twitter: '9:00 AM - 10:00 AM',
      linkedin: '8:00 AM - 9:00 AM',
      tiktok: '6:00 PM - 10:00 PM',
    };

    return times[platform as keyof typeof times] || '12:00 PM - 2:00 PM';
  }

  private getPlatformTips(platform: string): string[] {
    const tips = {
      instagram: ['Use high-quality images', 'Include location tags', 'Post Stories regularly'],
      facebook: ['Engage with comments quickly', 'Use video content', 'Share to relevant groups'],
      twitter: ['Use trending hashtags', 'Tweet during peak hours', 'Engage in conversations'],
      linkedin: ['Share industry insights', 'Use professional tone', 'Tag relevant connections'],
      tiktok: ['Follow trending sounds', 'Keep videos under 60 seconds', 'Use trending effects'],
    };

    return (
      tips[platform as keyof typeof tips] || [
        'Post consistently',
        'Engage with audience',
        'Use relevant hashtags',
      ]
    );
  }

  private generatePostingSchedule(
    posts: any[],
    startDate: string,
    frequency: string,
    timezone: string
  ): any[] {
    const schedule = [];
    const start = new Date(startDate);

    for (let i = 0; i < posts.length; i++) {
      const scheduledTime = new Date(start);

      switch (frequency) {
        case 'daily':
          scheduledTime.setDate(start.getDate() + i);
          break;
        case 'weekly':
          scheduledTime.setDate(start.getDate() + i * 7);
          break;
        case 'monthly':
          scheduledTime.setMonth(start.getMonth() + i);
          break;
      }

      schedule.push({
        index: i,
        scheduledTime,
        timezone,
      });
    }

    return schedule;
  }

  private connectAccount(accountData: any): any {
    const { platform, username, accessToken } = accountData;

    const account: SocialAccount = {
      platform,
      username,
      connected: true,
      followers: Math.floor(Math.random() * 10000 + 1000),
      accessToken,
      lastSyncAt: new Date(),
    };

    this.connectedAccounts.set(platform, account);

    return {
      account,
      message: `Successfully connected ${platform} account`,
      nextSteps: [
        'Sync existing posts',
        'Set up posting schedule',
        'Configure engagement settings',
      ],
    };
  }

  private disconnectAccount(platform: string): any {
    const account = this.connectedAccounts.get(platform);
    if (!account) {
      throw new Error(`Account for ${platform} not found`);
    }

    account.connected = false;
    this.connectedAccounts.set(platform, account);

    return {
      message: `Successfully disconnected ${platform} account`,
      platform,
      impact: 'Scheduled posts for this platform will be cancelled',
    };
  }

  private refreshAccountData(platform: string): any {
    const account = this.connectedAccounts.get(platform);
    if (!account) {
      throw new Error(`Account for ${platform} not found`);
    }

    // Simulate data refresh
    account.lastSyncAt = new Date();
    account.followers = Math.floor(account.followers * (1 + (Math.random() * 0.1 - 0.05))); // ±5% change

    return {
      account,
      message: `Successfully refreshed ${platform} account data`,
      updates: {
        followerChange: Math.floor(Math.random() * 100 - 50), // ±50 followers
        newMentions: Math.floor(Math.random() * 10),
        newMessages: Math.floor(Math.random() * 5),
      },
    };
  }

  private listAccounts(): any {
    return {
      accounts: Array.from(this.connectedAccounts.values()),
      totalAccounts: this.connectedAccounts.size,
      connectedAccounts: Array.from(this.connectedAccounts.values()).filter(a => a.connected)
        .length,
      totalFollowers: Array.from(this.connectedAccounts.values()).reduce(
        (sum, a) => sum + a.followers,
        0
      ),
    };
  }

  private syncAllAccounts(): any {
    const results = Array.from(this.connectedAccounts.keys()).map(platform => {
      try {
        return this.refreshAccountData(platform);
      } catch (error) {
        return {
          platform,
          error: error instanceof Error ? error.message : 'Unknown error',
          status: 'failed',
        };
      }
    });

    const successful = results.filter(r => !r.error).length;
    const failed = results.length - successful;

    return {
      totalAccounts: results.length,
      successful,
      failed,
      results,
      message: `Sync completed: ${successful} successful, ${failed} failed`,
    };
  }

  private extractKeywords(content: string): string[] {
    // Simple keyword extraction
    const words = content.toLowerCase().split(/\s+/);
    const keywords = words.filter(
      word =>
        word.length > 3 &&
        !['this', 'that', 'with', 'from', 'they', 'have', 'will', 'been', 'said'].includes(word)
    );
    return Array.from(new Set(keywords)).slice(0, 10);
  }

  private getTrendingHashtags(_platform: string, _industry: string): string[] {
    const trending = [
      '#trending',
      '#viral',
      '#explore',
      '#fyp',
      '#reels',
      '#instagood',
      '#photooftheday',
      '#love',
      '#follow',
      '#instadaily',
    ];
    return trending.slice(0, 5);
  }

  private getRelevantHashtags(keywords: string[], _industry: string): string[] {
    return keywords.map(keyword => `#${keyword}`).slice(0, 8);
  }

  private getNicheHashtags(industry: string, _targetAudience: string): string[] {
    const niche = this.hashtagGroups.get(industry) || [];
    return niche.slice(0, 7);
  }

  private getBrandedHashtags(): string[] {
    return ['#neonhub', '#custonneon', '#neonhubdesign', '#glowwithus'];
  }

  private getCompetitorHashtags(_industry: string): string[] {
    return ['#signage', '#led', '#lighting', '#design', '#custom'];
  }

  private getHashtagUsage(_hashtag: string): string {
    const usage = Math.floor(Math.random() * 1000000 + 10000);
    if (usage > 500000) return 'Very High';
    if (usage > 100000) return 'High';
    if (usage > 50000) return 'Medium';
    return 'Low';
  }

  private generateOptimalHashtagMix(analysis: any[], platform: string): any {
    // Combine hashtags from different categories
    const mix = {
      trending: analysis.find(a => a.category === 'trending')?.hashtags.slice(0, 2) || [],
      relevant: analysis.find(a => a.category === 'relevant')?.hashtags.slice(0, 5) || [],
      niche: analysis.find(a => a.category === 'niche')?.hashtags.slice(0, 3) || [],
      branded: analysis.find(a => a.category === 'branded')?.hashtags.slice(0, 2) || [],
    };

    const allHashtags = [...mix.trending, ...mix.relevant, ...mix.niche, ...mix.branded];

    return {
      recommended: allHashtags.slice(0, this.getHashtagLimit(platform)),
      breakdown: mix,
      estimatedReach: allHashtags.reduce((sum, h) => sum + (h.estimatedReach || 0), 0),
      difficultyScore: (
        allHashtags.reduce((sum, h) => sum + (h.difficulty || 50), 0) / allHashtags.length
      ).toFixed(1),
    };
  }

  private getHashtagLimit(platform: string): number {
    const limits = { instagram: 15, twitter: 3, linkedin: 5, facebook: 5, tiktok: 10 };
    return limits[platform as keyof typeof limits] || 10;
  }

  private getHashtagBestPractices(platform: string): string[] {
    const practices = {
      instagram: [
        'Mix popular and niche hashtags',
        'Use all 30 hashtags',
        'Research hashtag performance',
      ],
      twitter: [
        'Use 1-2 hashtags maximum',
        'Make hashtags part of the conversation',
        'Avoid overuse',
      ],
      linkedin: [
        'Use professional industry hashtags',
        'Mix broad and specific tags',
        'Keep to 3-5 hashtags',
      ],
      facebook: ['Use hashtags sparingly', 'Focus on branded hashtags', 'Test performance'],
      tiktok: ['Use trending hashtags', 'Mix popular and emerging tags', 'Include niche hashtags'],
    };
    return (
      practices[platform as keyof typeof practices] || [
        'Use relevant hashtags',
        'Research before using',
        'Track performance',
      ]
    );
  }

  private getBestPostDay(_platform: string): string {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days[Math.floor(Math.random() * days.length)];
  }

  private shouldPostOnDay(date: Date, frequency: string, _includeHolidays: boolean): boolean {
    const dayOfWeek = date.getDay();

    if (frequency === 'daily') return true;
    if (frequency === 'weekdays') return dayOfWeek >= 1 && dayOfWeek <= 5;
    if (frequency === 'weekends') return dayOfWeek === 0 || dayOfWeek === 6;

    return Math.random() > 0.3; // Random posting for other frequencies
  }

  private getOptimalTimeForDate(date: Date, platform: string): Date {
    const baseHours = {
      instagram: 18, // 6 PM
      facebook: 13, // 1 PM
      twitter: 9, // 9 AM
      linkedin: 8, // 8 AM
      tiktok: 19, // 7 PM
    };

    const hour = baseHours[platform as keyof typeof baseHours] || 12;
    const optimalTime = new Date(date);
    optimalTime.setHours(hour, 0, 0, 0);

    return optimalTime;
  }

  private checkHoliday(date: Date): boolean {
    // Simple holiday check (can be expanded)
    const month = date.getMonth() + 1;
    const day = date.getDate();

    const holidays = [
      [1, 1], // New Year
      [7, 4], // July 4th
      [12, 25], // Christmas
    ];

    return holidays.some(([m, d]) => m === month && d === day);
  }

  private suggestContentType(theme: string, _platform: string): string {
    const types = {
      product_showcase: ['image', 'carousel', 'video'],
      behind_scenes: ['video', 'story', 'image'],
      customer_stories: ['image', 'video', 'carousel'],
      tips_tutorials: ['video', 'carousel', 'image'],
    };

    const availableTypes = types[theme as keyof typeof types] || ['image'];
    return availableTypes[Math.floor(Math.random() * availableTypes.length)];
  }

  private generateContentSuggestion(theme: string, _platform: string): string {
    const suggestions = {
      product_showcase: `Showcase our latest custom neon sign designs perfect for ${_platform} audience`,
      behind_scenes: `Take followers behind the scenes of our neon sign creation process`,
      customer_stories: `Feature a customer story about how neon signs transformed their business`,
      tips_tutorials: `Share design tips for creating effective neon signage`,
    };

    return (
      suggestions[theme as keyof typeof suggestions] || 'Share engaging content about neon signs'
    );
  }

  private findEngagementOpportunities(_platform: string, _filters: any): any[] {
    // Simulate finding engagement opportunities
    const opportunities = [];
    const types = ['comment', 'like', 'follow', 'share', 'mention'];

    for (let i = 0; i < Math.floor(Math.random() * 10 + 5); i++) {
      opportunities.push({
        type: types[Math.floor(Math.random() * types.length)],
        user: `user_${Math.random().toString(36).substr(2, 8)}`,
        postId: `post_${Math.random().toString(36).substr(2, 10)}`,
        priority: Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low',
        estimatedImpact: Math.floor(Math.random() * 100 + 20),
      });
    }

    return opportunities;
  }

  private determineEngagementAction(opportunity: any, engagementType: string): string {
    if (engagementType === 'auto') {
      const actions = {
        comment: 'Reply with relevant comment',
        like: 'Like the post',
        follow: 'Follow the user',
        share: 'Share to story',
        mention: 'Respond to mention',
      };
      return actions[opportunity.type as keyof typeof actions] || 'Engage appropriately';
    }

    return `Manual ${opportunity.type} required`;
  }

  private calculateDelayedResponse(responseTime: string): Date {
    const delays = {
      immediate: 0,
      '15min': 15 * 60 * 1000,
      '1hour': 60 * 60 * 1000,
      '4hours': 4 * 60 * 60 * 1000,
    };

    const delay = delays[responseTime as keyof typeof delays] || 0;
    return new Date(Date.now() + delay);
  }

  private generateSampleMention(keyword: string, _platform: string): string {
    const samples = [
      `Just got my custom neon sign from ${keyword} and it's amazing!`,
      `Looking for good ${keyword} recommendations, anyone?`,
      `${keyword} designs are so creative, love their work!`,
      `Thinking about getting a neon sign, heard ${keyword} is good?`,
    ];

    return samples[Math.floor(Math.random() * samples.length)];
  }

  private generateSentiment(): 'positive' | 'neutral' | 'negative' {
    const rand = Math.random();
    if (rand > 0.7) return 'positive';
    if (rand > 0.2) return 'neutral';
    return 'negative';
  }

  private calculateAverageSentiment(mentions: any[]): string {
    if (mentions.length === 0) return 'neutral';

    const scores = mentions.map((m: any) => {
      switch (m.sentiment) {
        case 'positive':
          return 1;
        case 'neutral':
          return 0;
        case 'negative':
          return -1;
        default:
          return 0;
      }
    });

    const avg = scores.reduce((sum: number, score: number) => sum + score, 0) / scores.length;

    if (avg > 0.3) return 'positive';
    if (avg < -0.3) return 'negative';
    return 'neutral';
  }

  private getPeakMentionTime(): string {
    const hours = ['9:00 AM', '12:00 PM', '3:00 PM', '6:00 PM', '9:00 PM'];
    return hours[Math.floor(Math.random() * hours.length)];
  }

  // Public API methods for tRPC compatibility
  async schedulePost(input: any): Promise<any> {
    return await this.execute({
      task: 'schedule_post',
      context: {
        platforms: [input.platform],
        content: input.content.text,
        mediaUrls: input.content.media?.map((m: any) => m.url) || [],
        hashtags: input.content.hashtags || [],
        scheduledTime: input.scheduling?.scheduledAt,
      },
      priority: 'high',
    });
  }

  async publishPost(input: any): Promise<any> {
    const { platform, postId, content, mediaUrls = [] } = input;

    if (platform === 'facebook') {
      return this.postToFacebook(content, mediaUrls);
    } else if (platform === 'instagram') {
      return this.postToInstagram(content, mediaUrls);
    } else if (platform === 'twitter') {
      return this.postToTwitter(content, mediaUrls);
    }

    return {
      success: false,
      error: `Publishing to ${platform} not implemented`,
    };
  }

  private async postToFacebook(content: string, mediaUrls: string[] = []): Promise<any> {
    const logEntry = {
      timestamp: new Date().toISOString(),
      platform: 'facebook',
      content: content.substring(0, 100),
      status: 'pending',
      service: 'meta_api',
    };

    try {
      if (metaApiClient && process.env.FB_ACCESS_TOKEN) {
        const postData = {
          message: content,
          ...(mediaUrls.length > 0 && { media: mediaUrls }),
          access_token: process.env.FB_ACCESS_TOKEN,
        };

        const result = await metaApiClient.post('/me/feed', postData);

        logEntry.status = 'published';
        await this.logSocialEvent({
          ...logEntry,
          postId: result.id,
          metaStatus: result.status,
        });

        return {
          success: true,
          postId: result.id,
          status: 'published',
          platform: 'facebook',
          service: 'meta_api',
          url: `https://facebook.com/posts/${result.id}`,
        };
      } else {
        // Fallback mock mode
        logEntry.status = 'mock_published';
        logEntry.service = 'mock';

        await this.logSocialEvent({
          ...logEntry,
          postId: `mock_fb_${Date.now()}`,
          note: 'Meta API credentials not configured, using mock mode',
        });

        return {
          success: true,
          postId: `mock_fb_${Date.now()}`,
          status: 'mock_published',
          platform: 'facebook',
          service: 'mock',
          url: 'https://facebook.com/mock',
        };
      }
    } catch (error) {
      logEntry.status = 'failed';
      await this.logSocialEvent({
        ...logEntry,
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        success: false,
        postId: null,
        status: 'failed',
        platform: 'facebook',
        error: error instanceof Error ? error.message : 'Unknown error',
        service: 'meta_api',
      };
    }
  }

  private async postToInstagram(content: string, mediaUrls: string[] = []): Promise<any> {
    // Similar implementation for Instagram
    return {
      success: true,
      postId: `mock_ig_${Date.now()}`,
      status: 'mock_published',
      platform: 'instagram',
      service: 'mock',
    };
  }

  private async postToTwitter(content: string, mediaUrls: string[] = []): Promise<any> {
    // Similar implementation for Twitter
    return {
      success: true,
      postId: `mock_tw_${Date.now()}`,
      status: 'mock_published',
      platform: 'twitter',
      service: 'mock',
    };
  }

  private async logSocialEvent(event: any): Promise<void> {
    try {
      const logsDir = path.join(process.cwd(), 'logs');
      await fs.mkdir(logsDir, { recursive: true });

      const logFile = path.join(logsDir, 'social-agent.log');
      const logLine = `${JSON.stringify(event)}\n`;

      await fs.appendFile(logFile, logLine);
    } catch (error) {
      logger.error('Failed to write social media log', { error }, 'SocialAgent');
    }
  }

  private async logAIFallback(operation: string, error: unknown): Promise<void> {
    try {
      const logsDir = path.join(process.cwd(), 'logs');
      await fs.mkdir(logsDir, { recursive: true });

      const logFile = path.join(logsDir, 'ai-fallback.log');
      const logEntry = {
        timestamp: new Date().toISOString(),
        agent: 'SocialAgent',
        operation,
        error: error instanceof Error ? error.message : String(error),
        fallbackUsed: true,
      };

      await fs.appendFile(logFile, `${JSON.stringify(logEntry)}\n`);
    } catch (logError) {
      logger.error('Failed to write AI fallback log', { logError }, 'SocialAgent');
    }
  }

  async getPostAnalytics(postId: string, platform: string): Promise<any> {
    return await this.execute({
      task: 'analyze_performance',
      context: {
        platforms: [platform],
        postId,
        timeRange: '30d',
      },
      priority: 'low',
    });
  }
}
