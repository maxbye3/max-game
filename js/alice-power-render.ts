import { aliceCharacterPose, alicePowerElapsed, aliceVisualStrength, getAliceBallTrails, getAliceProtagonist, getAliceSquad, isAlicePowerActive } from './alice-power.js';

let terrain: HTMLCanvasElement | null = null;

function football(context: CanvasRenderingContext2D, x: number, y: number, radius: number, rotation: number): void {
  context.save(); context.translate(Math.round(x), Math.round(y)); context.rotate(rotation);
  context.fillStyle = '#fffdf2'; context.beginPath(); context.arc(0, 0, radius, 0, Math.PI * 2); context.fill();
  context.strokeStyle = '#171717'; context.lineWidth = Math.max(1, radius * 0.12); context.stroke();
  context.fillStyle = '#171717'; context.beginPath();
  for (let point = 0; point < 5; point++) { const angle = -Math.PI / 2 + point * Math.PI * 0.4; const r = point % 2 ? radius * 0.28 : radius * 0.48; context.lineTo(Math.cos(angle) * r, Math.sin(angle) * r); }
  context.closePath(); context.fill(); context.restore();
}

export function withAliceKit(context: CanvasRenderingContext2D, x: number, y: number, height: number, id: string, draw: () => void, now: number): void {
  if (!isAlicePowerActive(now)) { draw(); return; }
  const pose = aliceCharacterPose(id, now);
  context.save(); context.translate(x + pose.x, y + pose.y); context.rotate(pose.lean); context.scale(pose.scale, pose.scale); context.translate(-x, -y); draw();
  if (id === 'player' || getAliceSquad().some((member) => member.id === id)) {
    const strength = aliceVisualStrength(now); const jerseyWidth = height * 0.42;
    context.globalAlpha *= strength * 0.92; context.fillStyle = '#db0011'; context.fillRect(x - jerseyWidth / 2, y - height * 0.66, jerseyWidth, height * 0.32);
    context.fillStyle = '#f7f4ec'; context.fillRect(x - jerseyWidth / 2, y - height * 0.66, jerseyWidth * 0.18, height * 0.22); context.fillRect(x + jerseyWidth * 0.32, y - height * 0.66, jerseyWidth * 0.18, height * 0.22);
    context.fillStyle = '#fff'; context.textAlign = 'center'; context.font = `bold ${Math.max(6, height * 0.14)}px monospace`; context.fillText(id === 'player' ? '14' : 'A', x, y - height * 0.43);
  }
  context.restore();
}

export function drawAliceTerrain(context: CanvasRenderingContext2D, now: number): void {
  if (!isAlicePowerActive(now)) return;
  terrain ??= document.createElement('canvas'); const { width, height } = context.canvas;
  if (terrain.width !== width || terrain.height !== height) { terrain.width = width; terrain.height = height; }
  const buffer = terrain.getContext('2d'); if (!buffer) return;
  buffer.clearRect(0, 0, width, height); buffer.drawImage(context.canvas, 0, 0);
  const strength = aliceVisualStrength(now); const elapsed = alicePowerElapsed(now);
  context.save(); context.setTransform(1, 0, 0, 1, 0, 0); context.imageSmoothingEnabled = false;
  context.globalAlpha = strength; context.filter = `hue-rotate(${Math.sin(elapsed / 180) * 8}deg) saturate(1.35) contrast(1.08)`; context.drawImage(terrain, 0, 0); context.filter = 'none';
  for (let band = 0; band < 10; band++) { context.globalAlpha = strength * (band % 2 ? 0.16 : 0.08); context.fillStyle = band % 2 ? '#16733c' : '#80c342'; context.fillRect(band * width / 10, 0, width / 10 + 1, height); }
  context.globalAlpha = strength * 0.82; context.strokeStyle = '#f5f2df'; context.lineWidth = Math.max(2, width / 260); context.strokeRect(10, 10, width - 20, height - 20);
  context.beginPath(); context.moveTo(width / 2, 10); context.lineTo(width / 2, height - 10); context.moveTo(width / 2 + Math.min(width, height) * 0.15, height / 2); context.arc(width / 2, height / 2, Math.min(width, height) * 0.15, 0, Math.PI * 2); context.stroke();
  context.restore();
}

export function drawAliceGround(context: CanvasRenderingContext2D, cameraX: number, cameraY: number, now: number, scaleX = 1, scaleY = 1): void {
  if (!isAlicePowerActive(now)) return;
  context.save(); context.scale(scaleX, scaleY);
  for (const trail of getAliceBallTrails()) {
    const age = now - trail.time; context.globalAlpha = aliceVisualStrength(now) * Math.min(0.75, (1800 - age) / 700);
    context.strokeStyle = trail.seed % 2 ? '#ffffff' : '#d71920'; context.lineWidth = 2; context.setLineDash([4, 4]);
    context.beginPath(); context.arc(trail.x - cameraX, trail.y - cameraY, 6 + age / 90, 0, Math.PI * 2); context.stroke();
  }
  context.restore();
}

function goal(context: CanvasRenderingContext2D, x: number, y: number, width: number, flip: number): void {
  context.save(); context.translate(x, y); context.scale(flip, 1); context.strokeStyle = '#fff'; context.lineWidth = 3; context.strokeRect(0, -width * 0.55, width, width * 0.55);
  context.globalAlpha *= 0.55; context.lineWidth = 1; for (let line = 1; line < 6; line++) { context.beginPath(); context.moveTo(line * width / 6, -width * 0.55); context.lineTo(line * width / 6, 0); context.stroke(); }
  context.restore();
}

export function drawAliceWorld(context: CanvasRenderingContext2D, cameraX: number, cameraY: number, now: number, scaleX = 1, scaleY = 1, playerHeight = 36): void {
  if (!isAlicePowerActive(now)) return;
  const strength = aliceVisualStrength(now); const elapsed = alicePowerElapsed(now); const width = context.canvas.width / scaleX; const height = context.canvas.height / scaleY;
  const protagonist = getAliceProtagonist(); const px = protagonist.x - cameraX; const py = protagonist.y - cameraY;
  context.save(); context.scale(scaleX, scaleY); context.imageSmoothingEnabled = false;
  // Red and white stands grow in from both horizons, trapping the map inside a match.
  context.globalAlpha = strength; for (const edge of [0, height - 48]) { context.fillStyle = '#210006'; context.fillRect(0, edge, width, 48); for (let seat = 0; seat < Math.ceil(width / 8); seat++) { context.fillStyle = (seat + Math.floor(elapsed / 140)) % 3 ? '#db0011' : '#fff'; context.fillRect(seat * 8, edge + 8 + (seat % 4) * 7, 5, 5); } }
  context.globalAlpha = strength * 0.25; context.fillStyle = '#fff7c4'; for (const x of [18, width - 18]) { context.beginPath(); context.moveTo(x, 0); context.lineTo(width / 2 + Math.sin(elapsed / 480) * width * 0.2, height); context.lineTo(width / 2 + Math.sin(elapsed / 480) * width * 0.2 + 75, height); context.fill(); }
  goal(context, 12, height * 0.68, Math.min(70, width * 0.14), 1); goal(context, width - 12, height * 0.68, Math.min(70, width * 0.14), -1);
  // The player repeatedly volleys impossible balls through characters and scenery.
  for (let ball = 0; ball < 5; ball++) { const phase = (elapsed / 1150 + ball / 5) % 1; const side = ball % 2 ? 1 : -1; const x = px + side * phase * width * 0.72; const y = py - playerHeight * 0.55 - Math.sin(phase * Math.PI) * (65 + ball * 7); context.globalAlpha = strength * Math.min(1, phase * 7, (1 - phase) * 7); football(context, x, y, 7 + ball % 2 * 2, phase * 12 * side); }
  for (const member of getAliceSquad()) { const x = member.x - cameraX; const y = member.y - cameraY - member.height - 16; if (x < -40 || y < -40 || x > width + 40 || y > height + 40) continue; context.globalAlpha = strength * Math.min(1, (now - member.signedAt) / 220); context.fillStyle = '#db0011'; context.fillRect(x - 12, y - 9, 24, 12); context.fillStyle = '#fff'; context.font = 'bold 8px monospace'; context.textAlign = 'center'; context.fillText('SIGNED', x, y); }
  context.globalAlpha = strength; context.fillStyle = '#160006'; context.fillRect(width / 2 - 84, 7, 168, 29); context.strokeStyle = '#f2c94c'; context.lineWidth = 2; context.strokeRect(width / 2 - 84, 7, 168, 29); context.fillStyle = '#fff'; context.textAlign = 'center'; context.font = 'bold 11px monospace'; context.fillText(`ARSENAL ${elapsed > 8200 ? '∞' : Math.floor(elapsed / 1500) + 1} · WORLD 0`, width / 2, 25);
  if (elapsed < 1100) { const impact = Math.min(1, elapsed / 180) * Math.min(1, (1100 - elapsed) / 300); context.globalAlpha = impact * strength; context.translate(width / 2, height / 2); context.rotate(Math.sin(elapsed / 35) * 0.035); context.scale(1 + Math.sin(elapsed / 50) * 0.06, 1 - Math.sin(elapsed / 50) * 0.06); context.fillStyle = '#db0011'; context.fillRect(-width * 0.48, -52, width * 0.96, 104); context.fillStyle = '#fff'; context.font = `bold ${Math.max(25, Math.min(56, width / 8))}px monospace`; context.fillText('ARSENAL IS THE WORLD', 0, 12); }
  context.restore();
}
