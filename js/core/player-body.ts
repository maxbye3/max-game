import { isWheldonPlayerSpriteEnabled, setWheldonPlayerSpriteEnabled } from './player-sprite-test.js';
import { characterForm, unlockCharacter } from './character-unlocks.js';
import { playerStartupParams } from './player-startup.js';
import { readStorage, writeStorage } from './storage.js';

export type PlayerBody = 'player' | 'ghost' | 'alex-s';
const BODY_KEY = 'max-game:player-body';
const storedBody = readStorage(BODY_KEY);
const urlBody = playerStartupParams.get('body');
// Migrate saves made before room possession used the Wheldon toggle.
if (urlBody === 'alex-w' || (!urlBody && storedBody === 'alex-w')) {
  setWheldonPlayerSpriteEnabled(true);
  writeStorage(BODY_KEY, 'player');
}
let body: PlayerBody = urlBody === 'player' || urlBody === 'ghost' || urlBody === 'alex-s'
  ? urlBody
  : urlBody === 'alex-w' ? 'player'
  : storedBody === 'ghost' || storedBody === 'alex-s' ? storedBody : 'player';

export const getPlayerBody = (): PlayerBody => body;
export function setPlayerBody(next: PlayerBody): void {
  body = next;
  writeStorage(BODY_KEY, next);
  unlockCharacter(characterForm(next, isWheldonPlayerSpriteEnabled(), new URLSearchParams(window.location.search).has('seal')));
}
