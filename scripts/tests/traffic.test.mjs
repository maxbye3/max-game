import assert from 'node:assert/strict';
import { withGameTest } from './helpers.mjs';

await withGameTest(async ({ loadModule, values }) => {
  const accidentScene = await loadModule('road-accident-scene', 'js/overworld/road-accident-scene.ts');
  const scene = new accidentScene.RoadAccidentScene();
  const hitPlayer = { x: 700, y: 1315, direction: 'left', frame: 4, animationTime: 1 };
  let reveals = 0;
  scene.begin(hitPlayer);
  assert.equal(scene.dialogue, 'Oh no!');
  assert.deepEqual(scene.cameraCenter(), { x: 700, y: 1315 });
  scene.update(1.6, hitPlayer, () => reveals++);
  assert.equal(scene.playerVisible, false, 'the body disappears before the camera pans');
  scene.update(1.2, hitPlayer, () => reveals++);
  assert.ok(scene.cameraCenter().y < 1315 && scene.cameraCenter().y > accidentScene.GHOST_SPAWN.y);
  assert.equal(reveals, 0, 'the ghost waits until the camera reaches the grave');
  scene.update(1.21, hitPlayer, () => reveals++);
  assert.equal(reveals, 1);
  assert.equal(hitPlayer.x, accidentScene.GHOST_SPAWN.x);
  assert.equal(hitPlayer.y, accidentScene.GHOST_SPAWN.y);
  assert.equal(scene.playerVisible, true);
  scene.update(1, hitPlayer, () => reveals++);
  assert.equal(scene.active, false);
  assert.equal(scene.cameraCenter(), null);
  assert.equal(reveals, 1, 'a single accident only spawns one ghost');

  const trafficHits = await loadModule('road-traffic-hits', 'js/overworld/road-traffic.ts');
  values.set('max-game:interior-visited', 'true');
  trafficHits.startRoadTraffic();
  const roadPlayer = { x: 692, y: trafficHits.ROAD_CAR_CENTER_Y };
  trafficHits.updateRoadTraffic(0.05, roadPlayer);
  trafficHits.updateRoadTraffic(5, roadPlayer);
  const enteringCar = trafficHits.getRoadTrafficCars()[0];
  trafficHits.updateRoadTraffic(0.5, roadPlayer);
  assert.equal(trafficHits.stopRoadCarOnPlayer(enteringCar.x - 50, trafficHits.ROAD_CAR_CENTER_Y - 60), false, 'the sidewalk is safe');
  assert.equal(trafficHits.stopRoadCarOnPlayer(enteringCar.x - 50, trafficHits.ROAD_CAR_CENTER_Y), true, 'a swept car hits a player between frames');
  const stoppedCar = trafficHits.getRoadTrafficCars()[0];
  assert.equal(stoppedCar.x + trafficHits.ROAD_CAR_WIDTH / 2, enteringCar.x - 50, 'the car stops centered over the player');
  trafficHits.updateRoadTraffic(1, roadPlayer);
  assert.equal(trafficHits.getRoadTrafficCars()[0].x, stoppedCar.x, 'the accident car stays stopped');
  assert.equal(trafficHits.stopRoadCarOnPlayer(enteringCar.x - 50, trafficHits.ROAD_CAR_CENTER_Y), false, 'a stopped car cannot retrigger the accident');

  const playerBody = await loadModule('player-body', 'js/core/player-body.ts');
  playerBody.setPlayerBody('ghost');
  const restoredBody = await loadModule('player-body-restored', 'js/core/player-body.ts');
  assert.equal(restoredBody.getPlayerBody(), 'ghost');
  playerBody.setPlayerBody('alex-s');
  const possessedBody = await loadModule('player-body-possessed', 'js/core/player-body.ts');
  assert.equal(possessedBody.getPlayerBody(), 'alex-s', 'possession survives navigation');
  playerBody.setPlayerBody('player');

  values.clear();
  const worldState = await loadModule('world-state', 'js/core/world-state.ts');
  {
    const busIntroTraffic = await loadModule('bus-intro-traffic', 'js/overworld/bus-intro.ts');
    const introPlayer = { x: 0, y: 0, direction: 'down', frame: 0, animationTime: 0 };
    for (let frame = 0; frame < 170 && busIntroTraffic.isBusIntroActive(); frame += 1) {
      busIntroTraffic.updateBusIntro(0.05, introPlayer);
    }
    assert.equal(busIntroTraffic.isBusIntroActive(), false, 'the bus finishes leaving');
    assert.deepEqual(busIntroTraffic.getRoadTrafficCars(), []);
    busIntroTraffic.updateBusIntro(60, introPlayer);
    assert.deepEqual(busIntroTraffic.getRoadTrafficCars(), [], 'traffic stays disabled before the first interior visit');
  }
  const roadConfig = await loadModule('road-config', 'js/core/config.ts');
  const { ROAD_X, ROAD_Y, ROAD_WIDTH, ROAD_HEIGHT } = roadConfig;
  const originalLocationSearch = window.location.search;
  for (const search of ['?door=bookshop', '?niall=bus', '?body=ghost']) {
    window.location.search = search;
    values.delete('max-game:interior-visited');
    values.set('max-game:player-body', search.includes('ghost') ? 'ghost' : 'player');
    const beforeVisit = await loadModule(`traffic-before-visit-${search}`, 'js/overworld/bus-intro.ts');
    beforeVisit.setupBusIntro();
    const returningPlayer = { x: ROAD_X + ROAD_WIDTH / 2, y: ROAD_Y + ROAD_HEIGHT / 2, direction: 'down', frame: 0, animationTime: 0 };
    beforeVisit.updateBusIntro(0.05, returningPlayer);
    beforeVisit.updateBusIntro(60, returningPlayer);
    assert.deepEqual(beforeVisit.getRoadTrafficCars(), [], 'a return URL alone cannot unlock traffic');
    worldState.markInteriorVisited();
    const returningTraffic = await loadModule(
      `returning-traffic-${search}`,
      'js/overworld/bus-intro.ts',
    );
    returningTraffic.setupBusIntro();
    assert.equal(returningTraffic.isBusIntroActive(), false, `${search} skips the arrival intro`);
    returningPlayer.y = ROAD_Y - 1;
    returningTraffic.updateBusIntro(60, returningPlayer);
    assert.deepEqual(returningTraffic.getRoadTrafficCars(), [], 'waiting off the road never spawns a car');
    returningPlayer.y = ROAD_Y;
    returningTraffic.updateBusIntro(0.05, returningPlayer);
    returningTraffic.updateBusIntro(4.95, returningPlayer);
    assert.deepEqual(returningTraffic.getRoadTrafficCars(), [], 'road entry waits five seconds');
    returningTraffic.setupBusIntro();
    returningTraffic.updateBusIntro(0.05, returningPlayer);
    assert.equal(returningTraffic.getRoadTrafficCars().length, 1, `${search} enables traffic after an interior visit`);
    assert.equal(returningTraffic.getRoadTrafficCars()[0].spriteIndex, 0);
    const carX = returningTraffic.getRoadTrafficCars()[0].x;
    assert.equal(carX, ROAD_X + ROAD_WIDTH, 'cars enter from the right');
    returningTraffic.updateBusIntro(1, returningPlayer);
    assert.equal(returningTraffic.getRoadTrafficCars()[0].x, carX - 220, 'return traffic continues moving');
    returningTraffic.updateBusIntro(60, returningPlayer);
    assert.deepEqual(returningTraffic.getRoadTrafficCars(), [], 'staying on the road does not run a periodic spawn timer');
    returningPlayer.y = ROAD_Y - 1;
    returningTraffic.updateBusIntro(0.05, returningPlayer);
    returningPlayer.x = ROAD_X;
    returningPlayer.y = ROAD_Y + ROAD_HEIGHT;
    returningTraffic.updateBusIntro(0.05, returningPlayer);
    returningTraffic.updateBusIntro(2, returningPlayer);
    returningPlayer.x = ROAD_X - 1;
    returningTraffic.updateBusIntro(0.05, returningPlayer);
    returningPlayer.x = ROAD_X + ROAD_WIDTH;
    returningTraffic.updateBusIntro(0.05, returningPlayer);
    returningTraffic.updateBusIntro(2.9, returningPlayer);
    assert.deepEqual(returningTraffic.getRoadTrafficCars().map((car) => car.spriteIndex), [1], 're-entry does not postpone the previous car');
    returningPlayer.x += 1;
    returningTraffic.updateBusIntro(2.1, returningPlayer);
    assert.deepEqual(returningTraffic.getRoadTrafficCars().map((car) => car.spriteIndex), [1, 2], 'every entry across the road bounds schedules a car, even if the player leaves');
  }
  window.location.search = originalLocationSearch;
  values.clear();
});
