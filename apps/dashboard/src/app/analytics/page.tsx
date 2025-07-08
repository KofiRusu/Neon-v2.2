"use client";

import React, { useState, useEffect } from "react";
import { useAgentMetrics } from "../../hooks/useAgentMetrics";
import { useCampaignAnalytics } from "../../hooks/useCampaignAnalytics";
import {
  ChartBarIcon,
  CpuChipIcon,
  RocketLaunchIcon,
  TrendingUpIcon,
  EyeIcon,
  CalendarIcon,
  FunnelIcon,
  UserGroupIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

interface TimeRange {
  label: string;
  value: string;
  days: number;
}

interface MetricCard {
  title: string;
  value: string;
  change: string;
  changeType: "positive" | "negative" | "neutral";
  icon: React.ComponentType<any>;
  color: string;
  loading?: boolean;
}

export default function AnalyticsPage(): JSX.Element {
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>("7d");
  const [currentTime, setCurrentTime] = useState(new Date());

  // Fetch real data from backend
  const { metrics: agentMetrics, isLoading: isAgentLoading } =
    useAgentMetrics(selectedTimeRange);
  const { analytics: campaignAnalytics, isLoading: isCampaignLoading } =
    useCampaignAnalytics(selectedTimeRange);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeRanges: TimeRange[] = [
    { label: "Last 7 days", value: "7d", days: 7 },
    { label: "Last 30 days", value: "30d", days: 30 },
    { label: "Last 90 days", value: "90d", days: 90 },
    { label: "Last year", value: "1y", days: 365 },
  ];

  const metrics: MetricCard[] = [
    {
      title: "Total Campaigns",
      value: isCampaignLoading
        ? "..."
        : campaignAnalytics.totalCampaigns.toString(),
      change: isCampaignLoading
        ? "..."
        : `${campaignAnalytics.activeCampaigns} active`,
      changeType: "positive",
      icon: RocketLaunchIcon,
      color: "neon-blue",
      loading: isCampaignLoading,
    },
    {
      title: "Active AI Agents",
      value: isAgentLoading ? "..." : agentMetrics.activeAgents.toString(),
      change: isAgentLoading ? "..." : `${agentMetrics.totalAgents} total`,
      changeType: "positive",
      icon: CpuChipIcon,
      color: "neon-purple",
      loading: isAgentLoading,
    },
    {
      title: "Conversion Rate",
      value: isCampaignLoading
        ? "..."
        : `${campaignAnalytics.averageConversionRate.toFixed(1)}%`,
      change: isCampaignLoading
        ? "..."
        : `${campaignAnalytics.averageCTR.toFixed(1)}% CTR`,
      changeType: "positive",
      icon: TrendingUpIcon,
      color: "neon-green",
      loading: isCampaignLoading,
    },
    {
      title: "Revenue Generated",
      value: isCampaignLoading
        ? "..."
        : `$${(campaignAnalytics.totalRevenue / 1000).toFixed(0)}K`,
      change: isAgentLoading
        ? "..."
        : `${agentMetrics.successRate.toFixed(1)}% success rate`,
      changeType: "positive",
      icon: ArrowTrendingUpIcon,
      color: "neon-pink",
      loading: isCampaignLoading || isAgentLoading,
    },
  ];

  const isLoading = isAgentLoading || isCampaignLoading;

  return (
    <div className="min-h-screen bg-space-gray">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <ChartBarIcon className="h-8 w-8 text-blue-400" />
                Analytics Dashboard
              </h1>
              <p className="text-gray-400 mt-1">
                Real-time insights and performance metrics
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {isLoading && (
                <div className="flex items-center text-gray-400">
                  <ArrowPathIcon className="h-4 w-4 animate-spin mr-2" />
                  Loading...
                </div>
              )}
              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value)}
                className="bg-gray-800 border border-gray-700 text-white px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {timeRanges.map((range) => (
                  <option key={range.value} value={range.value}>
                    {range.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <div
                key={metric.title}
                className="stat-card group hover:scale-105 transition-transform"
              >
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-12 h-12 bg-gradient-to-br from-${metric.color}-500 to-${metric.color}-600 rounded-xl flex items-center justify-center shadow-lg`}
                  >
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      metric.changeType === "positive"
                        ? "bg-green-500/20 text-green-400 border border-green-500/30"
                        : metric.changeType === "negative"
                          ? "bg-red-500/20 text-red-400 border border-red-500/30"
                          : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                    }`}
                  >
                    {metric.change}
                  </div>
                </div>
                <div>
                  <p className="text-gray-400 text-sm font-medium mb-1">
                    {metric.title}
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-3xl font-bold text-white">
                      {metric.loading ? (
                        <div className="w-16 h-8 bg-gray-700 rounded animate-pulse" />
                      ) : (
                        metric.value
                      )}
                    </p>
                    {metric.loading && (
                      <ArrowPathIcon className="h-4 w-4 animate-spin text-gray-400" />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="glass-strong p-6 rounded-2xl border border-gray-800">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <TrendingUpIcon className="h-5 w-5 text-blue-400" />
              Campaign Performance
            </h3>
            <div className="h-64 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <ChartBarIcon className="h-16 w-16 mx-auto mb-4 text-gray-600" />
                <p>Performance chart visualization</p>
                <p className="text-sm text-gray-500 mt-2">
                  {!isCampaignLoading &&
                  campaignAnalytics.recentCampaigns.length > 0
                    ? `${campaignAnalytics.recentCampaigns.length} campaigns tracked`
                    : "Loading campaign data..."}
                </p>
              </div>
            </div>
          </div>

          <div className="glass-strong p-6 rounded-2xl border border-gray-800">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <CpuChipIcon className="h-5 w-5 text-purple-400" />
              Agent Activity
            </h3>
            <div className="h-64 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <CpuChipIcon className="h-16 w-16 mx-auto mb-4 text-gray-600" />
                <p>Agent activity visualization</p>
                <p className="text-sm text-gray-500 mt-2">
                  {!isAgentLoading && agentMetrics.totalExecutions > 0
                    ? `${agentMetrics.totalExecutions} total executions`
                    : "Loading agent data..."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 glass-strong p-6 rounded-2xl border border-gray-800">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <ArrowTrendingUpIcon className="h-5 w-5 text-green-400" />
              Revenue Analytics
            </h3>
            <div className="h-80 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <TrendingUpIcon className="h-16 w-16 mx-auto mb-4 text-gray-600" />
                <p>Revenue analytics visualization</p>
                <p className="text-sm text-gray-500 mt-2">
                  {!isCampaignLoading
                    ? `$${(campaignAnalytics.totalRevenue / 1000).toFixed(0)}K total revenue tracked`
                    : "Loading revenue data..."}
                </p>
              </div>
            </div>
          </div>

          <div className="glass-strong p-6 rounded-2xl border border-gray-800">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <CheckCircleIcon className="h-5 w-5 text-yellow-400" />
              Top Performing
            </h3>
            <div className="space-y-4">
              {isAgentLoading
                ? // Loading skeletons
                  Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 glass rounded-lg"
                    >
                      <div className="w-24 h-4 bg-gray-700 rounded animate-pulse" />
                      <div className="w-12 h-4 bg-gray-700 rounded animate-pulse" />
                    </div>
                  ))
                : agentMetrics.topPerformingAgents.map((agent, index) => (
                    <div
                      key={agent.name}
                      className="flex items-center justify-between p-3 glass rounded-lg hover:bg-gray-800/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-400 to-purple-400" />
                        <span className={`font-medium ${agent.color}`}>
                          {agent.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-bold">
                          {agent.performance.toFixed(1)}%
                        </span>
                        {index === 0 && (
                          <CheckCircleIcon className="h-4 w-4 text-yellow-400" />
                        )}
                      </div>
                    </div>
                  ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
