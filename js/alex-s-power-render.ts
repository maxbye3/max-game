import { getAlexResurrection } from './alex-s-power.js';
import { resolveSiteAsset } from './site-assets.js';
import { webImageSource } from './web-images.js';

let sprite: HTMLImageElement | null = null;
let spriteSource = '';

/** The temporary resurrection follows the player in either world or room. */
export function drawAlexResurrection(context: CanvasRenderingContext2D, playerX: number, playerY: number, animationTime: number, scaleX = 1, scaleY = 1): void {
  const character = getAlexResurrection();
  if (!character) return;
  if (spriteSource !== character.imageSource) {
    spriteSource = character.imageSource;
    sprite = new Image(); sprite.src = resolveSiteAsset(webImageSource(spriteSource));
  }
  const height = 52 * scaleY;
  const ratio = character.frame ? character.frame[2] / character.frame[3] : (sprite?.naturalWidth ?? 1) / (sprite?.naturalHeight || 1);
  const width = Math.min(80 * scaleX, height * ratio);
  const x = Math.max(width / 2 + 8, Math.min(context.canvas.width - width / 2 - 8, playerX + 48 * scaleX));
  const y = Math.max(height + 8, Math.min(context.canvas.height - 12, playerY + 10 * scaleY));
  context.save();
  context.imageSmoothingEnabled = false;
  context.fillStyle = '#f4c273'; context.globalAlpha = 0.35;
  context.beginPath(); context.ellipse(x, y, width * 0.7, 9 * scaleY, 0, 0, Math.PI * 2); context.fill();
  const bob = Math.sin(animationTime / 330) * 4 * scaleY;
  if (sprite?.complete && sprite.naturalWidth > 0) {
    context.globalAlpha = 0.85; context.shadowColor = '#ffe49c'; context.shadowBlur = 14;
    const frame = character.frame ?? [0, 0, sprite.naturalWidth, sprite.naturalHeight];
    context.drawImage(sprite, frame[0]!, frame[1]!, frame[2]!, frame[3]!, Math.round(x - width / 2), Math.round(y - height - 5 + bob), width, height);
    context.shadowBlur = 0;
  }
  for (let index = 0; index < 5; index += 1) {
    const phase = animationTime / 620 + index * Math.PI * 2 / 5;
    const tx = x + Math.cos(phase) * (width * 0.65 + 8);
    const ty = y - height / 2 + Math.sin(phase) * height * 0.6;
    context.globalAlpha = 0.9; context.fillStyle = '#ae6839'; context.fillRect(tx - 5, ty - 6, 10, 12);
    context.fillStyle = '#ffdda0'; context.fillRect(tx - 3, ty - 4, 6, 8);
  }
  context.restore();
}
