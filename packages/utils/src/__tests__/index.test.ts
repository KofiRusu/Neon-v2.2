/**
 * Unit tests for utility functions
 */

import {
  delay,
  generateId,
  safeJsonParse,
  debounce,
  throttle,
  retry,
  isNotNullish,
  chunk,
  pick,
} from '../index';

describe('Utility Functions', () => {
  describe('delay', () => {
    it('should delay execution for specified milliseconds', async () => {
      const start = Date.now();
      await delay(100);
      const end = Date.now();

      expect(end - start).toBeGreaterThanOrEqual(90); // Allow some tolerance
    });
  });

  describe('generateId', () => {
    it('should generate a valid UUID v4', () => {
      const id = generateId();
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

      expect(id).toMatch(uuidRegex);
    });

    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();

      expect(id1).not.toBe(id2);
    });
  });

  describe('safeJsonParse', () => {
    it('should parse valid JSON successfully', () => {
      const json = '{"name": "test", "value": 123}';
      const result = safeJsonParse(json);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ name: 'test', value: 123 });
      }
    });

    it('should handle invalid JSON gracefully', () => {
      const json = '{"invalid": json}';
      const result = safeJsonParse(json);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('JSON_PARSE_ERROR');
        expect(result.error.message).toBe('Failed to parse JSON');
      }
    });
  });

  describe('debounce', () => {
    it('should debounce function calls', async () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn();
      debouncedFn();
      debouncedFn();

      expect(mockFn).not.toHaveBeenCalled();

      await delay(150);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('throttle', () => {
    it('should throttle function calls', async () => {
      const mockFn = jest.fn();
      const throttledFn = throttle(mockFn, 100);

      throttledFn();
      throttledFn();
      throttledFn();

      expect(mockFn).toHaveBeenCalledTimes(1);

      await delay(150);
      throttledFn();
      expect(mockFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('retry', () => {
    it('should retry failed operations', async () => {
      let attempts = 0;
      const operation = jest.fn().mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Operation failed');
        }
        return 'success';
      });

      const result = await retry(operation, 3, 10);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should throw error after max attempts', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Always fails'));

      await expect(retry(operation, 2, 10)).rejects.toThrow('Always fails');
      expect(operation).toHaveBeenCalledTimes(2);
    });
  });

  describe('isNotNullish', () => {
    it('should return true for non-nullish values', () => {
      expect(isNotNullish('test')).toBe(true);
      expect(isNotNullish(123)).toBe(true);
      expect(isNotNullish(false)).toBe(true);
      expect(isNotNullish(0)).toBe(true);
      expect(isNotNullish('')).toBe(true);
    });

    it('should return false for nullish values', () => {
      expect(isNotNullish(null)).toBe(false);
      expect(isNotNullish(undefined)).toBe(false);
    });
  });

  describe('chunk', () => {
    it('should split array into chunks of specified size', () => {
      const array = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      const chunks = chunk(array, 3);

      expect(chunks).toEqual([
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
      ]);
    });

    it('should handle arrays that dont divide evenly', () => {
      const array = [1, 2, 3, 4, 5];
      const chunks = chunk(array, 2);

      expect(chunks).toEqual([[1, 2], [3, 4], [5]]);
    });
  });

  describe('pick', () => {
    it('should pick specified keys from object', () => {
      const obj = { a: 1, b: 2, c: 3, d: 4 };
      const picked = pick(obj, ['a', 'c']);

      expect(picked).toEqual({ a: 1, c: 3 });
    });

    it('should handle non-existent keys gracefully', () => {
      const obj = { a: 1, b: 2 };
      const picked = pick(obj, ['a', 'c' as keyof typeof obj]);

      expect(picked).toEqual({ a: 1 });
    });
  });
});
