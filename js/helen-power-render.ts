import { getHelenNeighbours, getHelenProtagonist, getHelenSteps, getHelenWaves, helenCharacterPose, helenPowerElapsed, helenVisualStrength, isHelenPowerActive } from './helen-power.js';

const PINK = '#ffb6d5';
const GOLD = '#ffe29b';
let terrainBuffer: HTMLCanvasElement | null = null;

/** Temporary horizontal expansion is anchored at the feet; collision coordinates stay stable. */
export function withHelenExpansion(context: CanvasRenderingContext2D, x: number, y: number, height: number, id: string, drawSprite: () => void, now: number): void {
  const pose = helenCharacterPose(id, now);
  if (pose.width === 1 && pose.rock === 0) { drawSprite(); return; }
  context.save();
  context.globalAlpha *= 0.2;
  context.fillStyle = '#211a38';
  context.beginPath(); context.ellipse(x, y + 2, height * 0.4, height * 0.085, 0, 0, Math.PI * 2); context.fill();
  context.restore();
  context.save();
  context.translate(x, y);
  context.scale(pose.width, 1);
  context.rotate(pose.rock);
  context.translate(-x, -y);
  drawSprite();
  context.restore();
}

/** Repaint only the scenery as elastic pixel bands; sprites and controls stay readable. */
export function drawHelenTerrain(context: CanvasRenderingContext2D, now: number): void {
  if (!isHelenPowerActive(now)) return;
  terrainBuffer ??= document.createElement('canvas');
  const { width, height } = context.canvas;
  if (terrainBuffer.width !== width || terrainBuffer.height !== height) { terrainBuffer.width = width; terrainBuffer.height = height; }
  const buffer = terrainBuffer.getContext('2d');
  if (!buffer) return;
  buffer.clearRect(0, 0, width, height);
  buffer.drawImage(context.canvas, 0, 0);
  const elapsed = helenPowerElapsed(now);
  const strength = helenVisualStrength(now);
  context.save();
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.imageSmoothingEnabled = false;
  const expansion = width * 0.025 * strength;
  for (let y = 0; y < height; y += 8) {
    const bend = Math.round((Math.sin(y / 38 - elapsed / 420) + Math.sin(y / 71 + elapsed / 700)) * 4 * strength);
    const bandHeight = Math.min(8, height - y);
    context.drawImage(terrainBuffer, 0, y, width, bandHeight, -expansion + bend, y, width + expansion * 2, bandHeight);
  }
  context.fillStyle = '#ef99b5';
  context.globalAlpha = strength * 0.12;
  context.fillRect(0, 0, width, height);
  context.restore();
}

export function drawHelenGround(context: CanvasRenderingContext2D, cameraX: number, cameraY: number, now: number, scaleX = 1, scaleY = 1): void {
  if (!isHelenPowerActive(now)) return;
  const strength = helenVisualStrength(now);
  context.save();
  context.scale(scaleX, scaleY);
  for (const step of getHelenSteps()) {
    const life = (now - step.time) / 1800;
    const x = step.x - cameraX + step.side * 12;
    const y = step.y - cameraY;
    context.globalAlpha = (1 - life) * strength * 0.6;
    context.fillStyle = '#493747';
    context.fillRect(Math.round(x - 9), Math.round(y - 3), 19, 6);
    context.fillStyle = GOLD;
    context.fillRect(Math.round(x - 6), Math.round(y - 2), 13, 2);
    context.strokeStyle = PINK;
    context.lineWidth = 2;
    context.beginPath(); context.ellipse(x, y, 12 + life * 65, 4 + life * 18, 0, 0, Math.PI * 2); context.stroke();
  }
  for (const wave of getHelenWaves()) {
    const life = (now - wave.time) / 4000;
    const radius = (now - wave.time) * 0.5;
    context.globalAlpha = (1 - life) * strength * 0.6;
    context.strokeStyle = PINK;
    context.lineWidth = 3;
    context.beginPath(); context.ellipse(wave.x - cameraX, wave.y - cameraY, 15 + radius, 6 + radius * 0.36, 0, 0, Math.PI * 2); context.stroke();
    context.strokeStyle = GOLD;
    context.lineWidth = 1;
    context.beginPath(); context.ellipse(wave.x - cameraX, wave.y - cameraY, 24 + radius, 9 + radius * 0.36, 0, 0, Math.PI * 2); context.stroke();
    for (let chip = 0; chip < 24; chip++) {
      const angle = chip * Math.PI / 12;
      const x = wave.x - cameraX + Math.cos(angle) * radius;
      const y = wave.y - cameraY + Math.sin(angle) * radius * 0.36;
      context.fillStyle = chip % 2 ? PINK : GOLD;
      context.fillRect(Math.round(x), Math.round(y - Math.sin(life * Math.PI) * 9), 6, 2);
    }
  }
  context.restore();
}

export function drawHelenWorld(context: CanvasRenderingContext2D, cameraX: number, cameraY: number, now: number, scaleX = 1, scaleY = 1): void {
  if (!isHelenPowerActive(now)) return;
  const elapsed = helenPowerElapsed(now);
  const strength = helenVisualStrength(now);
  context.save();
  context.scale(scaleX, scaleY);
  // Slow buoyant rings make the entire scene feel dense, springy and pressurised.
  for (let bubble = 0; bubble < 24; bubble++) {
    const width = context.canvas.width / scaleX;
    const height = context.canvas.height / scaleY;
    const x = (bubble * 103 + Math.sin(elapsed / 800 + bubble) * 12 + width) % width;
    const y = (bubble * 79 - elapsed / 100 + height * 20) % height;
    context.globalAlpha = strength * 0.3;
    context.strokeStyle = bubble % 2 ? PINK : GOLD;
    context.lineWidth = 1;
    context.beginPath(); context.ellipse(x, y, 9 + bubble % 4 * 4, 5 + bubble % 4 * 2, 0, 0, Math.PI * 2); context.stroke();
  }
  const protagonist = getHelenProtagonist();
  const targets = [{ id: 'player', x: protagonist.x, y: protagonist.y, height: 44 }, ...getHelenNeighbours()];
  for (const target of targets) {
    const x = target.x - cameraX;
    const y = target.y - cameraY - target.height * 0.45;
    if (x < -80 || x > context.canvas.width / scaleX + 80 || y < -80 || y > context.canvas.height / scaleY + 80) continue;
    const pose = helenCharacterPose(target.id, now);
    context.globalAlpha = strength * Math.min(1, (pose.width - 1) * 2) * 0.65;
    context.strokeStyle = PINK;
    context.lineWidth = 2;
    const pulse = (elapsed / 1200 + target.x / 1000) % 1;
    for (let side = -1; side <= 1; side += 2) {
      const edge = x + side * (target.height * 0.42 + pulse * 9);
      context.beginPath(); context.moveTo(edge - side * 5, y - 7); context.lineTo(edge, y); context.lineTo(edge - side * 5, y + 7); context.stroke();
    }
  }
  context.restore();
}
