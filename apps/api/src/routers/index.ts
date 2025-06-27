import { createTRPCRouter } from '../trpc';
import { contentRouter } from './content';
import { seoRouter } from './seo';
import { brandVoiceRouter } from './brand-voice';
import { agentRouter } from './agent';
import { trendRouter } from './trend';
import { customerRouter } from './customer';
import { campaignRouter } from './campaign';

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
  trend: trendRouter,
  customer: customerRouter,
  campaign: campaignRouter,
});

// Export type definition of API
export type AppRouter = typeof appRouter;
