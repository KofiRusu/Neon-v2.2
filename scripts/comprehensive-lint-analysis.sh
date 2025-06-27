#!/bin/bash

# 🔧 NeonHub Comprehensive Lint-Error Analysis & Report
# Adapted for monorepo workspace structure

set -e

echo "🚀 Starting NeonHub Comprehensive Lint Analysis..."

# 1. Define workspace modules as space-separated pairs
MODULES="neon-api:apps/api neon-dashboard:apps/dashboard neon-core-agents:packages/core-agents neon-data-model:packages/data-model neon-utils:packages/utils neon-types:packages/types neon-reasoning-engine:packages/reasoning-engine"

# 2. Create reports directory
echo "📁 Creating reports directory..."
mkdir -p reports
cd reports && rm -f *-eslint.json ESLint-Summary.md && cd ..

# 3. Run ESLint in JSON mode for each module
echo "🔍 Scanning modules for lint errors..."

for module_pair in $MODULES; do
  module=$(echo "$module_pair" | cut -d: -f1)
  path=$(echo "$module_pair" | cut -d: -f2)
  
  echo "🔍 Scanning $module ($path)..."
  
  if [ -d "$path" ]; then
    (
      cd "$path" || exit 1
      
      # Check if package.json exists and has lint script
      if [ -f "package.json" ] && command -v jq >/dev/null 2>&1 && jq -e '.scripts.lint' package.json > /dev/null 2>&1; then
        echo "  ✅ Found lint script in $path"
        
        # Handle different lint configurations
        if [ "$module" = "neon-dashboard" ]; then
          # Next.js lint doesn't support JSON output directly, use eslint
          if [ -f ".eslintrc.json" ] || [ -f "eslint.config.js" ]; then
            npx eslint . --format json > "../../reports/${module}-eslint.json" 2>/dev/null || {
              echo "  ⚠️ ESLint failed for $module, creating empty report"
              echo "[]" > "../../reports/${module}-eslint.json"
            }
          else
            echo "  ⚠️ No ESLint config found for $module, using next lint"
            npx next lint --format json > "../../reports/${module}-eslint.json" 2>/dev/null || {
              echo "  ⚠️ Next lint failed for $module, creating empty report"
              echo "[]" > "../../reports/${module}-eslint.json"
            }
          fi
        else
          # Standard ESLint
          npx eslint . --format json > "../../reports/${module}-eslint.json" 2>/dev/null || {
            echo "  ⚠️ ESLint failed for $module, creating empty report"
            echo "[]" > "../../reports/${module}-eslint.json"
          }
        fi
      else
        echo "  ⚠️ No lint script found or jq not available in $path, skipping..."
        echo "[]" > "../reports/${module}-eslint.json"
      fi
    ) || {
      echo "  ❌ Failed to process $module, creating empty report"
      echo "[]" > "reports/${module}-eslint.json"
    }
  else
    echo "  ⚠️ Directory $path not found, skipping..."
    echo "[]" > "reports/${module}-eslint.json"
  fi
done

# 4. Aggregate all JSON reports into one Markdown summary
echo "📊 Generating comprehensive report..."

cat > reports/generate-summary.js << 'EOF'
const fs = require("fs");
const path = require("path");

const dir = path.resolve(".");
const files = fs.readdirSync(dir).filter(f => f.endsWith("-eslint.json"));

let md = `# 🚨 NeonHub ESLint Analysis Report\n\n`;
md += `_Generated on ${new Date().toLocaleString()}_\n\n`;
md += `## 📊 Executive Summary\n\n`;

let globalTotal = 0;
let globalRules = {};
let moduleStats = [];

// Process each module
for (const file of files) {
  const module = file.replace("-eslint.json", "");
  console.log(`Processing ${file}...`);
  
  try {
    const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
    
    let total = 0;
    let rules = {};
    let filesMap = {};
    let errorCount = 0;
    let warningCount = 0;
    
    for (const result of data) {
      if (!result.messages || result.messages.length === 0) continue;
      
      const rel = result.filePath ? result.filePath.replace(process.cwd() + "/", "") : "unknown";
      const count = result.messages.length;
      
      total += count;
      globalTotal += count;
      filesMap[rel] = (filesMap[rel] || 0) + count;
      
      for (const message of result.messages) {
        const rule = message.ruleId || "no-rule";
        rules[rule] = (rules[rule] || 0) + 1;
        globalRules[rule] = (globalRules[rule] || 0) + 1;
        
        if (message.severity === 2) errorCount++;
        else if (message.severity === 1) warningCount++;
      }
    }
    
    moduleStats.push({
      name: module,
      total,
      errors: errorCount,
      warnings: warningCount,
      files: Object.keys(filesMap).length,
      topRules: Object.entries(rules).sort((a,b) => b[1] - a[1]).slice(0, 5),
      topFiles: Object.entries(filesMap).sort((a,b) => b[1] - a[1]).slice(0, 5)
    });
    
  } catch (error) {
    console.error(`Error processing ${file}:`, error.message);
    moduleStats.push({
      name: module,
      total: 0,
      errors: 0,
      warnings: 0,
      files: 0,
      topRules: [],
      topFiles: []
    });
  }
}

// Generate summary table
md += `| Module | Total Issues | Errors | Warnings | Files |\n`;
md += `|--------|-------------|--------|----------|-------|\n`;

for (const stat of moduleStats) {
  md += `| **${stat.name}** | ${stat.total} | ${stat.errors} | ${stat.warnings} | ${stat.files} |\n`;
}

md += `| **TOTAL** | **${globalTotal}** | **${moduleStats.reduce((sum, s) => sum + s.errors, 0)}** | **${moduleStats.reduce((sum, s) => sum + s.warnings, 0)}** | **${moduleStats.reduce((sum, s) => sum + s.files, 0)}** |\n\n`;

// Global top rules
const topGlobalRules = Object.entries(globalRules).sort((a,b) => b[1] - a[1]).slice(0, 10);
md += `## 🎯 Top 10 Rule Violations (Platform-wide)\n\n`;
for (const [rule, count] of topGlobalRules) {
  md += `- **${rule}**: ${count} occurrences\n`;
}

// Detailed module reports
md += `\n## 📦 Detailed Module Reports\n\n`;

for (const stat of moduleStats) {
  md += `### ${stat.name}\n\n`;
  md += `- **Total Issues**: ${stat.total}\n`;
  md += `- **Errors**: ${stat.errors}\n`;
  md += `- **Warnings**: ${stat.warnings}\n`;
  md += `- **Files Affected**: ${stat.files}\n\n`;
  
  if (stat.topRules.length > 0) {
    md += `**Top Rule Violations**:\n`;
    for (const [rule, count] of stat.topRules) {
      md += `- \`${rule}\`: ${count}\n`;
    }
    md += `\n`;
  }
  
  if (stat.topFiles.length > 0) {
    md += `**Most Problematic Files**:\n`;
    for (const [file, count] of stat.topFiles) {
      md += `- \`${file}\`: ${count} issues\n`;
    }
    md += `\n`;
  }
  
  md += `---\n\n`;
}

// Quality assessment
md += `## 🎖️ Code Quality Assessment\n\n`;

if (globalTotal === 0) {
  md += `🎉 **EXCELLENT**: No lint issues found across the platform!\n\n`;
} else if (globalTotal < 10) {
  md += `✅ **VERY GOOD**: Minimal issues found (${globalTotal} total)\n\n`;
} else if (globalTotal < 50) {
  md += `⚠️ **GOOD**: Some issues to address (${globalTotal} total)\n\n`;
} else if (globalTotal < 100) {
  md += `🔧 **NEEDS ATTENTION**: Multiple issues requiring fixes (${globalTotal} total)\n\n`;
} else {
  md += `🚨 **CRITICAL**: High number of issues requiring immediate attention (${globalTotal} total)\n\n`;
}

// Recommendations
md += `## 💡 Recommendations\n\n`;

if (globalTotal > 0) {
  md += `1. **Priority Focus**: Address the top rule violations listed above\n`;
  md += `2. **File-by-File**: Start with the most problematic files in each module\n`;
  md += `3. **Automated Fixes**: Run \`npm run lint:fix\` where possible\n`;
  md += `4. **Code Reviews**: Implement stricter pre-commit hooks\n`;
  md += `5. **Configuration**: Consider adjusting ESLint rules for consistency\n\n`;
}

md += `## 🛠️ Quick Fix Commands\n\n`;
md += `\`\`\`bash\n`;
md += `# Fix auto-fixable issues across all workspaces\n`;
md += `npm run lint:fix\n\n`;
md += `# Check specific module\n`;
md += `cd apps/api && npm run lint\n`;
md += `cd packages/core-agents && npm run lint\n\n`;
md += `# Type check all modules\n`;
md += `npm run type-check\n`;
md += `\`\`\`\n\n`;

md += `---\n`;
md += `*Report generated by NeonHub Lint Analysis Tool*\n`;

fs.writeFileSync(path.join(dir, "ESLint-Summary.md"), md);
console.log("✅ ESLint-Summary.md generated successfully");
EOF

cd reports
node generate-summary.js
cd ..

echo "🎉 Comprehensive lint analysis complete!"
echo "📄 Report saved to: reports/ESLint-Summary.md"
echo ""
echo "📊 Quick Summary:"
echo "=================="

# Quick summary output
if [ -f "reports/ESLint-Summary.md" ]; then
  echo "✅ Report generated successfully"
  total_issues=$(grep -o "TOTAL.*|.*|.*|.*|" reports/ESLint-Summary.md | sed 's/.*| \*\*\([0-9]*\)\*\*.*/\1/' || echo "0")
  echo "📈 Total Issues Found: $total_issues"
else
  echo "❌ Report generation failed"
fi

echo ""
echo "🔍 To view the full report:"
echo "cat reports/ESLint-Summary.md" 