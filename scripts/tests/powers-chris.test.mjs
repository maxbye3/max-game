import assert from 'node:assert/strict';
import { withGameTest } from './helpers.mjs';

await withGameTest(async ({ loadModule }) => {
  const chrisPower = await loadModule('chris-power', 'js/powers/chris/chris-power.ts');
  assert.equal(chrisPower.chrisPowerSecondsLeft(0), 0);
  chrisPower.activateChrisPower(1000);
  assert.equal(chrisPower.chrisPowerSecondsLeft(1000), 10);
  assert.equal(chrisPower.isChrisPowerActive(999), false);
  assert.equal(chrisPower.isChrisPowerActive(10999), true);
  assert.equal(chrisPower.isChrisPowerActive(11000), false);
  assert.equal(chrisPower.chrisMovementMultiplier(1000), 1.5);
  assert.equal(chrisPower.chrisWorldDeltaTime(0.05, 1050), 0);
  assert.ok(Math.abs(chrisPower.chrisWorldDeltaTime(0.05, 1025) - 0.025) < 1e-9);
  assert.ok(Math.abs(chrisPower.chrisWorldDeltaTime(0.05, 11025) - 0.025) < 1e-9);
  const chrisTargets = [
    { id: 'near', x: 170, y: 76, height: 52 },
    { id: 'far', x: 1600, y: 76, height: 52 },
  ];
  chrisPower.updateChrisWorld(1000, 100, 100, chrisTargets);
  assert.equal(chrisPower.getChrisListeners().length, 0);
  chrisPower.updateChrisWorld(1100, 100, 100, chrisTargets);
  assert.equal(chrisPower.getChrisListeners().length, 1);
  assert.equal(chrisPower.getChrisListeners()[0].id, 'near');
  assert.notEqual(chrisPower.chrisAudienceLean('near', 1100), 0);
  assert.equal(chrisPower.chrisAudienceLean('far', 1100), 0);
  chrisPower.updateChrisWorld(3200, 100, 100, chrisTargets);
  assert.equal(chrisPower.getChrisListeners().length, 2, 'voice reaches the far side of the world');
  chrisPower.updateChrisWorld(3400, 100, 100, []);
  assert.equal(chrisPower.getChrisListeners().length, 0, 'removed NPCs leave the audience');
  chrisPower.updateChrisWorld(11000, 100, 100, chrisTargets);
  assert.equal(chrisPower.getChrisWaves().length, 0);
  assert.equal(chrisPower.chrisAudienceLean('near', 11000), 0);
  assert.equal(chrisPower.chrisMovementMultiplier(11000), 1);
  assert.equal(chrisPower.chrisWorldDeltaTime(0.05, 11050), 0.05);
  chrisPower.activateChrisPower(12000);
  assert.equal(chrisPower.getChrisListeners().length, 0);
  assert.equal(chrisPower.chrisPowerSecondsLeft(12000), 10);
});
