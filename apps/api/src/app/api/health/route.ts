import { NextResponse } from "next/server";
import { ContentAgent, SEOAgent, EmailMarketingAgent } from "@neon/core-agents";
import { logger } from "@neon/utils";

// Initialize agents for health checks
const contentAgent = new ContentAgent();
const seoAgent = new SEOAgent();
const emailAgent = new EmailMarketingAgent();

export async function GET() {
  try {
    const startTime = Date.now();

    // Check database connectivity (if applicable)
    let databaseStatus = "healthy";
    try {
      // Add database ping here if needed
      // await prisma.$queryRaw`SELECT 1`;
    } catch (error) {
      databaseStatus = "unhealthy";
      logger.error("Database health check failed", { error }, "HealthCheck");
    }

    // Check agent statuses
    const agentChecks = await Promise.allSettled([
      contentAgent.getStatus(),
      seoAgent.getStatus(),
      emailAgent.getStatus(),
    ]);

    const agents = {
      content: {
        status:
          agentChecks[0].status === "fulfilled"
            ? agentChecks[0].value.status
            : "error",
        id:
          agentChecks[0].status === "fulfilled"
            ? agentChecks[0].value.id
            : null,
        capabilities:
          agentChecks[0].status === "fulfilled"
            ? agentChecks[0].value.capabilities.length
            : 0,
        lastExecution:
          agentChecks[0].status === "fulfilled"
            ? agentChecks[0].value.lastExecution
            : null,
        performance:
          agentChecks[0].status === "fulfilled"
            ? agentChecks[0].value.performance
            : null,
      },
      seo: {
        status:
          agentChecks[1].status === "fulfilled"
            ? agentChecks[1].value.status
            : "error",
        id:
          agentChecks[1].status === "fulfilled"
            ? agentChecks[1].value.id
            : null,
        capabilities:
          agentChecks[1].status === "fulfilled"
            ? agentChecks[1].value.capabilities.length
            : 0,
        lastExecution:
          agentChecks[1].status === "fulfilled"
            ? agentChecks[1].value.lastExecution
            : null,
        performance:
          agentChecks[1].status === "fulfilled"
            ? agentChecks[1].value.performance
            : null,
      },
      email: {
        status:
          agentChecks[2].status === "fulfilled"
            ? agentChecks[2].value.status
            : "error",
        id:
          agentChecks[2].status === "fulfilled"
            ? agentChecks[2].value.id
            : null,
        capabilities:
          agentChecks[2].status === "fulfilled"
            ? agentChecks[2].value.capabilities.length
            : 0,
        lastExecution:
          agentChecks[2].status === "fulfilled"
            ? agentChecks[2].value.lastExecution
            : null,
        performance:
          agentChecks[2].status === "fulfilled"
            ? agentChecks[2].value.performance
            : null,
      },
    };

    // Check external service connectivity
    const externalServices = {
      openai: process.env.OPENAI_API_KEY ? "configured" : "missing",
      sendgrid: process.env.SENDGRID_API_KEY ? "configured" : "missing",
      vercel: process.env.VERCEL_URL ? "configured" : "local",
    };

    // Determine overall system status
    const agentStatuses = Object.values(agents).map((agent) => agent.status);
    const hasErrorAgent = agentStatuses.includes("error");
    const hasMaintenanceAgent = agentStatuses.includes("maintenance");

    let overallStatus = "healthy";
    if (hasErrorAgent || databaseStatus === "unhealthy") {
      overallStatus = "unhealthy";
    } else if (hasMaintenanceAgent) {
      overallStatus = "degraded";
    }

    const responseTime = Date.now() - startTime;

    const healthData = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      version: process.env.npm_package_version || "1.0.0",
      environment: process.env.NODE_ENV || "development",
      system: {
        uptime: process.uptime(),
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        },
        cpu: process.cpuUsage(),
      },
      database: {
        status: databaseStatus,
      },
      agents,
      externalServices,
      summary: {
        totalAgents: Object.keys(agents).length,
        healthyAgents: agentStatuses.filter((status) => status === "idle")
          .length,
        errorAgents: agentStatuses.filter((status) => status === "error")
          .length,
        runningAgents: agentStatuses.filter((status) => status === "running")
          .length,
        maintenanceAgents: agentStatuses.filter(
          (status) => status === "maintenance",
        ).length,
      },
    };

    // Log health check
    logger.info(
      "Health check completed",
      {
        status: overallStatus,
        responseTime,
        agentSummary: healthData.summary,
      },
      "HealthCheck",
    );

    const statusCode =
      overallStatus === "healthy"
        ? 200
        : overallStatus === "degraded"
          ? 206
          : 503;

    return NextResponse.json(healthData, { status: statusCode });
  } catch (error) {
    logger.error("Health check failed", { error }, "HealthCheck");

    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: "Health check failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 },
    );
  }
}

// Support HEAD requests for simple uptime checks
export async function HEAD() {
  try {
    const agentChecks = await Promise.allSettled([
      contentAgent.getStatus(),
      seoAgent.getStatus(),
      emailAgent.getStatus(),
    ]);

    const hasErrors = agentChecks.some(
      (check) =>
        check.status === "rejected" ||
        (check.status === "fulfilled" && check.value.status === "error"),
    );

    return new NextResponse(null, { status: hasErrors ? 503 : 200 });
  } catch (error) {
    return new NextResponse(null, { status: 503 });
  }
}
