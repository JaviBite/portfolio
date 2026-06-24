const { test, expect } = require('@playwright/test');

const BASE = 'http://localhost:3000';
const themes = ['dark', 'light'];
const routes = ['/', '/cv', '/cv/print', '/projects'];

for (const theme of themes) {
  for (const route of routes) {
    test(`visual ${route} (${theme})`, async ({ page }) => {
      await page.addInitScript((themeValue) => {
        localStorage.setItem('theme', themeValue);
      }, theme);
      // Freeze JS-driven animations that respect reduced motion (hero canvas,
      // framer-motion reveals) so screenshots are deterministic across runs.
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(BASE + route, { waitUntil: 'networkidle' });
      await page.waitForTimeout(500);
      const routeName = route === '/' ? 'home' : route.slice(1).replace(/\//g, '-');
      // animations: 'disabled' fast-forwards CSS animations/transitions to their
      // final state before capturing.
      expect(await page.screenshot({ fullPage: true, animations: 'disabled' }))
        .toMatchSnapshot(`${routeName}-${theme}.png`, { threshold: 0.05 });
    });
  }
}
