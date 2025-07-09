"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Input } from "../ui/input";
import { Separator } from "../ui/separator";
import { Progress } from "../ui/progress";
import {
  Search,
  TrendingUp,
  TrendingDown,
  Target,
  Eye,
  Globe,
  BarChart3,
  ArrowUp,
  ArrowDown,
  Minus,
  RefreshCw,
  Filter,
  Download,
  Calendar,
  Award,
  AlertTriangle,
  CheckCircle,
  Clock,
  ExternalLink,
  Zap,
  Activity,
  Users,
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
// Remove the useSEO import and replace with mock implementation
// import { useSEO } from "../../hooks/useSEO";

interface SEOPerformanceChartProps {
  timeframe?: "1h" | "24h" | "7d" | "30d" | "90d";
  showFilters?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
  maxHeight?: string;
  onKeywordSelected?: (keyword: string) => void;
  onPageSelected?: (pageId: string) => void;
}

interface KeywordRanking {
  keyword: string;
  currentRank: number;
  previousRank: number;
  change: number;
  searchVolume: number;
  difficulty: number;
  ctr: number;
  impressions: number;
  clicks: number;
  url: string;
  trend: "up" | "down" | "stable";
  opportunity: "high" | "medium" | "low";
}

interface SEOMetrics {
  organicTraffic: number;
  organicKeywords: number;
  averagePosition: number;
  clickThroughRate: number;
  totalImpressions: number;
  totalClicks: number;
  indexedPages: number;
  backlinks: number;
  domainAuthority: number;
  pageSpeed: number;
  coreWebVitals: {
    lcp: number;
    fid: number;
    cls: number;
  };
}

interface PagePerformance {
  url: string;
  title: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  change: number;
  traffic: number;
  conversions: number;
  revenue: number;
}

export function SEOPerformanceChart({
  timeframe = "30d",
  showFilters = true,
  autoRefresh = false,
  refreshInterval = 300000, // 5 minutes
  maxHeight = "400px",
  onKeywordSelected,
  onPageSelected,
}: SEOPerformanceChartProps) {
  const [selectedMetric, setSelectedMetric] = useState<string>("rankings");
  const [selectedKeyword, setSelectedKeyword] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"chart" | "table" | "grid">("chart");
  const [opportunityFilter, setOpportunityFilter] = useState<string>("all");

  // Mock SEO hook implementation
  const seoMetrics = undefined;
  const keywordRankings = undefined;
  const competitorAnalysis = undefined;
  const contentGaps = undefined;
  const isLoading = false;
  const error = false;
  const refreshData = () => {};
  const trackKeyword = async (keyword: string) => {};
  const generateSEOReport = () => {};

  // Mock data for demonstration
  const mockSEOMetrics: SEOMetrics = {
    organicTraffic: 124567,
    organicKeywords: 3456,
    averagePosition: 12.3,
    clickThroughRate: 3.2,
    totalImpressions: 2456789,
    totalClicks: 78654,
    indexedPages: 1234,
    backlinks: 5678,
    domainAuthority: 67,
    pageSpeed: 85,
    coreWebVitals: {
      lcp: 2.1,
      fid: 45,
      cls: 0.08,
    },
  };

  const mockKeywordData: KeywordRanking[] = [
    {
      keyword: "AI marketing automation",
      currentRank: 3,
      previousRank: 5,
      change: 2,
      searchVolume: 12000,
      difficulty: 75,
      ctr: 15.2,
      impressions: 45600,
      clicks: 6931,
      url: "/solutions/ai-marketing",
      trend: "up",
      opportunity: "high",
    },
    {
      keyword: "marketing automation platform",
      currentRank: 7,
      previousRank: 9,
      change: 2,
      searchVolume: 8500,
      difficulty: 82,
      ctr: 8.3,
      impressions: 23400,
      clicks: 1942,
      url: "/platform",
      trend: "up",
      opportunity: "medium",
    },
    {
      keyword: "automated email marketing",
      currentRank: 12,
      previousRank: 11,
      change: -1,
      searchVolume: 15600,
      difficulty: 68,
      ctr: 4.1,
      impressions: 67800,
      clicks: 2779,
      url: "/features/email",
      trend: "down",
      opportunity: "high",
    },
    {
      keyword: "social media automation",
      currentRank: 5,
      previousRank: 5,
      change: 0,
      searchVolume: 9200,
      difficulty: 72,
      ctr: 12.8,
      impressions: 34500,
      clicks: 4416,
      url: "/features/social",
      trend: "stable",
      opportunity: "medium",
    },
    {
      keyword: "content marketing ai",
      currentRank: 15,
      previousRank: 18,
      change: 3,
      searchVolume: 6700,
      difficulty: 65,
      ctr: 2.9,
      impressions: 28900,
      clicks: 838,
      url: "/solutions/content-ai",
      trend: "up",
      opportunity: "high",
    },
  ];

  const mockTrafficData = [
    {
      date: "2024-01-01",
      organicTraffic: 98000,
      keywords: 3200,
      avgPosition: 13.2,
      ctr: 2.8,
    },
    {
      date: "2024-01-08",
      organicTraffic: 102000,
      keywords: 3250,
      avgPosition: 12.8,
      ctr: 2.9,
    },
    {
      date: "2024-01-15",
      organicTraffic: 108000,
      keywords: 3300,
      avgPosition: 12.5,
      ctr: 3.0,
    },
    {
      date: "2024-01-22",
      organicTraffic: 115000,
      keywords: 3380,
      avgPosition: 12.1,
      ctr: 3.1,
    },
    {
      date: "2024-01-29",
      organicTraffic: 124567,
      keywords: 3456,
      avgPosition: 12.3,
      ctr: 3.2,
    },
  ];

  const mockTopPages: PagePerformance[] = [
    {
      url: "/solutions/ai-marketing",
      title: "AI Marketing Automation Solutions",
      clicks: 15678,
      impressions: 234567,
      ctr: 6.7,
      position: 4.2,
      change: 15.3,
      traffic: 18234,
      conversions: 234,
      revenue: 47680,
    },
    {
      url: "/platform",
      title: "Marketing Automation Platform",
      clicks: 12456,
      impressions: 189234,
      ctr: 6.6,
      position: 5.1,
      change: 8.9,
      traffic: 14567,
      conversions: 189,
      revenue: 38540,
    },
    {
      url: "/features/email",
      title: "Email Marketing Automation",
      clicks: 9876,
      impressions: 156789,
      ctr: 6.3,
      position: 6.8,
      change: -2.1,
      traffic: 11234,
      conversions: 156,
      revenue: 31200,
    },
  ];

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        refreshData();
      }, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, refreshData]);

  // Filter keywords
  const filteredKeywords = useMemo(() => {
    return mockKeywordData.filter((keyword) => {
      const matchesSearch =
        !searchQuery ||
        keyword.keyword.toLowerCase().includes(searchQuery.toLowerCase()) ||
        keyword.url.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesOpportunity =
        opportunityFilter === "all" ||
        keyword.opportunity === opportunityFilter;

      return matchesSearch && matchesOpportunity;
    });
  }, [mockKeywordData, searchQuery, opportunityFilter]);

  // Get trend color and icon
  const getTrendIcon = (trend: string, change: number) => {
    if (trend === "up" || change > 0) {
      return <ArrowUp className="w-4 h-4 text-green-500" />;
    } else if (trend === "down" || change < 0) {
      return <ArrowDown className="w-4 h-4 text-red-500" />;
    }
    return <Minus className="w-4 h-4 text-gray-500" />;
  };

  const getOpportunityColor = (opportunity: string) => {
    switch (opportunity) {
      case "high":
        return "text-green-500 bg-green-500/10 border-green-500/20";
      case "medium":
        return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20";
      case "low":
        return "text-blue-500 bg-blue-500/10 border-blue-500/20";
      default:
        return "text-gray-500 bg-gray-500/10 border-gray-500/20";
    }
  };

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty >= 80) return "text-red-500";
    if (difficulty >= 60) return "text-yellow-500";
    if (difficulty >= 40) return "text-blue-500";
    return "text-green-500";
  };

  // Handle actions
  const handleTrackKeyword = async (keyword: string) => {
    try {
      await trackKeyword(keyword);
      refreshData();
    } catch (error) {
      console.error("Failed to track keyword:", error);
    }
  };

  const handleExportReport = () => {
    const exportData = {
      metrics: mockSEOMetrics,
      keywords: filteredKeywords,
      topPages: mockTopPages,
      trafficData: mockTrafficData,
      timestamp: new Date().toISOString(),
      timeframe,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `seo-report-${timeframe}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const radarData = [
    {
      subject: "Traffic",
      value: (mockSEOMetrics.organicTraffic / 150000) * 100,
    },
    {
      subject: "Keywords",
      value: (mockSEOMetrics.organicKeywords / 5000) * 100,
    },
    { subject: "CTR", value: mockSEOMetrics.clickThroughRate * 20 },
    { subject: "Domain Authority", value: mockSEOMetrics.domainAuthority },
    { subject: "Page Speed", value: mockSEOMetrics.pageSpeed },
    { subject: "Backlinks", value: (mockSEOMetrics.backlinks / 8000) * 100 },
  ];

  if (error) {
    return (
      <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
        <CardContent className="p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            Failed to Load SEO Data
          </h3>
          <p className="text-gray-500 mb-4">
            There was an error loading the SEO performance data.
          </p>
          <Button onClick={refreshData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5 text-blue-500" />
              SEO Performance Analytics
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleExportReport}>
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refreshData()}
                disabled={isLoading}
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>

        {showFilters && (
          <CardContent className="pt-0">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-gray-500" />
                <Input
                  placeholder="Search keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64"
                />
              </div>
              <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                <SelectTrigger className="w-40">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rankings">Rankings</SelectItem>
                  <SelectItem value="traffic">Traffic</SelectItem>
                  <SelectItem value="performance">Performance</SelectItem>
                  <SelectItem value="opportunities">Opportunities</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={opportunityFilter}
                onValueChange={setOpportunityFilter}
              >
                <SelectTrigger className="w-36">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Opportunities</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        )}
      </Card>

      {/* SEO metrics overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4"
      >
        <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              <span className="font-medium text-sm">Organic Traffic</span>
            </div>
            <div className="text-2xl font-bold text-blue-500">
              {mockSEOMetrics.organicTraffic.toLocaleString()}
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
              <ArrowUp className="w-3 h-3 text-green-500" />
              +12.3% vs last period
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-green-500" />
              <span className="font-medium text-sm">Keywords</span>
            </div>
            <div className="text-2xl font-bold text-green-500">
              {mockSEOMetrics.organicKeywords.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500 mt-1">tracking keywords</div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-5 h-5 text-purple-500" />
              <span className="font-medium text-sm">Avg Position</span>
            </div>
            <div className="text-2xl font-bold text-purple-500">
              {mockSEOMetrics.averagePosition.toFixed(1)}
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
              <ArrowUp className="w-3 h-3 text-green-500" />
              +0.8 improvement
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-5 h-5 text-orange-500" />
              <span className="font-medium text-sm">CTR</span>
            </div>
            <div className="text-2xl font-bold text-orange-500">
              {mockSEOMetrics.clickThroughRate.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500 mt-1">click-through rate</div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Globe className="w-5 h-5 text-red-500" />
              <span className="font-medium text-sm">Domain Authority</span>
            </div>
            <div className="text-2xl font-bold text-red-500">
              {mockSEOMetrics.domainAuthority}
            </div>
            <div className="text-xs text-gray-500 mt-1">out of 100</div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              <span className="font-medium text-sm">Page Speed</span>
            </div>
            <div className="text-2xl font-bold text-yellow-500">
              {mockSEOMetrics.pageSpeed}
            </div>
            <div className="text-xs text-gray-500 mt-1">performance score</div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Main charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Traffic trends */}
        <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-sm">Organic Traffic Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={mockTrafficData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(0, 0, 0, 0.8)",
                    border: "none",
                    borderRadius: "8px",
                    color: "white",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="organicTraffic"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* SEO health radar */}
        <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-sm">SEO Health Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis angle={0} domain={[0, 100]} />
                <Radar
                  name="SEO Health"
                  dataKey="value"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Keywords table */}
      <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Keyword Rankings</CardTitle>
            <Select value={viewMode} onValueChange={setViewMode as any}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="table">Table</SelectItem>
                <SelectItem value="grid">Grid</SelectItem>
                <SelectItem value="chart">Chart</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === "table" ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left p-2">Keyword</th>
                    <th className="text-left p-2">Position</th>
                    <th className="text-left p-2">Change</th>
                    <th className="text-left p-2">Volume</th>
                    <th className="text-left p-2">Difficulty</th>
                    <th className="text-left p-2">CTR</th>
                    <th className="text-left p-2">Clicks</th>
                    <th className="text-left p-2">Opportunity</th>
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredKeywords.map((keyword, index) => (
                    <motion.tr
                      key={keyword.keyword}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <td className="p-2">
                        <div>
                          <div className="font-medium">{keyword.keyword}</div>
                          <div className="text-xs text-gray-500">
                            {keyword.url}
                          </div>
                        </div>
                      </td>
                      <td className="p-2">
                        <Badge variant="outline" className="text-xs">
                          #{keyword.currentRank}
                        </Badge>
                      </td>
                      <td className="p-2">
                        <div className="flex items-center gap-1">
                          {getTrendIcon(keyword.trend, keyword.change)}
                          <span
                            className={`text-xs ${
                              keyword.change > 0
                                ? "text-green-500"
                                : keyword.change < 0
                                  ? "text-red-500"
                                  : "text-gray-500"
                            }`}
                          >
                            {keyword.change > 0 ? "+" : ""}
                            {keyword.change}
                          </span>
                        </div>
                      </td>
                      <td className="p-2 text-xs">
                        {keyword.searchVolume.toLocaleString()}
                      </td>
                      <td className="p-2">
                        <span
                          className={`text-xs ${getDifficultyColor(keyword.difficulty)}`}
                        >
                          {keyword.difficulty}%
                        </span>
                      </td>
                      <td className="p-2 text-xs">{keyword.ctr.toFixed(1)}%</td>
                      <td className="p-2 text-xs">
                        {keyword.clicks.toLocaleString()}
                      </td>
                      <td className="p-2">
                        <Badge
                          variant="outline"
                          className={`text-xs ${getOpportunityColor(keyword.opportunity)}`}
                        >
                          {keyword.opportunity}
                        </Badge>
                      </td>
                      <td className="p-2">
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onKeywordSelected?.(keyword.keyword)}
                            className="h-6 px-2 text-xs"
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(keyword.url, "_blank")}
                            className="h-6 px-2 text-xs"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredKeywords.map((keyword, index) => (
                <motion.div
                  key={keyword.keyword}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="bg-gray-50 dark:bg-gray-800 border">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm leading-tight">
                            {keyword.keyword}
                          </h4>
                          <p className="text-xs text-gray-500 mt-1">
                            {keyword.url}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-xs ${getOpportunityColor(keyword.opportunity)}`}
                        >
                          {keyword.opportunity}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-gray-500">Position:</span>
                          <div className="font-medium">
                            #{keyword.currentRank}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">Change:</span>
                          <div className="flex items-center gap-1">
                            {getTrendIcon(keyword.trend, keyword.change)}
                            <span
                              className={`${
                                keyword.change > 0
                                  ? "text-green-500"
                                  : keyword.change < 0
                                    ? "text-red-500"
                                    : "text-gray-500"
                              }`}
                            >
                              {keyword.change > 0 ? "+" : ""}
                              {keyword.change}
                            </span>
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">Volume:</span>
                          <div className="font-medium">
                            {keyword.searchVolume.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">CTR:</span>
                          <div className="font-medium">
                            {keyword.ctr.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={filteredKeywords.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis
                  dataKey="keyword"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(0, 0, 0, 0.8)",
                    border: "none",
                    borderRadius: "8px",
                    color: "white",
                  }}
                />
                <Bar dataKey="currentRank" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          )}

          {filteredKeywords.length === 0 && (
            <div className="text-center py-12">
              <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No Keywords Found
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Try adjusting your search criteria or add new keywords to track.
              </p>
              <Button onClick={() => setSearchQuery("")}>
                <Filter className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default SEOPerformanceChart;
