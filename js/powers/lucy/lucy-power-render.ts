import { getLucyGuest, getLucyGuests, getLucyOrigin, getLucyPlates, getLucyProtagonist, getLucyTrails, isLucyCapEquipped, isLucyPowerActive, lucyCharacterPose, lucyFeastRadius, lucyHasEarnedCap, lucyMovementMultiplier, lucyPowerElapsed, lucyVisualStrength } from './lucy-power.js';

function cap(context: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  context.save(); context.translate(Math.round(x), Math.round(y)); context.scale(size / 24, size / 24);
  context.fillStyle = '#efc748'; context.fillRect(-10, -4, 19, 7); context.fillRect(-7, -8, 13, 5); context.fillRect(6, 0, 9, 3);
  context.fillStyle = '#193961'; context.fillRect(-6, -7, 12, 6);
  context.fillStyle = '#81cdeb'; context.fillRect(-5, -6, 4, 2); context.fillRect(1, -6, 4, 2); context.fillRect(-5, -3, 4, 1); context.fillRect(1, -3, 4, 1);
  context.restore();
}
function food(context: CanvasRenderingContext2D, x: number, y: number, size: number, variant: number): void {
  context.save(); context.translate(Math.round(x), Math.round(y)); context.scale(size / 24, size / 24);
  if (variant === 3) {
    context.fillStyle = '#ac6150'; context.fillRect(-10, -2, 19, 8);
    context.fillStyle = '#f4acc2'; context.fillRect(-10, -7, 19, 5); context.fillStyle = '#f4e7a5'; context.fillRect(-10, 1, 19, 2);
    context.fillStyle = '#d53462'; context.fillRect(-3, -11, 6, 5);
  } else if (variant === 0) {
    context.fillStyle = '#c48341'; context.fillRect(-10, -7, 20, 4); context.fillRect(-10, 5, 20, 4);
    context.fillStyle = '#edcf6e'; context.fillRect(-9, -5, 18, 11); context.fillStyle = '#63a45c'; context.fillRect(-11, -1, 22, 3);
    context.fillStyle = '#fff2ca'; context.fillRect(-10, 3, 20, 2);
  } else if (variant === 1) {
    context.fillStyle = '#e84e46'; context.fillRect(-8, -1, 16, 12);
    context.fillStyle = '#ffcf69'; for (let i = 0; i < 5; i++) context.fillRect(-9 + i * 4, -10 + i % 2 * 2, 3, 14);
    context.fillStyle = '#fff2ce'; context.fillRect(-6, 0, 12, 3);
  } else {
    context.fillStyle = '#71824f'; context.fillRect(-10, -1, 20, 10); context.fillRect(-6, -7, 12, 10);
    context.fillStyle = '#ffcc63'; context.fillRect(-8, 0, 16, 3); context.fillStyle = '#fff4d5'; context.fillRect(-7, -3, 14, 3);
  }
  context.restore();
}
function sachet(context: CanvasRenderingContext2D, x: number, y: number, size: number, angle: number): void {
  context.save(); context.translate(x, y); context.rotate(angle); context.scale(size / 24, size / 24);
  context.fillStyle = '#244575'; context.fillRect(-10, -15, 20, 30);
  context.fillStyle = '#ffefbc'; context.fillRect(-8, -9, 16, 18);
  context.fillStyle = '#e6403d'; context.fillRect(-10, -15, 20, 4); context.fillRect(-10, 11, 20, 4);
  context.fillStyle = '#eec247'; context.fillRect(-4, -3, 8, 6);
  context.restore();
}

export function withLucyPicnic(context: CanvasRenderingContext2D, x: number, y: number, height: number, id: string, drawSprite: () => void, now: number): void {
  const active = isLucyPowerActive(now);
  if (!active && (id !== 'player' || !isLucyCapEquipped())) { drawSprite(); return; }
  const pose = lucyCharacterPose(id, now);
  context.save(); context.translate(x + pose.x, y + pose.y); context.rotate(pose.lean); context.scale(pose.scale, pose.scale); context.translate(-x, -y);
  drawSprite();
  if (id === 'player' && (isLucyCapEquipped() || (active && lucyHasEarnedCap()))) cap(context, x, y - height + 5, height * 0.5);
  if (active && id === 'player') { context.globalAlpha *= lucyVisualStrength(now); food(context, x + height * 0.25, y - height * 0.48, height * 0.3, lucyMovementMultiplier(now) < 1 ? 3 : 0); }
  if (active && id !== 'player') {
    const guest = getLucyGuest(id);
    if (guest?.reaction === 'splattered') {
      context.globalAlpha *= lucyVisualStrength(now); context.fillStyle = '#fff6d9';
      for (let i = 0; i < 7; i++) context.fillRect(x - 8 + (i * 7 % 17), y - height * 0.7 + i * height * 0.045, 4 + i % 3, 3 + i % 4);
    }
  }
  context.restore();
}

export function drawLucyGround(context: CanvasRenderingContext2D, cameraX: number, cameraY: number, now: number, scaleX = 1, scaleY = 1): void {
  if (!isLucyPowerActive(now)) return;
  const strength = lucyVisualStrength(now); const elapsed = lucyPowerElapsed(now);
  const origin = getLucyOrigin(); const radius = lucyFeastRadius(now);
  const x = origin.x - cameraX; const y = origin.y - cameraY;
  context.save(); context.scale(scaleX, scaleY); context.imageSmoothingEnabled = false;
  // Reveal a gigantic red gingham picnic through the real map, anchored in world space.
  context.save(); context.beginPath(); context.ellipse(x, y, radius, radius * 0.65, 0, 0, Math.PI * 2); context.clip();
  const left = Math.max(-cameraX, origin.x - radius - cameraX); const top = Math.max(-cameraY, origin.y - radius * 0.65 - cameraY);
  const right = Math.min(context.canvas.width / scaleX, x + radius); const bottom = Math.min(context.canvas.height / scaleY, y + radius * 0.65);
  context.globalAlpha = strength * 0.2; context.fillStyle = '#fff1cc'; context.fillRect(left, top, right - left, bottom - top);
  context.fillStyle = '#d54e55'; context.globalAlpha = strength * 0.15;
  for (let gx = Math.floor((left + cameraX) / 24) * 24 - cameraX; gx < right; gx += 24) context.fillRect(gx, top, 12, bottom - top);
  for (let gy = Math.floor((top + cameraY) / 24) * 24 - cameraY; gy < bottom; gy += 24) context.fillRect(left, gy, right - left, 12);
  context.restore();
  context.globalAlpha = strength * 0.6; context.strokeStyle = '#fff4cb'; context.lineWidth = 8;
  context.beginPath(); context.ellipse(x, y, radius, radius * 0.65, 0, 0, Math.PI * 2); context.stroke();
  for (const trail of getLucyTrails()) {
    context.globalAlpha = strength * (1 - (now - trail.time) / 2200) * 0.55; context.fillStyle = '#fff0c7';
    const tx = Math.round(trail.x - cameraX); const ty = Math.round(trail.y - cameraY);
    context.fillRect(tx - 9, ty - 2, 18, 5); context.fillRect(tx - 5, ty - 5, 9, 11);
  }
  for (const plate of getLucyPlates()) {
    if (Math.hypot(plate.x - origin.x, plate.y - origin.y) > radius) continue;
    const px = plate.x - cameraX; const py = plate.y - cameraY;
    const bounce = Math.sin(elapsed / 270 + plate.seed) * 2;
    context.globalAlpha = strength * 0.75; context.fillStyle = plate.savoury ? '#bfea89' : '#f2a4c0';
    context.beginPath(); context.ellipse(px, py, 28, 17, 0, 0, Math.PI * 2); context.fill();
    context.fillStyle = '#fff6e2'; context.beginPath(); context.ellipse(px, py - 2, 24, 14, 0, 0, Math.PI * 2); context.fill();
    food(context, px, py - 7 + bounce, 26, plate.seed % 4);
    context.fillStyle = plate.savoury ? '#275c2b' : '#882c53'; context.font = 'bold 9px monospace'; context.textAlign = 'center'; context.fillText(plate.savoury ? '+50%' : '-50%', px, py + 18);
  }
  context.restore();
}

export function drawLucyWorld(context: CanvasRenderingContext2D, cameraX: number, cameraY: number, now: number, scaleX = 1, scaleY = 1, playerHeight = 36, outdoors = true): void {
  const active = isLucyPowerActive(now); const player = getLucyProtagonist();
  if (!active && !isLucyCapEquipped()) return;
  const strength = active ? lucyVisualStrength(now) : 1; const elapsed = lucyPowerElapsed(now);
  const x = player.x - cameraX; const y = player.y - cameraY;
  const width = context.canvas.width / scaleX; const height = context.canvas.height / scaleY;
  context.save(); context.scale(scaleX, scaleY); context.imageSmoothingEnabled = false;
  if (outdoors && (isLucyCapEquipped() || (active && lucyHasEarnedCap()))) {
    context.globalAlpha = strength * 0.18; context.fillStyle = '#ffe782'; context.beginPath(); context.moveTo(x - 55, 0); context.lineTo(x + 85, 0); context.lineTo(x + 17, y - playerHeight); context.lineTo(x - 14, y - playerHeight); context.fill();
    for (let spark = 0; spark < 12; spark++) {
      const life = (now / 1400 + spark / 12) % 1;
      context.globalAlpha = (1 - life) * 0.7 * strength; context.fillStyle = '#ffe887';
      context.fillRect(Math.round(x + Math.sin(spark * 2.4 + life * 3) * 22), Math.round(y - playerHeight - life * 55), 3, 3);
    }
  }
  if (!active) { context.restore(); return; }
  // A towering sachet opens above Max; a double helix of food circles the player.
  const packetY = y - playerHeight - 74 - Math.sin(elapsed / 350) * 7;
  context.globalAlpha = strength; sachet(context, x, packetY, 42, Math.sin(elapsed / 450) * 0.16);
  for (let drop = 0; drop < 26; drop++) {
    const life = (elapsed / 950 + drop / 26) % 1;
    const dx = x + Math.sin(drop * 2.4 + life * 4) * life * 135;
    const dy = packetY + 22 + life * (playerHeight + 86);
    context.globalAlpha = strength * (1 - life) * 0.8; context.fillStyle = '#fff4d3'; context.fillRect(Math.round(dx), Math.round(dy), 3 + drop % 3, 5 + drop % 4);
  }
  for (let i = 0; i < 8; i++) {
    const angle = elapsed / 650 + i * Math.PI / 4;
    context.globalAlpha = strength * 0.9;
    food(context, x + Math.cos(angle) * 53, y - playerHeight * 0.7 + Math.sin(angle) * 22, 17, i % 4);
  }
  for (const guest of getLucyGuests()) {
    const pose = lucyCharacterPose(guest.id, now); const gx = guest.x - cameraX + pose.x; const gy = guest.y - cameraY + pose.y;
    if (gx < -80 || gy < -80 || gx > width + 80 || gy > height + 100) continue;
    const age = now - guest.reachedAt; const flight = Math.min(1, age / 550);
    const sx = x + (gx - x) * flight; const sy = y - playerHeight + (gy - guest.height * 0.55 - y + playerHeight) * flight - Math.sin(flight * Math.PI) * 65;
    if (flight < 1) { context.globalAlpha = strength; sachet(context, sx, sy, 16, age / 100); }
    context.globalAlpha = strength; context.font = 'bold 10px monospace'; context.textAlign = 'center';
    context.fillStyle = guest.reaction === 'splattered' ? '#ff8c89' : guest.reaction === 'puzzled' ? '#f3d17b' : '#cff59c';
    context.fillText(guest.reaction === 'delighted' ? 'LOVE IT!' : guest.reaction === 'puzzled' ? '...WHY?' : 'MY CLOTHES!', gx, gy - guest.height - 14);
    if (guest.reaction === 'delighted') {
      for (let heart = 0; heart < 3; heart++) {
        const life = (age / 1300 + heart / 3) % 1; const hx = gx + Math.sin(heart * 2 + life * 4) * 20; const hy = gy - guest.height - 22 - life * 35;
        context.globalAlpha = (1 - life) * strength; context.fillStyle = '#f36c87'; context.fillRect(hx - 3, hy, 3, 3); context.fillRect(hx + 1, hy, 3, 3); context.fillRect(hx - 2, hy + 2, 5, 3); context.fillRect(hx, hy + 5, 2, 2);
      }
      if (age < 1400) cap(context, gx + (x - gx) * Math.min(1, age / 1400), gy - guest.height - 35 - Math.sin(age / 1400 * Math.PI) * 45, 22);
    } else if (guest.reaction === 'splattered') {
      for (let drop = 0; drop < 12; drop++) {
        const life = (age / 900 + drop / 12) % 1; const angle = drop * 2.4;
        context.globalAlpha = (1 - life) * strength; context.fillStyle = '#fff4d6'; context.fillRect(gx + Math.cos(angle) * life * 40, gy - guest.height * 0.6 + Math.sin(angle) * life * 25 + life * life * 18, 4, 6);
      }
      const life = (age % 1900) / 1900;
      const bx = gx + (x - gx) * life; const by = gy - guest.height + (y - playerHeight - gy + guest.height) * life - 30;
      context.globalAlpha = (1 - life) * strength; context.fillStyle = '#fff1d5'; context.fillRect(bx - 10, by - 13, 20, 25);
      context.fillStyle = '#93313c'; context.font = 'bold 8px monospace'; context.fillText('£12', bx, by + 1);
    }
  }
  // Screen-space picnic bunting remains legible in portrait mode.
  context.globalAlpha = strength * 0.65; context.strokeStyle = '#f3d29b'; context.lineWidth = 2;
  context.beginPath(); context.moveTo(0, 18); context.quadraticCurveTo(width / 2, 44, width, 18); context.stroke();
  for (let flag = 0; flag < Math.ceil(width / 32); flag++) {
    const fx = flag * 32; const fy = 18 + Math.sin(fx / width * Math.PI) * 13;
    context.fillStyle = flag % 2 ? '#f7dfae' : '#df595d'; context.beginPath(); context.moveTo(fx, fy); context.lineTo(fx + 20, fy); context.lineTo(fx + 10, fy + 19); context.fill();
  }
  context.restore();
}
