import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { build } from 'esbuild';
import { withGameTest } from './helpers.mjs';
import { decodePhotoFeed } from '../lib/protected-photo-feeds.mjs';

const feeds = {};
const sources = {};
for (const name of ['journal', 'workout']) {
  feeds[name] = JSON.parse(await readFile(`data/protected/photos-${name}.json`, 'utf8'));
  const sourceText = await readFile(`scripts/photo-sources/photos-${name}.json`, 'utf8');
  const stored = JSON.parse(sourceText);
  sources[name] = decodePhotoFeed(name, stored);
  assert.equal(stored.images, undefined, 'repository sources must also be encrypted');
  assert.equal(stored.albumUrl, undefined);
  for (const url of [sources[name].albumUrl, ...sources[name].images].filter(Boolean)) assert.ok(!sourceText.includes(url));
  assert.equal(feeds[name].images, undefined);
  assert.equal(feeds[name].albumUrl, undefined, 'shared album links stay out of published feeds');
}
const bundled = await build({ entryPoints: ['js/interiors/internal.ts'], bundle: true, write: false, minify: true });
const script = bundled.outputFiles[0].text;
for (const source of Object.values(sources)) {
  for (const url of [source.albumUrl, ...source.images].filter(Boolean)) {
    assert.equal(script.includes(url), false, 'journal photo and album URLs must not appear in the game bundle');
  }
}

await withGameTest(async ({ loadModule, values, element }) => {
  const { JournalGalleryController, WorkoutGalleryController, setPlayerBody, setWheldonPlayerSpriteEnabled, decodeProtectedPhotos, PHOTO_KEYS } = await loadModule(
    'protected-journals', 'js/interiors/journal-gallery.ts',
    `export { WorkoutGalleryController } from './js/interiors/workout-gallery.ts';
     export { setPlayerBody } from './js/core/player-body.ts';
     export { setWheldonPlayerSpriteEnabled } from './js/core/player-sprite-test.ts';
     export { decodeProtectedPhotos } from './js/interiors/protected-photos.ts';
     export { PHOTO_KEYS } from './js/generated/interiors/photo-keys.generated.ts';`,
  );
  for (const name of ['journal', 'workout']) {
    assert.deepEqual(await decodeProtectedPhotos(feeds[name], PHOTO_KEYS[name]), sources[name].images);
    await assert.rejects(decodeProtectedPhotos({ images: sources[name].images }, PHOTO_KEYS[name]), /Invalid journal feed/);
    await assert.rejects(decodeProtectedPhotos(feeds[name], PHOTO_KEYS[name === 'journal' ? 'workout' : 'journal']));
    await assert.rejects(decodeProtectedPhotos({ ...feeds[name], ciphertext: 'AAAA' }, PHOTO_KEYS[name]));
  }

  const waitUntil = async (check) => {
    for (let tries = 0; tries < 200; tries++) {
      if (check()) return;
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    assert.fail('Journal did not finish loading');
  };
  let requests = 0;
  globalThis.fetch = async () => { requests++; throw new Error('offline'); };
  for (const [name, Controller, galleryId, lightboxId] of [
    ['journal', JournalGalleryController, 'journal-gallery', 'journal-lightbox'],
    ['workout', WorkoutGalleryController, 'workout-gallery', 'workout-lightbox'],
  ]) {
    const gallery = element(`#${galleryId}`);
    gallery.querySelector = () => gallery.children[0];
    const controller = new Controller(() => {});
    controller.hide();
    setPlayerBody('player');
    setWheldonPlayerSpriteEnabled(false);
    const before = requests;
    controller.open();
    assert.equal(controller.isOpen(), false);
    assert.equal(gallery.children.length, 0);
    assert.equal(requests, before, 'a locked journal never requests its feed');
    setWheldonPlayerSpriteEnabled(true);
    values.set('max-game:alex-w:eatenDoughnut', 'true');
    controller.open();
    await waitUntil(() => gallery.children.length > 0);
    assert.equal(gallery.children.length, sources[name].images.length, 'encrypted fallback works offline');
    gallery.children[0].listeners.get('click')();
    assert.equal(element(`#${lightboxId}-image`).src, `${sources[name].images[0]}=w1800-h1800`);
    controller.hide();
    assert.equal(gallery.children.length, 0, 'closing removes journal thumbnails from the DOM');
    assert.equal(element(`#${lightboxId}-image`).src, '', 'closing removes the full-size image URL');
    assert.equal(element(`#${lightboxId}`).open, false);
    controller.open();
    controller.hide();
    await new Promise(resolve => setTimeout(resolve, 30));
    assert.equal(gallery.children.length, 0, 'late decryption cannot restore a closed journal');
    controller.open();
    await waitUntil(() => gallery.children.length > 0);
    controller.hide();

    const updatedSource = `https://lh3.googleusercontent.com/pw/updated-${name}`;
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await crypto.subtle.importKey('raw', new Uint8Array(PHOTO_KEYS[name]), 'AES-GCM', false, ['encrypt']);
    const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(JSON.stringify({ images: [updatedSource] })));
    const updated = { version: 1, iv: Buffer.from(iv).toString('base64'), ciphertext: Buffer.from(ciphertext).toString('base64') };
    globalThis.fetch = async () => ({ ok: true, json: async () => updated });
    controller.open();
    await waitUntil(() => gallery.children.length === 1);
    assert.equal(gallery.children[0].children[0].src, `${updatedSource}=w480-h360-c`, 'live refresh decrypts new journal pages');
    controller.hide();

    let finish;
    globalThis.fetch = () => new Promise(resolve => { finish = resolve; });
    controller.open();
    await waitUntil(() => !!finish);
    controller.hide();
    finish({ ok: true, json: async () => updated });
    await new Promise(resolve => setTimeout(resolve, 30));
    assert.equal(gallery.children.length, 0, 'late encrypted responses cannot restore closed journal pages');

    globalThis.fetch = async () => ({ ok: true, json: async () => ({ ...updated, ciphertext: 'AAAA' }) });
    controller.open();
    await waitUntil(() => gallery.children.length > 0);
    await new Promise(resolve => setTimeout(resolve, 30));
    assert.equal(gallery.children.length, sources[name].images.length, 'a corrupt refresh preserves the encrypted fallback');
    controller.hide();
    globalThis.fetch = async () => { requests++; throw new Error('offline'); };
  }
});
