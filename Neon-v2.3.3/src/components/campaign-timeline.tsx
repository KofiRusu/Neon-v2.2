"use client"

import { motion } from "framer-motion"
import { CheckCircle, Clock, AlertCircle, Play } from "lucide-react"

interface TimelineStep {
  id: string
  title: string
  status: "completed" | "active" | "pending" | "error"
  date: string
  description?: string
}

interface CampaignTimelineProps {
  steps: TimelineStep[]
}

const statusConfig = {
  completed: {
    icon: CheckCircle,
    color: "text-neon-green",
    bg: "bg-neon-green/20",
    border: "border-neon-green/30",
  },
  active: {
    icon: Play,
    color: "text-neon-blue",
    bg: "bg-neon-blue/20",
    border: "border-neon-blue/30",
  },
  pending: {
    icon: Clock,
    color: "text-gray-400",
    bg: "bg-gray-500/20",
    border: "border-gray-500/30",
  },
  error: {
    icon: AlertCircle,
    color: "text-neon-pink",
    bg: "bg-neon-pink/20",
    border: "border-neon-pink/30",
  },
}

export default function CampaignTimeline({ steps }: CampaignTimelineProps) {
  return (
    <div className="space-y-4">
      {steps.map((step, index) => {
        const config = statusConfig[step.status]
        const Icon = config.icon

        return (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-start space-x-4"
          >
            <div className="relative">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border ${config.bg} ${config.border} ${config.color}`}
              >
                <Icon className="w-5 h-5" />
              </div>
              {index < steps.length - 1 && (
                <div className="absolute top-10 left-1/2 w-0.5 h-8 bg-white/20 transform -translate-x-1/2"></div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-white">{step.title}</h4>
                <span className="text-xs text-gray-400">{step.date}</span>
              </div>
              {step.description && <p className="text-xs text-gray-400 mt-1">{step.description}</p>}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
