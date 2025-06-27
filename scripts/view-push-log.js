#!/usr/bin/env node

const fs = require('fs');

const PUSH_LOG_FILE = '.pushlog';

function formatDuration(start, end) {
  const duration = new Date(end) - new Date(start);
  return `${duration}ms`;
}

function formatTimestamp(timestamp) {
  return new Date(timestamp).toLocaleString();
}

function analyzeLogs(logs) {
  const total = logs.length;
  const passed = logs.filter(l => l.success).length;
  const blocked = total - passed;
  const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;

  const users = [...new Set(logs.map(l => l.user))];
  const recentBlocks = logs.filter(l => !l.success).slice(-5);

  return {
    total,
    passed,
    blocked,
    passRate,
    users,
    recentBlocks,
  };
}

function main() {
  console.log('📊 NeonHub Git Push Protection Log');
  console.log('==================================');

  if (!fs.existsSync(PUSH_LOG_FILE)) {
    console.log('📄 No push log found. Push protection not yet active.');
    return;
  }

  let logs = [];
  try {
    logs = JSON.parse(fs.readFileSync(PUSH_LOG_FILE, 'utf8'));
  } catch (error) {
    console.error('❌ Error reading push log:', error.message);
    return;
  }

  const stats = analyzeLogs(logs);

  console.log(`\n📈 Statistics:`);
  console.log(`   Total pushes: ${stats.total}`);
  console.log(`   ✅ Passed: ${stats.passed}`);
  console.log(`   ❌ Blocked: ${stats.blocked}`);
  console.log(`   📊 Pass rate: ${stats.passRate}%`);
  console.log(`   👥 Active users: ${stats.users.length} (${stats.users.join(', ')})`);

  if (stats.recentBlocks.length > 0) {
    console.log(`\n🚫 Recent blocks:`);
    stats.recentBlocks.forEach((block, i) => {
      console.log(`   ${i + 1}. ${block.user} at ${formatTimestamp(block.timestamp)}`);
      block.errors.slice(0, 2).forEach(error => {
        console.log(`      → ${error.substring(0, 60)}...`);
      });
    });
  }

  console.log(`\n📋 Recent activity (last 10):`);
  logs
    .slice(-10)
    .reverse()
    .forEach((log, i) => {
      const status = log.success ? '✅' : '❌';
      console.log(`   ${status} ${log.user} - ${formatTimestamp(log.timestamp)}`);
      if (!log.success && log.errors.length > 0) {
        console.log(`      → ${log.errors[0].split(':')[0]}`);
      }
    });

  if (process.argv.includes('--detailed')) {
    console.log('\n📝 Full log:');
    logs.forEach((log, i) => {
      console.log(
        `\n${i + 1}. ${log.success ? '✅' : '❌'} ${log.user} - ${formatTimestamp(log.timestamp)}`
      );
      if (log.errors.length > 0) {
        log.errors.forEach(error => console.log(`   → ${error}`));
      }
    });
  }

  console.log(`\nRun with --detailed for full log details`);
}

main();
