import assert from 'node:assert/strict';
import { withGameTest } from './helpers.mjs';

await withGameTest(async ({ loadModule }) => {
  const andyPower = await loadModule('andy-power', 'js/powers/andy/andy-power.ts');
  andyPower.activateAndyPower(1000);
  assert.equal(andyPower.andyPowerSecondsLeft(1000), 10);
  assert.equal(andyPower.isAndyPowerActive(10999), true);
  assert.equal(andyPower.isAndyPowerActive(11000), false);
  assert.equal(andyPower.andyMovementMultiplier(999), 1);
  assert.equal(andyPower.andyMovementMultiplier(1000), 1.7);
  assert.equal(andyPower.andyMovementMultiplier(11000), 1);
  assert.ok(Math.abs(andyPower.andyWorldDeltaTime(0.05, 1050) - 0.015) < 1e-9);
  assert.ok(Math.abs(andyPower.andyWorldDeltaTime(0.05, 1025) - 0.0325) < 1e-9);
  assert.ok(Math.abs(andyPower.andyWorldDeltaTime(0.05, 11025) - 0.0325) < 1e-9);
  assert.equal(andyPower.andyWorldDeltaTime(0.05, 11050), 0.05);
  const firstAndyReply = andyPower.createAndyReply('Me and Max would of gone.');
  assert.match(firstAndyReply, /Max and I would have gone/);
  assert.match(firstAndyReply, /Simon de Montfort/);
  assert.match(firstAndyReply, /Those were some weird cashews!/);
  assert.match(andyPower.createAndyReply('That was quite a sentence.'), /Simon de Montfort/);
  assert.match(andyPower.createAndyReply('Another perfectly ordinary sentence.'), /Louis the Pious/);
});
