import { isLucyPowerActive, setLucyAim, stopLucyFiring } from './lucy-power.js';

let cameraX = 0; let cameraY = 0; let scaleX = 1; let scaleY = 1;
let pointer: { x: number; y: number } | null = null;
let firingPointer: number | null = null;
let gameCanvas: HTMLCanvasElement;
let originalCursor = '';
let originalTouchAction = '';
function updateAim(): void {
  if (!pointer) return;
  const bounds = gameCanvas.getBoundingClientRect();
  if (!bounds.width || !bounds.height) return;
  setLucyAim(cameraX + (pointer.x - bounds.left) * gameCanvas.width / bounds.width / scaleX,
    cameraY + (pointer.y - bounds.top) * gameCanvas.height / bounds.height / scaleY, firingPointer !== null);
}
export function updateLucyPointerView(x: number, y: number, sx = 1, sy = 1): void {
  cameraX = x; cameraY = y; scaleX = sx; scaleY = sy;
  if (!gameCanvas) return;
  const active = isLucyPowerActive();
  gameCanvas.style.cursor = active ? 'crosshair' : originalCursor;
  gameCanvas.style.touchAction = active ? 'none' : originalTouchAction;
  if (!active) { firingPointer = null; stopLucyFiring(); }
  updateAim();
}
export function setupLucyPowerInput(canvas: HTMLCanvasElement): void {
  gameCanvas = canvas; originalCursor = canvas.style.cursor; originalTouchAction = canvas.style.touchAction;
  const release = (): void => { firingPointer = null; stopLucyFiring(); };
  canvas.addEventListener('pointerdown', (event) => {
    if (!isLucyPowerActive() || event.button !== 0 || firingPointer !== null) return;
    event.preventDefault(); firingPointer = event.pointerId;
    pointer = { x: event.clientX, y: event.clientY }; updateAim();
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove', (event) => {
    if (firingPointer !== null && event.pointerId !== firingPointer) return;
    pointer = { x: event.clientX, y: event.clientY }; updateAim();
    if (isLucyPowerActive() && firingPointer !== null) event.preventDefault();
  });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture'] as const) {
    canvas.addEventListener(type, (event) => { if (event.pointerId === firingPointer) release(); });
  }
  window.addEventListener('blur', release);
  window.addEventListener('max-game:lucy-power-activated', release);
  document.addEventListener('visibilitychange', () => { if (document.hidden) release(); });
}
