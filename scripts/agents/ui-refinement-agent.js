#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

/**
 * UI Refinement Agent - Automated UI consistency and accessibility improvements
 */

function showHelp() {
  console.log(`
🎨 UI Refinement Agent

USAGE:
  node scripts/agents/ui-refinement-agent.js [command] [options]

COMMANDS:
  check-contrast        Analyze contrast issues
  fix-contrast         Auto-fix contrast problems  
  check-accessibility  Validate accessibility
  audit-full          Run complete UI audit

OPTIONS:
  --target-dir <path>  Target directory (default: apps/dashboard/src)
  --auto-fix          Enable automatic fixes
  --help, -h          Show this help

EXAMPLES:
  node scripts/agents/ui-refinement-agent.js check-contrast
  node scripts/agents/ui-refinement-agent.js audit-full --auto-fix
  `);
}

async function checkContrast(options = {}) {
  const { targetDir = 'apps/dashboard/src' } = options;

  console.log('🔍 Analyzing contrast ratios...');

  try {
    const files = await findTSXFiles(targetDir);
    const issues = [];

    for (const file of files) {
      const content = await fs.readFile(file, 'utf-8');
      const fileIssues = analyzeContrastInFile(file, content);
      issues.push(...fileIssues);
    }

    displayContrastResults(issues);
  } catch {
    console.log('❌ Error analyzing contrast');
  }
}

async function fixContrast(options = {}) {
  const { targetDir = 'apps/dashboard/src', autoFix = false } = options;

  console.log('🔧 Fixing contrast issues...');

  const files = await findTSXFiles(targetDir);
  const fixedFiles = [];

  for (const file of files) {
    try {
      const content = await fs.readFile(file, 'utf-8');
      const issues = analyzeContrastInFile(file, content);

      if (issues.length > 0) {
        const fixedContent = applyContrastFixes(content, issues);

        if (autoFix) {
          await fs.writeFile(file, fixedContent);
          fixedFiles.push(file);
        } else {
          console.log(`Would fix ${issues.length} issues in ${file}`);
        }
      }
    } catch {
      console.log(`❌ Error processing ${file}`);
    }
  }

  if (autoFix && fixedFiles.length > 0) {
    console.log(`✅ Fixed contrast issues in ${fixedFiles.length} files`);
  }
}

async function checkAccessibility(options = {}) {
  const { targetDir = 'apps/dashboard/src' } = options;

  console.log('♿ Checking accessibility compliance...');

  const files = await findTSXFiles(targetDir);
  const allIssues = [];

  for (const file of files) {
    try {
      const content = await fs.readFile(file, 'utf-8');
      const issues = analyzeAccessibilityInFile(file, content);
      allIssues.push(...issues);
    } catch {
      console.log(`❌ Error checking ${file}`);
    }
  }

  displayAccessibilityResults(allIssues);
}

async function auditFull(options = {}) {
  console.log('🔍 Running comprehensive UI audit...\n');

  await checkContrast(options);
  console.log('');
  await checkAccessibility(options);

  console.log('\n✅ Full UI audit completed');
}

function analyzeContrastInFile(file, content) {
  const issues = [];
  const lines = content.split('\n');

  const contrastProblems = {
    'bg-neutral-900': ['text-neutral-700', 'text-neutral-600', 'text-neutral-500'],
    'bg-neutral-800': ['text-neutral-600', 'text-neutral-500'],
    'bg-blue-900': ['text-blue-700', 'text-blue-600'],
    'bg-purple-900': ['text-purple-700', 'text-purple-600'],
  };

  lines.forEach((line, index) => {
    Object.entries(contrastProblems).forEach(([bg, problematicTexts]) => {
      if (line.includes(bg)) {
        problematicTexts.forEach(text => {
          if (line.includes(text)) {
            issues.push({
              file,
              line: index + 1,
              type: 'contrast',
              description: `Poor contrast: ${text} on ${bg}`,
              severity: 'high',
              current: `${bg} ${text}`,
              suggested: `${bg} ${getContrastFix(bg, text)}`,
            });
          }
        });
      }
    });
  });

  return issues;
}

function analyzeAccessibilityInFile(file, content) {
  const issues = [];
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    // Missing alt attributes
    if (line.includes('<img') && !line.includes('alt=')) {
      issues.push({
        file,
        line: index + 1,
        type: 'accessibility',
        description: 'Image missing alt attribute',
        severity: 'high',
      });
    }

    // Buttons without labels
    if (line.includes('<button') && !line.includes('aria-label') && !line.includes('>')) {
      issues.push({
        file,
        line: index + 1,
        type: 'accessibility',
        description: 'Button may need aria-label',
        severity: 'medium',
      });
    }

    // Form inputs without labels
    if (line.includes('<input') && !line.includes('aria-label') && !line.includes('placeholder')) {
      issues.push({
        file,
        line: index + 1,
        type: 'accessibility',
        description: 'Input needs label or placeholder',
        severity: 'medium',
      });
    }
  });

  return issues;
}

function applyContrastFixes(content, issues) {
  let fixedContent = content;

  issues.forEach(issue => {
    if (issue.type === 'contrast' && issue.current && issue.suggested) {
      fixedContent = fixedContent.replace(issue.current, issue.suggested);
    }
  });

  return fixedContent;
}

function displayContrastResults(issues) {
  if (issues.length === 0) {
    console.log('✅ No contrast issues found');
    return;
  }

  console.log(`⚠️  Found ${issues.length} contrast issues:\n`);

  issues.forEach(issue => {
    console.log(`● ${issue.file}:${issue.line}`);
    console.log(`  ${issue.description}`);
    console.log(`  Current: ${issue.current}`);
    console.log(`  Suggested: ${issue.suggested}\n`);
  });
}

function displayAccessibilityResults(issues) {
  if (issues.length === 0) {
    console.log('✅ No accessibility issues found');
    return;
  }

  console.log(`⚠️  Found ${issues.length} accessibility issues:\n`);

  issues.forEach(issue => {
    console.log(`● ${issue.file}:${issue.line}`);
    console.log(`  ${issue.description}\n`);
  });
}

async function findTSXFiles(dir) {
  const files = [];

  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        const subFiles = await findTSXFiles(fullPath);
        files.push(...subFiles);
      } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) {
        files.push(fullPath);
      }
    }
  } catch {
    // Directory might not exist, skip silently
  }

  return files;
}

function getContrastFix(bg, text) {
  const fixes = {
    'bg-neutral-900': {
      'text-neutral-700': 'text-neutral-100',
      'text-neutral-600': 'text-neutral-100',
      'text-neutral-500': 'text-neutral-200',
    },
    'bg-neutral-800': {
      'text-neutral-600': 'text-neutral-100',
      'text-neutral-500': 'text-neutral-200',
    },
    'bg-blue-900': {
      'text-blue-700': 'text-blue-100',
      'text-blue-600': 'text-blue-100',
    },
    'bg-purple-900': {
      'text-purple-700': 'text-purple-100',
      'text-purple-600': 'text-purple-100',
    },
  };

  return fixes[bg]?.[text] || text;
}

function parseArgs() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';
  const options = {};

  for (let i = 1; i < args.length; i += 2) {
    const flag = args[i];
    const value = args[i + 1];

    switch (flag) {
      case '--target-dir':
        options.targetDir = value;
        break;
      case '--auto-fix':
        options.autoFix = true;
        i--; // No value for this flag
        break;
    }
  }

  return { command, options };
}

async function main() {
  const { command, options } = parseArgs();

  switch (command) {
    case 'check-contrast':
      await checkContrast(options);
      break;
    case 'fix-contrast':
      await fixContrast(options);
      break;
    case 'check-accessibility':
      await checkAccessibility(options);
      break;
    case 'audit-full':
      await auditFull(options);
      break;
    case 'help':
    default:
      showHelp();
      break;
  }
}

if (require.main === module) {
  main().catch(() => {
    console.log('❌ Unexpected error occurred');
    process.exit(1);
  });
}
