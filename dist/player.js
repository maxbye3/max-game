import { FRAME_COUNT, HALF_WIDTH, SPEED, SPRITE_HEIGHT, WORLD_HEIGHT, WORLD_WIDTH, } from './config.js';
import { playerCollidesAt } from './collision.js';
import { isHeld } from './input.js';
const clampX = (x) => Math.max(HALF_WIDTH, Math.min(WORLD_WIDTH - HALF_WIDTH, x));
const clampY = (y) => Math.max(SPRITE_HEIGHT, Math.min(WORLD_HEIGHT, y));
export const player = {
    x: WORLD_WIDTH / 1.5,
    y: WORLD_HEIGHT / 2,
    direction: 'down',
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
        if (!playerCollidesAt(nextX, player.y))
            player.x = nextX;
        const nextY = clampY(player.y + stepY);
        if (!playerCollidesAt(player.x, nextY))
            player.y = nextY;
    }
}
export function updatePlayer(deltaTime, speedMultiplier) {
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