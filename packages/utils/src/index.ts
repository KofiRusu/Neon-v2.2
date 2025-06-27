/**
 * Utility functions for Neon0.2 monorepo
 */

import type { Result } from '@neon/types';

// Export logger
export { logger, type Logger } from './logger';

/**
 * Delay execution for specified milliseconds
 */
export const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Generate a random UUID v4
 */
export const generateId = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Safe JSON parse with error handling
 */
export const safeJsonParse = <T = unknown>(json: string): Result<T> => {
  try {
    const data = JSON.parse(json) as T;
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'JSON_PARSE_ERROR',
        message: 'Failed to parse JSON',
        details: { originalError: error instanceof Error ? error.message : String(error) },
      },
    };
  }
};

/**
 * Debounce function calls
 */
export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>): void => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Throttle function calls
 */
export const throttle = <T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;

  return (...args: Parameters<T>): void => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Retry async operation with exponential backoff
 */
export const retry = async <T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === maxAttempts) {
        break;
      }

      // Exponential backoff
      const delayMs = baseDelay * Math.pow(2, attempt - 1);
      await delay(delayMs);
    }
  }

  throw lastError || new Error('Unknown error occurred');
};

/**
 * Check if value is not null or undefined
 */
export const isNotNullish = <T>(value: T | null | undefined): value is T => {
  return value !== null && value !== undefined;
};

/**
 * Array chunk utility
 */
export const chunk = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

/**
 * Object pick utility
 */
export const pick = <T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> => {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key];
    }
  }
  return result;
};

// Export agent logging utilities
export {
  logEvent,
  logPerformance,
  logSuccess,
  logError,
  createTimer,
  withLogging,
  type LogEventData,
  type PerformanceMetrics,
} from './agentLogger';

// Export main logging utilities
export {
  logger,
  createLogger,
  logAgentAction,
  logPerformanceMetric,
  logSystemEvent,
  type LogLevel,
  type LogEntry,
} from './logger';

export * from './apiClient';
export * from './errorHandler';
export * from './rateLimiter';
export * from './responseFormatter';
export * from './retryHandler';
export * from './types';
export * from './budgetMonitor';
export * from './budget-tracker';
export * from './whatsapp-tracker';
