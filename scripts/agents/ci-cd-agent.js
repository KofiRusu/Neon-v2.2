#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class CICDAgent {
  constructor() {
    this.startTime = Date.now();
    this.improvements = [];
    this.filesChanged = [];
    this.metrics = {};
  }

  log(message) {
    console.error(`[CI/CD] ${message}`);
  }

  async run() {
    this.log('⚙️ Starting CI/CD Pipeline Optimization...');

    // 1. Analyze existing workflows
    try {
      const workflowsDir = path.join(process.cwd(), '.github/workflows');
      if (fs.existsSync(workflowsDir)) {
        const workflows = fs
          .readdirSync(workflowsDir)
          .filter(f => f.endsWith('.yml') || f.endsWith('.yaml'));
        this.metrics.workflowCount = workflows.length;
        this.improvements.push(`Found ${workflows.length} existing CI/CD workflows`);

        // Analyze workflow content
        let totalJobs = 0;
        let hasSecurityChecks = false;
        let hasCaching = false;

        workflows.forEach(workflow => {
          try {
            const content = fs.readFileSync(path.join(workflowsDir, workflow), 'utf8');
            const jobs = (content.match(/^\s*\w+:\s*$/gm) || []).length;
            totalJobs += jobs;

            if (content.includes('security') || content.includes('audit')) {
              hasSecurityChecks = true;
            }
            if (content.includes('cache:')) {
              hasCaching = true;
            }
          } catch (error) {
            this.log(`Error reading workflow ${workflow}: ${error.message}`);
          }
        });

        this.metrics.totalJobs = totalJobs;
        this.metrics.hasSecurityChecks = hasSecurityChecks;
        this.metrics.hasCaching = hasCaching;

        if (!hasSecurityChecks) {
          this.improvements.push('Security scanning not detected in workflows');
        }
        if (!hasCaching) {
          this.improvements.push('Dependency caching not optimized');
        }
      } else {
        this.improvements.push('No CI/CD workflows found - consider adding GitHub Actions');
      }
    } catch (err) {
      this.log(`Workflow analysis failed: ${err.message}`);
    }

    // 2. Check package.json for CI-related scripts
    try {
      const packagePath = path.join(process.cwd(), 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));

      const ciScripts = {
        ci: 'npm ci',
        build: 'npm run build',
        'test:ci': 'npm test -- --ci --coverage --watchAll=false',
        'lint:ci': 'npm run lint -- --max-warnings 0',
      };

      let scriptsAdded = 0;
      for (const [script, command] of Object.entries(ciScripts)) {
        if (!packageJson.scripts[script]) {
          packageJson.scripts[script] = command;
          scriptsAdded++;
        }
      }

      if (scriptsAdded > 0) {
        fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
        this.improvements.push(`Added ${scriptsAdded} CI-optimized scripts to package.json`);
        this.filesChanged.push('package.json');
      }
    } catch (err) {
      this.log(`Package.json CI scripts update failed: ${err.message}`);
    }

    // 3. Create/update .gitignore for CI artifacts
    try {
      const gitignorePath = path.join(process.cwd(), '.gitignore');
      let gitignore = '';

      if (fs.existsSync(gitignorePath)) {
        gitignore = fs.readFileSync(gitignorePath, 'utf8');
      }

      const ciIgnoreEntries = [
        '# CI/CD artifacts',
        'coverage/',
        'test-results/',
        'playwright-report/',
        '.nyc_output/',
        '*.lcov',
        'junit.xml',
      ];

      let entriesAdded = 0;
      ciIgnoreEntries.forEach(entry => {
        if (!gitignore.includes(entry)) {
          gitignore += `\n${entry}`;
          entriesAdded++;
        }
      });

      if (entriesAdded > 0) {
        fs.writeFileSync(gitignorePath, gitignore);
        this.improvements.push(`Added ${entriesAdded} CI artifact entries to .gitignore`);
        this.filesChanged.push('.gitignore');
      }
    } catch (err) {
      this.log(`Gitignore update failed: ${err.message}`);
    }

    // 4. Check for security vulnerabilities
    try {
      execSync('npm audit --audit-level=moderate', {
        stdio: 'pipe',
        cwd: process.cwd(),
      });
      this.improvements.push('No moderate or high security vulnerabilities found');
      this.metrics.securityVulnerabilities = 0;
    } catch (err) {
      const vulnerabilities = (err.stdout.toString().match(/found \d+ vulnerabilities/g) || [])
        .length;
      this.metrics.securityVulnerabilities = vulnerabilities;
      this.improvements.push(`Found security vulnerabilities - run 'npm audit fix'`);
    }

    // 5. Validate build process
    try {
      execSync('npm run build', {
        stdio: 'pipe',
        cwd: process.cwd(),
        timeout: 120000, // 2 minutes max
      });
      this.improvements.push('Build process validated successfully');
      this.metrics.buildSuccessful = true;
    } catch (err) {
      this.improvements.push('Build process needs attention - check npm run build');
      this.metrics.buildSuccessful = false;
    }

    // 6. Check for environment configuration
    try {
      const envExample = fs.existsSync(path.join(process.cwd(), 'env.example'));
      const envLocal = fs.existsSync(path.join(process.cwd(), '.env.local'));
      const envProduction = fs.existsSync(path.join(process.cwd(), '.env.production'));

      this.metrics.envConfig = {
        hasExample: envExample,
        hasLocal: envLocal,
        hasProduction: envProduction,
      };

      if (envExample) {
        this.improvements.push('Environment configuration example found');
      } else {
        this.improvements.push('Consider adding env.example for environment setup');
      }
    } catch (err) {
      this.log(`Environment config check failed: ${err.message}`);
    }

    const duration = Date.now() - this.startTime;
    this.metrics.duration = duration;

    this.log(`✅ CI/CD optimization completed in ${duration}ms`);

    const results = {
      agent: 'ci-cd',
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
  const agent = new CICDAgent();
  agent.run().catch(error => {
    console.error(
      JSON.stringify({
        agent: 'ci-cd',
        status: 'failed',
        error: error.message,
      })
    );
    process.exit(1);
  });
}

module.exports = CICDAgent;
