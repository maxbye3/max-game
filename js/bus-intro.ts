import {
  BUS_INTRO_BUS_BASELINE_Y,
  BUS_INTRO_CAMERA_Y,
  BUS_INTRO_PLAYER_END_Y,
  BUS_INTRO_PLAYER_START_Y,
  BUS_INTRO_STOP_X,
  FRAME_COUNT,
} from './config.js';
import type { Player } from './types.js';

const DRIVE_IN_END = 3000;
const PLAYER_WALK_END = 6000;
const DRIVE_OUT_START = 5000;
const INTRO_END = 8000;
const SKIP_SPEED_MULTIPLIER = 10;
const BUS_WIDTH = 160;
const BUS_HEIGHT = 91;
const OFFSCREEN_DISTANCE = 320;

const searchParams = new URLSearchParams(window.location.search);
const shouldPlay = !searchParams.has('door') && searchParams.get('niall') !== 'bus';
const skipButton = document.querySelector<HTMLButtonElement>('#bus-intro-skip');
const controls = document.querySelector<HTMLElement>('.controls');
const inventoryToggle = document.querySelector<HTMLElement>('#inventory-toggle');

let active = shouldPlay;
let elapsed = 0;
let playbackRate = 1;

function easeInOut(value: number): number {
  return value < 0.5 ? 2 * value * value : 1 - ((-2 * value + 2) ** 2) / 2;
}

function setGameplayUiHidden(hidden: boolean): void {
  controls?.classList.toggle('opening-intro-hidden', hidden);
  inventoryToggle?.classList.toggle('opening-intro-hidden', hidden);
}

function finishIntro(player: Player): void {
  active = false;
  player.x = BUS_INTRO_STOP_X;
  player.y = BUS_INTRO_PLAYER_END_Y;
  player.direction = 'up';
  player.frame = 0;
  player.animationTime = 0;
  if (skipButton) skipButton.hidden = true;
  setGameplayUiHidden(false);
}

function speedUpIntro(): void {
  playbackRate = SKIP_SPEED_MULTIPLIER;
  if (skipButton) skipButton.hidden = true;
}

export function setupBusIntro(): void {
  if (!active) {
    if (skipButton) skipButton.hidden = true;
    return;
  }

  setGameplayUiHidden(true);
  if (skipButton) {
    skipButton.hidden = false;
    skipButton.addEventListener('click', speedUpIntro, { once: true });
  }
}

export function isBusIntroActive(): boolean {
  return active;
}

export function isBusIntroPlayerVisible(): boolean {
  return !active || elapsed >= DRIVE_IN_END;
}

export function getBusIntroCameraCenter(): { x: number; y: number } | null {
  return active ? { x: BUS_INTRO_STOP_X, y: BUS_INTRO_CAMERA_Y } : null;
}

export function getBusIntroBus(): {
  x: number;
  y: number;
  width: number;
  height: number;
} | null {
  if (!active) return null;

  const startX = BUS_INTRO_STOP_X + OFFSCREEN_DISTANCE;
  const endX = BUS_INTRO_STOP_X - OFFSCREEN_DISTANCE;
  let x = BUS_INTRO_STOP_X;
  if (elapsed < DRIVE_IN_END) {
    const progress = easeInOut(elapsed / DRIVE_IN_END);
    x = startX + (BUS_INTRO_STOP_X - startX) * progress;
  } else if (elapsed >= DRIVE_OUT_START) {
    const progress = Math.min(1, (elapsed - DRIVE_OUT_START) / (INTRO_END - DRIVE_OUT_START));
    x = BUS_INTRO_STOP_X + (endX - BUS_INTRO_STOP_X) * progress * progress;
  }

  return { x, y: BUS_INTRO_BUS_BASELINE_Y, width: BUS_WIDTH, height: BUS_HEIGHT };
}

export function updateBusIntro(deltaTime: number, player: Player): void {
  if (!active) return;

  elapsed += deltaTime * 1000 * playbackRate;
  player.x = BUS_INTRO_STOP_X;
  player.direction = 'up';

  if (elapsed < DRIVE_IN_END) {
    player.y = BUS_INTRO_PLAYER_START_Y;
    player.frame = 0;
    player.animationTime = 0;
  } else if (elapsed < PLAYER_WALK_END) {
    const progress = Math.min(1, (elapsed - DRIVE_IN_END) / (PLAYER_WALK_END - DRIVE_IN_END));
    player.y = BUS_INTRO_PLAYER_START_Y + (BUS_INTRO_PLAYER_END_Y - BUS_INTRO_PLAYER_START_Y) * progress;
    player.animationTime = (elapsed - DRIVE_IN_END) / 1000;
    player.frame = Math.floor(player.animationTime * 11) % FRAME_COUNT;
  } else {
    player.y = BUS_INTRO_PLAYER_END_Y;
    player.frame = 0;
    player.animationTime = 0;
  }

  if (elapsed >= INTRO_END) finishIntro(player);
}
