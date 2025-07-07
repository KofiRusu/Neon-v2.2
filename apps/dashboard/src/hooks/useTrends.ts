import { useState, useEffect, useCallback, useMemo } from "react";
import { api } from "../utils/trpc";

export interface Trend {
  id: string;
  keyword: string;
  platform: "FACEBOOK" | "INSTAGRAM" | "TIKTOK" | "TWITTER" | "LINKEDIN" | "YOUTUBE" | "PINTEREST" | "GOOGLE";
  category?: string | null;
  title?: string | null;
  description?: string | null;
  viralityScore: number;
  relevanceScore: number;
  opportunityScore: number;
  overallScore: number;
  volume?: number | null;
  growth?: number | null;
  engagement?: number | null;
  shares?: number | null;
  likes?: number | null;
  comments?: number | null;
  region?: string | null;
  country?: string | null;
  language?: string | null;
  ageGroup?: string | null;
  gender?: string | null;
  tags: string[];
  sourceUrl?: string | null;
  influencers?: any;
  relatedKeywords?: any;
  aiExplanation?: string | null;
  campaignRelevance?: any;
  contentSuggestions?: any;
  status: string;
  peakDate?: Date | null;
  expiresAt?: Date | null;
  data?: any;
  metadata?: any;
  detectedAt: Date;
  updatedAt: Date;
  trendScores?: TrendScore[];
}

export interface TrendScore {
  id: string;
  trendId: string;
  viralityScore: number;
  relevanceScore: number;
  opportunityScore: number;
  overallScore: number;
  volume: number;
  engagement: number;
  growth: number;
  momentum: number;
  scoreChange: number;
  volumeChange: number;
  ranking?: number | null;
  predictedGrowth?: number | null;
  confidenceLevel?: number | null;
  date: Date;
  hour?: number | null;
  region?: string | null;
}

export interface TrendFilters {
  platform?: string;
  region?: string;
  category?: string;
  status?: string;
  sortBy?: string;
  order?: "asc" | "desc";
  limit?: number;
  offset?: number;
}

export interface TrendAnalytics {
  totalTrends: number;
  activeTrends: number;
  averageScore: number;
  highGrowthTrends: number;
  topPlatforms: string[];
  categories: Array<{
    category: string;
    count: number;
    averageScore: number;
  }>;
  platforms: Array<{
    platform: string;
    count: number;
    averageScore: number;
  }>;
}

export interface ForecastData {
  trendId: string;
  timeframe: string;
  currentScore: number;
  predictedScore: number;
  confidence: number;
  trend: "increasing" | "decreasing" | "stable";
  factors: string[];
  recommendations: string[];
}

export function useTrends(initialFilters: TrendFilters = {}) {
  // State management
  const [trends, setTrends] = useState<Trend[]>([]);
  const [selectedTrend, setSelectedTrend] = useState<string | null>(null);
  const [filters, setFilters] = useState<TrendFilters>(initialFilters);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // tRPC API calls
  const {
    data: trendsData,
    isLoading: isFetchingTrends,
    error: trendsError,
    refetch: refetchTrends,
  } = api.trends.getTrends.useQuery(filters, {
    refetchInterval: 60000, // Refetch every 60 seconds
    refetchOnWindowFocus: true,
  });

  const {
    data: analyticsData,
    isLoading: isFetchingAnalytics,
    refetch: refetchAnalytics,
  } = api.trends.getTrendAnalytics.useQuery({
    timeframe: "30d",
    region: filters.region,
  });

  const analyzeTrendsMutation = api.trends.analyzeTrends.useMutation({
    onSuccess: () => {
      refetchTrends();
      setLastUpdated(new Date());
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  const detectOpportunitiesMutation = api.trends.detectOpportunities.useMutation({
    onSuccess: () => {
      refetchTrends();
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  const generateAIExplanationMutation = api.trends.generateAIExplanation.useMutation({
    onError: (error) => {
      setError(error.message);
    },
  });

  const scoreTrendRelevanceMutation = api.trends.scoreTrendRelevance.useMutation({
    onError: (error) => {
      setError(error.message);
    },
  });

  // Update trends when data changes
  useEffect(() => {
    if (trendsData?.success && trendsData.data) {
      setTrends(trendsData.data);
      setLastUpdated(new Date());
    }
  }, [trendsData]);

  // Update error state
  useEffect(() => {
    if (trendsError) {
      setError(trendsError.message);
    } else {
      setError(null);
    }
  }, [trendsError]);

  // Update loading state
  useEffect(() => {
    setIsLoading(isFetchingTrends || isFetchingAnalytics);
  }, [isFetchingTrends, isFetchingAnalytics]);

  // Filter and sort trends locally
  const filteredTrends = useMemo(() => {
    return trends.filter((trend) => {
      if (filters.platform && filters.platform !== "ALL" && trend.platform !== filters.platform) {
        return false;
      }
      if (filters.region && filters.region !== "all" && trend.region !== filters.region) {
        return false;
      }
      if (filters.category && trend.category !== filters.category) {
        return false;
      }
      if (filters.status && trend.status !== filters.status) {
        return false;
      }
      return true;
    });
  }, [trends, filters]);

  // Get analytics summary
  const analytics: TrendAnalytics = useMemo(() => {
    if (analyticsData?.success && analyticsData.data) {
      return {
        totalTrends: analyticsData.data.overview.totalTrends,
        activeTrends: analyticsData.data.overview.activeTrends,
        averageScore: analyticsData.data.overview.averageScore,
        highGrowthTrends: analyticsData.data.highGrowthTrends.length,
        topPlatforms: analyticsData.data.platforms.slice(0, 3).map(p => p.platform),
        categories: analyticsData.data.categories,
        platforms: analyticsData.data.platforms,
      };
    }

    // Fallback to computed analytics from local data
    const totalTrends = trends.length;
    const activeTrends = trends.filter(t => t.status === "active").length;
    const avgScore = trends.length > 0 
      ? trends.reduce((sum, t) => sum + t.overallScore, 0) / trends.length 
      : 0;
    const highGrowthTrends = trends.filter(t => (t.growth || 0) > 15).length;

    return {
      totalTrends,
      activeTrends,
      averageScore: avgScore,
      highGrowthTrends,
      topPlatforms: [],
      categories: [],
      platforms: [],
    };
  }, [analyticsData, trends]);

  // Get top trending keywords
  const topTrends = useMemo(() => {
    return trends
      .sort((a, b) => b.overallScore - a.overallScore)
      .slice(0, 10);
  }, [trends]);

  // Get selected trend details
  const selectedTrendDetails = useMemo(() => {
    return trends.find(t => t.id === selectedTrend) || null;
  }, [trends, selectedTrend]);

  // Actions
  const updateFilters = useCallback((newFilters: Partial<TrendFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const refresh = useCallback(async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    
    try {
      await Promise.all([
        refetchTrends(),
        refetchAnalytics(),
      ]);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to refresh trends:", error);
    } finally {
      if (!silent) setIsRefreshing(false);
    }
  }, [refetchTrends, refetchAnalytics]);

  const analyzeTrends = useCallback(async (params: {
    keywords?: string[];
    platforms?: string[];
    region?: string;
    timeframe?: string;
    includeAI?: boolean;
  }) => {
    try {
      const result = await analyzeTrendsMutation.mutateAsync(params);
      return result;
    } catch (error) {
      console.error("Failed to analyze trends:", error);
      throw error;
    }
  }, [analyzeTrendsMutation]);

  const detectOpportunities = useCallback(async (params: {
    campaignIds?: string[];
    industry?: string;
    targetAudience?: string;
    minScore?: number;
    maxRisk?: "low" | "medium" | "high";
  }) => {
    try {
      const result = await detectOpportunitiesMutation.mutateAsync(params);
      return result;
    } catch (error) {
      console.error("Failed to detect opportunities:", error);
      throw error;
    }
  }, [detectOpportunitiesMutation]);

  const generateAIExplanation = useCallback(async (trendIds: string[], context?: string) => {
    try {
      const result = await generateAIExplanationMutation.mutateAsync({
        trendIds,
        context,
      });
      return result;
    } catch (error) {
      console.error("Failed to generate AI explanation:", error);
      throw error;
    }
  }, [generateAIExplanationMutation]);

  const scoreTrendRelevance = useCallback(async (params: {
    trendIds: string[];
    campaignIds?: string[];
    brandKeywords?: string[];
  }) => {
    try {
      const result = await scoreTrendRelevanceMutation.mutateAsync(params);
      return result;
    } catch (error) {
      console.error("Failed to score trend relevance:", error);
      throw error;
    }
  }, [scoreTrendRelevanceMutation]);

  const getTrendForecast = useCallback(async (trendId: string, timeframe = "7d") => {
    try {
      const result = await api.trends.getTrendForecast.useQuery({
        trendId,
        timeframe: timeframe as "1d" | "7d" | "30d" | "90d",
        includeConfidence: true,
      });
      return result;
    } catch (error) {
      console.error("Failed to get trend forecast:", error);
      throw error;
    }
  }, []);

  const searchTrends = useCallback(async (query: string, options: {
    platforms?: string[];
    regions?: string[];
    limit?: number;
  } = {}) => {
    try {
      const result = await api.trends.searchTrends.useQuery({
        query,
        ...options,
      });
      return result;
    } catch (error) {
      console.error("Failed to search trends:", error);
      throw error;
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // Data
    trends: filteredTrends,
    allTrends: trends,
    selectedTrend: selectedTrendDetails,
    analytics,
    topTrends,
    
    // State
    isLoading,
    isRefreshing,
    error,
    lastUpdated,
    filters,
    
    // Actions
    setSelectedTrend,
    updateFilters,
    refresh,
    analyzeTrends,
    detectOpportunities,
    generateAIExplanation,
    scoreTrendRelevance,
    getTrendForecast,
    searchTrends,
    clearError,
    
    // Mutation states
    isAnalyzing: analyzeTrendsMutation.isLoading,
    isDetectingOpportunities: detectOpportunitiesMutation.isLoading,
    isGeneratingExplanation: generateAIExplanationMutation.isLoading,
    isScoringRelevance: scoreTrendRelevanceMutation.isLoading,
  };
} 