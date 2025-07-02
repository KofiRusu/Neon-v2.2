"use client"

import PageLayout from "@/components/page-layout"
import { useState } from "react"
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Eye,
  Target,
  Download,
  Filter,
  RefreshCw,
} from "lucide-react"

const analyticsData = {
  overview: {
    totalRevenue: 47230,
    revenueChange: 18.2,
    totalImpressions: 2400000,
    impressionsChange: 12.5,
    totalClicks: 156000,
    clicksChange: 8.7,
    totalConversions: 4320,
    conversionsChange: 22.1,
    avgCTR: 6.5,
    ctrChange: -2.3,
    avgCPC: 2.84,
    cpcChange: -5.1,
  },
  campaigns: [
    { name: "Summer Launch", revenue: 18500, conversions: 1240, ctr: 7.2, status: "active" },
    { name: "Email Series", revenue: 12300, conversions: 890, ctr: 5.8, status: "active" },
    { name: "Social Awareness", revenue: 8900, conversions: 670, ctr: 4.9, status: "active" },
    { name: "Content Push", revenue: 7530, conversions: 520, ctr: 6.1, status: "paused" },
  ],
  topPerformers: [
    { metric: "Highest CTR", value: "7.2%", campaign: "Summer Launch", change: "+0.8%" },
    { metric: "Best ROI", value: "340%", campaign: "Email Series", change: "+12%" },
    { metric: "Most Conversions", value: "1,240", campaign: "Summer Launch", change: "+156" },
    { metric: "Lowest CPC", value: "$1.92", campaign: "Social Awareness", change: "-$0.23" },
  ],
}

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("30d")
  const [selectedMetric, setSelectedMetric] = useState("revenue")

  const actions = (
    <div className="flex items-center space-x-3">
      <select
        value={timeRange}
        onChange={(e) => setTimeRange(e.target.value)}
        className="glass border border-white/10 rounded-lg px-3 py-2 text-sm text-white bg-transparent"
      >
        <option value="7d" className="bg-gray-800">
          Last 7 days
        </option>
        <option value="30d" className="bg-gray-800">
          Last 30 days
        </option>
        <option value="90d" className="bg-gray-800">
          Last 90 days
        </option>
        <option value="1y" className="bg-gray-800">
          Last year
        </option>
      </select>
      <button className="glass p-2 rounded-lg text-gray-400 hover:text-white">
        <RefreshCw className="w-5 h-5" />
      </button>
      <button className="glass p-2 rounded-lg text-gray-400 hover:text-white">
        <Filter className="w-5 h-5" />
      </button>
      <button className="btn-neon text-sm">
        <Download className="w-4 h-4 mr-2" />
        Export Report
      </button>
    </div>
  )

  return (
    <PageLayout title="Analytics" subtitle="Comprehensive performance insights and data analysis" actions={actions}>
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card-neon border-green-500/30">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-white/5 text-neon-green">
              <DollarSign className="w-6 h-6" />
            </div>
            <div className="flex items-center space-x-1 text-sm text-green-400">
              <TrendingUp className="w-4 h-4" />
              <span>+{analyticsData.overview.revenueChange}%</span>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-400">Total Revenue</p>
            <p className="text-2xl font-bold text-neon-green">
              ${analyticsData.overview.totalRevenue.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="card-neon border-blue-500/30">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-white/5 text-neon-blue">
              <Eye className="w-6 h-6" />
            </div>
            <div className="flex items-center space-x-1 text-sm text-green-400">
              <TrendingUp className="w-4 h-4" />
              <span>+{analyticsData.overview.impressionsChange}%</span>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-400">Total Impressions</p>
            <p className="text-2xl font-bold text-neon-blue">
              {(analyticsData.overview.totalImpressions / 1000000).toFixed(1)}M
            </p>
          </div>
        </div>

        <div className="card-neon border-purple-500/30">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-white/5 text-neon-purple">
              <Users className="w-6 h-6" />
            </div>
            <div className="flex items-center space-x-1 text-sm text-green-400">
              <TrendingUp className="w-4 h-4" />
              <span>+{analyticsData.overview.clicksChange}%</span>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-400">Total Clicks</p>
            <p className="text-2xl font-bold text-neon-purple">
              {(analyticsData.overview.totalClicks / 1000).toFixed(0)}K
            </p>
          </div>
        </div>

        <div className="card-neon border-pink-500/30">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-white/5 text-neon-pink">
              <Target className="w-6 h-6" />
            </div>
            <div className="flex items-center space-x-1 text-sm text-green-400">
              <TrendingUp className="w-4 h-4" />
              <span>+{analyticsData.overview.conversionsChange}%</span>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-400">Total Conversions</p>
            <p className="text-2xl font-bold text-neon-pink">
              {analyticsData.overview.totalConversions.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Performance Chart */}
        <div className="lg:col-span-2">
          <div className="glass-strong p-6 rounded-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Performance Trends</h2>
              <div className="flex space-x-2">
                {["revenue", "clicks", "conversions", "ctr"].map((metric) => (
                  <button
                    key={metric}
                    onClick={() => setSelectedMetric(metric)}
                    className={`px-3 py-1 text-sm rounded-lg transition-all ${
                      selectedMetric === metric
                        ? "bg-neon-blue/20 text-neon-blue border border-neon-blue/30"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {metric.charAt(0).toUpperCase() + metric.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Placeholder for chart */}
            <div className="h-64 glass rounded-lg flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-neon-blue mx-auto mb-4" />
                <p className="text-gray-400">Interactive chart visualization</p>
                <p className="text-sm text-gray-500 mt-1">
                  Showing {selectedMetric} trends over {timeRange}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Top Performers */}
        <div className="space-y-6">
          <div className="glass-strong p-6 rounded-lg">
            <h2 className="text-xl font-bold text-white mb-4">Top Performers</h2>
            <div className="space-y-4">
              {analyticsData.topPerformers.map((performer, index) => (
                <div key={index} className="glass p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-400">{performer.metric}</p>
                    <span className="text-xs text-green-400">{performer.change}</span>
                  </div>
                  <p className="text-lg font-bold text-neon-blue">{performer.value}</p>
                  <p className="text-xs text-gray-500">{performer.campaign}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Key Metrics */}
          <div className="glass-strong p-6 rounded-lg">
            <h2 className="text-xl font-bold text-white mb-4">Key Metrics</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Avg. CTR</span>
                <div className="flex items-center space-x-2">
                  <span className="text-white font-semibold">{analyticsData.overview.avgCTR}%</span>
                  <div className="flex items-center text-red-400 text-sm">
                    <TrendingDown className="w-3 h-3" />
                    <span>{Math.abs(analyticsData.overview.ctrChange)}%</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Avg. CPC</span>
                <div className="flex items-center space-x-2">
                  <span className="text-white font-semibold">${analyticsData.overview.avgCPC}</span>
                  <div className="flex items-center text-green-400 text-sm">
                    <TrendingDown className="w-3 h-3" />
                    <span>{Math.abs(analyticsData.overview.cpcChange)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Campaign Performance Table */}
      <div className="mt-8">
        <div className="glass-strong rounded-lg overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-xl font-bold text-white">Campaign Performance</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Campaign</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Revenue</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Conversions</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">CTR</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {analyticsData.campaigns.map((campaign, index) => (
                  <tr key={index} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-medium text-white">{campaign.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-neon-green font-semibold">${campaign.revenue.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-neon-blue font-semibold">{campaign.conversions.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-neon-purple font-semibold">{campaign.ctr}%</span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full border ${
                          campaign.status === "active"
                            ? "bg-neon-green/20 text-neon-green border-neon-green/30"
                            : "bg-gray-500/20 text-gray-400 border-gray-500/30"
                        }`}
                      >
                        {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
