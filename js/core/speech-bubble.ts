import { canvas } from './dom.js';

export function drawSpeechBubble(
  context: CanvasRenderingContext2D,
  text: string,
  anchorX: number,
  anchorY: number,
): void {
  context.save();
  context.font = '12px "Press Start 2P", monospace';
  context.textBaseline = 'top';
  const paddingX = 10;
  const paddingY = 8;
  const maxWidth = 270;
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const nextLine = line ? `${line} ${word}` : word;
    if (context.measureText(nextLine).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = nextLine;
    }
  }
  if (line) lines.push(line);

  const textWidth = Math.min(maxWidth, Math.max(...lines.map((value) => context.measureText(value).width)));
  const width = textWidth + paddingX * 2;
  const height = lines.length * 18 + paddingY * 2;
  const x = Math.round(Math.max(8, Math.min(canvas.width - width - 8, anchorX - width / 2)));
  const y = Math.round(Math.max(8, anchorY - height - 18));

  context.fillStyle = '#111';
  context.fillRect(x - 3, y - 3, width + 6, height + 6);
  context.fillStyle = '#f7f3e8';
  context.fillRect(x, y, width, height);
  context.fillStyle = '#111';
  lines.forEach((value, index) => {
    context.fillText(value, x + paddingX, y + paddingY + index * 18);
  });
  context.restore();
}
