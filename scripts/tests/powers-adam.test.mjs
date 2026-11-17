import assert from 'node:assert/strict';
import { withGameTest } from './helpers.mjs';

await withGameTest(async ({ loadModule }) => {
  const { EngagementGame } = await loadModule('engagement', 'js/powers/adam/engagement-game.ts');
  const game = new EngagementGame();
  let previous = [game.ringX, game.fingerX];
  for (let step = 0; step < 600; step++) {
    game.update(1 / 60);
    assert.ok(game.ringX >= .12 && game.ringX <= .88);
    assert.ok(Math.abs(game.ringX + game.fingerX - 1) < 1e-10, 'the hands sweep in opposite directions');
    // Boundary frames contain a reflection; all other frames cover the same distance.
    if (Math.min(previous[0], game.ringX) > .126 && Math.max(previous[0], game.ringX) < .874) {
      assert.ok(Math.abs(Math.abs(game.ringX - previous[0]) - .006) < 1e-10, 'sideways speed is constant');
      assert.ok(Math.abs(Math.abs(game.fingerX - previous[1]) - .006) < 1e-10);
    }
    previous = [game.ringX, game.fingerX];
  }
  const miss = new EngagementGame();
  assert.equal(miss.tap(), true, 'even a misaligned tap starts the forward attempt');
  assert.equal(miss.missed, false, 'a miss is only decided when the hands reach each other');
  const frozen = [miss.ringX, miss.fingerX];
  miss.update(.05);
  assert.ok(miss.connection > 0, 'the hands advance');
  assert.deepEqual([miss.ringX, miss.fingerX], frozen, 'sideways positions stop during the attempt');
  assert.equal(miss.tap(), false, 'repeated taps cannot interrupt an attempt');
  while (miss.phase === 'connecting') miss.update(.05);
  assert.equal(miss.phase, 'returning');
  assert.equal(miss.missed, true);
  while (miss.phase === 'returning') {
    miss.update(.05);
    assert.deepEqual([miss.ringX, miss.fingerX], frozen, 'hands pull back along the same paths');
  }
  assert.equal(miss.phase, 'moving');
  assert.equal(miss.connection, 0);
  miss.update(1 / 60);
  assert.ok(Math.abs(miss.ringX - frozen[0] - .006) < 1e-10, 'a miss resumes the same constant speed');

  const hit = new EngagementGame();
  for (let step = 0; step < 600 && Math.abs(hit.ringX - hit.fingerX) > .025; step++) hit.update(1 / 60);
  const aligned = [hit.ringX, hit.fingerX];
  assert.equal(hit.tap(), true);
  for (let step = 0; step < 60; step++) hit.update(1 / 60);
  assert.equal(hit.phase, 'engaged');
  assert.deepEqual([hit.ringX, hit.fingerX], aligned, 'success does not steer misaligned hands into position');
  assert.equal(hit.connection, 1);
  assert.equal(hit.tap(), false);
});
