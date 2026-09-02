import { WORLD_HEIGHT, WORLD_WIDTH } from './config.js';

export interface PathPoint {
  readonly x: number;
  readonly y: number;
}

export interface ThiefPath {
  readonly targetCell: number;
  readonly points: PathPoint[];
}

const GRID_SIZE = 16;
const MAX_EXPANSIONS = 5200;
const COLUMNS = Math.ceil(WORLD_WIDTH / GRID_SIZE);
const ROWS = Math.ceil(WORLD_HEIGHT / GRID_SIZE);

export function thiefPathCell(x: number, y: number): number {
  const column = Math.max(0, Math.min(COLUMNS - 1, Math.floor(x / GRID_SIZE)));
  const row = Math.max(0, Math.min(ROWS - 1, Math.floor(y / GRID_SIZE)));
  return row * COLUMNS + column;
}

function cellCenter(cell: number): PathPoint {
  return {
    x: (cell % COLUMNS) * GRID_SIZE + GRID_SIZE / 2,
    y: Math.floor(cell / COLUMNS) * GRID_SIZE + GRID_SIZE / 2,
  };
}

function nearestPassableCell(startCell: number, isBlocked: (x: number, y: number) => boolean): number {
  const start = cellCenter(startCell);
  if (!isBlocked(start.x, start.y)) return startCell;

  const startColumn = startCell % COLUMNS;
  const startRow = Math.floor(startCell / COLUMNS);
  for (let radius = 1; radius <= 8; radius += 1) {
    for (let row = startRow - radius; row <= startRow + radius; row += 1) {
      for (let column = startColumn - radius; column <= startColumn + radius; column += 1) {
        if (column < 0 || column >= COLUMNS || row < 0 || row >= ROWS) continue;
        const cell = row * COLUMNS + column;
        const center = cellCenter(cell);
        if (!isBlocked(center.x, center.y)) return cell;
      }
    }
  }
  return startCell;
}

export function buildThiefPath(
  startX: number,
  startY: number,
  targetX: number,
  targetY: number,
  isBlocked: (x: number, y: number) => boolean,
): ThiefPath {
  const startCell = nearestPassableCell(thiefPathCell(startX, startY), isBlocked);
  const targetCell = nearestPassableCell(thiefPathCell(targetX, targetY), isBlocked);
  if (startCell === targetCell) return { targetCell, points: [{ x: targetX, y: targetY }] };

  const queue = [startCell];
  const cameFrom = new Map<number, number>([[startCell, startCell]]);
  let cursor = 0;
  while (cursor < queue.length && cursor < MAX_EXPANSIONS) {
    const cell = queue[cursor++];
    if (cell === undefined) continue;
    if (cell === targetCell) break;
    const column = cell % COLUMNS;
    const row = Math.floor(cell / COLUMNS);
    for (const [nextColumn, nextRow] of [
      [column + 1, row], [column - 1, row], [column, row + 1], [column, row - 1],
    ] as const) {
      if (nextColumn < 0 || nextColumn >= COLUMNS || nextRow < 0 || nextRow >= ROWS) continue;
      const nextCell = nextRow * COLUMNS + nextColumn;
      if (cameFrom.has(nextCell)) continue;
      const center = cellCenter(nextCell);
      if (isBlocked(center.x, center.y)) continue;
      cameFrom.set(nextCell, cell);
      queue.push(nextCell);
    }
  }

  if (!cameFrom.has(targetCell)) return { targetCell, points: [{ x: targetX, y: targetY }] };
  const points: PathPoint[] = [];
  let current = targetCell;
  while (current !== startCell) {
    points.push(cellCenter(current));
    current = cameFrom.get(current) ?? startCell;
  }
  return { targetCell, points: points.reverse().slice(0, 18) };
}
