import { images } from './assets.js';
import {
  getBusIntroBus,
  getBusIntroCameraCenter,
  isBusIntroPlayerVisible,
} from './bus-intro.js';
import {
  getCaveTheftCameraCenter,
  getCaveThief,
  getCaveThiefDialogue,
  type CaveThiefDirection,
} from './cave-thief.js';
import { drawColander, hasCaveColander } from './colander.js';
import { COLLISION_SHAPES } from './collision-data.js';
import {
  ARTIST_STUDIO_X,
  ARTIST_STUDIO_Y,
  BILLBOARD_X,
  BILLBOARD_Y,
  BILLBOARD_SCREEN_HEIGHT,
  BILLBOARD_SCREEN_WIDTH,
  BILLBOARD_SCREEN_X,
  BILLBOARD_SCREEN_Y,
  BOOKSHOP_HEIGHT,
  BOOKSHOP_WIDTH,
  BOOKSHOP_X,
  BOOKSHOP_Y,
  CINEMA_X,
  CINEMA_Y,
  DIARY_LAB_HEIGHT,
  DIARY_LAB_WIDTH,
  DIARY_LAB_X,
  DIARY_LAB_Y,
  FEEDBACK_X,
  FEEDBACK_Y,
  FRAME_HEIGHT,
  FRAME_WIDTH,
  GATE_HEIGHT,
  GATE_PLAYER_DEPTH_Y,
  GATE_WIDTH,
  GATE_X,
  GATE_Y,
  GYM_ROOF_TOGGLE_INTERVAL,
  GYM_ROOF_X,
  GYM_ROOF_Y,
  GYM_X,
  GYM_Y,
  JOB_CENTER_X,
  JOB_CENTER_Y,
  MUSIC_SHOP_X,
  MUSIC_SHOP_Y,
  MUSIC_SHOP_SIGN_HEIGHT,
  MUSIC_SHOP_SIGN_WIDTH,
  MUSIC_SHOP_SIGN_X,
  MUSIC_SHOP_SIGN_Y,
  SCALE,
  SHOW_COLLISION_SHAPES,
  SNOW_MANSION_X,
  SNOW_MANSION_Y,
  ROAD_HEIGHT,
  ROAD_BUS_ROOF_HEIGHT,
  ROAD_BUS_ROOF_WIDTH,
  ROAD_BUS_ROOF_X,
  ROAD_BUS_ROOF_Y,
  ROAD_BUS_SIGN_HEIGHT,
  ROAD_BUS_SIGN_SOURCE_X,
  ROAD_BUS_SIGN_SOURCE_Y,
  ROAD_BUS_SIGN_WIDTH,
  ROAD_FOREGROUND_DEPTH_Y,
  ROAD_TREE_HEIGHT,
  ROAD_TREE_WIDTH,
  ROAD_TREE_X,
  ROAD_TREE_Y,
  ROAD_WIDTH,
  ROAD_X,
  ROAD_Y,
  TORI_PLAYER_DEPTH_Y,
  TORI_SIZE,
  TORI_X,
  TORI_Y,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  ZEN_GARDEN_X,
  ZEN_GARDEN_Y,
} from './config.js';
import { canvas, context } from './dom.js';
import { getOpenDoorways } from './doors.js';
import { getHolePlayerTransform } from './hole.js';
import { MIKE } from './mike.js';
import { isNiallAlertActive, isNiallFollowing, NIALL, niallState } from './niall.js';
import { directionRows, player } from './player.js';
import { isSnowmanFallen, SNOWMAN } from './snowman.js';
import type { Direction } from './types.js';

const NIALL_SPRITE_COLUMNS = 4;
const NIALL_SPRITE_ROWS = 7;
const NIALL_EXPLANATION_MARK_WIDTH = 26;
const NIALL_EXPLANATION_MARK_HEIGHT = 21;
const GIRLS_RENDER_WIDTH = 56;
const GIRLS_RENDER_HEIGHT = 44;
const SEAL_MODE = new URLSearchParams(window.location.search).has('seal');
const SEAL_COLUMNS = 8;
const SEAL_RENDER_WIDTH = 40;
const SEAL_RENDER_HEIGHT = 52;
const SEAL_BASELINE_OFFSET = 6;
const SEAL_FRAME_X = [0, 130, 254, 380, 506, 630, 754, 881] as const;
const SEAL_FRAME_WIDTH = [130, 124, 126, 126, 124, 124, 127, 126] as const;
const SEAL_ROW_Y = [0, 162, 323, 486, 646, 805, 970, 1134, 1290] as const;
const SEAL_ROW_HEIGHT = [162, 161, 163, 160, 159, 165, 164, 156, 164] as const;
const sealDirectionRows: Record<Direction, number> = {
  down: 8,
  downRight: 7,
  right: 2,
  upRight: 5,
  up: 4,
  upLeft: 5,
  left: 3,
  downLeft: 0,
};
type SpriteFrame = readonly [x: number, y: number, width: number, height: number];

function drawRoadTree(cameraX: number, cameraY: number): void {
  context.drawImage(
    images.roadTree,
    ROAD_TREE_X - cameraX,
    ROAD_TREE_Y - cameraY,
    ROAD_TREE_WIDTH,
    ROAD_TREE_HEIGHT,
  );
}

function drawRoadBusRoof(cameraX: number, cameraY: number): void {
  context.drawImage(
    images.roadBusRoof,
    ROAD_BUS_ROOF_X - cameraX,
    ROAD_BUS_ROOF_Y - cameraY,
    ROAD_BUS_ROOF_WIDTH,
    ROAD_BUS_ROOF_HEIGHT,
  );
}

function drawRoadBusSignForeground(cameraX: number, cameraY: number): void {
  context.drawImage(
    images.road,
    ROAD_BUS_SIGN_SOURCE_X,
    ROAD_BUS_SIGN_SOURCE_Y,
    ROAD_BUS_SIGN_WIDTH,
    ROAD_BUS_SIGN_HEIGHT,
    ROAD_X + ROAD_BUS_SIGN_SOURCE_X - cameraX,
    ROAD_Y + ROAD_BUS_SIGN_SOURCE_Y - cameraY,
    ROAD_BUS_SIGN_WIDTH,
    ROAD_BUS_SIGN_HEIGHT,
  );
}

function drawGate(cameraX: number, cameraY: number): void {
  context.drawImage(
    images.gate,
    GATE_X - cameraX,
    GATE_Y - cameraY,
    GATE_WIDTH,
    GATE_HEIGHT,
  );
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
const BAKED_SNOWMAN_PATCH = {
  sourceX: 270,
  sourceY: 105,
  sourceWidth: 28,
  sourceHeight: 88,
  x: SNOW_MANSION_X + 214,
  y: SNOW_MANSION_Y - 10 + 105,
  width: 56,
  height: 88,
} as const;
const niallDirectionRows: Record<Direction, number> = {
  down: 0,
  downRight: 1,
  right: 2,
  upRight: 3,
  upLeft: 4,
  left: 4,
  up: 5,
  downLeft: 1,
};

function drawNiallAt(
  cameraX: number,
  cameraY: number,
  x: number,
  y: number,
  direction: Direction,
  frame: number,
): void {
  const sourceWidth = Math.floor(images.niallSprite.width / NIALL_SPRITE_COLUMNS);
  const sourceHeight = Math.floor(images.niallSprite.height / NIALL_SPRITE_ROWS);
  const sourceX = (frame % NIALL_SPRITE_COLUMNS) * sourceWidth;
  const sourceY = niallDirectionRows[direction] * sourceHeight;

  context.save();
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(
    images.niallSprite,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    Math.round(x - cameraX - NIALL.width / 2),
    Math.round(y - cameraY - NIALL.height),
    NIALL.width,
    NIALL.height,
  );
  context.restore();
}

function drawCollisionShapes(cameraX: number, cameraY: number): void {
  context.fillStyle = 'rgba(0, 92, 255, 0.62)';
  for (const [shapeX, shapeY, shapeWidth, shapeHeight] of COLLISION_SHAPES) {
    if (
      shapeX + shapeWidth < cameraX ||
      shapeX > cameraX + canvas.width ||
      shapeY + shapeHeight < cameraY ||
      shapeY > cameraY + canvas.height
    ) continue;

    context.fillRect(shapeX - cameraX, shapeY - cameraY, shapeWidth, shapeHeight);
  }
}

function drawTori(cameraX: number, cameraY: number): void {
  context.drawImage(images.tori, TORI_X - cameraX, TORI_Y - cameraY, TORI_SIZE, TORI_SIZE);
}

function drawSnowman(cameraX: number, cameraY: number): void {
  if (!isSnowmanFallen()) return;

  context.save();
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';

  // Replace the upright snowman baked into the mansion artwork with nearby
  // clean snow before drawing the fallen state over the same spot.
  context.drawImage(
    images.snowMansion,
    BAKED_SNOWMAN_PATCH.sourceX,
    BAKED_SNOWMAN_PATCH.sourceY,
    BAKED_SNOWMAN_PATCH.sourceWidth,
    BAKED_SNOWMAN_PATCH.sourceHeight,
    BAKED_SNOWMAN_PATCH.x - cameraX,
    BAKED_SNOWMAN_PATCH.y - cameraY,
    BAKED_SNOWMAN_PATCH.width,
    BAKED_SNOWMAN_PATCH.height,
  );
  context.drawImage(
    images.snowmanFallen,
    Math.round(SNOWMAN.x - cameraX - SNOWMAN.fallenWidth / 2),
    Math.round(SNOWMAN.y - cameraY - SNOWMAN.fallenHeight),
    SNOWMAN.fallenWidth,
    SNOWMAN.fallenHeight,
  );
  context.restore();
}

function drawOpenDoorways(cameraX: number, cameraY: number): void {
  for (const doorway of getOpenDoorways()) {
    context.drawImage(
      images.doorOpen,
      Math.round(doorway.x - cameraX),
      Math.round(doorway.y - cameraY),
      doorway.width,
      doorway.height,
    );
  }
}

function drawCaveThief(cameraX: number, cameraY: number): void {
  const thief = getCaveThief();
  if (!thief) return;

  const frames = thief.moving ? GIRLS_WALK_FRAMES[thief.direction] : GIRLS_IDLE_FRAMES;
  const frame = frames[thief.frame % frames.length] ?? frames[0];
  if (!frame) return;
  const [sourceX, sourceY, sourceWidth, sourceHeight] = frame;
  context.save();
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(
    images.girlsSprite,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    Math.round(thief.x - cameraX - GIRLS_RENDER_WIDTH / 2),
    Math.round(thief.y - cameraY - GIRLS_RENDER_HEIGHT),
    GIRLS_RENDER_WIDTH,
    GIRLS_RENDER_HEIGHT,
  );
  context.restore();
}

function drawBusIntro(cameraX: number, cameraY: number): void {
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

function drawSpeechBubble(text: string, anchorX: number, anchorY: number): void {
  context.save();
  context.font = '12px "Press Start 2P", monospace';
  context.textBaseline = 'top';
  const paddingX = 10;
  const paddingY = 8;
  const maxWidth = 270;
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const nextLine = line ? `${line} ${word}` : word;
    if (context.measureText(nextLine).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = nextLine;
    }
  }
  if (line) lines.push(line);

  const textWidth = Math.min(maxWidth, Math.max(...lines.map((value) => context.measureText(value).width)));
  const width = textWidth + paddingX * 2;
  const height = lines.length * 18 + paddingY * 2;
  const x = Math.round(Math.max(8, Math.min(canvas.width - width - 8, anchorX - width / 2)));
  const y = Math.round(Math.max(8, anchorY - height - 18));

  context.fillStyle = '#111';
  context.fillRect(x - 3, y - 3, width + 6, height + 6);
  context.fillStyle = '#f7f3e8';
  context.fillRect(x, y, width, height);
  context.fillStyle = '#111';
  lines.forEach((value, index) => {
    context.fillText(value, x + paddingX, y + paddingY + index * 18);
  });
  context.restore();
}

function logPlayerPosition(): void {
  const playerX = player.x.toFixed(1);
  const playerY = player.y.toFixed(1);
  if (canvas.dataset.playerX === playerX && canvas.dataset.playerY === playerY) return;

  canvas.dataset.playerX = playerX;
  canvas.dataset.playerY = playerY;
  console.log('Player position', { x: Number(playerX), y: Number(playerY) });
}

export function draw(time: number): void {
  context.clearRect(0, 0, canvas.width, canvas.height);
  canvas.dataset.playerVariant = SEAL_MODE ? 'seal' : 'default';
  logPlayerPosition();

  // Rounded so the map is sampled on whole source pixels: a fractional source
  // rect snaps at a browser-defined threshold and makes the player jitter
  // against the tiles by a pixel on every step.
  const cameraCenter = getBusIntroCameraCenter() ?? getCaveTheftCameraCenter(player.x, player.y, time);
  const cameraX = Math.round(Math.max(0, Math.min(WORLD_WIDTH - canvas.width, cameraCenter.x - canvas.width / 2)));
  const cameraY = Math.round(Math.max(0, Math.min(WORLD_HEIGHT - canvas.height, cameraCenter.y - canvas.height / 2)));
  const roadForegroundCoversPlayer = player.y <= ROAD_FOREGROUND_DEPTH_Y;
  context.drawImage(images.map, -cameraX, -cameraY);
  context.save();
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(
    images.road,
    ROAD_X - cameraX,
    ROAD_Y - cameraY,
    ROAD_WIDTH,
    ROAD_HEIGHT,
  );
  if (!roadForegroundCoversPlayer) {
    drawRoadTree(cameraX, cameraY);
    drawRoadBusRoof(cameraX, cameraY);
  }
  context.restore();
  context.drawImage(images.billboard, BILLBOARD_X - cameraX, BILLBOARD_Y - cameraY);
  context.save();
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(
    images.billboardUnfinished,
    BILLBOARD_SCREEN_X - cameraX,
    BILLBOARD_SCREEN_Y - cameraY,
    BILLBOARD_SCREEN_WIDTH,
    BILLBOARD_SCREEN_HEIGHT,
  );
  context.restore();

  // Canvas layers use draw order instead of CSS z-index. Drawing buildings
  // after the map keeps them above the houses baked into the overworld image.
  context.drawImage(images.cinema, CINEMA_X - cameraX, CINEMA_Y - cameraY);
  context.drawImage(images.musicShop, MUSIC_SHOP_X - cameraX, MUSIC_SHOP_Y - cameraY);
  context.drawImage(images.gym, GYM_X - cameraX, GYM_Y - cameraY);
  if (Math.floor(time / GYM_ROOF_TOGGLE_INTERVAL) % 2 === 0) {
    context.drawImage(images.gymRoof, GYM_ROOF_X - cameraX - 1, GYM_ROOF_Y - cameraY + 1);
  }
  context.drawImage(images.snowMansion, SNOW_MANSION_X - cameraX, SNOW_MANSION_Y - cameraY - 10);
  context.drawImage(
    images.musicShopSign,
    MUSIC_SHOP_SIGN_X - cameraX,
    MUSIC_SHOP_SIGN_Y - cameraY,
    MUSIC_SHOP_SIGN_WIDTH,
    MUSIC_SHOP_SIGN_HEIGHT,
  );
  drawSnowman(cameraX, cameraY);
  context.drawImage(images.jobCenter, JOB_CENTER_X - cameraX, JOB_CENTER_Y - cameraY);
  context.drawImage(images.artistStudio, ARTIST_STUDIO_X - cameraX, ARTIST_STUDIO_Y - cameraY);
  context.drawImage(images.feedback, FEEDBACK_X - cameraX, FEEDBACK_Y - cameraY);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(
    images.bookshop,
    BOOKSHOP_X - cameraX,
    BOOKSHOP_Y - cameraY,
    BOOKSHOP_WIDTH,
    BOOKSHOP_HEIGHT,
  );
  context.drawImage(
    images.diaryLab,
    DIARY_LAB_X - cameraX,
    DIARY_LAB_Y - cameraY,
    DIARY_LAB_WIDTH,
    DIARY_LAB_HEIGHT,
  );
  context.imageSmoothingEnabled = false;
  context.drawImage(images.zenGarden, ZEN_GARDEN_X - cameraX, ZEN_GARDEN_Y - cameraY);
  const gateCoversPlayer = player.y < GATE_PLAYER_DEPTH_Y;
  if (!gateCoversPlayer) drawGate(cameraX, cameraY);
  const toriCoversPlayer = player.y < TORI_PLAYER_DEPTH_Y;
  if (!toriCoversPlayer) drawTori(cameraX, cameraY);

  if (SHOW_COLLISION_SHAPES) drawCollisionShapes(cameraX, cameraY);
  drawOpenDoorways(cameraX, cameraY);
  drawCaveThief(cameraX, cameraY);
  if (isNiallFollowing()) {
    drawNiallAt(cameraX, cameraY, player.x - 34, player.y + 12, player.direction, player.frame);
  } else {
    drawNiallAt(cameraX, cameraY, niallState.x, niallState.y, niallState.direction, niallState.frame);
  }
  if (isNiallAlertActive()) {
    context.drawImage(
      images.niallExplanationMark,
      Math.round(niallState.x - cameraX - NIALL_EXPLANATION_MARK_WIDTH / 2),
      Math.round(niallState.y - cameraY - NIALL.height - NIALL_EXPLANATION_MARK_HEIGHT - 4),
      NIALL_EXPLANATION_MARK_WIDTH,
      NIALL_EXPLANATION_MARK_HEIGHT,
    );
  }
  context.drawImage(
    images.mike,
    Math.round(MIKE.x - cameraX - MIKE.width / 2),
    Math.round(MIKE.y - cameraY - MIKE.height),
    MIKE.width,
    MIKE.height,
  );

  const playerSpriteSheet = SEAL_MODE ? images.sealSpriteSheet : images.spriteSheet;
  const sourceFrame = SEAL_MODE ? player.frame % SEAL_COLUMNS : player.frame;
  const sourceRow = SEAL_MODE ? sealDirectionRows[player.direction] : directionRows[player.direction];
  const sourceX = SEAL_MODE ? (SEAL_FRAME_X[sourceFrame] ?? 0) : sourceFrame * FRAME_WIDTH;
  const sourceY = SEAL_MODE ? (SEAL_ROW_Y[sourceRow] ?? 0) : sourceRow * FRAME_HEIGHT;
  const sourceWidth = SEAL_MODE ? (SEAL_FRAME_WIDTH[sourceFrame] ?? 126) : FRAME_WIDTH;
  const sourceHeight = SEAL_MODE ? (SEAL_ROW_HEIGHT[sourceRow] ?? 162) : FRAME_HEIGHT;
  const width = SEAL_MODE ? SEAL_RENDER_WIDTH : FRAME_WIDTH * SCALE;
  const height = SEAL_MODE ? SEAL_RENDER_HEIGHT : FRAME_HEIGHT * SCALE;
  const baselineOffset = SEAL_MODE ? SEAL_BASELINE_OFFSET : 0;
  const holeTransform = getHolePlayerTransform();
  const playerVisible = isBusIntroPlayerVisible();
  if (playerVisible && holeTransform) {
    context.save();
    context.globalAlpha = holeTransform.opacity;
    context.translate(
      Math.round(player.x - cameraX),
      Math.round(player.y - cameraY - height / 2 + baselineOffset + holeTransform.offsetY),
    );
    context.rotate(holeTransform.rotation);
    context.scale(holeTransform.scale, holeTransform.scale);
    context.drawImage(
      playerSpriteSheet,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      -width / 2,
      -height / 2,
      width,
      height,
    );
    context.restore();
  } else if (playerVisible) {
    context.drawImage(
      playerSpriteSheet,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      Math.round(player.x - cameraX - width / 2),
      Math.round(player.y - cameraY - height + baselineOffset),
      width,
      height,
    );
  }
  if (playerVisible && hasCaveColander()) {
    drawColander(context, Math.round(player.x - cameraX + 12), Math.round(player.y - cameraY - 24));
  }
  if (roadForegroundCoversPlayer) {
    drawRoadTree(cameraX, cameraY);
    drawRoadBusRoof(cameraX, cameraY);
    drawRoadBusSignForeground(cameraX, cameraY);
  }
  if (toriCoversPlayer) drawTori(cameraX, cameraY);
  if (gateCoversPlayer) drawGate(cameraX, cameraY);
  drawBusIntro(cameraX, cameraY);

  const thief = getCaveThief();
  const thiefDialogue = getCaveThiefDialogue();
  if (thief && thiefDialogue) {
    drawSpeechBubble(thiefDialogue, thief.x - cameraX, thief.y - cameraY - thief.size);
  }
}

export function drawLoadFailure(): void {
  context.fillStyle = '#0b1c10';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#f5fff6';
  context.font = '13px monospace';
  context.textAlign = 'center';
  context.fillText('Could not load the game assets.', canvas.width / 2, canvas.height / 2);
}
