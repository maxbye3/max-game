import { withCharacterPowers } from './character-power-render.js';
import { images } from './assets.js';
import { getBusIntroBus } from './bus-intro.js';
import { getCaveThief, type CaveThiefDirection } from './cave-thief.js';
import { context } from './dom.js';
import { georgiaState } from './georgia.js';
import { NIALL } from './niall.js';
import { samVictimOffset } from './sam-power.js';
import { hasMikeAftermath } from './world-state.js';
import type { Direction } from './types.js';
const NIALL_SPRITE_COLUMNS = 4;
const NIALL_SPRITE_FRAME_HEIGHT = 283;
// The submitted sheet has transparent padding between rows, but its rows are
// packed vertically rather than starting at equal 283px intervals. Keep the
// source rectangles explicit so later rows do not clip into the row above.
const NIALL_SPRITE_ROW_Y = [0, 270, 531, 793, 1054, 1320, 1597] as const;
const GIRLS_RENDER_WIDTH = 56;
const GIRLS_RENDER_HEIGHT = 44;
const MIKE_AFTERMATH_X = 212;
const MIKE_AFTERMATH_Y = 439;
const MIKE_AFTERMATH_WIDTH = 275;
const MIKE_AFTERMATH_HEIGHT = 271;
type SpriteFrame = readonly [x: number, y: number, width: number, height: number];

function isImageReady(image: HTMLImageElement): boolean {
  return image.complete && image.naturalWidth > 0;
}
const GIRLS_IDLE_FRAMES: readonly SpriteFrame[] = [
  [181, 16, 235, 176],
  [457, 16, 233, 176],
  [737, 16, 233, 176],
  [1014, 16, 235, 176],
];
const GIRLS_WALK_FRAMES: Record<CaveThiefDirection, readonly SpriteFrame[]> = {
  down: [
    [163, 206, 212, 183],
    [416, 206, 214, 183],
    [657, 206, 211, 183],
    [890, 206, 198, 183],
    [1103, 206, 180, 183],
    [1302, 206, 193, 183],
  ],
  left: [
    [148, 403, 218, 175],
    [398, 403, 219, 175],
    [653, 403, 226, 175],
    [922, 403, 219, 175],
    [1186, 403, 231, 175],
  ],
  right: [
    [141, 591, 231, 179],
    [404, 591, 230, 179],
    [667, 591, 236, 179],
    [939, 591, 237, 179],
    [1211, 591, 237, 179],
  ],
  up: [
    [152, 786, 200, 188],
    [409, 786, 201, 188],
    [679, 786, 208, 188],
    [947, 786, 211, 188],
    [1213, 786, 214, 188],
  ],
};
const niallDirectionRows: Record<Direction, number> = {
  down: 0,
  downRight: 3,
  right: 2,
  upRight: 6,
  upLeft: 6,
  left: 1,
  up: 5,
  downLeft: 4,
};

export function drawNiallAt(
  cameraX: number,
  cameraY: number,
  x: number,
  y: number,
  direction: Direction,
  frame: number,
): void {
  const offset = samVictimOffset('niall');
  const column = frame % NIALL_SPRITE_COLUMNS;
  const sourceX = Math.floor((column * images.niallSprite.width) / NIALL_SPRITE_COLUMNS);
  const nextSourceX = Math.floor(((column + 1) * images.niallSprite.width) / NIALL_SPRITE_COLUMNS);
  const sourceWidth = nextSourceX - sourceX;
  const sourceY = NIALL_SPRITE_ROW_Y[niallDirectionRows[direction]] ?? 0;
  const sourceHeight = Math.min(
    NIALL_SPRITE_FRAME_HEIGHT,
    images.niallSprite.height - sourceY,
  );

  context.save();
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  withCharacterPowers(context, x - cameraX, y - cameraY, NIALL.height, 'niall', () => context.drawImage(
    images.niallSprite,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    Math.round(x - cameraX - NIALL.width / 2 + offset.x),
    Math.round(y - cameraY - NIALL.height + offset.y),
    NIALL.width,
    NIALL.height,
  ));
  context.restore();
}

export function drawCaveThief(cameraX: number, cameraY: number): void {
  const thief = getCaveThief();
  if (!thief || !isImageReady(images.girlsSprite)) return;
  const offset = samVictimOffset('cave-thief');

  const frames = thief.moving ? GIRLS_WALK_FRAMES[thief.direction] : GIRLS_IDLE_FRAMES;
  const frame = frames[thief.frame % frames.length] ?? frames[0];
  if (!frame) return;
  const [sourceX, sourceY, sourceWidth, sourceHeight] = frame;
  context.save();
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  withCharacterPowers(context, thief.x - cameraX, thief.y - cameraY, GIRLS_RENDER_HEIGHT, 'cave-thief', () => context.drawImage(
    images.girlsSprite,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    Math.round(thief.x - cameraX - GIRLS_RENDER_WIDTH / 2 + offset.x),
    Math.round(thief.y - cameraY - GIRLS_RENDER_HEIGHT + offset.y),
    GIRLS_RENDER_WIDTH,
    GIRLS_RENDER_HEIGHT,
  ));
  context.restore();
}

export function drawBusIntro(cameraX: number, cameraY: number): void {
  const bus = getBusIntroBus();
  if (!bus) return;

  context.save();
  context.imageSmoothingEnabled = false;
  context.drawImage(
    images.bus,
    Math.round(bus.x - cameraX - bus.width / 2),
    Math.round(bus.y - cameraY - bus.height),
    bus.width,
    bus.height,
  );
  context.restore();
}

const GEORGIA_BIKE_RENDER_WIDTH = 50;
const GEORGIA_BIKE_RENDER_HEIGHT = 51;

export function drawGeorgia(cameraX: number, cameraY: number): void {
  if (!isImageReady(images.georgiaBike)) return;
  const offset = samVictimOffset('georgia');
  const bob = georgiaState.moving ? Math.sin(georgiaState.animationTime * 12) * 1.5 : 0;
  // The source art faces left, so mirror it when Georgia rides to the right.
  const facingRight = georgiaState.direction === 'right';
  const drawX = Math.round(georgiaState.x - cameraX - GEORGIA_BIKE_RENDER_WIDTH / 2 + offset.x);
  const drawY = Math.round(georgiaState.y - cameraY - GEORGIA_BIKE_RENDER_HEIGHT + bob + offset.y);
  context.save();
  context.imageSmoothingEnabled = false;
  withCharacterPowers(context, georgiaState.x - cameraX, georgiaState.y - cameraY, GEORGIA_BIKE_RENDER_HEIGHT, 'georgia', () => {
    if (facingRight) {
      context.translate(drawX + GEORGIA_BIKE_RENDER_WIDTH, drawY);
      context.scale(-1, 1);
      context.drawImage(images.georgiaBike, 0, 0, GEORGIA_BIKE_RENDER_WIDTH, GEORGIA_BIKE_RENDER_HEIGHT);
    } else {
      context.drawImage(images.georgiaBike, drawX, drawY, GEORGIA_BIKE_RENDER_WIDTH, GEORGIA_BIKE_RENDER_HEIGHT);
    }
  });
  context.restore();
}

export function drawMikeAftermath(cameraX: number, cameraY: number): void {
  if (!hasMikeAftermath() || !isImageReady(images.mikeAftermath)) return;
  context.drawImage(
    images.mikeAftermath,
    MIKE_AFTERMATH_X - cameraX,
    MIKE_AFTERMATH_Y - cameraY,
    MIKE_AFTERMATH_WIDTH,
    MIKE_AFTERMATH_HEIGHT,
  );
}

