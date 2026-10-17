import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { withGameTest } from './helpers.mjs';

await withGameTest(async ({ loadModule, values }) => {
  const thiefPath = await loadModule('cave-thief-path', 'js/overworld/cave-thief-path.ts');
  const openPath = thiefPath.buildThiefPath(8, 8, 72, 8, () => false);
  assert.equal(openPath.targetCell, thiefPath.thiefPathCell(72, 8));
  assert.ok(openPath.points.length > 0);

  globalThis.Audio = class {
    preload = '';
    currentTime = 0;
    addEventListener() {}
    play() { return Promise.resolve(); }
    pause() {}
  };
  const caveSiblings = await loadModule('cave-siblings', 'js/interiors/cave-siblings.ts');
  const siblingEvents = [];
  const siblings = new caveSiblings.CaveSiblingsController({
    showLine: ({ speaker, line }) => siblingEvents.push(`${speaker}: ${line}`),
    showOptions: () => siblingEvents.push('options'),
    closeDialogue: () => siblingEvents.push('closed'),
  });
  siblings.update(1.35, 0);
  assert.equal(siblings.startWelcome(1000), true);
  siblings.update(0, 5999);
  assert.equal(siblingEvents.includes('options'), false);
  siblings.update(0, 6000);
  assert.equal(siblingEvents.at(-1), 'options');
  siblings.declineWebsite(7000);
  assert.equal(siblingEvents.at(-1), 'Maddy: do not');
  siblings.update(0, 8500);
  assert.equal(siblingEvents.at(-1), 'closed');

  const alexDoughnut = await loadModule('alex-w-state', 'js/core/alex-w-state.ts');
  assert.equal(alexDoughnut.hasAlexEatenDoughnut(), false);
  assert.equal(values.get('max-game:alex-w:eatenDoughnut'), 'false');
  alexDoughnut.setAlexEatenDoughnut(true);
  const savedAlexDoughnut = await loadModule('alex-w-state-reload', 'js/core/alex-w-state.ts');
  assert.equal(savedAlexDoughnut.hasAlexEatenDoughnut(), true);
  alexDoughnut.setAlexEatenDoughnut(false);
  const alexPossessionBody = await loadModule('alex-possession-body', 'js/core/player-body.ts');
  alexPossessionBody.setPlayerBody('player');
  const possessedWheldonSprite = await loadModule('possessed-wheldon-sprite', 'js/core/player-sprite-test.ts');
  possessedWheldonSprite.setWheldonPlayerSpriteEnabled(true);
  const savedBody = await loadModule('player-body-reload', 'js/core/player-body.ts');
  assert.equal(savedBody.getPlayerBody(), 'player');
  const restoredWheldonSprite = await loadModule('restored-wheldon-sprite', 'js/core/player-sprite-test.ts');
  assert.equal(restoredWheldonSprite.isWheldonPlayerSpriteEnabled(), true);
  possessedWheldonSprite.setWheldonPlayerSpriteEnabled(false);
  alexPossessionBody.setPlayerBody('player');

  const worldState = await loadModule('world-state', 'js/core/world-state.ts');
  assert.equal(worldState.getNiallQuestState(), 'hostile');
  values.set('max-game:niall-fight-complete', 'true');
  assert.equal(worldState.getNiallQuestState(), 'following');
  values.set('max-game:niall-at-bus-stop', 'true');
  assert.equal(worldState.getNiallQuestState(), 'busStop');
  worldState.setNiallQuestState('hostile');
  assert.equal(worldState.getNiallQuestState(), 'hostile');
  assert.equal(worldState.hasMikeAftermath(), false);
  values.set('max-game:interior-visited', 'true');
  assert.equal(worldState.hasMikeAftermath(), true); // Existing saves use the older shared flag.
  worldState.resetMikeAftermath();
  assert.equal(worldState.hasMikeAftermath(), false);
  assert.equal(worldState.hasVisitedInterior(), true);
  worldState.markInteriorVisited();
  assert.equal(worldState.hasMikeAftermath(), true);
  const musicLibrary = await loadModule('music-library-reset', 'js/interiors/music-library.ts');
  values.set('max-game:unlocked-songs', '["Africa","Lemon jelly"]');
  let musicResetEvent = false;
  window.dispatchEvent = (event) => { musicResetEvent = event.type === 'max-game:music-library-reset'; };
  musicLibrary.resetMusicLibrary();
  assert.equal(values.has('max-game:unlocked-songs'), false, 'reset clears every unlocked song');
  assert.equal(musicResetEvent, true, 'reset refreshes the music player');
  values.clear();

  const resurrectionSession = new Map();
  window.sessionStorage = {
    getItem: (key) => resurrectionSession.get(key) ?? null,
    setItem: (key, value) => resurrectionSession.set(key, value),
  };
  const alexPower = await loadModule('alex-s-power', 'js/powers/alex-s/alex-s-power.ts');
  assert.equal(alexPower.activateAlexSPower('alex-s', 10000), false, 'Alex can only resurrect another character');
  assert.equal(alexPower.activateAlexSPower('mike', 10000), true);
  assert.equal(alexPower.getAlexResurrection(9999), null);
  assert.equal(alexPower.getAlexResurrection(10000).name, 'Mike');
  assert.equal(alexPower.alexSPowerSecondsLeft(10000), 20);
  assert.equal(alexPower.alexSThemeSecondsLeft(20000), 0, 'music ends after ten seconds even though resurrection continues');
  assert.equal(alexPower.getAlexResurrection(29999).id, 'mike');
  assert.equal(alexPower.getAlexResurrection(30000), null, 'the resurrected character disappears at exactly twenty seconds');
  const restoredAlexPower = await loadModule('alex-s-power-restored', 'js/powers/alex-s/alex-s-power.ts');
  assert.equal(restoredAlexPower.getAlexResurrection(25000).id, 'mike', 'moving to another page restores the selected character');
  assert.equal(restoredAlexPower.alexSPowerSecondsLeft(25000), 5, 'navigation does not restart the spell');
  assert.equal(alexPower.activateAlexSPower('unknown', 26000), false);
  assert.equal(alexPower.getAlexResurrection(26000).id, 'mike', 'an invalid target cannot replace the active resurrection');
  for (const character of alexPower.RESURRECTION_CHARACTERS) {
    assert.ok((await readFile(character.imageSource)).length > 0, `${character.name}'s resurrection sprite exists`);
    assert.equal(alexPower.activateAlexSPower(character.id, 31000), true);
    assert.equal(alexPower.getAlexResurrection(31000).id, character.id);
  }
  assert.match(alexPower.alexSToastLine(0), /toast/);
  assert.equal(alexPower.alexSToastLine(5), alexPower.alexSToastLine(0));
  resurrectionSession.clear();
});
