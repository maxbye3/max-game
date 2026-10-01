const AUDIO_MUTED_KEY = 'max-game:audio-muted';
const gameAudio = new Set<HTMLMediaElement>();

let audioMuted = false;

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
  const audio = source === undefined ? new Audio() : new Audio(source);
  gameAudio.add(audio);
  audio.muted = audioMuted;
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
  button.addEventListener('click', () => {
    audioMuted = !audioMuted;
    gameAudio.forEach((audio) => { audio.muted = audioMuted; });
    saveMutedPreference();
    updateMuteButton(button);
    window.dispatchEvent(new Event('max-game:audio-mute-changed'));
  });
}
