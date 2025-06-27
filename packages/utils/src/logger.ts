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

class Logger {
  private logLevel: LogLevel = 'info';

  constructor(level: LogLevel = 'info') {
    this.logLevel = level;
  }

  debug(message: string, context?: Record<string, unknown>, source?: string): void {
    this.log('debug', message, context, source);
  }

  info(message: string, context?: Record<string, unknown>, source?: string): void {
    this.log('info', message, context, source);
  }

  warn(message: string, context?: Record<string, unknown>, source?: string): void {
    this.log('warn', message, context, source);
  }

  error(message: string, context?: Record<string, unknown>, source?: string): void {
    this.log('error', message, context, source);
  }

  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    source?: string
  ): void {
    const logEntry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context,
      source,
    };

    // Only log if level is appropriate
    if (this.shouldLog(level)) {
      this.output(logEntry);
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    };

    return levels[level] >= levels[this.logLevel];
  }

  private output(entry: LogEntry): void {
    const timestamp = entry.timestamp.toISOString();
    const contextStr = entry.context ? ` | Context: ${JSON.stringify(entry.context)}` : '';
    const sourceStr = entry.source ? ` | Source: ${entry.source}` : '';

    const logMessage = `[${timestamp}] ${entry.level.toUpperCase()}: ${entry.message}${sourceStr}${contextStr}`;

    // In production, you might want to send to external logging service
    if (process.env.NODE_ENV === 'production') {
      // Send to external logging service (e.g., Sentry, LogRocket, etc.)
      this.sendToExternalLogger(entry);
    } else {
      // Development logging to console
      switch (entry.level) {
        case 'debug':
          // eslint-disable-next-line no-console
          console.debug(logMessage);
          break;
        case 'info':
          // eslint-disable-next-line no-console
          console.info(logMessage);
          break;
        case 'warn':
          // eslint-disable-next-line no-console
          console.warn(logMessage);
          break;
        case 'error':
          // eslint-disable-next-line no-console
          console.error(logMessage);
          break;
      }
    }
  }

  private sendToExternalLogger(_entry: LogEntry): void {
    // Implementation for external logging service
    // This could be Sentry, LogRocket, Datadog, etc.
    if (process.env.SENTRY_DSN) {
      // Send to Sentry
    }

    if (process.env.LOGROCK_APP_ID) {
      // Send to LogRocket
    }
  }

  setLevel(level: LogLevel): void {
    this.logLevel = level;
  }
}

// Create default logger instance
export const logger = new Logger(process.env.NODE_ENV === 'development' ? 'debug' : 'info');

// Export logger factory for creating specific loggers
export const createLogger = (source: string, level?: LogLevel): Logger => {
  const l = new Logger(level);
  // Override the log method to include source automatically
  const originalLog = l['log'].bind(l);
  l['log'] = (level: LogLevel, message: string, context?: Record<string, unknown>) => {
    originalLog(level, message, context, source);
  };
  return l;
};

// Convenience functions for common logging patterns
export const logAgentAction = (
  agentName: string,
  action: string,
  result: 'success' | 'error',
  context?: Record<string, unknown>
): void => {
  const message = `Agent ${agentName} ${action}: ${result}`;
  if (result === 'success') {
    logger.info(message, context, 'AgentSystem');
  } else {
    logger.error(message, context, 'AgentSystem');
  }
};

export const logPerformanceMetric = (metric: string, value: number, threshold?: number): void => {
  const context = { metric, value, threshold };
  if (threshold && value < threshold) {
    logger.warn(`Performance metric ${metric} below threshold`, context, 'Performance');
  } else {
    logger.info(`Performance metric ${metric} recorded`, context, 'Performance');
  }
};

export const logSystemEvent = (event: string, details?: Record<string, unknown>): void => {
  logger.info(`System event: ${event}`, details, 'System');
};
