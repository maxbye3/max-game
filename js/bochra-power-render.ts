import { bochraBeat, bochraDancePose, getBochraDancers, getBochraStage, getBochraSteps, isBochraPowerActive } from './bochra-power.js';

const COLOURS = ['#ff73c7', '#62edff', '#ffe17a', '#ae91ff', '#98ff91'] as const;
const colour = (index: number): string => COLOURS[(index % COLOURS.length + COLOURS.length) % COLOURS.length] ?? COLOURS[0];

/** Transform the actual sprite around its feet, leaving its collision body in place. */
export function withBochraDance(
  context: CanvasRenderingContext2D, x: number, y: number, height: number,
  id: string, drawSprite: () => void, now = performance.now(),
): void {
  const pose = bochraDancePose(id, now);
  if (pose.stretch === 1 && pose.rotation === 0 && pose.x === 0 && pose.y === 0) {
    drawSprite();
    return;
  }
  const scale = height / 52;
  context.save();
  context.translate(x + pose.x * scale, y + pose.y * scale);
  context.rotate(pose.rotation);
  context.scale(1 / pose.stretch, pose.stretch);
  context.translate(-x, -y);
  if (id === 'player') {
    // Echoes follow the same frame as the dancer and disappear on the first idle frame.
    for (let echo = 3; echo > 0; echo--) {
      context.save();
      context.globalAlpha *= 0.06 * (4 - echo);
      context.translate(-pose.x * echo * 1.8 * scale, echo * 2 * scale);
      drawSprite();
      context.restore();
    }
  }
  drawSprite();
  context.restore();
}

export function drawBochraFloor(context: CanvasRenderingContext2D, cameraX: number, cameraY: number, now: number, scaleX = 1, scaleY = 1): void {
  if (!isBochraPowerActive(now)) return;
  const { x, y, moving } = getBochraStage();
  const beat = bochraBeat(now);
  context.save();
  context.scale(scaleX, scaleY);
  const columns = Math.ceil(context.canvas.width / scaleX / 32);
  const rows = Math.ceil(context.canvas.height / scaleY / 32);
  const firstColumn = Math.floor(cameraX / 32);
  const firstRow = Math.floor(cameraY / 32);
  for (let row = firstRow; row <= firstRow + rows; row++) {
    for (let column = firstColumn; column <= firstColumn + columns; column++) {
      const distance = Math.hypot(column * 32 - x, row * 32 - y);
      const strength = Math.max(0, 1 - distance / 500);
      context.globalAlpha = strength * (0.1 + 0.1 * (1 + Math.sin(beat - distance / 42)) / 2);
      context.fillStyle = colour(column + row);
      context.fillRect(column * 32 - cameraX + 2, row * 32 - cameraY + 2, 28, 28);
    }
  }
  getBochraSteps().forEach((step, index) => {
    const age = (now - step.time) / 1400;
    const sx = step.x - cameraX + step.side * 7;
    const sy = step.y - cameraY;
    context.globalAlpha = (1 - age) * 0.65;
    context.fillStyle = colour(index);
    context.fillRect(sx - 3, sy - 7, 6, 10);
    context.strokeStyle = context.fillStyle;
    context.lineWidth = 2;
    context.beginPath();
    context.ellipse(sx, sy, 8 + age * 55, 4 + age * 25, 0, 0, Math.PI * 2);
    context.stroke();
    drawNote(context, sx + step.side * age * 25, sy - 20 - age * 55, 1);
  });
  context.globalAlpha = moving ? 0.55 : 0.25;
  context.strokeStyle = COLOURS[1];
  context.lineWidth = 2;
  context.beginPath();
  context.ellipse(x - cameraX, y - cameraY + 2, 30 + Math.sin(beat) * 4, 12, 0, 0, Math.PI * 2);
  context.stroke();
  context.restore();
}

function drawNote(context: CanvasRenderingContext2D, x: number, y: number, scale: number): void {
  context.fillRect(Math.round(x), Math.round(y), 5 * scale, 4 * scale);
  context.fillRect(Math.round(x + 4 * scale), Math.round(y - 9 * scale), 2 * scale, 11 * scale);
  context.fillRect(Math.round(x + 4 * scale), Math.round(y - 9 * scale), 6 * scale, 3 * scale);
}

export function drawBochraLights(context: CanvasRenderingContext2D, cameraX: number, cameraY: number, now: number, scaleX = 1, scaleY = 1): void {
  if (!isBochraPowerActive(now)) return;
  const beat = bochraBeat(now);
  const width = context.canvas.width;
  const height = context.canvas.height;
  const ballX = width / 2;
  const ballY = Math.min(54, height / 8);
  context.save();
  // Broad, gently sweeping beams keep scenery and doors readable.
  for (let beam = 0; beam < 5; beam++) {
    const destinationX = width * (beam / 4) + Math.sin(beat / 4 + beam) * width * 0.15;
    context.globalAlpha = 0.065;
    context.fillStyle = colour(beam);
    context.beginPath();
    context.moveTo(ballX, ballY);
    context.lineTo(destinationX - width * 0.13, height);
    context.lineTo(destinationX + width * 0.13, height);
    context.closePath();
    context.fill();
  }
  context.globalAlpha = 0.85;
  context.fillStyle = '#9fb7c7';
  context.fillRect(ballX - 1, 0, 2, ballY - 18);
  // A stepped, faceted mirror ball drawn without smoothing.
  for (let row = -3; row <= 3; row++) {
    const extent = 3 - Math.floor(Math.abs(row) / 2);
    for (let column = -extent; column <= extent; column++) {
      context.fillStyle = colour(column + row + Math.floor(beat / Math.PI));
      context.fillRect(Math.round(ballX + column * 5), Math.round(ballY + row * 5), 4, 4);
    }
  }
  context.scale(scaleX, scaleY);
  getBochraDancers().forEach((dancer, index) => {
    const sx = dancer.x - cameraX;
    const sy = dancer.y - cameraY;
    context.globalAlpha = 0.5;
    context.strokeStyle = colour(index);
    context.lineWidth = 2;
    context.beginPath();
    context.ellipse(sx, sy + 2, 20 + Math.sin(beat + index) * 4, 8, 0, 0, Math.PI * 2);
    context.stroke();
    context.fillStyle = context.strokeStyle;
    for (let note = 0; note < 3; note++) {
      const progress = ((now / 1500 + index * 0.3 + note / 3) % 1);
      context.globalAlpha = (1 - progress) * 0.75;
      drawNote(context, sx + Math.sin(beat / 3 + note) * 24, sy - dancer.height - progress * 36, 1);
    }
  });
  // Confetti fills the world rather than obstructing the player with a DOM overlay.
  for (let index = 0; index < 36; index++) {
    const sx = (index * 83 + Math.sin(beat / 4 + index) * 24 + width) % width;
    const sy = (index * 47 + (now % 100_000) / 40) % height;
    context.globalAlpha = 0.4;
    context.fillStyle = colour(index);
    context.fillRect(sx / scaleX, sy / scaleY, 3 / scaleX, 5 / scaleY);
  }
  context.restore();
}
