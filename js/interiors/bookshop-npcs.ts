import { characterAsset } from '../core/character-assets.js';

export interface BookshopNpc {
  readonly source: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

// Visual-only bookstore regulars. Their feet sit in open floor space around
// the reading rug so they feel present without blocking shelves or the exit.
export const BOOKSHOP_NPCS: readonly BookshopNpc[] = [
  {
    source: `../${characterAsset('alex-w', 'mapSprite')}`,
    x: 160,
    y: 500,
    width: 56,
    height: 82,
  },
  {
    source: `../${characterAsset('helen', 'mapSprite')}`,
    x: 350,
    y: 505,
    width: 47,
    height: 84,
  },
];
