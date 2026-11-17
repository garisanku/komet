// Sound: tiny WebAudio synth, no audio files.
// The context is created on the first user gesture (autoplay policy),
// so the title screen stays silent until the player starts.

let ctx = null;
let muted = false;

export function setMuted(m) {
  muted = m;
}

export function ensureAudio() {
  if (ctx) {
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq, dur, type, vol, when = 0, slideTo = null) {
  if (muted || !ctx) return;
  try {
    const t0 = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo !== null) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  } catch {
    // Audio is decoration; a failure must never break the game.
  }
}

// A bright two-note chime when a shard is collected.
export function sfxPickup() {
  tone(880, 0.12, 'sine', 0.16);
  tone(1318, 0.18, 'sine', 0.12, 0.06);
}

// A low thud when the comet hits a rock.
export function sfxHit() {
  tone(140, 0.28, 'sawtooth', 0.2, 0, 55);
  tone(70, 0.3, 'sine', 0.22, 0, 40);
}

// A rising whoosh for a planetary slingshot.
export function sfxSlingshot() {
  tone(320, 0.4, 'sine', 0.14, 0, 980);
  tone(660, 0.3, 'triangle', 0.08, 0.08, 1320);
}

// A warm arpeggio for reaching the Sun.
export function sfxVictory() {
  const notes = [523, 659, 784, 1046, 1318];
  notes.forEach((f, i) => tone(f, 0.34, 'sine', 0.14, i * 0.11));
}

// A falling tone for the crash.
export function sfxGameOver() {
  tone(392, 0.5, 'triangle', 0.16, 0, 98);
  tone(196, 0.7, 'sine', 0.14, 0.12, 65);
}

// A soft click for starting.
export function sfxStart() {
  tone(523, 0.1, 'sine', 0.12);
  tone(784, 0.14, 'sine', 0.1, 0.07);
}
