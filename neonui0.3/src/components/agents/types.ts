/**
 * Shared Types for Agent Control System
 * NeonHub v2.2.0
 */

// Agent Status Union Type
export type AgentStatus =
  | "active"
  | "running"
  | "idle"
  | "error"
  | "scheduled"
  | "stopped";

// Log Level Union Type
export type LogLevel = "info" | "success" | "warning" | "error";

// Agent Command Union Type
export type AgentCommand = "start" | "stop" | "debug";

// Log Entry Interface
export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  message: string;
  details?: any;
}

// Agent Schedule Interface
export interface AgentSchedule {
  pattern: string;
  nextRun: string;
  interval: string;
}

// Core Agent Interface
export interface Agent {
  id: string;
  name: string;
  type: string;
  status: AgentStatus;
  lastRun: string;
  nextScheduled?: string;
  tasksCompleted: number;
  tasksActive: number;
  successRate: number;
  performance: number;
  cpuUsage: number;
  memoryUsage: number;
  uptime: string;
  version: string;
  description: string;
  capabilities: string[];
  icon: string;
  logs: LogEntry[];
  schedule?: AgentSchedule;
}

// Component Props Interfaces
export interface AgentControlPanelProps {
  className?: string;
  showHeader?: boolean;
  showMetrics?: boolean;
  compact?: boolean;
}

export interface AgentControlWidgetProps {
  className?: string;
}

export interface AgentCardProps {
  agent: Agent;
  onCommand: (agentId: string, command: AgentCommand) => void;
}

// Metrics Interface for Dashboard
export interface AgentMetrics {
  total: number;
  active: number;
  failed: number;
  scheduled: number;
  avgPerformance: number;
  totalTasks: number;
  avgSuccessRate: number;
}

// Status Configuration Interface
export interface StatusConfig {
  color: string;
  bg: string;
  border: string;
  icon: any; // Lucide React icon component
  pulse: string;
}

// Log Configuration Interface
export interface LogConfig {
  color: string;
  icon: any; // Lucide React icon component
  bg: string;
}

// Tab Filter Type
export type TabFilter = "all" | "running" | "failed" | "scheduled";

// Mock Data Type
export type MockAgentData = Agent[];

// Action Types for Agent Commands
export interface AgentCommandAction {
  type: AgentCommand;
  agentId: string;
  payload?: any;
}

// Agent Update Interface
export interface AgentUpdate {
  id: string;
  updates: Partial<Omit<Agent, "id">>;
}

// Real-time Update Interface
export interface AgentRealtimeUpdate {
  agentId: string;
  cpuUsage?: number;
  memoryUsage?: number;
  tasksCompleted?: number;
  status?: AgentStatus;
  logs?: LogEntry[];
}

// Export default types collection
export const AgentTypes = {
  Status: {} as AgentStatus,
  LogLevel: {} as LogLevel,
  Command: {} as AgentCommand,
  TabFilter: {} as TabFilter,
} as const;
