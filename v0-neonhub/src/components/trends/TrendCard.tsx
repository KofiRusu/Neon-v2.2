'use client';

import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

interface TrendCardProps {
  trend: {
    id: string;
    title: string;
    type: 'hashtag' | 'sound' | 'style' | 'challenge' | 'format';
    platform: 'instagram' | 'tiktok' | 'youtube' | 'twitter' | 'linkedin';
    region: string;
    impactScore: number;
    projectedLift: number;
    velocity: number;
    description: string;
    recommendation: string;
    confidence: number;
    detectedAt: Date;
    expiresAt: Date | null;
    relatedKeywords: string[];
    metrics: {
      mentions: number;
      engagement: number;
      reach: number;
      growth: number;
    };
  };
  darkMode: boolean;
  onClick: () => void;
  isSelected: boolean;
}

const typeIcons = {
  hashtag: '🏷️',
  sound: '🎵',
  style: '🎨',
  challenge: '🎯',
  format: '📱',
};

const platformColors = {
  instagram: {
    bg: 'from-pink-500/20 via-purple-500/20 to-pink-500/20',
    border: 'border-pink-500/30',
    text: 'text-pink-400',
    glow: 'shadow-pink-500/20',
  },
  tiktok: {
    bg: 'from-black/20 via-red-500/20 to-black/20',
    border: 'border-red-500/30',
    text: 'text-red-400',
    glow: 'shadow-red-500/20',
  },
  youtube: {
    bg: 'from-red-500/20 via-white/10 to-red-500/20',
    border: 'border-red-500/30',
    text: 'text-red-400',
    glow: 'shadow-red-500/20',
  },
  twitter: {
    bg: 'from-blue-500/20 via-cyan-500/20 to-blue-500/20',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
    glow: 'shadow-blue-500/20',
  },
  linkedin: {
    bg: 'from-blue-600/20 via-blue-800/20 to-blue-600/20',
    border: 'border-blue-600/30',
    text: 'text-blue-400',
    glow: 'shadow-blue-600/20',
  },
};

const platformIcons = {
  instagram: '📸',
  tiktok: '🎵',
  youtube: '📺',
  twitter: '🐦',
  linkedin: '💼',
};

export function TrendCard({ trend, darkMode, onClick, isSelected }: TrendCardProps) {
  const platformStyle = platformColors[trend.platform];

  const getImpactColor = (score: number) => {
    if (score >= 80) return 'text-red-400 bg-red-500/10 border-red-500/30'; // Hot
    if (score >= 60) return 'text-orange-400 bg-orange-500/10 border-orange-500/30'; // Warm
    return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30'; // Cool
  };

  const getVelocityColor = (velocity: number) => {
    if (velocity > 20) return 'text-green-400'; // Rising fast
    if (velocity > 0) return 'text-blue-400'; // Rising
    if (velocity > -20) return 'text-yellow-400'; // Stable
    return 'text-red-400'; // Declining
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getConfidenceEmoji = (confidence: number) => {
    if (confidence >= 0.9) return '🎯';
    if (confidence >= 0.8) return '✅';
    if (confidence >= 0.7) return '🔶';
    return '⚠️';
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
        ${isSelected ? 'ring-2 ring-blue-400 ring-opacity-50' : ''}
      `}
    >
      {/* Animated velocity wave pulse */}
      {Math.abs(trend.velocity) > 10 && (
        <div className={`absolute inset-0 bg-gradient-to-r ${platformStyle.bg} opacity-30`}>
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
            animate={{
              x: ['-100%', '100%'],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        </div>
      )}

      <div className="relative p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="text-2xl">{typeIcons[trend.type]}</div>
            <div>
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {trend.title}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-sm ${platformStyle.text}`}>
                  {platformIcons[trend.platform]} {trend.platform}
                </span>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    darkMode ? 'bg-white/10 text-gray-300' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {trend.region}
                </span>
              </div>
            </div>
          </div>

          {/* Floating Impact Meter */}
          <div
            className={`flex flex-col items-center px-3 py-2 rounded-xl border ${getImpactColor(
              trend.impactScore
            )}`}
          >
            <div className="text-lg font-bold">{trend.impactScore}</div>
            <div className="text-xs">Impact</div>
          </div>
        </div>

        {/* Description */}
        <p className={`text-sm mb-4 line-clamp-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          {trend.description}
        </p>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="text-center">
            <div className={`text-lg font-bold ${getVelocityColor(trend.velocity)}`}>
              {trend.velocity > 0 ? '+' : ''}
              {trend.velocity.toFixed(0)}
            </div>
            <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Velocity
            </div>
          </div>

          <div className="text-center">
            <div className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              +{trend.projectedLift}%
            </div>
            <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Proj. Lift
            </div>
          </div>

          <div className="text-center">
            <div className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {formatNumber(trend.metrics.reach)}
            </div>
            <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Reach</div>
          </div>

          <div className="text-center">
            <div className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {formatNumber(trend.metrics.mentions)}
            </div>
            <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Mentions
            </div>
          </div>
        </div>

        {/* Keywords */}
        <div className="flex flex-wrap gap-2 mb-4">
          {trend.relatedKeywords.slice(0, 3).map((keyword, index) => (
            <span
              key={index}
              className={`px-2 py-1 text-xs rounded-lg border ${
                darkMode
                  ? 'bg-white/10 border-white/20 text-white'
                  : 'bg-gray-100 border-gray-200 text-gray-700'
              }`}
            >
              #{keyword}
            </span>
          ))}
          {trend.relatedKeywords.length > 3 && (
            <span
              className={`px-2 py-1 text-xs rounded-lg border ${
                darkMode
                  ? 'bg-white/10 border-white/20 text-gray-300'
                  : 'bg-gray-100 border-gray-200 text-gray-500'
              }`}
            >
              +{trend.relatedKeywords.length - 3} more
            </span>
          )}
        </div>

        {/* Recommendation */}
        <div
          className={`p-3 rounded-lg border mb-4 ${
            darkMode ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-200'
          }`}
        >
          <div
            className={`text-sm font-medium mb-1 ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}
          >
            🎯 AI Recommendation:
          </div>
          <p className={`text-xs ${darkMode ? 'text-blue-200' : 'text-blue-600'}`}>
            {trend.recommendation}
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{getConfidenceEmoji(trend.confidence)}</span>
            <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {(trend.confidence * 100).toFixed(0)}% confidence
            </span>
          </div>

          <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {formatDistanceToNow(new Date(trend.detectedAt), { addSuffix: true })}
          </div>
        </div>

        {/* Expiry warning */}
        {trend.expiresAt && new Date(trend.expiresAt).getTime() - Date.now() < 86400000 * 3 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20"
          >
            <div className="text-xs text-yellow-400 flex items-center gap-1">
              ⏰ Expires {formatDistanceToNow(new Date(trend.expiresAt), { addSuffix: true })}
            </div>
          </motion.div>
        )}
      </div>

      {/* Selection overlay */}
      {isSelected && (
        <div className="absolute inset-0 rounded-2xl bg-blue-400/10 pointer-events-none" />
      )}
    </motion.div>
  );
}
