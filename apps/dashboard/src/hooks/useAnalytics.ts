import { useState, useEffect, useCallback, useMemo } from "react";
import { api } from "../utils/trpc";

// Types for our analytics hook
interface UseAnalyticsParams {
  timeframe?: "1h" | "6h" | "24h" | "7d" | "30d" | "90d";
  autoRefresh?: boolean;
  selectedAgents?: string[];
  selectedCampaigns?: string[];
  refreshInterval?: number; // in milliseconds
}

interface MetricData {
  id: string;
  agentName: string;
  agentType: string;
  campaignId?: string | null;
  executionId?: string | null;
  metricType: string;
  metricSubtype?: string | null;
  category?: string | null;
  value: number;
  previousValue?: number | null;
  target?: number | null;
  unit?: string | null;
  region?: string | null;
  platform?: string | null;
  language?: string | null;
  timeframe?: string | null;
  trend?: "increasing" | "decreasing" | "stable" | null;
  changePercent?: number | null;
  performance?: "excellent" | "good" | "average" | "poor" | "critical" | null;
  confidence?: number | null;
  source: "direct" | "calculated" | "aggregated" | "estimated";
  aggregationLevel: string;
  batchId?: string | null;
  timestamp: Date;
  recordedAt: Date;
  metadata?: any;
  tags: string[];
}

interface AgentComparison {
  agentName: string;
  agentType: string;
  metrics: Array<{
    metricType: string;
    values: Array<{
      timestamp: Date;
      value: number;
      trend?: string;
      performance?: string;
    }>;
    average: number;
    total: number;
    change?: number;
  }>;
  summary: {
    totalMetrics: number;
    averagePerformance: number;
    bestMetric?: string;
    worstMetric?: string;
  };
}

interface CampaignInsight {
  campaignId: string;
  campaignName: string | null;
  overview: {
    totalMetrics: number;
    activeAgents: number;
    averagePerformance: number;
    bestPerformingAgent: string | null;
    worstPerformingAgent: string | null;
    timeframe: string;
  };
  agentBreakdown?: Array<{
    agentName: string;
    agentType: string;
    metricCount: number;
    averagePerformance: number;
    topMetrics: Array<{
      metricType: string;
      value: number;
      unit: string | null;
      trend: string | null;
    }>;
  }>;
  performanceTrends?: Array<{
    date: Date;
    overallPerformance: number;
    metricBreakdown: {
      reach: number | null;
      engagement: number | null;
      conversions: number | null;
      roi: number | null;
      sentiment: number | null;
    };
  }>;
  recommendations: Array<{
    type: string;
    priority: "low" | "medium" | "high" | "critical";
    message: string;
    agentName: string | null;
    metricType: string | null;
  }>;
}

interface DashboardSummary {
  overview: {
    totalMetrics: number;
    activeAgents: number;
    activeCampaigns: number;
    averagePerformance: number;
    lastUpdated: Date;
  };
  topPerformers: {
    agents: Array<{
      name: string;
      type: string;
      performance: number;
      change: number | null;
    }>;
    campaigns: Array<{
      id: string;
      name: string;
      performance: number;
      metricsCount: number;
    }>;
    metrics: Array<{
      type: string;
      value: number;
      unit: string | null;
      trend: string | null;
    }>;
  };
  alerts: Array<{
    type: string;
    severity: "info" | "warning" | "error";
    message: string;
    agentName: string | null;
    metricType: string | null;
    timestamp: Date;
  }>;
}

export function useAnalytics({
  timeframe = "24h",
  autoRefresh = false,
  selectedAgents = [],
  selectedCampaigns = [],
  refreshInterval = 30000,
}: UseAnalyticsParams = {}) {
  // State management
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Dashboard summary query
  const {
    data: dashboardSummary,
    refetch: refetchDashboard,
    isLoading: isDashboardLoading,
    error: dashboardError,
  } = api.analytics.getDashboardSummary.useQuery(
    { timeframe },
    {
      refetchOnWindowFocus: false,
      staleTime: 30000, // Consider data stale after 30 seconds
      retry: 3,
    }
  );

  // Metrics query with filtering
  const metricsFilters = useMemo(() => ({
    agentNames: selectedAgents.length > 0 ? selectedAgents : undefined,
    campaignIds: selectedCampaigns.length > 0 ? selectedCampaigns : undefined,
  }), [selectedAgents, selectedCampaigns]);

  const {
    data: metrics,
    refetch: refetchMetrics,
    isLoading: isMetricsLoading,
    error: metricsError,
  } = api.analytics.getMetrics.useQuery(
    {
      timeframe,
      filters: metricsFilters,
      limit: 100,
      offset: 0,
      sortBy: "timestamp",
      sortOrder: "desc",
    },
    {
      refetchOnWindowFocus: false,
      staleTime: 30000,
      retry: 3,
    }
  );

  // Agent comparison query
  const agentComparisonAgents = useMemo(() => 
    selectedAgents.length > 0 
      ? selectedAgents 
      : ["ContentAgent", "SEOAgent", "EmailAgent", "SupportAgent", "TrendAgent"],
    [selectedAgents]
  );

  const {
    data: agentComparison,
    refetch: refetchAgentComparison,
    isLoading: isAgentComparisonLoading,
    error: agentComparisonError,
  } = api.analytics.getAgentComparison.useQuery(
    {
      agents: agentComparisonAgents,
      timeframe,
      groupBy: "day",
    },
    {
      refetchOnWindowFocus: false,
      staleTime: 60000, // Longer stale time for comparison data
      retry: 3,
    }
  );

  // Campaign insights - we'll get insights for recent campaigns
  const [campaignInsights, setCampaignInsights] = useState<CampaignInsight[]>([]);
  const [isCampaignInsightsLoading, setIsCampaignInsightsLoading] = useState(false);

  // Mutations for triggering aggregation
  const triggerAggregationMutation = api.analytics.triggerAggregation.useMutation({
    onSuccess: (data) => {
      console.log("Aggregation triggered successfully:", data);
      setLastUpdated(new Date());
      // Refetch all data after aggregation
      setTimeout(() => {
        refreshData();
      }, 2000); // Wait 2 seconds for aggregation to complete
    },
    onError: (error) => {
      console.error("Failed to trigger aggregation:", error);
      setError(new Error(`Failed to trigger aggregation: ${error.message}`));
    },
  });

  // Combined loading state
  const combinedIsLoading = useMemo(() => 
    isDashboardLoading || 
    isMetricsLoading || 
    isAgentComparisonLoading || 
    isCampaignInsightsLoading ||
    triggerAggregationMutation.isPending,
    [
      isDashboardLoading, 
      isMetricsLoading, 
      isAgentComparisonLoading, 
      isCampaignInsightsLoading,
      triggerAggregationMutation.isPending
    ]
  );

  // Combined error state
  const combinedError = useMemo(() => 
    dashboardError || metricsError || agentComparisonError || error,
    [dashboardError, metricsError, agentComparisonError, error]
  );

  // Fetch campaign insights for campaigns that have metrics
  const fetchCampaignInsights = useCallback(async () => {
    if (!metrics?.data) return;

    const campaignIds = Array.from(
      new Set(
        metrics.data
          .filter(metric => metric.campaignId)
          .map(metric => metric.campaignId!)
      )
    ).slice(0, 5); // Limit to 5 most recent campaigns

    if (campaignIds.length === 0) {
      setCampaignInsights([]);
      return;
    }

    setIsCampaignInsightsLoading(true);
    try {
      const insights = await Promise.all(
        campaignIds.map(async (campaignId) => {
          try {
            const result = await api.analytics.getCampaignInsights.query({
              campaignId,
              timeframe,
              includeAgentBreakdown: true,
              includePerformanceTrends: true,
            });
            return result.data;
          } catch (error) {
            console.error(`Failed to fetch insights for campaign ${campaignId}:`, error);
            return null;
          }
        })
      );

      setCampaignInsights(insights.filter(Boolean) as CampaignInsight[]);
    } catch (error) {
      console.error("Failed to fetch campaign insights:", error);
      setError(new Error("Failed to fetch campaign insights"));
    } finally {
      setIsCampaignInsightsLoading(false);
    }
  }, [metrics?.data, timeframe]);

  // Refresh all data
  const refreshData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        refetchDashboard(),
        refetchMetrics(),
        refetchAgentComparison(),
      ]);
      
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to refresh data:", error);
      setError(new Error("Failed to refresh analytics data"));
    } finally {
      setIsLoading(false);
    }
  }, [refetchDashboard, refetchMetrics, refetchAgentComparison]);

  // Trigger metrics aggregation
  const triggerAggregation = useCallback(async (timeframe: string = "1h") => {
    try {
      await triggerAggregationMutation.mutateAsync({ timeframe });
    } catch (error) {
      console.error("Failed to trigger aggregation:", error);
    }
  }, [triggerAggregationMutation]);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refreshData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refreshData]);

  // Fetch campaign insights when metrics change
  useEffect(() => {
    fetchCampaignInsights();
  }, [fetchCampaignInsights]);

  // Update last updated time when data changes
  useEffect(() => {
    if (dashboardSummary || metrics || agentComparison) {
      setLastUpdated(new Date());
    }
  }, [dashboardSummary, metrics, agentComparison]);

  // Derived state and computed values
  const analyticsState = useMemo(() => ({
    // Data
    dashboardSummary,
    metrics,
    agentComparison,
    campaignInsights,

    // Loading states
    isLoading: combinedIsLoading,
    isDashboardLoading,
    isMetricsLoading,
    isAgentComparisonLoading,
    isCampaignInsightsLoading,

    // Error states
    error: combinedError,
    dashboardError,
    metricsError,
    agentComparisonError,

    // Metadata
    lastUpdated,
    isAggregating: triggerAggregationMutation.isPending,

    // Actions
    refreshData,
    triggerAggregation,

    // Individual refetch functions for granular control
    refetchDashboard,
    refetchMetrics,
    refetchAgentComparison,
    refetchCampaignInsights: fetchCampaignInsights,

    // Configuration
    timeframe,
    autoRefresh,
    selectedAgents,
    selectedCampaigns,
  }), [
    dashboardSummary,
    metrics,
    agentComparison,
    campaignInsights,
    combinedIsLoading,
    isDashboardLoading,
    isMetricsLoading,
    isAgentComparisonLoading,
    isCampaignInsightsLoading,
    combinedError,
    dashboardError,
    metricsError,
    agentComparisonError,
    lastUpdated,
    triggerAggregationMutation.isPending,
    refreshData,
    triggerAggregation,
    refetchDashboard,
    refetchMetrics,
    refetchAgentComparison,
    fetchCampaignInsights,
    timeframe,
    autoRefresh,
    selectedAgents,
    selectedCampaigns,
  ]);

  return analyticsState;
}

// Helper functions for working with analytics data
export const analyticsHelpers = {
  // Format metric values based on unit
  formatMetricValue: (value: number, unit?: string | null): string => {
    if (unit === "percentage") {
      return `${(value * 100).toFixed(1)}%`;
    } else if (unit === "count") {
      if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
      if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
      return value.toFixed(0);
    } else if (unit === "seconds") {
      if (value >= 3600) return `${(value / 3600).toFixed(1)}h`;
      if (value >= 60) return `${(value / 60).toFixed(1)}m`;
      return `${value.toFixed(0)}s`;
    } else if (unit === "dollars") {
      return `$${value.toFixed(2)}`;
    } else if (unit === "score") {
      return value.toFixed(1);
    }
    return value.toFixed(2);
  },

  // Get performance color based on value
  getPerformanceColor: (performance: number): string => {
    if (performance >= 4) return "text-emerald-400";
    if (performance >= 3) return "text-blue-400";
    if (performance >= 2) return "text-yellow-400";
    return "text-red-400";
  },

  // Get performance label
  getPerformanceLabel: (performance: number): string => {
    if (performance >= 4) return "Excellent";
    if (performance >= 3) return "Good";
    if (performance >= 2) return "Average";
    return "Poor";
  },

  // Calculate change percentage
  calculateChangePercent: (current: number, previous: number): number => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  },

  // Filter metrics by search query
  filterMetrics: (metrics: MetricData[], query: string): MetricData[] => {
    if (!query) return metrics;
    
    const lowercaseQuery = query.toLowerCase();
    return metrics.filter(metric =>
      metric.agentName.toLowerCase().includes(lowercaseQuery) ||
      metric.metricType.toLowerCase().includes(lowercaseQuery) ||
      metric.category?.toLowerCase().includes(lowercaseQuery) ||
      metric.metricSubtype?.toLowerCase().includes(lowercaseQuery)
    );
  },

  // Group metrics by agent
  groupMetricsByAgent: (metrics: MetricData[]): Record<string, MetricData[]> => {
    return metrics.reduce((acc, metric) => {
      if (!acc[metric.agentName]) {
        acc[metric.agentName] = [];
      }
      acc[metric.agentName].push(metric);
      return acc;
    }, {} as Record<string, MetricData[]>);
  },

  // Group metrics by type
  groupMetricsByType: (metrics: MetricData[]): Record<string, MetricData[]> => {
    return metrics.reduce((acc, metric) => {
      if (!acc[metric.metricType]) {
        acc[metric.metricType] = [];
      }
      acc[metric.metricType].push(metric);
      return acc;
    }, {} as Record<string, MetricData[]>);
  },

  // Calculate average performance for a set of metrics
  calculateAveragePerformance: (metrics: MetricData[]): number => {
    const performanceMetrics = metrics.filter(m => m.performance);
    if (performanceMetrics.length === 0) return 0;

    const performanceValues = performanceMetrics.map(m => {
      switch (m.performance) {
        case "excellent": return 5;
        case "good": return 4;
        case "average": return 3;
        case "poor": return 2;
        case "critical": return 1;
        default: return 3;
      }
    });

    return performanceValues.reduce((sum, val) => sum + val, 0) / performanceValues.length;
  },
}; 