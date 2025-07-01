'use client';

/**
 * Campaign Memory Dashboard - Historical Performance & Agent Learnings
 */

import React, { useState } from 'react';
import { trpc } from '../utils/trpc';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import {
  Brain,
  TrendingUp,
  Target,
  Lightbulb,
  BarChart3,
  Calendar,
  Users,
  Mail,
  MessageSquare,
  DollarSign,
  ArrowUp,
  Sparkles,
} from 'lucide-react';

interface CampaignMemoryDashboardProps {
  className?: string;
}

export function CampaignMemoryDashboard({ className }: CampaignMemoryDashboardProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'7d' | '30d' | 'all'>('30d');

  // Mock historical data
  const historicalCampaigns = [
    {
      id: 'camp_001',
      goal: 'lead_generation',
      completedAt: '2024-01-15',
      performance: { roi: 3.2, conversionRate: 0.045, openRate: 0.28, clickRate: 0.06 },
      learnings: [
        'Personalized subject lines increased opens by 40%',
        'Tuesday 10 AM sends performed best',
      ],
    },
    {
      id: 'camp_002',
      goal: 'brand_awareness',
      completedAt: '2024-01-10',
      performance: { roi: 2.1, conversionRate: 0.025, openRate: 0.32, clickRate: 0.08 },
      learnings: [
        'Visual content drove 3x higher engagement',
        'LinkedIn performed better than email',
      ],
    },
    {
      id: 'camp_003',
      goal: 'customer_retention',
      completedAt: '2024-01-05',
      performance: { roi: 4.5, conversionRate: 0.12, openRate: 0.45, clickRate: 0.15 },
      learnings: [
        'Exclusive offers reduced churn by 25%',
        'Personal tone resonated with existing customers',
      ],
    },
  ];

  const agentLearnings = [
    {
      agentId: 'content-agent',
      insights: [
        'Subject lines with urgency increase open rates by 23%',
        'Personalization tokens boost click rates by 35%',
        'Questions in headlines drive 18% more engagement',
      ],
      confidence: 0.92,
      dataPoints: 847,
    },
    {
      agentId: 'insight-agent',
      insights: [
        'Enterprise audience prefers weekday sends',
        'Mobile optimization increases conversions by 40%',
        'Social proof elements improve trust metrics',
      ],
      confidence: 0.88,
      dataPoints: 623,
    },
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold gradient-text">Campaign Memory Dashboard</h2>
          <p className="text-gray-400">Historical insights and AI-powered learnings</p>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={() => setSelectedTimeframe('7d')}
            variant={selectedTimeframe === '7d' ? 'default' : 'outline'}
            size="sm"
          >
            7 Days
          </Button>
          <Button
            onClick={() => setSelectedTimeframe('30d')}
            variant={selectedTimeframe === '30d' ? 'default' : 'outline'}
            size="sm"
          >
            30 Days
          </Button>
          <Button
            onClick={() => setSelectedTimeframe('all')}
            variant={selectedTimeframe === 'all' ? 'default' : 'outline'}
            size="sm"
          >
            All Time
          </Button>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Avg ROI</p>
                <p className="text-2xl font-bold text-green-400">3.3x</p>
                <div className="flex items-center gap-1 text-sm text-green-400">
                  <ArrowUp className="w-4 h-4" />
                  12.5%
                </div>
              </div>
              <div className="p-3 bg-green-500/20 rounded-full">
                <DollarSign className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Campaigns</p>
                <p className="text-2xl font-bold text-blue-400">{historicalCampaigns.length}</p>
                <p className="text-sm text-gray-400">This month</p>
              </div>
              <div className="p-3 bg-blue-500/20 rounded-full">
                <BarChart3 className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Best Goal</p>
                <p className="text-lg font-bold text-purple-400">Retention</p>
                <p className="text-sm text-gray-400">4.5x ROI</p>
              </div>
              <div className="p-3 bg-purple-500/20 rounded-full">
                <Target className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Agent Insights</p>
                <p className="text-2xl font-bold text-orange-400">15</p>
                <p className="text-sm text-gray-400">New learnings</p>
              </div>
              <div className="p-3 bg-orange-500/20 rounded-full">
                <Brain className="w-6 h-6 text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="history" className="w-full">
        <TabsList className="grid w-full grid-cols-3 glass-card">
          <TabsTrigger value="history">Campaign History</TabsTrigger>
          <TabsTrigger value="learnings">Agent Learnings</TabsTrigger>
          <TabsTrigger value="insights">Key Insights</TabsTrigger>
        </TabsList>

        {/* Campaign History */}
        <TabsContent value="history" className="space-y-4">
          {historicalCampaigns.map(campaign => (
            <Card key={campaign.id} className="glass-card">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Campaign {campaign.id.slice(-3)}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Badge className="bg-blue-500/20 text-blue-400">
                        {campaign.goal.replace('_', ' ')}
                      </Badge>
                      <span className="text-gray-400">
                        <Calendar className="w-4 h-4 inline mr-1" />
                        {new Date(campaign.completedAt).toLocaleDateString()}
                      </span>
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400">ROI</p>
                    <p className="text-xl font-bold text-green-400">{campaign.performance.roi}x</p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Performance Metrics */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-400">Conversion</p>
                    <p className="text-lg font-semibold text-white">
                      {(campaign.performance.conversionRate * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-400">Open Rate</p>
                    <p className="text-lg font-semibold text-white">
                      {(campaign.performance.openRate * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-400">Click Rate</p>
                    <p className="text-lg font-semibold text-white">
                      {(campaign.performance.clickRate * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>

                {/* Key Learnings */}
                <div className="border-t border-gray-700 pt-3">
                  <p className="text-sm text-gray-400 mb-2">Key Learnings</p>
                  <div className="space-y-1">
                    {campaign.learnings.map((learning: string, index: number) => (
                      <div key={index} className="flex items-start gap-2 text-sm">
                        <Lightbulb className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-300">{learning}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Agent Learnings */}
        <TabsContent value="learnings" className="space-y-4">
          {agentLearnings.map(learning => (
            <Card key={learning.agentId} className="glass-card">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-full">
                      <Brain className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <CardTitle className="text-lg capitalize">
                        {learning.agentId.replace('-', ' ')}
                      </CardTitle>
                      <CardDescription>
                        {learning.dataPoints} data points • {(learning.confidence * 100).toFixed(0)}
                        % confidence
                      </CardDescription>
                    </div>
                  </div>
                  <Progress value={learning.confidence * 100} className="w-20 h-2" />
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-2">
                  {learning.insights.map((insight: string, index: number) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
                      <Sparkles className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-300">{insight}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Key Insights */}
        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="glass-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-white">Best Performing Goal</h3>
                  <Badge className="bg-green-500/20 text-green-400">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    trending
                  </Badge>
                </div>
                <p className="text-xl font-bold text-white mb-2">Customer Retention</p>
                <p className="text-sm text-gray-400">Average ROI of 4.5x across campaigns</p>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-white">Optimal Timing</h3>
                  <Badge className="bg-blue-500/20 text-blue-400">data-driven</Badge>
                </div>
                <p className="text-xl font-bold text-white mb-2">Tuesday 10 AM</p>
                <p className="text-sm text-gray-400">Consistently highest open and click rates</p>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-white">Best Channel Mix</h3>
                  <Badge className="bg-purple-500/20 text-purple-400">optimized</Badge>
                </div>
                <p className="text-xl font-bold text-white mb-2">Email + Social</p>
                <p className="text-sm text-gray-400">Combined approach shows 35% better results</p>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-white">Top Audience Segment</h3>
                  <Badge className="bg-orange-500/20 text-orange-400">high-value</Badge>
                </div>
                <p className="text-xl font-bold text-white mb-2">Enterprise Decision Makers</p>
                <p className="text-sm text-gray-400">3x higher conversion than average</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
