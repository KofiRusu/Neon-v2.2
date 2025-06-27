#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const AutonomousTestingAgent = require('./autonomous-testing-agent');
const APIContractValidator = require('./api-contract-validator');

class FineTuningMaster {
  constructor() {
    this.projectPath = process.cwd();
    this.results = {
      timestamp: new Date().toISOString(),
      phases: {},
      improvements: [],
      metrics: {},
      recommendations: [],
    };

    this.phases = [
      { name: 'setup', title: 'Environment Setup', handler: this.setupPhase },
      { name: 'analysis', title: 'Code Analysis', handler: this.analysisPhase },
      { name: 'testing', title: 'Comprehensive Testing', handler: this.testingPhase },
      { name: 'optimization', title: 'Performance Optimization', handler: this.optimizationPhase },
      { name: 'validation', title: 'Final Validation', handler: this.validationPhase },
    ];
  }

  async run() {
    console.log('🎯 Starting NeonHub Fine-Tuning Master Agent\n');
    console.log('='.repeat(60));

    try {
      for (const phase of this.phases) {
        console.log(`\n🔄 Phase: ${phase.title}`);
        console.log('-'.repeat(40));

        const startTime = Date.now();
        await phase.handler.call(this);
        const duration = Date.now() - startTime;

        this.results.phases[phase.name] = {
          status: 'completed',
          duration,
          timestamp: new Date().toISOString(),
        };

        console.log(`✅ ${phase.title} completed in ${duration / 1000}s\n`);
      }

      await this.generateMasterReport();
      console.log('🎉 Fine-tuning completed successfully!');
    } catch (error) {
      console.error('❌ Fine-tuning failed:', error.message);
      this.results.error = error.message;
      await this.generateMasterReport();
      process.exit(1);
    }
  }

  async setupPhase() {
    console.log('🔧 Setting up development environment...');

    // Ensure all dependencies are installed
    if (!fs.existsSync('node_modules')) {
      console.log('Installing dependencies...');
      execSync('npm install', { stdio: 'inherit' });
    }

    // Setup database
    console.log('Setting up database...');
    try {
      execSync('npm run db:generate', { stdio: 'inherit' });
      this.results.improvements.push('Database schema generated successfully');
    } catch (error) {
      console.log('⚠️  Database setup warning:', error.message);
    }

    // Clean build artifacts
    console.log('Cleaning build artifacts...');
    execSync('npm run clean', { stdio: 'inherit' });

    this.results.improvements.push('Environment setup completed');
  }

  async analysisPhase() {
    console.log('🔍 Analyzing codebase structure and quality...');

    // Code complexity analysis
    await this.analyzeCodeComplexity();

    // Dependency analysis
    await this.analyzeDependencies();

    // Security analysis
    await this.analyzeSecurityVulnerabilities();

    this.results.improvements.push('Code analysis completed with insights generated');
  }

  async analyzeCodeComplexity() {
    console.log('📊 Analyzing code complexity...');

    try {
      // Count lines of code
      const locResult = execSync(
        `find . -name "*.ts" -not -path "./node_modules/*" | xargs wc -l | tail -1`,
        {
          encoding: 'utf8',
        }
      );

      const totalLines = parseInt(locResult.split(/\s+/)[0]);

      this.results.metrics.linesOfCode = totalLines;

      // Basic complexity metrics
      const tsFiles = execSync(`find . -name "*.ts" -not -path "./node_modules/*" | wc -l`, {
        encoding: 'utf8',
      }).trim();

      this.results.metrics.typeScriptFiles = parseInt(tsFiles);

      console.log(`📈 Found ${tsFiles} TypeScript files with ${totalLines} total lines`);
    } catch (error) {
      console.log('⚠️  Code complexity analysis failed:', error.message);
    }
  }

  async analyzeDependencies() {
    console.log('📦 Analyzing dependencies...');

    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

      const depCount = Object.keys(packageJson.dependencies || {}).length;
      const devDepCount = Object.keys(packageJson.devDependencies || {}).length;

      this.results.metrics.dependencies = depCount;
      this.results.metrics.devDependencies = devDepCount;

      console.log(`📦 ${depCount} dependencies, ${devDepCount} dev dependencies`);

      // Check for outdated packages
      try {
        const outdatedResult = execSync('npm outdated --json', { encoding: 'utf8' });
        const outdated = JSON.parse(outdatedResult);

        if (Object.keys(outdated).length > 0) {
          this.results.recommendations.push({
            type: 'dependencies',
            priority: 'medium',
            message: `${Object.keys(outdated).length} packages are outdated`,
            action: 'Run `npm update` to update dependencies',
          });
        }
      } catch (error) {
        // npm outdated returns non-zero exit code when packages are outdated
        console.log('📦 Some dependencies may be outdated');
      }
    } catch (error) {
      console.log('⚠️  Dependency analysis failed:', error.message);
    }
  }

  async analyzeSecurityVulnerabilities() {
    console.log('🔒 Analyzing security vulnerabilities...');

    try {
      const auditResult = execSync('npm audit --json', { encoding: 'utf8' });
      const audit = JSON.parse(auditResult);

      if (audit.vulnerabilities && Object.keys(audit.vulnerabilities).length > 0) {
        const vulnCount = Object.keys(audit.vulnerabilities).length;

        this.results.recommendations.push({
          type: 'security',
          priority: 'high',
          message: `${vulnCount} security vulnerabilities found`,
          action: 'Run `npm audit fix` to resolve vulnerabilities',
        });

        console.log(`🚨 ${vulnCount} security vulnerabilities found`);
      } else {
        console.log('✅ No security vulnerabilities found');
      }
    } catch (error) {
      console.log('⚠️  Security analysis failed:', error.message);
    }
  }

  async testingPhase() {
    console.log('🧪 Running comprehensive testing suite...');

    // Run autonomous testing agent
    const testingAgent = new AutonomousTestingAgent();
    await testingAgent.run();

    // Merge results
    this.results.testing = testingAgent.results;
    this.results.improvements.push('Comprehensive testing completed');

    // API contract validation
    const apiValidator = new APIContractValidator();
    await apiValidator.validateAll();

    this.results.apiValidation = apiValidator.results;
    this.results.improvements.push('API contract validation completed');
  }

  async optimizationPhase() {
    console.log('⚡ Performing optimization improvements...');

    // Build optimization
    await this.optimizeBuild();

    // Code optimization suggestions
    await this.generateOptimizationSuggestions();

    this.results.improvements.push('Optimization phase completed');
  }

  async optimizeBuild() {
    console.log('🏗️  Optimizing build process...');

    try {
      // Test build performance
      const startTime = Date.now();
      execSync('npm run build', { stdio: 'inherit' });
      const buildTime = Date.now() - startTime;

      this.results.metrics.buildTime = buildTime;
      console.log(`⏱️  Build completed in ${buildTime / 1000}s`);

      if (buildTime > 60000) {
        // More than 1 minute
        this.results.recommendations.push({
          type: 'performance',
          priority: 'medium',
          message: 'Build time is longer than optimal',
          action: 'Consider implementing build caching and parallelization',
        });
      }
    } catch (error) {
      console.log('⚠️  Build optimization failed:', error.message);
      this.results.recommendations.push({
        type: 'build',
        priority: 'high',
        message: 'Build process is failing',
        action: 'Fix build errors before proceeding',
      });
    }
  }

  async generateOptimizationSuggestions() {
    console.log('💡 Generating optimization suggestions...');

    // Bundle size analysis (if applicable)
    try {
      const bundleStatsPath = path.join('apps', 'dashboard', '.next', 'bundle-stats.json');
      if (fs.existsSync(bundleStatsPath)) {
        const bundleStats = JSON.parse(fs.readFileSync(bundleStatsPath, 'utf8'));

        // Add bundle optimization suggestions
        this.results.recommendations.push({
          type: 'performance',
          priority: 'low',
          message: 'Consider implementing bundle splitting for better performance',
          action: 'Analyze bundle composition and split large chunks',
        });
      }
    } catch (error) {
      // Bundle stats not available
    }

    // Database optimization suggestions
    this.results.recommendations.push({
      type: 'database',
      priority: 'medium',
      message: 'Implement database query optimization',
      action: 'Add database indexes for frequently queried fields',
    });

    // Caching suggestions
    this.results.recommendations.push({
      type: 'caching',
      priority: 'medium',
      message: 'Implement response caching for API endpoints',
      action: 'Add Redis or in-memory caching for frequent queries',
    });
  }

  async validationPhase() {
    console.log('✅ Running final validation...');

    // Final test run
    try {
      execSync('npm run ci', { stdio: 'inherit' });
      this.results.improvements.push('All CI checks passed successfully');
      console.log('✅ All validation checks passed');
    } catch (error) {
      console.log('❌ Validation failed:', error.message);
      this.results.recommendations.push({
        type: 'validation',
        priority: 'critical',
        message: 'Final validation failed',
        action: 'Review and fix all failing tests and checks',
      });
    }
  }

  async generateMasterReport() {
    console.log('📊 Generating master fine-tuning report...');

    const totalRecommendations = this.results.recommendations.length;
    const criticalIssues = this.results.recommendations.filter(
      r => r.priority === 'critical'
    ).length;
    const highPriorityIssues = this.results.recommendations.filter(
      r => r.priority === 'high'
    ).length;

    const report = `# NeonHub Fine-Tuning Master Report

Generated: ${this.results.timestamp}

## 🎯 Executive Summary

The NeonHub AI Ecosystem has undergone comprehensive fine-tuning analysis covering:
- Environment setup and configuration
- Code quality and complexity analysis
- Comprehensive testing suite execution
- Performance optimization recommendations
- Final validation and verification

### Key Metrics
- **Lines of Code**: ${this.results.metrics.linesOfCode || 'N/A'}
- **TypeScript Files**: ${this.results.metrics.typeScriptFiles || 'N/A'}
- **Dependencies**: ${this.results.metrics.dependencies || 'N/A'}
- **Build Time**: ${this.results.metrics.buildTime ? `${this.results.metrics.buildTime / 1000}s` : 'N/A'}

### Issue Summary
- **Critical Issues**: ${criticalIssues}
- **High Priority**: ${highPriorityIssues}
- **Total Recommendations**: ${totalRecommendations}

## 📋 Phase Results

${Object.entries(this.results.phases)
  .map(
    ([phase, result]) => `
### ${phase.charAt(0).toUpperCase() + phase.slice(1)} Phase
- **Status**: ${result.status}
- **Duration**: ${result.duration / 1000}s
- **Completed**: ${result.timestamp}
`
  )
  .join('')}

## 🚀 Improvements Implemented

${this.results.improvements.map((improvement, index) => `${index + 1}. ${improvement}`).join('\n')}

## 🚨 Critical Recommendations

${this.results.recommendations
  .filter(r => r.priority === 'critical')
  .map(
    rec => `
### ${rec.type.charAt(0).toUpperCase() + rec.type.slice(1)}
**Issue**: ${rec.message}
**Action**: ${rec.action}
`
  )
  .join('')}

## ⚡ High Priority Actions

${this.results.recommendations
  .filter(r => r.priority === 'high')
  .map(
    rec => `
### ${rec.type.charAt(0).toUpperCase() + rec.type.slice(1)}
**Issue**: ${rec.message}
**Action**: ${rec.action}
`
  )
  .join('')}

## 💡 Optimization Opportunities

${this.results.recommendations
  .filter(r => r.priority === 'medium' || r.priority === 'low')
  .map(
    rec => `
### ${rec.type.charAt(0).toUpperCase() + rec.type.slice(1)} (${rec.priority})
**Issue**: ${rec.message}
**Action**: ${rec.action}
`
  )
  .join('')}

## 📈 Performance Insights

### Build Performance
${
  this.results.metrics.buildTime
    ? `
- Build time: ${this.results.metrics.buildTime / 1000}s
- Status: ${this.results.metrics.buildTime < 30000 ? '✅ Optimal' : this.results.metrics.buildTime < 60000 ? '⚠️  Acceptable' : '❌ Needs Optimization'}
`
    : '- Build performance data not available'
}

### Code Quality
- TypeScript coverage: Active
- Linting: ${this.results.testing?.linting?.status === 'passed' ? '✅ Passed' : '❌ Issues Found'}
- Test coverage: ${this.results.testing?.coverage?.statements ? `${this.results.testing.coverage.statements}%` : 'N/A'}

## 🔄 Continuous Improvement Plan

### Immediate Actions (Next 1-2 Days)
1. Fix all critical and high-priority issues
2. Ensure all tests are passing
3. Resolve any build or deployment issues

### Short Term (Next 1-2 Weeks)
1. Implement recommended optimizations
2. Add missing test coverage
3. Update outdated dependencies
4. Improve code documentation

### Long Term (Next 1-3 Months)
1. Implement advanced monitoring and alerting
2. Optimize database performance
3. Add comprehensive CI/CD pipeline enhancements
4. Consider architectural improvements

## 🛡️ Quality Gates

The following quality gates should be maintained:
- **Test Coverage**: Minimum 80%
- **Build Time**: Under 60 seconds
- **Security Vulnerabilities**: Zero critical/high
- **TypeScript Errors**: Zero
- **Linting Issues**: Zero critical

## 📞 Next Steps

1. **Review this report** with the development team
2. **Prioritize recommendations** based on business impact
3. **Create action items** in project management system
4. **Schedule regular fine-tuning** sessions (weekly/monthly)
5. **Monitor metrics** continuously for regression detection

---

*Generated by NeonHub Fine-Tuning Master Agent*
*Run this agent regularly to maintain optimal code quality and performance*
`;

    const reportPath = path.join(this.projectPath, 'FINE_TUNING_MASTER_REPORT.md');
    fs.writeFileSync(reportPath, report);

    console.log(`✅ Master report generated: ${reportPath}`);
  }
}

// Auto-run if called directly
if (require.main === module) {
  const master = new FineTuningMaster();
  master.run().catch(console.error);
}

module.exports = FineTuningMaster;
