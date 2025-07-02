'use client';

import { useState } from 'react';
import {
  PlayIcon,
  PauseIcon,
  CpuChipIcon,
  BoltIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

interface AgentRunPanelProps {
  agentName: string;
  agentStatus: 'active' | 'paused' | 'inactive' | 'running';
  onRun: () => Promise<void>;
  onPause?: () => Promise<void>;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export default function AgentRunPanel({
  agentName,
  agentStatus,
  onRun,
  onPause,
  disabled = false,
  className = '',
  children,
}: AgentRunPanelProps): JSX.Element {
  const [isLoading, setIsLoading] = useState(false);
  const [lastRunResult, setLastRunResult] = useState<'success' | 'error' | null>(null);

  const handleRun = async () => {
    if (disabled || isLoading) return;
    
    setIsLoading(true);
    setLastRunResult(null);
    
    try {
      await onRun();
      setLastRunResult('success');
      setTimeout(() => setLastRunResult(null), 3000);
    } catch (error) {
      setLastRunResult('error');
      setTimeout(() => setLastRunResult(null), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePause = async () => {
    if (!onPause || disabled || isLoading) return;
    
    setIsLoading(true);
    try {
      await onPause();
    } catch (error) {
      console.error('Failed to pause agent:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = () => {
    switch (agentStatus) {
      case 'active':
        return 'text-neon-green';
      case 'running':
        return 'text-neon-blue';
      case 'paused':
        return 'text-yellow-400';
      case 'inactive':
        return 'text-gray-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusIcon = () => {
    switch (agentStatus) {
      case 'active':
        return <CheckCircleIcon className="h-5 w-5" />;
      case 'running':
        return <CpuChipIcon className="h-5 w-5 animate-pulse" />;
      case 'paused':
        return <PauseIcon className="h-5 w-5" />;
      case 'inactive':
        return <ExclamationTriangleIcon className="h-5 w-5" />;
      default:
        return <CpuChipIcon className="h-5 w-5" />;
    }
  };

  return (
    <div className={`glass-strong p-6 rounded-2xl ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-r from-neon-blue to-neon-purple rounded-xl flex items-center justify-center">
            <CpuChipIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-primary">{agentName}</h3>
            <div className={`flex items-center space-x-2 text-sm ${getStatusColor()}`}>
              {getStatusIcon()}
              <span className="capitalize">{agentStatus}</span>
            </div>
          </div>
        </div>

        {/* Status Indicator */}
        {lastRunResult && (
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold ${
            lastRunResult === 'success' 
              ? 'bg-neon-green/20 text-neon-green' 
              : 'bg-neon-pink/20 text-neon-pink'
          }`}>
            {lastRunResult === 'success' ? (
              <CheckCircleIcon className="h-4 w-4" />
            ) : (
              <ExclamationTriangleIcon className="h-4 w-4" />
            )}
            <span>{lastRunResult === 'success' ? 'Success' : 'Error'}</span>
          </div>
        )}
      </div>

      {/* Content */}
      {children && (
        <div className="mb-6">
          {children}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center space-x-3">
        <button
          onClick={handleRun}
          disabled={disabled || isLoading || agentStatus === 'running'}
          className={`flex-1 flex items-center justify-center space-x-2 py-3 px-6 rounded-xl font-semibold transition-all duration-300 ${
            disabled || isLoading || agentStatus === 'running'
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'btn-neon hover:scale-105'
          }`}
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Running...</span>
            </>
          ) : (
            <>
              <PlayIcon className="h-5 w-5" />
              <span>Run Agent</span>
            </>
          )}
        </button>

        {onPause && agentStatus === 'running' && (
          <button
            onClick={handlePause}
            disabled={disabled || isLoading}
            className="p-3 text-secondary hover:text-neon-pink transition-colors border border-gray-600 rounded-xl hover:border-neon-pink"
          >
            <PauseIcon className="h-5 w-5" />
          </button>
        )}

        <button
          className="p-3 text-secondary hover:text-neon-blue transition-colors border border-gray-600 rounded-xl hover:border-neon-blue"
          title="View metrics"
        >
          <ChartBarIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
} 