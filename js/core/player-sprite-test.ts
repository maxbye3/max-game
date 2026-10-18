import type { Direction } from './types.js';
import type { PlayerSpriteFrame } from './player-sprite.js';
import { readStorage, writeStorage } from './storage.js';
import { playerStartupParams } from './player-startup.js';

const WHELDON_KEY = 'max-game:wheldon-player-sprite';
const urlWheldon = playerStartupParams.get('wheldon');
let wheldonPlayerSpriteEnabled = urlWheldon === '1' || (urlWheldon !== '0' && readStorage(WHELDON_KEY) === 'true');

const SOURCE_WIDTH = 210;
const SOURCE_HEIGHT = 320;
const WALK_FRAMES = [1, 0, 1, 2] as const;
const WALK_FPS = 8;
// The artwork is not a regular grid. Anchor each pose at its center and
// shoe baseline so changing frames cannot crop a neighbor or move the feet.
const POSE_ANCHORS = [
  [{ x: 274, y: 372 }, { x: 543, y: 372 }, { x: 813, y: 372 }],
  [{ x: 279, y: 703 }, { x: 542, y: 699 }, { x: 809, y: 703 }],
  [{ x: 274, y: 1042 }, { x: 541, y: 1038 }, { x: 809, y: 1042 }],
  [{ x: 274, y: 1375 }, { x: 543, y: 1370 }, { x: 812, y: 1375 }],
] as const;
// Measured centers and tail baselines in alex-ghost-sprite.png (1086x1448).
// Its rows drift from the living sprite, especially the back-facing tails.
const GHOST_POSE_ANCHORS = [
  [{ x: 271, y: 368 }, { x: 540, y: 368 }, { x: 814, y: 366 }],
  [{ x: 273, y: 680 }, { x: 542, y: 678 }, { x: 813, y: 682 }],
  [{ x: 272, y: 1004 }, { x: 537, y: 1000 }, { x: 809, y: 1004 }],
  [{ x: 269, y: 1334 }, { x: 545, y: 1348 }, { x: 816, y: 1336 }],
] as const;
const DIRECTION_ROWS = {
  down: 0,
  downRight: 2,
  right: 2,
  upRight: 2,
  up: 3,
  upLeft: 1,
  left: 1,
  downLeft: 1,
} as const satisfies Record<Direction, number>;

export function setWheldonPlayerSpriteEnabled(enabled: boolean): void {
  wheldonPlayerSpriteEnabled = enabled;
  writeStorage(WHELDON_KEY, String(enabled));
}

export function isWheldonPlayerSpriteEnabled(): boolean {
  return wheldonPlayerSpriteEnabled;
}

export function getWheldonPlayerSpriteFrame(
  direction: Direction,
  animationTime: number,
  ghost = false,
): PlayerSpriteFrame {
  // Use elapsed movement time directly, independent of the default nine-frame
  // sheet. The neutral pose separates the two alternating steps.
  const frame = animationTime > 0
    ? WALK_FRAMES[Math.floor(animationTime * WALK_FPS) % WALK_FRAMES.length] ?? 1
    : 1;
  const anchor = (ghost ? GHOST_POSE_ANCHORS : POSE_ANCHORS)[DIRECTION_ROWS[direction]][frame];
  return {
    sourceX: anchor.x - SOURCE_WIDTH / 2,
    sourceY: anchor.y - SOURCE_HEIGHT,
    sourceWidth: SOURCE_WIDTH,
    sourceHeight: SOURCE_HEIGHT,
    width: 30,
    height: 46,
    baselineOffset: 0,
  };
}
