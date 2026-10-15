import { readStorage, writeStorage } from '../../core/storage.js';
import type { SamPowerTarget } from '../sam/sam-power.js';

export const LUCY_POWER_DURATION = 20_000;
export const LUCY_JET_RANGE = 650;
export interface LucyJet { readonly x: number; readonly y: number; readonly endX: number; readonly endY: number; readonly at: number }
export interface LucyGuest extends SamPowerTarget { readonly reachedAt: number }
const CAP_KEY = 'max-game:lucy-solar-cap-equipped';
// Keep previously collected caps wearable; the new power no longer awards them.
let capEquipped = readStorage(CAP_KEY) === 'true';
export const isLucyCapEquipped = (): boolean => capEquipped;
export function setLucyCapEquipped(equipped: boolean): void { capEquipped = equipped; writeStorage(CAP_KEY, String(equipped)); }
let startedAt = Infinity;
let nextJetAt = 0;
let hitCount = 0;
const hitCharacters = new Set<string>();
const protagonist = { x: 0, y: 0 };
const aim = { x: 0, y: 0, firing: false };
const guests = new Map<string, LucyGuest>();
const jets: LucyJet[] = [];

export function activateLucyPower(now = performance.now()): void {
  startedAt = now; nextJetAt = now; hitCount = 0;
  aim.firing = false; guests.clear(); jets.length = 0; hitCharacters.clear();
}
export const isLucyPowerActive = (now = performance.now()): boolean => now >= startedAt && now < startedAt + LUCY_POWER_DURATION;
export const lucyPowerSecondsLeft = (now = performance.now()): number => isLucyPowerActive(now) ? (startedAt + LUCY_POWER_DURATION - now) / 1000 : 0;
export const lucyPowerElapsed = (now: number): number => Math.max(0, now - startedAt);
export const lucyVisualStrength = (now: number): number => isLucyPowerActive(now) ? Math.min(1, lucyPowerElapsed(now) / 250, lucyPowerSecondsLeft(now) / 0.5) : 0;
export const lucyMovementMultiplier = (): number => 1;
export const getLucyProtagonist = () => protagonist as Readonly<typeof protagonist>;
export const getLucyAim = () => aim as Readonly<typeof aim>;
export const getLucyGuests = (): readonly LucyGuest[] => [...guests.values()];
export const getLucyGuest = (id: string): LucyGuest | undefined => guests.get(id);
export const getLucyJets = (): readonly LucyJet[] => jets;
export const getLucyHitStats = () => ({ hits: hitCount, characters: hitCharacters.size });
export function setLucyAim(x: number, y: number, firing: boolean): void { aim.x = x; aim.y = y; aim.firing = firing; }
export function stopLucyFiring(): void { aim.firing = false; }

/** Jets hit actual character bodies along the aimed segment, including moving NPCs. */
export function updateLucyWorld(now: number, x: number, y: number, targets: readonly SamPowerTarget[], playerHeight = 36): void {
  protagonist.x = x; protagonist.y = y;
  if (!isLucyPowerActive(now)) { guests.clear(); jets.length = 0; stopLucyFiring(); return; }
  const present = new Map(targets.map((target) => [target.id, target]));
  for (const [id, guest] of guests) {
    const target = present.get(id);
    if (!target || now - guest.reachedAt >= 2000) guests.delete(id);
    else guests.set(id, { ...guest, ...target });
  }
  while (jets.length && now - jets[0]!.at >= 180) jets.shift();
  if (!aim.firing || now < nextJetAt) return;
  const startY = y - playerHeight * 0.55;
  const dx = aim.x - x; const dy = aim.y - startY;
  const distance = Math.hypot(dx, dy);
  if (distance < 1) return;
  const length = Math.min(distance, LUCY_JET_RANGE);
  const endX = x + dx / distance * length; const endY = startY + dy / distance * length;
  jets.push({ x, y: startY, endX, endY, at: now }); nextJetAt = now + 90;
  for (const target of targets) {
    const bodyY = target.y - target.height * 0.5;
    const along = ((target.x - x) * dx / distance + (bodyY - startY) * dy / distance) / length;
    const t = Math.max(0, Math.min(1, along));
    const miss = Math.hypot(target.x - (x + (endX - x) * t), bodyY - (startY + (endY - startY) * t));
    if (miss > Math.max(12, target.height * 0.25)) continue;
    const previous = guests.get(target.id);
    if (previous && now - previous.reachedAt < 400) continue;
    guests.set(target.id, { ...target, reachedAt: now }); hitCount++; hitCharacters.add(target.id);
  }
}

export function lucyCharacterPose(id: string, now: number): { x: number; y: number; lean: number; scale: number } {
  const neutral = { x: 0, y: 0, lean: 0, scale: 1 };
  if (!isLucyPowerActive(now)) return neutral;
  if (id === 'player') return { x: 0, y: -Math.abs(Math.sin(lucyPowerElapsed(now) / 180)) * 3, lean: 0, scale: 1 };
  const guest = guests.get(id);
  if (!guest || now - guest.reachedAt >= 450) return neutral;
  const kick = Math.sin((now - guest.reachedAt) / 450 * Math.PI);
  return { x: Math.sign(guest.x - protagonist.x) * kick * 8, y: -kick * 4, lean: kick * 0.08, scale: 1 };
}
export function lucyPowerReveal(): string {
  return `Lucy's power: her mayonnaise transformed you into a mayo god for twenty seconds. Your hair turned white and spiky, mayo poured out of every house, and holding the mouse button (or touching and dragging on the game) squirted jets toward your aim. You splattered ${hitCharacters.size} ${hitCharacters.size === 1 ? 'character' : 'characters'} with ${hitCount} ${hitCount === 1 ? 'hit' : 'hits'}. The hair, jets, splashes and house mayo disappeared when the power ended.`;
}
