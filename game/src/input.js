// Gobble Dash — input: keyboard and mouse, one clear job.
// Space / Up / W jump, Down / S slide, Shift / Right dash, H hide, R restart,
// M mute, Enter / click starts. Exposes a tiny queue the game loop consumes.

export function createInput(onStart, onRestart) {
  const pressed = new Set();
  const queue = [];

  function push(action) { queue.push(action); }

  function keyToAction(code) {
    if (code === 'Space' || code === 'ArrowUp' || code === 'KeyW') return 'jump';
    if (code === 'ArrowDown' || code === 'KeyS') return 'slide';
    if (code === 'ShiftLeft' || code === 'ShiftRight' || code === 'ArrowRight' || code === 'KeyD') return 'dash';
    if (code === 'KeyH') return 'hide';
    if (code === 'KeyR') return 'restart';
    if (code === 'KeyM') return 'mute';
    if (code === 'Enter') return 'confirm';
    return null;
  }

  function onKeyDown(event) {
    if (event.repeat) return;
    const action = keyToAction(event.code);
    if (!action) return;
    event.preventDefault();
    pressed.add(action);
    if (action === 'restart') { onRestart(); return; }
    if (action === 'confirm') { onStart(); return; }
    push(action);
  }

  function onKeyUp(event) {
    const action = keyToAction(event.code);
    if (action) pressed.delete(action);
  }

  function onMouseDown(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    push({ type: 'click', x: event.clientX - rect.left, y: event.clientY - rect.top });
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  return {
    attachCanvas(canvas) { canvas.addEventListener('mousedown', onMouseDown); },
    drain() { return queue.splice(0, queue.length); },
    isHeld(action) { return pressed.has(action); },
  };
}
