import { describe, it, expect } from '@jest/globals';

describe('Simple Test Suite', () => {
  it('should pass basic test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should handle string concatenation', () => {
    const result = 'Hello' + ' ' + 'World';
    expect(result).toBe('Hello World');
  });

  it('should work with async operations', async () => {
    const asyncResult = await Promise.resolve('test');
    expect(asyncResult).toBe('test');
  });

  it('should handle object comparisons', () => {
    const obj1 = { name: 'test', value: 42 };
    const obj2 = { name: 'test', value: 42 };
    expect(obj1).toEqual(obj2);
  });

  it('should handle array operations', () => {
    const arr = [1, 2, 3];
    arr.push(4);
    expect(arr).toHaveLength(4);
    expect(arr).toContain(4);
  });
});
