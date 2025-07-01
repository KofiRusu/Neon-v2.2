import { createTRPCReact } from '@trpc/react-query'
import { httpBatchLink } from '@trpc/client'
import { QueryClient } from '@tanstack/react-query'

// Define the AppRouter type structure based on the components' usage
export type AppRouter = {
  analytics: {
    getOverview: {
      query: (input: { period: "24h" | "7d" | "30d" | "90d" }) => {
        data: {
          totalRevenue: number
          totalCampaigns: number
          activeAgents: number
          conversionRate: number
          trends: {
            revenue: number
            campaigns: number
            efficiency: number
          }
        }
      }
    }
  }
  campaign: {
    getAll: {
      query: () => { data: Array<{ id: string; name: string; status: string }> }
    }
    getMetrics: {
      query: () => { data: { active: number; completed: number; total: number } }
    }
  }
  agent: {
    getRecentActions: {
      query: () => { data: Array<{ id: string; agent: string; action: string; createdAt: string }> }
    }
    getStatus: {
      query: () => { data: Array<{ id: string; name: string; status: string }> }
    }
  }
  abTesting: {
    getVariants: {
      query: () => { data: Array<{ id: string; name: string; performance: number }> }
    }
  }
}

// Create tRPC React hooks
export const api = createTRPCReact<AppRouter>()

// Create tRPC client
export const trpcClient = api.createClient({
  links: [
    httpBatchLink({
      url: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/trpc',
      headers: () => ({
        authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('token') : ''}`,
      }),
    }),
  ],
})

// Create Query Client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
})

// Mock API for development - provides working data for all components
export const mockApi = {
  analytics: {
    getOverview: {
      useQuery: (input: { period: "24h" | "7d" | "30d" | "90d" }) => ({
        data: {
          data: {
            totalRevenue: 247000,
            totalCampaigns: 18,
            activeAgents: 12,
            conversionRate: 24.8,
            trends: {
              revenue: 23.1,
              campaigns: 12.5,
              efficiency: 15.2
            }
          }
        },
        isLoading: false,
        error: null
      })
    }
  },
  campaign: {
    getAll: {
      useQuery: () => ({
        data: { data: [
          { id: '1', name: 'Q1 Campaign', status: 'active' },
          { id: '2', name: 'Brand Awareness', status: 'completed' }
        ]},
        isLoading: false
      })
    },
    getMetrics: {
      useQuery: () => ({
        data: { data: { active: 8, completed: 10, total: 18 }},
        isLoading: false
      })
    }
  },
  agent: {
    getRecentActions: {
      useQuery: () => ({
        data: { data: [
          { id: '1', agent: 'Content Agent', action: 'Generated social posts', createdAt: '2024-01-01T10:00:00Z' },
          { id: '2', agent: 'SEO Agent', action: 'Optimized keywords', createdAt: '2024-01-01T09:30:00Z' }
        ]},
        isLoading: false
      })
    },
    getStatus: {
      useQuery: () => ({
        data: { data: [
          { id: '1', name: 'Content Agent', status: 'active' },
          { id: '2', name: 'SEO Agent', status: 'active' }
        ]},
        isLoading: false
      })
    }
  },
  abTesting: {
    getVariants: {
      useQuery: () => ({
        data: { data: [
          { id: '1', name: 'Variant A', performance: 85 },
          { id: '2', name: 'Variant B', performance: 92 }
        ]},
        isLoading: false
      })
    }
  }
}

// Use mock API for development, real API for production
export const trpc = process.env.NODE_ENV === 'development' ? mockApi : api
