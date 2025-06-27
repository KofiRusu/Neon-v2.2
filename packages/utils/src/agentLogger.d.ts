/**
 * Agent Logging Utility for NeonHub AI Marketing System
 *
 * Provides centralized logging for all AI agents with database persistence
 * and error handling capabilities.
 */
import type { AgentName } from '@neon/types';
export interface LogEventData extends Record<string, unknown> {
  agent: AgentName;
  action: string;
  metadata?: Record<string, unknown>;
  success?: boolean;
  error?: string;
  duration?: number;
}
export interface PerformanceMetrics {
  agent: AgentName;
  score: number;
  metrics: Record<string, number>;
  timestamp?: Date;
}
/**
 * Logs an AI agent event to the database
 */
export declare function logEvent(data: LogEventData): Promise<void>;
/**
 * Logs agent performance metrics
 */
export declare function logPerformance(data: PerformanceMetrics): Promise<void>;
/**
 * Logs successful agent execution
 */
export declare function logSuccess(
  agent: AgentName,
  action: string,
  metadata?: Record<string, unknown>,
  duration?: number
): Promise<void>;
/**
 * Logs failed agent execution
 */
export declare function logError(
  agent: AgentName,
  action: string,
  error: string | Error,
  metadata?: Record<string, unknown>
): Promise<void>;
/**
 * Creates a performance timer for measuring agent execution time
 */
export declare function createTimer(): {
  stop: () => number;
};
/**
 * Wrapper function for executing agent actions with automatic logging
 */
export declare function withLogging<T>(
  agent: AgentName,
  action: string,
  fn: () => Promise<T>,
  metadata?: Record<string, unknown>
): Promise<T>;
//# sourceMappingURL=agentLogger.d.ts.map
