import assert from 'node:assert/strict';
import { withGameTest } from './helpers.mjs';

await withGameTest(async ({ loadModule, values, element }) => {
  const { createRoomCharacterDialogue, setTestBody } = await loadModule('room-dialogue', 'js/interiors/room-character-dialogue.ts', "export { setPlayerBody as setTestBody } from './js/core/player-body.ts';");
  let active = null, closed = 0, links = 0;
  window.open = () => { links++; };
  const dialogue = createRoomCharacterDialogue({ open() {}, close: () => { closed++; active = null; dialogue.stop(); }, isActive: kind => active === kind });
  const click = selector => element(selector).listeners.get('click')();
  const gifts = () => JSON.parse(values.get('max-game:inventory-gifts') ?? '[]');
  active = 'noel'; dialogue.start('noel'); dialogue.next('noel');
  assert.equal(element('#noel-game-options').hidden, false);
  click('#noel-game-no');
  assert.equal(links, 0);
  assert.match(element('#noel-dialogue-line').textContent, /haven’t actually finished/);
  dialogue.next('noel'); assert.ok(gifts().includes('noel-item'));
  dialogue.next('noel'); assert.ok(JSON.parse(values.get('max-game:unlocked-songs')).includes('bleep-blops'));
  dialogue.next('noel'); assert.equal(closed, 1);
  active = 'noel'; dialogue.start('noel'); dialogue.next('noel'); click('#noel-game-yes');
  assert.equal(links, 1); assert.equal(closed, 2, 'owned rewards finish without duplicate grants');
  active = 'wheldon'; setTestBody('ghost'); dialogue.start('wheldon'); dialogue.next('wheldon');
  assert.equal(dialogue.isWheldonQuestion, true);
  assert.equal(element('#possess-room-alex').hidden, false);
  click('#wheldon-no'); assert.equal(dialogue.isWheldonQuestion, false);
  dialogue.next('wheldon'); assert.equal(element('#noel-dialogue-next').hidden, true);
  dialogue.stop(); setTestBody('player'); dialogue.start('wheldon'); dialogue.next('wheldon');
  assert.equal(element('#possess-room-alex').hidden, true);
  click('#wheldon-yes'); dialogue.next('wheldon');
  active = 'helen'; dialogue.start('helen');
  assert.equal(element('#noel-dialogue-profile').src, '../char/helen/profile.png');
  for (let i = 0; i < 20 && element('#helen-reading-options').hidden; i++) dialogue.next('helen');
  assert.equal(element('#helen-reading-options').hidden, false);
  assert.ok(gifts().includes('helen-item'));
  for (const cat of ['minnie', 'buzz', 'tigger', 'socks']) {
    dialogue.start(cat);
    assert.equal(element('#noel-dialogue-profile').hidden, true, 'cats without root portraits get no fallback');
    assert.equal(element('#noel-dialogue-next').hidden, true);
  }
});
