import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { readPng, rgbaAt } from './png.mjs';

function generateCollisionMask({ sourceName, outputName, prefix, sourceScale }) {
  const sourcePath = resolve(`img/internal/${sourceName}`);
  const image = readPng(readFileSync(sourcePath));
  const { width, height } = image;
  const worldCellSize = 2;
  const sourceCellSize = worldCellSize * sourceScale;
  const columns = Math.ceil(width / sourceCellSize);
  const rows = Math.ceil(height / sourceCellSize);
  const outputPath = resolve(`js/${outputName}`);
  const bits = Buffer.alloc(Math.ceil(columns * rows / 8));

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      let blocked = false;
      const firstX = column * sourceCellSize;
      const firstY = row * sourceCellSize;

      for (let y = firstY; y < Math.min(firstY + sourceCellSize, height) && !blocked; y += 1) {
        for (let x = firstX; x < Math.min(firstX + sourceCellSize, width); x += 1) {
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

  const source = `// Generated from img/internal/${sourceName}.\n` +
    `// Run npm run generate:internal-collision after editing that image.\n` +
    `export const ${prefix}_COLLISION_CELL_SIZE = ${worldCellSize};\n` +
    `export const ${prefix}_COLLISION_COLUMNS = ${columns};\n` +
    `export const ${prefix}_COLLISION_ROWS = ${rows};\n` +
    `export const ${prefix}_COLLISION_BITS = '${bits.toString('base64')}';\n`;

  writeFileSync(outputPath, source);
  console.log(`Generated ${outputPath} (${columns}x${rows} collision cells).`);
}

generateCollisionMask({
  sourceName: 'diary-lab-collision.png',
  outputName: 'internal-collision-mask.ts',
  prefix: 'INTERNAL',
  sourceScale: 1,
});

generateCollisionMask({
  sourceName: 'cinema-collisions.png',
  outputName: 'cinema-collision-mask.ts',
  prefix: 'CINEMA',
  sourceScale: 1,
});
