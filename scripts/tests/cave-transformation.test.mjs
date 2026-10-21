import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { readPng, rgbaAt } from '../png.mjs';
import { withGameTest } from './helpers.mjs';

await withGameTest(async ({ loadModule }) => {
  const story = await loadModule('cave-transformation', 'js/core/cave-transformation.ts');
  assert.equal(story.hasCaveTransformation(), false);
  story.completeCaveTransformation();
  assert.equal(story.hasCaveTransformation(), true);
  const scenes = await loadModule('scenes', 'js/interiors/interior-scenes.ts');
  const { InteriorCollision } = await loadModule('cave-collision', 'js/interiors/interior-collision.ts');
  const cave = scenes.getInteriorScene('northwest-portal');
  const collision = new InteriorCollision(cave, () => false);
  assert.equal(collision.playerIsBlocked(320, 180), true, 'the tied-up body stays solid');
  assert.equal(collision.playerIsBlocked(320, 310), false, 'the normal cave exit remains reachable');
  const { InteriorDoorsController } = await loadModule('seal-doors', 'js/interiors/interior-doors.ts');
  const doors = new InteriorDoorsController(cave, {enteredDoor:'northwest-portal',sealMode:true,hasCaveColander:()=>false});
  const url = new URL(doors.returnUrl(), 'https://game.example/internal/');
  assert.equal(url.searchParams.get('seal'),'1');
  assert.equal(url.searchParams.get('transformed'),'1');
  assert.equal(url.searchParams.has('colander'),false,'leaving after transformation cannot restart the colander chase');
});

const { SEAL_SPRITE_SOURCE } = await (async () => {
  let result;
  await withGameTest(async ({loadModule}) => { result = await loadModule('seal-sheet','js/generated/core/seal-sprite.generated.ts'); });
  return result;
})();
const prepared = readPng(Buffer.from(SEAL_SPRITE_SOURCE.split(',')[1], 'base64'));
const original = readPng(await readFile('char/player/seal-sprite.png'));
assert.deepEqual([prepared.width,prepared.height],[original.width,original.height]);
assert.equal(rgbaAt(prepared,0,0)[3],0,'the seal sheet has a transparent matte');
assert.ok(prepared.pixels.some((value,index)=>index%4===3 && value===255),'the seal remains visible');
for(let y=0;y<prepared.height;y+=17) for(let x=0;x<prepared.width;x+=17) {
  const pixel=rgbaAt(prepared,x,y);
  if(pixel[3]) assert.deepEqual(pixel.slice(0,3),rgbaAt(original,x,y).slice(0,3),'sprite colors are preserved');
}
