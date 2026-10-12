import { getJulianSummoner, getJulianVictim, getJulianChoice, isJulianExecuted, isJulianPowerActive, isJulianDemonPresent, julianElapsed, julianStrength, julianVerdictAge, JULIAN_DEMON_DELAY, JULIAN_DEMON_DURATION } from './julian-power.js';
let terrainBuffer: HTMLCanvasElement | null = null;

export function withJulianSummoning(context: CanvasRenderingContext2D, x: number, y: number, height: number, id: string, drawSprite: () => void, now: number): void {
  if (!isJulianPowerActive(now)) { drawSprite(); return; }
  const strength = julianStrength(now);
  if (isJulianExecuted(id, now)) {
    const remaining = 1 - Math.min(1, julianVerdictAge(now) / 450);
    if (remaining <= 0) return;
    context.save(); context.globalAlpha *= remaining; context.filter = 'brightness(3) sepia(1)';
    context.translate(x, y - (1 - remaining) * height); context.scale(remaining, remaining); context.translate(-x, -y);
    drawSprite(); context.restore(); return;
  }
  const player = id === 'player';
  context.save();
  context.translate(x + (player ? 0 : Math.sin(now / 35 + id.length) * 2 * strength), y - (player ? 17 + Math.sin(now / 180) * 4 : 2) * strength);
  context.rotate(player ? Math.sin(now / 270) * 0.07 * strength : 0);
  context.translate(-x, -y); drawSprite(); context.restore();
  if (player) {
    context.save(); context.globalAlpha = strength; context.fillStyle = '#ffe383';
    context.fillRect(x - 5, y - height - 29, 10, 4); context.fillRect(x - 9, y - height - 25, 18, 3);
    context.restore();
  }
}

/** Warp the actual map into the summoning realm, without changing collision data. */
export function drawJulianTerrain(context: CanvasRenderingContext2D, now: number): void {
  if (!isJulianPowerActive(now)) return;
  terrainBuffer ??= document.createElement('canvas');
  const { width, height } = context.canvas;
  if (terrainBuffer.width !== width || terrainBuffer.height !== height) { terrainBuffer.width = width; terrainBuffer.height = height; }
  const buffer = terrainBuffer.getContext('2d'); if (!buffer) return;
  buffer.clearRect(0, 0, width, height); buffer.drawImage(context.canvas, 0, 0);
  const strength = julianStrength(now); const elapsed = julianElapsed(now);
  context.save(); context.setTransform(1, 0, 0, 1, 0, 0); context.imageSmoothingEnabled = false;
  for (let y = 0; y < height; y += 6) {
    const shift = Math.round(Math.sin(y / 25 - elapsed / 190) * 5 * strength);
    context.drawImage(terrainBuffer, 0, y, width, Math.min(6, height - y), shift - 8, y, width + 16, Math.min(6, height - y));
  }
  context.globalAlpha = strength * 0.43; context.fillStyle = '#2b073a'; context.fillRect(0, 0, width, height);
  context.globalAlpha = strength * 0.55; context.strokeStyle = '#ff775a'; context.lineWidth = 2;
  for (let crack = 0; crack < 16; crack++) {
    const x = (crack * 193) % width; const y = (crack * 127) % height;
    context.beginPath(); context.moveTo(x, y); context.lineTo(x + 13, y + 9); context.lineTo(x + 8, y + 21); context.lineTo(x + 26, y + 31); context.stroke();
  }
  context.restore();
}

export function drawJulianGround(context: CanvasRenderingContext2D, cameraX: number, cameraY: number, now: number, scaleX = 1, scaleY = 1): void {
  if (!isJulianPowerActive(now)) return;
  const player = getJulianSummoner(); const elapsed = julianElapsed(now); const strength = julianStrength(now);
  const x = player.x - cameraX; const y = player.y - cameraY;
  context.save(); context.scale(scaleX, scaleY); context.globalAlpha = strength;
  context.fillStyle = '#150b20'; context.strokeStyle = '#ffcf5e'; context.lineWidth = 3;
  context.beginPath(); context.ellipse(x, y - 3, 76, 27, 0, 0, Math.PI * 2); context.fill(); context.stroke();
  context.strokeStyle = '#f66368'; context.lineWidth = 2;
  for (let ring = 0; ring < 3; ring++) {
    const radius = 30 + ((elapsed / 12 + ring * 65) % 180);
    context.globalAlpha = strength * (1 - radius / 230);
    context.beginPath(); context.ellipse(x, y, radius, radius * 0.35, 0, 0, Math.PI * 2); context.stroke();
  }
  for (let rune = 0; rune < 16; rune++) {
    const angle = rune * Math.PI / 8 + elapsed / 1500;
    const rx = Math.round(x + Math.cos(angle) * 72); const ry = Math.round(y + Math.sin(angle) * 26);
    context.globalAlpha = strength; context.fillStyle = '#ffe393'; context.fillRect(rx - 2, ry - 5, 4, 10); context.fillRect(rx - 5, ry - 2, 10, 4);
  }
  const target = getJulianVictim();
  if (target && getJulianChoice() === 'answer') {
    const distance = Math.hypot(target.x - player.x, target.y - player.y); const dots = Math.min(100, Math.ceil(distance / 12));
    context.fillStyle = '#fff196';
    for (let dot = 0; dot <= dots; dot++) {
      const t = dots ? dot / dots : 0; const pulse = 2 + Math.sin(elapsed / 140 - dot) * 1;
      context.fillRect(x + (target.x - player.x) * t - pulse, y + (target.y - player.y) * t - pulse, pulse * 2, pulse * 2);
    }
  }
  context.restore();
}

function demonDuck(context: CanvasRenderingContext2D, x: number, y: number, emergence: number, now: number): void {
  context.save(); context.translate(Math.round(x), Math.round(y)); context.scale(emergence, emergence);
  // Angular pixel wings, horns and a huge rubber body form the summoned creature.
  const flap = Math.round(Math.sin(now / 110) * 8);
  context.fillStyle = '#5c1a4c';
  for (const side of [-1, 1]) {
    context.save(); context.scale(side, 1);
    context.beginPath(); context.moveTo(25, -33); context.lineTo(92, -87 + flap); context.lineTo(80, -25); context.lineTo(62, -44); context.lineTo(48, -18); context.closePath(); context.fill(); context.restore();
  }
  context.fillStyle = '#b57022'; context.fillRect(-45, -33, 90, 32); context.fillRect(-35, -48, 70, 22);
  context.fillStyle = '#ffe259'; context.fillRect(-39, -40, 80, 32); context.fillRect(-28, -51, 59, 22);
  context.fillRect(-11, -83, 42, 47); context.fillRect(-3, -92, 27, 12);
  context.fillStyle = '#ff9351'; context.fillRect(25, -63, 27, 13); context.fillRect(29, -50, 14, 4);
  context.fillStyle = '#fff3bb'; context.fillRect(32, -51, 4, 9); context.fillRect(41, -51, 4, 7);
  context.fillStyle = '#3d1232'; context.fillRect(7, -77, 16, 10);
  context.fillStyle = '#ff375a'; context.fillRect(12, -74, 9, 4);
  context.fillStyle = '#eadae6';
  context.beginPath(); context.moveTo(-9, -84); context.lineTo(-17, -111); context.lineTo(2, -91); context.fill();
  context.beginPath(); context.moveTo(17, -91); context.lineTo(34, -112); context.lineTo(28, -83); context.fill();
  context.fillStyle = '#a26a22'; context.fillRect(-27, -28, 30, 4); context.fillRect(-22, -22, 21, 3);
  context.restore();
}

export function drawJulianWorld(context: CanvasRenderingContext2D, cameraX: number, cameraY: number, now: number, scaleX = 1, scaleY = 1): void {
  if (!isJulianPowerActive(now)) return;
  const player = getJulianSummoner(); const elapsed = julianElapsed(now); const strength = julianStrength(now);
  const x = player.x - cameraX; const y = player.y - cameraY;
  context.save(); context.scale(scaleX, scaleY); context.imageSmoothingEnabled = false;
  const width = context.canvas.width / scaleX; const height = context.canvas.height / scaleY;
  for (let spark = 0; spark < 65; spark++) {
    const sx = (spark * 91 + Math.sin(elapsed / 250 + spark) * 9 + width) % width;
    const sy = height - (spark * 67 + elapsed * (0.04 + spark % 3 * 0.02)) % (height + 30);
    context.globalAlpha = strength * 0.65; context.fillStyle = spark % 2 ? '#ffc75e' : '#ff546b'; context.fillRect(Math.round(sx), Math.round(sy), 3, 5 + spark % 4);
  }
  const target = getJulianVictim();
  if (target && getJulianChoice() === 'execution') {
    const age = julianVerdictAge(now); const tx = target.x - cameraX; const ty = target.y - cameraY;
    context.globalAlpha = strength * Math.max(0.2, 1 - age / 1500); context.fillStyle = '#ffefb0';
    context.fillRect(tx - 8, 0, 16, Math.max(0, ty));
    context.globalAlpha = strength; context.fillStyle = '#17061f'; context.strokeStyle = '#ff7467'; context.lineWidth = 3;
    context.beginPath(); context.ellipse(tx, ty, 25, 9, 0, 0, Math.PI * 2); context.fill(); context.stroke();
    context.fillStyle = '#ffd16a'; context.font = 'bold 10px monospace'; context.textAlign = 'center'; context.fillText('QUACK. DOOM.', tx, ty - 42);
  }
  if (isJulianDemonPresent(now)) {
    const emergence = Math.min(1, (elapsed - JULIAN_DEMON_DELAY) / 300, (JULIAN_DEMON_DELAY + JULIAN_DEMON_DURATION - elapsed) / 350);
    context.globalAlpha = strength;
    // Keep the full creature visible near the player at interior and phone scales.
    const size = Math.min(1, width / 380);
    context.save(); context.translate(Math.max(95 * size, Math.min(width - 95 * size, x)), Math.max(120 * size, y - 42)); context.scale(size, size);
    demonDuck(context, 0, Math.sin(elapsed / 160) * 6, Math.max(0, emergence), now); context.restore();
  }
  context.restore();
}
