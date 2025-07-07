/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.ts", "**/?(*.)+(spec|test).ts"],
  transform: {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.json",
        useESM: false,
      },
    ],
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@neon/data-model$": "<rootDir>/__mocks__/@neon/data-model.js",
    "^@neon/utils$": "<rootDir>/__mocks__/@neon/utils.js",
    "^@neon/types$": "<rootDir>/src/lib/types",
    "^@neon/(.*)$": "<rootDir>/src/lib/$1",
  },
  transformIgnorePatterns: ["node_modules/(?!(.*\\.mjs$))"],
  extensionsToTreatAsEsm: [],
  globals: {
    "ts-jest": {
      useESM: false,
    },
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/*.test.{ts,tsx}",
    "!src/**/*.spec.{ts,tsx}",
    "!src/**/__mocks__/**",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  testTimeout: 30000,
  maxWorkers: "50%",
};
