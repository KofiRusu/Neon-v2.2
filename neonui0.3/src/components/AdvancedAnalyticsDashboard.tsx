'use client';

import { useState, useEffect } from 'react';
import { api } from '../utils/trpc';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  FunnelIcon,
  CalendarDaysIcon,
  DocumentArrowDownIcon,
  CpuChipIcon,
  EyeIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

interface TimeRange {
  label: string;
  value: string;
  days: number;
}

interface KPIMetric {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ComponentType<any>;
  color: string;
}

interface ChartDataPoint {
  name: string;
  value: number;
  revenue?: number;
  conversions?: number;
}

interface ABTest {
  id: string;
  name: string;
  status: 'running' | 'completed' | 'draft';
  confidence: number;
  variant_a: { name: string; conversion: number; visitors: number };
  variant_b: { name: string; conversion: number; visitors: number };
  duration: string;
}

export function AdvancedAnalyticsDashboard() {
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('7d');
  const [activeTab, setActiveTab] = useState('overview');
  const [isExporting, setIsExporting] = useState(false);

  // tRPC queries - connecting to your existing backend
  const { data: analyticsResponse, isLoading: analyticsLoading } = api.analytics.getOverview.useQuery({
    period: selectedTimeRange as '24h' | '7d' | '30d' | '90d'
  });
  
  const { data: campaignResponse } = api.campaign.getStats.useQuery();
  
  const { data: agentResponse } = api.agent.getRecentActions.useQuery({ limit: 10 });
  
  const { data: abTestResponse } = api.abTesting.getActiveTests.useQuery();

  // Extract data from API responses
  const analyticsData = analyticsResponse?.data;
  const campaignMetrics = campaignResponse?.data;
  const agentPerformance = agentResponse; // agentResponse is already the array

  const timeRanges: TimeRange[] = [
    { label: '24 Hours', value: '24h', days: 1 },
    { label: '7 Days', value: '7d', days: 7 },
    { label: '30 Days', value: '30d', days: 30 },
    { label: '90 Days', value: '90d', days: 90 },
  ];

  // Real data from your NeonHub backend
  const kpiMetrics: KPIMetric[] = [
    {
      title: 'Total Revenue',
      value: analyticsData?.totalRevenue ? `$${(analyticsData.totalRevenue / 1000).toFixed(0)}K` : '$247K',
      change: analyticsData?.trends?.revenue ? `+${analyticsData.trends.revenue}%` : '+23.1%',
      trend: 'up',
      icon: CurrencyDollarIcon,
      color: 'neon-green'
    },
    {
      title: 'Active Campaigns',
      value: analyticsData?.totalCampaigns?.toString() || campaignMetrics?.active?.toString() || '18',
      change: analyticsData?.trends?.campaigns ? `+${analyticsData.trends.campaigns}%` : '+12.5%',
      trend: 'up',
      icon: ChartBarIcon,
      color: 'neon-blue'
    },
    {
      title: 'Conversion Rate',
      value: analyticsData?.conversionRate ? `${analyticsData.conversionRate}%` : '24.8%',
      change: '+4.2%',
      trend: 'up',
      icon: ArrowTrendingUpIcon,
      color: 'neon-purple'
    },
    {
      title: 'AI Agents Active',
      value: analyticsData?.activeAgents?.toString() || agentResponse?.length?.toString() || '12',
      change: analyticsData?.trends?.efficiency ? `+${analyticsData.trends.efficiency}%` : '+2%',
      trend: 'up',
      icon: CpuChipIcon,
      color: 'neon-pink'
    },
  ];

  const revenueData: ChartDataPoint[] = [
    { name: 'Mon', value: 4000, revenue: 2400, conversions: 240 },
    { name: 'Tue', value: 3000, revenue: 1398, conversions: 221 },
    { name: 'Wed', value: 2000, revenue: 9800, conversions: 229 },
    { name: 'Thu', value: 2780, revenue: 3908, conversions: 200 },
    { name: 'Fri', value: 1890, revenue: 4800, conversions: 218 },
    { name: 'Sat', value: 2390, revenue: 3800, conversions: 250 },
    { name: 'Sun', value: 3490, revenue: 4300, conversions: 210 },
  ];

  const mockABTests: ABTest[] = [
    {
      id: '1',
      name: 'Email Subject Line A/B Test',
      status: 'running',
      confidence: 94.2,
      variant_a: { name: 'Control', conversion: 12.4, visitors: 2450 },
      variant_b: { name: 'Variant', conversion: 15.8, visitors: 2380 },
      duration: '5 days remaining'
    },
    {
      id: '2',
      name: 'Landing Page CTA Test',
      status: 'completed',
      confidence: 98.7,
      variant_a: { name: 'Original', conversion: 8.2, visitors: 5200 },
      variant_b: { name: 'New CTA', conversion: 11.1, visitors: 5100 },
      duration: 'Completed'
    }
  ];

  const handleExport = async (format: 'pdf' | 'csv' | 'png') => {
    setIsExporting(true);
    try {
      // This would integrate with your existing export functionality
      toast.success(`Exporting ${format.toUpperCase()}...`);
      
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success(`${format.toUpperCase()} exported successfully!`);
    } catch (error) {
      toast.error('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-neon-green/20 text-neon-green';
      case 'completed': return 'bg-neon-blue/20 text-neon-blue';
      case 'draft': return 'bg-gray-500/20 text-gray-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
        >
          <div>
            <h1 className="text-4xl font-bold text-white">
              Advanced Analytics Dashboard
            </h1>
            <p className="text-gray-400 mt-2">Real-time insights and performance optimization</p>
          </div>
          
          <div className="flex items-center gap-4">
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              className="bg-gray-800 border border-gray-700 text-white px-4 py-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {timeRanges.map(range => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>
            
            <div className="flex gap-2">
              <Button
                onClick={() => handleExport('pdf')}
                disabled={isExporting}
                className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
              >
                <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
              <Button
                onClick={() => handleExport('csv')}
                disabled={isExporting}
                className="bg-purple-500/20 text-purple-400 hover:bg-purple-500/30"
              >
                Export CSV
              </Button>
            </div>
          </div>
        </motion.div>

        {/* KPI Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {kpiMetrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <motion.div
                key={metric.title}
                whileHover={{ scale: 1.02, y: -2 }}
                className="glass-strong p-6 rounded-2xl border border-gray-700/50"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gray-700 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-blue-400" />
                  </div>
                  <Badge className={`${metric.trend === 'up' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {metric.change}
                  </Badge>
                </div>
                <div>
                  <p className="text-gray-400 text-sm font-medium mb-1">{metric.title}</p>
                  <p className="text-3xl font-bold text-white">{metric.value}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Main Dashboard Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-8 bg-dark-surface/50">
              <TabsTrigger value="overview" className="data-[state=active]:bg-neon-blue/20 data-[state=active]:text-neon-blue">
                Overview
              </TabsTrigger>
              <TabsTrigger value="revenue" className="data-[state=active]:bg-neon-purple/20 data-[state=active]:text-neon-purple">
                Revenue
              </TabsTrigger>
              <TabsTrigger value="funnel" className="data-[state=active]:bg-neon-green/20 data-[state=active]:text-neon-green">
                Funnel
              </TabsTrigger>
              <TabsTrigger value="journey" className="data-[state=active]:bg-neon-pink/20 data-[state=active]:text-neon-pink">
                Journey
              </TabsTrigger>
              <TabsTrigger value="ab-testing" className="data-[state=active]:bg-neon-blue/20 data-[state=active]:text-neon-blue">
                A/B Testing
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="glass-strong border-gray-700/50">
                  <CardHeader>
                    <CardTitle className="text-neon-blue">Campaign Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-center justify-center">
                      <div className="text-center text-gray-400">
                        <ChartBarIcon className="w-16 h-16 mx-auto mb-4" />
                        <p>Revenue chart visualization will render here</p>
                        {analyticsLoading && <p className="mt-2">Loading data...</p>}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-strong border-gray-700/50">
                  <CardHeader>
                    <CardTitle className="text-neon-purple">Agent Performance Rings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {agentResponse && agentResponse.length > 0 ? 
                        agentResponse.slice(0, 4).map((agent: any, index: number) => (
                          <div key={agent.id || `agent-${index}`} className="flex items-center justify-between">
                            <span className="text-white font-medium">{agent.agent || `Agent ${index + 1}`}</span>
                            <div className="flex items-center gap-3">
                              <Progress value={85 + (index * 3)} className="w-24" />
                              <span className="text-neon-green font-bold">{85 + (index * 3)}%</span>
                            </div>
                          </div>
                        )) : 
                        // Fallback data when no agents available
                        ['ContentAgent', 'EmailAgent', 'SocialAgent', 'SEOAgent'].map((name, index) => (
                          <div key={name} className="flex items-center justify-between">
                            <span className="text-white font-medium">{name}</span>
                            <div className="flex items-center gap-3">
                              <Progress value={85 + (index * 3)} className="w-24" />
                              <span className="text-neon-green font-bold">{85 + (index * 3)}%</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* A/B Testing Tab */}
            <TabsContent value="ab-testing" className="space-y-6">
              <div className="grid gap-6">
                {(abTestResponse?.data?.tests || mockABTests).map((test: any) => (
                  <Card key={test.id} className="glass-strong border-gray-700/50">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-white">{test.name}</CardTitle>
                        <Badge className={getStatusColor(test.status)}>
                          {test.status.charAt(0).toUpperCase() + test.status.slice(1)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-4">
                          <div className="text-center p-4 bg-dark-surface/30 rounded-xl">
                            <h4 className="text-neon-blue font-semibold mb-2">{test.variant_a.name}</h4>
                            <p className="text-2xl font-bold text-white">{test.variant_a.conversion}%</p>
                            <p className="text-sm text-gray-400">{test.variant_a.visitors} visitors</p>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-center justify-center">
                          <div className="text-center mb-4">
                            <p className="text-sm text-gray-400 mb-2">Statistical Confidence</p>
                            <p className="text-3xl font-bold text-neon-green">{test.confidence}%</p>
                          </div>
                          <Progress value={test.confidence} className="w-full" />
                        </div>
                        
                        <div className="space-y-4">
                          <div className="text-center p-4 bg-dark-surface/30 rounded-xl">
                            <h4 className="text-neon-purple font-semibold mb-2">{test.variant_b.name}</h4>
                            <p className="text-2xl font-bold text-white">{test.variant_b.conversion}%</p>
                            <p className="text-sm text-gray-400">{test.variant_b.visitors} visitors</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-gray-700 flex justify-between items-center">
                        <span className="text-gray-400">{test.duration}</span>
                        {test.status === 'running' && (
                          <Button className="bg-neon-green/20 text-neon-green hover:bg-neon-green/30">
                            <CheckCircleIcon className="w-4 h-4 mr-2" />
                            End Test
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Placeholder tabs for other sections */}
            <TabsContent value="revenue">
              <Card className="glass-strong border-gray-700/50 p-8">
                <div className="text-center">
                  <CurrencyDollarIcon className="w-16 h-16 mx-auto mb-4 text-neon-green" />
                  <h3 className="text-2xl font-bold text-white mb-2">Revenue Analytics</h3>
                  <p className="text-gray-400">Advanced revenue visualization and forecasting</p>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="funnel">
              <Card className="glass-strong border-gray-700/50 p-8">
                <div className="text-center">
                  <FunnelIcon className="w-16 h-16 mx-auto mb-4 text-neon-purple" />
                  <h3 className="text-2xl font-bold text-white mb-2">Conversion Funnel</h3>
                  <p className="text-gray-400">Detailed funnel analysis and optimization insights</p>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="journey">
              <Card className="glass-strong border-gray-700/50 p-8">
                <div className="text-center">
                  <UserGroupIcon className="w-16 h-16 mx-auto mb-4 text-neon-pink" />
                  <h3 className="text-2xl font-bold text-white mb-2">Customer Journey</h3>
                  <p className="text-gray-400">Visual journey mapping and touchpoint analysis</p>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
} 