import { ROAD_HEIGHT, ROAD_WIDTH, ROAD_X, ROAD_Y } from '../core/config.js';

const CAR_SPRITE_COUNT = 6;
const CAR_SPEED = 220;
const FIRST_CAR_DELAY_MS = 30000;
const CAR_INTERVAL_MS = 20000;

export const ROAD_CAR_WIDTH = 132;
export const ROAD_CAR_CENTER_Y = ROAD_Y + ROAD_HEIGHT * 0.76;

export interface RoadTrafficCar {
  readonly spriteIndex: number;
  readonly x: number;
}

const cars: { spriteIndex: number; x: number }[] = [];
let trafficStarted = false;
let timeUntilNextCarMs = 0;
let nextSpriteIndex = 0;

export function startRoadTraffic(): void {
  if (trafficStarted) return;
  trafficStarted = true;
  timeUntilNextCarMs = FIRST_CAR_DELAY_MS;
}

export function updateRoadTraffic(deltaTime: number): void {
  if (!trafficStarted || deltaTime <= 0) return;

  for (const car of cars) car.x -= CAR_SPEED * deltaTime;
  for (let index = cars.length - 1; index >= 0; index -= 1) {
    if ((cars[index]?.x ?? ROAD_X) + ROAD_CAR_WIDTH < ROAD_X) cars.splice(index, 1);
  }

  timeUntilNextCarMs -= deltaTime * 1000;
  if (timeUntilNextCarMs <= 0) {
    cars.push({ spriteIndex: nextSpriteIndex, x: ROAD_X + ROAD_WIDTH });
    nextSpriteIndex = (nextSpriteIndex + 1) % CAR_SPRITE_COUNT;
    timeUntilNextCarMs = CAR_INTERVAL_MS;
  }
}

export function getRoadTrafficCars(): readonly RoadTrafficCar[] {
  return cars.map((car) => ({ ...car }));
}
