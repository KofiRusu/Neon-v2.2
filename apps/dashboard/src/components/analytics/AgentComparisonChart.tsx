"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from "recharts";
import { 
  TrendingUp, 
  BarChart3, 
  Activity,
  Users,
  Zap,
  Target,
  Filter,
  Download
} from "lucide-react";

interface AgentMetric {
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

interface AgentComparisonChartProps {
  data: AgentMetric[];
  title?: string;
  timeframe?: string;
  darkMode?: boolean;
  height?: number;
  className?: string;
  onExport?: () => void;
}

export function AgentComparisonChart({
  data,
  title = "Agent Performance Comparison",
  timeframe = "7d",
  darkMode = false,
  height = 400,
  className = "",
  onExport,
}: AgentComparisonChartProps) {
  const [selectedMetric, setSelectedMetric] = useState<string>("all");
  const [chartType, setChartType] = useState<"bar" | "line" | "area" | "radar">("bar");
  const [viewMode, setViewMode] = useState<"average" | "total" | "change">("average");

  // Get all available metric types
  const metricTypes = useMemo(() => {
    const types = new Set<string>();
    data.forEach(agent => {
      agent.metrics.forEach(metric => {
        types.add(metric.metricType);
      });
    });
    return Array.from(types);
  }, [data]);

  // Prepare chart data based on selected metric and view mode
  const chartData = useMemo(() => {
    if (selectedMetric === "all") {
      // Show average performance across all metrics
      return data.map(agent => ({
        agentName: agent.agentName,
        agentType: agent.agentType,
        performance: agent.summary.averagePerformance,
        totalMetrics: agent.summary.totalMetrics,
        fill: getAgentColor(agent.agentType),
      }));
    } else {
      // Show specific metric comparison
      return data.map(agent => {
        const metric = agent.metrics.find(m => m.metricType === selectedMetric);
        if (!metric) return null;
        
        const value = viewMode === "average" ? metric.average : 
                     viewMode === "total" ? metric.total : 
                     metric.change || 0;
        
        return {
          agentName: agent.agentName,
          agentType: agent.agentType,
          value,
          trend: metric.values[metric.values.length - 1]?.trend,
          performance: metric.values[metric.values.length - 1]?.performance,
          fill: getAgentColor(agent.agentType),
        };
      }).filter(Boolean);
    }
  }, [data, selectedMetric, viewMode]);

  // Prepare time series data for line/area charts
  const timeSeriesData = useMemo(() => {
    if (selectedMetric === "all" || chartType === "bar" || chartType === "radar") return [];
    
    // Get all unique timestamps
    const timestamps = new Set<string>();
    data.forEach(agent => {
      const metric = agent.metrics.find(m => m.metricType === selectedMetric);
      if (metric) {
        metric.values.forEach(value => {
          timestamps.add(value.timestamp.toISOString());
        });
      }
    });
    
    // Create time series data
    return Array.from(timestamps).sort().map(timestamp => {
      const point: any = { timestamp: new Date(timestamp).toLocaleDateString() };
      
      data.forEach(agent => {
        const metric = agent.metrics.find(m => m.metricType === selectedMetric);
        if (metric) {
          const value = metric.values.find(v => v.timestamp.toISOString() === timestamp);
          point[agent.agentName] = value?.value || 0;
        }
      });
      
      return point;
    });
  }, [data, selectedMetric, chartType]);

  // Prepare radar chart data
  const radarData = useMemo(() => {
    if (chartType !== "radar") return [];
    
    return metricTypes.map(metricType => {
      const point: any = { metric: metricType };
      
      data.forEach(agent => {
        const metric = agent.metrics.find(m => m.metricType === metricType);
        point[agent.agentName] = metric ? metric.average : 0;
      });
      
      return point;
    });
  }, [data, metricTypes, chartType]);

  function getAgentColor(agentType: string): string {
    const colors = {
      CONTENT: "#8b5cf6",
      SEO: "#10b981",
      EMAIL_MARKETING: "#3b82f6",
      SOCIAL_POSTING: "#ec4899",
      CUSTOMER_SUPPORT: "#f97316",
      TREND: "#06b6d4",
      SYSTEM: "#6b7280",
    };
    return colors[agentType as keyof typeof colors] || colors.SYSTEM;
  }

  const renderChart = () => {
    switch (chartType) {
      case "bar":
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#374151" : "#e5e7eb"} />
              <XAxis 
                dataKey="agentName" 
                stroke={darkMode ? "#9ca3af" : "#6b7280"}
                fontSize={12}
              />
              <YAxis 
                stroke={darkMode ? "#9ca3af" : "#6b7280"}
                fontSize={12}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: darkMode ? "#1f2937" : "#ffffff",
                  border: `1px solid ${darkMode ? "#374151" : "#e5e7eb"}`,
                  borderRadius: "8px",
                  color: darkMode ? "#ffffff" : "#000000",
                }}
              />
              <Bar 
                dataKey={selectedMetric === "all" ? "performance" : "value"}
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        );
        
      case "line":
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={timeSeriesData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#374151" : "#e5e7eb"} />
              <XAxis 
                dataKey="timestamp" 
                stroke={darkMode ? "#9ca3af" : "#6b7280"}
                fontSize={12}
              />
              <YAxis 
                stroke={darkMode ? "#9ca3af" : "#6b7280"}
                fontSize={12}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: darkMode ? "#1f2937" : "#ffffff",
                  border: `1px solid ${darkMode ? "#374151" : "#e5e7eb"}`,
                  borderRadius: "8px",
                  color: darkMode ? "#ffffff" : "#000000",
                }}
              />
              <Legend />
              {data.map((agent, index) => (
                <Line
                  key={agent.agentName}
                  type="monotone"
                  dataKey={agent.agentName}
                  stroke={getAgentColor(agent.agentType)}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );
        
      case "area":
        return (
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={timeSeriesData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <defs>
                {data.map((agent, index) => (
                  <linearGradient key={agent.agentName} id={`color${index}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={getAgentColor(agent.agentType)} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={getAgentColor(agent.agentType)} stopOpacity={0.1}/>
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#374151" : "#e5e7eb"} />
              <XAxis 
                dataKey="timestamp" 
                stroke={darkMode ? "#9ca3af" : "#6b7280"}
                fontSize={12}
              />
              <YAxis 
                stroke={darkMode ? "#9ca3af" : "#6b7280"}
                fontSize={12}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: darkMode ? "#1f2937" : "#ffffff",
                  border: `1px solid ${darkMode ? "#374151" : "#e5e7eb"}`,
                  borderRadius: "8px",
                  color: darkMode ? "#ffffff" : "#000000",
                }}
              />
              <Legend />
              {data.map((agent, index) => (
                <Area
                  key={agent.agentName}
                  type="monotone"
                  dataKey={agent.agentName}
                  stroke={getAgentColor(agent.agentType)}
                  fill={`url(#color${index})`}
                  strokeWidth={2}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        );
        
      case "radar":
        return (
          <ResponsiveContainer width="100%" height={height}>
            <RadarChart data={radarData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <PolarGrid stroke={darkMode ? "#374151" : "#e5e7eb"} />
              <PolarAngleAxis 
                dataKey="metric" 
                tick={{ fill: darkMode ? "#9ca3af" : "#6b7280", fontSize: 12 }}
              />
              <PolarRadiusAxis 
                tick={{ fill: darkMode ? "#9ca3af" : "#6b7280", fontSize: 10 }}
                domain={[0, 100]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: darkMode ? "#1f2937" : "#ffffff",
                  border: `1px solid ${darkMode ? "#374151" : "#e5e7eb"}`,
                  borderRadius: "8px",
                  color: darkMode ? "#ffffff" : "#000000",
                }}
              />
              {data.map((agent, index) => (
                <Radar
                  key={agent.agentName}
                  name={agent.agentName}
                  dataKey={agent.agentName}
                  stroke={getAgentColor(agent.agentType)}
                  fill={getAgentColor(agent.agentType)}
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
              ))}
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        );
        
      default:
        return null;
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
                {title}
              </CardTitle>
              <p className={`text-sm mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                Compare performance across {data.length} agents over {timeframe}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                <Activity className="w-3 h-3 mr-1" />
                {data.length} Agents
              </Badge>
              
              {onExport && (
                <Button variant="outline" size="sm" onClick={onExport}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Controls */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className={`w-4 h-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`} />
              <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select metric" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Metrics (Average)</SelectItem>
                  {metricTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <BarChart3 className={`w-4 h-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`} />
              <Select value={chartType} onValueChange={setChartType as any}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bar">Bar Chart</SelectItem>
                  <SelectItem value="line">Line Chart</SelectItem>
                  <SelectItem value="area">Area Chart</SelectItem>
                  <SelectItem value="radar">Radar Chart</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedMetric !== "all" && (chartType === "bar" || chartType === "radar") && (
              <div className="flex items-center gap-2">
                <Target className={`w-4 h-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`} />
                <Select value={viewMode} onValueChange={setViewMode as any}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="average">Average</SelectItem>
                    <SelectItem value="total">Total</SelectItem>
                    <SelectItem value="change">Change %</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Chart */}
          <div className={`p-4 rounded-lg border ${darkMode ? "bg-gray-800/50 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
            {renderChart()}
          </div>

          {/* Agent Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.slice(0, 6).map((agent, index) => (
              <motion.div
                key={agent.agentName}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-3 rounded-lg border ${darkMode ? "bg-gray-800/30 border-gray-700" : "bg-white border-gray-200"}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getAgentColor(agent.agentType) }}
                    />
                    <span className={`text-sm font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>
                      {agent.agentName}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {agent.agentType.toLowerCase().replace('_', ' ')}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className={darkMode ? "text-gray-400" : "text-gray-500"}>Performance:</span>
                    <div className={`font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>
                      {agent.summary.averagePerformance.toFixed(1)}
                    </div>
                  </div>
                  <div>
                    <span className={darkMode ? "text-gray-400" : "text-gray-500"}>Metrics:</span>
                    <div className={`font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>
                      {agent.summary.totalMetrics}
                    </div>
                  </div>
                </div>
                
                {agent.summary.bestMetric && (
                  <div className="mt-2 text-xs">
                    <span className={darkMode ? "text-gray-400" : "text-gray-500"}>Best:</span>
                    <span className="ml-1 text-emerald-400">{agent.summary.bestMetric}</span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <span className={`text-sm font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>
              Agents:
            </span>
            {data.map(agent => (
              <div key={agent.agentName} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getAgentColor(agent.agentType) }}
                />
                <span className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                  {agent.agentName}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
} 