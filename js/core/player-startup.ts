import { readStorage, writeStorage } from './storage.js';
import { characterForm, unlockCharacter } from './character-unlocks.js';

export const playerStartupParams = new URLSearchParams(window.location?.search ?? '');

// Remember the form before refresh restores the player, including older saves.
const savedBody = readStorage('max-game:player-body');
const urlBody = playerStartupParams.get('body');
const body = urlBody && ['player', 'ghost', 'alex-s', 'alex-w'].includes(urlBody) ? urlBody : savedBody;
const wheldonParam = playerStartupParams.get('wheldon');
const wheldon = body === 'alex-w' || wheldonParam === '1' || (wheldonParam !== '0' && readStorage('max-game:wheldon-player-sprite') === 'true');
unlockCharacter(characterForm(body, wheldon, playerStartupParams.has('seal')));
if (readStorage('max-game:siblings:transformed') === 'true') unlockCharacter('seal');

const navigation = window.performance?.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
if (navigation?.type === 'reload') {
  // Keep transformations across room navigation, but always refresh as the player.
  writeStorage('max-game:player-body', 'player');
  writeStorage('max-game:wheldon-player-sprite', 'false');
  playerStartupParams.delete('body');
  playerStartupParams.delete('wheldon');
  const url = new URL(window.location.href);
  url.search = playerStartupParams.toString();
  window.history.replaceState(window.history.state, '', url);
}
