import { getReiGuests, getReiOrigin, getReiProtagonist, getReiTrails, isReiEffectActive, isReiGuest, isReiPowerActive, reiPowerElapsed, reiVisualStrength } from './rei-power.js';
import { resolveSiteAsset } from './site-assets.js';
const colours = ['#ff95cb', '#a1edec', '#fff39c', '#c5a6ff', '#b6ffcb', '#ffa96e'];
let scenery: HTMLCanvasElement | null = null;
let tray: HTMLImageElement | null = null;
let palette: HTMLImageElement | null = null;
function star(context: CanvasRenderingContext2D, x: number, y: number, size: number, colour: string): void {
  context.fillStyle = colour; x = Math.round(x); y = Math.round(y); size = Math.max(1, Math.round(size));
  context.fillRect(x - 1, y - size, 2, size * 2 + 1); context.fillRect(x - size, y - 1, size * 2 + 1, 2);
  if (size > 3) { context.fillRect(x - 2, y - 2, 4, 4); context.fillStyle = '#fffef1'; context.fillRect(x - 1, y - 1, 2, 2); }
}
function steam(context: CanvasRenderingContext2D, x: number, y: number, size: number, now: number): void {
  context.fillStyle = '#fff1cb';
  for (let segment = 0; segment < 5; segment++) context.fillRect(Math.round(x + Math.sin(now / 650 + segment) * 3), Math.round(y - segment * size), 3, size - 1);
}
function itemImage(kind: 'slow' | 'sparkle'): HTMLImageElement {
  if (kind === 'slow') { tray ??= new Image(); if (!tray.src) tray.src = resolveSiteAsset('chat/rei/item-1.png'); return tray; }
  palette ??= new Image(); if (!palette.src) palette.src = resolveSiteAsset('chat/rei/item-2.png'); return palette;
}

export function withReiPower(context: CanvasRenderingContext2D, x: number, y: number, height: number, id: string, draw: () => void, now: number): void {
  if (!isReiPowerActive(now)) { draw(); return; }
  const slow = isReiEffectActive('slow', now) && (id === 'player' || isReiGuest('slow', id));
  const sparkle = isReiEffectActive('sparkle', now) && (id === 'player' || isReiGuest('sparkle', id));
  if (!slow && !sparkle) { draw(); return; }
  context.save();
  if (slow) {
    const strength = reiVisualStrength('slow', now); const phase = reiPowerElapsed('slow', now);
    context.translate(x, y); context.rotate(Math.sin(phase / 850 + id.length) * 0.055 * strength);
    context.scale(1 + 0.14 * strength, 1 - 0.12 * strength); context.translate(-x, -y);
  }
  if (sparkle) context.filter = `brightness(${1 + reiVisualStrength('sparkle', now) * 0.2}) saturate(1.5)`;
  draw(); context.restore();
  if (sparkle) {
    context.save(); context.globalAlpha *= reiVisualStrength('sparkle', now);
    const elapsed = reiPowerElapsed('sparkle', now);
    for (let twinkle = 0; twinkle < (id === 'player' ? 14 : 7); twinkle++) {
      const angle = elapsed / (440 + twinkle * 40) + twinkle * 2.4;
      const radius = height * (0.18 + twinkle % 4 * 0.07);
      const size = (1 + Math.abs(Math.sin(elapsed / 170 + twinkle)) * 4) * height / 52;
      star(context, x + Math.cos(angle) * radius, y - height * 0.6 + Math.sin(angle) * height * 0.5, size, colours[twinkle % colours.length]!);
    }
    context.restore();
  }
}

export function drawReiTerrain(context: CanvasRenderingContext2D, now: number): void {
  if (!isReiPowerActive(now)) return;
  scenery ??= document.createElement('canvas'); const { width, height } = context.canvas;
  if (scenery.width !== width || scenery.height !== height) { scenery.width = width; scenery.height = height; }
  const buffer = scenery.getContext('2d'); if (!buffer) return;
  buffer.clearRect(0, 0, width, height); buffer.drawImage(context.canvas, 0, 0);
  context.save(); context.setTransform(1, 0, 0, 1, 0, 0); context.imageSmoothingEnabled = false;
  const slow = reiVisualStrength('slow', now); const sparkle = reiVisualStrength('sparkle', now);
  context.globalAlpha = Math.max(slow, sparkle);
  context.filter = `sepia(${slow * 0.35}) saturate(${1 + sparkle * 0.45}) brightness(${1 + sparkle * 0.09})`;
  context.drawImage(scenery, 0, 0); context.filter = 'none'; context.restore();
}

export function drawReiGround(context: CanvasRenderingContext2D, cameraX: number, cameraY: number, now: number, scaleX = 1, scaleY = 1): void {
  if (!isReiPowerActive(now)) return;
  const width = context.canvas.width / scaleX; const height = context.canvas.height / scaleY;
  context.save(); context.scale(scaleX, scaleY); context.imageSmoothingEnabled = false;
  if (isReiEffectActive('slow', now)) {
    const strength = reiVisualStrength('slow', now); const elapsed = reiPowerElapsed('slow', now); const origin = getReiOrigin('slow');
    for (let tile = 0; tile < 55; tile++) {
      const radius = Math.sqrt(tile) * 43; if (radius > elapsed * 0.18) continue;
      const x = origin.x - cameraX + Math.cos(tile * 2.4) * radius; const y = origin.y - cameraY + Math.sin(tile * 2.4) * radius * 0.7;
      if (x < -30 || y < -30 || x > width + 30 || y > height + 30) continue;
      context.globalAlpha = strength * 0.32; context.fillStyle = tile % 2 ? '#e9ac45' : '#d57839';
      context.fillRect(Math.round(x - 17), Math.round(y - 7), 34, 14); context.fillStyle = '#ffe49c'; context.fillRect(Math.round(x - 13), Math.round(y - 8), 26, 3);
      if (tile % 4 === 0) { context.globalAlpha = strength * 0.4; steam(context, x, y - 10, 5, elapsed + tile * 90); }
    }
    for (const foot of getReiTrails('slow')) {
      const age = now - foot.at; context.globalAlpha = strength * (1 - age / 3000) * 0.7; context.fillStyle = '#f2bf63';
      context.beginPath(); context.ellipse(foot.x - cameraX, foot.y - cameraY, 16 + age / 300, 6 + age / 800, 0, 0, Math.PI * 2); context.fill();
    }
  }
  if (isReiEffectActive('sparkle', now)) {
    const strength = reiVisualStrength('sparkle', now); const elapsed = reiPowerElapsed('sparkle', now); const origin = getReiOrigin('sparkle');
    for (let twinkle = 0; twinkle < 100; twinkle++) {
      const radius = 30 + Math.sqrt(twinkle) * 52; if (radius > elapsed * 0.3) continue;
      const x = origin.x - cameraX + Math.cos(twinkle * 2.4) * radius; const y = origin.y - cameraY + Math.sin(twinkle * 2.4) * radius * 0.7;
      if (x < -15 || y < -15 || x > width + 15 || y > height + 15) continue;
      context.globalAlpha = strength * (0.15 + Math.abs(Math.sin(elapsed / 450 + twinkle)) * 0.65);
      star(context, x, y, 2 + Math.abs(Math.sin(elapsed / 240 + twinkle)) * 4, colours[twinkle % colours.length]!);
    }
    const trail = getReiTrails('sparkle');
    for (let index = 0; index < trail.length; index++) {
      const point = trail[index]!; const age = now - point.at; const x = point.x - cameraX; const y = point.y - cameraY;
      context.globalAlpha = strength * (1 - age / 3000);
      if (index > 0) { const before = trail[index - 1]!; context.strokeStyle = colours[index % colours.length]!; context.lineWidth = 2; context.beginPath(); context.moveTo(before.x - cameraX, before.y - cameraY); context.lineTo(x, y); context.stroke(); }
      for (let dust = 0; dust < 4; dust++) star(context, x + Math.sin(point.seed + dust * 2) * 12, y + Math.cos(point.seed + dust) * 7, 2 + dust % 2, colours[(index + dust) % colours.length]!);
    }
  }
  context.restore();
}

export function drawReiWorld(context: CanvasRenderingContext2D, cameraX: number, cameraY: number, now: number, scaleX = 1, scaleY = 1, playerHeight = 36): void {
  if (!isReiPowerActive(now)) return;
  const p = getReiProtagonist(); const px = p.x - cameraX; const py = p.y - cameraY;
  const width = context.canvas.width / scaleX; const height = context.canvas.height / scaleY;
  context.save(); context.scale(scaleX, scaleY); context.imageSmoothingEnabled = false; context.textAlign = 'center';
  if (isReiEffectActive('slow', now)) {
    const strength = reiVisualStrength('slow', now); const elapsed = reiPowerElapsed('slow', now); const origin = getReiOrigin('slow');
    context.globalAlpha = strength * 0.35; context.strokeStyle = '#ffd889'; context.lineWidth = 3;
    for (let wave = 0; wave < 3; wave++) { const radius = (elapsed / 13 + wave * 65) % 380; context.beginPath(); context.ellipse(origin.x - cameraX, origin.y - cameraY, radius, radius * 0.65, 0, 0, Math.PI * 2); context.stroke(); }
    const plate = itemImage('slow'); context.globalAlpha = strength * 0.9;
    const trayWidth = Math.min(150, width * 0.28);
    if (plate.complete && plate.naturalWidth) context.drawImage(plate, px - trayWidth / 2, py - playerHeight - 68, trayWidth, trayWidth * 0.6);
    for (let puff = 0; puff < 5; puff++) { context.globalAlpha = strength * 0.4; steam(context, px + (puff - 2) * 16, py - playerHeight - 70, 5, elapsed + puff * 350); }
    for (const guest of getReiGuests('slow')) { context.globalAlpha = strength * 0.8; context.fillStyle = '#ffdc99'; context.font = 'bold 13px monospace'; context.fillText('Z z z', guest.x - cameraX, guest.y - cameraY - guest.height - 16 - Math.sin(elapsed / 800) * 5); }
    const labelX = Math.max(64, Math.min(width - 64, px)); context.globalAlpha = strength; context.fillStyle = '#5b3a30'; context.fillRect(labelX - 62, py + 14, 124, 19);
    context.fillStyle = '#ffe2a4'; context.font = 'bold 11px monospace'; context.fillText('FOOD COMA 50%', labelX, py + 27);
  }
  if (isReiEffectActive('sparkle', now)) {
    const strength = reiVisualStrength('sparkle', now); const elapsed = reiPowerElapsed('sparkle', now);
    // Vast ribbons of light form a sky canopy; the centre stays readable and playable.
    for (let ribbon = 0; ribbon < colours.length; ribbon++) {
      context.globalAlpha = strength * 0.14; context.strokeStyle = colours[ribbon]!; context.lineWidth = 10;
      context.beginPath(); context.moveTo(-30, height * 0.27 + ribbon * 7);
      context.bezierCurveTo(width * 0.25, -50 + Math.sin(elapsed / 1200) * 30, width * 0.72, height * 0.08 + ribbon * 12, width + 30, height * 0.32 + ribbon * 8); context.stroke();
    }
    for (let flash = 0; flash < 32; flash++) {
      const life = (elapsed / 1900 + flash / 32) % 1;
      context.globalAlpha = strength * Math.sin(life * Math.PI) * 0.65;
      star(context, (flash * 97 + elapsed / 70) % width, (flash * 53 + elapsed / 90) % height, 2 + Math.sin(life * Math.PI) * 5, colours[flash % colours.length]!);
    }
    for (const guest of getReiGuests('sparkle')) {
      const x = guest.x - cameraX; const y = guest.y - cameraY - guest.height - 12;
      context.globalAlpha = strength * 0.7; context.strokeStyle = '#f3c4fa'; context.lineWidth = 2;
      context.beginPath(); context.ellipse(x, y, 23, 7, Math.sin(elapsed / 700) * 0.2, 0, Math.PI * 2); context.stroke();
      for (let halo = 0; halo < 5; halo++) { const angle = elapsed / 650 + halo * Math.PI * 2 / 5; star(context, x + Math.cos(angle) * 23, y + Math.sin(angle) * 7, 3, colours[halo]!); }
    }
    const makeup = itemImage('sparkle'); context.globalAlpha = strength;
    if (makeup.complete && makeup.naturalWidth) context.drawImage(makeup, px + playerHeight * 0.5, py - playerHeight * 0.65, 32, 32);
  }
  context.restore();
}
