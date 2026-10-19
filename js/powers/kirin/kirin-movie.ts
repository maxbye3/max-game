import { resolveSiteAsset } from '../../core/site-assets.js';
import { announceWorldInteraction } from '../../core/world-interactions.js';
import { characterAsset, playerAsset } from '../../core/character-assets.js';
import { getPlayerBody } from '../../core/player-body.js';
import { getPlayerSpriteFrame } from '../../core/player-sprite.js';
import { getGhostSpriteFrame } from '../../core/ghost-sprite.js';
import { getWheldonPlayerSpriteFrame, isWheldonPlayerSpriteEnabled } from '../../core/player-sprite-test.js';
import { GHOST_SPRITE_SOURCE } from '../../generated/core/ghost-sprite.generated.js';

let movieDialog: HTMLDialogElement | null = null;

export const isKirinMovieOpen = (): boolean => movieDialog?.open ?? false;

function drawSeatedPlayer(canvas: HTMLCanvasElement): void {
  const body = getPlayerBody();
  const ghost = body === 'ghost';
  const wheldon = body === 'alex-s' || isWheldonPlayerSpriteEnabled();
  const seal = new URLSearchParams(window.location.search).has('seal');
  const frame = wheldon ? getWheldonPlayerSpriteFrame('up', 0, ghost)
    : ghost ? getGhostSpriteFrame('up', 0, 2) : getPlayerSpriteFrame(seal, 'up', 0, 2);
  const source = wheldon ? characterAsset('alex-s', ghost ? 'ghostWheldonSprite' : 'wheldonSprite')
    : ghost ? GHOST_SPRITE_SOURCE : playerAsset(seal ? 'sealSpriteSheet' : 'spriteSheet');
  const image = new Image();
  image.src = source.startsWith('data:') ? source : resolveSiteAsset(source);
  void image.decode().then(() => {
    if (!canvas.isConnected) return;
    const context = canvas.getContext('2d')!;
    context.imageSmoothingEnabled = false;
    const height = 80; const width = Math.round(height * frame.width / frame.height);
    context.drawImage(image, frame.sourceX, frame.sourceY, frame.sourceWidth, frame.sourceHeight,
      (canvas.width - width) / 2, canvas.height - height, width, height);
  }).catch(() => {});
}

export function openKirinMovie(): void {
  if (isKirinMovieOpen()) return;
  announceWorldInteraction();
  window.dispatchEvent(new Event('max-game:kirin-power-activated'));
  const previousFocus = document.activeElement;
  const dialog = document.createElement('dialog');
  movieDialog = dialog;
  dialog.className = 'kirin-movie-dialog';
  dialog.setAttribute('aria-labelledby', 'kirin-movie-title');
  dialog.addEventListener('keydown', (event) => event.stopPropagation());
  dialog.innerHTML = `
    <header class="kirin-movie-header"><div><p>DIET COKE PICTURES</p><h2 id="kirin-movie-title">Kirin presents</h2></div><button class="kirin-movie-close" type="button" aria-label="Leave movie">×</button></header>
    <div class="kirin-theatre">
      <div class="kirin-projector-beam" aria-hidden="true"></div>
      <div class="kirin-movie-screen">
        <video controls autoplay muted playsinline aria-label="Kirin's movie"></video>
        <div class="kirin-curtain kirin-curtain-left" aria-hidden="true"></div>
        <div class="kirin-curtain kirin-curtain-right" aria-hidden="true"></div>
        <div class="kirin-film-countdown" aria-hidden="true"><span>3</span><span>2</span><span>1</span></div>
      </div>
      <div class="kirin-popcorn-effects" aria-hidden="true"></div>
      <div class="kirin-cinema-row" aria-label="Your character is seated in the cinema">
        <div class="kirin-cinema-seat" aria-hidden="true"></div>
        <div class="kirin-player-seat"><canvas width="80" height="96" aria-label="Your character watching the film"></canvas><div class="kirin-seat-back" aria-hidden="true"></div><img class="kirin-seat-drink" alt="Diet Coke"></div>
        <div class="kirin-cinema-seat" aria-hidden="true"></div>
      </div>
    </div>
    <footer class="kirin-movie-footer"><button class="kirin-throw-popcorn" type="button">Throw popcorn</button><p role="status" aria-live="polite">Shhh. The film's on.</p></footer>`;
  const film = dialog.querySelector<HTMLVideoElement>('video')!;
  const status = dialog.querySelector<HTMLElement>('[role="status"]')!;
  const effects = dialog.querySelector<HTMLElement>('.kirin-popcorn-effects')!;
  film.muted = true;
  film.src = resolveSiteAsset('video/film.mp4');
  dialog.querySelector<HTMLImageElement>('.kirin-seat-drink')!.src = resolveSiteAsset(characterAsset('kirin', 'item'));
  dialog.querySelector('.kirin-movie-close')!.addEventListener('click', () => dialog.close());
  let throws = 0;
  const reactions = ['Hey! Some of us are watching!', 'Five stars for the popcorn. Three for your aim.', 'Kirin: this is why we can’t have nice things.', 'You’re in the credits now. As “popcorn person”.'];
  dialog.querySelector('.kirin-throw-popcorn')!.addEventListener('click', () => {
    if (effects.childElementCount >= 60) return;
    status.textContent = reactions[throws++ % reactions.length]!;
    for (let index = 0; index < 12; index++) {
      const kernel = document.createElement('span');
      kernel.className = 'kirin-popcorn-kernel';
      kernel.style.setProperty('--pop-x', `${(Math.random() - 0.5) * 480}px`);
      kernel.style.setProperty('--pop-y', `${-80 - Math.random() * 200}px`);
      kernel.style.setProperty('--pop-turn', `${Math.random() * 720 - 360}deg`);
      kernel.addEventListener('animationend', () => kernel.remove(), { once: true });
      effects.append(kernel);
    }
  });
  film.addEventListener('ended', () => { status.textContent = 'Roll credits. Kirin gives it five stars.'; });
  film.addEventListener('error', () => { status.textContent = 'The projector couldn’t load the film. You can leave and try again.'; });
  dialog.addEventListener('close', () => {
    film.pause();
    film.removeAttribute('src');
    film.load();
    dialog.remove();
    movieDialog = null;
    if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
  }, { once: true });
  document.body.append(dialog);
  drawSeatedPlayer(dialog.querySelector('canvas')!);
  dialog.showModal();
  void film.play().catch(() => {});
}
