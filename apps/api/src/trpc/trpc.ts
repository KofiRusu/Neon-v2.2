import { initTRPC } from '@trpc/server';
import { type Context } from './context';
import superjson from 'superjson';

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

// Future: Add middleware for authentication
// export const protectedProcedure = t.procedure.use(authMiddleware);
