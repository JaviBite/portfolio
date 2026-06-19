// Offline asset generator for the multicam-homography demo.
//
// Renders a fictional parking lot from several cameras of KNOWN pose (so the
// ground→image homography is exact), in a day and a night variant, and derives
// each camera's H (worldNorm[0,1]² → image px) and its inverse Hinv from the
// four ground corners projected by three.js itself. Outputs the background JPGs
// and a scene.json consumed by components/demos/MultiCamTracking.tsx.
//
//   node render.mjs            # render to scripts/demo-assets/multicam/out/
//   node render.mjs promote    # + publish jpgs to public/ and scene.json to components/
//
// three.js is loaded from a CDN inside scene.html — nothing is added to package.json.

import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { mkdirSync, writeFileSync, copyFileSync } from "node:fs";
import { CAMERAS } from "./cameras.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, "..", "..", ".."); // -> portfolio/
const outDir = join(here, "out");
const promote = process.argv[2] === "promote";

const THEMES = [
  { name: "day", key: "light" },
  { name: "night", key: "dark" },
];

// ---- solve a 4-point homography (getPerspectiveTransform), returns 3x3 ----
function solve8(A, b) {
  const n = 8;
  for (let col = 0; col < n; col++) {
    let piv = col;
    for (let r = col + 1; r < n; r++) if (Math.abs(A[r][col]) > Math.abs(A[piv][col])) piv = r;
    [A[col], A[piv]] = [A[piv], A[col]];
    [b[col], b[piv]] = [b[piv], b[col]];
    const d = A[col][col];
    for (let j = col; j < n; j++) A[col][j] /= d;
    b[col] /= d;
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const f = A[r][col];
      for (let j = col; j < n; j++) A[r][j] -= f * A[col][j];
      b[r] -= f * b[col];
    }
  }
  return b;
}
function homography(src, dst) {
  const A = [], b = [];
  for (let i = 0; i < 4; i++) {
    const [x, y] = src[i], [u, v] = dst[i];
    A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]); b.push(u);
    A.push([0, 0, 0, x, y, 1, -v * x, -v * y]); b.push(v);
  }
  const h = solve8(A, b);
  return [[h[0], h[1], h[2]], [h[3], h[4], h[5]], [h[6], h[7], 1]];
}
const NORM_CORNERS = [[0, 0], [1, 0], [1, 1], [0, 1]];

(async () => {
  mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  await page.goto("file://" + join(here, "scene.html"));
  await page.waitForFunction("window.__sceneReady === true", { timeout: 45000 });

  const ground = await page.evaluate("window.__ground");
  const cameras = [];

  for (const cam of CAMERAS) {
    let corners = null;
    for (const theme of THEMES) {
      const spec = { ...cam, theme: theme.name };
      const { dataURL, corners: c } = await page.evaluate((s) => window.__render(s), spec);
      corners = c;
      const buf = Buffer.from(dataURL.split(",")[1], "base64");
      const fname = `${cam.file}-${theme.name}.jpg`;
      writeFileSync(join(outDir, fname), buf);
      console.log(`  rendered ${fname} (${(buf.length / 1024).toFixed(0)} KB)`);
    }
    const H = homography(NORM_CORNERS, corners);
    const Hinv = homography(corners, NORM_CORNERS);
    cameras.push({
      id: cam.id, label: cam.label, kind: cam.kind,
      imgW: cam.width, imgH: cam.height, H, Hinv,
      bg: {
        light: `/demos/multicam-tracking/${cam.file}-day.jpg`,
        dark: `/demos/multicam-tracking/${cam.file}-night.jpg`,
      },
    });
  }

  await browser.close();

  const scene = { ground, cameras };
  writeFileSync(join(outDir, "scene.json"), JSON.stringify(scene, null, 2));
  console.log(`  wrote scene.json (${cameras.length} cameras)`);

  if (promote) {
    const pub = join(repo, "public", "demos", "multicam-tracking");
    mkdirSync(pub, { recursive: true });
    for (const cam of CAMERAS) for (const t of THEMES) {
      const f = `${cam.file}-${t.name}.jpg`;
      copyFileSync(join(outDir, f), join(pub, f));
    }
    const sceneDest = join(repo, "components", "demos", "multicam-scene.json");
    writeFileSync(sceneDest, JSON.stringify(scene, null, 2));
    console.log(`Promoted ${CAMERAS.length * THEMES.length} jpgs → public/demos/multicam-tracking/`);
    console.log(`Promoted scene.json → components/demos/multicam-scene.json ✔`);
  }
})().catch((e) => { console.error(e); process.exit(1); });
