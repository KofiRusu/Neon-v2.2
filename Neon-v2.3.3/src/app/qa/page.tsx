'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';

interface QAMetrics {
  lintErrors: {
    total: number;
    byModule: { [key: string]: number };
    trend: 'up' | 'down' | 'stable';
  };
  typeErrors: {
    total: number;
    byWorkspace: { [key: string]: number };
    trend: 'up' | 'down' | 'stable';
  };
  testResults: {
    passed: number;
    failed: number;
    coverage: number;
    trend: 'up' | 'down' | 'stable';
  };
  performance: {
    buildTime: number;
    bundleSize: number;
    lastRun: string;
  };
  ciStatus: {
    lastRun: string;
    success: boolean;
    duration: number;
  };
}

const QADashboard = () => {
  const [metrics, setMetrics] = useState<QAMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    // Simulate loading QA metrics
    const loadMetrics = async () => {
      setIsLoading(true);
      // In a real implementation, this would fetch from your QA API
      await new Promise(resolve => setTimeout(resolve, 1000));

      setMetrics({
        lintErrors: {
          total: 47,
          byModule: {
            'apps/dashboard': 23,
            'apps/api': 12,
            'packages/core-agents': 8,
            'packages/data-model': 4,
          },
          trend: 'down',
        },
        typeErrors: {
          total: 282,
          byWorkspace: {
            'apps/dashboard': 156,
            'apps/api': 89,
            'packages/core-agents': 31,
            'packages/utils': 6,
          },
          trend: 'down',
        },
        testResults: {
          passed: 245,
          failed: 12,
          coverage: 73.2,
          trend: 'up',
        },
        performance: {
          buildTime: 2.4,
          bundleSize: 1.2,
          lastRun: '2024-01-15T10:30:00Z',
        },
        ciStatus: {
          lastRun: '2024-01-15T10:45:00Z',
          success: true,
          duration: 4.2,
        },
      });

      setIsLoading(false);
      setLastUpdated(new Date());
    };

    loadMetrics();

    // Auto-refresh every 5 minutes
    const interval = setInterval(loadMetrics, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const refreshMetrics = () => {
    setMetrics(null);
    setIsLoading(true);
    // Trigger a fresh load
    setTimeout(() => {
      if (metrics) {
        setMetrics({ ...metrics });
        setIsLoading(false);
        setLastUpdated(new Date());
      }
    }, 1000);
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (value: number, threshold: number, inverted = false) => {
    const isGood = inverted ? value < threshold : value > threshold;
    return isGood ? 'text-green-500' : 'text-red-500';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-neon-blue" />
            <span className="ml-2 text-lg">Loading QA metrics...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  const errorBudgetUsed = ((metrics.lintErrors.total + metrics.typeErrors.total) / 500) * 100;
  const testHealthScore =
    (metrics.testResults.passed / (metrics.testResults.passed + metrics.testResults.failed)) * 100;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-neon-blue to-neon-purple bg-clip-text text-transparent">
              Quality Assurance Dashboard
            </h1>
            <p className="text-gray-400 mt-1">Last updated: {lastUpdated.toLocaleTimeString()}</p>
          </div>
          <Button
            onClick={refreshMetrics}
            className="bg-neon-blue hover:bg-neon-blue/80 text-white"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Error Budget Alert */}
        {errorBudgetUsed > 80 && (
          <Alert className="border-red-500 bg-red-950/20">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error Budget Alert</AlertTitle>
            <AlertDescription>
              Error budget is {errorBudgetUsed.toFixed(1)}% used. Consider prioritizing fixes.
            </AlertDescription>
          </Alert>
        )}

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Error Budget</CardTitle>
              {getTrendIcon('down')}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-neon-blue">{errorBudgetUsed.toFixed(1)}%</div>
              <Progress value={errorBudgetUsed} className="mt-2" />
              <p className="text-xs text-gray-400 mt-1">
                {metrics.lintErrors.total + metrics.typeErrors.total} total errors
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Test Health</CardTitle>
              {getTrendIcon(metrics.testResults.trend)}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getStatusColor(testHealthScore, 90)}`}>
                {testHealthScore.toFixed(1)}%
              </div>
              <p className="text-xs text-gray-400">
                {metrics.testResults.passed} passed, {metrics.testResults.failed} failed
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Code Coverage</CardTitle>
              {getTrendIcon(metrics.testResults.trend)}
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${getStatusColor(metrics.testResults.coverage, 70)}`}
              >
                {metrics.testResults.coverage}%
              </div>
              <Progress value={metrics.testResults.coverage} className="mt-2" />
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">CI Status</CardTitle>
              {metrics.ciStatus.success ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${metrics.ciStatus.success ? 'text-green-500' : 'text-red-500'}`}
              >
                {metrics.ciStatus.success ? 'Passing' : 'Failing'}
              </div>
              <p className="text-xs text-gray-400">{metrics.ciStatus.duration}min build time</p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Metrics */}
        <Tabs defaultValue="lint" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-gray-900">
            <TabsTrigger value="lint" className="data-[state=active]:bg-neon-blue">
              Lint Errors
            </TabsTrigger>
            <TabsTrigger value="types" className="data-[state=active]:bg-neon-blue">
              Type Errors
            </TabsTrigger>
            <TabsTrigger value="tests" className="data-[state=active]:bg-neon-blue">
              Test Results
            </TabsTrigger>
            <TabsTrigger value="performance" className="data-[state=active]:bg-neon-blue">
              Performance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="lint" className="space-y-4">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  ESLint Errors by Module
                  <Badge variant="outline" className="text-red-400 border-red-400">
                    {metrics.lintErrors.total} total
                  </Badge>
                </CardTitle>
                <CardDescription>Code quality issues across workspaces</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(metrics.lintErrors.byModule).map(([module, count]) => (
                    <div key={module} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{module}</span>
                      <div className="flex items-center gap-2">
                        <Progress
                          value={(count / metrics.lintErrors.total) * 100}
                          className="w-24"
                        />
                        <Badge
                          variant={
                            count > 20 ? 'destructive' : count > 10 ? 'default' : 'secondary'
                          }
                        >
                          {count}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="types" className="space-y-4">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  TypeScript Errors by Workspace
                  <Badge variant="outline" className="text-red-400 border-red-400">
                    {metrics.typeErrors.total} total
                  </Badge>
                </CardTitle>
                <CardDescription>Type safety issues requiring attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(metrics.typeErrors.byWorkspace).map(([workspace, count]) => (
                    <div key={workspace} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{workspace}</span>
                      <div className="flex items-center gap-2">
                        <Progress
                          value={(count / metrics.typeErrors.total) * 100}
                          className="w-24"
                        />
                        <Badge
                          variant={
                            count > 100 ? 'destructive' : count > 50 ? 'default' : 'secondary'
                          }
                        >
                          {count}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tests" className="space-y-4">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle>Test Results Summary</CardTitle>
                <CardDescription>Unit and integration test status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-500">
                      {metrics.testResults.passed}
                    </div>
                    <p className="text-sm text-gray-400">Passed</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-500">
                      {metrics.testResults.failed}
                    </div>
                    <p className="text-sm text-gray-400">Failed</p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Coverage</span>
                    <span className="text-sm text-gray-400">{metrics.testResults.coverage}%</span>
                  </div>
                  <Progress value={metrics.testResults.coverage} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Build and runtime performance indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium mb-1">Build Time</p>
                    <p className="text-2xl font-bold text-neon-blue">
                      {metrics.performance.buildTime}min
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Bundle Size</p>
                    <p className="text-2xl font-bold text-neon-purple">
                      {metrics.performance.bundleSize}MB
                    </p>
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-800">
                  <p className="text-xs text-gray-400">
                    Last measured: {new Date(metrics.performance.lastRun).toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Items */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-neon-blue">Recommended Actions</CardTitle>
            <CardDescription>Priority fixes based on current metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.typeErrors.total > 250 && (
                <Alert className="border-red-500 bg-red-950/20">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    High TypeScript error count ({metrics.typeErrors.total}). Focus on
                    apps/dashboard first.
                  </AlertDescription>
                </Alert>
              )}
              {metrics.testResults.coverage < 70 && (
                <Alert className="border-yellow-500 bg-yellow-950/20">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Test coverage below target (70%). Add tests for core-agents package.
                  </AlertDescription>
                </Alert>
              )}
              {metrics.testResults.failed > 10 && (
                <Alert className="border-red-500 bg-red-950/20">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {metrics.testResults.failed} failing tests. Review and fix broken test cases.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default QADashboard;
