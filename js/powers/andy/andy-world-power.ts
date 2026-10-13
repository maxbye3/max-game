import { andyPowerElapsed, andyPowerSecondsLeft, isAndyPowerActive } from './andy-power.js';

interface AndyTarget {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly height: number;
}

const EDITOR_MARKS = ['REVISED!', '1265', '817', 'was → were', 'PROOFREAD!', 'CASHEWS!'];
let nearbyTargets: readonly AndyTarget[] = [];

export function updateAndyWorld(now: number, playerX: number, playerY: number, targets: readonly AndyTarget[]): void {
  nearbyTargets = isAndyPowerActive(now)
    ? targets.filter((target) => Math.hypot(target.x - playerX, target.y - playerY) < 200).slice(0, 12)
    : [];
}

function drawCashew(context: CanvasRenderingContext2D, x: number, y: number, angle: number): void {
  context.save();
  context.translate(Math.round(x), Math.round(y));
  context.rotate(angle);
  context.fillStyle = '#743f22';
  context.fillRect(-4, -6, 7, 3);
  context.fillRect(-6, -3, 4, 7);
  context.fillRect(-4, 4, 7, 3);
  context.fillStyle = '#f9cb78';
  context.fillRect(-3, -5, 6, 2);
  context.fillRect(-5, -3, 3, 7);
  context.fillRect(-3, 4, 6, 2);
  context.restore();
}

/** Rewrite the view as an illuminated manuscript without modifying map or collision data. */
export function drawAndyWorld(context: CanvasRenderingContext2D, cameraX: number, cameraY: number, now: number, scaleX = 1, scaleY = 1): void {
  if (!isAndyPowerActive(now)) return;
  const elapsed = andyPowerElapsed(now);
  const strength = Math.min(1, elapsed / 220, andyPowerSecondsLeft(now) * 2);
  const { width, height } = context.canvas;
  context.save();
  context.globalAlpha = strength;
  context.globalCompositeOperation = 'color';
  context.fillStyle = '#c59448';
  context.fillRect(0, 0, width, height);
  context.globalCompositeOperation = 'source-over';
  context.fillStyle = 'rgba(253, 225, 157, 0.17)';
  context.fillRect(0, 0, width, height);
  context.strokeStyle = 'rgba(96, 48, 31, 0.22)';
  context.lineWidth = 1;
  for (let y = -cameraY % 28; y < height; y += 28) {
    context.beginPath(); context.moveTo(0, y); context.lineTo(width, y); context.stroke();
  }
  context.strokeStyle = '#9b2635';
  context.lineWidth = 3;
  context.strokeRect(7, 7, width - 14, height - 14);
  context.strokeStyle = '#e9b957';
  context.strokeRect(12, 12, width - 24, height - 24);
  for (let index = 0; index < 28; index += 1) {
    const x = (index * 83 + Math.sin(elapsed / 530 + index) * 24 + width) % width;
    const y = (index * 67 + elapsed * (0.027 + index % 3 * 0.009)) % height;
    context.globalAlpha = strength * 0.72;
    if (index % 3 === 0) drawCashew(context, x, y, elapsed / 650 + index);
    else {
      context.fillStyle = index % 2 ? '#a42639' : '#614223';
      context.font = 'bold 13px monospace';
      context.fillText(['¶', '!', 'Æ', '?', '§'][index % 5] ?? '!', x, y);
    }
  }
  context.scale(scaleX, scaleY);
  context.font = 'bold 8px monospace';
  context.textAlign = 'center';
  for (const [index, target] of nearbyTargets.entries()) {
    const x = target.x - cameraX;
    const y = target.y - cameraY - target.height - 14;
    const label = EDITOR_MARKS[(index + Math.floor(elapsed / 850)) % EDITOR_MARKS.length] ?? 'REVISED!';
    const stampWidth = label.length * 5 + 10;
    context.globalAlpha = strength * 0.9;
    context.fillStyle = '#fff0bd';
    context.fillRect(x - stampWidth / 2, y - 10, stampWidth, 15);
    context.strokeStyle = '#b8293d'; context.lineWidth = 1;
    context.strokeRect(x - stampWidth / 2, y - 10, stampWidth, 15);
    context.fillStyle = '#a21e34';
    context.fillText(label, x, y + 1);
    context.beginPath(); context.ellipse(x, target.y - cameraY, 23, 8, 0, 0, Math.PI * 2); context.stroke();
  }
  context.restore();
}

export function drawAndyPlayer(context: CanvasRenderingContext2D, x: number, y: number, playerHeight: number, now: number): void {
  if (!isAndyPowerActive(now)) return;
  const elapsed = andyPowerElapsed(now);
  const strength = Math.min(1, elapsed / 170, andyPowerSecondsLeft(now) * 2);
  context.save();
  context.globalAlpha = strength;
  context.translate(Math.round(x), Math.round(y));
  context.strokeStyle = '#d72e4f'; context.lineWidth = 2;
  const pulse = elapsed % 900 / 900;
  context.globalAlpha = strength * (1 - pulse);
  context.beginPath(); context.ellipse(0, -playerHeight / 2, 15 + pulse * 150, 8 + pulse * 60, 0, 0, Math.PI * 2); context.stroke();
  context.globalAlpha = strength;
  // Scholar's cape and mortarboard, anchored to the sprite's head and shoulders.
  context.fillStyle = '#722c55';
  context.fillRect(-14, -playerHeight * 0.63, 5, playerHeight * 0.54);
  context.fillRect(9, -playerHeight * 0.63, 5, playerHeight * 0.54);
  context.fillStyle = '#281b35';
  context.fillRect(-14, -playerHeight + 1, 28, 5);
  context.fillRect(-8, -playerHeight + 5, 16, 5);
  context.fillStyle = '#f8d475';
  context.fillRect(12, -playerHeight + 5, 2, 12);
  context.fillRect(10, -playerHeight + 15, 6, 3);
  context.save();
  context.translate(19, -playerHeight * 0.5);
  context.rotate(-0.5 + Math.sin(elapsed / 110) * 0.22);
  context.fillStyle = '#fff5d6';
  for (let feather = 0; feather < 7; feather += 1) context.fillRect(-6 + feather, -26 + feather * 3, 12 - feather, 3);
  context.fillStyle = '#b32a3e'; context.fillRect(0, -13, 2, 23);
  context.restore();
  for (let index = 0; index < 8; index += 1) {
    const angle = elapsed / 350 + index * Math.PI / 4;
    drawCashew(context, Math.cos(angle) * 34, -playerHeight / 2 + Math.sin(angle) * 22, angle);
  }
  context.fillStyle = '#a6243a'; context.font = 'bold 10px monospace'; context.textAlign = 'center';
  context.fillText(EDITOR_MARKS[Math.floor(elapsed / 850) % EDITOR_MARKS.length] ?? 'REVISED!', 0, -playerHeight - 12);
  context.restore();
}
