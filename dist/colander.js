const CAVE_COLANDER_KEY = 'max-game:cave-colander-held';
export const CAVE_DOOR_ID = 'northwest-portal';
export function hasCaveColander() {
    return window.localStorage.getItem(CAVE_COLANDER_KEY) === 'true';
}
export function setCaveColanderHeld() {
    window.localStorage.setItem(CAVE_COLANDER_KEY, 'true');
}
export function drawColander(context, centerX, topY, scale = 1) {
    const pixel = Math.max(1, scale);
    const width = 26 * pixel;
    const left = Math.round(centerX - width / 2);
    const top = Math.round(topY);
    context.save();
    context.imageSmoothingEnabled = false;
    context.fillStyle = '#1d1d22';
    context.fillRect(left + 2 * pixel, top + 5 * pixel, 22 * pixel, 4 * pixel);
    context.fillRect(left, top + 9 * pixel, 4 * pixel, 5 * pixel);
    context.fillRect(left + 22 * pixel, top + 9 * pixel, 4 * pixel, 5 * pixel);
    context.fillRect(left + 5 * pixel, top + 19 * pixel, 16 * pixel, 3 * pixel);
    context.fillStyle = '#b7bcc3';
    context.fillRect(left + 4 * pixel, top + 3 * pixel, 18 * pixel, 4 * pixel);
    context.fillRect(left + 3 * pixel, top + 8 * pixel, 20 * pixel, 4 * pixel);
    context.fillRect(left + 5 * pixel, top + 12 * pixel, 16 * pixel, 8 * pixel);
    context.fillStyle = '#6d737e';
    for (let y = 13; y <= 18; y += 3) {
        for (let x = 7; x <= 18; x += 4) {
            context.fillRect(left + x * pixel, top + y * pixel, 2 * pixel, 2 * pixel);
        }
    }
    context.fillStyle = '#eceff2';
    context.fillRect(left + 6 * pixel, top + 4 * pixel, 12 * pixel, 1 * pixel);
    context.restore();
}
//# sourceMappingURL=colander.js.map