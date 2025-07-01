'use client';

import { useState } from 'react';
import {
  PencilIcon,
  SparklesIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';
import { useContentGenerator, ContentGenerationParams } from '../../lib/hooks/useContentGenerator';

const contentTypes = [
  { value: 'blog', label: 'Blog Post', icon: DocumentTextIcon },
  { value: 'social_post', label: 'Social Post', icon: ChatBubbleLeftRightIcon },
  { value: 'email', label: 'Email', icon: EnvelopeIcon },
  { value: 'caption', label: 'Caption', icon: PencilIcon },
  { value: 'copy', label: 'Marketing Copy', icon: SparklesIcon },
];

const tones = [
  { value: 'professional', label: 'Professional' },
  { value: 'casual', label: 'Casual' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'authoritative', label: 'Authoritative' },
  { value: 'playful', label: 'Playful' },
];

const platforms = [
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'twitter', label: 'Twitter' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'email', label: 'Email' },
];

export default function ContentEditor(): JSX.Element {
  const [formData, setFormData] = useState<ContentGenerationParams>({
    type: 'blog',
    topic: '',
    audience: '',
    tone: 'professional',
    keywords: [],
    platform: undefined,
  });
  const [keywordInput, setKeywordInput] = useState('');
  const [editedContent, setEditedContent] = useState('');

  const { generateContent, clearContent, editContent, isGenerating, generatedContent, error } =
    useContentGenerator();

  const handleInputChange = (
    field: keyof ContentGenerationParams,
    value: string | string[]
  ): void => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddKeyword = (): void => {
    if (keywordInput.trim() && !formData.keywords?.includes(keywordInput.trim())) {
      handleInputChange('keywords', [...(formData.keywords || []), keywordInput.trim()]);
      setKeywordInput('');
    }
  };

  const handleRemoveKeyword = (keyword: string): void => {
    handleInputChange('keywords', formData.keywords?.filter(k => k !== keyword) || []);
  };

  const handleGenerate = async (): Promise<void> => {
    if (!formData.topic || !formData.audience) {
      return;
    }
    await generateContent(formData);
  };

  const handleContentEdit = (newContent: string): void => {
    setEditedContent(newContent);
    editContent(newContent);
  };

  const isFormValid = formData.topic.length > 0 && formData.audience.length > 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      {/* Input Form */}
      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Content Generation</h3>

          {/* Content Type */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Content Type</label>
            <div className="grid grid-cols-2 gap-2">
              {contentTypes.map(type => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.value}
                    onClick={() => handleInputChange('type', type.value)}
                    className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                      formData.type === type.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4 mx-auto mb-1" />
                    {type.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Topic */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Topic *</label>
            <input
              type="text"
              value={formData.topic}
              onChange={e => handleInputChange('topic', e.target.value)}
              placeholder="e.g., 'Benefits of AI in Marketing'"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Audience */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Audience *
            </label>
            <input
              type="text"
              value={formData.audience}
              onChange={e => handleInputChange('audience', e.target.value)}
              placeholder="e.g., 'Marketing professionals, small business owners'"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Tone */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Tone</label>
            <select
              value={formData.tone}
              onChange={e => handleInputChange('tone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {tones.map(tone => (
                <option key={tone.value} value={tone.value}>
                  {tone.label}
                </option>
              ))}
            </select>
          </div>

          {/* Platform (for social posts) */}
          {(formData.type === 'social_post' || formData.type === 'caption') && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Platform</label>
              <select
                value={formData.platform || ''}
                onChange={e => handleInputChange('platform', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select platform</option>
                {platforms.map(platform => (
                  <option key={platform.value} value={platform.value}>
                    {platform.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Keywords */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Keywords (Optional)
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={keywordInput}
                onChange={e => setKeywordInput(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleAddKeyword()}
                placeholder="Add a keyword"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleAddKeyword}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.keywords?.map((keyword, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                >
                  {keyword}
                  <button
                    onClick={() => handleRemoveKeyword(keyword)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={!isFormValid || isGenerating}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-md font-medium transition-colors ${
              isFormValid && !isGenerating
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <SparklesIcon className="h-5 w-5" />
            {isGenerating ? 'Generating...' : 'Generate Content'}
          </button>
        </div>
      </div>

      {/* Preview Panel */}
      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6 h-full">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Content Preview</h3>
            {generatedContent && (
              <button onClick={clearContent} className="text-sm text-gray-500 hover:text-gray-700">
                Clear
              </button>
            )}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {isGenerating && (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}

          {generatedContent && !isGenerating && (
            <div className="space-y-4">
              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-md">
                {generatedContent.suggestedTitle && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">Title:</span>
                    <p className="text-sm text-gray-900">{generatedContent.suggestedTitle}</p>
                  </div>
                )}
                {generatedContent.readingTime && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">Reading Time:</span>
                    <p className="text-sm text-gray-900">{generatedContent.readingTime} min</p>
                  </div>
                )}
                {generatedContent.seoScore && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">SEO Score:</span>
                    <p className="text-sm text-gray-900">{generatedContent.seoScore}/100</p>
                  </div>
                )}
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                <textarea
                  value={editedContent || generatedContent.content}
                  onChange={e => handleContentEdit(e.target.value)}
                  rows={12}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Hashtags */}
              {generatedContent.hashtags && generatedContent.hashtags.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hashtags</label>
                  <div className="flex flex-wrap gap-2">
                    {generatedContent.hashtags.map((hashtag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded"
                      >
                        #{hashtag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {!generatedContent && !isGenerating && !error && (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <div className="text-center">
                <DocumentTextIcon className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>Generate content to see preview</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
