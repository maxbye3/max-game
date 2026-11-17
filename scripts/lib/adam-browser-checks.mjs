import assert from 'node:assert/strict';

export async function checkAdamEngagement(browser, server) {
  for (const viewport of [{ width: 320, height: 568 }, { width: 844, height: 390 }, { width: 1280, height: 900 }]) for (const interior of [false, true]) {
    const page = await browser.newPage({ viewport, isMobile: viewport.width < 1000, hasTouch: viewport.width < 1000 });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    try {
      await page.addInitScript(() => {
        localStorage.setItem('max-game:inventory-gifts', '["adam-item"]');
        localStorage.setItem('max-game:audio-muted', 'true');
        window.__engagementPlays = 0;
        window.__engagementFrames = 0;
        const drawImage = CanvasRenderingContext2D.prototype.drawImage;
        CanvasRenderingContext2D.prototype.drawImage = function(...args) {
          if (this.canvas.closest('.engagement-dialog')) {
            const source = args[0].src;
            if (source.endsWith('/adam/adam.png')) {
              window.__ringX = args[1] + 295 * args[3] / 613;
              window.__topHandY = args[2];
              window.__adamHandWidth = args[3] * 444 / 613;
              window.__engagementFrames++;
            } else if (source.endsWith('/adam/maddy.png')) {
              window.__fingerX = args[1] + 343 * args[3] / 941;
              window.__bottomHandY = args[2];
              window.__maddyHandWidth = args[3] * 909 / 941;
            }
          }
          return drawImage.apply(this, args);
        };
        const play = HTMLMediaElement.prototype.play;
        HTMLMediaElement.prototype.play = function(...args) {
          if (this.src.endsWith('/adam/congratulations.mp3')) { window.__engagementPlays++; window.__congratulations = this; }
          return play.apply(this, args);
        };
      });
      await page.goto(server.url + (interior ? '/internal/index.html?debug-position' : '/index.html?door=snow-mansion&debug-position'));
      await page.locator('#door-loading').waitFor({ state: 'hidden' });
      await page.locator('#inventory-toggle').click();
      await page.locator('[data-item-id="adam-item"] button', { hasText: 'Use' }).click();
      const dialog = page.locator('.engagement-dialog');
      await dialog.waitFor({ state: 'visible' });
      await page.waitForFunction(() => Math.abs(window.__ringX - window.__fingerX) > 90);
      assert.ok(await page.evaluate(() => Math.abs(window.__adamHandWidth - window.__maddyHandWidth) < 1), 'both hands have equal visible width');
      await page.locator('.engagement-tap').click();
      await page.waitForFunction(() => window.__topHandY > -75 && window.__bottomHandY < 220);
      const stopped = await page.evaluate(() => ({ ring: window.__ringX, finger: window.__fingerX, top: window.__topHandY, bottom: window.__bottomHandY }));
      await page.waitForTimeout(80);
      const advancing = await page.evaluate(() => ({ ring: window.__ringX, finger: window.__fingerX, top: window.__topHandY, bottom: window.__bottomHandY }));
      assert.equal(advancing.ring, stopped.ring, 'the ring stops moving sideways on every tap');
      assert.equal(advancing.finger, stopped.finger, 'the finger stops moving sideways on every tap');
      assert.ok(advancing.top > stopped.top && advancing.bottom < stopped.bottom, 'both hands advance toward each other');
      await page.getByText('Not quite! Try the next pass.').waitFor();
      await page.locator('.engagement-tap:enabled').waitFor();
      assert.equal(await page.evaluate(() => window.__engagementPlays), 0, 'a miss does not play the celebration');
      assert.equal(await dialog.evaluate(panel => {
        const box = panel.getBoundingClientRect();
        return box.left >= 0 && box.right <= innerWidth && box.top >= 0 && box.bottom <= innerHeight && panel.scrollWidth <= panel.clientWidth;
      }), true);
      await page.screenshot({ path: `test-results/adam-${interior ? 'room' : 'world'}-${viewport.width}.png` });
      await page.waitForFunction(() => {
        if (Math.abs(window.__ringX - window.__fingerX) > 5) return false;
        document.querySelector('.engagement-tap').click();
        return true;
      }, null, { polling: 'raf' });
      await page.locator('.engagement-result', { hasText: 'Congratulations!' }).waitFor();
      assert.equal(await page.evaluate(() => window.__engagementPlays), 1);
      assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('max-game:inventory-gifts')).includes('adam-item')), false, 'one activation consumes one ring');
      await page.keyboard.press('Space');
      assert.equal(await page.evaluate(() => window.__engagementPlays), 1, 'extra taps never replay the congratulations');
      await page.screenshot({ path: `test-results/adam-engaged-${interior ? 'room' : 'world'}-${viewport.width}.png` });
      await page.keyboard.press('Escape');
      await dialog.waitFor({ state: 'detached' });
      const frames = await page.evaluate(() => window.__engagementFrames);
      await page.waitForTimeout(120);
      assert.equal(await page.evaluate(() => window.__engagementFrames), frames, 'closing cancels the animation');
      assert.equal(await page.evaluate(() => window.__congratulations.paused), true, 'closing stops the congratulations');
      assert.deepEqual(errors, []);
    } finally { await page.close(); }
  }
  console.log('PASS Adam engagement: stopped sideways motion, forward attempts, retry after misses, success audio and cleanup in six desktop/phone world/room layouts.');
}
