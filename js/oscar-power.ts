import type { SamPowerTarget } from './sam-power.js';
import { samTargetId } from './sam-power.js';

export const OSCAR_POWER_DURATION = 10_000;
export const OSCAR_POWER_REVEAL = 'Oscar’s power: for ten seconds you became a ravenous giant with a huge fork and snapping jaws. Real chunks of the landscape and nearby characters flew into your mouth. Every meal made you larger and faster; bitten terrain became temporarily passable, so you could eat a route through obstacles. At the end you burped everything back: swallowed characters, scenery, normal movement and collision returned. If a restored obstacle covered you, you returned to your last safe spot.';

export interface BiteMark {
  readonly x: number;
  readonly y: number;
  readonly at: number;
  readonly targetId: string | null;
  readonly size: number;
}

const SWALLOW_RADIUS = 76;
const protagonist = { x: 0, y: 0 };
const meals = new Map<string, SamPowerTarget>();
let lastSafe: { x: number; y: number } | null = null;
let needsSettlement = false;
const CHOMP_INTERVAL = 520;
let powerStartsAt = Infinity;
let powerEndsAt = 0;
let nextChompAt = 0;
let chompCount = 0;
const swallowed = new Set<string>();
const biteMarks: BiteMark[] = [];

export function oscarCharacterId(name: string): string {
  return name.trim().toLowerCase() === 'marina d' ? 'marina' : samTargetId(name);
}

export function activateOscarPower(now = performance.now()): void {
  powerStartsAt = now;
  powerEndsAt = now + OSCAR_POWER_DURATION;
  nextChompAt = now;
  chompCount = 0;
  swallowed.clear();
  meals.clear(); lastSafe = null; needsSettlement = true;
  biteMarks.length = 0;
}

export function oscarPowerSecondsLeft(now = performance.now()): number {
  return isOscarPowerActive(now) ? (powerEndsAt - now) / 1000 : 0;
}

export function isOscarPowerActive(now = performance.now()): boolean {
  return now >= powerStartsAt && now < powerEndsAt;
}

export function isOscarEaten(id: string, now = performance.now()): boolean {
  return isOscarPowerActive(now) && swallowed.has(id);
}

export function oscarMovementMultiplier(now = performance.now()): number {
  if (!isOscarPowerActive(now)) return 1;
  return 1.35 + Math.min(swallowed.size, 6) * 0.055 + Math.min(20, Math.max(0, chompCount - 1)) * 0.012;
}

export function updateOscarPower(
  now: number,
  playerX: number,
  playerY: number,
  targets: readonly SamPowerTarget[] = [],
  direction = 'down',
): void {
  if (!isOscarPowerActive(now)) { swallowed.clear(); biteMarks.length = 0; meals.clear(); return; }
  protagonist.x = playerX; protagonist.y = playerY;
  if (now < nextChompAt) return;
  nextChompAt = now + CHOMP_INTERVAL;

  let nearest: SamPowerTarget | null = null;
  let nearestDistance = SWALLOW_RADIUS + Math.min(50, chompCount * 2);
  for (const target of targets) {
    if (swallowed.has(target.id)) continue;
    const distance = Math.hypot(target.x - playerX, target.y - playerY);
    if (distance < nearestDistance) {
      nearest = target;
      nearestDistance = distance;
    }
  }

  const phase = chompCount * 2.399963229728653;
  chompCount += 1;
  const mark: BiteMark = nearest
    ? { x: nearest.x, y: nearest.y - nearest.height * 0.45, at: now, targetId: nearest.id, size: 14 + (chompCount % 3) * 3 }
    : { x: playerX + Math.cos(phase) * 31, y: playerY - 7 + Math.sin(phase) * 13, at: now, targetId: null, size: 11 + (chompCount % 3) * 3 };
  if (nearest) { swallowed.add(nearest.id); meals.set(nearest.id, { ...nearest }); }
  biteMarks.push(mark);
  const dx = direction.toLowerCase().includes('left') ? -1 : direction.toLowerCase().includes('right') ? 1 : 0;
  const dy = direction.toLowerCase().includes('up') ? -1 : direction.toLowerCase().includes('down') ? 1 : 0;
  const length = Math.hypot(dx, dy) || 1;
  biteMarks.push({ x: playerX + dx / length * 40, y: playerY + dy / length * 40, at: now, targetId: null, size: 34 + Math.min(28, chompCount * 2) });
  if (biteMarks.length > 40) biteMarks.splice(0, biteMarks.length - 40);
}

export const getOscarBites = (): readonly BiteMark[] => biteMarks;
export const getOscarMeals = (): readonly SamPowerTarget[] => [...meals.values()];
export const getOscarProtagonist = () => protagonist as Readonly<typeof protagonist>;
export const oscarGrowth = (now = performance.now()): number => isOscarPowerActive(now) ? 1 + Math.min(0.85, chompCount * 0.025 + swallowed.size * 0.09) : 1;
export const oscarVisualStrength = (now: number): number => isOscarPowerActive(now) ? Math.min(1, (now - powerStartsAt) / 180, oscarPowerSecondsLeft(now) / 0.35) : 0;
export function isOscarTerrainEaten(x: number, y: number, now = performance.now()): boolean {
  return isOscarPowerActive(now) && biteMarks.some((bite) => bite.targetId === null && Math.hypot(x - bite.x, (y - bite.y) / 0.75) < bite.size - 10);
}
/** Remember a normal collision-free foot position, then recover it when the scenery regrows. */
export function settleOscarDigestion(player: { x: number; y: number }, blocked: (x: number, y: number) => boolean, now = performance.now()): void {
  if (!needsSettlement) return;
  if (isOscarPowerActive(now)) {
    if (!blocked(player.x, player.y)) lastSafe = { x: player.x, y: player.y };
    return;
  }
  if (lastSafe && blocked(player.x, player.y)) { player.x = lastSafe.x; player.y = lastSafe.y; }
  lastSafe = null; needsSettlement = false;
}
