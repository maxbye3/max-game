import { TV_X, TV_Y } from './config.js';

const SCREEN_OFFSET_X = 8;
const SCREEN_OFFSET_Y = 14;
const SCREEN_WIDTH = 38;
const SCREEN_HEIGHT = 21;
const LOOP_DURATION = 8000;
const SOCCER_START = 1600;
const SOCCER_END = 6400;
const STATIC_PALETTE = ['#101827', '#35445a', '#7f91a5', '#d8e0e4'] as const;

function drawStatic(context: CanvasRenderingContext2D, x: number, y: number, time: number): void {
  const staticFrame = Math.floor(time / 70);
  context.fillStyle = '#09101c';
  context.fillRect(x, y, SCREEN_WIDTH, SCREEN_HEIGHT);

  let noise = (staticFrame ^ 0x9e3779b9) >>> 0;
  for (let screenY = 0; screenY < SCREEN_HEIGHT; screenY += 1) {
    for (let screenX = 0; screenX < SCREEN_WIDTH; screenX += 1) {
      noise = (Math.imul(noise, 1664525) + 1013904223) >>> 0;
      context.fillStyle = STATIC_PALETTE[noise >>> 30] ?? STATIC_PALETTE[0];
      context.fillRect(x + screenX, y + screenY, 1, 1);
    }
  }
}

function drawPlayer(context: CanvasRenderingContext2D, x: number, y: number, shirt: string): void {
  context.fillStyle = '#e7b875';
  context.fillRect(x + 1, y, 1, 1);
  context.fillStyle = shirt;
  context.fillRect(x, y + 1, 3, 1);
  context.fillStyle = '#111827';
  context.fillRect(x, y + 2, 1, 1);
  context.fillRect(x + 2, y + 2, 1, 1);
}

function drawSoccer(context: CanvasRenderingContext2D, x: number, y: number, time: number): void {
  const frame = Math.floor((time - SOCCER_START) / 220);
  const progress = Math.min(1, frame / 21);

  context.fillStyle = '#17452b';
  context.fillRect(x, y, SCREEN_WIDTH, SCREEN_HEIGHT);
  context.fillStyle = '#1d5633';
  for (let stripeX = 0; stripeX < SCREEN_WIDTH; stripeX += 16) {
    context.fillRect(x + stripeX, y, 8, SCREEN_HEIGHT);
  }

  context.fillStyle = '#8fc477';
  context.fillRect(x, y + 1, SCREEN_WIDTH, 1);
  context.fillRect(x, y + SCREEN_HEIGHT - 2, SCREEN_WIDTH, 1);
  context.fillRect(x + 1, y, 1, SCREEN_HEIGHT);
  context.fillRect(x + SCREEN_WIDTH - 2, y, 1, SCREEN_HEIGHT);
  const midfieldX = Math.floor(SCREEN_WIDTH / 2);
  context.fillRect(x + midfieldX, y + 1, 1, SCREEN_HEIGHT - 3);
  context.fillRect(x + midfieldX - 1, y + 8, 3, 1);
  context.fillRect(x + midfieldX - 1, y + 12, 3, 1);
  context.fillRect(x, y + 7, 3, 1);
  context.fillRect(x, y + 13, 3, 1);
  context.fillRect(x + SCREEN_WIDTH - 3, y + 7, 3, 1);
  context.fillRect(x + SCREEN_WIDTH - 3, y + 13, 3, 1);

  const attackingX = Math.round(6 + progress * 22);
  const defendingX = Math.round(29 - progress * 6);
  drawPlayer(context, x + attackingX, y + 13 + (frame % 2), '#e23f3f');
  drawPlayer(context, x + Math.max(4, attackingX - 7), y + 5 + ((frame + 1) % 2), '#e23f3f');
  drawPlayer(context, x + defendingX, y + 10 - (frame % 2), '#3b72d9');
  drawPlayer(context, x + 24, y + 4 + ((frame + 1) % 2), '#3b72d9');
  drawPlayer(context, x + 2, y + 9, '#f1c84b');
  drawPlayer(context, x + 33, y + 9, '#f1c84b');

  const ballX = Math.round(9 + progress * 25);
  const ballY = Math.round(15 - Math.sin(progress * Math.PI) * 6);
  context.fillStyle = '#f4f0d8';
  context.fillRect(x + ballX, y + ballY, 1, 1);
}

export function drawTvScreen(
  context: CanvasRenderingContext2D,
  time: number,
  cameraX: number,
  cameraY: number,
): void {
  const screenX = Math.round(TV_X - cameraX + SCREEN_OFFSET_X);
  const screenY = Math.round(TV_Y - cameraY + SCREEN_OFFSET_Y);
  const cycleTime = time % LOOP_DURATION;

  context.save();
  context.beginPath();
  context.rect(screenX, screenY, SCREEN_WIDTH, SCREEN_HEIGHT);
  context.clip();
  context.globalAlpha = 0.82;
  if (cycleTime >= SOCCER_START && cycleTime < SOCCER_END) {
    drawSoccer(context, screenX, screenY, cycleTime);
  } else {
    drawStatic(context, screenX, screenY, time);
  }
  context.globalAlpha = 0.16;
  context.fillStyle = '#d7f4ff';
  context.fillRect(screenX + 3, screenY + 2, 8, 1);
  context.restore();
}
