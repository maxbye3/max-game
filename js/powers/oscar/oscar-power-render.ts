import { getOscarBites, getOscarMeals, getOscarProtagonist, isOscarPowerActive, oscarGrowth, oscarPowerSecondsLeft, oscarVisualStrength, type BiteMark } from './oscar-power.js';
let terrain: HTMLCanvasElement | null = null;
const chunks = new Map<BiteMark, HTMLCanvasElement>();
const colours = ['#ffe38b', '#ffa464', '#ec7682', '#a5ddba'];
function biteShape(context: CanvasRenderingContext2D, x: number, y: number, radius: number): void {
  context.beginPath();
  for (let point = 0; point < 24; point++) {
    const angle = point * Math.PI / 12;
    const r = radius * (point % 2 ? 0.86 : 1);
    const px = x + Math.cos(angle) * r; const py = y + Math.sin(angle) * r * 0.75;
    if (point === 0) context.moveTo(px, py); else context.lineTo(px, py);
  }
  context.closePath();
}
export function withOscarAppetite(context: CanvasRenderingContext2D, x: number, y: number, id: string, draw: () => void, now: number): void {
  if (id !== 'player' || !isOscarPowerActive(now)) { draw(); return; }
  const growth = oscarGrowth(now);
  context.save(); context.translate(x, y); context.scale(growth, growth); context.translate(-x, -y); draw(); context.restore();
}

/** Capture the real map before drawing characters, then retain only bounded, world-anchored bites. */
export function drawOscarTerrain(context: CanvasRenderingContext2D, cameraX: number, cameraY: number, now: number, scaleX = 1, scaleY = 1): void {
  if (!isOscarPowerActive(now)) { chunks.clear(); return; }
  terrain ??= document.createElement('canvas');
  const { width, height } = context.canvas;
  if (terrain.width !== width || terrain.height !== height) { terrain.width = width; terrain.height = height; }
  const buffer = terrain.getContext('2d'); if (!buffer) return;
  buffer.clearRect(0, 0, width, height); buffer.drawImage(context.canvas, 0, 0);
  const current = new Set(getOscarBites());
  for (const bite of chunks.keys()) if (!current.has(bite)) chunks.delete(bite);
  for (const bite of current) {
    if (bite.targetId || chunks.has(bite)) continue;
    const x = (bite.x - cameraX) * scaleX; const y = (bite.y - cameraY) * scaleY;
    const w = bite.size * 2 * scaleX; const h = bite.size * 1.5 * scaleY;
    if (x < -w || y < -h || x > width + w || y > height + h) continue;
    const chunk = document.createElement('canvas'); chunk.width = Math.max(1, Math.ceil(w)); chunk.height = Math.max(1, Math.ceil(h));
    const ctx = chunk.getContext('2d'); if (!ctx) continue;
    ctx.imageSmoothingEnabled = false; ctx.scale(scaleX, scaleY);
    biteShape(ctx, bite.size, bite.size * 0.75, bite.size); ctx.clip(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(terrain, x - w / 2, y - h / 2, w, h, 0, 0, w, h); chunks.set(bite, chunk);
  }
}

export function drawOscarWorldBites(context: CanvasRenderingContext2D, cameraX: number, cameraY: number, now = performance.now()): void {
  if (!isOscarPowerActive(now)) return;
  context.save(); context.imageSmoothingEnabled = false;
  for (const [index, bite] of getOscarBites().entries()) {
    const age = now - bite.at; const x = bite.x - cameraX; const y = bite.y - cameraY;
    context.globalAlpha = oscarVisualStrength(now) * Math.min(1, age / 100);
    context.fillStyle = '#24172c'; context.strokeStyle = '#f6b363'; context.lineWidth = 2;
    biteShape(context, x, y, bite.size); context.fill(); context.stroke();
    context.fillStyle = '#3a2d3b'; biteShape(context, x, y, bite.size * 0.75); context.fill();
    for (let crumb = 0; crumb < 6; crumb++) {
      const angle = index * 1.7 + crumb * Math.PI / 3; const r = bite.size + 8 + (age / 70 + crumb * 3) % 10;
      context.fillStyle = colours[crumb % colours.length]!;
      context.fillRect(Math.round(x + Math.cos(angle) * r), Math.round(y + Math.sin(angle) * r * 0.75), 3, 3);
    }
    if (age < 700) {
      context.globalAlpha *= 1 - age / 700; context.fillStyle = '#fff1cb'; context.font = 'bold 10px monospace'; context.textAlign = 'center';
      context.fillText(bite.targetId ? 'GULP!' : 'CRUNCH!', x, y - bite.size - age * 0.02);
    }
  }
  context.restore();
}

export function drawOscarWorld(context: CanvasRenderingContext2D, cameraX: number, cameraY: number, now: number, scaleX = 1, scaleY = 1): void {
  if (!isOscarPowerActive(now)) return;
  const p = getOscarProtagonist(); const px = p.x - cameraX; const py = p.y - cameraY;
  const strength = oscarVisualStrength(now);
  const returning = oscarPowerSecondsLeft(now) < 0.7;
  context.save(); context.scale(scaleX, scaleY); context.imageSmoothingEnabled = false;
  // Actual terrain fragments curve into Max's mouth instead of using generic food particles.
  for (const [bite, chunk] of chunks) {
    const life = returning ? 1 - oscarPowerSecondsLeft(now) / 0.7 : (now - bite.at) / 900;
    if (life < 0 || life >= 1) continue;
    const ease = returning ? 1 - life * life : life * life;
    const x = bite.x - cameraX + (px - bite.x + cameraX) * ease;
    const y = bite.y - cameraY + (py - 24 - bite.y + cameraY) * ease - Math.sin(life * Math.PI) * 42;
    const size = bite.size * 2 * (returning ? 0.2 + life * 0.8 : 1 - life * 0.85);
    context.save(); context.globalAlpha = strength * (1 - life * 0.5); context.translate(x, y); context.rotate(life * 4);
    context.drawImage(chunk, -size / 2, -size * 0.375, size, size * 0.75); context.restore();
  }
  for (const meal of getOscarMeals()) {
    const bite = getOscarBites().find((mark) => mark.targetId === meal.id); if (!bite) continue;
    const life = returning ? 1 - oscarPowerSecondsLeft(now) / 0.7 : (now - bite.at) / 650;
    if (life < 0 || life >= 1) continue;
    const travel = returning ? 1 - life : life;
    const x = meal.x - cameraX + (px - meal.x + cameraX) * travel;
    const y = meal.y - cameraY + (py - 24 - meal.y + cameraY) * travel;
    context.save(); context.globalAlpha = strength * (returning ? 1 : 1 - life); context.translate(x, y); context.rotate(life * 7); context.scale(1 - travel * 0.8, 1 - travel * 0.8);
    context.fillStyle = '#ffe29b'; context.fillRect(-8, -meal.height * 0.8, 16, 16); context.fillStyle = '#d68792'; context.fillRect(-10, -meal.height * 0.8 + 17, 20, meal.height * 0.6); context.restore();
  }
  context.globalAlpha = strength * 0.22; context.strokeStyle = '#ffc678'; context.lineWidth = 2;
  const radius = 65 + (now % 700) / 700 * 75;
  for (let ray = 0; ray < 12; ray++) {
    const angle = ray * Math.PI / 6 + now / 1800;
    context.beginPath(); context.moveTo(px + Math.cos(angle) * radius, py - 22 + Math.sin(angle) * radius * 0.6);
    context.lineTo(px + Math.cos(angle) * (radius - 25), py - 22 + Math.sin(angle) * (radius - 25) * 0.6); context.stroke();
  }
  context.globalAlpha = strength; context.font = 'bold 11px monospace'; context.textAlign = 'center';
  const labelX = Math.max(64, Math.min(context.canvas.width / scaleX - 64, px));
  context.fillStyle = '#271b2b'; context.fillRect(labelX - 60, py + 14, 120, 19); context.fillStyle = '#ffe5aa';
  context.fillText(returning ? 'BUUURP!' : `APPETITE ${Math.round(oscarGrowth(now) * 100)}%`, labelX, py + 27);
  context.restore();
}

export function drawOscarPower(context: CanvasRenderingContext2D, playerX: number, playerY: number, playerHeight: number, now = performance.now(), facesLeft = false): void {
  if (!isOscarPowerActive(now)) return;
  const growth = oscarGrowth(now); const snap = (Math.sin(now / 82) + 1) / 2;
  context.save(); context.globalAlpha = oscarVisualStrength(now); context.imageSmoothingEnabled = false;
  context.translate(playerX, playerY); context.scale(growth * (facesLeft ? -1 : 1), growth);
  // An enormous fork and a snapping cartoon jaw turn the actual protagonist into the eater.
  context.fillStyle = '#c7dad9'; context.fillRect(-26, -playerHeight * 0.85, 4, playerHeight);
  for (let prong = 0; prong < 4; prong++) context.fillRect(-32 + prong * 5, -playerHeight * 1.05, 3, 15);
  context.fillRect(-32, -playerHeight * 0.85, 18, 4);
  context.translate(10, -playerHeight * 0.6); const gap = 3 + snap * 10;
  context.fillStyle = '#32101e'; context.fillRect(-4, -10 - gap, 31, 21 + gap * 2);
  context.fillStyle = '#f26582'; context.fillRect(-7, -14 - gap, 36, 6); context.fillRect(-7, 9 + gap, 36, 6);
  context.fillStyle = '#fff0c8';
  for (let tooth = 0; tooth < 6; tooth++) { context.fillRect(-3 + tooth * 5, -8 - gap, 3, 5); context.fillRect(-3 + tooth * 5, 5 + gap, 3, 5); }
  context.fillStyle = '#f992a5'; context.fillRect(12, 4, 13, 4); context.restore();
}
