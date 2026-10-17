import assert from 'node:assert/strict';
import { withGameTest } from './helpers.mjs';

await withGameTest(async ({ loadModule }) => {
  const maddyPower = await loadModule('maddy-tea-power', 'js/powers/maddy/maddy-tea-power.ts');
  assert.equal(maddyPower.maddyWorldDeltaTime(0.05, 500), 0.05);
  maddyPower.activateMaddyTeaPower(1000);
  assert.equal(maddyPower.maddyTeaSecondsLeft(1000), 10);
  assert.ok(Math.abs(maddyPower.maddyWorldDeltaTime(0.05, 1025) - 0.026) < 1e-9);
  assert.ok(Math.abs(maddyPower.maddyWorldDeltaTime(0.05, 5000) - 0.002) < 1e-9);
  assert.ok(maddyPower.maddyTeaSecondsLeft(10999) > 0);
  assert.equal(maddyPower.maddyTeaSecondsLeft(11000), 0);
  assert.ok(Math.abs(maddyPower.maddyWorldDeltaTime(0.05, 11025) - 0.026) < 1e-9);
  assert.equal(maddyPower.maddyWorldDeltaTime(0.05, 11050), 0.05);
});
