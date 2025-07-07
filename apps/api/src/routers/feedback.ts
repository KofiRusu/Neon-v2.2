import { router, publicProcedure } from "../trpc";
import { z } from "zod";
import { LearningService } from "@neon/core-agents/utils/LearningService";
import { prisma } from "@neon/data-model";

export const feedbackRouter = router({
  submitFeedback: publicProcedure
    .input(z.object({
      campaignId: z.string(),
      contentId: z.string().optional(),
      platform: z.string(),
      metricType: z.enum(["engagement", "conversion", "bounce"]),
      value: z.number(),
      source: z.string().default("manual"),
    }))
    .mutation(async ({ input }) => {
      const feedback = await prisma.campaignFeedback.create({
        data: input,
      });
      return { success: true, feedback };
    }),

  getFeedbackSummary: publicProcedure
    .input(z.object({ campaignId: z.string() }))
    .query(async ({ input }) => {
      const metrics = await prisma.campaignFeedback.findMany({
        where: { campaignId: input.campaignId },
      });
      return metrics;
    }),

  getLearningProfile: publicProcedure
    .input(z.object({ campaignId: z.string() }))
    .query(async ({ input }) => {
      return await LearningService.generateLearningProfile(input.campaignId);
    }),
}); 