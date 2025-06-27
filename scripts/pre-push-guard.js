#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PUSH_LOG_FILE = '.pushlog';
const COVERAGE_THRESHOLD = {
  statements: 85,
  branches: 80,
  functions: 85,
  lines: 85,
};

// 🎨 Enhanced logging with colors
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bold: '\x1b[1m',
};

function log(message, color = colors.white) {
  console.log(`${color}${message}${colors.reset}`);
}

function logPushAttempt(user, success, errors = [], coverageReport = null) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    user,
    success,
    errors,
    coverage: coverageReport?.summary || null,
    branch: getBranchName(),
  };

  let logHistory = [];
  if (fs.existsSync(PUSH_LOG_FILE)) {
    try {
      logHistory = JSON.parse(fs.readFileSync(PUSH_LOG_FILE, 'utf8'));
    } catch (e) {}
  }

  logHistory.push(logEntry);
  if (logHistory.length > 100) logHistory = logHistory.slice(-100);

  fs.writeFileSync(PUSH_LOG_FILE, JSON.stringify(logHistory, null, 2));
  log(
    `📝 Push logged: ${success ? '✅ APPROVED' : '🚫 BLOCKED'}`,
    success ? colors.green : colors.red
  );
}

function getCurrentUser() {
  try {
    return execSync('git config user.name', { encoding: 'utf8' }).trim();
  } catch (e) {
    return 'unknown';
  }
}

function getBranchName() {
  try {
    return execSync('git branch --show-current', { encoding: 'utf8' }).trim();
  } catch (error) {
    return 'unknown';
  }
}

function getChangedFiles() {
  try {
    const output = execSync('git diff --name-only HEAD~1 HEAD', { encoding: 'utf8' });
    return output.trim().split('\n').filter(Boolean);
  } catch (error) {
    // Fallback to staged files if no commits yet
    try {
      const staged = execSync('git diff --cached --name-only', { encoding: 'utf8' });
      return staged.trim().split('\n').filter(Boolean);
    } catch (e) {
      return [];
    }
  }
}

function runCheck(name, command, criticalLevel = 'error') {
  log(`🔍 ${name}...`, colors.cyan);
  try {
    const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    log(`✅ ${name} passed`, colors.green);
    return { success: true, output };
  } catch (error) {
    const level = criticalLevel === 'error' ? colors.red : colors.yellow;
    log(`${criticalLevel === 'error' ? '❌' : '⚠️'} ${name} failed`, level);

    if (error.stdout) {
      console.log(error.stdout.toString());
    }
    if (error.stderr) {
      console.error(error.stderr.toString());
    }

    return {
      success: false,
      error: error.message,
      stdout: error.stdout?.toString(),
      stderr: error.stderr?.toString(),
    };
  }
}

function parseCoverageReport() {
  const coveragePath = path.join(process.cwd(), 'coverage', 'coverage-summary.json');

  if (!fs.existsSync(coveragePath)) {
    return null;
  }

  try {
    const coverageData = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
    return coverageData;
  } catch (error) {
    log(`⚠️ Could not parse coverage report: ${error.message}`, colors.yellow);
    return null;
  }
}

function validateCoverage(coverageReport) {
  if (!coverageReport || !coverageReport.total) {
    return { passed: false, message: 'No coverage report found' };
  }

  const { total } = coverageReport;
  const failures = [];

  // Check each metric against thresholds
  Object.entries(COVERAGE_THRESHOLD).forEach(([metric, threshold]) => {
    const actual = total[metric]?.pct || 0;
    if (actual < threshold) {
      failures.push(`${metric}: ${actual}% < ${threshold}% required`);
    }
  });

  if (failures.length > 0) {
    return {
      passed: false,
      message: `Coverage thresholds not met:\n${failures.map(f => `  • ${f}`).join('\n')}`,
    };
  }

  return {
    passed: true,
    message: `Coverage: ${total.statements.pct}% statements, ${total.branches.pct}% branches, ${total.functions.pct}% functions, ${total.lines.pct}% lines`,
  };
}

function shouldRunFullSuite(branchName, changedFiles) {
  // Always run full suite for main/staging branches
  if (['main', 'staging', 'develop', 'production'].includes(branchName)) {
    return true;
  }

  // Run full suite if critical files changed
  const criticalFiles = [
    'package.json',
    'tsconfig.json',
    'jest.config.js',
    'playwright.config.ts',
    '.github/workflows',
    'apps/api',
    'packages/core-agents',
  ];

  return changedFiles.some(file => criticalFiles.some(critical => file.includes(critical)));
}

async function main() {
  const user = getCurrentUser();
  const branchName = getBranchName();
  const changedFiles = getChangedFiles();
  const runFullSuite = shouldRunFullSuite(branchName, changedFiles);
  const errors = [];
  let coverageReport = null;

  // 🎨 Header
  log('\n🛡️ NeonHub Pre-Push Guard - Zero Bug Policy', colors.bold + colors.magenta);
  log('='.repeat(50), colors.magenta);
  log(`👤 User: ${user}`, colors.cyan);
  log(`🌿 Branch: ${branchName}`, colors.cyan);
  log(`📁 Changed files: ${changedFiles.length}`, colors.cyan);
  log(`🔍 Full suite: ${runFullSuite ? 'Yes' : 'No'}`, colors.cyan);
  log('='.repeat(50), colors.magenta);

  // 🚀 Phase 1: Static Analysis (Always Required)
  log('\n📋 Phase 1: Static Analysis', colors.bold + colors.blue);
  log('-'.repeat(30), colors.blue);

  const staticChecks = [
    { name: 'TypeScript Compilation', command: 'npm run type-check', critical: true },
    { name: 'ESLint Validation', command: 'npm run lint', critical: true },
    { name: 'Prettier Format Check', command: 'npm run format:check', critical: true },
  ];

  for (const check of staticChecks) {
    const result = runCheck(check.name, check.command);
    if (!result.success) {
      errors.push(`${check.name}: ${result.error}`);
    }
  }

  // 🧪 Phase 2: Testing & Coverage (Critical for main branches)
  log('\n🧪 Phase 2: Testing & Coverage Enforcement', colors.bold + colors.blue);
  log('-'.repeat(40), colors.blue);

  if (runFullSuite || ['main', 'staging', 'develop'].includes(branchName)) {
    // Run tests with coverage
    const testResult = runCheck('Unit Tests with Coverage', 'npm run test:coverage');
    if (!testResult.success) {
      errors.push(`Unit Tests: ${testResult.error}`);
    } else {
      // Parse and validate coverage
      coverageReport = parseCoverageReport();
      const coverageValidation = validateCoverage(coverageReport);

      if (coverageValidation.passed) {
        log(`✅ ${coverageValidation.message}`, colors.green);
      } else {
        log(`❌ ${coverageValidation.message}`, colors.red);
        errors.push(`Coverage: ${coverageValidation.message}`);
      }
    }
  } else {
    // Run basic tests without coverage for feature branches
    const result = runCheck('Basic Unit Tests', 'npm run test --passwithNotests', 'warning');
    if (!result.success) {
      log('⚠️ Tests failed but continuing for feature branch', colors.yellow);
    }
  }

  // 🏗️ Phase 3: Build Validation (Critical branches only)
  if (runFullSuite) {
    log('\n🏗️ Phase 3: Build Validation', colors.bold + colors.blue);
    log('-'.repeat(25), colors.blue);

    const buildResult = runCheck('Production Build', 'npm run build');
    if (!buildResult.success) {
      errors.push(`Build: ${buildResult.error}`);
    }
  }

  // 🔒 Phase 4: Security & Quality (Production branches)
  if (['main', 'production'].includes(branchName)) {
    log('\n🔒 Phase 4: Security & Production Checks', colors.bold + colors.blue);
    log('-'.repeat(40), colors.blue);

    const securityChecks = [
      { name: 'Security Audit', command: 'npm audit --audit-level=moderate', critical: false },
      {
        name: 'Bundle Analysis',
        command: 'npm run analyze || echo "Bundle analysis not available"',
        critical: false,
      },
    ];

    for (const check of securityChecks) {
      const result = runCheck(check.name, check.command, 'warning');
      if (!result.success && check.critical) {
        errors.push(`${check.name}: ${result.error}`);
      }
    }
  }

  // 📊 Final Assessment
  const passed = errors.length === 0;
  logPushAttempt(user, passed, errors, coverageReport);

  log(`\n${'='.repeat(50)}`, colors.magenta);
  if (passed) {
    log('🎉 PRE-PUSH GUARD: ALL CHECKS PASSED!', colors.bold + colors.green);
    log('✅ Your code meets NeonHub enterprise standards', colors.green);
    log(
      `🚀 Ready for ${branchName === 'main' ? 'PRODUCTION' : branchName.toUpperCase()} deployment`,
      colors.green
    );

    if (coverageReport) {
      const { total } = coverageReport;
      log(
        `📊 Coverage: ${total.statements.pct}%S | ${total.branches.pct}%B | ${total.functions.pct}%F | ${total.lines.pct}%L`,
        colors.cyan
      );
    }

    log('='.repeat(50), colors.magenta);
    process.exit(0);
  } else {
    log('🚫 PRE-PUSH GUARD: BLOCKED - ZERO BUG POLICY', colors.bold + colors.red);
    log('\n💥 Critical Issues Found:', colors.red);
    errors.forEach((error, i) => {
      log(`   ${i + 1}. ${error}`, colors.red);
    });

    log('\n🔧 Quick Fix Commands:', colors.yellow);
    log('   npm run lint:fix          # Auto-fix linting issues', colors.yellow);
    log('   npm run format            # Auto-fix formatting', colors.yellow);
    log('   npm run type-check        # Check TypeScript errors', colors.yellow);
    log('   npm run test:coverage     # Run tests with coverage', colors.yellow);
    log('   npm run build             # Test production build', colors.yellow);

    log('\n🔄 After fixing, retry push:', colors.cyan);
    log(
      `   git add . && git commit --amend --no-edit && git push origin ${branchName}`,
      colors.cyan
    );

    log('='.repeat(50), colors.magenta);
    process.exit(1);
  }
}

// Handle unexpected errors
process.on('uncaughtException', error => {
  log('🔥 Unexpected error during pre-push validation:', colors.red);
  console.error(error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log('🔥 Unhandled promise rejection during pre-push validation:', colors.red);
  console.error('At:', promise, 'reason:', reason);
  process.exit(1);
});

main().catch(err => {
  log('🔥 Pre-push guard failed with unexpected error:', colors.red);
  console.error(err);
  process.exit(1);
});
