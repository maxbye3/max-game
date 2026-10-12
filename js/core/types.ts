/** A collision rectangle in world pixels: [x, y, width, height]. */
export type CollisionShape = readonly [number, number, number, number];

/** The eight facings the sprite sheet has rows for. */
export type Direction =
  | 'down'
  | 'downRight'
  | 'right'
  | 'upRight'
  | 'up'
  | 'upLeft'
  | 'left'
  | 'downLeft';

/** The four axis-aligned directions a control can assert. */
export type InputDirection = 'up' | 'down' | 'left' | 'right';

export interface Player {
  x: number;
  y: number;
  direction: Direction;
  frame: number;
  animationTime: number;
}
