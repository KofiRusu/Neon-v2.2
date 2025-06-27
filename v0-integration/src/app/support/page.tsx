'use client';

import { useState, useCallback, useEffect } from 'react';
import { format } from 'date-fns';
import { trpc } from '@/lib/trpc';

// Types
interface SupportTicket {
  id: string;
  customer: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    avatar?: string;
    tier: 'basic' | 'premium' | 'enterprise';
    segments: string[];
    totalTickets: number;
    averageRating: number;
    lastContact: Date;
  };
  subject: string;
  lastMessage: string;
  lastMessageTime: Date;
  status: 'open' | 'in_progress' | 'pending_customer' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  channel: 'whatsapp' | 'email' | 'chat' | 'phone' | 'social';
  assignedTo?: string;
  escalated: boolean;
  messages: Message[];
  sentiment?: {
    sentiment: 'positive' | 'neutral' | 'negative';
    score: number;
    confidence: number;
  };
}

interface Message {
  id: string;
  sender: 'customer' | 'agent' | 'ai';
  content: string;
  timestamp: Date;
  type: 'text' | 'image' | 'file';
  sentiment?: {
    sentiment: 'positive' | 'neutral' | 'negative';
    score: number;
  };
}

interface AgentSuggestion {
  reply: string;
  confidence: number;
  tone: string;
  escalationRecommended: boolean;
  suggestedActions: string[];
}

const MOCK_TICKETS: SupportTicket[] = [
  {
    id: 'ticket_1',
    customer: {
      id: 'cust_1',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@example.com',
      phone: '+1-555-0123',
      tier: 'premium',
      segments: ['Restaurant Owner', 'Active User'],
      totalTickets: 3,
      averageRating: 4.5,
      lastContact: new Date('2024-01-16T09:00:00Z'),
    },
    subject: 'AI Content Generator Issues',
    lastMessage: 'The suggestions are too generic for my restaurant brand',
    lastMessageTime: new Date('2024-01-16T09:05:00Z'),
    status: 'open',
    priority: 'medium',
    channel: 'whatsapp',
    escalated: false,
    sentiment: { sentiment: 'negative', score: -0.3, confidence: 0.85 },
    messages: [
      {
        id: 'msg_1',
        sender: 'customer',
        content:
          "Hi, I'm having trouble with the AI content generator. It keeps giving me generic responses.",
        timestamp: new Date('2024-01-16T09:00:00Z'),
        type: 'text',
        sentiment: { sentiment: 'negative', score: -0.2 },
      },
      {
        id: 'msg_2',
        sender: 'customer',
        content:
          'The suggestions are too generic for my restaurant brand. I need more personalized content.',
        timestamp: new Date('2024-01-16T09:05:00Z'),
        type: 'text',
        sentiment: { sentiment: 'negative', score: -0.3 },
      },
    ],
  },
  {
    id: 'ticket_2',
    customer: {
      id: 'cust_2',
      name: 'Mike Chen',
      email: 'mike.chen@techstartup.com',
      tier: 'enterprise',
      segments: ['Tech Startup', 'High Value'],
      totalTickets: 1,
      averageRating: 5.0,
      lastContact: new Date('2024-01-16T08:45:00Z'),
    },
    subject: 'Enterprise Plan Billing Question',
    lastMessage: 'Can you help me understand the pricing?',
    lastMessageTime: new Date('2024-01-16T08:45:00Z'),
    status: 'open',
    priority: 'high',
    channel: 'email',
    escalated: false,
    sentiment: { sentiment: 'neutral', score: 0.1, confidence: 0.75 },
    messages: [
      {
        id: 'msg_3',
        sender: 'customer',
        content:
          'Can you help me understand the pricing for the enterprise plan? I need details about volume discounts.',
        timestamp: new Date('2024-01-16T08:45:00Z'),
        type: 'text',
        sentiment: { sentiment: 'neutral', score: 0.1 },
      },
    ],
  },
  {
    id: 'ticket_3',
    customer: {
      id: 'cust_3',
      name: 'Emma Wilson',
      email: 'emma@creativeco.com',
      tier: 'basic',
      segments: ['Creative Agency', 'New User'],
      totalTickets: 2,
      averageRating: 4.0,
      lastContact: new Date('2024-01-16T07:30:00Z'),
    },
    subject: 'Feature Request - Templates',
    lastMessage: 'Thank you for the detailed explanation!',
    lastMessageTime: new Date('2024-01-16T07:30:00Z'),
    status: 'resolved',
    priority: 'low',
    channel: 'chat',
    escalated: false,
    sentiment: { sentiment: 'positive', score: 0.7, confidence: 0.92 },
    messages: [
      {
        id: 'msg_4',
        sender: 'customer',
        content: 'Could you add more design templates to the platform?',
        timestamp: new Date('2024-01-16T07:15:00Z'),
        type: 'text',
        sentiment: { sentiment: 'neutral', score: 0.0 },
      },
      {
        id: 'msg_5',
        sender: 'agent',
        content:
          "Thanks for the suggestion! We're working on expanding our template library. I'll add your request to our product roadmap.",
        timestamp: new Date('2024-01-16T07:25:00Z'),
        type: 'text',
      },
      {
        id: 'msg_6',
        sender: 'customer',
        content: 'Thank you for the detailed explanation!',
        timestamp: new Date('2024-01-16T07:30:00Z'),
        type: 'text',
        sentiment: { sentiment: 'positive', score: 0.7 },
      },
    ],
  },
];

const AGENTS = ['Sarah Thompson', 'Michael Rodriguez', 'Emily Davis', 'David Kim', 'Jessica Brown'];

export default function CustomerSupportInboxPage(): JSX.Element {
  // State
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [tickets, setTickets] = useState<SupportTicket[]>(MOCK_TICKETS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [newMessage, setNewMessage] = useState('');
  const [showCustomerProfile, setShowCustomerProfile] = useState(false);
  const [agentSuggestion, setAgentSuggestion] = useState<AgentSuggestion | null>(null);
  const [showToast, setShowToast] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error';
  }>({ show: false, message: '', type: 'success' });

  const selectedTicketData = selectedTicket ? tickets.find(t => t.id === selectedTicket) : null;

  // tRPC hooks
  const _classifyMessageMutation = trpc.support.classifyMessage.useMutation();
  const generateReplyMutation = trpc.support.generateReply.useMutation({
    onSuccess: data => {
      if (data.success && data.data) {
        setAgentSuggestion({
          reply: data.data.reply,
          confidence: data.data.confidence,
          tone: data.data.tone,
          escalationRecommended: data.data.escalationRecommended,
          suggestedActions: data.data.suggestedActions || [],
        });
        showToastMessage('AI reply generated successfully!', 'success');
      }
    },
    onError: error => {
      showToastMessage(error.message, 'error');
    },
  });

  const analyzeSentimentMutation = trpc.support.analyzeSentiment.useMutation({
    onSuccess: data => {
      if (data.success && data.data && selectedTicketData) {
        // Update the selected ticket with sentiment data
        setTickets(prev =>
          prev.map(ticket =>
            ticket.id === selectedTicket ? { ...ticket, sentiment: data.data } : ticket
          )
        );
      }
    },
  });

  const escalateTicketMutation = trpc.support.escalateTicket.useMutation({
    onSuccess: data => {
      if (data.success && selectedTicketData) {
        setTickets(prev =>
          prev.map(ticket =>
            ticket.id === selectedTicket
              ? { ...ticket, escalated: true, priority: 'critical' }
              : ticket
          )
        );
        showToastMessage('Ticket escalated successfully!', 'success');
      }
    },
    onError: error => {
      showToastMessage(error.message, 'error');
    },
  });

  // Helper functions
  const showToastMessage = (message: string, type: 'success' | 'error'): void => {
    setShowToast({ show: true, message, type });
    setTimeout(() => setShowToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch =
      ticket.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.customer.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = statusFilter === 'all' || ticket.status === statusFilter;

    return matchesSearch && matchesFilter;
  });

  const handleGenerateAIReply = useCallback(async (): Promise<void> => {
    if (!selectedTicketData || !selectedTicketData.messages.length) return;

    const lastCustomerMessage = selectedTicketData.messages
      .filter(m => m.sender === 'customer')
      .pop();

    if (!lastCustomerMessage) return;

    generateReplyMutation.mutate({
      message: lastCustomerMessage.content,
      tone: 'professional',
      customer: {
        name: selectedTicketData.customer.name,
        tier: selectedTicketData.customer.tier,
      },
      context: {
        ticketHistory: selectedTicketData.messages.map(m => ({
          message: m.content,
          response: m.sender === 'agent' ? m.content : undefined,
          timestamp: m.timestamp,
        })),
      },
    });
  }, [selectedTicketData, generateReplyMutation]);

  const handleSendMessage = useCallback(async (): Promise<void> => {
    if (!newMessage.trim() || !selectedTicketData) return;

    const newMsg: Message = {
      id: `msg_${Date.now()}`,
      sender: 'agent',
      content: newMessage,
      timestamp: new Date(),
      type: 'text',
    };

    setTickets(prev =>
      prev.map(ticket =>
        ticket.id === selectedTicket
          ? {
              ...ticket,
              messages: [...ticket.messages, newMsg],
              lastMessage: newMessage,
              lastMessageTime: new Date(),
            }
          : ticket
      )
    );

    setNewMessage('');
    setAgentSuggestion(null);
    showToastMessage('Message sent successfully!', 'success');
  }, [newMessage, selectedTicketData, selectedTicket]);

  const handleStatusChange = (newStatus: string): void => {
    if (!selectedTicketData) return;

    setTickets(prev =>
      prev.map(ticket =>
        ticket.id === selectedTicket
          ? { ...ticket, status: newStatus as SupportTicket['status'] }
          : ticket
      )
    );
  };

  const handleEscalateTicket = useCallback((): void => {
    if (!selectedTicketData) return;

    escalateTicketMutation.mutate({
      ticketId: selectedTicket!,
      reason: 'Customer requires specialized assistance',
      priority: 'critical',
      urgency: 'high',
    });
  }, [selectedTicketData, selectedTicket, escalateTicketMutation]);

  const handleAssignAgent = (agentName: string): void => {
    if (!selectedTicketData) return;

    setTickets(prev =>
      prev.map(ticket =>
        ticket.id === selectedTicket ? { ...ticket, assignedTo: agentName } : ticket
      )
    );
  };

  const useSuggestedReply = (): void => {
    if (agentSuggestion) {
      setNewMessage(agentSuggestion.reply);
      setAgentSuggestion(null);
    }
  };

  const getSentimentColor = (sentiment?: { sentiment: string; score: number }): string => {
    if (!sentiment) return 'bg-gray-100 text-gray-800';

    switch (sentiment.sentiment) {
      case 'positive':
        return 'bg-green-100 text-green-800';
      case 'negative':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSentimentIcon = (sentiment?: { sentiment: string }): string => {
    if (!sentiment) return '😐';

    switch (sentiment.sentiment) {
      case 'positive':
        return '😊';
      case 'negative':
        return '😟';
      default:
        return '😐';
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'critical':
        return 'bg-red-600 text-white';
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending_customer':
        return 'bg-orange-100 text-orange-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;

    return format(date, 'MMM dd, h:mm a');
  };

  // Auto-analyze sentiment when ticket is selected
  useEffect(() => {
    if (selectedTicketData && selectedTicketData.messages.length > 0) {
      const lastMessage = selectedTicketData.messages[selectedTicketData.messages.length - 1];
      if (lastMessage.sender === 'customer' && !lastMessage.sentiment) {
        analyzeSentimentMutation.mutate({
          message: lastMessage.content,
        });
      }
    }
  }, [selectedTicket]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex">
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

      {/* Sidebar - Ticket List */}
      <div className="w-80 bg-slate-800/50 backdrop-blur-sm border-r border-slate-700">
        {/* Header */}
        <div className="p-4 border-b border-slate-700">
          <h1 className="text-xl font-bold text-white mb-4">📞 Support Inbox</h1>

          {/* Search */}
          <div className="relative mb-4">
            <input
              type="text"
              placeholder="Search tickets..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 pl-10 text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
            />
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
              🔍
            </span>
          </div>

          {/* Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Tickets</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="pending_customer">Pending Customer</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        {/* Ticket List */}
        <div className="flex-1 overflow-y-auto">
          {filteredTickets.map(ticket => (
            <div
              key={ticket.id}
              onClick={() => setSelectedTicket(ticket.id)}
              className={`p-4 border-b border-slate-700 cursor-pointer hover:bg-slate-700/30 transition-colors ${
                selectedTicket === ticket.id ? 'bg-blue-600/20 border-r-2 border-blue-500' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-slate-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {ticket.customer.name
                    .split(' ')
                    .map(n => n[0])
                    .join('')}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium text-white truncate">{ticket.customer.name}</h3>
                    <div className="flex items-center gap-1">
                      {ticket.escalated && <span className="text-red-400">🚨</span>}
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${getSentimentColor(ticket.sentiment)}`}
                      >
                        {getSentimentIcon(ticket.sentiment)}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm font-medium text-slate-200 mb-1 truncate">
                    {ticket.subject}
                  </p>
                  <p className="text-sm text-slate-400 mb-2 line-clamp-2">{ticket.lastMessage}</p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(ticket.priority)}`}
                      >
                        {ticket.priority}
                      </span>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${getStatusColor(ticket.status)}`}
                      >
                        {ticket.status.replace('_', ' ')}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500">
                      {formatTime(ticket.lastMessageTime)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex">
        {/* Ticket Detail Panel */}
        <div className="flex-1 flex flex-col">
          {selectedTicketData ? (
            <>
              {/* Ticket Header */}
              <div className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-600 rounded-full flex items-center justify-center text-white font-medium">
                      {selectedTicketData.customer.name
                        .split(' ')
                        .map(n => n[0])
                        .join('')}
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-white">
                        {selectedTicketData.customer.name}
                      </h2>
                      <p className="text-slate-300">{selectedTicketData.subject}</p>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-slate-400 text-sm">
                          {selectedTicketData.customer.email}
                        </span>
                        <span className="text-slate-400 text-sm capitalize">
                          {selectedTicketData.channel}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${getSentimentColor(selectedTicketData.sentiment)}`}
                        >
                          {getSentimentIcon(selectedTicketData.sentiment)} Sentiment:{' '}
                          {selectedTicketData.sentiment?.sentiment || 'Unknown'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Status Selector */}
                    <select
                      value={selectedTicketData.status}
                      onChange={e => handleStatusChange(e.target.value)}
                      className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="pending_customer">Pending Customer</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>

                    {/* Agent Assignment */}
                    <select
                      value={selectedTicketData.assignedTo || ''}
                      onChange={e => handleAssignAgent(e.target.value)}
                      className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Assign Agent</option>
                      {AGENTS.map(agent => (
                        <option key={agent} value={agent}>
                          {agent}
                        </option>
                      ))}
                    </select>

                    {/* Escalation */}
                    <button
                      onClick={handleEscalateTicket}
                      disabled={selectedTicketData.escalated || escalateTicketMutation.isLoading}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        selectedTicketData.escalated
                          ? 'bg-red-600/20 text-red-400 cursor-not-allowed'
                          : 'bg-orange-600 hover:bg-orange-700 text-white'
                      }`}
                    >
                      {selectedTicketData.escalated ? '🚨 Escalated' : '🔼 Escalate'}
                    </button>

                    {/* Customer Profile Toggle */}
                    <button
                      onClick={() => setShowCustomerProfile(!showCustomerProfile)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                    >
                      👤 Profile
                    </button>
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {selectedTicketData.messages.map(message => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.sender === 'customer' ? '' : 'flex-row-reverse'}`}
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                      {message.sender === 'customer' ? (
                        <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center text-white text-xs">
                          👤
                        </div>
                      ) : message.sender === 'ai' ? (
                        <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs">
                          🤖
                        </div>
                      ) : (
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs">
                          👨‍💼
                        </div>
                      )}
                    </div>

                    <div
                      className={`max-w-md ${message.sender === 'customer' ? '' : 'text-right'}`}
                    >
                      <div
                        className={`inline-block px-4 py-2 rounded-lg ${
                          message.sender === 'customer'
                            ? 'bg-slate-700 text-white'
                            : message.sender === 'ai'
                              ? 'bg-purple-600 text-white'
                              : 'bg-blue-600 text-white'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                        <span>{formatTime(message.timestamp)}</span>
                        {message.sentiment && (
                          <span
                            className={`px-2 py-1 rounded-full ${getSentimentColor(message.sentiment)}`}
                          >
                            {getSentimentIcon(message.sentiment)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* AI Suggestion Banner */}
              {agentSuggestion && (
                <div className="bg-purple-900/20 border-t border-purple-600/30 p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm">
                      🤖
                    </div>
                    <div className="flex-1">
                      <h4 className="text-purple-400 font-medium mb-2">
                        AI Suggested Reply (Confidence:{' '}
                        {Math.round(agentSuggestion.confidence * 100)}%)
                      </h4>
                      <div className="bg-slate-800/50 rounded-lg p-3 mb-3">
                        <p className="text-slate-300 text-sm">{agentSuggestion.reply}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={useSuggestedReply}
                          className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm"
                        >
                          Use Reply
                        </button>
                        <button
                          onClick={() => setAgentSuggestion(null)}
                          className="px-3 py-1 border border-slate-600 text-slate-300 hover:bg-slate-700 rounded text-sm"
                        >
                          Dismiss
                        </button>
                        {agentSuggestion.escalationRecommended && (
                          <span className="px-3 py-1 bg-orange-600/20 text-orange-400 rounded text-sm">
                            ⚠️ Escalation Recommended
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Message Composer */}
              <div className="bg-slate-800/50 backdrop-blur-sm border-t border-slate-700 p-6">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <textarea
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      placeholder="Type your response..."
                      rows={3}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500 resize-none"
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleGenerateAIReply}
                          disabled={generateReplyMutation.isLoading}
                          className="px-3 py-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded text-sm transition-colors"
                        >
                          {generateReplyMutation.isLoading
                            ? '🤖 Generating...'
                            : '🤖 Generate AI Reply'}
                        </button>
                      </div>
                      <span className="text-xs text-slate-500">
                        Press Enter to send, Shift+Enter for new line
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                  >
                    Send
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-slate-800/30">
              <div className="text-center">
                <div className="text-6xl mb-4 opacity-50">📞</div>
                <h3 className="text-xl font-medium text-white mb-2">Select a ticket</h3>
                <p className="text-slate-400">Choose a support ticket to start helping customers</p>
              </div>
            </div>
          )}
        </div>

        {/* Customer Profile Sidebar */}
        {showCustomerProfile && selectedTicketData && (
          <div className="w-80 bg-slate-800/50 backdrop-blur-sm border-l border-slate-700 p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Customer Profile</h3>
              <button
                onClick={() => setShowCustomerProfile(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Customer Info */}
            <div className="space-y-6">
              <div>
                <div className="w-16 h-16 bg-slate-600 rounded-full flex items-center justify-center text-white text-xl font-medium mb-4">
                  {selectedTicketData.customer.name
                    .split(' ')
                    .map(n => n[0])
                    .join('')}
                </div>
                <h4 className="text-white font-medium">{selectedTicketData.customer.name}</h4>
                <p className="text-slate-400 text-sm">{selectedTicketData.customer.email}</p>
                {selectedTicketData.customer.phone && (
                  <p className="text-slate-400 text-sm">{selectedTicketData.customer.phone}</p>
                )}
              </div>

              {/* Customer Tier */}
              <div>
                <h5 className="text-white font-medium mb-2">Customer Tier</h5>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    selectedTicketData.customer.tier === 'enterprise'
                      ? 'bg-purple-600/20 text-purple-400'
                      : selectedTicketData.customer.tier === 'premium'
                        ? 'bg-blue-600/20 text-blue-400'
                        : 'bg-gray-600/20 text-gray-400'
                  }`}
                >
                  {selectedTicketData.customer.tier.charAt(0).toUpperCase() +
                    selectedTicketData.customer.tier.slice(1)}
                </span>
              </div>

              {/* Segments */}
              <div>
                <h5 className="text-white font-medium mb-2">Segments</h5>
                <div className="flex flex-wrap gap-2">
                  {selectedTicketData.customer.segments.map((segment, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-green-600/20 text-green-400 rounded text-sm"
                    >
                      {segment}
                    </span>
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                  <div className="text-white font-semibold">
                    {selectedTicketData.customer.totalTickets}
                  </div>
                  <div className="text-slate-400 text-xs">Total Tickets</div>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                  <div className="text-white font-semibold">
                    {selectedTicketData.customer.averageRating}
                  </div>
                  <div className="text-slate-400 text-xs">Avg Rating</div>
                </div>
              </div>

              {/* Last Contact */}
              <div>
                <h5 className="text-white font-medium mb-2">Last Contact</h5>
                <p className="text-slate-400 text-sm">
                  {formatTime(selectedTicketData.customer.lastContact)}
                </p>
              </div>

              {/* Ticket History */}
              <div>
                <h5 className="text-white font-medium mb-2">Recent Tickets</h5>
                <div className="space-y-2">
                  {tickets
                    .filter(t => t.customer.id === selectedTicketData.customer.id)
                    .slice(0, 3)
                    .map(ticket => (
                      <div key={ticket.id} className="bg-slate-700/50 rounded-lg p-3">
                        <p className="text-white text-sm font-medium truncate">{ticket.subject}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${getStatusColor(ticket.status)}`}
                          >
                            {ticket.status.replace('_', ' ')}
                          </span>
                          <span className="text-slate-400 text-xs">
                            {formatTime(ticket.lastMessageTime)}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
