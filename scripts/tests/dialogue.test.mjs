import assert from 'node:assert/strict';
import { withGameTest } from './helpers.mjs';

await withGameTest(async ({ loadModule, values, element, scheduledCallbacks }) => {
  const worldState = await loadModule('world-state', 'js/core/world-state.ts');
  let resolveFixture;
  globalThis.fetch = () => new Promise((resolve) => { resolveFixture = resolve; });
  values.clear();
  const npcs = await loadModule('npcs', 'js/overworld/npcs.ts');
  npcs.setupNpcInteractions();
  const next = () => element('#npc-dialogue-next').listeners.get('click')();
  const leave = () => npcs.updateNpcInteractions(-100, -100);
  // Approach from Ed's east side so Adam's nearby interaction does not win.
  const approachEd = () => npcs.updateNpcInteractions(npcs.ED.x + 30, npcs.ED.y);
  approachEd();
  assert.equal(element('#npc-dialogue-profile').src, 'char/ed/profile.png');
  assert.equal(element('#npc-dialogue-profile').hidden, false);
  assert.match(element('#npc-dialogue-line').textContent, /Halstead Court/);
  next();
  assert.match(element('#npc-dialogue-line').textContent, /Checking Arsenal/);
  assert.equal(element('#npc-dialogue-next').hidden, true);
  resolveFixture({ ok: true, json: async () => ({ events: [{
    strHomeTeam: 'Arsenal', strAwayTeam: 'Test opponents', strTimestamp: '2026-10-01T19:00:00Z',
  }] }) });
  await new Promise((resolve) => setImmediate(resolve));
  assert.match(element('#npc-dialogue-line').textContent, /Next Arsenal game: Arsenal v Test opponents/);
  next();
  assert.deepEqual(JSON.parse(values.get('max-game:inventory-gifts')), ['ed-item']);
  assert.equal(values.has('max-game:unlocked-songs'), false);
  assert.equal(element('#npc-dialogue-next').hidden, false);
  next();
  assert.deepEqual(JSON.parse(values.get('max-game:unlocked-songs')), ['Outer wildeds']);
  assert.equal(element('#npc-dialogue-next').hidden, false, 'Ed continues his dialogue after the song reward');
  assert.ok(element('.game-shell').children.some((overlay) => overlay.children?.some(
    (image) => image.src === 'audio/music/caledonian-is-massive.png',
  )));
  // Both owned: still greet and report football, but no duplicate rewards.
  leave(); approachEd(); next();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(element('#npc-dialogue-next').hidden, false, 'Ed can continue his dialogue when rewards are already owned');
  // Song owned, item removed: deliver the item again independently of music.
  values.set('max-game:inventory-gifts', '[]');
  leave(); approachEd(); next();
  await new Promise((resolve) => setImmediate(resolve));
  next();
  assert.deepEqual(JSON.parse(values.get('max-game:inventory-gifts')), ['ed-item']);
  assert.equal(element('#npc-dialogue-next').hidden, false, 'NPC dialogue remains available after the item reward');
  // Item owned, song absent: skip the item and offer music after football.
  values.delete('max-game:unlocked-songs');
  leave(); approachEd(); next();
  await new Promise((resolve) => setImmediate(resolve));
  next();
  assert.deepEqual(JSON.parse(values.get('max-game:unlocked-songs')), ['Outer wildeds']);
  // Leaving during even a cached async response cannot overwrite Alex.
  leave(); approachEd(); next();
  npcs.updateNpcInteractions(npcs.ALEX_S.x, npcs.ALEX_S.y);
  const alexLine = element('#npc-dialogue-line').textContent;
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(element('#npc-dialogue-line').textContent, alexLine);

  // Alex delivers his restored item before offering music, with his root portrait.
  values.clear();
  const approachAlex = () => npcs.updateNpcInteractions(npcs.ALEX_S.x, npcs.ALEX_S.y);
  leave(); approachAlex();
  assert.equal(values.has('max-game:inventory-gifts'), false);
  assert.equal(element('#npc-dialogue-profile').src, 'char/wheldon/profile.png');
  assert.equal(element('#npc-dialogue-profile').hidden, false);
  next();
  assert.deepEqual(JSON.parse(values.get('max-game:inventory-gifts')), ['alex-s-item']);
  assert.equal(values.has('max-game:unlocked-songs'), false);
  assert.equal(element('#npc-dialogue-next').hidden, false);
  next();
  assert.deepEqual(JSON.parse(values.get('max-game:unlocked-songs')), ['Africa']);
  assert.match(element('#npc-gift-confirmation').textContent, /Africa was added to your music playlist/);
  assert.equal(element('#npc-dialogue-next').hidden, false, 'Alex continues his dialogue after the song reward');
  // Song owned: later conversations keep cycling the dialogue.
  leave(); approachAlex(); next();
  assert.deepEqual(JSON.parse(values.get('max-game:inventory-gifts')), ['alex-s-item']);
  assert.deepEqual(JSON.parse(values.get('max-game:unlocked-songs')), ['Africa']);
  // An older save with other songs still receives Africa once.
  values.set('max-game:unlocked-songs', '["Outer wildeds"]');
  leave(); approachAlex(); next();
  assert.deepEqual(JSON.parse(values.get('max-game:unlocked-songs')), ['Outer wildeds', 'Africa']);
  assert.equal(element('#npc-dialogue-next').hidden, false, 'Alex continues his dialogue after the song reward');
  // Players who already unlocked Africa still receive the missing item.
  values.set('max-game:inventory-gifts', '[]');
  leave(); approachAlex(); next();
  assert.deepEqual(JSON.parse(values.get('max-game:inventory-gifts')), ['alex-s-item']);
  assert.equal(element('#npc-dialogue-next').hidden, false, 'Alex keeps talking after reissuing his item');

  // Adam keeps his facts between the rotating greeting and inventory gift.
  values.clear();
  const approachAdam = () => npcs.updateNpcInteractions(npcs.ADAM.x, npcs.ADAM.y);
  leave(); approachAdam();
  assert.match(element('#npc-dialogue-line').textContent, /You\'re shorter than I was expecting/);
  assert.equal(element('#npc-dialogue-profile').hidden, true);
  const profiles = await loadModule('profile-images', 'js/core/profile-images.ts');
  assert.equal(profiles.profileImageSource('adam'), null);
  assert.equal(profiles.profileImageSource('Bochra'), null, 'a missing root portrait is intentional');
  assert.equal(profiles.profileImageSource('ed'), 'char/ed/profile.png');
  assert.equal(profiles.profileImageSource('Alex S'), 'char/wheldon/profile.png');
  assert.equal(profiles.profileImageSource('Helen'), 'char/helen/profile.png');
  assert.equal(profiles.profileImageSource('marina d'), 'char/marina-d/profile.png');
  for (const source of Object.values((await loadModule('profile-sources', 'js/generated/core/profile-images.generated.ts')).PROFILE_IMAGE_SOURCES)) {
    assert.match(source, /^char\/[^/]+\/profile\.(?:png|jpe?g)$/i);
  }
  next();
  assert.match(element('#npc-dialogue-line').textContent, /2006 Champions League final/);
  assert.equal(element('#npc-dialogue-next').hidden, false);
  next();
  assert.deepEqual(JSON.parse(values.get('max-game:inventory-gifts')), ['adam-item']);
  assert.equal(element('#npc-dialogue-next').hidden, false, 'NPC dialogue can continue after an item is awarded');
  assert.equal(values.has('max-game:unlocked-songs'), false);
  next();
  assert.match(element('#npc-dialogue-line').textContent, /still very short/);
  leave(); approachAdam();
  assert.match(element('#npc-dialogue-line').textContent, /still very short/);
  next();
  assert.match(element('#npc-dialogue-line').textContent, /Dial Square/);
  assert.equal(element('#npc-dialogue-next').hidden, false, 'Adam can continue his dialogue after his follow-up fact');
  values.set('max-game:inventory-gifts', '[]');
  leave(); approachAdam(); next(); next();
  assert.deepEqual(JSON.parse(values.get('max-game:inventory-gifts')), ['adam-item']);
  assert.equal(values.has('max-game:unlocked-songs'), false);

  // Andy gives unclaimed rewards, then plays every line after either music choice.
  const { MusicHouseDialogueController } = await loadModule('music-house-dialogue', 'js/interiors/music-house-dialogue.ts');
  const andyLines = (await loadModule('andy-dialogue-flow', 'js/generated/dialogues/andy-dialogue.ts')).ANDY_DIALOGUE_LINES;
  let spotifyOpens = 0;
  window.open = () => { spotifyOpens += 1; };
  for (const accept of [false, true]) {
    for (let owned = 0; owned < 8; owned += 1) {
      values.clear();
      const gifts = [];
      if (owned & 1) gifts.push('andy-item');
      if (owned & 2) gifts.push('portable-walkman');
      const songs = ['Africa'];
      if (owned & 4) songs.push('Too much duolingo');
      values.set('max-game:inventory-gifts', JSON.stringify(gifts));
      values.set('max-game:unlocked-songs', JSON.stringify(songs));
      let closed = false;
      const controller = new MusicHouseDialogueController(
        element('#andy-line'), element('#andy-next'), element('#andy-progress'),
        element('#andy-confirmation'), () => { closed = true; controller.stop(); },
      );
      controller.start('andy');
      assert.equal(element('#andy-line').textContent, "Would you like to hear Max's music?");
      assert.equal(element('#andy-next').hidden, true);
      assert.equal(element('#music-dialogue-options').hidden, false);
      const opensBefore = spotifyOpens;
      element(accept ? '#music-yes' : '#music-no').listeners.get('click')();
      assert.equal(spotifyOpens - opensBefore, accept ? 1 : 0);
      const missing = [1, 2, 4].filter((flag) => !(owned & flag));
      for (let step = 0; step < missing.length; step += 1) {
        if (step > 0) controller.next();
        assert.equal(element('#andy-next').hidden, false);
        if (missing[step] === 1) assert.match(element('#andy-confirmation').textContent, /Andy's item was added/);
        if (missing[step] === 2) assert.match(element('#andy-confirmation').textContent, /portable walkman was added/);
        if (missing[step] === 4) assert.match(element('#andy-confirmation').textContent, /Too much duolingo was added to your music playlist/);
        if (!(owned & 4) && missing[step] !== 4) {
          assert.deepEqual(JSON.parse(values.get('max-game:unlocked-songs')), ['Africa']);
        }
      }
      assert.equal(closed, false);
      if (missing.length) controller.next();
      for (let lineIndex = 0; lineIndex < andyLines.length; lineIndex += 1) {
        assert.equal(element('#andy-line').textContent, andyLines[lineIndex]);
        assert.equal(element('#andy-progress').textContent, `${lineIndex + 1}/${andyLines.length}`);
        assert.equal(element('#andy-progress').hidden, false);
        assert.equal(element('#andy-confirmation').hidden, true);
        assert.equal(element('#music-dialogue-options').hidden, true);
        assert.equal(element('#andy-next').hidden, lineIndex === andyLines.length - 1);
        if (lineIndex < andyLines.length - 1) controller.next();
      }
      assert.deepEqual(JSON.parse(values.get('max-game:inventory-gifts')).sort(), ['andy-item', 'portable-walkman']);
      assert.deepEqual(JSON.parse(values.get('max-game:unlocked-songs')), ['Africa', 'Too much duolingo']);
      controller.next();
      assert.deepEqual(JSON.parse(values.get('max-game:unlocked-songs')), ['Africa', 'Too much duolingo']);
      controller.stop();
    }
  }

  const reiLines = (await loadModule('rei-dialogue-flow', 'js/generated/dialogues/rei-dialogue.ts')).REI_DIALOGUE_LINES;
  const approachRei = () => { leave(); npcs.updateNpcInteractions(npcs.REI.x, npcs.REI.y); };
  const finishReiMission = (completed) => {
    next();
    assert.match(element('#npc-dialogue-line').textContent, completed ? /finish the billboard/ : /red paint/);
    if (completed) {
      next();
      assert.equal(element('#npc-dialogue-line').textContent, 'thanks anyway for the help');
    }
    next();
    assert.equal(element('#npc-dialogue').hidden, true);
    assert.ok(element('.game-shell').children.at(-1).children.some(
      (image) => image.src === (completed ? 'img/external/quest-complete.png' : 'img/external/quest_accepted.png'),
    ));
    scheduledCallbacks.at(-1)();
    assert.equal(element('#npc-dialogue').hidden, false);
  };
  // An old completed reward stage must never hide an item missing from inventory.
  for (const completed of [false, true]) {
    for (const owned of [[], ['rei-item'], ['rei-item-2'], ['rei-item', 'rei-item-2']]) {
      for (const songOwned of [false, true]) {
        values.clear();
        values.set('max-game:rei-gift-stage', '2');
        values.set('max-game:mike-aftermath', String(completed));
        values.set('max-game:inventory-gifts', JSON.stringify(owned));
        if (songOwned) values.set('max-game:unlocked-songs', '["Lemon jelly"]');
        approachRei();
        assert.equal(element('#npc-dialogue-line').textContent, reiLines[0], 'every visit starts with Rei’s greeting');
        assert.equal(element('#npc-dialogue-profile').hidden, true, 'Rei has no root portrait');
        finishReiMission(completed);
        const missingGift = ['rei-item', 'rei-item-2'].find((id) => !owned.includes(id));
        assert.deepEqual(JSON.parse(values.get('max-game:inventory-gifts')), missingGift ? [...owned, missingGift] : owned);
        if (missingGift) {
          assert.match(element('#npc-gift-confirmation').textContent, /Rei's item was added/);
          if (!songOwned) next();
        }
        assert.deepEqual(JSON.parse(values.get('max-game:unlocked-songs')), ['Lemon jelly']);
        for (const line of reiLines.slice(1)) {
          assert.equal(element('#npc-dialogue-next').hidden, false, 'all Rei topics remain reachable after rewards');
          next();
          assert.equal(element('#npc-dialogue-line').textContent, line);
        }
        assert.equal(element('#npc-dialogue-next').hidden, true);
      }
    }
  }
  // A fresh save still receives the first item after accepting the mission.
  values.clear();
  approachRei();
  finishReiMission(false);
  assert.deepEqual(JSON.parse(values.get('max-game:inventory-gifts')), ['rei-item']);
  assert.equal(values.get('max-game:rei-gift-stage'), '1');
  next();
  assert.deepEqual(JSON.parse(values.get('max-game:unlocked-songs')), ['Lemon jelly']);
  // Removing that item restores it on the next visit instead of skipping it.
  values.set('max-game:inventory-gifts', '[]');
  approachRei(); finishReiMission(false);
  assert.deepEqual(JSON.parse(values.get('max-game:inventory-gifts')), ['rei-item']);
  // Leaving during an overlay must cancel the pending gift.
  values.set('max-game:inventory-gifts', '[]');
  values.set('max-game:rei-gift-stage', '2');
  worldState.markInteriorVisited();
  approachRei(); next(); next(); next();
  const delayedGift = scheduledCallbacks.at(-1);
  leave(); delayedGift();
  assert.deepEqual(JSON.parse(values.get('max-game:inventory-gifts')), []);
  // Both items and song owned: repeat completion survives reload without duplicates.
  values.set('max-game:inventory-gifts', '["rei-item", "rei-item-2"]');
  values.set('max-game:unlocked-songs', '["Lemon jelly"]');
  const savedReiProgress = new Map(values);
  const reloadedNpcs = await loadModule('npcs-reloaded', 'js/overworld/npcs.ts');
  reloadedNpcs.setupNpcInteractions();
  reloadedNpcs.updateNpcInteractions(reloadedNpcs.REI.x, reloadedNpcs.REI.y);
  finishReiMission(true);
  assert.deepEqual(values, savedReiProgress, 'replaying completion does not duplicate owned rewards');
  next();
  assert.equal(element('#npc-dialogue-line').textContent, reiLines[1]);
  reloadedNpcs.updateNpcInteractions(-100, -100);
  npcs.setupNpcInteractions();

  values.clear();
  values.set('max-game:inventory-gifts', '["marina-d-item-1", "marina-d-item-2"]');
  const inventoryGifts = await loadModule('inventory-gifts', 'js/core/inventory-gifts.ts');
  assert.deepEqual(inventoryGifts.getCollectedGifts(), []);
  assert.deepEqual(JSON.parse(values.get('max-game:inventory-gifts')), [], 'retired Marina D gifts are removed from existing saves');
  const approachMarina = () => npcs.updateNpcInteractions(npcs.MARINA_D.x, npcs.MARINA_D.y);
  leave(); approachMarina();
  assert.equal(element('#npc-dialogue-next').hidden, false, 'Marina D dialogue remains available');
  next();
  assert.deepEqual(JSON.parse(values.get('max-game:inventory-gifts')), [], 'Marina D no longer gives either item');

  for (const npc of [npcs.CHRIS]) {
    values.clear();
    leave(); npcs.updateNpcInteractions(npc.x, npc.y);
    assert.equal(element('#npc-dialogue-line').textContent, npc.dialogueLines[0]);
    assert.equal(element('#npc-dialogue-profile').hidden, false);
    assert.match(element('#npc-dialogue-profile').src, new RegExp(`^char/${npc.id}/profile\\.(png|jpg|jpeg)$`));
    next();
    assert.deepEqual(JSON.parse(values.get('max-game:inventory-gifts')), [`${npc.id}-item`]);
    assert.equal(element('#npc-dialogue-next').hidden, false, 'Chris continues his lines after the item reward');
    assert.equal(values.has('max-game:unlocked-songs'), false);
    next();
    assert.equal(element('#npc-dialogue-line').textContent, npc.dialogueLines[1]);
    leave(); npcs.updateNpcInteractions(npc.x, npc.y);
    assert.equal(element('#npc-dialogue-line').textContent, npc.dialogueLines[1]);
    next();
    assert.equal(element('#npc-dialogue-line').textContent, npc.dialogueLines[2]);
    assert.deepEqual(JSON.parse(values.get('max-game:inventory-gifts')), [`${npc.id}-item`]);
    values.set('max-game:inventory-gifts', '[]');
    leave(); npcs.updateNpcInteractions(npc.x, npc.y); next();
    assert.deepEqual(JSON.parse(values.get('max-game:inventory-gifts')), [`${npc.id}-item`]);
  }

  // Alice finishes her greeting before the gift and event question.
  values.clear(); leave(); npcs.updateNpcInteractions(npcs.ALICE.x, npcs.ALICE.y);
  assert.equal(element('#npc-dialogue-profile').hidden, false);
  for (let index = 1; index < npcs.ALICE.dialogueLines.length; index++) {
    next();
    assert.equal(element('#npc-dialogue-line').textContent, npcs.ALICE.dialogueLines[index]);
    assert.equal(values.has('max-game:inventory-gifts'), false);
  }
  next();
  assert.deepEqual(JSON.parse(values.get('max-game:inventory-gifts')), ['alice-item']);
  next();
  assert.equal(element('#alice-dialogue-options').hidden, false);
  assert.equal(element('#npc-dialogue-next').hidden, true);

  leave(); npcs.updateNpcInteractions(npcs.BOCHRA.x, npcs.BOCHRA.y);
  assert.equal(element('#npc-dialogue-profile').hidden, true, 'Bochra has no root portrait');
  assert.equal(element('#npc-dialogue-profile').src, '', 'no fallback picture is used');
});
