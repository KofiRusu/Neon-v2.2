import { useState } from 'react';
import {
  DocumentTextIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
  CogIcon,
} from '@heroicons/react/24/outline';
import ContentAgentTab from './ContentAgentTab';
import SEOAgentTab from './SEOAgentTab';

export default function AgentsTab() {
  const [activeAgent, setActiveAgent] = useState<'content' | 'seo' | 'overview'>('overview');

  const agents = [
    {
      id: 'content',
      name: 'Content Agent',
      icon: DocumentTextIcon,
      color: 'text-blue-400',
      status: 'active',
      description: 'AI-powered content generation for all platforms',
      executions: 1247,
      successRate: 96.2,
    },
    {
      id: 'seo',
      name: 'SEO Agent',
      icon: MagnifyingGlassIcon,
      color: 'text-purple-400',
      status: 'active',
      description: 'Search engine optimization and keyword research',
      executions: 892,
      successRate: 94.8,
    },
  ];

  if (activeAgent === 'content') {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setActiveAgent('overview')}
            className="btn-secondary flex items-center space-x-2"
          >
            <span>← Back to Agents</span>
          </button>
        </div>
        <ContentAgentTab />
      </div>
    );
  }

  if (activeAgent === 'seo') {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setActiveAgent('overview')}
            className="btn-secondary flex items-center space-x-2"
          >
            <span>← Back to Agents</span>
          </button>
        </div>
        <SEOAgentTab />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* AI Agent Control Center Header */}
      <div className="card-glow">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <SparklesIcon className="h-8 w-8 text-neon-400" />
            <div>
              <h2 className="text-xl font-semibold text-white">AI Agent Control Center</h2>
              <p className="text-dark-400 text-sm">Manage and monitor your AI marketing agents</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-green-400 text-sm">2 Active Agents</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-dark-400 text-xs">Total Executions</p>
            <p className="text-2xl font-bold text-white">
              {agents.reduce((sum, agent) => sum + agent.executions, 0).toLocaleString()}
            </p>
          </div>
          <div className="text-center">
            <p className="text-dark-400 text-xs">Avg Success Rate</p>
            <p className="text-2xl font-bold text-green-400">
              {(agents.reduce((sum, agent) => sum + agent.successRate, 0) / agents.length).toFixed(
                1
              )}
              %
            </p>
          </div>
          <div className="text-center">
            <p className="text-dark-400 text-xs">Active Agents</p>
            <p className="text-2xl font-bold text-neon-400">
              {agents.filter(a => a.status === 'active').length}
            </p>
          </div>
          <div className="text-center">
            <p className="text-dark-400 text-xs">Uptime</p>
            <p className="text-2xl font-bold text-blue-400">99.8%</p>
          </div>
        </div>
      </div>

      {/* Phase 1 Agents - Content & SEO */}
      <div className="card-glow">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Phase 1 Agents - Content & SEO</h3>
          <span className="px-3 py-1 bg-green-500/20 text-green-400 text-sm rounded-full">
            Active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {agents.map(agent => (
            <div
              key={agent.id}
              className="agent-card cursor-pointer hover:scale-105 transition-transform"
              onClick={() => setActiveAgent(agent.id as any)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <agent.icon className={`h-10 w-10 ${agent.color}`} />
                  <div>
                    <h4 className="text-white font-medium">{agent.name}</h4>
                    <p className="text-dark-400 text-sm">{agent.description}</p>
                  </div>
                </div>
                <div className={`status-indicator ${agent.status}`}></div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-dark-400 text-xs">Executions</p>
                  <p className="text-white font-semibold">{agent.executions.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-dark-400 text-xs">Success Rate</p>
                  <p className="text-green-400 font-semibold">{agent.successRate}%</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-dark-400 text-sm capitalize">Status: {agent.status}</span>
                <button className="btn-pill flex items-center space-x-1">
                  <CogIcon className="h-4 w-4" />
                  <span className="text-xs">Configure</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Phase 2 Agents - Coming Soon */}
      <div className="card-glow">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">
            Phase 2 Agents - Email, Social & Support
          </h3>
          <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-sm rounded-full">
            In Development
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              name: 'Email Agent',
              description: 'Automated email sequences and nurturing',
              color: 'text-green-400',
            },
            {
              name: 'Social Agent',
              description: 'Multi-platform social media management',
              color: 'text-pink-400',
            },
            {
              name: 'Support Agent',
              description: 'WhatsApp and customer support automation',
              color: 'text-cyan-400',
            },
          ].map((agent, index) => (
            <div key={index} className="agent-card opacity-60">
              <div className="flex items-center space-x-3 mb-3">
                <SparklesIcon className={`h-8 w-8 ${agent.color}`} />
                <div>
                  <h4 className="text-white font-medium">{agent.name}</h4>
                  <p className="text-dark-400 text-sm">{agent.description}</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-dark-400 text-sm">Status: Coming Soon</span>
                <span className="px-2 py-1 bg-dark-700 text-dark-400 text-xs rounded">Phase 2</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card-glow">
        <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button onClick={() => setActiveAgent('content')} className="btn-secondary text-sm py-3">
            Generate Content
          </button>
          <button onClick={() => setActiveAgent('seo')} className="btn-secondary text-sm py-3">
            SEO Analysis
          </button>
          <button className="btn-secondary text-sm py-3 opacity-50 cursor-not-allowed">
            Send Emails
          </button>
          <button className="btn-secondary text-sm py-3 opacity-50 cursor-not-allowed">
            Schedule Posts
          </button>
        </div>
      </div>
    </div>
  );
}
