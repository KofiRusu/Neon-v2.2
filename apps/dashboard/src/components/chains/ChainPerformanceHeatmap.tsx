"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Clock, 
  DollarSign,
  Zap,
  AlertTriangle,
  BarChart3,
  PieChart,
  LineChart,
  Settings,
  Download,
  RefreshCw,
  Filter,
  Calendar,
  Target,
  Gauge
} from 'lucide-react';

// Types
interface HeatmapCell {
  x: string;
  y: string;
  value: number;
  intensity: number;
  metadata?: Record<string, any>;
}

interface TimeHeatmapData {
  time: string;
  value: number;
  category: string;
}

interface AgentHeatmapData {
  agentType: string;
  metric: string;
  value: number;
  intensity: number;
}

interface CostHeatmapData {
  period: string;
  agentType: string;
  cost: number;
  efficiency: number;
}

interface QualityHeatmapData {
  stepNumber: number;
  agentType: string;
  quality: number;
  confidence: number;
}

interface PerformanceMetrics {
  averageExecutionTime: number;
  averageCost: number;
  averageSuccessRate: number;
  totalExecutions: number;
  bottlenecks: Array<{
    type: string;
    location: string;
    severity: string;
    impact: number;
  }>;
}

interface ChainPerformanceHeatmapProps {
  chainIds?: string[];
  timeRange?: { start: Date; end: Date };
  className?: string;
}

const AGENT_COLORS = {
  CONTENT_AGENT: '#3B82F6',
  TREND_AGENT: '#10B981',
  SEO_AGENT: '#8B5CF6',
  SOCIAL_AGENT: '#EC4899',
  EMAIL_AGENT: '#F59E0B',
  SUPPORT_AGENT: '#EF4444'
};

const METRIC_TYPES = [
  { value: 'execution_time', label: 'Execution Time', icon: Clock },
  { value: 'cost', label: 'Cost', icon: DollarSign },
  { value: 'quality', label: 'Quality', icon: Zap },
  { value: 'success_rate', label: 'Success Rate', icon: Target },
  { value: 'efficiency', label: 'Efficiency', icon: Gauge }
];

const TIME_RANGES = [
  { value: '1h', label: 'Last Hour' },
  { value: '24h', label: 'Last 24 Hours' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' }
];

export default function ChainPerformanceHeatmap({ 
  chainIds, 
  timeRange, 
  className 
}: ChainPerformanceHeatmapProps) {
  const [heatmapData, setHeatmapData] = useState({
    timeHeatmap: [] as TimeHeatmapData[],
    agentHeatmap: [] as AgentHeatmapData[],
    costHeatmap: [] as CostHeatmapData[],
    qualityHeatmap: [] as QualityHeatmapData[]
  });

  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState('execution_time');
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');
  const [selectedView, setSelectedView] = useState('heatmap');
  const [intensityThreshold, setIntensityThreshold] = useState([50]);
  const [showBottlenecks, setShowBottlenecks] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Fetch heatmap data
  const fetchHeatmapData = async () => {
    try {
      setLoading(true);

      // Mock data - replace with actual API calls
      const mockTimeHeatmap: TimeHeatmapData[] = [];
      const mockAgentHeatmap: AgentHeatmapData[] = [];
      const mockCostHeatmap: CostHeatmapData[] = [];
      const mockQualityHeatmap: QualityHeatmapData[] = [];

      // Generate time heatmap data
      const agents = ['CONTENT_AGENT', 'TREND_AGENT', 'SEO_AGENT', 'SOCIAL_AGENT', 'EMAIL_AGENT', 'SUPPORT_AGENT'];
      const timeSlots = Array.from({ length: 24 }, (_, i) => {
        const hour = new Date();
        hour.setHours(hour.getHours() - (23 - i));
        return hour.toISOString().substring(0, 13) + ':00';
      });

      timeSlots.forEach(time => {
        agents.forEach(agent => {
          mockTimeHeatmap.push({
            time,
            value: Math.random() * 100 + 10,
            category: agent
          });
        });
      });

      // Generate agent performance heatmap
      const metrics = ['execution_time', 'cost', 'quality', 'success_rate', 'efficiency'];
      agents.forEach(agent => {
        metrics.forEach(metric => {
          const value = Math.random() * 100;
          mockAgentHeatmap.push({
            agentType: agent,
            metric,
            value,
            intensity: value / 100
          });
        });
      });

      // Generate cost heatmap
      const periods = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'];
      agents.forEach(agent => {
        periods.forEach(period => {
          const cost = Math.random() * 0.5;
          const efficiency = Math.random() * 100;
          mockCostHeatmap.push({
            period,
            agentType: agent,
            cost,
            efficiency
          });
        });
      });

      // Generate quality heatmap
      agents.forEach((agent, agentIndex) => {
        for (let step = 0; step < 5; step++) {
          mockQualityHeatmap.push({
            stepNumber: step,
            agentType: agent,
            quality: 0.7 + Math.random() * 0.3,
            confidence: 0.8 + Math.random() * 0.2
          });
        }
      });

      setHeatmapData({
        timeHeatmap: mockTimeHeatmap,
        agentHeatmap: mockAgentHeatmap,
        costHeatmap: mockCostHeatmap,
        qualityHeatmap: mockQualityHeatmap
      });

      // Mock performance metrics
      setPerformanceMetrics({
        averageExecutionTime: 180000,
        averageCost: 0.25,
        averageSuccessRate: 0.87,
        totalExecutions: 142,
        bottlenecks: [
          {
            type: 'time',
            location: 'CONTENT_AGENT',
            severity: 'high',
            impact: 0.3
          },
          {
            type: 'cost',
            location: 'SEO_AGENT',
            severity: 'medium',
            impact: 0.15
          }
        ]
      });

    } catch (error) {
      console.error('Failed to fetch heatmap data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch performance data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHeatmapData();

    if (autoRefresh) {
      const interval = setInterval(fetchHeatmapData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [chainIds, timeRange, selectedTimeRange, autoRefresh]);

  // Calculate heatmap cells for agent performance
  const agentHeatmapCells = useMemo(() => {
    const agents = Array.from(new Set(heatmapData.agentHeatmap.map(d => d.agentType)));
    const metrics = Array.from(new Set(heatmapData.agentHeatmap.map(d => d.metric)));

    return agents.flatMap(agent =>
      metrics.map(metric => {
        const data = heatmapData.agentHeatmap.find(d => d.agentType === agent && d.metric === metric);
        return {
          x: agent,
          y: metric,
          value: data?.value || 0,
          intensity: data?.intensity || 0,
          metadata: { agent, metric }
        };
      })
    );
  }, [heatmapData.agentHeatmap]);

  // Calculate intensity color
  const getIntensityColor = (intensity: number, baseColor: string = '#3B82F6') => {
    const opacity = Math.max(0.1, intensity);
    return `${baseColor}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
  };

  // Format value based on metric type
  const formatValue = (value: number, metric: string) => {
    switch (metric) {
      case 'execution_time':
        return `${Math.round(value)}s`;
      case 'cost':
        return `$${value.toFixed(3)}`;
      case 'quality':
      case 'success_rate':
      case 'efficiency':
        return `${Math.round(value)}%`;
      default:
        return value.toFixed(2);
    }
  };

  // Render agent performance heatmap
  const renderAgentHeatmap = () => {
    const agents = Array.from(new Set(heatmapData.agentHeatmap.map(d => d.agentType)));
    const metrics = Array.from(new Set(heatmapData.agentHeatmap.map(d => d.metric)));

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Agent Performance Matrix</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Intensity Threshold:</span>
            <div className="w-32">
              <Slider
                value={intensityThreshold}
                onValueChange={setIntensityThreshold}
                max={100}
                step={1}
                className="w-full"
              />
            </div>
            <span className="text-sm font-medium">{intensityThreshold[0]}%</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            <div className="grid gap-1" style={{ gridTemplateColumns: `150px repeat(${metrics.length}, 120px)` }}>
              {/* Header */}
              <div className="p-2"></div>
              {metrics.map(metric => (
                <div key={metric} className="p-2 text-center font-medium text-sm bg-gray-100 rounded">
                  {metric.replace('_', ' ').toUpperCase()}
                </div>
              ))}

              {/* Rows */}
              {agents.map(agent => (
                <React.Fragment key={agent}>
                  <div className="p-2 font-medium text-sm bg-gray-100 rounded flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-2" 
                      style={{ backgroundColor: AGENT_COLORS[agent as keyof typeof AGENT_COLORS] }}
                    ></div>
                    {agent.replace('_AGENT', '')}
                  </div>
                  {metrics.map(metric => {
                    const data = heatmapData.agentHeatmap.find(d => d.agentType === agent && d.metric === metric);
                    const intensity = data?.intensity || 0;
                    const value = data?.value || 0;
                    const isHighlighted = intensity * 100 >= intensityThreshold[0];

                    return (
                      <div
                        key={`${agent}-${metric}`}
                        className={`p-2 text-center text-sm border rounded transition-all duration-200 cursor-pointer ${
                          isHighlighted ? 'border-blue-500 shadow-sm' : 'border-gray-200'
                        }`}
                        style={{
                          backgroundColor: getIntensityColor(intensity, AGENT_COLORS[agent as keyof typeof AGENT_COLORS])
                        }}
                        title={`${agent} - ${metric}: ${formatValue(value, metric)}`}
                      >
                        <div className="font-medium">{formatValue(value, metric)}</div>
                        <div className="text-xs text-gray-600">{Math.round(intensity * 100)}%</div>
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render time-based heatmap
  const renderTimeHeatmap = () => {
    const timeSlots = Array.from(new Set(heatmapData.timeHeatmap.map(d => d.time))).sort();
    const agents = Array.from(new Set(heatmapData.timeHeatmap.map(d => d.category)));

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Execution Time Distribution</h3>
          <Select value={selectedMetric} onValueChange={setSelectedMetric}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {METRIC_TYPES.map(metric => (
                <SelectItem key={metric.value} value={metric.value}>
                  <div className="flex items-center gap-2">
                    <metric.icon className="h-4 w-4" />
                    {metric.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            <div className="grid gap-1" style={{ gridTemplateColumns: `100px repeat(${timeSlots.length}, 60px)` }}>
              {/* Header */}
              <div className="p-2"></div>
              {timeSlots.map(time => (
                <div key={time} className="p-1 text-center text-xs bg-gray-100 rounded">
                  {new Date(time).getHours().toString().padStart(2, '0')}:00
                </div>
              ))}

              {/* Rows */}
              {agents.map(agent => (
                <React.Fragment key={agent}>
                  <div className="p-2 text-sm bg-gray-100 rounded flex items-center">
                    <div 
                      className="w-2 h-2 rounded-full mr-2" 
                      style={{ backgroundColor: AGENT_COLORS[agent as keyof typeof AGENT_COLORS] }}
                    ></div>
                    {agent.replace('_AGENT', '').substring(0, 8)}
                  </div>
                  {timeSlots.map(time => {
                    const data = heatmapData.timeHeatmap.find(d => d.time === time && d.category === agent);
                    const value = data?.value || 0;
                    const intensity = value / 100;

                    return (
                      <div
                        key={`${agent}-${time}`}
                        className="p-1 text-center text-xs border rounded cursor-pointer transition-all duration-200 hover:shadow-sm"
                        style={{
                          backgroundColor: getIntensityColor(intensity, AGENT_COLORS[agent as keyof typeof AGENT_COLORS])
                        }}
                        title={`${agent} at ${new Date(time).toLocaleString()}: ${formatValue(value, selectedMetric)}`}
                      >
                        {Math.round(value)}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render cost analysis heatmap
  const renderCostHeatmap = () => {
    const periods = Array.from(new Set(heatmapData.costHeatmap.map(d => d.period))).sort();
    const agents = Array.from(new Set(heatmapData.costHeatmap.map(d => d.agentType)));

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Cost Efficiency Analysis</h3>

        <div className="grid grid-cols-2 gap-6">
          {/* Cost Distribution */}
          <div>
            <h4 className="font-medium mb-3">Cost by Time Period</h4>
            <div className="overflow-x-auto">
              <div className="grid gap-1" style={{ gridTemplateColumns: `120px repeat(${periods.length}, 80px)` }}>
                <div className="p-2"></div>
                {periods.map(period => (
                  <div key={period} className="p-2 text-center text-sm bg-gray-100 rounded">
                    {period}
                  </div>
                ))}

                {agents.map(agent => (
                  <React.Fragment key={agent}>
                    <div className="p-2 text-sm bg-gray-100 rounded">
                      {agent.replace('_AGENT', '')}
                    </div>
                    {periods.map(period => {
                      const data = heatmapData.costHeatmap.find(d => d.period === period && d.agentType === agent);
                      const cost = data?.cost || 0;
                      const intensity = cost / 0.5; // Normalize against max cost

                      return (
                        <div
                          key={`${agent}-${period}`}
                          className="p-2 text-center text-sm border rounded"
                          style={{
                            backgroundColor: getIntensityColor(intensity, '#EF4444')
                          }}
                          title={`${agent} at ${period}: $${cost.toFixed(3)}`}
                        >
                          ${cost.toFixed(3)}
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>

          {/* Efficiency Distribution */}
          <div>
            <h4 className="font-medium mb-3">Efficiency by Time Period</h4>
            <div className="overflow-x-auto">
              <div className="grid gap-1" style={{ gridTemplateColumns: `120px repeat(${periods.length}, 80px)` }}>
                <div className="p-2"></div>
                {periods.map(period => (
                  <div key={period} className="p-2 text-center text-sm bg-gray-100 rounded">
                    {period}
                  </div>
                ))}

                {agents.map(agent => (
                  <React.Fragment key={agent}>
                    <div className="p-2 text-sm bg-gray-100 rounded">
                      {agent.replace('_AGENT', '')}
                    </div>
                    {periods.map(period => {
                      const data = heatmapData.costHeatmap.find(d => d.period === period && d.agentType === agent);
                      const efficiency = data?.efficiency || 0;
                      const intensity = efficiency / 100;

                      return (
                        <div
                          key={`${agent}-${period}`}
                          className="p-2 text-center text-sm border rounded"
                          style={{
                            backgroundColor: getIntensityColor(intensity, '#10B981')
                          }}
                          title={`${agent} at ${period}: ${efficiency.toFixed(0)}% efficient`}
                        >
                          {efficiency.toFixed(0)}%
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render quality heatmap
  const renderQualityHeatmap = () => {
    const steps = Array.from(new Set(heatmapData.qualityHeatmap.map(d => d.stepNumber))).sort((a, b) => a - b);
    const agents = Array.from(new Set(heatmapData.qualityHeatmap.map(d => d.agentType)));

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Quality & Confidence Analysis</h3>

        <div className="grid grid-cols-2 gap-6">
          {/* Quality Scores */}
          <div>
            <h4 className="font-medium mb-3">Quality Scores by Step</h4>
            <div className="overflow-x-auto">
              <div className="grid gap-1" style={{ gridTemplateColumns: `120px repeat(${steps.length}, 80px)` }}>
                <div className="p-2"></div>
                {steps.map(step => (
                  <div key={step} className="p-2 text-center text-sm bg-gray-100 rounded">
                    Step {step}
                  </div>
                ))}

                {agents.map(agent => (
                  <React.Fragment key={agent}>
                    <div className="p-2 text-sm bg-gray-100 rounded">
                      {agent.replace('_AGENT', '')}
                    </div>
                    {steps.map(step => {
                      const data = heatmapData.qualityHeatmap.find(d => d.stepNumber === step && d.agentType === agent);
                      const quality = data?.quality || 0;
                      const intensity = quality;

                      return (
                        <div
                          key={`${agent}-${step}`}
                          className="p-2 text-center text-sm border rounded"
                          style={{
                            backgroundColor: getIntensityColor(intensity, '#8B5CF6')
                          }}
                          title={`${agent} Step ${step}: ${(quality * 100).toFixed(0)}% quality`}
                        >
                          {(quality * 100).toFixed(0)}%
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>

          {/* Confidence Scores */}
          <div>
            <h4 className="font-medium mb-3">Confidence Scores by Step</h4>
            <div className="overflow-x-auto">
              <div className="grid gap-1" style={{ gridTemplateColumns: `120px repeat(${steps.length}, 80px)` }}>
                <div className="p-2"></div>
                {steps.map(step => (
                  <div key={step} className="p-2 text-center text-sm bg-gray-100 rounded">
                    Step {step}
                  </div>
                ))}

                {agents.map(agent => (
                  <React.Fragment key={agent}>
                    <div className="p-2 text-sm bg-gray-100 rounded">
                      {agent.replace('_AGENT', '')}
                    </div>
                    {steps.map(step => {
                      const data = heatmapData.qualityHeatmap.find(d => d.stepNumber === step && d.agentType === agent);
                      const confidence = data?.confidence || 0;
                      const intensity = confidence;

                      return (
                        <div
                          key={`${agent}-${step}`}
                          className="p-2 text-center text-sm border rounded"
                          style={{
                            backgroundColor: getIntensityColor(intensity, '#F59E0B')
                          }}
                          title={`${agent} Step ${step}: ${(confidence * 100).toFixed(0)}% confidence`}
                        >
                          {(confidence * 100).toFixed(0)}%
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render performance summary
  const renderPerformanceSummary = () => {
    if (!performanceMetrics) return null;

    return (
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Avg Execution Time</p>
                <p className="font-semibold">{Math.round(performanceMetrics.averageExecutionTime / 1000)}s</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Avg Cost</p>
                <p className="font-semibold">${performanceMetrics.averageCost.toFixed(3)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Success Rate</p>
                <p className="font-semibold">{(performanceMetrics.averageSuccessRate * 100).toFixed(0)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Total Executions</p>
                <p className="font-semibold">{performanceMetrics.totalExecutions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Render bottlenecks
  const renderBottlenecks = () => {
    if (!performanceMetrics?.bottlenecks?.length) return null;

    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            Performance Bottlenecks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {performanceMetrics.bottlenecks.map((bottleneck, index) => {
              const severityColor = {
                low: 'bg-yellow-100 text-yellow-800',
                medium: 'bg-orange-100 text-orange-800',
                high: 'bg-red-100 text-red-800',
                critical: 'bg-red-200 text-red-900'
              }[bottleneck.severity] || 'bg-gray-100 text-gray-800';

              return (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Badge className={severityColor}>
                        {bottleneck.severity.toUpperCase()}
                      </Badge>
                      <span className="font-medium">{bottleneck.type.toUpperCase()}</span>
                    </div>
                    <span className="text-gray-600">{bottleneck.location}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-gray-600">Impact: </span>
                    <span className="font-medium">{(bottleneck.impact * 100).toFixed(0)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Performance Heatmap</h2>
          <p className="text-gray-600">Visual analysis of chain performance patterns</p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Switch
              checked={showBottlenecks}
              onCheckedChange={setShowBottlenecks}
              id="show-bottlenecks"
            />
            <Label htmlFor="show-bottlenecks" className="text-sm">Show Bottlenecks</Label>
          </div>
          
          <div className="flex items-center gap-2">
            <Switch
              checked={autoRefresh}
              onCheckedChange={setAutoRefresh}
              id="auto-refresh"
            />
            <Label htmlFor="auto-refresh" className="text-sm">Auto Refresh</Label>
          </div>

          <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIME_RANGES.map(range => (
                <SelectItem key={range.value} value={range.value}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchHeatmapData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Performance Summary */}
      {renderPerformanceSummary()}

      {/* Bottlenecks */}
      {showBottlenecks && renderBottlenecks()}

      {/* Heatmap Tabs */}
      <Card>
        <CardContent className="p-6">
          <Tabs defaultValue="agent" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="agent">Agent Performance</TabsTrigger>
              <TabsTrigger value="time">Time Distribution</TabsTrigger>
              <TabsTrigger value="cost">Cost Analysis</TabsTrigger>
              <TabsTrigger value="quality">Quality & Confidence</TabsTrigger>
            </TabsList>
            
            <TabsContent value="agent" className="mt-6">
              {renderAgentHeatmap()}
            </TabsContent>
            
            <TabsContent value="time" className="mt-6">
              {renderTimeHeatmap()}
            </TabsContent>
            
            <TabsContent value="cost" className="mt-6">
              {renderCostHeatmap()}
            </TabsContent>
            
            <TabsContent value="quality" className="mt-6">
              {renderQualityHeatmap()}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Object.entries(AGENT_COLORS).map(([agent, color]) => (
              <div key={agent} className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded-full" 
                  style={{ backgroundColor: color }}
                ></div>
                <span className="text-sm">{agent.replace('_AGENT', '')}</span>
              </div>
            ))}
          </div>
          
          <Separator className="my-4" />
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div className="space-y-1">
              <div className="font-medium">Intensity Scale:</div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-200 rounded"></div>
                <span>Low (0-25%)</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="font-medium invisible">.</div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-300 rounded"></div>
                <span>Medium (25-50%)</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="font-medium invisible">.</div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span>High (50-75%)</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="font-medium invisible">.</div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-700 rounded"></div>
                <span>Very High (75-100%)</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="font-medium">Hover:</div>
              <div className="text-gray-600">For detailed values</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 