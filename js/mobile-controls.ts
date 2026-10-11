import type { InputDirection } from './types.js';

const MODES = ['stick', 'pad', 'split'] as const;
const LABELS = { stick: 'Thumbstick', pad: 'D-pad', split: 'Screen sides' };
const STORAGE_KEY = 'max-game:mobile-controls';

/** Mobile layouts share the same direction inputs as the keyboard. */
export function setupMobileControls(
  changeDirection: (direction: InputDirection, held: boolean) => void,
  releaseAll: () => void,
): () => void {
  const controls = document.querySelector<HTMLElement>('.controls');
  const toggle = document.querySelector<HTMLButtonElement>('#controls-toggle');
  if (!controls || !toggle) return () => {};

  const stick = document.createElement('div');
  stick.className = 'mobile-thumbstick';
  stick.setAttribute('role', 'group');
  stick.setAttribute('aria-label', 'Drag the thumbstick to move in any direction');
  const thumb = document.createElement('span');
  thumb.className = 'mobile-thumbstick-knob';
  thumb.setAttribute('aria-hidden', 'true');
  stick.append(thumb);

  const split = document.createElement('div');
  split.className = 'mobile-split-controls';
  split.setAttribute('role', 'group');
  split.setAttribute('aria-label', 'Screen side movement buttons');
  const directions: ReadonlyArray<readonly [InputDirection, string]> = [
    ['up', '↑'], ['down', '↓'], ['left', '←'], ['right', '→'],
  ];
  for (const [direction, symbol] of directions) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'dpad-button mobile-split-button';
    button.dataset.directions = direction;
    button.setAttribute('aria-label', `Move ${direction}`);
    const key = document.createElement('span');
    key.className = 'mobile-split-key';
    key.setAttribute('aria-hidden', 'true');
    key.textContent = symbol;
    button.append(key);
    split.append(button);
  }
  controls.append(stick, split);

  let pointerId: number | null = null;
  let heldDirections: InputDirection[] = [];
  const setDirections = (directions: InputDirection[]) => {
    for (const direction of heldDirections) {
      if (!directions.includes(direction)) changeDirection(direction, false);
    }
    for (const direction of directions) {
      if (!heldDirections.includes(direction)) changeDirection(direction, true);
    }
    heldDirections = directions;
  };
  const resetStick = () => {
    const capturedPointer = pointerId;
    pointerId = null;
    setDirections([]);
    thumb.style.transform = '';
    stick.classList.remove('pressed');
    if (capturedPointer !== null && stick.hasPointerCapture(capturedPointer)) {
      stick.releasePointerCapture(capturedPointer);
    }
  };
  const moveStick = (event: PointerEvent) => {
    const bounds = stick.getBoundingClientRect();
    const dx = event.clientX - bounds.left - bounds.width / 2;
    const dy = event.clientY - bounds.top - bounds.height / 2;
    const distance = Math.hypot(dx, dy);
    const radius = bounds.width * 0.3;
    const scale = distance > radius ? radius / distance : 1;
    thumb.style.transform = `translate(${dx * scale}px, ${dy * scale}px)`;
    const directions: InputDirection[] = [];
    if (distance > bounds.width * 0.1) {
      if (Math.abs(dx) > distance * 0.38) directions.push(dx < 0 ? 'left' : 'right');
      if (Math.abs(dy) > distance * 0.38) directions.push(dy < 0 ? 'up' : 'down');
    }
    setDirections(directions);
  };
  stick.addEventListener('pointerdown', (event) => {
    if (pointerId !== null || event.button !== 0) return;
    event.preventDefault();
    pointerId = event.pointerId;
    stick.setPointerCapture(pointerId);
    stick.classList.add('pressed');
    moveStick(event);
  });
  stick.addEventListener('pointermove', (event) => {
    if (event.pointerId !== pointerId) return;
    event.preventDefault();
    moveStick(event);
  });
  for (const name of ['pointerup', 'pointercancel', 'lostpointercapture'] as const) {
    stick.addEventListener(name, (event) => {
      if (event.pointerId === pointerId) resetStick();
    });
  }

  let mode: typeof MODES[number] = 'stick';
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    mode = MODES.find((option) => option === saved) ?? 'stick';
  } catch {}
  const applyMode = () => {
    releaseAll();
    controls.dataset.mobileControls = mode;
    toggle.textContent = 'Toggle Controls';
    toggle.setAttribute('aria-label', `Toggle Controls. Current layout: ${LABELS[mode]}.`);
    try { localStorage.setItem(STORAGE_KEY, mode); } catch {}
  };
  toggle.addEventListener('click', () => {
    mode = MODES[(MODES.indexOf(mode) + 1) % MODES.length] ?? 'stick';
    applyMode();
  });
  window.addEventListener('resize', releaseAll);
  applyMode();
  return resetStick;
}
