'use client';

import { useState, useEffect } from 'react';
import { trpc } from '@/utils/trpc';
import { PatternExplorerPanel } from '@/components/PatternExplorerPanel';
import { PredictiveCampaignDesigner } from '@/components/PredictiveCampaignDesigner';
import { AutoReplayDashboard } from '@/components/AutoReplayDashboard';
import { SegmentLiftChart } from '@/components/SegmentLiftChart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Brain,
  TrendingUp,
  Zap,
  Target,
  Activity,
  RefreshCw,
  Play,
  Pause,
  BarChart3,
  Lightbulb,
  Rocket,
} from 'lucide-react';

interface InsightsData {
  patterns: any[];
  trendingPatterns: any[];
  performanceInsights: any[];
  variantStructures: any[];
  insights: {
    totalPatterns: number;
    trendingPatterns: number;
    averageScore: number;
    topPerformingAgents: any[];
    segmentInsights: any;
    trendAnalysis: any;
  };
  recommendations: string[];
}

export default function CampaignPatternsPage() {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'patterns' | 'designer' | 'replay' | 'analytics'
  >('overview');
  const [refreshKey, setRefreshKey] = useState(0);
  const [isAutoReplayRunning, setIsAutoReplayRunning] = useState(false);

  // Queries
  const {
    data: insightsData,
    isLoading: insightsLoading,
    refetch: refetchInsights,
  } = trpc.insights.getCrossCampaignInsights.useQuery({
    daysBack: 90,
    minScore: 70,
    includeSegments: true,
    includeTrends: true,
  });

  const { data: systemStatus, isLoading: statusLoading } = trpc.insights.getSystemStatus.useQuery();

  const { data: replayAnalytics, isLoading: analyticsLoading } =
    trpc.insights.getReplayAnalytics.useQuery({
      daysBack: 30,
      includeFailures: true,
      groupBy: 'pattern',
    });

  // Mutations
  const triggerMining = trpc.insights.triggerPatternMining.useMutation({
    onSuccess: () => {
      refetchInsights();
      setRefreshKey(prev => prev + 1);
    },
  });

  const startAutoReplay = trpc.insights.launchAutoReplay.useMutation({
    onSuccess: () => {
      setIsAutoReplayRunning(true);
    },
  });

  const stopAutoReplay = trpc.insights.stopAutoReplay.useMutation({
    onSuccess: () => {
      setIsAutoReplayRunning(false);
    },
  });

  const handleTriggerMining = async () => {
    await triggerMining.mutateAsync({
      daysToAnalyze: 90,
      minCampaigns: 5,
      scoreThreshold: 70,
      similarityThreshold: 0.75,
      includeActiveTests: false,
    });
  };

  const handleToggleAutoReplay = async () => {
    if (isAutoReplayRunning) {
      await stopAutoReplay.mutateAsync();
    } else {
      await startAutoReplay.mutateAsync({
        configuration: {
          confidenceThreshold: 85,
          maxConcurrentReplays: 3,
          minimumTimeBetweenReplays: 24,
          budgetAllocation: 10000,
          enableContentRefresh: true,
          enableTimingOptimization: true,
          enableBrandValidation: true,
          testMode: false,
        },
      });
    }
  };

  if (insightsLoading || statusLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-2 border-neon-blue border-t-transparent rounded-full"></div>
          <span className="ml-3 text-neon-blue font-medium">Loading campaign insights...</span>
        </div>
      </div>
    );
  }

  const data = insightsData?.data as InsightsData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-neon-blue to-neon-purple bg-clip-text text-transparent">
              Campaign Intelligence
            </h1>
            <p className="text-slate-400 mt-2">
              Cross-campaign learning, pattern mining, and predictive campaign generation
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Button
              onClick={handleTriggerMining}
              disabled={triggerMining.isLoading}
              className="bg-gradient-to-r from-neon-blue to-blue-600 hover:from-blue-600 hover:to-neon-blue transition-all duration-300 transform hover:scale-105"
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${triggerMining.isLoading ? 'animate-spin' : ''}`}
              />
              Mine Patterns
            </Button>

            <Button
              onClick={handleToggleAutoReplay}
              disabled={startAutoReplay.isLoading || stopAutoReplay.isLoading}
              variant={isAutoReplayRunning ? 'destructive' : 'default'}
              className={`transition-all duration-300 transform hover:scale-105 ${
                isAutoReplayRunning
                  ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-500'
                  : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-500'
              }`}
            >
              {isAutoReplayRunning ? (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  Stop Auto-Replay
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Start Auto-Replay
                </>
              )}
            </Button>
          </div>
        </div>

        {/* System Status Alert */}
        {systemStatus?.data && (
          <Alert className="border border-neon-blue/20 bg-slate-800/50 backdrop-blur-sm">
            <Activity className="h-4 w-4 text-neon-blue" />
            <AlertDescription className="text-slate-300">
              System Status:{' '}
              <Badge variant="outline" className="text-green-400 border-green-400 ml-2">
                {systemStatus.data.overall}
              </Badge>
              <span className="ml-4 text-sm">
                {systemStatus.data.components.patternMiner.patternsMinedToday} patterns mined today
                •{systemStatus.data.components.autoReplayEngine.activeReplays} active replays •
                Uptime: {systemStatus.data.uptime}
              </span>
            </AlertDescription>
          </Alert>
        )}

        {/* Key Metrics Overview */}
        {data && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50 hover:border-neon-blue/50 transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-300">Total Patterns</CardTitle>
                <Brain className="h-4 w-4 text-neon-blue" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{data.insights.totalPatterns}</div>
                <p className="text-xs text-slate-400">
                  Avg Score: {data.insights.averageScore.toFixed(1)}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50 hover:border-neon-purple/50 transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-300">
                  Trending Patterns
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-neon-purple" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {data.insights.trendingPatterns}
                </div>
                <p className="text-xs text-slate-400">+15% from last week</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50 hover:border-green-400/50 transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-300">Auto-Replays</CardTitle>
                <Zap className="h-4 w-4 text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {replayAnalytics?.data?.totalReplays || 0}
                </div>
                <p className="text-xs text-slate-400">
                  {replayAnalytics?.data?.successfulReplays || 0} successful
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50 hover:border-yellow-400/50 transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-300">Avg ROI</CardTitle>
                <Target className="h-4 w-4 text-yellow-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {replayAnalytics?.data?.averageROI?.toFixed(1) || '0.0'}x
                </div>
                <p className="text-xs text-slate-400">Cross-campaign average</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-slate-800/50 backdrop-blur-sm rounded-lg p-1 border border-slate-700/50">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'patterns', label: 'Pattern Explorer', icon: Brain },
            { id: 'designer', label: 'Campaign Designer', icon: Rocket },
            { id: 'replay', label: 'Auto-Replay', icon: Zap },
            { id: 'analytics', label: 'Segment Analytics', icon: TrendingUp },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-neon-blue to-neon-purple text-white shadow-lg'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recommendations */}
              <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50">
                <CardHeader>
                  <CardTitle className="flex items-center text-white">
                    <Lightbulb className="w-5 h-5 mr-2 text-yellow-400" />
                    AI Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {data?.recommendations.map((rec, index) => (
                    <div
                      key={index}
                      className="flex items-start space-x-3 p-3 bg-slate-700/30 rounded-lg"
                    >
                      <div className="w-2 h-2 bg-neon-blue rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-slate-300 text-sm leading-relaxed">{rec}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Top Performing Agents */}
              <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50">
                <CardHeader>
                  <CardTitle className="flex items-center text-white">
                    <Brain className="w-5 h-5 mr-2 text-neon-purple" />
                    Top Performing Agents
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {data?.insights.topPerformingAgents.map((agent, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-white">{agent.agent}</p>
                        <p className="text-sm text-slate-400">
                          {agent.successRate.toFixed(1)}% success rate
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-neon-blue font-bold">
                          {agent.avgPerformance.toFixed(1)}
                        </p>
                        <p className="text-xs text-slate-400">avg score</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'patterns' && (
            <PatternExplorerPanel
              patterns={data?.patterns || []}
              trendingPatterns={data?.trendingPatterns || []}
              variantStructures={data?.variantStructures || []}
              refreshKey={refreshKey}
            />
          )}

          {activeTab === 'designer' && <PredictiveCampaignDesigner />}

          {activeTab === 'replay' && (
            <AutoReplayDashboard
              analytics={replayAnalytics?.data}
              isRunning={isAutoReplayRunning}
              onToggle={handleToggleAutoReplay}
            />
          )}

          {activeTab === 'analytics' && (
            <SegmentLiftChart
              segmentData={data?.insights.segmentInsights}
              performanceInsights={data?.performanceInsights || []}
            />
          )}
        </div>
      </div>
    </div>
  );
}
