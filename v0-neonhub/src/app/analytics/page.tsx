'use client';

import { useState, useEffect } from 'react';
import { api } from '../../utils/trpc';
import {
  ChartBarIcon,
  CpuChipIcon,
  RocketLaunchIcon,
  TrendingUpIcon,
  EyeIcon,
  CalendarIcon,
  FunnelIcon,
  UserGroupIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

interface TimeRange {
  label: string;
  value: string;
  days: number;
}

interface MetricCard {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: React.ComponentType<any>;
  color: string;
}

export default function AnalyticsPage(): JSX.Element {
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('7d');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Mock data for development
  const timeRanges: TimeRange[] = [
    { label: 'Last 7 days', value: '7d', days: 7 },
    { label: 'Last 30 days', value: '30d', days: 30 },
    { label: 'Last 90 days', value: '90d', days: 90 },
    { label: 'Last year', value: '1y', days: 365 },
  ];

  const metrics: MetricCard[] = [
    {
      title: 'Total Campaigns',
      value: '24',
      change: '+12%',
      changeType: 'positive',
      icon: RocketLaunchIcon,
      color: 'neon-blue',
    },
    {
      title: 'Active AI Agents',
      value: '9',
      change: '+2',
      changeType: 'positive',
      icon: CpuChipIcon,
      color: 'neon-purple',
    },
    {
      title: 'Conversion Rate',
      value: '28.4%',
      change: '+4.2%',
      changeType: 'positive',
      icon: TrendingUpIcon,
      color: 'neon-green',
    },
    {
      title: 'Revenue Generated',
      value: '$156K',
      change: '+23.1%',
      changeType: 'positive',
      icon: ArrowTrendingUpIcon,
      color: 'neon-pink',
    },
  ];

  console.log('Analytics page rendered at:', currentTime);

  return (
    <div className="min-h-screen bg-space-gray">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-3xl font-bold text-white">Analytics Dashboard</h1>
              <p className="text-gray-400 mt-1">Real-time insights and performance metrics</p>
            </div>
            <div className="flex items-center space-x-3">
              <select
                value={selectedTimeRange}
                onChange={e => setSelectedTimeRange(e.target.value)}
                className="bg-gray-800 border border-gray-700 text-white px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {timeRanges.map(range => (
                  <option key={range.value} value={range.value}>
                    {range.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {metrics.map(metric => {
            const Icon = metric.icon;
            return (
              <div key={metric.title} className="stat-card">
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-12 h-12 bg-${metric.color} rounded-xl flex items-center justify-center`}
                  >
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      metric.changeType === 'positive'
                        ? 'bg-green-500 text-white'
                        : metric.changeType === 'negative'
                          ? 'bg-red-500 text-white'
                          : 'bg-gray-500 text-white'
                    }`}
                  >
                    {metric.change}
                  </div>
                </div>
                <div>
                  <p className="text-gray-400 text-sm font-medium mb-1">{metric.title}</p>
                  <p className="text-3xl font-bold text-white">{metric.value}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="glass-strong p-6 rounded-2xl">
            <h3 className="text-xl font-bold text-white mb-6">Campaign Performance</h3>
            <div className="h-64 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <ChartBarIcon className="h-16 w-16 mx-auto mb-4 text-gray-600" />
                <p>Performance chart will be displayed here</p>
              </div>
            </div>
          </div>

          <div className="glass-strong p-6 rounded-2xl">
            <h3 className="text-xl font-bold text-white mb-6">Agent Activity</h3>
            <div className="h-64 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <CpuChipIcon className="h-16 w-16 mx-auto mb-4 text-gray-600" />
                <p>Agent activity chart will be displayed here</p>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 glass-strong p-6 rounded-2xl">
            <h3 className="text-xl font-bold text-white mb-6">Revenue Analytics</h3>
            <div className="h-80 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <TrendingUpIcon className="h-16 w-16 mx-auto mb-4 text-gray-600" />
                <p>Revenue analytics will be displayed here</p>
              </div>
            </div>
          </div>

          <div className="glass-strong p-6 rounded-2xl">
            <h3 className="text-xl font-bold text-white mb-6">Top Performing</h3>
            <div className="space-y-4">
              {[
                { name: 'ContentAgent', performance: '96%', color: 'text-blue-400' },
                { name: 'EmailAgent', performance: '94%', color: 'text-purple-400' },
                { name: 'SocialAgent', performance: '92%', color: 'text-green-400' },
                { name: 'SEOAgent', performance: '89%', color: 'text-pink-400' },
              ].map(agent => (
                <div
                  key={agent.name}
                  className="flex items-center justify-between p-3 glass rounded-lg"
                >
                  <span className={`font-medium ${agent.color}`}>{agent.name}</span>
                  <span className="text-white font-bold">{agent.performance}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
