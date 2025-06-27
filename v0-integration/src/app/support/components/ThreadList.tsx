'use client';

import { useState } from 'react';
import {
  MagnifyingGlassIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ChatBubbleLeftIcon,
} from '@heroicons/react/24/outline';

interface ThreadListProps {
  selectedThread: string | null;
  onSelectThread: (threadId: string) => void;
}

// Mock threads data
const mockThreads = [
  {
    id: '1',
    customer: {
      name: 'Sarah Johnson',
      email: 'sarah.johnson@example.com',
      avatar: null,
    },
    subject: 'Issue with AI Content Generator',
    lastMessage: 'I see the issue. For more personalized content, try providing...',
    lastMessageTime: new Date('2024-01-16T09:07:00Z'),
    status: 'open',
    priority: 'medium',
    channel: 'whatsapp',
    unreadCount: 2,
    isAiHandled: true,
  },
  {
    id: '2',
    customer: {
      name: 'Mike Chen',
      email: 'mike.chen@techstartup.com',
      avatar: null,
    },
    subject: 'Billing Question',
    lastMessage: 'Can you help me understand the pricing for the enterprise plan?',
    lastMessageTime: new Date('2024-01-16T08:45:00Z'),
    status: 'open',
    priority: 'high',
    channel: 'email',
    unreadCount: 1,
    isAiHandled: false,
  },
  {
    id: '3',
    customer: {
      name: 'Emma Wilson',
      email: 'emma@creativeco.com',
      avatar: null,
    },
    subject: 'Feature Request',
    lastMessage: 'Thank you for the detailed explanation!',
    lastMessageTime: new Date('2024-01-16T07:30:00Z'),
    status: 'resolved',
    priority: 'low',
    channel: 'chat',
    unreadCount: 0,
    isAiHandled: true,
  },
  {
    id: '4',
    customer: {
      name: 'David Rodriguez',
      email: 'david.r@agency.com',
      avatar: null,
    },
    subject: 'API Integration Help',
    lastMessage: "I'm having trouble with the webhook setup...",
    lastMessageTime: new Date('2024-01-16T06:15:00Z'),
    status: 'pending',
    priority: 'high',
    channel: 'email',
    unreadCount: 3,
    isAiHandled: false,
  },
];

export default function ThreadList({ selectedThread, onSelectThread }: ThreadListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredThreads = mockThreads.filter(thread => {
    const matchesSearch =
      thread.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      thread.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      thread.customer.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = filterStatus === 'all' || thread.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  const sortedThreads = filteredThreads.sort((a, b) => {
    // Sort by priority first (high > medium > low)
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    const priorityDiff =
      priorityOrder[b.priority as keyof typeof priorityOrder] -
      priorityOrder[a.priority as keyof typeof priorityOrder];

    if (priorityDiff !== 0) return priorityDiff;

    // Then by last message time (newest first)
    return b.lastMessageTime.getTime() - a.lastMessageTime.getTime();
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <ClockIcon className="h-4 w-4 text-yellow-500" />;
      case 'resolved':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      default:
        return <ChatBubbleLeftIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getChannelColor = (channel: string) => {
    switch (channel) {
      case 'whatsapp':
        return 'bg-green-500';
      case 'email':
        return 'bg-blue-500';
      case 'chat':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative mb-4">
          <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Tickets</option>
          <option value="open">Open</option>
          <option value="pending">Pending</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      {/* Thread List */}
      <div className="flex-1 overflow-y-auto">
        {sortedThreads.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <ChatBubbleLeftIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p>No conversations found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {sortedThreads.map(thread => (
              <div
                key={thread.id}
                onClick={() => onSelectThread(thread.id)}
                className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedThread === thread.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                    {thread.customer.avatar ? (
                      <img
                        src={thread.customer.avatar}
                        alt={thread.customer.name}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <span className="text-sm font-medium text-gray-600">
                        {thread.customer.name
                          .split(' ')
                          .map(n => n[0])
                          .join('')
                          .toUpperCase()}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-gray-900 truncate">{thread.customer.name}</h4>
                      <div className="flex items-center gap-1">
                        {thread.unreadCount > 0 && (
                          <span className="w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                            {thread.unreadCount}
                          </span>
                        )}
                        {getStatusIcon(thread.status)}
                      </div>
                    </div>

                    <p className="text-sm font-medium text-gray-800 mb-1 truncate">
                      {thread.subject}
                    </p>

                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">{thread.lastMessage}</p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${getChannelColor(thread.channel)}`}
                        ></div>
                        <span className="text-xs text-gray-500 capitalize">{thread.channel}</span>
                        <span
                          className={`px-2 py-1 text-xs rounded-full border ${getPriorityColor(thread.priority)}`}
                        >
                          {thread.priority}
                        </span>
                        {thread.isAiHandled && (
                          <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">
                            AI
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatTime(thread.lastMessageTime)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
