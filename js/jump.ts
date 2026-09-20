import { isBusIntroActive } from './bus-intro.js';
import { hasCaveColander } from './colander.js';
import { releaseAllInput } from './input.js';

interface JumpDestination {
  readonly id: string;
  readonly label: string;
}

const JUMP_DESTINATIONS: readonly JumpDestination[] = [
  { id: 'northwest-portal', label: 'Cave' },
  { id: 'garden-room', label: 'Plant Room' },
  { id: 'diary-lab-center', label: 'Diary Lab - Center Door' },
  { id: 'diary-lab-right', label: 'Diary Lab - Right Door' },
  { id: 'music-shop', label: 'Music House' },
  { id: 'gym', label: 'Gym' },
  { id: 'cinema', label: 'Cinema' },
  { id: 'bookshop', label: 'Bookshop' },
];

const jumpToggle = document.querySelector<HTMLButtonElement>('#jump-toggle');
const jumpPanel = document.querySelector<HTMLElement>('#jump-panel');
const jumpClose = document.querySelector<HTMLButtonElement>('#jump-close');
const jumpOptions = document.querySelector<HTMLElement>('#jump-options');

let jumpMenuOpen = false;
let navigationStarted = false;

export const isJumpMenuOpen = () => jumpMenuOpen;

function setJumpMenuOpen(open: boolean): void {
  if (!jumpToggle || !jumpPanel) return;
  jumpMenuOpen = open;
  jumpPanel.hidden = !open;
  jumpToggle.setAttribute('aria-expanded', String(open));
  if (open) {
    releaseAllInput();
    jumpPanel.querySelector<HTMLButtonElement>('.jump-option')?.focus();
  } else {
    jumpToggle.focus();
  }
}

function internalPageHref(): string {
  return window.location.pathname.includes('/internal/') ? 'index.html' : 'internal/index.html';
}

function jumpTo(destinationId: string): void {
  if (navigationStarted) return;
  navigationStarted = true;
  releaseAllInput();
  const params = new URLSearchParams({ door: destinationId });
  if (hasCaveColander()) params.set('colander', '1');
  if (new URLSearchParams(window.location.search).has('seal')) params.set('seal', '1');
  window.location.assign(`${internalPageHref()}?${params.toString()}`);
}

function buildOptions(): void {
  if (!jumpOptions) return;
  JUMP_DESTINATIONS.forEach((destination) => {
    const button = document.createElement('button');
    button.className = 'jump-option';
    button.type = 'button';
    button.textContent = destination.label;
    button.addEventListener('click', () => jumpTo(destination.id));
    jumpOptions.append(button);
  });
}

export function setupJump(): void {
  if (!jumpToggle || !jumpPanel || !jumpClose || !jumpOptions) return;
  buildOptions();
  jumpToggle.addEventListener('click', () => setJumpMenuOpen(!jumpMenuOpen));
  jumpClose.addEventListener('click', () => setJumpMenuOpen(false));
  window.addEventListener('keydown', (event) => {
    if (event.code === 'Escape' && jumpMenuOpen) {
      event.preventDefault();
      setJumpMenuOpen(false);
    }
  });
  document.addEventListener('click', (event) => {
    if (!jumpMenuOpen) return;
    if (event.target instanceof Node && !jumpPanel.contains(event.target) && !jumpToggle.contains(event.target)) {
      setJumpMenuOpen(false);
    }
  });
  jumpToggle.classList.toggle('opening-intro-hidden', isBusIntroActive());
}
