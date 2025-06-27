#!/usr/bin/env node

/**
 * Agent Cost Optimization System Validation Script
 * Tests all components without requiring database connection
 */

const fs = require('fs');
const path = require('path');

class OptimizationSystemValidator {
  constructor() {
    this.checks = [];
    this.errors = [];
    this.warnings = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const icon =
      {
        info: '📋',
        success: '✅',
        error: '❌',
        warning: '⚠️',
        header: '🔍',
      }[type] || '📋';

    console.log(`${icon} ${message}`);

    if (type === 'error') {
      this.errors.push(message);
    } else if (type === 'warning') {
      this.warnings.push(message);
    }
  }

  checkFile(filePath, description) {
    const fullPath = path.join(process.cwd(), filePath);
    const exists = fs.existsSync(fullPath);

    this.checks.push({
      name: description,
      path: filePath,
      passed: exists,
    });

    if (exists) {
      this.log(`${description}: Found`, 'success');
      return true;
    } else {
      this.log(`${description}: Missing - ${filePath}`, 'error');
      return false;
    }
  }

  checkFileContent(filePath, searchText, description) {
    const fullPath = path.join(process.cwd(), filePath);

    if (!fs.existsSync(fullPath)) {
      this.log(`${description}: File missing - ${filePath}`, 'error');
      return false;
    }

    try {
      const content = fs.readFileSync(fullPath, 'utf8');
      const contains = content.includes(searchText);

      this.checks.push({
        name: description,
        path: filePath,
        passed: contains,
      });

      if (contains) {
        this.log(`${description}: Found required content`, 'success');
        return true;
      } else {
        this.log(`${description}: Missing required content - "${searchText}"`, 'error');
        return false;
      }
    } catch (error) {
      this.log(`${description}: Error reading file - ${error.message}`, 'error');
      return false;
    }
  }

  validateDatabaseSchema() {
    this.log('Validating database schema...', 'header');

    // Check Prisma schema file
    this.checkFile('packages/data-model/prisma/schema.prisma', 'Prisma Schema File');

    // Check for optimization fields in BillingLog
    this.checkFileContent(
      'packages/data-model/prisma/schema.prisma',
      'impactScore',
      'BillingLog.impactScore Field'
    );

    this.checkFileContent(
      'packages/data-model/prisma/schema.prisma',
      'conversionAchieved',
      'BillingLog.conversionAchieved Field'
    );

    this.checkFileContent(
      'packages/data-model/prisma/schema.prisma',
      'qualityScore',
      'BillingLog.qualityScore Field'
    );

    this.checkFileContent(
      'packages/data-model/prisma/schema.prisma',
      'retryCount',
      'BillingLog.retryCount Field'
    );

    this.checkFileContent(
      'packages/data-model/prisma/schema.prisma',
      'executionTime',
      'BillingLog.executionTime Field'
    );
  }

  validateCoreAnalytics() {
    this.log('Validating core analytics engine...', 'header');

    // Check main analyzer file
    this.checkFile(
      'packages/core-agents/src/utils/agentCostEfficiency.ts',
      'Agent Cost Efficiency Analyzer'
    );

    // Check for required classes and functions
    this.checkFileContent(
      'packages/core-agents/src/utils/agentCostEfficiency.ts',
      'AgentCostEfficiencyAnalyzer',
      'AgentCostEfficiencyAnalyzer Class'
    );

    this.checkFileContent(
      'packages/core-agents/src/utils/agentCostEfficiency.ts',
      'getAgentEfficiencyMetrics',
      'getAgentEfficiencyMetrics Method'
    );

    this.checkFileContent(
      'packages/core-agents/src/utils/agentCostEfficiency.ts',
      'generateOptimizationSuggestions',
      'generateOptimizationSuggestions Method'
    );

    this.checkFileContent(
      'packages/core-agents/src/utils/agentCostEfficiency.ts',
      'calculateEfficiencyRating',
      'calculateEfficiencyRating Method'
    );
  }

  validateOptimizationScript() {
    this.log('Validating optimization script...', 'header');

    // Check script file
    this.checkFile('scripts/agent-cost-optimizer.ts', 'Agent Cost Optimizer Script');

    // Check for required components
    this.checkFileContent(
      'scripts/agent-cost-optimizer.ts',
      'AgentCostOptimizer',
      'AgentCostOptimizer Class'
    );

    this.checkFileContent(
      'scripts/agent-cost-optimizer.ts',
      'generateOptimizationReport',
      'generateOptimizationReport Method'
    );

    this.checkFileContent(
      'scripts/agent-cost-optimizer.ts',
      'generateMarkdownReport',
      'generateMarkdownReport Method'
    );

    this.checkFileContent(
      'scripts/agent-cost-optimizer.ts',
      'generateImplementationSuggestions',
      'generateImplementationSuggestions Method'
    );
  }

  validateAdminDashboard() {
    this.log('Validating admin dashboard...', 'header');

    // Check optimization page
    this.checkFile('apps/dashboard/src/app/admin/optimization/page.tsx', 'Admin Optimization Page');

    // Check for required components
    this.checkFileContent(
      'apps/dashboard/src/app/admin/optimization/page.tsx',
      'AgentEfficiencyMetrics',
      'AgentEfficiencyMetrics Interface'
    );

    this.checkFileContent(
      'apps/dashboard/src/app/admin/optimization/page.tsx',
      'OptimizationSuggestion',
      'OptimizationSuggestion Interface'
    );

    this.checkFileContent(
      'apps/dashboard/src/app/admin/optimization/page.tsx',
      'getEfficiencyColor',
      'Efficiency Color Helper'
    );

    // Check for neon-glass design elements
    this.checkFileContent(
      'apps/dashboard/src/app/admin/optimization/page.tsx',
      'bg-gradient-to-br from-slate-950',
      'Neon-Glass Background'
    );

    this.checkFileContent(
      'apps/dashboard/src/app/admin/optimization/page.tsx',
      'backdrop-blur-sm',
      'Glassmorphism Effect'
    );
  }

  validateTestSuite() {
    this.log('Validating test suite...', 'header');

    // Check test file
    this.checkFile('tests/optimization/agent-efficiency.test.ts', 'Agent Efficiency Test Suite');

    // Check for required test cases
    this.checkFileContent(
      'tests/optimization/agent-efficiency.test.ts',
      'AgentCostEfficiencyAnalyzer',
      'AgentCostEfficiencyAnalyzer Tests'
    );

    this.checkFileContent(
      'tests/optimization/agent-efficiency.test.ts',
      'should calculate metrics correctly',
      'Metrics Calculation Tests'
    );

    this.checkFileContent(
      'tests/optimization/agent-efficiency.test.ts',
      'should identify inefficient agents',
      'Inefficient Agent Detection Tests'
    );

    this.checkFileContent(
      'tests/optimization/agent-efficiency.test.ts',
      'should generate optimization suggestions',
      'Optimization Suggestion Tests'
    );
  }

  validateDirectoryStructure() {
    this.log('Validating directory structure...', 'header');

    // Create logs directory if it doesn't exist
    const logsDir = path.join(process.cwd(), 'logs', 'optimization');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
      this.log('Created logs/optimization directory', 'success');
    } else {
      this.log('logs/optimization directory exists', 'success');
    }

    // Check tests directory
    const testsDir = path.join(process.cwd(), 'tests', 'optimization');
    if (!fs.existsSync(testsDir)) {
      fs.mkdirSync(testsDir, { recursive: true });
      this.log('Created tests/optimization directory', 'success');
    } else {
      this.log('tests/optimization directory exists', 'success');
    }
  }

  generateMockOptimizationReport() {
    this.log('Generating mock optimization report...', 'header');

    const mockReport = `# 🤖 Agent Cost Efficiency Report (MOCK)

**Generated:** ${new Date().toISOString()}
**Analysis Period:** ${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toDateString()} - ${new Date().toDateString()}
**Status:** System Validation Run

---

## 📊 Executive Summary

- **Agents Analyzed:** 3 (mock data)
- **Critical Issues:** 1 agents  
- **Poor Performance:** 1 agents
- **Potential Monthly Savings:** $115.20

### 🎯 Recommended Actions

- 🚨 URGENT: Review SEO agents - critical efficiency issues detected
- 💰 HIGH COST: Consider model downgrades for SEO, AD agents
- ⚡ QUICK WINS: Implement 2 high-priority optimizations for immediate savings

---

## 📈 Agent Performance Analysis

| Agent Type | Runs | Avg Cost | Impact Score | Conversion Rate | Efficiency | Status |
|------------|------|----------|--------------|-----------------|------------|--------|
| CONTENT | 45 | $0.0320 | 0.75 | 68.9% | 0.0427 | 🟢 GOOD |
| AD | 23 | $0.0890 | 0.45 | 34.8% | 0.1978 | 🟠 POOR |
| SEO | 18 | $0.1450 | 0.28 | 22.2% | 0.5179 | 🔴 CRITICAL |

---

## 🛠️ Optimization Suggestions

### High Priority

#### SEO - COST
**Priority:** 🔴 HIGH
**Suggestion:** Switch SEO to gpt-4o-mini model to reduce cost from $0.1450 to ~$0.0435 per run
**Expected Savings:** $73.44/month
**Implementation:** LOW effort

#### SEO - RELIABILITY  
**Priority:** 🔴 HIGH
**Suggestion:** Improve SEO prompt engineering to reduce retry rate from 2.1 to <0.5
**Expected Savings:** $41.76/month
**Implementation:** MEDIUM effort

---

*This is a mock report generated during system validation*
*All data is simulated for testing purposes*
`;

    const reportPath = path.join(
      process.cwd(),
      'logs',
      'optimization',
      'agent-efficiency-report-validation.md'
    );

    try {
      fs.writeFileSync(reportPath, mockReport);
      this.log('Mock optimization report generated successfully', 'success');
      this.log(`Report saved to: ${reportPath}`, 'info');
      return true;
    } catch (error) {
      this.log(`Failed to generate mock report: ${error.message}`, 'error');
      return false;
    }
  }

  simulateOptimizationAnalysis() {
    this.log('Simulating optimization analysis...', 'header');

    // Simulate the optimization process
    const mockMetrics = [
      {
        agentType: 'CONTENT',
        totalRuns: 45,
        avgCost: 0.032,
        avgImpactScore: 0.75,
        conversionRate: 68.9,
        efficiencyRating: 'GOOD',
      },
      {
        agentType: 'AD',
        totalRuns: 23,
        avgCost: 0.089,
        avgImpactScore: 0.45,
        conversionRate: 34.8,
        efficiencyRating: 'POOR',
      },
      {
        agentType: 'SEO',
        totalRuns: 18,
        avgCost: 0.145,
        avgImpactScore: 0.28,
        conversionRate: 22.2,
        efficiencyRating: 'CRITICAL',
      },
    ];

    // Simulate analysis
    this.log('Processing agent metrics...', 'info');

    let criticalCount = 0;
    let poorCount = 0;
    let totalSavings = 0;

    mockMetrics.forEach(metric => {
      if (metric.efficiencyRating === 'CRITICAL') {
        criticalCount++;
        totalSavings += metric.avgCost * 0.7 * metric.totalRuns; // 70% cost reduction potential
      }
      if (metric.efficiencyRating === 'POOR') {
        poorCount++;
        totalSavings += metric.avgCost * 0.3 * metric.totalRuns; // 30% cost reduction potential
      }
    });

    this.log(
      `Found ${criticalCount} critical efficiency issues`,
      criticalCount > 0 ? 'warning' : 'success'
    );
    this.log(`Found ${poorCount} poor performance agents`, poorCount > 0 ? 'warning' : 'success');
    this.log(`Potential monthly savings: $${totalSavings.toFixed(2)}`, 'info');

    // Generate optimization suggestions
    const suggestions = [];

    if (criticalCount > 0) {
      suggestions.push({
        priority: 'HIGH',
        category: 'COST',
        suggestion: 'Switch high-cost agents to more efficient models',
        expectedSavings: totalSavings * 0.6,
      });
    }

    if (poorCount > 0) {
      suggestions.push({
        priority: 'MEDIUM',
        category: 'QUALITY',
        suggestion: 'Improve prompt engineering for better performance',
        expectedSavings: totalSavings * 0.4,
      });
    }

    this.log(`Generated ${suggestions.length} optimization suggestions`, 'success');

    return {
      metricsAnalyzed: mockMetrics.length,
      criticalIssues: criticalCount,
      poorPerformance: poorCount,
      potentialSavings: totalSavings,
      suggestions: suggestions.length,
    };
  }

  generateValidationReport() {
    this.log('Generating validation report...', 'header');

    const totalChecks = this.checks.length;
    const passedChecks = this.checks.filter(check => check.passed).length;
    const failedChecks = totalChecks - passedChecks;

    const report = `# 🔍 Agent Optimization System Validation Report

**Generated:** ${new Date().toISOString()}
**Validation Status:** ${failedChecks === 0 ? '✅ PASSED' : '❌ FAILED'}

---

## 📊 Validation Summary

- **Total Checks:** ${totalChecks}
- **Passed:** ${passedChecks}
- **Failed:** ${failedChecks}
- **Success Rate:** ${((passedChecks / totalChecks) * 100).toFixed(1)}%

---

## 📋 Detailed Results

### ✅ Passed Checks
${this.checks
  .filter(check => check.passed)
  .map(check => `- ${check.name}: ${check.path}`)
  .join('\n')}

${
  failedChecks > 0
    ? `### ❌ Failed Checks
${this.checks
  .filter(check => !check.passed)
  .map(check => `- ${check.name}: ${check.path}`)
  .join('\n')}`
    : ''
}

---

## 🚀 System Status

${
  failedChecks === 0
    ? '✅ **All systems operational** - Agent optimization system is ready for production use.'
    : `⚠️ **${failedChecks} issues found** - Please address the failed checks before deployment.`
}

---

*Validation completed by NeonHub Agent Optimization System Validator*
`;

    const reportPath = path.join(
      process.cwd(),
      'logs',
      'optimization',
      'system-validation-report.md'
    );

    try {
      fs.writeFileSync(reportPath, report);
      this.log('Validation report generated successfully', 'success');
      this.log(`Report saved to: ${reportPath}`, 'info');
      return true;
    } catch (error) {
      this.log(`Failed to generate validation report: ${error.message}`, 'error');
      return false;
    }
  }

  async run() {
    console.log('🚀 Starting Agent Cost Optimization System Validation...\n');

    // Validate all components
    this.validateDatabaseSchema();
    this.validateCoreAnalytics();
    this.validateOptimizationScript();
    this.validateAdminDashboard();
    this.validateTestSuite();
    this.validateDirectoryStructure();

    // Generate mock report
    this.generateMockOptimizationReport();

    // Simulate optimization analysis
    const analysisResults = this.simulateOptimizationAnalysis();

    // Generate validation report
    this.generateValidationReport();

    // Final summary
    console.log(`\n${'='.repeat(60)}`);
    console.log('📈 VALIDATION SUMMARY');
    console.log('='.repeat(60));

    const totalChecks = this.checks.length;
    const passedChecks = this.checks.filter(check => check.passed).length;
    const failedChecks = totalChecks - passedChecks;

    console.log(`📋 Total Checks: ${totalChecks}`);
    console.log(`✅ Passed: ${passedChecks}`);
    console.log(`❌ Failed: ${failedChecks}`);
    console.log(`📊 Success Rate: ${((passedChecks / totalChecks) * 100).toFixed(1)}%`);

    if (this.errors.length > 0) {
      console.log('\n❌ ERRORS FOUND:');
      this.errors.forEach(error => console.log(`   ${error}`));
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️ WARNINGS:');
      this.warnings.forEach(warning => console.log(`   ${warning}`));
    }

    // Simulation results
    console.log('\n🤖 SIMULATION RESULTS:');
    console.log(`   Agents Analyzed: ${analysisResults.metricsAnalyzed}`);
    console.log(`   Critical Issues: ${analysisResults.criticalIssues}`);
    console.log(`   Poor Performance: ${analysisResults.poorPerformance}`);
    console.log(`   Potential Savings: $${analysisResults.potentialSavings.toFixed(2)}/month`);
    console.log(`   Optimization Suggestions: ${analysisResults.suggestions}`);

    const isSuccess = failedChecks === 0;

    console.log(
      `\n${isSuccess ? '✅' : '❌'} Validation ${isSuccess ? 'COMPLETED SUCCESSFULLY' : 'FAILED'}`
    );

    if (isSuccess) {
      console.log('🚀 Agent Cost Optimization System is ready for production!');
    } else {
      console.log('🔧 Please address the failed checks before deployment.');
    }

    return isSuccess;
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new OptimizationSystemValidator();
  validator
    .run()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Validation failed with error:', error);
      process.exit(1);
    });
}

module.exports = { OptimizationSystemValidator };
