import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { event, properties } = await request.json();
    
    // Get client info
    const userAgent = request.headers.get('user-agent') || '';
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const referer = request.headers.get('referer') || '';
    
    // Create analytics record
    const analyticsData = {
      event,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
        userAgent,
        ip: ip.split(',')[0].trim(), // Get first IP if multiple
        referer,
        page: properties?.url || referer,
      }
    };
    
    // Log for debugging (in production, send to analytics service)
    console.log('📊 Analytics Event:', JSON.stringify(analyticsData, null, 2));
    
    // Here you would typically send to your analytics service:
    // - PostHog: await posthog.capture(event, properties)
    // - Mixpanel: await mixpanel.track(event, properties)
    // - Google Analytics: await gtag('event', event, properties)
    // - Custom database: await db.analytics.create(analyticsData)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Event tracked successfully',
      eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    });
    
  } catch (error) {
    console.error('❌ Analytics tracking error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to track event' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    service: 'NeonHub Analytics',
    status: 'operational',
    endpoints: {
      track: 'POST /api/analytics/track',
      health: 'GET /api/analytics/health'
    }
  });
} 