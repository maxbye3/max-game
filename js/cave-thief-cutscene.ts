import { requireElement } from './dom.js';
import { releaseAllInput } from './input.js';

const CATCH_TRANSITION_DURATION = 1200;
const CATCH_TRANSITION_BANDS = 12;

const gameShell = requireElement<HTMLElement>('.game-shell');

// Both sisters shout the line together, so both clips play at once.
const messageVoices = [
  new Audio('chat/siblings/maddy.mp3'),
  new Audio('chat/siblings/marina.mp3'),
];
messageVoices.forEach((voice) => {
  voice.preload = 'auto';
});

export function playMessageVoices(): void {
  messageVoices.forEach((voice) => {
    voice.pause();
    voice.currentTime = 0;
    void voice.play().catch(() => {
      // Browsers may reject audio until movement provides a keyboard or pointer gesture.
    });
  });
}

export function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - ((-2 * t + 2) ** 2) / 2;
}

/** Wipes the screen with the battle bands, then hands off to the transform scene. */
export function startCatchTransition(): void {
  releaseAllInput();

  const transition = document.createElement('div');
  transition.className = 'battle-transition';
  transition.setAttribute('aria-hidden', 'true');
  for (let index = 0; index < CATCH_TRANSITION_BANDS; index += 1) {
    const band = document.createElement('span');
    band.style.setProperty('--band-index', String(index));
    transition.append(band);
  }
  gameShell.append(transition);

  window.setTimeout(() => {
    window.location.assign('transform.html');
  }, CATCH_TRANSITION_DURATION);
}
