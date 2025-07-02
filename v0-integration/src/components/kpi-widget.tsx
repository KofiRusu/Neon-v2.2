"use client"

import type React from "react"

import { motion } from "framer-motion"
import { TrendingUp, TrendingDown } from "lucide-react"
import { useEffect, useState } from "react"
import NeonCard from "./neon-card"

interface KPIWidgetProps {
  title: string
  value: number
  change: number
  format?: "number" | "currency" | "percentage"
  icon: React.ReactNode
  color?: "blue" | "purple" | "pink" | "green"
}

export default function KPIWidget({ title, value, change, format = "number", icon, color = "blue" }: KPIWidgetProps) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayValue(value)
    }, 100)
    return () => clearTimeout(timer)
  }, [value])

  const formatValue = (val: number) => {
    switch (format) {
      case "currency":
        return `$${val.toLocaleString()}`
      case "percentage":
        return `${val}%`
      default:
        return val.toLocaleString()
    }
  }

  const colorClasses = {
    blue: "text-neon-blue",
    purple: "text-neon-purple",
    pink: "text-neon-pink",
    green: "text-neon-green",
  }

  const isPositive = change >= 0

  return (
    <NeonCard glow={color}>
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg bg-white/5 ${colorClasses[color]}`}>{icon}</div>
        <div className={`flex items-center space-x-1 text-sm ${isPositive ? "text-neon-green" : "text-neon-pink"}`}>
          {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          <span>
            {isPositive ? "+" : ""}
            {change}%
          </span>
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-sm text-gray-400">{title}</p>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`text-3xl font-bold counter-animate ${colorClasses[color]}`}
        >
          {formatValue(displayValue)}
        </motion.p>
      </div>
    </NeonCard>
  )
}
