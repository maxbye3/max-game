import { isHeld } from './input.js';

export const KATY_POWER_DURATION = 10_000;
const FIRST_TRIP_DELAY = 700;
const TRIP_DURATION = 650;
const TRIP_INTERVAL = 1_800;

let powerEndsAt = 0;
let tripEndsAt = 0;
let nextTripAt = 0;

function movementIsHeld(): boolean {
  return isHeld('left') || isHeld('right') || isHeld('up') || isHeld('down');
}

export function activateKatyPower(now = performance.now()): void {
  powerEndsAt = now + KATY_POWER_DURATION;
  tripEndsAt = 0;
  nextTripAt = now + FIRST_TRIP_DELAY;
}

/** Returns true once, on the frame the power expires. */
export function updateKatyPower(now: number, moving = movementIsHeld()): boolean {
  if (powerEndsAt === 0) return false;
  if (now >= powerEndsAt) {
    powerEndsAt = 0;
    tripEndsAt = 0;
    nextTripAt = 0;
    return true;
  }
  if (moving && now >= nextTripAt && now >= tripEndsAt) {
    tripEndsAt = Math.min(now + TRIP_DURATION, powerEndsAt);
    nextTripAt = now + TRIP_INTERVAL;
  }
  return false;
}

export function katyPowerSecondsLeft(now: number): number {
  return powerEndsAt === 0 ? 0 : Math.max(0, (powerEndsAt - now) / 1000);
}

export function isPlayerTripping(now = performance.now()): boolean {
  return powerEndsAt > now && tripEndsAt > now;
}
