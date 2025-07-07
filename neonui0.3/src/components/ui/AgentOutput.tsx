'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Copy, 
  Download, 
  Share2, 
  Star, 
  Eye, 
  EyeOff,
  Code,
  FileText,
  Sparkles,
  CheckCircle,
  Clock,
  Zap
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface AgentOutputProps {
  content: string;
  isLoading?: boolean;
  title?: string;
  metadata?: {
    type?: string;
    tokens?: number;
    executionTime?: number;
    model?: string;
    confidence?: number;
  };
  showTypingAnimation?: boolean;
  onCopy?: (content: string) => void;
  onDownload?: (content: string) => void;
  onShare?: (content: string) => void;
  className?: string;
}

export function AgentOutput({
  content,
  isLoading = false,
  title = 'AI Output',
  metadata,
  showTypingAnimation = true,
  onCopy,
  onDownload,
  onShare,
  className = '',
}: AgentOutputProps) {
  const [displayedContent, setDisplayedContent] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showRawContent, setShowRawContent] = useState(false);
  const [copied, setCopied] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Typing animation effect
  useEffect(() => {
    if (!content || !showTypingAnimation) {
      setDisplayedContent(content);
      return;
    }

    setIsTyping(true);
    setDisplayedContent('');

    const chars = content.split('');
    let currentIndex = 0;

    const typeInterval = setInterval(() => {
      if (currentIndex < chars.length) {
        setDisplayedContent(prev => prev + chars[currentIndex]);
        currentIndex++;
        
        // Auto-scroll to bottom
        if (scrollAreaRef.current) {
          scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
        }
      } else {
        setIsTyping(false);
        clearInterval(typeInterval);
      }
    }, 50); // Typing speed

    return () => clearInterval(typeInterval);
  }, [content, showTypingAnimation]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast.success('Content copied to clipboard!');
      onCopy?.(content);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy content');
    }
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-output-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Content downloaded!');
    onDownload?.(content);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'AI Generated Content',
          text: content,
        });
        onShare?.(content);
      } catch (error) {
        // Fallback to copy
        handleCopy();
      }
    } else {
      // Fallback to copy
      handleCopy();
    }
  };

  const formatContent = (text: string) => {
    // Basic formatting for better readability
    return text
      .split('\n')
      .map((line, index) => (
        <div key={index} className="mb-2">
          {line.startsWith('# ') ? (
            <h1 className="text-xl font-bold text-blue-400 mb-2">{line.substring(2)}</h1>
          ) : line.startsWith('## ') ? (
            <h2 className="text-lg font-semibold text-purple-400 mb-2">{line.substring(3)}</h2>
          ) : line.startsWith('### ') ? (
            <h3 className="text-md font-medium text-cyan-400 mb-1">{line.substring(4)}</h3>
          ) : line.startsWith('- ') ? (
            <div className="flex items-start space-x-2">
              <span className="text-yellow-400 mt-1">•</span>
              <span>{line.substring(2)}</span>
            </div>
          ) : line.startsWith('1. ') || line.match(/^\d+\. /) ? (
            <div className="flex items-start space-x-2">
              <span className="text-green-400 font-medium">{line.match(/^\d+\./)?.[0]}</span>
              <span>{line.replace(/^\d+\. /, '')}</span>
            </div>
          ) : line.trim() === '' ? (
            <div className="h-2" />
          ) : (
            <p className="text-gray-300 leading-relaxed">{line}</p>
          )}
        </div>
      ));
  };

  return (
    <div className={`w-full ${className}`}>
      <Card className="glass border-gray-700/50 bg-gray-900/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30">
                <Sparkles className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-white">{title}</CardTitle>
                {metadata && (
                  <div className="flex items-center space-x-3 mt-1">
                    {metadata.type && (
                      <Badge variant="secondary" className="text-xs">
                        {metadata.type}
                      </Badge>
                    )}
                    {metadata.tokens && (
                      <span className="text-xs text-gray-400">
                        {metadata.tokens} tokens
                      </span>
                    )}
                    {metadata.executionTime && (
                      <span className="text-xs text-gray-400">
                        {metadata.executionTime}ms
                      </span>
                    )}
                    {metadata.confidence && (
                      <span className="text-xs text-gray-400">
                        {(metadata.confidence * 100).toFixed(1)}% confidence
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowRawContent(!showRawContent)}
                className="h-8 w-8 p-0 text-gray-400 hover:text-white"
              >
                {showRawContent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                disabled={!content}
              >
                {copied ? <CheckCircle className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownload}
                className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                disabled={!content}
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                disabled={!content}
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <Separator className="bg-gray-700/50" />
        <CardContent className="p-0">
          <ScrollArea className="h-96 p-6" ref={scrollAreaRef}>
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full mx-auto mb-4"
                  />
                  <p className="text-sm text-gray-400">AI is thinking...</p>
                </div>
              </div>
            ) : content ? (
              <div className="space-y-2">
                {showRawContent ? (
                  <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono bg-gray-800/50 p-4 rounded-lg border border-gray-700/50">
                    {displayedContent}
                  </pre>
                ) : (
                  <div className="text-sm">
                    {formatContent(displayedContent)}
                  </div>
                )}
                {isTyping && (
                  <motion.div
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="inline-block w-2 h-4 bg-blue-400 ml-1"
                  />
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  </motion.div>
                  <p className="text-sm">Waiting for AI response...</p>
                </div>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

export default AgentOutput; 