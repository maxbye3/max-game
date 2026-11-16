import { getPeopleSpokenCount, PEOPLE_TO_MEET } from './people-spoken-to.js';
import { addGift, hasGift, TODO_ITEM } from './inventory-gifts.js';
import { readStorage, writeStorage } from './storage.js';
import { endDialogueAudio } from './dialogue-audio.js';
import { resolveSiteAsset } from './site-assets.js';

const RECEIVED_KEY = 'max-game:todo-guide-received';
export const TODO_WELCOME_LINE = "hey looks like your new around here. I'm adding this to your inventory. Take a look if your stuck on things to do otherwise have fun exploring";

/** Append the welcome gift only when a player finishes a conversation. */
export class TodoWelcomeDialogue {
  isOpen = false;

  constructor(
    private readonly panel: HTMLElement,
    private readonly line: HTMLElement,
    private readonly next: HTMLButtonElement,
    private readonly close?: () => void,
    private readonly canOffer: () => boolean = () => true,
    private readonly beforeFarewell: () => void = () => {},
  ) {}

  end = (): void => {
    if (this.panel.hidden) return;
    if (!this.canOffer() || !this.finish()) this.close?.();
  };

  finish(): boolean {
    if (this.isOpen) {
      writeStorage(RECEIVED_KEY, 'true');
      addGift(TODO_ITEM);
      return false;
    }
    if (readStorage(RECEIVED_KEY) === 'true' || hasGift(TODO_ITEM)) return false;
    this.beforeFarewell();
    endDialogueAudio();
    this.isOpen = true;
    this.line.textContent = TODO_WELCOME_LINE;
    this.panel.querySelectorAll<HTMLElement>('.npc-dialogue-options, .npc-dialogue-question, .dialogue-progress, .dialogue-gift-confirmation').forEach(element => { element.hidden = true; });
    this.next.hidden = false;
    return true;
  }

  cancel(): void {
    this.isOpen = false;
  }
}

let viewer: HTMLDialogElement | null = null;
let talkCount: HTMLOutputElement | null = null;

export function isTodoGuideOpen(): boolean {
  return viewer?.open ?? false;
}

export function openTodoGuide(): void {
  if (!viewer) {
    viewer = document.createElement('dialog');
    viewer.className = 'todo-guide';
    viewer.setAttribute('aria-label', 'To-dos');
    const close = document.createElement('button');
    close.type = 'button';
    close.textContent = 'Close';
    close.addEventListener('click', () => viewer?.close());
    const image = document.createElement('img');
    image.src = resolveSiteAsset(TODO_ITEM.imageSource);
    image.alt = 'To-dos: talk to people (easy); finish haunted house game (medium); access my journal (hard).';
    const sheet = document.createElement('div');
    sheet.className = 'todo-guide-sheet';
    talkCount = document.createElement('output');
    talkCount.className = 'todo-talk-count';
    talkCount.setAttribute('aria-label', 'People spoken to');
    sheet.append(image, talkCount);
    viewer.append(close, sheet);
    viewer.addEventListener('click', event => { if (event.target === viewer) viewer?.close(); });
    // Keep game hotkeys from acting underneath the modal; Escape uses native dismissal.
    viewer.addEventListener('keydown', event => event.stopPropagation());
    document.body.append(viewer);
  }
  if (talkCount) talkCount.textContent = `${getPeopleSpokenCount()} / ${PEOPLE_TO_MEET}`;
  viewer.showModal();
}
