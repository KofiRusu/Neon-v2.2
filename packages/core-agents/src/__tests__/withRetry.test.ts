import { withRetry, withTimeout, withRetryTimeoutFallback } from '../utils/withRetry';

describe('withRetry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return result on first try when function succeeds', async () => {
    const mockFn = jest.fn().mockResolvedValue('success');
    
    const result = await withRetry(mockFn);
    
    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure and eventually succeed', async () => {
    const mockFn = jest.fn()
      .mockRejectedValueOnce(new Error('First failure'))
      .mockRejectedValueOnce(new Error('Second failure'))
      .mockResolvedValue('success');
    
    const result = await withRetry(mockFn, 3, 10);
    
    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(3);
  });

  it('should throw error after exhausting retries', async () => {
    const mockFn = jest.fn().mockRejectedValue(new Error('Always fails'));
    
    await expect(withRetry(mockFn, 2, 10)).rejects.toThrow('Always fails');
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it('should wait between retries', async () => {
    const mockFn = jest.fn()
      .mockRejectedValueOnce(new Error('First failure'))
      .mockResolvedValue('success');
    
    const startTime = Date.now();
    await withRetry(mockFn, 3, 100);
    const endTime = Date.now();
    
    expect(endTime - startTime).toBeGreaterThan(100);
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it('should use exponential backoff for delays', async () => {
    const mockFn = jest.fn()
      .mockRejectedValueOnce(new Error('First failure'))
      .mockRejectedValueOnce(new Error('Second failure'))
      .mockResolvedValue('success');
    
    const startTime = Date.now();
    await withRetry(mockFn, 3, 100);
    const endTime = Date.now();
    
    // Should wait 100ms + 200ms (exponential backoff)
    expect(endTime - startTime).toBeGreaterThan(250);
    expect(mockFn).toHaveBeenCalledTimes(3);
  });
});

describe('withTimeout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return result when promise resolves before timeout', async () => {
    const promise = Promise.resolve('success');
    
    const result = await withTimeout(promise, 1000);
    
    expect(result).toBe('success');
  });

  it('should throw timeout error when promise takes too long', async () => {
    const promise = new Promise(resolve => setTimeout(resolve, 1000));
    
    await expect(withTimeout(promise, 100)).rejects.toThrow('Operation timed out');
  });

  it('should use custom timeout message', async () => {
    const promise = new Promise(resolve => setTimeout(resolve, 1000));
    
    await expect(withTimeout(promise, 100, 'Custom timeout message')).rejects.toThrow('Custom timeout message');
  });

  it('should handle promise rejection before timeout', async () => {
    const promise = Promise.reject(new Error('Promise failed'));
    
    await expect(withTimeout(promise, 1000)).rejects.toThrow('Promise failed');
  });
});

describe('withRetryTimeoutFallback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return result when function succeeds', async () => {
    const mockFn = jest.fn().mockResolvedValue('success');
    
    const result = await withRetryTimeoutFallback(mockFn, 'fallback');
    
    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should return fallback when function fails after retries', async () => {
    const mockFn = jest.fn().mockRejectedValue(new Error('Always fails'));
    
    const result = await withRetryTimeoutFallback(mockFn, 'fallback', { retries: 2 });
    
    expect(result).toBe('fallback');
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it('should return fallback when function times out', async () => {
    const mockFn = jest.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 1000))
    );
    
    const result = await withRetryTimeoutFallback(mockFn, 'fallback', { timeoutMs: 100 });
    
    expect(result).toBe('fallback');
  });

  it('should use custom retry options', async () => {
    const mockFn = jest.fn()
      .mockRejectedValueOnce(new Error('First failure'))
      .mockRejectedValueOnce(new Error('Second failure'))
      .mockResolvedValue('success');
    
    const result = await withRetryTimeoutFallback(mockFn, 'fallback', {
      retries: 3,
      delay: 10,
      timeoutMs: 5000
    });
    
    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(3);
  });

  it('should log warning when falling back', async () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    const mockFn = jest.fn().mockRejectedValue(new Error('Always fails'));
    
    await withRetryTimeoutFallback(mockFn, 'fallback', { retries: 1 });
    
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Operation failed after 1 retries, using fallback:'),
      expect.any(Error)
    );
    
    consoleSpy.mockRestore();
  });
});