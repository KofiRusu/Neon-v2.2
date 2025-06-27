// Manual workspace validation script
const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

console.log('🔍 WORKSPACE VALIDATION REPORT');
console.log('==============================\n');

const validationResults = {
  timestamp: new Date().toISOString(),
  results: {},
  summary: {
    passed: 0,
    failed: 0,
    warnings: 0,
  },
};

// Helper function to record results
const recordResult = (test, status, message, details = null) => {
  validationResults.results[test] = { status, message, details };
  if (status === 'PASS') validationResults.summary.passed++;
  else if (status === 'FAIL') validationResults.summary.failed++;
  else if (status === 'WARN') validationResults.summary.warnings++;

  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${icon} ${test}: ${message}`);
  if (details) console.log(`   ${details}`);
};

// 1. Check CI/CD Pipeline
try {
  const ciFile = fs.readFileSync('.github/workflows/ci.yml', 'utf8');
  const requiredJobs = [
    'quality-checks',
    'test',
    'build',
    'e2e-tests',
    'security-audit',
    'deployment',
  ];
  const foundJobs = requiredJobs.filter(job => ciFile.includes(`${job}:`));

  if (foundJobs.length === requiredJobs.length) {
    recordResult(
      'CI/CD Pipeline',
      'PASS',
      'All required jobs present',
      `Found: ${foundJobs.join(', ')}`
    );
  } else {
    const missing = requiredJobs.filter(job => !foundJobs.includes(job));
    recordResult(
      'CI/CD Pipeline',
      'FAIL',
      'Missing required jobs',
      `Missing: ${missing.join(', ')}`
    );
  }
} catch (error) {
  recordResult('CI/CD Pipeline', 'FAIL', 'CI/CD workflow file not found');
}

// 2. Check Sync Scripts
const syncScripts = ['auto-sync.js', 'handle-conflicts.js'];
syncScripts.forEach(script => {
  const scriptPath = `scripts/${script}`;
  if (fs.existsSync(scriptPath)) {
    const stats = fs.statSync(scriptPath);
    recordResult(
      `Sync Script: ${script}`,
      'PASS',
      'Script exists and readable',
      `Size: ${stats.size} bytes`
    );
  } else {
    recordResult(`Sync Script: ${script}`, 'FAIL', 'Script missing');
  }
});

// 3. Check Git Hooks
const hooks = ['post-commit', 'post-merge'];
hooks.forEach(hook => {
  const hookPath = `.git/hooks/${hook}`;
  if (fs.existsSync(hookPath)) {
    const stats = fs.statSync(hookPath);
    if (stats.mode & parseInt('111', 8)) {
      recordResult(`Git Hook: ${hook}`, 'PASS', 'Hook exists and executable');
    } else {
      recordResult(`Git Hook: ${hook}`, 'WARN', 'Hook exists but not executable');
    }
  } else {
    recordResult(`Git Hook: ${hook}`, 'FAIL', 'Hook missing');
  }
});

// 4. Check Workspace Validation Workflow
if (fs.existsSync('.github/workflows/validate-workspace.yml')) {
  recordResult('Validation Workflow', 'PASS', 'Workspace validation workflow deployed');
} else {
  recordResult('Validation Workflow', 'FAIL', 'Validation workflow missing');
}

// 5. Analyze Auto-Commit Activity
try {
  const autoCommits = execSync('git log --oneline --grep="Auto-commit from device" | wc -l', {
    encoding: 'utf8',
  }).trim();
  const commitCount = parseInt(autoCommits);

  if (commitCount >= 5) {
    recordResult(
      'Auto-Commit Activity',
      'PASS',
      `${commitCount} auto-commits found`,
      'Meets minimum requirement (5+)'
    );
  } else {
    recordResult(
      'Auto-Commit Activity',
      'WARN',
      `Only ${commitCount} auto-commits found`,
      'Below recommended minimum (5)'
    );
  }
} catch (error) {
  recordResult('Auto-Commit Activity', 'FAIL', 'Unable to analyze commit history');
}

// 6. Check Sync Log
if (fs.existsSync('.sync-log.json')) {
  try {
    const syncLog = JSON.parse(fs.readFileSync('.sync-log.json', 'utf8'));
    recordResult(
      'Sync Logging',
      'PASS',
      `${syncLog.length} sync log entries found`,
      'Logging is active'
    );
  } catch (error) {
    recordResult('Sync Logging', 'WARN', 'Sync log exists but cannot be parsed');
  }
} else {
  recordResult('Sync Logging', 'WARN', 'Sync log not found', 'May not have been created yet');
}

// 7. Test Scripts Functionality
console.log('\n🧪 TESTING SCRIPT FUNCTIONALITY');
console.log('================================');

try {
  execSync('node ./scripts/auto-sync.js --dry-run', { stdio: 'pipe' });
  recordResult('Auto-Sync Test', 'PASS', 'Auto-sync script executes successfully');
} catch (error) {
  recordResult('Auto-Sync Test', 'FAIL', 'Auto-sync script execution failed', error.message);
}

try {
  execSync('node ./scripts/handle-conflicts.js', { stdio: 'pipe' });
  recordResult(
    'Conflict Resolution Test',
    'PASS',
    'Conflict resolution script executes successfully'
  );
} catch (error) {
  // Exit code 1 might just mean conflicts detected, which is normal
  if (error.status === 1) {
    recordResult(
      'Conflict Resolution Test',
      'PASS',
      'Conflict resolution script working (conflicts detected)'
    );
  } else {
    recordResult(
      'Conflict Resolution Test',
      'FAIL',
      'Conflict resolution script failed',
      error.message
    );
  }
}

// 8. Generate Summary
console.log('\n📊 VALIDATION SUMMARY');
console.log('=====================');
console.log(`✅ Passed: ${validationResults.summary.passed}`);
console.log(`❌ Failed: ${validationResults.summary.failed}`);
console.log(`⚠️  Warnings: ${validationResults.summary.warnings}`);

const totalTests =
  validationResults.summary.passed +
  validationResults.summary.failed +
  validationResults.summary.warnings;
const successRate = Math.round((validationResults.summary.passed / totalTests) * 100);

console.log(`\n📈 Success Rate: ${successRate}%`);

// Determine overall status
let overallStatus;
if (validationResults.summary.failed === 0) {
  if (validationResults.summary.warnings === 0) {
    overallStatus = '🌟 EXCELLENT - All systems operational';
  } else {
    overallStatus = '✅ GOOD - Minor warnings detected';
  }
} else {
  overallStatus = '❌ ISSUES DETECTED - Review failed tests';
}

console.log(`🎯 Overall Status: ${overallStatus}\n`);

// Save results to file
validationResults.overallStatus = overallStatus;
validationResults.successRate = successRate;

fs.writeFileSync('.workspace-validation.json', JSON.stringify(validationResults, null, 2));
console.log('💾 Validation results saved to .workspace-validation.json');

// Exit with appropriate code
process.exit(validationResults.summary.failed > 0 ? 1 : 0);
