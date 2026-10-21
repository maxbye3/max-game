import { buildThiefPath, thiefPathCell, type PathPoint } from '../overworld/cave-thief-path.js';
import { moveWithCollisions } from '../core/movement.js';

type Phase = 'waiting' | 'message' | 'chasing' | 'caught';
export const INTERIOR_CHASE_MESSAGE = 'Thought you could so easily get away from US!';

export class InteriorSiblingChase {
  phase: Phase = 'waiting';
  x: number;
  y: number;
  frame = 0;
  private elapsed = 0;
  private animation = 0;
  private repath = 0;
  private targetCell = -1;
  private path: PathPoint[] = [];

  constructor(start: PathPoint, private readonly blocked: (x: number, y: number) => boolean,
    private readonly appear: () => void, private readonly catchPlayer: () => void) {
    this.x = start.x;
    this.y = start.y;
  }

  update(delta: number, target: PathPoint): void {
    if (this.phase === 'caught') return;
    this.elapsed += delta;
    if (this.phase === 'waiting') {
      if (this.elapsed < 1.5) return;
      this.phase = 'message'; this.elapsed = 0; this.appear();
      return;
    }
    if (this.phase === 'message') {
      if (this.elapsed < 1.8) return;
      this.phase = 'chasing';
    }
    if (Math.hypot(target.x - this.x, target.y - this.y) < 26) {
      this.phase = 'caught'; this.catchPlayer(); return;
    }
    this.repath -= delta;
    const cell = thiefPathCell(target.x, target.y);
    if (this.repath <= 0 || this.targetCell !== cell || !this.path.length) {
      const result = buildThiefPath(this.x, this.y, target.x, target.y, this.blocked);
      this.path = result.points; this.targetCell = result.targetCell; this.repath = 0.25;
    }
    const waypoint = this.path[0] ?? target;
    const dx = waypoint.x - this.x, dy = waypoint.y - this.y;
    const distance = Math.hypot(dx, dy);
    if (distance < 5) { this.path.shift(); return; }
    const step = Math.min(distance, 125 * delta);
    moveWithCollisions(this, dx / distance * step, dy / distance * step, this.blocked);
    this.animation += delta;
    this.frame = Math.floor(this.animation * 9);
  }
}
