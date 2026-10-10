export const SAM_POWER_DURATION = 13_000;
const PINCH_RADIUS = 128;
const REPEAT_PINCH_DELAY = 650;
const RECOIL_DURATION = 550;
const EFFECT_DURATION = 900;

export interface SamPowerTarget { readonly id: string; readonly x: number; readonly y: number; readonly height: number }
export interface SamPinchEffect extends SamPowerTarget { readonly pinchedAt: number; readonly directionX: number; readonly directionY: number; readonly variant: number }
export interface SamTrail { readonly x: number; readonly y: number; readonly at: number; readonly seed: number }
let powerStartsAt = Infinity;
let powerEndsAt = 0;
let lastImpactAt = -Infinity;
let nextFootstepAt = 0;
let nextTerrainSnapAt = 0;
let hasOrigin = false;
let pinchCount = 0;
let lastFootstep: { x: number; y: number } | null = null;
const protagonist = { x: 0, y: 0 };
const origin = { x: 0, y: 0 };
const lastPinchedAt = new Map<string, number>();
const pinchEffects = new Map<string, SamPinchEffect>();
const metCharacters = new Set<string>();
const footsteps: SamTrail[] = [];
const terrainSnaps: SamTrail[] = [];

export const samTargetId = (name: string): string => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export const isSamPowerActive = (now = performance.now()): boolean => now >= powerStartsAt && now < powerEndsAt;
export const samPowerSecondsLeft = (now = performance.now()): number => isSamPowerActive(now) ? (powerEndsAt - now) / 1000 : 0;
export const samPowerElapsed = (now: number): number => Math.max(0, now - powerStartsAt);
export const samVisualStrength = (now: number): number => isSamPowerActive(now) ? Math.min(1, samPowerElapsed(now) / 250, samPowerSecondsLeft(now) / 0.45) : 0;
export const samMovementMultiplier = (now = performance.now()): number => isSamPowerActive(now) ? 1.28 : 1;
export const getSamProtagonist = () => protagonist as Readonly<typeof protagonist>;
export const getSamOrigin = () => origin as Readonly<typeof origin>;
export const getSamPinchStats = () => ({ pinches: pinchCount, characters: metCharacters.size });
export const getSamPinchEffects = (now = performance.now()): readonly SamPinchEffect[] => isSamPowerActive(now) ? [...pinchEffects.values()].filter((effect) => now >= effect.pinchedAt && now - effect.pinchedAt < EFFECT_DURATION) : [];
export const getSamFootsteps = (now = performance.now()): readonly SamTrail[] => isSamPowerActive(now) ? footsteps : [];
export const getSamTerrainSnaps = (now = performance.now()): readonly SamTrail[] => isSamPowerActive(now) ? terrainSnaps : [];
export function samPowerReveal(): string {
  return `Sam's power: Crab Nicholson Extreme Sleepover Text Adventure turned you into a giant-clawed crab champion for thirteen seconds. You scuttled 28% faster and automatically pinched every nearby friend and foe. Actual characters recoiled, enemies briefly stopped, and giant claws reached out to grab them. Your steps left crab tracks and tidal rings; the real scenery squeezed beneath each claw while a Nintendo DS adventure counted your rampage. You delivered ${pinchCount} ${pinchCount === 1 ? 'pinch' : 'pinches'} to ${metCharacters.size} ${metCharacters.size === 1 ? 'character' : 'characters'}. The claws, scenery changes, speed boost and reactions all disappeared afterward.`;
}
function clearWorld(): void { pinchEffects.clear(); lastPinchedAt.clear(); footsteps.length = 0; terrainSnaps.length = 0; lastFootstep = null; }
export function activateSamPower(now = performance.now()): void {
  powerStartsAt = now; powerEndsAt = now + SAM_POWER_DURATION; lastImpactAt = -Infinity;
  nextFootstepAt = now; nextTerrainSnapAt = now; hasOrigin = false; pinchCount = 0; metCharacters.clear(); clearWorld();
}
export function updateSamPower(now: number, playerX: number, playerY: number, targets: readonly SamPowerTarget[], direction = 'down'): void {
  protagonist.x = playerX; protagonist.y = playerY;
  if (!isSamPowerActive(now)) { clearWorld(); return; }
  if (!hasOrigin) { origin.x = playerX; origin.y = playerY; hasOrigin = true; }
  const liveTargets = new Map(targets.slice(0, 64).map((target) => [target.id, target]));
  for (const [id, effect] of pinchEffects) {
    const target = liveTargets.get(id);
    if (!target || now - effect.pinchedAt >= EFFECT_DURATION) pinchEffects.delete(id);
    else pinchEffects.set(id, { ...effect, ...target });
  }
  for (const target of liveTargets.values()) {
    const dx = target.x - playerX; const dy = target.y - playerY; const distance = Math.hypot(dx, dy);
    if (distance > PINCH_RADIUS || now - (lastPinchedAt.get(target.id) ?? -Infinity) < REPEAT_PINCH_DELAY) continue;
    lastPinchedAt.set(target.id, now); metCharacters.add(target.id); pinchCount++;
    pinchEffects.set(target.id, { ...target, pinchedAt: now, directionX: distance > 0 ? dx / distance : 1, directionY: distance > 0 ? dy / distance : -0.25, variant: target.id.length % 4 });
    lastImpactAt = now;
  }
  if (now >= nextFootstepAt && (!lastFootstep || Math.hypot(playerX - lastFootstep.x, playerY - lastFootstep.y) > 7)) {
    footsteps.push({ x: playerX, y: playerY, at: now, seed: footsteps.length ? footsteps[footsteps.length - 1]!.seed + 1 : 0 });
    lastFootstep = { x: playerX, y: playerY }; nextFootstepAt = now + 90;
  }
  if (now >= nextTerrainSnapAt) {
    const dx = direction.toLowerCase().includes('left') ? -1 : direction.toLowerCase().includes('right') ? 1 : 0;
    const dy = direction.toLowerCase().includes('up') ? -1 : direction.toLowerCase().includes('down') ? 1 : 0;
    const length = Math.hypot(dx, dy) || 1; const facingX = dx / length; const facingY = dy / length;
    for (const side of [-1, 1]) terrainSnaps.push({ x: playerX + facingX * 32 - facingY * side * 48, y: playerY + facingY * 32 + facingX * side * 48, at: now, seed: side });
    nextTerrainSnapAt = now + 440;
  }
  while (footsteps.length && now - footsteps[0]!.at >= 1800) footsteps.shift();
  while (terrainSnaps.length && now - terrainSnaps[0]!.at >= EFFECT_DURATION) terrainSnaps.shift();
}
export function isSamTargetRecoiling(id: string, now = performance.now()): boolean {
  const effect = pinchEffects.get(id);
  return isSamPowerActive(now) && effect !== undefined && now >= effect.pinchedAt && now - effect.pinchedAt < RECOIL_DURATION;
}
export function samVictimOffset(id: string, now = performance.now()): { readonly x: number; readonly y: number } {
  if (!isSamTargetRecoiling(id, now)) return { x: 0, y: 0 };
  const effect = pinchEffects.get(id)!; const progress = (now - effect.pinchedAt) / RECOIL_DURATION;
  const kick = Math.sin(progress * Math.PI) * 22;
  return { x: effect.directionX * kick + (progress < 0.55 ? Math.sin(progress * Math.PI * 12) * 2 : 0), y: effect.directionY * kick - Math.sin(progress * Math.PI) * 9 };
}
export function samCameraJolt(now: number): { readonly x: number; readonly y: number } {
  const elapsed = now - lastImpactAt;
  if (!isSamPowerActive(now) || elapsed < 0 || elapsed >= 180) return { x: 0, y: 0 };
  const strength = (1 - elapsed / 180) * 3;
  return { x: Math.round(Math.sin(elapsed * 0.17) * strength), y: Math.round(Math.cos(elapsed * 0.23) * strength) };
}
