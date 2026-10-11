import { ROAD_HEIGHT, ROAD_WIDTH, ROAD_X, ROAD_Y } from './config.js';

const CAR_SPRITE_COUNT = 6;
const CAR_SPEED = 220;
const MIN_CAR_INTERVAL_MS = 3000;
const MAX_CAR_INTERVAL_MS = 5000;

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

function nextCarIntervalMs(): number {
  return MIN_CAR_INTERVAL_MS + Math.random() * (MAX_CAR_INTERVAL_MS - MIN_CAR_INTERVAL_MS);
}

export function startRoadTraffic(): void {
  if (trafficStarted) return;
  trafficStarted = true;
  timeUntilNextCarMs = nextCarIntervalMs();
}

export function updateRoadTraffic(deltaTime: number): void {
  if (!trafficStarted || deltaTime <= 0) return;

  for (const car of cars) car.x += CAR_SPEED * deltaTime;
  const roadEnd = ROAD_X + ROAD_WIDTH;
  for (let index = cars.length - 1; index >= 0; index -= 1) {
    if ((cars[index]?.x ?? roadEnd) > roadEnd) cars.splice(index, 1);
  }

  timeUntilNextCarMs -= deltaTime * 1000;
  if (timeUntilNextCarMs <= 0) {
    cars.push({ spriteIndex: nextSpriteIndex, x: ROAD_X - ROAD_CAR_WIDTH });
    nextSpriteIndex = (nextSpriteIndex + 1) % CAR_SPRITE_COUNT;
    timeUntilNextCarMs = nextCarIntervalMs();
  }
}

export function getRoadTrafficCars(): readonly RoadTrafficCar[] {
  return cars.map((car) => ({ ...car }));
}
