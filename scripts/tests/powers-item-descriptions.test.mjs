import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { withGameTest } from './helpers.mjs';

await withGameTest(async ({ loadModule, values }) => {
  const { ITEM_DESCRIPTIONS, ITEM_DESCRIPTION_SOURCES } = await loadModule('item-text', 'js/generated/core/item-descriptions.generated.ts');
  const { GIFT_ITEMS } = await loadModule('gifts', 'js/core/inventory-gifts.ts');
  const powers = GIFT_ITEMS.filter(item => !item.hiddenFromInventory && item.id !== 'lucy-solar-cap');
  assert.deepEqual(Object.keys(ITEM_DESCRIPTIONS).sort(), powers.map(item => item.id).sort(), 'every usable power has an original text source');
  assert.equal(ITEM_DESCRIPTION_SOURCES['andy-item'], 'char/andy/Item.txt');
  assert.equal(ITEM_DESCRIPTION_SOURCES['rei-item'], 'char/rei/item-1.txt');
  assert.equal(ITEM_DESCRIPTION_SOURCES['rei-item-2'], 'char/rei/item-2.txt');
  assert.equal(ITEM_DESCRIPTION_SOURCES['niall-item'], 'char/niall/player/item.txt');
  const descriptions = await loadModule('item-descriptions', 'js/core/item-descriptions.ts');
  for (const item of powers) {
    const original = await readFile(ITEM_DESCRIPTION_SOURCES[item.id], 'utf8');
    assert.equal(ITEM_DESCRIPTIONS[item.id], original, `${item.id} preserves every character, including punctuation and whitespace`);
    assert.equal(descriptions.getRevealedItemDescription(item.id), null, 'unused powers remain undiscovered');
    assert.equal(descriptions.revealItemDescription(item.id), original, 'the reveal is the source text without a name prefix or summary');
    assert.equal(descriptions.getRevealedItemDescription(item.id), original);
  }
  const restored = await loadModule('restored-item-descriptions', 'js/core/item-descriptions.ts');
  assert.equal(restored.getRevealedItemDescription('tim-item'), await readFile('char/tim/item.txt', 'utf8'), 'discoveries survive navigation and recollecting an item');
  descriptions.revealItemDescription('tim-item');
  assert.equal(JSON.parse(values.get('max-game:revealed-item-descriptions')).filter(id => id === 'tim-item').length, 1);
  values.set('max-game:revealed-item-descriptions', '{invalid');
  assert.equal(restored.getRevealedItemDescription('tim-item'), null, 'a corrupt save does not prevent opening inventory');
  assert.throws(() => descriptions.revealItemDescription('unknown-item'), /Missing item text/, 'missing sources never turn into invented descriptions');
});
