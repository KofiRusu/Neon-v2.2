'use client';

import { useState } from 'react';
import { api } from '../../utils/trpc';
import {
  AcademicCapIcon,
  ChartBarIcon,
  CpuChipIcon,

  LightBulbIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';

// Import learning dashboard components
import LearningProfileCard from '../../components/LearningProfileCard';
import ToneEffectivenessChart from '../../components/ToneEffectivenessChart';
import PlatformROIMeter from '../../components/PlatformROIMeter';
import TrendImpactGraph from '../../components/TrendImpactGraph';
import CampaignPerformanceTable from '../../components/CampaignPerformanceTable';

export default function LearningDashboardPage(): JSX.Element {
  const [selectedCampaign, setSelectedCampaign] = useState<string>('all');
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('7d');

  // Mock data for development - will be replaced with real tRPC calls
  const mockCampaigns = [
    { id: 'all', name: 'All Campaigns', status: 'active' },
    { id: 'campaign-1', name: 'Q1 Product Launch', status: 'active' },
    { id: 'campaign-2', name: 'Summer Sale', status: 'learning' },
    { id: 'campaign-3', name: 'Brand Awareness', status: 'optimizing' },
  ];

  const mockLearningStats = [
    {
      title: 'AI Adaptations Made',
      value: '147',
      change: '+23%',
      changeType: 'positive' as const,
      icon: CpuChipIcon,
      color: 'neon-blue',
      description: 'Automatic adjustments this week',
    },
    {
      title: 'Performance Improvement',
      value: '34.2%',
      change: '+8.1%',
      changeType: 'positive' as const,
      icon: TrendingUpIcon,
      color: 'neon-green',
      description: 'Average campaign uplift',
    },
    {
      title: 'Learning Insights',
      value: '89',
      change: '+12',
      changeType: 'positive' as const,
      icon: LightBulbIcon,
      color: 'neon-purple',
      description: 'New patterns discovered',
    },
    {
      title: 'Response Time',
      value: '1.2s',
      change: '-0.3s',
      changeType: 'positive' as const,
      icon: ClockIcon,
      color: 'neon-pink',
      description: 'AI adaptation speed',
    },
  ];

  return (
    <div className="min-h-screen bg-space-gray">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-neon-blue to-neon-purple rounded-xl flex items-center justify-center">
                  <AcademicCapIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Learning Insights</h1>
                  <p className="text-gray-400 mt-1">AI adaptation patterns and performance optimization</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Campaign Selector */}
              <select
                value={selectedCampaign}
                onChange={(e) => setSelectedCampaign(e.target.value)}
                className="bg-gray-800 border border-gray-700 text-white px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {mockCampaigns.map((campaign) => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </option>
                ))}
              </select>

              {/* Time Range Selector */}
              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value)}
                className="bg-gray-800 border border-gray-700 text-white px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="24h">Last 24 hours</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Learning Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {mockLearningStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.title} className="glass-strong p-6 rounded-2xl hover:scale-105 transition-transform duration-200">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 bg-${stat.color} rounded-xl flex items-center justify-center`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      stat.changeType === 'positive'
                        ? 'bg-neon-green/20 text-neon-green'
                        : 'bg-neon-pink/20 text-neon-pink'
                    }`}
                  >
                    {stat.change}
                  </div>
                </div>
                <div>
                  <p className="text-gray-400 text-sm font-medium mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-white mb-2">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Main Content Tabs */}
        <div className="space-y-8">
          {/* Learning Summary Section */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center">
              <CpuChipIcon className="h-6 w-6 text-neon-blue mr-3" />
              Learning Profile Summary
            </h2>
            
            {/* Learning Profile Card */}
            <LearningProfileCard 
              profile={{
                campaignId: selectedCampaign,
                score: 87,
                toneAdjustment: 'Switch to more professional tone for LinkedIn campaigns',
                trendAdjustment: 'Focus on high-impact trending topics like AI and sustainability',
                platformStrategy: 'Prioritize LinkedIn and Instagram, reduce Facebook spend',
                effectivenessScore: 94,
                lastUpdated: new Date().toISOString(),
                adaptationsCount: 23,
                successRate: 94.2,
              }}
            />
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Tone Effectiveness Chart */}
            <ToneEffectivenessChart />

            {/* Platform ROI Meter */}
            <PlatformROIMeter />
          </div>

          {/* Additional Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Trend Impact Graph */}
            <TrendImpactGraph />

            {/* Campaign Performance Table */}
            <CampaignPerformanceTable />
          </div>

          {/* AI Suggestions Panel */}
          <div className="glass-strong p-6 rounded-2xl">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center">
              <LightBulbIcon className="h-6 w-6 text-neon-yellow mr-3" />
              AI Recommendations
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="glass p-4 rounded-xl border-l-4 border-neon-green">
                <div className="flex items-start space-x-3">
                  <CheckCircleIcon className="h-5 w-5 text-neon-green mt-1" />
                  <div>
                    <h4 className="font-semibold text-white">Switch to Casual Tone</h4>
                    <p className="text-sm text-gray-400 mt-1">
                      Your audience responds 15% better to casual messaging on weekends.
                    </p>
                  </div>
                </div>
              </div>

              <div className="glass p-4 rounded-xl border-l-4 border-neon-blue">
                <div className="flex items-start space-x-3">
                  <ClockIcon className="h-5 w-5 text-neon-blue mt-1" />
                  <div>
                    <h4 className="font-semibold text-white">Optimize Post Timing</h4>
                    <p className="text-sm text-gray-400 mt-1">
                      Post 2 hours earlier on Instagram for 22% higher engagement.
                    </p>
                  </div>
                </div>
              </div>

              <div className="glass p-4 rounded-xl border-l-4 border-neon-purple">
                <div className="flex items-start space-x-3">
                  <TrendingUpIcon className="h-5 w-5 text-neon-purple mt-1" />
                  <div>
                    <h4 className="font-semibold text-white">Leverage Trending Topics</h4>
                    <p className="text-sm text-gray-400 mt-1">
                      Include #TechTrends hashtag for 28% higher reach this week.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 