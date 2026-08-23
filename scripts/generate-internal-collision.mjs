import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const width = 1024;
const height = 1536;
const cellSize = 4;
const columns = Math.ceil(width / cellSize);
const rows = Math.ceil(height / cellSize);
const sourcePath = resolve('img/internal/diary-lab-collision.png');
const outputPath = resolve('js/internal-collision-mask.ts');

const result = spawnSync(
  'magick',
  [sourcePath, '-alpha', 'off', '-depth', '8', 'rgba:-'],
  { encoding: null, maxBuffer: 16 * 1024 * 1024 },
);

if (result.status !== 0 || !result.stdout) {
  throw new Error(result.stderr?.toString() || 'Could not read the interior collision image.');
}

const pixels = result.stdout;
const bits = Buffer.alloc(Math.ceil(columns * rows / 8));

for (let row = 0; row < rows; row += 1) {
  for (let column = 0; column < columns; column += 1) {
    let blocked = false;
    const firstX = column * cellSize;
    const firstY = row * cellSize;

    for (let y = firstY; y < Math.min(firstY + cellSize, height) && !blocked; y += 1) {
      for (let x = firstX; x < Math.min(firstX + cellSize, width); x += 1) {
        const pixelIndex = (y * width + x) * 4;
        const red = pixels[pixelIndex] ?? 0;
        const green = pixels[pixelIndex + 1] ?? 0;
        const blue = pixels[pixelIndex + 2] ?? 0;
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
