'use client';

/**
 * Variant Analytics Panel - Real-time A/B Test Performance
 * Provides live charting and comparison of campaign variants
 */

import React, { useState, useEffect } from 'react';
import { api } from '../utils/trpc';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
  Area,
  AreaChart,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Users,
  Mail,
  MousePointer,
  DollarSign,
  Clock,
  Trophy,
  AlertTriangle,
  CheckCircle,
  Zap,
  BarChart3,
  Activity,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Minus,
  Play,
  Pause,
  Stop,
} from 'lucide-react';

interface VariantAnalyticsPanelProps {
  campaignId?: string;
  testId?: string;
  className?: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // seconds
}

interface ABTestData {
  id: string;
  name: string;
  status: 'running' | 'completed' | 'winner_declared' | 'paused';
  progress: number;
  variants: VariantPerformance[];
  timeline: TimelineData[];
  insights: TestInsight[];
  recommendation: TestRecommendation;
  statisticalSignificance: {
    isSignificant: boolean;
    pValue: number;
    confidenceLevel: number;
  };
}

interface VariantPerformance {
  id: string;
  name: string;
  status: 'active' | 'winner' | 'loser' | 'paused';
  metrics: {
    impressions: number;
    opens: number;
    clicks: number;
    conversions: number;
    revenue: number;
    openRate: number;
    clickRate: number;
    conversionRate: number;
    revenuePerUser: number;
  };
  lift: number;
  confidence: number;
  trafficAllocation: number;
  color: string;
}

interface TimelineData {
  timestamp: string;
  hour: number;
  variants: Record<
    string,
    {
      openRate: number;
      clickRate: number;
      conversionRate: number;
      impressions: number;
    }
  >;
}

interface TestInsight {
  type: 'positive' | 'negative' | 'neutral' | 'warning';
  title: string;
  description: string;
  confidence: number;
  action?: string;
}

interface TestRecommendation {
  action: 'continue' | 'declare_winner' | 'stop_test' | 'extend_duration';
  reason: string;
  confidence: number;
  expectedLift?: number;
  estimatedRevenue?: number;
}

export default function VariantAnalyticsPanel({
  campaignId,
  testId,
  className = '',
  autoRefresh = true,
  refreshInterval = 30,
}: VariantAnalyticsPanelProps): JSX.Element {
  const [selectedMetric, setSelectedMetric] = useState<
    'openRate' | 'clickRate' | 'conversionRate' | 'revenue'
  >('conversionRate');
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | '7d'>('24h');
  const [showConfidenceIntervals, setShowConfidenceIntervals] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Mock data - replace with real tRPC calls
  const mockABTestData: ABTestData = {
    id: 'test_001',
    name: 'Holiday Email Campaign A/B Test',
    status: 'running',
    progress: 65,
    variants: [
      {
        id: 'variant_a',
        name: 'Control (Original)',
        status: 'active',
        metrics: {
          impressions: 5420,
          opens: 1407,
          clicks: 267,
          conversions: 89,
          revenue: 2670,
          openRate: 26.0,
          clickRate: 19.0,
          conversionRate: 33.3,
          revenuePerUser: 0.49,
        },
        lift: 0,
        confidence: 0.95,
        trafficAllocation: 50,
        color: '#00f2ff',
      },
      {
        id: 'variant_b',
        name: 'Personalized Subject',
        status: 'winner',
        metrics: {
          impressions: 5380,
          opens: 1531,
          clicks: 321,
          conversions: 118,
          revenue: 3540,
          openRate: 28.5,
          clickRate: 21.0,
          conversionRate: 36.8,
          revenuePerUser: 0.66,
        },
        lift: 32.6,
        confidence: 0.98,
        trafficAllocation: 50,
        color: '#b347d9',
      },
    ],
    timeline: generateMockTimeline(),
    insights: [
      {
        type: 'positive',
        title: 'Strong Winner Detected',
        description: 'Variant B shows statistically significant improvement across all metrics',
        confidence: 0.98,
        action: 'Consider declaring winner',
      },
      {
        type: 'warning',
        title: 'Traffic Imbalance',
        description: 'Slight traffic allocation difference detected between variants',
        confidence: 0.75,
      },
      {
        type: 'positive',
        title: 'Revenue Impact',
        description: 'Estimated additional revenue of $2,400 from winner variant',
        confidence: 0.92,
      },
    ],
    recommendation: {
      action: 'declare_winner',
      reason: 'Variant B shows statistically significant improvement with 98% confidence',
      confidence: 0.98,
      expectedLift: 32.6,
      estimatedRevenue: 2400,
    },
    statisticalSignificance: {
      isSignificant: true,
      pValue: 0.02,
      confidenceLevel: 0.98,
    },
  };

  const [testData, setTestData] = useState<ABTestData>(mockABTestData);

  // Auto-refresh logic
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(async () => {
      setIsRefreshing(true);
      // Simulate data refresh
      await new Promise(resolve => setTimeout(resolve, 1000));
      // In real implementation, call tRPC to refresh data
      setIsRefreshing(false);
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  const handleDeclareWinner = async (variantId: string) => {
    try {
      // Call tRPC to declare winner
      console.log('Declaring winner:', variantId);
      // Update local state
      setTestData(prev => ({
        ...prev,
        status: 'winner_declared',
        variants: prev.variants.map(v => ({
          ...v,
          status: v.id === variantId ? 'winner' : 'loser',
        })),
      }));
    } catch (error) {
      console.error('Failed to declare winner:', error);
    }
  };

  const handleStopTest = async () => {
    try {
      // Call tRPC to stop test
      console.log('Stopping test');
      setTestData(prev => ({ ...prev, status: 'completed' }));
    } catch (error) {
      console.error('Failed to stop test:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Activity className="h-4 w-4 text-neon-green animate-pulse" />;
      case 'winner_declared':
        return <Trophy className="h-4 w-4 text-neon-blue" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-neon-green" />;
      case 'paused':
        return <Pause className="h-4 w-4 text-neon-purple" />;
      default:
        return <Clock className="h-4 w-4 text-secondary" />;
    }
  };

  const getVariantStatusBadge = (variant: VariantPerformance) => {
    switch (variant.status) {
      case 'winner':
        return (
          <Badge className="bg-neon-green text-black">
            <Trophy className="h-3 w-3 mr-1" />
            Winner
          </Badge>
        );
      case 'loser':
        return <Badge variant="destructive">Loser</Badge>;
      case 'active':
        return (
          <Badge className="bg-neon-blue text-black">
            <Activity className="h-3 w-3 mr-1" />
            Active
          </Badge>
        );
      case 'paused':
        return (
          <Badge variant="secondary">
            <Pause className="h-3 w-3 mr-1" />
            Paused
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getLiftIcon = (lift: number) => {
    if (lift > 0) return <ArrowUp className="h-4 w-4 text-neon-green" />;
    if (lift < 0) return <ArrowDown className="h-4 w-4 text-neon-pink" />;
    return <Minus className="h-4 w-4 text-secondary" />;
  };

  const formatMetric = (value: number, type: string) => {
    switch (type) {
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'currency':
        return `$${value.toFixed(2)}`;
      case 'number':
        return value.toLocaleString();
      default:
        return value.toString();
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="glass-strong p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-neon-blue to-neon-purple rounded-2xl flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-primary">{testData.name}</h2>
              <div className="flex items-center space-x-3 mt-1">
                {getStatusIcon(testData.status)}
                <span className="text-sm text-secondary capitalize">
                  {testData.status.replace('_', ' ')}
                </span>
                <div className="text-xs text-muted">•</div>
                <span className="text-sm text-secondary">{testData.progress}% Complete</span>
                {isRefreshing && <Sparkles className="h-4 w-4 text-neon-blue animate-spin" />}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {testData.status === 'running' && (
              <>
                <Button
                  onClick={() =>
                    handleDeclareWinner(testData.variants.find(v => v.lift > 0)?.id || '')
                  }
                  className="btn-neon-green"
                  disabled={!testData.statisticalSignificance.isSignificant}
                >
                  <Trophy className="h-4 w-4 mr-2" />
                  Declare Winner
                </Button>
                <Button
                  onClick={handleStopTest}
                  variant="outline"
                  className="border-neon-pink text-neon-pink hover:bg-neon-pink hover:text-black"
                >
                  <Stop className="h-4 w-4 mr-2" />
                  Stop Test
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-secondary">Test Progress</span>
            <span className="text-primary font-semibold">{testData.progress}%</span>
          </div>
          <Progress value={testData.progress} className="h-3 bg-glass" />
        </div>
      </div>

      {/* Variant Performance Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {testData.variants.map((variant, index) => (
          <Card key={variant.id} className="card-neon relative overflow-hidden">
            <div
              className="absolute top-0 left-0 w-full h-1"
              style={{ backgroundColor: variant.color }}
            />

            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{variant.name}</CardTitle>
                  <CardDescription>
                    Traffic: {variant.trafficAllocation}% • Confidence:{' '}
                    {(variant.confidence * 100).toFixed(1)}%
                  </CardDescription>
                </div>
                {getVariantStatusBadge(variant)}
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-neon-blue" />
                    <span className="text-sm text-secondary">Open Rate</span>
                  </div>
                  <div className="text-xl font-bold text-primary">
                    {formatMetric(variant.metrics.openRate, 'percentage')}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <MousePointer className="h-4 w-4 text-neon-purple" />
                    <span className="text-sm text-secondary">Click Rate</span>
                  </div>
                  <div className="text-xl font-bold text-primary">
                    {formatMetric(variant.metrics.clickRate, 'percentage')}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Target className="h-4 w-4 text-neon-green" />
                    <span className="text-sm text-secondary">Conversion</span>
                  </div>
                  <div className="text-xl font-bold text-primary">
                    {formatMetric(variant.metrics.conversionRate, 'percentage')}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-neon-pink" />
                    <span className="text-sm text-secondary">Revenue/User</span>
                  </div>
                  <div className="text-xl font-bold text-primary">
                    {formatMetric(variant.metrics.revenuePerUser, 'currency')}
                  </div>
                </div>
              </div>

              {/* Lift Indicator */}
              {index > 0 && (
                <div className="glass p-3 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getLiftIcon(variant.lift)}
                      <span className="text-sm text-secondary">Performance Lift</span>
                    </div>
                    <div
                      className={`text-lg font-bold ${
                        variant.lift > 0
                          ? 'text-neon-green'
                          : variant.lift < 0
                            ? 'text-neon-pink'
                            : 'text-secondary'
                      }`}
                    >
                      {variant.lift > 0 ? '+' : ''}
                      {variant.lift.toFixed(1)}%
                    </div>
                  </div>
                </div>
              )}

              {/* Sample Size */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-secondary">Sample Size</span>
                <span className="text-primary font-semibold">
                  {formatMetric(variant.metrics.impressions, 'number')}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Performance Charts */}
      <div className="glass-strong p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-primary">Performance Timeline</h3>

          <div className="flex items-center space-x-4">
            {/* Metric Selector */}
            <div className="flex items-center space-x-2">
              {[
                { key: 'openRate', label: 'Open Rate', icon: Mail },
                { key: 'clickRate', label: 'Click Rate', icon: MousePointer },
                { key: 'conversionRate', label: 'Conversion', icon: Target },
                { key: 'revenue', label: 'Revenue', icon: DollarSign },
              ].map(({ key, label, icon: Icon }) => (
                <Button
                  key={key}
                  variant={selectedMetric === key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedMetric(key as any)}
                  className={selectedMetric === key ? 'btn-neon' : ''}
                >
                  <Icon className="h-4 w-4 mr-1" />
                  {label}
                </Button>
              ))}
            </div>

            {/* Time Range Selector */}
            <div className="flex items-center space-x-1">
              {['1h', '6h', '24h', '7d'].map(range => (
                <Button
                  key={range}
                  variant={timeRange === range ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setTimeRange(range as any)}
                  className={timeRange === range ? 'btn-neon-purple text-xs' : 'text-xs'}
                >
                  {range}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Line Chart */}
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={testData.timeline}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis dataKey="hour" stroke="#9CA3AF" tick={{ fontSize: 12 }} />
              <YAxis
                stroke="#9CA3AF"
                tick={{ fontSize: 12 }}
                tickFormatter={value => `${value}%`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '12px',
                  color: '#F9FAFB',
                }}
                formatter={(value, name) => [`${Number(value).toFixed(1)}%`, name]}
              />
              <Legend />

              {testData.variants.map(variant => (
                <Line
                  key={variant.id}
                  type="monotone"
                  dataKey={`variants.${variant.id}.${selectedMetric}`}
                  stroke={variant.color}
                  strokeWidth={3}
                  dot={{ fill: variant.color, strokeWidth: 2, r: 4 }}
                  name={variant.name}
                  connectNulls={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Insights and Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Test Insights */}
        <Card className="card-neon">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-neon-blue" />
              <span>Test Insights</span>
            </CardTitle>
            <CardDescription>AI-generated insights based on performance data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {testData.insights.map((insight, index) => (
              <div key={index} className="glass p-4 rounded-xl">
                <div className="flex items-start space-x-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      insight.type === 'positive'
                        ? 'bg-neon-green'
                        : insight.type === 'negative'
                          ? 'bg-neon-pink'
                          : insight.type === 'warning'
                            ? 'bg-yellow-500'
                            : 'bg-gray-500'
                    }`}
                  >
                    {insight.type === 'positive' ? (
                      <TrendingUp className="h-4 w-4 text-black" />
                    ) : insight.type === 'negative' ? (
                      <TrendingDown className="h-4 w-4 text-white" />
                    ) : insight.type === 'warning' ? (
                      <AlertTriangle className="h-4 w-4 text-black" />
                    ) : (
                      <CheckCircle className="h-4 w-4 text-white" />
                    )}
                  </div>

                  <div className="flex-1">
                    <h4 className="font-semibold text-primary mb-1">{insight.title}</h4>
                    <p className="text-sm text-secondary mb-2">{insight.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted">
                        Confidence: {(insight.confidence * 100).toFixed(0)}%
                      </span>
                      {insight.action && (
                        <Button size="sm" variant="outline" className="text-xs">
                          {insight.action}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card className="card-neon">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-neon-purple" />
              <span>Recommendations</span>
            </CardTitle>
            <CardDescription>Next best actions based on current performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="glass p-4 rounded-xl">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-neon-blue to-neon-purple rounded-xl flex items-center justify-center">
                  {testData.recommendation.action === 'declare_winner' ? (
                    <Trophy className="h-5 w-5 text-white" />
                  ) : testData.recommendation.action === 'continue' ? (
                    <Play className="h-5 w-5 text-white" />
                  ) : testData.recommendation.action === 'stop_test' ? (
                    <Stop className="h-5 w-5 text-white" />
                  ) : (
                    <Clock className="h-5 w-5 text-white" />
                  )}
                </div>

                <div>
                  <h4 className="font-semibold text-primary capitalize">
                    {testData.recommendation.action.replace('_', ' ')}
                  </h4>
                  <p className="text-sm text-secondary">{testData.recommendation.reason}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-secondary">Confidence</span>
                  <span className="text-sm font-semibold text-primary">
                    {(testData.recommendation.confidence * 100).toFixed(1)}%
                  </span>
                </div>

                {testData.recommendation.expectedLift && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-secondary">Expected Lift</span>
                    <span className="text-sm font-semibold text-neon-green">
                      +{testData.recommendation.expectedLift.toFixed(1)}%
                    </span>
                  </div>
                )}

                {testData.recommendation.estimatedRevenue && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-secondary">Revenue Impact</span>
                    <span className="text-sm font-semibold text-neon-green">
                      +${testData.recommendation.estimatedRevenue.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Statistical Significance */}
            <div className="mt-4 glass p-4 rounded-xl">
              <h5 className="font-semibold text-primary mb-3">Statistical Significance</h5>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-secondary">P-Value</span>
                  <span className="text-sm font-semibold text-primary">
                    {testData.statisticalSignificance.pValue.toFixed(3)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-secondary">Confidence Level</span>
                  <span className="text-sm font-semibold text-primary">
                    {(testData.statisticalSignificance.confidenceLevel * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-secondary">Significant</span>
                  <div className="flex items-center space-x-2">
                    {testData.statisticalSignificance.isSignificant ? (
                      <CheckCircle className="h-4 w-4 text-neon-green" />
                    ) : (
                      <Clock className="h-4 w-4 text-neon-purple" />
                    )}
                    <span
                      className={`text-sm font-semibold ${
                        testData.statisticalSignificance.isSignificant
                          ? 'text-neon-green'
                          : 'text-neon-purple'
                      }`}
                    >
                      {testData.statisticalSignificance.isSignificant ? 'Yes' : 'Not Yet'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Helper function to generate mock timeline data
function generateMockTimeline(): TimelineData[] {
  const data: TimelineData[] = [];
  const now = new Date();

  for (let i = 23; i >= 0; i--) {
    const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
    const baseOpenA = 25 + Math.random() * 4;
    const baseOpenB = 27 + Math.random() * 4;

    data.push({
      timestamp: hour.toISOString(),
      hour: 24 - i,
      variants: {
        variant_a: {
          openRate: baseOpenA,
          clickRate: baseOpenA * 0.75,
          conversionRate: baseOpenA * 0.3,
          impressions: 200 + Math.floor(Math.random() * 100),
        },
        variant_b: {
          openRate: baseOpenB,
          clickRate: baseOpenB * 0.78,
          conversionRate: baseOpenB * 0.32,
          impressions: 195 + Math.floor(Math.random() * 100),
        },
      },
    });
  }

  return data;
}
