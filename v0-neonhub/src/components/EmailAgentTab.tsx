'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  EnvelopeIcon,
  PaperAirplaneIcon,
  CalendarIcon,
  ChartBarIcon,
  UserGroupIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { trpc } from '../lib/trpc';

// Form schemas
const emailTemplateSchema = z.object({
  type: z.enum(['newsletter', 'promotional', 'welcome', 'follow-up', 'reminder', 'announcement']),
  subject: z.string().min(1, 'Subject is required').max(200),
  content: z.object({
    headline: z.string().min(1, 'Headline is required').max(200),
    message: z.string().min(1, 'Message is required'),
    ctaText: z.string().min(1, 'CTA text is required').max(50),
    ctaUrl: z.string().url('Invalid URL'),
    footerText: z.string().optional(),
  }),
  brand: z.object({
    name: z.string().min(1, 'Brand name is required').max(100),
    primaryColor: z.string().optional(),
    secondaryColor: z.string().optional(),
  }),
  personalization: z.boolean().default(true),
  mobileOptimized: z.boolean().default(true),
});

const campaignSchema = z.object({
  recipients: z
    .array(
      z.object({
        email: z.string().email(),
        name: z.string().optional(),
      })
    )
    .min(1, 'At least one recipient is required'),
  scheduleAt: z.date().optional(),
  testMode: z.boolean().default(false),
});

type EmailTemplateForm = z.infer<typeof emailTemplateSchema>;
type CampaignForm = z.infer<typeof campaignSchema>;

export default function EmailAgentTab() {
  const [activeSection, setActiveSection] = useState<'template' | 'campaign' | 'analytics'>(
    'template'
  );
  const [generatedTemplate, setGeneratedTemplate] = useState<any>(null);
  const [campaignResult, setCampaignResult] = useState<any>(null);

  // Form setup
  const templateForm = useForm<EmailTemplateForm>({
    resolver: zodResolver(emailTemplateSchema),
    defaultValues: {
      type: 'newsletter',
      subject: '',
      content: {
        headline: '',
        message: '',
        ctaText: 'Learn More',
        ctaUrl: '',
        footerText: '',
      },
      brand: {
        name: '',
        primaryColor: '#3B82F6',
        secondaryColor: '#1E40AF',
      },
      personalization: true,
      mobileOptimized: true,
    },
  });

  const campaignForm = useForm<CampaignForm>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      recipients: [{ email: '', name: '' }],
      testMode: true,
    },
  });

  // tRPC mutations
  const generateTemplate = trpc.email.generateTemplate.useMutation({
    onSuccess: data => {
      setGeneratedTemplate(data);
    },
    onError: error => {
      console.error('Failed to generate template:', error);
    },
  });

  const sendCampaign = trpc.email.sendCampaign.useMutation({
    onSuccess: data => {
      setCampaignResult(data);
    },
    onError: error => {
      console.error('Failed to send campaign:', error);
    },
  });

  // tRPC queries
  const { data: performance, isLoading: performanceLoading } = trpc.email.trackPerformance.useQuery(
    { timeRange: '30d' },
    { enabled: activeSection === 'analytics' }
  );

  // Form handlers
  const onGenerateTemplate = (data: EmailTemplateForm) => {
    generateTemplate.mutate(data);
  };

  const onSendCampaign = (data: CampaignForm) => {
    if (!generatedTemplate) return;

    sendCampaign.mutate({
      campaignId: 'temp-campaign-id', // In real app, get from context
      emailTemplate: {
        subject: templateForm.getValues('subject'),
        htmlContent: generatedTemplate.htmlTemplate,
        textContent: generatedTemplate.textTemplate,
        fromName: templateForm.getValues('brand.name'),
        fromEmail: 'noreply@neonhub.ai',
      },
      recipients: data.recipients,
      scheduleAt: data.scheduleAt,
      testMode: data.testMode,
    });
  };

  const addRecipient = () => {
    const current = campaignForm.getValues('recipients');
    campaignForm.setValue('recipients', [...current, { email: '', name: '' }]);
  };

  const removeRecipient = (index: number) => {
    const current = campaignForm.getValues('recipients');
    if (current.length > 1) {
      campaignForm.setValue(
        'recipients',
        current.filter((_, i) => i !== index)
      );
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <EnvelopeIcon className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Email Marketing Agent</h1>
            <p className="text-sm text-gray-600">
              Create campaigns, manage templates, and track performance
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
          { id: 'template', name: 'Template Builder', icon: EnvelopeIcon },
          { id: 'campaign', name: 'Send Campaign', icon: PaperAirplaneIcon },
          { id: 'analytics', name: 'Analytics', icon: ChartBarIcon },
        ].map(section => {
          const Icon = section.icon;
          return (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeSection === section.id
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="h-4 w-4" />
              {section.name}
            </button>
          );
        })}
      </div>

      {/* Template Builder Section */}
      {activeSection === 'template' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Template Form */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Template Configuration</h3>

            <form onSubmit={templateForm.handleSubmit(onGenerateTemplate)} className="space-y-4">
              {/* Template Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template Type
                </label>
                <Controller
                  name="type"
                  control={templateForm.control}
                  render={({ field }) => (
                    <select
                      {...field}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="newsletter">Newsletter</option>
                      <option value="promotional">Promotional</option>
                      <option value="welcome">Welcome</option>
                      <option value="follow-up">Follow-up</option>
                      <option value="reminder">Reminder</option>
                      <option value="announcement">Announcement</option>
                    </select>
                  )}
                />
              </div>

              {/* Subject Line */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject Line</label>
                <input
                  {...templateForm.register('subject')}
                  type="text"
                  placeholder="Enter email subject..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {templateForm.formState.errors.subject && (
                  <p className="mt-1 text-sm text-red-600">
                    {templateForm.formState.errors.subject.message}
                  </p>
                )}
              </div>

              {/* Brand Information */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Brand Name</label>
                <input
                  {...templateForm.register('brand.name')}
                  type="text"
                  placeholder="Your brand name..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Content Fields */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Headline</label>
                <input
                  {...templateForm.register('content.headline')}
                  type="text"
                  placeholder="Main headline..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                <textarea
                  {...templateForm.register('content.message')}
                  rows={4}
                  placeholder="Email message content..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">CTA Text</label>
                  <input
                    {...templateForm.register('content.ctaText')}
                    type="text"
                    placeholder="Call to action..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">CTA URL</label>
                  <input
                    {...templateForm.register('content.ctaUrl')}
                    type="url"
                    placeholder="https://..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Options */}
              <div className="flex items-center space-x-6">
                <label className="flex items-center">
                  <input
                    {...templateForm.register('personalization')}
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Personalization</span>
                </label>
                <label className="flex items-center">
                  <input
                    {...templateForm.register('mobileOptimized')}
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Mobile Optimized</span>
                </label>
              </div>

              {/* Generate Button */}
              <button
                type="submit"
                disabled={generateTemplate.isLoading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {generateTemplate.isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <EnvelopeIcon className="h-4 w-4" />
                    Generate Template
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Template Preview */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Template Preview</h3>

            {generatedTemplate ? (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">
                    Subject: {generatedTemplate.subject}
                  </h4>
                  <div className="text-sm text-gray-600 mb-2">
                    Preview: {generatedTemplate.previewText}
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div
                    className="p-4 max-h-96 overflow-y-auto"
                    dangerouslySetInnerHTML={{ __html: generatedTemplate.htmlTemplate }}
                  />
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-600">Template generated successfully</div>
                  <button
                    onClick={() => setActiveSection('campaign')}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center gap-2"
                  >
                    <PaperAirplaneIcon className="h-4 w-4" />
                    Send Campaign
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <EnvelopeIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Generate a template to see the preview</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Campaign Section */}
      {activeSection === 'campaign' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Campaign Form */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Campaign Setup</h3>

            {!generatedTemplate && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
                <p className="text-sm text-yellow-800">
                  Please generate a template first before sending a campaign.
                </p>
              </div>
            )}

            <form onSubmit={campaignForm.handleSubmit(onSendCampaign)} className="space-y-4">
              {/* Recipients */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Recipients</label>
                {campaignForm.watch('recipients').map((_, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      {...campaignForm.register(`recipients.${index}.email`)}
                      type="email"
                      placeholder="Email address..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      {...campaignForm.register(`recipients.${index}.name`)}
                      type="text"
                      placeholder="Name (optional)..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {campaignForm.watch('recipients').length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRecipient(index)}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md"
                      >
                        <XCircleIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addRecipient}
                  className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                >
                  <UserGroupIcon className="h-4 w-4" />
                  Add Recipient
                </button>
              </div>

              {/* Scheduling */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Schedule</label>
                <Controller
                  name="scheduleAt"
                  control={campaignForm.control}
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                />
                <p className="mt-1 text-xs text-gray-500">Leave empty to send immediately</p>
              </div>

              {/* Test Mode */}
              <div>
                <label className="flex items-center">
                  <input
                    {...campaignForm.register('testMode')}
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Test Mode (safe sending)</span>
                </label>
              </div>

              {/* Send Button */}
              <button
                type="submit"
                disabled={sendCampaign.isLoading || !generatedTemplate}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {sendCampaign.isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <PaperAirplaneIcon className="h-4 w-4" />
                    Send Campaign
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Campaign Results */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Campaign Results</h3>

            {campaignResult ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircleIcon className="h-5 w-5" />
                  <span className="font-medium">Campaign sent successfully!</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-700">
                      {campaignResult.sentCount}
                    </div>
                    <div className="text-sm text-green-600">Emails Sent</div>
                  </div>
                  <div className="p-3 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-700">
                      {campaignResult.failedCount}
                    </div>
                    <div className="text-sm text-red-600">Failed</div>
                  </div>
                </div>

                {campaignResult.scheduledFor && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-700">
                      <CalendarIcon className="h-4 w-4" />
                      <span className="text-sm">
                        Scheduled for: {new Date(campaignResult.scheduledFor).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <PaperAirplaneIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Campaign results will appear here</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Analytics Section */}
      {activeSection === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Performance Metrics */}
          <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Email Performance (Last 30 Days)
            </h3>

            {performanceLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : performance ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-700">
                      {performance.performance.sent.toLocaleString()}
                    </div>
                    <div className="text-sm text-blue-600">Emails Sent</div>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-700">
                      {performance.rates.delivery}%
                    </div>
                    <div className="text-sm text-green-600">Delivery Rate</div>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-700">
                      {performance.rates.open}%
                    </div>
                    <div className="text-sm text-purple-600">Open Rate</div>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-700">
                      {performance.rates.click}%
                    </div>
                    <div className="text-sm text-orange-600">Click Rate</div>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <h4 className="font-medium text-gray-900 mb-3">Detailed Metrics</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Delivered:</span>
                      <span className="font-medium">
                        {performance.performance.delivered.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Opened:</span>
                      <span className="font-medium">
                        {performance.performance.opened.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Clicked:</span>
                      <span className="font-medium">
                        {performance.performance.clicked.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Bounced:</span>
                      <span className="font-medium text-red-600">
                        {performance.performance.bounced.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Unsubscribed:</span>
                      <span className="font-medium text-red-600">
                        {performance.performance.unsubscribed.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <ChartBarIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No performance data available</p>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>

            <div className="space-y-3">
              <button
                onClick={() => setActiveSection('template')}
                className="w-full p-3 text-left border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <EnvelopeIcon className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="font-medium text-gray-900">New Template</div>
                    <div className="text-sm text-gray-600">Create email template</div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setActiveSection('campaign')}
                className="w-full p-3 text-left border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <PaperAirplaneIcon className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="font-medium text-gray-900">Send Campaign</div>
                    <div className="text-sm text-gray-600">Launch email campaign</div>
                  </div>
                </div>
              </button>

              <div className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex items-center gap-3">
                  <ClockIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <div className="font-medium text-gray-700">Sequences</div>
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
