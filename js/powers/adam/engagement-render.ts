import type { EngagementGame } from './engagement-game.js';

export interface EngagementArtwork {
  readonly adam: HTMLImageElement;
  readonly maddy: HTMLImageElement;
  readonly ring: HTMLImageElement;
}

// Anchors in the supplied original images: Adam's held ring and Maddy's
// ring finger, second from the left. Keep collision and artwork aligned.
// Match the visible hands, rather than their differently padded image bounds.
const HAND_WIDTH = 152;
const ADAM_SCALE = HAND_WIDTH / 444;
const ADAM_WIDTH = 613 * ADAM_SCALE;
const ADAM_RING = { x: 295, y: 714 };
const MADDY_SCALE = HAND_WIDTH / 909;
const MADDY_WIDTH = 941 * MADDY_SCALE;
const MADDY_FINGER = { x: 343, y: 600 };
const TOP_Y = -75;
const BOTTOM_Y = 220;
const BOTTOM_REACH = 35;
const TOP_REACH = BOTTOM_Y - BOTTOM_REACH + MADDY_FINGER.y * MADDY_SCALE - ADAM_RING.y * ADAM_SCALE;

function drawAdam(context: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number): void {
  if (!image.complete || !image.naturalWidth) return;
  const left = Math.round(x - ADAM_RING.x * ADAM_SCALE);
  context.save();
  {
    // Draw the embedded ring separately so it can slide onto the finger
    // at the correct scale. Keep the supplied hand image untouched.
    context.beginPath();
    context.rect(left, y, ADAM_WIDTH, 775 * ADAM_SCALE);
    context.rect(left + 202 * ADAM_SCALE, y + 652 * ADAM_SCALE, 188 * ADAM_SCALE, 123 * ADAM_SCALE);
    context.clip('evenodd');
  }
  context.drawImage(image, left, y, ADAM_WIDTH, 775 * ADAM_SCALE);
  context.restore();
}

export function drawEngagementGame(context: CanvasRenderingContext2D, game: EngagementGame, artwork: EngagementArtwork, now: number): void {
  context.imageSmoothingEnabled = false;
  context.fillStyle = '#180f24';
  context.fillRect(0, 0, 360, 440);
  context.fillStyle = '#34213b';
  for (let y = 20; y < 440; y += 32) for (let x = 15; x < 360; x += 32) context.fillRect(x, y, 2, 2);
  const ringX = 50 + game.ringX * 220;
  const fingerX = 50 + game.fingerX * 220;
  const bottomY = BOTTOM_Y - game.connection * BOTTOM_REACH;
  const topY = TOP_Y + game.connection * (TOP_REACH - TOP_Y) - game.withdrawal * 190;
  const connected = game.phase === 'engaged';
  if (artwork.maddy.complete && artwork.maddy.naturalWidth) {
    context.drawImage(artwork.maddy, Math.round(fingerX - MADDY_FINGER.x * MADDY_SCALE), bottomY, MADDY_WIDTH, 1672 * MADDY_SCALE);
  }
  drawAdam(context, artwork.adam, ringX, topY);
  const ringY = (connected ? TOP_REACH : topY) + ADAM_RING.y * ADAM_SCALE;
  const wornRingWidth = 23;
  const heldRingWidth = 188 * ADAM_SCALE;
  const ringWidth = heldRingWidth + (wornRingWidth - heldRingWidth) * game.connection;
  const ringHeight = ringWidth * 555 / 960;
  const settledX = ringX + (fingerX - ringX) * game.withdrawal;
  if (artwork.ring.complete && artwork.ring.naturalWidth) {
    // Crop only the transparent padding while drawing; retain the original art.
    context.drawImage(artwork.ring, 150, 370, 960, 555,
      settledX - ringWidth / 2, ringY - ringHeight / 2, ringWidth, ringHeight);
  }
  if (connected) {
    context.fillStyle = '#ffdb83';
    for (let i = 0; i < 12; i++) {
      const angle = i * Math.PI / 6 + now / 4000;
      const radius = 22 + Math.sin(now / 160 + i) * 3;
      context.fillRect(Math.round(ringX + Math.cos(angle) * radius), Math.round(ringY + Math.sin(angle) * radius), 3, 3);
    }
  }
}
