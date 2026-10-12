import { getJuProtagonist, getJuPulses, getJuRevellers, getJuShadow, getJuSteps, isJuCurseBeat, isJuPowerActive, juCharacterPose, juCurseStrength, juPowerElapsed, juVisualStrength } from './ju-power.js';

const COLOURS = ['#fff19b', '#7cf8dd', '#ff8fca', '#a5a2ff'] as const;
const colour = (index: number): string => COLOURS[index % COLOURS.length] ?? COLOURS[0];
let terrainBuffer: HTMLCanvasElement | null = null;

function star(context: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  context.fillRect(Math.round(x - size), Math.round(y - 1), size * 2 + 1, 3);
  context.fillRect(Math.round(x - 1), Math.round(y - size), 3, size * 2 + 1);
}
function eye(context: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  context.fillStyle = '#21112f'; context.fillRect(x - size, y - size * 0.4, size * 2, size * 0.8);
  context.fillStyle = '#bc91ff'; context.fillRect(x - size + 2, y - 1, size * 2 - 4, 2);
  context.fillStyle = '#80ffbf'; context.fillRect(x - 1, y - 3, 3, 6);
}

export function withJuVibes(context: CanvasRenderingContext2D, x: number, y: number, height: number, id: string, drawSprite: () => void, now: number): void {
  const pose = juCharacterPose(id, now);
  if (!pose.x && !pose.lift && !pose.lean) { drawSprite(); return; }
  const strength = juVisualStrength(now);
  context.save(); context.globalAlpha *= strength * 0.32; context.fillStyle = '#a594e3';
  context.beginPath(); context.ellipse(x, y + 3, height * 0.4, height * 0.1, 0, 0, Math.PI * 2); context.fill(); context.restore();
  // The actual character sprouts a second, independent shadow in the cursed realm.
  context.save(); context.globalAlpha *= strength * (isJuCurseBeat(now) ? 0.5 : 0.2); context.filter = 'brightness(0)';
  context.translate(x + 18 + Math.sin(juPowerElapsed(now) / 250) * 6, y + 8); context.scale(1.2, 0.65); context.translate(-x, -y);
  drawSprite(); context.restore();
  context.save(); context.translate(x + pose.x, y - pose.lift); context.rotate(pose.lean); context.translate(-x, -y);
  drawSprite(); context.restore();
}

/** Bend the real landscape between a shimmering golden realm and its haunted reflection. */
export function drawJuTerrain(context: CanvasRenderingContext2D, now: number): void {
  if (!isJuPowerActive(now)) return;
  terrainBuffer ??= document.createElement('canvas');
  const { width, height } = context.canvas;
  if (terrainBuffer.width !== width || terrainBuffer.height !== height) { terrainBuffer.width = width; terrainBuffer.height = height; }
  const buffer = terrainBuffer.getContext('2d');
  if (!buffer) return;
  buffer.clearRect(0, 0, width, height); buffer.drawImage(context.canvas, 0, 0);
  const strength = juVisualStrength(now); const curse = juCurseStrength(now); const elapsed = juPowerElapsed(now);
  context.save(); context.setTransform(1, 0, 0, 1, 0, 0); context.imageSmoothingEnabled = false;
  for (let y = 0; y < height; y += 8) {
    const shift = Math.round(Math.sin(y / 27 - elapsed / 320) * (3 + curse * 7) * strength);
    const band = Math.min(8, height - y);
    context.drawImage(terrainBuffer, 0, y, width, band, shift - 12, y, width + 24, band);
  }
  context.globalAlpha = strength * (0.09 + curse * 0.16); context.fillStyle = curse > 0 ? '#551b80' : '#ffe7a0'; context.fillRect(0, 0, width, height);
  // A moving veil makes the curse visible even during the joyful part of the beat.
  const split = width * (0.5 + Math.sin(elapsed / 1700) * 0.25);
  const veil = context.createLinearGradient(split - width * 0.25, 0, split + width * 0.25, 0);
  veil.addColorStop(0, 'rgba(28,8,51,0.3)'); veil.addColorStop(1, 'rgba(255,235,149,0.05)');
  context.globalAlpha = strength; context.fillStyle = veil; context.fillRect(0, 0, width, height); context.restore();
}

export function drawJuGround(context: CanvasRenderingContext2D, cameraX: number, cameraY: number, now: number, scaleX = 1, scaleY = 1): void {
  if (!isJuPowerActive(now)) return;
  const strength = juVisualStrength(now); const elapsed = juPowerElapsed(now);
  context.save(); context.scale(scaleX, scaleY);
  for (const [index, step] of getJuSteps().entries()) {
    const life = (now - step.time) / 2200;
    const x = step.x - cameraX + step.side * 10; const y = step.y - cameraY;
    context.globalAlpha = strength * (1 - life) * 0.7; context.fillStyle = colour(index);
    star(context, x, y, 4 + life * 6);
    context.fillStyle = '#3b1d54'; context.fillRect(x + 12, y + 3, 9, 3); context.fillRect(x + 15, y, 3, 9);
  }
  for (const [index, pulse] of getJuPulses().entries()) {
    const radius = (now - pulse.time) * 0.45;
    const alpha = strength * Math.max(0, 1 - (now - pulse.time) / 3200);
    for (let ring = 0; ring < 3; ring++) {
      context.globalAlpha = alpha * 0.45; context.strokeStyle = colour(index + ring); context.lineWidth = 2;
      context.beginPath(); context.ellipse(pulse.x - cameraX, pulse.y - cameraY, 12 + radius + ring * 9, 5 + radius * 0.4 + ring * 4, 0, 0, Math.PI * 2); context.stroke();
    }
    for (let glyph = 0; glyph < 14; glyph++) {
      const angle = glyph * Math.PI / 7 + elapsed / 2500;
      const x = pulse.x - cameraX + Math.cos(angle) * radius; const y = pulse.y - cameraY + Math.sin(angle) * radius * 0.4;
      context.globalAlpha = alpha * 0.75; context.fillStyle = colour(glyph); star(context, x, y, 3);
    }
  }
  const player = getJuProtagonist(); const x = player.x - cameraX; const y = player.y - cameraY;
  for (let rune = 0; rune < 12; rune++) {
    const angle = rune * Math.PI / 6 - elapsed / 1500;
    const rx = x + Math.cos(angle) * 48; const ry = y + Math.sin(angle) * 16;
    context.globalAlpha = strength * 0.8; context.strokeStyle = isJuCurseBeat(now) ? '#b688ff' : '#fff2aa'; context.lineWidth = 2;
    context.strokeRect(Math.round(rx - 3), Math.round(ry - 3), 6, 6);
    context.beginPath(); context.moveTo(rx - 4, ry - 5); context.lineTo(rx + 4, ry + 5); context.stroke();
  }
  context.restore();
}

export function drawJuWorld(context: CanvasRenderingContext2D, cameraX: number, cameraY: number, now: number, scaleX = 1, scaleY = 1): void {
  if (!isJuPowerActive(now)) return;
  const elapsed = juPowerElapsed(now); const strength = juVisualStrength(now); const cursed = isJuCurseBeat(now);
  const width = context.canvas.width / scaleX; const height = context.canvas.height / scaleY;
  const player = getJuProtagonist(); const shadow = getJuShadow();
  const px = player.x - cameraX; const py = player.y - cameraY;
  const sx = shadow.x - cameraX; const sy = shadow.y - cameraY;
  context.save(); context.scale(scaleX, scaleY);
  // The pursuer is a separate moving apparition, linked to the amulet by broken chains.
  context.globalAlpha = strength * (cursed ? 0.9 : 0.55); context.fillStyle = '#170c2b';
  context.beginPath(); context.moveTo(sx - 18, sy); context.lineTo(sx - 12, sy - 38); context.lineTo(sx, sy - 52); context.lineTo(sx + 12, sy - 38); context.lineTo(sx + 18, sy); context.lineTo(sx + 5, sy - 6); context.lineTo(sx, sy); context.lineTo(sx - 7, sy - 7); context.closePath(); context.fill();
  eye(context, sx, sy - 32, 10);
  const links = Math.max(3, Math.ceil(Math.hypot(px - sx, py - sy) / 9));
  for (let link = 0; link < links; link++) {
    const t = link / links; const x = sx + (px - sx) * t; const y = sy - 10 + (py - sy - 8) * t + Math.sin(t * Math.PI) * 14;
    context.strokeStyle = cursed ? '#d7b2ff' : '#745a9f'; context.lineWidth = 1; context.strokeRect(Math.round(x - 3), Math.round(y - 2), 6, 4);
  }
  // A luminous eye amulet swings on the protagonist's real chest.
  const pose = juCharacterPose('player', now); const ax = px + pose.x; const ay = py - pose.lift - 23;
  context.globalAlpha = strength * 0.22; context.fillStyle = '#a0ffdc'; context.beginPath(); context.ellipse(ax, ay, 27, 32, 0, 0, Math.PI * 2); context.fill();
  context.globalAlpha = strength; context.strokeStyle = '#ffe99c'; context.lineWidth = 2;
  context.beginPath(); context.moveTo(ax - 8, ay - 9); context.lineTo(ax, ay + 2); context.lineTo(ax + 8, ay - 9); context.stroke();
  context.fillStyle = '#b18b42'; context.fillRect(ax - 5, ay - 2, 11, 12); context.fillStyle = cursed ? '#b784ff' : '#7bfbd7'; context.fillRect(ax - 3, ay, 7, 8); eye(context, ax, ay + 4, 4);
  for (const [index, target] of getJuRevellers().entries()) {
    const pose = juCharacterPose(target.id, now); const x = target.x - cameraX + pose.x; const y = target.y - cameraY - pose.lift - target.height;
    if (x < -60 || y < -80 || x > width + 60 || y > height + 80) continue;
    context.globalAlpha = strength * 0.8; context.fillStyle = colour(index);
    star(context, x - 16, y - 8 + Math.sin(elapsed / 220 + index) * 5, 4);
    eye(context, x + 15, y - 12, 8);
  }
  // Confetti and circling eyes share the same sky, rather than appearing as a separate UI.
  for (let mote = 0; mote < 42; mote++) {
    const x = (mote * 91 + elapsed * (cursed ? -0.025 : 0.035) + width * 50) % width;
    const y = (mote * 67 + Math.sin(elapsed / 500 + mote) * 18 + height) % height;
    context.globalAlpha = strength * 0.6; context.fillStyle = colour(mote);
    if (mote % 7 === 0) eye(context, x, y, 10);
    else if (mote % 3 === 0) star(context, x, y, 3);
    else context.fillRect(Math.round(x), Math.round(y), 3, 6);
  }
  if (cursed) {
    // A local warning explains the temporary controls while keeping the inventory reveal for later.
    context.globalAlpha = strength; context.fillStyle = '#23112e'; context.fillRect(px - 46, py - 80, 92, 16);
    context.fillStyle = '#e3c2ff'; context.font = 'bold 9px monospace'; context.textAlign = 'center'; context.fillText('CURSE: REVERSED', px, py - 69);
  }
  context.restore();
}
