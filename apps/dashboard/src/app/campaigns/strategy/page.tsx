'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Play,
  Pause,
  Square,
  RefreshCw,
  Settings,
  BarChart3,
  Calendar,
  DollarSign,
  Users,
  Target,
  Zap,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Download,
  Upload,
  Copy,
  Trash2,
} from 'lucide-react';

// Simplified agent node component without ReactFlow
const AgentNode = ({ data }: { data: any }) => {
  const getAgentIcon = (agentType: string) => {
    const icons: Record<string, React.ReactNode> = {
      'trend-agent': <TrendingUp className="w-4 h-4" />,
      'content-agent': <Users className="w-4 h-4" />,
      'brand-voice-agent': <Target className="w-4 h-4" />,
      'social-agent': <Users className="w-4 h-4" />,
      'email-agent': <Users className="w-4 h-4" />,
      'ad-agent': <DollarSign className="w-4 h-4" />,
      'seo-agent': <TrendingUp className="w-4 h-4" />,
      'design-agent': <Settings className="w-4 h-4" />,
      'outreach-agent': <Users className="w-4 h-4" />,
      'insight-agent': <BarChart3 className="w-4 h-4" />,
    };
    return icons[agentType] || <Zap className="w-4 h-4" />;
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-3 h-3 text-green-400" />;
      case 'running':
        return <RefreshCw className="w-3 h-3 text-blue-400 animate-spin" />;
      case 'failed':
        return <XCircle className="w-3 h-3 text-red-400" />;
      case 'pending':
        return <Clock className="w-3 h-3 text-yellow-400" />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-slate-900/95 backdrop-blur-xl border border-blue-500/30 rounded-lg p-3 min-w-[200px] shadow-lg shadow-blue-500/10">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1 bg-blue-500/20 rounded border border-blue-400/30">
            {getAgentIcon(data.agent)}
          </div>
          <span className="text-white font-medium text-sm">
            {data.agent.replace('-', ' ').toUpperCase()}
          </span>
        </div>
        {getStatusIcon(data.status)}
      </div>

      <div className="text-blue-100 text-xs mb-2 line-clamp-2">{data.action}</div>

      <div className="flex flex-wrap gap-1 mb-2">
        <Badge
          variant="outline"
          className="text-xs bg-purple-500/20 text-purple-300 border-purple-400/30"
        >
          {data.stage}
        </Badge>
        <Badge
          variant="outline"
          className="text-xs bg-green-500/20 text-green-300 border-green-400/30"
        >
          {data.priority}
        </Badge>
      </div>

      <div className="flex justify-between text-xs text-slate-400">
        <span>{data.estimatedDuration}min</span>
        {data.performanceScore && <span className="text-blue-300">{data.performanceScore}%</span>}
      </div>
    </div>
  );
};

export default function CampaignStrategyPage() {
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('build');
  const [strategyNodes, setStrategyNodes] = useState<any[]>([]);

  // Strategy form state
  const [strategyForm, setStrategyForm] = useState({
    goal: {
      type: 'product_launch' as const,
      objective: '',
      kpis: [{ metric: 'conversions' as const, target: 1000, timeframe: '30 days' }],
      budget: { total: 10000, allocation: {} },
    },
    audience: {
      segment: 'consumer' as const,
      demographics: {
        ageRange: '25-45',
        interests: ['technology'],
        painPoints: ['efficiency'],
        channels: ['social', 'email'],
      },
      persona: {
        name: 'Tech Professional',
        description: 'Early adopter professional',
        motivations: ['productivity'],
        objections: ['cost'],
      },
    },
    context: {
      timeline: {
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
      channels: ['social', 'email', 'content'] as const,
    },
  });

  // Simplified strategy visualization
  const visualizeStrategy = useCallback((strategy: any) => {
    if (!strategy) return;

    const mockNodes = [
      {
        id: '1',
        agent: 'trend-agent',
        action: 'Analyze market trends',
        stage: 'research',
        priority: 'high',
        estimatedDuration: 15,
        performanceScore: 94,
        status: 'completed',
      },
      {
        id: '2',
        agent: 'content-agent',
        action: 'Generate campaign content',
        stage: 'creation',
        priority: 'high',
        estimatedDuration: 30,
        performanceScore: 87,
        status: 'running',
      },
      {
        id: '3',
        agent: 'social-agent',
        action: 'Schedule social posts',
        stage: 'distribution',
        priority: 'medium',
        estimatedDuration: 10,
        performanceScore: 92,
        status: 'pending',
      },
      {
        id: '4',
        agent: 'ad-agent',
        action: 'Optimize ad campaigns',
        stage: 'optimization',
        priority: 'high',
        estimatedDuration: 20,
        performanceScore: 89,
        status: 'pending',
      },
    ];

    setStrategyNodes(mockNodes);
  }, []);

  // Generate new strategy
  const handleGenerateStrategy = async () => {
    setIsGenerating(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockStrategy = {
        id: 'strategy-1',
        name: 'Product Launch Campaign',
        actions: [],
      };
      
      visualizeStrategy(mockStrategy);
      setSelectedStrategy(mockStrategy.id);
    } catch (error) {
      console.error('Failed to generate strategy:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Campaign Strategy Builder</h1>
          <p className="text-blue-200">
            Design autonomous marketing campaigns with AI agent collaboration
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-slate-800/50 border border-blue-500/30">
            <TabsTrigger value="build" className="data-[state=active]:bg-blue-600">
              Build
            </TabsTrigger>
            <TabsTrigger value="visualize" className="data-[state=active]:bg-blue-600">
              Visualize
            </TabsTrigger>
            <TabsTrigger value="templates" className="data-[state=active]:bg-blue-600">
              Templates
            </TabsTrigger>
          </TabsList>

          {/* Build Tab */}
          <TabsContent value="build" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Strategy Form */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="bg-slate-900/50 border-blue-500/30 backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Target className="w-5 h-5 text-blue-400" />
                      Campaign Goal
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-blue-200">Campaign Type</Label>
                      <Select
                        value={strategyForm.goal.type}
                        onValueChange={(value: any) =>
                          setStrategyForm(prev => ({
                            ...prev,
                            goal: { ...prev.goal, type: value },
                          }))
                        }
                      >
                        <SelectTrigger className="bg-slate-800 border-blue-500/30 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-blue-500/30">
                          <SelectItem value="product_launch">Product Launch</SelectItem>
                          <SelectItem value="seasonal_promo">Seasonal Promotion</SelectItem>
                          <SelectItem value="b2b_outreach">B2B Outreach</SelectItem>
                          <SelectItem value="retargeting">Retargeting</SelectItem>
                          <SelectItem value="brand_awareness">Brand Awareness</SelectItem>
                          <SelectItem value="lead_generation">Lead Generation</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-blue-200">Objective</Label>
                      <Textarea
                        value={strategyForm.goal.objective}
                        onChange={e =>
                          setStrategyForm(prev => ({
                            ...prev,
                            goal: { ...prev.goal, objective: e.target.value },
                          }))
                        }
                        placeholder="Describe your campaign objective..."
                        className="bg-slate-800 border-blue-500/30 text-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-blue-200">Target Conversions</Label>
                        <Input
                          type="number"
                          value={strategyForm.goal.kpis[0].target}
                          onChange={e =>
                            setStrategyForm(prev => ({
                              ...prev,
                              goal: {
                                ...prev.goal,
                                kpis: [{ ...prev.goal.kpis[0], target: parseInt(e.target.value) }],
                              },
                            }))
                          }
                          className="bg-slate-800 border-blue-500/30 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-blue-200">Budget</Label>
                        <Input
                          type="number"
                          value={strategyForm.goal.budget.total}
                          onChange={e =>
                            setStrategyForm(prev => ({
                              ...prev,
                              goal: {
                                ...prev.goal,
                                budget: { ...prev.goal.budget, total: parseInt(e.target.value) },
                              },
                            }))
                          }
                          className="bg-slate-800 border-blue-500/30 text-white"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <div className="space-y-6">
                <Card className="bg-slate-900/50 border-green-500/30 backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Zap className="w-5 h-5 text-green-400" />
                      Generate Strategy
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button
                      onClick={handleGenerateStrategy}
                      disabled={isGenerating}
                      className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                    >
                      {isGenerating ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 mr-2" />
                          Generate Strategy
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Visualize Tab */}
          <TabsContent value="visualize" className="space-y-6">
            <Card className="bg-slate-900/50 border-blue-500/30 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white">Strategy Visualization</CardTitle>
                <CardDescription className="text-blue-200">
                  Agent workflow and collaboration overview
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {strategyNodes.map((node) => (
                    <AgentNode key={node.id} data={node} />
                  ))}
                </div>
                {strategyNodes.length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Generate a strategy to see the agent workflow visualization</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="bg-slate-900/50 border-blue-500/30 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-white">Product Launch</CardTitle>
                  <CardDescription className="text-blue-200">
                    Complete product launch campaign with multi-channel approach
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">
                    Use Template
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 border-blue-500/30 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-white">B2B Outreach</CardTitle>
                  <CardDescription className="text-blue-200">
                    Targeted B2B lead generation and nurturing workflow
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">
                    Use Template
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 border-blue-500/30 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-white">Seasonal Campaign</CardTitle>
                  <CardDescription className="text-blue-200">
                    Holiday and seasonal promotional campaigns
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">
                    Use Template
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
