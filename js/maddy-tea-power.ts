const MADDY_TEA_DURATION = 10_000;
const WORLD_TIME_SCALE = 0.04;
const RELEASE_DURATION = 450;
let maddyTeaStartsAt = Infinity;
let maddyTeaEndsAt = 0;

export const MADDY_TEA_REVEAL = 'You drank Maddy’s tea. For 10 seconds, the world slowed almost to a standstill while you moved freely.';

export function activateMaddyTeaPower(now = performance.now()): void {
  maddyTeaStartsAt = now;
  maddyTeaEndsAt = now + MADDY_TEA_DURATION;
}

export function maddyTeaSecondsLeft(now = performance.now()): number {
  return Math.max(0, (maddyTeaEndsAt - now) / 1000);
}

export function maddyWorldDeltaTime(deltaTime: number, now: number): number {
  // Only slow the part of this frame that overlaps the power's real-time window.
  const overlap = Math.max(0, Math.min(now, maddyTeaEndsAt) - Math.max(now - deltaTime * 1000, maddyTeaStartsAt)) / 1000;
  return deltaTime - overlap * (1 - WORLD_TIME_SCALE);
}

export function drawMaddyTeaWorldOverlay(context: CanvasRenderingContext2D, now: number): void {
  if (now < maddyTeaStartsAt || now >= maddyTeaEndsAt) return;
  context.save();
  context.fillStyle = 'rgba(160, 83, 8, 0.28)';
  context.fillRect(0, 0, context.canvas.width, context.canvas.height);
  context.fillStyle = 'rgba(255, 216, 125, 0.18)';
  for (let index = 0; index < 45; index += 1) {
    const x = (index * 113 + 23) % context.canvas.width;
    const y = (index * 71 + 17 + (now - maddyTeaStartsAt) / 500) % context.canvas.height;
    context.fillRect(x, Math.round(y), 2, 2);
  }
  context.restore();
}

function drawPixelRing(context: CanvasRenderingContext2D, x: number, y: number, radius: number, squash = 1): void {
  for (let index = 0; index < 80; index += 1) {
    const angle = index * Math.PI / 40;
    context.fillRect(Math.round(x + Math.cos(angle) * radius), Math.round(y + Math.sin(angle) * radius * squash), 3, 3);
  }
}

export function drawMaddyTeaPower(
  context: CanvasRenderingContext2D,
  playerX: number,
  playerY: number,
  playerHeight: number,
  now = performance.now(),
): void {
  if (now < maddyTeaStartsAt || now >= maddyTeaEndsAt + RELEASE_DURATION) return;
  const elapsed = now - maddyTeaStartsAt;
  const released = now >= maddyTeaEndsAt;
  const pulse = released ? (now - maddyTeaEndsAt) / RELEASE_DURATION : elapsed / 650;
  context.save();
  context.imageSmoothingEnabled = false;
  if (pulse < 1) {
    context.globalAlpha = 1 - pulse;
    context.fillStyle = '#fff2b5';
    drawPixelRing(context, playerX, playerY - playerHeight / 2, 18 + pulse * Math.max(context.canvas.width, context.canvas.height));
    context.globalAlpha = 1;
  }
  if (released) {
    context.restore();
    return;
  }
  context.fillStyle = 'rgba(255, 212, 102, 0.7)';
  drawPixelRing(context, playerX, playerY - 2, 35, 0.35);
  for (let index = 0; index < 12; index += 1) {
    const angle = index * Math.PI / 6 - Math.PI / 2;
    context.fillRect(Math.round(playerX + Math.cos(angle) * 42), Math.round(playerY - 2 + Math.sin(angle) * 15), 3, 3);
  }
  // The cup and steam move on Max's clock rather than the world's clock.
  const cupX = Math.round(playerX + 8);
  const cupY = Math.round(playerY - playerHeight * 0.45);
  context.fillStyle = '#694023';
  context.fillRect(cupX - 1, cupY - 1, 15, 12);
  context.fillStyle = '#f4f0df';
  context.fillRect(cupX, cupY, 12, 9);
  context.fillRect(cupX + 12, cupY + 2, 4, 6);
  context.fillStyle = '#694023';
  context.fillRect(cupX + 12, cupY + 3, 2, 3);
  context.fillStyle = '#8a4c27';
  context.fillRect(cupX + 1, cupY + 1, 10, 2);
  for (let index = 0; index < 18; index += 1) {
    const life = (elapsed / 1300 + index / 18) % 1;
    const drift = Math.sin(life * 5 + index * 2) * (5 + life * 16);
    context.globalAlpha = (1 - life) * 0.85;
    context.fillStyle = '#fff4d4';
    context.fillRect(Math.round(cupX + 5 + drift), Math.round(cupY - life * 75), 3 + Math.floor(life * 4), 3);
  }
  context.restore();
}
