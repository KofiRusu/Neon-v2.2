'use client';

import { useState, useCallback } from 'react';
import { format } from 'date-fns';
import { trpc } from '@/lib/trpc';

// Types
interface GeneratedPost {
  id: string;
  content: string;
  hashtags: string[];
  platform: string;
  estimatedReach?: number;
  engagementScore?: number;
}

interface ScheduledPost {
  id: string;
  platform: string;
  content: string;
  hashtags: string[];
  scheduledTime: Date;
  status: 'scheduled' | 'published' | 'failed';
  mediaUrls?: string[];
}

interface HashtagSuggestion {
  hashtag: string;
  estimatedReach: number;
  difficulty: number;
  relevanceScore: number;
}

interface ScheduledPostData {
  id: string;
  platform: string;
  content: string;
  hashtags: string[];
  scheduledTime: string | Date;
  status: string;
  mediaUrls?: string[];
}

const PLATFORMS = [
  {
    value: 'instagram',
    label: 'Instagram',
    color: 'bg-gradient-to-r from-purple-500 to-pink-500',
    icon: '📷',
  },
  { value: 'facebook', label: 'Facebook', color: 'bg-blue-600', icon: '👥' },
  { value: 'twitter', label: 'Twitter', color: 'bg-sky-500', icon: '🐦' },
  { value: 'linkedin', label: 'LinkedIn', color: 'bg-blue-700', icon: '💼' },
  { value: 'tiktok', label: 'TikTok', color: 'bg-black', icon: '🎵' },
  { value: 'youtube', label: 'YouTube', color: 'bg-red-600', icon: '📺' },
];

const TONES = [
  { value: 'professional', label: 'Professional' },
  { value: 'casual', label: 'Casual' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'authoritative', label: 'Authoritative' },
  { value: 'playful', label: 'Playful' },
];

export default function SocialMediaManagerPage(): JSX.Element {
  // State
  const [activeTab, setActiveTab] = useState('generator');
  const [selectedPlatform, setSelectedPlatform] = useState('instagram');
  const [postTopic, setPostTopic] = useState('');
  const [postTone, setPostTone] = useState('professional');
  const [hashtagTopic, setHashtagTopic] = useState('');
  const [generatedPost, setGeneratedPost] = useState<GeneratedPost | null>(null);
  const [hashtagSuggestions, setHashtagSuggestions] = useState<HashtagSuggestion[]>([]);
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState('12:00');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [copiedItems, setCopiedItems] = useState<Set<string>>(new Set());
  const [showToast, setShowToast] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error';
  }>({ show: false, message: '', type: 'success' });

  // tRPC mutations and queries
  const generatePostMutation = trpc.social.generatePost.useMutation({
    onSuccess: (data: {
      generatedPost?: {
        id: string;
        content: string;
        hashtags?: string[];
        estimatedReach?: number;
        engagementScore?: number;
      };
      posts?: {
        id: string;
        content: string;
        hashtags?: string[];
        estimatedReach?: number;
        engagementScore?: number;
      }[];
    }) => {
      // Handle both possible response formats
      const post = data.generatedPost || (data.posts && data.posts[0]);
      if (post) {
        setGeneratedPost({
          id: post.id,
          content: post.content,
          hashtags: post.hashtags || [],
          platform: selectedPlatform,
          estimatedReach: post.estimatedReach,
          engagementScore: post.engagementScore,
        });
        showToastMessage(
          `Generated ${post.content.length} character post for ${selectedPlatform}`,
          'success'
        );
      }
    },
    onError: (error: { message: string }) => {
      showToastMessage(error.message, 'error');
    },
  });

  const schedulePostMutation = trpc.social.schedulePost.useMutation({
    onSuccess: (data: { scheduledPosts?: ScheduledPostData[] }) => {
      if (data.scheduledPosts) {
        const newScheduledPosts = data.scheduledPosts.map((post: ScheduledPostData) => ({
          id: post.id,
          platform: post.platform,
          content: post.content,
          hashtags: post.hashtags || [],
          scheduledTime: new Date(post.scheduledTime),
          status: post.status as 'scheduled' | 'published' | 'failed',
          mediaUrls: post.mediaUrls || [],
        }));
        setScheduledPosts(prev => [...prev, ...newScheduledPosts]);
        setShowScheduleModal(false);
        showToastMessage(
          `Post scheduled for ${format(new Date(data.scheduledPosts[0].scheduledTime), 'PPP')}`,
          'success'
        );
      }
    },
    onError: (error: { message: string }) => {
      showToastMessage(error.message, 'error');
    },
  });

  const suggestHashtagsMutation = trpc.social.suggestHashtags.useMutation({
    onSuccess: (data: { hashtags?: HashtagSuggestion[]; suggestions?: HashtagSuggestion[] }) => {
      const suggestions = data.hashtags || data.suggestions || [];
      setHashtagSuggestions(suggestions);
      showToastMessage(`Found ${suggestions.length} relevant hashtags`, 'success');
    },
    onError: (error: { message: string }) => {
      showToastMessage(error.message, 'error');
    },
  });

  // Helper functions
  const showToastMessage = (message: string, type: 'success' | 'error'): void => {
    setShowToast({ show: true, message, type });
    setTimeout(() => setShowToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const generateHashtags = useCallback(async (): Promise<void> => {
    if (!hashtagTopic.trim()) {
      showToastMessage('Please enter a topic to generate hashtags', 'error');
      return;
    }

    suggestHashtagsMutation.mutate({
      topic: hashtagTopic,
      platform: selectedPlatform as
        | 'instagram'
        | 'facebook'
        | 'twitter'
        | 'linkedin'
        | 'tiktok'
        | 'youtube',
      count: 8,
    });
  }, [hashtagTopic, selectedPlatform, suggestHashtagsMutation]);

  const handleGeneratePost = async (): Promise<void> => {
    if (!postTopic.trim()) {
      showToastMessage('Please enter a topic to generate content', 'error');
      return;
    }

    generatePostMutation.mutate({
      platform: selectedPlatform as
        | 'instagram'
        | 'facebook'
        | 'twitter'
        | 'linkedin'
        | 'tiktok'
        | 'youtube',
      topic: postTopic,
      tone: postTone as 'professional' | 'casual' | 'friendly' | 'authoritative' | 'playful',
      includeHashtags: true,
    });
  };

  const handleCopyToClipboard = async (text: string, itemId: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItems(prev => new Set([...prev, itemId]));
      setTimeout(() => {
        setCopiedItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(itemId);
          return newSet;
        });
      }, 2000);
      showToastMessage('Content copied to clipboard', 'success');
    } catch (_error) {
      showToastMessage('Failed to copy to clipboard', 'error');
    }
  };

  const handleSchedulePost = (): void => {
    if (!generatedPost) {
      showToastMessage('Please generate a post first', 'error');
      return;
    }

    const scheduledDateTime = new Date(`${selectedDate}T${selectedTime}`);

    schedulePostMutation.mutate({
      platform: selectedPlatform as
        | 'facebook'
        | 'instagram'
        | 'twitter'
        | 'linkedin'
        | 'tiktok'
        | 'youtube',
      content: {
        text: generatedPost.content,
        hashtags: generatedPost.hashtags,
      },
      scheduling: {
        publishNow: false,
        scheduledAt: scheduledDateTime,
        timezone: 'UTC',
      },
      settings: {
        enableComments: true,
      },
    });
  };

  const getPlatformIcon = (platform: string): string => {
    const platformConfig = PLATFORMS.find(p => p.value === platform);
    return platformConfig?.icon || '📱';
  };

  const getPlatformColor = (platform: string): string => {
    const platformConfig = PLATFORMS.find(p => p.value === platform);
    return platformConfig?.color || 'bg-gray-500';
  };

  const formatScheduledTime = (date: Date): string => {
    return format(date, 'MMM dd, yyyy • h:mm a');
  };

  const TabButton = ({
    _id,
    label,
    active,
    onClick,
  }: {
    _id: string;
    label: string;
    active: boolean;
    onClick: () => void;
  }): JSX.Element => (
    <button
      onClick={onClick}
      className={`px-6 py-3 font-medium rounded-lg transition-all duration-200 ${
        active
          ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/25'
          : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 hover:text-white'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      {/* Toast Notification */}
      {showToast.show && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 ${
            showToast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          } text-white`}
        >
          {showToast.message}
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
          ✨ Social Media Manager
        </h1>
        <p className="text-slate-300 text-lg">
          AI-powered social media content generation and management
        </p>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 bg-slate-800/30 p-2 rounded-xl backdrop-blur-sm">
          <TabButton
            _id="generator"
            label="Post Generator"
            active={activeTab === 'generator'}
            onClick={() => setActiveTab('generator')}
          />
          <TabButton
            _id="hashtags"
            label="Hashtag Tool"
            active={activeTab === 'hashtags'}
            onClick={() => setActiveTab('hashtags')}
          />
          <TabButton
            _id="schedule"
            label="Schedule Grid"
            active={activeTab === 'schedule'}
            onClick={() => setActiveTab('schedule')}
          />
        </div>

        {/* Post Generator Tab */}
        {activeTab === 'generator' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Panel */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-purple-400">✏️</span>
                <h2 className="text-xl font-semibold text-white">Content Generator</h2>
              </div>
              <p className="text-slate-300 mb-6">Generate AI-powered social media posts</p>

              <div className="space-y-4">
                {/* Platform Selector */}
                <div>
                  <label className="block text-white text-sm font-medium mb-2">Platform</label>
                  <select
                    value={selectedPlatform}
                    onChange={e => setSelectedPlatform(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  >
                    {PLATFORMS.map(platform => (
                      <option key={platform.value} value={platform.value}>
                        {`${platform.icon} ${platform.label}`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Topic Input */}
                <div>
                  <label className="block text-white text-sm font-medium mb-2">Topic</label>
                  <textarea
                    placeholder="What would you like to post about? (e.g., 'LED neon signs for restaurants')"
                    value={postTopic}
                    onChange={e => setPostTopic(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder:text-slate-400 focus:outline-none focus:border-purple-500"
                    rows={3}
                  />
                </div>

                {/* Tone Selector */}
                <div>
                  <label className="block text-white text-sm font-medium mb-2">Tone</label>
                  <select
                    value={postTone}
                    onChange={e => setPostTone(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  >
                    {TONES.map(tone => (
                      <option key={tone.value} value={tone.value}>
                        {tone.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Generate Button */}
                <button
                  onClick={handleGeneratePost}
                  disabled={generatePostMutation.isLoading || !postTopic.trim()}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-all duration-200"
                >
                  {generatePostMutation.isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Generating...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">✨ Generate Post</span>
                  )}
                </button>
              </div>
            </div>

            {/* Output Panel */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-green-400">👁️</span>
                <h2 className="text-xl font-semibold text-white">Generated Content</h2>
              </div>
              <p className="text-slate-300 mb-6">Preview and copy your generated post</p>

              {generatedPost ? (
                <div className="space-y-4">
                  {/* Platform Preview */}
                  <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                    <div className="flex items-center gap-2 mb-3">
                      <div
                        className={`w-8 h-8 rounded-full ${getPlatformColor(generatedPost.platform)} flex items-center justify-center text-white text-sm font-bold`}
                      >
                        {getPlatformIcon(generatedPost.platform)}
                      </div>
                      <div>
                        <div className="text-white font-medium">NeonHub</div>
                        <div className="text-slate-400 text-xs">Just now</div>
                      </div>
                    </div>
                    <div className="text-white whitespace-pre-wrap mb-3">
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
                    <div className="grid grid-cols-2 gap-4">
                      {generatedPost.estimatedReach && (
                        <div className="bg-slate-700/30 rounded-lg p-3 text-center">
                          <div className="text-purple-400 text-2xl mb-1">👥</div>
                          <div className="text-white font-semibold">
                            {generatedPost.estimatedReach.toLocaleString()}
                          </div>
                          <div className="text-slate-400 text-xs">Est. Reach</div>
                        </div>
                      )}
                      {generatedPost.engagementScore && (
                        <div className="bg-slate-700/30 rounded-lg p-3 text-center">
                          <div className="text-green-400 text-2xl mb-1">📈</div>
                          <div className="text-white font-semibold">
                            {generatedPost.engagementScore}%
                          </div>
                          <div className="text-slate-400 text-xs">Engagement Score</div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        handleCopyToClipboard(
                          `${generatedPost.content}\n\n${generatedPost.hashtags.join(' ')}`,
                          generatedPost.id
                        )
                      }
                      className="flex-1 border border-slate-600 text-white hover:bg-slate-700 py-2 px-4 rounded-lg transition-colors"
                    >
                      {copiedItems.has(generatedPost.id) ? (
                        <span className="flex items-center justify-center gap-2">✓ Copied!</span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">📋 Copy</span>
                      )}
                    </button>
                    <button
                      onClick={() => setShowScheduleModal(true)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors"
                    >
                      📅 Schedule
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <div className="text-6xl mb-3 opacity-50">✨</div>
                  <p>Generate a post to see the preview</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Hashtag Tool Tab */}
        {activeTab === 'hashtags' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Hashtag Input */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-blue-400">#️⃣</span>
                <h2 className="text-xl font-semibold text-white">Hashtag Generator</h2>
              </div>
              <p className="text-slate-300 mb-6">Generate relevant hashtags for your content</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Topic or Keywords
                  </label>
                  <textarea
                    placeholder="Enter your topic or keywords (e.g., 'custom neon signs', 'restaurant lighting')"
                    value={hashtagTopic}
                    onChange={e => setHashtagTopic(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                    rows={3}
                  />
                </div>
                <button
                  onClick={generateHashtags}
                  disabled={suggestHashtagsMutation.isLoading || !hashtagTopic.trim()}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-all duration-200"
                >
                  {suggestHashtagsMutation.isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Generating...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      #️⃣ Suggest Hashtags
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Hashtag Results */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-green-400">📈</span>
                <h2 className="text-xl font-semibold text-white">Suggested Hashtags</h2>
              </div>
              <p className="text-slate-300 mb-6">Copy hashtags with performance metrics</p>

              {hashtagSuggestions.length > 0 ? (
                <div className="space-y-4">
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {hashtagSuggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className="bg-slate-700/50 rounded-lg p-3 border border-slate-600 hover:border-slate-500 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-blue-400 font-medium">{suggestion.hashtag}</span>
                          <button
                            onClick={() =>
                              handleCopyToClipboard(suggestion.hashtag, `hashtag-${index}`)
                            }
                            className="text-slate-300 hover:text-white text-sm"
                          >
                            {copiedItems.has(`hashtag-${index}`) ? '✓' : '📋'}
                          </button>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="text-center">
                            <div className="text-white font-semibold">
                              {suggestion.estimatedReach.toLocaleString()}
                            </div>
                            <div className="text-slate-400">Reach</div>
                          </div>
                          <div className="text-center">
                            <div className="text-white font-semibold">{suggestion.difficulty}%</div>
                            <div className="text-slate-400">Difficulty</div>
                          </div>
                          <div className="text-center">
                            <div className="text-white font-semibold">
                              {suggestion.relevanceScore}%
                            </div>
                            <div className="text-slate-400">Relevance</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      const allHashtags = hashtagSuggestions.map(h => h.hashtag).join(' ');
                      handleCopyToClipboard(allHashtags, 'all-hashtags');
                    }}
                    className="w-full border border-slate-600 text-white hover:bg-slate-700 py-2 px-4 rounded-lg transition-colors"
                  >
                    {copiedItems.has('all-hashtags') ? 'Copied All!' : 'Copy All Hashtags'}
                  </button>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <div className="text-6xl mb-3 opacity-50">#️⃣</div>
                  <p>Generate hashtags to see suggestions</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Schedule Grid Tab */}
        {activeTab === 'schedule' && (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-purple-400">📅</span>
              <h2 className="text-xl font-semibold text-white">Scheduled Posts</h2>
            </div>
            <p className="text-slate-300 mb-6">Manage your scheduled social media content</p>

            {scheduledPosts.length > 0 ? (
              <div className="space-y-4">
                {scheduledPosts.map(post => (
                  <div
                    key={post.id}
                    className="bg-slate-700/50 rounded-lg p-4 border border-slate-600 hover:border-slate-500 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div
                            className={`w-6 h-6 rounded ${getPlatformColor(post.platform)} flex items-center justify-center text-white text-xs`}
                          >
                            {getPlatformIcon(post.platform)}
                          </div>
                          <span className="text-white font-medium capitalize">{post.platform}</span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              post.status === 'scheduled'
                                ? 'bg-orange-600/20 text-orange-400'
                                : post.status === 'published'
                                  ? 'bg-green-600/20 text-green-400'
                                  : 'bg-red-600/20 text-red-400'
                            }`}
                          >
                            {post.status}
                          </span>
                        </div>
                        <p className="text-slate-300 text-sm mb-2 line-clamp-3">{post.content}</p>
                        {post.hashtags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {post.hashtags.slice(0, 5).map((hashtag, index) => (
                              <span
                                key={index}
                                className="bg-blue-600/20 text-blue-400 border border-blue-600/30 px-2 py-1 rounded-full text-xs"
                              >
                                {hashtag}
                              </span>
                            ))}
                            {post.hashtags.length > 5 && (
                              <span className="bg-slate-600/20 text-slate-400 border border-slate-600/30 px-2 py-1 rounded-full text-xs">
                                +{post.hashtags.length - 5} more
                              </span>
                            )}
                          </div>
                        )}
                        <div className="flex items-center gap-4 text-xs text-slate-400">
                          <div className="flex items-center gap-1">
                            🕒 {formatScheduledTime(post.scheduledTime)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button className="text-slate-400 hover:text-white p-2">✏️</button>
                        <button className="text-slate-400 hover:text-red-400 p-2">🗑️</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400">
                <div className="text-6xl mb-3 opacity-50">📅</div>
                <p>No scheduled posts yet</p>
                <p className="text-sm">Generate and schedule a post to see it here</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-white mb-4">Schedule Post</h3>
            <p className="text-slate-300 mb-6">Choose when to publish your post</p>

            <div className="space-y-4">
              <div>
                <label className="block text-white text-sm font-medium mb-2">Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">Time</label>
                <input
                  type="time"
                  value={selectedTime}
                  onChange={e => setSelectedTime(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowScheduleModal(false)}
                  className="flex-1 border border-slate-600 text-white hover:bg-slate-700 py-2 px-4 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSchedulePost}
                  disabled={schedulePostMutation.isLoading}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  {schedulePostMutation.isLoading ? 'Scheduling...' : 'Schedule Post'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
