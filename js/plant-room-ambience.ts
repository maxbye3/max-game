import { hasDialogueAudioFocus } from './dialogue-audio.js';
import { createGameAudio, hasPowerAudioFocus } from './audio-mute.js';
import { ambienceSourceForDoor, carriedAmbienceFor, rememberAmbience } from './ambient-theme.js';

export function setupInteriorAmbience(doorId: string | null): void {
  const source = ambienceSourceForDoor(doorId);
  if (!source || !doorId) return;

  const carried = carriedAmbienceFor(doorId);
  const ambience = createGameAudio(`../${source}`);
  ambience.loop = true;
  ambience.preload = 'none';
  if (carried?.source === source) ambience.currentTime = carried.currentTime;

  const setVolume = (): void => {
    ambience.volume = hasDialogueAudioFocus() ? 0.5 : 1;
  };

  const start = (): void => {
    if (hasPowerAudioFocus() || document.hidden) { ambience.pause(); return; }
    setVolume();
    if (!ambience.paused) return;
    void ambience.play().catch(() => {
      // A browser may require the first movement or tap before it can begin.
    });
  };

  window.addEventListener('keydown', start);
  window.addEventListener('pointerdown', start, { once: true });
  window.addEventListener('max-game:dialogue-audio-focus', () => {
    setVolume();
    start();
  });
  window.addEventListener('max-game:power-audio-focus', start);
  document.addEventListener('visibilitychange', start);
  window.addEventListener('pagehide', () => {
    rememberAmbience(doorId, source, ambience.currentTime);
    ambience.pause();
  }, { once: true });
  start();
}
