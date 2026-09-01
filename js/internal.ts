import {
  INTERNAL_COLLISION_BITS,
  INTERNAL_COLLISION_CELL_SIZE,
  INTERNAL_COLLISION_COLUMNS,
  INTERNAL_COLLISION_ROWS,
} from './internal-collision-mask.js';
import {
  CINEMA_COLLISION_BITS,
  CINEMA_COLLISION_CELL_SIZE,
  CINEMA_COLLISION_COLUMNS,
  CINEMA_COLLISION_ROWS,
} from './cinema-collision-mask.js';
import {
  MUSIC_HOUSE_COLLISION_BITS,
  MUSIC_HOUSE_COLLISION_CELL_SIZE,
  MUSIC_HOUSE_COLLISION_COLUMNS,
  MUSIC_HOUSE_COLLISION_ROWS,
} from './music-house-collision-mask.js';
import { CAVE_DOOR_ID, drawColander, hasCaveColander, setCaveColanderHeld } from './colander.js';
import { NOEL_DIALOGUE_LINES } from './noel-dialogue.js';
import { markInternalTestVisited } from './world-state.js';

const requireElement = <T extends Element>(selector: string): T => {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing required element: ${selector}`);
  return element;
};

type Direction = 'down' | 'downRight' | 'right' | 'upRight' | 'up' | 'upLeft' | 'left' | 'downLeft';
type InputDirection = 'up' | 'down' | 'left' | 'right';
type InteractionKind = 'noel' | 'diary' | 'experiments' | 'colander';

const canvas = requireElement<HTMLCanvasElement>('#game');
markInternalTestVisited();
const searchParams = new URLSearchParams(window.location.search);
const SEAL_MODE = searchParams.has('seal');
const interactionPrompt = requireElement<HTMLButtonElement>('#interaction-prompt');
const noelDialogue = requireElement<HTMLElement>('#noel-dialogue');
const noelSpeaker = requireElement<HTMLElement>('#noel-speaker');
const noelDialogueLine = requireElement<HTMLElement>('#noel-dialogue-line');
const noelDialogueNext = requireElement<HTMLButtonElement>('#noel-dialogue-next');
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
const interiorExit = document.querySelector<HTMLAnchorElement>('.interior-exit');

function requireCanvasContext(target: HTMLCanvasElement): CanvasRenderingContext2D {
  const value = target.getContext('2d');
  if (!value) throw new Error('This browser does not support the 2D canvas context.');
  return value;
}

const context = requireCanvasContext(canvas);

const FRAME_WIDTH = 23;
const FRAME_HEIGHT = 36;
const FRAME_COUNT = SEAL_MODE ? 8 : 9;
const PLAYER_SCALE = 2;
const SEAL_RENDER_WIDTH = 40;
const SEAL_RENDER_HEIGHT = 52;
const SEAL_BASELINE_OFFSET = 6;
const VIEW_SCALE = 1;
const SPEED = 145;
const CAVE_WIDTH = 1280;
const CAVE_HEIGHT = 640;
const DEFAULT_INTERIOR_WIDTH = 512;
const DEFAULT_INTERIOR_HEIGHT = 768;
const MUSIC_SHOP_SOURCE_SCALE = 2;
const MUSIC_SHOP_WIDTH = 543;
const MUSIC_SHOP_HEIGHT = 724;
const NOEL_FOLDER = 'chat/noel';
const NOEL_NAME = NOEL_FOLDER.slice(NOEL_FOLDER.lastIndexOf('/') + 1);
const NOEL_QUESTION = 'would you like to checkout some experiments Max is working on or his journal (this will require you to know his phone number)';
const CINEMA_AUDIENCE_DIALOGUE_INDEX_KEY = 'max-game:cinema-audience-dialogue-index';
const CINEMA_AUDIENCE_LINES = [
  'Shhh!',
  "The film's on.",
  "This is where it gets good.",
  'I need to pee.',
  'Got any popcorn?',
  'This film is long.',
  'Is that Nicolas Cage?',
  'Move your head.',
  "You're blocking the screen.",
  'What did they say?',
  "Wait, who's that?",
  "Who's the bad guy again?",
  'No spoilers!',
  'Have you seen this before?',
  'This bit is scary.',
  'That was disgusting.',
  'That was actually pretty funny.',
  'This film is weird.',
  'I have no idea what\'s happening.',
  "I'm so confused.",
  'How long is left?',
  "I'm getting tired.",
  'Can you pass the popcorn?',
  "You've eaten all the popcorn.",
  'Got any sweets?',
  'Stop rustling the bag.',
  'Turn your phone off.',
  'That screen is so bright.',
  'Why is everyone laughing?',
  "That wasn't funny.",
  "There's no way he'd survive that.",
  'That makes absolutely no sense.',
  'Why would you go in there?',
  "Don't open the door!",
  'Behind you!',
  'Run!',
  "He's definitely dead.",
  "She's definitely not dead.",
  'Called it.',
  'Oh come on.',
  'That was brutal.',
  'This soundtrack is great.',
  'I think someone kicked my chair.',
  'Stop kicking my chair.',
  "I'm going to the toilet.",
  'Tell me what I miss.',
  'You missed the best bit.',
  "He's obviously evil.",
  'Is there a post-credit scene?',
  "That's it?",
] as const;
const CINEMA_AUDIENCE_INTERACTION_DISTANCE = 78;
const CINEMA_AUDIENCE = [
  { x: 153, y: 373 },
  { x: 207, y: 375 },
  { x: 262, y: 373 },
  { x: 153, y: 440 },
  { x: 207, y: 441 },
  { x: 262, y: 440 },
] as const;
const DIARY_PHONE_NUMBERS = new Set(['2026527772', '07815437754']);
const NOEL = {
  x: DEFAULT_INTERIOR_WIDTH / 2,
  y: DEFAULT_INTERIOR_HEIGHT / 2 + 36,
  width: 52,
  height: 72,
} as const;
const NOEL_COLLISION_DISTANCE = 31;
const NOEL_INTERACTION_DISTANCE = 62;
const CAVE_COLANDER = {
  x: 1035,
  y: 584,
  eraseX: 972,
  eraseY: 535,
  eraseWidth: 125,
  eraseHeight: 92,
} as const;
const CAVE_WALLS = [
  [0, 0, CAVE_WIDTH, 93],
  [0, 0, 132, CAVE_HEIGHT],
  [1147, 0, 133, CAVE_HEIGHT],
] as const;
const SHOW_COLLISIONS = searchParams.has('collisions');
const enteredDoor = searchParams.get('door');
const isCinemaInterior = enteredDoor === 'cinema';
const isMusicShopInterior = enteredDoor === 'music-shop';
const isCaveInterior = enteredDoor === CAVE_DOOR_ID || enteredDoor === 'cave';
const isDiaryLabInterior = !isCinemaInterior && !isMusicShopInterior && !isCaveInterior;
if (isMusicShopInterior) {
  document.title = 'Music House';
  canvas.setAttribute('aria-label', 'Music House interior');
}
const WORLD_WIDTH = isCaveInterior
  ? CAVE_WIDTH
  : isMusicShopInterior
    ? MUSIC_SHOP_WIDTH
    : DEFAULT_INTERIOR_WIDTH;
const WORLD_HEIGHT = isCaveInterior
  ? CAVE_HEIGHT
  : isMusicShopInterior
    ? MUSIC_SHOP_HEIGHT
    : DEFAULT_INTERIOR_HEIGHT;
const INTERACTION_TARGETS = [
  ...(isCaveInterior
    ? [{ kind: 'colander', label: 'Pick up colander', x: CAVE_COLANDER.x, y: CAVE_COLANDER.y, distance: 78 } as const]
    : isDiaryLabInterior
      ? [
        { kind: 'noel', label: 'Talk to noel', x: NOEL.x, y: NOEL.y, distance: NOEL_INTERACTION_DISTANCE },
        { kind: 'diary', label: 'See journal', x: 170, y: 466, distance: 54 },
        { kind: 'experiments', label: 'See experiments', x: 350, y: 285, distance: 54 },
        ] as const
      : []),
] as const satisfies ReadonlyArray<{
  kind: InteractionKind;
  label: string;
  x: number;
  y: number;
  distance: number;
}>;

const interior = new Image();
const collisionMask = new Image();
const doorOverlay = new Image();
const spriteSheet = new Image();
const noelSprite = new Image();
interior.src = isCaveInterior
  ? '../img/internal/cave.jpg?v=20260825-colander-cave'
  : isCinemaInterior
    ? '../img/internal/cinema.png?v=20260831-six-seat-audience'
    : isMusicShopInterior
      ? '../img/internal/internal-music.png?v=20260831-interior'
      : '../img/internal/diary-lab.png';
if (!isMusicShopInterior && !isCaveInterior) {
  collisionMask.src = isCinemaInterior
    ? '../img/internal/cinema-collisions.png?v=20260831-no-bottom-bench'
    : '../img/internal/diary-lab-collision.png';
  doorOverlay.src = isCinemaInterior
    ? '../img/internal/cinema-open-door.png'
    : '../img/internal/diary-lab-doors-out.png';
}
spriteSheet.src = SEAL_MODE
  ? '../player/seal-game.png?v=20260831-transparent'
  : '../player/SpriteSheet.png';
noelSprite.src = '../chat/noel/interior-avatar.png';
const doorSound = new Audio('../audio/open-door.mp3');
doorSound.preload = 'auto';
const noelTheme = new Audio('../chat/noel/player/theme.mp3');
noelTheme.preload = 'auto';

const collisionCellSize = isMusicShopInterior
  ? MUSIC_HOUSE_COLLISION_CELL_SIZE
  : isCinemaInterior
    ? CINEMA_COLLISION_CELL_SIZE
    : INTERNAL_COLLISION_CELL_SIZE;
const collisionColumns = isMusicShopInterior
  ? MUSIC_HOUSE_COLLISION_COLUMNS
  : isCinemaInterior
    ? CINEMA_COLLISION_COLUMNS
    : INTERNAL_COLLISION_COLUMNS;
const collisionRows = isMusicShopInterior
  ? MUSIC_HOUSE_COLLISION_ROWS
  : isCinemaInterior
    ? CINEMA_COLLISION_ROWS
    : INTERNAL_COLLISION_ROWS;
const collisionBinary = atob(
  isMusicShopInterior
    ? MUSIC_HOUSE_COLLISION_BITS
    : isCinemaInterior
      ? CINEMA_COLLISION_BITS
      : INTERNAL_COLLISION_BITS,
);
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
const SEAL_FRAME_X = [0, 130, 254, 380, 506, 630, 754, 881] as const;
const SEAL_FRAME_WIDTH = [130, 124, 126, 126, 124, 124, 127, 126] as const;
const SEAL_ROW_Y = [0, 162, 323, 486, 646, 805, 970, 1134, 1290] as const;
const SEAL_ROW_HEIGHT = [162, 161, 163, 160, 159, 165, 164, 156, 164] as const;

const player = {
  x: isCaveInterior
    ? 640
    : isCinemaInterior
      ? 256
      : isMusicShopInterior
        ? 272
        : enteredDoor === 'diary-lab-right'
          ? 359
          : 153,
  y: isCaveInterior ? 180 : isCinemaInterior ? 650 : isMusicShopInterior ? 625 : 563,
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
let nearbyCinemaAudienceIndex: number | null = null;
let noelDialogueOpen = false;
let noelDialogueFollowsProximity = false;
let noelDialogueLineIndex = 0;
let fallbackCinemaAudienceDialogueIndex = 0;

const DIARY_LAB_DOORS = [
  {
    triggerX: 153,
    triggerY: 595,
    exitX: 153,
    exitY: 650,
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
    exitX: 359,
    exitY: 650,
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
const CINEMA_DOORS = [
  {
    triggerX: 256,
    triggerY: 700,
    exitX: 256,
    exitY: 700,
    sourceX: 0,
    sourceY: 0,
    sourceWidth: 1246,
    sourceHeight: 1262,
    x: 194,
    y: 564,
    width: 124,
    height: 126,
  },
] as const;
const CAVE_DOORS = [
  {
    triggerX: 640,
    triggerY: 116,
    exitX: 640,
    exitY: 116,
    sourceX: 0,
    sourceY: 0,
    sourceWidth: 1,
    sourceHeight: 1,
    x: 630,
    y: 92,
    width: 20,
    height: 32,
  },
] as const;
const MUSIC_SHOP_DOORS = [
  {
    triggerX: 272,
    triggerY: 660,
    exitX: 272,
    exitY: 682,
    sourceX: 0,
    sourceY: 0,
    sourceWidth: 1,
    sourceHeight: 1,
    x: 272,
    y: 660,
    width: 1,
    height: 1,
  },
] as const;
const INTERIOR_DOORS = isCaveInterior
  ? CAVE_DOORS
  : isCinemaInterior
    ? CINEMA_DOORS
    : isMusicShopInterior
      ? MUSIC_SHOP_DOORS
      : DIARY_LAB_DOORS;
const DOOR_OPEN_DISTANCE = 53;
const DOOR_EXIT_DISTANCE = 18;
const DOOR_PASSAGE_HALF_WIDTH = 24;
const DOOR_PASSAGE_TOP_OFFSET = 30;
const DOOR_PASSAGE_BOTTOM_OFFSET = 24;
let caveColanderHeld = hasCaveColander();

function syncInteriorExitLink(): void {
  if (!interiorExit || !enteredDoor) return;
  const params = new URLSearchParams({ door: enteredDoor });
  if (isCaveInterior && caveColanderHeld) params.set('colander', '1');
  if (SEAL_MODE) params.set('seal', '1');
  interiorExit.href = `../index.html?${params.toString()}`;
}

const isHeld = (direction: InputDirection) => heldDirections.has(direction);

function holdDirection(direction: InputDirection): void {
  if (noelDialogueOpen && !noelDialogueFollowsProximity) return;
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
  noelDialogueNext.hidden = true;
  noelDialogueQuestion.textContent = NOEL_QUESTION;
  noelDialogueQuestion.hidden = false;
  noelDialogueOptions.hidden = false;
}

function showNoelDialogueLine(): void {
  noelDialogueLine.textContent = NOEL_DIALOGUE_LINES[noelDialogueLineIndex] ?? '';
  noelDialogueNext.hidden = false;
}

function showNextNoelDialogueLine(): void {
  if (!noelDialogueOpen) return;
  if (noelDialogueLineIndex < NOEL_DIALOGUE_LINES.length - 1) {
    noelDialogueLineIndex += 1;
    showNoelDialogueLine();
    return;
  }
  finishNoelIntroduction();
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
  noelDialogueFollowsProximity = false;
  noelDialogueNext.hidden = true;
  noelDialogue.hidden = true;
  experimentsPanel.hidden = true;
  resetDiaryPanel();
  diaryPanel.hidden = false;
  diaryPassword.focus();
}

function openExperimentsPanel(): void {
  noelDialogueFollowsProximity = false;
  noelDialogueNext.hidden = true;
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
  noelDialogueFollowsProximity = false;
  noelDialogue.hidden = true;
  noelDialogueNext.hidden = true;
  noelDialogueOptions.hidden = true;
  hideNoelFeaturePanels();
  noelTheme.pause();
  noelTheme.currentTime = 0;
  noelTheme.onended = null;
  interactionPrompt.hidden = nearbyInteraction === null;
}

function startNoelDialogue(): void {
  if (nearbyInteraction !== 'noel' || noelDialogueOpen) return;
  noelDialogueOpen = true;
  noelDialogueFollowsProximity = true;
  noelDialogueLineIndex = 0;
  noelSpeaker.textContent = NOEL_NAME;
  showNoelDialogueLine();
  noelDialogueQuestion.hidden = true;
  noelDialogueOptions.hidden = true;
  noelDialogue.hidden = false;
  interactionPrompt.hidden = true;

  noelTheme.pause();
  noelTheme.currentTime = 0;
  noelTheme.onended = null;
  void noelTheme.play().catch(() => {
    // Browsers may reject audio until a real keyboard or pointer gesture.
  });
}

function loadCinemaAudienceDialogueIndex(): number {
  try {
    const storedIndex = Number.parseInt(
      window.localStorage.getItem(CINEMA_AUDIENCE_DIALOGUE_INDEX_KEY) ?? '0',
      10,
    );
    return Number.isFinite(storedIndex) && storedIndex >= 0
      ? storedIndex % CINEMA_AUDIENCE_LINES.length
      : 0;
  } catch {
    return fallbackCinemaAudienceDialogueIndex;
  }
}

function saveCinemaAudienceDialogueIndex(index: number): void {
  fallbackCinemaAudienceDialogueIndex = index;
  try {
    window.localStorage.setItem(CINEMA_AUDIENCE_DIALOGUE_INDEX_KEY, String(index));
  } catch {
    // The audience still cycles for this visit when storage is unavailable.
  }
}

function startCinemaAudienceDialogue(): void {
  if (!isCinemaInterior || nearbyCinemaAudienceIndex === null || noelDialogueOpen) return;
  const dialogueIndex = loadCinemaAudienceDialogueIndex();
  saveCinemaAudienceDialogueIndex((dialogueIndex + 1) % CINEMA_AUDIENCE_LINES.length);
  noelDialogueOpen = true;
  noelDialogueFollowsProximity = true;
  noelSpeaker.textContent = 'cinema audience';
  noelDialogueLine.textContent = CINEMA_AUDIENCE_LINES[dialogueIndex] ?? '';
  noelDialogueNext.hidden = true;
  noelDialogueQuestion.hidden = true;
  noelDialogueOptions.hidden = true;
  noelDialogue.hidden = false;
  interactionPrompt.hidden = true;
}

function startFeatureInteraction(kind: 'diary' | 'experiments'): void {
  if (noelDialogueOpen) return;
  releaseAllInput();
  noelDialogueOpen = true;
  noelDialogueFollowsProximity = false;
  interactionPrompt.hidden = true;
  if (kind === 'diary') openDiaryPanel();
  else openExperimentsPanel();
}

function startColanderPickup(): void {
  if (!isCaveInterior || noelDialogueOpen || caveColanderHeld) return;
  releaseAllInput();
  caveColanderHeld = true;
  setCaveColanderHeld();
  syncInteriorExitLink();
  nearbyInteraction = null;
  noelDialogueOpen = true;
  noelDialogueFollowsProximity = false;
  noelSpeaker.textContent = 'THE GIRLS';
  noelDialogueLine.textContent = 'PUT THAT DOWN NOW';
  noelDialogueNext.hidden = true;
  noelDialogueQuestion.hidden = true;
  noelDialogueOptions.hidden = true;
  noelDialogue.hidden = false;
  interactionPrompt.hidden = true;
}

function activateNearbyInteraction(): void {
  if (nearbyInteraction === 'noel') startNoelDialogue();
  else if (nearbyInteraction === 'diary' || nearbyInteraction === 'experiments') {
    startFeatureInteraction(nearbyInteraction);
  } else if (nearbyInteraction === 'colander') {
    startColanderPickup();
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
  noelDialogueNext.addEventListener('click', showNextNoelDialogueLine);
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
  const openDoor = openDoorIndex === null ? null : INTERIOR_DOORS[openDoorIndex];
  if (
    !isCaveInterior &&
    openDoor &&
    x >= openDoor.triggerX - DOOR_PASSAGE_HALF_WIDTH &&
    x <= openDoor.triggerX + DOOR_PASSAGE_HALF_WIDTH &&
    y >= openDoor.triggerY - DOOR_PASSAGE_TOP_OFFSET &&
    y <= openDoor.exitY + DOOR_PASSAGE_BOTTOM_OFFSET
  ) {
    return false;
  }
  if (isCaveInterior) {
    return CAVE_WALLS.some(([wallX, wallY, wallWidth, wallHeight]) =>
      x >= wallX &&
      x < wallX + wallWidth &&
      y >= wallY &&
      y < wallY + wallHeight,
    );
  }
  const column = Math.floor(x / collisionCellSize);
  const row = Math.floor(y / collisionCellSize);
  if (column >= collisionColumns || row >= collisionRows) return true;
  const cellIndex = row * collisionColumns + column;
  const byte = collisionBits[Math.floor(cellIndex / 8)] ?? 0;
  return (byte & (1 << (cellIndex % 8))) !== 0;
}

function playerCollidesAt(x: number, y: number): boolean {
  if (isDiaryLabInterior && Math.hypot(x - NOEL.x, y - NOEL.y) < NOEL_COLLISION_DISTANCE) return true;
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
  if (noelDialogueOpen && !noelDialogueFollowsProximity) return;
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
  if (isCaveInterior && caveColanderHeld) {
    nearbyInteraction = null;
    interactionPrompt.hidden = true;
    return;
  }

  if (isCinemaInterior) {
    nearbyInteraction = null;
    interactionPrompt.hidden = true;
    const nextAudienceIndex = CINEMA_AUDIENCE
      .map((audienceMember, index) => ({
        index,
        distance: Math.hypot(player.x - audienceMember.x, player.y - audienceMember.y),
      }))
      .filter(({ distance }) => distance <= CINEMA_AUDIENCE_INTERACTION_DISTANCE)
      .sort((first, second) => first.distance - second.distance)[0]?.index ?? null;
    if (nextAudienceIndex === nearbyCinemaAudienceIndex) return;
    const previousAudienceIndex = nearbyCinemaAudienceIndex;
    nearbyCinemaAudienceIndex = nextAudienceIndex;
    if (
      previousAudienceIndex !== null &&
      noelDialogueOpen &&
      noelDialogueFollowsProximity
    ) {
      closeNoelDialogue();
    }
    if (nextAudienceIndex !== null) startCinemaAudienceDialogue();
    return;
  }
  const target = INTERACTION_TARGETS
    .map((interaction) => ({
      ...interaction,
      playerDistance: Math.hypot(player.x - interaction.x, player.y - interaction.y),
    }))
    .filter((interaction) => interaction.playerDistance <= interaction.distance)
    .sort((first, second) => first.playerDistance - second.playerDistance)[0];
  const nextInteraction = target?.kind ?? null;
  if (nextInteraction === nearbyInteraction) return;
  const previousInteraction = nearbyInteraction;
  nearbyInteraction = nextInteraction;
  if (
    previousInteraction === 'noel' &&
    nextInteraction !== 'noel' &&
    noelDialogueOpen &&
    noelDialogueFollowsProximity
  ) {
    closeNoelDialogue();
  }
  if (nextInteraction === 'noel') {
    startNoelDialogue();
    return;
  }
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
    Math.hypot(player.x - door.exitX, player.y - door.exitY) <= DOOR_EXIT_DISTANCE,
  );
  if (!exitDoor) return;

  navigationStarted = true;
  const returnParams = new URLSearchParams();
  if (enteredDoor) returnParams.set('door', enteredDoor);
  if (isCaveInterior && caveColanderHeld) returnParams.set('colander', '1');
  if (SEAL_MODE) returnParams.set('seal', '1');
  const returnSearch = returnParams.size > 0 ? `?${returnParams.toString()}` : '';
  window.location.assign(`../index.html${returnSearch}`);
}

function draw(): void {
  const viewportWidth = canvas.width / VIEW_SCALE;
  const viewportHeight = canvas.height / VIEW_SCALE;
  const cameraX = Math.round(Math.max(0, Math.min(WORLD_WIDTH - viewportWidth, player.x - viewportWidth / 2)));
  const cameraY = Math.round(Math.max(0, Math.min(WORLD_HEIGHT - viewportHeight, player.y - viewportHeight / 2)));
  context.clearRect(0, 0, canvas.width, canvas.height);
  const interiorSourceScale = isMusicShopInterior ? MUSIC_SHOP_SOURCE_SCALE : 1;
  context.drawImage(
    interior,
    cameraX * interiorSourceScale,
    cameraY * interiorSourceScale,
    viewportWidth * interiorSourceScale,
    viewportHeight * interiorSourceScale,
    0,
    0,
    canvas.width,
    canvas.height,
  );
  if (isCaveInterior && caveColanderHeld) {
    context.fillStyle = '#0b0d0d';
    context.fillRect(
      (CAVE_COLANDER.eraseX - cameraX) * VIEW_SCALE,
      (CAVE_COLANDER.eraseY - cameraY) * VIEW_SCALE,
      CAVE_COLANDER.eraseWidth * VIEW_SCALE,
      CAVE_COLANDER.eraseHeight * VIEW_SCALE,
    );
  }

  if (isDiaryLabInterior) {
    context.drawImage(
      noelSprite,
      Math.round((NOEL.x - cameraX - NOEL.width / 2) * VIEW_SCALE),
      Math.round((NOEL.y - cameraY - NOEL.height) * VIEW_SCALE),
      NOEL.width * VIEW_SCALE,
      NOEL.height * VIEW_SCALE,
    );
  }
  if (SHOW_COLLISIONS) {
    context.save();
    context.globalAlpha = 0.55;
    if (isCaveInterior) {
      context.fillStyle = '#005cff';
      for (const [wallX, wallY, wallWidth, wallHeight] of CAVE_WALLS) {
        context.fillRect(
          (wallX - cameraX) * VIEW_SCALE,
          (wallY - cameraY) * VIEW_SCALE,
          wallWidth * VIEW_SCALE,
          wallHeight * VIEW_SCALE,
        );
      }
    } else if (isMusicShopInterior) {
      context.fillStyle = '#005cff';
      const firstColumn = Math.max(0, Math.floor(cameraX / collisionCellSize));
      const lastColumn = Math.min(collisionColumns - 1, Math.ceil((cameraX + viewportWidth) / collisionCellSize));
      const firstRow = Math.max(0, Math.floor(cameraY / collisionCellSize));
      const lastRow = Math.min(collisionRows - 1, Math.ceil((cameraY + viewportHeight) / collisionCellSize));
      for (let row = firstRow; row <= lastRow; row += 1) {
        for (let column = firstColumn; column <= lastColumn; column += 1) {
          const x = column * collisionCellSize;
          const y = row * collisionCellSize;
          if (!isCollisionPixel(x + collisionCellSize / 2, y + collisionCellSize / 2)) continue;
          context.fillRect(
            (x - cameraX) * VIEW_SCALE,
            (y - cameraY) * VIEW_SCALE,
            collisionCellSize * VIEW_SCALE,
            collisionCellSize * VIEW_SCALE,
          );
        }
      }
    } else {
      const collisionSourceScale = 1;
      context.drawImage(
        collisionMask,
        cameraX * collisionSourceScale,
        cameraY * collisionSourceScale,
        viewportWidth * collisionSourceScale,
        viewportHeight * collisionSourceScale,
        0,
        0,
        canvas.width,
        canvas.height,
      );
    }
    context.restore();
  }

  const sourceFrame = SEAL_MODE ? player.frame % SEAL_FRAME_X.length : player.frame;
  const sourceRow = directionRows[player.direction];
  const sourceX = SEAL_MODE ? (SEAL_FRAME_X[sourceFrame] ?? 0) : sourceFrame * FRAME_WIDTH;
  const sourceY = SEAL_MODE ? (SEAL_ROW_Y[sourceRow] ?? 0) : sourceRow * FRAME_HEIGHT;
  const sourceWidth = SEAL_MODE ? (SEAL_FRAME_WIDTH[sourceFrame] ?? 126) : FRAME_WIDTH;
  const sourceHeight = SEAL_MODE ? (SEAL_ROW_HEIGHT[sourceRow] ?? 162) : FRAME_HEIGHT;
  const width = SEAL_MODE ? SEAL_RENDER_WIDTH : FRAME_WIDTH * PLAYER_SCALE;
  const height = SEAL_MODE ? SEAL_RENDER_HEIGHT : FRAME_HEIGHT * PLAYER_SCALE;
  const baselineOffset = SEAL_MODE ? SEAL_BASELINE_OFFSET : 0;
  context.drawImage(
    spriteSheet,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    Math.round((player.x - cameraX - width / 2) * VIEW_SCALE),
    Math.round((player.y - cameraY - height + baselineOffset) * VIEW_SCALE),
    width * VIEW_SCALE,
    height * VIEW_SCALE,
  );
  if (caveColanderHeld) {
    drawColander(
      context,
      Math.round((player.x - cameraX + 19) * VIEW_SCALE),
      Math.round((player.y - cameraY - 30) * VIEW_SCALE),
      VIEW_SCALE,
    );
  }

  if (!isCaveInterior && !isMusicShopInterior && openDoorIndex !== null) {
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

syncInteriorExitLink();
bindControls();

const requiredImages = isCaveInterior
  ? [interior, spriteSheet]
  : isMusicShopInterior
    ? [interior, spriteSheet]
    : [interior, collisionMask, doorOverlay, spriteSheet, noelSprite];

Promise.all(requiredImages.map((image) => image.decode()))
  .then(() => {
    context.imageSmoothingEnabled = false;
    requestAnimationFrame(gameLoop);
  })
  .catch((error: unknown) => {
    console.error(error);
    context.fillStyle = '#f5fff6';
    context.font = '13px monospace';
    context.fillText('Could not load the interior.', 120, 240);
  });
