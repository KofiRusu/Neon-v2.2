import { 
  AgentType, 
  ActionType, 
  ActionStatus, 
  ActionPriority,
  AgentMetric,
  AgentActionLog,
  AgentActionRule,
  PrismaClient 
} from '@neon/data-model';

// Define types for action rule configuration
export interface ActionRuleConfig {
  id: string;
  name: string;
  description: string;
  agentTypes: string[];
  triggerCondition: {
    metricType: string;
    condition: string;
    threshold: number | null;
    timeWindow?: string;
  };
  priority?: ActionPriority;
  enabled?: boolean;
  actions: Array<{
    type: ActionType;
    params?: Record<string, any>;
  }>;
}

// Action execution result type
export interface ActionExecutionResult {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}

// Create action rule function
export function createActionRule(config: ActionRuleConfig): ActionRuleConfig {
  return {
    priority: "MEDIUM" as ActionPriority,
    enabled: true,
    actions: [],
    ...config
  };
}

// Action executor class
export class ActionExecutor {
  private rules: ActionRuleConfig[] = [];
  private prisma: PrismaClient;

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma || new PrismaClient();
  }

  addRule(rule: ActionRuleConfig): void {
    this.rules.push(rule);
  }

  async executeRule(ruleId: string, context: Record<string, any>): Promise<ActionExecutionResult> {
    const rule = this.rules.find(r => r.id === ruleId);
    if (!rule) {
      return {
        success: false,
        error: `Rule with id ${ruleId} not found`
      };
    }

    try {
      // Execute the rule's actions
      for (const action of rule.actions) {
        // Log the action execution
        await this.logActionExecution(rule, action, context);
      }

      return {
        success: true,
        message: `Rule ${ruleId} executed successfully`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async logActionExecution(
    rule: ActionRuleConfig, 
    action: { type: ActionType; params?: Record<string, any> }, 
    context: Record<string, any>
  ): Promise<void> {
    try {
      // Log to database if available
      console.log(`Executing action ${action.type} for rule ${rule.id}`, { context });
    } catch (error) {
      console.error('Failed to log action execution:', error);
    }
  }

  getRules(): ActionRuleConfig[] {
    return this.rules;
  }

  removeRule(ruleId: string): boolean {
    const index = this.rules.findIndex(r => r.id === ruleId);
    if (index >= 0) {
      this.rules.splice(index, 1);
      return true;
    }
    return false;
  }
} 