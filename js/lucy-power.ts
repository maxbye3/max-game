import { getPlayerHealth, healPlayerHealth } from './player-health.js';
import { readStorage, writeStorage } from './storage.js';
import type { SamPowerTarget } from './sam-power.js';

export const LUCY_POWER_DURATION = 10_000;
export type LucyReaction = 'delighted' | 'puzzled' | 'splattered';
export interface LucyGuest extends SamPowerTarget { readonly reaction: LucyReaction; readonly reachedAt: number }
export interface LucyPlate { readonly x: number; readonly y: number; readonly savoury: boolean; readonly seed: number }
const CAP_KEY = 'max-game:lucy-solar-cap-equipped';
const BILL_KEY = 'max-game:lucy-cleaning-charges';
let startedAt = Infinity;
let lastTick = 0;
let random: () => number = Math.random;
let healthRestored = 0;
let cleaningCharges = 0;
let capEarned = false;
let delightedCount = 0;
let puzzledCount = 0;
let splatteredCount = 0;
let capEquipped = readStorage(CAP_KEY) === 'true';
let foodMultiplier = 1;
let splashUntil = 0;
let nextTrailAt = 0;
const origin = { x: 0, y: 0 };
const protagonist = { x: 0, y: 0 };
const guests = new Map<string, LucyGuest>();
const reactions = new Map<string, LucyGuest>();
const plates: LucyPlate[] = [];
const trails: { x: number; y: number; time: number }[] = [];
let hasOrigin = false;

export function activateLucyPower(now = performance.now(), rng = Math.random): void {
  startedAt = now; lastTick = now; random = rng; healthRestored = 0; cleaningCharges = 0;
  capEarned = false; foodMultiplier = 1.5; splashUntil = 0; hasOrigin = false; nextTrailAt = now;
  delightedCount = 0; puzzledCount = 0; splatteredCount = 0;
  guests.clear(); reactions.clear(); plates.length = 0; trails.length = 0;
}
export const isLucyPowerActive = (now = performance.now()): boolean => now >= startedAt && now < startedAt + LUCY_POWER_DURATION;
export const lucyPowerSecondsLeft = (now = performance.now()): number => isLucyPowerActive(now) ? (startedAt + LUCY_POWER_DURATION - now) / 1000 : 0;
export const lucyPowerElapsed = (now: number): number => Math.max(0, now - startedAt);
export const lucyVisualStrength = (now: number): number => isLucyPowerActive(now) ? Math.min(1, lucyPowerElapsed(now) / 350, lucyPowerSecondsLeft(now) / 0.6) : 0;
export const lucyFeastRadius = (now: number): number => Math.min(1150, lucyPowerElapsed(now) * 0.2);
export const getLucyOrigin = () => origin as Readonly<typeof origin>;
export const getLucyProtagonist = () => protagonist as Readonly<typeof protagonist>;
export const getLucyGuests = (): readonly LucyGuest[] => [...guests.values()];
export const getLucyGuest = (id: string): LucyGuest | undefined => guests.get(id);
export const getLucyPlates = (): readonly LucyPlate[] => plates;
export const getLucyTrails = () => trails as readonly Readonly<(typeof trails)[number]>[];
export const lucyHasEarnedCap = (): boolean => capEarned;
export const isLucyCapEquipped = (): boolean => capEquipped;
export function setLucyCapEquipped(equipped: boolean): void { capEquipped = equipped; writeStorage(CAP_KEY, String(equipped)); }
export const lucyMovementMultiplier = (now = performance.now()): number => isLucyPowerActive(now) ? (now < splashUntil ? 0.5 : foodMultiplier) : 1;
export function lucyCleaningBalance(): number { const amount = Number(readStorage(BILL_KEY)); return Number.isFinite(amount) ? Math.max(0, amount) : 0; }
export function resetLucyRewards(): void { setLucyCapEquipped(false); writeStorage(BILL_KEY, '0'); }

/** Each actual character gets one independent 50/25/25 gift reaction per activation. */
export function updateLucyWorld(now: number, x: number, y: number, targets: readonly SamPowerTarget[]): void {
  protagonist.x = x; protagonist.y = y;
  if (!isLucyPowerActive(now)) { plates.length = 0; trails.length = 0; guests.clear(); return; }
  if (!hasOrigin) {
    origin.x = x; origin.y = y; hasOrigin = true;
    // An edible banquet grows around the activation point, never moving collision geometry.
    for (let i = 0; i < 24; i++) {
      const angle = i * 2.399963; const radius = 58 + Math.sqrt(i) * 43;
      plates.push({ x: x + Math.cos(angle) * radius, y: y + Math.sin(angle) * radius * 0.65, savoury: i % 4 !== 3, seed: i });
    }
  }
  foodMultiplier = 1.5;
  for (const plate of plates) if (Math.hypot(x - plate.x, y - plate.y) < 24 && !plate.savoury) foodMultiplier = 0.5;
  const present = new Set(targets.map((target) => target.id));
  for (const id of guests.keys()) if (!present.has(id)) guests.delete(id);
  for (const target of targets) {
    const previous = reactions.get(target.id);
    if (previous) { guests.set(target.id, { ...previous, ...target }); continue; }
    if (Math.hypot(target.x - origin.x, target.y - origin.y) > lucyFeastRadius(now)) continue;
    const roll = random();
    const reaction: LucyReaction = roll < 0.5 ? 'delighted' : roll < 0.75 ? 'puzzled' : 'splattered';
    const guest = { ...target, reaction, reachedAt: now };
    guests.set(target.id, guest); reactions.set(target.id, guest);
    if (reaction === 'delighted') { capEarned = true; delightedCount++; }
    if (reaction === 'puzzled') puzzledCount++;
    if (reaction === 'splattered') {
      splatteredCount++;
      cleaningCharges += 12;
      writeStorage(BILL_KEY, String(lucyCleaningBalance() + 12));
      splashUntil = Math.max(splashUntil, now + 1000);
    }
  }
  if (now >= nextTrailAt) { trails.push({ x, y, time: now }); nextTrailAt = now + 120; }
  while (trails.length && now - trails[0]!.time > 2200) trails.shift();
}

/** Accumulate real-time healing once; background/delayed frames cannot double-credit it. */
export function updateLucyRecovery(now: number, outdoors: boolean): void {
  const dt = Math.max(0, Math.min(now, startedAt + LUCY_POWER_DURATION) - Math.max(lastTick, startedAt)) / 1000;
  if (dt > 0) {
    const before = getPlayerHealth();
    healPlayerHealth(dt * (2 * foodMultiplier + (outdoors && capEarned ? 1 : 0)));
    healthRestored += getPlayerHealth() - before;
  }
  const capDt = Math.min(0.25, Math.max(0, now - lastTick) / 1000);
  if (capEquipped && outdoors && !isLucyPowerActive(now)) healPlayerHealth(capDt);
  lastTick = now;
}

export function lucyCharacterPose(id: string, now: number): { x: number; y: number; lean: number; scale: number } {
  const neutral = { x: 0, y: 0, lean: 0, scale: 1 };
  if (!isLucyPowerActive(now)) return neutral;
  const elapsed = lucyPowerElapsed(now); const strength = lucyVisualStrength(now);
  if (id === 'player') return { x: 0, y: -Math.abs(Math.sin(elapsed / 150)) * 5 * strength, lean: Math.sin(elapsed / 220) * 0.035 * strength, scale: 1 + 0.12 * strength };
  const guest = guests.get(id); if (!guest) return neutral;
  const phase = now - guest.reachedAt;
  if (guest.reaction === 'delighted') return { x: Math.sin(phase / 160) * 5 * strength, y: -Math.abs(Math.sin(phase / 190)) * 9 * strength, lean: Math.sin(phase / 160) * 0.12 * strength, scale: 1 };
  if (guest.reaction === 'puzzled') return { x: 0, y: 0, lean: Math.sin(phase / 550) * 0.1 * strength, scale: 1 };
  const distance = Math.hypot(guest.x - origin.x, guest.y - origin.y) || 1;
  return { x: (guest.x - origin.x) / distance * 15 * strength, y: (guest.y - origin.y) / distance * 8 * strength, lean: Math.sin(phase / 65) * 0.1 * strength, scale: 1 };
}

export function lucyPowerReveal(): string {
  return `Lucy's power: your mayonnaise turned the landscape into a gigantic picnic for ten seconds. Savoury food boosted movement and nourishment by 50%; stepping onto a cake plate halved them. Nearby characters received a gift with a 50% chance of loving it, 25% of being puzzled and 25% of a bursting sachet. This time: ${delightedCount} delighted, ${puzzledCount} puzzled, ${splatteredCount} splattered. You recovered ${healthRestored.toFixed(1)} HP.${capEarned ? ' You earned a solar-panel cap: wear it from your inventory to slowly recover health in the bright outdoor world.' : ''}${cleaningCharges ? ` Dry-cleaning charges of £${cleaningCharges} were added to your account (total £${lucyCleaningBalance()}). The splashes briefly slowed you down.` : ''} The picnic disappeared and normal movement returned.`;
}
