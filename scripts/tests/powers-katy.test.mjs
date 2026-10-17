import assert from 'node:assert/strict';
import { withGameTest } from './helpers.mjs';

await withGameTest(async ({ loadModule }) => {
  const katyPower = await loadModule('katy-power', 'js/powers/katy/katy-power.ts');
  katyPower.activateKatyPower(1000);
  assert.equal(katyPower.katyPowerSecondsLeft(1000), 10);
  assert.equal(katyPower.updateKatyPower(1699, true), false);
  assert.equal(katyPower.isPlayerTripping(1699), false);
  katyPower.updateKatyPower(1700, true);
  assert.equal(katyPower.isPlayerTripping(1700), true);
  assert.equal(katyPower.isPlayerTripping(2351), false);
  assert.equal(katyPower.updateKatyPower(11000, true), true);
  assert.equal(katyPower.katyPowerSecondsLeft(11000), 0);
});
