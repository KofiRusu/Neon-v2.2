import { ScheduleConfig, RetryConfig } from "./AgentScheduler";

export interface ScheduleTemplate {
  id: string;
  name: string;
  description: string;
  agentType: string;
  cron: string;
  timezone: string;
  config: Record<string, any>;
  retryConfig: RetryConfig;
  timeout: number;
  tags: string[];
}

export interface CronPattern {
  id: string;
  name: string;
  description: string;
  expression: string;
  examples: string[];
}

/**
 * Predefined cron patterns for common scheduling needs
 */
export const CRON_PATTERNS: CronPattern[] = [
  {
    id: "every_minute",
    name: "Every Minute",
    description: "Runs every minute (for testing only)",
    expression: "* * * * *",
    examples: ["Development testing", "High-frequency monitoring"],
  },
  {
    id: "every_5_minutes",
    name: "Every 5 Minutes",
    description: "Runs every 5 minutes",
    expression: "*/5 * * * *",
    examples: ["Real-time monitoring", "Quick health checks"],
  },
  {
    id: "every_15_minutes",
    name: "Every 15 Minutes",
    description: "Runs every 15 minutes",
    expression: "*/15 * * * *",
    examples: ["Frequent data sync", "Social media monitoring"],
  },
  {
    id: "every_30_minutes",
    name: "Every 30 Minutes",
    description: "Runs every 30 minutes",
    expression: "*/30 * * * *",
    examples: ["Regular updates", "Content analysis"],
  },
  {
    id: "hourly",
    name: "Hourly",
    description: "Runs every hour at minute 0",
    expression: "0 * * * *",
    examples: ["Analytics collection", "Report generation"],
  },
  {
    id: "every_2_hours",
    name: "Every 2 Hours",
    description: "Runs every 2 hours",
    expression: "0 */2 * * *",
    examples: ["Trend analysis", "SEO monitoring"],
  },
  {
    id: "every_6_hours",
    name: "Every 6 Hours",
    description: "Runs every 6 hours",
    expression: "0 */6 * * *",
    examples: ["SEO alerts", "Performance reviews"],
  },
  {
    id: "every_12_hours",
    name: "Every 12 Hours",
    description: "Runs twice daily at midnight and noon",
    expression: "0 0,12 * * *",
    examples: ["Daily reports", "Campaign updates"],
  },
  {
    id: "daily",
    name: "Daily",
    description: "Runs once daily at midnight",
    expression: "0 0 * * *",
    examples: ["Daily summaries", "Cleanup tasks"],
  },
  {
    id: "daily_morning",
    name: "Daily Morning",
    description: "Runs daily at 9 AM",
    expression: "0 9 * * *",
    examples: ["Morning reports", "Campaign launches"],
  },
  {
    id: "daily_evening",
    name: "Daily Evening",
    description: "Runs daily at 6 PM",
    expression: "0 18 * * *",
    examples: ["End-of-day reports", "Performance summaries"],
  },
  {
    id: "weekly",
    name: "Weekly",
    description: "Runs weekly on Monday at midnight",
    expression: "0 0 * * 1",
    examples: ["Weekly reports", "Content planning"],
  },
  {
    id: "monthly",
    name: "Monthly",
    description: "Runs monthly on the 1st at midnight",
    expression: "0 0 1 * *",
    examples: ["Monthly analytics", "Budget reviews"],
  },
  {
    id: "business_hours",
    name: "Business Hours",
    description: "Runs every hour during business hours (9 AM - 5 PM, Mon-Fri)",
    expression: "0 9-17 * * 1-5",
    examples: ["Customer support", "Business monitoring"],
  },
];

/**
 * Predefined schedule templates for common use cases
 */
export const SCHEDULE_TEMPLATES: ScheduleTemplate[] = [
  {
    id: "seo_monitoring_frequent",
    name: "SEO Monitoring (Frequent)",
    description: "Monitors SEO performance every 2 hours for critical sites",
    agentType: "SEOAlertAgent",
    cron: "0 */2 * * *",
    timezone: "UTC",
    config: {
      timeframe: "24h",
      thresholds: {
        scoreDropThreshold: 5,
        keywordCannibalThreshold: 2,
        metadataCompleteness: 0.9,
      },
    },
    retryConfig: {
      maxRetries: 2,
      retryDelay: 10000,
      backoffMultiplier: 2,
      maxRetryDelay: 30000,
    },
    timeout: 180000, // 3 minutes
    tags: ["seo", "monitoring", "frequent"],
  },
  {
    id: "seo_monitoring_daily",
    name: "SEO Monitoring (Daily)",
    description: "Comprehensive daily SEO analysis and alerting",
    agentType: "SEOAlertAgent",
    cron: "0 9 * * *",
    timezone: "UTC",
    config: {
      timeframe: "7d",
      thresholds: {
        scoreDropThreshold: 10,
        keywordCannibalThreshold: 3,
        metadataCompleteness: 0.8,
      },
    },
    retryConfig: {
      maxRetries: 3,
      retryDelay: 15000,
      backoffMultiplier: 2,
      maxRetryDelay: 60000,
    },
    timeout: 300000, // 5 minutes
    tags: ["seo", "monitoring", "daily"],
  },
  {
    id: "trend_analysis_hourly",
    name: "Trend Analysis (Hourly)",
    description: "Hourly trend analysis for rapid market insights",
    agentType: "TrendAgent",
    cron: "0 * * * *",
    timezone: "UTC",
    config: {
      keywords: ["AI", "marketing", "automation"],
      platforms: ["twitter", "instagram", "tiktok"],
      region: "global",
    },
    retryConfig: {
      maxRetries: 2,
      retryDelay: 5000,
      backoffMultiplier: 2,
      maxRetryDelay: 20000,
    },
    timeout: 240000, // 4 minutes
    tags: ["trends", "analysis", "hourly"],
  },
  {
    id: "trend_analysis_daily",
    name: "Trend Analysis (Daily)",
    description: "Comprehensive daily trend analysis and reporting",
    agentType: "TrendAgent",
    cron: "0 8 * * *",
    timezone: "UTC",
    config: {
      keywords: ["digital marketing", "social media", "content creation"],
      platforms: ["all"],
      region: "global",
      includeCompetitorAnalysis: true,
    },
    retryConfig: {
      maxRetries: 3,
      retryDelay: 10000,
      backoffMultiplier: 2,
      maxRetryDelay: 45000,
    },
    timeout: 420000, // 7 minutes
    tags: ["trends", "analysis", "daily", "comprehensive"],
  },
  {
    id: "content_generation_weekly",
    name: "Content Generation (Weekly)",
    description: "Weekly content generation for blogs and social media",
    agentType: "ContentAgent",
    cron: "0 10 * * 1",
    timezone: "UTC",
    config: {
      contentTypes: ["blog", "social"],
      topics: ["marketing tips", "industry insights", "how-to guides"],
      tone: "professional",
      wordCount: 500,
    },
    retryConfig: {
      maxRetries: 2,
      retryDelay: 20000,
      backoffMultiplier: 2,
      maxRetryDelay: 60000,
    },
    timeout: 600000, // 10 minutes
    tags: ["content", "generation", "weekly"],
  },
  {
    id: "performance_monitoring",
    name: "Performance Monitoring",
    description: "Monitor system and agent performance every 30 minutes",
    agentType: "SEOAlertAgent",
    cron: "*/30 * * * *",
    timezone: "UTC",
    config: {
      monitoringType: "performance",
      metrics: ["response_time", "success_rate", "error_rate"],
    },
    retryConfig: {
      maxRetries: 1,
      retryDelay: 5000,
      backoffMultiplier: 1,
      maxRetryDelay: 5000,
    },
    timeout: 60000, // 1 minute
    tags: ["monitoring", "performance", "frequent"],
  },
];

/**
 * Retry configuration presets
 */
export const RETRY_PRESETS: Record<string, RetryConfig> = {
  minimal: {
    maxRetries: 1,
    retryDelay: 5000,
    backoffMultiplier: 1,
    maxRetryDelay: 5000,
  },
  standard: {
    maxRetries: 3,
    retryDelay: 5000,
    backoffMultiplier: 2,
    maxRetryDelay: 60000,
  },
  aggressive: {
    maxRetries: 5,
    retryDelay: 2000,
    backoffMultiplier: 1.5,
    maxRetryDelay: 30000,
  },
  patient: {
    maxRetries: 3,
    retryDelay: 15000,
    backoffMultiplier: 2,
    maxRetryDelay: 120000,
  },
};

/**
 * Timezone configurations
 */
export const TIMEZONE_OPTIONS = [
  { value: "UTC", label: "UTC", offset: "+00:00" },
  { value: "America/New_York", label: "Eastern Time", offset: "-05:00" },
  { value: "America/Chicago", label: "Central Time", offset: "-06:00" },
  { value: "America/Denver", label: "Mountain Time", offset: "-07:00" },
  { value: "America/Los_Angeles", label: "Pacific Time", offset: "-08:00" },
  { value: "Europe/London", label: "London", offset: "+00:00" },
  { value: "Europe/Paris", label: "Paris", offset: "+01:00" },
  { value: "Europe/Berlin", label: "Berlin", offset: "+01:00" },
  { value: "Asia/Tokyo", label: "Tokyo", offset: "+09:00" },
  { value: "Asia/Shanghai", label: "Shanghai", offset: "+08:00" },
  { value: "Asia/Dubai", label: "Dubai", offset: "+04:00" },
  { value: "Australia/Sydney", label: "Sydney", offset: "+11:00" },
];

/**
 * Agent type configurations
 */
export const AGENT_CONFIGS = {
  SEOAlertAgent: {
    displayName: "SEO Alert Agent",
    description: "Monitors SEO performance and generates alerts for issues",
    icon: "🔍",
    color: "#3b82f6",
    defaultTasks: ["monitor_seo_performance", "detect_score_drops", "find_opportunities"],
    configSchema: {
      timeframe: {
        type: "select",
        options: ["24h", "7d", "30d"],
        default: "24h",
        description: "Analysis timeframe",
      },
      thresholds: {
        type: "object",
        properties: {
          scoreDropThreshold: { type: "number", default: 10, min: 1, max: 100 },
          keywordCannibalThreshold: { type: "number", default: 3, min: 1, max: 10 },
          metadataCompleteness: { type: "number", default: 0.8, min: 0, max: 1, step: 0.1 },
        },
      },
    },
  },
  TrendAgent: {
    displayName: "Trend Analysis Agent",
    description: "Analyzes market trends and social media patterns",
    icon: "📈",
    color: "#10b981",
    defaultTasks: ["analyze_trends", "predict_viral_content", "track_hashtags"],
    configSchema: {
      keywords: {
        type: "array",
        default: ["marketing", "AI", "social media"],
        description: "Keywords to track",
      },
      platforms: {
        type: "multiselect",
        options: ["twitter", "instagram", "tiktok", "linkedin", "all"],
        default: ["twitter", "instagram"],
        description: "Platforms to analyze",
      },
      region: {
        type: "select",
        options: ["global", "US", "Europe", "Asia"],
        default: "global",
        description: "Geographic region",
      },
    },
  },
  ContentAgent: {
    displayName: "Content Generation Agent",
    description: "Generates content for blogs, social media, and marketing",
    icon: "✍️",
    color: "#8b5cf6",
    defaultTasks: ["generate_content", "optimize_content", "create_variants"],
    configSchema: {
      contentTypes: {
        type: "multiselect",
        options: ["blog", "social", "email", "ads"],
        default: ["blog", "social"],
        description: "Types of content to generate",
      },
      tone: {
        type: "select",
        options: ["professional", "casual", "technical", "creative"],
        default: "professional",
        description: "Content tone",
      },
      wordCount: {
        type: "number",
        default: 500,
        min: 100,
        max: 2000,
        description: "Target word count",
      },
    },
  },
};

/**
 * Utility functions for schedule management
 */
export class ScheduleUtils {
  /**
   * Get a schedule template by ID
   */
  static getTemplate(id: string): ScheduleTemplate | undefined {
    return SCHEDULE_TEMPLATES.find(template => template.id === id);
  }

  /**
   * Get cron pattern by ID
   */
  static getCronPattern(id: string): CronPattern | undefined {
    return CRON_PATTERNS.find(pattern => pattern.id === id);
  }

  /**
   * Get templates by agent type
   */
  static getTemplatesByAgent(agentType: string): ScheduleTemplate[] {
    return SCHEDULE_TEMPLATES.filter(template => template.agentType === agentType);
  }

  /**
   * Get templates by tag
   */
  static getTemplatesByTag(tag: string): ScheduleTemplate[] {
    return SCHEDULE_TEMPLATES.filter(template => template.tags.includes(tag));
  }

  /**
   * Create a schedule config from a template
   */
  static createFromTemplate(templateId: string, overrides: Partial<ScheduleConfig> = {}): ScheduleConfig {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    return {
      agentType: template.agentType,
      name: template.name,
      description: template.description,
      cron: template.cron,
      timezone: template.timezone,
      enabled: true,
      config: template.config,
      retryConfig: template.retryConfig,
      timeout: template.timeout,
      ...overrides,
    };
  }

  /**
   * Validate a cron expression
   */
  static validateCron(expression: string): boolean {
    try {
      // Basic validation - check if it has 5 or 6 parts
      const parts = expression.trim().split(/\s+/);
      return parts.length === 5 || parts.length === 6;
    } catch {
      return false;
    }
  }

  /**
   * Parse cron expression into human readable format
   */
  static describeCron(expression: string): string {
    const descriptions: Record<string, string> = {
      "* * * * *": "Every minute",
      "*/5 * * * *": "Every 5 minutes",
      "*/15 * * * *": "Every 15 minutes",
      "*/30 * * * *": "Every 30 minutes",
      "0 * * * *": "Every hour",
      "0 */2 * * *": "Every 2 hours",
      "0 */6 * * *": "Every 6 hours",
      "0 */12 * * *": "Every 12 hours",
      "0 0 * * *": "Daily at midnight",
      "0 9 * * *": "Daily at 9:00 AM",
      "0 18 * * *": "Daily at 6:00 PM",
      "0 0 * * 1": "Weekly on Monday",
      "0 0 1 * *": "Monthly on the 1st",
      "0 9-17 * * 1-5": "Hourly during business hours (Mon-Fri)",
    };

    return descriptions[expression] || "Custom schedule";
  }

  /**
   * Get next execution times for a cron expression
   */
  static getNextExecutions(expression: string, count: number = 5, timezone: string = "UTC"): Date[] {
    // This is a simplified implementation
    // In a real implementation, you'd use a proper cron library
    const dates: Date[] = [];
    let current = new Date();

    for (let i = 0; i < count; i++) {
      // Add 1 hour for simplified demo (replace with proper cron calculation)
      current = new Date(current.getTime() + 60 * 60 * 1000);
      dates.push(new Date(current));
    }

    return dates;
  }

  /**
   * Get recommended schedules for an agent type
   */
  static getRecommendedSchedules(agentType: string): ScheduleTemplate[] {
    const recommendations: Record<string, string[]> = {
      SEOAlertAgent: ["seo_monitoring_daily", "seo_monitoring_frequent"],
      TrendAgent: ["trend_analysis_daily", "trend_analysis_hourly"],
      ContentAgent: ["content_generation_weekly"],
    };

    const templateIds = recommendations[agentType] || [];
    return templateIds.map(id => this.getTemplate(id)).filter(Boolean) as ScheduleTemplate[];
  }

  /**
   * Generate a schedule name
   */
  static generateScheduleName(agentType: string, frequency: string): string {
    const agentNames: Record<string, string> = {
      SEOAlertAgent: "SEO Monitoring",
      TrendAgent: "Trend Analysis",
      ContentAgent: "Content Generation",
    };

    const agentName = agentNames[agentType] || agentType;
    return `${agentName} - ${frequency}`;
  }
}

export default {
  CRON_PATTERNS,
  SCHEDULE_TEMPLATES,
  RETRY_PRESETS,
  TIMEZONE_OPTIONS,
  AGENT_CONFIGS,
  ScheduleUtils,
}; 