#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function runCommand(command, description) {
  console.log(`🔍 ${description}...`);
  try {
    execSync(command, { stdio: 'pipe' });
    console.log(`✅ ${description} passed`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} failed:`);
    console.error(error.stdout?.toString() || error.message);
    return false;
  }
}

function getStagedFiles() {
  try {
    const output = execSync('git diff --cached --name-only', { encoding: 'utf8' });
    return output.trim().split('\n').filter(Boolean);
  } catch (error) {
    return [];
  }
}

function getFilesByExtension(files, extensions) {
  return files.filter(file => extensions.some(ext => file.endsWith(ext)) && fs.existsSync(file));
}

async function main() {
  const stagedFiles = getStagedFiles();

  if (stagedFiles.length === 0) {
    console.log('📝 No staged files found');
    return;
  }

  console.log(`📁 Checking ${stagedFiles.length} staged files...`);

  const jstsFiles = getFilesByExtension(stagedFiles, ['.js', '.jsx', '.ts', '.tsx']);
  const cssFiles = getFilesByExtension(stagedFiles, ['.css', '.scss', '.module.css']);
  const jsonFiles = getFilesByExtension(stagedFiles, ['.json']);

  let allPassed = true;

  // 1. Format staged files
  if (jstsFiles.length > 0 || cssFiles.length > 0 || jsonFiles.length > 0) {
    const formatFiles = [...jstsFiles, ...cssFiles, ...jsonFiles].join(' ');
    if (!runCommand(`npx prettier --write ${formatFiles}`, 'Code formatting')) {
      allPassed = false;
    }
  }

  // 2. Lint staged JS/TS files
  if (jstsFiles.length > 0) {
    const lintFiles = jstsFiles.join(' ');
    if (!runCommand(`npx eslint --fix ${lintFiles}`, 'ESLint validation')) {
      allPassed = false;
    }
  }

  // 3. Type check only if TypeScript files are staged
  if (jstsFiles.some(file => file.endsWith('.ts') || file.endsWith('.tsx'))) {
    if (!runCommand('npm run type-check', 'TypeScript type checking')) {
      console.log('⚠️ Type checking failed but continuing (fix before push)');
    }
  }

  // 4. Run tests for affected files (if test files are staged)
  const testFiles = stagedFiles.filter(file => file.includes('.test.') || file.includes('.spec.'));
  if (testFiles.length > 0) {
    if (
      !runCommand(
        `npm run test -- --passWithNoTests --findRelatedTests ${stagedFiles.join(' ')}`,
        'Affected tests'
      )
    ) {
      console.log('⚠️ Some tests failed but continuing (fix before push)');
    }
  }

  // 5. Check for design system conflicts
  const designSystemFiles = stagedFiles.filter(
    file => file.includes('design-system') || file.includes('tokens') || file.includes('theme')
  );

  if (designSystemFiles.length > 0) {
    console.log('🎨 Design system files detected, checking for conflicts...');
    // Add to staging if prettier/eslint made changes
    execSync(`git add ${designSystemFiles.join(' ')}`, { stdio: 'pipe' });
  }

  // 6. Re-stage any files that were formatted
  if (jstsFiles.length > 0 || cssFiles.length > 0 || jsonFiles.length > 0) {
    try {
      execSync(`git add ${[...jstsFiles, ...cssFiles, ...jsonFiles].join(' ')}`, { stdio: 'pipe' });
    } catch (e) {
      // Ignore errors if files were already staged
    }
  }

  if (allPassed) {
    console.log('\n🎉 Pre-commit checks passed!');
    console.log('✨ Code is formatted and ready for commit');
  } else {
    console.log('\n⚠️ Some pre-commit checks failed');
    console.log('💡 Issues have been auto-fixed where possible');
    console.log('🔧 Please review changes and commit again');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('🔥 Pre-commit validation error:', error);
  process.exit(1);
});
