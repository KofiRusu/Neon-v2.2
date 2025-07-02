"use client"

import type React from "react"

import Navigation from "./navigation"
import { Bell, Search } from "lucide-react"

interface PageLayoutProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  actions?: React.ReactNode
}

export default function PageLayout({ children, title, subtitle, actions }: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      <Navigation />

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Top Bar */}
        <div className="nav-glass border-b border-white/10 lg:border-l-0">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex-1">
                {title && (
                  <div>
                    <h1 className="text-2xl font-bold text-white">{title}</h1>
                    {subtitle && <p className="text-sm text-gray-400 mt-1">{subtitle}</p>}
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-4">
                {actions}
                <button className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5">
                  <Search className="w-5 h-5" />
                </button>
                <button className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 relative">
                  <Bell className="w-5 h-5" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-neon-pink rounded-full"></div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="px-4 sm:px-6 lg:px-8 py-8">{children}</main>
      </div>
    </div>
  )
}
