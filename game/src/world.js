// The world: the scrolling sky, and everything the comet meets on the road.
// Entities live in world-x (distance along the road). The renderer turns
// world-x into screen-x with the camera: screenX = worldX - distance.
// The comet sits at screen x 220; its world position is distance + 220.

import { VIEW, SHARD, ROCK, HOLE, PLANET, SUN, ROAD } from './config.js';
import { makeRng, range, int, pick } from './random.js';

const PLANET_COLORS = ['planetA', 'planetB', 'planetC'];

// Set up the background and the spawn cursors. Call once per game object.
export function initWorld(game) {
  const rng = game.rng;
  game.stars = [];
  for (let i = 0; i < 130; i++) {
    game.stars.push({
      x: range(rng, 0, VIEW.w),
      y: range(rng, 0, VIEW.h),
      size: range(rng, 0.6, 2.2),
      tw: range(rng, 0, Math.PI * 2),
      par: range(rng, 0.15, 0.5),
    });
  }
  game.nebulae = [];
  const hues = [
    { r: 90, g: 80, b: 200 },
    { r: 200, g: 90, b: 140 },
    { r: 60, g: 160, b: 200 },
  ];
  for (let i = 0; i < 5; i++) {
    game.nebulae.push({
      x: range(rng, 0, VIEW.w),
      y: range(rng, 0, VIEW.h),
      r: range(rng, 180, 320),
      hue: hues[i % hues.length],
      par: range(rng, 0.05, 0.12),
      a: range(rng, 0.05, 0.1),
    });
  }
  game.spawn = {
    shard: 500,
    rock: 900,
    hole: 2600,
    planet: 1900,
  };
}

// The comet's world-x (its screen x is fixed at 220).
export function cometWorldX(game) {
  return game.distance + 220;
}

// Spawn a cluster of shards in an arc at worldX.
function spawnShardCluster(game, worldX) {
  const rng = game.rng;
  const cy = range(rng, 90, VIEW.h - 90);
  const n = SHARD.cluster;
  for (let i = 0; i < n; i++) {
    game.entities.push({
      kind: 'shard',
      worldX: worldX + i * 46,
      y: cy + Math.sin((i / (n - 1)) * Math.PI) * -46,
      baseY: cy,
      phase: range(rng, 0, Math.PI * 2),
      r: SHARD.r,
      taken: false,
    });
  }
}

function spawnRock(game, worldX) {
  const rng = game.rng;
  game.entities.push({
    kind: 'rock',
    worldX,
    y: range(rng, 70, VIEW.h - 70),
    r: range(rng, ROCK.rMin, ROCK.rMax),
    drift: range(rng, -ROCK.drift, ROCK.drift),
    spin: range(rng, -ROCK.spin, ROCK.spin),
    angle: range(rng, 0, Math.PI * 2),
    seed: range(rng, 0, 1000),
  });
}

function spawnHole(game, worldX) {
  const rng = game.rng;
  game.entities.push({
    kind: 'hole',
    worldX,
    y: range(rng, 140, VIEW.h - 140),
    r: HOLE.r,
    phase: range(rng, 0, Math.PI * 2),
  });
}

function spawnPlanet(game, worldX) {
  const rng = game.rng;
  game.entities.push({
    kind: 'planet',
    worldX,
    y: range(rng, 150, VIEW.h - 150),
    r: range(rng, PLANET.rMin, PLANET.rMax),
    color: pick(rng, PLANET_COLORS),
    ring: rng() < 0.5,
    used: false,
    phase: range(rng, 0, Math.PI * 2),
  });
}

// Advance the world: scroll the background, spawn ahead, drop what is behind.
export function updateWorld(game, dt) {
  const horizon = game.distance + VIEW.w + 260;

  // Difficulty ramps gently with distance: rocks get denser.
  const ramp = Math.min(1, game.distance / ROAD.toSun);
  const rockGap = ROCK.spawnGap * (1 - ramp * 0.35);

  while (game.spawn.shard < horizon) {
    spawnShardCluster(game, game.spawn.shard);
    game.spawn.shard += SHARD.spawnGap * 3 + range(game.rng, 0, 260);
  }
  while (game.spawn.rock < horizon) {
    spawnRock(game, game.spawn.rock);
    game.spawn.rock += rockGap + range(game.rng, 0, 320);
  }
  while (game.spawn.hole < horizon) {
    spawnHole(game, game.spawn.hole);
    game.spawn.hole += HOLE.spawnGap + range(game.rng, 0, 1400);
  }
  while (game.spawn.planet < horizon) {
    spawnPlanet(game, game.spawn.planet);
    game.spawn.planet += PLANET.spawnGap + range(game.rng, 0, 1200);
  }

  // Scroll the background (parallax: nearer stars move faster).
  for (const s of game.stars) {
    s.x -= game.speed * s.par * dt;
    if (s.x < -4) {
      s.x += VIEW.w + 8;
      s.y = range(game.rng, 0, VIEW.h);
    }
  }
  for (const n of game.nebulae) {
    n.x -= game.speed * n.par * dt;
    if (n.x < -n.r) n.x += VIEW.w + n.r * 2;
  }

  // Animate entities and drop the ones far behind the comet.
  const keep = [];
  for (const e of game.entities) {
    if (e.kind === 'shard') {
      e.y = e.baseY + Math.sin(game.time * 2 + e.phase) * 10;
    } else if (e.kind === 'rock') {
      e.y += e.drift * dt;
      e.angle += e.spin * dt;
      if (e.y < 40) e.y = 40;
      if (e.y > VIEW.h - 40) e.y = VIEW.h - 40;
    } else if (e.kind === 'hole') {
      e.phase += dt * 1.4;
    } else if (e.kind === 'planet') {
      e.phase += dt * 0.25;
    }
    const sx = e.worldX - game.distance;
    if (sx > -180 && !e.taken) keep.push(e);
  }
  game.entities = keep;
}

// Where the Sun sits on screen, and how big it looks.
// It rises on the right horizon once the comet is close, and grows as it nears.
export function sunOnScreen(game) {
  const progress = game.distance / ROAD.toSun;
  if (game.distance < SUN.appearAt) return null;
  const t = (game.distance - SUN.appearAt) / (ROAD.toSun - SUN.appearAt);
  return {
    x: 1130,
    y: 168,
    r: 34 + t * (SUN.r - 34),
    t,
    progress,
  };
}

// Distance left to the Sun, in whole units.
export function distanceLeft(game) {
  return Math.max(0, Math.round(ROAD.toSun - game.distance));
}
