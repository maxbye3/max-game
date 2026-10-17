import assert from 'node:assert/strict';
import { withGameTest } from './helpers.mjs';

await withGameTest(async ({ loadModule }) => {
  const oscarPower = await loadModule('oscar-power', 'js/powers/oscar/oscar-power.ts');
  oscarPower.activateOscarPower(1000);
  assert.equal(oscarPower.oscarPowerSecondsLeft(1000), 10);
  assert.equal(oscarPower.oscarMovementMultiplier(1000), 1.35);
  oscarPower.updateOscarPower(1000, 100, 100, [
    { id: 'nearby-friend', x: 140, y: 100, height: 40 },
    { id: 'too-far-away', x: 300, y: 100, height: 40 },
  ]);
  assert.equal(oscarPower.isOscarEaten('nearby-friend', 1000), true);
  assert.equal(oscarPower.isOscarEaten('too-far-away', 1000), false);
  assert.ok(Math.abs(oscarPower.oscarMovementMultiplier(1000) - 1.405) < 1e-9);
  assert.equal(oscarPower.isOscarEaten('nearby-friend', 11000), false);
  assert.equal(oscarPower.oscarPowerSecondsLeft(11000), 0);
  assert.equal(oscarPower.oscarPowerSecondsLeft(999), 0, 'the clock remains inactive before activation');
  oscarPower.activateOscarPower(12000);
  const hungryPlayer = { x: 100, y: 100 };
  const wallBlocks = (x) => x > 120;
  oscarPower.settleOscarDigestion(hungryPlayer, wallBlocks, 12000);
  oscarPower.updateOscarPower(12000, 100, 100, [], 'right');
  assert.equal(oscarPower.isOscarTerrainEaten(140, 100, 12000), true, 'a bite opens terrain in the actual facing direction');
  assert.equal(oscarPower.isOscarTerrainEaten(200, 100, 12000), false, 'uneaten obstacles keep collision');
  assert.ok(oscarPower.oscarGrowth(12000) > 1);
  hungryPlayer.x = 140;
  oscarPower.settleOscarDigestion(hungryPlayer, wallBlocks, 13000);
  oscarPower.settleOscarDigestion(hungryPlayer, wallBlocks, 22000);
  assert.deepEqual(hungryPlayer, { x: 100, y: 100 }, 'restored scenery cannot strand the player inside a wall');
  assert.equal(oscarPower.isOscarTerrainEaten(140, 100, 22000), false);
  assert.equal(oscarPower.oscarGrowth(22000), 1);
  assert.equal(oscarPower.oscarMovementMultiplier(22000), 1);
  oscarPower.updateOscarPower(22000, 100, 100, []);
  assert.equal(oscarPower.getOscarBites().length, 0);
  assert.equal(oscarPower.getOscarMeals().length, 0);
  oscarPower.activateOscarPower(23000);
  hungryPlayer.x = 110;
  oscarPower.settleOscarDigestion(hungryPlayer, wallBlocks, 23000);
  hungryPlayer.x = 115;
  oscarPower.settleOscarDigestion(hungryPlayer, wallBlocks, 33000);
  assert.equal(hungryPlayer.x, 115, 'safe end positions are preserved');
});
