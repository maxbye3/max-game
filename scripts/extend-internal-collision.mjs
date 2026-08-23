import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { readPng, writePng } from './png.mjs';

const collisionPath = resolve('img/internal/diary-lab-collision.png');
const image = readPng(readFileSync(collisionPath));

// Rectangles translated from the annotated in-game screenshot into world pixels.
const additionalCollisionRects = [
  { x: 67, y: 204, width: 131, height: 42 },
  { x: 277, y: 208, width: 137, height: 54 },
  { x: 86, y: 395, width: 112, height: 54 },
  { x: 375, y: 388, width: 97, height: 54 },
];

for (const rect of additionalCollisionRects) {
  for (let y = rect.y; y < rect.y + rect.height; y += 1) {
    for (let x = rect.x; x < rect.x + rect.width; x += 1) {
      const offset = (y * image.width + x) * image.bpp;
      image.pixels[offset] = 0;
      image.pixels[offset + 1] = 253;
      image.pixels[offset + 2] = 255;
      if (image.bpp === 4) image.pixels[offset + 3] = 255;
    }
  }
}

writeFileSync(collisionPath, writePng(image));
console.log(`Extended ${collisionPath} with ${additionalCollisionRects.length} collision rectangles.`);
