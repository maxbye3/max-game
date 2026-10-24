import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { readPng, rgbaAt } from '../png.mjs';
import { withGameTest } from './helpers.mjs';

await withGameTest(async ({ loadModule }) => {
  window.location.search = '?seal=1';
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
  const changedCharacter = new URL('https://game.example/index.html?door=northwest-portal&seal=1&transformed=1&awakened=1&colander=1&chase=1&body=ghost&wheldon=0');
  story.resetCaveTransformation(changedCharacter);
  window.location.search = changedCharacter.search;
  assert.equal(story.hasCaveTransformation(),false,'changing out of seal form resets the saved cave story');
  for (const key of ['seal','transformed','awakened','colander','chase']) assert.equal(changedCharacter.searchParams.has(key),false,`${key} cannot revive an old colander sequence`);
  assert.equal(changedCharacter.searchParams.get('door'),'northwest-portal','character changes preserve the current doorway');
  assert.equal(changedCharacter.searchParams.get('body'),'ghost','the chosen character survives the reset');
  assert.equal(changedCharacter.searchParams.get('wheldon'),'0');
  assert.equal(collision.playerIsBlocked(320,180),false,'the tied-up body no longer blocks the reset cave');
});

for (const body of ['player', 'ghost', 'alex-s']) {
  for (const staleSeal of [false, true]) await withGameTest(async ({ loadModule, values }) => {
    const url = new URL(`https://game.example/internal/index.html?door=northwest-portal&body=${body}&transformed=1&awakened=1&colander=1&chase=1${staleSeal ? '&seal=1' : ''}`);
    // A player with seal=1 is a real seal; a ghost/possessed body overrides it.
    if (body === 'player' && staleSeal) return;
    Object.assign(window.location, { href: url.href, search: url.search });
    values.set('max-game:siblings:transformed', 'true');
    const navigate = (next) => Object.assign(window.location, { href: String(next), search: new URL(next).search });
    window.history = { state: null, replaceState: (_state, _title, next) => navigate(next) };
    window.location.replace = navigate;
    const story = await loadModule('reset-story', 'js/core/cave-transformation.ts', `
      export { isSiblingPursuitActive } from './js/core/sibling-pursuit.ts';
      export { CaveSiblingsController } from './js/interiors/cave-siblings.ts';
    `);
    assert.equal(story.hasCaveTransformation(), false, `${body} cannot retain the chair scene`);
    story.resetCaveTransformationForCurrentForm();
    assert.equal(values.get('max-game:siblings:transformed'), 'false');
    assert.equal(story.isSiblingPursuitActive(), false, 'old pursuit cannot suppress the entrance');
    const clean = new URL(window.location.href);
    assert.equal(clean.searchParams.get('body'), body);
    assert.equal(clean.searchParams.get('door'), 'northwest-portal');
    for (const key of ['seal', 'transformed', 'awakened', 'colander', 'chase']) assert.equal(clean.searchParams.has(key), false);
    const lines = [];
    const girls = new story.CaveSiblingsController({ showLine: line => lines.push(line), showOptions() {}, closeDialogue() {} });
    assert.equal(girls.isEntering, true);
    assert.equal(girls.darknessAlpha, 1);
    girls.update(1.35, 1350);
    assert.equal(girls.startWelcome(1350), true);
    assert.equal(lines[0].line, 'welcome.');
  });
}

for (const search of ['?seal=1&transformed=1', '?colander=1&chase=1']) await withGameTest(async ({ loadModule, values }) => {
  Object.assign(window.location, { href: `https://game.example/${search}`, search });
  if (search.includes('transformed')) values.set('max-game:siblings:transformed', 'true');
  const story = await loadModule('keep-story', 'js/core/cave-transformation.ts');
  story.resetCaveTransformationForCurrentForm();
  assert.equal(window.location.search, search, 'active seal scenes and fresh colander chases survive entry');
  assert.equal(story.hasCaveTransformation(), search.includes('transformed'));
});

const { SEAL_SPRITE_SOURCE } = await (async () => {
  let result;
  await withGameTest(async ({loadModule}) => { result = await loadModule('seal-sheet','js/generated/core/seal-sprite.generated.ts'); });
  return result;
})();
const prepared = readPng(await readFile(SEAL_SPRITE_SOURCE.split('?')[0]));
const original = readPng(await readFile('char/player/seal-sprite.png'));
assert.deepEqual([prepared.width,prepared.height],[original.width,original.height]);
assert.equal(rgbaAt(prepared,0,0)[3],0,'the seal sheet has a transparent matte');
assert.ok(prepared.pixels.some((value,index)=>index%4===3 && value===255),'the seal remains visible');
for(let y=0;y<prepared.height;y+=17) for(let x=0;x<prepared.width;x+=17) {
  const pixel=rgbaAt(prepared,x,y);
  if(pixel[3]) assert.deepEqual(pixel.slice(0,3),rgbaAt(original,x,y).slice(0,3),'sprite colors are preserved');
}
