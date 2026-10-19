import {
  BILLBOARD_X,
  BILLBOARD_Y,
  FRAME_HEIGHT,
  FRAME_WIDTH,
  GRAVEYARD_HEIGHT,
  GRAVEYARD_WIDTH,
  GRAVEYARD_X,
  GRAVEYARD_Y,
  MUSIC_SHOP_SIGN_HEIGHT,
  MUSIC_SHOP_SIGN_WIDTH,
  MUSIC_SHOP_SIGN_X,
  MUSIC_SHOP_SIGN_Y,
  ROAD_BUS_SIGN_HEIGHT,
  ROAD_BUS_SIGN_SOURCE_X,
  ROAD_BUS_SIGN_SOURCE_Y,
  ROAD_BUS_SIGN_WIDTH,
  ROAD_X,
  ROAD_Y,
  SCALE,
} from './config.js';
import { requireElement } from './dom.js';
import { releaseAllInput } from './input.js';
import { announceWorldInteraction } from './world-interactions.js';
import type { CollisionShape } from './types.js';
import { isAnyPowerActive } from '../powers/active-power.js';
import { isMikePowerActive } from '../powers/mike/mike-power.js';

interface Sign {
  readonly id: string;
  readonly title: string;
  readonly message: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly signed?: boolean;
}

const SIGN_MESSAGES = [
  "Hey, welcome to my website! People will stop you to talk, but you can keep walking. You don't need to hit the [x] button to close the dialogue!",
  'People add things to your inventory as you talk to them. Click the Inventory button to use your items. You can also hop around the map with the Jump button!',
  'DC has one of the highest employment rates in the country, so helping folks find work is my side hustle.',
  "Max is going to be adding more people, places, and things, so check back soon! Have ideas and don't have me on WhatsApp? Jump on the Thoughts button - he would love to hear them.",
] as const;

// World-space bounds for every fully visible, readable sign in the composed map.
export const SIGNS: readonly Sign[] = [
  {
    id: 'grave',
    title: 'Grave',
    message: 'hmmm this grave seems to be for me?!',
    x: GRAVEYARD_X,
    y: GRAVEYARD_Y,
    width: GRAVEYARD_WIDTH,
    height: GRAVEYARD_HEIGHT,
    signed: false,
  },
  {
    id: 'north-directory',
    title: 'Feed me your thoughts',
    message: SIGN_MESSAGES[3],
    x: 392,
    y: 157,
    width: 19,
    height: 20,
    signed: true,
  },
  {
    id: 'music-shop-placard',
    title: 'Inventory',
    message: SIGN_MESSAGES[1],
    x: MUSIC_SHOP_SIGN_X,
    y: MUSIC_SHOP_SIGN_Y,
    width: MUSIC_SHOP_SIGN_WIDTH,
    height: MUSIC_SHOP_SIGN_HEIGHT,
    signed: true,
  },
  {
    id: 'job-center-noticeboard',
    title: 'Job Center',
    message: SIGN_MESSAGES[2],
    x: 1057,
    y: 803,
    width: 43,
    height: 59,
  },
  {
    id: 'east-directory',
    title: 'Fast travel',
    message: SIGN_MESSAGES[0],
    x: 610,
    y: 1151,
    width: 25,
    height: 23,
    signed: true,
  },
  {
    id: 'bus-stop',
    title: 'Bus Stop',
    message: 'The bus to DC is coming in the new year.',
    x: ROAD_X + ROAD_BUS_SIGN_SOURCE_X,
    y: ROAD_Y + ROAD_BUS_SIGN_SOURCE_Y,
    width: ROAD_BUS_SIGN_WIDTH,
    height: ROAD_BUS_SIGN_HEIGHT,
    signed: false,
  },
];

export const SIGN_COLLISION_SHAPES: readonly CollisionShape[] = [
  ...SIGNS.map(({ x, y, width, height }) => [x, y, width, height] as const),
  // The billboard remains a solid map object even though it is no longer an
  // interactive sign; Rei now owns the interaction in front of it.
  [BILLBOARD_X, BILLBOARD_Y, 108, 61],
];

const dialogue = requireElement<HTMLElement>('#sign-dialogue');
const dialogueContent = requireElement<HTMLElement>('.sign-dialogue-content');
const dialogueTitle = requireElement<HTMLElement>('#sign-dialogue-title');
const dialogueText = requireElement<HTMLElement>('#sign-dialogue-text');
const dialogueSignature = requireElement<HTMLElement>('#sign-dialogue-signature');
const signatureImage = requireElement<HTMLImageElement>('#sign-dialogue-signature-image');
const busImage = requireElement<HTMLImageElement>('#sign-dialogue-bus-image');
const announcer = requireElement<HTMLElement>('#announcer');
const closeButton = requireElement<HTMLButtonElement>('#sign-dialogue-close');

// Signs should be read from right beside them, not across the pavement.
const READ_DISTANCE = 20;
const DISMISS_DISTANCE = 28;
let activeSign: Sign | null = null;
let dismissedSignId: string | null = null;

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

function isSignSuppressed(sign: Sign): boolean {
  return isMikePowerActive() || (sign.id === 'grave' && isAnyPowerActive());
}

function showSign(sign: Sign): void {
  if (isSignSuppressed(sign)) return;
  if (dismissedSignId === sign.id) return;
  if (activeSign?.id === sign.id) return;

  announceWorldInteraction();
  releaseAllInput();
  activeSign = sign;
  dialogueTitle.textContent = sign.title;
  dialogueText.textContent = sign.message;
  const isBusStop = sign.id === 'bus-stop';
  const hasSignature = sign.signed === true;
  dialogueSignature.hidden = !isBusStop && !hasSignature;
  signatureImage.hidden = isBusStop;
  busImage.hidden = !isBusStop;
  dialogue.hidden = false;
  dialogueContent.scrollTop = 0;
  announcer.textContent = `${sign.title}: ${sign.message}`;
}

export function hideSignDialogue(): void {
  activeSign = null;
  dialogue.hidden = true;
  dialogueSignature.hidden = true;
  signatureImage.hidden = true;
  busImage.hidden = true;
}

function dismissSignDialogue(): void {
  dismissedSignId = activeSign?.id ?? null;
  hideSignDialogue();
}

export function isSignDialogueOpen(): boolean {
  return !dialogue.hidden;
}

/** Called with each attempted player position so contact opens the sign immediately. */
export function bumpSignAt(playerX: number, playerY: number): boolean {
  if (isMikePowerActive()) return false;
  const sign = SIGNS.find((candidate) => playerFootIntersectsSign(playerX, playerY, candidate));
  if (!sign || isSignSuppressed(sign)) return false;

  showSign(sign);
  return true;
}

/** Proximity reads the nearest sign automatically; moving away dismisses it. */
export function updateSigns(playerX: number, playerY: number): void {
  if (isMikePowerActive() || (activeSign && isSignSuppressed(activeSign))) {
    if (activeSign) hideSignDialogue();
    return;
  }
  let nearestSign: Sign | null = null;
  let nearestDistance = Number.POSITIVE_INFINITY;

  for (const sign of SIGNS) {
    const distance = distanceToSign(playerX, playerY, sign);
    if (distance < nearestDistance) {
      nearestSign = sign;
      nearestDistance = distance;
    }
  }

  if (dismissedSignId) {
    const dismissedSign = SIGNS.find((sign) => sign.id === dismissedSignId);
    if (!dismissedSign || distanceToSign(playerX, playerY, dismissedSign) > DISMISS_DISTANCE) {
      dismissedSignId = null;
    }
  }

  if (nearestSign && nearestDistance <= READ_DISTANCE && dismissedSignId !== nearestSign.id) {
    showSign(nearestSign);
  } else if (activeSign && distanceToSign(playerX, playerY, activeSign) > DISMISS_DISTANCE) {
    hideSignDialogue();
  }
}

closeButton.addEventListener('click', dismissSignDialogue);
window.addEventListener('max-game:world-interaction-opened', hideSignDialogue);
window.addEventListener('max-game:mike-power-activated', hideSignDialogue);
