import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { buildBrowserFixture, serveGame } from './lib/browser-fixture.mjs';

if (!process.argv.includes('--prepared')) {
  for (const script of ['scripts/generate-source.mjs', 'scripts/bundle.mjs']) {
    const result = spawnSync(process.execPath, [script], { stdio: 'inherit' });
    if (result.status !== 0) process.exit(result.status ?? 1);
  }
}
await mkdir('test-results', { recursive: true });
const directory = await mkdtemp(join(tmpdir(), 'max-browser-tests-'));
const server = await serveGame();
let browser;
const overlaps = (a, b) => a.x < b.x + b.width - 1 && a.x + a.width > b.x + 1 && a.y < b.y + b.height - 1 && a.y + a.height > b.y + 1;
async function assertDialogueActions(panel) {
  if (!await panel.evaluate(element => element.matches('.npc-dialogue'))) return;
  for (const action of await panel.locator('.npc-dialogue-close:visible, .npc-dialogue-next:visible').all()) {
    assert.ok(await action.evaluate(element => {
      const box = element.getBoundingClientRect();
      const panel = element.closest('.npc-dialogue').getBoundingClientRect();
      return box.top >= panel.top && box.bottom <= panel.bottom &&
        [4, box.width - 4].every(x => [4, box.height - 4].every(y => element.contains(document.elementFromPoint(box.x + x, box.y + y))));
    }), 'Close and Next remain fully visible and clickable');
  }
}
try {
  const fixtures = [await buildBrowserFixture(false, directory), await buildBrowserFixture(true, directory)];
  browser = await chromium.launch({ headless: !process.argv.includes('--headed'), ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}) });
  let layouts = 0;
  for (const viewport of [{width:320,height:568}, {width:390,height:740}, {width:844,height:390}, {width:1280,height:900}]) {
    for (const interior of [false, true]) {
      const mobile = viewport.width < 1000;
      const page = await browser.newPage({ viewport, isMobile: mobile, hasTouch: mobile });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      try {
        await page.addInitScript(() => {
          localStorage.clear(); localStorage.setItem('max-game:audio-muted', 'true');
          const raf = requestAnimationFrame.bind(window);
          window.requestAnimationFrame = callback => window.pauseGameTest ? 0 : raf(callback);
        });
        await page.route(interior ? '**/dist/internal-bundle.js*' : '**/dist/main-bundle.js*', route => route.fulfill({ path: fixtures[Number(interior)], contentType: 'text/javascript' }));
        await page.goto(server.url + (interior ? '/internal/index.html' : '/index.html?door=snow-mansion'));
        await page.locator('#door-loading').waitFor({ state: 'hidden' });
        await page.waitForFunction(() => !!window.__gameTest);
        assert.ok(await page.locator('#game').isVisible());
        await page.evaluate(() => { window.pauseGameTest = true; });
        await page.waitForTimeout(80);
        await page.evaluate(() => document.fonts.ready);
        const npc = interior ? '#noel-dialogue' : '#npc-dialogue';
        if (!interior) {
          await page.evaluate(() => window.__gameTest.openNpc('sam'));
          assert.equal(await page.locator('#npc-dialogue-profile').isVisible(), true);
          assert.equal(await page.locator('#npc-dialogue-profile').getAttribute('src'), 'char/sam/profile.png');
          await page.evaluate(() => window.__gameTest.openNpc('rei'));
          assert.equal(await page.locator('#npc-dialogue-profile').isVisible(), false);
          assert.equal(await page.locator('#npc-dialogue-profile').getAttribute('src'), null);
        } else {
          await page.evaluate(() => window.__gameTest.openNpc('wheldon'));
          assert.ok(await page.locator(npc).isVisible(), 'real interior dialogue opens');
        }
        for (const mode of mobile ? ['stick', 'pad', 'split'] : ['keyboard']) {
          if (mobile) {
            for (let tries = 0; await page.locator('.controls').getAttribute('data-mobile-controls') !== mode; tries++) {
              assert.ok(tries < 3, 'the layout toggle cycles through all three modes');
              await page.locator('#controls-toggle').click();
            }
          }
          for (const selector of interior ? [npc] : [npc, '#niall-dialogue', '#sign-dialogue']) {
            await page.evaluate(selector => {
              document.querySelectorAll('.npc-dialogue, .sign-dialogue').forEach(panel => { panel.hidden = true; });
              const panel = document.querySelector(selector);
              panel.querySelector('p').textContent = 'Keep exploring the village, meet the other characters and discover their stories. '.repeat(25);
              const next = panel.querySelector('.npc-dialogue-next');
              if (next) next.hidden = false;
              panel.hidden = false; panel.scrollTop = 0;
            }, selector);
            const panel = page.locator(selector), bounds = await panel.boundingBox();
            assert.ok(bounds.x >= 0 && bounds.y >= 0 && bounds.x + bounds.width <= viewport.width + 1 && bounds.y + bounds.height <= viewport.height + 1, 'dialogue fits the viewport');
            assert.ok(bounds.height >= 60 && bounds.width >= 100, 'dialogue remains readable');
            const movement = mode === 'stick' ? '.mobile-thumbstick' : mode === 'pad' ? '.dpad' : mode === 'split' ? '.mobile-split-key' : '.keyboard-hint';
            for (const control of await page.locator(movement).all()) {
              assert.ok(!overlaps(bounds, await control.boundingBox()), `${selector} clears ${mode}`);
              if (mobile) assert.ok(await control.evaluate((element, mode) => {
                const box = element.getBoundingClientRect();
                if (mode === 'stick') return element.closest('.controls').contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2));
                return [8, box.width - 8].every(x => [8, box.height - 8].every(y =>
                  element.closest('.controls').contains(document.elementFromPoint(box.x + x, box.y + y))));
              }, mode), `${selector} ${mode} movement touch targets are exposed`);
            }
            assert.ok(!overlaps(bounds, await page.locator('.movement-actions').boundingBox()), 'dialogue clears the action buttons');
            const scrollable = selector === '#sign-dialogue' ? panel : panel.locator('.npc-dialogue-content');
            await assertDialogueActions(panel);
            assert.ok(await scrollable.evaluate(element => {
              element.scrollTop = element.scrollHeight;
              return element.scrollTop > 0 && element.scrollWidth <= element.clientWidth + 1;
            }), 'long dialogue scrolls without horizontal overflow');
            await assertDialogueActions(panel);
            if (selector !== '#sign-dialogue') {
              assert.ok(await scrollable.evaluate(element => element.clientHeight >= 32), 'scroll area shows at least a full line');
              const progress = panel.locator('.dialogue-progress');
              if (await progress.count()) {
                await progress.evaluate(element => { element.textContent = '2/10'; });
                assert.ok(await scrollable.evaluate(element => element.scrollTop > 0), 'status updates preserve the reading position');
              }
              await panel.locator('.dialogue-line-row p').evaluate(element => { element.textContent = 'The next long dialogue line. '.repeat(60); });
              await page.waitForFunction(selector => document.querySelector(selector + ' .npc-dialogue-content').scrollTop === 0, selector);
            }
            if (mode === 'keyboard') {
              await page.keyboard.down('ArrowRight');
              assert.ok(await page.evaluate(() => window.__gameTest.isHeld('right')));
              await page.keyboard.up('ArrowRight');
            } else {
              const directions = mode === 'stick' ? ['right'] : ['up', 'down', 'left', 'right'];
              for (const direction of directions) {
                const control = mode === 'stick' ? '.mobile-thumbstick' : mode === 'pad' ? `.dpad [data-directions="${direction}"]` : `.mobile-split-button[data-directions="${direction}"] .mobile-split-key`;
                const box = await page.locator(control).boundingBox();
                await page.mouse.move(box.x + box.width / 2 + (mode === 'stick' ? 35 : 0), box.y + box.height / 2);
                await page.mouse.down();
                assert.ok(await page.evaluate(direction => window.__gameTest.isHeld(direction), direction), `${mode} ${direction} registers through open dialogue`);
                await page.mouse.up();
                assert.equal(await page.evaluate(direction => window.__gameTest.isHeld(direction), direction), false, 'release clears held movement');
              }
            }
            if (process.argv.includes('--screenshots') && selector === npc) {
              await scrollable.evaluate(element => { element.scrollTop = 0; });
              await page.screenshot({path:`test-results/${interior ? 'interior' : 'overworld'}-${viewport.width}-${mode}.png`});
            }
            await panel.evaluate(element => { element.hidden = true; });
            layouts++;
          }
        }
        if (interior) {
          await page.goto(server.url + '/internal/index.html?door=garden-room');
          await page.locator('#door-loading').waitFor({ state: 'hidden' });
          await page.waitForFunction(() => !!window.__gameTest);
          await page.evaluate(() => { window.pauseGameTest = true; });
          await page.waitForTimeout(80);
          await page.evaluate(() => { for (let i = 0; i < 3; i++) window.__gameTest.openNpc('lucy'); });
          if (mobile) {
            while (await page.locator('.controls').getAttribute('data-mobile-controls') !== 'split') await page.locator('#controls-toggle').click();
          }
          await page.evaluate(() => document.fonts.ready);
          const panel = page.locator(npc);
          assert.match(await panel.locator('.dialogue-line-row p').textContent(), /eat bamboo/);
          await assertDialogueActions(panel);
          if (viewport.width === 390) {
            assert.ok(await panel.locator('.npc-dialogue-content').evaluate(element => element.scrollHeight <= element.clientHeight + 1), 'Lucy’s pictured line fits without scrolling');
          }
          if (process.argv.includes('--screenshots')) await page.screenshot({path:`test-results/lucy-${viewport.width}.png`});
          await page.locator('#noel-dialogue-next').click();
          await assertDialogueActions(panel);
          await page.locator('#noel-dialogue-next').click();
          assert.equal(await page.locator('#lucy-plant-diary-options').isVisible(), true, 'Lucy’s real dialogue reaches its choices');
          await page.locator('#lucy-plant-diary-neh').click();
          await assertDialogueActions(panel);
        }
        assert.deepEqual(errors, [], 'the game loads without browser exceptions');
        console.log(`PASS browser ${interior ? 'interior' : 'overworld'} ${viewport.width}×${viewport.height}`);
      } catch (error) {
        await page.screenshot({path:`test-results/failure-${interior ? 'interior' : 'overworld'}-${viewport.width}.png`});
        throw error;
      } finally { await page.close(); }
    }
  }
  console.log(`${layouts} dialogue layouts passed, including movement input and root portraits.`);
  for (const viewport of [{width:390,height:740}, {width:1280,height:900}]) {
    const page = await browser.newPage({ viewport, isMobile: viewport.width < 1000, hasTouch: viewport.width < 1000 });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => localStorage.setItem('max-game:audio-muted', 'true'));
    const ready = async () => {
      await page.locator('#door-loading').waitFor({ state: 'hidden' });
      await page.waitForFunction(() => !!document.querySelector('#game').dataset.playerVariant);
    };
    const select = async character => {
      await page.locator('#character-toggle').click();
      await page.locator(`[data-character="${character}"]`).click();
    };
    const assertPlayer = async () => {
      await ready();
      await page.waitForFunction(() => document.querySelector('#game').dataset.playerVariant === 'default');
      assert.deepEqual(await page.evaluate(() => [localStorage.getItem('max-game:player-body'), localStorage.getItem('max-game:wheldon-player-sprite')]), ['player', 'false']);
      const url = new URL(page.url());
      assert.equal(url.searchParams.has('body'), false);
      assert.equal(url.searchParams.has('wheldon'), false);
      assert.equal(url.searchParams.get('door'), 'garden-room', 'refresh preserves the room/location');
    };
    try {
      await page.goto(`${server.url}/index.html?door=garden-room`);
      await ready();
      for (const character of ['ghost-player', 'wheldon', 'ghost-wheldon']) {
        await select(character);
        await page.reload();
        await assertPlayer();
        await page.locator('#character-toggle').click();
        await page.locator('[data-character="player"][aria-pressed="true"]').waitFor({ state: 'visible' });
        assert.equal(await page.locator('[data-character="player"]').getAttribute('aria-pressed'), 'true');
        await page.locator(`[data-character="${character}"]`).click();
        await page.locator('#jump-toggle').click();
        await page.getByRole('button', { name: 'Plant Room', exact: true }).click();
        await ready();
        assert.match(page.url(), /\/internal\/index.html/);
        assert.equal(await page.locator('#game').getAttribute('data-player-variant'), character === 'wheldon' ? 'alex-s' : character === 'ghost-player' ? 'ghost' : 'ghost-wheldon', 'room navigation preserves the selected character');
        await page.reload();
        await assertPlayer();
        await page.locator('.interior-exit').click();
        await ready();
        assert.equal(await page.locator('#game').getAttribute('data-player-variant'), 'default', 'leaving the room keeps the reset player');
      }
      assert.deepEqual(errors, [], 'character refreshes have no browser exceptions');
    } catch (error) {
      await page.screenshot({path:`test-results/failure-character-refresh-${viewport.width}.png`});
      throw error;
    } finally { await page.close(); }
  }
  console.log('PASS character refresh: player restored from both ghosts and Wheldon on phone and desktop; room navigation preserves selections.');
  // Exercise shipped bundles too, including every branch of interior asset setup.
  const production = await browser.newPage({ viewport: {width:390,height:740}, isMobile: true, hasTouch: true });
  const errors = [];
  production.on('pageerror', error => errors.push(error.message));
  await production.addInitScript(() => { localStorage.clear(); localStorage.setItem('max-game:audio-muted', 'true'); });
  const doors = ['diary-lab-left', 'job-center', 'cave', 'cinema', 'feedback-center', 'garden-room', 'music-shop', 'gym', 'bookshop', 'artist-studio', 'snow-mansion'];
  try {
    for (const door of doors) {
      await production.goto(`${server.url}/internal/index.html?door=${door}`);
      await production.locator('#door-loading').waitFor({state:'hidden'});
      await production.waitForFunction(() => !!document.querySelector('#game').dataset.playerVariant);
      assert.deepEqual(errors, [], `${door} renders without browser exceptions`);
    }
    await production.goto(`${server.url}/index.html?door=snow-mansion&debug-position`);
    await production.locator('#door-loading').waitFor({state:'hidden'});
    await production.waitForFunction(() => !!document.querySelector('#game').dataset.playerY);
    const before = await production.locator('#game').evaluate(canvas => Number(canvas.dataset.playerY));
    const stick = await production.locator('.mobile-thumbstick').boundingBox();
    await production.mouse.move(stick.x + stick.width / 2, stick.y + stick.height / 2 + 35);
    await production.mouse.down();
    try { await production.waitForFunction(y => Number(document.querySelector('#game').dataset.playerY) > y, before, {timeout:5000}); }
    finally { await production.mouse.up(); }
    assert.deepEqual(errors, [], 'production overworld movement works');
    console.log(`PASS production bundles: ${doors.length} interiors render; thumbstick moves the overworld player.`);
  } catch (error) {
    await production.screenshot({path:'test-results/failure-production.png'});
    throw error;
  } finally { await production.close(); }
} finally {
  await browser?.close();
  await server.close();
  await rm(directory, { recursive: true, force: true });
}
