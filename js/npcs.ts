import { requireElement } from './dom.js';
import { ADAM_DIALOGUE_LINES } from './adam-dialogue.js';
import { ADAM_FACTS } from './adam-facts.js';
import { ALEX_S_DIALOGUE_LINES } from './alex-s-dialogue.js';
import { getNextArsenalFixtureDialogue } from './arsenal-fixture.js';
import { ED_DIALOGUE_LINES } from './ed-dialogue.js';
import { addGift, hasGift, nextGiftLine, type GiftItem, GIFT_ITEMS } from './inventory-gifts.js';
import { MIKE_DIALOGUE_LINES } from './mike-dialogue.js';
import { REI_DIALOGUE_LINES } from './rei-dialogue.js';
import { readStorage, writeStorage } from './storage.js';

interface NpcDefinition {
  readonly id: 'adam' | 'ed' | 'mike' | 'rei' | 'alexS';
  readonly name: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly interactionDistance: number;
  readonly itemGift?: GiftItem;
  readonly dialogueLines: readonly string[];
  readonly getDialogueLine?: () => Promise<string>;
  readonly followUpLine?: () => string;
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
  dialogueLines: ADAM_DIALOGUE_LINES,
  followUpLine: nextAdamFact,
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
  dialogueLines: ED_DIALOGUE_LINES,
  getDialogueLine: getNextArsenalFixtureDialogue,
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
  itemGift: GIFT_ITEMS[0]!,
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
  dialogueLines: REI_DIALOGUE_LINES,
  requestLine: 'I need some red paint to finish this sign. Help me find some',
  themeSource: 'chat/rei/player/theme.mp3',
};

export const ALEX_S: NpcDefinition = {
  id: 'alexS',
  name: 'Alex S',
  x: 680,
  y: 1063,
  width: 20,
  height: 46,
  interactionDistance: 58,
  itemGift: GIFT_ITEMS[1]!,
  dialogueLines: ALEX_S_DIALOGUE_LINES,
  themeSource: 'chat/alex s/theme.mp3',
};

const NPCS: readonly NpcDefinition[] = [ADAM, ED, MIKE, REI, ALEX_S];
const dialogue = requireElement<HTMLElement>('#npc-dialogue');
const speaker = requireElement<HTMLElement>('#npc-speaker');
const dialogueLine = requireElement<HTMLElement>('#npc-dialogue-line');
const dialogueProgress = requireElement<HTMLElement>('#npc-dialogue-progress');
const giftConfirmation = requireElement<HTMLElement>('#npc-gift-confirmation');
const closeButton = requireElement<HTMLButtonElement>('#npc-dialogue-close');
const nextButton = requireElement<HTMLButtonElement>('#npc-dialogue-next');
const gameShell = requireElement<HTMLElement>('.game-shell');
const fallbackDialogueIndexes = new Map<string, number>();

const QUEST_ACCEPTED_OVERLAY_DURATION = 3200;

let activeNpc: NpcDefinition | null = null;
let pendingRequestLine: string | null = null;
let pendingFollowUpLine: string | null = null;
let pendingGiftLine: string | null = null;
let pendingGiftItem: GiftItem | null = null;
let pendingGiftConfirmation: string | null = null;
let currentDialogueLineIndex = 0;
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

function nextStoredIndex(key: string, length: number): number {
  const fallback = fallbackDialogueIndexes.get(key) ?? 0;
  const stored = Number.parseInt(readStorage(key) ?? String(fallback), 10);
  const current = Number.isFinite(stored) && stored >= 0 ? stored % length : 0;
  const next = (current + 1) % length;
  fallbackDialogueIndexes.set(key, next);
  writeStorage(key, String(next));
  return current;
}

function nextDialogueIndex(npc: NpcDefinition): number {
  return nextStoredIndex(dialogueIndexKey(npc), npc.dialogueLines.length);
}

function nextAdamFact(): string {
  const index = nextStoredIndex('max-game:adam-fact-index', ADAM_FACTS.length);
  return ADAM_FACTS[index] ?? '';
}

function closeDialogue(): void {
  activeNpc = null;
  pendingRequestLine = null;
  pendingFollowUpLine = null;
  pendingGiftLine = null;
  pendingGiftItem = null;
  pendingGiftConfirmation = null;
  requestLineShown = false;
  dialogue.hidden = true;
  nextButton.hidden = true;
  dialogueProgress.hidden = true;
  giftConfirmation.hidden = true;
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
  dialogueProgress.hidden = true;
  giftConfirmation.hidden = true;
  // Keep Next visible so the player advances to the quest prompt themselves,
  // instead of that only happening as a side effect of closing the dialogue.
  nextButton.hidden = false;
}

function showGiftLine(): void {
  if (!pendingGiftLine) return;
  dialogueLine.textContent = pendingGiftLine;
  pendingGiftLine = null;
  const giftWasAdded = pendingGiftItem ? addGift(pendingGiftItem) : false;
  pendingGiftItem = null;
  dialogueProgress.hidden = true;
  giftConfirmation.textContent = giftWasAdded ? pendingGiftConfirmation : '';
  pendingGiftConfirmation = null;
  giftConfirmation.hidden = !giftWasAdded;
  nextButton.hidden = true;
}

function showFollowUpLine(): void {
  if (!pendingFollowUpLine) return;
  dialogueLine.textContent = pendingFollowUpLine;
  pendingFollowUpLine = null;
  dialogueProgress.hidden = true;
  nextButton.hidden = true;
}

function acceptQuest(): void {
  requestLineShown = false;
  showQuestAcceptedOverlay();
  closeDialogue();
}

function advanceDialogue(): void {
  if (pendingRequestLine) {
    showRequestLine();
  } else if (pendingFollowUpLine) {
    showFollowUpLine();
  } else if (pendingGiftLine) {
    showGiftLine();
  } else if (requestLineShown) {
    acceptQuest();
  } else if (activeNpc && activeNpc.dialogueLines.length > 1) {
    currentDialogueLineIndex = (currentDialogueLineIndex + 1) % activeNpc.dialogueLines.length;
    dialogueLine.textContent = activeNpc.dialogueLines[currentDialogueLineIndex] ?? '';
    dialogueProgress.textContent = `${currentDialogueLineIndex + 1}/${activeNpc.dialogueLines.length}`;
    dialogueProgress.hidden = false;
  }
}

function showDialogueLine(npc: NpcDefinition): void {
  if (!npc.getDialogueLine) {
    const lineIndex = nextDialogueIndex(npc);
    currentDialogueLineIndex = lineIndex;
    dialogueLine.textContent = npc.dialogueLines[lineIndex] ?? '';
    dialogueProgress.textContent = `${lineIndex + 1}/${npc.dialogueLines.length}`;
    dialogueProgress.hidden = false;
    return;
  }
  dialogueProgress.hidden = true;
  dialogueLine.textContent = 'Checking Arsenal’s next game...';
  nextButton.hidden = true;
  void npc.getDialogueLine().then((line) => {
    if (activeNpc === npc) dialogueLine.textContent = line;
  });
}

function openDialogue(npc: NpcDefinition): void {
  activeNpc = npc;
  pendingRequestLine = npc.requestLine ?? null;
  pendingFollowUpLine = npc.followUpLine?.() ?? null;
  pendingGiftItem = npc.itemGift && !hasGift(npc.itemGift) ? npc.itemGift : null;
  pendingGiftLine = pendingGiftItem ? nextGiftLine() : null;
  pendingGiftConfirmation = pendingGiftLine ? 'An item has been added to your inventory.' : null;
  giftConfirmation.hidden = true;
  requestLineShown = false;
  speaker.textContent = npc.name;
  showDialogueLine(npc);
  nextButton.hidden = pendingRequestLine === null && pendingFollowUpLine === null && pendingGiftLine === null && npc.dialogueLines.length <= 1;
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
    if ((pendingRequestLine || pendingFollowUpLine || requestLineShown) && (event.code === 'Enter' || event.code === 'Space')) {
      event.preventDefault();
      advanceDialogue();
    }
  });
}
