import { COLLISION_SHAPES as GENERATED_COLLISION_SHAPES } from './collision-shapes.js';
import {
  ROAD_BUS_ROOF_WIDTH,
  ROAD_BUS_ROOF_X,
  ROAD_BUS_SIGN_HEIGHT,
  ROAD_BUS_SIGN_SOURCE_X,
  ROAD_BUS_SIGN_SOURCE_Y,
  ROAD_BUS_SIGN_WIDTH,
  ROAD_X,
  ROAD_Y,
} from './config.js';
import { MANUAL_COLLISION_SHAPES } from './manual-collision-shapes.js';
import { SIGN_COLLISION_SHAPES } from './signs.js';
import type { CollisionShape } from './types.js';

const RAW_COLLISION_SHAPES: readonly CollisionShape[] = [
  ...GENERATED_COLLISION_SHAPES,
  ...MANUAL_COLLISION_SHAPES,
  ...SIGN_COLLISION_SHAPES,
];

// Clear the annotated Feedback Center doorway and tapered southern approach.
// Subtracting these regions from the geometry also removes the blue debug fill.
const COLLISION_CUTOUTS: readonly CollisionShape[] = [
  // Remove every generated/manual obstacle in the western garden. Its clean,
  // red-box collision bounds are added back after all cutouts are applied.
  [140, 560, 224, 304],
  // Clear the stray vertical collision strip immediately east of the Music Shop.
  [328, 448, 24, 80],
  // Remove the two generated collision blocks flanking the southern road entrance.
  [333, 1190, 726, 64],
  // Clear the removed southwest tree pyramid and both adjoining paved paths.
  [176, 1074, 144, 124],
  [170, 1156, 8, 12],
  [315, 1062, 50, 192],
  [160, 1188, 193, 66],
  [120, 1098, 36, 39],
  [94, 1130, 68, 18],
  [104, 1148, 70, 15],
  [115, 1163, 63, 15],
  [130, 1178, 49, 14],
];

function subtractCollisionShape(
  shape: CollisionShape,
  cutout: CollisionShape,
): CollisionShape[] {
  const [x, y, width, height] = shape;
  const [cutoutX, cutoutY, cutoutWidth, cutoutHeight] = cutout;
  const right = x + width;
  const bottom = y + height;
  const cutoutRight = cutoutX + cutoutWidth;
  const cutoutBottom = cutoutY + cutoutHeight;
  const intersectionLeft = Math.max(x, cutoutX);
  const intersectionTop = Math.max(y, cutoutY);
  const intersectionRight = Math.min(right, cutoutRight);
  const intersectionBottom = Math.min(bottom, cutoutBottom);

  if (intersectionLeft >= intersectionRight || intersectionTop >= intersectionBottom) {
    return [shape];
  }

  const pieces: CollisionShape[] = [];
  if (y < intersectionTop) pieces.push([x, y, width, intersectionTop - y]);
  if (intersectionBottom < bottom) {
    pieces.push([x, intersectionBottom, width, bottom - intersectionBottom]);
  }
  if (x < intersectionLeft) {
    pieces.push([x, intersectionTop, intersectionLeft - x, intersectionBottom - intersectionTop]);
  }
  if (intersectionRight < right) {
    pieces.push([
      intersectionRight,
      intersectionTop,
      right - intersectionRight,
      intersectionBottom - intersectionTop,
    ]);
  }
  return pieces;
}

const MAP_COLLISION_SHAPES = COLLISION_CUTOUTS.reduce<
  CollisionShape[]
>(
  (shapes, cutout) => shapes.flatMap((shape) => subtractCollisionShape(shape, cutout)),
  [...RAW_COLLISION_SHAPES],
);

// Road-local bounds traced from the bus shelter and bus-stop sign annotations.
// These are appended after map cutouts because the southern entrance cutout
// intentionally overlaps the separately composited road image.
const ROAD_COLLISION_SHAPES: readonly CollisionShape[] = [
  [ROAD_BUS_ROOF_X, ROAD_Y + 30, ROAD_BUS_ROOF_WIDTH, 15],
  [
    ROAD_X + ROAD_BUS_SIGN_SOURCE_X,
    ROAD_Y + ROAD_BUS_SIGN_SOURCE_Y,
    ROAD_BUS_SIGN_WIDTH,
    ROAD_BUS_SIGN_HEIGHT,
  ],
];

// Six simple bounds matching the marked hedge sections. The gaps between the
// top and bottom pairs remain open as garden entrances.
const WESTERN_GARDEN_COLLISION_SHAPES: readonly CollisionShape[] = [
  [152, 576, 88, 40],
  [272, 576, 80, 40],
  [152, 576, 32, 272],
  [328, 576, 24, 272],
  [152, 808, 88, 40],
  [272, 808, 80, 40],
];

export const COLLISION_SHAPES: readonly CollisionShape[] = [
  ...MAP_COLLISION_SHAPES,
  ...WESTERN_GARDEN_COLLISION_SHAPES,
  ...ROAD_COLLISION_SHAPES,
];
