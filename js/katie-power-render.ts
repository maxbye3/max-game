import { getKatieNeighbours, getKatieProtagonist, getKatieRings, isKatiePowerActive, katieCharacterPose, katieCigaretteRemaining, katieInhale, katiePowerElapsed, katieSmokeRadius, katieVisualStrength } from './katie-power.js';
let terrainBuffer: HTMLCanvasElement | null = null;

/** Blocky, translucent clusters retain the game's pixel look at every scale. */
function smokeCloud(context: CanvasRenderingContext2D, x: number, y: number, size: number, phase: number): void {
  for (let block = 0; block < 7; block++) {
    const angle = block * 2.4 + phase;
    const radius = size * (block % 2 ? 0.35 : 0.55);
    const width = Math.max(3, Math.round(size * (0.8 + block % 3 * 0.12)));
    context.fillStyle = block % 2 ? '#d0c3c0' : '#ebe3d9';
    context.fillRect(Math.round(x + Math.cos(angle) * radius - width / 2), Math.round(y + Math.sin(angle) * radius * 0.55 - width / 3), width, Math.round(width * 0.65));
  }
}

export function withKatieBreak(context: CanvasRenderingContext2D, x: number, y: number, height: number, id: string, drawSprite: () => void, now: number): void {
  const pose = katieCharacterPose(id, now);
  if (!isKatiePowerActive(now) || (id !== 'player' && !pose.x && !pose.y && !pose.lean)) { drawSprite(); return; }
  context.save(); context.translate(x + pose.x, y + pose.y); context.rotate(pose.lean); context.translate(-x, -y);
  drawSprite();
  if (id === 'player') {
    const inhale = katieInhale(now); const strength = katieVisualStrength(now);
    const remaining = katieCigaretteRemaining(now); const cigarette = Math.max(2, Math.round(remaining * 12));
    const mouthY = y - height * 0.73;
    const handX = Math.round(x + 7); const handY = Math.round(mouthY + 7 * (1 - inhale));
    context.globalAlpha *= strength;
    context.translate(handX, handY); context.scale(height / 36, height / 36);
    context.fillStyle = '#ddb18b'; context.fillRect(-2, 2, 4, 6); context.fillRect(-1, 0, 6, 4);
    context.fillStyle = '#b68547'; context.fillRect(2, 0, 3, 3);
    context.fillStyle = '#fff5df'; context.fillRect(5, 0, cigarette, 3);
    context.fillStyle = inhale > 0.4 ? '#fff0a0' : '#ff6857'; context.fillRect(5 + cigarette, 0, 2, 3);
    context.globalAlpha *= 0.17 + inhale * 0.15; context.fillStyle = '#ff7b42';
    context.fillRect(cigarette, -4, 12, 11);
  }
  context.restore();
}

/** Drift the real scenery through a soft, smoky lens while the player remains sharp. */
export function drawKatieTerrain(context: CanvasRenderingContext2D, now: number): void {
  if (!isKatiePowerActive(now)) return;
  terrainBuffer ??= document.createElement('canvas');
  const { width, height } = context.canvas;
  if (terrainBuffer.width !== width || terrainBuffer.height !== height) { terrainBuffer.width = width; terrainBuffer.height = height; }
  const buffer = terrainBuffer.getContext('2d'); if (!buffer) return;
  const elapsed = katiePowerElapsed(now); const strength = katieVisualStrength(now);
  buffer.clearRect(0, 0, width, height);
  buffer.save(); buffer.filter = `saturate(${1 - strength * 0.75})`;
  buffer.drawImage(context.canvas, 0, 0); buffer.restore();
  context.save(); context.setTransform(1, 0, 0, 1, 0, 0); context.imageSmoothingEnabled = false;
  for (let y = 0; y < height; y += 8) {
    const shift = Math.round(Math.sin(y / 38 + elapsed / 550) * 5 * strength);
    const band = Math.min(8, height - y);
    context.drawImage(terrainBuffer, 0, y, width, band, shift - 8, y, width + 16, band);
  }
  context.globalAlpha = strength * 0.3; context.fillStyle = '#382d42'; context.fillRect(0, 0, width, height);
  context.globalAlpha = strength * 0.06;
  for (let cloud = 0; cloud < 12; cloud++) {
    const x = (cloud * 177 + elapsed * 0.02) % (width + 160) - 80;
    const y = (cloud * 97 + Math.sin(elapsed / 900 + cloud) * 18 + height) % height;
    smokeCloud(context, x, y, 65 + cloud % 3 * 25, cloud + elapsed / 1700);
  }
  context.restore();
}

export function drawKatieGround(context: CanvasRenderingContext2D, cameraX: number, cameraY: number, now: number, scaleX = 1, scaleY = 1): void {
  if (!isKatiePowerActive(now)) return;
  const strength = katieVisualStrength(now); const elapsed = katiePowerElapsed(now);
  const player = getKatieProtagonist(); const x = player.x - cameraX; const y = player.y - cameraY;
  context.save(); context.scale(scaleX, scaleY);
  context.globalAlpha = strength * 0.3; context.fillStyle = '#171425';
  context.beginPath(); context.ellipse(x, y, 47, 15, 0, 0, Math.PI * 2); context.fill();
  for (const [index, ring] of getKatieRings().entries()) {
    const radius = katieSmokeRadius(ring, now); const age = now - ring.time;
    context.globalAlpha = strength * Math.max(0, 0.45 - age / 18_000); context.strokeStyle = '#d6c8af'; context.lineWidth = 2;
    context.beginPath(); context.ellipse(ring.x - cameraX, ring.y - cameraY, 12 + radius, 5 + radius * 0.4, 0, 0, Math.PI * 2); context.stroke();
    for (let ash = 0; ash < 16; ash++) {
      const angle = ash * Math.PI / 8 + index;
      context.fillStyle = ash % 2 ? '#fff1d0' : '#8c737f';
      context.fillRect(Math.round(x + Math.cos(angle) * (radius * 0.7 + 8)), Math.round(y + Math.sin(angle) * radius * 0.3), 2, 2);
    }
  }
  // A slowly rotating ash ring reinforces that this is a stationary break.
  context.globalAlpha = strength * 0.7; context.fillStyle = '#f4ca8b';
  for (let ash = 0; ash < 12; ash++) {
    const angle = ash * Math.PI / 6 + elapsed / 1800;
    context.fillRect(Math.round(x + Math.cos(angle) * 39), Math.round(y + Math.sin(angle) * 13), 3, 2);
  }
  context.restore();
}

export function drawKatieWorld(context: CanvasRenderingContext2D, cameraX: number, cameraY: number, now: number, scaleX = 1, scaleY = 1, playerHeight = 36): void {
  if (!isKatiePowerActive(now)) return;
  const elapsed = katiePowerElapsed(now); const strength = katieVisualStrength(now);
  const player = getKatieProtagonist(); const x = player.x - cameraX; const y = player.y - cameraY;
  const width = context.canvas.width / scaleX; const height = context.canvas.height / scaleY;
  context.save(); context.scale(scaleX, scaleY); context.imageSmoothingEnabled = false;
  // Each breath becomes a moving smoke torus that sweeps through the actual world.
  for (const [index, ring] of getKatieRings().entries()) {
    const age = now - ring.time; const radius = Math.min(700, 10 + age * 0.095);
    const cx = ring.x - cameraX + Math.sin(age / 850 + index) * age * 0.017;
    const cy = ring.y - cameraY - playerHeight * 0.73 - Math.min(110, age * 0.026);
    for (let mote = 0; mote < 28; mote++) {
      const angle = mote * Math.PI / 14 + index + elapsed / 3200;
      const sx = cx + Math.cos(angle) * radius; const sy = cy + Math.sin(angle) * radius * 0.47;
      if (sx < -100 || sy < -100 || sx > width + 100 || sy > height + 100) continue;
      const distance = Math.hypot(sx - x, sy - (y - playerHeight * 0.73));
      context.globalAlpha = strength * (distance < 34 ? 0.035 : 0.085) * Math.max(0.15, 1 - age / 11000);
      smokeCloud(context, sx, sy, Math.min(64, 7 + age * 0.012), angle);
    }
  }
  // The smoke becomes a towering double spiral, with a clear pocket around Max.
  for (let strand = 0; strand < 2; strand++) {
    for (let cloud = 0; cloud < 18; cloud++) {
      const life = (elapsed / 3300 + cloud / 18) % 1;
      const angle = life * 11 + elapsed / 800 + strand * Math.PI;
      const sx = x + Math.sin(angle) * (12 + life * 90);
      const sy = y - playerHeight * 0.73 - life * 245;
      context.globalAlpha = strength * (1 - life) * (life < 0.12 ? 0.04 : 0.12);
      smokeCloud(context, sx, sy, 6 + life * 52, angle);
    }
  }
  const vignette = context.createRadialGradient(x, y - 25, 35, x, y - 25, Math.max(width, height) * 0.75);
  vignette.addColorStop(0, 'rgba(17,12,27,0)'); vignette.addColorStop(1, 'rgba(17,12,27,0.55)');
  context.globalAlpha = strength; context.fillStyle = vignette; context.fillRect(0, 0, width, height);
  for (let ash = 0; ash < 28; ash++) {
    const ax = (ash * 83 + elapsed * 0.025) % width;
    const ay = (ash * 67 + elapsed * (0.018 + ash % 4 * 0.003)) % height;
    context.globalAlpha = strength * 0.55; context.fillStyle = ash % 5 ? '#d0bda7' : '#ffa76b';
    context.fillRect(Math.round(ax), Math.round(ay), 2, 2);
  }
  // Continuous wisps rise from the shrinking cigarette between the large breaths.
  for (let wisp = 0; wisp < 12; wisp++) {
    const life = (elapsed / 1800 + wisp / 12) % 1;
    context.globalAlpha = strength * (1 - life) * 0.09;
    smokeCloud(context, x + 15 + Math.sin(life * 6 + wisp) * (7 + life * 30), y - playerHeight * 0.73 - life * 125, 3 + life * 20, life * 4);
  }
  for (const target of getKatieNeighbours()) {
    const pose = katieCharacterPose(target.id, now); const tx = target.x - cameraX + pose.x; const ty = target.y - cameraY + pose.y;
    if (tx < -60 || ty < -60 || tx > width + 60 || ty > height + 80) continue;
    const phase = (now - target.reachedAt + target.id.length * 60) % 1100;
    context.globalAlpha = strength * (1 - phase / 1100) * 0.18;
    smokeCloud(context, tx + phase * 0.01, ty - target.height * 0.65 - phase * 0.035, 9 + phase * 0.025, target.x);
    if (phase < 550) {
      context.globalAlpha = strength * (1 - phase / 550); context.fillStyle = '#f4dfbc'; context.font = 'bold 9px monospace'; context.textAlign = 'center';
      context.fillText('COUGH!', tx, ty - target.height - 7 - phase * 0.016);
    }
  }
  context.globalAlpha = strength; context.fillStyle = '#241e2b'; context.fillRect(x - 38, y - playerHeight - 25, 76, 13);
  context.fillStyle = '#f4dfbc'; context.font = 'bold 9px monospace'; context.textAlign = 'center'; context.fillText('TAKING A BREAK', x, y - playerHeight - 16);
  context.restore();
}
