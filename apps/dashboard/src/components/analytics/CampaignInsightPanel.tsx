"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Separator } from "../ui/separator";
import { 
  TrendingUp, 
  TrendingDown, 
  Activity,
  Users,
  Target,
  AlertTriangle,
  CheckCircle,
  Award,
  BarChart3,
  Eye,
  Calendar,
  Lightbulb,
  ArrowUpRight,
  ExternalLink
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";

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

interface CampaignInsightPanelProps {
  insight: CampaignInsight;
  darkMode?: boolean;
  onViewCampaign?: () => void;
  onViewAgent?: (agentName: string) => void;
  className?: string;
}

export function CampaignInsightPanel({
  insight,
  darkMode = false,
  onViewCampaign,
  onViewAgent,
  className = "",
}: CampaignInsightPanelProps) {
  const [activeTab, setActiveTab] = useState("overview");

  const getPerformanceColor = (performance: number) => {
    if (performance >= 4) return "text-emerald-400";
    if (performance >= 3) return "text-blue-400";
    if (performance >= 2) return "text-yellow-400";
    return "text-red-400";
  };

  const getPerformanceLabel = (performance: number) => {
    if (performance >= 4) return "Excellent";
    if (performance >= 3) return "Good";
    if (performance >= 2) return "Average";
    return "Poor";
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "text-red-400 bg-red-500/10 border-red-500/30";
      case "high":
        return "text-orange-400 bg-orange-500/10 border-orange-500/30";
      case "medium":
        return "text-yellow-400 bg-yellow-500/10 border-yellow-500/30";
      case "low":
        return "text-blue-400 bg-blue-500/10 border-blue-500/30";
      default:
        return "text-gray-400 bg-gray-500/10 border-gray-500/30";
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "critical":
        return <AlertTriangle className="w-4 h-4" />;
      case "high":
        return <TrendingUp className="w-4 h-4" />;
      case "medium":
        return <Activity className="w-4 h-4" />;
      case "low":
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const formatMetricValue = (value: number, unit: string | null) => {
    if (unit === "percentage") {
      return `${(value * 100).toFixed(1)}%`;
    } else if (unit === "count") {
      if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
      if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
      return value.toFixed(0);
    } else if (unit === "dollars") {
      return `$${value.toFixed(2)}`;
    } else if (unit === "score") {
      return value.toFixed(1);
    }
    return value.toFixed(2);
  };

  const getTrendIcon = (trend: string | null) => {
    switch (trend) {
      case "increasing":
        return <TrendingUp className="w-3 h-3 text-emerald-400" />;
      case "decreasing":
        return <TrendingDown className="w-3 h-3 text-red-400" />;
      default:
        return <Activity className="w-3 h-3 text-gray-400" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      <Card className={`${darkMode ? "bg-gray-900/50 border-gray-700" : "bg-white"} backdrop-blur-xl`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
                {insight.campaignName || `Campaign ${insight.campaignId}`}
              </CardTitle>
              <p className={`text-sm mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                Campaign insights over {insight.overview.timeframe} • {insight.overview.activeAgents} active agents
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                <BarChart3 className="w-3 h-3 mr-1" />
                {insight.overview.totalMetrics} metrics
              </Badge>
              
              {onViewCampaign && (
                <Button variant="outline" size="sm" onClick={onViewCampaign}>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Campaign
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="agents">Agents</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
              <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {/* Performance Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className={`${darkMode ? "bg-gray-800/50 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className={`w-4 h-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`} />
                      <span className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Average Performance</span>
                    </div>
                    <div className={`text-2xl font-bold ${getPerformanceColor(insight.overview.averagePerformance)}`}>
                      {insight.overview.averagePerformance.toFixed(1)}
                    </div>
                    <div className={`text-xs mt-1 ${getPerformanceColor(insight.overview.averagePerformance)}`}>
                      {getPerformanceLabel(insight.overview.averagePerformance)}
                    </div>
                    <Progress 
                      value={(insight.overview.averagePerformance / 5) * 100} 
                      className="h-1 mt-2"
                    />
                  </CardContent>
                </Card>

                <Card className={`${darkMode ? "bg-gray-800/50 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className={`w-4 h-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`} />
                      <span className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Active Agents</span>
                    </div>
                    <div className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
                      {insight.overview.activeAgents}
                    </div>
                    <div className={`text-xs mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                      Contributing to campaign
                    </div>
                  </CardContent>
                </Card>

                <Card className={`${darkMode ? "bg-gray-800/50 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className={`w-4 h-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`} />
                      <span className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Total Metrics</span>
                    </div>
                    <div className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
                      {insight.overview.totalMetrics}
                    </div>
                    <div className={`text-xs mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                      Data points tracked
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Best/Worst Performers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {insight.overview.bestPerformingAgent && (
                  <Card className={`${darkMode ? "bg-emerald-500/10 border-emerald-500/30" : "bg-emerald-50 border-emerald-200"}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Award className="w-4 h-4 text-emerald-400" />
                        <span className={`text-sm font-medium text-emerald-400`}>Best Performer</span>
                      </div>
                      <div className={`text-lg font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
                        {insight.overview.bestPerformingAgent}
                      </div>
                      {onViewAgent && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="mt-2 text-emerald-400 hover:text-emerald-300"
                          onClick={() => onViewAgent(insight.overview.bestPerformingAgent!)}
                        >
                          <ArrowUpRight className="w-3 h-3 mr-1" />
                          View Details
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}

                {insight.overview.worstPerformingAgent && (
                  <Card className={`${darkMode ? "bg-orange-500/10 border-orange-500/30" : "bg-orange-50 border-orange-200"}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-orange-400" />
                        <span className={`text-sm font-medium text-orange-400`}>Needs Attention</span>
                      </div>
                      <div className={`text-lg font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
                        {insight.overview.worstPerformingAgent}
                      </div>
                      {onViewAgent && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="mt-2 text-orange-400 hover:text-orange-300"
                          onClick={() => onViewAgent(insight.overview.worstPerformingAgent!)}
                        >
                          <ArrowUpRight className="w-3 h-3 mr-1" />
                          View Details
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="agents" className="space-y-4">
              {insight.agentBreakdown && insight.agentBreakdown.length > 0 ? (
                <div className="space-y-4">
                  {insight.agentBreakdown.map((agent, index) => (
                    <motion.div
                      key={agent.agentName}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className={`${darkMode ? "bg-gray-800/50 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h4 className={`text-lg font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>
                                {agent.agentName}
                              </h4>
                              <Badge variant="outline" className="text-xs mt-1">
                                {agent.agentType.toLowerCase().replace('_', ' ')}
                              </Badge>
                            </div>
                            
                            <div className="text-right">
                              <div className={`text-sm font-medium ${getPerformanceColor(agent.averagePerformance)}`}>
                                {agent.averagePerformance.toFixed(1)} / 5.0
                              </div>
                              <div className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                                {agent.metricCount} metrics
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <h5 className={`text-sm font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>
                              Top Metrics:
                            </h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                              {agent.topMetrics.slice(0, 3).map((metric, metricIndex) => (
                                <div
                                  key={metricIndex}
                                  className={`p-2 rounded border ${darkMode ? "bg-gray-700/50 border-gray-600" : "bg-white border-gray-200"}`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                                      {metric.metricType}
                                    </span>
                                    {getTrendIcon(metric.trend)}
                                  </div>
                                  <div className={`text-sm font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>
                                    {formatMetricValue(metric.value, metric.unit)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {onViewAgent && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="mt-3"
                              onClick={() => onViewAgent(agent.agentName)}
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              View Agent Details
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className={`text-center py-8 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No agent breakdown available</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="trends" className="space-y-4">
              {insight.performanceTrends && insight.performanceTrends.length > 0 ? (
                <div className="space-y-4">
                  {/* Performance Trend Chart */}
                  <Card className={`${darkMode ? "bg-gray-800/50 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
                    <CardHeader>
                      <CardTitle className={`text-md ${darkMode ? "text-white" : "text-gray-900"}`}>
                        Performance Over Time
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={insight.performanceTrends}>
                            <defs>
                              <linearGradient id="performanceGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#374151" : "#e5e7eb"} />
                            <XAxis 
                              dataKey="date" 
                              stroke={darkMode ? "#9ca3af" : "#6b7280"}
                              fontSize={12}
                              tickFormatter={(date) => new Date(date).toLocaleDateString()}
                            />
                            <YAxis 
                              stroke={darkMode ? "#9ca3af" : "#6b7280"}
                              fontSize={12}
                              domain={[0, 5]}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: darkMode ? "#1f2937" : "#ffffff",
                                border: `1px solid ${darkMode ? "#374151" : "#e5e7eb"}`,
                                borderRadius: "8px",
                                color: darkMode ? "#ffffff" : "#000000",
                              }}
                              labelFormatter={(date) => new Date(date).toLocaleDateString()}
                            />
                            <Area
                              type="monotone"
                              dataKey="overallPerformance"
                              stroke="#3b82f6"
                              fill="url(#performanceGradient)"
                              strokeWidth={2}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Metric Breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {[
                      { key: 'reach', label: 'Reach', icon: Eye },
                      { key: 'engagement', label: 'Engagement', icon: Activity },
                      { key: 'conversions', label: 'Conversions', icon: Target },
                      { key: 'roi', label: 'ROI', icon: TrendingUp },
                      { key: 'sentiment', label: 'Sentiment', icon: Award },
                    ].map(({ key, label, icon: Icon }) => {
                      const latestData = insight.performanceTrends![insight.performanceTrends!.length - 1];
                      const value = latestData.metricBreakdown[key as keyof typeof latestData.metricBreakdown];
                      
                      return (
                        <Card key={key} className={`${darkMode ? "bg-gray-800/30 border-gray-700" : "bg-white border-gray-200"}`}>
                          <CardContent className="p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <Icon className={`w-3 h-3 ${darkMode ? "text-gray-400" : "text-gray-500"}`} />
                              <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                                {label}
                              </span>
                            </div>
                            <div className={`text-lg font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
                              {value !== null ? value.toFixed(1) : "N/A"}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className={`text-center py-8 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No performance trends available</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="recommendations" className="space-y-4">
              {insight.recommendations.length > 0 ? (
                <div className="space-y-3">
                  {insight.recommendations.map((recommendation, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className={`${darkMode ? "bg-gray-800/50 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-xs ${getPriorityColor(recommendation.priority)}`}>
                              {getPriorityIcon(recommendation.priority)}
                              <span className="capitalize">{recommendation.priority}</span>
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-xs">
                                  {recommendation.type}
                                </Badge>
                                {recommendation.agentName && (
                                  <Badge variant="outline" className="text-xs">
                                    {recommendation.agentName}
                                  </Badge>
                                )}
                                {recommendation.metricType && (
                                  <Badge variant="outline" className="text-xs">
                                    {recommendation.metricType}
                                  </Badge>
                                )}
                              </div>
                              
                              <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                                {recommendation.message}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className={`text-center py-8 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  <Lightbulb className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No recommendations available</p>
                  <p className="text-xs mt-2">Campaign is performing well!</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
} 