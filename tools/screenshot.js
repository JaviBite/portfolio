const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function capture(url, outPath) {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  try {
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.screenshot({ path: outPath, fullPage: true });
    console.log(`Saved ${outPath}`);
  } catch (err) {
    console.error(`Error capturing ${url}:`, err.message);
  } finally {
    await browser.close();
  }
}

(async () => {
  const base = 'http://localhost:3000';
  const shotsDir = path.join(__dirname, '..', 'screenshots');
  if (!fs.existsSync(shotsDir)) fs.mkdirSync(shotsDir, { recursive: true });
  await capture(base + '/', path.join(shotsDir, 'home.png'));
  await capture(base + '/cv', path.join(shotsDir, 'cv.png'));
  await capture(base + '/cv/print', path.join(shotsDir, 'cv-print.png'));
  await capture(base + '/projects', path.join(shotsDir, 'projects.png'));
})();
