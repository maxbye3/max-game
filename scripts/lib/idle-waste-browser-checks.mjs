import assert from 'node:assert/strict';

/** Exercise the actual music elements and renderer, including while Options pauses updates. */
export async function checkIdleWaste(browser, server) {
  const areas = [
    ['map', '/index.html?door=snow-mansion'],
    ...['gym', 'music-shop', 'job-center', 'cinema'].map(door => [door, `/internal/?door=${door}`]),
  ];
  for (const viewport of [{ width: 390, height: 844 }, { width: 844, height: 390 }, { width: 1280, height: 900 }]) {
    for (const [area, path] of areas) {
      const mobile = viewport.width < 1000;
      const page = await browser.newPage({ viewport, isMobile: mobile, hasTouch: mobile });
      const errors = [], audioRequests = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('request', request => { if (/\.(mp3|m4a)(\?|$)/.test(request.url())) audioRequests.push(request.url()); });
      try {
        await page.addInitScript(() => {
          localStorage.setItem('max-game:audio-muted', 'true');
          window.__ambiencePlays = [];
          const play = HTMLMediaElement.prototype.play;
          HTMLMediaElement.prototype.play = function (...args) {
            if (this instanceof HTMLAudioElement && this.loop) window.__ambiencePlays.push(this);
            return play.apply(this, args);
          };
        });
        await page.goto(server.url + path);
        await page.waitForFunction(() => !!document.querySelector('#game')?.dataset.playerVariant);
        const writes = await page.evaluate(async () => {
          let count = 0;
          const observer = new MutationObserver(records => { count += records.length; });
          observer.observe(document.querySelector('#game'), { attributes: true, attributeFilter: ['data-player-variant'] });
          for (let frame = 0; frame < 24; frame++) await new Promise(requestAnimationFrame);
          observer.disconnect();
          return count;
        });
        assert.equal(writes, 0, `${area} avoids repeated variant attribute writes during steady rendering`);
        assert.equal(await page.evaluate(() => window.__ambiencePlays.length), 0, `${area} starts no muted ambience`);
        assert.deepEqual(audioRequests, [], `${area} makes no unnecessary muted audio requests`);

        await page.locator('#options-toggle').click();
        await page.locator('#audio-mute-toggle').click();
        await page.waitForFunction(() => window.__ambiencePlays.length > 0 && window.__ambiencePlays.every(audio => !audio.paused && audio.currentTime > 0));
        assert.equal(await page.locator('#options-menu').isVisible(), true, 'unmuting starts music while world updates are paused');
        await page.locator('#audio-mute-toggle').click();
        const position = await page.evaluate(() => {
          const tracks = [...new Set(window.__ambiencePlays)];
          return tracks.map(audio => ({ paused: audio.paused, time: audio.currentTime }));
        });
        assert.ok(position.every(audio => audio.paused));
        await page.waitForTimeout(100);
        assert.deepEqual(await page.evaluate(() => [...new Set(window.__ambiencePlays)].map(audio => ({ paused: audio.paused, time: audio.currentTime }))), position, 'muting stops playback without advancing its position');
        await page.locator('#audio-mute-toggle').click();
        await page.waitForFunction(() => window.__ambiencePlays.every(audio => !audio.paused));
        await page.evaluate(() => {
          Object.defineProperty(document, 'hidden', { configurable: true, value: true });
          document.dispatchEvent(new Event('visibilitychange'));
        });
        assert.equal(await page.evaluate(() => window.__ambiencePlays.every(audio => audio.paused)), true);
        await page.evaluate(() => {
          Object.defineProperty(document, 'hidden', { configurable: true, value: false });
          document.dispatchEvent(new Event('visibilitychange'));
        });
        await page.waitForFunction(() => window.__ambiencePlays.every(audio => !audio.paused));
        assert.deepEqual(errors, []);
      } finally { await page.close(); }
    }
    console.log(`PASS idle waste ${viewport.width}×${viewport.height}: five areas, muted requests, music resume and steady canvas attributes.`);
  }
}
