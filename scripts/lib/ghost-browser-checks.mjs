import assert from 'node:assert/strict';

export async function checkGhostFlows(browser, server, mainFixture) {
  for (const viewport of [{width:390,height:740}, {width:844,height:390}, {width:1280,height:900}]) {
    const page = await browser.newPage({ viewport, isMobile: viewport.width < 1000, hasTouch: viewport.width < 1000 });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const ready = async () => {
      await page.locator('#door-loading').waitFor({state:'hidden'});
      await page.waitForFunction(() => !!document.querySelector('#game').dataset.playerVariant);
    };
    const position = () => page.locator('#game').evaluate(canvas => ({x:Number(canvas.dataset.playerX), y:Number(canvas.dataset.playerY)}));
    const select = async character => {
      await page.locator('#options-toggle').click();
      await page.locator('#character-toggle').click();
      await page.locator(`[data-character="${character}"]`).click();
      await page.getByRole('button', { name: 'Close options', exact: true }).click();
    };
    const moveRight = async () => {
      const before = await position();
      if (viewport.width < 1000) {
        const stick = await page.locator('.mobile-thumbstick').boundingBox();
        await page.mouse.move(stick.x + stick.width / 2 + 35, stick.y + stick.height / 2);
        await page.mouse.down();
      } else await page.keyboard.down('ArrowRight');
      try {
        await page.waitForFunction(x => Number(document.querySelector('#game').dataset.playerX) > x, before.x, {timeout:5000});
      } finally {
        if (viewport.width < 1000) await page.mouse.up();
        else await page.keyboard.up('ArrowRight');
      }
    };
    try {
      await page.addInitScript(() => localStorage.setItem('max-game:audio-muted', 'true'));
      await page.route('**/dist/main-bundle.js*', route => route.fulfill({path:mainFixture, contentType:'text/javascript'}));
      await page.goto(`${server.url}/index.html?door=garden-room&debug-position`);
      await ready();
      const doors = await page.evaluate(() => window.__gameTest.doors);
      const wheldon = viewport.width >= 1000;
      const ghost = wheldon ? 'ghost-wheldon' : 'ghost-player';
      for (const door of doors) {
        await page.goto(`${server.url}/internal/index.html?door=${door.id}&body=ghost&wheldon=${Number(wheldon)}`);
        await ready();
        assert.equal(await page.locator('#game').getAttribute('data-player-variant'), wheldon ? 'ghost-wheldon' : 'ghost');
        await page.locator('.interior-exit').evaluate(link => { const url = new URL(link.href); url.searchParams.set('debug-position', ''); link.href = url; });
        await page.locator('.interior-exit').click();
        await ready();
        assert.equal(new URL(page.url()).searchParams.get('door'), door.id);
        assert.deepEqual(await position(), {x:door.x + door.width / 2, y:door.y + door.height + 12}, `${ghost} exits beside ${door.id}`);
      }

      // Start Tim's scene alive, then change form while he is following.
      await page.evaluate(() => {
        localStorage.removeItem('max-game:tim-at-music-shop');
        localStorage.removeItem('max-game:tim-at-cinema');
      });
      await page.goto(`${server.url}/index.html?door=gym&body=player&wheldon=0&debug-position`);
      await ready();
      await page.waitForFunction(() => window.__gameTest.timScene().blocking);
      await select(ghost);
      await page.waitForFunction(() => !!window.__gameTest.timScene().dialogue);
      await page.evaluate(() => window.__gameTest.moveToNpc('joe'));
      await page.locator('#npc-dialogue').waitFor({state:'visible'});
      assert.equal(await page.locator('#npc-speaker').textContent(), 'Joe');
      await page.waitForFunction(() => !window.__gameTest.timScene().blocking, null, {timeout:7000});
      await moveRight();
      await page.waitForFunction(() => window.__gameTest.timScene().atMusicShop, null, {timeout:15000});

      // His next scene waits for movement; dialogue must not trap the ghost.
      await page.goto(`${server.url}/index.html?door=music-shop&body=ghost&wheldon=${Number(wheldon)}&debug-position`);
      await ready();
      await page.waitForFunction(() => !!window.__gameTest.timScene().dialogue);
      await page.evaluate(() => window.__gameTest.moveToNpc('sam'));
      await page.locator('#npc-dialogue').waitFor({state:'visible'});
      await moveRight();
      await page.waitForFunction(() => window.__gameTest.timScene().atCinema, null, {timeout:15000});
      assert.deepEqual(errors, [], 'ghost doorway navigation and Tim scenes have no browser exceptions');
      console.log(`PASS ghost flow ${viewport.width}×${viewport.height}: ${doors.length} doorway returns; Tim reaches music shop and cinema after NPC dialogue; movement resumes.`);
    } catch (error) {
      await page.screenshot({path:`test-results/failure-ghost-flow-${viewport.width}.png`});
      throw error;
    } finally { await page.close(); }
  }
}
