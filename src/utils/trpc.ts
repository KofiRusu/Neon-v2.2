import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "@/lib/api/root";

const getBaseUrl = (): string => {
  if (typeof window !== "undefined") return ""; // browser should use relative url
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`; // SSR should use vercel url
  return `http://localhost:${process.env.API_PORT || 3000}`; // dev SSR should use localhost
};

// Create tRPC React client
export const api = createTRPCReact<AppRouter>();

// Export the tRPC client configuration
export const trpcConfig = {
  links: [
    httpBatchLink({
      url: `${getBaseUrl()}/api/trpc`,
      fetch(url, options) {
        return fetch(url, {
          ...options,
          credentials: "include",
        });
      },
    }),
  ],
  transformer: superjson,
};

// Export type helpers for convenience
export type RouterInputs = import("@/lib/api/root").RouterInputs;
export type RouterOutputs = import("@/lib/api/root").RouterOutputs; 