#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class TypeSafetyAgent {
  constructor() {
    this.startTime = Date.now();
    this.improvements = [];
    this.filesChanged = [];
    this.metrics = {};
  }

  log(message) {
    console.error(`[TypeSafety] ${message}`);
  }

  async run() {
    this.log('🔒 Starting Type Safety Optimization...');

    // 1. Enable strict TypeScript compiler options
    try {
      const tsconfigPath = path.join(process.cwd(), 'tsconfig.json');
      const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));

      const strictOptions = {
        strict: true,
        noImplicitAny: true,
        noImplicitReturns: true,
        noFallthroughCasesInSwitch: true,
        noUncheckedIndexedAccess: true,
      };

      let optionsAdded = 0;
      for (const [option, value] of Object.entries(strictOptions)) {
        if (tsconfig.compilerOptions[option] !== value) {
          tsconfig.compilerOptions[option] = value;
          optionsAdded++;
        }
      }

      if (optionsAdded > 0) {
        fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2));
        this.improvements.push(`Enabled ${optionsAdded} strict TypeScript compiler options`);
        this.filesChanged.push('tsconfig.json');
      }
    } catch (err) {
      this.log(`TypeScript config update failed: ${err.message}`);
    }

    // 2. Scan for and fix 'any' types
    try {
      const result = execSync(
        'grep -r "\\: any" --include="*.ts" --include="*.tsx" . | grep -v node_modules | wc -l',
        {
          encoding: 'utf8',
          cwd: process.cwd(),
        }
      );
      const anyCount = parseInt(result.trim());
      this.metrics.anyTypes = anyCount;

      if (anyCount > 0) {
        this.improvements.push(`Found ${anyCount} 'any' types that could be made more specific`);
      } else {
        this.improvements.push('No explicit any types found - good type discipline!');
      }
    } catch (err) {
      this.log(`Any type scan failed: ${err.message}`);
    }

    // 3. Run TypeScript compiler for type checking
    try {
      execSync('npx tsc --noEmit', {
        stdio: 'pipe',
        cwd: process.cwd(),
      });
      this.improvements.push('TypeScript compilation successful - no type errors');
      this.metrics.typeErrors = 0;
    } catch (err) {
      // Count type errors
      const errorCount = (err.stdout.toString().match(/error TS/g) || []).length;
      this.metrics.typeErrors = errorCount;
      this.improvements.push(`Found ${errorCount} TypeScript errors to fix`);
    }

    // 4. Check for missing return types on functions
    try {
      const tsFiles = execSync('find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules', {
        encoding: 'utf8',
        cwd: process.cwd(),
      })
        .split('\n')
        .filter(Boolean);

      let functionsWithoutReturnTypes = 0;
      let totalFunctions = 0;

      tsFiles.forEach(file => {
        try {
          const content = fs.readFileSync(file, 'utf8');
          // Match function declarations without explicit return types
          const functions =
            content.match(/(?:export\s+)?(?:async\s+)?function\s+\w+\s*\([^)]*\)\s*{/g) || [];
          const functionsWithTypes =
            content.match(/(?:export\s+)?(?:async\s+)?function\s+\w+\s*\([^)]*\)\s*:\s*\w+/g) || [];

          totalFunctions += functions.length;
          functionsWithoutReturnTypes += Math.max(0, functions.length - functionsWithTypes.length);
        } catch (error) {
          // Skip files that can't be read
        }
      });

      this.metrics.functionTypeCoverage =
        totalFunctions > 0
          ? Math.round(((totalFunctions - functionsWithoutReturnTypes) / totalFunctions) * 100)
          : 100;

      this.improvements.push(
        `Function return type coverage: ${this.metrics.functionTypeCoverage}% (${totalFunctions - functionsWithoutReturnTypes}/${totalFunctions})`
      );
    } catch (err) {
      this.log(`Return type analysis failed: ${err.message}`);
    }

    // 5. Validate package.json type-related scripts
    try {
      const packagePath = path.join(process.cwd(), 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));

      const requiredScripts = {
        'type-check': 'tsc --noEmit',
        'type-coverage': 'type-coverage',
      };

      let scriptsAdded = 0;
      for (const [script, command] of Object.entries(requiredScripts)) {
        if (!packageJson.scripts[script]) {
          packageJson.scripts[script] = command;
          scriptsAdded++;
        }
      }

      if (scriptsAdded > 0) {
        fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
        this.improvements.push(`Added ${scriptsAdded} type-checking scripts to package.json`);
        this.filesChanged.push('package.json');
      }
    } catch (err) {
      this.log(`Package.json script update failed: ${err.message}`);
    }

    const duration = Date.now() - this.startTime;
    this.metrics.duration = duration;

    this.log(`✅ Type safety optimization completed in ${duration}ms`);

    const results = {
      agent: 'type-safety',
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
  const agent = new TypeSafetyAgent();
  agent.run().catch(error => {
    console.error(
      JSON.stringify({
        agent: 'type-safety',
        status: 'failed',
        error: error.message,
      })
    );
    process.exit(1);
  });
}

module.exports = TypeSafetyAgent;
