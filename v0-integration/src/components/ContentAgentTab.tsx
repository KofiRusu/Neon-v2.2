import { useState } from 'react';
import { api } from '../utils/trpc';
import {
  DocumentTextIcon,
  SparklesIcon,
  ArrowDownTrayIcon,
  ClipboardDocumentIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

interface Post {
  id: string;
  platform: string;
  content: string;
  hashtags: string[];
  imageSuggestions: string[];
  engagementScore: number;
  estimatedReach: number;
}

export default function ContentAgentTab() {
  const [platform, setPlatform] = useState<
    'instagram' | 'facebook' | 'tiktok' | 'twitter' | 'linkedin'
  >('instagram');
  const [topic, setTopic] = useState('custom neon signs');
  const [tone, setTone] = useState<'professional' | 'casual' | 'funny' | 'inspiring' | 'urgent'>(
    'professional'
  );
  const [generatedPosts, setGeneratedPosts] = useState<Post[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const generatePosts = api.content.generatePosts.useMutation({
    onSuccess: data => {
      setGeneratedPosts(data.posts);
    },
  });

  const agentStatus = api.content.getAgentStatus.useQuery();

  const handleGenerate = () => {
    generatePosts.mutate({
      platform,
      topic,
      tone,
      includeHashtags: true,
    });
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Agent Status Header */}
      <div className="card-glow">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <DocumentTextIcon className="h-8 w-8 text-blue-400" />
            <div>
              <h2 className="text-xl font-semibold text-white">Content Agent</h2>
              <p className="text-dark-400 text-sm">AI-powered content generation</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="status-indicator active"></div>
            <span className="text-green-400 text-sm">{agentStatus.data?.status || 'Active'}</span>
          </div>
        </div>

        {agentStatus.data && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-dark-400 text-xs">Uptime</p>
              <p className="text-white font-semibold">{agentStatus.data.uptime}</p>
            </div>
            <div className="text-center">
              <p className="text-dark-400 text-xs">Success Rate</p>
              <p className="text-white font-semibold">{agentStatus.data.successRate}</p>
            </div>
            <div className="text-center">
              <p className="text-dark-400 text-xs">Total Executions</p>
              <p className="text-white font-semibold">{agentStatus.data.totalExecutions}</p>
            </div>
            <div className="text-center">
              <p className="text-dark-400 text-xs">Avg Response</p>
              <p className="text-white font-semibold">{agentStatus.data.avgResponseTime}</p>
            </div>
          </div>
        )}
      </div>

      {/* Content Generation Form */}
      <div className="card-glow">
        <h3 className="text-lg font-semibold text-white mb-4">Generate Social Media Posts</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Platform Selection */}
          <div>
            <label className="block text-dark-300 text-sm font-medium mb-2">Platform</label>
            <select
              value={platform}
              onChange={e => setPlatform(e.target.value as any)}
              className="input w-full"
            >
              <option value="instagram">Instagram</option>
              <option value="facebook">Facebook</option>
              <option value="tiktok">TikTok</option>
              <option value="twitter">Twitter</option>
              <option value="linkedin">LinkedIn</option>
            </select>
          </div>

          {/* Topic Input */}
          <div>
            <label className="block text-dark-300 text-sm font-medium mb-2">Topic</label>
            <input
              type="text"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="e.g., custom neon signs"
              className="input w-full"
            />
          </div>

          {/* Tone Selection */}
          <div>
            <label className="block text-dark-300 text-sm font-medium mb-2">Tone</label>
            <select
              value={tone}
              onChange={e => setTone(e.target.value as any)}
              className="input w-full"
            >
              <option value="professional">Professional</option>
              <option value="casual">Casual</option>
              <option value="funny">Funny</option>
              <option value="inspiring">Inspiring</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={generatePosts.isLoading}
          className="btn-primary flex items-center space-x-2"
        >
          {generatePosts.isLoading ? (
            <>
              <SparklesIcon className="h-5 w-5 animate-spin" />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <SparklesIcon className="h-5 w-5" />
              <span>Generate Content</span>
            </>
          )}
        </button>
      </div>

      {/* Generated Posts */}
      {generatedPosts.length > 0 && (
        <div className="card-glow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Generated Posts</h3>
            <div className="text-dark-400 text-sm">{generatedPosts.length} posts generated</div>
          </div>

          <div className="space-y-4">
            {generatedPosts.map(post => (
              <div key={post.id} className="agent-card">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-1 bg-neon-400/20 text-neon-400 text-xs rounded-full capitalize">
                      {post.platform}
                    </span>
                    <span className="text-dark-400 text-xs">Score: {post.engagementScore}/100</span>
                    <span className="text-dark-400 text-xs">
                      Est. Reach: {post.estimatedReach.toLocaleString()}
                    </span>
                  </div>
                  <button
                    onClick={() =>
                      copyToClipboard(`${post.content}\n\n${post.hashtags.join(' ')}`, post.id)
                    }
                    className="btn-pill flex items-center space-x-1"
                  >
                    {copiedId === post.id ? (
                      <CheckCircleIcon className="h-4 w-4 text-green-400" />
                    ) : (
                      <ClipboardDocumentIcon className="h-4 w-4" />
                    )}
                    <span className="text-xs">{copiedId === post.id ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>

                <div className="mb-3">
                  <p className="text-white leading-relaxed">{post.content}</p>
                </div>

                {post.hashtags.length > 0 && (
                  <div className="mb-3">
                    <p className="text-neon-400 text-sm">{post.hashtags.join(' ')}</p>
                  </div>
                )}

                {post.imageSuggestions.length > 0 && (
                  <div>
                    <p className="text-dark-400 text-xs mb-1">Image suggestions:</p>
                    <div className="flex flex-wrap gap-1">
                      {post.imageSuggestions.map((suggestion, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-dark-700 text-dark-300 text-xs rounded"
                        >
                          {suggestion}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Display */}
      {generatePosts.error && (
        <div className="card-glow border border-red-500/50">
          <div className="flex items-center space-x-2 text-red-400">
            <span className="text-sm">Error: {generatePosts.error.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
