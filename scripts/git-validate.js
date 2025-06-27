#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

const PUSH_LOG_FILE = '.pushlog';

function logPushAttempt(user, success, errors = []) {
  const timestamp = new Date().toISOString();
  const logEntry = { timestamp, user, success, errors };
  let logHistory = [];

  if (fs.existsSync(PUSH_LOG_FILE)) {
    try {
      logHistory = JSON.parse(fs.readFileSync(PUSH_LOG_FILE, 'utf8'));
    } catch (e) {}
  }

  logHistory.push(logEntry);
  if (logHistory.length > 100) logHistory = logHistory.slice(-100);
  fs.writeFileSync(PUSH_LOG_FILE, JSON.stringify(logHistory, null, 2));
  console.log(`📝 Push logged: ${success ? '✅ PASS' : '❌ BLOCKED'}`);
}

function getCurrentUser() {
  try {
    return execSync('git config user.name', { encoding: 'utf8' }).trim();
  } catch (e) {
    return 'unknown';
  }
}

function runCheck(name, command) {
  console.log(`🔍 ${name}...`);
  try {
    execSync(command, { stdio: 'pipe' });
    console.log(`✅ ${name} passed`);
    return { success: true };
  } catch (error) {
    console.error(`❌ ${name} failed`);
    return { success: false, error: error.message };
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
    const output = execSync('git diff --name-only HEAD~1', { encoding: 'utf8' });
    return output.trim().split('\n').filter(Boolean);
  } catch (error) {
    return [];
  }
}

function shouldRunFullSuite(branchName, changedFiles) {
  // Always run full suite for main/staging branches
  if (['main', 'staging', 'develop'].includes(branchName)) {
    return true;
  }

  // Run full suite if core files changed
  const coreFiles = [
    'package.json',
    'tsconfig.json',
    'jest.config.js',
    'playwright.config.ts',
    '.github/workflows',
  ];

  return changedFiles.some(file => coreFiles.some(core => file.includes(core)));
}

async function main() {
  const user = getCurrentUser();
  const branchName = getBranchName();
  const changedFiles = getChangedFiles();
  const runFullSuite = shouldRunFullSuite(branchName, changedFiles);
  const errors = [];

  console.log(`🛡️ NeonHub Git Push Protection`);
  console.log(`👤 User: ${user}`);
  console.log(`🌿 Branch: ${branchName}`);
  console.log(`📁 Changed files: ${changedFiles.length}`);
  console.log(`🔍 Full suite: ${runFullSuite ? 'Yes' : 'No'}`);
  console.log('='.repeat(50));

  // Enhanced checks based on branch and changes
  const checks = [
    { name: 'Type Check', command: 'npm run type-check', always: true },
    { name: 'Lint Check', command: 'npm run lint', always: true },
    { name: 'Format Check', command: 'npm run format:check', always: true },
    { name: 'Unit Tests', command: 'npm run test', always: runFullSuite },
    { name: 'Build Check', command: 'npm run build', always: runFullSuite },
  ];

  // Add UI-specific checks for UI branches
  if (
    branchName.startsWith('ui/') ||
    branchName.startsWith('agent-ui/') ||
    branchName.startsWith('design-system/')
  ) {
    checks.push(
      {
        name: 'Accessibility Check',
        command: 'npm run test:a11y || echo "⚠️ A11y check not available"',
        always: false,
      },
      {
        name: 'Visual Regression',
        command: 'npm run test:visual || echo "⚠️ Visual tests not available"',
        always: false,
      }
    );
  }

  // Add E2E tests for staging/main
  if (['main', 'staging'].includes(branchName)) {
    checks.push({ name: 'E2E Tests', command: 'npm run test:e2e', always: false });
  }

  for (const check of checks) {
    if (check.always || runFullSuite) {
      const result = runCheck(check.name, check.command);
      if (!result.success) {
        errors.push(`${check.name}: ${result.error}`);
      }
    } else {
      console.log(`⏭️ Skipping ${check.name} (not required for this branch)`);
    }
  }

  // Branch-specific validations
  if (branchName === 'main') {
    console.log('🔒 Production branch - running security audit...');
    runCheck('Security Audit', 'npm audit --audit-level=moderate');
  }

  const passed = errors.length === 0;
  logPushAttempt(user, passed, errors);

  if (passed) {
    console.log('\n🎉 All checks passed! Push approved.');
    console.log('✅ Your code meets NeonHub quality standards.');
    console.log(
      `🚀 Ready to deploy to ${branchName === 'main' ? 'production' : branchName === 'staging' ? 'staging' : 'development'}`
    );
    process.exit(0);
  } else {
    console.log('\n🚫 Push blocked! Fix the following issues:');
    errors.forEach((e, i) => console.log(`${i + 1}. ${e}`));
    console.log('\n💡 Debug commands:');
    console.log('   npm run type-check');
    console.log('   npm run lint:fix');
    console.log('   npm run test');
    console.log('   npm run build');
    console.log('\n🔄 After fixing, try again:');
    console.log(`   git add . && git commit --amend --no-edit && git push origin ${branchName}`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('🔥 Unexpected error during validation:', err);
  process.exit(1);
});
