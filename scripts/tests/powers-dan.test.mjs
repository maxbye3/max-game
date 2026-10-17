import assert from 'node:assert/strict';
import { withGameTest } from './helpers.mjs';

await withGameTest(async ({ loadModule }) => {
  const danPower = await loadModule('dan-power', 'js/powers/dan/dan-power.ts');
  assert.equal(danPower.isDanPowerActive(0), false);
  danPower.activateDanPower(1000);
  assert.equal(danPower.danPowerSecondsLeft(1000), 10);
  assert.equal(danPower.isDanPowerActive(999), false);
  assert.equal(danPower.isDanPowerActive(10999), true);
  assert.equal(danPower.isDanPowerActive(11000), false);
  assert.ok(Math.abs(danPower.danWorldDeltaTime(0.05, 1050) - 0.15) < 1e-9);
  assert.ok(Math.abs(danPower.danWorldDeltaTime(0.05, 1025) - 0.1) < 1e-9);
  assert.ok(Math.abs(danPower.danWorldDeltaTime(0.05, 11025) - 0.1) < 1e-9);
  assert.equal(danPower.danWorldDeltaTime(0.05, 11050), 0.05);
  danPower.updateDanWorld(1200, 100, 100, [
    { id: 'near', x: 200, y: 100, height: 52 },
    { id: 'far', x: 1000, y: 100, height: 52 },
  ]);
  assert.equal(danPower.getDanRavers().length, 1);
  assert.equal(danPower.getDanRavers()[0].id, 'near');
  assert.notEqual(danPower.danRiotPose('near', 1200).bounce, 0);
  assert.deepEqual(danPower.danRiotPose('far', 1200), { rotation: 0, bounce: 0 });
  assert.equal(danPower.danRiotPose('player', 1200).bounce, 0, 'the incapacitated wearer stays rooted');
  assert.deepEqual(danPower.danRiotPose('near', 11000), { rotation: 0, bounce: 0 });
  danPower.updateDanWorld(11000, 100, 100, []);
  assert.equal(danPower.getDanRavers().length, 0);
  danPower.activateDanPower(12000);
  assert.equal(danPower.danPowerSecondsLeft(12000), 10);
  assert.equal(danPower.getDanRavers().length, 0);
});
