const chokidar = require('chokidar');
const { spawn } = require('child_process');
const path = require('path');

const watchedGlobs = [
  path.join(__dirname, '..', 'app', '**', '*.*'),
  path.join(__dirname, '..', 'components', '**', '*.*'),
  path.join(__dirname, '..', 'ui', '**', '*.*'),
  path.join(__dirname, '..', 'public', '**', '*.*')
];

let timer = null;
let running = false;

function runCapture() {
  if (running) return;
  running = true;
  console.log('[watch] Running screenshot script...');
  const proc = spawn(process.execPath, [path.join(__dirname, 'screenshot.js')], { stdio: 'inherit' });
  proc.on('exit', (code) => {
    running = false;
    console.log(`[watch] screenshot.js exited with ${code}`);
  });
}

const watcher = chokidar.watch(watchedGlobs, {
  ignoreInitial: true,
  persistent: true,
  awaitWriteFinish: { stabilityThreshold: 200, pollInterval: 100 }
});

watcher.on('all', (event, file) => {
  console.log(`[watch] ${event}: ${file}`);
  clearTimeout(timer);
  timer = setTimeout(() => runCapture(), 300);
});

console.log('[watch] Watching for changes. Press Ctrl+C to stop.');
// run initial capture
runCapture();
