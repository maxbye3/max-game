import assert from 'node:assert/strict';
import { withGameTest } from './helpers.mjs';

await withGameTest(async ({ loadModule }) => {
  const { TattooGame, TATTOO_STENCIL } = await loadModule('tattoo-game', 'js/powers/ed/tattoo-game.ts');
  const tattoo = new TattooGame();
  tattoo.draw(TATTOO_STENCIL[0][0], 0);
  assert.equal(tattoo.strokes.length, 0, 'the needle is inactive before Start');
  tattoo.start(1000);
  assert.equal(tattoo.secondsLeft(1000), 12);
  for (const path of TATTOO_STENCIL) {
    for (const point of path) tattoo.draw(point, 2000);
    tattoo.lift();
  }
  assert.deepEqual(tattoo.result(), { score: 100, coverage: 100, accuracy: 100 }, 'tracing the Halstead lettering and tribal strokes earns full marks');
  tattoo.update(12999);
  assert.equal(tattoo.phase, 'drawing');
  const completedStrokes = tattoo.strokes.length;
  tattoo.draw({ x: 120, y: 260 }, 13000);
  assert.equal(tattoo.phase, 'finished', 'the needle stops at exactly twelve seconds');
  assert.equal(tattoo.strokes.length, completedStrokes, 'ink after the deadline cannot change the tattoo');
  tattoo.start(20000);
  assert.deepEqual(tattoo.result(), { score: 0, coverage: 0, accuracy: 0 }, 'retry clears the previous tattoo');
  tattoo.draw({ x: 120, y: 265 }, 20001);
  assert.equal(tattoo.result().score, 0, 'off-design ink does not earn points');
  tattoo.draw({ x: -100, y: 20 }, 20002);
  tattoo.draw({ x: 350, y: 200 }, 20003);
  assert.equal(tattoo.strokes.length, 2, 'leaving the arm lifts the needle rather than joining distant points');
  tattoo.lift();
  tattoo.draw({ x: 200, y: 200 }, 20004);
  assert.equal(tattoo.strokes.length, 3, 'releasing and pressing starts a separate stroke');
  tattoo.draw({ x: Number.NaN, y: 200 }, 20005);
  assert.equal(tattoo.strokes.length, 3);
});
