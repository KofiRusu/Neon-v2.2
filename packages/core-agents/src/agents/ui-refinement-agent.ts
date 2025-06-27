import { AbstractAgent, AgentPayload, AgentResult } from '../base-agent';
import { promises as fs } from 'fs';
import path from 'path';
import { logger } from '@neon/utils';

export interface ContrastIssue {
  file: string;
  line: number;
  element: string;
  currentBg: string;
  currentText: string;
  suggestedBg?: string;
  suggestedText?: string;
  contrastRatio: number;
  severity: 'low' | 'medium' | 'high';
}

export interface UIIssue {
  file: string;
  line: number;
  type: 'contrast' | 'spacing' | 'accessibility' | 'responsive' | 'theme';
  description: string;
  currentValue: string;
  suggestedValue: string;
  severity: 'low' | 'medium' | 'high';
}

export interface UIRefinementResult {
  issues: UIIssue[];
  fixedIssues: UIIssue[];
  warnings: string[];
  filesModified: string[];
}

export interface UIRefinementPayload extends AgentPayload {
  action:
    | 'analyze_contrast'
    | 'fix_contrast'
    | 'analyze_spacing'
    | 'fix_spacing'
    | 'analyze_accessibility'
    | 'fix_accessibility'
    | 'analyze_responsive'
    | 'fix_responsive';
  parameters: {
    files?: string[];
    targetDir?: string;
    autoFix?: boolean;
    severity?: 'low' | 'medium' | 'high';
  };
}

export class UIRefinementAgent extends AbstractAgent {
  private readonly logPath = path.join(process.cwd(), 'logs', 'ui-refinements.log');

  // WCAG contrast ratio thresholds
  private readonly CONTRAST_THRESHOLDS = {
    AA_NORMAL: 4.5,
    AA_LARGE: 3.0,
    AAA_NORMAL: 7.0,
    AAA_LARGE: 4.5,
  };

  // Common contrast-safe color mappings
  private readonly CONTRAST_FIXES = {
    'bg-neutral-900': {
      'text-neutral-700': 'text-neutral-100',
      'text-neutral-600': 'text-neutral-100',
      'text-neutral-500': 'text-neutral-200',
      'text-neutral-400': 'text-neutral-200',
      'text-neutral-300': 'text-neutral-100',
    },
    'bg-neutral-800': {
      'text-neutral-600': 'text-neutral-100',
      'text-neutral-500': 'text-neutral-200',
      'text-neutral-400': 'text-neutral-200',
    },
    'bg-blue-900': {
      'text-blue-700': 'text-blue-100',
      'text-blue-600': 'text-blue-100',
      'text-blue-500': 'text-blue-100',
    },
    'bg-purple-900': {
      'text-purple-700': 'text-purple-100',
      'text-purple-600': 'text-purple-100',
      'text-purple-500': 'text-purple-100',
    },
  };

  // Spacing consistency patterns (using Tailwind's 4-point system)
  private readonly SPACING_STANDARDS = {
    padding: ['p-0', 'p-1', 'p-2', 'p-3', 'p-4', 'p-6', 'p-8', 'p-12', 'p-16', 'p-20', 'p-24'],
    margin: ['m-0', 'm-1', 'm-2', 'm-3', 'm-4', 'm-6', 'm-8', 'm-12', 'm-16', 'm-20', 'm-24'],
    gaps: ['gap-0', 'gap-1', 'gap-2', 'gap-3', 'gap-4', 'gap-6', 'gap-8', 'gap-12', 'gap-16'],
  };

  constructor(id: string, name: string) {
    super(id, name, 'ui-refinement', [
      'check_contrast',
      'fix_contrast_issues',
      'validate_accessibility',
      'optimize_spacing',
      'ensure_responsive_design',
      'apply_theme_consistency',
    ]);
  }

  async execute(payload: UIRefinementPayload): Promise<AgentResult<UIRefinementResult>> {
    try {
      const { action, parameters } = payload;

      switch (action) {
        case 'analyze_contrast':
          return await this.analyzeContrast(parameters);
        case 'fix_contrast':
          return await this.fixContrastIssues(parameters);
        case 'analyze_spacing':
          return await this.analyzeSpacing(parameters);
        case 'fix_spacing':
          return await this.fixSpacingIssues(parameters);
        case 'analyze_accessibility':
          return await this.analyzeAccessibility(parameters);
        case 'fix_accessibility':
          return await this.fixAccessibilityIssues(parameters);
        case 'analyze_responsive':
          return await this.analyzeResponsive(parameters);
        case 'fix_responsive':
          return await this.fixResponsiveIssues(parameters);
        default:
          throw new Error(`Unknown action: ${action}`);
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        data: {
          issues: [],
          fixedIssues: [],
          warnings: [],
          filesModified: [],
        },
      };
    }
  }

  private async analyzeContrast(
    parameters: UIRefinementPayload['parameters']
  ): Promise<AgentResult<UIRefinementResult>> {
    const files = parameters.files || (await this.getUIFiles(parameters.targetDir));
    const issues: UIIssue[] = [];

    for (const file of files) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        const fileIssues = await this.checkContrastInFile(file, content);
        issues.push(...fileIssues);
      } catch (error) {
        logger.warn(`Failed to analyze contrast in ${file}`, { error });
      }
    }

    return {
      success: true,
      data: {
        issues,
        fixedIssues: [],
        warnings: [],
        filesModified: [],
      },
    };
  }

  private async fixContrastIssues(
    parameters: UIRefinementPayload['parameters']
  ): Promise<AgentResult<UIRefinementResult>> {
    const files = parameters.files || (await this.getUIFiles(parameters.targetDir));
    const fixedIssues: UIIssue[] = [];
    const filesModified: string[] = [];

    for (const file of files) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        const issues = await this.checkContrastInFile(file, content);

        if (issues.length > 0) {
          const { fixedContent, fixed } = this.applyContrastFixes(content, issues);

          if (parameters.autoFix && fixed.length > 0) {
            await fs.writeFile(file, fixedContent);
            filesModified.push(file);
          }

          fixedIssues.push(...fixed);
        }
      } catch (error) {
        logger.warn(`Failed to fix contrast issues in ${file}`, { error });
      }
    }

    return {
      success: true,
      data: {
        issues: [],
        fixedIssues,
        warnings: [],
        filesModified,
      },
    };
  }

  private async analyzeSpacing(
    parameters: UIRefinementPayload['parameters']
  ): Promise<AgentResult<UIRefinementResult>> {
    const files = parameters.files || (await this.getUIFiles(parameters.targetDir));
    const issues: UIIssue[] = [];

    for (const file of files) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        const fileIssues = this.checkSpacingInFile(file, content);
        issues.push(...fileIssues);
      } catch (error) {
        logger.warn(`Failed to analyze spacing in ${file}`, { error });
      }
    }

    return {
      success: true,
      data: {
        issues,
        fixedIssues: [],
        warnings: [],
        filesModified: [],
      },
    };
  }

  private async fixSpacingIssues(
    parameters: UIRefinementPayload['parameters']
  ): Promise<AgentResult<UIRefinementResult>> {
    const files = parameters.files || (await this.getUIFiles(parameters.targetDir));
    const fixedIssues: UIIssue[] = [];
    const filesModified: string[] = [];

    for (const file of files) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        const issues = this.checkSpacingInFile(file, content);

        if (issues.length > 0) {
          const { fixedContent, fixed } = this.applySpacingFixes(content, issues);

          if (parameters.autoFix && fixed.length > 0) {
            await fs.writeFile(file, fixedContent);
            filesModified.push(file);
          }

          fixedIssues.push(...fixed);
        }
      } catch (error) {
        logger.warn(`Failed to fix spacing issues in ${file}`, { error });
      }
    }

    return {
      success: true,
      data: {
        issues: [],
        fixedIssues,
        warnings: [],
        filesModified,
      },
    };
  }

  private async analyzeAccessibility(
    parameters: UIRefinementPayload['parameters']
  ): Promise<AgentResult<UIRefinementResult>> {
    const files = parameters.files || (await this.getUIFiles(parameters.targetDir));
    const issues: UIIssue[] = [];

    for (const file of files) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        const fileIssues = this.checkAccessibilityInFile(file, content);
        issues.push(...fileIssues);
      } catch (error) {
        logger.warn(`Failed to analyze accessibility in ${file}`, { error });
      }
    }

    return {
      success: true,
      data: {
        issues,
        fixedIssues: [],
        warnings: [],
        filesModified: [],
      },
    };
  }

  private async fixAccessibilityIssues(
    parameters: UIRefinementPayload['parameters']
  ): Promise<AgentResult<UIRefinementResult>> {
    const files = parameters.files || (await this.getUIFiles(parameters.targetDir));
    const fixedIssues: UIIssue[] = [];
    const filesModified: string[] = [];

    for (const file of files) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        const issues = this.checkAccessibilityInFile(file, content);

        if (issues.length > 0) {
          const { fixedContent, fixed } = this.applyAccessibilityFixes(content, issues);

          if (parameters.autoFix && fixed.length > 0) {
            await fs.writeFile(file, fixedContent);
            filesModified.push(file);
          }

          fixedIssues.push(...fixed);
        }
      } catch (error) {
        logger.warn(`Failed to fix accessibility issues in ${file}`, { error });
      }
    }

    return {
      success: true,
      data: {
        issues: [],
        fixedIssues,
        warnings: [],
        filesModified,
      },
    };
  }

  private async analyzeResponsive(
    parameters: UIRefinementPayload['parameters']
  ): Promise<AgentResult<UIRefinementResult>> {
    const files = parameters.files || (await this.getUIFiles(parameters.targetDir));
    const issues: UIIssue[] = [];

    for (const file of files) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        const fileIssues = this.checkResponsiveInFile(file, content);
        issues.push(...fileIssues);
      } catch (error) {
        logger.warn(`Failed to analyze responsive design in ${file}`, { error });
      }
    }

    return {
      success: true,
      data: {
        issues,
        fixedIssues: [],
        warnings: [],
        filesModified: [],
      },
    };
  }

  private async fixResponsiveIssues(
    parameters: UIRefinementPayload['parameters']
  ): Promise<AgentResult<UIRefinementResult>> {
    const files = parameters.files || (await this.getUIFiles(parameters.targetDir));
    const fixedIssues: UIIssue[] = [];
    const filesModified: string[] = [];

    for (const file of files) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        const issues = this.checkResponsiveInFile(file, content);

        if (issues.length > 0) {
          const { fixedContent, fixed } = this.applyResponsiveFixes(content, issues);

          if (parameters.autoFix && fixed.length > 0) {
            await fs.writeFile(file, fixedContent);
            filesModified.push(file);
          }

          fixedIssues.push(...fixed);
        }
      } catch (error) {
        logger.warn(`Failed to fix responsive issues in ${file}`, { error });
      }
    }

    return {
      success: true,
      data: {
        issues: [],
        fixedIssues,
        warnings: [],
        filesModified,
      },
    };
  }

  // Helper methods
  private async getUIFiles(_targetDir?: string): Promise<string[]> {
    // Implementation to find UI files
    return ['apps/dashboard/src/components/**/*.tsx', 'apps/dashboard/src/app/**/*.tsx'];
  }

  private async checkContrastInFile(file: string, content: string): Promise<UIIssue[]> {
    const issues: UIIssue[] = [];
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      // Check for known problematic contrast combinations
      Object.entries(this.CONTRAST_FIXES).forEach(([bgClass, textFixes]) => {
        if (line.includes(bgClass)) {
          Object.keys(textFixes).forEach(textClass => {
            if (line.includes(textClass)) {
              issues.push({
                file,
                line: index + 1,
                type: 'contrast',
                description: `Poor contrast: ${textClass} on ${bgClass}`,
                currentValue: `${bgClass} ${textClass}`,
                suggestedValue: `${bgClass} ${textFixes[textClass as keyof typeof textFixes]}`,
                severity: 'high',
              });
            }
          });
        }
      });
    });

    return issues;
  }

  private applyContrastFixes(
    content: string,
    issues: UIIssue[]
  ): { fixedContent: string; fixed: UIIssue[] } {
    let fixedContent = content;
    const fixed: UIIssue[] = [];

    issues.forEach(issue => {
      if (fixedContent.includes(issue.currentValue)) {
        fixedContent = fixedContent.replace(issue.currentValue, issue.suggestedValue);
        fixed.push(issue);
      }
    });

    return { fixedContent, fixed };
  }

  private checkSpacingInFile(file: string, content: string): UIIssue[] {
    const issues: UIIssue[] = [];
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      // Check for inconsistent padding/margin patterns
      const spacingMatch = line.match(
        /className="[^"]*\b(p-\d+|m-\d+|px-\d+|py-\d+|mx-\d+|my-\d+)\b[^"]*"/g
      );

      if (spacingMatch) {
        spacingMatch.forEach(match => {
          // Look for non-standard spacing values
          const nonStandardSpacing = match.match(
            /\b(p|m|px|py|mx|my)-([579]|1[013-9]|2[1-35-9]|3[0-9])\b/
          );
          if (nonStandardSpacing) {
            const currentClass = nonStandardSpacing[0];
            const prefix = nonStandardSpacing[1];
            const suggestedClass = this.getNearestStandardSpacing(currentClass, prefix);

            issues.push({
              file,
              line: index + 1,
              type: 'spacing',
              description: `Non-standard spacing: ${currentClass}`,
              currentValue: currentClass,
              suggestedValue: suggestedClass,
              severity: 'medium',
            });
          }
        });
      }
    });

    return issues;
  }

  private applySpacingFixes(
    content: string,
    issues: UIIssue[]
  ): { fixedContent: string; fixed: UIIssue[] } {
    let fixedContent = content;
    const fixed: UIIssue[] = [];

    issues.forEach(issue => {
      const regex = new RegExp(`\\b${issue.currentValue}\\b`, 'g');
      if (regex.test(fixedContent)) {
        fixedContent = fixedContent.replace(regex, issue.suggestedValue);
        fixed.push(issue);
      }
    });

    return { fixedContent, fixed };
  }

  private checkAccessibilityInFile(file: string, content: string): UIIssue[] {
    const issues: UIIssue[] = [];
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      // Check for missing alt attributes on images
      if (line.includes('<img') && !line.includes('alt=')) {
        issues.push({
          file,
          line: index + 1,
          type: 'accessibility',
          description: 'Missing alt attribute on image',
          currentValue: line.trim(),
          suggestedValue: line.replace('<img', '<img alt=""'),
          severity: 'high',
        });
      }

      // Check for buttons without accessible labels
      if (
        line.includes('<button') &&
        !line.includes('aria-label') &&
        !line.includes('>') &&
        !line.includes('</button>')
      ) {
        issues.push({
          file,
          line: index + 1,
          type: 'accessibility',
          description: 'Button without accessible label',
          currentValue: line.trim(),
          suggestedValue: line.replace('<button', '<button aria-label="Button action"'),
          severity: 'medium',
        });
      }

      // Check for form inputs without labels
      if (
        line.includes('<input') &&
        !line.includes('aria-label') &&
        !line.includes('placeholder')
      ) {
        issues.push({
          file,
          line: index + 1,
          type: 'accessibility',
          description: 'Input without label or placeholder',
          currentValue: line.trim(),
          suggestedValue: line.replace('<input', '<input placeholder="Enter value"'),
          severity: 'medium',
        });
      }
    });

    return issues;
  }

  private applyAccessibilityFixes(
    content: string,
    issues: UIIssue[]
  ): { fixedContent: string; fixed: UIIssue[] } {
    let fixedContent = content;
    const fixed: UIIssue[] = [];

    issues.forEach(issue => {
      if (fixedContent.includes(issue.currentValue)) {
        fixedContent = fixedContent.replace(issue.currentValue, issue.suggestedValue);
        fixed.push(issue);
      }
    });

    return { fixedContent, fixed };
  }

  private checkResponsiveInFile(file: string, content: string): UIIssue[] {
    const issues: UIIssue[] = [];
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      // Check for fixed widths without responsive variants
      const fixedWidthMatch = line.match(/\bw-\d+\b/);
      if (
        fixedWidthMatch &&
        !line.includes('sm:') &&
        !line.includes('md:') &&
        !line.includes('lg:')
      ) {
        issues.push({
          file,
          line: index + 1,
          type: 'responsive',
          description: 'Fixed width without responsive variants',
          currentValue: fixedWidthMatch[0],
          suggestedValue: `${fixedWidthMatch[0]} md:w-auto lg:w-fit`,
          severity: 'medium',
        });
      }

      // Check for text sizes without responsive variants
      const textSizeMatch = line.match(/\btext-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl)\b/);
      if (
        textSizeMatch &&
        !line.includes('sm:text-') &&
        !line.includes('md:text-') &&
        !line.includes('lg:text-')
      ) {
        issues.push({
          file,
          line: index + 1,
          type: 'responsive',
          description: 'Text size without responsive variants',
          currentValue: textSizeMatch[0],
          suggestedValue: `${textSizeMatch[0]} md:text-lg lg:text-xl`,
          severity: 'low',
        });
      }
    });

    return issues;
  }

  private applyResponsiveFixes(
    content: string,
    issues: UIIssue[]
  ): { fixedContent: string; fixed: UIIssue[] } {
    let fixedContent = content;
    const fixed: UIIssue[] = [];

    issues.forEach(issue => {
      const regex = new RegExp(`\\b${issue.currentValue}\\b`, 'g');
      if (regex.test(fixedContent)) {
        fixedContent = fixedContent.replace(regex, issue.suggestedValue);
        fixed.push(issue);
      }
    });

    return { fixedContent, fixed };
  }

  private getNearestStandardSpacing(currentClass: string, prefix: string): string {
    const currentValue = parseInt(currentClass.split('-')[1]);
    const standardValues = [0, 1, 2, 3, 4, 6, 8, 12, 16, 20, 24];

    const nearest = standardValues.reduce((prev, curr) =>
      Math.abs(curr - currentValue) < Math.abs(prev - currentValue) ? curr : prev
    );

    return `${prefix}-${nearest}`;
  }

  private async logRefinement(action: string, result: UIRefinementResult): Promise<void> {
    try {
      const logEntry = {
        timestamp: new Date().toISOString(),
        action,
        issuesFound: result.issues.length,
        issuesFixed: result.fixedIssues.length,
        filesModified: result.filesModified.length,
      };

      await fs.appendFile(this.logPath, `${JSON.stringify(logEntry)}\n`);
    } catch {
      // Ignore logging errors
      logger.info('UI refinement completed', { action, result });
    }
  }
}
