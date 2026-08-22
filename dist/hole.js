import { HALF_WIDTH, SPRITE_HEIGHT, WORLD_HEIGHT, WORLD_WIDTH, } from './config.js';
import { playerCollidesAt } from './collision.js';
import { DOORWAYS } from './doors.js';
// The dark opening inside the orange-marked stone rim.
const HOLE = { x: 106, y: 239, width: 25, height: 32 };
const FALL_IN_DURATION = 0.72;
const SKY_FALL_DURATION = 0.9;
const SKY_START_OFFSET = -240;
const LANDING_ATTEMPTS = 350;
const LANDING_CLEARANCE = 13;
const DOOR_CLEARANCE = 58;
let phase = 'idle';
let phaseTime = 0;
const clampProgress = (value) => Math.max(0, Math.min(1, value));
function playerTouchesHole(player) {
    const footHalfWidth = 7;
    const footHeight = 7;
    return player.x - footHalfWidth < HOLE.x + HOLE.width &&
        player.x + footHalfWidth > HOLE.x &&
        player.y - footHeight < HOLE.y + HOLE.height &&
        player.y > HOLE.y;
}
function pointNearHole(x, y, margin) {
    return x >= HOLE.x - margin &&
        x <= HOLE.x + HOLE.width + margin &&
        y >= HOLE.y - margin &&
        y <= HOLE.y + HOLE.height + margin;
}
function distanceToDoor(x, y) {
    return Math.min(...DOORWAYS.map((doorway) => {
        const dx = Math.max(doorway.x - x, 0, x - (doorway.x + doorway.width));
        const dy = Math.max(doorway.y - y, 0, y - (doorway.y + doorway.height));
        return Math.hypot(dx, dy);
    }));
}
function hasLandingClearance(x, y) {
    const offsets = [
        [0, 0],
        [-LANDING_CLEARANCE, 0],
        [LANDING_CLEARANCE, 0],
        [0, -LANDING_CLEARANCE],
        [0, LANDING_CLEARANCE],
    ];
    return offsets.every(([offsetX, offsetY]) => !playerCollidesAt(x + offsetX, y + offsetY));
}
function isSafeLandingPoint(x, y) {
    return !pointNearHole(x, y, 70) &&
        distanceToDoor(x, y) > DOOR_CLEARANCE &&
        hasLandingClearance(x, y);
}
function randomLandingPoint() {
    const minimumX = HALF_WIDTH + 30;
    const maximumX = WORLD_WIDTH - HALF_WIDTH - 30;
    const minimumY = SPRITE_HEIGHT + 30;
    const maximumY = WORLD_HEIGHT - 30;
    for (let attempt = 0; attempt < LANDING_ATTEMPTS; attempt += 1) {
        const x = minimumX + Math.random() * (maximumX - minimumX);
        const y = minimumY + Math.random() * (maximumY - minimumY);
        if (isSafeLandingPoint(x, y))
            return { x, y };
    }
    // Central path fallback; the rejection sampler should almost never need it.
    return { x: 654, y: 662 };
}
function beginSkyFall(player) {
    const landingPoint = randomLandingPoint();
    player.x = landingPoint.x;
    player.y = landingPoint.y;
    player.direction = 'down';
    player.frame = 0;
    player.animationTime = 0;
    phase = 'falling-from-sky';
    phaseTime = 0;
}
export function isHoleAnimationActive() {
    return phase !== 'idle';
}
export function updateHole(deltaTime, player) {
    if (phase === 'idle') {
        if (playerTouchesHole(player)) {
            phase = 'falling-in';
            phaseTime = 0;
            player.frame = 0;
            player.animationTime = 0;
        }
        return;
    }
    phaseTime += deltaTime;
    if (phase === 'falling-in' && phaseTime >= FALL_IN_DURATION) {
        beginSkyFall(player);
        return;
    }
    if (phase === 'falling-from-sky' && phaseTime >= SKY_FALL_DURATION) {
        phase = 'idle';
        phaseTime = 0;
    }
}
export function getHolePlayerTransform() {
    if (phase === 'falling-in') {
        const progress = clampProgress(phaseTime / FALL_IN_DURATION);
        return {
            scale: Math.max(0.04, 1 - progress),
            rotation: progress * Math.PI * 4.5,
            offsetY: progress * 12,
            opacity: Math.max(0, 1 - progress),
        };
    }
    if (phase === 'falling-from-sky') {
        const progress = clampProgress(phaseTime / SKY_FALL_DURATION);
        return {
            scale: 0.78 + progress * 0.22,
            rotation: 0,
            offsetY: SKY_START_OFFSET * (1 - progress * progress),
            opacity: Math.min(1, progress * 5),
        };
    }
    return null;
}
//# sourceMappingURL=hole.js.map