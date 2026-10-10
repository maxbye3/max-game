import { requireElement } from './elements.js';
export { requireElement } from './elements.js';

export const canvas = requireElement<HTMLCanvasElement>('#game');

const canvasContext = canvas.getContext('2d');
if (!canvasContext) throw new Error('This browser does not support the 2D canvas context.');

export const context = canvasContext;
context.imageSmoothingEnabled = false;

// Keep the game pixels in the same proportions as the visible canvas. Portrait
// phones use a taller view; capped dimensions keep interior rooms from stretching.
const shell = typeof canvas.closest === 'function' ? canvas.closest<HTMLElement>('.game-shell') : null;
const portraitScreen = typeof window !== 'undefined' && typeof window.matchMedia === 'function'
  ? window.matchMedia('(max-width: 800px) and (orientation: portrait)') : null;
if (shell && portraitScreen && typeof ResizeObserver !== 'undefined') {
  const resizeCanvas = (): void => {
    if (shell.classList.contains('cave-shell')) return;
    const ratio = canvas.clientWidth / canvas.clientHeight;
    if (!Number.isFinite(ratio) || ratio <= 0) return;
    const width = portraitScreen.matches ? Math.min(512, Math.round(768 * ratio)) : 480;
    const height = portraitScreen.matches ? Math.min(768, Math.round(512 / ratio)) : 480;
    if (canvas.width === width && canvas.height === height) return;
    canvas.width = width;
    canvas.height = height;
    context.imageSmoothingEnabled = false;
  };
  new ResizeObserver(resizeCanvas).observe(canvas);
  portraitScreen.addEventListener('change', resizeCanvas);
  resizeCanvas();
}
