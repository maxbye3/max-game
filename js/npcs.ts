import { requireElement } from './dom.js';
import { ADAM_DIALOGUE_LINES } from './adam-dialogue.js';
import { ED_DIALOGUE_LINES } from './ed-dialogue.js';
import { MIKE_DIALOGUE_LINES } from './mike-dialogue.js';
import { REI_DIALOGUE_LINES } from './rei-dialogue.js';
import { readStorage, writeStorage } from './storage.js';

interface NpcDefinition {
  readonly id: 'adam' | 'ed' | 'mike' | 'rei';
  readonly name: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly interactionDistance: number;
  readonly collisionDistance: number;
  readonly dialogueLines: readonly string[];
  // Said after the rotating greeting, every time the player walks up.
  readonly requestLine?: string;
  readonly themeSource: string;
}

export const ADAM: NpcDefinition = {
  id: 'adam',
  name: 'adam',
  x: 195,
  y: 916,
  width: 37,
  height: 60,
  interactionDistance: 56,
  collisionDistance: 24,
  dialogueLines: ADAM_DIALOGUE_LINES,
  themeSource: 'chat/adam/player/theme.mp3',
};

export const ED: NpcDefinition = {
  id: 'ed',
  name: 'ed',
  x: 254,
  y: 909,
  width: 25,
  height: 54,
  interactionDistance: 56,
  collisionDistance: 24,
  dialogueLines: ED_DIALOGUE_LINES,
  themeSource: 'chat/ed/player/theme.mp3',
};

export const MIKE: NpcDefinition = {
  id: 'mike',
  name: 'mike',
  x: 300,
  y: 685,
  width: 40,
  height: 46,
  interactionDistance: 56,
  collisionDistance: 27,
  dialogueLines: MIKE_DIALOGUE_LINES,
  themeSource: 'chat/mike/example_character/theme.mp3',
};

export const REI: NpcDefinition = {
  id: 'rei',
  name: 'rei',
  x: 456,
  y: 500,
  width: 35,
  height: 35,
  interactionDistance: 56,
  collisionDistance: 27,
  dialogueLines: REI_DIALOGUE_LINES,
  requestLine: 'I need some red paint to finish this sign. Help me find some',
  themeSource: 'chat/rei/player/theme.mp3',
};

const NPCS: readonly NpcDefinition[] = [ADAM, ED, MIKE, REI];
const dialogue = requireElement<HTMLElement>('#npc-dialogue');
const speaker = requireElement<HTMLElement>('#npc-speaker');
const dialogueLine = requireElement<HTMLElement>('#npc-dialogue-line');
const closeButton = requireElement<HTMLButtonElement>('#npc-dialogue-close');
const nextButton = requireElement<HTMLButtonElement>('#npc-dialogue-next');
const gameShell = requireElement<HTMLElement>('.game-shell');
const fallbackDialogueIndexes = new Map<NpcDefinition['id'], number>();

const QUEST_ACCEPTED_OVERLAY_DURATION = 3200;

let activeNpc: NpcDefinition | null = null;
let pendingRequestLine: string | null = null;
let requestLineShown = false;
let nearbyNpc: NpcDefinition | null = null;
let theme: HTMLAudioElement | null = null;

function showQuestAcceptedOverlay(): void {
  const overlay = document.createElement('div');
  overlay.className = 'quest-accepted-overlay';
  overlay.setAttribute('aria-hidden', 'true');
  const image = document.createElement('img');
  image.src = 'img/external/quest_accepted.png';
  image.alt = '';
  overlay.append(image);
  gameShell.append(overlay);
  window.setTimeout(() => overlay.remove(), QUEST_ACCEPTED_OVERLAY_DURATION);

  const sound = new Audio('audio/quest-accepted.mp3');
  sound.preload = 'auto';
  void sound.play().catch(() => {
    // Browsers may reject audio until a keyboard or pointer gesture.
  });
}

function dialogueIndexKey(npc: NpcDefinition): string {
  return `max-game:${npc.id}-dialogue-index`;
}

function nextDialogueIndex(npc: NpcDefinition): number {
  const fallback = fallbackDialogueIndexes.get(npc.id) ?? 0;
  const stored = Number.parseInt(readStorage(dialogueIndexKey(npc)) ?? String(fallback), 10);
  const current = Number.isFinite(stored) && stored >= 0 ? stored % npc.dialogueLines.length : 0;
  const next = (current + 1) % npc.dialogueLines.length;
  fallbackDialogueIndexes.set(npc.id, next);
  writeStorage(dialogueIndexKey(npc), String(next));
  return current;
}

function closeDialogue(): void {
  activeNpc = null;
  pendingRequestLine = null;
  requestLineShown = false;
  dialogue.hidden = true;
  nextButton.hidden = true;
  if (theme) {
    theme.pause();
    theme.currentTime = 0;
    theme = null;
  }
}

function showRequestLine(): void {
  if (!activeNpc || !pendingRequestLine) return;
  dialogueLine.textContent = pendingRequestLine;
  pendingRequestLine = null;
  requestLineShown = true;
  // Keep Next visible so the player advances to the quest prompt themselves,
  // instead of that only happening as a side effect of closing the dialogue.
  nextButton.hidden = false;
}

function acceptQuest(): void {
  requestLineShown = false;
  showQuestAcceptedOverlay();
  closeDialogue();
}

function advanceDialogue(): void {
  if (pendingRequestLine) {
    showRequestLine();
  } else if (requestLineShown) {
    acceptQuest();
  }
}

function openDialogue(npc: NpcDefinition): void {
  activeNpc = npc;
  pendingRequestLine = npc.requestLine ?? null;
  requestLineShown = false;
  speaker.textContent = npc.name;
  dialogueLine.textContent = npc.dialogueLines[nextDialogueIndex(npc)] ?? '';
  nextButton.hidden = pendingRequestLine === null;
  dialogue.hidden = false;
  theme = new Audio(npc.themeSource);
  theme.preload = 'auto';
  void theme.play().catch(() => {
    // Browsers may reject audio until a keyboard or pointer gesture.
  });
}

export function updateNpcInteractions(playerX: number, playerY: number): void {
  const nextNearbyNpc = NPCS.find((npc) =>
    Math.hypot(playerX - npc.x, playerY - npc.y) <= npc.interactionDistance,
  ) ?? null;
  if (nextNearbyNpc === nearbyNpc) return;
  nearbyNpc = nextNearbyNpc;
  closeDialogue();
  if (nearbyNpc) openDialogue(nearbyNpc);
}

export function playerCollidesWithNpc(x: number, y: number): boolean {
  return NPCS.some((npc) => Math.hypot(x - npc.x, y - npc.y) < npc.collisionDistance);
}

export function setupNpcInteractions(): void {
  closeButton.addEventListener('click', closeDialogue);
  nextButton.addEventListener('click', advanceDialogue);
  window.addEventListener('keydown', (event) => {
    if (!activeNpc) return;
    if (event.code === 'Escape') {
      event.preventDefault();
      closeDialogue();
      return;
    }
    if ((pendingRequestLine || requestLineShown) && (event.code === 'Enter' || event.code === 'Space')) {
      event.preventDefault();
      advanceDialogue();
    }
  });
}
