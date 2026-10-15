import { getLucyAim, getLucyGuest, getLucyGuests, getLucyJets, getLucyProtagonist, isLucyCapEquipped, isLucyPowerActive, lucyCharacterPose, lucyPowerElapsed, lucyVisualStrength } from './lucy-power.js';

interface MayoOutlet { readonly x: number; readonly y: number; readonly width: number; readonly height: number }
function puddle(context: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  context.fillStyle = '#dbc897'; context.fillRect(Math.round(x - size), Math.round(y - 4), size * 2, 12);
  context.fillStyle = '#fff9df'; context.fillRect(Math.round(x - size + 3), Math.round(y - 7), size * 2 - 6, 12);
  context.fillRect(Math.round(x - size - 5), Math.round(y), size * 2 + 10, 5);
  context.fillStyle = '#fffef4'; context.fillRect(Math.round(x - size + 8), Math.round(y - 5), size, 3);
}
export function withLucyMayo(context: CanvasRenderingContext2D, x: number, y: number, height: number, id: string, drawSprite: () => void, now: number): void {
  const active = isLucyPowerActive(now);
  if (!active && (id !== 'player' || !isLucyCapEquipped())) { drawSprite(); return; }
  const pose = lucyCharacterPose(id, now);
  context.save(); context.translate(x + pose.x, y + pose.y); context.rotate(pose.lean); context.translate(-x, -y);
  if (active && id === 'player') {
    context.save(); context.globalAlpha *= lucyVisualStrength(now) * 0.4; context.fillStyle = '#fff4b3';
    context.beginPath(); context.ellipse(x, y - height * 0.5, height * 0.5, height * 0.85, 0, 0, Math.PI * 2); context.fill();
    context.restore();
  }
  drawSprite();
  if (active && id === 'player') {
    const top = y - height; const unit = height / 36;
    context.save(); context.translate(Math.round(x), Math.round(top + 9 * unit)); context.scale(unit, unit);
    // Blocky white anime spikes cover the original hair while leaving the face visible.
    context.fillStyle = '#c8d5e0'; context.fillRect(-10, -6, 20, 8);
    context.fillStyle = '#fffef2';
    context.beginPath(); context.moveTo(-10, 0);
    for (const [sx, sy] of [[-14, -10], [-8, -7], [-10, -18], [-3, -11], [0, -24], [4, -12], [10, -19], [9, -7], [15, -11], [10, 1]]) context.lineTo(sx!, sy!);
    context.closePath(); context.fill();
    context.fillStyle = '#e2e7ed'; context.fillRect(-7, -4, 4, 5); context.fillRect(5, -6, 3, 6);
    context.restore();
  } else if (active && getLucyGuest(id)) {
    context.globalAlpha *= lucyVisualStrength(now); context.fillStyle = '#fff9df';
    for (let i = 0; i < 8; i++) context.fillRect(Math.round(x - height * 0.15 + i * 7 % (height * 0.3)), Math.round(y - height * 0.8 + i * height * 0.075), 4, 5 + i % 3);
  } else if (id === 'player' && isLucyCapEquipped()) {
    context.fillStyle = '#efc748'; context.fillRect(x - height * 0.22, y - height, height * 0.45, height * 0.15);
    context.fillStyle = '#193961'; context.fillRect(x - height * 0.15, y - height - 2, height * 0.3, height * 0.12);
  }
  context.restore();
}
export function drawLucyGround(context: CanvasRenderingContext2D, cameraX: number, cameraY: number, now: number, scaleX = 1, scaleY = 1, outlets: readonly MayoOutlet[] = []): void {
  if (!isLucyPowerActive(now)) return;
  const strength = lucyVisualStrength(now); const elapsed = lucyPowerElapsed(now);
  context.save(); context.scale(scaleX, scaleY); context.globalAlpha = strength;
  for (const [i, outlet] of outlets.entries()) {
    const x = outlet.x + outlet.width / 2 - cameraX; const y = outlet.y + outlet.height - cameraY;
    if (x < -100 || y < -100 || x > context.canvas.width / scaleX + 100 || y > context.canvas.height / scaleY + 100) continue;
    context.fillStyle = '#fff9df'; context.fillRect(Math.round(x - outlet.width * 0.35), Math.round(y - outlet.height), Math.round(outlet.width * 0.7), outlet.height + 8);
    for (let drop = 0; drop < 8; drop++) {
      const life = (elapsed / 600 + drop / 8 + i * 0.13) % 1;
      context.fillRect(Math.round(x + Math.sin(drop * 2.4) * life * 35), Math.round(y - outlet.height * 0.6 + life * (outlet.height * 0.6 + 24)), 4, 7);
    }
    puddle(context, x, y + 12, 22 + Math.min(25, elapsed / 80));
  }
  for (const guest of getLucyGuests()) {
    context.globalAlpha = strength * (1 - (now - guest.reachedAt) / 2000);
    puddle(context, guest.x - cameraX, guest.y - cameraY + 3, 16);
  }
  context.restore();
}
export function drawLucyWorld(context: CanvasRenderingContext2D, cameraX: number, cameraY: number, now: number, scaleX = 1, scaleY = 1): void {
  if (!isLucyPowerActive(now)) return;
  const strength = lucyVisualStrength(now); const elapsed = lucyPowerElapsed(now);
  const player = getLucyProtagonist(); const aim = getLucyAim();
  context.save(); context.scale(scaleX, scaleY); context.lineCap = 'round';
  for (const jet of getLucyJets()) {
    context.globalAlpha = strength * (1 - (now - jet.at) / 180);
    context.beginPath(); context.moveTo(jet.x - cameraX, jet.y - cameraY); context.lineTo(jet.endX - cameraX, jet.endY - cameraY);
    context.strokeStyle = '#d5c394'; context.lineWidth = 12; context.stroke();
    context.strokeStyle = '#fff9df'; context.lineWidth = 8; context.stroke();
    for (let drop = 0; drop < 10; drop++) {
      const life = (elapsed / 240 + drop / 10) % 1;
      context.fillStyle = '#fffef4'; context.fillRect(Math.round(jet.x + (jet.endX - jet.x) * life - cameraX - 2), Math.round(jet.y + (jet.endY - jet.y) * life - cameraY + Math.sin(drop * 2 + elapsed / 70) * 5), 4, 4);
    }
    puddle(context, jet.endX - cameraX, jet.endY - cameraY, 9);
  }
  context.globalAlpha = strength;
  for (let spark = 0; spark < 16; spark++) {
    const life = (elapsed / 700 + spark / 16) % 1;
    context.fillStyle = spark % 2 ? '#fffef4' : '#ffe898';
    context.fillRect(Math.round(player.x - cameraX + Math.sin(spark * 2.4) * (18 + life * 15)), Math.round(player.y - cameraY - life * 85), 2, 5);
  }
  if (aim.firing) {
    context.strokeStyle = '#fffef4'; context.lineWidth = 2;
    context.strokeRect(Math.round(aim.x - cameraX - 9), Math.round(aim.y - cameraY - 9), 18, 18);
  }
  context.restore();
}
