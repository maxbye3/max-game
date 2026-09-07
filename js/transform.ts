import { CAVE_SIBLINGS, CAVE_SIBLINGS_IDLE_FRAME } from './cave-siblings.js';
import { canvas, context } from './dom.js';
import { getPlayerSpriteFrame } from './player-sprite.js';
import { CAVE_HEIGHT, CAVE_WIDTH } from './interior-scenes.js';

const CAVE_DARKNESS_ALPHA = 0.68;

canvas.width = CAVE_WIDTH;
canvas.height = CAVE_HEIGHT;
context.imageSmoothingEnabled = false;

const background = new Image();
const siblingsSprite = new Image();
const sealChair = new Image();
const playerChair = new Image();
const spriteSheet = new Image();
background.src = 'img/internal/cave.jpg?v=20260901-half-size-no-sword';
siblingsSprite.src = 'chat/siblings/girls-sprite.png';
sealChair.src = 'chat/siblings/seal-chair.png';
playerChair.src = 'chat/siblings/player-chair.png';
spriteSheet.src = 'player/SpriteSheet.png';

const player = { x: CAVE_WIDTH / 2, y: CAVE_HEIGHT - 36 };
const playerChairPlacement = { x: 284, y: 136, width: 72, height: 72 };
const sealChairPlacement = { x: 348, y: 246, width: 52, height: 61 };

function draw(): void {
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(background, 0, 0, CAVE_WIDTH, CAVE_HEIGHT);

  const [sourceX, sourceY, sourceWidth, sourceHeight] = CAVE_SIBLINGS_IDLE_FRAME;
  context.drawImage(
    siblingsSprite,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    Math.round(CAVE_SIBLINGS.x - CAVE_SIBLINGS.width / 2),
    Math.round(CAVE_SIBLINGS.endY - CAVE_SIBLINGS.height),
    CAVE_SIBLINGS.width,
    CAVE_SIBLINGS.height,
  );

  context.save();
  context.globalAlpha = CAVE_DARKNESS_ALPHA;
  context.fillStyle = '#000';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.restore();

  // Keep the chairs visible in the cave's darkness while preserving the
  // requested top-to-bottom order (siblings, player chair, seal chair).
  context.drawImage(
    playerChair,
    playerChairPlacement.x,
    playerChairPlacement.y,
    playerChairPlacement.width,
    playerChairPlacement.height,
  );
  context.drawImage(
    sealChair,
    sealChairPlacement.x,
    sealChairPlacement.y,
    sealChairPlacement.width,
    sealChairPlacement.height,
  );

  const spriteFrame = getPlayerSpriteFrame(false, 'up', 0, 2);
  const { width, height, baselineOffset } = spriteFrame;
  context.drawImage(
    spriteSheet,
    spriteFrame.sourceX,
    spriteFrame.sourceY,
    spriteFrame.sourceWidth,
    spriteFrame.sourceHeight,
    Math.round(player.x - width / 2),
    Math.round(player.y - height + baselineOffset),
    width,
    height,
  );
}

Promise.all([background, siblingsSprite, sealChair, playerChair, spriteSheet].map((image) => image.decode()))
  .then(() => {
    context.imageSmoothingEnabled = false;
    draw();
  })
  .catch((error: unknown) => {
    console.error(error);
  });
