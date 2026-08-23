import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { readPng, rgbaAt } from './png.mjs';

const sourcePath = resolve('img/internal/diary-lab-collision.png');
const image = readPng(readFileSync(sourcePath));
const { width, height } = image;
const cellSize = 2;
const columns = Math.ceil(width / cellSize);
const rows = Math.ceil(height / cellSize);
const outputPath = resolve('js/internal-collision-mask.ts');
const bits = Buffer.alloc(Math.ceil(columns * rows / 8));

for (let row = 0; row < rows; row += 1) {
  for (let column = 0; column < columns; column += 1) {
    let blocked = false;
    const firstX = column * cellSize;
    const firstY = row * cellSize;

    for (let y = firstY; y < Math.min(firstY + cellSize, height) && !blocked; y += 1) {
      for (let x = firstX; x < Math.min(firstX + cellSize, width); x += 1) {
        const [red, green, blue] = rgbaAt(image, x, y);
        if (red < 80 && green > 150 && blue > 150) {
          blocked = true;
          break;
        }
      }
    }

    if (blocked) {
      const cellIndex = row * columns + column;
      bits[Math.floor(cellIndex / 8)] |= 1 << (cellIndex % 8);
    }
  }
}

const source = `// Generated from img/internal/diary-lab-collision.png.\n` +
  `// Run npm run generate:internal-collision after editing that image.\n` +
  `export const INTERNAL_COLLISION_CELL_SIZE = ${cellSize};\n` +
  `export const INTERNAL_COLLISION_COLUMNS = ${columns};\n` +
  `export const INTERNAL_COLLISION_ROWS = ${rows};\n` +
  `export const INTERNAL_COLLISION_BITS = '${bits.toString('base64')}';\n`;

writeFileSync(outputPath, source);
console.log(`Generated ${outputPath} (${columns}x${rows} collision cells).`);
