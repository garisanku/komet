// Game state: the comet, the sky full of things, and the run's numbers.
// Screens: 'title' | 'playing' | 'paused' | 'victory' | 'gameover'.

import { COMET, ROAD, VIEW } from './config.js';

export function makeGame(rng) {
  return {
    rng,
    screen: 'title',
    time: 0,
    distance: 0,        // units flown toward the Sun
    speed: ROAD.baseSpeed,
    score: 0,
    shards: 0,
    slingshots: 0,
    best: 0,
    comet: {
      x: 220,
      y: VIEW.h / 2,
      vx: 0,
      vy: 0,
      hull: COMET.hull,
      invuln: 0,
      tail: [],         // past positions, newest first
      dead: false,
    },
    // Entities live in world-x (distance along the road); the renderer
    // converts world-x to screen-x with the camera.
    entities: [],       // shards, rocks, holes, planets
    stars: [],          // background starfield (screen-space, parallax)
    nebulae: [],        // soft colour clouds (screen-space, parallax)
    particles: [],
    banner: null,       // { text, sub, until } — big centre message
    flash: 0,           // white/red flash timer (hits)
    shake: 0,           // screen shake timer
    stats: null,        // end-of-run numbers for the victory / game-over screens
    muted: false,
    shot: null,         // screenshot scene name, set by main.js
  };
}

export function resetRun(game) {
  game.screen = 'playing';
  game.time = 0;
  game.distance = 0;
  game.speed = ROAD.baseSpeed;
  game.score = 0;
  game.shards = 0;
  game.slingshots = 0;
  game.comet.x = 220;
  game.comet.y = VIEW.h / 2;
  game.comet.vx = 0;
  game.comet.vy = 0;
  game.comet.hull = COMET.hull;
  game.comet.invuln = 0;
  game.comet.tail = [];
  game.comet.dead = false;
  game.entities = [];
  game.particles = [];
  game.banner = { text: 'FLY, COMET!', sub: 'Reach the Sun — collect shards, dodge rocks', until: 2.5 };
  game.flash = 0;
  game.shake = 0;
  game.stats = null;
}

// Best score, kept in localStorage when the browser allows it.
export function loadBest() {
  try {
    return Number(window.localStorage.getItem('komet.best') || 0) || 0;
  } catch {
    return 0;
  }
}

export function saveBest(score) {
  try {
    window.localStorage.setItem('komet.best', String(score));
  } catch {
    // Storage unavailable (sandboxed iframe): the run still counts.
  }
}
