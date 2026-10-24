import assert from 'node:assert/strict';
import { encodeCollisionBits } from '../lib/collision-encoding.mjs';
import { withGameTest } from './helpers.mjs';
import { readFile } from 'node:fs/promises';
import { readPng } from '../png.mjs';

await withGameTest(async ({ loadModule }) => {
  const sprites = await loadModule('battle-sprites', 'js/generated/characters/niall/battle-sprites.generated.ts');
  for (const source of Object.values(sprites)) {
    assert.ok(source.startsWith('img/battle/'), 'battle artwork is fetched separately from JavaScript');
    const image = readPng(await readFile(source.split('?')[0]));
    assert.ok(image.pixels.some((value, index) => index % 4 === 3 && value === 0), 'transparent battle backgrounds are retained');
    assert.ok(image.pixels.some((value, index) => index % 4 === 3 && value === 255), 'the battler remains opaque');
  }
  const html = await readFile('niall-fight/index.html', 'utf8');
  assert.ok(!/<img[^>]+src=["'][^"']*char\/(niall|player)\//.test(html), 'HTML never starts duplicate original portrait downloads');
});

await withGameTest(async ({ loadModule, scheduledCallbacks }) => {
  const { decodeLoadedImage } = await loadModule('decode', 'js/core/image-decoding.ts');
  await decodeLoadedImage({ decode: () => Promise.reject(new Error('browser decode rejected')) });
  let finished = false;
  const pending = decodeLoadedImage({ decode: () => new Promise(() => {}) }).then(() => { finished = true; });
  await Promise.resolve();
  assert.equal(finished, false);
  scheduledCallbacks.at(-1)();
  await pending;
  assert.equal(finished, true, 'loaded NPC art remains usable when decode never settles');
});

await withGameTest(async ({ loadModule }) => {
  const { decodeCollisionBits } = await loadModule('collision-codec', 'js/interiors/collision-bits.ts');
  for (const bytes of [Buffer.alloc(0), Buffer.alloc(12288), Buffer.alloc(12288, 255), Buffer.from(Array.from({ length: 4096 }, (_, i) => i % 256)), Buffer.from([0, 0, 0, 12, 255, 255, 7])]) {
    const encoded = encodeCollisionBits(bytes);
    assert.deepEqual(Buffer.from(decodeCollisionBits(encoded)), bytes, 'collision compression preserves every cell, including long runs and mixed bytes');
    assert.ok(encoded.length <= bytes.toString('base64').length, 'noisy masks keep their smaller raw representation');
  }
  assert.ok(encodeCollisionBits(Buffer.alloc(12288)).startsWith('rle:'), 'large empty areas compress');
  const { getInteriorScene } = await loadModule('scenes', 'js/interiors/interior-scenes.ts');
  for (const door of ['diary-lab-left', 'cinema', 'music-shop', 'gym', 'bookshop', 'garden-room', 'snow-mansion']) {
    const grid = getInteriorScene(door).collision;
    assert.equal(decodeCollisionBits(grid.bits).length, Math.ceil(grid.columns * grid.rows / 8), `${door} expands to the full original grid`);
  }
});

await withGameTest(async ({ loadModule, element }) => {
  window.location.protocol = 'file:';
  const { ArtGalleryController } = await loadModule('art', 'js/interiors/art-gallery.ts');
  const art = new ArtGalleryController(() => {});
  const thumbnails = element('#art-gallery-thumbnails');
  thumbnails.querySelector = () => null;
  assert.equal(thumbnails.children.length, 0, 'hidden photos create no thumbnails during room startup');
  art.open();
  assert.ok(thumbnails.children.length > 0, 'saved photos appear immediately when opened offline');
  const first = thumbnails.children[0];
  art.hide(); art.open();
  assert.equal(thumbnails.children[0], first, 'reopening reuses existing thumbnails');
});

await withGameTest(async ({ loadModule }) => {
  const { drawSceneryNpcs } = await loadModule('scenery', 'js/interiors/interior-scenery-npcs.ts');
  const first = { complete: true, naturalWidth: 136 }, later = { complete: false, naturalWidth: 0 };
  const frame = image => ({ image, sourceBounds: [0, 0, 136, 200], width: 40, height: 60 });
  const npc = { x: 100, y: 100, width: 40, height: 60, image: first, frames: [frame(first), frame(later)], frameDurationMs: 100 };
  const drawn = [];
  const context = { save() {}, restore() {}, drawImage(image) { drawn.push(image); } };
  drawSceneryNpcs(context, [npc], 0, 0, 1, 1, 150);
  assert.equal(drawn.at(-1), first, 'a slow later pose never makes a cat disappear');
  Object.assign(later, { complete: true, naturalWidth: 136 });
  drawSceneryNpcs(context, [npc], 0, 0, 1, 1, 150);
  assert.equal(drawn.at(-1), later, 'animation resumes as soon as the pose is ready');
});

for (const [search, asset] of [['', 'spriteSheet'], ['?body=ghost', 'ghostSpriteSheet'], ['?wheldon=1', 'wheldonSprite'], ['?body=ghost&wheldon=1', 'ghostWheldonSprite'], ['?seal=1', 'sealSpriteSheet']]) {
  await withGameTest(async ({ loadModule }) => {
    window.location.search = search;
    let deferred;
    window.requestIdleCallback = callback => { deferred = callback; };
    globalThis.Image = class {
      complete = false; naturalWidth = 0;
      set src(source) { this.source = source; queueMicrotask(() => { this.complete = true; this.naturalWidth = 10; this.onload(); }); }
      get src() { return this.source ?? ''; }
      decode() { return Promise.resolve(); }
    };
    const { loadAssets, images } = await loadModule('assets', 'js/core/assets.ts');
    await loadAssets();
    assert.ok(images[asset].complete, `${search || 'ordinary player'} has its actual form ready before play`);
    if (!search) assert.equal(images.ghostWheldonSprite.src, '', 'an unused ghost form never delays ordinary entry');
    assert.equal(typeof deferred, 'function');
  });
}
