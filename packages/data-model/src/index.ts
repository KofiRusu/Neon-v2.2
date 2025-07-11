// Export Prisma client
export { db } from "./client";

// Export db as prisma for backward compatibility
export { db as prisma } from "./client";

// Re-export Prisma client for direct usage
export { PrismaClient } from "../node_modules/.prisma/client";

// Export all types from the generated Prisma client
export type {
  // Core models
  User,
  Campaign,
  CampaignMetric,
  AIEventLog,
  Agent,
  AgentExecution,
  AgentMemory,
  AgentMetric,
  AgentActionLog,
  AgentActionRule,
  CrossCampaignMemory,
  Analytics,
  ABTest,
  Content,
  Lead,
  B2BLead,
  OutreachHistory,
  Trend,
  TrendSignal,
  RegionScore,
  DesignTemplate,
  EmailCampaign,
  SocialSchedule,
  SupportTicket,
  BrandVoice,
  BrandVoiceAnalysis,
  GoalPlan,
  SharedIntent,
  AgentConsensus,
  PlanExecution,
  ExecutiveInsight,
  ExecutiveReport,
  ExecutiveReportInsight,
  CampaignSummary,
  AgentPerformanceLog,
  BoardroomReport,
  ForecastInsight,
  StrategySlide,
  BillingLog,
  CampaignCost,
  MonthlyBudget,
  CampaignExecutionMetric,
  SentimentAnalysis,
  LeadQualityMetric,
  BudgetPacing,
  LaunchAlert,
  BudgetOptimization,
  CopilotSession,
  CopilotLog,
  CopilotAnalytics,

  // Prisma utility types
  Prisma,
} from "../node_modules/.prisma/client";

// Export all enums from the generated Prisma client
export {
  // User and roles
  UserRole,

  // Campaign related
  CampaignType,
  CampaignStatus,
  Platform,

  // Agent related
  AgentType,
  AgentStatus,
  ExecutionStatus,

  // Analytics and testing
  AnalyticsType,
  ABTestStatus,

  // Content related
  ContentType,
  ContentStatus,

  // Lead management
  LeadStatus,

  // Email campaigns
  EmailCampaignStatus,

  // Social media
  SocialPostStatus,

  // Support system
  SupportPriority,
  SupportStatus,
  SupportChannel,

  // Planning and consensus
  PlanPriority,
  PlanStatus,
  IntentStatus,
  ConsensusResult,

  // Executive reporting
  BoardroomReportType,
  BoardroomTheme,
  ForecastType,
  SlideType,
  InsightType,
  ReportPriority,
  ReportType,
  ReportStatus,

  // Action-related enums
  ActionType,
  ActionPriority,
  ActionStatus,

  // Learning system enums
  LearningTriggerType,
  LearningType,
  AdjustmentType,
  InsightPriority,
  InsightImpact,
  InsightStatus,

  // Chain collaboration enums
  ChainType,
  ChainExecutionMode,
  ChainTriggerType,
  ChainExecutionStatus,
  ChainStepType,
  ChainStepStatus,
  HandoffType,
  ChainCategory,
  ChainComplexity,

  // AgentMetric enums
  MetricTrend,
  PerformanceLevel,
  MetricSource,
} from "../node_modules/.prisma/client";
