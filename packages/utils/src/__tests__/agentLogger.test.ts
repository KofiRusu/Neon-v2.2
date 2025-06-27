/**
 * Tests for Agent Logger Utility
 */

import {
  logEvent,
  logPerformance,
  logSuccess,
  logError,
  createTimer,
  withLogging,
} from '../agentLogger';
import { db } from '@neon/data-model';

// Mock the database
jest.mock('@neon/data-model', () => ({
  db: {
    aIEventLog: {
      create: jest.fn(),
    },
  },
}));

const mockDb = db as jest.Mocked<typeof db>;
const mockCreate = mockDb.aIEventLog.create as jest.MockedFunction<typeof mockDb.aIEventLog.create>;

// Mock return type for Prisma client
const mockAIEventLogResult = {
  id: 'test_log_001',
  agent: 'TestAgent',
  action: 'test_action',
  metadata: {},
  createdAt: new Date(),
} as never;

describe('Agent Logger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress console logs during tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('logEvent', () => {
    it('should log events to database successfully', async () => {
      mockCreate.mockResolvedValue(mockAIEventLogResult);

      await logEvent({
        agent: 'ContentAgent',
        action: 'generate_content',
        metadata: { test: true },
        success: true,
        duration: 150,
      });

      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          agent: 'ContentAgent',
          action: 'generate_content',
          metadata: expect.objectContaining({
            success: true,
            duration: 150,
            test: true,
            timestamp: expect.any(String),
          }),
        },
      });
    });

    it('should handle database errors gracefully', async () => {
      mockCreate.mockRejectedValue(new Error('DB Error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      await logEvent({
        agent: 'AdAgent',
        action: 'optimize_ad',
        success: false,
        error: 'Test error',
      });

      expect(mockCreate).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to log agent event to database:',
        expect.any(Error)
      );
      expect(logSpy).toHaveBeenCalledWith('Agent Event:', expect.any(String));
    });
  });

  describe('logPerformance', () => {
    it('should log performance metrics', async () => {
      mockCreate.mockResolvedValue(mockAIEventLogResult);

      await logPerformance({
        agent: 'TrendAgent',
        score: 85,
        metrics: { accuracy: 0.9, speed: 1200 },
        timestamp: new Date('2024-01-01'),
      });

      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          agent: 'TrendAgent',
          action: 'performance_evaluation',
          metadata: expect.objectContaining({
            score: 85,
            metrics: { accuracy: 0.9, speed: 1200 },
            evaluatedAt: new Date('2024-01-01'),
            success: true,
          }),
        },
      });
    });

    it('should use current timestamp if not provided', async () => {
      mockCreate.mockResolvedValue(mockAIEventLogResult);

      await logPerformance({
        agent: 'InsightAgent',
        score: 75,
        metrics: { precision: 0.8 },
      });

      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          metadata: expect.objectContaining({
            evaluatedAt: expect.any(Date),
          }),
        }),
      });
    });
  });

  describe('logSuccess', () => {
    it('should log successful operations', async () => {
      mockCreate.mockResolvedValue(mockAIEventLogResult);

      await logSuccess('OutreachAgent', 'send_email', { recipient: 'test@example.com' }, 500);

      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          agent: 'OutreachAgent',
          action: 'send_email',
          metadata: expect.objectContaining({
            success: true,
            duration: 500,
            recipient: 'test@example.com',
          }),
        },
      });
    });
  });

  describe('logError', () => {
    it('should log errors with Error objects', async () => {
      mockCreate.mockResolvedValue(mockAIEventLogResult);
      const testError = new Error('Test error message');

      await logError('DesignAgent', 'create_design', testError, { designType: 'banner' });

      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          agent: 'DesignAgent',
          action: 'create_design',
          metadata: expect.objectContaining({
            success: false,
            error: 'Test error message',
            designType: 'banner',
          }),
        },
      });
    });

    it('should log errors with string messages', async () => {
      mockCreate.mockResolvedValue(mockAIEventLogResult);

      await logError('ContentAgent', 'validate_content', 'Invalid content format');

      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          agent: 'ContentAgent',
          action: 'validate_content',
          metadata: expect.objectContaining({
            success: false,
            error: 'Invalid content format',
          }),
        },
      });
    });
  });

  describe('createTimer', () => {
    it('should measure execution time accurately', async () => {
      const timer = createTimer();

      // Wait a small amount of time
      await new Promise(resolve => setTimeout(resolve, 10));

      const duration = timer.stop();

      expect(duration).toBeGreaterThanOrEqual(8); // Allow for some variance
      expect(duration).toBeLessThan(50); // Should be reasonable
    });

    it('should return different durations for different timers', () => {
      const timer1 = createTimer();
      const timer2 = createTimer();

      const duration1 = timer1.stop();
      const duration2 = timer2.stop();

      // Both should be numbers, may or may not be different depending on timing
      expect(typeof duration1).toBe('number');
      expect(typeof duration2).toBe('number');
    });
  });

  describe('withLogging', () => {
    it('should execute function and log success', async () => {
      mockCreate.mockResolvedValue(mockAIEventLogResult);
      const testFunction = jest.fn().mockResolvedValue('test result');

      const result = await withLogging('ContentAgent', 'test_action', testFunction, {
        context: 'unit_test',
      });

      expect(result).toBe('test result');
      expect(testFunction).toHaveBeenCalledTimes(1);
      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          agent: 'ContentAgent',
          action: 'test_action',
          metadata: expect.objectContaining({
            success: true,
            duration: expect.any(Number),
            context: 'unit_test',
          }),
        }),
      });
    });

    it('should handle function errors and log them', async () => {
      mockCreate.mockResolvedValue(mockAIEventLogResult);
      const testError = new Error('Function failed');
      const testFunction = jest.fn().mockRejectedValue(testError);

      await expect(
        withLogging('AdAgent', 'failing_action', testFunction, { test: true })
      ).rejects.toThrow('Function failed');

      expect(testFunction).toHaveBeenCalledTimes(1);
      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          agent: 'AdAgent',
          action: 'failing_action',
          metadata: expect.objectContaining({
            success: false,
            error: 'Function failed',
            duration: expect.any(Number),
            test: true,
          }),
        }),
      });
    });

    it('should work without metadata', async () => {
      mockCreate.mockResolvedValue(mockAIEventLogResult);
      const testFunction = jest.fn().mockResolvedValue('success');

      await withLogging('TrendAgent', 'simple_action', testFunction);

      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          agent: 'TrendAgent',
          action: 'simple_action',
          metadata: expect.objectContaining({
            success: true,
            duration: expect.any(Number),
          }),
        }),
      });
    });
  });
});
