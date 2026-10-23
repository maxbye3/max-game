import { ITEM_DESCRIPTIONS } from '../generated/core/item-descriptions.generated.js';
import { resolveSiteAsset } from './site-assets.js';
import { characterAsset } from './character-assets.js';
import { clearEdGiftCharge } from '../powers/ed/ed-power.js';

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
  imageSource: characterAsset('julian', 'item'),
  description: ITEM_DESCRIPTIONS['julian-item']!,
};

export const TIM_ITEM: GiftItem = {
  id: 'tim-item',
  name: "Tim's item",
  imageSource: characterAsset('tim', 'item'),
  description: ITEM_DESCRIPTIONS['tim-item']!,
};

export const HELEN_ITEM: GiftItem = {
  id: 'helen-item',
  name: "Helen's item",
  imageSource: characterAsset('helen', 'item'),
  description: ITEM_DESCRIPTIONS['helen-item']!,
};

export const NIALL_ITEM: GiftItem = {
  id: 'niall-item',
  name: "Niall's item",
  imageSource: characterAsset('niall', 'item'),
  description: ITEM_DESCRIPTIONS['niall-item']!,
};

export const LUCY_ITEM: GiftItem = {
  id: 'lucy-item',
  name: "Lucy's item",
  imageSource: characterAsset('lucy', 'item'),
  description: ITEM_DESCRIPTIONS['lucy-item']!,
};

export const LUCY_SOLAR_CAP: GiftItem = {
  id: 'lucy-solar-cap',
  name: 'Solar-panel cap',
  imageSource: 'img/items/lucy-solar-cap.svg',
  description: 'Wear it to recover 1 HP per second in the bright outdoor world. It needs sunlight, so it does not charge indoors.',
};

export const NOEL_ITEM: GiftItem = {
  id: 'noel-item',
  name: "Noel's item",
  imageSource: characterAsset('noel', 'item'),
  description: ITEM_DESCRIPTIONS['noel-item']!,
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
  imageSource: characterAsset('georgia', 'item'),
  description: ITEM_DESCRIPTIONS['georgia-item']!,
};

export const ANDY_ITEM: GiftItem = {
  id: 'andy-item',
  name: "Andy's item",
  imageSource: characterAsset('andy', 'item'),
  description: ITEM_DESCRIPTIONS['andy-item']!,
};

export const REI_ITEM_1: GiftItem = {
  id: 'rei-item',
  name: "Rei's first item",
  imageSource: characterAsset('rei', 'itemOne'),
  description: ITEM_DESCRIPTIONS['rei-item']!,
};

export const REI_ITEM_2: GiftItem = {
  id: 'rei-item-2',
  name: "Rei's second item",
  imageSource: characterAsset('rei', 'itemTwo'),
  description: ITEM_DESCRIPTIONS['rei-item-2']!,
};

export const MADDY_ITEM: GiftItem = {
  id: 'maddy-item',
  name: "Maddy's item",
  imageSource: characterAsset('maddy', 'item'),
  description: ITEM_DESCRIPTIONS['maddy-item']!,
};

export const OSCAR_ITEM: GiftItem = {
  id: 'oscar-item',
  name: "Oscar's item",
  imageSource: characterAsset('oscar', 'item'),
  description: ITEM_DESCRIPTIONS['oscar-item']!,
};

export const ED_ITEM: GiftItem = {
  id: 'ed-item',
  name: "Ed's item",
  imageSource: characterAsset('ed', 'item'),
  description: ITEM_DESCRIPTIONS['ed-item']!,
};

export const ADAM_ITEM: GiftItem = {
  id: 'adam-item',
  name: "Adam's item",
  imageSource: characterAsset('adam', 'item'),
  description: ITEM_DESCRIPTIONS['adam-item']!,
};

export const ALICE_ITEM: GiftItem = {
  id: 'alice-item',
  name: "Alice's item",
  imageSource: characterAsset('alice', 'item'),
  description: ITEM_DESCRIPTIONS['alice-item']!,
};

export const CHRIS_ITEM: GiftItem = {
  id: 'chris-item',
  name: "Chris's item",
  imageSource: characterAsset('chris', 'item'),
  description: ITEM_DESCRIPTIONS['chris-item']!,
};

export const SAM_ITEM: GiftItem = {
  id: 'sam-item',
  name: "Sam's item",
  imageSource: characterAsset('sam', 'item'),
  description: ITEM_DESCRIPTIONS['sam-item']!,
};

export const KATIE_ITEM: GiftItem = {
  id: 'katie-item',
  name: "Katie's item",
  imageSource: characterAsset('katie', 'item'),
  description: ITEM_DESCRIPTIONS['katie-item']!,
};

export const JU_ITEM: GiftItem = {
  id: 'ju-item',
  name: "Ju's item",
  imageSource: characterAsset('ju', 'item'),
  description: ITEM_DESCRIPTIONS['ju-item']!,
};

export const BOCHRA_ITEM: GiftItem = {
  id: 'bochra-item',
  name: "Bochra's item",
  imageSource: characterAsset('bochra', 'item'),
  description: ITEM_DESCRIPTIONS['bochra-item']!,
};

export const DAN_ITEM: GiftItem = {
  id: 'dan-item',
  name: "Dan's item",
  imageSource: characterAsset('dan', 'item'),
  description: ITEM_DESCRIPTIONS['dan-item']!,
};

export const JOE_ITEM: GiftItem = {
  id: 'joe-item',
  name: "Joe's item",
  imageSource: characterAsset('joe', 'item'),
  description: ITEM_DESCRIPTIONS['joe-item']!,
};

export const ALEX_S_ITEM: GiftItem = {
  id: 'alex-s-item',
  name: "Alex S's item",
  imageSource: characterAsset('alex-s', 'item'),
  description: ITEM_DESCRIPTIONS['alex-s-item']!,
};

const INVENTORY_GIFTS_KEY = 'max-game:inventory-gifts';
const REMOVED_GIFT_IDS = new Set(['marina-d-item-1', 'marina-d-item-2']);
const ITEM_RECEIVED_OVERLAY_DURATION = 3200;
let giftLineIndex = 0;

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

export const KIRIN_ITEM: GiftItem = {
  id: 'kirin-item',
  name: "Kirin's Diet Coke",
  imageSource: characterAsset('kirin', 'item'),
  description: ITEM_DESCRIPTIONS['kirin-item']!,
};

export const GIFT_ITEMS: readonly GiftItem[] = [
  {
    id: 'mike-item',
    name: "Mike's item",
    imageSource: characterAsset('mike', 'item'),
    description: ITEM_DESCRIPTIONS['mike-item']!,
  },
  {
    id: 'katy-item',
    name: "Katy's item",
    imageSource: characterAsset('katy', 'item'),
    description: ITEM_DESCRIPTIONS['katy-item']!,
  },
  LUCY_ITEM,
  LUCY_SOLAR_CAP,
  NOEL_ITEM,
  JULIAN_ITEM,
  TIM_ITEM,
  HELEN_ITEM,
  NIALL_ITEM,
  PORTABLE_WALKMAN,
  GEORGIA_ITEM,
  ANDY_ITEM,
  REI_ITEM_1,
  REI_ITEM_2,
  MADDY_ITEM,
  OSCAR_ITEM,
  ED_ITEM,
  ADAM_ITEM,
  ALICE_ITEM,
  CHRIS_ITEM,
  SAM_ITEM,
  KATIE_ITEM,
  JU_ITEM,
  BOCHRA_ITEM,
  DAN_ITEM,
  JOE_ITEM,
  ALEX_S_ITEM,
  KIRIN_ITEM,
];

function readGiftIds(): string[] {
  try {
    const value = JSON.parse(window.localStorage.getItem(INVENTORY_GIFTS_KEY) ?? '[]');
    if (!Array.isArray(value)) return [];
    const ids = value.filter((id): id is string => typeof id === 'string');
    const activeIds = ids.filter((id) => !REMOVED_GIFT_IDS.has(id));
    if (activeIds.length !== ids.length) writeGiftIds(activeIds);
    return activeIds;
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
  clearEdGiftCharge(item);
  window.dispatchEvent(new Event('max-game:inventory-gift-removed'));
}

export function removeAllCollectedGifts(): number {
  const ids = readGiftIds();
  const collectedIds = new Set(getCollectedGifts().map((item) => item.id));
  const remainingIds = ids.filter((id) => !collectedIds.has(id));
  const removedCount = ids.length - remainingIds.length;
  if (removedCount > 0) {
    writeGiftIds(remainingIds);
    GIFT_ITEMS.filter((item) => collectedIds.has(item.id)).forEach(clearEdGiftCharge);
    window.dispatchEvent(new Event('max-game:inventory-gift-removed'));
  }
  return removedCount;
}

export function nextGiftLine(): string {
  const line = GIFT_LINES[giftLineIndex % GIFT_LINES.length] ?? GIFT_LINES[0];
  giftLineIndex += 1;
  return line;
}

export function getCollectedGifts(): readonly GiftItem[] {
  const ids = readGiftIds();
  return GIFT_ITEMS.filter((item) => ids.includes(item.id) && !item.hiddenFromInventory);
}
