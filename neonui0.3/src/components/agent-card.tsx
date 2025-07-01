"use client"

import { motion } from "framer-motion"
import { Bot, Activity, Clock, Settings, Play, Pause, AlertCircle } from "lucide-react"
import { useState } from "react"
import { AnimatePresence } from "framer-motion"

interface AgentCardProps {
  id: string
  name: string
  type: string
  status: "active" | "idle" | "training" | "error" | "paused"
  performance: number
  tasksCompleted: number
  tasksActive: number
  lastActive: string
  description: string
  capabilities: string[]
  memoryUsage?: number
  reasoning?: {
    currentTask?: string
    confidence?: number
    nextAction?: string
  }
}

const statusConfig = {
  active: {
    color: "text-neon-green",
    bg: "bg-neon-green/20",
    border: "border-neon-green/30",
    pulse: "status-pulse",
    icon: Activity,
  },
  idle: {
    color: "text-gray-400",
    bg: "bg-gray-500/20",
    border: "border-gray-500/30",
    pulse: "",
    icon: Clock,
  },
  training: {
    color: "text-neon-blue",
    bg: "bg-neon-blue/20",
    border: "border-neon-blue/30",
    pulse: "status-pulse-blue",
    icon: Bot,
  },
  error: {
    color: "text-neon-pink",
    bg: "bg-neon-pink/20",
    border: "border-neon-pink/30",
    pulse: "status-pulse-pink",
    icon: AlertCircle,
  },
  paused: {
    color: "text-yellow-400",
    bg: "bg-yellow-400/20",
    border: "border-yellow-400/30",
    pulse: "",
    icon: Pause,
  },
}

export default function AgentCard({
  id,
  name,
  type,
  status,
  performance,
  tasksCompleted,
  tasksActive,
  lastActive,
  description,
  capabilities,
  memoryUsage = 0,
  reasoning,
}: AgentCardProps) {
  const [expanded, setExpanded] = useState(false)
  const config = statusConfig[status]
  const StatusIcon = config.icon

  return (
    <motion.div
      layout
      className="neon-card group cursor-pointer"
      whileHover={{ y: -4, scale: 1.02 }}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="p-3 rounded-lg bg-white/5 text-neon-blue">
              <Bot className="w-6 h-6" />
            </div>
            <div
              className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${config.bg} ${config.border} border ${config.pulse}`}
            ></div>
          </div>
          <div>
            <h3 className="font-semibold text-white group-hover:text-neon-blue transition-colors">{name}</h3>
            <p className="text-xs text-gray-400">{type}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full border ${config.bg} ${config.border} ${config.color} flex items-center space-x-1`}
          >
            <StatusIcon className="w-3 h-3" />
            <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm text-gray-300">{description}</p>

        {/* Performance Metrics */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-gray-400">Performance</span>
              <span className="text-neon-green font-semibold">{performance}%</span>
            </div>
            <div className="neon-progress h-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${performance}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="neon-progress-bar"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-gray-400">Memory</span>
              <span className="text-neon-purple font-semibold">{memoryUsage}%</span>
            </div>
            <div className="neon-progress h-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${memoryUsage}%` }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                className="bg-gradient-to-r from-neon-purple to-neon-pink h-2 rounded-full"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-400">Completed</p>
            <p className="font-semibold text-white">{tasksCompleted.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-gray-400">Active Tasks</p>
            <p className="font-semibold text-neon-blue">{tasksActive}</p>
          </div>
        </div>

        {/* Reasoning Display */}
        {reasoning && (
          <div className="neon-glass p-3 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Bot className="w-4 h-4 text-neon-purple" />
              <span className="text-sm font-medium text-white">AI Reasoning</span>
            </div>
            {reasoning.currentTask && (
              <p className="text-xs text-gray-300 mb-1">
                <span className="text-neon-blue">Current:</span> {reasoning.currentTask}
              </p>
            )}
            {reasoning.confidence && (
              <p className="text-xs text-gray-300 mb-1">
                <span className="text-neon-green">Confidence:</span> {reasoning.confidence}%
              </p>
            )}
            {reasoning.nextAction && (
              <p className="text-xs text-gray-300">
                <span className="text-neon-pink">Next:</span> {reasoning.nextAction}
              </p>
            )}
          </div>
        )}

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3"
            >
              {/* Capabilities */}
              <div>
                <h4 className="text-sm font-medium text-white mb-2">Capabilities</h4>
                <div className="flex flex-wrap gap-1">
                  {capabilities.map((capability, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 text-xs bg-neon-blue/20 text-neon-blue rounded-full border border-neon-blue/30"
                    >
                      {capability}
                    </span>
                  ))}
                </div>
              </div>

              {/* Last Active */}
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>Last active: {lastActive}</span>
                <span>ID: {id}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <div className="flex space-x-2 pt-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 neon-btn text-xs py-2 flex items-center justify-center space-x-1"
          >
            {status === "active" ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            <span>{status === "active" ? "Pause" : "Run"}</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 neon-glass border border-white/10 text-xs py-2 rounded-lg text-gray-400 hover:text-white transition-colors flex items-center justify-center space-x-1"
          >
            <Settings className="w-3 h-3" />
            <span>Config</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}
