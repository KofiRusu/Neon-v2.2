export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: Record<string, unknown>;
  agentId?: string;
  agentName?: string;
}

export class Logger {
  private static instance: Logger;
  private logLevel: LogLevel = LogLevel.INFO;
  private logs: LogEntry[] = [];
  private maxLogs: number = 1000;

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  setMaxLogs(maxLogs: number): void {
    this.maxLogs = maxLogs;
  }

  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    agentId?: string,
    agentName?: string
  ): void {
    if (level < this.logLevel) {
      return;
    }

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      ...(context && { context }),
      ...(agentId && { agentId }),
      ...(agentName && { agentName }),
    };

    this.logs.push(entry);

    // Trim logs if we exceed max
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Only log to console in development
    if (process.env.NODE_ENV === 'development') {
      this.logToConsole(entry);
    }
  }

  private logToConsole(entry: LogEntry): void {
    const prefix = entry.agentId ? `[${entry.agentName || entry.agentId}]` : '[SYSTEM]';
    const timestamp = entry.timestamp.toISOString();
    const message = `${timestamp} ${prefix} ${entry.message}`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(message, entry.context);
        break;
      case LogLevel.INFO:
        console.info(message, entry.context);
        break;
      case LogLevel.WARN:
        console.warn(message, entry.context);
        break;
      case LogLevel.ERROR:
        console.error(message, entry.context);
        break;
    }
  }

  debug(
    message: string,
    context?: Record<string, unknown>,
    agentId?: string,
    agentName?: string
  ): void {
    this.log(LogLevel.DEBUG, message, context, agentId, agentName);
  }

  info(
    message: string,
    context?: Record<string, unknown>,
    agentId?: string,
    agentName?: string
  ): void {
    this.log(LogLevel.INFO, message, context, agentId, agentName);
  }

  warn(
    message: string,
    context?: Record<string, unknown>,
    agentId?: string,
    agentName?: string
  ): void {
    this.log(LogLevel.WARN, message, context, agentId, agentName);
  }

  error(
    message: string,
    context?: Record<string, unknown>,
    agentId?: string,
    agentName?: string
  ): void {
    this.log(LogLevel.ERROR, message, context, agentId, agentName);
  }

  getLogs(level?: LogLevel, agentId?: string): LogEntry[] {
    let filteredLogs = this.logs;

    if (level !== undefined) {
      filteredLogs = filteredLogs.filter(log => log.level >= level);
    }

    if (agentId) {
      filteredLogs = filteredLogs.filter(log => log.agentId === agentId);
    }

    return filteredLogs;
  }

  clearLogs(): void {
    this.logs = [];
  }

  getLogStats(): {
    total: number;
    byLevel: Record<string, number>;
    byAgent: Record<string, number>;
  } {
    const byLevel: Record<string, number> = {};
    const byAgent: Record<string, number> = {};

    this.logs.forEach(log => {
      const levelName = LogLevel[log.level];
      byLevel[levelName] = (byLevel[levelName] || 0) + 1;

      if (log.agentId) {
        byAgent[log.agentId] = (byAgent[log.agentId] || 0) + 1;
      }
    });

    return {
      total: this.logs.length,
      byLevel,
      byAgent,
    };
  }
}

// Export a singleton instance
export const logger = Logger.getInstance();
