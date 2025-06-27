// Conflict resolution handler
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Checking for merge conflicts...');

// Function to recursively scan files for conflict markers
const scanForConflicts = (dir, conflictFiles = []) => {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    // Skip directories we don't want to scan
    if (stat.isDirectory()) {
      const skipDirs = [
        'node_modules',
        '.git',
        'dist',
        'coverage',
        'test-results',
        'playwright-report',
      ];
      if (!skipDirs.includes(file)) {
        scanForConflicts(filePath, conflictFiles);
      }
    } else if (stat.isFile()) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');

        // Check for conflict markers
        const conflictMarkers = ['<<<<<<<', '=======', '>>>>>>>'];
        const hasConflicts = conflictMarkers.some(marker => content.includes(marker));

        if (hasConflicts) {
          conflictFiles.push(filePath);
        }
      } catch (error) {
        // Skip binary files or files that can't be read as text
        console.log(`⚠️  Skipping file (likely binary): ${filePath}`);
      }
    }
  });

  return conflictFiles;
};

// Check git status for unmerged files
let gitConflicts = [];
try {
  const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
  gitConflicts = gitStatus
    .split('\n')
    .filter(line => line.startsWith('UU ') || line.startsWith('AA ') || line.startsWith('DD '))
    .map(line => line.substring(3));
} catch (error) {
  console.log('⚠️  Could not check git status:', error.message);
}

// Scan filesystem for conflict markers
const conflictFiles = scanForConflicts('.');

// Combine both types of conflicts
const allConflicts = [...new Set([...gitConflicts, ...conflictFiles])];

if (allConflicts.length > 0) {
  console.error('⛔ CONFLICTS DETECTED:');
  allConflicts.forEach(file => {
    console.error(`   📄 ${file}`);
  });

  console.error('\n🔧 RESOLUTION STEPS:');
  console.error('1. Open conflicted files and resolve merge conflicts');
  console.error('2. Remove conflict markers (<<<<<<<, =======, >>>>>>>)');
  console.error('3. Run: git add . && git commit');
  console.error('4. Run this script again to verify resolution');

  process.exit(1);
} else {
  console.log('✅ No conflicts detected - workspace is clean!');

  // Log successful conflict check
  const logEntry = {
    timestamp: new Date().toISOString(),
    level: 'info',
    message: 'Conflict resolution check passed',
    device:
      process.env.DEVICE_ID ||
      `${require('os').hostname()}-${require('os').platform()}-${require('os').arch()}`,
  };

  // Update sync log
  const syncLogPath = '.sync-log.json';
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

  process.exit(0);
}
