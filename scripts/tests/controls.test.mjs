import assert from 'node:assert/strict';
import { withGameTest } from './helpers.mjs';

await withGameTest(async ({ loadModule }) => {
  const { createInteriorPlayerUpdater, setTestBody, activateTestTim } = await loadModule('interior-player', 'js/interiors/interior-player.ts', "export { setPlayerBody as setTestBody } from './js/core/player-body.ts'; export { activateTimInputPower as activateTestTim } from './js/powers/tim/tim-input-power.ts';");
  const held = new Set();
  const input = { isHeld: direction => held.has(direction), releaseAll: () => held.clear() };
  const player = { x: 256, y: 384, direction: 'down', frame: 3, animationTime: 1 };
  let journalOpen = false, caveEntering = false;
  const update = createInteriorPlayerUpdater({
    player, input, width: 512, height: 768, frameCount: 9,
    collision: { playerIsBlocked: x => x > 270 },
    flightBounds: { minX: 0, minY: 0, maxX: 512, maxY: 768 },
    flightLandingBlocked: () => false,
    isJournalOpen: () => journalOpen, isCaveEntering: () => caveEntering,
  });
  held.add('right'); update(0.05);
  assert.equal(player.x, 263.25);
  assert.equal(player.direction, 'right');
  player.x = 256; player.y = 384; held.add('up'); update(0.05);
  assert.ok(Math.abs(Math.hypot(player.x - 256, player.y - 384) - 7.25) < 1e-9, 'diagonals use the same speed');
  assert.equal(player.direction, 'upRight');
  held.delete('up');
  for (let i = 0; i < 10; i++) update(0.05);
  assert.ok(player.x <= 270, 'ordinary players respect collision boundaries');
  const before = player.x; journalOpen = true; update(0.05);
  assert.equal(player.x, before); assert.equal(held.size, 0, 'opening the journal releases movement');
  journalOpen = false; caveEntering = true; held.add('right'); update(0.05);
  assert.equal(player.x, before); assert.equal(player.frame, 0, 'cave entrance dialogue pauses animation');
  caveEntering = false; setTestBody('ghost'); update(0.05);
  assert.ok(player.x > 270, 'ghosts pass through ordinary collision');
  player.x = 511;
  for (let i = 0; i < 10; i++) update(0.05);
  assert.ok(player.x <= 512, 'ghost movement still respects the world edge');
  setTestBody('player'); player.x = 256;
  activateTestTim(performance.now()); update(0.05);
  assert.ok(player.x < 256, 'Tim still reverses the selected control direction');
});
