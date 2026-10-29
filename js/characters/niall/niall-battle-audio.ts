import { createGameAudio } from '../../core/audio-mute.js';
import { resolveSiteAsset } from '../../core/site-assets.js';

export function createNiallBattleAudio() {
  const music = createGameAudio(resolveSiteAsset('char/niall/audio/battle-music.mp3'));
  music.loop = false;
  const impact = createGameAudio();
  let nextHit = 1;

  return {
    start(): void {
      // Retry on the opening button if the browser blocked initial autoplay.
      if (music.paused && !music.ended) void music.play().catch(() => {});
    },
    hit(): void {
      impact.pause();
      impact.src = resolveSiteAsset(`char/niall/audio/hit-${nextHit}.mp3`);
      impact.currentTime = 0;
      nextHit = nextHit % 9 + 1;
      void impact.play().catch(() => {});
    },
    finish(): void {
      music.pause();
    },
    stop(): void {
      music.pause();
      impact.pause();
    },
  };
}
