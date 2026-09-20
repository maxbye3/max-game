"use strict";
(() => {
  // js/cave-siblings.ts
  var CAVE_SIBLINGS = {
    x: 320,
    startY: 45,
    // Tall enough that the sprite's top clears the 47px-tall top wall band at
    // rest; a smaller endY left their hair rendering inside the rock texture.
    endY: 132,
    width: 96,
    height: 83,
    interactionDistance: 86
  };
  var CAVE_SIBLINGS_IDLE_FRAME = [181, 16, 235, 176];

  // js/elements.ts
  function requireElement(selector) {
    const element = document.querySelector(selector);
    if (!element) throw new Error(`Missing required element: ${selector}`);
    return element;
  }

  // js/dom.ts
  var canvas = requireElement("#game");
  var canvasContext = canvas.getContext("2d");
  if (!canvasContext) throw new Error("This browser does not support the 2D canvas context.");
  var context = canvasContext;
  context.imageSmoothingEnabled = false;

  // js/player-sprite.ts
  var FRAME_WIDTH = 23;
  var FRAME_HEIGHT = 36;
  var SEAL_RENDER_WIDTH = 40;
  var SEAL_RENDER_HEIGHT = 52;
  var SEAL_BASELINE_OFFSET = 6;
  var SEAL_FRAME_X = [0, 130, 254, 380, 506, 630, 754, 881];
  var SEAL_FRAME_WIDTH = [130, 124, 126, 126, 124, 124, 127, 126];
  var SEAL_ROW_Y = [0, 162, 323, 486, 646, 805, 970, 1134, 1290];
  var SEAL_ROW_HEIGHT = [162, 161, 163, 160, 159, 165, 164, 156, 164];
  var DEFAULT_DIRECTION_ROWS = {
    down: 0,
    downRight: 1,
    right: 2,
    upRight: 3,
    up: 4,
    upLeft: 5,
    left: 6,
    downLeft: 7
  };
  var SEAL_DIRECTION_ROWS = {
    down: 8,
    downRight: 7,
    right: 2,
    upRight: 5,
    up: 4,
    upLeft: 5,
    left: 3,
    downLeft: 0
  };
  function getPlayerSpriteFrame(sealMode, direction, frame, scale) {
    if (!sealMode) {
      return {
        sourceX: frame * FRAME_WIDTH,
        sourceY: DEFAULT_DIRECTION_ROWS[direction] * FRAME_HEIGHT,
        sourceWidth: FRAME_WIDTH,
        sourceHeight: FRAME_HEIGHT,
        width: FRAME_WIDTH * scale,
        height: FRAME_HEIGHT * scale,
        baselineOffset: 0
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
      baselineOffset: SEAL_BASELINE_OFFSET
    };
  }

  // js/interior-scenes.ts
  var DEFAULT_WIDTH = 512;
  var DEFAULT_HEIGHT = 768;
  var CAVE_WIDTH = 640;
  var CAVE_HEIGHT = 320;
  var NOEL = {
    x: DEFAULT_WIDTH / 2,
    y: DEFAULT_HEIGHT / 2 + 36,
    width: 52,
    height: 72
  };
  var CAVE_DOORS = [{
    triggerX: CAVE_WIDTH / 2,
    triggerY: CAVE_HEIGHT - 10,
    exitX: CAVE_WIDTH / 2,
    exitY: CAVE_HEIGHT - 10,
    sourceX: 0,
    sourceY: 0,
    sourceWidth: 1,
    sourceHeight: 1,
    x: CAVE_WIDTH / 2 - 10,
    y: CAVE_HEIGHT - 32,
    width: 20,
    height: 32
  }];

  // js/transform.ts
  var CAVE_DARKNESS_ALPHA = 0.68;
  canvas.width = CAVE_WIDTH;
  canvas.height = CAVE_HEIGHT;
  context.imageSmoothingEnabled = false;
  var background = new Image();
  var siblingsSprite = new Image();
  var sealChair = new Image();
  var playerChair = new Image();
  var spriteSheet = new Image();
  background.src = "img/internal/cave.jpg?v=20260901-half-size-no-sword";
  siblingsSprite.src = "chat/siblings/girls-sprite.png";
  sealChair.src = "chat/siblings/seal-chair.png";
  playerChair.src = "chat/siblings/player-chair.png";
  spriteSheet.src = "player/SpriteSheet.png";
  var player = { x: CAVE_WIDTH / 2, y: CAVE_HEIGHT - 36 };
  var playerChairPlacement = { x: 284, y: 136, width: 72, height: 72 };
  var sealChairPlacement = { x: 348, y: 246, width: 52, height: 61 };
  function draw() {
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
      CAVE_SIBLINGS.height
    );
    context.save();
    context.globalAlpha = CAVE_DARKNESS_ALPHA;
    context.fillStyle = "#000";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.restore();
    context.drawImage(
      playerChair,
      playerChairPlacement.x,
      playerChairPlacement.y,
      playerChairPlacement.width,
      playerChairPlacement.height
    );
    context.drawImage(
      sealChair,
      sealChairPlacement.x,
      sealChairPlacement.y,
      sealChairPlacement.width,
      sealChairPlacement.height
    );
    const spriteFrame = getPlayerSpriteFrame(false, "up", 0, 2);
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
      height
    );
  }
  Promise.all([background, siblingsSprite, sealChair, playerChair, spriteSheet].map((image) => image.decode())).then(() => {
    context.imageSmoothingEnabled = false;
    draw();
  }).catch((error) => {
    console.error(error);
  });
})();
