import assert from 'node:assert/strict';
import { withGameTest } from './helpers.mjs';

await withGameTest(async ({ loadModule }) => {
  const { InteriorSiblingChase } = await loadModule('interior-chase', 'js/interiors/interior-sibling-chase.ts');
  let arrivals = 0, catches = 0;
  const chase = new InteriorSiblingChase({ x: 100, y: 100 }, () => false, () => arrivals++, () => catches++);
  chase.update(1.49, {x:100,y:100});
  assert.equal(chase.phase, 'waiting'); assert.equal(arrivals, 0);
  chase.update(0.01, {x:100,y:100});
  assert.equal(chase.phase, 'message'); assert.equal(arrivals, 1);
  chase.update(1.79, {x:100,y:100}); assert.equal(catches, 0);
  chase.update(0.01, {x:100,y:100}); assert.equal(catches, 1);
  chase.update(10, {x:100,y:100}); assert.equal(catches, 1, 'capture fires once');

  const blocked = (x,y) => x<0 || x>300 || y<0 || y>250 || (x>140 && x<170 && y<170);
  const navigating = new InteriorSiblingChase({x:100,y:100}, blocked, () => {}, () => catches++);
  navigating.update(1.5, {x:220,y:100}); navigating.update(1.8, {x:220,y:100});
  for(let i=0;i<250 && navigating.phase!=='caught';i++) {
    navigating.update(0.05, {x:220,y:100});
    assert.equal(blocked(navigating.x,navigating.y), false, 'sisters do not pass through furniture');
  }
  assert.equal(navigating.phase, 'caught', 'sisters can route around furniture to capture the player');

  window.location.search = '?door=garden-room&chase=1';
  const { InteriorDoorsController } = await loadModule('chased-doors', 'js/interiors/interior-doors.ts');
  const { getInteriorScene } = await loadModule('scenes', 'js/interiors/interior-scenes.ts');
  const doors = new InteriorDoorsController(getInteriorScene('garden-room'), { enteredDoor:'garden-room', sealMode:false, hasCaveColander:()=>true });
  assert.match(doors.returnUrl(), /chase=1/);
  assert.match(doors.returnUrl(), /colander=1/);
  const rootDoors = new InteriorDoorsController(getInteriorScene(null), { enteredDoor:null, sealMode:false, hasCaveColander:()=>false });
  const link = {href:''}; rootDoors.syncExitLink(link);
  assert.match(link.href, /chase=1/, 'the default interior exit also preserves pursuit');
});
