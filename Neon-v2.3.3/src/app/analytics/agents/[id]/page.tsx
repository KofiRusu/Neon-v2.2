'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

interface AgentMetrics {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'inactive' | 'maintenance';
  performance: {
    score: number;
    trend: number;
    tasksCompleted: number;
    successRate: number;
    avgExecutionTime: number;
    errorRate: number;
  };
  usage: {
    totalExecutions: number;
    todayExecutions: number;
    weeklyExecutions: number;
    monthlyExecutions: number;
  };
  capabilities: string[];
  lastActivity: string;
  recentTasks: Array<{
    id: string;
    task: string;
    status: 'success' | 'failed' | 'running';
    executionTime: number;
    timestamp: string;
  }>;
  performanceHistory: Array<{
    date: string;
    score: number;
    executions: number;
    errors: number;
  }>;
}

export default function AgentDetailPage(): JSX.Element {
  const params = useParams();
  const agentId = params.id as string;
  const [agentMetrics, setAgentMetrics] = useState<AgentMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '90d'>('7d');

  useEffect(() => {
    const fetchAgentMetrics = async (): Promise<void> => {
      setIsLoading(true);
      try {
        // Simulate API call - replace with actual API integration
        await new Promise(resolve => setTimeout(resolve, 1000));

        const mockMetrics: AgentMetrics = {
          id: agentId,
          name: getAgentName(agentId),
          type: getAgentType(agentId),
          status: 'active',
          performance: {
            score: Math.floor(Math.random() * 20) + 80, // 80-100
            trend: (Math.random() - 0.5) * 10, // -5 to +5
            tasksCompleted: Math.floor(Math.random() * 1000) + 500,
            successRate: Math.random() * 0.1 + 0.9, // 90-100%
            avgExecutionTime: Math.random() * 2000 + 500, // 500-2500ms
            errorRate: Math.random() * 0.05, // 0-5%
          },
          usage: {
            totalExecutions: Math.floor(Math.random() * 10000) + 5000,
            todayExecutions: Math.floor(Math.random() * 100) + 20,
            weeklyExecutions: Math.floor(Math.random() * 500) + 100,
            monthlyExecutions: Math.floor(Math.random() * 2000) + 500,
          },
          capabilities: getAgentCapabilities(agentId),
          lastActivity: new Date(Date.now() - Math.random() * 3600000).toISOString(),
          recentTasks: generateRecentTasks(),
          performanceHistory: generatePerformanceHistory(timeRange),
        };

        setAgentMetrics(mockMetrics);
      } catch (error) {
        console.error('Failed to fetch agent metrics:', error);
        setAgentMetrics(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAgentMetrics();
  }, [agentId, timeRange]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-400"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!agentMetrics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🤖</div>
            <h3 className="text-xl font-semibold text-white mb-2">Agent Not Found</h3>
            <p className="text-purple-200">The requested agent could not be found.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">{agentMetrics.name.charAt(0)}</span>
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">{agentMetrics.name}</h1>
              <p className="text-purple-200">{agentMetrics.type} Agent • Performance Analytics</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                agentMetrics.status === 'active'
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-red-500/20 text-red-400'
              }`}
            >
              {agentMetrics.status}
            </div>
            <div className="flex space-x-2">
              {(['24h', '7d', '30d', '90d'] as const).map(range => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    timeRange === range
                      ? 'bg-purple-600 text-white shadow-lg'
                      : 'bg-white/10 text-purple-200 hover:bg-white/20'
                  }`}
                >
                  {range.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Performance Score"
            value={`${agentMetrics.performance.score}%`}
            change={`${agentMetrics.performance.trend > 0 ? '+' : ''}${agentMetrics.performance.trend.toFixed(1)}%`}
            positive={agentMetrics.performance.trend >= 0}
            icon="🎯"
          />
          <MetricCard
            title="Success Rate"
            value={`${(agentMetrics.performance.successRate * 100).toFixed(1)}%`}
            change={`${agentMetrics.performance.tasksCompleted} tasks`}
            positive={true}
            icon="✅"
          />
          <MetricCard
            title="Avg Execution Time"
            value={`${agentMetrics.performance.avgExecutionTime.toFixed(0)}ms`}
            change={`${agentMetrics.performance.errorRate.toFixed(2)}% error rate`}
            positive={agentMetrics.performance.errorRate < 0.02}
            icon="⚡"
          />
          <MetricCard
            title="Total Executions"
            value={agentMetrics.usage.totalExecutions.toLocaleString()}
            change={`${agentMetrics.usage.todayExecutions} today`}
            positive={true}
            icon="🔄"
          />
        </div>

        {/* Performance Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Performance Trend */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <h3 className="text-xl font-semibold text-white mb-4">Performance Trend</h3>
            <div className="h-64 flex items-end space-x-2">
              {agentMetrics.performanceHistory.map((data, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-gradient-to-t from-purple-600 to-purple-400 rounded-t"
                    style={{ height: `${data.score}%` }}
                  />
                  <span className="text-xs text-purple-200 mt-2 transform -rotate-45 origin-left">
                    {data.date.slice(-5)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Usage Statistics */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <h3 className="text-xl font-semibold text-white mb-4">Usage Statistics</h3>
            <div className="space-y-4">
              <UsageBar
                label="Today"
                value={agentMetrics.usage.todayExecutions}
                max={agentMetrics.usage.weeklyExecutions}
                color="bg-green-500"
              />
              <UsageBar
                label="This Week"
                value={agentMetrics.usage.weeklyExecutions}
                max={agentMetrics.usage.monthlyExecutions}
                color="bg-blue-500"
              />
              <UsageBar
                label="This Month"
                value={agentMetrics.usage.monthlyExecutions}
                max={agentMetrics.usage.totalExecutions}
                color="bg-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Capabilities and Recent Tasks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Agent Capabilities */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <h3 className="text-xl font-semibold text-white mb-4">Agent Capabilities</h3>
            <div className="space-y-3">
              {agentMetrics.capabilities.map((capability, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span className="text-white">{capability}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Tasks */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <h3 className="text-xl font-semibold text-white mb-4">Recent Tasks</h3>
            <div className="space-y-3">
              {agentMetrics.recentTasks.map((task, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        task.status === 'success'
                          ? 'bg-green-400'
                          : task.status === 'failed'
                            ? 'bg-red-400'
                            : 'bg-yellow-400'
                      }`}
                    ></div>
                    <span className="text-white text-sm">{task.task}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-purple-200 text-xs">{task.executionTime}ms</div>
                    <div className="text-purple-300 text-xs">
                      {new Date(task.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Performance Insights */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
          <h3 className="text-xl font-semibold text-white mb-4">Performance Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400 mb-2">
                {agentMetrics.performance.score >= 95
                  ? 'Excellent'
                  : agentMetrics.performance.score >= 85
                    ? 'Good'
                    : agentMetrics.performance.score >= 70
                      ? 'Fair'
                      : 'Needs Improvement'}
              </div>
              <div className="text-purple-200">Overall Performance</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400 mb-2">
                {agentMetrics.performance.avgExecutionTime < 1000
                  ? 'Fast'
                  : agentMetrics.performance.avgExecutionTime < 2000
                    ? 'Moderate'
                    : 'Slow'}
              </div>
              <div className="text-purple-200">Execution Speed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400 mb-2">
                {agentMetrics.performance.errorRate < 0.01
                  ? 'Excellent'
                  : agentMetrics.performance.errorRate < 0.03
                    ? 'Good'
                    : 'Needs Attention'}
              </div>
              <div className="text-purple-200">Reliability</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper functions and components
function getAgentName(agentId: string): string {
  const agentNames: Record<string, string> = {
    'content-agent': 'Content Agent',
    'seo-agent': 'SEO Agent',
    'email-agent': 'Email Agent',
    'social-agent': 'Social Agent',
    'support-agent': 'Support Agent',
    'trend-agent': 'Trend Agent',
    'outreach-agent': 'Outreach Agent',
    'ui-refinement-agent': 'UI Refinement Agent',
  };
  return agentNames[agentId] || 'Unknown Agent';
}

function getAgentType(agentId: string): string {
  const agentTypes: Record<string, string> = {
    'content-agent': 'Content Generation',
    'seo-agent': 'SEO Optimization',
    'email-agent': 'Email Marketing',
    'social-agent': 'Social Media',
    'support-agent': 'Customer Support',
    'trend-agent': 'Trend Analysis',
    'outreach-agent': 'Outreach & Proposals',
    'ui-refinement-agent': 'UI/UX Optimization',
  };
  return agentTypes[agentId] || 'General Purpose';
}

function getAgentCapabilities(agentId: string): string[] {
  const capabilities: Record<string, string[]> = {
    'content-agent': [
      'Generate blog posts',
      'Create social media content',
      'Write product descriptions',
      'Content optimization',
    ],
    'seo-agent': ['Keyword research', 'On-page optimization', 'Technical SEO', 'Content analysis'],
    'email-agent': ['Email campaigns', 'A/B testing', 'Segmentation', 'Automation'],
    'social-agent': [
      'Multi-platform posting',
      'Engagement tracking',
      'Content scheduling',
      'Analytics',
    ],
    'support-agent': ['Ticket management', 'WhatsApp integration', 'Knowledge base', 'Escalation'],
    'trend-agent': [
      'Cross-platform trends',
      'Viral prediction',
      'Hashtag tracking',
      'Competitor analysis',
    ],
    'outreach-agent': ['PDF proposals', 'HTML proposals', 'Email outreach', 'Lead generation'],
    'ui-refinement-agent': [
      'UX analysis',
      'A/B testing',
      'Conversion optimization',
      'User journey mapping',
    ],
  };
  return capabilities[agentId] || ['General capabilities'];
}

function generateRecentTasks(): any[] {
  const tasks = [
    'Generate content',
    'Optimize SEO',
    'Send email',
    'Analyze trends',
    'Create proposal',
  ];
  return Array.from({ length: 5 }, (_, i) => ({
    id: `task_${i}`,
    task: tasks[Math.floor(Math.random() * tasks.length)],
    status: ['success', 'success', 'success', 'failed', 'running'][
      Math.floor(Math.random() * 5)
    ] as any,
    executionTime: Math.floor(Math.random() * 2000) + 500,
    timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(),
  }));
}

function generatePerformanceHistory(timeRange: string): any[] {
  const days = timeRange === '24h' ? 24 : timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
  return Array.from({ length: Math.min(days, 20) }, (_, i) => ({
    date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    score: Math.floor(Math.random() * 20) + 80,
    executions: Math.floor(Math.random() * 100) + 10,
    errors: Math.floor(Math.random() * 5),
  }));
}

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  positive: boolean;
  icon: string;
}

function MetricCard({ title, value, change, positive, icon }: MetricCardProps): JSX.Element {
  return (
    <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all">
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        <span className={`text-sm font-medium ${positive ? 'text-green-400' : 'text-red-400'}`}>
          {change}
        </span>
      </div>
      <h3 className="text-purple-200 text-sm font-medium">{title}</h3>
      <p className="text-2xl font-bold text-white mt-1">{value}</p>
    </div>
  );
}

interface UsageBarProps {
  label: string;
  value: number;
  max: number;
  color: string;
}

function UsageBar({ label, value, max, color }: UsageBarProps): JSX.Element {
  const percentage = (value / max) * 100;

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-white">{label}</span>
        <span className="text-purple-200">{value.toLocaleString()}</span>
      </div>
      <div className="w-full bg-white/20 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${color}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}
