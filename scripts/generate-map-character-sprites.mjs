import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { readPng, writePng } from './png.mjs';

const CHARACTERS = [
  ['alex-w', 'character-assets/alex-w/player/avatar.png'],
  ['alice', 'character-assets/alice/player/avatar.png'],
  ['aliya', 'character-assets/aliya/avatar.png'],
  ['andy', 'character-assets/andy/avatar.png'],
  ['bochra', 'character-assets/bochra/player/avatar.png'],
  ['chris', 'character-assets/chris/player/avatar.png'],
  ['dan', 'character-assets/dan/player/avatar.png'],
  ['helen', 'character-assets/helen/player/avatar.png'],
  ['joe', 'character-assets/joe/player/avatar.png'],
  ['ju', 'character-assets/ju/player/avatar.png'],
  ['julian', 'character-assets/julian/player/avatar.png'],
  ['katie', 'character-assets/katie/player/avatar.png'],
  ['katy', 'character-assets/katy/avatar.png'],
  ['lucy', 'character-assets/lucy/player/avatar.png'],
  ['maddy', 'character-assets/maddy/avatar.png'],
  ['marina-d', 'character-assets/marina-d/player/avatar.png'],
  ['mason', 'character-assets/mason/player/avatar.png'],
  ['meli', 'character-assets/meli/player/avatar.png'],
  ['noel', 'character-assets/noel/player/avatar.png'],
  ['oscar', 'character-assets/oscar/avatar.png'],
  ['sam', 'character-assets/sam/avatar.png'],
  ['tim', 'character-assets/tim/avatar.png'],
];

const TARGET_HEIGHT = 52;
const BACKGROUND_THRESHOLD = 56;

function pixelOffset(image, x, y) {
  return (y * image.width + x) * image.bpp;
}

function isTransparent(image, x, y) {
  return image.bpp === 4 && (image.pixels[pixelOffset(image, x, y) + 3] ?? 255) === 0;
}

function isBackgroundPixel(image, x, y) {
  if (isTransparent(image, x, y)) return true;
  const offset = pixelOffset(image, x, y);
  return (
    (image.pixels[offset] ?? 0) <= BACKGROUND_THRESHOLD &&
    (image.pixels[offset + 1] ?? 0) <= BACKGROUND_THRESHOLD &&
    (image.pixels[offset + 2] ?? 0) <= BACKGROUND_THRESHOLD
  );
}

function toRgba(image) {
  if (image.bpp === 4) return Buffer.from(image.pixels);

  const pixels = Buffer.alloc(image.width * image.height * 4);
  for (let index = 0; index < image.width * image.height; index += 1) {
    pixels[index * 4] = image.pixels[index * 3] ?? 0;
    pixels[index * 4 + 1] = image.pixels[index * 3 + 1] ?? 0;
    pixels[index * 4 + 2] = image.pixels[index * 3 + 2] ?? 0;
    pixels[index * 4 + 3] = 255;
  }
  return pixels;
}

function makeTransparent(image) {
  const pixels = toRgba(image);
  const rgbaImage = { ...image, bpp: 4, pixels };
  const queued = [];
  const seen = new Uint8Array(image.width * image.height);

  const enqueue = (x, y) => {
    if (x < 0 || x >= image.width || y < 0 || y >= image.height) return;
    const index = y * image.width + x;
    if (seen[index] || !isBackgroundPixel(rgbaImage, x, y)) return;
    seen[index] = 1;
    queued.push([x, y]);
  };

  for (let x = 0; x < image.width; x += 1) {
    enqueue(x, 0);
    enqueue(x, image.height - 1);
  }
  for (let y = 0; y < image.height; y += 1) {
    enqueue(0, y);
    enqueue(image.width - 1, y);
  }

  while (queued.length > 0) {
    const [x, y] = queued.pop();
    pixels[(y * image.width + x) * 4 + 3] = 0;
    enqueue(x + 1, y);
    enqueue(x - 1, y);
    enqueue(x, y + 1);
    enqueue(x, y - 1);
  }

  return { width: image.width, height: image.height, colorType: 6, bpp: 4, pixels };
}

function cropToAlpha(image) {
  let minX = image.width;
  let minY = image.height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      const alpha = image.pixels[(y * image.width + x) * 4 + 3] ?? 0;
      if (alpha === 0) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  if (maxX < minX || maxY < minY) return image;

  const padding = 2;
  minX = Math.max(0, minX - padding);
  minY = Math.max(0, minY - padding);
  maxX = Math.min(image.width - 1, maxX + padding);
  maxY = Math.min(image.height - 1, maxY + padding);

  const width = maxX - minX + 1;
  const height = maxY - minY + 1;
  const pixels = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const sourceOffset = ((minY + y) * image.width + minX + x) * 4;
      const targetOffset = (y * width + x) * 4;
      image.pixels.copy(pixels, targetOffset, sourceOffset, sourceOffset + 4);
    }
  }

  return { width, height, colorType: 6, bpp: 4, pixels };
}

function scaleToHeight(image, targetHeight) {
  const height = Math.max(1, Math.round(targetHeight));
  const scale = height / image.height;
  const width = Math.max(1, Math.round(image.width * scale));
  const pixels = Buffer.alloc(width * height * 4);

  for (let y = 0; y < height; y += 1) {
    const sourceY = Math.min(image.height - 1, Math.floor(y / scale));
    for (let x = 0; x < width; x += 1) {
      const sourceX = Math.min(image.width - 1, Math.floor(x / scale));
      const sourceOffset = (sourceY * image.width + sourceX) * 4;
      const targetOffset = (y * width + x) * 4;
      image.pixels.copy(pixels, targetOffset, sourceOffset, sourceOffset + 4);
    }
  }

  return { width, height, colorType: 6, bpp: 4, pixels };
}

for (const [name, source] of CHARACTERS) {
  const target = `img/generated/characters/${name}-map-sprite.png`;
  const image = readPng(readFileSync(resolve(source)));
  const sprite = scaleToHeight(cropToAlpha(makeTransparent(image)), TARGET_HEIGHT);
  mkdirSync(dirname(resolve(target)), { recursive: true });
  writeFileSync(resolve(target), writePng(sprite));
  console.log(`Generated ${target}`);
}
