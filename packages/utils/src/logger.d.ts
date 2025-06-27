/**
 * NeonHub Logging Utility
 *
 * Centralized logging system with different levels and output options
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: Record<string, unknown> | undefined;
  source?: string | undefined;
}
declare class Logger {
  private logLevel;
  constructor(level?: LogLevel);
  debug(message: string, context?: Record<string, unknown>, source?: string): void;
  info(message: string, context?: Record<string, unknown>, source?: string): void;
  warn(message: string, context?: Record<string, unknown>, source?: string): void;
  error(message: string, context?: Record<string, unknown>, source?: string): void;
  private log;
  private shouldLog;
  private output;
  private sendToExternalLogger;
  setLevel(level: LogLevel): void;
}
export declare const logger: Logger;
export declare const createLogger: (source: string, level?: LogLevel) => Logger;
export declare const logAgentAction: (
  agentName: string,
  action: string,
  result: 'success' | 'error',
  context?: Record<string, unknown>
) => void;
export declare const logPerformanceMetric: (
  metric: string,
  value: number,
  threshold?: number
) => void;
export declare const logSystemEvent: (event: string, details?: Record<string, unknown>) => void;
export {};
//# sourceMappingURL=logger.d.ts.map
