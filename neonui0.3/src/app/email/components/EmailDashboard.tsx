'use client';

import { useState } from 'react';
import {
  EnvelopeIcon,
  EnvelopeOpenIcon,
  CursorArrowRaysIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  UserGroupIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

interface EmailDashboardProps {
  showCampaigns?: boolean;
}

export default function EmailDashboard({
  showCampaigns = false,
}: EmailDashboardProps): JSX.Element {
  const [_selectedCampaign, setSelectedCampaign] = useState<string | null>(null);

  // Mock data - in real app, this would come from tRPC
  const stats = {
    totalCampaigns: 24,
    totalSent: 45620,
    avgOpenRate: 28.5,
    avgClickRate: 4.2,
  };

  const campaigns = [
    {
      id: '1',
      name: 'Welcome Series - New Users',
      subject: 'Welcome to NeonHub! 🚀',
      status: 'sent',
      sentAt: '2024-01-15T10:00:00Z',
      recipients: 1250,
      openRate: 32.1,
      clickRate: 5.8,
      type: 'welcome',
    },
    {
      id: '2',
      name: 'Product Update Newsletter',
      subject: 'New AI Features Available Now',
      status: 'scheduled',
      scheduledAt: '2024-01-20T09:00:00Z',
      recipients: 5420,
      openRate: 0,
      clickRate: 0,
      type: 'newsletter',
    },
    {
      id: '3',
      name: 'Abandoned Cart Recovery',
      subject: 'Complete your purchase - 20% off',
      status: 'sending',
      sentAt: '2024-01-16T14:30:00Z',
      recipients: 890,
      openRate: 24.6,
      clickRate: 8.2,
      type: 'promotional',
    },
  ];

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'sent':
        return 'bg-green-100 text-green-800';
      case 'sending':
        return 'bg-yellow-100 text-yellow-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (showCampaigns) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Email Campaigns</h2>

          {/* Campaign List */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-600">
                <div className="col-span-4">Campaign</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2">Recipients</div>
                <div className="col-span-1">Open Rate</div>
                <div className="col-span-1">Click Rate</div>
                <div className="col-span-2">Actions</div>
              </div>
            </div>

            <div className="divide-y divide-gray-200">
              {campaigns.map(campaign => (
                <div key={campaign.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <EnvelopeIcon className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{campaign.name}</div>
                          <div className="text-sm text-gray-500">{campaign.subject}</div>
                        </div>
                      </div>
                    </div>

                    <div className="col-span-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}
                      >
                        {campaign.status}
                      </span>
                    </div>

                    <div className="col-span-2">
                      <div className="text-sm text-gray-900">
                        {campaign.recipients.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {campaign.status === 'scheduled'
                          ? `Scheduled ${formatDate(campaign.scheduledAt || campaign.sentAt)}`
                          : `Sent ${formatDate(campaign.sentAt)}`}
                      </div>
                    </div>

                    <div className="col-span-1">
                      <div className="text-sm font-medium text-gray-900">
                        {campaign.openRate > 0 ? `${campaign.openRate}%` : '-'}
                      </div>
                    </div>

                    <div className="col-span-1">
                      <div className="text-sm font-medium text-gray-900">
                        {campaign.clickRate > 0 ? `${campaign.clickRate}%` : '-'}
                      </div>
                    </div>

                    <div className="col-span-2">
                      <div className="flex items-center gap-2">
                        <button className="p-1 text-gray-400 hover:text-gray-600">
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-gray-600">
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-red-600">
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Stats Overview */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Campaigns</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalCampaigns}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <EnvelopeIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Emails Sent</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.totalSent.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <EnvelopeOpenIcon className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Open Rate</p>
                <p className="text-3xl font-bold text-gray-900">{stats.avgOpenRate}%</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <EyeIcon className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Click Rate</p>
                <p className="text-3xl font-bold text-gray-900">{stats.avgClickRate}%</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <CursorArrowRaysIcon className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Campaigns */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Campaigns</h2>
          <button
            onClick={() => setSelectedCampaign('all')}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            View all
          </button>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="divide-y divide-gray-200">
            {campaigns.slice(0, 3).map(campaign => (
              <div key={campaign.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <EnvelopeIcon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{campaign.name}</h3>
                      <p className="text-sm text-gray-500">{campaign.subject}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-sm">
                    <div>
                      <span className="text-gray-600">Recipients:</span>
                      <span className="ml-1 font-medium">
                        {campaign.recipients.toLocaleString()}
                      </span>
                    </div>
                    {campaign.openRate > 0 && (
                      <>
                        <div>
                          <span className="text-gray-600">Open Rate:</span>
                          <span className="ml-1 font-medium">{campaign.openRate}%</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Click Rate:</span>
                          <span className="ml-1 font-medium">{campaign.clickRate}%</span>
                        </div>
                      </>
                    )}
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}
                    >
                      {campaign.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <button className="p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all text-left">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
              <EnvelopeIcon className="h-4 w-4 text-blue-600" />
            </div>
            <h3 className="font-medium text-gray-900 mb-1">Create Campaign</h3>
            <p className="text-sm text-gray-600">Start a new email campaign</p>
          </button>

          <button className="p-4 bg-white rounded-lg border border-gray-200 hover:border-green-300 hover:shadow-md transition-all text-left">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mb-3">
              <UserGroupIcon className="h-4 w-4 text-green-600" />
            </div>
            <h3 className="font-medium text-gray-900 mb-1">Manage Lists</h3>
            <p className="text-sm text-gray-600">Add or segment audiences</p>
          </button>

          <button className="p-4 bg-white rounded-lg border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all text-left">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
              <ChartBarIcon className="h-4 w-4 text-purple-600" />
            </div>
            <h3 className="font-medium text-gray-900 mb-1">View Analytics</h3>
            <p className="text-sm text-gray-600">Deep dive into performance</p>
          </button>
        </div>
      </div>
    </div>
  );
}
