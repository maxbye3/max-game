import { readStorage, writeStorage } from './storage.js';

export const PLAYER_MAX_HEALTH = 100;
const HEALTH_KEY = 'max-game:player-health';
const storedHealth = Number(readStorage(HEALTH_KEY) ?? PLAYER_MAX_HEALTH);
let health = Number.isFinite(storedHealth) ? Math.round(Math.max(0, Math.min(PLAYER_MAX_HEALTH, storedHealth)) * 1_000_000) / 1_000_000 : PLAYER_MAX_HEALTH;

export const getPlayerHealth = (): number => health;
export function resetPlayerHealth(): void {
  health = PLAYER_MAX_HEALTH;
  writeStorage(HEALTH_KEY, String(health));
}
export function damagePlayerHealth(amount: number): void {
  health = Math.round(Math.max(0, health - Math.max(0, amount)) * 1_000_000) / 1_000_000;
  writeStorage(HEALTH_KEY, String(health));
}
