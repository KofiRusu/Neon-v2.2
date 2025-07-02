"use client"

import { motion } from "framer-motion"
import { Bot, Activity, Clock, Zap } from "lucide-react"
import NeonCard from "./neon-card"

interface AgentStatusCardProps {
  name: string
  status: "active" | "idle" | "training" | "error"
  performance: number
  tasksCompleted: number
  lastActive: string
  description: string
}

const statusConfig = {
  active: {
    color: "text-neon-green",
    bg: "bg-neon-green/20",
    border: "border-neon-green/30",
    pulse: "status-pulse",
  },
  idle: {
    color: "text-gray-400",
    bg: "bg-gray-500/20",
    border: "border-gray-500/30",
    pulse: "",
  },
  training: {
    color: "text-neon-blue",
    bg: "bg-neon-blue/20",
    border: "border-neon-blue/30",
    pulse: "status-pulse-blue",
  },
  error: {
    color: "text-neon-pink",
    bg: "bg-neon-pink/20",
    border: "border-neon-pink/30",
    pulse: "status-pulse-pink",
  },
}

export default function AgentStatusCard({
  name,
  status,
  performance,
  tasksCompleted,
  lastActive,
  description,
}: AgentStatusCardProps) {
  const config = statusConfig[status]

  return (
    <NeonCard glow="blue" className="group">
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
            <p className="text-xs text-gray-400">{description}</p>
          </div>
        </div>
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full border ${config.bg} ${config.border} ${config.color}`}
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Performance</span>
          <span className="text-lg font-bold text-neon-green">{performance}%</span>
        </div>

        <div className="neon-progress h-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${performance}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="neon-progress-bar"
          />
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-neon-blue" />
            <div>
              <p className="text-gray-400">Completed</p>
              <p className="font-semibold text-white">{tasksCompleted.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-neon-purple" />
            <div>
              <p className="text-gray-400">Last Active</p>
              <p className="font-semibold text-white">{lastActive}</p>
            </div>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full neon-btn flex items-center justify-center space-x-2"
        >
          <Zap className="w-4 h-4" />
          <span>Run Agent</span>
        </motion.button>
      </div>
    </NeonCard>
  )
}
