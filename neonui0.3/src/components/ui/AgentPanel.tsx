'use client';

import { ReactNode, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bot, 
  Sparkles, 
  Clock, 
  Zap, 
  Activity, 
  Settings,
  Maximize2,
  Minimize2,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface AgentPanelProps {
  title: string;
  description: string;
  icon: React.ElementType;
  status?: 'idle' | 'running' | 'success' | 'error';
  isLoading?: boolean;
  error?: string;
  children: ReactNode;
  output?: ReactNode;
  onReset?: () => void;
  className?: string;
}

export function AgentPanel({
  title,
  description,
  icon: Icon,
  status = 'idle',
  isLoading = false,
  error,
  children,
  output,
  onReset,
  className = '',
}: AgentPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const statusConfig = {
    idle: { 
      color: 'bg-gray-500', 
      text: 'Idle', 
      icon: Clock,
      pulseColor: 'bg-gray-500/20' 
    },
    running: { 
      color: 'bg-blue-500', 
      text: 'Running', 
      icon: Activity,
      pulseColor: 'bg-blue-500/20' 
    },
    success: { 
      color: 'bg-green-500', 
      text: 'Success', 
      icon: CheckCircle,
      pulseColor: 'bg-green-500/20' 
    },
    error: { 
      color: 'bg-red-500', 
      text: 'Error', 
      icon: XCircle,
      pulseColor: 'bg-red-500/20' 
    },
  };

  const currentStatus = statusConfig[status];
  const StatusIcon = currentStatus.icon;

  return (
    <div className={`w-full max-w-6xl mx-auto ${className}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full"
      >
        {/* Input Panel */}
        <div className="space-y-4">
          {/* Header */}
          <Card className="glass-strong border-blue-500/30 bg-gradient-to-r from-blue-600/10 to-purple-600/10">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30">
                    <Icon className="h-6 w-6 text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-white flex items-center space-x-2">
                      <span>{title}</span>
                      {isLoading && <RefreshCw className="h-4 w-4 animate-spin text-blue-400" />}
                    </CardTitle>
                    <p className="text-sm text-gray-400 mt-1">{description}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {/* Status Indicator */}
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <div className={`w-3 h-3 rounded-full ${currentStatus.color}`} />
                      <div className={`absolute inset-0 w-3 h-3 rounded-full ${currentStatus.pulseColor} animate-ping`} />
                    </div>
                    <span className="text-sm text-gray-300">{currentStatus.text}</span>
                  </div>
                  {onReset && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onReset}
                      className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Error Display */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border-red-500/30 bg-gradient-to-r from-red-600/10 to-pink-600/10">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2 text-red-400">
                      <AlertCircle className="h-5 w-5" />
                      <span className="font-medium">Error</span>
                    </div>
                    <p className="text-sm text-red-300 mt-2">{error}</p>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input Form */}
          <Card className="glass border-gray-700/50 bg-gray-900/20">
            <CardContent className="p-6">
              {children}
            </CardContent>
          </Card>
        </div>

        {/* Output Panel */}
        <div className="space-y-4">
          <Card className="glass-strong border-purple-500/30 bg-gradient-to-r from-purple-600/10 to-pink-600/10">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30">
                    <Sparkles className="h-6 w-6 text-purple-400" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-white">AI Output</CardTitle>
                    <p className="text-sm text-gray-400 mt-1">Generated content appears here</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                >
                  {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
              </div>
            </CardHeader>
          </Card>

          {/* Output Content */}
          <motion.div
            animate={{ height: isExpanded ? 'auto' : '400px' }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <Card className="glass border-gray-700/50 bg-gray-900/20 h-full">
              <CardContent className="p-0 h-full">
                <ScrollArea className="h-full p-6">
                  {output || (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      <div className="text-center">
                        <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-sm">No output yet</p>
                        <p className="text-xs text-gray-500 mt-1">Submit a request to see AI-generated content</p>
                      </div>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

export default AgentPanel; 