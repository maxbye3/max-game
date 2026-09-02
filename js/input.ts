import type { InputDirection } from './types.js';

/** Physical keys, so the controls survive AZERTY, Dvorak and non-Latin layouts. */
const DIRECTION_CODES: Record<string, InputDirection> = {
  ArrowUp: 'up',
  KeyW: 'up',
  ArrowDown: 'down',
  KeyS: 'down',
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
};

/**
 * Several controls can assert the same direction at once - the up and up-left
 * buttons under two thumbs, or a d-pad button plus the keyboard - so this is a
 * reference count, not a set. Releasing one must not cancel the other.
 */
function parseDirections(button: HTMLElement): InputDirection[] {
  const directions = button.dataset.directions;
  if (!directions) return [];
  return directions.split(' ').filter((value): value is InputDirection =>
    value === 'up' || value === 'down' || value === 'left' || value === 'right');
}

interface DirectionInputOptions {
  readonly canHold?: () => boolean;
}

export class DirectionInputController {
  private readonly heldDirections = new Map<InputDirection, number>();
  private readonly heldCodes = new Set<string>();
  private readonly releaseButtonHandlers: Array<() => void> = [];

  constructor(private readonly options: DirectionInputOptions = {}) {}

  isHeld(direction: InputDirection): boolean {
    return this.heldDirections.has(direction);
  }

  releaseAll(): void {
    this.heldCodes.clear();
    this.heldDirections.clear();
    this.releaseButtonHandlers.forEach((release) => release());
  }

  setup(): void {
    document.querySelectorAll<HTMLElement>('.dpad-button').forEach((button) => this.bindDpadButton(button));
    window.addEventListener('keydown', (event) => {
      if (event.ctrlKey || event.metaKey || event.altKey) {
        this.releaseAll();
        return;
      }
      if (!DIRECTION_CODES[event.code]) return;
      event.preventDefault();
      this.pressCode(event.code);
    });
    window.addEventListener('keyup', (event) => this.releaseCode(event.code));
    window.addEventListener('blur', () => this.releaseAll());
  }

  private holdDirection(direction: InputDirection): void {
    if (this.options.canHold && !this.options.canHold()) return;
    this.heldDirections.set(direction, (this.heldDirections.get(direction) ?? 0) + 1);
  }

  private releaseDirection(direction: InputDirection): void {
    const remaining = (this.heldDirections.get(direction) ?? 0) - 1;
    if (remaining > 0) this.heldDirections.set(direction, remaining);
    else this.heldDirections.delete(direction);
  }

  private pressCode(code: string): void {
    const direction = DIRECTION_CODES[code];
    if (!direction || this.heldCodes.has(code)) return;
    this.heldCodes.add(code);
    this.holdDirection(direction);
  }

  private releaseCode(code: string): void {
    const direction = DIRECTION_CODES[code];
    if (!direction || !this.heldCodes.delete(code)) return;
    this.releaseDirection(direction);
  }

  private bindDpadButton(button: HTMLElement): void {
    const directions = parseDirections(button);
    let heldPointerId: number | null = null;
    let pressed = false;
    const press = () => {
      if (pressed) return;
      pressed = true;
      directions.forEach((direction) => this.holdDirection(direction));
      button.classList.add('pressed');
    };
    const release = () => {
      if (!pressed) return;
      pressed = false;
      directions.forEach((direction) => this.releaseDirection(direction));
      button.classList.remove('pressed');
    };

    this.releaseButtonHandlers.push(release);
    button.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      heldPointerId = event.pointerId;
      press();
      try { button.setPointerCapture(event.pointerId); } catch {}
    });
    (['pointerup', 'pointercancel', 'lostpointercapture'] as const).forEach((type) => {
      button.addEventListener(type, (event) => {
        event.preventDefault();
        heldPointerId = null;
        release();
      });
    });
    button.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      if (!event.repeat) press();
    });
    button.addEventListener('keyup', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      release();
    });
    button.addEventListener('blur', () => {
      if (heldPointerId === null) release();
    });
  }
}

const overworldInput = new DirectionInputController();
export const isHeld = (direction: InputDirection) => overworldInput.isHeld(direction);
export const releaseAllInput = () => overworldInput.releaseAll();
export const setupInput = () => overworldInput.setup();
