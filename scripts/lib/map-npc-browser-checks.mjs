import assert from 'node:assert/strict';

const ids = ['dan', 'bochra', 'ju', 'chris', 'katy', 'marinaD', 'ruby', 'maddy'];
const spot = ({x, y}) => ({x, y});

export async function checkMapNpcPositions(browser, server, mainFixture) {
  for (const viewport of [{width:390,height:740}, {width:844,height:390}, {width:1280,height:900}]) {
    const mobile = viewport.width < 1000;
    const page = await browser.newPage({viewport, isMobile:mobile, hasTouch:mobile});
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const ready = async () => {
      await page.locator('#door-loading').waitFor({state:'hidden'});
      await page.waitForFunction(() => !!document.querySelector('#game').dataset.playerVariant);
    };
    try {
      await page.addInitScript(() => localStorage.setItem('max-game:audio-muted', 'true'));
      await page.route('**/dist/main-bundle.js*', route => route.fulfill({path:mainFixture, contentType:'text/javascript'}));
      await page.goto(`${server.url}/index.html?door=garden-room&debug-position`);
      let previous, fixed;
      for (let visit = 0; visit < 3; visit++) {
        await ready();
        const npcs = await page.evaluate(() => window.__gameTest.npcPositions());
        const moving = npcs.filter(npc => ids.includes(npc.id));
        const stationary = npcs.filter(npc => !ids.includes(npc.id));
        const sprites = await page.evaluate(() => window.__gameTest.mapNpcPositions());
        const targets = await page.evaluate(() => window.__gameTest.powerTargets());
        assert.equal(new Set(moving.map(npc => `${npc.x},${npc.y}`)).size, ids.length);
        if (fixed) assert.deepEqual(stationary, fixed, 'unlisted NPCs keep their positions');
        fixed = stationary;
        for (const npc of moving) {
          if (previous) assert.notDeepEqual(spot(npc), spot(previous.find(old => old.id === npc.id)), `${npc.name} moves on reload and after a room visit`);
          if (npc.id !== 'katy') {
            assert.deepEqual(spot(sprites.find(sprite => sprite.id === (npc.id === 'marinaD' ? 'marina-d' : npc.id))), spot(npc), 'sprite and dialogue positions agree');
          }
          assert.deepEqual(spot(targets.find(target => target.id === (npc.id === 'marinaD' ? 'marina' : npc.id))), spot(npc), 'powers target the displayed character');
          await page.evaluate(id => window.__gameTest.moveToNpc(id), npc.id);
          await page.waitForFunction(name => !document.querySelector('#npc-dialogue').hidden && document.querySelector('#npc-speaker').textContent === name, npc.name);
          const panel = await page.locator('#npc-dialogue').boundingBox();
          assert.ok(panel.x >= 0 && panel.y >= 0 && panel.x + panel.width <= viewport.width + 1 && panel.y + panel.height <= viewport.height + 1, 'dialogue at a new location fits the viewport');
        }
        await page.locator('#npc-dialogue-close').click();
        const before = await page.locator('#game').evaluate(canvas => Number(canvas.dataset.playerX));
        if (mobile) {
          const stick = await page.locator('.mobile-thumbstick').boundingBox();
          await page.mouse.move(stick.x + stick.width / 2 + 35, stick.y + stick.height / 2);
          await page.mouse.down();
        } else await page.keyboard.down('ArrowRight');
        try { await page.waitForFunction(x => Number(document.querySelector('#game').dataset.playerX) > x, before, {timeout:5000}); }
        finally { if (mobile) await page.mouse.up(); else await page.keyboard.up('ArrowRight'); }
        assert.deepEqual(await page.evaluate(() => window.__gameTest.npcPositions()), npcs, 'positions remain stable during play');
        previous = moving;
        if (visit === 0) {
          const saved = await page.evaluate(() => sessionStorage.getItem('max-game:map-npc-layout'));
          await page.locator('#jump-toggle').click();
          await page.getByRole('button', {name:'Plant Room', exact:true}).click();
          await ready();
          assert.equal(await page.evaluate(() => sessionStorage.getItem('max-game:map-npc-layout')), saved, 'entering a room does not replace the outdoor layout');
          await page.locator('.interior-exit').evaluate(link => { const url = new URL(link.href); url.searchParams.set('debug-position', ''); link.href = url; });
          await page.locator('.interior-exit').click();
        } else if (visit === 1) await page.reload();
      }
      assert.deepEqual(errors, [], 'shuffled NPCs introduce no browser exceptions');
      console.log(`PASS map NPC positions ${viewport.width}×${viewport.height}: eight characters move on reload and room return; dialogue, drawing, powers and movement agree.`);
    } catch (error) {
      await page.screenshot({path:`test-results/failure-map-npc-positions-${viewport.width}.png`});
      throw error;
    } finally { await page.close(); }
  }
}
