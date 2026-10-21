import { readStorage, writeStorage } from './storage.js';
import { getPlayerBody } from './player-body.js';
import { isWheldonPlayerSpriteEnabled } from './player-sprite-test.js';
import { setSiblingPursuitActive } from './sibling-pursuit.js';

const KEY = 'max-game:siblings:transformed';
export const isSealPlayer = (): boolean => new URLSearchParams(window.location.search).has('seal') && getPlayerBody() === 'player' && !isWheldonPlayerSpriteEnabled();
export const hasCaveTransformation = (): boolean => isSealPlayer() && (readStorage(KEY) === 'true' || new URLSearchParams(window.location.search).get('transformed') === '1');
export const completeCaveTransformation = (): void => writeStorage(KEY, 'true');
export function resetCaveTransformation(url: URL): void {
  writeStorage(KEY, 'false');
  setSiblingPursuitActive(false);
  for (const key of ['seal', 'transformed', 'awakened', 'colander', 'chase']) url.searchParams.delete(key);
}
export function resetCaveTransformationForCurrentForm(): void {
  if (isSealPlayer()) return;
  const url = new URL(window.location.href);
  if (readStorage(KEY) !== 'true' && !['seal', 'transformed', 'awakened'].some((key) => url.searchParams.has(key))) return;
  const hadSeal = url.searchParams.has('seal');
  resetCaveTransformation(url);
  // Seal mode also selects sprite assets at startup. Reload conflicting form URLs.
  if (hadSeal) window.location.replace(url.toString());
  else window.history.replaceState(window.history.state, '', url);
}
export const SEAL_SIBLING_LINES = [
  { speaker: 'Marina', text: 'all we hear are adorable barks' },
  { speaker: 'Maddy', text: "we do don't speak seal" },
  { speaker: 'Marina', text: 'you are cute though' },
  { speaker: 'Maddy', text: 'do you know what we should do with this body you had?' },
] as const;
