import { chromium } from 'playwright';
import { mkdir, stat, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { serveGame } from './lib/browser-fixture.mjs';

// Profile shipped bundles with a fresh cache, 4 Mbps, 80 ms latency and 4x CPU
// slowdown. Request sizes include in-flight files; readyMs measures playable entry.
const output = process.argv[2] ?? 'test-results/loading-profile.json';
const cases = [
  ['First map visit', '/index.html'],
  ['Returning map', '/index.html?door=snow-mansion'],
  ...['diary-lab-left', 'job-center', 'northwest-portal', 'cinema', 'feedback-center', 'garden-room', 'music-shop', 'gym', 'bookshop', 'artist-studio', 'snow-mansion'].map(door => [door, `/internal/?door=${door}`]),
  ['Transformation', '/transform.html'],
  ['Niall battle', '/niall-fight/'],
];
const server = await serveGame();
const browser = await chromium.launch();
const results = [];
try {
  for (const [name, path] of cases) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    try {
      const page = await context.newPage();
      const client = await context.newCDPSession(page);
      const requested = new Set(), errors = [];
      page.on('request', request => {
        if (request.url().startsWith(server.url)) requested.add(new URL(request.url()).pathname);
      });
      page.on('pageerror', error => errors.push(error.message));
      await page.addInitScript(() => {
        window.__loadingTasks = [];
        window.__frameWork = [];
        const frame = requestAnimationFrame.bind(window);
        window.requestAnimationFrame = callback => frame(time => {
          const start = performance.now();
          callback(time);
          window.__frameWork.push(performance.now() - start);
        });
        new PerformanceObserver(list => window.__loadingTasks.push(...list.getEntries().map(task => ({ start: task.startTime, ms: task.duration })))).observe({ type: 'longtask', buffered: true });
      });
      await client.send('Network.enable');
      await client.send('Network.setCacheDisabled', { cacheDisabled: true });
      await client.send('Network.emulateNetworkConditions', { offline: false, latency: 80, downloadThroughput: 500000, uploadThroughput: 100000 });
      await client.send('Emulation.setCPUThrottlingRate', { rate: 4 });
      await page.goto(server.url + path, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(name => {
        if (name === 'Transformation') return document.querySelector('#game')?.dataset.sceneStage === 'dialogue';
        if (name === 'Niall battle') return [...document.querySelectorAll('#niall-battler, #player-battler')].every(image => image.complete && image.naturalWidth > 0 && image.src.includes('/img/'));
        return !!document.querySelector('#game')?.dataset.playerVariant;
      }, name, { timeout: 120000 });
      const initial = await page.evaluate(() => ({
        readyMs: Math.round(performance.getEntriesByName('max-game:ready')[0]?.startTime ?? performance.now()),
        resources: performance.getEntriesByType('resource').map(resource => ({ file: new URL(resource.name).pathname, bytes: resource.transferSize, ms: Math.round(resource.duration), initiator: resource.initiatorType, startMs: Math.round(resource.startTime), endMs: Math.round(resource.responseEnd) })),
        longTasks: window.__loadingTasks,
      }));
      // Sample real frame callbacks while deferred art and audio are loading.
      await page.evaluate(() => { window.__frameWork = []; });
      await page.waitForTimeout(2000);
      const frameWork = await page.evaluate(() => {
        const samples = window.__frameWork.slice().sort((a, b) => a - b);
        return { samples: samples.length, p50Ms: samples[Math.floor(samples.length * 0.5)] ?? 0, p95Ms: samples[Math.floor(samples.length * 0.95)] ?? 0, maxMs: samples.at(-1) ?? 0 };
      });
      const assets = await Promise.all([...requested].map(async file => ({ file, bytes: (await stat(resolve('.' + file)).catch(() => ({ size: 0 }))).size })));
      const result = { name, ...initial, frameWork, requested: assets.sort((a, b) => b.bytes - a.bytes), errors };
      results.push(result);
      console.log(`${name}: ${(initial.readyMs / 1000).toFixed(2)}s; frame p95 ${frameWork.p95Ms.toFixed(1)}ms; ${(assets.reduce((sum, asset) => sum + asset.bytes, 0) / 1e6).toFixed(2)} MB requested; ${errors.length} errors`);
      if (errors.length) throw new Error(errors.join('\n'));
    } finally { await context.close(); }
  }
} finally {
  await browser.close();
  await server.close();
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, JSON.stringify(results, null, 2) + '\n');
}
console.log(`Saved ${output}`);
