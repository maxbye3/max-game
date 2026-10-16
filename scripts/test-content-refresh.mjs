import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { fetchAlbumImages, parseAlbumPage } from './sync-google-photos.mjs';

const image = (id) => `https://lh3.googleusercontent.com/pw/${id}`;
const albumData = (ids, token = '') => [null, ids.map((id) => [id, [image(id)]]), token];
const albumHtml = (ids, token = '') => `AF_dataServiceRequests = {'ds:1': {id:'snAcKc',request:["album",null,null,"share"]}};
AF_initDataCallback({key: 'ds:1', hash: '2', data:${JSON.stringify(albumData(ids, token))}, sideChannel: {}});`;
assert.deepEqual(parseAlbumPage(albumHtml(['a'])).images, [image('a')]);
assert.throws(() => parseAlbumPage('<html>Sign in</html>'), /missing/);
assert.throws(() => parseAlbumPage(albumHtml(['a']).replace(image('a'), 'invalid')), /invalid photo/);
const requests = [];
assert.deepEqual(await fetchAlbumImages('https://photos.app.goo.gl/example', async (url, options) => {
  requests.push({ url, options });
  return requests.length === 1
    ? { ok: true, url: 'https://photos.google.com/share/album?key=share', text: async () => albumHtml(['a'], 'next') }
    : { ok: true, text: async () => `)]}'\n\n123\n${JSON.stringify([['wrb.fr', 'snAcKc', JSON.stringify(albumData(['a', 'b']))]])}\n` };
}), [image('a'), image('b')], 'Fetch every page and deduplicate photos');
assert.equal(JSON.parse(JSON.parse(requests[1].options.body.get('f.req'))[0][0][1])[1], 'next');
await assert.rejects(fetchAlbumImages('https://photos.app.goo.gl/example', async () => ({
  ok: true, url: 'https://photos.google.com/share/album', text: async () => albumHtml(['a'], 'next'),
})), /pagination response/, 'Never publish a truncated album after a failed page');

const temporaryDirectory = await mkdtemp(join(tmpdir(), 'max-game-refresh-tests-'));
async function load(name, source) {
  const outfile = join(temporaryDirectory, `${name}.mjs`);
  await build({ entryPoints: [source], outfile, bundle: true, platform: 'node', format: 'esm' });
  return import(pathToFileURL(outfile).href);
}
class Element extends EventTarget {
  hidden = true;
  open = false;
  children = [];
  scrollTop = 0;
  textContent = '';
  focus() {}
  setAttribute() {}
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this.children = children; }
  querySelector() { return this.children[0]; }
  querySelectorAll() { return this.children; }
  showModal() { this.open = true; }
  close() { this.open = false; }
}
const elements = new Map();
const element = (selector) => {
  if (!elements.has(selector)) elements.set(selector, new Element());
  return elements.get(selector);
};
const intervals = new Map();
let timerId = 0;
globalThis.window = Object.assign(new EventTarget(), {
  location: { protocol: 'https:' },
  setInterval(callback) { const id = ++timerId; intervals.set(id, callback); return id; },
  clearInterval(id) { intervals.delete(id); },
  setTimeout, clearTimeout,
});
globalThis.document = Object.assign(new EventTarget(), {
  visibilityState: 'visible',
  querySelector: element,
  createElement: () => new Element(),
});
const tick = async () => {
  for (const callback of intervals.values()) callback();
  await new Promise(setImmediate);
};
const click = (selector) => element(selector).dispatchEvent(new Event('click'));
try {
  const { ContentRefresh } = await load('refresh', 'js/core/content-refresh.ts');
  let calls = 0;
  let finish;
  let signal;
  const refresh = new ContentRefresh(async (requestSignal) => {
    calls += 1;
    signal = requestSignal;
    await new Promise((resolve) => { finish = resolve; });
  });
  refresh.start();
  assert.equal(calls, 1, 'Opening refreshes immediately');
  await tick();
  window.dispatchEvent(new Event('focus'));
  assert.equal(calls, 1, 'Slow requests do not overlap');
  finish(); await new Promise(setImmediate);
  document.visibilityState = 'hidden'; await tick();
  assert.equal(calls, 1, 'Background tabs do not poll');
  document.visibilityState = 'visible';
  document.dispatchEvent(new Event('visibilitychange'));
  assert.equal(calls, 2, 'Returning to the tab refreshes');
  refresh.stop();
  assert.equal(signal.aborted, true, 'Closing aborts in-flight requests');
  assert.equal(intervals.size, 0);
  finish(); await new Promise(setImmediate);
  window.dispatchEvent(new Event('focus'));
  assert.equal(calls, 2, 'Closed galleries do not refresh');

  const { ArtGalleryController } = await load('art', 'js/interiors/art-gallery.ts');
  const art = new ArtGalleryController(() => {});
  const gallery = element('#art-gallery-thumbnails');
  let photos = [image('a'), image('b')];
  let fetchOptions;
  globalThis.fetch = async (_, options) => { fetchOptions = options; return { ok: true, json: async () => ({ images: photos }) }; };
  art.open(); await new Promise(setImmediate);
  assert.equal(fetchOptions.cache, 'no-store');
  assert.equal(gallery.children.length, 2);
  gallery.children[1].dispatchEvent(new Event('click'));
  photos = [image('b'), image('c'), image('d')];
  await tick();
  assert.equal(gallery.children.length, 2, 'Do not change an open lightbox');
  assert.equal(element('#art-gallery-lightbox-image').src, `${image('b')}=w1800-h1800`);
  click('#art-gallery-lightbox-close');
  assert.equal(gallery.children.length, 3, 'Apply deferred updates on closing the lightbox');
  globalThis.fetch = async () => { throw new Error('offline'); };
  await tick(); assert.equal(gallery.children.length, 3, 'An outage preserves the latest photos');
  art.hide();
  let staleResponse;
  globalThis.fetch = () => new Promise((resolve) => { staleResponse = resolve; });
  art.open(); art.hide();
  staleResponse({ ok: true, json: async () => ({ images: [image('stale')] }) });
  await new Promise(setImmediate);
  assert.equal(gallery.children.length, 3, 'Late responses cannot replace a closed gallery');
  assert.equal(intervals.size, 0);

  const { GoodreadsReadingController } = await load('books', 'js/interiors/goodreads-reading.ts');
  const reading = new GoodreadsReadingController(() => {});
  let reviews = [{ title: 'First book', author: 'Author', cover: image('book'), rating: 4, review: 'Review', url: 'https://www.goodreads.com/review/1' }];
  globalThis.fetch = async () => ({ ok: true, json: async () => ({ reviews }) });
  reading.open(); await new Promise(setImmediate);
  const books = element('#goodreads-reading-list');
  books.children[0].dispatchEvent(new Event('click'));
  reviews = [{ ...reviews[0], title: 'Latest book' }];
  await tick();
  assert.equal(element('#reading-title').textContent, 'First book');
  click('#reading-lightbox-close');
  assert.equal(books.children[0].children[1].textContent, 'Latest book', 'Reviews update after reading ends');
  reviews = []; await tick(); reading.hide(); reading.open();
  assert.equal(books.children.length, 0, 'A newly empty shelf stays empty on reopen');
  await new Promise(setImmediate); reading.hide();
  assert.equal(intervals.size, 0);
  console.log('Content freshness: pagination, polling, focus, offline fallback, cancellation and deferred gallery updates passed');
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}
