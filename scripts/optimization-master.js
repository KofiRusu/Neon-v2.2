#!/usr/bin/env node

/**
 * NeonHub Master Optimization Agent
 * Orchestrates specialized sub-agents for comprehensive project optimization
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class OptimizationMaster {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      aspects: {},
      summary: {
        total: 0,
        completed: 0,
        failed: 0,
        improvements: [],
      },
    };

    this.aspects = [
      'architecture-design',
      'core-modules',
      'api-layer',
      'frontend-dashboard',
      'code-quality',
      'type-safety',
      'testing',
      'ci-cd',
      'documentation',
      'performance-security',
      'deployment',
    ];
  }

  log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const emoji =
      {
        info: '📋',
        success: '✅',
        error: '❌',
        warning: '⚠️',
        progress: '🔄',
      }[level] || '📋';

    console.log(`${emoji} [${timestamp}] ${message}`);
    if (data) console.log('  ', JSON.stringify(data, null, 2));
  }

  async executeAgent(aspectName) {
    this.log('progress', `Launching ${aspectName} optimization agent...`);

    try {
      const agentPath = `scripts/agents/${aspectName}-agent.js`;

      if (!fs.existsSync(agentPath)) {
        throw new Error(`Agent script not found: ${agentPath}`);
      }

      // Execute the specialized agent
      const result = execSync(`node ${agentPath}`, {
        encoding: 'utf8',
        cwd: process.cwd(),
        timeout: 300000, // 5 minutes max per agent
      });

      const agentResult = JSON.parse(result);

      this.results.aspects[aspectName] = {
        status: 'completed',
        improvements: agentResult.improvements || [],
        metrics: agentResult.metrics || {},
        duration: agentResult.duration || 0,
        filesChanged: agentResult.filesChanged || [],
      };

      this.results.summary.completed++;
      this.results.summary.improvements.push(...(agentResult.improvements || []));

      this.log('success', `${aspectName} agent completed`, {
        improvements: agentResult.improvements?.length || 0,
        filesChanged: agentResult.filesChanged?.length || 0,
      });

      return agentResult;
    } catch (error) {
      this.log('error', `${aspectName} agent failed: ${error.message}`);

      this.results.aspects[aspectName] = {
        status: 'failed',
        error: error.message,
        improvements: [],
        metrics: {},
      };

      this.results.summary.failed++;
      return null;
    }
  }

  async runAllAgents() {
    this.log('info', '🚀 Starting NeonHub Master Optimization Agent');
    this.log('info', `Orchestrating ${this.aspects.length} specialized agents`);

    this.results.summary.total = this.aspects.length;

    // Execute each agent sequentially to avoid conflicts
    for (const aspect of this.aspects) {
      await this.executeAgent(aspect);
    }

    return this.results;
  }

  async updateProjectProgress() {
    this.log('progress', 'Updating PROJECT_PROGRESS.md...');

    try {
      let progressContent = fs.readFileSync('PROJECT_PROGRESS.md', 'utf8');

      // Update completion percentages based on agent results
      const updates = [];
      for (const [aspect, result] of Object.entries(this.results.aspects)) {
        if (result.status === 'completed') {
          // Update the aspect to 100% complete
          const aspectTitle = aspect.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          updates.push(`${aspectTitle}: 100% Complete ✅`);
        }
      }

      // Add optimization summary
      const optimizationSummary = `
## 🤖 **AUTOMATED OPTIMIZATION COMPLETED**

**Date**: ${new Date().toISOString().split('T')[0]}  
**Agent**: NeonHub Master Optimization Agent  
**Status**: ${this.results.summary.failed === 0 ? '✅ SUCCESS' : '⚠️ PARTIAL SUCCESS'}

### **Optimization Results**
- **Total Aspects**: ${this.results.summary.total}
- **Completed**: ${this.results.summary.completed}
- **Failed**: ${this.results.summary.failed}
- **Total Improvements**: ${this.results.summary.improvements.length}

### **Key Improvements Applied**
${this.results.summary.improvements
  .slice(0, 10)
  .map(imp => `- ${imp}`)
  .join('\n')}

---
`;

      // Insert the summary after the status section
      const statusIndex = progressContent.indexOf('## 📊 **OVERALL PROJECT STATUS');
      if (statusIndex !== -1) {
        progressContent =
          progressContent.slice(0, statusIndex) +
          optimizationSummary +
          progressContent.slice(statusIndex);
      } else {
        progressContent = optimizationSummary + progressContent;
      }

      fs.writeFileSync('PROJECT_PROGRESS.md', progressContent);
      this.log('success', 'PROJECT_PROGRESS.md updated successfully');
    } catch (error) {
      this.log('error', `Failed to update PROJECT_PROGRESS.md: ${error.message}`);
    }
  }

  async generateOptimizationReport() {
    const report = {
      title: '🤖 NeonHub Full Project Optimization Report',
      executedAt: this.results.timestamp,
      summary: this.results.summary,
      aspectResults: this.results.aspects,
      recommendations: this.generateRecommendations(),
      nextSteps: this.generateNextSteps(),
    };

    fs.writeFileSync('.optimization-report.json', JSON.stringify(report, null, 2));

    this.log('success', 'Optimization report generated: .optimization-report.json');
    return report;
  }

  generateRecommendations() {
    const recommendations = [];

    if (this.results.summary.failed > 0) {
      recommendations.push('Review and fix failed optimization agents');
    }

    if (this.results.summary.improvements.length < 10) {
      recommendations.push('Consider running optimization again as fewer improvements were found');
    }

    recommendations.push('Schedule regular optimization runs (weekly/monthly)');
    recommendations.push('Monitor performance metrics post-optimization');

    return recommendations;
  }

  generateNextSteps() {
    return [
      'Review all applied changes',
      'Run comprehensive test suite',
      'Update documentation if needed',
      'Deploy to staging for validation',
      'Schedule production deployment',
    ];
  }

  async createOptimizationPR() {
    this.log('progress', 'Creating optimization pull request...');

    try {
      // Stage all changes
      execSync('git add .', { cwd: process.cwd() });

      // Create commit with detailed message
      const commitMessage = `chore: full project optimization & production readiness

🤖 Automated optimization by NeonHub Master Agent

## Summary
- Aspects optimized: ${this.results.summary.completed}/${this.results.summary.total}
- Total improvements: ${this.results.summary.improvements.length}
- Files changed: ${Object.values(this.results.aspects).reduce(
        (acc, aspect) => acc + (aspect.filesChanged?.length || 0),
        0
      )}

## Key Improvements
${this.results.summary.improvements
  .slice(0, 5)
  .map(imp => `- ${imp}`)
  .join('\n')}

Generated by: NeonHub Master Optimization Agent
Timestamp: ${this.results.timestamp}`;

      execSync(`git commit -m "${commitMessage.replace(/"/g, '\\"')}"`, {
        cwd: process.cwd(),
      });

      this.log('success', 'Optimization changes committed');

      // Note: PR creation would require GitHub CLI or API integration
      this.log(
        'info',
        'To create PR, run: gh pr create --title "chore: full project optimization & production readiness" --body "Automated optimization completed"'
      );
    } catch (error) {
      this.log('error', `Failed to create optimization commit: ${error.message}`);
    }
  }
}

// Main execution
async function main() {
  const master = new OptimizationMaster();

  try {
    // Run all optimization agents
    const results = await master.runAllAgents();

    // Update project documentation
    await master.updateProjectProgress();

    // Generate comprehensive report
    await master.generateOptimizationReport();

    // Create PR with changes (if in CI environment)
    if (process.env.CI) {
      await master.createOptimizationPR();
    }

    // Final summary
    master.log('success', '🎉 NeonHub Master Optimization Complete!', {
      completedAspects: results.summary.completed,
      totalImprovements: results.summary.improvements.length,
      failedAspects: results.summary.failed,
    });

    // Exit with appropriate code
    process.exit(results.summary.failed > 0 ? 1 : 0);
  } catch (error) {
    master.log('error', `Master optimization failed: ${error.message}`);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = OptimizationMaster;
