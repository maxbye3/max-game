import type { SamPowerTarget } from './sam-power.js';
import { samTargetId } from './sam-power.js';

export const OSCAR_POWER_DURATION = 10_000;
export const OSCAR_POWER_REVEAL = 'For 10 seconds, your hungry mouth swallowed nearby characters and left bite marks in the world. You moved faster with every chomp, then everything popped back.';

interface BiteMark {
  readonly x: number;
  readonly y: number;
  readonly at: number;
  readonly targetId: string | null;
  readonly size: number;
}

const SWALLOW_RADIUS = 76;
const CHOMP_INTERVAL = 520;
let powerStartsAt = Infinity;
let powerEndsAt = 0;
let nextChompAt = 0;
let chompCount = 0;
const swallowed = new Set<string>();
const biteMarks: BiteMark[] = [];

export function oscarCharacterId(name: string): string {
  return name.trim().toLowerCase() === 'marina d' ? 'marina' : samTargetId(name);
}

export function activateOscarPower(now = performance.now()): void {
  powerStartsAt = now;
  powerEndsAt = now + OSCAR_POWER_DURATION;
  nextChompAt = now;
  chompCount = 0;
  swallowed.clear();
  biteMarks.length = 0;
}

export function oscarPowerSecondsLeft(now = performance.now()): number {
  return Math.max(0, (powerEndsAt - now) / 1000);
}

export function isOscarPowerActive(now = performance.now()): boolean {
  return now >= powerStartsAt && now < powerEndsAt;
}

export function isOscarEaten(id: string, now = performance.now()): boolean {
  return isOscarPowerActive(now) && swallowed.has(id);
}

export function oscarMovementMultiplier(now = performance.now()): number {
  if (!isOscarPowerActive(now)) return 1;
  return 1.35 + Math.min(swallowed.size, 6) * 0.055;
}

export function updateOscarPower(
  now: number,
  playerX: number,
  playerY: number,
  targets: readonly SamPowerTarget[] = [],
): void {
  if (!isOscarPowerActive(now) || now < nextChompAt) return;
  nextChompAt = now + CHOMP_INTERVAL;

  let nearest: SamPowerTarget | null = null;
  let nearestDistance = SWALLOW_RADIUS;
  for (const target of targets) {
    if (swallowed.has(target.id)) continue;
    const distance = Math.hypot(target.x - playerX, target.y - playerY);
    if (distance < nearestDistance) {
      nearest = target;
      nearestDistance = distance;
    }
  }

  const phase = chompCount * 2.399963229728653;
  chompCount += 1;
  const mark: BiteMark = nearest
    ? { x: nearest.x, y: nearest.y - nearest.height * 0.45, at: now, targetId: nearest.id, size: 14 + (chompCount % 3) * 3 }
    : { x: playerX + Math.cos(phase) * 31, y: playerY - 7 + Math.sin(phase) * 13, at: now, targetId: null, size: 11 + (chompCount % 3) * 3 };
  if (nearest) swallowed.add(nearest.id);
  biteMarks.push(mark);
  if (biteMarks.length > 20) biteMarks.shift();
}

export function drawOscarWorldBites(
  context: CanvasRenderingContext2D,
  cameraX: number,
  cameraY: number,
  now = performance.now(),
): void {
  if (!isOscarPowerActive(now)) return;
  context.save();
  context.imageSmoothingEnabled = false;
  for (const [index, bite] of biteMarks.entries()) {
    const age = now - bite.at;
    if (age < 0 || age > OSCAR_POWER_DURATION) continue;
    const fade = Math.min(1, age / 90, (OSCAR_POWER_DURATION - age) / 250);
    const pulse = age < 320 ? Math.sin((age / 320) * Math.PI) * 4 : 0;
    const radius = bite.size + pulse;
    const x = Math.round(bite.x - cameraX);
    const y = Math.round(bite.y - cameraY);
    context.globalAlpha = Math.max(0, fade) * 0.88;
    context.fillStyle = '#211522';
    context.strokeStyle = '#ffbf65';
    context.lineWidth = 2;
    context.beginPath();
    for (let point = 0; point < 16; point += 1) {
      const angle = point * Math.PI / 8 + index * 0.27;
      const toothRadius = radius * (point % 2 === 0 ? 1 : 0.72);
      const px = x + Math.cos(angle) * toothRadius;
      const py = y + Math.sin(angle) * toothRadius * 0.72;
      if (point === 0) context.moveTo(px, py);
      else context.lineTo(px, py);
    }
    context.closePath();
    context.fill();
    context.stroke();
    context.fillStyle = '#fff2bd';
    for (let crumb = 0; crumb < 4; crumb += 1) {
      const angle = index * 1.7 + crumb * Math.PI / 2;
      const distance = radius + 5 + ((age / 50 + crumb * 3) % 8);
      context.fillRect(Math.round(x + Math.cos(angle) * distance), Math.round(y + Math.sin(angle) * distance), 3, 3);
    }
    if (age < 420) {
      context.globalAlpha = fade * (1 - age / 420);
      context.fillStyle = '#fff6d1';
      context.font = '8px "Press Start Game", monospace';
      context.textAlign = 'center';
      context.textBaseline = 'bottom';
      context.fillText(bite.targetId ? 'GULP!' : 'CHOMP!', x, y - radius - 5 - age * 0.025);
    }
  }
  context.restore();
}

export function drawOscarPower(
  context: CanvasRenderingContext2D,
  playerX: number,
  playerY: number,
  playerHeight: number,
  now = performance.now(),
  facesLeft = false,
): void {
  if (!isOscarPowerActive(now)) return;
  const elapsed = now - powerStartsAt;
  const remaining = oscarPowerSecondsLeft(now);
  const snap = (Math.sin(elapsed / 82) + 1) / 2;
  const x = Math.round(playerX);
  const y = Math.round(playerY - playerHeight * 0.6);
  const direction = facesLeft ? -1 : 1;

  context.save();
  context.imageSmoothingEnabled = false;
  context.globalAlpha = Math.min(1, elapsed / 180, remaining * 1.8);
  context.strokeStyle = '#ffad50';
  context.lineWidth = 3;
  context.beginPath();
  context.ellipse(x, playerY - 3, 24 + (elapsed % 760) / 760 * 40, 8 + snap * 4, 0, 0, Math.PI * 2);
  context.stroke();

  context.translate(x + direction * 10, y);
  context.scale(direction, 1);
  const jawGap = 3 + snap * 7;
  context.fillStyle = '#32101e';
  context.fillRect(-2, -9 - jawGap, 22, 19 + jawGap * 2);
  context.fillStyle = '#fa5d78';
  context.fillRect(-5, -12 - jawGap, 25, 5);
  context.fillRect(-5, 7 + jawGap, 25, 5);
  context.fillStyle = '#fff0c8';
  for (let tooth = 0; tooth < 5; tooth += 1) {
    const toothX = -1 + tooth * 4;
    context.fillRect(toothX, -7 - jawGap, 2, 4);
    context.fillRect(toothX, 4 + jawGap, 2, 4);
  }
  context.fillStyle = '#ffd278';
  for (let crumb = 0; crumb < 9; crumb += 1) {
    const angle = elapsed / 310 + crumb * Math.PI * 2 / 9;
    const radius = 30 + crumb % 3 * 8;
    context.fillRect(Math.round(Math.cos(angle) * radius), Math.round(y - playerY + Math.sin(angle) * radius * 0.55), 3, 3);
  }
  context.restore();
}
