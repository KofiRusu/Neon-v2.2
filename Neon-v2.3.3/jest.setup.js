// Jest setup for core-agents package
// Environment setup and global mocks

// Set up test environment
process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "file:./test.db";
process.env.OPENAI_API_KEY = "sk-test-key";

// Mock logger to prevent undefined errors
const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  trace: jest.fn(),
};

// Global mocks
global.console = {
  ...console,
  // Suppress console output during tests
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock dependencies that cause issues
jest.mock("@neon/data-model", () => require("./__mocks__/@neon/data-model.js"));

jest.mock("./src/lib/agents/logger", () => ({
  logger: mockLogger,
}));

jest.mock("@neon/utils", () => ({
  logger: mockLogger,
  agentLogger: mockLogger,
}));

// Mock Redis
jest.mock("redis", () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    flushAll: jest.fn(),
  })),
}));

// Global test utilities
beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  jest.restoreAllMocks();
});
