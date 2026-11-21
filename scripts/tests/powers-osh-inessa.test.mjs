import assert from 'node:assert/strict';
import { withGameTest } from './helpers.mjs';

await withGameTest(async ({ loadModule }) => {
  const osh = await loadModule('osh-power', 'js/powers/osh/osh-power.ts');
  assert.equal(osh.askGod(false, 500), null, 'prayer is unavailable without the item');
  osh.activateOshPower(1000);
  assert.equal(osh.oshPowerSecondsLeft(1000), 30);
  assert.equal(osh.isOshPowerActive(999), false);
  const first = osh.askGod(false, 1100);
  assert.notEqual(osh.askGod(false, 1200), first, 'asking again produces a new answer');
  assert.equal(osh.hasOshBlessing(1200), false);
  assert.match(osh.askGod(true, 1300), /blessed/);
  assert.equal(osh.hasOshBlessing(1300), true);
  assert.equal(osh.isOshPowerActive(31000), false);
  assert.equal(osh.hasOshBlessing(31000), false);
  assert.equal(osh.askGod(true, 31000), null);
  osh.activateOshPower(32000);
  assert.equal(osh.hasOshBlessing(32000), false, 'a fresh item clears the old blessing');
  assert.equal(osh.askGod(false, 32000), first, 'a fresh item starts a fresh conversation');

  const tea = await loadModule('inessa-power', 'js/powers/inessa/inessa-power.ts');
  assert.equal(tea.isInessaPowerActive(500), false);
  tea.activateInessaPower(1000);
  assert.equal(tea.inessaPowerSecondsLeft(1000), 15);
  assert.equal(tea.isInessaPowerActive(999), false);
  assert.match(tea.inessaRussianLine('Hello!'), /[А-Яа-я]/);
  assert.equal(tea.inessaRussianLine('Hello!'), tea.inessaRussianLine('Hello!'), 'a line stays stable across frames');
  assert.equal(tea.isInessaPowerActive(15999), true);
  assert.equal(tea.inessaPowerSecondsLeft(16000), 0);
  tea.activateInessaPower(32000);
  assert.equal(tea.inessaPowerSecondsLeft(32000), 15);
});
