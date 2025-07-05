"use client";

import { useState, useEffect } from "react";
import { api } from "../../utils/trpc";
import EditableCard from "../../components/EditableCard";
import AnalyticsChart from "../../components/AnalyticsChart";
import {
  PaintBrushIcon,
  SparklesIcon,
  DocumentDuplicateIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  BoltIcon,
  ClipboardDocumentIcon,
  LightBulbIcon,
  ChartBarIcon,
  EyeIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

interface BrandVoiceProfile {
  id: string;
  name: string;
  description: string;
  guidelines: Record<string, any>;
  keywords: string[];
  toneProfile: Record<string, number>;
  isActive: boolean;
  averageScore: number;
  analysisCount: number;
  consistency: number;
}

interface VoiceAnalysis {
  success: boolean;
  voiceScore: number;
  suggestions: string[];
  analysis: {
    toneMatch: number;
    keywordUsage: number;
    styleConsistency: number;
    improvements: string[];
  };
}

export default function BrandVoicePage(): JSX.Element {
  const [activeTab, setActiveTab] = useState<
    "overview" | "analyzer" | "identity"
  >("overview");
  const [contentToAnalyze, setContentToAnalyze] = useState("");
  const [contentType, setContentType] = useState<
    "email" | "social" | "blog" | "ad" | "general"
  >("general");
  const [analysisResult, setAnalysisResult] = useState<VoiceAnalysis | null>(
    null,
  );
  const [copiedSuggestion, setCopiedSuggestion] = useState<number | null>(null);
  const [showAnalysisGlow, setShowAnalysisGlow] = useState(false);

  // tRPC queries and mutations
  const { data: profilesData } = api.brandVoice.getProfiles.useQuery({
    includeInactive: true,
    limit: 10,
  });

  const { data: guidelinesData } = api.brandVoice.getGuidelines.useQuery({});

  const analyzeContentMutation = api.brandVoice.analyzeContent.useMutation({
    onSuccess: (data) => {
      setAnalysisResult(data);
      setShowAnalysisGlow(true);
      setTimeout(() => setShowAnalysisGlow(false), 2000);
    },
    onError: (error) => {
      console.error("Analysis failed:", error);
    },
  });

  const getSuggestionsMutation = api.brandVoice.getSuggestions.useMutation();

  // Mock data for existing functionality
  const brandProfiles: BrandVoiceProfile[] = profilesData?.profiles?.map(
    (profile) => ({
      id: profile.id,
      name: profile.name,
      description: profile.description || "",
      guidelines: profile.guidelines || {},
      keywords: profile.keywords || [],
      toneProfile: profile.toneProfile || {},
      isActive: profile.isActive,
      averageScore: 92,
      analysisCount: profile._count?.analyses || 0,
      consistency: 94,
    }),
  ) || [
    {
      id: "1",
      name: "Primary Brand Voice",
      description: "Professional yet innovative AI marketing voice",
      guidelines: {
        tone: "Professional with innovative edge",
        vocabulary: "Technical but accessible",
        style: "Clear, confident, forward-thinking",
      },
      keywords: [
        "AI",
        "marketing",
        "automation",
        "innovative",
        "intelligent",
        "future",
      ],
      toneProfile: {
        professional: 85,
        friendly: 70,
        authoritative: 80,
        casual: 30,
        innovative: 95,
      },
      isActive: true,
      averageScore: 94,
      analysisCount: 1847,
      consistency: 96,
    },
  ];

  const consistencyData = [
    { date: "2024-01-15", value: 92 },
    { date: "2024-01-16", value: 94 },
    { date: "2024-01-17", value: 96 },
    { date: "2024-01-18", value: 93 },
    { date: "2024-01-19", value: 97 },
    { date: "2024-01-20", value: 95 },
    { date: "2024-01-21", value: 98 },
  ];

  // Handler functions
  const handleAnalyzeContent = async () => {
    if (!contentToAnalyze.trim()) return;

    await analyzeContentMutation.mutateAsync({
      content: contentToAnalyze,
      contentType,
      brandVoiceId: brandProfiles[0]?.id,
    });
  };

  const handleCopySuggestion = async (suggestion: string, index: number) => {
    try {
      await navigator.clipboard.writeText(suggestion);
      setCopiedSuggestion(index);
      setTimeout(() => setCopiedSuggestion(null), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const handleGetSuggestions = async (content: string) => {
    try {
      const result = await getSuggestionsMutation.mutateAsync({
        content,
        contentType,
      });
      return result.suggestions || [];
    } catch (error) {
      console.error("Failed to get suggestions:", error);
      return [];
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-neon-green";
    if (score >= 60) return "text-yellow-400";
    return "text-neon-pink";
  };

  const activeProfile =
    brandProfiles.find((p) => p.isActive) || brandProfiles[0];

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">
              <span className="text-neon-pink">Brand Voice</span>
              <span className="text-primary"> Manager</span>
            </h1>
            <p className="text-secondary text-lg">
              Maintain consistent brand messaging with AI-powered voice analysis
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button className="btn-neon">
              <SparklesIcon className="h-5 w-5 mr-2" />
              Analyze Content
            </button>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-neon-green rounded-xl flex items-center justify-center">
              <ChartBarIcon className="h-6 w-6 text-white" />
            </div>
            <div className="text-right">
              <div className="text-xs text-secondary">Voice Consistency</div>
              <div className="stat-number text-neon-green">96%</div>
              <div className="text-xs text-muted">+4.2% this month</div>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-neon-blue rounded-xl flex items-center justify-center">
              <BoltIcon className="h-6 w-6 text-white" />
            </div>
            <div className="text-right">
              <div className="text-xs text-secondary">Avg Voice Score</div>
              <div className="stat-number text-neon-blue">94</div>
              <div className="text-xs text-muted">All content types</div>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-neon-purple rounded-xl flex items-center justify-center">
              <ClipboardDocumentIcon className="h-6 w-6 text-white" />
            </div>
            <div className="text-right">
              <div className="text-xs text-secondary">Content Analyzed</div>
              <div className="stat-number text-neon-purple">2,081</div>
              <div className="text-xs text-muted">This month</div>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-neon-pink rounded-xl flex items-center justify-center">
              <PaintBrushIcon className="h-6 w-6 text-white" />
            </div>
            <div className="text-right">
              <div className="text-xs text-secondary">Active Profiles</div>
              <div className="stat-number text-neon-pink">
                {brandProfiles.length}
              </div>
              <div className="text-xs text-muted">Brand voices</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-1 mb-8 bg-gray-800/50 rounded-2xl p-2">
        {[
          { id: "overview", label: "Overview", icon: ChartBarIcon },
          { id: "analyzer", label: "Tone Checker", icon: SparklesIcon },
          { id: "identity", label: "Brand Identity", icon: PaintBrushIcon },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center space-x-3 py-4 px-6 rounded-xl transition-all duration-300 ${
                activeTab === tab.id
                  ? "bg-neon-blue text-white shadow-lg"
                  : "text-secondary hover:text-primary hover:bg-gray-700/50"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="space-y-8">
          {/* Voice Consistency Chart */}
          <AnalyticsChart
            data={consistencyData}
            title="Voice Consistency Trend"
            subtitle="Track brand voice alignment over time"
            color="neon-pink"
            showTrend={true}
          />

          {/* Profile Overview */}
          <div className="glass-strong p-6 rounded-2xl">
            <h2 className="text-2xl font-bold text-primary mb-6">
              Active Brand Voice Profile
            </h2>
            {activeProfile && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-primary mb-2">
                      {activeProfile.name}
                    </h3>
                    <p className="text-secondary">
                      {activeProfile.description}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-secondary">Average Score</span>
                      <span
                        className={`font-semibold ${getScoreColor(activeProfile.averageScore)}`}
                      >
                        {activeProfile.averageScore}%
                      </span>
                    </div>
                    <div className="progress-neon">
                      <div
                        className="progress-fill"
                        style={{ width: `${activeProfile.averageScore}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex justify-between text-sm text-secondary">
                    <span>{activeProfile.analysisCount} analyses</span>
                    <span>{activeProfile.consistency}% consistent</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-primary">Tone Profile</h4>
                  <div className="space-y-3">
                    {Object.entries(activeProfile.toneProfile).map(
                      ([tone, value]) => (
                        <div key={tone} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-secondary capitalize">
                              {tone}
                            </span>
                            <span className="text-primary font-semibold">
                              {value}%
                            </span>
                          </div>
                          <div className="progress-neon">
                            <div
                              className="progress-fill"
                              style={{ width: `${value}%` }}
                            ></div>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "analyzer" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Tone Checker Input */}
          <div className="glass-strong p-6 rounded-2xl">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-neon-blue to-neon-purple rounded-xl flex items-center justify-center">
                <SparklesIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-primary">
                  AI Tone Checker
                </h2>
                <p className="text-secondary text-sm">
                  Analyze content alignment with your brand voice
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Content Type */}
              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Content Type
                </label>
                <select
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value as any)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-primary focus:outline-none focus:border-neon-blue"
                >
                  <option value="general">General</option>
                  <option value="email">Email</option>
                  <option value="social">Social Media</option>
                  <option value="blog">Blog Post</option>
                  <option value="ad">Advertisement</option>
                </select>
              </div>

              {/* Content Input */}
              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Content to Analyze
                </label>
                <textarea
                  value={contentToAnalyze}
                  onChange={(e) => setContentToAnalyze(e.target.value)}
                  placeholder="Paste your content here to check brand voice alignment..."
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-primary placeholder-gray-400 focus:outline-none focus:border-neon-blue resize-none"
                  rows={6}
                />
              </div>

              {/* Analyze Button */}
              <button
                onClick={handleAnalyzeContent}
                disabled={
                  analyzeContentMutation.isLoading || !contentToAnalyze.trim()
                }
                className={`w-full flex items-center justify-center space-x-2 py-3 px-6 rounded-xl font-semibold transition-all duration-300 ${
                  analyzeContentMutation.isLoading || !contentToAnalyze.trim()
                    ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                    : "btn-neon hover:scale-105"
                }`}
              >
                {analyzeContentMutation.isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <BoltIcon className="h-5 w-5" />
                    <span>Analyze Content</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Analysis Results */}
          <div
            className={`glass-strong p-6 rounded-2xl transition-all duration-500 ${
              showAnalysisGlow
                ? "ring-2 ring-neon-blue shadow-lg shadow-neon-blue/30"
                : ""
            }`}
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-neon-green to-neon-blue rounded-xl flex items-center justify-center">
                <ChartBarIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-primary">
                  Analysis Results
                </h2>
                <p className="text-secondary text-sm">
                  AI-powered brand voice assessment
                </p>
              </div>
            </div>

            {analysisResult ? (
              <div className="space-y-6">
                {/* Overall Score */}
                <div className="text-center">
                  <div
                    className={`text-4xl font-bold mb-2 ${getScoreColor(analysisResult.voiceScore)}`}
                  >
                    {analysisResult.voiceScore}%
                  </div>
                  <p className="text-secondary">Brand Voice Alignment</p>
                </div>

                {/* Detailed Analysis */}
                {analysisResult.analysis && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-primary">
                      Detailed Breakdown
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                      <div className="flex justify-between items-center">
                        <span className="text-secondary">Tone Match</span>
                        <span
                          className={`font-semibold ${getScoreColor(analysisResult.analysis.toneMatch)}`}
                        >
                          {analysisResult.analysis.toneMatch}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-secondary">Keyword Usage</span>
                        <span
                          className={`font-semibold ${getScoreColor(analysisResult.analysis.keywordUsage)}`}
                        >
                          {analysisResult.analysis.keywordUsage}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-secondary">
                          Style Consistency
                        </span>
                        <span
                          className={`font-semibold ${getScoreColor(analysisResult.analysis.styleConsistency)}`}
                        >
                          {analysisResult.analysis.styleConsistency}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Suggestions */}
                {analysisResult.suggestions &&
                  analysisResult.suggestions.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-primary flex items-center space-x-2">
                        <LightBulbIcon className="h-5 w-5 text-neon-blue" />
                        <span>AI Suggestions</span>
                      </h3>
                      <div className="space-y-3">
                        {analysisResult.suggestions.map((suggestion, index) => (
                          <div
                            key={index}
                            className="glass p-4 rounded-xl border border-gray-600"
                          >
                            <div className="flex items-start justify-between">
                              <p className="text-primary text-sm leading-relaxed flex-1 mr-4">
                                {suggestion}
                              </p>
                              <button
                                onClick={() =>
                                  handleCopySuggestion(suggestion, index)
                                }
                                className={`p-2 rounded-lg transition-all duration-200 flex-shrink-0 ${
                                  copiedSuggestion === index
                                    ? "bg-neon-green/20 text-neon-green"
                                    : "bg-gray-700 text-secondary hover:text-neon-blue"
                                }`}
                                title="Copy suggestion"
                              >
                                {copiedSuggestion === index ? (
                                  <CheckCircleIcon className="h-4 w-4" />
                                ) : (
                                  <DocumentDuplicateIcon className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gradient-to-r from-neon-blue to-neon-purple rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <EyeIcon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-bold text-primary mb-2">
                  No Analysis Yet
                </h3>
                <p className="text-secondary text-sm">
                  Enter content in the form and click "Analyze Content" to get
                  AI-powered brand voice insights
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "identity" && (
        <div className="space-y-8">
          <h2 className="text-2xl font-bold text-primary">
            Brand Identity Overview
          </h2>

          {activeProfile && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Brand Guidelines */}
              <div className="space-y-6">
                <EditableCard
                  title="Brand Mission"
                  value="Empower businesses with AI-driven marketing automation that delivers personalized experiences at scale"
                  description="Core purpose and mission statement"
                  onSave={async (value) => {
                    await new Promise((resolve) => setTimeout(resolve, 1000));
                    console.log("Updated mission:", value);
                  }}
                  onCopy={() => console.log("Copied mission")}
                  multiline
                />

                <EditableCard
                  title="Primary Voice"
                  value="Professional yet innovative, authoritative but approachable"
                  description="Main brand voice characteristics"
                  onSave={async (value) => {
                    await new Promise((resolve) => setTimeout(resolve, 1000));
                    console.log("Updated voice:", value);
                  }}
                  onCopy={() => console.log("Copied voice")}
                />

                <EditableCard
                  title="Target Audience"
                  value="Marketing professionals, business owners, and growth teams looking to scale their operations with AI"
                  description="Primary audience and persona"
                  onSave={async (value) => {
                    await new Promise((resolve) => setTimeout(resolve, 1000));
                    console.log("Updated audience:", value);
                  }}
                  onCopy={() => console.log("Copied audience")}
                  multiline
                />
              </div>

              {/* Words and Guidelines */}
              <div className="space-y-6">
                <div className="glass-strong p-6 rounded-2xl">
                  <h3 className="text-lg font-bold text-primary mb-4">
                    Preferred Keywords
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {activeProfile.keywords.map((keyword, index) => (
                      <span
                        key={index}
                        className="bg-neon-green/20 text-neon-green border border-neon-green/30 px-3 py-1 rounded-full text-sm font-medium"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="glass-strong p-6 rounded-2xl">
                  <h3 className="text-lg font-bold text-primary mb-4">
                    Words to Avoid
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "outdated",
                      "old-fashioned",
                      "basic",
                      "simple",
                      "cheap",
                      "traditional",
                    ].map((word, index) => (
                      <span
                        key={index}
                        className="bg-neon-pink/20 text-neon-pink border border-neon-pink/30 px-3 py-1 rounded-full text-sm font-medium"
                      >
                        {word}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="glass-strong p-6 rounded-2xl">
                  <h3 className="text-lg font-bold text-primary mb-4">
                    Style Guidelines
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center space-x-2">
                      <CheckIcon className="h-4 w-4 text-neon-green" />
                      <span className="text-secondary">
                        Use active voice and strong verbs
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckIcon className="h-4 w-4 text-neon-green" />
                      <span className="text-secondary">
                        Include data and metrics when possible
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckIcon className="h-4 w-4 text-neon-green" />
                      <span className="text-secondary">
                        Keep sentences concise and impactful
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <XMarkIcon className="h-4 w-4 text-neon-pink" />
                      <span className="text-secondary">
                        Avoid jargon or overly technical terms
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <XMarkIcon className="h-4 w-4 text-neon-pink" />
                      <span className="text-secondary">
                        Don't use passive voice excessively
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
