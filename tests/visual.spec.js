const { test, expect } = require('@playwright/test');

const BASE = 'http://localhost:3000';

const routes = ['/', '/cv', '/projects'];

for (const route of routes) {
  test(`visual ${route}`, async ({ page }) => {
    await page.goto(BASE + route, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    const name = route === '/' ? 'home' : route.replace('/', '') || 'home';
    expect(await page.screenshot({ fullPage: true })).toMatchSnapshot(`${name}.png`);
  });
}
