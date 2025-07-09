import { AgentType, ActionType, ActionStatus, ActionPriority } from '@neon/data-model';

// Enhanced Agent Types with Action Runner Support
export interface AgentCapabilities {
  // Existing capabilities
  canGenerateContent: boolean;
  canOptimizeContent: boolean;
  canAnalyzePerformance: boolean;
  canManageCampaigns: boolean;
  canProcessAnalytics: boolean;
  canLearn: boolean;
  canAdaptStrategy: boolean;
  canCollaborateWithAgents: boolean;
  
  // New autonomous action capabilities
  canTriggerActions: boolean;
  canMonitorMetrics: boolean;
  canExecuteAutonomousActions: boolean;
  canRollbackActions: boolean;
  canEscalateIssues: boolean;
  canAdjustBudgets: boolean;
  canManageAlerts: boolean;
  canOptimizeTargeting: boolean;
  canSwitchModes: boolean;
  canTriggerBackupAgents: boolean;
  
  // Action-specific capabilities
  supportedActions: ActionType[];
  maxConcurrentActions?: number;
  actionRetryLimit?: number;
  escalationThreshold?: number;
  autonomyLevel: 'MANUAL' | 'SEMI_AUTONOMOUS' | 'FULLY_AUTONOMOUS';
}

export interface AgentConfiguration {
  name: string;
  type: AgentType;
  version: string;
  capabilities: AgentCapabilities;
  
  // Performance monitoring configuration
  performanceMonitoring: {
    enabled: boolean;
    checkInterval: number; // minutes
    metricThresholds: Record<string, number>;
    alertThresholds: Record<string, number>;
    autoActionEnabled: boolean;
  };
  
  // Autonomous action configuration
  actionConfig: {
    enabled: boolean;
    priorityLevel: ActionPriority;
    approvalRequired: boolean;
    maxActionsPerHour: number;
    allowedTimeWindows: string[]; // e.g., ['09:00-17:00']
    restrictedActions: ActionType[];
    escalationRules: Array<{
      condition: string;
      action: ActionType;
      threshold: number;
    }>;
  };
  
  // Collaboration settings
  collaboration: {
    canCoordinateWithAgents: AgentType[];
    requiresApprovalFrom: AgentType[];
    notificationChannels: string[];
    escalationChain: string[];
  };
  
  // Learning and adaptation
  learning: {
    enabled: boolean;
    learningRate: number;
    adaptationThreshold: number;
    memoryRetention: number; // days
    feedbackSources: string[];
  };
}

export interface AgentState {
  agentName: string;
  agentType: AgentType;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'ERROR';
  mode: 'NORMAL' | 'CONSERVATIVE' | 'AGGRESSIVE' | 'LEARNING' | 'EMERGENCY';
  
  // Performance state
  currentMetrics: Record<string, number>;
  lastPerformanceCheck: Date;
  performanceScore: number;
  performanceTrend: 'IMPROVING' | 'STABLE' | 'DECLINING';
  
  // Action state
  lastActionTaken: Date | null;
  activeActions: number;
  actionHistory: Array<{
    actionType: ActionType;
    timestamp: Date;
    result: 'SUCCESS' | 'FAILED' | 'PENDING';
    impact: Record<string, any>;
  }>;
  
  // Learning state
  learningProgress: number;
  adaptationCount: number;
  lastLearningUpdate: Date;
  confidenceLevel: number;
  
  // Collaboration state
  collaboratingWith: AgentType[];
  pendingApprovals: string[];
  escalationLevel: number;
}

export interface AgentMetrics {
  // Performance metrics
  successRate: number;
  averageResponseTime: number;
  throughput: number;
  errorRate: number;
  
  // Action metrics
  actionsTriggered: number;
  actionsSuccessful: number;
  actionsFailed: number;
  averageActionTime: number;
  
  // Learning metrics
  learningAccuracy: number;
  adaptationEffectiveness: number;
  performanceImprovement: number;
  
  // Collaboration metrics
  collaborationCount: number;
  escalationCount: number;
  approvalWaitTime: number;
  
  // Resource metrics
  resourceUtilization: number;
  costEfficiency: number;
  budgetImpact: number;
}

// Enhanced Agent Type Definitions
export const AGENT_CONFIGURATIONS: Record<AgentType, AgentConfiguration> = {
  [AgentType.CONTENT]: {
    name: 'Content Agent',
    type: AgentType.CONTENT,
    version: '2.0.0',
    capabilities: {
      canGenerateContent: true,
      canOptimizeContent: true,
      canAnalyzePerformance: true,
      canManageCampaigns: true,
      canProcessAnalytics: true,
      canLearn: true,
      canAdaptStrategy: true,
      canCollaborateWithAgents: true,
      canTriggerActions: true,
      canMonitorMetrics: true,
      canExecuteAutonomousActions: true,
      canRollbackActions: true,
      canEscalateIssues: true,
      canAdjustBudgets: true,
      canManageAlerts: true,
      canOptimizeTargeting: true,
      canSwitchModes: true,
      canTriggerBackupAgents: true,
      supportedActions: [
        ActionType.PAUSE_CAMPAIGN,
        ActionType.RESUME_CAMPAIGN,
        ActionType.ADJUST_BUDGET_UP,
        ActionType.ADJUST_BUDGET_DOWN,
        ActionType.REFRESH_CONTENT,
        ActionType.OPTIMIZE_TARGETING,
        ActionType.NOTIFY_TEAM,
        ActionType.ESCALATE_ISSUE,
        ActionType.SWITCH_AGENT_MODE,
        ActionType.CREATE_ALERT,
        ActionType.UPDATE_STRATEGY,
        ActionType.SCHEDULE_REVIEW
      ],
      maxConcurrentActions: 5,
      actionRetryLimit: 3,
      escalationThreshold: 3,
      autonomyLevel: 'FULLY_AUTONOMOUS'
    },
    performanceMonitoring: {
      enabled: true,
      checkInterval: 15,
      metricThresholds: {
        ctr: 0.02,
        conversion_rate: 0.01,
        cost_per_click: 5.0,
        engagement_rate: 0.03
      },
      alertThresholds: {
        ctr: 0.005,
        conversion_rate: 0.005,
        cost_per_click: 10.0,
        engagement_rate: 0.01
      },
      autoActionEnabled: true
    },
    actionConfig: {
      enabled: true,
      priorityLevel: ActionPriority.HIGH,
      approvalRequired: false,
      maxActionsPerHour: 10,
      allowedTimeWindows: ['00:00-23:59'],
      restrictedActions: [ActionType.EMERGENCY_STOP],
      escalationRules: [
        {
          condition: 'cost_per_click > 15',
          action: ActionType.PAUSE_CAMPAIGN,
          threshold: 15
        },
        {
          condition: 'conversion_rate < 0.005',
          action: ActionType.ADJUST_BUDGET_DOWN,
          threshold: 0.005
        }
      ]
    },
    collaboration: {
      canCoordinateWithAgents: [AgentType.SOCIAL_POSTING, AgentType.EMAIL_MARKETING, AgentType.TREND],
      requiresApprovalFrom: [],
      notificationChannels: ['email', 'slack', 'dashboard'],
      escalationChain: ['team_lead', 'campaign_manager', 'director']
    },
    learning: {
      enabled: true,
      learningRate: 0.1,
      adaptationThreshold: 0.05,
      memoryRetention: 30,
      feedbackSources: ['campaign_feedback', 'user_feedback', 'performance_metrics']
    }
  },
  
  [AgentType.EMAIL_MARKETING]: {
    name: "Email Marketing Agent",
    type: AgentType.EMAIL_MARKETING,
    version: '2.0.0',
    capabilities: {
      canGenerateContent: true,
      canOptimizeContent: true,
      canAnalyzePerformance: true,
      canManageCampaigns: true,
      canProcessAnalytics: true,
      canLearn: true,
      canAdaptStrategy: true,
      canCollaborateWithAgents: true,
      canTriggerActions: true,
      canMonitorMetrics: true,
      canExecuteAutonomousActions: true,
      canRollbackActions: true,
      canEscalateIssues: true,
      canAdjustBudgets: true,
      canManageAlerts: true,
      canOptimizeTargeting: true,
      canSwitchModes: true,
      canTriggerBackupAgents: true,
      supportedActions: [
        ActionType.PAUSE_CAMPAIGN,
        ActionType.RESUME_CAMPAIGN,
        ActionType.ADJUST_BUDGET_UP,
        ActionType.ADJUST_BUDGET_DOWN,
        ActionType.REFRESH_CONTENT,
        ActionType.OPTIMIZE_TARGETING,
        ActionType.NOTIFY_TEAM,
        ActionType.ESCALATE_ISSUE,
        ActionType.SWITCH_AGENT_MODE,
        ActionType.CREATE_ALERT,
        ActionType.UPDATE_STRATEGY,
        ActionType.SEND_REPORT
      ],
      maxConcurrentActions: 5,
      actionRetryLimit: 3,
      escalationThreshold: 3,
      autonomyLevel: 'FULLY_AUTONOMOUS'
    },
    performanceMonitoring: {
      enabled: true,
      checkInterval: 30,
      metricThresholds: {
        open_rate: 0.15,
        click_rate: 0.02,
        bounce_rate: 0.1,
        unsubscribe_rate: 0.02
      },
      alertThresholds: {
        open_rate: 0.05,
        click_rate: 0.005,
        bounce_rate: 0.25,
        unsubscribe_rate: 0.05
      },
      autoActionEnabled: true
    },
    actionConfig: {
      enabled: true,
      priorityLevel: ActionPriority.MEDIUM,
      approvalRequired: false,
      maxActionsPerHour: 8,
      allowedTimeWindows: ['06:00-22:00'],
      restrictedActions: [ActionType.EMERGENCY_STOP],
      escalationRules: [
        {
          condition: 'bounce_rate > 0.3',
          action: ActionType.PAUSE_CAMPAIGN,
          threshold: 0.3
        },
        {
          condition: 'unsubscribe_rate > 0.1',
          action: ActionType.ESCALATE_ISSUE,
          threshold: 0.1
        }
      ]
    },
    collaboration: {
      canCoordinateWithAgents: [AgentType.CONTENT, AgentType.SOCIAL_POSTING],
      requiresApprovalFrom: [],
      notificationChannels: ['email', 'slack', 'dashboard'],
      escalationChain: ['email_manager', 'marketing_director']
    },
    learning: {
      enabled: true,
      learningRate: 0.08,
      adaptationThreshold: 0.06,
      memoryRetention: 45,
      feedbackSources: ['email_metrics', 'user_feedback', 'a_b_test_results']
    }
  },
  
  [AgentType.SOCIAL_POSTING]: {
    name: "Social Media Agent", 
    type: AgentType.SOCIAL_POSTING,
    version: '2.0.0',
    capabilities: {
      canGenerateContent: true,
      canOptimizeContent: true,
      canAnalyzePerformance: true,
      canManageCampaigns: true,
      canProcessAnalytics: true,
      canLearn: true,
      canAdaptStrategy: true,
      canCollaborateWithAgents: true,
      canTriggerActions: true,
      canMonitorMetrics: true,
      canExecuteAutonomousActions: true,
      canRollbackActions: true,
      canEscalateIssues: true,
      canAdjustBudgets: true,
      canManageAlerts: true,
      canOptimizeTargeting: true,
      canSwitchModes: true,
      canTriggerBackupAgents: true,
      supportedActions: [
        ActionType.PAUSE_CAMPAIGN,
        ActionType.RESUME_CAMPAIGN,
        ActionType.ADJUST_BUDGET_UP,
        ActionType.ADJUST_BUDGET_DOWN,
        ActionType.REFRESH_CONTENT,
        ActionType.OPTIMIZE_TARGETING,
        ActionType.NOTIFY_TEAM,
        ActionType.ESCALATE_ISSUE,
        ActionType.SWITCH_AGENT_MODE,
        ActionType.CREATE_ALERT,
        ActionType.UPDATE_STRATEGY,
        ActionType.AUTO_SCALE_UP,
        ActionType.AUTO_SCALE_DOWN
      ],
      maxConcurrentActions: 8,
      actionRetryLimit: 2,
      escalationThreshold: 3,
      autonomyLevel: 'FULLY_AUTONOMOUS'
    },
    performanceMonitoring: {
      enabled: true,
      checkInterval: 10,
      metricThresholds: {
        engagement_rate: 0.05,
        reach: 1000,
        impressions: 10000,
        ctr: 0.02
      },
      alertThresholds: {
        engagement_rate: 0.01,
        reach: 500,
        impressions: 5000,
        ctr: 0.005
      },
      autoActionEnabled: true
    },
    actionConfig: {
      enabled: true,
      priorityLevel: ActionPriority.HIGH,
      approvalRequired: false,
      maxActionsPerHour: 15,
      allowedTimeWindows: ['00:00-23:59'],
      restrictedActions: [],
      escalationRules: [
        {
          condition: 'engagement_rate < 0.005',
          action: ActionType.REFRESH_CONTENT,
          threshold: 0.005
        },
        {
          condition: 'reach < 200',
          action: ActionType.ADJUST_BUDGET_UP,
          threshold: 200
        }
      ]
    },
    collaboration: {
      canCoordinateWithAgents: [AgentType.CONTENT, AgentType.TREND, AgentType.EMAIL_MARKETING],
      requiresApprovalFrom: [],
      notificationChannels: ['slack', 'dashboard', 'mobile'],
      escalationChain: ['social_manager', 'digital_marketing_lead']
    },
    learning: {
      enabled: true,
      learningRate: 0.15,
      adaptationThreshold: 0.04,
      memoryRetention: 21,
      feedbackSources: ['social_metrics', 'trend_analysis', 'engagement_data']
    }
  },
  
  [AgentType.CUSTOMER_SUPPORT]: {
    name: "Customer Support Agent",
    type: AgentType.CUSTOMER_SUPPORT,
    version: '2.0.0',
    capabilities: {
      canGenerateContent: true,
      canOptimizeContent: false,
      canAnalyzePerformance: true,
      canManageCampaigns: false,
      canProcessAnalytics: true,
      canLearn: true,
      canAdaptStrategy: true,
      canCollaborateWithAgents: true,
      canTriggerActions: true,
      canMonitorMetrics: true,
      canExecuteAutonomousActions: true,
      canRollbackActions: false,
      canEscalateIssues: true,
      canAdjustBudgets: false,
      canManageAlerts: true,
      canOptimizeTargeting: false,
      canSwitchModes: true,
      canTriggerBackupAgents: true,
      supportedActions: [
        ActionType.NOTIFY_TEAM,
        ActionType.ESCALATE_ISSUE,
        ActionType.SWITCH_AGENT_MODE,
        ActionType.CREATE_ALERT,
        ActionType.SCHEDULE_REVIEW,
        ActionType.TRIGGER_BACKUP_AGENT,
        ActionType.SEND_REPORT
      ],
      maxConcurrentActions: 3,
      actionRetryLimit: 2,
      escalationThreshold: 2,
      autonomyLevel: 'SEMI_AUTONOMOUS'
    },
    performanceMonitoring: {
      enabled: true,
      checkInterval: 20,
      metricThresholds: {
        response_time: 300,
        resolution_rate: 0.8,
        customer_satisfaction: 0.85
      },
      alertThresholds: {
        response_time: 600,
        resolution_rate: 0.6,
        customer_satisfaction: 0.7
      },
      autoActionEnabled: true
    },
    actionConfig: {
      enabled: true,
      priorityLevel: ActionPriority.HIGH,
      approvalRequired: true,
      maxActionsPerHour: 5,
      allowedTimeWindows: ['08:00-20:00'],
      restrictedActions: [ActionType.EMERGENCY_STOP, ActionType.PAUSE_CAMPAIGN],
      escalationRules: [
        {
          condition: 'response_time > 900',
          action: ActionType.ESCALATE_ISSUE,
          threshold: 900
        },
        {
          condition: 'customer_satisfaction < 0.6',
          action: ActionType.TRIGGER_BACKUP_AGENT,
          threshold: 0.6
        }
      ]
    },
    collaboration: {
      canCoordinateWithAgents: [],
      requiresApprovalFrom: [AgentType.CONTENT],
      notificationChannels: ['email', 'slack', 'support_system'],
      escalationChain: ['support_lead', 'customer_success_manager']
    },
    learning: {
      enabled: true,
      learningRate: 0.05,
      adaptationThreshold: 0.08,
      memoryRetention: 60,
      feedbackSources: ['customer_feedback', 'resolution_metrics', 'satisfaction_surveys']
    }
  },
  
  [AgentType.TREND]: {
    name: 'Trend Agent',
    type: AgentType.TREND,
    version: '2.0.0',
    capabilities: {
      canGenerateContent: false,
      canOptimizeContent: false,
      canAnalyzePerformance: true,
      canManageCampaigns: true,
      canProcessAnalytics: true,
      canLearn: true,
      canAdaptStrategy: true,
      canCollaborateWithAgents: true,
      canTriggerActions: true,
      canMonitorMetrics: true,
      canExecuteAutonomousActions: true,
      canRollbackActions: true,
      canEscalateIssues: true,
      canAdjustBudgets: true,
      canManageAlerts: true,
      canOptimizeTargeting: true,
      canSwitchModes: true,
      canTriggerBackupAgents: true,
      supportedActions: [
        ActionType.PAUSE_CAMPAIGN,
        ActionType.RESUME_CAMPAIGN,
        ActionType.ADJUST_BUDGET_UP,
        ActionType.ADJUST_BUDGET_DOWN,
        ActionType.REFRESH_CONTENT,
        ActionType.OPTIMIZE_TARGETING,
        ActionType.NOTIFY_TEAM,
        ActionType.ESCALATE_ISSUE,
        ActionType.SWITCH_AGENT_MODE,
        ActionType.CREATE_ALERT,
        ActionType.UPDATE_STRATEGY,
        ActionType.AUTO_SCALE_UP,
        ActionType.AUTO_SCALE_DOWN,
        ActionType.REDISTRIBUTE_BUDGET
      ],
      maxConcurrentActions: 6,
      actionRetryLimit: 3,
      escalationThreshold: 2,
      autonomyLevel: 'FULLY_AUTONOMOUS'
    },
    performanceMonitoring: {
      enabled: true,
      checkInterval: 5,
      metricThresholds: {
        trend_score: 0.7,
        relevance_score: 0.6,
        virality_score: 0.8
      },
      alertThresholds: {
        trend_score: 0.4,
        relevance_score: 0.3,
        virality_score: 0.5
      },
      autoActionEnabled: true
    },
    actionConfig: {
      enabled: true,
      priorityLevel: ActionPriority.MEDIUM,
      approvalRequired: false,
      maxActionsPerHour: 12,
      allowedTimeWindows: ['00:00-23:59'],
      restrictedActions: [ActionType.EMERGENCY_STOP],
      escalationRules: [
        {
          condition: 'trend_score > 0.9',
          action: ActionType.ADJUST_BUDGET_UP,
          threshold: 0.9
        },
        {
          condition: 'relevance_score < 0.2',
          action: ActionType.UPDATE_STRATEGY,
          threshold: 0.2
        }
      ]
    },
    collaboration: {
      canCoordinateWithAgents: [AgentType.CONTENT, AgentType.SOCIAL_POSTING, AgentType.EMAIL_MARKETING],
      requiresApprovalFrom: [],
      notificationChannels: ['slack', 'dashboard', 'api_webhook'],
      escalationChain: ['trend_analyst', 'strategy_lead']
    },
    learning: {
      enabled: true,
      learningRate: 0.2,
      adaptationThreshold: 0.03,
      memoryRetention: 14,
      feedbackSources: ['trend_data', 'campaign_performance', 'market_analysis']
    }
  },
  
  [AgentType.SEO]: {
    name: 'SEO Agent',
    type: AgentType.SEO,
    version: '2.0.0',
    capabilities: {
      canGenerateContent: true,
      canOptimizeContent: true,
      canAnalyzePerformance: true,
      canManageCampaigns: true,
      canProcessAnalytics: true,
      canLearn: true,
      canAdaptStrategy: true,
      canCollaborateWithAgents: true,
      canTriggerActions: true,
      canMonitorMetrics: true,
      canExecuteAutonomousActions: true,
      canRollbackActions: true,
      canEscalateIssues: true,
      canAdjustBudgets: false,
      canManageAlerts: true,
      canOptimizeTargeting: true,
      canSwitchModes: true,
      canTriggerBackupAgents: true,
      supportedActions: [
        ActionType.REFRESH_CONTENT,
        ActionType.OPTIMIZE_TARGETING,
        ActionType.NOTIFY_TEAM,
        ActionType.ESCALATE_ISSUE,
        ActionType.SWITCH_AGENT_MODE,
        ActionType.CREATE_ALERT,
        ActionType.UPDATE_STRATEGY,
        ActionType.SCHEDULE_REVIEW,
        ActionType.ROLLBACK_CHANGES,
        ActionType.TRIGGER_BACKUP_AGENT,
        ActionType.SEND_REPORT
      ],
      maxConcurrentActions: 4,
      actionRetryLimit: 3,
      escalationThreshold: 3,
      autonomyLevel: 'SEMI_AUTONOMOUS'
    },
    performanceMonitoring: {
      enabled: true,
      checkInterval: 60,
      metricThresholds: {
        organic_traffic: 1000,
        keyword_ranking: 10,
        domain_authority: 50
      },
      alertThresholds: {
        organic_traffic: 500,
        keyword_ranking: 20,
        domain_authority: 30
      },
      autoActionEnabled: true
    },
    actionConfig: {
      enabled: true,
      priorityLevel: ActionPriority.MEDIUM,
      approvalRequired: true,
      maxActionsPerHour: 6,
      allowedTimeWindows: ['09:00-17:00'],
      restrictedActions: [ActionType.EMERGENCY_STOP, ActionType.PAUSE_CAMPAIGN],
      escalationRules: [
        {
          condition: 'organic_traffic < 300',
          action: ActionType.ESCALATE_ISSUE,
          threshold: 300
        },
        {
          condition: 'keyword_ranking > 30',
          action: ActionType.UPDATE_STRATEGY,
          threshold: 30
        }
      ]
    },
    collaboration: {
      canCoordinateWithAgents: [AgentType.CONTENT],
      requiresApprovalFrom: [AgentType.CONTENT],
      notificationChannels: ['email', 'slack', 'seo_tools'],
      escalationChain: ['seo_specialist', 'digital_marketing_manager']
    },
    learning: {
      enabled: true,
      learningRate: 0.06,
      adaptationThreshold: 0.1,
      memoryRetention: 90,
      feedbackSources: ['seo_metrics', 'ranking_changes', 'traffic_analysis']
    }
  },
  
  [AgentType.SYSTEM]: {
    name: 'System Agent',
    type: AgentType.SYSTEM,
    version: '2.0.0',
    capabilities: {
      canGenerateContent: false,
      canOptimizeContent: false,
      canAnalyzePerformance: true,
      canManageCampaigns: false,
      canProcessAnalytics: true,
      canLearn: false,
      canAdaptStrategy: false,
      canCollaborateWithAgents: true,
      canTriggerActions: true,
      canMonitorMetrics: true,
      canExecuteAutonomousActions: true,
      canRollbackActions: true,
      canEscalateIssues: true,
      canAdjustBudgets: false,
      canManageAlerts: true,
      canOptimizeTargeting: false,
      canSwitchModes: false,
      canTriggerBackupAgents: true,
      supportedActions: [
        ActionType.NOTIFY_TEAM,
        ActionType.ESCALATE_ISSUE,
        ActionType.CREATE_ALERT,
        ActionType.ROLLBACK_CHANGES,
        ActionType.EMERGENCY_STOP,
        ActionType.TRIGGER_BACKUP_AGENT,
        ActionType.SEND_REPORT
      ],
      maxConcurrentActions: 2,
      actionRetryLimit: 1,
      escalationThreshold: 1,
      autonomyLevel: 'SEMI_AUTONOMOUS'
    },
    performanceMonitoring: {
      enabled: true,
      checkInterval: 5,
      metricThresholds: {
        system_health: 0.95,
        error_rate: 0.01,
        response_time: 200
      },
      alertThresholds: {
        system_health: 0.8,
        error_rate: 0.05,
        response_time: 500
      },
      autoActionEnabled: true
    },
    actionConfig: {
      enabled: true,
      priorityLevel: ActionPriority.EMERGENCY,
      approvalRequired: false,
      maxActionsPerHour: 3,
      allowedTimeWindows: ['00:00-23:59'],
      restrictedActions: [],
      escalationRules: [
        {
          condition: 'system_health < 0.5',
          action: ActionType.EMERGENCY_STOP,
          threshold: 0.5
        },
        {
          condition: 'error_rate > 0.1',
          action: ActionType.ESCALATE_ISSUE,
          threshold: 0.1
        }
      ]
    },
    collaboration: {
      canCoordinateWithAgents: [AgentType.CONTENT, AgentType.EMAIL_MARKETING, AgentType.SOCIAL_POSTING, AgentType.CUSTOMER_SUPPORT, AgentType.TREND, AgentType.SEO],
      requiresApprovalFrom: [],
      notificationChannels: ['email', 'slack', 'pagerduty', 'sms'],
      escalationChain: ['system_admin', 'technical_lead', 'cto']
    },
    learning: {
      enabled: false,
      learningRate: 0,
      adaptationThreshold: 0,
      memoryRetention: 0,
      feedbackSources: []
    }
  }
};

// Helper functions
export function getAgentCapabilities(agentType: AgentType): AgentCapabilities {
  return AGENT_CONFIGURATIONS[agentType].capabilities;
}

export function getAgentConfiguration(agentType: AgentType): AgentConfiguration {
  return AGENT_CONFIGURATIONS[agentType];
}

export function getSupportedActions(agentType: AgentType): ActionType[] {
  return AGENT_CONFIGURATIONS[agentType].capabilities.supportedActions;
}

export function canAgentExecuteAction(agentType: AgentType, actionType: ActionType): boolean {
  const config = AGENT_CONFIGURATIONS[agentType];
  return config.capabilities.supportedActions.includes(actionType) &&
         !config.actionConfig.restrictedActions.includes(actionType);
}

export function getAgentAutonomyLevel(agentType: AgentType): 'MANUAL' | 'SEMI_AUTONOMOUS' | 'FULLY_AUTONOMOUS' {
  return AGENT_CONFIGURATIONS[agentType].capabilities.autonomyLevel;
}

export function isAgentFullyAutonomous(agentType: AgentType): boolean {
  return getAgentAutonomyLevel(agentType) === 'FULLY_AUTONOMOUS';
}

export function getAgentCollaborators(agentType: AgentType): AgentType[] {
  return AGENT_CONFIGURATIONS[agentType].collaboration.canCoordinateWithAgents;
}

export function requiresApproval(agentType: AgentType): boolean {
  return AGENT_CONFIGURATIONS[agentType].actionConfig.approvalRequired;
}

export function getEscalationChain(agentType: AgentType): string[] {
  return AGENT_CONFIGURATIONS[agentType].collaboration.escalationChain;
} 