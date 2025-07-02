"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState } from "react"
import {
  FileText,
  Wand2,
  Save,
  Download,
  Search,
  Plus,
  Copy,
  Edit,
  Trash2,
  Eye,
  Clock,
  TrendingUp,
  Brain,
  Sparkles,
  Tag,
  User,
  BarChart3,
  Settings,
  BookOpen,
  PenTool,
  MessageSquare,
  Video,
  Hash,
  CheckCircle,
  AlertCircle,
  Loader,
} from "lucide-react"
import PageLayout from "@/components/page-layout"

// Enhanced mock data with more realistic content types and metadata
const mockContentLibrary = [
  {
    id: "content-001",
    title: "The Future of AI in Marketing: A Complete Guide",
    type: "blog" as const,
    status: "published" as const,
    created: "2024-06-28T10:30:00Z",
    updated: "2024-06-28T14:20:00Z",
    author: "Content Generator AI",
    wordCount: 2847,
    readTime: 12,
    tags: ["AI", "Marketing", "Technology", "Strategy"],
    performance: {
      views: 15420,
      engagement: 8.7,
      shares: 234,
      conversions: 89,
    },
    preview:
      "Discover how artificial intelligence is revolutionizing marketing strategies and learn practical implementation techniques for your business...",
    aiGenerated: true,
    quality: 94,
    seoScore: 87,
    tone: "professional",
    audience: "Marketing Professionals",
  },
  {
    id: "content-002",
    title: "Weekly Newsletter - Product Updates & Insights",
    type: "email" as const,
    status: "scheduled" as const,
    created: "2024-06-27T16:45:00Z",
    updated: "2024-06-27T18:30:00Z",
    author: "Email Marketing Agent",
    wordCount: 1245,
    readTime: 5,
    tags: ["Newsletter", "Product Updates", "Customer Engagement"],
    performance: {
      views: 8930,
      engagement: 12.4,
      shares: 67,
      conversions: 156,
    },
    preview:
      "This week's highlights include new feature releases, customer success stories, and upcoming webinar announcements...",
    aiGenerated: true,
    quality: 91,
    seoScore: 0,
    tone: "friendly",
    audience: "Existing Customers",
    scheduledFor: "2024-06-30T09:00:00Z",
  },
  {
    id: "content-003",
    title: "Social Media Campaign: Summer Launch",
    type: "social" as const,
    status: "draft" as const,
    created: "2024-06-26T11:15:00Z",
    updated: "2024-06-27T09:45:00Z",
    author: "Social Media Bot",
    wordCount: 456,
    readTime: 2,
    tags: ["Social Media", "Campaign", "Summer", "Product Launch"],
    performance: {
      views: 0,
      engagement: 0,
      shares: 0,
      conversions: 0,
    },
    preview:
      "Engaging social media posts designed to boost brand awareness and drive traffic for our summer product launch...",
    aiGenerated: true,
    quality: 88,
    seoScore: 0,
    tone: "casual",
    audience: "General Public",
  },
  {
    id: "content-004",
    title: "Premium Wireless Headphones - Product Description",
    type: "product" as const,
    status: "published" as const,
    created: "2024-06-25T14:20:00Z",
    updated: "2024-06-26T10:15:00Z",
    author: "Content Generator AI",
    wordCount: 687,
    readTime: 3,
    tags: ["Product", "Electronics", "Audio", "E-commerce"],
    performance: {
      views: 5670,
      engagement: 15.2,
      shares: 89,
      conversions: 234,
    },
    preview:
      "Experience premium audio quality with our latest wireless headphones featuring advanced noise cancellation technology...",
    aiGenerated: true,
    quality: 96,
    seoScore: 92,
    tone: "persuasive",
    audience: "Tech Enthusiasts",
  },
  {
    id: "content-005",
    title: "Customer Success Story: 300% ROI Increase",
    type: "case-study" as const,
    status: "review" as const,
    created: "2024-06-24T13:30:00Z",
    updated: "2024-06-25T16:45:00Z",
    author: "Brand Voice Agent",
    wordCount: 1834,
    readTime: 8,
    tags: ["Case Study", "Success Story", "ROI", "Customer"],
    performance: {
      views: 3240,
      engagement: 18.9,
      shares: 145,
      conversions: 67,
    },
    preview: "Learn how TechCorp achieved a 300% ROI increase using our AI-powered marketing automation platform...",
    aiGenerated: false,
    quality: 92,
    seoScore: 85,
    tone: "authoritative",
    audience: "Decision Makers",
  },
  {
    id: "content-006",
    title: "Video Script: AI Marketing Explainer",
    type: "video" as const,
    status: "draft" as const,
    created: "2024-06-23T09:20:00Z",
    updated: "2024-06-24T11:30:00Z",
    author: "Content Generator AI",
    wordCount: 892,
    readTime: 4,
    tags: ["Video", "Script", "Explainer", "AI"],
    performance: {
      views: 0,
      engagement: 0,
      shares: 0,
      conversions: 0,
    },
    preview: "Comprehensive video script explaining AI marketing concepts in an engaging and accessible way...",
    aiGenerated: true,
    quality: 89,
    seoScore: 0,
    tone: "educational",
    audience: "General Public",
  },
]

const contentTypes = [
  { name: "Blog Posts", count: 24, icon: BookOpen, color: "blue", description: "Long-form articles and guides" },
  { name: "Email Content", count: 18, icon: MessageSquare, color: "purple", description: "Newsletters and campaigns" },
  { name: "Social Media", count: 45, icon: Hash, color: "pink", description: "Posts and social content" },
  { name: "Product Descriptions", count: 32, icon: Tag, color: "green", description: "E-commerce content" },
  { name: "Case Studies", count: 12, icon: BarChart3, color: "blue", description: "Success stories and analysis" },
  { name: "Video Scripts", count: 8, icon: Video, color: "purple", description: "Video and multimedia content" },
]

const contentTemplates = [
  {
    id: "template-001",
    name: "Blog Post Template",
    description: "SEO-optimized blog post structure",
    type: "blog",
    icon: BookOpen,
    fields: ["title", "introduction", "main_points", "conclusion", "cta"],
  },
  {
    id: "template-002",
    name: "Product Launch Email",
    description: "Product announcement email template",
    type: "email",
    icon: MessageSquare,
    fields: ["subject", "greeting", "product_intro", "features", "cta"],
  },
  {
    id: "template-003",
    name: "Social Media Series",
    description: "Multi-platform social content",
    type: "social",
    icon: Hash,
    fields: ["platform", "message", "hashtags", "call_to_action"],
  },
  {
    id: "template-004",
    name: "Case Study Format",
    description: "Customer success story template",
    type: "case-study",
    icon: BarChart3,
    fields: ["challenge", "solution", "results", "testimonial"],
  },
]

interface ContentCardProps {
  content: (typeof mockContentLibrary)[0]
  isSelected: boolean
  onSelect: () => void
  onEdit: () => void
  onDelete: () => void
  onDuplicate: () => void
}

function ContentCard({ content, isSelected, onSelect, onEdit, onDelete, onDuplicate }: ContentCardProps) {
  const [showActions, setShowActions] = useState(false)

  const statusConfig = {
    published: { color: "text-neon-green", bg: "bg-neon-green/20", border: "border-neon-green/30", icon: CheckCircle },
    draft: { color: "text-gray-400", bg: "bg-gray-500/20", border: "border-gray-500/30", icon: Edit },
    scheduled: { color: "text-neon-blue", bg: "bg-neon-blue/20", border: "border-neon-blue/30", icon: Clock },
    review: { color: "text-yellow-400", bg: "bg-yellow-400/20", border: "border-yellow-400/30", icon: AlertCircle },
  }

  const typeConfig = {
    blog: { icon: BookOpen, color: "text-neon-blue" },
    email: { icon: MessageSquare, color: "text-neon-purple" },
    social: { icon: Hash, color: "text-neon-pink" },
    product: { icon: Tag, color: "text-neon-green" },
    "case-study": { icon: BarChart3, color: "text-neon-blue" },
    video: { icon: Video, color: "text-neon-purple" },
  }

  const config = statusConfig[content.status]
  const typeConf = typeConfig[content.type]
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
            <h3 className="font-semibold text-white text-lg leading-tight">{content.title}</h3>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-xs text-gray-400">{content.type.replace("-", " ")}</span>
              <span className="text-xs text-gray-500">•</span>
              <span className="text-xs text-gray-400">{content.wordCount} words</span>
              <span className="text-xs text-gray-500">•</span>
              <span className="text-xs text-gray-400">{content.readTime} min read</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full border ${config.bg} ${config.border} ${config.color} flex items-center space-x-1`}
          >
            <StatusIcon className="w-3 h-3" />
            <span>{content.status}</span>
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

      {/* Content Preview */}
      <p className="text-sm text-gray-300 mb-4 line-clamp-2">{content.preview}</p>

      {/* Tags */}
      <div className="flex flex-wrap gap-1 mb-4">
        {content.tags.slice(0, 3).map((tag, index) => (
          <span
            key={index}
            className="px-2 py-1 text-xs bg-neon-blue/20 text-neon-blue rounded-full border border-neon-blue/30"
          >
            {tag}
          </span>
        ))}
        {content.tags.length > 3 && (
          <span className="px-2 py-1 text-xs bg-gray-500/20 text-gray-400 rounded-full border border-gray-500/30">
            +{content.tags.length - 3}
          </span>
        )}
      </div>

      {/* Performance Metrics */}
      {content.status === "published" && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="glass p-2 rounded-lg text-center">
            <div className="flex items-center justify-center space-x-1">
              <Eye className="w-3 h-3 text-neon-blue" />
              <span className="text-sm font-bold text-neon-blue">{content.performance.views.toLocaleString()}</span>
            </div>
            <p className="text-xs text-gray-400">Views</p>
          </div>
          <div className="glass p-2 rounded-lg text-center">
            <div className="flex items-center justify-center space-x-1">
              <TrendingUp className="w-3 h-3 text-neon-green" />
              <span className="text-sm font-bold text-neon-green">{content.performance.engagement}%</span>
            </div>
            <p className="text-xs text-gray-400">Engagement</p>
          </div>
        </div>
      )}

      {/* Quality Indicators */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {content.aiGenerated && (
            <div className="flex items-center space-x-1">
              <Sparkles className="w-3 h-3 text-neon-purple" />
              <span className="text-xs text-neon-purple">AI Generated</span>
            </div>
          )}
          <div className="flex items-center space-x-1">
            <span className="text-xs text-gray-400">Quality:</span>
            <span className="text-xs font-medium text-neon-green">{content.quality}%</span>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs text-gray-400">
          <User className="w-3 h-3" />
          <span>{content.author}</span>
        </div>
      </div>

      {/* Scheduled indicator */}
      {content.status === "scheduled" && content.scheduledFor && (
        <div className="mt-3 pt-3 border-t border-white/10">
          <div className="flex items-center space-x-2 text-xs text-neon-blue">
            <Clock className="w-3 h-3" />
            <span>Scheduled for {new Date(content.scheduledFor).toLocaleString()}</span>
          </div>
        </div>
      )}
    </motion.div>
  )
}

interface ContentEditorProps {
  isOpen: boolean
  onClose: () => void
  selectedTemplate?: (typeof contentTemplates)[0] | null
}

function ContentEditor({ isOpen, onClose, selectedTemplate }: ContentEditorProps) {
  const [prompt, setPrompt] = useState("")
  const [generatedContent, setGeneratedContent] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [activeTab, setActiveTab] = useState("prompt")
  const [contentSettings, setContentSettings] = useState({
    tone: "professional",
    audience: "",
    keywords: "",
    length: "medium",
    style: "informative",
  })

  const handleGenerate = async () => {
    if (!prompt.trim()) return

    setIsGenerating(true)
    setActiveTab("output")

    // Simulate AI generation with more realistic delay
    setTimeout(() => {
      const mockContent = `# ${prompt.includes("blog") ? "Blog Post" : "Marketing Content"}

## Introduction
${prompt.includes("product") ? "Introducing our revolutionary new product that will transform your daily routine." : "Welcome to this comprehensive guide that will help you achieve your goals."}

## Key Benefits
- **Enhanced Performance**: Experience up to 300% improvement in efficiency
- **User-Friendly Design**: Intuitive interface that anyone can master
- **Cost-Effective Solution**: Save money while getting premium results
- **24/7 Support**: Our team is always here to help you succeed

## Detailed Analysis
Our research shows that businesses implementing these strategies see significant improvements in their key performance indicators. The data-driven approach ensures measurable results and sustainable growth.

### Implementation Strategy
1. **Assessment Phase**: Evaluate current state and identify opportunities
2. **Planning Phase**: Develop comprehensive strategy and timeline
3. **Execution Phase**: Implement solutions with continuous monitoring
4. **Optimization Phase**: Refine and improve based on performance data

## Call to Action
Ready to get started? Join thousands of satisfied customers who have already transformed their ${prompt.includes("business") ? "business" : "life"} with our solution.

*Generated with NeonHub AI - Optimized for engagement and conversions*
*Quality Score: 94% | SEO Score: 87% | Readability: Excellent*`

      setGeneratedContent(mockContent)
      setIsGenerating(false)
    }, 3000)
  }

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="glassmorphism-effect w-full max-w-6xl h-[80vh] rounded-lg overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-neon-purple/20 text-neon-purple">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">AI Content Studio</h2>
              <p className="text-sm text-gray-400">
                {selectedTemplate ? `Using ${selectedTemplate.name}` : "Create engaging content with AI"}
              </p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white"
          >
            ×
          </motion.button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10">
          {[
            { id: "prompt", name: "Content Brief", icon: PenTool },
            { id: "settings", name: "Settings", icon: Settings },
            { id: "output", name: "Generated Content", icon: FileText },
          ].map((tab) => (
            <motion.button
              key={tab.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-neon-blue/20 text-neon-blue border-b-2 border-neon-blue"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.name}</span>
            </motion.button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {activeTab === "prompt" && (
            <div className="h-full p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                {/* Prompt Input */}
                <div className="lg:col-span-2 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Content Brief</h3>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleGenerate}
                      disabled={!prompt.trim() || isGenerating}
                      className="btn-neon text-sm flex items-center space-x-2 disabled:opacity-50"
                    >
                      {isGenerating ? <Loader className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                      <span>{isGenerating ? "Generating..." : "Generate Content"}</span>
                    </motion.button>
                  </div>

                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={`Describe the content you want to generate...

Examples:
• Write a comprehensive blog post about sustainable marketing practices
• Create an engaging product description for wireless noise-canceling headphones
• Draft a newsletter announcing our new AI features and customer success stories
• Generate social media captions for a summer product launch campaign

Be specific about your target audience, key messages, and desired tone.`}
                    className="flex-1 w-full glass border border-white/10 rounded-lg p-4 text-white bg-transparent placeholder-gray-400 focus:border-neon-blue/50 focus:outline-none focus:ring-1 focus:ring-neon-blue/50 resize-none"
                  />

                  <div className="mt-4 flex items-center justify-between text-sm text-gray-400">
                    <span>{prompt.length} characters</span>
                    <div className="flex items-center space-x-4">
                      <span>AI-powered content generation</span>
                      <div className="flex items-center space-x-1">
                        <Brain className="w-4 h-4 text-neon-purple" />
                        <span className="text-neon-purple">GPT-4 Enhanced</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Templates */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Quick Templates</h3>
                  <div className="space-y-3">
                    {contentTemplates.map((template) => (
                      <motion.div
                        key={template.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setPrompt(`Using the ${template.name}: ${template.description}`)
                        }}
                        className="glass p-4 rounded-lg cursor-pointer hover:border-neon-blue/30 transition-all"
                      >
                        <div className="flex items-center space-x-3 mb-2">
                          <template.icon className="w-5 h-5 text-neon-blue" />
                          <h4 className="font-medium text-white">{template.name}</h4>
                        </div>
                        <p className="text-sm text-gray-400">{template.description}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {template.fields.slice(0, 3).map((field, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 text-xs bg-neon-purple/20 text-neon-purple rounded-full"
                            >
                              {field.replace("_", " ")}
                            </span>
                          ))}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="h-full p-6 overflow-y-auto">
              <div className="max-w-2xl space-y-6">
                <h3 className="text-lg font-semibold text-white">Content Settings</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Tone & Style</label>
                    <select
                      value={contentSettings.tone}
                      onChange={(e) => setContentSettings({ ...contentSettings, tone: e.target.value })}
                      className="w-full glass border border-white/10 rounded-lg px-3 py-2 text-white bg-transparent focus:border-neon-blue/50 focus:outline-none"
                    >
                      <option value="professional" className="bg-gray-800">
                        Professional
                      </option>
                      <option value="casual" className="bg-gray-800">
                        Casual & Friendly
                      </option>
                      <option value="authoritative" className="bg-gray-800">
                        Authoritative
                      </option>
                      <option value="conversational" className="bg-gray-800">
                        Conversational
                      </option>
                      <option value="persuasive" className="bg-gray-800">
                        Persuasive
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Content Length</label>
                    <select
                      value={contentSettings.length}
                      onChange={(e) => setContentSettings({ ...contentSettings, length: e.target.value })}
                      className="w-full glass border border-white/10 rounded-lg px-3 py-2 text-white bg-transparent focus:border-neon-blue/50 focus:outline-none"
                    >
                      <option value="short" className="bg-gray-800">
                        Short (300-500 words)
                      </option>
                      <option value="medium" className="bg-gray-800">
                        Medium (500-1000 words)
                      </option>
                      <option value="long" className="bg-gray-800">
                        Long (1000+ words)
                      </option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-white mb-2">Target Audience</label>
                    <input
                      type="text"
                      value={contentSettings.audience}
                      onChange={(e) => setContentSettings({ ...contentSettings, audience: e.target.value })}
                      placeholder="e.g., Marketing professionals, Tech enthusiasts, Small business owners"
                      className="w-full glass border border-white/10 rounded-lg px-3 py-2 text-white bg-transparent placeholder-gray-400 focus:border-neon-blue/50 focus:outline-none"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-white mb-2">SEO Keywords</label>
                    <input
                      type="text"
                      value={contentSettings.keywords}
                      onChange={(e) => setContentSettings({ ...contentSettings, keywords: e.target.value })}
                      placeholder="e.g., AI marketing, automation, digital strategy"
                      className="w-full glass border border-white/10 rounded-lg px-3 py-2 text-white bg-transparent placeholder-gray-400 focus:border-neon-blue/50 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Advanced Settings */}
                <div className="glass p-4 rounded-lg">
                  <h4 className="font-medium text-white mb-3">Advanced Options</h4>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-5 h-5 bg-gray-600 peer-focus:outline-none rounded border peer-checked:bg-neon-blue peer-checked:border-neon-blue"></div>
                      <span className="text-sm text-gray-300">Include SEO optimization</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-5 h-5 bg-gray-600 peer-focus:outline-none rounded border peer-checked:bg-neon-blue peer-checked:border-neon-blue"></div>
                      <span className="text-sm text-gray-300">Add call-to-action</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-5 h-5 bg-gray-600 peer-focus:outline-none rounded border peer-checked:bg-neon-blue peer-checked:border-neon-blue"></div>
                      <span className="text-sm text-gray-300">Include performance metrics</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "output" && (
            <div className="h-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Generated Content</h3>
                {generatedContent && (
                  <div className="flex items-center space-x-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="glass p-2 rounded-lg text-gray-400 hover:text-white"
                      onClick={() => navigator.clipboard.writeText(generatedContent)}
                    >
                      <Copy className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="glass p-2 rounded-lg text-gray-400 hover:text-white"
                    >
                      <Download className="w-4 h-4" />
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="btn-neon text-sm">
                      <Save className="w-4 h-4 mr-2" />
                      Save Content
                    </motion.button>
                  </div>
                )}
              </div>

              <div className="h-full overflow-auto glass rounded-lg p-4">
                {isGenerating ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                        className="w-16 h-16 border-4 border-neon-purple border-t-transparent rounded-full mx-auto mb-4"
                      />
                      <p className="text-white font-medium">AI is crafting your content...</p>
                      <p className="text-sm text-gray-400 mt-2">This may take a few moments</p>
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center justify-center space-x-2 text-sm text-neon-blue">
                          <Brain className="w-4 h-4" />
                          <span>Analyzing requirements...</span>
                        </div>
                        <div className="flex items-center justify-center space-x-2 text-sm text-neon-purple">
                          <Sparkles className="w-4 h-4" />
                          <span>Generating content...</span>
                        </div>
                        <div className="flex items-center justify-center space-x-2 text-sm text-neon-green">
                          <CheckCircle className="w-4 h-4" />
                          <span>Optimizing for quality...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : generatedContent ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="prose prose-invert max-w-none"
                  >
                    <pre className="whitespace-pre-wrap text-sm text-gray-300 leading-relaxed font-sans">
                      {generatedContent}
                    </pre>
                  </motion.div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <Wand2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-white font-medium">Ready to generate content</p>
                      <p className="text-sm text-gray-400 mt-2">
                        Fill out your content brief and click Generate to start
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function ContentPage() {
  const [activeView, setActiveView] = useState("library")
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedContent, setSelectedContent] = useState<string | null>(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<(typeof contentTemplates)[0] | null>(null)

  const filteredContent = mockContentLibrary.filter((content) => {
    const matchesSearch =
      content.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      content.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesType = typeFilter === "all" || content.type === typeFilter
    const matchesStatus = statusFilter === "all" || content.status === statusFilter
    return matchesSearch && matchesType && matchesStatus
  })

  const actions = (
    <div className="flex items-center space-x-3">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsEditorOpen(true)}
        className="btn-neon text-sm flex items-center space-x-2"
      >
        <Plus className="w-4 h-4" />
        <span>Create Content</span>
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
    <PageLayout title="Content Studio" subtitle="AI-powered content creation and management platform" actions={actions}>
      <div className="space-y-8">
        {/* Content Type Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
        >
          {contentTypes.map((type, index) => (
            <motion.div
              key={type.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="glassmorphism-effect p-4 rounded-lg cursor-pointer hover:border-neon-blue/30 transition-all"
              onClick={() => setTypeFilter(type.name.toLowerCase().replace(" ", "-"))}
            >
              <div className="flex items-center justify-between mb-2">
                <type.icon className={`w-6 h-6 text-neon-${type.color}`} />
                <span className={`text-lg font-bold text-neon-${type.color}`}>{type.count}</span>
              </div>
              <h3 className="font-medium text-white text-sm">{type.name}</h3>
              <p className="text-xs text-gray-400 mt-1">{type.description}</p>
            </motion.div>
          ))}
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
              { id: "library", name: "Content Library", icon: FileText },
              { id: "templates", name: "Templates", icon: BookOpen },
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
          <div className="flex-1 flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search content by title, tags, or type..."
                className="w-full glass border border-white/10 rounded-lg bg-transparent py-3 pl-10 pr-4 text-white placeholder-gray-400 focus:border-neon-blue/50 focus:outline-none"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="glass border border-white/10 rounded-lg px-3 py-2 text-white bg-transparent focus:border-neon-blue/50 focus:outline-none"
            >
              <option value="all" className="bg-gray-800">
                All Types
              </option>
              <option value="blog" className="bg-gray-800">
                Blog Posts
              </option>
              <option value="email" className="bg-gray-800">
                Email Content
              </option>
              <option value="social" className="bg-gray-800">
                Social Media
              </option>
              <option value="product" className="bg-gray-800">
                Product Descriptions
              </option>
              <option value="case-study" className="bg-gray-800">
                Case Studies
              </option>
              <option value="video" className="bg-gray-800">
                Video Scripts
              </option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="glass border border-white/10 rounded-lg px-3 py-2 text-white bg-transparent focus:border-neon-blue/50 focus:outline-none"
            >
              <option value="all" className="bg-gray-800">
                All Status
              </option>
              <option value="published" className="bg-gray-800">
                Published
              </option>
              <option value="draft" className="bg-gray-800">
                Draft
              </option>
              <option value="scheduled" className="bg-gray-800">
                Scheduled
              </option>
              <option value="review" className="bg-gray-800">
                Under Review
              </option>
            </select>
          </div>
        </motion.div>

        {/* Content Views */}
        <AnimatePresence mode="wait">
          {activeView === "library" && (
            <motion.div
              key="library"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredContent.map((content, index) => (
                <motion.div
                  key={content.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                >
                  <ContentCard
                    content={content}
                    isSelected={selectedContent === content.id}
                    onSelect={() => setSelectedContent(content.id)}
                    onEdit={() => console.log("Edit", content.id)}
                    onDelete={() => console.log("Delete", content.id)}
                    onDuplicate={() => console.log("Duplicate", content.id)}
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
              {contentTemplates.map((template, index) => (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  whileHover={{ y: -4, scale: 1.02 }}
                  onClick={() => {
                    setSelectedTemplate(template)
                    setIsEditorOpen(true)
                  }}
                  className="glassmorphism-effect p-6 rounded-lg cursor-pointer hover:border-neon-blue/30 transition-all"
                >
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-3 rounded-lg bg-neon-blue/20 text-neon-blue">
                      <template.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{template.name}</h3>
                      <p className="text-sm text-gray-400">{template.type}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-300 mb-4">{template.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {template.fields.map((field, fieldIndex) => (
                      <span
                        key={fieldIndex}
                        className="px-2 py-1 text-xs bg-neon-purple/20 text-neon-purple rounded-full border border-neon-purple/30"
                      >
                        {field.replace("_", " ")}
                      </span>
                    ))}
                  </div>
                </motion.div>
              ))}
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
              <h3 className="text-xl font-bold text-white mb-2">Content Analytics</h3>
              <p className="text-gray-400 mb-6">
                Detailed performance insights and content optimization recommendations
              </p>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="btn-neon">
                Coming Soon
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content Editor Modal */}
        <AnimatePresence>
          {isEditorOpen && (
            <ContentEditor
              isOpen={isEditorOpen}
              onClose={() => {
                setIsEditorOpen(false)
                setSelectedTemplate(null)
              }}
              selectedTemplate={selectedTemplate}
            />
          )}
        </AnimatePresence>
      </div>
    </PageLayout>
  )
}
