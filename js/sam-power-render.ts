import { getSamFootsteps, getSamOrigin, getSamPinchEffects, getSamPinchStats, getSamProtagonist, getSamTerrainSnaps, isSamPowerActive, isSamTargetRecoiling, samPowerElapsed, samVictimOffset, samVisualStrength } from './sam-power.js';
import { resolveSiteAsset } from './site-assets.js';
let scenery: HTMLCanvasElement | null = null;
let cartridge: HTMLImageElement | null = null;
function drawClaw(context: CanvasRenderingContext2D, x: number, y: number, direction: number, scale: number, snap = 0): void {
  context.save(); context.translate(Math.round(x), Math.round(y)); context.scale(direction * scale, scale);
  context.fillStyle = '#7d1e28'; context.fillRect(-6, -6, 15, 12);
  context.fillStyle = '#dc392f'; context.fillRect(-4, -5, 13, 10); context.fillRect(4, -12 + snap * 4, 10, 9); context.fillRect(4, 3 - snap * 4, 10, 9);
  context.fillStyle = '#ff9a73'; context.fillRect(-2, -4, 7, 3); context.fillRect(7, -10 + snap * 4, 4, 3); context.fillRect(7, 5 - snap * 4, 4, 3);
  context.fillStyle = '#481b27'; context.fillRect(12, -10 + snap * 4, 3, 7); context.fillRect(12, 3 - snap * 4, 3, 7); context.restore();
}
function ring(context: CanvasRenderingContext2D, x: number, y: number, radius: number): void {
  context.beginPath(); context.ellipse(x, y, radius, radius * 0.42, 0, 0, Math.PI * 2); context.stroke();
}
export function withSamPinch(context: CanvasRenderingContext2D, x: number, y: number, id: string, draw: () => void, now: number): void {
  if (!isSamPowerActive(now) || (id !== 'player' && !isSamTargetRecoiling(id, now))) { draw(); return; }
  context.save(); context.translate(x, y);
  if (id === 'player') {
    const strength = samVisualStrength(now); context.rotate(Math.sin(samPowerElapsed(now) / 85) * 0.055 * strength); context.scale(1 + 0.12 * strength, 1 - 0.06 * strength);
  } else {
    const effect = getSamPinchEffects(now).find((pinch) => pinch.id === id);
    const bend = effect ? Math.sin(Math.min(1, (now - effect.pinchedAt) / 550) * Math.PI) : 0;
    context.rotate(bend * 0.22 * (effect?.directionX ?? 1)); context.scale(1 - bend * 0.3, 1 + bend * 0.22);
  }
  context.translate(-x, -y); draw(); context.restore();
}
/** Re-sample the actual background under a closing claw; collision coordinates stay stable. */
export function drawSamTerrain(context: CanvasRenderingContext2D, cameraX: number, cameraY: number, now: number, scaleX = 1, scaleY = 1): void {
  if (!isSamPowerActive(now)) return;
  scenery ??= document.createElement('canvas'); const { width, height } = context.canvas;
  if (scenery.width !== width || scenery.height !== height) { scenery.width = width; scenery.height = height; }
  const buffer = scenery.getContext('2d'); if (!buffer) return;
  buffer.clearRect(0, 0, width, height); buffer.drawImage(context.canvas, 0, 0);
  const strength = samVisualStrength(now);
  context.save(); context.setTransform(1, 0, 0, 1, 0, 0); context.imageSmoothingEnabled = false;
  context.globalAlpha = strength; context.filter = 'saturate(1.3) hue-rotate(12deg)'; context.drawImage(scenery, 0, 0);
  for (const pinch of getSamTerrainSnaps(now)) {
    const age = (now - pinch.at) / 900; const squeeze = Math.sin(age * Math.PI) * strength;
    const x = (pinch.x - cameraX) * scaleX; const y = (pinch.y - cameraY) * scaleY;
    const sizeX = 54 * scaleX; const sizeY = 36 * scaleY;
    if (x - sizeX < 0 || x + sizeX > width || y - sizeY < 0 || y + sizeY > height) continue;
    context.globalAlpha = squeeze * 0.75;
    context.drawImage(scenery, x - sizeX * (0.5 + squeeze * 0.15), y - sizeY * (0.5 - squeeze * 0.1), sizeX * (1 + squeeze * 0.3), sizeY * (1 - squeeze * 0.2), x - sizeX / 2, y - sizeY / 2, sizeX, sizeY);
  }
  context.restore();
}
export function drawSamGround(context: CanvasRenderingContext2D, cameraX: number, cameraY: number, now: number, scaleX = 1, scaleY = 1): void {
  if (!isSamPowerActive(now)) return;
  const strength = samVisualStrength(now); const elapsed = samPowerElapsed(now); const origin = getSamOrigin();
  const width = context.canvas.width / scaleX; const height = context.canvas.height / scaleY;
  context.save(); context.scale(scaleX, scaleY); context.imageSmoothingEnabled = false;
  // A world-anchored tide sweeps through the real scene instead of following the screen.
  context.strokeStyle = '#86f0e6'; context.lineWidth = 3;
  for (let wave = 0; wave < 4; wave++) { context.globalAlpha = strength * 0.3; ring(context, origin.x - cameraX, origin.y - cameraY, (elapsed / 15 + wave * 105) % 700); }
  for (let tile = 0; tile < 70; tile++) {
    const radius = Math.sqrt(tile) * 45; if (radius > elapsed * 0.2) continue;
    const x = origin.x - cameraX + Math.cos(tile * 2.4) * radius; const y = origin.y - cameraY + Math.sin(tile * 2.4) * radius * 0.7;
    if (x < -20 || y < -15 || x > width + 20 || y > height + 15) continue;
    context.globalAlpha = strength * (0.1 + Math.sin(elapsed / 600 + tile) * 0.04); context.fillStyle = tile % 2 ? '#43bebf' : '#214875'; context.fillRect(Math.round(x - 15), Math.round(y - 5), 30, 10);
    context.globalAlpha = strength * 0.45; context.fillStyle = '#a8f8e4'; context.fillRect(Math.round(x - 9 + Math.sin(elapsed / 250 + tile) * 5), Math.round(y - 5), 12, 2);
  }
  for (const point of getSamFootsteps(now)) {
    const age = now - point.at; context.globalAlpha = strength * (1 - age / 1800) * 0.75;
    context.fillStyle = '#e96741';
    for (const side of [-1, 1]) for (let leg = 0; leg < 3; leg++) context.fillRect(Math.round(point.x - cameraX + side * (6 + leg * 3)), Math.round(point.y - cameraY + leg * 2 - 3), 3, 2);
    context.strokeStyle = '#9bece4'; context.lineWidth = 1; ring(context, point.x - cameraX, point.y - cameraY, 10 + age / 65);
  }
  for (const pinch of getSamTerrainSnaps(now)) {
    const age = (now - pinch.at) / 900; const x = pinch.x - cameraX; const y = pinch.y - cameraY;
    context.globalAlpha = strength * (1 - age) * 0.6; context.strokeStyle = '#ffc781'; context.lineWidth = 2; ring(context, x, y, 12 + age * 48);
    context.fillStyle = '#7c3537'; context.fillRect(Math.round(x - 7), Math.round(y - 3), 14, 6);
    context.fillStyle = '#ffd894'; context.fillRect(Math.round(x - 4), Math.round(y - 4), 8, 2);
  }
  context.restore();
}
export function drawSamVictimEffects(context: CanvasRenderingContext2D, cameraX: number, cameraY: number, now: number, scaleX = 1, scaleY = 1): void {
  if (!isSamPowerActive(now)) return;
  const player = getSamProtagonist();
  context.save(); context.scale(scaleX, scaleY); context.imageSmoothingEnabled = false; context.textAlign = 'center'; context.font = 'bold 11px monospace';
  for (const effect of getSamPinchEffects(now)) {
    const elapsed = now - effect.pinchedAt; const progress = elapsed / 900; const offset = samVictimOffset(effect.id, now);
    const x = effect.x - cameraX + offset.x; const y = effect.y - cameraY - effect.height * 0.55 + offset.y;
    const snap = Math.sin(Math.min(1, progress * 2.6) * Math.PI);
    context.globalAlpha = samVisualStrength(now) * Math.min(1, (1 - progress) * 1.7);
    // Giant articulated arms visibly connect Max to each actual character being pinched.
    const startX = player.x - cameraX; const startY = player.y - cameraY - 22;
    context.strokeStyle = '#762631'; context.lineWidth = 8; context.beginPath(); context.moveTo(startX, startY); context.quadraticCurveTo((startX + x) / 2, Math.min(startY, y) - 25, x, y); context.stroke();
    context.strokeStyle = '#ee684e'; context.lineWidth = 4; context.stroke();
    drawClaw(context, x - 24 - snap * 9, y, 1, 1.4, snap); drawClaw(context, x + 24 + snap * 9, y, -1, 1.4, snap);
    context.fillStyle = '#fff1a8';
    for (let ray = 0; ray < 8; ray++) { const angle = ray * Math.PI / 4; const radius = 22 + snap * 21; context.fillRect(Math.round(x + Math.cos(angle) * radius), Math.round(y + Math.sin(angle) * radius), 4, 3); }
    context.fillText(effect.variant < 2 ? 'SNIP!' : 'OW!', Math.round(x), Math.round(y - 35 - snap * 6));
  }
  context.restore();
}
export function drawSamWorldOverlay(context: CanvasRenderingContext2D, now: number): void {
  if (!isSamPowerActive(now)) return;
  const strength = samVisualStrength(now); const elapsed = samPowerElapsed(now); const width = context.canvas.width; const height = context.canvas.height;
  context.save(); context.imageSmoothingEnabled = false;
  context.globalAlpha = strength * 0.06; context.fillStyle = '#179dba'; context.fillRect(0, 0, width, height);
  for (let index = 0; index < 36; index++) {
    const x = (index * 97 + elapsed / 120) % width; const y = height - ((elapsed * (0.025 + index % 3 * 0.008) + index * 67) % (height + 30));
    context.globalAlpha = strength * (0.2 + (index % 5) * 0.08); context.strokeStyle = index % 2 ? '#fff1bf' : '#84eceb'; context.lineWidth = 2; context.strokeRect(Math.round(x), Math.round(y), 3 + index % 4, 3 + index % 4);
  }
  // Phones reserve the top for the countdown and the lower right for movement controls.
  const displayWidth = context.canvas.getBoundingClientRect().width;
  const mobile = displayWidth > 0 && displayWidth <= 600;
  const hudScale = mobile ? Math.max(1, width / displayWidth) : 1;
  context.scale(hudScale, hudScale);
  const hudWidth = width / hudScale; const hudHeight = height / hudScale;
  const stats = getSamPinchStats(); const boxWidth = Math.min(182, hudWidth - 28);
  const x = mobile ? 14 : (hudWidth - boxWidth) / 2; const y = mobile ? Math.max(110, hudHeight - 148) : 82;
  const centreX = x + boxWidth / 2;
  context.globalAlpha = strength * 0.95; context.fillStyle = '#26363d'; context.fillRect(x - 5, y - 5, boxWidth + 10, 67);
  context.fillStyle = '#ade2db'; context.fillRect(x, y, boxWidth, 26); context.fillStyle = '#142531'; context.font = 'bold 12px monospace'; context.textAlign = 'center'; context.fillText('CRAB NICHOLSON', centreX, y + 17);
  context.fillStyle = '#d9f9df'; context.fillRect(x, y + 31, boxWidth, 26); context.fillStyle = '#773341'; context.fillText(`PINCHES ${stats.pinches} · MET ${stats.characters}`, centreX, y + 49); context.restore();
}
export function drawSamPower(context: CanvasRenderingContext2D, playerX: number, playerY: number, playerHeight: number, now: number): void {
  if (!isSamPowerActive(now)) return;
  const elapsed = samPowerElapsed(now); const strength = samVisualStrength(now); const snap = (Math.sin(elapsed / 100) + 1) / 2;
  const size = Math.max(1.3, playerHeight / 28); const centreY = playerY - playerHeight * 0.38;
  context.save(); context.imageSmoothingEnabled = false; context.globalAlpha = strength;
  // Armour leaves the face visible; six animated legs and oversized claws replace the silhouette.
  context.fillStyle = '#781e2c'; context.fillRect(playerX - playerHeight * 0.33, centreY - 3, playerHeight * 0.66, playerHeight * 0.3);
  context.fillStyle = '#d93d30'; context.fillRect(playerX - playerHeight * 0.28, centreY - 2, playerHeight * 0.56, playerHeight * 0.26);
  context.fillStyle = '#ff9a74'; context.fillRect(playerX - playerHeight * 0.2, centreY, playerHeight * 0.4, 3);
  for (const side of [-1, 1]) {
    for (let leg = 0; leg < 3; leg++) {
      const step = Math.sin(elapsed / 100 + leg * 1.7 + side) * 4;
      context.strokeStyle = '#802737'; context.lineWidth = 5; context.beginPath(); context.moveTo(playerX + side * playerHeight * 0.22, centreY + leg * 5); context.lineTo(playerX + side * (playerHeight * 0.45 + leg * 3), centreY + leg * 6 + step); context.lineTo(playerX + side * (playerHeight * 0.6 + leg * 2), playerY - 1 + step); context.stroke();
      context.strokeStyle = '#ec6a47'; context.lineWidth = 2; context.stroke();
    }
    const clawX = playerX + side * (playerHeight * 0.8 + snap * 7); const clawY = centreY - playerHeight * 0.12;
    context.strokeStyle = '#7d2534'; context.lineWidth = 9; context.beginPath(); context.moveTo(playerX + side * playerHeight * 0.28, centreY); context.lineTo(clawX - side * 8, clawY); context.stroke();
    context.strokeStyle = '#ed6b48'; context.lineWidth = 5; context.stroke(); drawClaw(context, clawX, clawY, -side, size, snap);
  }
  cartridge ??= new Image(); if (!cartridge.src) cartridge.src = resolveSiteAsset('chat/sam/item.png');
  if (cartridge.complete && cartridge.naturalWidth && elapsed < 1600) {
    const artSize = Math.min(92, context.canvas.width * 0.16); context.globalAlpha = strength * Math.min(1, (1600 - elapsed) / 400);
    context.drawImage(cartridge, playerX - artSize / 2, playerY - playerHeight - artSize - 14, artSize, artSize);
  }
  context.restore();
}
