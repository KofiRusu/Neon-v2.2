#!/usr/bin/env node

/**
 * NeonHub Background Code Quality Agent
 * Continuously monitors and fixes TypeScript, ESLint, and syntax issues
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const chokidar = require('chokidar');

class CodeQualityAgent {
  constructor() {
    this.isRunning = false;
    this.fixedFiles = new Set();
    this.errorLog = [];
    this.logFile = path.join(process.cwd(), 'quality-agent.log');
    this.reportFile = path.join(process.cwd(), 'quality-report.json');

    // Quality thresholds
    this.thresholds = {
      maxTypeScriptErrors: 0,
      maxESLintWarnings: 0,
      maxSyntaxErrors: 0,
    };

    this.workspaces = [
      'apps/api',
      'apps/dashboard',
      'packages/core-agents',
      'packages/data-model',
      'packages/reasoning-engine',
      'packages/types',
      'packages/utils',
    ];
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

    console.log(logEntry);

    // Append to log file
    fs.appendFileSync(this.logFile, `${logEntry}\n`);
  }

  async runCommand(command, cwd = process.cwd()) {
    try {
      const result = execSync(command, {
        cwd,
        encoding: 'utf8',
        stdio: 'pipe',
      });
      return { success: true, output: result };
    } catch (error) {
      return {
        success: false,
        output: error.stdout || '',
        error: error.stderr || error.message,
      };
    }
  }

  async checkTypeScript() {
    this.log('🔍 Running TypeScript type checking...');

    const result = await this.runCommand('npm run type-check');

    if (!result.success) {
      const errors = this.parseTypeScriptErrors(result.error);
      this.log(`❌ Found ${errors.length} TypeScript errors`);
      return { success: false, errors };
    }

    this.log('✅ TypeScript check passed');
    return { success: true, errors: [] };
  }

  async checkESLint() {
    this.log('🔍 Running ESLint checks...');

    const result = await this.runCommand('npm run lint');

    if (!result.success) {
      const warnings = this.parseESLintOutput(result.error);
      this.log(`⚠️ Found ${warnings.length} ESLint issues`);
      return { success: false, warnings };
    }

    this.log('✅ ESLint check passed');
    return { success: true, warnings: [] };
  }

  async runTests() {
    this.log('🧪 Running test suite...');

    const result = await this.runCommand('npm test');

    if (!result.success) {
      const failures = this.parseTestFailures(result.error);
      this.log(`❌ Found ${failures.length} test failures`);
      return { success: false, failures };
    }

    this.log('✅ All tests passed');
    return { success: true, failures: [] };
  }

  parseTypeScriptErrors(output) {
    const errorPattern = /(.+\.tsx?)\((\d+),(\d+)\): error TS(\d+): (.+)/g;
    const errors = [];
    let match;

    while ((match = errorPattern.exec(output)) !== null) {
      errors.push({
        file: match[1],
        line: parseInt(match[2]),
        column: parseInt(match[3]),
        code: match[4],
        message: match[5],
        type: 'typescript',
      });
    }

    return errors;
  }

  parseESLintOutput(output) {
    const warnings = [];
    const lines = output.split('\n');

    for (const line of lines) {
      if (line.includes('warning') || line.includes('error')) {
        const match = line.match(/(.+):(\d+):(\d+):\s+(warning|error)\s+(.+)\s+(@?\w+\/?\w*)/);
        if (match) {
          warnings.push({
            file: match[1],
            line: parseInt(match[2]),
            column: parseInt(match[3]),
            severity: match[4],
            message: match[5],
            rule: match[6],
            type: 'eslint',
          });
        }
      }
    }

    return warnings;
  }

  parseTestFailures(output) {
    const failures = [];
    // Parse Jest/test framework failures
    const testPattern = /FAIL\s+(.+)/g;
    let match;

    while ((match = testPattern.exec(output)) !== null) {
      failures.push({
        file: match[1],
        type: 'test',
      });
    }

    return failures;
  }

  async fixCommonTypeScriptIssues(errors) {
    this.log('🔧 Attempting to fix TypeScript issues...');

    const fixedCount = 0;

    for (const error of errors) {
      try {
        await this.fixTypeScriptError(error);
      } catch (fixError) {
        this.log(`❌ Failed to fix error in ${error.file}: ${fixError.message}`, 'error');
      }
    }

    return fixedCount;
  }

  async fixTypeScriptError(error) {
    const filePath = path.resolve(error.file);

    if (!fs.existsSync(filePath)) {
      return false;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    let modifiedContent = content;
    let wasFixed = false;

    // Fix unused variables by prefixing with underscore
    if (error.code === '6133') {
      modifiedContent = this.fixUnusedVariables(modifiedContent, error);
      wasFixed = true;
    }

    // Fix missing semicolons
    if (error.message.includes('Missing semicolon')) {
      modifiedContent = this.fixMissingSemicolons(modifiedContent, error);
      wasFixed = true;
    }

    // Fix explicit any types with proper types
    if (error.message.includes('Unexpected any')) {
      modifiedContent = this.fixExplicitAny(modifiedContent, error);
      wasFixed = true;
    }

    if (wasFixed) {
      fs.writeFileSync(filePath, modifiedContent);
      this.fixedFiles.add(filePath);
      this.log(`✅ Fixed TypeScript issue in ${error.file}`);
      return true;
    }

    return false;
  }

  fixUnusedVariables(content, error) {
    const lines = content.split('\n');
    const targetLine = lines[error.line - 1];

    if (!targetLine) return content;

    // Extract variable name from error message
    const varMatch = error.message.match(/'([^']+)'/);
    if (!varMatch) return content;

    const varName = varMatch[1];

    // Skip if already prefixed with underscore
    if (varName.startsWith('_')) return content;

    // Replace variable declaration
    const updatedLine = targetLine.replace(new RegExp(`\\b${varName}\\b`, 'g'), `_${varName}`);

    lines[error.line - 1] = updatedLine;
    return lines.join('\n');
  }

  fixMissingSemicolons(content, error) {
    const lines = content.split('\n');
    const targetLine = lines[error.line - 1];

    if (!targetLine || targetLine.trim().endsWith(';')) {
      return content;
    }

    lines[error.line - 1] = `${targetLine.trimEnd()};`;
    return lines.join('\n');
  }

  fixExplicitAny(content, error) {
    const lines = content.split('\n');
    const targetLine = lines[error.line - 1];

    if (!targetLine) return content;

    // Replace simple any types with unknown for safer types
    const updatedLine = targetLine.replace(/:\s*any\b/g, ': unknown');

    lines[error.line - 1] = updatedLine;
    return lines.join('\n');
  }

  async fixESLintIssues(warnings) {
    this.log('🔧 Running ESLint auto-fix...');

    const result = await this.runCommand('npm run lint:fix');

    if (result.success) {
      this.log('✅ ESLint auto-fix completed');
      return true;
    } else {
      this.log('⚠️ ESLint auto-fix had issues', 'warn');
      return false;
    }
  }

  async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      typeScriptCheck: await this.checkTypeScript(),
      eslintCheck: await this.checkESLint(),
      testResults: await this.runTests(),
      fixedFiles: Array.from(this.fixedFiles),
      summary: {
        totalIssues: 0,
        fixedIssues: this.fixedFiles.size,
        remainingIssues: 0,
      },
    };

    report.summary.totalIssues =
      (report.typeScriptCheck.errors?.length || 0) +
      (report.eslintCheck.warnings?.length || 0) +
      (report.testResults.failures?.length || 0);

    report.summary.remainingIssues = report.summary.totalIssues - report.summary.fixedIssues;

    fs.writeFileSync(this.reportFile, JSON.stringify(report, null, 2));

    return report;
  }

  async runFullCheck() {
    this.log('🚀 Starting comprehensive code quality check...');

    const report = await this.generateReport();

    // Attempt to fix issues if any are found
    if (report.typeScriptCheck.errors?.length > 0) {
      await this.fixCommonTypeScriptIssues(report.typeScriptCheck.errors);
    }

    if (report.eslintCheck.warnings?.length > 0) {
      await this.fixESLintIssues(report.eslintCheck.warnings);
    }

    // Generate final report after fixes
    const finalReport = await this.generateReport();

    this.log('📊 Quality check complete. Report saved to quality-report.json');

    // Determine if we should commit changes
    if (this.fixedFiles.size > 0 && finalReport.summary.remainingIssues === 0) {
      await this.autoCommit();
    }

    return finalReport;
  }

  async autoCommit() {
    if (this.fixedFiles.size === 0) {
      this.log('ℹ️ No files to commit');
      return false;
    }

    try {
      // Stage all fixed files
      for (const file of this.fixedFiles) {
        await this.runCommand(`git add "${file}"`);
      }

      // Generate commit message
      const commitMessage = `fix: auto-fix code quality issues

- Fixed ${this.fixedFiles.size} files
- Resolved TypeScript, ESLint, and syntax errors
- Maintained zero-error policy

Auto-generated by NeonHub Code Quality Agent`;

      // Commit changes
      const commitResult = await this.runCommand(`git commit -m "${commitMessage}"`);

      if (commitResult.success) {
        this.log(`✅ Auto-committed fixes for ${this.fixedFiles.size} files`);
        this.fixedFiles.clear();
        return true;
      } else {
        this.log('❌ Failed to commit changes', 'error');
        return false;
      }
    } catch (error) {
      this.log(`❌ Auto-commit failed: ${error.message}`, 'error');
      return false;
    }
  }

  startFileWatcher() {
    this.log('👀 Starting file watcher for continuous monitoring...');

    const watcher = chokidar.watch(
      [
        'apps/**/*.{ts,tsx,js,jsx}',
        'packages/**/*.{ts,tsx,js,jsx}',
        '!**/node_modules/**',
        '!**/dist/**',
        '!**/.next/**',
      ],
      {
        persistent: true,
        ignoreInitial: true,
      }
    );

    watcher.on('change', async filePath => {
      this.log(`📝 File changed: ${filePath}`);

      // Debounce rapid changes
      clearTimeout(this.checkTimeout);
      this.checkTimeout = setTimeout(async () => {
        await this.runFullCheck();
      }, 2000);
    });

    return watcher;
  }

  async start() {
    if (this.isRunning) {
      this.log('⚠️ Code Quality Agent is already running');
      return;
    }

    this.isRunning = true;
    this.log('🚀 Starting NeonHub Code Quality Agent...');

    // Initial comprehensive check
    await this.runFullCheck();

    // Start continuous monitoring
    const watcher = this.startFileWatcher();

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      this.log('🛑 Shutting down Code Quality Agent...');
      watcher.close();
      this.isRunning = false;
      process.exit(0);
    });

    this.log('✅ Code Quality Agent is now running continuously');
    this.log('   - Monitoring file changes');
    this.log('   - Auto-fixing TypeScript and ESLint issues');
    this.log('   - Auto-committing fixes when quality is perfect');
    this.log('   - Press Ctrl+C to stop');
  }
}

// Export for use as module or run directly
if (require.main === module) {
  const agent = new CodeQualityAgent();
  agent.start().catch(error => {
    console.error('❌ Code Quality Agent failed:', error);
    process.exit(1);
  });
}

module.exports = CodeQualityAgent;
