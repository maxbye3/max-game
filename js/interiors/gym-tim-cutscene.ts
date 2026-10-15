import { DOORWAYS } from '../core/doors.js';
import { isHeld, releaseAllInput } from '../core/input.js';
import { isTimAtCinema, isTimAtMusicShop, moveTimToCinema, moveTimToMusicShop } from '../characters/tim/tim-location.js';
import type { InputDirection, Player } from '../core/types.js';

const GYM_DOOR = DOORWAYS.find((doorway) => doorway.id === 'gym')!;
const MUSIC_SHOP_DOOR = DOORWAYS.find((doorway) => doorway.id === 'music-shop')!;
const GYM_TIM_LINE = "Mate, I'm off to St John for a whisky mac then fabric. See you there?";
const MUSIC_SHOP_TIM_LINE = "man can't believe it's light out. must have been in there all night. Anyway, I'm off to watch Fast Furious";
const TIM_WIDTH = 28;
const TIM_HEIGHT = 46;
const SOURCE_WIDTH = 180;
const SOURCE_HEIGHT = 296;
const WALK_STEP_DISTANCE = 15;
const DIRECTION_ROWS = { down: 0, left: 1, right: 2, up: 3 } as const satisfies Record<InputDirection, number>;
// Center each pose on its own shoe baseline; the artwork has uneven padding.
const POSE_ANCHORS = [
  [{ x: 165, y: 302 }, { x: 472, y: 302 }, { x: 780, y: 305 }, { x: 1088, y: 304 }],
  [{ x: 161, y: 614 }, { x: 466, y: 614 }, { x: 775, y: 614 }, { x: 1083, y: 613 }],
  [{ x: 165, y: 923 }, { x: 477, y: 923 }, { x: 783, y: 923 }, { x: 1097, y: 924 }],
  [{ x: 165, y: 1223 }, { x: 477, y: 1224 }, { x: 780, y: 1224 }, { x: 1090, y: 1224 }],
] as const;
const WAIT_BEFORE_STOP = 2;
const FOLLOW_SPEED = 96;
const LEAVE_SPEED = 120;
const TALK_DURATION = 3.8;
const MUSIC_SHOP_TARGET = { x: 255, y: 444 } as const;
const CINEMA_TARGET = { x: 490, y: 818 } as const;

interface TimCutsceneConfig {
  readonly door: typeof GYM_DOOR;
  readonly line: string;
  readonly target: { readonly x: number; readonly y: number };
  readonly complete: () => void;
  readonly waitForMovement: boolean;
}

function getTimCutsceneConfig(): TimCutsceneConfig | null {
  const returnDoor = new URLSearchParams(window.location.search).get('door');
  if (returnDoor === 'gym' && !isTimAtMusicShop() && !isTimAtCinema()) {
    return { door: GYM_DOOR, line: GYM_TIM_LINE, target: MUSIC_SHOP_TARGET, complete: moveTimToMusicShop, waitForMovement: false };
  }
  if (returnDoor === 'music-shop' && isTimAtMusicShop()) {
    return { door: MUSIC_SHOP_DOOR, line: MUSIC_SHOP_TIM_LINE, target: CINEMA_TARGET, complete: moveTimToCinema, waitForMovement: true };
  }
  return null;
}

type TimCutscenePhase = 'inactive' | 'waiting' | 'following' | 'talking' | 'leaving' | 'done';

interface TimCutsceneState {
  phase: TimCutscenePhase;
  timer: number;
  x: number;
  y: number;
  lineVisible: boolean;
  direction: InputDirection;
  walkDistance: number;
  moving: boolean;
}

const cutsceneConfig = getTimCutsceneConfig();

const state: TimCutsceneState = {
  phase: cutsceneConfig ? 'waiting' : 'inactive',
  timer: 0,
  x: (cutsceneConfig?.door ?? GYM_DOOR).x + (cutsceneConfig?.door ?? GYM_DOOR).width / 2,
  y: (cutsceneConfig?.door ?? GYM_DOOR).y + (cutsceneConfig?.door ?? GYM_DOOR).height + 12,
  lineVisible: false,
  direction: 'down',
  walkDistance: 0,
  moving: false,
};

function moveToward(targetX: number, targetY: number, speed: number, deltaTime: number): boolean {
  const dx = targetX - state.x;
  const dy = targetY - state.y;
  const distance = Math.hypot(dx, dy);
  if (distance <= 2) {
    state.x = targetX;
    state.y = targetY;
    return true;
  }

  const step = Math.min(distance, speed * deltaTime);
  if (step <= 0) return false;
  state.direction = Math.abs(dx) > Math.abs(dy)
    ? dx < 0 ? 'left' : 'right'
    : dy < 0 ? 'up' : 'down';
  state.walkDistance += step;
  state.moving = true;
  state.x += (dx / distance) * step;
  state.y += (dy / distance) * step;
  return false;
}

function startFollowing(): void {
  if (!cutsceneConfig) return;
  releaseAllInput();
  state.phase = 'following';
  state.timer = 0;
  state.x = cutsceneConfig.door.x + cutsceneConfig.door.width / 2;
  state.y = cutsceneConfig.door.y + cutsceneConfig.door.height + 12;
}

export function isGymTimCutsceneBlockingPlayer(): boolean {
  return state.phase === 'following' || state.phase === 'talking';
}

export function shouldHideMapTim(): boolean {
  return state.phase !== 'inactive';
}

export function updateGymTimCutscene(deltaTime: number, player: Player): void {
  state.moving = false;
  if (state.phase === 'inactive' || state.phase === 'done') return;

  state.timer += deltaTime;
  if (state.phase === 'waiting') {
    if (state.timer >= WAIT_BEFORE_STOP) startFollowing();
    return;
  }

  if (state.phase === 'following') {
    const targetX = player.x + 32;
    const targetY = player.y + 4;
    if (moveToward(targetX, targetY, FOLLOW_SPEED, deltaTime)) {
      state.phase = 'talking';
      state.timer = 0;
      state.lineVisible = true;
      state.direction = player.x < state.x ? 'left' : 'right';
      state.walkDistance = 0;
    }
    return;
  }

  if (state.phase === 'talking') {
    const shouldLeave = cutsceneConfig?.waitForMovement
      ? isHeld('up') || isHeld('down') || isHeld('left') || isHeld('right')
      : state.timer >= TALK_DURATION;
    if (shouldLeave) {
      state.phase = 'leaving';
      state.timer = 0;
      state.lineVisible = false;
    }
    return;
  }

  if (state.phase === 'leaving' && cutsceneConfig && moveToward(cutsceneConfig.target.x, cutsceneConfig.target.y, LEAVE_SPEED, deltaTime)) {
    state.phase = 'done';
    cutsceneConfig.complete();
  }
}

export function drawGymTimCutscene(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  cameraX: number,
  cameraY: number,
): void {
  if (state.phase === 'inactive' || state.phase === 'done' || !image.complete || image.naturalWidth === 0) return;

  // Each direction has a neutral pose, stride, passing pose and opposite stride.
  // Advance by distance so his feet keep pace during both following and leaving.
  const column = state.moving ? Math.floor(state.walkDistance / WALK_STEP_DISTANCE) % 4 : 0;
  const poses = POSE_ANCHORS[DIRECTION_ROWS[state.direction]];
  const anchor = poses[column] ?? poses[0];

  context.save();
  context.imageSmoothingEnabled = false;
  context.drawImage(
    image,
    anchor.x - SOURCE_WIDTH / 2,
    anchor.y - SOURCE_HEIGHT,
    SOURCE_WIDTH,
    SOURCE_HEIGHT,
    Math.round(state.x - cameraX - TIM_WIDTH / 2),
    Math.round(state.y - cameraY - TIM_HEIGHT),
    TIM_WIDTH,
    TIM_HEIGHT,
  );
  context.restore();
}

export function getGymTimCutsceneDialogue(): { text: string; x: number; y: number } | null {
  if (!state.lineVisible) return null;
  return { text: cutsceneConfig?.line ?? '', x: state.x, y: state.y - TIM_HEIGHT };
}
