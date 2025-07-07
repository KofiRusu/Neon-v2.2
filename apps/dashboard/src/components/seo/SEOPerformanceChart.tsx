"use client";

import { useMemo } from "react";
import { Line, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
} from "chart.js";
import { format, parseISO } from "date-fns";
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  TagIcon,
} from "@heroicons/react/24/outline";
import { useSEOPerformanceTrends, type SEOPerformanceTrends } from "../../hooks/useSEO";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

interface SEOPerformanceChartProps {
  campaignId: string;
  days?: number;
  className?: string;
}

export default function SEOPerformanceChart({ 
  campaignId, 
  days = 30,
  className 
}: SEOPerformanceChartProps) {
  // Fetch performance trends
  const { data: trends, isLoading, error, refetch } = useSEOPerformanceTrends(campaignId, days);

  // Process chart data
  const chartData = useMemo(() => {
    if (!trends?.success || !trends.data) {
      return null;
    }

    const data = trends.data;
    
    // Prepare line chart data for score history
    const lineData = {
      labels: data.scoreHistory.map(item => format(parseISO(item.date), 'MMM dd')),
      datasets: [
        {
          label: 'SEO Score',
          data: data.scoreHistory.map(item => item.score),
          borderColor: '#3B82F6', // neon-blue
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#3B82F6',
          pointBorderColor: '#1E40AF',
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8,
        },
      ],
    };

    // Prepare doughnut chart data for common issues
    const issueLabels = data.commonIssues.map(issue => issue.type);
    const issueCounts = data.commonIssues.map(issue => issue.count);
    
    const doughnutData = {
      labels: issueLabels,
      datasets: [
        {
          data: issueCounts,
          backgroundColor: [
            '#EF4444', // red-500
            '#F59E0B', // amber-500
            '#3B82F6', // blue-500
            '#10B981', // emerald-500
            '#8B5CF6', // violet-500
            '#F97316', // orange-500
          ],
          borderColor: '#1F2937',
          borderWidth: 2,
        },
      ],
    };

    return { lineData, doughnutData, trendsData: data };
  }, [trends]);

  // Chart options
  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#F9FAFB',
        bodyColor: '#F9FAFB',
        borderColor: '#374151',
        borderWidth: 1,
        displayColors: false,
        callbacks: {
          title: (context: any) => {
            const dataIndex = context[0]?.dataIndex;
            if (dataIndex !== undefined && chartData?.trendsData?.scoreHistory[dataIndex]) {
              const item = chartData.trendsData.scoreHistory[dataIndex];
              return `${format(parseISO(item.date), 'PPP')}`;
            }
            return '';
          },
          label: (context: any) => {
            const dataIndex = context.dataIndex;
            if (dataIndex !== undefined && chartData?.trendsData?.scoreHistory[dataIndex]) {
              const item = chartData.trendsData.scoreHistory[dataIndex];
              return [
                `Score: ${item.score}/100`,
                `URL: ${item.url}`,
              ];
            }
            return `Score: ${context.parsed.y}/100`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(55, 65, 81, 0.3)',
        },
        ticks: {
          color: '#9CA3AF',
        },
      },
      y: {
        min: 0,
        max: 100,
        grid: {
          color: 'rgba(55, 65, 81, 0.3)',
        },
        ticks: {
          color: '#9CA3AF',
          callback: (value: any) => `${value}`,
        },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#F9FAFB',
          padding: 15,
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#F9FAFB',
        bodyColor: '#F9FAFB',
        borderColor: '#374151',
        borderWidth: 1,
      },
    },
  };

  // Helper functions
  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) {
      return <ArrowTrendingUpIcon className="h-5 w-5 text-green-400" />;
    } else if (current < previous) {
      return <ArrowTrendingDownIcon className="h-5 w-5 text-red-400" />;
    } else {
      return <MinusIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const getTrendColor = (current: number, previous: number) => {
    if (current > previous) return "text-green-400";
    if (current < previous) return "text-red-400";
    return "text-gray-400";
  };

  const getScoreStatus = (score: number) => {
    if (score >= 80) return { text: "Excellent", color: "text-green-400", bg: "bg-green-400/20" };
    if (score >= 60) return { text: "Good", color: "text-yellow-400", bg: "bg-yellow-400/20" };
    return { text: "Needs Work", color: "text-red-400", bg: "bg-red-400/20" };
  };

  if (isLoading) {
    return (
      <div className={`glass-strong p-6 rounded-2xl ${className}`}>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-blue"></div>
          <span className="ml-3 text-primary">Loading performance data...</span>
        </div>
      </div>
    );
  }

  if (error || !chartData) {
    return (
      <div className={`glass-strong p-6 rounded-2xl ${className}`}>
        <div className="text-center py-12">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-primary mb-2">Unable to Load Performance Data</h3>
          <p className="text-secondary mb-4">
            {error?.message || "No performance data available for this time period."}
          </p>
          <button
            onClick={() => refetch()}
            className="btn-neon text-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const { trendsData } = chartData;
  const scoreStatus = getScoreStatus(trendsData.averageScore);
  const hasHistory = trendsData.scoreHistory.length > 1;
  const scoreChange = hasHistory 
    ? trendsData.averageScore - trendsData.scoreHistory[trendsData.scoreHistory.length - 2]?.score 
    : 0;

  return (
    <div className={`glass-strong p-6 rounded-2xl ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-neon-purple rounded-xl flex items-center justify-center">
            <ChartBarIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-primary">SEO Performance Trends</h2>
            <p className="text-secondary text-sm">Last {days} days</p>
          </div>
        </div>
        <button
          onClick={() => refetch()}
          className="btn-neon-purple text-sm"
        >
          Refresh
        </button>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {/* Average Score */}
        <div className="bg-surface/50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-secondary text-sm">Average Score</span>
            {hasHistory && getTrendIcon(trendsData.averageScore, trendsData.scoreHistory[trendsData.scoreHistory.length - 2]?.score || 0)}
          </div>
          <div className="flex items-center space-x-2">
            <span className={`text-2xl font-bold ${scoreStatus.color}`}>
              {trendsData.averageScore.toFixed(1)}
            </span>
            <span className={`px-2 py-1 text-xs rounded-full ${scoreStatus.bg} ${scoreStatus.color}`}>
              {scoreStatus.text}
            </span>
          </div>
          {hasHistory && (
            <p className={`text-xs mt-1 ${getTrendColor(trendsData.averageScore, trendsData.scoreHistory[trendsData.scoreHistory.length - 2]?.score || 0)}`}>
              {scoreChange > 0 ? '+' : ''}{scoreChange.toFixed(1)} from last analysis
            </p>
          )}
        </div>

        {/* Total Analyses */}
        <div className="bg-surface/50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-secondary text-sm">Analyses</span>
            <SparklesIcon className="h-5 w-5 text-neon-blue" />
          </div>
          <span className="text-2xl font-bold text-primary">
            {trendsData.scoreHistory.length}
          </span>
          <p className="text-xs text-secondary mt-1">
            Pages analyzed
          </p>
        </div>

        {/* Top Keywords */}
        <div className="bg-surface/50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-secondary text-sm">Keywords</span>
            <TagIcon className="h-5 w-5 text-neon-green" />
          </div>
          <span className="text-2xl font-bold text-primary">
            {trendsData.topKeywords.length}
          </span>
          <p className="text-xs text-secondary mt-1">
            Unique keywords
          </p>
        </div>

        {/* Issues Found */}
        <div className="bg-surface/50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-secondary text-sm">Issues</span>
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
          </div>
          <span className="text-2xl font-bold text-primary">
            {trendsData.commonIssues.reduce((sum, issue) => sum + issue.count, 0)}
          </span>
          <p className="text-xs text-secondary mt-1">
            Total issues
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Score Trend Chart */}
        <div>
          <h3 className="text-lg font-semibold text-primary mb-4">SEO Score Over Time</h3>
          {trendsData.scoreHistory.length > 0 ? (
            <div className="h-64 bg-surface/30 rounded-lg p-4">
              <Line data={chartData.lineData} options={lineOptions} />
            </div>
          ) : (
            <div className="h-64 bg-surface/30 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <ChartBarIcon className="h-12 w-12 text-muted mx-auto mb-2" />
                <p className="text-secondary">No score history available</p>
              </div>
            </div>
          )}
        </div>

        {/* Issues Breakdown */}
        <div>
          <h3 className="text-lg font-semibold text-primary mb-4">Common Issues</h3>
          {trendsData.commonIssues.length > 0 ? (
            <div className="h-64 bg-surface/30 rounded-lg p-4">
              <Doughnut data={chartData.doughnutData} options={doughnutOptions} />
            </div>
          ) : (
            <div className="h-64 bg-surface/30 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <ExclamationTriangleIcon className="h-12 w-12 text-muted mx-auto mb-2" />
                <p className="text-secondary">No issues data available</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Top Keywords List */}
      {trendsData.topKeywords.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-primary mb-4">Top Performing Keywords</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trendsData.topKeywords.slice(0, 6).map((keyword, index) => (
              <div key={index} className="bg-surface/50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-primary truncate">{keyword.keyword}</span>
                  <span className="text-neon-blue text-sm font-semibold">
                    {keyword.frequency}x
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-secondary">Avg Relevance</span>
                  <span className="text-primary font-medium">
                    {keyword.avgRelevance.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Insights */}
      <div className="mt-8 p-4 bg-gradient-to-r from-neon-blue/10 to-neon-purple/10 rounded-lg border border-neon-blue/20">
        <div className="flex items-center space-x-2 mb-2">
          <SparklesIcon className="h-5 w-5 text-neon-blue" />
          <h4 className="font-semibold text-primary">AI Insights</h4>
        </div>
        <p className="text-secondary text-sm">
          {trendsData.averageScore >= 80 
            ? "🎉 Excellent SEO performance! Your content is well-optimized and search-engine friendly."
            : trendsData.averageScore >= 60
            ? "📈 Good SEO foundation. Focus on addressing common issues to improve rankings."
            : "⚠️ SEO needs improvement. Consider optimizing content structure, keywords, and technical elements."
          }
          {hasHistory && scoreChange > 5 && " Your scores are trending upward - keep up the great work!"}
          {hasHistory && scoreChange < -5 && " Scores have declined recently - review recent changes."}
        </p>
      </div>
    </div>
  );
} 