import { isTimInputPowerActive, TIM_INPUT_POWER_DURATION } from '../powers/tim/tim-input-power.js';
import { isSamPowerActive, SAM_POWER_DURATION } from '../powers/sam/sam-power.js';
import { isReiPowerActive, REI_POWER_DURATION } from '../powers/rei/rei-power.js';
import { isOscarPowerActive, OSCAR_POWER_DURATION } from '../powers/oscar/oscar-power.js';
import { isNoelPowerActive, NOEL_POWER_DURATION } from '../powers/noel/noel-power.js';
import { isMikePowerActive, MIKE_POWER_DURATION } from '../powers/mike/mike-power.js';
import { isLucyPowerActive, LUCY_POWER_DURATION } from '../powers/lucy/lucy-power.js';
import { isKatiePowerActive, KATIE_POWER_DURATION } from '../powers/katie/katie-power.js';
import { hasCaveColander } from './colander.js';
import { getPlayerBody } from './player-body.js';
import { isWheldonPlayerSpriteEnabled } from './player-sprite-test.js';
import { releaseAllInput } from './input.js';

interface JumpDestination {
  readonly id: string;
  readonly label: string;
}

const JUMP_DESTINATIONS: readonly JumpDestination[] = [
  { id: 'garden-room', label: 'Plant Room' },
  { id: 'diary-lab-center', label: 'Diary Lab' },
  { id: 'music-shop', label: 'Music House' },
  { id: 'gym', label: 'Gym' },
  { id: 'artist-studio', label: 'Art Studio' },
  { id: 'cinema', label: 'Cinema' },
  { id: 'bookshop', label: 'Bookshop' },
  { id: 'snow-mansion', label: 'Haunted House' },
];

const jumpToggle = document.querySelector<HTMLButtonElement>('#jump-toggle');
const jumpPanel = document.querySelector<HTMLElement>('#jump-panel');
const jumpClose = document.querySelector<HTMLButtonElement>('#jump-close');
const jumpOptions = document.querySelector<HTMLElement>('#jump-options');

let jumpMenuOpen = false;
let navigationStarted = false;

export const isJumpMenuOpen = () => jumpMenuOpen;

function setJumpMenuOpen(open: boolean): void {
  if (!jumpToggle || !jumpPanel || (open && (isKatiePowerActive() || isLucyPowerActive() || isMikePowerActive() || isNoelPowerActive() || isOscarPowerActive() || isReiPowerActive() || isSamPowerActive() || isTimInputPowerActive()))) return;
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

function currentDestinationId(): string | null {
  if (!window.location.pathname.includes('/internal/')) return null;
  const destinationId = new URLSearchParams(window.location.search).get('door');
  return JUMP_DESTINATIONS.some((destination) => destination.id === destinationId) ? destinationId : null;
}

function jumpTo(destinationId: string): void {
  if (navigationStarted || isKatiePowerActive() || isLucyPowerActive() || isMikePowerActive() || isNoelPowerActive() || isOscarPowerActive() || isReiPowerActive() || isSamPowerActive() || isTimInputPowerActive()) return;
  navigationStarted = true;
  releaseAllInput();
  const params = new URLSearchParams({ door: destinationId });
  if (hasCaveColander()) params.set('colander', '1');
  if (new URLSearchParams(window.location.search).has('seal')) params.set('seal', '1');
  if (getPlayerBody() !== 'player') params.set('body', getPlayerBody());
  if (isWheldonPlayerSpriteEnabled()) params.set('wheldon', '1');
  window.location.assign(`${internalPageHref()}?${params.toString()}`);
}

function buildOptions(): void {
  if (!jumpOptions) return;
  const currentId = currentDestinationId();
  JUMP_DESTINATIONS.forEach((destination) => {
    const button = document.createElement('button');
    const isCurrent = destination.id === currentId;
    button.className = `jump-option${isCurrent ? ' is-current' : ''}`;
    button.type = 'button';
    button.textContent = destination.label;
    if (isCurrent) {
      button.setAttribute('aria-current', 'page');
      button.title = `You are here: ${destination.label}`;
    }
    button.addEventListener('click', () => jumpTo(destination.id));
    jumpOptions.append(button);
  });
}

export function setupJump(): void {
  if (!jumpToggle || !jumpPanel || !jumpClose || !jumpOptions) return;
  buildOptions();
  window.addEventListener('max-game:katie-power-activated', () => {
    setJumpMenuOpen(false);
    jumpToggle.disabled = true;
    window.setTimeout(() => { jumpToggle.disabled = isKatiePowerActive() || isLucyPowerActive() || isMikePowerActive() || isNoelPowerActive() || isOscarPowerActive() || isReiPowerActive() || isSamPowerActive(); }, KATIE_POWER_DURATION);
  });
  window.addEventListener('max-game:lucy-power-activated', () => {
    setJumpMenuOpen(false);
    jumpToggle.disabled = true;
    window.setTimeout(() => { jumpToggle.disabled = isKatiePowerActive() || isLucyPowerActive() || isMikePowerActive() || isNoelPowerActive() || isOscarPowerActive() || isReiPowerActive() || isSamPowerActive(); }, LUCY_POWER_DURATION);
  });
  window.addEventListener('max-game:oscar-power-activated', () => {
    setJumpMenuOpen(false);
    jumpToggle.disabled = true;
    window.setTimeout(() => { jumpToggle.disabled = isKatiePowerActive() || isLucyPowerActive() || isMikePowerActive() || isNoelPowerActive() || isOscarPowerActive() || isReiPowerActive() || isSamPowerActive(); }, OSCAR_POWER_DURATION);
  });
  window.addEventListener('max-game:tim-power-activated', () => {
    setJumpMenuOpen(false);
    jumpToggle.disabled = true;
    window.setTimeout(() => { jumpToggle.disabled = isKatiePowerActive() || isLucyPowerActive() || isMikePowerActive() || isNoelPowerActive() || isOscarPowerActive() || isReiPowerActive() || isSamPowerActive() || isTimInputPowerActive(); }, TIM_INPUT_POWER_DURATION);
  });
  window.addEventListener('max-game:sam-power-activated', () => {
    setJumpMenuOpen(false);
    jumpToggle.disabled = true;
    window.setTimeout(() => { jumpToggle.disabled = isKatiePowerActive() || isLucyPowerActive() || isMikePowerActive() || isNoelPowerActive() || isOscarPowerActive() || isReiPowerActive() || isSamPowerActive(); }, SAM_POWER_DURATION);
  });
  window.addEventListener('max-game:rei-power-activated', () => {
    setJumpMenuOpen(false);
    jumpToggle.disabled = true;
    window.setTimeout(() => { jumpToggle.disabled = isKatiePowerActive() || isLucyPowerActive() || isMikePowerActive() || isNoelPowerActive() || isOscarPowerActive() || isReiPowerActive() || isSamPowerActive(); }, REI_POWER_DURATION);
  });
  window.addEventListener('max-game:noel-power-activated', () => {
    setJumpMenuOpen(false);
    jumpToggle.disabled = true;
    window.setTimeout(() => { jumpToggle.disabled = isKatiePowerActive() || isLucyPowerActive() || isMikePowerActive() || isNoelPowerActive() || isOscarPowerActive() || isReiPowerActive() || isSamPowerActive(); }, NOEL_POWER_DURATION);
  });
  window.addEventListener('max-game:mike-power-activated', () => {
    setJumpMenuOpen(false);
    jumpToggle.disabled = true;
    window.setTimeout(() => { jumpToggle.disabled = isKatiePowerActive() || isLucyPowerActive() || isMikePowerActive() || isNoelPowerActive() || isOscarPowerActive() || isReiPowerActive() || isSamPowerActive(); }, MIKE_POWER_DURATION);
  });
  jumpToggle.addEventListener('click', () => setJumpMenuOpen(!jumpMenuOpen));
  window.addEventListener('max-game:world-interaction-opened', () => { if (jumpMenuOpen) setJumpMenuOpen(false); });
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
}
