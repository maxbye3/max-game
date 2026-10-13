import { getTimInputSteps, timPowerVisualState } from './tim-input-power.js';

const COLORS = ['#ff69cc', '#88fff0', '#fdff98'] as const;
let sceneBuffer: HTMLCanvasElement | null = null;

function pixelArrow(context: CanvasRenderingContext2D, x: number, y: number, angle: number, size = 1): void {
  context.save();
  context.translate(Math.round(x), Math.round(y));
  context.rotate(angle);
  context.scale(size, size);
  context.fillRect(-9, -2, 15, 4);
  for (let step = 0; step < 4; step++) {
    context.fillRect(4 - step * 2, -3 - step * 2, 3, 3);
    context.fillRect(4 - step * 2, step * 2, 3, 3);
  }
  context.restore();
}

/** A contradictory body: the centre stays over its real collision position. */
export function withTimContradiction(context: CanvasRenderingContext2D, x: number, y: number, height: number, id: string, drawSprite: () => void, now: number): void {
  const power = timPowerVisualState(now);
  if (!power) { drawSprite(); return; }
  const phase = power.elapsed / 430 + id.length * 1.7;
  const bodyY = y - height / 2;
  const isPlayer = id === 'player';
  const tug = isPlayer ? power.intentX * 9 : Math.sin(phase) * 5;
  // Opposing translucent bodies slide out of the real sprite like bad reflections.
  for (const side of [-1, 1]) {
    context.save();
    context.globalAlpha *= power.intensity * 0.4;
    context.translate(x + side * (height * 0.45 + Math.sin(phase) * 6), bodyY - side * 8);
    context.scale(-1, side);
    context.translate(-x, -bodyY);
    drawSprite();
    context.restore();
  }
  context.save();
  context.translate(x, bodyY);
  context.transform(1, Math.sin(phase) * 0.13 * power.intensity, tug / height * power.intensity, 1, 0, 0);
  context.rotate(Math.sin(phase) * (isPlayer ? 0.25 : 0.9) * power.intensity);
  context.scale(1 + Math.sin(phase * 1.3) * 0.45 * power.intensity, 1 - Math.sin(phase * 1.3) * 0.35 * power.intensity);
  context.translate(-x, -bodyY);
  if (isPlayer) {
    // Max's body separates into contrary slices, including at rest.
    const sliceHeight = height * 1.4 / 6;
    for (let slice = 0; slice < 6; slice++) {
      const top = bodyY - height * 0.7 + slice * sliceHeight;
      const offset = Math.sin(phase * 1.4 + slice * 1.8) * 8 * power.intensity;
      context.save();
      context.beginPath();
      context.rect(x - height * 1.2, top, height * 2.4, sliceHeight + 0.5);
      context.clip();
      context.translate(offset, 0);
      drawSprite();
      context.restore();
    }
  } else drawSprite();
  context.restore();
}

export function drawTimPowerGround(context: CanvasRenderingContext2D, cameraX: number, cameraY: number, now: number, scaleX = 1, scaleY = 1): void {
  const power = timPowerVisualState(now);
  if (!power) return;
  context.save();
  context.scale(scaleX, scaleY);
  context.imageSmoothingEnabled = false;
  const angle = Math.atan2(-power.intentY, -power.intentX);
  for (const step of getTimInputSteps(now)) {
    const life = 1 - (now - step.at) / 1500;
    const x = step.x - cameraX; const y = step.y - cameraY;
    context.globalAlpha = life * power.intensity * 0.75;
    context.fillStyle = step.reverse ? COLORS[0] : COLORS[1];
    pixelArrow(context, x, y, angle, 0.8 + life * 0.5);
    context.strokeStyle = COLORS[2];
    context.lineWidth = 2;
    context.strokeRect(Math.round(x - 16 * life), Math.round(y - 9 * life), Math.round(32 * life), Math.round(18 * life));
  }
  context.restore();
}

export function drawTimPower(context: CanvasRenderingContext2D, x: number, y: number, now: number, height = 44): void {
  const power = timPowerVisualState(now);
  if (!power) return;
  context.save();
  context.imageSmoothingEnabled = false;
  const centreY = y - height / 2;
  // Four counter-rotating broken squares make the body look caught in a tear.
  for (let ring = 0; ring < 4; ring++) {
    context.save();
    context.translate(x, centreY);
    context.rotate((ring % 2 ? -1 : 1) * power.elapsed / (1400 + ring * 180));
    context.globalAlpha = power.intensity * (0.7 - ring * 0.1);
    context.strokeStyle = COLORS[ring % COLORS.length]!;
    context.lineWidth = 2;
    const radius = 24 + ring * 10 + Math.sin(power.elapsed / 300 + ring) * 5;
    context.setLineDash([8, 10]);
    context.strokeRect(-radius, -radius, radius * 2, radius * 2);
    context.restore();
  }
  if (power.intentX || power.intentY) {
    const angle = Math.atan2(power.intentY, power.intentX);
    const distance = 44 + Math.sin(power.elapsed / 180) * 8;
    context.globalAlpha = power.intensity;
    context.fillStyle = COLORS[0];
    pixelArrow(context, x + power.intentX * distance, centreY + power.intentY * distance, angle, 1.5);
    context.fillStyle = COLORS[1];
    pixelArrow(context, x - power.intentX * distance, centreY - power.intentY * distance, angle + Math.PI, 1.5);
    context.strokeStyle = COLORS[2];
    context.setLineDash([3, 5]);
    context.beginPath();
    context.moveTo(x + power.intentX * distance, centreY + power.intentY * distance);
    context.lineTo(x - power.intentX * distance, centreY - power.intentY * distance);
    context.stroke();
  }
  context.restore();
}

/** Re-sample this frame once, so reflections never recursively copy themselves. */
export function drawTimWorld(context: CanvasRenderingContext2D, x: number, y: number, now: number, playerHeight: number): void {
  const power = timPowerVisualState(now);
  if (!power) return;
  const width = context.canvas.width; const height = context.canvas.height;
  sceneBuffer ??= document.createElement('canvas');
  if (sceneBuffer.width !== width || sceneBuffer.height !== height) {
    sceneBuffer.width = width; sceneBuffer.height = height;
  }
  const bufferContext = sceneBuffer.getContext('2d');
  if (!bufferContext) return;
  bufferContext.clearRect(0, 0, width, height);
  bufferContext.drawImage(context.canvas, 0, 0);
  const centreY = y - playerHeight / 2;
  context.save();
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.imageSmoothingEnabled = false;
  // Bands peel in opposing directions; the strip crossing Max stays readable.
  for (let row = 0; row < height; row += 16) {
    const distance = Math.abs(row - centreY);
    const amount = Math.min(1, Math.max(0, (distance - playerHeight) / 80)) * power.intensity;
    const shift = Math.round((Math.sin(row / 35 + power.elapsed / 520) * 23 - power.intentX * 18) * amount);
    context.globalAlpha = amount * 0.82;
    context.drawImage(sceneBuffer, 0, row, width, Math.min(16, height - row), shift, row, width, Math.min(16, height - row));
  }
  // Floating windows contain the actual landscape, flipped and displaced.
  const tile = Math.max(48, Math.round(Math.min(width, height) / 7));
  for (let row = 0; row < height; row += tile) {
    for (let column = 0; column < width; column += tile) {
      if ((Math.floor(row / tile) + Math.floor(column / tile)) % 3 !== 0) continue;
      const cx = column + tile / 2; const cy = row + tile / 2;
      if (Math.hypot(cx - x, cy - centreY) < playerHeight + tile) continue;
      const phase = power.elapsed / 750 + (column - row) / 90;
      const tileWidth = Math.min(tile, width - column); const tileHeight = Math.min(tile, height - row);
      context.save();
      context.globalAlpha = power.intensity * 0.8;
      context.translate(cx + Math.round(Math.sin(phase) * 9), cy + Math.round(Math.cos(phase) * 9));
      context.rotate(Math.sin(phase) * 0.12);
      context.scale(-1, Math.floor(column / tile) % 2 ? -1 : 1);
      context.drawImage(sceneBuffer, width - column - tileWidth, height - row - tileHeight, tileWidth, tileHeight, -tile / 2, -tile / 2, tileWidth, tileHeight);
      context.strokeStyle = COLORS[(Math.floor(row / tile) + Math.floor(column / tile) * 2) % 3]!;
      context.lineWidth = 2;
      context.strokeRect(-tile / 2, -tile / 2, tileWidth, tileHeight);
      context.restore();
    }
  }
  // A field of contrary currents ties the whole landscape to the player's input.
  const angle = power.intentX || power.intentY ? Math.atan2(-power.intentY, -power.intentX) : -power.elapsed / 1600;
  for (let index = 0; index < 28; index++) {
    const travel = power.elapsed / 8;
    const arrowX = ((index * 137 + Math.cos(angle) * travel) % width + width) % width;
    const arrowY = ((index * 83 + Math.sin(angle) * travel) % height + height) % height;
    if (Math.hypot(arrowX - x, arrowY - centreY) < playerHeight) continue;
    context.globalAlpha = power.intensity * 0.32;
    context.fillStyle = COLORS[index % 3]!;
    pixelArrow(context, arrowX, arrowY, angle, 0.7 + index % 3 * 0.2);
  }
  // An inward-moving, stepped aperture announces the onset without a white flash.
  const onset = Math.max(0, 1 - power.elapsed / 850);
  if (onset > 0) {
    context.strokeStyle = COLORS[0];
    context.globalAlpha = onset * power.intensity;
    context.lineWidth = 5;
    const radius = playerHeight + onset * Math.max(width, height);
    context.strokeRect(x - radius, centreY - radius, radius * 2, radius * 2);
  }
  context.globalAlpha = power.intensity * 0.5;
  for (let edge = 0; edge < width; edge += 8) {
    context.fillStyle = COLORS[Math.floor(edge / 8) % 3]!;
    context.fillRect(edge, 0, 4, 3);
    context.fillRect(width - edge - 4, height - 3, 4, 3);
  }
  context.restore();
}
