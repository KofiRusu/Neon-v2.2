'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  Clock,
  Settings,
  Lightbulb,
  BarChart3,
  Activity,
  Zap,
  Gauge,
  RefreshCw,
  Eye,
  EyeOff,
  Star,
  Filter,
  Calendar,
  Download,
  Play,
  Pause,
  RotateCcw,
  ChevronRight,
  ChevronDown,
  Info,
  ExternalLink
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { toast } from 'sonner';

// Type definitions
interface LearningInsight {
  id: string;
  agentType: string;
  metricType: string;
  metricSubtype?: string;
  category?: string;
  insightType: string;
  title: string;
  description: string;
  recommendation: string;
  confidence: number;
  priority: string;
  impact: string;
  supportingData: Record<string, any>;
  evidenceCount: number;
  sampleSize: number;
  predictedImprovement?: number;
  actualImprovement?: number;
  status: string;
  implementedAt?: string;
  validatedAt?: string;
  archivedAt?: string;
  suggestedActions: string[];
  userFeedback?: string;
  userRating?: number;
  dismissed: boolean;
  dismissedReason?: string;
  createdAt: string;
  updatedAt: string;
}

interface MetricWeight {
  id: string;
  agentType: string;
  metricType: string;
  metricSubtype?: string;
  category?: string;
  weight: number;
  baselineWeight: number;
  threshold?: number;
  baselineThreshold?: number;
  confidence: number;
  reliability: number;
  sampleSize: number;
  performanceScore: number;
  successRate: number;
  adjustmentCount: number;
  lastAdjustment?: string;
  totalImprovement: number;
  isActive: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}

interface LearningLog {
  id: string;
  agentType: string;
  metricType: string;
  metricSubtype?: string;
  category?: string;
  triggerType: string;
  learningType: string;
  adjustmentType: string;
  previousValue: number;
  newValue: number;
  confidence: number;
  sampleSize: number;
  expectedImprovement?: number;
  actualImprovement?: number;
  validated: boolean;
  rolledBack: boolean;
  createdAt: string;
  updatedAt: string;
}

interface LearningStats {
  timeRange: string;
  summary: {
    totalLearningEvents: number;
    successfulLearningEvents: number;
    totalAdjustments: number;
    totalInsights: number;
    implementedInsights: number;
    learningSuccessRate: number;
    insightImplementationRate: number;
    averageLearningRate: number;
    averageConfidence: number;
  };
  breakdowns: {
    learningTypes: Record<string, number>;
    insightTypes: Record<string, number>;
  };
  activeWeights: number;
  recentActivity: {
    lastHour: number;
    last6Hours: number;
  };
}

interface FeedbackInsightsPanelProps {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export default function FeedbackInsightsPanel({ 
  autoRefresh = true, 
  refreshInterval = 30000 
}: FeedbackInsightsPanelProps) {
  // State management
  const [insights, setInsights] = useState<LearningInsight[]>([]);
  const [metricWeights, setMetricWeights] = useState<MetricWeight[]>([]);
  const [learningLogs, setLearningLogs] = useState<LearningLog[]>([]);
  const [learningStats, setLearningStats] = useState<LearningStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');
  const [selectedAgentType, setSelectedAgentType] = useState<string>('all');
  const [selectedTab, setSelectedTab] = useState('overview');
  const [showDismissed, setShowDismissed] = useState(false);
  const [expandedInsights, setExpandedInsights] = useState<Set<string>>(new Set());
  const [processingAction, setProcessingAction] = useState<string | null>(null);

  // Filters
  const [insightFilters, setInsightFilters] = useState({
    priority: 'all',
    status: 'all',
    insightType: 'all'
  });

  // Data fetching
  const fetchLearningData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch all learning data in parallel
      const [
        insightsResponse,
        weightsResponse,
        logsResponse,
        statsResponse
      ] = await Promise.all([
        fetch('/api/trpc/learning.getLearningInsights', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agentType: selectedAgentType !== 'all' ? selectedAgentType : undefined,
            dismissed: showDismissed,
            ...insightFilters
          })
        }),
        fetch('/api/trpc/learning.getMetricWeights', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agentType: selectedAgentType !== 'all' ? selectedAgentType : undefined,
            isActive: true,
            limit: 50
          })
        }),
        fetch('/api/trpc/learning.getLearningLogs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agentType: selectedAgentType !== 'all' ? selectedAgentType : undefined,
            limit: 100
          })
        }),
        fetch('/api/trpc/learning.getLearningStats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agentType: selectedAgentType !== 'all' ? selectedAgentType : undefined,
            timeRange: selectedTimeRange
          })
        })
      ]);

      const [insightsData, weightsData, logsData, statsData] = await Promise.all([
        insightsResponse.json(),
        weightsResponse.json(),
        logsResponse.json(),
        statsResponse.json()
      ]);

      setInsights(insightsData.result?.data?.insights || []);
      setMetricWeights(weightsData.result?.data?.weights || []);
      setLearningLogs(logsData.result?.data?.logs || []);
      setLearningStats(statsData.result?.data || null);

    } catch (err) {
      setError('Failed to fetch learning data');
      console.error('Error fetching learning data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-refresh effect
  useEffect(() => {
    fetchLearningData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchLearningData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [selectedTimeRange, selectedAgentType, showDismissed, insightFilters, autoRefresh, refreshInterval]);

  // Handle insight actions
  const handleInsightAction = async (insightId: string, action: string, data?: any) => {
    try {
      setProcessingAction(insightId);
      
      const response = await fetch('/api/trpc/learning.updateLearningInsight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: insightId,
          ...data
        })
      });
      
      const result = await response.json();
      
      if (result.result?.data?.success) {
        toast.success(`Insight ${action} successfully`);
        await fetchLearningData();
      } else {
        toast.error(`Failed to ${action} insight`);
      }
    } catch (err) {
      toast.error(`Error ${action} insight`);
      console.error(`Error ${action} insight:`, err);
    } finally {
      setProcessingAction(null);
    }
  };

  // Run batch learning
  const handleRunBatchLearning = async () => {
    try {
      setProcessingAction('batch-learning');
      
      const response = await fetch('/api/trpc/learning.processBatchLearning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentType: selectedAgentType !== 'all' ? selectedAgentType : undefined,
          timeWindow: 24
        })
      });
      
      const result = await response.json();
      
      if (result.result?.data?.success) {
        toast.success('Batch learning completed successfully');
        await fetchLearningData();
      } else {
        toast.error('Failed to run batch learning');
      }
    } catch (err) {
      toast.error('Error running batch learning');
      console.error('Error running batch learning:', err);
    } finally {
      setProcessingAction(null);
    }
  };

  // Toggle insight expansion
  const toggleInsightExpansion = (insightId: string) => {
    const newExpanded = new Set(expandedInsights);
    if (newExpanded.has(insightId)) {
      newExpanded.delete(insightId);
    } else {
      newExpanded.add(insightId);
    }
    setExpandedInsights(newExpanded);
  };

  // Get priority badge color
  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgent': return 'bg-red-500';
      case 'critical': return 'bg-red-400';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'implemented': return 'bg-green-500';
      case 'validated': return 'bg-blue-500';
      case 'approved': return 'bg-purple-500';
      case 'pending': return 'bg-yellow-500';
      case 'rejected': return 'bg-red-500';
      case 'archived': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  // Get insight type icon
  const getInsightTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'performance_anomaly': return <TrendingUp className="w-4 h-4" />;
      case 'threshold_optimization': return <Target className="w-4 h-4" />;
      case 'weight_adjustment': return <Gauge className="w-4 h-4" />;
      case 'pattern_discovery': return <Brain className="w-4 h-4" />;
      case 'correlation_finding': return <Activity className="w-4 h-4" />;
      case 'strategy_recommendation': return <Lightbulb className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <RefreshCw className="w-6 h-6 animate-spin" />
          <span>Loading learning insights...</span>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <Alert className="m-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  const filteredInsights = insights.filter(insight => {
    if (insightFilters.priority !== 'all' && insight.priority !== insightFilters.priority) return false;
    if (insightFilters.status !== 'all' && insight.status !== insightFilters.status) return false;
    if (insightFilters.insightType !== 'all' && insight.insightType !== insightFilters.insightType) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Brain className="w-6 h-6 text-purple-600" />
          <h2 className="text-2xl font-bold">AI Feedback Loop & Learning</h2>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRunBatchLearning}
            disabled={processingAction === 'batch-learning'}
          >
            {processingAction === 'batch-learning' ? (
              <RefreshCw className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Play className="w-4 h-4 mr-2" />
            )}
            Run Batch Learning
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLearningData}
            disabled={isLoading}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center space-x-2">
          <Label htmlFor="timeRange">Time Range:</Label>
          <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="6h">Last 6 Hours</SelectItem>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Label htmlFor="agentType">Agent Type:</Label>
          <Select value={selectedAgentType} onValueChange={setSelectedAgentType}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Agents</SelectItem>
              <SelectItem value="CONTENT_AGENT">Content Agent</SelectItem>
              <SelectItem value="EMAIL_AGENT">Email Agent</SelectItem>
              <SelectItem value="SOCIAL_AGENT">Social Agent</SelectItem>
              <SelectItem value="TREND_AGENT">Trend Agent</SelectItem>
              <SelectItem value="SUPPORT_AGENT">Support Agent</SelectItem>
              <SelectItem value="SEO_AGENT">SEO Agent</SelectItem>
              <SelectItem value="SYSTEM_AGENT">System Agent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="showDismissed"
            checked={showDismissed}
            onCheckedChange={setShowDismissed}
          />
          <Label htmlFor="showDismissed">Show Dismissed</Label>
        </div>
      </div>

      {/* Overview Stats */}
      {learningStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Learning Events</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{learningStats.summary.totalLearningEvents}</div>
              <p className="text-xs text-muted-foreground">
                {learningStats.summary.successfulLearningEvents} successful
              </p>
              <Progress 
                value={learningStats.summary.learningSuccessRate * 100} 
                className="mt-2"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Adjustments</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{learningStats.summary.totalAdjustments}</div>
              <p className="text-xs text-muted-foreground">
                Active weights: {learningStats.activeWeights}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Insights</CardTitle>
              <Lightbulb className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{learningStats.summary.totalInsights}</div>
              <p className="text-xs text-muted-foreground">
                {learningStats.summary.implementedInsights} implemented
              </p>
              <Progress 
                value={learningStats.summary.insightImplementationRate * 100} 
                className="mt-2"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Confidence</CardTitle>
              <Gauge className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(learningStats.summary.averageConfidence * 100).toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Avg learning rate: {(learningStats.summary.averageLearningRate * 100).toFixed(1)}%
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="weights">Metric Weights</TabsTrigger>
          <TabsTrigger value="logs">Learning Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Learning Types Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Learning Types</CardTitle>
                <CardDescription>Distribution of learning activities</CardDescription>
              </CardHeader>
              <CardContent>
                {learningStats?.breakdowns.learningTypes && (
                  <div className="space-y-3">
                    {Object.entries(learningStats.breakdowns.learningTypes).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{type.replace('_', ' ')}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ 
                                width: `${(count / Math.max(...Object.values(learningStats.breakdowns.learningTypes))) * 100}%` 
                              }}
                            />
                          </div>
                          <span className="text-sm text-gray-600">{count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Insight Types Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Insight Types</CardTitle>
                <CardDescription>Types of insights generated</CardDescription>
              </CardHeader>
              <CardContent>
                {learningStats?.breakdowns.insightTypes && (
                  <div className="space-y-3">
                    {Object.entries(learningStats.breakdowns.insightTypes).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{type.replace('_', ' ')}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-purple-500 h-2 rounded-full"
                              style={{ 
                                width: `${(count / Math.max(...Object.values(learningStats.breakdowns.insightTypes))) * 100}%` 
                              }}
                            />
                          </div>
                          <span className="text-sm text-gray-600">{count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest learning events and adjustments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {learningLogs.slice(0, 5).map((log) => (
                  <div key={log.id} className="flex items-center justify-between py-2 border-b">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      <div>
                        <div className="font-medium text-sm">
                          {log.agentType} - {log.metricType}
                        </div>
                        <div className="text-xs text-gray-600">
                          {log.learningType} - {log.adjustmentType}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {log.previousValue.toFixed(3)} → {log.newValue.toFixed(3)}
                      </div>
                      <div className="text-xs text-gray-600">
                        {new Date(log.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          {/* Insight Filters */}
          <div className="flex flex-wrap items-center gap-4">
            <Select 
              value={insightFilters.priority} 
              onValueChange={(value) => setInsightFilters({...insightFilters, priority: value})}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="URGENT">Urgent</SelectItem>
                <SelectItem value="CRITICAL">Critical</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
              </SelectContent>
            </Select>

            <Select 
              value={insightFilters.status} 
              onValueChange={(value) => setInsightFilters({...insightFilters, status: value})}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="REVIEWED">Reviewed</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="IMPLEMENTED">Implemented</SelectItem>
                <SelectItem value="VALIDATED">Validated</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <Select 
              value={insightFilters.insightType} 
              onValueChange={(value) => setInsightFilters({...insightFilters, insightType: value})}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Insight Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="PERFORMANCE_ANOMALY">Performance Anomaly</SelectItem>
                <SelectItem value="THRESHOLD_OPTIMIZATION">Threshold Optimization</SelectItem>
                <SelectItem value="WEIGHT_ADJUSTMENT">Weight Adjustment</SelectItem>
                <SelectItem value="PATTERN_DISCOVERY">Pattern Discovery</SelectItem>
                <SelectItem value="CORRELATION_FINDING">Correlation Finding</SelectItem>
                <SelectItem value="STRATEGY_RECOMMENDATION">Strategy Recommendation</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Insights List */}
          <div className="space-y-4">
            {filteredInsights.map((insight) => (
              <Card key={insight.id} className="transition-all hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      {getInsightTypeIcon(insight.insightType)}
                      <div>
                        <CardTitle className="text-lg">{insight.title}</CardTitle>
                        <CardDescription className="mt-1">
                          {insight.agentType} - {insight.metricType}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getPriorityColor(insight.priority)}>
                        {insight.priority}
                      </Badge>
                      <Badge className={getStatusColor(insight.status)}>
                        {insight.status}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleInsightExpansion(insight.id)}
                      >
                        {expandedInsights.has(insight.id) ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm">{insight.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <Gauge className="w-4 h-4 text-gray-500" />
                          <span className="text-sm">
                            Confidence: {(insight.confidence * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <BarChart3 className="w-4 h-4 text-gray-500" />
                          <span className="text-sm">
                            Evidence: {insight.evidenceCount}
                          </span>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(insight.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    {expandedInsights.has(insight.id) && (
                      <div className="pt-3 border-t space-y-3">
                        <div>
                          <h4 className="font-medium mb-2">Recommendation:</h4>
                          <p className="text-sm text-gray-700">{insight.recommendation}</p>
                        </div>
                        
                        {insight.suggestedActions.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2">Suggested Actions:</h4>
                            <div className="flex flex-wrap gap-2">
                              {insight.suggestedActions.map((action, index) => (
                                <Badge key={index} variant="outline">
                                  {action.replace('_', ' ')}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {insight.predictedImprovement && (
                          <div>
                            <h4 className="font-medium mb-2">Predicted Improvement:</h4>
                            <p className="text-sm text-green-600">
                              +{(insight.predictedImprovement * 100).toFixed(1)}%
                            </p>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between pt-3">
                          <div className="flex items-center space-x-2">
                            {insight.status === 'PENDING' && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleInsightAction(insight.id, 'approve', { status: 'APPROVED' })}
                                  disabled={processingAction === insight.id}
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleInsightAction(insight.id, 'reject', { status: 'REJECTED' })}
                                  disabled={processingAction === insight.id}
                                >
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}
                            {insight.status === 'APPROVED' && (
                              <Button
                                size="sm"
                                onClick={() => handleInsightAction(insight.id, 'implement', { status: 'IMPLEMENTED' })}
                                disabled={processingAction === insight.id}
                              >
                                <Play className="w-4 h-4 mr-1" />
                                Implement
                              </Button>
                            )}
                            {!insight.dismissed && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleInsightAction(insight.id, 'dismiss', { dismissed: true })}
                                disabled={processingAction === insight.id}
                              >
                                <EyeOff className="w-4 h-4 mr-1" />
                                Dismiss
                              </Button>
                            )}
                          </div>
                          
                          {insight.userRating && (
                            <div className="flex items-center space-x-1">
                              <Star className="w-4 h-4 text-yellow-500" />
                              <span className="text-sm">{insight.userRating}/5</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="weights" className="space-y-4">
          {/* Metric Weights Table */}
          <Card>
            <CardHeader>
              <CardTitle>Metric Weights</CardTitle>
              <CardDescription>Current weights and performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metricWeights.map((weight) => (
                  <div key={weight.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">
                          {weight.agentType} - {weight.metricType}
                        </div>
                        <div className="text-sm text-gray-600">
                          {weight.metricSubtype && `${weight.metricSubtype} - `}
                          {weight.category}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          Weight: {weight.weight.toFixed(3)}
                        </div>
                        <div className="text-sm text-gray-600">
                          v{weight.version}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <div className="text-xs text-gray-500">Performance</div>
                        <div className="font-medium">{weight.performanceScore.toFixed(3)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Success Rate</div>
                        <div className="font-medium">{(weight.successRate * 100).toFixed(1)}%</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Confidence</div>
                        <div className="font-medium">{(weight.confidence * 100).toFixed(1)}%</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Adjustments</div>
                        <div className="font-medium">{weight.adjustmentCount}</div>
                      </div>
                    </div>
                    
                    {weight.threshold && (
                      <div className="mt-2 text-sm text-gray-600">
                        Threshold: {weight.threshold.toFixed(3)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          {/* Learning Logs */}
          <Card>
            <CardHeader>
              <CardTitle>Learning Logs</CardTitle>
              <CardDescription>History of learning events and adjustments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {learningLogs.map((log) => (
                  <div key={log.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">
                          {log.agentType} - {log.metricType}
                        </div>
                        <div className="text-sm text-gray-600">
                          {log.learningType} - {log.adjustmentType}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {log.previousValue.toFixed(3)} → {log.newValue.toFixed(3)}
                        </div>
                        <div className="text-sm text-gray-600">
                          {new Date(log.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <Gauge className="w-4 h-4 text-gray-500" />
                          <span className="text-sm">
                            Confidence: {(log.confidence * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <BarChart3 className="w-4 h-4 text-gray-500" />
                          <span className="text-sm">
                            Sample: {log.sampleSize}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {log.validated && (
                          <Badge className="bg-green-500">Validated</Badge>
                        )}
                        {log.rolledBack && (
                          <Badge className="bg-red-500">Rolled Back</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 