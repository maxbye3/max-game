import {
  BUS_INTRO_BUS_BASELINE_Y,
  BUS_INTRO_CAMERA_Y,
  BUS_INTRO_PLAYER_END_Y,
  BUS_INTRO_PLAYER_START_Y,
  BUS_INTRO_STOP_X,
  FRAME_COUNT,
} from '../core/config.js';
import { startRoadTraffic, updateRoadTraffic } from './road-traffic.js';
import type { Player } from '../core/types.js';
import { getPlayerBody } from '../core/player-body.js';

const DRIVE_IN_END = 3000;
const PLAYER_WALK_END = 6000;
const DRIVE_OUT_START = 5000;
const INTRO_END = 8000;
const SKIP_SPEED_MULTIPLIER = 10;
const BUS_WIDTH = 160;
const BUS_HEIGHT = 91;
const OFFSCREEN_DISTANCE = 320;

const searchParams = new URLSearchParams(window.location.search);
const shouldPlay = getPlayerBody() !== 'ghost' && !searchParams.has('door') && searchParams.get('niall') !== 'bus';
const skipButton = document.querySelector<HTMLButtonElement>('#bus-intro-skip');
const controls = document.querySelector<HTMLElement>('.controls');
const inventoryToggle = document.querySelector<HTMLElement>('#inventory-toggle');
const jumpToggle = document.querySelector<HTMLElement>('.movement-actions');
const musicToggle = document.querySelector<HTMLElement>('#music-toggle');

let active = shouldPlay;
let elapsed = 0;
let playbackRate = 1;
let fastForwardOverlay: HTMLElement | null = null;
let fastForwardStarted = 0;

function showFastForwardEffect(): void {
  const shell = document.querySelector<HTMLElement>('.game-shell');
  if (!shell || fastForwardOverlay) return;
  fastForwardStarted = performance.now();
  fastForwardOverlay = document.createElement('div');
  fastForwardOverlay.className = 'intro-fast-forward-overlay';
  fastForwardOverlay.setAttribute('role', 'status');
  fastForwardOverlay.setAttribute('aria-label', 'Fast forwarding intro at ten times speed');
  fastForwardOverlay.innerHTML = `<div class="intro-fast-forward-label" aria-hidden="true">
    <svg viewBox="0 0 48 24" focusable="false"><path d="M0 0h6v4h6v4h6v8h-6v4H6v4H0zM24 0h6v4h6v4h6v8h-6v4h-6v4h-6z" fill="currentColor"/></svg>
    <span>FAST FORWARD <strong>10×</strong></span>
  </div>`;
  shell.append(fastForwardOverlay);
  shell.classList.add('intro-fast-forward');
}

function endFastForwardEffect(): void {
  const overlay = fastForwardOverlay;
  if (!overlay) return;
  document.querySelector('.game-shell')?.classList.remove('intro-fast-forward');
  // Keep a late skip visible long enough to read, then fade it out.
  window.setTimeout(() => {
    overlay.classList.add('intro-fast-forward-finished');
    window.setTimeout(() => overlay.remove(), 180);
  }, Math.max(0, 650 - (performance.now() - fastForwardStarted)));
  fastForwardOverlay = null;
}

function easeInOut(value: number): number {
  return value < 0.5 ? 2 * value * value : 1 - ((-2 * value + 2) ** 2) / 2;
}

function setGameplayUiHidden(hidden: boolean): void {
  controls?.classList.toggle('opening-intro-hidden', hidden);
  inventoryToggle?.classList.toggle('opening-intro-hidden', hidden);
  jumpToggle?.classList.toggle('opening-intro-hidden', hidden);
  musicToggle?.classList.toggle('opening-intro-hidden', hidden);
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
  endFastForwardEffect();
}

function speedUpIntro(): void {
  playbackRate = SKIP_SPEED_MULTIPLIER;
  showFastForwardEffect();
  if (skipButton) skipButton.hidden = true;
}

export function setupBusIntro(): void {
  if (!active) {
    startRoadTraffic();
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

export { getRoadTrafficCars } from './road-traffic.js';

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
  if (!active) {
    updateRoadTraffic(deltaTime, player);
    return;
  }

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

  if (elapsed >= INTRO_END) {
    finishIntro(player);
    startRoadTraffic();
  }
}
