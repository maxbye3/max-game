import assert from 'node:assert/strict';
import { withGameTest } from './helpers.mjs';

await withGameTest(async ({ loadModule, values, element }) => {
  const { GymNpcDialogueController, JournalGalleryController, setTestBody, setTestWheldon } = await loadModule('gym-npc-dialogue', 'js/interiors/gym-npc-dialogue.ts', "export { JournalGalleryController } from './js/interiors/journal-gallery.ts'; export { setPlayerBody as setTestBody } from './js/core/player-body.ts'; export { setWheldonPlayerSpriteEnabled as setTestWheldon } from './js/core/player-sprite-test.ts';");
  const setTestPlayer = (player) => {
    setTestBody(player === 'ghost-alex' ? 'ghost' : 'player');
    setTestWheldon(player === 'alex' || player === 'ghost-alex');
  };
  const timLine = element('#test-tim-line');
  const timNext = element('#test-tim-next');
  const timProgress = element('#test-tim-progress');
  const timConfirmation = element('#test-tim-confirmation');
  const timDialogue = new GymNpcDialogueController(timLine, timNext, timProgress, timConfirmation);
  for (const player of ['alex', 'ghost-alex']) {
    values.clear();
    setTestPlayer(player);
    for (const eaten of [null, 'false', 'true']) {
      if (eaten !== null) values.set('max-game:alex-w:eatenDoughnut', eaten);
      timDialogue.start('tim', true);
      const highlighted = timLine.children[1];
      assert.equal(highlighted.textContent, eaten === 'true' ? 'go talk to Lucy' : 'eat some doughnuts');
      assert.equal(timLine.children.map((child) => typeof child === 'string' ? child : child.textContent).join(''),
        eaten === 'true' ? "Not now Alex, it's just getting good go talk to Lucy." : 'Alex you look hungry you should eat some doughnuts');
      assert.equal(timNext.hidden, true);
      assert.equal(timProgress.hidden, true);
      timDialogue.next();
      assert.equal(values.has('max-game:inventory-gifts'), false, 'the cinema hint cannot advance into a gift');
      timDialogue.stop();
    }
    timDialogue.start('tim');
    assert.doesNotMatch(timLine.textContent, /doughnuts|go talk to Lucy/, 'Tim keeps his ordinary dialogue outside the cinema');
    assert.equal(timNext.hidden, false);
    timDialogue.stop();
  }
  setTestPlayer('max');
  timDialogue.start('tim', true);
  assert.equal(timNext.hidden, false, 'other players keep Tim\'s ordinary dialogue');
  timDialogue.stop();
  values.clear();
  values.set('max-game:tim-at-cinema', 'true');
  const { CinemaAudienceController } = await loadModule('cinema-audience', 'js/interiors/cinema-audience.ts');
  const audienceEvents = [];
  const audience = new CinemaAudienceController({ openDialogue: () => audienceEvents.push('audience'), closeDialogue: () => audienceEvents.push('close') });
  audience.update(262, 440, false);
  audience.update(280, 440, true, true);
  assert.deepEqual(audienceEvents, ['audience'], 'audience chatter cannot overwrite or close Tim\'s dialogue');
  audience.update(262, 440, false);
  assert.deepEqual(audienceEvents, ['audience', 'audience'], 'audience dialogue resumes after leaving Tim');

  element('#workout-gallery').querySelector = () => null;
  element('#journal-gallery').querySelector = () => null;
  const alexJournal = new JournalGalleryController(() => {});
  alexJournal.hide();
  for (const player of ['alex', 'ghost-alex', 'max', 'lucy', null]) {
    values.clear();
    setTestPlayer(player);
    const canReadJournal = player === 'alex' || player === 'ghost-alex';
    for (const eaten of [null, 'false', 'true']) {
      if (eaten !== null) values.set('max-game:alex-w:eatenDoughnut', eaten);
      alexJournal.open();
      assert.equal(alexJournal.isOpen(), canReadJournal && eaten === 'true', 'the main journal requires Wheldon and an eaten doughnut');
      alexJournal.hide();
    }
    timDialogue.start('julian');
    timDialogue.next();
    assert.equal(element('#tim-workout-journal-options').hidden, !canReadJournal);
    element('#tim-workout-journal-yas').listeners.get('click')();
    assert.equal(element('#tim-workout-journal-panel').hidden, !canReadJournal, 'only Alex and Ghost Alex can open the journal');
    if (canReadJournal) element('#tim-workout-journal-close').listeners.get('click')();
    assert.ok(JSON.parse(values.get('max-game:inventory-gifts')).includes('julian-item'), 'all players still receive Julian\'s gift');
    timDialogue.stop();
    element('#tim-workout-journal-yas').listeners.get('click')();
    assert.equal(element('#tim-workout-journal-panel').hidden, true, 'a hidden journal choice cannot reopen a finished conversation');
  }
  values.clear();
});
