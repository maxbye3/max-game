import { FRAME_HEIGHT, FRAME_WIDTH, SCALE, WORLD_HEIGHT, WORLD_WIDTH } from './config.js';
import { COLLISION_SHAPES } from './collision-data.js';
import { moveWithCollisions } from './movement.js';

type GeorgiaDirection = 'down' | 'left' | 'right' | 'up';

interface GeorgiaState {
  x: number;
  y: number;
  direction: GeorgiaDirection;
  moving: boolean;
  actionTime: number;
  animationTime: number;
}

const CYCLE_SPEED = 160;
const COLLISION_DISTANCE = 24;
const COLLISION_PADDING = 2;
const MIN_ACTION_TIME = 0.75;
const MAX_ACTION_TIME = 2.4;
const IDLE_CHANCE = 0.28;

// Start point for Georgia's bike loop: the path crossing just west of the
// lake, measured against the map art.
export const GEORGIA = {
  x: 1035,
  y: 385,
  width: 40,
  height: 46,
} as const;

export const georgiaState: GeorgiaState = {
  x: GEORGIA.x,
  y: GEORGIA.y,
  direction: 'down',
  moving: false,
  actionTime: 0,
  animationTime: 0,
};

export function playerCollidesWithGeorgia(x: number, y: number): boolean {
  return Math.hypot(x - georgiaState.x, y - georgiaState.y) < COLLISION_DISTANCE;
}

function chooseNextAction(): void {
  georgiaState.actionTime = MIN_ACTION_TIME + Math.random() * (MAX_ACTION_TIME - MIN_ACTION_TIME);
  georgiaState.moving = Math.random() >= IDLE_CHANCE;
  if (!georgiaState.moving) return;

  const directions: readonly GeorgiaDirection[] = ['down', 'left', 'right', 'up'];
  georgiaState.direction = directions[Math.floor(Math.random() * directions.length)] ?? 'down';
}

function collidesWithWorld(x: number, y: number): boolean {
  const footHalfWidth = Math.max(4, FRAME_WIDTH * SCALE * 0.3) + COLLISION_PADDING;
  const left = x - footHalfWidth;
  const right = x + footHalfWidth;
  const top = y - Math.max(4, FRAME_HEIGHT * SCALE * 0.18) - COLLISION_PADDING;
  const bottom = y + COLLISION_PADDING;

  return COLLISION_SHAPES.some(([shapeX, shapeY, shapeWidth, shapeHeight]) =>
    left < shapeX + shapeWidth &&
    right > shapeX &&
    top < shapeY + shapeHeight &&
    bottom > shapeY);
}

function clampToWorld(): void {
  georgiaState.x = Math.max(GEORGIA.width / 2, Math.min(WORLD_WIDTH - GEORGIA.width / 2, georgiaState.x));
  georgiaState.y = Math.max(GEORGIA.height, Math.min(WORLD_HEIGHT, georgiaState.y));
}

export function updateGeorgia(deltaTime: number): void {
  georgiaState.actionTime -= deltaTime;
  if (georgiaState.actionTime <= 0) chooseNextAction();

  if (!georgiaState.moving) {
    georgiaState.animationTime = 0;
    return;
  }

  let dx = 0;
  let dy = 0;
  if (georgiaState.direction === 'left') dx = -1;
  else if (georgiaState.direction === 'right') dx = 1;
  else if (georgiaState.direction === 'up') dy = -1;
  else dy = 1;

  const previousX = georgiaState.x;
  const previousY = georgiaState.y;
  georgiaState.animationTime += deltaTime;
  moveWithCollisions(
    georgiaState,
    dx * CYCLE_SPEED * deltaTime,
    dy * CYCLE_SPEED * deltaTime,
    collidesWithWorld,
  );
  clampToWorld();
  if (georgiaState.x === previousX && georgiaState.y === previousY) georgiaState.actionTime = 0;
}
