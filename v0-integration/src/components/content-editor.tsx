"use client"

import { motion } from "framer-motion"
import { useState } from "react"
import { Wand2, Copy, Save, Download, RefreshCw } from "lucide-react"
import NeonCard from "./neon-card"

interface ContentEditorProps {
  onGenerate?: (prompt: string) => void
}

export default function ContentEditor({ onGenerate }: ContentEditorProps) {
  const [prompt, setPrompt] = useState("")
  const [generatedContent, setGeneratedContent] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerate = async () => {
    if (!prompt.trim()) return

    setIsGenerating(true)

    // Simulate AI generation
    setTimeout(() => {
      const mockContent = `# ${prompt.includes("blog") ? "Blog Post" : "Marketing Content"}

## Introduction
${prompt.includes("product") ? "Introducing our revolutionary new product that will transform your daily routine." : "Welcome to this comprehensive guide that will help you achieve your goals."}

## Key Benefits
- **Enhanced Performance**: Experience up to 300% improvement in efficiency
- **User-Friendly Design**: Intuitive interface that anyone can master
- **Cost-Effective Solution**: Save money while getting premium results
- **24/7 Support**: Our team is always here to help you succeed

## Call to Action
Ready to get started? Join thousands of satisfied customers who have already transformed their ${prompt.includes("business") ? "business" : "life"} with our solution.

*Generated with NeonHub AI - Optimized for engagement and conversions*`

      setGeneratedContent(mockContent)
      setIsGenerating(false)
      onGenerate?.(prompt)
    }, 2000)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[600px]">
      {/* Input Pane */}
      <NeonCard glow="blue" className="flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">Content Prompt</h3>
          <div className="flex items-center space-x-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              className="neon-btn text-sm flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
              <span>{isGenerating ? "Generating..." : "Generate"}</span>
            </motion.button>
          </div>
        </div>

        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the content you want to generate... 

Examples:
• Write a blog post about sustainable living
• Create product description for wireless headphones
• Generate social media captions for coffee shop
• Draft email newsletter about summer sale"
          className="flex-1 w-full neon-glass border border-white/10 rounded-lg p-4 text-white bg-transparent placeholder-gray-400 focus:border-neon-blue/50 focus:outline-none focus:ring-1 focus:ring-neon-blue/50 resize-none"
        />

        <div className="mt-4 flex items-center justify-between text-sm text-gray-400">
          <span>{prompt.length} characters</span>
          <span>AI-powered content generation</span>
        </div>
      </NeonCard>

      {/* Output Pane */}
      <NeonCard glow="purple" className="flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">Generated Content</h3>
          <div className="flex items-center space-x-2">
            {generatedContent && (
              <>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="neon-glass p-2 rounded-lg text-gray-400 hover:text-white"
                  onClick={() => navigator.clipboard.writeText(generatedContent)}
                >
                  <Copy className="w-4 h-4" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="neon-glass p-2 rounded-lg text-gray-400 hover:text-white"
                >
                  <Save className="w-4 h-4" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="neon-glass p-2 rounded-lg text-gray-400 hover:text-white"
                >
                  <Download className="w-4 h-4" />
                </motion.button>
              </>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {isGenerating ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  className="w-12 h-12 border-2 border-neon-purple border-t-transparent rounded-full mx-auto mb-4"
                />
                <p className="text-gray-400">AI is generating your content...</p>
                <p className="text-sm text-gray-500 mt-1">This may take a few moments</p>
              </div>
            </div>
          ) : generatedContent ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="prose prose-invert max-w-none"
            >
              <pre className="whitespace-pre-wrap text-sm text-gray-300 leading-relaxed">{generatedContent}</pre>
            </motion.div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Wand2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">Generated content will appear here</p>
                <p className="text-sm text-gray-500 mt-1">Enter a prompt and click Generate to start</p>
              </div>
            </div>
          )}
        </div>
      </NeonCard>
    </div>
  )
}
