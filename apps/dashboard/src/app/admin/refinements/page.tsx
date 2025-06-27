'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  TrendingUp,
  GitBranch,
  FileText,
  Zap,
  AlertTriangle,
  Eye,
  Download,
  Play,
} from 'lucide-react';

interface RefinementTask {
  id: string;
  agentType: string;
  taskType:
    | 'PROMPT_SIMPLIFICATION'
    | 'MODEL_DOWNGRADE'
    | 'RETRY_OPTIMIZATION'
    | 'QUALITY_ENHANCEMENT';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  expectedSavings: number;
  implementationEffort: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  createdAt: string;
  improvements: string[];
  tokenReduction?: number;
  qualityScore?: number;
}

interface PromptDiff {
  agentType: string;
  originalVersion: string;
  optimizedVersion: string;
  originalPrompt: string;
  optimizedPrompt: string;
  improvements: string[];
  tokenReduction: number;
  costReduction: number;
  qualityScore: number;
  recommendApproval: boolean;
}

const getTaskTypeIcon = (taskType: string) => {
  switch (taskType) {
    case 'PROMPT_SIMPLIFICATION':
      return <FileText className="h-4 w-4" />;
    case 'MODEL_DOWNGRADE':
      return <TrendingUp className="h-4 w-4" />;
    case 'RETRY_OPTIMIZATION':
      return <Zap className="h-4 w-4" />;
    case 'QUALITY_ENHANCEMENT':
      return <CheckCircle className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
};

const getTaskTypeColor = (taskType: string) => {
  switch (taskType) {
    case 'PROMPT_SIMPLIFICATION':
      return 'bg-blue-900 text-blue-200';
    case 'MODEL_DOWNGRADE':
      return 'bg-green-900 text-green-200';
    case 'RETRY_OPTIMIZATION':
      return 'bg-yellow-900 text-yellow-200';
    case 'QUALITY_ENHANCEMENT':
      return 'bg-purple-900 text-purple-200';
    default:
      return 'bg-gray-900 text-gray-200';
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'HIGH':
      return 'bg-red-900 text-red-200';
    case 'MEDIUM':
      return 'bg-yellow-900 text-yellow-200';
    case 'LOW':
      return 'bg-blue-900 text-blue-200';
    default:
      return 'bg-gray-900 text-gray-200';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'COMPLETED':
      return 'bg-green-900 text-green-200';
    case 'IN_PROGRESS':
      return 'bg-blue-900 text-blue-200';
    case 'PENDING':
      return 'bg-yellow-900 text-yellow-200';
    case 'FAILED':
      return 'bg-red-900 text-red-200';
    default:
      return 'bg-gray-900 text-gray-200';
  }
};

export default function AdminRefinementsPage() {
  const [selectedTask, setSelectedTask] = useState<RefinementTask | null>(null);
  const [viewDiff, setViewDiff] = useState<PromptDiff | null>(null);
  const [isRunningRefinement, setIsRunningRefinement] = useState(false);

  // Mock data - in real implementation these would come from the refinement system
  const mockTasks: RefinementTask[] = [
    {
      id: 'task_1701234567_abc123',
      agentType: 'SEO',
      taskType: 'PROMPT_SIMPLIFICATION',
      priority: 'HIGH',
      description: 'Simplify SEO prompts to reduce token usage by 35%',
      expectedSavings: 73.44,
      implementationEffort: 'LOW',
      status: 'PENDING',
      createdAt: '2024-11-20T10:30:00Z',
      improvements: [
        'Reduced temperature to 0.5 for more focused output',
        'Removed verbose explanations and examples',
        'Focused on essential task requirements',
      ],
      tokenReduction: 34.2,
      qualityScore: 0.82,
    },
    {
      id: 'task_1701234568_def456',
      agentType: 'AD',
      taskType: 'MODEL_DOWNGRADE',
      priority: 'HIGH',
      description: 'Switch AD agent to gpt-4o-mini model for cost reduction',
      expectedSavings: 41.76,
      implementationEffort: 'LOW',
      status: 'COMPLETED',
      createdAt: '2024-11-20T09:15:00Z',
      improvements: [
        'Added specific instructions for model efficiency',
        'Optimized for gpt-4o-mini model capabilities',
        'Reduced temperature for more consistent output',
      ],
      tokenReduction: 12.8,
      qualityScore: 0.78,
    },
    {
      id: 'task_1701234569_ghi789',
      agentType: 'CONTENT',
      taskType: 'QUALITY_ENHANCEMENT',
      priority: 'MEDIUM',
      description: 'Enhance CONTENT agent quality to improve impact score',
      expectedSavings: 0,
      implementationEffort: 'MEDIUM',
      status: 'IN_PROGRESS',
      createdAt: '2024-11-20T08:45:00Z',
      improvements: [
        'Added quality enhancement requirements',
        'Included success criteria for better outcomes',
        'Enhanced focus on measurable results',
      ],
      tokenReduction: 5.3,
      qualityScore: 0.89,
    },
  ];

  const mockDiff: PromptDiff = {
    agentType: 'SEO',
    originalVersion: 'v1.0',
    optimizedVersion: 'v1.1',
    originalPrompt: `You are an SEO optimization specialist. Analyze and improve content for search engine performance.

Task: Provide SEO analysis and optimization recommendations.
Requirements:
- Keyword optimization
- Technical SEO factors
- Content structure
- Performance metrics

Focus on actionable, high-impact improvements. For example, you might suggest improving meta descriptions, optimizing header structure, or enhancing internal linking strategies. Consider all aspects of on-page and technical SEO when making recommendations.`,
    optimizedPrompt: `You are an SEO optimization specialist. Analyze and improve content for search engine performance.

Task: Provide SEO analysis and optimization recommendations.
Requirements:
- Keyword optimization
- Technical SEO factors  
- Content structure
- Performance metrics

Focus on actionable, high-impact improvements.`,
    improvements: [
      'Reduced temperature to 0.5 for more focused output',
      'Removed verbose explanations and examples',
      'Focused on essential task requirements',
    ],
    tokenReduction: 34.2,
    costReduction: 27.4,
    qualityScore: 0.82,
    recommendApproval: true,
  };

  const handleRunRefinement = async () => {
    setIsRunningRefinement(true);
    try {
      // Simulate running refinement engine
      await new Promise(resolve => setTimeout(resolve, 3000));
      console.log('Refinement cycle completed');
    } finally {
      setIsRunningRefinement(false);
    }
  };

  const handleApproveOptimization = (taskId: string) => {
    console.log(`Approving optimization for task: ${taskId}`);
    // In real implementation, this would apply the optimization
  };

  const handleRejectOptimization = (taskId: string) => {
    console.log(`Rejecting optimization for task: ${taskId}`);
    // In real implementation, this would reject the optimization
  };

  const pendingTasks = mockTasks.filter(task => task.status === 'PENDING');
  const completedTasks = mockTasks.filter(task => task.status === 'COMPLETED');
  const totalSavings = mockTasks.reduce((sum, task) => sum + task.expectedSavings, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Agent Self-Refinement</h1>
            <p className="text-slate-400">
              Automated agent improvements driven by cost-efficiency insights
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button
              onClick={handleRunRefinement}
              disabled={isRunningRefinement}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-2 rounded-full font-medium transition-all duration-200 transform hover:scale-105 flex items-center gap-2"
            >
              {isRunningRefinement ? (
                <>
                  <Clock className="h-4 w-4 animate-spin" />
                  Refining...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Run Refinement
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-200">Pending Tasks</CardTitle>
              <Clock className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{pendingTasks.length}</div>
              <p className="text-xs text-slate-400 mt-1">awaiting approval</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-200">Expected Savings</CardTitle>
              <DollarSign className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">${totalSavings.toFixed(2)}</div>
              <p className="text-xs text-slate-400 mt-1">per month</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-200">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{completedTasks.length}</div>
              <p className="text-xs text-slate-400 mt-1">optimizations applied</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-200">
                Avg Quality Score
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {(
                  mockTasks.reduce((sum, task) => sum + (task.qualityScore || 0), 0) /
                  mockTasks.length
                ).toFixed(2)}
              </div>
              <p className="text-xs text-slate-400 mt-1">out of 1.00</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="bg-slate-800 border-slate-700">
            <TabsTrigger value="pending" className="data-[state=active]:bg-purple-600">
              Pending Improvements ({pendingTasks.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="data-[state=active]:bg-purple-600">
              Completed ({completedTasks.length})
            </TabsTrigger>
            <TabsTrigger value="diff" className="data-[state=active]:bg-purple-600">
              Before/After Diff
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {pendingTasks.length === 0 ? (
              <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                <CardContent className="p-8 text-center">
                  <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">All Caught Up!</h3>
                  <p className="text-slate-400">
                    No pending optimizations. Run refinement to check for new improvements.
                  </p>
                </CardContent>
              </Card>
            ) : (
              pendingTasks.map(task => (
                <Card key={task.id} className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full">
                          {getTaskTypeIcon(task.taskType)}
                        </div>
                        <div>
                          <CardTitle className="text-white flex items-center gap-2">
                            {task.agentType} Agent Optimization
                            <Badge className={getPriorityColor(task.priority)}>
                              {task.priority}
                            </Badge>
                          </CardTitle>
                          <CardDescription className="text-slate-400 mt-1">
                            {task.description}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-green-400 font-medium">
                          ${task.expectedSavings.toFixed(2)}
                        </div>
                        <div className="text-xs text-slate-400">monthly savings</div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4 text-sm">
                      <Badge className={getTaskTypeColor(task.taskType)}>
                        {task.taskType.replace('_', ' ')}
                      </Badge>
                      <span className="text-slate-300">Effort: {task.implementationEffort}</span>
                      {task.tokenReduction && (
                        <span className="text-slate-300">
                          Token reduction: {task.tokenReduction.toFixed(1)}%
                        </span>
                      )}
                      {task.qualityScore && (
                        <span className="text-slate-300">
                          Quality: {task.qualityScore.toFixed(2)}
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className="text-white font-medium mb-2">Expected Improvements:</h4>
                      <div className="space-y-1">
                        {task.improvements.map((improvement, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 text-sm text-slate-300"
                          >
                            <CheckCircle className="h-3 w-3 text-blue-400 flex-shrink-0" />
                            <span>{improvement}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-4 border-t border-slate-700">
                      <Button
                        onClick={() => handleApproveOptimization(task.id)}
                        className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Approve Optimization
                      </Button>
                      <Button
                        onClick={() => handleRejectOptimization(task.id)}
                        variant="outline"
                        className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white flex items-center gap-2"
                      >
                        <XCircle className="h-4 w-4" />
                        Reject
                      </Button>
                      <Button
                        onClick={() => setViewDiff(mockDiff)}
                        variant="outline"
                        className="border-slate-600 text-slate-300 hover:bg-slate-700 flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        View Diff
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {completedTasks.map(task => (
              <Card key={task.id} className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 bg-green-600 rounded-full">
                        <CheckCircle className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-white">
                          {task.agentType} Agent - {task.taskType.replace('_', ' ')}
                        </CardTitle>
                        <CardDescription className="text-slate-400 mt-1">
                          Completed on {new Date(task.createdAt).toLocaleDateString()}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge className={getStatusColor(task.status)}>{task.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                      <div className="text-lg font-bold text-green-400">
                        ${task.expectedSavings.toFixed(2)}
                      </div>
                      <div className="text-xs text-slate-400">Monthly Savings</div>
                    </div>
                    <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                      <div className="text-lg font-bold text-blue-400">
                        {task.tokenReduction?.toFixed(1) || 0}%
                      </div>
                      <div className="text-xs text-slate-400">Token Reduction</div>
                    </div>
                    <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                      <div className="text-lg font-bold text-purple-400">
                        {task.qualityScore?.toFixed(2) || 0}
                      </div>
                      <div className="text-xs text-slate-400">Quality Score</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="diff" className="space-y-6">
            {viewDiff ? (
              <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <GitBranch className="h-5 w-5" />
                    Prompt Comparison: {viewDiff.agentType} Agent
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    {viewDiff.originalVersion} → {viewDiff.optimizedVersion}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Metrics */}
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-slate-800/50 rounded-lg">
                      <div className="text-xl font-bold text-blue-400">
                        {viewDiff.tokenReduction.toFixed(1)}%
                      </div>
                      <div className="text-sm text-slate-400">Token Reduction</div>
                    </div>
                    <div className="text-center p-4 bg-slate-800/50 rounded-lg">
                      <div className="text-xl font-bold text-green-400">
                        {viewDiff.costReduction.toFixed(1)}%
                      </div>
                      <div className="text-sm text-slate-400">Cost Reduction</div>
                    </div>
                    <div className="text-center p-4 bg-slate-800/50 rounded-lg">
                      <div className="text-xl font-bold text-purple-400">
                        {viewDiff.qualityScore.toFixed(2)}
                      </div>
                      <div className="text-sm text-slate-400">Quality Score</div>
                    </div>
                    <div className="text-center p-4 bg-slate-800/50 rounded-lg">
                      <div className="text-xl font-bold text-green-400">
                        {viewDiff.recommendApproval ? '✅' : '⚠️'}
                      </div>
                      <div className="text-sm text-slate-400">
                        {viewDiff.recommendApproval ? 'Approved' : 'Review'}
                      </div>
                    </div>
                  </div>

                  {/* Before/After Diff */}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                        <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                        Original Prompt ({viewDiff.originalVersion})
                      </h4>
                      <div className="bg-slate-800/50 rounded-lg p-4 text-sm text-slate-300 font-mono whitespace-pre-wrap">
                        {viewDiff.originalPrompt}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                        <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                        Optimized Prompt ({viewDiff.optimizedVersion})
                      </h4>
                      <div className="bg-slate-800/50 rounded-lg p-4 text-sm text-slate-300 font-mono whitespace-pre-wrap">
                        {viewDiff.optimizedPrompt}
                      </div>
                    </div>
                  </div>

                  {/* Improvements */}
                  <div>
                    <h4 className="text-white font-medium mb-3">Improvements Made:</h4>
                    <div className="space-y-2">
                      {viewDiff.improvements.map((improvement, index) => (
                        <div key={index} className="flex items-center gap-2 text-slate-300">
                          <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
                          <span>{improvement}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 pt-4 border-t border-slate-700">
                    <Button className="bg-green-600 hover:bg-green-700 text-white">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Apply Changes
                    </Button>
                    <Button variant="outline" className="border-slate-600 text-slate-300">
                      <Download className="h-4 w-4 mr-2" />
                      Download Diff
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                <CardContent className="p-8 text-center">
                  <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">No Diff Selected</h3>
                  <p className="text-slate-400">
                    Select a pending task to view before/after comparison.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
