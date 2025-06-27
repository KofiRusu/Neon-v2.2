import { AgentFactory } from './base-agent';
import { logger } from '@neon/utils';

// Import all agent classes
import { ContentAgent } from './agents/content-agent';
import { SEOAgent } from './agents/seo-agent';
import { AdAgent } from './agents/ad-agent';
import { OutreachAgent } from './agents/outreach-agent';
import { TrendAgent } from './agents/trend-agent';
import { InsightAgent } from './agents/insight-agent';
import { DesignAgent } from './agents/design-agent';
import { UIRefinementAgent } from './agents/ui-refinement-agent';
import { EmailMarketingAgent } from './agents/email-agent';
import { CustomerSupportAgent } from './agents/support-agent';
import { ErrorSentinelAgent } from './agents/error-sentinel-agent';
import { CampaignAgent } from './agents/campaign-agent';
import LLMCopilotAgent from './agents/llm-copilot-agent';
import BoardroomReportAgent from './agents/boardroom-report-agent';
import ExecutiveReportCompilerAgent from './agents/executive-report-compiler-agent';
import BoardroomReportSchedulerAgent from './agents/boardroom-report-scheduler-agent';
import BrandVoiceAgent from './agents/brand-voice-agent';
import SocialAgent from './agents/social-agent';

// Command schemas and interfaces
export interface CommandSchema {
  action: string;
  description: string;
  parameters: {
    [key: string]: {
      type: 'string' | 'number' | 'boolean' | 'object' | 'array';
      required: boolean;
      description: string;
      enum?: string[];
      default?: any;
    };
  };
  returns: {
    type: string;
    description: string;
    properties?: any;
  };
  examples: CommandExample[];
  permissions?: string[];
  estimatedDuration?: number;
  budgetImpact?: number;
}

export interface CommandExample {
  input: any;
  output: any;
  description: string;
}

export interface ExecuteCommandContext {
  userId: string;
  sessionId: string;
  permissions: string[];
  environment: 'production' | 'development' | 'staging';
  dryRun?: boolean;
}

export interface CommandExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
  duration: number;
  confidence?: number;
  metadata?: any;
}

/**
 * Register all available agents with the AgentFactory
 * This function should be called during application startup
 */
export function registerAllAgents(): void {
  // Register each agent type with the factory
  AgentFactory.registerAgent('content', ContentAgent);
  AgentFactory.registerAgent('seo', SEOAgent);
  AgentFactory.registerAgent('ad', AdAgent);
  AgentFactory.registerAgent('outreach', OutreachAgent);
  AgentFactory.registerAgent('trend', TrendAgent);
  AgentFactory.registerAgent('insight', InsightAgent);
  AgentFactory.registerAgent('design', DesignAgent);
  AgentFactory.registerAgent('ui-refinement', UIRefinementAgent);
  AgentFactory.registerAgent('email', EmailMarketingAgent);
  AgentFactory.registerAgent('support', CustomerSupportAgent);
  AgentFactory.registerAgent('error-sentinel', ErrorSentinelAgent);
  AgentFactory.registerAgent('campaign', CampaignAgent);

  // Register new agents for Copilot functionality
  AgentFactory.registerAgent('llm-copilot', LLMCopilotAgent);
  AgentFactory.registerAgent('boardroom', BoardroomReportAgent);
  AgentFactory.registerAgent('executive', ExecutiveReportCompilerAgent);
  AgentFactory.registerAgent('boardroom-scheduler', BoardroomReportSchedulerAgent);
  AgentFactory.registerAgent('brand-voice', BrandVoiceAgent);
  AgentFactory.registerAgent('social-media', SocialAgent);

  logger.info(
    'Agent registry initialized',
    { agentTypes: AgentFactory.getAvailableTypes() },
    'AgentRegistry'
  );
}

/**
 * Get a list of all registered agent types
 */
export function getRegisteredAgentTypes(): string[] {
  return AgentFactory.getAvailableTypes();
}

/**
 * Check if an agent type is registered
 */
export function isAgentTypeRegistered(type: string): boolean {
  return AgentFactory.getAvailableTypes().includes(type);
}

/**
 * Create an SEO agent instance
 */
export function createSEOAgent(): SEOAgent {
  return new SEOAgent();
}

/**
 * Create an Email Marketing agent instance
 */
export function createEmailMarketingAgent(): EmailMarketingAgent {
  return new EmailMarketingAgent();
}

/**
 * Create a Customer Support agent instance
 */
export function createCustomerSupportAgent(): CustomerSupportAgent {
  return new CustomerSupportAgent();
}

/**
 * Create an Error Sentinel agent instance
 */
export function createErrorSentinelAgent(): ErrorSentinelAgent {
  return new ErrorSentinelAgent();
}

/**
 * Create a Campaign agent instance
 */
export function createCampaignAgent(): CampaignAgent {
  return new CampaignAgent();
}

/**
 * Create a LLM Copilot agent instance
 */
export function createLLMCopilotAgent(): LLMCopilotAgent {
  return new LLMCopilotAgent();
}

/**
 * Create a Boardroom Report agent instance
 */
export function createBoardroomReportAgent(): BoardroomReportAgent {
  return new BoardroomReportAgent();
}

/**
 * Execute a command on a specific agent
 */
export async function executeAgentCommand(
  agentType: string,
  action: string,
  parameters: any,
  context: ExecuteCommandContext
): Promise<CommandExecutionResult> {
  const startTime = Date.now();

  try {
    // Check if agent type is registered
    if (!isAgentTypeRegistered(agentType)) {
      return {
        success: false,
        error: `Agent type '${agentType}' is not registered`,
        duration: Date.now() - startTime,
      };
    }

    // Get agent instance
    const agent = createAgentInstance(agentType);
    if (!agent) {
      return {
        success: false,
        error: `Failed to create agent instance for type '${agentType}'`,
        duration: Date.now() - startTime,
      };
    }

    // Execute the command
    const result = await executeCommand(agent, agentType, action, parameters, context);

    return {
      success: true,
      data: result,
      duration: Date.now() - startTime,
      confidence: result?.confidence || 0.8,
    };
  } catch (error) {
    logger.error('Agent command execution failed', { agentType, action, error }, 'AgentRegistry');

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime,
    };
  }
}

/**
 * Create an agent instance by type
 */
function createAgentInstance(agentType: string): any {
  switch (agentType) {
    case 'content':
      return new ContentAgent();
    case 'seo':
      return new SEOAgent();
    case 'ad':
      return new AdAgent();
    case 'outreach':
      return new OutreachAgent();
    case 'trend':
      return new TrendAgent();
    case 'insight':
      return new InsightAgent();
    case 'design':
      return new DesignAgent();
    case 'ui-refinement':
      return new UIRefinementAgent('ui-refinement', 'UI Refinement Agent');
    case 'email':
      return new EmailMarketingAgent();
    case 'support':
      return new CustomerSupportAgent();
    case 'error-sentinel':
      return new ErrorSentinelAgent();
    case 'campaign':
      return new CampaignAgent();
    case 'llm-copilot':
      return new LLMCopilotAgent();
    case 'boardroom':
      return new BoardroomReportAgent();
    case 'executive':
      return new ExecutiveReportCompilerAgent();
    case 'boardroom-scheduler':
      return new BoardroomReportSchedulerAgent();
    case 'brand-voice':
      return new BrandVoiceAgent();
    case 'social-media':
      return new SocialAgent();
    default:
      return null;
  }
}

/**
 * Execute a command on an agent instance
 */
async function executeCommand(
  agent: any,
  agentType: string,
  action: string,
  parameters: any,
  context: ExecuteCommandContext
): Promise<any> {
  // Route command to appropriate agent method based on type and action
  switch (agentType) {
    case 'llm-copilot':
      return await executeCopilotCommand(agent, action, parameters, context);
    case 'boardroom':
    case 'executive':
      return await executeReportCommand(agent, action, parameters, context);
    case 'campaign':
      return await executeCampaignCommand(agent, action, parameters, context);
    case 'content':
      return await executeContentCommand(agent, action, parameters, context);
    case 'insight':
      return await executeInsightCommand(agent, action, parameters, context);
    case 'trend':
      return await executeTrendCommand(agent, action, parameters, context);
    case 'brand-voice':
      return await executeBrandVoiceCommand(agent, action, parameters, context);
    case 'social-media':
      return await executeSocialCommand(agent, action, parameters, context);
    default:
      // Fallback to generic method execution
      if (typeof agent[action] === 'function') {
        return await agent[action](parameters);
      } else {
        throw new Error(`Action '${action}' not supported by agent type '${agentType}'`);
      }
  }
}

// Agent-specific command execution functions
async function executeCopilotCommand(
  agent: LLMCopilotAgent,
  action: string,
  parameters: any,
  context: ExecuteCommandContext
): Promise<any> {
  switch (action) {
    case 'processMessage':
      return await agent.processMessage(
        parameters.input,
        context.sessionId,
        context.userId,
        parameters.messageType
      );
    case 'getSession':
      return await agent.getSession(context.sessionId);
    case 'clearSession':
      return await agent.clearSession(context.sessionId);
    default:
      throw new Error(`Unsupported copilot action: ${action}`);
  }
}

async function executeReportCommand(
  agent: any,
  action: string,
  parameters: any,
  context: ExecuteCommandContext
): Promise<any> {
  switch (action) {
    case 'generateReport':
      return await agent.generateReport(parameters);
    case 'scheduleReport':
      if (typeof agent.scheduleReport === 'function') {
        return await agent.scheduleReport(parameters);
      }
      throw new Error(`Schedule report not supported by this agent`);
    default:
      throw new Error(`Unsupported report action: ${action}`);
  }
}

async function executeCampaignCommand(
  agent: CampaignAgent,
  action: string,
  parameters: any,
  context: ExecuteCommandContext
): Promise<any> {
  // Mock campaign command execution
  const mockResults = {
    plan_campaign: { campaignId: 'camp_123', status: 'planned', budget: parameters.budget || 5000 },
    execute_campaign: {
      campaignId: parameters.campaignId,
      status: 'running',
      startTime: new Date().toISOString(),
    },
    pause_campaign: {
      campaignId: parameters.campaignId,
      status: 'paused',
      pausedAt: new Date().toISOString(),
    },
    analyze_results: {
      campaignId: parameters.campaignId,
      metrics: { roas: 3.4, conversions: 125, ctr: 2.3 },
      insights: ['Video content performing well', 'Mobile traffic increased 15%'],
    },
  };

  return mockResults[action as keyof typeof mockResults] || { success: true, action };
}

async function executeContentCommand(
  agent: ContentAgent,
  action: string,
  parameters: any,
  context: ExecuteCommandContext
): Promise<any> {
  // Mock content command execution
  const mockResults = {
    generate_content: {
      content: 'AI-generated marketing content tailored to your brand voice',
      wordCount: 250,
      tone: parameters.tone || 'professional',
      brandAlignment: 0.94,
    },
    generate_blog: {
      title: 'The Future of AI in Marketing',
      content: 'Comprehensive blog post content...',
      wordCount: 800,
      seoScore: 0.92,
    },
    generate_caption: {
      caption: 'Engaging social media caption with relevant hashtags #marketing #AI',
      hashtags: ['#marketing', '#AI', '#innovation'],
      engagement_prediction: 0.87,
    },
  };

  return (
    mockResults[action as keyof typeof mockResults] || {
      content: 'Generated content',
      confidence: 0.85,
    }
  );
}

async function executeInsightCommand(
  agent: InsightAgent,
  action: string,
  parameters: any,
  context: ExecuteCommandContext
): Promise<any> {
  // Mock insight command execution
  const mockResults = {
    analyze_metrics: {
      metrics: {
        roas: { value: 3.4, trend: 'up', change: '+12%' },
        conversions: { value: 125, trend: 'up', change: '+8%' },
        ctr: { value: 2.3, trend: 'stable', change: '+1%' },
      },
      insights: [
        'Performance trending upward this quarter',
        'Video campaigns outperforming static content',
        'Mobile engagement increased significantly',
      ],
    },
    generate_insights: {
      topInsights: [
        'Brand alignment improved by 15% this month',
        'Customer acquisition cost decreased by 8%',
        'Social media engagement up 23%',
      ],
      confidence: 0.89,
    },
  };

  return mockResults[action as keyof typeof mockResults] || { insights: [], confidence: 0.8 };
}

async function executeTrendCommand(
  agent: TrendAgent,
  action: string,
  parameters: any,
  context: ExecuteCommandContext
): Promise<any> {
  // Mock trend command execution
  return {
    trends: [
      { name: 'Video Content Growth', strength: 0.85, direction: 'up' },
      { name: 'Mobile-First Engagement', strength: 0.72, direction: 'up' },
      { name: 'Personalization Impact', strength: 0.68, direction: 'stable' },
    ],
    predictions: [
      'Video content will dominate Q2 performance',
      'Mobile traffic expected to grow 25%',
      'Personalized campaigns will show 30% better ROAS',
    ],
    confidence: 0.83,
  };
}

async function executeBrandVoiceCommand(
  agent: BrandVoiceAgent,
  action: string,
  parameters: any,
  context: ExecuteCommandContext
): Promise<any> {
  // Mock brand voice command execution
  return {
    alignmentScore: 0.92,
    voiceConsistency: 0.89,
    recommendations: [
      'Maintain consistent tone across all channels',
      'Review technical terminology for clarity',
      'Strengthen emotional connection in messaging',
    ],
    brandMetrics: {
      clarity: 0.91,
      authenticity: 0.87,
      memorability: 0.84,
    },
    confidence: 0.9,
  };
}

async function executeSocialCommand(
  agent: SocialAgent,
  action: string,
  parameters: any,
  context: ExecuteCommandContext
): Promise<any> {
  // Mock social media command execution
  return {
    posts: [
      { platform: 'instagram', content: 'Engaging Instagram post...', predicted_engagement: 0.85 },
      {
        platform: 'twitter',
        content: 'Twitter post with trending hashtags...',
        predicted_engagement: 0.78,
      },
      {
        platform: 'linkedin',
        content: 'Professional LinkedIn update...',
        predicted_engagement: 0.82,
      },
    ],
    analytics: {
      reach: 12500,
      engagement_rate: 0.078,
      click_through_rate: 0.034,
    },
    confidence: 0.86,
  };
}

/**
 * Get command schemas for all agents
 */
export function getAllCommandSchemas(): { [agentType: string]: CommandSchema[] } {
  return {
    'llm-copilot': getLLMCopilotCommandSchemas(),
    boardroom: getBoardroomCommandSchemas(),
    executive: getExecutiveCommandSchemas(),
    campaign: getCampaignCommandSchemas(),
    content: getContentCommandSchemas(),
    insight: getInsightCommandSchemas(),
    trend: getTrendCommandSchemas(),
    'brand-voice': getBrandVoiceCommandSchemas(),
    'social-media': getSocialCommandSchemas(),
  };
}

/**
 * Get command schema for specific agent
 */
export function getAgentCommandSchemas(agentType: string): CommandSchema[] {
  const allSchemas = getAllCommandSchemas();
  return allSchemas[agentType] || [];
}

// Command schema definitions for each agent type
function getLLMCopilotCommandSchemas(): CommandSchema[] {
  return [
    {
      action: 'processMessage',
      description: 'Process natural language input and generate intelligent response',
      parameters: {
        input: { type: 'string', required: true, description: 'Natural language input from user' },
        messageType: {
          type: 'string',
          required: false,
          description: 'Type of message',
          enum: ['query', 'command', 'clarification'],
        },
      },
      returns: {
        type: 'object',
        description: 'Copilot response with intent parsing and suggested actions',
      },
      examples: [
        {
          input: { input: 'Generate a quarterly report' },
          output: {
            intent: 'generate_report',
            confidence: 0.92,
            actions: ['Generate Report', 'Customize'],
          },
          description: 'Parse request for report generation',
        },
      ],
      estimatedDuration: 1500,
    },
  ];
}

function getBoardroomCommandSchemas(): CommandSchema[] {
  return [
    {
      action: 'generateReport',
      description: 'Generate comprehensive boardroom presentation with metrics and forecasts',
      parameters: {
        reportType: {
          type: 'string',
          required: false,
          description: 'Type of report',
          enum: ['QBR', 'MONTHLY', 'ANNUAL'],
          default: 'QBR',
        },
        theme: {
          type: 'string',
          required: false,
          description: 'Presentation theme',
          enum: ['NEON_GLASS', 'EXECUTIVE_DARK'],
          default: 'NEON_GLASS',
        },
        includeForecasts: {
          type: 'boolean',
          required: false,
          description: 'Include forecast slides',
          default: true,
        },
      },
      returns: {
        type: 'object',
        description: 'Generated boardroom report with slides and attachments',
      },
      examples: [
        {
          input: { reportType: 'QBR', theme: 'NEON_GLASS' },
          output: { reportId: 'rpt_123', slides: 12, confidence: 0.94 },
          description: 'Generate quarterly business review',
        },
      ],
      estimatedDuration: 6500,
      budgetImpact: 0,
    },
  ];
}

function getExecutiveCommandSchemas(): CommandSchema[] {
  return [
    {
      action: 'generateReport',
      description: 'Generate executive summary report with key insights',
      parameters: {
        timeframe: { type: 'object', required: false, description: 'Time period for report' },
        sections: { type: 'array', required: false, description: 'Report sections to include' },
      },
      returns: { type: 'object', description: 'Executive report with summarized insights' },
      examples: [
        {
          input: { timeframe: { period: 'month' } },
          output: { reportId: 'exec_456', insights: 8, confidence: 0.89 },
          description: 'Generate monthly executive summary',
        },
      ],
      estimatedDuration: 4000,
    },
  ];
}

function getCampaignCommandSchemas(): CommandSchema[] {
  return [
    {
      action: 'plan_campaign',
      description: 'Plan and strategize a new marketing campaign',
      parameters: {
        campaignType: { type: 'string', required: true, description: 'Type of campaign' },
        budget: { type: 'number', required: false, description: 'Campaign budget in USD' },
        targeting: {
          type: 'object',
          required: false,
          description: 'Audience targeting parameters',
        },
      },
      returns: { type: 'object', description: 'Campaign plan with strategy and timeline' },
      examples: [
        {
          input: { campaignType: 'product_launch', budget: 10000 },
          output: { campaignId: 'camp_789', status: 'planned', timeline: '4 weeks' },
          description: 'Plan product launch campaign',
        },
      ],
      estimatedDuration: 3000,
      budgetImpact: 0,
      permissions: ['campaign_management'],
    },
  ];
}

function getContentCommandSchemas(): CommandSchema[] {
  return [
    {
      action: 'generate_content',
      description: 'Generate marketing content aligned with brand voice',
      parameters: {
        contentType: { type: 'string', required: true, description: 'Type of content to generate' },
        tone: {
          type: 'string',
          required: false,
          description: 'Content tone',
          enum: ['professional', 'casual', 'friendly'],
        },
        length: { type: 'number', required: false, description: 'Target word count' },
      },
      returns: { type: 'object', description: 'Generated content with brand alignment score' },
      examples: [
        {
          input: { contentType: 'blog_post', tone: 'professional', length: 800 },
          output: { content: '...', wordCount: 800, brandAlignment: 0.92 },
          description: 'Generate professional blog post',
        },
      ],
      estimatedDuration: 2500,
    },
  ];
}

function getInsightCommandSchemas(): CommandSchema[] {
  return [
    {
      action: 'analyze_metrics',
      description: 'Analyze performance metrics and generate insights',
      parameters: {
        metrics: { type: 'array', required: true, description: 'List of metrics to analyze' },
        timeframe: { type: 'object', required: false, description: 'Analysis time period' },
      },
      returns: { type: 'object', description: 'Metric analysis with insights and trends' },
      examples: [
        {
          input: { metrics: ['roas', 'conversions', 'ctr'] },
          output: { insights: ['Performance trending upward'], confidence: 0.87 },
          description: 'Analyze key performance metrics',
        },
      ],
      estimatedDuration: 2000,
    },
  ];
}

function getTrendCommandSchemas(): CommandSchema[] {
  return [
    {
      action: 'detect_trends',
      description: 'Detect and analyze market and performance trends',
      parameters: {
        analysisDepth: {
          type: 'string',
          required: false,
          description: 'Depth of analysis',
          enum: ['basic', 'comprehensive'],
          default: 'comprehensive',
        },
      },
      returns: {
        type: 'object',
        description: 'Detected trends with predictions and confidence scores',
      },
      examples: [
        {
          input: { analysisDepth: 'comprehensive' },
          output: {
            trends: ['trending upward'],
            predictions: ['positive outlook'],
            confidence: 0.83,
          },
          description: 'Comprehensive trend analysis',
        },
      ],
      estimatedDuration: 2000,
    },
  ];
}

function getBrandVoiceCommandSchemas(): CommandSchema[] {
  return [
    {
      action: 'analyze_brand_alignment',
      description: 'Analyze content for brand voice alignment and consistency',
      parameters: {
        content: { type: 'string', required: true, description: 'Content to analyze' },
        brandGuidelines: {
          type: 'object',
          required: false,
          description: 'Brand guidelines to check against',
        },
      },
      returns: { type: 'object', description: 'Brand alignment analysis with recommendations' },
      examples: [
        {
          input: { content: 'Marketing message to analyze...' },
          output: { alignmentScore: 0.92, recommendations: ['maintain consistency'] },
          description: 'Analyze brand voice alignment',
        },
      ],
      estimatedDuration: 1500,
    },
  ];
}

function getSocialCommandSchemas(): CommandSchema[] {
  return [
    {
      action: 'generate_social_content',
      description: 'Generate social media content for multiple platforms',
      parameters: {
        platforms: { type: 'array', required: true, description: 'Target social media platforms' },
        contentTheme: { type: 'string', required: false, description: 'Content theme or topic' },
      },
      returns: {
        type: 'object',
        description: 'Generated social media content with engagement predictions',
      },
      examples: [
        {
          input: { platforms: ['instagram', 'twitter'], contentTheme: 'product_launch' },
          output: { posts: ['social post'], analytics: { engagement: 0.8 }, confidence: 0.86 },
          description: 'Generate multi-platform social content',
        },
      ],
      estimatedDuration: 3000,
    },
  ];
}

/**
 * Agent capabilities mapping for frontend (extended)
 */
export const AGENT_CAPABILITIES = {
  content: ['generate_content', 'generate_blog', 'generate_caption', 'generate_post'],
  seo: [
    'optimize_keywords',
    'analyze_content',
    'generate_meta_tags',
    'analyze_competitors',
    'recommend_keywords',
    'generate_schema',
    'audit_technical_seo',
  ],
  ad: ['create_campaign', 'optimize_budget', 'analyze_performance'],
  outreach: ['send_email', 'manage_followup', 'personalize_message'],
  trend: ['detect_trends', 'analyze_engagement', 'predict_viral_content'],
  insight: ['analyze_metrics', 'generate_insights', 'recommend_strategies'],
  design: ['create_visual', 'optimize_design', 'generate_mockup'],
  email: [
    'generate_email_sequence',
    'personalize_email',
    'analyze_performance',
    'create_ab_test',
    'send_campaign',
    'manage_templates',
    'segment_audience',
    'optimize_send_times',
    'generate_subject_lines',
    'create_newsletter',
  ],
  support: [
    'classify_message',
    'generate_reply',
    'analyze_sentiment',
    'escalate_ticket',
    'create_ticket',
    'update_ticket',
    'send_whatsapp_message',
    'auto_respond',
    'manage_knowledge_base',
    'generate_summary',
    'track_satisfaction',
    'manage_queue',
  ],
  'error-sentinel': [
    'continuous_scan',
    'fix_build_errors',
    'fix_type_errors',
    'fix_lint_errors',
    'fix_schema_errors',
    'fix_ci_errors',
    'fix_unhandled_promises',
    'health_check',
    'emergency_recovery',
    'generate_report',
  ],
  campaign: [
    'plan_campaign',
    'execute_campaign',
    'monitor_campaign',
    'optimize_campaign',
    'analyze_results',
    'generate_report',
  ],
  'llm-copilot': [
    'processMessage',
    'getSession',
    'clearSession',
    'parseIntent',
    'generateResponse',
  ],
  boardroom: [
    'generateReport',
    'createForecast',
    'analyzePerformance',
    'generateSlides',
    'exportPresentation',
  ],
  executive: ['generateReport', 'compileSummary', 'analyzeMetrics', 'createDashboard'],
  'brand-voice': [
    'analyze_brand_alignment',
    'check_consistency',
    'generate_guidelines',
    'review_content',
  ],
  'social-media': [
    'generate_social_content',
    'schedule_posts',
    'analyze_engagement',
    'optimize_hashtags',
  ],
} as const;
