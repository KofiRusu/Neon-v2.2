#!/usr/bin/env node

/**
 * 🏥 NeonHub Health Check Script
 * 
 * Comprehensive health validation for CI/CD pipelines
 * Tests all critical endpoints and system components
 */

const https = require('https');
const http = require('http');
const { performance } = require('perf_hooks');

// Configuration
const CONFIG = {
  baseUrl: process.env.PRODUCTION_URL || 'https://neonhub-production.vercel.app',
  timeout: parseInt(process.env.HEALTH_CHECK_TIMEOUT) || 30000,
  retries: 3,
  thresholds: {
    responseTime: 2000, // 2 seconds
    memoryUsage: 500,   // 500MB
    errorRate: 1,       // 1%
  },
  endpoints: [
    { path: '/', name: 'Homepage', critical: true },
    { path: '/api/health', name: 'API Health', critical: true },
    { path: '/api/trpc/health.ping', name: 'tRPC Health', critical: true },
    { path: '/api/trpc/agents.health', name: 'Agent Health', critical: true },
    { path: '/api/status', name: 'System Status', critical: false },
  ]
};

// Health check results
const results = {
  timestamp: new Date().toISOString(),
  overall: 'unknown',
  endpoints: [],
  performance: {
    averageResponseTime: 0,
    slowestEndpoint: null,
    fastestEndpoint: null,
  },
  system: {
    memoryUsage: 0,
    uptime: 0,
    errorRate: 0,
  },
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    warnings: 0,
  }
};

// Utility functions
function log(message, level = 'info') {
  const colors = {
    info: '\x1b[36m',    // cyan
    success: '\x1b[32m', // green
    warning: '\x1b[33m', // yellow
    error: '\x1b[31m',   // red
    reset: '\x1b[0m'     // reset
  };
  
  const timestamp = new Date().toISOString();
  console.log(`${colors[level]}[${timestamp}] ${message}${colors.reset}`);
}

function makeRequest(url, timeout = CONFIG.timeout) {
  return new Promise((resolve, reject) => {
    const startTime = performance.now();
    const protocol = url.startsWith('https:') ? https : http;
    
    const req = protocol.get(url, {
      timeout: timeout,
      headers: {
        'User-Agent': 'NeonHub-HealthCheck/1.0',
        'Accept': 'application/json, text/html, */*',
      }
    }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const endTime = performance.now();
        const responseTime = Math.round(endTime - startTime);
        
        resolve({
          statusCode: res.statusCode,
          responseTime,
          data: data,
          headers: res.headers,
          success: res.statusCode >= 200 && res.statusCode < 300,
        });
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Request timeout after ${timeout}ms`));
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(timeout);
  });
}

async function checkEndpoint(endpoint) {
  const url = `${CONFIG.baseUrl}${endpoint.path}`;
  let lastError = null;
  
  log(`🔍 Checking ${endpoint.name}: ${url}`);
  
  // Retry logic
  for (let attempt = 1; attempt <= CONFIG.retries; attempt++) {
    try {
      const result = await makeRequest(url);
      
      const endpointResult = {
        name: endpoint.name,
        path: endpoint.path,
        url: url,
        critical: endpoint.critical,
        status: result.success ? 'passed' : 'failed',
        statusCode: result.statusCode,
        responseTime: result.responseTime,
        attempt: attempt,
        data: null,
        error: null,
        warnings: []
      };
      
      // Parse JSON response if possible
      try {
        if (result.data && result.headers['content-type']?.includes('application/json')) {
          endpointResult.data = JSON.parse(result.data);
        }
      } catch (e) {
        // Not JSON, that's okay
      }
      
      // Check response time threshold
      if (result.responseTime > CONFIG.thresholds.responseTime) {
        endpointResult.warnings.push(`Slow response: ${result.responseTime}ms > ${CONFIG.thresholds.responseTime}ms`);
      }
      
      // Success
      if (result.success) {
        log(`✅ ${endpoint.name}: HTTP ${result.statusCode} (${result.responseTime}ms)`, 'success');
        return endpointResult;
      } else {
        endpointResult.error = `HTTP ${result.statusCode}`;
        if (attempt === CONFIG.retries) {
          log(`❌ ${endpoint.name}: HTTP ${result.statusCode} after ${attempt} attempts`, 'error');
          return endpointResult;
        } else {
          log(`⚠️ ${endpoint.name}: HTTP ${result.statusCode}, retrying... (${attempt}/${CONFIG.retries})`, 'warning');
        }
      }
    } catch (error) {
      lastError = error.message;
      if (attempt === CONFIG.retries) {
        log(`❌ ${endpoint.name}: ${error.message} after ${attempt} attempts`, 'error');
        return {
          name: endpoint.name,
          path: endpoint.path,
          url: url,
          critical: endpoint.critical,
          status: 'failed',
          statusCode: 0,
          responseTime: 0,
          attempt: attempt,
          data: null,
          error: error.message,
          warnings: []
        };
      } else {
        log(`⚠️ ${endpoint.name}: ${error.message}, retrying... (${attempt}/${CONFIG.retries})`, 'warning');
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
}

async function extractSystemMetrics() {
  try {
    // Try to get system metrics from the health endpoint
    const healthResult = results.endpoints.find(e => e.name === 'API Health');
    if (healthResult && healthResult.data && healthResult.data.system) {
      const systemData = healthResult.data.system;
      
      results.system.memoryUsage = systemData.memory?.used || 0;
      results.system.uptime = systemData.uptime || 0;
      
      // Check memory threshold
      if (results.system.memoryUsage > CONFIG.thresholds.memoryUsage) {
        log(`⚠️ High memory usage: ${results.system.memoryUsage}MB > ${CONFIG.thresholds.memoryUsage}MB`, 'warning');
        results.summary.warnings++;
      }
      
      log(`📊 System metrics: Memory=${results.system.memoryUsage}MB, Uptime=${Math.round(results.system.uptime/3600)}h`, 'info');
    }
  } catch (error) {
    log(`⚠️ Could not extract system metrics: ${error.message}`, 'warning');
  }
}

function calculatePerformanceMetrics() {
  const responseTimes = results.endpoints
    .filter(e => e.status === 'passed')
    .map(e => e.responseTime);
  
  if (responseTimes.length > 0) {
    results.performance.averageResponseTime = Math.round(
      responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
    );
    
    const slowest = results.endpoints
      .filter(e => e.status === 'passed')
      .reduce((prev, current) => prev.responseTime > current.responseTime ? prev : current);
    
    const fastest = results.endpoints
      .filter(e => e.status === 'passed')
      .reduce((prev, current) => prev.responseTime < current.responseTime ? prev : current);
    
    results.performance.slowestEndpoint = {
      name: slowest.name,
      responseTime: slowest.responseTime
    };
    
    results.performance.fastestEndpoint = {
      name: fastest.name,
      responseTime: fastest.responseTime
    };
  }
}

function generateSummary() {
  results.summary.total = results.endpoints.length;
  results.summary.passed = results.endpoints.filter(e => e.status === 'passed').length;
  results.summary.failed = results.endpoints.filter(e => e.status === 'failed').length;
  
  // Count warnings from all endpoints
  results.summary.warnings += results.endpoints.reduce((total, endpoint) => {
    return total + (endpoint.warnings ? endpoint.warnings.length : 0);
  }, 0);
  
  // Determine overall status
  const criticalFailed = results.endpoints.filter(e => e.critical && e.status === 'failed').length;
  const totalFailed = results.summary.failed;
  
  if (criticalFailed > 0) {
    results.overall = 'critical';
  } else if (totalFailed > 0) {
    results.overall = 'degraded';
  } else if (results.summary.warnings > 0) {
    results.overall = 'warning';
  } else {
    results.overall = 'healthy';
  }
}

function printReport() {
  log('\n🎯 NeonHub Health Check Report', 'info');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info');
  
  // Overall status
  const statusColors = {
    healthy: 'success',
    warning: 'warning',
    degraded: 'warning',
    critical: 'error'
  };
  
  log(`📊 Overall Status: ${results.overall.toUpperCase()}`, statusColors[results.overall]);
  log(`🕐 Timestamp: ${results.timestamp}`, 'info');
  log(`🌐 Base URL: ${CONFIG.baseUrl}`, 'info');
  
  // Summary
  log('\n📋 Summary:', 'info');
  log(`   • Total Endpoints: ${results.summary.total}`, 'info');
  log(`   • Passed: ${results.summary.passed}`, 'success');
  log(`   • Failed: ${results.summary.failed}`, results.summary.failed > 0 ? 'error' : 'info');
  log(`   • Warnings: ${results.summary.warnings}`, results.summary.warnings > 0 ? 'warning' : 'info');
  
  // Performance
  if (results.performance.averageResponseTime > 0) {
    log('\n⚡ Performance:', 'info');
    log(`   • Average Response Time: ${results.performance.averageResponseTime}ms`, 'info');
    if (results.performance.slowestEndpoint) {
      log(`   • Slowest: ${results.performance.slowestEndpoint.name} (${results.performance.slowestEndpoint.responseTime}ms)`, 'info');
    }
    if (results.performance.fastestEndpoint) {
      log(`   • Fastest: ${results.performance.fastestEndpoint.name} (${results.performance.fastestEndpoint.responseTime}ms)`, 'info');
    }
  }
  
  // System metrics
  if (results.system.memoryUsage > 0) {
    log('\n🖥️ System:', 'info');
    log(`   • Memory Usage: ${results.system.memoryUsage}MB`, 'info');
    log(`   • Uptime: ${Math.round(results.system.uptime/3600)}h`, 'info');
  }
  
  // Endpoint details
  log('\n🔍 Endpoint Details:', 'info');
  results.endpoints.forEach(endpoint => {
    const statusIcon = endpoint.status === 'passed' ? '✅' : '❌';
    const criticalTag = endpoint.critical ? '[CRITICAL]' : '';
    log(`   ${statusIcon} ${endpoint.name} ${criticalTag}`, 
        endpoint.status === 'passed' ? 'success' : 'error');
    log(`      • URL: ${endpoint.path}`, 'info');
    log(`      • Status: HTTP ${endpoint.statusCode} (${endpoint.responseTime}ms)`, 'info');
    
    if (endpoint.error) {
      log(`      • Error: ${endpoint.error}`, 'error');
    }
    
    if (endpoint.warnings && endpoint.warnings.length > 0) {
      endpoint.warnings.forEach(warning => {
        log(`      • Warning: ${warning}`, 'warning');
      });
    }
  });
  
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info');
}

async function main() {
  log('🏥 Starting NeonHub Health Check...', 'info');
  log(`🌐 Target: ${CONFIG.baseUrl}`, 'info');
  log(`⏱️ Timeout: ${CONFIG.timeout}ms per request`, 'info');
  log(`🔄 Retries: ${CONFIG.retries} attempts per endpoint`, 'info');
  
  const startTime = performance.now();
  
  try {
    // Check all endpoints
    for (const endpoint of CONFIG.endpoints) {
      const result = await checkEndpoint(endpoint);
      results.endpoints.push(result);
    }
    
    // Extract system metrics
    await extractSystemMetrics();
    
    // Calculate performance metrics
    calculatePerformanceMetrics();
    
    // Generate summary
    generateSummary();
    
    const totalTime = Math.round(performance.now() - startTime);
    log(`\n⏱️ Health check completed in ${totalTime}ms`, 'info');
    
    // Print comprehensive report
    printReport();
    
    // Exit with appropriate code
    if (results.overall === 'critical') {
      log('\n💥 CRITICAL: One or more critical services are down!', 'error');
      process.exit(2);
    } else if (results.overall === 'degraded') {
      log('\n⚠️ DEGRADED: Some services are experiencing issues', 'warning');
      process.exit(1);
    } else if (results.overall === 'warning') {
      log('\n⚠️ WARNING: Performance or minor issues detected', 'warning');
      process.exit(0); // Still considered success for CI/CD
    } else {
      log('\n🎉 SUCCESS: All systems are healthy!', 'success');
      process.exit(0);
    }
    
  } catch (error) {
    log(`💥 Health check failed: ${error.message}`, 'error');
    results.overall = 'critical';
    process.exit(2);
  }
}

// Handle process signals
process.on('SIGINT', () => {
  log('\n🛑 Health check interrupted', 'warning');
  process.exit(130);
});

process.on('SIGTERM', () => {
  log('\n🛑 Health check terminated', 'warning');
  process.exit(143);
});

// Run the health check
if (require.main === module) {
  main().catch(error => {
    log(`💥 Unexpected error: ${error.message}`, 'error');
    process.exit(2);
  });
}

module.exports = { main, CONFIG, results }; 