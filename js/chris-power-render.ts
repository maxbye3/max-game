import { chrisAudienceLean, chrisPowerElapsed, chrisPowerSecondsLeft, CHRIS_WAVE_SPEED, getChrisListeners, getChrisSinger, getChrisWaves, isChrisPowerActive } from './chris-power.js';

const COLOURS = ['#ffd675', '#65f4ed', '#fa84d4'] as const;
const colour = (index: number): string => COLOURS[index % COLOURS.length] ?? COLOURS[0];

/** Give the real sprite a singing stance, or turn an audience member towards it. */
export function withChrisPerformance(context: CanvasRenderingContext2D, x: number, y: number, height: number, id: string, drawSprite: () => void, now = performance.now()): void {
  if (!isChrisPowerActive(now)) { drawSprite(); return; }
  const elapsed = chrisPowerElapsed(now);
  const lean = id === 'player' ? Math.sin(elapsed / 180) * 0.08 : chrisAudienceLean(id, now);
  if (id !== 'player' && lean === 0) { drawSprite(); return; }
  context.save();
  context.translate(x, y - (id === 'player' ? Math.abs(Math.sin(elapsed / 180)) * height * 0.035 : 0));
  context.rotate(lean);
  context.translate(-x, -y);
  drawSprite();
  context.restore();
}

function drawNote(context: CanvasRenderingContext2D, x: number, y: number, size = 1): void {
  context.fillRect(Math.round(x), Math.round(y), 6 * size, 4 * size);
  context.fillRect(Math.round(x + 5 * size), Math.round(y - 11 * size), 2 * size, 14 * size);
  context.fillRect(Math.round(x + 5 * size), Math.round(y - 11 * size), 7 * size, 3 * size);
}

export function drawChrisWorld(context: CanvasRenderingContext2D, cameraX: number, cameraY: number, now: number, scaleX = 1, scaleY = 1): void {
  if (!isChrisPowerActive(now)) return;
  const elapsed = chrisPowerElapsed(now);
  const strength = Math.min(1, elapsed / 220, chrisPowerSecondsLeft(now) * 3);
  const width = context.canvas.width;
  const height = context.canvas.height;
  const singer = getChrisSinger();
  const sx = (singer.x - cameraX) * scaleX;
  const sy = (singer.y - cameraY) * scaleY;
  context.save();
  context.globalAlpha = strength;
  context.fillStyle = 'rgba(18, 9, 51, 0.32)';
  context.fillRect(0, 0, width, height);
  // Follow the singer with a stage light while keeping the map underneath readable.
  for (let beam = 0; beam < 3; beam++) {
    context.globalAlpha = strength * 0.075;
    context.fillStyle = colour(beam);
    context.beginPath();
    context.moveTo(width * (beam / 2), -15);
    context.lineTo(sx - 65 * scaleX, sy);
    context.lineTo(sx + 65 * scaleX, sy);
    context.closePath();
    context.fill();
  }
  context.scale(scaleX, scaleY);
  context.lineWidth = 2;
  // Waves originate where each phrase was sung, so movement leaves a real trail.
  getChrisWaves().forEach((wave, index) => {
    const radius = (now - wave.time) / 1000 * CHRIS_WAVE_SPEED;
    context.globalAlpha = strength * Math.max(0, 0.55 - radius / 3000);
    context.strokeStyle = colour(index);
    context.beginPath();
    context.ellipse(wave.x - cameraX, wave.y - cameraY, Math.max(1, radius), Math.max(1, radius * 0.65), 0, 0, Math.PI * 2);
    context.stroke();
    // Pixel notes riding on the advancing sound front.
    context.fillStyle = colour(index);
    for (let note = 0; note < 12; note++) {
      const angle = note * Math.PI / 6 + elapsed / 3000;
      const nx = wave.x - cameraX + Math.cos(angle) * radius;
      const ny = wave.y - cameraY + Math.sin(angle) * radius * 0.65;
      if (nx < -20 || ny < -20 || nx > width / scaleX + 20 || ny > height / scaleY + 20) continue;
      drawNote(context, nx, ny);
    }
  });
  getChrisListeners().forEach((listener, index) => {
    const x = listener.x - cameraX;
    const y = listener.y - cameraY;
    if (x < -60 || y < -60 || x > width / scaleX + 60 || y > height / scaleY + 80) return;
    const arrival = Math.max(0, 1 - (now - listener.heardAt) / 450);
    context.globalAlpha = strength * (0.35 + arrival * 0.45);
    context.fillStyle = colour(index);
    context.beginPath();
    context.ellipse(x, y + 2, 23 + arrival * 18, 8 + arrival * 5, 0, 0, Math.PI * 2);
    context.fill();
    // Everyone has become an unwilling backing singer.
    const bob = Math.sin(elapsed / 180 + index) * 3;
    context.globalAlpha = strength * 0.9;
    context.fillStyle = '#180e35';
    context.fillRect(x - 15, y - listener.height - 25 + bob, 30, 21);
    context.fillRect(x - 3, y - listener.height - 4 + bob, 6, 5);
    context.fillStyle = colour(index);
    drawNote(context, x - 8, y - listener.height - 11 + bob);
    context.fillRect(x + 8, y - listener.height - 20 + bob, 2, 10);
    context.fillRect(x + 8, y - listener.height - 8 + bob, 2, 2);
  });
  // Wind streams sweep across the entire viewport on the singer's real-time clock.
  for (let stream = 0; stream < 22; stream++) {
    const x = ((stream * 113 + elapsed * (0.15 + stream % 3 * 0.04)) % (width + 150)) - 75;
    const y = (stream * 67 + Math.sin(elapsed / 650 + stream) * 18 + height) % height;
    context.globalAlpha = strength * 0.4;
    context.strokeStyle = colour(stream);
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(x / scaleX, y / scaleY);
    context.lineTo((x + 30) / scaleX, (y - 4) / scaleY);
    context.lineTo((x + 55) / scaleX, y / scaleY);
    context.stroke();
    context.fillStyle = colour(stream);
    drawNote(context, (x + 55) / scaleX, (y - 6) / scaleY, 0.8);
  }
  context.restore();
}

export function drawChrisPlayer(context: CanvasRenderingContext2D, x: number, y: number, height: number, now: number, facingLeft: boolean): void {
  if (!isChrisPowerActive(now)) return;
  const elapsed = chrisPowerElapsed(now);
  const side = facingLeft ? -1 : 1;
  context.save();
  context.translate(Math.round(x), Math.round(y));
  const pulse = 1 + Math.sin(elapsed / 180) * 0.1;
  context.globalAlpha = 0.28;
  context.fillStyle = '#ffe798';
  context.beginPath();
  context.ellipse(0, 3, 46 * pulse, 16 * pulse, 0, 0, Math.PI * 2);
  context.fill();
  context.globalAlpha = 1;
  // Handmade mic with a silver grille, wooden handle, and a trailing cable.
  const micX = side * 15;
  const micY = -height * 0.66 + Math.sin(elapsed / 180) * 2;
  context.strokeStyle = '#20122f';
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(micX, micY + 12);
  context.lineTo(micX + side * 9, -5);
  context.lineTo(-side * 24, 5);
  context.lineTo(-side * 32, 5 + Math.sin(elapsed / 200) * 3);
  context.stroke();
  context.fillStyle = '#9e6340';
  context.fillRect(micX - 2, micY + 2, 5, 13);
  context.fillStyle = '#fff1a6';
  context.fillRect(micX - 3, micY - 5, 7, 8);
  context.fillStyle = '#777689';
  for (let row = 0; row < 3; row++) context.fillRect(micX - 2, micY - 4 + row * 2, 5, 1);
  context.fillStyle = '#f6bd95';
  context.fillRect(micX - 3, micY + 6, 7, 4);
  // An outward fan of amplified voice and notes, even while standing still.
  context.strokeStyle = '#fff2af';
  for (let wave = 0; wave < 3; wave++) {
    const progress = (elapsed / 700 + wave / 3) % 1;
    context.globalAlpha = 1 - progress;
    context.beginPath();
    const radius = 8 + progress * 38;
    context.arc(micX + side * 4, micY - 2, radius, side > 0 ? -0.65 : Math.PI - 0.65, side > 0 ? 0.65 : Math.PI + 0.65);
    context.stroke();
    context.fillStyle = colour(wave);
    drawNote(context, micX + side * (14 + progress * 42), micY - 13 - progress * 22);
  }
  context.restore();
}
