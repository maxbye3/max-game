import { requireElement } from './dom.js';
import { MIKE_DIALOGUE_LINES } from './mike-dialogue.js';
import { REI_DIALOGUE_LINES } from './rei-dialogue.js';
import { readStorage, writeStorage } from './storage.js';

interface NpcDefinition {
  readonly id: 'mike' | 'rei';
  readonly name: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly interactionDistance: number;
  readonly collisionDistance: number;
  readonly dialogueLines: readonly string[];
  readonly themeSource: string;
}

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
  y: 510,
  width: 32,
  height: 52,
  interactionDistance: 56,
  collisionDistance: 25,
  dialogueLines: REI_DIALOGUE_LINES,
  themeSource: 'chat/rei/player/theme.mp3',
};

const NPCS: readonly NpcDefinition[] = [MIKE, REI];
const dialogue = requireElement<HTMLElement>('#npc-dialogue');
const speaker = requireElement<HTMLElement>('#npc-speaker');
const dialogueLine = requireElement<HTMLElement>('#npc-dialogue-line');
const closeButton = requireElement<HTMLButtonElement>('#npc-dialogue-close');
const fallbackDialogueIndexes = new Map<NpcDefinition['id'], number>();

let activeNpc: NpcDefinition | null = null;
let nearbyNpc: NpcDefinition | null = null;
let theme: HTMLAudioElement | null = null;

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
  dialogue.hidden = true;
  if (theme) {
    theme.pause();
    theme.currentTime = 0;
    theme = null;
  }
}

function openDialogue(npc: NpcDefinition): void {
  activeNpc = npc;
  speaker.textContent = npc.name;
  dialogueLine.textContent = npc.dialogueLines[nextDialogueIndex(npc)] ?? '';
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
  window.addEventListener('keydown', (event) => {
    if (event.code !== 'Escape' || !activeNpc) return;
    event.preventDefault();
    closeDialogue();
  });
}
