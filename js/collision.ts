import { COLLISION_BUCKET_SIZE, FRAME_HEIGHT, FRAME_WIDTH, SCALE } from './config.js';
import { COLLISION_SHAPES } from './collision-data.js';
import { isDoorPassagePoint } from './doors.js';
import { playerCollidesWithNpc } from './npcs.js';
import { playerCollidesWithSnowman } from './snowman.js';
import type { CollisionShape } from './types.js';

const bucketKey = (column: number, row: number) => `${column},${row}`;

/**
 * The bucket range and the key format must stay identical between the index
 * build and every lookup, so both go through this one walker.
 */
export function forEachBucket(
  left: number,
  top: number,
  right: number,
  bottom: number,
  visit: (key: string) => boolean,
): boolean {
  const firstColumn = Math.floor(left / COLLISION_BUCKET_SIZE);
  const lastColumn = Math.floor(right / COLLISION_BUCKET_SIZE);
  const firstRow = Math.floor(top / COLLISION_BUCKET_SIZE);
  const lastRow = Math.floor(bottom / COLLISION_BUCKET_SIZE);

  for (let row = firstRow; row <= lastRow; row += 1) {
    for (let column = firstColumn; column <= lastColumn; column += 1) {
      if (visit(bucketKey(column, row))) return true;
    }
  }

  return false;
}

const collisionBuckets = new Map<string, CollisionShape[]>();

COLLISION_SHAPES.forEach((shape) => {
  const [x, y, width, height] = shape;
  forEachBucket(x, y, x + width - 1, y + height - 1, (key) => {
    let bucket = collisionBuckets.get(key);
    if (!bucket) {
      bucket = [];
      collisionBuckets.set(key, bucket);
    }
    bucket.push(shape);
    return false;
  });
});

export function playerCollidesAt(x: number, y: number): boolean {
  if (isDoorPassagePoint(x, y)) return false;
  if (playerCollidesWithNpc(x, y)) return true;
  if (playerCollidesWithSnowman(x, y)) return true;

  const footHalfWidth = Math.max(4, FRAME_WIDTH * SCALE * 0.3);
  const left = x - footHalfWidth;
  const right = x + footHalfWidth;
  const top = y - Math.max(4, FRAME_HEIGHT * SCALE * 0.18);
  const bottom = y;

  return forEachBucket(left, top, right, bottom, (key) => {
    const shapes = collisionBuckets.get(key);
    if (!shapes) return false;

    for (const [shapeX, shapeY, shapeWidth, shapeHeight] of shapes) {
      if (
        left < shapeX + shapeWidth &&
        right > shapeX &&
        top < shapeY + shapeHeight &&
        bottom > shapeY
      ) return true;
    }

    return false;
  });
}
