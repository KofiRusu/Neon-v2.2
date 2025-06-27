'use client';

import { useState, useRef, useEffect } from 'react';
import { api } from '../../utils/trpc';
import {
  ChatBubbleLeftIcon,
  PaperAirplaneIcon,
  BoltIcon,
  CommandLineIcon,
  CpuChipIcon,
  LightBulbIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  MicrophoneIcon,
  CogIcon,
} from '@heroicons/react/24/outline';

export default function CopilotPage(): JSX.Element {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, []);

  const quickActions = [
    {
      id: 'campaign',
      title: 'Launch Campaign',
      description: 'Create and deploy a new marketing campaign',
      icon: BoltIcon,
      color: 'neon-blue',
      command: 'Launch a new social media campaign for our Q4 product launch',
    },
    {
      id: 'analyze',
      title: 'Analyze Performance',
      description: 'Get insights on current campaign performance',
      icon: ChartBarIcon,
      color: 'neon-green',
      command: 'Analyze the performance of our current email campaigns',
    },
    {
      id: 'optimize',
      title: 'Optimize Content',
      description: 'Improve existing content for better engagement',
      icon: LightBulbIcon,
      color: 'neon-purple',
      command: 'Optimize our blog content for better SEO performance',
    },
    {
      id: 'troubleshoot',
      title: 'Troubleshoot Issues',
      description: 'Identify and resolve campaign issues',
      icon: ExclamationCircleIcon,
      color: 'neon-orange',
      command: 'Check for any issues with our current ad campaigns',
    },
  ];

  const messages = [
    {
      id: 1,
      type: 'system',
      content:
        'NeonHub AI Copilot is ready to assist you. How can I help optimize your marketing campaigns today?',
      timestamp: new Date(Date.now() - 5 * 60000),
      status: 'delivered',
    },
    {
      id: 2,
      type: 'user',
      content: 'Show me the performance metrics for our last email campaign',
      timestamp: new Date(Date.now() - 4 * 60000),
      status: 'delivered',
    },
    {
      id: 3,
      type: 'assistant',
      content:
        'I\'ve analyzed your last email campaign "Q4 Product Launch". Here are the key metrics:\n\n📊 **Performance Summary:**\n• Open Rate: 24.8% (+15% vs industry avg)\n• Click Rate: 4.2% (+8% vs industry avg)\n• Conversion Rate: 2.1%\n• Revenue Generated: $15,420\n\n🎯 **Key Insights:**\n• Subject line A/B test: "Exclusive Preview" performed 32% better\n• Mobile engagement was 67% higher than desktop\n• Best performing segment: Loyal customers (35% open rate)\n\n💡 **Recommendations:**\n• Increase mobile optimization\n• Use similar subject line patterns\n• Create more targeted content for loyal customers',
      timestamp: new Date(Date.now() - 3 * 60000),
      status: 'delivered',
    },
    {
      id: 4,
      type: 'user',
      content: 'Can you help me create a follow-up campaign?',
      timestamp: new Date(Date.now() - 2 * 60000),
      status: 'delivered',
    },
    {
      id: 5,
      type: 'assistant',
      content:
        "Absolutely! I'll create a follow-up campaign based on your successful Q4 launch. Let me coordinate with our agents:\n\n🤖 **Agents Activated:**\n• ContentAgent: Generating personalized follow-up content\n• EmailAgent: Setting up automated sequences\n• SegmentAgent: Analyzing customer segments from previous campaign\n\n⏱️ **Estimated completion:** 15 minutes\n\nWould you like me to:\n1. Focus on customers who opened but didn't convert\n2. Create a special offer for loyal customers\n3. Re-engage non-openers with different messaging\n\nWhich approach interests you most?",
      timestamp: new Date(Date.now() - 1 * 60000),
      status: 'delivered',
    },
  ];

  const handleSendMessage = () => {
    if (!message.trim()) return;

    setIsTyping(true);
    // Simulate API call
    setTimeout(() => {
      setIsTyping(false);
    }, 2000);

    setMessage('');
  };

  const handleQuickAction = (action: any) => {
    setMessage(action.command);
    handleSendMessage();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-neon-blue to-neon-purple rounded-2xl flex items-center justify-center">
              <CpuChipIcon className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-primary mb-2">AI Copilot</h1>
              <p className="text-secondary text-lg">Your intelligent marketing assistant</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse"></div>
              <span className="text-sm text-secondary">Online</span>
            </div>
            <button className="p-3 glass rounded-xl text-secondary hover:text-neon-blue transition-colors">
              <CogIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <div className="glass-strong p-6 rounded-2xl">
            <h2 className="text-xl font-bold text-primary mb-4">Quick Actions</h2>
            <div className="space-y-3">
              {quickActions.map(action => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.id}
                    onClick={() => handleQuickAction(action)}
                    className="w-full text-left p-4 glass rounded-xl hover:scale-105 transition-all duration-300 group"
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      <Icon className={`h-5 w-5 text-${action.color}`} />
                      <h3 className="font-semibold text-primary text-sm">{action.title}</h3>
                    </div>
                    <p className="text-xs text-secondary">{action.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Chat Interface */}
        <div className="lg:col-span-3">
          <div className="glass-strong rounded-2xl flex flex-col h-[600px]">
            {/* Chat Header */}
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-neon-blue to-neon-purple rounded-lg flex items-center justify-center">
                    <ChatBubbleLeftIcon className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary">NeonHub AI Assistant</h3>
                    <p className="text-xs text-secondary">Always ready to help</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIsListening(!isListening)}
                    className={`p-2 rounded-lg transition-colors ${
                      isListening
                        ? 'bg-neon-blue text-white'
                        : 'text-secondary hover:text-neon-blue'
                    }`}
                  >
                    <MicrophoneIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                      msg.type === 'user'
                        ? 'bg-neon-blue text-white'
                        : msg.type === 'system'
                          ? 'bg-neon-purple/20 text-neon-purple border border-neon-purple/30'
                          : 'glass text-primary'
                    }`}
                  >
                    <div className="whitespace-pre-wrap text-sm">{msg.content}</div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs opacity-70">
                        {msg.timestamp.toLocaleTimeString()}
                      </span>
                      {msg.type === 'user' && <CheckCircleIcon className="h-3 w-3 opacity-70" />}
                    </div>
                  </div>
                </div>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="glass px-4 py-3 rounded-2xl">
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-neon-blue rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-neon-blue rounded-full animate-bounce delay-100"></div>
                        <div className="w-2 h-2 bg-neon-blue rounded-full animate-bounce delay-200"></div>
                      </div>
                      <span className="text-xs text-secondary">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-6 border-t border-white/10">
              <div className="flex items-center space-x-4">
                <div className="flex-1 relative">
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me anything about your marketing campaigns..."
                    className="input-neon pr-12 py-3 resize-none min-h-[48px] max-h-32"
                    rows={1}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!message.trim()}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neon-blue hover:text-white"
                  >
                    <PaperAirplaneIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center space-x-4 text-xs text-secondary">
                  <div className="flex items-center space-x-1">
                    <CommandLineIcon className="h-3 w-3" />
                    <span>Use "/" for commands</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <BoltIcon className="h-3 w-3" />
                    <span>Powered by AI</span>
                  </div>
                </div>
                <div className="text-xs text-secondary">
                  Press Enter to send • Shift+Enter for new line
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
