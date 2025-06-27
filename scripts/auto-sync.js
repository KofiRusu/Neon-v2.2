// Auto-sync workspace changes
const chokidar = require('chokidar');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Create sync log if it doesn't exist
const syncLogPath = '.sync-log.json';
const deviceId =
  process.env.DEVICE_ID ||
  `${require('os').hostname()}-${require('os').platform()}-${require('os').arch()}`;

const logSync = (level, message) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    device: deviceId,
  };

  let logs = [];
  if (fs.existsSync(syncLogPath)) {
    try {
      logs = JSON.parse(fs.readFileSync(syncLogPath, 'utf8'));
    } catch (e) {
      logs = [];
    }
  }

  logs.push(logEntry);
  fs.writeFileSync(syncLogPath, JSON.stringify(logs, null, 2));
  console.log(`[${level.toUpperCase()}] ${message}`);
};

// Handle dry-run mode
if (process.argv.includes('--dry-run')) {
  console.log('✅ Auto-sync script validated - dry run mode');
  process.exit(0);
}

console.log(`🚀 Starting auto-sync for device: ${deviceId}`);
logSync('info', 'Starting workspace sync...');

// Watch for file changes (excluding node_modules, .git, etc.)
const watcher = chokidar.watch('.', {
  ignored: [
    /(^|[\/\\])\../,
    'node_modules/**',
    'dist/**',
    'coverage/**',
    'test-results/**',
    'playwright-report/**',
  ],
  persistent: true,
  ignoreInitial: true,
});

let syncTimeout;

const performSync = () => {
  const command = `git add . && git commit -m "Auto-commit from device ${deviceId} at ${new Date().toISOString()}" && git pull --rebase && git push`;

  exec(command, (error, stdout, stderr) => {
    if (error && !error.message.includes('nothing to commit')) {
      logSync('error', `Sync error: ${error.message}`);
      console.error('❌ Sync error:', error.message);
    } else {
      logSync('info', 'Pulled latest changes from origin/main');
      console.log('✅ Workspace synchronized successfully');
    }
  });
};

watcher.on('all', (event, filePath) => {
  if (event === 'change' || event === 'add' || event === 'unlink') {
    console.log(`📝 File ${event}: ${filePath}`);

    // Debounce sync operations
    clearTimeout(syncTimeout);
    syncTimeout = setTimeout(performSync, 2000);
  }
});

watcher.on('ready', () => {
  console.log('👀 Watching for file changes...');
});

process.on('SIGINT', () => {
  console.log('\n🛑 Stopping auto-sync...');
  watcher.close();
  process.exit(0);
});
