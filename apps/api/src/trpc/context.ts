import { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import type { Request, Response } from 'express';

export function createContext({ req, res }: CreateExpressContextOptions): {
  req: Request;
  res: Response;
  user: null;
} {
  return {
    req,
    res,
    // Add user context here when authentication is implemented
    user: null,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
