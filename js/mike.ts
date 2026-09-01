import { requireElement } from './dom.js';
import { MIKE_DIALOGUE_LINES } from './mike-dialogue.js';

const MIKE_FOLDER = 'chat/mike';
const MIKE_NAME = MIKE_FOLDER.slice(MIKE_FOLDER.lastIndexOf('/') + 1);
const MIKE_DIALOGUE_INDEX_KEY = 'max-game:mike-dialogue-index';
const INTERACTION_DISTANCE = 56;
const COLLISION_DISTANCE = 27;

export const MIKE = {
  x: 300,
  y: 685,
  width: 40,
  height: 46,
} as const;

const talkButton = requireElement<HTMLButtonElement>('#mike-talk');
const dialogue = requireElement<HTMLElement>('#mike-dialogue');
const speaker = requireElement<HTMLElement>('#mike-speaker');
const dialogueLine = requireElement<HTMLElement>('#mike-dialogue-line');
const nextButton = requireElement<HTMLButtonElement>('#mike-dialogue-next');
const closeButton = requireElement<HTMLButtonElement>('#mike-dialogue-close');
const theme = new Audio('chat/mike/example_character/theme.mp3');
theme.preload = 'auto';

let nearby = false;
let dialogueOpen = false;
let dialogueLineIndex = 0;
let fallbackNextDialogueIndex = 0;

function loadNextDialogueIndex(): number {
  try {
    const storedIndex = Number.parseInt(window.localStorage.getItem(MIKE_DIALOGUE_INDEX_KEY) ?? '0', 10);
    return Number.isFinite(storedIndex) && storedIndex >= 0
      ? storedIndex % MIKE_DIALOGUE_LINES.length
      : 0;
  } catch {
    return fallbackNextDialogueIndex;
  }
}

function saveNextDialogueIndex(index: number): void {
  fallbackNextDialogueIndex = index;
  try {
    window.localStorage.setItem(MIKE_DIALOGUE_INDEX_KEY, String(index));
  } catch {
    // Dialogue still cycles for this page when storage is unavailable.
  }
}

export function playerCollidesWithMike(x: number, y: number): boolean {
  return Math.hypot(x - MIKE.x, y - MIKE.y) < COLLISION_DISTANCE;
}

function closeDialogue(): void {
  dialogueOpen = false;
  dialogue.hidden = true;
  nextButton.hidden = true;
  theme.pause();
  theme.currentTime = 0;
  talkButton.hidden = true;
}

function showDialogueLine(): void {
  dialogueLine.textContent = MIKE_DIALOGUE_LINES[dialogueLineIndex] ?? '';
  nextButton.hidden = true;
}

function startDialogue(): void {
  if (!nearby || dialogueOpen) return;
  dialogueOpen = true;
  dialogueLineIndex = loadNextDialogueIndex();
  saveNextDialogueIndex((dialogueLineIndex + 1) % MIKE_DIALOGUE_LINES.length);
  speaker.textContent = MIKE_NAME;
  showDialogueLine();
  dialogue.hidden = false;
  talkButton.hidden = true;
  theme.pause();
  theme.currentTime = 0;
  void theme.play().catch(() => {
    // Browsers may reject audio until a real keyboard or pointer gesture.
  });
}

export function updateMikeInteraction(playerX: number, playerY: number): void {
  const nextNearby = Math.hypot(playerX - MIKE.x, playerY - MIKE.y) <= INTERACTION_DISTANCE;
  if (nextNearby === nearby) return;
  nearby = nextNearby;
  talkButton.hidden = true;
  if (nearby) startDialogue();
  else if (dialogueOpen) closeDialogue();
}

export function setupMike(): void {
  closeButton.addEventListener('click', closeDialogue);
  window.addEventListener('keydown', (event) => {
    if (event.code === 'Escape' && dialogueOpen) {
      event.preventDefault();
      closeDialogue();
    }
  });
}
