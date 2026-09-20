export const SNOWMAN = {
  // Matches the snowman baked into snow-mansion.png.
  x: 925,
  y: 1110,
  fallenWidth: 82,
  fallenHeight: 67,
} as const;

const COLLISION_RADIUS = 25;

let fallen = false;
const fallSound = new Audio('map/audio/snowman.m4a');
fallSound.preload = 'auto';

export const isSnowmanFallen = () => fallen;

function playFallSound(): void {
  fallSound.currentTime = 0;
  void fallSound.play().catch(() => {
    // Browsers may reject audio before the first player input.
  });
}

export function playerCollidesWithSnowman(x: number, y: number): boolean {
  if (fallen) return false;
  if (Math.hypot(x - SNOWMAN.x, y - SNOWMAN.y) >= COLLISION_RADIUS) return false;

  fallen = true;
  playFallSound();
  return true;
}
