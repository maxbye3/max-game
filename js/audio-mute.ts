const AUDIO_MUTED_KEY = 'max-game:audio-muted';
const gameAudio = new Set<HTMLMediaElement>();
const suspendedAudio = new Set<HTMLMediaElement>();

let audioMuted = false;
let powerAudio: HTMLMediaElement | null = null;
let powerAudioEndsAt = 0;
let powerAudioTimer = 0;

export function hasPowerAudioFocus(): boolean {
  return performance.now() < powerAudioEndsAt;
}

/** One power soundtrack owns music playback for the duration of its effect. */
export function focusPowerAudio(audio: HTMLMediaElement | null, duration: number): void {
  window.clearTimeout(powerAudioTimer);
  powerAudio = audio;
  powerAudioEndsAt = performance.now() + duration;
  gameAudio.forEach((other) => { if (other !== audio && other.loop) other.pause(); });
  window.dispatchEvent(new Event('max-game:power-audio-focus'));
  powerAudioTimer = window.setTimeout(() => {
    powerAudioEndsAt = 0;
    powerAudio = null;
    window.dispatchEvent(new Event('max-game:power-audio-focus'));
  }, duration);
}

export function releaseGameAudio(audio: HTMLMediaElement): void {
  audio.pause();
  gameAudio.delete(audio);
  suspendedAudio.delete(audio);
  audio.removeAttribute('src');
  audio.load();
}

function readMutedPreference(): boolean {
  try {
    return window.localStorage.getItem(AUDIO_MUTED_KEY) === 'true';
  } catch {
    return false;
  }
}

function saveMutedPreference(): void {
  try {
    window.localStorage.setItem(AUDIO_MUTED_KEY, String(audioMuted));
  } catch {
    // Storage may be unavailable in a restricted browser context.
  }
}

function updateMuteButton(button: HTMLButtonElement): void {
  const label = button.querySelector<HTMLElement>('.audio-mute-label');
  if (label) label.textContent = audioMuted ? 'Unmute' : 'Mute';
  button.setAttribute('aria-pressed', String(audioMuted));
  button.setAttribute('aria-label', audioMuted ? 'Unmute all audio' : 'Mute all audio');
}

export function createGameAudio(source?: string): HTMLAudioElement {
  const audio = new Audio();
  audio.preload = 'none';
  if (source !== undefined) audio.src = source;
  gameAudio.add(audio);
  audio.muted = audioMuted;
  audio.addEventListener('play', () => {
    if (audio.loop && hasPowerAudioFocus() && audio !== powerAudio) audio.pause();
  });
  return audio;
}

export function isAudioMuted(): boolean {
  return audioMuted;
}

export function setupAudioMute(): void {
  const button = document.querySelector<HTMLButtonElement>('#audio-mute-toggle');
  if (!button) throw new Error('Missing required element: #audio-mute-toggle');
  audioMuted = readMutedPreference();
  gameAudio.forEach((audio) => { audio.muted = audioMuted; });
  updateMuteButton(button);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      gameAudio.forEach((audio) => {
        if (!audio.loop || audio.paused) return;
        suspendedAudio.add(audio);
        audio.pause();
      });
      return;
    }
    suspendedAudio.forEach((audio) => {
      if (!gameAudio.has(audio) || (audio === powerAudio && !hasPowerAudioFocus())) return;
      if (hasPowerAudioFocus() && audio !== powerAudio) return;
      void audio.play().catch(() => {});
    });
    suspendedAudio.clear();
  });
  button.addEventListener('click', () => {
    audioMuted = !audioMuted;
    gameAudio.forEach((audio) => { audio.muted = audioMuted; });
    saveMutedPreference();
    updateMuteButton(button);
    window.dispatchEvent(new Event('max-game:audio-mute-changed'));
  });
}
