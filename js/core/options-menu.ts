import { requireElement } from './elements.js';
import { resetNiallQuestState, resetMikeAftermath } from './world-state.js';
import { resetTimRoute } from '../characters/tim/tim-location.js';
import { resetMusicLibrary } from '../interiors/music-library.js';
import { setAlexEatenDoughnut } from './alex-w-state.js';
import { setPlayerBody } from './player-body.js';
import { setWheldonPlayerSpriteEnabled } from './player-sprite-test.js';
import { resetCharacterUnlocks } from './character-unlocks.js';
import { setupCharacterMenu } from './character-menu.js';

export function isOptionsMenuOpen(): boolean {
  return document.querySelector('#options-menu')?.matches(':popover-open') ?? false;
}

export function setupOptionsMenu(releaseInput: () => void): void {
  setupCharacterMenu(releaseInput);
  const toggle = requireElement<HTMLButtonElement>('#options-toggle');
  const menu = requireElement<HTMLElement>('#options-menu');
  const positionMenu = (): void => {
    const anchor = toggle.getBoundingClientRect();
    const margin = 12;
    menu.style.left = `${Math.max(margin, Math.min(anchor.right - menu.offsetWidth, window.innerWidth - menu.offsetWidth - margin))}px`;
    menu.style.top = `${anchor.bottom + 8}px`;
    menu.style.maxHeight = `${Math.max(44, window.innerHeight - anchor.bottom - 20)}px`;
  };
  menu.addEventListener('beforetoggle', releaseInput);
  menu.addEventListener('toggle', () => {
    const open = isOptionsMenuOpen();
    toggle.setAttribute('aria-expanded', String(open));
    if (open) {
      positionMenu();
      requireElement<HTMLButtonElement>('#audio-mute-toggle').focus();
    }
  });
  window.addEventListener('resize', () => { if (isOptionsMenuOpen()) positionMenu(); });
  window.addEventListener('scroll', () => { if (isOptionsMenuOpen()) positionMenu(); }, true);
  requireElement<HTMLButtonElement>('#thoughts-toggle').addEventListener('click', () => menu.hidePopover(), { capture: true });
  requireElement<HTMLButtonElement>('#reset-all').addEventListener('click', () => {
    releaseInput();
    resetNiallQuestState();
    resetTimRoute();
    resetMikeAftermath();
    resetMusicLibrary();
    setAlexEatenDoughnut(false);
    setPlayerBody('player');
    setWheldonPlayerSpriteEnabled(false);
    resetCharacterUnlocks();
    const destination = window.location.pathname.includes('/internal/') ? '../index.html' : 'index.html';
    const seal = new URLSearchParams(window.location.search).has('seal');
    window.location.assign(seal ? `${destination}?seal=1` : destination);
  });
}
