import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { readPng, scaleNearest, writePng } from './png.mjs';

const assets = [
  'img/internal/diary-lab.png',
  'img/internal/diary-lab-collision.png',
  'img/internal/diary-lab-doors-out.png',
];

for (const asset of assets) {
  const path = resolve(asset);
  const image = readPng(readFileSync(path));
  const resized = scaleNearest(image, 0.5);
  writeFileSync(path, writePng(resized));
  console.log(`${asset}: ${image.width}x${image.height} -> ${resized.width}x${resized.height}`);
}
