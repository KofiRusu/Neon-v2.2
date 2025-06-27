import { useState } from 'react';
import { api } from '../utils/trpc';
import {
  MagnifyingGlassIcon,
  SparklesIcon,
  ChartBarIcon,
  DocumentTextIcon,
  ClipboardDocumentIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';

export default function SEOAgentTab() {
  const [activeTab, setActiveTab] = useState<'analyze' | 'generate' | 'keywords' | 'performance'>(
    'analyze'
  );
  const [analysisContent, setAnalysisContent] = useState('');
  const [targetKeywords, setTargetKeywords] = useState<string[]>(['neon signs']);
  const [newKeyword, setNewKeyword] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // SEO Analysis
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const analyzeContent = api.seo.analyzeContent.useMutation({
    onSuccess: data => {
      setAnalysisResult(data);
    },
  });

  // Content Generation
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const [generateTopic, setGenerateTopic] = useState('Custom Neon Signs');
  const [contentType, setContentType] = useState<
    'blog_post' | 'product_description' | 'landing_page' | 'meta_description'
  >('blog_post');
  const generateSeoContent = api.seo.generateSeoContent.useMutation({
    onSuccess: data => {
      setGeneratedContent(data);
    },
  });

  // Keyword Research
  const [keywordResults, setKeywordResults] = useState<any>(null);
  const [seedKeyword, setSeedKeyword] = useState('neon signs');
  const getKeywordResearch = api.seo.getKeywordResearch.useQuery(
    { seedKeyword },
    { enabled: false }
  );

  // Performance Metrics
  const performanceMetrics = api.seo.getPerformanceMetrics.useQuery(
    { timeRange: '30d' },
    { enabled: activeTab === 'performance' }
  );

  const handleAnalyze = () => {
    if (!analysisContent.trim()) return;
    analyzeContent.mutate({
      content: analysisContent,
      targetKeywords: targetKeywords.length > 0 ? targetKeywords : undefined,
    });
  };

  const handleGenerate = () => {
    if (!generateTopic.trim() || targetKeywords.length === 0) return;
    generateSeoContent.mutate({
      topic: generateTopic,
      targetKeywords,
      contentType,
    });
  };

  const handleKeywordResearch = () => {
    if (!seedKeyword.trim()) return;
    getKeywordResearch.refetch();
  };

  const addKeyword = () => {
    if (newKeyword.trim() && !targetKeywords.includes(newKeyword.trim())) {
      setTargetKeywords([...targetKeywords, newKeyword.trim()]);
      setNewKeyword('');
    }
  };

  const removeKeyword = (keyword: string) => {
    setTargetKeywords(targetKeywords.filter(k => k !== keyword));
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'text-red-400';
      case 'medium':
        return 'text-yellow-400';
      case 'low':
        return 'text-green-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* SEO Agent Header */}
      <div className="card-glow">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <MagnifyingGlassIcon className="h-8 w-8 text-purple-400" />
            <div>
              <h2 className="text-xl font-semibold text-white">SEO Agent</h2>
              <p className="text-dark-400 text-sm">AI-powered SEO optimization</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="status-indicator active"></div>
            <span className="text-green-400 text-sm">Active</span>
          </div>
        </div>
      </div>

      {/* Keywords Management */}
      <div className="card-glow">
        <h3 className="text-lg font-semibold text-white mb-4">Target Keywords</h3>

        <div className="flex flex-wrap gap-2 mb-4">
          {targetKeywords.map(keyword => (
            <span
              key={keyword}
              className="flex items-center space-x-2 px-3 py-1 bg-neon-400/20 text-neon-400 rounded-full text-sm"
            >
              <span>{keyword}</span>
              <button
                onClick={() => removeKeyword(keyword)}
                className="text-neon-400 hover:text-red-400"
              >
                ×
              </button>
            </span>
          ))}
        </div>

        <div className="flex space-x-2">
          <input
            type="text"
            value={newKeyword}
            onChange={e => setNewKeyword(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && addKeyword()}
            placeholder="Add keyword..."
            className="input flex-1"
          />
          <button onClick={addKeyword} className="btn-secondary">
            Add
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="card-glow">
        <div className="flex space-x-1 mb-6">
          {[
            { id: 'analyze', label: 'Content Analysis', icon: DocumentTextIcon },
            { id: 'generate', label: 'Content Generation', icon: SparklesIcon },
            { id: 'keywords', label: 'Keyword Research', icon: MagnifyingGlassIcon },
            { id: 'performance', label: 'Performance', icon: ChartBarIcon },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === id
                  ? 'bg-neon-400/20 text-neon-400'
                  : 'text-dark-400 hover:text-white hover:bg-dark-700'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Content Analysis Tab */}
        {activeTab === 'analyze' && (
          <div className="space-y-4">
            <div>
              <label className="block text-dark-300 text-sm font-medium mb-2">
                Content to Analyze
              </label>
              <textarea
                value={analysisContent}
                onChange={e => setAnalysisContent(e.target.value)}
                placeholder="Paste your content here for SEO analysis..."
                className="input w-full h-32 resize-none"
              />
            </div>

            <button
              onClick={handleAnalyze}
              disabled={analyzeContent.isLoading || !analysisContent.trim()}
              className="btn-primary flex items-center space-x-2"
            >
              {analyzeContent.isLoading ? (
                <>
                  <SparklesIcon className="h-5 w-5 animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <MagnifyingGlassIcon className="h-5 w-5" />
                  <span>Analyze Content</span>
                </>
              )}
            </button>

            {analysisResult && (
              <div className="mt-6 space-y-4">
                {/* SEO Scores */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-dark-400 text-xs">SEO Score</p>
                    <p className="text-2xl font-bold text-neon-400">
                      {analysisResult.analysis.seoScore}/100
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-dark-400 text-xs">Readability</p>
                    <p className="text-2xl font-bold text-blue-400">
                      {analysisResult.analysis.readabilityScore}/100
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-dark-400 text-xs">Word Count</p>
                    <p className="text-2xl font-bold text-white">
                      {analysisResult.analysis.wordCount}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-dark-400 text-xs">Keywords</p>
                    <p className="text-2xl font-bold text-purple-400">
                      {analysisResult.analysis.keywordDensity.length}
                    </p>
                  </div>
                </div>

                {/* Suggestions */}
                <div className="space-y-3">
                  <h4 className="text-white font-medium">Optimization Suggestions</h4>
                  {analysisResult.analysis.suggestions.map((suggestion: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-start space-x-3 p-3 bg-dark-800/50 rounded-lg"
                    >
                      <div
                        className={`w-2 h-2 rounded-full mt-2 ${getSeverityColor(suggestion.severity)}`}
                      ></div>
                      <div className="flex-1">
                        <p className="text-white text-sm">{suggestion.suggestion}</p>
                        <p className="text-dark-400 text-xs mt-1">{suggestion.impact}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Recommendations */}
                <div className="space-y-2">
                  <h4 className="text-white font-medium">Recommendations</h4>
                  <ul className="space-y-1">
                    {analysisResult.recommendations.map((rec: string, index: number) => (
                      <li key={index} className="text-dark-300 text-sm flex items-center space-x-2">
                        <span className="w-1 h-1 bg-neon-400 rounded-full"></span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Content Generation Tab */}
        {activeTab === 'generate' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-dark-300 text-sm font-medium mb-2">Topic</label>
                <input
                  type="text"
                  value={generateTopic}
                  onChange={e => setGenerateTopic(e.target.value)}
                  placeholder="e.g., Custom Neon Signs"
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block text-dark-300 text-sm font-medium mb-2">Content Type</label>
                <select
                  value={contentType}
                  onChange={e => setContentType(e.target.value as any)}
                  className="input w-full"
                >
                  <option value="blog_post">Blog Post</option>
                  <option value="product_description">Product Description</option>
                  <option value="landing_page">Landing Page</option>
                  <option value="meta_description">Meta Description</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={
                generateSeoContent.isLoading || !generateTopic.trim() || targetKeywords.length === 0
              }
              className="btn-primary flex items-center space-x-2"
            >
              {generateSeoContent.isLoading ? (
                <>
                  <SparklesIcon className="h-5 w-5 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <DocumentTextIcon className="h-5 w-5" />
                  <span>Generate SEO Content</span>
                </>
              )}
            </button>

            {generatedContent && (
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-white font-medium">Generated Content</h4>
                  <button
                    onClick={() => copyToClipboard(generatedContent.content, 'generated-content')}
                    className="btn-pill flex items-center space-x-1"
                  >
                    {copiedId === 'generated-content' ? (
                      <CheckCircleIcon className="h-4 w-4 text-green-400" />
                    ) : (
                      <ClipboardDocumentIcon className="h-4 w-4" />
                    )}
                    <span className="text-xs">
                      {copiedId === 'generated-content' ? 'Copied!' : 'Copy'}
                    </span>
                  </button>
                </div>

                <div className="p-4 bg-dark-800/50 rounded-lg">
                  <pre className="text-dark-300 text-sm whitespace-pre-wrap">
                    {generatedContent.content}
                  </pre>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-dark-400 text-xs">Word Count</p>
                    <p className="text-white font-semibold">
                      {generatedContent.seoMetrics.wordCount}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-dark-400 text-xs">SEO Score</p>
                    <p className="text-green-400 font-semibold">
                      {generatedContent.seoMetrics.seoScore}/100
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-dark-400 text-xs">Readability</p>
                    <p className="text-blue-400 font-semibold">
                      {generatedContent.seoMetrics.readabilityScore}/100
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Keyword Research Tab */}
        {activeTab === 'keywords' && (
          <div className="space-y-4">
            <div className="flex space-x-2">
              <input
                type="text"
                value={seedKeyword}
                onChange={e => setSeedKeyword(e.target.value)}
                placeholder="Enter seed keyword..."
                className="input flex-1"
              />
              <button
                onClick={handleKeywordResearch}
                disabled={getKeywordResearch.isFetching}
                className="btn-primary"
              >
                {getKeywordResearch.isFetching ? 'Researching...' : 'Research'}
              </button>
            </div>

            {getKeywordResearch.data && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-dark-400 text-xs">Total Keywords</p>
                    <p className="text-white font-semibold">
                      {getKeywordResearch.data.totalKeywords}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-dark-400 text-xs">Avg Volume</p>
                    <p className="text-blue-400 font-semibold">
                      {getKeywordResearch.data.avgSearchVolume.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-dark-400 text-xs">Avg Difficulty</p>
                    <p className="text-yellow-400 font-semibold">
                      {getKeywordResearch.data.avgDifficulty}/100
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-dark-400 text-xs">Opportunities</p>
                    <p className="text-green-400 font-semibold">
                      {getKeywordResearch.data.opportunities.length}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-white font-medium">Keyword Opportunities</h4>
                  {getKeywordResearch.data.keywords.map((keyword: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-dark-800/50 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="text-white text-sm font-medium">{keyword.keyword}</p>
                        <p className="text-dark-400 text-xs capitalize">{keyword.intent} intent</p>
                      </div>
                      <div className="flex items-center space-x-4 text-right">
                        <div>
                          <p className="text-white text-sm">
                            {keyword.searchVolume.toLocaleString()}
                          </p>
                          <p className="text-dark-400 text-xs">Volume</p>
                        </div>
                        <div>
                          <p className="text-yellow-400 text-sm">{keyword.difficulty}/100</p>
                          <p className="text-dark-400 text-xs">Difficulty</p>
                        </div>
                        <div>
                          <p className="text-green-400 text-sm">${keyword.cpc}</p>
                          <p className="text-dark-400 text-xs">CPC</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Performance Tab */}
        {activeTab === 'performance' && (
          <div className="space-y-4">
            {performanceMetrics.data && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-dark-400 text-xs">Organic Traffic</p>
                    <p className="text-2xl font-bold text-white">
                      {performanceMetrics.data.metrics.organicTraffic.current.toLocaleString()}
                    </p>
                    <p className="text-green-400 text-xs">
                      +{performanceMetrics.data.metrics.organicTraffic.change.toFixed(1)}%
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-dark-400 text-xs">Avg Position</p>
                    <p className="text-2xl font-bold text-blue-400">
                      {performanceMetrics.data.metrics.averagePosition.current}
                    </p>
                    <p className="text-green-400 text-xs">
                      +{performanceMetrics.data.metrics.averagePosition.change.toFixed(1)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-dark-400 text-xs">CTR</p>
                    <p className="text-2xl font-bold text-purple-400">
                      {performanceMetrics.data.metrics.clickThroughRate.current}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-dark-400 text-xs">Total Keywords</p>
                    <p className="text-white font-semibold">
                      {performanceMetrics.data.metrics.totalKeywords}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-dark-400 text-xs">Top 10</p>
                    <p className="text-green-400 font-semibold">
                      {performanceMetrics.data.metrics.keywordsTop10}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-dark-400 text-xs">Top 3</p>
                    <p className="text-neon-400 font-semibold">
                      {performanceMetrics.data.metrics.keywordsTop3}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Error Display */}
      {(analyzeContent.error || generateSeoContent.error || getKeywordResearch.error) && (
        <div className="card-glow border border-red-500/50">
          <div className="flex items-center space-x-2 text-red-400">
            <span className="text-sm">
              Error:{' '}
              {analyzeContent.error?.message ||
                generateSeoContent.error?.message ||
                getKeywordResearch.error?.message}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
