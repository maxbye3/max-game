import { requireElement } from './dom.js';
import {
  BUS_INTRO_PLAYER_END_Y,
  BUS_INTRO_STOP_X,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from './config.js';
import {
  getNiallQuestState,
  setNiallQuestState,
} from './world-state.js';
import { releaseAllInput } from './input.js';
import type { Direction } from './types.js';

const CONTACT_DISTANCE = 30;
const VERTICAL_SIGHT_HALF_WIDTH = 16;
const VERTICAL_SIGHT_DISTANCE = 180;
const CHASE_SPEED = 235;
const FRAME_COUNT = 4;
const FRAME_RATE = 9;
const BATTLE_TRANSITION_DURATION = 2700;
const BUS_STOP_DISTANCE = 58;

export const NIALL = {
  x: 792,
  y: 391,
  width: 28,
  height: 40,
} as const;

export const NIALL_BUS_STOP = {
  triggerX: BUS_INTRO_STOP_X,
  triggerY: BUS_INTRO_PLAYER_END_Y,
  x: BUS_INTRO_STOP_X + 36,
  y: BUS_INTRO_PLAYER_END_Y,
} as const;

const gameShell = requireElement<HTMLElement>('.game-shell');
let questState = getNiallQuestState();

export const niallState: {
  x: number;
  y: number;
  direction: Direction;
  frame: number;
  animationTime: number;
} = {
  x: questState === 'busStop' ? NIALL_BUS_STOP.x : NIALL.x,
  y: questState === 'busStop' ? NIALL_BUS_STOP.y : NIALL.y,
  direction: 'down',
  frame: 0,
  animationTime: 0,
};

export const isNiallFollowing = () => questState === 'following';
let battleTransitionActive = false;
let alertActive = false;

export const isNiallBattleTransitionActive = () => battleTransitionActive;
export const isNiallAlertActive = () => alertActive;

function startFight(): void {
  if (questState !== 'hostile' || battleTransitionActive) return;
  battleTransitionActive = true;
  releaseAllInput();

  const transition = document.createElement('div');
  transition.className = 'battle-transition';
  transition.setAttribute('aria-hidden', 'true');
  for (let index = 0; index < 12; index += 1) {
    const band = document.createElement('span');
    band.style.setProperty('--band-index', String(index));
    transition.append(band);
  }
  gameShell.append(transition);

  window.setTimeout(() => {
    window.location.assign('niall-fight/index.html');
  }, BATTLE_TRANSITION_DURATION);
}

function setDirection(dx: number, dy: number): void {
  if (Math.abs(dx) > Math.abs(dy) * 1.7) {
    niallState.direction = dx < 0 ? 'left' : 'right';
  } else if (Math.abs(dy) > Math.abs(dx) * 1.7) {
    niallState.direction = dy < 0 ? 'up' : 'down';
  } else if (dx < 0 && dy < 0) {
    niallState.direction = 'upLeft';
  } else if (dx > 0 && dy < 0) {
    niallState.direction = 'upRight';
  } else if (dx < 0 && dy > 0) {
    niallState.direction = 'downLeft';
  } else if (dx > 0 && dy > 0) {
    niallState.direction = 'downRight';
  }
}

function chasePlayer(deltaTime: number, dx: number, dy: number, distance: number): void {
  setDirection(dx, dy);
  niallState.x = Math.max(NIALL.width / 2, Math.min(WORLD_WIDTH - NIALL.width / 2, niallState.x + (dx / distance) * CHASE_SPEED * deltaTime));
  niallState.y = Math.max(NIALL.height, Math.min(WORLD_HEIGHT, niallState.y + (dy / distance) * CHASE_SPEED * deltaTime));
  niallState.animationTime += deltaTime;
  niallState.frame = Math.floor(niallState.animationTime * FRAME_RATE) % FRAME_COUNT;
}

export function updateNiallInteraction(deltaTime: number, playerX: number, playerY: number): void {
  if (isNiallFollowing()) {
    if (Math.hypot(playerX - NIALL_BUS_STOP.triggerX, playerY - NIALL_BUS_STOP.triggerY) <= BUS_STOP_DISTANCE) {
      questState = 'busStop';
      setNiallQuestState(questState);
      niallState.x = NIALL_BUS_STOP.x;
      niallState.y = NIALL_BUS_STOP.y;
      niallState.direction = 'down';
      niallState.frame = 0;
      niallState.animationTime = 0;
    }
    return;
  }
  if (questState === 'busStop') return;
  if (battleTransitionActive) return;

  const dx = playerX - niallState.x;
  const dy = playerY - niallState.y;
  if (!alertActive && Math.abs(dx) <= VERTICAL_SIGHT_HALF_WIDTH && dy > 0 && dy <= VERTICAL_SIGHT_DISTANCE) {
    alertActive = true;
    niallState.direction = 'down';
    niallState.frame = 0;
    releaseAllInput();
    return;
  }
  const distance = Math.hypot(dx, dy);
  if (distance <= CONTACT_DISTANCE) {
    startFight();
    return;
  }
  if (distance === 0 || !alertActive) return;

  chasePlayer(deltaTime, dx, dy, distance);
}
