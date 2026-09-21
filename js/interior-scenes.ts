import {
  CINEMA_COLLISION_BITS,
  CINEMA_COLLISION_CELL_SIZE,
  CINEMA_COLLISION_COLUMNS,
  CINEMA_COLLISION_ROWS,
} from './cinema-collision-mask.js';
import { CAVE_SIBLINGS } from './cave-siblings.js';
import { CAVE_DOOR_ID } from './colander.js';
import {
  BOOKSHOP_COLLISION_BITS,
  BOOKSHOP_COLLISION_CELL_SIZE,
  BOOKSHOP_COLLISION_COLUMNS,
  BOOKSHOP_COLLISION_ROWS,
} from './bookshop-collision-mask.js';
import {
  GYM_COLLISION_BITS,
  GYM_COLLISION_CELL_SIZE,
  GYM_COLLISION_COLUMNS,
  GYM_COLLISION_ROWS,
} from './gym-collision-mask.js';
import {
  GARDEN_COLLISION_BITS,
  GARDEN_COLLISION_CELL_SIZE,
  GARDEN_COLLISION_COLUMNS,
  GARDEN_COLLISION_ROWS,
} from './garden-collision-mask.js';
import {
  INTERNAL_COLLISION_BITS,
  INTERNAL_COLLISION_CELL_SIZE,
  INTERNAL_COLLISION_COLUMNS,
  INTERNAL_COLLISION_ROWS,
} from './internal-collision-mask.js';
import {
  MUSIC_HOUSE_COLLISION_BITS,
  MUSIC_HOUSE_COLLISION_CELL_SIZE,
  MUSIC_HOUSE_COLLISION_COLUMNS,
  MUSIC_HOUSE_COLLISION_ROWS,
} from './music-house-collision-mask.js';
import {
  MANSION_COLLISION_BITS,
  MANSION_COLLISION_CELL_SIZE,
  MANSION_COLLISION_COLUMNS,
  MANSION_COLLISION_ROWS,
} from './mansion-collision-mask.js';
import { isTimAtMusicShop } from './tim-location.js';

export type InteriorKind = 'diaryLab' | 'plantRoom' | 'cinema' | 'musicShop' | 'gym' | 'bookshop' | 'mansion' | 'cave';
export type InteractionKind = 'noel' | 'diary' | 'experiments' | 'colander' | 'siblings' | 'andy' | 'aliya' | 'lucy' | 'julian' | 'tim' | 'helen';

export interface InteriorDoor {
  readonly triggerX: number;
  readonly triggerY: number;
  readonly openDistance?: number;
  readonly exitX: number;
  readonly exitY: number;
  readonly passageHalfWidth?: number;
  readonly sourceX: number;
  readonly sourceY: number;
  readonly sourceWidth: number;
  readonly sourceHeight: number;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface InteractionTarget {
  readonly kind: InteractionKind;
  readonly label: string;
  readonly x: number;
  readonly y: number;
  readonly distance: number;
}

interface CollisionGrid {
  readonly bits: string;
  readonly cellSize: number;
  readonly columns: number;
  readonly rows: number;
}

export interface InteriorScene {
  readonly kind: InteriorKind;
  readonly title: string;
  readonly ariaLabel: string;
  readonly width: number;
  readonly height: number;
  readonly sourceScale: number;
  readonly backgroundSource: string;
  readonly collisionMaskSource?: string;
  readonly doorOverlaySource?: string;
  readonly collision?: CollisionGrid;
  readonly doors: readonly InteriorDoor[];
  readonly interactions: readonly InteractionTarget[];
  readonly playerStart: Readonly<{ x: number; y: number }>;
}

const DEFAULT_WIDTH = 512;
const DEFAULT_HEIGHT = 768;
export const CAVE_WIDTH = 640;
export const CAVE_HEIGHT = 320;

export const NOEL = {
  x: DEFAULT_WIDTH / 2,
  y: DEFAULT_HEIGHT / 2 + 36,
  width: 52,
  height: 72,
} as const;

export const CAVE_COLANDER = {
  x: 518,
  y: 292,
  eraseX: 486,
  eraseY: 268,
  eraseWidth: 63,
  eraseHeight: 46,
} as const;

export const CAVE_WALLS = [
  [0, 0, CAVE_WIDTH, 47],
  [0, 0, 66, CAVE_HEIGHT],
  [574, 0, 66, CAVE_HEIGHT],
] as const;

const DIARY_LAB_DOORS: readonly InteriorDoor[] = [
  {
    triggerX: 153, triggerY: 595, exitX: 153, exitY: 650,
    sourceX: 60, sourceY: 15, sourceWidth: 280, sourceHeight: 325,
    x: 80, y: 559, width: 126, height: 130,
  },
  {
    triggerX: 359, triggerY: 595, exitX: 359, exitY: 650,
    sourceX: 645, sourceY: 15, sourceWidth: 280, sourceHeight: 325,
    x: 308, y: 559, width: 126, height: 130,
  },
];

const CINEMA_DOORS: readonly InteriorDoor[] = [{
  triggerX: 256, triggerY: 700, exitX: 256, exitY: 700,
  sourceX: 0, sourceY: 0, sourceWidth: 1246, sourceHeight: 1262,
  x: 194, y: 564, width: 124, height: 126,
}];

const CAVE_DOORS: readonly InteriorDoor[] = [{
  triggerX: CAVE_WIDTH / 2, triggerY: CAVE_HEIGHT - 10,
  exitX: CAVE_WIDTH / 2, exitY: CAVE_HEIGHT - 10,
  sourceX: 0, sourceY: 0, sourceWidth: 1, sourceHeight: 1,
  x: CAVE_WIDTH / 2 - 10, y: CAVE_HEIGHT - 32, width: 20, height: 32,
}];

const MUSIC_SHOP_DOORS: readonly InteriorDoor[] = [{
  triggerX: 272, triggerY: 660, exitX: 272, exitY: 682,
  sourceX: 0, sourceY: 0, sourceWidth: 1, sourceHeight: 1,
  x: 272, y: 660, width: 1, height: 1,
}];

const GYM_DOORS: readonly InteriorDoor[] = [{
  triggerX: 256, triggerY: 620, exitX: 256, exitY: 650,
  sourceX: 0, sourceY: 0, sourceWidth: 1219, sourceHeight: 1290,
  x: 212, y: 572, width: 90, height: 105,
}];

const PLANT_ROOM_DOORS: readonly InteriorDoor[] = [{
  // triggerY sits well above the visual door so the passage-open box
  // (triggerY - 30) fully covers the solid door-frame threshold in the
  // collision mask (blocked from y=563 to y=596) - otherwise a thin
  // unbridged strip there permanently walls the player out of the doorway.
  triggerX: 256, triggerY: 580, openDistance: 78, exitX: 256, exitY: 650, passageHalfWidth: 42,
  sourceX: 0, sourceY: 0, sourceWidth: 215, sourceHeight: 255,
  x: 202, y: 560, width: 108, height: 128,
}];

const BOOKSHOP_DOORS: readonly InteriorDoor[] = [{
  triggerX: 256, triggerY: 610, exitX: 256, exitY: 645,
  sourceX: 0, sourceY: 0, sourceWidth: 1024, sourceHeight: 1536,
  x: 208, y: 558, width: 95, height: 130,
}];

const MANSION_DOORS: readonly InteriorDoor[] = [{
  triggerX: 256, triggerY: 620, exitX: 256, exitY: 650,
  sourceX: 0, sourceY: 0, sourceWidth: 1, sourceHeight: 1,
  x: 256, y: 620, width: 1, height: 1,
}];

const DIARY_COLLISION: CollisionGrid = {
  bits: INTERNAL_COLLISION_BITS,
  cellSize: INTERNAL_COLLISION_CELL_SIZE,
  columns: INTERNAL_COLLISION_COLUMNS,
  rows: INTERNAL_COLLISION_ROWS,
};
const CINEMA_COLLISION: CollisionGrid = {
  bits: CINEMA_COLLISION_BITS,
  cellSize: CINEMA_COLLISION_CELL_SIZE,
  columns: CINEMA_COLLISION_COLUMNS,
  rows: CINEMA_COLLISION_ROWS,
};
const MUSIC_COLLISION: CollisionGrid = {
  bits: MUSIC_HOUSE_COLLISION_BITS,
  cellSize: MUSIC_HOUSE_COLLISION_CELL_SIZE,
  columns: MUSIC_HOUSE_COLLISION_COLUMNS,
  rows: MUSIC_HOUSE_COLLISION_ROWS,
};
const GYM_COLLISION: CollisionGrid = {
  bits: GYM_COLLISION_BITS,
  cellSize: GYM_COLLISION_CELL_SIZE,
  columns: GYM_COLLISION_COLUMNS,
  rows: GYM_COLLISION_ROWS,
};
const GARDEN_COLLISION: CollisionGrid = {
  bits: GARDEN_COLLISION_BITS,
  cellSize: GARDEN_COLLISION_CELL_SIZE,
  columns: GARDEN_COLLISION_COLUMNS,
  rows: GARDEN_COLLISION_ROWS,
};
const BOOKSHOP_COLLISION: CollisionGrid = {
  bits: BOOKSHOP_COLLISION_BITS,
  cellSize: BOOKSHOP_COLLISION_CELL_SIZE,
  columns: BOOKSHOP_COLLISION_COLUMNS,
  rows: BOOKSHOP_COLLISION_ROWS,
};
const MANSION_COLLISION: CollisionGrid = {
  bits: MANSION_COLLISION_BITS,
  cellSize: MANSION_COLLISION_CELL_SIZE,
  columns: MANSION_COLLISION_COLUMNS,
  rows: MANSION_COLLISION_ROWS,
};

export function getInteriorScene(enteredDoor: string | null): InteriorScene {
  if (enteredDoor === CAVE_DOOR_ID || enteredDoor === 'cave') {
    return {
      kind: 'cave', title: 'Cave', ariaLabel: 'Cave interior',
      width: CAVE_WIDTH, height: CAVE_HEIGHT, sourceScale: 1,
      backgroundSource: '../img/internal/cave.jpg?v=20260901-half-size-no-sword',
      doors: CAVE_DOORS,
      interactions: [
        {
          kind: 'siblings', label: 'Talk to Maddy and Marina',
          x: CAVE_SIBLINGS.x, y: CAVE_SIBLINGS.endY, distance: CAVE_SIBLINGS.interactionDistance,
        },
        { kind: 'colander', label: 'Pick up colander', x: CAVE_COLANDER.x, y: CAVE_COLANDER.y, distance: 78 },
      ],
      playerStart: { x: CAVE_WIDTH / 2, y: CAVE_HEIGHT - 36 },
    };
  }

  if (enteredDoor === 'cinema') {
    return {
      kind: 'cinema', title: 'Cinema', ariaLabel: 'Cinema interior',
      width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT, sourceScale: 1,
      backgroundSource: '../img/internal/cinema-popcorn-redrawn.png?v=20260902-clean-popcorn',
      collisionMaskSource: '../img/internal/cinema-collisions.png?v=20260831-no-bottom-bench',
      doorOverlaySource: '../img/internal/cinema-open-door.png',
      collision: CINEMA_COLLISION,
      doors: CINEMA_DOORS,
      interactions: [],
      playerStart: { x: 256, y: 650 },
    };
  }

  if (enteredDoor === 'garden-room') {
    return {
      kind: 'plantRoom', title: 'Plant Room', ariaLabel: 'Plant Room interior',
      width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT, sourceScale: 2,
      backgroundSource: '../img/internal/garden.png',
      doorOverlaySource: '../img/internal/garden-door.png',
      collision: GARDEN_COLLISION,
      doors: PLANT_ROOM_DOORS,
      interactions: [
        { kind: 'lucy', label: 'Talk to Lucy', x: 355, y: 350, distance: 68 },
      ],
      playerStart: { x: 256, y: 530 },
    };
  }

  if (enteredDoor === 'music-shop') {
    return {
      kind: 'musicShop', title: 'Music House', ariaLabel: 'Music House interior',
      width: 543, height: 724, sourceScale: 2,
      backgroundSource: '../img/internal/internal-music.png?v=20260831-interior',
      collision: MUSIC_COLLISION,
      doors: MUSIC_SHOP_DOORS,
      interactions: [
        // Andy is behind the decks, so his interaction point sits just in
        // front of the booth where the player can reach it.
        { kind: 'andy', label: 'Talk to Andy', x: 258, y: 352, distance: 108 },
        { kind: 'aliya', label: 'Talk to Aliya', x: 130, y: 350, distance: 82 },
        ...(isTimAtMusicShop() ? [{ kind: 'tim' as const, label: 'Talk to Tim', x: 380, y: 475, distance: 80 }] : []),
      ],
      playerStart: { x: 272, y: 625 },
    };
  }

  if (enteredDoor === 'gym') {
    return {
      kind: 'gym', title: 'Gym', ariaLabel: 'Gym interior',
      width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT, sourceScale: 2,
      backgroundSource: '../img/internal/internal-gym.png',
      doorOverlaySource: '../img/internal/gym-door-open.png',
      collision: GYM_COLLISION,
      doors: GYM_DOORS,
      interactions: [
        { kind: 'julian', label: 'Talk to Julian', x: 331, y: 310, distance: 82 },
        { kind: 'tim', label: 'Talk to Tim', x: 160, y: 445, distance: 105 },
      ],
      playerStart: { x: 256, y: 575 },
    };
  }

  if (enteredDoor === 'bookshop') {
    return {
      kind: 'bookshop', title: 'Bookshop', ariaLabel: 'Bookshop interior',
      width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT, sourceScale: 1,
      backgroundSource: '../img/internal/bookshop-internal.png',
      doorOverlaySource: '../img/internal/bookshop-door-open.png',
      collision: BOOKSHOP_COLLISION,
      doors: BOOKSHOP_DOORS,
      interactions: [
        { kind: 'helen', label: 'Talk to Helen', x: 350, y: 505, distance: 110 },
      ],
      playerStart: { x: 256, y: 560 },
    };
  }

  if (enteredDoor === 'snow-mansion') {
    return {
      kind: 'mansion', title: 'Snow Mansion', ariaLabel: 'Snow Mansion interior',
      width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT, sourceScale: 1,
      backgroundSource: '../img/internal/mansion.png',
      collision: MANSION_COLLISION,
      doors: MANSION_DOORS,
      interactions: [
        { kind: 'noel', label: 'Talk to noel', x: NOEL.x, y: NOEL.y, distance: 62 },
      ],
      playerStart: { x: 256, y: 575 },
    };
  }

  return {
    kind: 'diaryLab', title: "Max's Diary and Laboratory", ariaLabel: 'Diary and Laboratory interior',
    width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT, sourceScale: 1,
    backgroundSource: '../img/internal/diary-lab.png',
    collisionMaskSource: '../img/internal/diary-lab-collision.png',
    doorOverlaySource: '../img/internal/diary-lab-doors-out.png',
    collision: DIARY_COLLISION,
    doors: DIARY_LAB_DOORS,
    interactions: [
      { kind: 'noel', label: 'Talk to noel', x: NOEL.x, y: NOEL.y, distance: 62 },
      { kind: 'diary', label: 'See journal', x: 170, y: 466, distance: 54 },
      { kind: 'experiments', label: 'See experiments', x: 350, y: 285, distance: 54 },
    ],
    playerStart: { x: enteredDoor === 'diary-lab-right' ? 359 : 153, y: 563 },
  };
}
