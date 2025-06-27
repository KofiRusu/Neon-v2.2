'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function ExecutiveInsightsPage() {
  const [activeTab, setActiveTab] = useState('insights');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            🧠 Executive Intelligence Center
          </h1>
          <p className="text-gray-300 mt-2">
            CMO-ready insights, reports, and strategic intelligence
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 bg-gray-800/50 backdrop-blur-sm rounded-lg p-1">
          {[
            { id: 'insights', label: '🔍 Insights Feed', count: 4 },
            { id: 'reports', label: '📊 Executive Reports', count: 2 },
            { id: 'analytics', label: '📈 Analytics Dashboard', count: 0 },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-md font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-2 px-2 py-1 text-xs rounded-full bg-blue-500/20 text-blue-400">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Primary Content */}
          <div className="lg:col-span-2 space-y-6">
            {activeTab === 'insights' && (
              <div className="space-y-4">
                {/* High Impact Insight */}
                <Card className="bg-gray-800/40 backdrop-blur-sm border-orange-500/30">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-orange-400">
                          🚨 Exceptional Campaign Performance - Holiday Promo ROAS 2.1x
                        </CardTitle>
                        <p className="text-gray-400 text-sm mt-1">
                          PERFORMANCE_TREND • 2 hours ago
                        </p>
                      </div>
                      <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                        HIGH
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-300 mb-4">
                      Holiday promotion campaign achieved 2.1x ROAS, significantly exceeding targets
                      with 3.2% conversion rate and strong brand alignment (89%).
                    </p>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-400">Business Impact</p>
                        <p className="text-lg font-semibold text-green-400">89%</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Confidence</p>
                        <p className="text-lg font-semibold text-blue-400">94%</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {['AD_AGENT', 'CONTENT_AGENT', 'BRAND_VOICE_AGENT'].map(agent => (
                        <Badge
                          key={agent}
                          variant="outline"
                          className="border-blue-500/30 text-blue-400 text-xs"
                        >
                          {agent}
                        </Badge>
                      ))}
                    </div>
                    <Button className="w-full bg-orange-500/20 text-orange-400 hover:bg-orange-500/30">
                      View Recommendations
                    </Button>
                  </CardContent>
                </Card>

                {/* Medium Impact Insight */}
                <Card className="bg-gray-800/40 backdrop-blur-sm border-blue-500/30">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-blue-400">
                          ⚡ Agent Collaboration Optimization - 25% Performance Boost
                        </CardTitle>
                        <p className="text-gray-400 text-sm mt-1">
                          AGENT_RECOMMENDATION • 4 hours ago
                        </p>
                      </div>
                      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                        MEDIUM
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-300 mb-4">
                      Analysis reveals ContentAgent + BrandVoiceAgent collaboration achieves 92%
                      success rate. System-wide implementation could improve performance by 25%.
                    </p>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-400">Business Impact</p>
                        <p className="text-lg font-semibold text-yellow-400">76%</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Confidence</p>
                        <p className="text-lg font-semibold text-blue-400">85%</p>
                      </div>
                    </div>
                    <Button className="w-full bg-blue-500/20 text-blue-400 hover:bg-blue-500/30">
                      Implement Optimization
                    </Button>
                  </CardContent>
                </Card>

                {/* Market Intelligence */}
                <Card className="bg-gray-800/40 backdrop-blur-sm border-purple-500/30">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-purple-400">
                          🔮 Strategic Market Intelligence - Video Content Surge
                        </CardTitle>
                        <p className="text-gray-400 text-sm mt-1">
                          MARKET_INTELLIGENCE • 6 hours ago
                        </p>
                      </div>
                      <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                        HIGH
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-300 mb-4">
                      Video content showing 40% higher engagement rates across all campaigns. Major
                      trend shift indicates strategic opportunity for Q2 planning.
                    </p>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-400">Business Impact</p>
                        <p className="text-lg font-semibold text-green-400">91%</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Confidence</p>
                        <p className="text-lg font-semibold text-blue-400">88%</p>
                      </div>
                    </div>
                    <Button className="w-full bg-purple-500/20 text-purple-400 hover:bg-purple-500/30">
                      Develop Strategy
                    </Button>
                  </CardContent>
                </Card>

                {/* Cost Optimization */}
                <Card className="bg-gray-800/40 backdrop-blur-sm border-green-500/30">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-green-400">
                          💰 Cost Optimization - $2,400 Monthly Savings Identified
                        </CardTitle>
                        <p className="text-gray-400 text-sm mt-1">
                          COST_OPTIMIZATION • 8 hours ago
                        </p>
                      </div>
                      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                        MEDIUM
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-300 mb-4">
                      3 agents showing below-average cost efficiency. Optimization could save
                      approximately $2,400 monthly through parameter tuning.
                    </p>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-400">Business Impact</p>
                        <p className="text-lg font-semibold text-yellow-400">68%</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Potential Savings</p>
                        <p className="text-lg font-semibold text-green-400">$2,400/mo</p>
                      </div>
                    </div>
                    <Button className="w-full bg-green-500/20 text-green-400 hover:bg-green-500/30">
                      Start Optimization
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'reports' && (
              <div className="space-y-4">
                {/* Weekly Digest Report */}
                <Card className="bg-gray-800/40 backdrop-blur-sm border-blue-500/30">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-blue-400">
                          📊 Weekly Performance & Intelligence Digest
                        </CardTitle>
                        <p className="text-gray-400 text-sm mt-1">
                          Comprehensive weekly analysis covering campaign performance and strategic
                          insights
                        </p>
                      </div>
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        READY
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-300 mb-4">
                      Analysis reveals 4 key insights across campaign performance and agent
                      optimization. 3 high-impact findings identified with 4 actionable
                      recommendations.
                    </p>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-400">Key Findings</p>
                        <p className="text-lg font-semibold text-blue-400">3</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Recommendations</p>
                        <p className="text-lg font-semibold text-purple-400">4</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Views</p>
                        <p className="text-lg font-semibold text-gray-300">45</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Downloads</p>
                        <p className="text-lg font-semibold text-gray-300">8</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button className="flex-1 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30">
                        View Report
                      </Button>
                      <Button className="flex-1 bg-purple-500/20 text-purple-400 hover:bg-purple-500/30">
                        Download PDF
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Agent Performance Report */}
                <Card className="bg-gray-800/40 backdrop-blur-sm border-purple-500/30">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-purple-400">
                          🤖 Agent Performance & Optimization Report
                        </CardTitle>
                        <p className="text-gray-400 text-sm mt-1">
                          Detailed analysis of individual and system-wide agent performance
                        </p>
                      </div>
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        READY
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-300 mb-4">
                      System analysis of 12 active agents shows 91.2% average success rate with 3
                      optimization opportunities identified.
                    </p>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-400">Success Rate</p>
                        <p className="text-lg font-semibold text-green-400">91.2%</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Optimizations</p>
                        <p className="text-lg font-semibold text-orange-400">3</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button className="flex-1 bg-purple-500/20 text-purple-400 hover:bg-purple-500/30">
                        View Report
                      </Button>
                      <Button className="flex-1 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30">
                        Export Data
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'analytics' && (
              <Card className="bg-gray-800/40 backdrop-blur-sm border-gray-700/50">
                <CardHeader>
                  <CardTitle className="text-blue-400">📈 Real-Time Analytics Dashboard</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center p-4 bg-gray-700/30 rounded-lg">
                      <div className="text-2xl font-bold text-blue-400">24</div>
                      <div className="text-sm text-gray-400">Active Insights</div>
                    </div>
                    <div className="text-center p-4 bg-gray-700/30 rounded-lg">
                      <div className="text-2xl font-bold text-green-400">8.7</div>
                      <div className="text-sm text-gray-400">Avg Impact Score</div>
                    </div>
                    <div className="text-center p-4 bg-gray-700/30 rounded-lg">
                      <div className="text-2xl font-bold text-purple-400">12</div>
                      <div className="text-sm text-gray-400">Reports Generated</div>
                    </div>
                    <div className="text-center p-4 bg-gray-700/30 rounded-lg">
                      <div className="text-2xl font-bold text-orange-400">94%</div>
                      <div className="text-sm text-gray-400">System Health</div>
                    </div>
                  </div>

                  <div className="text-center text-gray-400 py-8">
                    <div className="text-4xl mb-4">📊</div>
                    <p>Advanced analytics dashboard coming soon</p>
                    <p className="text-sm">
                      Real-time performance tracking, trend visualization, and predictive insights
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Tools & Quick Actions */}
          <div className="space-y-6">
            {/* Auto Exporter */}
            <Card className="bg-gray-800/40 backdrop-blur-sm border-gray-700/50">
              <CardHeader>
                <CardTitle className="text-green-400">📤 Auto Exporter</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full bg-blue-500/20 text-blue-400 hover:bg-blue-500/30">
                  📄 Export to PDF
                </Button>
                <Button className="w-full bg-green-500/20 text-green-400 hover:bg-green-500/30">
                  📊 Export to CSV
                </Button>
                <Button className="w-full bg-purple-500/20 text-purple-400 hover:bg-purple-500/30">
                  📝 Sync to Notion
                </Button>
                <Button className="w-full bg-orange-500/20 text-orange-400 hover:bg-orange-500/30">
                  💬 Send to Slack
                </Button>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-gray-800/40 backdrop-blur-sm border-gray-700/50">
              <CardHeader>
                <CardTitle className="text-purple-400">⚡ Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full bg-blue-500/20 text-blue-400 hover:bg-blue-500/30">
                  🔄 Generate New Report
                </Button>
                <Button className="w-full bg-purple-500/20 text-purple-400 hover:bg-purple-500/30">
                  🎯 Run Pattern Analysis
                </Button>
                <Button className="w-full bg-green-500/20 text-green-400 hover:bg-green-500/30">
                  📤 Export All Insights
                </Button>
                <Button className="w-full bg-orange-500/20 text-orange-400 hover:bg-orange-500/30">
                  ⚙️ Configure Alerts
                </Button>
              </CardContent>
            </Card>

            {/* Smart Filters */}
            <Card className="bg-gray-800/40 backdrop-blur-sm border-gray-700/50">
              <CardHeader>
                <CardTitle className="text-blue-400">🔍 Smart Filters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Date Range</label>
                  <select className="w-full bg-gray-700/50 border border-gray-600 rounded-md px-3 py-2 text-white">
                    <option>Last 7 days</option>
                    <option>Last 30 days</option>
                    <option>Last 90 days</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Priority</label>
                  <select className="w-full bg-gray-700/50 border border-gray-600 rounded-md px-3 py-2 text-white">
                    <option>All Priorities</option>
                    <option>Critical & High</option>
                    <option>Medium & Low</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Category</label>
                  <select className="w-full bg-gray-700/50 border border-gray-600 rounded-md px-3 py-2 text-white">
                    <option>All Categories</option>
                    <option>Performance</option>
                    <option>Optimization</option>
                    <option>Trends</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* System Status */}
            <Card className="bg-gray-800/40 backdrop-blur-sm border-gray-700/50">
              <CardHeader>
                <CardTitle className="text-green-400">🟢 System Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Intelligence Engine</span>
                    <span className="text-green-400">Operational</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Report Compiler</span>
                    <span className="text-green-400">Active</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Pattern Miner</span>
                    <span className="text-blue-400">Processing</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Last Update</span>
                    <span className="text-gray-300">2 min ago</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
