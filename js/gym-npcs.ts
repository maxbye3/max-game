export interface GymNpc {
  readonly source: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly animation?: {
    readonly frameWidth: number;
    readonly frameHeight: number;
    readonly frameCount: number;
    readonly frameDurationMs: number;
    readonly framesPerRow?: number;
  };
}

// These are visual-only gym regulars. Their feet are positioned in the
// marked open floor areas so they do not overlap the equipment or block play.
export const GYM_NPCS: readonly GymNpc[] = [
  {
    // Julian is positioned just to the left of the heavy bag, cycling through
    // the selected hand-wrapping frames.
    source: '../img/internal/julian-boxing-sprite.png',
    x: 331,
    y: 310,
    width: 64,
    height: 118,
    animation: {
      frameWidth: 260,
      frameHeight: 470,
      frameCount: 7,
      frameDurationMs: 150,
    },
  },
  {
    // Tim's bench-press animation is placed over the fixed bench in the
    // background, so the animated rack cleanly replaces the empty one.
    source: '../img/internal/tim-bench-press-sprite.png',
    x: 160,
    y: 445,
    width: 150,
    height: 200,
    animation: {
      frameWidth: 384,
      frameHeight: 512,
      frameCount: 8,
      frameDurationMs: 125,
      framesPerRow: 4,
    },
  },
];
