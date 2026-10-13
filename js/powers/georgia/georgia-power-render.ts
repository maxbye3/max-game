import { georgiaFlightElapsed, georgiaFlightPose, georgiaFlightStrength, getGeorgiaPassengers, getGeorgiaRider, getGeorgiaThreads, getGeorgiaVelocity, isGeorgiaPowerActive } from './georgia-power.js';

const GOLD = '#ffdf82';
const COLOURS = ['#b44364', '#278e99', '#65549e', '#cb703f'] as const;

function drawCarpet(context: CanvasRenderingContext2D, width: number, elapsed: number, variant: number): void {
  // Fluttering strips preserve the woven pixel edges instead of a smooth ellipse.
  const colour = COLOURS[variant % COLOURS.length] ?? COLOURS[0];
  for (let row = -10; row <= 10; row += 2) {
    const flutter = Math.round(Math.sin(elapsed / 150 + row / 4) * 2);
    const edge = width / 2 - Math.abs(row) * 0.35;
    context.fillStyle = Math.abs(row) >= 8 ? GOLD : colour;
    context.fillRect(-edge, row + flutter, edge * 2, 2);
    context.fillStyle = '#251d49';
    context.fillRect(-edge + 4, row + flutter, 2, 2);
    context.fillRect(edge - 6, row + flutter, 2, 2);
  }
  context.strokeStyle = GOLD;
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(-9, 0); context.lineTo(0, -6); context.lineTo(9, 0); context.lineTo(0, 6); context.closePath(); context.stroke();
  for (let end = -1; end <= 1; end += 2) {
    for (let fringe = -7; fringe <= 7; fringe += 3) {
      const flap = Math.sin(elapsed / 120 + fringe) * 3;
      context.fillStyle = GOLD;
      context.fillRect(end * (width / 2 + 1), fringe + flap, end * 7, 1);
    }
  }
}

/** Every airborne sprite gets its own woven carpet, ground shadow and banking pose. */
export function withGeorgiaFlight(context: CanvasRenderingContext2D, x: number, y: number, height: number, id: string, drawSprite: () => void, now: number): void {
  const pose = georgiaFlightPose(id, now);
  if (!pose.strength) { drawSprite(); return; }
  const size = Math.max(0.6, height / 52);
  const elapsed = georgiaFlightElapsed(now);
  context.save();
  context.fillStyle = '#18262c';
  context.globalAlpha = 0.25 * pose.strength;
  context.beginPath(); context.ellipse(x, y + 3 * size, 27 * size, 6 * size, 0, 0, Math.PI * 2); context.fill();
  context.restore();
  context.save();
  context.translate(Math.round(x), Math.round(y - pose.lift * size));
  context.rotate(pose.bank);
  context.save();
  context.scale(size, size);
  context.globalAlpha = pose.strength;
  drawCarpet(context, id === 'player' ? 65 : 54, elapsed, id === 'player' ? 0 : id.charCodeAt(0));
  context.restore();
  context.translate(-x, -y);
  drawSprite();
  context.restore();
}

/** Slipstream curls, cloud shadows and a wake anchored to actual flight coordinates. */
export function drawGeorgiaGround(context: CanvasRenderingContext2D, cameraX: number, cameraY: number, now: number): void {
  if (!isGeorgiaPowerActive(now)) return;
  const strength = georgiaFlightStrength(now);
  const elapsed = georgiaFlightElapsed(now);
  const rider = getGeorgiaRider();
  context.save();
  const trail = getGeorgiaThreads();
  for (let lane = -1; lane <= 1; lane++) {
    for (let index = 1; index < trail.length; index++) {
      const from = trail[index - 1]; const to = trail[index];
      if (!from || !to) continue;
      const age = (now - to.time) / 1500;
      const wave = Math.sin(to.time / 100 + lane) * 6;
      context.globalAlpha = strength * (1 - age) * 0.75;
      context.strokeStyle = lane === 0 ? GOLD : '#7be9e6';
      context.fillStyle = context.strokeStyle;
      context.lineWidth = lane === 0 ? 3 : 1;
      context.beginPath();
      context.moveTo(from.x - cameraX + lane * 12, from.y - cameraY - 35 + wave);
      context.lineTo(to.x - cameraX + lane * 12, to.y - cameraY - 35 + wave);
      context.stroke();
      if (index % 4 === 0) context.fillRect(to.x - cameraX + lane * 12, to.y - cameraY - 38 + wave, 3, 3);
    }
  }
  for (let ring = 0; ring < 4; ring++) {
    const progress = (elapsed / 1800 + ring / 4) % 1;
    context.globalAlpha = strength * (1 - progress) * 0.3;
    context.strokeStyle = ring % 2 ? GOLD : '#9ae9e6';
    context.lineWidth = 2;
    context.beginPath();
    context.ellipse(rider.x - cameraX, rider.y - cameraY, 40 + progress * 470, 15 + progress * 165, -0.1, 0, Math.PI * 2);
    context.stroke();
  }
  for (const passenger of getGeorgiaPassengers()) {
    context.globalAlpha = strength * 0.35;
    context.strokeStyle = GOLD;
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(rider.x - cameraX, rider.y - cameraY);
    context.quadraticCurveTo((rider.x + passenger.x) / 2 - cameraX, (rider.y + passenger.y) / 2 - cameraY - 45, passenger.x - cameraX, passenger.y - cameraY);
    context.stroke();
  }
  context.restore();
}

function drawCloud(context: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  context.fillRect(x, y, size * 1.7, size * 0.2);
  context.fillRect(x + size * 0.2, y - size * 0.18, size * 1.2, size * 0.3);
  context.fillRect(x + size * 0.5, y - size * 0.35, size * 0.6, size * 0.4);
}

export function drawGeorgiaSky(context: CanvasRenderingContext2D, now: number): void {
  if (!isGeorgiaPowerActive(now)) return;
  const elapsed = georgiaFlightElapsed(now);
  const strength = georgiaFlightStrength(now);
  const velocity = getGeorgiaVelocity();
  const { width, height } = context.canvas;
  context.save();
  context.globalAlpha = strength * 0.12;
  context.fillStyle = '#74cdd9';
  context.fillRect(0, 0, width, height);
  for (let cloud = 0; cloud < 9; cloud++) {
    const size = 24 + cloud % 4 * 15;
    const x = ((cloud * 173 - elapsed * (0.012 + cloud % 3 * 0.006) - velocity.x * 0.07) % (width + 180) + width + 180) % (width + 180) - 120;
    const y = (cloud * 111 + Math.sin(elapsed / 1200 + cloud) * 10 + height) % height;
    context.globalAlpha = strength * 0.12;
    context.fillStyle = '#204863';
    drawCloud(context, Math.round(x + 14), Math.round(y + 55), size);
    context.globalAlpha = strength * 0.4;
    context.fillStyle = '#e6fbf4';
    drawCloud(context, Math.round(x), Math.round(y), size);
  }
  const angle = Math.atan2(velocity.y, velocity.x || 0.01);
  const speed = Math.min(1, Math.hypot(velocity.x, velocity.y) / 450);
  for (let gust = 0; gust < 34; gust++) {
    const x = (gust * 97 + elapsed * 0.12) % width;
    const y = (gust * 61 + elapsed * 0.037) % height;
    context.globalAlpha = strength * (0.1 + speed * 0.25);
    context.strokeStyle = gust % 4 ? '#e9fffc' : GOLD;
    context.lineWidth = 1;
    context.beginPath(); context.moveTo(x, y);
    context.lineTo(x - Math.cos(angle) * (10 + speed * 30), y - Math.sin(angle) * (10 + speed * 30)); context.stroke();
  }
  // A migrating flock changes formation as the carpet tears through its air current.
  context.globalAlpha = strength * 0.8;
  context.strokeStyle = '#23475c';
  for (let bird = 0; bird < 8; bird++) {
    const x = ((elapsed / 22 + bird * 19) % (width + 100)) - 50;
    const y = height * 0.18 + Math.abs(bird - 3) * 8 + Math.sin(elapsed / 500) * 14;
    const wing = Math.sin(elapsed / 90 + bird) * 4;
    context.beginPath(); context.moveTo(x - 5, y - wing); context.lineTo(x, y); context.lineTo(x + 5, y - wing); context.stroke();
  }
  context.restore();
}
