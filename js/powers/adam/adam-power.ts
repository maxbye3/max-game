const POWER_START_KEY = 'max-game:adam-power-start';
const POWER_DURATION = 10_000;
const LEAP_PERIOD = 1_650;
const LEAP_DURATION = 820;
const LEAP_HEIGHT = 58;

let fallbackStart = 0;
let manualLeapAt = -Infinity;
let leapButton: HTMLButtonElement | null = null;

export const ADAM_POWER_REVEAL = 'Adam’s item made you taller and stronger through the legs. For 10 seconds, each leap rose twice as high.';

function powerStart(): number {
  try { return Number(window.sessionStorage.getItem(POWER_START_KEY)) || fallbackStart; }
  catch { return fallbackStart; }
}

export function activateAdamPower(now = Date.now()): void {
  fallbackStart = now;
  manualLeapAt = now;
  try { window.sessionStorage.setItem(POWER_START_KEY, String(now)); }
  catch { /* The current page still gets the effect. */ }
  updateAdamLeapControl(now);
}

export function adamPowerSecondsLeft(now = Date.now()): number {
  const start = powerStart();
  return start > 0 ? Math.max(0, (start + POWER_DURATION - now) / 1000) : 0;
}

export function adamJumpOffset(now = Date.now()): number {
  if (adamPowerSecondsLeft(now) === 0) return 0;
  const start = powerStart();
  const scheduledLeapAt = start + Math.floor((now - start) / LEAP_PERIOD) * LEAP_PERIOD;
  const elapsed = now - Math.max(scheduledLeapAt, manualLeapAt);
  return elapsed >= 0 && elapsed < LEAP_DURATION
    ? Math.sin(Math.PI * elapsed / LEAP_DURATION) * LEAP_HEIGHT
    : 0;
}

export function adamAirStrideMultiplier(now = Date.now()): number {
  return 1 + 0.45 * adamJumpOffset(now) / LEAP_HEIGHT;
}

export function requestAdamLeap(now = Date.now()): void {
  if (adamPowerSecondsLeft(now) === 0 || now - manualLeapAt < 280) return;
  manualLeapAt = now;
}

export function setupAdamLeapControl(): void {
  if (leapButton) return;
  const shell = document.querySelector<HTMLElement>('.game-shell');
  if (!shell) return;
  leapButton = document.createElement('button');
  leapButton.type = 'button';
  leapButton.className = 'adam-leap-button';
  leapButton.textContent = 'Leap';
  leapButton.setAttribute('aria-label', 'Leap while Adam’s power is active');
  leapButton.hidden = true;
  leapButton.addEventListener('click', () => requestAdamLeap());
  shell.append(leapButton);
  window.addEventListener('keydown', (event) => {
    if (event.code !== 'KeyJ' || event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.target instanceof HTMLElement && event.target.closest('button, input, textarea, [contenteditable="true"]')) return;
    requestAdamLeap();
  });
  updateAdamLeapControl();
}

export function updateAdamLeapControl(now = Date.now()): void {
  const hidden = adamPowerSecondsLeft(now) === 0;
  if (leapButton && leapButton.hidden !== hidden) leapButton.hidden = hidden;
}

export function drawAdamShadow(context: CanvasRenderingContext2D, x: number, y: number, now = Date.now()): void {
  if (adamPowerSecondsLeft(now) === 0) return;
  const lift = adamJumpOffset(now);
  context.save();
  context.imageSmoothingEnabled = false;
  context.globalAlpha = 0.45 - lift / 220;
  context.fillStyle = '#162421';
  context.beginPath();
  context.ellipse(Math.round(x), Math.round(y - 2), 21 + lift / 4, 6 + lift / 14, 0, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

export function drawAdamPower(context: CanvasRenderingContext2D, x: number, y: number, frameHeight: number, sealMode = false, now = Date.now()): void {
  if (adamPowerSecondsLeft(now) === 0) return;
  const lift = adamJumpOffset(now);
  const feetY = y - lift;
  context.save();
  context.imageSmoothingEnabled = false;
  if (!sealMode) {
    // Extend both trouser legs in the same chunky palette as the sprite.
    context.fillStyle = '#25214f';
    context.fillRect(Math.round(x - 13), Math.round(feetY - 17), 10, 10);
    context.fillRect(Math.round(x + 3), Math.round(feetY - 17), 10, 10);
    context.fillStyle = '#44429e';
    context.fillRect(Math.round(x - 11), Math.round(feetY - 16), 7, 7);
    context.fillRect(Math.round(x + 4), Math.round(feetY - 16), 7, 7);
  }
  const pulse = (now / 120) % 1;
  context.globalAlpha = (1 - pulse) * 0.75;
  context.fillStyle = '#b5f9ff';
  for (let i = 0; i < 22; i += 1) {
    const angle = i * Math.PI / 11;
    const radius = 22 + pulse * 28;
    context.fillRect(Math.round(x + Math.cos(angle) * radius), Math.round(y - 3 + Math.sin(angle) * radius * 0.32), 3, 3);
  }
  if (lift > 2) {
    context.globalAlpha = Math.min(1, lift / 25);
    context.fillStyle = '#d7ffff';
    for (let i = 0; i < 8; i += 1) {
      const drift = (now / 40 + i * 19) % 28;
      context.fillRect(Math.round(x - 18 + i * 5), Math.round(feetY + frameHeight * 0.15 + drift), 2, 4);
    }
  }
  context.restore();
}
