"use client"

import { motion } from "framer-motion"
import type { ReactNode } from "react"

interface NeonCardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  glow?: "blue" | "purple" | "pink" | "green"
  onClick?: () => void
}

export default function NeonCard({ children, className = "", hover = true, glow, onClick }: NeonCardProps) {
  const glowClasses = {
    blue: "hover:border-neon-blue/50 hover:shadow-neon-blue/20",
    purple: "hover:border-neon-purple/50 hover:shadow-neon-purple/20",
    pink: "hover:border-neon-pink/50 hover:shadow-neon-pink/20",
    green: "hover:border-neon-green/50 hover:shadow-neon-green/20",
  }

  return (
    <motion.div
      whileHover={hover ? { y: -4, scale: 1.02 } : {}}
      whileTap={onClick ? { scale: 0.98 } : {}}
      className={`neon-card cursor-${onClick ? "pointer" : "default"} ${glow ? glowClasses[glow] : ""} ${className}`}
      onClick={onClick}
    >
      {children}
    </motion.div>
  )
}
