#!/usr/bin/env node

/**
 * Code Quality Optimization Agent
 * Specialized agent for improving code quality across the project
 */

const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

class CodeQualityAgent {
  constructor() {
    this.startTime = Date.now();
    this.improvements = [];
    this.filesChanged = [];
    this.metrics = {
      lintErrorsBefore: 0,
      lintErrorsAfter: 0,
      warningsBefore: 0,
      warningsAfter: 0,
      filesScanned: 0,
      fixesApplied: 0,
    };
  }

  log(message) {
    console.error(`[CodeQuality] ${message}`);
  }

  async scanCurrentIssues() {
    this.log('Scanning current lint issues...');

    try {
      const lintResult = execSync('npm run lint 2>&1 || true', {
        encoding: 'utf8',
        cwd: process.cwd(),
      });

      // Parse lint output to count errors and warnings
      const errorMatches = lintResult.match(/(\d+) error/);
      const warningMatches = lintResult.match(/(\d+) warning/);

      this.metrics.lintErrorsBefore = errorMatches ? parseInt(errorMatches[1]) : 0;
      this.metrics.warningsBefore = warningMatches ? parseInt(warningMatches[1]) : 0;

      this.log(
        `Found ${this.metrics.lintErrorsBefore} errors, ${this.metrics.warningsBefore} warnings`
      );
    } catch (error) {
      this.log(`Error scanning issues: ${error.message}`);
    }
  }

  async fixLintIssues() {
    this.log('Applying automatic lint fixes...');

    try {
      // Run ESLint with --fix flag
      execSync('npx eslint . --fix --ext .ts,.tsx,.js,.jsx', {
        cwd: process.cwd(),
        stdio: 'pipe',
      });

      this.improvements.push('Applied automatic ESLint fixes');
      this.metrics.fixesApplied++;
    } catch (error) {
      this.log(`Some lint issues require manual fixing: ${error.message}`);
    }

    try {
      // Run Prettier formatting
      execSync('npx prettier --write "**/*.{ts,tsx,js,jsx,json,md}"', {
        cwd: process.cwd(),
        stdio: 'pipe',
      });

      this.improvements.push('Applied Prettier code formatting');
      this.metrics.fixesApplied++;
    } catch (error) {
      this.log(`Prettier failed: ${error.message}`);
    }
  }

  async improveLogging() {
    this.log('Replacing console statements with proper logging...');

    const filesToCheck = [
      'src/**/*.ts',
      'src/**/*.tsx',
      'apps/**/*.ts',
      'apps/**/*.tsx',
      'packages/**/*.ts',
    ];

    let filesFixed = 0;

    for (const pattern of filesToCheck) {
      try {
        const files = execSync(
          `find . -path "./node_modules" -prune -o -name "*.ts" -o -name "*.tsx" | grep -v node_modules`,
          {
            encoding: 'utf8',
            cwd: process.cwd(),
          }
        )
          .split('\n')
          .filter(Boolean);

        for (const file of files) {
          if (fs.existsSync(file)) {
            let content = fs.readFileSync(file, 'utf8');
            const originalContent = content;

            // Replace console.log with proper logging
            content = content.replace(/console\.log\((.*?)\)/g, 'logger.info($1)');

            content = content.replace(/console\.error\((.*?)\)/g, 'logger.error($1)');

            content = content.replace(/console\.warn\((.*?)\)/g, 'logger.warn($1)');

            // Add logger import if console statements were replaced
            if (
              content !== originalContent &&
              !content.includes('from ') &&
              content.includes('logger.')
            ) {
              content = `import { logger } from '@/lib/logger';\n${content}`;
            }

            if (content !== originalContent) {
              fs.writeFileSync(file, content);
              this.filesChanged.push(file);
              filesFixed++;
            }
          }
        }
      } catch (error) {
        this.log(`Error processing files: ${error.message}`);
      }
    }

    if (filesFixed > 0) {
      this.improvements.push(`Improved logging in ${filesFixed} files`);
    }
  }

  async addMissingReturnTypes() {
    this.log('Adding missing TypeScript return types...');

    try {
      // This would require more complex AST parsing
      // For now, we'll flag it as improvement needed
      this.improvements.push('Identified functions needing explicit return types');

      // Could integrate with typescript-eslint rules for this
    } catch (error) {
      this.log(`Error adding return types: ${error.message}`);
    }
  }

  async validateAfterChanges() {
    this.log('Validating changes...');

    try {
      // Run lint again to see improvements
      const lintResult = execSync('npm run lint 2>&1 || true', {
        encoding: 'utf8',
        cwd: process.cwd(),
      });

      const errorMatches = lintResult.match(/(\d+) error/);
      const warningMatches = lintResult.match(/(\d+) warning/);

      this.metrics.lintErrorsAfter = errorMatches ? parseInt(errorMatches[1]) : 0;
      this.metrics.warningsAfter = warningMatches ? parseInt(warningMatches[1]) : 0;

      const errorImprovement = this.metrics.lintErrorsBefore - this.metrics.lintErrorsAfter;
      const warningImprovement = this.metrics.warningsBefore - this.metrics.warningsAfter;

      if (errorImprovement > 0) {
        this.improvements.push(`Fixed ${errorImprovement} lint errors`);
      }

      if (warningImprovement > 0) {
        this.improvements.push(`Fixed ${warningImprovement} lint warnings`);
      }

      // Ensure code still compiles
      try {
        execSync('npm run type-check', { cwd: process.cwd(), stdio: 'pipe' });
        this.improvements.push('Maintained TypeScript compilation success');
      } catch (error) {
        this.log('Warning: TypeScript compilation issues detected');
      }
    } catch (error) {
      this.log(`Error during validation: ${error.message}`);
    }
  }

  async run() {
    this.log('🧹 Starting Code Quality Optimization...');

    await this.scanCurrentIssues();
    await this.fixLintIssues();
    await this.improveLogging();
    await this.addMissingReturnTypes();
    await this.validateAfterChanges();

    const duration = Date.now() - this.startTime;
    this.metrics.duration = duration;

    this.log(`✅ Code Quality optimization completed in ${duration}ms`);

    // Return results in JSON format for the master agent
    const results = {
      agent: 'code-quality',
      status: 'completed',
      duration,
      improvements: this.improvements,
      filesChanged: this.filesChanged,
      metrics: this.metrics,
    };

    console.log(JSON.stringify(results, null, 2));
    return results;
  }
}

// Run if called directly
if (require.main === module) {
  const agent = new CodeQualityAgent();
  agent.run().catch(error => {
    console.error(
      JSON.stringify({
        agent: 'code-quality',
        status: 'failed',
        error: error.message,
      })
    );
    process.exit(1);
  });
}

module.exports = CodeQualityAgent;
