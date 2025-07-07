"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { 
  Play, 
  Pause, 
  Square, 
  RefreshCw, 
  Clock, 
  DollarSign,
  Zap,
  TrendingUp,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  Eye,
  Download,
  Share,
  Filter,
  Search,
  Calendar
} from 'lucide-react';

// Types
interface ChainExecution {
  id: string;
  chainId: string;
  chainName: string;
  chainType: string;
  executionNumber: number;
  status: 'PENDING' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'TIMEOUT' | 'RETRYING';
  triggerType: string;
  campaignId?: string;
  startedAt: string;
  completedAt?: string;
  executionTime?: number;
  totalCost: number;
  successRate?: number;
  stepCount: number;
  handoffCount: number;
  steps: ChainStep[];
  agentsUsed: string[];
  finalResult?: any;
  errorDetails?: any;
}

interface ChainStep {
  id: string;
  stepNumber: number;
  stepName: string;
  agentType: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'SKIPPED' | 'RETRYING' | 'BLOCKED';
  startedAt?: string;
  completedAt?: string;
  executionTime?: number;
  cost: number;
  confidence?: number;
  qualityScore?: number;
  retryCount: number;
  outputData?: any;
  errorData?: any;
}

interface HandoffData {
  id: string;
  handoffNumber: number;
  fromAgent: string;
  toAgent: string;
  handoffType: string;
  transferredAt: string;
  transferTime?: number;
  dataSize?: number;
  success: boolean;
  qualityScore?: number;
}

interface ChainVisualizerPanelProps {
  className?: string;
}

const STATUS_COLORS = {
  PENDING: 'bg-gray-500',
  RUNNING: 'bg-blue-500',
  PAUSED: 'bg-yellow-500',
  COMPLETED: 'bg-green-500',
  FAILED: 'bg-red-500',
  CANCELLED: 'bg-gray-600',
  TIMEOUT: 'bg-orange-500',
  RETRYING: 'bg-purple-500',
  SKIPPED: 'bg-gray-400',
  BLOCKED: 'bg-red-400'
};

const STATUS_ICONS = {
  PENDING: Clock,
  RUNNING: Loader2,
  PAUSED: Pause,
  COMPLETED: CheckCircle,
  FAILED: XCircle,
  CANCELLED: Square,
  TIMEOUT: AlertTriangle,
  RETRYING: RefreshCw,
  SKIPPED: Clock,
  BLOCKED: AlertTriangle
};

export default function ChainVisualizerPanel({ className }: ChainVisualizerPanelProps) {
  const [executions, setExecutions] = useState<ChainExecution[]>([]);
  const [selectedExecution, setSelectedExecution] = useState<ChainExecution | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [timeRange, setTimeRange] = useState('24h');
  const [showDetails, setShowDetails] = useState(false);

  // Fetch executions
  const fetchExecutions = useCallback(async () => {
    try {
      setLoading(true);
      
      // Calculate time range
      const now = new Date();
      const timeRanges = {
        '1h': new Date(now.getTime() - 60 * 60 * 1000),
        '24h': new Date(now.getTime() - 24 * 60 * 60 * 1000),
        '7d': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        '30d': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      };

      const params = new URLSearchParams({
        limit: '50',
        offset: '0'
      });

      if (filterStatus !== 'all') {
        params.append('status', filterStatus);
      }

      // Mock API call - replace with actual API
      const mockExecutions: ChainExecution[] = [
        {
          id: 'exec_1',
          chainId: 'chain_1',
          chainName: 'Viral Content Creation',
          chainType: 'SEQUENTIAL',
          executionNumber: 1,
          status: 'RUNNING',
          triggerType: 'MANUAL',
          startedAt: new Date(Date.now() - 120000).toISOString(),
          executionTime: 120000,
          totalCost: 0.15,
          stepCount: 3,
          handoffCount: 2,
          steps: [
            {
              id: 'step_1',
              stepNumber: 0,
              stepName: 'Trend Analysis',
              agentType: 'TREND_AGENT',
              status: 'COMPLETED',
              startedAt: new Date(Date.now() - 120000).toISOString(),
              completedAt: new Date(Date.now() - 80000).toISOString(),
              executionTime: 40000,
              cost: 0.05,
              confidence: 0.92,
              qualityScore: 0.88,
              retryCount: 0
            },
            {
              id: 'step_2',
              stepNumber: 1,
              stepName: 'Content Generation',
              agentType: 'CONTENT_AGENT',
              status: 'RUNNING',
              startedAt: new Date(Date.now() - 80000).toISOString(),
              executionTime: 80000,
              cost: 0.08,
              retryCount: 0
            },
            {
              id: 'step_3',
              stepNumber: 2,
              stepName: 'Social Optimization',
              agentType: 'SOCIAL_AGENT',
              status: 'PENDING',
              cost: 0,
              retryCount: 0
            }
          ],
          agentsUsed: ['TREND_AGENT', 'CONTENT_AGENT', 'SOCIAL_AGENT']
        },
        {
          id: 'exec_2',
          chainId: 'chain_2',
          chainName: 'Lead Nurturing Campaign',
          chainType: 'SEQUENTIAL',
          executionNumber: 2,
          status: 'COMPLETED',
          triggerType: 'SCHEDULED',
          startedAt: new Date(Date.now() - 600000).toISOString(),
          completedAt: new Date(Date.now() - 300000).toISOString(),
          executionTime: 300000,
          totalCost: 0.25,
          successRate: 1.0,
          stepCount: 4,
          handoffCount: 3,
          steps: [
            {
              id: 'step_4',
              stepNumber: 0,
              stepName: 'Market Research',
              agentType: 'TREND_AGENT',
              status: 'COMPLETED',
              startedAt: new Date(Date.now() - 600000).toISOString(),
              completedAt: new Date(Date.now() - 540000).toISOString(),
              executionTime: 60000,
              cost: 0.04,
              confidence: 0.85,
              qualityScore: 0.90,
              retryCount: 0
            },
            {
              id: 'step_5',
              stepNumber: 1,
              stepName: 'Educational Content',
              agentType: 'CONTENT_AGENT',
              status: 'COMPLETED',
              startedAt: new Date(Date.now() - 540000).toISOString(),
              completedAt: new Date(Date.now() - 420000).toISOString(),
              executionTime: 120000,
              cost: 0.08,
              confidence: 0.88,
              qualityScore: 0.92,
              retryCount: 0
            },
            {
              id: 'step_6',
              stepNumber: 2,
              stepName: 'Email Sequence',
              agentType: 'EMAIL_AGENT',
              status: 'COMPLETED',
              startedAt: new Date(Date.now() - 420000).toISOString(),
              completedAt: new Date(Date.now() - 360000).toISOString(),
              executionTime: 60000,
              cost: 0.06,
              confidence: 0.91,
              qualityScore: 0.89,
              retryCount: 0
            },
            {
              id: 'step_7',
              stepNumber: 3,
              stepName: 'Follow-up Support',
              agentType: 'SUPPORT_AGENT',
              status: 'COMPLETED',
              startedAt: new Date(Date.now() - 360000).toISOString(),
              completedAt: new Date(Date.now() - 300000).toISOString(),
              executionTime: 60000,
              cost: 0.07,
              confidence: 0.94,
              qualityScore: 0.93,
              retryCount: 0
            }
          ],
          agentsUsed: ['TREND_AGENT', 'CONTENT_AGENT', 'EMAIL_AGENT', 'SUPPORT_AGENT']
        }
      ];

      setExecutions(mockExecutions);
      
      if (!selectedExecution && mockExecutions.length > 0) {
        setSelectedExecution(mockExecutions[0]);
      }
      
    } catch (error) {
      console.error('Failed to fetch executions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch chain executions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [filterStatus, timeRange, selectedExecution]);

  // Auto-refresh effect
  useEffect(() => {
    fetchExecutions();

    if (autoRefresh) {
      const interval = setInterval(fetchExecutions, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [fetchExecutions, autoRefresh]);

  // Filter executions
  const filteredExecutions = useMemo(() => {
    return executions.filter(execution => {
      if (searchTerm && !execution.chainName.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      if (filterStatus !== 'all' && execution.status !== filterStatus) {
        return false;
      }
      return true;
    });
  }, [executions, searchTerm, filterStatus]);

  // Calculate execution progress
  const calculateProgress = useCallback((execution: ChainExecution) => {
    const completedSteps = execution.steps.filter(step => step.status === 'COMPLETED').length;
    return (completedSteps / execution.stepCount) * 100;
  }, []);

  // Format duration
  const formatDuration = useCallback((ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }, []);

  // Get status icon
  const getStatusIcon = useCallback((status: string) => {
    const IconComponent = STATUS_ICONS[status as keyof typeof STATUS_ICONS] || Clock;
    return IconComponent;
  }, []);

  // Get agent color
  const getAgentColor = useCallback((agentType: string) => {
    const colors = {
      CONTENT_AGENT: 'bg-blue-500',
      TREND_AGENT: 'bg-green-500',
      SEO_AGENT: 'bg-purple-500',
      SOCIAL_AGENT: 'bg-pink-500',
      EMAIL_AGENT: 'bg-orange-500',
      SUPPORT_AGENT: 'bg-red-500'
    };
    return colors[agentType as keyof typeof colors] || 'bg-gray-500';
  }, []);

  // Render execution timeline
  const renderExecutionTimeline = useCallback((execution: ChainExecution) => {
    return (
      <div className="space-y-4">
        {execution.steps.map((step, index) => {
          const StatusIcon = getStatusIcon(step.status);
          const isRunning = step.status === 'RUNNING';
          
          return (
            <div key={step.id} className="flex items-center gap-4">
              {/* Timeline connector */}
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${STATUS_COLORS[step.status] || 'bg-gray-500'}`}>
                  <StatusIcon 
                    className={`h-5 w-5 text-white ${isRunning ? 'animate-spin' : ''}`} 
                  />
                </div>
                {index < execution.steps.length - 1 && (
                  <div className="w-0.5 h-8 bg-gray-300 mt-2"></div>
                )}
              </div>

              {/* Step details */}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{step.stepName}</h4>
                    <p className="text-sm text-gray-600">{step.agentType.replace('_AGENT', '').toLowerCase()}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className={STATUS_COLORS[step.status]}>
                      {step.status}
                    </Badge>
                    {step.executionTime && (
                      <p className="text-sm text-gray-600 mt-1">
                        {formatDuration(step.executionTime)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Step metrics */}
                {(step.confidence || step.qualityScore || step.cost > 0) && (
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    {step.confidence && (
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <span>{(step.confidence * 100).toFixed(0)}% confidence</span>
                      </div>
                    )}
                    {step.qualityScore && (
                      <div className="flex items-center gap-1">
                        <Zap className="h-4 w-4 text-blue-600" />
                        <span>{(step.qualityScore * 100).toFixed(0)}% quality</span>
                      </div>
                    )}
                    {step.cost > 0 && (
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-orange-600" />
                        <span>${step.cost.toFixed(3)}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Error details */}
                {step.status === 'FAILED' && step.errorData && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                    <p className="text-sm text-red-800">{step.errorData.message}</p>
                  </div>
                )}

                {/* Retry indicator */}
                {step.retryCount > 0 && (
                  <div className="mt-2">
                    <Badge variant="outline" className="text-xs">
                      {step.retryCount} retries
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }, [getStatusIcon, formatDuration]);

  // Render execution list
  const renderExecutionList = useCallback(() => {
    return (
      <ScrollArea className="h-96">
        <div className="space-y-2">
          {filteredExecutions.map(execution => {
            const progress = calculateProgress(execution);
            const StatusIcon = getStatusIcon(execution.status);
            const isSelected = selectedExecution?.id === execution.id;
            const isRunning = execution.status === 'RUNNING';

            return (
              <Card 
                key={execution.id} 
                className={`cursor-pointer transition-all ${isSelected ? 'ring-2 ring-blue-500' : 'hover:bg-gray-50'}`}
                onClick={() => setSelectedExecution(execution)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${STATUS_COLORS[execution.status]}`}>
                        <StatusIcon 
                          className={`h-4 w-4 text-white ${isRunning ? 'animate-spin' : ''}`} 
                        />
                      </div>
                      <div>
                        <h4 className="font-medium">{execution.chainName}</h4>
                        <p className="text-sm text-gray-600">#{execution.executionNumber}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={STATUS_COLORS[execution.status]}>
                      {execution.status}
                    </Badge>
                  </div>

                  {/* Progress bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progress</span>
                      <span>{progress.toFixed(0)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  {/* Execution metrics */}
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-gray-600" />
                      <span>{execution.executionTime ? formatDuration(execution.executionTime) : 'Running...'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4 text-gray-600" />
                      <span>${execution.totalCost.toFixed(3)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Activity className="h-4 w-4 text-gray-600" />
                      <span>{execution.stepCount} steps</span>
                    </div>
                  </div>

                  {/* Agent chips */}
                  <div className="flex flex-wrap gap-1 mt-3">
                    {execution.agentsUsed.map(agent => (
                      <Badge 
                        key={agent} 
                        variant="secondary" 
                        className={`text-xs ${getAgentColor(agent)} text-white`}
                      >
                        {agent.replace('_AGENT', '')}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </ScrollArea>
    );
  }, [filteredExecutions, selectedExecution, calculateProgress, getStatusIcon, formatDuration, getAgentColor]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Chain Execution Monitor</h2>
          <p className="text-gray-600">Real-time monitoring of agent chain executions</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchExecutions}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search chains..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-4 py-2 border rounded-md w-full"
                />
              </div>
            </div>
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="RUNNING">Running</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
              </SelectContent>
            </Select>

            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">Last Hour</SelectItem>
                <SelectItem value="24h">Last 24h</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Execution List */}
        <Card>
          <CardHeader>
            <CardTitle>Active Executions</CardTitle>
            <CardDescription>
              {filteredExecutions.length} executions found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : filteredExecutions.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No executions found
              </div>
            ) : (
              renderExecutionList()
            )}
          </CardContent>
        </Card>

        {/* Execution Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Execution Details
              {selectedExecution && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDetails(true)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Full Details
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedExecution ? (
              <Tabs defaultValue="timeline" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="timeline">Timeline</TabsTrigger>
                  <TabsTrigger value="metrics">Metrics</TabsTrigger>
                  <TabsTrigger value="handoffs">Handoffs</TabsTrigger>
                </TabsList>
                
                <TabsContent value="timeline" className="mt-4">
                  <ScrollArea className="h-96">
                    {renderExecutionTimeline(selectedExecution)}
                  </ScrollArea>
                </TabsContent>
                
                <TabsContent value="metrics" className="mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <Clock className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="text-sm text-gray-600">Execution Time</p>
                            <p className="font-semibold">
                              {selectedExecution.executionTime ? 
                                formatDuration(selectedExecution.executionTime) : 
                                'Running...'
                              }
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-5 w-5 text-green-600" />
                          <div>
                            <p className="text-sm text-gray-600">Total Cost</p>
                            <p className="font-semibold">${selectedExecution.totalCost.toFixed(3)}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-5 w-5 text-purple-600" />
                          <div>
                            <p className="text-sm text-gray-600">Success Rate</p>
                            <p className="font-semibold">
                              {selectedExecution.successRate ? 
                                `${(selectedExecution.successRate * 100).toFixed(0)}%` : 
                                'In Progress'
                              }
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <Activity className="h-5 w-5 text-orange-600" />
                          <div>
                            <p className="text-sm text-gray-600">Steps Progress</p>
                            <p className="font-semibold">
                              {selectedExecution.steps.filter(s => s.status === 'COMPLETED').length} / {selectedExecution.stepCount}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {/* Step Performance Chart */}
                  <Card className="mt-4">
                    <CardHeader>
                      <CardTitle className="text-lg">Step Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {selectedExecution.steps.map(step => (
                          <div key={step.id} className="flex items-center justify-between">
                            <span className="text-sm">{step.stepName}</span>
                            <div className="flex items-center gap-2">
                              {step.executionTime && (
                                <span className="text-sm text-gray-600">
                                  {formatDuration(step.executionTime)}
                                </span>
                              )}
                              {step.cost > 0 && (
                                <Badge variant="outline">${step.cost.toFixed(3)}</Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="handoffs" className="mt-4">
                  <div className="space-y-4">
                    <div className="text-center text-gray-500 py-8">
                      Handoff visualization coming soon
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="text-center text-gray-500 py-8">
                Select an execution to view details
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Full Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Execution Details: {selectedExecution?.chainName}
            </DialogTitle>
          </DialogHeader>
          
          {selectedExecution && (
            <div className="space-y-6">
              {/* Execution Info */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Execution Info</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">ID:</span>
                      <span className="font-mono">{selectedExecution.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Number:</span>
                      <span>#{selectedExecution.executionNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Trigger:</span>
                      <span>{selectedExecution.triggerType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Started:</span>
                      <span>{new Date(selectedExecution.startedAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Performance</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Duration:</span>
                      <span>
                        {selectedExecution.executionTime ? 
                          formatDuration(selectedExecution.executionTime) : 
                          'Running...'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cost:</span>
                      <span>${selectedExecution.totalCost.toFixed(3)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Steps:</span>
                      <span>{selectedExecution.stepCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Handoffs:</span>
                      <span>{selectedExecution.handoffCount}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Agents Used</h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedExecution.agentsUsed.map(agent => (
                      <Badge 
                        key={agent} 
                        variant="secondary" 
                        className={`text-xs ${getAgentColor(agent)} text-white`}
                      >
                        {agent.replace('_AGENT', '')}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Detailed Timeline */}
              <div>
                <h4 className="font-medium mb-4">Detailed Timeline</h4>
                {renderExecutionTimeline(selectedExecution)}
              </div>

              {/* Final Results */}
              {selectedExecution.finalResult && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-2">Final Results</h4>
                    <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                      {JSON.stringify(selectedExecution.finalResult, null, 2)}
                    </pre>
                  </div>
                </>
              )}

              {/* Error Details */}
              {selectedExecution.errorDetails && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-2 text-red-600">Error Details</h4>
                    <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                      <pre className="text-sm text-red-800 overflow-x-auto">
                        {JSON.stringify(selectedExecution.errorDetails, null, 2)}
                      </pre>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 