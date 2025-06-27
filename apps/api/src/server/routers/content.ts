import { ContentAgent } from '@neon/core-agents';
import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';

export const contentRouter = createTRPCRouter({
  generatePost: publicProcedure
    .input(
      z.object({
        type: z.enum(['blog', 'social_post', 'email', 'caption', 'copy']),
        topic: z.string(),
        audience: z.string(),
        tone: z.enum(['professional', 'casual', 'friendly', 'authoritative', 'playful']),
        keywords: z.array(z.string()).optional(),
        platform: z.enum(['email', 'facebook', 'instagram', 'twitter', 'linkedin']).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const contentAgent = new ContentAgent();
      return await contentAgent.generatePost(input);
    }),

  generateBlog: publicProcedure
    .input(
      z.object({
        topic: z.string(),
        audience: z.string(),
        tone: z.enum(['professional', 'casual', 'friendly', 'authoritative', 'playful']),
        keywords: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const contentAgent = new ContentAgent();
      return await contentAgent.generateBlog({
        ...input,
        type: 'blog',
        length: 'long',
      });
    }),

  generateCaption: publicProcedure
    .input(
      z.object({
        topic: z.string(),
        audience: z.string(),
        tone: z.enum(['professional', 'casual', 'friendly', 'authoritative', 'playful']),
        platform: z.enum(['facebook', 'instagram', 'twitter', 'linkedin']).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const contentAgent = new ContentAgent();
      return await contentAgent.generateCaption({
        ...input,
        type: 'caption',
        length: 'short',
      });
    }),
});
