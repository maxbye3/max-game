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
  assert.equal(battle.getBattleResult('escape').niallQuestState, undefined);

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
