import assert from 'node:assert/strict';

export async function checkTodoGuide(browser, server, fixtures) {
  for (const viewport of [{ width: 320, height: 568 }, { width: 844, height: 390 }, { width: 1280, height: 900 }]) {
    for (const interior of [false, true]) {
      const page = await browser.newPage({ viewport, isMobile: viewport.width < 1000, hasTouch: viewport.width < 1000 });
      try {
        await page.addInitScript(() => {
          localStorage.setItem('max-game:audio-muted', 'true');
          const raf = requestAnimationFrame.bind(window);
          window.requestAnimationFrame = callback => window.pauseGameTest ? 0 : raf(callback);
        });
        await page.route(interior ? '**/dist/internal-bundle.js*' : '**/dist/main-bundle.js*', route => route.fulfill({ path: fixtures[Number(interior)], contentType: 'text/javascript' }));
        await page.goto(server.url + (interior ? '/internal/index.html' : '/index.html?door=snow-mansion'));
        await page.locator('#door-loading').waitFor({ state: 'hidden' });
        await page.waitForFunction(() => !!window.__gameTest);
        await page.evaluate(() => { window.pauseGameTest = true; });
        await page.waitForTimeout(80);
        await page.evaluate(kind => window.__gameTest.openNpc(kind), interior ? 'noel' : 'georgia');
        const prefix = interior ? '#noel' : '#npc';
        const line = page.locator(`${prefix}-dialogue-line`);
        assert.equal(await page.evaluate(() => localStorage.getItem('max-game:todo-guide-received')), null);
        if (interior) {
          await page.locator('#noel-dialogue-next').click();
          await page.locator('#noel-game-no').click();
          for (let i = 0; i < 3; i++) await page.locator('#noel-dialogue-next').click();
        } else {
          for (let i = 0; i < 200 && !(await line.textContent()).startsWith('hey looks like'); i++) {
            const next = page.locator('#npc-dialogue-next');
            await (await next.isVisible() ? next : page.locator('#npc-dialogue-close')).click();
          }
        }
        assert.match(await line.textContent(), /^hey looks like your new around here/);
        assert.equal(await page.locator(`${prefix}-speaker`).textContent(), interior ? 'Noel' : 'Georgia');
        assert.equal(await page.locator(`${prefix}-dialogue-profile`).isVisible(), !interior, 'the farewell preserves both portrait presence and intentional absence');
        await page.locator(`${prefix}-dialogue-next`).click();
        const reveal = page.locator('.item-received-overlay img[src$="/to-do/reveal.gif"]');
        await reveal.waitFor({ state: 'visible' });
        await reveal.evaluate(image => image.decode());
        assert.equal(await page.locator(`${prefix}-dialogue`).isVisible(), false);
        await page.locator('#inventory-toggle').click();
        const open = page.locator('[data-item-id="todo-guide"] button', { hasText: 'Open' });
        await open.click();
        const viewer = page.locator('.todo-guide');
        assert.equal(await viewer.isVisible(), true);
        await viewer.locator('img').evaluate(image => image.decode());
        assert.equal(await viewer.locator('.todo-talk-count').textContent(), '1 / 42', 'the first person is already counted');
        assert.equal(await viewer.locator('.todo-talk-count').evaluate(counter => {
          const box = counter.getBoundingClientRect();
          const sheet = counter.closest('.todo-guide-sheet').getBoundingClientRect();
          return box.left > sheet.left + sheet.width * .5 && box.right < sheet.left + sheet.width * .8 && box.top > sheet.top + sheet.height * .3 && box.bottom < sheet.top + sheet.height * .5;
        }), true, 'the counter stays beside the first row at every image size');
        assert.equal(await viewer.evaluate(dialog => {
          const box = dialog.getBoundingClientRect();
          return box.left >= 0 && box.right <= innerWidth && box.top >= 0 && box.bottom <= innerHeight && dialog.scrollWidth <= dialog.clientWidth && dialog.scrollHeight <= dialog.clientHeight;
        }), true, 'guide stays inside every viewport without horizontal overflow');
        await page.screenshot({ path: `test-results/todo-${interior ? 'room' : 'world'}-${viewport.width}.png` });
        await viewer.locator('button').click();
        assert.equal(await viewer.isVisible(), false);
        await page.locator('#inventory-toggle').click();
        await open.click();
        await page.keyboard.press('Escape');
        assert.equal(await viewer.isVisible(), false, 'Escape dismisses the image');
        await page.evaluate(kind => window.__gameTest.openNpc(kind), interior ? 'noel' : 'georgia');
        await page.locator(`${prefix}-dialogue-close`).click();
        await page.locator('#inventory-toggle').click();
        await open.click();
        assert.equal(await viewer.locator('.todo-talk-count').textContent(), '1 / 42', 'repeat conversations count once');
        await viewer.locator('button').click();
        await page.evaluate(kind => window.__gameTest.openNpc(kind), interior ? 'tim' : 'sam');
        await page.locator(`${prefix}-dialogue-close`).click();
        await page.locator('#inventory-toggle').click();
        await open.click();
        assert.equal(await viewer.locator('.todo-talk-count').textContent(), '2 / 42', 'another person increases the counter');
        await viewer.locator('button').click();
        assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('max-game:inventory-gifts')).filter(id => id === 'todo-guide').length), 1);
        await page.reload();
        await page.locator('#door-loading').waitFor({ state: 'hidden' });
        await page.evaluate(() => { window.pauseGameTest = true; });
        await page.waitForTimeout(80);
        await page.evaluate(kind => window.__gameTest.openNpc(kind), interior ? 'noel' : 'georgia');
        await page.locator(`${prefix}-dialogue-close`).click();
        assert.equal(await page.locator(`${prefix}-dialogue`).isVisible(), false, 'future conversations omit the farewell after reload');
        assert.equal(await page.locator('.item-received-overlay img[src$="/to-do/reveal.gif"]').count(), 0);
        await page.locator('#inventory-toggle').click();
        await open.click();
        assert.equal(await viewer.locator('.todo-talk-count').textContent(), '2 / 42', 'the total persists after reload');
      } finally { await page.close(); }
    }
  }
  console.log('PASS To-dos: farewell, reveal, unique people counter, dismissal and saved progress in six world/room layouts.');
}
