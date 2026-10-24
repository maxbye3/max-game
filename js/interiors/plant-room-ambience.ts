import { hasDialogueAudioFocus } from '../core/dialogue-audio.js';
import { createGameAudio, hasPowerAudioFocus, isAudioMuted } from '../core/audio-mute.js';
import { ambienceSourceForDoor, carriedAmbienceFor, rememberAmbience } from '../core/ambient-theme.js';

export function setupInteriorAmbience(doorId: string | null): void {
  const source = doorId === 'northwest-portal' ? 'audio/cave/internal.mp3'
    : doorId === 'music-shop' ? 'audio/music-house/theme.mp3' : ambienceSourceForDoor(doorId);
  if (!source || !doorId) return;

  const carried = carriedAmbienceFor(doorId);
  const ambience = createGameAudio(`../${source}`);
  const tracks = doorId === 'job-center'
    ? [ambience, createGameAudio('../audio/charity/theme.mp3')]
    : [ambience];
  for (const track of tracks) {
    track.loop = true;
    track.preload = 'none';
  }
  if (carried?.source === source) ambience.currentTime = carried.currentTime;

  const setVolume = (): void => {
    for (const track of tracks) track.volume = hasDialogueAudioFocus() ? 0.5 : 1;
  };

  const pause = (): void => { tracks.forEach((track) => track.pause()); };
  const start = (): void => {
    if (isAudioMuted() || hasPowerAudioFocus() || document.hidden || (doorId === 'music-shop' && hasDialogueAudioFocus('Andy')) || (doorId === 'cinema' && hasDialogueAudioFocus('Dad'))) { pause(); return; }
    setVolume();
    for (const track of tracks) {
      if (!track.paused) continue;
      void track.play().catch(() => {
        // A browser may require the first movement or tap before it can begin.
      });
    }
  };

  window.addEventListener('keydown', start);
  window.addEventListener('pointerdown', start, { once: true });
  window.addEventListener('max-game:dialogue-audio-focus', () => {
    setVolume();
    start();
  });
  window.addEventListener('max-game:power-audio-focus', start);
  window.addEventListener('max-game:audio-mute-changed', start);
  window.addEventListener('max-game:temporary-audio-focus', (event) => {
    if ((event as CustomEvent<boolean>).detail) pause();
    else start();
  });
  document.addEventListener('visibilitychange', start);
  window.addEventListener('pagehide', () => {
    rememberAmbience(doorId, source, ambience.currentTime);
    pause();
  }, { once: true });
  start();
}
