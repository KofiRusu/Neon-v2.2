// Simple test to validate Jest setup
describe('Agent System Setup', () => {
  it('should pass basic test', () => {
    expect(true).toBe(true);
  });

  it('should have proper environment', () => {
    expect(process.env.NODE_ENV).toBe('test');
  });
});