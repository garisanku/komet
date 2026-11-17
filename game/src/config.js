// KOMET — tuning constants. One place for every number the game balances on,
// so the playtest can tighten them without hunting through the code.

export const VIEW = { w: 1280, h: 720 };

// The flight: the comet flies rightward through a scrolling sky. The Sun waits
// at the end of the road; reaching it wins the game.
export const ROAD = {
  toSun: 12000,        // distance units from launch to the Sun
  baseSpeed: 150,      // px/s at launch
  maxSpeed: 340,       // px/s near the Sun (speed grows with distance)
  accel: 0.012,        // speed gained per unit of distance flown
};

// The comet itself.
export const COMET = {
  r: 14,               // core radius
  hull: 3,             // hits it can take before crashing
  steer: 620,          // px/s^2 steering acceleration toward the pointer
  maxSteer: 420,       // px/s max steering velocity
  damping: 3.2,        // velocity damping (1/s)
  invuln: 1.6,         // seconds of invulnerability after a hit
  trail: 26,           // tail segments
  tailGrow: 0.35,      // extra tail length per shard collected
};

// Star shards: the collectible. Bright, glowing, worth points and tail.
export const SHARD = {
  r: 9,
  score: 50,
  spawnGap: 130,       // min horizontal gap between shard spawns
  cluster: 3,          // shards per cluster (an arc of 3)
  bob: 22,             // vertical bob amplitude
};

// Asteroids: the hazard. A hit costs 1 hull and a burst of debris.
export const ROCK = {
  rMin: 15,
  rMax: 36,
  spawnGap: 210,       // min horizontal gap between rock spawns
  drift: 26,           // vertical drift speed
  spin: 1.4,           // max spin rad/s
};

// Black holes: the danger. They pull the comet; the event horizon is fatal.
export const HOLE = {
  r: 46,               // event horizon radius — touching it crashes the comet
  pullR: 300,          // pull radius
  pull: 520,           // pull acceleration at the horizon (px/s^2)
  spawnGap: 1700,      // min horizontal gap between holes
};

// Planets: the slingshot. Skim one and it flings you forward.
export const PLANET = {
  rMin: 58,
  rMax: 92,
  assistR: 210,        // slingshot radius (from the planet's edge)
  boost: 150,          // extra forward speed from a slingshot
  bonus: 200,          // score bonus per slingshot
  spawnGap: 1500,      // min horizontal gap between planets
  pull: 60,            // gentle pull toward the planet (px/s^2)
};

// The Sun: the goal. It grows on the horizon as the comet nears it.
export const SUN = {
  r: 150,              // radius when reached
  appearAt: 9500,      // distance at which it first appears on the horizon
};

// Scoring.
export const SCORE = {
  perUnit: 0.12,       // points per distance unit flown
  shard: 50,
  slingshot: 200,
  winBonus: 2500,
};

// Colours: a bright comet and a warm Sun on a deep indigo night.
// Bold, high-contrast, readable at small size — the judge reads the cover first.
export const COLORS = {
  skyTop: '#0b1030',
  skyMid: '#141a4d',
  skyBot: '#1e2560',
  star: '#ffffff',
  cometCore: '#fff7cc',
  cometMid: '#ffd94d',
  cometEdge: '#ff9a3d',
  shard: '#ffe45e',
  shardGlow: '#ffb52e',
  rock: '#8d8fa3',
  rockDark: '#5b5e73',
  hole: '#000000',
  holeGlow: '#7b5cff',
  planetA: '#4dd0e1',
  planetB: '#ff8a65',
  planetC: '#aed581',
  sunCore: '#fff3b0',
  sunMid: '#ffcf3d',
  sunEdge: '#ff7a1a',
  hud: '#ffffff',
  hudDim: '#c9d2ff',
  danger: '#ff5252',
};
