// Gobble Dash — main: the game loop, state machine and screenshot hooks.
// One clear job: wire input + world + render together and drive the frames.

import { VIEW } from './config.js';
import { createWorld, startRun, updateWorld, buildShotScene } from './world.js';
import { render } from './render.js';
import { createInput } from './input.js';
import { createSoundBank } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const params = new URLSearchParams(window.location.search);
const seed = Number.parseInt(params.get('seed') ?? '20261127', 10) || 20261127;
const shot = params.get('shot');

const sound = createSoundBank();
const world = createWorld(seed);
world.sound = sound;

function resizeCanvas() {
  const scale = Math.min(window.innerWidth / VIEW.width, window.innerHeight / VIEW.height);
  canvas.width = VIEW.width;
  canvas.height = VIEW.height;
  canvas.style.width = `${VIEW.width * scale}px`;
  canvas.style.height = `${VIEW.height * scale}px`;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

function startGame() {
  sound.unlock();
  if (world.state === 'title' || world.state === 'caught' || world.state === 'escaped') {
    startRun(world);
  }
}

function handleClick(click) {
  if (!click) return;
  // Any click on a menu screen starts (or restarts) the run.
  if (world.state === 'title' || world.state === 'caught' || world.state === 'escaped') {
    startGame();
  }
}

const input = createInput(startGame, startGame);
input.attachCanvas(canvas);
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Screenshot mode (?shot=title|play|caught|escaped): render one fixed frame.
if (shot === 'title' || shot === 'play' || shot === 'caught' || shot === 'escaped') {
  if (shot === 'title') {
    world.state = 'title';
    world.time = 1.2;
    world.scrollX = 120;
  } else {
    buildShotScene(world, shot);
  }
  resizeCanvas();
  render(ctx, world);
  document.title = `Gobble Dash — ${shot}`;
} else {
  // Live game loop.
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const actions = input.drain();
    for (const action of actions) {
      if (typeof action === 'object' && action.type === 'click') handleClick(action);
    }
    const keys = actions.filter((a) => typeof a === 'string');
    // Space / Enter also starts (or restarts) the game from any menu screen.
    if (world.state !== 'playing' && (keys.includes('jump') || keys.includes('confirm'))) {
      startGame();
    }
    updateWorld(world, dt, keys);
    // Title screen ambience: slow scroll and a blinking prompt.
    if (world.state === 'title') {
      world.time += dt;
      world.scrollX += dt * 24;
    }
    render(ctx, world);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

// Test hook: lets a headless play-test read and drive the game.
window.__game = {
  world,
  start: startGame,
  press(action) { updateWorld(world, 1 / 60, [action]); },
  state() {
    return {
      state: world.state,
      score: Math.round(world.score),
      distanceM: Math.floor(world.distanceM),
      lives: world.lives,
      gap: Math.round(world.gap),
      obstacles: world.obstacles.length,
      pickups: world.pickups.length,
    };
  },
};

const status = document.getElementById('status');
if (status) {
  status.textContent = 'Gobble Dash: help Gobble the turkey escape Farmer Bramble and reach the woods at 1000 metres.';
}
