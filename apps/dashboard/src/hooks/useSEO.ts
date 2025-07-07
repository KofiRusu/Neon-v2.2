import { api } from "../utils/trpc";
import { toast } from "react-hot-toast";

/**
 * Custom hooks for SEO data management using TASK 005 endpoints
 */

/**
 * Hook to fetch historical SEO analyses for a campaign
 */
export function useHistoricalSEOAnalyses(campaignId: string, limit?: number) {
  return api.seo.getHistoricalAnalyses.useQuery(
    { campaignId, limit },
    {
      enabled: !!campaignId,
      staleTime: 5 * 60 * 1000, // 5 minutes
      onError: (error) => {
        toast.error(`Failed to fetch SEO history: ${error.message}`);
      },
    }
  );
}

/**
 * Hook to fetch keyword suggestions for a campaign
 */
export function useKeywordSuggestions(campaignId: string, limit?: number) {
  return api.seo.getCampaignKeywords.useQuery(
    { campaignId, limit },
    {
      enabled: !!campaignId,
      staleTime: 10 * 60 * 1000, // 10 minutes
      onError: (error) => {
        toast.error(`Failed to fetch keywords: ${error.message}`);
      },
    }
  );
}

/**
 * Hook to fetch SEO performance trends for a campaign
 */
export function useSEOPerformanceTrends(campaignId: string, days?: number) {
  return api.seo.getPerformanceTrends.useQuery(
    { campaignId, days },
    {
      enabled: !!campaignId,
      staleTime: 2 * 60 * 1000, // 2 minutes
      onError: (error) => {
        toast.error(`Failed to fetch performance trends: ${error.message}`);
      },
    }
  );
}

/**
 * Hook for bulk URL analysis
 */
export function useBulkAnalyzeURLs() {
  return api.seo.bulkAnalyzeURLs.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        const successCount = data.data?.summary?.successful || 0;
        const totalCount = data.data?.summary?.total || 0;
        toast.success(`Bulk analysis completed: ${successCount}/${totalCount} URLs analyzed successfully`);
      }
    },
    onError: (error) => {
      toast.error(`Bulk analysis failed: ${error.message}`);
    },
  });
}

/**
 * Hook for single URL SEO analysis with persistence
 */
export function useSEOAnalyzeContent() {
  return api.seo.analyzeWithPersistence.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success("SEO analysis completed and saved!");
      }
    },
    onError: (error) => {
      toast.error(`SEO analysis failed: ${error.message}`);
    },
  });
}

/**
 * Hook to get SEO agent status and capabilities
 */
export function useSEOAgentStatus() {
  return api.seo.getAgentStatus.useQuery(undefined, {
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000, // Refresh every 30 seconds
  });
}

/**
 * SEO ALERTS HOOKS - TASK 007
 */

/**
 * Hook to fetch SEO alerts for a campaign
 */
export function useSEOAlerts(
  campaignId?: string,
  options?: {
    severity?: ("info" | "warning" | "critical")[];
    limit?: number;
    isResolved?: boolean;
  }
) {
  return api.seo.getSEOAlerts.useQuery(
    {
      campaignId,
      severity: options?.severity,
      limit: options?.limit || 50,
      isResolved: options?.isResolved,
    },
    {
      enabled: !!campaignId || campaignId === undefined, // Allow fetching all alerts if campaignId is undefined
      staleTime: 2 * 60 * 1000, // 2 minutes
      refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes for real-time alerts
      onError: (error) => {
        toast.error(`Failed to fetch SEO alerts: ${error.message}`);
      },
    }
  );
}

/**
 * Hook to generate SEO alerts for a campaign
 */
export function useGenerateSEOAlerts() {
  return api.seo.generateSEOAlerts.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        const alertCount = data.alerts?.length || 0;
        const criticalCount = data.summary?.criticalAlerts || 0;
        
        if (criticalCount > 0) {
          toast.error(`${alertCount} SEO alerts generated, including ${criticalCount} critical issues!`);
        } else if (alertCount > 0) {
          toast.success(`${alertCount} SEO alerts generated successfully`);
        } else {
          toast.success("No SEO issues found - all good!");
        }
      }
    },
    onError: (error) => {
      toast.error(`Failed to generate SEO alerts: ${error.message}`);
    },
  });
}

/**
 * Hook to mark SEO alert as resolved
 */
export function useMarkSEOAlertResolved() {
  return api.seo.markSEOAlertResolved.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Alert marked as resolved");
      }
    },
    onError: (error) => {
      toast.error(`Failed to resolve alert: ${error.message}`);
    },
  });
}

/**
 * Hook to mark SEO alert as read
 */
export function useMarkSEOAlertRead() {
  return api.seo.markSEOAlertRead.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        // Silent success - don't show toast for read status
      }
    },
    onError: (error) => {
      toast.error(`Failed to mark alert as read: ${error.message}`);
    },
  });
}

/**
 * Hook to fetch SEO alert trends and analytics
 */
export function useSEOAlertTrends(
  campaignId?: string,
  timeframe?: "7d" | "30d" | "90d"
) {
  return api.seo.getSEOAlertTrends.useQuery(
    {
      campaignId,
      timeframe: timeframe || "30d",
    },
    {
      enabled: !!campaignId || campaignId === undefined,
      staleTime: 10 * 60 * 1000, // 10 minutes
      onError: (error) => {
        toast.error(`Failed to fetch alert trends: ${error.message}`);
      },
    }
  );
}

/**
 * Hook to get unresolved SEO alerts count (for notification badges)
 */
export function useSEOAlertsCount(campaignId?: string) {
  const { data: alertsData } = useSEOAlerts(campaignId, { 
    isResolved: false, 
    limit: 100 
  });
  
  return {
    total: alertsData?.summary?.unresolved || 0,
    critical: alertsData?.summary?.critical || 0,
    warning: alertsData?.summary?.warning || 0,
    info: alertsData?.summary?.info || 0,
  };
}

/**
 * Hook to automatically refresh alerts when campaign changes
 */
export function useSEOAlertsRefresh(campaignId?: string) {
  const utils = api.useUtils();
  
  const refreshAlerts = async () => {
    await utils.seo.getSEOAlerts.invalidate();
    await utils.seo.getSEOAlertTrends.invalidate();
  };
  
  return { refreshAlerts };
}

/**
 * Types for the hooks (inferred from tRPC)
 */
export type HistoricalSEOAnalysis = NonNullable<
  ReturnType<typeof useHistoricalSEOAnalyses>['data']
>['data'][0];

export type KeywordSuggestion = NonNullable<
  ReturnType<typeof useKeywordSuggestions>['data']
>['data'][0];

export type SEOPerformanceTrends = NonNullable<
  ReturnType<typeof useSEOPerformanceTrends>['data']
>['data'];

export type BulkAnalysisResult = NonNullable<
  ReturnType<typeof useBulkAnalyzeURLs>['data']
>['data']; 

/**
 * SEO Alerts Types - TASK 007
 */
export type SEOAlert = NonNullable<
  ReturnType<typeof useSEOAlerts>['data']
>['alerts'][0];

export type SEOAlertSummary = NonNullable<
  ReturnType<typeof useSEOAlerts>['data']
>['summary'];

export type SEOAlertTrends = NonNullable<
  ReturnType<typeof useSEOAlertTrends>['data']
>['trends'];

export type SEOAlertsCount = ReturnType<typeof useSEOAlertsCount>;