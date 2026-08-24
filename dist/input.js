/** Physical keys, so the controls survive AZERTY, Dvorak and non-Latin layouts. */
const DIRECTION_CODES = {
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
const heldDirections = new Map();
const heldCodes = new Set();
const releaseButtonHandlers = [];
export const isHeld = (direction) => heldDirections.has(direction);
function holdDirection(direction) {
    heldDirections.set(direction, (heldDirections.get(direction) ?? 0) + 1);
}
function releaseDirection(direction) {
    const remaining = (heldDirections.get(direction) ?? 0) - 1;
    if (remaining > 0)
        heldDirections.set(direction, remaining);
    else
        heldDirections.delete(direction);
}
function pressCode(code) {
    const direction = DIRECTION_CODES[code];
    if (!direction || heldCodes.has(code))
        return;
    heldCodes.add(code);
    holdDirection(direction);
}
function releaseCode(code) {
    const direction = DIRECTION_CODES[code];
    if (!direction || !heldCodes.delete(code))
        return;
    releaseDirection(direction);
}
export function releaseAllInput() {
    heldCodes.clear();
    heldDirections.clear();
    releaseButtonHandlers.forEach((release) => release());
}
function parseDirections(button) {
    const directions = button.dataset.directions;
    if (!directions)
        return [];
    return directions.split(' ').filter((value) => value === 'up' || value === 'down' || value === 'left' || value === 'right');
}
function bindDpadButton(button) {
    const directions = parseDirections(button);
    let heldPointerId = null;
    let isPressed = false;
    const press = () => {
        if (isPressed)
            return;
        isPressed = true;
        directions.forEach(holdDirection);
        button.classList.add('pressed');
    };
    const release = () => {
        if (!isPressed)
            return;
        isPressed = false;
        directions.forEach(releaseDirection);
        button.classList.remove('pressed');
    };
    releaseButtonHandlers.push(() => {
        isPressed = false;
        button.classList.remove('pressed');
    });
    button.addEventListener('pointerdown', (event) => {
        event.preventDefault();
        heldPointerId = event.pointerId;
        press();
        // Throws if the pointer was already released between dispatch and here.
        try {
            button.setPointerCapture?.(event.pointerId);
        }
        catch { }
    });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((type) => {
        button.addEventListener(type, (event) => {
            event.preventDefault();
            heldPointerId = null;
            release();
        });
    });
    button.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ')
            return;
        event.preventDefault();
        if (!event.repeat)
            press();
    });
    button.addEventListener('keyup', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ')
            return;
        event.preventDefault();
        release();
    });
    // Tabbing away mid-press means the keyup never arrives; a finger still on the
    // button is tracked by its pointer and must not be released here.
    button.addEventListener('blur', () => {
        if (heldPointerId === null)
            release();
    });
}
export function setupInput() {
    document.querySelectorAll('.dpad-button').forEach(bindDpadButton);
    window.addEventListener('keydown', (event) => {
        // Let the browser own its shortcuts, and drop any key held when a modifier
        // arrives: the matching keyup is not always delivered while one is down.
        if (event.ctrlKey || event.metaKey || event.altKey) {
            [...heldCodes].forEach(releaseCode);
            return;
        }
        if (DIRECTION_CODES[event.code]) {
            event.preventDefault();
            pressCode(event.code);
        }
    });
    window.addEventListener('keyup', (event) => releaseCode(event.code));
    window.addEventListener('blur', releaseAllInput);
}
//# sourceMappingURL=input.js.map