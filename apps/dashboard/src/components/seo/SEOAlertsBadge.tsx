"use client";

import React from "react";
import { useSEOAlertsCount } from "../../hooks/useSEO";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "../ui/tooltip";
import { AlertCircle, AlertTriangle, Info } from "lucide-react";
import { cn } from "../../lib/utils";

interface SEOAlertsBadgeProps {
  campaignId?: string;
  className?: string;
  variant?: "badge" | "icon" | "full";
  showTooltip?: boolean;
  size?: "sm" | "md" | "lg";
}

export function SEOAlertsBadge({ 
  campaignId, 
  className, 
  variant = "badge",
  showTooltip = true,
  size = "md"
}: SEOAlertsBadgeProps) {
  const alertsCount = useSEOAlertsCount(campaignId);

  // Don't render if no alerts
  if (alertsCount.total === 0) {
    return null;
  }

  // Determine severity and styling
  const severity = alertsCount.critical > 0 ? "critical" : 
                  alertsCount.warning > 0 ? "warning" : "info";
  
  const severityColors = {
    critical: "bg-red-500 text-white border-red-600",
    warning: "bg-yellow-500 text-white border-yellow-600",
    info: "bg-blue-500 text-white border-blue-600",
  };

  const severityIcons = {
    critical: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  };

  const sizeClasses = {
    sm: "h-5 w-5 text-xs",
    md: "h-6 w-6 text-sm",
    lg: "h-8 w-8 text-base",
  };

  const Icon = severityIcons[severity];

  const renderBadge = () => {
    if (variant === "icon") {
      return (
        <div className={cn(
          "relative inline-flex items-center justify-center rounded-full",
          severityColors[severity],
          sizeClasses[size],
          className
        )}>
          <Icon className="h-3 w-3" />
          {alertsCount.total > 1 && (
            <span className="absolute -top-1 -right-1 inline-flex items-center justify-center h-4 w-4 text-xs font-bold bg-red-600 text-white rounded-full">
              {alertsCount.total > 99 ? "99+" : alertsCount.total}
            </span>
          )}
        </div>
      );
    }

    if (variant === "full") {
      return (
        <div className={cn(
          "inline-flex items-center gap-2 px-3 py-1 rounded-full border",
          severityColors[severity],
          className
        )}>
          <Icon className="h-4 w-4" />
          <span className="text-sm font-medium">
            {alertsCount.total} SEO Alert{alertsCount.total !== 1 ? "s" : ""}
          </span>
          {alertsCount.critical > 0 && (
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
              {alertsCount.critical} Critical
            </span>
          )}
        </div>
      );
    }

    // Default badge variant
    return (
      <span className={cn(
        "inline-flex items-center justify-center min-w-6 h-6 px-2 text-xs font-bold leading-none rounded-full",
        severityColors[severity],
        className
      )}>
        {alertsCount.total > 99 ? "99+" : alertsCount.total}
      </span>
    );
  };

  const tooltipContent = (
    <div className="space-y-1">
      <div className="font-semibold">SEO Alerts</div>
      <div className="text-sm space-y-1">
        {alertsCount.critical > 0 && (
          <div className="flex items-center gap-2">
            <AlertCircle className="h-3 w-3 text-red-400" />
            <span>{alertsCount.critical} Critical</span>
          </div>
        )}
        {alertsCount.warning > 0 && (
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-3 w-3 text-yellow-400" />
            <span>{alertsCount.warning} Warning</span>
          </div>
        )}
        {alertsCount.info > 0 && (
          <div className="flex items-center gap-2">
            <Info className="h-3 w-3 text-blue-400" />
            <span>{alertsCount.info} Info</span>
          </div>
        )}
      </div>
      <div className="text-xs text-muted-foreground pt-1 border-t">
        Click to view all alerts
      </div>
    </div>
  );

  if (showTooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {renderBadge()}
          </TooltipTrigger>
          <TooltipContent side="bottom" align="center">
            {tooltipContent}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return renderBadge();
}

// Compact version for navigation bars
export function SEOAlertsNavBadge({ 
  campaignId, 
  className,
  onClick 
}: { 
  campaignId?: string; 
  className?: string;
  onClick?: () => void;
}) {
  const alertsCount = useSEOAlertsCount(campaignId);

  if (alertsCount.total === 0) {
    return null;
  }

  const severity = alertsCount.critical > 0 ? "critical" : 
                  alertsCount.warning > 0 ? "warning" : "info";

  return (
    <button
      onClick={onClick}
      className={cn(
        "relative inline-flex items-center p-2 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors",
        className
      )}
      aria-label={`${alertsCount.total} SEO alerts`}
    >
      <AlertCircle className="h-6 w-6" />
      <span className={cn(
        "absolute -top-1 -right-1 inline-flex items-center justify-center h-5 w-5 text-xs font-bold rounded-full",
        severity === "critical" 
          ? "bg-red-500 text-white" 
          : severity === "warning" 
          ? "bg-yellow-500 text-white" 
          : "bg-blue-500 text-white"
      )}>
        {alertsCount.total > 9 ? "9+" : alertsCount.total}
      </span>
    </button>
  );
}

export default SEOAlertsBadge; 