import {
  INTERNAL_COLLISION_BITS,
  INTERNAL_COLLISION_CELL_SIZE,
  INTERNAL_COLLISION_COLUMNS,
  INTERNAL_COLLISION_ROWS,
} from './internal-collision-mask.js';
import { NOEL_DIALOGUE_LINES } from './noel-dialogue.js';
import { markInternalTestVisited } from './world-state.js';

const requireElement = <T extends Element>(selector: string): T => {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing required element: ${selector}`);
  return element;
};

type Direction = 'down' | 'downRight' | 'right' | 'upRight' | 'up' | 'upLeft' | 'left' | 'downLeft';
type InputDirection = 'up' | 'down' | 'left' | 'right';
type InteractionKind = 'noel' | 'diary' | 'experiments';

const canvas = requireElement<HTMLCanvasElement>('#game');
markInternalTestVisited();
const interactionPrompt = requireElement<HTMLButtonElement>('#interaction-prompt');
const noelDialogue = requireElement<HTMLElement>('#noel-dialogue');
const noelSpeaker = requireElement<HTMLElement>('#noel-speaker');
const noelDialogueLine = requireElement<HTMLElement>('#noel-dialogue-line');
const noelDialogueQuestion = requireElement<HTMLElement>('#noel-dialogue-question');
const noelDialogueOptions = requireElement<HTMLElement>('#noel-dialogue-options');
const noelDialogueClose = requireElement<HTMLButtonElement>('#noel-dialogue-close');
const noelDeclineButton = requireElement<HTMLButtonElement>('#noel-decline');
const noelReadDiaryButton = requireElement<HTMLButtonElement>('#noel-read-diary');
const noelViewExperimentsButton = requireElement<HTMLButtonElement>('#noel-view-experiments');
const diaryPanel = requireElement<HTMLElement>('#diary-panel');
const diaryUnlockForm = requireElement<HTMLFormElement>('#diary-unlock-form');
const diaryPassword = requireElement<HTMLInputElement>('#diary-password');
const diaryUnlockMessage = requireElement<HTMLElement>('#diary-unlock-message');
const diaryLink = requireElement<HTMLAnchorElement>('#diary-link');
const experimentsPanel = requireElement<HTMLElement>('#experiments-panel');
const experimentLightbox = requireElement<HTMLDialogElement>('#experiment-lightbox');
const experimentLightboxImage = requireElement<HTMLImageElement>('#experiment-lightbox-image');
const experimentLightboxClose = requireElement<HTMLButtonElement>('#experiment-lightbox-close');

function requireCanvasContext(target: HTMLCanvasElement): CanvasRenderingContext2D {
  const value = target.getContext('2d');
  if (!value) throw new Error('This browser does not support the 2D canvas context.');
  return value;
}

const context = requireCanvasContext(canvas);

const WORLD_WIDTH = 512;
const WORLD_HEIGHT = 768;
const FRAME_WIDTH = 23;
const FRAME_HEIGHT = 36;
const FRAME_COUNT = 9;
const PLAYER_SCALE = 2;
const VIEW_SCALE = 1;
const SPEED = 145;
const NOEL_FOLDER = 'chat/noel';
const NOEL_NAME = NOEL_FOLDER.slice(NOEL_FOLDER.lastIndexOf('/') + 1);
const NOEL_QUESTION = 'would you like to checkout some experiments Max is working on or his journal (this will require you to know his phone number)';
const DIARY_PHONE_NUMBERS = new Set(['2026527772', '07815437754']);
const NOEL = {
  x: WORLD_WIDTH / 2,
  y: WORLD_HEIGHT / 2 + 36,
  width: 52,
  height: 72,
} as const;
const NOEL_COLLISION_DISTANCE = 31;
const NOEL_INTERACTION_DISTANCE = 62;
const INTERACTION_TARGETS = [
  { kind: 'noel', label: 'Talk to noel', x: NOEL.x, y: NOEL.y, distance: NOEL_INTERACTION_DISTANCE },
  { kind: 'diary', label: 'See journal', x: 170, y: 466, distance: 54 },
  { kind: 'experiments', label: 'See experiments', x: 350, y: 285, distance: 54 },
] as const satisfies ReadonlyArray<{
  kind: InteractionKind;
  label: string;
  x: number;
  y: number;
  distance: number;
}>;
const SHOW_COLLISIONS = new URLSearchParams(window.location.search).has('collisions');

const interior = new Image();
const collisionMask = new Image();
const doorOverlay = new Image();
const spriteSheet = new Image();
const noelSprite = new Image();
interior.src = '../img/internal/diary-lab.png';
collisionMask.src = '../img/internal/diary-lab-collision.png';
doorOverlay.src = '../img/internal/diary-lab-doors-out.png';
spriteSheet.src = '../example_character/SpriteSheet.png';
noelSprite.src = '../chat/noel/interior-avatar.png';
const doorSound = new Audio('../audio/open-door.mp3');
doorSound.preload = 'auto';
const noelTheme = new Audio('../chat/noel/example_character/theme.mp3');
noelTheme.preload = 'auto';

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
  x: enteredDoor === 'diary-lab-right' ? 359 : 153,
  y: 563,
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
let navigationStarted = false;
let nearbyInteraction: InteractionKind | null = null;
let noelDialogueOpen = false;
let noelConversationIndex = 0;

const INTERIOR_DOORS = [
  {
    triggerX: 153,
    triggerY: 595,
    sourceX: 60,
    sourceY: 15,
    sourceWidth: 280,
    sourceHeight: 325,
    x: 80,
    y: 559,
    width: 126,
    height: 130,
  },
  {
    triggerX: 359,
    triggerY: 595,
    sourceX: 645,
    sourceY: 15,
    sourceWidth: 280,
    sourceHeight: 325,
    x: 308,
    y: 559,
    width: 126,
    height: 130,
  },
] as const;
const DOOR_OPEN_DISTANCE = 53;
const DOOR_EXIT_DISTANCE = 18;

const isHeld = (direction: InputDirection) => heldDirections.has(direction);

function holdDirection(direction: InputDirection): void {
  if (noelDialogueOpen) return;
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

function finishNoelIntroduction(): void {
  noelDialogueQuestion.textContent = NOEL_QUESTION;
  noelDialogueQuestion.hidden = false;
  noelDialogueOptions.hidden = false;
}

function resetDiaryPanel(): void {
  diaryUnlockForm.reset();
  diaryUnlockMessage.textContent = '';
  diaryUnlockMessage.classList.remove('success');
  diaryLink.hidden = true;
}

function hideNoelFeaturePanels(): void {
  diaryPanel.hidden = true;
  experimentsPanel.hidden = true;
  if (experimentLightbox.open) experimentLightbox.close();
  experimentLightboxImage.removeAttribute('src');
  experimentLightboxImage.alt = '';
  resetDiaryPanel();
}

function openDiaryPanel(): void {
  noelDialogue.hidden = true;
  experimentsPanel.hidden = true;
  resetDiaryPanel();
  diaryPanel.hidden = false;
  diaryPassword.focus();
}

function openExperimentsPanel(): void {
  noelDialogue.hidden = true;
  diaryPanel.hidden = true;
  experimentsPanel.hidden = false;
}

function unlockDiary(event: SubmitEvent): void {
  event.preventDefault();
  const phoneNumber = diaryPassword.value.replace(/\D/g, '');
  if (!DIARY_PHONE_NUMBERS.has(phoneNumber)) {
    diaryUnlockMessage.textContent = "That isn't Max's phone number.";
    diaryUnlockMessage.classList.remove('success');
    diaryLink.hidden = true;
    diaryPassword.select();
    return;
  }

  diaryUnlockMessage.textContent = 'Diary unlocked.';
  diaryUnlockMessage.classList.add('success');
  diaryLink.hidden = false;
  diaryLink.focus();
}

function openExperimentImage(button: HTMLElement): void {
  const source = button.dataset.experimentSrc;
  const thumbnail = button.querySelector<HTMLImageElement>('img');
  if (!source || !thumbnail) return;
  experimentLightboxImage.src = source;
  experimentLightboxImage.alt = thumbnail.alt;
  experimentLightbox.showModal();
}

function closeNoelDialogue(): void {
  noelDialogueOpen = false;
  noelDialogue.hidden = true;
  noelDialogueOptions.hidden = true;
  hideNoelFeaturePanels();
  noelTheme.pause();
  noelTheme.currentTime = 0;
  noelTheme.onended = null;
  interactionPrompt.hidden = nearbyInteraction === null;
}

function startNoelDialogue(): void {
  if (nearbyInteraction !== 'noel' || noelDialogueOpen) return;
  releaseAllInput();
  noelDialogueOpen = true;
  noelSpeaker.textContent = NOEL_NAME;
  noelDialogueLine.textContent = NOEL_DIALOGUE_LINES[noelConversationIndex % NOEL_DIALOGUE_LINES.length] ?? '';
  noelConversationIndex += 1;
  noelDialogueQuestion.hidden = true;
  noelDialogueOptions.hidden = true;
  noelDialogue.hidden = false;
  interactionPrompt.hidden = true;

  noelTheme.pause();
  noelTheme.currentTime = 0;
  noelTheme.onended = finishNoelIntroduction;
  void noelTheme.play().catch(finishNoelIntroduction);
}

function startFeatureInteraction(kind: 'diary' | 'experiments'): void {
  if (noelDialogueOpen) return;
  releaseAllInput();
  noelDialogueOpen = true;
  interactionPrompt.hidden = true;
  if (kind === 'diary') openDiaryPanel();
  else openExperimentsPanel();
}

function activateNearbyInteraction(): void {
  if (nearbyInteraction === 'noel') startNoelDialogue();
  else if (nearbyInteraction === 'diary' || nearbyInteraction === 'experiments') {
    startFeatureInteraction(nearbyInteraction);
  }
}

function bindControls(): void {
  window.addEventListener('keydown', (event) => {
    if (event.ctrlKey || event.metaKey || event.altKey) {
      releaseAllInput();
      return;
    }
    if (event.code === 'Escape' && noelDialogueOpen) {
      event.preventDefault();
      if (experimentLightbox.open) {
        experimentLightbox.close();
        return;
      }
      closeNoelDialogue();
      return;
    }
    if ((event.code === 'KeyE' || event.code === 'Enter' || event.code === 'Space') && nearbyInteraction) {
      event.preventDefault();
      activateNearbyInteraction();
      return;
    }
    if (directionCodes[event.code]) {
      event.preventDefault();
      pressCode(event.code);
    }
  });
  window.addEventListener('keyup', (event) => releaseCode(event.code));
  window.addEventListener('blur', releaseAllInput);
  interactionPrompt.addEventListener('click', activateNearbyInteraction);
  noelDialogueClose.addEventListener('click', closeNoelDialogue);
  noelDeclineButton.addEventListener('click', closeNoelDialogue);
  noelReadDiaryButton.addEventListener('click', openDiaryPanel);
  noelViewExperimentsButton.addEventListener('click', openExperimentsPanel);
  diaryUnlockForm.addEventListener('submit', unlockDiary);
  document.querySelectorAll<HTMLElement>('.internal-feature-close').forEach((button) => {
    button.addEventListener('click', closeNoelDialogue);
  });
  document.querySelectorAll<HTMLElement>('[data-experiment-src]').forEach((button) => {
    button.addEventListener('click', () => openExperimentImage(button));
  });
  experimentLightboxClose.addEventListener('click', () => experimentLightbox.close());
  experimentLightbox.addEventListener('click', (event) => {
    if (event.target === experimentLightbox) experimentLightbox.close();
  });

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
  if (Math.hypot(x - NOEL.x, y - NOEL.y) < NOEL_COLLISION_DISTANCE) return true;
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
  if (noelDialogueOpen) return;
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

function updateNearbyInteraction(): void {
  const target = INTERACTION_TARGETS
    .map((interaction) => ({
      ...interaction,
      playerDistance: Math.hypot(player.x - interaction.x, player.y - interaction.y),
    }))
    .filter((interaction) => interaction.playerDistance <= interaction.distance)
    .sort((first, second) => first.playerDistance - second.playerDistance)[0];
  const nextInteraction = target?.kind ?? null;
  if (nextInteraction === nearbyInteraction) return;
  nearbyInteraction = nextInteraction;
  if (target) interactionPrompt.textContent = target.label;
  interactionPrompt.hidden = !target || noelDialogueOpen;
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

  if (navigationStarted) return;
  const exitDoor = INTERIOR_DOORS.find((door) =>
    Math.hypot(player.x - door.triggerX, player.y - door.triggerY) <= DOOR_EXIT_DISTANCE,
  );
  if (!exitDoor) return;

  navigationStarted = true;
  const returnDoor = enteredDoor ? `?door=${encodeURIComponent(enteredDoor)}` : '';
  window.location.assign(`../index.html${returnDoor}`);
}

function draw(): void {
  const viewportWidth = canvas.width / VIEW_SCALE;
  const viewportHeight = canvas.height / VIEW_SCALE;
  const cameraX = Math.round(Math.max(0, Math.min(WORLD_WIDTH - viewportWidth, player.x - viewportWidth / 2)));
  const cameraY = Math.round(Math.max(0, Math.min(WORLD_HEIGHT - viewportHeight, player.y - viewportHeight / 2)));
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(interior, cameraX, cameraY, viewportWidth, viewportHeight, 0, 0, canvas.width, canvas.height);
  context.drawImage(
    noelSprite,
    Math.round((NOEL.x - cameraX - NOEL.width / 2) * VIEW_SCALE),
    Math.round((NOEL.y - cameraY - NOEL.height) * VIEW_SCALE),
    NOEL.width * VIEW_SCALE,
    NOEL.height * VIEW_SCALE,
  );
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
}

function gameLoop(time: number): void {
  const deltaTime = previousTime === 0 ? 0 : Math.min((time - previousTime) / 1000, 0.05);
  previousTime = time;
  updatePlayer(deltaTime);
  updateNearbyInteraction();
  updateDoors();
  draw();
  requestAnimationFrame(gameLoop);
}

bindControls();
Promise.all([interior.decode(), collisionMask.decode(), doorOverlay.decode(), spriteSheet.decode(), noelSprite.decode()])
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
