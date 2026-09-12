import { DOORWAYS } from './doors.js';
import { releaseAllInput } from './input.js';
import type { Player } from './types.js';

const GYM_DOOR = DOORWAYS.find((doorway) => doorway.id === 'gym')!;
const TIM_LINE = "Mate, I'm off to St John for a whisky mac then fabric. See you there?";
const TIM_WIDTH = 28;
const TIM_HEIGHT = 52;
const WAIT_BEFORE_STOP = 2;
const FOLLOW_SPEED = 96;
const LEAVE_SPEED = 120;
const TALK_DURATION = 3.8;
const MUSIC_SHOP_TARGET = { x: 255, y: 444 } as const;

type TimCutscenePhase = 'inactive' | 'waiting' | 'following' | 'talking' | 'leaving' | 'done';

interface TimCutsceneState {
  phase: TimCutscenePhase;
  timer: number;
  x: number;
  y: number;
  lineVisible: boolean;
}

const searchParams = new URLSearchParams(window.location.search);
const triggeredByGymReturn = searchParams.get('door') === 'gym';

const state: TimCutsceneState = {
  phase: triggeredByGymReturn ? 'waiting' : 'inactive',
  timer: 0,
  x: GYM_DOOR.x + GYM_DOOR.width / 2,
  y: GYM_DOOR.y + GYM_DOOR.height + 12,
  lineVisible: false,
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
  state.x += (dx / distance) * step;
  state.y += (dy / distance) * step;
  return false;
}

function startFollowing(): void {
  releaseAllInput();
  state.phase = 'following';
  state.timer = 0;
  state.x = GYM_DOOR.x + GYM_DOOR.width / 2;
  state.y = GYM_DOOR.y + GYM_DOOR.height + 12;
}

export function isGymTimCutsceneBlockingPlayer(): boolean {
  return state.phase === 'following' || state.phase === 'talking';
}

export function shouldHideMapTim(): boolean {
  return state.phase !== 'inactive';
}

export function updateGymTimCutscene(deltaTime: number, player: Player): void {
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
    }
    return;
  }

  if (state.phase === 'talking') {
    if (state.timer >= TALK_DURATION) {
      state.phase = 'leaving';
      state.timer = 0;
      state.lineVisible = false;
    }
    return;
  }

  if (state.phase === 'leaving' && moveToward(MUSIC_SHOP_TARGET.x, MUSIC_SHOP_TARGET.y, LEAVE_SPEED, deltaTime)) {
    state.phase = 'done';
  }
}

export function drawGymTimCutscene(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  cameraX: number,
  cameraY: number,
): void {
  if (state.phase === 'inactive' || state.phase === 'done') return;

  context.save();
  context.imageSmoothingEnabled = false;
  context.drawImage(
    image,
    Math.round(state.x - cameraX - TIM_WIDTH / 2),
    Math.round(state.y - cameraY - TIM_HEIGHT),
    TIM_WIDTH,
    TIM_HEIGHT,
  );
  context.restore();
}

export function getGymTimCutsceneDialogue(): { text: string; x: number; y: number } | null {
  if (!state.lineVisible) return null;
  return { text: TIM_LINE, x: state.x, y: state.y - TIM_HEIGHT };
}
