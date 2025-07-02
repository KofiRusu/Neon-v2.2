'use client';

import { useState } from 'react';
import {
  PaperAirplaneIcon,
  FaceSmileIcon,
  PaperClipIcon,
  UserIcon,
  InboxIcon,
  CpuChipIcon,
} from '@heroicons/react/24/outline';
import EscalationBanner from './EscalationBanner';
import { trpc } from '../../../lib/trpc';

interface SupportInboxProps {
  selectedThread: string | null;
}

// Mock conversation data
const mockConversation = {
  id: '1',
  customer: {
    name: 'Sarah Johnson',
    email: 'sarah.johnson@example.com',
    phone: '+1-555-0123',
    avatar: null,
  },
  subject: 'Issue with AI Content Generator',
  status: 'open',
  priority: 'medium',
  channel: 'whatsapp',
  escalated: false,
  createdAt: new Date('2024-01-16T09:00:00Z'),
  messages: [
    {
      id: '1',
      sender: 'customer',
      content:
        "Hi, I'm having trouble with the AI content generator. It keeps giving me generic responses.",
      timestamp: new Date('2024-01-16T09:00:00Z'),
      type: 'text',
    },
    {
      id: '2',
      sender: 'ai',
      content:
        "Hello Sarah! I understand you're experiencing issues with the AI content generator. Let me help you troubleshoot this. Can you tell me what type of content you're trying to generate?",
      timestamp: new Date('2024-01-16T09:02:00Z'),
      type: 'text',
    },
    {
      id: '3',
      sender: 'customer',
      content:
        "I'm trying to create social media posts for my restaurant, but the suggestions are too generic and don't capture my brand voice.",
      timestamp: new Date('2024-01-16T09:05:00Z'),
      type: 'text',
    },
    {
      id: '4',
      sender: 'ai',
      content:
        "I see the issue. For more personalized content, try providing more specific details about your restaurant's style, target audience, and unique selling points in the prompt. Would you like me to guide you through creating a better prompt template?",
      timestamp: new Date('2024-01-16T09:07:00Z'),
      type: 'text',
    },
  ],
};

export default function SupportInbox({ selectedThread }: SupportInboxProps): JSX.Element {
  const [newMessage, setNewMessage] = useState('');
  const [showEscalation, setShowEscalation] = useState(false);

  const sendMessageMutation = trpc.support.sendMessage.useMutation({
    onSuccess: () => {
      setNewMessage('');
    },
    onError: error => {
      // eslint-disable-next-line no-console
      console.error('Failed to send message:', error);
    },
  });

  const handleSendMessage = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedThread) return;

    try {
      await sendMessageMutation.mutateAsync({
        ticketId: selectedThread,
        content: newMessage,
        type: 'text',
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Send failed:', error);
    }
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (!selectedThread) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <InboxIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
          <p className="text-gray-600">Choose a ticket from the list to start helping customers</p>
        </div>
      </div>
    );
  }

  const conversation = mockConversation;

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Conversation Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
              {conversation.customer.avatar ? (
                <img
                  src={conversation.customer.avatar}
                  alt={conversation.customer.name}
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <UserIcon className="h-5 w-5 text-gray-600" />
              )}
            </div>
            <div>
              <h3 className="font-medium text-gray-900">{conversation.customer.name}</h3>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>{conversation.customer.email}</span>
                <span className="capitalize">{conversation.channel}</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    conversation.priority === 'high'
                      ? 'bg-red-100 text-red-800'
                      : conversation.priority === 'medium'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                  }`}
                >
                  {conversation.priority} priority
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowEscalation(true)}
              className="px-3 py-2 text-sm text-orange-600 hover:text-orange-700 border border-orange-200 rounded-lg hover:border-orange-300"
            >
              Escalate to Human
            </button>
            <select className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="open">Open</option>
              <option value="pending">Pending</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>
      </div>

      {/* Escalation Banner */}
      {showEscalation && <EscalationBanner onClose={() => setShowEscalation(false)} />}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {conversation.messages.map(message => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.sender === 'customer' ? '' : 'flex-row-reverse'}`}
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
              {message.sender === 'customer' ? (
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <UserIcon className="h-4 w-4 text-gray-600" />
                </div>
              ) : (
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <CpuChipIcon className="h-4 w-4 text-blue-600" />
                </div>
              )}
            </div>

            <div className={`max-w-md ${message.sender === 'customer' ? '' : 'text-right'}`}>
              <div
                className={`inline-block px-4 py-2 rounded-lg ${
                  message.sender === 'customer'
                    ? 'bg-gray-100 text-gray-900'
                    : 'bg-blue-600 text-white'
                }`}
              >
                <p className="text-sm">{message.content}</p>
              </div>
              <div className="mt-1 text-xs text-gray-500">{formatTime(message.timestamp)}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Message Input */}
      <div className="p-6 border-t border-gray-200">
        <form onSubmit={handleSendMessage} className="flex items-end gap-3">
          <div className="flex-1">
            <textarea
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              placeholder="Type your response..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
            />
            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <PaperClipIcon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <FaceSmileIcon className="h-4 w-4" />
                </button>
              </div>
              <div className="text-xs text-gray-500">
                Press Enter to send, Shift+Enter for new line
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={!newMessage.trim() || sendMessageMutation.isLoading}
            className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <PaperAirplaneIcon className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
