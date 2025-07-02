import { createTRPCNext } from '@trpc/next';
import { httpBatchLink } from '@trpc/client';
import superjson from 'superjson';
// Temporary type for development - replace with actual AppRouter when available
type AppRouter = {
  analytics: {
    getOverview: {
      useQuery: (input: { period: '24h' | '7d' | '30d' | '90d' }) => {
        data: { data: { totalRevenue: number; totalCampaigns: number; activeAgents: number; conversionRate: number; trends: { revenue: number; campaigns: number; efficiency: number } } } | undefined;
        isLoading: boolean;
      };
    };
  };
  campaign: {
    getStats: {
      useQuery: () => {
        data: { data: { active: number; completed: number; total: number } } | undefined;
      };
    };
  };
  agent: {
    getRecentActions: {
      useQuery: (input: { limit: number }) => {
        data: Array<{ id: string; agent: string; action: string; createdAt: string }> | undefined;
      };
    };
  };
  abTesting: {
    getActiveTests: {
      useQuery: () => {
        data: { data: { tests: any[] } } | undefined;
      };
    };
  };
};

const getBaseUrl = (): string => {
  if (typeof window !== 'undefined') return ''; // browser should use relative url
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`; // SSR should use vercel url
  return `http://localhost:${process.env.API_PORT || 3001}`; // dev SSR should use localhost
};

// Mock API for development until backend is fully connected
export const api = {
  analytics: {
    getOverview: {
      useQuery: (input: { period: '24h' | '7d' | '30d' | '90d' }) => ({
        data: {
          data: {
            totalRevenue: 125000,
            totalCampaigns: 24,
            activeAgents: 12,
            conversionRate: 3.4,
            trends: {
              revenue: 15.2,
              campaigns: 8.7,
              efficiency: 12.1,
            },
          },
        },
        isLoading: false,
      }),
    },
  },
  campaign: {
    getStats: {
      useQuery: () => ({
        data: {
          data: {
            active: 12,
            completed: 8,
            total: 20,
          },
        },
      }),
    },
  },
  agent: {
    getRecentActions: {
      useQuery: (input: { limit: number }) => ({
        data: Array.from({ length: Math.min(input.limit, 5) }, (_, i) => ({
          id: `action-${i}`,
          agent: `Agent${i + 1}`,
          action: `Completed task ${i + 1}`,
          createdAt: new Date(Date.now() - i * 60000).toISOString(),
        })),
      }),
    },
  },
  abTesting: {
    getActiveTests: {
      useQuery: () => ({
        data: {
          data: {
            tests: [
              {
                id: '1',
                name: 'Email Subject Line A/B Test',
                status: 'running',
                confidence: 94.2,
                variant_a: { name: 'Control', conversion: 12.4, visitors: 2450 },
                variant_b: { name: 'Variant', conversion: 15.8, visitors: 2380 },
                duration: '5 days remaining'
              }
            ],
          },
        },
      }),
    },
  },
};
