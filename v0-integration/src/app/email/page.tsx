"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState } from "react"
import {
  Mail,
  Users,
  BarChart3,
  Settings,
  Plus,
  Search,
  Clock,
  Eye,
  MousePointer,
  TrendingUp,
  TrendingDown,
  Target,
  Bot,
  Edit,
  Copy,
  Trash2,
  Play,
  Pause,
  CheckCircle,
  AlertCircle,
  FileText,
  Globe,
  Shield,
  Activity,
  Workflow,
  Split,
  UserCheck,
  Bell,
  Star,
} from "lucide-react"
import PageLayout from "@/components/page-layout"

// Enhanced mock data with comprehensive email marketing features
const mockCampaigns = [
  {
    id: "email-001",
    name: "Summer Product Launch Newsletter",
    type: "newsletter" as const,
    status: "sent" as const,
    created: "2024-06-28T10:30:00Z",
    sent: "2024-06-28T14:00:00Z",
    subject: "🌟 Introducing Our Revolutionary Summer Collection",
    preheader: "Get ready for the hottest trends of the season",
    fromName: "NeonHub Team",
    fromEmail: "hello@neonhub.ai",
    replyTo: "support@neonhub.ai",
    template: "modern-newsletter",
    segments: ["VIP Customers", "Product Enthusiasts"],
    totalRecipients: 15420,
    delivered: 15234,
    opened: 4567,
    clicked: 892,
    unsubscribed: 23,
    bounced: 186,
    complained: 5,
    openRate: 29.97,
    clickRate: 5.85,
    unsubscribeRate: 0.15,
    bounceRate: 1.21,
    complaintRate: 0.03,
    deliverabilityScore: 98.2,
    engagementScore: 8.7,
    revenue: 12450,
    conversions: 156,
    conversionRate: 17.48,
    aiOptimized: true,
    abTest: {
      enabled: true,
      variants: [
        { name: "Variant A", subject: "🌟 Introducing Our Revolutionary Summer Collection", openRate: 28.5 },
        { name: "Variant B", subject: "Your Summer Style Upgrade is Here", openRate: 31.4 },
      ],
      winner: "B",
      confidence: 95,
    },
    automation: null,
    tags: ["Product Launch", "Summer", "Newsletter"],
    devices: {
      desktop: 45.2,
      mobile: 48.7,
      tablet: 6.1,
    },
    locations: {
      "United States": 42.3,
      "United Kingdom": 18.7,
      Canada: 12.4,
      Australia: 8.9,
      Other: 17.7,
    },
    timeAnalytics: {
      bestSendTime: "Tuesday 10:00 AM",
      peakEngagement: "Tuesday 2:00 PM",
      avgReadTime: "2m 34s",
    },
  },
  {
    id: "email-002",
    name: "Welcome Series - Onboarding Flow",
    type: "automation" as const,
    status: "active" as const,
    created: "2024-06-15T09:00:00Z",
    subject: "Welcome to NeonHub! Let's get you started 🚀",
    preheader: "Your journey to AI-powered marketing begins now",
    fromName: "Sarah from NeonHub",
    fromEmail: "sarah@neonhub.ai",
    replyTo: "sarah@neonhub.ai",
    template: "welcome-series",
    segments: ["New Subscribers"],
    totalRecipients: 2340,
    delivered: 2298,
    opened: 1456,
    clicked: 567,
    unsubscribed: 12,
    bounced: 42,
    complained: 2,
    openRate: 63.4,
    clickRate: 24.7,
    unsubscribeRate: 0.52,
    bounceRate: 1.83,
    complaintRate: 0.09,
    deliverabilityScore: 97.8,
    engagementScore: 9.2,
    revenue: 8900,
    conversions: 234,
    conversionRate: 41.27,
    aiOptimized: true,
    abTest: null,
    automation: {
      trigger: "subscription",
      steps: 5,
      activeSubscribers: 1890,
      completionRate: 78.4,
      avgTimeToComplete: "7 days",
    },
    tags: ["Welcome", "Onboarding", "Automation"],
    devices: {
      desktop: 38.9,
      mobile: 55.2,
      tablet: 5.9,
    },
    locations: {
      "United States": 48.7,
      "United Kingdom": 15.3,
      Canada: 11.8,
      Germany: 7.2,
      Other: 17.0,
    },
    timeAnalytics: {
      bestSendTime: "Monday 9:00 AM",
      peakEngagement: "Monday 11:30 AM",
      avgReadTime: "3m 12s",
    },
  },
  {
    id: "email-003",
    name: "Cart Abandonment Recovery",
    type: "automation" as const,
    status: "active" as const,
    created: "2024-06-20T16:45:00Z",
    subject: "You left something behind... 🛒",
    preheader: "Complete your purchase and save 10%",
    fromName: "NeonHub Store",
    fromEmail: "store@neonhub.ai",
    replyTo: "support@neonhub.ai",
    template: "cart-recovery",
    segments: ["Cart Abandoners"],
    totalRecipients: 890,
    delivered: 867,
    opened: 423,
    clicked: 189,
    unsubscribed: 8,
    bounced: 23,
    complained: 1,
    openRate: 48.8,
    clickRate: 21.8,
    unsubscribeRate: 0.92,
    bounceRate: 2.65,
    complaintRate: 0.12,
    deliverabilityScore: 96.5,
    engagementScore: 8.9,
    revenue: 15670,
    conversions: 89,
    conversionRate: 47.09,
    aiOptimized: true,
    abTest: null,
    automation: {
      trigger: "cart_abandonment",
      steps: 3,
      activeSubscribers: 456,
      completionRate: 67.8,
      avgTimeToComplete: "3 days",
    },
    tags: ["E-commerce", "Recovery", "Automation"],
    devices: {
      desktop: 52.1,
      mobile: 42.3,
      tablet: 5.6,
    },
    locations: {
      "United States": 51.2,
      "United Kingdom": 16.8,
      Canada: 10.4,
      Australia: 8.9,
      Other: 12.7,
    },
    timeAnalytics: {
      bestSendTime: "Thursday 3:00 PM",
      peakEngagement: "Thursday 6:00 PM",
      avgReadTime: "1m 47s",
    },
  },
  {
    id: "email-004",
    name: "Monthly Feature Update",
    type: "newsletter" as const,
    status: "scheduled" as const,
    created: "2024-06-29T11:20:00Z",
    scheduledFor: "2024-07-01T10:00:00Z",
    subject: "July Updates: New AI Features & Improvements",
    preheader: "See what's new in your favorite marketing platform",
    fromName: "NeonHub Product Team",
    fromEmail: "product@neonhub.ai",
    replyTo: "feedback@neonhub.ai",
    template: "feature-update",
    segments: ["Active Users", "Beta Testers"],
    totalRecipients: 8750,
    delivered: 0,
    opened: 0,
    clicked: 0,
    unsubscribed: 0,
    bounced: 0,
    complained: 0,
    openRate: 0,
    clickRate: 0,
    unsubscribeRate: 0,
    bounceRate: 0,
    complaintRate: 0,
    deliverabilityScore: 0,
    engagementScore: 0,
    revenue: 0,
    conversions: 0,
    conversionRate: 0,
    aiOptimized: true,
    abTest: {
      enabled: true,
      variants: [
        { name: "Variant A", subject: "July Updates: New AI Features & Improvements", openRate: 0 },
        { name: "Variant B", subject: "🚀 Exciting July Updates Inside!", openRate: 0 },
      ],
      winner: null,
      confidence: 0,
    },
    automation: null,
    tags: ["Product Updates", "Features", "Newsletter"],
    devices: {
      desktop: 0,
      mobile: 0,
      tablet: 0,
    },
    locations: {},
    timeAnalytics: {
      bestSendTime: "Tuesday 10:00 AM",
      peakEngagement: "N/A",
      avgReadTime: "N/A",
    },
  },
  {
    id: "email-005",
    name: "Re-engagement Campaign",
    type: "campaign" as const,
    status: "draft" as const,
    created: "2024-06-27T14:15:00Z",
    subject: "We miss you! Here's 20% off to come back",
    preheader: "Exclusive offer for our valued customers",
    fromName: "NeonHub Team",
    fromEmail: "hello@neonhub.ai",
    replyTo: "support@neonhub.ai",
    template: "re-engagement",
    segments: ["Inactive Users"],
    totalRecipients: 3450,
    delivered: 0,
    opened: 0,
    clicked: 0,
    unsubscribed: 0,
    bounced: 0,
    complained: 0,
    openRate: 0,
    clickRate: 0,
    unsubscribeRate: 0,
    bounceRate: 0,
    complaintRate: 0,
    deliverabilityScore: 0,
    engagementScore: 0,
    revenue: 0,
    conversions: 0,
    conversionRate: 0,
    aiOptimized: false,
    abTest: null,
    automation: null,
    tags: ["Re-engagement", "Discount", "Campaign"],
    devices: {
      desktop: 0,
      mobile: 0,
      tablet: 0,
    },
    locations: {},
    timeAnalytics: {
      bestSendTime: "N/A",
      peakEngagement: "N/A",
      avgReadTime: "N/A",
    },
  },
]

const mockSegments = [
  {
    id: "segment-001",
    name: "VIP Customers",
    description: "High-value customers with 5+ purchases",
    count: 2340,
    criteria: {
      totalPurchases: { operator: ">=", value: 5 },
      totalSpent: { operator: ">=", value: 1000 },
      lastPurchase: { operator: "<=", value: "30 days" },
    },
    growth: 12.5,
    engagementRate: 34.7,
    avgOrderValue: 245,
    tags: ["High Value", "Loyal"],
    created: "2024-05-15T10:00:00Z",
    lastUpdated: "2024-06-28T15:30:00Z",
  },
  {
    id: "segment-002",
    name: "New Subscribers",
    description: "Users who subscribed in the last 30 days",
    count: 1890,
    criteria: {
      subscriptionDate: { operator: ">=", value: "30 days ago" },
      emailEngagement: { operator: ">=", value: 0 },
    },
    growth: 45.2,
    engagementRate: 67.3,
    avgOrderValue: 89,
    tags: ["New", "Onboarding"],
    created: "2024-06-01T09:00:00Z",
    lastUpdated: "2024-06-29T08:45:00Z",
  },
  {
    id: "segment-003",
    name: "Cart Abandoners",
    description: "Users with abandoned carts in last 7 days",
    count: 567,
    criteria: {
      cartAbandonment: { operator: ">=", value: "7 days ago" },
      purchaseCompleted: { operator: "=", value: false },
    },
    growth: -8.3,
    engagementRate: 28.9,
    avgOrderValue: 156,
    tags: ["E-commerce", "Recovery"],
    created: "2024-06-10T14:20:00Z",
    lastUpdated: "2024-06-29T12:15:00Z",
  },
  {
    id: "segment-004",
    name: "Product Enthusiasts",
    description: "Users highly engaged with product content",
    count: 4560,
    criteria: {
      productPageViews: { operator: ">=", value: 10 },
      emailClicks: { operator: ">=", value: 5 },
      lastActivity: { operator: "<=", value: "14 days" },
    },
    growth: 23.7,
    engagementRate: 42.1,
    avgOrderValue: 198,
    tags: ["Engaged", "Product"],
    created: "2024-05-20T11:30:00Z",
    lastUpdated: "2024-06-28T16:45:00Z",
  },
  {
    id: "segment-005",
    name: "Inactive Users",
    description: "No engagement in the last 90 days",
    count: 3450,
    criteria: {
      lastEmailOpen: { operator: ">=", value: "90 days ago" },
      lastPurchase: { operator: ">=", value: "90 days ago" },
    },
    growth: -15.6,
    engagementRate: 8.2,
    avgOrderValue: 67,
    tags: ["Inactive", "Re-engagement"],
    created: "2024-04-01T10:00:00Z",
    lastUpdated: "2024-06-29T09:30:00Z",
  },
]

const mockTemplates = [
  {
    id: "template-001",
    name: "Modern Newsletter",
    description: "Clean, modern design perfect for newsletters",
    category: "Newsletter",
    thumbnail: "/placeholder.svg?height=200&width=300&text=Modern+Newsletter",
    usage: 234,
    rating: 4.8,
    responsive: true,
    aiOptimized: true,
    tags: ["Newsletter", "Modern", "Clean"],
    lastUpdated: "2024-06-25T10:00:00Z",
  },
  {
    id: "template-002",
    name: "Welcome Series",
    description: "Engaging welcome email template",
    category: "Onboarding",
    thumbnail: "/placeholder.svg?height=200&width=300&text=Welcome+Series",
    usage: 189,
    rating: 4.9,
    responsive: true,
    aiOptimized: true,
    tags: ["Welcome", "Onboarding", "Series"],
    lastUpdated: "2024-06-20T14:30:00Z",
  },
  {
    id: "template-003",
    name: "Product Launch",
    description: "Eye-catching product announcement template",
    category: "Marketing",
    thumbnail: "/placeholder.svg?height=200&width=300&text=Product+Launch",
    usage: 156,
    rating: 4.7,
    responsive: true,
    aiOptimized: true,
    tags: ["Product", "Launch", "Marketing"],
    lastUpdated: "2024-06-18T09:15:00Z",
  },
  {
    id: "template-004",
    name: "Cart Recovery",
    description: "Effective abandoned cart recovery template",
    category: "E-commerce",
    thumbnail: "/placeholder.svg?height=200&width=300&text=Cart+Recovery",
    usage: 298,
    rating: 4.9,
    responsive: true,
    aiOptimized: true,
    tags: ["E-commerce", "Recovery", "Conversion"],
    lastUpdated: "2024-06-22T16:45:00Z",
  },
  {
    id: "template-005",
    name: "Event Invitation",
    description: "Professional event invitation template",
    category: "Events",
    thumbnail: "/placeholder.svg?height=200&width=300&text=Event+Invitation",
    usage: 87,
    rating: 4.6,
    responsive: true,
    aiOptimized: false,
    tags: ["Events", "Invitation", "Professional"],
    lastUpdated: "2024-06-15T11:20:00Z",
  },
  {
    id: "template-006",
    name: "Survey & Feedback",
    description: "Engaging survey and feedback collection template",
    category: "Feedback",
    thumbnail: "/placeholder.svg?height=200&width=300&text=Survey+Feedback",
    usage: 123,
    rating: 4.5,
    responsive: true,
    aiOptimized: true,
    tags: ["Survey", "Feedback", "Engagement"],
    lastUpdated: "2024-06-12T13:10:00Z",
  },
]

const mockAutomations = [
  {
    id: "automation-001",
    name: "Welcome Series",
    description: "5-email onboarding sequence for new subscribers",
    trigger: "subscription",
    status: "active" as const,
    subscribers: 1890,
    completionRate: 78.4,
    avgRevenue: 89,
    steps: [
      { id: "step-1", name: "Welcome Email", delay: "immediate", openRate: 67.3, clickRate: 23.4 },
      { id: "step-2", name: "Getting Started Guide", delay: "1 day", openRate: 54.2, clickRate: 18.7 },
      { id: "step-3", name: "Feature Highlights", delay: "3 days", openRate: 48.9, clickRate: 15.2 },
      { id: "step-4", name: "Success Stories", delay: "7 days", openRate: 42.1, clickRate: 12.8 },
      { id: "step-5", name: "Feedback Request", delay: "14 days", openRate: 38.7, clickRate: 9.4 },
    ],
    created: "2024-05-15T10:00:00Z",
    lastModified: "2024-06-20T14:30:00Z",
  },
  {
    id: "automation-002",
    name: "Cart Abandonment",
    description: "3-email sequence to recover abandoned carts",
    trigger: "cart_abandonment",
    status: "active" as const,
    subscribers: 456,
    completionRate: 67.8,
    avgRevenue: 156,
    steps: [
      { id: "step-1", name: "Gentle Reminder", delay: "1 hour", openRate: 52.3, clickRate: 24.1 },
      { id: "step-2", name: "Incentive Offer", delay: "24 hours", openRate: 38.7, clickRate: 19.8 },
      { id: "step-3", name: "Last Chance", delay: "72 hours", openRate: 28.4, clickRate: 15.6 },
    ],
    created: "2024-06-01T09:00:00Z",
    lastModified: "2024-06-25T11:15:00Z",
  },
  {
    id: "automation-003",
    name: "Post-Purchase Follow-up",
    description: "Thank you and review request sequence",
    trigger: "purchase",
    status: "active" as const,
    subscribers: 234,
    completionRate: 85.2,
    avgRevenue: 67,
    steps: [
      { id: "step-1", name: "Order Confirmation", delay: "immediate", openRate: 89.3, clickRate: 34.7 },
      { id: "step-2", name: "Shipping Update", delay: "1 day", openRate: 76.8, clickRate: 28.9 },
      { id: "step-3", name: "Delivery Confirmation", delay: "5 days", openRate: 68.4, clickRate: 22.1 },
      { id: "step-4", name: "Review Request", delay: "10 days", openRate: 54.2, clickRate: 18.7 },
    ],
    created: "2024-05-20T14:20:00Z",
    lastModified: "2024-06-18T16:45:00Z",
  },
  {
    id: "automation-004",
    name: "Re-engagement Campaign",
    description: "Win back inactive subscribers",
    trigger: "inactivity",
    status: "paused" as const,
    subscribers: 890,
    completionRate: 34.7,
    avgRevenue: 23,
    steps: [
      { id: "step-1", name: "We Miss You", delay: "90 days", openRate: 23.4, clickRate: 8.7 },
      { id: "step-2", name: "Special Offer", delay: "97 days", openRate: 18.9, clickRate: 6.2 },
      { id: "step-3", name: "Final Goodbye", delay: "104 days", openRate: 12.3, clickRate: 3.8 },
    ],
    created: "2024-04-10T11:30:00Z",
    lastModified: "2024-06-15T09:20:00Z",
  },
]

const mockDeliverabilityData = {
  overallScore: 98.2,
  reputation: {
    domain: 96.5,
    ip: 98.8,
    sender: 97.3,
  },
  authentication: {
    spf: "pass",
    dkim: "pass",
    dmarc: "pass",
  },
  listHealth: {
    bounceRate: 1.2,
    complaintRate: 0.03,
    unsubscribeRate: 0.15,
    engagementRate: 24.7,
  },
  recommendations: [
    {
      type: "warning",
      title: "Bounce Rate Slightly High",
      description: "Consider cleaning your email list to improve deliverability",
      impact: "medium",
    },
    {
      type: "success",
      title: "Excellent Authentication",
      description: "All authentication protocols are properly configured",
      impact: "high",
    },
    {
      type: "info",
      title: "Engagement Optimization",
      description: "Try A/B testing subject lines to improve open rates",
      impact: "low",
    },
  ],
}

interface CampaignCardProps {
  campaign: (typeof mockCampaigns)[0]
  isSelected: boolean
  onSelect: () => void
  onEdit: () => void
  onDuplicate: () => void
  onDelete: () => void
}

function CampaignCard({ campaign, isSelected, onSelect, onEdit, onDuplicate, onDelete }: CampaignCardProps) {
  const [showActions, setShowActions] = useState(false)

  const statusConfig = {
    sent: { color: "text-neon-green", bg: "bg-neon-green/20", border: "border-neon-green/30", icon: CheckCircle },
    active: { color: "text-neon-blue", bg: "bg-neon-blue/20", border: "border-neon-blue/30", icon: Activity },
    scheduled: { color: "text-neon-purple", bg: "bg-neon-purple/20", border: "border-neon-purple/30", icon: Clock },
    draft: { color: "text-gray-400", bg: "bg-gray-500/20", border: "border-gray-500/30", icon: Edit },
    paused: { color: "text-yellow-400", bg: "bg-yellow-400/20", border: "border-yellow-400/30", icon: Pause },
  }

  const typeConfig = {
    newsletter: { icon: Mail, color: "text-neon-blue" },
    automation: { icon: Workflow, color: "text-neon-purple" },
    campaign: { icon: Target, color: "text-neon-pink" },
  }

  const config = statusConfig[campaign.status]
  const typeConf = typeConfig[campaign.type]
  const StatusIcon = config.icon
  const TypeIcon = typeConf.icon

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      onClick={onSelect}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      className={`glassmorphism-effect p-6 rounded-lg cursor-pointer transition-all duration-300 relative ${
        isSelected ? "glow-border shadow-neon-blue/20" : "hover:border-neon-blue/30"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg bg-white/5 ${typeConf.color}`}>
            <TypeIcon className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-white text-lg leading-tight">{campaign.name}</h3>
            <p className="text-sm text-gray-400 mt-1">{campaign.subject}</p>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-xs text-gray-500">{campaign.type}</span>
              <span className="text-xs text-gray-500">•</span>
              <span className="text-xs text-gray-500">{campaign.totalRecipients.toLocaleString()} recipients</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full border ${config.bg} ${config.border} ${config.color} flex items-center space-x-1`}
          >
            <StatusIcon className="w-3 h-3" />
            <span>{campaign.status}</span>
          </span>

          <AnimatePresence>
            {showActions && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center space-x-1"
              >
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit()
                  }}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-neon-blue"
                >
                  <Edit className="w-3.5 h-3.5" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation()
                    onDuplicate()
                  }}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-neon-purple"
                >
                  <Copy className="w-3.5 h-3.5" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete()
                  }}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-neon-pink"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Performance Metrics */}
      {campaign.status === "sent" && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="glass p-2 rounded-lg text-center">
            <div className="flex items-center justify-center space-x-1">
              <Eye className="w-3 h-3 text-neon-blue" />
              <span className="text-sm font-bold text-neon-blue">{campaign.openRate.toFixed(1)}%</span>
            </div>
            <p className="text-xs text-gray-400">Open Rate</p>
          </div>
          <div className="glass p-2 rounded-lg text-center">
            <div className="flex items-center justify-center space-x-1">
              <MousePointer className="w-3 h-3 text-neon-purple" />
              <span className="text-sm font-bold text-neon-purple">{campaign.clickRate.toFixed(1)}%</span>
            </div>
            <p className="text-xs text-gray-400">Click Rate</p>
          </div>
          <div className="glass p-2 rounded-lg text-center">
            <div className="flex items-center justify-center space-x-1">
              <Target className="w-3 h-3 text-neon-green" />
              <span className="text-sm font-bold text-neon-green">{campaign.conversions}</span>
            </div>
            <p className="text-xs text-gray-400">Conversions</p>
          </div>
          <div className="glass p-2 rounded-lg text-center">
            <div className="flex items-center justify-center space-x-1">
              <TrendingUp className="w-3 h-3 text-neon-pink" />
              <span className="text-sm font-bold text-neon-pink">${campaign.revenue.toLocaleString()}</span>
            </div>
            <p className="text-xs text-gray-400">Revenue</p>
          </div>
        </div>
      )}

      {/* Automation Info */}
      {campaign.automation && (
        <div className="glass p-3 rounded-lg mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Workflow className="w-4 h-4 text-neon-purple" />
              <span className="text-sm font-medium text-white">Automation Active</span>
            </div>
            <span className="text-xs text-neon-purple">{campaign.automation.steps} steps</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-gray-400">Active Subscribers:</span>
              <span className="text-white ml-1">{campaign.automation.activeSubscribers}</span>
            </div>
            <div>
              <span className="text-gray-400">Completion Rate:</span>
              <span className="text-neon-green ml-1">{campaign.automation.completionRate}%</span>
            </div>
          </div>
        </div>
      )}

      {/* A/B Test Info */}
      {campaign.abTest?.enabled && (
        <div className="glass p-3 rounded-lg mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Split className="w-4 h-4 text-neon-blue" />
              <span className="text-sm font-medium text-white">A/B Test</span>
            </div>
            {campaign.abTest.winner && (
              <span className="text-xs text-neon-green">Winner: {campaign.abTest.winner}</span>
            )}
          </div>
          <div className="text-xs text-gray-400">
            {campaign.abTest.confidence > 0 && <span>Confidence: {campaign.abTest.confidence}%</span>}
          </div>
        </div>
      )}

      {/* Tags */}
      <div className="flex flex-wrap gap-1 mb-4">
        {campaign.tags.slice(0, 3).map((tag, index) => (
          <span
            key={index}
            className="px-2 py-1 text-xs bg-neon-blue/20 text-neon-blue rounded-full border border-neon-blue/30"
          >
            {tag}
          </span>
        ))}
        {campaign.tags.length > 3 && (
          <span className="px-2 py-1 text-xs bg-gray-500/20 text-gray-400 rounded-full border border-gray-500/30">
            +{campaign.tags.length - 3}
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {campaign.aiOptimized && (
            <div className="flex items-center space-x-1">
              <Bot className="w-3 h-3 text-neon-purple" />
              <span className="text-xs text-neon-purple">AI Optimized</span>
            </div>
          )}
          <div className="flex items-center space-x-1">
            <Shield className="w-3 h-3 text-neon-green" />
            <span className="text-xs text-neon-green">{campaign.deliverabilityScore.toFixed(1)}%</span>
          </div>
        </div>

        <div className="text-xs text-gray-400">
          {campaign.status === "scheduled" && campaign.scheduledFor
            ? `Scheduled: ${new Date(campaign.scheduledFor).toLocaleDateString()}`
            : campaign.sent
              ? `Sent: ${new Date(campaign.sent).toLocaleDateString()}`
              : `Created: ${new Date(campaign.created).toLocaleDateString()}`}
        </div>
      </div>
    </motion.div>
  )
}

interface SegmentCardProps {
  segment: (typeof mockSegments)[0]
  onEdit: () => void
  onDelete: () => void
}

function SegmentCard({ segment, onEdit, onDelete }: SegmentCardProps) {
  const [showActions, setShowActions] = useState(false)
  const isGrowing = segment.growth > 0

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      className="glassmorphism-effect p-6 rounded-lg hover:border-neon-blue/30 transition-all duration-300 relative"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-neon-blue/20 text-neon-blue">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-lg">{segment.name}</h3>
            <p className="text-sm text-gray-400">{segment.description}</p>
          </div>
        </div>

        <AnimatePresence>
          {showActions && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center space-x-1"
            >
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onEdit}
                className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-neon-blue"
              >
                <Edit className="w-3.5 h-3.5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onDelete}
                className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-neon-pink"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1 mb-1">
            <Users className="w-4 h-4 text-neon-blue" />
            <span className="text-2xl font-bold text-neon-blue">{segment.count.toLocaleString()}</span>
          </div>
          <p className="text-xs text-gray-400">Subscribers</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1 mb-1">
            {isGrowing ? (
              <TrendingUp className="w-4 h-4 text-neon-green" />
            ) : (
              <TrendingDown className="w-4 h-4 text-neon-pink" />
            )}
            <span className={`text-2xl font-bold ${isGrowing ? "text-neon-green" : "text-neon-pink"}`}>
              {Math.abs(segment.growth).toFixed(1)}%
            </span>
          </div>
          <p className="text-xs text-gray-400">Growth</p>
        </div>
      </div>

      {/* Engagement & AOV */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="glass p-2 rounded-lg text-center">
          <span className="text-sm font-bold text-neon-purple">{segment.engagementRate}%</span>
          <p className="text-xs text-gray-400">Engagement</p>
        </div>
        <div className="glass p-2 rounded-lg text-center">
          <span className="text-sm font-bold text-neon-green">${segment.avgOrderValue}</span>
          <p className="text-xs text-gray-400">Avg Order</p>
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1 mb-4">
        {segment.tags.map((tag, index) => (
          <span
            key={index}
            className="px-2 py-1 text-xs bg-neon-purple/20 text-neon-purple rounded-full border border-neon-purple/30"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Footer */}
      <div className="text-xs text-gray-400">Last updated: {new Date(segment.lastUpdated).toLocaleDateString()}</div>
    </motion.div>
  )
}

interface TemplateCardProps {
  template: (typeof mockTemplates)[0]
  onSelect: () => void
  onPreview: () => void
}

function TemplateCard({ template, onSelect, onPreview }: TemplateCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      className="glassmorphism-effect rounded-lg overflow-hidden hover:border-neon-blue/30 transition-all duration-300"
    >
      {/* Template Preview */}
      <div className="relative">
        <img
          src={template.thumbnail || "/placeholder.svg"}
          alt={template.name}
          className="w-full h-40 object-cover"
          onError={(e) => {
            e.currentTarget.src = "/placeholder.svg?height=160&width=300&text=" + encodeURIComponent(template.name)
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute top-2 right-2 flex items-center space-x-1">
          {template.responsive && (
            <span className="px-2 py-1 text-xs bg-neon-blue/20 text-neon-blue rounded-full border border-neon-blue/30">
              Responsive
            </span>
          )}
          {template.aiOptimized && (
            <span className="px-2 py-1 text-xs bg-neon-purple/20 text-neon-purple rounded-full border border-neon-purple/30">
              AI
            </span>
          )}
        </div>
        <div className="absolute bottom-2 left-2">
          <div className="flex items-center space-x-1">
            <Star className="w-3 h-3 text-yellow-400 fill-current" />
            <span className="text-xs text-white">{template.rating}</span>
          </div>
        </div>
      </div>

      {/* Template Info */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-semibold text-white">{template.name}</h3>
            <p className="text-sm text-gray-400">{template.category}</p>
          </div>
          <span className="text-xs text-gray-500">{template.usage} uses</span>
        </div>

        <p className="text-sm text-gray-300 mb-3">{template.description}</p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-4">
          {template.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 text-xs bg-neon-green/20 text-neon-green rounded-full border border-neon-green/30"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Actions */}
        <div className="flex space-x-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onPreview}
            className="flex-1 glass border border-white/10 text-sm py-2 rounded-lg text-gray-400 hover:text-white transition-colors"
          >
            <Eye className="w-4 h-4 mx-auto" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onSelect}
            className="flex-1 btn-neon text-sm py-2"
          >
            Use Template
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}

interface AutomationCardProps {
  automation: (typeof mockAutomations)[0]
  onEdit: () => void
  onToggle: () => void
  onAnalyze: () => void
}

function AutomationCard({ automation, onEdit, onToggle, onAnalyze }: AutomationCardProps) {
  const statusConfig = {
    active: { color: "text-neon-green", bg: "bg-neon-green/20", border: "border-neon-green/30", icon: Play },
    paused: { color: "text-yellow-400", bg: "bg-yellow-400/20", border: "border-yellow-400/30", icon: Pause },
    draft: { color: "text-gray-400", bg: "bg-gray-500/20", border: "border-gray-500/30", icon: Edit },
  }

  const config = statusConfig[automation.status]
  const StatusIcon = config.icon

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      className="glassmorphism-effect p-6 rounded-lg hover:border-neon-blue/30 transition-all duration-300"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-neon-purple/20 text-neon-purple">
            <Workflow className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-lg">{automation.name}</h3>
            <p className="text-sm text-gray-400">{automation.description}</p>
          </div>
        </div>

        <span
          className={`px-2 py-1 text-xs font-medium rounded-full border ${config.bg} ${config.border} ${config.color} flex items-center space-x-1`}
        >
          <StatusIcon className="w-3 h-3" />
          <span>{automation.status}</span>
        </span>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1 mb-1">
            <Users className="w-4 h-4 text-neon-blue" />
            <span className="text-lg font-bold text-neon-blue">{automation.subscribers}</span>
          </div>
          <p className="text-xs text-gray-400">Subscribers</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1 mb-1">
            <CheckCircle className="w-4 h-4 text-neon-green" />
            <span className="text-lg font-bold text-neon-green">{automation.completionRate}%</span>
          </div>
          <p className="text-xs text-gray-400">Completion</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1 mb-1">
            <TrendingUp className="w-4 h-4 text-neon-pink" />
            <span className="text-lg font-bold text-neon-pink">${automation.avgRevenue}</span>
          </div>
          <p className="text-xs text-gray-400">Avg Revenue</p>
        </div>
      </div>

      {/* Steps Preview */}
      <div className="glass p-3 rounded-lg mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-white">Automation Steps</span>
          <span className="text-xs text-gray-400">{automation.steps.length} steps</span>
        </div>
        <div className="space-y-2">
          {automation.steps.slice(0, 3).map((step, index) => (
            <div key={step.id} className="flex items-center justify-between text-xs">
              <span className="text-gray-300">{step.name}</span>
              <div className="flex items-center space-x-2">
                <span className="text-neon-blue">{step.openRate}%</span>
                <span className="text-gray-500">•</span>
                <span className="text-neon-purple">{step.clickRate}%</span>
              </div>
            </div>
          ))}
          {automation.steps.length > 3 && (
            <div className="text-xs text-gray-500 text-center">+{automation.steps.length - 3} more steps</div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex space-x-2">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onEdit}
          className="flex-1 glass border border-white/10 text-sm py-2 rounded-lg text-gray-400 hover:text-white transition-colors"
        >
          Edit
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onToggle}
          className={`flex-1 text-sm py-2 rounded-lg transition-colors ${
            automation.status === "active" ? "bg-yellow-400/20 text-yellow-400 border border-yellow-400/30" : "btn-neon"
          }`}
        >
          {automation.status === "active" ? "Pause" : "Activate"}
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onAnalyze}
          className="flex-1 btn-neon-purple text-sm py-2"
        >
          Analyze
        </motion.button>
      </div>
    </motion.div>
  )
}

interface DeliverabilityDashboardProps {
  data: typeof mockDeliverabilityData
}

function DeliverabilityDashboard({ data }: DeliverabilityDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <div className="glassmorphism-effect p-6 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">Deliverability Score</h3>
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-neon-green" />
            <span className="text-2xl font-bold text-neon-green">{data.overallScore}%</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass p-4 rounded-lg text-center">
            <div className="flex items-center justify-center space-x-1 mb-2">
              <Globe className="w-4 h-4 text-neon-blue" />
              <span className="text-lg font-bold text-neon-blue">{data.reputation.domain}%</span>
            </div>
            <p className="text-sm text-gray-400">Domain Reputation</p>
          </div>
          <div className="glass p-4 rounded-lg text-center">
            <div className="flex items-center justify-center space-x-1 mb-2">
              <Activity className="w-4 h-4 text-neon-purple" />
              <span className="text-lg font-bold text-neon-purple">{data.reputation.ip}%</span>
            </div>
            <p className="text-sm text-gray-400">IP Reputation</p>
          </div>
          <div className="glass p-4 rounded-lg text-center">
            <div className="flex items-center justify-center space-x-1 mb-2">
              <UserCheck className="w-4 h-4 text-neon-green" />
              <span className="text-lg font-bold text-neon-green">{data.reputation.sender}%</span>
            </div>
            <p className="text-sm text-gray-400">Sender Reputation</p>
          </div>
        </div>
      </div>

      {/* Authentication Status */}
      <div className="glassmorphism-effect p-6 rounded-lg">
        <h3 className="text-xl font-bold text-white mb-4">Authentication Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(data.authentication).map(([key, value]) => (
            <div key={key} className="glass p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white uppercase">{key}</span>
                <div className="flex items-center space-x-1">
                  <CheckCircle className="w-4 h-4 text-neon-green" />
                  <span className="text-sm text-neon-green capitalize">{value}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* List Health */}
      <div className="glassmorphism-effect p-6 rounded-lg">
        <h3 className="text-xl font-bold text-white mb-4">List Health Metrics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass p-4 rounded-lg text-center">
            <span className="text-lg font-bold text-neon-pink">{data.listHealth.bounceRate}%</span>
            <p className="text-sm text-gray-400">Bounce Rate</p>
          </div>
          <div className="glass p-4 rounded-lg text-center">
            <span className="text-lg font-bold text-neon-blue">{data.listHealth.complaintRate}%</span>
            <p className="text-sm text-gray-400">Complaint Rate</p>
          </div>
          <div className="glass p-4 rounded-lg text-center">
            <span className="text-lg font-bold text-yellow-400">{data.listHealth.unsubscribeRate}%</span>
            <p className="text-sm text-gray-400">Unsubscribe Rate</p>
          </div>
          <div className="glass p-4 rounded-lg text-center">
            <span className="text-lg font-bold text-neon-green">{data.listHealth.engagementRate}%</span>
            <p className="text-sm text-gray-400">Engagement Rate</p>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="glassmorphism-effect p-6 rounded-lg">
        <h3 className="text-xl font-bold text-white mb-4">Recommendations</h3>
        <div className="space-y-3">
          {data.recommendations.map((rec, index) => {
            const iconMap = {
              warning: AlertCircle,
              success: CheckCircle,
              info: Bell,
            }
            const colorMap = {
              warning: "text-yellow-400",
              success: "text-neon-green",
              info: "text-neon-blue",
            }
            const Icon = iconMap[rec.type]
            const color = colorMap[rec.type]

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass p-4 rounded-lg"
              >
                <div className="flex items-start space-x-3">
                  <Icon className={`w-5 h-5 ${color} flex-shrink-0 mt-0.5`} />
                  <div className="flex-1">
                    <h4 className="font-medium text-white">{rec.title}</h4>
                    <p className="text-sm text-gray-400 mt-1">{rec.description}</p>
                    <span className={`text-xs ${color} mt-2 inline-block`}>
                      {rec.impact.charAt(0).toUpperCase() + rec.impact.slice(1)} Impact
                    </span>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function EmailPage() {
  const [activeView, setActiveView] = useState("campaigns")
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null)

  const filteredCampaigns = mockCampaigns.filter((campaign) => {
    const matchesSearch =
      campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      campaign.subject.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || campaign.status === statusFilter
    const matchesType = typeFilter === "all" || campaign.type === typeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  const actions = (
    <div className="flex items-center space-x-3">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="btn-neon text-sm flex items-center space-x-2"
      >
        <Plus className="w-4 h-4" />
        <span>Create Campaign</span>
      </motion.button>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="glass border border-white/10 p-2 rounded-lg text-gray-400 hover:text-white"
      >
        <Settings className="w-5 h-5" />
      </motion.button>
    </div>
  )

  return (
    <PageLayout
      title="Email Marketing"
      subtitle="Advanced email campaigns, automation, and deliverability management"
      actions={actions}
    >
      <div className="space-y-8">
        {/* Overview Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4"
        >
          <div className="glassmorphism-effect p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <Mail className="w-6 h-6 text-neon-blue" />
              <span className="text-lg font-bold text-neon-blue">24</span>
            </div>
            <h3 className="font-medium text-white text-sm">Total Campaigns</h3>
            <p className="text-xs text-gray-400">Active & completed</p>
          </div>

          <div className="glassmorphism-effect p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-6 h-6 text-neon-purple" />
              <span className="text-lg font-bold text-neon-purple">12.4K</span>
            </div>
            <h3 className="font-medium text-white text-sm">Subscribers</h3>
            <p className="text-xs text-gray-400">Total active</p>
          </div>

          <div className="glassmorphism-effect p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <Eye className="w-6 h-6 text-neon-green" />
              <span className="text-lg font-bold text-neon-green">28.4%</span>
            </div>
            <h3 className="font-medium text-white text-sm">Open Rate</h3>
            <p className="text-xs text-gray-400">30-day average</p>
          </div>

          <div className="glassmorphism-effect p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <MousePointer className="w-6 h-6 text-neon-pink" />
              <span className="text-lg font-bold text-neon-pink">8.7%</span>
            </div>
            <h3 className="font-medium text-white text-sm">Click Rate</h3>
            <p className="text-xs text-gray-400">30-day average</p>
          </div>

          <div className="glassmorphism-effect p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-6 h-6 text-neon-blue" />
              <span className="text-lg font-bold text-neon-blue">$47K</span>
            </div>
            <h3 className="font-medium text-white text-sm">Revenue</h3>
            <p className="text-xs text-gray-400">This month</p>
          </div>

          <div className="glassmorphism-effect p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <Shield className="w-6 h-6 text-neon-green" />
              <span className="text-lg font-bold text-neon-green">98.2%</span>
            </div>
            <h3 className="font-medium text-white text-sm">Deliverability</h3>
            <p className="text-xs text-gray-400">Overall score</p>
          </div>
        </motion.div>

        {/* View Toggle & Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col lg:flex-row gap-4"
        >
          {/* View Toggle */}
          <div className="flex space-x-1 glass p-1 rounded-lg w-fit">
            {[
              { id: "campaigns", name: "Campaigns", icon: Mail },
              { id: "automation", name: "Automation", icon: Workflow },
              { id: "segments", name: "Segments", icon: Users },
              { id: "templates", name: "Templates", icon: FileText },
              { id: "deliverability", name: "Deliverability", icon: Shield },
              { id: "analytics", name: "Analytics", icon: BarChart3 },
            ].map((view) => (
              <motion.button
                key={view.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveView(view.id)}
                className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  activeView === view.id
                    ? "bg-neon-blue/20 text-neon-blue border border-neon-blue/30"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <view.icon className="w-4 h-4" />
                <span>{view.name}</span>
              </motion.button>
            ))}
          </div>

          {/* Search & Filters */}
          {(activeView === "campaigns" || activeView === "segments") && (
            <div className="flex-1 flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search ${activeView}...`}
                  className="w-full glass border border-white/10 rounded-lg bg-transparent py-3 pl-10 pr-4 text-white placeholder-gray-400 focus:border-neon-blue/50 focus:outline-none"
                />
              </div>

              {activeView === "campaigns" && (
                <>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="glass border border-white/10 rounded-lg px-3 py-2 text-white bg-transparent focus:border-neon-blue/50 focus:outline-none"
                  >
                    <option value="all" className="bg-gray-800">
                      All Status
                    </option>
                    <option value="sent" className="bg-gray-800">
                      Sent
                    </option>
                    <option value="active" className="bg-gray-800">
                      Active
                    </option>
                    <option value="scheduled" className="bg-gray-800">
                      Scheduled
                    </option>
                    <option value="draft" className="bg-gray-800">
                      Draft
                    </option>
                  </select>

                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="glass border border-white/10 rounded-lg px-3 py-2 text-white bg-transparent focus:border-neon-blue/50 focus:outline-none"
                  >
                    <option value="all" className="bg-gray-800">
                      All Types
                    </option>
                    <option value="newsletter" className="bg-gray-800">
                      Newsletter
                    </option>
                    <option value="automation" className="bg-gray-800">
                      Automation
                    </option>
                    <option value="campaign" className="bg-gray-800">
                      Campaign
                    </option>
                  </select>
                </>
              )}
            </div>
          )}
        </motion.div>

        {/* Content Views */}
        <AnimatePresence mode="wait">
          {activeView === "campaigns" && (
            <motion.div
              key="campaigns"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredCampaigns.map((campaign, index) => (
                <motion.div
                  key={campaign.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                >
                  <CampaignCard
                    campaign={campaign}
                    isSelected={selectedCampaign === campaign.id}
                    onSelect={() => setSelectedCampaign(campaign.id)}
                    onEdit={() => console.log("Edit", campaign.id)}
                    onDuplicate={() => console.log("Duplicate", campaign.id)}
                    onDelete={() => console.log("Delete", campaign.id)}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}

          {activeView === "automation" && (
            <motion.div
              key="automation"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {mockAutomations.map((automation, index) => (
                <motion.div
                  key={automation.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                >
                  <AutomationCard
                    automation={automation}
                    onEdit={() => console.log("Edit automation", automation.id)}
                    onToggle={() => console.log("Toggle automation", automation.id)}
                    onAnalyze={() => console.log("Analyze automation", automation.id)}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}

          {activeView === "segments" && (
            <motion.div
              key="segments"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {mockSegments.map((segment, index) => (
                <motion.div
                  key={segment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                >
                  <SegmentCard
                    segment={segment}
                    onEdit={() => console.log("Edit segment", segment.id)}
                    onDelete={() => console.log("Delete segment", segment.id)}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}

          {activeView === "templates" && (
            <motion.div
              key="templates"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {mockTemplates.map((template, index) => (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                >
                  <TemplateCard
                    template={template}
                    onSelect={() => console.log("Select template", template.id)}
                    onPreview={() => console.log("Preview template", template.id)}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}

          {activeView === "deliverability" && (
            <motion.div
              key="deliverability"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: 0.2 }}
            >
              <DeliverabilityDashboard data={mockDeliverabilityData} />
            </motion.div>
          )}

          {activeView === "analytics" && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: 0.2 }}
              className="glassmorphism-effect p-8 rounded-lg text-center"
            >
              <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Advanced Email Analytics</h3>
              <p className="text-gray-400 mb-6">
                Comprehensive performance insights, A/B testing results, and revenue attribution
              </p>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="btn-neon">
                Coming Soon
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageLayout>
  )
}
