import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trpc } from '@/utils/trpc';
import { toast } from 'sonner';

// Type definitions
export interface LearningInsight {
  id: string;
  agentType: string;
  metricType: string;
  metricSubtype?: string;
  category?: string;
  insightType: string;
  title: string;
  description: string;
  recommendation: string;
  confidence: number;
  priority: string;
  impact: string;
  supportingData: Record<string, any>;
  evidenceCount: number;
  sampleSize: number;
  predictedImprovement?: number;
  actualImprovement?: number;
  status: string;
  implementedAt?: string;
  validatedAt?: string;
  archivedAt?: string;
  suggestedActions: string[];
  userFeedback?: string;
  userRating?: number;
  dismissed: boolean;
  dismissedReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MetricWeight {
  id: string;
  agentType: string;
  metricType: string;
  metricSubtype?: string;
  category?: string;
  weight: number;
  baselineWeight: number;
  threshold?: number;
  baselineThreshold?: number;
  confidence: number;
  reliability: number;
  sampleSize: number;
  performanceScore: number;
  successRate: number;
  adjustmentCount: number;
  lastAdjustment?: string;
  totalImprovement: number;
  isActive: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface LearningLog {
  id: string;
  agentType: string;
  metricType: string;
  metricSubtype?: string;
  category?: string;
  triggerType: string;
  learningType: string;
  adjustmentType: string;
  previousValue: number;
  newValue: number;
  confidence: number;
  sampleSize: number;
  expectedImprovement?: number;
  actualImprovement?: number;
  validated: boolean;
  rolledBack: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LearningStats {
  timeRange: string;
  summary: {
    totalLearningEvents: number;
    successfulLearningEvents: number;
    totalAdjustments: number;
    totalInsights: number;
    implementedInsights: number;
    learningSuccessRate: number;
    insightImplementationRate: number;
    averageLearningRate: number;
    averageConfidence: number;
  };
  breakdowns: {
    learningTypes: Record<string, number>;
    insightTypes: Record<string, number>;
  };
  activeWeights: number;
  recentActivity: {
    lastHour: number;
    last6Hours: number;
  };
}

export interface LearningContext {
  agentType: string;
  metricType: string;
  metricSubtype?: string;
  category?: string;
  campaignId?: string;
  platform?: string;
  region?: string;
  timeframe?: string;
}

export interface LearningFilters {
  agentType?: string;
  metricType?: string;
  timeRange?: string;
  priority?: string;
  status?: string;
  insightType?: string;
  dismissed?: boolean;
  validated?: boolean;
  rolledBack?: boolean;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export interface FeedbackAnalysis {
  success: boolean;
  confidence: number;
  improvement: number;
  sampleSize: number;
  recommendation: string;
  adjustments: Array<{
    type: string;
    adjustmentType: string;
    previousValue: number;
    newValue: number;
    confidence: number;
  }>;
}

// Custom hook for learning system
export function useLearning() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<LearningFilters>({
    timeRange: '24h',
    agentType: 'all',
    limit: 100,
    offset: 0
  });
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30000);

  // Query keys
  const queryKeys = {
    insights: ['learning', 'insights', filters] as const,
    weights: ['learning', 'weights', filters] as const,
    logs: ['learning', 'logs', filters] as const,
    stats: ['learning', 'stats', filters] as const,
    status: ['learning', 'status'] as const,
    performanceMetrics: ['learning', 'performance', filters] as const
  };

  // Queries
  const insightsQuery = useQuery({
    queryKey: queryKeys.insights,
    queryFn: () => trpc.learning.getLearningInsights.query(filters),
    enabled: !!filters,
    refetchInterval: autoRefresh ? refreshInterval : false,
    staleTime: 30000,
    retry: 2
  });

  const weightsQuery = useQuery({
    queryKey: queryKeys.weights,
    queryFn: () => trpc.learning.getMetricWeights.query(filters),
    enabled: !!filters,
    refetchInterval: autoRefresh ? refreshInterval : false,
    staleTime: 30000,
    retry: 2
  });

  const logsQuery = useQuery({
    queryKey: queryKeys.logs,
    queryFn: () => trpc.learning.getLearningLogs.query(filters),
    enabled: !!filters,
    refetchInterval: autoRefresh ? refreshInterval : false,
    staleTime: 30000,
    retry: 2
  });

  const statsQuery = useQuery({
    queryKey: queryKeys.stats,
    queryFn: () => trpc.learning.getLearningStats.query(filters),
    enabled: !!filters,
    refetchInterval: autoRefresh ? refreshInterval : false,
    staleTime: 30000,
    retry: 2
  });

  const statusQuery = useQuery({
    queryKey: queryKeys.status,
    queryFn: () => trpc.learning.getLearningStatus.query(),
    refetchInterval: autoRefresh ? refreshInterval : false,
    staleTime: 30000,
    retry: 2
  });

  // Mutations
  const processActionOutcomeMutation = useMutation({
    mutationFn: (data: { actionLogId: string; forceAnalysis?: boolean }) =>
      trpc.learning.processActionOutcome.mutate(data),
    onSuccess: (data) => {
      if (data.success) {
        toast.success('Action outcome processed successfully');
        queryClient.invalidateQueries({ queryKey: ['learning'] });
      } else {
        toast.error(data.message || 'Failed to process action outcome');
      }
    },
    onError: (error) => {
      toast.error('Failed to process action outcome');
      console.error('Process action outcome error:', error);
    }
  });

  const processBatchLearningMutation = useMutation({
    mutationFn: (data: { agentType?: string; metricType?: string; timeWindow?: number }) =>
      trpc.learning.processBatchLearning.mutate(data),
    onSuccess: (data) => {
      if (data.success) {
        toast.success('Batch learning completed successfully');
        queryClient.invalidateQueries({ queryKey: ['learning'] });
      } else {
        toast.error(data.message || 'Failed to process batch learning');
      }
    },
    onError: (error) => {
      toast.error('Failed to process batch learning');
      console.error('Process batch learning error:', error);
    }
  });

  const runScheduledLearningMutation = useMutation({
    mutationFn: () => trpc.learning.runScheduledLearning.mutate(),
    onSuccess: (data) => {
      if (data.success) {
        toast.success('Scheduled learning completed successfully');
        queryClient.invalidateQueries({ queryKey: ['learning'] });
      } else {
        toast.error(data.message || 'Failed to run scheduled learning');
      }
    },
    onError: (error) => {
      toast.error('Failed to run scheduled learning');
      console.error('Run scheduled learning error:', error);
    }
  });

  const updateInsightMutation = useMutation({
    mutationFn: (data: {
      id: string;
      status?: string;
      userFeedback?: string;
      userRating?: number;
      dismissed?: boolean;
      dismissedReason?: string;
    }) => trpc.learning.updateLearningInsight.mutate(data),
    onSuccess: (data) => {
      if (data.success) {
        toast.success('Learning insight updated successfully');
        queryClient.invalidateQueries({ queryKey: ['learning', 'insights'] });
      } else {
        toast.error(data.message || 'Failed to update learning insight');
      }
    },
    onError: (error) => {
      toast.error('Failed to update learning insight');
      console.error('Update insight error:', error);
    }
  });

  const updateMetricWeightMutation = useMutation({
    mutationFn: (data: {
      context: LearningContext;
      weight?: number;
      threshold?: number;
      confidence?: number;
      reason?: string;
    }) => trpc.learning.updateMetricWeight.mutate(data),
    onSuccess: (data) => {
      if (data.success) {
        toast.success('Metric weight updated successfully');
        queryClient.invalidateQueries({ queryKey: ['learning', 'weights'] });
      } else {
        toast.error(data.message || 'Failed to update metric weight');
      }
    },
    onError: (error) => {
      toast.error('Failed to update metric weight');
      console.error('Update metric weight error:', error);
    }
  });

  const clearLearningCacheMutation = useMutation({
    mutationFn: () => trpc.learning.clearLearningCache.mutate(),
    onSuccess: (data) => {
      if (data.success) {
        toast.success('Learning cache cleared successfully');
        queryClient.invalidateQueries({ queryKey: ['learning'] });
      } else {
        toast.error('Failed to clear learning cache');
      }
    },
    onError: (error) => {
      toast.error('Failed to clear learning cache');
      console.error('Clear cache error:', error);
    }
  });

  // Utility functions
  const refreshAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['learning'] });
  }, [queryClient]);

  const updateFilters = useCallback((newFilters: Partial<LearningFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      timeRange: '24h',
      agentType: 'all',
      limit: 100,
      offset: 0
    });
  }, []);

  // Filter functions
  const filterInsightsByStatus = useCallback((insights: LearningInsight[], status: string) => {
    return insights.filter(insight => insight.status === status);
  }, []);

  const filterInsightsByPriority = useCallback((insights: LearningInsight[], priority: string) => {
    return insights.filter(insight => insight.priority === priority);
  }, []);

  const filterInsightsByAgent = useCallback((insights: LearningInsight[], agentType: string) => {
    return insights.filter(insight => insight.agentType === agentType);
  }, []);

  const getHighPriorityInsights = useCallback((insights: LearningInsight[]) => {
    return insights.filter(insight => 
      ['URGENT', 'CRITICAL', 'HIGH'].includes(insight.priority)
    );
  }, []);

  const getPendingInsights = useCallback((insights: LearningInsight[]) => {
    return insights.filter(insight => insight.status === 'PENDING');
  }, []);

  const getImplementedInsights = useCallback((insights: LearningInsight[]) => {
    return insights.filter(insight => insight.status === 'IMPLEMENTED');
  }, []);

  const getRecentInsights = useCallback((insights: LearningInsight[], hours: number = 24) => {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return insights.filter(insight => new Date(insight.createdAt) >= cutoff);
  }, []);

  // Weight functions
  const getActiveWeights = useCallback((weights: MetricWeight[]) => {
    return weights.filter(weight => weight.isActive);
  }, []);

  const getWeightsByAgent = useCallback((weights: MetricWeight[], agentType: string) => {
    return weights.filter(weight => weight.agentType === agentType);
  }, []);

  const getTopPerformingWeights = useCallback((weights: MetricWeight[], limit: number = 10) => {
    return weights
      .filter(weight => weight.isActive)
      .sort((a, b) => b.performanceScore - a.performanceScore)
      .slice(0, limit);
  }, []);

  const getRecentlyAdjustedWeights = useCallback((weights: MetricWeight[], hours: number = 24) => {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return weights.filter(weight => 
      weight.lastAdjustment && new Date(weight.lastAdjustment) >= cutoff
    );
  }, []);

  // Log functions
  const getSuccessfulLogs = useCallback((logs: LearningLog[]) => {
    return logs.filter(log => log.validated && !log.rolledBack);
  }, []);

  const getFailedLogs = useCallback((logs: LearningLog[]) => {
    return logs.filter(log => !log.validated || log.rolledBack);
  }, []);

  const getLogsByType = useCallback((logs: LearningLog[], learningType: string) => {
    return logs.filter(log => log.learningType === learningType);
  }, []);

  const getRecentLogs = useCallback((logs: LearningLog[], hours: number = 24) => {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return logs.filter(log => new Date(log.createdAt) >= cutoff);
  }, []);

  // Analytics functions
  const getInsightSuccessRate = useCallback((insights: LearningInsight[]) => {
    const total = insights.length;
    const successful = insights.filter(insight => 
      ['IMPLEMENTED', 'VALIDATED'].includes(insight.status)
    ).length;
    return total > 0 ? successful / total : 0;
  }, []);

  const getAverageInsightConfidence = useCallback((insights: LearningInsight[]) => {
    if (insights.length === 0) return 0;
    const total = insights.reduce((sum, insight) => sum + insight.confidence, 0);
    return total / insights.length;
  }, []);

  const getWeightAdjustmentRate = useCallback((weights: MetricWeight[]) => {
    const total = weights.length;
    const adjusted = weights.filter(weight => weight.adjustmentCount > 0).length;
    return total > 0 ? adjusted / total : 0;
  }, []);

  const getLearningSuccessRate = useCallback((logs: LearningLog[]) => {
    const total = logs.length;
    const successful = logs.filter(log => log.validated && !log.rolledBack).length;
    return total > 0 ? successful / total : 0;
  }, []);

  const getInsightTrends = useCallback((insights: LearningInsight[]) => {
    const now = new Date();
    const periods = [
      { name: 'Last Hour', hours: 1 },
      { name: 'Last 6 Hours', hours: 6 },
      { name: 'Last 24 Hours', hours: 24 },
      { name: 'Last 7 Days', hours: 168 },
      { name: 'Last 30 Days', hours: 720 }
    ];

    return periods.map(period => {
      const cutoff = new Date(now.getTime() - period.hours * 60 * 60 * 1000);
      const periodInsights = insights.filter(insight => 
        new Date(insight.createdAt) >= cutoff
      );
      
      return {
        period: period.name,
        total: periodInsights.length,
        highPriority: periodInsights.filter(i => 
          ['URGENT', 'CRITICAL', 'HIGH'].includes(i.priority)
        ).length,
        implemented: periodInsights.filter(i => 
          i.status === 'IMPLEMENTED'
        ).length,
        averageConfidence: periodInsights.length > 0 ? 
          periodInsights.reduce((sum, i) => sum + i.confidence, 0) / periodInsights.length : 0
      };
    });
  }, []);

  // Configuration functions
  const toggleAutoRefresh = useCallback(() => {
    setAutoRefresh(prev => !prev);
  }, []);

  const setRefreshIntervalValue = useCallback((interval: number) => {
    setRefreshInterval(interval);
  }, []);

  // Return the hook interface
  return {
    // Data
    insights: insightsQuery.data?.insights || [],
    weights: weightsQuery.data?.weights || [],
    logs: logsQuery.data?.logs || [],
    stats: statsQuery.data || null,
    status: statusQuery.data || null,
    
    // Query states
    isLoading: insightsQuery.isLoading || weightsQuery.isLoading || logsQuery.isLoading || statsQuery.isLoading,
    isError: insightsQuery.isError || weightsQuery.isError || logsQuery.isError || statsQuery.isError,
    error: insightsQuery.error || weightsQuery.error || logsQuery.error || statsQuery.error,
    
    // Filters and settings
    filters,
    autoRefresh,
    refreshInterval,
    
    // Actions
    processActionOutcome: processActionOutcomeMutation.mutate,
    processBatchLearning: processBatchLearningMutation.mutate,
    runScheduledLearning: runScheduledLearningMutation.mutate,
    updateInsight: updateInsightMutation.mutate,
    updateMetricWeight: updateMetricWeightMutation.mutate,
    clearLearningCache: clearLearningCacheMutation.mutate,
    
    // Mutation states
    isProcessingAction: processActionOutcomeMutation.isPending,
    isProcessingBatch: processBatchLearningMutation.isPending,
    isRunningScheduled: runScheduledLearningMutation.isPending,
    isUpdatingInsight: updateInsightMutation.isPending,
    isUpdatingWeight: updateMetricWeightMutation.isPending,
    isClearingCache: clearLearningCacheMutation.isPending,
    
    // Utility functions
    refreshAll,
    updateFilters,
    resetFilters,
    toggleAutoRefresh,
    setRefreshIntervalValue,
    
    // Filter functions
    filterInsightsByStatus,
    filterInsightsByPriority,
    filterInsightsByAgent,
    getHighPriorityInsights,
    getPendingInsights,
    getImplementedInsights,
    getRecentInsights,
    
    // Weight functions
    getActiveWeights,
    getWeightsByAgent,
    getTopPerformingWeights,
    getRecentlyAdjustedWeights,
    
    // Log functions
    getSuccessfulLogs,
    getFailedLogs,
    getLogsByType,
    getRecentLogs,
    
    // Analytics functions
    getInsightSuccessRate,
    getAverageInsightConfidence,
    getWeightAdjustmentRate,
    getLearningSuccessRate,
    getInsightTrends
  };
}

// Specialized hooks for specific use cases
export function useInsights(filters?: Partial<LearningFilters>) {
  const { 
    insights, 
    isLoading, 
    isError, 
    error, 
    updateInsight, 
    isUpdatingInsight,
    filterInsightsByStatus,
    filterInsightsByPriority,
    getHighPriorityInsights,
    getPendingInsights,
    getImplementedInsights,
    getRecentInsights,
    getInsightSuccessRate,
    getAverageInsightConfidence,
    getInsightTrends
  } = useLearning();

  return {
    insights,
    isLoading,
    isError,
    error,
    updateInsight,
    isUpdatingInsight,
    filterInsightsByStatus,
    filterInsightsByPriority,
    getHighPriorityInsights,
    getPendingInsights,
    getImplementedInsights,
    getRecentInsights,
    getInsightSuccessRate,
    getAverageInsightConfidence,
    getInsightTrends
  };
}

export function useMetricWeights(filters?: Partial<LearningFilters>) {
  const { 
    weights, 
    isLoading, 
    isError, 
    error, 
    updateMetricWeight, 
    isUpdatingWeight,
    getActiveWeights,
    getWeightsByAgent,
    getTopPerformingWeights,
    getRecentlyAdjustedWeights,
    getWeightAdjustmentRate
  } = useLearning();

  return {
    weights,
    isLoading,
    isError,
    error,
    updateMetricWeight,
    isUpdatingWeight,
    getActiveWeights,
    getWeightsByAgent,
    getTopPerformingWeights,
    getRecentlyAdjustedWeights,
    getWeightAdjustmentRate
  };
}

export function useLearningStats(filters?: Partial<LearningFilters>) {
  const { 
    stats, 
    isLoading, 
    isError, 
    error, 
    runScheduledLearning, 
    isRunningScheduled,
    clearLearningCache,
    isClearingCache
  } = useLearning();

  return {
    stats,
    isLoading,
    isError,
    error,
    runScheduledLearning,
    isRunningScheduled,
    clearLearningCache,
    isClearingCache
  };
}

export function useLearningActions() {
  const { 
    processActionOutcome, 
    processBatchLearning, 
    runScheduledLearning,
    isProcessingAction,
    isProcessingBatch,
    isRunningScheduled,
    clearLearningCache,
    isClearingCache
  } = useLearning();

  return {
    processActionOutcome,
    processBatchLearning,
    runScheduledLearning,
    isProcessingAction,
    isProcessingBatch,
    isRunningScheduled,
    clearLearningCache,
    isClearingCache
  };
}

export default useLearning; 