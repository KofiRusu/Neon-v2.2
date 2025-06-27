'use client';

import { useState } from 'react';

// Simple Content Voice Analyzer component
interface ContentVoiceAnalyzerProps {
  profiles: Array<{
    id: string;
    name: string;
    isActive: boolean;
  }>;
}

export function ContentVoiceAnalyzer({ profiles }: ContentVoiceAnalyzerProps) {
  const [content, setContent] = useState('');
  const [selectedProfile, setSelectedProfile] = useState('');
  const [analysis, setAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeContent = async () => {
    if (!content.trim()) return;

    setIsAnalyzing(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock analysis result
      setAnalysis({
        voiceScore: Math.floor(Math.random() * 30) + 70, // 70-100
        suggestions: [
          {
            type: 'tone',
            issue: 'Content could be more professional',
            suggestion: 'Use more business-oriented language',
            priority: 'medium',
          },
        ],
      });
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Content Voice Analyzer</h3>
        <p className="text-gray-600 mb-6">
          Analyze your content against brand voice profiles in real-time
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Select Brand Voice Profile</label>
            <select
              value={selectedProfile}
              onChange={e => setSelectedProfile(e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              <option value="">Choose a profile...</option>
              {profiles.map(profile => (
                <option key={profile.id} value={profile.id}>
                  {profile.name} {profile.isActive ? '(Active)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Content to Analyze</label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Paste your content here for voice analysis..."
              className="w-full h-64 p-3 border rounded-md"
            />
          </div>

          <button
            onClick={analyzeContent}
            disabled={!content.trim() || !selectedProfile || isAnalyzing}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md disabled:opacity-50"
          >
            {isAnalyzing ? 'Analyzing...' : 'Analyze Brand Voice'}
          </button>
        </div>

        {/* Results Section */}
        <div className="space-y-4">
          <h4 className="text-md font-semibold">Analysis Results</h4>

          {analysis ? (
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Voice Consistency Score</span>
                  <span
                    className={`text-lg font-bold ${
                      analysis.voiceScore >= 80
                        ? 'text-green-600'
                        : analysis.voiceScore >= 60
                          ? 'text-yellow-600'
                          : 'text-red-600'
                    }`}
                  >
                    {analysis.voiceScore}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      analysis.voiceScore >= 80
                        ? 'bg-green-600'
                        : analysis.voiceScore >= 60
                          ? 'bg-yellow-600'
                          : 'bg-red-600'
                    }`}
                    style={{ width: `${analysis.voiceScore}%` }}
                  ></div>
                </div>
              </div>

              {analysis.suggestions && analysis.suggestions.length > 0 && (
                <div className="p-4 border rounded-lg">
                  <h5 className="font-medium mb-3">Suggestions for Improvement</h5>
                  <div className="space-y-2">
                    {analysis.suggestions.map((suggestion: any, index: number) => (
                      <div key={index} className="p-3 bg-amber-50 rounded-md">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-medium text-sm capitalize">{suggestion.type}</span>
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              suggestion.priority === 'high'
                                ? 'bg-red-100 text-red-700'
                                : suggestion.priority === 'medium'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-green-100 text-green-700'
                            }`}
                          >
                            {suggestion.priority}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mb-1">{suggestion.issue}</p>
                        <p className="text-sm text-blue-700 font-medium">{suggestion.suggestion}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>Select a profile and enter content to see analysis results</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
