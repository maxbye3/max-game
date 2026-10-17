import assert from 'node:assert/strict';
import { withGameTest } from './helpers.mjs';

await withGameTest(async ({ loadModule }) => {
  const georgiaPower = await loadModule('georgia-power', 'js/powers/georgia/georgia-power.ts');
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
});
