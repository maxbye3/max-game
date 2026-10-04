import type { SamPowerTarget } from './sam-power.js';

export const JULIAN_POWER_DURATION = 10_000;
export const JULIAN_DEMON_DELAY = 700;
export const JULIAN_DEMON_DURATION = 6_660;
let startedAt = Infinity;
let choice: 'answer' | 'execution' | null = null;
let verdict = '';
let victim: SamPowerTarget | null = null;
let verdictAt = Infinity;
let targets: readonly SamPowerTarget[] = [];
const summoner = { x: 0, y: 0 };

export function activateJulianPower(now = performance.now()): void {
  startedAt = now; choice = null; verdict = ''; victim = null; verdictAt = Infinity; targets = [];
}
export const isJulianPowerActive = (now = performance.now()): boolean => now >= startedAt && now < startedAt + JULIAN_POWER_DURATION;
export const julianElapsed = (now: number): number => Math.max(0, now - startedAt);
export const julianPowerSecondsLeft = (now = performance.now()): number => isJulianPowerActive(now) ? (startedAt + JULIAN_POWER_DURATION - now) / 1000 : 0;
export const isJulianDemonPresent = (now = performance.now()): boolean => isJulianPowerActive(now) && julianElapsed(now) >= JULIAN_DEMON_DELAY && julianElapsed(now) < JULIAN_DEMON_DELAY + JULIAN_DEMON_DURATION;
export const julianDemonSecondsLeft = (now: number): number => isJulianDemonPresent(now) ? (JULIAN_DEMON_DELAY + JULIAN_DEMON_DURATION - julianElapsed(now)) / 1000 : 0;
export const julianStrength = (now: number): number => isJulianPowerActive(now) ? Math.min(1, julianElapsed(now) / 500, julianPowerSecondsLeft(now) * 2) : 0;
export const julianMovementMultiplier = (now = performance.now()): number => isJulianPowerActive(now) ? 1.8 : 1;
export const julianTargetName = (id: string): string => id.split('-').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
export const getJulianSummoner = () => summoner as Readonly<typeof summoner>;
export const getJulianVictim = () => victim;
export const getJulianVerdict = () => verdict;
export const getJulianChoice = () => choice;
export const julianVerdictAge = (now: number): number => Math.max(0, now - verdictAt);
export const julianNearestTarget = (): SamPowerTarget | null => targets[0] ?? null;

/** Slow only the part of this frame inside the ten-second ritual. */
export function julianWorldDeltaTime(deltaTime: number, now: number): number {
  const overlap = Math.max(0, Math.min(now, startedAt + JULIAN_POWER_DURATION) - Math.max(now - deltaTime * 1000, startedAt)) / 1000;
  return Math.max(0, deltaTime - overlap * 0.92);
}

function oracleAnswer(): string {
  const nearest = julianNearestTarget();
  if (!nearest) return 'No other character is here. Leave this room and seek someone outside.';
  const dx = nearest.x - summoner.x; const dy = nearest.y - summoner.y;
  const distance = Math.round(Math.hypot(dx, dy));
  const compass = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'] as const;
  const direction = distance < 35 ? 'beside you' : compass[(Math.round(Math.atan2(dx, -dy) * 4 / Math.PI) + 8) % 8];
  return `${julianTargetName(nearest.id)} is ${direction}, ${distance} steps away. Follow the golden trail.`;
}

/** One bargain per summon; the two outcomes are mutually exclusive. */
export function chooseJulianBargain(kind: 'answer' | 'execution', now = performance.now()): boolean {
  if (!isJulianDemonPresent(now) || choice !== null) return false;
  const nearest = julianNearestTarget();
  if (kind === 'execution' && !nearest) return false;
  choice = kind; verdictAt = now;
  victim = kind === 'execution' ? { ...nearest! } : nearest ? { ...nearest } : null;
  verdict = kind === 'answer' ? oracleAnswer() : `${julianTargetName(nearest!.id)} has been executed in the duck realm. They return when the ritual ends.`;
  return true;
}

export function updateJulianWorld(now: number, x: number, y: number, candidates: readonly SamPowerTarget[]): void {
  if (!isJulianPowerActive(now)) { targets = []; return; }
  summoner.x = x; summoner.y = y;
  targets = candidates.filter((target) => target.id !== 'player').slice().sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y));
  // A missed choice still receives one useful answer as the demon departs.
  if (!choice && julianElapsed(now) >= JULIAN_DEMON_DELAY + JULIAN_DEMON_DURATION) {
    choice = 'answer'; verdictAt = now; victim = julianNearestTarget(); verdict = oracleAnswer();
  }
}

export const isJulianExecuted = (id: string, now = performance.now()): boolean => isJulianPowerActive(now) && choice === 'execution' && victim?.id === id;
export function julianPowerReveal(): string {
  return `Julian's power: the Rubber Duckie of Doom tore open a demonic realm for ten seconds. You levitated and moved faster while the world nearly stopped and nearby characters trembled. The demon stayed for exactly 6.66 seconds and granted one answer OR one execution. ${verdict || 'The summon ended without a bargain.'} The realm, altered movement and any execution vanished when the ritual ended.`;
}
