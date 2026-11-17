// Take KOMET's 4 screenshots: real renders of the game's own code, via the
// deterministic ?shot= scenes. Each is a 1280x720 JPEG, at most 256 KiB.
// Usage: node shots.mjs  (serves nothing itself; run `node serve.ts --port 8081` first)
import { chromium } from 'playwright-core';
import { writeFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const SCENES = [
  ['1-title', 'title'],
  ['2-play', 'play'],
  ['3-victory', 'victory'],
  ['4-over', 'over'],
];
const SEED = 20261117;
const OUT = new URL('./screenshots/', import.meta.url).pathname;

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM || undefined,
  args: ['--no-sandbox', '--use-angle=swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(`console: ${m.text()}`);
});
page.on('requestfailed', (r) => errors.push(`requestfailed: ${r.url()}`));

for (const [name, scene] of SCENES) {
  const url = `http://localhost:8081/?shot=${scene}&seed=${SEED}`;
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__shotReady === true, null, { timeout: 15000 });
  // Let the canvas settle one frame.
  await page.waitForTimeout(150);
  const file = join(OUT, `${name}.jpg`);
  await page.screenshot({ path: file, type: 'jpeg', quality: 82 });
  const size = statSync(file).size;
  console.log(`${name}.jpg  ${size} bytes  ${size <= 262144 ? 'OK' : 'TOO BIG'}`);
}

console.log(errors.length === 0 ? 'NO PAGE ERRORS' : `ERRORS:\n${errors.join('\n')}`);
await browser.close();
