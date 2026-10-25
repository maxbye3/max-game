import { requireElement } from './elements.js';
import { releaseAllInput } from './input.js';
import { getPlayerBody, setPlayerBody } from './player-body.js';
import { isWheldonPlayerSpriteEnabled, setWheldonPlayerSpriteEnabled } from './player-sprite-test.js';
import { isSealPlayer, resetCaveTransformation } from './cave-transformation.js';
import { characterForm, getUnlockedCharacters, unlockCharacter, type CharacterForm } from './character-unlocks.js';

export function isCharacterMenuOpen(): boolean {
  return document.querySelector('#character-menu')?.matches(':popover-open') ?? false;
}

export function setupCharacterMenu(releaseInput = releaseAllInput): void {
  const toggle = requireElement<HTMLButtonElement>('#character-toggle');
  const menu = requireElement<HTMLElement>('#character-menu');
  const options = Array.from(menu.querySelectorAll<HTMLButtonElement>('button[data-character]'));
  const selectedCharacter = (): CharacterForm => characterForm(getPlayerBody(), isWheldonPlayerSpriteEnabled(), isSealPlayer());
  const positionMenu = (): void => {
    const anchor = toggle.getBoundingClientRect();
    const gap = 8;
    const margin = 8;
    const height = menu.offsetHeight;
    const below = window.innerHeight - anchor.bottom - gap - margin;
    const above = anchor.top - gap - margin;
    const opensUp = below < height && above > below;
    menu.style.maxHeight = `${Math.max(44, opensUp ? above : below)}px`;
    menu.style.left = `${Math.max(margin, Math.min(anchor.left, window.innerWidth - menu.offsetWidth - margin))}px`;
    menu.style.top = `${opensUp ? Math.max(margin, anchor.top - gap - menu.offsetHeight) : anchor.bottom + gap}px`;
  };
  menu.addEventListener('toggle', () => {
    const open = isCharacterMenuOpen();
    toggle.setAttribute('aria-expanded', String(open));
    if (!open) return;
    releaseInput();
    const selected = selectedCharacter();
    unlockCharacter(selected);
    const unlocked = getUnlockedCharacters();
    for (const option of options) {
      option.hidden = !unlocked.includes(option.dataset.character as CharacterForm);
      option.setAttribute('aria-pressed', String(option.dataset.character === selected));
    }
    menu.style.maxHeight = '';
    positionMenu();
    (options.find((option) => option.dataset.character === selected) ?? options[0])?.focus();
  });
  for (const option of options) {
    option.addEventListener('click', () => {
      const character = option.dataset.character as CharacterForm;
      if (!getUnlockedCharacters().includes(character)) return;
      if (character === selectedCharacter()) { menu.hidePopover(); toggle.focus(); return; }
      const ghost = character.startsWith('ghost-');
      const wheldon = character.endsWith('wheldon');
      setWheldonPlayerSpriteEnabled(wheldon);
      setPlayerBody(ghost ? 'ghost' : 'player');
      const url = new URL(window.location.href);
      url.searchParams.set('body', getPlayerBody());
      url.searchParams.set('wheldon', wheldon ? '1' : '0');
      const changesSeal = url.searchParams.has('seal') || character === 'seal';
      if (changesSeal) {
        resetCaveTransformation(url);
        if (character === 'seal') url.searchParams.set('seal', '1');
      }
      releaseInput();
      // Rooms choose their assets and interactions at entry; reload those choices.
      if (changesSeal || url.pathname.includes('/internal/')) {
        window.location.assign(url.toString());
        return;
      }
      window.history.replaceState(null, '', url);
      menu.hidePopover();
      toggle.focus();
    });
  }
  window.addEventListener('resize', () => { if (isCharacterMenuOpen()) positionMenu(); });
  window.addEventListener('scroll', () => { if (isCharacterMenuOpen()) positionMenu(); }, true);
}
