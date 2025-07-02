# 📊 **NeonHub Monitoring Guide**
## System Health, Performance & Alerting

![Monitoring](https://img.shields.io/badge/Monitoring-Production%20Ready-green?style=for-the-badge)
![Uptime](https://img.shields.io/badge/Target%20Uptime-99.9%25-brightgreen?style=for-the-badge)

> **Comprehensive monitoring setup for NeonHub production deployment with health checks, performance tracking, and automated alerting.**

---

## 📋 **Table of Contents**

- [🏥 Health Checks](#-health-checks)
- [📊 Performance Metrics](#-performance-metrics)
- [🚨 Alerting & Notifications](#-alerting--notifications)
- [📈 Uptime Monitoring](#-uptime-monitoring)
- [🔧 Error Tracking](#-error-tracking)
- [📱 Dashboard Setup](#-dashboard-setup)
- [🔄 Automated Monitoring](#-automated-monitoring)
- [🛠️ Troubleshooting](#️-troubleshooting)

---

## 🏥 **Health Checks**

### **Primary Health Endpoint**
```bash
GET /api/trpc/health.ping
```

**Expected Response:**
```json
{
  "result": {
    "data": {
      "message": "pong",
      "timestamp": "2024-01-01T00:00:00.000Z",
      "status": "healthy"
    }
  }
}
```

**Status Indicators:**
- ✅ **200 OK**: System operational
- ⚠️ **5xx Error**: System degraded/down
- ❌ **Timeout**: System unresponsive

### **Comprehensive System Status**
```bash
GET /api/status
```

**Health Metrics Included:**
```json
{
  "status": "healthy",
  "health": {
    "api": true,        // API endpoints responding
    "database": true,   // Database connectivity 
    "memory": true,     // Memory usage within limits
    "response": true    // Response times acceptable
  },
  "performance": {
    "responseTime": 15,   // ms
    "memoryUsage": {
      "used": 48,         // MB
      "total": 64,        // MB  
      "external": 1       // MB
    },
    "uptime": {
      "seconds": 86400,
      "formatted": "1d 0h 0m 0s"
    }
  }
}
```

### **Critical Endpoints to Monitor**
```bash
# Core functionality
GET /api/trpc/health.ping
GET /api/status
GET /api/trpc/user.getProfile
GET /api/trpc/agents.getAll

# Application pages
GET /                    # Homepage
GET /campaigns          # Campaign management
GET /analytics          # Analytics dashboard
GET /agents             # Agent management
```

---

## 📊 **Performance Metrics**

### **Response Time Targets**
- **Health Check**: < 100ms
- **API Endpoints**: < 500ms
- **Page Load**: < 2 seconds
- **Database Queries**: < 300ms

### **Resource Usage Limits**
- **Memory**: < 500MB heap usage
- **CPU**: < 80% sustained usage
- **Storage**: < 85% disk usage

### **Performance Monitoring Commands**
```bash
# Response time test
time curl -s https://your-domain.com/api/trpc/health.ping

# Load test (basic)
for i in {1..10}; do
  curl -s -w "%{time_total}\n" https://your-domain.com/api/status
done

# Memory monitoring
curl -s https://your-domain.com/api/status | jq '.performance.memoryUsage'
```

### **Lighthouse Performance Audit**
```bash
# Generate performance report
npx lighthouse https://your-domain.com --output html --output json --output-path ./performance-audit

# Key metrics to track:
# - First Contentful Paint: < 1.8s
# - Largest Contentful Paint: < 2.5s  
# - Cumulative Layout Shift: < 0.1
# - Total Blocking Time: < 200ms
```

---

## 🚨 **Alerting & Notifications**

### **Built-in Alert System**
```bash
# Send test alert via API
curl -X POST https://your-domain.com/api/trpc/support.sendAlert \
  -H "Content-Type: application/json" \
  -d '{
    "type": "email",
    "recipient": "ops@yourcompany.com",
    "subject": "System Alert",
    "message": "Performance threshold exceeded",
    "urgency": "high"
  }'
```

### **Alert Triggers**
- **Response Time > 2s**: Performance degradation
- **Memory Usage > 80%**: Resource exhaustion warning
- **Error Rate > 5%**: System instability
- **Uptime < 99%**: Availability issues

### **Notification Channels**
- **Email**: Immediate notifications for critical issues
- **SMS**: High-priority alerts (optional)
- **Slack/Discord**: Team notifications
- **PagerDuty**: On-call escalation

---

## 📈 **Uptime Monitoring**

### **Recommended Services**

#### **UptimeRobot (Free/Paid)**
```bash
# Monitor these URLs:
https://your-domain.com/api/trpc/health.ping
https://your-domain.com/api/status
https://your-domain.com/
```

**Configuration:**
- Check Interval: 5 minutes
- Timeout: 30 seconds
- Alert Contacts: Email, SMS, Slack

#### **Pingdom (Paid)**
```bash
# Advanced monitoring with:
# - Real User Monitoring (RUM)
# - Transaction monitoring
# - Page speed insights
```

#### **StatusCake (Free/Paid)**
```bash
# Features:
# - SSL certificate monitoring
# - Domain expiry tracking
# - Virus scanning
```

### **Custom Health Check Script**
```bash
#!/bin/bash
# health-check.sh

DOMAIN="https://your-domain.com"
ENDPOINTS=(
  "/api/trpc/health.ping"
  "/api/status"
  "/"
)

for endpoint in "${ENDPOINTS[@]}"; do
  response=$(curl -s -o /dev/null -w "%{http_code}" "$DOMAIN$endpoint")
  if [ $response -ne 200 ]; then
    echo "ALERT: $endpoint returned $response"
    # Send notification here
  else
    echo "OK: $endpoint"
  fi
done
```

**Cron Schedule:**
```bash
# Run every 5 minutes
*/5 * * * * /path/to/health-check.sh
```

---

## 🔧 **Error Tracking**

### **Error Monitoring Setup**

#### **Sentry Integration**
```bash
npm install @sentry/nextjs
```

```typescript
// next.config.js
const { withSentryConfig } = require('@sentry/nextjs');

const nextConfig = {
  // ... existing config
};

module.exports = withSentryConfig(nextConfig, {
  silent: true,
  org: "your-org",
  project: "neonhub",
});
```

```typescript
// sentry.client.config.js
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
});
```

#### **LogRocket Integration**
```typescript
// pages/_app.tsx
import LogRocket from 'logrocket';

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  LogRocket.init('your-app-id');
}
```

### **Error Categories to Track**
- **API Errors**: 4xx/5xx responses
- **JavaScript Errors**: Frontend exceptions
- **Performance Issues**: Slow queries/renders
- **User Experience**: Failed interactions

---

## 📱 **Dashboard Setup**

### **Grafana Dashboard**
```yaml
# docker-compose.yml
version: '3.8'
services:
  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana-data:/var/lib/grafana
```

**Key Panels:**
- System uptime and availability
- Response time trends
- Memory and CPU usage
- Error rate monitoring
- Active user sessions

### **Simple Status Page**
```html
<!-- status.html -->
<!DOCTYPE html>
<html>
<head>
    <title>NeonHub Status</title>
    <style>
        .status { padding: 20px; font-family: Arial; }
        .healthy { color: green; }
        .degraded { color: orange; }
        .down { color: red; }
    </style>
</head>
<body>
    <div class="status">
        <h1>NeonHub System Status</h1>
        <div id="status-display">Loading...</div>
    </div>
    
    <script>
        async function checkStatus() {
            try {
                const response = await fetch('/api/status');
                const status = await response.json();
                document.getElementById('status-display').innerHTML = `
                    <div class="${status.status}">
                        <h2>Status: ${status.status.toUpperCase()}</h2>
                        <p>Response Time: ${status.performance.responseTime}ms</p>
                        <p>Uptime: ${status.performance.uptime.formatted}</p>
                        <p>Memory Usage: ${status.performance.memoryUsage.used}MB</p>
                    </div>
                `;
            } catch (error) {
                document.getElementById('status-display').innerHTML = 
                    '<div class="down"><h2>STATUS: DOWN</h2></div>';
            }
        }
        
        checkStatus();
        setInterval(checkStatus, 30000); // Refresh every 30 seconds
    </script>
</body>
</html>
```

---

## 🔄 **Automated Monitoring**

### **GitHub Actions Health Check**
```yaml
# .github/workflows/health-check.yml
name: Production Health Check

on:
  schedule:
    - cron: '*/15 * * * *'  # Every 15 minutes
  workflow_dispatch:

jobs:
  health-check:
    runs-on: ubuntu-latest
    
    steps:
      - name: Check API Health
        run: |
          response=$(curl -s -o /dev/null -w "%{http_code}" https://your-domain.com/api/trpc/health.ping)
          if [ $response -ne 200 ]; then
            echo "Health check failed with status $response"
            exit 1
          fi
          
      - name: Check System Status
        run: |
          curl -s https://your-domain.com/api/status | jq '.status' | grep -q "healthy"
          
      - name: Notify on Failure
        if: failure()
        uses: 8398a7/action-slack@v3
        with:
          status: failure
          text: "🚨 NeonHub health check failed!"
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

### **Vercel Monitoring**
```typescript
// vercel.json
{
  "functions": {
    "pages/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "crons": [
    {
      "path": "/api/cron/health-check",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

```typescript
// pages/api/cron/health-check.ts
export default async function handler(req: Request) {
  // Perform internal health checks
  const checks = await Promise.all([
    checkDatabase(),
    checkAPIs(),
    checkMemory()
  ]);
  
  const failed = checks.filter(check => !check.healthy);
  
  if (failed.length > 0) {
    // Send alert
    await sendAlert({
      type: 'email',
      recipient: 'ops@yourcompany.com',
      message: `Health check failed: ${failed.map(f => f.service).join(', ')}`,
      urgency: 'high'
    });
  }
  
  return new Response(JSON.stringify({ status: 'ok', checks }));
}
```

---

## 🛠️ **Troubleshooting**

### **Common Issues & Solutions**

#### **High Response Times**
```bash
# Check system status
curl https://your-domain.com/api/status

# Analyze slow endpoints
time curl -v https://your-domain.com/slow-endpoint

# Monitor memory usage
curl -s https://your-domain.com/api/status | jq '.performance.memoryUsage'
```

**Solutions:**
- Scale Vercel functions
- Optimize database queries
- Enable caching
- Check external API dependencies

#### **Memory Leaks**
```bash
# Monitor memory trends
watch -n 5 'curl -s https://your-domain.com/api/status | jq ".performance.memoryUsage"'
```

**Solutions:**
- Restart application (temporary)
- Review event listener cleanup
- Check for circular references
- Profile with Node.js debugging tools

#### **API Timeouts**
```bash
# Test with timeout
curl --max-time 5 https://your-domain.com/api/trpc/health.ping
```

**Solutions:**
- Increase function timeout limits
- Add request timeouts
- Implement retry logic
- Check network connectivity

### **Emergency Response Plan**

#### **System Down (5xx Errors)**
1. **Immediate**: Check Vercel dashboard for deployment issues
2. **Rollback**: Revert to last known good deployment
3. **Investigate**: Check logs for error patterns
4. **Communicate**: Update status page and notify users

#### **Performance Degradation**
1. **Monitor**: Check resource usage and response times
2. **Scale**: Increase Vercel function concurrency if needed
3. **Optimize**: Identify and fix performance bottlenecks
4. **Alert**: Notify team of performance issues

#### **Database Issues**
1. **Check**: Database provider status (Railway/PlanetScale)
2. **Fallback**: Use cached data where possible
3. **Fix**: Address connection or query issues
4. **Restore**: Resume normal database operations

---

## 📈 **Monitoring Checklist**

### **Daily Monitoring**
- [ ] Check uptime monitoring dashboard
- [ ] Review error rates and alerts
- [ ] Monitor response time trends
- [ ] Check resource usage patterns

### **Weekly Monitoring**  
- [ ] Review performance metrics
- [ ] Analyze user behavior patterns
- [ ] Check lighthouse audit scores
- [ ] Review capacity planning needs

### **Monthly Monitoring**
- [ ] Comprehensive performance review
- [ ] Update monitoring thresholds
- [ ] Review incident response procedures
- [ ] Plan infrastructure improvements

---

## 🎯 **Monitoring Targets**

### **Availability**
- **Target**: 99.9% uptime
- **Measurement**: External uptime monitoring
- **Alert**: < 99% over 24h period

### **Performance**
- **API Response**: < 500ms (95th percentile)
- **Page Load**: < 2s (95th percentile)
- **Error Rate**: < 1% of requests

### **Resource Usage**
- **Memory**: < 400MB average usage
- **CPU**: < 70% sustained usage
- **Storage**: < 80% disk usage

---

**📊 Complete Monitoring Setup for NeonHub AI Marketing Platform**

**Questions?** Contact the operations team or check our runbook for detailed procedures. 