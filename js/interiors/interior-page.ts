import { canvas, requireElement } from '../core/dom.js';
import type { InteriorScene } from './interior-scenes.js';

export function setInteriorPageIdentity(scene: InteriorScene): void {
  document.title = scene.title;
  requireElement<HTMLLinkElement>('#room-favicon').href = `../img/favicons/${scene.kind}.svg`;
  canvas.setAttribute('aria-label', scene.ariaLabel);
}
