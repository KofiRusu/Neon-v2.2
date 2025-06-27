#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
  logDir: 'logs',
  reportFile: 'logs/QA_ALERT_SUMMARY.md',
  maxErrors: 500,
  criticalThreshold: 50,
  checkInterval: 5 * 60 * 1000, // 5 minutes
  workspaces: [
    'apps/dashboard',
    'apps/api',
    'packages/core-agents',
    'packages/data-model',
    'packages/utils',
    'packages/types',
  ],
};

class QAWatcher {
  constructor() {
    this.alerts = [];
    this.metrics = {
      lintErrors: 0,
      typeErrors: 0,
      testFailures: 0,
      buildErrors: 0,
      contractMismatches: 0,
      brokenExports: 0,
      totalAlerts: 0,
      criticalAlerts: 0,
    };
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    if (!fs.existsSync(CONFIG.logDir)) {
      fs.mkdirSync(CONFIG.logDir, { recursive: true });
    }
  }

  generateAlertId() {
    return `qa-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  }

  addAlert(alert) {
    const newAlert = {
      ...alert,
      id: this.generateAlertId(),
      timestamp: new Date(),
    };

    this.alerts.push(newAlert);
    this.metrics.totalAlerts++;

    if (alert.severity === 'critical') {
      this.metrics.criticalAlerts++;
    }
  }

  async runCommand(command, workspace) {
    try {
      const cwd = workspace ? path.join(process.cwd(), workspace) : process.cwd();
      const stdout = execSync(command, {
        cwd,
        encoding: 'utf8',
        stdio: 'pipe',
      });
      return { stdout, stderr: '', success: true };
    } catch (error) {
      return {
        stdout: error.stdout || '',
        stderr: error.stderr || error.message || '',
        success: false,
      };
    }
  }

  async checkLintErrors() {
    console.log('🔍 Checking lint errors...');

    for (const workspace of CONFIG.workspaces) {
      if (!fs.existsSync(workspace)) continue;

      const result = await this.runCommand(
        `npx eslint "src/**/*.{ts,tsx,js,jsx}" --format json`,
        workspace
      );

      if (!result.success && result.stdout) {
        try {
          const lintResults = JSON.parse(result.stdout);
          const errorCount = lintResults.reduce((sum, file) => sum + file.errorCount, 0);

          this.metrics.lintErrors += errorCount;

          if (errorCount > 0) {
            lintResults.forEach(file => {
              file.messages.forEach(message => {
                if (message.severity === 2) {
                  // Error
                  this.addAlert({
                    severity:
                      message.ruleId === '@typescript-eslint/no-explicit-any' ? 'high' : 'medium',
                    type: 'lint',
                    workspace,
                    message: `${message.ruleId}: ${message.message}`,
                    file: file.filePath,
                    line: message.line,
                  });
                }
              });
            });
          }
        } catch (parseError) {
          console.warn(`Failed to parse lint results for ${workspace}:`, parseError);
        }
      }
    }
  }

  async checkTypeErrors() {
    console.log('🔧 Checking TypeScript errors...');

    for (const workspace of CONFIG.workspaces) {
      if (!fs.existsSync(workspace)) continue;

      const result = await this.runCommand('npx tsc --noEmit --pretty false', workspace);

      if (!result.success && result.stderr) {
        const lines = result.stderr.split('\n').filter(line => line.includes('error TS'));
        this.metrics.typeErrors += lines.length;

        lines.forEach(line => {
          const match = line.match(/^(.+?)\((\d+),\d+\): error TS\d+: (.+)$/);
          if (match) {
            this.addAlert({
              severity: 'medium',
              type: 'type',
              workspace,
              message: match[3],
              file: match[1],
              line: parseInt(match[2]),
            });
          }
        });
      }
    }
  }

  async checkTestFailures() {
    console.log('🧪 Checking test failures...');

    const result = await this.runCommand('npm test -- --json --testLocationInResults --verbose');

    if (!result.success && result.stdout) {
      try {
        const testResults = JSON.parse(result.stdout);
        const failedTests = (testResults.testResults || []).filter(
          test => test.status === 'failed'
        );

        this.metrics.testFailures = failedTests.length;

        failedTests.forEach(test => {
          (test.assertionResults || []).forEach(assertion => {
            if (assertion.status === 'failed') {
              this.addAlert({
                severity: 'high',
                type: 'test',
                workspace: test.name.includes('/') ? test.name.split('/')[0] : 'root',
                message: `Test failed: ${assertion.title}`,
                file: test.name,
              });
            }
          });
        });
      } catch (parseError) {
        console.warn('Failed to parse test results:', parseError);
      }
    }
  }

  async checkAPIContracts() {
    console.log('📋 Checking API contract consistency...');

    const apiSpecPath = 'docs/api-spec.json';
    const routersPath = 'apps/api/src/routers';

    if (!fs.existsSync(apiSpecPath) || !fs.existsSync(routersPath)) {
      return;
    }

    try {
      const apiSpec = JSON.parse(fs.readFileSync(apiSpecPath, 'utf8'));
      const routerFiles = fs.readdirSync(routersPath).filter(f => f.endsWith('.ts'));

      // Check for missing router implementations
      const specEndpoints = new Set(Object.keys(apiSpec.paths || {}));
      const implementedEndpoints = new Set();

      routerFiles.forEach(file => {
        const filePath = path.join(routersPath, file);
        const content = fs.readFileSync(filePath, 'utf8');

        // Extract endpoint patterns (simplified)
        const endpointMatches = content.match(/\.procedure\s*\(\s*['"`]([^'"`]+)['"`]/g) || [];
        endpointMatches.forEach(match => {
          const endpoint = match.match(/['"`]([^'"`]+)['"`]/)?.[1];
          if (endpoint) {
            implementedEndpoints.add(`/${endpoint}`);
          }
        });
      });

      // Find mismatches
      specEndpoints.forEach(endpoint => {
        if (!implementedEndpoints.has(endpoint)) {
          this.metrics.contractMismatches++;
          this.addAlert({
            severity: 'high',
            type: 'contract',
            workspace: 'apps/api',
            message: `Missing implementation for API endpoint: ${endpoint}`,
            file: apiSpecPath,
          });
        }
      });
    } catch (error) {
      console.warn('Failed to check API contracts:', error);
    }
  }

  async checkBrokenExports() {
    console.log('📦 Checking for broken exports...');

    for (const workspace of CONFIG.workspaces) {
      if (!fs.existsSync(workspace)) continue;

      const indexPath = path.join(workspace, 'src/index.ts');
      if (!fs.existsSync(indexPath)) continue;

      try {
        const result = await this.runCommand(
          `npx tsc --noEmit --isolatedModules ${indexPath}`,
          workspace
        );

        if (!result.success && result.stderr) {
          const exportErrors = result.stderr
            .split('\n')
            .filter(line => line.includes('Cannot resolve') || line.includes('Module not found'));

          this.metrics.brokenExports += exportErrors.length;

          exportErrors.forEach(error => {
            this.addAlert({
              severity: 'critical',
              type: 'export',
              workspace,
              message: `Broken export: ${error.trim()}`,
              file: indexPath,
            });
          });
        }
      } catch (error) {
        console.warn(`Failed to check exports for ${workspace}:`, error);
      }
    }
  }

  async checkBuildHealth() {
    console.log('🏗️ Checking build health...');

    const result = await this.runCommand('npm run build');

    if (!result.success) {
      this.metrics.buildErrors++;
      this.addAlert({
        severity: 'critical',
        type: 'build',
        workspace: 'root',
        message: 'Build process failed',
        file: 'package.json',
      });
    }
  }

  generateAlertSummary() {
    const timestamp = new Date().toISOString();
    const criticalCount = this.alerts.filter(a => a.severity === 'critical').length;
    const highCount = this.alerts.filter(a => a.severity === 'high').length;

    let summary = `# QA Alert Summary\n\n`;
    summary += `**Generated:** ${timestamp}\n`;
    summary += `**Total Alerts:** ${this.alerts.length}\n`;
    summary += `**Critical:** ${criticalCount}\n`;
    summary += `**High Priority:** ${highCount}\n\n`;

    summary += `## 📊 Metrics Overview\n\n`;
    summary += `| Category | Count | Status |\n`;
    summary += `|----------|-------|--------|\n`;
    summary += `| Lint Errors | ${this.metrics.lintErrors} | ${this.metrics.lintErrors > 50 ? '🔴' : this.metrics.lintErrors > 20 ? '🟡' : '🟢'} |\n`;
    summary += `| Type Errors | ${this.metrics.typeErrors} | ${this.metrics.typeErrors > 100 ? '🔴' : this.metrics.typeErrors > 50 ? '🟡' : '🟢'} |\n`;
    summary += `| Test Failures | ${this.metrics.testFailures} | ${this.metrics.testFailures > 10 ? '🔴' : this.metrics.testFailures > 5 ? '🟡' : '🟢'} |\n`;
    summary += `| Build Errors | ${this.metrics.buildErrors} | ${this.metrics.buildErrors > 0 ? '🔴' : '🟢'} |\n`;
    summary += `| Contract Mismatches | ${this.metrics.contractMismatches} | ${this.metrics.contractMismatches > 0 ? '🟡' : '🟢'} |\n`;
    summary += `| Broken Exports | ${this.metrics.brokenExports} | ${this.metrics.brokenExports > 0 ? '🔴' : '🟢'} |\n\n`;

    if (criticalCount > 0) {
      summary += `## 🚨 Critical Alerts\n\n`;
      this.alerts
        .filter(a => a.severity === 'critical')
        .slice(0, 10)
        .forEach(alert => {
          summary += `- **${alert.workspace}**: ${alert.message}\n`;
          if (alert.file)
            summary += `  - File: \`${alert.file}\`${alert.line ? `:${alert.line}` : ''}\n`;
        });
      summary += '\n';
    }

    if (this.alerts.length > 0) {
      summary += `## 📋 Workspace Breakdown\n\n`;
      const workspaceGroups = this.alerts.reduce((acc, alert) => {
        if (!acc[alert.workspace]) acc[alert.workspace] = [];
        acc[alert.workspace].push(alert);
        return acc;
      }, {});

      Object.entries(workspaceGroups).forEach(([workspace, alerts]) => {
        summary += `### ${workspace} (${alerts.length} alerts)\n\n`;
        alerts.slice(0, 5).forEach(alert => {
          summary += `- [${alert.severity.toUpperCase()}] ${alert.message}\n`;
        });
        if (alerts.length > 5) {
          summary += `- ... and ${alerts.length - 5} more\n`;
        }
        summary += '\n';
      });
    }

    summary += `## 🎯 Recommended Actions\n\n`;

    if (criticalCount > 0) {
      summary += `1. **URGENT**: Fix ${criticalCount} critical issues immediately\n`;
    }
    if (this.metrics.buildErrors > 0) {
      summary += `2. **HIGH**: Resolve build failures before deployment\n`;
    }
    if (this.metrics.typeErrors > 100) {
      summary += `3. **MEDIUM**: Address TypeScript errors (${this.metrics.typeErrors} total)\n`;
    }
    if (this.metrics.testFailures > 5) {
      summary += `4. **MEDIUM**: Fix failing tests (${this.metrics.testFailures} total)\n`;
    }
    if (this.metrics.lintErrors > 50) {
      summary += `5. **LOW**: Clean up ESLint warnings (${this.metrics.lintErrors} total)\n`;
    }

    summary += `\n---\n*Generated by QA Watch System*\n`;

    return summary;
  }

  async runFullScan() {
    console.log('🚀 Starting QA full scan...');
    const startTime = Date.now();

    this.alerts = [];
    this.metrics = {
      lintErrors: 0,
      typeErrors: 0,
      testFailures: 0,
      buildErrors: 0,
      contractMismatches: 0,
      brokenExports: 0,
      totalAlerts: 0,
      criticalAlerts: 0,
    };

    try {
      await Promise.all([
        this.checkLintErrors(),
        this.checkTypeErrors(),
        this.checkTestFailures(),
        this.checkAPIContracts(),
        this.checkBrokenExports(),
        this.checkBuildHealth(),
      ]);

      const summary = this.generateAlertSummary();
      fs.writeFileSync(CONFIG.reportFile, summary, 'utf8');

      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`✅ QA scan completed in ${duration}s`);
      console.log(
        `📊 Found ${this.alerts.length} total alerts (${this.metrics.criticalAlerts} critical)`
      );
      console.log(`📄 Report saved to: ${CONFIG.reportFile}`);

      // Exit with error code if critical issues found
      if (this.metrics.criticalAlerts > CONFIG.criticalThreshold) {
        console.error(
          `🚨 Critical alert threshold exceeded (${this.metrics.criticalAlerts} > ${CONFIG.criticalThreshold})`
        );
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ QA scan failed:', error);
      process.exit(1);
    }
  }

  startWatcher() {
    console.log('👁️  Starting QA watcher...');
    console.log(`📝 Logs will be saved to: ${CONFIG.reportFile}`);
    console.log(`⏱️  Check interval: ${CONFIG.checkInterval / 1000}s`);

    // Run initial scan
    this.runFullScan();

    // Set up periodic scanning
    setInterval(() => {
      console.log('🔄 Running periodic QA scan...');
      this.runFullScan();
    }, CONFIG.checkInterval);
  }
}

// CLI handling
const args = process.argv.slice(2);
const watcher = new QAWatcher();

if (args.includes('--watch')) {
  watcher.startWatcher();
} else {
  watcher.runFullScan();
}
