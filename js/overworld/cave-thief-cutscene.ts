import { requireElement } from '../core/dom.js';
import { createGameAudio } from '../core/audio-mute.js';
import { releaseAllInput } from '../core/input.js';
import { characterAsset } from '../core/character-assets.js';

const CATCH_TRANSITION_DURATION = 1200;
const CATCH_TRANSITION_BANDS = 12;

const gameShell = requireElement<HTMLElement>('.game-shell');

// Both sisters shout the line together, so both clips play at once.
const messageVoices = [
  createGameAudio(characterAsset('siblings', 'maddyAudio')),
  createGameAudio(characterAsset('siblings', 'marinaAudio')),
];
messageVoices.forEach((voice) => {
  voice.preload = 'none';
});

export function playMessageVoices(prefix = ''): void {
  messageVoices.forEach((voice, index) => {
    voice.src = `${prefix}${characterAsset('siblings', index === 0 ? 'maddyAudio' : 'marinaAudio')}`;
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
export function startCatchTransition(destination = 'transform.html'): void {
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
    window.location.assign(destination);
  }, CATCH_TRANSITION_DURATION);
}
