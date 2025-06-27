/**
 * Agent Logging Utility for NeonHub AI Marketing System
 *
 * Provides centralized logging for all AI agents with database persistence
 * and error handling capabilities.
 */

import { db } from '../../data-model/src';
import type { AgentName } from '@neon/types';
import { logger } from './logger';

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
export async function logEvent(data: LogEventData): Promise<void> {
  try {
    await db.aIEventLog.create({
      data: {
        agent: data.agent,
        action: data.action,
        metadata: {
          success: data.success,
          error: data.error,
          duration: data.duration,
          timestamp: new Date().toISOString(),
          ...data.metadata,
        },
      },
    });
  } catch (error) {
    // Fallback logging to console if database logging fails
    // Use our structured logger instead of console
    logger.error(
      'Failed to log agent event to database',
      { error, eventData: data },
      'AgentLogger'
    );
    // Log event data for debugging
    logger.debug('Agent Event', data, 'AgentLogger');
  }
}

/**
 * Logs agent performance metrics
 */
export async function logPerformance(data: PerformanceMetrics): Promise<void> {
  try {
    await logEvent({
      agent: data.agent,
      action: 'performance_evaluation',
      metadata: {
        score: data.score,
        metrics: data.metrics,
        evaluatedAt: data.timestamp || new Date(),
      },
      success: true,
    });
  } catch (error) {
    logger.error(
      'Failed to log agent performance',
      { error, performanceData: data },
      'AgentLogger'
    );
  }
}

/**
 * Logs successful agent execution
 */
export async function logSuccess(
  agent: AgentName,
  action: string,
  metadata?: Record<string, unknown>,
  duration?: number
): Promise<void> {
  await logEvent({
    agent,
    action,
    metadata: metadata || {},
    success: true,
    ...(duration !== undefined && { duration }),
  });
}

/**
 * Logs failed agent execution
 */
export async function logError(
  agent: AgentName,
  action: string,
  error: string | Error,
  metadata?: Record<string, unknown>
): Promise<void> {
  const errorMessage = error instanceof Error ? error.message : error;

  await logEvent({
    agent,
    action,
    metadata: metadata || {},
    success: false,
    error: errorMessage,
  });
}

/**
 * Creates a performance timer for measuring agent execution time
 */
export function createTimer(): {
  stop: () => number;
} {
  const startTime = Date.now();

  return {
    stop: (): number => Date.now() - startTime,
  };
}

/**
 * Wrapper function for executing agent actions with automatic logging
 */
export async function withLogging<T>(
  agent: AgentName,
  action: string,
  fn: () => Promise<T>,
  metadata?: Record<string, unknown>
): Promise<T> {
  const timer = createTimer();

  try {
    const result = await fn();
    const duration = timer.stop();

    await logSuccess(agent, action, metadata, duration);
    return result;
  } catch (error) {
    const duration = timer.stop();
    await logError(agent, action, error as Error, { ...metadata, duration });
    throw error;
  }
}
