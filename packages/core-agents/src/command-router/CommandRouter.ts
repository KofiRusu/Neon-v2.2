import LLMCopilotAgent, {
  ParsedIntent,
  IntentAction,
  EntityType,
  CopilotResponse,
  ExecutionStep,
  MessageType,
} from '../agents/llm-copilot-agent';
import { BaseAgent } from '../utils/BaseAgent';
import BoardroomReportAgent from '../agents/boardroom-report-agent';
import ExecutiveReportCompilerAgent from '../agents/executive-report-compiler-agent';
import CampaignAgent from '../agents/campaign-agent';
import BrandVoiceAgent from '../agents/brand-voice-agent';
import ContentAgent from '../agents/content-agent';
import AdAgent from '../agents/ad-agent';
import SocialAgent from '../agents/social-agent';
import EmailAgent from '../agents/email-agent';
import SeoAgent from '../agents/seo-agent';
import TrendAgent from '../agents/trend-agent';
import InsightAgent from '../agents/insight-agent';

export interface CommandExecutionContext {
  sessionId: string;
  userId: string;
  intent: ParsedIntent;
  originalCommand: string;
  environment: ExecutionEnvironment;
  permissions: UserPermissions;
  constraints: ExecutionConstraints;
}

export interface ExecutionEnvironment {
  timezone: string;
  locale: string;
  debugMode: boolean;
  dryRun: boolean;
  verbose: boolean;
}

export interface UserPermissions {
  canExecuteCommands: boolean;
  canAccessReports: boolean;
  canManageCampaigns: boolean;
  canViewFinancials: boolean;
  roleLevel: 'viewer' | 'editor' | 'admin' | 'owner';
  allowedAgents: string[];
}

export interface ExecutionConstraints {
  maxExecutionTime: number; // milliseconds
  maxBudgetImpact: number; // dollars
  requiresApproval: boolean;
  approvalThreshold: number;
  allowBackgroundExecution: boolean;
}

export interface CommandResult {
  executionId: string;
  status: ExecutionStatus;
  startTime: string;
  endTime?: string;
  duration?: number;
  agentResults: AgentExecutionResult[];
  finalOutput: any;
  confidence: number;
  errors?: ExecutionError[];
  warnings?: string[];
  metrics?: ExecutionMetrics;
}

export interface AgentExecutionResult {
  agentType: string;
  agentId: string;
  status: ExecutionStatus;
  startTime: string;
  endTime?: string;
  duration?: number;
  input: any;
  output?: any;
  confidence?: number;
  error?: string;
  metadata?: any;
}

export interface ExecutionError {
  code: string;
  message: string;
  agentType?: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recoverable: boolean;
  suggestedAction?: string;
}

export interface ExecutionMetrics {
  totalAgentsInvoked: number;
  averageExecutionTime: number;
  successRate: number;
  dataPointsProcessed: number;
  resourcesUsed: {
    cpu: number;
    memory: number;
    apiCalls: number;
  };
}

export interface RoutingRule {
  condition: (intent: ParsedIntent) => boolean;
  agentType: string;
  priority: number;
  parameters?: any;
  fallbackAgents?: string[];
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  trigger: IntentAction;
  steps: WorkflowStep[];
  timeout: number;
  rollbackStrategy: 'none' | 'partial' | 'full';
}

export interface WorkflowStep {
  id: string;
  agentType: string;
  action: string;
  parameters: any;
  dependencies: string[];
  timeout: number;
  retryPolicy: {
    maxAttempts: number;
    backoffMultiplier: number;
    initialDelay: number;
  };
  fallbackOptions?: WorkflowStep[];
}

export enum ExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  TIMEOUT = 'timeout',
  REQUIRES_APPROVAL = 'requires_approval',
}

export class CommandRouter {
  private copilotAgent: LLMCopilotAgent;
  private agentRegistry: Map<string, BaseAgent>;
  private routingRules: RoutingRule[];
  private workflows: Map<string, WorkflowDefinition>;
  private activeExecutions: Map<string, CommandResult>;
  private executionHistory: CommandResult[];

  private readonly DEFAULT_TIMEOUT = 30000; // 30 seconds
  private readonly MAX_CONCURRENT_EXECUTIONS = 5;
  private readonly APPROVAL_THRESHOLD = 1000; // $1000 budget impact

  constructor() {
    this.copilotAgent = new LLMCopilotAgent();
    this.agentRegistry = new Map();
    this.routingRules = [];
    this.workflows = new Map();
    this.activeExecutions = new Map();
    this.executionHistory = [];

    this.initializeAgentRegistry();
    this.initializeRoutingRules();
    this.initializeWorkflows();
  }

  async processCommand(command: string, context: CommandExecutionContext): Promise<CommandResult> {
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = new Date().toISOString();

    console.log(`[CommandRouter] Processing command: ${command} (${executionId})`);

    try {
      // Initialize execution result
      const result: CommandResult = {
        executionId,
        status: ExecutionStatus.PENDING,
        startTime,
        agentResults: [],
        finalOutput: null,
        confidence: 0,
      };

      this.activeExecutions.set(executionId, result);

      // Step 1: Parse command using LLM Copilot
      const copilotResponse = await this.copilotAgent.processMessage(
        command,
        context.sessionId,
        context.userId,
        MessageType.COMMAND
      );

      if (!copilotResponse.intent) {
        throw new Error('Failed to parse command intent');
      }

      const intent = copilotResponse.intent;
      result.confidence = intent.confidence;

      // Step 2: Check permissions
      const permissionCheck = this.checkPermissions(intent, context.permissions);
      if (!permissionCheck.allowed) {
        throw new Error(`Permission denied: ${permissionCheck.reason}`);
      }

      // Step 3: Check constraints and approval requirements
      const constraintCheck = this.checkConstraints(intent, context.constraints);
      if (constraintCheck.requiresApproval) {
        result.status = ExecutionStatus.REQUIRES_APPROVAL;
        this.updateExecution(executionId, result);
        return result;
      }

      // Step 4: Route to appropriate execution strategy
      result.status = ExecutionStatus.RUNNING;
      this.updateExecution(executionId, result);

      if (copilotResponse.executionPlan) {
        // Execute planned workflow
        await this.executeWorkflow(executionId, copilotResponse.executionPlan, intent, context);
      } else {
        // Route to single agent
        await this.routeToAgent(executionId, intent, context);
      }

      // Step 5: Finalize result
      const finalResult = this.activeExecutions.get(executionId)!;
      finalResult.status = ExecutionStatus.COMPLETED;
      finalResult.endTime = new Date().toISOString();
      finalResult.duration =
        new Date(finalResult.endTime).getTime() - new Date(finalResult.startTime).getTime();

      this.updateExecution(executionId, finalResult);
      this.archiveExecution(executionId);

      console.log(`[CommandRouter] Command completed successfully (${executionId})`);
      return finalResult;
    } catch (error) {
      console.error(`[CommandRouter] Command execution failed (${executionId}):`, error);

      const failedResult: CommandResult = {
        executionId,
        status: ExecutionStatus.FAILED,
        startTime,
        endTime: new Date().toISOString(),
        agentResults: [],
        finalOutput: null,
        confidence: 0,
        errors: [
          {
            code: 'EXECUTION_FAILED',
            message: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
            severity: 'high',
            recoverable: false,
          },
        ],
      };

      this.activeExecutions.set(executionId, failedResult);
      this.archiveExecution(executionId);

      return failedResult;
    }
  }

  private async executeWorkflow(
    executionId: string,
    executionPlan: ExecutionStep[],
    intent: ParsedIntent,
    context: CommandExecutionContext
  ): Promise<void> {
    console.log(`[CommandRouter] Executing workflow with ${executionPlan.length} steps`);

    const result = this.activeExecutions.get(executionId)!;
    const workflowContext: any = {};

    for (const step of executionPlan) {
      try {
        console.log(`[CommandRouter] Executing step: ${step.description}`);

        const agent = this.agentRegistry.get(step.agentType);
        if (!agent) {
          throw new Error(`Agent not found: ${step.agentType}`);
        }

        const stepStartTime = new Date().toISOString();

        // Execute agent with step parameters
        const agentResult = await this.executeAgent(
          agent,
          step.agentType,
          { ...step.parameters, context: workflowContext },
          context
        );

        // Store step result
        const agentExecutionResult: AgentExecutionResult = {
          agentType: step.agentType,
          agentId: step.stepId,
          status: ExecutionStatus.COMPLETED,
          startTime: stepStartTime,
          endTime: new Date().toISOString(),
          duration: new Date().getTime() - new Date(stepStartTime).getTime(),
          input: step.parameters,
          output: agentResult,
          confidence: agentResult.confidence || 0.8,
        };

        result.agentResults.push(agentExecutionResult);

        // Update workflow context for next steps
        workflowContext[step.stepId] = agentResult;

        console.log(`[CommandRouter] Step completed: ${step.description}`);
      } catch (error) {
        console.error(`[CommandRouter] Step failed: ${step.description}`, error);

        const failedStepResult: AgentExecutionResult = {
          agentType: step.agentType,
          agentId: step.stepId,
          status: ExecutionStatus.FAILED,
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
          duration: 0,
          input: step.parameters,
          error: error instanceof Error ? error.message : 'Unknown error',
        };

        result.agentResults.push(failedStepResult);

        // Handle workflow failure
        throw new Error(
          `Workflow step failed: ${step.description} - ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    // Set final workflow output
    result.finalOutput = this.synthesizeWorkflowOutput(result.agentResults, intent);
    this.updateExecution(executionId, result);
  }

  private async routeToAgent(
    executionId: string,
    intent: ParsedIntent,
    context: CommandExecutionContext
  ): Promise<void> {
    console.log(`[CommandRouter] Routing to single agent for action: ${intent.primaryAction}`);

    const result = this.activeExecutions.get(executionId)!;

    // Find best agent for the intent
    const agentType = this.findBestAgent(intent);
    const agent = this.agentRegistry.get(agentType);

    if (!agent) {
      throw new Error(`No suitable agent found for action: ${intent.primaryAction}`);
    }

    try {
      const agentStartTime = new Date().toISOString();

      // Execute agent
      const agentResult = await this.executeAgent(agent, agentType, intent.parameters, context);

      const agentExecutionResult: AgentExecutionResult = {
        agentType,
        agentId: `${agentType}_${Date.now()}`,
        status: ExecutionStatus.COMPLETED,
        startTime: agentStartTime,
        endTime: new Date().toISOString(),
        duration: new Date().getTime() - new Date(agentStartTime).getTime(),
        input: intent.parameters,
        output: agentResult,
        confidence: agentResult.confidence || intent.confidence,
      };

      result.agentResults.push(agentExecutionResult);
      result.finalOutput = agentResult;

      this.updateExecution(executionId, result);
    } catch (error) {
      console.error(`[CommandRouter] Agent execution failed:`, error);
      throw error;
    }
  }

  private async executeAgent(
    agent: BaseAgent,
    agentType: string,
    parameters: any,
    context: CommandExecutionContext
  ): Promise<any> {
    console.log(`[CommandRouter] Executing agent: ${agentType}`);

    // Map generic parameters to agent-specific parameters
    const agentParams = this.mapParametersForAgent(agentType, parameters, context);

    // Execute agent based on type
    switch (agentType) {
      case 'boardroom':
        const boardroomAgent = agent as BoardroomReportAgent;
        return await boardroomAgent.generateReport(agentParams);

      case 'executive':
        const executiveAgent = agent as ExecutiveReportCompilerAgent;
        return await executiveAgent.generateReport(agentParams);

      case 'campaign':
        const campaignAgent = agent as CampaignAgent;
        return await this.executeCampaignAction(campaignAgent, agentParams);

      case 'content':
        const contentAgent = agent as ContentAgent;
        return await this.executeContentAction(contentAgent, agentParams);

      case 'brand_voice':
        const brandAgent = agent as BrandVoiceAgent;
        return await this.executeBrandAction(brandAgent, agentParams);

      case 'insight':
        const insightAgent = agent as InsightAgent;
        return await this.executeInsightAction(insightAgent, agentParams);

      case 'trend':
        const trendAgent = agent as TrendAgent;
        return await this.executeTrendAction(trendAgent, agentParams);

      default:
        throw new Error(`Unsupported agent type: ${agentType}`);
    }
  }

  private mapParametersForAgent(
    agentType: string,
    parameters: any,
    context: CommandExecutionContext
  ): any {
    const baseParams = {
      sessionId: context.sessionId,
      userId: context.userId,
      environment: context.environment,
    };

    switch (agentType) {
      case 'boardroom':
      case 'executive':
        return {
          ...baseParams,
          reportType: parameters.reportType || 'QBR',
          theme: parameters.theme || 'NEON_GLASS',
          timeframe: parameters.timeframeData || this.getDefaultTimeframe(),
          includeForecasts: parameters.includeForecasts !== false,
          includeCampaigns: parameters.includeCampaigns || [],
          includeAgents: parameters.includeAgents || [],
          confidenceThreshold: parameters.confidenceThreshold || 0.7,
          maxSlides: parameters.maxSlides || 15,
        };

      case 'campaign':
        return {
          ...baseParams,
          action: parameters.action || 'analyze',
          campaignId: parameters.campaignId,
          campaignType: parameters.campaignType,
          campaignFilter: parameters.campaignFilter,
          budget: parameters.budget,
          targeting: parameters.targeting,
        };

      case 'content':
        return {
          ...baseParams,
          contentType: parameters.contentType || 'general',
          brandVoice: parameters.brandVoice || 'default',
          platform: parameters.platform,
          length: parameters.length,
          tone: parameters.tone,
        };

      case 'insight':
        return {
          ...baseParams,
          analysisType: parameters.analysisType || 'comprehensive',
          metrics: parameters.metrics || ['performance'],
          timeframe: parameters.timeframeData || this.getDefaultTimeframe(),
          segments: parameters.segments,
        };

      default:
        return { ...baseParams, ...parameters };
    }
  }

  private async executeCampaignAction(agent: CampaignAgent, params: any): Promise<any> {
    // Mock campaign execution - in production would call actual agent methods
    console.log(`[CommandRouter] Executing campaign action: ${params.action}`);

    const mockResult = {
      action: params.action,
      campaignsAffected: params.campaignFilter ? 3 : 1,
      budgetImpact: params.action === 'pause' ? -2400 : 0,
      estimatedSavings: params.action === 'pause' ? 2400 : 0,
      confidence: 0.92,
      details: `Campaign ${params.action} executed successfully`,
    };

    await this.mockDelay(2000);
    return mockResult;
  }

  private async executeContentAction(agent: ContentAgent, params: any): Promise<any> {
    console.log(`[CommandRouter] Executing content action: ${params.contentType}`);

    const mockResult = {
      contentType: params.contentType,
      generatedContent: 'Sample AI-generated marketing content with brand alignment',
      brandAlignmentScore: 0.94,
      confidence: 0.89,
      wordCount: 250,
      suggestedPlatforms: ['social', 'email', 'blog'],
    };

    await this.mockDelay(3000);
    return mockResult;
  }

  private async executeBrandAction(agent: BrandVoiceAgent, params: any): Promise<any> {
    console.log(`[CommandRouter] Executing brand voice action`);

    const mockResult = {
      alignmentScore: 0.91,
      voiceConsistency: 0.94,
      suggestions: ['Maintain consistent tone across platforms', 'Review terminology usage'],
      confidence: 0.87,
    };

    await this.mockDelay(1500);
    return mockResult;
  }

  private async executeInsightAction(agent: InsightAgent, params: any): Promise<any> {
    console.log(`[CommandRouter] Executing insight analysis: ${params.analysisType}`);

    const mockResult = {
      analysisType: params.analysisType,
      insights: [
        'ROAS increased by 23% this quarter',
        'Video content performing 40% better than static',
        'Mobile engagement up 15% month-over-month',
      ],
      metrics: params.metrics.map((metric: string) => ({
        name: metric,
        value: Math.random() * 100,
        trend: Math.random() > 0.5 ? 'up' : 'down',
      })),
      confidence: 0.85,
    };

    await this.mockDelay(2500);
    return mockResult;
  }

  private async executeTrendAction(agent: TrendAgent, params: any): Promise<any> {
    console.log(`[CommandRouter] Executing trend analysis`);

    const mockResult = {
      trends: [
        { trend: 'Video content adoption', strength: 0.78, direction: 'up' },
        { trend: 'Mobile-first engagement', strength: 0.65, direction: 'up' },
        { trend: 'Personalization effectiveness', strength: 0.82, direction: 'up' },
      ],
      predictions: [
        'Video content will dominate Q2 performance',
        'Mobile engagement expected to grow 25%',
      ],
      confidence: 0.81,
    };

    await this.mockDelay(2000);
    return mockResult;
  }

  private synthesizeWorkflowOutput(results: AgentExecutionResult[], intent: ParsedIntent): any {
    const output = {
      workflowType: intent.primaryAction,
      totalSteps: results.length,
      successfulSteps: results.filter(r => r.status === ExecutionStatus.COMPLETED).length,
      totalDuration: results.reduce((sum, r) => sum + (r.duration || 0), 0),
      averageConfidence: results.reduce((sum, r) => sum + (r.confidence || 0), 0) / results.length,
      results: results.map(r => ({
        agent: r.agentType,
        status: r.status,
        output: r.output,
        confidence: r.confidence,
      })),
      summary: this.generateWorkflowSummary(results, intent),
    };

    return output;
  }

  private generateWorkflowSummary(results: AgentExecutionResult[], intent: ParsedIntent): string {
    const successCount = results.filter(r => r.status === ExecutionStatus.COMPLETED).length;
    const totalCount = results.length;
    const avgConfidence = results.reduce((sum, r) => sum + (r.confidence || 0), 0) / results.length;

    return (
      `Workflow completed: ${successCount}/${totalCount} steps successful, ` +
      `${(avgConfidence * 100).toFixed(0)}% average confidence. ` +
      `Primary action: ${intent.primaryAction}`
    );
  }

  private findBestAgent(intent: ParsedIntent): string {
    // Check routing rules first
    const applicableRules = this.routingRules
      .filter(rule => rule.condition(intent))
      .sort((a, b) => b.priority - a.priority);

    if (applicableRules.length > 0) {
      return applicableRules[0].agentType;
    }

    // Fallback to action-based routing
    const actionAgentMap: { [key in IntentAction]: string } = {
      [IntentAction.GENERATE_REPORT]: 'boardroom',
      [IntentAction.GET_INSIGHTS]: 'insight',
      [IntentAction.VIEW_ANALYTICS]: 'insight',
      [IntentAction.DOWNLOAD_REPORT]: 'boardroom',
      [IntentAction.CREATE_CAMPAIGN]: 'campaign',
      [IntentAction.UPDATE_CAMPAIGN]: 'campaign',
      [IntentAction.PAUSE_CAMPAIGN]: 'campaign',
      [IntentAction.LAUNCH_CAMPAIGN]: 'campaign',
      [IntentAction.ANALYZE_CAMPAIGN]: 'campaign',
      [IntentAction.GENERATE_CONTENT]: 'content',
      [IntentAction.REVIEW_CONTENT]: 'brand_voice',
      [IntentAction.OPTIMIZE_CONTENT]: 'content',
      [IntentAction.CREATE_FORECAST]: 'boardroom',
      [IntentAction.PLAN_STRATEGY]: 'boardroom',
      [IntentAction.OPTIMIZE_BUDGET]: 'campaign',
      [IntentAction.GET_STATUS]: 'insight',
      [IntentAction.CONFIGURE_SETTINGS]: 'insight',
      [IntentAction.SCHEDULE_TASK]: 'boardroom',
      [IntentAction.EXPLAIN]: 'insight',
      [IntentAction.CLARIFY]: 'insight',
      [IntentAction.HELP]: 'insight',
      [IntentAction.UNKNOWN]: 'insight',
    };

    return actionAgentMap[intent.primaryAction] || 'insight';
  }

  private checkPermissions(
    intent: ParsedIntent,
    permissions: UserPermissions
  ): { allowed: boolean; reason?: string } {
    if (!permissions.canExecuteCommands) {
      return { allowed: false, reason: 'User does not have command execution permissions' };
    }

    // Check action-specific permissions
    if (
      intent.primaryAction === IntentAction.CREATE_CAMPAIGN ||
      intent.primaryAction === IntentAction.PAUSE_CAMPAIGN ||
      intent.primaryAction === IntentAction.UPDATE_CAMPAIGN
    ) {
      if (!permissions.canManageCampaigns) {
        return { allowed: false, reason: 'User does not have campaign management permissions' };
      }
    }

    if (
      intent.primaryAction === IntentAction.GENERATE_REPORT ||
      intent.primaryAction === IntentAction.VIEW_ANALYTICS
    ) {
      if (!permissions.canAccessReports) {
        return { allowed: false, reason: 'User does not have report access permissions' };
      }
    }

    // Check agent-specific permissions
    const requiredAgent = this.findBestAgent(intent);
    if (
      !permissions.allowedAgents.includes(requiredAgent) &&
      permissions.allowedAgents.length > 0
    ) {
      return { allowed: false, reason: `User does not have access to ${requiredAgent} agent` };
    }

    return { allowed: true };
  }

  private checkConstraints(
    intent: ParsedIntent,
    constraints: ExecutionConstraints
  ): { requiresApproval: boolean; reason?: string } {
    // Check budget impact
    const estimatedBudgetImpact = this.estimateBudgetImpact(intent);
    if (estimatedBudgetImpact > constraints.maxBudgetImpact) {
      return {
        requiresApproval: true,
        reason: `Budget impact ($${estimatedBudgetImpact}) exceeds limit ($${constraints.maxBudgetImpact})`,
      };
    }

    // Check approval threshold
    if (constraints.requiresApproval && estimatedBudgetImpact > constraints.approvalThreshold) {
      return {
        requiresApproval: true,
        reason: `Budget impact exceeds approval threshold ($${constraints.approvalThreshold})`,
      };
    }

    return { requiresApproval: false };
  }

  private estimateBudgetImpact(intent: ParsedIntent): number {
    // Mock budget impact estimation
    const budgetImpacts = {
      [IntentAction.CREATE_CAMPAIGN]: 5000,
      [IntentAction.PAUSE_CAMPAIGN]: 0, // Actually saves money
      [IntentAction.UPDATE_CAMPAIGN]: 1000,
      [IntentAction.LAUNCH_CAMPAIGN]: 3000,
      [IntentAction.OPTIMIZE_BUDGET]: 2000,
    };

    return budgetImpacts[intent.primaryAction] || 0;
  }

  private getDefaultTimeframe(): any {
    const now = new Date();
    return {
      start: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0],
      end: now.toISOString().split('T')[0],
      label: 'this month',
    };
  }

  private updateExecution(executionId: string, result: CommandResult): void {
    this.activeExecutions.set(executionId, result);
  }

  private archiveExecution(executionId: string): void {
    const result = this.activeExecutions.get(executionId);
    if (result) {
      this.executionHistory.push(result);
      this.activeExecutions.delete(executionId);

      // Keep only last 100 executions in history
      if (this.executionHistory.length > 100) {
        this.executionHistory = this.executionHistory.slice(-100);
      }
    }
  }

  private async mockDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Initialization methods
  private initializeAgentRegistry(): void {
    this.agentRegistry.set('boardroom', new BoardroomReportAgent());
    this.agentRegistry.set('executive', new ExecutiveReportCompilerAgent());
    this.agentRegistry.set('campaign', new CampaignAgent());
    this.agentRegistry.set('brand_voice', new BrandVoiceAgent());
    this.agentRegistry.set('content', new ContentAgent());
    this.agentRegistry.set('ad', new AdAgent());
    this.agentRegistry.set('social', new SocialAgent());
    this.agentRegistry.set('email', new EmailAgent());
    this.agentRegistry.set('seo', new SeoAgent());
    this.agentRegistry.set('trend', new TrendAgent());
    this.agentRegistry.set('insight', new InsightAgent());
  }

  private initializeRoutingRules(): void {
    this.routingRules = [
      {
        condition: intent =>
          intent.primaryAction === IntentAction.GENERATE_REPORT &&
          intent.parameters?.reportType === 'boardroom',
        agentType: 'boardroom',
        priority: 10,
      },
      {
        condition: intent => intent.primaryAction === IntentAction.GENERATE_REPORT,
        agentType: 'executive',
        priority: 8,
      },
      {
        condition: intent => intent.primaryAction === IntentAction.CREATE_FORECAST,
        agentType: 'boardroom',
        priority: 9,
      },
      {
        condition: intent => intent.entityType === EntityType.CAMPAIGN,
        agentType: 'campaign',
        priority: 7,
      },
      {
        condition: intent => intent.parameters?.metrics?.includes('brand_alignment'),
        agentType: 'brand_voice',
        priority: 6,
      },
    ];
  }

  private initializeWorkflows(): void {
    // Initialize predefined workflows for complex operations
    const reportGenerationWorkflow: WorkflowDefinition = {
      id: 'comprehensive_report_generation',
      name: 'Comprehensive Report Generation',
      description: 'Generate a full boardroom report with insights and forecasts',
      trigger: IntentAction.GENERATE_REPORT,
      timeout: 30000,
      rollbackStrategy: 'partial',
      steps: [
        {
          id: 'data_gathering',
          agentType: 'insight',
          action: 'gather_data',
          parameters: {},
          dependencies: [],
          timeout: 5000,
          retryPolicy: { maxAttempts: 2, backoffMultiplier: 1.5, initialDelay: 1000 },
        },
        {
          id: 'trend_analysis',
          agentType: 'trend',
          action: 'analyze_trends',
          parameters: {},
          dependencies: ['data_gathering'],
          timeout: 8000,
          retryPolicy: { maxAttempts: 2, backoffMultiplier: 1.5, initialDelay: 1000 },
        },
        {
          id: 'report_compilation',
          agentType: 'boardroom',
          action: 'generate_report',
          parameters: {},
          dependencies: ['data_gathering', 'trend_analysis'],
          timeout: 10000,
          retryPolicy: { maxAttempts: 3, backoffMultiplier: 2, initialDelay: 2000 },
        },
      ],
    };

    this.workflows.set(reportGenerationWorkflow.id, reportGenerationWorkflow);
  }

  // Public methods for monitoring and management
  getActiveExecutions(): CommandResult[] {
    return Array.from(this.activeExecutions.values());
  }

  getExecutionHistory(limit: number = 50): CommandResult[] {
    return this.executionHistory.slice(-limit);
  }

  getExecutionById(executionId: string): CommandResult | null {
    return (
      this.activeExecutions.get(executionId) ||
      this.executionHistory.find(r => r.executionId === executionId) ||
      null
    );
  }

  async cancelExecution(executionId: string): Promise<boolean> {
    const execution = this.activeExecutions.get(executionId);
    if (execution && execution.status === ExecutionStatus.RUNNING) {
      execution.status = ExecutionStatus.CANCELLED;
      execution.endTime = new Date().toISOString();
      this.updateExecution(executionId, execution);
      this.archiveExecution(executionId);
      return true;
    }
    return false;
  }

  getSystemMetrics(): ExecutionMetrics {
    const recentExecutions = this.executionHistory.slice(-50);
    const successfulExecutions = recentExecutions.filter(
      e => e.status === ExecutionStatus.COMPLETED
    );

    return {
      totalAgentsInvoked: recentExecutions.reduce((sum, e) => sum + e.agentResults.length, 0),
      averageExecutionTime:
        recentExecutions.reduce((sum, e) => sum + (e.duration || 0), 0) / recentExecutions.length,
      successRate: successfulExecutions.length / recentExecutions.length,
      dataPointsProcessed: recentExecutions.length * 100, // Mock
      resourcesUsed: {
        cpu: 45.2,
        memory: 68.7,
        apiCalls: recentExecutions.length * 3,
      },
    };
  }
}

export default CommandRouter;
