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
const COLLISION_BUCKET_SIZE = 32;
const collisionBuckets = new Map();

window.COLLISION_SHAPES.forEach((shape) => {
  const [x, y, width, height] = shape;
  const firstColumn = Math.floor(x / COLLISION_BUCKET_SIZE);
  const lastColumn = Math.floor((x + width - 1) / COLLISION_BUCKET_SIZE);
  const firstRow = Math.floor(y / COLLISION_BUCKET_SIZE);
  const lastRow = Math.floor((y + height - 1) / COLLISION_BUCKET_SIZE);

  for (let row = firstRow; row <= lastRow; row += 1) {
    for (let column = firstColumn; column <= lastColumn; column += 1) {
      const bucketKey = `${column},${row}`;
      if (!collisionBuckets.has(bucketKey)) collisionBuckets.set(bucketKey, []);
      collisionBuckets.get(bucketKey).push(shape);
    }
  }
});

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
const keys = new Set();
let speedMultiplier = 1;
let speedBoostEndsAt = 0;
const movementKeys = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd']);

window.addEventListener('keydown', (event) => {
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  if (movementKeys.has(key)) event.preventDefault();
  keys.add(key);
});

window.addEventListener('keyup', (event) => {
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  keys.delete(key);
});

window.addEventListener('blur', () => keys.clear());

document.querySelectorAll('.dpad-button').forEach((button) => {
  const directions = button.dataset.directions.split(' ');

  const startMoving = (event) => {
    event.preventDefault();
    button.setPointerCapture?.(event.pointerId);
    directions.forEach((direction) => keys.add(direction));
    button.classList.add('pressed');
  };

  const stopMoving = (event) => {
    event.preventDefault();
    directions.forEach((direction) => keys.delete(direction));
    button.classList.remove('pressed');
  };

  button.addEventListener('pointerdown', startMoving);
  button.addEventListener('pointerup', stopMoving);
  button.addEventListener('pointercancel', stopMoving);
  button.addEventListener('lostpointercapture', stopMoving);
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

setItemReady(true);

function setInventoryOpen(isOpen) {
  inventoryPanel.hidden = !isOpen;
  inventoryToggle.setAttribute('aria-expanded', String(isOpen));
}

inventoryToggle.addEventListener('click', () => setInventoryOpen(inventoryPanel.hidden));
inventoryClose.addEventListener('click', () => setInventoryOpen(false));
inventoryItem.addEventListener('click', () => {
  if (!hasPowerSandwich) return;
  itemActions.hidden = !itemActions.hidden;
  inventoryItem.classList.toggle('selected', !itemActions.hidden);
  inventoryItem.setAttribute('aria-expanded', String(!itemActions.hidden));
});

useItemButton.addEventListener('click', () => {
  if (!hasPowerSandwich) return;
  hasPowerSandwich = false;
  speedMultiplier = 1.6;
  speedBoostEndsAt = performance.now() + 10000;
  itemRechargesAt = performance.now() + 20000;
  setItemReady(false);
  itemActions.hidden = true;
  inventoryMessage.textContent = 'Power Sandwich used — speed increased for 10 seconds!';
  powerupStatus.hidden = false;
});

window.addEventListener('keydown', (event) => {
  if (event.key.toLowerCase() === 'i') setInventoryOpen(inventoryPanel.hidden);
  if (event.key === 'Escape') setInventoryOpen(false);
});

function update(deltaTime) {
  const now = performance.now();
  if (!hasPowerSandwich && itemRechargesAt > 0) {
    const rechargeRemaining = Math.max(0, itemRechargesAt - now);
    const rechargeProgress = 1 - rechargeRemaining / 20000;
    rechargeFill.style.width = `${Math.max(0, rechargeProgress) * 100}%`;
    itemStatus.textContent = `Recharging ${(rechargeRemaining / 1000).toFixed(1)}s`;

    if (rechargeRemaining === 0) {
      itemRechargesAt = 0;
      setItemReady(true);
      inventoryMessage.textContent = 'The Power Sandwich is ready to use again!';
    }
  }

  if (speedBoostEndsAt > 0) {
    const secondsLeft = Math.max(0, (speedBoostEndsAt - now) / 1000);
    powerupStatus.textContent = `Speed boost ${secondsLeft.toFixed(1)}s`;
    if (secondsLeft === 0) {
      speedMultiplier = 1;
      speedBoostEndsAt = 0;
      powerupStatus.hidden = true;
      inventoryMessage.textContent = 'The speed boost has worn off.';
    }
  }

  let dx = 0;
  let dy = 0;
  if (keys.has('ArrowLeft') || keys.has('a')) dx -= 1;
  if (keys.has('ArrowRight') || keys.has('d')) dx += 1;
  if (keys.has('ArrowUp') || keys.has('w')) dy -= 1;
  if (keys.has('ArrowDown') || keys.has('s')) dy += 1;

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

  const halfWidth = (FRAME_WIDTH * SCALE) / 2;
  const spriteHeight = FRAME_HEIGHT * SCALE;
  player.x = Math.max(halfWidth, Math.min(WORLD_WIDTH - halfWidth, player.x));
  player.y = Math.max(spriteHeight, Math.min(WORLD_HEIGHT, player.y));
}

function movePlayerWithCollisions(movementX, movementY) {
  const halfWidth = (FRAME_WIDTH * SCALE) / 2;
  const spriteHeight = FRAME_HEIGHT * SCALE;
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(movementX), Math.abs(movementY)) / 4));
  const stepX = movementX / steps;
  const stepY = movementY / steps;

  for (let step = 0; step < steps; step += 1) {
    const nextX = Math.max(halfWidth, Math.min(WORLD_WIDTH - halfWidth, player.x + stepX));
    if (!playerCollidesAt(nextX, player.y)) player.x = nextX;

    const nextY = Math.max(spriteHeight, Math.min(WORLD_HEIGHT, player.y + stepY));
    if (!playerCollidesAt(player.x, nextY)) player.y = nextY;
  }
}

function playerCollidesAt(x, y) {
  const footHalfWidth = Math.max(4, FRAME_WIDTH * SCALE * 0.3);
  const footTop = y - Math.max(4, FRAME_HEIGHT * SCALE * 0.18);
  const hitbox = {
    left: x - footHalfWidth,
    right: x + footHalfWidth,
    top: footTop,
    bottom: y,
  };
  const firstColumn = Math.floor(hitbox.left / COLLISION_BUCKET_SIZE);
  const lastColumn = Math.floor(hitbox.right / COLLISION_BUCKET_SIZE);
  const firstRow = Math.floor(hitbox.top / COLLISION_BUCKET_SIZE);
  const lastRow = Math.floor(hitbox.bottom / COLLISION_BUCKET_SIZE);
  const checkedShapes = new Set();

  for (let row = firstRow; row <= lastRow; row += 1) {
    for (let column = firstColumn; column <= lastColumn; column += 1) {
      const shapes = collisionBuckets.get(`${column},${row}`) || [];
      for (const shape of shapes) {
        if (checkedShapes.has(shape)) continue;
        checkedShapes.add(shape);
        const [shapeX, shapeY, shapeWidth, shapeHeight] = shape;
        if (
          hitbox.left < shapeX + shapeWidth &&
          hitbox.right > shapeX &&
          hitbox.top < shapeY + shapeHeight &&
          hitbox.bottom > shapeY
        ) return true;
      }
    }
  }

  return false;
}

function draw() {
  context.clearRect(0, 0, canvas.width, canvas.height);
  canvas.dataset.playerX = player.x.toFixed(1);
  canvas.dataset.playerY = player.y.toFixed(1);

  const cameraX = Math.max(0, Math.min(WORLD_WIDTH - canvas.width, player.x - canvas.width / 2));
  const cameraY = Math.max(0, Math.min(WORLD_HEIGHT - canvas.height, player.y - canvas.height / 2));
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

  context.fillStyle = 'rgba(0, 92, 255, 0.62)';
  for (const [shapeX, shapeY, shapeWidth, shapeHeight] of window.COLLISION_SHAPES) {
    if (
      shapeX + shapeWidth < cameraX ||
      shapeX > cameraX + canvas.width ||
      shapeY + shapeHeight < cameraY ||
      shapeY > cameraY + canvas.height
    ) continue;

    context.fillRect(
      Math.round(shapeX - cameraX),
      Math.round(shapeY - cameraY),
      shapeWidth,
      shapeHeight,
    );
  }

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

let previousTime = performance.now();
function gameLoop(time) {
  const deltaTime = Math.min((time - previousTime) / 1000, 0.05);
  previousTime = time;
  update(deltaTime);
  draw();
  requestAnimationFrame(gameLoop);
}

Promise.all([
  new Promise((resolve) => {
    map.onload = () => {
      canvas.dataset.collisionShapes = String(window.COLLISION_SHAPES.length);
      resolve();
    };
    map.src = 'img/external/overworld.png';
  }),
  new Promise((resolve) => {
    spriteSheet.onload = resolve;
    spriteSheet.src = 'example_character/SpriteSheet.png';
  }),
]).then(() => requestAnimationFrame(gameLoop));
