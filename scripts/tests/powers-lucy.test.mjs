import assert from 'node:assert/strict';
import { withGameTest } from './helpers.mjs';

await withGameTest(async ({ loadModule }) => {
  const lucyPower = await loadModule('lucy-power', 'js/powers/lucy/lucy-power.ts');
  const lucyTargets = [
    { id: 'aimed', x: 220, y: 100, height: 40 },
    { id: 'missed', x: 220, y: 190, height: 40 },
    { id: 'out-of-range', x: 900, y: 100, height: 40 },
    { id: 'behind', x: 40, y: 100, height: 40 },
  ];
  lucyPower.activateLucyPower(1000);
  assert.equal(lucyPower.isLucyPowerActive(999), false);
  assert.equal(lucyPower.lucyPowerSecondsLeft(1000), 20);
  lucyPower.updateLucyWorld(1000, 100, 100, lucyTargets, 40);
  assert.equal(lucyPower.getLucyGuests().length, 0, 'characters are hit by aimed jets, not an automatic wave');
  lucyPower.setLucyAim(1000, 80, true);
  lucyPower.updateLucyWorld(1100, 100, 100, lucyTargets, 40);
  assert.deepEqual(lucyPower.getLucyGuests().map((guest) => guest.id), ['aimed']);
  const firstLucyJet = lucyPower.getLucyJets()[0];
  assert.ok(Math.abs(Math.hypot(firstLucyJet.endX - firstLucyJet.x, firstLucyJet.endY - firstLucyJet.y) - 650) < 0.001, 'mayo jets have a finite world-space range');
  assert.deepEqual(lucyPower.getLucyHitStats(), { hits: 1, characters: 1 });
  lucyPower.updateLucyWorld(1100, 100, 100, lucyTargets, 40);
  assert.equal(lucyPower.getLucyJets().length, 1, 'duplicate frames do not emit twice');
  lucyPower.updateLucyWorld(1200, 100, 100, lucyTargets, 40);
  assert.equal(lucyPower.getLucyHitStats().hits, 1, 'holding a jet cannot count the same splatter every frame');
  lucyPower.setLucyAim(220, 170, true);
  lucyPower.updateLucyWorld(1500, 100, 100, lucyTargets, 40);
  assert.ok(lucyPower.getLucyGuest('missed'), 'changing aim hits a different character');
  assert.deepEqual(lucyPower.getLucyHitStats(), { hits: 2, characters: 2 });
  lucyPower.stopLucyFiring();
  lucyPower.updateLucyWorld(1800, 100, 100, lucyTargets, 40);
  assert.equal(lucyPower.getLucyJets().length, 0, 'releasing the pointer stops the stream');
  lucyPower.updateLucyWorld(3600, 100, 100, lucyTargets, 40);
  assert.equal(lucyPower.getLucyGuests().length, 0, 'splatter reactions expire');
  lucyPower.setLucyAim(300, 80, true);
  lucyPower.updateLucyWorld(20000, 100, 100, [{ ...lucyTargets[0], x: 300 }], 40);
  assert.equal(lucyPower.getLucyGuest('aimed').x, 300, 'jets track a moving character at their current position');
  assert.equal(lucyPower.getLucyJets().length, 1, 'a delayed frame does not create a projectile backlog');
  lucyPower.updateLucyWorld(21000, 100, 100, lucyTargets, 40);
  assert.equal(lucyPower.isLucyPowerActive(21000), false);
  assert.equal(lucyPower.getLucyJets().length, 0);
  assert.equal(lucyPower.getLucyGuests().length, 0);
  assert.equal(lucyPower.getLucyAim().firing, false);
  assert.equal(lucyPower.lucyMovementMultiplier(), 1);
  assert.deepEqual(lucyPower.lucyCharacterPose('aimed', 21000), { x: 0, y: 0, lean: 0, scale: 1 });
  assert.match(lucyPower.lucyPowerReveal(), /mayo god.*twenty seconds/);
  assert.match(lucyPower.lucyPowerReveal(), /2 characters with 3 hits/);
  lucyPower.activateLucyPower(22000);
  assert.deepEqual(lucyPower.getLucyHitStats(), { hits: 0, characters: 0 });
  assert.equal(lucyPower.getLucyAim().firing, false, 'reactivation waits for a new deliberate shot');
  lucyPower.setLucyCapEquipped(true);
  assert.equal(lucyPower.isLucyCapEquipped(), true, 'previously collected solar caps remain wearable');
  lucyPower.setLucyCapEquipped(false);
});
