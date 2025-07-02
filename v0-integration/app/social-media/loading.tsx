"use client"

import { motion } from "framer-motion"
import { Share2 } from "lucide-react"

export default function SocialMediaLoading() {
  return (
    <div className="p-6 space-y-8">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-gray-700/50 rounded animate-pulse" />
          <div className="h-4 w-96 bg-gray-700/30 rounded animate-pulse" />
        </div>
        <div className="flex space-x-3">
          <div className="h-10 w-32 bg-gray-700/50 rounded animate-pulse" />
          <div className="h-10 w-28 bg-gray-700/50 rounded animate-pulse" />
        </div>
      </div>

      {/* Platform cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="neon-glass-strong p-6 rounded-lg border border-white/10"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-700/50 rounded-full animate-pulse" />
                <div className="h-5 w-20 bg-gray-700/50 rounded animate-pulse" />
              </div>
              <div className="w-3 h-3 bg-gray-700/50 rounded-full animate-pulse" />
            </div>
            <div className="space-y-3">
              {[...Array(4)].map((_, j) => (
                <div key={j} className="flex justify-between">
                  <div className="h-4 w-16 bg-gray-700/30 rounded animate-pulse" />
                  <div className="h-4 w-12 bg-gray-700/50 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main content skeleton */}
      <div className="neon-glass-strong rounded-lg border border-white/10">
        <div className="border-b border-white/10 p-6">
          <div className="flex space-x-8">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-6 w-24 bg-gray-700/50 rounded animate-pulse" />
            ))}
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="neon-glass p-4 rounded-lg border border-white/5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-700/50 rounded-full animate-pulse" />
                      <div className="space-y-1">
                        <div className="h-4 w-20 bg-gray-700/50 rounded animate-pulse" />
                        <div className="h-3 w-16 bg-gray-700/30 rounded animate-pulse" />
                      </div>
                    </div>
                    <div className="h-6 w-16 bg-gray-700/50 rounded-full animate-pulse" />
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="h-4 w-full bg-gray-700/30 rounded animate-pulse" />
                    <div className="h-4 w-3/4 bg-gray-700/30 rounded animate-pulse" />
                    <div className="h-4 w-1/2 bg-gray-700/30 rounded animate-pulse" />
                  </div>
                  <div className="flex space-x-6">
                    {[...Array(4)].map((_, j) => (
                      <div key={j} className="h-4 w-12 bg-gray-700/30 rounded animate-pulse" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="neon-glass-strong p-6 rounded-lg border border-white/10">
                  <div className="h-5 w-32 bg-gray-700/50 rounded animate-pulse mb-4" />
                  <div className="space-y-3">
                    {[...Array(4)].map((_, j) => (
                      <div key={j} className="flex justify-between">
                        <div className="h-4 w-20 bg-gray-700/30 rounded animate-pulse" />
                        <div className="h-4 w-12 bg-gray-700/50 rounded animate-pulse" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Loading indicator */}
      <div className="fixed bottom-8 right-8">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          className="w-12 h-12 bg-gradient-to-r from-neon-blue to-neon-purple rounded-full flex items-center justify-center neon-glow-blue"
        >
          <Share2 className="w-6 h-6 text-white" />
        </motion.div>
      </div>
    </div>
  )
}
