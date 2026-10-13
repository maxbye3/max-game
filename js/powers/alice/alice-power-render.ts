import {
  aliceCharacterPose,
  alicePowerElapsed,
  aliceVisualStrength,
  isAliceCharacterBlinded,
  isAlicePowerActive,
} from './alice-power.js';

export function withAliceKit(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  height: number,
  id: string,
  draw: () => void,
  now: number,
): void {
  if (!isAlicePowerActive(now) || !isAliceCharacterBlinded(id)) {
    draw();
    return;
  }

  const pose = aliceCharacterPose(id, now);
  context.save();
  context.translate(x + pose.x, y + pose.y);
  context.rotate(pose.lean);
  context.translate(-x, -y);
  draw();
  context.fillStyle = '#fff8b8';
  context.font = `${Math.max(8, height * 0.24)}px monospace`;
  context.textAlign = 'center';
  context.fillText('✦', x, y - height - 5 + Math.sin(now / 90 + id.length) * 2);
  context.restore();
}

export function drawAliceWorld(
  context: CanvasRenderingContext2D,
  _cameraX: number,
  _cameraY: number,
  now: number,
  scaleX = 1,
  scaleY = 1,
  _playerHeight = 36,
): void {
  if (!isAlicePowerActive(now)) return;
  const elapsed = alicePowerElapsed(now);
  const fade = Math.max(0, 1 - elapsed / 450);
  const opacity = Math.min(0.97, 0.56 + aliceVisualStrength(now) * 0.16 + fade * 0.25);
  context.save();
  context.scale(scaleX, scaleY);
  context.globalAlpha = opacity;
  context.fillStyle = '#fff';
  context.fillRect(0, 0, context.canvas.width / scaleX, context.canvas.height / scaleY);
  context.restore();
}
