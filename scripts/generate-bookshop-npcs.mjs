import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { readPng, writePng } from './png.mjs';

const OUTPUTS = [
  {
    source: 'chat/alex w/avatar.png',
    target: 'chat/alex w/bookshop-sprite.png',
    height: 82,
    threshold: 48,
  },
  {
    source: 'chat/helen/avatar.png',
    target: 'chat/helen/bookshop-sprite.png',
    height: 84,
    threshold: 48,
  },
];

function rgbaAt(image, x, y) {
  const offset = (y * image.width + x) * image.bpp;
  return [
    image.pixels[offset] ?? 0,
    image.pixels[offset + 1] ?? 0,
    image.pixels[offset + 2] ?? 0,
    image.bpp === 4 ? image.pixels[offset + 3] ?? 255 : 255,
  ];
}

function isBackgroundPixel(image, x, y, threshold) {
  const [red, green, blue, alpha] = rgbaAt(image, x, y);
  return alpha > 0 && red <= threshold && green <= threshold && blue <= threshold;
}

function toRgba(image) {
  if (image.bpp === 4) return Buffer.from(image.pixels);

  const output = Buffer.alloc(image.width * image.height * 4);
  for (let index = 0; index < image.width * image.height; index += 1) {
    output[index * 4] = image.pixels[index * 3] ?? 0;
    output[index * 4 + 1] = image.pixels[index * 3 + 1] ?? 0;
    output[index * 4 + 2] = image.pixels[index * 3 + 2] ?? 0;
    output[index * 4 + 3] = 255;
  }
  return output;
}

function makeTransparent(image, threshold) {
  const pixels = toRgba(image);
  const rgbaImage = { ...image, bpp: 4, pixels };
  const queued = [];
  const seen = new Uint8Array(image.width * image.height);

  const enqueue = (x, y) => {
    if (x < 0 || x >= image.width || y < 0 || y >= image.height) return;
    const index = y * image.width + x;
    if (seen[index] || !isBackgroundPixel(rgbaImage, x, y, threshold)) return;
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
    const offset = (y * image.width + x) * 4;
    pixels[offset + 3] = 0;
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

for (const { source, target, height, threshold } of OUTPUTS) {
  const sourcePath = resolve(source);
  const targetPath = resolve(target);
  const image = readPng(readFileSync(sourcePath));
  const sprite = scaleToHeight(cropToAlpha(makeTransparent(image, threshold)), height);
  mkdirSync(dirname(targetPath), { recursive: true });
  writeFileSync(targetPath, writePng(sprite));
  console.log(`Generated ${target}`);
}
