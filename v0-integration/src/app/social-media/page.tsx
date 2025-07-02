"use client"

import PageLayout from "@/components/page-layout"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Plus,
  Share2,
  TrendingUp,
  Users,
  Calendar,
  BarChart3,
  Heart,
  MessageCircle,
  Repeat2,
  Eye,
  Clock,
  Edit3,
  Trash2,
  Filter,
  Download,
  Settings,
  Zap,
  Target,
  Globe,
  ImageIcon,
  Video,
  FileText,
  X,
} from "lucide-react"

const socialPlatforms = [
  {
    name: "Twitter",
    followers: "12.5K",
    engagement: "4.2%",
    posts: 24,
    growth: "+8.3%",
    color: "from-blue-400 to-blue-600",
    icon: "🐦",
    status: "connected",
  },
  {
    name: "LinkedIn",
    followers: "8.3K",
    engagement: "6.1%",
    posts: 18,
    growth: "+12.1%",
    color: "from-blue-600 to-blue-800",
    icon: "💼",
    status: "connected",
  },
  {
    name: "Instagram",
    followers: "15.2K",
    engagement: "5.8%",
    posts: 32,
    growth: "+15.7%",
    color: "from-pink-400 to-purple-600",
    icon: "📸",
    status: "connected",
  },
  {
    name: "Facebook",
    followers: "9.7K",
    engagement: "3.4%",
    posts: 15,
    growth: "+5.2%",
    color: "from-blue-500 to-indigo-600",
    icon: "👥",
    status: "connected",
  },
]

const recentPosts = [
  {
    id: 1,
    platform: "Twitter",
    content:
      "🚀 Just launched our new AI-powered marketing campaign! The results are already exceeding expectations with 40% higher engagement rates. Our machine learning algorithms are identifying the perfect timing and audience segments. #AIMarketing #Innovation",
    engagement: { likes: 234, shares: 45, comments: 12, views: 1250 },
    timestamp: "2 hours ago",
    status: "published",
    type: "text",
    scheduled: false,
    performance: "high",
  },
  {
    id: 2,
    platform: "LinkedIn",
    content:
      "How AI is transforming the marketing landscape: 5 key insights from our latest research. Companies using AI-driven marketing see 37% higher conversion rates and 52% better customer retention.",
    engagement: { likes: 156, shares: 28, comments: 8, views: 890 },
    timestamp: "4 hours ago",
    status: "published",
    type: "article",
    scheduled: false,
    performance: "medium",
  },
  {
    id: 3,
    platform: "Instagram",
    content:
      "Behind the scenes of our AI marketing lab ✨ Where data meets creativity and algorithms drive results. #Innovation #MarketingTech #BehindTheScenes",
    engagement: { likes: 445, shares: 67, comments: 23, views: 2100 },
    timestamp: "6 hours ago",
    status: "scheduled",
    type: "image",
    scheduled: true,
    scheduledTime: "Today at 3:00 PM",
    performance: "high",
  },
  {
    id: 4,
    platform: "Facebook",
    content:
      "Customer success story: How TechCorp increased their ROI by 300% using our AI marketing platform. Read the full case study and discover how AI can transform your business.",
    engagement: { likes: 89, shares: 15, comments: 6, views: 567 },
    timestamp: "8 hours ago",
    status: "published",
    type: "link",
    scheduled: false,
    performance: "medium",
  },
]

const upcomingPosts = [
  {
    id: 5,
    platform: "Twitter",
    content:
      "Weekly AI marketing tip: Use predictive analytics to identify your highest-value customers before they even know they need your product. #MarketingTips",
    scheduledTime: "Tomorrow at 10:00 AM",
    type: "text",
  },
  {
    id: 6,
    platform: "LinkedIn",
    content:
      "The future of B2B marketing is here. Our latest whitepaper explores how AI is reshaping customer acquisition strategies.",
    scheduledTime: "Tomorrow at 2:00 PM",
    type: "document",
  },
]

const contentSuggestions = [
  {
    id: 1,
    type: "trending",
    title: "AI Marketing Trends 2024",
    description: "Create content about emerging AI trends in marketing",
    platforms: ["LinkedIn", "Twitter"],
    engagement_potential: "High",
    keywords: ["AI", "Marketing", "2024", "Trends"],
  },
  {
    id: 2,
    type: "seasonal",
    title: "Year-End Marketing Strategies",
    description: "Share insights about Q4 marketing optimization",
    platforms: ["LinkedIn", "Facebook"],
    engagement_potential: "Medium",
    keywords: ["Q4", "Strategy", "ROI", "Planning"],
  },
  {
    id: 3,
    type: "educational",
    title: "Marketing Automation 101",
    description: "Educational content about marketing automation basics",
    platforms: ["Instagram", "Twitter"],
    engagement_potential: "High",
    keywords: ["Automation", "Education", "Tips", "Beginner"],
  },
]

export default function SocialMediaPage() {
  const [selectedTab, setSelectedTab] = useState("overview")
  const [selectedPlatform, setSelectedPlatform] = useState("all")
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [newPostContent, setNewPostContent] = useState("")
  const [selectedPostPlatforms, setSelectedPostPlatforms] = useState<string[]>([])

  const actions = (
    <div className="flex items-center space-x-3">
      <button className="btn-neon text-sm">
        <Calendar className="w-4 h-4 mr-2" />
        Content Calendar
      </button>
      <button onClick={() => setShowCreatePost(true)} className="btn-neon-purple text-sm">
        <Plus className="w-4 h-4 mr-2" />
        Create Post
      </button>
    </div>
  )

  const getPerformanceColor = (performance: string) => {
    switch (performance) {
      case "high":
        return "text-neon-green"
      case "medium":
        return "text-neon-blue"
      case "low":
        return "text-neon-pink"
      default:
        return "text-gray-400"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-neon-green/20 text-neon-green border-neon-green/30"
      case "scheduled":
        return "bg-neon-blue/20 text-neon-blue border-neon-blue/30"
      case "draft":
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  return (
    <PageLayout
      title="Social Media Agent"
      subtitle="AI-powered social media management and content optimization"
      actions={actions}
    >
      {/* Platform Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {socialPlatforms.map((platform, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="neon-glass-strong p-6 rounded-lg border border-white/10 hover:border-neon-blue/30 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{platform.icon}</span>
                <h3 className="text-lg font-semibold text-white">{platform.name}</h3>
              </div>
              <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${platform.color} neon-glow-blue`}></div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Followers</span>
                <span className="text-neon-blue font-semibold">{platform.followers}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Engagement</span>
                <span className="text-neon-green font-semibold">{platform.engagement}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Posts (30d)</span>
                <span className="text-white font-semibold">{platform.posts}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Growth</span>
                <span className="text-neon-purple font-semibold">{platform.growth}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    platform.status === "connected"
                      ? "bg-neon-green/20 text-neon-green"
                      : "bg-neon-pink/20 text-neon-pink"
                  }`}
                >
                  {platform.status}
                </span>
                <button className="text-gray-400 hover:text-white transition-colors">
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Content Tabs */}
      <div className="neon-glass-strong rounded-lg border border-white/10 mb-8">
        <div className="border-b border-white/10">
          <nav className="flex space-x-8 px-6 overflow-x-auto">
            {[
              { id: "overview", label: "Overview", icon: Eye },
              { id: "posts", label: "Posts", icon: FileText },
              { id: "schedule", label: "Schedule", icon: Calendar },
              { id: "analytics", label: "Analytics", icon: BarChart3 },
              { id: "suggestions", label: "AI Suggestions", icon: Zap },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  selectedTab === tab.id
                    ? "border-neon-blue text-neon-blue"
                    : "border-transparent text-gray-400 hover:text-gray-300"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {selectedTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Recent Activity */}
              <div className="lg:col-span-2">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white">Recent Posts</h2>
                  <div className="flex items-center space-x-3">
                    <select
                      value={selectedPlatform}
                      onChange={(e) => setSelectedPlatform(e.target.value)}
                      className="neon-glass border border-white/10 rounded-lg px-3 py-2 text-sm text-white bg-transparent focus:border-neon-blue/50 focus:outline-none"
                    >
                      <option value="all">All Platforms</option>
                      <option value="twitter">Twitter</option>
                      <option value="linkedin">LinkedIn</option>
                      <option value="instagram">Instagram</option>
                      <option value="facebook">Facebook</option>
                    </select>
                    <button className="p-2 neon-glass rounded-lg hover:bg-white/5 transition-colors">
                      <Filter className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {recentPosts
                    .filter((post) => selectedPlatform === "all" || post.platform.toLowerCase() === selectedPlatform)
                    .map((post) => (
                      <motion.div
                        key={post.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="neon-glass p-4 rounded-lg border border-white/5 hover:border-white/10 transition-all duration-300"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-neon-blue to-neon-purple rounded-full flex items-center justify-center">
                              {post.type === "text" && <FileText className="w-4 h-4 text-white" />}
                              {post.type === "image" && <ImageIcon className="w-4 h-4 text-white" />}
                              {post.type === "video" && <Video className="w-4 h-4 text-white" />}
                              {post.type === "article" && <FileText className="w-4 h-4 text-white" />}
                              {post.type === "link" && <Globe className="w-4 h-4 text-white" />}
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium text-white">{post.platform}</span>
                                <span className={`text-xs ${getPerformanceColor(post.performance)}`}>
                                  {post.performance} performance
                                </span>
                              </div>
                              <p className="text-xs text-gray-400">
                                {post.scheduled ? `Scheduled for ${post.scheduledTime}` : post.timestamp}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(post.status)}`}
                            >
                              {post.status === "published"
                                ? "Published"
                                : post.status === "scheduled"
                                  ? "Scheduled"
                                  : "Draft"}
                            </span>
                            <button className="text-gray-400 hover:text-white transition-colors">
                              <Edit3 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                          {post.content.length > 200 ? `${post.content.substring(0, 200)}...` : post.content}
                        </p>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-6 text-sm text-gray-400">
                            <div className="flex items-center space-x-1">
                              <Heart className="w-4 h-4" />
                              <span>{post.engagement.likes}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Repeat2 className="w-4 h-4" />
                              <span>{post.engagement.shares}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <MessageCircle className="w-4 h-4" />
                              <span>{post.engagement.comments}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Eye className="w-4 h-4" />
                              <span>{post.engagement.views}</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button className="text-gray-400 hover:text-neon-blue transition-colors">
                              <Share2 className="w-4 h-4" />
                            </button>
                            <button className="text-gray-400 hover:text-neon-pink transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                </div>
              </div>

              {/* Sidebar - Analytics & Upcoming */}
              <div className="space-y-6">
                {/* Performance Insights */}
                <div className="neon-glass-strong p-6 rounded-lg border border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-4">Performance Insights</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="w-4 h-4 text-neon-green" />
                        <span className="text-sm text-gray-400">Reach Growth</span>
                      </div>
                      <span className="text-neon-green font-semibold">+24.5%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-neon-blue" />
                        <span className="text-sm text-gray-400">New Followers</span>
                      </div>
                      <span className="text-neon-blue font-semibold">+1,247</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <BarChart3 className="w-4 h-4 text-neon-purple" />
                        <span className="text-sm text-gray-400">Engagement Rate</span>
                      </div>
                      <span className="text-neon-purple font-semibold">5.2%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Target className="w-4 h-4 text-neon-pink" />
                        <span className="text-sm text-gray-400">Conversion Rate</span>
                      </div>
                      <span className="text-neon-pink font-semibold">3.8%</span>
                    </div>
                  </div>
                </div>

                {/* Upcoming Posts */}
                <div className="neon-glass-strong p-6 rounded-lg border border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-4">Upcoming Posts</h3>
                  <div className="space-y-3">
                    {upcomingPosts.map((post) => (
                      <div key={post.id} className="neon-glass p-3 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-white">{post.platform}</span>
                          <Clock className="w-4 h-4 text-neon-blue" />
                        </div>
                        <p className="text-xs text-gray-300 mb-2">
                          {post.content.length > 60 ? `${post.content.substring(0, 60)}...` : post.content}
                        </p>
                        <p className="text-xs text-neon-blue">{post.scheduledTime}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI Recommendations */}
                <div className="neon-glass-strong p-6 rounded-lg border border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-4">AI Recommendations</h3>
                  <div className="space-y-3">
                    <div className="neon-glass p-3 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <Zap className="w-4 h-4 text-neon-purple mt-0.5" />
                        <p className="text-sm text-gray-300">
                          Post more video content on Instagram - 40% higher engagement
                        </p>
                      </div>
                    </div>
                    <div className="neon-glass p-3 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <Clock className="w-4 h-4 text-neon-blue mt-0.5" />
                        <p className="text-sm text-gray-300">Optimal posting time: 2-4 PM EST for LinkedIn</p>
                      </div>
                    </div>
                    <div className="neon-glass p-3 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <TrendingUp className="w-4 h-4 text-neon-green mt-0.5" />
                        <p className="text-sm text-gray-300">Use trending hashtag #MarketingAI for 25% more reach</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedTab === "suggestions" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">AI Content Suggestions</h2>
                <button className="btn-neon text-sm">
                  <Zap className="w-4 h-4 mr-2" />
                  Generate More
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {contentSuggestions.map((suggestion) => (
                  <motion.div
                    key={suggestion.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="neon-glass-strong p-6 rounded-lg border border-white/10 hover:border-neon-purple/30 transition-all duration-300"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          suggestion.type === "trending"
                            ? "bg-neon-green/20 text-neon-green"
                            : suggestion.type === "seasonal"
                              ? "bg-neon-blue/20 text-neon-blue"
                              : "bg-neon-purple/20 text-neon-purple"
                        }`}
                      >
                        {suggestion.type}
                      </div>
                      <span
                        className={`text-xs font-medium ${
                          suggestion.engagement_potential === "High"
                            ? "text-neon-green"
                            : suggestion.engagement_potential === "Medium"
                              ? "text-neon-blue"
                              : "text-neon-pink"
                        }`}
                      >
                        {suggestion.engagement_potential} potential
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold text-white mb-2">{suggestion.title}</h3>
                    <p className="text-gray-300 text-sm mb-4">{suggestion.description}</p>

                    <div className="space-y-3">
                      <div>
                        <span className="text-xs text-gray-400">Recommended platforms:</span>
                        <div className="flex items-center space-x-2 mt-1">
                          {suggestion.platforms.map((platform) => (
                            <span
                              key={platform}
                              className="px-2 py-1 text-xs bg-neon-blue/20 text-neon-blue rounded-full"
                            >
                              {platform}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="text-xs text-gray-400">Keywords:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {suggestion.keywords.map((keyword) => (
                            <span key={keyword} className="px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded">
                              #{keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 mt-4">
                      <button className="btn-neon text-xs flex-1">
                        <Plus className="w-3 h-3 mr-1" />
                        Create Post
                      </button>
                      <button className="p-2 neon-glass rounded-lg hover:bg-white/5 transition-colors">
                        <Download className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Other tabs content can be added here */}
          {selectedTab === "posts" && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-neon-blue mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">All Posts</h3>
              <p className="text-gray-400">Comprehensive post management coming soon</p>
            </div>
          )}

          {selectedTab === "schedule" && (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-neon-purple mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Content Calendar</h3>
              <p className="text-gray-400">Advanced scheduling features coming soon</p>
            </div>
          )}

          {selectedTab === "analytics" && (
            <div className="text-center py-12">
              <BarChart3 className="w-12 h-12 text-neon-green mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Advanced Analytics</h3>
              <p className="text-gray-400">Detailed analytics dashboard coming soon</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Post Modal */}
      <AnimatePresence>
        {showCreatePost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowCreatePost(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="neon-glass-strong p-6 rounded-lg border border-white/10 w-full max-w-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Create New Post</h2>
                <button
                  onClick={() => setShowCreatePost(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-400 mb-2 block">Select Platforms</label>
                  <div className="flex flex-wrap gap-2">
                    {socialPlatforms.map((platform) => (
                      <button
                        key={platform.name}
                        onClick={() => {
                          setSelectedPostPlatforms((prev) =>
                            prev.includes(platform.name)
                              ? prev.filter((p) => p !== platform.name)
                              : [...prev, platform.name],
                          )
                        }}
                        className={`px-3 py-2 text-sm rounded-lg border transition-all ${
                          selectedPostPlatforms.includes(platform.name)
                            ? "bg-neon-blue/20 text-neon-blue border-neon-blue/30"
                            : "bg-transparent text-gray-400 border-white/10 hover:border-white/20"
                        }`}
                      >
                        {platform.icon} {platform.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-400 mb-2 block">Content</label>
                  <textarea
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    placeholder="What's on your mind? Our AI will optimize this for each platform..."
                    className="w-full h-32 neon-glass border border-white/10 rounded-lg p-4 text-white placeholder-gray-400 bg-transparent focus:border-neon-blue/50 focus:outline-none resize-none"
                  />
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-400">{newPostContent.length}/280 characters</span>
                    <button className="text-xs text-neon-purple hover:text-neon-blue transition-colors">
                      <Zap className="w-3 h-3 inline mr-1" />
                      AI Optimize
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <div className="flex items-center space-x-4">
                    <button className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors">
                      <ImageIcon className="w-4 h-4" />
                      <span className="text-sm">Add Media</span>
                    </button>
                    <button className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm">Schedule</span>
                    </button>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setShowCreatePost(false)}
                      className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      disabled={!newPostContent.trim() || selectedPostPlatforms.length === 0}
                      className="btn-neon-purple text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Publish Now
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageLayout>
  )
}
