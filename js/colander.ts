export const CAVE_DOOR_ID = 'northwest-portal';

// The colander always starts back on the ground in the cave: holding it is
// only ever carried forward through the `colander=1` URL param set on the
// way out of the cave, never persisted to storage, so it resets on the next
// visit instead of being permanently remembered.
export function hasCaveColander(): boolean {
  return new URLSearchParams(window.location.search).get('colander') === '1';
}

export function drawColander(context: CanvasRenderingContext2D, centerX: number, topY: number, scale = 1): void {
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
