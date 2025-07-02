"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  Bot,
  FileText,
  Home,
  Mail,
  Menu,
  Settings,
  Target,
  X,
  Zap,
  Bell,
  Search,
  User,
  LogOut,
  Brain,
  Megaphone,
  Users,
  Activity,
} from "lucide-react"
import { useTheme } from "./theme-provider"

const navigationItems = [
  { name: "Dashboard", href: "/dashboard", icon: Home, description: "Overview & quick actions" },
  { name: "Campaigns", href: "/campaigns", icon: Target, description: "Campaign orchestration" },
  { name: "Agents", href: "/agents", icon: Bot, description: "AI agent management" },
  { name: "Content", href: "/content", icon: FileText, description: "Content generation studio" },
  { name: "Social Media", href: "/social-media", icon: Megaphone, description: "Social media management" },
  { name: "Brand Voice", href: "/brand-voice", icon: Brain, description: "Brand voice consistency" },
  { name: "Analytics", href: "/analytics", icon: BarChart3, description: "Performance insights" },
  { name: "Email", href: "/email", icon: Mail, description: "Email marketing campaigns" },
  { name: "Team", href: "/team", icon: Users, description: "Team collaboration" },
  { name: "Billing", href: "/billing", icon: Settings, description: "Billing & subscription" },
  { name: "Settings", href: "/settings", icon: Settings, description: "Platform settings" },
]

interface AppShellProps {
  children: React.ReactNode
}

export default function AppShell({ children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [notifications, setNotifications] = useState(3)
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  // Simulate real-time notifications
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        setNotifications((prev) => prev + 1)
      }
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-space-gray via-space-gray/95 to-space-purple/20">
      {/* Mobile sidebar backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div
        initial={false}
        animate={{
          x: sidebarOpen ? 0 : "-100%",
        }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed inset-y-0 left-0 z-50 w-72 lg:translate-x-0 lg:static lg:inset-0"
      >
        <div className="flex h-full flex-col neon-glass-strong border-r border-neon-blue/20">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-6">
            <motion.div className="flex items-center space-x-3" whileHover={{ scale: 1.02 }}>
              <div className="relative">
                <div className="neon-glow-blue">
                  <Zap className="h-8 w-8 text-neon-blue" />
                </div>
                <motion.div
                  className="absolute -top-1 -right-1 w-3 h-3 bg-neon-green rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                />
              </div>
              <div>
                <h1 className="text-xl font-bold neon-text-gradient">NeonHub</h1>
                <p className="text-xs text-neon-blue/60">AI Marketing Platform</p>
              </div>
            </motion.div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>

          {/* Agent Status Indicator */}
          <div className="mx-4 mb-4 p-3 neon-glass rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-white">System Status</span>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-neon-green rounded-full status-pulse"></div>
                <span className="text-xs text-neon-green">All Systems Online</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>12 Agents Active</span>
              <span>98.7% Uptime</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-4 py-2 overflow-y-auto">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link key={item.name} href={item.href}>
                  <motion.div
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    className={`group flex items-center rounded-lg px-3 py-3 text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "neon-glass-active text-neon-blue border border-neon-blue/30"
                        : "text-gray-300 hover:neon-glass-hover hover:text-white"
                    }`}
                  >
                    <item.icon
                      className={`mr-3 h-5 w-5 transition-colors ${
                        isActive ? "text-neon-blue" : "text-gray-400 group-hover:text-gray-300"
                      }`}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-gray-500 group-hover:text-gray-400">{item.description}</div>
                    </div>
                    {isActive && (
                      <motion.div layoutId="activeTab" className="h-2 w-2 rounded-full bg-neon-blue neon-glow-blue" />
                    )}
                  </motion.div>
                </Link>
              )
            })}
          </nav>

          {/* User Profile */}
          <div className="border-t border-white/10 p-4">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-neon-blue to-neon-purple flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">Alex Chen</p>
                <p className="text-xs text-gray-400">Marketing Director</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-1 rounded-lg hover:bg-white/5 transition-colors"
              >
                <Settings className="h-4 w-4 text-gray-400" />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top bar */}
        <header className="neon-glass-strong border-b border-white/10 sticky top-0 z-30">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <Menu className="h-5 w-5 text-gray-400" />
              </button>

              {/* Breadcrumb */}
              <div className="hidden md:flex items-center space-x-2 text-sm">
                <span className="text-gray-400">NeonHub</span>
                <span className="text-gray-600">/</span>
                <span className="text-white font-medium">
                  {navigationItems.find((item) => item.href === pathname)?.name || "Dashboard"}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Global Search */}
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search agents, campaigns..."
                  className="neon-glass w-64 rounded-lg border border-white/10 bg-transparent py-2 pl-10 pr-4 text-sm text-white placeholder-gray-400 focus:border-neon-blue/50 focus:outline-none focus:ring-1 focus:ring-neon-blue/50"
                />
              </div>

              {/* AI Assistant */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative p-2 rounded-lg hover:bg-white/5 transition-colors group"
              >
                <Brain className="h-5 w-5 text-neon-purple group-hover:text-neon-blue transition-colors" />
                <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-neon-purple neon-glow-purple"></span>
              </motion.button>

              {/* Notifications */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative p-2 rounded-lg hover:bg-white/5 transition-colors"
                onClick={() => setNotifications(0)}
              >
                <Bell className="h-5 w-5 text-gray-400" />
                {notifications > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-neon-pink text-xs font-medium text-white flex items-center justify-center neon-glow-pink"
                  >
                    {notifications > 9 ? "9+" : notifications}
                  </motion.span>
                )}
              </motion.button>

              {/* User menu */}
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 rounded-lg p-2 hover:bg-white/5 transition-colors"
                >
                  <div className="h-8 w-8 rounded-full bg-gradient-to-r from-neon-blue to-neon-purple"></div>
                </motion.button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      className="absolute right-0 mt-2 w-48 neon-glass-strong border border-white/10 rounded-lg shadow-lg"
                    >
                      <div className="py-1">
                        <a
                          href="#"
                          className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                        >
                          <User className="mr-3 h-4 w-4" />
                          Profile
                        </a>
                        <a
                          href="#"
                          className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                        >
                          <Activity className="mr-3 h-4 w-4" />
                          Activity Log
                        </a>
                        <a
                          href="#"
                          className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                        >
                          <Settings className="mr-3 h-4 w-4" />
                          Settings
                        </a>
                        <hr className="my-1 border-white/10" />
                        <button
                          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                        >
                          <Zap className="mr-3 h-4 w-4" />
                          Toggle Theme
                        </button>
                        <a
                          href="#"
                          className="flex items-center px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                        >
                          <LogOut className="mr-3 h-4 w-4" />
                          Sign out
                        </a>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}
