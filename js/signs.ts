import { FRAME_HEIGHT, FRAME_WIDTH, SCALE } from './config.js';
import { requireElement } from './dom.js';
import type { CollisionShape } from './types.js';

interface Sign {
  readonly id: string;
  readonly title: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

const SIGN_MESSAGES: readonly string[] = [
  'Hey, welcome to my website! You can quick-travel by clicking the “Jump” button in the bottom-right.',
  'Click the “Inventory” button to check out everything in your extremely deep pockets. You can get new items by talking to certain folks.',
  'DC has one of the highest employment rates in the country, so helping folks find work is my side hustle.',
];

// World-space bounds for every fully visible, readable sign in the composed map.
export const SIGNS: readonly Sign[] = [
  {
    id: 'north-directory',
    title: 'Town Directory',
    x: 392,
    y: 157,
    width: 19,
    height: 20,
  },
  {
    id: 'community-billboard',
    title: 'Community Billboard',
    x: 402,
    y: 420,
    width: 108,
    height: 61,
  },
  {
    id: 'music-shop-placard',
    title: 'Music Shop',
    x: 197,
    y: 471,
    width: 17,
    height: 25,
  },
  {
    id: 'job-center-noticeboard',
    title: 'Job Center',
    x: 1057,
    y: 803,
    width: 43,
    height: 59,
  },
  {
    id: 'east-directory',
    title: 'Riverside Sign',
    x: 1156,
    y: 960,
    width: 20,
    height: 20,
  },
];

export const SIGN_COLLISION_SHAPES: readonly CollisionShape[] = SIGNS.map(
  ({ x, y, width, height }) => [x, y, width, height] as const,
);

const dialogue = requireElement<HTMLElement>('#sign-dialogue');
const dialogueTitle = requireElement<HTMLElement>('#sign-dialogue-title');
const dialogueText = requireElement<HTMLElement>('#sign-dialogue-text');
const announcer = requireElement<HTMLElement>('#announcer');

const READ_DISTANCE = 46;
const DISMISS_DISTANCE = 62;
let activeSign: Sign | null = null;

function playerFootIntersectsSign(playerX: number, playerY: number, sign: Sign): boolean {
  const footHalfWidth = Math.max(4, FRAME_WIDTH * SCALE * 0.3);
  const left = playerX - footHalfWidth;
  const right = playerX + footHalfWidth;
  const top = playerY - Math.max(4, FRAME_HEIGHT * SCALE * 0.18);
  const bottom = playerY;

  return left < sign.x + sign.width &&
    right > sign.x &&
    top < sign.y + sign.height &&
    bottom > sign.y;
}

function distanceToSign(playerX: number, playerY: number, sign: Sign): number {
  const dx = Math.max(sign.x - playerX, 0, playerX - (sign.x + sign.width));
  const dy = Math.max(sign.y - playerY, 0, playerY - (sign.y + sign.height));
  return Math.hypot(dx, dy);
}

function showSign(sign: Sign): void {
  if (activeSign?.id === sign.id) return;

  activeSign = sign;
  dialogueTitle.textContent = sign.title;
  dialogueText.textContent = SIGN_MESSAGES.join('\n\n');
  dialogue.hidden = false;
  announcer.textContent = `${sign.title}: ${SIGN_MESSAGES.join(' ')}`;
}

function hideSign(): void {
  activeSign = null;
  dialogue.hidden = true;
}

/** Called with each attempted player position so contact opens the sign immediately. */
export function bumpSignAt(playerX: number, playerY: number): boolean {
  const sign = SIGNS.find((candidate) => playerFootIntersectsSign(playerX, playerY, candidate));
  if (!sign) return false;

  showSign(sign);
  return true;
}

/** Proximity reads the nearest sign automatically; moving away dismisses it. */
export function updateSigns(playerX: number, playerY: number): void {
  let nearestSign: Sign | null = null;
  let nearestDistance = Number.POSITIVE_INFINITY;

  for (const sign of SIGNS) {
    const distance = distanceToSign(playerX, playerY, sign);
    if (distance < nearestDistance) {
      nearestSign = sign;
      nearestDistance = distance;
    }
  }

  if (nearestSign && nearestDistance <= READ_DISTANCE) {
    showSign(nearestSign);
  } else if (activeSign && distanceToSign(playerX, playerY, activeSign) > DISMISS_DISTANCE) {
    hideSign();
  }
}
