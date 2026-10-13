import { getMikeJoyGuests, getMikeJoyTrails, getMikeOrigin, getMikeProtagonist, isMikePowerActive, isMikeTargetHappy, mikeCharacterPose, mikeHappinessMultiplier, mikeJoyRadius, mikePowerElapsed, mikeVisualStrength } from './mike-power.js';
const JOY_COLOURS = ['#f97981', '#ffa661', '#ffe985', '#b6ed84', '#86dce7', '#b9a0ef'] as const;
let terrainBuffer: HTMLCanvasElement | null = null;

function flower(context: CanvasRenderingContext2D, x: number, y: number, size: number, seed: number, now: number): void {
  context.save(); context.translate(Math.round(x), Math.round(y)); context.scale(size / 12, size / 12);
  const sway = Math.round(Math.sin(now / 320 + seed) * 2);
  context.fillStyle = '#457f4c'; context.fillRect(-1, -1, 2, 10); context.fillRect(1, 3, 4, 2);
  context.fillStyle = JOY_COLOURS[seed % JOY_COLOURS.length]!;
  context.fillRect(-5 + sway, -7, 10, 4); context.fillRect(-3 + sway, -9, 6, 8);
  context.fillStyle = '#fff4b2'; context.fillRect(-2 + sway, -6, 4, 3);
  context.restore();
}
function smile(context: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  context.save(); context.translate(Math.round(x), Math.round(y)); context.scale(size / 16, size / 16);
  context.fillStyle = '#ffdb65'; context.fillRect(-6, -8, 12, 16); context.fillRect(-8, -6, 16, 12);
  context.fillStyle = '#633a35'; context.fillRect(-4, -3, 2, 3); context.fillRect(2, -3, 2, 3);
  context.fillRect(-4, 2, 2, 2); context.fillRect(-2, 4, 4, 2); context.fillRect(2, 2, 2, 2);
  context.fillStyle = '#f58b73'; context.fillRect(-6, 0, 2, 2); context.fillRect(4, 0, 2, 2);
  context.restore();
}
function cookie(context: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  context.save(); context.translate(Math.round(x), Math.round(y)); context.scale(size / 16, size / 16);
  context.fillStyle = '#ad642a'; context.fillRect(-6, -7, 12, 14); context.fillRect(-8, -4, 16, 8);
  context.fillStyle = '#efb24f'; context.fillRect(-5, -6, 10, 12); context.fillRect(-7, -3, 14, 6);
  context.fillStyle = '#754329'; context.fillRect(-4, -3, 3, 3); context.fillRect(2, -5, 3, 3); context.fillRect(1, 1, 3, 3); context.fillRect(-4, 3, 2, 2);
  context.restore();
}
function butterfly(context: CanvasRenderingContext2D, x: number, y: number, size: number, phase: number, seed: number): void {
  const flap = 0.4 + Math.abs(Math.sin(phase)) * 0.6;
  context.save(); context.translate(Math.round(x), Math.round(y)); context.scale(size / 12, size / 12);
  context.fillStyle = JOY_COLOURS[seed % JOY_COLOURS.length]!;
  context.fillRect(-6 * flap, -5, 5 * flap, 6); context.fillRect(1, -5, 5 * flap, 6);
  context.fillRect(-4 * flap, 1, 3 * flap, 3); context.fillRect(1, 1, 3 * flap, 3);
  context.fillStyle = '#fff6bf'; context.fillRect(-4 * flap, -3, 2 * flap, 2); context.fillRect(2, -3, 2 * flap, 2);
  context.fillStyle = '#715440'; context.fillRect(-1, -4, 2, 8);
  context.restore();
}

export function withMikeJoy(context: CanvasRenderingContext2D, x: number, y: number, height: number, id: string, drawSprite: () => void, now: number): void {
  if (!isMikePowerActive(now) || (id !== 'player' && !isMikeTargetHappy(id, now))) { drawSprite(); return; }
  const pose = mikeCharacterPose(id, now);
  context.save(); context.translate(x + pose.x, y + pose.y); context.rotate(pose.lean); context.scale(pose.scale, pose.scale); context.translate(-x, -y);
  drawSprite();
  if (id === 'player') {
    context.globalAlpha *= mikeVisualStrength(now);
    cookie(context, x + height * 0.3, y - height * 0.5, height * 0.32);
    for (let crumb = 0; crumb < 4; crumb++) {
      const life = (mikePowerElapsed(now) / 800 + crumb / 4) % 1;
      context.globalAlpha = mikeVisualStrength(now) * (1 - life); context.fillStyle = '#ffc56e';
      context.fillRect(x + 9 + life * (crumb - 1) * 8, y - height * 0.45 + life * 22, 2, 2);
    }
  }
  context.restore();
}

/** The happiness lift brightens the real scenery, with all sprites drawn sharply afterwards. */
export function drawMikeTerrain(context: CanvasRenderingContext2D, now: number): void {
  if (!isMikePowerActive(now)) return;
  terrainBuffer ??= document.createElement('canvas');
  const { width, height } = context.canvas;
  if (terrainBuffer.width !== width || terrainBuffer.height !== height) { terrainBuffer.width = width; terrainBuffer.height = height; }
  const buffer = terrainBuffer.getContext('2d'); if (!buffer) return;
  buffer.clearRect(0, 0, width, height); buffer.drawImage(context.canvas, 0, 0);
  const strength = mikeVisualStrength(now);
  context.save(); context.setTransform(1, 0, 0, 1, 0, 0); context.imageSmoothingEnabled = false;
  context.globalAlpha = strength; context.filter = 'saturate(1.36) brightness(1.08)'; context.drawImage(terrainBuffer, 0, 0);
  context.filter = 'none'; context.globalAlpha = strength * 0.08; context.fillStyle = '#ffe7a6'; context.fillRect(0, 0, width, height);
  context.restore();
}

export function drawMikeGround(context: CanvasRenderingContext2D, cameraX: number, cameraY: number, now: number, scaleX = 1, scaleY = 1): void {
  if (!isMikePowerActive(now)) return;
  const strength = mikeVisualStrength(now); const elapsed = mikePowerElapsed(now); const origin = getMikeOrigin();
  const width = context.canvas.width / scaleX; const height = context.canvas.height / scaleY;
  context.save(); context.scale(scaleX, scaleY); context.imageSmoothingEnabled = false;
  // The growing meadow is world-anchored, and travelling leaves a fresh garden behind Max.
  for (let bloom = 0; bloom < 100; bloom++) {
    const angle = bloom * 2.399963; const radius = 30 + Math.sqrt(bloom) * 56;
    if (radius > mikeJoyRadius(now)) continue;
    const x = origin.x - cameraX + Math.cos(angle) * radius; const y = origin.y - cameraY + Math.sin(angle) * radius * 0.75;
    if (x < -25 || y < -25 || x > width + 25 || y > height + 25) continue;
    const arrival = Math.min(1, Math.max(0, elapsed - radius / 0.4) / 500);
    context.globalAlpha = strength * arrival * 0.8; flower(context, x, y, (10 + bloom % 4 * 2) * arrival, bloom, elapsed);
  }
  for (const trail of getMikeJoyTrails()) {
    const age = now - trail.time; const grow = Math.min(1, age / 200);
    context.globalAlpha = strength * Math.min(1, (2600 - age) / 650);
    for (let petal = 0; petal < 3; petal++) flower(context, trail.x - cameraX + Math.cos(petal * 2.1 + trail.seed) * 12, trail.y - cameraY + Math.sin(petal * 2.1 + trail.seed) * 7, (9 + petal * 3) * grow, trail.seed + petal, elapsed);
  }
  for (let wave = 0; wave < 3; wave++) {
    const age = elapsed - wave * 1700; if (age < 0) continue;
    const radius = age * 0.4;
    context.globalAlpha = strength * Math.max(0, 0.6 - age / 9000); context.strokeStyle = JOY_COLOURS[wave * 2]!; context.lineWidth = 5;
    context.beginPath(); context.ellipse(origin.x - cameraX, origin.y - cameraY, radius, radius * 0.75, 0, 0, Math.PI * 2); context.stroke();
  }
  context.restore();
}

export function drawMikeWorld(context: CanvasRenderingContext2D, cameraX: number, cameraY: number, now: number, scaleX = 1, scaleY = 1, playerHeight = 36): void {
  if (!isMikePowerActive(now)) return;
  const strength = mikeVisualStrength(now); const elapsed = mikePowerElapsed(now); const player = getMikeProtagonist();
  const x = player.x - cameraX; const y = player.y - cameraY;
  const width = context.canvas.width / scaleX; const height = context.canvas.height / scaleY;
  context.save(); context.scale(scaleX, scaleY); context.imageSmoothingEnabled = false;
  // A panoramic rainbow arches over the actual scene, leaving the centre playable.
  const rainbowRadius = Math.max(width * 0.5, 170); const rainbowY = height * 0.65;
  for (let stripe = 0; stripe < JOY_COLOURS.length; stripe++) {
    context.globalAlpha = strength * 0.22; context.strokeStyle = JOY_COLOURS[stripe]!; context.lineWidth = 8;
    context.beginPath(); context.ellipse(width * 0.5, rainbowY, rainbowRadius - stripe * 10, rainbowRadius * 0.6 - stripe * 6, 0, Math.PI, Math.PI * 2); context.stroke();
  }
  const sunX = width * 0.77; const sunY = height * 0.2;
  context.globalAlpha = strength * 0.15; context.fillStyle = '#fff8b0';
  for (let ray = 0; ray < 12; ray++) {
    const angle = ray * Math.PI / 6 + elapsed / 7000;
    context.beginPath(); context.moveTo(sunX + Math.cos(angle - 0.06) * 35, sunY + Math.sin(angle - 0.06) * 35);
    context.lineTo(sunX + Math.cos(angle - 0.03) * 230, sunY + Math.sin(angle - 0.03) * 230);
    context.lineTo(sunX + Math.cos(angle + 0.03) * 230, sunY + Math.sin(angle + 0.03) * 230); context.fill();
  }
  context.globalAlpha = strength * 0.85; smile(context, sunX, sunY, Math.min(62, width * 0.13));
  for (let butterflyIndex = 0; butterflyIndex < 20; butterflyIndex++) {
    const angle = elapsed / (850 + butterflyIndex * 15) + butterflyIndex * 2.4;
    const radius = 24 + butterflyIndex * 6;
    const bx = x + Math.cos(angle) * radius; const by = y - playerHeight - 8 + Math.sin(angle) * radius * 0.5;
    context.globalAlpha = strength * (butterflyIndex < 4 ? 0.9 : 0.65);
    butterfly(context, bx, by, 8 + butterflyIndex % 4 * 2, elapsed / 65 + butterflyIndex, butterflyIndex);
  }
  for (const guest of getMikeJoyGuests()) {
    const pose = mikeCharacterPose(guest.id, now); const gx = guest.x - cameraX + pose.x; const gy = guest.y - cameraY + pose.y;
    if (gx < -60 || gy < -60 || gx > width + 60 || gy > height + 80) continue;
    const age = now - guest.reachedAt;
    context.globalAlpha = strength * 0.9; smile(context, gx, gy - guest.height - 13 - Math.sin(age / 350) * 3, 13);
    for (let mote = 0; mote < 4; mote++) {
      const life = (age / 1400 + mote / 4) % 1;
      context.globalAlpha = strength * (1 - life); context.fillStyle = JOY_COLOURS[mote + 1]!;
      context.fillRect(Math.round(gx + Math.sin(life * 6 + mote) * 21), Math.round(gy - guest.height * 0.7 - life * 42), 3, 3);
    }
    if (age < 1400) {
      context.globalAlpha = strength * Math.min(1, age / 200, (1400 - age) / 300); context.fillStyle = '#294d37'; context.font = 'bold 9px monospace'; context.textAlign = 'center';
      context.fillText('HAHA!', gx, gy - guest.height - 28);
    }
  }
  context.globalAlpha = strength; context.fillStyle = '#294d37'; context.font = 'bold 11px monospace'; context.textAlign = 'center';
  const labelY = Math.min(height - 16, y + 24);
  context.fillStyle = '#fff6cc'; context.fillRect(x - 48, labelY - 13, 96, 19);
  context.fillStyle = '#315a36'; context.fillText(`JOY ${Math.round(mikeHappinessMultiplier(now) * 100)}%`, x, labelY);
  context.restore();
}
