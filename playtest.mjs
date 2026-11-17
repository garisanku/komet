// Playtest KOMET end to end: start, steer, collect, hit, slingshot, pause,
// win, crash, restart. Drives the live game through window.__game and checks
// the state after each step. Setup + stepping happen inside one evaluate call
// each, so the animation loop cannot interleave mid-check.
// Usage: node playtest.mjs (serve.ts must be running on port 8081).
import { chromium } from 'playwright-core';

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

let passed = 0;
let failed = 0;
function check(name, cond, extra = '') {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? '  — ' + extra : ''}`);
  if (cond) passed++;
  else {
    failed++;
    errors.push(`check failed: ${name}`);
  }
}

await page.goto('http://localhost:8081/', { waitUntil: 'load' });
await page.waitForFunction(() => window.__shotReady === true, null, { timeout: 15000 });

// 1. Title screen, then start with Enter.
check('title screen', await page.evaluate(() => window.__game.screen === 'title'));
await page.keyboard.press('Enter');
await page.waitForFunction(() => window.__game.screen === 'playing', null, { timeout: 5000 }).catch(() => {});
check('playing after Enter', await page.evaluate(() => window.__game.screen === 'playing'));
check('hull starts at 3', await page.evaluate(() => window.__game.comet.hull === 3));

// 2. Steering: move the pointer up-left; the comet should follow.
const steer = await page.evaluate(() => {
  const g = window.__game;
  const x0 = g.comet.x;
  const y0 = g.comet.y;
  // Point the pointer far up-left of the comet.
  g.comet.x = 400;
  g.comet.y = 400;
  g.comet.vx = 0;
  g.comet.vy = 0;
  return { x0, y0 };
});
await page.mouse.move(200, 150);
await page.waitForTimeout(600);
const moved = await page.evaluate(() => ({ x: window.__game.comet.x, y: window.__game.comet.y }));
check('comet steers toward pointer', moved.x < 400 && moved.y < 400, `(${moved.x.toFixed(0)}, ${moved.y.toFixed(0)}) from (400, 400)`);

// 3. Shard collection: put a shard on the comet, step, it is collected.
const shard = await page.evaluate(() => {
  const g = window.__game;
  g.entities = [];
  g.comet.invuln = 0;
  const before = { shards: g.shards, score: g.score };
  g.entities.push({ kind: 'shard', worldX: g.distance + g.comet.x, y: g.comet.y, baseY: g.comet.y, phase: 0, r: 9, taken: false });
  for (let i = 0; i < 5; i++) g.update(1 / 60);
  return { before, after: { shards: g.shards, score: g.score } };
});
check('shard collected', shard.after.shards === shard.before.shards + 1, `shards ${shard.before.shards} -> ${shard.after.shards}`);
check('score rose on pickup', shard.after.score > shard.before.score, `score ${Math.round(shard.before.score)} -> ${Math.round(shard.after.score)}`);

// 4. Rock hit: put a rock on the comet, step, hull drops by 1 and invuln starts.
const rock = await page.evaluate(() => {
  const g = window.__game;
  g.entities = [];
  g.comet.invuln = 0;
  const before = g.comet.hull;
  g.entities.push({ kind: 'rock', worldX: g.distance + g.comet.x, y: g.comet.y, r: 24, drift: 0, spin: 0, angle: 0, seed: 1 });
  for (let i = 0; i < 5; i++) g.update(1 / 60);
  return { before, after: g.comet.hull, invuln: g.comet.invuln };
});
check('rock hit costs 1 hull', rock.after === rock.before - 1, `hull ${rock.before} -> ${rock.after}`);
check('invulnerability after hit', rock.invuln > 0, `invuln=${rock.invuln.toFixed(2)}`);

// 5. Black hole pull: put a hole near the comet; the comet is pulled toward it.
const hole = await page.evaluate(() => {
  const g = window.__game;
  g.entities = [];
  g.comet.vx = 0;
  g.comet.vy = 0;
  const hx = g.distance + g.comet.x + 200;
  const hy = g.comet.y + 60;
  g.entities.push({ kind: 'hole', worldX: hx, y: hy, r: 46, phase: 0 });
  const v0 = Math.hypot(g.comet.vx, g.comet.vy);
  for (let i = 0; i < 30; i++) g.update(1 / 60);
  const v1 = Math.hypot(g.comet.vx, g.comet.vy);
  return { v0, v1, vx: g.comet.vx, vy: g.comet.vy };
});
check('black hole pulls the comet', hole.v1 > hole.v0 + 20, `speed ${hole.v0.toFixed(0)} -> ${hole.v1.toFixed(0)}`);

// 6. Planet slingshot: put a planet within assist range; it fires once.
const sling = await page.evaluate(() => {
  const g = window.__game;
  g.entities = [];
  const before = { slingshots: g.slingshots, speed: g.speed, score: g.score };
  const px = g.distance + g.comet.x + 120;
  g.entities.push({ kind: 'planet', worldX: px, y: g.comet.y, r: 70, color: 'planetA', ring: false, used: false, phase: 0 });
  for (let i = 0; i < 5; i++) g.update(1 / 60);
  return { before, after: { slingshots: g.slingshots, speed: g.speed, score: g.score } };
});
check('slingshot fires', sling.after.slingshots === sling.before.slingshots + 1, `slingshots ${sling.before.slingshots} -> ${sling.after.slingshots}`);
check('slingshot boosts speed', sling.after.speed > sling.before.speed, `speed ${sling.before.speed.toFixed(0)} -> ${sling.after.speed.toFixed(0)}`);
check('slingshot adds score', sling.after.score > sling.before.score + 150, `score +${Math.round(sling.after.score - sling.before.score)}`);

// 7. Pause and resume. The headless renderer runs at a low frame rate, so
// wait for the state change instead of checking immediately after the key.
await page.keyboard.press('p');
await page.waitForFunction(() => window.__game.screen === 'paused', null, { timeout: 5000 }).catch(() => {});
check('paused', await page.evaluate(() => window.__game.screen === 'paused'));
await page.keyboard.press('p');
await page.waitForFunction(() => window.__game.screen === 'playing', null, { timeout: 5000 }).catch(() => {});
check('resumed', await page.evaluate(() => window.__game.screen === 'playing'));

// 8. Win: set the distance just short of the Sun, step, victory.
const win = await page.evaluate(() => {
  const g = window.__game;
  g.entities = [];
  g.distance = 12000 - 5;
  g.comet.invuln = 5;
  for (let i = 0; i < 10; i++) g.update(1 / 60);
  return { screen: g.screen, won: g.stats && g.stats.won, score: g.score };
});
check('reaching the Sun wins', win.screen === 'victory' && win.won === true, `screen=${win.screen} score=${Math.round(win.score)}`);

// 9. Restart from victory with Enter.
await page.keyboard.press('Enter');
await page.waitForFunction(() => window.__game.screen === 'playing', null, { timeout: 5000 }).catch(() => {});
check('restart after victory', await page.evaluate(() => window.__game.screen === 'playing'));
check('distance reset on restart', await page.evaluate(() => window.__game.distance < 100));

// 10. Game over: 1 hull left, a rock on the comet, step, crash.
const over = await page.evaluate(() => {
  const g = window.__game;
  g.entities = [];
  g.comet.hull = 1;
  g.comet.invuln = 0;
  g.entities.push({ kind: 'rock', worldX: g.distance + g.comet.x, y: g.comet.y, r: 24, drift: 0, spin: 0, angle: 0, seed: 2 });
  for (let i = 0; i < 5; i++) g.update(1 / 60);
  return { screen: g.screen, stats: g.stats };
});
check('crash ends the run', over.screen === 'gameover', `screen=${over.screen}`);
check('game-over stats recorded', over.stats && over.stats.won === false, `won=${over.stats && over.stats.won}`);

// 11. Restart from game over with Enter.
await page.keyboard.press('Enter');
await page.waitForFunction(() => window.__game.screen === 'playing', null, { timeout: 5000 }).catch(() => {});
check('restart after game over', await page.evaluate(() => window.__game.screen === 'playing'));
check('hull restored on restart', await page.evaluate(() => window.__game.comet.hull === 3));

// 12. A 30-second flight fast-forward: no crash, score rises, entities spawn.
// (30 s, not 60: a full 60 s flight reaches the Sun and wins the game.)
// God mode (invuln) covers rocks; holes are filtered out here because the
// event horizon is fatal by design and the hole itself is tested above.
const flight = await page.evaluate(() => {
  const g = window.__game;
  g.entities = [];
  g.comet.invuln = 999; // god mode for the soak test: only the engine is under test
  const s0 = g.score;
  for (let i = 0; i < 30 * 60; i++) {
    g.entities = g.entities.filter((e) => e.kind !== 'hole');
    g.update(1 / 60);
  }
  return { score: g.score, s0, distance: g.distance, entities: g.entities.length, screen: g.screen };
});
check('30s flight advances', flight.distance > 3000, `distance=${Math.round(flight.distance)}`);
check('30s flight scores', flight.score > flight.s0, `score ${Math.round(flight.s0)} -> ${Math.round(flight.score)}`);
check('30s flight still playing', flight.screen === 'playing', `screen=${flight.screen}`);
check('entities spawn during flight', flight.entities > 0, `entities=${flight.entities}`);

console.log(`\n${passed} passed, ${failed} failed`);
console.log(errors.length === 0 ? 'NO PAGE ERRORS' : `ERRORS:\n${errors.join('\n')}`);
await browser.close();
process.exit(failed === 0 && errors.length === 0 ? 0 : 1);
