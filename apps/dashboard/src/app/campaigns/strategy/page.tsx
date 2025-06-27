'use client';

import React, { useState, useCallback, useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';
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
import { trpc } from '@/utils/trpc';

// Custom node component for agents
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

const nodeTypes = {
  agentNode: AgentNode,
};

export default function CampaignStrategyPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('build');

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

  // tRPC hooks
  const { data: strategies, refetch: refetchStrategies } = trpc.strategy.getRecent.useQuery({
    limit: 10,
  });
  const { data: templates } = trpc.strategy.getTemplates.useQuery({});
  const generateStrategyMutation = trpc.strategy.generateStrategy.useMutation();
  const generateFromTemplateMutation = trpc.strategy.generateFromTemplate.useMutation();
  const executeStrategyMutation = trpc.strategy.executeStrategy.useMutation();

  const onConnect = useCallback(
    (params: Connection) => setEdges(eds => addEdge(params, eds)),
    [setEdges]
  );

  // Convert strategy to ReactFlow nodes and edges
  const visualizeStrategy = useCallback(
    (strategy: any) => {
      if (!strategy) return;

      const newNodes: Node[] = [];
      const newEdges: Edge[] = [];

      // Create nodes for each action
      strategy.actions.forEach((action: any, index: number) => {
        const stageIndex = strategy.timeline.findIndex((t: any) => t.actions.includes(action.id));

        const node: Node = {
          id: action.id,
          type: 'agentNode',
          position: {
            x: (index % 4) * 250 + 50,
            y: Math.floor(index / 4) * 150 + stageIndex * 80 + 50,
          },
          data: {
            ...action,
            status: 'pending', // This would come from execution state
          },
        };
        newNodes.push(node);

        // Create edges based on dependencies
        action.dependsOn.forEach((depId: string) => {
          newEdges.push({
            id: `${depId}-${action.id}`,
            source: depId,
            target: action.id,
            type: 'smoothstep',
            style: { stroke: '#3b82f6', strokeWidth: 2 },
            markerEnd: { type: 'arrowclosed', color: '#3b82f6' },
          });
        });
      });

      setNodes(newNodes);
      setEdges(newEdges);
    },
    [setNodes, setEdges]
  );

  // Generate new strategy
  const handleGenerateStrategy = async () => {
    setIsGenerating(true);
    try {
      const result = await generateStrategyMutation.mutateAsync(strategyForm);
      if (result.success) {
        visualizeStrategy(result.strategy);
        setSelectedStrategy(result.strategy.id);
        await refetchStrategies();
      }
    } catch (error) {
      console.error('Failed to generate strategy:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate from template
  const handleGenerateFromTemplate = async (templateId: string) => {
    setIsGenerating(true);
    try {
      const result = await generateFromTemplateMutation.mutateAsync({
        templateId,
        customizations: {
          name: `Campaign from ${templateId}`,
          context: {
            timeline: strategyForm.context.timeline,
            channels: strategyForm.context.channels,
          },
        },
      });
      if (result.success) {
        visualizeStrategy(result.strategy);
        setSelectedStrategy(result.strategy.id);
        await refetchStrategies();
      }
    } catch (error) {
      console.error('Failed to generate strategy from template:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Execute strategy
  const handleExecuteStrategy = async () => {
    if (!selectedStrategy) return;

    try {
      const result = await executeStrategyMutation.mutateAsync({ id: selectedStrategy });
      if (result.success) {
        // Update node statuses or refresh execution state
        console.log('Strategy execution initialized:', result.executionState);
      }
    } catch (error) {
      console.error('Failed to execute strategy:', error);
    }
  };

  useEffect(() => {
    if (strategies && strategies.length > 0 && !selectedStrategy) {
      const latestStrategy = strategies[0];
      setSelectedStrategy(latestStrategy.id);
      visualizeStrategy(latestStrategy);
    }
  }, [strategies, selectedStrategy, visualizeStrategy]);

  const currentStrategy = strategies?.find(s => s.id === selectedStrategy);

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
          <TabsList className="grid w-full grid-cols-4 bg-slate-800/50 border border-blue-500/30">
            <TabsTrigger value="build" className="data-[state=active]:bg-blue-600">
              Build
            </TabsTrigger>
            <TabsTrigger value="visualize" className="data-[state=active]:bg-blue-600">
              Visualize
            </TabsTrigger>
            <TabsTrigger value="templates" className="data-[state=active]:bg-blue-600">
              Templates
            </TabsTrigger>
            <TabsTrigger value="manage" className="data-[state=active]:bg-blue-600">
              Manage
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

                <Card className="bg-slate-900/50 border-blue-500/30 backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Users className="w-5 h-5 text-purple-400" />
                      Target Audience
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-blue-200">Segment</Label>
                        <Select
                          value={strategyForm.audience.segment}
                          onValueChange={(value: any) =>
                            setStrategyForm(prev => ({
                              ...prev,
                              audience: { ...prev.audience, segment: value },
                            }))
                          }
                        >
                          <SelectTrigger className="bg-slate-800 border-blue-500/30 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-blue-500/30">
                            <SelectItem value="enterprise">Enterprise</SelectItem>
                            <SelectItem value="smb">Small/Medium Business</SelectItem>
                            <SelectItem value="agencies">Agencies</SelectItem>
                            <SelectItem value="ecommerce">E-commerce</SelectItem>
                            <SelectItem value="saas">SaaS</SelectItem>
                            <SelectItem value="consumer">Consumer</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-blue-200">Age Range</Label>
                        <Input
                          value={strategyForm.audience.demographics.ageRange}
                          onChange={e =>
                            setStrategyForm(prev => ({
                              ...prev,
                              audience: {
                                ...prev.audience,
                                demographics: {
                                  ...prev.audience.demographics,
                                  ageRange: e.target.value,
                                },
                              },
                            }))
                          }
                          className="bg-slate-800 border-blue-500/30 text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-blue-200">Persona Name</Label>
                      <Input
                        value={strategyForm.audience.persona.name}
                        onChange={e =>
                          setStrategyForm(prev => ({
                            ...prev,
                            audience: {
                              ...prev.audience,
                              persona: { ...prev.audience.persona, name: e.target.value },
                            },
                          }))
                        }
                        className="bg-slate-800 border-blue-500/30 text-white"
                      />
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
                          <Play className="w-4 h-4 mr-2" />
                          Generate Campaign
                        </>
                      )}
                    </Button>

                    {currentStrategy && (
                      <Button
                        onClick={handleExecuteStrategy}
                        variant="outline"
                        className="w-full border-blue-500/30 text-blue-300 hover:bg-blue-600/20"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Execute Strategy
                      </Button>
                    )}
                  </CardContent>
                </Card>

                {currentStrategy && (
                  <Card className="bg-slate-900/50 border-blue-500/30 backdrop-blur-xl">
                    <CardHeader>
                      <CardTitle className="text-white text-sm">Current Strategy</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="text-blue-100 font-medium">{currentStrategy.name}</div>
                      <div className="flex flex-wrap gap-2">
                        <Badge className="bg-blue-500/20 text-blue-300">
                          {currentStrategy.actions.length} Actions
                        </Badge>
                        <Badge className="bg-green-500/20 text-green-300">
                          ${currentStrategy.estimatedCost.toLocaleString()}
                        </Badge>
                        <Badge className="bg-purple-500/20 text-purple-300">
                          {currentStrategy.estimatedDuration} days
                        </Badge>
                      </div>
                      <div className="text-sm text-slate-400">
                        Success Probability: {currentStrategy.successProbability.toFixed(1)}%
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Visualize Tab */}
          <TabsContent value="visualize" className="space-y-6">
            <div className="h-[800px] bg-slate-900/50 backdrop-blur-xl rounded-lg border border-blue-500/30 overflow-hidden">
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                fitView
                className="reactflow-dark"
              >
                <Background color="#1e40af" gap={20} />
                <Controls className="bg-slate-800 border-blue-500/30" />
                <MiniMap
                  className="bg-slate-800 border-blue-500/30"
                  nodeColor="#3b82f6"
                  maskColor="rgba(0, 0, 0, 0.8)"
                />
                <Panel position="top-right" className="space-y-2">
                  <div className="bg-slate-900/90 backdrop-blur-xl border border-blue-500/30 rounded-lg p-3">
                    <div className="text-white text-sm font-medium mb-2">Legend</div>
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-3 h-3 text-green-400" />
                        <span className="text-slate-300">Completed</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <RefreshCw className="w-3 h-3 text-blue-400" />
                        <span className="text-slate-300">Running</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-yellow-400" />
                        <span className="text-slate-300">Pending</span>
                      </div>
                    </div>
                  </div>
                </Panel>
              </ReactFlow>
            </div>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates?.map(template => (
                <Card
                  key={template.id}
                  className="bg-slate-900/50 border-blue-500/30 backdrop-blur-xl"
                >
                  <CardHeader>
                    <CardTitle className="text-white text-lg">{template.name}</CardTitle>
                    <CardDescription className="text-blue-200">
                      {template.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <Badge className="bg-purple-500/20 text-purple-300">
                        {template.category}
                      </Badge>
                      <Badge className="bg-blue-500/20 text-blue-300">{template.complexity}</Badge>
                      <Badge className="bg-green-500/20 text-green-300">
                        {template.estimatedDuration} days
                      </Badge>
                    </div>

                    <div className="text-sm text-slate-400">
                      <div>Stages: {template.stages.length}</div>
                      <div>Channels: {template.recommendedChannels.join(', ')}</div>
                    </div>

                    <Button
                      onClick={() => handleGenerateFromTemplate(template.id)}
                      disabled={isGenerating}
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    >
                      Use Template
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Manage Tab */}
          <TabsContent value="manage" className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              {strategies?.map(strategy => (
                <Card
                  key={strategy.id}
                  className="bg-slate-900/50 border-blue-500/30 backdrop-blur-xl"
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-white">{strategy.name}</CardTitle>
                        <CardDescription className="text-blue-200">
                          Created {new Date(strategy.createdAt).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          className={`${
                            strategy.status === 'completed'
                              ? 'bg-green-500/20 text-green-300'
                              : strategy.status === 'executing'
                                ? 'bg-blue-500/20 text-blue-300'
                                : strategy.status === 'failed'
                                  ? 'bg-red-500/20 text-red-300'
                                  : 'bg-yellow-500/20 text-yellow-300'
                          }`}
                        >
                          {strategy.status}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-300">
                          {strategy.actions.length}
                        </div>
                        <div className="text-sm text-slate-400">Actions</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-300">
                          ${strategy.estimatedCost.toLocaleString()}
                        </div>
                        <div className="text-sm text-slate-400">Budget</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-300">
                          {strategy.estimatedDuration}
                        </div>
                        <div className="text-sm text-slate-400">Days</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-300">
                          {strategy.successProbability.toFixed(0)}%
                        </div>
                        <div className="text-sm text-slate-400">Success Rate</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedStrategy(strategy.id);
                          visualizeStrategy(strategy);
                          setActiveTab('visualize');
                        }}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <BarChart3 className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-blue-500/30 text-blue-300"
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        Clone
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-blue-500/30 text-blue-300"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Export
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
