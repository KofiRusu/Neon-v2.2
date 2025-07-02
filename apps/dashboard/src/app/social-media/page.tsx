'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '../../utils/trpc';
import AgentRunPanel from '../../components/AgentRunPanel';
import AnalyticsChart from '../../components/AnalyticsChart';
import {
  GlobeAltIcon,
  CpuChipIcon,
  BoltIcon,
  ChartBarIcon,
  PlayIcon,
  PauseIcon,
  CogIcon,
  PlusIcon,
  SparklesIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  UserGroupIcon,
  HashtagIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  ShareIcon,
  DocumentDuplicateIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

interface GeneratedPost {
  id: string;
  content: string;
  hashtags: string[];
  platform: string;
  estimatedReach?: number;
  engagementScore?: number;
}

interface SocialAgent {
  id: string;
  name: string;
  platform: string;
  status: 'active' | 'paused' | 'inactive' | 'running';
  performance: number;
  postsToday: number;
  engagement: number;
  followers: number;
  lastAction: string;
  icon: string;
  color: string;
}

interface PlatformMetric {
  platform: string;
  posts: number;
  engagement: number;
  reach: number;
  growth: number;
  icon: string;
  color: string;
}

export default function SocialMediaAgentPage(): JSX.Element {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedPlatform, setSelectedPlatform] = useState<'instagram' | 'facebook' | 'twitter' | 'linkedin' | 'tiktok' | 'youtube'>('instagram');
  const [postTopic, setPostTopic] = useState('');
  const [postTone, setPostTone] = useState<'professional' | 'casual' | 'friendly' | 'authoritative' | 'playful'>('professional');
  const [generatedPost, setGeneratedPost] = useState<GeneratedPost | null>(null);
  const [showGeneratedPost, setShowGeneratedPost] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // tRPC mutations and queries
  const generatePostMutation = api.social.generatePost.useMutation({
    onSuccess: (data) => {
      if (data.success && data.posts && data.posts.length > 0) {
        const post = data.posts[0];
        setGeneratedPost({
          id: post.id || Math.random().toString(),
          content: post.content,
          hashtags: post.hashtags || [],
          platform: selectedPlatform,
          estimatedReach: post.estimatedReach,
          engagementScore: post.engagementScore,
        });
        setShowGeneratedPost(true);
      }
    },
    onError: (error) => {
      console.error('Failed to generate post:', error);
    },
  });

  const schedulePostMutation = api.social.schedulePost.useMutation({
    onSuccess: (data) => {
      console.log('Post scheduled successfully:', data);
    },
    onError: (error) => {
      console.error('Failed to schedule post:', error);
    },
  });

  const { data: platformInsights } = api.social.getPlatformInsights.useQuery({
    platform: selectedPlatform,
    timeRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      end: new Date(),
    },
  });

  // Handler functions
  const handleGeneratePost = async () => {
    if (!postTopic.trim()) return;
    
    await generatePostMutation.mutateAsync({
      platform: selectedPlatform,
      topic: postTopic,
      tone: postTone,
      includeHashtags: true,
    });
  };

  const handleCopyPost = async () => {
    if (!generatedPost) return;
    
    try {
      const textToCopy = `${generatedPost.content}\n\n${generatedPost.hashtags.join(' ')}`;
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleSchedulePost = async () => {
    if (!generatedPost) return;
    
    await schedulePostMutation.mutateAsync({
      platform: selectedPlatform,
      content: {
        text: generatedPost.content,
        hashtags: generatedPost.hashtags,
      },
      scheduling: {
        publishNow: false,
        scheduledAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
        timezone: 'UTC',
      },
      settings: {
        enableComments: true,
      },
    });
  };

  const socialAgents: SocialAgent[] = [
    {
      id: '1',
      name: 'Instagram Content Agent',
      platform: 'Instagram',
      status: generatePostMutation.isLoading && selectedPlatform === 'instagram' ? 'running' : 'active',
      performance: 94,
      postsToday: 8,
      engagement: 87,
      followers: 42300,
      lastAction: '2 min ago',
      icon: '📷',
      color: 'neon-pink',
    },
    {
      id: '2',
      name: 'LinkedIn Business Agent',
      platform: 'LinkedIn',
      status: generatePostMutation.isLoading && selectedPlatform === 'linkedin' ? 'running' : 'active',
      performance: 91,
      postsToday: 3,
      engagement: 92,
      followers: 15800,
      lastAction: '15 min ago',
      icon: '💼',
      color: 'neon-blue',
    },
    {
      id: '3',
      name: 'Twitter Engagement Agent',
      platform: 'Twitter',
      status: generatePostMutation.isLoading && selectedPlatform === 'twitter' ? 'running' : 'active',
      performance: 89,
      postsToday: 12,
      engagement: 78,
      followers: 28400,
      lastAction: '1 min ago',
      icon: '🐦',
      color: 'neon-green',
    },
    {
      id: '4',
      name: 'TikTok Viral Agent',
      platform: 'TikTok',
      status: 'paused',
      performance: 96,
      postsToday: 0,
      engagement: 95,
      followers: 67200,
      lastAction: '2 hours ago',
      icon: '🎵',
      color: 'neon-purple',
    },
  ];

  const platformMetrics: PlatformMetric[] = [
    {
      platform: 'Instagram',
      posts: 156,
      engagement: 8.7,
      reach: 450000,
      growth: 12.3,
      icon: '📷',
      color: 'neon-pink',
    },
    {
      platform: 'LinkedIn',
      posts: 89,
      engagement: 9.2,
      reach: 230000,
      growth: 18.5,
      icon: '💼',
      color: 'neon-blue',
    },
    {
      platform: 'Twitter',
      posts: 234,
      engagement: 6.8,
      reach: 680000,
      growth: 8.9,
      icon: '🐦',
      color: 'neon-green',
    },
    {
      platform: 'TikTok',
      posts: 67,
      engagement: 15.2,
      reach: 890000,
      growth: 24.1,
      icon: '🎵',
      color: 'neon-purple',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-neon-green';
      case 'paused':
        return 'text-yellow-400';
      case 'inactive':
        return 'text-gray-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-neon-green/20';
      case 'paused':
        return 'bg-yellow-400/20';
      case 'inactive':
        return 'bg-gray-400/20';
      default:
        return 'bg-gray-400/20';
    }
  };

  const recentActivity = [
    {
      id: '1',
      agent: 'Instagram Content Agent',
      action: 'Generated viral reel concept with trending audio',
      time: '2 min ago',
      platform: 'Instagram',
      icon: '📷',
    },
    {
      id: '2',
      agent: 'Twitter Engagement Agent',
      action: 'Replied to 15 mentions with personalized responses',
      time: '5 min ago',
      platform: 'Twitter',
      icon: '🐦',
    },
    {
      id: '3',
      agent: 'LinkedIn Business Agent',
      action: 'Published thought leadership article on AI trends',
      time: '15 min ago',
      platform: 'LinkedIn',
      icon: '💼',
    },
    {
      id: '4',
      agent: 'Instagram Content Agent',
      action: 'Optimized hashtag strategy for beauty campaign',
      time: '22 min ago',
      platform: 'Instagram',
      icon: '📷',
    },
  ];

  // Mock analytics data
  const engagementData = [
    { date: '2024-01-15', value: 2450, label: 'High engagement day' },
    { date: '2024-01-16', value: 1890, label: 'Regular posting' },
    { date: '2024-01-17', value: 3200, label: 'Viral post boost' },
    { date: '2024-01-18', value: 2100, label: 'Steady growth' },
    { date: '2024-01-19', value: 2800, label: 'Weekend peak' },
    { date: '2024-01-20', value: 2650, label: 'Consistent performance' },
    { date: '2024-01-21', value: 3450, label: 'New content launch' },
  ];

  const PLATFORMS = [
    { value: 'instagram', label: 'Instagram', icon: '📷', color: 'neon-pink' },
    { value: 'facebook', label: 'Facebook', icon: '👥', color: 'neon-blue' },
    { value: 'twitter', label: 'Twitter', icon: '🐦', color: 'neon-green' },
    { value: 'linkedin', label: 'LinkedIn', icon: '💼', color: 'neon-blue' },
    { value: 'tiktok', label: 'TikTok', icon: '🎵', color: 'neon-purple' },
    { value: 'youtube', label: 'YouTube', icon: '📺', color: 'neon-pink' },
  ];

  const TONES = [
    { value: 'professional', label: 'Professional' },
    { value: 'casual', label: 'Casual' },
    { value: 'friendly', label: 'Friendly' },
    { value: 'authoritative', label: 'Authoritative' },
    { value: 'playful', label: 'Playful' },
  ];

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">
              <span className="text-neon-blue">Social Media</span>
              <span className="text-primary"> Agent</span>
            </h1>
            <p className="text-secondary text-lg">
              AI-powered social media automation and engagement management
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden lg:flex items-center space-x-4 text-sm text-secondary">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse"></div>
                <span>All Agents Online</span>
              </div>
              <div className="text-muted">•</div>
              <div>{currentTime.toLocaleTimeString()}</div>
            </div>

            <div className="flex items-center space-x-2">
              <button className="btn-neon">
                <PlusIcon className="h-5 w-5 mr-2" />
                New Agent
              </button>
              <Link href="/social" className="btn-neon-purple">
                <GlobeAltIcon className="h-5 w-5 mr-2" />
                Content Manager
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* AI Post Generator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2">
          <AgentRunPanel
            agentName="Social Content Generator"
            agentStatus={generatePostMutation.isLoading ? 'running' : 'active'}
            onRun={handleGeneratePost}
            disabled={!postTopic.trim()}
          >
            <div className="space-y-4">
              {/* Platform Selection */}
              <div>
                <label className="block text-sm font-medium text-primary mb-2">Platform</label>
                <select
                  value={selectedPlatform}
                  onChange={(e) => setSelectedPlatform(e.target.value as any)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-primary focus:outline-none focus:border-neon-blue"
                >
                  {PLATFORMS.map(platform => (
                    <option key={platform.value} value={platform.value}>
                      {platform.icon} {platform.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Topic Input */}
              <div>
                <label className="block text-sm font-medium text-primary mb-2">Topic</label>
                <textarea
                  value={postTopic}
                  onChange={(e) => setPostTopic(e.target.value)}
                  placeholder="What would you like to post about? (e.g., 'AI marketing trends for 2024')"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-primary placeholder-gray-400 focus:outline-none focus:border-neon-blue resize-none"
                  rows={3}
                />
              </div>

              {/* Tone Selection */}
              <div>
                <label className="block text-sm font-medium text-primary mb-2">Tone</label>
                <select
                  value={postTone}
                  onChange={(e) => setPostTone(e.target.value as any)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-primary focus:outline-none focus:border-neon-blue"
                >
                  {TONES.map(tone => (
                    <option key={tone.value} value={tone.value}>
                      {tone.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </AgentRunPanel>
        </div>

        {/* Generated Post Sidebar */}
        <div className="lg:col-span-1">
          {showGeneratedPost && generatedPost ? (
            <div className="glass-strong p-6 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-primary">Generated Content</h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleCopyPost}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      copied ? 'bg-neon-green/20 text-neon-green' : 'bg-gray-700 text-secondary hover:text-neon-blue'
                    }`}
                    title="Copy to clipboard"
                  >
                    {copied ? <CheckCircleIcon className="h-4 w-4" /> : <DocumentDuplicateIcon className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Platform Preview */}
              <div className="glass p-4 rounded-xl border border-gray-600 mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-neon-blue to-neon-purple flex items-center justify-center text-white text-sm font-bold">
                    {PLATFORMS.find(p => p.value === selectedPlatform)?.icon}
                  </div>
                  <div>
                    <div className="text-primary font-medium">NeonHub</div>
                    <div className="text-xs text-secondary">Just now</div>
                  </div>
                </div>
                <div className="text-primary whitespace-pre-wrap mb-3">
                  {generatedPost.content}
                </div>
                {generatedPost.hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {generatedPost.hashtags.map((hashtag, index) => (
                      <span
                        key={index}
                        className="bg-blue-600/20 text-blue-400 border border-blue-600/30 px-2 py-1 rounded-full text-xs"
                      >
                        {hashtag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Metrics */}
              {(generatedPost.estimatedReach || generatedPost.engagementScore) && (
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {generatedPost.estimatedReach && (
                    <div className="glass p-3 rounded-lg text-center">
                      <div className="text-neon-purple text-lg mb-1">👥</div>
                      <div className="text-primary font-semibold">
                        {generatedPost.estimatedReach.toLocaleString()}
                      </div>
                      <div className="text-xs text-secondary">Est. Reach</div>
                    </div>
                  )}
                  {generatedPost.engagementScore && (
                    <div className="glass p-3 rounded-lg text-center">
                      <div className="text-neon-green text-lg mb-1">📈</div>
                      <div className="text-primary font-semibold">
                        {generatedPost.engagementScore}%
                      </div>
                      <div className="text-xs text-secondary">Score</div>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="space-y-2">
                <button
                  onClick={handleSchedulePost}
                  disabled={schedulePostMutation.isLoading}
                  className="w-full btn-neon flex items-center justify-center py-2"
                >
                  {schedulePostMutation.isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Scheduling...
                    </>
                  ) : (
                    <>
                      <ClockIcon className="h-4 w-4 mr-2" />
                      Schedule Post
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowGeneratedPost(false)}
                  className="w-full text-secondary hover:text-primary transition-colors text-sm"
                >
                  Generate New Content
                </button>
              </div>
            </div>
          ) : (
            <div className="glass-strong p-6 rounded-2xl text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-neon-blue to-neon-purple rounded-2xl flex items-center justify-center mx-auto mb-4">
                <SparklesIcon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-bold text-primary mb-2">No Content Generated</h3>
              <p className="text-secondary text-sm">
                Enter a topic and run the agent to generate AI-powered social media content
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Analytics Chart */}
      <div className="mb-8">
        <AnalyticsChart
          data={engagementData}
          title="Engagement Over Time"
          subtitle="Daily engagement metrics across all platforms"
          color="neon-green"
          showTrend={true}
        />
      </div>

      {/* Platform Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {platformMetrics.map(metric => (
          <div key={metric.platform} className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 bg-${metric.color} rounded-xl flex items-center justify-center`}>
                <span className="text-2xl">{metric.icon}</span>
              </div>
              <div className="text-right">
                <div className="text-xs text-secondary">{metric.platform}</div>
                <div className={`stat-number text-${metric.color}`}>{metric.posts}</div>
                <div className="text-xs text-muted">posts this month</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-secondary">Engagement</span>
                <span className="text-neon-green font-semibold">{metric.engagement}%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-secondary">Reach</span>
                <span className="text-primary font-semibold">{metric.reach.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-secondary">Growth</span>
                <span className="text-neon-green font-semibold">+{metric.growth}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* AI Agents Grid */}
        <div className="glass-strong p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-primary">Social Media Agents</h2>
            <button className="text-neon-blue hover:text-neon-purple transition-colors text-sm font-medium">
              Configure All →
            </button>
          </div>

          <div className="space-y-4">
            {socialAgents.map(agent => (
              <div key={agent.id} className="glass p-4 rounded-xl hover:scale-105 transition-all duration-300">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 bg-${agent.color} rounded-xl flex items-center justify-center`}>
                      <span className="text-xl">{agent.icon}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-primary">{agent.name}</h3>
                      <p className="text-xs text-secondary">{agent.platform}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBg(agent.status)} ${getStatusColor(agent.status)}`}>
                      {agent.status}
                    </div>
                    <button className="p-2 text-secondary hover:text-neon-blue">
                      <CogIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-3">
                  <div className="text-center">
                    <div className="text-sm font-semibold text-primary">{agent.postsToday}</div>
                    <div className="text-xs text-secondary">Posts Today</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-semibold text-neon-green">{agent.engagement}%</div>
                    <div className="text-xs text-secondary">Engagement</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-semibold text-neon-blue">{agent.followers.toLocaleString()}</div>
                    <div className="text-xs text-secondary">Followers</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-secondary">Performance</span>
                    <span className="text-neon-green font-semibold">{agent.performance}%</span>
                  </div>
                  <div className="progress-neon">
                    <div className="progress-fill" style={{ width: `${agent.performance}%` }}></div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted">Last action</span>
                    <span className="text-secondary">{agent.lastAction}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Activity Feed */}
        <div className="glass-strong p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-primary">Agent Activity</h2>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse"></div>
              <span className="text-xs text-secondary">Live Feed</span>
            </div>
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {recentActivity.map(activity => (
              <div key={activity.id} className="glass p-4 rounded-xl">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-neon-blue to-neon-purple rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">{activity.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-semibold text-neon-blue text-sm">{activity.agent}</span>
                      <span className="text-xs text-muted">•</span>
                      <span className="text-xs text-secondary">{activity.time}</span>
                    </div>
                    <p className="text-sm text-primary leading-relaxed">{activity.action}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <div className="w-1.5 h-1.5 bg-neon-green rounded-full"></div>
                      <span className="text-xs text-neon-green">Completed</span>
                      <span className="text-xs text-muted">•</span>
                      <span className="text-xs text-secondary">{activity.platform}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <div className="glass-strong p-6 rounded-2xl">
          <h2 className="text-2xl font-bold text-primary mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="btn-neon flex items-center justify-center py-4">
              <SparklesIcon className="h-5 w-5 mr-2" />
              Generate Content
            </button>
            <button className="btn-neon-purple flex items-center justify-center py-4">
              <ChartBarIcon className="h-5 w-5 mr-2" />
              Analytics Report
            </button>
            <button className="btn-neon-pink flex items-center justify-center py-4">
              <HashtagIcon className="h-5 w-5 mr-2" />
              Trending Hashtags
            </button>
            <button className="btn-neon-green flex items-center justify-center py-4">
              <CpuChipIcon className="h-5 w-5 mr-2" />
              Train Agents
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 