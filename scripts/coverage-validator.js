#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const COVERAGE_THRESHOLDS = {
  statements: 85,
  branches: 80,
  functions: 85,
  lines: 85,
};

const AGENT_THRESHOLDS = {
  statements: 90,
  branches: 85,
  functions: 90,
  lines: 90,
};

function parseCoverageReport() {
  const coveragePath = path.join(process.cwd(), 'coverage', 'coverage-summary.json');

  if (!fs.existsSync(coveragePath)) {
    console.error('❌ Coverage report not found. Run "npm run test:coverage" first.');
    process.exit(1);
  }

  try {
    return JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
  } catch (error) {
    console.error(`❌ Could not parse coverage report: ${error.message}`);
    process.exit(1);
  }
}

function validateGlobalCoverage(coverageData) {
  const { total } = coverageData;
  const violations = [];

  Object.entries(COVERAGE_THRESHOLDS).forEach(([metric, threshold]) => {
    const actual = total[metric]?.pct || 0;
    if (actual < threshold) {
      violations.push({
        metric,
        actual,
        required: threshold,
        deficit: threshold - actual,
      });
    }
  });

  return violations;
}

function validateAgentCoverage(coverageData) {
  const agentViolations = [];

  Object.entries(coverageData).forEach(([filePath, data]) => {
    if (filePath.includes('packages/core-agents/src/agents/') && filePath !== 'total') {
      Object.entries(AGENT_THRESHOLDS).forEach(([metric, threshold]) => {
        const actual = data[metric]?.pct || 0;
        if (actual < threshold) {
          agentViolations.push({
            file: filePath,
            metric,
            actual,
            required: threshold,
            deficit: threshold - actual,
          });
        }
      });
    }
  });

  return agentViolations;
}

function generateCoverageReport(coverageData, globalViolations, agentViolations) {
  const { total } = coverageData;

  console.log('\n📊 NeonHub Coverage Analysis Report');
  console.log('=====================================');

  // Global coverage summary
  console.log('\n🌍 Global Coverage:');
  console.log(
    `   Statements: ${total.statements.pct}% (Required: ${COVERAGE_THRESHOLDS.statements}%)`
  );
  console.log(`   Branches:   ${total.branches.pct}% (Required: ${COVERAGE_THRESHOLDS.branches}%)`);
  console.log(
    `   Functions:  ${total.functions.pct}% (Required: ${COVERAGE_THRESHOLDS.functions}%)`
  );
  console.log(`   Lines:      ${total.lines.pct}% (Required: ${COVERAGE_THRESHOLDS.lines}%)`);

  // Global violations
  if (globalViolations.length > 0) {
    console.log('\n❌ Global Coverage Violations:');
    globalViolations.forEach(v => {
      console.log(
        `   • ${v.metric}: ${v.actual}% < ${v.required}% (deficit: ${v.deficit.toFixed(1)}%)`
      );
    });
  } else {
    console.log('\n✅ Global coverage thresholds met!');
  }

  // Agent-specific violations
  if (agentViolations.length > 0) {
    console.log('\n🤖 Agent Coverage Violations (Higher Standards):');
    const violationsByFile = {};
    agentViolations.forEach(v => {
      if (!violationsByFile[v.file]) violationsByFile[v.file] = [];
      violationsByFile[v.file].push(v);
    });

    Object.entries(violationsByFile).forEach(([file, violations]) => {
      console.log(`   📁 ${file.replace(process.cwd(), '.')}`);
      violations.forEach(v => {
        console.log(
          `      • ${v.metric}: ${v.actual}% < ${v.required}% (deficit: ${v.deficit.toFixed(1)}%)`
        );
      });
    });
  } else {
    console.log('\n✅ Agent coverage standards met!');
  }

  // Coverage improvement suggestions
  console.log('\n💡 Coverage Improvement Tips:');
  console.log('   • Add unit tests for uncovered functions');
  console.log('   • Test edge cases and error conditions');
  console.log('   • Mock external dependencies properly');
  console.log('   • Add integration tests for agent workflows');

  return globalViolations.length === 0 && agentViolations.length === 0;
}

function main() {
  console.log('🔍 Validating test coverage thresholds...');

  const coverageData = parseCoverageReport();
  const globalViolations = validateGlobalCoverage(coverageData);
  const agentViolations = validateAgentCoverage(coverageData);

  const passed = generateCoverageReport(coverageData, globalViolations, agentViolations);

  if (passed) {
    console.log('\n🎉 All coverage thresholds met!');
    console.log('✅ Code quality standards satisfied');
    process.exit(0);
  } else {
    console.log('\n🚫 Coverage thresholds not met');
    console.log('💪 Write more tests to improve coverage');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  COVERAGE_THRESHOLDS,
  AGENT_THRESHOLDS,
  parseCoverageReport,
  validateGlobalCoverage,
  validateAgentCoverage,
};
