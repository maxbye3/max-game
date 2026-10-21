import { readStorage, writeStorage } from './storage.js';

const KEY = 'max-game:siblings:transformed';
export const hasCaveTransformation = (): boolean => readStorage(KEY) === 'true' || new URLSearchParams(window.location.search).get('transformed') === '1';
export const completeCaveTransformation = (): void => writeStorage(KEY, 'true');
export const SEAL_SIBLING_LINES = [
  { speaker: 'Marina', text: 'all we hear are adorable barks' },
  { speaker: 'Maddy', text: "we do don't speak seal" },
  { speaker: 'Marina', text: 'you are cute though' },
  { speaker: 'Maddy', text: 'do you know what we should do with this body you had?' },
] as const;
