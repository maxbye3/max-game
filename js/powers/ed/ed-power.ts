import type { GiftItem } from '../../core/inventory-gifts.js';

// Honour gifts charged in older saves; Ed's new item opens the tattoo game.
const CHARGED_GIFTS_KEY = 'max-game:ed-charged-gifts';

function readChargedGifts(): string[] {
  try {
    const ids: unknown = JSON.parse(window.localStorage.getItem(CHARGED_GIFTS_KEY) ?? '[]');
    return Array.isArray(ids) ? ids.filter((id): id is string => typeof id === 'string') : [];
  } catch { return []; }
}

export function isEdGiftCharged(item: GiftItem): boolean {
  return readChargedGifts().includes(item.id);
}

export function clearEdGiftCharge(item: GiftItem): void {
  try { window.localStorage.setItem(CHARGED_GIFTS_KEY, JSON.stringify(readChargedGifts().filter((id) => id !== item.id))); }
  catch { /* Previously charged gifts still work when storage is unavailable. */ }
}
