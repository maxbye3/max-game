import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { readPng, writePng } from './png.mjs';

const OUTPUTS = [
  {
    source: 'chat/niall/avatar.png',
    target: 'img/battle/niall-avatar.png',
    // Keep Niall's dark hair and jacket intact; the previous threshold treated
    // those connected pixels as part of the black background.
    threshold: 5,
  },
  {
    source: 'player/avatar.png',
    target: 'img/battle/max-avatar.png',
    threshold: 42,
  },
];

function isBackgroundPixel(image, x, y, threshold) {
  const offset = (y * image.width + x) * image.bpp;
  const red = image.pixels[offset] ?? 0;
  const green = image.pixels[offset + 1] ?? 0;
  const blue = image.pixels[offset + 2] ?? 0;
  const alpha = image.bpp === 4 ? image.pixels[offset + 3] ?? 255 : 255;
  return alpha > 0 && red <= threshold && green <= threshold && blue <= threshold;
}

function makeTransparent(image, threshold) {
  const output = image.bpp === 4
    ? Buffer.from(image.pixels)
    : Buffer.alloc(image.width * image.height * 4);

  if (image.bpp === 3) {
    for (let index = 0; index < image.width * image.height; index += 1) {
      output[index * 4] = image.pixels[index * 3] ?? 0;
      output[index * 4 + 1] = image.pixels[index * 3 + 1] ?? 0;
      output[index * 4 + 2] = image.pixels[index * 3 + 2] ?? 0;
      output[index * 4 + 3] = 255;
    }
  }

  const queued = [];
  const seen = new Uint8Array(image.width * image.height);
  const rgbaImage = { ...image, pixels: output, bpp: 4 };
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
    output[offset + 3] = 0;
    enqueue(x + 1, y);
    enqueue(x - 1, y);
    enqueue(x, y + 1);
    enqueue(x, y - 1);
  }

  return { width: image.width, height: image.height, colorType: 6, pixels: output };
}

for (const { source, target, threshold } of OUTPUTS) {
  const sourcePath = resolve(source);
  const targetPath = resolve(target);
  const image = readPng(readFileSync(sourcePath));
  mkdirSync(dirname(targetPath), { recursive: true });
  writeFileSync(targetPath, writePng(makeTransparent(image, threshold)));
  console.log(`Generated ${target}`);
}
