'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  XMarkIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  SparklesIcon,
  CalendarIcon,
  UserGroupIcon,
  ChartBarIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import { trpc } from '../lib/trpc';

// Form schemas
const campaignBasicsSchema = z.object({
  name: z.string().min(1, 'Campaign name is required').max(100),
  type: z.enum(['email', 'social', 'mixed']),
  description: z.string().optional(),
  budget: z.number().min(1, 'Budget must be at least $1'),
  startDate: z.date(),
  endDate: z.date(),
  targetAudience: z.string().min(1, 'Target audience is required'),
});

const emailConfigSchema = z.object({
  templateType: z.enum([
    'newsletter',
    'promotional',
    'welcome',
    'follow-up',
    'reminder',
    'announcement',
  ]),
  subject: z.string().min(1, 'Subject is required').max(200),
  fromName: z.string().min(1, 'From name is required'),
  fromEmail: z.string().email('Invalid email'),
  recipients: z
    .array(
      z.object({
        email: z.string().email(),
        name: z.string().optional(),
      })
    )
    .min(1, 'At least one recipient is required'),
  scheduleType: z.enum(['immediate', 'scheduled', 'sequence']),
  scheduledTime: z.date().optional(),
});

const socialConfigSchema = z.object({
  platforms: z
    .array(z.enum(['FACEBOOK', 'INSTAGRAM', 'TIKTOK', 'TWITTER', 'LINKEDIN']))
    .min(1, 'Select at least one platform'),
  contentType: z.enum(['post', 'story', 'reel', 'thread']),
  tone: z.enum(['professional', 'casual', 'humorous', 'inspirational', 'promotional']),
  includeHashtags: z.boolean().default(true),
  includeEmojis: z.boolean().default(true),
  scheduleType: z.enum(['immediate', 'scheduled', 'calendar']),
  scheduledTime: z.date().optional(),
});

type CampaignBasicsForm = z.infer<typeof campaignBasicsSchema>;
type EmailConfigForm = z.infer<typeof emailConfigSchema>;
type SocialConfigForm = z.infer<typeof socialConfigSchema>;

interface CampaignCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (campaign: any) => void;
}

export default function CampaignCreationModal({
  isOpen,
  onClose,
  onSuccess,
}: CampaignCreationModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [campaignType, setCampaignType] = useState<'email' | 'social' | 'mixed'>('email');
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const [createdCampaign, setCreatedCampaign] = useState<any>(null);

  // Form setup
  const basicsForm = useForm<CampaignBasicsForm>({
    resolver: zodResolver(campaignBasicsSchema),
    defaultValues: {
      name: '',
      type: 'email',
      description: '',
      budget: 1000,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      targetAudience: '',
    },
  });

  const emailForm = useForm<EmailConfigForm>({
    resolver: zodResolver(emailConfigSchema),
    defaultValues: {
      templateType: 'newsletter',
      subject: '',
      fromName: 'NeonHub',
      fromEmail: 'noreply@neonhub.ai',
      recipients: [{ email: '', name: '' }],
      scheduleType: 'immediate',
    },
  });

  const socialForm = useForm<SocialConfigForm>({
    resolver: zodResolver(socialConfigSchema),
    defaultValues: {
      platforms: ['INSTAGRAM'],
      contentType: 'post',
      tone: 'professional',
      includeHashtags: true,
      includeEmojis: true,
      scheduleType: 'immediate',
    },
  });

  // tRPC mutations
  const generateEmailTemplate = trpc.email.generateTemplate.useMutation({
    onSuccess: data => {
      setGeneratedContent({ type: 'email', data });
    },
  });

  const generateSocialContent = trpc.social.generateContent.useMutation({
    onSuccess: data => {
      setGeneratedContent({ type: 'social', data });
    },
  });

  const createCampaign = trpc.campaign.create.useMutation({
    onSuccess: data => {
      setCreatedCampaign(data);
      onSuccess?.(data);
    },
  });

  const steps = [
    { id: 1, name: 'Campaign Basics', icon: ChartBarIcon },
    { id: 2, name: 'Content Generation', icon: SparklesIcon },
    { id: 3, name: 'Configuration', icon: Cog6ToothIcon },
    { id: 4, name: 'Review & Launch', icon: CheckCircleIcon },
  ];

  const platformConfig = {
    FACEBOOK: { name: 'Facebook', color: 'blue' },
    INSTAGRAM: { name: 'Instagram', color: 'pink' },
    TIKTOK: { name: 'TikTok', color: 'black' },
    TWITTER: { name: 'Twitter', color: 'sky' },
    LINKEDIN: { name: 'LinkedIn', color: 'blue' },
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleBasicsSubmit = (data: CampaignBasicsForm) => {
    setCampaignType(data.type);
    handleNext();
  };

  const handleGenerateContent = () => {
    const basicsData = basicsForm.getValues();

    if (campaignType === 'email' || campaignType === 'mixed') {
      const emailData = emailForm.getValues();
      generateEmailTemplate.mutate({
        type: emailData.templateType,
        brand: {
          name: emailData.fromName,
        },
        content: {
          headline: `${basicsData.name} - Special Offer`,
          message: `Exciting news for ${basicsData.targetAudience}! Join our ${basicsData.name} campaign.`,
          ctaText: 'Learn More',
          ctaUrl: 'https://neonhub.ai',
        },
        personalization: true,
        mobileOptimized: true,
      });
    }

    if (campaignType === 'social' || campaignType === 'mixed') {
      const socialData = socialForm.getValues();
      generateSocialContent.mutate({
        platform: socialData.platforms[0],
        contentType: socialData.contentType,
        topic: basicsData.name,
        tone: socialData.tone,
        targetAudience: basicsData.targetAudience,
        includeHashtags: socialData.includeHashtags,
        includeEmojis: socialData.includeEmojis,
      });
    }
  };

  const handleLaunchCampaign = () => {
    const basicsData = basicsForm.getValues();
    const emailData = campaignType !== 'social' ? emailForm.getValues() : null;
    const socialData = campaignType !== 'email' ? socialForm.getValues() : null;

    createCampaign.mutate({
      name: basicsData.name,
      type: basicsData.type,
      description: basicsData.description,
      budget: basicsData.budget,
      startDate: basicsData.startDate,
      endDate: basicsData.endDate,
      targetAudience: basicsData.targetAudience,
      emailConfig: emailData,
      socialConfig: socialData,
      generatedContent,
    });
  };

  const addRecipient = () => {
    const current = emailForm.getValues('recipients');
    emailForm.setValue('recipients', [...current, { email: '', name: '' }]);
  };

  const removeRecipient = (index: number) => {
    const current = emailForm.getValues('recipients');
    if (current.length > 1) {
      emailForm.setValue(
        'recipients',
        current.filter((_, i) => i !== index)
      );
    }
  };

  const togglePlatform = (platform: string) => {
    const current = socialForm.getValues('platforms');
    const updated = current.includes(platform as any)
      ? current.filter(p => p !== platform)
      : [...current, platform as any];

    if (updated.length > 0) {
      socialForm.setValue('platforms', updated);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Create New Campaign</h2>
            <p className="text-sm text-gray-600">Set up your AI-powered marketing campaign</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center py-12">
            <SparklesIcon className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">Campaign Creation Wizard</h3>
            <p className="text-gray-600 mb-6">
              Advanced campaign creation with AI agent integration coming soon!
            </p>

            <div className="space-y-4 text-left max-w-md mx-auto">
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <EnvelopeIcon className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="font-medium text-blue-900">Email Campaign Builder</div>
                  <div className="text-sm text-blue-700">
                    Template generation, audience targeting, scheduling
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-pink-50 rounded-lg">
                <GlobeAltIcon className="h-5 w-5 text-pink-600" />
                <div>
                  <div className="font-medium text-pink-900">Social Media Campaigns</div>
                  <div className="text-sm text-pink-700">
                    Multi-platform content, scheduling, analytics
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <ChartBarIcon className="h-5 w-5 text-green-600" />
                <div>
                  <div className="font-medium text-green-900">Cross-Agent Integration</div>
                  <div className="text-sm text-green-700">
                    ContentAgent + EmailAgent + SocialAgent coordination
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
