// Particles: the comet's trail, pickup bursts, impact debris, slingshot flares.
// A particle is { x, y, vx, vy, life, maxLife, size, color, drag, grav }.

export function spawnBurst(game, x, y, color, n, speed, size) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = speed * (0.3 + Math.random() * 0.7);
    game.particles.push({
      x,
      y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
      life: 0,
      maxLife: 0.4 + Math.random() * 0.5,
      size: size * (0.6 + Math.random() * 0.8),
      color,
      drag: 2.2,
      grav: 0,
    });
  }
}

export function spawnTrail(game, x, y, color) {
  game.particles.push({
    x: x + (Math.random() - 0.5) * 6,
    y: y + (Math.random() - 0.5) * 6,
    vx: -40 - Math.random() * 60,
    vy: (Math.random() - 0.5) * 30,
    life: 0,
    maxLife: 0.5 + Math.random() * 0.4,
    size: 2 + Math.random() * 3.5,
    color,
    drag: 1.2,
    grav: 0,
  });
}

// A rising ember wisp (victory ambience around the Sun).
export function spawnWisp(game, x, y) {
  game.particles.push({
    x: x + (Math.random() - 0.5) * 260,
    y: y + (Math.random() - 0.5) * 60,
    vx: (Math.random() - 0.5) * 12,
    vy: -14 - Math.random() * 22,
    life: 0,
    maxLife: 1.6 + Math.random() * 1.4,
    size: 1.5 + Math.random() * 2.5,
    color: '#ffd94d',
    drag: 0.4,
    grav: 0,
  });
}

export function updateParticles(game, dt) {
  const keep = [];
  for (const p of game.particles) {
    p.life += dt;
    if (p.life >= p.maxLife) continue;
    const d = Math.max(0, 1 - p.drag * dt);
    p.vx *= d;
    p.vy *= d;
    p.vy += p.grav * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    keep.push(p);
  }
  // Cap the count so a long run cannot grow the array without bound.
  game.particles = keep.length > 420 ? keep.slice(keep.length - 420) : keep;
}
