import { EngagementGame } from './engagement-game.js';
import { drawEngagementGame } from './engagement-render.js';
import { createGameAudio, focusPowerAudio, releaseGameAudio } from '../../core/audio-mute.js';
import { resolveSiteAsset } from '../../core/site-assets.js';
import { announceWorldInteraction } from '../../core/world-interactions.js';

let dialog: HTMLDialogElement | null = null;
export const isAdamEngagementOpen = (): boolean => dialog?.open ?? false;

export function openAdamEngagement(): void {
  if (isAdamEngagementOpen()) return;
  announceWorldInteraction();
  window.dispatchEvent(new Event('max-game:adam-power-activated'));
  const previousFocus = document.activeElement;
  const panel = document.createElement('dialog');
  dialog = panel;
  panel.className = 'engagement-dialog';
  panel.setAttribute('aria-labelledby', 'engagement-title');
  panel.innerHTML = `
    <header><div><p>engagement ring</p><h2 id="engagement-title">The perfect moment</h2></div><button class="engagement-close" aria-label="Close engagement game" type="button">×</button></header>
    <p class="engagement-instructions">Line up the ring with the wedding finger.</p>
    <canvas width="360" height="440" aria-label="Two hands moving in opposite directions. Tap when the ring lines up with the finger."></canvas>
    <p class="engagement-result" role="status" aria-live="polite">be careful of <strong>Bakoven</strong> wind</p>
    <button class="engagement-tap" type="button">TAP TO ENGAGE</button>`;
  const canvas = panel.querySelector('canvas')!;
  const context = canvas.getContext('2d')!;
  const result = panel.querySelector<HTMLElement>('.engagement-result')!;
  const tap = panel.querySelector<HTMLButtonElement>('.engagement-tap')!;
  const artwork = { adam: new Image(), maddy: new Image(), ring: new Image(), background: new Image() };
  artwork.adam.src = resolveSiteAsset('char/adam/adam.png');
  artwork.maddy.src = resolveSiteAsset('char/adam/maddy.png');
  artwork.ring.src = resolveSiteAsset('char/adam/item.png');
  artwork.background.src = resolveSiteAsset('char/adam/engagement-background.png');
  let ready = false;
  tap.disabled = true;
  tap.textContent = 'Loading hands…';
  void Promise.all(Object.values(artwork).map(image => image.decode())).then(() => {
    if (!panel.open) return;
    ready = true;
    tap.disabled = false;
    tap.textContent = 'TAP TO ENGAGE';
  }).catch(() => {
    if (panel.open) result.textContent = 'The artwork could not load. Close and try again.';
  });
  const sound = createGameAudio(resolveSiteAsset('char/adam/congratulations.mp3'));
  sound.preload = 'auto';
  let celebrationFinished = false;
  sound.addEventListener('ended', () => {
    celebrationFinished = true;
    releaseGameAudio(sound);
  }, { once: true });
  const theme = createGameAudio(resolveSiteAsset('char/adam/theme.mp3'));
  theme.loop = true;
  focusPowerAudio(theme, Infinity);
  void theme.play().catch(() => {});
  const game = new EngagementGame();
  let frame = 0;
  let previousTime = 0;
  let celebrated = false;
  const engage = (): void => {
    if (!ready || game.phase !== 'moving') return;
    if (game.tap()) {
      result.textContent = 'Here goes…';
      tap.disabled = true;
    }
  };
  const draw = (now: number): void => {
    if (!panel.open) return;
    if (celebrated && (sound.currentTime >= 2 || celebrationFinished)) {
      panel.close();
      return;
    }
    if (ready) game.update(previousTime ? (now - previousTime) / 1000 : 0);
    previousTime = now;
    drawEngagementGame(context, game, artwork, now);
    if (ready && game.phase === 'moving') tap.disabled = false;
    else if (game.phase === 'returning' && result.textContent !== 'Not quite! Try the next pass.') {
      result.textContent = 'Not quite! Try the next pass.';
    }
    if (game.phase === 'engaged' && !celebrated) {
      celebrated = true;
      result.textContent = 'Congratulations!';
      tap.textContent = 'ENGAGED';
      panel.classList.add('is-engaged');
      theme.pause();
      void sound.play().catch(() => {});
    }
    frame = requestAnimationFrame(draw);
  };
  tap.addEventListener('click', engage);
  canvas.addEventListener('pointerdown', event => { if (event.button === 0) { event.preventDefault(); engage(); } });
  panel.addEventListener('keydown', event => {
    event.stopPropagation();
    if ((event.code === 'Space' || event.code === 'Enter') && !(event.target instanceof HTMLButtonElement)) {
      event.preventDefault();
      if (!event.repeat) engage();
    } else if (event.repeat && (event.code === 'Space' || event.code === 'Enter')) event.preventDefault();
  });
  panel.addEventListener('keyup', event => event.stopPropagation());
  panel.querySelector('.engagement-close')!.addEventListener('click', () => panel.close());
  panel.addEventListener('close', () => {
    cancelAnimationFrame(frame);
    if (!celebrated || sound.paused || sound.ended) releaseGameAudio(sound);
    releaseGameAudio(theme);
    focusPowerAudio(null, 0);
    panel.remove();
    dialog = null;
    if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
  }, { once: true });
  document.body.append(panel);
  panel.showModal();
  tap.focus();
  frame = requestAnimationFrame(draw);
}
