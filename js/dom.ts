import { requireElement } from './elements.js';
export { requireElement } from './elements.js';

export const canvas = requireElement<HTMLCanvasElement>('#game');

const canvasContext = canvas.getContext('2d');
if (!canvasContext) throw new Error('This browser does not support the 2D canvas context.');

export const context = canvasContext;
context.imageSmoothingEnabled = false;
