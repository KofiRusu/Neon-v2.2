import { AbstractAgent, AgentPayload, AgentResult } from '../base-agent';
import { z } from 'zod';
import { LearningService } from '../utils/LearningService';
import { withRetryTimeoutFallback } from '../utils/withRetry';

// Input validation schema for context
const SocialTaskSchema = z.object({
  topic: z.string().optional(),
  platform: z.string().optional(),
  content: z.string().optional(),
  datetime: z.string().optional(),
  message: z.string().optional(),
  sentiment: z.enum(['positive', 'neutral', 'negative']).optional(),
  campaignId: z.string().optional(), // Add campaignId for learning integration
});

export class SimpleSocialAgent extends AbstractAgent {
  constructor(id: string = 'simple-social-agent', name: string = 'SimpleSocialAgent') {
    super(id, name, 'social', [
      'generate_post',
      'schedule_post',
      'reply_to_message',
      'get_status',
    ]);
  }

  async execute(payload: AgentPayload): Promise<AgentResult> {
    return this.executeWithErrorHandling(payload, async () => {
      const { task, context } = payload;
      
      // Validate context with our schema
      const validationResult = SocialTaskSchema.safeParse(context);
      if (!validationResult.success) {
        throw new Error(`Invalid input: ${validationResult.error.message}`);
      }

      const input = validationResult.data;

      switch (task) {
        case 'generate_post':
          return await this.generatePost(input);
        case 'schedule_post':
          return await this.schedulePost(input);
        case 'reply_to_message':
          return await this.replyToMessage(input);
        case 'get_status':
          return await this.getSocialStatus();
        default:
          throw new Error(`Unknown task: ${task}`);
      }
    });
  }

  private async generatePost(input: any) {
    const { topic, platform } = input;
    
    if (!topic || !platform) {
      throw new Error('Topic and platform are required for post generation');
    }

    // Simple post generation logic
    const post = `Generated post for ${platform} on ${topic}`;
    
    return {
      success: true,
      post,
      platform,
      topic,
      generatedAt: new Date().toISOString(),
    };
  }

  private async schedulePost(input: any) {
    const { content, datetime, platform, campaignId } = input;
    
    if (!content || !datetime || !platform) {
      throw new Error('Content, datetime, and platform are required for scheduling');
    }

    // Initialize variables for learning adjustments
    let adjustedDatetime = datetime;
    let skipPost = false;
    let learningDecision = 'No learning applied - no campaignId provided';
    let platformAdjustments: string[] = [];

    // Apply learning-based adjustments if campaignId is provided
    if (campaignId) {
      try {
        // Use retry logic for learning service calls
        const learningProfile = await withRetryTimeoutFallback(
          () => LearningService.generateLearningProfile(campaignId),
          {
            platformStrategy: 'standard_timing',
            score: 70,
            toneAdjustment: 'neutral',
            trendAdjustment: 'balanced'
          }, // Fallback profile
          { retries: 2, delay: 500, timeoutMs: 5000 }
        );
        
        const learningResults = await this.applyLearningAdjustments(
          platform,
          datetime,
          learningProfile,
          campaignId
        );
        
        adjustedDatetime = learningResults.adjustedDatetime;
        skipPost = learningResults.skipPost;
        platformAdjustments = learningResults.adjustments;
        learningDecision = `Applied learning adjustments: ${learningProfile.platformStrategy} (Score: ${learningProfile.score})`;
        
        // Log learning decision in memory store
        await this.memoryStore.storeMemory(
          this.id,
          campaignId,
          { action: 'schedule_learning_adjustment', platform, originalDatetime: datetime, campaignId },
          { 
            learningProfile,
            originalDatetime: datetime,
            adjustedDatetime,
            skipPost,
            platformAdjustments,
            decision: learningDecision
          },
          {
            success: true,
            tokensUsed: 0,
            cost: 0,
            executionTime: 0,
            metadata: { type: 'learning_adjustment', agent: 'simple-social-agent' }
          }
        );
        
      } catch (error) {
        console.warn('Learning adjustment failed, using standard scheduling:', error);
        learningDecision = 'Learning adjustment failed - using standard scheduling';
        
        // Log fallback decision
        await this.memoryStore.storeMemory(
          this.id,
          campaignId,
          { action: 'schedule_learning_fallback', platform, campaignId },
          { error: error instanceof Error ? error.message : 'Unknown error', decision: learningDecision },
          {
            success: false,
            tokensUsed: 0,
            cost: 0,
            executionTime: 0,
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            metadata: { type: 'learning_fallback', agent: 'simple-social-agent' }
          }
        );
      }
    }

    // Check if post should be skipped based on learning
    if (skipPost) {
      console.log(`Skipping post on ${platform} based on learning insights`);
      return {
        success: true,
        scheduled: false,
        skipped: true,
        reason: 'Platform suppressed based on learning insights',
        content,
        originalDatetime: datetime,
        platform,
        learningDecision,
        platformAdjustments,
        scheduledAt: new Date().toISOString(),
      };
    }

    console.log(`SimpleSocialAgent Learning Decision: ${learningDecision}`);
    if (platformAdjustments.length > 0) {
      console.log(`Platform adjustments applied: ${platformAdjustments.join(', ')}`);
    }

    // Return successful scheduling result
    return {
      success: true,
      scheduled: true,
      content,
      datetime: adjustedDatetime,
      originalDatetime: datetime,
      platform,
      learningDecision,
      platformAdjustments,
      timingAdjusted: adjustedDatetime !== datetime,
      scheduledAt: new Date().toISOString(),
    };
  }

  /**
   * Apply learning-based adjustments to scheduling
   */
  private async applyLearningAdjustments(
    platform: string,
    datetime: string,
    learningProfile: any,
    campaignId: string
  ): Promise<{
    adjustedDatetime: string;
    skipPost: boolean;
    adjustments: string[];
  }> {
    let adjustedDatetime = datetime;
    let skipPost = false;
    const adjustments: string[] = [];
    
    const platformStrategy = learningProfile.platformStrategy.toLowerCase();
    
    // Platform-specific timing adjustments
    if (platformStrategy.includes(`earlier on ${platform.toLowerCase()}`) || 
        platformStrategy.includes(`post earlier on ${platform.toLowerCase()}`)) {
      const adjustedTime = this.adjustPostTime(datetime, -2); // 2 hours earlier
      if (adjustedTime !== datetime) {
        adjustedDatetime = adjustedTime;
        adjustments.push(`Moved post 2 hours earlier on ${platform}`);
        console.log(`Applied earlier posting for ${platform}: ${datetime} → ${adjustedDatetime}`);
      }
    }
    
    if (platformStrategy.includes(`later on ${platform.toLowerCase()}`) || 
        platformStrategy.includes(`post later on ${platform.toLowerCase()}`)) {
      const adjustedTime = this.adjustPostTime(datetime, 2); // 2 hours later
      if (adjustedTime !== datetime) {
        adjustedDatetime = adjustedTime;
        adjustments.push(`Moved post 2 hours later on ${platform}`);
        console.log(`Applied later posting for ${platform}: ${datetime} → ${adjustedDatetime}`);
      }
    }
    
    // Platform frequency adjustments
    if (platformStrategy.includes(`increase frequency on ${platform.toLowerCase()}`)) {
      adjustments.push(`Increase posting frequency on ${platform}`);
      console.log(`Recommending increased frequency for ${platform}`);
    }
    
    if (platformStrategy.includes(`decrease frequency on ${platform.toLowerCase()}`)) {
      adjustments.push(`Decrease posting frequency on ${platform}`);
      console.log(`Recommending decreased frequency for ${platform}`);
    }
    
    // Platform suppression based on poor performance
    if (platformStrategy.includes(`pause ${platform.toLowerCase()}`)) {
      skipPost = true;
      adjustments.push(`Platform ${platform} suppressed due to poor performance`);
      console.log(`Suppressing post on ${platform} due to learning insights`);
    }
    
    if (platformStrategy.includes('focus budget') && !platformStrategy.includes(platform.toLowerCase())) {
      // If strategy suggests focusing budget on specific platforms and this isn't one of them
      const focusPlatforms = this.extractPlatformsFromStrategy(platformStrategy);
      if (focusPlatforms.length > 0 && !focusPlatforms.includes(platform.toLowerCase())) {
        skipPost = true;
        adjustments.push(`Platform ${platform} deprioritized - focusing budget on ${focusPlatforms.join(', ')}`);
        console.log(`Deprioritizing ${platform} to focus on: ${focusPlatforms.join(', ')}`);
      }
    }
    
    // Quality-based timing optimization
    if (learningProfile.score < 60) {
      // For low-performing campaigns, try posting at different times
      const optimizedTime = this.getOptimizedPostTime(platform, datetime);
      if (optimizedTime !== datetime) {
        adjustedDatetime = optimizedTime;
        adjustments.push(`Optimized timing for low-performing campaign on ${platform}`);
        console.log(`Applied performance-based timing optimization for ${platform}`);
      }
    }
    
    return {
      adjustedDatetime,
      skipPost,
      adjustments
    };
  }

  /**
   * Adjust post time by specified hours
   */
  private adjustPostTime(datetime: string, hoursOffset: number): string {
    try {
      const date = new Date(datetime);
      if (isNaN(date.getTime())) {
        console.warn(`Invalid datetime format: ${datetime}`);
        return datetime;
      }
      
      date.setHours(date.getHours() + hoursOffset);
      return date.toISOString();
    } catch (error) {
      console.warn(`Error adjusting post time: ${error}`);
      return datetime;
    }
  }

  /**
   * Extract platform names from strategy text
   */
  private extractPlatformsFromStrategy(strategy: string): string[] {
    const platforms = ['instagram', 'facebook', 'twitter', 'linkedin', 'tiktok', 'youtube'];
    const foundPlatforms: { platform: string; index: number }[] = [];
    const lowerStrategy = strategy.toLowerCase();
    
    platforms.forEach(platform => {
      const index = lowerStrategy.indexOf(platform);
      if (index !== -1) {
        foundPlatforms.push({ platform, index });
      }
    });
    
    // Sort by order of appearance in the text
    foundPlatforms.sort((a, b) => a.index - b.index);
    
    return foundPlatforms.map(item => item.platform);
  }

  /**
   * Get optimized post time based on platform best practices
   */
  private getOptimizedPostTime(platform: string, originalDatetime: string): string {
    try {
      const date = new Date(originalDatetime);
      if (isNaN(date.getTime())) {
        return originalDatetime;
      }
      
      const currentHour = date.getUTCHours(); // Use UTC to avoid timezone issues
      let optimizedHour = currentHour;
      let moveToNextDay = false;
      
      // Platform-specific optimal posting times (based on general best practices)
      switch (platform.toLowerCase()) {
        case 'instagram':
          // Instagram: 6 AM, 12 PM, 7 PM
          if (currentHour < 6) {
            optimizedHour = 6;
          } else if (currentHour >= 6 && currentHour < 12) {
            optimizedHour = 12;
          } else if (currentHour >= 12 && currentHour < 19) {
            optimizedHour = 19;
          } else {
            // After 7 PM, schedule for next day at 6 AM
            optimizedHour = 6;
            moveToNextDay = true;
          }
          break;
          
        case 'facebook':
          // Facebook: 9 AM, 1 PM, 8 PM
          if (currentHour < 9) {
            optimizedHour = 9;
          } else if (currentHour >= 9 && currentHour < 13) {
            optimizedHour = 13;
          } else if (currentHour >= 13 && currentHour < 20) {
            optimizedHour = 20;
          } else {
            // After 8 PM, schedule for next day at 9 AM
            optimizedHour = 9;
            moveToNextDay = true;
          }
          break;
          
        case 'twitter':
          // Twitter: 8 AM, 12 PM, 5 PM, 8 PM
          if (currentHour < 8) {
            optimizedHour = 8;
          } else if (currentHour >= 8 && currentHour < 12) {
            optimizedHour = 12;
          } else if (currentHour >= 12 && currentHour < 17) {
            optimizedHour = 17;
          } else if (currentHour >= 17 && currentHour < 20) {
            optimizedHour = 20;
          } else {
            // After 8 PM, schedule for next day at 8 AM
            optimizedHour = 8;
            moveToNextDay = true;
          }
          break;
          
        case 'linkedin':
          // LinkedIn: 8 AM, 12 PM, 5 PM (business hours)
          if (currentHour < 8) {
            optimizedHour = 8;
          } else if (currentHour >= 8 && currentHour < 12) {
            optimizedHour = 12;
          } else if (currentHour >= 12 && currentHour < 17) {
            optimizedHour = 17;
          } else {
            // After 5 PM, schedule for next day at 8 AM
            optimizedHour = 8;
            moveToNextDay = true;
          }
          break;
          
        default:
          // Default to afternoon posting
          optimizedHour = 14;
      }
      
      if (optimizedHour !== currentHour || moveToNextDay) {
        if (moveToNextDay) {
          date.setUTCDate(date.getUTCDate() + 1);
        }
        date.setUTCHours(optimizedHour, 0, 0, 0);
        return date.toISOString();
      }
      
      return originalDatetime;
    } catch (error) {
      console.warn(`Error optimizing post time: ${error}`);
      return originalDatetime;
    }
  }

  private async replyToMessage(input: any) {
    const { message, sentiment, platform } = input;
    
    if (!message || !sentiment || !platform) {
      throw new Error('Message, sentiment, and platform are required for reply');
    }

    // Simple reply generation logic
    const reply = `Auto-reply for ${sentiment} message on ${platform}`;
    
    return {
      success: true,
      reply,
      originalMessage: message,
      sentiment,
      platform,
      repliedAt: new Date().toISOString(),
    };
  }

  private async getSocialStatus() {
    return {
      agent: 'SimpleSocialAgent',
      status: 'active',
      lastRun: new Date().toISOString(),
      capabilities: this.capabilities,
    };
  }

  // Legacy method for backward compatibility
  validate(input: unknown) {
    return SocialTaskSchema.safeParse(input);
  }
} 