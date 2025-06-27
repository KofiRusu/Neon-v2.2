import { initTRPC } from '@trpc/server';
import { createNextApiHandler } from '@trpc/server/adapters/next';
import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@neon/data-model';

export interface Context {
  req: NextApiRequest;
  res: NextApiResponse;
  db: typeof db;
}

export const createContext = ({
  req,
  res,
}: {
  req: NextApiRequest;
  res: NextApiResponse;
}): Context => {
  return {
    req,
    res,
    db,
  };
};

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;
