'use client';

import { useState } from 'react';
import {
  ArrowTrendingUpIcon,
  FireIcon,
  HashtagIcon,

  SparklesIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

interface TrendImpact {
  trendName: string;
  hashtag: string;
  impactScore: number;
  engagementIncrease: number;
  reachIncrease: number;
  conversionIncrease: number;
  campaignCount: number;
  firstSeen: string;
  peakDate: string;
  currentStatus: 'rising' | 'peak' | 'declining' | 'stable';
  category: string;
  relatedKeywords: string[];
}

interface TrendImpactGraphProps {
  data?: TrendImpact[];
  selectedTimeRange?: string;
  className?: string;
  showDetails?: boolean;
}

export default function TrendImpactGraph({
  data,
  selectedTimeRange = '7d',
  className = '',
  showDetails = true,
}: TrendImpactGraphProps): JSX.Element {
  const [selectedTrend, setSelectedTrend] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>('impactScore');

  // Mock data if none provided
  const defaultData: TrendImpact[] = [
    {
      trendName: 'AI Revolution',
      hashtag: '#AIRevolution',
      impactScore: 94,
      engagementIncrease: 45.7,
      reachIncrease: 38.2,
      conversionIncrease: 28.9,
      campaignCount: 8,
      firstSeen: '2024-01-15',
      peakDate: '2024-01-20',
      currentStatus: 'peak',
      category: 'Technology',
      relatedKeywords: ['artificial intelligence', 'machine learning', 'automation'],
    },
    {
      trendName: 'Sustainable Living',
      hashtag: '#SustainableLiving',
      impactScore: 87,
      engagementIncrease: 32.1,
      reachIncrease: 41.8,
      conversionIncrease: 22.4,
      campaignCount: 12,
      firstSeen: '2024-01-10',
      peakDate: '2024-01-18',
      currentStatus: 'stable',
      category: 'Lifestyle',
      relatedKeywords: ['eco-friendly', 'green living', 'sustainability'],
    },
    {
      trendName: 'Remote Work Tips',
      hashtag: '#RemoteWork',
      impactScore: 76,
      engagementIncrease: 28.3,
      reachIncrease: 25.7,
      conversionIncrease: 18.9,
      campaignCount: 15,
      firstSeen: '2024-01-12',
      peakDate: '2024-01-17',
      currentStatus: 'declining',
      category: 'Business',
      relatedKeywords: ['work from home', 'productivity', 'digital nomad'],
    },
    {
      trendName: 'Mental Health Awareness',
      hashtag: '#MentalHealth',
      impactScore: 92,
      engagementIncrease: 52.8,
      reachIncrease: 47.3,
      conversionIncrease: 31.2,
      campaignCount: 9,
      firstSeen: '2024-01-08',
      peakDate: '2024-01-16',
      currentStatus: 'rising',
      category: 'Health',
      relatedKeywords: ['wellness', 'mindfulness', 'self-care'],
    },
    {
      trendName: 'Tech Innovation',
      hashtag: '#TechInnovation',
      impactScore: 68,
      engagementIncrease: 19.4,
      reachIncrease: 22.1,
      conversionIncrease: 15.3,
      campaignCount: 6,
      firstSeen: '2024-01-14',
      peakDate: '2024-01-19',
      currentStatus: 'rising',
      category: 'Technology',
      relatedKeywords: ['innovation', 'startup', 'tech trends'],
    },
  ];

  const trendData = data || defaultData;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'rising': return 'text-neon-green';
      case 'peak': return 'text-neon-blue';
      case 'stable': return 'text-neon-purple';
      case 'declining': return 'text-neon-pink';
      default: return 'text-gray-400';
    }
  };

  const getStatusBackground = (status: string) => {
    switch (status) {
      case 'rising': return 'bg-neon-green/20';
      case 'peak': return 'bg-neon-blue/20';
      case 'stable': return 'bg-neon-purple/20';
      case 'declining': return 'bg-neon-pink/20';
      default: return 'bg-gray-600/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'rising': return ArrowTrendingUpIcon;
      case 'peak': return FireIcon;
      case 'stable': return CheckCircleIcon;
      case 'declining': return ArrowTrendingDownIcon;
      default: return ArrowTrendingUpIcon;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'technology': return 'text-neon-blue';
      case 'lifestyle': return 'text-neon-green';
      case 'business': return 'text-neon-purple';
      case 'health': return 'text-neon-pink';
      default: return 'text-gray-400';
    }
  };

  const sortedData = [...trendData].sort((a, b) => {
    const aValue = a[sortBy as keyof TrendImpact] as number;
    const bValue = b[sortBy as keyof TrendImpact] as number;
    return bValue - aValue;
  });

  const maxImpact = Math.max(...trendData.map(t => t.impactScore));

  return (
    <div className={`glass-strong p-6 rounded-2xl ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-neon-pink rounded-xl flex items-center justify-center">
            <ArrowTrendingUpIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Trend Impact Analysis</h3>
            <p className="text-sm text-gray-400">How trends influenced campaign performance</p>
          </div>
        </div>

        {/* Sort Selector */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="bg-gray-800 border border-gray-700 text-white px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-pink-500"
        >
          <option value="impactScore">Impact Score</option>
          <option value="engagementIncrease">Engagement Increase</option>
          <option value="reachIncrease">Reach Increase</option>
          <option value="conversionIncrease">Conversion Increase</option>
          <option value="campaignCount">Campaign Count</option>
        </select>
      </div>

      {/* Trend Impact Chart */}
      <div className="mb-6">
        <div className="space-y-3">
          {sortedData.map((trend, index) => {
            const percentage = (trend.impactScore / maxImpact) * 100;
            const isSelected = selectedTrend === trend.trendName;
            const StatusIcon = getStatusIcon(trend.currentStatus);

            return (
              <div
                key={trend.trendName}
                className={`glass p-4 rounded-xl cursor-pointer transition-all duration-300 ${
                  isSelected ? 'ring-2 ring-neon-blue scale-105' : 'hover:scale-102'
                }`}
                onClick={() => setSelectedTrend(isSelected ? null : trend.trendName)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getStatusBackground(trend.currentStatus)}`}>
                      <StatusIcon className={`h-4 w-4 ${getStatusColor(trend.currentStatus)}`} />
                    </div>
                    <div>
                      <div className="font-semibold text-white">{trend.trendName}</div>
                      <div className="flex items-center space-x-2 text-sm">
                        <span className="text-gray-400">{trend.hashtag}</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusBackground(trend.currentStatus)} ${getStatusColor(trend.currentStatus)}`}>
                          {trend.currentStatus}
                        </span>
                        <span className={`text-xs ${getCategoryColor(trend.category)}`}>
                          {trend.category}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-lg font-bold text-white">{trend.impactScore}</div>
                    <div className="text-xs text-gray-400">Impact Score</div>
                  </div>
                </div>

                {/* Impact Bar */}
                <div className="w-full bg-gray-700 rounded-full h-2 mb-3">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      trend.currentStatus === 'peak' ? 'bg-gradient-to-r from-neon-blue to-neon-purple' :
                      trend.currentStatus === 'rising' ? 'bg-gradient-to-r from-neon-green to-neon-blue' :
                      trend.currentStatus === 'stable' ? 'bg-gradient-to-r from-neon-purple to-neon-pink' :
                      'bg-gradient-to-r from-neon-pink to-gray-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-semibold text-neon-green">+{trend.engagementIncrease}%</div>
                    <div className="text-xs text-gray-400">Engagement</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-neon-blue">+{trend.reachIncrease}%</div>
                    <div className="text-xs text-gray-400">Reach</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-neon-purple">+{trend.conversionIncrease}%</div>
                    <div className="text-xs text-gray-400">Conversion</div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isSelected && showDetails && (
                  <div className="mt-4 pt-4 border-t border-gray-700 space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-gray-400">First Seen:</div>
                        <div className="text-white">{new Date(trend.firstSeen).toLocaleDateString()}</div>
                      </div>
                      <div>
                        <div className="text-gray-400">Peak Date:</div>
                        <div className="text-white">{new Date(trend.peakDate).toLocaleDateString()}</div>
                      </div>
                      <div>
                        <div className="text-gray-400">Campaigns:</div>
                        <div className="text-white">{trend.campaignCount}</div>
                      </div>
                      <div>
                        <div className="text-gray-400">Category:</div>
                        <div className={`${getCategoryColor(trend.category)}`}>{trend.category}</div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-gray-400 text-sm mb-2">Related Keywords:</div>
                      <div className="flex flex-wrap gap-2">
                        {trend.relatedKeywords.map((keyword) => (
                          <span
                            key={keyword}
                            className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded-full"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Performance Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="glass p-4 rounded-xl text-center">
          <div className="flex items-center justify-center mb-2">
            <ArrowTrendingUpIcon className="h-5 w-5 text-neon-green mr-1" />
            <span className="text-sm font-medium text-gray-400">Rising Trends</span>
          </div>
          <div className="text-xl font-bold text-neon-green">
            {trendData.filter(t => t.currentStatus === 'rising').length}
          </div>
        </div>
        
        <div className="glass p-4 rounded-xl text-center">
          <div className="flex items-center justify-center mb-2">
            <FireIcon className="h-5 w-5 text-neon-blue mr-1" />
            <span className="text-sm font-medium text-gray-400">Peak Trends</span>
          </div>
          <div className="text-xl font-bold text-neon-blue">
            {trendData.filter(t => t.currentStatus === 'peak').length}
          </div>
        </div>
        
        <div className="glass p-4 rounded-xl text-center">
          <div className="flex items-center justify-center mb-2">
            <CheckCircleIcon className="h-5 w-5 text-neon-purple mr-1" />
            <span className="text-sm font-medium text-gray-400">Stable Trends</span>
          </div>
          <div className="text-xl font-bold text-neon-purple">
            {trendData.filter(t => t.currentStatus === 'stable').length}
          </div>
        </div>
        
        <div className="glass p-4 rounded-xl text-center">
          <div className="flex items-center justify-center mb-2">
            <HashtagIcon className="h-5 w-5 text-neon-pink mr-1" />
            <span className="text-sm font-medium text-gray-400">Total Trends</span>
          </div>
          <div className="text-xl font-bold text-neon-pink">
            {trendData.length}
          </div>
        </div>
      </div>

      {/* Top Performing Trends */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-white">Top Performing Trends</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedData.slice(0, 4).map((trend, index) => {
            const StatusIcon = getStatusIcon(trend.currentStatus);
            return (
              <div key={trend.trendName} className="glass p-3 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <StatusIcon className={`h-4 w-4 ${getStatusColor(trend.currentStatus)}`} />
                    <span className="font-medium text-white">{trend.trendName}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-white">{trend.impactScore}</div>
                    <div className="text-xs text-gray-400">Score</div>
                  </div>
                </div>
                <div className="text-xs text-gray-400 mb-1">{trend.hashtag}</div>
                <div className="text-xs text-gray-500">
                  {trend.campaignCount} campaigns • {trend.category}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-gray-700">
        <div className="text-center">
          <div className="text-lg font-bold text-white">
            {Math.max(...trendData.map(t => t.impactScore))}
          </div>
          <div className="text-xs text-gray-400">Highest Impact</div>
        </div>
        
        <div className="text-center">
          <div className="text-lg font-bold text-white">
            {(trendData.reduce((sum, t) => sum + t.engagementIncrease, 0) / trendData.length).toFixed(1)}%
          </div>
          <div className="text-xs text-gray-400">Avg Engagement</div>
        </div>
        
        <div className="text-center">
          <div className="text-lg font-bold text-white">
            {trendData.reduce((sum, t) => sum + t.campaignCount, 0)}
          </div>
          <div className="text-xs text-gray-400">Total Campaigns</div>
        </div>
      </div>
    </div>
  );
} 