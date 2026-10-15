import type { Direction } from './types.js';
import type { PlayerSpriteFrame } from './player-sprite.js';

let sheet: HTMLCanvasElement | null = null;

// Measured pose bounds in the supplied 209x326 artwork. Its rows and columns
// drift from the normal 23x36 grid; tight crops exclude neighboring poses.
const POSES = [
  [[2, 3, 20, 30], [23, 3, 20, 30], [45, 4, 20, 30], [67, 2, 21, 32], [89, 2, 20, 31], [112, 3, 20, 31], [133, 4, 20, 30], [156, 2, 20, 32], [178, 2, 20, 31]],
  [[3, 37, 19, 32], [25, 37, 19, 32], [47, 38, 19, 31], [69, 36, 19, 33], [91, 35, 19, 33], [113, 38, 19, 31], [135, 38, 20, 32], [157, 37, 20, 31], [180, 35, 20, 33]],
  [[3, 71, 18, 32], [25, 72, 18, 33], [47, 73, 18, 31], [69, 71, 18, 33], [92, 70, 18, 33], [114, 72, 18, 32], [137, 73, 17, 31], [159, 71, 18, 33], [181, 71, 19, 32]],
  [[2, 107, 20, 32], [24, 107, 20, 31], [46, 107, 20, 31], [68, 106, 20, 32], [91, 105, 19, 32], [113, 107, 20, 31], [135, 107, 20, 32], [157, 106, 20, 31], [180, 105, 20, 33]],
  [[1, 141, 21, 32], [23, 141, 21, 31], [45, 142, 21, 31], [68, 141, 20, 32], [90, 139, 20, 32], [112, 141, 21, 32], [134, 143, 21, 30], [157, 141, 21, 32], [179, 140, 21, 33]],
  [[2, 175, 20, 32], [24, 174, 19, 32], [47, 176, 19, 31], [69, 174, 19, 32], [91, 173, 19, 32], [112, 175, 20, 32], [135, 176, 19, 31], [158, 174, 20, 32], [180, 174, 20, 32]],
  [[4, 210, 17, 30], [25, 210, 18, 31], [47, 211, 18, 31], [69, 208, 18, 32], [92, 208, 17, 31], [114, 210, 17, 30], [136, 210, 17, 31], [158, 209, 18, 31], [181, 208, 18, 32]],
  [[3, 244, 19, 31], [24, 244, 20, 31], [47, 245, 20, 31], [69, 243, 19, 32], [91, 242, 20, 32], [113, 244, 20, 31], [135, 245, 20, 31], [158, 243, 20, 32], [180, 242, 20, 32]],
] as const;
const DIRECTION_ROWS: Record<Direction, number> = {
  down: 0, downRight: 1, right: 2, upRight: 3,
  up: 4, upLeft: 5, left: 6, downLeft: 7,
};

export function getGhostSpriteFrame(direction: Direction, frame: number, scale: number): PlayerSpriteFrame {
  const [sourceX, sourceY, sourceWidth, sourceHeight] = POSES[DIRECTION_ROWS[direction]]![frame % 9]!;
  return {
    sourceX, sourceY, sourceWidth, sourceHeight,
    width: sourceWidth * scale,
    height: sourceHeight * scale,
    // Keep the tail anchored above the player's ground position in every pose.
    baselineOffset: -2 * scale,
  };
}

/** The supplied sheet has a white matte. Clear only its connected background,
 * keeping enclosed white highlights and every original pose intact. */
export function getGhostSpriteSheet(image: HTMLImageElement): CanvasImageSource {
  if (sheet) return sheet;
  if (!image.complete || !image.naturalWidth) return image;
  sheet = document.createElement('canvas');
  const width = sheet.width = image.naturalWidth;
  const height = sheet.height = image.naturalHeight;
  const context = sheet.getContext('2d')!;
  context.drawImage(image, 0, 0);
  const pixels = context.getImageData(0, 0, width, height);
  const visited = new Uint8Array(width * height);
  const queue: number[] = [];
  const visit = (pixel: number): void => {
    if (visited[pixel]) return;
    visited[pixel] = 1;
    const offset = pixel * 4;
    if (pixels.data[offset + 3] !== 0 &&
      (pixels.data[offset]! < 250 || pixels.data[offset + 1]! < 250 || pixels.data[offset + 2]! < 250)) return;
    pixels.data[offset + 3] = 0;
    queue.push(pixel);
  };
  for (let x = 0; x < width; x++) { visit(x); visit((height - 1) * width + x); }
  for (let y = 0; y < height; y++) { visit(y * width); visit(y * width + width - 1); }
  for (let index = 0; index < queue.length; index++) {
    const pixel = queue[index]!;
    if (pixel % width > 0) visit(pixel - 1);
    if (pixel % width < width - 1) visit(pixel + 1);
    if (pixel >= width) visit(pixel - width);
    if (pixel < width * (height - 1)) visit(pixel + width);
  }
  context.putImageData(pixels, 0, 0);
  return sheet;
}
