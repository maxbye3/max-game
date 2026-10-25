import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { build } from 'esbuild';

export async function checkCharacterUnlocks(browser, server, directory) {
  const fixture = join(directory, 'character-unlocks.js');
  await build({ stdin: {
    contents: await readFile('js/core/main.ts', 'utf8') + `
      import { ALEX_S } from '../overworld/npcs.js';
      window.__characterTest = {
        die: () => { roadAccident.begin(player); updateRoadAccident(5, player); },
        approachWheldon: () => { player.x = ALEX_S.x; player.y = ALEX_S.y; updateRoadAccident(0, player); },
      };`,
    resolveDir: resolve('js/core'), loader: 'ts',
  }, bundle: true, format: 'iife', outfile: fixture });
  for (const viewport of [{width:320,height:568}, {width:390,height:740}, {width:844,height:390}, {width:1280,height:900}]) {
    const mobile = viewport.width < 1000;
    const page = await browser.newPage({viewport, isMobile:mobile, hasTouch:mobile});
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const ready = () => page.waitForFunction(() => !!document.querySelector('#game')?.dataset.playerVariant);
    const open = async expected => {
      await page.locator('#options-toggle').click();
      assert.equal(await page.locator('.movement-actions #character-toggle').count(), 0);
      assert.equal(await page.locator('#options-menu #character-toggle').count(), 1);
      await page.locator('#character-toggle').click();
      await page.waitForFunction(() => document.querySelector('#character-toggle').getAttribute('aria-expanded') === 'true');
      assert.deepEqual(await page.locator('#character-menu [data-character]:visible').evaluateAll(buttons => buttons.map(button => button.dataset.character)), expected);
      assert.equal(await page.locator('#options-menu').isVisible(), true, 'Options remains open behind its character submenu');
      const box = await page.locator('#character-menu').boundingBox();
      assert.ok(box.x >= 0 && box.y >= 0 && box.x + box.width <= viewport.width + 1 && box.y + box.height <= viewport.height + 1, 'character choices fit the screen');
      for (const button of await page.locator('#character-menu button:visible').all()) {
        const bounds = await button.boundingBox();
        assert.ok(bounds.width >= 44 && bounds.height >= 44);
      }
    };
    const close = async () => {
      await page.keyboard.press('Escape');
      await page.keyboard.press('Escape');
      await page.locator('#options-menu').waitFor({state:'hidden'});
    };
    const choose = async form => {
      const button = page.locator(`#character-menu [data-character="${form}"]`);
      await button.scrollIntoViewIfNeeded(); await button.click();
    };
    try {
      await page.addInitScript(() => localStorage.setItem('max-game:audio-muted', 'true'));
      await page.route('**/dist/main-bundle.js*', route => route.fulfill({path:fixture, contentType:'text/javascript'}));
      await page.goto(server.url + '/index.html?door=snow-mansion'); await ready();
      for (const mode of mobile ? ['stick', 'pad', 'split'] : ['keyboard']) {
        if (mobile) for (let tries = 0; await page.locator('.controls').getAttribute('data-mobile-controls') !== mode; tries++) {
          assert.ok(tries < 3); await page.locator('#controls-toggle').click();
        }
        await open(['player']); await close();
      }
      await page.evaluate(() => window.__characterTest.die());
      await open(['player', 'ghost-player']); await close();
      await page.evaluate(() => window.__characterTest.approachWheldon());
      await page.locator('#possess-alex').click();
      await open(['player', 'wheldon', 'ghost-player']); await close();
      await page.evaluate(() => window.__characterTest.die());
      await page.waitForFunction(() => document.querySelector('#game').dataset.playerVariant === 'ghost-wheldon');
      await open(['player', 'wheldon', 'ghost-player', 'ghost-wheldon']);
      await choose('player'); await page.getByRole('button', {name:'Close options', exact:true}).click();
      await page.reload(); await ready();
      await open(['player', 'wheldon', 'ghost-player', 'ghost-wheldon']); await close();

      // Actual seal entry completes the transformation; none of the earlier forms exposed it.
      await page.goto(server.url + '/internal/?door=northwest-portal&body=player&wheldon=0&seal=1&transformed=1'); await ready();
      const all = ['player', 'wheldon', 'ghost-player', 'ghost-wheldon', 'seal'];
      await open(all);
      assert.equal(await page.locator('[data-character="seal"]').getAttribute('aria-pressed'), 'true');
      await choose('player'); await page.waitForURL(url => !url.searchParams.has('seal')); await ready();
      assert.equal(await page.locator('#game').getAttribute('data-player-variant'), 'default');
      assert.equal(new URL(page.url()).searchParams.get('door'), 'northwest-portal');
      await open(all); await choose('seal'); await page.waitForURL(url => url.searchParams.has('seal')); await ready();
      assert.equal(await page.locator('#game').getAttribute('data-player-variant'), 'seal');

      await page.goto(server.url + '/index.html?door=snow-mansion&body=player&wheldon=0'); await ready();
      await open(all); await choose('seal'); await page.waitForURL(url => url.searchParams.has('seal')); await ready();
      assert.equal(await page.locator('#game').getAttribute('data-player-variant'), 'seal');
      await open(all); await close();
      assert.deepEqual(errors, []);
      console.log(`PASS character unlocks ${viewport.width}×${viewport.height}: fresh choices, deaths, possession, refresh, seal unlock and map/room switching.`);
    } catch (error) {
      await page.screenshot({path:`test-results/failure-character-unlocks-${viewport.width}.png`});
      throw error;
    } finally { await page.close(); }
  }
}
