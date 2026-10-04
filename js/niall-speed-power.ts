const SPEED_END_KEY = 'max-game:niall-speed-end';
const SPEED_MULTIPLIER_KEY = 'max-game:niall-speed-multiplier';
let fallbackEnd = 0;
let fallbackMultiplier = 1;

export function activateNiallSpeed(charged: boolean, now = Date.now()): void {
  fallbackEnd = now + (charged ? 20_000 : 10_000);
  fallbackMultiplier = charged ? 1.4 : 1.2;
  try {
    window.sessionStorage.setItem(SPEED_END_KEY, String(fallbackEnd));
    window.sessionStorage.setItem(SPEED_MULTIPLIER_KEY, String(fallbackMultiplier));
  } catch { /* The current page still gets the speed effect. */ }
}

export function niallSpeedSecondsLeft(now = Date.now()): number {
  let end = fallbackEnd;
  try { end = Math.max(end, Number(window.sessionStorage.getItem(SPEED_END_KEY)) || 0); }
  catch { /* Use the current page's timer. */ }
  return Math.max(0, (end - now) / 1000);
}

export function niallSpeedMultiplier(now = Date.now()): number {
  if (niallSpeedSecondsLeft(now) === 0) return 1;
  try { return Number(window.sessionStorage.getItem(SPEED_MULTIPLIER_KEY)) || fallbackMultiplier; }
  catch { return fallbackMultiplier; }
}
