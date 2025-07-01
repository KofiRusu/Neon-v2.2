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
  logs: {
    getAllLogs: {
      query: (input: { 
        agentId?: string
        level?: 'info' | 'warning' | 'error' | 'success' | 'all'
        from?: string
        to?: string
        search?: string
        limit?: number
        offset?: number
      }) => {
        data: {
          logs: Array<{
            id: string
            timestamp: string
            agentId: string
            agentName: string
            level: 'info' | 'warning' | 'error' | 'success'
            message: string
            context?: any
            duration?: number
            taskId?: string
            correlationId?: string
          }>
          total: number
          hasMore: boolean
        }
      }
    }
    getLogDetail: {
      query: (input: { logId: string }) => {
        data: {
          id: string
          timestamp: string
          agentId: string
          agentName: string
          level: 'info' | 'warning' | 'error' | 'success'
          message: string
          context: any
          duration?: number
          taskId?: string
          correlationId?: string
          stackTrace?: string
          metadata: any
        }
      }
    }
    exportLogs: {
      mutate: (input: {
        agentId?: string
        level?: string
        from?: string
        to?: string
        format: 'csv' | 'json'
      }) => {
        data: { downloadUrl: string; filename: string }
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
  logs: {
    getAllLogs: {
      useQuery: (input: { 
        agentId?: string
        level?: string
        from?: string
        to?: string
        search?: string
        limit?: number
        offset?: number
      }) => ({
        data: {
          data: {
            logs: [
              {
                id: 'log-001',
                timestamp: '2024-01-01T12:30:15Z',
                agentId: 'content-agent-1',
                agentName: 'Content Agent',
                level: 'success' as const,
                message: 'Successfully generated 3 blog post drafts for Q1 campaign',
                context: {
                  taskId: 'task-456',
                  posts: ['AI in Marketing', 'Social Media Trends', 'Content Strategy'],
                  wordCount: 4500,
                  timeElapsed: '00:02:34'
                },
                duration: 154000,
                taskId: 'task-456',
                correlationId: 'corr-123'
              },
              {
                id: 'log-002',
                timestamp: '2024-01-01T12:28:42Z',
                agentId: 'seo-agent-1',
                agentName: 'SEO Optimizer',
                level: 'info' as const,
                message: 'Starting keyword analysis for new content batch',
                context: {
                  targetKeywords: ['AI marketing', 'content automation', 'SEO tools'],
                  competitorAnalysis: true,
                  region: 'US'
                },
                duration: 89000,
                taskId: 'task-457',
                correlationId: 'corr-124'
              },
              {
                id: 'log-003',
                timestamp: '2024-01-01T12:25:18Z',
                agentId: 'social-agent-1',
                agentName: 'Social Media Agent',
                level: 'warning' as const,
                message: 'Instagram API rate limit approaching - 15 requests remaining',
                context: {
                  apiEndpoint: '/instagram/posts',
                  remainingRequests: 15,
                  resetTime: '2024-01-01T13:00:00Z',
                  recommendation: 'Delay non-critical posts'
                },
                taskId: 'task-458',
                correlationId: 'corr-125'
              },
              {
                id: 'log-004',
                timestamp: '2024-01-01T12:22:55Z',
                agentId: 'email-agent-1',
                agentName: 'Email Campaign Agent',
                level: 'error' as const,
                message: 'Failed to connect to email service provider',
                context: {
                  provider: 'SendGrid',
                  errorCode: 'AUTH_FAILED',
                  lastAttempt: '2024-01-01T12:22:55Z',
                  retryCount: 3,
                  nextRetry: '2024-01-01T12:25:55Z'
                },
                taskId: 'task-459',
                correlationId: 'corr-126'
              },
              {
                id: 'log-005',
                timestamp: '2024-01-01T12:20:33Z',
                agentId: 'content-agent-1',
                agentName: 'Content Agent',
                level: 'info' as const,
                message: 'Initiating content generation workflow',
                context: {
                  workflow: 'blog-post-generation',
                  templates: ['tech-blog', 'marketing-insight'],
                  targetAudience: 'B2B marketers'
                },
                taskId: 'task-460',
                correlationId: 'corr-127'
              },
              {
                id: 'log-006',
                timestamp: '2024-01-01T12:18:12Z',
                agentId: 'seo-agent-1',
                agentName: 'SEO Optimizer',
                level: 'success' as const,
                message: 'Completed on-page SEO optimization for 5 pages',
                context: {
                  pagesOptimized: [
                    '/blog/ai-marketing-trends',
                    '/blog/content-automation',
                    '/products/seo-tools',
                    '/case-studies/enterprise',
                    '/resources/whitepaper'
                  ],
                  improvementScore: 23,
                  keywordDensity: 'optimal'
                },
                duration: 445000,
                taskId: 'task-461',
                correlationId: 'corr-128'
              },
              {
                id: 'log-007',
                timestamp: '2024-01-01T12:15:44Z',
                agentId: 'social-agent-1',
                agentName: 'Social Media Agent',
                level: 'info' as const,
                message: 'Scheduling 8 social media posts across platforms',
                context: {
                  platforms: ['LinkedIn', 'Twitter', 'Facebook'],
                  postTypes: ['image', 'text', 'link'],
                  scheduledFor: '2024-01-01T15:00:00Z',
                  contentThemes: ['thought-leadership', 'product-update']
                },
                taskId: 'task-462',
                correlationId: 'corr-129'
              },
              {
                id: 'log-008',
                timestamp: '2024-01-01T12:12:27Z',
                agentId: 'email-agent-1',
                agentName: 'Email Campaign Agent',
                level: 'warning' as const,
                message: 'Low email deliverability detected for recent campaigns',
                context: {
                  deliverabilityRate: 0.847,
                  bounceRate: 0.034,
                  spamRate: 0.021,
                  affectedCampaigns: ['newsletter-dec', 'product-launch'],
                  recommendation: 'Review sender reputation'
                },
                taskId: 'task-463',
                correlationId: 'corr-130'
              },
              {
                id: 'log-009',
                timestamp: '2024-01-01T12:08:15Z',
                agentId: 'content-agent-1',
                agentName: 'Content Agent',
                level: 'error' as const,
                message: 'OpenAI API quota exceeded - cannot generate content',
                context: {
                  quotaLimit: 10000,
                  quotaUsed: 10000,
                  resetDate: '2024-01-02T00:00:00Z',
                  fallbackAction: 'use_template_content',
                  affectedTasks: ['task-464', 'task-465']
                },
                taskId: 'task-464',
                correlationId: 'corr-131'
              },
              {
                id: 'log-010',
                timestamp: '2024-01-01T12:05:52Z',
                agentId: 'seo-agent-1',
                agentName: 'SEO Optimizer',
                level: 'success' as const,
                message: 'Generated comprehensive SEO report for website audit',
                context: {
                  pagesAnalyzed: 145,
                  issuesFound: 23,
                  priorityIssues: 5,
                  reportSize: '2.4MB',
                  downloadLink: '/reports/seo-audit-20240101.pdf'
                },
                duration: 1200000,
                taskId: 'task-466',
                correlationId: 'corr-132'
              },
              {
                id: 'log-011',
                timestamp: '2024-01-01T12:02:18Z',
                agentId: 'social-agent-1',
                agentName: 'Social Media Agent',
                level: 'info' as const,
                message: 'Analyzing competitor social media strategies',
                context: {
                  competitors: ['company-a', 'company-b', 'company-c'],
                  platforms: ['LinkedIn', 'Twitter'],
                  analysisType: 'content-frequency',
                  dataPeriod: '30-days'
                },
                taskId: 'task-467',
                correlationId: 'corr-133'
              },
              {
                id: 'log-012',
                timestamp: '2024-01-01T11:58:34Z',
                agentId: 'email-agent-1',
                agentName: 'Email Campaign Agent',
                level: 'success' as const,
                message: 'A/B test completed - variant B shows 18% higher CTR',
                context: {
                  testName: 'newsletter-subject-line',
                  variantA: { subjectLine: 'Monthly Newsletter', ctr: 0.034 },
                  variantB: { subjectLine: 'Your Marketing Update Inside', ctr: 0.041 },
                  improvement: 0.18,
                  confidence: 0.95,
                  recommendation: 'Deploy variant B'
                },
                duration: 86400000,
                taskId: 'task-468',
                correlationId: 'corr-134'
              },
              {
                id: 'log-013',
                timestamp: '2024-01-01T11:55:11Z',
                agentId: 'content-agent-1',
                agentName: 'Content Agent',
                level: 'warning' as const,
                message: 'Content quality score below threshold for generated article',
                context: {
                  articleTitle: 'Future of Marketing Automation',
                  qualityScore: 6.2,
                  threshold: 7.0,
                  issues: ['readability', 'keyword-density', 'structure'],
                  recommendation: 'Manual review required'
                },
                taskId: 'task-469',
                correlationId: 'corr-135'
              },
              {
                id: 'log-014',
                timestamp: '2024-01-01T11:51:47Z',
                agentId: 'seo-agent-1',
                agentName: 'SEO Optimizer',
                level: 'info' as const,
                message: 'Monitoring keyword rankings for target terms',
                context: {
                  keywords: ['AI marketing', 'marketing automation', 'SEO tools'],
                  averagePosition: 8.3,
                  improvements: 2,
                  declines: 1,
                  trackingPeriod: '7-days'
                },
                taskId: 'task-470',
                correlationId: 'corr-136'
              },
              {
                id: 'log-015',
                timestamp: '2024-01-01T11:48:23Z',
                agentId: 'social-agent-1',
                agentName: 'Social Media Agent',
                level: 'success' as const,
                message: 'Generated viral social media post - 1.2K engagements in 2 hours',
                context: {
                  platform: 'LinkedIn',
                  postType: 'thought-leadership',
                  engagements: 1247,
                  likes: 823,
                  comments: 156,
                  shares: 268,
                  reach: 12500,
                  viralityScore: 8.7
                },
                taskId: 'task-471',
                correlationId: 'corr-137'
              }
            ],
            total: 247,
            hasMore: true
          }
        },
        isLoading: false,
        error: null
      })
    },
    getLogDetail: {
      useQuery: (input: { logId: string }) => ({
        data: {
          data: {
            id: input.logId,
            timestamp: '2024-01-01T12:30:15Z',
            agentId: 'content-agent-1',
            agentName: 'Content Agent',
            level: 'success' as const,
            message: 'Successfully generated 3 blog post drafts for Q1 campaign',
            context: {
              taskId: 'task-456',
              posts: ['AI in Marketing', 'Social Media Trends', 'Content Strategy'],
              wordCount: 4500,
              timeElapsed: '00:02:34',
              apiCalls: 12,
              tokensUsed: 3456
            },
            duration: 154000,
            taskId: 'task-456',
            correlationId: 'corr-123',
            stackTrace: null,
            metadata: {
              userId: 'user-123',
              sessionId: 'session-456',
              environment: 'production',
              version: '1.2.3',
              region: 'us-east-1'
            }
          }
        },
        isLoading: false,
        error: null
      })
    },
    exportLogs: {
      useMutation: () => ({
        mutate: (input: any) => {
          console.log('Exporting logs:', input)
          return Promise.resolve({
            data: {
              downloadUrl: `/downloads/logs-export-${Date.now()}.${input.format}`,
              filename: `agent-logs-${new Date().toISOString().split('T')[0]}.${input.format}`
            }
          })
        },
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
