'use client';

import { useState } from 'react';
import {
  CalendarIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CpuChipIcon,
  SparklesIcon,
  EyeIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';

interface CampaignPerformance {
  campaignId: string;
  name: string;
  status: 'active' | 'completed' | 'paused' | 'draft';
  startDate: string;
  endDate?: string;
  learningScore: number;
  adaptationsCount: number;
  engagementRate: number;
  conversionRate: number;
  reachRate: number;
  revenue: number;
  spend: number;
  roi: number;
  impressions: number;
  clicks: number;
  leads: number;
  aiAdjustments: {
    toneChanged: boolean;
    timingOptimized: boolean;
    platformFocus: boolean;
    trendAdoption: boolean;
  };
  lastLearningUpdate: string;
  platforms: string[];
  category: string;
}

interface CampaignPerformanceTableProps {
  data?: CampaignPerformance[];
  className?: string;
  onRowClick?: (campaign: CampaignPerformance) => void;
}

export default function CampaignPerformanceTable({
  data,
  className = '',
  onRowClick,
}: CampaignPerformanceTableProps): JSX.Element {
  const [sortField, setSortField] = useState<string>('learningScore');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);

  // Mock data if none provided
  const defaultData: CampaignPerformance[] = [
    {
      campaignId: 'camp-001',
      name: 'Q1 Product Launch',
      status: 'active',
      startDate: '2024-01-15',
      endDate: '2024-03-15',
      learningScore: 94,
      adaptationsCount: 23,
      engagementRate: 8.7,
      conversionRate: 4.2,
      reachRate: 89,
      revenue: 45800,
      spend: 12400,
      roi: 269,
      impressions: 245000,
      clicks: 21315,
      leads: 895,
      aiAdjustments: {
        toneChanged: true,
        timingOptimized: true,
        platformFocus: true,
        trendAdoption: true,
      },
      lastLearningUpdate: '2024-01-22',
      platforms: ['Instagram', 'LinkedIn', 'Facebook'],
      category: 'Product',
    },
    {
      campaignId: 'camp-002',
      name: 'Summer Sale Campaign',
      status: 'completed',
      startDate: '2024-01-10',
      endDate: '2024-01-20',
      learningScore: 87,
      adaptationsCount: 18,
      engagementRate: 6.9,
      conversionRate: 3.8,
      reachRate: 92,
      revenue: 38200,
      spend: 15600,
      roi: 145,
      impressions: 198000,
      clicks: 13662,
      leads: 518,
      aiAdjustments: {
        toneChanged: true,
        timingOptimized: false,
        platformFocus: true,
        trendAdoption: true,
      },
      lastLearningUpdate: '2024-01-18',
      platforms: ['Instagram', 'TikTok', 'Twitter'],
      category: 'Sales',
    },
    {
      campaignId: 'camp-003',
      name: 'Brand Awareness Drive',
      status: 'active',
      startDate: '2024-01-12',
      engagementRate: 5.4,
      conversionRate: 2.1,
      reachRate: 96,
      revenue: 12400,
      spend: 8900,
      roi: 39,
      learningScore: 76,
      adaptationsCount: 12,
      impressions: 412000,
      clicks: 22248,
      leads: 467,
      aiAdjustments: {
        toneChanged: false,
        timingOptimized: true,
        platformFocus: false,
        trendAdoption: false,
      },
      lastLearningUpdate: '2024-01-20',
      platforms: ['Facebook', 'LinkedIn', 'YouTube'],
      category: 'Brand',
    },
    {
      campaignId: 'camp-004',
      name: 'Holiday Special',
      status: 'paused',
      startDate: '2024-01-08',
      endDate: '2024-02-08',
      learningScore: 82,
      adaptationsCount: 15,
      engagementRate: 7.2,
      conversionRate: 3.5,
      reachRate: 78,
      revenue: 28900,
      spend: 11200,
      roi: 158,
      impressions: 156000,
      clicks: 11232,
      leads: 392,
      aiAdjustments: {
        toneChanged: true,
        timingOptimized: true,
        platformFocus: false,
        trendAdoption: true,
      },
      lastLearningUpdate: '2024-01-16',
      platforms: ['Instagram', 'Facebook'],
      category: 'Seasonal',
    },
    {
      campaignId: 'camp-005',
      name: 'Tech Innovation Showcase',
      status: 'active',
      startDate: '2024-01-14',
      learningScore: 91,
      adaptationsCount: 27,
      engagementRate: 9.1,
      conversionRate: 5.2,
      reachRate: 85,
      revenue: 52300,
      spend: 18900,
      roi: 177,
      impressions: 187000,
      clicks: 17017,
      leads: 885,
      aiAdjustments: {
        toneChanged: true,
        timingOptimized: true,
        platformFocus: true,
        trendAdoption: true,
      },
      lastLearningUpdate: '2024-01-21',
      platforms: ['LinkedIn', 'Twitter', 'YouTube'],
      category: 'Technology',
    },
  ];

  const campaignData = data || defaultData;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-neon-green';
      case 'completed': return 'text-neon-blue';
      case 'paused': return 'text-neon-yellow';
      case 'draft': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusBackground = (status: string) => {
    switch (status) {
      case 'active': return 'bg-neon-green/20';
      case 'completed': return 'bg-neon-blue/20';
      case 'paused': return 'bg-neon-yellow/20';
      case 'draft': return 'bg-gray-600/20';
      default: return 'bg-gray-600/20';
    }
  };

  const getLearningScoreColor = (score: number) => {
    if (score >= 90) return 'text-neon-green';
    if (score >= 80) return 'text-neon-blue';
    if (score >= 70) return 'text-neon-purple';
    return 'text-neon-pink';
  };

  const getROIColor = (roi: number) => {
    if (roi >= 200) return 'text-neon-green';
    if (roi >= 100) return 'text-neon-blue';
    if (roi >= 50) return 'text-neon-purple';
    return 'text-neon-pink';
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? 
      <ChevronUpIcon className="h-4 w-4" /> : 
      <ChevronDownIcon className="h-4 w-4" />;
  };

  const filteredData = campaignData.filter(campaign => 
    filterStatus === 'all' || campaign.status === filterStatus
  );

  const sortedData = [...filteredData].sort((a, b) => {
    const aValue = a[sortField as keyof CampaignPerformance] as number;
    const bValue = b[sortField as keyof CampaignPerformance] as number;
    return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
  });

  const countAdjustments = (adjustments: CampaignPerformance['aiAdjustments']) => {
    return Object.values(adjustments).filter(Boolean).length;
  };

  return (
    <div className={`glass-strong p-6 rounded-2xl ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-neon-blue rounded-xl flex items-center justify-center">
            <CalendarIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Campaign Performance</h3>
            <p className="text-sm text-gray-400">Learning insights and performance metrics</p>
          </div>
        </div>

        {/* Filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-gray-800 border border-gray-700 text-white px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Campaigns</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="paused">Paused</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left py-3 px-4 font-semibold text-gray-300">Campaign</th>
              <th 
                className="text-left py-3 px-4 font-semibold text-gray-300 cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('learningScore')}
              >
                <div className="flex items-center space-x-1">
                  <span>Learning Score</span>
                  {getSortIcon('learningScore')}
                </div>
              </th>
              <th 
                className="text-left py-3 px-4 font-semibold text-gray-300 cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('roi')}
              >
                <div className="flex items-center space-x-1">
                  <span>ROI</span>
                  {getSortIcon('roi')}
                </div>
              </th>
              <th 
                className="text-left py-3 px-4 font-semibold text-gray-300 cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('engagementRate')}
              >
                <div className="flex items-center space-x-1">
                  <span>Engagement</span>
                  {getSortIcon('engagementRate')}
                </div>
              </th>
              <th 
                className="text-left py-3 px-4 font-semibold text-gray-300 cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('adaptationsCount')}
              >
                <div className="flex items-center space-x-1">
                  <span>AI Adaptations</span>
                  {getSortIcon('adaptationsCount')}
                </div>
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-300">Platforms</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-300">Status</th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((campaign) => {
              const isSelected = selectedCampaign === campaign.campaignId;
              const adjustmentCount = countAdjustments(campaign.aiAdjustments);
              
              return (
                <tr 
                  key={campaign.campaignId}
                  className={`border-b border-gray-800 hover:bg-gray-800/50 cursor-pointer transition-colors ${
                    isSelected ? 'bg-gray-800/70' : ''
                  }`}
                  onClick={() => {
                    setSelectedCampaign(isSelected ? null : campaign.campaignId);
                    onRowClick?.(campaign);
                  }}
                >
                  <td className="py-4 px-4">
                    <div>
                      <div className="font-semibold text-white">{campaign.name}</div>
                      <div className="text-sm text-gray-400">{campaign.category}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Started: {new Date(campaign.startDate).toLocaleDateString()}
                      </div>
                    </div>
                  </td>
                  
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      <div className={`text-lg font-bold ${getLearningScoreColor(campaign.learningScore)}`}>
                        {campaign.learningScore}
                      </div>
                      <div className="text-xs text-gray-400">/100</div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Updated: {new Date(campaign.lastLearningUpdate).toLocaleDateString()}
                    </div>
                  </td>
                  
                  <td className="py-4 px-4">
                    <div className={`text-lg font-bold ${getROIColor(campaign.roi)}`}>
                      {campaign.roi}%
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      ${(campaign.revenue/1000).toFixed(1)}k revenue
                    </div>
                  </td>
                  
                  <td className="py-4 px-4">
                    <div className="text-white font-semibold">{campaign.engagementRate}%</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {campaign.conversionRate}% conversion
                    </div>
                  </td>
                  
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      <CpuChipIcon className="h-4 w-4 text-neon-blue" />
                      <span className="font-semibold text-white">{campaign.adaptationsCount}</span>
                    </div>
                    <div className="flex items-center space-x-1 mt-1">
                      {campaign.aiAdjustments.toneChanged && (
                        <SparklesIcon className="h-3 w-3 text-neon-green" title="Tone adjusted" />
                      )}
                      {campaign.aiAdjustments.timingOptimized && (
                        <CheckCircleIcon className="h-3 w-3 text-neon-blue" title="Timing optimized" />
                      )}
                      {campaign.aiAdjustments.platformFocus && (
                        <EyeIcon className="h-3 w-3 text-neon-purple" title="Platform focus adjusted" />
                      )}
                      {campaign.aiAdjustments.trendAdoption && (
                        <ArrowTrendingUpIcon className="h-3 w-3 text-neon-pink" title="Trends adopted" />
                      )}
                    </div>
                  </td>
                  
                  <td className="py-4 px-4">
                    <div className="flex flex-wrap gap-1">
                      {campaign.platforms.slice(0, 2).map((platform) => (
                        <span
                          key={platform}
                          className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded-full"
                        >
                          {platform}
                        </span>
                      ))}
                      {campaign.platforms.length > 2 && (
                        <span className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded-full">
                          +{campaign.platforms.length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                  
                  <td className="py-4 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBackground(campaign.status)} ${getStatusColor(campaign.status)}`}>
                      {campaign.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Expanded Campaign Details */}
      {selectedCampaign && (
        <div className="mt-6 glass p-4 rounded-xl">
          {(() => {
            const campaign = campaignData.find(c => c.campaignId === selectedCampaign);
            if (!campaign) return null;

            return (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold text-white">{campaign.name} - Detailed Metrics</h4>
                  <button
                    onClick={() => setSelectedCampaign(null)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <EyeIcon className="h-5 w-5 text-neon-blue mr-1" />
                      <span className="text-sm font-medium text-gray-400">Impressions</span>
                    </div>
                    <div className="text-xl font-bold text-white">
                      {(campaign.impressions / 1000).toFixed(0)}k
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <UserGroupIcon className="h-5 w-5 text-neon-green mr-1" />
                      <span className="text-sm font-medium text-gray-400">Clicks</span>
                    </div>
                    <div className="text-xl font-bold text-white">
                      {(campaign.clicks / 1000).toFixed(1)}k
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <CheckCircleIcon className="h-5 w-5 text-neon-purple mr-1" />
                      <span className="text-sm font-medium text-gray-400">Leads</span>
                    </div>
                    <div className="text-xl font-bold text-white">{campaign.leads}</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <CurrencyDollarIcon className="h-5 w-5 text-neon-pink mr-1" />
                      <span className="text-sm font-medium text-gray-400">Spend</span>
                    </div>
                    <div className="text-xl font-bold text-white">
                      ${(campaign.spend / 1000).toFixed(1)}k
                    </div>
                  </div>
                </div>

                <div>
                  <h5 className="font-semibold text-white mb-2">AI Adjustments Made:</h5>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className={`flex items-center space-x-2 ${campaign.aiAdjustments.toneChanged ? 'text-neon-green' : 'text-gray-500'}`}>
                      <SparklesIcon className="h-4 w-4" />
                      <span>Tone Optimization</span>
                      {campaign.aiAdjustments.toneChanged && <CheckCircleIcon className="h-4 w-4" />}
                    </div>
                    <div className={`flex items-center space-x-2 ${campaign.aiAdjustments.timingOptimized ? 'text-neon-blue' : 'text-gray-500'}`}>
                      <CalendarIcon className="h-4 w-4" />
                      <span>Timing Optimization</span>
                      {campaign.aiAdjustments.timingOptimized && <CheckCircleIcon className="h-4 w-4" />}
                    </div>
                    <div className={`flex items-center space-x-2 ${campaign.aiAdjustments.platformFocus ? 'text-neon-purple' : 'text-gray-500'}`}>
                      <EyeIcon className="h-4 w-4" />
                      <span>Platform Focus</span>
                      {campaign.aiAdjustments.platformFocus && <CheckCircleIcon className="h-4 w-4" />}
                    </div>
                    <div className={`flex items-center space-x-2 ${campaign.aiAdjustments.trendAdoption ? 'text-neon-pink' : 'text-gray-500'}`}>
                      <ArrowTrendingUpIcon className="h-4 w-4" />
                      <span>Trend Adoption</span>
                      {campaign.aiAdjustments.trendAdoption && <CheckCircleIcon className="h-4 w-4" />}
                    </div>
                  </div>
                </div>

                <div>
                  <h5 className="font-semibold text-white mb-2">All Platforms:</h5>
                  <div className="flex flex-wrap gap-2">
                    {campaign.platforms.map((platform) => (
                      <span
                        key={platform}
                        className="px-3 py-1 bg-gray-700 text-gray-300 text-sm rounded-full"
                      >
                        {platform}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-4 border-t border-gray-700">
        <div className="text-center">
          <div className="text-lg font-bold text-white">
            {Math.round(sortedData.reduce((sum, c) => sum + c.learningScore, 0) / sortedData.length)}
          </div>
          <div className="text-xs text-gray-400">Avg Learning Score</div>
        </div>
        
        <div className="text-center">
          <div className="text-lg font-bold text-white">
            {sortedData.reduce((sum, c) => sum + c.adaptationsCount, 0)}
          </div>
          <div className="text-xs text-gray-400">Total Adaptations</div>
        </div>
        
        <div className="text-center">
          <div className="text-lg font-bold text-white">
            {Math.round(sortedData.reduce((sum, c) => sum + c.roi, 0) / sortedData.length)}%
          </div>
          <div className="text-xs text-gray-400">Avg ROI</div>
        </div>
        
        <div className="text-center">
          <div className="text-lg font-bold text-white">
            ${Math.round(sortedData.reduce((sum, c) => sum + c.revenue, 0) / 1000)}k
          </div>
          <div className="text-xs text-gray-400">Total Revenue</div>
        </div>
      </div>
    </div>
  );
} 