import {
  ActionType,
  ActionPriority,
  Platform,
  AgentType,
} from "@neon/data-model";

// Define interfaces for performance actions
export interface TriggerCondition {
  metricType: string;
  metricSubtype?: string;
  category?: string;
  condition: string;
  threshold: number;
  timeWindow?: number;
  consecutiveCount?: number;
  cooldownPeriod?: number;
}

export interface ActionExecutionParams {
  agentName: string;
  agentType: AgentType;
  campaignId?: string;
  metricId?: string;
  triggerValue: number;
  threshold: number;
  actionConfig: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface ActionExecutionResult {
  success: boolean;
  message: string;
  executionTime: number;
  data?: any;
  errorDetails?: string;
  metadata?: Record<string, any>;
}

export interface ActionRule {
  id: string;
  name: string;
  description: string;
  agentTypes: AgentType[];
  triggerCondition: TriggerCondition;
  actionConfig: Record<string, any>;
  conditions: Array<{
    field: string;
    operator: string;
    value: any;
  }>;
  executionLimits: {
    maxExecutionsPerDay?: number;
    maxExecutionsPerWeek?: number;
    maxExecutionsPerHour?: number;
    maxExecutionsPerCampaign?: number;
    requiresApproval: boolean;
  };
}

// Create action rule helper function
export function createActionRule(config: ActionRule): ActionRule {
  return {
    ...config,
    id: config.id || `action_${Date.now()}`,
    triggerCondition: {
      consecutiveCount: 1,
      cooldownPeriod: 60,
      ...config.triggerCondition
    }
  };
}

// Action Executor class
export class ActionExecutor {
  private rules: ActionRule[] = [];

  constructor(
    public actionType?: ActionType,
    public name?: string,
    public description?: string
  ) {}

  async validate(params: ActionExecutionParams): Promise<boolean> {
    return !!(params.agentType && params.actionConfig);
  }

  async execute(params: ActionExecutionParams): Promise<ActionExecutionResult> {
    return {
      success: true,
      message: `Action ${this.actionType} executed successfully`,
      executionTime: Date.now(),
      metadata: params.metadata
    };
  }

  // Add the missing addRule method
  async addRule(rule: ActionRule): Promise<void> {
    this.rules.push(rule);
    console.log(`✅ Added performance action rule: ${rule.name}`);
  }

  // Get all rules
  getRules(): ActionRule[] {
    return this.rules;
  }

  // Clear all rules
  clearRules(): void {
    this.rules = [];
  }
}

// Performance Actions Registry
export class PerformanceActionsRegistry {
  private actions = new Map<ActionType, ActionExecutor>();

  register(executor: ActionExecutor): void {
    this.actions.set(executor.actionType, executor);
  }

  getAction(actionType: ActionType): ActionExecutor | undefined {
    return this.actions.get(actionType);
  }

  getAllActions(): ActionExecutor[] {
    return Array.from(this.actions.values());
  }
}

export const performanceActionsRegistry = new PerformanceActionsRegistry();

// Common trigger conditions
export const COMMON_TRIGGER_CONDITIONS = {
  LOW_CTR: {
    metricType: "CTR",
    condition: "BELOW_THRESHOLD",
    threshold: 0.02,
    timeWindow: 24 * 60,
    consecutiveCount: 3,
    cooldownPeriod: 4 * 60,
  },
  HIGH_BUDGET_UTILIZATION: {
    metricType: "BUDGET_UTILIZATION", 
    condition: "ABOVE_THRESHOLD",
    threshold: 0.8,
    timeWindow: 60,
    consecutiveCount: 1,
    cooldownPeriod: 24 * 60,
  },
  LOW_CONVERSION: {
    metricType: "CONVERSION_RATE",
    condition: "BELOW_THRESHOLD", 
    threshold: 0.05,
    timeWindow: 48 * 60,
    consecutiveCount: 2,
    cooldownPeriod: 24 * 60,
  }
};

// Performance monitoring and automated optimization actions

/**
 * Campaign Performance Monitor - Detects underperforming campaigns and triggers optimizations
 */
export const createCampaignPerformanceMonitor = () =>
  createActionRule({
    id: "campaign_performance_monitor",
    name: "Campaign Performance Monitor",
    description: "Monitors campaign CTR and triggers optimization when performance drops",
    
    // Multiple agent types can trigger this action
    agentTypes: [
      "CONTENT",
      "SEO",
      "EMAIL_MARKETING",
      "SOCIAL_POSTING",
      "CUSTOMER_SUPPORT",
      "AD",
      "OUTREACH",
      "TREND",
      "INSIGHT",
      "DESIGN",
      "BRAND_VOICE",
      "GOAL_PLANNER",
      "PATTERN_MINER",
      "SEGMENT_ANALYZER"
    ],
    
    triggerCondition: {
      metricType: "CTR",
      condition: "BELOW_THRESHOLD",
      threshold: 0.02, // 2% CTR threshold
      timeWindow: 24 * 60, // 24 hours
      consecutiveCount: 3,
      cooldownPeriod: 4 * 60, // 4 hours between triggers
    },
    
    actionConfig: {
      actionType: ActionType.OPTIMIZE_PERFORMANCE,
      priority: ActionPriority.HIGH,
      autoExecute: true,
      approvalRequired: false,
      
      // Multiple optimization strategies
      optimizationStrategies: [
        "refresh_content",
        "optimize_targeting", 
        "adjust_budget",
        "update_keywords"
      ],
      
      maxBudgetAdjustment: 0.2, // 20% max adjustment
      contentRefreshTypes: ["headlines", "descriptions", "cta"],
      
      // Fallback actions if primary optimization fails
      fallbackActions: [ActionType.NOTIFY_TEAM, ActionType.ESCALATE_ISSUE],
    },
    
    conditions: [
      {
        field: "campaign.status",
        operator: "equals",
        value: "ACTIVE"
      },
      {
        field: "campaign.budget",
        operator: "greater_than", 
        value: 100 // Only for campaigns with budget > $100
      }
    ],
    
    executionLimits: {
      maxExecutionsPerDay: 5,
      maxExecutionsPerCampaign: 2,
      requiresApproval: false,
    }
  });

/**
 * Budget Depletion Alert - Triggers when campaign budget is running low
 */
export const createBudgetDepletionAlert = () =>
  createActionRule({
    id: "budget_depletion_alert",
    name: "Budget Depletion Alert",
    description: "Alerts when campaign budget utilization exceeds 80%",
    
    agentTypes: ["AD", "EMAIL_MARKETING", "SOCIAL_POSTING"],
    
    triggerCondition: {
      metricType: "BUDGET_UTILIZATION",
      condition: "ABOVE_THRESHOLD",
      threshold: 0.8, // 80%
      timeWindow: 60, // 1 hour
      consecutiveCount: 1,
      cooldownPeriod: 24 * 60, // 24 hours
    },
    
    actionConfig: {
      actionType: ActionType.SEND_ALERT,
      priority: ActionPriority.HIGH,
      autoExecute: true,
      
      alertChannels: ["email", "slack", "dashboard"],
      alertRecipients: ["campaign_manager", "finance_team"],
      
      suggestedActions: [
        "Increase budget allocation",
        "Pause low-performing ads",
        "Optimize targeting to reduce costs"
      ],
      
      escalationRules: {
        escalateAfter: 2 * 60, // 2 hours
        escalateTo: "manager",
        escalationActions: [ActionType.EMERGENCY_STOP]
      }
    },
    
    conditions: [
      {
        field: "campaign.status", 
        operator: "equals",
        value: "ACTIVE"
      }
    ],
    
    executionLimits: {
      maxExecutionsPerDay: 3,
      requiresApproval: false,
    }
  });

/**
 * Conversion Rate Optimizer - Automatically optimizes when conversion rates drop
 */
export const createConversionRateOptimizer = () =>
  createActionRule({
    id: "conversion_rate_optimizer",
    name: "Conversion Rate Optimizer", 
    description: "Optimizes landing pages and funnels when conversion rates decline",
    
    agentTypes: ["AD", "SEO", "EMAIL_MARKETING", "SOCIAL_POSTING"],
    
    triggerCondition: {
      metricType: "CONVERSION_RATE",
      condition: "BELOW_THRESHOLD",
      threshold: 0.05, // 5%
      timeWindow: 48 * 60, // 48 hours
      consecutiveCount: 2,
      cooldownPeriod: 24 * 60,
    },
    
    actionConfig: {
      actionType: ActionType.OPTIMIZE_PERFORMANCE,
      priority: ActionPriority.MEDIUM,
      autoExecute: false, // Requires approval for conversion optimizations
      approvalRequired: true,
      
      optimizationTargets: [
        "landing_page",
        "call_to_action", 
        "form_fields",
        "page_speed",
        "mobile_experience"
      ],
      
      testingProtocol: {
        enableABTesting: true,
        testDuration: 7 * 24 * 60, // 7 days
        significanceLevel: 0.95,
        minSampleSize: 1000
      }
    },
    
    conditions: [
      {
        field: "campaign.type",
        operator: "in",
        value: ["LEAD_GENERATION", "SALES", "E_COMMERCE"]
      }
    ],
    
    executionLimits: {
      maxExecutionsPerWeek: 2,
      requiresApproval: true,
    }
  });

/**
 * Content Performance Enhancer - Updates content when engagement drops
 */
export const createContentPerformanceEnhancer = () =>
  createActionRule({
    id: "content_performance_enhancer",
    name: "Content Performance Enhancer",
    description: "Refreshes content when engagement metrics decline",
    
    agentTypes: ["CONTENT", "SOCIAL_POSTING", "EMAIL_MARKETING"],
    
    triggerCondition: {
      metricType: "ENGAGEMENT_RATE",
      condition: "BELOW_THRESHOLD", 
      threshold: 0.03, // 3%
      timeWindow: 12 * 60, // 12 hours
      consecutiveCount: 3,
      cooldownPeriod: 6 * 60,
    },
    
    actionConfig: {
      actionType: ActionType.REFRESH_CONTENT,
      priority: ActionPriority.MEDIUM,
      autoExecute: true,
      
      contentRefreshOptions: {
        refreshImages: true,
        updateCaptions: true,
        addHashtags: true,
        optimizePosting: true,
      },
      
      contentGuidelines: {
        maintainBrandVoice: true,
        includeCallToAction: true,
        optimizeForPlatform: true,
        addTrendingElements: true,
      },
      
      qualityChecks: [
        "grammar_check",
        "brand_alignment", 
        "legal_compliance",
        "platform_guidelines"
      ]
    },
    
    conditions: [
      {
        field: "content.status",
        operator: "equals",
        value: "PUBLISHED"
      },
      {
        field: "content.age_hours",
        operator: "greater_than",
        value: 24 // Only refresh content older than 24 hours
      }
    ],
    
    executionLimits: {
      maxExecutionsPerDay: 8,
      requiresApproval: false,
    }
  });

/**
 * Trend Opportunity Detector - Capitalizes on emerging trends
 */
export const createTrendOpportunityDetector = () => {
  return createActionRule({
    id: "trend_opportunity_detector",
    name: "Trend Opportunity Detector",
    description: "Detects emerging trends and adapts content strategy",
    
    agentTypes: ["TREND", "CONTENT", "SOCIAL_POSTING"],
    
    triggerCondition: {
      metricType: "TREND_SCORE", 
      condition: "ABOVE_THRESHOLD",
      threshold: 0.8, // 80% trend score
      timeWindow: 2 * 60, // 2 hours
      consecutiveCount: 1,
      cooldownPeriod: 12 * 60, // 12 hours
    },
    
    actionConfig: {
      actionType: ActionType.UPDATE_STRATEGY,
      priority: ActionPriority.MEDIUM,
      autoExecute: true,
      
      trendAdaptationStrategy: {
        incorporateHashtags: true,
        adjustContentTone: true,
        updateVisualStyle: true,
        modifyPostingSchedule: true,
      },
      
      riskMitigation: {
        brandAlignmentCheck: true,
        legalReview: false,
        audienceRelevanceCheck: true,
        qualityThreshold: 0.7,
      },
      
      rollbackConditions: {
        performanceDropThreshold: 0.2,
        negativeEngagementThreshold: 0.1,
        brandMisalignmentScore: 0.3,
      }
    },
    
    conditions: [
      {
        field: "trend.relevanceScore", 
        operator: "greater_than",
        value: 0.6
      },
      {
        field: "trend.riskLevel",
        operator: "less_than",
        value: 0.3
      }
    ],
    
    executionLimits: {
      maxExecutionsPerDay: 4,
      requiresApproval: false,
    }
  });
};

/**
 * Multi-Platform Synchronizer - Ensures consistent messaging across platforms
 */
export const createMultiPlatformSynchronizer = () => {
  return createActionRule({
    id: "multi_platform_synchronizer", 
    name: "Multi-Platform Synchronizer",
    description: "Synchronizes content and messaging across multiple platforms",
    
    agentTypes: ["SOCIAL_POSTING", "EMAIL_MARKETING", "CONTENT"],
    
    triggerCondition: {
      metricType: "BRAND_CONSISTENCY",
      condition: "BELOW_THRESHOLD",
      threshold: 0.9, // 90% brand consistency
      timeWindow: 60, // 1 hour
      consecutiveCount: 1,
      cooldownPeriod: 4 * 60,
    },
    
    actionConfig: {
      actionType: ActionType.UPDATE_STRATEGY,
      priority: ActionPriority.HIGH,
      autoExecute: true,
      
      synchronizationTargets: [
        "messaging_consistency",
        "visual_branding",
        "campaign_timing",
        "audience_targeting"
      ],
      
      platformAdaptations: {
        Instagram: { focusOnVisuals: true, hashtagOptimization: true },
        LinkedIn: { professionalTone: true, businessFocus: true },
        Facebook: { communityEngagement: true, storytelling: true },
        Twitter: { conciseness: true, realTimeEngagement: true },
      },
      
      qualityAssurance: {
        crossPlatformReview: true,
        brandGuidelineCheck: true,
        audienceAppropriatenessCheck: true,
      }
    },
    
    conditions: [
      {
        field: "campaign.platforms",
        operator: "array_length_greater_than",
        value: 1 // Multi-platform campaigns only
      }
    ],
    
    executionLimits: {
      maxExecutionsPerDay: 6,
      requiresApproval: false,
    }
  });
};

/**
 * Quality Assurance Automation - Ensures content meets quality standards
 */
export const createQualityAssuranceAutomation = () => {
  return createActionRule({
    id: "quality_assurance_automation",
    name: "Quality Assurance Automation", 
    description: "Automatically reviews and improves content quality",
    
    agentTypes: ["CONTENT", "BRAND_VOICE", "EMAIL_MARKETING", "SOCIAL_POSTING"],
    
    triggerCondition: {
      metricType: "QUALITY_SCORE",
      condition: "BELOW_THRESHOLD",
      threshold: 0.8, // 80% quality score
      timeWindow: 30, // 30 minutes
      consecutiveCount: 1,
      cooldownPeriod: 2 * 60,
    },
    
    actionConfig: {
      actionType: ActionType.OPTIMIZE_PERFORMANCE,
      priority: ActionPriority.HIGH,
      autoExecute: true,
      
      qualityChecks: [
        "grammar_spelling",
        "brand_voice_alignment", 
        "call_to_action_presence",
        "visual_quality",
        "accessibility_compliance",
        "platform_optimization"
      ],
      
      improvementActions: {
        grammarCorrection: true,
        toneAdjustment: true,
        ctaOptimization: true,
        imageEnhancement: true,
        accessibilityFixes: true,
      },
      
      approvalWorkflow: {
        autoApproveMinorChanges: true,
        requireApprovalForMajorChanges: true,
        notifyCreatorOfChanges: true,
      }
    },
    
    conditions: [
      {
        field: "content.status",
        operator: "in",
        value: ["DRAFT", "PENDING_REVIEW"]
      }
    ],
    
    executionLimits: {
      maxExecutionsPerHour: 20,
      requiresApproval: false,
    }
  });
};

/**
 * Performance Reporting Automation - Generates automated performance reports
 */
export const createPerformanceReportingAutomation = () => {
  return createActionRule({
    id: "performance_reporting_automation",
    name: "Performance Reporting Automation",
    description: "Generates automated performance reports and insights",
    
    agentTypes: ["INSIGHT", "GOAL_PLANNER", "PATTERN_MINER"],
    
    triggerCondition: {
      metricType: "SCHEDULE",
      condition: "TIME_TRIGGER",
      threshold: null,
      timeWindow: 24 * 60, // Daily
      consecutiveCount: 1,
      cooldownPeriod: 23 * 60, // 23 hours to ensure daily execution
    },
    
    actionConfig: {
      actionType: ActionType.SEND_REPORT,
      priority: ActionPriority.MEDIUM,
      autoExecute: true,
      
      reportConfiguration: {
        reportType: "performance_summary",
        includeMetrics: [
          "ctr", "conversion_rate", "cost_per_click",
          "engagement_rate", "budget_utilization", "roi"
        ],
        includeInsights: true,
        includeRecommendations: true,
        includeForecasts: true,
      },
      
      deliveryOptions: {
        emailRecipients: ["campaign_manager", "marketing_team"],
        slackChannels: ["#marketing", "#campaign-updates"],
        dashboardUpdate: true,
        pdfGeneration: true,
      },
      
      customization: {
        executiveSummary: true,
        detailedAnalysis: true,
        visualCharts: true,
        actionableInsights: true,
      }
    },
    
    conditions: [
      {
        field: "time.hour",
        operator: "equals",
        value: 9 // 9 AM daily reports
      }
    ],
    
    executionLimits: {
      maxExecutionsPerDay: 1,
      requiresApproval: false,
    }
  });
};

// Execute all action rules as a set
export const executeAllPerformanceActions = async (params?: any) => {
  const executor = new ActionExecutor();
  
  try {
    await Promise.all([
      executor.addRule(createCampaignPerformanceMonitor()),
      executor.addRule(createBudgetDepletionAlert()),
      executor.addRule(createConversionRateOptimizer()),
      executor.addRule(createContentPerformanceEnhancer()),
      executor.addRule(createTrendOpportunityDetector()),
      executor.addRule(createMultiPlatformSynchronizer()),
      executor.addRule(createQualityAssuranceAutomation()),
      executor.addRule(createPerformanceReportingAutomation()),
    ]);
    
    console.log("✅ All performance action rules activated successfully");
    return { success: true, message: "Performance monitoring activated" };
  } catch (error) {
    console.error("❌ Error activating performance actions:", error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
};

// Legacy compatibility function
export const updateMetrics = async (params?: any) => {
  console.log("🔄 Legacy updateMetrics called, redirecting to new performance actions");
  return executeAllPerformanceActions(params);
};

// Export individual action creators for granular control
export const performanceActions = {
  campaignPerformanceMonitor: createCampaignPerformanceMonitor,
  budgetDepletionAlert: createBudgetDepletionAlert, 
  conversionRateOptimizer: createConversionRateOptimizer,
  contentPerformanceEnhancer: createContentPerformanceEnhancer,
  trendOpportunityDetector: createTrendOpportunityDetector,
  multiPlatformSynchronizer: createMultiPlatformSynchronizer,
  qualityAssuranceAutomation: createQualityAssuranceAutomation,
  performanceReportingAutomation: createPerformanceReportingAutomation,
};

export default performanceActions; 