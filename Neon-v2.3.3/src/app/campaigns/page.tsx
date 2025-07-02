"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState, useRef, useEffect } from "react"
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
  BarChart3,
  Filter,
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Clock,
  Zap,
} from "lucide-react"
import PageLayout from "@/components/page-layout"

// Mock tRPC data - replace with actual tRPC calls
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
    milestones: [
      { id: "m1", name: "Campaign Setup", status: "completed", date: "2024-06-01", progress: 100 },
      { id: "m2", name: "Content Creation", status: "completed", date: "2024-06-05", progress: 100 },
      { id: "m3", name: "Launch Phase", status: "completed", date: "2024-06-10", progress: 100 },
      { id: "m4", name: "Optimization", status: "active", date: "2024-06-20", progress: 75 },
      { id: "m5", name: "Final Push", status: "pending", date: "2024-07-15", progress: 0 },
      { id: "m6", name: "Campaign End", status: "pending", date: "2024-07-31", progress: 0 },
    ],
    abTests: [
      {
        id: "ab1",
        name: "Email Subject Lines",
        variantA: { name: "Variant A", openRate: 22.3, clickRate: 7.8, conversions: 145 },
        variantB: { name: "Variant B", openRate: 26.7, clickRate: 8.6, conversions: 167 },
        winner: "B",
        confidence: 95,
      },
      {
        id: "ab2",
        name: "Landing Page CTA",
        variantA: { name: "Variant A", openRate: 18.5, clickRate: 12.4, conversions: 89 },
        variantB: { name: "Variant B", openRate: 19.2, clickRate: 11.8, conversions: 92 },
        winner: "A",
        confidence: 87,
      },
    ],
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
    milestones: [
      { id: "m1", name: "Setup & Segmentation", status: "completed", date: "2024-06-15", progress: 100 },
      { id: "m2", name: "Content Planning", status: "completed", date: "2024-06-18", progress: 100 },
      { id: "m3", name: "Weekly Sends", status: "active", date: "2024-06-22", progress: 60 },
      { id: "m4", name: "Performance Review", status: "pending", date: "2024-07-15", progress: 0 },
      { id: "m5", name: "Optimization", status: "pending", date: "2024-08-01", progress: 0 },
    ],
    abTests: [
      {
        id: "ab3",
        name: "Send Time Optimization",
        variantA: { name: "Morning Send", openRate: 28.4, clickRate: 11.2, conversions: 76 },
        variantB: { name: "Evening Send", openRate: 35.8, clickRate: 13.8, conversions: 102 },
        winner: "B",
        confidence: 92,
      },
    ],
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
    milestones: [
      { id: "m1", name: "Platform Setup", status: "completed", date: "2024-05-20", progress: 100 },
      { id: "m2", name: "Content Creation", status: "completed", date: "2024-05-25", progress: 100 },
      { id: "m3", name: "Launch Phase", status: "completed", date: "2024-06-01", progress: 100 },
      { id: "m4", name: "Engagement Drive", status: "paused", date: "2024-06-15", progress: 45 },
      { id: "m5", name: "Final Push", status: "pending", date: "2024-07-01", progress: 0 },
    ],
    abTests: [
      {
        id: "ab4",
        name: "Post Format Test",
        variantA: { name: "Image Posts", openRate: 12.8, clickRate: 0.9, conversions: 34 },
        variantB: { name: "Video Posts", openRate: 17.6, clickRate: 1.2, conversions: 33 },
        winner: "B",
        confidence: 78,
      },
    ],
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
    milestones: [
      { id: "m1", name: "Content Strategy", status: "active", date: "2024-07-01", progress: 30 },
      { id: "m2", name: "Content Creation", status: "pending", date: "2024-07-10", progress: 0 },
      { id: "m3", name: "SEO Optimization", status: "pending", date: "2024-07-20", progress: 0 },
      { id: "m4", name: "Launch", status: "pending", date: "2024-08-01", progress: 0 },
    ],
    abTests: [],
  },
]

interface CampaignCardProps {
  campaign: (typeof mockCampaigns)[0]
  isExpanded: boolean
  onToggleExpand: () => void
}

function CampaignCard({ campaign, isExpanded, onToggleExpand }: CampaignCardProps) {
  const statusConfig = {
    active: {
      color: "text-neon-green",
      bg: "bg-neon-green/20",
      border: "border-neon-green/30",
      pulse: "pulse-neon",
      icon: Play,
    },
    paused: {
      color: "text-yellow-400",
      bg: "bg-yellow-400/20",
      border: "border-yellow-400/30",
      pulse: "pulse-yellow",
      icon: Pause,
    },
    draft: {
      color: "text-neon-blue",
      bg: "bg-neon-blue/20",
      border: "border-neon-blue/30",
      pulse: "pulse-blue",
      icon: Edit,
    },
    completed: {
      color: "text-neon-purple",
      bg: "bg-neon-purple/20",
      border: "border-neon-purple/30",
      pulse: "",
      icon: CheckCircle,
    },
  }

  const config = statusConfig[campaign.status]
  const StatusIcon = config.icon

  const budgetUsage = (campaign.spent / campaign.budget) * 100
  const isPositiveROI = campaign.roi > 0

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.01 }}
      className={`glassmorphism-effect p-6 rounded-lg cursor-pointer transition-all duration-300 ${
        isExpanded ? "glow-border shadow-neon-blue/20" : "hover:border-neon-blue/30"
      }`}
      onClick={onToggleExpand}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-lg bg-white/5 text-neon-blue">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-lg">{campaign.name}</h3>
            <p className="text-sm text-gray-400">{campaign.description}</p>
            <div className="flex items-center space-x-2 mt-1">
              <Calendar className="w-3 h-3 text-gray-500" />
              <span className="text-xs text-gray-500">
                {new Date(campaign.startDate).toLocaleDateString()} - {new Date(campaign.endDate).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span
            className={`px-3 py-1 text-xs font-medium rounded-full border ${config.bg} ${config.border} ${config.color} ${config.pulse}`}
          >
            <StatusIcon className="w-3 h-3 inline mr-1" />
            {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
          </span>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreVertical className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1 mb-1">
            <DollarSign className="w-4 h-4 text-neon-green" />
            <span className="text-lg font-bold text-neon-green">{campaign.roi > 0 ? `${campaign.roi}%` : "N/A"}</span>
          </div>
          <p className="text-xs text-gray-400">ROI</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1 mb-1">
            <Eye className="w-4 h-4 text-neon-blue" />
            <span className="text-lg font-bold text-neon-blue">
              {campaign.impressions > 0 ? `${(campaign.impressions / 1000).toFixed(0)}K` : "0"}
            </span>
          </div>
          <p className="text-xs text-gray-400">Impressions</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1 mb-1">
            <MousePointer className="w-4 h-4 text-neon-purple" />
            <span className="text-lg font-bold text-neon-purple">
              {campaign.clicks > 0 ? campaign.clicks.toLocaleString() : "0"}
            </span>
          </div>
          <p className="text-xs text-gray-400">Clicks</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1 mb-1">
            <Target className="w-4 h-4 text-neon-pink" />
            <span className="text-lg font-bold text-neon-pink">
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
            ${campaign.spent.toLocaleString()} / ${campaign.budget.toLocaleString()} ({budgetUsage.toFixed(1)}%)
          </span>
        </div>
        <div className="neon-progress h-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${budgetUsage}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`h-2 rounded-full ${
              budgetUsage > 90
                ? "bg-gradient-to-r from-neon-pink to-red-500"
                : budgetUsage > 70
                  ? "bg-gradient-to-r from-yellow-400 to-neon-green"
                  : "bg-gradient-to-r from-neon-blue to-neon-purple"
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
                className="px-2 py-1 text-xs bg-neon-blue/20 text-neon-blue rounded-full border border-neon-blue/30"
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

        {isPositiveROI && campaign.roi > 200 && (
          <div className="flex items-center space-x-1 text-neon-green">
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
              <div className="text-center glass p-3 rounded-lg">
                <p className="text-lg font-bold text-neon-green">{campaign.openRate}%</p>
                <p className="text-xs text-gray-400">Open Rate</p>
              </div>
              <div className="text-center glass p-3 rounded-lg">
                <p className="text-lg font-bold text-neon-blue">{campaign.clickRate}%</p>
                <p className="text-xs text-gray-400">Click Rate</p>
              </div>
              <div className="text-center glass p-3 rounded-lg">
                <p className="text-lg font-bold text-neon-purple">{campaign.conversionRate}%</p>
                <p className="text-xs text-gray-400">Conversion Rate</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 btn-neon text-sm py-2"
                onClick={(e) => e.stopPropagation()}
              >
                {campaign.status === "active" ? "Pause Campaign" : "Resume Campaign"}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 glass border border-white/10 text-sm py-2 rounded-lg text-gray-400 hover:text-white"
                onClick={(e) => e.stopPropagation()}
              >
                Edit Campaign
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 glass border border-white/10 text-sm py-2 rounded-lg text-gray-400 hover:text-white"
                onClick={(e) => e.stopPropagation()}
              >
                View Analytics
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

interface CampaignTimelineProps {
  campaigns: typeof mockCampaigns
}

function CampaignTimeline({ campaigns }: CampaignTimelineProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const checkScrollButtons = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
    }
  }

  useEffect(() => {
    checkScrollButtons()
    const handleResize = () => checkScrollButtons()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 300
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      })
    }
  }

  const milestoneStatusConfig = {
    completed: { color: "text-neon-green", bg: "bg-neon-green/20", icon: CheckCircle },
    active: { color: "text-neon-blue", bg: "bg-neon-blue/20", icon: Zap },
    pending: { color: "text-gray-400", bg: "bg-gray-500/20", icon: Clock },
    paused: { color: "text-yellow-400", bg: "bg-yellow-400/20", icon: Pause },
  }

  return (
    <div className="glassmorphism-effect p-6 rounded-lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gradient">Campaign Timeline</h2>
        <div className="flex items-center space-x-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            className="p-2 rounded-lg glass border border-white/10 text-gray-400 hover:text-white disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            className="p-2 rounded-lg glass border border-white/10 text-gray-400 hover:text-white disabled:opacity-50"
          >
            <ChevronRight className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      <div
        ref={scrollRef}
        onScroll={checkScrollButtons}
        className="overflow-x-auto scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <div className="flex space-x-6 pb-4" style={{ minWidth: "max-content" }}>
          {campaigns.map((campaign) => (
            <div key={campaign.id} className="flex-shrink-0 w-80">
              <div className="glass p-4 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-white">{campaign.name}</h3>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      campaign.status === "active"
                        ? "bg-neon-green/20 text-neon-green"
                        : campaign.status === "paused"
                          ? "bg-yellow-400/20 text-yellow-400"
                          : "bg-neon-blue/20 text-neon-blue"
                    }`}
                  >
                    {campaign.status}
                  </span>
                </div>

                <div className="space-y-3">
                  {campaign.milestones.map((milestone, index) => {
                    const config = milestoneStatusConfig[milestone.status]
                    const Icon = config.icon

                    return (
                      <div key={milestone.id} className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${config.bg} ${config.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-white">{milestone.name}</span>
                            <span className="text-xs text-gray-400">{milestone.progress}%</span>
                          </div>
                          <div className="neon-progress h-1">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${milestone.progress}%` }}
                              transition={{ duration: 1, ease: "easeOut", delay: index * 0.1 }}
                              className="bg-gradient-to-r from-neon-blue to-neon-purple h-1 rounded-full"
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

interface ABTestViewerProps {
  campaigns: typeof mockCampaigns
}

function ABTestViewer({ campaigns }: ABTestViewerProps) {
  const [selectedTest, setSelectedTest] = useState<string | null>(null)

  const allTests = campaigns.flatMap((campaign) =>
    campaign.abTests.map((test) => ({ ...test, campaignName: campaign.name, campaignId: campaign.id })),
  )

  const selectedTestData = allTests.find((test) => test.id === selectedTest)

  return (
    <div className="glassmorphism-effect p-6 rounded-lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gradient">A/B Test Results</h2>
        <div className="flex items-center space-x-2">
          <BarChart3 className="w-5 h-5 text-neon-purple" />
          <span className="text-sm text-gray-400">{allTests.length} active tests</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Test List */}
        <div className="lg:col-span-1 space-y-3">
          {allTests.map((test) => (
            <motion.div
              key={test.id}
              whileHover={{ scale: 1.02 }}
              onClick={() => setSelectedTest(test.id)}
              className={`glass p-4 rounded-lg cursor-pointer transition-all ${
                selectedTest === test.id ? "border-neon-blue/50 glow-border" : "hover:border-neon-blue/30"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-white text-sm">{test.name}</h3>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    test.confidence >= 95
                      ? "bg-neon-green/20 text-neon-green"
                      : test.confidence >= 80
                        ? "bg-yellow-400/20 text-yellow-400"
                        : "bg-neon-pink/20 text-neon-pink"
                  }`}
                >
                  {test.confidence}%
                </span>
              </div>
              <p className="text-xs text-gray-400 mb-2">{test.campaignName}</p>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">Winner:</span>
                <span className="text-xs font-medium text-neon-green">Variant {test.winner}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Test Details */}
        <div className="lg:col-span-2">
          {selectedTestData ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="glass p-4 rounded-lg">
                <h3 className="text-lg font-bold text-white mb-2">{selectedTestData.name}</h3>
                <p className="text-sm text-gray-400 mb-4">Campaign: {selectedTestData.campaignName}</p>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-400">Confidence Level:</span>
                    <span
                      className={`text-sm font-bold ${
                        selectedTestData.confidence >= 95
                          ? "text-neon-green"
                          : selectedTestData.confidence >= 80
                            ? "text-yellow-400"
                            : "text-neon-pink"
                      }`}
                    >
                      {selectedTestData.confidence}%
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-400">Winner:</span>
                    <span className="text-sm font-bold text-neon-green">Variant {selectedTestData.winner}</span>
                  </div>
                </div>
              </div>

              {/* Comparison Charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Variant A */}
                <div className="glass p-4 rounded-lg">
                  <h4 className="font-medium text-white mb-4">{selectedTestData.variantA.name}</h4>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">Open Rate</span>
                        <span className="text-sm font-bold text-neon-blue">{selectedTestData.variantA.openRate}%</span>
                      </div>
                      <div className="neon-progress h-2">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${selectedTestData.variantA.openRate}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="bg-gradient-to-r from-neon-blue to-neon-purple h-2 rounded-full"
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">Click Rate</span>
                        <span className="text-sm font-bold text-neon-green">
                          {selectedTestData.variantA.clickRate}%
                        </span>
                      </div>
                      <div className="neon-progress h-2">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${selectedTestData.variantA.clickRate}%` }}
                          transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                          className="bg-gradient-to-r from-neon-green to-neon-blue h-2 rounded-full"
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">Conversions</span>
                        <span className="text-sm font-bold text-neon-pink">
                          {selectedTestData.variantA.conversions}
                        </span>
                      </div>
                      <div className="neon-progress h-2">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{
                            width: `${
                              (selectedTestData.variantA.conversions /
                                Math.max(
                                  selectedTestData.variantA.conversions,
                                  selectedTestData.variantB.conversions,
                                )) *
                              100
                            }%`,
                          }}
                          transition={{ duration: 1, ease: "easeOut", delay: 0.4 }}
                          className="bg-gradient-to-r from-neon-pink to-neon-purple h-2 rounded-full"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Variant B */}
                <div className="glass p-4 rounded-lg">
                  <h4 className="font-medium text-white mb-4">{selectedTestData.variantB.name}</h4>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">Open Rate</span>
                        <span className="text-sm font-bold text-neon-blue">{selectedTestData.variantB.openRate}%</span>
                      </div>
                      <div className="neon-progress h-2">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${selectedTestData.variantB.openRate}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="bg-gradient-to-r from-neon-blue to-neon-purple h-2 rounded-full"
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">Click Rate</span>
                        <span className="text-sm font-bold text-neon-green">
                          {selectedTestData.variantB.clickRate}%
                        </span>
                      </div>
                      <div className="neon-progress h-2">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${selectedTestData.variantB.clickRate}%` }}
                          transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                          className="bg-gradient-to-r from-neon-green to-neon-blue h-2 rounded-full"
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">Conversions</span>
                        <span className="text-sm font-bold text-neon-pink">
                          {selectedTestData.variantB.conversions}
                        </span>
                      </div>
                      <div className="neon-progress h-2">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{
                            width: `${
                              (selectedTestData.variantB.conversions /
                                Math.max(
                                  selectedTestData.variantA.conversions,
                                  selectedTestData.variantB.conversions,
                                )) *
                              100
                            }%`,
                          }}
                          transition={{ duration: 1, ease: "easeOut", delay: 0.4 }}
                          className="bg-gradient-to-r from-neon-pink to-neon-purple h-2 rounded-full"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="glass p-8 rounded-lg text-center">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">Select an A/B Test</h3>
              <p className="text-gray-400">Choose a test from the list to view detailed comparison results</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function CampaignsPage() {
  const [statusFilter, setStatusFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedCard, setExpandedCard] = useState<string | null>(null)

  const filteredCampaigns = mockCampaigns.filter((campaign) => {
    const matchesStatus = statusFilter === "all" || campaign.status === statusFilter
    const matchesSearch =
      campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      campaign.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const actions = (
    <div className="flex items-center space-x-3">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="btn-neon text-sm flex items-center space-x-2"
      >
        <Plus className="w-4 h-4" />
        <span>New Campaign</span>
      </motion.button>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="glass border border-white/10 p-2 rounded-lg text-gray-400 hover:text-white"
      >
        <Filter className="w-5 h-5" />
      </motion.button>
    </div>
  )

  return (
    <PageLayout
      title="Campaign Management"
      subtitle="Monitor, optimize, and analyze your marketing campaigns"
      actions={actions}
    >
      <div className="space-y-8">
        {/* Filter Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search campaigns by name or description..."
              className="w-full glass border border-white/10 rounded-lg bg-transparent py-3 pl-10 pr-4 text-white placeholder-gray-400 focus:border-neon-blue/50 focus:outline-none"
            />
          </div>

          <div className="flex space-x-1 glass p-1 rounded-lg">
            {["all", "active", "paused", "draft", "completed"].map((status) => (
              <motion.button
                key={status}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  statusFilter === status
                    ? "bg-neon-blue/20 text-neon-blue border border-neon-blue/30"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
                <span className="ml-2 text-xs opacity-60">
                  {status === "all" ? mockCampaigns.length : mockCampaigns.filter((c) => c.status === status).length}
                </span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Campaign Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {filteredCampaigns.map((campaign, index) => (
            <motion.div
              key={campaign.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
            >
              <CampaignCard
                campaign={campaign}
                isExpanded={expandedCard === campaign.id}
                onToggleExpand={() => setExpandedCard(expandedCard === campaign.id ? null : campaign.id)}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* Campaign Timeline */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <CampaignTimeline campaigns={filteredCampaigns} />
        </motion.div>

        {/* A/B Test Results */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <ABTestViewer campaigns={filteredCampaigns} />
        </motion.div>
      </div>
    </PageLayout>
  )
}
