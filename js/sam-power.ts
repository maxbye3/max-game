export const SAM_POWER_DURATION = 13_000;

const PINCH_RADIUS = 76;
const PINCH_CHECK_INTERVAL = 90;
const REPEAT_PINCH_DELAY = 820;
const RECOIL_DURATION = 520;
const EFFECT_DURATION = 760;

export interface SamPowerTarget {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly height: number;
}

interface PinchEffect extends SamPowerTarget {
  readonly pinchedAt: number;
  readonly directionX: number;
  readonly directionY: number;
  readonly variant: number;
}

let powerStartsAt = Infinity;
let powerEndsAt = 0;
let nextPinchCheckAt = 0;
let lastImpactAt = -Infinity;
const lastPinchedAt = new Map<string, number>();
const pinchEffects = new Map<string, PinchEffect>();

export function samTargetId(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function activateSamPower(now = performance.now()): void {
  powerStartsAt = now;
  powerEndsAt = now + SAM_POWER_DURATION;
  nextPinchCheckAt = now;
  lastImpactAt = -Infinity;
  lastPinchedAt.clear();
  pinchEffects.clear();
}

export function samPowerSecondsLeft(now = performance.now()): number {
  return Math.max(0, (powerEndsAt - now) / 1000);
}

export function isSamPowerActive(now = performance.now()): boolean {
  return now >= powerStartsAt && now < powerEndsAt;
}

export function samMovementMultiplier(now = performance.now()): number {
  return isSamPowerActive(now) ? 1.28 : 1;
}

export function updateSamPower(
  now: number,
  playerX: number,
  playerY: number,
  targets: readonly SamPowerTarget[],
): void {
  for (const [id, effect] of pinchEffects) {
    if (now - effect.pinchedAt >= EFFECT_DURATION) pinchEffects.delete(id);
  }
  if (!isSamPowerActive(now) || now < nextPinchCheckAt) return;
  nextPinchCheckAt = now + PINCH_CHECK_INTERVAL;

  for (const target of targets) {
    const dx = target.x - playerX;
    const dy = target.y - playerY;
    const distance = Math.hypot(dx, dy);
    if (distance > PINCH_RADIUS || now - (lastPinchedAt.get(target.id) ?? -Infinity) < REPEAT_PINCH_DELAY) continue;

    const directionX = distance > 0 ? dx / distance : (target.id.length % 2 === 0 ? -1 : 1);
    const directionY = distance > 0 ? dy / distance : -0.25;
    lastPinchedAt.set(target.id, now);
    pinchEffects.set(target.id, {
      ...target,
      pinchedAt: now,
      directionX,
      directionY,
      variant: target.id.length % 4,
    });
    lastImpactAt = now;
  }
}

export function isSamTargetRecoiling(id: string, now = performance.now()): boolean {
  const effect = pinchEffects.get(id);
  return effect !== undefined && now - effect.pinchedAt < RECOIL_DURATION;
}

export function samVictimOffset(id: string, now = performance.now()): { readonly x: number; readonly y: number } {
  const effect = pinchEffects.get(id);
  if (!effect) return { x: 0, y: 0 };
  const progress = Math.min(1, Math.max(0, (now - effect.pinchedAt) / RECOIL_DURATION));
  const kick = Math.sin(progress * Math.PI) * 15;
  const jitter = progress < 0.55 ? Math.sin(progress * Math.PI * 12) * 2 : 0;
  return {
    x: effect.directionX * kick + jitter,
    y: effect.directionY * kick - Math.sin(progress * Math.PI) * 5,
  };
}

export function samCameraJolt(now: number): { readonly x: number; readonly y: number } {
  const elapsed = now - lastImpactAt;
  if (elapsed < 0 || elapsed >= 180) return { x: 0, y: 0 };
  const strength = (1 - elapsed / 180) * 3;
  return {
    x: Math.round(Math.sin(elapsed * 0.17) * strength),
    y: Math.round(Math.cos(elapsed * 0.23) * strength),
  };
}

function drawClaw(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  direction: number,
  scale: number,
): void {
  context.save();
  context.translate(Math.round(x), Math.round(y));
  context.scale(direction * scale, scale);
  context.fillStyle = '#e34f3f';
  context.fillRect(-3, -5, 11, 10);
  context.fillRect(4, -11, 8, 8);
  context.fillRect(4, 3, 8, 8);
  context.fillStyle = '#ff8870';
  context.fillRect(-1, -3, 7, 4);
  context.fillRect(6, -9, 4, 4);
  context.fillRect(6, 5, 4, 4);
  context.fillStyle = '#7d1e28';
  context.fillRect(11, -9, 3, 6);
  context.fillRect(11, 3, 3, 6);
  context.restore();
}

export function drawSamWorldOverlay(context: CanvasRenderingContext2D, now: number): void {
  if (!isSamPowerActive(now)) return;
  const elapsed = now - powerStartsAt;
  context.save();
  context.fillStyle = 'rgba(230, 68, 52, 0.08)';
  context.fillRect(0, 0, context.canvas.width, context.canvas.height);
  for (let index = 0; index < 30; index += 1) {
    const x = (index * 97 + 31) % context.canvas.width;
    const y = context.canvas.height - ((elapsed * (0.025 + index % 3 * 0.008) + index * 67) % (context.canvas.height + 30));
    const size = 2 + index % 4;
    context.globalAlpha = 0.2 + (index % 5) * 0.08;
    context.strokeStyle = index % 2 === 0 ? '#ffd6c9' : '#83e6e8';
    context.lineWidth = 2;
    context.strokeRect(Math.round(x), Math.round(y), size, size);
  }
  context.restore();
}

export function drawSamVictimEffects(
  context: CanvasRenderingContext2D,
  cameraX: number,
  cameraY: number,
  now: number,
): void {
  context.save();
  context.imageSmoothingEnabled = false;
  context.textAlign = 'center';
  context.textBaseline = 'bottom';
  context.font = '8px "Press Start Game", monospace';
  for (const effect of pinchEffects.values()) {
    const elapsed = now - effect.pinchedAt;
    if (elapsed < 0 || elapsed >= EFFECT_DURATION) continue;
    const progress = elapsed / EFFECT_DURATION;
    const offset = samVictimOffset(effect.id, now);
    const x = effect.x - cameraX + offset.x;
    const y = effect.y - cameraY - effect.height * 0.55 + offset.y;
    const snap = Math.sin(Math.min(1, progress * 2.6) * Math.PI);

    context.globalAlpha = Math.min(1, (1 - progress) * 1.7);
    drawClaw(context, x - 18 - snap * 9, y, 1, 0.75);
    drawClaw(context, x + 18 + snap * 9, y, -1, 0.75);
    context.fillStyle = effect.variant % 2 === 0 ? '#fff1a8' : '#ffffff';
    for (let ray = 0; ray < 8; ray += 1) {
      const angle = ray * Math.PI / 4;
      const radius = 14 + snap * 13;
      context.fillRect(
        Math.round(x + Math.cos(angle) * radius),
        Math.round(y + Math.sin(angle) * radius),
        3,
        3,
      );
    }
    context.fillStyle = '#fff8dc';
    context.fillText(effect.variant < 2 ? 'SNIP!' : 'OW!', Math.round(x), Math.round(y - 25 - snap * 6));
  }
  context.restore();
}

export function drawSamPower(
  context: CanvasRenderingContext2D,
  playerX: number,
  playerY: number,
  playerHeight: number,
  now: number,
): void {
  if (!isSamPowerActive(now)) return;
  const elapsed = now - powerStartsAt;
  const snap = (Math.sin(elapsed / 75) + 1) / 2;
  const pulse = (elapsed % 700) / 700;
  context.save();
  context.imageSmoothingEnabled = false;
  context.globalAlpha = (1 - pulse) * 0.5;
  context.strokeStyle = '#ff8c78';
  context.lineWidth = 3;
  context.beginPath();
  context.ellipse(playerX, playerY - 5, 26 + pulse * PINCH_RADIUS, 9 + pulse * 22, 0, 0, Math.PI * 2);
  context.stroke();
  context.globalAlpha = 1;
  drawClaw(context, playerX - 18 - snap * 7, playerY - playerHeight * 0.48, 1, 1);
  drawClaw(context, playerX + 18 + snap * 7, playerY - playerHeight * 0.48, -1, 1);

  context.fillStyle = '#ffdfc8';
  for (let index = 0; index < 10; index += 1) {
    const angle = elapsed / 420 + index * Math.PI / 5;
    const radius = 30 + (index % 2) * 8;
    context.fillRect(
      Math.round(playerX + Math.cos(angle) * radius),
      Math.round(playerY - playerHeight * 0.45 + Math.sin(angle) * radius * 0.45),
      2,
      2,
    );
  }
  context.restore();
}
