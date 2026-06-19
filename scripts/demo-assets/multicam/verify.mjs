// Sanity check: the solved H must reproduce three.js's own ground projection for
// arbitrary interior points (not just the 4 corners used to solve it). Sub-pixel
// error ⇒ the homography is exact and consistent with the render.
import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { readFileSync } from "node:fs";
import { CAMERAS } from "./cameras.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const scene = JSON.parse(readFileSync(join(here, "out", "scene.json"), "utf8"));
const SPECS = Object.fromEntries(CAMERAS.map((c) => [c.id, c]));
const applyH = (H, x, y) => {
  const d = H[2][0] * x + H[2][1] * y + H[2][2];
  return [(H[0][0] * x + H[0][1] * y + H[0][2]) / d, (H[1][0] * x + H[1][1] * y + H[1][2]) / d];
};
const SAMPLES = [];
for (let gx = 0.05; gx <= 0.96; gx += 0.1) for (let gy = 0.05; gy <= 0.96; gy += 0.1) SAMPLES.push([gx, gy]);

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });
await page.goto("file://" + join(here, "scene.html"));
await page.waitForFunction("window.__sceneReady === true", { timeout: 45000 });

let worst = 0;
for (const cam of scene.cameras) {
  const truth = await page.evaluate(({ spec, pts }) => pts.map(([gx, gy]) => window.__projectNorm(spec, gx, gy)),
    { spec: SPECS[cam.id], pts: SAMPLES });
  let maxErr = 0, inFrame = 0;
  truth.forEach(([tu, tv], i) => {
    const [u, v] = applyH(cam.H, SAMPLES[i][0], SAMPLES[i][1]);
    maxErr = Math.max(maxErr, Math.hypot(u - tu, v - tv));
    if (tu >= 0 && tu <= cam.imgW && tv >= 0 && tv <= cam.imgH) inFrame++;
  });
  console.log(`${cam.id}: reprojection error ${maxErr.toFixed(4)} px | ${inFrame}/${SAMPLES.length} samples in-frame`);
  worst = Math.max(worst, maxErr);
}
await browser.close();
console.log(worst < 0.5 ? `OK — homography exact (worst ${worst.toFixed(4)} px)` : `WARN — worst ${worst.toFixed(4)} px`);
