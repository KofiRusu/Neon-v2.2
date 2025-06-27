#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Conventional commit pattern for NeonHub
const COMMIT_PATTERN =
  /^(feat|fix|ui|agent|style|refactor|test|docs|build|ci|chore)(\(.+\))?: .{1,50}/;

// Valid scopes for NeonHub
const VALID_SCOPES = [
  'ui',
  'agent-ui',
  'design-system',
  'dashboard',
  'auth',
  'mobile',
  'content',
  'trend',
  'support',
  'metric',
  'seo',
  'email',
  'social',
  'api',
  'database',
  'config',
  'deps',
  'security',
];

const COMMIT_TYPES = {
  feat: 'New feature',
  fix: 'Bug fix',
  ui: 'UI/UX changes',
  agent: 'Agent-related changes',
  style: 'Code style changes',
  refactor: 'Code refactoring',
  test: 'Test additions/changes',
  docs: 'Documentation',
  build: 'Build system changes',
  ci: 'CI/CD changes',
  chore: 'Maintenance tasks',
};

function validateCommitMessage(message) {
  const errors = [];

  // Check basic format
  if (!COMMIT_PATTERN.test(message)) {
    errors.push('❌ Commit message must follow conventional commit format');
    errors.push('   Format: type(scope): description');
    errors.push('   Example: feat(ui): add neon-glass card component');
    return errors;
  }

  // Extract parts
  const match = message.match(/^(\w+)(\(([^)]+)\))?: (.+)/);
  if (!match) {
    errors.push('❌ Could not parse commit message');
    return errors;
  }

  const [, type, , scope, description] = match;

  // Validate type
  if (!COMMIT_TYPES[type]) {
    errors.push(`❌ Invalid commit type: "${type}"`);
    errors.push(`   Valid types: ${Object.keys(COMMIT_TYPES).join(', ')}`);
  }

  // Validate scope (if provided)
  if (scope && !VALID_SCOPES.includes(scope)) {
    errors.push(`❌ Invalid scope: "${scope}"`);
    errors.push(`   Valid scopes: ${VALID_SCOPES.join(', ')}`);
  }

  // Validate description
  if (description.length < 3) {
    errors.push('❌ Description too short (minimum 3 characters)');
  }

  if (description.length > 50) {
    errors.push('❌ Description too long (maximum 50 characters)');
  }

  if (description.endsWith('.')) {
    errors.push('❌ Description should not end with a period');
  }

  if (description[0] !== description[0].toLowerCase()) {
    errors.push('❌ Description should start with lowercase letter');
  }

  // UI-specific validations
  if (type === 'ui' && !scope) {
    errors.push('⚠️ UI changes should include a scope (ui, dashboard, auth, etc.)');
  }

  if (type === 'agent' && !scope) {
    errors.push('⚠️ Agent changes should include a scope (content, trend, support, etc.)');
  }

  return errors;
}

function printCommitHelp() {
  console.log('\n📝 Conventional Commit Format:');
  console.log('   type(scope): description');
  console.log('');
  console.log('🔧 Types:');
  Object.entries(COMMIT_TYPES).forEach(([type, desc]) => {
    console.log(`   ${type.padEnd(8)} - ${desc}`);
  });
  console.log('');
  console.log('🎯 Common Scopes:');
  console.log('   ui, agent-ui, design-system, dashboard, auth');
  console.log('   content, trend, support, metric, seo, email');
  console.log('');
  console.log('✅ Good Examples:');
  console.log('   feat(ui): add glassmorphism effect to neon cards');
  console.log('   fix(agent-ui): resolve TrendAgent chart rendering issue');
  console.log('   ui(dashboard): implement animated campaign metrics');
  console.log('   agent(content): sync UI with ContentAgent API');
  console.log('   style(design-system): update neon-blue color tokens');
}

function main() {
  const commitMsgFile = process.argv[2];

  if (!commitMsgFile) {
    console.error('❌ No commit message file provided');
    process.exit(1);
  }

  if (!fs.existsSync(commitMsgFile)) {
    console.error(`❌ Commit message file not found: ${commitMsgFile}`);
    process.exit(1);
  }

  const commitMessage = fs.readFileSync(commitMsgFile, 'utf8').trim();

  // Skip merge commits and other special commits
  if (
    commitMessage.startsWith('Merge ') ||
    commitMessage.startsWith('Revert ') ||
    commitMessage.startsWith('fixup!') ||
    commitMessage.startsWith('squash!')
  ) {
    console.log('✅ Special commit detected, skipping validation');
    process.exit(0);
  }

  console.log('🔍 Validating commit message...');
  console.log(`📝 Message: "${commitMessage}"`);

  const errors = validateCommitMessage(commitMessage);

  if (errors.length === 0) {
    console.log('✅ Commit message is valid!');
    process.exit(0);
  } else {
    console.log('\n❌ Commit message validation failed:');
    errors.forEach(error => console.log(`   ${error}`));
    printCommitHelp();
    process.exit(1);
  }
}

main();
