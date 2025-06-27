'use client';

import { useState } from 'react';
import { api } from '../../utils/trpc';
import {
  CpuChipIcon,
  CircleStackIcon,
  ChartBarIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';

export default function MemoryPage(): JSX.Element {
  const [selectedAgent, setSelectedAgent] = useState('all');

  const agentMemories = [
    {
      id: 1,
      agent: 'ContentAgent',
      type: 'campaign_success',
      content: 'Blog post "AI Revolution" generated 250% more engagement',
      timestamp: '2 hours ago',
      importance: 'high',
    },
    {
      id: 2,
      agent: 'EmailAgent',
      type: 'optimization',
      content: 'Subject line "Exclusive Preview" improved open rates by 32%',
      timestamp: '4 hours ago',
      importance: 'medium',
    },
    {
      id: 3,
      agent: 'SocialAgent',
      type: 'audience_insight',
      content: 'LinkedIn posts perform 45% better on Tuesday mornings',
      timestamp: '1 day ago',
      importance: 'high',
    },
  ];

  return (
    <div className="min-h-screen p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-primary mb-2">Agent Memory</h1>
        <p className="text-secondary text-lg">Cross-agent learning and memory management</p>
      </div>

      <div className="glass-strong p-6 rounded-2xl mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="stat-card">
            <CircleStackIcon className="h-8 w-8 text-neon-blue mb-2" />
            <div className="stat-number">1,247</div>
            <div className="text-sm text-secondary">Total Memories</div>
          </div>
          <div className="stat-card">
            <ChartBarIcon className="h-8 w-8 text-neon-green mb-2" />
            <div className="stat-number">89</div>
            <div className="text-sm text-secondary">High Priority</div>
          </div>
          <div className="stat-card">
            <ClockIcon className="h-8 w-8 text-neon-purple mb-2" />
            <div className="stat-number">24</div>
            <div className="text-sm text-secondary">Recent</div>
          </div>
          <div className="stat-card">
            <CpuChipIcon className="h-8 w-8 text-neon-pink mb-2" />
            <div className="stat-number">7</div>
            <div className="text-sm text-secondary">Active Agents</div>
          </div>
        </div>
      </div>

      <div className="glass-strong p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-primary">Memory Log</h2>
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary" />
            <input
              type="text"
              placeholder="Search memories..."
              className="input-neon pl-10 pr-4 py-2 w-80"
            />
          </div>
        </div>

        <div className="space-y-4">
          {agentMemories.map(memory => (
            <div key={memory.id} className="card-neon">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-neon-blue to-neon-purple rounded-lg flex items-center justify-center">
                    <CpuChipIcon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary">{memory.agent}</h3>
                    <p className="text-xs text-secondary capitalize">
                      {memory.type.replace('_', ' ')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      memory.importance === 'high'
                        ? 'bg-neon-pink text-black'
                        : 'bg-neon-blue text-white'
                    }`}
                  >
                    {memory.importance}
                  </span>
                  <button className="p-2 glass rounded-lg text-secondary hover:text-neon-blue">
                    <EyeIcon className="h-4 w-4" />
                  </button>
                  <button className="p-2 glass rounded-lg text-secondary hover:text-neon-pink">
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="text-primary mb-2">{memory.content}</p>
              <p className="text-xs text-secondary">{memory.timestamp}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
