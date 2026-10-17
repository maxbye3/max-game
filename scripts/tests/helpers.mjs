import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';

/** Each suite gets fresh storage, DOM, timers and bundled modules. No suite ordering dependencies. */
export async function withGameTest(run) {
  const directory = await mkdtemp(join(tmpdir(), 'max-game-tests-'));
  let moduleIndex = 0;
  const loadModule = async (name, source, extraExports = '') => {
    const outfile = join(directory, `${++moduleIndex}.mjs`);
    const input = extraExports ? { stdin: { contents: `export * from './${source}'; ${extraExports}`, resolveDir: process.cwd() } } : { entryPoints: [source] };
    await build({ ...input, outfile, bundle: true, format: 'esm', platform: 'node' });
    return import(pathToFileURL(outfile).href);
  };
  const values = new Map();
  const session = new Map();
  const storage = map => ({ getItem: key => map.get(key) ?? null, setItem: (key, value) => map.set(key, value), removeItem: key => map.delete(key) });
  const elements = new Map();
  function element(selector) {
    if (!elements.has(selector)) elements.set(selector, {
      hidden: false, textContent: '', src: '', children: [], listeners: new Map(),
      classList: { toggle() {} },
      setAttribute() {}, removeAttribute(name) { if (name === 'src') this.src = ''; }, remove() {},
      getContext() { return {}; },
      append(...children) { this.children.push(...children); },
      replaceChildren(...children) { this.children = children; },
      focus() {}, showModal() { this.open = true; }, close() { this.open = false; },
      addEventListener(event, callback) { this.listeners.set(event, callback); },
    });
    return elements.get(selector);
  }
  const scheduledCallbacks = [];
  globalThis.window = {
    localStorage: storage(values), sessionStorage: storage(session),
    location: { href: 'http://localhost/', search: '', protocol: 'http:' },
    addEventListener() {}, removeEventListener() {}, dispatchEvent() {},
    setInterval: () => 1, clearInterval() {}, clearTimeout() {},
    setTimeout: callback => { scheduledCallbacks.push(callback); return scheduledCallbacks.length; },
  };
  globalThis.document = {
    addEventListener() {}, removeEventListener() {}, baseURI: 'http://localhost/',
    querySelectorAll: () => [],
    querySelector: selector => selector.startsWith('script') ? null : element(selector),
    createElement: tag => element(`${tag}-${elements.size}`),
  };
  globalThis.Audio = class {
    preload = ''; currentTime = 0;
    addEventListener() {} removeEventListener() {}
    play() { return Promise.resolve(); } pause() {} removeAttribute() {} load() {}
  };
  try { await run({ loadModule, values, element, scheduledCallbacks }); }
  finally { await rm(directory, { recursive: true, force: true }); }
}
