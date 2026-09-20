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

  console.log('All focused tests passed.');
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}
