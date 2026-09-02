import type { Direction } from './types.js';

export interface PlayerSpriteFrame {
  readonly sourceX: number;
  readonly sourceY: number;
  readonly sourceWidth: number;
  readonly sourceHeight: number;
  readonly width: number;
  readonly height: number;
  readonly baselineOffset: number;
}

const FRAME_WIDTH = 23;
const FRAME_HEIGHT = 36;
const SEAL_RENDER_WIDTH = 40;
const SEAL_RENDER_HEIGHT = 52;
const SEAL_BASELINE_OFFSET = 6;
const SEAL_FRAME_X = [0, 130, 254, 380, 506, 630, 754, 881] as const;
const SEAL_FRAME_WIDTH = [130, 124, 126, 126, 124, 124, 127, 126] as const;
const SEAL_ROW_Y = [0, 162, 323, 486, 646, 805, 970, 1134, 1290] as const;
const SEAL_ROW_HEIGHT = [162, 161, 163, 160, 159, 165, 164, 156, 164] as const;

const DEFAULT_DIRECTION_ROWS: Record<Direction, number> = {
  down: 0,
  downRight: 1,
  right: 2,
  upRight: 3,
  up: 4,
  upLeft: 5,
  left: 6,
  downLeft: 7,
};

const SEAL_DIRECTION_ROWS: Record<Direction, number> = {
  down: 8,
  downRight: 7,
  right: 2,
  upRight: 5,
  up: 4,
  upLeft: 5,
  left: 3,
  downLeft: 0,
};

export function getPlayerSpriteFrame(
  sealMode: boolean,
  direction: Direction,
  frame: number,
  scale: number,
): PlayerSpriteFrame {
  if (!sealMode) {
    return {
      sourceX: frame * FRAME_WIDTH,
      sourceY: DEFAULT_DIRECTION_ROWS[direction] * FRAME_HEIGHT,
      sourceWidth: FRAME_WIDTH,
      sourceHeight: FRAME_HEIGHT,
      width: FRAME_WIDTH * scale,
      height: FRAME_HEIGHT * scale,
      baselineOffset: 0,
    };
  }

  const sourceFrame = frame % SEAL_FRAME_X.length;
  const sourceRow = SEAL_DIRECTION_ROWS[direction];
  return {
    sourceX: SEAL_FRAME_X[sourceFrame] ?? 0,
    sourceY: SEAL_ROW_Y[sourceRow] ?? 0,
    sourceWidth: SEAL_FRAME_WIDTH[sourceFrame] ?? 126,
    sourceHeight: SEAL_ROW_HEIGHT[sourceRow] ?? 162,
    width: SEAL_RENDER_WIDTH,
    height: SEAL_RENDER_HEIGHT,
    baselineOffset: SEAL_BASELINE_OFFSET,
  };
}
