'use client';

import React, { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FunnelIcon,
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlayIcon,
  PauseIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  BoltIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  EyeIcon,
  CursorArrowRaysIcon,
  UserGroupIcon,
  ArrowPathIcon,
  PlusIcon,
  StopIcon,
  PencilIcon,
  TrashIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  FilterIcon,
} from '@heroicons/react/24/outline';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

// Types for Campaign Management
interface Campaign {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'draft' | 'completed';
  startDate: string;
  endDate: string;
  budget: number;
  spent: number;
  roi: number;
  impressions: number;
  clicks: number;
  conversions: number;
  assignedAgents: string[];
  description: string;
  timeline: CampaignMilestone[];
  abTests: ABTest[];
}

interface CampaignMilestone {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  status: 'completed' | 'in-progress' | 'pending' | 'delayed';
  progress: number;
  assignedTo: string;
}

interface ABTest {
  id: string;
  name: string;
  status: 'running' | 'completed' | 'paused';
  variants: ABVariant[];
  confidence: number;
  winner?: string;
  startDate: string;
  endDate?: string;
}

interface ABVariant {
  id: string;
  name: string;
  traffic: number;
  openRate: number;
  clickRate: number;
  conversionRate: number;
  revenue: number;
}

// Mock campaign data
const mockCampaigns: Campaign[] = [
  {
    id: 'camp-001',
    name: 'Q1 Product Launch Campaign',
    status: 'active',
    startDate: '2024-01-15',
    endDate: '2024-03-15',
    budget: 50000,
    spent: 32000,
    roi: 340,
    impressions: 2450000,
    clicks: 48500,
    conversions: 1250,
    assignedAgents: ['ContentAgent', 'AdAgent', 'SocialAgent'],
    description: 'Major product launch campaign targeting enterprise customers',
    timeline: [
      {
        id: 'ms-001',
        title: 'Campaign Setup',
        description: 'Initial campaign configuration and asset preparation',
        dueDate: '2024-01-20',
        status: 'completed',
        progress: 100,
        assignedTo: 'ContentAgent',
      },
      {
        id: 'ms-002',
        title: 'Ad Creative Development',
        description: 'Design and develop ad creatives for all platforms',
        dueDate: '2024-02-01',
        status: 'in-progress',
        progress: 75,
        assignedTo: 'DesignAgent',
      },
      {
        id: 'ms-003',
        title: 'Launch Phase 1',
        description: 'Initial campaign launch with limited audience',
        dueDate: '2024-02-15',
        status: 'pending',
        progress: 25,
        assignedTo: 'AdAgent',
      },
    ],
    abTests: [
      {
        id: 'ab-001',
        name: 'Email Subject Line Test',
        status: 'completed',
        confidence: 95,
        winner: 'variant-b',
        startDate: '2024-01-20',
        endDate: '2024-02-01',
        variants: [
          {
            id: 'variant-a',
            name: 'Control: "New Product Launch"',
            traffic: 50,
            openRate: 22.5,
            clickRate: 4.2,
            conversionRate: 2.8,
            revenue: 12500,
          },
          {
            id: 'variant-b',
            name: 'Test: "Revolutionary Tool Inside"',
            traffic: 50,
            openRate: 28.7,
            clickRate: 6.1,
            conversionRate: 4.3,
            revenue: 18900,
          },
        ],
      },
      {
        id: 'ab-002',
        name: 'Landing Page CTA Test',
        status: 'running',
        confidence: 78,
        startDate: '2024-02-01',
        variants: [
          {
            id: 'variant-a',
            name: 'Control: "Get Started"',
            traffic: 33,
            openRate: 0,
            clickRate: 12.3,
            conversionRate: 8.1,
            revenue: 15200,
          },
          {
            id: 'variant-b',
            name: 'Test: "Start Free Trial"',
            traffic: 33,
            openRate: 0,
            clickRate: 14.7,
            conversionRate: 9.2,
            revenue: 17800,
          },
          {
            id: 'variant-c',
            name: 'Test: "Claim Your Spot"',
            traffic: 34,
            openRate: 0,
            clickRate: 11.8,
            conversionRate: 7.9,
            revenue: 14100,
          },
        ],
      },
    ],
  },
  {
    id: 'camp-002',
    name: 'Summer Email Series',
    status: 'paused',
    startDate: '2024-02-01',
    endDate: '2024-04-30',
    budget: 25000,
    spent: 8500,
    roi: 180,
    impressions: 890000,
    clicks: 15200,
    conversions: 420,
    assignedAgents: ['EmailAgent', 'ContentAgent'],
    description: 'Seasonal email marketing campaign for summer products',
    timeline: [
      {
        id: 'ms-004',
        title: 'Email Template Design',
        description: 'Create responsive email templates',
        dueDate: '2024-02-10',
        status: 'completed',
        progress: 100,
        assignedTo: 'DesignAgent',
      },
      {
        id: 'ms-005',
        title: 'Content Creation',
        description: 'Write email copy for entire series',
        dueDate: '2024-02-20',
        status: 'delayed',
        progress: 60,
        assignedTo: 'ContentAgent',
      },
    ],
    abTests: [
      {
        id: 'ab-003',
        name: 'Send Time Optimization',
        status: 'paused',
        confidence: 45,
        startDate: '2024-02-05',
        variants: [
          {
            id: 'variant-a',
            name: '9 AM Send',
            traffic: 50,
            openRate: 19.3,
            clickRate: 3.1,
            conversionRate: 1.8,
            revenue: 4200,
          },
          {
            id: 'variant-b',
            name: '2 PM Send',
            traffic: 50,
            openRate: 16.8,
            clickRate: 2.9,
            conversionRate: 1.6,
            revenue: 3800,
          },
        ],
      },
    ],
  },
  {
    id: 'camp-003',
    name: 'Social Media Awareness',
    status: 'draft',
    startDate: '2024-03-01',
    endDate: '2024-05-31',
    budget: 35000,
    spent: 0,
    roi: 0,
    impressions: 0,
    clicks: 0,
    conversions: 0,
    assignedAgents: ['SocialAgent', 'DesignAgent'],
    description: 'Brand awareness campaign across all social platforms',
    timeline: [
      {
        id: 'ms-006',
        title: 'Strategy Development',
        description: 'Develop comprehensive social media strategy',
        dueDate: '2024-02-25',
        status: 'pending',
        progress: 0,
        assignedTo: 'SocialAgent',
      },
    ],
    abTests: [],
  },
];

export default function CampaignManagementPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>(mockCampaigns);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [selectedABTest, setSelectedABTest] = useState<ABTest | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Filter campaigns
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(campaign => {
      const matchesSearch = campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           campaign.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [campaigns, searchQuery, statusFilter]);

  // Timeline scroll functions
  const scrollTimeline = (direction: 'left' | 'right') => {
    if (timelineRef.current) {
      const scrollAmount = 300;
      const newScrollLeft = timelineRef.current.scrollLeft + 
        (direction === 'right' ? scrollAmount : -scrollAmount);
      timelineRef.current.scrollTo({ left: newScrollLeft, behavior: 'smooth' });
    }
  };

  // Get status colors and animations
  const getStatusConfig = (status: string) => {
    const configs = {
      active: { 
        color: 'text-neon-green', 
        bg: 'bg-neon-green/20', 
        border: 'border-neon-green',
        animation: 'animate-pulse'
      },
      paused: { 
        color: 'text-neon-orange', 
        bg: 'bg-neon-orange/20', 
        border: 'border-neon-orange',
        animation: 'animate-pulse'
      },
      draft: { 
        color: 'text-neon-blue', 
        bg: 'bg-neon-blue/20', 
        border: 'border-neon-blue',
        animation: ''
      },
      completed: { 
        color: 'text-neon-purple', 
        bg: 'bg-neon-purple/20', 
        border: 'border-neon-purple',
        animation: ''
      },
    };
    return configs[status as keyof typeof configs] || configs.draft;
  };

  // Get milestone status icon
  const getMilestoneIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircleIcon;
      case 'in-progress': return BoltIcon;
      case 'delayed': return ExclamationTriangleIcon;
      default: return ClockIcon;
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Format percentage
  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className="min-h-screen bg-dark-space text-white">
      {/* Header */}
      <div className="nav-glass sticky top-0 z-40 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <ChartBarIcon className="h-8 w-8 text-neon-blue" />
              <div>
                <h1 className="text-2xl font-bold text-gradient">Campaign Management</h1>
                <p className="text-sm text-secondary">Monitor and optimize marketing campaigns</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary" />
              <input
                type="text"
                placeholder="Search campaigns..."
                className="input-neon pl-10 pr-4 py-2 w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {/* Status Filter */}
            <div className="flex items-center space-x-2">
              {['all', 'active', 'paused', 'draft', 'completed'].map((status) => {
                const config = status === 'all' ? 
                  { color: 'text-white', bg: 'bg-gray-700/50', border: 'border-gray-600', animation: '' } :
                  getStatusConfig(status);
                
                return (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-4 py-2 rounded-xl transition-all duration-300 border ${
                      statusFilter === status
                        ? `${config.bg} ${config.border} ${config.color} ${config.animation}`
                        : 'bg-gray-800/50 border-gray-700 text-secondary hover:bg-gray-700/50'
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-8">
        {/* Campaign Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
          {filteredCampaigns.map((campaign) => {
            const statusConfig = getStatusConfig(campaign.status);
            const isExpanded = expandedCard === campaign.id;
            const budgetProgress = (campaign.spent / campaign.budget) * 100;
            
            return (
              <motion.div
                key={campaign.id}
                layout
                className={`card-neon cursor-pointer transition-all duration-300 ${
                  isExpanded ? 'lg:col-span-2 xl:col-span-2' : ''
                }`}
                onClick={() => {
                  setExpandedCard(isExpanded ? null : campaign.id);
                  setSelectedCampaign(campaign);
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Campaign Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-primary mb-2">{campaign.name}</h3>
                    <p className="text-sm text-secondary line-clamp-2">{campaign.description}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusConfig.bg} ${statusConfig.border} ${statusConfig.color} ${statusConfig.animation}`}>
                    {campaign.status.toUpperCase()}
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${campaign.roi > 200 ? 'text-neon-green' : campaign.roi > 100 ? 'text-neon-blue' : 'text-neon-orange'}`}>
                      {campaign.roi}%
                    </div>
                    <div className="text-xs text-secondary">ROI</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-lg font-bold text-primary">
                      {(campaign.impressions / 1000000).toFixed(1)}M
                    </div>
                    <div className="text-xs text-secondary">Impressions</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-lg font-bold text-primary">
                      {(campaign.clicks / 1000).toFixed(1)}K
                    </div>
                    <div className="text-xs text-secondary">Clicks</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-lg font-bold text-primary">{campaign.conversions}</div>
                    <div className="text-xs text-secondary">Conversions</div>
                  </div>
                </div>

                {/* Budget Progress */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-secondary">Budget</span>
                    <span className="text-primary">
                      {formatCurrency(campaign.spent)} / {formatCurrency(campaign.budget)}
                    </span>
                  </div>
                  <div className="progress-neon">
                    <div 
                      className={`progress-fill transition-all duration-1000 ${
                        budgetProgress > 90 ? 'bg-gradient-to-r from-neon-pink to-neon-orange' :
                        budgetProgress > 70 ? 'bg-gradient-to-r from-neon-orange to-neon-green' :
                        'bg-gradient-to-r from-neon-blue to-neon-green'
                      }`}
                      style={{ width: `${Math.min(budgetProgress, 100)}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-muted mt-1">
                    {formatPercentage(budgetProgress)} spent
                  </div>
                </div>

                {/* Assigned Agents */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <UserGroupIcon className="h-4 w-4 text-secondary" />
                    <span className="text-sm text-secondary">
                      {campaign.assignedAgents.length} agents assigned
                    </span>
                  </div>
                  <div className="flex space-x-1">
                    {campaign.assignedAgents.slice(0, 3).map((agent, index) => (
                      <div
                        key={agent}
                        className="w-8 h-8 bg-gradient-to-r from-neon-blue to-neon-purple rounded-full flex items-center justify-center text-xs font-semibold"
                        style={{ zIndex: 10 - index }}
                      >
                        {agent.charAt(0)}
                      </div>
                    ))}
                    {campaign.assignedAgents.length > 3 && (
                      <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-xs font-semibold">
                        +{campaign.assignedAgents.length - 3}
                      </div>
                    )}
                  </div>
                </div>

                {/* Expanded Content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-6 pt-6 border-t border-gray-800"
                    >
                      {/* Campaign Actions */}
                      <div className="flex items-center space-x-3 mb-6">
                        <button className="btn-neon-green flex items-center space-x-2">
                          <PlayIcon className="h-4 w-4" />
                          <span>Resume</span>
                        </button>
                        <button className="btn-neon-orange flex items-center space-x-2">
                          <PauseIcon className="h-4 w-4" />
                          <span>Pause</span>
                        </button>
                        <button className="btn-neon flex items-center space-x-2">
                          <ChartBarIcon className="h-4 w-4" />
                          <span>Analytics</span>
                        </button>
                      </div>

                      {/* Detailed Metrics */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="glass p-4 rounded-xl text-center">
                          <CurrencyDollarIcon className="h-6 w-6 text-neon-green mx-auto mb-2" />
                          <div className="text-lg font-bold text-neon-green">
                            {formatCurrency(campaign.spent * (campaign.roi / 100))}
                          </div>
                          <div className="text-xs text-secondary">Revenue</div>
                        </div>
                        
                        <div className="glass p-4 rounded-xl text-center">
                          <EyeIcon className="h-6 w-6 text-neon-blue mx-auto mb-2" />
                          <div className="text-lg font-bold text-neon-blue">
                            {formatPercentage((campaign.clicks / campaign.impressions) * 100)}
                          </div>
                          <div className="text-xs text-secondary">CTR</div>
                        </div>
                        
                        <div className="glass p-4 rounded-xl text-center">
                          <CursorArrowRaysIcon className="h-6 w-6 text-neon-purple mx-auto mb-2" />
                          <div className="text-lg font-bold text-neon-purple">
                            {formatPercentage((campaign.conversions / campaign.clicks) * 100)}
                          </div>
                          <div className="text-xs text-secondary">Conversion Rate</div>
                        </div>
                        
                        <div className="glass p-4 rounded-xl text-center">
                          <CalendarIcon className="h-6 w-6 text-neon-orange mx-auto mb-2" />
                          <div className="text-lg font-bold text-neon-orange">
                            {Math.ceil((new Date(campaign.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}
                          </div>
                          <div className="text-xs text-secondary">Days Left</div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* Campaign Timeline */}
        {selectedCampaign && (
          <div className="mb-8">
            <div className="glass-strong p-6 rounded-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-primary">Campaign Timeline</h2>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => scrollTimeline('left')}
                    className="p-2 glass rounded-lg hover:bg-gray-700 transition-all"
                  >
                    <ChevronLeftIcon className="h-5 w-5 text-secondary" />
                  </button>
                  <button
                    onClick={() => scrollTimeline('right')}
                    className="p-2 glass rounded-lg hover:bg-gray-700 transition-all"
                  >
                    <ChevronRightIcon className="h-5 w-5 text-secondary" />
                  </button>
                </div>
              </div>
              
              <div 
                ref={timelineRef}
                className="flex space-x-6 overflow-x-auto pb-4"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {selectedCampaign.timeline.map((milestone, index) => {
                  const Icon = getMilestoneIcon(milestone.status);
                  const statusConfig = getStatusConfig(milestone.status);
                  
                  return (
                    <motion.div
                      key={milestone.id}
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex-shrink-0 w-80 glass p-6 rounded-xl"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <Icon className={`h-6 w-6 ${statusConfig.color}`} />
                        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${statusConfig.bg} ${statusConfig.color}`}>
                          {milestone.status.replace('-', ' ').toUpperCase()}
                        </div>
                      </div>
                      
                      <h3 className="text-lg font-bold text-primary mb-2">{milestone.title}</h3>
                      <p className="text-sm text-secondary mb-4">{milestone.description}</p>
                      
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-secondary">Progress</span>
                          <span className="text-primary">{milestone.progress}%</span>
                        </div>
                        <div className="progress-neon">
                          <div 
                            className="progress-fill bg-gradient-to-r from-neon-blue to-neon-green transition-all duration-1000"
                            style={{ width: `${milestone.progress}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-muted">
                        <span>Due: {new Date(milestone.dueDate).toLocaleDateString()}</span>
                        <span>{milestone.assignedTo}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* A/B Test Results */}
        {selectedCampaign && selectedCampaign.abTests.length > 0 && (
          <div className="glass-strong p-6 rounded-2xl">
            <h2 className="text-2xl font-bold text-primary mb-6">A/B Test Results</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Test Selection */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-secondary">Active Tests</h3>
                {selectedCampaign.abTests.map((test) => (
                  <motion.div
                    key={test.id}
                    className={`glass p-4 rounded-xl cursor-pointer transition-all duration-300 ${
                      selectedABTest?.id === test.id ? 'glow-border' : ''
                    }`}
                    onClick={() => setSelectedABTest(test)}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-primary">{test.name}</h4>
                      <div className={`px-2 py-1 rounded-full text-xs ${getStatusConfig(test.status).bg} ${getStatusConfig(test.status).color}`}>
                        {test.status.toUpperCase()}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center space-x-1">
                        <TrendingUpIcon className="h-4 w-4 text-neon-green" />
                        <span className="text-secondary">Confidence: {test.confidence}%</span>
                      </div>
                      {test.winner && (
                        <div className="flex items-center space-x-1">
                          <CheckCircleIcon className="h-4 w-4 text-neon-green" />
                          <span className="text-neon-green">Winner</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Test Results Viewer */}
              <div className="lg:col-span-2">
                {selectedABTest ? (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-primary">{selectedABTest.name}</h3>
                      <div className="flex items-center space-x-2">
                        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusConfig(selectedABTest.status).bg} ${getStatusConfig(selectedABTest.status).color}`}>
                          {selectedABTest.status.toUpperCase()}
                        </div>
                        <div className="text-sm text-secondary">
                          Confidence: {selectedABTest.confidence}%
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedABTest.variants.map((variant) => {
                        const isWinner = selectedABTest.winner === variant.id;
                        
                        return (
                          <motion.div
                            key={variant.id}
                            className={`glass p-4 rounded-xl ${isWinner ? 'glow-border' : ''}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                          >
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="font-semibold text-primary">{variant.name}</h4>
                              {isWinner && (
                                <div className="px-2 py-1 rounded-full text-xs font-semibold bg-neon-green/20 text-neon-green">
                                  WINNER
                                </div>
                              )}
                            </div>

                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-secondary">Traffic</span>
                                <span className="text-sm font-semibold text-primary">{variant.traffic}%</span>
                              </div>

                              {variant.openRate > 0 && (
                                <div>
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm text-secondary">Open Rate</span>
                                    <span className="text-sm font-semibold text-primary">{formatPercentage(variant.openRate)}</span>
                                  </div>
                                  <div className="progress-neon h-1">
                                    <div 
                                      className="progress-fill bg-gradient-to-r from-neon-blue to-neon-purple h-1"
                                      style={{ width: `${variant.openRate}%` }}
                                    ></div>
                                  </div>
                                </div>
                              )}

                              <div>
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-sm text-secondary">Click Rate</span>
                                  <span className="text-sm font-semibold text-primary">{formatPercentage(variant.clickRate)}</span>
                                </div>
                                <div className="progress-neon h-1">
                                  <div 
                                    className="progress-fill bg-gradient-to-r from-neon-green to-neon-blue h-1"
                                    style={{ width: `${variant.clickRate}%` }}
                                  ></div>
                                </div>
                              </div>

                              <div>
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-sm text-secondary">Conversion Rate</span>
                                  <span className="text-sm font-semibold text-primary">{formatPercentage(variant.conversionRate)}</span>
                                </div>
                                <div className="progress-neon h-1">
                                  <div 
                                    className="progress-fill bg-gradient-to-r from-neon-pink to-neon-orange h-1"
                                    style={{ width: `${variant.conversionRate * 5}%` }}
                                  ></div>
                                </div>
                              </div>

                              <div className="pt-2 border-t border-gray-800">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-secondary">Revenue</span>
                                  <span className="text-lg font-bold text-neon-green">{formatCurrency(variant.revenue)}</span>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 text-secondary">
                    <div className="text-center">
                      <ChartBarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Select an A/B test to view results</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 