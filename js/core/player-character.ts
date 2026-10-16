import { getPlayerBody } from './player-body.js';
import { isWheldonPlayerSpriteEnabled } from './player-sprite-test.js';

export function isAlexPlayer(): boolean {
  return getPlayerBody() === 'alex-s' || isWheldonPlayerSpriteEnabled();
}
