"use client";

import React, { useState, useMemo } from "react";
import { 
  useSEOAlerts, 
  useMarkSEOAlertResolved, 
  useMarkSEOAlertRead, 
  useGenerateSEOAlerts,
  useSEOAlertTrends,
  type SEOAlert,
  type SEOAlertSummary 
} from "../../hooks/useSEO";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "../ui/select";
import { Input } from "../ui/input";
import { Separator } from "../ui/separator";
import { ScrollArea } from "../ui/scroll-area";
import { 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  CheckCircle, 
  Clock, 
  Filter, 
  Search, 
  RefreshCw,
  Eye,
  EyeOff,
  Lightbulb,
  TrendingUp,
  ArrowUp,
  ArrowDown,
  Minus,
  ExternalLink,
  Settings,
  Download,
  BarChart3
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "../ui/dialog";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "../ui/tooltip";
import { Alert, AlertDescription } from "../ui/alert";
import { Progress } from "../ui/progress";
import { format } from "date-fns";
import { cn } from "../../lib/utils";
import { toast } from "react-hot-toast";

interface SEOAlertsPanelProps {
  campaignId?: string;
  className?: string;
}

interface AlertFilterOptions {
  severity: ("info" | "warning" | "critical")[];
  status: "all" | "resolved" | "unresolved";
  alertType: string;
  timeframe: "all" | "24h" | "7d" | "30d";
  search: string;
}

const ALERT_TYPE_LABELS = {
  score_drop: "Score Drop",
  keyword_cannibalization: "Keyword Cannibalization",
  missing_metadata: "Missing Metadata",
  opportunity: "Opportunity",
  critical_issue: "Critical Issue",
} as const;

const SEVERITY_COLORS = {
  critical: "bg-red-500/10 text-red-600 border-red-500/20",
  warning: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  info: "bg-blue-500/10 text-blue-600 border-blue-500/20",
} as const;

const SEVERITY_ICONS = {
  critical: AlertCircle,
  warning: AlertTriangle,
  info: Info,
} as const;

export function SEOAlertsPanel({ campaignId, className }: SEOAlertsPanelProps) {
  const [filters, setFilters] = useState<AlertFilterOptions>({
    severity: ["critical", "warning", "info"],
    status: "all",
    alertType: "all",
    timeframe: "all",
    search: "",
  });
  
  const [selectedAlert, setSelectedAlert] = useState<SEOAlert | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch alerts data
  const { 
    data: alertsData, 
    isLoading, 
    error, 
    refetch 
  } = useSEOAlerts(campaignId, {
    severity: filters.severity,
    isResolved: filters.status === "resolved" ? true : filters.status === "unresolved" ? false : undefined,
    limit: 100,
  });

  // Fetch trends data
  const { data: trendsData } = useSEOAlertTrends(campaignId, "30d");

  // Mutations
  const resolveAlert = useMarkSEOAlertResolved();
  const markAsRead = useMarkSEOAlertRead();
  const generateAlerts = useGenerateSEOAlerts();

  // Filter and sort alerts
  const filteredAlerts = useMemo(() => {
    if (!alertsData?.alerts) return [];
    
    let filtered = [...alertsData.alerts];
    
    // Apply search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(alert => 
        alert.title.toLowerCase().includes(searchTerm) ||
        alert.message.toLowerCase().includes(searchTerm) ||
        alert.url.toLowerCase().includes(searchTerm)
      );
    }
    
    // Apply alert type filter
    if (filters.alertType !== "all") {
      filtered = filtered.filter(alert => alert.alertType === filters.alertType);
    }
    
    // Apply timeframe filter
    if (filters.timeframe !== "all") {
      const now = new Date();
      const timeframeDays = filters.timeframe === "24h" ? 1 : 
                           filters.timeframe === "7d" ? 7 : 30;
      const cutoff = new Date(now.getTime() - timeframeDays * 24 * 60 * 60 * 1000);
      
      filtered = filtered.filter(alert => 
        new Date(alert.createdAt!) > cutoff
      );
    }
    
    // Sort by priority (highest first) and then by creation date (newest first)
    filtered.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      return new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime();
    });
    
    return filtered;
  }, [alertsData?.alerts, filters]);

  // Handle alert actions
  const handleResolveAlert = async (alertId: string) => {
    try {
      await resolveAlert.mutateAsync({ alertId });
      refetch();
    } catch (error) {
      console.error('Failed to resolve alert:', error);
    }
  };

  const handleMarkAsRead = async (alertId: string) => {
    try {
      await markAsRead.mutateAsync({ alertId });
      refetch();
    } catch (error) {
      console.error('Failed to mark alert as read:', error);
    }
  };

  const handleGenerateAlerts = async () => {
    if (!campaignId) {
      toast.error("Please select a campaign first");
      return;
    }
    
    setIsGenerating(true);
    try {
      await generateAlerts.mutateAsync({ 
        campaignId,
        timeframe: "24h",
      });
      refetch();
    } catch (error) {
      console.error('Failed to generate alerts:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportAlerts = () => {
    if (!filteredAlerts.length) {
      toast.error("No alerts to export");
      return;
    }
    
    const csvData = filteredAlerts.map(alert => ({
      URL: alert.url,
      Type: ALERT_TYPE_LABELS[alert.alertType as keyof typeof ALERT_TYPE_LABELS] || alert.alertType,
      Severity: alert.severity,
      Title: alert.title,
      Message: alert.message,
      Priority: alert.priority,
      Status: alert.isResolved ? "Resolved" : "Open",
      Created: format(new Date(alert.createdAt!), "yyyy-MM-dd HH:mm"),
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(","),
      ...csvData.map(row => Object.values(row).map(value => `"${value}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `seo-alerts-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Alerts exported successfully");
  };

  // Get alert type options
  const alertTypeOptions = useMemo(() => {
    const types = new Set(alertsData?.alerts?.map(alert => alert.alertType) || []);
    return Array.from(types).map(type => ({
      value: type,
      label: ALERT_TYPE_LABELS[type as keyof typeof ALERT_TYPE_LABELS] || type,
    }));
  }, [alertsData?.alerts]);

  if (error) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="p-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load SEO alerts: {error.message}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">SEO Alerts</h2>
          <p className="text-muted-foreground">
            Monitor and manage SEO issues and opportunities
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportAlerts}
            disabled={!filteredAlerts.length}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
            Refresh
          </Button>
          <Button
            onClick={handleGenerateAlerts}
            disabled={isGenerating || !campaignId}
            size="sm"
          >
            <BarChart3 className={cn("h-4 w-4 mr-2", isGenerating && "animate-spin")} />
            Generate Alerts
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {alertsData?.summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Alerts</p>
                  <p className="text-2xl font-bold">{alertsData.summary.total}</p>
                </div>
                <div className="p-2 bg-blue-500/10 rounded-full">
                  <AlertCircle className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Critical</p>
                  <p className="text-2xl font-bold text-red-600">{alertsData.summary.critical}</p>
                </div>
                <div className="p-2 bg-red-500/10 rounded-full">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Warning</p>
                  <p className="text-2xl font-bold text-yellow-600">{alertsData.summary.warning}</p>
                </div>
                <div className="p-2 bg-yellow-500/10 rounded-full">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Unresolved</p>
                  <p className="text-2xl font-bold">{alertsData.summary.unresolved}</p>
                </div>
                <div className="p-2 bg-gray-500/10 rounded-full">
                  <Clock className="h-5 w-5 text-gray-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search alerts..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10"
              />
            </div>

            {/* Severity Filter */}
            <Select
              value={filters.severity.join(",")}
              onValueChange={(value) => {
                const severities = value.split(",").filter(Boolean) as ("info" | "warning" | "critical")[];
                setFilters(prev => ({ ...prev, severity: severities }));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="critical,warning,info">All Severities</SelectItem>
                <SelectItem value="critical">Critical Only</SelectItem>
                <SelectItem value="warning">Warning Only</SelectItem>
                <SelectItem value="info">Info Only</SelectItem>
                <SelectItem value="critical,warning">Critical & Warning</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select
              value={filters.status}
              onValueChange={(value: "all" | "resolved" | "unresolved") => 
                setFilters(prev => ({ ...prev, status: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="unresolved">Unresolved</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>

            {/* Alert Type Filter */}
            <Select
              value={filters.alertType}
              onValueChange={(value) => setFilters(prev => ({ ...prev, alertType: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Alert Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {alertTypeOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Timeframe Filter */}
            <Select
              value={filters.timeframe}
              onValueChange={(value: "all" | "24h" | "7d" | "30d") => 
                setFilters(prev => ({ ...prev, timeframe: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="24h">Last 24 Hours</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Active Filters Summary */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Showing {filteredAlerts.length} of {alertsData?.alerts?.length || 0} alerts</span>
            {filters.search && (
              <Badge variant="secondary">
                Search: {filters.search}
              </Badge>
            )}
            {filters.status !== "all" && (
              <Badge variant="secondary">
                {filters.status === "resolved" ? "Resolved" : "Unresolved"}
              </Badge>
            )}
            {filters.alertType !== "all" && (
              <Badge variant="secondary">
                {ALERT_TYPE_LABELS[filters.alertType as keyof typeof ALERT_TYPE_LABELS] || filters.alertType}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Alerts List */}
      <Card>
        <CardHeader>
          <CardTitle>Alerts ({filteredAlerts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <div className="space-y-4">
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-20 bg-gray-200 rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : filteredAlerts.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No alerts found matching your criteria</p>
                </div>
              ) : (
                filteredAlerts.map((alert) => (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                    onResolve={handleResolveAlert}
                    onMarkAsRead={handleMarkAsRead}
                    onViewDetails={() => setSelectedAlert(alert)}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Alert Details Modal */}
      {selectedAlert && (
        <Dialog open={!!selectedAlert} onOpenChange={() => setSelectedAlert(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {React.createElement(SEVERITY_ICONS[selectedAlert.severity], { 
                  className: "h-5 w-5" 
                })}
                {selectedAlert.title}
              </DialogTitle>
              <DialogDescription>
                Alert details and recommendations
              </DialogDescription>
            </DialogHeader>
            <AlertDetails alert={selectedAlert} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Alert Card Component
function AlertCard({ 
  alert, 
  onResolve, 
  onMarkAsRead, 
  onViewDetails 
}: {
  alert: SEOAlert;
  onResolve: (id: string) => void;
  onMarkAsRead: (id: string) => void;
  onViewDetails: () => void;
}) {
  const SeverityIcon = SEVERITY_ICONS[alert.severity];
  
  return (
    <Card className={cn(
      "transition-all duration-200 hover:shadow-md",
      !alert.isRead && "border-l-4 border-l-blue-500",
      alert.isResolved && "opacity-60"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className={cn("p-2 rounded-full", SEVERITY_COLORS[alert.severity])}>
              <SeverityIcon className="h-4 w-4" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-sm">{alert.title}</h3>
                <Badge variant="outline" className="text-xs">
                  {ALERT_TYPE_LABELS[alert.alertType as keyof typeof ALERT_TYPE_LABELS] || alert.alertType}
                </Badge>
                <Badge variant="outline" className={cn("text-xs", SEVERITY_COLORS[alert.severity])}>
                  {alert.severity}
                </Badge>
                {alert.isResolved && (
                  <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600">
                    Resolved
                  </Badge>
                )}
              </div>
              
              <p className="text-sm text-muted-foreground mb-2">{alert.message}</p>
              
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <ExternalLink className="h-3 w-3" />
                  <span className="truncate max-w-[200px]">{alert.url}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{format(new Date(alert.createdAt!), "MMM d, HH:mm")}</span>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  <span>Priority: {alert.priority}</span>
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
                    onClick={() => onMarkAsRead(alert.id!)}
                    disabled={alert.isRead}
                  >
                    {alert.isRead ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {alert.isRead ? "Mark as unread" : "Mark as read"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <Button
              variant="outline"
              size="sm"
              onClick={onViewDetails}
            >
              View Details
            </Button>
            
            {!alert.isResolved && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onResolve(alert.id!)}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Resolve
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Alert Details Component
function AlertDetails({ alert }: { alert: SEOAlert }) {
  const SeverityIcon = SEVERITY_ICONS[alert.severity];
  
  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="font-semibold mb-2">Alert Information</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">URL:</span>
              <span className="font-mono text-right">{alert.url}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type:</span>
              <span>{ALERT_TYPE_LABELS[alert.alertType as keyof typeof ALERT_TYPE_LABELS] || alert.alertType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Priority:</span>
              <span>{alert.priority}/10</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created:</span>
              <span>{format(new Date(alert.createdAt!), "MMM d, yyyy HH:mm")}</span>
            </div>
          </div>
        </div>
        
        <div>
          <h4 className="font-semibold mb-2">Metrics</h4>
          <div className="space-y-2 text-sm">
            {alert.currentValue !== undefined && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current Value:</span>
                <span>{alert.currentValue}</span>
              </div>
            )}
            {alert.previousValue !== undefined && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Previous Value:</span>
                <span>{alert.previousValue}</span>
              </div>
            )}
            {alert.threshold !== undefined && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Threshold:</span>
                <span>{alert.threshold}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Analysis */}
      {alert.aiReason && (
        <div>
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            AI Analysis
          </h4>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm">{alert.aiReason}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recommendations */}
      {alert.suggestion && (
        <div>
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Recommendations
          </h4>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm">{alert.suggestion}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Metadata */}
      {alert.metadata && Object.keys(alert.metadata).length > 0 && (
        <div>
          <h4 className="font-semibold mb-2">Additional Details</h4>
          <Card>
            <CardContent className="p-4">
              <pre className="text-xs text-muted-foreground overflow-x-auto">
                {JSON.stringify(alert.metadata, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
} 