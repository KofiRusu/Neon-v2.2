'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '../utils/trpc';
import { brand } from '../lib/brand';
import { metrics } from '../lib/metrics';
import {
  ChartBarIcon,
  CogIcon,
  UserGroupIcon,
  SparklesIcon,
  PlayIcon,
  PauseIcon,
  ArrowTrendingUpIcon,
  DocumentTextIcon,
  MegaphoneIcon,
  PaintBrushIcon,
  BellIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  EnvelopeIcon,
  ChatBubbleLeftIcon,
  GlobeAltIcon,
  ArrowRightIcon,
  CpuChipIcon,
  BoltIcon,
  RocketLaunchIcon,
  EyeIcon,
  FireIcon,
  TrendingUpIcon,
  CloudIcon,
} from '@heroicons/react/24/outline';

export default function Dashboard(): JSX.Element {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second for live effect
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch real data from our API with error handling
  const { data: campaignStats } = api.campaign.getStats.useQuery(undefined, {
    enabled: true,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const { data: recentAgentActivity } = api.agent.getRecentActions.useQuery(
    { limit: 5 },
    {
      enabled: true,
      retry: 1,
      refetchOnWindowFocus: false,
    }
  );

  // Utility functions for agent and KPI data
  function getAgentIcon(agentName: string) {
    const iconMap: Record<string, any> = {
      ContentAgent: DocumentTextIcon,
      AdAgent: BoltIcon,
      EmailAgent: EnvelopeIcon,
      SocialAgent: GlobeAltIcon,
      InsightAgent: ChartBarIcon,
      SEOAgent: MagnifyingGlassIcon,
      SupportAgent: ChatBubbleLeftIcon,
      DesignAgent: PaintBrushIcon,
    };
    return iconMap[agentName] || CpuChipIcon;
  }

  function getAgentColor(agentName: string) {
    const colorMap: Record<string, string> = {
      ContentAgent: 'text-neon-blue',
      AdAgent: 'text-neon-pink',
      EmailAgent: 'text-neon-purple',
      SocialAgent: 'text-neon-green',
      InsightAgent: 'text-neon-blue',
      SEOAgent: 'text-neon-green',
      SupportAgent: 'text-neon-blue',
      DesignAgent: 'text-neon-purple',
    };
    return colorMap[agentName] || 'text-neon-blue';
  }

  function getKPIIcon(kpiName: string) {
    const iconMap: Record<string, any> = {
      'Active Campaigns': RocketLaunchIcon,
      'AI Agents Running': CpuChipIcon,
      'Conversion Rate': ArrowTrendingUpIcon,
      'Revenue Impact': ArrowTrendingUpIcon,
      'Cost Per Lead': ArrowTrendingUpIcon,
      'Customer LTV': ArrowTrendingUpIcon,
    };
    return iconMap[kpiName] || ChartBarIcon;
  }

  function getKPIColor(kpiName: string) {
    const colorMap: Record<string, string> = {
      'Active Campaigns': 'neon-blue',
      'AI Agents Running': 'neon-purple',
      'Conversion Rate': 'neon-green',
      'Revenue Impact': 'neon-pink',
      'Cost Per Lead': 'neon-green',
      'Customer LTV': 'neon-blue',
    };
    return colorMap[kpiName] || 'neon-blue';
  }

  const navigationItems = [
    {
      id: 'agents',
      name: 'AI Agents Hub',
      href: '/agents',
      icon: CpuChipIcon,
      description: 'Manage your AI workforce',
      color: 'neon-blue',
      status: 'active',
    },
    {
      id: 'campaigns',
      name: 'Campaigns',
      href: '/campaigns',
      icon: RocketLaunchIcon,
      description: 'Launch and track campaigns',
      color: 'neon-purple',
      status: 'active',
    },
    {
      id: 'email',
      name: 'Email Marketing',
      href: '/email',
      icon: EnvelopeIcon,
      description: 'Automated email sequences',
      color: 'neon-pink',
      status: 'active',
    },
    {
      id: 'social',
      name: 'Social Media',
      href: '/social',
      icon: GlobeAltIcon,
      description: 'Cross-platform management',
      color: 'neon-green',
      status: 'active',
    },
    {
      id: 'support',
      name: 'Customer Support',
      href: '/support',
      icon: ChatBubbleLeftIcon,
      description: 'AI-powered assistance',
      color: 'neon-blue',
      status: 'active',
    },
    {
      id: 'analytics',
      name: 'Analytics',
      href: '/analytics',
      icon: ArrowTrendingUpIcon,
      description: 'Performance insights',
      color: 'neon-purple',
      status: 'active',
    },
  ];

  // Use real agent data from metrics
  const agents = metrics.agentPerformance.map(agent => ({
    id: agent.id,
    name: agent.name,
    status: agent.status,
    icon: getAgentIcon(agent.name),
    color: getAgentColor(agent.name),
    description: agent.specialization,
    performance: agent.performance,
    lastAction: agent.lastAction,
  }));

  // Use real KPI data from metrics
  const dashboardMetrics = metrics.kpis.dashboard.map(kpi => ({
    name: kpi.name,
    value: kpi.value,
    change: kpi.change,
    changeType: kpi.changeType,
    icon: getKPIIcon(kpi.name),
    color: getKPIColor(kpi.name),
  }));

  // Use real activity data from API or fallback to mock data
  const recentActivity = recentAgentActivity?.map((activity: any) => ({
    id: activity.id,
    agent: activity.agent,
    action: activity.action,
    time: new Date(activity.createdAt).toLocaleTimeString(),
    status: 'completed',
    icon: getAgentIcon(activity.agent),
  })) || [
    {
      id: 1,
      agent: 'ContentAgent',
      action: 'Generated SEO-optimized blog post for Q4 campaign',
      time: 'Just now',
      status: 'completed',
      icon: DocumentTextIcon,
    },
    {
      id: 2,
      agent: 'AdAgent',
      action: 'Optimized Facebook ad spend allocation (+12% ROI)',
      time: '2 min ago',
      status: 'completed',
      icon: BoltIcon,
    },
    {
      id: 3,
      agent: 'EmailAgent',
      action: 'Deployed personalized email sequence (2,847 recipients)',
      time: '5 min ago',
      status: 'completed',
      icon: EnvelopeIcon,
    },
    {
      id: 4,
      agent: 'SocialAgent',
      action: 'Scheduled 15 cross-platform posts with trending hashtags',
      time: '8 min ago',
      status: 'completed',
      icon: GlobeAltIcon,
    },
    {
      id: 5,
      agent: 'InsightAgent',
      action: 'Generated weekly performance report with recommendations',
      time: '12 min ago',
      status: 'completed',
      icon: ChartBarIcon,
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Futuristic Header */}
      <header className="nav-glass sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-neon-blue to-neon-purple rounded-xl flex items-center justify-center animate-glow-border">
                  <SparklesIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-neon-blue">NeonHub</h1>
                  <p className="text-xs text-secondary">AI Marketing Ecosystem v1.1</p>
                </div>
              </div>
              <div className="hidden lg:flex items-center space-x-4 text-sm text-secondary">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse"></div>
                  <span>System Online</span>
                </div>
                <div className="text-muted">•</div>
                <div>{currentTime.toLocaleTimeString()}</div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Futuristic Search */}
              <div className="relative hidden md:block">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary" />
                <input
                  type="text"
                  placeholder="Search agents, campaigns..."
                  className="input-neon pl-10 pr-4 py-2 w-80"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2">
                <button className="p-3 glass rounded-lg text-secondary hover:text-neon-blue transition-all duration-300 relative">
                  <BellIcon className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-neon-pink rounded-full animate-pulse"></span>
                </button>
                <button className="p-3 glass rounded-lg text-secondary hover:text-neon-blue transition-all duration-300">
                  <CogIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="mb-8">
          <div className="glass-strong p-8 rounded-3xl bg-gradient-primary relative overflow-hidden">
            <div className="relative z-10">
              <h1 className="text-4xl font-bold mb-2">
                <span className="text-neon-blue">{brand.slogan}</span>
                <br />
                <span className="text-primary">with AI Marketing</span>
              </h1>
              <p className="text-secondary text-lg mb-6 max-w-2xl">
                {brand.messaging.primaryValue}
              </p>
              <div className="flex items-center space-x-4">
                <button className="btn-neon">
                  <RocketLaunchIcon className="h-5 w-5 mr-2" />
                  Launch Campaign
                </button>
                <button className="btn-neon-purple">
                  <EyeIcon className="h-5 w-5 mr-2" />
                  View Analytics
                </button>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-neon-blue/20 to-transparent rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-neon-purple/20 to-transparent rounded-full blur-3xl"></div>
          </div>
        </div>

        {/* Navigation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {navigationItems.map(item => {
            const Icon = item.icon;
            return (
              <Link key={item.id} href={item.href} className="group">
                <div className="card-neon group-hover:scale-105 transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`w-14 h-14 bg-${item.color} rounded-2xl flex items-center justify-center`}
                    >
                      <Icon className="h-7 w-7 text-white" />
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`agent-status-${item.status}`}></div>
                      <span className="text-xs text-secondary capitalize">{item.status}</span>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-primary mb-2">{item.name}</h3>
                  <p className="text-secondary text-sm mb-4">{item.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted">Ready to deploy</span>
                    <ArrowRightIcon className="h-4 w-4 text-secondary group-hover:text-neon-blue transition-colors" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Metrics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {dashboardMetrics.map(metric => {
            const Icon = metric.icon;
            return (
              <div key={metric.name} className="stat-card">
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-12 h-12 bg-${metric.color} rounded-xl flex items-center justify-center`}
                  >
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      metric.changeType === 'positive'
                        ? 'bg-neon-green text-black'
                        : 'bg-neon-pink text-white'
                    }`}
                  >
                    {metric.change}
                  </div>
                </div>
                <div>
                  <p className="text-secondary text-sm font-medium mb-1">{metric.name}</p>
                  <p className="stat-number">{metric.value}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* AI Agents Grid */}
          <div className="glass-strong p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-primary">AI Agent Fleet</h2>
              <Link
                href="/agents"
                className="text-neon-blue hover:text-neon-purple transition-colors text-sm font-medium"
              >
                Manage All →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {agents.map(agent => {
                const Icon = agent.icon;
                return (
                  <div
                    key={agent.id}
                    className="glass p-4 rounded-xl hover:scale-105 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <Icon className={`h-6 w-6 ${agent.color}`} />
                        <div>
                          <h3 className="font-semibold text-primary text-sm">{agent.name}</h3>
                          <p className="text-xs text-secondary">{agent.description}</p>
                        </div>
                      </div>
                      <div className={`agent-status-${agent.status}`}></div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-secondary">Performance</span>
                        <span className="text-neon-green font-semibold">{agent.performance}%</span>
                      </div>
                      <div className="progress-neon">
                        <div
                          className="progress-fill"
                          style={{ width: `${agent.performance}%` }}
                        ></div>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted">Last action</span>
                        <span className="text-secondary">{agent.lastAction}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live Activity Feed */}
          <div className="glass-strong p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-primary">Live Activity</h2>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse"></div>
                <span className="text-xs text-secondary">Real-time</span>
              </div>
            </div>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {recentActivity.map(activity => {
                const Icon = activity.icon;
                return (
                  <div key={activity.id} className="glass p-4 rounded-xl">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-neon-blue to-neon-purple rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-semibold text-neon-blue text-sm">
                            {activity.agent}
                          </span>
                          <span className="text-xs text-muted">•</span>
                          <span className="text-xs text-secondary">{activity.time}</span>
                        </div>
                        <p className="text-sm text-primary leading-relaxed">{activity.action}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <div className="w-1.5 h-1.5 bg-neon-green rounded-full"></div>
                          <span className="text-xs text-neon-green">Completed</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="mt-8">
          <div className="glass-strong p-6 rounded-2xl">
            <h2 className="text-2xl font-bold text-primary mb-6">Mission Control</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link href="/campaigns" className="btn-neon flex items-center justify-center py-4">
                <RocketLaunchIcon className="h-5 w-5 mr-2" />
                Deploy Campaign
              </Link>
              <Link
                href="/agents"
                className="btn-neon-purple flex items-center justify-center py-4"
              >
                <CpuChipIcon className="h-5 w-5 mr-2" />
                Configure Agents
              </Link>
              <Link
                href="/analytics"
                className="btn-neon-pink flex items-center justify-center py-4"
              >
                <ChartBarIcon className="h-5 w-5 mr-2" />
                Analytics Hub
              </Link>
              <Link
                href="/support"
                className="btn-neon-green flex items-center justify-center py-4"
              >
                <ChatBubbleLeftIcon className="h-5 w-5 mr-2" />
                Support Center
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
