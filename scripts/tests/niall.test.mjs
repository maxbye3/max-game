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
