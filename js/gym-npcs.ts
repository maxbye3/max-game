export interface GymNpc {
  readonly source: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

// These are visual-only gym regulars. Their feet are positioned in the
// marked open floor areas so they do not overlap the equipment or block play.
export const GYM_NPCS: readonly GymNpc[] = [
  {
    source: '../chat/julian/overworld-sprite.png',
    x: 312,
    y: 450,
    width: 52,
    height: 82,
  },
  {
    source: '../chat/tim/overworld-sprite.png',
    x: 200,
    y: 575,
    width: 52,
    height: 82,
  },
];
