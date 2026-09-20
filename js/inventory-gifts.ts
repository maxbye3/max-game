import { resolveSiteAsset } from './site-assets.js';

export interface GiftItem {
  readonly id: string;
  readonly name: string;
  readonly imageSource: string;
  readonly description: string;
  // Some gifts are permanent unlocks rather than usable items, so they
  // shouldn't clutter the inventory list once collected.
  readonly hiddenFromInventory?: boolean;
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

export const JULIAN_ITEM: GiftItem = {
  id: 'julian-item',
  name: "Julian's item",
  imageSource: 'chat/julian/item.png',
  description: 'The world opens up.',
};

export const TIM_ITEM: GiftItem = {
  id: 'tim-item',
  name: "Tim's item",
  imageSource: 'chat/tim/item.png',
  description: 'Face implodes.',
};

export const LUCY_ITEM: GiftItem = {
  id: 'lucy-item',
  name: "Lucy's item",
  imageSource: 'chat/lucy/item.png',
  description: 'World spins around and around.',
};

export const PORTABLE_WALKMAN: GiftItem = {
  id: 'portable-walkman',
  name: 'Portable walkman',
  imageSource: 'img/portable-walkman.png',
  description: 'You can now play music.',
  hiddenFromInventory: true,
};

export const GEORGIA_ITEM: GiftItem = {
  id: 'georgia-item',
  name: "Georgia's item",
  imageSource: 'chat/georgia/item.png',
  description: 'Creates the apocalypse.',
};

export const ANDY_ITEM: GiftItem = {
  id: 'andy-item',
  name: "Andy's item",
  imageSource: 'chat/andy/item.png',
  description: 'Creates the apocalypse.',
};

export const REI_ITEM: GiftItem = {
  id: 'rei-item',
  name: "Rei's item",
  imageSource: 'chat/rei/player/item.png',
  description: 'Makes the protagonist move 20% faster.',
};

const INVENTORY_GIFTS_KEY = 'max-game:inventory-gifts';
const GIFT_LINE_INDEX_KEY = 'max-game:gift-line-index';
const ITEM_RECEIVED_OVERLAY_DURATION = 3200;

function showItemReceivedOverlay(item: GiftItem): void {
  const gameShell = document.querySelector<HTMLElement>('.game-shell');
  if (!gameShell) return;
  const overlay = document.createElement('div');
  overlay.className = 'quest-accepted-overlay item-received-overlay';
  overlay.setAttribute('aria-label', `${item.name} added to inventory`);
  const image = document.createElement('img');
  image.src = resolveSiteAsset(item.imageSource);
  image.alt = item.name;
  overlay.append(image);
  gameShell.append(overlay);
  window.setTimeout(() => overlay.remove(), ITEM_RECEIVED_OVERLAY_DURATION);
}

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
    description: 'Creates the apocalypse.',
  },
  {
    id: 'katy-item',
    name: "Katy's item",
    imageSource: 'chat/katy/item.png',
    description: 'Character trips over occasionally',
  },
  LUCY_ITEM,
  JULIAN_ITEM,
  TIM_ITEM,
  PORTABLE_WALKMAN,
  GEORGIA_ITEM,
  ANDY_ITEM,
  REI_ITEM,
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
  showItemReceivedOverlay(item);
  window.dispatchEvent(new CustomEvent<GiftItem>('max-game:inventory-gift-added', { detail: item }));
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
  return GIFT_ITEMS.filter((item) => ids.includes(item.id) && !item.hiddenFromInventory);
}
