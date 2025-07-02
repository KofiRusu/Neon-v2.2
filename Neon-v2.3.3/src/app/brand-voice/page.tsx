"use client"

import PageLayout from "@/components/page-layout"
import { useState } from "react"
import { motion } from "framer-motion"
import {
  Brain,
  FileText,
  Target,
  Users,
  Zap,
  CheckCircle,
  AlertCircle,
  Plus,
  Settings,
  Download,
  Upload,
  Eye,
  Edit3,
  BarChart3,
} from "lucide-react"

const brandVoiceMetrics = [
  { label: "Consistency Score", value: "94%", change: "+2.3%", color: "text-neon-green", icon: CheckCircle },
  { label: "Tone Accuracy", value: "89%", change: "+5.1%", color: "text-neon-blue", icon: Target },
  { label: "Content Analyzed", value: "1,247", change: "+156", color: "text-neon-purple", icon: FileText },
  { label: "Compliance Rate", value: "96%", change: "+1.8%", color: "text-neon-pink", icon: Users },
]

const brandAttributes = [
  { name: "Professional", score: 92, target: 90, status: "on-track" },
  { name: "Innovative", score: 88, target: 85, status: "exceeding" },
  { name: "Trustworthy", score: 94, target: 95, status: "close" },
  { name: "Approachable", score: 86, target: 80, status: "exceeding" },
  { name: "Expert", score: 91, target: 90, status: "on-track" },
]

const recentAnalysis = [
  {
    id: 1,
    content: "Our new AI-powered marketing platform delivers unprecedented ROI...",
    platform: "LinkedIn",
    score: 94,
    issues: [],
    suggestions: ["Consider adding more emotional language", "Include customer testimonial"],
    timestamp: "2 hours ago",
  },
  {
    id: 2,
    content: "🚀 Excited to announce our latest product update! New features include...",
    platform: "Twitter",
    score: 87,
    issues: ["Tone slightly too casual for brand guidelines"],
    suggestions: ["Replace emoji with more professional language", "Add technical details"],
    timestamp: "4 hours ago",
  },
  {
    id: 3,
    content: "How to maximize your marketing ROI with AI: A comprehensive guide",
    platform: "Blog",
    score: 96,
    issues: [],
    suggestions: ["Perfect alignment with brand voice"],
    timestamp: "6 hours ago",
  },
]

export default function BrandVoicePage() {
  const [selectedTab, setSelectedTab] = useState("overview")
  const [showUpload, setShowUpload] = useState(false)

  const actions = (
    <div className="flex items-center space-x-3">
      <button className="btn-neon text-sm">
        <Upload className="w-4 h-4 mr-2" />
        Upload Content
      </button>
      <button className="btn-neon-purple text-sm">
        <Brain className="w-4 h-4 mr-2" />
        Train Voice Model
      </button>
    </div>
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case "exceeding":
        return "text-neon-green"
      case "on-track":
        return "text-neon-blue"
      case "close":
        return "text-neon-purple"
      case "needs-attention":
        return "text-neon-pink"
      default:
        return "text-gray-400"
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-neon-green"
    if (score >= 80) return "text-neon-blue"
    if (score >= 70) return "text-neon-purple"
    return "text-neon-pink"
  }

  return (
    <PageLayout
      title="Brand Voice Manager"
      subtitle="AI-powered brand voice consistency and content compliance"
      actions={actions}
    >
      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {brandVoiceMetrics.map((metric, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="neon-glass-strong p-6 rounded-lg border border-white/10"
          >
            <div className="flex items-center justify-between mb-4">
              <metric.icon className={`w-6 h-6 ${metric.color}`} />
              <span className="text-xs text-neon-green font-medium">{metric.change}</span>
            </div>
            <div className="space-y-1">
              <div className={`text-2xl font-bold ${metric.color}`}>{metric.value}</div>
              <div className="text-sm text-gray-400">{metric.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Content */}
      <div className="neon-glass-strong rounded-lg border border-white/10 mb-8">
        <div className="border-b border-white/10">
          <nav className="flex space-x-8 px-6 overflow-x-auto">
            {[
              { id: "overview", label: "Overview", icon: Eye },
              { id: "analysis", label: "Content Analysis", icon: FileText },
              { id: "training", label: "Voice Training", icon: Brain },
              { id: "guidelines", label: "Guidelines", icon: Target },
              { id: "reports", label: "Reports", icon: BarChart3 },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  selectedTab === tab.id
                    ? "border-neon-purple text-neon-purple"
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
              {/* Brand Attributes */}
              <div className="lg:col-span-2">
                <h2 className="text-xl font-bold text-white mb-6">Brand Voice Attributes</h2>
                <div className="space-y-4">
                  {brandAttributes.map((attribute, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="neon-glass p-4 rounded-lg border border-white/5"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-semibold text-white">{attribute.name}</h3>
                          <span className={`text-sm font-medium ${getStatusColor(attribute.status)}`}>
                            {attribute.status === "exceeding"
                              ? "Exceeding"
                              : attribute.status === "on-track"
                                ? "On Track"
                                : attribute.status === "close"
                                  ? "Close to Target"
                                  : "Needs Attention"}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className={`text-lg font-bold ${getScoreColor(attribute.score)}`}>
                            {attribute.score}%
                          </div>
                          <div className="text-xs text-gray-400">Target: {attribute.target}%</div>
                        </div>
                      </div>

                      <div className="relative">
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${attribute.score}%` }}
                            transition={{ delay: index * 0.1 + 0.3, duration: 0.8 }}
                            className={`h-2 rounded-full ${
                              attribute.score >= 90
                                ? "bg-gradient-to-r from-neon-green to-neon-blue"
                                : attribute.score >= 80
                                  ? "bg-gradient-to-r from-neon-blue to-neon-purple"
                                  : "bg-gradient-to-r from-neon-purple to-neon-pink"
                            }`}
                          />
                        </div>
                        <div className="absolute top-0 w-1 h-2 bg-white/50" style={{ left: `${attribute.target}%` }} />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Recent Analysis */}
              <div className="space-y-6">
                <div className="neon-glass-strong p-6 rounded-lg border border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-4">Voice Model Status</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Model Version</span>
                      <span className="text-neon-blue font-semibold">v2.1.3</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Training Data</span>
                      <span className="text-white font-semibold">15,247 samples</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Last Updated</span>
                      <span className="text-gray-300">2 days ago</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Accuracy</span>
                      <span className="text-neon-green font-semibold">94.2%</span>
                    </div>
                  </div>
                  <button className="btn-neon w-full mt-4">
                    <Settings className="w-4 h-4 mr-2" />
                    Configure Model
                  </button>
                </div>

                <div className="neon-glass-strong p-6 rounded-lg border border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <button className="w-full text-left p-3 neon-glass rounded-lg hover:bg-white/5 transition-colors">
                      <div className="flex items-center space-x-3">
                        <Upload className="w-4 h-4 text-neon-blue" />
                        <div>
                          <div className="text-sm font-medium text-white">Analyze New Content</div>
                          <div className="text-xs text-gray-400">Upload content for voice analysis</div>
                        </div>
                      </div>
                    </button>
                    <button className="w-full text-left p-3 neon-glass rounded-lg hover:bg-white/5 transition-colors">
                      <div className="flex items-center space-x-3">
                        <Download className="w-4 h-4 text-neon-purple" />
                        <div>
                          <div className="text-sm font-medium text-white">Export Guidelines</div>
                          <div className="text-xs text-gray-400">Download brand voice guide</div>
                        </div>
                      </div>
                    </button>
                    <button className="w-full text-left p-3 neon-glass rounded-lg hover:bg-white/5 transition-colors">
                      <div className="flex items-center space-x-3">
                        <Brain className="w-4 h-4 text-neon-green" />
                        <div>
                          <div className="text-sm font-medium text-white">Retrain Model</div>
                          <div className="text-xs text-gray-400">Update with new samples</div>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedTab === "analysis" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Recent Content Analysis</h2>
                <button className="btn-neon text-sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Analyze New Content
                </button>
              </div>

              <div className="space-y-4">
                {recentAnalysis.map((analysis) => (
                  <motion.div
                    key={analysis.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="neon-glass-strong p-6 rounded-lg border border-white/10"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-neon-purple to-neon-blue rounded-full flex items-center justify-center">
                          <FileText className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <span className="text-sm font-medium text-white">{analysis.platform}</span>
                          <p className="text-xs text-gray-400">{analysis.timestamp}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-bold ${getScoreColor(analysis.score)}`}>{analysis.score}%</div>
                        <div className="text-xs text-gray-400">Voice Score</div>
                      </div>
                    </div>

                    <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                      {analysis.content.length > 150 ? `${analysis.content.substring(0, 150)}...` : analysis.content}
                    </p>

                    {analysis.issues.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-neon-pink mb-2 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          Issues Found
                        </h4>
                        <ul className="space-y-1">
                          {analysis.issues.map((issue, index) => (
                            <li key={index} className="text-xs text-gray-400 pl-4">
                              • {issue}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-neon-blue mb-2 flex items-center">
                        <Zap className="w-4 h-4 mr-1" />
                        AI Suggestions
                      </h4>
                      <ul className="space-y-1">
                        {analysis.suggestions.map((suggestion, index) => (
                          <li key={index} className="text-xs text-gray-400 pl-4">
                            • {suggestion}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex items-center space-x-3">
                      <button className="btn-neon text-xs">
                        <Edit3 className="w-3 h-3 mr-1" />
                        Edit Content
                      </button>
                      <button className="text-gray-400 hover:text-white transition-colors text-xs">View Details</button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Other tabs with placeholder content */}
          {selectedTab === "training" && (
            <div className="text-center py-12">
              <Brain className="w-12 h-12 text-neon-purple mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Voice Training Studio</h3>
              <p className="text-gray-400">Advanced model training interface coming soon</p>
            </div>
          )}

          {selectedTab === "guidelines" && (
            <div className="text-center py-12">
              <Target className="w-12 h-12 text-neon-blue mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Brand Guidelines</h3>
              <p className="text-gray-400">Interactive guidelines editor coming soon</p>
            </div>
          )}

          {selectedTab === "reports" && (
            <div className="text-center py-12">
              <BarChart3 className="w-12 h-12 text-neon-green mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Voice Analytics Reports</h3>
              <p className="text-gray-400">Detailed reporting dashboard coming soon</p>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  )
}
