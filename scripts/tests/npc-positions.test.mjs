import assert from 'node:assert/strict';
import { withGameTest } from './helpers.mjs';

await withGameTest(async ({ loadModule }) => {
  const originalImage = globalThis.Image;
  globalThis.Image = class {};
  try {
    const load = () => loadModule('npc-layout', 'js/overworld/npc-definitions.ts', `
      export { MAP_NPC_POSITIONS, rememberMapNpcPositions } from './js/overworld/map-npc-positions.ts';
      export { MAP_CHARACTER_DEFINITIONS } from './js/overworld/map-characters.ts';
      export { playerCollidesAt } from './js/core/collision.ts';
    `);
    let previous = await load();
    const ids = Object.keys(previous.MAP_NPC_POSITIONS);
    assert.deepEqual(ids.sort(), ['bochra', 'chris', 'dan', 'ju', 'katy', 'maddy', 'marinaD', 'ruby']);
    const fixed = previous.NPCS.filter(npc => !ids.includes(npc.id)).map(({id, x, y}) => ({id, x, y}));
    assert.equal(window.sessionStorage.getItem('max-game:map-npc-layout'), null, 'importing NPCs alone does not count as an overworld visit');

    for (let visit = 0; visit < 24; visit++) {
      previous.rememberMapNpcPositions();
      const saved = window.sessionStorage.getItem('max-game:map-npc-layout');
      const current = await load();
      assert.equal(window.sessionStorage.getItem('max-game:map-npc-layout'), saved, 'interior imports cannot overwrite the last overworld layout');
      const occupied = new Set();
      for (const id of ids) {
        const spot = current.MAP_NPC_POSITIONS[id];
        assert.notDeepEqual(spot, previous.MAP_NPC_POSITIONS[id], `${id} changes position on every visit`);
        assert.equal(current.playerCollidesAt(spot.x, spot.y), false, `${id} stays on walkable ground`);
        occupied.add(`${spot.x},${spot.y}`);
        const npc = current.NPCS.find(npc => npc.id === id);
        assert.deepEqual({x:npc.x, y:npc.y}, spot, 'dialogue uses the chosen position');
        if (id !== 'katy') {
          const sprite = current.MAP_CHARACTER_DEFINITIONS.find(character => character.id === (id === 'marinaD' ? 'marina-d' : id));
          assert.deepEqual({x:sprite.x, y:sprite.y}, spot, 'rendering and power targets use the same position');
        }
      }
      assert.equal(occupied.size, ids.length, 'characters never share a spot');
      assert.deepEqual(current.NPCS.filter(npc => !ids.includes(npc.id)).map(({id, x, y}) => ({id, x, y})), fixed, 'unlisted characters keep their locations');
      previous = current;
    }

    for (const saved of ['bad json', '{}', '[0,0,0,0,0,0,0,0]', '[0,1,2,3,4,5,6,99]']) {
      window.sessionStorage.setItem('max-game:map-npc-layout', saved);
      const { MAP_NPC_POSITIONS } = await load();
      assert.equal(new Set(Object.values(MAP_NPC_POSITIONS).map(spot => `${spot.x},${spot.y}`)).size, ids.length, 'invalid saved layouts recover safely');
    }
    window.sessionStorage = { getItem() { throw new Error('Storage blocked'); }, setItem() { throw new Error('Storage blocked'); } };
    const withoutStorage = await load();
    assert.doesNotThrow(() => withoutStorage.rememberMapNpcPositions());
  } finally { globalThis.Image = originalImage; }
});
