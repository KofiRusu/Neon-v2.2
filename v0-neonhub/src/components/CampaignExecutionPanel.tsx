'use client';

/**
 * Campaign Execution Panel - Real-time Campaign Monitoring & Control
 */

import React, { useState, useEffect } from 'react';
import { trpc } from '../utils/trpc';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import {
  Play,
  Pause,
  Square,
  BarChart3,
  Users,
  Mail,
  MessageSquare,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap,
} from 'lucide-react';

interface CampaignExecutionPanelProps {
  campaignId?: string;
  className?: string;
}

export function CampaignExecutionPanel({ campaignId, className }: CampaignExecutionPanelProps) {
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(campaignId || null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // tRPC queries
  const {
    data: campaignStatus,
    isLoading: statusLoading,
    refetch: refetchStatus,
  } = trpc.campaign.getCampaignStatus.useQuery(undefined, {
    refetchInterval: autoRefresh ? 5000 : false, // Refresh every 5 seconds if auto-refresh enabled
  });

  const { data: campaignMetrics, isLoading: metricsLoading } =
    trpc.campaign.getCampaignMetrics.useQuery(
      { campaignId: selectedCampaign || undefined },
      { enabled: !!selectedCampaign }
    );

  // Campaign execution mutation
  const executeCampaignMutation = trpc.campaign.executeCampaign.useMutation({
    onSuccess: () => {
      refetchStatus();
    },
  });

  const analyzeCampaignMutation = trpc.campaign.analyzeCampaign.useMutation();

  // Auto-refresh toggle
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refetchStatus();
    }, 5000);

    return () => clearInterval(interval);
  }, [autoRefresh, refetchStatus]);

  const handleExecuteCampaign = async () => {
    try {
      await executeCampaignMutation.mutateAsync({
        goal: 'lead_generation',
        channels: ['email', 'social_media'],
        targetAudience: 'Marketing professionals interested in AI automation',
        budget: 2500,
        brandTone: 'Professional, innovative, results-focused',
      });
    } catch (error) {
      console.error('Campaign execution failed:', error);
    }
  };

  const handleAnalyzeCampaign = async (campaignId: string) => {
    try {
      const analysis = await analyzeCampaignMutation.mutateAsync({ campaignId });
      console.log('Campaign analysis:', analysis);
    } catch (error) {
      console.error('Campaign analysis failed:', error);
    }
  };

  if (statusLoading && !campaignStatus) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const runningCampaigns = campaignStatus?.data?.running || [];
  const scheduledCampaigns = campaignStatus?.data?.scheduled || [];
  const statistics = campaignStatus?.data?.statistics;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold gradient-text">Campaign Execution Center</h2>
          <p className="text-gray-400">Real-time campaign monitoring and agent coordination</p>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={() => setAutoRefresh(!autoRefresh)}
            variant={autoRefresh ? 'default' : 'outline'}
            size="sm"
            className="gap-2"
          >
            <Zap className="w-4 h-4" />
            Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
          </Button>

          <Button
            onClick={handleExecuteCampaign}
            disabled={executeCampaignMutation.isPending}
            className="gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          >
            <Play className="w-4 h-4" />
            {executeCampaignMutation.isPending ? 'Launching...' : 'Launch Campaign'}
          </Button>
        </div>
      </div>

      {/* System Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Active Campaigns</p>
                <p className="text-2xl font-bold text-blue-400">{statistics?.totalRunning || 0}</p>
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
                <p className="text-sm text-gray-400">Scheduled</p>
                <p className="text-2xl font-bold text-purple-400">
                  {statistics?.totalScheduled || 0}
                </p>
              </div>
              <div className="p-3 bg-purple-500/20 rounded-full">
                <Clock className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Capacity Used</p>
                <p className="text-2xl font-bold text-green-400">
                  {Math.round((statistics?.utilizationRate || 0) * 100)}%
                </p>
              </div>
              <div className="p-3 bg-green-500/20 rounded-full">
                <TrendingUp className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Agents Active</p>
                <p className="text-2xl font-bold text-orange-400">8</p>
              </div>
              <div className="p-3 bg-orange-500/20 rounded-full">
                <Users className="w-6 h-6 text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="running" className="w-full">
        <TabsList className="grid w-full grid-cols-3 glass-card">
          <TabsTrigger value="running">Running Campaigns</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Running Campaigns */}
        <TabsContent value="running" className="space-y-4">
          {runningCampaigns.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="p-8 text-center">
                <div className="text-gray-400 mb-4">
                  <BarChart3 className="w-12 h-12 mx-auto opacity-50" />
                </div>
                <h3 className="text-lg font-semibold text-gray-300 mb-2">No Active Campaigns</h3>
                <p className="text-gray-400 mb-4">
                  Launch your first autonomous campaign to get started
                </p>
                <Button
                  onClick={handleExecuteCampaign}
                  className="bg-gradient-to-r from-blue-500 to-purple-600"
                >
                  Launch Demo Campaign
                </Button>
              </CardContent>
            </Card>
          ) : (
            runningCampaigns.map((campaign: any) => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                onAnalyze={handleAnalyzeCampaign}
                onSelect={setSelectedCampaign}
                isSelected={selectedCampaign === campaign.id}
              />
            ))
          )}
        </TabsContent>

        {/* Scheduled Campaigns */}
        <TabsContent value="scheduled" className="space-y-4">
          {scheduledCampaigns.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="p-8 text-center">
                <Clock className="w-12 h-12 mx-auto text-gray-400 opacity-50 mb-4" />
                <h3 className="text-lg font-semibold text-gray-300 mb-2">No Scheduled Campaigns</h3>
                <p className="text-gray-400">Schedule campaigns for future execution</p>
              </CardContent>
            </Card>
          ) : (
            scheduledCampaigns.map((schedule: any) => (
              <ScheduledCampaignCard key={schedule.id} schedule={schedule} />
            ))
          )}
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics" className="space-y-4">
          {selectedCampaign && campaignMetrics ? (
            <CampaignAnalytics metrics={campaignMetrics.data} isLoading={metricsLoading} />
          ) : (
            <Card className="glass-card">
              <CardContent className="p-8 text-center">
                <BarChart3 className="w-12 h-12 mx-auto text-gray-400 opacity-50 mb-4" />
                <h3 className="text-lg font-semibold text-gray-300 mb-2">Select a Campaign</h3>
                <p className="text-gray-400">
                  Choose a running campaign to view detailed analytics
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Campaign Card Component
function CampaignCard({
  campaign,
  onAnalyze,
  onSelect,
  isSelected,
}: {
  campaign: any;
  onAnalyze: (id: string) => void;
  onSelect: (id: string) => void;
  isSelected: boolean;
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'text-green-400 bg-green-500/20';
      case 'completed':
        return 'text-blue-400 bg-blue-500/20';
      case 'failed':
        return 'text-red-400 bg-red-500/20';
      case 'paused':
        return 'text-yellow-400 bg-yellow-500/20';
      default:
        return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Play className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4" />;
      case 'paused':
        return <Pause className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <Card
      className={`glass-card transition-all cursor-pointer ${
        isSelected ? 'ring-2 ring-blue-500' : 'hover:ring-1 ring-gray-600'
      }`}
      onClick={() => onSelect(campaign.id)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge className={`gap-1 ${getStatusColor(campaign.status)}`}>
              {getStatusIcon(campaign.status)}
              {campaign.status}
            </Badge>
            <div>
              <CardTitle className="text-lg">Campaign {campaign.id.slice(-4)}</CardTitle>
              <CardDescription>Lead Generation Campaign</CardDescription>
            </div>
          </div>
          <Button
            onClick={e => {
              e.stopPropagation();
              onAnalyze(campaign.id);
            }}
            size="sm"
            variant="outline"
            className="gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            Analyze
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">Progress</span>
            <span className="text-white">{campaign.progress}%</span>
          </div>
          <Progress value={campaign.progress} className="h-2" />
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-blue-400 mb-1">
              <Mail className="w-4 h-4" />
            </div>
            <p className="text-lg font-bold text-white">{campaign.metrics.delivered}</p>
            <p className="text-xs text-gray-400">Delivered</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-green-400 mb-1">
              <TrendingUp className="w-4 h-4" />
            </div>
            <p className="text-lg font-bold text-white">{campaign.metrics.opened}</p>
            <p className="text-xs text-gray-400">Opened</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-purple-400 mb-1">
              <MessageSquare className="w-4 h-4" />
            </div>
            <p className="text-lg font-bold text-white">{campaign.metrics.clicked}</p>
            <p className="text-xs text-gray-400">Clicked</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-orange-400 mb-1">
              <CheckCircle className="w-4 h-4" />
            </div>
            <p className="text-lg font-bold text-white">{campaign.metrics.converted}</p>
            <p className="text-xs text-gray-400">Converted</p>
          </div>
        </div>

        {/* Recent Activity */}
        {campaign.agentActivity && campaign.agentActivity.length > 0 && (
          <div className="border-t border-gray-700 pt-3">
            <p className="text-sm text-gray-400 mb-2">Latest Agent Activity</p>
            <div className="space-y-1">
              {campaign.agentActivity.slice(-2).map((activity: any, index: number) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <Badge variant="outline" className="text-xs">
                    {activity.agentId.replace('-agent', '')}
                  </Badge>
                  <span className="text-gray-300">{activity.result}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Scheduled Campaign Card Component
function ScheduledCampaignCard({ schedule }: { schedule: any }) {
  return (
    <Card className="glass-card">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-white">Scheduled Campaign</h3>
            <p className="text-sm text-gray-400">
              Priority:{' '}
              <Badge variant="outline" className="ml-1">
                {schedule.priority}
              </Badge>
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400">Scheduled for</p>
            <p className="font-medium text-white">
              {new Date(schedule.scheduledTime).toLocaleString()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Campaign Analytics Component
function CampaignAnalytics({ metrics, isLoading }: { metrics: any; isLoading: boolean }) {
  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-700 rounded w-1/4"></div>
            <div className="h-32 bg-gray-700 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Performance Metrics */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg">Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(metrics.performance).map(([key, value]: [string, any]) => (
            <div key={key} className="flex justify-between items-center">
              <span className="text-gray-400 capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </span>
              <span className="font-semibold text-white">
                {typeof value === 'number'
                  ? key.includes('Rate')
                    ? `${(value * 100).toFixed(1)}%`
                    : value.toFixed(2)
                  : value}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Insights */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg">AI Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {metrics.insights.map((insight: string, index: number) => (
              <Alert key={index} className="border-blue-500/20 bg-blue-500/10">
                <AlertCircle className="h-4 w-4 text-blue-400" />
                <AlertDescription className="text-gray-300">{insight}</AlertDescription>
              </Alert>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
