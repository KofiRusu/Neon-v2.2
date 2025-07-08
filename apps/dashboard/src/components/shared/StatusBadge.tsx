"use client";

import { motion } from "framer-motion";
import { Badge } from "../ui/badge";
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Zap,
  Play,
  Pause,
  Square,
  RotateCcw,
  Loader2,
  AlertCircle,
  Info,
  Shield,
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  Activity,
  Target,
  Eye,
} from "lucide-react";
import { cn } from "../../lib/utils";

export type StatusType =
  | "success"
  | "error"
  | "warning"
  | "info"
  | "pending"
  | "running"
  | "paused"
  | "stopped"
  | "loading"
  | "active"
  | "inactive"
  | "online"
  | "offline"
  | "up"
  | "down"
  | "stable"
  | "critical"
  | "high"
  | "medium"
  | "low"
  | "excellent"
  | "good"
  | "fair"
  | "poor";

export type StatusVariant =
  | "default"
  | "outline"
  | "solid"
  | "glass"
  | "minimal";
export type StatusSize = "xs" | "sm" | "md" | "lg";

interface StatusBadgeProps {
  status: StatusType;
  variant?: StatusVariant;
  size?: StatusSize;
  animated?: boolean;
  showIcon?: boolean;
  customIcon?: React.ReactNode;
  label?: string;
  count?: number;
  pulse?: boolean;
  glow?: boolean;
  tooltip?: string;
  onClick?: () => void;
  className?: string;
}

const statusConfig = {
  success: {
    icon: CheckCircle,
    colors: {
      default:
        "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
      outline:
        "border-green-500 text-green-500 bg-transparent dark:border-green-400 dark:text-green-400",
      solid: "bg-green-500 text-white border-green-500",
      glass:
        "bg-green-500/10 text-green-500 border-green-500/20 backdrop-blur-xl",
      minimal: "text-green-500 bg-transparent",
    },
    glow: "shadow-green-500/25",
  },
  error: {
    icon: XCircle,
    colors: {
      default:
        "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
      outline:
        "border-red-500 text-red-500 bg-transparent dark:border-red-400 dark:text-red-400",
      solid: "bg-red-500 text-white border-red-500",
      glass: "bg-red-500/10 text-red-500 border-red-500/20 backdrop-blur-xl",
      minimal: "text-red-500 bg-transparent",
    },
    glow: "shadow-red-500/25",
  },
  warning: {
    icon: AlertTriangle,
    colors: {
      default:
        "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800",
      outline:
        "border-yellow-500 text-yellow-500 bg-transparent dark:border-yellow-400 dark:text-yellow-400",
      solid: "bg-yellow-500 text-white border-yellow-500",
      glass:
        "bg-yellow-500/10 text-yellow-500 border-yellow-500/20 backdrop-blur-xl",
      minimal: "text-yellow-500 bg-transparent",
    },
    glow: "shadow-yellow-500/25",
  },
  info: {
    icon: Info,
    colors: {
      default:
        "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
      outline:
        "border-blue-500 text-blue-500 bg-transparent dark:border-blue-400 dark:text-blue-400",
      solid: "bg-blue-500 text-white border-blue-500",
      glass: "bg-blue-500/10 text-blue-500 border-blue-500/20 backdrop-blur-xl",
      minimal: "text-blue-500 bg-transparent",
    },
    glow: "shadow-blue-500/25",
  },
  pending: {
    icon: Clock,
    colors: {
      default:
        "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800",
      outline:
        "border-gray-500 text-gray-500 bg-transparent dark:border-gray-400 dark:text-gray-400",
      solid: "bg-gray-500 text-white border-gray-500",
      glass: "bg-gray-500/10 text-gray-500 border-gray-500/20 backdrop-blur-xl",
      minimal: "text-gray-500 bg-transparent",
    },
    glow: "shadow-gray-500/25",
  },
  running: {
    icon: Play,
    colors: {
      default:
        "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
      outline:
        "border-blue-500 text-blue-500 bg-transparent dark:border-blue-400 dark:text-blue-400",
      solid: "bg-blue-500 text-white border-blue-500",
      glass: "bg-blue-500/10 text-blue-500 border-blue-500/20 backdrop-blur-xl",
      minimal: "text-blue-500 bg-transparent",
    },
    glow: "shadow-blue-500/25",
  },
  paused: {
    icon: Pause,
    colors: {
      default:
        "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800",
      outline:
        "border-orange-500 text-orange-500 bg-transparent dark:border-orange-400 dark:text-orange-400",
      solid: "bg-orange-500 text-white border-orange-500",
      glass:
        "bg-orange-500/10 text-orange-500 border-orange-500/20 backdrop-blur-xl",
      minimal: "text-orange-500 bg-transparent",
    },
    glow: "shadow-orange-500/25",
  },
  stopped: {
    icon: Square,
    colors: {
      default:
        "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
      outline:
        "border-red-500 text-red-500 bg-transparent dark:border-red-400 dark:text-red-400",
      solid: "bg-red-500 text-white border-red-500",
      glass: "bg-red-500/10 text-red-500 border-red-500/20 backdrop-blur-xl",
      minimal: "text-red-500 bg-transparent",
    },
    glow: "shadow-red-500/25",
  },
  loading: {
    icon: Loader2,
    colors: {
      default:
        "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800",
      outline:
        "border-purple-500 text-purple-500 bg-transparent dark:border-purple-400 dark:text-purple-400",
      solid: "bg-purple-500 text-white border-purple-500",
      glass:
        "bg-purple-500/10 text-purple-500 border-purple-500/20 backdrop-blur-xl",
      minimal: "text-purple-500 bg-transparent",
    },
    glow: "shadow-purple-500/25",
  },
  active: {
    icon: Zap,
    colors: {
      default:
        "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
      outline:
        "border-green-500 text-green-500 bg-transparent dark:border-green-400 dark:text-green-400",
      solid: "bg-green-500 text-white border-green-500",
      glass:
        "bg-green-500/10 text-green-500 border-green-500/20 backdrop-blur-xl",
      minimal: "text-green-500 bg-transparent",
    },
    glow: "shadow-green-500/25",
  },
  inactive: {
    icon: Pause,
    colors: {
      default:
        "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800",
      outline:
        "border-gray-500 text-gray-500 bg-transparent dark:border-gray-400 dark:text-gray-400",
      solid: "bg-gray-500 text-white border-gray-500",
      glass: "bg-gray-500/10 text-gray-500 border-gray-500/20 backdrop-blur-xl",
      minimal: "text-gray-500 bg-transparent",
    },
    glow: "shadow-gray-500/25",
  },
  online: {
    icon: CheckCircle,
    colors: {
      default:
        "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
      outline:
        "border-green-500 text-green-500 bg-transparent dark:border-green-400 dark:text-green-400",
      solid: "bg-green-500 text-white border-green-500",
      glass:
        "bg-green-500/10 text-green-500 border-green-500/20 backdrop-blur-xl",
      minimal: "text-green-500 bg-transparent",
    },
    glow: "shadow-green-500/25",
  },
  offline: {
    icon: XCircle,
    colors: {
      default:
        "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
      outline:
        "border-red-500 text-red-500 bg-transparent dark:border-red-400 dark:text-red-400",
      solid: "bg-red-500 text-white border-red-500",
      glass: "bg-red-500/10 text-red-500 border-red-500/20 backdrop-blur-xl",
      minimal: "text-red-500 bg-transparent",
    },
    glow: "shadow-red-500/25",
  },
  up: {
    icon: TrendingUp,
    colors: {
      default:
        "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
      outline:
        "border-green-500 text-green-500 bg-transparent dark:border-green-400 dark:text-green-400",
      solid: "bg-green-500 text-white border-green-500",
      glass:
        "bg-green-500/10 text-green-500 border-green-500/20 backdrop-blur-xl",
      minimal: "text-green-500 bg-transparent",
    },
    glow: "shadow-green-500/25",
  },
  down: {
    icon: TrendingDown,
    colors: {
      default:
        "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
      outline:
        "border-red-500 text-red-500 bg-transparent dark:border-red-400 dark:text-red-400",
      solid: "bg-red-500 text-white border-red-500",
      glass: "bg-red-500/10 text-red-500 border-red-500/20 backdrop-blur-xl",
      minimal: "text-red-500 bg-transparent",
    },
    glow: "shadow-red-500/25",
  },
  stable: {
    icon: Minus,
    colors: {
      default:
        "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
      outline:
        "border-blue-500 text-blue-500 bg-transparent dark:border-blue-400 dark:text-blue-400",
      solid: "bg-blue-500 text-white border-blue-500",
      glass: "bg-blue-500/10 text-blue-500 border-blue-500/20 backdrop-blur-xl",
      minimal: "text-blue-500 bg-transparent",
    },
    glow: "shadow-blue-500/25",
  },
  critical: {
    icon: AlertCircle,
    colors: {
      default:
        "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
      outline:
        "border-red-500 text-red-500 bg-transparent dark:border-red-400 dark:text-red-400",
      solid: "bg-red-500 text-white border-red-500",
      glass: "bg-red-500/10 text-red-500 border-red-500/20 backdrop-blur-xl",
      minimal: "text-red-500 bg-transparent",
    },
    glow: "shadow-red-500/25",
  },
  high: {
    icon: AlertTriangle,
    colors: {
      default:
        "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800",
      outline:
        "border-orange-500 text-orange-500 bg-transparent dark:border-orange-400 dark:text-orange-400",
      solid: "bg-orange-500 text-white border-orange-500",
      glass:
        "bg-orange-500/10 text-orange-500 border-orange-500/20 backdrop-blur-xl",
      minimal: "text-orange-500 bg-transparent",
    },
    glow: "shadow-orange-500/25",
  },
  medium: {
    icon: Info,
    colors: {
      default:
        "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800",
      outline:
        "border-yellow-500 text-yellow-500 bg-transparent dark:border-yellow-400 dark:text-yellow-400",
      solid: "bg-yellow-500 text-white border-yellow-500",
      glass:
        "bg-yellow-500/10 text-yellow-500 border-yellow-500/20 backdrop-blur-xl",
      minimal: "text-yellow-500 bg-transparent",
    },
    glow: "shadow-yellow-500/25",
  },
  low: {
    icon: CheckCircle,
    colors: {
      default:
        "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
      outline:
        "border-blue-500 text-blue-500 bg-transparent dark:border-blue-400 dark:text-blue-400",
      solid: "bg-blue-500 text-white border-blue-500",
      glass: "bg-blue-500/10 text-blue-500 border-blue-500/20 backdrop-blur-xl",
      minimal: "text-blue-500 bg-transparent",
    },
    glow: "shadow-blue-500/25",
  },
  excellent: {
    icon: Shield,
    colors: {
      default:
        "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800",
      outline:
        "border-emerald-500 text-emerald-500 bg-transparent dark:border-emerald-400 dark:text-emerald-400",
      solid: "bg-emerald-500 text-white border-emerald-500",
      glass:
        "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 backdrop-blur-xl",
      minimal: "text-emerald-500 bg-transparent",
    },
    glow: "shadow-emerald-500/25",
  },
  good: {
    icon: CheckCircle,
    colors: {
      default:
        "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
      outline:
        "border-green-500 text-green-500 bg-transparent dark:border-green-400 dark:text-green-400",
      solid: "bg-green-500 text-white border-green-500",
      glass:
        "bg-green-500/10 text-green-500 border-green-500/20 backdrop-blur-xl",
      minimal: "text-green-500 bg-transparent",
    },
    glow: "shadow-green-500/25",
  },
  fair: {
    icon: Minus,
    colors: {
      default:
        "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800",
      outline:
        "border-yellow-500 text-yellow-500 bg-transparent dark:border-yellow-400 dark:text-yellow-400",
      solid: "bg-yellow-500 text-white border-yellow-500",
      glass:
        "bg-yellow-500/10 text-yellow-500 border-yellow-500/20 backdrop-blur-xl",
      minimal: "text-yellow-500 bg-transparent",
    },
    glow: "shadow-yellow-500/25",
  },
  poor: {
    icon: XCircle,
    colors: {
      default:
        "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
      outline:
        "border-red-500 text-red-500 bg-transparent dark:border-red-400 dark:text-red-400",
      solid: "bg-red-500 text-white border-red-500",
      glass: "bg-red-500/10 text-red-500 border-red-500/20 backdrop-blur-xl",
      minimal: "text-red-500 bg-transparent",
    },
    glow: "shadow-red-500/25",
  },
};

const sizeConfig = {
  xs: {
    text: "text-xs",
    padding: "px-1.5 py-0.5",
    icon: "w-3 h-3",
    gap: "gap-1",
  },
  sm: {
    text: "text-xs",
    padding: "px-2 py-1",
    icon: "w-3 h-3",
    gap: "gap-1.5",
  },
  md: {
    text: "text-sm",
    padding: "px-2.5 py-1.5",
    icon: "w-4 h-4",
    gap: "gap-2",
  },
  lg: {
    text: "text-base",
    padding: "px-3 py-2",
    icon: "w-5 h-5",
    gap: "gap-2",
  },
};

export function StatusBadge({
  status,
  variant = "glass",
  size = "sm",
  animated = false,
  showIcon = true,
  customIcon,
  label,
  count,
  pulse = false,
  glow = false,
  tooltip,
  onClick,
  className,
}: StatusBadgeProps) {
  const config = statusConfig[status];
  const sizeStyles = sizeConfig[size];

  if (!config) {
    console.warn(`Unknown status type: ${status}`);
    return null;
  }

  const Icon = config.icon;
  const displayLabel =
    label || status.charAt(0).toUpperCase() + status.slice(1);

  const shouldAnimate =
    animated || status === "loading" || status === "running";
  const shouldPulse = pulse || status === "running" || status === "active";

  const badgeContent = (
    <motion.div
      initial={animated ? { opacity: 0, scale: 0.8 } : undefined}
      animate={animated ? { opacity: 1, scale: 1 } : undefined}
      transition={{ duration: 0.2 }}
      className={cn(
        "inline-flex items-center justify-center border rounded-full font-medium transition-all duration-200",
        config.colors[variant],
        sizeStyles.text,
        sizeStyles.padding,
        sizeStyles.gap,
        shouldPulse && "animate-pulse",
        glow && `shadow-lg ${config.glow}`,
        onClick && "cursor-pointer hover:scale-105 active:scale-95",
        className,
      )}
      onClick={onClick}
      title={tooltip}
      whileHover={onClick ? { scale: 1.05 } : undefined}
      whileTap={onClick ? { scale: 0.95 } : undefined}
    >
      {showIcon && (
        <span className={cn(sizeStyles.icon, "flex-shrink-0")}>
          {customIcon || (
            <Icon
              className={cn(
                "w-full h-full",
                shouldAnimate && status === "loading" && "animate-spin",
                shouldAnimate && status === "running" && "animate-pulse",
              )}
            />
          )}
        </span>
      )}

      <span className="flex-shrink-0">{displayLabel}</span>

      {count !== undefined && count > 0 && (
        <span
          className={cn(
            "ml-1 px-1.5 py-0.5 text-xs bg-white/20 rounded-full",
            size === "xs" && "text-[10px] px-1 py-0",
          )}
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </motion.div>
  );

  return badgeContent;
}

// Convenience components for common status types
export function SuccessStatus(props: Omit<StatusBadgeProps, "status">) {
  return <StatusBadge status="success" {...props} />;
}

export function ErrorStatus(props: Omit<StatusBadgeProps, "status">) {
  return <StatusBadge status="error" {...props} />;
}

export function WarningStatus(props: Omit<StatusBadgeProps, "status">) {
  return <StatusBadge status="warning" {...props} />;
}

export function InfoStatus(props: Omit<StatusBadgeProps, "status">) {
  return <StatusBadge status="info" {...props} />;
}

export function LoadingStatus(props: Omit<StatusBadgeProps, "status">) {
  return <StatusBadge status="loading" animated pulse {...props} />;
}

export function RunningStatus(props: Omit<StatusBadgeProps, "status">) {
  return <StatusBadge status="running" animated pulse {...props} />;
}

export function OnlineStatus(props: Omit<StatusBadgeProps, "status">) {
  return <StatusBadge status="online" glow {...props} />;
}

export function OfflineStatus(props: Omit<StatusBadgeProps, "status">) {
  return <StatusBadge status="offline" {...props} />;
}

// Export default
export default StatusBadge;
