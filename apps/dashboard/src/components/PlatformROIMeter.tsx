'use client';

import { useState } from 'react';
import {

  CurrencyDollarIcon,
  UserGroupIcon,
  EyeIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  FireIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

interface PlatformMetric {
  platform: string;
  roi: number;
  engagementRate: number;
  conversionRate: number;
  reachRate: number;
  spend: number;
  revenue: number;
  impressions: number;
  clicks: number;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
  icon: string;
  color: string;
  backgroundColor: string;
}

interface PlatformROIMeterProps {
  data?: PlatformMetric[];
  selectedMetric?: string;
  className?: string;
  showHeatmap?: boolean;
}

export default function PlatformROIMeter({
  data,
  selectedMetric = 'roi',
  className = '',
  showHeatmap = true,
}: PlatformROIMeterProps): JSX.Element {
  const [currentMetric, setCurrentMetric] = useState<string>(selectedMetric);
  const [hoveredPlatform, setHoveredPlatform] = useState<string | null>(null);

  // Mock data if none provided
  const defaultData: PlatformMetric[] = [
    {
      platform: 'Instagram',
      roi: 285,
      engagementRate: 8.4,
      conversionRate: 3.2,
      reachRate: 92,
      spend: 5200,
      revenue: 14820,
      impressions: 125000,
      clicks: 10500,
      trend: 'up',
      trendPercentage: 23.5,
      icon: '📸',
      color: 'text-neon-purple',
      backgroundColor: 'bg-neon-purple',
    },
    {
      platform: 'LinkedIn',
      roi: 342,
      engagementRate: 6.8,
      conversionRate: 5.7,
      reachRate: 78,
      spend: 3800,
      revenue: 13000,
      impressions: 89000,
      clicks: 6052,
      trend: 'up',
      trendPercentage: 18.2,
      icon: '💼',
      color: 'text-neon-blue',
      backgroundColor: 'bg-neon-blue',
    },
    {
      platform: 'Facebook',
      roi: 198,
      engagementRate: 5.2,
      conversionRate: 2.8,
      reachRate: 95,
      spend: 6800,
      revenue: 13464,
      impressions: 245000,
      clicks: 12740,
      trend: 'stable',
      trendPercentage: 2.1,
      icon: '👥',
      color: 'text-neon-green',
      backgroundColor: 'bg-neon-green',
    },
    {
      platform: 'Twitter',
      roi: 156,
      engagementRate: 4.7,
      conversionRate: 1.9,
      reachRate: 88,
      spend: 2900,
      revenue: 4524,
      impressions: 156000,
      clicks: 7332,
      trend: 'down',
      trendPercentage: -8.4,
      icon: '🐦',
      color: 'text-neon-pink',
      backgroundColor: 'bg-neon-pink',
    },
    {
      platform: 'TikTok',
      roi: 412,
      engagementRate: 12.8,
      conversionRate: 4.1,
      reachRate: 87,
      spend: 1800,
      revenue: 7416,
      impressions: 98000,
      clicks: 12544,
      trend: 'up',
      trendPercentage: 45.7,
      icon: '🎵',
      color: 'text-neon-yellow',
      backgroundColor: 'bg-neon-yellow',
    },
    {
      platform: 'YouTube',
      roi: 267,
      engagementRate: 7.9,
      conversionRate: 3.5,
      reachRate: 82,
      spend: 4200,
      revenue: 11214,
      impressions: 67000,
      clicks: 5293,
      trend: 'up',
      trendPercentage: 12.8,
      icon: '📺',
      color: 'text-red-400',
      backgroundColor: 'bg-red-500',
    },
  ];

  const platformData = data || defaultData;
  const maxValue = Math.max(...platformData.map(p => p[currentMetric as keyof PlatformMetric] as number));

  const getMetricValue = (platform: PlatformMetric, metric: string): number => {
    return platform[metric as keyof PlatformMetric] as number;
  };

  const getMetricLabel = (metric: string): string => {
    switch (metric) {
      case 'roi': return 'ROI (%)';
      case 'engagementRate': return 'Engagement Rate (%)';
      case 'conversionRate': return 'Conversion Rate (%)';
      case 'reachRate': return 'Reach Rate (%)';
      case 'spend': return 'Ad Spend ($)';
      case 'revenue': return 'Revenue ($)';
      default: return 'Metric';
    }
  };

  const getROIColor = (roi: number) => {
    if (roi >= 300) return 'text-neon-green';
    if (roi >= 200) return 'text-neon-blue';
    if (roi >= 150) return 'text-neon-purple';
    return 'text-neon-pink';
  };

  const getROIBackground = (roi: number) => {
    if (roi >= 300) return 'bg-neon-green/20';
    if (roi >= 200) return 'bg-neon-blue/20';
    if (roi >= 150) return 'bg-neon-purple/20';
    return 'bg-neon-pink/20';
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

  // Sort platforms by selected metric
  const sortedPlatforms = [...platformData].sort((a, b) => 
    getMetricValue(b, currentMetric) - getMetricValue(a, currentMetric)
  );

  return (
    <div className={`glass-strong p-6 rounded-2xl ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-neon-green rounded-xl flex items-center justify-center">
            <TrendingUpIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Platform ROI</h3>
            <p className="text-sm text-gray-400">Performance metrics across platforms</p>
          </div>
        </div>

        {/* Metric Selector */}
        <select
          value={currentMetric}
          onChange={(e) => setCurrentMetric(e.target.value)}
          className="bg-gray-800 border border-gray-700 text-white px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
        >
          <option value="roi">ROI</option>
          <option value="engagementRate">Engagement Rate</option>
          <option value="conversionRate">Conversion Rate</option>
          <option value="reachRate">Reach Rate</option>
          <option value="spend">Ad Spend</option>
          <option value="revenue">Revenue</option>
        </select>
      </div>

      {/* ROI Gauges */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {sortedPlatforms.map((platform, index) => {
          const value = getMetricValue(platform, currentMetric);
          const percentage = (value / maxValue) * 100;
          const isHovered = hoveredPlatform === platform.platform;
          const TrendIcon = getTrendIcon(platform.trend);

          return (
            <div
              key={platform.platform}
              className={`glass p-4 rounded-xl cursor-pointer transition-all duration-300 ${
                isHovered ? 'scale-105 shadow-lg' : 'hover:scale-105'
              }`}
              onMouseEnter={() => setHoveredPlatform(platform.platform)}
              onMouseLeave={() => setHoveredPlatform(null)}
            >
              {/* Platform Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-xl">{platform.icon}</span>
                  <span className="font-semibold text-white">{platform.platform}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <TrendIcon className={`h-4 w-4 ${getTrendColor(platform.trend)}`} />
                  <span className={`text-xs font-medium ${getTrendColor(platform.trend)}`}>
                    {platform.trend === 'up' ? '+' : platform.trend === 'down' ? '' : '±'}
                    {Math.abs(platform.trendPercentage)}%
                  </span>
                </div>
              </div>

              {/* ROI Gauge */}
              <div className="relative w-20 h-20 mx-auto mb-3">
                <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                  {/* Background circle */}
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#374151"
                    strokeWidth="2"
                  />
                  {/* Progress circle */}
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke={platform.color === 'text-neon-purple' ? '#a855f7' : 
                           platform.color === 'text-neon-blue' ? '#3b82f6' :
                           platform.color === 'text-neon-green' ? '#10b981' :
                           platform.color === 'text-neon-pink' ? '#ec4899' :
                           platform.color === 'text-neon-yellow' ? '#f59e0b' : '#ef4444'}
                    strokeWidth="2"
                    strokeDasharray={`${Math.min(percentage, 100)}, 100`}
                    className="transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className={`text-lg font-bold ${platform.color}`}>
                      {currentMetric === 'roi' ? `${value}%` :
                       currentMetric.includes('Rate') ? `${value}%` :
                       currentMetric === 'spend' || currentMetric === 'revenue' ? `$${(value/1000).toFixed(1)}k` :
                       value.toFixed(1)}
                    </div>
                    <div className="text-xs text-gray-400">#{index + 1}</div>
                  </div>
                </div>
              </div>

              {/* Platform Stats */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">ROI:</span>
                  <span className={`font-semibold ${getROIColor(platform.roi)}`}>
                    {platform.roi}%
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">Engagement:</span>
                  <span className="text-white">{platform.engagementRate}%</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">Conversion:</span>
                  <span className="text-white">{platform.conversionRate}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Heatmap View */}
      {showHeatmap && (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-white">Performance Heatmap</h4>
          <div className="space-y-2">
            {sortedPlatforms.map((platform, index) => {
              const value = getMetricValue(platform, currentMetric);
              const percentage = (value / maxValue) * 100;
              const isTop = index < 2;
              
              return (
                <div
                  key={platform.platform}
                  className={`glass p-3 rounded-lg transition-all duration-300 ${
                    isTop ? 'border-l-4 border-neon-green' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{platform.icon}</span>
                      <div>
                        <div className="font-semibold text-white">{platform.platform}</div>
                        <div className="text-sm text-gray-400">
                          {getMetricLabel(currentMetric)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${platform.color}`}>
                        {currentMetric === 'roi' ? `${value}%` :
                         currentMetric.includes('Rate') ? `${value}%` :
                         currentMetric === 'spend' || currentMetric === 'revenue' ? `$${(value/1000).toFixed(1)}k` :
                         value.toFixed(1)}
                      </div>
                      <div className="text-xs text-gray-400">Rank #{index + 1}</div>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        isTop ? 'bg-gradient-to-r from-neon-green to-neon-blue' : platform.backgroundColor
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Detailed View for Hovered Platform */}
      {hoveredPlatform && (
        <div className="mt-6 glass p-4 rounded-xl">
          {(() => {
            const platform = platformData.find(p => p.platform === hoveredPlatform);
            if (!platform) return null;

            return (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <CurrencyDollarIcon className="h-5 w-5 text-neon-green mr-1" />
                    <span className="text-sm font-medium text-gray-400">ROI</span>
                  </div>
                  <div className="text-xl font-bold text-neon-green">{platform.roi}%</div>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <UserGroupIcon className="h-5 w-5 text-neon-blue mr-1" />
                    <span className="text-sm font-medium text-gray-400">Engagement</span>
                  </div>
                  <div className="text-xl font-bold text-neon-blue">{platform.engagementRate}%</div>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <CheckCircleIcon className="h-5 w-5 text-neon-purple mr-1" />
                    <span className="text-sm font-medium text-gray-400">Conversion</span>
                  </div>
                  <div className="text-xl font-bold text-neon-purple">{platform.conversionRate}%</div>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <EyeIcon className="h-5 w-5 text-neon-pink mr-1" />
                    <span className="text-sm font-medium text-gray-400">Reach</span>
                  </div>
                  <div className="text-xl font-bold text-neon-pink">{platform.reachRate}%</div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-gray-700">
        <div className="text-center">
          <div className="text-lg font-bold text-white">
            {Math.max(...platformData.map(p => p.roi)).toFixed(0)}%
          </div>
          <div className="text-xs text-gray-400">Best ROI</div>
        </div>
        
        <div className="text-center">
          <div className="text-lg font-bold text-white">
            {(platformData.reduce((sum, p) => sum + p.roi, 0) / platformData.length).toFixed(0)}%
          </div>
          <div className="text-xs text-gray-400">Average ROI</div>
        </div>
        
        <div className="text-center">
          <div className="text-lg font-bold text-white">
            ${(platformData.reduce((sum, p) => sum + p.revenue, 0) / 1000).toFixed(0)}k
          </div>
          <div className="text-xs text-gray-400">Total Revenue</div>
        </div>
      </div>
    </div>
  );
} 