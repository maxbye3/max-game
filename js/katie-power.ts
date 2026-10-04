import type { SamPowerTarget } from './sam-power.js';

export const KATIE_POWER_DURATION = 10_000;
export const KATIE_POWER_REVEAL = "Katie's power: you stopped for ten seconds to finish a cigarette. Each exhale sent enormous smoke rings across the landscape, slowing the world into a smoky dream. Nearby characters coughed and recoiled as the smoke reached them. The cigarette burned down, the haze dispersed, and your movement and the world's normal pace returned.";
const EXHALE_TIMES = [1100, 3300, 5500, 7700, 9300] as const;
const SMOKE_SPEED = 0.3;
export interface KatieSmokeRing { readonly x: number; readonly y: number; readonly time: number }
interface SmokyNeighbour extends SamPowerTarget { readonly reachedAt: number }
let startedAt = Infinity;
let nextExhale = 0;
const protagonist = { x: 0, y: 0 };
const rings: KatieSmokeRing[] = [];
const neighbours = new Map<string, SmokyNeighbour>();

export function activateKatiePower(now = performance.now()): void {
  startedAt = now; nextExhale = 0; rings.length = 0; neighbours.clear();
}
export const isKatiePowerActive = (now = performance.now()): boolean => now >= startedAt && now < startedAt + KATIE_POWER_DURATION;
export const katiePowerElapsed = (now: number): number => Math.max(0, now - startedAt);
export const katiePowerSecondsLeft = (now = performance.now()): number => isKatiePowerActive(now) ? (startedAt + KATIE_POWER_DURATION - now) / 1000 : 0;
export const katieVisualStrength = (now: number): number => isKatiePowerActive(now) ? Math.min(1, katiePowerElapsed(now) / 300, katiePowerSecondsLeft(now) / 0.7) : 0;
export const katieInhale = (now: number): number => isKatiePowerActive(now) ? Math.max(0, Math.sin(Math.min(1, katiePowerElapsed(now) % 2200 / 1100) * Math.PI)) : 0;
export const katieCigaretteRemaining = (now: number): number => isKatiePowerActive(now) ? 1 - katiePowerElapsed(now) / KATIE_POWER_DURATION : 0;
export const katieSmokeRadius = (ring: KatieSmokeRing, now: number): number => Math.max(0, now - ring.time) * SMOKE_SPEED;
export const getKatieProtagonist = () => protagonist as Readonly<typeof protagonist>;
export const getKatieRings = (): readonly KatieSmokeRing[] => rings;
export const getKatieNeighbours = (): readonly SmokyNeighbour[] => [...neighbours.values()];

/** Real-time overlap keeps the break exactly ten seconds, even across delayed frames. */
export function katieWorldDeltaTime(deltaTime: number, now: number): number {
  const overlap = Math.max(0, Math.min(now, startedAt + KATIE_POWER_DURATION) - Math.max(now - deltaTime * 1000, startedAt)) / 1000;
  return Math.max(0, deltaTime - overlap * 0.88);
}

export function updateKatieWorld(now: number, x: number, y: number, targets: readonly SamPowerTarget[]): void {
  if (!isKatiePowerActive(now)) { rings.length = 0; neighbours.clear(); return; }
  protagonist.x = x; protagonist.y = y;
  while (nextExhale < EXHALE_TIMES.length && katiePowerElapsed(now) >= EXHALE_TIMES[nextExhale]!) {
    rings.push({ x, y, time: startedAt + EXHALE_TIMES[nextExhale]! }); nextExhale++;
  }
  const present = new Set(targets.map((target) => target.id));
  for (const id of neighbours.keys()) if (!present.has(id)) neighbours.delete(id);
  for (const target of targets) {
    const previous = neighbours.get(target.id);
    const distance = Math.hypot(target.x - x, target.y - y);
    const firstRing = rings[0];
    if (previous || (firstRing && distance <= katieSmokeRadius(firstRing, now))) {
      neighbours.set(target.id, { ...target, reachedAt: previous?.reachedAt ?? firstRing!.time + distance / SMOKE_SPEED });
    }
  }
}

export function katieCharacterPose(id: string, now: number): { x: number; y: number; lean: number } {
  if (!isKatiePowerActive(now)) return { x: 0, y: 0, lean: 0 };
  const strength = katieVisualStrength(now);
  if (id === 'player') return { x: 0, y: katieInhale(now) * 2 * strength, lean: -katieInhale(now) * 0.055 * strength };
  const target = neighbours.get(id);
  if (!target) return { x: 0, y: 0, lean: 0 };
  const dx = target.x - protagonist.x; const dy = target.y - protagonist.y;
  const distance = Math.hypot(dx, dy) || 1;
  const arrival = Math.min(1, Math.max(0, now - target.reachedAt) / 300) * strength;
  const cough = Math.max(0, Math.sin((now - target.reachedAt) / 90 + target.id.length));
  return { x: dx / distance * 24 * arrival, y: (dy / distance * 13 + cough * 3) * arrival, lean: (Math.sign(dx || 1) * 0.15 + cough * 0.13) * arrival };
}
