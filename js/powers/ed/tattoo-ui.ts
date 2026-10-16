import { TattooGame, TATTOO_DURATION, TATTOO_HEIGHT, TATTOO_WIDTH, type TattooPoint } from './tattoo-game.js';
import { drawTattooGame } from './tattoo-render.js';
import { announceWorldInteraction } from '../../core/world-interactions.js';

let dialog: HTMLDialogElement | null = null;
export const isEdTattooOpen = (): boolean => dialog?.open ?? false;

export function openEdTattooGame(onStart: () => void, onClose: () => void): void {
  if (isEdTattooOpen()) return;
  announceWorldInteraction();
  window.dispatchEvent(new Event('max-game:ed-power-activated'));
  const previousFocus = document.activeElement;
  const windowElement = document.createElement('dialog');
  dialog = windowElement;
  windowElement.className = 'tattoo-dialog';
  windowElement.setAttribute('aria-labelledby', 'tattoo-title');
  windowElement.innerHTML = `
    <header class="tattoo-header"><div><p>ED'S TATTOO PARLOUR</p><h2 id="tattoo-title">Objective</h2></div><button class="tattoo-close" type="button" aria-label="Close tattoo game">×</button></header>
    <p class="tattoo-instructions">Hold and drag the gun over the pale stencil on your client's arm.</p>
    <div class="tattoo-hud"><span>NEEDLE TIME <strong class="tattoo-timer">${(TATTOO_DURATION / 1000).toFixed(1)}s</strong></span><span>DESIGN <strong>HALSTEAD / FOUR CULTURES</strong></span></div>
    <progress class="tattoo-time" value="${TATTOO_DURATION / 1000}" max="${TATTOO_DURATION / 1000}" aria-label="Seconds remaining"></progress>
    <canvas class="tattoo-canvas" width="420" height="320" aria-label="Client's arm with HALSTEAD lettering and a spiky tribal stencil. Hold and drag to tattoo it."></canvas>
    <p class="tattoo-result" role="status" aria-live="polite">Your client is ready. The clock starts when you press Start.</p>
    <button class="tattoo-start" type="button">Start tattoo · ${TATTOO_DURATION / 1000} seconds</button>`;
  document.body.append(windowElement);
  const canvas = windowElement.querySelector<HTMLCanvasElement>('canvas')!;
  const context = canvas.getContext('2d')!;
  const timer = windowElement.querySelector<HTMLElement>('.tattoo-timer')!;
  const timebar = windowElement.querySelector<HTMLProgressElement>('progress')!;
  const result = windowElement.querySelector<HTMLElement>('.tattoo-result')!;
  const start = windowElement.querySelector<HTMLButtonElement>('.tattoo-start')!;
  const game = new TattooGame();
  let pointerId: number | null = null;
  let cursor: TattooPoint | null = null;
  let frame = 0;
  let finished = false;

  const lift = (): void => {
    if (pointerId !== null && canvas.hasPointerCapture(pointerId)) canvas.releasePointerCapture(pointerId);
    pointerId = null;
    game.lift();
  };
  const position = (event: PointerEvent): TattooPoint => {
    const bounds = canvas.getBoundingClientRect();
    return { x: (event.clientX - bounds.left) * TATTOO_WIDTH / bounds.width, y: (event.clientY - bounds.top) * TATTOO_HEIGHT / bounds.height };
  };
  const draw = (now: number): void => {
    if (!windowElement.open) return;
    game.update(now);
    const left = game.secondsLeft(now);
    timer.textContent = `${left.toFixed(1)}s`;
    timebar.value = left;
    if (game.phase === 'finished' && !finished) {
      finished = true;
      lift();
      const { score, coverage, accuracy } = game.result();
      result.textContent = `${score >= 75 ? 'Ed would be proud!' : score >= 40 ? 'A little wonky. A lot of character.' : 'Your client has some questions…'} ${score}/100 · Coverage ${coverage}% · Accuracy ${accuracy}%.`;
      start.textContent = 'Try another tattoo';
      start.hidden = false;
    }
    drawTattooGame(context, game, cursor, pointerId !== null, now);
    frame = requestAnimationFrame(draw);
  };
  start.addEventListener('click', () => {
    lift();
    game.start(performance.now());
    finished = false;
    start.hidden = true;
    result.textContent = 'Needle down! Trace HALSTEAD and the tribal spikes before time runs out.';
    onStart();
  });
  canvas.addEventListener('pointerdown', (event) => {
    if (game.phase !== 'drawing' || pointerId !== null || event.button !== 0) return;
    event.preventDefault();
    cursor = position(event);
    pointerId = event.pointerId;
    canvas.setPointerCapture(pointerId);
    game.draw(cursor, performance.now());
  });
  canvas.addEventListener('pointermove', (event) => {
    if (pointerId !== null && event.pointerId !== pointerId) return;
    cursor = position(event);
    if (pointerId === event.pointerId) game.draw(cursor, performance.now());
  });
  for (const name of ['pointerup', 'pointercancel', 'lostpointercapture'] as const) {
    canvas.addEventListener(name, (event) => { if (event.pointerId === pointerId) lift(); });
  }
  canvas.addEventListener('pointerleave', () => { if (pointerId === null) cursor = null; });
  window.addEventListener('blur', lift);
  const visibilityChanged = (): void => { if (document.hidden) lift(); };
  document.addEventListener('visibilitychange', visibilityChanged);
  windowElement.querySelector('.tattoo-close')!.addEventListener('click', () => windowElement.close());
  for (const name of ['keydown', 'keyup']) windowElement.addEventListener(name, (event) => event.stopPropagation());
  windowElement.addEventListener('close', () => {
    lift();
    cancelAnimationFrame(frame);
    window.removeEventListener('blur', lift);
    document.removeEventListener('visibilitychange', visibilityChanged);
    windowElement.remove();
    dialog = null;
    onClose();
    if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
  }, { once: true });
  windowElement.showModal();
  cursor = { x: 330, y: 225 };
  frame = requestAnimationFrame(draw);
}
