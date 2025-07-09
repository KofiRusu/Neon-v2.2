/**
 * ErrorSentinel Agent for NeonHub AI Marketing System
 *
 * Continuously monitors all repositories and development environments for:
 * - Build failures
 * - CI issues
 * - Type errors
 * - Misconfigured schemas
 * - Linting issues
 * - Unhandled promises
 *
 * Automatically fixes or triages problems and maintains system-wide execution integrity.
 */

import { AbstractAgent } from "../base-agent";
import type { AgentPayload, AgentResult } from "../base-agent";
import { logger, withLogging } from "@neon/utils";
import { execSync, spawn } from "child_process";
import { promises as fs } from "fs";
import path from "path";
import { z } from "zod";

// Types and schemas
const ErrorSentinelTaskSchema = z.enum([
  "continuous_scan",
  "fix_build_errors",
  "fix_type_errors",
  "fix_lint_errors",
  "fix_schema_errors",
  "fix_ci_errors",
  "fix_unhandled_promises",
  "health_check",
  "emergency_recovery",
  "generate_report",
]);

const MonitoringContextSchema = z.object({
  repositories: z.array(z.string()).optional(),
  workspace: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  autoFix: z.boolean().default(true),
  maxRetries: z.number().default(3),
  emergencyMode: z.boolean().default(false),
});

type ErrorSentinelTask = z.infer<typeof ErrorSentinelTaskSchema>;
type MonitoringContext = z.infer<typeof MonitoringContextSchema>;

interface ErrorDetection {
  type: "build" | "type" | "lint" | "schema" | "ci" | "promise" | "runtime";
  severity: "low" | "medium" | "high" | "critical";
  source: string;
  message: string;
  file?: string;
  line?: number;
  column?: number;
  suggestion?: string;
  autoFixable: boolean;
  timestamp: Date;
}

interface FixResult {
  success: boolean;
  description: string;
  filesModified: string[];
  commandsExecuted: string[];
  timeSpent: number;
  requiresManualIntervention?: boolean;
}

interface MonitoringReport {
  timestamp: Date;
  duration: number;
  errorsDetected: ErrorDetection[];
  errorsFixed: FixResult[];
  systemHealth: "healthy" | "degraded" | "critical";
  recommendations: string[];
  nextScanTime: Date;
}

/**
 * ErrorSentinel Agent - Autonomous Error Detection and Resolution
 */
export class ErrorSentinelAgent extends AbstractAgent {
  private monitoringActive = false;
  private scanInterval: NodeJS.Timeout | null = null;
  private readonly workspaceRoot: string;
  private readonly repositories = [
    "neon-core-agents",
    "neon-data-model",
    "neon-dashboard-ui",
    "neon-api-layer",
    "neon-autotest",
    "neon-devops",
  ];

  constructor(id: string = "error-sentinel", name: string = "ErrorSentinel") {
    super(id, name, "error-sentinel", [
      "continuous_scan",
      "fix_build_errors",
      "fix_type_errors",
      "fix_lint_errors",
      "fix_schema_errors",
      "fix_ci_errors",
      "fix_unhandled_promises",
      "health_check",
      "emergency_recovery",
      "generate_report",
    ]);

    this.workspaceRoot = process.cwd();
  }

  async execute(payload: AgentPayload): Promise<AgentResult> {
    return this.executeWithErrorHandling(payload, async () => {
      const { task, context } = payload;
      const sentinelTask = ErrorSentinelTaskSchema.parse(task);
      const monitoringContext = MonitoringContextSchema.parse(context || {});

      switch (sentinelTask) {
        case "continuous_scan":
          return await this.startContinuousMonitoring(monitoringContext);
        case "fix_build_errors":
          return await this.fixBuildErrors(monitoringContext);
        case "fix_type_errors":
          return await this.fixTypeErrors(monitoringContext);
        case "fix_lint_errors":
          return await this.fixLintErrors(monitoringContext);
        case "fix_schema_errors":
          return await this.fixSchemaErrors(monitoringContext);
        case "fix_ci_errors":
          return await this.fixCIErrors(monitoringContext);
        case "fix_unhandled_promises":
          return await this.fixUnhandledPromises(monitoringContext);
        case "health_check":
          return await this.performHealthCheck(monitoringContext);
        case "emergency_recovery":
          return await this.performEmergencyRecovery(monitoringContext);
        case "generate_report":
          return await this.generateMonitoringReport(monitoringContext);
        default:
          throw new Error(`Unknown ErrorSentinel task: ${task}`);
      }
    });
  }

  /**
   * Start continuous monitoring mode
   */
  private async startContinuousMonitoring(
    context: MonitoringContext,
  ): Promise<MonitoringReport> {
    logger.info("🛰️ ErrorSentinel: Starting continuous monitoring mode", {
      context,
    });

    this.monitoringActive = true;
    const report: MonitoringReport = {
      timestamp: new Date(),
      duration: 0,
      errorsDetected: [],
      errorsFixed: [],
      systemHealth: "healthy",
      recommendations: [],
      nextScanTime: new Date(Date.now() + 30000), // 30 seconds
    };

    const startTime = Date.now();

    try {
      // Initial comprehensive scan
      const errors = await this.scanAllRepositories(context);
      report.errorsDetected = errors;

      // Auto-fix critical errors immediately
      const criticalErrors = errors.filter((e) => e.severity === "critical");
      for (const error of criticalErrors) {
        if (error.autoFixable && context.autoFix) {
          const fix = await this.autoFixError(error, context);
          if (fix.success) {
            report.errorsFixed.push(fix);
          }
        }
      }

      // Schedule continuous monitoring
      this.scheduleNextScan(context);

      report.duration = Date.now() - startTime;
      report.systemHealth = this.assessSystemHealth(errors);
      report.recommendations = this.generateRecommendations(errors);

      logger.info(
        `🛰️ ErrorSentinel: Monitoring active. Found ${errors.length} issues, fixed ${report.errorsFixed.length}`,
        {
          systemHealth: report.systemHealth,
          nextScan: report.nextScanTime,
        },
      );

      return report;
    } catch (error) {
      logger.error("🛰️ ErrorSentinel: Failed to start continuous monitoring", {
        error,
      });
      throw error;
    }
  }

  /**
   * Scan all repositories for errors
   */
  private async scanAllRepositories(
    context: MonitoringContext,
  ): Promise<ErrorDetection[]> {
    const allErrors: ErrorDetection[] = [];
    const repos = context.repositories || this.repositories;

    for (const repo of repos) {
      try {
        const repoPath = path.join(this.workspaceRoot, repo);
        const exists = await fs
          .access(repoPath)
          .then(() => true)
          .catch(() => false);

        if (!exists) {
          // Check common locations
          const possiblePaths = [
            path.join(this.workspaceRoot, "apps", repo.replace("neon-", "")),
            path.join(
              this.workspaceRoot,
              "packages",
              repo.replace("neon-", ""),
            ),
            path.join(this.workspaceRoot, repo.replace("neon-", "")),
          ];

          let found = false;
          for (const possiblePath of possiblePaths) {
            if (
              await fs
                .access(possiblePath)
                .then(() => true)
                .catch(() => false)
            ) {
              const errors = await this.scanRepository(possiblePath, repo);
              allErrors.push(...errors);
              found = true;
              break;
            }
          }

          if (!found) {
            allErrors.push({
              type: "runtime",
              severity: "medium",
              source: repo,
              message: `Repository not found: ${repo}`,
              autoFixable: false,
              timestamp: new Date(),
            });
          }
        } else {
          const errors = await this.scanRepository(repoPath, repo);
          allErrors.push(...errors);
        }
      } catch (error) {
        allErrors.push({
          type: "runtime",
          severity: "high",
          source: repo,
          message: `Failed to scan repository: ${error instanceof Error ? error.message : "Unknown error"}`,
          autoFixable: false,
          timestamp: new Date(),
        });
      }
    }

    return allErrors;
  }

  /**
   * Scan individual repository for errors
   */
  private async scanRepository(
    repoPath: string,
    repoName: string,
  ): Promise<ErrorDetection[]> {
    const errors: ErrorDetection[] = [];

    try {
      // Check if package.json exists
      const packageJsonPath = path.join(repoPath, "package.json");
      const hasPackageJson = await fs
        .access(packageJsonPath)
        .then(() => true)
        .catch(() => false);

      if (!hasPackageJson) {
        errors.push({
          type: "build",
          severity: "high",
          source: repoName,
          message: "Missing package.json",
          file: "package.json",
          autoFixable: false,
          timestamp: new Date(),
        });
        return errors;
      }

      // Run parallel scans for different error types
      const scanPromises = [
        this.scanTypeErrors(repoPath, repoName),
        this.scanLintErrors(repoPath, repoName),
        this.scanBuildErrors(repoPath, repoName),
        this.scanSchemaErrors(repoPath, repoName),
        this.scanUnhandledPromises(repoPath, repoName),
      ];

      const scanResults = await Promise.allSettled(scanPromises);

      scanResults.forEach((result, index) => {
        if (result.status === "fulfilled") {
          errors.push(...result.value);
        } else {
          const scanTypes = ["type", "lint", "build", "schema", "promise"];
          errors.push({
            type: "runtime",
            severity: "medium",
            source: repoName,
            message: `Failed to scan ${scanTypes[index]} errors: ${result.reason}`,
            autoFixable: false,
            timestamp: new Date(),
          });
        }
      });
    } catch (error) {
      errors.push({
        type: "runtime",
        severity: "high",
        source: repoName,
        message: `Repository scan failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        autoFixable: false,
        timestamp: new Date(),
      });
    }

    return errors;
  }

  /**
   * Scan for TypeScript errors
   */
  private async scanTypeErrors(
    repoPath: string,
    repoName: string,
  ): Promise<ErrorDetection[]> {
    const errors: ErrorDetection[] = [];

    try {
      const result = execSync("npm run type-check 2>&1 || true", {
        cwd: repoPath,
        encoding: "utf8",
        timeout: 60000,
      });

      if (result.includes("error TS")) {
        const lines = result.split("\n");
        for (const line of lines) {
          const tsErrorMatch = line.match(
            /(.+\.tsx?)\((\d+),(\d+)\): error TS\d+: (.+)/,
          );
          if (tsErrorMatch) {
            const [, file, lineNum, colNum, message] = tsErrorMatch;
            errors.push({
              type: "type",
              severity: "high",
              source: repoName,
              message: `TypeScript error: ${message}`,
              file: path.relative(repoPath, file),
              line: parseInt(lineNum),
              column: parseInt(colNum),
              autoFixable: this.isTypeErrorAutoFixable(message),
              timestamp: new Date(),
            });
          }
        }
      }
    } catch (error) {
      // Type check command failed
      errors.push({
        type: "type",
        severity: "critical",
        source: repoName,
        message: `Type checking failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        autoFixable: false,
        timestamp: new Date(),
      });
    }

    return errors;
  }

  /**
   * Scan for lint errors
   */
  private async scanLintErrors(
    repoPath: string,
    repoName: string,
  ): Promise<ErrorDetection[]> {
    const errors: ErrorDetection[] = [];

    try {
      const result = execSync("npm run lint 2>&1 || true", {
        cwd: repoPath,
        encoding: "utf8",
        timeout: 30000,
      });

      if (result.includes("error") || result.includes("✖")) {
        const lines = result.split("\n");
        for (const line of lines) {
          const eslintErrorMatch = line.match(
            /(.+\.tsx?):(\d+):(\d+): (.+) \((.+)\)/,
          );
          if (eslintErrorMatch) {
            const [, file, lineNum, colNum, message, rule] = eslintErrorMatch;
            errors.push({
              type: "lint",
              severity: this.getLintSeverity(rule),
              source: repoName,
              message: `ESLint error: ${message}`,
              file: path.relative(repoPath, file),
              line: parseInt(lineNum),
              column: parseInt(colNum),
              suggestion: this.getLintSuggestion(rule),
              autoFixable: this.isLintErrorAutoFixable(rule),
              timestamp: new Date(),
            });
          }
        }
      }
    } catch (error) {
      errors.push({
        type: "lint",
        severity: "medium",
        source: repoName,
        message: `Linting failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        autoFixable: false,
        timestamp: new Date(),
      });
    }

    return errors;
  }

  /**
   * Scan for build errors
   */
  private async scanBuildErrors(
    repoPath: string,
    repoName: string,
  ): Promise<ErrorDetection[]> {
    const errors: ErrorDetection[] = [];

    try {
      const result = execSync("npm run build 2>&1 || true", {
        cwd: repoPath,
        encoding: "utf8",
        timeout: 120000,
      });

      if (
        result.includes("error") ||
        result.includes("ERROR") ||
        result.includes("Failed")
      ) {
        errors.push({
          type: "build",
          severity: "critical",
          source: repoName,
          message: "Build failed",
          suggestion: "Check build logs for specific errors",
          autoFixable: false,
          timestamp: new Date(),
        });
      }
    } catch (error) {
      errors.push({
        type: "build",
        severity: "critical",
        source: repoName,
        message: `Build process failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        autoFixable: false,
        timestamp: new Date(),
      });
    }

    return errors;
  }

  /**
   * Scan for schema errors
   */
  private async scanSchemaErrors(
    repoPath: string,
    repoName: string,
  ): Promise<ErrorDetection[]> {
    const errors: ErrorDetection[] = [];

    try {
      // Check for Prisma schema errors
      const prismaPath = path.join(repoPath, "prisma", "schema.prisma");
      const hasPrisma = await fs
        .access(prismaPath)
        .then(() => true)
        .catch(() => false);

      if (hasPrisma) {
        try {
          execSync("npx prisma validate", {
            cwd: repoPath,
            encoding: "utf8",
            timeout: 30000,
          });
        } catch (error) {
          errors.push({
            type: "schema",
            severity: "high",
            source: repoName,
            message: "Prisma schema validation failed",
            file: "prisma/schema.prisma",
            autoFixable: false,
            timestamp: new Date(),
          });
        }
      }

      // Check for Zod schema issues (basic check)
      const tsFiles = await this.findTypeScriptFiles(repoPath);
      for (const file of tsFiles) {
        const content = await fs.readFile(file, "utf8");
        if (
          content.includes("z.") &&
          content.includes("parse(") &&
          content.includes("throw")
        ) {
          // Basic heuristic for potential Zod validation issues
          const lines = content.split("\n");
          lines.forEach((line, index) => {
            if (
              line.includes("z.") &&
              line.includes("parse") &&
              !line.includes("safeParse")
            ) {
              errors.push({
                type: "schema",
                severity: "medium",
                source: repoName,
                message: "Consider using safeParse for better error handling",
                file: path.relative(repoPath, file),
                line: index + 1,
                suggestion:
                  "Use safeParse instead of parse for better error handling",
                autoFixable: true,
                timestamp: new Date(),
              });
            }
          });
        }
      }
    } catch (error) {
      errors.push({
        type: "schema",
        severity: "medium",
        source: repoName,
        message: `Schema validation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        autoFixable: false,
        timestamp: new Date(),
      });
    }

    return errors;
  }

  /**
   * Scan for unhandled promises
   */
  private async scanUnhandledPromises(
    repoPath: string,
    repoName: string,
  ): Promise<ErrorDetection[]> {
    const errors: ErrorDetection[] = [];

    try {
      const tsFiles = await this.findTypeScriptFiles(repoPath);

      for (const file of tsFiles) {
        const content = await fs.readFile(file, "utf8");
        const lines = content.split("\n");

        lines.forEach((line, index) => {
          // Check for promises without await or .catch()
          if (line.includes("Promise") || line.includes(".then(")) {
            if (
              !line.includes("await") &&
              !line.includes(".catch(") &&
              !line.includes("void ")
            ) {
              errors.push({
                type: "promise",
                severity: "medium",
                source: repoName,
                message: "Potentially unhandled promise",
                file: path.relative(repoPath, file),
                line: index + 1,
                suggestion: "Add await, .catch(), or void operator",
                autoFixable: false,
                timestamp: new Date(),
              });
            }
          }
        });
      }
    } catch (error) {
      errors.push({
        type: "promise",
        severity: "low",
        source: repoName,
        message: `Promise analysis failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        autoFixable: false,
        timestamp: new Date(),
      });
    }

    return errors;
  }

  /**
   * Auto-fix detected errors
   */
  private async autoFixError(
    error: ErrorDetection,
    context: MonitoringContext,
  ): Promise<FixResult> {
    const startTime = Date.now();

    try {
      switch (error.type) {
        case "lint":
          return await this.autoFixLintError(error, context);
        case "type":
          return await this.autoFixTypeError(error, context);
        case "schema":
          return await this.autoFixSchemaError(error, context);
        default:
          return {
            success: false,
            description: `Auto-fix not implemented for ${error.type} errors`,
            filesModified: [],
            commandsExecuted: [],
            timeSpent: Date.now() - startTime,
            requiresManualIntervention: true,
          };
      }
    } catch (fixError) {
      return {
        success: false,
        description: `Auto-fix failed: ${fixError instanceof Error ? fixError.message : "Unknown error"}`,
        filesModified: [],
        commandsExecuted: [],
        timeSpent: Date.now() - startTime,
        requiresManualIntervention: true,
      };
    }
  }

  /**
   * Auto-fix lint errors
   */
  private async autoFixLintError(
    error: ErrorDetection,
    context: MonitoringContext,
  ): Promise<FixResult> {
    const startTime = Date.now();
    const repoPath = this.getRepositoryPath(error.source);

    try {
      execSync("npm run lint:fix", {
        cwd: repoPath,
        encoding: "utf8",
        timeout: 30000,
      });

      return {
        success: true,
        description: "ESLint auto-fix completed",
        filesModified: error.file ? [error.file] : [],
        commandsExecuted: ["npm run lint:fix"],
        timeSpent: Date.now() - startTime,
      };
    } catch (fixError) {
      return {
        success: false,
        description: `ESLint auto-fix failed: ${fixError instanceof Error ? fixError.message : "Unknown error"}`,
        filesModified: [],
        commandsExecuted: ["npm run lint:fix"],
        timeSpent: Date.now() - startTime,
        requiresManualIntervention: true,
      };
    }
  }

  /**
   * Fix build errors in target repositories
   */
  private async fixBuildErrors(
    context: MonitoringContext,
  ): Promise<AgentResult> {
    return withLogging("ErrorSentinelAgent", "fix_build_errors", async () => {
      const startTime = Date.now();
      let totalFixed = 0;
      let totalErrors = 0;
      const results: string[] = [];

      try {
        const repositories = context.repositories || this.repositories;

        for (const repoName of repositories) {
          const repoPath = path.join(this.workspaceRoot, repoName);
          console.log(`[ErrorSentinel] Scanning build errors in ${repoName}`);

          const buildErrors = await this.scanBuildErrors(repoPath, repoName);
          totalErrors += buildErrors.length;

          if (buildErrors.length > 0) {
            results.push(`Found ${buildErrors.length} build errors in ${repoName}`);

            if (context.autoFix) {
              const fixResults = await this.fixBuildErrorsInRepo(
                repoPath,
                buildErrors,
                context,
              );
              totalFixed += fixResults.fixed;
              results.push(
                `Fixed ${fixResults.fixed}/${buildErrors.length} build errors in ${repoName}`,
              );
            }
          }
        }

        const executionTime = Date.now() - startTime;
        const summary = `Build error scan completed: ${totalFixed}/${totalErrors} errors fixed (${executionTime}ms)`;

        return {
          success: true,
          data: {
            totalErrors,
            totalFixed,
            repositories: repositories.length,
            executionTime,
            results,
          },
          message: summary,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Build error fix failed",
          data: {
            totalErrors,
            totalFixed,
            executionTime: Date.now() - startTime,
            results,
          },
        };
      }
    });
  }

  /**
   * Fix TypeScript type errors
   */
  private async fixTypeErrors(
    context: MonitoringContext,
  ): Promise<AgentResult> {
    return withLogging("ErrorSentinelAgent", "fix_type_errors", async () => {
      const startTime = Date.now();
      let totalFixed = 0;
      let totalErrors = 0;
      const results: string[] = [];

      try {
        const repositories = context.repositories || this.repositories;

        for (const repoName of repositories) {
          const repoPath = path.join(this.workspaceRoot, repoName);
          console.log(`[ErrorSentinel] Scanning type errors in ${repoName}`);

          const typeErrors = await this.scanTypeErrors(repoPath, repoName);
          totalErrors += typeErrors.length;

          if (typeErrors.length > 0) {
            results.push(`Found ${typeErrors.length} type errors in ${repoName}`);

            if (context.autoFix) {
              const fixResults = await this.fixTypeErrorsInRepo(
                repoPath,
                typeErrors,
                context,
              );
              totalFixed += fixResults.fixed;
              results.push(
                `Fixed ${fixResults.fixed}/${typeErrors.length} type errors in ${repoName}`,
              );
            }
          }
        }

        const executionTime = Date.now() - startTime;
        const summary = `Type error scan completed: ${totalFixed}/${totalErrors} errors fixed (${executionTime}ms)`;

        return {
          success: true,
          data: {
            totalErrors,
            totalFixed,
            repositories: repositories.length,
            executionTime,
            results,
          },
          message: summary,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Type error fix failed",
          data: {
            totalErrors,
            totalFixed,
            executionTime: Date.now() - startTime,
            results,
          },
        };
      }
    });
  }

  /**
   * Fix linting errors
   */
  private async fixLintErrors(
    context: MonitoringContext,
  ): Promise<AgentResult> {
    return withLogging("ErrorSentinelAgent", "fix_lint_errors", async () => {
      const startTime = Date.now();
      let totalFixed = 0;
      let totalErrors = 0;
      const results: string[] = [];

      try {
        const repositories = context.repositories || this.repositories;

        for (const repoName of repositories) {
          const repoPath = path.join(this.workspaceRoot, repoName);
          console.log(`[ErrorSentinel] Scanning lint errors in ${repoName}`);

          const lintErrors = await this.scanLintErrors(repoPath, repoName);
          totalErrors += lintErrors.length;

          if (lintErrors.length > 0) {
            results.push(`Found ${lintErrors.length} lint errors in ${repoName}`);

            if (context.autoFix) {
              const fixResults = await this.fixLintErrorsInRepo(
                repoPath,
                lintErrors,
                context,
              );
              totalFixed += fixResults.fixed;
              results.push(
                `Fixed ${fixResults.fixed}/${lintErrors.length} lint errors in ${repoName}`,
              );
            }
          }
        }

        const executionTime = Date.now() - startTime;
        const summary = `Lint error scan completed: ${totalFixed}/${totalErrors} errors fixed (${executionTime}ms)`;

        return {
          success: true,
          data: {
            totalErrors,
            totalFixed,
            repositories: repositories.length,
            executionTime,
            results,
          },
          message: summary,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Lint error fix failed",
          data: {
            totalErrors,
            totalFixed,
            executionTime: Date.now() - startTime,
            results,
          },
        };
      }
    });
  }

  /**
   * Fix schema configuration errors
   */
  private async fixSchemaErrors(
    context: MonitoringContext,
  ): Promise<AgentResult> {
    return withLogging("ErrorSentinelAgent", "fix_schema_errors", async () => {
      const startTime = Date.now();
      let totalFixed = 0;
      let totalErrors = 0;
      const results: string[] = [];

      try {
        const repositories = context.repositories || this.repositories;

        for (const repoName of repositories) {
          const repoPath = path.join(this.workspaceRoot, repoName);
          console.log(`[ErrorSentinel] Scanning schema errors in ${repoName}`);

          const schemaErrors = await this.scanSchemaErrors(repoPath, repoName);
          totalErrors += schemaErrors.length;

          if (schemaErrors.length > 0) {
            results.push(
              `Found ${schemaErrors.length} schema errors in ${repoName}`,
            );

            if (context.autoFix) {
              const fixResults = await this.fixSchemaErrorsInRepo(
                repoPath,
                schemaErrors,
                context,
              );
              totalFixed += fixResults.fixed;
              results.push(
                `Fixed ${fixResults.fixed}/${schemaErrors.length} schema errors in ${repoName}`,
              );
            }
          }
        }

        const executionTime = Date.now() - startTime;
        const summary = `Schema error scan completed: ${totalFixed}/${totalErrors} errors fixed (${executionTime}ms)`;

        return {
          success: true,
          data: {
            totalErrors,
            totalFixed,
            repositories: repositories.length,
            executionTime,
            results,
          },
          message: summary,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Schema error fix failed",
          data: {
            totalErrors,
            totalFixed,
            executionTime: Date.now() - startTime,
            results,
          },
        };
      }
    });
  }

  /**
   * Fix CI/CD pipeline errors
   */
  private async fixCIErrors(context: MonitoringContext): Promise<AgentResult> {
    return withLogging("ErrorSentinelAgent", "fix_ci_errors", async () => {
      const startTime = Date.now();
      let totalFixed = 0;
      let totalErrors = 0;
      const results: string[] = [];

      try {
        const repositories = context.repositories || this.repositories;

        for (const repoName of repositories) {
          const repoPath = path.join(this.workspaceRoot, repoName);
          console.log(`[ErrorSentinel] Scanning CI errors in ${repoName}`);

          const ciErrors = await this.scanCIErrors(repoPath, repoName);
          totalErrors += ciErrors.length;

          if (ciErrors.length > 0) {
            results.push(`Found ${ciErrors.length} CI errors in ${repoName}`);

            if (context.autoFix) {
              const fixResults = await this.fixCIErrorsInRepo(
                repoPath,
                ciErrors,
                context,
              );
              totalFixed += fixResults.fixed;
              results.push(
                `Fixed ${fixResults.fixed}/${ciErrors.length} CI errors in ${repoName}`,
              );
            }
          }
        }

        const executionTime = Date.now() - startTime;
        const summary = `CI error scan completed: ${totalFixed}/${totalErrors} errors fixed (${executionTime}ms)`;

        return {
          success: true,
          data: {
            totalErrors,
            totalFixed,
            repositories: repositories.length,
            executionTime,
            results,
          },
          message: summary,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "CI error fix failed",
          data: {
            totalErrors,
            totalFixed,
            executionTime: Date.now() - startTime,
            results,
          },
        };
      }
    });
  }

  /**
   * Fix unhandled promise rejections
   */
  private async fixUnhandledPromises(
    context: MonitoringContext,
  ): Promise<AgentResult> {
    return withLogging("ErrorSentinelAgent", "fix_unhandled_promises", async () => {
      const startTime = Date.now();
      let totalFixed = 0;
      let totalErrors = 0;
      const results: string[] = [];

      try {
        const repositories = context.repositories || this.repositories;

        for (const repoName of repositories) {
          const repoPath = path.join(this.workspaceRoot, repoName);
          console.log(`[ErrorSentinel] Scanning unhandled promises in ${repoName}`);

          const promiseErrors = await this.scanUnhandledPromises(
            repoPath,
            repoName,
          );
          totalErrors += promiseErrors.length;

          if (promiseErrors.length > 0) {
            results.push(
              `Found ${promiseErrors.length} unhandled promises in ${repoName}`,
            );

            if (context.autoFix) {
              const fixResults = await this.fixUnhandledPromisesInRepo(
                repoPath,
                promiseErrors,
                context,
              );
              totalFixed += fixResults.fixed;
              results.push(
                `Fixed ${fixResults.fixed}/${promiseErrors.length} unhandled promises in ${repoName}`,
              );
            }
          }
        }

        const executionTime = Date.now() - startTime;
        const summary = `Promise error scan completed: ${totalFixed}/${totalErrors} errors fixed (${executionTime}ms)`;

        return {
          success: true,
          data: {
            totalErrors,
            totalFixed,
            repositories: repositories.length,
            executionTime,
            results,
          },
          message: summary,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Promise error fix failed",
          data: {
            totalErrors,
            totalFixed,
            executionTime: Date.now() - startTime,
            results,
          },
        };
      }
    });
  }

  /**
   * Perform system health check
   */
  private async performHealthCheck(
    context: MonitoringContext,
  ): Promise<AgentResult> {
    return withLogging("ErrorSentinelAgent", "health_check", async () => {
      const startTime = Date.now();
      const healthChecks: any[] = [];

      try {
        const repositories = context.repositories || this.repositories;

        for (const repoName of repositories) {
          const repoPath = path.join(this.workspaceRoot, repoName);
          console.log(`[ErrorSentinel] Health check for ${repoName}`);

          const repoHealth = await this.checkRepositoryHealth(
            repoPath,
            repoName,
          );
          healthChecks.push(repoHealth);
        }

        const executionTime = Date.now() - startTime;
        const overallHealth = this.calculateOverallHealth(healthChecks);

        return {
          success: true,
          data: {
            overallHealth,
            repositoryHealths: healthChecks,
            executionTime,
            timestamp: new Date().toISOString(),
          },
          message: `Health check completed: ${overallHealth.status} (${executionTime}ms)`,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Health check failed",
          data: {
            healthChecks,
            executionTime: Date.now() - startTime,
          },
        };
      }
    });
  }

  /**
   * Perform emergency recovery procedures
   */
  private async performEmergencyRecovery(
    context: MonitoringContext,
  ): Promise<AgentResult> {
    return withLogging("ErrorSentinelAgent", "emergency_recovery", async () => {
      const startTime = Date.now();
      const recoveryActions: string[] = [];

      try {
        console.log("[ErrorSentinel] Emergency recovery initiated");

        // Stop all running processes
        recoveryActions.push("Stopping all running processes");
        await this.stopAllProcesses();

        // Clear temporary files
        recoveryActions.push("Clearing temporary files");
        await this.clearTemporaryFiles();

        // Reset configuration to defaults
        recoveryActions.push("Resetting configuration to defaults");
        await this.resetConfiguration();

        // Restart critical services
        recoveryActions.push("Restarting critical services");
        await this.restartCriticalServices();

        // Verify system integrity
        recoveryActions.push("Verifying system integrity");
        const integrityCheck = await this.verifySystemIntegrity();

        const executionTime = Date.now() - startTime;

        return {
          success: integrityCheck.success,
          data: {
            recoveryActions,
            integrityCheck,
            executionTime,
            timestamp: new Date().toISOString(),
          },
          message: `Emergency recovery ${integrityCheck.success ? "completed successfully" : "failed"} (${executionTime}ms)`,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Emergency recovery failed",
          data: {
            recoveryActions,
            executionTime: Date.now() - startTime,
          },
        };
      }
    });
  }

  /**
   * Generate comprehensive monitoring report
   */
  private async generateMonitoringReport(
    context: MonitoringContext,
  ): Promise<AgentResult> {
    return withLogging("ErrorSentinelAgent", "generate_report", async () => {
      const startTime = Date.now();

      try {
        const repositories = context.repositories || this.repositories;
        const reportData: any = {
          timestamp: new Date().toISOString(),
          repositories: [],
          summary: {
            totalRepositories: repositories.length,
            totalErrors: 0,
            totalFixed: 0,
            criticalIssues: 0,
            recommendations: [],
          },
        };

        for (const repoName of repositories) {
          const repoPath = path.join(this.workspaceRoot, repoName);
          console.log(`[ErrorSentinel] Generating report for ${repoName}`);

          const repoReport = await this.generateRepositoryReport(
            repoPath,
            repoName,
          );
          reportData.repositories.push(repoReport);

          // Aggregate statistics
          reportData.summary.totalErrors += repoReport.totalErrors;
          reportData.summary.totalFixed += repoReport.totalFixed;
          reportData.summary.criticalIssues += repoReport.criticalIssues;
        }

        // Generate recommendations
        reportData.summary.recommendations = this.generateRecommendations(
          reportData.repositories,
        );

        const executionTime = Date.now() - startTime;
        reportData.executionTime = executionTime;

        return {
          success: true,
          data: reportData,
          message: `Monitoring report generated for ${repositories.length} repositories (${executionTime}ms)`,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Report generation failed",
          data: {
            executionTime: Date.now() - startTime,
          },
        };
      }
    });
  }

  // Helper methods

  private scheduleNextScan(context: MonitoringContext): void {
    if (this.scanInterval) {
      clearTimeout(this.scanInterval);
    }

    const interval = context.priority === "critical" ? 15000 : 30000; // 15s or 30s

    this.scanInterval = setTimeout(async () => {
      if (this.monitoringActive) {
        try {
          await this.startContinuousMonitoring(context);
        } catch (error) {
          logger.error("🛰️ ErrorSentinel: Scheduled scan failed", { error });
        }
      }
    }, interval);
  }

  private assessSystemHealth(
    errors: ErrorDetection[],
  ): "healthy" | "degraded" | "critical" {
    const criticalErrors = errors.filter(
      (e) => e.severity === "critical",
    ).length;
    const highErrors = errors.filter((e) => e.severity === "high").length;

    if (criticalErrors > 0) return "critical";
    if (highErrors > 3) return "degraded";
    return "healthy";
  }

  private generateRecommendations(errors: ErrorDetection[]): string[] {
    const recommendations: string[] = [];

    const errorsByType = errors.reduce(
      (acc, error) => {
        acc[error.type] = (acc[error.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    Object.entries(errorsByType).forEach(([type, count]) => {
      if (count > 5) {
        recommendations.push(
          `High ${type} error count (${count}). Consider code review or refactoring.`,
        );
      }
    });

    const criticalErrors = errors.filter((e) => e.severity === "critical");
    if (criticalErrors.length > 0) {
      recommendations.push(
        "Critical errors detected. Immediate attention required.",
      );
    }

    return recommendations;
  }

  private async findTypeScriptFiles(dirPath: string): Promise<string[]> {
    const files: string[] = [];

    try {
      const items = await fs.readdir(dirPath, { withFileTypes: true });

      for (const item of items) {
        const fullPath = path.join(dirPath, item.name);

        if (
          item.isDirectory() &&
          !item.name.startsWith(".") &&
          item.name !== "node_modules"
        ) {
          const subFiles = await this.findTypeScriptFiles(fullPath);
          files.push(...subFiles);
        } else if (
          item.isFile() &&
          (item.name.endsWith(".ts") || item.name.endsWith(".tsx"))
        ) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Directory access failed, skip
    }

    return files;
  }

  private getRepositoryPath(repoName: string): string {
    const possiblePaths = [
      path.join(this.workspaceRoot, repoName),
      path.join(this.workspaceRoot, "apps", repoName.replace("neon-", "")),
      path.join(this.workspaceRoot, "packages", repoName.replace("neon-", "")),
      path.join(this.workspaceRoot, repoName.replace("neon-", "")),
    ];

    for (const possiblePath of possiblePaths) {
      try {
        if (require("fs").existsSync(possiblePath)) {
          return possiblePath;
        }
      } catch (error) {
        // Continue to next path
      }
    }

    return this.workspaceRoot; // Fallback
  }

  private isTypeErrorAutoFixable(message: string): boolean {
    const autoFixablePatterns = [
      "missing return type",
      "implicit any",
      "unused variable",
      "missing import",
    ];

    return autoFixablePatterns.some((pattern) =>
      message.toLowerCase().includes(pattern),
    );
  }

  private isLintErrorAutoFixable(rule: string): boolean {
    const autoFixableRules = [
      "quotes",
      "semi",
      "indent",
      "comma-dangle",
      "trailing-comma",
      "no-extra-semi",
      "space-before-function-paren",
    ];

    return autoFixableRules.some((fixableRule) => rule.includes(fixableRule));
  }

  private getLintSeverity(
    rule: string,
  ): "low" | "medium" | "high" | "critical" {
    const highSeverityRules = ["no-unused-vars", "no-undef", "no-unreachable"];
    const mediumSeverityRules = ["prefer-const", "no-var", "eqeqeq"];

    if (highSeverityRules.some((r) => rule.includes(r))) return "high";
    if (mediumSeverityRules.some((r) => rule.includes(r))) return "medium";
    return "low";
  }

  private getLintSuggestion(rule: string): string {
    const suggestions: Record<string, string> = {
      "no-unused-vars": "Remove unused variables or prefix with underscore",
      "prefer-const": "Use const instead of let for non-reassigned variables",
      "no-var": "Use let or const instead of var",
      eqeqeq: "Use === instead of ==",
      quotes: "Use consistent quote style",
      semi: "Add missing semicolons",
    };

    for (const [rulePattern, suggestion] of Object.entries(suggestions)) {
      if (rule.includes(rulePattern)) {
        return suggestion;
      }
    }

    return "Check ESLint documentation for this rule";
  }

  private async autoFixTypeError(
    error: ErrorDetection,
    context: MonitoringContext,
  ): Promise<FixResult> {
    const startTime = Date.now();

    // Basic type error fixes would go here
    // For now, return a placeholder
    return {
      success: false,
      description: "Type error auto-fix not yet implemented",
      filesModified: [],
      commandsExecuted: [],
      timeSpent: Date.now() - startTime,
      requiresManualIntervention: true,
    };
  }

  private async autoFixSchemaError(
    error: ErrorDetection,
    context: MonitoringContext,
  ): Promise<FixResult> {
    const startTime = Date.now();

    if (error.suggestion?.includes("safeParse") && error.file) {
      try {
        const filePath = path.join(
          this.getRepositoryPath(error.source),
          error.file,
        );
        const content = await fs.readFile(filePath, "utf8");

        // Replace .parse( with .safeParse(
        const fixedContent = content.replace(/\.parse\(/g, ".safeParse(");

        if (fixedContent !== content) {
          await fs.writeFile(filePath, fixedContent);

          return {
            success: true,
            description:
              "Replaced parse with safeParse for better error handling",
            filesModified: [error.file],
            commandsExecuted: [],
            timeSpent: Date.now() - startTime,
          };
        }
      } catch (fixError) {
        return {
          success: false,
          description: `Schema fix failed: ${fixError instanceof Error ? fixError.message : "Unknown error"}`,
          filesModified: [],
          commandsExecuted: [],
          timeSpent: Date.now() - startTime,
          requiresManualIntervention: true,
        };
      }
    }

    return {
      success: false,
      description: "Schema error auto-fix not applicable",
      filesModified: [],
      commandsExecuted: [],
      timeSpent: Date.now() - startTime,
      requiresManualIntervention: true,
    };
  }

  /**
   * Stop continuous monitoring
   */
  public stopMonitoring(): void {
    this.monitoringActive = false;
    if (this.scanInterval) {
      clearTimeout(this.scanInterval);
      this.scanInterval = null;
    }
    logger.info("🛰️ ErrorSentinel: Continuous monitoring stopped");
  }
}
