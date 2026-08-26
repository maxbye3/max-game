import { SPEED, WORLD_HEIGHT, WORLD_WIDTH } from './config.js';
import { CAVE_DOOR_ID, hasCaveColander, setCaveColanderHeld } from './colander.js';
import { playerCollidesAt } from './collision.js';
import { DOORWAYS } from './doors.js';
const CAVE_DOOR = DOORWAYS.find((doorway) => doorway.id === CAVE_DOOR_ID);
const THIEF_SIZE = 24;
const GRID_SIZE = 16;
const SEQUENCE_DELAY = 5000;
const PAN_DURATION = 1200;
const MESSAGE_DURATION = 1800;
const PATH_REFRESH_INTERVAL = 0.22;
const MAX_PATH_EXPANSIONS = 5200;
const MESSAGE = 'Come back here you thief!';
const entrance = {
    x: CAVE_DOOR ? CAVE_DOOR.x + CAVE_DOOR.width / 2 : 236,
    y: CAVE_DOOR ? CAVE_DOOR.y + CAVE_DOOR.height + 16 : 284,
};
const state = {
    phase: 'hidden',
    x: entrance.x,
    y: entrance.y,
    returnTime: 0,
    phaseStart: 0,
    panFrom: { x: entrance.x, y: entrance.y },
    path: [],
    repathTimer: 0,
    targetCell: -1,
};
function readReturnedFromCave() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('door') !== CAVE_DOOR_ID || params.get('colander') !== '1')
        return false;
    setCaveColanderHeld();
    return hasCaveColander();
}
export function setupCaveThief() {
    if (!readReturnedFromCave())
        return;
    state.phase = 'waiting';
    state.returnTime = performance.now();
    state.x = entrance.x;
    state.y = entrance.y;
}
export function isCaveTheftCutsceneActive() {
    return state.phase === 'panToEntrance' || state.phase === 'message' || state.phase === 'panToPlayer';
}
export function getCaveThiefDialogue() {
    return state.phase === 'message' ? MESSAGE : null;
}
export function getCaveThief() {
    if (state.phase === 'hidden' || state.phase === 'waiting')
        return null;
    return { x: state.x, y: state.y, size: THIEF_SIZE };
}
function easeInOut(t) {
    return t < 0.5 ? 2 * t * t : 1 - ((-2 * t + 2) ** 2) / 2;
}
export function getCaveTheftCameraCenter(playerX, playerY, time) {
    if (state.phase === 'panToEntrance') {
        const progress = easeInOut(Math.min(1, (time - state.phaseStart) / PAN_DURATION));
        return {
            x: state.panFrom.x + (entrance.x - state.panFrom.x) * progress,
            y: state.panFrom.y + (entrance.y - state.panFrom.y) * progress,
        };
    }
    if (state.phase === 'message')
        return entrance;
    if (state.phase === 'panToPlayer') {
        const progress = easeInOut(Math.min(1, (time - state.phaseStart) / PAN_DURATION));
        return {
            x: entrance.x + (playerX - entrance.x) * progress,
            y: entrance.y + (playerY - entrance.y) * progress,
        };
    }
    return { x: playerX, y: playerY };
}
function isBlocked(x, y) {
    const half = THIEF_SIZE / 2;
    if (x - half < 0 || x + half > WORLD_WIDTH || y - THIEF_SIZE < 0 || y > WORLD_HEIGHT)
        return true;
    return (playerCollidesAt(x - half * 0.6, y) ||
        playerCollidesAt(x + half * 0.6, y) ||
        playerCollidesAt(x, y - THIEF_SIZE * 0.3) ||
        playerCollidesAt(x, y));
}
function moveWithCollisions(movementX, movementY) {
    const steps = Math.max(1, Math.ceil(Math.max(Math.abs(movementX), Math.abs(movementY)) / 4));
    const stepX = movementX / steps;
    const stepY = movementY / steps;
    for (let step = 0; step < steps; step += 1) {
        const nextX = state.x + stepX;
        if (!isBlocked(nextX, state.y))
            state.x = nextX;
        const nextY = state.y + stepY;
        if (!isBlocked(state.x, nextY))
            state.y = nextY;
    }
}
function cellFor(x, y) {
    const columns = Math.ceil(WORLD_WIDTH / GRID_SIZE);
    const column = Math.max(0, Math.min(columns - 1, Math.floor(x / GRID_SIZE)));
    const row = Math.max(0, Math.min(Math.ceil(WORLD_HEIGHT / GRID_SIZE) - 1, Math.floor(y / GRID_SIZE)));
    return row * columns + column;
}
function cellCenter(cell) {
    const columns = Math.ceil(WORLD_WIDTH / GRID_SIZE);
    const column = cell % columns;
    const row = Math.floor(cell / columns);
    return {
        x: column * GRID_SIZE + GRID_SIZE / 2,
        y: row * GRID_SIZE + GRID_SIZE / 2,
    };
}
function nearestPassableCell(startCell) {
    if (!isBlocked(cellCenter(startCell).x, cellCenter(startCell).y))
        return startCell;
    const columns = Math.ceil(WORLD_WIDTH / GRID_SIZE);
    const rows = Math.ceil(WORLD_HEIGHT / GRID_SIZE);
    const startColumn = startCell % columns;
    const startRow = Math.floor(startCell / columns);
    for (let radius = 1; radius <= 8; radius += 1) {
        for (let row = startRow - radius; row <= startRow + radius; row += 1) {
            for (let column = startColumn - radius; column <= startColumn + radius; column += 1) {
                if (column < 0 || column >= columns || row < 0 || row >= rows)
                    continue;
                const cell = row * columns + column;
                const center = cellCenter(cell);
                if (!isBlocked(center.x, center.y))
                    return cell;
            }
        }
    }
    return startCell;
}
function rebuildPath(targetX, targetY) {
    const columns = Math.ceil(WORLD_WIDTH / GRID_SIZE);
    const rows = Math.ceil(WORLD_HEIGHT / GRID_SIZE);
    const startCell = nearestPassableCell(cellFor(state.x, state.y));
    const goalCell = nearestPassableCell(cellFor(targetX, targetY));
    state.targetCell = goalCell;
    if (startCell === goalCell) {
        state.path = [{ x: targetX, y: targetY }];
        return;
    }
    const queue = [startCell];
    const cameFrom = new Map();
    cameFrom.set(startCell, startCell);
    let cursor = 0;
    let found = false;
    while (cursor < queue.length && cursor < MAX_PATH_EXPANSIONS) {
        const cell = queue[cursor];
        cursor += 1;
        if (cell === undefined)
            continue;
        if (cell === goalCell) {
            found = true;
            break;
        }
        const column = cell % columns;
        const row = Math.floor(cell / columns);
        const neighbors = [
            [column + 1, row],
            [column - 1, row],
            [column, row + 1],
            [column, row - 1],
        ];
        for (const [nextColumn, nextRow] of neighbors) {
            if (nextColumn < 0 || nextColumn >= columns || nextRow < 0 || nextRow >= rows)
                continue;
            const nextCell = nextRow * columns + nextColumn;
            if (cameFrom.has(nextCell))
                continue;
            const center = cellCenter(nextCell);
            if (isBlocked(center.x, center.y))
                continue;
            cameFrom.set(nextCell, cell);
            queue.push(nextCell);
        }
    }
    if (!found) {
        state.path = [{ x: targetX, y: targetY }];
        return;
    }
    const path = [];
    let current = goalCell;
    while (current !== startCell) {
        path.push(cellCenter(current));
        current = cameFrom.get(current) ?? startCell;
    }
    state.path = path.reverse().slice(0, 18);
}
function updateChase(deltaTime, targetX, targetY, speedMultiplier) {
    state.repathTimer -= deltaTime;
    const targetCell = cellFor(targetX, targetY);
    if (state.repathTimer <= 0 || targetCell !== state.targetCell || state.path.length === 0) {
        state.repathTimer = PATH_REFRESH_INTERVAL;
        rebuildPath(targetX, targetY);
    }
    const waypoint = state.path[0] ?? { x: targetX, y: targetY };
    const dx = waypoint.x - state.x;
    const dy = waypoint.y - state.y;
    const distance = Math.hypot(dx, dy);
    if (distance < 6) {
        state.path.shift();
        return;
    }
    const speed = SPEED * speedMultiplier;
    moveWithCollisions((dx / distance) * speed * deltaTime, (dy / distance) * speed * deltaTime);
}
export function updateCaveThief(deltaTime, time, playerX, playerY, speedMultiplier) {
    if (state.phase === 'hidden')
        return;
    if (state.phase === 'waiting') {
        if (time - state.returnTime < SEQUENCE_DELAY)
            return;
        state.phase = 'panToEntrance';
        state.phaseStart = time;
        state.panFrom = { x: playerX, y: playerY };
        return;
    }
    if (state.phase === 'panToEntrance' && time - state.phaseStart >= PAN_DURATION) {
        state.phase = 'message';
        state.phaseStart = time;
        return;
    }
    if (state.phase === 'message' && time - state.phaseStart >= MESSAGE_DURATION) {
        state.phase = 'panToPlayer';
        state.phaseStart = time;
        return;
    }
    if (state.phase === 'panToPlayer' && time - state.phaseStart >= PAN_DURATION) {
        state.phase = 'chasing';
        state.path = [];
        state.repathTimer = 0;
        return;
    }
    if (state.phase === 'chasing')
        updateChase(deltaTime, playerX, playerY, speedMultiplier);
}
//# sourceMappingURL=cave-thief.js.map