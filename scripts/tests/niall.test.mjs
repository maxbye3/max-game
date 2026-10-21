import assert from 'node:assert/strict';
import { withGameTest } from './helpers.mjs';

await withGameTest(async ({ loadModule, values, element }) => {
  values.set('max-game:niall-quest-state', 'following');
  const niall = await loadModule('niall-bus-dialogue', 'js/characters/niall/niall.ts');
  niall.updateNiallInteraction(0, niall.NIALL_BUS_STOP.triggerX, niall.NIALL_BUS_STOP.triggerY);
  const niallNext = () => element('#niall-dialogue-next').listeners.get('click')();
  assert.equal(element('#niall-dialogue-line').textContent, 'Niall is rolling a cigarette');
  assert.equal(niall.isNiallEncounterBlockingPlayer(), false, 'bus-stop dialogue lets the player walk away');
  niallNext();
  assert.equal(element('#niall-dialogue-line').textContent, 'Kept you waiting huh?');
  assert.equal(niall.isNiallEncounterBlockingPlayer(), false, 'the second arrival line also permits movement');
  niallNext();
  assert.equal(element('#niall-dialogue').hidden, true, 'the bus-stop conversation ends after Niall’s two arrival lines');
  assert.notEqual(element('#niall-dialogue-line').textContent, "My pizza's are technically imperfect but free", 'Niall keeps the fight line out of bus-stop dialogue');
  niallNext();
  assert.equal(element('#niall-dialogue').hidden, true);
  assert.equal(niall.isNiallEncounterBlockingPlayer(), false);
  for (const advance of [false, true]) {
    values.set('max-game:niall-quest-state', 'busStop');
    const walkingNiall = await loadModule(`niall-walk-away-${advance}`, 'js/characters/niall/niall.ts');
    walkingNiall.updateNiallInteraction(0, walkingNiall.NIALL_BUS_STOP.triggerX, walkingNiall.NIALL_BUS_STOP.triggerY);
    assert.equal(element('#niall-dialogue').hidden, false);
    if (advance) niallNext();
    assert.equal(walkingNiall.isNiallEncounterBlockingPlayer(), false);
    walkingNiall.updateNiallInteraction(0, walkingNiall.niallState.x - 65, walkingNiall.niallState.y);
    assert.equal(element('#niall-dialogue').hidden, true, 'walking out of range dismisses either arrival line');
    niallNext();
    assert.equal(element('#niall-dialogue').hidden, true, 'leaving clears queued dialogue');
    walkingNiall.updateNiallInteraction(0, walkingNiall.NIALL_BUS_STOP.triggerX, walkingNiall.NIALL_BUS_STOP.triggerY);
    assert.equal(element('#niall-dialogue').hidden, true, 'returning does not immediately reopen the dismissed conversation');
    assert.equal(values.get('max-game:niall-quest-state'), 'busStop', 'walking away preserves quest progress');
  }
  values.set('max-game:niall-quest-state', 'hostile');
  const hostileNiall = await loadModule('niall-hostile-dialogue', 'js/characters/niall/niall.ts');
  hostileNiall.updateNiallInteraction(0, hostileNiall.NIALL.x, hostileNiall.NIALL.y + 60);
  assert.equal(hostileNiall.isNiallEncounterBlockingPlayer(), true, 'the fight alert still pauses movement');
  values.clear();
});

const protectedForms = [
  { name: 'Wheldon', body: 'player', wheldon: true, seal: false },
  { name: 'possessed Wheldon', body: 'alex-s', wheldon: false, seal: false },
  { name: 'ghost', body: 'ghost', wheldon: false, seal: false },
  { name: 'Wheldon ghost', body: 'ghost', wheldon: true, seal: false },
  { name: 'seal', body: 'player', wheldon: false, seal: true },
];
for (const form of protectedForms) await withGameTest(async ({ loadModule, values, element }) => {
  values.set('max-game:player-body', form.body);
  values.set('max-game:wheldon-player-sprite', String(form.wheldon));
  window.location.search = form.seal ? '?seal=1' : '';
  element('#niall-dialogue').hidden = true;
  const niall = await loadModule(`niall-ignore-${form.name}`, 'js/characters/niall/niall.ts');
  const start = { ...niall.niallState };
  niall.updateNiallInteraction(0.1, start.x, start.y + 60);
  niall.updateNiallInteraction(0.1, start.x, start.y);
  assert.equal(niall.isNiallAlertActive(), false, `Niall ignores ${form.name} in sight`);
  assert.equal(niall.isNiallEncounterBlockingPlayer(), false);
  assert.equal(niall.isNiallBattleTransitionActive(), false);
  assert.equal(element('#niall-dialogue').hidden, true);
  assert.deepEqual(niall.niallState, start, 'Niall does not move toward a protected form');
});

for (const phase of ['spotted', 'chasing', 'caught', 'transition']) {
  for (const form of protectedForms) await withGameTest(async ({ loadModule, element }) => {
    element('#niall-dialogue').hidden = true;
    const createElement = document.createElement;
    document.createElement = tag => Object.assign(createElement(tag), { style: { setProperty() {} } });
    let cancelledTimer;
    window.clearTimeout = timer => { cancelledTimer = timer; };
    const niall = await loadModule('niall-change-form', 'js/characters/niall/niall.ts', `
      export { setPlayerBody } from './js/core/player-body.ts';
      export { setWheldonPlayerSpriteEnabled } from './js/core/player-sprite-test.ts';
    `);
    const next = () => element('#niall-dialogue-next').listeners.get('click')();
    niall.updateNiallInteraction(0, niall.NIALL.x, niall.NIALL.y + 60);
    assert.equal(niall.isNiallAlertActive(), true, 'Niall still challenges the normal player');
    if (phase !== 'spotted') next();
    if (phase === 'caught' || phase === 'transition') niall.updateNiallInteraction(0, niall.NIALL.x, niall.NIALL.y);
    if (phase === 'transition') { next(); assert.equal(niall.isNiallBattleTransitionActive(), true); }
    niall.setPlayerBody(form.body);
    niall.setWheldonPlayerSpriteEnabled(form.wheldon);
    window.location.search = form.seal ? '?seal=1' : '';
    const position = { ...niall.niallState };
    niall.updateNiallInteraction(0.1, niall.NIALL.x, niall.NIALL.y + 60);
    assert.equal(niall.isNiallEncounterBlockingPlayer(), false, `${form.name} ends ${phase}`);
    assert.equal(niall.isNiallAlertActive(), false);
    assert.equal(niall.isNiallBattleTransitionActive(), false);
    assert.equal(element('#niall-dialogue').hidden, true);
    assert.deepEqual(niall.niallState, position, 'the chase stops immediately');
    if (phase === 'transition') assert.ok(cancelledTimer, 'changing form cancels battle navigation');
    niall.setPlayerBody('player');
    niall.setWheldonPlayerSpriteEnabled(false);
    window.location.search = '';
    niall.updateNiallInteraction(0, niall.NIALL.x, niall.NIALL.y + 60);
    assert.equal(niall.isNiallAlertActive(), true, 'the normal player can trigger a fresh encounter');
  });
}
