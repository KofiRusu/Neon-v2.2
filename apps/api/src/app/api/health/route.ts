import { NextResponse } from 'next/server';

export async function GET(): Promise<NextResponse> {
  try {
    // For now, we'll skip the database check to get the API working
    // TODO: Add database health check when database is properly configured

    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '0.2.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: 'not configured', // Updated to reflect current state
        api: 'healthy',
      },
      uptime: process.uptime(),
    };

    return NextResponse.json(healthData, { status: 200 });
  } catch (error) {
    const errorData = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '0.2.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: 'error',
        api: 'healthy',
      },
      error: error instanceof Error ? error.message : 'Unknown error',
      uptime: process.uptime(),
    };

    return NextResponse.json(errorData, { status: 503 });
  }
}
