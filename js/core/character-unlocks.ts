import { readStorage, writeStorage } from './storage.js';

export const CHARACTER_FORMS = ['player', 'wheldon', 'ghost-player', 'ghost-wheldon', 'seal'] as const;
export type CharacterForm = typeof CHARACTER_FORMS[number];
const KEY = 'max-game:unlocked-characters';
const unlocked = new Set<CharacterForm>(['player']);
try {
  const saved: unknown = JSON.parse(readStorage(KEY) ?? '[]');
  if (Array.isArray(saved)) for (const form of CHARACTER_FORMS) if (saved.includes(form)) unlocked.add(form);
} catch { /* A damaged save must not expose unearned forms. */ }

export const getUnlockedCharacters = (): readonly CharacterForm[] => CHARACTER_FORMS.filter(form => unlocked.has(form));
export function unlockCharacter(form: CharacterForm): void {
  if (unlocked.has(form)) return;
  unlocked.add(form);
  writeStorage(KEY, JSON.stringify(getUnlockedCharacters()));
}
export function resetCharacterUnlocks(): void {
  unlocked.clear(); unlocked.add('player');
  writeStorage(KEY, JSON.stringify(getUnlockedCharacters()));
}
export function characterForm(body: string | null, wheldon: boolean, seal: boolean): CharacterForm {
  if (body === 'ghost') return wheldon ? 'ghost-wheldon' : 'ghost-player';
  if (body === 'alex-s' || body === 'alex-w' || wheldon) return 'wheldon';
  return seal ? 'seal' : 'player';
}
