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

function generateOutlinedCollisionMask({ guideName, cleanName, outputName, prefix, sourceScale }) {
  const guide = readPng(readFileSync(resolve(`img/internal/${guideName}`)));
  const clean = readPng(readFileSync(resolve(`img/internal/${cleanName}`)));
  if (guide.width !== clean.width || guide.height !== clean.height) {
    throw new Error(`${guideName} and ${cleanName} must have matching dimensions.`);
  }

  const worldCellSize = 2;
  const sourceCellSize = worldCellSize * sourceScale;
  const columns = Math.ceil(guide.width / sourceCellSize);
  const rows = Math.ceil(guide.height / sourceCellSize);
  const barriers = new Uint8Array(columns * rows);

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const firstX = column * sourceCellSize;
      const firstY = row * sourceCellSize;
      let isBarrier = false;
      for (let y = firstY; y < Math.min(firstY + sourceCellSize, guide.height) && !isBarrier; y += 1) {
        for (let x = firstX; x < Math.min(firstX + sourceCellSize, guide.width); x += 1) {
          const guidePixel = rgbaAt(guide, x, y);
          const cleanPixel = rgbaAt(clean, x, y);
          if (guidePixel.some((channel, index) => channel !== cleanPixel[index])) {
            isBarrier = true;
            break;
          }
        }
      }
      if (isBarrier) barriers[row * columns + column] = 1;
    }
  }

  // The guide intentionally leaves the entrance open. Close it only while
  // flood-filling so the exterior does not become part of the walkable floor;
  // internal.ts reopens the doorway when the player approaches it.
  const entranceRow = Math.floor(1300 / sourceCellSize);
  const entranceStartColumn = Math.floor(406 / sourceCellSize);
  const entranceEndColumn = Math.ceil(683 / sourceCellSize);
  for (let column = entranceStartColumn; column <= entranceEndColumn; column += 1) {
    barriers[entranceRow * columns + column] = 1;
  }

  // The left outline pauses where the bar cabinet itself forms the wall.
  // Bridge that short visual gap so the flood fill still sees one enclosure.
  const leftWallColumn = Math.floor(204 / sourceCellSize);
  const leftWallStartRow = Math.floor(930 / sourceCellSize);
  const leftWallEndRow = Math.ceil(985 / sourceCellSize);
  for (let row = leftWallStartRow; row <= leftWallEndRow; row += 1) {
    barriers[row * columns + leftWallColumn] = 1;
  }

  const reachable = new Uint8Array(columns * rows);
  const seedColumn = Math.floor(543 / sourceCellSize);
  const seedRow = Math.floor(900 / sourceCellSize);
  const queue = [seedRow * columns + seedColumn];
  reachable[queue[0]] = 1;

  for (let queueIndex = 0; queueIndex < queue.length; queueIndex += 1) {
    const cellIndex = queue[queueIndex];
    const column = cellIndex % columns;
    const row = Math.floor(cellIndex / columns);
    const neighbors = [
      column > 0 ? cellIndex - 1 : -1,
      column + 1 < columns ? cellIndex + 1 : -1,
      row > 0 ? cellIndex - columns : -1,
      row + 1 < rows ? cellIndex + columns : -1,
    ];
    for (const neighbor of neighbors) {
      if (
        neighbor < 0 ||
        neighbor >= barriers.length ||
        barriers[neighbor] ||
        reachable[neighbor]
      ) continue;
      reachable[neighbor] = 1;
      queue.push(neighbor);
    }
  }

  const bits = Buffer.alloc(Math.ceil(columns * rows / 8));
  for (let cellIndex = 0; cellIndex < barriers.length; cellIndex += 1) {
    if (!reachable[cellIndex]) bits[Math.floor(cellIndex / 8)] |= 1 << (cellIndex % 8);
  }

  const outputPath = resolve(`js/${outputName}`);
  const source = `// Generated from img/internal/${guideName} and img/internal/${cleanName}.\n` +
    `// Run npm run generate:internal-collision after editing either image.\n` +
    `export const ${prefix}_COLLISION_CELL_SIZE = ${worldCellSize};\n` +
    `export const ${prefix}_COLLISION_COLUMNS = ${columns};\n` +
    `export const ${prefix}_COLLISION_ROWS = ${rows};\n` +
    `export const ${prefix}_COLLISION_BITS = '${bits.toString('base64')}';\n`;

  writeFileSync(outputPath, source);
  console.log(`Generated ${outputPath} (${columns}x${rows} collision cells).`);
}

function generateRedOutlineCollisionMask({
  guideName,
  outputName,
  prefix,
  sourceScale,
  seed,
  floodFillBarriers = [],
  redThreshold = { red: 180, green: 110, blue: 100 },
  guideColor = 'red',
  expectedDimensions,
}) {
  const guide = readPng(readFileSync(resolve(`img/internal/${guideName}`)));
  const { width, height } = guide;
  if (
    expectedDimensions &&
    (width !== expectedDimensions.width || height !== expectedDimensions.height)
  ) {
    console.warn(
      `Skipped ${outputName}: ${guideName} is ${width}x${height}, expected ` +
      `${expectedDimensions.width}x${expectedDimensions.height}.`,
    );
    return;
  }
  const worldCellSize = 2;
  const sourceCellSize = worldCellSize * sourceScale;
  const columns = Math.ceil(width / sourceCellSize);
  const rows = Math.ceil(height / sourceCellSize);
  const barriers = new Uint8Array(columns * rows);

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const firstX = column * sourceCellSize;
      const firstY = row * sourceCellSize;
      for (let y = firstY; y < Math.min(firstY + sourceCellSize, height); y += 1) {
        for (let x = firstX; x < Math.min(firstX + sourceCellSize, width); x += 1) {
          const [red, green, blue] = rgbaAt(guide, x, y);
          // The Gym guide has a slightly different colour grade from the
          // clean artwork, so detect its bright-red drawn barriers directly.
          const isBarrier = guideColor === 'green'
            ? red < 100 && green > 180 && blue < 150
            : red > redThreshold.red &&
              green < redThreshold.green &&
              blue < redThreshold.blue;
          if (isBarrier) {
            barriers[row * columns + column] = 1;
            break;
          }
        }
        if (barriers[row * columns + column]) break;
      }
    }
  }

  // Close the entrance only during flood fill.  The runtime reopens this
  // strip when the player approaches the door, keeping it usable as an exit.
  for (const barrier of floodFillBarriers) {
    const startColumn = Math.floor(barrier.x / sourceCellSize);
    const endColumn = Math.ceil((barrier.x + barrier.width) / sourceCellSize);
    const startRow = Math.floor(barrier.y / sourceCellSize);
    const endRow = Math.ceil((barrier.y + barrier.height) / sourceCellSize);
    for (let row = startRow; row <= endRow; row += 1) {
      for (let column = startColumn; column <= endColumn; column += 1) {
        if (row >= 0 && row < rows && column >= 0 && column < columns) {
          barriers[row * columns + column] = 1;
        }
      }
    }
  }

  const seedColumn = Math.floor(seed.x / sourceCellSize);
  const seedRow = Math.floor(seed.y / sourceCellSize);
  const reachable = new Uint8Array(columns * rows);
  const queue = [seedRow * columns + seedColumn];
  reachable[queue[0]] = 1;

  for (let queueIndex = 0; queueIndex < queue.length; queueIndex += 1) {
    const cellIndex = queue[queueIndex];
    const column = cellIndex % columns;
    const row = Math.floor(cellIndex / columns);
    const neighbors = [
      column > 0 ? cellIndex - 1 : -1,
      column + 1 < columns ? cellIndex + 1 : -1,
      row > 0 ? cellIndex - columns : -1,
      row + 1 < rows ? cellIndex + columns : -1,
    ];
    for (const neighbor of neighbors) {
      if (neighbor < 0 || barriers[neighbor] || reachable[neighbor]) continue;
      reachable[neighbor] = 1;
      queue.push(neighbor);
    }
  }

  const bits = Buffer.alloc(Math.ceil(columns * rows / 8));
  for (let cellIndex = 0; cellIndex < barriers.length; cellIndex += 1) {
    if (!reachable[cellIndex]) bits[Math.floor(cellIndex / 8)] |= 1 << (cellIndex % 8);
  }

  const outputPath = resolve(`js/${outputName}`);
  const source = `// Generated from the red barriers in img/internal/${guideName}.\n` +
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

generateOutlinedCollisionMask({
  guideName: 'internal-music-house-collision.png',
  cleanName: 'internal-music.png',
  outputName: 'music-house-collision-mask.ts',
  prefix: 'MUSIC_HOUSE',
  sourceScale: 2,
});

generateRedOutlineCollisionMask({
  guideName: 'internal-gym-collision.png',
  outputName: 'gym-collision-mask.ts',
  prefix: 'GYM',
  sourceScale: 2,
  seed: { x: 512, y: 1120 },
  floodFillBarriers: [{ x: 0, y: 1200, width: 1024, height: 336 }],
  expectedDimensions: { width: 1024, height: 1536 },
});

generateRedOutlineCollisionMask({
  guideName: 'mansion-collision.png',
  outputName: 'mansion-collision-mask.ts',
  prefix: 'MANSION',
  sourceScale: 1,
  seed: { x: 256, y: 520 },
  floodFillBarriers: [{ x: 0, y: 610, width: 512, height: 158 }],
  guideColor: 'green',
  expectedDimensions: { width: 512, height: 768 },
});

generateRedOutlineCollisionMask({
  guideName: 'bookshop-internal-collision.png',
  outputName: 'bookshop-collision-mask.ts',
  prefix: 'BOOKSHOP',
  sourceScale: 2,
  seed: { x: 512, y: 1040 },
  floodFillBarriers: [{ x: 0, y: 1180, width: 1024, height: 356 }],
  // The book covers are warm-coloured too; the drawn guide is the bright red.
  redThreshold: { red: 240, green: 60, blue: 60 },
  expectedDimensions: { width: 1024, height: 1536 },
});
