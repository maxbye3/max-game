export interface GiftItem {
  readonly id: string;
  readonly name: string;
  readonly imageSource: string;
  readonly description: string;
}

export const GIFT_LINES = [
  'Here. You’ll need this.',
  'This is for you.',
  'You’ll make better use of this.',
  'Found this. Figured you could use it.',
  'Hold onto this for me.',
  'Here, catch.',
  'This might come in handy.',
  'Here. Don’t lose it.',
  'Take this and get out of here.',
] as const;

const INVENTORY_GIFTS_KEY = 'max-game:inventory-gifts';
const GIFT_LINE_INDEX_KEY = 'max-game:gift-line-index';

export const GIFT_ITEMS: readonly GiftItem[] = [
  {
    id: 'mike-item',
    name: "Mike's item",
    imageSource: 'chat/mike/item.png',
    description: 'Makes the protagonist 36% happier.',
  },
  {
    id: 'alex-s-item',
    name: "Alex S's item",
    imageSource: 'chat/alex s/item.png',
    description: 'Makes the protagonist move 20% faster.',
  },
  {
    id: 'lucy-item',
    name: "Lucy's item",
    imageSource: 'chat/lucy/item.png',
    description: 'A sachet of mayonnaise with surprising potential.',
  },
];

function readGiftIds(): string[] {
  try {
    const value = JSON.parse(window.localStorage.getItem(INVENTORY_GIFTS_KEY) ?? '[]');
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

function writeGiftIds(ids: readonly string[]): void {
  try {
    window.localStorage.setItem(INVENTORY_GIFTS_KEY, JSON.stringify(ids));
  } catch {
    // Storage may be unavailable in a restricted browser context.
  }
}

export function hasGift(item: GiftItem): boolean {
  return readGiftIds().includes(item.id);
}

export function addGift(item: GiftItem): boolean {
  const ids = readGiftIds();
  if (ids.includes(item.id)) return false;
  writeGiftIds([...ids, item.id]);
  window.dispatchEvent(new Event('max-game:inventory-gift-added'));
  return true;
}

export function removeGift(item: GiftItem): void {
  writeGiftIds(readGiftIds().filter((id) => id !== item.id));
  window.dispatchEvent(new Event('max-game:inventory-gift-removed'));
}

export function nextGiftLine(): string {
  let index = 0;
  try {
    const stored = Number.parseInt(window.localStorage.getItem(GIFT_LINE_INDEX_KEY) ?? '0', 10);
    index = Number.isFinite(stored) && stored >= 0 ? stored % GIFT_LINES.length : 0;
    window.localStorage.setItem(GIFT_LINE_INDEX_KEY, String((index + 1) % GIFT_LINES.length));
  } catch {
    // Keep the first line when storage is unavailable.
  }
  return GIFT_LINES[index] ?? GIFT_LINES[0];
}

export function getCollectedGifts(): readonly GiftItem[] {
  const ids = readGiftIds();
  return GIFT_ITEMS.filter((item) => ids.includes(item.id));
}
