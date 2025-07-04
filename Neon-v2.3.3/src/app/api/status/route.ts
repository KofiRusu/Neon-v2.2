import { NextResponse } from "next/server";

export async function GET() {
  try {
    const startTime = Date.now();

    // System information
    const systemInfo = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      env: process.env.NODE_ENV,
      nodeVersion: process.version,
      platform: process.platform,
      pid: process.pid,
    };

    // Health checks
    const healthChecks = {
      api: true, // This endpoint working means API is up
      database: await checkDatabase(),
      memory: checkMemoryUsage(),
      response: true,
    };

    // Performance metrics
    const performance = {
      responseTime: Date.now() - startTime,
      memoryUsage: {
        used: Math.round(systemInfo.memory.heapUsed / 1024 / 1024),
        total: Math.round(systemInfo.memory.heapTotal / 1024 / 1024),
        external: Math.round(systemInfo.memory.external / 1024 / 1024),
      },
      uptime: {
        seconds: Math.floor(systemInfo.uptime),
        formatted: formatUptime(systemInfo.uptime),
      },
    };

    // Application status
    const application = {
      name: "NeonHub",
      version: "1.0.0",
      build: process.env.VERCEL_GIT_COMMIT_SHA || "local",
      deployment: process.env.VERCEL_URL || "localhost",
      region: process.env.VERCEL_REGION || "local",
    };

    const status = {
      status: "healthy",
      timestamp: systemInfo.timestamp,
      system: systemInfo,
      health: healthChecks,
      performance,
      application,
      endpoints: {
        health: "/api/trpc/health.ping",
        analytics: "/api/analytics/track",
        status: "/api/status",
      },
    };

    return NextResponse.json(status);
  } catch (error) {
    console.error("❌ Status check error:", error);
    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        error: "Status check failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

async function checkDatabase(): Promise<boolean> {
  try {
    // For production, you would check actual database connectivity
    // const result = await db.$queryRaw`SELECT 1`;
    return true; // Mock success for now
  } catch (error) {
    console.error("Database health check failed:", error);
    return false;
  }
}

function checkMemoryUsage(): boolean {
  const memory = process.memoryUsage();
  const usedMB = memory.heapUsed / 1024 / 1024;
  // Flag if using more than 500MB (adjust threshold as needed)
  return usedMB < 500;
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (days > 0) return `${days}d ${hours}h ${minutes}m ${secs}s`;
  if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}s`;
}
