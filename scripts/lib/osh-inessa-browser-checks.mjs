import assert from 'node:assert/strict';

export async function checkOshAndInessa(browser, server, fixtures) {
  for (const viewport of [{width:320,height:568}, {width:390,height:740}, {width:844,height:390}, {width:1280,height:900}]) {
    for (const interior of [false, true]) {
      const page = await browser.newPage({viewport, isMobile:viewport.width < 1000, hasTouch:viewport.width < 1000});
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      try {
        await page.clock.install();
        await page.addInitScript(interior => {
          localStorage.setItem('max-game:audio-muted', 'true');
          localStorage.setItem('max-game:inventory-gifts', JSON.stringify(interior ? ['todo-guide', 'osh-item', 'inessa-item'] : ['todo-guide']));
        }, interior);
        await page.route(`**/dist/${interior ? 'internal' : 'main'}-bundle.js*`, route => route.fulfill({path:fixtures[interior ? 1 : 0], contentType:'text/javascript'}));
        await page.goto(`${server.url}/${interior ? 'internal/index.html' : 'index.html'}?door=garden-room&debug-position`);
        await page.locator('#door-loading').waitFor({state:'hidden'});
        await page.waitForFunction(() => !!document.querySelector('#game').dataset.playerVariant);
        if (!interior) {
          for (const [id, name] of [['inessa', 'Inessa'], ['osh', 'Osh']]) {
            await page.evaluate(id => window.__gameTest.moveToNpc(id), id);
            await page.waitForFunction(name => !document.querySelector('#npc-dialogue').hidden && document.querySelector('#npc-speaker').textContent === name, name);
            assert.equal(await page.locator('#npc-dialogue-profile').isVisible(), id === 'osh', 'only a root profile supplies a portrait');
            await page.locator('#npc-dialogue-next').click();
            assert.ok(await page.evaluate(id => JSON.parse(localStorage.getItem('max-game:inventory-gifts')).includes(`${id}-item`), id), 'the actual approach and gift interaction work');
            await page.locator('#npc-dialogue-close').click();
          }
        }
        const use = async id => {
          await page.locator('#inventory-toggle').click();
          await page.locator(`[data-item-id="${id}"]`).getByRole('button', {name:'Use',exact:true}).click();
          assert.equal(await page.locator('#inventory-panel').isVisible(), false, 'using the item returns to play');
          assert.ok(!await page.evaluate(id => JSON.parse(localStorage.getItem('max-game:inventory-gifts')).includes(id), id), 'the item is consumed');
        };
        await use('osh-item');
        await page.getByRole('button', {name:'Speak to God',exact:true}).click();
        await page.getByRole('button', {name:'Ask a question',exact:true}).click();
        const first = await page.locator('.osh-prayer p').textContent();
        await page.getByRole('button', {name:'Ask a question',exact:true}).click();
        assert.notEqual(await page.locator('.osh-prayer p').textContent(), first, 'God answers successive prayers');
        await page.getByRole('button', {name:'Ask for a blessing',exact:true}).click();
        assert.match(await page.locator('.osh-prayer p').textContent(), /blessed/);
        const panel = await page.locator('.osh-prayer').boundingBox();
        assert.ok(panel.x >= 0 && panel.y >= 0 && panel.x + panel.width <= viewport.width + 1 && panel.y + panel.height <= viewport.height + 1, 'prayer controls fit the viewport');
        for (const button of await page.locator('.osh-prayer button').all()) {
          await button.scrollIntoViewIfNeeded();
          assert.ok(await button.evaluate(el => {
            const b = el.getBoundingClientRect();
            return b.height >= 44 && el.contains(document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2));
          }), 'prayer buttons remain touchable');
        }
        await page.getByRole('button', {name:'Speak to God',exact:true}).click();
        await use('inessa-item');
        await page.evaluate(interior => window.__gameTest.openNpc(interior ? 'wheldon' : 'inessa'), interior);
        const line = page.locator(interior ? '#noel-dialogue-line' : '#npc-dialogue-line');
        await line.locator('.inessa-russian').waitFor();
        assert.match(await line.locator('.inessa-russian').textContent(), /[А-Яа-я]/);
        assert.equal(await line.locator('.inessa-russian').getAttribute('lang'), 'ru');
        const original = await line.locator('.inessa-subtitle').textContent();
        assert.ok(original.length > 0, 'the English clue remains available');
        await page.clock.fastForward(16_000);
        await page.waitForFunction(() => !document.querySelector('.inessa-russian'));
        assert.equal(await line.textContent(), original, 'expiration restores the exact original dialogue');
        assert.equal(await page.locator('.osh-prayer').isVisible(), true, 'Inessa’s shorter timer leaves Osh’s power running');
        await page.clock.fastForward(15_000);
        assert.equal(await page.locator('.osh-prayer').isVisible(), false, 'the papacy and prayer panel expire');
        assert.deepEqual(errors, [], 'both powers run without browser exceptions');
        console.log(`PASS Osh/Inessa ${interior ? 'interior' : 'overworld'} ${viewport.width}×${viewport.height}: gifts, prayers, Russian dialogue, subtitles, touch targets and expiry.`);
      } catch (error) {
        await page.screenshot({path:`test-results/failure-osh-inessa-${interior}-${viewport.width}.png`});
        throw error;
      } finally { await page.close(); }
    }
  }
}
