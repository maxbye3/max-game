"use strict";
const requireElement = (selector) => {
    const element = document.querySelector(selector);
    if (!element)
        throw new Error(`Missing required element: ${selector}`);
    return element;
};
const canvas = requireElement('#game');
function requireCanvasContext(target) {
    const value = target.getContext('2d');
    if (!value)
        throw new Error('This browser does not support the 2D canvas context.');
    return value;
}
const context = requireCanvasContext(canvas);
const WORLD_WIDTH = 1024;
const WORLD_HEIGHT = 1536;
const FRAME_WIDTH = 23;
const FRAME_HEIGHT = 36;
const FRAME_COUNT = 9;
const PLAYER_SCALE = 2;
const SPEED = 235;
const SHOW_COLLISIONS = new URLSearchParams(window.location.search).has('collisions');
const interior = new Image();
const collisionMask = new Image();
const doorOverlay = new Image();
const spriteSheet = new Image();
interior.src = '../img/internal/diary-lab.png';
collisionMask.src = '../img/internal/diary-lab-collision.png';
doorOverlay.src = '../img/internal/diary-lab-doors-out.png';
spriteSheet.src = '../example_character/SpriteSheet.png';
const doorSound = new Audio('../audio/open-door.mp3');
doorSound.preload = 'auto';
const maskCanvas = document.createElement('canvas');
maskCanvas.width = WORLD_WIDTH;
maskCanvas.height = WORLD_HEIGHT;
const maskContext = maskCanvas.getContext('2d', { willReadFrequently: true });
if (!maskContext)
    throw new Error('Could not create the collision-mask context.');
const directionRows = {
    down: 0,
    downRight: 1,
    right: 2,
    upRight: 3,
    up: 4,
    upLeft: 5,
    left: 6,
    downLeft: 7,
};
const enteredDoor = new URLSearchParams(window.location.search).get('door');
const player = {
    x: enteredDoor === 'diary-lab-right' ? 718 : 306,
    y: 1125,
    direction: 'up',
    frame: 0,
    animationTime: 0,
};
const directionCodes = {
    ArrowUp: 'up',
    KeyW: 'up',
    ArrowDown: 'down',
    KeyS: 'down',
    ArrowLeft: 'left',
    KeyA: 'left',
    ArrowRight: 'right',
    KeyD: 'right',
};
const heldDirections = new Map();
const heldCodes = new Set();
const releaseHandlers = [];
let maskPixels = null;
let previousTime = 0;
let openDoorIndex = null;
const INTERIOR_DOORS = [
    {
        triggerX: 306,
        triggerY: 1190,
        sourceX: 120,
        sourceY: 30,
        sourceWidth: 560,
        sourceHeight: 650,
        x: 160,
        y: 1118,
        width: 252,
        height: 260,
    },
    {
        triggerX: 718,
        triggerY: 1190,
        sourceX: 1290,
        sourceY: 30,
        sourceWidth: 560,
        sourceHeight: 650,
        x: 616,
        y: 1118,
        width: 252,
        height: 260,
    },
];
const DOOR_OPEN_DISTANCE = 105;
const isHeld = (direction) => heldDirections.has(direction);
function holdDirection(direction) {
    heldDirections.set(direction, (heldDirections.get(direction) ?? 0) + 1);
}
function releaseDirection(direction) {
    const remaining = (heldDirections.get(direction) ?? 0) - 1;
    if (remaining > 0)
        heldDirections.set(direction, remaining);
    else
        heldDirections.delete(direction);
}
function pressCode(code) {
    const direction = directionCodes[code];
    if (!direction || heldCodes.has(code))
        return;
    heldCodes.add(code);
    holdDirection(direction);
}
function releaseCode(code) {
    const direction = directionCodes[code];
    if (!direction || !heldCodes.delete(code))
        return;
    releaseDirection(direction);
}
function releaseAllInput() {
    heldCodes.clear();
    heldDirections.clear();
    releaseHandlers.forEach((release) => release());
}
function bindControls() {
    window.addEventListener('keydown', (event) => {
        if (event.ctrlKey || event.metaKey || event.altKey) {
            releaseAllInput();
            return;
        }
        if (directionCodes[event.code]) {
            event.preventDefault();
            pressCode(event.code);
        }
    });
    window.addEventListener('keyup', (event) => releaseCode(event.code));
    window.addEventListener('blur', releaseAllInput);
    document.querySelectorAll('.dpad-button').forEach((button) => {
        const directions = (button.dataset.directions ?? '').split(' ').filter((value) => value === 'up' || value === 'down' || value === 'left' || value === 'right');
        let pressed = false;
        const press = () => {
            if (pressed)
                return;
            pressed = true;
            directions.forEach(holdDirection);
            button.classList.add('pressed');
        };
        const release = () => {
            if (!pressed)
                return;
            pressed = false;
            directions.forEach(releaseDirection);
            button.classList.remove('pressed');
        };
        releaseHandlers.push(release);
        button.addEventListener('pointerdown', (event) => {
            event.preventDefault();
            press();
            try {
                button.setPointerCapture(event.pointerId);
            }
            catch { }
        });
        ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((type) => {
            button.addEventListener(type, release);
        });
    });
}
function isCollisionPixel(x, y) {
    if (!maskPixels || x < 0 || x >= WORLD_WIDTH || y < 0 || y >= WORLD_HEIGHT)
        return true;
    const index = (Math.floor(y) * WORLD_WIDTH + Math.floor(x)) * 4;
    const red = maskPixels[index] ?? 0;
    const green = maskPixels[index + 1] ?? 0;
    const blue = maskPixels[index + 2] ?? 0;
    const alpha = maskPixels[index + 3] ?? 0;
    return alpha > 20 && red < 80 && green > 150 && blue > 150;
}
function playerCollidesAt(x, y) {
    const halfWidth = FRAME_WIDTH * PLAYER_SCALE * 0.29;
    const footHeight = FRAME_HEIGHT * PLAYER_SCALE * 0.17;
    const left = x - halfWidth;
    const right = x + halfWidth;
    const top = y - footHeight;
    for (let sampleY = top; sampleY <= y; sampleY += 3) {
        for (let sampleX = left; sampleX <= right; sampleX += 3) {
            if (isCollisionPixel(sampleX, sampleY))
                return true;
        }
    }
    return isCollisionPixel(right, y);
}
function movePlayer(movementX, movementY) {
    const steps = Math.max(1, Math.ceil(Math.max(Math.abs(movementX), Math.abs(movementY)) / 4));
    const stepX = movementX / steps;
    const stepY = movementY / steps;
    for (let step = 0; step < steps; step += 1) {
        const nextX = player.x + stepX;
        if (!playerCollidesAt(nextX, player.y))
            player.x = nextX;
        const nextY = player.y + stepY;
        if (!playerCollidesAt(player.x, nextY))
            player.y = nextY;
    }
}
function updatePlayer(deltaTime) {
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
    if (dx === 0 && dy === 0) {
        player.animationTime = 0;
        player.frame = 0;
        return;
    }
    const length = Math.hypot(dx, dy);
    movePlayer((dx / length) * SPEED * deltaTime, (dy / length) * SPEED * deltaTime);
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
function updateDoors() {
    const nextOpenDoorIndex = INTERIOR_DOORS.findIndex((door) => Math.hypot(player.x - door.triggerX, player.y - door.triggerY) <= DOOR_OPEN_DISTANCE);
    if (nextOpenDoorIndex >= 0 && nextOpenDoorIndex !== openDoorIndex) {
        doorSound.currentTime = 0;
        void doorSound.play().catch(() => {
            // Audio can be rejected until the browser observes a keyboard or pointer gesture.
        });
    }
    openDoorIndex = nextOpenDoorIndex >= 0 ? nextOpenDoorIndex : null;
}
function draw() {
    const cameraX = Math.round(Math.max(0, Math.min(WORLD_WIDTH - canvas.width, player.x - canvas.width / 2)));
    const cameraY = Math.round(Math.max(0, Math.min(WORLD_HEIGHT - canvas.height, player.y - canvas.height / 2)));
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(interior, cameraX, cameraY, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
    if (openDoorIndex !== null) {
        const door = INTERIOR_DOORS[openDoorIndex];
        if (door) {
            context.drawImage(doorOverlay, door.sourceX, door.sourceY, door.sourceWidth, door.sourceHeight, door.x - cameraX, door.y - cameraY, door.width, door.height);
        }
    }
    if (SHOW_COLLISIONS) {
        context.save();
        context.globalAlpha = 0.55;
        context.drawImage(collisionMask, cameraX, cameraY, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
        context.restore();
    }
    const width = FRAME_WIDTH * PLAYER_SCALE;
    const height = FRAME_HEIGHT * PLAYER_SCALE;
    context.drawImage(spriteSheet, player.frame * FRAME_WIDTH, directionRows[player.direction] * FRAME_HEIGHT, FRAME_WIDTH, FRAME_HEIGHT, Math.round(player.x - cameraX - width / 2), Math.round(player.y - cameraY - height), width, height);
}
function gameLoop(time) {
    const deltaTime = previousTime === 0 ? 0 : Math.min((time - previousTime) / 1000, 0.05);
    previousTime = time;
    updatePlayer(deltaTime);
    updateDoors();
    draw();
    requestAnimationFrame(gameLoop);
}
bindControls();
Promise.all([interior.decode(), collisionMask.decode(), doorOverlay.decode(), spriteSheet.decode()])
    .then(() => {
    maskContext.drawImage(collisionMask, 0, 0);
    maskPixels = maskContext.getImageData(0, 0, WORLD_WIDTH, WORLD_HEIGHT).data;
    context.imageSmoothingEnabled = false;
    requestAnimationFrame(gameLoop);
})
    .catch((error) => {
    console.error(error);
    context.fillStyle = '#f5fff6';
    context.font = '13px monospace';
    context.fillText('Could not load the Diary Lab.', 120, 240);
});
//# sourceMappingURL=internal.js.map