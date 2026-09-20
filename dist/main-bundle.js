"use strict";
(() => {
  // js/assets.ts
  var IMAGE_SOURCES = {
    map: "img/external/overworld.png?v=riverside-sign-bookstore",
    road: "img/external/road.png",
    roadTree: "img/external/tree.png",
    roadBusRoof: "img/external/bus-roof.png",
    gate: "img/external/gate.png",
    musicShopSign: "img/external/music-shop-sign.png",
    doorOpen: "img/external/door-open.png",
    billboard: "img/external/buildings/billboard.png",
    billboardUnfinished: "img/external/billboard-unfinished.png",
    billboardFinished: "img/external/billboard-finished.png",
    tv: "img/external/buildings/tv.png",
    cinema: "img/external/buildings/cinema.png",
    musicShop: "img/external/buildings/music-shop.png",
    gym: "img/external/buildings/gym.png",
    gymRoof: "img/external/buildings/gym-roof.png",
    snowMansion: "img/external/buildings/snow-mansion.png",
    snowmanFallen: "img/external/snowman-fallen.png",
    jobCenter: "img/external/buildings/job-center.png",
    artistStudio: "img/external/buildings/artist-studio.png",
    feedback: "img/external/buildings/feedback.png?v=91x97",
    diaryLab: "img/external/buildings/diary-lab.png",
    bookshop: "img/external/buildings/bookshop.png",
    zenGarden: "img/external/buildings/zen-garden.png",
    tori: "img/external/buildings/tori.png",
    spriteSheet: "player/SpriteSheet.png",
    sealSpriteSheet: "player/seal-game.png?v=20260831-transparent",
    georgia: "chat/georgia/avatar.png",
    georgiaBike: "chat/georgia/georgie-bike.png",
    mike: "chat/mike/overworld-avatar.png",
    mikeAftermath: "img/external/mike-aftermath.png",
    paint: "img/external/paint.png",
    rei: "chat/rei/overworld-avatar.png",
    adam: "chat/adam/avatar.png",
    ed: "chat/ed/avatar.png",
    alexS: "chat/alex s/avatar.png",
    katy: "chat/katy/map-sprite.png",
    timMap: "chat/tim/map-sprite.png",
    niallSprite: "chat/niall/niall-sprite.png",
    niallExplanationMark: "chat/niall/explanation-mark.png",
    girlsSprite: "chat/siblings/girls-sprite.png",
    bus: "img/external/bus.png"
  };
  var images = Object.fromEntries(
    Object.keys(IMAGE_SOURCES).map((name) => [name, new Image()])
  );
  function loadImage(image, src) {
    return new Promise((resolve, reject) => {
      image.onload = async () => {
        await image.decode?.().catch(() => {
        });
        resolve();
      };
      image.onerror = () => reject(new Error(`Failed to load ${src}`));
      image.src = src;
    });
  }
  var OPTIONAL_ASSETS = ["billboardUnfinished", "girlsSprite"];
  async function loadAssets() {
    const sealMode = new URLSearchParams(window.location.search).has("seal");
    const blockingAssets = Object.keys(IMAGE_SOURCES).filter(
      (name) => !OPTIONAL_ASSETS.includes(name) && name !== (sealMode ? "spriteSheet" : "sealSpriteSheet")
    );
    await Promise.all(blockingAssets.map((name) => loadImage(images[name], IMAGE_SOURCES[name])));
    OPTIONAL_ASSETS.forEach((name) => {
      void loadImage(images[name], IMAGE_SOURCES[name]).catch((error) => {
        console.warn(`Optional asset could not be loaded: ${name}`, error);
      });
    });
  }

  // js/config.ts
  var FRAME_WIDTH = 23;
  var FRAME_HEIGHT = 36;
  var FRAME_COUNT = 9;
  var SCALE = 1;
  var SPEED = 185;
  var WORLD_WIDTH = 1254;
  var BASE_MAP_HEIGHT = 1254;
  var ROAD_Y = BASE_MAP_HEIGHT - 59;
  var ROAD_WIDTH = 1086;
  var ROAD_HEIGHT = 158;
  var ROAD_X = (WORLD_WIDTH - ROAD_WIDTH) / 2 + 30;
  var WORLD_HEIGHT = ROAD_Y + ROAD_HEIGHT;
  var ROAD_TREE_X = ROAD_X + 403;
  var ROAD_TREE_Y = ROAD_Y - 29;
  var ROAD_TREE_WIDTH = 78;
  var ROAD_TREE_HEIGHT = 107;
  var ROAD_BUS_ROOF_X = ROAD_X + 529;
  var ROAD_BUS_ROOF_Y = ROAD_Y + 4;
  var ROAD_BUS_ROOF_WIDTH = 97;
  var ROAD_BUS_ROOF_HEIGHT = 24;
  var ROAD_FOREGROUND_DEPTH_Y = 1263;
  var ROAD_BUS_SIGN_SOURCE_X = 641;
  var ROAD_BUS_SIGN_SOURCE_Y = 23;
  var ROAD_BUS_SIGN_WIDTH = 22;
  var ROAD_BUS_SIGN_HEIGHT = 55;
  var GATE_X = 1044;
  var GATE_Y = 1128;
  var GATE_WIDTH = 108;
  var GATE_HEIGHT = 60;
  var GATE_PLAYER_DEPTH_Y = 1176.2;
  var BUS_INTRO_STOP_X = 692;
  var BUS_INTRO_BUS_BASELINE_Y = ROAD_Y + 130;
  var BUS_INTRO_CAMERA_Y = WORLD_HEIGHT - 240;
  var BUS_INTRO_PLAYER_START_Y = ROAD_Y + 125;
  var BUS_INTRO_PLAYER_END_Y = ROAD_Y + 68;
  var BILLBOARD_X = 402;
  var BILLBOARD_Y = 420;
  var BILLBOARD_SCREEN_X = BILLBOARD_X + 12;
  var BILLBOARD_SCREEN_Y = BILLBOARD_Y + 9;
  var BILLBOARD_SCREEN_WIDTH = 89;
  var BILLBOARD_SCREEN_HEIGHT = 34;
  var TV_X = 159;
  var TV_Y = 804;
  var TV_WIDTH = 62;
  var TV_HEIGHT = 47;
  var CINEMA_X = 431;
  var CINEMA_Y = 705;
  var MUSIC_SHOP_X = 197;
  var MUSIC_SHOP_Y = 354;
  var MUSIC_SHOP_SIGN_X = 700;
  var MUSIC_SHOP_SIGN_Y = 950;
  var MUSIC_SHOP_SIGN_WIDTH = 17;
  var MUSIC_SHOP_SIGN_HEIGHT = 25;
  var GYM_X = 979;
  var GYM_Y = 442;
  var GYM_ROOF_X = GYM_X + 8;
  var GYM_ROOF_Y = GYM_Y + 5;
  var GYM_ROOF_TOGGLE_INTERVAL = 200;
  var ZEN_GARDEN_X = 539;
  var ZEN_GARDEN_Y = 420;
  var TORI_X = ZEN_GARDEN_X + 76;
  var TORI_Y = ZEN_GARDEN_Y + 146;
  var TORI_SIZE = 64;
  var TORI_PLAYER_DEPTH_Y = 630;
  var SNOW_MANSION_X = 683;
  var SNOW_MANSION_Y = 929;
  var JOB_CENTER_X = 960;
  var JOB_CENTER_Y = 704;
  var ARTIST_STUDIO_X = 686;
  var ARTIST_STUDIO_Y = 705;
  var FEEDBACK_X = 91;
  var FEEDBACK_Y = 1037;
  var DIARY_LAB_X = 698;
  var DIARY_LAB_Y = 125;
  var DIARY_LAB_WIDTH = 224;
  var DIARY_LAB_HEIGHT = 120;
  var BOOKSHOP_X = 509;
  var BOOKSHOP_Y = 978;
  var BOOKSHOP_WIDTH = 90;
  var BOOKSHOP_HEIGHT = 99;
  var HALF_WIDTH = FRAME_WIDTH * SCALE / 2;
  var SPRITE_HEIGHT = FRAME_HEIGHT * SCALE;
  var COLLISION_BUCKET_SIZE = 32;
  var BOOST_MULTIPLIER = 1.6;
  var BOOST_DURATION = 1e4;
  var RECHARGE_DURATION = 2e4;
  var APOCALYPSE_DURATION = 6e3;
  var SHOW_COLLISION_SHAPES = true;

  // js/bus-intro.ts
  var DRIVE_IN_END = 3e3;
  var PLAYER_WALK_END = 6e3;
  var DRIVE_OUT_START = 5e3;
  var INTRO_END = 8e3;
  var SKIP_SPEED_MULTIPLIER = 10;
  var BUS_WIDTH = 160;
  var BUS_HEIGHT = 91;
  var OFFSCREEN_DISTANCE = 320;
  var searchParams = new URLSearchParams(window.location.search);
  var shouldPlay = !searchParams.has("door") && searchParams.get("niall") !== "bus";
  var skipButton = document.querySelector("#bus-intro-skip");
  var controls = document.querySelector(".controls");
  var inventoryToggle = document.querySelector("#inventory-toggle");
  var jumpToggle = document.querySelector("#jump-toggle");
  var musicToggle = document.querySelector("#music-toggle");
  var active = shouldPlay;
  var elapsed = 0;
  var playbackRate = 1;
  function easeInOut(value) {
    return value < 0.5 ? 2 * value * value : 1 - (-2 * value + 2) ** 2 / 2;
  }
  function setGameplayUiHidden(hidden) {
    controls?.classList.toggle("opening-intro-hidden", hidden);
    inventoryToggle?.classList.toggle("opening-intro-hidden", hidden);
    jumpToggle?.classList.toggle("opening-intro-hidden", hidden);
    musicToggle?.classList.toggle("opening-intro-hidden", hidden);
  }
  function finishIntro(player3) {
    active = false;
    player3.x = BUS_INTRO_STOP_X;
    player3.y = BUS_INTRO_PLAYER_END_Y;
    player3.direction = "up";
    player3.frame = 0;
    player3.animationTime = 0;
    if (skipButton) skipButton.hidden = true;
    setGameplayUiHidden(false);
  }
  function speedUpIntro() {
    playbackRate = SKIP_SPEED_MULTIPLIER;
    if (skipButton) skipButton.hidden = true;
  }
  function setupBusIntro() {
    if (!active) {
      if (skipButton) skipButton.hidden = true;
      return;
    }
    setGameplayUiHidden(true);
    if (skipButton) {
      skipButton.hidden = false;
      skipButton.addEventListener("click", speedUpIntro, { once: true });
    }
  }
  function isBusIntroActive() {
    return active;
  }
  function isBusIntroPlayerVisible() {
    return !active || elapsed >= DRIVE_IN_END;
  }
  function getBusIntroCameraCenter() {
    return active ? { x: BUS_INTRO_STOP_X, y: BUS_INTRO_CAMERA_Y } : null;
  }
  function getBusIntroBus() {
    if (!active) return null;
    const startX = BUS_INTRO_STOP_X + OFFSCREEN_DISTANCE;
    const endX = BUS_INTRO_STOP_X - OFFSCREEN_DISTANCE;
    let x = BUS_INTRO_STOP_X;
    if (elapsed < DRIVE_IN_END) {
      const progress = easeInOut(elapsed / DRIVE_IN_END);
      x = startX + (BUS_INTRO_STOP_X - startX) * progress;
    } else if (elapsed >= DRIVE_OUT_START) {
      const progress = Math.min(1, (elapsed - DRIVE_OUT_START) / (INTRO_END - DRIVE_OUT_START));
      x = BUS_INTRO_STOP_X + (endX - BUS_INTRO_STOP_X) * progress * progress;
    }
    return { x, y: BUS_INTRO_BUS_BASELINE_Y, width: BUS_WIDTH, height: BUS_HEIGHT };
  }
  function updateBusIntro(deltaTime, player3) {
    if (!active) return;
    elapsed += deltaTime * 1e3 * playbackRate;
    player3.x = BUS_INTRO_STOP_X;
    player3.direction = "up";
    if (elapsed < DRIVE_IN_END) {
      player3.y = BUS_INTRO_PLAYER_START_Y;
      player3.frame = 0;
      player3.animationTime = 0;
    } else if (elapsed < PLAYER_WALK_END) {
      const progress = Math.min(1, (elapsed - DRIVE_IN_END) / (PLAYER_WALK_END - DRIVE_IN_END));
      player3.y = BUS_INTRO_PLAYER_START_Y + (BUS_INTRO_PLAYER_END_Y - BUS_INTRO_PLAYER_START_Y) * progress;
      player3.animationTime = (elapsed - DRIVE_IN_END) / 1e3;
      player3.frame = Math.floor(player3.animationTime * 11) % FRAME_COUNT;
    } else {
      player3.y = BUS_INTRO_PLAYER_END_Y;
      player3.frame = 0;
      player3.animationTime = 0;
    }
    if (elapsed >= INTRO_END) finishIntro(player3);
  }

  // js/cave-thief-path.ts
  var GRID_SIZE = 16;
  var MAX_EXPANSIONS = 5200;
  var COLUMNS = Math.ceil(WORLD_WIDTH / GRID_SIZE);
  var ROWS = Math.ceil(WORLD_HEIGHT / GRID_SIZE);
  function thiefPathCell(x, y) {
    const column = Math.max(0, Math.min(COLUMNS - 1, Math.floor(x / GRID_SIZE)));
    const row = Math.max(0, Math.min(ROWS - 1, Math.floor(y / GRID_SIZE)));
    return row * COLUMNS + column;
  }
  function cellCenter(cell) {
    return {
      x: cell % COLUMNS * GRID_SIZE + GRID_SIZE / 2,
      y: Math.floor(cell / COLUMNS) * GRID_SIZE + GRID_SIZE / 2
    };
  }
  function nearestPassableCell(startCell, isBlocked2) {
    const start = cellCenter(startCell);
    if (!isBlocked2(start.x, start.y)) return startCell;
    const startColumn = startCell % COLUMNS;
    const startRow = Math.floor(startCell / COLUMNS);
    for (let radius = 1; radius <= 8; radius += 1) {
      for (let row = startRow - radius; row <= startRow + radius; row += 1) {
        for (let column = startColumn - radius; column <= startColumn + radius; column += 1) {
          if (column < 0 || column >= COLUMNS || row < 0 || row >= ROWS) continue;
          const cell = row * COLUMNS + column;
          const center = cellCenter(cell);
          if (!isBlocked2(center.x, center.y)) return cell;
        }
      }
    }
    return startCell;
  }
  function buildThiefPath(startX, startY, targetX, targetY, isBlocked2) {
    const startCell = nearestPassableCell(thiefPathCell(startX, startY), isBlocked2);
    const targetCell = nearestPassableCell(thiefPathCell(targetX, targetY), isBlocked2);
    if (startCell === targetCell) return { targetCell, points: [{ x: targetX, y: targetY }] };
    const queue = [startCell];
    const cameFrom = /* @__PURE__ */ new Map([[startCell, startCell]]);
    let cursor = 0;
    while (cursor < queue.length && cursor < MAX_EXPANSIONS) {
      const cell = queue[cursor++];
      if (cell === void 0) continue;
      if (cell === targetCell) break;
      const column = cell % COLUMNS;
      const row = Math.floor(cell / COLUMNS);
      for (const [nextColumn, nextRow] of [
        [column + 1, row],
        [column - 1, row],
        [column, row + 1],
        [column, row - 1]
      ]) {
        if (nextColumn < 0 || nextColumn >= COLUMNS || nextRow < 0 || nextRow >= ROWS) continue;
        const nextCell = nextRow * COLUMNS + nextColumn;
        if (cameFrom.has(nextCell)) continue;
        const center = cellCenter(nextCell);
        if (isBlocked2(center.x, center.y)) continue;
        cameFrom.set(nextCell, cell);
        queue.push(nextCell);
      }
    }
    if (!cameFrom.has(targetCell)) return { targetCell, points: [{ x: targetX, y: targetY }] };
    const points = [];
    let current = targetCell;
    while (current !== startCell) {
      points.push(cellCenter(current));
      current = cameFrom.get(current) ?? startCell;
    }
    return { targetCell, points: points.reverse().slice(0, 18) };
  }

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

  // js/input.ts
  var DIRECTION_CODES = {
    ArrowUp: "up",
    KeyW: "up",
    ArrowDown: "down",
    KeyS: "down",
    ArrowLeft: "left",
    KeyA: "left",
    ArrowRight: "right",
    KeyD: "right"
  };
  function parseDirections(button) {
    const directions = button.dataset.directions;
    if (!directions) return [];
    return directions.split(" ").filter((value) => value === "up" || value === "down" || value === "left" || value === "right");
  }
  var DirectionInputController = class {
    constructor(options = {}) {
      this.options = options;
      this.heldDirections = /* @__PURE__ */ new Map();
      this.heldCodes = /* @__PURE__ */ new Set();
      this.releaseButtonHandlers = [];
    }
    isHeld(direction) {
      return this.heldDirections.has(direction);
    }
    releaseAll() {
      this.heldCodes.clear();
      this.heldDirections.clear();
      this.releaseButtonHandlers.forEach((release) => release());
    }
    setup() {
      document.querySelectorAll(".dpad-button").forEach((button) => this.bindDpadButton(button));
      window.addEventListener("keydown", (event) => {
        if (event.ctrlKey || event.metaKey || event.altKey) {
          this.releaseAll();
          return;
        }
        if (!DIRECTION_CODES[event.code]) return;
        event.preventDefault();
        this.pressCode(event.code);
      });
      window.addEventListener("keyup", (event) => this.releaseCode(event.code));
      window.addEventListener("blur", () => this.releaseAll());
    }
    holdDirection(direction) {
      if (this.options.canHold && !this.options.canHold()) return;
      this.heldDirections.set(direction, (this.heldDirections.get(direction) ?? 0) + 1);
    }
    releaseDirection(direction) {
      const remaining = (this.heldDirections.get(direction) ?? 0) - 1;
      if (remaining > 0) this.heldDirections.set(direction, remaining);
      else this.heldDirections.delete(direction);
    }
    pressCode(code) {
      const direction = DIRECTION_CODES[code];
      if (!direction || this.heldCodes.has(code)) return;
      this.heldCodes.add(code);
      this.holdDirection(direction);
    }
    releaseCode(code) {
      const direction = DIRECTION_CODES[code];
      if (!direction || !this.heldCodes.delete(code)) return;
      this.releaseDirection(direction);
    }
    bindDpadButton(button) {
      const directions = parseDirections(button);
      let heldPointerId = null;
      let pressed = false;
      const press = () => {
        if (pressed) return;
        pressed = true;
        directions.forEach((direction) => this.holdDirection(direction));
        button.classList.add("pressed");
      };
      const release = () => {
        if (!pressed) return;
        pressed = false;
        directions.forEach((direction) => this.releaseDirection(direction));
        button.classList.remove("pressed");
      };
      this.releaseButtonHandlers.push(release);
      button.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        heldPointerId = event.pointerId;
        press();
        try {
          button.setPointerCapture(event.pointerId);
        } catch {
        }
      });
      ["pointerup", "pointercancel", "lostpointercapture"].forEach((type) => {
        button.addEventListener(type, (event) => {
          event.preventDefault();
          heldPointerId = null;
          release();
        });
      });
      button.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        if (!event.repeat) press();
      });
      button.addEventListener("keyup", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        release();
      });
      button.addEventListener("blur", () => {
        if (heldPointerId === null) release();
      });
    }
  };
  var overworldInput = new DirectionInputController();
  var isHeld = (direction) => overworldInput.isHeld(direction);
  var releaseAllInput = () => overworldInput.releaseAll();
  var setupInput = () => overworldInput.setup();

  // js/cave-thief-cutscene.ts
  var CATCH_TRANSITION_DURATION = 1200;
  var CATCH_TRANSITION_BANDS = 12;
  var gameShell = requireElement(".game-shell");
  var messageVoices = [
    new Audio("chat/siblings/maddy.mp3"),
    new Audio("chat/siblings/marina.mp3")
  ];
  messageVoices.forEach((voice) => {
    voice.preload = "auto";
  });
  function playMessageVoices() {
    messageVoices.forEach((voice) => {
      voice.pause();
      voice.currentTime = 0;
      void voice.play().catch(() => {
      });
    });
  }
  function easeInOut2(t) {
    return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
  }
  function startCatchTransition() {
    releaseAllInput();
    const transition = document.createElement("div");
    transition.className = "battle-transition";
    transition.setAttribute("aria-hidden", "true");
    for (let index = 0; index < CATCH_TRANSITION_BANDS; index += 1) {
      const band = document.createElement("span");
      band.style.setProperty("--band-index", String(index));
      transition.append(band);
    }
    gameShell.append(transition);
    window.setTimeout(() => {
      window.location.assign("transform.html");
    }, CATCH_TRANSITION_DURATION);
  }

  // js/colander.ts
  var CAVE_DOOR_ID = "northwest-portal";
  function hasCaveColander() {
    return new URLSearchParams(window.location.search).get("colander") === "1";
  }
  function drawColander(context2, centerX, topY, scale = 1) {
    const pixel = Math.max(1, scale);
    const width = 26 * pixel;
    const left = Math.round(centerX - width / 2);
    const top = Math.round(topY);
    context2.save();
    context2.imageSmoothingEnabled = false;
    context2.fillStyle = "#1d1d22";
    context2.fillRect(left + 2 * pixel, top + 5 * pixel, 22 * pixel, 4 * pixel);
    context2.fillRect(left, top + 9 * pixel, 4 * pixel, 5 * pixel);
    context2.fillRect(left + 22 * pixel, top + 9 * pixel, 4 * pixel, 5 * pixel);
    context2.fillRect(left + 5 * pixel, top + 19 * pixel, 16 * pixel, 3 * pixel);
    context2.fillStyle = "#b7bcc3";
    context2.fillRect(left + 4 * pixel, top + 3 * pixel, 18 * pixel, 4 * pixel);
    context2.fillRect(left + 3 * pixel, top + 8 * pixel, 20 * pixel, 4 * pixel);
    context2.fillRect(left + 5 * pixel, top + 12 * pixel, 16 * pixel, 8 * pixel);
    context2.fillStyle = "#6d737e";
    for (let y = 13; y <= 18; y += 3) {
      for (let x = 7; x <= 18; x += 4) {
        context2.fillRect(left + x * pixel, top + y * pixel, 2 * pixel, 2 * pixel);
      }
    }
    context2.fillStyle = "#eceff2";
    context2.fillRect(left + 6 * pixel, top + 4 * pixel, 12 * pixel, 1 * pixel);
    context2.restore();
  }

  // js/collision-shapes.ts
  var COLLISION_SHAPES = [[431, 0, 487, 67], [1, 0, 68, 185], [199, 0, 192, 66], [1034, 0, 220, 44], [1187, 44, 67, 124], [1059, 58, 74, 82], [723, 107, 32, 1], [756, 107, 32, 1], [789, 107, 32, 1], [822, 107, 32, 1], [855, 107, 32, 1], [888, 107, 13, 1], [616, 107, 9, 1], [690, 107, 32, 1], [626, 107, 63, 1], [591, 108, 350, 1], [591, 109, 351, 27], [922, 136, 20, 87], [591, 136, 310, 34], [435, 152, 73, 81], [1186, 168, 68, 1], [1185, 169, 69, 1], [1184, 170, 70, 1], [590, 170, 311, 27], [1183, 171, 71, 1], [1182, 172, 72, 1], [1181, 173, 5, 1], [1187, 173, 67, 2], [1180, 174, 5, 1], [134, 174, 27, 5], [1186, 175, 68, 1], [1179, 175, 6, 1], [1178, 176, 76, 2], [1177, 178, 77, 1], [312, 178, 6, 1], [1176, 179, 78, 1], [134, 179, 28, 1], [310, 179, 10, 1], [134, 180, 29, 2], [309, 180, 12, 1], [1175, 180, 79, 1], [1174, 181, 80, 1], [308, 181, 14, 1], [1173, 182, 81, 1], [307, 182, 16, 1], [134, 182, 30, 1], [306, 183, 17, 2], [134, 183, 31, 1], [1171, 183, 83, 1], [134, 184, 32, 1], [1169, 184, 85, 1], [1167, 185, 87, 1], [305, 185, 19, 2], [1, 185, 69, 1], [134, 185, 33, 1], [1165, 186, 89, 1], [1, 186, 167, 1], [1161, 187, 93, 1], [304, 187, 20, 1], [1, 187, 168, 1], [1155, 188, 99, 1], [1, 188, 169, 1], [304, 188, 21, 1], [1154, 189, 100, 2], [303, 189, 22, 2], [1, 189, 170, 1], [1, 190, 171, 1], [1, 191, 172, 1], [1155, 191, 99, 3], [302, 191, 24, 1], [301, 192, 25, 1], [1, 192, 173, 1], [301, 193, 26, 1], [1, 193, 174, 1], [1, 194, 175, 1], [1154, 194, 100, 1], [300, 194, 27, 1], [1, 195, 176, 1], [299, 195, 29, 1], [1153, 195, 101, 1], [1152, 196, 102, 1], [1, 196, 177, 1], [298, 196, 30, 1], [296, 197, 32, 1], [1, 197, 178, 1], [1187, 197, 67, 4], [1152, 197, 34, 1], [589, 197, 312, 2], [289, 198, 5, 1], [1151, 198, 26, 1], [1179, 198, 6, 1], [295, 198, 34, 1], [1, 198, 179, 1], [1178, 199, 6, 1], [287, 199, 42, 1], [1, 199, 181, 1], [1160, 199, 15, 1], [1151, 199, 8, 1], [590, 199, 311, 1], [1, 200, 182, 1], [1150, 200, 8, 1], [1160, 200, 14, 1], [589, 200, 312, 10], [1177, 200, 7, 1], [286, 200, 43, 1], [285, 201, 44, 1], [1139, 201, 115, 97], [1, 201, 183, 1], [284, 202, 45, 1], [1, 202, 184, 1], [283, 203, 46, 1], [1, 203, 186, 1], [281, 204, 48, 1], [1, 204, 187, 1], [1, 205, 188, 1], [279, 205, 50, 1], [278, 206, 50, 1], [1, 206, 189, 1], [229, 207, 13, 1], [276, 207, 52, 1], [1, 207, 191, 1], [209, 208, 42, 1], [1, 208, 193, 1], [275, 208, 53, 1], [199, 209, 56, 1], [1, 209, 195, 1], [274, 209, 54, 1], [778, 210, 53, 10], [657, 210, 94, 22], [1, 210, 258, 1], [273, 210, 55, 1], [589, 210, 49, 1], [856, 210, 43, 1], [589, 211, 48, 20], [857, 211, 42, 3], [1, 211, 261, 1], [272, 211, 56, 1], [1, 212, 265, 1], [270, 212, 58, 1], [1, 213, 326, 5], [856, 214, 43, 20], [1, 218, 325, 4], [778, 220, 52, 5], [1, 222, 324, 2], [922, 223, 21, 3], [1, 224, 323, 2], [777, 225, 53, 7], [922, 226, 20, 1], [1, 226, 322, 1], [922, 227, 21, 2], [1, 227, 321, 2], [922, 229, 20, 1], [1, 229, 320, 2], [1, 231, 102, 71], [156, 231, 164, 2], [632, 231, 5, 1], [778, 232, 52, 2], [691, 232, 59, 1], [157, 233, 162, 2], [738, 233, 12, 1], [779, 234, 51, 1], [859, 234, 40, 1], [822, 235, 8, 1], [158, 235, 161, 1], [159, 236, 160, 1], [160, 237, 159, 1], [161, 238, 158, 1], [161, 239, 157, 2], [161, 241, 63, 1], [233, 241, 85, 1], [162, 242, 61, 1], [247, 242, 71, 1], [247, 243, 70, 3], [163, 243, 60, 1], [164, 244, 58, 1], [164, 245, 57, 1], [165, 246, 56, 1], [248, 246, 68, 2], [166, 247, 55, 1], [1e3, 247, 2, 1], [999, 248, 5, 1], [167, 248, 54, 2], [249, 248, 66, 1], [249, 249, 65, 1], [998, 249, 6, 1], [168, 250, 53, 1], [997, 250, 7, 1], [249, 250, 64, 1], [169, 251, 52, 1], [250, 251, 62, 1], [996, 251, 9, 2], [250, 252, 61, 1], [170, 252, 51, 1], [172, 253, 49, 1], [995, 253, 10, 1], [250, 253, 59, 1], [174, 254, 47, 1], [250, 254, 57, 1], [994, 254, 11, 1], [993, 255, 13, 1], [251, 255, 54, 1], [175, 255, 46, 1], [992, 256, 14, 1], [177, 256, 44, 1], [251, 256, 52, 1], [178, 257, 43, 1], [251, 257, 51, 1], [991, 257, 15, 1], [251, 258, 49, 1], [990, 258, 16, 1], [180, 258, 41, 1], [181, 259, 40, 1], [989, 259, 18, 1], [251, 259, 47, 1], [182, 260, 39, 1], [988, 260, 19, 1], [251, 260, 46, 1], [251, 261, 44, 1], [184, 261, 37, 1], [987, 261, 20, 1], [251, 262, 42, 1], [986, 262, 21, 1], [186, 262, 35, 1], [251, 263, 39, 1], [187, 263, 33, 1], [985, 263, 22, 1], [984, 264, 23, 1], [188, 264, 32, 1], [251, 264, 37, 1], [983, 265, 23, 1], [189, 265, 31, 1], [251, 265, 36, 2], [190, 266, 30, 1], [982, 266, 24, 1], [191, 267, 29, 1], [252, 267, 34, 1], [981, 267, 25, 1], [979, 268, 27, 1], [252, 268, 33, 1], [192, 268, 28, 1], [253, 269, 31, 1], [194, 269, 25, 1], [978, 269, 28, 1], [977, 270, 29, 1], [255, 270, 15, 1], [200, 270, 18, 1], [976, 271, 30, 1], [256, 271, 10, 1], [975, 272, 31, 1], [258, 272, 5, 1], [973, 273, 32, 1], [972, 274, 33, 1], [970, 275, 34, 1], [968, 276, 36, 1], [966, 277, 37, 1], [959, 278, 44, 1], [916, 279, 86, 1], [409, 280, 4, 1], [916, 280, 85, 2], [408, 281, 7, 1], [916, 282, 84, 1], [407, 282, 9, 1], [406, 283, 11, 1], [916, 283, 83, 2], [405, 284, 12, 1], [405, 285, 13, 1], [916, 285, 82, 2], [404, 286, 14, 1], [404, 287, 15, 2], [916, 287, 81, 1], [915, 288, 81, 1], [914, 289, 82, 1], [404, 289, 16, 2], [913, 290, 82, 1], [912, 291, 83, 1], [404, 291, 17, 1], [911, 292, 83, 1], [404, 292, 18, 1], [404, 293, 19, 1], [910, 293, 83, 1], [404, 294, 20, 1], [909, 294, 84, 1], [908, 295, 84, 1], [404, 295, 21, 1], [404, 296, 22, 1], [906, 296, 85, 1], [905, 297, 85, 1], [404, 297, 23, 1], [904, 298, 85, 1], [1147, 298, 107, 1], [404, 298, 24, 1], [1147, 299, 27, 1], [981, 299, 7, 1], [404, 299, 25, 1], [902, 299, 78, 1], [1175, 299, 79, 2], [901, 300, 78, 1], [981, 300, 6, 1], [404, 300, 27, 1], [1148, 300, 26, 1], [899, 301, 88, 1], [404, 301, 28, 1], [1148, 301, 106, 2], [404, 302, 30, 1], [1, 302, 68, 29], [897, 302, 89, 1], [1149, 303, 105, 2], [896, 303, 89, 1], [404, 303, 31, 1], [894, 304, 90, 1], [404, 304, 33, 1], [1150, 305, 104, 1], [404, 305, 34, 1], [893, 305, 91, 1], [404, 306, 36, 1], [891, 306, 92, 1], [1151, 306, 103, 2], [404, 307, 37, 1], [890, 307, 93, 1], [1152, 308, 102, 1], [404, 308, 38, 1], [888, 308, 94, 1], [887, 309, 95, 1], [1153, 309, 101, 2], [404, 309, 40, 1], [885, 310, 96, 1], [404, 310, 41, 1], [404, 311, 42, 1], [884, 311, 27, 1], [1154, 311, 100, 1], [912, 311, 69, 1], [882, 312, 98, 1], [404, 312, 43, 1], [1155, 312, 99, 1], [881, 313, 99, 1], [405, 313, 43, 1], [1156, 313, 98, 2], [879, 314, 101, 1], [405, 314, 44, 2], [1157, 315, 97, 1], [878, 315, 101, 1], [405, 316, 45, 1], [1158, 316, 96, 1], [877, 316, 102, 1], [406, 317, 45, 1], [1159, 317, 95, 1], [876, 317, 103, 1], [406, 318, 46, 2], [876, 318, 102, 2], [1160, 318, 94, 1], [1161, 319, 93, 1], [1162, 320, 92, 1], [406, 320, 47, 1], [875, 320, 102, 1], [407, 321, 120, 3], [1163, 321, 91, 1], [590, 321, 386, 2], [1164, 322, 90, 1], [590, 323, 385, 1], [1165, 323, 89, 1], [408, 324, 119, 2], [590, 324, 384, 2], [1166, 324, 88, 1], [1167, 325, 87, 1], [590, 326, 383, 1], [409, 326, 118, 3], [1168, 326, 86, 1], [1169, 327, 85, 1], [590, 327, 382, 1], [1171, 328, 83, 1], [590, 328, 381, 1], [410, 329, 117, 2], [590, 329, 380, 1], [1172, 329, 82, 1], [1173, 330, 81, 1], [590, 330, 378, 1], [1175, 331, 79, 1], [1, 331, 69, 1], [590, 331, 374, 1], [411, 331, 116, 2], [590, 332, 333, 1], [1, 332, 103, 67], [1176, 332, 78, 1], [412, 333, 115, 3], [1177, 333, 77, 1], [590, 333, 331, 1], [1179, 334, 75, 1], [590, 334, 330, 1], [590, 335, 329, 1], [1180, 335, 74, 1], [413, 336, 114, 2], [590, 336, 328, 1], [1181, 336, 73, 1], [590, 337, 326, 1], [1183, 337, 71, 1], [414, 338, 113, 2], [590, 338, 325, 1], [1185, 338, 69, 1], [590, 339, 324, 1], [1186, 339, 68, 1], [415, 340, 112, 2], [590, 340, 323, 1], [1187, 340, 67, 1], [1189, 341, 65, 1], [590, 341, 322, 1], [590, 342, 321, 1], [1190, 342, 64, 1], [416, 342, 111, 1], [417, 343, 110, 2], [1191, 343, 63, 1], [590, 343, 320, 1], [1192, 344, 62, 1], [590, 344, 319, 1], [418, 345, 109, 1], [590, 345, 318, 1], [1193, 345, 61, 1], [590, 346, 317, 1], [419, 346, 108, 1], [1194, 346, 60, 1], [590, 347, 316, 1], [1195, 347, 59, 1], [420, 347, 107, 1], [590, 348, 315, 1], [1196, 348, 58, 1], [421, 348, 106, 1], [422, 349, 105, 1], [1198, 349, 56, 1], [590, 349, 314, 1], [423, 350, 104, 1], [1199, 350, 55, 1], [590, 350, 313, 1], [424, 351, 103, 1], [590, 351, 312, 2], [1200, 351, 54, 1], [425, 352, 102, 1], [1201, 352, 53, 1], [1202, 353, 52, 1], [590, 353, 311, 1], [426, 353, 101, 1], [590, 354, 310, 1], [1203, 354, 51, 1], [427, 354, 100, 1], [428, 355, 99, 1], [590, 355, 309, 2], [1204, 355, 50, 1], [1205, 356, 49, 1], [429, 356, 98, 1], [1206, 357, 48, 1], [430, 357, 97, 1], [590, 357, 308, 1], [431, 358, 96, 1], [590, 358, 307, 1], [1207, 358, 47, 1], [433, 359, 94, 1], [590, 359, 306, 1], [1208, 359, 46, 1], [890, 360, 6, 1], [434, 360, 93, 1], [1209, 360, 45, 1], [590, 360, 298, 2], [436, 361, 91, 1], [1210, 361, 44, 1], [889, 361, 6, 1], [590, 362, 304, 1], [1212, 362, 42, 1], [437, 362, 90, 1], [438, 363, 89, 1], [1215, 363, 39, 1], [590, 363, 303, 1], [590, 364, 290, 5], [1218, 364, 36, 1], [881, 364, 11, 1], [439, 364, 88, 1], [881, 365, 10, 1], [1219, 365, 35, 3], [440, 365, 87, 1], [881, 366, 9, 2], [441, 366, 86, 1], [442, 367, 85, 1], [1218, 368, 36, 23], [443, 368, 6, 1], [450, 368, 77, 2], [882, 368, 7, 1], [882, 369, 5, 1], [883, 370, 3, 1], [197, 372, 116, 71], [1159, 391, 95, 48], [1, 399, 68, 31], [1, 430, 69, 1], [1, 431, 100, 101], [1218, 439, 36, 29], [197, 443, 39, 1], [275, 443, 38, 1], [197, 444, 38, 25], [275, 444, 37, 20], [980, 446, 115, 5], [980, 451, 116, 1], [980, 452, 115, 31], [1216, 468, 38, 1], [1215, 469, 39, 1], [1214, 470, 40, 1], [1213, 471, 41, 1], [1212, 472, 42, 1], [1211, 473, 43, 1], [1210, 474, 44, 1], [1209, 475, 45, 1], [1208, 476, 46, 1], [1207, 477, 47, 1], [1206, 478, 48, 2], [1205, 480, 49, 1], [1204, 481, 50, 1], [1203, 482, 51, 1], [980, 483, 116, 34], [1201, 483, 53, 1], [1200, 484, 54, 1], [1198, 485, 56, 1], [1197, 486, 57, 1], [1195, 487, 59, 1], [1194, 488, 60, 1], [1193, 489, 61, 2], [1192, 491, 62, 1], [1191, 492, 63, 1], [1189, 493, 65, 1], [1188, 494, 66, 1], [1186, 495, 68, 1], [1185, 496, 69, 1], [1183, 497, 71, 1], [1182, 498, 72, 1], [1181, 499, 73, 1], [1180, 500, 74, 4], [1177, 504, 77, 391], [1057, 517, 38, 29], [980, 517, 40, 16], [470, 528, 40, 19], [412, 529, 38, 18], [1, 532, 68, 31], [980, 533, 39, 1], [980, 534, 40, 1], [980, 535, 39, 1], [980, 536, 40, 2], [980, 538, 39, 7], [992, 545, 27, 1], [1, 563, 69, 1], [1, 564, 101, 69], [412, 568, 39, 18], [470, 568, 39, 19], [412, 606, 38, 20], [469, 606, 40, 19], [1, 633, 68, 30], [1, 663, 69, 1], [1, 664, 102, 101], [410, 670, 1, 1], [391, 671, 79, 32], [509, 673, 117, 24], [686, 676, 184, 1], [686, 677, 196, 23], [942, 691, 20, 13], [509, 697, 118, 4], [863, 700, 19, 151], [609, 701, 18, 169], [391, 703, 20, 166], [942, 704, 21, 1], [942, 705, 133, 23], [430, 724, 118, 16], [727, 725, 2, 1], [745, 725, 96, 1], [729, 726, 112, 1], [736, 727, 6, 2], [727, 727, 5, 2], [745, 727, 96, 2], [942, 728, 134, 50], [732, 729, 4, 1], [742, 729, 99, 1], [727, 729, 4, 1], [727, 730, 3, 1], [731, 730, 110, 1], [727, 731, 2, 4], [730, 731, 111, 4], [727, 735, 3, 1], [731, 735, 110, 1], [732, 736, 109, 6], [727, 736, 4, 6], [430, 740, 119, 1], [430, 741, 159, 69], [727, 742, 3, 4], [731, 742, 110, 4], [732, 746, 109, 3], [727, 746, 4, 6], [732, 749, 110, 3], [727, 752, 3, 4], [731, 752, 111, 4], [732, 756, 110, 6], [727, 756, 4, 6], [727, 762, 3, 3], [731, 762, 111, 3], [732, 765, 110, 7], [1, 765, 68, 31], [727, 765, 4, 7], [727, 772, 3, 3], [731, 772, 111, 3], [732, 775, 110, 6], [727, 775, 4, 6], [1038, 778, 38, 2], [942, 778, 59, 2], [961, 780, 3, 1], [966, 780, 33, 1], [943, 780, 15, 1], [1038, 780, 34, 1], [1074, 780, 2, 1], [727, 781, 3, 4], [1073, 781, 3, 2], [731, 781, 111, 4], [961, 781, 4, 2], [942, 781, 17, 5], [961, 783, 6, 1], [1070, 783, 6, 1], [960, 784, 41, 15], [1038, 784, 38, 16], [732, 785, 110, 7], [727, 785, 4, 7], [943, 786, 15, 5], [942, 791, 17, 5], [727, 792, 5, 2], [734, 792, 108, 2], [738, 794, 3, 1], [745, 794, 97, 1], [727, 794, 7, 1], [803, 795, 39, 1], [727, 795, 11, 1], [741, 795, 24, 1], [1, 796, 69, 1], [943, 796, 15, 5], [727, 796, 37, 1], [803, 796, 38, 25], [1, 797, 102, 67], [729, 797, 35, 1], [730, 798, 34, 2], [960, 799, 2, 7], [727, 800, 2, 1], [731, 800, 33, 1], [727, 801, 3, 1], [745, 801, 19, 2], [942, 801, 17, 5], [727, 802, 5, 1], [727, 803, 37, 19], [943, 806, 15, 5], [960, 806, 1, 1], [961, 808, 1, 3], [430, 810, 41, 33], [510, 810, 79, 8], [942, 811, 17, 5], [961, 814, 1, 3], [943, 816, 15, 4], [510, 818, 38, 26], [960, 820, 1, 2], [942, 820, 17, 5], [960, 822, 2, 3], [943, 825, 15, 5], [960, 825, 1, 2], [961, 828, 1, 2], [942, 830, 17, 5], [961, 834, 1, 2], [943, 835, 15, 5], [960, 840, 1, 1], [942, 840, 17, 5], [960, 841, 2, 4], [943, 845, 15, 5], [960, 845, 1, 1], [961, 847, 1, 3], [942, 850, 17, 5], [802, 851, 80, 1], [688, 851, 75, 28], [802, 852, 78, 28], [961, 854, 1, 2], [943, 855, 15, 5], [960, 860, 1, 1], [942, 860, 17, 2], [960, 861, 2, 1], [942, 862, 20, 13], [1, 864, 68, 31], [391, 869, 21, 1], [529, 870, 98, 2], [391, 870, 59, 26], [540, 872, 1, 1], [544, 872, 3, 1], [529, 872, 2, 1], [549, 872, 78, 1], [533, 873, 7, 1], [529, 873, 1, 3], [547, 873, 80, 1], [541, 873, 3, 1], [531, 874, 96, 2], [530, 876, 97, 2], [531, 878, 96, 1], [174, 879, 40, 19], [530, 879, 97, 4], [294, 880, 38, 18], [234, 880, 40, 19], [533, 883, 94, 1], [530, 883, 1, 1], [531, 884, 96, 1], [530, 885, 97, 3], [531, 888, 96, 1], [544, 889, 83, 1], [533, 889, 2, 1], [538, 889, 5, 1], [540, 890, 1, 2], [545, 890, 2, 2], [549, 890, 78, 2], [529, 892, 98, 5], [1176, 895, 78, 4], [1, 895, 69, 1], [1, 896, 103, 99], [1177, 899, 77, 2], [1178, 901, 76, 2], [1179, 903, 75, 1], [1181, 904, 73, 1], [1182, 905, 72, 1], [1183, 906, 71, 1], [1184, 907, 70, 1], [1185, 908, 69, 2], [1186, 910, 68, 1], [1187, 911, 67, 2], [1188, 913, 66, 1], [1189, 914, 65, 1], [1190, 915, 64, 1], [1191, 916, 63, 2], [1192, 918, 62, 1], [1193, 919, 61, 1], [1194, 920, 60, 2], [1195, 922, 59, 1], [1196, 923, 58, 1], [1197, 924, 57, 2], [1198, 926, 56, 1], [1199, 927, 55, 2], [1200, 929, 54, 1], [1201, 930, 53, 1], [154, 931, 471, 27], [689, 931, 95, 17], [1202, 931, 52, 2], [821, 932, 178, 5], [1203, 933, 51, 1], [1204, 934, 50, 1], [1205, 935, 49, 1], [1206, 936, 48, 1], [1207, 937, 47, 1], [821, 937, 176, 1], [821, 938, 177, 4], [1208, 938, 46, 1], [1209, 939, 45, 1], [1210, 940, 44, 1], [1211, 941, 43, 1], [1212, 942, 42, 1], [821, 942, 175, 1], [997, 942, 1, 1], [821, 943, 176, 1], [1213, 943, 41, 1], [821, 944, 177, 3], [1215, 944, 39, 1], [1216, 945, 38, 1], [1217, 946, 37, 1], [1218, 947, 36, 1], [821, 947, 176, 1], [740, 948, 44, 1], [906, 948, 9, 1], [975, 948, 8, 1], [985, 948, 6, 1], [710, 948, 9, 1], [965, 948, 9, 1], [1220, 948, 34, 1], [945, 948, 9, 1], [730, 948, 8, 1], [926, 948, 8, 1], [993, 948, 3, 1], [916, 948, 9, 1], [896, 948, 9, 1], [720, 948, 9, 1], [700, 948, 9, 1], [694, 948, 5, 1], [821, 948, 64, 1], [689, 948, 3, 1], [955, 948, 9, 1], [936, 948, 8, 1], [887, 948, 8, 1], [736, 949, 1, 1], [903, 949, 1, 1], [707, 949, 1, 1], [1221, 949, 33, 1], [721, 949, 3, 1], [821, 949, 60, 1], [898, 949, 2, 1], [917, 949, 3, 1], [986, 949, 2, 1], [702, 949, 2, 1], [971, 949, 1, 1], [883, 949, 1, 1], [745, 949, 39, 1], [937, 949, 2, 1], [741, 949, 2, 1], [942, 949, 1, 1], [922, 949, 1, 1], [726, 949, 1, 1], [956, 949, 3, 1], [961, 949, 2, 1], [711, 949, 3, 1], [888, 949, 2, 1], [907, 949, 3, 1], [976, 949, 2, 1], [912, 949, 2, 1], [981, 949, 1, 1], [716, 949, 2, 1], [731, 949, 3, 1], [697, 949, 1, 1], [893, 949, 1, 1], [932, 949, 1, 1], [966, 949, 3, 1], [947, 949, 2, 1], [927, 949, 2, 1], [952, 949, 1, 1], [689, 950, 95, 10], [1223, 950, 31, 1], [821, 950, 178, 7], [1224, 951, 30, 1], [1225, 952, 29, 1], [1226, 953, 28, 1], [1227, 954, 27, 1], [1228, 955, 26, 1], [1229, 956, 25, 1], [1230, 957, 24, 1], [1231, 958, 23, 1], [1232, 959, 22, 1], [1233, 960, 20, 1], [1233, 961, 8, 1], [1235, 962, 4, 1], [746, 962, 114, 95], [509, 978, 88, 20], [1, 995, 68, 135], [509, 998, 89, 35], [352, 1e3, 13, 74], [609, 1e3, 16, 150], [703, 1e3, 2, 1], [689, 1001, 13, 1], [704, 1001, 1, 2], [689, 1002, 14, 1], [689, 1003, 15, 2], [689, 1005, 14, 2], [689, 1007, 15, 5], [689, 1012, 14, 4], [689, 1016, 15, 5], [689, 1021, 14, 5], [173, 1024, 1, 1], [153, 1024, 3, 1], [105, 1024, 13, 12], [138, 1024, 3, 1], [133, 1024, 3, 1], [158, 1024, 2, 1], [119, 1024, 2, 1], [135, 1025, 1, 1], [119, 1025, 1, 1], [165, 1025, 3, 2], [146, 1025, 2, 2], [126, 1025, 3, 2], [154, 1025, 2, 1], [138, 1025, 2, 1], [158, 1025, 1, 1], [689, 1026, 15, 5], [97, 1028, 7, 19], [135, 1030, 1, 1], [119, 1030, 1, 1], [154, 1030, 2, 1], [138, 1030, 2, 1], [158, 1030, 1, 1], [173, 1031, 1, 1], [153, 1031, 3, 1], [138, 1031, 3, 1], [133, 1031, 3, 1], [158, 1031, 2, 1], [689, 1031, 14, 5], [119, 1031, 2, 1], [568, 1033, 29, 24], [509, 1033, 21, 23], [145, 1034, 1, 1], [129, 1034, 1, 1], [168, 1034, 1, 1], [164, 1034, 1, 1], [148, 1034, 1, 1], [125, 1034, 1, 1], [141, 1035, 1, 1], [152, 1035, 1, 1], [165, 1035, 3, 1], [146, 1035, 2, 1], [126, 1035, 3, 1], [160, 1035, 2, 1], [171, 1035, 2, 1], [132, 1035, 1, 1], [121, 1035, 1, 1], [105, 1036, 14, 1], [136, 1036, 2, 1], [689, 1036, 15, 5], [156, 1036, 2, 1], [105, 1037, 15, 1], [135, 1037, 5, 1], [154, 1037, 5, 1], [105, 1038, 69, 9], [689, 1041, 14, 5], [689, 1046, 15, 5], [97, 1047, 78, 1], [97, 1048, 7, 2], [105, 1048, 70, 2], [97, 1050, 78, 8], [689, 1051, 14, 5], [689, 1056, 15, 5], [746, 1057, 115, 28], [97, 1058, 7, 1], [105, 1058, 70, 1], [97, 1059, 78, 1], [97, 1060, 7, 3], [105, 1060, 70, 4], [689, 1061, 14, 4], [98, 1063, 6, 1], [98, 1064, 77, 4], [689, 1065, 15, 5], [105, 1068, 70, 1], [98, 1068, 6, 1], [98, 1069, 77, 9], [689, 1070, 14, 5], [224, 1074, 3, 1], [278, 1074, 1, 1], [244, 1074, 2, 1], [263, 1074, 3, 1], [362, 1074, 3, 2], [352, 1074, 1, 2], [354, 1074, 1, 1], [211, 1074, 1, 1], [360, 1074, 1, 1], [239, 1074, 1, 1], [219, 1074, 1, 1], [258, 1074, 2, 1], [269, 1074, 2, 1], [356, 1074, 3, 4], [250, 1074, 1, 1], [230, 1074, 1, 1], [689, 1075, 15, 5], [253, 1075, 3, 1], [1190, 1075, 64, 63], [234, 1075, 2, 1], [273, 1075, 3, 1], [214, 1075, 3, 1], [252, 1076, 5, 2], [361, 1076, 4, 2], [272, 1076, 5, 2], [213, 1076, 5, 2], [352, 1076, 2, 2], [233, 1076, 5, 2], [360, 1078, 5, 1], [209, 1078, 26, 1], [255, 1078, 28, 1], [352, 1078, 3, 1], [105, 1078, 70, 1], [98, 1078, 6, 1], [238, 1079, 14, 1], [361, 1079, 4, 1], [209, 1079, 22, 1], [258, 1079, 25, 1], [98, 1079, 77, 4], [355, 1079, 5, 1], [352, 1079, 2, 1], [209, 1080, 20, 1], [354, 1080, 7, 6], [362, 1080, 3, 16], [235, 1080, 20, 1], [261, 1080, 22, 1], [689, 1080, 14, 5], [352, 1080, 1, 16], [209, 1081, 19, 2], [262, 1081, 21, 2], [230, 1081, 30, 2], [268, 1083, 15, 1], [229, 1083, 32, 1], [209, 1083, 13, 1], [97, 1083, 78, 8], [209, 1084, 10, 1], [271, 1084, 12, 1], [228, 1084, 34, 1], [222, 1085, 46, 1], [689, 1085, 15, 5], [746, 1085, 38, 30], [209, 1085, 9, 1], [821, 1085, 40, 1], [272, 1085, 11, 1], [821, 1086, 39, 32], [220, 1086, 49, 1], [273, 1086, 10, 1], [355, 1086, 5, 1], [209, 1086, 8, 1], [209, 1087, 7, 3], [354, 1087, 1, 8], [360, 1087, 1, 8], [274, 1087, 9, 3], [219, 1087, 52, 2], [356, 1087, 3, 10], [218, 1089, 54, 2], [276, 1090, 7, 1], [209, 1090, 5, 1], [689, 1090, 14, 5], [209, 1091, 4, 1], [97, 1091, 7, 36], [105, 1091, 70, 24], [217, 1091, 56, 3], [277, 1091, 6, 1], [278, 1092, 5, 2], [209, 1092, 3, 2], [279, 1094, 4, 1], [216, 1094, 58, 1], [209, 1094, 2, 1], [213, 1095, 64, 1], [689, 1095, 15, 5], [280, 1095, 3, 2], [361, 1096, 4, 1], [352, 1096, 2, 1], [212, 1096, 66, 1], [360, 1097, 5, 1], [209, 1097, 74, 44], [352, 1097, 3, 1], [361, 1098, 4, 2], [355, 1098, 5, 2], [352, 1098, 2, 2], [354, 1100, 7, 6], [362, 1100, 3, 16], [689, 1100, 14, 5], [352, 1100, 1, 16], [689, 1105, 15, 4], [355, 1106, 5, 1], [354, 1107, 1, 7], [360, 1107, 1, 7], [356, 1107, 3, 10], [689, 1109, 14, 5], [689, 1114, 15, 5], [361, 1116, 4, 1], [352, 1116, 2, 1], [360, 1117, 5, 1], [352, 1117, 3, 1], [361, 1118, 4, 1], [355, 1118, 5, 1], [352, 1118, 2, 1], [354, 1119, 7, 6], [362, 1119, 3, 16], [689, 1119, 14, 5], [352, 1119, 1, 16], [689, 1124, 15, 5], [355, 1125, 5, 2], [354, 1127, 1, 7], [360, 1127, 1, 7], [356, 1127, 3, 9], [97, 1127, 8, 1], [97, 1128, 38, 6], [689, 1129, 14, 5], [32, 1130, 37, 4], [689, 1134, 15, 4], [32, 1134, 103, 26], [361, 1135, 5, 1], [352, 1135, 2, 1], [380, 1136, 14, 2], [478, 1136, 14, 2], [497, 1136, 15, 2], [556, 1136, 5, 2], [352, 1136, 3, 2], [438, 1136, 15, 2], [536, 1136, 15, 2], [419, 1136, 15, 2], [360, 1136, 15, 2], [458, 1136, 15, 2], [399, 1136, 15, 2], [566, 1136, 5, 2], [517, 1136, 14, 2], [414, 1138, 5, 1], [479, 1138, 12, 1], [498, 1138, 13, 1], [352, 1138, 2, 1], [473, 1138, 5, 1], [561, 1138, 5, 1], [453, 1138, 5, 1], [434, 1138, 4, 1], [361, 1138, 13, 1], [459, 1138, 12, 1], [538, 1138, 12, 1], [512, 1138, 5, 1], [689, 1138, 13, 1], [518, 1138, 12, 1], [492, 1138, 5, 1], [557, 1138, 3, 1], [381, 1138, 12, 1], [375, 1138, 5, 1], [567, 1138, 4, 1], [400, 1138, 13, 1], [551, 1138, 5, 1], [440, 1138, 12, 1], [531, 1138, 5, 1], [355, 1138, 5, 1], [420, 1138, 12, 1], [1160, 1138, 94, 56], [394, 1138, 5, 1], [703, 1138, 1, 1], [560, 1139, 7, 6], [362, 1139, 10, 1], [441, 1139, 10, 1], [452, 1139, 7, 6], [402, 1139, 9, 1], [471, 1139, 8, 6], [689, 1139, 14, 1], [511, 1139, 7, 6], [421, 1139, 10, 1], [491, 1139, 7, 6], [530, 1139, 8, 6], [480, 1139, 10, 1], [352, 1139, 1, 15], [460, 1139, 10, 1], [550, 1139, 7, 6], [374, 1139, 7, 6], [354, 1139, 7, 6], [519, 1139, 10, 1], [500, 1139, 9, 1], [539, 1139, 10, 1], [432, 1139, 8, 6], [568, 1139, 3, 15], [413, 1139, 7, 6], [382, 1139, 10, 1], [393, 1139, 7, 6], [689, 1140, 15, 3], [362, 1141, 10, 4], [441, 1141, 10, 4], [402, 1141, 9, 4], [209, 1141, 75, 1], [421, 1141, 10, 4], [480, 1141, 10, 4], [460, 1141, 10, 4], [519, 1141, 10, 4], [500, 1141, 9, 4], [539, 1141, 10, 4], [382, 1141, 10, 4], [182, 1142, 126, 18], [689, 1143, 14, 1], [699, 1144, 3, 1], [694, 1144, 3, 1], [689, 1144, 3, 1], [434, 1145, 4, 1], [394, 1145, 5, 1], [561, 1145, 5, 1], [551, 1145, 5, 1], [492, 1145, 5, 1], [414, 1145, 5, 1], [531, 1145, 5, 1], [355, 1145, 5, 1], [473, 1145, 5, 1], [512, 1145, 5, 1], [453, 1145, 5, 1], [375, 1145, 5, 1], [419, 1146, 1, 1], [452, 1146, 1, 1], [560, 1146, 1, 1], [362, 1146, 10, 4], [399, 1146, 1, 1], [441, 1146, 10, 4], [402, 1146, 9, 4], [438, 1146, 2, 1], [471, 1146, 2, 1], [478, 1146, 1, 1], [511, 1146, 1, 1], [566, 1146, 1, 1], [421, 1146, 10, 4], [458, 1146, 1, 1], [491, 1146, 1, 1], [480, 1146, 10, 4], [374, 1146, 1, 1], [536, 1146, 2, 1], [460, 1146, 10, 4], [354, 1146, 1, 1], [517, 1146, 1, 1], [550, 1146, 1, 1], [689, 1146, 16, 3], [556, 1146, 1, 1], [519, 1146, 10, 4], [500, 1146, 9, 4], [497, 1146, 1, 1], [530, 1146, 1, 1], [539, 1146, 10, 4], [380, 1146, 1, 1], [413, 1146, 1, 1], [432, 1146, 2, 1], [360, 1146, 1, 1], [382, 1146, 10, 4], [393, 1146, 1, 1], [560, 1147, 7, 5], [452, 1147, 7, 5], [471, 1147, 8, 5], [511, 1147, 7, 5], [491, 1147, 7, 5], [530, 1147, 8, 5], [550, 1147, 7, 5], [374, 1147, 7, 5], [354, 1147, 7, 5], [432, 1147, 8, 5], [413, 1147, 7, 5], [393, 1147, 7, 5], [434, 1152, 4, 2], [394, 1152, 5, 2], [561, 1152, 5, 2], [551, 1152, 5, 2], [492, 1152, 5, 2], [414, 1152, 5, 2], [531, 1152, 5, 2], [355, 1152, 5, 2], [473, 1152, 5, 2], [512, 1152, 5, 2], [453, 1152, 5, 2], [375, 1152, 5, 2], [32, 1160, 104, 1], [182, 1160, 127, 1], [32, 1161, 300, 51], [1130, 1194, 124, 60], [333, 1195, 726, 59], [104, 1212, 228, 41], [134, 1253, 198, 1]];

  // js/manual-collision-shapes.ts
  var MANUAL_COLLISION_SHAPES = [[64, 0, 96, 192], [152, 216, 8, 8], [584, 272, 24, 16], [736, 288, 8, 8], [584, 288, 80, 8], [752, 288, 56, 8], [584, 296, 264, 8], [656, 304, 48, 8], [592, 304, 40, 8], [152, 320, 200, 16], [152, 336, 24, 16], [336, 336, 16, 64], [160, 352, 16, 8], [152, 360, 24, 8], [160, 368, 16, 16], [944, 400, 176, 8], [936, 408, 184, 16], [936, 424, 24, 64], [160, 432, 16, 88], [336, 448, 16, 16], [328, 464, 24, 16], [336, 480, 16, 48], [936, 488, 16, 8], [944, 496, 8, 8], [160, 520, 40, 16], [160, 536, 16, 8], [936, 544, 24, 72], [160, 576, 56, 8], [288, 576, 64, 8], [272, 584, 80, 8], [152, 584, 88, 8], [336, 592, 16, 64], [272, 592, 24, 8], [216, 592, 24, 8], [160, 592, 16, 16], [1072, 600, 48, 16], [152, 608, 32, 8], [152, 616, 24, 80], [944, 616, 16, 8], [328, 656, 24, 40], [968, 680, 152, 8], [952, 688, 168, 8], [1072, 696, 48, 8], [960, 696, 16, 8], [160, 696, 16, 16], [336, 696, 16, 64], [1104, 704, 16, 152], [160, 712, 24, 16], [152, 728, 32, 24], [152, 752, 24, 56], [328, 760, 24, 24], [336, 784, 16, 32], [152, 808, 64, 8], [152, 816, 80, 8], [296, 816, 56, 8], [272, 824, 80, 8], [152, 824, 88, 8], [152, 832, 72, 8], [160, 840, 16, 8], [1040, 856, 80, 16], [992, 856, 8, 8], [952, 864, 48, 8], [984, 872, 16, 8], [960, 872, 16, 8], [1040, 872, 56, 8], [776, 944, 48, 8], [1032, 952, 88, 88], [392, 952, 16, 8], [440, 952, 24, 8], [776, 952, 56, 8], [384, 960, 88, 16], [992, 1008, 16, 8], [984, 1016, 24, 112], [992, 1128, 16, 24], [912, 1144, 24, 8], [688, 1144, 64, 16], [904, 1152, 104, 16], [904, 1168, 32, 8], [547, 420, 197, 23], [724, 438, 20, 185], [547, 600, 61, 23], [684, 600, 60, 23]];

  // js/signs.ts
  var SIGN_MESSAGES = [
    "Hey, welcome to my website! You can quick-travel by clicking the \u201CJump\u201D button in the bottom-right. Hit me if you have questions!",
    "People add things to your inventory as you talk to them click the inventory button to use it. Hope this helped!",
    "DC has one of the highest employment rates in the country, so helping folks find work is my side hustle.",
    "Max is going to be adding more people, places, things so check back soon! Have ideas and don't have me on whatsapp? Jump on over to the Feedback Center - he would love to hear them."
  ];
  var SIGNS = [
    {
      id: "north-directory",
      title: "Check back for more",
      message: SIGN_MESSAGES[3],
      x: 392,
      y: 157,
      width: 19,
      height: 20,
      signed: true
    },
    {
      id: "music-shop-placard",
      title: "Inventory",
      message: SIGN_MESSAGES[1],
      x: MUSIC_SHOP_SIGN_X,
      y: MUSIC_SHOP_SIGN_Y,
      width: MUSIC_SHOP_SIGN_WIDTH,
      height: MUSIC_SHOP_SIGN_HEIGHT,
      signed: true
    },
    {
      id: "job-center-noticeboard",
      title: "Job Center",
      message: SIGN_MESSAGES[2],
      x: 1057,
      y: 803,
      width: 43,
      height: 59
    },
    {
      id: "east-directory",
      title: "Fast travel",
      message: SIGN_MESSAGES[0],
      x: 610,
      y: 1151,
      width: 25,
      height: 23,
      signed: true
    },
    {
      id: "bus-stop",
      title: "Bus Stop",
      message: "The bus to DC is coming in the new year.",
      x: ROAD_X + ROAD_BUS_SIGN_SOURCE_X,
      y: ROAD_Y + ROAD_BUS_SIGN_SOURCE_Y,
      width: ROAD_BUS_SIGN_WIDTH,
      height: ROAD_BUS_SIGN_HEIGHT,
      signed: false
    }
  ];
  var SIGN_COLLISION_SHAPES = [
    ...SIGNS.map(({ x, y, width, height }) => [x, y, width, height]),
    // The billboard remains a solid map object even though it is no longer an
    // interactive sign; Rei now owns the interaction in front of it.
    [BILLBOARD_X, BILLBOARD_Y, 108, 61]
  ];
  var dialogue = requireElement("#sign-dialogue");
  var dialogueTitle = requireElement("#sign-dialogue-title");
  var dialogueText = requireElement("#sign-dialogue-text");
  var dialogueSignature = requireElement("#sign-dialogue-signature");
  var signatureImage = requireElement("#sign-dialogue-signature-image");
  var busImage = requireElement("#sign-dialogue-bus-image");
  var announcer = requireElement("#announcer");
  var READ_DISTANCE = 46;
  var DISMISS_DISTANCE = 62;
  var activeSign = null;
  function playerFootIntersectsSign(playerX, playerY, sign) {
    const footHalfWidth = Math.max(4, FRAME_WIDTH * SCALE * 0.3);
    const left = playerX - footHalfWidth;
    const right = playerX + footHalfWidth;
    const top = playerY - Math.max(4, FRAME_HEIGHT * SCALE * 0.18);
    const bottom = playerY;
    return left < sign.x + sign.width && right > sign.x && top < sign.y + sign.height && bottom > sign.y;
  }
  function distanceToSign(playerX, playerY, sign) {
    const dx = Math.max(sign.x - playerX, 0, playerX - (sign.x + sign.width));
    const dy = Math.max(sign.y - playerY, 0, playerY - (sign.y + sign.height));
    return Math.hypot(dx, dy);
  }
  function showSign(sign) {
    if (activeSign?.id === sign.id) return;
    activeSign = sign;
    dialogueTitle.textContent = sign.title;
    dialogueText.textContent = sign.message;
    const isBusStop = sign.id === "bus-stop";
    const hasSignature = sign.id !== "bus-stop" && sign.id !== "job-center-noticeboard";
    dialogueSignature.hidden = !isBusStop && !hasSignature;
    signatureImage.hidden = isBusStop;
    busImage.hidden = !isBusStop;
    dialogue.hidden = false;
    announcer.textContent = `${sign.title}: ${sign.message}`;
  }
  function hideSignDialogue() {
    activeSign = null;
    dialogue.hidden = true;
    dialogueSignature.hidden = true;
    signatureImage.hidden = true;
    busImage.hidden = true;
  }
  function bumpSignAt(playerX, playerY) {
    const sign = SIGNS.find((candidate) => playerFootIntersectsSign(playerX, playerY, candidate));
    if (!sign) return false;
    showSign(sign);
    return true;
  }
  function updateSigns(playerX, playerY) {
    let nearestSign = null;
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
      hideSignDialogue();
    }
  }

  // js/collision-data.ts
  var RAW_COLLISION_SHAPES = [
    ...COLLISION_SHAPES,
    ...MANUAL_COLLISION_SHAPES,
    ...SIGN_COLLISION_SHAPES
  ];
  var COLLISION_CUTOUTS = [
    // Remove every generated/manual obstacle in the western garden. Its clean,
    // red-box collision bounds are added back after all cutouts are applied.
    [140, 560, 224, 304],
    // Remove the two generated collision blocks flanking the southern road entrance.
    [333, 1190, 726, 64],
    // Clear the removed southwest tree pyramid and both adjoining paved paths.
    [176, 1074, 144, 124],
    [170, 1156, 8, 12],
    [315, 1062, 50, 192],
    [160, 1188, 193, 66],
    [120, 1098, 36, 39],
    [94, 1130, 68, 18],
    [104, 1148, 70, 15],
    [115, 1163, 63, 15],
    [130, 1178, 49, 14],
    // Adam and Ed are conversation triggers, not physical obstacles. Clear
    // narrow paths through their bench slots so walking into either sprite
    // starts dialogue without trapping the player below the bench collision.
    [170, 870, 50, 100],
    [230, 870, 50, 100]
  ];
  function subtractCollisionShape(shape, cutout) {
    const [x, y, width, height] = shape;
    const [cutoutX, cutoutY, cutoutWidth, cutoutHeight] = cutout;
    const right = x + width;
    const bottom = y + height;
    const cutoutRight = cutoutX + cutoutWidth;
    const cutoutBottom = cutoutY + cutoutHeight;
    const intersectionLeft = Math.max(x, cutoutX);
    const intersectionTop = Math.max(y, cutoutY);
    const intersectionRight = Math.min(right, cutoutRight);
    const intersectionBottom = Math.min(bottom, cutoutBottom);
    if (intersectionLeft >= intersectionRight || intersectionTop >= intersectionBottom) {
      return [shape];
    }
    const pieces = [];
    if (y < intersectionTop) pieces.push([x, y, width, intersectionTop - y]);
    if (intersectionBottom < bottom) {
      pieces.push([x, intersectionBottom, width, bottom - intersectionBottom]);
    }
    if (x < intersectionLeft) {
      pieces.push([x, intersectionTop, intersectionLeft - x, intersectionBottom - intersectionTop]);
    }
    if (intersectionRight < right) {
      pieces.push([
        intersectionRight,
        intersectionTop,
        right - intersectionRight,
        intersectionBottom - intersectionTop
      ]);
    }
    return pieces;
  }
  var MAP_COLLISION_SHAPES = COLLISION_CUTOUTS.reduce(
    (shapes, cutout) => shapes.flatMap((shape) => subtractCollisionShape(shape, cutout)),
    [...RAW_COLLISION_SHAPES]
  );
  var ROAD_COLLISION_SHAPES = [
    [ROAD_BUS_ROOF_X, ROAD_Y + 30, ROAD_BUS_ROOF_WIDTH, 15],
    [
      ROAD_X + ROAD_BUS_SIGN_SOURCE_X,
      ROAD_Y + ROAD_BUS_SIGN_SOURCE_Y,
      ROAD_BUS_SIGN_WIDTH,
      ROAD_BUS_SIGN_HEIGHT
    ]
  ];
  var WESTERN_GARDEN_COLLISION_SHAPES = [
    [152, 576, 88, 40],
    [272, 576, 80, 40],
    [152, 576, 32, 272],
    [328, 576, 24, 272],
    [152, 808, 88, 40],
    [272, 808, 80, 40]
  ];
  var COLLISION_SHAPES2 = [
    ...MAP_COLLISION_SHAPES,
    ...WESTERN_GARDEN_COLLISION_SHAPES,
    ...ROAD_COLLISION_SHAPES
  ];

  // js/doors.ts
  var DOORWAYS = [
    { id: "northwest-portal", x: 222, y: 242, width: 27, height: 25 },
    { id: "garden-room", x: 637, y: 208, width: 19, height: 26 },
    { id: "diary-lab-center", x: 754, y: 204, width: 24, height: 21 },
    { id: "diary-lab-right", x: 833, y: 204, width: 22, height: 23 },
    { id: "music-shop", x: 240, y: 428, width: 30, height: 31 },
    { id: "gym", x: 1024, y: 519, width: 30, height: 28 },
    { id: "job-center", x: 1005, y: 775, width: 33, height: 34 },
    { id: "artist-studio", x: 762, y: 788, width: 33, height: 32 },
    { id: "cinema", x: 474, y: 800, width: 33, height: 40 },
    { id: "bookshop", x: 542, y: 1034, width: 25, height: 30 },
    { id: "snow-mansion", x: 792, y: 1100, width: 32, height: 32 },
    { id: "feedback-center", x: 123, y: 1103, width: 30, height: 31 }
  ];
  var OPEN_DISTANCE = 42;
  var PASSAGE_MARGIN = 8;
  var doorSound = new Audio("audio/open-door.mp3");
  doorSound.preload = "auto";
  var openDoorIds = /* @__PURE__ */ new Set();
  var hasSyncedInitialDoorState = false;
  var navigationStarted = false;
  function distanceToDoorway(x, y, doorway) {
    const dx = Math.max(doorway.x - x, 0, x - (doorway.x + doorway.width));
    const dy = Math.max(doorway.y - y, 0, y - (doorway.y + doorway.height));
    return Math.hypot(dx, dy);
  }
  function pointInsideDoorway(x, y, doorway, margin = 0) {
    return x >= doorway.x - margin && x <= doorway.x + doorway.width + margin && y >= doorway.y - margin && y <= doorway.y + doorway.height + margin;
  }
  function playDoorSound() {
    doorSound.currentTime = 0;
    void doorSound.play().catch(() => {
    });
  }
  function updateDoors(playerX, playerY) {
    const nextOpenDoorIds = new Set(
      DOORWAYS.filter((doorway) => distanceToDoorway(playerX, playerY, doorway) <= OPEN_DISTANCE).map((doorway) => doorway.id)
    );
    if (hasSyncedInitialDoorState && [...nextOpenDoorIds].some((id) => !openDoorIds.has(id))) {
      playDoorSound();
    }
    openDoorIds = nextOpenDoorIds;
    hasSyncedInitialDoorState = true;
    if (navigationStarted) return;
    const enteredDoorway = DOORWAYS.find((doorway) => pointInsideDoorway(playerX, playerY, doorway));
    if (!enteredDoorway) return;
    navigationStarted = true;
    const params = new URLSearchParams({ door: enteredDoorway.id });
    if (hasCaveColander()) params.set("colander", "1");
    if (new URLSearchParams(window.location.search).has("seal")) params.set("seal", "1");
    window.location.assign(`internal/index.html?${params.toString()}`);
  }
  function getOpenDoorways() {
    return DOORWAYS.filter((doorway) => openDoorIds.has(doorway.id));
  }
  function isDoorPassagePoint(x, y) {
    return DOORWAYS.some((doorway) => pointInsideDoorway(x, y, doorway, PASSAGE_MARGIN));
  }

  // js/movement.ts
  function moveWithCollisions(position, movementX, movementY, isBlocked2) {
    const steps = Math.max(1, Math.ceil(Math.max(Math.abs(movementX), Math.abs(movementY)) / 4));
    const stepX = movementX / steps;
    const stepY = movementY / steps;
    for (let step = 0; step < steps; step += 1) {
      const nextX = position.x + stepX;
      if (!isBlocked2(nextX, position.y)) position.x = nextX;
      const nextY = position.y + stepY;
      if (!isBlocked2(position.x, nextY)) position.y = nextY;
    }
  }

  // js/georgia.ts
  var CYCLE_SPEED = 160;
  var COLLISION_DISTANCE = 24;
  var COLLISION_PADDING = 2;
  var MIN_ACTION_TIME = 0.75;
  var MAX_ACTION_TIME = 2.4;
  var IDLE_CHANCE = 0.28;
  var GEORGIA = {
    x: 1035,
    y: 385,
    width: 40,
    height: 46
  };
  var georgiaState = {
    x: GEORGIA.x,
    y: GEORGIA.y,
    direction: "down",
    moving: false,
    actionTime: 0,
    animationTime: 0
  };
  var interactionPaused = false;
  function setGeorgiaInteractionPaused(paused) {
    interactionPaused = paused;
    if (paused) {
      georgiaState.moving = false;
      georgiaState.animationTime = 0;
    }
  }
  function playerCollidesWithGeorgia(x, y) {
    return Math.hypot(x - georgiaState.x, y - georgiaState.y) < COLLISION_DISTANCE;
  }
  function chooseNextAction() {
    georgiaState.actionTime = MIN_ACTION_TIME + Math.random() * (MAX_ACTION_TIME - MIN_ACTION_TIME);
    georgiaState.moving = Math.random() >= IDLE_CHANCE;
    if (!georgiaState.moving) return;
    const directions = ["down", "left", "right", "up"];
    georgiaState.direction = directions[Math.floor(Math.random() * directions.length)] ?? "down";
  }
  function collidesWithWorld(x, y) {
    const footHalfWidth = Math.max(4, FRAME_WIDTH * SCALE * 0.3) + COLLISION_PADDING;
    const left = x - footHalfWidth;
    const right = x + footHalfWidth;
    const top = y - Math.max(4, FRAME_HEIGHT * SCALE * 0.18) - COLLISION_PADDING;
    const bottom = y + COLLISION_PADDING;
    return COLLISION_SHAPES2.some(([shapeX, shapeY, shapeWidth, shapeHeight]) => left < shapeX + shapeWidth && right > shapeX && top < shapeY + shapeHeight && bottom > shapeY);
  }
  function clampToWorld() {
    georgiaState.x = Math.max(GEORGIA.width / 2, Math.min(WORLD_WIDTH - GEORGIA.width / 2, georgiaState.x));
    georgiaState.y = Math.max(GEORGIA.height, Math.min(WORLD_HEIGHT, georgiaState.y));
  }
  function updateGeorgia(deltaTime) {
    if (interactionPaused) return;
    georgiaState.actionTime -= deltaTime;
    if (georgiaState.actionTime <= 0) chooseNextAction();
    if (!georgiaState.moving) {
      georgiaState.animationTime = 0;
      return;
    }
    let dx = 0;
    let dy = 0;
    if (georgiaState.direction === "left") dx = -1;
    else if (georgiaState.direction === "right") dx = 1;
    else if (georgiaState.direction === "up") dy = -1;
    else dy = 1;
    const previousX = georgiaState.x;
    const previousY = georgiaState.y;
    georgiaState.animationTime += deltaTime;
    moveWithCollisions(
      georgiaState,
      dx * CYCLE_SPEED * deltaTime,
      dy * CYCLE_SPEED * deltaTime,
      collidesWithWorld
    );
    clampToWorld();
    if (georgiaState.x === previousX && georgiaState.y === previousY) georgiaState.actionTime = 0;
  }

  // js/snowman.ts
  var SNOWMAN = {
    // Matches the snowman baked into snow-mansion.png.
    x: 925,
    y: 1110,
    fallenWidth: 82,
    fallenHeight: 67
  };
  var COLLISION_RADIUS = 25;
  var fallen = false;
  var fallSound = new Audio("map/audio/snowman.m4a");
  fallSound.preload = "auto";
  var isSnowmanFallen = () => fallen;
  function playFallSound() {
    fallSound.currentTime = 0;
    void fallSound.play().catch(() => {
    });
  }
  function playerCollidesWithSnowman(x, y) {
    if (fallen) return false;
    if (Math.hypot(x - SNOWMAN.x, y - SNOWMAN.y) >= COLLISION_RADIUS) return false;
    fallen = true;
    playFallSound();
    return true;
  }

  // js/collision.ts
  var bucketKey = (column, row) => `${column},${row}`;
  function forEachBucket(left, top, right, bottom, visit) {
    const firstColumn = Math.floor(left / COLLISION_BUCKET_SIZE);
    const lastColumn = Math.floor(right / COLLISION_BUCKET_SIZE);
    const firstRow = Math.floor(top / COLLISION_BUCKET_SIZE);
    const lastRow = Math.floor(bottom / COLLISION_BUCKET_SIZE);
    for (let row = firstRow; row <= lastRow; row += 1) {
      for (let column = firstColumn; column <= lastColumn; column += 1) {
        if (visit(bucketKey(column, row))) return true;
      }
    }
    return false;
  }
  var collisionBuckets = /* @__PURE__ */ new Map();
  COLLISION_SHAPES2.forEach((shape) => {
    const [x, y, width, height] = shape;
    forEachBucket(x, y, x + width - 1, y + height - 1, (key) => {
      let bucket = collisionBuckets.get(key);
      if (!bucket) {
        bucket = [];
        collisionBuckets.set(key, bucket);
      }
      bucket.push(shape);
      return false;
    });
  });
  function playerCollidesAt(x, y) {
    if (isDoorPassagePoint(x, y)) return false;
    if (playerCollidesWithGeorgia(x, y)) return true;
    if (playerCollidesWithSnowman(x, y)) return true;
    const footHalfWidth = Math.max(4, FRAME_WIDTH * SCALE * 0.3);
    const left = x - footHalfWidth;
    const right = x + footHalfWidth;
    const top = y - Math.max(4, FRAME_HEIGHT * SCALE * 0.18);
    const bottom = y;
    return forEachBucket(left, top, right, bottom, (key) => {
      const shapes = collisionBuckets.get(key);
      if (!shapes) return false;
      for (const [shapeX, shapeY, shapeWidth, shapeHeight] of shapes) {
        if (left < shapeX + shapeWidth && right > shapeX && top < shapeY + shapeHeight && bottom > shapeY) return true;
      }
      return false;
    });
  }

  // js/cave-thief.ts
  var CAVE_DOOR = DOORWAYS.find((doorway) => doorway.id === CAVE_DOOR_ID);
  var THIEF_SIZE = 24;
  var SEQUENCE_DELAY = 5e3;
  var PAN_DURATION = 1200;
  var MESSAGE_DURATION = 1800;
  var PATH_REFRESH_INTERVAL = 0.22;
  var SPAWN_OUTSIDE_CAVE_OFFSET = 41;
  var MESSAGE = "Come back here you thief!";
  var CATCH_DISTANCE = 28;
  var entrance = {
    x: CAVE_DOOR ? CAVE_DOOR.x + CAVE_DOOR.width / 2 : 236,
    y: CAVE_DOOR ? CAVE_DOOR.y + CAVE_DOOR.height + SPAWN_OUTSIDE_CAVE_OFFSET : 324
  };
  var state = {
    phase: "hidden",
    x: entrance.x,
    y: entrance.y,
    returnTime: 0,
    phaseStart: 0,
    panFrom: { x: entrance.x, y: entrance.y },
    path: [],
    repathTimer: 0,
    targetCell: -1,
    direction: "down",
    frame: 0,
    animationTime: 0
  };
  function readReturnedFromCave() {
    const params = new URLSearchParams(window.location.search);
    if (params.get("door") !== CAVE_DOOR_ID || params.get("colander") !== "1") return false;
    return hasCaveColander();
  }
  function setupCaveThief() {
    if (!readReturnedFromCave()) return;
    state.phase = "waiting";
    state.returnTime = performance.now();
    state.x = entrance.x;
    state.y = entrance.y;
  }
  function isCaveTheftCutsceneActive() {
    return state.phase === "panToEntrance" || state.phase === "message" || state.phase === "panToPlayer";
  }
  function isCaveThiefPursuitActive() {
    return state.phase !== "hidden";
  }
  function getCaveThiefDialogue() {
    return state.phase === "message" ? MESSAGE : null;
  }
  function getCaveThief() {
    if (state.phase === "hidden" || state.phase === "waiting" || state.phase === "panToEntrance") {
      return null;
    }
    return {
      x: state.x,
      y: state.y,
      size: THIEF_SIZE,
      direction: state.direction,
      frame: state.frame,
      moving: state.phase === "chasing"
    };
  }
  function getCaveTheftCameraCenter(playerX, playerY, time) {
    if (state.phase === "panToEntrance") {
      const progress = easeInOut2(Math.min(1, (time - state.phaseStart) / PAN_DURATION));
      return {
        x: state.panFrom.x + (entrance.x - state.panFrom.x) * progress,
        y: state.panFrom.y + (entrance.y - state.panFrom.y) * progress
      };
    }
    if (state.phase === "message") return entrance;
    if (state.phase === "panToPlayer") {
      const progress = easeInOut2(Math.min(1, (time - state.phaseStart) / PAN_DURATION));
      return {
        x: entrance.x + (playerX - entrance.x) * progress,
        y: entrance.y + (playerY - entrance.y) * progress
      };
    }
    return { x: playerX, y: playerY };
  }
  function isBlocked(x, y) {
    const half = THIEF_SIZE / 2;
    if (x - half < 0 || x + half > WORLD_WIDTH || y - THIEF_SIZE < 0 || y > WORLD_HEIGHT) return true;
    return playerCollidesAt(x - half * 0.6, y) || playerCollidesAt(x + half * 0.6, y) || playerCollidesAt(x, y - THIEF_SIZE * 0.3) || playerCollidesAt(x, y);
  }
  function triggerCatch() {
    if (state.phase !== "chasing") return;
    state.phase = "caught";
    startCatchTransition();
  }
  function updateChase(deltaTime, targetX, targetY, speedMultiplier2) {
    if (Math.hypot(targetX - state.x, targetY - state.y) < CATCH_DISTANCE) {
      triggerCatch();
      return;
    }
    state.repathTimer -= deltaTime;
    const targetCell = thiefPathCell(targetX, targetY);
    if (state.repathTimer <= 0 || targetCell !== state.targetCell || state.path.length === 0) {
      state.repathTimer = PATH_REFRESH_INTERVAL;
      const path = buildThiefPath(state.x, state.y, targetX, targetY, isBlocked);
      state.targetCell = path.targetCell;
      state.path = path.points;
    }
    const waypoint = state.path[0] ?? { x: targetX, y: targetY };
    const dx = waypoint.x - state.x;
    const dy = waypoint.y - state.y;
    const distance = Math.hypot(dx, dy);
    if (distance < 6) {
      state.path.shift();
      return;
    }
    const speed = SPEED * speedMultiplier2;
    if (Math.abs(dx) > Math.abs(dy)) state.direction = dx < 0 ? "left" : "right";
    else state.direction = dy < 0 ? "up" : "down";
    state.animationTime += deltaTime;
    state.frame = Math.floor(state.animationTime * 9);
    moveWithCollisions(
      state,
      dx / distance * speed * deltaTime,
      dy / distance * speed * deltaTime,
      isBlocked
    );
  }
  function updateCaveThief(deltaTime, time, playerX, playerY, speedMultiplier2) {
    if (state.phase === "hidden") return;
    if (state.phase === "waiting") {
      if (time - state.returnTime < SEQUENCE_DELAY) return;
      state.phase = "panToEntrance";
      state.phaseStart = time;
      state.panFrom = { x: playerX, y: playerY };
      return;
    }
    if (state.phase === "panToEntrance" && time - state.phaseStart >= PAN_DURATION) {
      state.phase = "message";
      state.phaseStart = time;
      playMessageVoices();
      return;
    }
    if (state.phase === "message" && time - state.phaseStart >= MESSAGE_DURATION) {
      state.phase = "panToPlayer";
      state.phaseStart = time;
      return;
    }
    if (state.phase === "panToPlayer" && time - state.phaseStart >= PAN_DURATION) {
      state.phase = "chasing";
      state.path = [];
      state.repathTimer = 0;
      state.animationTime = 0;
      state.frame = 0;
      return;
    }
    if (state.phase === "chasing") updateChase(deltaTime, playerX, playerY, speedMultiplier2);
  }

  // js/storage.ts
  function readStorage(key) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }
  function writeStorage(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch {
    }
  }

  // js/tim-location.ts
  var TIM_AT_MUSIC_SHOP_KEY = "max-game:tim-at-music-shop";
  var TIM_AT_CINEMA_KEY = "max-game:tim-at-cinema";
  function isTimAtMusicShop() {
    return readStorage(TIM_AT_MUSIC_SHOP_KEY) === "true";
  }
  function isTimAtCinema() {
    return readStorage(TIM_AT_CINEMA_KEY) === "true";
  }
  function moveTimToMusicShop() {
    writeStorage(TIM_AT_MUSIC_SHOP_KEY, "true");
    writeStorage(TIM_AT_CINEMA_KEY, "false");
  }
  function moveTimToCinema() {
    writeStorage(TIM_AT_MUSIC_SHOP_KEY, "false");
    writeStorage(TIM_AT_CINEMA_KEY, "true");
  }
  function resetTimRoute() {
    writeStorage(TIM_AT_MUSIC_SHOP_KEY, "false");
    writeStorage(TIM_AT_CINEMA_KEY, "false");
  }

  // js/gym-tim-cutscene.ts
  var GYM_DOOR = DOORWAYS.find((doorway) => doorway.id === "gym");
  var MUSIC_SHOP_DOOR = DOORWAYS.find((doorway) => doorway.id === "music-shop");
  var GYM_TIM_LINE = "Mate, I'm off to St John for a whisky mac then fabric. See you there?";
  var MUSIC_SHOP_TIM_LINE = "man can't believe it's light out. must have been in there all night. Anyway, I'm off to watch Fast Furious";
  var TIM_WIDTH = 28;
  var TIM_HEIGHT = 52;
  var WAIT_BEFORE_STOP = 2;
  var FOLLOW_SPEED = 96;
  var LEAVE_SPEED = 120;
  var TALK_DURATION = 3.8;
  var MUSIC_SHOP_TARGET = { x: 255, y: 444 };
  var CINEMA_TARGET = { x: 490, y: 818 };
  function getTimCutsceneConfig() {
    const returnDoor2 = new URLSearchParams(window.location.search).get("door");
    if (returnDoor2 === "gym" && !isTimAtMusicShop() && !isTimAtCinema()) {
      return { door: GYM_DOOR, line: GYM_TIM_LINE, target: MUSIC_SHOP_TARGET, complete: moveTimToMusicShop, requiresAdvance: false };
    }
    if (returnDoor2 === "music-shop" && isTimAtMusicShop()) {
      return { door: MUSIC_SHOP_DOOR, line: MUSIC_SHOP_TIM_LINE, target: CINEMA_TARGET, complete: moveTimToCinema, requiresAdvance: true };
    }
    return null;
  }
  var cutsceneConfig = getTimCutsceneConfig();
  var nextButton = requireElement("#tim-cutscene-next");
  var state2 = {
    phase: cutsceneConfig ? "waiting" : "inactive",
    timer: 0,
    x: (cutsceneConfig?.door ?? GYM_DOOR).x + (cutsceneConfig?.door ?? GYM_DOOR).width / 2,
    y: (cutsceneConfig?.door ?? GYM_DOOR).y + (cutsceneConfig?.door ?? GYM_DOOR).height + 12,
    lineVisible: false
  };
  function moveToward(targetX, targetY, speed, deltaTime) {
    const dx = targetX - state2.x;
    const dy = targetY - state2.y;
    const distance = Math.hypot(dx, dy);
    if (distance <= 2) {
      state2.x = targetX;
      state2.y = targetY;
      return true;
    }
    const step = Math.min(distance, speed * deltaTime);
    state2.x += dx / distance * step;
    state2.y += dy / distance * step;
    return false;
  }
  function startFollowing() {
    if (!cutsceneConfig) return;
    releaseAllInput();
    state2.phase = "following";
    state2.timer = 0;
    state2.x = cutsceneConfig.door.x + cutsceneConfig.door.width / 2;
    state2.y = cutsceneConfig.door.y + cutsceneConfig.door.height + 12;
  }
  function syncNextButton() {
    nextButton.hidden = !(cutsceneConfig?.requiresAdvance && state2.phase === "talking");
  }
  function advanceGymTimCutscene() {
    if (state2.phase !== "talking" || !cutsceneConfig?.requiresAdvance) return;
    state2.phase = "leaving";
    state2.timer = 0;
    state2.lineVisible = false;
    syncNextButton();
  }
  function setupGymTimCutscene() {
    nextButton.addEventListener("click", advanceGymTimCutscene);
    nextButton.hidden = true;
  }
  function isGymTimCutsceneBlockingPlayer() {
    return state2.phase === "following" || state2.phase === "talking";
  }
  function updateGymTimCutscene(deltaTime, player3) {
    if (state2.phase === "inactive" || state2.phase === "done") return;
    state2.timer += deltaTime;
    if (state2.phase === "waiting") {
      if (state2.timer >= WAIT_BEFORE_STOP) startFollowing();
      return;
    }
    if (state2.phase === "following") {
      const targetX = player3.x + 32;
      const targetY = player3.y + 4;
      if (moveToward(targetX, targetY, FOLLOW_SPEED, deltaTime)) {
        state2.phase = "talking";
        state2.timer = 0;
        state2.lineVisible = true;
        syncNextButton();
      }
      return;
    }
    if (state2.phase === "talking") {
      if (cutsceneConfig?.requiresAdvance) return;
      if (state2.timer >= TALK_DURATION) {
        state2.phase = "leaving";
        state2.timer = 0;
        state2.lineVisible = false;
        syncNextButton();
      }
      return;
    }
    if (state2.phase === "leaving" && cutsceneConfig && moveToward(cutsceneConfig.target.x, cutsceneConfig.target.y, LEAVE_SPEED, deltaTime)) {
      state2.phase = "done";
      cutsceneConfig.complete();
    }
  }
  function drawGymTimCutscene(context2, image, cameraX, cameraY) {
    if (state2.phase === "inactive" || state2.phase === "done") return;
    context2.save();
    context2.imageSmoothingEnabled = false;
    context2.drawImage(
      image,
      Math.round(state2.x - cameraX - TIM_WIDTH / 2),
      Math.round(state2.y - cameraY - TIM_HEIGHT),
      TIM_WIDTH,
      TIM_HEIGHT
    );
    context2.restore();
  }
  function getGymTimCutsceneDialogue() {
    if (!state2.lineVisible) return null;
    return { text: cutsceneConfig?.line ?? "", x: state2.x, y: state2.y - TIM_HEIGHT };
  }

  // js/site-assets.ts
  function resolveSiteAsset(path) {
    const bundleScript = document.querySelector('script[src*="dist/"]');
    const siteRoot = bundleScript?.src ? new URL("../", bundleScript.src) : new URL("./", document.baseURI);
    return new URL(path, siteRoot).href;
  }

  // js/inventory-gifts.ts
  var GIFT_LINES = [
    "Here. You\u2019ll need this.",
    "This is for you.",
    "You\u2019ll make better use of this.",
    "Found this. Figured you could use it.",
    "Hold onto this for me.",
    "Here, catch.",
    "This might come in handy.",
    "Here. Don\u2019t lose it.",
    "Take this and get out of here."
  ];
  var JULIAN_ITEM = {
    id: "julian-item",
    name: "Julian's item",
    imageSource: "chat/julian/item.png",
    description: "The world opens up."
  };
  var TIM_ITEM = {
    id: "tim-item",
    name: "Tim's item",
    imageSource: "chat/tim/item.png",
    description: "Face implodes."
  };
  var LUCY_ITEM = {
    id: "lucy-item",
    name: "Lucy's item",
    imageSource: "chat/lucy/item.png",
    description: "World spins around and around."
  };
  var PORTABLE_WALKMAN = {
    id: "portable-walkman",
    name: "Portable walkman",
    imageSource: "img/portable-walkman.png",
    description: "You can now play music.",
    hiddenFromInventory: true
  };
  var GEORGIA_ITEM = {
    id: "georgia-item",
    name: "Georgia's item",
    imageSource: "chat/georgia/item.png",
    description: "Creates the apocalypse."
  };
  var ANDY_ITEM = {
    id: "andy-item",
    name: "Andy's item",
    imageSource: "chat/andy/item.png",
    description: "Creates the apocalypse."
  };
  var REI_ITEM = {
    id: "rei-item",
    name: "Rei's item",
    imageSource: "chat/rei/player/item.png",
    description: "Makes the protagonist move 20% faster."
  };
  var INVENTORY_GIFTS_KEY = "max-game:inventory-gifts";
  var GIFT_LINE_INDEX_KEY = "max-game:gift-line-index";
  var ITEM_RECEIVED_OVERLAY_DURATION = 3200;
  function showItemReceivedOverlay(item) {
    const gameShell5 = document.querySelector(".game-shell");
    if (!gameShell5) return;
    const overlay = document.createElement("div");
    overlay.className = "quest-accepted-overlay item-received-overlay";
    overlay.setAttribute("aria-label", `${item.name} added to inventory`);
    const image = document.createElement("img");
    image.src = resolveSiteAsset(item.imageSource);
    image.alt = item.name;
    overlay.append(image);
    gameShell5.append(overlay);
    window.setTimeout(() => overlay.remove(), ITEM_RECEIVED_OVERLAY_DURATION);
  }
  var GIFT_ITEMS = [
    {
      id: "mike-item",
      name: "Mike's item",
      imageSource: "chat/mike/item.png",
      description: "Makes the protagonist 36% happier."
    },
    {
      id: "alex-s-item",
      name: "Alex S's item",
      imageSource: "chat/alex s/item.png",
      description: "Creates the apocalypse."
    },
    {
      id: "katy-item",
      name: "Katy's item",
      imageSource: "chat/katy/item.png",
      description: "Character trips over occasionally"
    },
    LUCY_ITEM,
    JULIAN_ITEM,
    TIM_ITEM,
    PORTABLE_WALKMAN,
    GEORGIA_ITEM,
    ANDY_ITEM,
    REI_ITEM
  ];
  function readGiftIds() {
    try {
      const value = JSON.parse(window.localStorage.getItem(INVENTORY_GIFTS_KEY) ?? "[]");
      return Array.isArray(value) ? value.filter((id) => typeof id === "string") : [];
    } catch {
      return [];
    }
  }
  function writeGiftIds(ids) {
    try {
      window.localStorage.setItem(INVENTORY_GIFTS_KEY, JSON.stringify(ids));
    } catch {
    }
  }
  function hasGift(item) {
    return readGiftIds().includes(item.id);
  }
  function addGift(item) {
    const ids = readGiftIds();
    if (ids.includes(item.id)) return false;
    writeGiftIds([...ids, item.id]);
    showItemReceivedOverlay(item);
    window.dispatchEvent(new CustomEvent("max-game:inventory-gift-added", { detail: item }));
    return true;
  }
  function removeGift(item) {
    writeGiftIds(readGiftIds().filter((id) => id !== item.id));
    window.dispatchEvent(new Event("max-game:inventory-gift-removed"));
  }
  function nextGiftLine() {
    let index = 0;
    try {
      const stored = Number.parseInt(window.localStorage.getItem(GIFT_LINE_INDEX_KEY) ?? "0", 10);
      index = Number.isFinite(stored) && stored >= 0 ? stored % GIFT_LINES.length : 0;
      window.localStorage.setItem(GIFT_LINE_INDEX_KEY, String((index + 1) % GIFT_LINES.length));
    } catch {
    }
    return GIFT_LINES[index] ?? GIFT_LINES[0];
  }
  function getCollectedGifts() {
    const ids = readGiftIds();
    return GIFT_ITEMS.filter((item) => ids.includes(item.id) && !item.hiddenFromInventory);
  }

  // js/katy-power.ts
  var KATY_POWER_DURATION = 1e4;
  var FIRST_TRIP_DELAY = 700;
  var TRIP_DURATION = 650;
  var TRIP_INTERVAL = 1800;
  var powerEndsAt = 0;
  var tripEndsAt = 0;
  var nextTripAt = 0;
  function movementIsHeld() {
    return isHeld("left") || isHeld("right") || isHeld("up") || isHeld("down");
  }
  function activateKatyPower(now = performance.now()) {
    powerEndsAt = now + KATY_POWER_DURATION;
    tripEndsAt = 0;
    nextTripAt = now + FIRST_TRIP_DELAY;
  }
  function updateKatyPower(now, moving = movementIsHeld()) {
    if (powerEndsAt === 0) return false;
    if (now >= powerEndsAt) {
      powerEndsAt = 0;
      tripEndsAt = 0;
      nextTripAt = 0;
      return true;
    }
    if (moving && now >= nextTripAt && now >= tripEndsAt) {
      tripEndsAt = Math.min(now + TRIP_DURATION, powerEndsAt);
      nextTripAt = now + TRIP_INTERVAL;
    }
    return false;
  }
  function katyPowerSecondsLeft(now) {
    return powerEndsAt === 0 ? 0 : Math.max(0, (powerEndsAt - now) / 1e3);
  }
  function isPlayerTripping(now = performance.now()) {
    return powerEndsAt > now && tripEndsAt > now;
  }

  // js/inventory.ts
  var gameShell2 = requireElement(".game-shell");
  var METEOR_COUNT = 14;
  var ITEM_THEME_DURATION = 1e4;
  var KATY_THEME_SOURCE = "chat/katy/theme.m4a";
  var MIKE_THEME_SOURCE = "chat/mike/player/theme.mp3";
  var LUCY_THEME_SOURCE = "chat/lucy/player/theme.mp3";
  var JULIAN_THEME_SOURCE = "chat/julian/theme.mp3";
  var TIM_THEME_SOURCE = "chat/tim/theme.mp3";
  var inventoryToggle2 = requireElement("#inventory-toggle");
  var inventoryPanel = requireElement("#inventory-panel");
  var inventoryClose = requireElement("#inventory-close");
  var inventoryItem = requireElement("#inventory-item");
  var deleteItemButton = requireElement("#delete-item");
  var itemActions = requireElement("#item-actions");
  var useItemButton = requireElement("#use-item");
  var inventoryMessage = requireElement("#inventory-message");
  var inventoryCount = requireElement(".inventory-count");
  var powerupStatus = requireElement("#powerup-status");
  var itemStatus = requireElement("#item-status");
  var readyBadge = requireElement("#ready-badge");
  var rechargeFill = requireElement("#recharge-fill");
  var announcer2 = requireElement("#announcer");
  var giftItems = requireElement("#gift-items");
  function announce(message) {
    inventoryMessage.textContent = message;
    announcer2.textContent = message;
  }
  function playApocalypseRumble() {
    const AudioContextClass = window.AudioContext;
    const audioContext = new AudioContextClass();
    const rumble = audioContext.createOscillator();
    const rumbleGain = audioContext.createGain();
    const noise = audioContext.createBufferSource();
    const noiseFilter = audioContext.createBiquadFilter();
    const noiseGain = audioContext.createGain();
    const duration = 2.4;
    const noiseBuffer = audioContext.createBuffer(1, Math.ceil(audioContext.sampleRate * duration), audioContext.sampleRate);
    const noiseSamples = noiseBuffer.getChannelData(0);
    for (let index = 0; index < noiseSamples.length; index += 1) {
      const fade = 1 - index / noiseSamples.length;
      noiseSamples[index] = (Math.random() * 2 - 1) * fade;
    }
    rumble.type = "sawtooth";
    rumble.frequency.setValueAtTime(55, audioContext.currentTime);
    rumble.frequency.exponentialRampToValueAtTime(28, audioContext.currentTime + duration);
    rumbleGain.gain.setValueAtTime(0.18, audioContext.currentTime);
    rumbleGain.gain.exponentialRampToValueAtTime(1e-3, audioContext.currentTime + duration);
    noise.buffer = noiseBuffer;
    noiseFilter.type = "lowpass";
    noiseFilter.frequency.value = 320;
    noiseGain.gain.setValueAtTime(0.16, audioContext.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(1e-3, audioContext.currentTime + duration);
    rumble.connect(rumbleGain);
    rumbleGain.connect(audioContext.destination);
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(audioContext.destination);
    rumble.start();
    noise.start();
    rumble.stop(audioContext.currentTime + duration);
    noise.stop(audioContext.currentTime + duration);
    rumble.addEventListener("ended", () => void audioContext.close(), { once: true });
  }
  function triggerApocalypse(onExpired) {
    const overlay = document.createElement("div");
    overlay.className = "apocalypse-overlay";
    overlay.setAttribute("aria-hidden", "true");
    for (let index = 0; index < METEOR_COUNT; index += 1) {
      const meteor = document.createElement("span");
      meteor.className = "apocalypse-meteor";
      meteor.style.setProperty("--meteor-x", `${Math.round(Math.random() * 100)}%`);
      meteor.style.setProperty("--meteor-delay", `${(Math.random() * 1.6).toFixed(2)}s`);
      overlay.append(meteor);
    }
    gameShell2.append(overlay);
    gameShell2.classList.add("apocalypse-shake");
    window.setTimeout(() => {
      overlay.remove();
      gameShell2.classList.remove("apocalypse-shake");
      onExpired?.();
    }, APOCALYPSE_DURATION);
    playApocalypseRumble();
  }
  function triggerGiftPower(className, duration) {
    gameShell2.classList.remove(className);
    void gameShell2.offsetWidth;
    gameShell2.classList.add(className);
    window.setTimeout(() => gameShell2.classList.remove(className), duration);
  }
  function playItemTheme(source) {
    itemTheme?.pause();
    itemTheme = new Audio(resolveSiteAsset(source));
    itemTheme.preload = "auto";
    void itemTheme.play().catch(() => {
    });
    window.setTimeout(() => {
      itemTheme?.pause();
      if (itemTheme) itemTheme.currentTime = 0;
      itemTheme = null;
    }, ITEM_THEME_DURATION);
  }
  function stopKatyTheme() {
    if (katyThemeTimeout) window.clearTimeout(katyThemeTimeout);
    katyThemeTimeout = 0;
    katyTheme?.pause();
    if (katyTheme) katyTheme.currentTime = 0;
    katyTheme = null;
  }
  function playKatyTheme() {
    stopKatyTheme();
    katyTheme = new Audio(resolveSiteAsset(KATY_THEME_SOURCE));
    katyTheme.preload = "auto";
    katyTheme.loop = true;
    void katyTheme.play().catch(() => {
    });
    katyThemeTimeout = window.setTimeout(stopKatyTheme, KATY_POWER_DURATION);
  }
  var speedMultiplier = 1;
  var speedBoostEndsAt = 0;
  var hasPowerSandwich = true;
  var sandwichDeleted = readStorage("max-game:power-sandwich-deleted") === "true";
  var itemRechargesAt = 0;
  var itemTheme = null;
  var katyTheme = null;
  var katyThemeTimeout = 0;
  var katyItemDescription = "";
  var getSpeedMultiplier = () => speedMultiplier;
  function setItemReady(isReady) {
    hasPowerSandwich = isReady;
    inventoryCount.textContent = String((isReady ? 1 : 0) + getCollectedGifts().length);
    inventoryItem.disabled = !isReady;
    inventoryItem.classList.toggle("item-ready", isReady);
    readyBadge.hidden = !isReady;
    rechargeFill.style.width = isReady ? "100%" : "0%";
    itemStatus.textContent = sandwichDeleted ? "Deleted" : isReady ? "Ready to use" : "Recharging";
    deleteItemButton.disabled = sandwichDeleted;
  }
  function renderGiftItems() {
    giftItems.replaceChildren();
    getCollectedGifts().forEach((item) => {
      const card = document.createElement("div");
      card.className = "inventory-gift";
      const image = document.createElement("img");
      image.src = resolveSiteAsset(item.imageSource);
      image.alt = item.name;
      const text = document.createElement("span");
      text.className = "item-text";
      const name = document.createElement("strong");
      name.textContent = item.name;
      text.append(name);
      const actions = document.createElement("span");
      actions.className = "inventory-gift-actions";
      const useButton = document.createElement("button");
      useButton.type = "button";
      useButton.textContent = "Use";
      useButton.addEventListener("click", () => {
        if (item.id === "alex-s-item") {
          playItemTheme("chat/alex s/theme.mp3");
          triggerApocalypse(() => announce(`${item.name}: ${item.description}`));
        } else if (item.id === "julian-item") {
          playItemTheme(JULIAN_THEME_SOURCE);
          triggerGiftPower("world-opening", 2400);
          announce(`${item.name}: ${item.description}`);
        } else if (item.id === "tim-item") {
          playItemTheme(TIM_THEME_SOURCE);
          triggerGiftPower("face-implosion", 1100);
          announce(`${item.name}: ${item.description}`);
        } else if (item.id === "katy-item") {
          const now = performance.now();
          activateKatyPower(now);
          playKatyTheme();
          katyItemDescription = `${item.name}: ${item.description}`;
          powerupStatus.textContent = "Katy effect 10.0s";
          powerupStatus.hidden = false;
          announce("Katy's item activated.");
        } else if (item.id === "mike-item") {
          playItemTheme(MIKE_THEME_SOURCE);
          announce(`${item.name}: ${item.description}`);
        } else if (item.id === "lucy-item") {
          playItemTheme(LUCY_THEME_SOURCE);
          triggerGiftPower("world-spinning", 1e4);
          announce(`${item.name}: ${item.description}`);
        } else {
          announce(`${item.name}: ${item.description}`);
        }
        removeGift(item);
      });
      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.textContent = "Delete";
      deleteButton.addEventListener("click", () => {
        removeGift(item);
        announce(`${item.name} deleted.`);
      });
      actions.append(useButton, deleteButton);
      card.append(image, text, actions);
      giftItems.append(card);
    });
  }
  function setItemActionsOpen(isOpen) {
    itemActions.hidden = !isOpen;
    inventoryItem.classList.toggle("selected", isOpen);
    inventoryItem.setAttribute("aria-expanded", String(isOpen));
  }
  function setInventoryOpen(isOpen) {
    const hadFocusInside = inventoryPanel.contains(document.activeElement);
    inventoryPanel.hidden = !isOpen;
    inventoryToggle2.setAttribute("aria-expanded", String(isOpen));
    if (!isOpen && hadFocusInside) inventoryToggle2.focus();
  }
  function setupInventory() {
    renderGiftItems();
    setItemReady(!sandwichDeleted);
    setItemActionsOpen(false);
    window.addEventListener("max-game:inventory-gift-added", () => {
      renderGiftItems();
      setItemReady(hasPowerSandwich);
      inventoryToggle2.classList.remove("inventory-added-wobble");
      void inventoryToggle2.offsetWidth;
      inventoryToggle2.classList.add("inventory-added-wobble");
      window.setTimeout(() => inventoryToggle2.classList.remove("inventory-added-wobble"), 1e3);
    });
    window.addEventListener("max-game:inventory-gift-removed", () => {
      renderGiftItems();
      setItemReady(hasPowerSandwich);
    });
    inventoryToggle2.addEventListener("click", () => setInventoryOpen(inventoryPanel.hidden));
    inventoryClose.addEventListener("click", () => setInventoryOpen(false));
    inventoryItem.addEventListener("click", () => {
      if (!hasPowerSandwich) return;
      setItemActionsOpen(itemActions.hidden);
    });
    deleteItemButton.addEventListener("click", () => {
      if (sandwichDeleted) return;
      sandwichDeleted = true;
      writeStorage("max-game:power-sandwich-deleted", "true");
      itemRechargesAt = 0;
      setItemReady(false);
      setItemActionsOpen(false);
      announce("Power Sandwich deleted.");
    });
    useItemButton.addEventListener("click", () => {
      if (!hasPowerSandwich) return;
      const now = performance.now();
      speedMultiplier = BOOST_MULTIPLIER;
      speedBoostEndsAt = now + BOOST_DURATION;
      itemRechargesAt = now + RECHARGE_DURATION;
      setItemReady(false);
      setItemActionsOpen(false);
      inventoryClose.focus();
      announce("Power Sandwich used - speed increased for 10 seconds!");
      powerupStatus.hidden = false;
    });
    window.addEventListener("keydown", (event) => {
      if (event.ctrlKey || event.metaKey || event.altKey || event.repeat) return;
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      if (key === "i") setInventoryOpen(inventoryPanel.hidden);
      else if (key === "Escape") setInventoryOpen(false);
    });
  }
  function updatePowerups(now) {
    if (speedBoostEndsAt > 0) {
      const secondsLeft = Math.max(0, (speedBoostEndsAt - now) / 1e3);
      const status = `Speed boost ${secondsLeft.toFixed(1)}s`;
      if (powerupStatus.textContent !== status) powerupStatus.textContent = status;
      if (secondsLeft === 0) {
        speedMultiplier = 1;
        speedBoostEndsAt = 0;
        powerupStatus.hidden = true;
        announce("The speed boost has worn off.");
      }
    }
    if (!hasPowerSandwich && itemRechargesAt > 0) {
      const rechargeRemaining = Math.max(0, itemRechargesAt - now);
      const status = `Recharging ${(rechargeRemaining / 1e3).toFixed(1)}s`;
      if (itemStatus.textContent !== status) {
        itemStatus.textContent = status;
        rechargeFill.style.width = `${(1 - rechargeRemaining / RECHARGE_DURATION) * 100}%`;
      }
      if (rechargeRemaining === 0) {
        itemRechargesAt = 0;
        setItemReady(true);
        announce("The Power Sandwich is ready to use again!");
      }
    }
    const katyEffectExpired = updateKatyPower(now);
    const katySecondsLeft = katyPowerSecondsLeft(now);
    if (katySecondsLeft > 0) {
      const status = `Katy effect ${katySecondsLeft.toFixed(1)}s`;
      if (powerupStatus.textContent !== status) powerupStatus.textContent = status;
      powerupStatus.hidden = false;
    } else if (katyEffectExpired) {
      stopKatyTheme();
      if (speedBoostEndsAt === 0) powerupStatus.hidden = true;
      if (katyItemDescription) announce(katyItemDescription);
      katyItemDescription = "";
    }
  }

  // js/hole.ts
  var HOLE = { x: 106, y: 239, width: 25, height: 32 };
  var FALL_IN_DURATION = 0.72;
  var SKY_FALL_DURATION = 0.9;
  var SKY_START_OFFSET = -240;
  var LANDING_ATTEMPTS = 350;
  var LANDING_CLEARANCE = 13;
  var DOOR_CLEARANCE = 58;
  var phase = "idle";
  var phaseTime = 0;
  var clampProgress = (value) => Math.max(0, Math.min(1, value));
  function playerTouchesHole(player3) {
    const footHalfWidth = 7;
    const footHeight = 7;
    return player3.x - footHalfWidth < HOLE.x + HOLE.width && player3.x + footHalfWidth > HOLE.x && player3.y - footHeight < HOLE.y + HOLE.height && player3.y > HOLE.y;
  }
  function pointNearHole(x, y, margin) {
    return x >= HOLE.x - margin && x <= HOLE.x + HOLE.width + margin && y >= HOLE.y - margin && y <= HOLE.y + HOLE.height + margin;
  }
  function distanceToDoor(x, y) {
    return Math.min(...DOORWAYS.map((doorway) => {
      const dx = Math.max(doorway.x - x, 0, x - (doorway.x + doorway.width));
      const dy = Math.max(doorway.y - y, 0, y - (doorway.y + doorway.height));
      return Math.hypot(dx, dy);
    }));
  }
  function hasLandingClearance(x, y) {
    const offsets = [
      [0, 0],
      [-LANDING_CLEARANCE, 0],
      [LANDING_CLEARANCE, 0],
      [0, -LANDING_CLEARANCE],
      [0, LANDING_CLEARANCE]
    ];
    return offsets.every(([offsetX, offsetY]) => !playerCollidesAt(x + offsetX, y + offsetY));
  }
  function isSafeLandingPoint(x, y) {
    return !pointNearHole(x, y, 70) && distanceToDoor(x, y) > DOOR_CLEARANCE && hasLandingClearance(x, y);
  }
  function randomLandingPoint() {
    const minimumX = HALF_WIDTH + 30;
    const maximumX = WORLD_WIDTH - HALF_WIDTH - 30;
    const minimumY = SPRITE_HEIGHT + 30;
    const maximumY = WORLD_HEIGHT - 30;
    for (let attempt = 0; attempt < LANDING_ATTEMPTS; attempt += 1) {
      const x = minimumX + Math.random() * (maximumX - minimumX);
      const y = minimumY + Math.random() * (maximumY - minimumY);
      if (isSafeLandingPoint(x, y)) return { x, y };
    }
    return { x: 654, y: 662 };
  }
  function beginSkyFall(player3) {
    const landingPoint = randomLandingPoint();
    player3.x = landingPoint.x;
    player3.y = landingPoint.y;
    player3.direction = "down";
    player3.frame = 0;
    player3.animationTime = 0;
    phase = "falling-from-sky";
    phaseTime = 0;
  }
  function isHoleAnimationActive() {
    return phase !== "idle";
  }
  function updateHole(deltaTime, player3) {
    if (phase === "idle") {
      if (playerTouchesHole(player3)) {
        phase = "falling-in";
        phaseTime = 0;
        player3.frame = 0;
        player3.animationTime = 0;
      }
      return;
    }
    phaseTime += deltaTime;
    if (phase === "falling-in" && phaseTime >= FALL_IN_DURATION) {
      beginSkyFall(player3);
      return;
    }
    if (phase === "falling-from-sky" && phaseTime >= SKY_FALL_DURATION) {
      phase = "idle";
      phaseTime = 0;
    }
  }
  function getHolePlayerTransform() {
    if (phase === "falling-in") {
      const progress = clampProgress(phaseTime / FALL_IN_DURATION);
      return {
        scale: Math.max(0.04, 1 - progress),
        rotation: progress * Math.PI * 4.5,
        offsetY: progress * 12,
        opacity: Math.max(0, 1 - progress)
      };
    }
    if (phase === "falling-from-sky") {
      const progress = clampProgress(phaseTime / SKY_FALL_DURATION);
      return {
        scale: 0.78 + progress * 0.22,
        rotation: 0,
        offsetY: SKY_START_OFFSET * (1 - progress * progress),
        opacity: Math.min(1, progress * 5)
      };
    }
    return null;
  }

  // js/jump.ts
  var JUMP_DESTINATIONS = [
    { id: "northwest-portal", label: "Cave" },
    { id: "garden-room", label: "Plant Room" },
    { id: "diary-lab-center", label: "Diary Lab - Center Door" },
    { id: "diary-lab-right", label: "Diary Lab - Right Door" },
    { id: "music-shop", label: "Music House" },
    { id: "gym", label: "Gym" },
    { id: "cinema", label: "Cinema" },
    { id: "bookshop", label: "Bookshop" }
  ];
  var jumpToggle2 = document.querySelector("#jump-toggle");
  var jumpPanel = document.querySelector("#jump-panel");
  var jumpClose = document.querySelector("#jump-close");
  var jumpOptions = document.querySelector("#jump-options");
  var jumpMenuOpen = false;
  var navigationStarted2 = false;
  var isJumpMenuOpen = () => jumpMenuOpen;
  function setJumpMenuOpen(open) {
    if (!jumpToggle2 || !jumpPanel) return;
    jumpMenuOpen = open;
    jumpPanel.hidden = !open;
    jumpToggle2.setAttribute("aria-expanded", String(open));
    if (open) {
      releaseAllInput();
      jumpPanel.querySelector(".jump-option")?.focus();
    } else {
      jumpToggle2.focus();
    }
  }
  function internalPageHref() {
    return window.location.pathname.includes("/internal/") ? "index.html" : "internal/index.html";
  }
  function jumpTo(destinationId) {
    if (navigationStarted2) return;
    navigationStarted2 = true;
    releaseAllInput();
    const params = new URLSearchParams({ door: destinationId });
    if (hasCaveColander()) params.set("colander", "1");
    if (new URLSearchParams(window.location.search).has("seal")) params.set("seal", "1");
    window.location.assign(`${internalPageHref()}?${params.toString()}`);
  }
  function buildOptions() {
    if (!jumpOptions) return;
    JUMP_DESTINATIONS.forEach((destination) => {
      const button = document.createElement("button");
      button.className = "jump-option";
      button.type = "button";
      button.textContent = destination.label;
      button.addEventListener("click", () => jumpTo(destination.id));
      jumpOptions.append(button);
    });
  }
  function setupJump() {
    if (!jumpToggle2 || !jumpPanel || !jumpClose || !jumpOptions) return;
    buildOptions();
    jumpToggle2.addEventListener("click", () => setJumpMenuOpen(!jumpMenuOpen));
    jumpClose.addEventListener("click", () => setJumpMenuOpen(false));
    window.addEventListener("keydown", (event) => {
      if (event.code === "Escape" && jumpMenuOpen) {
        event.preventDefault();
        setJumpMenuOpen(false);
      }
    });
    document.addEventListener("click", (event) => {
      if (!jumpMenuOpen) return;
      if (event.target instanceof Node && !jumpPanel.contains(event.target) && !jumpToggle2.contains(event.target)) {
        setJumpMenuOpen(false);
      }
    });
    jumpToggle2.classList.toggle("opening-intro-hidden", isBusIntroActive());
  }

  // js/music-player.ts
  var musicToggle2 = requireElement("#music-toggle");
  var musicPanel = requireElement("#music-panel");
  var musicClose = requireElement("#music-close");
  var musicControlsGroup = requireElement("#music-controls-group");
  var musicSelect = requireElement("#music-select");
  var playPauseButton = requireElement("#music-play-pause");
  var volumeSlider = requireElement("#music-volume");
  var musicStatus = requireElement("#music-status");
  var player = new Audio();
  player.loop = true;
  player.volume = Number(volumeSlider.value);
  var selectedSong = null;
  function setPlayerButton() {
    playPauseButton.textContent = player.paused ? "Play" : "Pause";
    playPauseButton.setAttribute("aria-label", player.paused ? "Play selected song" : "Pause selected song");
  }
  function setPanelOpen(isOpen) {
    musicPanel.hidden = !isOpen;
    musicToggle2.setAttribute("aria-expanded", String(isOpen));
    if (!isOpen && musicPanel.contains(document.activeElement)) musicToggle2.focus();
  }
  function hasWalkman() {
    return hasGift(PORTABLE_WALKMAN);
  }
  function updateWalkmanAvailability() {
    const unlocked = hasWalkman();
    musicControlsGroup.hidden = !unlocked;
    musicSelect.disabled = !unlocked;
    volumeSlider.disabled = !unlocked;
    playPauseButton.disabled = !unlocked || !selectedSong;
    if (!unlocked) {
      player.pause();
      musicStatus.textContent = "You don't have a way to play music";
      setPlayerButton();
    } else if (!selectedSong) {
      musicStatus.textContent = "Choose a song to start playing.";
    }
  }
  function playSelectedSong() {
    if (!selectedSong || !hasWalkman()) return;
    void player.play().then(() => {
      musicStatus.textContent = `Playing ${selectedSong}.`;
      setPlayerButton();
    }).catch(() => {
      musicStatus.textContent = "Playback was blocked. Press Play to try again.";
      setPlayerButton();
    });
  }
  function setupMusicPlayer() {
    musicSelect.addEventListener("change", () => {
      if (!hasWalkman()) return;
      const song = musicSelect.value;
      if (!song) return;
      selectedSong = song;
      player.src = `audio/music/${encodeURIComponent(song)}.mp3`;
      player.currentTime = 0;
      playPauseButton.disabled = false;
      playSelectedSong();
    });
    playPauseButton.addEventListener("click", () => {
      if (!selectedSong || !hasWalkman()) return;
      if (player.paused) playSelectedSong();
      else {
        player.pause();
        musicStatus.textContent = `Paused ${selectedSong}.`;
        setPlayerButton();
      }
    });
    volumeSlider.addEventListener("input", () => {
      player.volume = Number(volumeSlider.value);
    });
    player.addEventListener("play", setPlayerButton);
    player.addEventListener("pause", setPlayerButton);
    player.addEventListener("error", () => {
      musicStatus.textContent = "That song could not be loaded.";
      setPlayerButton();
    });
    musicToggle2.addEventListener("click", () => {
      setPanelOpen(musicPanel.hidden);
      updateWalkmanAvailability();
    });
    musicClose.addEventListener("click", () => setPanelOpen(false));
    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape") setPanelOpen(false);
    });
    window.addEventListener("max-game:inventory-gift-added", updateWalkmanAvailability);
    window.addEventListener("max-game:inventory-gift-removed", updateWalkmanAvailability);
    updateWalkmanAvailability();
    document.querySelector("#walkman-debug-toggle")?.addEventListener("click", () => {
      if (hasWalkman()) removeGift(PORTABLE_WALKMAN);
      else addGift(PORTABLE_WALKMAN);
    });
  }

  // js/map-characters.ts
  var MAP_CHARACTER_DEFINITIONS = [
    { name: "Alice", source: "chat/alice/map-sprite.png", x: 220, y: 530, height: 52 },
    { name: "Bochra", source: "chat/bochra/map-sprite.png", x: 1114, y: 172, height: 52 },
    { name: "Chris", source: "chat/chris/map-sprite.png", x: 475, y: 270, height: 52 },
    { name: "Dan", source: "chat/dan/map-sprite.png", x: 1150, y: 372, height: 48 },
    { name: "Joe", source: "chat/joe/map-sprite.png", x: 1080, y: 1070, height: 52 },
    { name: "Ju", source: "chat/ju/map-sprite.png", x: 1e3, y: 180, height: 52 },
    { name: "Katie", source: "chat/katie/map-sprite.png", x: 1130, y: 1018, height: 52 },
    { name: "Maddy", source: "chat/maddy/map-sprite.png", x: 383, y: 1045, height: 59 },
    { name: "Marina", source: "chat/marina d/map-sprite.png", x: 201, y: 1034, height: 52 },
    { name: "Mason", source: "chat/mason/map-sprite.png", x: 820, y: 570, height: 69 },
    { name: "Meli", source: "chat/meli/map-sprite.png", x: 858, y: 570, height: 69 },
    { name: "Oscar", source: "chat/oscar/map-sprite.png", x: 336, y: 864, height: 52 },
    { name: "Sam", source: "chat/sam/map-sprite.png", x: 324, y: 974, height: 52 }
  ];
  var mapCharacters = MAP_CHARACTER_DEFINITIONS.map((character) => ({
    ...character,
    image: new Image()
  }));
  function loadImage2(character) {
    return new Promise((resolve, reject) => {
      character.image.onload = async () => {
        await character.image.decode?.().catch(() => {
        });
        resolve();
      };
      character.image.onerror = () => reject(new Error(`Failed to load ${character.source}`));
      character.image.src = character.source;
    });
  }
  function loadMapCharacters() {
    return Promise.all(mapCharacters.map(loadImage2)).then(() => void 0);
  }
  function drawMapCharacters(context2, cameraX, cameraY, shouldDraw = () => true) {
    context2.save();
    context2.imageSmoothingEnabled = false;
    for (const character of mapCharacters) {
      if (!shouldDraw(character)) continue;
      const width = Math.round(character.height * (character.image.naturalWidth / character.image.naturalHeight));
      context2.drawImage(
        character.image,
        Math.round(character.x - cameraX - width / 2),
        Math.round(character.y - cameraY - character.height),
        width,
        character.height
      );
    }
    context2.restore();
  }

  // js/world-state.ts
  var NIALL_QUEST_STATE_KEY = "max-game:niall-quest-state";
  var LEGACY_NIALL_FIGHT_COMPLETE_KEY = "max-game:niall-fight-complete";
  var LEGACY_NIALL_AT_BUS_STOP_KEY = "max-game:niall-at-bus-stop";
  var INTERIOR_VISITED_KEY = "max-game:interior-visited";
  function isNiallQuestState(value) {
    return value === "hostile" || value === "following" || value === "busStop";
  }
  function getNiallQuestState() {
    const storedState = readStorage(NIALL_QUEST_STATE_KEY);
    if (isNiallQuestState(storedState)) return storedState;
    if (readStorage(LEGACY_NIALL_AT_BUS_STOP_KEY) === "true") return "busStop";
    if (readStorage(LEGACY_NIALL_FIGHT_COMPLETE_KEY) === "true") return "following";
    return "hostile";
  }
  function setNiallQuestState(state3) {
    writeStorage(NIALL_QUEST_STATE_KEY, state3);
  }
  function hasVisitedInterior() {
    return readStorage(INTERIOR_VISITED_KEY) === "true";
  }

  // js/niall.ts
  var CONTACT_DISTANCE = 30;
  var VERTICAL_SIGHT_HALF_WIDTH = 16;
  var VERTICAL_SIGHT_DISTANCE = 180;
  var CHASE_SPEED = 235;
  var FRAME_COUNT2 = 4;
  var FRAME_RATE = 9;
  var BATTLE_TRANSITION_DURATION = 2700;
  var BUS_STOP_DISTANCE = 58;
  var NIALL = {
    x: 792,
    y: 391,
    width: 28,
    height: 40
  };
  var NIALL_BUS_STOP = {
    triggerX: BUS_INTRO_STOP_X,
    triggerY: BUS_INTRO_PLAYER_END_Y,
    x: BUS_INTRO_STOP_X + 36,
    y: BUS_INTRO_PLAYER_END_Y
  };
  var gameShell3 = requireElement(".game-shell");
  var questState = getNiallQuestState();
  var niallState = {
    x: questState === "busStop" ? NIALL_BUS_STOP.x : NIALL.x,
    y: questState === "busStop" ? NIALL_BUS_STOP.y : NIALL.y,
    direction: "down",
    frame: 0,
    animationTime: 0
  };
  var isNiallFollowing = () => questState === "following";
  var battleTransitionActive = false;
  var alertActive = false;
  var isNiallBattleTransitionActive = () => battleTransitionActive;
  var isNiallAlertActive = () => alertActive;
  function startFight() {
    if (questState !== "hostile" || battleTransitionActive) return;
    battleTransitionActive = true;
    releaseAllInput();
    const transition = document.createElement("div");
    transition.className = "battle-transition";
    transition.setAttribute("aria-hidden", "true");
    for (let index = 0; index < 12; index += 1) {
      const band = document.createElement("span");
      band.style.setProperty("--band-index", String(index));
      transition.append(band);
    }
    gameShell3.append(transition);
    window.setTimeout(() => {
      window.location.assign("niall-fight/index.html");
    }, BATTLE_TRANSITION_DURATION);
  }
  function setDirection(dx, dy) {
    if (Math.abs(dx) > Math.abs(dy) * 1.7) {
      niallState.direction = dx < 0 ? "left" : "right";
    } else if (Math.abs(dy) > Math.abs(dx) * 1.7) {
      niallState.direction = dy < 0 ? "up" : "down";
    } else if (dx < 0 && dy < 0) {
      niallState.direction = "upLeft";
    } else if (dx > 0 && dy < 0) {
      niallState.direction = "upRight";
    } else if (dx < 0 && dy > 0) {
      niallState.direction = "downLeft";
    } else if (dx > 0 && dy > 0) {
      niallState.direction = "downRight";
    }
  }
  function chasePlayer(deltaTime, dx, dy, distance) {
    setDirection(dx, dy);
    niallState.x = Math.max(NIALL.width / 2, Math.min(WORLD_WIDTH - NIALL.width / 2, niallState.x + dx / distance * CHASE_SPEED * deltaTime));
    niallState.y = Math.max(NIALL.height, Math.min(WORLD_HEIGHT, niallState.y + dy / distance * CHASE_SPEED * deltaTime));
    niallState.animationTime += deltaTime;
    niallState.frame = Math.floor(niallState.animationTime * FRAME_RATE) % FRAME_COUNT2;
  }
  function updateNiallInteraction(deltaTime, playerX, playerY) {
    if (isNiallFollowing()) {
      if (Math.hypot(playerX - NIALL_BUS_STOP.triggerX, playerY - NIALL_BUS_STOP.triggerY) <= BUS_STOP_DISTANCE) {
        questState = "busStop";
        setNiallQuestState(questState);
        niallState.x = NIALL_BUS_STOP.x;
        niallState.y = NIALL_BUS_STOP.y;
        niallState.direction = "down";
        niallState.frame = 0;
        niallState.animationTime = 0;
      }
      return;
    }
    if (questState === "busStop") return;
    if (battleTransitionActive) return;
    const dx = playerX - niallState.x;
    const dy = playerY - niallState.y;
    if (!alertActive && Math.abs(dx) <= VERTICAL_SIGHT_HALF_WIDTH && dy > 0 && dy <= VERTICAL_SIGHT_DISTANCE) {
      alertActive = true;
      niallState.direction = "down";
      niallState.frame = 0;
      releaseAllInput();
      return;
    }
    const distance = Math.hypot(dx, dy);
    if (distance <= CONTACT_DISTANCE) {
      startFight();
      return;
    }
    if (distance === 0 || !alertActive) return;
    chasePlayer(deltaTime, dx, dy, distance);
  }

  // js/adam-dialogue.ts
  var ADAM_DIALOGUE_LINES = [
    "here's an interesting fact"
  ];

  // js/adam-facts.ts
  var ADAM_FACTS = [
    "The club were originally called Dial Square before becoming Royal Arsenal and later Woolwich Arsenal.",
    "Arsenal played at Highbury for 93 years, from 1913 until 2006.",
    "The cannon on Arsenal's badge comes from the club's origins at the Royal Arsenal weapons factory.",
    "The 2003\u201304 'Invincibles' recorded 26 wins, 12 draws and 0 defeats in the Premier League. The unbeaten league run eventually reached 49 matches, lasting from May 2003 to October 2004.",
    "Arsenal won the league and FA Cup Double in 1970\u201371, 1997\u201398 and 2001\u201302.",
    "Wenger was the first non-British manager to win the English top-flight title.",
    "Arsenal won the league at White Hart Lane, Tottenham's home ground, in both 1971 and 2004.",
    "Arsenal needed to beat Liverpool by two clear goals at Anfield in that 1989 title decider and won 2\u20130.",
    "Arsenal's famous white sleeves were introduced in the 1930s during Herbert Chapman's time as manager (from 1925 to 1934).",
    "Arsenal is the only London football club to have a London Underground station named directly after it.",
    "Arsenal reached the 2006 Champions League final without conceding a goal in ten consecutive Champions League matches. We don't talk about the final.",
    "Goalkeeper Jens Lehmann went 853 minutes without conceding during Arsenal's run to the 2006 Champions League final.",
    "Arsenal's 7\u20130 win over Everton in 2005 was the final match in which all three members of the Invincibles-era attacking trio of Henry, Bergkamp and Pires scored together.",
    "Arsenal have spent more consecutive seasons in the English top flight than any other club, having been there continuously since 1919."
  ];

  // js/alex-s-dialogue.ts
  var ALEX_S_DIALOGUE_LINES = [
    "Hi there I'm Alex. This is my first line.",
    "Hi there I'm Alex. This is my second line.",
    "Hi there I'm Alex. This is my third line."
  ];

  // js/katy-dialogue.ts
  var KATY_DIALOGUE_LINES = [
    "Haven\u2019t seen you around here before.",
    "Careful out there. Things have been strange lately.",
    "You look like you\u2019ve been travelling.",
    "Don\u2019t mind me. Just passing the time.",
    "If you\u2019re looking for trouble, you\u2019ll find plenty."
  ];

  // js/georgia-dialogue.ts
  var GEORGIA_DIALOGUE_LINES = [
    "Hi there, I'm Georgia. This is my first line.",
    "Hi there, I'm Georgia. This is my second line.",
    "Hi there, I'm Georgia. This is my third line."
  ];

  // js/arsenal-fixture.ts
  var ARSENAL_TEAM_ID = "133604";
  var NEXT_EVENT_URL = `https://www.thesportsdb.com/api/v1/json/3/eventsnext.php?id=${ARSENAL_TEAM_ID}`;
  var CACHE_DURATION_MS = 5 * 60 * 1e3;
  var cachedDialogue = null;
  var cachedAt = 0;
  var pendingRequest = null;
  function fixtureDate(timestamp) {
    const utcTimestamp = /(?:Z|[+-]\d\d:\d\d)$/.test(timestamp) ? timestamp : `${timestamp}Z`;
    const date = new Date(utcTimestamp);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  function formatFixture(event) {
    if (!event.strHomeTeam || !event.strAwayTeam || !event.strTimestamp) return null;
    const date = fixtureDate(event.strTimestamp);
    if (!date) return null;
    const dateAndTime = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/London",
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).format(date);
    return `Next Arsenal game: ${event.strHomeTeam} v ${event.strAwayTeam}, ${dateAndTime} uk time.`;
  }
  async function loadFixtureDialogue() {
    const response = await fetch(NEXT_EVENT_URL);
    if (!response.ok) throw new Error(`Arsenal fixture request failed: ${response.status}`);
    const data = await response.json();
    const fixture = data.events?.map(formatFixture).find((line) => line !== null);
    if (!fixture) throw new Error("No upcoming Arsenal fixture was returned");
    return fixture;
  }
  function getNextArsenalFixtureDialogue() {
    if (cachedDialogue && Date.now() - cachedAt < CACHE_DURATION_MS) return Promise.resolve(cachedDialogue);
    if (pendingRequest) return pendingRequest;
    pendingRequest = loadFixtureDialogue().then((fixture) => {
      cachedDialogue = fixture;
      cachedAt = Date.now();
      return fixture;
    }).catch(() => "Ah! sorry mate don't know the results of the next game best to bother max irl to fix.").finally(() => {
      pendingRequest = null;
    });
    return pendingRequest;
  }

  // js/ed-dialogue.ts
  var ED_DIALOGUE_LINES = [
    "Ed's the name. Good to finally see you, Max.",
    "You're back. Did the suspiciously powerful sandwich work?",
    "Three conversations? We're basically best friends now."
  ];

  // js/mike-dialogue.ts
  var MIKE_DIALOGUE_LINES = [
    "Mike here \u2014 welcome to my corner of the map, Max.",
    "You're back. Did the suspiciously powerful sandwich work?",
    "Three conversations? We're basically best friends now."
  ];

  // js/rei-dialogue.ts
  var REI_DIALOGUE_LINES = [
    "Rei here. Take a breath, Max \u2014 there's plenty to discuss.",
    "You're back. Did the suspiciously powerful sandwich work?",
    "Three conversations? We're basically best friends now."
  ];

  // js/profile-images.generated.ts
  var PROFILE_IMAGE_SOURCES = {
    "alex s": "chat/alex s/profile.jpg",
    "alice": "chat/alice/player/profile.png",
    "andy": "chat/andy/profile.jpg",
    "chris": "chat/chris/player/profile.png",
    "georgia": "chat/georgia/profile.jpg",
    "ju": "chat/ju/player/profile.png",
    "lucy": "chat/lucy/player/profile.png",
    "adam": "chat/adam/player/profile.png",
    "alex w": "chat/alex w/player/profile.png",
    "aliya": "chat/aliya/example/profile.png",
    "dan": "chat/dan/player/profile.png",
    "bochra": "chat/bochra/player/profile.png",
    "ed": "chat/ed/player/profile.png",
    "helen": "chat/helen/player/profile.png",
    "joe": "chat/joe/player/profile.png",
    "josh": "chat/josh/example/profile.png",
    "katie": "chat/katie/player/profile.png",
    "maddy": "chat/maddy/example/profile.png",
    "marina d": "chat/marina d/player/profile.png",
    "mason": "chat/mason/player/profile.png",
    "mike": "chat/mike/player/profile.png",
    "meli": "chat/meli/player/profile.png",
    "noel": "chat/noel/player/profile.png",
    "niall": "chat/niall/player/profile.png",
    "oscar": "chat/oscar/player/profile.png",
    "real": "chat/real/alex s/player/profile.png",
    "rei": "chat/rei/player/profile.png",
    "sam": "chat/sam/player/profile.png"
  };

  // js/profile-images.ts
  function profileImageSource(name) {
    const normalizedName = name.trim().toLowerCase();
    const exactMatch = PROFILE_IMAGE_SOURCES[normalizedName];
    if (exactMatch) return exactMatch;
    const matchingKey = Object.keys(PROFILE_IMAGE_SOURCES).find(
      (key) => normalizedName.startsWith(`${key} `) || key.startsWith(`${normalizedName} `)
    );
    return matchingKey ? PROFILE_IMAGE_SOURCES[matchingKey] : null;
  }
  function setProfileImage(image, name, prefix = "") {
    const source = profileImageSource(name);
    image.hidden = !source;
    image.alt = source ? `${name} profile` : "";
    if (source) image.src = `${prefix}${source}`;
    else image.removeAttribute("src");
  }

  // js/npcs.ts
  var ADAM = {
    id: "adam",
    name: "adam",
    x: 195,
    y: 916,
    width: 37,
    height: 60,
    interactionDistance: 56,
    dialogueLines: ADAM_DIALOGUE_LINES,
    followUpLine: nextAdamFact
  };
  var ED = {
    id: "ed",
    name: "ed",
    x: 254,
    y: 909,
    width: 25,
    height: 54,
    interactionDistance: 56,
    dialogueLines: ED_DIALOGUE_LINES,
    getDialogueLine: getNextArsenalFixtureDialogue
  };
  var MIKE = {
    id: "mike",
    name: "mike",
    x: 300,
    y: 685,
    width: 40,
    height: 46,
    interactionDistance: 56,
    itemGift: GIFT_ITEMS[0],
    dialogueLines: MIKE_DIALOGUE_LINES
  };
  var REI = {
    id: "rei",
    name: "rei",
    x: 456,
    y: 500,
    width: 32,
    height: 45,
    interactionDistance: 56,
    itemGift: REI_ITEM,
    dialogueLines: REI_DIALOGUE_LINES,
    requestLine: "I need some red paint to finish this sign. Help me find some"
  };
  var ALEX_S = {
    id: "alexS",
    name: "Alex S",
    x: 680,
    y: 1063,
    width: 20,
    height: 46,
    interactionDistance: 58,
    itemGift: GIFT_ITEMS[1],
    dialogueLines: ALEX_S_DIALOGUE_LINES
  };
  var KATY = {
    id: "katy",
    name: "Katy",
    x: 422,
    y: 640,
    width: 35,
    height: 52,
    interactionDistance: 58,
    itemGift: GIFT_ITEMS[2],
    dialogueLines: KATY_DIALOGUE_LINES
  };
  var GEORGIA_NPC = {
    id: "georgia",
    name: "Georgia",
    x: GEORGIA.x,
    y: GEORGIA.y,
    width: GEORGIA.width,
    height: GEORGIA.height,
    interactionDistance: 64,
    getPosition: () => georgiaState,
    itemGift: GEORGIA_ITEM,
    dialogueLines: GEORGIA_DIALOGUE_LINES
  };
  var NPCS = [ADAM, ED, MIKE, REI, ALEX_S, KATY, GEORGIA_NPC];
  var dialogue2 = requireElement("#npc-dialogue");
  var speaker = requireElement("#npc-speaker");
  var dialogueLine = requireElement("#npc-dialogue-line");
  var dialogueProfile = requireElement("#npc-dialogue-profile");
  var dialogueProgress = requireElement("#npc-dialogue-progress");
  var giftConfirmation = requireElement("#npc-gift-confirmation");
  var closeButton = requireElement("#npc-dialogue-close");
  var nextButton2 = requireElement("#npc-dialogue-next");
  var gameShell4 = requireElement(".game-shell");
  var fallbackDialogueIndexes = /* @__PURE__ */ new Map();
  var QUEST_ACCEPTED_OVERLAY_DURATION = 3200;
  var REI_BILLBOARD_COMPLETE_LINE = "By the way, don\u2019t worry, I actually found all of this red paint, so I was able to finish the billboard.";
  var activeNpc = null;
  var pendingRequestLine = null;
  var pendingFollowUpLine = null;
  var pendingGiftLine = null;
  var pendingGiftItem = null;
  var pendingGiftConfirmation = null;
  var currentDialogueLineIndex = 0;
  var requestLineShown = false;
  var nearbyNpc = null;
  var reiCompletionStage = null;
  function isNpcDialogueOpen() {
    return activeNpc !== null;
  }
  function showQuestOverlay(imageSource) {
    const overlay = document.createElement("div");
    overlay.className = "quest-accepted-overlay";
    overlay.setAttribute("aria-hidden", "true");
    const image = document.createElement("img");
    image.src = imageSource;
    image.alt = "";
    overlay.append(image);
    gameShell4.append(overlay);
    window.setTimeout(() => overlay.remove(), QUEST_ACCEPTED_OVERLAY_DURATION);
    const sound = new Audio("audio/quest-accepted.mp3");
    sound.preload = "auto";
    void sound.play().catch(() => {
    });
  }
  function showQuestAcceptedOverlay() {
    showQuestOverlay("img/external/quest_accepted.png");
  }
  function showQuestCompleteOverlay() {
    showQuestOverlay("img/external/quest-complete.png");
  }
  function dialogueIndexKey(npc) {
    return `max-game:${npc.id}-dialogue-index`;
  }
  function nextStoredIndex(key, length) {
    const fallback = fallbackDialogueIndexes.get(key) ?? 0;
    const stored = Number.parseInt(readStorage(key) ?? String(fallback), 10);
    const current = Number.isFinite(stored) && stored >= 0 ? stored % length : 0;
    const next = (current + 1) % length;
    fallbackDialogueIndexes.set(key, next);
    writeStorage(key, String(next));
    return current;
  }
  function nextDialogueIndex(npc) {
    return nextStoredIndex(dialogueIndexKey(npc), npc.dialogueLines.length);
  }
  function nextAdamFact() {
    const index = nextStoredIndex("max-game:adam-fact-index", ADAM_FACTS.length);
    return ADAM_FACTS[index] ?? "";
  }
  function closeDialogue() {
    activeNpc = null;
    pendingRequestLine = null;
    pendingFollowUpLine = null;
    pendingGiftLine = null;
    pendingGiftItem = null;
    pendingGiftConfirmation = null;
    requestLineShown = false;
    reiCompletionStage = null;
    dialogue2.hidden = true;
    dialogueProfile.hidden = true;
    nextButton2.hidden = true;
    dialogueProgress.hidden = true;
    giftConfirmation.hidden = true;
  }
  function showRequestLine() {
    if (!activeNpc || !pendingRequestLine) return;
    dialogueLine.textContent = pendingRequestLine;
    pendingRequestLine = null;
    requestLineShown = true;
    dialogueProgress.hidden = true;
    giftConfirmation.hidden = true;
    nextButton2.hidden = false;
  }
  function showGiftLine() {
    if (!pendingGiftLine) return;
    dialogueLine.textContent = pendingGiftLine;
    pendingGiftLine = null;
    const giftWasAdded = pendingGiftItem ? addGift(pendingGiftItem) : false;
    pendingGiftItem = null;
    dialogueProgress.hidden = true;
    giftConfirmation.textContent = giftWasAdded ? pendingGiftConfirmation : "";
    pendingGiftConfirmation = null;
    giftConfirmation.hidden = !giftWasAdded;
    nextButton2.hidden = true;
  }
  function showFollowUpLine() {
    if (!pendingFollowUpLine) return;
    dialogueLine.textContent = pendingFollowUpLine;
    pendingFollowUpLine = null;
    dialogueProgress.hidden = true;
    nextButton2.hidden = true;
  }
  function acceptQuest() {
    requestLineShown = false;
    showQuestAcceptedOverlay();
    closeDialogue();
  }
  function advanceDialogue() {
    if (reiCompletionStage === "intro") {
      if (pendingGiftLine) {
        showGiftLine();
        reiCompletionStage = "explanation";
        nextButton2.hidden = false;
        return;
      }
      reiCompletionStage = "explanation";
      dialogueLine.textContent = REI_BILLBOARD_COMPLETE_LINE;
      dialogueProgress.hidden = true;
      nextButton2.hidden = false;
    } else if (reiCompletionStage === "explanation") {
      reiCompletionStage = "thanks";
      dialogueLine.textContent = "thanks anyway for the help";
      dialogueProgress.hidden = true;
      nextButton2.hidden = false;
    } else if (reiCompletionStage === "thanks") {
      showQuestCompleteOverlay();
      closeDialogue();
    } else if (pendingRequestLine) {
      showRequestLine();
    } else if (pendingFollowUpLine) {
      showFollowUpLine();
    } else if (pendingGiftLine) {
      showGiftLine();
    } else if (requestLineShown) {
      acceptQuest();
    } else if (activeNpc && activeNpc.dialogueLines.length > 1) {
      currentDialogueLineIndex = (currentDialogueLineIndex + 1) % activeNpc.dialogueLines.length;
      dialogueLine.textContent = activeNpc.dialogueLines[currentDialogueLineIndex] ?? "";
      dialogueProgress.textContent = `${currentDialogueLineIndex + 1}/${activeNpc.dialogueLines.length}`;
      dialogueProgress.hidden = false;
    }
  }
  function showDialogueLine(npc) {
    if (!npc.getDialogueLine) {
      const lineIndex = nextDialogueIndex(npc);
      currentDialogueLineIndex = lineIndex;
      dialogueLine.textContent = npc.dialogueLines[lineIndex] ?? "";
      dialogueProgress.textContent = `${lineIndex + 1}/${npc.dialogueLines.length}`;
      dialogueProgress.hidden = false;
      return;
    }
    dialogueProgress.hidden = true;
    dialogueLine.textContent = "Checking Arsenal\u2019s next game...";
    nextButton2.hidden = true;
    void npc.getDialogueLine().then((line) => {
      if (activeNpc === npc) dialogueLine.textContent = line;
    });
  }
  function openDialogue(npc) {
    hideSignDialogue();
    activeNpc = npc;
    if (npc.id === "rei" && hasVisitedInterior()) {
      pendingRequestLine = null;
      pendingFollowUpLine = null;
      pendingGiftItem = !hasGift(REI_ITEM) ? REI_ITEM : null;
      pendingGiftLine = pendingGiftItem ? nextGiftLine() : null;
      pendingGiftConfirmation = pendingGiftLine ? "Rei's item was added to your inventory." : null;
      requestLineShown = false;
      reiCompletionStage = "intro";
      giftConfirmation.hidden = true;
      speaker.textContent = npc.name;
      setProfileImage(dialogueProfile, npc.name);
      showDialogueLine(npc);
      nextButton2.hidden = false;
      dialogue2.hidden = false;
      return;
    }
    pendingRequestLine = npc.requestLine ?? null;
    pendingFollowUpLine = npc.followUpLine?.() ?? null;
    pendingGiftItem = npc.itemGift && !hasGift(npc.itemGift) ? npc.itemGift : null;
    pendingGiftLine = pendingGiftItem ? nextGiftLine() : null;
    pendingGiftConfirmation = pendingGiftLine ? "An item has been added to your inventory." : null;
    giftConfirmation.hidden = true;
    requestLineShown = false;
    speaker.textContent = npc.name;
    setProfileImage(dialogueProfile, npc.name);
    showDialogueLine(npc);
    nextButton2.hidden = pendingRequestLine === null && pendingFollowUpLine === null && pendingGiftLine === null && npc.dialogueLines.length <= 1;
    dialogue2.hidden = false;
  }
  function updateNpcInteractions(playerX, playerY) {
    const nextNearbyNpc = NPCS.filter((npc) => npc.id !== "mike" || !hasVisitedInterior()).find((npc) => {
      const position = npc.getPosition?.() ?? npc;
      return Math.hypot(playerX - position.x, playerY - position.y) <= npc.interactionDistance;
    }) ?? null;
    if (nextNearbyNpc === nearbyNpc) return;
    nearbyNpc = nextNearbyNpc;
    setGeorgiaInteractionPaused(nearbyNpc?.id === "georgia");
    closeDialogue();
    if (nearbyNpc) openDialogue(nearbyNpc);
  }
  function setupNpcInteractions() {
    closeButton.addEventListener("click", closeDialogue);
    nextButton2.addEventListener("click", advanceDialogue);
    window.addEventListener("keydown", (event) => {
      if (!activeNpc) return;
      if (event.code === "Escape") {
        event.preventDefault();
        closeDialogue();
        return;
      }
      if ((pendingRequestLine || pendingFollowUpLine || requestLineShown) && (event.code === "Enter" || event.code === "Space")) {
        event.preventDefault();
        advanceDialogue();
      }
    });
  }

  // js/player.ts
  var clampX = (x) => Math.max(HALF_WIDTH, Math.min(WORLD_WIDTH - HALF_WIDTH, x));
  var clampY = (y) => Math.max(SPRITE_HEIGHT, Math.min(WORLD_HEIGHT, y));
  var searchParams2 = new URLSearchParams(window.location.search);
  var returnDoorId = searchParams2.get("door");
  var returnDoor = DOORWAYS.find((doorway) => doorway.id === returnDoorId);
  var DEFAULT_START_X = BUS_INTRO_STOP_X;
  var DEFAULT_START_Y = BUS_INTRO_PLAYER_START_Y;
  var fightReturn = searchParams2.get("niall") === "bus";
  var DOOR_RETURN_OFFSET = 12;
  var player2 = {
    x: fightReturn ? NIALL.x - 42 : returnDoor ? returnDoor.x + returnDoor.width / 2 : DEFAULT_START_X,
    y: fightReturn ? NIALL.y + 8 : returnDoor ? returnDoor.y + returnDoor.height + DOOR_RETURN_OFFSET : DEFAULT_START_Y,
    direction: returnDoor || fightReturn ? "down" : "up",
    frame: 0,
    animationTime: 0
  };
  function movePlayerWithCollisions(movementX, movementY) {
    const steps = Math.max(1, Math.ceil(Math.max(Math.abs(movementX), Math.abs(movementY)) / 4));
    const stepX = movementX / steps;
    const stepY = movementY / steps;
    for (let step = 0; step < steps; step += 1) {
      const nextX = clampX(player2.x + stepX);
      if (!bumpSignAt(nextX, player2.y) && !playerCollidesAt(nextX, player2.y)) player2.x = nextX;
      const nextY = clampY(player2.y + stepY);
      if (!bumpSignAt(player2.x, nextY) && !playerCollidesAt(player2.x, nextY)) player2.y = nextY;
    }
  }
  function updatePlayer(deltaTime, speedMultiplier2) {
    if (isBusIntroActive() || isHoleAnimationActive() || isJumpMenuOpen() || isGymTimCutsceneBlockingPlayer() || isNiallAlertActive() || isNiallBattleTransitionActive() || isCaveTheftCutsceneActive()) {
      player2.animationTime = 0;
      player2.frame = 0;
      return;
    }
    if (isPlayerTripping()) {
      player2.animationTime = 0;
      player2.frame = 0;
      return;
    }
    let dx = 0;
    let dy = 0;
    if (isHeld("left")) dx -= 1;
    if (isHeld("right")) dx += 1;
    if (isHeld("up")) dy -= 1;
    if (isHeld("down")) dy += 1;
    const isMoving = dx !== 0 || dy !== 0;
    if (!isMoving) {
      player2.animationTime = 0;
      player2.frame = 0;
      return;
    }
    const length = Math.hypot(dx, dy);
    const movementX = dx / length * SPEED * speedMultiplier2 * deltaTime;
    const movementY = dy / length * SPEED * speedMultiplier2 * deltaTime;
    movePlayerWithCollisions(movementX, movementY);
    if (dx < 0 && dy < 0) player2.direction = "upLeft";
    else if (dx > 0 && dy < 0) player2.direction = "upRight";
    else if (dx < 0 && dy > 0) player2.direction = "downLeft";
    else if (dx > 0 && dy > 0) player2.direction = "downRight";
    else if (dx < 0) player2.direction = "left";
    else if (dx > 0) player2.direction = "right";
    else if (dy < 0) player2.direction = "up";
    else player2.direction = "down";
    player2.animationTime += deltaTime;
    player2.frame = Math.floor(player2.animationTime * 11) % FRAME_COUNT;
  }

  // js/overworld-npcs-render.ts
  var REI_PAINT = { x: 438, y: 490, width: 15, height: 20 };
  function drawNpc(context2, image, npc, cameraX, cameraY) {
    context2.drawImage(
      image,
      Math.round(npc.x - cameraX - npc.width / 2),
      Math.round(npc.y - cameraY - npc.height),
      npc.width,
      npc.height
    );
  }
  function drawOverworldNpcs(context2, cameraX, cameraY) {
    context2.save();
    context2.imageSmoothingEnabled = false;
    drawMapCharacters(context2, cameraX, cameraY);
    if (!hasVisitedInterior()) drawNpc(context2, images.mike, MIKE, cameraX, cameraY);
    drawNpc(context2, images.rei, REI, cameraX, cameraY);
    if (hasVisitedInterior()) drawNpc(context2, images.paint, REI_PAINT, cameraX, cameraY);
    drawNpc(context2, images.adam, ADAM, cameraX, cameraY);
    drawNpc(context2, images.ed, ED, cameraX, cameraY);
    drawNpc(context2, images.alexS, ALEX_S, cameraX, cameraY);
    drawNpc(context2, images.katy, KATY, cameraX, cameraY);
    drawGymTimCutscene(context2, images.timMap, cameraX, cameraY);
    context2.restore();
  }

  // js/player-sprite.ts
  var FRAME_WIDTH2 = 23;
  var FRAME_HEIGHT2 = 36;
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
        sourceX: frame * FRAME_WIDTH2,
        sourceY: DEFAULT_DIRECTION_ROWS[direction] * FRAME_HEIGHT2,
        sourceWidth: FRAME_WIDTH2,
        sourceHeight: FRAME_HEIGHT2,
        width: FRAME_WIDTH2 * scale,
        height: FRAME_HEIGHT2 * scale,
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

  // js/tv-render.ts
  var SCREEN_OFFSET_X = 8;
  var SCREEN_OFFSET_Y = 14;
  var SCREEN_WIDTH = 38;
  var SCREEN_HEIGHT = 21;
  var LOOP_DURATION = 8e3;
  var SOCCER_START = 1600;
  var SOCCER_END = 6400;
  var STATIC_PALETTE = ["#101827", "#35445a", "#7f91a5", "#d8e0e4"];
  function drawStatic(context2, x, y, time) {
    const staticFrame = Math.floor(time / 70);
    context2.fillStyle = "#09101c";
    context2.fillRect(x, y, SCREEN_WIDTH, SCREEN_HEIGHT);
    let noise = (staticFrame ^ 2654435769) >>> 0;
    for (let screenY = 0; screenY < SCREEN_HEIGHT; screenY += 1) {
      for (let screenX = 0; screenX < SCREEN_WIDTH; screenX += 1) {
        noise = Math.imul(noise, 1664525) + 1013904223 >>> 0;
        context2.fillStyle = STATIC_PALETTE[noise >>> 30] ?? STATIC_PALETTE[0];
        context2.fillRect(x + screenX, y + screenY, 1, 1);
      }
    }
  }
  function drawPlayer(context2, x, y, shirt) {
    context2.fillStyle = "#e7b875";
    context2.fillRect(x + 1, y, 1, 1);
    context2.fillStyle = shirt;
    context2.fillRect(x, y + 1, 3, 1);
    context2.fillStyle = "#111827";
    context2.fillRect(x, y + 2, 1, 1);
    context2.fillRect(x + 2, y + 2, 1, 1);
  }
  function drawSoccer(context2, x, y, time) {
    const frame = Math.floor((time - SOCCER_START) / 220);
    const progress = Math.min(1, frame / 21);
    context2.fillStyle = "#17452b";
    context2.fillRect(x, y, SCREEN_WIDTH, SCREEN_HEIGHT);
    context2.fillStyle = "#1d5633";
    for (let stripeX = 0; stripeX < SCREEN_WIDTH; stripeX += 16) {
      context2.fillRect(x + stripeX, y, 8, SCREEN_HEIGHT);
    }
    context2.fillStyle = "#8fc477";
    context2.fillRect(x, y + 1, SCREEN_WIDTH, 1);
    context2.fillRect(x, y + SCREEN_HEIGHT - 2, SCREEN_WIDTH, 1);
    context2.fillRect(x + 1, y, 1, SCREEN_HEIGHT);
    context2.fillRect(x + SCREEN_WIDTH - 2, y, 1, SCREEN_HEIGHT);
    const midfieldX = Math.floor(SCREEN_WIDTH / 2);
    context2.fillRect(x + midfieldX, y + 1, 1, SCREEN_HEIGHT - 3);
    context2.fillRect(x + midfieldX - 1, y + 8, 3, 1);
    context2.fillRect(x + midfieldX - 1, y + 12, 3, 1);
    context2.fillRect(x, y + 7, 3, 1);
    context2.fillRect(x, y + 13, 3, 1);
    context2.fillRect(x + SCREEN_WIDTH - 3, y + 7, 3, 1);
    context2.fillRect(x + SCREEN_WIDTH - 3, y + 13, 3, 1);
    const attackingX = Math.round(6 + progress * 22);
    const defendingX = Math.round(29 - progress * 6);
    drawPlayer(context2, x + attackingX, y + 13 + frame % 2, "#e23f3f");
    drawPlayer(context2, x + Math.max(4, attackingX - 7), y + 5 + (frame + 1) % 2, "#e23f3f");
    drawPlayer(context2, x + defendingX, y + 10 - frame % 2, "#3b72d9");
    drawPlayer(context2, x + 24, y + 4 + (frame + 1) % 2, "#3b72d9");
    drawPlayer(context2, x + 2, y + 9, "#f1c84b");
    drawPlayer(context2, x + 33, y + 9, "#f1c84b");
    const ballX = Math.round(9 + progress * 25);
    const ballY = Math.round(15 - Math.sin(progress * Math.PI) * 6);
    context2.fillStyle = "#f4f0d8";
    context2.fillRect(x + ballX, y + ballY, 1, 1);
  }
  function drawTvScreen(context2, time, cameraX, cameraY) {
    const screenX = Math.round(TV_X - cameraX + SCREEN_OFFSET_X);
    const screenY = Math.round(TV_Y - cameraY + SCREEN_OFFSET_Y);
    const cycleTime = time % LOOP_DURATION;
    context2.save();
    context2.beginPath();
    context2.rect(screenX, screenY, SCREEN_WIDTH, SCREEN_HEIGHT);
    context2.clip();
    context2.globalAlpha = 0.82;
    if (cycleTime >= SOCCER_START && cycleTime < SOCCER_END) {
      drawSoccer(context2, screenX, screenY, cycleTime);
    } else {
      drawStatic(context2, screenX, screenY, time);
    }
    context2.globalAlpha = 0.16;
    context2.fillStyle = "#d7f4ff";
    context2.fillRect(screenX + 3, screenY + 2, 8, 1);
    context2.restore();
  }

  // js/overworld-props-render.ts
  var BAKED_SNOWMAN_PATCH = {
    sourceX: 270,
    sourceY: 105,
    sourceWidth: 28,
    sourceHeight: 88,
    x: SNOW_MANSION_X + 214,
    y: SNOW_MANSION_Y + 95,
    width: 56,
    height: 88
  };
  function isImageReady(image) {
    return image.complete && image.naturalWidth > 0;
  }
  function drawRoadTree(cameraX, cameraY) {
    context.drawImage(
      images.roadTree,
      ROAD_TREE_X - cameraX,
      ROAD_TREE_Y - cameraY,
      ROAD_TREE_WIDTH,
      ROAD_TREE_HEIGHT
    );
  }
  function drawRoadBusRoof(cameraX, cameraY) {
    context.drawImage(
      images.roadBusRoof,
      ROAD_BUS_ROOF_X - cameraX,
      ROAD_BUS_ROOF_Y - cameraY,
      ROAD_BUS_ROOF_WIDTH,
      ROAD_BUS_ROOF_HEIGHT
    );
  }
  function drawRoadBusSign(cameraX, cameraY) {
    context.drawImage(
      images.road,
      ROAD_BUS_SIGN_SOURCE_X,
      ROAD_BUS_SIGN_SOURCE_Y,
      ROAD_BUS_SIGN_WIDTH,
      ROAD_BUS_SIGN_HEIGHT,
      ROAD_X + ROAD_BUS_SIGN_SOURCE_X - cameraX,
      ROAD_Y + ROAD_BUS_SIGN_SOURCE_Y - cameraY,
      ROAD_BUS_SIGN_WIDTH,
      ROAD_BUS_SIGN_HEIGHT
    );
  }
  function drawGate(cameraX, cameraY) {
    context.drawImage(images.gate, GATE_X - cameraX, GATE_Y - cameraY, GATE_WIDTH, GATE_HEIGHT);
  }
  function drawTori(cameraX, cameraY) {
    context.drawImage(images.tori, TORI_X - cameraX, TORI_Y - cameraY, TORI_SIZE, TORI_SIZE);
  }
  function drawSnowman(cameraX, cameraY) {
    if (!isSnowmanFallen()) return;
    context.save();
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(
      images.snowMansion,
      BAKED_SNOWMAN_PATCH.sourceX,
      BAKED_SNOWMAN_PATCH.sourceY,
      BAKED_SNOWMAN_PATCH.sourceWidth,
      BAKED_SNOWMAN_PATCH.sourceHeight,
      BAKED_SNOWMAN_PATCH.x - cameraX,
      BAKED_SNOWMAN_PATCH.y - cameraY,
      BAKED_SNOWMAN_PATCH.width,
      BAKED_SNOWMAN_PATCH.height
    );
    context.drawImage(
      images.snowmanFallen,
      Math.round(SNOWMAN.x - cameraX - SNOWMAN.fallenWidth / 2),
      Math.round(SNOWMAN.y - cameraY - SNOWMAN.fallenHeight),
      SNOWMAN.fallenWidth,
      SNOWMAN.fallenHeight
    );
    context.restore();
  }
  function drawCollisionShapes(cameraX, cameraY) {
    context.fillStyle = "rgba(0, 92, 255, 0.62)";
    for (const [x, y, width, height] of COLLISION_SHAPES2) {
      if (x + width < cameraX || x > cameraX + canvas.width || y + height < cameraY || y > cameraY + canvas.height) continue;
      context.fillRect(x - cameraX, y - cameraY, width, height);
    }
  }
  function drawOpenDoorways(cameraX, cameraY) {
    for (const doorway of getOpenDoorways()) {
      context.drawImage(
        images.doorOpen,
        Math.round(doorway.x - cameraX),
        Math.round(doorway.y - cameraY),
        doorway.width,
        doorway.height
      );
    }
  }
  function drawWorldBackground(time, cameraX, cameraY, playerY) {
    const depth = {
      roadCoversPlayer: playerY <= ROAD_FOREGROUND_DEPTH_Y,
      gateCoversPlayer: playerY < GATE_PLAYER_DEPTH_Y,
      toriCoversPlayer: playerY < TORI_PLAYER_DEPTH_Y
    };
    context.drawImage(images.map, -cameraX, -cameraY);
    context.save();
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(images.road, ROAD_X - cameraX, ROAD_Y - cameraY, ROAD_WIDTH, ROAD_HEIGHT);
    if (!depth.roadCoversPlayer) {
      drawRoadTree(cameraX, cameraY);
      drawRoadBusRoof(cameraX, cameraY);
    }
    context.restore();
    context.drawImage(images.billboard, BILLBOARD_X - cameraX, BILLBOARD_Y - cameraY);
    const billboardScreen = hasVisitedInterior() ? images.billboardFinished : images.billboardUnfinished;
    if (isImageReady(billboardScreen)) {
      context.save();
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.drawImage(
        billboardScreen,
        BILLBOARD_SCREEN_X - cameraX,
        BILLBOARD_SCREEN_Y - cameraY,
        BILLBOARD_SCREEN_WIDTH,
        BILLBOARD_SCREEN_HEIGHT
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
      MUSIC_SHOP_SIGN_HEIGHT
    );
    drawSnowman(cameraX, cameraY);
    context.drawImage(images.jobCenter, JOB_CENTER_X - cameraX, JOB_CENTER_Y - cameraY);
    context.drawImage(images.artistStudio, ARTIST_STUDIO_X - cameraX, ARTIST_STUDIO_Y - cameraY);
    context.drawImage(images.feedback, FEEDBACK_X - cameraX, FEEDBACK_Y - cameraY);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(
      images.bookshop,
      BOOKSHOP_X - cameraX,
      BOOKSHOP_Y - cameraY,
      BOOKSHOP_WIDTH,
      BOOKSHOP_HEIGHT
    );
    context.drawImage(
      images.diaryLab,
      DIARY_LAB_X - cameraX,
      DIARY_LAB_Y - cameraY,
      DIARY_LAB_WIDTH,
      DIARY_LAB_HEIGHT
    );
    context.imageSmoothingEnabled = false;
    context.drawImage(images.zenGarden, ZEN_GARDEN_X - cameraX, ZEN_GARDEN_Y - cameraY);
    if (!depth.gateCoversPlayer) drawGate(cameraX, cameraY);
    if (!depth.toriCoversPlayer) drawTori(cameraX, cameraY);
    if (SHOW_COLLISION_SHAPES) drawCollisionShapes(cameraX, cameraY);
    drawOpenDoorways(cameraX, cameraY);
    return depth;
  }
  function drawWorldForeground(cameraX, cameraY, depth) {
    if (depth.roadCoversPlayer) {
      drawRoadTree(cameraX, cameraY);
      drawRoadBusRoof(cameraX, cameraY);
      drawRoadBusSign(cameraX, cameraY);
    }
    if (depth.toriCoversPlayer) drawTori(cameraX, cameraY);
    if (depth.gateCoversPlayer) drawGate(cameraX, cameraY);
  }

  // js/speech-bubble.ts
  function drawSpeechBubble(context2, text, anchorX, anchorY) {
    context2.save();
    context2.font = '12px "Press Start 2P", monospace';
    context2.textBaseline = "top";
    const paddingX = 10;
    const paddingY = 8;
    const maxWidth = 270;
    const words = text.split(" ");
    const lines = [];
    let line = "";
    for (const word of words) {
      const nextLine = line ? `${line} ${word}` : word;
      if (context2.measureText(nextLine).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = nextLine;
      }
    }
    if (line) lines.push(line);
    const textWidth = Math.min(maxWidth, Math.max(...lines.map((value) => context2.measureText(value).width)));
    const width = textWidth + paddingX * 2;
    const height = lines.length * 18 + paddingY * 2;
    const x = Math.round(Math.max(8, Math.min(canvas.width - width - 8, anchorX - width / 2)));
    const y = Math.round(Math.max(8, anchorY - height - 18));
    context2.fillStyle = "#111";
    context2.fillRect(x - 3, y - 3, width + 6, height + 6);
    context2.fillStyle = "#f7f3e8";
    context2.fillRect(x, y, width, height);
    context2.fillStyle = "#111";
    lines.forEach((value, index) => {
      context2.fillText(value, x + paddingX, y + paddingY + index * 18);
    });
    context2.restore();
  }

  // js/render.ts
  var NIALL_SPRITE_COLUMNS = 4;
  var NIALL_SPRITE_FRAME_HEIGHT = 283;
  var NIALL_SPRITE_ROW_Y = [0, 270, 531, 793, 1054, 1320, 1597];
  var NIALL_EXPLANATION_MARK_WIDTH = 26;
  var NIALL_EXPLANATION_MARK_HEIGHT = 21;
  var GIRLS_RENDER_WIDTH = 56;
  var GIRLS_RENDER_HEIGHT = 44;
  var MIKE_AFTERMATH_X = 212;
  var MIKE_AFTERMATH_Y = 439;
  var MIKE_AFTERMATH_WIDTH = 275;
  var MIKE_AFTERMATH_HEIGHT = 271;
  var searchParams3 = new URLSearchParams(window.location.search);
  var SEAL_MODE = searchParams3.has("seal");
  var LOG_PLAYER_POSITION = searchParams3.has("debug-position");
  function isImageReady2(image) {
    return image.complete && image.naturalWidth > 0;
  }
  var GIRLS_IDLE_FRAMES = [
    [181, 16, 235, 176],
    [457, 16, 233, 176],
    [737, 16, 233, 176],
    [1014, 16, 235, 176]
  ];
  var GIRLS_WALK_FRAMES = {
    down: [
      [163, 206, 212, 183],
      [416, 206, 214, 183],
      [657, 206, 211, 183],
      [890, 206, 198, 183],
      [1103, 206, 180, 183],
      [1302, 206, 193, 183]
    ],
    left: [
      [148, 403, 218, 175],
      [398, 403, 219, 175],
      [653, 403, 226, 175],
      [922, 403, 219, 175],
      [1186, 403, 231, 175]
    ],
    right: [
      [141, 591, 231, 179],
      [404, 591, 230, 179],
      [667, 591, 236, 179],
      [939, 591, 237, 179],
      [1211, 591, 237, 179]
    ],
    up: [
      [152, 786, 200, 188],
      [409, 786, 201, 188],
      [679, 786, 208, 188],
      [947, 786, 211, 188],
      [1213, 786, 214, 188]
    ]
  };
  var niallDirectionRows = {
    down: 0,
    downRight: 3,
    right: 2,
    upRight: 6,
    upLeft: 6,
    left: 1,
    up: 5,
    downLeft: 4
  };
  function drawNiallAt(cameraX, cameraY, x, y, direction, frame) {
    const column = frame % NIALL_SPRITE_COLUMNS;
    const sourceX = Math.floor(column * images.niallSprite.width / NIALL_SPRITE_COLUMNS);
    const nextSourceX = Math.floor((column + 1) * images.niallSprite.width / NIALL_SPRITE_COLUMNS);
    const sourceWidth = nextSourceX - sourceX;
    const sourceY = NIALL_SPRITE_ROW_Y[niallDirectionRows[direction]] ?? 0;
    const sourceHeight = Math.min(
      NIALL_SPRITE_FRAME_HEIGHT,
      images.niallSprite.height - sourceY
    );
    context.save();
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(
      images.niallSprite,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      Math.round(x - cameraX - NIALL.width / 2),
      Math.round(y - cameraY - NIALL.height),
      NIALL.width,
      NIALL.height
    );
    context.restore();
  }
  function drawCaveThief(cameraX, cameraY) {
    const thief = getCaveThief();
    if (!thief || !isImageReady2(images.girlsSprite)) return;
    const frames = thief.moving ? GIRLS_WALK_FRAMES[thief.direction] : GIRLS_IDLE_FRAMES;
    const frame = frames[thief.frame % frames.length] ?? frames[0];
    if (!frame) return;
    const [sourceX, sourceY, sourceWidth, sourceHeight] = frame;
    context.save();
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(
      images.girlsSprite,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      Math.round(thief.x - cameraX - GIRLS_RENDER_WIDTH / 2),
      Math.round(thief.y - cameraY - GIRLS_RENDER_HEIGHT),
      GIRLS_RENDER_WIDTH,
      GIRLS_RENDER_HEIGHT
    );
    context.restore();
  }
  function drawBusIntro(cameraX, cameraY) {
    const bus = getBusIntroBus();
    if (!bus) return;
    context.save();
    context.imageSmoothingEnabled = false;
    context.drawImage(
      images.bus,
      Math.round(bus.x - cameraX - bus.width / 2),
      Math.round(bus.y - cameraY - bus.height),
      bus.width,
      bus.height
    );
    context.restore();
  }
  var GEORGIA_BIKE_RENDER_WIDTH = 50;
  var GEORGIA_BIKE_RENDER_HEIGHT = 51;
  function drawGeorgia(cameraX, cameraY) {
    if (!isImageReady2(images.georgiaBike)) return;
    const bob = georgiaState.moving ? Math.sin(georgiaState.animationTime * 12) * 1.5 : 0;
    const facingRight = georgiaState.direction === "right";
    const drawX = Math.round(georgiaState.x - cameraX - GEORGIA_BIKE_RENDER_WIDTH / 2);
    const drawY = Math.round(georgiaState.y - cameraY - GEORGIA_BIKE_RENDER_HEIGHT + bob);
    context.save();
    context.imageSmoothingEnabled = false;
    if (facingRight) {
      context.translate(drawX + GEORGIA_BIKE_RENDER_WIDTH, drawY);
      context.scale(-1, 1);
      context.drawImage(images.georgiaBike, 0, 0, GEORGIA_BIKE_RENDER_WIDTH, GEORGIA_BIKE_RENDER_HEIGHT);
    } else {
      context.drawImage(images.georgiaBike, drawX, drawY, GEORGIA_BIKE_RENDER_WIDTH, GEORGIA_BIKE_RENDER_HEIGHT);
    }
    context.restore();
  }
  function drawMikeAftermath(cameraX, cameraY) {
    if (!hasVisitedInterior() || !isImageReady2(images.mikeAftermath)) return;
    context.drawImage(
      images.mikeAftermath,
      MIKE_AFTERMATH_X - cameraX,
      MIKE_AFTERMATH_Y - cameraY,
      MIKE_AFTERMATH_WIDTH,
      MIKE_AFTERMATH_HEIGHT
    );
  }
  function logPlayerPosition() {
    const playerX = player2.x.toFixed(1);
    const playerY = player2.y.toFixed(1);
    if (canvas.dataset.playerX === playerX && canvas.dataset.playerY === playerY) return;
    canvas.dataset.playerX = playerX;
    canvas.dataset.playerY = playerY;
    console.log("Player position", { x: Number(playerX), y: Number(playerY) });
  }
  function draw(time) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    canvas.dataset.playerVariant = SEAL_MODE ? "seal" : "default";
    if (LOG_PLAYER_POSITION) logPlayerPosition();
    const cameraCenter = getBusIntroCameraCenter() ?? getCaveTheftCameraCenter(player2.x, player2.y, time);
    const cameraX = Math.round(Math.max(0, Math.min(WORLD_WIDTH - canvas.width, cameraCenter.x - canvas.width / 2)));
    const cameraY = Math.round(Math.max(0, Math.min(WORLD_HEIGHT - canvas.height, cameraCenter.y - canvas.height / 2)));
    const worldDepth = drawWorldBackground(time, cameraX, cameraY, player2.y);
    drawMikeAftermath(cameraX, cameraY);
    drawCaveThief(cameraX, cameraY);
    drawGeorgia(cameraX, cameraY);
    if (isNiallFollowing()) {
      drawNiallAt(cameraX, cameraY, player2.x - 34, player2.y + 12, player2.direction, player2.frame);
    } else {
      drawNiallAt(cameraX, cameraY, niallState.x, niallState.y, niallState.direction, niallState.frame);
    }
    if (isNiallAlertActive()) {
      context.drawImage(
        images.niallExplanationMark,
        Math.round(niallState.x - cameraX - NIALL_EXPLANATION_MARK_WIDTH / 2),
        Math.round(niallState.y - cameraY - NIALL.height - NIALL_EXPLANATION_MARK_HEIGHT - 4),
        NIALL_EXPLANATION_MARK_WIDTH,
        NIALL_EXPLANATION_MARK_HEIGHT
      );
    }
    drawOverworldNpcs(context, cameraX, cameraY);
    const playerSpriteSheet = SEAL_MODE ? images.sealSpriteSheet : images.spriteSheet;
    const spriteFrame = getPlayerSpriteFrame(SEAL_MODE, player2.direction, player2.frame, SCALE);
    const { sourceX, sourceY, sourceWidth, sourceHeight, width, height, baselineOffset } = spriteFrame;
    const holeTransform = getHolePlayerTransform();
    const playerVisible = isBusIntroPlayerVisible();
    if (playerVisible && holeTransform) {
      context.save();
      context.globalAlpha = holeTransform.opacity;
      context.translate(
        Math.round(player2.x - cameraX),
        Math.round(player2.y - cameraY - height / 2 + baselineOffset + holeTransform.offsetY)
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
        height
      );
      context.restore();
    } else if (playerVisible && isPlayerTripping(time)) {
      context.save();
      context.translate(
        Math.round(player2.x - cameraX),
        Math.round(player2.y - cameraY - width / 2)
      );
      context.rotate(Math.PI / 2);
      context.drawImage(
        playerSpriteSheet,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        -width / 2,
        -height / 2,
        width,
        height
      );
      context.restore();
    } else if (playerVisible) {
      context.drawImage(
        playerSpriteSheet,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        Math.round(player2.x - cameraX - width / 2),
        Math.round(player2.y - cameraY - height + baselineOffset),
        width,
        height
      );
    }
    if (playerVisible && hasCaveColander()) {
      drawColander(context, Math.round(player2.x - cameraX + 12), Math.round(player2.y - cameraY - 24));
    }
    drawWorldForeground(cameraX, cameraY, worldDepth);
    drawBusIntro(cameraX, cameraY);
    const thief = getCaveThief();
    const thiefDialogue = getCaveThiefDialogue();
    if (thief && thiefDialogue) {
      drawSpeechBubble(context, thiefDialogue, thief.x - cameraX, thief.y - cameraY - thief.size);
    }
    const gymTimDialogue = getGymTimCutsceneDialogue();
    if (gymTimDialogue) drawSpeechBubble(context, gymTimDialogue.text, gymTimDialogue.x - cameraX, gymTimDialogue.y - cameraY);
  }
  function drawLoadFailure() {
    context.fillStyle = "#0b1c10";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#f5fff6";
    context.font = "13px monospace";
    context.textAlign = "center";
    context.fillText("Could not load the game assets.", canvas.width / 2, canvas.height / 2);
  }

  // js/main.ts
  var previousTime = 0;
  function gameLoop(time) {
    const deltaTime = previousTime === 0 ? 0 : Math.min((time - previousTime) / 1e3, 0.05);
    previousTime = time;
    updatePowerups(time);
    const speedMultiplier2 = getSpeedMultiplier();
    updateBusIntro(deltaTime, player2);
    updatePlayer(deltaTime, speedMultiplier2);
    updateHole(deltaTime, player2);
    if (isJumpMenuOpen()) {
      draw(time);
      requestAnimationFrame(gameLoop);
      return;
    }
    updateCaveThief(deltaTime, time, player2.x, player2.y, speedMultiplier2);
    updateGeorgia(deltaTime);
    updateGymTimCutscene(deltaTime, player2);
    updateNpcInteractions(player2.x, player2.y);
    if (!isCaveThiefPursuitActive()) {
      updateNiallInteraction(deltaTime, player2.x, player2.y);
    }
    if (!isNpcDialogueOpen()) {
      updateSigns(player2.x, player2.y);
    }
    updateDoors(player2.x, player2.y);
    draw(time);
    requestAnimationFrame(gameLoop);
  }
  setupInput();
  setupBusIntro();
  setupInventory();
  setupJump();
  setupMusicPlayer();
  setupNpcInteractions();
  setupCaveThief();
  setupGymTimCutscene();
  requireElement("#tim-route-debug-reset").addEventListener("click", () => {
    resetTimRoute();
    window.location.assign("index.html");
  });
  Promise.all([loadAssets(), loadMapCharacters()]).then(() => {
    canvas.dataset.collisionShapes = String(COLLISION_SHAPES2.length);
    requestAnimationFrame(gameLoop);
  }).catch((error) => {
    console.error(error);
    drawLoadFailure();
  });
})();
