'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  GlobeAltIcon,
  CalendarIcon,
  ChartBarIcon,
  PhotoIcon,
  HashtagIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  SparklesIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { trpc } from '../lib/trpc';

// Form schemas
const contentGenerationSchema = z.object({
  platform: z.enum(['FACEBOOK', 'INSTAGRAM', 'TIKTOK', 'TWITTER', 'LINKEDIN']),
  contentType: z.enum(['post', 'story', 'reel', 'thread']),
  topic: z.string().min(1, 'Topic is required').max(200),
  tone: z
    .enum(['professional', 'casual', 'humorous', 'inspirational', 'promotional'])
    .default('professional'),
  targetAudience: z.string().optional(),
  includeHashtags: z.boolean().default(true),
  includeEmojis: z.boolean().default(true),
  maxLength: z.number().optional(),
});

const publishPostSchema = z.object({
  platforms: z
    .array(z.enum(['FACEBOOK', 'INSTAGRAM', 'TIKTOK', 'TWITTER', 'LINKEDIN']))
    .min(1, 'Select at least one platform'),
  content: z.object({
    text: z.string().min(1, 'Content is required').max(2000),
    images: z.array(z.string().url()).optional(),
    video: z.string().url().optional(),
    link: z.string().url().optional(),
  }),
  scheduling: z.object({
    publishNow: z.boolean().default(true),
    scheduledTime: z.date().optional(),
    timezone: z.string().default('UTC'),
  }),
  hashtags: z.array(z.string()).optional(),
});

type ContentGenerationForm = z.infer<typeof contentGenerationSchema>;
type PublishPostForm = z.infer<typeof publishPostSchema>;

const platformConfig = {
  FACEBOOK: { name: 'Facebook', color: 'blue', maxLength: 63206 },
  INSTAGRAM: { name: 'Instagram', color: 'pink', maxLength: 2200 },
  TIKTOK: { name: 'TikTok', color: 'black', maxLength: 150 },
  TWITTER: { name: 'Twitter', color: 'sky', maxLength: 280 },
  LINKEDIN: { name: 'LinkedIn', color: 'blue', maxLength: 3000 },
};

export default function SocialAgentTab() {
  const [activeSection, setActiveSection] = useState<
    'generate' | 'publish' | 'schedule' | 'analytics'
  >('generate');
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const [publishResult, setPublishResult] = useState<any>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['INSTAGRAM']);

  // Form setup
  const contentForm = useForm<ContentGenerationForm>({
    resolver: zodResolver(contentGenerationSchema),
    defaultValues: {
      platform: 'INSTAGRAM',
      contentType: 'post',
      topic: '',
      tone: 'professional',
      targetAudience: '',
      includeHashtags: true,
      includeEmojis: true,
    },
  });

  const publishForm = useForm<PublishPostForm>({
    resolver: zodResolver(publishPostSchema),
    defaultValues: {
      platforms: ['INSTAGRAM'],
      content: {
        text: '',
        images: [],
      },
      scheduling: {
        publishNow: true,
        timezone: 'UTC',
      },
      hashtags: [],
    },
  });

  // tRPC mutations
  const generateContent = trpc.social.generateContent.useMutation({
    onSuccess: data => {
      setGeneratedContent(data);
      publishForm.setValue('content.text', data.generatedText);
      publishForm.setValue('hashtags', data.hashtags);
    },
    onError: error => {
      console.error('Failed to generate content:', error);
    },
  });

  const publishPost = trpc.social.publishPost.useMutation({
    onSuccess: data => {
      setPublishResult(data);
    },
    onError: error => {
      console.error('Failed to publish post:', error);
    },
  });

  // tRPC queries
  const { data: analytics, isLoading: analyticsLoading } = trpc.social.getAnalytics.useQuery(
    { timeRange: '30d' },
    { enabled: activeSection === 'analytics' }
  );

  // Form handlers
  const onGenerateContent = (data: ContentGenerationForm) => {
    generateContent.mutate(data);
  };

  const onPublishPost = (data: PublishPostForm) => {
    publishPost.mutate({
      ...data,
      campaignId: 'temp-campaign-id', // In real app, get from context
    });
  };

  const togglePlatform = (platform: string) => {
    const current = publishForm.getValues('platforms');
    const updated = current.includes(platform as any)
      ? current.filter(p => p !== platform)
      : [...current, platform as any];

    if (updated.length > 0) {
      publishForm.setValue('platforms', updated);
      setSelectedPlatforms(updated);
    }
  };

  const getCharacterCount = (text: string, platform: string) => {
    const config = platformConfig[platform as keyof typeof platformConfig];
    return `${text.length}/${config.maxLength}`;
  };

  const suggestedHashtags = [
    '#marketing',
    '#socialmedia',
    '#digitalmarketing',
    '#branding',
    '#content',
    '#business',
    '#entrepreneur',
    '#startup',
    '#growth',
    '#innovation',
    '#ai',
    '#technology',
    '#automation',
    '#neonhub',
    '#success',
  ];

  const optimalTimes = {
    FACEBOOK: '9:00 AM, 1:00 PM, 3:00 PM',
    INSTAGRAM: '11:00 AM, 2:00 PM, 5:00 PM',
    TWITTER: '8:00 AM, 12:00 PM, 7:00 PM',
    LINKEDIN: '8:00 AM, 12:00 PM, 5:00 PM',
    TIKTOK: '6:00 AM, 10:00 AM, 7:00 PM',
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
            <GlobeAltIcon className="h-5 w-5 text-pink-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Social Media Agent</h1>
            <p className="text-sm text-gray-600">
              Generate content, schedule posts, and manage social platforms
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="h-2 w-2 bg-green-500 rounded-full"></div>
          <span className="text-sm text-gray-600">Agent Online</span>
        </div>
      </div>

      {/* Section Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'generate', name: 'Generate Content', icon: SparklesIcon },
          { id: 'publish', name: 'Publish Post', icon: GlobeAltIcon },
          { id: 'schedule', name: 'Schedule Calendar', icon: CalendarIcon },
          { id: 'analytics', name: 'Analytics', icon: ChartBarIcon },
        ].map(section => {
          const Icon = section.icon;
          return (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeSection === section.id
                  ? 'bg-white text-pink-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="h-4 w-4" />
              {section.name}
            </button>
          );
        })}
      </div>

      {/* Generate Content Section */}
      {activeSection === 'generate' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Content Generation Form */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Content Generation</h3>

            <form onSubmit={contentForm.handleSubmit(onGenerateContent)} className="space-y-4">
              {/* Platform Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Platform</label>
                <Controller
                  name="platform"
                  control={contentForm.control}
                  render={({ field }) => (
                    <select
                      {...field}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                    >
                      {Object.entries(platformConfig).map(([key, config]) => (
                        <option key={key} value={key}>
                          {config.name}
                        </option>
                      ))}
                    </select>
                  )}
                />
              </div>

              {/* Content Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Content Type</label>
                <Controller
                  name="contentType"
                  control={contentForm.control}
                  render={({ field }) => (
                    <select
                      {...field}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                    >
                      <option value="post">Post</option>
                      <option value="story">Story</option>
                      <option value="reel">Reel</option>
                      <option value="thread">Thread</option>
                    </select>
                  )}
                />
              </div>

              {/* Topic */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Topic</label>
                <input
                  {...contentForm.register('topic')}
                  type="text"
                  placeholder="What should the content be about?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
                {contentForm.formState.errors.topic && (
                  <p className="mt-1 text-sm text-red-600">
                    {contentForm.formState.errors.topic.message}
                  </p>
                )}
              </div>

              {/* Tone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tone</label>
                <Controller
                  name="tone"
                  control={contentForm.control}
                  render={({ field }) => (
                    <select
                      {...field}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                    >
                      <option value="professional">Professional</option>
                      <option value="casual">Casual</option>
                      <option value="humorous">Humorous</option>
                      <option value="inspirational">Inspirational</option>
                      <option value="promotional">Promotional</option>
                    </select>
                  )}
                />
              </div>

              {/* Target Audience */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Audience (Optional)
                </label>
                <input
                  {...contentForm.register('targetAudience')}
                  type="text"
                  placeholder="e.g., small business owners, marketers..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              {/* Options */}
              <div className="flex items-center space-x-6">
                <label className="flex items-center">
                  <input
                    {...contentForm.register('includeHashtags')}
                    type="checkbox"
                    className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Include Hashtags</span>
                </label>
                <label className="flex items-center">
                  <input
                    {...contentForm.register('includeEmojis')}
                    type="checkbox"
                    className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Include Emojis</span>
                </label>
              </div>

              {/* Generate Button */}
              <button
                type="submit"
                disabled={generateContent.isLoading}
                className="w-full bg-pink-600 text-white py-2 px-4 rounded-md hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {generateContent.isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <SparklesIcon className="h-4 w-4" />
                    Generate Content
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Content Preview */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Content Preview</h3>

            {generatedContent ? (
              <div className="space-y-4">
                {/* Platform Preview Card */}
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">NH</span>
                    </div>
                    <div>
                      <div className="font-medium text-sm">NeonHub</div>
                      <div className="text-xs text-gray-500">2 minutes ago</div>
                    </div>
                  </div>

                  <div className="text-sm text-gray-900 mb-3 whitespace-pre-wrap">
                    {generatedContent.generatedText}
                  </div>

                  {generatedContent.hashtags && generatedContent.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {generatedContent.hashtags.map((tag: string, index: number) => (
                        <span key={index} className="text-xs text-blue-600 hover:text-blue-700">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-gray-500 text-sm">
                    <button className="flex items-center gap-1 hover:text-red-500">
                      <span>❤️</span> Like
                    </button>
                    <button className="flex items-center gap-1 hover:text-blue-500">
                      <span>💬</span> Comment
                    </button>
                    <button className="flex items-center gap-1 hover:text-green-500">
                      <span>📤</span> Share
                    </button>
                  </div>
                </div>

                {/* Content Stats */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="font-medium text-blue-700">Character Count</div>
                    <div className="text-blue-600">
                      {generatedContent.generatedText.length} characters
                    </div>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <div className="font-medium text-purple-700">Hashtags</div>
                    <div className="text-purple-600">
                      {generatedContent.hashtags?.length || 0} tags
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-600">Content generated successfully</div>
                  <button
                    onClick={() => setActiveSection('publish')}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center gap-2"
                  >
                    <GlobeAltIcon className="h-4 w-4" />
                    Publish Now
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <SparklesIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Generate content to see the preview</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Publish Post Section */}
      {activeSection === 'publish' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Publish Form */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Publish to Social Media</h3>

            <form onSubmit={publishForm.handleSubmit(onPublishPost)} className="space-y-4">
              {/* Platform Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Platforms
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(platformConfig).map(([key, config]) => (
                    <label
                      key={key}
                      className="flex items-center p-3 border border-gray-200 rounded-lg hover:border-gray-300 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedPlatforms.includes(key)}
                        onChange={() => togglePlatform(key)}
                        className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                      />
                      <span className="ml-2 text-sm font-medium text-gray-700">{config.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                <textarea
                  {...publishForm.register('content.text')}
                  rows={6}
                  placeholder="What's on your mind?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
                <div className="mt-1 text-xs text-gray-500 flex justify-between">
                  <span>Character count for selected platforms</span>
                  <div className="space-x-2">
                    {selectedPlatforms.map(platform => (
                      <span key={platform}>
                        {platformConfig[platform as keyof typeof platformConfig].name}:{' '}
                        {getCharacterCount(publishForm.watch('content.text') || '', platform)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Hashtags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hashtags</label>
                <div className="flex flex-wrap gap-1 mb-2">
                  {suggestedHashtags.map((tag, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        const current = publishForm.getValues('hashtags') || [];
                        if (!current.includes(tag)) {
                          publishForm.setValue('hashtags', [...current, tag]);
                        }
                      }}
                      className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1">
                  {(publishForm.watch('hashtags') || []).map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => {
                          const current = publishForm.getValues('hashtags') || [];
                          publishForm.setValue(
                            'hashtags',
                            current.filter((_, i) => i !== index)
                          );
                        }}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        <XCircleIcon className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Media Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Media (Optional)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <PhotoIcon className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">
                    Drag and drop images or videos, or click to browse
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Supports JPG, PNG, MP4, MOV</p>
                </div>
              </div>

              {/* Scheduling */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Scheduling</label>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      {...publishForm.register('scheduling.publishNow')}
                      type="radio"
                      value="true"
                      className="text-pink-600 focus:ring-pink-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Publish Now</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="false"
                      onChange={() => publishForm.setValue('scheduling.publishNow', false)}
                      className="text-pink-600 focus:ring-pink-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Schedule for Later</span>
                  </label>

                  {!publishForm.watch('scheduling.publishNow') && (
                    <Controller
                      name="scheduling.scheduledTime"
                      control={publishForm.control}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="datetime-local"
                          value={
                            field.value
                              ? new Date(
                                  field.value.getTime() - field.value.getTimezoneOffset() * 60000
                                )
                                  .toISOString()
                                  .slice(0, 16)
                              : ''
                          }
                          onChange={e =>
                            field.onChange(e.target.value ? new Date(e.target.value) : undefined)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                        />
                      )}
                    />
                  )}
                </div>
              </div>

              {/* Publish Button */}
              <button
                type="submit"
                disabled={publishPost.isLoading || selectedPlatforms.length === 0}
                className="w-full bg-pink-600 text-white py-2 px-4 rounded-md hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {publishPost.isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Publishing...
                  </>
                ) : (
                  <>
                    <GlobeAltIcon className="h-4 w-4" />
                    {publishForm.watch('scheduling.publishNow') ? 'Publish Now' : 'Schedule Post'}
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Publish Results & Optimal Times */}
          <div className="space-y-6">
            {/* Publish Results */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Publish Results</h3>

              {publishResult ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircleIcon className="h-5 w-5" />
                    <span className="font-medium">Post published successfully!</span>
                  </div>

                  <div className="space-y-2">
                    {publishResult.platforms.map((platform: string) => (
                      <div
                        key={platform}
                        className="flex items-center justify-between p-3 bg-green-50 rounded-lg"
                      >
                        <span className="font-medium text-green-700">
                          {platformConfig[platform as keyof typeof platformConfig].name}
                        </span>
                        <CheckCircleIcon className="h-4 w-4 text-green-600" />
                      </div>
                    ))}
                  </div>

                  {publishResult.scheduledFor && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2 text-blue-700">
                        <CalendarIcon className="h-4 w-4" />
                        <span className="text-sm">
                          Scheduled for: {new Date(publishResult.scheduledFor).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <GlobeAltIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Publish results will appear here</p>
                </div>
              )}
            </div>

            {/* Optimal Posting Times */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Optimal Posting Times</h3>

              <div className="space-y-3">
                {Object.entries(optimalTimes).map(([platform, times]) => (
                  <div
                    key={platform}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <ClockIcon className="h-4 w-4 text-gray-600" />
                      <span className="font-medium text-gray-900">
                        {platformConfig[platform as keyof typeof platformConfig].name}
                      </span>
                    </div>
                    <span className="text-sm text-gray-600">{times}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  💡 These times are based on general audience engagement patterns. Check your
                  analytics for personalized optimal times.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Calendar Section */}
      {activeSection === 'schedule' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Content Calendar</h3>

          <div className="text-center py-12 text-gray-500">
            <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">Content Calendar Coming Soon</h4>
            <p className="text-gray-600 mb-4">
              Plan and schedule your social media content across all platforms
            </p>
            <div className="space-y-2 text-sm text-left max-w-md mx-auto">
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="h-4 w-4 text-green-600" />
                <span>Visual calendar interface</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="h-4 w-4 text-green-600" />
                <span>Bulk scheduling</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="h-4 w-4 text-green-600" />
                <span>Content themes and templates</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="h-4 w-4 text-green-600" />
                <span>Team collaboration</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Section */}
      {activeSection === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Performance Metrics */}
          <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Social Media Performance (Last 30 Days)
            </h3>

            {analyticsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
              </div>
            ) : analytics ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-700">
                      {analytics.summary.totalReach.toLocaleString()}
                    </div>
                    <div className="text-sm text-blue-600">Total Reach</div>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-700">
                      {analytics.summary.totalEngagement.toLocaleString()}
                    </div>
                    <div className="text-sm text-green-600">Engagement</div>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-700">
                      {analytics.summary.avgEngagementRate.toFixed(1)}%
                    </div>
                    <div className="text-sm text-purple-600">Engagement Rate</div>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-700">
                      {analytics.summary.totalPosts}
                    </div>
                    <div className="text-sm text-orange-600">Posts Published</div>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <h4 className="font-medium text-gray-900 mb-3">Platform Breakdown</h4>
                  <div className="space-y-3">
                    {Object.entries(analytics.platforms).map(
                      ([platform, metrics]: [string, any]) => (
                        <div
                          key={platform}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-medium text-gray-900">
                              {platformConfig[platform as keyof typeof platformConfig]?.name ||
                                platform}
                            </span>
                            <span className="text-sm text-gray-600">{metrics.posts} posts</span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900">
                              {metrics.reach.toLocaleString()} reach
                            </div>
                            <div className="text-xs text-gray-600">
                              {metrics.engagementRate.toFixed(1)}% engagement
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <ChartBarIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No analytics data available</p>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>

            <div className="space-y-3">
              <button
                onClick={() => setActiveSection('generate')}
                className="w-full p-3 text-left border border-gray-200 rounded-lg hover:border-pink-300 hover:bg-pink-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <SparklesIcon className="h-5 w-5 text-pink-600" />
                  <div>
                    <div className="font-medium text-gray-900">Generate Content</div>
                    <div className="text-sm text-gray-600">AI-powered content creation</div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setActiveSection('publish')}
                className="w-full p-3 text-left border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <GlobeAltIcon className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="font-medium text-gray-900">Publish Post</div>
                    <div className="text-sm text-gray-600">Share across platforms</div>
                  </div>
                </div>
              </button>

              <div className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex items-center gap-3">
                  <CalendarIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <div className="font-medium text-gray-700">Content Calendar</div>
                    <div className="text-sm text-gray-500">Coming soon</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
