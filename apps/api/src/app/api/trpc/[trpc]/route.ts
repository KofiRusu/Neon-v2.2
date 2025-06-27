import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { type NextRequest } from 'next/server';

import { appRouter } from '~/server/root';
import { createTRPCContext } from '~/server/trpc';
import { logger } from '@neon/utils';

const handler = (req: NextRequest): Promise<Response> =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => createTRPCContext({ req: req as any, res: {} as any }),
    onError: ({ path, error }): void => {
      if (process.env.NODE_ENV === 'development') {
        logger.error(`❌ tRPC failed on ${path ?? '<no-path>'}: ${error.message}`);
      }
    },
  });

export { handler as GET, handler as POST };
