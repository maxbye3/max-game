const canvas = document.querySelector('#game');
const context = canvas.getContext('2d');

context.imageSmoothingEnabled = false;

const map = new Image();
const spriteSheet = new Image();

const FRAME_WIDTH = 23;
const FRAME_HEIGHT = 36;
const FRAME_COUNT = 9;
const SCALE = 1;
const SPEED = 185;
const WORLD_WIDTH = 1254;
const WORLD_HEIGHT = 1254;
const HALF_WIDTH = (FRAME_WIDTH * SCALE) / 2;
const SPRITE_HEIGHT = FRAME_HEIGHT * SCALE;
const COLLISION_BUCKET_SIZE = 32;
const BOOST_MULTIPLIER = 1.6;
const BOOST_DURATION = 10000;
const RECHARGE_DURATION = 20000;
const SHOW_COLLISION_SHAPES = new URLSearchParams(window.location.search).has('collisions');
const collisionBuckets = new Map();

// A missing collision-shapes.js must not brick the page: this file is evaluated
// at the top level, so throwing here would leave every listener below unbound.
const collisionShapes = window.COLLISION_SHAPES ?? [];
if (!window.COLLISION_SHAPES) console.error('collision-shapes.js did not load; the map has no collisions.');

const bucketKey = (column, row) => `${column},${row}`;

// The bucket range and the key format must stay identical between the index
// build and every lookup, so both go through this one walker.
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

collisionShapes.forEach((shape) => {
  const [x, y, width, height] = shape;
  forEachBucket(x, y, x + width - 1, y + height - 1, (key) => {
    if (!collisionBuckets.has(key)) collisionBuckets.set(key, []);
    collisionBuckets.get(key).push(shape);
  });
});

const clampX = (x) => Math.max(HALF_WIDTH, Math.min(WORLD_WIDTH - HALF_WIDTH, x));
const clampY = (y) => Math.max(SPRITE_HEIGHT, Math.min(WORLD_HEIGHT, y));

const player = {
  x: WORLD_WIDTH / 2,
  y: WORLD_HEIGHT / 2,
  direction: 'down',
  frame: 0,
  animationTime: 0,
};

const directionRows = {
  down: 0,
  downRight: 1,
  right: 2,
  upRight: 3,
  up: 4,
  upLeft: 5,
  left: 6,
  downLeft: 7,
};
let speedMultiplier = 1;
let speedBoostEndsAt = 0;
const dpadButtons = document.querySelectorAll('.dpad-button');

// Physical keys, so the controls survive AZERTY, Dvorak and non-Latin layouts.
const DIRECTION_CODES = {
  ArrowUp: 'up',
  KeyW: 'up',
  ArrowDown: 'down',
  KeyS: 'down',
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
};

// Several controls can assert the same direction at once - the up and up-left
// buttons under two thumbs, or a d-pad button plus the keyboard - so this is a
// reference count, not a set. Releasing one must not cancel the other.
const heldDirections = new Map();
const heldCodes = new Set();
const releaseButtonHandlers = [];

const isHeld = (direction) => heldDirections.has(direction);

function holdDirection(direction) {
  heldDirections.set(direction, (heldDirections.get(direction) ?? 0) + 1);
}

function releaseDirection(direction) {
  const remaining = (heldDirections.get(direction) ?? 0) - 1;
  if (remaining > 0) heldDirections.set(direction, remaining);
  else heldDirections.delete(direction);
}

function pressCode(code) {
  const direction = DIRECTION_CODES[code];
  if (!direction || heldCodes.has(code)) return;
  heldCodes.add(code);
  holdDirection(direction);
}

function releaseCode(code) {
  if (!heldCodes.delete(code)) return;
  releaseDirection(DIRECTION_CODES[code]);
}

function releaseAllInput() {
  heldCodes.clear();
  heldDirections.clear();
  releaseButtonHandlers.forEach((release) => release());
}

window.addEventListener('keyup', (event) => releaseCode(event.code));
window.addEventListener('blur', releaseAllInput);

dpadButtons.forEach((button) => {
  const directions = button.dataset.directions.split(' ');
  let heldPointerId = null;
  let isPressed = false;

  const press = () => {
    if (isPressed) return;
    isPressed = true;
    directions.forEach(holdDirection);
    button.classList.add('pressed');
  };

  const release = () => {
    if (!isPressed) return;
    isPressed = false;
    directions.forEach(releaseDirection);
    button.classList.remove('pressed');
  };

  releaseButtonHandlers.push(() => {
    isPressed = false;
    button.classList.remove('pressed');
  });

  button.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    heldPointerId = event.pointerId;
    press();
    // Throws if the pointer was already released between dispatch and here.
    try {
      button.setPointerCapture?.(event.pointerId);
    } catch {}
  });

  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((type) => {
    button.addEventListener(type, (event) => {
      event.preventDefault();
      heldPointerId = null;
      release();
    });
  });

  button.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    if (!event.repeat) press();
  });

  button.addEventListener('keyup', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    release();
  });

  // Tabbing away mid-press means the keyup never arrives; a finger still on the
  // button is tracked by its pointer and must not be released here.
  button.addEventListener('blur', () => {
    if (heldPointerId === null) release();
  });
});

const inventoryToggle = document.querySelector('#inventory-toggle');
const inventoryPanel = document.querySelector('#inventory-panel');
const inventoryClose = document.querySelector('#inventory-close');
const inventoryItem = document.querySelector('#inventory-item');
const itemActions = document.querySelector('#item-actions');
const useItemButton = document.querySelector('#use-item');
const inventoryMessage = document.querySelector('#inventory-message');
const inventoryCount = document.querySelector('.inventory-count');
const powerupStatus = document.querySelector('#powerup-status');
const itemStatus = document.querySelector('#item-status');
const readyBadge = document.querySelector('#ready-badge');
const rechargeFill = document.querySelector('#recharge-fill');
const announcer = document.querySelector('#announcer');

// The visible copy sits inside the inventory panel, which is hidden most of the
// time - a live region in a hidden subtree is never announced - so every message
// is mirrored into an always-rendered one.
function announce(message) {
  inventoryMessage.textContent = message;
  announcer.textContent = message;
}
let hasPowerSandwich = true;
let itemRechargesAt = 0;

function setItemReady(isReady) {
  hasPowerSandwich = isReady;
  inventoryCount.textContent = isReady ? '1' : '0';
  inventoryItem.disabled = !isReady;
  inventoryItem.classList.toggle('item-ready', isReady);
  readyBadge.hidden = !isReady;
  rechargeFill.style.width = isReady ? '100%' : '0%';
  itemStatus.textContent = isReady ? 'Ready to use' : 'Recharging';
}

function setItemActionsOpen(isOpen) {
  itemActions.hidden = !isOpen;
  inventoryItem.classList.toggle('selected', isOpen);
  inventoryItem.setAttribute('aria-expanded', String(isOpen));
}

function setInventoryOpen(isOpen) {
  const hadFocusInside = inventoryPanel.contains(document.activeElement);
  inventoryPanel.hidden = !isOpen;
  inventoryToggle.setAttribute('aria-expanded', String(isOpen));
  if (!isOpen && hadFocusInside) inventoryToggle.focus();
}

setItemReady(true);
setItemActionsOpen(false);

inventoryToggle.addEventListener('click', () => setInventoryOpen(inventoryPanel.hidden));
inventoryClose.addEventListener('click', () => setInventoryOpen(false));
inventoryItem.addEventListener('click', () => {
  if (!hasPowerSandwich) return;
  setItemActionsOpen(itemActions.hidden);
});

useItemButton.addEventListener('click', () => {
  if (!hasPowerSandwich) return;
  const now = performance.now();
  speedMultiplier = BOOST_MULTIPLIER;
  speedBoostEndsAt = now + BOOST_DURATION;
  itemRechargesAt = now + RECHARGE_DURATION;
  setItemReady(false);
  setItemActionsOpen(false);
  inventoryClose.focus();
  announce('Power Sandwich used - speed increased for 10 seconds!');
  powerupStatus.hidden = false;
});

window.addEventListener('keydown', (event) => {
  // Let the browser own its shortcuts, and drop any key held when a modifier
  // arrives: the matching keyup is not always delivered while one is down.
  if (event.ctrlKey || event.metaKey || event.altKey) {
    heldCodes.forEach(releaseCode);
    return;
  }

  if (DIRECTION_CODES[event.code]) {
    event.preventDefault();
    pressCode(event.code);
  }

  if (event.repeat) return;
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  if (key === 'i') setInventoryOpen(inventoryPanel.hidden);
  else if (key === 'Escape') setInventoryOpen(false);
});

function update(deltaTime, now) {
  // The boost always ends before the recharge does, so it is resolved first:
  // when a backgrounded tab collapses both into one frame, the newer event wins.
  if (speedBoostEndsAt > 0) {
    const secondsLeft = Math.max(0, (speedBoostEndsAt - now) / 1000);
    const status = `Speed boost ${secondsLeft.toFixed(1)}s`;
    if (powerupStatus.textContent !== status) powerupStatus.textContent = status;

    if (secondsLeft === 0) {
      speedMultiplier = 1;
      speedBoostEndsAt = 0;
      powerupStatus.hidden = true;
      announce('The speed boost has worn off.');
    }
  }

  if (!hasPowerSandwich && itemRechargesAt > 0) {
    const rechargeRemaining = Math.max(0, itemRechargesAt - now);
    const status = `Recharging ${(rechargeRemaining / 1000).toFixed(1)}s`;
    if (itemStatus.textContent !== status) {
      itemStatus.textContent = status;
      rechargeFill.style.width = `${(1 - rechargeRemaining / RECHARGE_DURATION) * 100}%`;
    }

    if (rechargeRemaining === 0) {
      itemRechargesAt = 0;
      setItemReady(true);
      announce('The Power Sandwich is ready to use again!');
    }
  }

  let dx = 0;
  let dy = 0;
  if (isHeld('left')) dx -= 1;
  if (isHeld('right')) dx += 1;
  if (isHeld('up')) dy -= 1;
  if (isHeld('down')) dy += 1;

  const isMoving = dx !== 0 || dy !== 0;
  if (isMoving) {
    const length = Math.hypot(dx, dy);
    const movementX = (dx / length) * SPEED * speedMultiplier * deltaTime;
    const movementY = (dy / length) * SPEED * speedMultiplier * deltaTime;
    movePlayerWithCollisions(movementX, movementY);

    if (dx < 0 && dy < 0) player.direction = 'upLeft';
    else if (dx > 0 && dy < 0) player.direction = 'upRight';
    else if (dx < 0 && dy > 0) player.direction = 'downLeft';
    else if (dx > 0 && dy > 0) player.direction = 'downRight';
    else if (dx < 0) player.direction = 'left';
    else if (dx > 0) player.direction = 'right';
    else if (dy < 0) player.direction = 'up';
    else player.direction = 'down';

    player.animationTime += deltaTime;
    player.frame = Math.floor(player.animationTime * 11) % FRAME_COUNT;
  } else {
    player.animationTime = 0;
    player.frame = 0;
  }
}

function movePlayerWithCollisions(movementX, movementY) {
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(movementX), Math.abs(movementY)) / 4));
  const stepX = movementX / steps;
  const stepY = movementY / steps;

  for (let step = 0; step < steps; step += 1) {
    const nextX = clampX(player.x + stepX);
    if (!playerCollidesAt(nextX, player.y)) player.x = nextX;

    const nextY = clampY(player.y + stepY);
    if (!playerCollidesAt(player.x, nextY)) player.y = nextY;
  }
}

function playerCollidesAt(x, y) {
  const footHalfWidth = Math.max(4, FRAME_WIDTH * SCALE * 0.3);
  const left = x - footHalfWidth;
  const right = x + footHalfWidth;
  const top = y - Math.max(4, FRAME_HEIGHT * SCALE * 0.18);
  const bottom = y;

  return forEachBucket(left, top, right, bottom, (key) => {
    const shapes = collisionBuckets.get(key);
    if (!shapes) return false;

    for (const [shapeX, shapeY, shapeWidth, shapeHeight] of shapes) {
      if (
        left < shapeX + shapeWidth &&
        right > shapeX &&
        top < shapeY + shapeHeight &&
        bottom > shapeY
      ) return true;
    }

    return false;
  });
}

function drawCollisionShapes(cameraX, cameraY) {
  context.fillStyle = 'rgba(0, 92, 255, 0.62)';
  for (const [shapeX, shapeY, shapeWidth, shapeHeight] of collisionShapes) {
    if (
      shapeX + shapeWidth < cameraX ||
      shapeX > cameraX + canvas.width ||
      shapeY + shapeHeight < cameraY ||
      shapeY > cameraY + canvas.height
    ) continue;

    context.fillRect(shapeX - cameraX, shapeY - cameraY, shapeWidth, shapeHeight);
  }
}

function draw() {
  context.clearRect(0, 0, canvas.width, canvas.height);

  const playerX = player.x.toFixed(1);
  const playerY = player.y.toFixed(1);
  if (canvas.dataset.playerX !== playerX) canvas.dataset.playerX = playerX;
  if (canvas.dataset.playerY !== playerY) canvas.dataset.playerY = playerY;

  // Rounded so the map is sampled on whole source pixels: a fractional source
  // rect snaps at a browser-defined threshold and makes the player jitter
  // against the tiles by a pixel on every step.
  const cameraX = Math.round(Math.max(0, Math.min(WORLD_WIDTH - canvas.width, player.x - canvas.width / 2)));
  const cameraY = Math.round(Math.max(0, Math.min(WORLD_HEIGHT - canvas.height, player.y - canvas.height / 2)));
  context.drawImage(
    map,
    cameraX,
    cameraY,
    canvas.width,
    canvas.height,
    0,
    0,
    canvas.width,
    canvas.height,
  );

  if (SHOW_COLLISION_SHAPES) drawCollisionShapes(cameraX, cameraY);

  const sourceX = player.frame * FRAME_WIDTH;
  const sourceY = directionRows[player.direction] * FRAME_HEIGHT;
  const width = FRAME_WIDTH * SCALE;
  const height = FRAME_HEIGHT * SCALE;
  context.drawImage(
    spriteSheet,
    sourceX,
    sourceY,
    FRAME_WIDTH,
    FRAME_HEIGHT,
    Math.round(player.x - cameraX - width / 2),
    Math.round(player.y - cameraY - height),
    width,
    height,
  );
}

let previousTime = 0;
function gameLoop(time) {
  const deltaTime = previousTime === 0 ? 0 : Math.min((time - previousTime) / 1000, 0.05);
  previousTime = time;
  update(deltaTime, time);
  draw();
  requestAnimationFrame(gameLoop);
}

function loadImage(image, src) {
  return new Promise((resolve, reject) => {
    // decode() keeps the 1254x1254 map's bitmap expansion off the first frame's
    // animation callback; it is optional, so a failure there is not fatal.
    image.onload = () => resolve(image.decode?.().catch(() => {}));
    image.onerror = () => reject(new Error(`Failed to load ${src}`));
    image.src = src;
  });
}

function drawLoadFailure() {
  context.fillStyle = '#0b1c10';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#f5fff6';
  context.font = '13px monospace';
  context.textAlign = 'center';
  context.fillText('Could not load the game assets.', canvas.width / 2, canvas.height / 2);
}

Promise.all([
  loadImage(map, 'img/external/overworld.png'),
  loadImage(spriteSheet, 'example_character/SpriteSheet.png'),
])
  .then(() => {
    canvas.dataset.collisionShapes = String(collisionShapes.length);
    requestAnimationFrame(gameLoop);
  })
  .catch((error) => {
    console.error(error);
    drawLoadFailure();
  });
