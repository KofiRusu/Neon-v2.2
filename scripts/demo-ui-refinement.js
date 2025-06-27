#!/usr/bin/env node

const { UIRefinementAgent } = require('../packages/core-agents/src/agents/ui-refinement-agent');
const path = require('path');

async function demonstrateUIRefinement() {
  console.log('🎨 UIRefinementAgent Demonstration');
  console.log('==================================\n');

  // Create agent instance
  const agent = new UIRefinementAgent('demo-ui-agent', 'Demo UI Refinement Agent');

  console.log(`✅ Agent initialized: ${agent.name}`);
  console.log(`📋 Capabilities: ${agent.capabilities.join(', ')}\n`);

  const targetDir = 'apps/dashboard/src/app/social';

  console.log('🔍 Running contrast analysis on the social page...');
  console.log(`📁 Target directory: ${targetDir}\n`);

  try {
    // 1. Check for contrast issues
    const contrastResult = await agent.execute({
      task: 'check_contrast',
      context: { targetDir },
      priority: 'high',
    });

    if (contrastResult.success && contrastResult.data.issues.length > 0) {
      console.log(`⚠️  Found ${contrastResult.data.issues.length} contrast issues:`);
      contrastResult.data.issues.forEach((issue, index) => {
        console.log(`  ${index + 1}. ${issue.description}`);
        console.log(`     📍 ${issue.file}:${issue.line}`);
        console.log(`     🔧 Suggested fix: ${issue.suggestedValue.substring(0, 100)}...`);
        console.log('');
      });
    } else {
      console.log('✅ No contrast issues found!\n');
    }

    // 2. Check accessibility issues
    console.log('♿ Checking accessibility...');
    const accessibilityResult = await agent.execute({
      task: 'validate_accessibility',
      context: { targetDir },
      priority: 'high',
    });

    if (accessibilityResult.success && accessibilityResult.data.issues.length > 0) {
      console.log(`⚠️  Found ${accessibilityResult.data.issues.length} accessibility issues:`);
      accessibilityResult.data.issues.slice(0, 5).forEach((issue, index) => {
        console.log(`  ${index + 1}. ${issue.description}`);
        console.log(`     📍 ${issue.file}:${issue.line}`);
      });
      if (accessibilityResult.data.issues.length > 5) {
        console.log(`     ... and ${accessibilityResult.data.issues.length - 5} more`);
      }
      console.log('');
    } else {
      console.log('✅ No accessibility issues found!\n');
    }

    // 3. Check theme consistency
    console.log('🎨 Checking theme consistency...');
    const themeResult = await agent.execute({
      task: 'fix_theme_consistency',
      context: { targetDir },
      priority: 'medium',
    });

    if (themeResult.success && themeResult.data.fixedIssues.length > 0) {
      console.log(`✨ Fixed ${themeResult.data.fixedIssues.length} theme consistency issues:`);
      themeResult.data.fixedIssues.slice(0, 3).forEach((fix, index) => {
        console.log(`  ${index + 1}. ${fix.description}`);
      });
      console.log('');
    } else {
      console.log('✅ Theme consistency looks good!\n');
    }

    // 4. Auto-fix demonstration (read-only for demo)
    console.log('🔧 Demonstrating auto-fix capabilities...');
    const autoFixResult = await agent.execute({
      task: 'auto_fix_ui_issues',
      context: { targetDir, autoFix: false }, // Set to false for demo
      priority: 'high',
    });

    if (autoFixResult.success) {
      const totalIssues = autoFixResult.data.issues.length;
      const fixableIssues = autoFixResult.data.fixedIssues.length;

      console.log(`📊 Analysis Summary:`);
      console.log(`   • Total issues found: ${totalIssues}`);
      console.log(`   • Issues that can be auto-fixed: ${fixableIssues}`);
      console.log(`   • Manual review needed: ${totalIssues - fixableIssues}`);
      console.log('');

      if (totalIssues > 0) {
        console.log('📋 Issue Breakdown:');
        const issueTypes = {};
        autoFixResult.data.issues.forEach(issue => {
          issueTypes[issue.type] = (issueTypes[issue.type] || 0) + 1;
        });

        Object.entries(issueTypes).forEach(([type, count]) => {
          console.log(`   • ${type}: ${count} issues`);
        });
        console.log('');
      }
    }

    // 5. Show agent status
    const status = await agent.getStatus();
    console.log('📈 Agent Status:');
    console.log(`   • Status: ${status.status}`);
    console.log(`   • Last execution: ${status.lastExecution?.toISOString()}`);
    console.log(`   • Performance: ${status.performance}ms`);

    console.log('\n🎉 UIRefinementAgent demonstration completed!');
    console.log('\nTo enable automatic fixes, set the autoFix flag to true.');
    console.log('The agent can also be integrated into your development workflow');
    console.log('to automatically detect and fix UI issues during development.');
  } catch (error) {
    console.error('❌ Demonstration failed:', error.message);
    console.error(error.stack);
  }
}

// Usage examples
console.log('\n💡 Usage Examples:');
console.log('==================');
console.log('');
console.log('1. Watch mode (automatically fixes issues):');
console.log('   node scripts/agents/ui-refinement-agent.js --auto-fix --watch');
console.log('');
console.log('2. One-time analysis:');
console.log('   node scripts/agents/ui-refinement-agent.js --once');
console.log('');
console.log('3. Analysis with auto-commit:');
console.log(
  '   UI_AUTO_FIX=true UI_AUTO_COMMIT=true node scripts/agents/ui-refinement-agent.js --once'
);
console.log('');

// Run demonstration if this script is executed directly
if (require.main === module) {
  demonstrateUIRefinement().catch(console.error);
}

module.exports = { demonstrateUIRefinement };
