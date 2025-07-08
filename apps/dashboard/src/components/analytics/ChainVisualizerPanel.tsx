"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Input } from "../ui/input";
import { Separator } from "../ui/separator";
import {
  GitBranch,
  Play,
  Pause,
  Square,
  Clock,
  Zap,
  ArrowRight,
  ArrowDown,
  CheckCircle,
  XCircle,
  AlertCircle,
  RotateCcw,
  Filter,
  Search,
  Eye,
  BarChart3,
  TrendingUp,
  RefreshCw,
  Settings,
  Users,
  Timer,
  Activity,
} from "lucide-react";
import { useAgentChains } from "../../hooks/useAgentChains";

interface ChainVisualizerPanelProps {
  showFilters?: boolean;
  maxHeight?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
  onChainSelected?: (chainId: string) => void;
  onStepSelected?: (stepId: string) => void;
}

interface ChainStep {
  id: string;
  name: string;
  agentType: string;
  status: "pending" | "running" | "completed" | "failed" | "skipped";
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  output?: any;
  error?: string;
  dependencies: string[];
  conditions?: any;
  retryCount?: number;
  maxRetries?: number;
}

interface ChainExecution {
  id: string;
  chainId: string;
  chainName: string;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  startTime: Date;
  endTime?: Date;
  totalSteps: number;
  completedSteps: number;
  failedSteps: number;
  currentStep?: string;
  steps: ChainStep[];
  executionMode: "sequential" | "parallel" | "adaptive" | "batch";
  performance: {
    averageStepTime: number;
    totalCost: number;
    efficiency: number;
  };
  metadata?: any;
}

export function ChainVisualizerPanel({
  showFilters = true,
  maxHeight = "600px",
  autoRefresh = false,
  refreshInterval = 30000,
  onChainSelected,
  onStepSelected,
}: ChainVisualizerPanelProps) {
  const [selectedChainId, setSelectedChainId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "flow" | "timeline">(
    "flow",
  );
  const [selectedExecution, setSelectedExecution] =
    useState<ChainExecution | null>(null);

  // Use the agent chains hook
  const {
    chains,
    executions,
    activeExecutions,
    chainMetrics,
    isLoading,
    error,
    createChain,
    executeChain,
    cancelExecution,
    retryStep,
    refreshData,
  } = useAgentChains({
    autoRefresh,
    refreshInterval,
  });

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        refreshData();
      }, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, refreshData]);

  // Filter executions based on search and status
  const filteredExecutions = useMemo(() => {
    if (!executions) return [];

    return executions.filter((execution) => {
      const matchesStatus =
        statusFilter === "all" || execution.status === statusFilter;
      const matchesSearch =
        !searchQuery ||
        execution.chainName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        execution.id.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesStatus && matchesSearch;
    });
  }, [executions, statusFilter, searchQuery]);

  // Get status color for different chain states
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
      case "running":
        return "text-blue-400 bg-blue-400/10 border-blue-400/20 animate-pulse";
      case "failed":
        return "text-red-400 bg-red-400/10 border-red-400/20";
      case "cancelled":
        return "text-gray-400 bg-gray-400/10 border-gray-400/20";
      case "pending":
        return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
      default:
        return "text-gray-400 bg-gray-400/10 border-gray-400/20";
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      case "running":
        return <Play className="w-4 h-4 animate-spin" />;
      case "failed":
        return <XCircle className="w-4 h-4" />;
      case "cancelled":
        return <Square className="w-4 h-4" />;
      case "pending":
        return <Clock className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  // Calculate execution progress
  const getExecutionProgress = (execution: ChainExecution) => {
    if (execution.totalSteps === 0) return 0;
    return (execution.completedSteps / execution.totalSteps) * 100;
  };

  // Format duration
  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  // Handle chain execution actions
  const handleExecuteChain = async (chainId: string) => {
    try {
      await executeChain(chainId, {
        mode: "adaptive",
        timeout: 300000, // 5 minutes
        retryFailedSteps: true,
      });
      refreshData();
    } catch (error) {
      console.error("Failed to execute chain:", error);
    }
  };

  const handleCancelExecution = async (executionId: string) => {
    try {
      await cancelExecution(executionId);
      refreshData();
    } catch (error) {
      console.error("Failed to cancel execution:", error);
    }
  };

  const handleRetryStep = async (executionId: string, stepId: string) => {
    try {
      await retryStep(executionId, stepId);
      refreshData();
    } catch (error) {
      console.error("Failed to retry step:", error);
    }
  };

  // Render flow visualization
  const renderFlowVisualization = (execution: ChainExecution) => {
    const steps = execution.steps;
    const maxCols = 4;
    const stepGroups: ChainStep[][] = [];

    // Group steps by dependencies for flow layout
    let currentGroup: ChainStep[] = [];
    steps.forEach((step, index) => {
      if (step.dependencies.length === 0 || index % maxCols === 0) {
        if (currentGroup.length > 0) {
          stepGroups.push(currentGroup);
        }
        currentGroup = [step];
      } else {
        currentGroup.push(step);
      }
    });
    if (currentGroup.length > 0) {
      stepGroups.push(currentGroup);
    }

    return (
      <div className="space-y-8">
        {stepGroups.map((group, groupIndex) => (
          <div key={groupIndex} className="space-y-4">
            <div
              className={`grid gap-4`}
              style={{
                gridTemplateColumns: `repeat(${Math.min(group.length, maxCols)}, 1fr)`,
              }}
            >
              {group.map((step, stepIndex) => (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    delay: (groupIndex * maxCols + stepIndex) * 0.1,
                  }}
                  className="relative"
                >
                  <Card
                    className={`bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border cursor-pointer transition-all hover:scale-105 ${getStatusColor(step.status)}`}
                    onClick={() => onStepSelected?.(step.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(step.status)}
                          <span className="font-medium text-sm">
                            {step.name}
                          </span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {step.agentType}
                        </Badge>
                      </div>

                      <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
                        {step.duration && (
                          <div className="flex items-center gap-1">
                            <Timer className="w-3 h-3" />
                            {formatDuration(step.duration)}
                          </div>
                        )}
                        {step.retryCount && step.retryCount > 0 && (
                          <div className="flex items-center gap-1">
                            <RotateCcw className="w-3 h-3" />
                            {step.retryCount}/{step.maxRetries || 3} retries
                          </div>
                        )}
                      </div>

                      {step.status === "failed" && step.error && (
                        <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded text-xs text-red-600 dark:text-red-400">
                          {step.error}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Connection arrows */}
                  {stepIndex < group.length - 1 && (
                    <div className="absolute top-1/2 -right-2 transform -translate-y-1/2 z-10">
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Group connection arrow */}
            {groupIndex < stepGroups.length - 1 && (
              <div className="flex justify-center">
                <ArrowDown className="w-6 h-6 text-gray-400" />
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Render timeline view
  const renderTimelineView = (execution: ChainExecution) => {
    const sortedSteps = [...execution.steps].sort(
      (a, b) => (a.startTime?.getTime() || 0) - (b.startTime?.getTime() || 0),
    );

    return (
      <div className="space-y-4">
        {sortedSteps.map((step, index) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center gap-4"
          >
            <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-400"></div>
            <div className="flex-1">
              <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(step.status)}
                      <div>
                        <div className="font-medium">{step.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {step.agentType} •{" "}
                          {step.startTime?.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {step.duration && (
                        <Badge variant="outline" className="text-xs">
                          {formatDuration(step.duration)}
                        </Badge>
                      )}
                      <Badge
                        variant="outline"
                        className={`text-xs ${getStatusColor(step.status)}`}
                      >
                        {step.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  if (error) {
    return (
      <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
        <CardContent className="p-6 text-center">
          <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            Failed to Load Chain Data
          </h3>
          <p className="text-gray-500 mb-4">
            There was an error loading the chain execution data.
          </p>
          <Button onClick={refreshData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-purple-500" />
              Strategy Chain Visualizer
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refreshData()}
                disabled={isLoading}
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
              <Select value={viewMode} onValueChange={setViewMode as any}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flow">Flow</SelectItem>
                  <SelectItem value="timeline">Timeline</SelectItem>
                  <SelectItem value="list">List</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        {showFilters && (
          <CardContent className="pt-0">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-gray-500" />
                <Input
                  placeholder="Search chains..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="running">Running</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Active executions summary */}
      {activeExecutions && activeExecutions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-5 h-5 text-blue-500" />
                <span className="font-medium">Active Chains</span>
              </div>
              <div className="text-2xl font-bold text-blue-500">
                {activeExecutions.length}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-purple-500" />
                <span className="font-medium">Total Steps</span>
              </div>
              <div className="text-2xl font-bold text-purple-500">
                {activeExecutions.reduce(
                  (sum, exec) => sum + exec.totalSteps,
                  0,
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <span className="font-medium">Avg Progress</span>
              </div>
              <div className="text-2xl font-bold text-green-500">
                {activeExecutions.length > 0
                  ? (
                      activeExecutions.reduce(
                        (sum, exec) => sum + getExecutionProgress(exec),
                        0,
                      ) / activeExecutions.length
                    ).toFixed(0)
                  : 0}
                %
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Executions list */}
        <Card className="lg:col-span-1 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-sm">Recent Executions</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className={`overflow-y-auto`} style={{ maxHeight }}>
              <AnimatePresence>
                {filteredExecutions.slice(0, 10).map((execution, index) => (
                  <motion.div
                    key={execution.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                      selectedExecution?.id === execution.id
                        ? "bg-blue-50 dark:bg-blue-900/20"
                        : ""
                    }`}
                    onClick={() => {
                      setSelectedExecution(execution);
                      onChainSelected?.(execution.chainId);
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(execution.status)}
                        <span className="font-medium text-sm">
                          {execution.chainName}
                        </span>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-xs ${getStatusColor(execution.status)}`}
                      >
                        {execution.status}
                      </Badge>
                    </div>

                    <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
                      <div>Mode: {execution.executionMode}</div>
                      <div>
                        Steps: {execution.completedSteps}/{execution.totalSteps}
                      </div>
                      <div>
                        Started: {execution.startTime.toLocaleTimeString()}
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <motion.div
                          className="bg-blue-500 h-2 rounded-full"
                          initial={{ width: 0 }}
                          animate={{
                            width: `${getExecutionProgress(execution)}%`,
                          }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                    </div>

                    {/* Action buttons for active executions */}
                    {execution.status === "running" && (
                      <div className="mt-2 flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCancelExecution(execution.id);
                          }}
                          className="h-6 px-2 text-xs"
                        >
                          <Square className="w-3 h-3 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {filteredExecutions.length === 0 && (
                <div className="p-8 text-center">
                  <GitBranch className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No chain executions found
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Visualization area */}
        <Card className="lg:col-span-2 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">
                {selectedExecution
                  ? `${selectedExecution.chainName} - ${selectedExecution.id.slice(0, 8)}`
                  : "Select Chain Execution"}
              </CardTitle>
              {selectedExecution && (
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={`text-xs ${getStatusColor(selectedExecution.status)}`}
                  >
                    {selectedExecution.status}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {selectedExecution.executionMode}
                  </Badge>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {selectedExecution ? (
              <div className={`overflow-y-auto`} style={{ maxHeight }}>
                {viewMode === "flow" &&
                  renderFlowVisualization(selectedExecution)}
                {viewMode === "timeline" &&
                  renderTimelineView(selectedExecution)}
                {viewMode === "list" && (
                  <div className="space-y-3">
                    {selectedExecution.steps.map((step, index) => (
                      <Card
                        key={step.id}
                        className={`border ${getStatusColor(step.status)}`}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {getStatusIcon(step.status)}
                              <div>
                                <div className="font-medium">{step.name}</div>
                                <div className="text-sm text-gray-500">
                                  {step.agentType}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {step.duration && (
                                <Badge variant="outline" className="text-xs">
                                  {formatDuration(step.duration)}
                                </Badge>
                              )}
                              {step.status === "failed" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleRetryStep(
                                      selectedExecution.id,
                                      step.id,
                                    )
                                  }
                                  className="h-6 px-2 text-xs"
                                >
                                  <RotateCcw className="w-3 h-3 mr-1" />
                                  Retry
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Select a chain execution to visualize its flow
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
