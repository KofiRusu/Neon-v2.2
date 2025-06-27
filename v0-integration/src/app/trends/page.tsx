'use client';

import { useState } from 'react';
import { api } from '../../utils/trpc';
import {
  ArrowTrendingUpIcon,
  FireIcon,
  EyeIcon,
  ChartBarIcon,
  GlobeAltIcon,
  HashtagIcon,
  PlayIcon,
  ClockIcon,
  BoltIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

export default function TrendsPage(): JSX.Element {
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const trendCategories = [
    { id: 'all', name: 'All Trends', icon: GlobeAltIcon },
    { id: 'social', name: 'Social Media', icon: HashtagIcon },
    { id: 'content', name: 'Content', icon: ChartBarIcon },
    { id: 'marketing', name: 'Marketing', icon: BoltIcon },
  ];

  const timePeriods = [
    { id: '24h', name: '24 Hours' },
    { id: '7d', name: '7 Days' },
    { id: '30d', name: '30 Days' },
    { id: '90d', name: '90 Days' },
  ];

  const trendingTopics = [
    {
      id: 1,
      keyword: 'AI Marketing Automation',
      growth: '+247%',
      volume: '1.2M',
      category: 'marketing',
      status: 'trending',
      prediction: 'rising',
      confidence: 94,
    },
    {
      id: 2,
      keyword: 'Sustainable Brand Values',
      growth: '+156%',
      volume: '890K',
      category: 'content',
      status: 'hot',
      prediction: 'peak',
      confidence: 89,
    },
    {
      id: 3,
      keyword: 'Short-form Video Content',
      growth: '+198%',
      volume: '2.1M',
      category: 'social',
      status: 'viral',
      prediction: 'rising',
      confidence: 96,
    },
    {
      id: 4,
      keyword: 'Voice Commerce',
      growth: '+89%',
      volume: '567K',
      category: 'marketing',
      status: 'emerging',
      prediction: 'early',
      confidence: 78,
    },
    {
      id: 5,
      keyword: 'Micro-Influencer Partnerships',
      growth: '+134%',
      volume: '1.5M',
      category: 'social',
      status: 'trending',
      prediction: 'sustained',
      confidence: 92,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'viral':
        return 'text-neon-pink';
      case 'hot':
        return 'text-neon-orange';
      case 'trending':
        return 'text-neon-blue';
      case 'emerging':
        return 'text-neon-green';
      default:
        return 'text-secondary';
    }
  };

  const getPredictionIcon = (prediction: string) => {
    switch (prediction) {
      case 'rising':
        return ArrowTrendingUpIcon;
      case 'peak':
        return FireIcon;
      case 'sustained':
        return PlayIcon;
      case 'early':
        return ClockIcon;
      default:
        return ChartBarIcon;
    }
  };

  return (
    <div className="min-h-screen p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-primary mb-2">Trend Intelligence</h1>
            <p className="text-secondary text-lg">AI-powered trend analysis and predictions</p>
          </div>
          <div className="flex items-center space-x-4">
            <button className="btn-neon">
              <BoltIcon className="h-5 w-5 mr-2" />
              Generate Report
            </button>
            <button className="btn-neon-purple">
              <EyeIcon className="h-5 w-5 mr-2" />
              Predict Trends
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-strong p-6 rounded-2xl mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <span className="text-primary font-medium">Category:</span>
            <div className="flex items-center space-x-2">
              {trendCategories.map(category => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-4 py-2 rounded-xl transition-all duration-300 flex items-center space-x-2 ${
                      selectedCategory === category.id
                        ? 'bg-neon-blue text-white'
                        : 'glass text-secondary hover:text-neon-blue'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-sm">{category.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-primary font-medium">Period:</span>
            <div className="flex items-center space-x-2">
              {timePeriods.map(period => (
                <button
                  key={period.id}
                  onClick={() => setSelectedPeriod(period.id)}
                  className={`px-4 py-2 rounded-xl transition-all duration-300 ${
                    selectedPeriod === period.id
                      ? 'bg-neon-purple text-white'
                      : 'glass text-secondary hover:text-neon-purple'
                  }`}
                >
                  {period.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Trending Topics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
        {trendingTopics.map(trend => {
          const PredictionIcon = getPredictionIcon(trend.prediction);
          return (
            <div
              key={trend.id}
              className="card-neon group hover:scale-105 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${getStatusColor(trend.status)} bg-current bg-opacity-10`}
                >
                  {trend.status}
                </div>
                <div className="flex items-center space-x-2">
                  <PredictionIcon className="h-4 w-4 text-neon-green" />
                  <span className="text-xs text-secondary">{trend.confidence}% confidence</span>
                </div>
              </div>

              <h3 className="text-lg font-bold text-primary mb-3">{trend.keyword}</h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-secondary">Growth</span>
                  <span className="text-neon-green font-bold">{trend.growth}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-secondary">Volume</span>
                  <span className="text-primary font-semibold">{trend.volume}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-secondary">Prediction</span>
                  <span className="text-neon-blue font-medium capitalize">{trend.prediction}</span>
                </div>

                <div className="progress-neon mt-4">
                  <div className="progress-fill" style={{ width: `${trend.confidence}%` }}></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search Trends */}
      <div className="glass-strong p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-primary">Search & Discover</h2>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse"></div>
            <span className="text-xs text-secondary">Live data</span>
          </div>
        </div>

        <div className="relative mb-6">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-secondary" />
          <input
            type="text"
            placeholder="Search for trends, keywords, or topics..."
            className="input-neon pl-12 pr-4 py-3 w-full text-lg"
          />
        </div>

        <div className="text-center py-12">
          <ChartBarIcon className="h-16 w-16 text-neon-blue mx-auto mb-4 opacity-50" />
          <p className="text-secondary">
            Enter a keyword to discover trending patterns and predictions
          </p>
        </div>
      </div>
    </div>
  );
}
