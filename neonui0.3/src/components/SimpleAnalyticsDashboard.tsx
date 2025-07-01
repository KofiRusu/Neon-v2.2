'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { 
  TrendingUpIcon, 
  UsersIcon,
  CurrencyDollarIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { trpc } from '../utils/trpc';

export function SimpleAnalyticsDashboard() {
  // Use the mock tRPC API
  const analyticsQuery = trpc.analytics.getOverview.useQuery({ period: '30d' });
  const campaignMetrics = trpc.campaign.getMetrics.useQuery();
  const agentActions = trpc.agent.getRecentActions.useQuery();

  // Access the data from the correct structure
  const analyticsData = analyticsQuery.data?.data;
  const campaignData = campaignMetrics.data?.data;
  const agentResponse = agentActions.data?.data;

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Revenue Card */}
        <Card className="glass-card border-neon-blue/20 hover-glow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-300">Revenue</p>
                <p className="text-2xl font-bold text-white">
                  +{analyticsData?.trends?.revenue || 23.1}%
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  ${analyticsData?.totalRevenue ? (analyticsData.totalRevenue / 1000).toFixed(0) + 'K' : '247K'}
                </p>
              </div>
              <CurrencyDollarIcon className="h-8 w-8 text-neon-blue" />
            </div>
          </CardContent>
        </Card>

        {/* Campaigns Card */}
        <Card className="glass-card border-neon-purple/20 hover-glow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-300">Campaigns</p>
                <p className="text-2xl font-bold text-white">
                  +{analyticsData?.trends?.campaigns || 12.5}%
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {analyticsData?.totalCampaigns || campaignData?.active || 18}
                </p>
              </div>
              <ChartBarIcon className="h-8 w-8 text-neon-purple" />
            </div>
          </CardContent>
        </Card>

        {/* Conversion Rate Card */}
        <Card className="glass-card border-neon-green/20 hover-glow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-300">Conversion</p>
                <p className="text-2xl font-bold text-white">
                  {analyticsData?.conversionRate || 24.8}%
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  +{analyticsData?.trends?.efficiency || 12}%
                </p>
                <p className="text-xs text-gray-400">
                  {analyticsData?.activeAgents || agentResponse?.length || 12}
                </p>
              </div>
              <TrendingUpIcon className="h-8 w-8 text-neon-green" />
            </div>
          </CardContent>
        </Card>

        {/* Active Agents Card */}
        <Card className="glass-card border-neon-cyan/20 hover-glow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-300">Active Agents</p>
                <div className="text-2xl font-bold text-white">
                  {agentResponse && agentResponse.length > 0 ?
                    agentResponse.map((agent: any, index: number) => (
                      <div key={index} className="text-xs text-gray-400 truncate">
                        {agent.agent}
                      </div>
                    )).slice(0, 2) :
                    <div className="text-xs text-gray-400">12 Active</div>
                  }
                </div>
              </div>
              <UsersIcon className="h-8 w-8 text-neon-cyan" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <Card className="glass-card border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Performance Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-lg bg-black/20">
              <div className="text-2xl font-bold text-neon-blue">
                ${(analyticsData?.totalRevenue || 247000) / 1000}K
              </div>
              <div className="text-sm text-gray-300">Total Revenue</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-black/20">
              <div className="text-2xl font-bold text-neon-purple">
                {analyticsData?.totalCampaigns || campaignData?.total || 18}
              </div>
              <div className="text-sm text-gray-300">Total Campaigns</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-black/20">
              <div className="text-2xl font-bold text-neon-green">
                {analyticsData?.conversionRate || 24.8}%
              </div>
              <div className="text-sm text-gray-300">Conversion Rate</div>
            </div>
          </div>
          
          <div className="mt-4 text-sm text-gray-400 text-center">
            Total Campaigns: {analyticsData?.totalCampaigns || campaignData?.active || '18'} |
            Active Agents: {analyticsData?.activeAgents || agentResponse?.length || '12'}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 