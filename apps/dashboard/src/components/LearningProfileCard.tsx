'use client';

import { useState } from 'react';
import {
  CpuChipIcon,

  CheckCircleIcon,
  ArrowTrendingUpIcon,
  ChatBubbleLeftRightIcon,
  GlobeAltIcon,
  LightBulbIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

interface LearningProfile {
  campaignId: string;
  score: number;
  toneAdjustment: string;
  trendAdjustment: string;
  platformStrategy: string;
  effectivenessScore: number;
  lastUpdated: string;
  adaptationsCount: number;
  successRate: number;
}

interface LearningProfileCardProps {
  profile: LearningProfile;
  isExpanded?: boolean;
  onToggleExpanded?: () => void;
  className?: string;
}

export default function LearningProfileCard({
  profile,
  isExpanded = false,
  onToggleExpanded,
  className = '',
}: LearningProfileCardProps): JSX.Element {
  const [showDetails, setShowDetails] = useState(isExpanded);

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-neon-green';
    if (score >= 70) return 'text-neon-blue';
    if (score >= 50) return 'text-neon-purple';
    return 'text-neon-pink';
  };

  const getScoreBackground = (score: number) => {
    if (score >= 85) return 'bg-neon-green/20';
    if (score >= 70) return 'bg-neon-blue/20';
    if (score >= 50) return 'bg-neon-purple/20';
    return 'bg-neon-pink/20';
  };

  const getToneIcon = (tone: string) => {
    if (tone.toLowerCase().includes('professional')) return ChatBubbleLeftRightIcon;
    if (tone.toLowerCase().includes('casual')) return SparklesIcon;
    if (tone.toLowerCase().includes('friendly')) return CheckCircleIcon;
    return ChatBubbleLeftRightIcon;
  };

  const getToneColor = (tone: string) => {
    if (tone.toLowerCase().includes('professional')) return 'text-neon-blue';
    if (tone.toLowerCase().includes('casual')) return 'text-neon-green';
    if (tone.toLowerCase().includes('friendly')) return 'text-neon-purple';
    return 'text-gray-400';
  };

  const extractPlatforms = (platformStrategy: string): string[] => {
    const platforms = ['instagram', 'facebook', 'twitter', 'linkedin', 'tiktok', 'youtube'];
    return platforms.filter(platform => 
      platformStrategy.toLowerCase().includes(platform)
    );
  };

  const getPlatformIcon = (platform: string) => {
    // Return appropriate icon based on platform
    return GlobeAltIcon; // Default icon
  };

  const ToneIcon = getToneIcon(profile.toneAdjustment);
  const detectedPlatforms = extractPlatforms(profile.platformStrategy);

  return (
    <div className={`glass-strong p-6 rounded-2xl hover:scale-105 transition-all duration-200 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-r from-neon-blue to-neon-purple rounded-xl flex items-center justify-center">
            <CpuChipIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Learning Profile</h3>
            <p className="text-sm text-gray-400">Campaign AI Strategy</p>
          </div>
        </div>

        {/* Learning Score */}
        <div className={`flex items-center space-x-2 px-4 py-2 rounded-full ${getScoreBackground(profile.score)}`}>
          <div className={`text-xl font-bold ${getScoreColor(profile.score)}`}>
            {profile.score}
          </div>
          <div className="text-xs text-gray-300">/100</div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <div className="text-lg font-bold text-white">{profile.adaptationsCount}</div>
          <div className="text-xs text-gray-400">Adaptations</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-neon-green">{profile.successRate}%</div>
          <div className="text-xs text-gray-400">Success Rate</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-neon-blue">{profile.effectivenessScore}%</div>
          <div className="text-xs text-gray-400">Effectiveness</div>
        </div>
      </div>

      {/* Main Strategy Display */}
      <div className="space-y-4">
        {/* Tone Strategy */}
        <div className="glass p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <ToneIcon className={`h-5 w-5 ${getToneColor(profile.toneAdjustment)}`} />
              <div>
                <div className="font-semibold text-white">Tone Strategy</div>
                <div className="text-sm text-gray-400">{profile.toneAdjustment}</div>
              </div>
            </div>
            <CheckCircleIcon className="h-5 w-5 text-neon-green" />
          </div>
        </div>

        {/* Platform Focus */}
        <div className="glass p-4 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <GlobeAltIcon className="h-5 w-5 text-neon-blue" />
              <div>
                <div className="font-semibold text-white">Platform Focus</div>
                <div className="text-sm text-gray-400">Active platforms</div>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {detectedPlatforms.length > 0 ? (
              detectedPlatforms.map((platform) => (
                <span
                  key={platform}
                  className="px-3 py-1 bg-neon-blue/20 text-neon-blue text-xs font-medium rounded-full capitalize"
                >
                  {platform}
                </span>
              ))
            ) : (
              <span className="text-xs text-gray-500">All platforms</span>
            )}
          </div>
        </div>

        {/* Trend Strategy */}
        <div className="glass p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <ArrowTrendingUpIcon className="h-5 w-5 text-neon-purple" />
              <div>
                <div className="font-semibold text-white">Trend Strategy</div>
                <div className="text-sm text-gray-400">{profile.trendAdjustment}</div>
              </div>
            </div>
            <ArrowTrendingUpIcon className="h-5 w-5 text-neon-purple" />
          </div>
        </div>
      </div>

      {/* Expandable Details */}
      {showDetails && (
        <div className="mt-6 pt-6 border-t border-gray-700 space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Campaign ID:</span>
            <span className="text-white font-mono">{profile.campaignId}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Last Updated:</span>
            <span className="text-white">{new Date(profile.lastUpdated).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Platform Strategy:</span>
            <span className="text-white text-right max-w-48 truncate">{profile.platformStrategy}</span>
          </div>
        </div>
      )}

      {/* Toggle Details Button */}
      <button
        onClick={() => {
          setShowDetails(!showDetails);
          onToggleExpanded?.();
        }}
        className="w-full mt-4 py-2 text-sm text-gray-400 hover:text-white transition-colors duration-200"
      >
        {showDetails ? 'Show Less' : 'Show Details'}
      </button>

      {/* Performance Indicator */}
      <div className="mt-4 flex items-center justify-center">
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${
              profile.score >= 85
                ? 'bg-gradient-to-r from-neon-green to-neon-blue'
                : profile.score >= 70
                ? 'bg-gradient-to-r from-neon-blue to-neon-purple'
                : 'bg-gradient-to-r from-neon-purple to-neon-pink'
            }`}
            style={{ width: `${profile.score}%` }}
          />
        </div>
      </div>
    </div>
  );
} 