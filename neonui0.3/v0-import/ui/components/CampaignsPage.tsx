"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target,
  Play,
  Pause,
  Edit,
  MoreVertical,
  TrendingUp,
  Eye,
  MousePointer,
  DollarSign,
  Calendar,
  Bot,
  CheckCircle,
  Clock,
  Zap,
  Plus,
  Filter,
  Search,
} from "lucide-react";

// Mock data for V0 - no external dependencies
const mockCampaigns = [
  {
    id: "campaign-001",
    name: "Summer Product Launch",
    description: "Multi-channel campaign for new product line launch",
    status: "active" as const,
    startDate: "2024-06-01",
    endDate: "2024-07-31",
    budget: 15000,
    spent: 8750,
    roi: 340,
    assignedAgents: ["Content Generator", "SEO Optimizer", "Social Media Bot"],
    impressions: 245000,
    clicks: 3420,
    conversions: 156,
    openRate: 24.5,
    clickRate: 8.2,
    conversionRate: 4.6,
  },
  {
    id: "campaign-002",
    name: "Email Newsletter Series",
    description: "Weekly newsletter with personalized content",
    status: "active" as const,
    startDate: "2024-06-15",
    endDate: "2024-08-15",
    budget: 2500,
    spent: 1200,
    roi: 280,
    assignedAgents: ["Email Marketing Agent", "Content Generator"],
    impressions: 45000,
    clicks: 2250,
    conversions: 89,
    openRate: 32.1,
    clickRate: 12.5,
    conversionRate: 3.9,
  },
  {
    id: "campaign-003",
    name: "Social Media Awareness",
    description: "Brand awareness across social platforms",
    status: "paused" as const,
    startDate: "2024-05-20",
    endDate: "2024-07-20",
    budget: 5000,
    spent: 3200,
    roi: 180,
    assignedAgents: ["Social Media Bot", "Brand Voice Agent"],
    impressions: 180000,
    clicks: 1890,
    conversions: 67,
    openRate: 15.2,
    clickRate: 1.05,
    conversionRate: 3.5,
  },
  {
    id: "campaign-004",
    name: "Content Marketing Push",
    description: "Blog and content-driven lead generation",
    status: "draft" as const,
    startDate: "2024-07-01",
    endDate: "2024-09-01",
    budget: 8000,
    spent: 0,
    roi: 0,
    assignedAgents: ["Content Generator", "SEO Optimizer"],
    impressions: 0,
    clicks: 0,
    conversions: 0,
    openRate: 0,
    clickRate: 0,
    conversionRate: 0,
  },
];

interface CampaignCardProps {
  campaign: (typeof mockCampaigns)[0];
  isExpanded: boolean;
  onToggleExpand: () => void;
}

function CampaignCard({
  campaign,
  isExpanded,
  onToggleExpand,
}: CampaignCardProps) {
  const statusConfig = {
    active: {
      color: "text-green-400",
      bg: "bg-green-400/20",
      border: "border-green-400/30",
      icon: Play,
    },
    paused: {
      color: "text-yellow-400",
      bg: "bg-yellow-400/20",
      border: "border-yellow-400/30",
      icon: Pause,
    },
    draft: {
      color: "text-blue-400",
      bg: "bg-blue-400/20",
      border: "border-blue-400/30",
      icon: Edit,
    },
    completed: {
      color: "text-purple-400",
      bg: "bg-purple-400/20",
      border: "border-purple-400/30",
      icon: CheckCircle,
    },
  };

  const config = statusConfig[campaign.status];
  const StatusIcon = config.icon;
  const budgetUsage = (campaign.spent / campaign.budget) * 100;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.01 }}
      className={`bg-gray-900/50 backdrop-blur-lg p-6 rounded-lg cursor-pointer transition-all duration-300 border ${
        isExpanded
          ? "border-blue-400/50 shadow-blue-400/20"
          : "border-gray-700/50 hover:border-blue-400/30"
      }`}
      onClick={onToggleExpand}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-lg bg-white/5 text-blue-400">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-lg">
              {campaign.name}
            </h3>
            <p className="text-sm text-gray-400">{campaign.description}</p>
            <div className="flex items-center space-x-2 mt-1">
              <Calendar className="w-3 h-3 text-gray-500" />
              <span className="text-xs text-gray-500">
                {new Date(campaign.startDate).toLocaleDateString()} -{" "}
                {new Date(campaign.endDate).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span
            className={`px-3 py-1 text-xs font-medium rounded-full border ${config.bg} ${config.border} ${config.color}`}
          >
            <StatusIcon className="w-3 h-3 inline mr-1" />
            {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
          </span>
          <button
            className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1 mb-1">
            <DollarSign className="w-4 h-4 text-green-400" />
            <span className="text-lg font-bold text-green-400">
              {campaign.roi > 0 ? `${campaign.roi}%` : "N/A"}
            </span>
          </div>
          <p className="text-xs text-gray-400">ROI</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1 mb-1">
            <Eye className="w-4 h-4 text-blue-400" />
            <span className="text-lg font-bold text-blue-400">
              {campaign.impressions > 0
                ? `${(campaign.impressions / 1000).toFixed(0)}K`
                : "0"}
            </span>
          </div>
          <p className="text-xs text-gray-400">Impressions</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1 mb-1">
            <MousePointer className="w-4 h-4 text-purple-400" />
            <span className="text-lg font-bold text-purple-400">
              {campaign.clicks > 0 ? campaign.clicks.toLocaleString() : "0"}
            </span>
          </div>
          <p className="text-xs text-gray-400">Clicks</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1 mb-1">
            <Target className="w-4 h-4 text-pink-400" />
            <span className="text-lg font-bold text-pink-400">
              {campaign.conversions > 0 ? campaign.conversions : "0"}
            </span>
          </div>
          <p className="text-xs text-gray-400">Conversions</p>
        </div>
      </div>

      {/* Budget Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-gray-400">Budget Usage</span>
          <span className="text-white">
            ${campaign.spent.toLocaleString()} / $
            {campaign.budget.toLocaleString()} ({budgetUsage.toFixed(1)}%)
          </span>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${budgetUsage}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`h-2 rounded-full ${
              budgetUsage > 90
                ? "bg-gradient-to-r from-pink-400 to-red-500"
                : budgetUsage > 70
                  ? "bg-gradient-to-r from-yellow-400 to-green-400"
                  : "bg-gradient-to-r from-blue-400 to-purple-500"
            }`}
          />
        </div>
      </div>

      {/* Assigned Agents */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Bot className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-400">Agents:</span>
          <div className="flex space-x-1">
            {campaign.assignedAgents.slice(0, 3).map((agent, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs bg-blue-400/20 text-blue-400 rounded-full border border-blue-400/30"
              >
                {agent.split(" ")[0]}
              </span>
            ))}
            {campaign.assignedAgents.length > 3 && (
              <span className="px-2 py-1 text-xs bg-gray-500/20 text-gray-400 rounded-full border border-gray-500/30">
                +{campaign.assignedAgents.length - 3}
              </span>
            )}
          </div>
        </div>

        {campaign.roi > 200 && (
          <div className="flex items-center space-x-1 text-green-400">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs font-medium">High Performer</span>
          </div>
        )}
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 pt-6 border-t border-white/10"
          >
            {/* Detailed Metrics */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center bg-gray-800/30 p-3 rounded-lg">
                <p className="text-lg font-bold text-green-400">
                  {campaign.openRate}%
                </p>
                <p className="text-xs text-gray-400">Open Rate</p>
              </div>
              <div className="text-center bg-gray-800/30 p-3 rounded-lg">
                <p className="text-lg font-bold text-blue-400">
                  {campaign.clickRate}%
                </p>
                <p className="text-xs text-gray-400">Click Rate</p>
              </div>
              <div className="text-center bg-gray-800/30 p-3 rounded-lg">
                <p className="text-lg font-bold text-purple-400">
                  {campaign.conversionRate}%
                </p>
                <p className="text-xs text-gray-400">Conversion Rate</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 px-4 rounded-lg transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                {campaign.status === "active"
                  ? "Pause Campaign"
                  : "Resume Campaign"}
              </button>
              <button
                className="flex-1 bg-gray-800/50 border border-gray-600 text-sm py-2 px-4 rounded-lg text-gray-400 hover:text-white transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                Edit Campaign
              </button>
              <button
                className="flex-1 bg-gray-800/50 border border-gray-600 text-sm py-2 px-4 rounded-lg text-gray-400 hover:text-white transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                View Analytics
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function CampaignsPage() {
  const [expandedCampaign, setExpandedCampaign] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "paused" | "draft">(
    "all",
  );
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCampaigns = mockCampaigns.filter((campaign) => {
    const matchesFilter = filter === "all" || campaign.status === filter;
    const matchesSearch =
      campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      campaign.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusCounts = () => {
    return {
      total: mockCampaigns.length,
      active: mockCampaigns.filter((c) => c.status === "active").length,
      paused: mockCampaigns.filter((c) => c.status === "paused").length,
      draft: mockCampaigns.filter((c) => c.status === "draft").length,
    };
  };

  const statusCounts = getStatusCounts();
  const totalROI =
    mockCampaigns.reduce((sum, campaign) => sum + campaign.roi, 0) /
    mockCampaigns.length;
  const totalSpent = mockCampaigns.reduce(
    (sum, campaign) => sum + campaign.spent,
    0,
  );
  const totalBudget = mockCampaigns.reduce(
    (sum, campaign) => sum + campaign.budget,
    0,
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      {/* Header */}
      <div className="border-b border-gray-800/50 bg-gray-900/30 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                Campaign Management
              </h1>
              <p className="text-sm text-gray-400">
                Orchestrate your marketing campaigns with AI agents
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-gray-400">
                  {statusCounts.active} active
                </span>
              </div>
              <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
                <Plus className="w-4 h-4" />
                <span className="text-sm">New Campaign</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-900/50 backdrop-blur-lg p-6 rounded-lg border border-gray-700/50">
            <div className="flex items-center space-x-3">
              <Target className="w-8 h-8 text-blue-400" />
              <div>
                <p className="text-2xl font-bold text-white">
                  {statusCounts.total}
                </p>
                <p className="text-sm text-gray-400">Total Campaigns</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-900/50 backdrop-blur-lg p-6 rounded-lg border border-gray-700/50">
            <div className="flex items-center space-x-3">
              <DollarSign className="w-8 h-8 text-green-400" />
              <div>
                <p className="text-2xl font-bold text-green-400">
                  {totalROI.toFixed(0)}%
                </p>
                <p className="text-sm text-gray-400">Average ROI</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-900/50 backdrop-blur-lg p-6 rounded-lg border border-gray-700/50">
            <div className="flex items-center space-x-3">
              <TrendingUp className="w-8 h-8 text-purple-400" />
              <div>
                <p className="text-2xl font-bold text-white">
                  ${totalSpent.toLocaleString()}
                </p>
                <p className="text-sm text-gray-400">Total Spent</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-900/50 backdrop-blur-lg p-6 rounded-lg border border-gray-700/50">
            <div className="flex items-center space-x-3">
              <Play className="w-8 h-8 text-green-400" />
              <div>
                <p className="text-2xl font-bold text-green-400">
                  {statusCounts.active}
                </p>
                <p className="text-sm text-gray-400">Active Campaigns</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center space-x-4">
            {["all", "active", "paused", "draft"].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === status
                    ? "bg-blue-600 text-white"
                    : "bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700/50"
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
                {status !== "all" && (
                  <span className="ml-2 text-xs bg-gray-600 px-1.5 py-0.5 rounded">
                    {status === "active" && statusCounts.active}
                    {status === "paused" && statusCounts.paused}
                    {status === "draft" && statusCounts.draft}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search campaigns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-400/50 focus:outline-none"
            />
          </div>
        </div>

        {/* Campaigns Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {filteredCampaigns.map((campaign, index) => (
            <motion.div
              key={campaign.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <CampaignCard
                campaign={campaign}
                isExpanded={expandedCampaign === campaign.id}
                onToggleExpand={() =>
                  setExpandedCampaign(
                    expandedCampaign === campaign.id ? null : campaign.id,
                  )
                }
              />
            </motion.div>
          ))}
        </div>

        {filteredCampaigns.length === 0 && (
          <div className="text-center py-12">
            <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">
              No campaigns found matching your criteria.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
