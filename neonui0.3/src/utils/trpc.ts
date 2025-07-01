import { createTRPCReact } from '@trpc/react-query'
import { httpBatchLink } from '@trpc/client'
import { QueryClient } from '@tanstack/react-query'

// Enhanced AppRouter type with all agent management endpoints
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
    getCampaignMetrics: {
      query: () => {
        data: {
          performance: Array<{ name: string; value: number; change: number }>
          topPerformers: Array<{ id: string; name: string; revenue: number }>
        }
      }
    }
    getAgentPerformance: {
      query: () => {
        data: Array<{ 
          id: string
          name: string
          performance: number
          tasksCompleted: number
          efficiency: number
        }>
      }
    }
  }
  agent: {
    getAllAgents: {
      query: () => {
        data: Array<{
          id: string
          name: string
          type: string
          status: 'active' | 'inactive' | 'running' | 'error'
          lastRun: string
          tasksCompleted: number
          successRate: number
        }>
      }
    }
    getAgentLogs: {
      query: (input: { agentId: string; limit?: number }) => {
        data: Array<{
          id: string
          timestamp: string
          level: 'info' | 'warning' | 'error' | 'success'
          message: string
          details?: any
        }>
      }
    }
    runAgent: {
      mutate: (input: { agentId: string; config?: any }) => {
        data: { success: boolean; jobId: string; message: string }
      }
    }
    stopAgent: {
      mutate: (input: { agentId: string }) => {
        data: { success: boolean; message: string }
      }
    }
    getRecentActions: {
      query: () => {
        data: Array<{ id: string; agent: string; action: string; createdAt: string }>
      }
    }
    getStatus: {
      query: () => {
        data: Array<{ id: string; name: string; status: string }>
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
  settings: {
    getAll: {
      query: () => {
        data: {
          openaiApiKey: string
          databaseUrl: string
          apiUrl: string
          debugMode: boolean
          maxAgents: number
        }
      }
    }
    update: {
      mutate: (input: {
        openaiApiKey?: string
        databaseUrl?: string
        apiUrl?: string
        debugMode?: boolean
        maxAgents?: number
      }) => {
        data: { success: boolean; message: string }
      }
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
      url: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/trpc',
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

// Enhanced Mock API for development
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
    },
    getCampaignMetrics: {
      useQuery: () => ({
        data: {
          data: {
            performance: [
              { name: 'Email', value: 85, change: 12 },
              { name: 'Social', value: 92, change: 8 },
              { name: 'SEO', value: 78, change: -3 }
            ],
            topPerformers: [
              { id: '1', name: 'Q1 Campaign', revenue: 125000 },
              { id: '2', name: 'Brand Boost', revenue: 98000 }
            ]
          }
        },
        isLoading: false
      })
    },
    getAgentPerformance: {
      useQuery: () => ({
        data: {
          data: [
            { id: '1', name: 'Content Agent', performance: 95, tasksCompleted: 142, efficiency: 92 },
            { id: '2', name: 'SEO Agent', performance: 88, tasksCompleted: 98, efficiency: 85 },
            { id: '3', name: 'Social Agent', performance: 91, tasksCompleted: 156, efficiency: 89 }
          ]
        },
        isLoading: false
      })
    }
  },
  agent: {
    getAllAgents: {
      useQuery: () => ({
        data: {
          data: [
            {
              id: 'content-agent-1',
              name: 'Content Agent',
              type: 'content-generation',
              status: 'active' as const,
              lastRun: '2024-01-01T10:30:00Z',
              tasksCompleted: 142,
              successRate: 95.2
            },
            {
              id: 'seo-agent-1',
              name: 'SEO Optimizer',
              type: 'seo-optimization',
              status: 'running' as const,
              lastRun: '2024-01-01T11:00:00Z',
              tasksCompleted: 98,
              successRate: 88.7
            },
            {
              id: 'social-agent-1',
              name: 'Social Media Agent',
              type: 'social-media',
              status: 'inactive' as const,
              lastRun: '2024-01-01T09:15:00Z',
              tasksCompleted: 156,
              successRate: 91.3
            },
            {
              id: 'email-agent-1',
              name: 'Email Campaign Agent',
              type: 'email-marketing',
              status: 'error' as const,
              lastRun: '2024-01-01T08:45:00Z',
              tasksCompleted: 76,
              successRate: 82.1
            }
          ]
        },
        isLoading: false,
        error: null
      })
    },
    getAgentLogs: {
      useQuery: (input: { agentId: string; limit?: number }) => ({
        data: {
          data: [
            {
              id: '1',
              timestamp: '2024-01-01T11:30:00Z',
              level: 'success' as const,
              message: 'Successfully generated 5 blog posts',
              details: { posts: 5, topics: ['AI', 'Marketing', 'Tech'] }
            },
            {
              id: '2',
              timestamp: '2024-01-01T11:15:00Z',
              level: 'info' as const,
              message: 'Starting content generation task',
              details: { taskId: 'task-123' }
            },
            {
              id: '3',
              timestamp: '2024-01-01T11:00:00Z',
              level: 'warning' as const,
              message: 'Rate limit approaching for OpenAI API',
              details: { remainingCalls: 50 }
            }
          ]
        },
        isLoading: false,
        error: null
      })
    },
    runAgent: {
      useMutation: () => ({
        mutate: (input: { agentId: string; config?: any }) => {
          console.log('Running agent:', input.agentId)
          return Promise.resolve({
            data: {
              success: true,
              jobId: `job-${Date.now()}`,
              message: `Agent ${input.agentId} started successfully`
            }
          })
        },
        isLoading: false
      })
    },
    stopAgent: {
      useMutation: () => ({
        mutate: (input: { agentId: string }) => {
          console.log('Stopping agent:', input.agentId)
          return Promise.resolve({
            data: {
              success: true,
              message: `Agent ${input.agentId} stopped successfully`
            }
          })
        },
        isLoading: false
      })
    },
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
  settings: {
    getAll: {
      useQuery: () => ({
        data: {
          data: {
            openaiApiKey: 'sk-••••••••••••••••••••••••••••••••',
            databaseUrl: 'postgresql://••••••••••••••••••••',
            apiUrl: 'http://localhost:3001',
            debugMode: true,
            maxAgents: 10
          }
        },
        isLoading: false
      })
    },
    update: {
      useMutation: () => ({
        mutate: (input: any) => {
          console.log('Updating settings:', input)
          return Promise.resolve({
            data: {
              success: true,
              message: 'Settings updated successfully'
            }
          })
        },
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
