import { createTRPCRouter, publicProcedure } from "../trpc";
import { agentMemoryRouter } from "./agent-memory";
import { contentRouter } from "./content";
import { emailRouter } from "./email";
import { metricsRouter } from "./metrics";
import { seoRouter } from "./seo";
import { socialRouter } from "./social";
import { supportRouter } from "./support";
import { userRouter } from "./user";
import { brandVoiceRouter } from "./brand-voice";
import { outreachRouter } from "./outreach";
import { strategyRouter } from "./strategy";
import { abTestingRouter } from "./ab-testing";
import { insightsRouter } from "./insights";
import { analyticsRouter } from "./analytics";
import { coordinationRouter } from "./coordination";
import { executiveRouter } from "./executive";
import { copilotRouter } from "./copilot";
import { boardroomRouter } from "./boardroom";
import { billingRouter } from "./billing";
import { launchIntelligenceRouter } from "./launch-intelligence";
import { z } from "zod";

// Import enhanced routers from /routers directory
import { agentRouter } from "../../routers/agent";
import { campaignRouter } from "../../routers/campaign";
import { customerRouter } from "../../routers/customer";
import { trendRouter } from "../../routers/trend";
import { personalizationRouter } from "../../routers/personalization";

// Assets router for asset management functionality
const assetsRouter = createTRPCRouter({
  getAssets: publicProcedure
    .input(
      z.object({
        type: z.string().optional(),
        status: z.string().optional(),
        category: z.string().optional(),
        search: z.string().optional(),
        limit: z.number().default(50),
      }),
    )
    .query(async ({ input }) => {
      // Mock asset data - replace with actual database queries
      const mockAssets = Array.from({ length: input.limit }, (_, i) => ({
        id: `asset-${i + 1}`,
        name: `Asset ${i + 1}`,
        type: ["IMAGE", "VIDEO", "AUDIO", "TEXT", "DESIGN"][i % 5],
        category: ["marketing", "social", "blog", "ads"][i % 4],
        description: `AI-generated asset for marketing campaigns`,
        thumbnail: `https://picsum.photos/300/200?random=${i}`,
        tags: ["ai-generated", "marketing", "campaign"],
        status: ["DRAFT", "PENDING", "APPROVED", "REJECTED"][i % 4],
        usage: Math.floor(Math.random() * 100),
        rating: Math.floor(Math.random() * 5) + 1,
        remixCount: Math.floor(Math.random() * 20),
        createdAt: new Date(Date.now() - i * 86400000),
        updatedAt: new Date(Date.now() - i * 43200000),
        parent: null,
        versions: [],
        approvals: [],
        _count: { versions: 0, approvals: 0 },
      }));

      return {
        assets: mockAssets,
        totalCount: mockAssets.length,
        hasMore: false,
      };
    }),

  getAssetStats: publicProcedure
    .input(
      z.object({
        timeRange: z.string().default("30d"),
        type: z.string().optional(),
      }),
    )
    .query(async ({ input }) => {
      return {
        totalAssets: 1247,
        totalUsage: 45892,
        totalApproved: 987,
        totalRemixes: 234,
        recentUploads: 23,
        popularCategories: [
          { name: "Marketing", count: 456 },
          { name: "Social Media", count: 324 },
          { name: "Blog Content", count: 289 },
          { name: "Advertisements", count: 178 },
        ],
      };
    }),
});

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  // Core enhanced routers (comprehensive implementations)
  agent: agentRouter,
  campaign: campaignRouter,
  customer: customerRouter,
  trend: trendRouter,
  personalization: personalizationRouter,

  // Supporting routers
  agentMemory: agentMemoryRouter,
  brandVoice: brandVoiceRouter,
  content: contentRouter,
  email: emailRouter,
  metrics: metricsRouter,
  seo: seoRouter,
  social: socialRouter,
  support: supportRouter,
  user: userRouter,
  outreach: outreachRouter,
  strategy: strategyRouter,
  abTesting: abTestingRouter,
  insights: insightsRouter,
  analytics: analyticsRouter,
  coordination: coordinationRouter,
  executive: executiveRouter,
  copilot: copilotRouter,
  boardroom: boardroomRouter,
  billing: billingRouter,
  launchIntelligence: launchIntelligenceRouter,
  assets: assetsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

export const fallbackRouter = createTRPCRouter({
  health: publicProcedure.query(() => {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      message: "NeonHub API is running",
    };
  }),

  // Fallback procedures for missing routers
  campaign: createTRPCRouter({
    getStats: publicProcedure.query(() => {
      return {
        active: 12,
        completed: 8,
        total: 20,
      };
    }),
  }),

  agent: createTRPCRouter({
    getRecentActions: publicProcedure
      .input(z.object({ limit: z.number().default(5) }))
      .query(({ input }) => {
        return Array.from({ length: input.limit }, (_, i) => ({
          id: `action-${i}`,
          agent: `Agent${i + 1}`,
          action: `Completed task ${i + 1}`,
          createdAt: new Date(Date.now() - i * 60000).toISOString(),
        }));
      }),
  }),
});
