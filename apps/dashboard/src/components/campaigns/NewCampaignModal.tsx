'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { trpc } from '@/utils/trpc';
import {
  X,
  Zap,
  Brain,
  TrendingUp,
  MessageSquare,
  Globe,
  DollarSign,
  Calendar,
  Target,
  Sparkles,
  Play,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock,
} from 'lucide-react';

interface NewCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunch?: (result: any) => void;
  onSimulate?: (result: any) => void;
}

export const NewCampaignModal = ({ isOpen, onClose, onLaunch, onSimulate }: NewCampaignModalProps) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    campaignName: '',
    topic: '',
    audience: '',
    platforms: [] as string[],
    contentTypes: [] as string[],
    tone: 'professional' as const,
    brandVoiceId: '',
    budget: {
      max: 10,
      currency: 'USD',
    },
    scheduling: {
      immediate: true,
      scheduledTime: '',
      frequency: 'once' as const,
    },
    targetMetrics: {
      engagement: 80,
      reach: 1000,
      conversions: 50,
    },
    region: 'global',
    keywords: [] as string[],
    excludeKeywords: [] as string[],
  });
  
  const [newKeyword, setNewKeyword] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);

  // Mutations
  const launchMutation = trpc.campaignOrchestration.launchCampaign.useMutation();
  const simulateMutation = trpc.campaignOrchestration.simulateCampaign.useMutation();
  const validateMutation = trpc.campaignOrchestration.validateCampaignInput.useMutation();

  // Available options
  const platformOptions = [
    { id: 'instagram', name: 'Instagram', icon: '📷' },
    { id: 'facebook', name: 'Facebook', icon: '📘' },
    { id: 'twitter', name: 'Twitter', icon: '🐦' },
    { id: 'linkedin', name: 'LinkedIn', icon: '💼' },
    { id: 'tiktok', name: 'TikTok', icon: '🎵' },
    { id: 'youtube', name: 'YouTube', icon: '📺' },
  ];

  const contentTypeOptions = [
    { id: 'blog', name: 'Blog Posts', icon: '📝' },
    { id: 'social_post', name: 'Social Posts', icon: '📱' },
    { id: 'email', name: 'Email', icon: '📧' },
    { id: 'caption', name: 'Captions', icon: '💬' },
    { id: 'copy', name: 'Copy', icon: '✍️' },
    { id: 'ad_copy', name: 'Ad Copy', icon: '📢' },
    { id: 'product_description', name: 'Product Descriptions', icon: '🏷️' },
  ];

  const toneOptions = [
    { id: 'professional', name: 'Professional', description: 'Formal and business-like' },
    { id: 'casual', name: 'Casual', description: 'Relaxed and conversational' },
    { id: 'friendly', name: 'Friendly', description: 'Warm and approachable' },
    { id: 'authoritative', name: 'Authoritative', description: 'Expert and confident' },
    { id: 'playful', name: 'Playful', description: 'Fun and energetic' },
    { id: 'witty', name: 'Witty', description: 'Clever and humorous' },
    { id: 'inspirational', name: 'Inspirational', description: 'Motivating and uplifting' },
    { id: 'urgent', name: 'Urgent', description: 'Action-oriented and pressing' },
  ];

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev],
          [child]: value,
        },
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const toggleArrayItem = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field as keyof typeof prev].includes(value)
        ? prev[field as keyof typeof prev].filter((item: string) => item !== value)
        : [...prev[field as keyof typeof prev], value],
    }));
  };

  const addKeyword = () => {
    if (newKeyword.trim() && !formData.keywords.includes(newKeyword.trim())) {
      setFormData(prev => ({
        ...prev,
        keywords: [...prev.keywords, newKeyword.trim()],
      }));
      setNewKeyword('');
    }
  };

  const removeKeyword = (keyword: string) => {
    setFormData(prev => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== keyword),
    }));
  };

  const validateForm = () => {
    return (
      formData.campaignName.trim() &&
      formData.topic.trim() &&
      formData.audience.trim() &&
      formData.platforms.length > 0 &&
      formData.contentTypes.length > 0
    );
  };

  const handleSimulate = async () => {
    if (!validateForm()) return;
    
    setIsSimulating(true);
    try {
      const result = await simulateMutation.mutateAsync(formData);
      onSimulate?.(result);
      onClose();
    } catch (error) {
      console.error('Simulation failed:', error);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleLaunch = async () => {
    if (!validateForm()) return;
    
    setIsLaunching(true);
    try {
      const result = await launchMutation.mutateAsync(formData);
      onLaunch?.(result);
      onClose();
    } catch (error) {
      console.error('Launch failed:', error);
    } finally {
      setIsLaunching(false);
    }
  };

  const nextStep = () => setStep(Math.min(step + 1, 4));
  const prevStep = () => setStep(Math.max(step - 1, 1));

  const resetForm = () => {
    setStep(1);
    setFormData({
      campaignName: '',
      topic: '',
      audience: '',
      platforms: [],
      contentTypes: [],
      tone: 'professional',
      brandVoiceId: '',
      budget: { max: 10, currency: 'USD' },
      scheduling: { immediate: true, scheduledTime: '', frequency: 'once' },
      targetMetrics: { engagement: 80, reach: 1000, conversions: 50 },
      region: 'global',
      keywords: [],
      excludeKeywords: [],
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-gray-800 rounded-xl border border-gray-700 max-w-4xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Sparkles className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Launch AI Campaign</h2>
                <p className="text-gray-400 text-sm">
                  Orchestrate TrendAgent → ContentAgent → SocialAgent
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="text-sm text-gray-400">Step {step} of 4</div>
              <button
                onClick={() => {
                  onClose();
                  resetForm();
                }}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="px-6 py-2">
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(step / 4) * 100}%` }}
              />
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Campaign Basics</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Campaign Name
                      </label>
                      <input
                        type="text"
                        value={formData.campaignName}
                        onChange={e => handleInputChange('campaignName', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                        placeholder="e.g., Q1 Product Launch"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Campaign Topic
                      </label>
                      <input
                        type="text"
                        value={formData.topic}
                        onChange={e => handleInputChange('topic', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                        placeholder="e.g., AI Marketing Tools"
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Target Audience
                    </label>
                    <input
                      type="text"
                      value={formData.audience}
                      onChange={e => handleInputChange('audience', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                      placeholder="e.g., Tech Entrepreneurs, Marketing Managers"
                    />
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Tone
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {toneOptions.map(tone => (
                        <button
                          key={tone.id}
                          onClick={() => handleInputChange('tone', tone.id)}
                          className={`p-3 rounded-lg border text-left transition-all ${
                            formData.tone === tone.id
                              ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                              : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-500'
                          }`}
                        >
                          <div className="font-medium">{tone.name}</div>
                          <div className="text-xs text-gray-400">{tone.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Platforms & Content</h3>
                  
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      Select Platforms
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {platformOptions.map(platform => (
                        <button
                          key={platform.id}
                          onClick={() => toggleArrayItem('platforms', platform.id)}
                          className={`p-3 rounded-lg border transition-all flex items-center space-x-3 ${
                            formData.platforms.includes(platform.id)
                              ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                              : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-500'
                          }`}
                        >
                          <span className="text-xl">{platform.icon}</span>
                          <span className="font-medium">{platform.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      Content Types
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {contentTypeOptions.map(contentType => (
                        <button
                          key={contentType.id}
                          onClick={() => toggleArrayItem('contentTypes', contentType.id)}
                          className={`p-3 rounded-lg border transition-all flex items-center space-x-3 ${
                            formData.contentTypes.includes(contentType.id)
                              ? 'bg-green-500/20 border-green-500 text-green-300'
                              : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-500'
                          }`}
                        >
                          <span className="text-xl">{contentType.icon}</span>
                          <span className="font-medium">{contentType.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Configuration</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Budget Limit (USD)
                      </label>
                      <input
                        type="number"
                        value={formData.budget.max}
                        onChange={e => handleInputChange('budget.max', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                        placeholder="10.00"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Region
                      </label>
                      <select
                        value={formData.region}
                        onChange={e => handleInputChange('region', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                      >
                        <option value="global">Global</option>
                        <option value="US">United States</option>
                        <option value="EU">Europe</option>
                        <option value="APAC">Asia Pacific</option>
                        <option value="UAE">United Arab Emirates</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Keywords (Optional)
                    </label>
                    <div className="flex space-x-2 mb-2">
                      <input
                        type="text"
                        value={newKeyword}
                        onChange={e => setNewKeyword(e.target.value)}
                        onKeyPress={e => e.key === 'Enter' && addKeyword()}
                        className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                        placeholder="Add keyword..."
                      />
                      <button
                        onClick={addKeyword}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.keywords.map(keyword => (
                        <span
                          key={keyword}
                          className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm flex items-center space-x-1"
                        >
                          <span>{keyword}</span>
                          <button
                            onClick={() => removeKeyword(keyword)}
                            className="text-purple-400 hover:text-purple-300"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Scheduling
                    </label>
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => handleInputChange('scheduling.immediate', true)}
                        className={`px-4 py-2 rounded-lg border transition-all ${
                          formData.scheduling.immediate
                            ? 'bg-green-500/20 border-green-500 text-green-300'
                            : 'bg-gray-700 border-gray-600 text-gray-300'
                        }`}
                      >
                        Launch Immediately
                      </button>
                      <button
                        onClick={() => handleInputChange('scheduling.immediate', false)}
                        className={`px-4 py-2 rounded-lg border transition-all ${
                          !formData.scheduling.immediate
                            ? 'bg-yellow-500/20 border-yellow-500 text-yellow-300'
                            : 'bg-gray-700 border-gray-600 text-gray-300'
                        }`}
                      >
                        Schedule for Later
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Campaign Preview</h3>
                  
                  <div className="bg-gray-700/50 rounded-lg p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-400 text-sm">Campaign</p>
                        <p className="text-white font-medium">{formData.campaignName}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Topic</p>
                        <p className="text-white font-medium">{formData.topic}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Audience</p>
                        <p className="text-white font-medium">{formData.audience}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Tone</p>
                        <p className="text-white font-medium capitalize">{formData.tone}</p>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-gray-400 text-sm mb-2">Platforms ({formData.platforms.length})</p>
                      <div className="flex flex-wrap gap-2">
                        {formData.platforms.map(platform => (
                          <span key={platform} className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-sm capitalize">
                            {platform}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-gray-400 text-sm mb-2">Content Types ({formData.contentTypes.length})</p>
                      <div className="flex flex-wrap gap-2">
                        {formData.contentTypes.map(type => (
                          <span key={type} className="px-2 py-1 bg-green-500/20 text-green-300 rounded text-sm">
                            {type.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-600">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Estimated Content Pieces:</span>
                        <span className="text-white font-medium">
                          {formData.platforms.length * formData.contentTypes.length}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Max Budget:</span>
                        <span className="text-white font-medium">${formData.budget.max}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Execution:</span>
                        <span className="text-white font-medium">
                          {formData.scheduling.immediate ? 'Immediate' : 'Scheduled'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-700 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {step > 1 && (
                <button
                  onClick={prevStep}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Previous
                </button>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {step < 4 ? (
                <button
                  onClick={nextStep}
                  disabled={!validateForm()}
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center space-x-2"
                >
                  <span>Next</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={handleSimulate}
                    disabled={!validateForm() || isSimulating || isLaunching}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center space-x-2"
                  >
                    {isSimulating ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                    <span>Simulate</span>
                  </button>
                  <button
                    onClick={handleLaunch}
                    disabled={!validateForm() || isSimulating || isLaunching}
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center space-x-2"
                  >
                    {isLaunching ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                    <span>Launch Campaign</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}; 