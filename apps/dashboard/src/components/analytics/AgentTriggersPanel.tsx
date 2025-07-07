'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Play, 
  Pause, 
  RefreshCw, 
  Filter,
  Bell,
  TrendingUp,
  Activity,
  AlertTriangle,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

// Types
interface AgentActionLog {
  id: string;
  agentName: string;
  agentType: string;
  actionType: string;
  campaignId?: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'EMERGENCY';
  executedAt: string;
  completedAt?: string;
  notes?: string;
  errorMessage?: string;
  impactMetrics?: Record<string, any>;
  campaign?: {
    id: string;
    name: string;
    type: string;
    status: string;
  };
}

interface ActionStats {
  totalActions: number;
  successful: number;
  failed: number;
  pending: number;
  successRate: number;
  failureRate: number;
  recentActivity: {
    last24Hours: number;
    lastHour: number;
  };
}

interface ActionRunnerStatus {
  isRunning: boolean;
  autoRunEnabled: boolean;
  runInterval: number;
  activeActions: number;
  lastRun?: { executedAt: string };
}

interface AgentTriggersProps {
  showFilters?: boolean;
  maxHeight?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
  onActionTriggered?: (actionId: string) => void;
}

const AgentTriggersPanel: React.FC<AgentTriggersProps> = ({
  showFilters = true,
  maxHeight = "600px",
  autoRefresh = true,
  refreshInterval = 30000,
  onActionTriggered
}) => {
  const [logs, setLogs] = useState<AgentActionLog[]>([]);
  const [stats, setStats] = useState<ActionStats | null>(null);
  const [runnerStatus, setRunnerStatus] = useState<ActionRunnerStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedAgent, setSelectedAgent] = useState<string>('all');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [newActionsCount, setNewActionsCount] = useState(0);
  const { toast } = useToast();

  // Fetch action logs
  const fetchActionLogs = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const filters: any = {};
      
      if (selectedStatus !== 'all') {
        filters.status = selectedStatus;
      }
      
      if (selectedAgent !== 'all') {
        filters.agentType = selectedAgent;
      }
      
      if (selectedAction !== 'all') {
        filters.actionType = selectedAction;
      }
      
      const queryString = new URLSearchParams(filters).toString();
      const response = await fetch(`/api/trpc/agentActions.getActionLogs?${queryString}`);
      const data = await response.json();
      
      if (data.result?.data) {
        const newLogs = data.result.data.logs;
        
        // Check for new actions
        if (logs.length > 0) {
          const newActions = newLogs.filter((log: AgentActionLog) => 
            !logs.some(existingLog => existingLog.id === log.id)
          );
          
          if (newActions.length > 0) {
            setNewActionsCount(prev => prev + newActions.length);
            
            // Show toast for critical actions
            newActions.forEach((action: AgentActionLog) => {
              if (action.priority === 'CRITICAL' || action.priority === 'EMERGENCY') {
                toast({
                  title: `${action.priority} Action Triggered`,
                  description: `${action.agentType} agent executed ${action.actionType}`,
                  variant: action.status === 'FAILED' ? 'destructive' : 'default',
                });
              }
            });
            
            if (onActionTriggered) {
              newActions.forEach(action => onActionTriggered(action.id));
            }
          }
        }
        
        setLogs(newLogs);
      }
    } catch (error) {
      console.error('Failed to fetch action logs:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch action logs',
        variant: 'destructive',
      });
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Fetch action stats
  const fetchActionStats = async () => {
    try {
      const response = await fetch('/api/trpc/agentActions.getActionStats');
      const data = await response.json();
      
      if (data.result?.data) {
        setStats(data.result.data);
      }
    } catch (error) {
      console.error('Failed to fetch action stats:', error);
    }
  };

  // Fetch runner status
  const fetchRunnerStatus = async () => {
    try {
      const response = await fetch('/api/trpc/agentActions.getActionRunnerStatus');
      const data = await response.json();
      
      if (data.result?.data) {
        setRunnerStatus(data.result.data);
      }
    } catch (error) {
      console.error('Failed to fetch runner status:', error);
    }
  };

  // Trigger action checks manually
  const triggerActionChecks = async () => {
    setTriggering(true);
    try {
      const response = await fetch('/api/trpc/agentActions.runActionChecks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      
      const data = await response.json();
      
      if (data.result?.data?.success) {
        toast({
          title: 'Success',
          description: data.result.data.message,
        });
        
        // Refresh data
        setTimeout(() => {
          fetchActionLogs(false);
          fetchActionStats();
        }, 1000);
      } else {
        throw new Error(data.result?.data?.message || 'Failed to trigger action checks');
      }
    } catch (error) {
      console.error('Failed to trigger action checks:', error);
      toast({
        title: 'Error',
        description: 'Failed to trigger action checks',
        variant: 'destructive',
      });
    } finally {
      setTriggering(false);
    }
  };

  // Filter logs based on search term
  const filteredLogs = logs.filter(log => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      log.agentName.toLowerCase().includes(searchLower) ||
      log.actionType.toLowerCase().includes(searchLower) ||
      log.notes?.toLowerCase().includes(searchLower) ||
      log.campaign?.name.toLowerCase().includes(searchLower)
    );
  });

  // Get status icon and color
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'FAILED':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'PENDING':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'RUNNING':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  // Get priority badge variant
  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case 'EMERGENCY':
        return 'destructive';
      case 'CRITICAL':
        return 'destructive';
      case 'HIGH':
        return 'default';
      case 'MEDIUM':
        return 'secondary';
      case 'LOW':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  // Get action type icon
  const getActionTypeIcon = (actionType: string) => {
    switch (actionType) {
      case 'PAUSE_CAMPAIGN':
      case 'RESUME_CAMPAIGN':
        return <Pause className="w-4 h-4" />;
      case 'ADJUST_BUDGET_UP':
      case 'ADJUST_BUDGET_DOWN':
        return <TrendingUp className="w-4 h-4" />;
      case 'NOTIFY_TEAM':
        return <Bell className="w-4 h-4" />;
      case 'ESCALATE_ISSUE':
        return <AlertTriangle className="w-4 h-4" />;
      case 'EMERGENCY_STOP':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  // Reset new actions count when user interacts
  const resetNewActionsCount = () => {
    setNewActionsCount(0);
  };

  // Auto-refresh effect
  useEffect(() => {
    fetchActionLogs();
    fetchActionStats();
    fetchRunnerStatus();
    
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchActionLogs(false);
        fetchActionStats();
        fetchRunnerStatus();
      }, refreshInterval);
      
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, selectedStatus, selectedAgent, selectedAction]);

  return (
    <div className="space-y-4">
      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Actions</p>
                <p className="text-2xl font-bold">{stats?.totalActions || 0}</p>
              </div>
              <Activity className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold text-green-500">
                  {stats ? Math.round(stats.successRate * 100) : 0}%
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Last Hour</p>
                <p className="text-2xl font-bold">{stats?.recentActivity.lastHour || 0}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Runner Status</p>
                <p className="text-sm font-medium">
                  {runnerStatus?.isRunning ? 'Running' : 'Stopped'}
                </p>
              </div>
              <div className={`w-3 h-3 rounded-full ${runnerStatus?.isRunning ? 'bg-green-500' : 'bg-red-500'}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Panel */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Agent Triggers
                {newActionsCount > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {newActionsCount} new
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Live monitoring of autonomous agent actions
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchActionLogs()}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              
              <Button
                variant="default"
                size="sm"
                onClick={triggerActionChecks}
                disabled={triggering}
              >
                <Play className={`w-4 h-4 mr-2 ${triggering ? 'animate-pulse' : ''}`} />
                Run Triggers Now
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Input
                placeholder="Search actions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
              
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="RUNNING">Running</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by agent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Agents</SelectItem>
                  <SelectItem value="CONTENT">Content</SelectItem>
                  <SelectItem value="EMAIL">Email</SelectItem>
                  <SelectItem value="SOCIAL">Social</SelectItem>
                  <SelectItem value="SUPPORT">Support</SelectItem>
                  <SelectItem value="TREND">Trend</SelectItem>
                  <SelectItem value="SEO">SEO</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={selectedAction} onValueChange={setSelectedAction}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="PAUSE_CAMPAIGN">Pause Campaign</SelectItem>
                  <SelectItem value="RESUME_CAMPAIGN">Resume Campaign</SelectItem>
                  <SelectItem value="ADJUST_BUDGET_UP">Increase Budget</SelectItem>
                  <SelectItem value="ADJUST_BUDGET_DOWN">Decrease Budget</SelectItem>
                  <SelectItem value="NOTIFY_TEAM">Notify Team</SelectItem>
                  <SelectItem value="ESCALATE_ISSUE">Escalate Issue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          
          {/* Actions Table */}
          <div className="border rounded-lg" style={{ maxHeight, overflowY: 'auto' }}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Impact</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {filteredLogs.map((log) => (
                    <motion.tr
                      key={log.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.2 }}
                      className="hover:bg-muted/50"
                      onClick={resetNewActionsCount}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {log.agentType}
                          </Badge>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getActionTypeIcon(log.actionType)}
                          <span className="font-medium">
                            {log.actionType.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        {log.campaign ? (
                          <div>
                            <p className="font-medium">{log.campaign.name}</p>
                            <p className="text-sm text-muted-foreground">{log.campaign.type}</p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Global</span>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(log.status)}
                          <span className="font-medium">{log.status}</span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <Badge variant={getPriorityVariant(log.priority)}>
                          {log.priority}
                        </Badge>
                      </TableCell>
                      
                      <TableCell>
                        <div>
                          <p className="text-sm">
                            {formatDistanceToNow(new Date(log.executedAt), { addSuffix: true })}
                          </p>
                          {log.completedAt && (
                            <p className="text-xs text-muted-foreground">
                              Completed: {formatDistanceToNow(new Date(log.completedAt), { addSuffix: true })}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        {log.impactMetrics ? (
                          <div className="text-sm">
                            {Object.entries(log.impactMetrics).map(([key, value]) => (
                              <div key={key} className="flex justify-between">
                                <span className="text-muted-foreground">{key}:</span>
                                <span className="font-medium">{String(value)}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">No impact data</span>
                        )}
                      </TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </TableBody>
            </Table>
            
            {filteredLogs.length === 0 && (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No actions found</p>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your filters or trigger some actions
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgentTriggersPanel; 