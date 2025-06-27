'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/utils/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
// Table component - will be added separately or create inline
interface TableProps {
  children: React.ReactNode;
  className?: string;
}

const Table = ({ children, className }: TableProps) => (
  <div className={`w-full ${className}`}>
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">{children}</table>
    </div>
  </div>
);

const TableHeader = ({ children }: { children: React.ReactNode }) => (
  <thead className="bg-slate-800/50">{children}</thead>
);

const TableBody = ({ children }: { children: React.ReactNode }) => <tbody>{children}</tbody>;

const TableRow = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <tr className={`border-b ${className}`}>{children}</tr>
);

const TableHead = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <th className={`px-4 py-3 text-left font-medium ${className}`}>{children}</th>
);

const TableCell = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <td className={`px-4 py-3 ${className}`}>{children}</td>
);
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Activity,
  Calendar,
  Settings,
  Target,
  Zap,
} from 'lucide-react';

const COLORS = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#6366F1'];

export default function AdminBudgetPage() {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    return new Date().toISOString().slice(0, 7); // YYYY-MM format
  });
  const [budgetAmount, setBudgetAmount] = useState<string>('1000');
  const [budgetOverride, setBudgetOverride] = useState<boolean>(false);

  // tRPC queries
  const { data: monthlyData, refetch: refetchMonthly } =
    api.billing.getMonthlySpendSummary.useQuery({
      month: selectedMonth,
    });

  const { data: campaignsData } = api.billing.getAllCampaignsSpend.useQuery({});

  // tRPC mutations
  const setBudgetMutation = api.billing.setMonthlyBudgetCap.useMutation({
    onSuccess: () => {
      refetchMonthly();
    },
  });

  const setBudgetOverrideMutation = api.billing.setBudgetOverride.useMutation({
    onSuccess: () => {
      // Could add success notification here
    },
  });

  const handleSetBudget = async () => {
    try {
      await setBudgetMutation.mutateAsync({
        month: selectedMonth,
        amount: parseFloat(budgetAmount),
      });
    } catch (error) {
      console.error('Failed to set budget:', error);
    }
  };

  const handleBudgetOverrideToggle = async (enabled: boolean) => {
    try {
      setBudgetOverride(enabled);
      await setBudgetOverrideMutation.mutateAsync({
        enabled,
        month: selectedMonth,
      });
    } catch (error) {
      console.error('Failed to set budget override:', error);
      // Revert the toggle state on error
      setBudgetOverride(!enabled);
    }
  };

  // Prepare chart data
  const campaignChartData =
    monthlyData?.campaignBreakdown?.map((campaign: any, index: number) => ({
      name: campaign.name,
      cost: parseFloat(campaign.cost.toFixed(2)),
      tokens: campaign.tokens,
      color: COLORS[index % COLORS.length],
    })) || [];

  const agentUsageData = monthlyData?.campaignBreakdown?.reduce(
    (acc: Record<string, any>, campaign: any) => {
      Object.entries(campaign.agents).forEach(([agentType, data]: [string, any]) => {
        if (!acc[agentType]) {
          acc[agentType] = { name: agentType, cost: 0, executions: 0 };
        }
        acc[agentType].cost += data.cost;
        acc[agentType].executions += data.executions;
      });
      return acc;
    },
    {} as Record<string, any>
  );

  const agentChartData = Object.values(agentUsageData || {});

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Enterprise Budget Dashboard</h1>
            <p className="text-slate-400">Monitor AI agent spend and manage budget caps</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-slate-400" />
              <Input
                type="month"
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-200">Monthly Budget</CardTitle>
              <Target className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                ${monthlyData?.budgetAmount?.toFixed(2) || '0.00'}
              </div>
              <p className="text-xs text-slate-400 mt-1">Set for {selectedMonth}</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-200">Total Spent</CardTitle>
              <DollarSign className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                ${monthlyData?.totalSpent?.toFixed(2) || '0.00'}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {monthlyData?.utilizationPercentage?.toFixed(1) || '0'}% of budget
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-200">Remaining Budget</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                ${monthlyData?.remainingBudget?.toFixed(2) || '0.00'}
              </div>
              <p className="text-xs text-slate-400 mt-1">Available to spend</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-200">Agent Executions</CardTitle>
              <Activity className="h-4 w-4 text-cyan-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {monthlyData?.totalExecutions || 0}
              </div>
              <p className="text-xs text-slate-400 mt-1">This month</p>
            </CardContent>
          </Card>
        </div>

        {/* Budget Alerts */}
        {monthlyData?.isNearBudget && (
          <Alert className="bg-orange-900/20 border-orange-600">
            <AlertTriangle className="h-4 w-4 text-orange-400" />
            <AlertDescription className="text-orange-200">
              {monthlyData.isOverBudget
                ? `🔥 Budget exceeded! You've spent $${monthlyData.totalSpent.toFixed(2)} of your $${monthlyData.budgetAmount.toFixed(2)} budget.`
                : `⚠️ Approaching budget limit! You've used ${monthlyData.utilizationPercentage.toFixed(1)}% of your monthly budget.`}
            </AlertDescription>
          </Alert>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-slate-800 border-slate-700">
            <TabsTrigger value="overview" className="data-[state=active]:bg-purple-600">
              Overview
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="data-[state=active]:bg-purple-600">
              Campaigns
            </TabsTrigger>
            <TabsTrigger value="agents" className="data-[state=active]:bg-purple-600">
              Agents
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-purple-600">
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Campaign Spend Chart */}
              <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white">Campaign Spend Breakdown</CardTitle>
                  <CardDescription className="text-slate-400">
                    Cost distribution across campaigns
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={campaignChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: $${value}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="cost"
                        >
                          {campaignChartData.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Agent Usage Chart */}
              <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white">Agent Usage by Cost</CardTitle>
                  <CardDescription className="text-slate-400">
                    Which agents are consuming the most budget
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={agentChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis
                          dataKey="name"
                          stroke="#9CA3AF"
                          fontSize={12}
                          angle={-45}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis stroke="#9CA3AF" fontSize={12} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1F2937',
                            border: '1px solid #374151',
                            borderRadius: '8px',
                          }}
                        />
                        <Bar dataKey="cost" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="campaigns" className="space-y-6">
            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Campaign Spend Details</CardTitle>
                <CardDescription className="text-slate-400">
                  Detailed breakdown of spending per campaign
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700">
                      <TableHead className="text-slate-300">Campaign</TableHead>
                      <TableHead className="text-slate-300">Type</TableHead>
                      <TableHead className="text-slate-300">Total Cost</TableHead>
                      <TableHead className="text-slate-300">Executions</TableHead>
                      <TableHead className="text-slate-300">Top Agent</TableHead>
                      <TableHead className="text-slate-300">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monthlyData?.campaignBreakdown?.map((campaign: any) => {
                      const topAgent = Object.entries(campaign.agents).sort(
                        ([, a], [, b]) => (b as any).cost - (a as any).cost
                      )[0];

                      return (
                        <TableRow key={campaign.id} className="border-slate-700">
                          <TableCell className="text-white font-medium">{campaign.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="border-slate-600 text-slate-300">
                              {campaign.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-white">${campaign.cost.toFixed(2)}</TableCell>
                          <TableCell className="text-slate-300">{campaign.executions}</TableCell>
                          <TableCell>
                            {topAgent && (
                              <div className="flex items-center gap-2">
                                <Zap className="h-3 w-3 text-purple-400" />
                                <span className="text-slate-300 text-sm">
                                  {topAgent[0]} (${(topAgent[1] as any).cost.toFixed(2)})
                                </span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={campaign.cost > 50 ? 'destructive' : 'default'}
                              className={campaign.cost > 50 ? 'bg-red-900' : 'bg-green-900'}
                            >
                              {campaign.cost > 50 ? '🔥 High' : '✅ Normal'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="agents" className="space-y-6">
            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Agent Performance & Costs</CardTitle>
                <CardDescription className="text-slate-400">
                  Detailed breakdown of agent usage and costs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(agentUsageData || {}).map(([agentType, data]: [string, any]) => (
                    <Card key={agentType} className="bg-slate-800/50 border-slate-700">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm text-slate-200 flex items-center gap-2">
                          <Zap className="h-4 w-4 text-purple-400" />
                          {agentType}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-xs text-slate-400">Total Cost</span>
                          <span className="text-sm font-medium text-white">
                            ${data.cost.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-slate-400">Executions</span>
                          <span className="text-sm font-medium text-slate-300">
                            {data.executions}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-slate-400">Avg Cost</span>
                          <span className="text-sm font-medium text-slate-300">
                            ${(data.cost / data.executions).toFixed(3)}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Budget Management
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Set monthly budget caps and manage spending limits
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="text-sm font-medium text-slate-200 mb-2 block">
                      Monthly Budget for {selectedMonth}
                    </label>
                    <Input
                      type="number"
                      value={budgetAmount}
                      onChange={e => setBudgetAmount(e.target.value)}
                      className="bg-slate-800 border-slate-700 text-white"
                      placeholder="Enter budget amount"
                    />
                  </div>
                  <Button
                    onClick={handleSetBudget}
                    disabled={setBudgetMutation.isLoading}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-2 rounded-full font-medium transition-all duration-200 transform hover:scale-105"
                  >
                    {setBudgetMutation.isLoading ? 'Setting...' : 'Set Budget'}
                  </Button>
                </div>

                {/* Budget Override Controls */}
                <div className="p-6 bg-slate-800/70 rounded-xl border border-slate-600 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="budget-override" className="text-white font-medium">
                        Budget Override Control
                      </Label>
                      <p className="text-sm text-slate-400">
                        Temporarily allow agents to run despite exceeding monthly budget
                      </p>
                    </div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="budget-override"
                              checked={budgetOverride}
                              onCheckedChange={handleBudgetOverrideToggle}
                              disabled={setBudgetOverrideMutation.isLoading}
                              className="data-[state=checked]:bg-orange-500"
                            />
                            <Label htmlFor="budget-override" className="text-sm text-slate-300">
                              {budgetOverride ? 'Override Enabled' : 'Override Disabled'}
                            </Label>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="bg-slate-800 border-slate-600 text-white max-w-xs">
                          <p>
                            When enabled, agents can execute tasks even when the monthly budget is
                            exceeded. All override executions are logged for audit purposes.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  {budgetOverride && (
                    <Alert className="bg-orange-900/20 border-orange-600">
                      <AlertTriangle className="h-4 w-4 text-orange-400" />
                      <AlertDescription className="text-orange-200">
                        ⚠️ Budget override is currently enabled. Agents can execute tasks despite
                        budget limits. All executions are being logged in{' '}
                        <code className="bg-slate-700 px-1 rounded">
                          logs/budget/override-executions.md
                        </code>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                  <h4 className="text-sm font-medium text-slate-200 mb-2">
                    Budget Enforcement Configuration
                  </h4>
                  <div className="space-y-2 text-sm text-slate-400">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                      <span>Warning at 80% budget utilization</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                      <span>Hard block when budget exceeded (unless override enabled)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      <span>
                        All blocked/override executions logged to{' '}
                        <code className="bg-slate-700 px-1 rounded text-xs">logs/budget/</code>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-r from-purple-900/20 to-blue-900/20 rounded-lg border border-purple-700/50">
                  <h4 className="text-sm font-medium text-purple-200 mb-2 flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Environment Variables
                  </h4>
                  <div className="space-y-1 text-xs font-mono text-slate-300">
                    <div>ALLOW_BUDGET_OVERRIDE={budgetOverride ? 'true' : 'false'}</div>
                    <div>MAX_MONTHLY_BUDGET=${budgetAmount}</div>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    These values are set dynamically and override environment file settings.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
