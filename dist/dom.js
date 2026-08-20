/** Looks up a required element up front, so a markup change fails loudly. */
export function requireElement(selector) {
    const element = document.querySelector(selector);
    if (!element)
        throw new Error(`Missing required element: ${selector}`);
    return element;
}
export const canvas = requireElement('#game');
const canvasContext = canvas.getContext('2d');
if (!canvasContext)
    throw new Error('This browser does not support the 2D canvas context.');
export const context = canvasContext;
context.imageSmoothingEnabled = false;
//# sourceMappingURL=dom.js.map