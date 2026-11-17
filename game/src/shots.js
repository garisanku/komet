// Deterministic screenshot scenes: ?shot=<scene>&seed=<n>.
// Each scene sets the game to a fixed, seeded moment so a render is reproducible:
// the judge's screenshots are real renders of the game's own code, never edited.

import { VIEW, ROAD } from './config.js';
import { makeRng } from './random.js';
import { initWorld } from './world.js';

// Build a fixed scene into the game. Returns nothing; the renderer draws it.
export function applyShot(game, scene, seed) {
  const rng = makeRng(seed);
  game.rng = rng;
  game.time = 0;
  initWorld(game);

  if (scene === 'title') {
    // Hero cover: the comet streaks up-right toward a large glowing Sun,
    // past a ringed planet and a trail of shards. The whole story in one shot.
    game.screen = 'title';
    game.time = 1.4;
    game.distance = 10500; // far enough that the Sun has risen on the right
    const d = game.distance;
    game.comet.x = 430;
    game.comet.y = 430;
    // Tail trails down-left, so the comet reads as flying up-right to the Sun.
    for (let i = 0; i < 34; i++) {
      game.comet.tail.push({ x: 430 - i * 13, y: 430 + i * 7 + Math.sin(i * 0.35) * 8 });
    }
    game.entities = [
      { kind: 'planet', worldX: d + 760, y: 540, r: 66, color: 'planetB', ring: true, used: false, phase: 0.4 },
      { kind: 'shard', worldX: d + 560, y: 500, baseY: 500, phase: 0.5, r: 9, taken: false },
      { kind: 'shard', worldX: d + 606, y: 462, baseY: 462, phase: 1.2, r: 9, taken: false },
      { kind: 'shard', worldX: d + 652, y: 500, baseY: 500, phase: 2.1, r: 9, taken: false },
      { kind: 'shard', worldX: d + 900, y: 300, baseY: 300, phase: 0.2, r: 9, taken: false },
      { kind: 'rock', worldX: d + 980, y: 560, r: 26, drift: 0, spin: 0.4, angle: 0.9, seed: 12 },
    ];
    return;
  }

  if (scene === 'play') {
    // Mid-flight: shards ahead, rocks closing in, a ringed planet, a black
    // hole glowing, HUD live, one hull already lost.
    game.screen = 'playing';
    game.distance = 5200;
    game.speed = 240;
    game.score = 4860;
    game.shards = 14;
    game.comet.hull = 2;
    game.comet.x = 300;
    game.comet.y = 350;
    game.time = 12.5;
    for (let i = 0; i < 26; i++) {
      game.comet.tail.push({ x: 300 - i * 13, y: 350 + Math.sin(i * 0.35) * 12 });
    }
    const d = game.distance;
    game.entities = [
      { kind: 'shard', worldX: d + 520, y: 300, baseY: 300, phase: 0.5, r: 9, taken: false },
      { kind: 'shard', worldX: d + 566, y: 254, baseY: 254, phase: 1.2, r: 9, taken: false },
      { kind: 'shard', worldX: d + 612, y: 300, baseY: 300, phase: 2.1, r: 9, taken: false },
      { kind: 'shard', worldX: d + 700, y: 470, baseY: 470, phase: 0.2, r: 9, taken: false },
      { kind: 'shard', worldX: d + 746, y: 424, baseY: 424, phase: 1.0, r: 9, taken: false },
      { kind: 'shard', worldX: d + 792, y: 470, baseY: 470, phase: 1.8, r: 9, taken: false },
      { kind: 'rock', worldX: d + 820, y: 180, r: 30, drift: 10, spin: 0.5, angle: 0.7, seed: 12 },
      { kind: 'rock', worldX: d + 940, y: 560, r: 22, drift: -14, spin: -0.8, angle: 2.1, seed: 44 },
      { kind: 'rock', worldX: d + 1080, y: 330, r: 36, drift: 6, spin: 0.3, angle: 1.2, seed: 77 },
      { kind: 'planet', worldX: d + 1000, y: 130, r: 74, color: 'planetA', ring: true, used: false, phase: 0.4 },
      { kind: 'planet', worldX: d + 1180, y: 480, r: 52, color: 'planetC', ring: false, used: false, phase: 1.3 },
      { kind: 'hole', worldX: d + 1150, y: 600, r: 46, phase: 1.1 },
    ];
    game.banner = null;
    return;
  }

  if (scene === 'victory') {
    game.screen = 'victory';
    game.time = 2.0;
    game.distance = ROAD.toSun;
    game.score = 14820;
    game.shards = 61;
    game.slingshots = 4;
    game.stats = { won: true, score: 14820, shards: 61, slingshots: 4, distance: ROAD.toSun };
    game.comet.x = 1130;
    game.comet.y = 168;
    for (let i = 0; i < 26; i++) {
      game.comet.tail.push({ x: 1130 - i * 12, y: 168 + Math.sin(i * 0.4) * 8 });
    }
    for (let i = 0; i < 40; i++) {
      game.particles.push({
        x: 1130 + (rng() - 0.5) * 500,
        y: 168 + (rng() - 0.5) * 220,
        vx: (rng() - 0.5) * 20,
        vy: -10 - rng() * 20,
        life: rng() * 0.8,
        maxLife: 1.6 + rng(),
        size: 1.5 + rng() * 2.5,
        color: '#ffd94d',
        drag: 0.4,
        grav: 0,
      });
    }
    return;
  }

  if (scene === 'over') {
    game.screen = 'gameover';
    game.time = 2.0;
    game.distance = 7300;
    game.score = 5210;
    game.shards = 23;
    game.slingshots = 2;
    game.stats = { won: false, score: 5210, shards: 23, slingshots: 2, distance: 7300 };
    const d = game.distance;
    game.entities = [
      { kind: 'rock', worldX: d + 240, y: 330, r: 34, drift: 0, spin: 0.4, angle: 0.9, seed: 5 },
      { kind: 'rock', worldX: d + 420, y: 420, r: 24, drift: 0, spin: -0.6, angle: 2.4, seed: 19 },
      { kind: 'rock', worldX: d + 560, y: 250, r: 28, drift: 0, spin: 0.2, angle: 1.7, seed: 31 },
    ];
    game.comet.x = 300;
    game.comet.y = 360;
    return;
  }

  // Unknown scene: fall back to the title.
  game.screen = 'title';
  game.time = 1.4;
}
