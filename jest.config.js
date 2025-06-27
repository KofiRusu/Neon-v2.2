module.exports = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  globals: {
    'ts-jest': {
      useESM: true,
      tsconfig: {
        module: 'esnext',
      },
    },
  },
  moduleNameMapping: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: {
          module: 'esnext',
        },
      },
    ],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testMatch: ['**/__tests__/**/*.(ts|js)', '**/*.(test|spec).(ts|js)'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    'packages/**/*.{ts,tsx}',
    'apps/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/__tests__/**',
    '!packages/**/*.d.ts',
    '!packages/**/*.test.{ts,tsx}',
    '!packages/**/__tests__/**',
    '!apps/**/*.d.ts',
    '!apps/**/*.test.{ts,tsx}',
    '!apps/**/__tests__/**',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/.next/**',
  ],
  // 🛡️ COVERAGE THRESHOLDS - Pre-Push Guard Requirements
  coverageThreshold: {
    global: {
      statements: 85,
      branches: 80,
      functions: 85,
      lines: 85,
    },
    // Agent-specific stricter thresholds
    'packages/core-agents/src/agents/*.ts': {
      statements: 90,
      branches: 85,
      functions: 90,
      lines: 90,
    },
    // API endpoints require high coverage
    'apps/api/src/routers/*.ts': {
      statements: 88,
      branches: 82,
      functions: 88,
      lines: 88,
    },
  },
  coverageReporters: ['text', 'text-summary', 'html', 'json', 'lcov'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testTimeout: 30000,
  maxWorkers: 1,
  verbose: true,
  // 🚀 Enhanced error reporting
  bail: 1,
  errorOnDeprecated: true,
  projects: [
    {
      displayName: 'core-agents',
      testMatch: ['<rootDir>/packages/core-agents/**/*.(test|spec).(ts|js)'],
      preset: 'ts-jest/presets/default-esm',
      testEnvironment: 'node',
      extensionsToTreatAsEsm: ['.ts'],
      globals: {
        'ts-jest': {
          useESM: true,
          tsconfig: {
            module: 'esnext',
          },
        },
      },
      moduleNameMapping: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
      },
      transform: {
        '^.+\\.tsx?$': [
          'ts-jest',
          {
            useESM: true,
            tsconfig: {
              module: 'esnext',
            },
          },
        ],
      },
      collectCoverageFrom: [
        'src/**/*.{ts,tsx}',
        '!src/**/*.d.ts',
        '!src/**/*.test.{ts,tsx}',
        '!src/**/__tests__/**',
      ],
      coverageThreshold: {
        global: {
          statements: 88,
          branches: 82,
          functions: 88,
          lines: 88,
        },
      },
    },
    {
      displayName: 'reasoning-engine',
      testMatch: ['<rootDir>/packages/reasoning-engine/**/*.(test|spec).(ts|js)'],
      preset: 'ts-jest/presets/default-esm',
      testEnvironment: 'node',
      extensionsToTreatAsEsm: ['.ts'],
      globals: {
        'ts-jest': {
          useESM: true,
        },
      },
      coverageThreshold: {
        global: {
          statements: 85,
          branches: 80,
          functions: 85,
          lines: 85,
        },
      },
    },
    {
      displayName: 'utils',
      testMatch: ['<rootDir>/packages/utils/**/*.(test|spec).(ts|js)'],
      preset: 'ts-jest/presets/default-esm',
      testEnvironment: 'node',
      extensionsToTreatAsEsm: ['.ts'],
      globals: {
        'ts-jest': {
          useESM: true,
        },
      },
      coverageThreshold: {
        global: {
          statements: 90,
          branches: 85,
          functions: 90,
          lines: 90,
        },
      },
    },
  ],
};
