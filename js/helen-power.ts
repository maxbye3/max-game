export const HELEN_POWER_DURATION = 10_000;
export const HELEN_POWER_REVEAL = "Helen's power: you became 50% wider and moved 50% slower for ten seconds. Your heavy steps sent elastic pressure waves through the landscape: the scenery buckled into broad ripples, nearby characters widened as the waves reached them, and the world's movement slowed too. When the effect ended, your shape, speed and the world returned to normal.";

export interface HelenTarget { readonly id: string; readonly x: number; readonly y: number; readonly height: number }
interface HelenNeighbour extends HelenTarget { readonly reachedAt: number }
interface PressureWave { readonly x: number; readonly y: number; readonly time: number }
interface HeavyStep extends PressureWave { readonly side: number }
let startedAt = Infinity;
let endsAt = 0;
let lastWaveAt = -Infinity;
let lastStepAt = -Infinity;
let lastPosition: { x: number; y: number } | null = null;
let stepNumber = 0;
const neighbours = new Map<string, HelenNeighbour>();
const waves: PressureWave[] = [];
const steps: HeavyStep[] = [];
const protagonist = { x: 0, y: 0, moving: false };

export function activateHelenPower(now = performance.now()): void {
  startedAt = now;
  endsAt = now + HELEN_POWER_DURATION;
  lastWaveAt = -Infinity;
  lastStepAt = -Infinity;
  lastPosition = null;
  stepNumber = 0;
  neighbours.clear();
  waves.length = 0;
  steps.length = 0;
  protagonist.moving = false;
}

export const isHelenPowerActive = (now = performance.now()): boolean => now >= startedAt && now < endsAt;
export const helenPowerSecondsLeft = (now = performance.now()): number => isHelenPowerActive(now) ? (endsAt - now) / 1000 : 0;
export const helenPowerElapsed = (now: number): number => Math.max(0, now - startedAt);
export const helenMovementMultiplier = (now = performance.now()): number => isHelenPowerActive(now) ? 0.5 : 1;
export const helenVisualStrength = (now: number): number => isHelenPowerActive(now) ? Math.min(1, helenPowerElapsed(now) / 220, helenPowerSecondsLeft(now) * 3) : 0;

/** Slow only the part of this frame inside the real ten-second interval. */
export function helenWorldDeltaTime(deltaTime: number, now: number): number {
  const overlap = Math.max(0, Math.min(now, endsAt) - Math.max(now - deltaTime * 1000, startedAt)) / 1000;
  return deltaTime - overlap * 0.5;
}

export function updateHelenWorld(now: number, x: number, y: number, targets: readonly HelenTarget[]): void {
  if (!isHelenPowerActive(now)) {
    neighbours.clear(); waves.length = 0; steps.length = 0; lastPosition = null; protagonist.moving = false;
    return;
  }
  protagonist.x = x; protagonist.y = y;
  protagonist.moving = lastPosition !== null && Math.hypot(x - lastPosition.x, y - lastPosition.y) > 0.01;
  lastPosition = { x, y };
  if (now - lastWaveAt >= 950) { waves.push({ x, y, time: now }); lastWaveAt = now; }
  if (protagonist.moving && now - lastStepAt >= 310) {
    steps.push({ x, y, time: now, side: stepNumber++ % 2 ? 1 : -1 });
    lastStepAt = now;
  }
  while (waves.length && now - (waves[0]?.time ?? now) > 4000) waves.shift();
  while (steps.length && now - (steps[0]?.time ?? now) > 1800) steps.shift();
  const present = new Set(targets.map((target) => target.id));
  for (const id of neighbours.keys()) if (!present.has(id)) neighbours.delete(id);
  for (const target of targets) {
    const previous = neighbours.get(target.id);
    const reached = waves.some((wave) => Math.hypot(target.x - wave.x, target.y - wave.y) <= (now - wave.time) * 0.5);
    if (previous || reached) neighbours.set(target.id, { ...target, reachedAt: previous?.reachedAt ?? now });
  }
}

export function helenCharacterPose(id: string, now = performance.now()): { width: number; rock: number } {
  if (!isHelenPowerActive(now)) return { width: 1, rock: 0 };
  const neighbour = neighbours.get(id);
  if (id !== 'player' && !neighbour) return { width: 1, rock: 0 };
  const phase = [...id].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const arrived = id === 'player' ? 1 : Math.min(1, (now - (neighbour?.reachedAt ?? now)) / 400);
  return { width: 1 + 0.5 * arrived, rock: (id !== 'player' || protagonist.moving) ? Math.sin(helenPowerElapsed(now) / 350 + phase) * 0.035 * arrived : 0 };
}

export const getHelenProtagonist = () => protagonist as Readonly<typeof protagonist>;
export const getHelenNeighbours = (): readonly HelenNeighbour[] => [...neighbours.values()];
export const getHelenWaves = (): readonly PressureWave[] => waves;
export const getHelenSteps = (): readonly HeavyStep[] => steps;
