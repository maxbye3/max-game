import { ITEM_DESCRIPTIONS } from '../generated/core/item-descriptions.generated.js';
import { readStorage, writeStorage } from './storage.js';

const REVEALED_ITEMS_KEY = 'max-game:revealed-item-descriptions';

function revealedItems(): string[] {
  try {
    const value: unknown = JSON.parse(readStorage(REVEALED_ITEMS_KEY) ?? '[]');
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : [];
  } catch { return []; }
}

export function getRevealedItemDescription(id: string): string | null {
  return revealedItems().includes(id) ? ITEM_DESCRIPTIONS[id] ?? null : null;
}

export function revealItemDescription(id: string): string {
  const description = ITEM_DESCRIPTIONS[id];
  if (description === undefined) throw new Error(`Missing item text for ${id}`);
  const ids = revealedItems();
  if (!ids.includes(id)) writeStorage(REVEALED_ITEMS_KEY, JSON.stringify([...ids, id]));
  return description;
}
