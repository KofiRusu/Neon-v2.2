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
    path: '.',  // Current directory when run from Neon-v2.3.3
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
    path: '../neonui0.3',  // Relative to Neon-v2.3.3 directory
    packageManager: 'npm',
    scripts: {
      lint: 'lint',
      typecheck: 'type-check',
      test: 'test',
      build: 'build'
    }
  }
};

// CLI Arguments
const args = process.argv.slice(2);
const shouldFix = args.includes('--fix');
const isVerbose = args.includes('--verbose');

// Results Storage
const results = {
  timestamp: new Date().toISOString(),
  summary: {
    totalChecks: 0,
    passedChecks: 0,
    failedChecks: 0,
    skippedChecks: 0
  },
  backend: {
    lint: { status: 'pending', duration: 0, issues: [] },
    typecheck: { status: 'pending', duration: 0, issues: [] },
    test: { status: 'pending', duration: 0, coverage: null },
    build: { status: 'pending', duration: 0, size: null }
  },
  frontend: {
    lint: { status: 'pending', duration: 0, issues: [] },
    typecheck: { status: 'pending', duration: 0, issues: [] },
    test: { status: 'pending', duration: 0, coverage: null },
    build: { status: 'pending', duration: 0, size: null }
  }
};

// Utility Functions
const log = (message, level = 'info') => {
  const timestamp = new Date().toISOString();
  const colors = {
    info: '\x1b[36m',    // Cyan
    success: '\x1b[32m', // Green
    warning: '\x1b[33m', // Yellow
    error: '\x1b[31m',   // Red
    reset: '\x1b[0m'
  };
  
  if (isVerbose || level !== 'info') {
    console.log(`${colors[level]}[${timestamp}] ${message}${colors.reset}`);
  }
};

const fileExists = (filePath) => {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
};

const runCommand = (command, workingDir, options = {}) => {
  const startTime = Date.now();
  
  try {
    log(`Running: ${command} in ${workingDir}`, 'info');
    
    const result = execSync(command, {
      cwd: workingDir,
      encoding: 'utf8',
      stdio: isVerbose ? 'inherit' : 'pipe',
      timeout: options.timeout || 300000, // 5 minutes default
      ...options
    });
    
    const duration = Date.now() - startTime;
    log(`✅ Command completed in ${duration}ms`, 'success');
    
    return {
      success: true,
      output: result,
      duration,
      command
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    log(`❌ Command failed in ${duration}ms: ${error.message}`, 'error');
    
    return {
      success: false,
      output: error.stdout || error.message,
      error: error.message,
      duration,
      command
    };
  }
};

const checkDependencies = (projectConfig) => {
  const packageJsonPath = path.join(projectConfig.path, 'package.json');
  
  if (!fileExists(packageJsonPath)) {
    log(`❌ No package.json found in ${projectConfig.path}`, 'error');
    return false;
  }
  
  const nodeModulesPath = path.join(projectConfig.path, 'node_modules');
  const lockFilePath = path.join(projectConfig.path, 'package-lock.json');
  
  if (!fileExists(nodeModulesPath)) {
    log(`⚠️  No node_modules found in ${projectConfig.path}`, 'warning');
    
    if (shouldFix) {
      log(`🔧 Installing dependencies...`, 'info');
      const installResult = runCommand(
        `${projectConfig.packageManager} install`, 
        projectConfig.path
      );
      
      if (!installResult.success) {
        log(`❌ Failed to install dependencies: ${installResult.error}`, 'error');
        return false;
      }
    } else {
      log(`ℹ️  Run with --fix to install dependencies`, 'info');
      return false;
    }
  }
  
  return true;
};

const runLintCheck = (projectConfig, component) => {
  log(`🔍 Running lint check for ${component}...`, 'info');
  
  const packageJsonPath = path.join(projectConfig.path, 'package.json');
  
  if (!fileExists(packageJsonPath)) {
    results[component].lint.status = 'skipped';
    results[component].lint.issues.push('No package.json found');
    results.summary.skippedChecks++;
    return;
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const lintScript = packageJson.scripts?.[projectConfig.scripts.lint];
  
  if (!lintScript) {
    results[component].lint.status = 'skipped';
    results[component].lint.issues.push('No lint script found in package.json');
    results.summary.skippedChecks++;
    return;
  }
  
  const lintCommand = shouldFix ? 
    `${projectConfig.packageManager} run ${projectConfig.scripts.lint} --fix` :
    `${projectConfig.packageManager} run ${projectConfig.scripts.lint}`;
  
  const lintResult = runCommand(lintCommand, projectConfig.path);
  
  results[component].lint.duration = lintResult.duration;
  results[component].lint.status = lintResult.success ? 'passed' : 'failed';
  
  if (!lintResult.success) {
    results[component].lint.issues.push(lintResult.error);
    results.summary.failedChecks++;
  } else {
    results.summary.passedChecks++;
  }
  
  results.summary.totalChecks++;
};

const runTypeCheck = (projectConfig, component) => {
  log(`🔍 Running type check for ${component}...`, 'info');
  
  const tsconfigPath = path.join(projectConfig.path, 'tsconfig.json');
  
  if (!fileExists(tsconfigPath)) {
    results[component].typecheck.status = 'skipped';
    results[component].typecheck.issues.push('No tsconfig.json found');
    results.summary.skippedChecks++;
    return;
  }
  
  const packageJsonPath = path.join(projectConfig.path, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const typecheckScript = packageJson.scripts?.[projectConfig.scripts.typecheck];
  
  let typecheckCommand;
  if (typecheckScript) {
    typecheckCommand = `${projectConfig.packageManager} run ${projectConfig.scripts.typecheck}`;
  } else {
    // Fallback to direct tsc command
    typecheckCommand = 'npx tsc --noEmit';
  }
  
  const typecheckResult = runCommand(typecheckCommand, projectConfig.path);
  
  results[component].typecheck.duration = typecheckResult.duration;
  results[component].typecheck.status = typecheckResult.success ? 'passed' : 'failed';
  
  if (!typecheckResult.success) {
    results[component].typecheck.issues.push(typecheckResult.error);
    results.summary.failedChecks++;
  } else {
    results.summary.passedChecks++;
  }
  
  results.summary.totalChecks++;
};

const runTestCheck = (projectConfig, component) => {
  log(`🧪 Running tests for ${component}...`, 'info');
  
  const packageJsonPath = path.join(projectConfig.path, 'package.json');
  
  if (!fileExists(packageJsonPath)) {
    results[component].test.status = 'skipped';
    results.summary.skippedChecks++;
    return;
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const testScript = packageJson.scripts?.[projectConfig.scripts.test];
  
  if (!testScript) {
    results[component].test.status = 'skipped';
    results.summary.skippedChecks++;
    return;
  }
  
  const testCommand = `${projectConfig.packageManager} run ${projectConfig.scripts.test} -- --passWithNoTests`;
  const testResult = runCommand(testCommand, projectConfig.path);
  
  results[component].test.duration = testResult.duration;
  results[component].test.status = testResult.success ? 'passed' : 'failed';
  
  // Try to extract coverage information
  const coverageDir = path.join(projectConfig.path, 'coverage');
  if (fileExists(coverageDir)) {
    const coverageFiles = fs.readdirSync(coverageDir);
    if (coverageFiles.length > 0) {
      results[component].test.coverage = 'available';
    }
  }
  
  if (!testResult.success) {
    results.summary.failedChecks++;
  } else {
    results.summary.passedChecks++;
  }
  
  results.summary.totalChecks++;
};

const runBuildCheck = (projectConfig, component) => {
  log(`🏗️  Running build check for ${component}...`, 'info');
  
  const packageJsonPath = path.join(projectConfig.path, 'package.json');
  
  if (!fileExists(packageJsonPath)) {
    results[component].build.status = 'skipped';
    results.summary.skippedChecks++;
    return;
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const buildScript = packageJson.scripts?.[projectConfig.scripts.build];
  
  if (!buildScript) {
    results[component].build.status = 'skipped';
    results.summary.skippedChecks++;
    return;
  }
  
  const buildCommand = `${projectConfig.packageManager} run ${projectConfig.scripts.build}`;
  const buildResult = runCommand(buildCommand, projectConfig.path);
  
  results[component].build.duration = buildResult.duration;
  results[component].build.status = buildResult.success ? 'passed' : 'failed';
  
  // Try to get build size
  const buildDirs = ['.next', 'dist', 'build'];
  for (const dir of buildDirs) {
    const buildPath = path.join(projectConfig.path, dir);
    if (fileExists(buildPath)) {
      try {
        const stats = fs.statSync(buildPath);
        results[component].build.size = `${(stats.size / 1024 / 1024).toFixed(2)} MB`;
        break;
      } catch (error) {
        // Ignore errors getting build size
      }
    }
  }
  
  if (!buildResult.success) {
    results.summary.failedChecks++;
  } else {
    results.summary.passedChecks++;
  }
  
  results.summary.totalChecks++;
};

const generateSummaryReport = () => {
  const logDir = '.pushlog';
  const summaryPath = path.join(logDir, 'summary.md');
  const resultsPath = path.join(logDir, 'results.json');
  
  // Ensure log directory exists
  if (!fileExists(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  // Generate Markdown summary
  const summaryContent = `# 🛠️ NeonHub Monorepo Project Check Summary

**Generated:** ${results.timestamp}
**Total Checks:** ${results.summary.totalChecks}
**Passed:** ${results.summary.passedChecks} ✅
**Failed:** ${results.summary.failedChecks} ❌
**Skipped:** ${results.summary.skippedChecks} ⏭️

## 📊 Overall Status

${results.summary.failedChecks === 0 ? '✅ **ALL CHECKS PASSED**' : `❌ **${results.summary.failedChecks} CHECKS FAILED**`}

## 🏗️ Backend (Neon-v2.3.3) Results

| Check | Status | Duration | Issues |
|-------|--------|----------|---------|
| Lint | ${results.backend.lint.status === 'passed' ? '✅ Passed' : results.backend.lint.status === 'failed' ? '❌ Failed' : '⏭️ Skipped'} | ${results.backend.lint.duration}ms | ${results.backend.lint.issues.length} |
| Type Check | ${results.backend.typecheck.status === 'passed' ? '✅ Passed' : results.backend.typecheck.status === 'failed' ? '❌ Failed' : '⏭️ Skipped'} | ${results.backend.typecheck.duration}ms | ${results.backend.typecheck.issues.length} |
| Tests | ${results.backend.test.status === 'passed' ? '✅ Passed' : results.backend.test.status === 'failed' ? '❌ Failed' : '⏭️ Skipped'} | ${results.backend.test.duration}ms | ${results.backend.test.coverage || 'N/A'} |
| Build | ${results.backend.build.status === 'passed' ? '✅ Passed' : results.backend.build.status === 'failed' ? '❌ Failed' : '⏭️ Skipped'} | ${results.backend.build.duration}ms | ${results.backend.build.size || 'N/A'} |

## 🎨 Frontend (neonui0.3) Results

| Check | Status | Duration | Issues |
|-------|--------|----------|---------|
| Lint | ${results.frontend.lint.status === 'passed' ? '✅ Passed' : results.frontend.lint.status === 'failed' ? '❌ Failed' : '⏭️ Skipped'} | ${results.frontend.lint.duration}ms | ${results.frontend.lint.issues.length} |
| Type Check | ${results.frontend.typecheck.status === 'passed' ? '✅ Passed' : results.frontend.typecheck.status === 'failed' ? '❌ Failed' : '⏭️ Skipped'} | ${results.frontend.typecheck.duration}ms | ${results.frontend.typecheck.issues.length} |
| Tests | ${results.frontend.test.status === 'passed' ? '✅ Passed' : results.frontend.test.status === 'failed' ? '❌ Failed' : '⏭️ Skipped'} | ${results.frontend.test.duration}ms | ${results.frontend.test.coverage || 'N/A'} |
| Build | ${results.frontend.build.status === 'passed' ? '✅ Passed' : results.frontend.build.status === 'failed' ? '❌ Failed' : '⏭️ Skipped'} | ${results.frontend.build.duration}ms | ${results.frontend.build.size || 'N/A'} |

## 🔍 Detailed Issues

### Backend Issues
${results.backend.lint.issues.length > 0 ? `**Lint Issues:**\n${results.backend.lint.issues.map(issue => `- ${issue}`).join('\n')}\n` : ''}
${results.backend.typecheck.issues.length > 0 ? `**Type Check Issues:**\n${results.backend.typecheck.issues.map(issue => `- ${issue}`).join('\n')}\n` : ''}

### Frontend Issues
${results.frontend.lint.issues.length > 0 ? `**Lint Issues:**\n${results.frontend.lint.issues.map(issue => `- ${issue}`).join('\n')}\n` : ''}
${results.frontend.typecheck.issues.length > 0 ? `**Type Check Issues:**\n${results.frontend.typecheck.issues.map(issue => `- ${issue}`).join('\n')}\n` : ''}

## 🚀 Recommendations

${results.summary.failedChecks === 0 ? 
  '✅ All checks passed! The monorepo is ready for deployment.' : 
  `❌ ${results.summary.failedChecks} checks failed. Please fix the issues above before deploying.`
}

${shouldFix ? '🔧 Auto-fix was enabled for this run.' : '💡 Run with --fix to automatically fix linting issues.'}

---

*Generated by NeonHub Monorepo Project Check v1.0.0*
`;

  // Write summary report
  fs.writeFileSync(summaryPath, summaryContent);
  
  // Write JSON results
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  
  log(`📄 Summary report generated: ${summaryPath}`, 'success');
  log(`📊 JSON results saved: ${resultsPath}`, 'success');
};

// Main execution
const main = async () => {
  log('🚀 Starting NeonHub Monorepo Project Check', 'info');
  log(`Options: ${shouldFix ? 'fix enabled' : 'fix disabled'}, ${isVerbose ? 'verbose' : 'quiet'}`, 'info');
  
  const startTime = Date.now();
  
  try {
    // Check if projects exist
    const backendExists = fileExists(CONFIG.backend.path);
    const frontendExists = fileExists(CONFIG.frontend.path);
    
    if (!backendExists && !frontendExists) {
      log('❌ Neither backend nor frontend directories found!', 'error');
      log(`Expected: ${CONFIG.backend.path} and/or ${CONFIG.frontend.path}`, 'error');
      process.exit(1);
    }
    
    // Process Backend
    if (backendExists) {
      log(`🏗️  Processing ${CONFIG.backend.name}...`, 'info');
      
      if (checkDependencies(CONFIG.backend)) {
        runLintCheck(CONFIG.backend, 'backend');
        runTypeCheck(CONFIG.backend, 'backend');
        runTestCheck(CONFIG.backend, 'backend');
        runBuildCheck(CONFIG.backend, 'backend');
      } else {
        log('⚠️  Skipping backend checks due to missing dependencies', 'warning');
        results.summary.skippedChecks += 4;
      }
    } else {
      log('⚠️  Backend directory not found, skipping backend checks', 'warning');
      results.summary.skippedChecks += 4;
    }
    
    // Process Frontend
    if (frontendExists) {
      log(`🎨 Processing ${CONFIG.frontend.name}...`, 'info');
      
      if (checkDependencies(CONFIG.frontend)) {
        runLintCheck(CONFIG.frontend, 'frontend');
        runTypeCheck(CONFIG.frontend, 'frontend');
        runTestCheck(CONFIG.frontend, 'frontend');
        runBuildCheck(CONFIG.frontend, 'frontend');
      } else {
        log('⚠️  Skipping frontend checks due to missing dependencies', 'warning');
        results.summary.skippedChecks += 4;
      }
    } else {
      log('⚠️  Frontend directory not found, skipping frontend checks', 'warning');
      results.summary.skippedChecks += 4;
    }
    
    // Generate reports
    generateSummaryReport();
    
    const totalTime = Date.now() - startTime;
    log(`✅ Project check completed in ${totalTime}ms`, 'success');
    
    // Print final summary
    console.log('\n🎯 FINAL SUMMARY');
    console.log('================');
    console.log(`Total Checks: ${results.summary.totalChecks}`);
    console.log(`Passed: ${results.summary.passedChecks} ✅`);
    console.log(`Failed: ${results.summary.failedChecks} ❌`);
    console.log(`Skipped: ${results.summary.skippedChecks} ⏭️`);
    
    if (results.summary.failedChecks > 0) {
      console.log('\n❌ Some checks failed. See .pushlog/summary.md for details.');
      process.exit(1);
    } else {
      console.log('\n✅ All checks passed! Ready for deployment.');
      process.exit(0);
    }
    
  } catch (error) {
    log(`💥 Fatal error: ${error.message}`, 'error');
    console.error(error);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main, CONFIG, results };