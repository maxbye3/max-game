export function withInessaTea(context: CanvasRenderingContext2D, x: number, y: number, height: number, id: string, draw: () => void, now: number): void {
  draw();
  context.save();
  context.translate(Math.round(x), Math.round(y));
  context.imageSmoothingEnabled = false;
  if (id === 'player') {
    context.fillStyle = '#eee1fa';
    context.fillRect(9, -height * 0.45, 12, 15);
    context.fillStyle = '#c18cba';
    context.fillRect(10, -height * 0.45 + 3, 10, 10);
    context.fillStyle = '#572a60';
    for (let i = 0; i < 5; i++) context.fillRect(11 + (i % 3) * 3, Math.round(-height * 0.45 + 9 + Math.floor(i / 3) * 3), 2, 2);
    context.fillStyle = '#67cab9';
    context.fillRect(16, -height * 0.45 - 8, 2, 12);
  }
  const bob = Math.round(Math.sin(now / 350 + x) * 2);
  context.fillStyle = '#fff0fc';
  context.fillRect(-15, -height - 17 + bob, 30, 12);
  context.fillRect(-3, -height - 5 + bob, 3, 3);
  context.fillStyle = '#713564';
  context.font = '8px monospace';
  context.textAlign = 'center';
  context.fillText('Привет!', 0, -height - 8 + bob);
  context.restore();
}
