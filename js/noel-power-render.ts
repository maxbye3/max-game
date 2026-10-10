import { getNoelAudience, getNoelCollateral, getNoelProtagonist, getNoelReceipts, isNoelPowerActive, noelAssessment, noelCharacterPose, noelPowerElapsed, noelVisualStrength } from './noel-power.js';
import { resolveSiteAsset } from './site-assets.js';
let terrain: HTMLCanvasElement | null = null;
const art = new Map<string, HTMLImageElement>();
function imageFor(source: string): HTMLImageElement {
  let image = art.get(source);
  if (!image) { image = new Image(); image.src = resolveSiteAsset(source); art.set(source, image); }
  return image;
}
function ghost(context: CanvasRenderingContext2D, x: number, y: number, size: number, now: number, seed: number): void {
  context.save(); context.translate(Math.round(x), Math.round(y)); context.scale(size / 16, size / 16);
  context.fillStyle = '#bee7db'; context.fillRect(-5, -9, 10, 3); context.fillRect(-7, -6, 14, 12);
  for (let hem = 0; hem < 4; hem++) context.fillRect(-7 + hem * 4, 5, 3, 3 + Math.sin(now / 180 + seed + hem) * 2);
  context.fillStyle = '#331644'; context.fillRect(-4, -4, 2, 3); context.fillRect(2, -4, 2, 3); context.fillRect(-1, 1, 2, 3);
  context.restore();
}
function paper(context: CanvasRenderingContext2D, x: number, y: number, size: number, rotation = 0): void {
  context.save(); context.translate(Math.round(x), Math.round(y)); context.rotate(rotation);
  context.fillStyle = '#271332'; context.fillRect(-size * 0.35 - 2, -size * 0.5 - 2, size * 0.7 + 4, size + 4);
  context.fillStyle = '#ffe5ab'; context.fillRect(-size * 0.35, -size * 0.5, size * 0.7, size);
  context.fillStyle = '#ae454b'; for (let line = 0; line < 4; line++) context.fillRect(-size * 0.23, -size * 0.32 + line * size * 0.16, size * (line === 3 ? 0.26 : 0.46), Math.max(1, size * 0.035));
  context.restore();
}

export function withNoelContract(context: CanvasRenderingContext2D, x: number, y: number, height: number, id: string, draw: () => void, now: number): void {
  if (!isNoelPowerActive(now)) { draw(); return; }
  const pose = noelCharacterPose(id, now);
  context.save(); context.translate(x + pose.x, y + pose.y); context.rotate(pose.lean); context.scale(pose.scale, pose.scale); context.translate(-x, -y); draw(); context.restore();
  if (id === 'player') {
    context.save(); context.globalAlpha *= noelVisualStrength(now);
    paper(context, x + height * 0.5, y - height * 0.45, height * 0.8, Math.sin(now / 250) * 0.15);
    context.strokeStyle = '#f28c38'; context.lineWidth = 2; context.setLineDash([4, 3]);
    context.beginPath(); context.moveTo(x + 3, y - height * 0.35); context.lineTo(x + height * 0.4, y - height * 0.4); context.stroke(); context.restore();
  }
}

/** Exactly one tile in each group of ten is temporarily pulled from the actual terrain image. */
export function drawNoelTerrain(context: CanvasRenderingContext2D, now: number): void {
  if (!isNoelPowerActive(now)) return;
  terrain ??= document.createElement('canvas');
  const { width, height } = context.canvas;
  if (terrain.width !== width || terrain.height !== height) { terrain.width = width; terrain.height = height; }
  const buffer = terrain.getContext('2d'); if (!buffer) return;
  buffer.clearRect(0, 0, width, height); buffer.drawImage(context.canvas, 0, 0);
  const strength = noelVisualStrength(now); const elapsed = noelPowerElapsed(now); const phase = elapsed % 1000 / 1000;
  context.save(); context.setTransform(1, 0, 0, 1, 0, 0); context.imageSmoothingEnabled = false;
  context.globalAlpha = strength; context.filter = 'saturate(0.45) brightness(0.8)'; context.drawImage(terrain, 0, 0); context.filter = 'none';
  for (let row = 0; row < 10; row++) {
    const column = (row * 3 + Math.floor(elapsed / 1000)) % 10;
    const x = Math.floor(column * width / 10); const y = Math.floor(row * height / 10);
    const w = Math.floor((column + 1) * width / 10) - x; const h = Math.floor((row + 1) * height / 10) - y;
    context.globalAlpha = strength * 0.85; context.fillStyle = '#110e1d'; context.fillRect(x, y, w, h);
    context.globalAlpha = strength * (1 - phase) * 0.75;
    const shrink = 1 - phase * 0.85; const dx = x + (width * 0.78 - x) * phase; const dy = y + (height * 0.25 - y) * phase;
    context.drawImage(terrain, x, y, w, h, Math.round(dx), Math.round(dy), Math.round(w * shrink), Math.round(h * shrink));
  }
  context.restore();
}

export function drawNoelGround(context: CanvasRenderingContext2D, cameraX: number, cameraY: number, now: number, scaleX = 1, scaleY = 1): void {
  if (!isNoelPowerActive(now)) return;
  context.save(); context.scale(scaleX, scaleY);
  for (const receipt of getNoelReceipts()) {
    const age = now - receipt.time;
    context.globalAlpha = noelVisualStrength(now) * Math.min(1, age / 150, (2400 - age) / 600);
    paper(context, receipt.x - cameraX + Math.sin(receipt.seed * 2.4) * 15, receipt.y - cameraY + Math.cos(receipt.seed) * 7, 18, receipt.seed * 0.8);
  }
  context.restore();
}

export function drawNoelWorld(context: CanvasRenderingContext2D, cameraX: number, cameraY: number, now: number, scaleX = 1, scaleY = 1, playerHeight = 36): void {
  if (!isNoelPowerActive(now)) return;
  const strength = noelVisualStrength(now); const elapsed = noelPowerElapsed(now);
  const width = context.canvas.width / scaleX; const height = context.canvas.height / scaleY;
  const p = getNoelProtagonist(); const px = p.x - cameraX; const py = p.y - cameraY;
  const sx = width * 0.77; const sy = height * 0.26; const stageWidth = Math.min(225, width * 0.43); const stageHeight = stageWidth * 0.62;
  context.save(); context.scale(scaleX, scaleY); context.imageSmoothingEnabled = false;
  // A haunted musical's production consumes the funding without ever delivering a show.
  context.globalAlpha = strength * 0.14; context.fillStyle = '#dd85ef';
  for (let light = 0; light < 3; light++) {
    const foot = sx + Math.sin(elapsed / 700 + light * 2) * width * 0.4;
    context.beginPath(); context.moveTo(sx + (light - 1) * 40, sy - stageHeight * 0.45); context.lineTo(foot - 35, height); context.lineTo(foot + 35, height); context.fill();
  }
  context.globalAlpha = strength; context.fillStyle = '#20142f'; context.fillRect(sx - stageWidth / 2, sy - stageHeight / 2, stageWidth, stageHeight);
  context.fillStyle = '#873959'; context.fillRect(sx - stageWidth / 2, sy - stageHeight / 2, stageWidth, 12);
  context.fillRect(sx - stageWidth / 2, sy - stageHeight / 2, 17, stageHeight); context.fillRect(sx + stageWidth / 2 - 17, sy - stageHeight / 2, 17, stageHeight);
  context.strokeStyle = '#ffc178'; context.lineWidth = 3; context.strokeRect(sx - stageWidth / 2, sy - stageHeight / 2, stageWidth, stageHeight);
  for (let bulb = 0; bulb < 10; bulb++) {
    context.fillStyle = (Math.floor(elapsed / 160) + bulb) % 2 ? '#f8ca71' : '#cf7995';
    context.fillRect(sx - stageWidth / 2 + 5 + bulb * (stageWidth - 10) / 10, sy - stageHeight / 2 + 3, 5, 5);
  }
  for (let ring = 5; ring >= 0; ring--) {
    context.strokeStyle = ring % 2 ? '#d88cf4' : '#f29c3b'; context.lineWidth = 3;
    context.beginPath(); context.ellipse(sx, sy + 9, 8 + ring * stageWidth * 0.045, 4 + ring * stageHeight * 0.043, Math.sin(elapsed / 450) * 0.2, 0, Math.PI * 2); context.stroke();
  }
  context.fillStyle = '#ffdda0'; context.font = 'bold 11px monospace'; context.textAlign = 'center';
  context.fillText('SÉYENCÉ', sx, sy - stageHeight * 0.24);
  context.fillText(elapsed > 8000 ? 'SHOW CANCELLED' : 'FUNDING...', sx, sy + stageHeight * 0.37);
  // Render actual carried gift art draining from the protagonist into the production's vortex.
  const gifts = getNoelCollateral();
  for (let mote = 0; mote < 14; mote++) {
    const life = (elapsed / 1700 + mote / 14) % 1; const ease = life * life;
    const x = px + (sx - px) * ease + Math.sin(life * 8 + mote) * (1 - life) * 32;
    const y = py - playerHeight * 0.6 + (sy - py + playerHeight * 0.6) * ease - Math.sin(life * Math.PI) * 55;
    const size = (14 + mote % 3 * 5) * (1 - life * 0.7);
    context.globalAlpha = strength * Math.min(1, life * 5, (1 - life) * 4);
    const gift = gifts[mote % Math.max(1, gifts.length)]; const image = gift ? imageFor(gift.imageSource) : null;
    if (image?.complete && image.naturalWidth) context.drawImage(image, Math.round(x - size / 2), Math.round(y - size / 2), size, size);
    else paper(context, x, y, size, life * 5);
  }
  for (const guest of getNoelAudience()) {
    const x = guest.x - cameraX; const y = guest.y - cameraY;
    if (x < -50 || y < -50 || x > width + 50 || y > height + 70) continue;
    context.globalAlpha = strength * 0.8;
    ghost(context, x + Math.sin(elapsed / 300 + x) * 7, y - guest.height - 13, 22, elapsed, x);
    if (now - guest.reachedAt < 1200) { context.fillStyle = '#ffdda0'; context.font = 'bold 9px monospace'; context.fillText('WHERE’S THE SHOW?', x, y - guest.height - 32); }
  }
  const contract = imageFor('chat/noel/item.png');
  context.globalAlpha = strength * 0.85;
  if (contract.complete && contract.naturalWidth) context.drawImage(contract, px - 28, py - playerHeight - 65, 56, 56);
  context.globalAlpha = strength; context.font = 'bold 11px monospace'; context.textAlign = 'center';
  const labelY = Math.min(height - 17, py + 26); context.fillStyle = '#271332'; context.fillRect(px - 62, labelY - 13, 124, 19);
  context.fillStyle = '#ffbb72'; context.fillText(elapsed > 8500 ? 'RETURN: ZERO' : `DRAIN ${noelAssessment().toFixed(2)}`, px, labelY);
  context.restore();
}
