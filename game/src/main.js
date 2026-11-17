// KOMET — game loop: input, physics, collisions, and the screens.
// The comet flies rightward through a scrolling sky. Steer with the mouse
// (or arrows/WASD), collect shards, dodge rocks, escape black holes,
// slingshot around planets, and reach the Sun to win.

import { VIEW, COMET, ROAD, SHARD, HOLE, PLANET, SCORE } from './config.js';
import { makeRng } from './random.js';
import { makeInput } from './input.js';
import { makeGame, resetRun, loadBest, saveBest } from './state.js';
import { initWorld, updateWorld, cometWorldX } from './world.js';
import { spawnBurst, spawnTrail, spawnWisp, updateParticles } from './particles.js';
import { render } from './render.js';
import { applyShot } from './shots.js';
import {
  ensureAudio,
  setMuted,
  sfxPickup,
  sfxHit,
  sfxSlingshot,
  sfxVictory,
  sfxGameOver,
  sfxStart,
} from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const params = new URLSearchParams(window.location.search);
const seedParam = Number(params.get('seed') || 0);
const shotParam = params.get('shot');
const rng = makeRng(seedParam || (Math.floor(Math.random() * 1e9) + 1));

const input = makeInput(canvas);
const game = makeGame(rng);
game.best = loadBest();
initWorld(game);
window.__game = game;
// Exposed for the automated playtest (playtest.mjs): step the simulation
// directly so a long flight can be fast-forwarded deterministically.
window.__game.update = update;
window.__game.resetRun = () => {
  resetRun(game);
  initWorld(game);
  game.spawn = { shard: game.distance + 500, rock: game.distance + 900, hole: game.distance + 2600, planet: game.distance + 1900 };
};

if (shotParam) {
  game.shot = shotParam;
  applyShot(game, shotParam, seedParam || 20261117);
}

let last = performance.now();
let shotReady = false;

function dist(ax, ay, bx, by) {
  return Math.hypot(ax - bx, ay - by);
}

function crash(reason) {
  const c = game.comet;
  if (c.dead) return;
  c.dead = true;
  game.stats = {
    won: false,
    score: game.score,
    shards: game.shards,
    slingshots: game.slingshots,
    distance: game.distance,
  };
  game.screen = 'gameover';
  game.flash = 0.5;
  game.shake = 0.6;
  spawnBurst(game, c.x, c.y, '#ffd94d', 26, 260, 4);
  spawnBurst(game, c.x, c.y, '#ff5252', 18, 200, 5);
  sfxGameOver();
  if (game.score > game.best) {
    game.best = Math.floor(game.score);
    saveBest(game.best);
  }
}

function win() {
  game.stats = {
    won: true,
    score: game.score + SCORE.winBonus,
    shards: game.shards,
    slingshots: game.slingshots,
    distance: game.distance,
  };
  game.score = game.stats.score;
  game.screen = 'victory';
  sfxVictory();
  for (let i = 0; i < 30; i++) spawnWisp(game, 1130, 168);
  if (game.score > game.best) {
    game.best = Math.floor(game.score);
    saveBest(game.best);
  }
}

function startRun() {
  ensureAudio();
  sfxStart();
  resetRun(game);
  initWorld(game);
  // Fresh sky for the new run (keep the same rng stream going).
  game.spawn = { shard: game.distance + 500, rock: game.distance + 900, hole: game.distance + 2600, planet: game.distance + 1900 };
}

function update(dt) {
  const pressed = input.consume();

  // Global keys.
  if (pressed.has('m')) {
    game.muted = !game.muted;
    setMuted(game.muted);
  }

  if (game.screen === 'title') {
    game.time += dt;
    if (pressed.has('enter') || pressed.has(' ') || pressed.has('tap')) startRun();
    return;
  }

  if (game.screen === 'victory' || game.screen === 'gameover') {
    game.time += dt;
    updateParticles(game, dt);
    if (pressed.has('enter') || pressed.has(' ') || pressed.has('tap')) startRun();
    return;
  }

  if (game.screen === 'paused') {
    if (pressed.has('p') || pressed.has('escape')) game.screen = 'playing';
    return;
  }

  // Playing.
  if (pressed.has('p') || pressed.has('escape')) {
    game.screen = 'paused';
    return;
  }
  game.time += dt;
  const c = game.comet;

  // Steering: toward the pointer, or with the keys.
  const ks = input.keySteer();
  let ax = 0;
  let ay = 0;
  if (ks.x !== 0 || ks.y !== 0) {
    ax = ks.x * COMET.steer;
    ay = ks.y * COMET.steer;
  } else if (input.pointer.active) {
    const dx = input.pointer.x - c.x;
    const dy = input.pointer.y - c.y;
    const d = Math.hypot(dx, dy);
    if (d > 8) {
      ax = (dx / d) * COMET.steer * Math.min(1, d / 120);
      ay = (dy / d) * COMET.steer * Math.min(1, d / 120);
    }
  }
  c.vx += ax * dt;
  c.vy += ay * dt;
  const damp = Math.max(0, 1 - COMET.damping * dt);
  c.vx *= damp;
  c.vy *= damp;
  const sp = Math.hypot(c.vx, c.vy);
  if (sp > COMET.maxSteer) {
    c.vx = (c.vx / sp) * COMET.maxSteer;
    c.vy = (c.vy / sp) * COMET.maxSteer;
  }
  c.x = Math.min(560, Math.max(120, c.x + c.vx * dt));
  c.y = Math.min(VIEW.h - 40, Math.max(40, c.y + c.vy * dt));

  // Speed grows with distance; the road scrolls.
  const targetSpeed = Math.min(ROAD.maxSpeed, ROAD.baseSpeed + game.distance * ROAD.accel);
  game.speed += (targetSpeed - game.speed) * Math.min(1, dt * 0.5);
  game.distance += game.speed * dt;
  game.score += game.speed * SCORE.perUnit * dt;

  // Tail: remember where the comet has been (screen coords).
  c.tail.unshift({ x: c.x, y: c.y });
  const tailLen = COMET.trail + Math.floor(game.shards * COMET.tailGrow);
  if (c.tail.length > tailLen) c.tail.length = tailLen;
  if (Math.random() < 0.7) spawnTrail(game, c.x - 18, c.y, '#ffd94d');

  updateWorld(game, dt);
  updateParticles(game, dt);

  // Timers.
  if (c.invuln > 0) c.invuln -= dt;
  if (game.flash > 0) game.flash -= dt;
  if (game.shake > 0) game.shake -= dt;
  if (game.banner && game.time > game.banner.until) game.banner = null;

  // Gravity + collisions, in screen space.
  const keep = [];
  for (const e of game.entities) {
    const sx = e.worldX - game.distance;
    if (sx < -200 || sx > VIEW.w + 200) {
      if (e.kind !== 'shard' || !e.taken) keep.push(e);
      continue;
    }
    if (e.kind === 'hole') {
      const d = dist(c.x, c.y, sx, e.y);
      if (d < HOLE.pullR) {
        const pull = HOLE.pull * (1 - d / HOLE.pullR) * (HOLE.r / Math.max(30, d));
        const ux = (sx - c.x) / Math.max(1, d);
        const uy = (e.y - c.y) / Math.max(1, d);
        c.vx += ux * pull * dt;
        c.vy += uy * pull * dt;
      }
      if (d < HOLE.r + COMET.r * 0.55) {
        crash('hole');
        return;
      }
      keep.push(e);
      continue;
    }
    if (e.kind === 'planet') {
      const d = dist(c.x, c.y, sx, e.y);
      if (d < e.r + PLANET.assistR && !e.used) {
        e.used = true;
        game.slingshots += 1;
        game.score += PLANET.bonus;
        game.speed = Math.min(ROAD.maxSpeed + 90, game.speed + PLANET.boost);
        game.banner = { text: 'SLINGSHOT!', sub: `+${PLANET.bonus} — flung forward`, until: game.time + 1.4 };
        sfxSlingshot();
        spawnBurst(game, sx, e.y, '#4dd0e1', 22, 240, 4);
      } else if (d < e.r + 130) {
        // A gentle pull toward the planet.
        const ux = (sx - c.x) / Math.max(1, d);
        const uy = (e.y - c.y) / Math.max(1, d);
        c.vx += ux * PLANET.pull * dt;
        c.vy += uy * PLANET.pull * dt;
      }
      keep.push(e);
      continue;
    }
    if (e.kind === 'shard' && !e.taken) {
      const d = dist(c.x, c.y, sx, e.y);
      if (d < COMET.r + e.r + 6) {
        e.taken = true;
        game.shards += 1;
        game.score += SHARD.score;
        sfxPickup();
        spawnBurst(game, sx, e.y, '#ffe45e', 10, 170, 3);
      } else {
        keep.push(e);
      }
      continue;
    }
    if (e.kind === 'rock') {
      const d = dist(c.x, c.y, sx, e.y);
      if (d < COMET.r + e.r * 0.85) {
        if (c.invuln <= 0) {
          c.hull -= 1;
          c.invuln = COMET.invuln;
          game.flash = 0.4;
          game.shake = 0.5;
          sfxHit();
          spawnBurst(game, sx, e.y, '#8d8fa3', 20, 230, 4);
          spawnBurst(game, c.x, c.y, '#ff5252', 10, 180, 3);
          if (c.hull <= 0) {
            crash('rock');
            return;
          }
        }
        // The rock shatters on impact either way.
        continue;
      }
      keep.push(e);
      continue;
    }
    keep.push(e);
  }
  game.entities = keep;

  // Reached the Sun?
  if (game.distance >= ROAD.toSun) {
    win();
  }
}

function frame(now) {
  const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
  last = now;
  update(dt);
  render(ctx, game);
  if (!shotReady) {
    shotReady = true;
    window.__shotReady = true;
  }
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
