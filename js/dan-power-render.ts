import { danPowerElapsed, danPowerSecondsLeft, danRiotPose, getDanRavers, getDanWearer, isDanPowerActive } from './dan-power.js';

const COLOURS = ['#fa5cad', '#53e9ed', '#ffdf75', '#ae86ff'] as const;
const colour = (index: number): string => COLOURS[(index % COLOURS.length + COLOURS.length) % COLOURS.length] ?? COLOURS[0];

export function withDanRiot(context: CanvasRenderingContext2D, x: number, y: number, height: number, id: string, drawSprite: () => void, now = performance.now()): void {
  const pose = danRiotPose(id, now);
  if (pose.rotation === 0 && pose.bounce === 0) { drawSprite(); return; }
  context.save();
  context.translate(x, y - pose.bounce * height / 52);
  context.rotate(pose.rotation);
  context.translate(-x, -y);
  drawSprite();
  context.restore();
}

function drawMirrorBall(context: CanvasRenderingContext2D, x: number, y: number, radius: number, elapsed: number): void {
  const cell = Math.max(2, Math.round(radius / 4));
  for (let row = -4; row <= 4; row++) {
    for (let column = -4; column <= 4; column++) {
      if (row * row + column * column > 18) continue;
      context.fillStyle = colour(column + row + Math.floor(elapsed / 420));
      context.fillRect(Math.round(x + column * cell), Math.round(y + row * cell), cell - 1, cell - 1);
    }
  }
}

function drawBroadcast(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, elapsed: number): void {
  context.save();
  context.translate(Math.round(x), Math.round(y));
  context.fillStyle = '#110b20';
  context.fillRect(-4, -17, width + 8, height + 29);
  context.fillStyle = '#ffe376';
  context.font = 'bold 8px monospace';
  context.textAlign = 'left';
  context.fillText('BANGFACE TV  /  CH 2', 1, -6);
  // A procedural live feed: scrolling plasma, equaliser towers and pixel ravers.
  for (let row = 0; row < height; row += 5) {
    for (let column = 0; column < width; column += 5) {
      const band = Math.floor(2 + Math.sin(column / 14 + elapsed / 700) * 2 + Math.cos(row / 12 - elapsed / 550) * 2);
      context.globalAlpha = 0.2;
      context.fillStyle = colour(band);
      context.fillRect(column, row, 5, 5);
    }
  }
  context.globalAlpha = 0.8;
  for (let tower = 0; tower < 14; tower++) {
    const towerHeight = (0.25 + Math.abs(Math.sin(elapsed / 230 + tower))) * height * 0.6;
    context.fillStyle = colour(tower);
    for (let segment = 0; segment < towerHeight; segment += 5) {
      context.fillRect(tower * width / 14, height - segment - 5, Math.max(2, width / 14 - 2), 3);
    }
  }
  context.globalAlpha = 1;
  for (let dancer = 0; dancer < 5; dancer++) {
    const dx = (dancer + 0.5) * width / 5;
    const dy = height * 0.7 - Math.abs(Math.sin(elapsed / 140 + dancer)) * 7;
    context.fillStyle = '#120d25';
    context.fillRect(dx - 3, dy - 12, 6, 6);
    context.fillRect(dx - 4, dy - 5, 8, 13);
    context.fillRect(dx - 7, dy - 9 + Math.sin(elapsed / 100 + dancer) * 5, 3, 12);
    context.fillRect(dx + 4, dy - 9 - Math.sin(elapsed / 100 + dancer) * 5, 3, 12);
    context.fillRect(dx - 5, dy + 8, 3, 10);
    context.fillRect(dx + 2, dy + 8, 3, 10);
  }
  context.globalAlpha = 0.14;
  context.fillStyle = '#000';
  for (let scan = 0; scan < height; scan += 4) context.fillRect(0, scan, width, 1);
  context.globalAlpha = 1;
  context.fillStyle = '#fa5cad';
  context.fillRect(0, height + 4, 4, 4);
  context.fillStyle = '#fff1ae';
  context.fillText('LIVE', 8, height + 8);
  context.restore();
}

export function drawDanWorld(context: CanvasRenderingContext2D, cameraX: number, cameraY: number, now: number, scaleX = 1, scaleY = 1): void {
  if (!isDanPowerActive(now)) return;
  const elapsed = danPowerElapsed(now);
  const strength = Math.min(1, elapsed / 250, danPowerSecondsLeft(now) * 3);
  const width = context.canvas.width;
  const height = context.canvas.height;
  const wearer = getDanWearer();
  const x = (wearer.x - cameraX) * scaleX;
  const y = (wearer.y - cameraY - 32) * scaleY;
  context.save();
  context.globalAlpha = strength;
  context.fillStyle = 'rgba(24, 8, 49, 0.28)';
  context.fillRect(0, 0, width, height);
  // Rotating, translucent laser fans spill from the helmet into the world.
  for (let beam = 0; beam < 8; beam++) {
    const angle = beam * Math.PI / 4 + elapsed / 2200;
    const radius = Math.max(width, height) * 1.5;
    context.globalAlpha = strength * 0.085;
    context.fillStyle = colour(beam);
    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(x + Math.cos(angle - 0.06) * radius, y + Math.sin(angle - 0.06) * radius);
    context.lineTo(x + Math.cos(angle + 0.06) * radius, y + Math.sin(angle + 0.06) * radius);
    context.closePath();
    context.fill();
  }
  context.scale(scaleX, scaleY);
  getDanRavers().forEach((raver, index) => {
    const rx = raver.x - cameraX;
    const ry = raver.y - cameraY;
    if (rx < -60 || ry < -60 || rx > width / scaleX + 60 || ry > height / scaleY + 80) return;
    context.globalAlpha = strength * 0.6;
    context.strokeStyle = colour(index);
    context.lineWidth = 2;
    context.beginPath();
    context.ellipse(rx, ry + 2, 26 + Math.sin(elapsed / 130 + index) * 6, 9, 0, 0, Math.PI * 2);
    context.stroke();
    context.globalAlpha = strength;
    drawMirrorBall(context, rx - 2, ry - raver.height - 20, 7, elapsed + index * 200);
  });
  const playerX = wearer.x - cameraX;
  const playerY = wearer.y - cameraY;
  for (let ring = 0; ring < 3; ring++) {
    const progress = (elapsed / 1300 + ring / 3) % 1;
    context.globalAlpha = strength * (1 - progress) * 0.6;
    context.strokeStyle = colour(ring);
    context.beginPath();
    context.ellipse(playerX, playerY, 24 + progress * 260, 8 + progress * 105, 0, 0, Math.PI * 2);
    context.stroke();
  }
  context.restore();
  context.save();
  context.globalAlpha = strength;
  // Keep the broadcast beside the wearer so mobile movement controls remain clear.
  const screenWidth = Math.min(150, width * 0.29);
  drawBroadcast(context, 12, height * 0.46, screenWidth, screenWidth * 0.52, elapsed);
  context.globalAlpha = strength * 0.09;
  context.fillStyle = '#110620';
  for (let scan = 0; scan < height; scan += 6) context.fillRect(0, scan, width, 1);
  context.restore();
}

export function drawDanPlayer(context: CanvasRenderingContext2D, x: number, y: number, playerHeight: number, now: number): void {
  if (!isDanPowerActive(now)) return;
  const elapsed = danPowerElapsed(now);
  const scale = Math.max(0.7, playerHeight / 52);
  context.save();
  context.translate(Math.round(x), Math.round(y - playerHeight * 0.82));
  context.scale(scale, scale);
  // A chunky riot helmet with rotating mirrored facets and a captive TV visor.
  context.fillStyle = '#191529';
  context.fillRect(-17, -18, 34, 29);
  context.fillRect(-20, -12, 40, 21);
  context.fillRect(-14, 10, 6, 12);
  context.fillRect(8, 10, 6, 12);
  drawMirrorBall(context, 0, -7, 17, elapsed);
  context.fillStyle = '#1d1733';
  context.fillRect(-18, -4, 36, 15);
  for (let band = 0; band < 5; band++) {
    context.fillStyle = colour(band + Math.floor(elapsed / 600));
    context.fillRect(-14 + band * 6, -1 + Math.sin(elapsed / 180 + band) * 2, 5, 8);
  }
  context.fillStyle = '#fff4bb';
  context.fillRect(-16, -3, 32, 1);
  context.fillRect(-15, 0, 6, 2);
  context.font = 'bold 8px monospace';
  context.textAlign = 'center';
  context.fillText('2', 0, 8);
  // The hypnotised wearer stays rooted while the screen pulses around their head.
  context.globalAlpha = 0.5;
  context.strokeStyle = '#72ffff';
  context.lineWidth = 1;
  for (let ring = 0; ring < 2; ring++) {
    const progress = (elapsed / 1000 + ring / 2) % 1;
    context.globalAlpha = 0.5 * (1 - progress);
    context.beginPath();
    context.ellipse(0, 0, 23 + progress * 25, 16 + progress * 12, 0, 0, Math.PI * 2);
    context.stroke();
  }
  context.restore();
}
