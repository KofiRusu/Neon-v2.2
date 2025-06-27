import { createTRPCRouter } from './trpc';
import { appRouter, fallbackRouter } from './routers/index';

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
// Re-export the consolidated appRouter from routers/index.ts
export { appRouter } from './routers/index';

// export type definition of API
export type AppRouter = typeof appRouter;
