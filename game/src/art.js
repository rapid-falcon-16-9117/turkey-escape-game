// Gobble Dash — art: every sprite drawn in code, no image files.
// Original Thanksgiving art: Gobble the turkey, Farmer Bramble, farmyard,
// barn and kitchen scenery, all in a coherent autumn palette.

export function drawBackground(ctx, stage, scrollX, width, height, groundY) {
  // Sky.
  const sky = ctx.createLinearGradient(0, 0, 0, groundY);
  sky.addColorStop(0, stage.sky);
  sky.addColorStop(1, stage.horizon);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, groundY);

  // Sun with a sleepy face, drifting slowly.
  const sunX = width - 130 - (scrollX * 0.02 % 40);
  const sunY = 74;
  ctx.fillStyle = '#ffe9a8';
  ctx.beginPath(); ctx.arc(sunX, sunY, 34, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#d99a2b'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(sunX, sunY, 34, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#8a5a12';
  ctx.beginPath(); ctx.arc(sunX - 11, sunY - 4, 3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(sunX + 11, sunY - 4, 3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(sunX, sunY + 8, 8, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();

  // Far hills and trees (parallax 0.2).
  ctx.fillStyle = stage.accent;
  ctx.globalAlpha = 0.45;
  for (let i = 0; i < 5; i++) {
    const hx = (((i * 340 - scrollX * 0.2) % (width + 340)) + width + 340) % (width + 340) - 170;
    ctx.beginPath();
    ctx.arc(hx, groundY, 150, Math.PI, 0);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Farmhouse / barn silhouette (parallax 0.4).
  const houseX = (((-scrollX * 0.4) % (width + 520)) + width + 520) % (width + 520) - 260;
  ctx.fillStyle = '#8a3b22';
  ctx.fillRect(houseX, groundY - 92, 150, 92);
  ctx.fillStyle = '#5e2817';
  ctx.beginPath();
  ctx.moveTo(houseX - 12, groundY - 92); ctx.lineTo(houseX + 75, groundY - 150); ctx.lineTo(houseX + 162, groundY - 92);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#f7c873';
  ctx.fillRect(houseX + 58, groundY - 46, 34, 46);
  ctx.fillRect(houseX + 18, groundY - 74, 24, 24);
  ctx.fillRect(houseX + 108, groundY - 74, 24, 24);

  // Fence posts (parallax 0.7).
  ctx.fillStyle = '#6e4423';
  for (let x = -((scrollX * 0.7) % 90); x < width; x += 90) {
    ctx.fillRect(x, groundY - 34, 8, 34);
    ctx.fillRect(x + 40, groundY - 34, 8, 34);
    ctx.fillRect(x, groundY - 30, 88, 6);
    ctx.fillRect(x, groundY - 16, 88, 6);
  }

  // Ground.
  ctx.fillStyle = stage.ground;
  ctx.fillRect(0, groundY, width, height - groundY);
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fillRect(0, groundY, width, 6);
  // Scattered autumn leaves on the ground.
  ctx.fillStyle = '#c96f2e';
  for (let i = 0; i < 14; i++) {
    const lx = (((i * 173 - scrollX) % (width + 60)) + width + 60) % (width + 60) - 30;
    const ly = groundY + 14 + ((i * 37) % 66);
    ctx.beginPath(); ctx.ellipse(lx, ly, 7, 4, (i % 3) * 0.7, 0, Math.PI * 2); ctx.fill();
  }
}

export function drawHaystack(ctx, x, groundY) {
  ctx.fillStyle = '#d9a441';
  ctx.beginPath();
  ctx.moveTo(x, groundY);
  ctx.quadraticCurveTo(x + 26, groundY - 86, x + 58, groundY - 88);
  ctx.quadraticCurveTo(x + 92, groundY - 84, x + 112, groundY);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#a87c22'; ctx.lineWidth = 2;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(x + 18 + i * 18, groundY - 8 - i * 3);
    ctx.quadraticCurveTo(x + 26 + i * 16, groundY - 44 - i * 8, x + 30 + i * 15, groundY - 70 + i * 6);
    ctx.stroke();
  }
  ctx.fillStyle = '#7a4a21';
  ctx.font = 'bold 13px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('HIDE [H]', x + 56, groundY - 96);
}

export function drawTurkey(ctx, x, y, w, h, pose) {
  // pose: { runPhase, sliding, hidden, scared, invulnerable }
  const bob = pose.sliding ? 0 : Math.sin(pose.runPhase) * 3;
  ctx.save();
  if (pose.invulnerable && Math.floor(pose.runPhase * 6) % 2 === 0) ctx.globalAlpha = 0.45;
  ctx.translate(x, y + bob);

  if (pose.hidden) {
    // Only a tail feather pokes out of the hay.
    ctx.fillStyle = '#8a5a2b';
    ctx.beginPath(); ctx.ellipse(0, -6, 26, 10, -0.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#b5762f';
    ctx.beginPath(); ctx.ellipse(-8, -14, 18, 8, -0.9, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    return;
  }

  const bodyH = pose.sliding ? h * 0.55 : h;
  // Fanned tail feathers.
  const featherColors = ['#a8542f', '#c96f2e', '#8a5a2b', '#d9a441', '#a8542f'];
  for (let i = 0; i < 5; i++) {
    const angle = -1.15 + i * 0.55;
    ctx.save();
    ctx.translate(-w * 0.32, -bodyH * 0.42);
    ctx.rotate(angle);
    ctx.fillStyle = featherColors[i];
    ctx.beginPath(); ctx.ellipse(0, -26, 9, 28, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f7c873';
    ctx.beginPath(); ctx.ellipse(0, -44, 4, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  // Body.
  ctx.fillStyle = '#8a5a2b';
  ctx.beginPath(); ctx.ellipse(0, -bodyH * 0.42, w * 0.42, bodyH * 0.44, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#b5762f';
  ctx.beginPath(); ctx.ellipse(4, -bodyH * 0.34, w * 0.3, bodyH * 0.3, 0, 0, Math.PI * 2); ctx.fill();
  // Wing.
  ctx.fillStyle = '#6e4423';
  ctx.beginPath(); ctx.ellipse(-4, -bodyH * 0.4, w * 0.22, bodyH * 0.22, -0.5, 0, Math.PI * 2); ctx.fill();
  // Neck and head.
  ctx.fillStyle = '#a8542f';
  ctx.beginPath(); ctx.ellipse(w * 0.3, -bodyH * 0.78, 9, 20, 0.25, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#d9a441';
  ctx.beginPath(); ctx.arc(w * 0.34, -bodyH * 0.98, 13, 0, Math.PI * 2); ctx.fill();
  // Beak.
  ctx.fillStyle = '#e8912d';
  ctx.beginPath();
  ctx.moveTo(w * 0.34 + 10, -bodyH * 0.98 - 3);
  ctx.lineTo(w * 0.34 + 26, -bodyH * 0.98 + 2);
  ctx.lineTo(w * 0.34 + 10, -bodyH * 0.98 + 6);
  ctx.closePath(); ctx.fill();
  // Wattle.
  ctx.fillStyle = '#c0392b';
  ctx.beginPath(); ctx.ellipse(w * 0.34 + 8, -bodyH * 0.86, 5, 9, 0.2, 0, Math.PI * 2); ctx.fill();
  // Eye — wide and worried when the farmer is close.
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(w * 0.34 + 4, -bodyH - 2, pose.scared ? 6 : 4.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#222';
  ctx.beginPath(); ctx.arc(w * 0.34 + 5, -bodyH - 2, 2.4, 0, Math.PI * 2); ctx.fill();
  // Sweat drop when scared.
  if (pose.scared) {
    ctx.fillStyle = '#7ec8e3';
    ctx.beginPath(); ctx.arc(w * 0.34 - 12, -bodyH - 14, 4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(w * 0.34 - 12, -bodyH - 22); ctx.lineTo(w * 0.34 - 7, -bodyH - 14); ctx.lineTo(w * 0.34 - 17, -bodyH - 14);
    ctx.closePath(); ctx.fill();
  }
  // Legs, mid-stride.
  const step = Math.sin(pose.runPhase) * 10;
  ctx.strokeStyle = '#e8912d'; ctx.lineWidth = 4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-6, -8); ctx.lineTo(-6 + step, 0); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(8, -8); ctx.lineTo(8 - step, 0); ctx.stroke();
  ctx.restore();
}

export function drawFarmer(ctx, x, y, pose) {
  // pose: { runPhase, searching }
  const bob = Math.abs(Math.sin(pose.runPhase)) * 4;
  ctx.save();
  ctx.translate(x, y - bob);
  // Legs.
  const step = Math.sin(pose.runPhase) * 12;
  ctx.strokeStyle = '#3b4a6b'; ctx.lineWidth = 9; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-8, -34); ctx.lineTo(-8 + step, 0); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(8, -34); ctx.lineTo(8 - step, 0); ctx.stroke();
  // Body: denim overalls over a red shirt.
  ctx.fillStyle = '#c0392b';
  ctx.fillRect(-20, -78, 40, 46);
  ctx.fillStyle = '#3b4a6b';
  ctx.fillRect(-20, -58, 40, 26);
  ctx.fillStyle = '#f7c873';
  ctx.fillRect(-20, -58, 6, 26);
  ctx.fillRect(14, -58, 6, 26);
  // Arms pumping (or scratching his head while searching).
  ctx.strokeStyle = '#c0392b'; ctx.lineWidth = 8;
  if (pose.searching) {
    ctx.beginPath(); ctx.moveTo(16, -72); ctx.lineTo(30, -96); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-16, -72); ctx.lineTo(-28, -52); ctx.stroke();
  } else {
    const swing = Math.sin(pose.runPhase) * 10;
    ctx.beginPath(); ctx.moveTo(16, -72); ctx.lineTo(30 + swing, -52); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-16, -72); ctx.lineTo(-30 - swing, -52); ctx.stroke();
  }
  // Head, beard and straw hat.
  ctx.fillStyle = '#f0c8a0';
  ctx.beginPath(); ctx.arc(0, -92, 17, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#e8e0d0';
  ctx.beginPath(); ctx.arc(0, -80, 13, 0, Math.PI); ctx.fill();
  ctx.fillStyle = '#d9a441';
  ctx.beginPath(); ctx.ellipse(0, -104, 26, 6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillRect(-13, -122, 26, 18);
  // Angry eyebrows.
  ctx.strokeStyle = '#5e3a1a'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-12, -98); ctx.lineTo(-3, -94); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(12, -98); ctx.lineTo(3, -94); ctx.stroke();
  ctx.fillStyle = '#222';
  ctx.beginPath(); ctx.arc(-6, -92, 2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(6, -92, 2, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  if (pose.searching) {
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('?', x + 34, y - 132);
  }
}

export function drawObstacle(ctx, kind, x, groundY, w, h, time) {
  ctx.save();
  ctx.translate(x, groundY);
  if (kind === 'fence') {
    // Darker than the background fence posts so the obstacle reads at a glance.
    ctx.fillStyle = '#3a2210';
    ctx.fillRect(0, -h, 8, h); ctx.fillRect(w - 8, -h, 8, h);
    ctx.fillRect(0, -h + 8, w, 7); ctx.fillRect(0, -h + 30, w, 7);
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(0, -h, w, 5);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('JUMP!', w / 2, -h - 8);
  } else if (kind === 'haybale') {
    ctx.fillStyle = '#d9a441';
    ctx.beginPath(); ctx.ellipse(w / 2, -h / 2, w / 2, h / 2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#a87c22'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(w / 2, -h / 2, w / 2 - 8, h / 2 - 8, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(6, -h / 2); ctx.lineTo(w - 6, -h / 2); ctx.stroke();
  } else if (kind === 'pumpkin') {
    ctx.fillStyle = '#e07830';
    ctx.beginPath(); ctx.ellipse(w / 2, -h / 2, w / 2, h / 2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#b85a1e'; ctx.lineWidth = 2;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath(); ctx.ellipse(w / 2 + i * 10, -h / 2, 6, h / 2 - 4, 0, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.fillStyle = '#5e8a2f';
    ctx.fillRect(w / 2 - 3, -h - 4, 6, 10);
    ctx.fillStyle = '#222';
    ctx.beginPath(); ctx.arc(w / 2 - 8, -h / 2 - 6, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(w / 2 + 8, -h / 2 - 6, 2.5, 0, Math.PI * 2); ctx.fill();
  } else if (kind === 'knife') {
    // A carving knife swinging down from a hook, blade glinting.
    const swing = Math.sin(time * 2.4) * 0.5;
    ctx.translate(w / 2, 0);
    ctx.rotate(swing);
    ctx.fillStyle = '#5e3a1a';
    ctx.fillRect(-3, -h, 6, 26);
    ctx.fillStyle = '#3b2a18';
    ctx.fillRect(-7, -h + 20, 14, 16);
    ctx.fillStyle = '#dfe6ea';
    ctx.beginPath();
    ctx.moveTo(-7, -h + 36); ctx.lineTo(7, -h + 36); ctx.lineTo(2, -4); ctx.lineTo(-2, -4);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#9aa5ab'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, -h + 36); ctx.lineTo(0, -8); ctx.stroke();
  } else if (kind === 'oven') {
    ctx.fillStyle = '#3d3d3d';
    ctx.fillRect(0, -h, w, h);
    ctx.fillStyle = '#565656';
    ctx.fillRect(4, -h + 4, w - 8, 34);
    ctx.fillStyle = '#ff8c42';
    ctx.fillRect(10, -h + 10, w - 20, 22);
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(10, -h + 48, w - 20, 40);
    ctx.fillStyle = '#8a8a8a';
    ctx.beginPath(); ctx.arc(w - 16, -h + 68, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f7c873';
    ctx.font = 'bold 11px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('HOT!', w / 2, -h - 8);
    // Heat shimmer lines.
    ctx.strokeStyle = 'rgba(255,140,66,0.7)'; ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      const sx = 14 + i * 26;
      ctx.beginPath();
      ctx.moveTo(sx, -h - 2);
      ctx.quadraticCurveTo(sx + 6, -h - 12, sx, -h - 20);
      ctx.stroke();
    }
  } else if (kind === 'mud') {
    ctx.fillStyle = '#6e4423';
    ctx.beginPath(); ctx.ellipse(w / 2, -4, w / 2, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8a5a2b';
    ctx.beginPath(); ctx.ellipse(w / 2 - 14, -4, 14, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(w / 2 + 18, -5, 10, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('MUD — SLOWS YOU DOWN', w / 2, -18);
  }
  ctx.restore();
}

export function drawPickup(ctx, kind, x, y) {
  ctx.save();
  ctx.translate(x, y);
  if (kind === 'corn') {
    ctx.fillStyle = '#f7c873';
    ctx.beginPath(); ctx.ellipse(0, 0, 10, 15, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e8a34c';
    for (let r = -1; r <= 1; r++) {
      for (let c = -1; c <= 1; c++) {
        ctx.beginPath(); ctx.arc(c * 5, r * 8, 2, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.fillStyle = '#5e8a2f';
    ctx.beginPath(); ctx.ellipse(-8, 8, 6, 12, 0.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(8, 8, 6, 12, -0.5, 0, Math.PI * 2); ctx.fill();
  } else {
    // Golden feather, gently bobbing.
    ctx.fillStyle = '#f7c873';
    ctx.beginPath(); ctx.ellipse(0, 0, 6, 15, 0.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e8a34c';
    ctx.beginPath(); ctx.ellipse(0, 0, 3, 11, 0.4, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#fff8dc'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-4, 14); ctx.lineTo(6, -12); ctx.stroke();
  }
  ctx.restore();
}

export function drawCornBurst(ctx, x, y, age) {
  // Little sparkle when a pickup is collected.
  ctx.save();
  ctx.globalAlpha = Math.max(0, 1 - age * 3);
  ctx.fillStyle = '#ffe9a8';
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const r = age * 60;
    ctx.beginPath(); ctx.arc(x + Math.cos(a) * r, y + Math.sin(a) * r, 3, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}
