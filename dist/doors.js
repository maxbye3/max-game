import { markInternalTestVisited } from './world-state.js';
// World-space doorway bounds traced from the green annotations.
export const DOORWAYS = [
    { id: 'northwest-portal', x: 222, y: 242, width: 27, height: 25 },
    { id: 'diary-lab-left', x: 637, y: 208, width: 19, height: 26 },
    { id: 'diary-lab-center', x: 754, y: 204, width: 24, height: 21 },
    { id: 'diary-lab-right', x: 833, y: 204, width: 22, height: 23 },
    { id: 'music-shop', x: 240, y: 428, width: 30, height: 31 },
    { id: 'gym', x: 1024, y: 519, width: 30, height: 28 },
    { id: 'job-center', x: 1005, y: 775, width: 33, height: 34 },
    { id: 'artist-studio', x: 762, y: 788, width: 33, height: 32 },
    { id: 'cinema', x: 474, y: 800, width: 33, height: 40 },
    { id: 'bookshop', x: 542, y: 1034, width: 25, height: 30 },
    { id: 'snow-mansion', x: 792, y: 1100, width: 32, height: 32 },
    { id: 'feedback-center', x: 123, y: 1103, width: 30, height: 31 },
];
const OPEN_DISTANCE = 42;
const PASSAGE_MARGIN = 8;
const doorSound = new Audio('audio/open-door.mp3');
doorSound.preload = 'auto';
let openDoorIds = new Set();
let navigationStarted = false;
function distanceToDoorway(x, y, doorway) {
    const dx = Math.max(doorway.x - x, 0, x - (doorway.x + doorway.width));
    const dy = Math.max(doorway.y - y, 0, y - (doorway.y + doorway.height));
    return Math.hypot(dx, dy);
}
function pointInsideDoorway(x, y, doorway, margin = 0) {
    return x >= doorway.x - margin &&
        x <= doorway.x + doorway.width + margin &&
        y >= doorway.y - margin &&
        y <= doorway.y + doorway.height + margin;
}
function playDoorSound() {
    doorSound.currentTime = 0;
    void doorSound.play().catch(() => {
        // Browsers may reject audio until the first keyboard or pointer gesture.
    });
}
export function updateDoors(playerX, playerY) {
    const nextOpenDoorIds = new Set(DOORWAYS
        .filter((doorway) => distanceToDoorway(playerX, playerY, doorway) <= OPEN_DISTANCE)
        .map((doorway) => doorway.id));
    if ([...nextOpenDoorIds].some((id) => !openDoorIds.has(id)))
        playDoorSound();
    openDoorIds = nextOpenDoorIds;
    if (navigationStarted)
        return;
    const enteredDoorway = DOORWAYS.find((doorway) => pointInsideDoorway(playerX, playerY, doorway));
    if (!enteredDoorway)
        return;
    navigationStarted = true;
    markInternalTestVisited();
    window.location.assign(`internal/index.html?door=${encodeURIComponent(enteredDoorway.id)}`);
}
export function getOpenDoorways() {
    return DOORWAYS.filter((doorway) => openDoorIds.has(doorway.id));
}
export function isDoorPassagePoint(x, y) {
    return DOORWAYS.some((doorway) => pointInsideDoorway(x, y, doorway, PASSAGE_MARGIN));
}
//# sourceMappingURL=doors.js.map