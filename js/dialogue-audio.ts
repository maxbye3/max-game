import { DIALOGUE_THEME_SOURCES } from './dialogue-themes.generated.js';
import { POWER_THEME_SOURCES } from './power-themes.generated.js';
import { createGameAudio, hasPowerAudioFocus } from './audio-mute.js';
import { addAndyDialogueReply } from './andy-power.js';

const theme = createGameAudio();
theme.loop = true;
theme.preload = 'none';
theme.volume = 0.75;

let dialogueHasAudioFocus = false;
let themeStopTimer: number | null = null;
let dialogueAudioSession = 0;

function cancelThemeStop(): void {
  if (themeStopTimer !== null) window.clearTimeout(themeStopTimer);
  themeStopTimer = null;
}

function themeSourceFor(name: string): string | null {
  const normalizedName = name.trim().toLowerCase();
  const exactMatch = DIALOGUE_THEME_SOURCES[normalizedName as keyof typeof DIALOGUE_THEME_SOURCES];
  if (exactMatch) return exactMatch;
  const matchingKey = Object.keys(DIALOGUE_THEME_SOURCES).find((key) =>
    normalizedName.startsWith(`${key} `) || key.startsWith(`${normalizedName} `),
  );
  return matchingKey ? DIALOGUE_THEME_SOURCES[matchingKey as keyof typeof DIALOGUE_THEME_SOURCES] : null;
}

function notifyAudioFocusChanged(): void {
  window.dispatchEvent(new Event('max-game:dialogue-audio-focus'));
}

/** Marks a conversation as active so world ambience can be mixed underneath it. */
export function beginDialogueAudio(name?: string, prefix = ''): void {
  addAndyDialogueReply();
  dialogueAudioSession += 1;
  const session = dialogueAudioSession;
  cancelThemeStop();
  dialogueHasAudioFocus = true;
  const source = name && !hasPowerAudioFocus() ? themeSourceFor(name) : null;
  if (!source) {
    theme.pause();
    theme.removeAttribute('src');
    theme.load();
    notifyAudioFocusChanged();
    return;
  }

  const resolvedSource = `${prefix}${POWER_THEME_SOURCES[source] ?? source}`;
  theme.pause();
  if (theme.src !== new URL(resolvedSource, window.location.href).href) {
    theme.src = resolvedSource;
  }
  theme.currentTime = 0;
  notifyAudioFocusChanged();
  void theme.play().then(() => {
    if (session !== dialogueAudioSession) return;
    const duration = name?.trim().toLowerCase() === 'sam' ? 13_000 : 10_000;
    themeStopTimer = window.setTimeout(() => {
      if (session !== dialogueAudioSession) return;
      theme.pause();
      themeStopTimer = null;
    }, duration);
  }).catch(() => {
    // Browsers may require the player to interact before playback can begin.
  });
}

export function endDialogueAudio(): void {
  if (!dialogueHasAudioFocus) return;
  dialogueAudioSession += 1;
  cancelThemeStop();
  dialogueHasAudioFocus = false;
  theme.pause();
  theme.currentTime = 0;
  notifyAudioFocusChanged();
}

export function hasDialogueAudioFocus(): boolean {
  return dialogueHasAudioFocus;
}

export function bindPowerDialogueDismissal(closeDialogue: () => void): void {
  for (const name of ['chris', 'dan', 'georgia', 'helen', 'joe', 'ju', 'julian', 'katie', 'lucy', 'oscar', 'tim', 'sam', 'rei', 'noel', 'mike']) {
    window.addEventListener(`max-game:${name}-power-activated`, closeDialogue);
  }
}
