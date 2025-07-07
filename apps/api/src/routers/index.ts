import { createTRPCRouter } from "../trpc";
import { contentRouter } from "./content";
import { seoRouter } from "./seo";
import { brandVoiceRouter } from "./brand-voice";
import { agentRouter } from "./agent";
import { agentsRouter } from "../trpc/agents";
import { trendRouter } from "./trend";
import { customerRouter } from "./customer";
import { campaignRouter } from "./campaign";
import { schedulerRouter } from "./scheduler";
import { analyticsRouter } from "./analytics";
import { agentActionsRouter } from './agent-actions';
import { learningRouter } from './learning';
import { agentChainsRouter } from './agent-chains';

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  content: contentRouter,
  seo: seoRouter,
  brandVoice: brandVoiceRouter,
  agent: agentRouter,
  agents: agentsRouter,
  trend: trendRouter,
  customer: customerRouter,
  campaign: campaignRouter,
  scheduler: schedulerRouter,
  analytics: analyticsRouter,
  agentActions: agentActionsRouter,
  learning: learningRouter,
  agentChains: agentChainsRouter,
});

// Export type definition of API
export type AppRouter = typeof appRouter;

export { default as analytics } from './analytics';
export { default as agentActions } from './agent-actions';
export { default as agentChains } from './agent-chains';
