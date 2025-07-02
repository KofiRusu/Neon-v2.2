'use client';

import { useState } from 'react';
import { XMarkIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { trpc } from '../../../lib/trpc';
import CampaignConfigDrawer from './CampaignConfigDrawer';

interface EmailComposerProps {
  onClose: () => void;
}

export default function EmailComposer({ onClose }: EmailComposerProps): JSX.Element {
  const [step, setStep] = useState<'compose' | 'configure' | 'preview'>('compose');
  const [emailData, setEmailData] = useState({
    name: '',
    subject: '',
    content: {
      text: '',
      html: '',
    },
    recipients: {
      emails: [] as string[],
      segments: [] as string[],
    },
    scheduling: {
      sendImmediately: true,
      scheduledAt: undefined as Date | undefined,
    },
    settings: {
      trackOpens: true,
      trackClicks: true,
      fromName: 'NeonHub Team',
      fromEmail: 'hello@neonhub.ai',
    },
  });

  const [showConfig, setShowConfig] = useState(false);

  const sendCampaignMutation = trpc.email.sendCampaign.useMutation({
    onSuccess: () => {
      // Handle success
      onClose();
    },
    onError: (error: any) => {
      // Error handling - could show error toast or notification to user
      console.error('Failed to send campaign:', error);
      // For now, the error is handled by the mutation's error state
    },
  });

  const handleSend = async (): Promise<void> => {
    if (!emailData.name || !emailData.subject || !emailData.content.text) {
      return;
    }

    try {
      await sendCampaignMutation.mutateAsync(emailData);
    } catch (_error) {
      // Error handling - the error is already handled by the mutation's onError callback
      // Additional error handling could be added here if needed
    }
  };

  const isValid =
    emailData.name &&
    emailData.subject &&
    emailData.content.text &&
    emailData.recipients.emails.length > 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Create Email Campaign</h2>
            <p className="text-sm text-gray-600 mt-1">Design and send your email campaign</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Step Indicators */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setStep('compose')}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                  step === 'compose' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}
              >
                1
              </button>
              <div className="w-8 h-px bg-gray-300"></div>
              <button
                onClick={() => setStep('configure')}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                  step === 'configure' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}
              >
                2
              </button>
              <div className="w-8 h-px bg-gray-300"></div>
              <button
                onClick={() => setStep('preview')}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                  step === 'preview' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}
              >
                3
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {step === 'compose' && (
            <div className="h-full flex">
              {/* Editor */}
              <div className="flex-1 flex flex-col">
                <div className="p-6 border-b border-gray-200">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Campaign Name *
                      </label>
                      <input
                        type="text"
                        value={emailData.name}
                        onChange={e => setEmailData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter campaign name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Subject Line *
                      </label>
                      <input
                        type="text"
                        value={emailData.subject}
                        onChange={e => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
                        placeholder="Enter email subject"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex-1 p-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Content *
                  </label>
                  <textarea
                    value={emailData.content.text}
                    onChange={e =>
                      setEmailData(prev => ({
                        ...prev,
                        content: { ...prev.content, text: e.target.value },
                      }))
                    }
                    placeholder="Write your email content here..."
                    className="w-full h-64 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />

                  <div className="mt-4 flex items-center gap-4">
                    <button className="text-sm text-blue-600 hover:text-blue-700">Add Image</button>
                    <button className="text-sm text-blue-600 hover:text-blue-700">
                      Insert Link
                    </button>
                    <button className="text-sm text-blue-600 hover:text-blue-700">
                      Use Template
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Settings Sidebar */}
              <div className="w-80 border-l border-gray-200 p-6">
                <h3 className="text-sm font-medium text-gray-900 mb-4">Quick Settings</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      From Name
                    </label>
                    <input
                      type="text"
                      value={emailData.settings.fromName}
                      onChange={e =>
                        setEmailData(prev => ({
                          ...prev,
                          settings: { ...prev.settings, fromName: e.target.value },
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      From Email
                    </label>
                    <input
                      type="email"
                      value={emailData.settings.fromEmail}
                      onChange={e =>
                        setEmailData(prev => ({
                          ...prev,
                          settings: { ...prev.settings, fromEmail: e.target.value },
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={emailData.settings.trackOpens}
                        onChange={e =>
                          setEmailData(prev => ({
                            ...prev,
                            settings: { ...prev.settings, trackOpens: e.target.checked },
                          }))
                        }
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Track opens</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={emailData.settings.trackClicks}
                        onChange={e =>
                          setEmailData(prev => ({
                            ...prev,
                            settings: { ...prev.settings, trackClicks: e.target.checked },
                          }))
                        }
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Track clicks</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 'configure' && (
            <div className="h-full p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6">Campaign Configuration</h3>

              <div className="max-w-2xl space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Recipients *
                  </label>
                  <textarea
                    placeholder="Enter email addresses, one per line"
                    value={emailData.recipients.emails.join('\n')}
                    onChange={e =>
                      setEmailData(prev => ({
                        ...prev,
                        recipients: {
                          ...prev.recipients,
                          emails: e.target.value.split('\n').filter(Boolean),
                        },
                      }))
                    }
                    className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    {emailData.recipients.emails.length} recipients
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Scheduling</label>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={emailData.scheduling.sendImmediately}
                        onChange={() =>
                          setEmailData(prev => ({
                            ...prev,
                            scheduling: {
                              ...prev.scheduling,
                              sendImmediately: true,
                              scheduledAt: undefined,
                            },
                          }))
                        }
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Send immediately</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={!emailData.scheduling.sendImmediately}
                        onChange={() =>
                          setEmailData(prev => ({
                            ...prev,
                            scheduling: { ...prev.scheduling, sendImmediately: false },
                          }))
                        }
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Schedule for later</span>
                    </label>

                    {!emailData.scheduling.sendImmediately && (
                      <div className="ml-6">
                        <input
                          type="datetime-local"
                          value={emailData.scheduling.scheduledAt?.toISOString().slice(0, 16) || ''}
                          onChange={e =>
                            setEmailData(prev => ({
                              ...prev,
                              scheduling: {
                                ...prev.scheduling,
                                scheduledAt: new Date(e.target.value),
                              },
                            }))
                          }
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div className="h-full flex">
              <div className="flex-1 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-6">Preview & Send</h3>

                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="border-b border-gray-200 pb-4 mb-4">
                      <div className="text-sm text-gray-600">
                        From: {emailData.settings.fromName} &lt;{emailData.settings.fromEmail}&gt;
                      </div>
                      <div className="text-lg font-medium text-gray-900 mt-1">
                        {emailData.subject}
                      </div>
                    </div>

                    <div className="prose prose-sm max-w-none">
                      {emailData.content.text.split('\n').map((paragraph, index) => (
                        <p key={index} className="mb-3">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="w-80 border-l border-gray-200 p-6">
                <h4 className="text-sm font-medium text-gray-900 mb-4">Campaign Summary</h4>

                <div className="space-y-4 text-sm">
                  <div>
                    <span className="text-gray-600">Campaign:</span>
                    <div className="font-medium">{emailData.name}</div>
                  </div>

                  <div>
                    <span className="text-gray-600">Recipients:</span>
                    <div className="font-medium">{emailData.recipients.emails.length} emails</div>
                  </div>

                  <div>
                    <span className="text-gray-600">Timing:</span>
                    <div className="font-medium">
                      {emailData.scheduling.sendImmediately ? 'Send immediately' : 'Scheduled'}
                    </div>
                  </div>

                  <div>
                    <span className="text-gray-600">Tracking:</span>
                    <div className="font-medium">
                      {emailData.settings.trackOpens && 'Opens, '}
                      {emailData.settings.trackClicks && 'Clicks'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {step !== 'compose' && (
              <button
                onClick={() => {
                  if (step === 'configure') setStep('compose');
                  if (step === 'preview') setStep('configure');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-900"
              >
                Back
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:text-gray-900">
              Cancel
            </button>

            {step === 'compose' && (
              <button
                onClick={() => setStep('configure')}
                disabled={!emailData.name || !emailData.subject || !emailData.content.text}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            )}

            {step === 'configure' && (
              <button
                onClick={() => setStep('preview')}
                disabled={emailData.recipients.emails.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Preview
              </button>
            )}

            {step === 'preview' && (
              <button
                onClick={handleSend}
                disabled={!isValid || sendCampaignMutation.isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <PaperAirplaneIcon className="h-4 w-4" />
                {sendCampaignMutation.isLoading ? 'Sending...' : 'Send Campaign'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Configuration Drawer */}
      {showConfig && (
        <CampaignConfigDrawer
          isOpen={showConfig}
          onClose={() => setShowConfig(false)}
          emailData={emailData}
          onUpdate={setEmailData}
        />
      )}
    </div>
  );
}
