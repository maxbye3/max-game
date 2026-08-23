import {
  INTERNAL_COLLISION_BITS,
  INTERNAL_COLLISION_CELL_SIZE,
  INTERNAL_COLLISION_COLUMNS,
  INTERNAL_COLLISION_ROWS,
} from './internal-collision-mask.js';

const requireElement = <T extends Element>(selector: string): T => {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing required element: ${selector}`);
  return element;
};

type Direction = 'down' | 'downRight' | 'right' | 'upRight' | 'up' | 'upLeft' | 'left' | 'downLeft';
type InputDirection = 'up' | 'down' | 'left' | 'right';

const canvas = requireElement<HTMLCanvasElement>('#game');

function requireCanvasContext(target: HTMLCanvasElement): CanvasRenderingContext2D {
  const value = target.getContext('2d');
  if (!value) throw new Error('This browser does not support the 2D canvas context.');
  return value;
}

const context = requireCanvasContext(canvas);

const WORLD_WIDTH = 1024;
const WORLD_HEIGHT = 1536;
const FRAME_WIDTH = 23;
const FRAME_HEIGHT = 36;
const FRAME_COUNT = 9;
const PLAYER_SCALE = 2;
const VIEW_SCALE = 0.5;
const SPEED = 235;
const SHOW_COLLISIONS = new URLSearchParams(window.location.search).has('collisions');

const interior = new Image();
const collisionMask = new Image();
const doorOverlay = new Image();
const spriteSheet = new Image();
interior.src = '../img/internal/diary-lab.png';
collisionMask.src = '../img/internal/diary-lab-collision.png';
doorOverlay.src = '../img/internal/diary-lab-doors-out.png';
spriteSheet.src = '../example_character/SpriteSheet.png';
const doorSound = new Audio('../audio/open-door.mp3');
doorSound.preload = 'auto';

const collisionBinary = atob(INTERNAL_COLLISION_BITS);
const collisionBits = Uint8Array.from(collisionBinary, (character) => character.charCodeAt(0));

const directionRows: Record<Direction, number> = {
  down: 0,
  downRight: 1,
  right: 2,
  upRight: 3,
  up: 4,
  upLeft: 5,
  left: 6,
  downLeft: 7,
};

const enteredDoor = new URLSearchParams(window.location.search).get('door');
const player = {
  x: enteredDoor === 'diary-lab-right' ? 718 : 306,
  y: 1125,
  direction: 'up' as Direction,
  frame: 0,
  animationTime: 0,
};

const directionCodes: Record<string, InputDirection> = {
  ArrowUp: 'up',
  KeyW: 'up',
  ArrowDown: 'down',
  KeyS: 'down',
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
};

const heldDirections = new Map<InputDirection, number>();
const heldCodes = new Set<string>();
const releaseHandlers: Array<() => void> = [];
let previousTime = 0;
let openDoorIndex: number | null = null;

const INTERIOR_DOORS = [
  {
    triggerX: 306,
    triggerY: 1190,
    sourceX: 120,
    sourceY: 30,
    sourceWidth: 560,
    sourceHeight: 650,
    x: 160,
    y: 1118,
    width: 252,
    height: 260,
  },
  {
    triggerX: 718,
    triggerY: 1190,
    sourceX: 1290,
    sourceY: 30,
    sourceWidth: 560,
    sourceHeight: 650,
    x: 616,
    y: 1118,
    width: 252,
    height: 260,
  },
] as const;
const DOOR_OPEN_DISTANCE = 105;

const isHeld = (direction: InputDirection) => heldDirections.has(direction);

function holdDirection(direction: InputDirection): void {
  heldDirections.set(direction, (heldDirections.get(direction) ?? 0) + 1);
}

function releaseDirection(direction: InputDirection): void {
  const remaining = (heldDirections.get(direction) ?? 0) - 1;
  if (remaining > 0) heldDirections.set(direction, remaining);
  else heldDirections.delete(direction);
}

function pressCode(code: string): void {
  const direction = directionCodes[code];
  if (!direction || heldCodes.has(code)) return;
  heldCodes.add(code);
  holdDirection(direction);
}

function releaseCode(code: string): void {
  const direction = directionCodes[code];
  if (!direction || !heldCodes.delete(code)) return;
  releaseDirection(direction);
}

function releaseAllInput(): void {
  heldCodes.clear();
  heldDirections.clear();
  releaseHandlers.forEach((release) => release());
}

function bindControls(): void {
  window.addEventListener('keydown', (event) => {
    if (event.ctrlKey || event.metaKey || event.altKey) {
      releaseAllInput();
      return;
    }
    if (directionCodes[event.code]) {
      event.preventDefault();
      pressCode(event.code);
    }
  });
  window.addEventListener('keyup', (event) => releaseCode(event.code));
  window.addEventListener('blur', releaseAllInput);

  document.querySelectorAll<HTMLElement>('.dpad-button').forEach((button) => {
    const directions = (button.dataset.directions ?? '').split(' ').filter(
      (value): value is InputDirection =>
        value === 'up' || value === 'down' || value === 'left' || value === 'right',
    );
    let pressed = false;

    const press = () => {
      if (pressed) return;
      pressed = true;
      directions.forEach(holdDirection);
      button.classList.add('pressed');
    };
    const release = () => {
      if (!pressed) return;
      pressed = false;
      directions.forEach(releaseDirection);
      button.classList.remove('pressed');
    };
    releaseHandlers.push(release);
    button.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      press();
      try { button.setPointerCapture(event.pointerId); } catch {}
    });
    (['pointerup', 'pointercancel', 'lostpointercapture'] as const).forEach((type) => {
      button.addEventListener(type, release);
    });
  });
}

function isCollisionPixel(x: number, y: number): boolean {
  if (x < 0 || x >= WORLD_WIDTH || y < 0 || y >= WORLD_HEIGHT) return true;
  const column = Math.floor(x / INTERNAL_COLLISION_CELL_SIZE);
  const row = Math.floor(y / INTERNAL_COLLISION_CELL_SIZE);
  if (column >= INTERNAL_COLLISION_COLUMNS || row >= INTERNAL_COLLISION_ROWS) return true;
  const cellIndex = row * INTERNAL_COLLISION_COLUMNS + column;
  const byte = collisionBits[Math.floor(cellIndex / 8)] ?? 0;
  return (byte & (1 << (cellIndex % 8))) !== 0;
}

function playerCollidesAt(x: number, y: number): boolean {
  const halfWidth = FRAME_WIDTH * PLAYER_SCALE * 0.29;
  const footHeight = FRAME_HEIGHT * PLAYER_SCALE * 0.17;
  const left = x - halfWidth;
  const right = x + halfWidth;
  const top = y - footHeight;

  for (let sampleY = top; sampleY <= y; sampleY += 3) {
    for (let sampleX = left; sampleX <= right; sampleX += 3) {
      if (isCollisionPixel(sampleX, sampleY)) return true;
    }
  }
  return isCollisionPixel(right, y);
}

function movePlayer(movementX: number, movementY: number): void {
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(movementX), Math.abs(movementY)) / 4));
  const stepX = movementX / steps;
  const stepY = movementY / steps;

  for (let step = 0; step < steps; step += 1) {
    const nextX = player.x + stepX;
    if (!playerCollidesAt(nextX, player.y)) player.x = nextX;
    const nextY = player.y + stepY;
    if (!playerCollidesAt(player.x, nextY)) player.y = nextY;
  }
}

function updatePlayer(deltaTime: number): void {
  let dx = 0;
  let dy = 0;
  if (isHeld('left')) dx -= 1;
  if (isHeld('right')) dx += 1;
  if (isHeld('up')) dy -= 1;
  if (isHeld('down')) dy += 1;

  if (dx === 0 && dy === 0) {
    player.animationTime = 0;
    player.frame = 0;
    return;
  }

  const length = Math.hypot(dx, dy);
  movePlayer((dx / length) * SPEED * deltaTime, (dy / length) * SPEED * deltaTime);

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
}

function updateDoors(): void {
  const nextOpenDoorIndex = INTERIOR_DOORS.findIndex((door) =>
    Math.hypot(player.x - door.triggerX, player.y - door.triggerY) <= DOOR_OPEN_DISTANCE,
  );
  if (nextOpenDoorIndex >= 0 && nextOpenDoorIndex !== openDoorIndex) {
    doorSound.currentTime = 0;
    void doorSound.play().catch(() => {
      // Audio can be rejected until the browser observes a keyboard or pointer gesture.
    });
  }
  openDoorIndex = nextOpenDoorIndex >= 0 ? nextOpenDoorIndex : null;
}

function draw(): void {
  const viewportWidth = canvas.width / VIEW_SCALE;
  const viewportHeight = canvas.height / VIEW_SCALE;
  const cameraX = Math.round(Math.max(0, Math.min(WORLD_WIDTH - viewportWidth, player.x - viewportWidth / 2)));
  const cameraY = Math.round(Math.max(0, Math.min(WORLD_HEIGHT - viewportHeight, player.y - viewportHeight / 2)));
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(interior, cameraX, cameraY, viewportWidth, viewportHeight, 0, 0, canvas.width, canvas.height);
  if (openDoorIndex !== null) {
    const door = INTERIOR_DOORS[openDoorIndex];
    if (door) {
      context.drawImage(
        doorOverlay,
        door.sourceX,
        door.sourceY,
        door.sourceWidth,
        door.sourceHeight,
        (door.x - cameraX) * VIEW_SCALE,
        (door.y - cameraY) * VIEW_SCALE,
        door.width * VIEW_SCALE,
        door.height * VIEW_SCALE,
      );
    }
  }
  if (SHOW_COLLISIONS) {
    context.save();
    context.globalAlpha = 0.55;
    context.drawImage(collisionMask, cameraX, cameraY, viewportWidth, viewportHeight, 0, 0, canvas.width, canvas.height);
    context.restore();
  }

  const width = FRAME_WIDTH * PLAYER_SCALE;
  const height = FRAME_HEIGHT * PLAYER_SCALE;
  context.drawImage(
    spriteSheet,
    player.frame * FRAME_WIDTH,
    directionRows[player.direction] * FRAME_HEIGHT,
    FRAME_WIDTH,
    FRAME_HEIGHT,
    Math.round((player.x - cameraX - width / 2) * VIEW_SCALE),
    Math.round((player.y - cameraY - height) * VIEW_SCALE),
    width * VIEW_SCALE,
    height * VIEW_SCALE,
  );
}

function gameLoop(time: number): void {
  const deltaTime = previousTime === 0 ? 0 : Math.min((time - previousTime) / 1000, 0.05);
  previousTime = time;
  updatePlayer(deltaTime);
  updateDoors();
  draw();
  requestAnimationFrame(gameLoop);
}

bindControls();
Promise.all([interior.decode(), collisionMask.decode(), doorOverlay.decode(), spriteSheet.decode()])
  .then(() => {
    context.imageSmoothingEnabled = false;
    requestAnimationFrame(gameLoop);
  })
  .catch((error: unknown) => {
    console.error(error);
    context.fillStyle = '#f5fff6';
    context.font = '13px monospace';
    context.fillText('Could not load the Diary Lab.', 120, 240);
  });
