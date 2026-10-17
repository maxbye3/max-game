import assert from 'node:assert/strict';
import { withGameTest } from './helpers.mjs';

await withGameTest(async ({ loadModule }) => {
  const samPower = await loadModule('sam-power', 'js/powers/sam/sam-power.ts');
  samPower.activateSamPower(1000);
  assert.equal(samPower.samPowerSecondsLeft(1000), 13);
  assert.equal(samPower.samMovementMultiplier(1000), 1.28);
  samPower.updateSamPower(1000, 100, 100, [
    { id: 'friend', x: 150, y: 100, height: 50 },
    { id: 'too-far-away', x: 300, y: 100, height: 50 },
  ]);
  assert.equal(samPower.isSamTargetRecoiling('friend', 1000), true);
  assert.equal(samPower.isSamTargetRecoiling('too-far-away', 1000), false);
  assert.ok(samPower.samVictimOffset('friend', 1200).x > 0);
  assert.equal(samPower.samPowerSecondsLeft(13999) > 0, true);
  assert.equal(samPower.samPowerSecondsLeft(14000), 0);
  assert.equal(samPower.samMovementMultiplier(14000), 1);

  assert.equal(samPower.samPowerSecondsLeft(999), 0, 'Sam remains inactive before the activation clock');
  samPower.activateSamPower(15000);
  const samTargets = [
    { id: 'friend', x: 225, y: 100, height: 40 },
    { id: 'foe', x: 70, y: 100, height: 40 },
    { id: 'outside', x: 229, y: 100, height: 40 },
    { id: 'friend', x: 225, y: 100, height: 40 },
  ];
  samPower.updateSamPower(15000, 100, 100, samTargets, 'right');
  assert.deepEqual(samPower.getSamPinchStats(), { pinches: 2, characters: 2 }, 'both friend and foe are pinched, with duplicate targets counted once');
  assert.equal(samPower.isSamTargetRecoiling('outside', 15000), false);
  assert.equal(samPower.getSamTerrainSnaps(15000).length, 2);
  const movingSamTargets = samTargets.map((target) => target.id === 'friend' ? { ...target, x: 220 } : target.id === 'outside' ? { ...target, x: 237 } : target);
  samPower.updateSamPower(15600, 108, 100, movingSamTargets, 'right');
  assert.equal(samPower.getSamPinchStats().pinches, 2, 'the repeat cooldown is independent of the frame rate');
  assert.equal(samPower.getSamPinchEffects(15600).find((effect) => effect.id === 'friend').x, 220, 'claws track the real moving character');
  assert.ok(samPower.getSamFootsteps(15600).length > 1);
  assert.deepEqual(samPower.getSamOrigin(), { x: 100, y: 100 }, 'the tide stays anchored in the world');
  samPower.updateSamPower(15650, 108, 100, movingSamTargets, 'right');
  assert.equal(samPower.getSamPinchStats().pinches, 4);
  samPower.updateSamPower(15700, 108, 100, []);
  assert.equal(samPower.getSamPinchEffects(15700).length, 0, 'removed characters cannot leave phantom claws');
  samPower.updateSamPower(27999, 108, 100, movingSamTargets);
  assert.ok(samPower.getSamPinchEffects(27999).length > 0);
  assert.equal(samPower.isSamTargetRecoiling('friend', 28000), false, 'even the final pinch stops at exactly thirteen seconds');
  assert.deepEqual(samPower.samVictimOffset('friend', 28000), { x: 0, y: 0 });
  assert.deepEqual(samPower.samCameraJolt(28000), { x: 0, y: 0 });
  assert.equal(samPower.getSamPinchEffects(28000).length, 0);
  assert.equal(samPower.getSamFootsteps(28000).length, 0);
  assert.equal(samPower.getSamTerrainSnaps(28000).length, 0);
  samPower.updateSamPower(29000, 108, 100, movingSamTargets);
  assert.ok(samPower.samPowerReveal().includes('6 pinches to 2 characters'), 'inventory reveals the actual completed interaction count');
  samPower.activateSamPower(30000);
  assert.deepEqual(samPower.getSamPinchStats(), { pinches: 0, characters: 0 });
  assert.equal(samPower.getSamFootsteps(30000).length, 0, 'reactivation clears the earlier transformation');
});
