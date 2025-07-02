"use client"

import type React from "react"

import { motion } from "framer-motion"
import { useState } from "react"
import { Play, Settings, Code, FileText, Zap } from "lucide-react"

interface AgentSchema {
  name: string
  type: string
  required: boolean
  description: string
  default?: any
  options?: string[]
}

interface AgentRunnerProps {
  agentId: string
  agentName: string
  schema: AgentSchema[]
  onRun: (params: Record<string, any>) => void
  isRunning?: boolean
}

export default function AgentRunner({ agentId, agentName, schema, onRun, isRunning = false }: AgentRunnerProps) {
  const [params, setParams] = useState<Record<string, any>>({})
  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onRun(params)
  }

  const updateParam = (name: string, value: any) => {
    setParams((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <div className="neon-card">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-neon-blue/20 text-neon-blue">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Run {agentName}</h3>
            <p className="text-sm text-gray-400">Configure and execute agent</p>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="neon-glass p-2 rounded-lg text-gray-400 hover:text-white"
        >
          <Settings className="w-4 h-4" />
        </motion.button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {schema.map((field) => (
          <div key={field.name} className="space-y-2">
            <label className="block text-sm font-medium text-white">
              {field.name}
              {field.required && <span className="text-neon-pink ml-1">*</span>}
            </label>
            <p className="text-xs text-gray-400">{field.description}</p>

            {field.type === "string" && !field.options && (
              <input
                type="text"
                value={params[field.name] || field.default || ""}
                onChange={(e) => updateParam(field.name, e.target.value)}
                className="w-full neon-glass border border-white/10 rounded-lg px-3 py-2 text-white bg-transparent focus:border-neon-blue/50 focus:outline-none focus:ring-1 focus:ring-neon-blue/50"
                placeholder={field.default || `Enter ${field.name}...`}
              />
            )}

            {field.type === "text" && (
              <textarea
                value={params[field.name] || field.default || ""}
                onChange={(e) => updateParam(field.name, e.target.value)}
                rows={3}
                className="w-full neon-glass border border-white/10 rounded-lg px-3 py-2 text-white bg-transparent focus:border-neon-blue/50 focus:outline-none focus:ring-1 focus:ring-neon-blue/50 resize-none"
                placeholder={field.default || `Enter ${field.name}...`}
              />
            )}

            {field.options && (
              <select
                value={params[field.name] || field.default || ""}
                onChange={(e) => updateParam(field.name, e.target.value)}
                className="w-full neon-glass border border-white/10 rounded-lg px-3 py-2 text-white bg-transparent focus:border-neon-blue/50 focus:outline-none focus:ring-1 focus:ring-neon-blue/50"
              >
                <option value="" className="bg-gray-800">
                  Select {field.name}
                </option>
                {field.options.map((option) => (
                  <option key={option} value={option} className="bg-gray-800">
                    {option}
                  </option>
                ))}
              </select>
            )}

            {field.type === "boolean" && (
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={params[field.name] || field.default || false}
                  onChange={(e) => updateParam(field.name, e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-neon-blue"></div>
                <span className="text-sm text-gray-300">Enable {field.name}</span>
              </label>
            )}
          </div>
        ))}

        {showAdvanced && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4 border-t border-white/10 pt-4"
          >
            <h4 className="text-sm font-medium text-white flex items-center space-x-2">
              <Code className="w-4 h-4" />
              <span>Advanced Configuration</span>
            </h4>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-white">Memory Context</label>
              <textarea
                value={params.memoryContext || ""}
                onChange={(e) => updateParam("memoryContext", e.target.value)}
                rows={2}
                className="w-full neon-glass border border-white/10 rounded-lg px-3 py-2 text-white bg-transparent focus:border-neon-blue/50 focus:outline-none focus:ring-1 focus:ring-neon-blue/50 resize-none"
                placeholder="Additional context for agent memory..."
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-white">Reasoning Mode</label>
              <select
                value={params.reasoningMode || "standard"}
                onChange={(e) => updateParam("reasoningMode", e.target.value)}
                className="w-full neon-glass border border-white/10 rounded-lg px-3 py-2 text-white bg-transparent focus:border-neon-blue/50 focus:outline-none focus:ring-1 focus:ring-neon-blue/50"
              >
                <option value="standard" className="bg-gray-800">
                  Standard
                </option>
                <option value="detailed" className="bg-gray-800">
                  Detailed
                </option>
                <option value="creative" className="bg-gray-800">
                  Creative
                </option>
                <option value="analytical" className="bg-gray-800">
                  Analytical
                </option>
              </select>
            </div>
          </motion.div>
        )}

        <div className="flex space-x-3 pt-4">
          <motion.button
            type="submit"
            disabled={isRunning}
            whileHover={{ scale: isRunning ? 1 : 1.02 }}
            whileTap={{ scale: isRunning ? 1 : 0.98 }}
            className="flex-1 neon-btn flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRunning ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                />
                <span>Running...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Run Agent</span>
              </>
            )}
          </motion.button>

          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="neon-btn-purple flex items-center space-x-2"
          >
            <FileText className="w-4 h-4" />
            <span>Save Config</span>
          </motion.button>
        </div>
      </form>
    </div>
  )
}
