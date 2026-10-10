import { getCollectedGifts, hasGift, removeGift, LUCY_SOLAR_CAP, NOEL_ITEM, type GiftItem } from './inventory-gifts.js';
import { readStorage, writeStorage } from './storage.js';
import type { SamPowerTarget } from './sam-power.js';

export const NOEL_POWER_DURATION = 10_000;
const CLAIM_KEY = 'max-game:noel-asset-claim';
const round = (value: number): number => Math.round(value * 1_000_000) / 1_000_000;
export interface NoelAudience extends SamPowerTarget { readonly reachedAt: number }
export interface NoelReceipt { readonly x: number; readonly y: number; readonly time: number; readonly seed: number }
let startedAt = Infinity;
let assessedPulses = 0;
let startingAssets = 0;
let assessed = 0;
let nextReceiptAt = 0;
let claimFallback = 0;
let hasOrigin = false;
const repossessed: string[] = [];
let collateral: readonly GiftItem[] = [];
const audience = new Map<string, NoelAudience>();
const receipts: NoelReceipt[] = [];
const origin = { x: 0, y: 0 };
const protagonist = { x: 0, y: 0 };

/** Gifts are indivisible. Keep the fractional claim rather than rounding a small collection up to a whole lost gift. */
export function noelAssetClaim(): number {
  const stored = readStorage(CLAIM_KEY);
  const value = stored === null ? claimFallback : Number(stored);
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}
function saveClaim(value: number): void {
  claimFallback = round(Math.max(0, value));
  writeStorage(CLAIM_KEY, String(claimFallback));
}
export const isNoelPowerActive = (now = performance.now()): boolean => now >= startedAt && now < startedAt + NOEL_POWER_DURATION;
export const noelPowerSecondsLeft = (now = performance.now()): number => isNoelPowerActive(now) ? (startedAt + NOEL_POWER_DURATION - now) / 1000 : 0;
export const noelPowerElapsed = (now: number): number => Math.max(0, now - startedAt);
export const noelVisualStrength = (now: number): number => isNoelPowerActive(now) ? Math.min(1, noelPowerElapsed(now) / 250, noelPowerSecondsLeft(now) / 0.45) : 0;
export const noelMovementMultiplier = (now = performance.now()): number => isNoelPowerActive(now) ? 1 - Math.min(0.1, noelPowerElapsed(now) / NOEL_POWER_DURATION * 0.1) : 1;
export const getNoelOrigin = () => origin as Readonly<typeof origin>;
export const getNoelProtagonist = () => protagonist as Readonly<typeof protagonist>;
export const getNoelAudience = (): readonly NoelAudience[] => [...audience.values()];
export const getNoelReceipts = (): readonly NoelReceipt[] => receipts;
export const getNoelCollateral = (): readonly GiftItem[] => collateral;
export const noelAssessment = (): number => assessed;

export function activateNoelPower(now = performance.now()): boolean {
  if (isNoelPowerActive(now)) return false;
  updateNoelAssessment(now);
  collateral = getCollectedGifts().filter((gift) => gift.id !== NOEL_ITEM.id && gift.id !== LUCY_SOLAR_CAP.id);
  startingAssets = Math.max(0, collateral.length - noelAssetClaim());
  startedAt = now; assessedPulses = 0; assessed = 0; hasOrigin = false; nextReceiptAt = now;
  repossessed.length = 0; receipts.length = 0; audience.clear();
  return true;
}

/** Ten real-time instalments total exactly 10% of the starting collection's unencumbered value. */
export function updateNoelAssessment(now: number): void {
  const pulses = Math.min(10, Math.max(0, Math.floor((now - startedAt) / 1000)));
  if (pulses <= assessedPulses) return;
  const total = round(startingAssets * pulses / 100);
  let claim = round(noelAssetClaim() + total - assessed);
  assessed = total; assessedPulses = pulses;
  for (const gift of collateral) {
    if (claim < 1 || !hasGift(gift)) continue;
    claim = round(claim - 1);
    saveClaim(claim);
    repossessed.push(gift.name);
    removeGift(gift);
  }
  saveClaim(claim);
}

export function updateNoelWorld(now: number, x: number, y: number, targets: readonly SamPowerTarget[]): void {
  if (!isNoelPowerActive(now)) { audience.clear(); receipts.length = 0; return; }
  protagonist.x = x; protagonist.y = y;
  if (!hasOrigin) { origin.x = x; origin.y = y; hasOrigin = true; }
  const present = new Set(targets.map((target) => target.id));
  for (const id of audience.keys()) if (!present.has(id)) audience.delete(id);
  const radius = Math.min(1400, noelPowerElapsed(now) * 0.3);
  for (const target of targets) {
    const previous = audience.get(target.id);
    if (previous || Math.hypot(target.x - origin.x, target.y - origin.y) <= radius) audience.set(target.id, { ...target, reachedAt: previous?.reachedAt ?? now });
  }
  if (now >= nextReceiptAt) {
    receipts.push({ x, y, time: now, seed: Math.floor(noelPowerElapsed(now) / 160) });
    nextReceiptAt = now + 160;
  }
  while (receipts.length && now - receipts[0]!.time > 2400) receipts.shift();
}

export function noelCharacterPose(id: string, now: number): { x: number; y: number; lean: number; scale: number } {
  const neutral = { x: 0, y: 0, lean: 0, scale: 1 };
  if (!isNoelPowerActive(now) || (id !== 'player' && !audience.has(id))) return neutral;
  const t = noelPowerElapsed(now); const strength = noelVisualStrength(now);
  return id === 'player'
    ? { x: Math.sin(t / 55) * 2 * strength, y: 0, lean: Math.sin(t / 120) * 0.06 * strength, scale: 1 - t / NOEL_POWER_DURATION * 0.1 }
    : { x: Math.sin(t / 200 + id.length) * 3 * strength, y: -Math.abs(Math.sin(t / 390 + id.length)) * 4 * strength, lean: Math.sin(t / 310 + id.length) * 0.1 * strength, scale: 1 };
}

export function noelPowerReveal(): string {
  const losses = repossessed.length ? ` Repossessed: ${repossessed.join(', ')}.` : ' No whole gift was repossessed this time.';
  return `Noel's power: you signed the musical's funding contract. For ten seconds a haunted production company ripped pieces of the scenery into a money vortex, turned nearby characters into a ghostly audience, and dragged you beneath a giant contract. Your movement and appearance dwindled temporarily. The contract drained 10% of your starting usable inventory assets (${assessed.toFixed(3)} gift units), with zero payoff.${losses} The remaining claim is ${noelAssetClaim().toFixed(3)} of a gift; fractional claims persist and repossess a carried usable gift when they reach one whole unit. The contract itself was also used up. Permanent equipment and music unlocks are protected. The stage, scenery and movement returned to normal; the asset loss remained.`;
}
