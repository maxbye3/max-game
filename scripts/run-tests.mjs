import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';

const temporaryDirectory = await mkdtemp(join(tmpdir(), 'max-game-tests-'));

async function loadModule(name, source) {
  const outfile = join(temporaryDirectory, `${name}.mjs`);
  await build({ entryPoints: [source], outfile, bundle: true, format: 'esm', platform: 'node' });
  return import(`${pathToFileURL(outfile).href}?test=${Date.now()}`);
}

try {
  const battle = await loadModule('battle-outcome', 'js/battle-outcome.ts');
  assert.equal(battle.getBattleResult('victory').niallQuestState, 'following');
  assert.equal(battle.getBattleResult('defeat').niallQuestState, undefined);
  assert.deepEqual(battle.getBattleResult('escape'), {
    message: "Alright, I'll walk you back to the bus.",
    linkLabel: 'Walk to the bus',
    href: '../index.html?niall=bus',
    niallQuestState: 'following',
  });

  const niallBattle = await loadModule('niall-battle', 'js/niall-battle.ts');
  const fight = new niallBattle.NiallBattle();
  fight.damageNiall(30);
  assert.equal(fight.niallHp, 90);
  fight.healPlayer(50);
  assert.equal(fight.playerHp, niallBattle.PLAYER_MAX_HP);
  fight.defend();
  const defended = fight.applyNiallAttack({ damage: 11, message: 'test' });
  assert.equal(defended.damage, 5);
  assert.equal(fight.playerHp, 95);
  fight.applyNiallAttack({ damage: 0, fomo: true, message: 'test' });
  assert.equal(fight.applyFomoDamage(), 10);
  assert.equal(fight.playerHp, 85);
  assert.equal(niallBattle.chooseNiallAttack(() => 0), niallBattle.NIALL_ATTACKS[0]);

  const thiefPath = await loadModule('cave-thief-path', 'js/cave-thief-path.ts');
  const openPath = thiefPath.buildThiefPath(8, 8, 72, 8, () => false);
  assert.equal(openPath.targetCell, thiefPath.thiefPathCell(72, 8));
  assert.ok(openPath.points.length > 0);

  globalThis.Audio = class {
    preload = '';
    currentTime = 0;
    play() { return Promise.resolve(); }
    pause() {}
  };
  const caveSiblings = await loadModule('cave-siblings', 'js/cave-siblings.ts');
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

  const values = new Map();
  globalThis.window = {
    localStorage: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
    },
  };
  const worldState = await loadModule('world-state', 'js/world-state.ts');
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
  values.clear();

  const sprites = await loadModule('player-sprite', 'js/player-sprite.ts');
  assert.equal(sprites.getPlayerSpriteFrame(false, 'up', 2, 2).sourceY, 144);
  assert.equal(sprites.getPlayerSpriteFrame(true, 'down', 0, 2).sourceY, 1290);
  assert.equal(sprites.getPlayerSpriteFrame(true, 'left', 0, 2).sourceY, 486);

  const katyPower = await loadModule('katy-power', 'js/katy-power.ts');
  katyPower.activateKatyPower(1000);
  assert.equal(katyPower.katyPowerSecondsLeft(1000), 10);
  assert.equal(katyPower.updateKatyPower(1699, true), false);
  assert.equal(katyPower.isPlayerTripping(1699), false);
  katyPower.updateKatyPower(1700, true);
  assert.equal(katyPower.isPlayerTripping(1700), true);
  assert.equal(katyPower.isPlayerTripping(2351), false);
  assert.equal(katyPower.updateKatyPower(11000, true), true);
  assert.equal(katyPower.katyPowerSecondsLeft(11000), 0);

  const interiorScenes = await loadModule('interior-scenes', 'js/interior-scenes.ts');
  const interiorDoors = await loadModule('interior-doors', 'js/interior-doors.ts');
  const interiorCollision = await loadModule('interior-collision', 'js/interior-collision.ts');
  const plantRoom = interiorScenes.getInteriorScene('garden-room');
  const plantRoomDoors = new interiorDoors.InteriorDoorsController(plantRoom, {
    enteredDoor: 'garden-room', sealMode: false, hasCaveColander: () => false,
  });
  plantRoomDoors.update(plantRoom.playerStart.x, plantRoom.playerStart.y);
  const plantRoomCollision = new interiorCollision.InteriorCollision(
    plantRoom,
    (x, y) => plantRoomDoors.passageIsOpen(x, y),
  );
  assert.equal(plantRoomCollision.playerIsBlocked(256, 590), false);
  for (let y = plantRoom.playerStart.y; y <= 650; y += 2) {
    assert.equal(plantRoomCollision.playerIsBlocked(256, y), false, `Garden exit is blocked at y=${y}`);
  }
  assert.equal(plantRoomCollision.playerIsBlocked(230, 610), false);
  assert.equal(plantRoomCollision.playerIsBlocked(280, 610), false);
  console.log('plant scene', plantRoom.kind, plantRoom.playerStart, plantRoom.doors);
  console.log('plant passage', [570, 580, 590, 600, 610, 620].map((y) => [y, plantRoomDoors.passageIsOpen(256, y), plantRoomCollision.isBlocked(256, y)]));
  assert.equal(plantRoomCollision.playerIsBlocked(256, 610), false);

  const packageJson = JSON.parse(await readFile('package.json', 'utf8'));
  for (const entry of ['js/main.ts', 'js/internal.ts', 'js/niall-fight.ts']) {
    assert.match(packageJson.scripts.watch, new RegExp(entry.replace('.', '\\.')));
    assert.match(packageJson.scripts.bundle, new RegExp(entry.replace('.', '\\.')));
  }
  assert.equal(packageJson.scripts['watch:bundle'], undefined);
  const lineLimits = {
    'js/internal.ts': 700,
    'js/render.ts': 350,
    'js/cave-thief.ts': 250,
    'js/niall-fight.ts': 230,
  };
  for (const [file, limit] of Object.entries(lineLimits)) {
    const lines = (await readFile(file, 'utf8')).split(/\r?\n/).length;
    assert.ok(lines < limit, `${file} must stay below ${limit} lines; found ${lines}`);
  }

  // Exercise the real NPC handlers with a minimal DOM and controlled fixture response.
  const elements = new Map();
  function element(selector) {
    if (!elements.has(selector)) elements.set(selector, {
      hidden: false, textContent: '', src: '', children: [], listeners: new Map(),
      setAttribute() {}, removeAttribute() {}, remove() {},
      getContext() { return {}; },
      append(...children) { this.children.push(...children); },
      replaceChildren(...children) { this.children = children; },
      focus() {},
      showModal() { this.open = true; },
      close() { this.open = false; },
      addEventListener(event, callback) { this.listeners.set(event, callback); },
    });
    return elements.get(selector);
  }
  globalThis.document = {
    baseURI: 'http://localhost/',
    querySelector: (selector) => selector.startsWith('script') ? null : element(selector),
    createElement: (tag) => element(`${tag}-${Math.random()}`),
  };
  window.location = { href: 'http://localhost/' };
  window.dispatchEvent = () => {};
  window.addEventListener = () => {};
  const scheduledCallbacks = [];
  window.setTimeout = (callback) => { scheduledCallbacks.push(callback); return scheduledCallbacks.length; };
  Audio.prototype.removeAttribute = () => {};
  Audio.prototype.load = () => {};
  let resolveFixture;
  globalThis.fetch = () => new Promise((resolve) => { resolveFixture = resolve; });
  values.clear();
  const npcs = await loadModule('npcs', 'js/npcs.ts');
  npcs.setupNpcInteractions();
  const next = () => element('#npc-dialogue-next').listeners.get('click')();
  const leave = () => npcs.updateNpcInteractions(-100, -100);
  // Approach from Ed's east side so Adam's nearby interaction does not win.
  const approachEd = () => npcs.updateNpcInteractions(npcs.ED.x + 30, npcs.ED.y);
  approachEd();
  assert.equal(element('#npc-dialogue-profile').src, 'chat/ed/profile.jpg');
  assert.equal(element('#npc-dialogue-profile').hidden, false);
  assert.equal(element('#npc-dialogue-line').textContent, "Hi there I'm Ed. This is my first line.");
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
  assert.equal(element('#npc-dialogue-next').hidden, true);
  assert.ok(element('.game-shell').children.some((overlay) => overlay.children?.some(
    (image) => image.src === 'audio/music/caledonian-is-massive.png',
  )));
  // Both owned: still greet and report football, but no duplicate rewards.
  leave(); approachEd(); next();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(element('#npc-dialogue-next').hidden, true);
  // Song owned, item removed: deliver the item again independently of music.
  values.set('max-game:inventory-gifts', '[]');
  leave(); approachEd(); next();
  await new Promise((resolve) => setImmediate(resolve));
  next();
  assert.deepEqual(JSON.parse(values.get('max-game:inventory-gifts')), ['ed-item']);
  assert.equal(element('#npc-dialogue-next').hidden, true);
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

  // Alex's song and item are independent rewards, including older saves.
  values.clear();
  const approachAlex = () => npcs.updateNpcInteractions(npcs.ALEX_S.x, npcs.ALEX_S.y);
  leave(); approachAlex(); next();
  assert.deepEqual(JSON.parse(values.get('max-game:inventory-gifts')), ['alex-s-item']);
  assert.equal(values.has('max-game:unlocked-songs'), false);
  assert.equal(element('#npc-dialogue-next').hidden, false);
  next();
  assert.deepEqual(JSON.parse(values.get('max-game:unlocked-songs')), ['Africa']);
  assert.match(element('#npc-gift-confirmation').textContent, /Africa was added to your music playlist/);
  assert.equal(element('#npc-dialogue-next').hidden, true);
  // Both owned: normal dialogue gives no duplicate rewards.
  leave(); approachAlex(); next();
  assert.deepEqual(JSON.parse(values.get('max-game:inventory-gifts')), ['alex-s-item']);
  assert.deepEqual(JSON.parse(values.get('max-game:unlocked-songs')), ['Africa']);
  // Item already owned, song missing: give Africa on the next dialogue step.
  values.set('max-game:unlocked-songs', '["Outer wildeds"]');
  leave(); approachAlex(); next();
  assert.deepEqual(JSON.parse(values.get('max-game:unlocked-songs')), ['Outer wildeds', 'Africa']);
  assert.equal(element('#npc-dialogue-next').hidden, true);
  // Song owned, item missing: still deliver Alex's item.
  values.set('max-game:inventory-gifts', '[]');
  leave(); approachAlex(); next();
  assert.deepEqual(JSON.parse(values.get('max-game:inventory-gifts')), ['alex-s-item']);
  assert.deepEqual(JSON.parse(values.get('max-game:unlocked-songs')), ['Outer wildeds', 'Africa']);
  assert.equal(element('#npc-dialogue-next').hidden, true);

  // Adam keeps his facts between the rotating greeting and inventory gift.
  values.clear();
  const approachAdam = () => npcs.updateNpcInteractions(npcs.ADAM.x, npcs.ADAM.y);
  leave(); approachAdam();
  assert.equal(element('#npc-dialogue-line').textContent, "Hi there I'm Adam. This is my second line.");
  assert.equal(element('#npc-dialogue-profile').hidden, true);
  const profiles = await loadModule('profile-images', 'js/profile-images.ts');
  assert.equal(profiles.profileImageSource('adam'), null);
  assert.equal(profiles.profileImageSource('ed'), 'chat/ed/profile.jpg');
  assert.equal(profiles.profileImageSource('Helen'), 'chat/helen/profile.jpg');
  assert.equal(profiles.profileImageSource('marina d'), null);
  for (const source of Object.values((await loadModule('profile-sources', 'js/profile-images.generated.ts')).PROFILE_IMAGE_SOURCES)) {
    assert.match(source, /^chat\/[^/]+\/profile\.(?:png|jpe?g)$/i);
  }
  next();
  assert.match(element('#npc-dialogue-line').textContent, /Dial Square/);
  assert.equal(element('#npc-dialogue-next').hidden, false);
  next();
  assert.deepEqual(JSON.parse(values.get('max-game:inventory-gifts')), ['adam-item']);
  assert.equal(element('#npc-dialogue-next').hidden, true);
  assert.equal(values.has('max-game:unlocked-songs'), false);
  leave(); approachAdam();
  assert.equal(element('#npc-dialogue-line').textContent, "Hi there I'm Adam. This is my first line.");
  next();
  assert.match(element('#npc-dialogue-line').textContent, /Highbury/);
  assert.equal(element('#npc-dialogue-next').hidden, true);
  values.set('max-game:inventory-gifts', '[]');
  leave(); approachAdam(); next(); next();
  assert.deepEqual(JSON.parse(values.get('max-game:inventory-gifts')), ['adam-item']);
  assert.equal(values.has('max-game:unlocked-songs'), false);

  // Andy gives his item, Walkman, then song; each reward checks its own ownership.
  const { MusicHouseDialogueController } = await loadModule('music-house-dialogue', 'js/music-house-dialogue.ts');
  window.open = () => {};
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
      controller.next();
      assert.equal(element('#music-dialogue-options').hidden, false);
      element(accept ? '#music-yes' : '#music-no').listeners.get('click')();
      const missing = [1, 2, 4].filter((flag) => !(owned & flag));
      for (let step = 0; step < missing.length; step += 1) {
        if (step > 0) controller.next();
        assert.equal(element('#andy-next').hidden, step === missing.length - 1);
        if (missing[step] === 1) assert.match(element('#andy-confirmation').textContent, /Andy's item was added/);
        if (missing[step] === 2) assert.match(element('#andy-confirmation').textContent, /portable walkman was added/);
        if (missing[step] === 4) assert.match(element('#andy-confirmation').textContent, /Too much duolingo was added to your music playlist/);
        if (!(owned & 4) && missing[step] !== 4) {
          assert.deepEqual(JSON.parse(values.get('max-game:unlocked-songs')), ['Africa']);
        }
      }
      assert.equal(closed, owned === 7);
      assert.deepEqual(JSON.parse(values.get('max-game:inventory-gifts')).sort(), ['andy-item', 'portable-walkman']);
      assert.deepEqual(JSON.parse(values.get('max-game:unlocked-songs')), ['Africa', 'Too much duolingo']);
      controller.next();
      assert.deepEqual(JSON.parse(values.get('max-game:unlocked-songs')), ['Africa', 'Too much duolingo']);
      controller.stop();
    }
  }

  values.clear();
  leave(); npcs.updateNpcInteractions(npcs.REI.x, npcs.REI.y);
  assert.equal(element('#npc-dialogue-line').textContent, "Hi I'm rei this is line 1");
  next(); // Rei assigns the mission before giving item 1.
  assert.match(element('#npc-dialogue-line').textContent, /red paint/);
  assert.equal(values.has('max-game:inventory-gifts'), false);
  next(); // Accept the mission, then show the quest overlay.
  assert.equal(element('#npc-dialogue').hidden, true);
  assert.equal(values.has('max-game:inventory-gifts'), false);
  scheduledCallbacks.at(-1)();
  assert.deepEqual(JSON.parse(values.get('max-game:inventory-gifts')), ['rei-item']);
  assert.equal(values.get('max-game:rei-gift-stage'), '1');
  assert.equal(values.has('max-game:unlocked-songs'), false);
  assert.equal(element('#npc-dialogue').hidden, false);
  leave();
  values.set('max-game:interior-visited', 'true');
  values.set('max-game:mike-aftermath', 'false');
  npcs.updateNpcInteractions(npcs.REI.x, npcs.REI.y);
  next(); // Without blood, Rei repeats the request and withholds item 2.
  assert.match(element('#npc-dialogue-line').textContent, /red paint/);
  assert.equal(element('#npc-dialogue').hidden, false);
  assert.deepEqual(JSON.parse(values.get('max-game:inventory-gifts')), ['rei-item']);
  next();
  assert.equal(element('#npc-dialogue').hidden, true);
  worldState.markInteriorVisited(); // Restores Mike's aftermath and the blood.
  leave(); npcs.updateNpcInteractions(npcs.REI.x, npcs.REI.y);
  next(); // Explanation.
  next(); // Thanks.
  next(); // Quest-complete overlay.
  assert.equal(element('#npc-dialogue').hidden, true);
  assert.deepEqual(JSON.parse(values.get('max-game:inventory-gifts')), ['rei-item']);
  scheduledCallbacks.at(-1)(); // Overlay finishes, then deliver the gift.
  assert.deepEqual(JSON.parse(values.get('max-game:inventory-gifts')), ['rei-item', 'rei-item-2']);
  assert.equal(values.get('max-game:rei-gift-stage'), '2');
  assert.equal(element('#npc-dialogue').hidden, false);
  assert.equal(element('#npc-dialogue-next').hidden, false);
  assert.equal(values.has('max-game:unlocked-songs'), false);
  next();
  assert.deepEqual(JSON.parse(values.get('max-game:unlocked-songs')), ['Lemon jelly']);
  assert.equal(element('#npc-dialogue-next').hidden, true);
  assert.ok(element('.game-shell').children.some((overlay) => overlay.children?.some(
    (image) => image.src === 'http://localhost/chat/rei/item-2.png',
  )));
  // Leaving while the completion screen is visible must not grant a late gift.
  values.set('max-game:inventory-gifts', '[]');
  values.set('max-game:rei-gift-stage', '1');
  leave(); npcs.updateNpcInteractions(npcs.REI.x, npcs.REI.y);
  next(); next(); next();
  const delayedGift = scheduledCallbacks.at(-1);
  leave(); delayedGift();
  assert.deepEqual(JSON.parse(values.get('max-game:inventory-gifts')), []);
  // Owning the item does not block a missing song reward.
  values.set('max-game:inventory-gifts', '["rei-item", "rei-item-2"]');
  values.delete('max-game:unlocked-songs');
  npcs.updateNpcInteractions(npcs.REI.x, npcs.REI.y);
  next(); next(); next(); scheduledCallbacks.at(-1)();
  assert.deepEqual(JSON.parse(values.get('max-game:unlocked-songs')), ['Lemon jelly']);
  assert.equal(element('#npc-dialogue-next').hidden, true);
  assert.ok(element('.game-shell').children.at(-1).children.some(
    (image) => image.src === 'audio/music/caledonian-is-massive.png',
  ));
  // Deleting item 1 does not restart the first reward, and item 2 waits for blood.
  values.clear();
  leave(); npcs.updateNpcInteractions(npcs.REI.x, npcs.REI.y); next(); next(); scheduledCallbacks.at(-1)();
  values.set('max-game:inventory-gifts', '[]');
  leave(); npcs.updateNpcInteractions(npcs.REI.x, npcs.REI.y); next();
  assert.match(element('#npc-dialogue-line').textContent, /red paint/);
  assert.deepEqual(JSON.parse(values.get('max-game:inventory-gifts')), []);
  assert.equal(values.get('max-game:rei-gift-stage'), '1');
  assert.equal(values.has('max-game:unlocked-songs'), false);
  worldState.markInteriorVisited();
  leave(); npcs.updateNpcInteractions(npcs.REI.x, npcs.REI.y);
  next(); next(); next(); scheduledCallbacks.at(-1)();
  assert.deepEqual(JSON.parse(values.get('max-game:inventory-gifts')), ['rei-item-2']);
  assert.equal(values.get('max-game:rei-gift-stage'), '2');

  values.clear();
  const approachMarina = () => npcs.updateNpcInteractions(npcs.MARINA_D.x, npcs.MARINA_D.y);
  leave(); approachMarina();
  assert.equal(element('#npc-dialogue-profile').hidden, true);
  assert.equal(element('#npc-dialogue-line').textContent, "Hi I'm rei this is line 1");
  next();
  assert.deepEqual(JSON.parse(values.get('max-game:inventory-gifts')), ['marina-d-item-1']);
  assert.equal(values.get('max-game:marina-d-gift-stage'), '1');
  values.set('max-game:inventory-gifts', '[]');
  leave(); approachMarina(); next();
  assert.deepEqual(JSON.parse(values.get('max-game:inventory-gifts')), ['marina-d-item-2']);
  assert.equal(values.get('max-game:marina-d-gift-stage'), '2');
  leave(); approachMarina();
  assert.equal(element('#npc-dialogue-next').hidden, false); // More submitted dialogue remains available.
  next();
  assert.deepEqual(JSON.parse(values.get('max-game:inventory-gifts')), ['marina-d-item-2']);

  // A missing or unreadable deployed JSON feed must not empty the book gallery.
  const savedShelf = JSON.parse(await readFile('data/goodreads-read.json', 'utf8')).reviews;
  const { GoodreadsReadingController } = await loadModule('goodreads-reading', 'js/goodreads-reading.ts');
  const reading = new GoodreadsReadingController(() => {});
  const gallery = element('#goodreads-reading-list');
  window.location.protocol = 'https:';
  for (const fetchFeed of [
    async () => ({ ok: false, status: 404 }),
    async () => { throw new TypeError('Failed to fetch'); },
    async () => ({ ok: true, json: async () => { throw new SyntaxError('HTML instead of JSON'); } }),
  ]) {
    globalThis.fetch = fetchFeed;
    reading.open();
    assert.equal(gallery.children.length, savedShelf.length, 'Saved books appear before the request finishes');
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(gallery.children.length, savedShelf.length);
    assert.equal(element('#goodreads-reading-status').hidden, true);
    gallery.children[0].listeners.get('click')();
    assert.equal(element('#reading-title').textContent, savedShelf[0].title);
    assert.equal(element('#reading-review').textContent, savedShelf[0].review);
    reading.hide();
  }
  const updatedBook = { ...savedShelf[0], title: 'Updated shelf book' };
  globalThis.fetch = async () => ({ ok: true, json: async () => ({ reviews: [updatedBook] }) });
  reading.open();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(gallery.children.length, 1, 'A successful refresh replaces the saved shelf');
  assert.equal(gallery.children[0].children[0].alt, 'Updated shelf book cover');
  reading.hide();
  window.location.protocol = 'file:';
  let fileRequests = 0;
  globalThis.fetch = async () => { fileRequests += 1; throw new Error('Local file fetch blocked'); };
  reading.open();
  assert.equal(gallery.children.length, savedShelf.length);
  assert.equal(fileRequests, 0);
  reading.hide();

  for (const npc of [npcs.ALICE, npcs.CHRIS]) {
    values.clear();
    leave(); npcs.updateNpcInteractions(npc.x, npc.y);
    assert.equal(element('#npc-dialogue-line').textContent, `Hi there I'm ${npc.name}. This is my first line.`);
    assert.equal(element('#npc-dialogue-profile').hidden, false);
    assert.match(element('#npc-dialogue-profile').src, new RegExp(`^chat/${npc.id}/profile\\.(png|jpg|jpeg)$`));
    next();
    assert.deepEqual(JSON.parse(values.get('max-game:inventory-gifts')), [`${npc.id}-item`]);
    assert.equal(element('#npc-dialogue-next').hidden, true);
    assert.equal(values.has('max-game:unlocked-songs'), false);
    leave(); npcs.updateNpcInteractions(npc.x, npc.y);
    assert.equal(element('#npc-dialogue-line').textContent, `Hi there I'm ${npc.name}. This is my second line.`);
    next();
    assert.equal(element('#npc-dialogue-line').textContent, `Hi there I'm ${npc.name}. This is my third line.`);
    assert.deepEqual(JSON.parse(values.get('max-game:inventory-gifts')), [`${npc.id}-item`]);
    values.set('max-game:inventory-gifts', '[]');
    leave(); npcs.updateNpcInteractions(npc.x, npc.y); next();
    assert.deepEqual(JSON.parse(values.get('max-game:inventory-gifts')), [`${npc.id}-item`]);
  }

  console.log('All focused tests passed.');
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}
