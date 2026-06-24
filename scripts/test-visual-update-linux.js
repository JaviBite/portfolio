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
  // Same image as CI (.github/workflows/playwright-visual.yml) so the generated
  // baselines render identically to what CI produces. Browsers come preinstalled.
  'mcr.microsoft.com/playwright:v1.60.0-jammy',
  'bash',
  '-lc',
  'npm install && npm run test:visual:update',
];

const child = spawn('docker', args, { stdio: 'inherit' });

child.on('exit', (code) => {
  process.exit(code);
});

child.on('error', (err) => {
  console.error('Failed to start docker:', err);
  process.exit(1);
});
