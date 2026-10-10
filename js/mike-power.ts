import type { SamPowerTarget } from './sam-power.js';

export const MIKE_POWER_DURATION = 10_000;
export const MIKE_HAPPINESS_MULTIPLIER = 1.36;
export const MIKE_POWER_REVEAL = "Mike's power: you ate his cookie and became 36% happier for ten seconds. Your movement became 36% faster, your steps grew a temporary flower garden, and expanding waves of joy swept through the actual landscape. The world brightened beneath a huge rainbow and a smiling sun; nearby characters bounced, laughed and danced. Reached pursuers stopped chasing for a moment of cookie-fuelled joy. The sunshine, flowers, butterflies and dancing disappeared when the power ended, and your movement returned to normal.";
export interface MikeJoyGuest extends SamPowerTarget { readonly reachedAt: number }
export interface MikeJoyTrail { readonly x: number; readonly y: number; readonly time: number; readonly seed: number }
let startedAt = Infinity;
let nextTrailAt = 0;
let lastTrailPosition: { x: number; y: number } | null = null;
let hasOrigin = false;
let trailSerial = 0;
const origin = { x: 0, y: 0 };
const protagonist = { x: 0, y: 0 };
const guests = new Map<string, MikeJoyGuest>();
const trails: MikeJoyTrail[] = [];

export function activateMikePower(now = performance.now()): void {
  startedAt = now; nextTrailAt = now; lastTrailPosition = null; hasOrigin = false; trailSerial = 0;
  guests.clear(); trails.length = 0;
}
export const isMikePowerActive = (now = performance.now()): boolean => now >= startedAt && now < startedAt + MIKE_POWER_DURATION;
export const mikePowerSecondsLeft = (now = performance.now()): number => isMikePowerActive(now) ? (startedAt + MIKE_POWER_DURATION - now) / 1000 : 0;
export const mikePowerElapsed = (now: number): number => Math.max(0, now - startedAt);
export const mikeHappinessMultiplier = (now = performance.now()): number => isMikePowerActive(now) ? MIKE_HAPPINESS_MULTIPLIER : 1;
export const mikeMovementMultiplier = mikeHappinessMultiplier;
export const mikeVisualStrength = (now: number): number => isMikePowerActive(now) ? Math.min(1, mikePowerElapsed(now) / 300, mikePowerSecondsLeft(now) / 0.7) : 0;
export const mikeJoyRadius = (now: number): number => Math.min(1600, mikePowerElapsed(now) * 0.4);
export const isMikeTargetHappy = (id: string, now = performance.now()): boolean => isMikePowerActive(now) && guests.has(id);
export const getMikeOrigin = () => origin as Readonly<typeof origin>;
export const getMikeProtagonist = () => protagonist as Readonly<typeof protagonist>;
export const getMikeJoyGuests = (): readonly MikeJoyGuest[] => [...guests.values()];
export const getMikeJoyTrails = (): readonly MikeJoyTrail[] => trails;

/** Apply the same 36% lift to scenery time; delayed frames respect both real-time boundaries. */
export function mikeWorldDeltaTime(deltaTime: number, now: number): number {
  const overlap = Math.max(0, Math.min(now, startedAt + MIKE_POWER_DURATION) - Math.max(now - deltaTime * 1000, startedAt)) / 1000;
  return deltaTime + overlap * (MIKE_HAPPINESS_MULTIPLIER - 1);
}

export function updateMikeWorld(now: number, x: number, y: number, targets: readonly SamPowerTarget[]): void {
  if (!isMikePowerActive(now)) { guests.clear(); trails.length = 0; lastTrailPosition = null; return; }
  protagonist.x = x; protagonist.y = y;
  if (!hasOrigin) { origin.x = x; origin.y = y; hasOrigin = true; }
  const present = new Set(targets.map((target) => target.id));
  for (const id of guests.keys()) if (!present.has(id)) guests.delete(id);
  for (const target of targets) {
    const previous = guests.get(target.id);
    if (previous || Math.hypot(target.x - origin.x, target.y - origin.y) <= mikeJoyRadius(now)) {
      guests.set(target.id, { ...target, reachedAt: previous?.reachedAt ?? now });
    }
  }
  const moved = lastTrailPosition !== null && Math.hypot(x - lastTrailPosition.x, y - lastTrailPosition.y) >= 14;
  if ((moved && now >= nextTrailAt) || !lastTrailPosition || now >= nextTrailAt + 350) {
    trails.push({ x, y, time: now, seed: trailSerial++ });
    lastTrailPosition = { x, y }; nextTrailAt = now + 90;
  }
  while (trails.length && now - trails[0]!.time >= 2600) trails.shift();
}

export function mikeCharacterPose(id: string, now: number): { x: number; y: number; lean: number; scale: number } {
  const neutral = { x: 0, y: 0, lean: 0, scale: 1 };
  if (!isMikePowerActive(now)) return neutral;
  const strength = mikeVisualStrength(now);
  const guest = guests.get(id);
  if (id !== 'player' && !guest) return neutral;
  const phase = (now - (guest?.reachedAt ?? startedAt)) * MIKE_HAPPINESS_MULTIPLIER;
  const hop = Math.abs(Math.sin(phase / 190 + id.length));
  return {
    x: id === 'player' ? 0 : Math.sin(phase / 180 + id.length) * 7 * strength,
    y: -hop * (id === 'player' ? 6 : 10) * strength,
    lean: Math.sin(phase / 240 + id.length) * (id === 'player' ? 0.055 : 0.14) * strength,
    scale: id === 'player' ? 1 + 0.07 * strength : 1,
  };
}
