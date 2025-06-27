'use client';

import { useState, useCallback } from 'react';
import { trpc } from '@/lib/trpc';

// Types
interface EmailSequence {
  sequenceId: string;
  name: string;
  description: string;
  emails: Array<{
    step: number;
    subject: string;
    content: string;
    delayDays: number;
    purpose: string;
    keyPoints: string[];
  }>;
  estimatedPerformance: {
    openRate: string;
    clickRate: string;
    conversionRate: string;
  };
  recommendations: string[];
}

interface ABTestVariant {
  id: string;
  name: string;
  subject?: string;
  content?: string;
  performance: {
    sent: number;
    opens: number;
    clicks: number;
    conversions: number;
    openRate: number;
    clickRate: number;
    conversionRate: number;
  };
  confidence: number;
  isWinner?: boolean;
}

interface ABTestResult {
  testId: string;
  status: 'running' | 'completed' | 'stopped';
  winner?: string;
  variants: ABTestVariant[];
  insights: string[];
  recommendations: string[];
}

const GOALS = [
  'Welcome new subscribers',
  'Drive product adoption',
  'Increase engagement',
  'Generate sales',
  'Reduce churn',
  'Educate users',
  'Build brand loyalty',
  'Collect feedback',
];

const TONES = [
  { value: 'professional', label: 'Professional' },
  { value: 'casual', label: 'Casual' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'urgent', label: 'Urgent' },
];

const SAMPLE_SIZES = [
  { value: 100, label: '100 contacts' },
  { value: 500, label: '500 contacts' },
  { value: 1000, label: '1,000 contacts' },
  { value: 2500, label: '2,500 contacts' },
  { value: 5000, label: '5,000 contacts' },
];

export default function EmailCampaignManagerPage(): JSX.Element {
  // State
  const [activeTab, setActiveTab] = useState('sequences');
  const [selectedSequence, setSelectedSequence] = useState<EmailSequence | null>(null);
  const [editingStep, setEditingStep] = useState<number | null>(null);
  const [abTestResult, setAbTestResult] = useState<ABTestResult | null>(null);
  const [showToast, setShowToast] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error';
  }>({ show: false, message: '', type: 'success' });

  // Sequence Builder State
  const [campaignName, setCampaignName] = useState('');
  const [topic, setTopic] = useState('');
  const [audience, setAudience] = useState('');
  const [tone, setTone] = useState('professional');
  const [sequenceLength, setSequenceLength] = useState(3);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

  // A/B Test State
  const [testName, setTestName] = useState('');
  const [testMetric, setTestMetric] = useState('open_rate');
  const [sampleSize, setSampleSize] = useState(1000);
  const [variants, setVariants] = useState([
    { name: 'Variant A', subject: '', content: '' },
    { name: 'Variant B', subject: '', content: '' },
  ]);

  // tRPC hooks
  const generateSequenceMutation = trpc.email.generateSequence.useMutation({
    onSuccess: data => {
      if (data.success && data.data) {
        setSelectedSequence(data.data);
        showToastMessage('Email sequence generated successfully!', 'success');
      }
    },
    onError: error => {
      showToastMessage(error.message, 'error');
    },
  });

  const runABTestMutation = trpc.email.runABTest.useMutation({
    onSuccess: data => {
      if (data.success && data.data) {
        setAbTestResult(data.data);
        showToastMessage('A/B test created successfully!', 'success');
      }
    },
    onError: error => {
      showToastMessage(error.message, 'error');
    },
  });

  const { data: analyticsData, isLoading: analyticsLoading } = trpc.email.getAnalytics.useQuery(
    { timeRange: '30d' },
    { enabled: activeTab === 'analytics' }
  );

  // Helper functions
  const showToastMessage = (message: string, type: 'success' | 'error'): void => {
    setShowToast({ show: true, message, type });
    setTimeout(() => setShowToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleGenerateSequence = useCallback(async (): Promise<void> => {
    if (!campaignName.trim() || !topic.trim() || !audience.trim()) {
      showToastMessage('Please fill in all required fields', 'error');
      return;
    }

    generateSequenceMutation.mutate({
      topic,
      audience,
      sequenceLength,
      tone: tone as 'professional' | 'casual' | 'friendly' | 'urgent',
      goals: selectedGoals,
    });
  }, [
    campaignName,
    topic,
    audience,
    sequenceLength,
    tone,
    selectedGoals,
    generateSequenceMutation,
  ]);

  const handleRunABTest = useCallback(async (): Promise<void> => {
    if (!testName.trim() || variants.some(v => !v.subject.trim())) {
      showToastMessage('Please fill in test name and all variant subjects', 'error');
      return;
    }

    runABTestMutation.mutate({
      name: testName,
      variants: variants.map(v => ({
        name: v.name,
        subject: v.subject,
        content: v.content,
      })),
      testMetric: testMetric as 'open_rate' | 'click_rate' | 'conversion_rate',
      sampleSize,
      duration: 24,
      audience: [],
    });
  }, [testName, variants, testMetric, sampleSize, runABTestMutation]);

  const handleEditStep = (stepIndex: number, field: string, value: string): void => {
    if (!selectedSequence) return;

    const updatedSequence = {
      ...selectedSequence,
      emails: selectedSequence.emails.map((email, index) =>
        index === stepIndex ? { ...email, [field]: value } : email
      ),
    };
    setSelectedSequence(updatedSequence);
  };

  const addVariant = (): void => {
    const newVariant = {
      name: `Variant ${String.fromCharCode(65 + variants.length)}`,
      subject: '',
      content: '',
    };
    setVariants([...variants, newVariant]);
  };

  const removeVariant = (index: number): void => {
    if (variants.length > 2) {
      setVariants(variants.filter((_, i) => i !== index));
    }
  };

  const updateVariant = (index: number, field: string, value: string): void => {
    const updatedVariants = variants.map((variant, i) =>
      i === index ? { ...variant, [field]: value } : variant
    );
    setVariants(updatedVariants);
  };

  const toggleGoal = (goal: string): void => {
    setSelectedGoals(prev =>
      prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]
    );
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
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
          : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 hover:text-white'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
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
          📧 Email Campaign Manager
        </h1>
        <p className="text-slate-300 text-lg">
          AI-powered email sequence generation, A/B testing, and analytics
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="max-w-7xl mx-auto">
        <div className="flex gap-2 mb-6 bg-slate-800/30 p-2 rounded-xl backdrop-blur-sm">
          <TabButton
            _id="sequences"
            label="Campaign Sequences"
            active={activeTab === 'sequences'}
            onClick={() => setActiveTab('sequences')}
          />
          <TabButton
            _id="abtest"
            label="A/B Testing"
            active={activeTab === 'abtest'}
            onClick={() => setActiveTab('abtest')}
          />
          <TabButton
            _id="analytics"
            label="Performance Analytics"
            active={activeTab === 'analytics'}
            onClick={() => setActiveTab('analytics')}
          />
        </div>

        {/* Campaign Sequence Builder Tab */}
        {activeTab === 'sequences' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Panel */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-blue-400">🎯</span>
                <h2 className="text-xl font-semibold text-white">Sequence Builder</h2>
              </div>
              <p className="text-slate-300 mb-6">Create AI-powered email sequences</p>

              <div className="space-y-4">
                {/* Campaign Name */}
                <div>
                  <label className="block text-white text-sm font-medium mb-2">Campaign Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Welcome Series for New Users"
                    value={campaignName}
                    onChange={e => setCampaignName(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Topic */}
                <div>
                  <label className="block text-white text-sm font-medium mb-2">Topic</label>
                  <textarea
                    placeholder="What is your email campaign about? (e.g., neon sign customization, product onboarding)"
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                    rows={3}
                  />
                </div>

                {/* Audience */}
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Target Audience
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., new customers, restaurant owners, small business owners"
                    value={audience}
                    onChange={e => setAudience(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Tone and Length */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">Tone</label>
                    <select
                      value={tone}
                      onChange={e => setTone(e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    >
                      {TONES.map(toneOption => (
                        <option key={toneOption.value} value={toneOption.value}>
                          {toneOption.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Sequence Length
                    </label>
                    <select
                      value={sequenceLength}
                      onChange={e => setSequenceLength(Number(e.target.value))}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                        <option key={num} value={num}>
                          {num} email{num > 1 ? 's' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Goals */}
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Campaign Goals
                  </label>
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                    {GOALS.map(goal => (
                      <label
                        key={goal}
                        className="flex items-center gap-2 text-slate-300 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedGoals.includes(goal)}
                          onChange={() => toggleGoal(goal)}
                          className="rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500"
                        />
                        <span className="text-sm">{goal}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Generate Button */}
                <button
                  onClick={handleGenerateSequence}
                  disabled={
                    generateSequenceMutation.isLoading ||
                    !campaignName.trim() ||
                    !topic.trim() ||
                    !audience.trim()
                  }
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-all duration-200"
                >
                  {generateSequenceMutation.isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Generating Sequence...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      ✨ Generate Sequence
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Output Panel */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-green-400">📋</span>
                <h2 className="text-xl font-semibold text-white">Generated Sequence</h2>
              </div>
              <p className="text-slate-300 mb-6">Review and edit your email sequence</p>

              {selectedSequence ? (
                <div className="space-y-4">
                  {/* Sequence Info */}
                  <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {selectedSequence.name}
                    </h3>
                    <p className="text-slate-300 text-sm mb-3">{selectedSequence.description}</p>

                    {/* Performance Estimates */}
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="bg-slate-600/30 rounded-lg p-3">
                        <div className="text-blue-400 text-sm">Open Rate</div>
                        <div className="text-white font-semibold">
                          {selectedSequence.estimatedPerformance.openRate}
                        </div>
                      </div>
                      <div className="bg-slate-600/30 rounded-lg p-3">
                        <div className="text-green-400 text-sm">Click Rate</div>
                        <div className="text-white font-semibold">
                          {selectedSequence.estimatedPerformance.clickRate}
                        </div>
                      </div>
                      <div className="bg-slate-600/30 rounded-lg p-3">
                        <div className="text-purple-400 text-sm">Conversion</div>
                        <div className="text-white font-semibold">
                          {selectedSequence.estimatedPerformance.conversionRate}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Email Steps */}
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {selectedSequence.emails.map((email, index) => (
                      <div
                        key={index}
                        className="bg-slate-700/50 rounded-lg p-4 border border-slate-600"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">
                              {email.step}
                            </span>
                            <span className="text-white font-medium">Day {email.delayDays}</span>
                            <span className="text-slate-400 text-sm">• {email.purpose}</span>
                          </div>
                          <button
                            onClick={() => setEditingStep(editingStep === index ? null : index)}
                            className="text-slate-400 hover:text-white"
                          >
                            ✏️ Edit
                          </button>
                        </div>

                        {editingStep === index ? (
                          <div className="space-y-3">
                            <div>
                              <label className="block text-slate-300 text-sm mb-1">Subject</label>
                              <input
                                type="text"
                                value={email.subject}
                                onChange={e => handleEditStep(index, 'subject', e.target.value)}
                                className="w-full bg-slate-600 border border-slate-500 rounded px-3 py-2 text-white text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-slate-300 text-sm mb-1">Content</label>
                              <textarea
                                value={email.content}
                                onChange={e => handleEditStep(index, 'content', e.target.value)}
                                className="w-full bg-slate-600 border border-slate-500 rounded px-3 py-2 text-white text-sm"
                                rows={4}
                              />
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="text-white font-medium mb-2">📧 {email.subject}</div>
                            <div className="text-slate-300 text-sm whitespace-pre-wrap">
                              {email.content.substring(0, 200)}...
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Recommendations */}
                  <div className="bg-amber-900/20 border border-amber-600/30 rounded-lg p-4">
                    <h4 className="text-amber-400 font-medium mb-2">💡 Recommendations</h4>
                    <ul className="text-slate-300 text-sm space-y-1">
                      {selectedSequence.recommendations.map((rec, index) => (
                        <li key={index}>• {rec}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <div className="text-6xl mb-3 opacity-50">📧</div>
                  <p>Generate an email sequence to see the preview</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* A/B Testing Manager Tab */}
        {activeTab === 'abtest' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* A/B Test Setup */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-purple-400">🧪</span>
                <h2 className="text-xl font-semibold text-white">A/B Test Setup</h2>
              </div>
              <p className="text-slate-300 mb-6">Create variants and run experiments</p>

              <div className="space-y-4">
                {/* Test Name */}
                <div>
                  <label className="block text-white text-sm font-medium mb-2">Test Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Subject Line Test - Welcome Email"
                    value={testName}
                    onChange={e => setTestName(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder:text-slate-400 focus:outline-none focus:border-purple-500"
                  />
                </div>

                {/* Test Configuration */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">Test Metric</label>
                    <select
                      value={testMetric}
                      onChange={e => setTestMetric(e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="open_rate">Open Rate</option>
                      <option value="click_rate">Click Rate</option>
                      <option value="conversion_rate">Conversion Rate</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">Sample Size</label>
                    <select
                      value={sampleSize}
                      onChange={e => setSampleSize(Number(e.target.value))}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                    >
                      {SAMPLE_SIZES.map(size => (
                        <option key={size.value} value={size.value}>
                          {size.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Variants */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-white text-sm font-medium">Variants</label>
                    <button
                      onClick={addVariant}
                      className="text-purple-400 hover:text-purple-300 text-sm"
                    >
                      + Add Variant
                    </button>
                  </div>

                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {variants.map((variant, index) => (
                      <div
                        key={index}
                        className="bg-slate-700/50 rounded-lg p-4 border border-slate-600"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-white font-medium">{variant.name}</h4>
                          {variants.length > 2 && (
                            <button
                              onClick={() => removeVariant(index)}
                              className="text-red-400 hover:text-red-300 text-sm"
                            >
                              Remove
                            </button>
                          )}
                        </div>

                        <div className="space-y-2">
                          <div>
                            <label className="block text-slate-300 text-xs mb-1">
                              Subject Line
                            </label>
                            <input
                              type="text"
                              placeholder="Enter subject line..."
                              value={variant.subject}
                              onChange={e => updateVariant(index, 'subject', e.target.value)}
                              className="w-full bg-slate-600 border border-slate-500 rounded px-3 py-2 text-white text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-300 text-xs mb-1">
                              Email Content (Optional)
                            </label>
                            <textarea
                              placeholder="Enter email content..."
                              value={variant.content}
                              onChange={e => updateVariant(index, 'content', e.target.value)}
                              className="w-full bg-slate-600 border border-slate-500 rounded px-3 py-2 text-white text-sm"
                              rows={2}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Run Test Button */}
                <button
                  onClick={handleRunABTest}
                  disabled={
                    runABTestMutation.isLoading ||
                    !testName.trim() ||
                    variants.some(v => !v.subject.trim())
                  }
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-all duration-200"
                >
                  {runABTestMutation.isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Creating Test...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">🧪 Run A/B Test</span>
                  )}
                </button>
              </div>
            </div>

            {/* Test Results */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-green-400">📊</span>
                <h2 className="text-xl font-semibold text-white">Test Results</h2>
              </div>
              <p className="text-slate-300 mb-6">Winner analysis and performance stats</p>

              {abTestResult ? (
                <div className="space-y-4">
                  {/* Test Status */}
                  <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-white font-semibold">Test: {abTestResult.testId}</h3>
                        <p className="text-slate-300 text-sm">Status: {abTestResult.status}</p>
                      </div>
                      <div
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          abTestResult.status === 'completed'
                            ? 'bg-green-600/20 text-green-400'
                            : abTestResult.status === 'running'
                              ? 'bg-yellow-600/20 text-yellow-400'
                              : 'bg-red-600/20 text-red-400'
                        }`}
                      >
                        {abTestResult.status}
                      </div>
                    </div>
                  </div>

                  {/* Variant Results */}
                  <div className="space-y-3">
                    {abTestResult.variants.map(variant => (
                      <div
                        key={variant.id}
                        className={`bg-slate-700/50 rounded-lg p-4 border ${
                          variant.isWinner ? 'border-green-500' : 'border-slate-600'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-white font-medium">{variant.name}</h4>
                          {variant.isWinner && (
                            <span className="bg-green-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                              🏆 Winner
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <div className="text-slate-400 text-xs">Open Rate</div>
                            <div className="text-white font-semibold">
                              {variant.performance.openRate.toFixed(1)}%
                            </div>
                          </div>
                          <div>
                            <div className="text-slate-400 text-xs">Click Rate</div>
                            <div className="text-white font-semibold">
                              {variant.performance.clickRate.toFixed(1)}%
                            </div>
                          </div>
                          <div>
                            <div className="text-slate-400 text-xs">Confidence</div>
                            <div className="text-white font-semibold">
                              {variant.confidence.toFixed(0)}%
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Insights */}
                  <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-4">
                    <h4 className="text-blue-400 font-medium mb-2">💡 Insights</h4>
                    <ul className="text-slate-300 text-sm space-y-1">
                      {abTestResult.insights.map((insight, index) => (
                        <li key={index}>• {insight}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Recommendations */}
                  <div className="bg-purple-900/20 border border-purple-600/30 rounded-lg p-4">
                    <h4 className="text-purple-400 font-medium mb-2">🎯 Recommendations</h4>
                    <ul className="text-slate-300 text-sm space-y-1">
                      {abTestResult.recommendations.map((rec, index) => (
                        <li key={index}>• {rec}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <div className="text-6xl mb-3 opacity-50">🧪</div>
                  <p>Run an A/B test to see results</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Performance Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {analyticsLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-slate-300">Loading analytics...</p>
              </div>
            ) : analyticsData?.success && analyticsData.data ? (
              <>
                {/* KPI Cards */}
                <div>
                  <h2 className="text-xl font-semibold text-white mb-4">📈 Performance Overview</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-slate-400 text-sm">Open Rate</p>
                          <p className="text-3xl font-bold text-white">
                            {analyticsData.data.summary.openRate}%
                          </p>
                        </div>
                        <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center">
                          <span className="text-blue-400 text-2xl">👀</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-slate-400 text-sm">Click Rate</p>
                          <p className="text-3xl font-bold text-white">
                            {analyticsData.data.summary.clickRate}%
                          </p>
                        </div>
                        <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center">
                          <span className="text-green-400 text-2xl">🖱️</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-slate-400 text-sm">Conversion Rate</p>
                          <p className="text-3xl font-bold text-white">
                            {analyticsData.data.summary.conversionRate}%
                          </p>
                        </div>
                        <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center">
                          <span className="text-purple-400 text-2xl">🎯</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-slate-400 text-sm">Total Sent</p>
                          <p className="text-3xl font-bold text-white">
                            {analyticsData.data.summary.totalSent.toLocaleString()}
                          </p>
                        </div>
                        <div className="w-12 h-12 bg-orange-600/20 rounded-lg flex items-center justify-center">
                          <span className="text-orange-400 text-2xl">📧</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Trends and Segments */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Segment Performance */}
                  <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">
                      📊 Performance by Segment
                    </h3>
                    <div className="space-y-3">
                      {analyticsData.data.segments.map((segment, index) => (
                        <div
                          key={index}
                          className="bg-slate-700/50 rounded-lg p-4 border border-slate-600"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-white font-medium">{segment.name}</h4>
                            <span className="text-slate-400 text-sm">
                              {segment.size.toLocaleString()} contacts
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <div className="text-slate-400 text-xs">Open Rate</div>
                              <div className="text-white font-semibold">{segment.openRate}%</div>
                            </div>
                            <div>
                              <div className="text-slate-400 text-xs">Click Rate</div>
                              <div className="text-white font-semibold">{segment.clickRate}%</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Top Performing Campaigns */}
                  <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">
                      🏆 Top Performing Campaigns
                    </h3>
                    <div className="space-y-3">
                      {analyticsData.data.topPerforming.map((campaign, index) => (
                        <div
                          key={index}
                          className="bg-slate-700/50 rounded-lg p-4 border border-slate-600"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-white font-medium">{campaign.name}</h4>
                            <span className="text-slate-400 text-sm">
                              {campaign.sent.toLocaleString()} sent
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <div className="text-slate-400 text-xs">Open Rate</div>
                              <div className="text-white font-semibold">{campaign.openRate}%</div>
                            </div>
                            <div>
                              <div className="text-slate-400 text-xs">Click Rate</div>
                              <div className="text-white font-semibold">{campaign.clickRate}%</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Device and Time Optimization */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Device Breakdown */}
                  <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">📱 Device Breakdown</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                        <span className="text-slate-300">Mobile</span>
                        <span className="text-white font-semibold">
                          {analyticsData.data.deviceBreakdown.mobile}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                        <span className="text-slate-300">Desktop</span>
                        <span className="text-white font-semibold">
                          {analyticsData.data.deviceBreakdown.desktop}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                        <span className="text-slate-300">Tablet</span>
                        <span className="text-white font-semibold">
                          {analyticsData.data.deviceBreakdown.tablet}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Time Optimization */}
                  <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">
                      ⏰ Send Time Optimization
                    </h3>
                    <div className="space-y-4">
                      <div className="bg-green-900/20 border border-green-600/30 rounded-lg p-4">
                        <h4 className="text-green-400 font-medium mb-2">Optimal Send Times</h4>
                        <p className="text-slate-300 text-sm">
                          Best Time: {analyticsData.data.timeOptimization.bestSendTime}
                          <br />
                          Best Day: {analyticsData.data.timeOptimization.bestSendDay}
                        </p>
                      </div>

                      <div>
                        <h4 className="text-white font-medium mb-2">Performance by Timezone</h4>
                        {Object.entries(analyticsData.data.timeOptimization.timezoneData).map(
                          ([tz, data]) => (
                            <div
                              key={tz}
                              className="flex items-center justify-between p-2 bg-slate-700/30 rounded-lg mb-2"
                            >
                              <span className="text-slate-300">{tz}</span>
                              <span className="text-white text-sm">{data.openRate}% open</span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-slate-400">
                <div className="text-6xl mb-3 opacity-50">📊</div>
                <p>No analytics data available</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
