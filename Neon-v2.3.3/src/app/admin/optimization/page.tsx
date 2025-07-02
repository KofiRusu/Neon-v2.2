'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/utils/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Zap,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  Lightbulb,
  Settings,
  RefreshCw,
} from 'lucide-react';

interface AgentEfficiencyMetrics {
  agentType: string;
  totalRuns: number;
  avgCost: number;
  avgTokens: number;
  avgImpactScore: number;
  conversionRate: number;
  costPerImpact: number;
  costPerConversion: number;
  qualityScore: number;
  avgRetryCount: number;
  avgExecutionTime: number;
  efficiencyRating: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR' | 'CRITICAL';
  recommendedOptimizations: string[];
}

interface OptimizationSuggestion {
  agentType: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  category: 'COST' | 'QUALITY' | 'SPEED' | 'RELIABILITY';
  suggestion: string;
  expectedSavings: number;
  implementationEffort: 'LOW' | 'MEDIUM' | 'HIGH';
}

const getEfficiencyColor = (rating: string) => {
  switch (rating) {
    case 'EXCELLENT':
      return 'bg-green-900 text-green-200';
    case 'GOOD':
      return 'bg-green-900 text-green-200';
    case 'AVERAGE':
      return 'bg-yellow-900 text-yellow-200';
    case 'POOR':
      return 'bg-orange-900 text-orange-200';
    case 'CRITICAL':
      return 'bg-red-900 text-red-200';
    default:
      return 'bg-gray-900 text-gray-200';
  }
};

const getEfficiencyEmoji = (rating: string) => {
  switch (rating) {
    case 'EXCELLENT':
      return '🟢';
    case 'GOOD':
      return '🟢';
    case 'AVERAGE':
      return '🟡';
    case 'POOR':
      return '🟠';
    case 'CRITICAL':
      return '🔴';
    default:
      return '⚪';
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

export default function AdminOptimizationPage() {
  const [timeframe, setTimeframe] = useState(30); // days
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Mock data - in real implementation these would come from tRPC
  const mockMetrics: AgentEfficiencyMetrics[] = [
    {
      agentType: 'CONTENT',
      totalRuns: 45,
      avgCost: 0.032,
      avgTokens: 800,
      avgImpactScore: 0.75,
      conversionRate: 68.9,
      costPerImpact: 0.0427,
      costPerConversion: 0.0465,
      qualityScore: 0.82,
      avgRetryCount: 0.3,
      avgExecutionTime: 2400,
      efficiencyRating: 'GOOD',
      recommendedOptimizations: [
        '🎯 Refine prompts to improve output relevance',
        '⚡ Optimize prompt length and complexity',
      ],
    },
    {
      agentType: 'AD',
      totalRuns: 23,
      avgCost: 0.089,
      avgTokens: 1200,
      avgImpactScore: 0.45,
      conversionRate: 34.8,
      costPerImpact: 0.198,
      costPerConversion: 0.256,
      qualityScore: 0.58,
      avgRetryCount: 1.2,
      avgExecutionTime: 4800,
      efficiencyRating: 'POOR',
      recommendedOptimizations: [
        '🔻 Consider switching to gpt-4o-mini for cost reduction',
        '🛠️ Implement better error handling and validation',
        '📝 Add validation steps before execution',
      ],
    },
    {
      agentType: 'SEO',
      totalRuns: 18,
      avgCost: 0.145,
      avgTokens: 1800,
      avgImpactScore: 0.28,
      conversionRate: 22.2,
      costPerImpact: 0.518,
      costPerConversion: 0.654,
      qualityScore: 0.41,
      avgRetryCount: 2.1,
      avgExecutionTime: 8200,
      efficiencyRating: 'CRITICAL',
      recommendedOptimizations: [
        '🔻 Consider switching to gpt-4o-mini for cost reduction',
        '✂️ Simplify prompts to reduce token usage',
        '🎯 Refine prompts to improve output relevance',
        '🛠️ Implement better error handling and validation',
      ],
    },
  ];

  const mockSuggestions: OptimizationSuggestion[] = [
    {
      agentType: 'SEO',
      priority: 'HIGH',
      category: 'COST',
      suggestion: 'Switch SEO to gpt-4o-mini model to reduce cost from $0.1450 to ~$0.0435 per run',
      expectedSavings: 73.44,
      implementationEffort: 'LOW',
    },
    {
      agentType: 'SEO',
      priority: 'HIGH',
      category: 'RELIABILITY',
      suggestion: 'Improve SEO prompt engineering to reduce retry rate from 2.1 to <0.5',
      expectedSavings: 41.76,
      implementationEffort: 'MEDIUM',
    },
    {
      agentType: 'AD',
      priority: 'MEDIUM',
      category: 'QUALITY',
      suggestion: 'Refine AD prompts to improve impact score from 0.45 to >0.7',
      expectedSavings: 0,
      implementationEffort: 'MEDIUM',
    },
  ];

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    try {
      // In real implementation, this would trigger report generation
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      console.log('Optimization report generated');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const totalPotentialSavings = mockSuggestions.reduce((sum, s) => sum + s.expectedSavings, 0);
  const criticalAgents = mockMetrics.filter(m => m.efficiencyRating === 'CRITICAL').length;
  const poorAgents = mockMetrics.filter(m => m.efficiencyRating === 'POOR').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Agent Cost Optimization</h1>
            <p className="text-slate-400">
              Analyze and optimize AI agent efficiency based on cost, quality, and impact metrics
            </p>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={timeframe}
              onChange={e => setTimeframe(parseInt(e.target.value))}
              className="bg-slate-800 border-slate-700 text-white rounded px-3 py-2"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
            <Button
              onClick={handleGenerateReport}
              disabled={isGeneratingReport}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-2 rounded-full font-medium transition-all duration-200 transform hover:scale-105 flex items-center gap-2"
            >
              {isGeneratingReport ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <BarChart3 className="h-4 w-4" />
                  Generate Report
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-200">
                Potential Savings
              </CardTitle>
              <DollarSign className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                ${totalPotentialSavings.toFixed(2)}
              </div>
              <p className="text-xs text-slate-400 mt-1">per month</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-200">Critical Issues</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{criticalAgents}</div>
              <p className="text-xs text-slate-400 mt-1">agents need urgent attention</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-200">Poor Performance</CardTitle>
              <TrendingDown className="h-4 w-4 text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{poorAgents}</div>
              <p className="text-xs text-slate-400 mt-1">agents underperforming</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-200">Optimizations</CardTitle>
              <Lightbulb className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{mockSuggestions.length}</div>
              <p className="text-xs text-slate-400 mt-1">ready to implement</p>
            </CardContent>
          </Card>
        </div>

        {/* Alerts */}
        {criticalAgents > 0 && (
          <Alert className="bg-red-900/20 border-red-600">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-200">
              🚨 {criticalAgents} agents have critical efficiency issues requiring immediate
              attention. Total potential savings: ${totalPotentialSavings.toFixed(2)}/month
            </AlertDescription>
          </Alert>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-slate-800 border-slate-700">
            <TabsTrigger value="overview" className="data-[state=active]:bg-purple-600">
              Performance Overview
            </TabsTrigger>
            <TabsTrigger value="suggestions" className="data-[state=active]:bg-purple-600">
              Optimization Suggestions
            </TabsTrigger>
            <TabsTrigger value="detailed" className="data-[state=active]:bg-purple-600">
              Detailed Analysis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Agent Efficiency Overview</CardTitle>
                <CardDescription className="text-slate-400">
                  Performance metrics and efficiency ratings for all agents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700">
                      <TableHead className="text-slate-300">Agent</TableHead>
                      <TableHead className="text-slate-300">Runs</TableHead>
                      <TableHead className="text-slate-300">Avg Cost</TableHead>
                      <TableHead className="text-slate-300">Impact Score</TableHead>
                      <TableHead className="text-slate-300">Conversion Rate</TableHead>
                      <TableHead className="text-slate-300">Cost/Impact</TableHead>
                      <TableHead className="text-slate-300">Efficiency</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockMetrics.map(metric => (
                      <TableRow key={metric.agentType} className="border-slate-700">
                        <TableCell className="text-white font-medium">{metric.agentType}</TableCell>
                        <TableCell className="text-slate-300">{metric.totalRuns}</TableCell>
                        <TableCell className="text-white">${metric.avgCost.toFixed(4)}</TableCell>
                        <TableCell className="text-slate-300">
                          {metric.avgImpactScore.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {metric.conversionRate.toFixed(1)}%
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {metric.costPerImpact === Infinity
                            ? '∞'
                            : `$${metric.costPerImpact.toFixed(4)}`}
                        </TableCell>
                        <TableCell>
                          <Badge className={getEfficiencyColor(metric.efficiencyRating)}>
                            {getEfficiencyEmoji(metric.efficiencyRating)} {metric.efficiencyRating}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="suggestions" className="space-y-6">
            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Optimization Suggestions</CardTitle>
                <CardDescription className="text-slate-400">
                  Prioritized recommendations to improve agent efficiency and reduce costs
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {mockSuggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="p-6 bg-slate-800/50 rounded-xl border border-slate-700"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full">
                          <Zap className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h4 className="text-white font-medium">
                            {suggestion.agentType} Agent - {suggestion.category}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={getPriorityColor(suggestion.priority)}>
                              {suggestion.priority}
                            </Badge>
                            <Badge variant="outline" className="border-slate-600 text-slate-300">
                              {suggestion.implementationEffort} effort
                            </Badge>
                          </div>
                        </div>
                      </div>
                      {suggestion.expectedSavings > 0 && (
                        <div className="text-right">
                          <div className="text-green-400 font-medium">
                            ${suggestion.expectedSavings.toFixed(2)}
                          </div>
                          <div className="text-xs text-slate-400">monthly savings</div>
                        </div>
                      )}
                    </div>
                    <p className="text-slate-300 mb-4">{suggestion.suggestion}</p>
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Implement Optimization
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="detailed" className="space-y-6">
            {mockMetrics.map(metric => (
              <Card
                key={metric.agentType}
                className="bg-slate-900/50 border-slate-800 backdrop-blur-sm"
              >
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    {getEfficiencyEmoji(metric.efficiencyRating)} {metric.agentType} Agent Analysis
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Comprehensive performance metrics and optimization recommendations
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-slate-800/50 rounded-lg">
                      <div className="text-xl font-bold text-white">{metric.totalRuns}</div>
                      <div className="text-sm text-slate-400">Total Runs</div>
                    </div>
                    <div className="text-center p-4 bg-slate-800/50 rounded-lg">
                      <div className="text-xl font-bold text-white">
                        ${metric.avgCost.toFixed(4)}
                      </div>
                      <div className="text-sm text-slate-400">Avg Cost</div>
                    </div>
                    <div className="text-center p-4 bg-slate-800/50 rounded-lg">
                      <div className="text-xl font-bold text-white">
                        {metric.avgImpactScore.toFixed(2)}
                      </div>
                      <div className="text-sm text-slate-400">Impact Score</div>
                    </div>
                    <div className="text-center p-4 bg-slate-800/50 rounded-lg">
                      <div className="text-xl font-bold text-white">
                        {metric.conversionRate.toFixed(1)}%
                      </div>
                      <div className="text-sm text-slate-400">Conversion Rate</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-white font-medium mb-3">Recommended Optimizations</h4>
                    <div className="space-y-2">
                      {metric.recommendedOptimizations.map((opt, index) => (
                        <div key={index} className="flex items-center gap-2 text-slate-300">
                          <CheckCircle className="h-4 w-4 text-blue-400 flex-shrink-0" />
                          <span>{opt}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
