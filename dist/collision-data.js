import { COLLISION_SHAPES as GENERATED_COLLISION_SHAPES } from './collision-shapes.js';
import { MANUAL_COLLISION_SHAPES } from './manual-collision-shapes.js';
import { SIGN_COLLISION_SHAPES } from './signs.js';
const RAW_COLLISION_SHAPES = [
    ...GENERATED_COLLISION_SHAPES,
    ...MANUAL_COLLISION_SHAPES,
    ...SIGN_COLLISION_SHAPES,
];
// Clear the annotated Feedback Center doorway and tapered southern approach.
// Subtracting these regions from the geometry also removes the blue debug fill.
const COLLISION_CUTOUTS = [
    // Open the central southern path where the appended road meets the old map.
    [590, 1190, 115, 64],
    [120, 1098, 36, 39],
    [94, 1130, 68, 18],
    [104, 1148, 70, 15],
    [115, 1163, 63, 15],
    [130, 1178, 49, 14],
];
function subtractCollisionShape(shape, cutout) {
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
    const pieces = [];
    if (y < intersectionTop)
        pieces.push([x, y, width, intersectionTop - y]);
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
export const COLLISION_SHAPES = COLLISION_CUTOUTS.reduce((shapes, cutout) => shapes.flatMap((shape) => subtractCollisionShape(shape, cutout)), [...RAW_COLLISION_SHAPES]);
//# sourceMappingURL=collision-data.js.map