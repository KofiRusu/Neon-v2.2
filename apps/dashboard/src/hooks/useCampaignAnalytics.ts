import { api } from "../utils/trpc";
import { useMemo } from "react";
import type { RouterOutputs } from "../utils/trpc";

interface CampaignAnalyticsData {
  totalCampaigns: number;
  activeCampaigns: number;
  completedCampaigns: number;
  totalRevenue: number;
  averageConversionRate: number;
  averageCTR: number;
  recentCampaigns: Array<{
    id: string;
    name: string;
    status: string;
    performance: number;
    budget: number;
    startDate: Date;
  }>;
}

type CampaignData = RouterOutputs["campaign"]["getCampaigns"];

export function useCampaignAnalytics(timeRange: string = "7d") {
  const { data: campaignsData, isLoading: isCampaignsLoading } =
    api.campaign.getCampaigns.useQuery({
      limit: 50,
      sortBy: "updated",
    });

  const { data: campaignStats, isLoading: isStatsLoading } =
    api.campaign.getStats?.useQuery() || { data: null, isLoading: false };

  const analytics = useMemo((): CampaignAnalyticsData => {
    if (!campaignsData?.success) {
      return {
        totalCampaigns: 0,
        activeCampaigns: 0,
        completedCampaigns: 0,
        totalRevenue: 0,
        averageConversionRate: 0,
        averageCTR: 0,
        recentCampaigns: [],
      };
    }

    const campaigns = campaignsData.data;
    const totalCampaigns = campaigns.length;
    const activeCampaigns = campaigns.filter(
      (c: any) => c.status === "running",
    ).length;
    const completedCampaigns = campaigns.filter(
      (c: any) => c.status === "completed",
    ).length;

    // Calculate aggregated metrics
    const totalRevenue = campaigns.reduce((sum: number, campaign: any) => {
      // Estimate revenue based on budget and conversion rate
      const estimatedRevenue = campaign.budget * (campaign.kpis.cvr || 1) * 2; // 2x return assumption
      return sum + estimatedRevenue;
    }, 0);

    const averageConversionRate =
      campaigns.reduce((sum: number, campaign: any) => {
        return sum + (campaign.kpis.cvr || 0);
      }, 0) / totalCampaigns;

    const averageCTR =
      campaigns.reduce((sum: number, campaign: any) => {
        return sum + (campaign.kpis.ctr || 0);
      }, 0) / totalCampaigns;

    const recentCampaigns = campaigns.slice(0, 5).map((campaign: any) => ({
      id: campaign.id,
      name: campaign.name,
      status: campaign.status,
      performance: campaign.kpis.cvr || 0,
      budget: campaign.budget,
      startDate: campaign.startDate,
    }));

    return {
      totalCampaigns,
      activeCampaigns,
      completedCampaigns,
      totalRevenue,
      averageConversionRate,
      averageCTR,
      recentCampaigns,
    };
  }, [campaignsData]);

  const isLoading = isCampaignsLoading || isStatsLoading;

  return {
    analytics,
    isLoading,
    error: null,
  };
}
