import { ADAM_FACTS } from '../characters/adam/adam-facts.js';
import { GEORGIA, georgiaState } from '../characters/georgia/georgia.js';
import { getNextArsenalFixtureDialogue } from '../characters/ed/arsenal-fixture.js';
import { ADAM_ITEM, ALEX_S_ITEM, ALICE_ITEM, BOCHRA_ITEM, CHRIS_ITEM, DAN_ITEM, ED_ITEM, GEORGIA_ITEM, JOE_ITEM, JU_ITEM, KATIE_ITEM, OSCAR_ITEM, SAM_ITEM, type GiftItem, GIFT_ITEMS } from '../core/inventory-gifts.js';
import { type Song } from '../interiors/music-library.js';
import { CHARACTER_DIALOGUE_LINES } from '../generated/dialogues/index.js';

export interface NpcDefinition {
  readonly id: keyof typeof CHARACTER_DIALOGUE_LINES | 'alexS' | 'marinaD';
  readonly name: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly interactionDistance: number;
  readonly getPosition?: () => { readonly x: number; readonly y: number };
  readonly itemGift?: GiftItem;
  readonly songReward?: Song;
  readonly dialogueLines: readonly string[];
  readonly getFixtureLine?: () => Promise<string>;
  readonly followUpLine?: () => string;
  // Said after the rotating greeting, every time the player walks up.
  readonly requestLine?: string;
}

type NpcOptions = Omit<NpcDefinition, 'id' | 'dialogueLines' | 'width' | 'height' | 'interactionDistance'>
  & Partial<Pick<NpcDefinition, 'width' | 'height' | 'interactionDistance'>>
  & { readonly character?: keyof typeof CHARACTER_DIALOGUE_LINES };

function defineNpc(id: NpcDefinition['id'], { character, ...options }: NpcOptions): NpcDefinition {
  const key = character ?? id;
  const dialogueLines = CHARACTER_DIALOGUE_LINES[key as keyof typeof CHARACTER_DIALOGUE_LINES];
  if (!dialogueLines) throw new Error(`Missing dialogue for NPC: ${key}`);
  return { id, width: 25, height: 52, interactionDistance: 58, dialogueLines, ...options };
}

// Alice and Chris are already rendered at these positions by map-characters.ts.
export const ALICE = defineNpc('alice', {
  name: 'Alice',
  x: 260,
  y: 120,
  itemGift: ALICE_ITEM,
});

export const CHRIS = defineNpc('chris', {
  name: 'Chris',
  x: 475,
  y: 270,
  itemGift: CHRIS_ITEM,
});

export const ADAM = defineNpc('adam', {
  name: 'adam',
  x: 195,
  y: 916,
  width: 37,
  height: 60,
  interactionDistance: 56,
  followUpLine: nextAdamFact,
  itemGift: ADAM_ITEM,
});

export const ED = defineNpc('ed', {
  name: 'ed',
  x: 254,
  y: 909,
  height: 54,
  interactionDistance: 56,
  getFixtureLine: getNextArsenalFixtureDialogue,
  itemGift: ED_ITEM,
  songReward: 'Outer wildeds',
});

export const MIKE = defineNpc('mike', {
  name: 'mike',
  x: 300,
  y: 685,
  width: 40,
  height: 46,
  interactionDistance: 56,
  itemGift: GIFT_ITEMS[0]!,
});

export const REI = defineNpc('rei', {
  name: 'rei',
  x: 456,
  y: 500,
  width: 32,
  height: 45,
  interactionDistance: 56,
  songReward: 'Lemon jelly',
  requestLine: 'I need some red paint to finish this sign. Help me find some',
});

// Marina D is already drawn by map-characters.ts.
export const MARINA_D = defineNpc('marinaD', {
  character: 'marina-d',
  name: 'marina d',
  x: 201,
  y: 1034,
});

export const MADDY = defineNpc('maddy', {
  name: 'Maddy',
  x: 383,
  y: 1045,
  height: 59,
});

// Sam is already drawn by map-characters.ts.
export const SAM = defineNpc('sam', {
  name: 'Sam',
  x: 324,
  y: 974,
  itemGift: SAM_ITEM,
});

// Katie is already drawn by map-characters.ts; she is distinct from Katy.
export const KATIE = defineNpc('katie', {
  name: 'Katie',
  x: 1130,
  y: 1018,
  itemGift: KATIE_ITEM,
});

// Mason and Meli are already drawn next to each other by map-characters.ts.
export const MASON = defineNpc('mason', {
  name: 'Mason',
  x: 820,
  y: 570,
  height: 69,
});

export const MELI = defineNpc('meli', {
  name: 'Meli',
  x: 858,
  y: 570,
  height: 69,
});

// Oscar is already drawn by map-characters.ts.
export const OSCAR = defineNpc('oscar', {
  name: 'Oscar',
  x: 636,
  y: 564,
  itemGift: OSCAR_ITEM,
});

export const JU = defineNpc('ju', {
  name: 'Ju',
  x: 1000,
  y: 180,
  itemGift: JU_ITEM,
});

export const BOCHRA = defineNpc('bochra', {
  name: 'Bochra',
  x: 1114,
  y: 172,
  itemGift: BOCHRA_ITEM,
});

export const DAN = defineNpc('dan', {
  name: 'Dan',
  x: 1150,
  y: 372,
  height: 48,
  itemGift: DAN_ITEM,
});

export const JOE = defineNpc('joe', {
  name: 'Joe',
  x: 1080,
  y: 1070,
  itemGift: JOE_ITEM,
});

export const ALEX_S = defineNpc('alexS', {
  character: 'alex-s',
  name: 'Alex S',
  x: 680,
  y: 1063,
  width: 20,
  height: 46,
  songReward: 'Africa',
  itemGift: ALEX_S_ITEM,
});

export const KATY = defineNpc('katy', {
  name: 'Katy',
  x: 422,
  y: 640,
  width: 35,
  itemGift: GIFT_ITEMS[1]!,
});

export const GEORGIA_NPC = defineNpc('georgia', {
  name: 'Georgia',
  x: GEORGIA.x,
  y: GEORGIA.y,
  width: GEORGIA.width,
  height: GEORGIA.height,
  interactionDistance: 64,
  getPosition: () => georgiaState,
  itemGift: GEORGIA_ITEM,
});

export const NPCS: readonly NpcDefinition[] = [ADAM, ED, MIKE, REI, MARINA_D, MADDY, SAM, KATIE, MASON, MELI, OSCAR, JU, BOCHRA, DAN, JOE, ALEX_S, KATY, GEORGIA_NPC, ALICE, CHRIS];

let adamFactIndex = 0;
function nextAdamFact(): string {
  const fact = ADAM_FACTS[adamFactIndex % ADAM_FACTS.length] ?? '';
  adamFactIndex += 1;
  return fact;
}
