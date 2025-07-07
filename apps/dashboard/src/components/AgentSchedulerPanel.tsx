"use client";

import React, { useState, useMemo } from "react";
import { api } from "../utils/trpc";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "./ui/select";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Switch } from "./ui/switch";
import { Separator } from "./ui/separator";
import { ScrollArea } from "./ui/scroll-area";
import { 
  Clock, 
  Play, 
  Pause, 
  Trash2, 
  Edit, 
  Plus, 
  RefreshCw,
  Settings,
  History,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart3,
  Copy,
  Eye,
  FileTemplate,
  Zap,
  Timer
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "./ui/dialog";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "./ui/tooltip";
import { Alert, AlertDescription } from "./ui/alert";
import { Progress } from "./ui/progress";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "../lib/utils";
import { toast } from "react-hot-toast";

interface AgentSchedulerPanelProps {
  className?: string;
}

interface ScheduleFormData {
  agentType: string;
  name: string;
  description: string;
  cron: string;
  timezone: string;
  enabled: boolean;
  config: Record<string, any>;
  retryConfig: {
    maxRetries: number;
    retryDelay: number;
    backoffMultiplier: number;
    maxRetryDelay: number;
  };
  timeout: number;
}

const DEFAULT_FORM_DATA: ScheduleFormData = {
  agentType: "",
  name: "",
  description: "",
  cron: "0 9 * * *",
  timezone: "UTC",
  enabled: true,
  config: {},
  retryConfig: {
    maxRetries: 3,
    retryDelay: 5000,
    backoffMultiplier: 2,
    maxRetryDelay: 60000,
  },
  timeout: 300000,
};

export function AgentSchedulerPanel({ className }: AgentSchedulerPanelProps) {
  const [activeTab, setActiveTab] = useState("schedules");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null);
  const [formData, setFormData] = useState<ScheduleFormData>(DEFAULT_FORM_DATA);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");

  // Fetch data using tRPC hooks
  const { 
    data: schedulesData, 
    isLoading: schedulesLoading, 
    refetch: refetchSchedules 
  } = api.scheduler.getSchedules.useQuery();

  const { 
    data: templatesData, 
    isLoading: templatesLoading 
  } = api.scheduler.getScheduleTemplates.useQuery({});

  const { 
    data: cronPatternsData 
  } = api.scheduler.getCronPatterns.useQuery();

  const { 
    data: timezoneOptionsData 
  } = api.scheduler.getTimezoneOptions.useQuery();

  const { 
    data: retryPresetsData 
  } = api.scheduler.getRetryPresets.useQuery();

  const { 
    data: agentConfigsData 
  } = api.scheduler.getAgentConfigs.useQuery();

  const { 
    data: statisticsData 
  } = api.scheduler.getStatistics.useQuery();

  // Mutations
  const createSchedule = api.scheduler.createSchedule.useMutation({
    onSuccess: () => {
      toast.success("Schedule created successfully");
      setIsCreateDialogOpen(false);
      setFormData(DEFAULT_FORM_DATA);
      refetchSchedules();
    },
    onError: (error) => {
      toast.error(`Failed to create schedule: ${error.message}`);
    },
  });

  const updateSchedule = api.scheduler.updateSchedule.useMutation({
    onSuccess: () => {
      toast.success("Schedule updated successfully");
      setIsEditDialogOpen(false);
      setSelectedSchedule(null);
      refetchSchedules();
    },
    onError: (error) => {
      toast.error(`Failed to update schedule: ${error.message}`);
    },
  });

  const deleteSchedule = api.scheduler.deleteSchedule.useMutation({
    onSuccess: () => {
      toast.success("Schedule deleted successfully");
      refetchSchedules();
    },
    onError: (error) => {
      toast.error(`Failed to delete schedule: ${error.message}`);
    },
  });

  const toggleSchedule = api.scheduler.toggleSchedule.useMutation({
    onSuccess: (data) => {
      toast.success(`Schedule ${data.data?.enabled ? 'enabled' : 'disabled'} successfully`);
      refetchSchedules();
    },
    onError: (error) => {
      toast.error(`Failed to toggle schedule: ${error.message}`);
    },
  });

  const triggerSchedule = api.scheduler.triggerSchedule.useMutation({
    onSuccess: () => {
      toast.success("Schedule triggered successfully");
      refetchSchedules();
    },
    onError: (error) => {
      toast.error(`Failed to trigger schedule: ${error.message}`);
    },
  });

  const createFromTemplate = api.scheduler.createFromTemplate.useMutation({
    onSuccess: () => {
      toast.success("Schedule created from template successfully");
      refetchSchedules();
    },
    onError: (error) => {
      toast.error(`Failed to create from template: ${error.message}`);
    },
  });

  // Helper functions
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "running":
        return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-100 text-green-800 border-green-300";
      case "failed":
        return "bg-red-100 text-red-800 border-red-300";
      case "running":
        return "bg-blue-100 text-blue-800 border-blue-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const handleCreateSchedule = () => {
    createSchedule.mutate(formData);
  };

  const handleUpdateSchedule = () => {
    if (!selectedSchedule) return;
    updateSchedule.mutate({
      id: selectedSchedule.id,
      ...formData,
    });
  };

  const handleDeleteSchedule = (id: string) => {
    if (window.confirm("Are you sure you want to delete this schedule?")) {
      deleteSchedule.mutate({ id });
    }
  };

  const handleToggleSchedule = (id: string, enabled: boolean) => {
    toggleSchedule.mutate({ id, enabled });
  };

  const handleTriggerSchedule = (id: string) => {
    triggerSchedule.mutate({ id });
  };

  const handleEditSchedule = (schedule: any) => {
    setSelectedSchedule(schedule);
    setFormData({
      agentType: schedule.agentType,
      name: schedule.name || "",
      description: schedule.description || "",
      cron: schedule.cron,
      timezone: schedule.timezone,
      enabled: schedule.enabled,
      config: schedule.config || {},
      retryConfig: schedule.retryConfig || DEFAULT_FORM_DATA.retryConfig,
      timeout: schedule.timeout || 300000,
    });
    setIsEditDialogOpen(true);
  };

  const handleCreateFromTemplate = (templateId: string) => {
    createFromTemplate.mutate({ templateId });
  };

  const schedules = schedulesData?.data || [];
  const templates = templatesData?.data || [];
  const cronPatterns = cronPatternsData?.data || [];
  const timezoneOptions = timezoneOptionsData?.data || [];
  const retryPresets = retryPresetsData?.data || {};
  const agentConfigs = agentConfigsData?.data || {};
  const statistics = statisticsData?.data || {};

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Agent Scheduler</h2>
          <p className="text-muted-foreground">
            Manage AI agent schedules and monitor executions
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchSchedules()}
            disabled={schedulesLoading}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", schedulesLoading && "animate-spin")} />
            Refresh
          </Button>
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Schedule
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Schedules</p>
                <p className="text-2xl font-bold">{statistics.totalSchedules || 0}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-green-600">{statistics.activeSchedules || 0}</p>
              </div>
              <Play className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold">{Math.round(statistics.averageSuccessRate || 0)}%</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Executions</p>
                <p className="text-2xl font-bold">{statistics.totalExecutions || 0}</p>
              </div>
              <Zap className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="schedules">Schedules</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="history">Execution History</TabsTrigger>
        </TabsList>

        {/* Schedules Tab */}
        <TabsContent value="schedules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Schedules</CardTitle>
              <CardDescription>
                Manage your AI agent schedules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {schedulesLoading ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-20 bg-gray-200 rounded-lg"></div>
                        </div>
                      ))}
                    </div>
                  ) : schedules.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No schedules found</p>
                      <p className="text-sm text-muted-foreground">Create your first schedule to get started</p>
                    </div>
                  ) : (
                    schedules.map((schedule) => (
                      <ScheduleCard
                        key={schedule.id}
                        schedule={schedule}
                        agentConfigs={agentConfigs}
                        onEdit={handleEditSchedule}
                        onDelete={handleDeleteSchedule}
                        onToggle={handleToggleSchedule}
                        onTrigger={handleTriggerSchedule}
                      />
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Schedule Templates</CardTitle>
              <CardDescription>
                Use predefined templates to quickly create schedules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    agentConfigs={agentConfigs}
                    onUse={handleCreateFromTemplate}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Execution History</CardTitle>
              <CardDescription>
                View recent schedule executions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Execution history will be displayed here</p>
                <p className="text-sm text-muted-foreground">Select a schedule to view its execution history</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Schedule Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Create New Schedule</DialogTitle>
            <DialogDescription>
              Configure a new schedule for an AI agent
            </DialogDescription>
          </DialogHeader>
          <ScheduleForm
            formData={formData}
            setFormData={setFormData}
            agentConfigs={agentConfigs}
            cronPatterns={cronPatterns}
            timezoneOptions={timezoneOptions}
            retryPresets={retryPresets}
            onSubmit={handleCreateSchedule}
            onCancel={() => setIsCreateDialogOpen(false)}
            isLoading={createSchedule.isLoading}
            isEdit={false}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Schedule Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Edit Schedule</DialogTitle>
            <DialogDescription>
              Update schedule configuration
            </DialogDescription>
          </DialogHeader>
          <ScheduleForm
            formData={formData}
            setFormData={setFormData}
            agentConfigs={agentConfigs}
            cronPatterns={cronPatterns}
            timezoneOptions={timezoneOptions}
            retryPresets={retryPresets}
            onSubmit={handleUpdateSchedule}
            onCancel={() => setIsEditDialogOpen(false)}
            isLoading={updateSchedule.isLoading}
            isEdit={true}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Schedule Card Component
function ScheduleCard({ 
  schedule, 
  agentConfigs, 
  onEdit, 
  onDelete, 
  onToggle, 
  onTrigger 
}: {
  schedule: any;
  agentConfigs: any;
  onEdit: (schedule: any) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, enabled: boolean) => void;
  onTrigger: (id: string) => void;
}) {
  const agentConfig = agentConfigs[schedule.agentType];
  
  return (
    <Card className="transition-all duration-200 hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="p-2 rounded-lg bg-blue-100">
              <span className="text-2xl">{agentConfig?.icon || "🤖"}</span>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-sm">{schedule.name || `${schedule.agentType} Schedule`}</h3>
                <Badge variant={schedule.enabled ? "default" : "secondary"}>
                  {schedule.enabled ? "Active" : "Disabled"}
                </Badge>
                <Badge variant="outline" className={getStatusColor(schedule.lastStatus)}>
                  {getStatusIcon(schedule.lastStatus)}
                  <span className="ml-1">{schedule.lastStatus || "Pending"}</span>
                </Badge>
              </div>
              
              <p className="text-sm text-muted-foreground mb-2">
                {schedule.description || agentConfig?.description || "No description"}
              </p>
              
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{schedule.cron}</span>
                </div>
                {schedule.nextRun && (
                  <div className="flex items-center gap-1">
                    <Timer className="h-3 w-3" />
                    <span>Next: {formatDistanceToNow(new Date(schedule.nextRun), { addSuffix: true })}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <BarChart3 className="h-3 w-3" />
                  <span>{schedule.successRate?.toFixed(1) || 0}% success</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onToggle(schedule.id, !schedule.enabled)}
                  >
                    {schedule.enabled ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {schedule.enabled ? "Disable schedule" : "Enable schedule"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onTrigger(schedule.id)}
                    disabled={!schedule.enabled}
                  >
                    <Zap className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Trigger now
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(schedule)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(schedule.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Template Card Component
function TemplateCard({ 
  template, 
  agentConfigs, 
  onUse 
}: {
  template: any;
  agentConfigs: any;
  onUse: (templateId: string) => void;
}) {
  const agentConfig = agentConfigs[template.agentType];
  
  return (
    <Card className="transition-all duration-200 hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="p-2 rounded-lg bg-purple-100">
            <span className="text-xl">{agentConfig?.icon || "🤖"}</span>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm mb-1">{template.name}</h3>
            <p className="text-xs text-muted-foreground">{template.description}</p>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Schedule:</span>
            <Badge variant="outline">{template.cron}</Badge>
          </div>
          <div className="flex flex-wrap gap-1">
            {template.tags.map((tag: string) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
        
        <Button
          onClick={() => onUse(template.id)}
          className="w-full mt-3"
          size="sm"
        >
          <FileTemplate className="h-4 w-4 mr-2" />
          Use Template
        </Button>
      </CardContent>
    </Card>
  );
}

// Schedule Form Component
function ScheduleForm({ 
  formData, 
  setFormData, 
  agentConfigs, 
  cronPatterns, 
  timezoneOptions, 
  retryPresets, 
  onSubmit, 
  onCancel, 
  isLoading, 
  isEdit 
}: {
  formData: ScheduleFormData;
  setFormData: (data: ScheduleFormData) => void;
  agentConfigs: any;
  cronPatterns: any[];
  timezoneOptions: any[];
  retryPresets: any;
  onSubmit: () => void;
  onCancel: () => void;
  isLoading: boolean;
  isEdit: boolean;
}) {
  const updateFormData = (field: keyof ScheduleFormData, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Agent Type */}
        <div className="space-y-2">
          <Label>Agent Type</Label>
          <Select
            value={formData.agentType}
            onValueChange={(value) => updateFormData('agentType', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select agent type" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(agentConfigs).map(([key, config]: [string, any]) => (
                <SelectItem key={key} value={key}>
                  <div className="flex items-center gap-2">
                    <span>{config.icon}</span>
                    <span>{config.displayName}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Name */}
        <div className="space-y-2">
          <Label>Name</Label>
          <Input
            value={formData.name}
            onChange={(e) => updateFormData('name', e.target.value)}
            placeholder="Schedule name"
          />
        </div>

        {/* Cron Expression */}
        <div className="space-y-2">
          <Label>Schedule (Cron)</Label>
          <Select
            value={formData.cron}
            onValueChange={(value) => updateFormData('cron', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select schedule" />
            </SelectTrigger>
            <SelectContent>
              {cronPatterns.map((pattern) => (
                <SelectItem key={pattern.id} value={pattern.expression}>
                  <div>
                    <div className="font-medium">{pattern.name}</div>
                    <div className="text-xs text-muted-foreground">{pattern.expression}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Timezone */}
        <div className="space-y-2">
          <Label>Timezone</Label>
          <Select
            value={formData.timezone}
            onValueChange={(value) => updateFormData('timezone', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select timezone" />
            </SelectTrigger>
            <SelectContent>
              {timezoneOptions.map((tz) => (
                <SelectItem key={tz.value} value={tz.value}>
                  {tz.label} ({tz.offset})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => updateFormData('description', e.target.value)}
          placeholder="Schedule description"
          rows={3}
        />
      </div>

      {/* Enabled Toggle */}
      <div className="flex items-center space-x-2">
        <Switch
          id="enabled"
          checked={formData.enabled}
          onCheckedChange={(checked) => updateFormData('enabled', checked)}
        />
        <Label htmlFor="enabled">Enable schedule</Label>
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-2">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          onClick={onSubmit}
          disabled={isLoading || !formData.agentType || !formData.cron}
        >
          {isLoading ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : null}
          {isEdit ? "Update" : "Create"} Schedule
        </Button>
      </div>
    </div>
  );
}

export default AgentSchedulerPanel; 