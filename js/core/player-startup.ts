import { writeStorage } from './storage.js';

export const playerStartupParams = new URLSearchParams(window.location?.search ?? '');

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
