import { DOORWAYS } from './doors.js';
import { requireElement } from './dom.js';
import { releaseAllInput } from './input.js';
import { isTimAtCinema, isTimAtMusicShop, moveTimToCinema, moveTimToMusicShop } from './tim-location.js';
import type { Player } from './types.js';

const GYM_DOOR = DOORWAYS.find((doorway) => doorway.id === 'gym')!;
const MUSIC_SHOP_DOOR = DOORWAYS.find((doorway) => doorway.id === 'music-shop')!;
const GYM_TIM_LINE = "Mate, I'm off to St John for a whisky mac then fabric. See you there?";
const MUSIC_SHOP_TIM_LINE = "man can't believe it's light out. must have been in there all night. Anyway, I'm off to watch Fast Furious";
const TIM_WIDTH = 28;
const TIM_HEIGHT = 52;
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
  readonly requiresAdvance: boolean;
}

function getTimCutsceneConfig(): TimCutsceneConfig | null {
  const returnDoor = new URLSearchParams(window.location.search).get('door');
  if (returnDoor === 'gym' && !isTimAtMusicShop() && !isTimAtCinema()) {
    return { door: GYM_DOOR, line: GYM_TIM_LINE, target: MUSIC_SHOP_TARGET, complete: moveTimToMusicShop, requiresAdvance: false };
  }
  if (returnDoor === 'music-shop' && isTimAtMusicShop()) {
    return { door: MUSIC_SHOP_DOOR, line: MUSIC_SHOP_TIM_LINE, target: CINEMA_TARGET, complete: moveTimToCinema, requiresAdvance: true };
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
}

const cutsceneConfig = getTimCutsceneConfig();
const nextButton = requireElement<HTMLButtonElement>('#tim-cutscene-next');

const state: TimCutsceneState = {
  phase: cutsceneConfig ? 'waiting' : 'inactive',
  timer: 0,
  x: (cutsceneConfig?.door ?? GYM_DOOR).x + (cutsceneConfig?.door ?? GYM_DOOR).width / 2,
  y: (cutsceneConfig?.door ?? GYM_DOOR).y + (cutsceneConfig?.door ?? GYM_DOOR).height + 12,
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
  if (!cutsceneConfig) return;
  releaseAllInput();
  state.phase = 'following';
  state.timer = 0;
  state.x = cutsceneConfig.door.x + cutsceneConfig.door.width / 2;
  state.y = cutsceneConfig.door.y + cutsceneConfig.door.height + 12;
}

function syncNextButton(): void {
  nextButton.hidden = !(cutsceneConfig?.requiresAdvance && state.phase === 'talking');
}

export function advanceGymTimCutscene(): void {
  if (state.phase !== 'talking' || !cutsceneConfig?.requiresAdvance) return;
  state.phase = 'leaving';
  state.timer = 0;
  state.lineVisible = false;
  syncNextButton();
}

export function setupGymTimCutscene(): void {
  nextButton.addEventListener('click', advanceGymTimCutscene);
  nextButton.hidden = true;
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
      syncNextButton();
    }
    return;
  }

  if (state.phase === 'talking') {
    if (cutsceneConfig?.requiresAdvance) return;
    if (state.timer >= TALK_DURATION) {
      state.phase = 'leaving';
      state.timer = 0;
      state.lineVisible = false;
      syncNextButton();
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
  return { text: cutsceneConfig?.line ?? '', x: state.x, y: state.y - TIM_HEIGHT };
}
