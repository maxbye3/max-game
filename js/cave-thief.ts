import { SPEED, WORLD_HEIGHT, WORLD_WIDTH } from './config.js';
import { buildThiefPath, thiefPathCell, type PathPoint } from './cave-thief-path.js';
import { CAVE_DOOR_ID, hasCaveColander } from './colander.js';
import { playerCollidesAt } from './collision.js';
import { DOORWAYS } from './doors.js';
import { moveWithCollisions } from './movement.js';

type ThiefPhase =
  | 'hidden'
  | 'waiting'
  | 'panToEntrance'
  | 'message'
  | 'panToPlayer'
  | 'chasing';
export type CaveThiefDirection = 'down' | 'left' | 'right' | 'up';

type CameraCenter = PathPoint;

interface ThiefState {
  phase: ThiefPhase;
  x: number;
  y: number;
  returnTime: number;
  phaseStart: number;
  panFrom: CameraCenter;
  path: CameraCenter[];
  repathTimer: number;
  targetCell: number;
  direction: CaveThiefDirection;
  frame: number;
  animationTime: number;
}

const CAVE_DOOR = DOORWAYS.find((doorway) => doorway.id === CAVE_DOOR_ID);
const THIEF_SIZE = 24;
const SEQUENCE_DELAY = 5000;
const PAN_DURATION = 1200;
const MESSAGE_DURATION = 1800;
const PATH_REFRESH_INTERVAL = 0.22;
const MESSAGE = 'Come back here you thief!';

const entrance = {
  x: CAVE_DOOR ? CAVE_DOOR.x + CAVE_DOOR.width / 2 : 236,
  y: CAVE_DOOR ? CAVE_DOOR.y + CAVE_DOOR.height + 16 : 284,
};

const state: ThiefState = {
  phase: 'hidden',
  x: entrance.x,
  y: entrance.y,
  returnTime: 0,
  phaseStart: 0,
  panFrom: { x: entrance.x, y: entrance.y },
  path: [],
  repathTimer: 0,
  targetCell: -1,
  direction: 'down',
  frame: 0,
  animationTime: 0,
};

function readReturnedFromCave(): boolean {
  const params = new URLSearchParams(window.location.search);
  if (params.get('door') !== CAVE_DOOR_ID || params.get('colander') !== '1') return false;
  return hasCaveColander();
}

export function setupCaveThief(): void {
  if (!readReturnedFromCave()) return;
  state.phase = 'waiting';
  state.returnTime = performance.now();
  state.x = entrance.x;
  state.y = entrance.y;
}

export function isCaveTheftCutsceneActive(): boolean {
  return state.phase === 'panToEntrance' ||
    state.phase === 'message' ||
    state.phase === 'panToPlayer';
}

export function getCaveThiefDialogue(): string | null {
  return state.phase === 'message' ? MESSAGE : null;
}

export function getCaveThief(): {
  x: number;
  y: number;
  size: number;
  direction: CaveThiefDirection;
  frame: number;
  moving: boolean;
} | null {
  if (state.phase === 'hidden' || state.phase === 'waiting' || state.phase === 'panToEntrance') {
    return null;
  }
  return {
    x: state.x,
    y: state.y,
    size: THIEF_SIZE,
    direction: state.direction,
    frame: state.frame,
    moving: state.phase === 'chasing',
  };
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - ((-2 * t + 2) ** 2) / 2;
}

export function getCaveTheftCameraCenter(playerX: number, playerY: number, time: number): CameraCenter {
  if (state.phase === 'panToEntrance') {
    const progress = easeInOut(Math.min(1, (time - state.phaseStart) / PAN_DURATION));
    return {
      x: state.panFrom.x + (entrance.x - state.panFrom.x) * progress,
      y: state.panFrom.y + (entrance.y - state.panFrom.y) * progress,
    };
  }

  if (state.phase === 'message') return entrance;

  if (state.phase === 'panToPlayer') {
    const progress = easeInOut(Math.min(1, (time - state.phaseStart) / PAN_DURATION));
    return {
      x: entrance.x + (playerX - entrance.x) * progress,
      y: entrance.y + (playerY - entrance.y) * progress,
    };
  }

  return { x: playerX, y: playerY };
}

function isBlocked(x: number, y: number): boolean {
  const half = THIEF_SIZE / 2;
  if (x - half < 0 || x + half > WORLD_WIDTH || y - THIEF_SIZE < 0 || y > WORLD_HEIGHT) return true;
  return (
    playerCollidesAt(x - half * 0.6, y) ||
    playerCollidesAt(x + half * 0.6, y) ||
    playerCollidesAt(x, y - THIEF_SIZE * 0.3) ||
    playerCollidesAt(x, y)
  );
}

function updateChase(deltaTime: number, targetX: number, targetY: number, speedMultiplier: number): void {
  state.repathTimer -= deltaTime;
  const targetCell = thiefPathCell(targetX, targetY);
  if (state.repathTimer <= 0 || targetCell !== state.targetCell || state.path.length === 0) {
    state.repathTimer = PATH_REFRESH_INTERVAL;
    const path = buildThiefPath(state.x, state.y, targetX, targetY, isBlocked);
    state.targetCell = path.targetCell;
    state.path = path.points;
  }

  const waypoint = state.path[0] ?? { x: targetX, y: targetY };
  const dx = waypoint.x - state.x;
  const dy = waypoint.y - state.y;
  const distance = Math.hypot(dx, dy);
  if (distance < 6) {
    state.path.shift();
    return;
  }

  const speed = SPEED * speedMultiplier;
  if (Math.abs(dx) > Math.abs(dy)) state.direction = dx < 0 ? 'left' : 'right';
  else state.direction = dy < 0 ? 'up' : 'down';
  state.animationTime += deltaTime;
  state.frame = Math.floor(state.animationTime * 9);
  moveWithCollisions(
    state,
    (dx / distance) * speed * deltaTime,
    (dy / distance) * speed * deltaTime,
    isBlocked,
  );
}

export function updateCaveThief(
  deltaTime: number,
  time: number,
  playerX: number,
  playerY: number,
  speedMultiplier: number,
): void {
  if (state.phase === 'hidden') return;

  if (state.phase === 'waiting') {
    if (time - state.returnTime < SEQUENCE_DELAY) return;
    state.phase = 'panToEntrance';
    state.phaseStart = time;
    state.panFrom = { x: playerX, y: playerY };
    return;
  }

  if (state.phase === 'panToEntrance' && time - state.phaseStart >= PAN_DURATION) {
    state.phase = 'message';
    state.phaseStart = time;
    return;
  }

  if (state.phase === 'message' && time - state.phaseStart >= MESSAGE_DURATION) {
    state.phase = 'panToPlayer';
    state.phaseStart = time;
    return;
  }

  if (state.phase === 'panToPlayer' && time - state.phaseStart >= PAN_DURATION) {
    state.phase = 'chasing';
    state.path = [];
    state.repathTimer = 0;
    state.animationTime = 0;
    state.frame = 0;
    return;
  }

  if (state.phase === 'chasing') updateChase(deltaTime, playerX, playerY, speedMultiplier);
}
