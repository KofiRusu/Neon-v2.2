'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { trpc } from '@/utils/trpc';

// Types
export interface AgentActionLog {
  id: string;
  agentName: string;
  agentType: string;
  actionType: string;
  campaignId?: string;
  metricId?: string;
  triggerValue: number;
  threshold?: number;
  condition: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'ROLLBACK_PENDING' | 'ROLLBACK_COMPLETED' | 'ROLLBACK_FAILED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'EMERGENCY';
  executedAt: string;
  completedAt?: string;
  retryCount: number;
  maxRetries: number;
  notes?: string;
  errorMessage?: string;
  metadata?: Record<string, any>;
  impactMetrics?: Record<string, any>;
  rollbackData?: any;
  campaign?: {
    id: string;
    name: string;
    type: string;
    status: string;
    budget?: number;
    startDate?: string;
    endDate?: string;
  };
  metric?: {
    id: string;
    metricType: string;
    metricSubtype?: string;
    value: number;
    previousValue?: number;
    timestamp: string;
    performance?: string;
  };
  dependentActions?: Array<{
    id: string;
    actionType: string;
    status: string;
    executedAt: string;
  }>;
  parentAction?: {
    id: string;
    actionType: string;
    status: string;
    executedAt: string;
  };
}

export interface AgentActionRule {
  id: string;
  name: string;
  description?: string;
  agentType: string;
  actionType: string;
  metricType: string;
  metricSubtype?: string;
  category?: string;
  condition: string;
  threshold: number;
  timeWindow?: number;
  consecutiveCount?: number;
  cooldownPeriod?: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'EMERGENCY';
  maxRetries: number;
  enabled: boolean;
  campaignIds: string[];
  regions: string[];
  platforms: string[];
  actionConfig: Record<string, any>;
  fallbackAction?: string;
  fallbackConfig?: Record<string, any>;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  lastTriggered?: string;
  triggerCount: number;
}

export interface ActionStats {
  totalActions: number;
  successful: number;
  failed: number;
  pending: number;
  successRate: number;
  failureRate: number;
  avgExecutionTime: number;
  avgRetryCount: number;
  groupedStats?: Record<string, any>;
  recentActivity: {
    last24Hours: number;
    lastHour: number;
  };
}

export interface ActionRunnerStatus {
  isRunning: boolean;
  autoRunEnabled: boolean;
  runInterval: number;
  activeActions: number;
  config: {
    runInterval?: number;
    maxConcurrentActions?: number;
    enableAutoRun?: boolean;
    retryConfig?: {
      maxRetries: number;
      retryDelay: number;
      backoffMultiplier: number;
    };
    alertConfig?: {
      webhookUrl?: string;
      emailRecipients?: string[];
      slackChannel?: string;
    };
  };
  lastRun?: { executedAt: string };
}

export interface TriggerActionParams {
  agentType: string;
  actionType: string;
  campaignId?: string;
  actionConfig: Record<string, any>;
  reason?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'EMERGENCY';
}

export interface CreateActionRuleParams {
  name: string;
  description?: string;
  agentType: string;
  actionType: string;
  metricType: string;
  metricSubtype?: string;
  category?: string;
  condition: 'greater_than' | 'less_than' | 'equals' | 'change_percent';
  threshold: number;
  timeWindow?: number;
  consecutiveCount?: number;
  cooldownPeriod?: number;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'EMERGENCY';
  maxRetries?: number;
  enabled?: boolean;
  campaignIds?: string[];
  regions?: string[];
  platforms?: string[];
  actionConfig?: Record<string, any>;
  fallbackAction?: string;
  fallbackConfig?: Record<string, any>;
}

export interface UseAgentActionsOptions {
  autoRefresh?: boolean;
  refreshInterval?: number; // milliseconds
  enablePolling?: boolean;
  pollingInterval?: number; // milliseconds
  enableRealTime?: boolean;
  cacheTime?: number; // milliseconds
  staleTime?: number; // milliseconds
}

export interface UseAgentActionsFilters {
  agentType?: string;
  actionType?: string;
  campaignId?: string;
  status?: string;
  priority?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
  groupBy?: 'agent' | 'action' | 'campaign' | 'priority';
}

export function useAgentActions(
  filters: UseAgentActionsFilters = {},
  options: UseAgentActionsOptions = {}
) {
  const queryClient = useQueryClient();
  
  const {
    autoRefresh = true,
    refreshInterval = 30000,
    enablePolling = false,
    pollingInterval = 10000,
    enableRealTime = true,
    cacheTime = 5 * 60 * 1000, // 5 minutes
    staleTime = 1 * 60 * 1000   // 1 minute
  } = options;

  // State for real-time features
  const [newActionsCount, setNewActionsCount] = useState(0);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [isRealTimeActive, setIsRealTimeActive] = useState(enableRealTime);

  // Query configurations
  const queryConfig = useMemo(() => ({
    staleTime,
    cacheTime,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    ...(enablePolling && {
      refetchInterval: pollingInterval,
      refetchIntervalInBackground: false
    })
  }), [staleTime, cacheTime, enablePolling, pollingInterval]);

  // Fetch action logs
  const {
    data: actionLogsData,
    isLoading: actionLogsLoading,
    error: actionLogsError,
    refetch: refetchActionLogs,
    isFetching: actionLogsFetching
  } = trpc.agentActions.getActionLogs.useQuery(
    filters,
    {
      ...queryConfig,
      onSuccess: (data) => {
        // Check for new actions
        if (isRealTimeActive) {
          const cachedData = queryClient.getQueryData(['agentActions.getActionLogs', filters]);
          if (cachedData && Array.isArray(cachedData.logs)) {
            const newActions = data.logs.filter(log => 
              !cachedData.logs.some((cachedLog: any) => cachedLog.id === log.id)
            );
            
            if (newActions.length > 0) {
              setNewActionsCount(prev => prev + newActions.length);
            }
          }
        }
        
        setLastRefresh(new Date());
      }
    }
  );

  // Fetch action stats
  const {
    data: actionStats,
    isLoading: actionStatsLoading,
    error: actionStatsError,
    refetch: refetchActionStats
  } = trpc.agentActions.getActionStats.useQuery(
    {
      agentType: filters.agentType,
      actionType: filters.actionType,
      startDate: filters.startDate,
      endDate: filters.endDate,
      groupBy: filters.groupBy
    },
    queryConfig
  );

  // Fetch action rules
  const {
    data: actionRulesData,
    isLoading: actionRulesLoading,
    error: actionRulesError,
    refetch: refetchActionRules
  } = trpc.agentActions.getActionRules.useQuery(
    {
      agentType: filters.agentType,
      actionType: filters.actionType,
      enabled: true,
      limit: filters.limit || 50,
      offset: filters.offset || 0
    },
    queryConfig
  );

  // Fetch runner status
  const {
    data: runnerStatus,
    isLoading: runnerStatusLoading,
    error: runnerStatusError,
    refetch: refetchRunnerStatus
  } = trpc.agentActions.getActionRunnerStatus.useQuery(
    undefined,
    queryConfig
  );

  // Fetch triggered actions summary
  const {
    data: triggeredSummary,
    isLoading: triggeredSummaryLoading,
    error: triggeredSummaryError,
    refetch: refetchTriggeredSummary
  } = trpc.agentActions.getTriggeredActionsSummary.useQuery(
    {
      timeRange: '24h',
      agentType: filters.agentType
    },
    queryConfig
  );

  // Mutations
  const triggerActionMutation = trpc.agentActions.triggerAction.useMutation({
    onSuccess: () => {
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries(['agentActions.getActionLogs']);
      queryClient.invalidateQueries(['agentActions.getActionStats']);
      queryClient.invalidateQueries(['agentActions.getTriggeredActionsSummary']);
    }
  });

  const runActionChecksMutation = trpc.agentActions.runActionChecks.useMutation({
    onSuccess: () => {
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries(['agentActions.getActionLogs']);
      queryClient.invalidateQueries(['agentActions.getActionStats']);
      queryClient.invalidateQueries(['agentActions.getTriggeredActionsSummary']);
      queryClient.invalidateQueries(['agentActions.getActionRunnerStatus']);
    }
  });

  const createActionRuleMutation = trpc.agentActions.createActionRule.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries(['agentActions.getActionRules']);
    }
  });

  const updateActionRuleMutation = trpc.agentActions.updateActionRule.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries(['agentActions.getActionRules']);
    }
  });

  const deleteActionRuleMutation = trpc.agentActions.deleteActionRule.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries(['agentActions.getActionRules']);
    }
  });

  // Manual refresh function
  const refresh = useCallback(async () => {
    await Promise.all([
      refetchActionLogs(),
      refetchActionStats(),
      refetchActionRules(),
      refetchRunnerStatus(),
      refetchTriggeredSummary()
    ]);
    setLastRefresh(new Date());
  }, [
    refetchActionLogs,
    refetchActionStats,
    refetchActionRules,
    refetchRunnerStatus,
    refetchTriggeredSummary
  ]);

  // Action functions
  const triggerAction = useCallback(async (params: TriggerActionParams) => {
    return await triggerActionMutation.mutateAsync(params);
  }, [triggerActionMutation]);

  const runActionChecks = useCallback(async () => {
    return await runActionChecksMutation.mutateAsync({});
  }, [runActionChecksMutation]);

  const createActionRule = useCallback(async (params: CreateActionRuleParams) => {
    return await createActionRuleMutation.mutateAsync(params);
  }, [createActionRuleMutation]);

  const updateActionRule = useCallback(async (id: string, params: Partial<CreateActionRuleParams>) => {
    return await updateActionRuleMutation.mutateAsync({ id, ...params });
  }, [updateActionRuleMutation]);

  const deleteActionRule = useCallback(async (id: string) => {
    return await deleteActionRuleMutation.mutateAsync({ id });
  }, [deleteActionRuleMutation]);

  // Get action by ID
  const getActionById = useCallback((id: string) => {
    return actionLogsData?.logs.find(log => log.id === id);
  }, [actionLogsData?.logs]);

  // Filter functions
  const filterActionsByStatus = useCallback((status: string) => {
    return actionLogsData?.logs.filter(log => log.status === status) || [];
  }, [actionLogsData?.logs]);

  const filterActionsByAgent = useCallback((agentType: string) => {
    return actionLogsData?.logs.filter(log => log.agentType === agentType) || [];
  }, [actionLogsData?.logs]);

  const filterActionsByPriority = useCallback((priority: string) => {
    return actionLogsData?.logs.filter(log => log.priority === priority) || [];
  }, [actionLogsData?.logs]);

  const getCriticalActions = useCallback(() => {
    return actionLogsData?.logs.filter(log => 
      log.priority === 'CRITICAL' || log.priority === 'EMERGENCY'
    ) || [];
  }, [actionLogsData?.logs]);

  const getRecentActions = useCallback((hours = 1) => {
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - hours);
    
    return actionLogsData?.logs.filter(log => 
      new Date(log.executedAt) >= cutoff
    ) || [];
  }, [actionLogsData?.logs]);

  // Analytics functions
  const getActionSuccessRate = useCallback(() => {
    if (!actionLogsData?.logs.length) return 0;
    
    const successful = actionLogsData.logs.filter(log => log.status === 'COMPLETED').length;
    return (successful / actionLogsData.logs.length) * 100;
  }, [actionLogsData?.logs]);

  const getAverageExecutionTime = useCallback(() => {
    if (!actionLogsData?.logs.length) return 0;
    
    const completedActions = actionLogsData.logs.filter(log => 
      log.status === 'COMPLETED' && log.completedAt
    );
    
    if (completedActions.length === 0) return 0;
    
    const totalTime = completedActions.reduce((acc, log) => {
      const executionTime = new Date(log.completedAt!).getTime() - new Date(log.executedAt).getTime();
      return acc + executionTime;
    }, 0);
    
    return totalTime / completedActions.length;
  }, [actionLogsData?.logs]);

  const getActionTrends = useCallback(() => {
    if (!actionLogsData?.logs.length) return { trend: 'stable', change: 0 };
    
    const now = new Date();
    const midPoint = new Date(now.getTime() - 12 * 60 * 60 * 1000); // 12 hours ago
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago
    
    const firstHalf = actionLogsData.logs.filter(log => {
      const actionDate = new Date(log.executedAt);
      return actionDate >= dayAgo && actionDate < midPoint;
    }).length;
    
    const secondHalf = actionLogsData.logs.filter(log => {
      const actionDate = new Date(log.executedAt);
      return actionDate >= midPoint;
    }).length;
    
    if (firstHalf === 0) {
      return { trend: secondHalf > 0 ? 'increasing' : 'stable', change: secondHalf };
    }
    
    const change = ((secondHalf - firstHalf) / firstHalf) * 100;
    const trend = change > 10 ? 'increasing' : change < -10 ? 'decreasing' : 'stable';
    
    return { trend, change };
  }, [actionLogsData?.logs]);

  // Real-time functions
  const resetNewActionsCount = useCallback(() => {
    setNewActionsCount(0);
  }, []);

  const toggleRealTime = useCallback(() => {
    setIsRealTimeActive(prev => !prev);
  }, []);

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh && isRealTimeActive) {
      const interval = setInterval(refresh, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, isRealTimeActive, refreshInterval, refresh]);

  // Loading states
  const isLoading = actionLogsLoading || actionStatsLoading || actionRulesLoading || runnerStatusLoading;
  const isFetching = actionLogsFetching;

  // Error states
  const error = actionLogsError || actionStatsError || actionRulesError || runnerStatusError;

  // Mutation states
  const isTriggering = triggerActionMutation.isLoading;
  const isRunningChecks = runActionChecksMutation.isLoading;
  const isCreatingRule = createActionRuleMutation.isLoading;
  const isUpdatingRule = updateActionRuleMutation.isLoading;
  const isDeletingRule = deleteActionRuleMutation.isLoading;

  return {
    // Data
    actionLogs: actionLogsData?.logs || [],
    actionStats,
    actionRules: actionRulesData?.rules || [],
    runnerStatus,
    triggeredSummary,
    
    // Pagination
    totalActions: actionLogsData?.totalCount || 0,
    hasMore: actionLogsData?.hasMore || false,
    nextOffset: actionLogsData?.nextOffset,
    
    // Loading states
    isLoading,
    isFetching,
    isTriggering,
    isRunningChecks,
    isCreatingRule,
    isUpdatingRule,
    isDeletingRule,
    
    // Error states
    error,
    
    // Real-time features
    newActionsCount,
    lastRefresh,
    isRealTimeActive,
    
    // Actions
    triggerAction,
    runActionChecks,
    createActionRule,
    updateActionRule,
    deleteActionRule,
    refresh,
    
    // Utilities
    getActionById,
    filterActionsByStatus,
    filterActionsByAgent,
    filterActionsByPriority,
    getCriticalActions,
    getRecentActions,
    
    // Analytics
    getActionSuccessRate,
    getAverageExecutionTime,
    getActionTrends,
    
    // Real-time controls
    resetNewActionsCount,
    toggleRealTime
  };
}

// Specialized hooks for specific use cases

export function useActionLogs(filters: UseAgentActionsFilters = {}) {
  const { actionLogs, isLoading, error, refresh } = useAgentActions(filters);
  return { actionLogs, isLoading, error, refresh };
}

export function useActionStats(filters: Pick<UseAgentActionsFilters, 'agentType' | 'actionType' | 'startDate' | 'endDate' | 'groupBy'> = {}) {
  const { actionStats, isLoading, error, refresh } = useAgentActions(filters);
  return { actionStats, isLoading, error, refresh };
}

export function useActionRules(filters: Pick<UseAgentActionsFilters, 'agentType' | 'actionType'> = {}) {
  const { actionRules, isLoading, error, refresh, createActionRule, updateActionRule, deleteActionRule } = useAgentActions(filters);
  return { 
    actionRules, 
    isLoading, 
    error, 
    refresh, 
    createActionRule, 
    updateActionRule, 
    deleteActionRule 
  };
}

export function useRunnerStatus() {
  const { runnerStatus, isLoading, error, refresh, runActionChecks } = useAgentActions();
  return { runnerStatus, isLoading, error, refresh, runActionChecks };
}

export function useCriticalActions() {
  const { getCriticalActions, newActionsCount, resetNewActionsCount, isRealTimeActive } = useAgentActions();
  return { 
    criticalActions: getCriticalActions(), 
    newActionsCount, 
    resetNewActionsCount, 
    isRealTimeActive 
  };
}

export default useAgentActions; 