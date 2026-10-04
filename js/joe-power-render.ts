import { getJoeNeighbours, getJoeProtagonist, getJoeVents, isJoePowerActive, joeCharacterPose, joePowerElapsed, joeVisualStrength } from './joe-power.js';
import { getPlayerHealth, PLAYER_MAX_HEALTH } from './player-health.js';

const FIRE = ['#8c251c', '#ff5724', '#ffab38', '#fff2a3'] as const;
let terrainBuffer: HTMLCanvasElement | null = null;

export function withJoeHeat(context: CanvasRenderingContext2D, x: number, y: number, id: string, drawSprite: () => void, now: number): void {
  const pose = joeCharacterPose(id, now);
  if (!pose.x && !pose.y && !pose.lean) { drawSprite(); return; }
  context.save();
  context.translate(x + pose.x, y + pose.y); context.rotate(pose.lean); context.translate(-x, -y);
  drawSprite(); context.restore();
}

/** A canvas copy bends the actual scenery into heat shimmer without affecting collision geometry. */
export function drawJoeTerrain(context: CanvasRenderingContext2D, now: number): void {
  if (!isJoePowerActive(now)) return;
  terrainBuffer ??= document.createElement('canvas');
  const { width, height } = context.canvas;
  if (terrainBuffer.width !== width || terrainBuffer.height !== height) { terrainBuffer.width = width; terrainBuffer.height = height; }
  const buffer = terrainBuffer.getContext('2d');
  if (!buffer) return;
  buffer.clearRect(0, 0, width, height); buffer.drawImage(context.canvas, 0, 0);
  const strength = joeVisualStrength(now);
  context.save(); context.setTransform(1, 0, 0, 1, 0, 0); context.imageSmoothingEnabled = false;
  for (let y = 0; y < height; y += 6) {
    const shift = Math.round(Math.sin(y / 17 - joePowerElapsed(now) / 95) * 4 * strength);
    const band = Math.min(6, height - y);
    context.drawImage(terrainBuffer, 0, y, width, band, shift - 5, y, width + 10, band);
  }
  context.globalAlpha = strength * 0.19; context.fillStyle = '#ff671c'; context.fillRect(0, 0, width, height); context.restore();
}

export function drawJoeGround(context: CanvasRenderingContext2D, cameraX: number, cameraY: number, now: number, scaleX = 1, scaleY = 1): void {
  if (!isJoePowerActive(now)) return;
  const strength = joeVisualStrength(now);
  context.save(); context.scale(scaleX, scaleY);
  for (const vent of getJoeVents()) {
    const age = now - vent.time;
    const life = age / 3400;
    const x = vent.x - cameraX; const y = vent.y - cameraY;
    context.globalAlpha = strength * (1 - life);
    context.fillStyle = '#2b181b'; context.beginPath(); context.ellipse(x, y, 25 + life * 30, 8 + life * 12, 0, 0, Math.PI * 2); context.fill();
    for (let branch = 0; branch < 7; branch++) {
      const angle = branch * Math.PI * 2 / 7 + vent.seed;
      const radius = Math.min(155, age * 0.16);
      context.beginPath(); context.moveTo(x, y);
      for (let segment = 1; segment <= 4; segment++) {
        const r = radius * segment / 4;
        context.lineTo(Math.round(x + Math.cos(angle) * r + Math.sin(segment * 5 + vent.seed) * 7), Math.round(y + Math.sin(angle) * r * 0.42));
      }
      context.lineWidth = 7; context.strokeStyle = '#411d23'; context.stroke();
      context.lineWidth = 3; context.strokeStyle = '#ff5926'; context.stroke();
      context.lineWidth = 1; context.strokeStyle = '#ffe77f'; context.stroke();
    }
    context.strokeStyle = '#ffae46'; context.lineWidth = 2;
    context.beginPath(); context.ellipse(x, y, 15 + age * 0.22, 5 + age * 0.075, 0, 0, Math.PI * 2); context.stroke();
  }
  context.restore();
}

function drawFlames(context: CanvasRenderingContext2D, x: number, y: number, height: number, seed: number, elapsed: number, alpha: number): void {
  context.save(); context.globalAlpha *= alpha;
  for (let flame = 0; flame < 9; flame++) {
    const phase = (elapsed / (430 + flame * 37) + flame * 0.17 + seed) % 1;
    const fx = Math.round(x + Math.sin(flame * 2.4 + seed) * 18 + Math.sin(elapsed / 170 + flame) * 3);
    const fy = Math.round(y - phase * height);
    const size = Math.max(2, Math.round((1 - phase) * 9));
    context.fillStyle = FIRE[flame % 3 + 1] ?? FIRE[1];
    context.fillRect(fx - size / 2, fy, size, size * 2);
    context.fillStyle = FIRE[3]; context.fillRect(fx, fy + size, 2, size);
  }
  context.restore();
}

export function drawJoeWorld(context: CanvasRenderingContext2D, cameraX: number, cameraY: number, now: number, scaleX = 1, scaleY = 1): void {
  if (!isJoePowerActive(now)) return;
  const elapsed = joePowerElapsed(now); const strength = joeVisualStrength(now);
  const width = context.canvas.width / scaleX; const height = context.canvas.height / scaleY;
  context.save(); context.scale(scaleX, scaleY); context.globalAlpha = strength;
  for (const vent of getJoeVents()) {
    const age = now - vent.time;
    const eruption = Math.max(0, Math.sin(Math.min(1, age / 1900) * Math.PI));
    drawFlames(context, vent.x - cameraX, vent.y - cameraY, 105 * eruption + 8, vent.seed, elapsed, (1 - age / 3400) * 0.8);
    for (let shard = 0; shard < 6; shard++) {
      const phase = (age / 950 + shard / 6) % 1;
      const sx = vent.x - cameraX + (shard - 2.5) * phase * 24;
      const sy = vent.y - cameraY - Math.sin(phase * Math.PI) * 65;
      context.fillStyle = FIRE[2]; context.fillRect(Math.round(sx), Math.round(sy), 3, 4);
    }
  }
  const player = getJoeProtagonist();
  const px = player.x - cameraX; const py = player.y - cameraY;
  context.globalAlpha = strength * 0.28; context.fillStyle = '#ff6628';
  context.beginPath(); context.ellipse(px, py - 24, 40, 48, 0, 0, Math.PI * 2); context.fill();
  context.globalAlpha = strength; drawFlames(context, px, py, 66, 0, elapsed, 0.95);
  for (const target of getJoeNeighbours()) {
    const pose = joeCharacterPose(target.id, now);
    const x = target.x - cameraX + pose.x; const y = target.y - cameraY + pose.y - target.height;
    context.globalAlpha = strength * 0.85; context.fillStyle = '#aee6f7';
    const drop = elapsed / 250 % 1;
    context.fillRect(Math.round(x + 12), Math.round(y + drop * 12), 3, 5);
    context.fillStyle = '#ffdc8d'; context.fillRect(x - 1, y - 14, 3, 8); context.fillRect(x - 1, y - 3, 3, 3);
  }
  for (let ember = 0; ember < 55; ember++) {
    const x = (ember * 71 + Math.sin(elapsed / 500 + ember) * 16 + width) % width;
    const y = ((ember * 113 - elapsed * (0.04 + ember % 4 * 0.018)) % height + height) % height;
    context.globalAlpha = strength * (0.25 + ember % 3 * 0.15); context.fillStyle = FIRE[ember % 3 + 1] ?? FIRE[1];
    context.fillRect(Math.round(x), Math.round(y), 2 + ember % 2, 4);
  }
  context.restore();
}

/** Health remains visible after the spectacle: the item has a real lasting cost. */
export function drawPlayerHealth(context: CanvasRenderingContext2D, now: number): void {
  const health = getPlayerHealth();
  if (health === PLAYER_MAX_HEALTH && !isJoePowerActive(now)) return;
  context.save(); context.setTransform(1, 0, 0, 1, 0, 0);
  // Keep this below the music/reset controls, at a readable CSS-pixel size on phones.
  const scale = context.canvas.width / (context.canvas.clientWidth || context.canvas.width);
  context.scale(scale, scale); context.translate(18, 110);
  const width = Math.min(120, context.canvas.width / scale * 0.3);
  context.fillStyle = '#17191c'; context.fillRect(0, 0, width + 8, 35);
  context.fillStyle = '#482530'; context.fillRect(4, 20, width, 9);
  context.fillStyle = isJoePowerActive(now) ? '#ff9d38' : '#c5ec98'; context.fillRect(4, 20, width * health / PLAYER_MAX_HEALTH, 9);
  context.fillStyle = '#f5fff6'; context.font = '12px monospace'; context.textAlign = 'left';
  context.fillText(`HP ${Math.round(health * 10) / 10}/${PLAYER_MAX_HEALTH}`, 4, 14);
  context.restore();
}
