'use client';

import { useState } from 'react';
import { api } from '../../utils/trpc';
import {
  BeakerIcon,
  ChartBarIcon,
  PlayIcon,
  StopIcon,
  TrophyIcon,
  ClockIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';

export default function ABTestingPage(): JSX.Element {
  const tests = [
    {
      id: 1,
      name: 'Email Subject Line Test',
      status: 'running',
      variants: 2,
      traffic: 50,
      winner: null,
      confidence: 89,
      runtime: '5 days',
      metric: 'Open Rate',
    },
    {
      id: 2,
      name: 'CTA Button Color',
      status: 'completed',
      variants: 3,
      traffic: 100,
      winner: 'Variant B',
      confidence: 95,
      runtime: '14 days',
      metric: 'Click Rate',
    },
    {
      id: 3,
      name: 'Landing Page Layout',
      status: 'scheduled',
      variants: 2,
      traffic: 75,
      winner: null,
      confidence: 0,
      runtime: '0 days',
      metric: 'Conversion Rate',
    },
  ];

  return (
    <div className="min-h-screen p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-primary mb-2">A/B Testing</h1>
            <p className="text-secondary text-lg">Experiment management and optimization</p>
          </div>
          <button className="btn-neon">
            <PlusIcon className="h-5 w-5 mr-2" />
            New Test
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="stat-card">
          <BeakerIcon className="h-8 w-8 text-neon-blue mb-2" />
          <div className="stat-number">12</div>
          <div className="text-sm text-secondary">Active Tests</div>
        </div>
        <div className="stat-card">
          <TrophyIcon className="h-8 w-8 text-neon-green mb-2" />
          <div className="stat-number">89</div>
          <div className="text-sm text-secondary">Completed</div>
        </div>
        <div className="stat-card">
          <ChartBarIcon className="h-8 w-8 text-neon-purple mb-2" />
          <div className="stat-number">23%</div>
          <div className="text-sm text-secondary">Avg Lift</div>
        </div>
        <div className="stat-card">
          <ClockIcon className="h-8 w-8 text-neon-pink mb-2" />
          <div className="stat-number">7.2</div>
          <div className="text-sm text-secondary">Avg Duration</div>
        </div>
      </div>

      <div className="space-y-6">
        {tests.map(test => (
          <div key={test.id} className="card-neon">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <BeakerIcon className="h-6 w-6 text-neon-blue" />
                <div>
                  <h3 className="text-lg font-bold text-primary">{test.name}</h3>
                  <p className="text-sm text-secondary">
                    {test.variants} variants • {test.metric}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    test.status === 'running'
                      ? 'bg-neon-green text-black'
                      : test.status === 'completed'
                        ? 'bg-neon-blue text-white'
                        : 'bg-neon-orange text-black'
                  }`}
                >
                  {test.status}
                </span>
                <button className="p-2 glass rounded-lg text-secondary hover:text-neon-blue">
                  {test.status === 'running' ? (
                    <StopIcon className="h-4 w-4" />
                  ) : (
                    <PlayIcon className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-secondary mb-1">Traffic Split</div>
                <div className="text-lg font-bold text-primary">{test.traffic}%</div>
              </div>
              <div>
                <div className="text-sm text-secondary mb-1">Runtime</div>
                <div className="text-lg font-bold text-primary">{test.runtime}</div>
              </div>
              <div>
                <div className="text-sm text-secondary mb-1">Confidence</div>
                <div className="text-lg font-bold text-neon-green">{test.confidence}%</div>
              </div>
              <div>
                <div className="text-sm text-secondary mb-1">Winner</div>
                <div className="text-lg font-bold text-primary">{test.winner || 'TBD'}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
