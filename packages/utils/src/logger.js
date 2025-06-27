'use strict';
/**
 * NeonHub Logging Utility
 *
 * Centralized logging system with different levels and output options
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.logSystemEvent =
  exports.logPerformanceMetric =
  exports.logAgentAction =
  exports.createLogger =
  exports.logger =
    void 0;
class Logger {
  constructor(level = 'info') {
    this.logLevel = 'info';
    this.logLevel = level;
  }
  debug(message, context, source) {
    this.log('debug', message, context, source);
  }
  info(message, context, source) {
    this.log('info', message, context, source);
  }
  warn(message, context, source) {
    this.log('warn', message, context, source);
  }
  error(message, context, source) {
    this.log('error', message, context, source);
  }
  log(level, message, context, source) {
    const logEntry = {
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
  shouldLog(level) {
    const levels = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    };
    return levels[level] >= levels[this.logLevel];
  }
  output(entry) {
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
  sendToExternalLogger(_entry) {
    // Implementation for external logging service
    // This could be Sentry, LogRocket, Datadog, etc.
    if (process.env.SENTRY_DSN) {
      // Send to Sentry
    }
    if (process.env.LOGROCK_APP_ID) {
      // Send to LogRocket
    }
  }
  setLevel(level) {
    this.logLevel = level;
  }
}
// Create default logger instance
exports.logger = new Logger(process.env.NODE_ENV === 'development' ? 'debug' : 'info');
// Export logger factory for creating specific loggers
const createLogger = (source, level) => {
  const l = new Logger(level);
  // Override the log method to include source automatically
  const originalLog = l['log'].bind(l);
  l['log'] = (level, message, context) => {
    originalLog(level, message, context, source);
  };
  return l;
};
exports.createLogger = createLogger;
// Convenience functions for common logging patterns
const logAgentAction = (agentName, action, result, context) => {
  const message = `Agent ${agentName} ${action}: ${result}`;
  if (result === 'success') {
    exports.logger.info(message, context, 'AgentSystem');
  } else {
    exports.logger.error(message, context, 'AgentSystem');
  }
};
exports.logAgentAction = logAgentAction;
const logPerformanceMetric = (metric, value, threshold) => {
  const context = { metric, value, threshold };
  if (threshold && value < threshold) {
    exports.logger.warn(`Performance metric ${metric} below threshold`, context, 'Performance');
  } else {
    exports.logger.info(`Performance metric ${metric} recorded`, context, 'Performance');
  }
};
exports.logPerformanceMetric = logPerformanceMetric;
const logSystemEvent = (event, details) => {
  exports.logger.info(`System event: ${event}`, details, 'System');
};
exports.logSystemEvent = logSystemEvent;
//# sourceMappingURL=logger.js.map
