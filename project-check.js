#!/usr/bin/env node

/**
 * 🛠️ NeonHub Monorepo Project Check Script
 * 
 * Validates lint, type safety, test pass rates, and build status
 * across both backend (Neon-v2.3.3) and frontend (neonui0.3) directories.
 * 
 * Usage: node project-check.js [--fix] [--verbose]
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const os = require('os');

// Configuration
const CONFIG = {
  backend: {
    name: 'Backend (Neon-v2.3.3)',
    path: './Neon-v2.3.3',
    packageManager: 'npm',
    scripts: {
      lint: 'lint',
      typecheck: 'type-check',
      test: 'test',
      build: 'build'
    }
  },
  frontend: {
    name: 'Frontend (neonui0.3)',
    path: './neonui0.3',
    packageManager: 'npm',
    scripts: {
      lint: 'lint',
      typecheck: 'type-check',
      test: 'test',
      build: 'build'
    }
  }
};

// Global state
const results = {
  timestamp: new Date().toISOString(),
  overall: { passed: 0, failed: 0, skipped: 0 },
  backend: { lint: null, typecheck: null, test: null, build: null },
  frontend: { lint: null, typecheck: null, test: null, build: null },
  errors: [],
  warnings: []
};

// Command line arguments
const args = process.argv.slice(2);
const shouldFix = args.includes('--fix');
const verbose = args.includes('--verbose');

// Utility functions
function log(message, color = 'reset') {
  const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m'
  };
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function execCommand(command, cwd, options = {}) {
  try {
    const output = execSync(command, {
      cwd,
      encoding: 'utf8',
      stdio: verbose ? 'inherit' : 'pipe',
      ...options
    });
    return { success: true, output: output || '', error: null };
  } catch (error) {
    return { 
      success: false, 
      output: error.stdout || '', 
      error: error.stderr || error.message 
    };
  }
}

function ensureDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function checkProjectExists(projectPath) {
  const packageJsonPath = path.join(projectPath, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    log(`❌ Project not found at ${projectPath}`, 'red');
    return false;
  }
  return true;
}

function runCheck(projectName, projectPath, scriptName, checkName, config) {
  log(`\n🔍 Running ${checkName} for ${projectName}...`, 'blue');
  
  if (!checkProjectExists(projectPath)) {
    results[projectName.toLowerCase().includes('backend') ? 'backend' : 'frontend'][scriptName] = {
      status: 'error',
      duration: 0,
      message: 'Project not found'
    };
    results.errors.push(`${projectName}: Project not found at ${projectPath}`);
    results.overall.failed++;
    return false;
  }

  const startTime = Date.now();
  
  // Check if script exists in package.json
  const packageJsonPath = path.join(projectPath, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  if (!packageJson.scripts || !packageJson.scripts[config.scripts[scriptName]]) {
    log(`⚠️  Script '${config.scripts[scriptName]}' not found in ${projectName}`, 'yellow');
    const duration = Date.now() - startTime;
    results[projectName.toLowerCase().includes('backend') ? 'backend' : 'frontend'][scriptName] = {
      status: 'skipped',
      duration,
      message: `Script '${config.scripts[scriptName]}' not found`
    };
    results.overall.skipped++;
    return false;
  }

  // Handle fix mode for linting
  const command = shouldFix && scriptName === 'lint' 
    ? `${config.packageManager} run lint:fix` 
    : `${config.packageManager} run ${config.scripts[scriptName]}`;

  const result = execCommand(command, projectPath);
  const duration = Date.now() - startTime;
  
  const resultKey = projectName.toLowerCase().includes('backend') ? 'backend' : 'frontend';
  
  if (result.success) {
    log(`✅ ${checkName} passed for ${projectName} (${duration}ms)`, 'green');
    results[resultKey][scriptName] = {
      status: 'passed',
      duration,
      message: 'All checks passed'
    };
    results.overall.passed++;
    return true;
  } else {
    log(`❌ ${checkName} failed for ${projectName} (${duration}ms)`, 'red');
    if (verbose) {
      log(`Error: ${result.error}`, 'red');
    }
    results[resultKey][scriptName] = {
      status: 'failed',
      duration,
      message: result.error || 'Check failed',
      output: result.output
    };
    results.errors.push(`${projectName} ${checkName}: ${result.error || 'Check failed'}`);
    results.overall.failed++;
    return false;
  }
}

function generateMarkdownReport() {
  const { backend, frontend, overall, errors, warnings, timestamp } = results;
  
  const formatDuration = (ms) => ms ? `${ms}ms` : 'N/A';
  const getStatusEmoji = (status) => {
    switch (status) {
      case 'passed': return '✅';
      case 'failed': return '❌';
      case 'skipped': return '⏭️';
      default: return '❓';
    }
  };

  const report = `# 🛠️ NeonHub Project Validation Report

**Generated:** ${new Date(timestamp).toLocaleString()}  
**Git Commit:** ${execCommand('git rev-parse HEAD', '.').output.trim().substring(0, 8)}  
**Branch:** ${execCommand('git branch --show-current', '.').output.trim()}  

## 📊 Overall Summary

| Metric | Count |
|--------|-------|
| ✅ Passed | ${overall.passed} |
| ❌ Failed | ${overall.failed} |
| ⏭️ Skipped | ${overall.skipped} |
| **Total** | **${overall.passed + overall.failed + overall.skipped}** |

## 🎯 Project Results

### Backend (Neon-v2.3.3)

| Check | Status | Duration | Notes |
|-------|--------|----------|-------|
| Lint | ${getStatusEmoji(backend.lint?.status)} ${backend.lint?.status || 'not run'} | ${formatDuration(backend.lint?.duration)} | ${backend.lint?.message || ''} |
| TypeCheck | ${getStatusEmoji(backend.typecheck?.status)} ${backend.typecheck?.status || 'not run'} | ${formatDuration(backend.typecheck?.duration)} | ${backend.typecheck?.message || ''} |
| Test | ${getStatusEmoji(backend.test?.status)} ${backend.test?.status || 'not run'} | ${formatDuration(backend.test?.duration)} | ${backend.test?.message || ''} |
| Build | ${getStatusEmoji(backend.build?.status)} ${backend.build?.status || 'not run'} | ${formatDuration(backend.build?.duration)} | ${backend.build?.message || ''} |

### Frontend (neonui0.3)

| Check | Status | Duration | Notes |
|-------|--------|----------|-------|
| Lint | ${getStatusEmoji(frontend.lint?.status)} ${frontend.lint?.status || 'not run'} | ${formatDuration(frontend.lint?.duration)} | ${frontend.lint?.message || ''} |
| TypeCheck | ${getStatusEmoji(frontend.typecheck?.status)} ${frontend.typecheck?.status || 'not run'} | ${formatDuration(frontend.typecheck?.duration)} | ${frontend.typecheck?.message || ''} |
| Test | ${getStatusEmoji(frontend.test?.status)} ${frontend.test?.status || 'not run'} | ${formatDuration(frontend.test?.duration)} | ${frontend.test?.message || ''} |
| Build | ${getStatusEmoji(frontend.build?.status)} ${frontend.build?.status || 'not run'} | ${formatDuration(frontend.build?.duration)} | ${frontend.build?.message || ''} |

## 🚀 CI/CD Status

${overall.failed === 0 ? '✅ **READY FOR DEPLOYMENT**' : '❌ **DEPLOYMENT BLOCKED**'}

${overall.failed === 0 
  ? '🎉 All checks passed! The project is ready for production deployment.' 
  : '⚠️ Please fix the failed checks before deploying to production.'}

## ⚡ Quick Actions

${overall.failed > 0 ? `
### 🔧 Fix Commands

\`\`\`bash
# Fix linting issues automatically
node project-check.js --fix

# Run verbose output for debugging
node project-check.js --verbose

# Manual fixes per project
cd Neon-v2.3.3 && npm run lint:fix && npm run type-check
cd neonui0.3 && npm run lint:fix && npm run type-check
\`\`\`
` : ''}

${errors.length > 0 ? `
## ❌ Errors

${errors.map(error => `- ${error}`).join('\n')}
` : ''}

${warnings.length > 0 ? `
## ⚠️ Warnings

${warnings.map(warning => `- ${warning}`).join('\n')}
` : ''}

---

*Report generated by NeonHub Project Check v1.0.0*
`;

  return report;
}

function saveReport() {
  ensureDirectory('.pushlog');
  const reportPath = '.pushlog/summary.md';
  const report = generateMarkdownReport();
  
  fs.writeFileSync(reportPath, report);
  log(`\n📝 Report saved to ${reportPath}`, 'green');
  
  // Also save a JSON version for CI/CD tools
  const jsonPath = '.pushlog/results.json';
  fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2));
  log(`📊 JSON results saved to ${jsonPath}`, 'cyan');
}

// Main execution
async function main() {
  log('🚀 NeonHub Monorepo Project Check Starting...', 'cyan');
  log(`📅 ${new Date().toLocaleString()}`, 'cyan');
  
  if (shouldFix) {
    log('🔧 Auto-fix mode enabled', 'yellow');
  }
  
  if (verbose) {
    log('📢 Verbose mode enabled', 'yellow');
  }

  const checks = [
    { name: 'lint', description: 'Linting' },
    { name: 'typecheck', description: 'Type Checking' },
    { name: 'test', description: 'Testing' },
    { name: 'build', description: 'Building' }
  ];

  // Run checks for both projects
  for (const [projectKey, config] of Object.entries(CONFIG)) {
    log(`\n🎯 Checking ${config.name}...`, 'magenta');
    
    for (const { name, description } of checks) {
      runCheck(config.name, config.path, name, description, config);
    }
  }

  // Generate and save report
  saveReport();

  // Print summary
  log('\n📋 Summary:', 'cyan');
  log(`✅ Passed: ${results.overall.passed}`, 'green');
  log(`❌ Failed: ${results.overall.failed}`, results.overall.failed > 0 ? 'red' : 'green');
  log(`⏭️ Skipped: ${results.overall.skipped}`, 'yellow');

  // Exit with appropriate code
  const exitCode = results.overall.failed > 0 ? 1 : 0;
  
  if (exitCode === 0) {
    log('\n🎉 All checks passed! Ready for deployment.', 'green');
  } else {
    log('\n⚠️ Some checks failed. Please fix before deploying.', 'red');
  }
  
  process.exit(exitCode);
}

// Handle errors gracefully
process.on('uncaughtException', (error) => {
  log(`\n💥 Uncaught Exception: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log(`\n💥 Unhandled Rejection at: ${promise}, reason: ${reason}`, 'red');
  process.exit(1);
});

// Run the main function
main().catch((error) => {
  log(`\n💥 Fatal Error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});