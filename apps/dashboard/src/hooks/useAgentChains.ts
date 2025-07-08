import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useCallback, useMemo, useEffect } from "react";
import { trpc } from "@/utils/trpc";
import { useToast } from "./use-toast";

// Types
interface ChainDefinition {
  name: string;
  description?: string;
  chainType:
    | "SEQUENTIAL"
    | "PARALLEL"
    | "CONDITIONAL"
    | "LOOP"
    | "FEEDBACK"
    | "HYBRID";
  executionMode: "SEQUENTIAL" | "PARALLEL" | "ADAPTIVE" | "BATCH";
  steps: ChainStepDefinition[];
  successCriteria: {
    minStepsCompleted?: number;
    requiredSteps?: number[];
    minQualityScore?: number;
    maxErrorRate?: number;
    customConditions?: Record<string, any>;
  };
  maxRetries?: number;
  timeoutMinutes?: number;
  budgetLimit?: number;
}

interface ChainStepDefinition {
  stepNumber: number;
  stepName: string;
  stepType: string;
  agentType:
    | "CONTENT_AGENT"
    | "TREND_AGENT"
    | "SEO_AGENT"
    | "SOCIAL_AGENT"
    | "EMAIL_AGENT"
    | "SUPPORT_AGENT";
  agentConfig?: Record<string, any>;
  dependsOn?: number[];
  conditions?: any[];
  retries?: number;
  timeout?: number;
  inputMapping?: Record<string, string>;
  outputMapping?: Record<string, string>;
}

interface Chain {
  id: string;
  name: string;
  description?: string;
  chainType: string;
  executionMode: string;
  isActive: boolean;
  executionCount: number;
  successCount: number;
  failureCount: number;
  averageExecutionTime: number;
  averageSuccessRate: number;
  recentExecutions: ChainExecution[];
  createdAt: string;
  lastExecuted?: string;
}

interface ChainExecution {
  id: string;
  chainId: string;
  chainName: string;
  chainType: string;
  executionNumber: number;
  status:
    | "PENDING"
    | "RUNNING"
    | "PAUSED"
    | "COMPLETED"
    | "FAILED"
    | "CANCELLED"
    | "TIMEOUT"
    | "RETRYING";
  triggerType: string;
  campaignId?: string;
  startedAt: string;
  completedAt?: string;
  executionTime?: number;
  totalCost: number;
  successRate?: number;
  stepCount: number;
  handoffCount: number;
  steps: any[];
  agentsUsed: string[];
}

interface ChainGoal {
  primary: string;
  secondary?: string[];
  targetMetrics?: Array<{
    name: string;
    target: number;
    operator: "greater_than" | "less_than" | "equals";
  }>;
  constraints?: {
    maxCost?: number;
    maxTime?: number;
    requiredAgents?: string[];
    forbiddenAgents?: string[];
  };
}

interface DynamicChainRequest {
  goal: ChainGoal;
  context?: {
    campaignId?: string;
    industry?: string;
    region?: string;
    language?: string;
  };
  preferences?: {
    preferredAgents?: string[];
    executionMode?: string;
    maxSteps?: number;
    prioritizeSpeed?: boolean;
    prioritizeCost?: boolean;
    prioritizeQuality?: boolean;
  };
}

interface UseAgentChainsOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  enableRealTime?: boolean;
}

export function useAgentChains(options: UseAgentChainsOptions = {}) {
  const {
    autoRefresh = false,
    refreshInterval = 30000,
    enableRealTime = false,
  } = options;

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedChain, setSelectedChain] = useState<Chain | null>(null);
  const [selectedExecution, setSelectedExecution] =
    useState<ChainExecution | null>(null);
  const [filters, setFilters] = useState({
    chainType: "",
    status: "",
    timeRange: "24h",
  });

  // Queries
  const {
    data: chains = [],
    isLoading: chainsLoading,
    error: chainsError,
    refetch: refetchChains,
  } = useQuery({
    queryKey: ["chains", filters],
    queryFn: () =>
      trpc.agentChains.getChains.query({
        chainType: filters.chainType || undefined,
        isActive: true,
        limit: 50,
        offset: 0,
      }),
    refetchInterval: autoRefresh ? refreshInterval : false,
    staleTime: 30000,
  });

  const {
    data: executions = [],
    isLoading: executionsLoading,
    error: executionsError,
    refetch: refetchExecutions,
  } = useQuery({
    queryKey: ["executions", filters],
    queryFn: () =>
      trpc.agentChains.getExecutions.query({
        status: filters.status || undefined,
        limit: 100,
        offset: 0,
      }),
    refetchInterval: autoRefresh ? refreshInterval : false,
    staleTime: 15000,
  });

  const {
    data: templates = [],
    isLoading: templatesLoading,
    error: templatesError,
  } = useQuery({
    queryKey: ["chainTemplates"],
    queryFn: () => trpc.agentChains.getTemplates.query({}),
    staleTime: 300000, // Cache for 5 minutes
  });

  const {
    data: chainStats,
    isLoading: statsLoading,
    error: statsError,
  } = useQuery({
    queryKey: ["chainStats", filters.timeRange],
    queryFn: () =>
      trpc.agentChains.getChainStats.query({
        timeRange: {
          start: new Date(Date.now() - getTimeRangeMs(filters.timeRange)),
          end: new Date(),
        },
      }),
    refetchInterval: autoRefresh ? refreshInterval : false,
    staleTime: 60000,
  });

  // Mutations
  const createChainMutation = useMutation({
    mutationFn: (chainDefinition: ChainDefinition) =>
      trpc.agentChains.createChain.mutate(chainDefinition),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chains"] });
      toast({
        title: "Success",
        description: "Chain created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create chain: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const updateChainMutation = useMutation({
    mutationFn: ({
      chainId,
      updates,
    }: {
      chainId: string;
      updates: Partial<ChainDefinition>;
    }) => trpc.agentChains.updateChain.mutate({ chainId, updates }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chains"] });
      toast({
        title: "Success",
        description: "Chain updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update chain: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const deleteChainMutation = useMutation({
    mutationFn: (chainId: string) =>
      trpc.agentChains.deleteChain.mutate({ chainId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chains"] });
      setSelectedChain(null);
      toast({
        title: "Success",
        description: "Chain deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete chain: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const executeChainMutation = useMutation({
    mutationFn: ({
      chainId,
      context,
    }: {
      chainId: string;
      context: {
        campaignId?: string;
        triggeredBy?: string;
        triggerType:
          | "MANUAL"
          | "SCHEDULED"
          | "EVENT_DRIVEN"
          | "METRIC_BASED"
          | "CAMPAIGN_START"
          | "PERFORMANCE"
          | "API_CALL"
          | "WEBHOOK";
        triggerData?: Record<string, any>;
        environment?: string;
        config?: Record<string, any>;
      };
    }) => trpc.agentChains.executeChain.mutate({ chainId, context }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["executions"] });
      queryClient.invalidateQueries({ queryKey: ["chains"] });
      toast({
        title: "Success",
        description: "Chain execution started",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to execute chain: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const cancelExecutionMutation = useMutation({
    mutationFn: (executionId: string) =>
      trpc.agentChains.cancelExecution.mutate({ executionId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["executions"] });
      toast({
        title: "Success",
        description: "Execution cancelled",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to cancel execution: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const recommendChainMutation = useMutation({
    mutationFn: (request: DynamicChainRequest) =>
      trpc.agentChains.recommendChain.mutate(request),
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to get chain recommendation: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const validateChainMutation = useMutation({
    mutationFn: (chainDefinition: ChainDefinition) =>
      trpc.agentChains.validateChain.mutate(chainDefinition),
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to validate chain: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Utility functions
  const getTimeRangeMs = useCallback((range: string): number => {
    const timeRanges = {
      "1h": 60 * 60 * 1000,
      "24h": 24 * 60 * 60 * 1000,
      "7d": 7 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000,
    };
    return timeRanges[range as keyof typeof timeRanges] || timeRanges["24h"];
  }, []);

  const formatDuration = useCallback((ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }, []);

  const getStatusColor = useCallback((status: string): string => {
    const colors = {
      PENDING: "text-gray-600 bg-gray-100",
      RUNNING: "text-blue-600 bg-blue-100",
      PAUSED: "text-yellow-600 bg-yellow-100",
      COMPLETED: "text-green-600 bg-green-100",
      FAILED: "text-red-600 bg-red-100",
      CANCELLED: "text-gray-600 bg-gray-100",
      TIMEOUT: "text-orange-600 bg-orange-100",
      RETRYING: "text-purple-600 bg-purple-100",
    };
    return colors[status as keyof typeof colors] || "text-gray-600 bg-gray-100";
  }, []);

  const calculateSuccessRate = useCallback(
    (executions: ChainExecution[]): number => {
      if (executions.length === 0) return 0;
      const completed = executions.filter(
        (e) => e.status === "COMPLETED",
      ).length;
      return (completed / executions.length) * 100;
    },
    [],
  );

  const calculateAverageCost = useCallback(
    (executions: ChainExecution[]): number => {
      if (executions.length === 0) return 0;
      const totalCost = executions.reduce((sum, e) => sum + e.totalCost, 0);
      return totalCost / executions.length;
    },
    [],
  );

  const calculateAverageExecutionTime = useCallback(
    (executions: ChainExecution[]): number => {
      const completedExecutions = executions.filter(
        (e) => e.executionTime && e.status === "COMPLETED",
      );
      if (completedExecutions.length === 0) return 0;
      const totalTime = completedExecutions.reduce(
        (sum, e) => sum + (e.executionTime || 0),
        0,
      );
      return totalTime / completedExecutions.length;
    },
    [],
  );

  // Filtered and computed data
  const activeChains = useMemo(
    () => chains.filter((chain) => chain.isActive),
    [chains],
  );

  const runningExecutions = useMemo(
    () =>
      executions.filter(
        (execution) =>
          execution.status === "RUNNING" ||
          execution.status === "PENDING" ||
          execution.status === "RETRYING",
      ),
    [executions],
  );

  const recentExecutions = useMemo(
    () =>
      executions
        .sort(
          (a, b) =>
            new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
        )
        .slice(0, 10),
    [executions],
  );

  const performanceMetrics = useMemo(() => {
    if (executions.length === 0) {
      return {
        totalExecutions: 0,
        successRate: 0,
        averageCost: 0,
        averageExecutionTime: 0,
      };
    }

    return {
      totalExecutions: executions.length,
      successRate: calculateSuccessRate(executions),
      averageCost: calculateAverageCost(executions),
      averageExecutionTime: calculateAverageExecutionTime(executions),
    };
  }, [
    executions,
    calculateSuccessRate,
    calculateAverageCost,
    calculateAverageExecutionTime,
  ]);

  const agentUsageStats = useMemo(() => {
    const agentCounts = new Map<string, number>();

    executions.forEach((execution) => {
      execution.agentsUsed.forEach((agent) => {
        agentCounts.set(agent, (agentCounts.get(agent) || 0) + 1);
      });
    });

    return Array.from(agentCounts.entries())
      .map(([agent, count]) => ({ agent, count }))
      .sort((a, b) => b.count - a.count);
  }, [executions]);

  const chainTypeDistribution = useMemo(() => {
    const typeCounts = new Map<string, number>();

    chains.forEach((chain) => {
      typeCounts.set(
        chain.chainType,
        (typeCounts.get(chain.chainType) || 0) + 1,
      );
    });

    return Array.from(typeCounts.entries()).map(([type, count]) => ({
      type,
      count,
    }));
  }, [chains]);

  // Real-time updates
  useEffect(() => {
    if (!enableRealTime) return;

    const interval = setInterval(() => {
      // Only refetch if there are running executions
      if (runningExecutions.length > 0) {
        refetchExecutions();
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [enableRealTime, runningExecutions.length, refetchExecutions]);

  // Action handlers
  const createChain = useCallback(
    (chainDefinition: ChainDefinition) => {
      return createChainMutation.mutateAsync(chainDefinition);
    },
    [createChainMutation],
  );

  const updateChain = useCallback(
    (chainId: string, updates: Partial<ChainDefinition>) => {
      return updateChainMutation.mutateAsync({ chainId, updates });
    },
    [updateChainMutation],
  );

  const deleteChain = useCallback(
    (chainId: string) => {
      return deleteChainMutation.mutateAsync(chainId);
    },
    [deleteChainMutation],
  );

  const executeChain = useCallback(
    (chainId: string, context: any) => {
      return executeChainMutation.mutateAsync({ chainId, context });
    },
    [executeChainMutation],
  );

  const cancelExecution = useCallback(
    (executionId: string) => {
      return cancelExecutionMutation.mutateAsync(executionId);
    },
    [cancelExecutionMutation],
  );

  const recommendChain = useCallback(
    (request: DynamicChainRequest) => {
      return recommendChainMutation.mutateAsync(request);
    },
    [recommendChainMutation],
  );

  const validateChain = useCallback(
    (chainDefinition: ChainDefinition) => {
      return validateChainMutation.mutateAsync(chainDefinition);
    },
    [validateChainMutation],
  );

  const refreshData = useCallback(() => {
    refetchChains();
    refetchExecutions();
    queryClient.invalidateQueries({ queryKey: ["chainStats"] });
  }, [refetchChains, refetchExecutions, queryClient]);

  const setFilter = useCallback((key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      chainType: "",
      status: "",
      timeRange: "24h",
    });
  }, []);

  // Chain selection helpers
  const selectChain = useCallback((chain: Chain | null) => {
    setSelectedChain(chain);
    setSelectedExecution(null);
  }, []);

  const selectExecution = useCallback((execution: ChainExecution | null) => {
    setSelectedExecution(execution);
  }, []);

  const getChainById = useCallback(
    (chainId: string) => {
      return chains.find((chain) => chain.id === chainId) || null;
    },
    [chains],
  );

  const getExecutionById = useCallback(
    (executionId: string) => {
      return (
        executions.find((execution) => execution.id === executionId) || null
      );
    },
    [executions],
  );

  // Loading and error states
  const isLoading =
    chainsLoading || executionsLoading || templatesLoading || statsLoading;
  const hasError =
    chainsError || executionsError || templatesError || statsError;

  return {
    // Data
    chains,
    executions,
    templates,
    chainStats,
    selectedChain,
    selectedExecution,
    filters,

    // Computed data
    activeChains,
    runningExecutions,
    recentExecutions,
    performanceMetrics,
    agentUsageStats,
    chainTypeDistribution,

    // Loading states
    isLoading,
    hasError,
    chainsLoading,
    executionsLoading,
    templatesLoading,
    statsLoading,

    // Mutation states
    isCreating: createChainMutation.isPending,
    isUpdating: updateChainMutation.isPending,
    isDeleting: deleteChainMutation.isPending,
    isExecuting: executeChainMutation.isPending,
    isCancelling: cancelExecutionMutation.isPending,
    isRecommending: recommendChainMutation.isPending,
    isValidating: validateChainMutation.isPending,

    // Actions
    createChain,
    updateChain,
    deleteChain,
    executeChain,
    cancelExecution,
    recommendChain,
    validateChain,
    refreshData,

    // Selection
    selectChain,
    selectExecution,
    getChainById,
    getExecutionById,

    // Filters
    setFilter,
    clearFilters,

    // Utilities
    formatDuration,
    getStatusColor,
    calculateSuccessRate,
    calculateAverageCost,
    calculateAverageExecutionTime,

    // Mutation results
    lastRecommendation: recommendChainMutation.data,
    lastValidation: validateChainMutation.data,
  };
}

// Specialized hooks for specific use cases
export function useChainExecution(executionId: string) {
  const {
    data: execution,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["execution", executionId],
    queryFn: () => trpc.agentChains.getExecution.query({ executionId }),
    enabled: !!executionId,
    refetchInterval: 5000, // Real-time updates for active executions
    staleTime: 0,
  });

  return {
    execution,
    isLoading,
    error,
    refetch,
    isRunning:
      execution?.status === "RUNNING" || execution?.status === "PENDING",
  };
}

export function useChainPerformance(
  chainId?: string,
  timeRange?: { start: Date; end: Date },
) {
  const {
    data: metrics,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["chainPerformance", chainId, timeRange],
    queryFn: () =>
      trpc.agentChains.getPerformanceMetrics.query({
        chainId,
        timeRange,
      }),
    enabled: !!chainId,
    staleTime: 60000,
  });

  const {
    data: heatmap,
    isLoading: heatmapLoading,
    error: heatmapError,
  } = useQuery({
    queryKey: [
      "performanceHeatmap",
      chainId ? [chainId] : undefined,
      timeRange,
    ],
    queryFn: () =>
      trpc.agentChains.getPerformanceHeatmap.query({
        chainIds: chainId ? [chainId] : undefined,
        timeRange,
      }),
    staleTime: 120000,
  });

  const {
    data: bottlenecks,
    isLoading: bottlenecksLoading,
    error: bottlenecksError,
  } = useQuery({
    queryKey: ["bottlenecks", chainId],
    queryFn: () =>
      trpc.agentChains.detectBottlenecks.query({
        executionId: "", // This would need the latest execution ID
      }),
    enabled: false, // Manual trigger
    staleTime: 300000,
  });

  return {
    metrics,
    heatmap,
    bottlenecks,
    isLoading: isLoading || heatmapLoading,
    hasError: error || heatmapError || bottlenecksError,
    refetch,
  };
}

export function useChainTemplates() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    data: templates = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["chainTemplates"],
    queryFn: () => trpc.agentChains.getTemplates.query({}),
    staleTime: 600000, // Cache for 10 minutes
  });

  const createTemplateMutation = useMutation({
    mutationFn: (templateData: {
      name: string;
      description: string;
      category: any;
      definition: ChainDefinition;
    }) => trpc.agentChains.createTemplate.mutate(templateData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chainTemplates"] });
      toast({
        title: "Success",
        description: "Template created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create template: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const createTemplate = useCallback(
    (templateData: any) => {
      return createTemplateMutation.mutateAsync(templateData);
    },
    [createTemplateMutation],
  );

  return {
    templates,
    isLoading,
    error,
    createTemplate,
    isCreating: createTemplateMutation.isPending,
  };
}

export default useAgentChains;
