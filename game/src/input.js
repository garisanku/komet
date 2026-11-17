// Input: pointer (mouse + touch) and keyboard.
// The comet steers toward the pointer; arrows/WASD steer without one.
// Enter/Space starts and restarts; P pauses; M mutes.

export function makeInput(canvas) {
  const input = {
    pointer: { x: 640, y: 360, active: false },
    keys: new Set(),
    // Edge-triggered presses, consumed by the game each frame.
    pressed: new Set(),
  };

  function toLocal(e) {
    const r = canvas.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * canvas.width;
    const y = ((e.clientY - r.top) / r.height) * canvas.height;
    return { x, y };
  }

  canvas.addEventListener('pointermove', (e) => {
    const p = toLocal(e);
    input.pointer.x = p.x;
    input.pointer.y = p.y;
    input.pointer.active = true;
  });
  canvas.addEventListener('pointerdown', (e) => {
    const p = toLocal(e);
    input.pointer.x = p.x;
    input.pointer.y = p.y;
    input.pointer.active = true;
    input.pressed.add('tap');
  });

  window.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) {
      e.preventDefault();
    }
    if (!e.repeat) input.pressed.add(k);
    input.keys.add(k);
  });
  window.addEventListener('keyup', (e) => {
    input.keys.delete(e.key.toLowerCase());
  });
  window.addEventListener('blur', () => {
    input.keys.clear();
  });

  // Steering vector from keys: -1..1 on each axis.
  input.keySteer = function () {
    let x = 0;
    let y = 0;
    if (input.keys.has('arrowleft') || input.keys.has('a')) x -= 1;
    if (input.keys.has('arrowright') || input.keys.has('d')) x += 1;
    if (input.keys.has('arrowup') || input.keys.has('w')) y -= 1;
    if (input.keys.has('arrowdown') || input.keys.has('s')) y += 1;
    return { x, y };
  };

  input.consume = function () {
    const p = input.pressed;
    input.pressed = new Set();
    return p;
  };

  return input;
}
