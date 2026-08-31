import { BUS_INTRO_PLAYER_START_Y, BUS_INTRO_STOP_X, FRAME_COUNT, HALF_WIDTH, SPEED, SPRITE_HEIGHT, WORLD_HEIGHT, WORLD_WIDTH, } from './config.js';
import { isBusIntroActive } from './bus-intro.js';
import { isCaveTheftCutsceneActive } from './cave-thief.js';
import { playerCollidesAt } from './collision.js';
import { DOORWAYS } from './doors.js';
import { isHoleAnimationActive } from './hole.js';
import { isHeld } from './input.js';
import { isMikeDialogueOpen } from './mike.js';
import { isNiallAlertActive, isNiallBattleTransitionActive, NIALL } from './niall.js';
import { bumpSignAt } from './signs.js';
const clampX = (x) => Math.max(HALF_WIDTH, Math.min(WORLD_WIDTH - HALF_WIDTH, x));
const clampY = (y) => Math.max(SPRITE_HEIGHT, Math.min(WORLD_HEIGHT, y));
const searchParams = new URLSearchParams(window.location.search);
const returnDoorId = searchParams.get('door');
const returnDoor = DOORWAYS.find((doorway) => doorway.id === returnDoorId);
const DEFAULT_START_X = BUS_INTRO_STOP_X;
const DEFAULT_START_Y = BUS_INTRO_PLAYER_START_Y;
const fightReturn = searchParams.get('niall') === 'bus';
const DOOR_RETURN_OFFSET = 12;
export const player = {
    x: fightReturn
        ? NIALL.x - 42
        : returnDoor
            ? returnDoor.x + returnDoor.width / 2
            : DEFAULT_START_X,
    y: fightReturn
        ? NIALL.y + 8
        : returnDoor
            ? returnDoor.y + returnDoor.height + DOOR_RETURN_OFFSET
            : DEFAULT_START_Y,
    direction: returnDoor || fightReturn ? 'down' : 'up',
    frame: 0,
    animationTime: 0,
};
export const directionRows = {
    down: 0,
    downRight: 1,
    right: 2,
    upRight: 3,
    up: 4,
    upLeft: 5,
    left: 6,
    downLeft: 7,
};
function movePlayerWithCollisions(movementX, movementY) {
    const steps = Math.max(1, Math.ceil(Math.max(Math.abs(movementX), Math.abs(movementY)) / 4));
    const stepX = movementX / steps;
    const stepY = movementY / steps;
    for (let step = 0; step < steps; step += 1) {
        const nextX = clampX(player.x + stepX);
        if (!bumpSignAt(nextX, player.y) && !playerCollidesAt(nextX, player.y))
            player.x = nextX;
        const nextY = clampY(player.y + stepY);
        if (!bumpSignAt(player.x, nextY) && !playerCollidesAt(player.x, nextY))
            player.y = nextY;
    }
}
export function updatePlayer(deltaTime, speedMultiplier) {
    if (isBusIntroActive() ||
        isHoleAnimationActive() ||
        isMikeDialogueOpen() ||
        isNiallAlertActive() ||
        isNiallBattleTransitionActive() ||
        isCaveTheftCutsceneActive()) {
        player.animationTime = 0;
        player.frame = 0;
        return;
    }
    let dx = 0;
    let dy = 0;
    if (isHeld('left'))
        dx -= 1;
    if (isHeld('right'))
        dx += 1;
    if (isHeld('up'))
        dy -= 1;
    if (isHeld('down'))
        dy += 1;
    const isMoving = dx !== 0 || dy !== 0;
    if (!isMoving) {
        player.animationTime = 0;
        player.frame = 0;
        return;
    }
    const length = Math.hypot(dx, dy);
    const movementX = (dx / length) * SPEED * speedMultiplier * deltaTime;
    const movementY = (dy / length) * SPEED * speedMultiplier * deltaTime;
    movePlayerWithCollisions(movementX, movementY);
    if (dx < 0 && dy < 0)
        player.direction = 'upLeft';
    else if (dx > 0 && dy < 0)
        player.direction = 'upRight';
    else if (dx < 0 && dy > 0)
        player.direction = 'downLeft';
    else if (dx > 0 && dy > 0)
        player.direction = 'downRight';
    else if (dx < 0)
        player.direction = 'left';
    else if (dx > 0)
        player.direction = 'right';
    else if (dy < 0)
        player.direction = 'up';
    else
        player.direction = 'down';
    player.animationTime += deltaTime;
    player.frame = Math.floor(player.animationTime * 11) % FRAME_COUNT;
}
//# sourceMappingURL=player.js.map