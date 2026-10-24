import { createGameAudio, isAudioMuted } from '../core/audio-mute.js';

export const SNOWMAN = {
  // Matches the snowman baked into snow-mansion.png.
  x: 925,
  y: 1110,
  fallenWidth: 82,
  fallenHeight: 67,
} as const;

const COLLISION_RADIUS = 25;
const SOUND_PRELOAD_DISTANCE = 120;

let fallen = false;
const fallSound = createGameAudio('audio/map/snowman.m4a');
fallSound.volume = 0.8;

export const isSnowmanFallen = () => fallen;

function playFallSound(): void {
  if (isAudioMuted()) return;
  fallSound.currentTime = 0;
  void fallSound.play().catch(() => {
    // Browsers may reject audio before the first player input.
  });
}

export function playerCollidesWithSnowman(x: number, y: number): boolean {
  if (fallen) return false;
  const distance = Math.hypot(x - SNOWMAN.x, y - SNOWMAN.y);
  if (distance < SOUND_PRELOAD_DISTANCE && !isAudioMuted() && fallSound.preload === 'none') {
    fallSound.preload = 'auto';
    fallSound.load();
  }
  if (distance >= COLLISION_RADIUS) return false;

  fallen = true;
  playFallSound();
  return true;
}
