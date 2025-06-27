'use client';

import { useState } from 'react';
import {
  SparklesIcon,
  MagnifyingGlassIcon,
  Cog6ToothIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  ChatBubbleLeftIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import ContentEditor from '../app/agents/content-editor';
import SEOOptimizer from '../app/agents/seo-optimizer';

const agentTabs = [
  {
    id: 'content',
    name: 'Content Generator',
    icon: SparklesIcon,
    description: 'Generate blogs, social posts, emails, and marketing copy',
    component: ContentEditor,
  },
  {
    id: 'seo',
    name: 'SEO Optimizer',
    icon: MagnifyingGlassIcon,
    description: 'Optimize content for search engines and generate meta tags',
    component: SEOOptimizer,
  },
];

interface AgentPanelProps {
  className?: string;
}

export default function AgentPanel({ className = '' }: AgentPanelProps) {
  const [activeTab, setActiveTab] = useState('content');

  const ActiveComponent = agentTabs.find(tab => tab.id === activeTab)?.component || ContentEditor;

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Agent Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">AI Agents</h2>
          <div className="flex space-x-1">
            {agentTabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.name}
                </button>
              );
            })}
          </div>

          {/* Active Agent Description */}
          <div className="mt-3 text-sm text-gray-600">
            {agentTabs.find(tab => tab.id === activeTab)?.description}
          </div>
        </div>
      </div>

      {/* Agent Content Area */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="mb-8">
          <ActiveComponent />
        </div>

        {/* Phase 2 Agents */}
        <div className="border-t border-gray-200 pt-8">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Phase 2: Marketing Automation
            </h3>
            <p className="text-sm text-gray-600">
              Advanced AI agents for email, social media, and customer support
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/email" className="group">
              <div className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <EnvelopeIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <ArrowTopRightOnSquareIcon className="h-4 w-4 text-gray-400 group-hover:text-blue-600" />
                </div>
                <h4 className="font-medium text-gray-900 mb-1">Email Marketing</h4>
                <p className="text-sm text-gray-600">
                  Create campaigns, manage sequences, and track analytics
                </p>
                <div className="mt-3">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Live
                  </span>
                </div>
              </div>
            </Link>

            <Link href="/social" className="group">
              <div className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                    <GlobeAltIcon className="h-5 w-5 text-pink-600" />
                  </div>
                  <ArrowTopRightOnSquareIcon className="h-4 w-4 text-gray-400 group-hover:text-pink-600" />
                </div>
                <h4 className="font-medium text-gray-900 mb-1">Social Media</h4>
                <p className="text-sm text-gray-600">
                  Schedule posts, manage platforms, and analyze engagement
                </p>
                <div className="mt-3">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Live
                  </span>
                </div>
              </div>
            </Link>

            <Link href="/support" className="group">
              <div className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <ChatBubbleLeftIcon className="h-5 w-5 text-purple-600" />
                  </div>
                  <ArrowTopRightOnSquareIcon className="h-4 w-4 text-gray-400 group-hover:text-purple-600" />
                </div>
                <h4 className="font-medium text-gray-900 mb-1">Customer Support</h4>
                <p className="text-sm text-gray-600">
                  AI-powered chat, WhatsApp integration, and ticket management
                </p>
                <div className="mt-3">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Live
                  </span>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Agent Status Bar */}
      <div className="bg-gray-50 border-t border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="h-2 w-2 bg-green-500 rounded-full"></div>
            <span>AI Agents Online</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500">
              Phase 1 & 2: Complete | 24 API endpoints active
            </div>
            <button className="p-1 text-gray-400 hover:text-gray-600">
              <Cog6ToothIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
