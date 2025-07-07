"use client";

import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Progress } from "../ui/progress";
import { TrendingUp, TrendingDown, Share, Heart, MessageCircle, Eye, ArrowUpRight } from "lucide-react";

interface TrendCardProps {
  trend: {
    id: string;
    keyword: string;
    platform: "FACEBOOK" | "INSTAGRAM" | "TIKTOK" | "TWITTER" | "LINKEDIN" | "YOUTUBE" | "PINTEREST" | "GOOGLE";
    category?: string | null;
    title?: string | null;
    description?: string | null;
    viralityScore: number;
    relevanceScore: number;
    opportunityScore: number;
    overallScore: number;
    volume?: number | null;
    growth?: number | null;
    engagement?: number | null;
    shares?: number | null;
    likes?: number | null;
    comments?: number | null;
    region?: string | null;
    language?: string | null;
    tags: string[];
    aiExplanation?: string | null;
    campaignRelevance?: any;
    contentSuggestions?: any;
    status: string;
    detectedAt: Date;
    updatedAt: Date;
    peakDate?: Date | null;
    expiresAt?: Date | null;
  };
  darkMode?: boolean;
  onClick?: () => void;
  isSelected?: boolean;
  showActions?: boolean;
  onUseTrend?: () => void;
}

const platformColors = {
  FACEBOOK: {
    bg: "from-blue-600/20 via-blue-500/20 to-blue-600/20",
    border: "border-blue-500/30",
    text: "text-blue-400",
    glow: "shadow-blue-500/20",
    icon: "👥",
  },
  INSTAGRAM: {
    bg: "from-pink-500/20 via-purple-500/20 to-pink-500/20",
    border: "border-pink-500/30",
    text: "text-pink-400",
    glow: "shadow-pink-500/20",
    icon: "📸",
  },
  TIKTOK: {
    bg: "from-black/20 via-red-500/20 to-black/20",
    border: "border-red-500/30",
    text: "text-red-400",
    glow: "shadow-red-500/20",
    icon: "🎵",
  },
  TWITTER: {
    bg: "from-blue-500/20 via-cyan-500/20 to-blue-500/20",
    border: "border-blue-500/30",
    text: "text-blue-400",
    glow: "shadow-blue-500/20",
    icon: "🐦",
  },
  LINKEDIN: {
    bg: "from-blue-600/20 via-blue-800/20 to-blue-600/20",
    border: "border-blue-600/30",
    text: "text-blue-400",
    glow: "shadow-blue-600/20",
    icon: "💼",
  },
  YOUTUBE: {
    bg: "from-red-500/20 via-white/10 to-red-500/20",
    border: "border-red-500/30",
    text: "text-red-400",
    glow: "shadow-red-500/20",
    icon: "📺",
  },
  PINTEREST: {
    bg: "from-red-600/20 via-pink-500/20 to-red-600/20",
    border: "border-red-600/30",
    text: "text-red-400",
    glow: "shadow-red-600/20",
    icon: "📌",
  },
  GOOGLE: {
    bg: "from-green-500/20 via-blue-500/20 to-red-500/20",
    border: "border-blue-500/30",
    text: "text-blue-400",
    glow: "shadow-blue-500/20",
    icon: "🔍",
  },
};

export function TrendCard({
  trend,
  darkMode = false,
  onClick,
  isSelected = false,
  showActions = true,
  onUseTrend,
}: TrendCardProps) {
  const platformStyle = platformColors[trend.platform];

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
    if (score >= 60) return "text-yellow-400 bg-yellow-500/10 border-yellow-500/30";
    if (score >= 40) return "text-orange-400 bg-orange-500/10 border-orange-500/30";
    return "text-red-400 bg-red-500/10 border-red-500/30";
  };

  const getGrowthColor = (growth: number | null) => {
    if (!growth) return "text-gray-400";
    if (growth > 20) return "text-emerald-400";
    if (growth > 0) return "text-blue-400";
    if (growth > -20) return "text-yellow-400";
    return "text-red-400";
  };

  const formatNumber = (num: number | null) => {
    if (!num) return "0";
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
      declining: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
      expired: "bg-red-500/10 text-red-400 border-red-500/30",
    };
    return statusColors[status as keyof typeof statusColors] || statusColors.active;
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        relative cursor-pointer rounded-2xl border backdrop-blur-xl overflow-hidden
        transition-all duration-300 hover:shadow-2xl
        ${
          darkMode
            ? `bg-gradient-to-br ${platformStyle.bg} ${platformStyle.border} hover:${platformStyle.glow}`
            : `bg-white/90 ${platformStyle.border} hover:${platformStyle.glow}`
        }
        ${isSelected ? "ring-2 ring-blue-400 ring-opacity-50" : ""}
      `}
    >
      {/* Animated growth pulse */}
      {trend.growth && trend.growth > 10 && (
        <div className={`absolute inset-0 bg-gradient-to-r ${platformStyle.bg} opacity-30`}>
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
        </div>
      )}

      <Card className="relative border-0 bg-transparent shadow-none">
        <CardHeader className="pb-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="text-2xl">{platformStyle.icon}</div>
              <div className="flex-1">
                <h3 className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
                  {trend.title || trend.keyword}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-sm ${platformStyle.text}`}>
                    {trend.platform.toLowerCase()}
                  </span>
                  {trend.region && (
                    <Badge variant="outline" className={`text-xs ${darkMode ? "border-white/20 text-gray-300" : "border-gray-200 text-gray-600"}`}>
                      {trend.region}
                    </Badge>
                  )}
                  {trend.category && (
                    <Badge variant="outline" className={`text-xs ${darkMode ? "border-white/20 text-gray-300" : "border-gray-200 text-gray-600"}`}>
                      {trend.category}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Overall Score */}
            <div className={`flex flex-col items-center px-3 py-2 rounded-xl border ${getScoreColor(trend.overallScore)}`}>
              <div className="text-lg font-bold">{trend.overallScore.toFixed(0)}</div>
              <div className="text-xs">Score</div>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <Badge className={`text-xs border ${getStatusBadge(trend.status)}`}>
              {trend.status}
            </Badge>
            {trend.growth !== null && (
              <div className={`flex items-center gap-1 text-sm ${getGrowthColor(trend.growth)}`}>
                {trend.growth > 0 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                {trend.growth > 0 ? "+" : ""}{trend.growth?.toFixed(1)}%
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Description */}
          {trend.description && (
            <p className={`text-sm line-clamp-2 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
              {trend.description}
            </p>
          )}

          {/* Score Breakdown */}
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className={darkMode ? "text-gray-400" : "text-gray-500"}>Virality</span>
                <span className={darkMode ? "text-white" : "text-gray-900"}>{trend.viralityScore.toFixed(0)}%</span>
              </div>
              <Progress value={trend.viralityScore} className="h-1" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className={darkMode ? "text-gray-400" : "text-gray-500"}>Relevance</span>
                <span className={darkMode ? "text-white" : "text-gray-900"}>{trend.relevanceScore.toFixed(0)}%</span>
              </div>
              <Progress value={trend.relevanceScore} className="h-1" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className={darkMode ? "text-gray-400" : "text-gray-500"}>Opportunity</span>
                <span className={darkMode ? "text-white" : "text-gray-900"}>{trend.opportunityScore.toFixed(0)}%</span>
              </div>
              <Progress value={trend.opportunityScore} className="h-1" />
            </div>
          </div>

          {/* Engagement Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {trend.volume && (
              <div className="text-center">
                <div className={`text-lg font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
                  {formatNumber(trend.volume)}
                </div>
                <div className={`text-xs flex items-center justify-center gap-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  <Eye className="w-3 h-3" />
                  Volume
                </div>
              </div>
            )}

            {trend.engagement && (
              <div className="text-center">
                <div className={`text-lg font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
                  {(trend.engagement * 100).toFixed(1)}%
                </div>
                <div className={`text-xs flex items-center justify-center gap-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  <Heart className="w-3 h-3" />
                  Engagement
                </div>
              </div>
            )}

            {trend.shares && (
              <div className="text-center">
                <div className={`text-lg font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
                  {formatNumber(trend.shares)}
                </div>
                <div className={`text-xs flex items-center justify-center gap-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  <Share className="w-3 h-3" />
                  Shares
                </div>
              </div>
            )}

            {trend.comments && (
              <div className="text-center">
                <div className={`text-lg font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
                  {formatNumber(trend.comments)}
                </div>
                <div className={`text-xs flex items-center justify-center gap-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  <MessageCircle className="w-3 h-3" />
                  Comments
                </div>
              </div>
            )}
          </div>

          {/* Tags */}
          {trend.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {trend.tags.slice(0, 4).map((tag, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className={`text-xs ${
                    darkMode
                      ? "bg-white/10 border-white/20 text-white"
                      : "bg-gray-100 border-gray-200 text-gray-700"
                  }`}
                >
                  #{tag}
                </Badge>
              ))}
              {trend.tags.length > 4 && (
                <Badge
                  variant="outline"
                  className={`text-xs ${
                    darkMode
                      ? "bg-white/10 border-white/20 text-gray-300"
                      : "bg-gray-100 border-gray-200 text-gray-500"
                  }`}
                >
                  +{trend.tags.length - 4} more
                </Badge>
              )}
            </div>
          )}

          {/* AI Explanation */}
          {trend.aiExplanation && (
            <div className={`p-3 rounded-lg border ${
              darkMode
                ? "bg-blue-500/10 border-blue-500/20"
                : "bg-blue-50 border-blue-200"
            }`}>
              <div className={`text-sm font-medium mb-1 ${darkMode ? "text-blue-300" : "text-blue-700"}`}>
                🤖 AI Insight:
              </div>
              <p className={`text-xs ${darkMode ? "text-blue-200" : "text-blue-600"}`}>
                {trend.aiExplanation}
              </p>
            </div>
          )}

          {/* Actions */}
          {showActions && (
            <div className="flex items-center justify-between pt-2">
              <div className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                Detected {formatDistanceToNow(new Date(trend.detectedAt), { addSuffix: true })}
              </div>
              
              {onUseTrend && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUseTrend();
                  }}
                  className={`text-xs ${platformStyle.text} ${platformStyle.border}`}
                >
                  <ArrowUpRight className="w-3 h-3 mr-1" />
                  Use Trend
                </Button>
              )}
            </div>
          )}

          {/* Expiry Warning */}
          {trend.expiresAt && new Date(trend.expiresAt).getTime() - Date.now() < 86400000 * 3 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20"
            >
              <div className="text-xs text-yellow-400 flex items-center gap-1">
                ⏰ Expires {formatDistanceToNow(new Date(trend.expiresAt), { addSuffix: true })}
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Selection Overlay */}
      {isSelected && (
        <div className="absolute inset-0 rounded-2xl bg-blue-400/10 pointer-events-none" />
      )}
    </motion.div>
  );
}
