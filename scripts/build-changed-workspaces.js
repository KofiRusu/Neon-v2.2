#!/usr/bin/env node

const { execSync } = require('child_process');

function getChangedFiles() {
  try {
    // Get staged files
    const staged = execSync('git diff --cached --name-only', { encoding: 'utf8' }).trim();
    // Get modified files not yet staged
    const modified = execSync('git diff --name-only', { encoding: 'utf8' }).trim();

    const allFiles = [...new Set([...staged.split('\n'), ...modified.split('\n')])].filter(f => f);
    return allFiles.join('\n');
  } catch {
    return '';
  }
}

function getAffectedWorkspaces(changedFiles) {
  const workspaces = new Set();
  const files = changedFiles.split('\n').filter(f => f);

  console.log(`📁 Analyzing ${files.length} changed files...`);

  files.forEach(file => {
    console.log(`   ${file}`);

    // Dashboard workspace
    if (file.startsWith('apps/dashboard/')) {
      workspaces.add('dashboard');
    }

    // API workspace
    if (file.startsWith('apps/api/')) {
      workspaces.add('api');
    }

    // Package changes affect both apps
    if (file.startsWith('packages/')) {
      workspaces.add('dashboard');
      workspaces.add('api');
    }

    // Root config changes affect all workspaces
    if (file.match(/^(package\.json|tsconfig\.json|jest\.config\.js|\.eslintrc|\.prettierrc)/)) {
      workspaces.add('dashboard');
      workspaces.add('api');
    }
  });

  return [...workspaces];
}

function buildWorkspace(workspace) {
  console.log(`🔨 Building ${workspace}...`);
  try {
    const startTime = Date.now();
    execSync(`npm run build --workspace=apps/${workspace}`, { stdio: 'inherit' });
    const duration = Date.now() - startTime;
    console.log(`✅ ${workspace} built successfully in ${duration}ms`);
    return true;
  } catch (error) {
    console.error(`❌ ${workspace} build failed:`, error.message);
    return false;
  }
}

function main() {
  console.log('🏗️ NeonHub Selective Workspace Builder');
  console.log('======================================');

  const changed = getChangedFiles();

  if (!changed) {
    console.log('✅ No changes detected. Skipping builds.');
    return;
  }

  const workspaces = getAffectedWorkspaces(changed);

  if (workspaces.length === 0) {
    console.log('✅ No workspace builds needed for these changes.');
    return;
  }

  console.log(`🎯 Building affected workspaces: ${workspaces.join(', ')}`);

  let allSuccess = true;
  for (const ws of workspaces) {
    if (!buildWorkspace(ws)) {
      allSuccess = false;
    }
  }

  if (allSuccess) {
    console.log('\n🎉 All workspace builds completed successfully!');
  } else {
    console.log('\n❌ One or more workspace builds failed.');
    process.exit(1);
  }
}

main();
