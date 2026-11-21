import { hasOshBlessing } from './osh-power.js';

export function withOshPope(context: CanvasRenderingContext2D, x: number, y: number, height: number, id: string, draw: () => void, now: number): void {
  draw();
  if (id !== 'player') return;
  context.save();
  context.translate(Math.round(x), Math.round(y));
  context.imageSmoothingEnabled = false;
  // White cassock, gold stole, mitre and crozier, sized to the current body.
  context.fillStyle = '#a58c63';
  context.fillRect(-9, -height * 0.52, 18, height * 0.48);
  context.fillStyle = '#fff5d8';
  context.fillRect(-8, -height * 0.52, 16, height * 0.45);
  context.fillRect(-10, -8, 20, 6);
  context.fillStyle = '#dfb847';
  context.fillRect(-5, -height * 0.52, 3, height * 0.4);
  context.fillRect(3, -height * 0.52, 3, height * 0.4);
  context.fillRect(-9, -4, 18, 2);
  context.fillStyle = '#fff5d8';
  context.fillRect(-8, -height - 5, 16, 10);
  context.fillRect(-6, -height - 9, 12, 5);
  context.fillRect(-3, -height - 12, 6, 4);
  context.fillStyle = '#dfb847';
  context.fillRect(-1, -height - 9, 2, 11);
  context.fillRect(-4, -height - 6, 8, 2);
  context.fillRect(14, -height, 2, height - 2);
  context.fillRect(14, -height - 3, 7, 2);
  context.fillRect(20, -height - 1, 2, 5);
  context.fillRect(17, -height + 3, 4, 2);
  if (hasOshBlessing(now)) {
    context.fillStyle = '#fff4a0';
    for (let i = 0; i < 8; i++) {
      const angle = now / 900 + i * Math.PI / 4;
      const sx = Math.round(Math.cos(angle) * 25);
      const sy = Math.round(-height / 2 + Math.sin(angle) * 25);
      context.fillRect(sx - 2, sy, 5, 1);
      context.fillRect(sx, sy - 2, 1, 5);
    }
  }
  context.restore();
}
