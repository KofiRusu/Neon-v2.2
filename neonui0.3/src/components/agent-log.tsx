"use client"

import { motion } from "framer-motion"
import { useState, useEffect, useRef } from "react"
import { Terminal, Download, CloudyIcon as Clear, Search } from "lucide-react"

interface LogEntry {
  id: string
  timestamp: string
  level: "info" | "warning" | "error" | "success"
  message: string
  agentId?: string
  taskId?: string
  metadata?: Record<string, any>
}

interface AgentLogProps {
  agentId: string
  logs: LogEntry[]
  isLive?: boolean
  onClear?: () => void
  onExport?: () => void
}

const levelColors = {
  info: "text-neon-blue",
  warning: "text-yellow-400",
  error: "text-neon-pink",
  success: "text-neon-green",
}

const levelBgs = {
  info: "bg-neon-blue/20",
  warning: "bg-yellow-400/20",
  error: "bg-neon-pink/20",
  success: "bg-neon-green/20",
}

export default function AgentLog({ agentId, logs, isLive = false, onClear, onExport }: AgentLogProps) {
  const [filter, setFilter] = useState<string>("")
  const [levelFilter, setLevelFilter] = useState<string>("all")
  const [autoScroll, setAutoScroll] = useState(true)
  const logContainerRef = useRef<HTMLDivElement>(null)

  const filteredLogs = logs.filter((log) => {
    const matchesText = log.message.toLowerCase().includes(filter.toLowerCase())
    const matchesLevel = levelFilter === "all" || log.level === levelFilter
    return matchesText && matchesLevel
  })

  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight
    }
  }, [logs, autoScroll])

  return (
    <div className="neon-card h-96 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-neon-green/20 text-neon-green">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Agent Logs</h3>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-400">Agent: {agentId}</span>
              {isLive && (
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-neon-green rounded-full status-pulse"></div>
                  <span className="text-xs text-neon-green">Live</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onExport}
            className="neon-glass p-2 rounded-lg text-gray-400 hover:text-white"
          >
            <Download className="w-4 h-4" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClear}
            className="neon-glass p-2 rounded-lg text-gray-400 hover:text-neon-pink"
          >
            <Clear className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search logs..."
            className="w-full neon-glass border border-white/10 rounded-lg bg-transparent py-2 pl-10 pr-4 text-sm text-white placeholder-gray-400 focus:border-neon-blue/50 focus:outline-none focus:ring-1 focus:ring-neon-blue/50"
          />
        </div>

        <select
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value)}
          className="neon-glass border border-white/10 rounded-lg px-3 py-2 text-sm text-white bg-transparent focus:border-neon-blue/50 focus:outline-none focus:ring-1 focus:ring-neon-blue/50"
        >
          <option value="all" className="bg-gray-800">
            All Levels
          </option>
          <option value="info" className="bg-gray-800">
            Info
          </option>
          <option value="warning" className="bg-gray-800">
            Warning
          </option>
          <option value="error" className="bg-gray-800">
            Error
          </option>
          <option value="success" className="bg-gray-800">
            Success
          </option>
        </select>

        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={autoScroll}
            onChange={(e) => setAutoScroll(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-neon-blue"></div>
          <span className="text-xs text-gray-400">Auto-scroll</span>
        </label>
      </div>

      {/* Log Container */}
      <div ref={logContainerRef} className="flex-1 overflow-y-auto space-y-2 font-mono text-sm">
        {filteredLogs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <Terminal className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No logs to display</p>
              {filter && <p className="text-xs mt-1">Try adjusting your filters</p>}
            </div>
          </div>
        ) : (
          filteredLogs.map((log, index) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.02 }}
              className="flex items-start space-x-3 p-2 rounded hover:bg-white/5 transition-colors"
            >
              <span className="text-xs text-gray-500 w-20 flex-shrink-0">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full ${levelBgs[log.level]} ${levelColors[log.level]} w-16 text-center flex-shrink-0`}
              >
                {log.level.toUpperCase()}
              </span>
              <span className="text-gray-300 flex-1">{log.message}</span>
              {log.taskId && (
                <span className="text-xs text-gray-500 flex-shrink-0">Task: {log.taskId.slice(0, 8)}</span>
              )}
            </motion.div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs text-gray-400">
        <span>
          {filteredLogs.length} of {logs.length} entries
        </span>
        <span>
          Last updated: {logs.length > 0 ? new Date(logs[logs.length - 1]?.timestamp).toLocaleTimeString() : "Never"}
        </span>
      </div>
    </div>
  )
}
