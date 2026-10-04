import { damagePlayerHealth, getPlayerHealth } from './player-health.js';

export const JOE_POWER_DURATION = 10_000;
export const JOE_POWER_REVEAL = "Joe's power: you lost 10% of your health to heat damage over ten seconds. You became the centre of a volcanic heatwave: molten cracks spread beneath your footsteps, fire geysers erupted, the scenery shimmered, and nearby characters recoiled from the heat. The landscape cooled afterwards, but the health loss remained.";
export interface JoeTarget { readonly id: string; readonly x: number; readonly y: number; readonly height: number }
interface HeatedTarget extends JoeTarget { readonly reachedAt: number }
interface HeatVent { readonly x: number; readonly y: number; readonly time: number; readonly seed: number }
let startedAt = Infinity;
let endsAt = 0;
let damagePerPulse = 0;
let appliedPulses = 0;
let lastVentAt = -Infinity;
let lastPosition: { x: number; y: number } | null = null;
const vents: HeatVent[] = [];
const neighbours = new Map<string, HeatedTarget>();
const protagonist = { x: 0, y: 0 };

export function activateJoePower(now = performance.now()): void {
  updateJoeDamage(now);
  startedAt = now; endsAt = now + JOE_POWER_DURATION;
  damagePerPulse = getPlayerHealth() * 0.01;
  appliedPulses = 0; lastVentAt = -Infinity; lastPosition = null;
  vents.length = 0; neighbours.clear();
}
export const isJoePowerActive = (now = performance.now()): boolean => now >= startedAt && now < endsAt;
export const joePowerSecondsLeft = (now = performance.now()): number => isJoePowerActive(now) ? (endsAt - now) / 1000 : 0;
export const joePowerElapsed = (now: number): number => Math.max(0, now - startedAt);
export const joeVisualStrength = (now: number): number => isJoePowerActive(now) ? Math.min(1, joePowerElapsed(now) / 250, joePowerSecondsLeft(now) * 3) : 0;

/** Ten equal hits, using elapsed real time so delayed frames cannot lose or duplicate damage. */
export function updateJoeDamage(now: number): void {
  const pulses = Math.min(10, Math.max(0, Math.floor((now - startedAt) / 1000)));
  if (pulses > appliedPulses) damagePlayerHealth((pulses - appliedPulses) * damagePerPulse);
  appliedPulses = pulses;
}

export function updateJoeWorld(now: number, x: number, y: number, targets: readonly JoeTarget[]): void {
  if (!isJoePowerActive(now)) { vents.length = 0; neighbours.clear(); lastPosition = null; return; }
  protagonist.x = x; protagonist.y = y;
  const moved = lastPosition !== null && Math.hypot(x - lastPosition.x, y - lastPosition.y) > 12;
  if (now - lastVentAt >= 700 || (moved && now - lastVentAt >= 180)) {
    vents.push({ x, y, time: now, seed: vents.length + Math.floor(joePowerElapsed(now) / 100) });
    lastVentAt = now; lastPosition = { x, y };
  }
  while (vents.length && now - (vents[0]?.time ?? now) > 3400) vents.shift();
  const present = new Set(targets.map((target) => target.id));
  for (const id of neighbours.keys()) if (!present.has(id)) neighbours.delete(id);
  for (const target of targets) {
    const previous = neighbours.get(target.id);
    if (previous || Math.hypot(x - target.x, y - target.y) < Math.min(1100, joePowerElapsed(now) * 0.35)) {
      neighbours.set(target.id, { ...target, reachedAt: previous?.reachedAt ?? now });
    }
  }
}

export function joeCharacterPose(id: string, now: number): { x: number; y: number; lean: number } {
  if (!isJoePowerActive(now)) return { x: 0, y: 0, lean: 0 };
  const elapsed = joePowerElapsed(now);
  if (id === 'player') return { x: Math.sin(elapsed / 45) * 1.8, y: -Math.abs(Math.sin(elapsed / 140)) * 3, lean: Math.sin(elapsed / 90) * 0.025 };
  const target = neighbours.get(id);
  if (!target) return { x: 0, y: 0, lean: 0 };
  const distance = Math.hypot(target.x - protagonist.x, target.y - protagonist.y) || 1;
  const recoil = Math.min(1, (now - target.reachedAt) / 260);
  return { x: (target.x - protagonist.x) / distance * 13 * recoil, y: (target.y - protagonist.y) / distance * 7 * recoil - Math.abs(Math.sin(elapsed / 180 + target.x)) * 5, lean: Math.sign(target.x - protagonist.x) * 0.13 * recoil };
}
export const getJoeProtagonist = () => protagonist as Readonly<typeof protagonist>;
export const getJoeVents = (): readonly HeatVent[] => vents;
export const getJoeNeighbours = (): readonly HeatedTarget[] => [...neighbours.values()];
