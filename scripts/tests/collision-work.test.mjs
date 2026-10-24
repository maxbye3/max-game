import assert from 'node:assert/strict';
import { withGameTest } from './helpers.mjs';

await withGameTest(async ({ loadModule, values }) => {
  window.location.search = '?seal=1';
  values.set('max-game:siblings:transformed', 'true');
  const { getInteriorScene, InteriorCollision, setBody } = await loadModule('collision-work', 'js/interiors/interior-collision.ts', "export { InteriorCollision } from './js/interiors/interior-collision.ts'; export { getInteriorScene } from './js/interiors/interior-scenes.ts'; export { setPlayerBody as setBody } from './js/core/player-body.ts';");
  const collision = new InteriorCollision(getInteriorScene('northwest-portal'), () => false);
  let reads = 0;
  Object.defineProperty(window.location, 'search', { configurable: true, get: () => { reads++; return '?seal=1'; } });
  assert.equal(collision.playerIsBlocked(200, 260), false);
  assert.equal(reads, 0, 'walking away from the chair does not parse transformation state');
  assert.equal(collision.playerIsBlocked(320, 180), true);
  assert.equal(reads, 1, 'a complete foot collision reads transformation state once');
  setBody('ghost');
  assert.equal(collision.playerIsBlocked(320, 180), false, 'body changes are visible on the next check');
  setBody('player'); values.set('max-game:siblings:transformed', 'false');
  assert.equal(collision.playerIsBlocked(320, 180), false, 'transformation resets never leave a cached obstacle');
  assert.equal(collision.playerIsBlocked(20, 180), true, 'cave walls still collide');
});
