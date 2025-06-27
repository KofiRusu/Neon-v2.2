'use client';

import { useState } from 'react';
import { api } from '../../utils/trpc';
import {
  LightBulbIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  EyeIcon,
  BoltIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

export default function InsightsPage(): JSX.Element {
  const insights = [
    {
      id: 1,
      title: 'Email Performance Optimization',
      description: 'Tuesday emails show 34% higher open rates',
      category: 'email',
      impact: 'high',
      confidence: 94,
      recommendation: 'Schedule major campaigns on Tuesday mornings',
    },
    {
      id: 2,
      title: 'Social Media Engagement Pattern',
      description: 'Video content generates 3x more engagement',
      category: 'social',
      impact: 'medium',
      confidence: 87,
      recommendation: 'Increase video content production by 40%',
    },
    {
      id: 3,
      title: 'Customer Lifetime Value Trend',
      description: 'Mobile users have 22% higher LTV',
      category: 'customer',
      impact: 'high',
      confidence: 91,
      recommendation: 'Optimize mobile experience and targeting',
    },
  ];

  return (
    <div className="min-h-screen p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-primary mb-2">AI Insights</h1>
            <p className="text-secondary text-lg">Data-driven recommendations and predictions</p>
          </div>
          <button className="btn-neon">
            <BoltIcon className="h-5 w-5 mr-2" />
            Generate Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="stat-card">
          <LightBulbIcon className="h-8 w-8 text-neon-blue mb-2" />
          <div className="stat-number">23</div>
          <div className="text-sm text-secondary">New Insights</div>
        </div>
        <div className="stat-card">
          <ArrowTrendingUpIcon className="h-8 w-8 text-neon-green mb-2" />
          <div className="stat-number">89%</div>
          <div className="text-sm text-secondary">Avg Confidence</div>
        </div>
        <div className="stat-card">
          <ChartBarIcon className="h-8 w-8 text-neon-purple mb-2" />
          <div className="stat-number">$47K</div>
          <div className="text-sm text-secondary">Revenue Impact</div>
        </div>
      </div>

      <div className="space-y-6">
        {insights.map(insight => (
          <div key={insight.id} className="card-neon">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <LightBulbIcon className="h-6 w-6 text-neon-blue" />
                <div>
                  <h3 className="text-lg font-bold text-primary">{insight.title}</h3>
                  <p className="text-sm text-secondary">{insight.description}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    insight.impact === 'high'
                      ? 'bg-neon-pink text-black'
                      : 'bg-neon-blue text-white'
                  }`}
                >
                  {insight.impact} impact
                </span>
                <button className="btn-neon-purple">
                  <EyeIcon className="h-4 w-4 mr-2" />
                  View Details
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-primary mb-2">Recommendation</h4>
                <p className="text-secondary">{insight.recommendation}</p>
              </div>
              <div>
                <h4 className="font-semibold text-primary mb-2">Confidence</h4>
                <div className="flex items-center space-x-3">
                  <div className="progress-neon flex-1">
                    <div
                      className="progress-fill"
                      style={{ width: `${insight.confidence}%` }}
                    ></div>
                  </div>
                  <span className="text-neon-green font-bold">{insight.confidence}%</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
