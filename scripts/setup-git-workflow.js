#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up NeonHub Git Workflow...');
console.log('=====================================');

function runCommand(command, description) {
  console.log(`🔧 ${description}...`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} completed`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    return false;
  }
}

function createFile(filepath, content, description) {
  console.log(`📝 ${description}...`);
  try {
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filepath, content);
    console.log(`✅ ${description} completed`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    return false;
  }
}

function makeExecutable(filepath) {
  try {
    fs.chmodSync(filepath, '755');
    return true;
  } catch (error) {
    console.error(`❌ Failed to make ${filepath} executable:`, error.message);
    return false;
  }
}

async function main() {
  // 1. Enable Husky
  if (!runCommand('npx husky install', 'Installing Husky')) {
    process.exit(1);
  }

  // 2. Enable Git hooks by removing DISABLED file
  const disabledFile = '.husky/DISABLED';
  if (fs.existsSync(disabledFile)) {
    fs.unlinkSync(disabledFile);
    console.log('✅ Enabled Husky hooks');
  }

  // 3. Make hook files executable
  const hooks = ['.husky/pre-commit', '.husky/commit-msg', '.husky/pre-push'];
  hooks.forEach(hook => {
    if (fs.existsSync(hook)) {
      makeExecutable(hook);
    }
  });

  // 4. Make scripts executable
  const scripts = [
    'scripts/pre-commit-checks.js',
    'scripts/validate-commit-msg.js',
    'scripts/git-validate.js',
  ];
  scripts.forEach(script => {
    if (fs.existsSync(script)) {
      makeExecutable(script);
    }
  });

  // 5. Add additional npm scripts
  console.log('📦 Adding npm scripts...');
  const packageJsonPath = 'package.json';
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    const newScripts = {
      'git:setup': 'node scripts/setup-git-workflow.js',
      'git:validate': 'node scripts/git-validate.js',
      'test:a11y': 'echo "⚠️ Accessibility tests not configured yet"',
      'test:visual': 'echo "⚠️ Visual regression tests not configured yet"',
      'test:agent-integration': 'echo "⚠️ Agent integration tests not configured yet"',
      'storybook:build': 'echo "⚠️ Storybook not configured yet"',
      lighthouse: 'echo "⚠️ Lighthouse not configured yet"',
      'deploy:staging': 'echo "⚠️ Staging deployment not configured yet"',
      'deploy:production': 'echo "⚠️ Production deployment not configured yet"',
      'workspace:validate': 'npm ls --workspaces',
      'debug:agents': 'echo "🤖 Agent debugging not configured yet"',
      'analyze:bundle': 'echo "📊 Bundle analysis not configured yet"',
      'tokens:migrate': 'echo "🎨 Token migration not configured yet"',
    };

    // Add scripts that don't exist
    Object.entries(newScripts).forEach(([script, command]) => {
      if (!packageJson.scripts[script]) {
        packageJson.scripts[script] = command;
      }
    });

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('✅ Added npm scripts');
  }

  // 6. Create CODEOWNERS file
  const codeownersContent = `# NeonHub Code Owners

# Global ownership
* @KofiRusu

# Frontend & UI/UX
apps/dashboard/ @frontend-team @design-team
*.css @frontend-team @design-team
*.scss @frontend-team @design-team
components/ @frontend-team @design-team
packages/design-system/ @design-team

# Agent Integration
*agent* @agent-team @frontend-team
*Agent* @agent-team @frontend-team

# CI/CD & Infrastructure
.github/ @devops-team @KofiRusu
docker/ @devops-team
scripts/ @devops-team
*.yml @devops-team
*.yaml @devops-team

# Documentation
docs/ @docs-team @KofiRusu
*.md @docs-team

# Configuration
package.json @KofiRusu @devops-team
tsconfig.json @frontend-team @KofiRusu
.env* @devops-team @KofiRusu
`;

  createFile('.github/CODEOWNERS', codeownersContent, 'Creating CODEOWNERS file');

  // 7. Create commit message template
  const commitTemplate = `
# <type>(<scope>): <subject>
#
# <body>
#
# <footer>

# --- CONVENTIONAL COMMIT TYPES ---
# feat:     New feature
# fix:      Bug fix
# ui:       UI/UX changes
# agent:    Agent-related changes
# style:    Code style changes
# refactor: Code refactoring
# test:     Test additions/changes
# docs:     Documentation
# build:    Build system changes
# ci:       CI/CD changes
# chore:    Maintenance tasks

# --- COMMON SCOPES ---
# ui, agent-ui, design-system, dashboard, auth, mobile
# content, trend, support, metric, seo, email, social
# api, database, config, deps, security

# --- EXAMPLES ---
# feat(ui): add glassmorphism effect to neon cards
# fix(agent-ui): resolve TrendAgent chart rendering issue
# ui(dashboard): implement animated campaign metrics
# agent(content): sync UI with ContentAgent API
# style(design-system): update neon-blue color tokens
`;

  createFile('.gitmessage', commitTemplate, 'Creating commit message template');

  // 8. Configure git to use the template
  runCommand('git config commit.template .gitmessage', 'Setting git commit template');

  // 9. Validate setup
  console.log('\n🔍 Validating setup...');
  const validations = [
    { check: () => fs.existsSync('.husky/pre-commit'), name: 'Pre-commit hook' },
    { check: () => fs.existsSync('.husky/commit-msg'), name: 'Commit-msg hook' },
    { check: () => fs.existsSync('.husky/pre-push'), name: 'Pre-push hook' },
    { check: () => fs.existsSync('scripts/pre-commit-checks.js'), name: 'Pre-commit script' },
    {
      check: () => fs.existsSync('scripts/validate-commit-msg.js'),
      name: 'Commit validation script',
    },
    { check: () => fs.existsSync('.github/pull_request_template.md'), name: 'PR template' },
    { check: () => fs.existsSync('.github/CODEOWNERS'), name: 'Code owners' },
    { check: () => fs.existsSync('docs/git-workflow.md'), name: 'Workflow documentation' },
  ];

  let allValid = true;
  validations.forEach(({ check, name }) => {
    if (check()) {
      console.log(`✅ ${name}`);
    } else {
      console.log(`❌ ${name}`);
      allValid = false;
    }
  });

  if (allValid) {
    console.log('\n🎉 Git workflow setup completed successfully!');
    console.log('\n📚 Next steps:');
    console.log('1. Read the workflow documentation: docs/git-workflow.md');
    console.log('2. Test the hooks: git add . && git commit -m "test: validate git workflow"');
    console.log('3. Create your first feature branch: git checkout -b ui/test-feature');
    console.log('4. Configure branch protection rules on GitHub');
    console.log('5. Set up Vercel integration for preview deployments');
    console.log('\n✨ Happy coding with NeonHub Git Workflow!');
  } else {
    console.log(
      '\n⚠️ Setup completed with some issues. Please check the validation results above.'
    );
    process.exit(1);
  }
}

main().catch(error => {
  console.error('🔥 Setup failed:', error);
  process.exit(1);
});
