import assert from 'node:assert/strict';
import { withGameTest } from './helpers.mjs';

await withGameTest(async ({ loadModule }) => {
  const interiorScenes = await loadModule('interior-scenes', 'js/interiors/interior-scenes.ts');
  const interiorDoors = await loadModule('interior-doors', 'js/interiors/interior-doors.ts');
  const interiorCollision = await loadModule('interior-collision', 'js/interiors/interior-collision.ts');
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
  assert.equal(plantRoomCollision.playerIsBlocked(256, 610), false);
});
