'use strict';
/**
 * Agent Logging Utility for NeonHub AI Marketing System
 *
 * Provides centralized logging for all AI agents with database persistence
 * and error handling capabilities.
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.logEvent = logEvent;
exports.logPerformance = logPerformance;
exports.logSuccess = logSuccess;
exports.logError = logError;
exports.createTimer = createTimer;
exports.withLogging = withLogging;
const src_1 = require('../../data-model/src');
const logger_1 = require('./logger');
/**
 * Logs an AI agent event to the database
 */
async function logEvent(data) {
  try {
    await src_1.db.aIEventLog.create({
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
    logger_1.logger.error(
      'Failed to log agent event to database',
      { error, eventData: data },
      'AgentLogger'
    );
    // Log event data for debugging
    logger_1.logger.debug('Agent Event', data, 'AgentLogger');
  }
}
/**
 * Logs agent performance metrics
 */
async function logPerformance(data) {
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
    logger_1.logger.error(
      'Failed to log agent performance',
      { error, performanceData: data },
      'AgentLogger'
    );
  }
}
/**
 * Logs successful agent execution
 */
async function logSuccess(agent, action, metadata, duration) {
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
async function logError(agent, action, error, metadata) {
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
function createTimer() {
  const startTime = Date.now();
  return {
    stop: () => Date.now() - startTime,
  };
}
/**
 * Wrapper function for executing agent actions with automatic logging
 */
async function withLogging(agent, action, fn, metadata) {
  const timer = createTimer();
  try {
    const result = await fn();
    const duration = timer.stop();
    await logSuccess(agent, action, metadata, duration);
    return result;
  } catch (error) {
    const duration = timer.stop();
    await logError(agent, action, error, { ...metadata, duration });
    throw error;
  }
}
//# sourceMappingURL=agentLogger.js.map
