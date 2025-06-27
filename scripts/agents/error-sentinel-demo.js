/**
 * ErrorSentinel Agent Demo Script
 *
 * Demonstrates the capabilities of the ErrorSentinel agent for
 * continuous monitoring and automatic error fixing across NeonHub repositories.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ErrorSentinelDemo {
  constructor() {
    this.startTime = Date.now();
    this.results = {
      monitoringActive: false,
      errorsDetected: [],
      errorsFixed: [],
      systemHealth: 'unknown',
      recommendations: [],
      performance: {
        scanDuration: 0,
        totalScans: 0,
        fixAttempts: 0,
        successfulFixes: 0,
      },
    };

    this.repositories = [
      'apps/dashboard',
      'apps/api',
      'packages/core-agents',
      'packages/data-model',
      'packages/utils',
      'packages/types',
    ];
  }

  log(message) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
  }

  async run() {
    console.log('🛰️ ErrorSentinel Agent Demo');
    console.log('='.repeat(50));
    console.log('');

    try {
      this.log('🚀 Starting ErrorSentinel demonstration...');

      await this.demonstrateHealthCheck();
      await this.demonstrateErrorDetection();
      await this.demonstrateAutoFix();
      await this.demonstrateContinuousMonitoring();
      await this.generateDemoReport();

      this.log('✅ ErrorSentinel demonstration completed successfully!');
      console.log('\n📋 Demo report generated in: reports/error-sentinel-demo.json');
    } catch (error) {
      this.log(`❌ Demo failed: ${error.message}`);
      this.results.systemHealth = 'critical';
      await this.generateDemoReport();
      process.exit(1);
    }
  }

  async demonstrateHealthCheck() {
    this.log('🔍 Demonstrating System Health Check...');

    const healthCheck = {
      timestamp: new Date(),
      repositories: [],
      overallHealth: 'healthy',
      criticalIssues: 0,
      warnings: 0,
    };

    for (const repo of this.repositories) {
      const repoPath = path.join(process.cwd(), repo);

      if (!fs.existsSync(repoPath)) {
        healthCheck.repositories.push({
          name: repo,
          status: 'missing',
          severity: 'high',
          message: `Repository path not found: ${repo}`,
        });
        healthCheck.warnings++;
        continue;
      }

      const repoHealth = await this.checkRepositoryHealth(repoPath, repo);
      healthCheck.repositories.push(repoHealth);

      if (repoHealth.severity === 'critical') {
        healthCheck.criticalIssues++;
        healthCheck.overallHealth = 'critical';
      } else if (repoHealth.severity === 'high' && healthCheck.overallHealth === 'healthy') {
        healthCheck.overallHealth = 'degraded';
      }
    }

    this.results.systemHealth = healthCheck.overallHealth;
    this.log(`📊 Health Check Results: ${healthCheck.overallHealth.toUpperCase()}`);
    this.log(`   • Critical Issues: ${healthCheck.criticalIssues}`);
    this.log(`   • Warnings: ${healthCheck.warnings}`);
    this.log(`   • Repositories Scanned: ${healthCheck.repositories.length}`);

    return healthCheck;
  }

  async checkRepositoryHealth(repoPath, repoName) {
    const health = {
      name: repoName,
      status: 'healthy',
      severity: 'low',
      issues: [],
      checks: {
        packageJson: false,
        nodeModules: false,
        linting: false,
        typeScript: false,
        build: false,
      },
    };

    try {
      // Check package.json
      const packageJsonPath = path.join(repoPath, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        health.checks.packageJson = true;
      } else {
        health.issues.push('Missing package.json');
        health.severity = 'high';
      }

      // Check node_modules
      const nodeModulesPath = path.join(repoPath, 'node_modules');
      if (fs.existsSync(nodeModulesPath)) {
        health.checks.nodeModules = true;
      } else {
        health.issues.push('Missing node_modules - run npm install');
        health.severity = 'medium';
      }

      // Quick lint check (if package.json has lint script)
      if (health.checks.packageJson) {
        try {
          const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
          if (packageJson.scripts && packageJson.scripts.lint) {
            try {
              execSync('npm run lint', {
                cwd: repoPath,
                stdio: 'pipe',
                timeout: 15000,
              });
              health.checks.linting = true;
            } catch (error) {
              health.issues.push('Linting errors detected');
              health.severity = 'medium';
            }
          }

          // TypeScript check
          if (
            packageJson.scripts &&
            (packageJson.scripts['type-check'] || packageJson.scripts.tsc)
          ) {
            try {
              const tsCommand = packageJson.scripts['type-check']
                ? 'npm run type-check'
                : 'npm run tsc';
              execSync(tsCommand, {
                cwd: repoPath,
                stdio: 'pipe',
                timeout: 30000,
              });
              health.checks.typeScript = true;
            } catch (error) {
              health.issues.push('TypeScript errors detected');
              health.severity = 'high';
            }
          }

          // Build check
          if (packageJson.scripts && packageJson.scripts.build) {
            try {
              execSync('npm run build', {
                cwd: repoPath,
                stdio: 'pipe',
                timeout: 60000,
              });
              health.checks.build = true;
            } catch (error) {
              health.issues.push('Build errors detected');
              health.severity = 'critical';
              health.status = 'critical';
            }
          }
        } catch (error) {
          health.issues.push('Invalid package.json');
          health.severity = 'high';
        }
      }

      if (health.issues.length === 0) {
        health.status = 'healthy';
      } else {
        health.status = health.severity === 'critical' ? 'critical' : 'degraded';
      }
    } catch (error) {
      health.issues.push(`Health check failed: ${error.message}`);
      health.severity = 'critical';
      health.status = 'critical';
    }

    return health;
  }

  async demonstrateErrorDetection() {
    this.log('🔍 Demonstrating Error Detection Capabilities...');

    const detectionResults = {
      totalScanned: 0,
      errorsFound: 0,
      errorTypes: {
        build: 0,
        type: 0,
        lint: 0,
        schema: 0,
        runtime: 0,
      },
      detectedIssues: [],
    };

    for (const repo of this.repositories) {
      const repoPath = path.join(process.cwd(), repo);
      if (!fs.existsSync(repoPath)) continue;

      detectionResults.totalScanned++;
      const repoErrors = await this.detectErrorsInRepository(repoPath, repo);

      repoErrors.forEach(error => {
        detectionResults.errorsFound++;
        detectionResults.errorTypes[error.type]++;
        detectionResults.detectedIssues.push(error);
      });
    }

    this.results.errorsDetected = detectionResults.detectedIssues;

    this.log('📊 Error Detection Results:');
    this.log(`   • Total Repositories Scanned: ${detectionResults.totalScanned}`);
    this.log(`   • Total Errors Found: ${detectionResults.errorsFound}`);
    this.log(`   • Build Errors: ${detectionResults.errorTypes.build}`);
    this.log(`   • TypeScript Errors: ${detectionResults.errorTypes.type}`);
    this.log(`   • Lint Errors: ${detectionResults.errorTypes.lint}`);
    this.log(`   • Schema Errors: ${detectionResults.errorTypes.schema}`);
    this.log(`   • Runtime Issues: ${detectionResults.errorTypes.runtime}`);

    return detectionResults;
  }

  async detectErrorsInRepository(repoPath, repoName) {
    const errors = [];

    try {
      // Check for lint errors
      try {
        const lintResult = execSync('npm run lint 2>&1 || true', {
          cwd: repoPath,
          encoding: 'utf8',
          timeout: 15000,
        });

        if (lintResult.includes('error') || lintResult.includes('✖')) {
          const errorCount = (lintResult.match(/\d+ error/g) || []).length;
          errors.push({
            type: 'lint',
            severity: 'medium',
            source: repoName,
            message: `${errorCount} linting errors detected`,
            autoFixable: true,
            timestamp: new Date(),
          });
        }
      } catch (error) {
        // Lint command not available or failed
      }

      // Check for TypeScript errors
      try {
        const tsResult = execSync('npm run type-check 2>&1 || true', {
          cwd: repoPath,
          encoding: 'utf8',
          timeout: 30000,
        });

        if (tsResult.includes('error TS')) {
          const tsErrors = (tsResult.match(/error TS/g) || []).length;
          errors.push({
            type: 'type',
            severity: 'high',
            source: repoName,
            message: `${tsErrors} TypeScript errors detected`,
            autoFixable: false,
            timestamp: new Date(),
          });
        }
      } catch (error) {
        // TypeScript check not available or failed
      }

      // Check for build errors
      try {
        execSync('npm run build', {
          cwd: repoPath,
          stdio: 'pipe',
          timeout: 60000,
        });
      } catch (error) {
        errors.push({
          type: 'build',
          severity: 'critical',
          source: repoName,
          message: 'Build process failed',
          autoFixable: false,
          timestamp: new Date(),
        });
      }

      // Check for missing dependencies
      const packageJsonPath = path.join(repoPath, 'package.json');
      const nodeModulesPath = path.join(repoPath, 'node_modules');

      if (fs.existsSync(packageJsonPath) && !fs.existsSync(nodeModulesPath)) {
        errors.push({
          type: 'runtime',
          severity: 'high',
          source: repoName,
          message: 'Missing node_modules - dependencies not installed',
          autoFixable: true,
          timestamp: new Date(),
        });
      }
    } catch (error) {
      errors.push({
        type: 'runtime',
        severity: 'medium',
        source: repoName,
        message: `Error detection failed: ${error.message}`,
        autoFixable: false,
        timestamp: new Date(),
      });
    }

    return errors;
  }

  async demonstrateAutoFix() {
    this.log('🔧 Demonstrating Auto-Fix Capabilities...');

    const autoFixResults = {
      totalAttempts: 0,
      successfulFixes: 0,
      fixedIssues: [],
      failedFixes: [],
    };

    const autoFixableErrors = this.results.errorsDetected.filter(error => error.autoFixable);

    for (const error of autoFixableErrors.slice(0, 3)) {
      // Limit to 3 for demo
      autoFixResults.totalAttempts++;
      this.results.performance.fixAttempts++;

      const fixResult = await this.attemptAutoFix(error);

      if (fixResult.success) {
        autoFixResults.successfulFixes++;
        autoFixResults.fixedIssues.push(fixResult);
        this.results.performance.successfulFixes++;
        this.log(`✅ Auto-fixed: ${error.message} in ${error.source}`);
      } else {
        autoFixResults.failedFixes.push(fixResult);
        this.log(`❌ Auto-fix failed: ${error.message} in ${error.source}`);
      }
    }

    this.results.errorsFixed = autoFixResults.fixedIssues;

    this.log('📊 Auto-Fix Results:');
    this.log(`   • Fix Attempts: ${autoFixResults.totalAttempts}`);
    this.log(`   • Successful Fixes: ${autoFixResults.successfulFixes}`);
    this.log(`   • Failed Fixes: ${autoFixResults.failedFixes.length}`);
    this.log(
      `   • Fix Success Rate: ${
        autoFixResults.totalAttempts > 0
          ? Math.round((autoFixResults.successfulFixes / autoFixResults.totalAttempts) * 100)
          : 0
      }%`
    );

    return autoFixResults;
  }

  async attemptAutoFix(error) {
    const startTime = Date.now();

    try {
      switch (error.type) {
        case 'lint':
          return await this.autoFixLintError(error);
        case 'runtime':
          if (error.message.includes('node_modules')) {
            return await this.autoFixDependencies(error);
          }
          break;
        default:
          return {
            success: false,
            description: `Auto-fix not implemented for ${error.type} errors`,
            timeSpent: Date.now() - startTime,
            requiresManualIntervention: true,
          };
      }
    } catch (fixError) {
      return {
        success: false,
        description: `Auto-fix failed: ${fixError.message}`,
        timeSpent: Date.now() - startTime,
        requiresManualIntervention: true,
      };
    }

    return {
      success: false,
      description: 'No applicable auto-fix strategy',
      timeSpent: Date.now() - startTime,
      requiresManualIntervention: true,
    };
  }

  async autoFixLintError(error) {
    const startTime = Date.now();
    const repoPath = this.getRepositoryPath(error.source);

    try {
      execSync('npm run lint:fix', {
        cwd: repoPath,
        stdio: 'pipe',
        timeout: 30000,
      });

      return {
        success: true,
        description: 'ESLint auto-fix completed',
        commandsExecuted: ['npm run lint:fix'],
        timeSpent: Date.now() - startTime,
      };
    } catch (fixError) {
      return {
        success: false,
        description: `ESLint auto-fix failed: ${fixError.message}`,
        timeSpent: Date.now() - startTime,
        requiresManualIntervention: true,
      };
    }
  }

  async autoFixDependencies(error) {
    const startTime = Date.now();
    const repoPath = this.getRepositoryPath(error.source);

    try {
      this.log(`🔧 Installing dependencies for ${error.source}...`);
      execSync('npm install', {
        cwd: repoPath,
        stdio: 'pipe',
        timeout: 120000,
      });

      return {
        success: true,
        description: 'Dependencies installed successfully',
        commandsExecuted: ['npm install'],
        timeSpent: Date.now() - startTime,
      };
    } catch (fixError) {
      return {
        success: false,
        description: `Dependency installation failed: ${fixError.message}`,
        timeSpent: Date.now() - startTime,
        requiresManualIntervention: true,
      };
    }
  }

  async demonstrateContinuousMonitoring() {
    this.log('🛰️ Demonstrating Continuous Monitoring Setup...');

    this.results.monitoringActive = true;

    // Simulate continuous monitoring setup
    const monitoringConfig = {
      enabled: true,
      scanInterval: 30000, // 30 seconds
      priority: 'medium',
      autoFix: true,
      repositories: this.repositories,
      alertThresholds: {
        critical: 1,
        high: 3,
        medium: 10,
      },
    };

    this.log('📊 Monitoring Configuration:');
    this.log(`   • Scan Interval: ${monitoringConfig.scanInterval / 1000} seconds`);
    this.log(`   • Auto-Fix Enabled: ${monitoringConfig.autoFix}`);
    this.log(`   • Monitored Repositories: ${monitoringConfig.repositories.length}`);
    this.log(`   • Alert Threshold (Critical): ${monitoringConfig.alertThresholds.critical}`);

    // Simulate one monitoring cycle
    this.log('🔄 Running sample monitoring cycle...');
    const cycleStart = Date.now();

    const cycleResults = await this.demonstrateHealthCheck();

    const cycleDuration = Date.now() - cycleStart;
    this.results.performance.scanDuration = cycleDuration;
    this.results.performance.totalScans = 1;

    this.log(`✅ Monitoring cycle completed in ${cycleDuration}ms`);
    this.log('🛰️ Continuous monitoring would continue in background...');

    return monitoringConfig;
  }

  getRepositoryPath(repoName) {
    // Convert repo name to actual path
    const repoMappings = {
      'apps/dashboard': path.join(process.cwd(), 'apps', 'dashboard'),
      'apps/api': path.join(process.cwd(), 'apps', 'api'),
      'packages/core-agents': path.join(process.cwd(), 'packages', 'core-agents'),
      'packages/data-model': path.join(process.cwd(), 'packages', 'data-model'),
      'packages/utils': path.join(process.cwd(), 'packages', 'utils'),
      'packages/types': path.join(process.cwd(), 'packages', 'types'),
    };

    return repoMappings[repoName] || path.join(process.cwd(), repoName);
  }

  async generateDemoReport() {
    this.log('📋 Generating demonstration report...');

    const report = {
      timestamp: new Date().toISOString(),
      demoRuntime: Date.now() - this.startTime,
      errorSentinelCapabilities: [
        'System Health Monitoring',
        'Multi-Repository Error Detection',
        'Automatic Error Classification',
        'Intelligent Auto-Fix Strategies',
        'Continuous Background Monitoring',
        'Performance Metrics Tracking',
        'Comprehensive Reporting',
      ],
      demoResults: this.results,
      systemRecommendations: this.generateSystemRecommendations(),
      nextSteps: [
        'Deploy ErrorSentinel in production environment',
        'Configure continuous monitoring intervals',
        'Set up alerting for critical issues',
        'Integrate with CI/CD pipeline',
        'Establish error escalation procedures',
      ],
    };

    // Ensure reports directory exists
    const reportsDir = path.join(process.cwd(), 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    // Write report
    const reportPath = path.join(reportsDir, 'error-sentinel-demo.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    this.log('✅ Demo report saved successfully');
    return report;
  }

  generateSystemRecommendations() {
    const recommendations = [];

    if (this.results.errorsDetected.length > 0) {
      recommendations.push('Address detected errors to improve system stability');
    }

    if (this.results.systemHealth === 'critical') {
      recommendations.push('System requires immediate attention - critical errors detected');
    } else if (this.results.systemHealth === 'degraded') {
      recommendations.push('System performance is degraded - schedule maintenance');
    }

    if (this.results.performance.successfulFixes < this.results.performance.fixAttempts) {
      recommendations.push('Some issues require manual intervention');
    }

    recommendations.push('Enable continuous monitoring for proactive error detection');
    recommendations.push('Set up automated alerts for critical system issues');

    return recommendations;
  }
}

// Run the demo
if (require.main === module) {
  const demo = new ErrorSentinelDemo();
  demo.run().catch(console.error);
}

module.exports = ErrorSentinelDemo;
