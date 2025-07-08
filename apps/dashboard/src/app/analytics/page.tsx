"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import { Input } from "../../components/ui/input";
import { Separator } from "../../components/ui/separator";
import {
  BarChart3,
  TrendingUp,
  Activity,
  Users,
  Target,
  Eye,
  RefreshCw,
  Download,
  Filter,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Zap,
  Settings,
  Search,
  Bot,
  Brain,
  GitBranch,
  Play,
  Lightbulb,
  FileText,
  Plus,
  Upload,
} from "lucide-react";

// Import our analytics components
import { AgentMetricCard } from "../../components/analytics/AgentMetricCard";
import { AgentComparisonChart } from "../../components/analytics/AgentComparisonChart";
import { CampaignInsightPanel } from "../../components/analytics/CampaignInsightPanel";
import { AgentTriggersPanel } from "../../components/analytics/AgentTriggersPanel";
import { ChainVisualizerPanel } from "../../components/analytics/ChainVisualizerPanel";
import FeedbackInsightsPanel from "../../components/analytics/FeedbackInsightsPanel";
import { SEOPerformanceChart } from "../../components/seo/SEOPerformanceChart";
import StatusBadge from "../../components/shared/StatusBadge";

// Import hooks
import { useAnalytics } from "../../hooks/useAnalytics";
import { useAgentActions } from "../../hooks/useAgentActions";
import { useAgentChains } from "../../hooks/useAgentChains";
import { useLearning } from "../../hooks/useLearning";

interface TimeRange {
  label: string;
  value: "1h" | "6h" | "24h" | "7d" | "30d" | "90d";
}

export default function AnalyticsPage() {
  const [selectedTimeframe, setSelectedTimeframe] = useState<
    "1h" | "6h" | "24h" | "7d" | "30d" | "90d"
  >("24h");
  const [selectedTab, setSelectedTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds

  // Use our analytics hooks
  const {
    dashboardSummary,
    metrics,
    agentComparison,
    campaignInsights,
    isLoading,
    error,
    refreshData,
    triggerAggregation,
  } = useAnalytics({
    timeframe: selectedTimeframe,
    autoRefresh,
    selectedAgents,
  });

  const { executeChain, createChain } = useAgentChains({
    autoRefresh,
    refreshInterval,
  });

  const { triggerAllActions, triggerSpecificAction } = useAgentActions();

  const { triggerLearningUpdate } = useLearning({
    timeframe: selectedTimeframe,
    autoRefresh,
  });

  const timeRanges: TimeRange[] = [
    { label: "Last Hour", value: "1h" },
    { label: "Last 6 Hours", value: "6h" },
    { label: "Last 24 Hours", value: "24h" },
    { label: "Last 7 Days", value: "7d" },
    { label: "Last 30 Days", value: "30d" },
    { label: "Last 90 Days", value: "90d" },
  ];

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        refreshData();
      }, 30000); // Refresh every 30 seconds

      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshData]);

  const handleExportData = () => {
    // Export analytics data
    const exportData = {
      summary: dashboardSummary,
      metrics: metrics?.data || [],
      timestamp: new Date().toISOString(),
      timeframe: selectedTimeframe,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-export-${selectedTimeframe}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getPerformanceColor = (value: number) => {
    if (value >= 4) return "text-emerald-400";
    if (value >= 3) return "text-blue-400";
    if (value >= 2) return "text-yellow-400";
    return "text-red-400";
  };

  const getChangeIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="w-4 h-4 text-emerald-400" />;
    if (value < 0)
      return <TrendingUp className="w-4 h-4 text-red-400 rotate-180" />;
    return <Activity className="w-4 h-4 text-gray-400" />;
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "agents", label: "Agent Metrics", icon: Bot },
    { id: "chains", label: "Strategy Chains", icon: GitBranch },
    { id: "triggers", label: "Triggered Actions", icon: Zap },
    { id: "learning", label: "Learning Insights", icon: Brain },
    { id: "seo", label: "SEO Performance", icon: Search },
  ];

  const handleRefresh = () => {
    // This will trigger a refresh in all panels that support it
    window.dispatchEvent(new CustomEvent("analytics-refresh"));
    refreshData();
  };

  // Floating action handlers
  const handleTriggerChain = async () => {
    try {
      // Create and execute a new marketing strategy chain
      const newChain = await createChain({
        name: `Marketing Strategy - ${new Date().toISOString().split("T")[0]}`,
        description: "Automated marketing strategy execution",
        steps: [
          { agentType: "TREND", task: "analyze_trends", dependencies: [] },
          {
            agentType: "CONTENT",
            task: "generate_content",
            dependencies: ["trend_analysis"],
          },
          {
            agentType: "SOCIAL_POSTING",
            task: "schedule_posts",
            dependencies: ["content_generation"],
          },
          {
            agentType: "EMAIL_MARKETING",
            task: "send_campaign",
            dependencies: ["content_generation"],
          },
        ],
        executionMode: "adaptive",
      });

      await executeChain(newChain.id);
      refreshData();
    } catch (error) {
      console.error("Failed to trigger chain:", error);
    }
  };

  const handleRunLearning = async () => {
    try {
      await triggerLearningUpdate();
      refreshData();
    } catch (error) {
      console.error("Failed to trigger learning:", error);
    }
  };

  const handleTriggerAllActionsClick = async () => {
    try {
      await triggerAllActions();
      refreshData();
    } catch (error) {
      console.error("Failed to trigger all actions:", error);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Failed to Load Analytics
            </h3>
            <p className="text-gray-500 mb-4">
              There was an error loading the analytics data.
            </p>
            <Button onClick={refreshData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative">
      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Button
            size="lg"
            onClick={handleTriggerChain}
            className="h-14 w-14 rounded-full bg-purple-500 hover:bg-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            title="Trigger Agent Chain"
          >
            <GitBranch className="w-6 h-6" />
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
        >
          <Button
            size="lg"
            onClick={handleRunLearning}
            className="h-14 w-14 rounded-full bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            title="Run Learning Now"
          >
            <Brain className="w-6 h-6" />
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7 }}
        >
          <Button
            size="lg"
            onClick={handleTriggerAllActionsClick}
            className="h-14 w-14 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            title="Trigger All Actions"
          >
            <Zap className="w-6 h-6" />
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8 }}
        >
          <Button
            size="lg"
            onClick={handleExportData}
            className="h-14 w-14 rounded-full bg-orange-500 hover:bg-orange-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            title="Export Dashboard"
          >
            <Download className="w-6 h-6" />
          </Button>
        </motion.div>
      </div>

      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Analytics Dashboard
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                Comprehensive insights into your AI marketing campaigns and
                agent performance
              </p>
            </div>

            <div className="flex items-center space-x-4">
              {/* Auto-refresh toggle */}
              <Button
                variant={autoRefresh ? "default" : "outline"}
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                <Activity
                  className={`w-4 h-4 mr-2 ${autoRefresh ? "animate-pulse" : ""}`}
                />
                {autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
              </Button>

              {/* Timeframe selector */}
              <Select
                value={selectedTimeframe}
                onValueChange={setSelectedTimeframe as any}
              >
                <SelectTrigger className="w-48">
                  <Calendar className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeRanges.map((range) => (
                    <SelectItem key={range.value} value={range.value}>
                      {range.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Action buttons */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading}
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Overview Cards */}
        {dashboardSummary && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-gray-200 dark:border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <BarChart3 className="w-8 h-8 text-blue-500" />
                  <StatusBadge status="active" variant="glass" size="xs" />
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {dashboardSummary.overview.totalMetrics.toLocaleString()}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Total data points
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-gray-200 dark:border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Users className="w-8 h-8 text-purple-500" />
                  <StatusBadge status="online" variant="glass" size="xs" />
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {dashboardSummary.overview.activeAgents}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Active AI agents
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-gray-200 dark:border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Target className="w-8 h-8 text-green-500" />
                  <StatusBadge status="running" variant="glass" size="xs" />
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {dashboardSummary.overview.activeCampaigns}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Active campaigns
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-gray-200 dark:border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Activity className="w-8 h-8 text-orange-500" />
                  <StatusBadge
                    status={
                      dashboardSummary.overview.averagePerformance >= 4
                        ? "excellent"
                        : dashboardSummary.overview.averagePerformance >= 3
                          ? "good"
                          : dashboardSummary.overview.averagePerformance >= 2
                            ? "fair"
                            : "poor"
                    }
                    variant="glass"
                    size="xs"
                  />
                </div>
                <div
                  className={`text-2xl font-bold ${getPerformanceColor(dashboardSummary.overview.averagePerformance)}`}
                >
                  {dashboardSummary.overview.averagePerformance.toFixed(1)}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Average performance
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Alerts Section */}
        {dashboardSummary?.alerts && dashboardSummary.alerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                  Active Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardSummary.alerts.slice(0, 5).map((alert, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${
                        alert.severity === "error"
                          ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                          : alert.severity === "warning"
                            ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
                            : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <StatusBadge
                            status={
                              alert.severity === "error"
                                ? "error"
                                : alert.severity === "warning"
                                  ? "warning"
                                  : "info"
                            }
                            variant="glass"
                            size="xs"
                            showIcon={false}
                          />
                          <span className="font-medium text-gray-900 dark:text-white">
                            {alert.message}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {alert.agentName && (
                            <Badge variant="outline" className="text-xs">
                              {alert.agentName}
                            </Badge>
                          )}
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(alert.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Main Content Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Tabs
            value={selectedTab}
            onValueChange={setSelectedTab}
            className="space-y-6"
          >
            <TabsList className="grid w-full grid-cols-6">
              {tabs.map((tab) => (
                <TabsTrigger key={tab.id} value={tab.id}>
                  <div className="flex items-center gap-2">
                    <tab.icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </div>
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Top Performers Section */}
              {dashboardSummary?.topPerformers && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Top Agents */}
                  <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-purple-500" />
                        Top Agents
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {dashboardSummary.topPerformers.agents
                        .slice(0, 5)
                        .map((agent, index) => (
                          <div
                            key={agent.name}
                            className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold text-sm">
                                {index + 1}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {agent.name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {agent.type.toLowerCase().replace("_", " ")}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <StatusBadge
                                status={
                                  agent.performance >= 4
                                    ? "excellent"
                                    : agent.performance >= 3
                                      ? "good"
                                      : agent.performance >= 2
                                        ? "fair"
                                        : "poor"
                                }
                                variant="glass"
                                size="xs"
                              />
                              <div
                                className={`text-right ${getPerformanceColor(agent.performance)}`}
                              >
                                <p className="font-bold">
                                  {agent.performance.toFixed(1)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                    </CardContent>
                  </Card>

                  {/* Top Campaigns */}
                  <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="w-5 h-5 text-green-500" />
                        Top Campaigns
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {dashboardSummary.topPerformers.campaigns
                        .slice(0, 5)
                        .map((campaign, index) => (
                          <div
                            key={campaign.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-sm">
                                {index + 1}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {campaign.name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {campaign.metricsCount} metrics
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <StatusBadge
                                status="active"
                                variant="glass"
                                size="xs"
                              />
                              <div
                                className={`text-right ${getPerformanceColor(campaign.performance)}`}
                              >
                                <p className="font-bold">
                                  {campaign.performance.toFixed(1)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                    </CardContent>
                  </Card>

                  {/* Top Metrics */}
                  <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-blue-500" />
                        Top Metrics
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {dashboardSummary.topPerformers.metrics
                        .slice(0, 5)
                        .map((metric, index) => (
                          <div
                            key={metric.type}
                            className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">
                                {index + 1}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {metric.type.charAt(0).toUpperCase() +
                                    metric.type.slice(1)}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {metric.unit || "value"}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {metric.trend && (
                                <StatusBadge
                                  status={
                                    metric.trend === "increasing"
                                      ? "up"
                                      : "down"
                                  }
                                  variant="glass"
                                  size="xs"
                                />
                              )}
                              <div className="text-right">
                                <p className="font-bold text-gray-900 dark:text-white">
                                  {metric.value.toFixed(2)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            <TabsContent value="agents" className="space-y-6">
              {/* Filters */}
              <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Search className="w-4 h-4 text-gray-500" />
                      <Input
                        placeholder="Search metrics..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-64"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => triggerAggregation()}
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Update Metrics
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Metrics Grid */}
              {metrics?.data && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  <AnimatePresence>
                    {metrics.data
                      .filter(
                        (metric) =>
                          !searchQuery ||
                          metric.agentName
                            .toLowerCase()
                            .includes(searchQuery.toLowerCase()) ||
                          metric.metricType
                            .toLowerCase()
                            .includes(searchQuery.toLowerCase()),
                      )
                      .slice(0, 20)
                      .map((metric, index) => (
                        <motion.div
                          key={metric.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <AgentMetricCard
                            metric={metric}
                            showDetails={false}
                            darkMode={false}
                          />
                        </motion.div>
                      ))}
                  </AnimatePresence>
                </div>
              )}

              {/* Agent Comparison Chart */}
              {agentComparison && agentComparison.length > 0 && (
                <AgentComparisonChart
                  data={agentComparison}
                  timeframe={selectedTimeframe}
                  onExport={handleExportData}
                />
              )}

              {metrics?.data && metrics.data.length === 0 && (
                <div className="text-center py-12">
                  <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No Metrics Available
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Start by triggering metrics aggregation to see data here.
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="chains" className="space-y-6">
              <ChainVisualizerPanel
                showFilters={true}
                maxHeight="700px"
                autoRefresh={autoRefresh}
                refreshInterval={refreshInterval}
                onChainSelected={(chainId) => {
                  console.log("Chain selected:", chainId);
                }}
                onStepSelected={(stepId) => {
                  console.log("Step selected:", stepId);
                }}
              />
            </TabsContent>

            <TabsContent value="triggers" className="space-y-6">
              <AgentTriggersPanel
                showFilters={true}
                maxHeight="700px"
                autoRefresh={autoRefresh}
                refreshInterval={refreshInterval}
                onActionTriggered={(actionId) => {
                  console.log("Action triggered:", actionId);
                  // Refresh analytics data when actions are triggered
                  refreshData();
                }}
              />
            </TabsContent>

            <TabsContent value="learning" className="space-y-6">
              <FeedbackInsightsPanel
                autoRefresh={autoRefresh}
                refreshInterval={refreshInterval}
                showFilters={true}
                maxHeight="700px"
                onInsightSelected={(insightId) => {
                  console.log("Insight selected:", insightId);
                }}
                onRecommendationApplied={(recommendationId) => {
                  console.log("Recommendation applied:", recommendationId);
                  refreshData();
                }}
              />
            </TabsContent>

            <TabsContent value="seo" className="space-y-6">
              <SEOPerformanceChart
                timeframe={selectedTimeframe}
                showFilters={true}
                autoRefresh={autoRefresh}
                refreshInterval={refreshInterval}
                maxHeight="500px"
                onKeywordSelected={(keyword) => {
                  console.log("Keyword selected:", keyword);
                }}
                onPageSelected={(pageId) => {
                  console.log("Page selected:", pageId);
                }}
              />
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>

      {/* Status Footer */}
      <Card className="mx-4 mb-4">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <StatusBadge status="online" variant="glass" size="xs" />
                <span className="text-sm text-gray-600">
                  All systems operational
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  Last updated: {new Date().toLocaleTimeString()}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <StatusBadge
                status="running"
                variant="glass"
                size="xs"
                label="Real-time"
              />
              <StatusBadge
                status={autoRefresh ? "active" : "inactive"}
                variant="glass"
                size="xs"
                label={autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
