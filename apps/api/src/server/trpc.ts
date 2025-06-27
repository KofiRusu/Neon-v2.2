import { initTRPC } from '@trpc/server';
import { type CreateNextContextOptions } from '@trpc/server/adapters/next';
import superjson from 'superjson';
import { ZodError } from 'zod';
import { db } from '@neon/data-model';

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 * These allow you to access things when processing a request, like the database, the session, etc.
 */

export const createTRPCContext = (
  opts: CreateNextContextOptions
): {
  db: typeof db;
  req: CreateNextContextOptions['req'];
  res: CreateNextContextOptions['res'];
} => {
  const { req, res } = opts;

  return {
    db,
    req,
    res,
  };
};

/**
 * 2. INITIALIZATION
 *
 * This is where the tRPC API is initialized, connecting the context and transformer.
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
 * 3. ROUTER & PROCEDURE HELPERS
 *
 * These are helper functions to create routers and procedures
 */
export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

/**
 * Protected procedure that requires authentication
 * TODO: Add authentication middleware here
 */
export const protectedProcedure = t.procedure;
