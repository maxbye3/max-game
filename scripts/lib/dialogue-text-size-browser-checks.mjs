import assert from 'node:assert/strict';

const sizes = [['small', 9], ['medium', 12], ['large', 15]];
const overlaps = (a, b) => a.x < b.x + b.width - 1 && a.x + a.width > b.x + 1 && a.y < b.y + b.height - 1 && a.y + a.height > b.y + 1;

async function checkPanel(page, selector, mode, viewport, bodySize) {
  const panel = page.locator(selector);
  const bounds = await panel.boundingBox();
  assert.ok(bounds.x >= 0 && bounds.y >= 0 && bounds.x + bounds.width <= viewport.width + 1 && bounds.y + bounds.height <= viewport.height + 1, `${selector} fits at ${bodySize}px`);
  const line = panel.locator('p').first();
  assert.ok(Math.abs(await line.evaluate(element => parseFloat(getComputedStyle(element).fontSize)) - bodySize) < 0.01, 'the selected size applies to the message');
  assert.ok(Math.abs(await panel.locator('h2').evaluate(element => parseFloat(getComputedStyle(element).fontSize)) - bodySize * 10 / 9) < 0.01, 'the heading scales with the message');
  const movement = mode === 'stick' ? '.mobile-thumbstick' : mode === 'pad' ? '.dpad' : mode === 'split' ? '.mobile-split-key' : '.keyboard-hint';
  for (const control of await page.locator(movement).all()) {
    assert.ok(!overlaps(bounds, await control.boundingBox()), `${selector} clears ${mode} controls`);
  }
  assert.ok(!overlaps(bounds, await page.locator('.movement-actions').boundingBox()), 'dialogue clears action buttons');
  const content = panel.locator('.npc-dialogue-content, .sign-dialogue-content');
  assert.ok(await content.evaluate(element => element.clientHeight + 1 >= parseFloat(getComputedStyle(element.querySelector('p')).lineHeight)), 'a full message line remains visible');
  await line.evaluate(element => { element.textContent = 'Keep exploring the village and discover all the characters and their stories. '.repeat(40); });
  assert.ok(await content.evaluate(element => {
    element.scrollTop = element.scrollHeight;
    const end = element.querySelector('p').getBoundingClientRect();
    return element.scrollTop > 0 && element.scrollWidth <= element.clientWidth + 1 && end.bottom <= element.getBoundingClientRect().bottom + 1;
  }), 'the entire long message scrolls without horizontal clipping');
  for (const action of await panel.locator('.npc-dialogue-close:visible, .npc-dialogue-next:visible, .npc-dialogue-options button:visible').all()) {
    await action.scrollIntoViewIfNeeded();
    assert.ok(await action.evaluate(element => {
      const box = element.getBoundingClientRect();
      const panel = element.closest('.npc-dialogue, .sign-dialogue').getBoundingClientRect();
      return box.top >= panel.top && box.bottom <= panel.bottom && element.contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2));
    }), 'close, next and reply controls stay reachable');
  }
  assert.equal(await panel.evaluate(element => element.scrollTop), 0, 'the fixed header stays in view');
}

export async function checkDialogueTextSizes(browser, server, fixtures) {
  for (const viewport of [{width:320,height:568}, {width:390,height:740}, {width:844,height:390}, {width:1280,height:900}]) {
    const mobile = viewport.width < 1000;
    const page = await browser.newPage({viewport, isMobile:mobile, hasTouch:mobile});
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const ready = async () => {
      await page.locator('#door-loading').waitFor({state:'hidden'});
      await page.waitForFunction(() => !!window.__gameTest);
      await page.evaluate(() => { window.pauseGameTest = true; });
      await page.waitForTimeout(80);
      await page.evaluate(() => document.fonts.ready);
    };
    const assertSize = async size => {
      assert.equal(await page.locator('#dialogue-text-size').inputValue(), size);
      assert.equal(await page.locator('html').getAttribute('data-dialogue-text-size'), size);
    };
    try {
      await page.addInitScript(() => {
        localStorage.setItem('max-game:audio-muted', 'true');
        const raf = requestAnimationFrame.bind(window);
        window.requestAnimationFrame = callback => window.pauseGameTest ? 0 : raf(callback);
      });
      await page.route('**/dist/main-bundle.js*', route => route.fulfill({path:fixtures[0], contentType:'text/javascript'}));
      await page.route('**/dist/internal-bundle.js*', route => route.fulfill({path:fixtures[1], contentType:'text/javascript'}));
      await page.goto(`${server.url}/index.html?door=snow-mansion`);
      await ready();
      await assertSize('small');
      for (const [size, bodySize] of sizes) {
        await page.locator('#options-toggle').click();
        const select = page.getByLabel('Dialogue & sign text size');
        await select.scrollIntoViewIfNeeded();
        assert.ok((await select.boundingBox()).height >= 44, 'the size selector has a phone-friendly target');
        await select.selectOption(size);
        assert.equal(await page.evaluate(() => localStorage.getItem('max-game:dialogue-text-size')), size);
        await page.keyboard.press('Escape');
        await assertSize(size);
        for (const interior of [false, true]) {
          if (interior) {
            await page.locator('#jump-toggle').click();
            await page.locator('#jump-options').getByRole('button', {name:'Charity', exact:true}).click();
            await page.waitForURL('**/internal/index.html?door=job-center');
            await ready();
            await assertSize(size);
          }
          await page.reload();
          await ready();
          await assertSize(size);
          for (const mode of mobile ? ['stick', 'pad', 'split'] : ['keyboard']) {
            if (mobile) while (await page.locator('.controls').getAttribute('data-mobile-controls') !== mode) await page.locator('#controls-toggle').click();
            if (interior) {
              await page.evaluate(() => window.__gameTest.openNpc('charity-computer'));
              const panel = page.locator('#noel-dialogue');
              assert.equal(await panel.locator('.npc-dialogue-options button:visible').count(), 2, 'real interior replies are available');
              await checkPanel(page, '#noel-dialogue', mode, viewport, bodySize);
              for (const reply of await panel.locator('.npc-dialogue-options button:visible').all()) {
                assert.ok(Math.abs(await reply.evaluate(element => parseFloat(getComputedStyle(element).fontSize)) - bodySize * 8 / 9) < 0.01, 'reply text scales too');
              }
              await panel.locator('.npc-dialogue-options button:visible').last().click();
              await panel.locator('.npc-dialogue-close').click();
            } else {
              for (const character of ['sam', 'rei']) {
                await page.evaluate(character => window.__gameTest.openNpc(character), character);
                assert.equal(await page.locator('#npc-dialogue-profile').isVisible(), character === 'sam');
                await checkPanel(page, '#npc-dialogue', mode, viewport, bodySize);
                if (character === 'sam' && viewport.width !== 320 && mode === (mobile ? 'stick' : 'keyboard')) {
                  await page.locator('#npc-dialogue .npc-dialogue-content').evaluate(element => { element.scrollTop = 0; });
                  await page.screenshot({path:`test-results/text-size-${size}-${viewport.width}.png`});
                }
                await page.locator('#npc-dialogue-close').click();
              }
              await page.evaluate(() => window.__gameTest.openSign('east-directory'));
              await checkPanel(page, '#sign-dialogue', mode, viewport, bodySize);
              await page.locator('#sign-dialogue-close').click();
            }
          }
        }
        await page.goto(`${server.url}/index.html?door=snow-mansion`);
        await ready();
        await assertSize(size);
      }
      await page.evaluate(() => localStorage.setItem('max-game:dialogue-text-size', 'invalid'));
      await page.reload();
      await ready();
      await assertSize('small');
      assert.deepEqual(errors, []);
      console.log(`PASS dialogue text sizes ${viewport.width}×${viewport.height}: all sizes and control modes, portraits, replies, scrolling, navigation, reload and invalid preference fallback.`);
    } catch (error) {
      await page.screenshot({path:`test-results/failure-text-size-${viewport.width}.png`});
      throw error;
    } finally { await page.close(); }
  }
}
