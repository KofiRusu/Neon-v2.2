#!/usr/bin/env node

/**
 * Documentation Optimization Agent
 * Specialized agent for improving documentation across the project
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class DocumentationAgent {
  constructor() {
    this.startTime = Date.now();
    this.improvements = [];
    this.filesChanged = [];
    this.metrics = {
      markdownFiles: 0,
      apiEndpoints: 0,
      jsdocCoverage: 0,
      readmeUpdates: 0,
      generatedDocs: 0,
    };
  }

  log(message) {
    console.error(`[Documentation] ${message}`);
  }

  async scanExistingDocs() {
    this.log('Scanning existing documentation...');

    // Count markdown files
    const docsDir = path.join(process.cwd(), 'docs');
    if (fs.existsSync(docsDir)) {
      const mdFiles = fs.readdirSync(docsDir).filter(f => f.endsWith('.md'));
      this.metrics.markdownFiles = mdFiles.length;
      this.log(`Found ${mdFiles.length} markdown files in docs/`);
    }

    // Check for API documentation
    const apiFiles = ['openapi.json', 'openapi.yml', 'swagger.json'];
    for (const file of apiFiles) {
      if (fs.existsSync(path.join(process.cwd(), 'docs', file))) {
        this.metrics.apiEndpoints++;
      }
    }
  }

  async generateAPIDocumentation() {
    this.log('Generating API documentation...');

    try {
      // Try to generate OpenAPI docs from JSDoc comments
      if (fs.existsSync('swaggerDef.js')) {
        execSync('npx swagger-jsdoc -d swaggerDef.js -o docs/openapi.json', {
          stdio: 'pipe',
          cwd: process.cwd(),
        });
        this.improvements.push('Generated OpenAPI JSON documentation');
        this.filesChanged.push('docs/openapi.json');
        this.metrics.generatedDocs++;
      } else {
        // Create basic OpenAPI structure for tRPC endpoints
        await this.generateBasicAPIDoc();
      }
    } catch (err) {
      this.log(`API doc generation skipped: ${err.message}`);
      // Try alternative approach for tRPC
      await this.generateTRPCDocumentation();
    }
  }

  async generateBasicAPIDoc() {
    const docsDir = path.join(process.cwd(), 'docs');
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }

    // Scan for tRPC routers
    const trpcRouters = this.findTRPCRouters();

    const basicOpenAPI = {
      openapi: '3.0.0',
      info: {
        title: 'NeonHub API Documentation',
        version: '1.0.0',
        description: 'Auto-generated API documentation for NeonHub AI Marketing Ecosystem',
        generatedAt: new Date().toISOString(),
      },
      servers: [
        { url: 'http://localhost:3001', description: 'Development server' },
        { url: 'https://api.neonhub.app', description: 'Production server' },
      ],
      paths: {},
      components: {
        schemas: {},
      },
    };

    // Add discovered endpoints
    trpcRouters.forEach(router => {
      basicOpenAPI.info.description += `\n- ${router.name}: ${router.procedures.length} procedures`;
    });

    fs.writeFileSync(
      path.join(docsDir, 'api-overview.json'),
      JSON.stringify(basicOpenAPI, null, 2)
    );

    this.improvements.push('Generated basic API overview documentation');
    this.filesChanged.push('docs/api-overview.json');
    this.metrics.generatedDocs++;
  }

  findTRPCRouters() {
    const routers = [];
    const routersDir = 'apps/api/src/server/routers';

    if (fs.existsSync(routersDir)) {
      const routerFiles = fs.readdirSync(routersDir).filter(f => f.endsWith('.ts'));

      routerFiles.forEach(file => {
        try {
          const content = fs.readFileSync(path.join(routersDir, file), 'utf8');
          const procedures = content.match(/\.(?:query|mutation)\(/g) || [];

          routers.push({
            name: path.basename(file, '.ts'),
            file,
            procedures: procedures.map(p => p.replace(/\.(?:query|mutation)\(/, '')),
          });
        } catch (error) {
          this.log(`Error reading router ${file}: ${error.message}`);
        }
      });
    }

    return routers;
  }

  async generateTRPCDocumentation() {
    this.log('Generating tRPC-specific documentation...');

    const trpcRouters = this.findTRPCRouters();

    if (trpcRouters.length > 0) {
      const docsDir = path.join(process.cwd(), 'docs');
      if (!fs.existsSync(docsDir)) {
        fs.mkdirSync(docsDir, { recursive: true });
      }

      const trpcDocs = `# tRPC API Documentation

Auto-generated on: ${new Date().toISOString()}

## Available Routers

${trpcRouters
  .map(
    router => `
### ${router.name}
- File: \`${router.file}\`
- Procedures: ${router.procedures.length}
- Available endpoints: ${router.procedures.join(', ')}
`
  )
  .join('\n')}

## Usage

\`\`\`typescript
import { trpc } from '@/lib/trpc';

// Example usage
const result = await trpc.[router].[procedure].query(params);
\`\`\`
`;

      fs.writeFileSync(path.join(docsDir, 'trpc-api.md'), trpcDocs);
      this.improvements.push(`Generated tRPC documentation for ${trpcRouters.length} routers`);
      this.filesChanged.push('docs/trpc-api.md');
      this.metrics.generatedDocs++;
    }
  }

  async updateREADME() {
    this.log('Updating README.md...');

    try {
      const readmePath = path.join(process.cwd(), 'README.md');
      let readme = fs.readFileSync(readmePath, 'utf-8');

      // Add auto-generated header
      const header = `<!-- AUTO-GENERATED DOCS: ${new Date().toISOString()} -->\n`;

      // Check if header already exists
      if (!readme.includes('AUTO-GENERATED DOCS')) {
        readme = header + readme;
        this.metrics.readmeUpdates++;
      } else {
        // Update existing header
        readme = readme.replace(
          /<!-- AUTO-GENERATED DOCS: .* -->/,
          `<!-- AUTO-GENERATED DOCS: ${new Date().toISOString()} -->`
        );
        this.metrics.readmeUpdates++;
      }

      // Add or update API documentation section
      const apiSection = `
## 📚 API Documentation

- **tRPC API**: [docs/trpc-api.md](./docs/trpc-api.md)
- **OpenAPI Spec**: [docs/api-overview.json](./docs/api-overview.json)
- **Architecture**: [docs/architecture.md](./docs/architecture.md)

*Documentation auto-updated by NeonHub Documentation Agent*

`;

      if (!readme.includes('## 📚 API Documentation')) {
        // Find a good place to insert (after description, before installation)
        const insertPoint =
          readme.indexOf('## 🚀 Installation') !== -1
            ? readme.indexOf('## 🚀 Installation')
            : readme.indexOf('## Installation') !== -1
              ? readme.indexOf('## Installation')
              : readme.length;

        readme = readme.slice(0, insertPoint) + apiSection + readme.slice(insertPoint);
      }

      fs.writeFileSync(readmePath, readme);
      this.improvements.push('Updated README.md with auto-generated documentation links');
      this.filesChanged.push('README.md');
    } catch (err) {
      this.log(`README.md update failed: ${err.message}`);
    }
  }

  async generateJSDocCoverage() {
    this.log('Analyzing JSDoc coverage...');

    try {
      // Find TypeScript files and check for JSDoc comments
      const tsFiles = execSync(
        'find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | grep -v ".d.ts"',
        {
          encoding: 'utf8',
          cwd: process.cwd(),
        }
      )
        .split('\n')
        .filter(Boolean);

      let functionsWithDocs = 0;
      let totalFunctions = 0;

      tsFiles.forEach(file => {
        try {
          const content = fs.readFileSync(file, 'utf8');
          const functions =
            content.match(
              /(?:export\s+)?(?:async\s+)?function\s+\w+|(?:export\s+)?const\s+\w+\s*=\s*(?:async\s+)?\(/g
            ) || [];
          const jsdocComments = content.match(/\/\*\*[\s\S]*?\*\//g) || [];

          totalFunctions += functions.length;
          functionsWithDocs += Math.min(functions.length, jsdocComments.length);
        } catch (error) {
          // Skip files that can't be read
        }
      });

      this.metrics.jsdocCoverage =
        totalFunctions > 0 ? Math.round((functionsWithDocs / totalFunctions) * 100) : 0;
      this.improvements.push(
        `JSDoc coverage: ${this.metrics.jsdocCoverage}% (${functionsWithDocs}/${totalFunctions} functions)`
      );
    } catch (error) {
      this.log(`JSDoc analysis failed: ${error.message}`);
    }
  }

  async validateDocumentation() {
    this.log('Validating documentation...');

    const requiredDocs = ['README.md', 'docs/architecture.md', 'docs/deploy.md'];

    const missingDocs = requiredDocs.filter(doc => !fs.existsSync(doc));

    if (missingDocs.length === 0) {
      this.improvements.push('All required documentation files present');
    } else {
      this.improvements.push(`Missing documentation: ${missingDocs.join(', ')}`);
    }

    // Check for broken links in markdown files
    try {
      const markdownFiles = execSync('find . -name "*.md" | grep -v node_modules', {
        encoding: 'utf8',
        cwd: process.cwd(),
      })
        .split('\n')
        .filter(Boolean);

      let brokenLinks = 0;
      markdownFiles.forEach(file => {
        try {
          const content = fs.readFileSync(file, 'utf8');
          const links = content.match(/\[.*?\]\((.*?)\)/g) || [];

          links.forEach(link => {
            const url = link.match(/\((.*?)\)/)?.[1];
            if (url && url.startsWith('./') && !fs.existsSync(url.replace('./', ''))) {
              brokenLinks++;
            }
          });
        } catch (error) {
          // Skip files that can't be read
        }
      });

      if (brokenLinks === 0) {
        this.improvements.push('No broken internal links detected');
      } else {
        this.improvements.push(`Found ${brokenLinks} potentially broken internal links`);
      }
    } catch (error) {
      this.log(`Link validation failed: ${error.message}`);
    }
  }

  async run() {
    this.log('📚 Starting Documentation Optimization...');

    await this.scanExistingDocs();
    await this.generateAPIDocumentation();
    await this.updateREADME();
    await this.generateJSDocCoverage();
    await this.validateDocumentation();

    const duration = Date.now() - this.startTime;
    this.metrics.duration = duration;

    this.log(`✅ Documentation optimization completed in ${duration}ms`);

    const results = {
      agent: 'documentation',
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
  const agent = new DocumentationAgent();
  agent.run().catch(error => {
    console.error(
      JSON.stringify({
        agent: 'documentation',
        status: 'failed',
        error: error.message,
      })
    );
    process.exit(1);
  });
}

module.exports = DocumentationAgent;
