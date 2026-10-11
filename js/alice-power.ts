import type { SamPowerTarget } from './sam-power.js';

export const ALICE_POWER_DURATION = 10_000;
export const ALICE_MATCH_MULTIPLIER = 1.2;

export interface AliceSquadMember extends SamPowerTarget { readonly signedAt: number }
export interface AliceBallTrail { readonly x: number; readonly y: number; readonly time: number; readonly seed: number }

let startedAt = Infinity;
let hasOrigin = false;
let nextTrailAt = 0;
let trailSerial = 0;
const origin = { x: 0, y: 0 };
const protagonist = { x: 0, y: 0 };
const squad = new Map<string, AliceSquadMember>();
const trails: AliceBallTrail[] = [];

export const isAlicePowerActive = (now = performance.now()): boolean => now >= startedAt && now < startedAt + ALICE_POWER_DURATION;
export const alicePowerSecondsLeft = (now = performance.now()): number => isAlicePowerActive(now) ? (startedAt + ALICE_POWER_DURATION - now) / 1000 : 0;
export const alicePowerElapsed = (now: number): number => Math.max(0, now - startedAt);
export const aliceVisualStrength = (now: number): number => isAlicePowerActive(now) ? Math.min(1, alicePowerElapsed(now) / 260, alicePowerSecondsLeft(now) / 0.55) : 0;
export const aliceMovementMultiplier = (now = performance.now()): number => isAlicePowerActive(now) ? ALICE_MATCH_MULTIPLIER : 1;
export const getAliceOrigin = () => origin as Readonly<typeof origin>;
export const getAliceProtagonist = () => protagonist as Readonly<typeof protagonist>;
export const getAliceSquad = (): readonly AliceSquadMember[] => [...squad.values()];
export const getAliceBallTrails = (): readonly AliceBallTrail[] => trails;

export function activateAlicePower(now = performance.now()): boolean {
  if (isAlicePowerActive(now)) return false;
  startedAt = now; hasOrigin = false; nextTrailAt = now; trailSerial = 0;
  squad.clear(); trails.length = 0;
  return true;
}

export function aliceWorldDeltaTime(deltaTime: number, now: number): number {
  const overlap = Math.max(0, Math.min(now, startedAt + ALICE_POWER_DURATION) - Math.max(now - deltaTime * 1000, startedAt)) / 1000;
  return deltaTime + overlap * (ALICE_MATCH_MULTIPLIER - 1);
}

export function updateAliceWorld(now: number, x: number, y: number, targets: readonly SamPowerTarget[]): void {
  if (!isAlicePowerActive(now)) { squad.clear(); trails.length = 0; return; }
  protagonist.x = x; protagonist.y = y;
  if (!hasOrigin) { origin.x = x; origin.y = y; hasOrigin = true; }
  const present = new Set(targets.map((target) => target.id));
  for (const id of squad.keys()) if (!present.has(id)) squad.delete(id);
  const radius = Math.min(1800, 120 + alicePowerElapsed(now) * 0.42);
  for (const target of targets) {
    const previous = squad.get(target.id);
    if (previous || Math.hypot(target.x - origin.x, target.y - origin.y) <= radius) {
      squad.set(target.id, { ...target, signedAt: previous?.signedAt ?? now });
    }
  }
  if (now >= nextTrailAt) {
    trails.push({ x, y, time: now, seed: trailSerial++ });
    nextTrailAt = now + 115;
  }
  while (trails.length && now - trails[0]!.time > 1800) trails.shift();
}

export function aliceCharacterPose(id: string, now: number): { x: number; y: number; lean: number; scale: number } {
  const neutral = { x: 0, y: 0, lean: 0, scale: 1 };
  if (!isAlicePowerActive(now) || (id !== 'player' && !squad.has(id))) return neutral;
  const phase = (now - (squad.get(id)?.signedAt ?? startedAt)) * ALICE_MATCH_MULTIPLIER;
  const strength = aliceVisualStrength(now);
  return {
    x: Math.sin(phase / 95 + id.length) * (id === 'player' ? 3 : 5) * strength,
    y: -Math.abs(Math.sin(phase / 150 + id.length)) * (id === 'player' ? 5 : 8) * strength,
    lean: Math.sin(phase / 125 + id.length) * 0.11 * strength,
    scale: 1 + (id === 'player' ? 0.08 : 0.03) * strength,
  };
}

export function alicePowerReveal(): string {
  return "Alice's power: the world became Arsenal Football Club for ten seconds. The landscape warped into a floodlit pitch and stadium, the crowd invaded the horizon, goals and scoreboards appeared, nearby characters were signed into the squad, and footballs tore through the world. You became the red-and-white number 14, moved and animated 20% faster, and dragged a wake of match-day markings behind you. Full time restored the world and everyone in it; Alice's item was used up.";
}
