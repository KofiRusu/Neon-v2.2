import { z } from 'zod';
import { createTRPCRouter, publicProcedure, protectedProcedure } from '../trpc';
import { type UserRole } from '@neon/data-model';

export const userRouter = createTRPCRouter({
  // Get all users (protected)
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }),

  // Get user by ID
  getById: publicProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    return ctx.db.user.findUnique({
      where: { id: input.id },
      include: {
        campaigns: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });
  }),

  // Create new user
  create: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        role: z.enum(['USER', 'ADMIN', 'SUPER_ADMIN']).default('USER'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.user.create({
        data: {
          email: input.email,
          role: input.role as UserRole,
        },
      });
    }),

  // Update user
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        email: z.string().email().optional(),
        role: z.enum(['USER', 'ADMIN', 'SUPER_ADMIN']).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.user.update({
        where: { id },
        data: data as { email?: string; role?: UserRole },
      });
    }),

  // Delete user
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.user.delete({
        where: { id: input.id },
      });
    }),
});
