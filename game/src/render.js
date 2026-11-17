// Rendering: everything the player sees, on one 1280x720 canvas.
// Bright comet, warm Sun, deep indigo sky — bold, high-contrast, readable
// at small size. The cover (first screenshot) is the title screen.

import { VIEW, COLORS, COMET, ROAD, SCORE } from './config.js';
import { sunOnScreen, distanceLeft } from './world.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawSky(ctx, game) {
  const g = ctx.createLinearGradient(0, 0, 0, VIEW.h);
  g.addColorStop(0, COLORS.skyTop);
  g.addColorStop(0.55, COLORS.skyMid);
  g.addColorStop(1, COLORS.skyBot);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);

  // Soft nebula clouds.
  for (const n of game.nebulae) {
    const ng = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r);
    ng.addColorStop(0, `rgba(${n.hue.r},${n.hue.g},${n.hue.b},${n.a})`);
    ng.addColorStop(1, `rgba(${n.hue.r},${n.hue.g},${n.hue.b},0)`);
    ctx.fillStyle = ng;
    ctx.fillRect(n.x - n.r, n.y - n.r, n.r * 2, n.r * 2);
  }

  // Twinkling stars.
  for (const s of game.stars) {
    const tw = 0.55 + 0.45 * Math.sin(game.time * 1.6 + s.tw);
    ctx.globalAlpha = tw;
    ctx.fillStyle = COLORS.star;
    ctx.fillRect(s.x, s.y, s.size, s.size);
  }
  ctx.globalAlpha = 1;
}

function drawSun(ctx, game) {
  const sun = sunOnScreen(game);
  if (!sun) return;
  const { x, y, r } = sun;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const halo = ctx.createRadialGradient(x, y, r * 0.2, x, y, r * 3.2);
  halo.addColorStop(0, 'rgba(255,207,61,0.55)');
  halo.addColorStop(0.4, 'rgba(255,122,26,0.22)');
  halo.addColorStop(1, 'rgba(255,122,26,0)');
  ctx.fillStyle = halo;
  ctx.fillRect(x - r * 3.2, y - r * 3.2, r * 6.4, r * 6.4);
  ctx.restore();

  const body = ctx.createRadialGradient(x - r * 0.25, y - r * 0.25, r * 0.1, x, y, r);
  body.addColorStop(0, COLORS.sunCore);
  body.addColorStop(0.55, COLORS.sunMid);
  body.addColorStop(1, COLORS.sunEdge);
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function drawShard(ctx, e, game) {
  const sx = e.worldX - game.distance;
  const pulse = 1 + 0.18 * Math.sin(game.time * 4 + e.phase);
  const r = e.r * pulse;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(sx, e.y, 0, sx, e.y, r * 3);
  g.addColorStop(0, 'rgba(255,228,94,0.85)');
  g.addColorStop(0.4, 'rgba(255,181,46,0.35)');
  g.addColorStop(1, 'rgba(255,181,46,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(sx, e.y, r * 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // A four-point star.
  ctx.fillStyle = COLORS.shard;
  ctx.beginPath();
  ctx.moveTo(sx, e.y - r * 1.4);
  ctx.quadraticCurveTo(sx, e.y, sx + r * 1.4, e.y);
  ctx.quadraticCurveTo(sx, e.y, sx, e.y + r * 1.4);
  ctx.quadraticCurveTo(sx, e.y, sx - r * 1.4, e.y);
  ctx.quadraticCurveTo(sx, e.y, sx, e.y - r * 1.4);
  ctx.fill();
}

function drawRock(ctx, e, game) {
  const sx = e.worldX - game.distance;
  ctx.save();
  ctx.translate(sx, e.y);
  ctx.rotate(e.angle);
  ctx.fillStyle = COLORS.rockDark;
  ctx.strokeStyle = COLORS.rock;
  ctx.lineWidth = 2;
  ctx.beginPath();
  const n = 9;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    const rr = e.r * (0.78 + 0.22 * Math.sin(e.seed + i * 2.7));
    const px = Math.cos(a) * rr;
    const py = Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Craters.
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.arc(-e.r * 0.3, -e.r * 0.2, e.r * 0.22, 0, Math.PI * 2);
  ctx.arc(e.r * 0.35, e.r * 0.3, e.r * 0.16, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawHole(ctx, e, game) {
  const sx = e.worldX - game.distance;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(sx, e.y, e.r * 0.4, sx, e.y, e.r * 2.6);
  g.addColorStop(0, 'rgba(123,92,255,0.5)');
  g.addColorStop(0.55, 'rgba(123,92,255,0.16)');
  g.addColorStop(1, 'rgba(123,92,255,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(sx, e.y, e.r * 2.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Accretion ring (a tilted ellipse, rotating).
  ctx.save();
  ctx.translate(sx, e.y);
  ctx.rotate(Math.sin(e.phase) * 0.2);
  ctx.strokeStyle = 'rgba(180,160,255,0.85)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(0, 0, e.r * 1.5, e.r * 0.55, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(123,92,255,0.4)';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.ellipse(0, 0, e.r * 1.8, e.r * 0.7, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // The event horizon: pure black.
  ctx.fillStyle = COLORS.hole;
  ctx.beginPath();
  ctx.arc(sx, e.y, e.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(200,180,255,0.9)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawPlanet(ctx, e, game) {
  const sx = e.worldX - game.distance;
  const col = COLORS[e.color];
  const g = ctx.createRadialGradient(sx - e.r * 0.3, e.y - e.r * 0.3, e.r * 0.1, sx, e.y, e.r);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.25, col);
  g.addColorStop(1, '#1a1440');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(sx, e.y, e.r, 0, Math.PI * 2);
  ctx.fill();
  if (e.ring) {
    ctx.save();
    ctx.translate(sx, e.y);
    ctx.rotate(-0.35);
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.ellipse(0, 0, e.r * 1.7, e.r * 0.45, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  // Slingshot radius hint (faint, only when the comet is near).
  const dx = sx - game.comet.x;
  const dy = e.y - game.comet.y;
  const d = Math.hypot(dx, dy);
  if (d < 340 && !e.used) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.setLineDash([6, 8]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(sx, e.y, e.r + 210 * 0.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

function drawComet(ctx, game) {
  const c = game.comet;
  // Tail: a ribbon of fading glow, newest first.
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const tailLen = COMET.trail + Math.floor(game.shards * COMET.tailGrow);
  for (let i = c.tail.length - 1; i >= 0; i--) {
    const p = c.tail[i];
    const t = 1 - i / Math.max(1, tailLen);
    const r = 3 + t * 11;
    const a = t * 0.55;
    const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 2.2);
    g.addColorStop(0, `rgba(255,217,77,${a})`);
    g.addColorStop(0.5, `rgba(255,154,61,${a * 0.5})`);
    g.addColorStop(1, 'rgba(255,154,61,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r * 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Core: bright head with a hot centre.
  const blink = c.invuln > 0 && Math.floor(game.time * 14) % 2 === 0;
  ctx.save();
  if (blink) ctx.globalAlpha = 0.35;
  ctx.globalCompositeOperation = 'lighter';
  const halo = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, COMET.r * 3.4);
  halo.addColorStop(0, 'rgba(255,247,204,0.95)');
  halo.addColorStop(0.35, 'rgba(255,217,77,0.6)');
  halo.addColorStop(1, 'rgba(255,154,61,0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(c.x, c.y, COMET.r * 3.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = COLORS.cometCore;
  ctx.beginPath();
  ctx.arc(c.x, c.y, COMET.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(c.x - 3, c.y - 3, COMET.r * 0.45, 0, Math.PI * 2);
  ctx.fill();
}

function drawParticles(ctx, game) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const p of game.particles) {
    const t = 1 - p.life / p.maxLife;
    ctx.globalAlpha = Math.max(0, t);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * (0.5 + t * 0.5), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}

function drawHud(ctx, game) {
  ctx.save();
  ctx.textBaseline = 'top';
  // Score + shards, top left.
  ctx.fillStyle = COLORS.hud;
  ctx.font = '700 26px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`SCORE ${Math.floor(game.score).toLocaleString('en-US')}`, 20, 16);
  ctx.fillStyle = COLORS.shard;
  ctx.font = '700 20px system-ui, sans-serif';
  ctx.fillText(`✦ ${game.shards} shards`, 20, 48);
  // Hull hearts, top right.
  ctx.textAlign = 'right';
  ctx.font = '26px system-ui, sans-serif';
  let hearts = '';
  for (let i = 0; i < COMET.hull; i++) hearts += i < game.comet.hull ? '♥ ' : '♡ ';
  ctx.fillStyle = game.comet.hull <= 1 ? COLORS.danger : '#ff6b81';
  ctx.fillText(hearts.trim(), VIEW.w - 20, 16);
  ctx.fillStyle = COLORS.hudDim;
  ctx.font = '600 16px system-ui, sans-serif';
  ctx.fillText(`speed ${Math.round(game.speed)}`, VIEW.w - 20, 50);
  // Progress to the Sun, top centre.
  const progress = Math.min(1, game.distance / ROAD.toSun);
  const bw = 420;
  const bx = (VIEW.w - bw) / 2;
  const by = 20;
  ctx.fillStyle = 'rgba(255,255,255,0.16)';
  roundRect(ctx, bx, by, bw, 14, 7);
  ctx.fill();
  ctx.fillStyle = COLORS.sunMid;
  roundRect(ctx, bx, by, bw * progress, 14, 7);
  ctx.fill();
  ctx.fillStyle = COLORS.hud;
  ctx.font = '700 15px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`☀ ${distanceLeft(game).toLocaleString('en-US')} to the Sun`, VIEW.w / 2, 40);
  ctx.restore();

  // Banner (big centre message).
  if (game.banner && game.time < game.banner.until) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.font = '800 44px system-ui, sans-serif';
    ctx.shadowColor = 'rgba(255,180,60,0.8)';
    ctx.shadowBlur = 24;
    ctx.fillText(game.banner.text, VIEW.w / 2, 250);
    ctx.shadowBlur = 0;
    if (game.banner.sub) {
      ctx.fillStyle = COLORS.hudDim;
      ctx.font = '600 20px system-ui, sans-serif';
      ctx.fillText(game.banner.sub, VIEW.w / 2, 306);
    }
    ctx.restore();
  }
}

function drawTitle(ctx, game) {
  ctx.save();
  // A dim veil so the text reads over the sky.
  ctx.fillStyle = 'rgba(5,8,28,0.45)';
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 96px system-ui, sans-serif';
  ctx.shadowColor = 'rgba(255,190,60,0.9)';
  ctx.shadowBlur = 34;
  ctx.fillText('KOMET', VIEW.w / 2, 150);
  ctx.shadowBlur = 0;
  ctx.fillStyle = COLORS.sunMid;
  ctx.font = '700 26px system-ui, sans-serif';
  ctx.fillText('Ride the comet. Reach the Sun.', VIEW.w / 2, 262);
  ctx.fillStyle = COLORS.hudDim;
  ctx.font = '600 20px system-ui, sans-serif';
  ctx.fillText('Steer with the mouse or arrow keys — collect ✦ shards,', VIEW.w / 2, 330);
  ctx.fillText('dodge rocks, escape black holes, slingshot around planets.', VIEW.w / 2, 358);
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 24px system-ui, sans-serif';
  const pulse = 0.7 + 0.3 * Math.sin(game.time * 3);
  ctx.globalAlpha = pulse;
  ctx.fillText('Press ENTER or CLICK to begin', VIEW.w / 2, 430);
  ctx.globalAlpha = 1;
  if (game.best > 0) {
    ctx.fillStyle = COLORS.hudDim;
    ctx.font = '600 18px system-ui, sans-serif';
    ctx.fillText(`Best score: ${Math.floor(game.best).toLocaleString('en-US')}`, VIEW.w / 2, 478);
  }
  ctx.restore();
}

function drawEnd(ctx, game, won) {
  const s = game.stats || { score: game.score, shards: game.shards, slingshots: game.slingshots, distance: game.distance };
  ctx.save();
  ctx.fillStyle = won ? 'rgba(20,26,8,0.5)' : 'rgba(20,6,10,0.55)';
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);
  ctx.textAlign = 'center';
  ctx.fillStyle = won ? COLORS.sunMid : '#ff8a80';
  ctx.font = '900 64px system-ui, sans-serif';
  ctx.shadowColor = won ? 'rgba(255,200,60,0.9)' : 'rgba(255,60,60,0.7)';
  ctx.shadowBlur = 28;
  ctx.fillText(won ? 'YOU REACHED THE SUN!' : 'THE COMET CRASHED', VIEW.w / 2, 150);
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 26px system-ui, sans-serif';
  ctx.fillText(
    won ? 'The night is over — dawn breaks because of you.' : 'The night keeps the comet. Fly again.',
    VIEW.w / 2,
    236,
  );
  ctx.fillStyle = COLORS.hudDim;
  ctx.font = '600 22px system-ui, sans-serif';
  const dist = Math.floor(s.distance).toLocaleString('en-US');
  ctx.fillText(`Score ${Math.floor(s.score).toLocaleString('en-US')}    ✦ ${s.shards} shards    ⤴ ${s.slingshots} slingshots    ${dist} flown`, VIEW.w / 2, 300);
  if (game.best > 0) {
    ctx.fillText(`Best score: ${Math.floor(game.best).toLocaleString('en-US')}`, VIEW.w / 2, 336);
  }
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 24px system-ui, sans-serif';
  const pulse = 0.7 + 0.3 * Math.sin(game.time * 3);
  ctx.globalAlpha = pulse;
  ctx.fillText('Press ENTER or CLICK to fly again', VIEW.w / 2, 400);
  ctx.globalAlpha = 1;
  ctx.restore();
}

export function render(ctx, game) {
  ctx.save();
  // Screen shake (after a hit).
  if (game.shake > 0) {
    const m = game.shake * 7;
    ctx.translate((Math.random() - 0.5) * m, (Math.random() - 0.5) * m);
  }
  drawSky(ctx, game);
  drawSun(ctx, game);
  for (const e of game.entities) {
    const sx = e.worldX - game.distance;
    if (sx < -200 || sx > VIEW.w + 200) continue;
    if (e.kind === 'shard' && !e.taken) drawShard(ctx, e, game);
    else if (e.kind === 'rock') drawRock(ctx, e, game);
    else if (e.kind === 'hole') drawHole(ctx, e, game);
    else if (e.kind === 'planet') drawPlanet(ctx, e, game);
  }
  if (game.screen !== 'title') drawComet(ctx, game);
  else if (game.comet.tail.length > 0) drawComet(ctx, game);
  drawParticles(ctx, game);
  ctx.restore();

  // Hit flash.
  if (game.flash > 0) {
    ctx.fillStyle = `rgba(255,60,60,${Math.min(0.35, game.flash * 0.5)})`;
    ctx.fillRect(0, 0, VIEW.w, VIEW.h);
  }

  if (game.screen === 'title') drawTitle(ctx, game);
  else if (game.screen === 'playing' || game.screen === 'paused') drawHud(ctx, game);
  else if (game.screen === 'victory') drawEnd(ctx, game, true);
  else if (game.screen === 'gameover') drawEnd(ctx, game, false);

  if (game.screen === 'paused') {
    ctx.save();
    ctx.fillStyle = 'rgba(5,8,28,0.6)';
    ctx.fillRect(0, 0, VIEW.w, VIEW.h);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 56px system-ui, sans-serif';
    ctx.fillText('PAUSED', VIEW.w / 2, 300);
    ctx.font = '600 20px system-ui, sans-serif';
    ctx.fillStyle = COLORS.hudDim;
    ctx.fillText('Press P to resume', VIEW.w / 2, 368);
    ctx.restore();
  }
}
