import { 
  AgentType, 
  ActionType, 
  ActionPriority, 
  Platform 
} from '@neon/data-model';

export interface TriggerCondition {
  metricType: string;
  metricSubtype?: string;
  category?: string;
  condition: 'greater_than' | 'less_than' | 'equals' | 'change_percent' | 'consecutive_violations';
  threshold: number;
  timeWindow?: number; // minutes to look back
  consecutiveCount?: number; // consecutive violations needed
  cooldownPeriod?: number; // minutes between triggers
}

export interface ActionExecutor {
  actionType: ActionType;
  compatibleAgents: AgentType[];
  priority: ActionPriority;
  maxRetries: number;
  description: string;
  requiredParams: string[];
  optionalParams: string[];
  fallbackAction?: ActionType;
  
  // Execution function
  execute: (params: ActionExecutionParams) => Promise<ActionExecutionResult>;
  
  // Validation function
  validate: (params: ActionExecutionParams) => Promise<boolean>;
  
  // Rollback function (if action supports rollback)
  rollback?: (params: ActionExecutionParams, originalData: any) => Promise<ActionExecutionResult>;
}

export interface ActionExecutionParams {
  agentName: string;
  agentType: AgentType;
  campaignId?: string;
  metricId?: string;
  triggerValue: number;
  threshold?: number;
  actionConfig: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface ActionExecutionResult {
  success: boolean;
  message: string;
  data?: any;
  rollbackData?: any;
  impactMetrics?: Record<string, any>;
  nextActions?: ActionType[];
  errorDetails?: string;
}

export class PerformanceActionsRegistry {
  private static instance: PerformanceActionsRegistry;
  private actions: Map<ActionType, ActionExecutor> = new Map();
  
  private constructor() {
    this.initializeActions();
  }
  
  public static getInstance(): PerformanceActionsRegistry {
    if (!this.instance) {
      this.instance = new PerformanceActionsRegistry();
    }
    return this.instance;
  }
  
  private initializeActions(): void {
    // Register all performance actions
    this.registerAction(this.createPauseCampaignAction());
    this.registerAction(this.createResumeCampaignAction());
    this.registerAction(this.createAdjustBudgetUpAction());
    this.registerAction(this.createAdjustBudgetDownAction());
    this.registerAction(this.createNotifyTeamAction());
    this.registerAction(this.createEscalateIssueAction());
    this.registerAction(this.createSwitchAgentModeAction());
    this.registerAction(this.createOptimizeTargetingAction());
    this.registerAction(this.createRefreshContentAction());
    this.registerAction(this.createScheduleReviewAction());
    this.registerAction(this.createCreateAlertAction());
    this.registerAction(this.createRollbackChangesAction());
    this.registerAction(this.createEmergencyStopAction());
    this.registerAction(this.createAutoScaleUpAction());
    this.registerAction(this.createAutoScaleDownAction());
    this.registerAction(this.createRedistributeBudgetAction());
    this.registerAction(this.createUpdateStrategyAction());
    this.registerAction(this.createTriggerBackupAgentAction());
    this.registerAction(this.createSendReportAction());
    this.registerAction(this.createArchiveCampaignAction());
  }
  
  private registerAction(action: ActionExecutor): void {
    this.actions.set(action.actionType, action);
  }
  
  public getAction(actionType: ActionType): ActionExecutor | undefined {
    return this.actions.get(actionType);
  }
  
  public getAllActions(): ActionExecutor[] {
    return Array.from(this.actions.values());
  }
  
  public getCompatibleActions(agentType: AgentType): ActionExecutor[] {
    return this.getAllActions().filter(action => 
      action.compatibleAgents.includes(agentType)
    );
  }
  
  public validateActionConfig(actionType: ActionType, config: Record<string, any>): boolean {
    const action = this.getAction(actionType);
    if (!action) return false;
    
    // Check required parameters
    for (const param of action.requiredParams) {
      if (!(param in config)) {
        return false;
      }
    }
    
    return true;
  }
  
  // Action Creators
  
  private createPauseCampaignAction(): ActionExecutor {
    return {
      actionType: ActionType.PAUSE_CAMPAIGN,
      compatibleAgents: [AgentType.CONTENT, AgentType.EMAIL, AgentType.SOCIAL, AgentType.SUPPORT, AgentType.TREND],
      priority: ActionPriority.HIGH,
      maxRetries: 3,
      description: 'Pause campaign due to performance issues',
      requiredParams: ['campaignId'],
      optionalParams: ['reason', 'duration'],
      fallbackAction: ActionType.NOTIFY_TEAM,
      
      execute: async (params: ActionExecutionParams): Promise<ActionExecutionResult> => {
        try {
          const { campaignId, actionConfig } = params;
          
          // Implement campaign pause logic
          const pauseResult = await this.pauseCampaignLogic(campaignId!, actionConfig);
          
          return {
            success: true,
            message: `Campaign ${campaignId} paused successfully`,
            data: pauseResult,
            rollbackData: { previousStatus: 'ACTIVE', campaignId },
            impactMetrics: { status: 'PAUSED', pausedAt: new Date().toISOString() }
          };
        } catch (error) {
          return {
            success: false,
            message: 'Failed to pause campaign',
            errorDetails: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      },
      
      validate: async (params: ActionExecutionParams): Promise<boolean> => {
        return !!(params.campaignId && params.actionConfig.campaignId);
      },
      
      rollback: async (params: ActionExecutionParams, originalData: any): Promise<ActionExecutionResult> => {
        try {
          const { campaignId } = originalData;
          await this.resumeCampaignLogic(campaignId, { reason: 'Rollback from pause action' });
          
          return {
            success: true,
            message: `Campaign ${campaignId} resumed (rollback)`,
            data: { status: 'ACTIVE', resumedAt: new Date().toISOString() }
          };
        } catch (error) {
          return {
            success: false,
            message: 'Failed to rollback campaign pause',
            errorDetails: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      }
    };
  }
  
  private createResumeCampaignAction(): ActionExecutor {
    return {
      actionType: ActionType.RESUME_CAMPAIGN,
      compatibleAgents: [AgentType.CONTENT, AgentType.EMAIL, AgentType.SOCIAL, AgentType.SUPPORT, AgentType.TREND],
      priority: ActionPriority.MEDIUM,
      maxRetries: 3,
      description: 'Resume paused campaign when performance improves',
      requiredParams: ['campaignId'],
      optionalParams: ['reason'],
      
      execute: async (params: ActionExecutionParams): Promise<ActionExecutionResult> => {
        try {
          const { campaignId, actionConfig } = params;
          
          const resumeResult = await this.resumeCampaignLogic(campaignId!, actionConfig);
          
          return {
            success: true,
            message: `Campaign ${campaignId} resumed successfully`,
            data: resumeResult,
            rollbackData: { previousStatus: 'PAUSED', campaignId },
            impactMetrics: { status: 'ACTIVE', resumedAt: new Date().toISOString() }
          };
        } catch (error) {
          return {
            success: false,
            message: 'Failed to resume campaign',
            errorDetails: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      },
      
      validate: async (params: ActionExecutionParams): Promise<boolean> => {
        return !!(params.campaignId && params.actionConfig.campaignId);
      }
    };
  }
  
  private createAdjustBudgetUpAction(): ActionExecutor {
    return {
      actionType: ActionType.ADJUST_BUDGET_UP,
      compatibleAgents: [AgentType.CONTENT, AgentType.EMAIL, AgentType.SOCIAL, AgentType.TREND],
      priority: ActionPriority.MEDIUM,
      maxRetries: 2,
      description: 'Increase campaign budget when performance is strong',
      requiredParams: ['campaignId', 'adjustmentPercent'],
      optionalParams: ['maxBudget', 'reason'],
      
      execute: async (params: ActionExecutionParams): Promise<ActionExecutionResult> => {
        try {
          const { campaignId, actionConfig } = params;
          const adjustmentPercent = actionConfig.adjustmentPercent || 20;
          
          const budgetResult = await this.adjustBudgetLogic(campaignId!, adjustmentPercent, 'increase');
          
          return {
            success: true,
            message: `Budget increased by ${adjustmentPercent}% for campaign ${campaignId}`,
            data: budgetResult,
            rollbackData: { previousBudget: budgetResult.previousBudget, campaignId },
            impactMetrics: { budgetChange: adjustmentPercent, newBudget: budgetResult.newBudget }
          };
        } catch (error) {
          return {
            success: false,
            message: 'Failed to adjust budget up',
            errorDetails: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      },
      
      validate: async (params: ActionExecutionParams): Promise<boolean> => {
        return !!(params.campaignId && params.actionConfig.adjustmentPercent);
      }
    };
  }
  
  private createAdjustBudgetDownAction(): ActionExecutor {
    return {
      actionType: ActionType.ADJUST_BUDGET_DOWN,
      compatibleAgents: [AgentType.CONTENT, AgentType.EMAIL, AgentType.SOCIAL, AgentType.TREND],
      priority: ActionPriority.HIGH,
      maxRetries: 2,
      description: 'Decrease campaign budget when performance is poor',
      requiredParams: ['campaignId', 'adjustmentPercent'],
      optionalParams: ['minBudget', 'reason'],
      
      execute: async (params: ActionExecutionParams): Promise<ActionExecutionResult> => {
        try {
          const { campaignId, actionConfig } = params;
          const adjustmentPercent = actionConfig.adjustmentPercent || 20;
          
          const budgetResult = await this.adjustBudgetLogic(campaignId!, adjustmentPercent, 'decrease');
          
          return {
            success: true,
            message: `Budget decreased by ${adjustmentPercent}% for campaign ${campaignId}`,
            data: budgetResult,
            rollbackData: { previousBudget: budgetResult.previousBudget, campaignId },
            impactMetrics: { budgetChange: -adjustmentPercent, newBudget: budgetResult.newBudget }
          };
        } catch (error) {
          return {
            success: false,
            message: 'Failed to adjust budget down',
            errorDetails: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      },
      
      validate: async (params: ActionExecutionParams): Promise<boolean> => {
        return !!(params.campaignId && params.actionConfig.adjustmentPercent);
      }
    };
  }
  
  private createNotifyTeamAction(): ActionExecutor {
    return {
      actionType: ActionType.NOTIFY_TEAM,
      compatibleAgents: [AgentType.CONTENT, AgentType.EMAIL, AgentType.SOCIAL, AgentType.SUPPORT, AgentType.TREND, AgentType.SEO],
      priority: ActionPriority.MEDIUM,
      maxRetries: 1,
      description: 'Send notification to team about performance issues',
      requiredParams: ['message'],
      optionalParams: ['urgency', 'recipients', 'channels'],
      
      execute: async (params: ActionExecutionParams): Promise<ActionExecutionResult> => {
        try {
          const { agentName, actionConfig } = params;
          const message = actionConfig.message || 'Performance threshold exceeded';
          
          const notificationResult = await this.sendNotificationLogic(agentName, message, actionConfig);
          
          return {
            success: true,
            message: 'Team notification sent successfully',
            data: notificationResult,
            impactMetrics: { notificationsSent: 1, timestamp: new Date().toISOString() }
          };
        } catch (error) {
          return {
            success: false,
            message: 'Failed to send team notification',
            errorDetails: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      },
      
      validate: async (params: ActionExecutionParams): Promise<boolean> => {
        return !!(params.actionConfig.message || params.agentName);
      }
    };
  }
  
  private createEscalateIssueAction(): ActionExecutor {
    return {
      actionType: ActionType.ESCALATE_ISSUE,
      compatibleAgents: [AgentType.CONTENT, AgentType.EMAIL, AgentType.SOCIAL, AgentType.SUPPORT, AgentType.TREND, AgentType.SEO],
      priority: ActionPriority.HIGH,
      maxRetries: 2,
      description: 'Escalate critical performance issues to management',
      requiredParams: ['issueType', 'severity'],
      optionalParams: ['description', 'recommendedActions'],
      
      execute: async (params: ActionExecutionParams): Promise<ActionExecutionResult> => {
        try {
          const { agentName, actionConfig } = params;
          
          const escalationResult = await this.escalateIssueLogic(agentName, actionConfig);
          
          return {
            success: true,
            message: `Issue escalated successfully by ${agentName}`,
            data: escalationResult,
            impactMetrics: { escalationLevel: actionConfig.severity, timestamp: new Date().toISOString() }
          };
        } catch (error) {
          return {
            success: false,
            message: 'Failed to escalate issue',
            errorDetails: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      },
      
      validate: async (params: ActionExecutionParams): Promise<boolean> => {
        return !!(params.actionConfig.issueType && params.actionConfig.severity);
      }
    };
  }
  
  private createSwitchAgentModeAction(): ActionExecutor {
    return {
      actionType: ActionType.SWITCH_AGENT_MODE,
      compatibleAgents: [AgentType.CONTENT, AgentType.EMAIL, AgentType.SOCIAL, AgentType.SUPPORT, AgentType.TREND, AgentType.SEO],
      priority: ActionPriority.MEDIUM,
      maxRetries: 2,
      description: 'Switch agent to different mode based on performance',
      requiredParams: ['newMode'],
      optionalParams: ['reason', 'duration'],
      
      execute: async (params: ActionExecutionParams): Promise<ActionExecutionResult> => {
        try {
          const { agentName, actionConfig } = params;
          
          const modeResult = await this.switchAgentModeLogic(agentName, actionConfig);
          
          return {
            success: true,
            message: `Agent ${agentName} switched to ${actionConfig.newMode} mode`,
            data: modeResult,
            rollbackData: { previousMode: modeResult.previousMode, agentName },
            impactMetrics: { modeChange: actionConfig.newMode, timestamp: new Date().toISOString() }
          };
        } catch (error) {
          return {
            success: false,
            message: 'Failed to switch agent mode',
            errorDetails: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      },
      
      validate: async (params: ActionExecutionParams): Promise<boolean> => {
        return !!(params.actionConfig.newMode && params.agentName);
      }
    };
  }
  
  private createOptimizeTargetingAction(): ActionExecutor {
    return {
      actionType: ActionType.OPTIMIZE_TARGETING,
      compatibleAgents: [AgentType.CONTENT, AgentType.EMAIL, AgentType.SOCIAL, AgentType.TREND],
      priority: ActionPriority.MEDIUM,
      maxRetries: 2,
      description: 'Optimize campaign targeting based on performance data',
      requiredParams: ['campaignId'],
      optionalParams: ['targetingParams', 'optimizationType'],
      
      execute: async (params: ActionExecutionParams): Promise<ActionExecutionResult> => {
        try {
          const { campaignId, actionConfig } = params;
          
          const optimizationResult = await this.optimizeTargetingLogic(campaignId!, actionConfig);
          
          return {
            success: true,
            message: `Targeting optimized for campaign ${campaignId}`,
            data: optimizationResult,
            rollbackData: { previousTargeting: optimizationResult.previousTargeting, campaignId },
            impactMetrics: { optimizationsApplied: optimizationResult.changes.length }
          };
        } catch (error) {
          return {
            success: false,
            message: 'Failed to optimize targeting',
            errorDetails: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      },
      
      validate: async (params: ActionExecutionParams): Promise<boolean> => {
        return !!(params.campaignId);
      }
    };
  }
  
  private createEmergencyStopAction(): ActionExecutor {
    return {
      actionType: ActionType.EMERGENCY_STOP,
      compatibleAgents: [AgentType.CONTENT, AgentType.EMAIL, AgentType.SOCIAL, AgentType.SUPPORT, AgentType.TREND, AgentType.SEO],
      priority: ActionPriority.EMERGENCY,
      maxRetries: 1,
      description: 'Emergency stop for critical issues',
      requiredParams: ['reason'],
      optionalParams: ['affectedCampaigns'],
      
      execute: async (params: ActionExecutionParams): Promise<ActionExecutionResult> => {
        try {
          const { agentName, actionConfig } = params;
          
          const emergencyResult = await this.emergencyStopLogic(agentName, actionConfig);
          
          return {
            success: true,
            message: `Emergency stop executed by ${agentName}`,
            data: emergencyResult,
            impactMetrics: { emergencyStop: true, timestamp: new Date().toISOString() }
          };
        } catch (error) {
          return {
            success: false,
            message: 'Failed to execute emergency stop',
            errorDetails: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      },
      
      validate: async (params: ActionExecutionParams): Promise<boolean> => {
        return !!(params.actionConfig.reason);
      }
    };
  }
  
  // Additional action creators for remaining ActionTypes...
  // (Implementation abbreviated for brevity, but would include all actions)
  
  private createRefreshContentAction(): ActionExecutor {
    return {
      actionType: ActionType.REFRESH_CONTENT,
      compatibleAgents: [AgentType.CONTENT, AgentType.SOCIAL, AgentType.TREND],
      priority: ActionPriority.MEDIUM,
      maxRetries: 2,
      description: 'Refresh content when performance drops',
      requiredParams: ['campaignId'],
      optionalParams: ['contentType', 'platforms'],
      
      execute: async (params: ActionExecutionParams): Promise<ActionExecutionResult> => {
        // Implementation for content refresh
        return {
          success: true,
          message: 'Content refreshed successfully',
          data: { contentUpdated: true }
        };
      },
      
      validate: async (params: ActionExecutionParams): Promise<boolean> => {
        return !!(params.campaignId);
      }
    };
  }
  
  private createScheduleReviewAction(): ActionExecutor {
    return {
      actionType: ActionType.SCHEDULE_REVIEW,
      compatibleAgents: [AgentType.CONTENT, AgentType.EMAIL, AgentType.SOCIAL, AgentType.SUPPORT, AgentType.TREND, AgentType.SEO],
      priority: ActionPriority.LOW,
      maxRetries: 1,
      description: 'Schedule review for performance issues',
      requiredParams: ['reviewType'],
      optionalParams: ['scheduledDate', 'reviewers'],
      
      execute: async (params: ActionExecutionParams): Promise<ActionExecutionResult> => {
        // Implementation for scheduling review
        return {
          success: true,
          message: 'Review scheduled successfully',
          data: { reviewScheduled: true }
        };
      },
      
      validate: async (params: ActionExecutionParams): Promise<boolean> => {
        return !!(params.actionConfig.reviewType);
      }
    };
  }
  
  private createCreateAlertAction(): ActionExecutor {
    return {
      actionType: ActionType.CREATE_ALERT,
      compatibleAgents: [AgentType.CONTENT, AgentType.EMAIL, AgentType.SOCIAL, AgentType.SUPPORT, AgentType.TREND, AgentType.SEO],
      priority: ActionPriority.MEDIUM,
      maxRetries: 1,
      description: 'Create alert for performance monitoring',
      requiredParams: ['alertType', 'message'],
      optionalParams: ['severity', 'recipients'],
      
      execute: async (params: ActionExecutionParams): Promise<ActionExecutionResult> => {
        // Implementation for creating alert
        return {
          success: true,
          message: 'Alert created successfully',
          data: { alertCreated: true }
        };
      },
      
      validate: async (params: ActionExecutionParams): Promise<boolean> => {
        return !!(params.actionConfig.alertType && params.actionConfig.message);
      }
    };
  }
  
  private createRollbackChangesAction(): ActionExecutor {
    return {
      actionType: ActionType.ROLLBACK_CHANGES,
      compatibleAgents: [AgentType.CONTENT, AgentType.EMAIL, AgentType.SOCIAL, AgentType.SUPPORT, AgentType.TREND, AgentType.SEO],
      priority: ActionPriority.HIGH,
      maxRetries: 2,
      description: 'Rollback recent changes causing performance issues',
      requiredParams: ['changeId'],
      optionalParams: ['reason'],
      
      execute: async (params: ActionExecutionParams): Promise<ActionExecutionResult> => {
        // Implementation for rolling back changes
        return {
          success: true,
          message: 'Changes rolled back successfully',
          data: { rollbackCompleted: true }
        };
      },
      
      validate: async (params: ActionExecutionParams): Promise<boolean> => {
        return !!(params.actionConfig.changeId);
      }
    };
  }
  
  private createAutoScaleUpAction(): ActionExecutor {
    return {
      actionType: ActionType.AUTO_SCALE_UP,
      compatibleAgents: [AgentType.CONTENT, AgentType.EMAIL, AgentType.SOCIAL, AgentType.TREND],
      priority: ActionPriority.MEDIUM,
      maxRetries: 2,
      description: 'Scale up resources when performance is high',
      requiredParams: ['resourceType'],
      optionalParams: ['scalePercent', 'maxLimit'],
      
      execute: async (params: ActionExecutionParams): Promise<ActionExecutionResult> => {
        // Implementation for scaling up
        return {
          success: true,
          message: 'Resources scaled up successfully',
          data: { scaleUpCompleted: true }
        };
      },
      
      validate: async (params: ActionExecutionParams): Promise<boolean> => {
        return !!(params.actionConfig.resourceType);
      }
    };
  }
  
  private createAutoScaleDownAction(): ActionExecutor {
    return {
      actionType: ActionType.AUTO_SCALE_DOWN,
      compatibleAgents: [AgentType.CONTENT, AgentType.EMAIL, AgentType.SOCIAL, AgentType.TREND],
      priority: ActionPriority.MEDIUM,
      maxRetries: 2,
      description: 'Scale down resources when performance is low',
      requiredParams: ['resourceType'],
      optionalParams: ['scalePercent', 'minLimit'],
      
      execute: async (params: ActionExecutionParams): Promise<ActionExecutionResult> => {
        // Implementation for scaling down
        return {
          success: true,
          message: 'Resources scaled down successfully',
          data: { scaleDownCompleted: true }
        };
      },
      
      validate: async (params: ActionExecutionParams): Promise<boolean> => {
        return !!(params.actionConfig.resourceType);
      }
    };
  }
  
  private createRedistributeBudgetAction(): ActionExecutor {
    return {
      actionType: ActionType.REDISTRIBUTE_BUDGET,
      compatibleAgents: [AgentType.CONTENT, AgentType.EMAIL, AgentType.SOCIAL, AgentType.TREND],
      priority: ActionPriority.MEDIUM,
      maxRetries: 2,
      description: 'Redistribute budget between campaigns based on performance',
      requiredParams: ['redistributionStrategy'],
      optionalParams: ['sourceCampaigns', 'targetCampaigns'],
      
      execute: async (params: ActionExecutionParams): Promise<ActionExecutionResult> => {
        // Implementation for budget redistribution
        return {
          success: true,
          message: 'Budget redistributed successfully',
          data: { redistributionCompleted: true }
        };
      },
      
      validate: async (params: ActionExecutionParams): Promise<boolean> => {
        return !!(params.actionConfig.redistributionStrategy);
      }
    };
  }
  
  private createUpdateStrategyAction(): ActionExecutor {
    return {
      actionType: ActionType.UPDATE_STRATEGY,
      compatibleAgents: [AgentType.CONTENT, AgentType.EMAIL, AgentType.SOCIAL, AgentType.TREND, AgentType.SEO],
      priority: ActionPriority.MEDIUM,
      maxRetries: 2,
      description: 'Update campaign strategy based on performance insights',
      requiredParams: ['strategyType', 'updates'],
      optionalParams: ['campaignId', 'reason'],
      
      execute: async (params: ActionExecutionParams): Promise<ActionExecutionResult> => {
        // Implementation for strategy update
        return {
          success: true,
          message: 'Strategy updated successfully',
          data: { strategyUpdated: true }
        };
      },
      
      validate: async (params: ActionExecutionParams): Promise<boolean> => {
        return !!(params.actionConfig.strategyType && params.actionConfig.updates);
      }
    };
  }
  
  private createTriggerBackupAgentAction(): ActionExecutor {
    return {
      actionType: ActionType.TRIGGER_BACKUP_AGENT,
      compatibleAgents: [AgentType.CONTENT, AgentType.EMAIL, AgentType.SOCIAL, AgentType.SUPPORT, AgentType.TREND, AgentType.SEO],
      priority: ActionPriority.HIGH,
      maxRetries: 1,
      description: 'Trigger backup agent when primary agent fails',
      requiredParams: ['backupAgentType'],
      optionalParams: ['reason', 'handoverData'],
      
      execute: async (params: ActionExecutionParams): Promise<ActionExecutionResult> => {
        // Implementation for triggering backup agent
        return {
          success: true,
          message: 'Backup agent triggered successfully',
          data: { backupAgentActivated: true }
        };
      },
      
      validate: async (params: ActionExecutionParams): Promise<boolean> => {
        return !!(params.actionConfig.backupAgentType);
      }
    };
  }
  
  private createSendReportAction(): ActionExecutor {
    return {
      actionType: ActionType.SEND_REPORT,
      compatibleAgents: [AgentType.CONTENT, AgentType.EMAIL, AgentType.SOCIAL, AgentType.SUPPORT, AgentType.TREND, AgentType.SEO],
      priority: ActionPriority.LOW,
      maxRetries: 1,
      description: 'Send performance report to stakeholders',
      requiredParams: ['reportType', 'recipients'],
      optionalParams: ['format', 'includeData'],
      
      execute: async (params: ActionExecutionParams): Promise<ActionExecutionResult> => {
        // Implementation for sending report
        return {
          success: true,
          message: 'Report sent successfully',
          data: { reportSent: true }
        };
      },
      
      validate: async (params: ActionExecutionParams): Promise<boolean> => {
        return !!(params.actionConfig.reportType && params.actionConfig.recipients);
      }
    };
  }
  
  private createArchiveCampaignAction(): ActionExecutor {
    return {
      actionType: ActionType.ARCHIVE_CAMPAIGN,
      compatibleAgents: [AgentType.CONTENT, AgentType.EMAIL, AgentType.SOCIAL, AgentType.TREND],
      priority: ActionPriority.LOW,
      maxRetries: 1,
      description: 'Archive campaign when performance is consistently poor',
      requiredParams: ['campaignId'],
      optionalParams: ['reason', 'backupData'],
      
      execute: async (params: ActionExecutionParams): Promise<ActionExecutionResult> => {
        // Implementation for archiving campaign
        return {
          success: true,
          message: 'Campaign archived successfully',
          data: { campaignArchived: true }
        };
      },
      
      validate: async (params: ActionExecutionParams): Promise<boolean> => {
        return !!(params.campaignId);
      }
    };
  }
  
  // Helper methods for actual execution logic
  
  private async pauseCampaignLogic(campaignId: string, config: Record<string, any>): Promise<any> {
    // Implement actual campaign pause logic
    console.log(`Pausing campaign ${campaignId}`, config);
    return { status: 'PAUSED', campaignId, timestamp: new Date().toISOString() };
  }
  
  private async resumeCampaignLogic(campaignId: string, config: Record<string, any>): Promise<any> {
    // Implement actual campaign resume logic
    console.log(`Resuming campaign ${campaignId}`, config);
    return { status: 'ACTIVE', campaignId, timestamp: new Date().toISOString() };
  }
  
  private async adjustBudgetLogic(campaignId: string, adjustmentPercent: number, direction: 'increase' | 'decrease'): Promise<any> {
    // Implement actual budget adjustment logic
    console.log(`Adjusting budget for campaign ${campaignId} by ${adjustmentPercent}% ${direction}`);
    return { 
      campaignId, 
      adjustmentPercent, 
      direction,
      previousBudget: 1000,
      newBudget: direction === 'increase' ? 1200 : 800,
      timestamp: new Date().toISOString() 
    };
  }
  
  private async sendNotificationLogic(agentName: string, message: string, config: Record<string, any>): Promise<any> {
    // Implement actual notification logic
    console.log(`Sending notification from ${agentName}: ${message}`, config);
    return { sent: true, agentName, message, timestamp: new Date().toISOString() };
  }
  
  private async escalateIssueLogic(agentName: string, config: Record<string, any>): Promise<any> {
    // Implement actual escalation logic
    console.log(`Escalating issue from ${agentName}`, config);
    return { escalated: true, agentName, severity: config.severity, timestamp: new Date().toISOString() };
  }
  
  private async switchAgentModeLogic(agentName: string, config: Record<string, any>): Promise<any> {
    // Implement actual agent mode switch logic
    console.log(`Switching agent ${agentName} to mode ${config.newMode}`, config);
    return { 
      agentName, 
      newMode: config.newMode, 
      previousMode: 'normal',
      timestamp: new Date().toISOString() 
    };
  }
  
  private async optimizeTargetingLogic(campaignId: string, config: Record<string, any>): Promise<any> {
    // Implement actual targeting optimization logic
    console.log(`Optimizing targeting for campaign ${campaignId}`, config);
    return { 
      campaignId, 
      changes: ['audience_expansion', 'keyword_optimization'],
      previousTargeting: { audience: 'broad', keywords: ['marketing'] },
      timestamp: new Date().toISOString() 
    };
  }
  
  private async emergencyStopLogic(agentName: string, config: Record<string, any>): Promise<any> {
    // Implement actual emergency stop logic
    console.log(`Emergency stop executed by ${agentName}`, config);
    return { 
      emergencyStop: true, 
      agentName, 
      reason: config.reason,
      timestamp: new Date().toISOString() 
    };
  }
}

// Common trigger conditions for different performance scenarios
export const COMMON_TRIGGER_CONDITIONS = {
  HIGH_COST_PER_CLICK: {
    metricType: 'cost_per_click',
    condition: 'greater_than' as const,
    threshold: 5.0,
    timeWindow: 60,
    cooldownPeriod: 120
  },
  LOW_CONVERSION_RATE: {
    metricType: 'conversion_rate',
    condition: 'less_than' as const,
    threshold: 0.02,
    timeWindow: 120,
    consecutiveCount: 3
  },
  HIGH_BOUNCE_RATE: {
    metricType: 'bounce_rate',
    condition: 'greater_than' as const,
    threshold: 0.8,
    timeWindow: 30,
    consecutiveCount: 2
  },
  BUDGET_DEPLETION: {
    metricType: 'budget_usage',
    condition: 'greater_than' as const,
    threshold: 0.9,
    timeWindow: 15,
    cooldownPeriod: 60
  },
  PERFORMANCE_DROP: {
    metricType: 'performance_score',
    condition: 'change_percent' as const,
    threshold: -25,
    timeWindow: 60,
    consecutiveCount: 2
  }
} as const;

// Export singleton instance
export const performanceActionsRegistry = PerformanceActionsRegistry.getInstance(); 