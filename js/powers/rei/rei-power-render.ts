import { getReiGuests, getReiOrigin, getReiProtagonist, getReiTrails, isReiEffectActive, isReiGuest, isReiPowerActive, reiGravityOffset, reiGravityRadius, reiPowerElapsed, reiVisualStrength } from './rei-power.js';
import { resolveSiteAsset } from '../../core/site-assets.js';
const colours = ['#ff95cb', '#a1edec', '#fff39c', '#c5a6ff', '#b6ffcb', '#ffa96e'];
let scenery: HTMLCanvasElement | null = null;
let palette: HTMLImageElement | null = null;
const view = { cameraX: 0, cameraY: 0, scaleX: 1, scaleY: 1 };
function star(context: CanvasRenderingContext2D, x: number, y: number, size: number, colour: string): void {
  context.fillStyle = colour; x = Math.round(x); y = Math.round(y); size = Math.max(1, Math.round(size));
  context.fillRect(x - 1, y - size, 2, size * 2 + 1); context.fillRect(x - size, y - 1, size * 2 + 1, 2);
  if (size > 3) { context.fillRect(x - 2, y - 2, 4, 4); context.fillStyle = '#fffef1'; context.fillRect(x - 1, y - 1, 2, 2); }
}
function itemImage(): HTMLImageElement {
  palette ??= new Image(); if (!palette.src) palette.src = resolveSiteAsset('character-assets/rei/item-2.png'); return palette;
}

export function withReiPower(context: CanvasRenderingContext2D, x: number, y: number, height: number, id: string, draw: () => void, now: number): void {
  if (!isReiPowerActive(now)) { draw(); return; }
  const gravity = isReiEffectActive('gravity', now) && isReiGuest('gravity', id) && id !== 'player';
  const sparkle = isReiEffectActive('sparkle', now) && (id === 'player' || isReiGuest('sparkle', id));
  if (!gravity && !sparkle) { draw(); return; }
  context.save();
  if (gravity) {
    const offset = reiGravityOffset(x / view.scaleX + view.cameraX, y / view.scaleY + view.cameraY, now);
    context.translate(offset.x * view.scaleX, offset.y * view.scaleY);
    x += offset.x * view.scaleX; y += offset.y * view.scaleY;
  }
  if (sparkle) context.filter = `brightness(${1 + reiVisualStrength('sparkle', now) * 0.2}) saturate(1.5)`;
  draw();
  context.restore();
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

export function drawReiTerrain(context: CanvasRenderingContext2D, now: number, cameraX = 0, cameraY = 0, scaleX = 1, scaleY = 1): void {
  Object.assign(view, { cameraX, cameraY, scaleX, scaleY });
  if (!isReiPowerActive(now)) return;
  scenery ??= document.createElement('canvas'); const { width, height } = context.canvas;
  if (scenery.width !== width || scenery.height !== height) { scenery.width = width; scenery.height = height; }
  const buffer = scenery.getContext('2d'); if (!buffer) return;
  const gravity = reiVisualStrength('gravity', now); const sparkle = reiVisualStrength('sparkle', now);
  buffer.filter = `sepia(${gravity * 0.25}) saturate(${1 + sparkle * 0.45}) brightness(${1 + sparkle * 0.09})`;
  buffer.clearRect(0, 0, width, height); buffer.drawImage(context.canvas, 0, 0);
  buffer.filter = 'none';
  context.save(); context.setTransform(1, 0, 0, 1, 0, 0); context.imageSmoothingEnabled = false;
  if (gravity > 0) {
    // A shared triangle mesh bends the image continuously, including diagonal edges.
    const warp = (x: number, y: number): { x: number; y: number } => {
      const offset = reiGravityOffset(x / scaleX + cameraX, y / scaleY + cameraY, now);
      const edge = Math.max(0, Math.min(1, x / 64, y / 64, (width - x) / 64, (height - y) / 64));
      return { x: x + offset.x * scaleX * edge, y: y + offset.y * scaleY * edge };
    };
    const triangle = (x: number, y: number, w: number, h: number, a: { x: number; y: number }, b: { x: number; y: number }, c: { x: number; y: number }): void => {
      context.save(); context.beginPath(); context.moveTo(a.x, a.y); context.lineTo(b.x, b.y); context.lineTo(c.x, c.y); context.closePath(); context.clip();
      const xx = (b.x - a.x) / w; const xy = (b.y - a.y) / w;
      const yx = (c.x - a.x) / h; const yy = (c.y - a.y) / h;
      context.setTransform(xx, xy, yx, yy, a.x - xx * x - yx * y, a.y - xy * x - yy * y);
      context.drawImage(scenery!, 0, 0); context.restore();
    };
    for (let y = 0; y < height; y += 32) for (let x = 0; x < width; x += 32) {
      const w = Math.min(32, width - x); const h = Math.min(32, height - y);
      const tl = warp(x, y); const tr = warp(x + w, y); const bl = warp(x, y + h); const br = warp(x + w, y + h);
      triangle(x, y, w, h, tl, tr, bl);
      triangle(x + w, y + h, -w, -h, br, bl, tr);
    }
  } else context.drawImage(scenery, 0, 0);
  context.restore();
}

export function drawReiGround(context: CanvasRenderingContext2D, cameraX: number, cameraY: number, now: number, scaleX = 1, scaleY = 1): void {
  if (!isReiPowerActive(now)) return;
  const width = context.canvas.width / scaleX; const height = context.canvas.height / scaleY;
  context.save(); context.scale(scaleX, scaleY); context.imageSmoothingEnabled = false;
  if (isReiEffectActive('gravity', now)) {
    const strength = reiVisualStrength('gravity', now); const elapsed = reiPowerElapsed('gravity', now);
    const centre = getReiProtagonist(); const px = centre.x - cameraX; const py = centre.y - cameraY - 22;
    const radius = reiGravityRadius(now);
    const glow = context.createRadialGradient(px, py, 8, px, py, 100);
    glow.addColorStop(0, '#fff3ae'); glow.addColorStop(0.3, '#ffb83399'); glow.addColorStop(1, '#ff8b0000');
    context.globalAlpha = strength * 0.8; context.fillStyle = glow;
    context.fillRect(px - 100, py - 100, 200, 200);
    for (let ray = 0; ray < 12; ray++) {
      const angle = ray * Math.PI / 6 + elapsed / 9000;
      context.strokeStyle = '#ffc75c'; context.globalAlpha = strength * 0.16; context.lineWidth = 2;
      context.beginPath();
      for (let step = 0; step <= 18; step++) {
        const r = 28 + step / 18 * radius; const bend = angle + step * 0.035;
        const x = px + Math.cos(bend) * r; const y = py + Math.sin(bend) * r * 0.7;
        if (step === 0) context.moveTo(x, y); else context.lineTo(x, y);
      }
      context.stroke();
    }
    context.globalAlpha = strength; context.fillStyle = '#fff3b1';
    context.beginPath(); context.arc(px, py, 24 + Math.sin(elapsed / 180) * 2, 0, Math.PI * 2); context.fill();
    context.strokeStyle = '#ffab32'; context.lineWidth = 5; context.stroke();
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
  if (isReiEffectActive('gravity', now)) {
    const strength = reiVisualStrength('gravity', now); const elapsed = reiPowerElapsed('gravity', now);
    const radius = Math.min(460, reiGravityRadius(now));
    for (let mote = 0; mote < 70; mote++) {
      const life = (elapsed / 2300 + mote / 70) % 1;
      const r = 24 + radius * (1 - life); const angle = mote * 2.4 + life * 2.8;
      const x = px + Math.cos(angle) * r; const y = py - 22 + Math.sin(angle) * r * 0.7;
      if (x < -8 || y < -8 || x > width + 8 || y > height + 8) continue;
      context.globalAlpha = strength * Math.sin(life * Math.PI);
      context.fillStyle = mote % 3 === 0 ? '#fff7c1' : mote % 3 === 1 ? '#e8aa53' : '#9b765c';
      context.save(); context.translate(x, y); context.rotate(angle + elapsed / 600);
      context.fillRect(-3, -2, mote % 3 + 3, mote % 2 + 3); context.restore();
    }
    for (let ring = 0; ring < 3; ring++) {
      context.globalAlpha = strength * 0.65; context.strokeStyle = ring % 2 ? '#fff1aa' : '#ffae43'; context.lineWidth = 2;
      context.beginPath(); context.ellipse(px, py - 22, 34 + ring * 12, 12 + ring * 6, Math.sin(elapsed / 1700) * 0.4 + ring * 0.5, 0, Math.PI * 2); context.stroke();
    }
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
    const makeup = itemImage(); context.globalAlpha = strength;
    if (makeup.complete && makeup.naturalWidth) context.drawImage(makeup, px + playerHeight * 0.5, py - playerHeight * 0.65, 32, 32);
  }
  context.restore();
}
