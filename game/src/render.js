// Gobble Dash — render: draws the world, HUD, title and end screens.
// One clear job: everything the player sees. Game rules live in world.js.

import { VIEW, RUN, HUD } from './config.js';
import { stageFor, stageIndexFor } from './world.js';
import { drawBackground, drawHaystack, drawTurkey, drawFarmer, drawObstacle, drawPickup, drawCornBurst } from './art.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawHud(ctx, world) {
  const stage = stageFor(world.distanceM);
  ctx.save();
  ctx.font = `bold 20px ${HUD.font}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  // Top bar.
  ctx.fillStyle = 'rgba(40, 22, 8, 0.72)';
  roundRect(ctx, 12, 10, 936, 52, 12);
  ctx.fill();

  ctx.fillStyle = '#ffe9a8';
  ctx.fillText(`SCORE  ${Math.round(world.score)}`, 28, 24);
  const progress = Math.min(1, world.distanceM / RUN.goalDistanceM);
  ctx.fillStyle = '#7ec8e3';
  ctx.fillText(`DISTANCE  ${Math.floor(world.distanceM)}m / ${RUN.goalDistanceM}m`, 280, 24);
  // Progress bar to the woods.
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  roundRect(ctx, 560, 26, 150, 14, 7);
  ctx.fill();
  ctx.fillStyle = '#7ec8e3';
  roundRect(ctx, 560, 26, 150 * progress, 14, 7);
  ctx.fill();
  ctx.fillStyle = '#ffe9a8';
  ctx.fillText('🌲', 714, 20);

  // Lives as hearts.
  ctx.textAlign = 'right';
  let hearts = '';
  for (let i = 0; i < RUN.maxLives; i++) hearts += i < world.lives ? '♥ ' : '♡ ';
  ctx.fillStyle = world.lives === 1 ? '#ff6b5e' : '#ff8fa3';
  ctx.fillText(hearts, 932, 24);

  // Stage banner.
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(40, 22, 8, 0.55)';
  roundRect(ctx, 12, 70, 210, 30, 9);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = `bold 15px ${HUD.font}`;
  ctx.fillText(`▸ ${stage.name}`, 24, 78);

  // Dash cooldown.
  const turkey = world.turkey;
  const dashReady = world.time >= turkey.dashReadyAt;
  const dashFraction = dashReady ? 1 : 1 - (turkey.dashReadyAt - world.time) / 4;
  ctx.fillStyle = 'rgba(40, 22, 8, 0.55)';
  roundRect(ctx, 12, 106, 150, 22, 8);
  ctx.fill();
  ctx.fillStyle = dashReady ? '#ffd23f' : 'rgba(255,255,255,0.4)';
  roundRect(ctx, 16, 110, 142 * dashFraction, 14, 6);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = `bold 12px ${HUD.font}`;
  ctx.fillText(dashReady ? 'DASH READY [Shift]' : 'DASH…', 24, 110);

  // Farmer proximity warning.
  if (world.gap < 90 && world.state === 'playing') {
    const blink = Math.floor(world.time * 6) % 2 === 0;
    ctx.fillStyle = blink ? '#ff3b30' : '#ffb3ab';
    ctx.font = `bold 22px ${HUD.font}`;
    ctx.textAlign = 'center';
    ctx.fillText('⚠ FARMER BRAMBLE IS RIGHT BEHIND YOU! ⚠', VIEW.width / 2, 116);
  }

  // Transient message.
  if (world.message && world.time < world.messageUntil) {
    ctx.fillStyle = '#fff';
    ctx.font = `bold 19px ${HUD.font}`;
    ctx.textAlign = 'center';
    ctx.strokeStyle = 'rgba(40,22,8,0.8)';
    ctx.lineWidth = 4;
    ctx.strokeText(world.message, VIEW.width / 2, 168);
    ctx.fillText(world.message, VIEW.width / 2, 168);
  }
  ctx.restore();
}

function drawWorldScene(ctx, world) {
  const stage = stageFor(world.distanceM);
  drawBackground(ctx, stage, world.scrollX, VIEW.width, VIEW.height, VIEW.groundY);
  for (const haystack of world.haystacks) drawHaystack(ctx, haystack.x, VIEW.groundY);
  for (const pickup of world.pickups) {
    if (!pickup.taken) drawPickup(ctx, pickup.kind, pickup.x, pickup.y + Math.sin(world.time * 3 + pickup.x) * 3);
  }
  for (const obstacle of world.obstacles) {
    drawObstacle(ctx, obstacle.kind, obstacle.x, VIEW.groundY, obstacle.width, obstacle.height, world.time);
  }
  for (const burst of world.bursts) {
    drawCornBurst(ctx, burst.x, burst.y, world.time - burst.born);
  }
  // The farmer runs behind the turkey, gap in pixels — clamped so he stays
  // on screen (and readable) even at the widest gap.
  const farmerX = Math.max(48, 220 - world.gap);
  drawFarmer(ctx, farmerX, VIEW.groundY, {
    runPhase: world.farmer.runPhase,
    searching: world.farmer.searching,
  });
  const turkey = world.turkey;
  const hidden = world.time < turkey.hiddenUntil;
  const sliding = world.time < turkey.slidingUntil;
  drawTurkey(ctx, 220, turkey.y, 64, 58, {
    runPhase: turkey.runPhase,
    sliding,
    hidden,
    scared: world.gap < 110,
    invulnerable: world.time < turkey.invulnerableUntil,
  });
}

function drawTitle(ctx, world) {
  drawBackground(ctx, stageFor(0), world.scrollX, VIEW.width, VIEW.height, VIEW.groundY);
  // Farmer and turkey stand clear of the panel, at the canvas edges.
  drawFarmer(ctx, 102, VIEW.groundY, { runPhase: 0.3, searching: false });
  drawTurkey(ctx, 858, VIEW.groundY, 64, 58, { runPhase: 0.6, sliding: false, hidden: false, scared: true, invulnerable: false });
  drawPickup(ctx, 'corn', 800, VIEW.groundY - 26);
  drawPickup(ctx, 'corn', 826, VIEW.groundY - 44);

  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(40, 22, 8, 0.78)';
  roundRect(ctx, 170, 56, 620, 344, 18);
  ctx.fill();
  ctx.strokeStyle = '#ffd23f';
  ctx.lineWidth = 3;
  roundRect(ctx, 170, 56, 620, 344, 18);
  ctx.stroke();

  ctx.fillStyle = '#ffd23f';
  ctx.font = `bold 52px ${HUD.titleFont}`;
  ctx.fillText('GOBBLE DASH', VIEW.width / 2, 112);
  ctx.fillStyle = '#fff';
  ctx.font = `bold 24px ${HUD.titleFont}`;
  ctx.fillText('The Great Thanksgiving Escape', VIEW.width / 2, 156);
  ctx.fillStyle = '#ffe9a8';
  ctx.font = `18px ${HUD.font}`;
  ctx.fillText('Farmer Bramble wants you for dinner. Run 1000m through', VIEW.width / 2, 200);
  ctx.fillText('the farmyard, the barn and the kitchen — and reach the woods.', VIEW.width / 2, 226);
  ctx.fillText('Dodge fences, pumpkins, carving knives and the oven.', VIEW.width / 2, 252);
  ctx.fillText('Grab corn. Hide in the hay. Do not get caught.', VIEW.width / 2, 278);

  const pulse = 0.6 + Math.sin(world.time * 3) * 0.4;
  ctx.globalAlpha = pulse;
  ctx.fillStyle = '#ffd23f';
  ctx.font = `bold 24px ${HUD.titleFont}`;
  ctx.fillText('▶ PRESS SPACE OR CLICK TO RUN', VIEW.width / 2, 326);
  ctx.globalAlpha = 1;

  ctx.fillStyle = '#fff';
  ctx.font = `15px ${HUD.font}`;
  ctx.fillText('Jump [Space / Up]   Slide [Down]   Dash [Shift]   Hide [H]   Mute [M]', VIEW.width / 2, 362);
  ctx.fillStyle = '#ffe9a8';
  ctx.fillText('3 lives · corn +50 · golden feather +150 · escape at 1000m', VIEW.width / 2, 388);
  ctx.restore();
}

function drawEnd(ctx, world) {
  const stats = world.endStats;
  const escaped = stats.outcome === 'escaped';
  ctx.save();
  // Dim the scene behind the panel.
  ctx.fillStyle = 'rgba(20, 10, 4, 0.55)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);

  ctx.fillStyle = escaped ? 'rgba(46, 90, 40, 0.92)' : 'rgba(122, 32, 20, 0.92)';
  roundRect(ctx, 180, 84, 600, 342, 18);
  ctx.fill();
  ctx.strokeStyle = '#ffd23f';
  ctx.lineWidth = 3;
  roundRect(ctx, 180, 84, 600, 342, 18);
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd23f';
  ctx.font = `bold 52px ${HUD.titleFont}`;
  ctx.fillText(escaped ? 'ESCAPED!' : 'CAUGHT!', VIEW.width / 2, 140);
  ctx.fillStyle = '#fff';
  ctx.font = `21px ${HUD.font}`;
  ctx.fillText(
    escaped
      ? 'Gobble made it to the woods — Thanksgiving is cancelled!'
      : 'Farmer Bramble got you… dinner is served. Gobble!',
    VIEW.width / 2, 182,
  );
  ctx.fillStyle = '#ffe9a8';
  ctx.font = `bold 22px ${HUD.font}`;
  ctx.fillText(`SCORE  ${stats.score}`, VIEW.width / 2, 232);
  ctx.font = `19px ${HUD.font}`;
  ctx.fillText(`Distance  ${stats.distanceM}m / 1000m      Lives left  ${stats.lives}      Time  ${stats.timeS}s`, VIEW.width / 2, 268);
  ctx.fillText(`Furthest stage: ${stats.stage}`, VIEW.width / 2, 300);

  const pulse = 0.6 + Math.sin(world.time * 3) * 0.4;
  ctx.globalAlpha = pulse;
  ctx.fillStyle = '#ffd23f';
  ctx.font = `bold 24px ${HUD.titleFont}`;
  ctx.fillText('▶ PRESS R OR CLICK TO RUN AGAIN', VIEW.width / 2, 352);
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#fff';
  ctx.font = `16px ${HUD.font}`;
  ctx.fillText('Tip: hide in a haystack [H] when the farmer closes in.', VIEW.width / 2, 392);
  ctx.restore();
}

export function render(ctx, world) {
  ctx.clearRect(0, 0, VIEW.width, VIEW.height);
  if (world.state === 'title') {
    drawTitle(ctx, world);
  } else if (world.state === 'playing') {
    drawWorldScene(ctx, world);
    drawHud(ctx, world);
  } else {
    drawWorldScene(ctx, world);
    drawEnd(ctx, world);
  }
}
