import assert from 'node:assert/strict';
import { loadingPreloadPlan, loadingPreloadBlock, replaceLoadingPreloads } from '../lib/loading-preloads.mjs';
import { withGameTest } from './helpers.mjs';

const plan = await loadingPreloadPlan();
assert.equal(plan.map.length, 3, 'only universal first-frame map images preload');
assert.equal(plan.rooms['music-shop'].length, 1, 'rooms without door overlays never preload unused art');
assert.equal(plan.rooms['feedback-center'].length, 0, 'small room images do not compete with startup code');
assert.deepEqual(plan.rooms.cave, plan.rooms['northwest-portal']);
assert.deepEqual(plan.rooms.default, plan.rooms['diary-lab-left']);
await withGameTest(async ({ loadModule }) => {
  const { getInteriorScene } = await loadModule('scenes', 'js/interiors/interior-scenes.ts');
  const { interiorBackgroundSource } = await loadModule('render-assets', 'js/interiors/render-assets.ts');
  globalThis.Image = class { src = ''; };
  const { createInteriorAssets } = await loadModule('assets', 'js/interiors/interior-assets.ts');
  for (const [door, paths] of Object.entries(plan.rooms)) {
    if (!paths.length) continue;
    const scene = getInteriorScene(door);
    assert.equal(paths[0], interiorBackgroundSource(scene.backgroundSource), 'early image requests exactly match the runtime URL');
    assert.equal(paths.length, 1, 'only a large room background receives an early hint');
    const required = createInteriorAssets(scene, false, false, false).requiredImages.map(image => image.src);
    assert.ok(paths.every(source => required.includes(source)), 'preloads add no optional image downloads');
  }
});
const html = '<head>\n    <link rel="stylesheet" href="style.css">\n</head>';
for (const page of ['index.html', 'internal/index.html']) {
  const block = loadingPreloadBlock(page, plan);
  const stamped = replaceLoadingPreloads(html, block);
  assert.ok(stamped.indexOf('game-preloads:start') < stamped.indexOf('rel="stylesheet"'), 'discovery runs before stylesheet-blocked scripts');
  assert.equal(replaceLoadingPreloads(stamped, block), stamped, 'rebuilding cannot duplicate preload requests');
}
