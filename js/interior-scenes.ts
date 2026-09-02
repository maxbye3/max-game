import {
  CINEMA_COLLISION_BITS,
  CINEMA_COLLISION_CELL_SIZE,
  CINEMA_COLLISION_COLUMNS,
  CINEMA_COLLISION_ROWS,
} from './cinema-collision-mask.js';
import { CAVE_SIBLINGS } from './cave-siblings.js';
import { CAVE_DOOR_ID } from './colander.js';
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

export type InteriorKind = 'diaryLab' | 'cinema' | 'musicShop' | 'cave';
export type InteractionKind = 'noel' | 'diary' | 'experiments' | 'colander' | 'siblings';

export interface InteriorDoor {
  readonly triggerX: number;
  readonly triggerY: number;
  readonly exitX: number;
  readonly exitY: number;
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
  collisionDistance: 31,
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
      backgroundSource: '../img/internal/cinema.png?v=20260831-six-seat-audience',
      collisionMaskSource: '../img/internal/cinema-collisions.png?v=20260831-no-bottom-bench',
      doorOverlaySource: '../img/internal/cinema-open-door.png',
      collision: CINEMA_COLLISION,
      doors: CINEMA_DOORS,
      interactions: [],
      playerStart: { x: 256, y: 650 },
    };
  }

  if (enteredDoor === 'music-shop') {
    return {
      kind: 'musicShop', title: 'Music House', ariaLabel: 'Music House interior',
      width: 543, height: 724, sourceScale: 2,
      backgroundSource: '../img/internal/internal-music.png?v=20260831-interior',
      collision: MUSIC_COLLISION,
      doors: MUSIC_SHOP_DOORS,
      interactions: [],
      playerStart: { x: 272, y: 625 },
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
