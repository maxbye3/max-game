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
  const playNiallFight = (healBeforeRound = -1, skipFirstAttack = false) => {
    const fight = new niallBattle.NiallBattle();
    const moves = [];
    for (let round = 0; round < 5 && fight.canAct; round += 1) {
      if (round === healBeforeRound) fight.useHealthItem();
      fight.takePlayerTurn(!(skipFirstAttack && round === 0));
      assert.equal(fight.takePlayerTurn(true), null, 'queued responses block repeated player attacks');
      assert.equal(fight.useHealthItem(), 0, 'items cannot interrupt enemy responses');
      while (fight.waitingForNiall && fight.playerHp > 0 && fight.niallHp > 0) {
        moves.push(fight.takeNiallTurn());
      }
    }
    return { fight, moves };
  };

  const unhealed = playNiallFight();
  assert.equal(unhealed.fight.playerHp, 0, 'without healing the eighth hit defeats the player');
  assert.equal(unhealed.fight.niallHp, 10, 'Niall survives by one attack');
  assert.equal(unhealed.fight.niallAttackIndex, 8, 'defeat happens immediately before Red Stripe');
  assert.equal(unhealed.fight.takeNiallTurn(), null, 'a dead player cannot continue to Red Stripe');
  assert.equal(unhealed.fight.canAct, false);
  assert.equal(unhealed.fight.useHealthItem(), 0, 'healing cannot revive a defeated player');
  assert.equal(unhealed.fight.hasFomo, true);
  assert.equal(unhealed.moves[1].fomo, true);
  assert.equal(unhealed.moves[1].damage, 10, 'FOMO deals exactly the listed 10 damage');

  for (const round of [1, 2, 3, 4]) {
    const healed = playNiallFight(round);
    assert.ok(healed.fight.playerHp > 0, 'one health item is enough even when used early');
    assert.equal(healed.fight.niallHp, 0, 'Red Stripe finishes Niall after healing');
    assert.equal(healed.fight.niallAttackIndex, 9);
    assert.equal(healed.moves.at(-1).selfDamage, 10);
    assert.equal(healed.fight.takeNiallTurn(), null, 'Buckfast cannot follow a victory');
    assert.equal(healed.fight.useHealthItem(), 0, 'the healing item cannot be reused');
  }

  const potion = new niallBattle.NiallBattle();
  assert.equal(potion.useHealthItem(), 0);
  assert.equal(potion.healthItemUsed, false, 'using the item at full health does not waste it');
  potion.takePlayerTurn(true);
  potion.takeNiallTurn();
  assert.equal(potion.useHealthItem(), 10, 'healing reports the actual amount and caps at maximum HP');
  assert.equal(potion.playerHp, niallBattle.PLAYER_MAX_HP);
  assert.equal(potion.niallAttackIndex, 1, 'healing does not skip an attack in the scripted exchange');
  assert.equal(potion.useHealthItem(), 0);

  const hotSauce = playNiallFight(3, true).fight;
  assert.equal(hotSauce.niallHp, 10, 'skipping a dialogue attack leaves Niall alive after Red Stripe');
  assert.equal(hotSauce.takePlayerTurn(true).knockout, true);
  assert.equal(hotSauce.niallHp, 0, 'Portuguese hot sauce is an instant victory');
  assert.equal(hotSauce.takeNiallTurn(), null);

  const buckfast = playNiallFight(3, true).fight;
  buckfast.takePlayerTurn(false);
  assert.equal(buckfast.takeNiallTurn().knockout, true);
  assert.equal(buckfast.playerHp, 0, 'Buckfast defeats even a healed player instantly');
  assert.equal(buckfast.canAct, false);
  buckfast.finish();
  assert.equal(buckfast.waitingForNiall, false);

  assert.equal(new niallBattle.NiallBattle(0.5).playerHp, 40, 'overworld health scales to battle HP');
  assert.equal(new niallBattle.NiallBattle(0).canAct, false);
  console.log('Niall battle: default loss by one attack, single healing item, FOMO, Red Stripe, hot sauce and Buckfast passed');

  const thiefPath = await loadModule('cave-thief-path', 'js/cave-thief-path.ts');
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

  const resurrectionSession = new Map();
  window.sessionStorage = {
    getItem: (key) => resurrectionSession.get(key) ?? null,
    setItem: (key, value) => resurrectionSession.set(key, value),
  };
  const alexPower = await loadModule('alex-s-power', 'js/alex-s-power.ts');
  assert.equal(alexPower.activateAlexSPower('alex-s', 10000), false, 'Alex can only resurrect another character');
  assert.equal(alexPower.activateAlexSPower('mike', 10000), true);
  assert.equal(alexPower.getAlexResurrection(9999), null);
  assert.equal(alexPower.getAlexResurrection(10000).name, 'Mike');
  assert.equal(alexPower.alexSPowerSecondsLeft(10000), 20);
  assert.equal(alexPower.alexSThemeSecondsLeft(20000), 0, 'music ends after ten seconds even though resurrection continues');
  assert.equal(alexPower.getAlexResurrection(29999).id, 'mike');
  assert.equal(alexPower.getAlexResurrection(30000), null, 'the resurrected character disappears at exactly twenty seconds');
  const restoredAlexPower = await loadModule('alex-s-power-restored', 'js/alex-s-power.ts');
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
  console.log('Alex S: selectable resurrection, exact twenty-second expiry, ten-second theme, navigation continuity and character assets passed');

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

  const maddyPower = await loadModule('maddy-tea-power', 'js/maddy-tea-power.ts');
  assert.equal(maddyPower.maddyWorldDeltaTime(0.05, 500), 0.05);
  maddyPower.activateMaddyTeaPower(1000);
  assert.equal(maddyPower.maddyTeaSecondsLeft(1000), 10);
  assert.ok(Math.abs(maddyPower.maddyWorldDeltaTime(0.05, 1025) - 0.026) < 1e-9);
  assert.ok(Math.abs(maddyPower.maddyWorldDeltaTime(0.05, 5000) - 0.002) < 1e-9);
  assert.ok(maddyPower.maddyTeaSecondsLeft(10999) > 0);
  assert.equal(maddyPower.maddyTeaSecondsLeft(11000), 0);
  assert.ok(Math.abs(maddyPower.maddyWorldDeltaTime(0.05, 11025) - 0.026) < 1e-9);
  assert.equal(maddyPower.maddyWorldDeltaTime(0.05, 11050), 0.05);

  const samPower = await loadModule('sam-power', 'js/sam-power.ts');
  samPower.activateSamPower(1000);
  assert.equal(samPower.samPowerSecondsLeft(1000), 13);
  assert.equal(samPower.samMovementMultiplier(1000), 1.28);
  samPower.updateSamPower(1000, 100, 100, [
    { id: 'friend', x: 150, y: 100, height: 50 },
    { id: 'too-far-away', x: 300, y: 100, height: 50 },
  ]);
  assert.equal(samPower.isSamTargetRecoiling('friend', 1000), true);
  assert.equal(samPower.isSamTargetRecoiling('too-far-away', 1000), false);
  assert.ok(samPower.samVictimOffset('friend', 1200).x > 0);
  assert.equal(samPower.samPowerSecondsLeft(13999) > 0, true);
  assert.equal(samPower.samPowerSecondsLeft(14000), 0);
  assert.equal(samPower.samMovementMultiplier(14000), 1);

  assert.equal(samPower.samPowerSecondsLeft(999), 0, 'Sam remains inactive before the activation clock');
  samPower.activateSamPower(15000);
  const samTargets = [
    { id: 'friend', x: 225, y: 100, height: 40 },
    { id: 'foe', x: 70, y: 100, height: 40 },
    { id: 'outside', x: 229, y: 100, height: 40 },
    { id: 'friend', x: 225, y: 100, height: 40 },
  ];
  samPower.updateSamPower(15000, 100, 100, samTargets, 'right');
  assert.deepEqual(samPower.getSamPinchStats(), { pinches: 2, characters: 2 }, 'both friend and foe are pinched, with duplicate targets counted once');
  assert.equal(samPower.isSamTargetRecoiling('outside', 15000), false);
  assert.equal(samPower.getSamTerrainSnaps(15000).length, 2);
  const movingSamTargets = samTargets.map((target) => target.id === 'friend' ? { ...target, x: 220 } : target.id === 'outside' ? { ...target, x: 237 } : target);
  samPower.updateSamPower(15600, 108, 100, movingSamTargets, 'right');
  assert.equal(samPower.getSamPinchStats().pinches, 2, 'the repeat cooldown is independent of the frame rate');
  assert.equal(samPower.getSamPinchEffects(15600).find((effect) => effect.id === 'friend').x, 220, 'claws track the real moving character');
  assert.ok(samPower.getSamFootsteps(15600).length > 1);
  assert.deepEqual(samPower.getSamOrigin(), { x: 100, y: 100 }, 'the tide stays anchored in the world');
  samPower.updateSamPower(15650, 108, 100, movingSamTargets, 'right');
  assert.equal(samPower.getSamPinchStats().pinches, 4);
  samPower.updateSamPower(15700, 108, 100, []);
  assert.equal(samPower.getSamPinchEffects(15700).length, 0, 'removed characters cannot leave phantom claws');
  samPower.updateSamPower(27999, 108, 100, movingSamTargets);
  assert.ok(samPower.getSamPinchEffects(27999).length > 0);
  assert.equal(samPower.isSamTargetRecoiling('friend', 28000), false, 'even the final pinch stops at exactly thirteen seconds');
  assert.deepEqual(samPower.samVictimOffset('friend', 28000), { x: 0, y: 0 });
  assert.deepEqual(samPower.samCameraJolt(28000), { x: 0, y: 0 });
  assert.equal(samPower.getSamPinchEffects(28000).length, 0);
  assert.equal(samPower.getSamFootsteps(28000).length, 0);
  assert.equal(samPower.getSamTerrainSnaps(28000).length, 0);
  samPower.updateSamPower(29000, 108, 100, movingSamTargets);
  assert.ok(samPower.samPowerReveal().includes('6 pinches to 2 characters'), 'inventory reveals the actual completed interaction count');
  samPower.activateSamPower(30000);
  assert.deepEqual(samPower.getSamPinchStats(), { pinches: 0, characters: 0 });
  assert.equal(samPower.getSamFootsteps(30000).length, 0, 'reactivation clears the earlier transformation');
  console.log('Sam power: thirteen-second timing, friend/foe contacts, repeat cooldown, live target tracking, world trails, exact cleanup and completed stats passed');

  const timInputPower = await loadModule('tim-input-power', 'js/tim-input-power.ts');
  assert.deepEqual(timInputPower.timInputVector(1, 0, 500), { x: 1, y: 0 }, 'Tim controls stay normal before activation');
  timInputPower.activateTimInputPower(1000);
  assert.equal(timInputPower.timPowerVisualState(999), null);
  assert.equal(timInputPower.timPowerVisualState(1000).intensity, 0, 'the scene opens smoothly rather than flashing');
  assert.equal(timInputPower.timInputPowerSecondsLeft(1000), 10);
  assert.deepEqual(timInputPower.timInputVector(1, 0, 1000), { x: -1, y: 0 });
  assert.deepEqual(timInputPower.timInputVector(-1, 1, 1000), { x: 1, y: -1 }, 'keyboard and d-pad diagonals both reverse');
  const diagonalIntent = timInputPower.timPowerVisualState(1300);
  assert.ok(Math.abs(diagonalIntent.intentX + Math.SQRT1_2) < 1e-9);
  assert.ok(Math.abs(diagonalIntent.intentY - Math.SQRT1_2) < 1e-9);
  assert.equal(diagonalIntent.intensity, 1, 'the world currents follow the normalized attempted direction');
  assert.deepEqual(timInputPower.timInputVector(0, 0, 1000), { x: 0, y: 0 });
  timInputPower.updateTimInputWorld(1000, 100, 100);
  assert.equal(timInputPower.getTimInputSteps(1000).length, 0);
  timInputPower.updateTimInputWorld(1050, 110, 100);
  assert.deepEqual(timInputPower.getTimInputSteps(1050), [{ x: 110, y: 100, at: 1050, reverse: true }]);
  timInputPower.updateTimInputWorld(1100, 111, 100);
  assert.equal(timInputPower.getTimInputSteps(1100).length, 1, 'stationary frames do not fill the floor with tracks');
  timInputPower.updateTimInputWorld(2000, 120, 100);
  assert.equal(timInputPower.getTimInputSteps(2000).at(-1).reverse, false);
  assert.ok(timInputPower.timInputPowerSecondsLeft(10999) > 0);
  assert.equal(timInputPower.timInputPowerSecondsLeft(11000), 0);
  assert.deepEqual(timInputPower.timInputVector(1, 0, 11000), { x: 1, y: 0 }, 'movement resets exactly at ten seconds');
  assert.deepEqual(timInputPower.getTimInputSteps(11000), []);
  assert.equal(timInputPower.timPowerVisualState(11000), null, 'body and landscape effects stop at the controls deadline');
  timInputPower.updateTimInputWorld(11000, 120, 100);
  timInputPower.activateTimInputPower(12000);
  assert.equal(timInputPower.getTimInputSteps(12000).length, 0, 'a second use starts with a clean trail');
  assert.equal(timInputPower.timPowerVisualState(12500).intentX, 0, 'a second use does not inherit an earlier direction');
  assert.match(timInputPower.timInputPowerReveal(), /opposite/);
  console.log('Tim power: reversed movement vectors, diagonal controls, floor trails, ten-second reset and reactivation passed');

  const oscarPower = await loadModule('oscar-power', 'js/oscar-power.ts');
  oscarPower.activateOscarPower(1000);
  assert.equal(oscarPower.oscarPowerSecondsLeft(1000), 10);
  assert.equal(oscarPower.oscarMovementMultiplier(1000), 1.35);
  oscarPower.updateOscarPower(1000, 100, 100, [
    { id: 'nearby-friend', x: 140, y: 100, height: 40 },
    { id: 'too-far-away', x: 300, y: 100, height: 40 },
  ]);
  assert.equal(oscarPower.isOscarEaten('nearby-friend', 1000), true);
  assert.equal(oscarPower.isOscarEaten('too-far-away', 1000), false);
  assert.ok(Math.abs(oscarPower.oscarMovementMultiplier(1000) - 1.405) < 1e-9);
  assert.equal(oscarPower.isOscarEaten('nearby-friend', 11000), false);
  assert.equal(oscarPower.oscarPowerSecondsLeft(11000), 0);
  assert.equal(oscarPower.oscarPowerSecondsLeft(999), 0, 'the clock remains inactive before activation');
  oscarPower.activateOscarPower(12000);
  const hungryPlayer = { x: 100, y: 100 };
  const wallBlocks = (x) => x > 120;
  oscarPower.settleOscarDigestion(hungryPlayer, wallBlocks, 12000);
  oscarPower.updateOscarPower(12000, 100, 100, [], 'right');
  assert.equal(oscarPower.isOscarTerrainEaten(140, 100, 12000), true, 'a bite opens terrain in the actual facing direction');
  assert.equal(oscarPower.isOscarTerrainEaten(200, 100, 12000), false, 'uneaten obstacles keep collision');
  assert.ok(oscarPower.oscarGrowth(12000) > 1);
  hungryPlayer.x = 140;
  oscarPower.settleOscarDigestion(hungryPlayer, wallBlocks, 13000);
  oscarPower.settleOscarDigestion(hungryPlayer, wallBlocks, 22000);
  assert.deepEqual(hungryPlayer, { x: 100, y: 100 }, 'restored scenery cannot strand the player inside a wall');
  assert.equal(oscarPower.isOscarTerrainEaten(140, 100, 22000), false);
  assert.equal(oscarPower.oscarGrowth(22000), 1);
  assert.equal(oscarPower.oscarMovementMultiplier(22000), 1);
  oscarPower.updateOscarPower(22000, 100, 100, []);
  assert.equal(oscarPower.getOscarBites().length, 0);
  assert.equal(oscarPower.getOscarMeals().length, 0);
  oscarPower.activateOscarPower(23000);
  hungryPlayer.x = 110;
  oscarPower.settleOscarDigestion(hungryPlayer, wallBlocks, 23000);
  hungryPlayer.x = 115;
  oscarPower.settleOscarDigestion(hungryPlayer, wallBlocks, 33000);
  assert.equal(hungryPlayer.x, 115, 'safe end positions are preserved');
  console.log('Oscar power: terrain eating, bounded collision changes, growth, safe restoration and exact expiry passed');

  const reiPower = await loadModule('rei-power', 'js/rei-power.ts');
  assert.equal(reiPower.reiMovementMultiplier(500), 1);
  assert.equal(reiPower.reiWorldDeltaTime(0.05, 500), 0.05);
  reiPower.activateReiPower('slow', 1000);
  assert.equal(reiPower.reiPowerSecondsLeft('slow', 1000), 10);
  assert.equal(reiPower.isReiEffectActive('slow', 999), false);
  assert.equal(reiPower.reiMovementMultiplier(1000), 0.5);
  assert.ok(Math.abs(reiPower.reiWorldDeltaTime(0.05, 1025) - 0.0375) < 1e-9);
  assert.equal(reiPower.reiWorldDeltaTime(0.05, 5000), 0.025);
  assert.ok(Math.abs(reiPower.reiWorldDeltaTime(0.05, 11025) - 0.0375) < 1e-9);
  assert.equal(reiPower.reiWorldDeltaTime(0.05, 11050), 0.05);
  const reiTargets = [{ id: 'friend', x: 150, y: 100, height: 40 }, { id: 'far', x: 2000, y: 100, height: 40 }];
  reiPower.updateReiWorld(1000, 100, 100, reiTargets);
  assert.equal(reiPower.isReiGuest('slow', 'friend'), false);
  reiPower.updateReiWorld(1500, 120, 100, reiTargets);
  assert.equal(reiPower.isReiGuest('slow', 'friend'), true);
  assert.equal(reiPower.isReiGuest('slow', 'far'), false);
  assert.deepEqual(reiPower.getReiOrigin('slow'), { x: 100, y: 100 });
  assert.ok(reiPower.getReiTrails('slow').length > 1);
  reiPower.activateReiPower('sparkle', 4000);
  assert.equal(reiPower.reiPowerSecondsLeft('slow', 4000), 7, 'the second item leaves the first timer intact');
  assert.equal(reiPower.reiPowerSecondsLeft('sparkle', 4000), 10);
  reiPower.updateReiWorld(4000, 120, 100, reiTargets);
  reiPower.updateReiWorld(4500, 140, 100, [{ id: 'friend', x: 160, y: 100, height: 40 }]);
  assert.equal(reiPower.isReiGuest('sparkle', 'friend'), true);
  assert.equal(reiPower.getReiGuests('slow')[0].x, 160, 'real moving NPC coordinates are refreshed');
  assert.ok(reiPower.getReiTrails('slow').every((point) => 4500 - point.at < 3000));
  reiPower.updateReiWorld(4600, 150, 100, []);
  assert.equal(reiPower.getReiGuests('slow').length, 0, 'removed NPCs leave both effects');
  assert.equal(reiPower.getReiGuests('sparkle').length, 0);
  reiPower.updateReiWorld(11000, 160, 100, reiTargets);
  assert.equal(reiPower.isReiEffectActive('slow', 11000), false);
  assert.equal(reiPower.reiMovementMultiplier(11000), 1, 'sparkle does not slow movement');
  assert.equal(reiPower.isReiEffectActive('sparkle', 11000), true);
  assert.equal(reiPower.getReiTrails('slow').length, 0);
  assert.equal(reiPower.getReiGuests('slow').length, 0);
  assert.ok(reiPower.getReiTrails('sparkle').length > 0, 'expiring the first effect preserves the second');
  reiPower.updateReiWorld(14000, 160, 100, reiTargets);
  assert.equal(reiPower.isReiPowerActive(14000), false);
  assert.equal(reiPower.getReiTrails('sparkle').length, 0);
  assert.equal(reiPower.getReiGuests('sparkle').length, 0);
  reiPower.activateReiPower('sparkle', 15000);
  assert.equal(reiPower.reiMovementMultiplier(15000), 1);
  assert.equal(reiPower.reiWorldDeltaTime(0.05, 15025), 0.05);
  assert.equal(reiPower.getReiTrails('sparkle').length, 0, 'reactivation starts clean');
  console.log('Rei powers: exact ten-second timers, half-speed movement/world, independent overlap, real NPC propagation, trails and cleanup passed');

  const andyPower = await loadModule('andy-power', 'js/andy-power.ts');
  andyPower.activateAndyPower(1000);
  assert.equal(andyPower.andyPowerSecondsLeft(1000), 10);
  assert.equal(andyPower.isAndyPowerActive(10999), true);
  assert.equal(andyPower.isAndyPowerActive(11000), false);
  assert.equal(andyPower.andyMovementMultiplier(999), 1);
  assert.equal(andyPower.andyMovementMultiplier(1000), 1.7);
  assert.equal(andyPower.andyMovementMultiplier(11000), 1);
  assert.ok(Math.abs(andyPower.andyWorldDeltaTime(0.05, 1050) - 0.015) < 1e-9);
  assert.ok(Math.abs(andyPower.andyWorldDeltaTime(0.05, 1025) - 0.0325) < 1e-9);
  assert.ok(Math.abs(andyPower.andyWorldDeltaTime(0.05, 11025) - 0.0325) < 1e-9);
  assert.equal(andyPower.andyWorldDeltaTime(0.05, 11050), 0.05);
  const firstAndyReply = andyPower.createAndyReply('Me and Max would of gone.');
  assert.match(firstAndyReply, /Max and I would have gone/);
  assert.match(firstAndyReply, /Simon de Montfort/);
  assert.match(firstAndyReply, /Those were some weird cashews!/);
  assert.match(andyPower.createAndyReply('That was quite a sentence.'), /Simon de Montfort/);
  assert.match(andyPower.createAndyReply('Another perfectly ordinary sentence.'), /Louis the Pious/);

  const bochraPower = await loadModule('bochra-power', 'js/bochra-power.ts');
  assert.equal(bochraPower.bochraPowerSecondsLeft(0), 0);
  bochraPower.activateBochraPower(1000);
  assert.equal(bochraPower.bochraPowerSecondsLeft(1000), 10);
  assert.equal(bochraPower.isBochraPowerActive(999), false);
  assert.equal(bochraPower.isBochraPowerActive(10999), true);
  assert.equal(bochraPower.isBochraPowerActive(11000), false);
  bochraPower.updateBochraWorld(1000, 100, 100, [{ id: 'friend', x: 130, y: 100, height: 52 }]);
  assert.equal(bochraPower.getBochraStage().moving, false);
  assert.equal(bochraPower.bochraDancePose('player', 1000).stretch, 1);
  bochraPower.updateBochraWorld(1125, 110, 100, [{ id: 'friend', x: 130, y: 100, height: 52 }]);
  assert.equal(bochraPower.getBochraStage().moving, true);
  assert.notEqual(bochraPower.bochraDancePose('player', 1125).rotation, 0);
  assert.notEqual(bochraPower.bochraDancePose('friend', 1125).rotation, 0);
  assert.equal(bochraPower.bochraDancePose('distant', 1125).rotation, 0);
  assert.equal(bochraPower.getBochraSteps().length, 1);
  assert.ok(bochraPower.bochraMovementMultiplier(1125) > 1);
  bochraPower.updateBochraWorld(1200, 110, 100, []);
  assert.equal(bochraPower.getBochraStage().moving, false);
  assert.equal(bochraPower.bochraDancePose('player', 1200).rotation, 0);
  bochraPower.updateBochraWorld(11000, 120, 100, []);
  assert.equal(bochraPower.getBochraSteps().length, 0);
  assert.equal(bochraPower.getBochraDancers().length, 0);
  assert.equal(bochraPower.bochraMovementMultiplier(11000), 1);
  assert.equal(bochraPower.bochraPowerSecondsLeft(11000), 0);
  bochraPower.activateBochraPower(12000);
  assert.equal(bochraPower.getBochraSteps().length, 0);
  assert.equal(bochraPower.bochraPowerSecondsLeft(12000), 10);
  console.log('Bochra power: duration, movement, idle, NPCs, expiry and reactivation passed');

  const chrisPower = await loadModule('chris-power', 'js/chris-power.ts');
  assert.equal(chrisPower.chrisPowerSecondsLeft(0), 0);
  chrisPower.activateChrisPower(1000);
  assert.equal(chrisPower.chrisPowerSecondsLeft(1000), 10);
  assert.equal(chrisPower.isChrisPowerActive(999), false);
  assert.equal(chrisPower.isChrisPowerActive(10999), true);
  assert.equal(chrisPower.isChrisPowerActive(11000), false);
  assert.equal(chrisPower.chrisMovementMultiplier(1000), 1.5);
  assert.equal(chrisPower.chrisWorldDeltaTime(0.05, 1050), 0);
  assert.ok(Math.abs(chrisPower.chrisWorldDeltaTime(0.05, 1025) - 0.025) < 1e-9);
  assert.ok(Math.abs(chrisPower.chrisWorldDeltaTime(0.05, 11025) - 0.025) < 1e-9);
  const chrisTargets = [
    { id: 'near', x: 170, y: 76, height: 52 },
    { id: 'far', x: 1600, y: 76, height: 52 },
  ];
  chrisPower.updateChrisWorld(1000, 100, 100, chrisTargets);
  assert.equal(chrisPower.getChrisListeners().length, 0);
  chrisPower.updateChrisWorld(1100, 100, 100, chrisTargets);
  assert.equal(chrisPower.getChrisListeners().length, 1);
  assert.equal(chrisPower.getChrisListeners()[0].id, 'near');
  assert.notEqual(chrisPower.chrisAudienceLean('near', 1100), 0);
  assert.equal(chrisPower.chrisAudienceLean('far', 1100), 0);
  chrisPower.updateChrisWorld(3200, 100, 100, chrisTargets);
  assert.equal(chrisPower.getChrisListeners().length, 2, 'voice reaches the far side of the world');
  chrisPower.updateChrisWorld(3400, 100, 100, []);
  assert.equal(chrisPower.getChrisListeners().length, 0, 'removed NPCs leave the audience');
  chrisPower.updateChrisWorld(11000, 100, 100, chrisTargets);
  assert.equal(chrisPower.getChrisWaves().length, 0);
  assert.equal(chrisPower.chrisAudienceLean('near', 11000), 0);
  assert.equal(chrisPower.chrisMovementMultiplier(11000), 1);
  assert.equal(chrisPower.chrisWorldDeltaTime(0.05, 11050), 0.05);
  chrisPower.activateChrisPower(12000);
  assert.equal(chrisPower.getChrisListeners().length, 0);
  assert.equal(chrisPower.chrisPowerSecondsLeft(12000), 10);
  console.log('Chris power: ten-second duration, propagation, audience, movement and cleanup passed');

  const danPower = await loadModule('dan-power', 'js/dan-power.ts');
  assert.equal(danPower.isDanPowerActive(0), false);
  danPower.activateDanPower(1000);
  assert.equal(danPower.danPowerSecondsLeft(1000), 10);
  assert.equal(danPower.isDanPowerActive(999), false);
  assert.equal(danPower.isDanPowerActive(10999), true);
  assert.equal(danPower.isDanPowerActive(11000), false);
  assert.ok(Math.abs(danPower.danWorldDeltaTime(0.05, 1050) - 0.15) < 1e-9);
  assert.ok(Math.abs(danPower.danWorldDeltaTime(0.05, 1025) - 0.1) < 1e-9);
  assert.ok(Math.abs(danPower.danWorldDeltaTime(0.05, 11025) - 0.1) < 1e-9);
  assert.equal(danPower.danWorldDeltaTime(0.05, 11050), 0.05);
  danPower.updateDanWorld(1200, 100, 100, [
    { id: 'near', x: 200, y: 100, height: 52 },
    { id: 'far', x: 1000, y: 100, height: 52 },
  ]);
  assert.equal(danPower.getDanRavers().length, 1);
  assert.equal(danPower.getDanRavers()[0].id, 'near');
  assert.notEqual(danPower.danRiotPose('near', 1200).bounce, 0);
  assert.deepEqual(danPower.danRiotPose('far', 1200), { rotation: 0, bounce: 0 });
  assert.equal(danPower.danRiotPose('player', 1200).bounce, 0, 'the incapacitated wearer stays rooted');
  assert.deepEqual(danPower.danRiotPose('near', 11000), { rotation: 0, bounce: 0 });
  danPower.updateDanWorld(11000, 100, 100, []);
  assert.equal(danPower.getDanRavers().length, 0);
  danPower.activateDanPower(12000);
  assert.equal(danPower.danPowerSecondsLeft(12000), 10);
  assert.equal(danPower.getDanRavers().length, 0);
  console.log('Dan power: duration, world speed, audience bounds, expiry and reactivation passed');

  const georgiaPower = await loadModule('georgia-power', 'js/georgia-power.ts');
  const flightBounds = { minX: 0, minY: 0, maxX: 1000, maxY: 1000 };
  const flightPosition = { x: 100, y: 100 };
  const flightObstacle = (x, y) => x >= 200 && x <= 500 && y >= 50 && y <= 200;
  georgiaPower.activateGeorgiaPower(1000);
  assert.equal(georgiaPower.georgiaPowerSecondsLeft(1000), 10);
  assert.equal(georgiaPower.isGeorgiaPowerActive(999), false);
  assert.equal(georgiaPower.isGeorgiaPowerActive(10999), true);
  assert.equal(georgiaPower.isGeorgiaPowerActive(11000), false);
  georgiaPower.settleGeorgiaFlight(flightPosition, flightObstacle, flightBounds, 1000);
  for (let frame = 1; frame <= 16; frame++) georgiaPower.moveGeorgiaFlight(flightPosition, 1, 0, 185, 0.05, flightBounds, 1000 + frame * 50);
  assert.ok(flightObstacle(flightPosition.x, flightPosition.y), 'flight crosses a ground obstacle');
  const beforeGlide = flightPosition.x;
  georgiaPower.moveGeorgiaFlight(flightPosition, 0, 0, 185, 0.05, flightBounds, 2050);
  assert.ok(flightPosition.x > beforeGlide, 'releasing input produces a short, controlled glide');
  georgiaPower.updateGeorgiaWorld(2100, flightPosition.x, flightPosition.y, [
    { id: 'near', x: 200, y: 100, height: 52 }, { id: 'far', x: 1500, y: 100, height: 52 },
  ]);
  assert.equal(georgiaPower.getGeorgiaPassengers().length, 1);
  assert.ok(georgiaPower.georgiaFlightPose('player', 2100).lift > 0);
  assert.ok(georgiaPower.georgiaFlightPose('near', 2100).lift > 0);
  assert.equal(georgiaPower.georgiaFlightPose('far', 2100).lift, 0);
  georgiaPower.settleGeorgiaFlight(flightPosition, flightObstacle, flightBounds, 11000);
  assert.equal(flightObstacle(flightPosition.x, flightPosition.y), false, 'expiry lands on clear ground');
  assert.equal(georgiaPower.getGeorgiaPassengers().length, 0);
  assert.equal(georgiaPower.getGeorgiaThreads().length, 0);
  assert.equal(georgiaPower.georgiaFlightPose('player', 11000).lift, 0);
  const landed = { ...flightPosition };
  georgiaPower.moveGeorgiaFlight(flightPosition, 1, 1, 185, 1, flightBounds, 11000);
  assert.deepEqual(flightPosition, landed, 'expired flight cannot move the player');
  georgiaPower.activateGeorgiaPower(12000);
  georgiaPower.settleGeorgiaFlight(flightPosition, () => false, flightBounds, 12000);
  georgiaPower.moveGeorgiaFlight(flightPosition, 1, 1, 185, 10, flightBounds, 12500);
  assert.equal(flightPosition.x, flightBounds.maxX);
  assert.equal(flightPosition.y, flightBounds.maxY);
  georgiaPower.settleGeorgiaFlight(flightPosition, (x, y) => x >= 160 || y >= 160, flightBounds, 22000);
  assert.ok(flightPosition.x < 160 && flightPosition.y < 160, 'a large blocked area uses the full-scene landing fallback');
  console.log('Georgia power: ten-second duration, obstacle flight, glide, world passengers, bounds and safe landing passed');

  const helenPower = await loadModule('helen-power', 'js/helen-power.ts');
  helenPower.activateHelenPower(1000);
  assert.equal(helenPower.helenPowerSecondsLeft(1000), 10);
  assert.equal(helenPower.helenMovementMultiplier(999), 1);
  assert.equal(helenPower.helenMovementMultiplier(1000), 0.5);
  assert.equal(helenPower.helenCharacterPose('player', 1000).width, 1.5);
  assert.equal(helenPower.helenMovementMultiplier(10999), 0.5);
  assert.equal(helenPower.helenMovementMultiplier(11000), 1);
  assert.equal(helenPower.helenCharacterPose('player', 11000).width, 1);
  assert.ok(Math.abs(helenPower.helenWorldDeltaTime(0.05, 1025) - 0.0375) < 1e-9);
  assert.equal(helenPower.helenWorldDeltaTime(0.05, 2000), 0.025);
  assert.ok(Math.abs(helenPower.helenWorldDeltaTime(0.05, 11025) - 0.0375) < 1e-9);
  const helenTargets = [{ id: 'near', x: 200, y: 100, height: 52 }, { id: 'far', x: 1000, y: 100, height: 52 }];
  helenPower.updateHelenWorld(1000, 100, 100, helenTargets);
  assert.equal(helenPower.getHelenNeighbours().length, 0, 'pressure has not reached other characters yet');
  helenPower.updateHelenWorld(1500, 110, 100, helenTargets);
  assert.equal(helenPower.getHelenNeighbours().length, 1);
  assert.equal(helenPower.getHelenSteps().length, 1, 'moving creates a heavy footprint');
  helenPower.updateHelenWorld(1950, 110, 100, helenTargets);
  assert.equal(helenPower.helenCharacterPose('near', 1950).width, 1.5);
  assert.equal(helenPower.helenCharacterPose('far', 1950).width, 1);
  assert.equal(helenPower.getHelenSteps().length, 1, 'standing still does not spawn footsteps');
  helenPower.updateHelenWorld(3000, 110, 100, helenTargets);
  assert.equal(helenPower.getHelenNeighbours().length, 2, 'the pressure wave spreads across the world');
  helenPower.updateHelenWorld(3200, 110, 100, []);
  assert.equal(helenPower.getHelenNeighbours().length, 0, 'removed characters leave the effect');
  helenPower.updateHelenWorld(11000, 110, 100, helenTargets);
  assert.equal(helenPower.getHelenSteps().length, 0);
  assert.equal(helenPower.getHelenWaves().length, 0);
  assert.equal(helenPower.helenWorldDeltaTime(0.05, 11050), 0.05);
  helenPower.activateHelenPower(12000);
  assert.equal(helenPower.helenPowerSecondsLeft(12000), 10);
  assert.equal(helenPower.getHelenNeighbours().length, 0);
  console.log('Helen power: duration, player changes, world propagation, idle, expiry and reactivation passed');

  const juPower = await loadModule('ju-power', 'js/ju-power.ts');
  juPower.activateJuPower(1000);
  assert.equal(juPower.juPowerSecondsLeft(1000), 10);
  assert.equal(juPower.isJuPowerActive(999), false);
  assert.equal(juPower.juMovementMultiplier(1000), 1.65);
  assert.deepEqual(juPower.juInputVector(1, -1, 2699), { x: 1, y: -1 });
  assert.deepEqual(juPower.juInputVector(1, -1, 2700), { x: -1, y: 1 });
  assert.equal(juPower.juMovementMultiplier(2700), 0.65);
  assert.deepEqual(juPower.juInputVector(1, -1, 3400), { x: 1, y: -1 });
  assert.ok(Math.abs(juPower.juWorldDeltaTime(0.05, 2725) - 0.03) < 1e-9, 'a frame entering possession only slows its overlap');
  assert.ok(Math.abs(juPower.juWorldDeltaTime(0.05, 3425) - 0.03) < 1e-9, 'a frame leaving possession restores ordinary world time');
  assert.ok(Math.abs(juPower.juWorldDeltaTime(10, 11000) - 7.76) < 1e-9, 'all four possession windows are integrated across a delayed frame');
  const juTargets = [{ id: 'near', x: 200, y: 100, height: 52 }, { id: 'far', x: 1500, y: 100, height: 52 }];
  juPower.updateJuWorld(1000, 100, 100, juTargets);
  assert.equal(juPower.getJuRevellers().length, 0);
  const firstShadow = { ...juPower.getJuShadow() };
  juPower.updateJuWorld(1500, 110, 100, juTargets);
  assert.equal(juPower.getJuRevellers().length, 1);
  assert.equal(juPower.getJuSteps().length, 1);
  assert.ok(Math.hypot(juPower.getJuShadow().x - firstShadow.x, juPower.getJuShadow().y - firstShadow.y) <= 2.75 + 1e-9, 'shadow pursuit cannot teleport after a delayed frame');
  juPower.updateJuWorld(1700, 110, 100, juTargets);
  assert.equal(juPower.getJuSteps().length, 1, 'idle players do not emit moving footprints');
  assert.ok(juPower.juCharacterPose('near', 1900).lift > 0);
  assert.equal(juPower.juCharacterPose('far', 1900).lift, 0);
  juPower.updateJuWorld(4150, 110, 100, juTargets);
  assert.equal(juPower.getJuRevellers().length, 2, 'the procession spreads with the travelling pulses');
  juPower.updateJuWorld(4300, 110, 100, []);
  assert.equal(juPower.getJuRevellers().length, 0);
  assert.equal(juPower.isJuPowerActive(10999), true);
  juPower.updateJuWorld(11000, 110, 100, juTargets);
  assert.equal(juPower.isJuPowerActive(11000), false);
  assert.equal(juPower.juMovementMultiplier(11000), 1);
  assert.deepEqual(juPower.juInputVector(1, -1, 11000), { x: 1, y: -1 });
  assert.deepEqual(juPower.juCharacterPose('player', 11000), { x: 0, lift: 0, lean: 0 });
  assert.equal(juPower.getJuPulses().length, 0);
  assert.equal(juPower.getJuSteps().length, 0);
  assert.equal(juPower.juWorldDeltaTime(0.05, 11050), 0.05);
  juPower.activateJuPower(12000);
  assert.equal(juPower.juPowerSecondsLeft(12000), 10);
  assert.equal(juPower.getJuRevellers().length, 0);
  console.log('Ju power: duration, possessions, movement, world timing, propagation, shadow pursuit and cleanup passed');

  const julianPower = await loadModule('julian-power', 'js/julian-power.ts');
  const julianTargets = [{ id: 'far', x: 300, y: 100, height: 48 }, { id: 'tim', x: 50, y: 50, height: 48 }];
  julianPower.activateJulianPower(1000);
  julianPower.updateJulianWorld(1000, 100, 100, julianTargets);
  assert.equal(julianPower.chooseJulianBargain('execution', 1699), false, 'no bargain before the demon emerges');
  assert.equal(julianPower.isJulianDemonPresent(1700), true);
  assert.equal(julianPower.julianDemonSecondsLeft(1700), 6.66);
  assert.equal(julianPower.julianNearestTarget().id, 'tim', 'target selection uses distance rather than list order');
  assert.equal(julianPower.chooseJulianBargain('execution', 1700), true);
  assert.equal(julianPower.chooseJulianBargain('answer', 1800), false, 'an execution spends the single bargain');
  assert.equal(julianPower.isJulianExecuted('tim', 1800), true);
  assert.equal(julianPower.isJulianExecuted('far', 1800), false);
  assert.equal(julianPower.isJulianDemonPresent(8359), true);
  assert.equal(julianPower.isJulianDemonPresent(8360), false, 'demon departs after exactly 6.66 seconds');
  assert.equal(julianPower.isJulianPowerActive(10999), true);
  assert.equal(julianPower.isJulianExecuted('tim', 11000), false, 'execution restores the NPC at ten seconds');
  assert.equal(julianPower.julianMovementMultiplier(10999), 1.8);
  assert.equal(julianPower.julianMovementMultiplier(11000), 1);
  assert.ok(Math.abs(julianPower.julianWorldDeltaTime(0.05, 1025) - 0.027) < 1e-9, 'only active overlap slows an entering frame');
  assert.ok(Math.abs(julianPower.julianWorldDeltaTime(0.05, 11025) - 0.027) < 1e-9, 'world timing recovers across an expiry frame');
  julianPower.activateJulianPower(12000);
  julianPower.updateJulianWorld(12000, 100, 100, julianTargets);
  assert.equal(julianPower.chooseJulianBargain('answer', 12700), true);
  assert.match(julianPower.getJulianVerdict(), /Tim is north-west, 71 steps/);
  assert.equal(julianPower.chooseJulianBargain('execution', 12800), false, 'an answer prevents an execution');
  assert.equal(julianPower.isJulianExecuted('tim', 12800), false);
  julianPower.activateJulianPower(23000);
  julianPower.updateJulianWorld(30360, 100, 100, julianTargets);
  assert.equal(julianPower.getJulianChoice(), 'answer', 'a missed choice still gives one answer');
  assert.equal(julianPower.chooseJulianBargain('execution', 30360), false, 'late input is rejected');
  julianPower.activateJulianPower(34000);
  julianPower.updateJulianWorld(34700, 100, 100, []);
  assert.equal(julianPower.chooseJulianBargain('execution', 34700), false, 'empty rooms cannot execute a phantom target');
  assert.equal(julianPower.chooseJulianBargain('answer', 34700), true);
  assert.match(julianPower.getJulianVerdict(), /No other character/);
  console.log('Julian power: duration, exclusive bargains, oracle, target restoration and time boundaries pass');

  const katiePower = await loadModule('katie-power', 'js/katie-power.ts');
  const katieTargets = [{ id: 'near', x: 200, y: 100, height: 52 }, { id: 'far', x: 1800, y: 100, height: 52 }];
  katiePower.activateKatiePower(1000);
  assert.equal(katiePower.isKatiePowerActive(999), false);
  assert.equal(katiePower.katiePowerSecondsLeft(1000), 10, 'the requested ten seconds overrides the item description duration');
  katiePower.updateKatieWorld(2000, 100, 100, katieTargets);
  assert.equal(katiePower.getKatieRings().length, 0);
  assert.equal(katiePower.getKatieNeighbours().length, 0, 'characters react only after smoke reaches them');
  katiePower.updateKatieWorld(2600, 100, 100, katieTargets);
  assert.equal(katiePower.getKatieRings().length, 1);
  assert.equal(katiePower.getKatieNeighbours().length, 1);
  assert.ok(katiePower.katieCharacterPose('near', 2900).x > 0, 'a reached character recoils away from the stationary player');
  assert.deepEqual(katiePower.katieCharacterPose('far', 2900), { x: 0, y: 0, lean: 0 });
  assert.equal(katiePower.katieCigaretteRemaining(6000), 0.5, 'the cigarette burns down on real time');
  katiePower.updateKatieWorld(8000, 100, 100, katieTargets);
  assert.equal(katiePower.getKatieRings().length, 3, 'delayed frames catch up breaths without dropping them');
  assert.equal(katiePower.getKatieNeighbours().length, 2, 'the expanding smoke eventually reaches distant characters');
  katiePower.updateKatieWorld(8500, 100, 100, [katieTargets[0]]);
  assert.equal(katiePower.getKatieNeighbours().length, 1, 'removed characters do not leave phantom coughs');
  assert.ok(Math.abs(katiePower.katieWorldDeltaTime(0.05, 1025) - 0.028) < 1e-9, 'an entering frame slows only its active overlap');
  assert.ok(Math.abs(katiePower.katieWorldDeltaTime(0.05, 11025) - 0.028) < 1e-9, 'world time returns across the ending frame');
  assert.equal(katiePower.isKatiePowerActive(10999), true);
  katiePower.updateKatieWorld(11000, 100, 100, katieTargets);
  assert.equal(katiePower.isKatiePowerActive(11000), false);
  assert.equal(katiePower.getKatieRings().length, 0);
  assert.equal(katiePower.getKatieNeighbours().length, 0);
  assert.deepEqual(katiePower.katieCharacterPose('near', 11000), { x: 0, y: 0, lean: 0 });
  assert.equal(katiePower.katieWorldDeltaTime(0.05, 11050), 0.05);
  katiePower.activateKatiePower(12000);
  assert.equal(katiePower.getKatieRings().length, 0);
  assert.equal(katiePower.katiePowerSecondsLeft(12000), 10);
  console.log('Katie power: ten-second duration, smoke propagation, delayed frames, NPC reactions, world time and cleanup passed');

  values.set('max-game:player-health', '50');
  const lucyPower = await loadModule('lucy-power', 'js/lucy-power.ts');
  const lucyTargets = [
    { id: 'love', x: 110, y: 100, height: 50 },
    { id: 'puzzled', x: 120, y: 100, height: 50 },
    { id: 'splash', x: 130, y: 100, height: 50 },
  ];
  const lucyRolls = [0.49, 0.5, 0.75];
  lucyPower.activateLucyPower(1000, () => lucyRolls.shift() ?? 0.99);
  assert.equal(lucyPower.isLucyPowerActive(999), false);
  assert.equal(lucyPower.lucyPowerSecondsLeft(1000), 10);
  lucyPower.updateLucyWorld(1000, 100, 100, lucyTargets);
  assert.equal(lucyPower.getLucyGuests().length, 0, 'the wave has to reach actual characters');
  lucyPower.updateLucyWorld(2000, 100, 100, lucyTargets);
  assert.deepEqual(lucyPower.getLucyGuests().map((guest) => guest.reaction), ['delighted', 'puzzled', 'splattered']);
  assert.equal(lucyPower.lucyMovementMultiplier(2000), 0.5, 'burst sachets temporarily slow the player');
  assert.equal(lucyPower.lucyMovementMultiplier(3000), 1.5);
  assert.equal(lucyPower.lucyCleaningBalance(), 12, 'a real charge survives the spectacle');
  assert.equal(lucyPower.lucyHasEarnedCap(), true);
  lucyPower.updateLucyWorld(2100, 100, 100, []);
  lucyPower.updateLucyWorld(2200, 100, 100, lucyTargets);
  assert.equal(lucyPower.lucyCleaningBalance(), 12, 'a temporarily removed character cannot bill twice');
  lucyPower.updateLucyRecovery(2000, true);
  assert.equal(Number(values.get('max-game:player-health')), 54, 'food healing is boosted and the earned cap adds sunlight recovery');
  lucyPower.updateLucyRecovery(2000, true);
  assert.equal(Number(values.get('max-game:player-health')), 54, 'duplicate frame updates do not double-heal');
  const cake = lucyPower.getLucyPlates().find((plate) => !plate.savoury);
  lucyPower.updateLucyWorld(4000, cake.x, cake.y, []);
  assert.equal(lucyPower.lucyMovementMultiplier(4000), 0.5, 'inappropriate food halves movement rather than boosting it');
  lucyPower.updateLucyRecovery(4000, false);
  assert.equal(Number(values.get('max-game:player-health')), 56, 'inappropriate food halves nourishment and indoor caps cannot charge');
  lucyPower.updateLucyRecovery(12000, false);
  assert.equal(Number(values.get('max-game:player-health')), 63, 'late frames credit only the remaining seven active seconds');
  assert.equal(lucyPower.lucyMovementMultiplier(11000), 1);
  assert.deepEqual(lucyPower.lucyCharacterPose('love', 11000), { x: 0, y: 0, lean: 0, scale: 1 });
  lucyPower.updateLucyWorld(11000, 100, 100, lucyTargets);
  assert.equal(lucyPower.getLucyPlates().length, 0);
  assert.equal(lucyPower.getLucyGuests().length, 0);
  assert.equal(lucyPower.getLucyTrails().length, 0);
  assert.match(lucyPower.lucyPowerReveal(), /1 delighted, 1 puzzled, 1 splattered/);
  lucyPower.setLucyCapEquipped(true);
  lucyPower.updateLucyRecovery(13000, false);
  assert.equal(Number(values.get('max-game:player-health')), 63);
  lucyPower.updateLucyRecovery(13250, true);
  assert.equal(Number(values.get('max-game:player-health')), 63.25, 'a worn permanent reward charges outdoors after the picnic ends');
  lucyPower.setLucyCapEquipped(false);
  lucyPower.updateLucyRecovery(13500, true);
  assert.equal(Number(values.get('max-game:player-health')), 63.25);
  lucyPower.resetLucyRewards();
  assert.equal(lucyPower.lucyCleaningBalance(), 0);
  lucyPower.activateLucyPower(14000, () => 0.74);
  assert.equal(lucyPower.lucyHasEarnedCap(), false);
  lucyPower.updateLucyWorld(14000, 100, 100, []);
  lucyPower.updateLucyWorld(15000, 100, 100, [lucyTargets[0]]);
  assert.equal(lucyPower.getLucyGuests()[0].reaction, 'puzzled', 'the upper edge of the middle 25% remains puzzled');

  console.log('Lucy power: gift odds, food effects, recovery, charges, cap, reactivation and ten-second cleanup passed');

  const mikePower = await loadModule('mike-power', 'js/mike-power.ts');
  const mikeTargets = [{ id: 'near', x: 220, y: 100, height: 52 }, { id: 'far', x: 2000, y: 100, height: 52 }];
  mikePower.activateMikePower(1000);
  assert.equal(mikePower.isMikePowerActive(999), false);
  assert.equal(mikePower.mikePowerSecondsLeft(1000), 10);
  assert.equal(mikePower.mikeHappinessMultiplier(1000), 1.36);
  assert.equal(mikePower.mikeMovementMultiplier(1000), 1.36);
  mikePower.updateMikeWorld(1000, 100, 100, mikeTargets);
  assert.equal(mikePower.getMikeJoyGuests().length, 0);
  mikePower.updateMikeWorld(1500, 115, 100, mikeTargets);
  assert.equal(mikePower.isMikeTargetHappy('near', 1500), true, 'the happiness wave reaches real characters');
  assert.equal(mikePower.isMikeTargetHappy('far', 1500), false, 'unreached characters keep their normal behaviour');
  assert.ok(mikePower.mikeCharacterPose('near', 1500).y < 0, 'a reached character visibly dances');
  assert.deepEqual(mikePower.mikeCharacterPose('far', 1500), { x: 0, y: 0, lean: 0, scale: 1 });
  assert.equal(mikePower.getMikeOrigin().x, 100, 'the wave remains anchored while the player moves');
  assert.equal(mikePower.getMikeProtagonist().x, 115);
  assert.ok(mikePower.getMikeJoyTrails().length >= 2);
  mikePower.updateMikeWorld(2000, 130, 100, [{ ...mikeTargets[0], x: 250 }]);
  assert.equal(mikePower.getMikeJoyGuests()[0].x, 250, 'moving characters keep their live position');
  mikePower.updateMikeWorld(2100, 130, 100, []);
  assert.equal(mikePower.isMikeTargetHappy('near', 2100), false, 'removed characters cannot leave phantom reactions');
  assert.ok(Math.abs(mikePower.mikeWorldDeltaTime(0.05, 1025) - 0.059) < 1e-9, 'the entering frame accelerates only its active overlap');
  assert.ok(Math.abs(mikePower.mikeWorldDeltaTime(0.05, 11025) - 0.059) < 1e-9, 'the ending frame restores normal world time');
  assert.equal(mikePower.isMikePowerActive(10999), true);
  mikePower.updateMikeWorld(11000, 130, 100, mikeTargets);
  assert.equal(mikePower.isMikePowerActive(11000), false);
  assert.equal(mikePower.mikeHappinessMultiplier(11000), 1);
  assert.equal(mikePower.mikeMovementMultiplier(11000), 1);
  assert.equal(mikePower.mikeWorldDeltaTime(0.05, 11050), 0.05);
  assert.equal(mikePower.getMikeJoyGuests().length, 0);
  assert.equal(mikePower.getMikeJoyTrails().length, 0);
  assert.deepEqual(mikePower.mikeCharacterPose('player', 11000), { x: 0, y: 0, lean: 0, scale: 1 });
  mikePower.activateMikePower(12000);
  assert.equal(mikePower.mikePowerSecondsLeft(12000), 10);
  mikePower.updateMikeWorld(12000, 500, 500, []);
  assert.equal(mikePower.getMikeOrigin().x, 500);
  assert.equal(mikePower.getMikeJoyTrails().length, 1, 'reactivation starts a fresh garden');
  console.log('Mike power: exact happiness lift, movement, world time, propagation, trails, expiry and reactivation passed');

  window.dispatchEvent = () => {};
  const noelPower = await loadModule('noel-power', 'js/noel-power.ts');
  const noelIds = ['mike-item', 'katy-item', 'lucy-item', 'julian-item', 'tim-item', 'helen-item', 'niall-item', 'georgia-item', 'andy-item', 'rei-item'];
  values.set('max-game:inventory-gifts', JSON.stringify([...noelIds, 'noel-item', 'lucy-solar-cap', 'portable-walkman']));
  values.set('max-game:noel-asset-claim', '0');
  assert.equal(noelPower.activateNoelPower(1000), true);
  assert.equal(noelPower.isNoelPowerActive(999), false);
  assert.equal(noelPower.noelPowerSecondsLeft(1000), 10);
  assert.equal(noelPower.getNoelCollateral().length, 10, 'equipment, music unlocks and the used contract are not collateral');
  assert.equal(noelPower.activateNoelPower(1500), false, 'a second activation cannot cancel a debt already being assessed');
  noelPower.updateNoelAssessment(1999);
  assert.equal(noelPower.noelAssessment(), 0);
  noelPower.updateNoelAssessment(3000);
  assert.equal(noelPower.noelAssessment(), 0.2);
  noelPower.updateNoelAssessment(3000);
  assert.equal(noelPower.noelAssetClaim(), 0.2, 'repeated frames cannot assess the same instalment twice');
  noelPower.updateNoelWorld(1000, 100, 100, mikeTargets);
  noelPower.updateNoelWorld(2000, 150, 100, mikeTargets);
  assert.equal(noelPower.getNoelOrigin().x, 100);
  assert.equal(noelPower.getNoelProtagonist().x, 150);
  assert.equal(noelPower.getNoelAudience().length, 1);
  noelPower.updateNoelWorld(2500, 150, 100, [{ ...mikeTargets[0], x: 250 }]);
  assert.equal(noelPower.getNoelAudience()[0].x, 250);
  noelPower.updateNoelWorld(2600, 150, 100, []);
  assert.equal(noelPower.getNoelAudience().length, 0, 'removed characters leave no phantom audience');
  assert.ok(noelPower.noelMovementMultiplier(10999) < 0.901);
  noelPower.updateNoelAssessment(14000); // A delayed/background frame must settle the final instalments.
  assert.equal(noelPower.noelAssessment(), 1);
  assert.equal(noelPower.noelAssetClaim(), 0);
  let noelRemaining = JSON.parse(values.get('max-game:inventory-gifts'));
  assert.equal(noelRemaining.filter((id) => noelIds.includes(id)).length, 9, 'ten carried usable gifts lose exactly one');
  assert.ok(noelRemaining.includes('lucy-solar-cap') && noelRemaining.includes('portable-walkman'));
  assert.equal(noelPower.noelPowerSecondsLeft(11000), 0);
  assert.equal(noelPower.noelMovementMultiplier(11000), 1);
  assert.deepEqual(noelPower.noelCharacterPose('player', 11000), { x: 0, y: 0, lean: 0, scale: 1 });
  noelPower.updateNoelWorld(11000, 150, 100, mikeTargets);
  assert.equal(noelPower.getNoelReceipts().length, 0);
  assert.match(noelPower.noelPowerReveal(), /zero payoff/);
  noelPower.updateNoelAssessment(16000);
  assert.deepEqual(JSON.parse(values.get('max-game:inventory-gifts')), noelRemaining);
  values.set('max-game:inventory-gifts', JSON.stringify(['noel-item', 'adam-item', 'ed-item', 'lucy-solar-cap']));
  noelPower.activateNoelPower(20000);
  noelPower.updateNoelAssessment(30000);
  assert.equal(noelPower.noelAssetClaim(), 0.2, 'small collections retain an exact fractional claim instead of losing a whole gift');
  noelPower.activateNoelPower(31000);
  noelPower.updateNoelAssessment(41000);
  assert.equal(noelPower.noelAssessment(), 0.18, 'the next assessment uses unencumbered assets, not already pledged value');
  assert.equal(noelPower.noelAssetClaim(), 0.38);
  assert.equal(JSON.parse(values.get('max-game:inventory-gifts')).length, 4);
  values.set('max-game:inventory-gifts', '[]');
  noelPower.activateNoelPower(42000);
  noelPower.updateNoelAssessment(52000);
  assert.equal(noelPower.noelAssessment(), 0, 'an empty inventory does not create assets or substitute health damage');
  assert.equal(noelPower.noelAssetClaim(), 0.38);
  values.delete('max-game:noel-asset-claim');
  console.log('Noel power: exact asset assessment, fractional claims, repossession, protected unlocks, delayed settlement and ten-second cleanup passed');

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
      setAttribute() {}, removeAttribute(name) { if (name === 'src') this.src = ''; }, remove() {},
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
    querySelectorAll: () => [],
    querySelector: (selector) => selector.startsWith('script') ? null : element(selector),
    createElement: (tag) => element(`${tag}-${Math.random()}`),
  };
  window.location = { href: 'http://localhost/' };
  window.dispatchEvent = () => {};
  window.addEventListener = () => {};
  const scheduledCallbacks = [];
  window.setTimeout = (callback) => { scheduledCallbacks.push(callback); return scheduledCallbacks.length; };
  window.clearTimeout = () => {};
  Audio.prototype.removeAttribute = () => {};
  Audio.prototype.load = () => {};
  values.set('max-game:niall-quest-state', 'following');
  const niall = await loadModule('niall-bus-dialogue', 'js/niall.ts');
  niall.updateNiallInteraction(0, niall.NIALL_BUS_STOP.triggerX, niall.NIALL_BUS_STOP.triggerY);
  const niallNext = () => element('#niall-dialogue-next').listeners.get('click')();
  assert.equal(element('#niall-dialogue-line').textContent, 'Niall is rolling a cigarette');
  niallNext();
  assert.equal(element('#niall-dialogue-line').textContent, 'Kept you waiting huh?');
  niallNext();
  assert.equal(element('#niall-dialogue-line').textContent, "My pizza's are technically imperfect but free");
  assert.equal(niall.isNiallEncounterBlockingPlayer(), true, 'Niall keeps the player in the bus-stop conversation until the final line advances');
  niallNext();
  assert.equal(element('#niall-dialogue').hidden, true);
  assert.equal(niall.isNiallEncounterBlockingPlayer(), false);
  values.clear();
  console.log('Niall bus stop: arrival, wait and pizza lines play in sequence');
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
  assert.equal(element('#npc-dialogue-profile').src, 'chat/ed/profile.png');
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
  assert.equal(element('#npc-dialogue-profile').src, 'chat/alex s/profile.png');
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
  const profiles = await loadModule('profile-images', 'js/profile-images.ts');
  assert.equal(profiles.profileImageSource('adam'), null);
  assert.equal(profiles.profileImageSource('Bochra'), null, 'a missing root portrait is intentional');
  assert.equal(profiles.profileImageSource('ed'), 'chat/ed/profile.png');
  assert.equal(profiles.profileImageSource('Alex S'), 'chat/alex s/profile.png');
  assert.equal(profiles.profileImageSource('Helen'), 'chat/helen/profile.png');
  assert.equal(profiles.profileImageSource('marina d'), 'chat/marina d/profile.png');
  for (const source of Object.values((await loadModule('profile-sources', 'js/profile-images.generated.ts')).PROFILE_IMAGE_SOURCES)) {
    assert.match(source, /^chat\/[^/]+\/profile\.(?:png|jpe?g)$/i);
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
  assert.equal(element('#npc-dialogue-line').textContent, (await loadModule('rei-dialogue', 'js/rei-dialogue.ts')).REI_DIALOGUE_LINES[0]);
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
  assert.equal(element('#npc-dialogue-next').hidden, false, 'Rei can continue talking after her rewards');
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
  assert.equal(element('#npc-dialogue-next').hidden, false, 'Rei can continue talking after the song reward');
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
  values.set('max-game:inventory-gifts', '["marina-d-item-1", "marina-d-item-2"]');
  const inventoryGifts = await loadModule('inventory-gifts', 'js/inventory-gifts.ts');
  assert.deepEqual(inventoryGifts.getCollectedGifts(), []);
  assert.deepEqual(JSON.parse(values.get('max-game:inventory-gifts')), [], 'retired Marina D gifts are removed from existing saves');
  const approachMarina = () => npcs.updateNpcInteractions(npcs.MARINA_D.x, npcs.MARINA_D.y);
  leave(); approachMarina();
  assert.equal(element('#npc-dialogue-next').hidden, false, 'Marina D dialogue remains available');
  next();
  assert.deepEqual(JSON.parse(values.get('max-game:inventory-gifts')), [], 'Marina D no longer gives either item');

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

  for (const npc of [npcs.CHRIS]) {
    values.clear();
    leave(); npcs.updateNpcInteractions(npc.x, npc.y);
    assert.equal(element('#npc-dialogue-line').textContent, `Hi there I'm ${npc.name}. This is my first line.`);
    assert.equal(element('#npc-dialogue-profile').hidden, false);
    assert.match(element('#npc-dialogue-profile').src, new RegExp(`^chat/${npc.id}/profile\\.(png|jpg|jpeg)$`));
    next();
    assert.deepEqual(JSON.parse(values.get('max-game:inventory-gifts')), [`${npc.id}-item`]);
    assert.equal(element('#npc-dialogue-next').hidden, false, 'Chris continues his lines after the item reward');
    assert.equal(values.has('max-game:unlocked-songs'), false);
    next();
    assert.equal(element('#npc-dialogue-line').textContent, `Hi there I'm ${npc.name}. This is my second line.`);
    leave(); npcs.updateNpcInteractions(npc.x, npc.y);
    assert.equal(element('#npc-dialogue-line').textContent, `Hi there I'm ${npc.name}. This is my second line.`);
    next();
    assert.equal(element('#npc-dialogue-line').textContent, `Hi there I'm ${npc.name}. This is my third line.`);
    assert.deepEqual(JSON.parse(values.get('max-game:inventory-gifts')), [`${npc.id}-item`]);
    values.set('max-game:inventory-gifts', '[]');
    leave(); npcs.updateNpcInteractions(npc.x, npc.y); next();
    assert.deepEqual(JSON.parse(values.get('max-game:inventory-gifts')), [`${npc.id}-item`]);
  }

  // Alice finishes her greeting before the gift and event question.
  values.clear(); leave(); npcs.updateNpcInteractions(npcs.ALICE.x, npcs.ALICE.y);
  assert.equal(element('#npc-dialogue-profile').hidden, false);
  next(); next();
  assert.equal(values.has('max-game:inventory-gifts'), false);
  next();
  assert.deepEqual(JSON.parse(values.get('max-game:inventory-gifts')), ['alice-item']);
  next();
  assert.equal(element('#alice-dialogue-options').hidden, false);
  assert.equal(element('#npc-dialogue-next').hidden, true);

  leave(); npcs.updateNpcInteractions(npcs.BOCHRA.x, npcs.BOCHRA.y);
  assert.equal(element('#npc-dialogue-profile').hidden, true, 'Bochra has no root portrait');
  assert.equal(element('#npc-dialogue-profile').src, '', 'no fallback picture is used');

  console.log('All focused tests passed.');
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}
