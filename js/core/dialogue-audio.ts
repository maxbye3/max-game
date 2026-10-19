import { DIALOGUE_THEME_SOURCES } from '../generated/core/dialogue-themes.generated.js';
import { POWER_THEME_SOURCES } from '../generated/core/power-themes.generated.js';
import { createGameAudio, hasPowerAudioFocus } from './audio-mute.js';
import { characterIdForName } from './character-assets.js';
import { addAndyDialogueReply } from '../powers/andy/andy-power.js';

const theme = createGameAudio();
theme.loop = true;
theme.preload = 'none';
theme.volume = 0.75;

let dialogueHasAudioFocus = false;
let dialogueSpeaker: string | null = null;
let themeStopTimer: number | null = null;
let dialogueAudioSession = 0;

function cancelThemeStop(): void {
  if (themeStopTimer !== null) window.clearTimeout(themeStopTimer);
  themeStopTimer = null;
}

function themeSourceFor(name: string): string | null {
  const characterId = characterIdForName(name);
  return characterId ? DIALOGUE_THEME_SOURCES[characterId as keyof typeof DIALOGUE_THEME_SOURCES] ?? null : null;
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
  dialogueSpeaker = name?.trim().toLowerCase() ?? null;
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
  dialogueSpeaker = null;
  theme.pause();
  theme.currentTime = 0;
  notifyAudioFocusChanged();
}

export function hasDialogueAudioFocus(name?: string): boolean {
  return dialogueHasAudioFocus && (name === undefined || dialogueSpeaker === name.trim().toLowerCase());
}

export function bindPowerDialogueDismissal(closeDialogue: () => void): void {
  for (const name of ['ed', 'alice', 'chris', 'dan', 'georgia', 'helen', 'joe', 'ju', 'julian', 'katie', 'kirin', 'lucy', 'oscar', 'tim', 'sam', 'rei', 'noel', 'mike']) {
    window.addEventListener(`max-game:${name}-power-activated`, closeDialogue);
  }
}
