'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { trpc } from '@/utils/trpc';
import {
  Play,
  Pause,
  RotateCcw,
  Calendar,
  DollarSign,
  Target,
  Zap,
  Brain,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  TrendingUp,
  MessageSquare,
  Filter,
  Plus,
  Settings,
  BarChart3,
  Bot,
  Sparkles,
} from 'lucide-react';

import { CampaignTimeline } from '@/components/campaigns/CampaignTimeline';
import { AgentOrchestrationMatrix } from '@/components/campaigns/AgentOrchestrationMatrix';

interface Campaign {
  id: string;
  name: string;
  description: string;
  type: 'product-launch' | 'seasonal-sale' | 'ugc-push' | 'brand-awareness' | 'custom';
  status: 'draft' | 'running' | 'paused' | 'completed' | 'failed';
  priority: 'low' | 'medium' | 'high';
  startDate: Date;
  endDate: Date;
  budget: number;
  targetAudience: string;
  goals: string[];
  kpis: {
    ctr: number | null;
    cvr: number | null;
    sentiment: number | null;
    costPerMessage: number | null;
    reach: number | null;
    engagement: number | null;
  };
  tags: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  orchestration?: {
    totalTasks: number;
    completedTasks: number;
    runningTasks: number;
    failedTasks: number;
    overallProgress: number;
    activeAgents: string[];
    avgTaskScore: number;
  };
}

type CampaignStatusType = 'all' | 'draft' | 'running' | 'paused' | 'completed' | 'failed';

export default function CampaignsPage() {
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [statusFilter, setStatusFilter] = useState<CampaignStatusType>('all');
  const [showMatrix, setShowMatrix] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch campaigns
  const {
    data: campaignsData,
    isLoading,
    refetch,
  } = trpc.campaign.getCampaigns.useQuery({
    status: statusFilter === 'all' ? undefined : statusFilter,
    limit: 20,
    sortBy: 'updated',
  });

  // Fetch campaign details when selected
  const { data: campaignDetails } = trpc.campaign.getCampaignDetails.useQuery(
    { id: selectedCampaign?.id || '' },
    { enabled: !!selectedCampaign }
  );

  // Fetch triggers for selected campaign
  const { data: triggersData } = trpc.campaign.evaluateCampaignTriggers.useQuery(
    { id: selectedCampaign?.id || '' },
    { enabled: !!selectedCampaign }
  );

  // Mutations
  const runCampaignMutation = trpc.campaign.runOrchestratedCampaign.useMutation();
  const pauseCampaignMutation = trpc.campaign.pauseCampaign.useMutation();
  const resumeCampaignMutation = trpc.campaign.resumeCampaign.useMutation();

  // Auto-refresh campaigns
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        refetch();
      }, 30000); // Refresh every 30 seconds

      return () => clearInterval(interval);
    }
  }, [autoRefresh, refetch]);

  const handleRunCampaign = async (campaignId: string) => {
    try {
      await runCampaignMutation.mutateAsync({ id: campaignId });
      refetch();
    } catch (error) {
      console.error('Failed to run campaign:', error);
    }
  };

  const handlePauseCampaign = async (campaignId: string) => {
    try {
      await pauseCampaignMutation.mutateAsync({ id: campaignId });
      refetch();
    } catch (error) {
      console.error('Failed to pause campaign:', error);
    }
  };

  const handleResumeCampaign = async (campaignId: string) => {
    try {
      await resumeCampaignMutation.mutateAsync({ id: campaignId });
      refetch();
    } catch (error) {
      console.error('Failed to resume campaign:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'paused':
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'completed':
        return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'failed':
        return 'text-red-400 bg-red-400/10 border-red-400/20';
      default:
        return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-400';
      case 'medium':
        return 'text-yellow-400';
      case 'low':
        return 'text-green-400';
      default:
        return 'text-gray-400';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'product-launch':
        return <Sparkles className="w-4 h-4" />;
      case 'seasonal-sale':
        return <TrendingUp className="w-4 h-4" />;
      case 'ugc-push':
        return <Users className="w-4 h-4" />;
      case 'brand-awareness':
        return <MessageSquare className="w-4 h-4" />;
      default:
        return <Target className="w-4 h-4" />;
    }
  };

  const campaigns = campaignsData?.data || [];
  const activeCampaigns = campaigns.filter(c => c.status === 'running').length;
  const totalBudget = campaigns.reduce((sum, c) => sum + c.budget, 0);
  const activeAgents = campaigns.reduce((sum, c) => sum + (c.orchestration?.runningTasks || 0), 0);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700/50">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-purple-500/20 rounded-xl">
                <Bot className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Campaign Orchestration
                </h1>
                <p className="text-gray-400 text-sm">Multi-Agent AI Campaign Control Center</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  autoRefresh
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-gray-700/50 text-gray-400 border border-gray-600/50'
                }`}
              >
                <Activity className="w-4 h-4 mr-2 inline" />
                {autoRefresh ? 'Live' : 'Manual'}
              </button>
              <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>New Campaign</span>
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Active Campaigns</p>
                  <p className="text-2xl font-bold text-green-400">{activeCampaigns}</p>
                </div>
                <Play className="w-8 h-8 text-green-400" />
              </div>
            </div>
            <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Budget</p>
                  <p className="text-2xl font-bold text-blue-400">
                    ${totalBudget.toLocaleString()}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-blue-400" />
              </div>
            </div>
            <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Active Agents</p>
                  <p className="text-2xl font-bold text-purple-400">{activeAgents}</p>
                </div>
                <Brain className="w-8 h-8 text-purple-400" />
              </div>
            </div>
            <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Automations</p>
                  <p className="text-2xl font-bold text-yellow-400">
                    {triggersData?.data?.triggeredActions?.length || 0}
                  </p>
                </div>
                <Zap className="w-8 h-8 text-yellow-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Campaigns List */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800/30 rounded-xl border border-gray-700/30 overflow-hidden">
              <div className="p-4 border-b border-gray-700/30">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white">Campaigns</h2>
                  <div className="flex items-center space-x-2">
                    <select
                      value={statusFilter}
                      onChange={e => setStatusFilter(e.target.value as CampaignStatusType)}
                      className="bg-gray-700/50 border border-gray-600/50 rounded-lg px-3 py-2 text-sm text-white"
                    >
                      <option value="all">All Status</option>
                      <option value="running">Running</option>
                      <option value="paused">Paused</option>
                      <option value="completed">Completed</option>
                      <option value="draft">Draft</option>
                      <option value="failed">Failed</option>
                    </select>
                    <button className="p-2 bg-gray-700/50 rounded-lg hover:bg-gray-600/50 transition-colors">
                      <Filter className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-gray-700/30">
                {isLoading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto"></div>
                    <p className="text-gray-400 mt-2">Loading campaigns...</p>
                  </div>
                ) : campaigns.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bot className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No campaigns found</p>
                  </div>
                ) : (
                  campaigns.map(campaign => (
                    <motion.div
                      key={campaign.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-4 hover:bg-gray-700/20 cursor-pointer transition-all duration-200 ${
                        selectedCampaign?.id === campaign.id
                          ? 'bg-purple-500/10 border-l-4 border-purple-500'
                          : ''
                      }`}
                      onClick={() => setSelectedCampaign(campaign)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <div className="text-purple-400">{getTypeIcon(campaign.type)}</div>
                            <h3 className="font-semibold text-white">{campaign.name}</h3>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(campaign.status)}`}
                            >
                              {campaign.status}
                            </span>
                            <span className={`text-xs ${getPriorityColor(campaign.priority)}`}>
                              ● {campaign.priority}
                            </span>
                          </div>
                          <p className="text-gray-400 text-sm mb-3">{campaign.description}</p>

                          {/* Progress Bar */}
                          {campaign.orchestration && (
                            <div className="mb-3">
                              <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                                <span>Progress</span>
                                <span>{Math.round(campaign.orchestration.overallProgress)}%</span>
                              </div>
                              <div className="w-full bg-gray-700/50 rounded-full h-2">
                                <div
                                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                                  style={{ width: `${campaign.orchestration.overallProgress}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {/* KPIs */}
                          <div className="flex items-center space-x-4 text-xs text-gray-400">
                            <div className="flex items-center space-x-1">
                              <TrendingUp className="w-3 h-3" />
                              <span>CTR: {campaign.kpis.ctr?.toFixed(1) || 'N/A'}%</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Target className="w-3 h-3" />
                              <span>CVR: {campaign.kpis.cvr?.toFixed(1) || 'N/A'}%</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Users className="w-3 h-3" />
                              <span>Reach: {campaign.kpis.reach?.toLocaleString() || 'N/A'}</span>
                            </div>
                          </div>

                          {/* Active Agents */}
                          {campaign.orchestration?.activeAgents &&
                            campaign.orchestration.activeAgents.length > 0 && (
                              <div className="mt-2 flex items-center space-x-2">
                                <Brain className="w-3 h-3 text-purple-400" />
                                <span className="text-xs text-purple-400">
                                  {campaign.orchestration.activeAgents.length} agents active
                                </span>
                                <div className="flex space-x-1">
                                  {campaign.orchestration.activeAgents
                                    .slice(0, 3)
                                    .map((agent, idx) => (
                                      <div
                                        key={idx}
                                        className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"
                                      />
                                    ))}
                                </div>
                              </div>
                            )}
                        </div>

                        {/* Campaign Controls */}
                        <div className="flex items-center space-x-2 ml-4">
                          {campaign.status === 'running' ? (
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                handlePauseCampaign(campaign.id);
                              }}
                              className="p-2 bg-yellow-500/20 hover:bg-yellow-500/30 rounded-lg text-yellow-400 transition-colors"
                            >
                              <Pause className="w-4 h-4" />
                            </button>
                          ) : campaign.status === 'paused' ? (
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                handleResumeCampaign(campaign.id);
                              }}
                              className="p-2 bg-green-500/20 hover:bg-green-500/30 rounded-lg text-green-400 transition-colors"
                            >
                              <Play className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                handleRunCampaign(campaign.id);
                              }}
                              className="p-2 bg-green-500/20 hover:bg-green-500/30 rounded-lg text-green-400 transition-colors"
                            >
                              <Play className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              setShowMatrix(true);
                            }}
                            className="p-2 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg text-purple-400 transition-colors"
                          >
                            <BarChart3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              setShowTimeline(true);
                            }}
                            className="p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg text-blue-400 transition-colors"
                          >
                            <Clock className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Campaign Details Panel */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800/30 rounded-xl border border-gray-700/30 overflow-hidden">
              <div className="p-4 border-b border-gray-700/30">
                <h2 className="text-lg font-semibold text-white">Campaign Details</h2>
              </div>

              {selectedCampaign ? (
                <div className="p-4">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-white mb-2">{selectedCampaign.name}</h3>
                      <p className="text-gray-400 text-sm">{selectedCampaign.description}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-400 text-xs">Budget</p>
                        <p className="text-white font-semibold">
                          ${selectedCampaign.budget.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs">Priority</p>
                        <p
                          className={`font-semibold ${getPriorityColor(selectedCampaign.priority)}`}
                        >
                          {selectedCampaign.priority}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-gray-400 text-xs mb-2">Goals</p>
                      <div className="space-y-1">
                        {selectedCampaign.goals.map((goal, idx) => (
                          <div key={idx} className="flex items-center space-x-2 text-sm">
                            <CheckCircle className="w-3 h-3 text-green-400" />
                            <span className="text-gray-300">{goal}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Triggers */}
                    {triggersData?.data?.triggers && triggersData.data.triggers.length > 0 && (
                      <div>
                        <p className="text-gray-400 text-xs mb-2">Active Triggers</p>
                        <div className="space-y-2">
                          {triggersData.data.triggers.map((trigger, idx) => (
                            <div
                              key={idx}
                              className={`p-2 rounded-lg border ${
                                trigger.isTriggered
                                  ? 'bg-red-500/10 border-red-500/30 text-red-400'
                                  : 'bg-gray-700/30 border-gray-600/30 text-gray-400'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium">{trigger.name}</span>
                                {trigger.isTriggered && <AlertTriangle className="w-3 h-3" />}
                              </div>
                              <p className="text-xs opacity-80">{trigger.condition}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="pt-4 border-t border-gray-700/30">
                      <button
                        onClick={() => setShowMatrix(true)}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2"
                      >
                        <BarChart3 className="w-4 h-4" />
                        <span>View Agent Matrix</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center">
                  <Bot className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">Select a campaign to view details</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Agent Orchestration Matrix Modal */}
      <AnimatePresence>
        {showMatrix && selectedCampaign && (
          <AgentOrchestrationMatrix
            campaignId={selectedCampaign.id}
            onClose={() => setShowMatrix(false)}
          />
        )}
      </AnimatePresence>

      {/* Campaign Timeline Modal */}
      <AnimatePresence>
        {showTimeline && selectedCampaign && (
          <CampaignTimeline
            campaignId={selectedCampaign.id}
            onClose={() => setShowTimeline(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
