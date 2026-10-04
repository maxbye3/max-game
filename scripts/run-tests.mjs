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

  // Alex offers his song after the rotating greeting, without an item.
  values.clear();
  const approachAlex = () => npcs.updateNpcInteractions(npcs.ALEX_S.x, npcs.ALEX_S.y);
  leave(); approachAlex();
  assert.equal(values.has('max-game:inventory-gifts'), false);
  next();
  assert.deepEqual(JSON.parse(values.get('max-game:unlocked-songs')), ['Africa']);
  assert.match(element('#npc-gift-confirmation').textContent, /Africa was added to your music playlist/);
  assert.equal(element('#npc-dialogue-next').hidden, true);
  // Song owned: later conversations keep cycling the dialogue.
  leave(); approachAlex(); next();
  assert.equal(values.has('max-game:inventory-gifts'), false);
  assert.deepEqual(JSON.parse(values.get('max-game:unlocked-songs')), ['Africa']);
  // An older save with other songs still receives Africa once.
  values.set('max-game:unlocked-songs', '["Outer wildeds"]');
  leave(); approachAlex(); next();
  assert.deepEqual(JSON.parse(values.get('max-game:unlocked-songs')), ['Outer wildeds', 'Africa']);
  assert.equal(element('#npc-dialogue-next').hidden, true);

  // Adam keeps his facts between the rotating greeting and inventory gift.
  values.clear();
  const approachAdam = () => npcs.updateNpcInteractions(npcs.ADAM.x, npcs.ADAM.y);
  leave(); approachAdam();
  assert.match(element('#npc-dialogue-line').textContent, /You\'re shorter than I was expecting/);
  assert.equal(element('#npc-dialogue-profile').hidden, true);
  const profiles = await loadModule('profile-images', 'js/profile-images.ts');
  assert.equal(profiles.profileImageSource('adam'), null);
  assert.equal(profiles.profileImageSource('ed'), 'chat/ed/profile.png');
  assert.equal(profiles.profileImageSource('Helen'), 'chat/helen/profile.jpg');
  assert.equal(profiles.profileImageSource('marina d'), null);
  for (const source of Object.values((await loadModule('profile-sources', 'js/profile-images.generated.ts')).PROFILE_IMAGE_SOURCES)) {
    assert.match(source, /^chat\/[^/]+\/profile\.(?:png|jpe?g)$/i);
  }
  next();
  assert.match(element('#npc-dialogue-line').textContent, /2006 Champions League final/);
  assert.equal(element('#npc-dialogue-next').hidden, false);
  next();
  assert.deepEqual(JSON.parse(values.get('max-game:inventory-gifts')), ['adam-item']);
  assert.equal(element('#npc-dialogue-next').hidden, true);
  assert.equal(values.has('max-game:unlocked-songs'), false);
  leave(); approachAdam();
  assert.match(element('#npc-dialogue-line').textContent, /still very short/);
  next();
  assert.match(element('#npc-dialogue-line').textContent, /Dial Square/);
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
  // A used item is offered again on the next visit.
  values.set('max-game:inventory-gifts', '[]');
  leave(); approachMarina(); next();
  assert.deepEqual(JSON.parse(values.get('max-game:inventory-gifts')), ['marina-d-item-1']);
  leave(); approachMarina(); next();
  assert.deepEqual(JSON.parse(values.get('max-game:inventory-gifts')), ['marina-d-item-1', 'marina-d-item-2']);
  values.set('max-game:inventory-gifts', '["marina-d-item-1"]');
  leave(); approachMarina(); next();
  assert.deepEqual(JSON.parse(values.get('max-game:inventory-gifts')), ['marina-d-item-1', 'marina-d-item-2']);
  leave(); approachMarina();
  assert.equal(element('#npc-dialogue-next').hidden, false); // More submitted dialogue remains available.
  next();
  assert.deepEqual(JSON.parse(values.get('max-game:inventory-gifts')), ['marina-d-item-1', 'marina-d-item-2']);

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
