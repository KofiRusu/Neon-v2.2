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
  Brain,
  TrendingUp,
  TrendingDown,
  Lightbulb,
  Target,
  Zap,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  Filter,
  Search,
  RefreshCw,
  BookOpen,
  Award,
  Activity,
  Users,
  ArrowUp,
  ArrowDown,
  Minus,
  Star,
  Eye,
  Settings,
  Download,
  ArrowRight,
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
} from "recharts";
import { useLearning } from "../../hooks/useLearning";

interface FeedbackInsightsPanelProps {
  autoRefresh?: boolean;
  refreshInterval?: number;
  showFilters?: boolean;
  maxHeight?: string;
  onInsightSelected?: (insightId: string) => void;
  onRecommendationApplied?: (recommendationId: string) => void;
}

interface LearningInsight {
  id: string;
  type:
    | "performance"
    | "optimization"
    | "pattern"
    | "anomaly"
    | "recommendation";
  title: string;
  description: string;
  confidence: number;
  impact: "low" | "medium" | "high" | "critical";
  category: string;
  agentName?: string;
  campaignId?: string;
  metrics: {
    beforeValue?: number;
    afterValue?: number;
    improvement?: number;
    trend?: "up" | "down" | "stable";
  };
  recommendations: string[];
  evidence: any[];
  appliedAt?: Date;
  createdAt: Date;
  priority: number;
}

interface PerformanceTrend {
  date: string;
  accuracy: number;
  efficiency: number;
  cost: number;
  satisfaction: number;
  learningRate: number;
}

interface LearningMetrics {
  totalInsights: number;
  appliedRecommendations: number;
  averageImprovement: number;
  learningVelocity: number;
  confidenceScore: number;
  adaptationRate: number;
}

export default function FeedbackInsightsPanel({
  autoRefresh = false,
  refreshInterval = 30000,
  showFilters = true,
  maxHeight = "600px",
  onInsightSelected,
  onRecommendationApplied,
}: FeedbackInsightsPanelProps) {
  const [selectedInsightType, setSelectedInsightType] = useState<string>("all");
  const [selectedImpact, setSelectedImpact] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list" | "timeline">(
    "grid",
  );
  const [timeRange, setTimeRange] = useState<"1h" | "24h" | "7d" | "30d">(
    "24h",
  );
  const [selectedInsight, setSelectedInsight] =
    useState<LearningInsight | null>(null);

  // Use the learning hook
  const {
    insights,
    performanceMetrics,
    learningProgress,
    recommendations,
    trendAnalysis,
    agentFeedback,
    isLoading,
    error,
    refreshData,
    applyRecommendation,
    dismissInsight,
    triggerLearningUpdate,
  } = useLearning({
    timeframe: timeRange,
    autoRefresh,
    refreshInterval,
  });

  // Mock data for demonstration
  const mockTrendData: PerformanceTrend[] = [
    {
      date: "2024-01-01",
      accuracy: 85,
      efficiency: 78,
      cost: 0.12,
      satisfaction: 92,
      learningRate: 15,
    },
    {
      date: "2024-01-02",
      accuracy: 87,
      efficiency: 82,
      cost: 0.11,
      satisfaction: 94,
      learningRate: 18,
    },
    {
      date: "2024-01-03",
      accuracy: 89,
      efficiency: 85,
      cost: 0.1,
      satisfaction: 96,
      learningRate: 22,
    },
    {
      date: "2024-01-04",
      accuracy: 91,
      efficiency: 88,
      cost: 0.09,
      satisfaction: 97,
      learningRate: 25,
    },
    {
      date: "2024-01-05",
      accuracy: 93,
      efficiency: 90,
      cost: 0.08,
      satisfaction: 98,
      learningRate: 28,
    },
    {
      date: "2024-01-06",
      accuracy: 94,
      efficiency: 92,
      cost: 0.07,
      satisfaction: 99,
      learningRate: 30,
    },
    {
      date: "2024-01-07",
      accuracy: 96,
      efficiency: 94,
      cost: 0.06,
      satisfaction: 99,
      learningRate: 32,
    },
  ];

  const mockMetrics: LearningMetrics = {
    totalInsights: 127,
    appliedRecommendations: 85,
    averageImprovement: 23.5,
    learningVelocity: 8.2,
    confidenceScore: 94.3,
    adaptationRate: 76.8,
  };

  const mockInsights: LearningInsight[] = [
    {
      id: "insight-1",
      type: "optimization",
      title: "Content Agent Performance Boost",
      description:
        "AI discovered that content generation with emotional keywords increases engagement by 34%",
      confidence: 94,
      impact: "high",
      category: "Content Strategy",
      agentName: "Content Agent",
      metrics: {
        beforeValue: 67,
        afterValue: 89,
        improvement: 34,
        trend: "up",
      },
      recommendations: [
        "Integrate emotional sentiment analysis in content pipeline",
        "Increase use of action-oriented language",
        "Focus on storytelling elements in blog posts",
      ],
      evidence: [],
      createdAt: new Date(),
      priority: 9,
    },
    {
      id: "insight-2",
      type: "pattern",
      title: "Social Media Timing Optimization",
      description: "Peak engagement occurs at 2PM and 7PM for target audience",
      confidence: 87,
      impact: "medium",
      category: "Social Media",
      agentName: "Social Agent",
      metrics: {
        beforeValue: 45,
        afterValue: 72,
        improvement: 60,
        trend: "up",
      },
      recommendations: [
        "Schedule primary posts at optimal times",
        "Create time-zone specific posting strategies",
        "Adjust content calendar to peak hours",
      ],
      evidence: [],
      createdAt: new Date(),
      priority: 7,
    },
    {
      id: "insight-3",
      type: "anomaly",
      title: "Email Open Rate Anomaly Detected",
      description:
        "Unusual spike in email opens on mobile devices during weekends",
      confidence: 91,
      impact: "medium",
      category: "Email Marketing",
      agentName: "Email Agent",
      metrics: {
        beforeValue: 22,
        afterValue: 38,
        improvement: 73,
        trend: "up",
      },
      recommendations: [
        "Optimize email templates for mobile viewing",
        "Increase weekend email frequency",
        "A/B test mobile-first subject lines",
      ],
      evidence: [],
      createdAt: new Date(),
      priority: 6,
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

  // Filter insights
  const filteredInsights = useMemo(() => {
    return mockInsights.filter((insight) => {
      const matchesType =
        selectedInsightType === "all" || insight.type === selectedInsightType;
      const matchesImpact =
        selectedImpact === "all" || insight.impact === selectedImpact;
      const matchesSearch =
        !searchQuery ||
        insight.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        insight.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        insight.category.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesType && matchesImpact && matchesSearch;
    });
  }, [mockInsights, selectedInsightType, selectedImpact, searchQuery]);

  // Get impact color
  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "critical":
        return "text-red-500 bg-red-500/10 border-red-500/20";
      case "high":
        return "text-orange-500 bg-orange-500/10 border-orange-500/20";
      case "medium":
        return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20";
      case "low":
        return "text-blue-500 bg-blue-500/10 border-blue-500/20";
      default:
        return "text-gray-500 bg-gray-500/10 border-gray-500/20";
    }
  };

  // Get insight type icon
  const getInsightIcon = (type: string) => {
    switch (type) {
      case "optimization":
        return <Zap className="w-5 h-5 text-yellow-500" />;
      case "pattern":
        return <Target className="w-5 h-5 text-blue-500" />;
      case "anomaly":
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case "recommendation":
        return <Lightbulb className="w-5 h-5 text-green-500" />;
      case "performance":
        return <TrendingUp className="w-5 h-5 text-purple-500" />;
      default:
        return <Brain className="w-5 h-5 text-gray-500" />;
    }
  };

  // Get trend icon
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <ArrowUp className="w-4 h-4 text-green-500" />;
      case "down":
        return <ArrowDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  // Handle insight actions
  const handleApplyRecommendation = async (
    insightId: string,
    recommendationIndex: number,
  ) => {
    try {
      await applyRecommendation(insightId, recommendationIndex);
      onRecommendationApplied?.(insightId);
      refreshData();
    } catch (error) {
      console.error("Failed to apply recommendation:", error);
    }
  };

  const handleDismissInsight = async (insightId: string) => {
    try {
      await dismissInsight(insightId);
      refreshData();
    } catch (error) {
      console.error("Failed to dismiss insight:", error);
    }
  };

  // Export insights data
  const handleExportInsights = () => {
    const exportData = {
      insights: filteredInsights,
      metrics: mockMetrics,
      trends: mockTrendData,
      timestamp: new Date().toISOString(),
      timeRange,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `learning-insights-${timeRange}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (error) {
    return (
      <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
        <CardContent className="p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            Failed to Load Learning Data
          </h3>
          <p className="text-gray-500 mb-4">
            There was an error loading the learning insights.
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
              <Brain className="w-5 h-5 text-purple-500" />
              Learning & Feedback Insights
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => triggerLearningUpdate()}
                disabled={isLoading}
              >
                <Brain className="w-4 h-4 mr-2" />
                Update Learning
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportInsights}
              >
                <Download className="w-4 h-4 mr-2" />
                Export
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
                  placeholder="Search insights..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64"
                />
              </div>
              <Select
                value={selectedInsightType}
                onValueChange={setSelectedInsightType}
              >
                <SelectTrigger className="w-40">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="optimization">Optimization</SelectItem>
                  <SelectItem value="pattern">Pattern</SelectItem>
                  <SelectItem value="anomaly">Anomaly</SelectItem>
                  <SelectItem value="recommendation">Recommendation</SelectItem>
                  <SelectItem value="performance">Performance</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedImpact} onValueChange={setSelectedImpact}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Impact</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              <Select value={timeRange} onValueChange={setTimeRange as any}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">Last Hour</SelectItem>
                  <SelectItem value="24h">Last 24h</SelectItem>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Learning metrics overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4"
      >
        <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-5 h-5 text-yellow-500" />
              <span className="font-medium text-sm">Total Insights</span>
            </div>
            <div className="text-2xl font-bold text-yellow-500">
              {mockMetrics.totalInsights}
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
              <ArrowUp className="w-3 h-3 text-green-500" />
              +12 this week
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="font-medium text-sm">Applied</span>
            </div>
            <div className="text-2xl font-bold text-green-500">
              {mockMetrics.appliedRecommendations}
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
              <span>
                {(
                  (mockMetrics.appliedRecommendations /
                    mockMetrics.totalInsights) *
                  100
                ).toFixed(0)}
                % applied
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              <span className="font-medium text-sm">Avg Improvement</span>
            </div>
            <div className="text-2xl font-bold text-blue-500">
              {mockMetrics.averageImprovement}%
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
              <ArrowUp className="w-3 h-3 text-green-500" />
              +5.2% vs last period
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-5 h-5 text-purple-500" />
              <span className="font-medium text-sm">Learning Velocity</span>
            </div>
            <div className="text-2xl font-bold text-purple-500">
              {mockMetrics.learningVelocity}
            </div>
            <div className="text-xs text-gray-500 mt-1">insights/day</div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-5 h-5 text-orange-500" />
              <span className="font-medium text-sm">Confidence</span>
            </div>
            <div className="text-2xl font-bold text-orange-500">
              {mockMetrics.confidenceScore}%
            </div>
            <div className="text-xs text-gray-500 mt-1">avg confidence</div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-red-500" />
              <span className="font-medium text-sm">Adaptation Rate</span>
            </div>
            <div className="text-2xl font-bold text-red-500">
              {mockMetrics.adaptationRate}%
            </div>
            <div className="text-xs text-gray-500 mt-1">
              implementation rate
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Performance trends chart */}
      <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            Learning Performance Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={mockTrendData}>
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
              <Line
                type="monotone"
                dataKey="accuracy"
                stroke="#8884d8"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="efficiency"
                stroke="#82ca9d"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="satisfaction"
                stroke="#ffc658"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="learningRate"
                stroke="#ff7300"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Insights grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Recent Insights</h3>
          <Select value={viewMode} onValueChange={setViewMode as any}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="grid">Grid</SelectItem>
              <SelectItem value="list">List</SelectItem>
              <SelectItem value="timeline">Timeline</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div
          className={`${
            viewMode === "grid"
              ? "grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
              : viewMode === "list"
                ? "space-y-4"
                : "space-y-6"
          }`}
        >
          <AnimatePresence>
            {filteredInsights.map((insight, index) => (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.1 }}
                className="group"
              >
                <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl hover:shadow-lg transition-all cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {getInsightIcon(insight.type)}
                        <div className="flex-1">
                          <CardTitle className="text-sm font-medium leading-tight">
                            {insight.title}
                          </CardTitle>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {insight.category}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={`text-xs ${getImpactColor(insight.impact)}`}
                        >
                          {insight.impact}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {insight.confidence}%
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                      {insight.description}
                    </p>

                    {/* Metrics */}
                    {insight.metrics.improvement && (
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            Performance Impact
                          </span>
                          <div className="flex items-center gap-1">
                            {getTrendIcon(insight.metrics.trend || "stable")}
                            <span className="font-bold text-sm">
                              +{insight.metrics.improvement}%
                            </span>
                          </div>
                        </div>
                        {insight.metrics.beforeValue &&
                          insight.metrics.afterValue && (
                            <div className="flex items-center gap-2 mt-2 text-xs">
                              <span className="text-gray-400">
                                {insight.metrics.beforeValue}
                              </span>
                              <ArrowRight className="w-3 h-3 text-gray-400" />
                              <span className="font-medium">
                                {insight.metrics.afterValue}
                              </span>
                            </div>
                          )}
                      </div>
                    )}

                    {/* Recommendations */}
                    {insight.recommendations.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          Recommendations:
                        </h4>
                        <div className="space-y-1">
                          {insight.recommendations
                            .slice(0, 2)
                            .map((rec, recIndex) => (
                              <div
                                key={recIndex}
                                className="flex items-start gap-2"
                              >
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 flex-shrink-0"></div>
                                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                                  {rec}
                                </p>
                              </div>
                            ))}
                          {insight.recommendations.length > 2 && (
                            <p className="text-xs text-gray-500 italic">
                              +{insight.recommendations.length - 2} more
                              recommendations
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedInsight(insight);
                          onInsightSelected?.(insight.id);
                        }}
                        className="h-7 px-3 text-xs"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View Details
                      </Button>
                      {insight.recommendations.length > 0 && (
                        <Button
                          size="sm"
                          onClick={() =>
                            handleApplyRecommendation(insight.id, 0)
                          }
                          className="h-7 px-3 text-xs"
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Apply
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredInsights.length === 0 && (
          <div className="text-center py-12">
            <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No Learning Insights Available
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              AI learning insights will appear here as your agents gather more
              data and feedback.
            </p>
            <Button onClick={() => triggerLearningUpdate()}>
              <Brain className="w-4 h-4 mr-2" />
              Generate Insights
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
