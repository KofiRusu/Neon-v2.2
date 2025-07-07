'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, ExternalLink, Hash } from 'lucide-react';

interface TrendData {
  source: string;
  keyword: string;
  score: number;
  change: number;
  url?: string;
  volume: number;
  sentiment: 'positive' | 'negative' | 'neutral';
}

interface CampaignTrendPulseProps {
  campaignId: string;
  trends: TrendData[];
  isLoading?: boolean;
  className?: string;
}

export const CampaignTrendPulse = ({ 
  campaignId, 
  trends, 
  isLoading = false, 
  className = '' 
}: CampaignTrendPulseProps) => {
  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="w-3 h-3 text-green-400" />;
    if (change < 0) return <TrendingDown className="w-3 h-3 text-red-400" />;
    return <Minus className="w-3 h-3 text-gray-400" />;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-400';
    if (change < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'bg-green-500/20 text-green-400';
      case 'negative':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const maxVolume = Math.max(...trends.map(t => t.volume), 1);

  if (isLoading) {
    return (
      <div className={`bg-gray-800/30 rounded-xl border border-gray-700/30 p-4 ${className}`}>
        <div className="flex items-center space-x-2 mb-3">
          <div className="w-4 h-4 bg-gray-600 rounded animate-pulse" />
          <div className="w-20 h-4 bg-gray-600 rounded animate-pulse" />
        </div>
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gray-600 rounded animate-pulse" />
              <div className="flex-1 h-4 bg-gray-600 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`bg-gray-800/30 rounded-xl border border-gray-700/30 p-4 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Hash className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-semibold text-white">Trend Pulse</h3>
        </div>
        <div className="text-xs text-gray-400">
          {trends.length} trends detected
        </div>
      </div>

      {/* Trends List */}
      <div className="space-y-3">
        {trends.length === 0 ? (
          <div className="text-center py-4">
            <Hash className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">No trends detected</p>
          </div>
        ) : (
          trends.map((trend, index) => (
            <motion.div
              key={`${trend.source}-${trend.keyword}-${index}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-700/20 transition-colors"
            >
              {/* Trend Source */}
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">
                    {trend.source.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Trend Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="text-white text-sm font-medium truncate">
                    {trend.keyword}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${getSentimentColor(trend.sentiment)}`}>
                    {trend.sentiment}
                  </span>
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-xs text-gray-400">{trend.source}</span>
                  <span className="text-xs text-gray-500">•</span>
                  <span className="text-xs text-gray-400">
                    {trend.volume.toLocaleString()} mentions
                  </span>
                </div>
              </div>

              {/* Trend Metrics */}
              <div className="flex items-center space-x-2">
                {/* Volume Bar */}
                <div className="w-12 h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500"
                    style={{ width: `${(trend.volume / maxVolume) * 100}%` }}
                  />
                </div>

                {/* Score */}
                <div className="text-right">
                  <div className={`text-sm font-semibold ${getScoreColor(trend.score)}`}>
                    {trend.score}
                  </div>
                  <div className={`flex items-center space-x-1 ${getChangeColor(trend.change)}`}>
                    {getTrendIcon(trend.change)}
                    <span className="text-xs">
                      {trend.change > 0 ? '+' : ''}{trend.change}%
                    </span>
                  </div>
                </div>

                {/* External Link */}
                {trend.url && (
                  <button
                    onClick={() => window.open(trend.url, '_blank')}
                    className="p-1 text-gray-400 hover:text-purple-400 transition-colors"
                    title="View source"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Summary */}
      {trends.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-700/30">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">Avg. Impact Score</span>
            <span className={`font-semibold ${getScoreColor(trends.reduce((acc, t) => acc + t.score, 0) / trends.length)}`}>
              {Math.round(trends.reduce((acc, t) => acc + t.score, 0) / trends.length)}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs mt-1">
            <span className="text-gray-400">Total Volume</span>
            <span className="text-white font-semibold">
              {trends.reduce((acc, t) => acc + t.volume, 0).toLocaleString()}
            </span>
          </div>
        </div>
      )}
    </motion.div>
  );
}; 