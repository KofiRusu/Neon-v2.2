/**
 * Core AI Agents for NeonHub Marketing System
 *
 * This package contains the implementation of all AI agents:
 * - ContentAgent: Generates posts, captions, emails, and product copy
 * - AdAgent: Runs A/B tests, reallocates budgets, optimizes creative
 * - OutreachAgent: Sends personalized B2B emails, manages follow-up chains
 * - TrendAgent: Detects viral content, trending sounds, and global style shifts
 * - InsightAgent: Monitors analytics to propose strategy shifts
 * - DesignAgent: Creates and tests new sign designs based on user inputs and trends
 * - AuditAgent: Quality control and performance monitoring
 */

// Core Agent Exports
export * from './base-agent';

// Memory and Performance Tuning
export * from './memory/AgentMemoryStore';
export * from './tuner/PerformanceTuner';

// Strategy System
export * from './strategy/CampaignStrategyPlanner';
export * from './strategy/strategy-templates';
export * from './strategy/strategy-store';

// Agent Types
export * from './agents/content-agent';
export * from './agents/seo-agent';
export * from './agents/email-agent';
export * from './agents/social-agent';
export * from './agents/whatsapp-agent';
export * from './agents/ad-agent';
export * from './agents/outreach-agent';
export * from './agents/trend-agent';
export * from './agents/insight-agent';
export * from './agents/design-agent';
export * from './agents/brand-voice-agent';
export * from './agents/support-agent';

// Export WhatsAppAgent as CustomerSupportAgent for compatibility
export { WhatsAppAgent as CustomerSupportAgent } from './agents/whatsapp-agent';

// Export Support Agent types for API use
export type {
  MessageClassificationInput,
  MessageClassificationOutput,
  ReplyGenerationInput,
  ReplyGenerationOutput,
  SentimentAnalysisInput,
  SentimentAnalysisOutput,
  EscalationInput,
  EscalationOutput,
  SupportTicket,
  WhatsAppMessage,
} from './agents/support-agent';

// Agent Manager and Factory
export { AgentManager, AgentFactory } from './base-agent';

// Types and Interfaces
export type { AgentPayload, AgentResult, AgentStatus, BaseAgent } from './base-agent';

// Agent Registry
export { registerAllAgents } from './agent-registry';

// Quality Control Agent
export {
  AuditAgent,
  type ContentScore,
  type HallucinationResult,
  type AgentPerformanceData,
} from './auditAgent';

// Export core agent functionality
export * from './agent-registry';
export * from './utils/BaseAgent';
export * from './utils/agentCostEfficiency';
export * from './utils/cost-tracker';
export * from './refinement/SuggestionProcessor';
export * from './refinement/PromptAutoUpdater';

// Export agent types
export type { AgentMetadata, AgentHealth, ExecutionLog } from './types';

// Export mock implementations for missing functions
export const getRegisteredAgentTypes = () => {
  return [
    'CONTENT',
    'AD',
    'SEO',
    'SOCIAL',
    'EMAIL',
    'TREND',
    'INSIGHT',
    'DESIGN',
    'WHATSAPP',
    'SUPPORT',
    'BRAND_VOICE',
    'CAMPAIGN',
    'OUTREACH',
  ];
};

export const executeAgentCommand = async (
  command: string,
  agentType: string,
  parameters?: Record<string, unknown>
) => {
  // Mock implementation - replace with actual agent execution logic
  return {
    success: true,
    result: `Executed ${command} on ${agentType}`,
    metadata: {
      executionTime: Date.now(),
      parameters,
    },
  };
};
