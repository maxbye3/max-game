import { ROAD_HEIGHT, ROAD_WIDTH, ROAD_X, ROAD_Y } from '../core/config.js';
import type { Player } from '../core/types.js';
import { hasVisitedInterior } from '../core/world-state.js';

const CAR_SPRITE_COUNT = 6;
const CAR_SPEED = 220;
const ROAD_ENTRY_CAR_DELAY_MS = 5000;

export const ROAD_CAR_WIDTH = 132;
export const ROAD_CAR_CENTER_Y = ROAD_Y + ROAD_HEIGHT * 0.76;
const ROAD_CAR_HIT_HALF_HEIGHT = 20;

export interface RoadTrafficCar {
  readonly spriteIndex: number;
  readonly x: number;
  readonly stopped: boolean;
}

const cars: { spriteIndex: number; x: number; previousX: number; stopped: boolean }[] = [];
let trafficEnabled = false;
let playerWasOnRoad = false;
const pendingCarsMs: number[] = [];
let nextSpriteIndex = 0;

export function startRoadTraffic(): void {
  trafficEnabled = hasVisitedInterior();
}

export function updateRoadTraffic(deltaTime: number, player: Pick<Player, 'x' | 'y'>): void {
  if (!trafficEnabled || deltaTime <= 0) return;

  for (const car of cars) {
    car.previousX = car.x;
    if (!car.stopped) car.x -= CAR_SPEED * deltaTime;
  }
  for (let index = cars.length - 1; index >= 0; index -= 1) {
    if ((cars[index]?.x ?? ROAD_X) + ROAD_CAR_WIDTH < ROAD_X) cars.splice(index, 1);
  }

  for (let index = 0; index < pendingCarsMs.length; index += 1) {
    pendingCarsMs[index] = (pendingCarsMs[index] ?? 0) - deltaTime * 1000;
  }
  while ((pendingCarsMs[0] ?? Infinity) <= 0) {
    pendingCarsMs.shift();
    cars.push({ spriteIndex: nextSpriteIndex, x: ROAD_X + ROAD_WIDTH, previousX: ROAD_X + ROAD_WIDTH, stopped: false });
    nextSpriteIndex = (nextSpriteIndex + 1) % CAR_SPRITE_COUNT;
  }

  const playerIsOnRoad = player.x >= ROAD_X && player.x <= ROAD_X + ROAD_WIDTH &&
    player.y >= ROAD_Y && player.y <= ROAD_Y + ROAD_HEIGHT;
  if (playerIsOnRoad && !playerWasOnRoad) pendingCarsMs.push(ROAD_ENTRY_CAR_DELAY_MS);
  playerWasOnRoad = playerIsOnRoad;
}

export function getRoadTrafficCars(): readonly RoadTrafficCar[] {
  return cars.map(({ spriteIndex, x, stopped }) => ({ spriteIndex, x, stopped }));
}

/** Sweep the car's travel so a fast frame cannot skip over the player. */
export function stopRoadCarOnPlayer(x: number, y: number): boolean {
  if (Math.abs(y - ROAD_CAR_CENTER_Y) > ROAD_CAR_HIT_HALF_HEIGHT) return false;
  const car = cars.find((candidate) => !candidate.stopped &&
    x + 10 >= candidate.x && x - 10 <= candidate.previousX + ROAD_CAR_WIDTH);
  if (!car) return false;
  car.x = x - ROAD_CAR_WIDTH / 2;
  car.previousX = car.x;
  car.stopped = true;
  return true;
}
