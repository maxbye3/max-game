import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { withGameTest } from './helpers.mjs';

const manifest = JSON.parse(await readFile('char/manifest.json', 'utf8'));
const expected = new Map();
for (const [id, character] of Object.entries(manifest.characters)) {
  for (const [slot, suffix, filename] of [['item', 'item', 'item.txt'], ['itemOne', 'item', 'item-1.txt'], ['itemTwo', 'item-2', 'item-2.txt']]) {
    if (!character.files[slot]) continue;
    const directory = id === 'niall' ? 'niall/player' : character.directory;
    expected.set(`${id}-${suffix}`, await readFile(`char/${directory}/${id === 'andy' ? 'Item.txt' : filename}`, 'utf8'));
  }
}

await withGameTest(async ({ loadModule, values, element }) => {
  const inventory = await loadModule('inventory', 'js/core/inventory.ts', "export { GIFT_ITEMS } from './js/core/inventory-gifts.ts';");
  values.set('max-game:inventory-gifts', JSON.stringify([...expected.keys()]));
  values.set('max-game:noel-asset-claim', '0.1');
  values.set('max-game:revealed-item-descriptions', JSON.stringify([...expected.keys()]));
  inventory.setupInventory();
  const cards = element('#gift-items').children;
  assert.equal(cards.length, expected.size + 1);
  for (const [index, gift] of inventory.GIFT_ITEMS.filter(gift => expected.has(gift.id)).entries()) {
    assert.equal(gift.description, expected.get(gift.id), `${gift.id} uses its item text verbatim`);
    assert.equal(cards[index].children[1].children[1].textContent, expected.get(gift.id), `${gift.id} renders the source description`);
  }
  assert.equal(cards.at(-1).textContent, expected.get('noel-item'), 'a saved fractional claim shows exactly Noel’s item text');
});

// Exercise actual Use buttons and power expiry, including descriptions that
// previously added names, counts or a rewritten explanation.
const clockDescriptor = Object.getOwnPropertyDescriptor(performance, 'now');
const dateNow = Date.now;
let now = 1000;
Object.defineProperty(performance, 'now', { configurable: true, value: () => now });
Date.now = () => now;
try {
  for (const id of ['noel-item', 'sam-item', 'lucy-item', 'maddy-item', 'katy-item', 'tim-item', 'rei-item', 'rei-item-2', 'mike-item', 'adam-item', 'oscar-item', 'andy-item', 'bochra-item', 'chris-item', 'dan-item', 'georgia-item', 'helen-item', 'joe-item', 'ju-item', 'katie-item', 'alice-item']) {
    now = 1000;
    await withGameTest(async ({ loadModule, values, element }) => {
      const inventory = await loadModule('inventory', 'js/core/inventory.ts');
      values.set('max-game:inventory-gifts', JSON.stringify([id]));
      element('#inventory-panel').contains = () => false;
      inventory.setupInventory();
      const use = element('#gift-items').children[0].children[2].children[0];
      use.listeners.get('click')();
      now = 400_000;
      inventory.updatePowerups(now);
      assert.equal(element('#inventory-message').textContent, expected.get(id), `${id} completion matches its file without extra copy`);
      assert.equal(element('#announcer').textContent, expected.get(id), `${id} announces the same exact text`);
    });
  }
} finally {
  Date.now = dateNow;
  if (clockDescriptor) Object.defineProperty(performance, 'now', clockDescriptor);
  else delete performance.now;
}
