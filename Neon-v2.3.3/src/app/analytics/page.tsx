"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Progress } from "../../components/ui/progress";
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CurrencyDollarIcon,
  UsersIcon,
  RocketLaunchIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { trpc } from "../../utils/trpc";
import PageLayout from "../../components/page-layout";

// Import chain components
import ChainVisualizerPanel from "../../components/chains/ChainVisualizerPanel";
import ChainPerformanceHeatmap from "../../components/chains/ChainPerformanceHeatmap";
import { Brain } from "lucide-react";

// Mock data for charts
const campaignPerformanceData = [
  { name: "Jan", revenue: 45000, campaigns: 12, efficiency: 85 },
  { name: "Feb", revenue: 52000, campaigns: 15, efficiency: 88 },
  { name: "Mar", revenue: 48000, campaigns: 13, efficiency: 82 },
  { name: "Apr", revenue: 61000, campaigns: 18, efficiency: 92 },
  { name: "May", revenue: 55000, campaigns: 16, efficiency: 89 },
  { name: "Jun", revenue: 67000, campaigns: 20, efficiency: 94 },
];

const agentEfficiencyData = [
  { name: "Content", value: 95, color: "#10b981" },
  { name: "SEO", value: 88, color: "#3b82f6" },
  { name: "Social", value: 91, color: "#8b5cf6" },
  { name: "Email", value: 82, color: "#f59e0b" },
];

const COLORS = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b"];

export default function AnalyticsPage() {
  const [timePeriod, setTimePeriod] = useState<"24h" | "7d" | "30d" | "90d">(
    "30d",
  );

  const {
    data: overviewData,
    isLoading: overviewLoading,
    refetch: refetchOverview,
  } = trpc.analytics.getOverview.useQuery({ period: timePeriod });

  const { data: campaignMetrics, isLoading: campaignLoading } =
    trpc.analytics.getCampaignMetrics.useQuery();

  const { data: agentPerformance, isLoading: agentLoading } =
    trpc.analytics.getAgentPerformance.useQuery();

  const overview = overviewData?.data;
  const campaigns = campaignMetrics?.data;
  const agents = agentPerformance?.data || [];

  const handlePeriodChange = (value: string) => {
    setTimePeriod(value as "24h" | "7d" | "30d" | "90d");
  };

  const handleRefresh = () => {
    refetchOverview();
  };

  return (
    <PageLayout
      title="Analytics Dashboard"
      subtitle="Real-time insights into your AI marketing performance"
      headerActions={
        <div className="flex items-center gap-4">
          <Select value={timePeriod} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Key Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {overviewLoading ? (
            <>
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          ) : overview ? (
            <>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Total Revenue
                      </p>
                      <div className="text-2xl font-bold">
                        ${overview.totalRevenue.toLocaleString()}
                      </div>
                    </div>
                    <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="flex items-center mt-2">
                    <ArrowTrendingUpIcon className="h-4 w-4 text-green-600 mr-1" />
                    <span className="text-sm text-green-600 font-medium">
                      +{overview.trends.revenue}%
                    </span>
                    <span className="text-sm text-gray-500 ml-1">
                      vs last period
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Active Campaigns
                      </p>
                      <div className="text-2xl font-bold">
                        {overview.totalCampaigns}
                      </div>
                    </div>
                    <RocketLaunchIcon className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="flex items-center mt-2">
                    <ArrowTrendingUpIcon className="h-4 w-4 text-green-600 mr-1" />
                    <span className="text-sm text-green-600 font-medium">
                      +{overview.trends.campaigns}%
                    </span>
                    <span className="text-sm text-gray-500 ml-1">
                      vs last period
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Active Agents
                      </p>
                      <div className="text-2xl font-bold">
                        {overview.activeAgents}
                      </div>
                    </div>
                    <UsersIcon className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="flex items-center mt-2">
                    <ArrowTrendingUpIcon className="h-4 w-4 text-green-600 mr-1" />
                    <span className="text-sm text-green-600 font-medium">
                      +{overview.trends.efficiency}%
                    </span>
                    <span className="text-sm text-gray-500 ml-1">
                      efficiency
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Conversion Rate
                      </p>
                      <div className="text-2xl font-bold">
                        {overview.conversionRate}%
                      </div>
                    </div>
                    <ChartBarIcon className="h-8 w-8 text-orange-600" />
                  </div>
                  <div className="flex items-center mt-2">
                    <Progress
                      value={overview.conversionRate}
                      className="w-20"
                    />
                    <span className="text-sm text-gray-500 ml-2">
                      target: 25%
                    </span>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : null}
        </div>

        {/* Analytics Tabs */}
        <Tabs defaultValue="performance" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="agents">Agents</TabsTrigger>
            <TabsTrigger value="chains">
              <Brain className="h-4 w-4 mr-2" />
              Strategy Chains
            </TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Trend</CardTitle>
                  <CardDescription>
                    Monthly revenue performance over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={campaignPerformanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip
                        formatter={(value) => [
                          `$${value.toLocaleString()}`,
                          "Revenue",
                        ]}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#10b981"
                        fill="#10b981"
                        fillOpacity={0.2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Campaign Performance</CardTitle>
                  <CardDescription>
                    Number of campaigns and efficiency over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={campaignPerformanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Bar
                        yAxisId="left"
                        dataKey="campaigns"
                        fill="#3b82f6"
                        name="Campaigns"
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="efficiency"
                        stroke="#8b5cf6"
                        name="Efficiency %"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="campaigns" className="space-y-6">
            {campaignLoading ? (
              <Card className="animate-pulse">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-32 bg-gray-200 rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ) : campaigns ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Campaign Performance</CardTitle>
                    <CardDescription>
                      Performance metrics by channel
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {campaigns.performance.map((item, index) => (
                        <div
                          key={item.name}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center space-x-3">
                            <div
                              className={`w-3 h-3 rounded-full bg-${COLORS[index]}`}
                            ></div>
                            <span className="font-medium">{item.name}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">
                              {item.value}%
                            </span>
                            <Badge
                              variant={
                                item.change > 0 ? "default" : "secondary"
                              }
                            >
                              {item.change > 0 ? "+" : ""}
                              {item.change}%
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Top Performers</CardTitle>
                    <CardDescription>
                      Highest revenue generating campaigns
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {campaigns.topPerformers.map((campaign, index) => (
                        <div
                          key={campaign.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
                        >
                          <div>
                            <div className="font-medium">{campaign.name}</div>
                            <div className="text-sm text-gray-500">
                              Campaign #{campaign.id}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-green-600">
                              ${campaign.revenue.toLocaleString()}
                            </div>
                            <div className="text-sm text-gray-500">Revenue</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : null}
          </TabsContent>

          <TabsContent value="agents" className="space-y-6">
            {agentLoading ? (
              <Card className="animate-pulse">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-48 bg-gray-200 rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Agent Efficiency</CardTitle>
                    <CardDescription>
                      Performance distribution across AI agents
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={agentEfficiencyData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {agentEfficiencyData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => [`${value}%`, "Efficiency"]}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Agent Performance</CardTitle>
                    <CardDescription>
                      Detailed metrics for each AI agent
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {agents.map((agent) => (
                        <div key={agent.id} className="p-4 rounded-lg border">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{agent.name}</h4>
                            <Badge variant="outline">
                              {agent.performance}%
                            </Badge>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Performance</span>
                              <span>{agent.performance}%</span>
                            </div>
                            <Progress
                              value={agent.performance}
                              className="h-2"
                            />
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <div className="text-gray-500">Tasks</div>
                                <div className="font-medium">
                                  {agent.tasksCompleted}
                                </div>
                              </div>
                              <div>
                                <div className="text-gray-500">Efficiency</div>
                                <div className="font-medium">
                                  {agent.efficiency}%
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="chains" className="space-y-6">
            <div className="space-y-6">
              {/* Chain Execution Monitor */}
              <ChainVisualizerPanel />
              
              {/* Chain Performance Heatmap */}
              <ChainPerformanceHeatmap 
                timeRange={{
                  start: new Date(Date.now() - (timePeriod === '24h' ? 24 * 60 * 60 * 1000 : 
                                               timePeriod === '7d' ? 7 * 24 * 60 * 60 * 1000 :
                                               timePeriod === '30d' ? 30 * 24 * 60 * 60 * 1000 :
                                               90 * 24 * 60 * 60 * 1000)),
                  end: new Date()
                }}
              />
            </div>
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>AI Insights</CardTitle>
                  <CardDescription>
                    Automated insights and recommendations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 border-l-4 border-blue-400 rounded">
                      <div className="flex">
                        <div className="ml-3">
                          <p className="text-sm font-medium text-blue-800">
                            Performance Optimization
                          </p>
                          <p className="mt-1 text-sm text-blue-700">
                            Your content campaigns are performing 23% better
                            than average. Consider increasing budget allocation.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-green-50 border-l-4 border-green-400 rounded">
                      <div className="flex">
                        <div className="ml-3">
                          <p className="text-sm font-medium text-green-800">
                            Trend Alert
                          </p>
                          <p className="mt-1 text-sm text-green-700">
                            Social media engagement has increased 45% this week.
                            Perfect time to launch viral campaigns.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                      <div className="flex">
                        <div className="ml-3">
                          <p className="text-sm font-medium text-yellow-800">
                            Efficiency Warning
                          </p>
                          <p className="mt-1 text-sm text-yellow-700">
                            Email agent efficiency has dropped 12%. Consider
                            reviewing targeting parameters.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recommended Actions</CardTitle>
                  <CardDescription>AI-suggested optimizations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">
                          Increase Content Budget
                        </div>
                        <div className="text-sm text-gray-500">
                          +15% ROI potential
                        </div>
                      </div>
                      <Button size="sm">Apply</Button>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">
                          Launch Social Campaign
                        </div>
                        <div className="text-sm text-gray-500">
                          High engagement window
                        </div>
                      </div>
                      <Button size="sm">Create</Button>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">Optimize Email Timing</div>
                        <div className="text-sm text-gray-500">
                          +8% open rate potential
                        </div>
                      </div>
                      <Button size="sm">Configure</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
}
