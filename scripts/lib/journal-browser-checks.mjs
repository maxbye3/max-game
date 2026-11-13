import assert from 'node:assert/strict';

export async function checkJournalProtection(browser, server, interiorFixture) {
  for (const viewport of [{ width: 390, height: 740 }, { width: 844, height: 390 }, { width: 1280, height: 900 }]) {
    const page = await browser.newPage({ viewport, isMobile: viewport.width < 1000, hasTouch: viewport.width < 1000 });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    try {
      // Exercise real image elements without downloading personal journal pages.
      await page.route('https://lh3.googleusercontent.com/**', route => route.fulfill({
        contentType: 'image/png', body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j7IoAAAAASUVORK5CYII=', 'base64'),
      }));
      await page.addInitScript(() => {
        localStorage.clear();
        localStorage.setItem('max-game:audio-muted', 'true');
        localStorage.setItem('max-game:alex-w:eatenDoughnut', 'true');
      });
      await page.goto(`${server.url}/internal/index.html?door=diary-lab-left&body=player&wheldon=0`);
      await page.locator('#door-loading').waitFor({ state: 'hidden' });
      assert.equal(await page.locator('#journal-gallery img, #workout-gallery img').count(), 0);
      await page.evaluate(() => { document.querySelector('#journal-gallery-panel').hidden = false; });
      assert.equal(await page.locator('#journal-gallery img').count(), 0, 'unhiding a locked panel reveals no journal pages');
      await page.goto(`${server.url}/internal/index.html?door=diary-lab-left&body=player&wheldon=1`);
      await page.locator('#alex-journal-yes').click();
      await page.locator('#journal-gallery button').first().waitFor();
      await page.waitForFunction(() => document.activeElement === document.querySelector('#journal-gallery button'));
      await page.locator('#journal-gallery button').first().click();
      await page.locator('#journal-lightbox').waitFor({ state: 'visible' });
      await page.locator('#journal-lightbox-next').click();
      assert.match(await page.locator('#journal-lightbox-counter').textContent(), /^2 \/ /);
      await page.locator('#journal-lightbox-close').click();
      await page.locator('#journal-gallery-close').click();
      assert.equal(await page.locator('#journal-gallery img').count(), 0);
      assert.equal(await page.locator('#journal-lightbox-image').getAttribute('src'), null);

      await page.route('**/dist/internal-bundle.js*', route => route.fulfill({ path: interiorFixture, contentType: 'text/javascript' }));
      await page.goto(`${server.url}/internal/index.html?door=gym&body=player&wheldon=1`);
      await page.locator('#door-loading').waitFor({ state: 'hidden' });
      await page.waitForFunction(() => !!window.__gameTest);
      await page.evaluate(() => {
        window.__gameTest.openNpc('julian');
        document.querySelector('#noel-dialogue-next').click();
      });
      await page.locator('#tim-workout-journal-yas').click();
      await page.locator('#workout-gallery button').first().waitFor();
      await page.locator('#workout-gallery button').first().click();
      await page.locator('#workout-lightbox').waitFor({ state: 'visible' });
      await page.locator('#workout-lightbox-close').click();
      await page.locator('#tim-workout-journal-close').click();
      assert.equal(await page.locator('#workout-gallery img').count(), 0);
      assert.equal(await page.locator('#workout-lightbox-image').getAttribute('src'), null);
      assert.deepEqual(errors, []);
      console.log(`PASS journals ${viewport.width}×${viewport.height}: locked DOM, decryption, page navigation and clearing on close.`);
    } catch (error) {
      await page.screenshot({ path: `test-results/failure-journal-${viewport.width}.png` });
      throw error;
    } finally { await page.close(); }
  }
}
