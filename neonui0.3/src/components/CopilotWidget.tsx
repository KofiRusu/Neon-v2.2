'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Bot,
  User,
  Send,
  Mic,
  MicOff,
  Minimize2,
  Maximize2,
  X,
  MessageCircle,
  Zap,
  Volume2,
  VolumeX,
  Loader2,
  CheckCircle,
  AlertCircle,
  Settings,
  History,
  Download,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Types
interface CopilotMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  confidence?: number;
  attachments?: MessageAttachment[];
  actions?: string[];
  status?: 'sending' | 'sent' | 'processing' | 'completed' | 'failed';
}

interface MessageAttachment {
  type: 'report' | 'chart' | 'campaign' | 'insight';
  id: string;
  title: string;
  preview?: string;
  downloadUrl?: string;
}

interface VoiceRecording {
  isRecording: boolean;
  isProcessing: boolean;
  duration: number;
  transcript?: string;
  confidence?: number;
}

interface CopilotWidgetProps {
  className?: string;
  initialPosition?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  enableVoice?: boolean;
  enableDrag?: boolean;
  persistState?: boolean;
}

interface WidgetState {
  isOpen: boolean;
  isMinimized: boolean;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

export const CopilotWidget: React.FC<CopilotWidgetProps> = ({
  className = '',
  initialPosition = 'bottom-right',
  enableVoice = true,
  enableDrag = true,
  persistState = true,
}) => {
  // Widget state
  const [widgetState, setWidgetState] = useState<WidgetState>({
    isOpen: false,
    isMinimized: false,
    position: getInitialPosition(initialPosition),
    size: { width: 400, height: 600 },
  });

  // Chat state
  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  // Voice state
  const [voiceRecording, setVoiceRecording] = useState<VoiceRecording>({
    isRecording: false,
    isProcessing: false,
    duration: 0,
  });

  // Widget interaction state
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastInteraction, setLastInteraction] = useState<Date>(new Date());

  // Refs
  const widgetRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const voiceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const dragRef = useRef<{ isDragging: boolean; offset: { x: number; y: number } }>({
    isDragging: false,
    offset: { x: 0, y: 0 },
  });

  // Initialize widget
  useEffect(() => {
    loadPersistedState();
    initializeWelcomeMessage();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (widgetState.isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, widgetState.isOpen]);

  // Handle outside clicks
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (widgetRef.current && !widgetRef.current.contains(event.target as Node)) {
        if (widgetState.isOpen && !isDragging) {
          // Optionally auto-minimize on outside click
          // setWidgetState(prev => ({ ...prev, isMinimized: true }));
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [widgetState.isOpen, isDragging]);

  // Persist state
  useEffect(() => {
    if (persistState) {
      savePersistedState();
    }
  }, [widgetState, persistState]);

  const loadPersistedState = () => {
    if (!persistState) return;

    try {
      const saved = localStorage.getItem('neonhub-copilot-widget');
      if (saved) {
        const state = JSON.parse(saved);
        setWidgetState(prev => ({ ...prev, ...state }));
      }
    } catch (error) {
      console.error('Failed to load persisted widget state:', error);
    }
  };

  const savePersistedState = () => {
    if (!persistState) return;

    try {
      localStorage.setItem('neonhub-copilot-widget', JSON.stringify(widgetState));
    } catch (error) {
      console.error('Failed to save widget state:', error);
    }
  };

  const initializeWelcomeMessage = () => {
    const welcomeMessage: CopilotMessage = {
      id: 'welcome',
      role: 'assistant',
      content: `Hi! I'm your AI Marketing Copilot 🤖\n\nI can help you with:\n• Generate reports and analytics\n• Analyze campaign performance\n• Create forecasts and insights\n• Manage campaigns\n• Answer questions about your data\n\nJust ask me anything!`,
      timestamp: new Date().toISOString(),
      confidence: 1.0,
      status: 'completed',
    };
    setMessages([welcomeMessage]);
  };

  const toggleWidget = () => {
    setWidgetState(prev => ({
      ...prev,
      isOpen: !prev.isOpen,
      isMinimized: false,
    }));

    if (!widgetState.isOpen) {
      setUnreadCount(0);
      setLastInteraction(new Date());
      // Focus input when opening
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const minimizeWidget = () => {
    setWidgetState(prev => ({ ...prev, isMinimized: !prev.isMinimized }));
  };

  const closeWidget = () => {
    setWidgetState(prev => ({ ...prev, isOpen: false }));
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: CopilotMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date().toISOString(),
      status: 'sent',
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      // Mock AI response - in production would call tRPC endpoint
      await new Promise(resolve => setTimeout(resolve, 1500));

      const response = await generateMockResponse(userMessage.content);
      setMessages(prev => [...prev, response]);

      // Update unread count if widget is not focused
      if (!widgetState.isOpen) {
        setUnreadCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: CopilotMessage = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again.',
        timestamp: new Date().toISOString(),
        status: 'failed',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const generateMockResponse = async (input: string): Promise<CopilotMessage> => {
    const inputLower = input.toLowerCase();

    let content = '';
    let actions: string[] = [];
    let attachments: MessageAttachment[] = [];

    if (inputLower.includes('report') || inputLower.includes('generate')) {
      content = `I'll generate a comprehensive report for you. This will include performance metrics, strategic insights, and recommendations.\n\nWould you like me to proceed with creating the report?`;
      actions = ['Generate Report', 'Customize Format', 'View Analytics'];
      attachments = [
        {
          type: 'report',
          id: 'sample_report',
          title: 'Performance Report',
          preview: 'Key metrics and insights',
        },
      ];
    } else if (inputLower.includes('campaign')) {
      content = `I can help you with campaign management. Here's what I found:\n\n• 12 active campaigns\n• Average ROAS: 3.4x\n• Top performer: Holiday Sale Campaign\n\nWhat would you like me to do?`;
      actions = ['View Details', 'Optimize Budget', 'Create New Campaign'];
    } else if (inputLower.includes('analytics') || inputLower.includes('performance')) {
      content = `Here's your current performance overview:\n\n📊 **Key Metrics:**\n• Revenue: $142K (+18%)\n• ROAS: 3.4x (+12%)\n• Conversions: 1,247 (+8%)\n• Brand Alignment: 91%\n\nPerformance is trending upward!`;
      actions = ['Deep Dive', 'Export Data', 'Set Alerts'];
    } else {
      content = `I understand you're asking about "${input}". I can help you with marketing analytics, campaign management, report generation, and strategic insights.\n\nWhat specific task would you like me to assist with?`;
      actions = ['Show Capabilities', 'View Dashboard', 'Get Help'];
    }

    return {
      id: `resp_${Date.now()}`,
      role: 'assistant',
      content,
      timestamp: new Date().toISOString(),
      confidence: 0.9,
      actions: actions.length > 0 ? actions : undefined,
      attachments: attachments.length > 0 ? attachments : undefined,
      status: 'completed',
    };
  };

  const startVoiceRecording = async () => {
    if (!enableVoice) return;

    try {
      setVoiceRecording({
        isRecording: true,
        isProcessing: false,
        duration: 0,
      });

      voiceTimerRef.current = setInterval(() => {
        setVoiceRecording(prev => ({
          ...prev,
          duration: prev.duration + 1,
        }));
      }, 1000);
    } catch (error) {
      console.error('Failed to start voice recording:', error);
    }
  };

  const stopVoiceRecording = async () => {
    if (voiceTimerRef.current) {
      clearInterval(voiceTimerRef.current);
      voiceTimerRef.current = null;
    }

    setVoiceRecording(prev => ({
      ...prev,
      isRecording: false,
      isProcessing: true,
    }));

    try {
      // Mock voice transcription
      await new Promise(resolve => setTimeout(resolve, 2000));

      const mockTranscript = 'Generate a quarterly performance report';

      setVoiceRecording(prev => ({
        ...prev,
        isProcessing: false,
        transcript: mockTranscript,
        confidence: 0.94,
      }));

      setInputValue(mockTranscript);
    } catch (error) {
      console.error('Voice transcription failed:', error);
      setVoiceRecording(prev => ({
        ...prev,
        isProcessing: false,
      }));
    }
  };

  const executeAction = async (action: string) => {
    console.log(`Executing action: ${action}`);

    // Mock action execution
    const actionMessage: CopilotMessage = {
      id: `action_${Date.now()}`,
      role: 'assistant',
      content: `✅ **${action}** executed successfully!\n\nI've completed the requested action. You can find the results in your dashboard.`,
      timestamp: new Date().toISOString(),
      status: 'completed',
    };

    setMessages(prev => [...prev, actionMessage]);
  };

  // Drag functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!enableDrag) return;

    setIsDragging(true);
    const rect = widgetRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !enableDrag) return;

      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;

      // Keep widget within viewport bounds
      const maxX = window.innerWidth - widgetState.size.width;
      const maxY = window.innerHeight - widgetState.size.height;

      setWidgetState(prev => ({
        ...prev,
        position: {
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY)),
        },
      }));
    },
    [isDragging, dragOffset, widgetState.size, enableDrag]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m`;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div ref={widgetRef} className={`fixed z-50 ${className}`}>
      <AnimatePresence>
        {!widgetState.isOpen ? (
          // Floating Action Button
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="relative"
            style={{
              left: widgetState.position.x,
              top: widgetState.position.y,
            }}
          >
            <Button
              onClick={toggleWidget}
              className="w-16 h-16 rounded-full bg-neon-green hover:bg-neon-green/80 shadow-2xl shadow-neon-green/20 border-2 border-neon-green/30"
              onMouseDown={handleMouseDown}
            >
              <Bot className="w-8 h-8 text-gray-900" />
            </Button>

            {unreadCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold text-white"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </motion.div>
            )}
          </motion.div>
        ) : (
          // Expanded Widget
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            style={{
              left: widgetState.position.x,
              top: widgetState.position.y,
              width: widgetState.size.width,
              height: widgetState.isMinimized ? 'auto' : widgetState.size.height,
            }}
            className="bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-lg shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div
              className="bg-gray-800/50 border-b border-gray-700 p-3 cursor-move flex items-center justify-between"
              onMouseDown={handleMouseDown}
            >
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-neon-green animate-pulse"></div>
                <span className="text-sm font-medium text-gray-200">AI Copilot</span>
                <Badge variant="outline" className="text-xs">
                  Online
                </Badge>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={minimizeWidget}
                  className="p-1 h-6 w-6 text-gray-400 hover:text-gray-200"
                >
                  {widgetState.isMinimized ? (
                    <Maximize2 className="w-3 h-3" />
                  ) : (
                    <Minimize2 className="w-3 h-3" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={closeWidget}
                  className="p-1 h-6 w-6 text-gray-400 hover:text-gray-200"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>

            {!widgetState.isMinimized && (
              <>
                {/* Messages Area */}
                <ScrollArea className="h-96 p-3">
                  <div className="space-y-3">
                    {messages.map(message => (
                      <div key={message.id} className="flex gap-2">
                        <Avatar className="w-6 h-6 flex-shrink-0">
                          {message.role === 'user' ? (
                            <AvatarFallback className="bg-blue-600 text-xs">
                              <User className="w-3 h-3" />
                            </AvatarFallback>
                          ) : (
                            <AvatarFallback className="bg-neon-green/20 text-neon-green text-xs">
                              <Bot className="w-3 h-3" />
                            </AvatarFallback>
                          )}
                        </Avatar>

                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-medium text-gray-300">
                              {message.role === 'user' ? 'You' : 'AI'}
                            </span>
                            <span className="text-gray-500">
                              {formatTimestamp(message.timestamp)}
                            </span>
                            {message.confidence && (
                              <Badge variant="outline" className="text-xs">
                                {(message.confidence * 100).toFixed(0)}%
                              </Badge>
                            )}
                            {message.status && (
                              <div className="flex items-center">
                                {message.status === 'sending' && (
                                  <Loader2 className="w-3 h-3 animate-spin text-blue-400" />
                                )}
                                {message.status === 'completed' && (
                                  <CheckCircle className="w-3 h-3 text-green-400" />
                                )}
                                {message.status === 'failed' && (
                                  <AlertCircle className="w-3 h-3 text-red-400" />
                                )}
                              </div>
                            )}
                          </div>

                          <div className="bg-gray-800/50 rounded-lg p-2 text-sm text-gray-200">
                            <div className="whitespace-pre-wrap">{message.content}</div>

                            {/* Actions */}
                            {message.actions && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {message.actions.map((action, index) => (
                                  <Button
                                    key={index}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => executeAction(action)}
                                    className="text-xs h-6 px-2 border-gray-600 hover:border-neon-green"
                                  >
                                    {action}
                                  </Button>
                                ))}
                              </div>
                            )}

                            {/* Attachments */}
                            {message.attachments && (
                              <div className="mt-2 space-y-1">
                                {message.attachments.map((attachment, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center justify-between bg-gray-700/50 rounded p-2"
                                  >
                                    <div className="flex items-center gap-2">
                                      <Zap className="w-3 h-3 text-neon-green" />
                                      <div>
                                        <div className="text-xs font-medium">
                                          {attachment.title}
                                        </div>
                                        {attachment.preview && (
                                          <div className="text-xs text-gray-400">
                                            {attachment.preview}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <Button variant="ghost" size="sm" className="p-1 h-6 w-6">
                                      <Download className="w-3 h-3" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Typing Indicator */}
                    {isTyping && (
                      <div className="flex gap-2">
                        <Avatar className="w-6 h-6 flex-shrink-0">
                          <AvatarFallback className="bg-neon-green/20 text-neon-green text-xs">
                            <Bot className="w-3 h-3" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="bg-gray-800/50 rounded-lg p-2">
                          <div className="flex items-center gap-1">
                            <div className="flex space-x-1">
                              <div className="w-1 h-1 bg-neon-green rounded-full animate-bounce"></div>
                              <div
                                className="w-1 h-1 bg-neon-green rounded-full animate-bounce"
                                style={{ animationDelay: '0.1s' }}
                              ></div>
                              <div
                                className="w-1 h-1 bg-neon-green rounded-full animate-bounce"
                                style={{ animationDelay: '0.2s' }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-400 ml-2">AI is thinking...</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Voice Recording Status */}
                {(voiceRecording.isRecording || voiceRecording.isProcessing) && (
                  <div className="px-3 pb-2">
                    <div className="bg-neon-green/10 border border-neon-green/30 rounded-lg p-2">
                      <div className="flex items-center gap-2">
                        {voiceRecording.isRecording ? (
                          <>
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                            <span className="text-xs text-red-400">Recording</span>
                            <span className="text-xs text-gray-400">
                              {formatDuration(voiceRecording.duration)}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={stopVoiceRecording}
                              className="ml-auto text-xs h-6 px-2"
                            >
                              Stop
                            </Button>
                          </>
                        ) : (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin text-neon-green" />
                            <span className="text-xs text-neon-green">Processing...</span>
                          </>
                        )}
                      </div>
                      {voiceRecording.transcript && (
                        <div className="mt-1 text-xs text-gray-300 bg-gray-800 rounded p-1">
                          {voiceRecording.transcript}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Input Area */}
                <div className="border-t border-gray-700 p-3">
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Input
                        ref={inputRef}
                        value={inputValue}
                        onChange={e => setInputValue(e.target.value)}
                        onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Ask me anything..."
                        className="text-sm bg-gray-800/50 border-gray-600 focus:border-neon-green"
                        disabled={isLoading}
                      />
                    </div>

                    <div className="flex gap-1">
                      {enableVoice && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={
                            voiceRecording.isRecording ? stopVoiceRecording : startVoiceRecording
                          }
                          className={`p-2 h-8 w-8 ${voiceRecording.isRecording ? 'text-red-400' : 'text-gray-400 hover:text-neon-green'}`}
                          disabled={voiceRecording.isProcessing}
                        >
                          {voiceRecording.isRecording ? (
                            <MicOff className="w-4 h-4" />
                          ) : (
                            <Mic className="w-4 h-4" />
                          )}
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSendMessage}
                        disabled={!inputValue.trim() || isLoading}
                        className="p-2 h-8 w-8 text-gray-400 hover:text-neon-green"
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {['Show analytics', 'Generate report', 'Campaign status', 'Help'].map(
                      (suggestion, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => setInputValue(suggestion)}
                          className="text-xs h-6 px-2 border-gray-600 hover:border-neon-green"
                        >
                          {suggestion}
                        </Button>
                      )
                    )}
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Helper function to get initial position
function getInitialPosition(position: string): { x: number; y: number } {
  const margin = 20;
  const buttonSize = 64; // Size of the floating button

  switch (position) {
    case 'bottom-right':
      return {
        x: window.innerWidth - buttonSize - margin,
        y: window.innerHeight - buttonSize - margin,
      };
    case 'bottom-left':
      return { x: margin, y: window.innerHeight - buttonSize - margin };
    case 'top-right':
      return { x: window.innerWidth - buttonSize - margin, y: margin };
    case 'top-left':
      return { x: margin, y: margin };
    default:
      return {
        x: window.innerWidth - buttonSize - margin,
        y: window.innerHeight - buttonSize - margin,
      };
  }
}

export default CopilotWidget;
