// Gobble Dash — world: game state, spawning, physics, collisions, farmer AI.
// One clear job: the rules of the run. Rendering lives in art.js, the loop in main.js.

import { VIEW, TURKEY, FARMER, RUN, STAGES, OBSTACLES, PICKUPS, SPAWN_TABLE, mulberry32 } from './config.js';

export function stageFor(distanceM) {
  let stage = STAGES[0];
  for (const candidate of STAGES) {
    if (distanceM >= candidate.fromM) stage = candidate;
  }
  return stage;
}

export function stageIndexFor(distanceM) {
  let index = 0;
  STAGES.forEach((stage, i) => { if (distanceM >= stage.fromM) index = i; });
  return index;
}

export function createWorld(seed) {
  const random = mulberry32(seed);
  return {
    seed,
    random,
    state: 'title',
    time: 0,
    distanceM: 0,
    score: 0,
    lives: RUN.maxLives,
    speed: RUN.baseSpeed,
    scrollX: 0,
    gap: FARMER.startGap,
    turkey: { y: VIEW.groundY, vy: 0, jumping: false, slidingUntil: 0, hiddenUntil: 0, hideReadyAt: 0, dashReadyAt: 0, invulnerableUntil: 0, runPhase: 0 },
    farmer: { runPhase: 0, searching: false, searchUntil: 0 },
    obstacles: [],
    pickups: [],
    haystacks: [],
    bursts: [],
    nextSpawnX: 900,
    lastSpawnAtM: 0,
    mudSlowUntil: 0,
    endStats: null,
    message: '',
    messageUntil: 0,
  };
}

function pickObstacleKind(world) {
  const table = SPAWN_TABLE[stageIndexFor(world.distanceM)];
  const entries = Object.entries(table);
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = world.random() * total;
  for (const [kind, weight] of entries) {
    roll -= weight;
    if (roll <= 0) return kind;
  }
  return 'fence';
}

function spawnRow(world) {
  const x = world.nextSpawnX;
  const kind = pickObstacleKind(world);
  const spec = OBSTACLES[kind];
  world.obstacles.push({ kind, x, width: spec.width, height: spec.height, passed: false });
  // Corn often arcs over a jumpable obstacle; a feather sometimes floats high.
  if (spec.slideUnder !== true && world.random() < 0.75) {
    const arcY = VIEW.groundY - spec.height - 46;
    for (let i = 0; i < 3; i++) {
      world.pickups.push({ kind: 'corn', x: x + 10 + i * 26, y: arcY + (i === 1 ? -18 : 0), taken: false });
    }
  } else if (world.random() < 0.3) {
    world.pickups.push({ kind: 'corn', x: x + 30, y: VIEW.groundY - 40, taken: false });
  }
  if (world.random() < 0.12) {
    world.pickups.push({ kind: 'feather', x: x + 160, y: VIEW.groundY - 150, taken: false });
  }
  // A haystack to hide in shows up now and then, never in the kitchen.
  if (stageIndexFor(world.distanceM) < 2 && world.random() < 0.22) {
    world.haystacks.push({ x: x + 260, used: false });
  }
  world.nextSpawnX = x + 340 + world.random() * 260;
}

function turkeyBox(world) {
  const turkey = world.turkey;
  const sliding = world.time < turkey.slidingUntil;
  const height = sliding ? TURKEY.slideHeight : TURKEY.height;
  const top = turkey.y - height;
  return { x: TURKEY.x - 26, y: top, width: 52, height };
}

function overlaps(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

export function flashMessage(world, text, ms = 1800) {
  world.message = text;
  world.messageUntil = world.time + ms / 1000;
}

export function startRun(world) {
  const fresh = createWorld((world.seed + 7) >>> 0);
  Object.assign(world, fresh, { state: 'playing' });
}

export function updateWorld(world, dt, actions) {
  world.time += dt;
  const turkey = world.turkey;

  for (const action of actions) {
    if (typeof action === 'string') handleAction(world, action);
  }

  if (world.state !== 'playing') return;

  // Speed grows with stage; mud slows the turkey and lets the farmer gain.
  const stageIndex = stageIndexFor(world.distanceM);
  let speed = RUN.baseSpeed + stageIndex * RUN.speedPerStage;
  if (world.time < world.mudSlowUntil) speed *= 0.55;
  if (world.time < turkey.hiddenUntil) speed = 0;
  world.speed = speed;

  const distanceStep = (speed * dt) / 14; // ~14 px per metre.
  world.distanceM += distanceStep;
  world.score += distanceStep * RUN.scorePerMetre;
  world.scrollX += speed * dt;
  turkey.runPhase += dt * (speed / 28);
  world.farmer.runPhase += dt * (speed / 26);

  // The farmer gains on a slow turkey, falls back on a clean run.
  if (world.time < turkey.hiddenUntil) {
    world.gap += 12 * dt; // He cannot see the turkey while it hides.
  } else if (world.time < world.mudSlowUntil) {
    world.gap -= FARMER.driftForwardOnSlow * dt;
  } else {
    world.gap = Math.min(FARMER.startGap + 40, world.gap + FARMER.driftBackPerSecond * dt);
  }
  // Searching: he stops at the haystack, puzzled, and the gap opens up.
  if (world.farmer.searching) {
    if (world.time >= world.farmer.searchUntil) {
      world.farmer.searching = false;
    } else {
      world.gap = Math.min(FARMER.startGap + 60, world.gap + 30 * dt);
    }
  }

  // Turkey vertical physics.
  if (turkey.jumping) {
    turkey.vy += 2100 * dt;
    turkey.y += turkey.vy * dt;
    if (turkey.y >= VIEW.groundY) {
      turkey.y = VIEW.groundY;
      turkey.vy = 0;
      turkey.jumping = false;
    }
  }

  // Move the world left past the turkey.
  const move = speed * dt;
  for (const obstacle of world.obstacles) obstacle.x -= move;
  for (const pickup of world.pickups) pickup.x -= move;
  for (const haystack of world.haystacks) haystack.x -= move;
  world.obstacles = world.obstacles.filter((o) => o.x + o.width > -40);
  world.pickups = world.pickups.filter((p) => p.x > -40 && !p.taken);
  world.haystacks = world.haystacks.filter((h) => h.x > -140);

  // Spawn ahead as the run covers ground.
  if (world.scrollX > world.nextSpawnX - VIEW.width) spawnRow(world);

  // Pickups.
  const box = turkeyBox(world);
  for (const pickup of world.pickups) {
    if (pickup.taken) continue;
    const spec = PICKUPS[pickup.kind];
    if (overlaps(box, { x: pickup.x - spec.width / 2, y: pickup.y - spec.height / 2, width: spec.width, height: spec.height })) {
      pickup.taken = true;
      world.score += spec.score;
      world.bursts.push({ x: pickup.x, y: pickup.y, born: world.time, kind: pickup.kind });
    }
  }
  world.bursts = world.bursts.filter((b) => world.time - b.born < 0.5);

  // Obstacle collisions.
  const invulnerable = world.time < turkey.invulnerableUntil;
  const hidden = world.time < turkey.hiddenUntil;
  for (const obstacle of world.obstacles) {
    if (!obstacle.passed && obstacle.x + obstacle.width < TURKEY.x - 26) {
      obstacle.passed = true;
      world.score += RUN.obstacleScore;
    }
    const spec = OBSTACLES[obstacle.kind];
    const obstacleBox = { x: obstacle.x, y: VIEW.groundY - obstacle.height, width: obstacle.width, height: obstacle.height };
    if (hidden || invulnerable || !overlaps(box, obstacleBox)) continue;
    if (spec.slows) {
      world.mudSlowUntil = world.time + 1.1;
      obstacle.passed = true;
      flashMessage(world, 'MUD! The farmer is gaining…', 1400);
      continue;
    }
    hitObstacle(world);
    break;
  }

  // Caught? Escaped?
  if (world.gap <= FARMER.catchGap || world.lives <= 0) {
    endRun(world, 'caught');
  } else if (world.distanceM >= RUN.goalDistanceM) {
    endRun(world, 'escaped');
  }
}

function handleAction(world, action) {
  const turkey = world.turkey;
  if (world.state !== 'playing') return;
  if (action === 'jump' && !turkey.jumping && world.time >= turkey.hiddenUntil) {
    turkey.jumping = true;
    turkey.vy = TURKEY.jumpVelocity;
    world.sound?.jump();
  } else if (action === 'slide') {
    turkey.slidingUntil = world.time + 0.6;
  } else if (action === 'dash') {
    if (world.time >= turkey.dashReadyAt) {
      turkey.dashReadyAt = world.time + TURKEY.dashCooldownMs / 1000;
      world.gap = Math.min(FARMER.startGap + 40, world.gap + TURKEY.dashGapBonus);
      world.score += 15;
      world.sound?.dash();
      flashMessage(world, 'DASH! Gobble bursts ahead!', 1200);
    }
  } else if (action === 'hide') {
    if (world.time < turkey.hideReadyAt) return;
    const near = world.haystacks.find((h) => Math.abs(h.x - TURKEY.x) < 130 && !h.used);
    if (!near) {
      flashMessage(world, 'No haystack nearby — hide needs hay!', 1400);
      return;
    }
    near.used = true;
    turkey.hideReadyAt = world.time + TURKEY.hideCooldownMs / 1000;
    turkey.hiddenUntil = world.time + TURKEY.hideDurationMs / 1000;
    world.farmer.searching = true;
    world.farmer.searchUntil = world.time + TURKEY.hideDurationMs / 1000;
    world.gap += FARMER.searchGapBonus;
    world.sound?.hide();
    flashMessage(world, 'Hidden! Farmer Bramble is searching…', 2000);
  } else if (action === 'mute') {
    world.sound?.toggleMute?.();
  }
}

function hitObstacle(world) {
  const turkey = world.turkey;
  world.lives -= 1;
  world.gap = Math.max(FARMER.catchGap + 4, world.gap - FARMER.lungeOnHit);
  turkey.invulnerableUntil = world.time + TURKEY.invulnerableMs / 1000;
  world.sound?.hit();
  flashMessage(world, world.lives > 0 ? 'OUCH! Farmer Bramble lunges closer!' : 'One more hit and dinner is served…', 1600);
}

function endRun(world, outcome) {
  world.state = outcome;
  world.endStats = {
    outcome,
    score: Math.round(world.score),
    distanceM: Math.floor(world.distanceM),
    lives: world.lives,
    stage: stageFor(world.distanceM).name,
    timeS: world.time.toFixed(1),
  };
  if (outcome === 'caught') world.sound?.caught();
  else world.sound?.escaped();
}

// Deterministic staged frames for screenshots (?shot=play|caught|escaped).
export function buildShotScene(world, shot) {
  startRun(world);
  if (shot === 'play') {
    world.distanceM = 412;
    world.score = 486;
    world.lives = 3;
    world.gap = 150;
    world.turkey.jumping = true;
    world.turkey.y = VIEW.groundY - 96;
    world.turkey.vy = -220;
    world.turkey.runPhase = 2.4;
    world.obstacles = [
      { kind: 'fence', x: 560, width: 34, height: 62, passed: false },
      { kind: 'pumpkin', x: 760, width: 46, height: 42, passed: false },
      { kind: 'knife', x: 880, width: 30, height: 96, passed: false },
    ];
    world.pickups = [
      { kind: 'corn', x: 470, y: VIEW.groundY - 130, taken: false },
      { kind: 'corn', x: 500, y: VIEW.groundY - 150, taken: false },
      { kind: 'corn', x: 530, y: VIEW.groundY - 130, taken: false },
      { kind: 'feather', x: 700, y: VIEW.groundY - 170, taken: false },
    ];
    world.haystacks = [{ x: 330, used: false }];
    world.time = 24.5;
    flashMessage(world, '', 0);
  } else if (shot === 'caught') {
    world.distanceM = 688;
    world.score = 812;
    world.lives = 0;
    world.gap = FARMER.catchGap;
    world.time = 41.2;
    endRun(world, 'caught');
  } else if (shot === 'escaped') {
    world.distanceM = RUN.goalDistanceM;
    world.score = 1240;
    world.lives = 2;
    world.time = 58.4;
    endRun(world, 'escaped');
  }
}
