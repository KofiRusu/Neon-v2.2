/**
 * Utility function to add retry logic with exponential backoff
 * Prevents crashes and enables graceful degradation
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> {
  let attempt = 0;
  while (attempt < retries) {
    try {
      return await fn();
    } catch (err) {
      attempt++;
      if (attempt === retries) throw err;
      await new Promise(r => setTimeout(r, delay * Math.pow(2, attempt - 1))); // Exponential backoff
    }
  }
  throw new Error("Failed after retries");
}

/**
 * Utility function to add timeout to any promise
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage = "Operation timed out"
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
  });
  
  return Promise.race([promise, timeoutPromise]);
}

/**
 * Utility function to add retry, timeout, and fallback to any operation
 */
export async function withRetryTimeoutFallback<T>(
  fn: () => Promise<T>,
  fallback: T,
  options: {
    retries?: number;
    delay?: number;
    timeoutMs?: number;
  } = {}
): Promise<T> {
  const { retries = 3, delay = 1000, timeoutMs = 30000 } = options;
  
  try {
    return await withRetry(
      () => withTimeout(fn(), timeoutMs),
      retries,
      delay
    );
  } catch (error) {
    console.warn(`Operation failed after ${retries} retries, using fallback:`, error);
    return fallback;
  }
}