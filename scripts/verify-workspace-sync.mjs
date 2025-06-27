#!/usr/bin/env node

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');

console.log('🔍 WORKSPACE SYNCHRONIZATION VERIFICATION');
console.log('==========================================\n');

class WorkspaceSyncVerifier {
  constructor() {
    this.results = [];
    this.hasErrors = false;
  }

  /**
   * Discover workspaces from root package.json
   */
  async discoverWorkspaces() {
    console.log('📦 Discovering workspaces...');
    try {
      const rootPackageJson = JSON.parse(readFileSync(join(ROOT_DIR, 'package.json'), 'utf8'));
      const workspacesPatterns = rootPackageJson.workspaces || [];
      
      const workspaces = [];
      for (const pattern of workspacesPatterns) {
        if (pattern.includes('*')) {
          // Handle glob patterns like "apps/*", "packages/*"
          const baseDir = pattern.replace('/*', '');
          const basePath = join(ROOT_DIR, baseDir);
          
          if (existsSync(basePath)) {
            const dirs = readdirSync(basePath).filter(dir => {
              const dirPath = join(basePath, dir);
              return statSync(dirPath).isDirectory() && existsSync(join(dirPath, 'package.json'));
            });
            
            dirs.forEach(dir => {
              workspaces.push({
                name: dir,
                path: join(baseDir, dir),
                fullPath: join(ROOT_DIR, baseDir, dir)
              });
            });
          }
        } else {
          // Handle direct paths
          const fullPath = join(ROOT_DIR, pattern);
          if (existsSync(join(fullPath, 'package.json'))) {
            workspaces.push({
              name: pattern.split('/').pop(),
              path: pattern,
              fullPath
            });
          }
        }
      }
      
      console.log(`   Found ${workspaces.length} workspaces: ${workspaces.map(w => w.name).join(', ')}\n`);
      return workspaces;
    } catch (error) {
      console.error('❌ Failed to discover workspaces:', error.message);
      throw error;
    }
  }

  /**
   * Execute a git command in a specific directory
   */
  execGitCommand(workspacePath, command, options = {}) {
    try {
      return execSync(`git -C "${workspacePath}" ${command}`, {
        encoding: 'utf8',
        stdio: 'pipe',
        ...options
      }).trim();
    } catch (error) {
      if (options.allowFailure) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Verify a single workspace
   */
  async verifyWorkspace(workspace) {
    console.log(`🔍 Verifying ${workspace.name}...`);
    
    const result = {
      workspace: workspace.name,
      path: workspace.path,
      checks: {
        repositoryField: { status: 'unknown', message: '' },
        remoteUrl: { status: 'unknown', message: '' },
        gitStatus: { status: 'unknown', message: '' },
        unpushedCommits: { status: 'unknown', message: '' }
      },
      success: true,
      errors: []
    };

    try {
      // 1. Check if workspace has a repository field in package.json
      const packageJsonPath = join(workspace.fullPath, 'package.json');
      if (!existsSync(packageJsonPath)) {
        result.checks.repositoryField.status = 'error';
        result.checks.repositoryField.message = 'package.json not found';
        result.success = false;
        result.errors.push('package.json not found');
      } else {
        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
        const repositoryField = packageJson.repository;

        if (!repositoryField) {
          result.checks.repositoryField.status = 'error';
          result.checks.repositoryField.message = 'repository field missing in package.json';
          result.success = false;
          result.errors.push('repository field missing in package.json');
        } else {
          result.checks.repositoryField.status = 'success';
          result.checks.repositoryField.message = `Found: ${repositoryField.url || repositoryField}`;

          // 2. Check git remote URL matches repository field
          try {
            const remoteUrl = this.execGitCommand(workspace.fullPath, 'remote get-url origin');
            const expectedPattern = /git@github\.com:KofiRusu\/.*\.git/;
            const repositoryUrl = repositoryField.url || repositoryField;

            if (remoteUrl === repositoryUrl) {
              result.checks.remoteUrl.status = 'success';
              result.checks.remoteUrl.message = `Remote matches: ${remoteUrl}`;
            } else if (expectedPattern.test(remoteUrl)) {
              result.checks.remoteUrl.status = 'warning';
              result.checks.remoteUrl.message = `Remote URL pattern correct but doesn't match package.json: ${remoteUrl} vs ${repositoryUrl}`;
            } else {
              result.checks.remoteUrl.status = 'error';
              result.checks.remoteUrl.message = `Remote URL doesn't match expected pattern: ${remoteUrl}`;
              result.success = false;
              result.errors.push(`Remote URL mismatch: expected pattern git@github.com:KofiRusu/*.git, got ${remoteUrl}`);
            }
          } catch (error) {
            result.checks.remoteUrl.status = 'error';
            result.checks.remoteUrl.message = `Failed to get remote URL: ${error.message}`;
            result.success = false;
            result.errors.push(`Failed to get remote URL: ${error.message}`);
          }
        }
      }

      // 3. Check git status is clean
      try {
        const gitStatus = this.execGitCommand(workspace.fullPath, 'status --porcelain');
        if (gitStatus === '') {
          result.checks.gitStatus.status = 'success';
          result.checks.gitStatus.message = 'Working directory clean';
        } else {
          result.checks.gitStatus.status = 'error';
          result.checks.gitStatus.message = `Uncommitted changes found:\n${gitStatus}`;
          result.success = false;
          result.errors.push(`Workspace has uncommitted changes`);
        }
      } catch (error) {
        result.checks.gitStatus.status = 'error';
        result.checks.gitStatus.message = `Failed to check git status: ${error.message}`;
        result.success = false;
        result.errors.push(`Failed to check git status: ${error.message}`);
      }

      // 4. Check for unpushed commits
      try {
        const unpushedCommits = this.execGitCommand(workspace.fullPath, 'log --oneline origin/main..HEAD', { allowFailure: true });
        if (unpushedCommits === null || unpushedCommits === '') {
          result.checks.unpushedCommits.status = 'success';
          result.checks.unpushedCommits.message = 'All commits pushed';
        } else {
          result.checks.unpushedCommits.status = 'error';
          result.checks.unpushedCommits.message = `Unpushed commits found:\n${unpushedCommits}`;
          result.success = false;
          result.errors.push(`Workspace has unpushed commits`);
        }
      } catch (error) {
        // Try alternative check for unpushed commits
        try {
          const headCommit = this.execGitCommand(workspace.fullPath, 'rev-parse HEAD');
          const originCommit = this.execGitCommand(workspace.fullPath, 'rev-parse origin/main', { allowFailure: true });
          
          if (originCommit && headCommit !== originCommit) {
            result.checks.unpushedCommits.status = 'error';
            result.checks.unpushedCommits.message = 'Local HEAD differs from origin/main';
            result.success = false;
            result.errors.push('Local HEAD differs from origin/main');
          } else {
            result.checks.unpushedCommits.status = 'success';
            result.checks.unpushedCommits.message = 'All commits appear to be pushed';
          }
        } catch (secondError) {
          result.checks.unpushedCommits.status = 'warning';
          result.checks.unpushedCommits.message = `Could not verify push status: ${error.message}`;
        }
      }

    } catch (error) {
      result.success = false;
      result.errors.push(`Unexpected error: ${error.message}`);
    }

    // Print results for this workspace
    if (result.success) {
      console.log(`   ✅ ${workspace.name} - All checks passed`);
    } else {
      console.log(`   ❌ ${workspace.name} - ${result.errors.length} error(s):`);
      result.errors.forEach(error => console.log(`      • ${error}`));
      this.hasErrors = true;
    }

    this.results.push(result);
    return result;
  }

  /**
   * Write JSON report to file
   */
  writeReport() {
    const reportDir = join(ROOT_DIR, 'tmp');
    if (!existsSync(reportDir)) {
      mkdirSync(reportDir, { recursive: true });
    }

    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalWorkspaces: this.results.length,
        successfulWorkspaces: this.results.filter(r => r.success).length,
        failedWorkspaces: this.results.filter(r => !r.success).length,
        hasErrors: this.hasErrors
      },
      workspaces: this.results
    };

    const reportPath = join(reportDir, 'workspace-sync-report.json');
    writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Report written to: ${reportPath}`);
    
    return report;
  }

  /**
   * Print summary
   */
  printSummary() {
    console.log('\n==========================================');
    console.log('📊 WORKSPACE SYNCHRONIZATION SUMMARY');
    console.log('==========================================');
    
    const successful = this.results.filter(r => r.success).length;
    const failed = this.results.filter(r => !r.success).length;
    
    if (this.hasErrors) {
      console.log(`❌ FAILED - ${failed} workspace(s) have issues`);
      console.log(`✅ ${successful} workspace(s) passed all checks`);
      
      console.log('\n🔧 Issues found:');
      this.results.filter(r => !r.success).forEach(result => {
        console.log(`\n   📦 ${result.workspace}:`);
        result.errors.forEach(error => console.log(`      • ${error}`));
      });
    } else {
      console.log(`✅ SUCCESS - All ${successful} workspace(s) are properly synchronized`);
    }
  }

  /**
   * Main verification process
   */
  async run() {
    try {
      const workspaces = await this.discoverWorkspaces();
      
      for (const workspace of workspaces) {
        await this.verifyWorkspace(workspace);
      }
      
      this.writeReport();
      this.printSummary();
      
      if (this.hasErrors) {
        console.log('\n💡 To fix issues:');
        console.log('   1. Add repository fields to package.json files');
        console.log('   2. Commit any uncommitted changes');
        console.log('   3. Push any unpushed commits');
        console.log('   4. Ensure remote URLs match the expected pattern');
        process.exit(1);
      } else {
        console.log('\n🎉 All workspaces are properly synchronized!');
        process.exit(0);
      }
      
    } catch (error) {
      console.error('\n❌ VERIFICATION FAILED:', error.message);
      process.exit(1);
    }
  }
}

// Run the verification
const verifier = new WorkspaceSyncVerifier();
verifier.run().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
}); 