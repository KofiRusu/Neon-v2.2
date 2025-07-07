"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Activity,
  Target,
  Zap,
  AlertTriangle,
  CheckCircle,
  XCircle
} from "lucide-react";

interface MetricData {
  id: string;
  agentName: string;
  agentType: string;
  metricType: string;
  metricSubtype?: string;
  category?: string;
  value: number;
  previousValue?: number;
  target?: number;
  unit?: string;
  trend?: "increasing" | "decreasing" | "stable";
  changePercent?: number;
  performance?: "excellent" | "good" | "average" | "poor" | "critical";
  confidence?: number;
  timestamp: Date;
}

interface AgentMetricCardProps {
  metric: MetricData;
  showDetails?: boolean;
  compact?: boolean;
  darkMode?: boolean;
  onClick?: () => void;
  className?: string;
}

export function AgentMetricCard({
  metric,
  showDetails = false,
  compact = false,
  darkMode = false,
  onClick,
  className = "",
}: AgentMetricCardProps) {
  
  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case "increasing":
        return <TrendingUp className="w-4 h-4 text-emerald-400" />;
      case "decreasing":
        return <TrendingDown className="w-4 h-4 text-red-400" />;
      case "stable":
        return <Minus className="w-4 h-4 text-yellow-400" />;
      default:
        return <Activity className="w-4 h-4 text-gray-400" />;
    }
  };

  const getPerformanceColor = (performance?: string) => {
    switch (performance) {
      case "excellent":
        return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
      case "good":
        return "text-blue-400 bg-blue-500/10 border-blue-500/30";
      case "average":
        return "text-yellow-400 bg-yellow-500/10 border-yellow-500/30";
      case "poor":
        return "text-orange-400 bg-orange-500/10 border-orange-500/30";
      case "critical":
        return "text-red-400 bg-red-500/10 border-red-500/30";
      default:
        return "text-gray-400 bg-gray-500/10 border-gray-500/30";
    }
  };

  const getPerformanceIcon = (performance?: string) => {
    switch (performance) {
      case "excellent":
      case "good":
        return <CheckCircle className="w-4 h-4" />;
      case "critical":
      case "poor":
        return <XCircle className="w-4 h-4" />;
      case "average":
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getAgentTypeColor = (agentType: string) => {
    const colors = {
      CONTENT: "bg-purple-500/10 text-purple-400 border-purple-500/30",
      SEO: "bg-green-500/10 text-green-400 border-green-500/30",
      EMAIL_MARKETING: "bg-blue-500/10 text-blue-400 border-blue-500/30",
      SOCIAL_POSTING: "bg-pink-500/10 text-pink-400 border-pink-500/30",
      CUSTOMER_SUPPORT: "bg-orange-500/10 text-orange-400 border-orange-500/30",
      TREND: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
      SYSTEM: "bg-gray-500/10 text-gray-400 border-gray-500/30",
    };
    return colors[agentType as keyof typeof colors] || colors.SYSTEM;
  };

  const formatValue = (value: number, unit?: string) => {
    if (unit === "percentage") {
      return `${(value * 100).toFixed(1)}%`;
    } else if (unit === "count") {
      if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
      if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
      return value.toFixed(0);
    } else if (unit === "seconds") {
      if (value >= 3600) return `${(value / 3600).toFixed(1)}h`;
      if (value >= 60) return `${(value / 60).toFixed(1)}m`;
      return `${value.toFixed(0)}s`;
    } else if (unit === "dollars") {
      return `$${value.toFixed(2)}`;
    } else if (unit === "score") {
      return value.toFixed(1);
    } else {
      return value.toFixed(2);
    }
  };

  const getProgressValue = () => {
    if (metric.target && metric.target > 0) {
      return Math.min((metric.value / metric.target) * 100, 100);
    } else if (metric.unit === "percentage") {
      return metric.value * 100;
    } else if (metric.unit === "score") {
      return metric.value;
    }
    return null;
  };

  const cardClasses = `
    ${darkMode ? "bg-gray-900/50 border-gray-700" : "bg-white border-gray-200"}
    backdrop-blur-xl transition-all duration-300 hover:shadow-lg
    ${compact ? "p-3" : "p-4"}
    ${onClick ? "cursor-pointer hover:scale-[1.02]" : ""}
    ${className}
  `;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={onClick ? { scale: 1.02 } : {}}
      onClick={onClick}
      className={cardClasses}
    >
      <Card className="border-0 bg-transparent shadow-none">
        <CardHeader className={`pb-2 ${compact ? "p-2" : "p-4"}`}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className={`text-xs ${getAgentTypeColor(metric.agentType)}`}>
                  {metric.agentType.toLowerCase().replace('_', ' ')}
                </Badge>
                {metric.category && (
                  <Badge variant="outline" className="text-xs">
                    {metric.category}
                  </Badge>
                )}
              </div>
              
              <CardTitle className={`text-sm font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>
                {metric.agentName}
              </CardTitle>
              
              <p className={`text-xs mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                {metric.metricSubtype || metric.metricType}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {getTrendIcon(metric.trend)}
              {metric.performance && (
                <div className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-xs ${getPerformanceColor(metric.performance)}`}>
                  {getPerformanceIcon(metric.performance)}
                  <span className="capitalize">{metric.performance}</span>
                </div>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className={`space-y-3 ${compact ? "p-2 pt-0" : "p-4 pt-0"}`}>
          {/* Main Value */}
          <div className="flex items-end justify-between">
            <div>
              <div className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
                {formatValue(metric.value, metric.unit)}
              </div>
              {metric.previousValue !== undefined && metric.changePercent !== undefined && (
                <div className={`text-xs flex items-center gap-1 mt-1 ${
                  metric.changePercent > 0 ? "text-emerald-400" : 
                  metric.changePercent < 0 ? "text-red-400" : "text-gray-400"
                }`}>
                  {metric.changePercent > 0 ? <TrendingUp className="w-3 h-3" /> : 
                   metric.changePercent < 0 ? <TrendingDown className="w-3 h-3" /> : 
                   <Minus className="w-3 h-3" />}
                  {metric.changePercent > 0 ? "+" : ""}{metric.changePercent.toFixed(1)}%
                </div>
              )}
            </div>

            {metric.confidence !== undefined && (
              <div className="text-right">
                <div className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Confidence
                </div>
                <div className={`text-sm font-medium ${
                  metric.confidence >= 0.8 ? "text-emerald-400" :
                  metric.confidence >= 0.6 ? "text-yellow-400" : "text-red-400"
                }`}>
                  {(metric.confidence * 100).toFixed(0)}%
                </div>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          {getProgressValue() !== null && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className={darkMode ? "text-gray-400" : "text-gray-500"}>
                  Progress
                </span>
                {metric.target && (
                  <span className={darkMode ? "text-gray-400" : "text-gray-500"}>
                    Target: {formatValue(metric.target, metric.unit)}
                  </span>
                )}
              </div>
              <Progress 
                value={getProgressValue()!} 
                className="h-2"
              />
            </div>
          )}

          {/* Additional Details */}
          {showDetails && (
            <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className={darkMode ? "text-gray-400" : "text-gray-500"}>
                    Last Updated:
                  </span>
                  <div className={darkMode ? "text-white" : "text-gray-900"}>
                    {new Date(metric.timestamp).toLocaleTimeString()}
                  </div>
                </div>
                
                {metric.unit && (
                  <div>
                    <span className={darkMode ? "text-gray-400" : "text-gray-500"}>
                      Unit:
                    </span>
                    <div className={darkMode ? "text-white" : "text-gray-900"}>
                      {metric.unit}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Indicators */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              {metric.performance === "critical" && (
                <Badge variant="destructive" className="text-xs">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Action Required
                </Badge>
              )}
              
              {metric.trend === "increasing" && metric.performance === "excellent" && (
                <Badge variant="default" className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                  <Zap className="w-3 h-3 mr-1" />
                  Performing Well
                </Badge>
              )}
            </div>

            <div className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
              {new Date(metric.timestamp).toLocaleDateString()}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
} 