// Gobble Dash — configuration: tuning, stages, obstacle and pickup tables.
// One clear job: every number the game balances lives here, nowhere else.

export const VIEW = { width: 960, height: 540, groundY: 452 };

export const TURKEY = {
  x: 220,
  width: 64,
  height: 58,
  slideHeight: 30,
  jumpVelocity: -760,
  gravity: 2100,
  dashCooldownMs: 4000,
  dashGapBonus: 90,
  hideCooldownMs: 6000,
  hideDurationMs: 2500,
  invulnerableMs: 1200,
};

export const FARMER = {
  startGap: 190,
  catchGap: 26,
  lungeOnHit: 95,
  driftBackPerSecond: 26,
  driftForwardOnSlow: 60,
  searchGapBonus: 70,
};

export const RUN = {
  goalDistanceM: 1000,
  baseSpeed: 300,
  speedPerStage: 55,
  maxLives: 3,
  scorePerMetre: 1,
  cornScore: 50,
  featherScore: 150,
  obstacleScore: 10,
};

// Stages the turkey runs through on the way to the woods.
export const STAGES = [
  { name: 'THE FARMYARD', fromM: 0, sky: '#f7c873', horizon: '#e8a34c', ground: '#b97d3c', accent: '#7a4a21' },
  { name: 'THE BARN', fromM: 350, sky: '#e8905a', horizon: '#c96f3d', ground: '#96602e', accent: '#5e3a1a' },
  { name: 'THE KITCHEN', fromM: 700, sky: '#d97b4f', horizon: '#a8542f', ground: '#7c4a26', accent: '#4a2c14' },
];

// Obstacle kinds. `h` is the hitbox height; `slideUnder` means a slide clears it.
export const OBSTACLES = {
  fence: { width: 34, height: 62, slideUnder: false, label: 'Fence' },
  haybale: { width: 56, height: 52, slideUnder: false, label: 'Hay bale' },
  pumpkin: { width: 46, height: 42, slideUnder: false, label: 'Pumpkin', rolls: true },
  knife: { width: 30, height: 96, slideUnder: true, label: 'Carving knife', swings: true },
  oven: { width: 84, height: 108, slideUnder: false, label: 'Oven', kitchenOnly: true },
  mud: { width: 90, height: 14, slideUnder: false, label: 'Mud puddle', slows: true },
};

export const PICKUPS = {
  corn: { width: 30, height: 34, score: RUN.cornScore, label: 'Corn' },
  feather: { width: 34, height: 30, score: RUN.featherScore, label: 'Golden feather' },
};

// How often each obstacle appears per stage (weights, higher = more common).
export const SPAWN_TABLE = [
  { fence: 3, haybale: 3, pumpkin: 2, knife: 2, mud: 1 },
  { fence: 2, haybale: 3, pumpkin: 3, knife: 3, mud: 1 },
  { fence: 1, haybale: 2, pumpkin: 2, knife: 4, oven: 3, mud: 1 },
];

export const HUD = {
  font: '"Trebuchet MS", "Segoe UI", Verdana, sans-serif',
  titleFont: '"Trebuchet MS", "Segoe UI", Verdana, sans-serif',
};

// Deterministic random numbers, so screenshots and replays agree.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function nextRandom() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
