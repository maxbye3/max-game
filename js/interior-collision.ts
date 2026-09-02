import { CAVE_WALLS, NOEL, type InteriorScene } from './interior-scenes.js';

const PLAYER_FRAME_WIDTH = 23;
const PLAYER_FRAME_HEIGHT = 36;
const PLAYER_SCALE = 2;

export class InteriorCollision {
  readonly cellSize: number;
  readonly columns: number;
  readonly rows: number;
  private readonly bits: Uint8Array;

  constructor(
    private readonly scene: InteriorScene,
    private readonly passageIsOpen: (x: number, y: number) => boolean,
  ) {
    this.cellSize = scene.collision?.cellSize ?? 1;
    this.columns = scene.collision?.columns ?? 0;
    this.rows = scene.collision?.rows ?? 0;
    const encodedBits = scene.collision ? atob(scene.collision.bits) : '';
    this.bits = Uint8Array.from(encodedBits, (character) => character.charCodeAt(0));
  }

  isBlocked(x: number, y: number): boolean {
    if (x < 0 || x >= this.scene.width || y < 0 || y >= this.scene.height) return true;
    if (this.passageIsOpen(x, y)) return false;
    if (this.scene.kind === 'cave') {
      return CAVE_WALLS.some(([wallX, wallY, width, height]) =>
        x >= wallX && x < wallX + width && y >= wallY && y < wallY + height,
      );
    }
    const column = Math.floor(x / this.cellSize);
    const row = Math.floor(y / this.cellSize);
    if (column >= this.columns || row >= this.rows) return true;
    const cellIndex = row * this.columns + column;
    const byte = this.bits[Math.floor(cellIndex / 8)] ?? 0;
    return (byte & (1 << (cellIndex % 8))) !== 0;
  }

  playerIsBlocked(x: number, y: number): boolean {
    if (
      this.scene.kind === 'diaryLab' &&
      Math.hypot(x - NOEL.x, y - NOEL.y) < NOEL.collisionDistance
    ) return true;

    const halfWidth = PLAYER_FRAME_WIDTH * PLAYER_SCALE * 0.29;
    const footHeight = PLAYER_FRAME_HEIGHT * PLAYER_SCALE * 0.17;
    const left = x - halfWidth;
    const right = x + halfWidth;
    const top = y - footHeight;
    for (let sampleY = top; sampleY <= y; sampleY += 3) {
      for (let sampleX = left; sampleX <= right; sampleX += 3) {
        if (this.isBlocked(sampleX, sampleY)) return true;
      }
    }
    return this.isBlocked(right, y);
  }
}
