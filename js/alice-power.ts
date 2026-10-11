import type { SamPowerTarget } from './sam-power.js';

export const ALICE_POWER_DURATION = 20_000;
const FLASH_RADIUS = 260;

let startedAt = Infinity;
let flashOrigin: { x: number; y: number } | null = null;
const blindedCharacters = new Set<string>();

export const isAlicePowerActive = (now = performance.now()): boolean =>
  now >= startedAt && now < startedAt + ALICE_POWER_DURATION;

export const alicePowerSecondsLeft = (now = performance.now()): number =>
  isAlicePowerActive(now) ? (startedAt + ALICE_POWER_DURATION - now) / 1000 : 0;

export const alicePowerElapsed = (now: number): number => Math.max(0, now - startedAt);

export const aliceVisualStrength = (now: number): number =>
  isAlicePowerActive(now) ? 0.25 + 0.75 * (1 - alicePowerElapsed(now) / ALICE_POWER_DURATION) : 0;

export const aliceMovementMultiplier = (): number => 1;

export const isAliceCharacterBlinded = (id: string): boolean => blindedCharacters.has(id);

export function activateAlicePower(now = performance.now()): boolean {
  if (isAlicePowerActive(now)) return false;
  startedAt = now;
  flashOrigin = null;
  blindedCharacters.clear();
  return true;
}

export function aliceWorldDeltaTime(deltaTime: number, _now?: number): number {
  return deltaTime;
}

export function updateAliceWorld(
  now: number,
  x: number,
  y: number,
  targets: readonly SamPowerTarget[],
): void {
  if (!isAlicePowerActive(now)) {
    flashOrigin = null;
    blindedCharacters.clear();
    return;
  }

  // The flash affects the people who were beside the protagonist when it fired.
  if (flashOrigin) return;
  flashOrigin = { x, y };
  blindedCharacters.add('player');
  for (const target of targets) {
    if (Math.hypot(target.x - x, target.y - y) <= FLASH_RADIUS) {
      blindedCharacters.add(target.id);
    }
  }
}

export function aliceCharacterPose(
  id: string,
  now: number,
): { x: number; y: number; lean: number; scale: number } {
  if (!isAlicePowerActive(now) || !isAliceCharacterBlinded(id)) {
    return { x: 0, y: 0, lean: 0, scale: 1 };
  }
  const elapsed = alicePowerElapsed(now);
  const strength = aliceVisualStrength(now);
  return {
    x: Math.sin(elapsed / 47 + id.length) * 2.5 * strength,
    y: -Math.abs(Math.sin(elapsed / 75 + id.length)) * 2 * strength,
    lean: Math.sin(elapsed / 59 + id.length) * 0.035 * strength,
    scale: 1,
  };
}

export function alicePowerReveal(): string {
  return "Alice's camera flash blinded you and everyone nearby for twenty seconds. The afterimage slowly faded, and your vision returned.";
}
