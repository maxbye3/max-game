import { createGameAudio } from './audio-mute.js';

/** Retry on the next gesture when a fresh page blocks automatic voice playback. */
export function playAlexVoice(source: string, finished: () => void = () => {}): () => void {
  const audio = createGameAudio(source);
  let stopped = false;
  let timer = 0;
  const removeRetry = (): void => {
    window.removeEventListener('pointerdown', retry);
    window.removeEventListener('keydown', retry);
  };
  const stop = (): void => {
    stopped = true;
    window.clearTimeout(timer);
    removeRetry();
    audio.pause();
    audio.removeEventListener('ended', complete);
    audio.removeEventListener('error', complete);
  };
  const complete = (): void => {
    if (stopped) return;
    stop();
    finished();
  };
  const retry = (): void => {
    removeRetry();
    play();
  };
  const play = (): void => {
    if (stopped) return;
    // A missing or stalled recording must not leave the eating scene black forever.
    timer = window.setTimeout(complete, 30_000);
    void audio.play().then(() => {
      if (stopped) { audio.pause(); return; }
      window.clearTimeout(timer);
      timer = window.setTimeout(complete, (Number.isFinite(audio.duration) ? audio.duration + 2 : 30) * 1000);
    }).catch((error: unknown) => {
      if (stopped) return;
      window.clearTimeout(timer);
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        window.addEventListener('pointerdown', retry);
        window.addEventListener('keydown', retry);
      } else complete();
    });
  };
  audio.addEventListener('ended', complete);
  audio.addEventListener('error', complete);
  play();
  return stop;
}

export function playDoughnutReturnVoice(): void {
  const url = new URL(window.location.href);
  if (url.searchParams.get('door') !== 'feedback-center' || url.searchParams.get('doughnut') !== 'eaten') return;
  // Consume the arrival cue so refreshing the map does not repeat the line.
  url.searchParams.delete('doughnut');
  window.history.replaceState(null, '', url);
  playAlexVoice('character-assets/alex-w/sounds/dognuts-eaten.m4a');
}
