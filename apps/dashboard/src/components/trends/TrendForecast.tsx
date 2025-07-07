"use client";

import { motion } from "framer-motion";
import { formatDistanceToNow, format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { Button } from "../ui/button";
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Activity,
  Target,
  AlertTriangle,
  Calendar,
  Zap,
  Eye,
  ArrowRight
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";

interface ForecastData {
  trendId: string;
  timeframe: string;
  currentScore: number;
  predictedScore: number;
  confidence: number;
  trend: "increasing" | "decreasing" | "stable";
  factors: string[];
  recommendations: string[];
}

interface TrendHistoricalData {
  date: Date;
  overallScore: number;
  viralityScore: number;
  relevanceScore: number;
  opportunityScore: number;
  volume: number;
  growth: number;
  momentum: number;
}

interface TrendForecastProps {
  forecast: ForecastData;
  historicalData: TrendHistoricalData[];
  trend: {
    keyword: string;
    platform: string;
    title?: string;
    region?: string;
  };
  darkMode?: boolean;
  onViewDetails?: () => void;
  className?: string;
}

export function TrendForecast({
  forecast,
  historicalData,
  trend,
  darkMode = false,
  onViewDetails,
  className = "",
}: TrendForecastProps) {
  // Prepare chart data
  const chartData = historicalData.map((item, index) => ({
    date: format(item.date, "MMM dd"),
    score: item.overallScore,
    volume: item.volume / 1000, // Scale down for better visualization
    momentum: item.momentum,
    virality: item.viralityScore,
    relevance: item.relevanceScore,
    opportunity: item.opportunityScore,
  }));

  // Add forecast point
  const lastDate = historicalData[historicalData.length - 1]?.date || new Date();
  const forecastDate = new Date(lastDate.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days ahead
  
  const forecastPoint = {
    date: format(forecastDate, "MMM dd"),
    score: forecast.predictedScore,
    volume: null,
    momentum: null,
    virality: null,
    relevance: null,
    opportunity: null,
    isForecast: true,
  };

  const fullChartData = [...chartData, forecastPoint];

  const getTrendIcon = () => {
    switch (forecast.trend) {
      case "increasing":
        return <TrendingUp className="w-5 h-5 text-emerald-400" />;
      case "decreasing":
        return <TrendingDown className="w-5 h-5 text-red-400" />;
      default:
        return <Activity className="w-5 h-5 text-yellow-400" />;
    }
  };

  const getTrendColor = () => {
    switch (forecast.trend) {
      case "increasing":
        return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
      case "decreasing":
        return "text-red-400 bg-red-500/10 border-red-500/30";
      default:
        return "text-yellow-400 bg-yellow-500/10 border-yellow-500/30";
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-emerald-400";
    if (confidence >= 0.6) return "text-yellow-400";
    return "text-red-400";
  };

  const scoreDifference = forecast.predictedScore - forecast.currentScore;
  const changePercentage = ((scoreDifference / forecast.currentScore) * 100).toFixed(1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      <Card className={`${darkMode ? "bg-gray-900/50 border-gray-700" : "bg-white"} backdrop-blur-xl`}>
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
                {trend.title || trend.keyword} Forecast
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className={`text-xs ${darkMode ? "border-gray-600 text-gray-300" : "border-gray-300 text-gray-600"}`}>
                  {trend.platform.toLowerCase()}
                </Badge>
                {trend.region && (
                  <Badge variant="outline" className={`text-xs ${darkMode ? "border-gray-600 text-gray-300" : "border-gray-300 text-gray-600"}`}>
                    {trend.region}
                  </Badge>
                )}
                <Badge variant="outline" className={`text-xs ${darkMode ? "border-gray-600 text-gray-300" : "border-gray-300 text-gray-600"}`}>
                  {forecast.timeframe}
                </Badge>
              </div>
            </div>

            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${getTrendColor()}`}>
              {getTrendIcon()}
              <span className="text-sm font-medium capitalize">{forecast.trend}</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Current vs Predicted Scores */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-4 rounded-lg border ${darkMode ? "bg-gray-800/50 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className={`w-4 h-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`} />
                <span className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Current Score</span>
              </div>
              <div className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
                {forecast.currentScore.toFixed(0)}
              </div>
            </div>

            <div className={`p-4 rounded-lg border ${darkMode ? "bg-gray-800/50 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
              <div className="flex items-center gap-2 mb-2">
                <Target className={`w-4 h-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`} />
                <span className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Predicted Score</span>
              </div>
              <div className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
                {forecast.predictedScore.toFixed(0)}
              </div>
              <div className={`text-sm flex items-center gap-1 mt-1 ${scoreDifference > 0 ? "text-emerald-400" : "text-red-400"}`}>
                {scoreDifference > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {scoreDifference > 0 ? "+" : ""}{changePercentage}%
              </div>
            </div>

            <div className={`p-4 rounded-lg border ${darkMode ? "bg-gray-800/50 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
              <div className="flex items-center gap-2 mb-2">
                <Zap className={`w-4 h-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`} />
                <span className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Confidence</span>
              </div>
              <div className={`text-2xl font-bold ${getConfidenceColor(forecast.confidence)}`}>
                {(forecast.confidence * 100).toFixed(0)}%
              </div>
              <Progress value={forecast.confidence * 100} className="h-1 mt-2" />
            </div>
          </div>

          {/* Trend Chart */}
          <div className={`p-4 rounded-lg border ${darkMode ? "bg-gray-800/50 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
            <div className="flex items-center gap-2 mb-4">
              <Activity className={`w-4 h-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`} />
              <span className={`text-sm font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>
                Trend Momentum
              </span>
            </div>
            
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={fullChartData}>
                  <defs>
                    <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#374151" : "#e5e7eb"} />
                  <XAxis 
                    dataKey="date" 
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
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fill="url(#scoreGradient)"
                    connectNulls={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#10b981"
                    strokeWidth={3}
                    strokeDasharray="5 5"
                    dot={false}
                    connectNulls={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Key Factors */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Eye className={`w-4 h-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`} />
              <span className={`text-sm font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>
                Key Factors
              </span>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {forecast.factors.map((factor, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    darkMode
                      ? "bg-gray-800/30 border-gray-700"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${
                    index % 3 === 0 ? "bg-blue-400" : 
                    index % 3 === 1 ? "bg-emerald-400" : "bg-yellow-400"
                  }`} />
                  <span className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                    {factor}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className={`w-4 h-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`} />
              <span className={`text-sm font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>
                AI Recommendations
              </span>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {forecast.recommendations.map((recommendation, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-3 p-3 rounded-lg border ${
                    darkMode
                      ? "bg-blue-500/10 border-blue-500/20"
                      : "bg-blue-50 border-blue-200"
                  }`}
                >
                  <ArrowRight className={`w-4 h-4 mt-0.5 ${darkMode ? "text-blue-400" : "text-blue-600"}`} />
                  <span className={`text-sm ${darkMode ? "text-blue-200" : "text-blue-700"}`}>
                    {recommendation}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Button */}
          {onViewDetails && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                onClick={onViewDetails}
                variant="outline"
                className="w-full"
              >
                <Calendar className="w-4 h-4 mr-2" />
                View Detailed Analytics
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
} 