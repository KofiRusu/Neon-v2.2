'use client';

import { motion } from 'framer-motion';
import {
  Play,
  Pause,
  RotateCcw,
  TrendingUp,
  Target,
  Users,
  Brain,
  BarChart3,
  Clock,
  Sparkles,
  MessageSquare,
} from 'lucide-react';

interface CampaignCardProps {
  campaign: {
    id: string;
    name: string;
    description: string;
    type: 'product-launch' | 'seasonal-sale' | 'ugc-push' | 'brand-awareness' | 'custom';
    status: 'draft' | 'running' | 'paused' | 'completed' | 'failed';
    priority: 'low' | 'medium' | 'high';
    budget: number;
    kpis: {
      ctr: number | null;
      cvr: number | null;
      reach: number | null;
      engagement: number | null;
    };
    orchestration?: {
      totalTasks: number;
      completedTasks: number;
      runningTasks: number;
      failedTasks: number;
      overallProgress: number;
      activeAgents: string[];
      avgTaskScore: number;
    };
  };
  isSelected: boolean;
  onSelect: () => void;
  onPause: () => void;
  onResume: () => void;
  onRerun: () => void;
  onViewMatrix: () => void;
  onViewTimeline: () => void;
}

export const CampaignCard = ({
  campaign,
  isSelected,
  onSelect,
  onPause,
  onResume,
  onRerun,
  onViewMatrix,
  onViewTimeline,
}: CampaignCardProps) => {
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Play className="w-3 h-3 text-green-400" />;
      case 'paused':
        return <Pause className="w-3 h-3 text-yellow-400" />;
      case 'completed':
        return <Target className="w-3 h-3 text-blue-400" />;
      case 'failed':
        return <Target className="w-3 h-3 text-red-400" />;
      default:
        return <Target className="w-3 h-3 text-gray-400" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 hover:bg-gray-700/20 cursor-pointer transition-all duration-200 ${
        isSelected ? 'bg-purple-500/10 border-l-4 border-purple-500' : ''
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Campaign Header */}
          <div className="flex items-center space-x-3 mb-2">
            <div className="text-purple-400">{getTypeIcon(campaign.type)}</div>
            <h3 className="font-semibold text-white truncate">{campaign.name}</h3>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(campaign.status)}`}
            >
              <div className="flex items-center space-x-1">
                {getStatusIcon(campaign.status)}
                <span>{campaign.status}</span>
              </div>
            </span>
            <span className={`text-xs ${getPriorityColor(campaign.priority)}`}>
              ● {campaign.priority}
            </span>
          </div>

          {/* Campaign Description */}
          <p className="text-gray-400 text-sm mb-3 line-clamp-2">{campaign.description}</p>

          {/* Progress Bar */}
          {campaign.orchestration && (
            <div className="mb-3">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                <span>Orchestration Progress</span>
                <span>{Math.round(campaign.orchestration.overallProgress)}%</span>
              </div>
              <div className="w-full bg-gray-700/50 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${campaign.orchestration.overallProgress}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                <span>{campaign.orchestration.completedTasks}/{campaign.orchestration.totalTasks} tasks</span>
                {campaign.orchestration.runningTasks > 0 && (
                  <span className="text-purple-400">
                    {campaign.orchestration.runningTasks} running
                  </span>
                )}
              </div>
            </div>
          )}

          {/* KPIs */}
          <div className="flex items-center space-x-4 text-xs text-gray-400 mb-2">
            <div className="flex items-center space-x-1">
              <TrendingUp className="w-3 h-3" />
              <span>Engagement: {campaign.kpis.engagement || 'N/A'}%</span>
            </div>
            <div className="flex items-center space-x-1">
              <Users className="w-3 h-3" />
              <span>Reach: {campaign.kpis.reach?.toLocaleString() || 'N/A'}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Target className="w-3 h-3" />
              <span>CVR: {campaign.kpis.cvr?.toFixed(1) || 'N/A'}%</span>
            </div>
          </div>

          {/* Active Agents */}
          {campaign.orchestration?.activeAgents && campaign.orchestration.activeAgents.length > 0 && (
            <div className="flex items-center space-x-2">
              <Brain className="w-3 h-3 text-purple-400" />
              <span className="text-xs text-purple-400">
                {campaign.orchestration.activeAgents.length} agents active
              </span>
              <div className="flex space-x-1">
                {campaign.orchestration.activeAgents.slice(0, 3).map((agent, idx) => (
                  <div
                    key={idx}
                    className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"
                    title={agent}
                  />
                ))}
                {campaign.orchestration.activeAgents.length > 3 && (
                  <div className="w-2 h-2 bg-gray-400 rounded-full">
                    <span className="text-xs text-gray-400">+{campaign.orchestration.activeAgents.length - 3}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Budget */}
          <div className="mt-2 text-xs text-gray-400">
            Budget: <span className="text-white font-medium">${campaign.budget.toLocaleString()}</span>
          </div>
        </div>

        {/* Campaign Controls */}
        <div className="flex items-center space-x-2 ml-4">
          {campaign.status === 'running' ? (
            <button
              onClick={e => {
                e.stopPropagation();
                onPause();
              }}
              className="p-2 bg-yellow-500/20 hover:bg-yellow-500/30 rounded-lg text-yellow-400 transition-colors"
              title="Pause Campaign"
            >
              <Pause className="w-4 h-4" />
            </button>
          ) : campaign.status === 'paused' ? (
            <button
              onClick={e => {
                e.stopPropagation();
                onResume();
              }}
              className="p-2 bg-green-500/20 hover:bg-green-500/30 rounded-lg text-green-400 transition-colors"
              title="Resume Campaign"
            >
              <Play className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={e => {
                e.stopPropagation();
                onRerun();
              }}
              className="p-2 bg-green-500/20 hover:bg-green-500/30 rounded-lg text-green-400 transition-colors"
              title="Rerun Campaign"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={e => {
              e.stopPropagation();
              onViewMatrix();
            }}
            className="p-2 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg text-purple-400 transition-colors"
            title="View Agent Matrix"
          >
            <BarChart3 className="w-4 h-4" />
          </button>
          <button
            onClick={e => {
              e.stopPropagation();
              onViewTimeline();
            }}
            className="p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg text-blue-400 transition-colors"
            title="View Timeline"
          >
            <Clock className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}; 