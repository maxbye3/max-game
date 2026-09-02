import { images } from './assets.js';
import { COLLISION_SHAPES } from './collision-data.js';
import {
  ARTIST_STUDIO_X,
  ARTIST_STUDIO_Y,
  BILLBOARD_SCREEN_HEIGHT,
  BILLBOARD_SCREEN_WIDTH,
  BILLBOARD_SCREEN_X,
  BILLBOARD_SCREEN_Y,
  BILLBOARD_X,
  BILLBOARD_Y,
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
  MUSIC_SHOP_SIGN_HEIGHT,
  MUSIC_SHOP_SIGN_WIDTH,
  MUSIC_SHOP_SIGN_X,
  MUSIC_SHOP_SIGN_Y,
  MUSIC_SHOP_X,
  MUSIC_SHOP_Y,
  ROAD_BUS_ROOF_HEIGHT,
  ROAD_BUS_ROOF_WIDTH,
  ROAD_BUS_ROOF_X,
  ROAD_BUS_ROOF_Y,
  ROAD_BUS_SIGN_HEIGHT,
  ROAD_BUS_SIGN_SOURCE_X,
  ROAD_BUS_SIGN_SOURCE_Y,
  ROAD_BUS_SIGN_WIDTH,
  ROAD_FOREGROUND_DEPTH_Y,
  ROAD_HEIGHT,
  ROAD_TREE_HEIGHT,
  ROAD_TREE_WIDTH,
  ROAD_TREE_X,
  ROAD_TREE_Y,
  ROAD_WIDTH,
  ROAD_X,
  ROAD_Y,
  SHOW_COLLISION_SHAPES,
  SNOW_MANSION_X,
  SNOW_MANSION_Y,
  TORI_PLAYER_DEPTH_Y,
  TORI_SIZE,
  TORI_X,
  TORI_Y,
  TV_HEIGHT,
  TV_WIDTH,
  TV_X,
  TV_Y,
  ZEN_GARDEN_X,
  ZEN_GARDEN_Y,
} from './config.js';
import { canvas, context } from './dom.js';
import { getOpenDoorways } from './doors.js';
import { isSnowmanFallen, SNOWMAN } from './snowman.js';
import { drawTvScreen } from './tv-render.js';

export interface WorldDepth {
  readonly gateCoversPlayer: boolean;
  readonly roadCoversPlayer: boolean;
  readonly toriCoversPlayer: boolean;
}

const BAKED_SNOWMAN_PATCH = {
  sourceX: 270,
  sourceY: 105,
  sourceWidth: 28,
  sourceHeight: 88,
  x: SNOW_MANSION_X + 214,
  y: SNOW_MANSION_Y + 95,
  width: 56,
  height: 88,
} as const;

function isImageReady(image: HTMLImageElement): boolean {
  return image.complete && image.naturalWidth > 0;
}

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

function drawRoadBusSign(cameraX: number, cameraY: number): void {
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
  context.drawImage(images.gate, GATE_X - cameraX, GATE_Y - cameraY, GATE_WIDTH, GATE_HEIGHT);
}

function drawTori(cameraX: number, cameraY: number): void {
  context.drawImage(images.tori, TORI_X - cameraX, TORI_Y - cameraY, TORI_SIZE, TORI_SIZE);
}

function drawSnowman(cameraX: number, cameraY: number): void {
  if (!isSnowmanFallen()) return;

  context.save();
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
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

function drawCollisionShapes(cameraX: number, cameraY: number): void {
  context.fillStyle = 'rgba(0, 92, 255, 0.62)';
  for (const [x, y, width, height] of COLLISION_SHAPES) {
    if (
      x + width < cameraX || x > cameraX + canvas.width ||
      y + height < cameraY || y > cameraY + canvas.height
    ) continue;
    context.fillRect(x - cameraX, y - cameraY, width, height);
  }
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

export function drawWorldBackground(
  time: number,
  cameraX: number,
  cameraY: number,
  playerY: number,
): WorldDepth {
  const depth: WorldDepth = {
    roadCoversPlayer: playerY <= ROAD_FOREGROUND_DEPTH_Y,
    gateCoversPlayer: playerY < GATE_PLAYER_DEPTH_Y,
    toriCoversPlayer: playerY < TORI_PLAYER_DEPTH_Y,
  };

  context.drawImage(images.map, -cameraX, -cameraY);
  context.save();
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(images.road, ROAD_X - cameraX, ROAD_Y - cameraY, ROAD_WIDTH, ROAD_HEIGHT);
  if (!depth.roadCoversPlayer) {
    drawRoadTree(cameraX, cameraY);
    drawRoadBusRoof(cameraX, cameraY);
  }
  context.restore();

  context.drawImage(images.billboard, BILLBOARD_X - cameraX, BILLBOARD_Y - cameraY);
  if (isImageReady(images.billboardUnfinished)) {
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
  }
  context.drawImage(images.tv, TV_X - cameraX, TV_Y - cameraY, TV_WIDTH, TV_HEIGHT);
  drawTvScreen(context, time, cameraX, cameraY);

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

  if (!depth.gateCoversPlayer) drawGate(cameraX, cameraY);
  if (!depth.toriCoversPlayer) drawTori(cameraX, cameraY);
  if (SHOW_COLLISION_SHAPES) drawCollisionShapes(cameraX, cameraY);
  drawOpenDoorways(cameraX, cameraY);
  return depth;
}

export function drawWorldForeground(
  cameraX: number,
  cameraY: number,
  depth: WorldDepth,
): void {
  if (depth.roadCoversPlayer) {
    drawRoadTree(cameraX, cameraY);
    drawRoadBusRoof(cameraX, cameraY);
    drawRoadBusSign(cameraX, cameraY);
  }
  if (depth.toriCoversPlayer) drawTori(cameraX, cameraY);
  if (depth.gateCoversPlayer) drawGate(cameraX, cameraY);
}
