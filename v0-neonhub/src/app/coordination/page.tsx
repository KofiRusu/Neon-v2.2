'use client';

import { useState } from 'react';
import { api } from '../../utils/trpc';
import {
  CogIcon,
  BoltIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CpuChipIcon,
  ArrowPathIcon,
  LinkIcon,
  ChartBarIcon,
  CommandLineIcon,
  RocketLaunchIcon,
} from '@heroicons/react/24/outline';

export default function CoordinationPage(): JSX.Element {
  const [selectedWorkflow, setSelectedWorkflow] = useState('campaign-launch');
  const [isRunning, setIsRunning] = useState(false);

  const workflows = [
    {
      id: 'campaign-launch',
      name: 'Campaign Launch Sequence',
      description: 'Coordinated campaign deployment across all channels',
      status: 'active',
      progress: 75,
      agents: ['ContentAgent', 'SocialAgent', 'EmailAgent', 'AdAgent'],
      duration: '45 min',
      priority: 'high',
    },
    {
      id: 'content-optimization',
      name: 'Content Optimization Pipeline',
      description: 'SEO and engagement optimization workflow',
      status: 'running',
      progress: 60,
      agents: ['SEOAgent', 'ContentAgent', 'InsightAgent'],
      duration: '30 min',
      priority: 'medium',
    },
    {
      id: 'customer-nurture',
      name: 'Customer Nurture Flow',
      description: 'Automated customer engagement and retention',
      status: 'scheduled',
      progress: 0,
      agents: ['EmailAgent', 'SupportAgent', 'InsightAgent'],
      duration: '2 hours',
      priority: 'low',
    },
  ];

  const activeAgents = [
    {
      id: 'content',
      name: 'ContentAgent',
      status: 'processing',
      task: 'Generating blog post variants',
      progress: 85,
      eta: '3 min',
      connections: ['seo', 'social'],
    },
    {
      id: 'seo',
      name: 'SEOAgent',
      status: 'waiting',
      task: 'Awaiting content for optimization',
      progress: 0,
      eta: '5 min',
      connections: ['content', 'insight'],
    },
    {
      id: 'social',
      name: 'SocialAgent',
      status: 'active',
      task: 'Scheduling cross-platform posts',
      progress: 45,
      eta: '8 min',
      connections: ['content', 'ad'],
    },
    {
      id: 'email',
      name: 'EmailAgent',
      status: 'active',
      task: 'Deploying email sequence',
      progress: 92,
      eta: '2 min',
      connections: ['insight', 'support'],
    },
    {
      id: 'ad',
      name: 'AdAgent',
      status: 'processing',
      task: 'Optimizing ad spend allocation',
      progress: 67,
      eta: '4 min',
      connections: ['social', 'insight'],
    },
    {
      id: 'insight',
      name: 'InsightAgent',
      status: 'monitoring',
      task: 'Analyzing performance metrics',
      progress: 100,
      eta: 'Continuous',
      connections: ['seo', 'email', 'ad'],
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-neon-green';
      case 'processing':
        return 'text-neon-blue';
      case 'waiting':
        return 'text-neon-orange';
      case 'monitoring':
        return 'text-neon-purple';
      case 'running':
        return 'text-neon-green';
      case 'scheduled':
        return 'text-secondary';
      default:
        return 'text-secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return PlayIcon;
      case 'processing':
        return ArrowPathIcon;
      case 'waiting':
        return ClockIcon;
      case 'monitoring':
        return ChartBarIcon;
      case 'running':
        return BoltIcon;
      case 'scheduled':
        return ClockIcon;
      default:
        return CogIcon;
    }
  };

  return (
    <div className="min-h-screen p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-primary mb-2">Agent Coordination</h1>
            <p className="text-secondary text-lg">
              Multi-agent workflow orchestration and task management
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsRunning(!isRunning)}
              className={`btn-neon ${isRunning ? 'bg-neon-orange' : ''}`}
            >
              {isRunning ? (
                <PauseIcon className="h-5 w-5 mr-2" />
              ) : (
                <PlayIcon className="h-5 w-5 mr-2" />
              )}
              {isRunning ? 'Pause All' : 'Start All'}
            </button>
            <button className="btn-neon-purple">
              <RocketLaunchIcon className="h-5 w-5 mr-2" />
              New Workflow
            </button>
          </div>
        </div>
      </div>

      {/* Workflow Status */}
      <div className="glass-strong p-6 rounded-2xl mb-8">
        <h2 className="text-2xl font-bold text-primary mb-6">Active Workflows</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {workflows.map(workflow => {
            const StatusIcon = getStatusIcon(workflow.status);
            return (
              <div
                key={workflow.id}
                onClick={() => setSelectedWorkflow(workflow.id)}
                className={`card-neon cursor-pointer transition-all duration-300 ${
                  selectedWorkflow === workflow.id ? 'ring-2 ring-neon-blue scale-105' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <StatusIcon className={`h-6 w-6 ${getStatusColor(workflow.status)}`} />
                    <div>
                      <h3 className="font-bold text-primary">{workflow.name}</h3>
                      <p className="text-xs text-secondary">{workflow.description}</p>
                    </div>
                  </div>
                  <div
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      workflow.priority === 'high'
                        ? 'bg-neon-pink text-black'
                        : workflow.priority === 'medium'
                          ? 'bg-neon-orange text-black'
                          : 'bg-neon-green text-black'
                    }`}
                  >
                    {workflow.priority}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-secondary">Progress</span>
                    <span className="text-sm font-medium text-primary">{workflow.progress}%</span>
                  </div>

                  <div className="progress-neon">
                    <div className="progress-fill" style={{ width: `${workflow.progress}%` }}></div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-secondary">Duration</span>
                    <span className="text-sm text-primary">{workflow.duration}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-secondary">Agents</span>
                    <span className="text-sm text-neon-blue">{workflow.agents.length}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Agent Network */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Active Agents */}
        <div className="glass-strong p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-primary">Agent Network</h2>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse"></div>
              <span className="text-xs text-secondary">{activeAgents.length} active</span>
            </div>
          </div>

          <div className="space-y-4">
            {activeAgents.map(agent => {
              const StatusIcon = getStatusIcon(agent.status);
              return (
                <div key={agent.id} className="glass p-4 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-neon-blue to-neon-purple rounded-lg flex items-center justify-center">
                        <CpuChipIcon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-primary">{agent.name}</h3>
                        <p className="text-xs text-secondary">{agent.task}</p>
                      </div>
                    </div>
                    <StatusIcon className={`h-5 w-5 ${getStatusColor(agent.status)}`} />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-secondary">Progress</span>
                      <span className="text-primary font-medium">{agent.progress}%</span>
                    </div>

                    <div className="progress-neon">
                      <div className="progress-fill" style={{ width: `${agent.progress}%` }}></div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-secondary">ETA</span>
                      <span className="text-neon-blue">{agent.eta}</span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-secondary">Connections</span>
                      <div className="flex items-center space-x-1">
                        <LinkIcon className="h-3 w-3 text-neon-purple" />
                        <span className="text-neon-purple">{agent.connections.length}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Workflow Console */}
        <div className="glass-strong p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-primary">Workflow Console</h2>
            <button className="p-2 glass rounded-lg text-secondary hover:text-neon-blue transition-colors">
              <CommandLineIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="glass p-4 rounded-xl">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircleIcon className="h-4 w-4 text-neon-green" />
                <span className="text-sm text-secondary">2 min ago</span>
              </div>
              <p className="text-sm text-primary">ContentAgent completed blog post generation</p>
            </div>

            <div className="glass p-4 rounded-xl">
              <div className="flex items-center space-x-2 mb-2">
                <ArrowPathIcon className="h-4 w-4 text-neon-blue animate-spin" />
                <span className="text-sm text-secondary">Now</span>
              </div>
              <p className="text-sm text-primary">EmailAgent deploying personalized sequences</p>
            </div>

            <div className="glass p-4 rounded-xl">
              <div className="flex items-center space-x-2 mb-2">
                <ClockIcon className="h-4 w-4 text-neon-orange" />
                <span className="text-sm text-secondary">Waiting</span>
              </div>
              <p className="text-sm text-primary">SEOAgent queued for content optimization</p>
            </div>

            <div className="glass p-4 rounded-xl">
              <div className="flex items-center space-x-2 mb-2">
                <ExclamationTriangleIcon className="h-4 w-4 text-neon-pink" />
                <span className="text-sm text-secondary">5 min ago</span>
              </div>
              <p className="text-sm text-primary">
                AdAgent: Budget threshold reached, switching to optimization mode
              </p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-black/20 rounded-xl">
            <div className="flex items-center space-x-2 mb-2">
              <CommandLineIcon className="h-4 w-4 text-neon-green" />
              <span className="text-sm text-neon-green font-mono">neon-coordination@v2.1</span>
            </div>
            <div className="text-sm text-secondary font-mono">
              <p>Ready for commands...</p>
              <p className="text-neon-blue">Type 'help' for available commands</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
