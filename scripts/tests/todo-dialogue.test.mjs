import assert from 'node:assert/strict';
import { withGameTest } from './helpers.mjs';

await withGameTest(async ({ loadModule, values, element }) => {
  const { TodoWelcomeDialogue, TODO_WELCOME_LINE, TODO_ITEM, getCollectedGifts, removeGift } = await loadModule('todo', 'js/core/todo-guide.ts', "export { TODO_ITEM, getCollectedGifts, removeGift } from './js/core/inventory-gifts.ts';");
  const panel = element('#dialogue');
  const line = element('#line');
  const next = element('#next');
  const options = element('#options');
  panel.querySelectorAll = () => [options];
  const welcome = new TodoWelcomeDialogue(panel, line, next);
  assert.equal(getCollectedGifts().length, 0, 'starting a conversation does not award the guide');
  assert.equal(welcome.finish(), true);
  assert.equal(line.textContent, TODO_WELCOME_LINE);
  assert.equal(options.hidden, true);
  assert.equal(next.hidden, false);
  assert.equal(getCollectedGifts().length, 0, 'read the farewell before the reveal');
  welcome.cancel();
  assert.equal(values.has('max-game:todo-guide-received'), false, 'walking away does not complete the gift');
  welcome.finish();
  assert.equal(welcome.finish(), false, 'finishing the farewell closes the conversation');
  welcome.cancel();
  assert.deepEqual(getCollectedGifts().map(item => item.name), ['To-dos']);
  assert.ok(element('.game-shell').children.some(overlay => overlay.children.some(image => image.src.endsWith('/img/external/to-do/reveal.gif'))));
  removeGift(TODO_ITEM);
  const afterNavigation = new TodoWelcomeDialogue(panel, line, next);
  assert.equal(afterNavigation.finish(), false, 'the gift remains one-time after deletion and navigation');
});

await withGameTest(async ({ loadModule, values, element }) => {
  document.body = element('body');
  const inventory = await loadModule('inventory-todo', 'js/core/inventory.ts');
  values.set('max-game:inventory-gifts', '["todo-guide"]');
  element('#inventory-panel').contains = () => false;
  inventory.setupInventory();
  const card = element('#gift-items').children[0];
  const open = card.children[2].children[0];
  assert.equal(open.textContent, 'Open');
  open.listeners.get('click')();
  const viewer = document.body.children[0];
  assert.equal(viewer.open, true);
  assert.equal(viewer.children[1].children[0].src, 'http://localhost/img/external/to-do/todo.png');
  assert.deepEqual(JSON.parse(values.get('max-game:inventory-gifts')), ['todo-guide'], 'opening never consumes To-dos');
  viewer.children[0].listeners.get('click')();
  assert.equal(viewer.open, false);
  open.listeners.get('click')();
  assert.equal(viewer.open, true, 'the image can be reopened');
});

await withGameTest(async ({ loadModule, element, values }) => {
  let resolveFixture;
  globalThis.fetch = () => new Promise(resolve => { resolveFixture = resolve; });
  const npcs = await loadModule('todo-async-dialogue', 'js/overworld/npcs.ts');
  npcs.setupNpcInteractions();
  npcs.updateNpcInteractions(npcs.ED.x + 30, npcs.ED.y);
  element('#npc-dialogue-next').listeners.get('click')();
  element('#npc-dialogue-close').listeners.get('click')();
  const farewell = element('#npc-dialogue-line').textContent;
  assert.match(farewell, /^hey looks like your new around here/);
  resolveFixture({ ok: true, json: async () => ({ events: [] }) });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(element('#npc-dialogue-line').textContent, farewell, 'an unfinished football lookup cannot overwrite the farewell');
  element('#npc-dialogue-next').listeners.get('click')();
  assert.equal(element('#npc-dialogue').hidden, true);
  assert.deepEqual(JSON.parse(values.get('max-game:inventory-gifts')), ['todo-guide']);
});
