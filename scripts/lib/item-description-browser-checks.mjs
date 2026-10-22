import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

export async function checkItemDescriptions(browser, server) {
  const generated = await readFile('js/generated/core/item-descriptions.generated.ts', 'utf8');
  const sources = JSON.parse(generated.match(/ITEM_DESCRIPTION_SOURCES[^=]*= ([\s\S]*?);\n/)[1]);
  for (const viewport of [{width:390,height:740}, {width:1280,height:900}, {width:320,height:568}, {width:844,height:390}]) {
    const page = await browser.newPage({viewport, isMobile:viewport.width < 1000, hasTouch:viewport.width < 1000});
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    try {
      await page.clock.install();
      await page.addInitScript(() => {
        localStorage.setItem('max-game:audio-muted', 'true');
        const id = new URLSearchParams(location.search).get('test-item');
        localStorage.setItem('max-game:inventory-gifts', JSON.stringify([id]));
      });
      const cases = viewport.width === 320 || viewport.width === 844 ? [['andy-item', sources['andy-item']]] : Object.entries(sources);
      const path = viewport.width === 320 ? '/index.html' : '/internal/index.html';
      for (const [id, source] of cases) {
        const original = await readFile(source, 'utf8');
        const url = `${server.url}${path}?door=garden-room&test-item=${id}`;
        const ready = async () => {
          await page.locator('#door-loading').waitFor({state:'hidden'});
          await page.waitForFunction(() => !!document.querySelector('#game').dataset.playerVariant);
        };
        await page.goto(url);
        await ready();
        await page.locator('#inventory-toggle').click();
        const card = page.locator(`.inventory-gift[data-item-id="${id}"]`);
        assert.equal(await card.locator('small').count(), 0, `${id} stays hidden before use`);
        await card.getByRole('button', {name:'Use', exact:true}).click();
        if (id === 'alex-s-item') await page.getByRole('button', {name:'Resurrect', exact:true}).click();
        if (id === 'ed-item') await page.getByRole('button', {name:'Close tattoo game', exact:true}).click();
        if (id === 'kirin-item') await page.getByRole('button', {name:'Leave movie', exact:true}).click();
        assert.equal(await page.locator('#inventory-message').textContent(), original, `${id} shows the original text immediately after use`);
        assert.ok(await page.evaluate(id => JSON.parse(localStorage.getItem('max-game:revealed-item-descriptions')).includes(id), id), 'using a power saves its discovery immediately');
        await page.clock.fastForward(30_000);
        await page.waitForFunction(text => document.querySelector('#inventory-message').textContent === text, original);
        assert.equal(await page.locator('#inventory-message').textContent(), original, `${id} reveals the original text word for word`);

        // Recollecting the consumed gift and navigating must retain its exact description.
        await page.goto(url);
        await ready();
        await page.locator('#inventory-toggle').click();
        assert.equal(await card.locator('small').textContent(), original, `${id} keeps its original description after navigation`);
        await card.locator('small').scrollIntoViewIfNeeded();
        const panel = page.locator('#inventory-panel');
        assert.ok(await panel.evaluate(element => element.scrollWidth <= element.clientWidth + 1), 'long descriptions wrap inside inventory');
        const bounds = await panel.boundingBox();
        assert.ok(bounds.x >= 0 && bounds.y >= 0 && bounds.x + bounds.width <= viewport.width + 1 && bounds.y + bounds.height <= viewport.height + 1, 'inventory remains inside the viewport');
      }
      assert.deepEqual(errors, [], 'using and revealing power descriptions has no browser exceptions');
      console.log(`PASS item descriptions ${viewport.width}×${viewport.height}: ${cases.length} exact source reveals and saved discoveries.`);
    } catch (error) {
      await page.screenshot({path:`test-results/failure-item-descriptions-${viewport.width}.png`});
      throw error;
    } finally { await page.close(); }
  }
}
