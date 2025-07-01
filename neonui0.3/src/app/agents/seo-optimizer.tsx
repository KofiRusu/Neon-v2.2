'use client';

import { useState } from 'react';
import {
  MagnifyingGlassIcon,
  ChartBarIcon,
  TagIcon,
  LightBulbIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { useSEOOptimizer, SEOOptimizationParams } from '../../lib/hooks/useSEOOptimizer';

const contentTypes = [
  { value: 'blog', label: 'Blog Post' },
  { value: 'page', label: 'Web Page' },
  { value: 'product', label: 'Product Page' },
  { value: 'article', label: 'Article' },
];

const priorityColors = {
  low: 'text-green-600 bg-green-50',
  medium: 'text-yellow-600 bg-yellow-50',
  high: 'text-red-600 bg-red-50',
};

const suggestionIcons = {
  title: TagIcon,
  meta: MagnifyingGlassIcon,
  content: ChartBarIcon,
  keywords: LightBulbIcon,
  structure: CheckCircleIcon,
  url: ExclamationTriangleIcon,
};

export default function SEOOptimizer(): JSX.Element {
  const [formData, setFormData] = useState<SEOOptimizationParams>({
    content: '',
    targetKeywords: [],
    contentType: 'blog',
    focusKeyword: '',
    title: '',
    description: '',
    url: '',
  });
  const [keywordInput, setKeywordInput] = useState('');

  const {
    optimizeContent,
    generateMetaTags,
    clearResults,
    isOptimizing,
    optimizationResult,
    error,
  } = useSEOOptimizer();

  const handleInputChange = (
    field: keyof SEOOptimizationParams,
    value: string | string[]
  ): void => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddKeyword = (): void => {
    if (keywordInput.trim() && !formData.targetKeywords.includes(keywordInput.trim())) {
      handleInputChange('targetKeywords', [...formData.targetKeywords, keywordInput.trim()]);
      setKeywordInput('');
    }
  };

  const handleRemoveKeyword = (keyword: string): void => {
    handleInputChange(
      'targetKeywords',
      formData.targetKeywords.filter(k => k !== keyword)
    );
  };

  const handleOptimize = async (): Promise<void> => {
    if (!formData.content || formData.targetKeywords.length === 0) {
      return;
    }
    await optimizeContent(formData);
  };

  const handleGenerateMetaTags = async (): Promise<void> => {
    if (!formData.content || formData.targetKeywords.length === 0) {
      return;
    }
    await generateMetaTags(formData);
  };

  const isFormValid = formData.content.length > 0 && formData.targetKeywords.length > 0;

  const getSEOScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSEOScoreLabel = (score: number): string => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Needs Improvement';
    return 'Poor';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      {/* Input Form */}
      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">SEO Optimization</h3>

          {/* Content Type */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Content Type</label>
            <select
              value={formData.contentType}
              onChange={e => handleInputChange('contentType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {contentTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Content */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Content *</label>
            <textarea
              value={formData.content}
              onChange={e => handleInputChange('content', e.target.value)}
              placeholder="Paste your content here for SEO analysis..."
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Target Keywords */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Keywords *
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={keywordInput}
                onChange={e => setKeywordInput(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleAddKeyword()}
                placeholder="Add a target keyword"
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
              {formData.targetKeywords.map((keyword, index) => (
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

          {/* Focus Keyword */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Focus Keyword</label>
            <input
              type="text"
              value={formData.focusKeyword}
              onChange={e => handleInputChange('focusKeyword', e.target.value)}
              placeholder="Primary keyword to focus on"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Meta Information */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Title Tag</label>
              <input
                type="text"
                value={formData.title}
                onChange={e => handleInputChange('title', e.target.value)}
                placeholder="Page title (optional)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meta Description
              </label>
              <textarea
                value={formData.description}
                onChange={e => handleInputChange('description', e.target.value)}
                placeholder="Meta description (optional)"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">URL Slug</label>
              <input
                type="text"
                value={formData.url}
                onChange={e => handleInputChange('url', e.target.value)}
                placeholder="URL slug (optional)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleOptimize}
              disabled={!isFormValid || isOptimizing}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-md font-medium transition-colors ${
                isFormValid && !isOptimizing
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <MagnifyingGlassIcon className="h-5 w-5" />
              {isOptimizing ? 'Optimizing...' : 'Optimize Content'}
            </button>

            <button
              onClick={handleGenerateMetaTags}
              disabled={!isFormValid || isOptimizing}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-md font-medium transition-colors ${
                isFormValid && !isOptimizing
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <TagIcon className="h-5 w-5" />
              Generate Meta Tags
            </button>
          </div>
        </div>
      </div>

      {/* Results Panel */}
      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6 h-full">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">SEO Analysis</h3>
            {optimizationResult && (
              <button onClick={clearResults} className="text-sm text-gray-500 hover:text-gray-700">
                Clear
              </button>
            )}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {isOptimizing && (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}

          {optimizationResult && !isOptimizing && (
            <div className="space-y-6">
              {/* SEO Score */}
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div
                  className={`text-3xl font-bold ${getSEOScoreColor(optimizationResult.seoScore)}`}
                >
                  {optimizationResult.seoScore}/100
                </div>
                <div
                  className={`text-sm font-medium ${getSEOScoreColor(optimizationResult.seoScore)}`}
                >
                  {getSEOScoreLabel(optimizationResult.seoScore)}
                </div>
              </div>

              {/* Meta Tags */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Optimized Meta Tags</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Title</label>
                    <div className="p-2 bg-gray-50 rounded text-sm">
                      {optimizationResult.meta.optimizedTitle}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Description
                    </label>
                    <div className="p-2 bg-gray-50 rounded text-sm">
                      {optimizationResult.meta.optimizedDescription}
                    </div>
                  </div>
                  {optimizationResult.meta.suggestedUrl && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Suggested URL
                      </label>
                      <div className="p-2 bg-gray-50 rounded text-sm">
                        {optimizationResult.meta.suggestedUrl}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Keyword Analysis */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Keyword Analysis</h4>
                <div className="space-y-2">
                  {optimizationResult.keywords.map((keyword, index) => (
                    <div key={index} className="p-3 border border-gray-200 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-gray-900">{keyword.keyword}</span>
                        <span className="text-sm text-gray-500">
                          {keyword.density.toFixed(1)}% density
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        Frequency: {keyword.frequency} | Prominence: {keyword.prominence.toFixed(1)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Suggestions */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">SEO Suggestions</h4>
                <div className="space-y-2">
                  {optimizationResult.suggestions.map((suggestion, index) => {
                    const Icon = suggestionIcons[suggestion.type] || LightBulbIcon;
                    return (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border-l-4 ${
                          suggestion.priority === 'high'
                            ? 'border-red-400 bg-red-50'
                            : suggestion.priority === 'medium'
                              ? 'border-yellow-400 bg-yellow-50'
                              : 'border-green-400 bg-green-50'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <Icon className="h-4 w-4 mt-1 text-gray-600" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium capitalize">
                                {suggestion.type}
                              </span>
                              <span
                                className={`text-xs px-2 py-1 rounded-full ${priorityColors[suggestion.priority]}`}
                              >
                                {suggestion.priority}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700">{suggestion.message}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Optimized Content */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Optimized Content</h4>
                <textarea
                  value={optimizationResult.optimizedContent}
                  readOnly
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
                />
              </div>
            </div>
          )}

          {!optimizationResult && !isOptimizing && !error && (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <div className="text-center">
                <ChartBarIcon className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>Optimize content to see SEO analysis</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
