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
import {
  SCALE,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from './config.js';
import { canvas, context } from './dom.js';
import { GEORGIA, georgiaState } from './georgia.js';
import { getGymTimCutsceneDialogue } from './gym-tim-cutscene.js';
import { getHolePlayerTransform } from './hole.js';
import { isNiallAlertActive, isNiallFollowing, NIALL, niallState } from './niall.js';
import { drawOverworldNpcs } from './overworld-npcs-render.js';
import { player } from './player.js';
import { getPlayerSpriteFrame } from './player-sprite.js';
import { drawWorldBackground, drawWorldForeground } from './overworld-props-render.js';
import { drawSpeechBubble } from './speech-bubble.js';

const NIALL_EXPLANATION_MARK_WIDTH = 26;
const NIALL_EXPLANATION_MARK_HEIGHT = 21;
const GIRLS_RENDER_WIDTH = 56;
const GIRLS_RENDER_HEIGHT = 44;
const searchParams = new URLSearchParams(window.location.search);
const SEAL_MODE = searchParams.has('seal');
const LOG_PLAYER_POSITION = searchParams.has('debug-position');
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
function drawNiallAt(
  cameraX: number,
  cameraY: number,
  x: number,
  y: number,
): void {
  context.save();
  context.imageSmoothingEnabled = false;
  context.drawImage(
    images.niallSprite,
    Math.round(x - cameraX - NIALL.width / 2),
    Math.round(y - cameraY - NIALL.height),
    NIALL.width,
    NIALL.height,
  );
  context.restore();
}

function drawCaveThief(cameraX: number, cameraY: number): void {
  const thief = getCaveThief();
  if (!thief || !isImageReady(images.girlsSprite)) return;

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

function drawGeorgia(cameraX: number, cameraY: number): void {
  if (!isImageReady(images.georgia)) return;
  const bob = georgiaState.moving ? Math.sin(georgiaState.animationTime * 12) * 1.5 : 0;
  context.save();
  context.imageSmoothingEnabled = false;
  context.drawImage(
    images.georgia,
    Math.round(georgiaState.x - cameraX - GEORGIA.width / 2),
    Math.round(georgiaState.y - cameraY - GEORGIA.height + bob),
    GEORGIA.width,
    GEORGIA.height,
  );
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
  if (LOG_PLAYER_POSITION) logPlayerPosition();

  // Rounded so the map is sampled on whole source pixels: a fractional source
  // rect snaps at a browser-defined threshold and makes the player jitter
  // against the tiles by a pixel on every step.
  const cameraCenter = getBusIntroCameraCenter() ?? getCaveTheftCameraCenter(player.x, player.y, time);
  const cameraX = Math.round(Math.max(0, Math.min(WORLD_WIDTH - canvas.width, cameraCenter.x - canvas.width / 2)));
  const cameraY = Math.round(Math.max(0, Math.min(WORLD_HEIGHT - canvas.height, cameraCenter.y - canvas.height / 2)));
  const worldDepth = drawWorldBackground(time, cameraX, cameraY, player.y);
  drawCaveThief(cameraX, cameraY);
  drawGeorgia(cameraX, cameraY);
  if (isNiallFollowing()) {
    drawNiallAt(cameraX, cameraY, player.x - 34, player.y + 12);
  } else {
    drawNiallAt(cameraX, cameraY, niallState.x, niallState.y);
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
  drawOverworldNpcs(context, cameraX, cameraY);

  const playerSpriteSheet = SEAL_MODE ? images.sealSpriteSheet : images.spriteSheet;
  const spriteFrame = getPlayerSpriteFrame(SEAL_MODE, player.direction, player.frame, SCALE);
  const { sourceX, sourceY, sourceWidth, sourceHeight, width, height, baselineOffset } = spriteFrame;
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
  drawWorldForeground(cameraX, cameraY, worldDepth);
  drawBusIntro(cameraX, cameraY);

  const thief = getCaveThief();
  const thiefDialogue = getCaveThiefDialogue();
  if (thief && thiefDialogue) {
    drawSpeechBubble(context, thiefDialogue, thief.x - cameraX, thief.y - cameraY - thief.size);
  }
  const gymTimDialogue = getGymTimCutsceneDialogue();
  if (gymTimDialogue) {
    drawSpeechBubble(context, gymTimDialogue.text, gymTimDialogue.x - cameraX, gymTimDialogue.y - cameraY);
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
