'use client';

import { useState } from 'react';
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,

  SparklesIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  HeartIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline';

interface ToneMetric {
  tone: string;
  engagementRate: number;
  conversionRate: number;
  reachRate: number;
  campaignCount: number;
  averageScore: number;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
  icon: React.ComponentType<any>;
  color: string;
  backgroundColor: string;
}

interface ToneEffectivenessChartProps {
  data?: ToneMetric[];
  timeRange?: string;
  className?: string;
  showComparison?: boolean;
}

export default function ToneEffectivenessChart({
  data,
  timeRange = '7d',
  className = '',
  showComparison = true,
}: ToneEffectivenessChartProps): JSX.Element {
  const [selectedMetric, setSelectedMetric] = useState<string>('engagementRate');
  const [hoveredTone, setHoveredTone] = useState<string | null>(null);

  // Mock data if none provided
  const defaultData: ToneMetric[] = [
    {
      tone: 'Professional',
      engagementRate: 78,
      conversionRate: 12.4,
      reachRate: 89,
      campaignCount: 15,
      averageScore: 85,
      trend: 'up',
      trendPercentage: 8.2,
      icon: AcademicCapIcon,
      color: 'text-neon-blue',
      backgroundColor: 'bg-neon-blue',
    },
    {
      tone: 'Casual',
      engagementRate: 92,
      conversionRate: 15.8,
      reachRate: 76,
      campaignCount: 12,
      averageScore: 88,
      trend: 'up',
      trendPercentage: 12.1,
      icon: SparklesIcon,
      color: 'text-neon-green',
      backgroundColor: 'bg-neon-green',
    },
    {
      tone: 'Friendly',
      engagementRate: 85,
      conversionRate: 14.2,
      reachRate: 82,
      campaignCount: 18,
      averageScore: 82,
      trend: 'stable',
      trendPercentage: 1.3,
      icon: HeartIcon,
      color: 'text-neon-purple',
      backgroundColor: 'bg-neon-purple',
    },
    {
      tone: 'Authoritative',
      engagementRate: 68,
      conversionRate: 18.5,
      reachRate: 95,
      campaignCount: 8,
      averageScore: 79,
      trend: 'down',
      trendPercentage: -4.7,
      icon: CheckCircleIcon,
      color: 'text-neon-pink',
      backgroundColor: 'bg-neon-pink',
    },
    {
      tone: 'Playful',
      engagementRate: 95,
      conversionRate: 11.2,
      reachRate: 72,
      campaignCount: 10,
      averageScore: 76,
      trend: 'up',
      trendPercentage: 18.9,
      icon: SparklesIcon,
      color: 'text-neon-yellow',
      backgroundColor: 'bg-neon-yellow',
    },
  ];

  const chartData = data || defaultData;
  const maxValue = Math.max(...chartData.map(item => item[selectedMetric as keyof ToneMetric] as number));

  const getMetricValue = (tone: ToneMetric, metric: string): number => {
    return tone[metric as keyof ToneMetric] as number;
  };

  const getMetricLabel = (metric: string): string => {
    switch (metric) {
      case 'engagementRate': return 'Engagement Rate (%)';
      case 'conversionRate': return 'Conversion Rate (%)';
      case 'reachRate': return 'Reach Rate (%)';
      case 'averageScore': return 'Average Score';
      default: return 'Metric';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return ArrowTrendingUpIcon;
      case 'down': return ArrowTrendingDownIcon;
      default: return ArrowTrendingUpIcon;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-neon-green';
      case 'down': return 'text-neon-pink';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className={`glass-strong p-6 rounded-2xl ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-neon-purple rounded-xl flex items-center justify-center">
            <ChartBarIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Tone Effectiveness</h3>
            <p className="text-sm text-gray-400">Performance comparison across different tones</p>
          </div>
        </div>

        {/* Metric Selector */}
        <select
          value={selectedMetric}
          onChange={(e) => setSelectedMetric(e.target.value)}
          className="bg-gray-800 border border-gray-700 text-white px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
        >
          <option value="engagementRate">Engagement Rate</option>
          <option value="conversionRate">Conversion Rate</option>
          <option value="reachRate">Reach Rate</option>
          <option value="averageScore">Average Score</option>
        </select>
      </div>

      {/* Chart */}
      <div className="mb-6">
        <div className="flex items-end space-x-4 h-64 mb-4">
          {chartData.map((tone, index) => {
            const value = getMetricValue(tone, selectedMetric);
            const percentage = (value / maxValue) * 100;
            const isHovered = hoveredTone === tone.tone;
            const Icon = tone.icon;
            const TrendIcon = getTrendIcon(tone.trend);

            return (
              <div
                key={tone.tone}
                className="flex-1 flex flex-col items-center group cursor-pointer"
                onMouseEnter={() => setHoveredTone(tone.tone)}
                onMouseLeave={() => setHoveredTone(null)}
              >
                {/* Value Label */}
                <div className={`text-sm font-bold mb-2 transition-opacity ${
                  isHovered ? tone.color : 'text-gray-400 opacity-0 group-hover:opacity-100'
                }`}>
                  {selectedMetric.includes('Rate') ? `${value}%` : value.toFixed(1)}
                </div>

                {/* Bar */}
                <div
                  className={`w-full rounded-t-lg transition-all duration-500 relative ${
                    isHovered 
                      ? `${tone.backgroundColor} shadow-lg shadow-${tone.color.split('-')[1]}/50 scale-105`
                      : `${tone.backgroundColor}/70 hover:${tone.backgroundColor} hover:scale-105`
                  }`}
                  style={{ height: `${percentage}%` }}
                >
                  {/* Trend Indicator */}
                  <div className={`absolute -top-6 left-1/2 transform -translate-x-1/2 ${
                    isHovered ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  } transition-opacity`}>
                    <TrendIcon className={`h-4 w-4 ${getTrendColor(tone.trend)}`} />
                  </div>
                </div>

                {/* Tone Info */}
                <div className="mt-3 text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Icon className={`h-4 w-4 ${tone.color} mr-1`} />
                    <span className="text-sm font-medium text-white">{tone.tone}</span>
                  </div>
                  <div className="text-xs text-gray-400">
                    {tone.campaignCount} campaigns
                  </div>
                  
                  {/* Trend Percentage */}
                  <div className={`text-xs font-medium mt-1 ${getTrendColor(tone.trend)}`}>
                    {tone.trend === 'up' ? '+' : tone.trend === 'down' ? '' : '±'}
                    {Math.abs(tone.trendPercentage)}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Chart Labels */}
        <div className="text-center">
          <div className="text-sm font-medium text-gray-400">
            {getMetricLabel(selectedMetric)}
          </div>
        </div>
      </div>

      {/* Selected Tone Details */}
      {hoveredTone && (
        <div className="glass p-4 rounded-xl mb-4">
          {(() => {
            const tone = chartData.find(t => t.tone === hoveredTone);
            if (!tone) return null;
            
            const Icon = tone.icon;
            return (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Icon className={`h-6 w-6 ${tone.color}`} />
                  <div>
                    <div className="font-semibold text-white">{tone.tone} Tone</div>
                    <div className="text-sm text-gray-400">
                      {getMetricLabel(selectedMetric)}: {
                        selectedMetric.includes('Rate') 
                          ? `${getMetricValue(tone, selectedMetric)}%` 
                          : getMetricValue(tone, selectedMetric).toFixed(1)
                      }
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-bold ${tone.color}`}>
                    Rank #{chartData
                      .sort((a, b) => getMetricValue(b, selectedMetric) - getMetricValue(a, selectedMetric))
                      .findIndex(t => t.tone === tone.tone) + 1}
                  </div>
                  <div className="text-xs text-gray-400">Performance rank</div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Comparison Mode */}
      {showComparison && (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-white">Performance Breakdown</h4>
          <div className="grid grid-cols-2 gap-4">
            {chartData
              .sort((a, b) => getMetricValue(b, selectedMetric) - getMetricValue(a, selectedMetric))
              .slice(0, 3)
              .map((tone, index) => {
                const Icon = tone.icon;
                const value = getMetricValue(tone, selectedMetric);
                
                return (
                  <div key={tone.tone} className="glass p-3 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`w-6 h-6 ${tone.backgroundColor} rounded-lg flex items-center justify-center`}>
                          <Icon className="h-3 w-3 text-white" />
                        </div>
                        <span className="text-sm font-medium text-white">{tone.tone}</span>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-bold ${tone.color}`}>
                          {selectedMetric.includes('Rate') ? `${value}%` : value.toFixed(1)}
                        </div>
                        <div className="text-xs text-gray-400">
                          #{index + 1}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-gray-700">
        <div className="text-center">
          <div className="text-lg font-bold text-white">
            {Math.max(...chartData.map(t => getMetricValue(t, selectedMetric))).toFixed(1)}
            {selectedMetric.includes('Rate') ? '%' : ''}
          </div>
          <div className="text-xs text-gray-400">Best Performance</div>
        </div>
        
        <div className="text-center">
          <div className="text-lg font-bold text-white">
            {(chartData.reduce((sum, t) => sum + getMetricValue(t, selectedMetric), 0) / chartData.length).toFixed(1)}
            {selectedMetric.includes('Rate') ? '%' : ''}
          </div>
          <div className="text-xs text-gray-400">Average</div>
        </div>
        
        <div className="text-center">
          <div className="text-lg font-bold text-white">
            {chartData.reduce((sum, t) => sum + t.campaignCount, 0)}
          </div>
          <div className="text-xs text-gray-400">Total Campaigns</div>
        </div>
      </div>
    </div>
  );
} 