import assert from 'node:assert/strict';

export async function checkOptionsMenu(browser, server, fixtures) {
  for (const viewport of [{width:320,height:568}, {width:390,height:740}, {width:844,height:390}, {width:1280,height:900}]) {
    for (const interior of [false, true]) {
      const mobile = viewport.width < 1000;
      const page = await browser.newPage({viewport, isMobile:mobile, hasTouch:mobile});
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      const ready = async () => {
        await page.locator('#door-loading').waitFor({state:'hidden'});
        await page.waitForFunction(() => !!document.querySelector('#game').dataset.playerVariant);
      };
      const position = () => page.evaluate(() => window.__gameTest.playerPosition());
      const open = async () => {
        await page.locator('#options-toggle').click();
        await page.waitForFunction(() => document.querySelector('#options-toggle').getAttribute('aria-expanded') === 'true');
      };
      try {
        await page.addInitScript(() => localStorage.setItem('max-game:audio-muted', 'true'));
        await page.route('**/dist/main-bundle.js*', route => route.fulfill({path:fixtures[0], contentType:'text/javascript'}));
        await page.route('**/dist/internal-bundle.js*', route => route.fulfill({path:fixtures[1], contentType:'text/javascript'}));
        await page.goto(`${server.url}/${interior ? 'internal/' : ''}index.html?door=garden-room`);
        await ready();
        assert.equal(await page.locator('#options-menu').isVisible(), false);
        assert.equal(await page.locator('.top-actions #audio-mute-toggle, .movement-actions #thoughts-toggle').count(), 0, 'actions have moved inside Options');
        for (const mode of mobile ? ['stick', 'pad', 'split'] : ['keyboard']) {
          if (mobile) for (let tries = 0; await page.locator('.controls').getAttribute('data-mobile-controls') !== mode; tries++) {
            assert.ok(tries < 3); await page.locator('#controls-toggle').click();
          }
          await open();
          const menu = page.locator('#options-menu');
          const bounds = await menu.boundingBox();
          assert.ok(bounds.x >= 0 && bounds.y >= 0 && bounds.x + bounds.width <= viewport.width + 1 && bounds.y + bounds.height <= viewport.height + 1, 'Options fits the viewport');
          assert.ok(await menu.evaluate(element => element.scrollWidth <= element.clientWidth + 1), 'Options has no horizontal overflow');
          assert.equal(await menu.getByRole('button', {name:'Reset game', exact:true}).count(), 1);
          assert.equal(await menu.getByRole('button', {name:'Thoughts and feedback', exact:true}).count(), 1);
          for (const button of await menu.locator('button:visible').all()) {
            const box = await button.boundingBox();
            assert.ok(box.width >= 44 && box.height >= 44, 'options have phone-friendly touch targets');
            assert.ok(await button.evaluate(element => {
              const box = element.getBoundingClientRect();
              return element.contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2));
            }), 'options are clickable above the game and controls');
          }
          const before = await position();
          await page.keyboard.down('ArrowDown');
          await page.waitForTimeout(80);
          assert.deepEqual(await position(), before, 'opening Options pauses movement');
          await menu.getByRole('button', {name:'Close options', exact:true}).click();
          await page.waitForTimeout(80);
          assert.deepEqual(await position(), before, 'closing Options releases held movement');
          await page.keyboard.up('ArrowDown');

          await open();
          await page.locator('#audio-mute-toggle').click();
          assert.equal(await page.evaluate(() => localStorage.getItem('max-game:audio-muted')), 'false');
          assert.equal(await page.locator('.audio-mute-label').textContent(), 'Mute');
          if (viewport.width === 390 && !interior && mode === 'stick') await page.screenshot({path:'test-results/options-phone.png'});
          if (!mobile && !interior) await page.screenshot({path:'test-results/options-desktop.png'});
          await page.locator('#audio-mute-toggle').click();
          assert.equal(await page.locator('#audio-mute-toggle').getAttribute('aria-pressed'), 'true');
          await page.locator('#thoughts-toggle').click();
          await page.locator('#thoughts-dialog').waitFor({state:'visible'});
          assert.equal(await page.locator('#options-menu').isVisible(), false, 'feedback closes Options');
          assert.equal(await page.locator('#thoughts-title').textContent(), 'Thoughts and feedback');
          assert.ok(await page.locator('#thoughts-name').evaluate(element => document.activeElement === element));
          await page.locator('#thoughts-name').fill('wasd');
          await page.keyboard.press('ArrowDown');
          assert.deepEqual(await position(), before, 'typing feedback does not move the player');
          assert.ok(await page.locator('#thoughts-dialog').evaluate(element => element.scrollWidth <= element.clientWidth + 1), 'the feedback title wraps on phones');
          await page.getByRole('button', {name:'Close thoughts and feedback', exact:true}).click();
          assert.ok(await page.locator('#options-toggle').evaluate(element => document.activeElement === element), 'feedback returns focus to the visible Options button');
          await open();
          await page.keyboard.press('Escape');
          await page.waitForFunction(() => document.querySelector('#options-toggle').getAttribute('aria-expanded') === 'false');
          assert.equal(await menu.isVisible(), false);
          await open();
          await page.locator('#inventory-toggle').click();
          assert.equal(await menu.isVisible(), false, 'clicking outside dismisses Options');
          await page.locator('#inventory-close').click();
        }

        const before = await position();
        await page.keyboard.down('ArrowDown');
        try { await page.waitForFunction(y => window.__gameTest.playerPosition().y > y, before.y, {timeout:5000}); }
        finally { await page.keyboard.up('ArrowDown'); }
        await page.evaluate(() => {
          localStorage.setItem('max-game:niall-quest-state', 'busStop');
          localStorage.setItem('max-game:tim-at-music-shop', 'true');
          localStorage.setItem('max-game:tim-at-cinema', 'true');
          localStorage.setItem('max-game:mike-aftermath', 'true');
          localStorage.setItem('max-game:unlocked-songs', '["Africa"]');
          localStorage.setItem('max-game:alex-w:eatenDoughnut', 'true');
          localStorage.setItem('max-game:player-body', 'alex-s');
          localStorage.setItem('max-game:wheldon-player-sprite', 'true');
        });
        await open();
        await page.getByRole('button', {name:'Reset game', exact:true}).click();
        await page.waitForURL(`${server.url}/index.html`);
        await ready();
        const reset = await page.evaluate(() => Object.fromEntries([
          'max-game:niall-quest-state', 'max-game:tim-at-music-shop', 'max-game:tim-at-cinema',
          'max-game:mike-aftermath', 'max-game:unlocked-songs', 'max-game:alex-w:eatenDoughnut',
          'max-game:player-body', 'max-game:wheldon-player-sprite',
        ].map(key => [key, localStorage.getItem(key)])));
        assert.deepEqual(Object.values(reset), ['hostile', 'false', 'false', 'false', null, 'false', 'player', 'false'], 'Reset game preserves the existing reset behavior from either page');
        assert.deepEqual(errors, []);
        console.log(`PASS Options ${interior ? 'interior' : 'overworld'} ${viewport.width}×${viewport.height}: mute, reset, feedback, keyboard dismissal and movement.`);
      } catch (error) {
        await page.screenshot({path:`test-results/failure-options-${interior ? 'interior' : 'overworld'}-${viewport.width}.png`});
        throw error;
      } finally { await page.close(); }
    }
  }
}
