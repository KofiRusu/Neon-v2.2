import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import { QueryClient } from "@tanstack/react-query";
import superjson from "superjson";
import type { AppRouter } from "@/lib/api/root";

const getBaseUrl = (): string => {
  if (typeof window !== "undefined") return ""; // browser should use relative url
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`; // SSR should use vercel url
  return `http://localhost:${process.env.API_PORT || 3000}`; // dev SSR should use localhost
};

// Create Query Client for standalone usage
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

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

// Export the main trpc client
export const trpc = api;

// Export type helpers
export type RouterInputs = import("@/lib/api/root").RouterInputs;
export type RouterOutputs = import("@/lib/api/root").RouterOutputs;
