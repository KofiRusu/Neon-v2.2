"use client"

import PageLayout from "@/components/page-layout"
import { useState } from "react"
import { User, Bell, Shield, CreditCard, Palette, Globe, Key, Mail, Smartphone, Save, Eye, EyeOff } from "lucide-react"

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile")
  const [showApiKey, setShowApiKey] = useState(false)
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    sms: true,
    marketing: false,
  })

  const tabs = [
    { id: "profile", name: "Profile", icon: User },
    { id: "notifications", name: "Notifications", icon: Bell },
    { id: "security", name: "Security", icon: Shield },
    { id: "billing", name: "Billing", icon: CreditCard },
    { id: "appearance", name: "Appearance", icon: Palette },
    { id: "integrations", name: "Integrations", icon: Globe },
    { id: "api", name: "API Keys", icon: Key },
  ]

  const actions = (
    <button className="btn-neon text-sm">
      <Save className="w-4 h-4 mr-2" />
      Save Changes
    </button>
  )

  return (
    <PageLayout title="Settings" subtitle="Manage your account preferences and configurations" actions={actions}>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Settings Navigation */}
        <div className="lg:col-span-1">
          <div className="glass-strong p-4 rounded-lg">
            <nav className="space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                    activeTab === tab.id
                      ? "bg-neon-blue/20 text-neon-blue border border-neon-blue/30"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          <div className="glass-strong p-6 rounded-lg">
            {activeTab === "profile" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Profile Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">First Name</label>
                      <input
                        type="text"
                        defaultValue="Admin"
                        className="w-full glass border border-white/10 rounded-lg px-3 py-2 text-white bg-transparent focus:border-neon-blue/50 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Last Name</label>
                      <input
                        type="text"
                        defaultValue="User"
                        className="w-full glass border border-white/10 rounded-lg px-3 py-2 text-white bg-transparent focus:border-neon-blue/50 focus:outline-none"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-400 mb-2">Email Address</label>
                      <input
                        type="email"
                        defaultValue="admin@neonhub.ai"
                        className="w-full glass border border-white/10 rounded-lg px-3 py-2 text-white bg-transparent focus:border-neon-blue/50 focus:outline-none"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-400 mb-2">Company</label>
                      <input
                        type="text"
                        defaultValue="NeonHub Technologies"
                        className="w-full glass border border-white/10 rounded-lg px-3 py-2 text-white bg-transparent focus:border-neon-blue/50 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Profile Picture</h3>
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-neon-pink to-neon-purple rounded-full"></div>
                    <div>
                      <button className="btn-neon text-sm">Upload New Photo</button>
                      <p className="text-xs text-gray-400 mt-1">JPG, PNG or GIF. Max size 2MB.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Notification Preferences</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 glass rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Mail className="w-5 h-5 text-neon-blue" />
                        <div>
                          <p className="font-medium text-white">Email Notifications</p>
                          <p className="text-sm text-gray-400">Receive updates via email</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifications.email}
                          onChange={(e) => setNotifications({ ...notifications, email: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-neon-blue"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 glass rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Bell className="w-5 h-5 text-neon-purple" />
                        <div>
                          <p className="font-medium text-white">Push Notifications</p>
                          <p className="text-sm text-gray-400">Browser push notifications</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifications.push}
                          onChange={(e) => setNotifications({ ...notifications, push: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-neon-blue"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 glass rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Smartphone className="w-5 h-5 text-neon-green" />
                        <div>
                          <p className="font-medium text-white">SMS Notifications</p>
                          <p className="text-sm text-gray-400">Important alerts via SMS</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifications.sms}
                          onChange={(e) => setNotifications({ ...notifications, sms: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-neon-blue"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "security" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Password & Security</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Current Password</label>
                      <input
                        type="password"
                        className="w-full glass border border-white/10 rounded-lg px-3 py-2 text-white bg-transparent focus:border-neon-blue/50 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">New Password</label>
                      <input
                        type="password"
                        className="w-full glass border border-white/10 rounded-lg px-3 py-2 text-white bg-transparent focus:border-neon-blue/50 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Confirm New Password</label>
                      <input
                        type="password"
                        className="w-full glass border border-white/10 rounded-lg px-3 py-2 text-white bg-transparent focus:border-neon-blue/50 focus:outline-none"
                      />
                    </div>
                    <button className="btn-neon text-sm">Update Password</button>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Two-Factor Authentication</h3>
                  <div className="glass p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-white">2FA Status</p>
                        <p className="text-sm text-gray-400">Add an extra layer of security</p>
                      </div>
                      <button className="btn-neon-green text-sm">Enable 2FA</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "api" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">API Keys</h3>
                  <div className="space-y-4">
                    <div className="glass p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-medium text-white">Production API Key</p>
                          <p className="text-sm text-gray-400">Use this key for production environments</p>
                        </div>
                        <button
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5"
                        >
                          {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <div className="flex items-center space-x-3">
                        <code className="flex-1 glass border border-white/10 rounded px-3 py-2 text-sm text-neon-blue font-mono">
                          {showApiKey ? "neon_prod_1234567890abcdef" : "neon_prod_••••••••••••••••"}
                        </code>
                        <button className="btn-neon text-sm">Copy</button>
                        <button className="btn-neon-pink text-sm">Regenerate</button>
                      </div>
                    </div>

                    <div className="glass p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-medium text-white">Development API Key</p>
                          <p className="text-sm text-gray-400">Use this key for testing and development</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <code className="flex-1 glass border border-white/10 rounded px-3 py-2 text-sm text-neon-purple font-mono">
                          neon_dev_••••••••••••••••
                        </code>
                        <button className="btn-neon text-sm">Copy</button>
                        <button className="btn-neon-pink text-sm">Regenerate</button>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">API Usage</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="glass p-4 rounded-lg">
                      <p className="text-sm text-gray-400">Requests Today</p>
                      <p className="text-2xl font-bold text-neon-blue">1,247</p>
                    </div>
                    <div className="glass p-4 rounded-lg">
                      <p className="text-sm text-gray-400">Monthly Limit</p>
                      <p className="text-2xl font-bold text-neon-green">50,000</p>
                    </div>
                    <div className="glass p-4 rounded-lg">
                      <p className="text-sm text-gray-400">Remaining</p>
                      <p className="text-2xl font-bold text-neon-purple">48,753</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
