const { spawn } = require('child_process');

const hostDir = process.cwd();
const args = [
  'run',
  '--rm',
  '-v',
  `${hostDir}:/repo`,
  '-v',
  '/repo/node_modules',
  '-w',
  '/repo',
  'node:20',
  'bash',
  '-lc',
  'npm install && npx playwright install --with-deps chromium && npm run test:visual:update',
];

const child = spawn('docker', args, { stdio: 'inherit' });

child.on('exit', (code) => {
  process.exit(code);
});

child.on('error', (err) => {
  console.error('Failed to start docker:', err);
  process.exit(1);
});
