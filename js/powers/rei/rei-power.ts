import type { SamPowerTarget } from '../sam/sam-power.js';

export const REI_POWER_DURATION = 10_000;
export type ReiPowerKind = 'gravity' | 'sparkle';
export const REI_POWER_REVEALS: Readonly<Record<ReiPowerKind, string>> = {
  gravity: "Rei's first power: you became the centre of a massive gravitational field for ten seconds. The landscape bent inward, nearby characters were drawn toward you, and golden debris spiralled into a blazing miniature sun. The field followed you as you moved, then released everything when it faded. Normal movement and world speed were preserved.",
  sparkle: "Rei's second power: the makeup palette made you sparkle for ten seconds. Your actual sprite shimmered with prismatic light, stars orbited you, and every step painted a glittering constellation on the ground. Waves of sparkle swept through the real scenery and nearby characters, turning them into a radiant, twinkling audience beneath an aurora of coloured light. All glitter and lighting disappeared afterward; normal movement was preserved.",
};
export interface ReiGuest extends SamPowerTarget { readonly reachedAt: number }
export interface ReiTrail { readonly x: number; readonly y: number; readonly at: number; readonly seed: number }
interface ReiEffect {
  startedAt: number;
  hasOrigin: boolean;
  origin: { x: number; y: number };
  lastTrail: { x: number; y: number } | null;
  nextTrailAt: number;
  serial: number;
  guests: Map<string, ReiGuest>;
  trails: ReiTrail[];
}
const createEffect = (): ReiEffect => ({ startedAt: Infinity, hasOrigin: false, origin: { x: 0, y: 0 }, lastTrail: null, nextTrailAt: 0, serial: 0, guests: new Map(), trails: [] });
const effects: Record<ReiPowerKind, ReiEffect> = { gravity: createEffect(), sparkle: createEffect() };
const kinds: readonly ReiPowerKind[] = ['gravity', 'sparkle'];
const protagonist = { x: 0, y: 0 };
export const isReiEffectActive = (kind: ReiPowerKind, now = performance.now()): boolean => now >= effects[kind].startedAt && now < effects[kind].startedAt + REI_POWER_DURATION;
export const isReiPowerActive = (now = performance.now()): boolean => kinds.some((kind) => isReiEffectActive(kind, now));
export const reiPowerSecondsLeft = (kind: ReiPowerKind, now = performance.now()): number => isReiEffectActive(kind, now) ? (effects[kind].startedAt + REI_POWER_DURATION - now) / 1000 : 0;
export const reiPowerElapsed = (kind: ReiPowerKind, now: number): number => Math.max(0, now - effects[kind].startedAt);
export const reiVisualStrength = (kind: ReiPowerKind, now: number): number => isReiEffectActive(kind, now) ? Math.min(1, reiPowerElapsed(kind, now) / 300, reiPowerSecondsLeft(kind, now) / 0.5) : 0;
export const reiMovementMultiplier = (_now = performance.now()): number => 1;
export const getReiProtagonist = () => protagonist as Readonly<typeof protagonist>;
export const getReiOrigin = (kind: ReiPowerKind) => effects[kind].origin as Readonly<typeof protagonist>;
export const getReiGuests = (kind: ReiPowerKind): readonly ReiGuest[] => [...effects[kind].guests.values()];
export const getReiTrails = (kind: ReiPowerKind): readonly ReiTrail[] => effects[kind].trails;
export const isReiGuest = (kind: ReiPowerKind, id: string): boolean => effects[kind].guests.has(id);

export function activateReiPower(kind: ReiPowerKind, now = performance.now()): void {
  const effect = effects[kind]; effect.startedAt = now; effect.hasOrigin = false; effect.lastTrail = null;
  effect.nextTrailAt = now; effect.serial = 0; effect.guests.clear(); effect.trails.length = 0;
}
/** Gravity bends the rendered world without slowing the simulation. */
export const reiWorldDeltaTime = (deltaTime: number, _now: number): number => deltaTime;
export const reiGravityRadius = (now: number): number => isReiEffectActive('gravity', now) ? Math.min(1300, reiPowerElapsed('gravity', now) * 0.65) : 0;
export function reiGravityOffset(x: number, y: number, now: number): { x: number; y: number } {
  const dx = protagonist.x - x; const dy = protagonist.y - y;
  const distance = Math.hypot(dx, dy); const radius = reiGravityRadius(now);
  if (distance === 0 || distance >= radius) return { x: 0, y: 0 };
  const pull = Math.min(150, distance * 0.65) * (1 - distance / radius) * reiVisualStrength('gravity', now);
  return { x: dx / distance * pull, y: dy / distance * pull };
}
export function updateReiWorld(now: number, x: number, y: number, targets: readonly SamPowerTarget[]): void {
  protagonist.x = x; protagonist.y = y;
  for (const kind of kinds) {
    const effect = effects[kind];
    if (!isReiEffectActive(kind, now)) { effect.guests.clear(); effect.trails.length = 0; effect.lastTrail = null; continue; }
    if (!effect.hasOrigin) { effect.origin.x = x; effect.origin.y = y; effect.hasOrigin = true; }
    const radius = kind === 'gravity' ? reiGravityRadius(now) : Math.min(1300, reiPowerElapsed(kind, now) * 0.3);
    const centre = kind === 'gravity' ? protagonist : effect.origin;
    const present = new Set(targets.map((target) => target.id));
    for (const id of effect.guests.keys()) if (!present.has(id)) effect.guests.delete(id);
    for (const target of targets.slice(0, 48)) {
      const old = effect.guests.get(target.id);
      if (old || Math.hypot(target.x - centre.x, target.y - centre.y) <= radius) effect.guests.set(target.id, { ...target, reachedAt: old?.reachedAt ?? now });
    }
    const moved = !effect.lastTrail || Math.hypot(x - effect.lastTrail.x, y - effect.lastTrail.y) > 6;
    if (now >= effect.nextTrailAt && (moved || now >= effect.nextTrailAt + 500)) {
      effect.trails.push({ x, y, at: now, seed: effect.serial++ }); effect.lastTrail = { x, y };
      effect.nextTrailAt = now + (kind === 'gravity' ? 240 : 90);
    }
    while (effect.trails.length && now - effect.trails[0]!.at >= 3000) effect.trails.shift();
  }
}
