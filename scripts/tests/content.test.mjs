import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { withGameTest } from './helpers.mjs';

await withGameTest(async ({ loadModule, element }) => {
  // A missing or unreadable deployed JSON feed must not empty the book gallery.
  const savedShelf = JSON.parse(await readFile('data/goodreads-read.json', 'utf8')).reviews;
  const { GoodreadsReadingController } = await loadModule('goodreads-reading', 'js/interiors/goodreads-reading.ts');
  const reading = new GoodreadsReadingController(() => {});
  const gallery = element('#goodreads-reading-list');
  window.location.protocol = 'https:';
  for (const fetchFeed of [
    async () => ({ ok: false, status: 404 }),
    async () => { throw new TypeError('Failed to fetch'); },
    async () => ({ ok: true, json: async () => { throw new SyntaxError('HTML instead of JSON'); } }),
  ]) {
    globalThis.fetch = fetchFeed;
    reading.open();
    assert.equal(gallery.children.length, savedShelf.length, 'Saved books appear before the request finishes');
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(gallery.children.length, savedShelf.length);
    assert.equal(element('#goodreads-reading-status').hidden, true);
    gallery.children[0].listeners.get('click')();
    assert.equal(element('#reading-title').textContent, savedShelf[0].title);
    assert.equal(element('#reading-review').textContent, savedShelf[0].review);
    reading.hide();
  }
  const updatedBook = { ...savedShelf[0], title: 'Updated shelf book' };
  globalThis.fetch = async () => ({ ok: true, json: async () => ({ reviews: [updatedBook] }) });
  reading.open();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(gallery.children.length, 1, 'A successful refresh replaces the saved shelf');
  assert.equal(gallery.children[0].children[0].alt, 'Updated shelf book cover');
  reading.hide();
  window.location.protocol = 'file:';
  let fileRequests = 0;
  globalThis.fetch = async () => { fileRequests += 1; throw new Error('Local file fetch blocked'); };
  reading.open();
  assert.equal(gallery.children.length, 1, 'Keep the most recently loaded shelf when offline');
  assert.equal(fileRequests, 0);
  reading.hide();
});
