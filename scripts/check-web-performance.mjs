import assert from 'node:assert/strict';
import { mkdtemp, rm, stat, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';

const directory = await mkdtemp(join(tmpdir(), 'max-web-tests-'));
async function moduleFor(name) {
  const file = join(directory, `${name}.mjs`);
  await build({ entryPoints: [`js/${name}.ts`], outfile: file, bundle: true, format: 'esm', platform: 'node' });
  return import(pathToFileURL(file).href);
}
try {
  const listeners = new Map();
  const requests = new Map();
  let nextRequest = 0;
  globalThis.document = {
    hidden: false,
    addEventListener: (name, listener) => listeners.set(name, listener),
    removeEventListener: (name) => listeners.delete(name),
  };
  globalThis.requestAnimationFrame = (callback) => { requests.set(++nextRequest, callback); return nextRequest; };
  globalThis.cancelAnimationFrame = (id) => requests.delete(id);
  const { startGameLoop } = await moduleFor('game-loop');
  let frames = 0;
  let resets = 0;
  const stop = startGameLoop(() => { frames += 1; }, () => { resets += 1; });
  const tick = () => {
    const [id, callback] = requests.entries().next().value;
    requests.delete(id);
    callback(1000);
  };
  tick();
  assert.equal(frames, 1);
  assert.equal(requests.size, 1, 'one animation request per game loop');
  document.hidden = true; listeners.get('visibilitychange')();
  assert.equal(requests.size, 0, 'hidden pages stop simulation');
  document.hidden = false; listeners.get('visibilitychange')();
  assert.equal(resets, 2, 'returning discards elapsed time');
  tick(); assert.equal(frames, 2);
  stop(); assert.equal(requests.size, 0);
  assert.equal(listeners.size, 0);

  const { POWER_THEME_SOURCES } = await moduleFor('power-themes.generated');
  const inventory = await readFile('js/inventory.ts', 'utf8');
  for (const [, source] of inventory.matchAll(/const \w+_THEME_SOURCE = '([^']+)'/g)) {
    assert.ok((await stat(source)).size > 0, `missing power soundtrack: ${source}`);
    if (POWER_THEME_SOURCES[source]) assert.ok((await stat(POWER_THEME_SOURCES[source])).size < 300_000, 'prepared power music stays bounded');
  }
  const { WEB_IMAGE_SOURCES } = await moduleFor('web-images.generated');
  for (const [source, output] of Object.entries(WEB_IMAGE_SOURCES)) {
    assert.ok((await stat(output)).size < (await stat(source)).size, 'browser copy is smaller');
    assert.ok(!source.includes('collision'), 'collision guides stay untouched');
  }
  const { webImageSource } = await moduleFor('web-images');
  assert.equal(webImageSource('../img/external/overworld.png?v=old'), `../${WEB_IMAGE_SOURCES['img/external/overworld.png']}`);
  assert.equal(webImageSource('../chat/bochra/profile.jpg'), '../chat/bochra/profile.jpg');

  const stylesheet = await readFile('style.css', 'utf8');
  for (const [, font] of stylesheet.matchAll(/url\("(fonts\/[^"]+\.woff2)"\)/g)) {
    assert.ok((await stat(font)).size > 0, 'prepared web font exists');
  }

  const storage = new Map();
  globalThis.window = { location: { search: '' }, localStorage: { getItem: (key) => storage.get(key) ?? null } };
  const sources = [];
  globalThis.Image = class {
    decode() { return Promise.resolve(); }
    set src(source) { sources.push(source); queueMicrotask(() => this.onload()); }
  };
  const { loadAssets } = await moduleFor('assets');
  await loadAssets();
  assert.ok(!sources.includes(WEB_IMAGE_SOURCES['chat/siblings/girls-sprite.png']));
  assert.ok(!sources.includes(WEB_IMAGE_SOURCES['img/external/mike-aftermath.png']));
  assert.ok(!sources.includes(WEB_IMAGE_SOURCES['player/seal-game.png']));
  assert.ok(sources.includes(WEB_IMAGE_SOURCES['img/external/billboard-unfinished.png']));
  sources.length = 0; storage.set('max-game:mike-aftermath', 'true'); window.location.search = '?seal=1';
  await loadAssets(true);
  assert.ok(sources.includes(WEB_IMAGE_SOURCES['chat/siblings/girls-sprite.png']));
  assert.ok(sources.includes(WEB_IMAGE_SOURCES['img/external/mike-aftermath.png']));
  assert.ok(sources.includes(WEB_IMAGE_SOURCES['player/seal-game.png']));
  assert.ok(!sources.includes(WEB_IMAGE_SOURCES['chat/mike/overworld-avatar.png']));
  assert.ok(sources.includes(WEB_IMAGE_SOURCES['chat/rei/overworld-avatar.png']), 'Rei remains visible after the quest');
  // The permanent solar cap must still render after temporary powers expire.
  window.localStorage.setItem = (key, value) => storage.set(key, value);
  const characterFile = join(directory, 'character-render.mjs');
  await build({ stdin: { contents: "export { withCharacterPowers } from './js/character-power-render.ts'; export { setLucyCapEquipped } from './js/lucy-power.ts';", resolveDir: process.cwd() }, outfile: characterFile, bundle: true, format: 'esm', platform: 'node' });
  const characters = await import(pathToFileURL(characterFile).href);
  let sprites = 0, capPixels = 0;
  const context = { save() {}, restore() {}, translate() {}, scale() {}, rotate() {}, fillRect() { capPixels += 1; } };
  characters.withCharacterPowers(context, 100, 100, 52, 'player', () => { sprites += 1; }, 1000);
  assert.equal(sprites, 1); assert.equal(capPixels, 0);
  characters.setLucyCapEquipped(true);
  characters.withCharacterPowers(context, 100, 100, 52, 'player', () => { sprites += 1; }, 2000);
  assert.equal(sprites, 2); assert.ok(capPixels > 0, 'permanent cap survives the inactive-power fast path');

  const timers = new Map(); let nextTimer = 0;
  window.setTimeout = (callback) => { timers.set(++nextTimer, callback); return nextTimer; };
  window.clearTimeout = (id) => timers.delete(id);
  window.dispatchEvent = () => {};
  globalThis.Audio = class {
    paused = true; loop = false; events = new Map(); pauses = 0;
    addEventListener(name, callback) { this.events.set(name, callback); }
    play() { this.paused = false; this.events.get('play')?.(); return Promise.resolve(); }
    pause() { this.paused = true; this.pauses += 1; }
    removeAttribute() { this.src = ''; }
    load() {}
  };
  const audio = await moduleFor('audio-mute');
  const ambience = audio.createGameAudio('building.mp3'); ambience.loop = true;
  const soundtrack = audio.createGameAudio('power.mp3'); soundtrack.loop = true;
  assert.equal(ambience.preload, 'none');
  await ambience.play();
  audio.focusPowerAudio(soundtrack, 10000);
  assert.equal(ambience.paused, true);
  await ambience.play(); assert.equal(ambience.paused, true, 'background playback cannot override a power');
  await soundtrack.play(); assert.equal(soundtrack.paused, false);
  audio.releaseGameAudio(soundtrack);
  assert.equal(soundtrack.src, '');
  const pauses = soundtrack.pauses;
  audio.focusPowerAudio(null, 10000);
  assert.equal(soundtrack.pauses, pauses, 'released soundtracks leave the registry');
  assert.equal(audio.hasPowerAudioFocus(), true, 'a silent power still owns music focus');
  [...timers.values()].at(-1)(); assert.equal(audio.hasPowerAudioFocus(), false);

  document.querySelector = () => ({ querySelector: () => null, setAttribute() {}, addEventListener() {} });
  audio.setupAudioMute();
  await ambience.play();
  document.hidden = true; listeners.get('visibilitychange')();
  assert.equal(ambience.paused, true);
  document.hidden = false; listeners.get('visibilitychange')();
  assert.equal(ambience.paused, false, 'visible pages resume suspended music');

  let staticPixels = 0, screenBlits = 0;
  const cachedContext = { fillRect() { staticPixels += 1; } };
  document.createElement = () => ({ width: 0, height: 0, getContext: () => cachedContext });
  const television = await moduleFor('tv-render');
  const config = await moduleFor('config');
  const screenContext = { canvas: { width: 480, height: 480 }, save() {}, restore() {}, beginPath() {}, rect() {}, clip() {}, fillRect() {}, drawImage() { screenBlits += 1; } };
  television.drawTvScreen(screenContext, 0, config.TV_X, config.TV_Y);
  const firstPixels = staticPixels;
  assert.ok(firstPixels > 700);
  television.drawTvScreen(screenContext, 20, config.TV_X, config.TV_Y);
  assert.equal(staticPixels, firstPixels, 'TV reuses noise between animation frames');
  television.drawTvScreen(screenContext, 80, config.TV_X, config.TV_Y);
  assert.ok(staticPixels > firstPixels);
  television.drawTvScreen(screenContext, 150, config.TV_X - 1000, config.TV_Y);
  assert.equal(screenBlits, 3, 'offscreen TV does no rendering work');

  console.log('Web performance checks passed: frame lifecycle, audio focus, bounded soundtracks, asset loading, permanent cap and TV caching.');
} finally {
  await rm(directory, { recursive: true, force: true });
}
