import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import sharp from 'sharp';
import { sampleFrame, packFrames } from '../lib/render-pixels.mjs';
import { interiorRenderPlan, interiorRenderOutputs } from '../lib/interior-render-plan.mjs';
import { withGameTest } from './helpers.mjs';

const pixels = Buffer.from(Array.from({ length: 4 * 4 * 4 }, (_, i) => i));
const image = { width: 4, height: 4, pixels };
const sampled = sampleFrame(image, [0, 0, 4, 4], 2, 2);
for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) {
  assert.deepEqual(sampled.pixels.subarray((y * 2 + x) * 4, (y * 2 + x + 1) * 4), pixels.subarray((y * 8 + x * 2) * 4, (y * 8 + x * 2 + 1) * 4));
}
const atlas = packFrames([image, sampled]);
assert.deepEqual(atlas.frames, [[0, 0, 4, 4], [0, 4, 2, 2]]);
assert.deepEqual(atlas.pixels.subarray(0, pixels.length), pixels, 'packing preserves complete source poses');

await withGameTest(async ({ loadModule }) => {
  const { interiorRenderAssets } = await loadModule('render-assets', 'js/interiors/render-assets.ts');
  const { scenes, siblingFrames } = await interiorRenderPlan();
  for (const scene of scenes) {
    if (!scene.doorOverlaySource) continue;
    const prepared = interiorRenderAssets.doors[scene.kind];
    assert.equal(prepared.frames.length, scene.doors.length, 'all exits retain their door art');
    for (const [index, door] of scene.doors.entries()) assert.deepEqual(prepared.frames[index].slice(2), [door.width, door.height]);
    assert.ok((await stat(prepared.source)).size < (await stat(scene.doorOverlaySource.slice(3))).size / 2, `${scene.kind} stops downloading oversized doorway art`);
  }
  const original = await sharp('char/siblings/girls-sprite.png').ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const prepared = await sharp(interiorRenderAssets.siblings.source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const frames = [interiorRenderAssets.siblings.idle, ...interiorRenderAssets.siblings.walk];
  for (const [index, frame] of siblingFrames.entries()) {
    const [x, y, width, height] = frame, [px, py] = frames[index];
    for (let row = 0; row < height; row++) {
      const a = ((y + row) * original.info.width + x) * 4;
      const b = ((py + row) * prepared.info.width + px) * 4;
      assert.deepEqual(prepared.data.subarray(b, b + width * 4), original.data.subarray(a, a + width * 4), 'every cave pose retains all original pixels');
    }
  }
  const outputs = await interiorRenderOutputs();
  assert.ok(outputs.length > 10);
  for (const output of outputs) assert.ok((await stat(output)).size > 0, 'every generated asset is tracked by the build cache');
});

await withGameTest(async ({ loadModule }) => {
  const { drawVisibleImage } = await loadModule('visible', 'js/core/draw-visible-image.ts');
  const calls = [];
  const context = { canvas: { width: 100, height: 100 }, drawImage(...args) { calls.push(args); } };
  const sprite = { complete: true, naturalWidth: 20, naturalHeight: 30 };
  for (const coordinates of [[-21, 0], [101, 0, 20, 30], [0, 0, 20, 30, 0, 101, 20, 30]]) drawVisibleImage(context, sprite, ...coordinates);
  assert.equal(calls.length, 0, 'offscreen world art avoids canvas draw calls');
  for (const coordinates of [[-19, 0], [90, 90, 20, 30], [0, 0, 20, 30, 0, 99, 20, 30]]) drawVisibleImage(context, sprite, ...coordinates);
  assert.equal(calls.length, 3, 'partly visible and cropped art still draws');
  drawVisibleImage(context, { ...sprite, complete: false }, 0, 0);
  assert.equal(calls.length, 3, 'unloaded art is skipped');
});
