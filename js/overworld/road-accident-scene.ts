import { GRAVEYARD_HEIGHT, GRAVEYARD_WIDTH, GRAVEYARD_X, GRAVEYARD_Y } from '../core/config.js';
import type { Player } from '../core/types.js';

export const GHOST_SPAWN = { x: GRAVEYARD_X + GRAVEYARD_WIDTH / 2, y: GRAVEYARD_Y + GRAVEYARD_HEIGHT + 18 };
const IMPACT_HOLD = 1.6;
const CAMERA_PAN = 2.4;
const GHOST_REVEAL = 0.7;

export class RoadAccidentScene {
  private elapsed = 0;
  private impact: { x: number; y: number } | null = null;
  private revealed = false;
  private impactDialogue = 'Oh no!';

  get active(): boolean { return this.impact !== null; }
  get dialogue(): string | null { return this.active && this.elapsed < IMPACT_HOLD ? this.impactDialogue : null; }
  get playerVisible(): boolean { return !this.active || this.elapsed < IMPACT_HOLD || this.revealed; }

  begin(player: Player, dialogue = 'Oh no!'): void {
    if (this.active) return;
    this.impactDialogue = dialogue;
    this.impact = { x: player.x, y: player.y };
    this.elapsed = 0;
    this.revealed = false;
    player.frame = 0;
    player.animationTime = 0;
  }

  update(deltaTime: number, player: Player, revealGhost: () => void): void {
    if (!this.active) return;
    this.elapsed += deltaTime;
    if (!this.revealed && this.elapsed >= IMPACT_HOLD + CAMERA_PAN) {
      Object.assign(player, GHOST_SPAWN, { direction: 'down', frame: 0, animationTime: 0 });
      this.revealed = true;
      revealGhost();
    }
    if (this.elapsed >= IMPACT_HOLD + CAMERA_PAN + GHOST_REVEAL) this.impact = null;
  }

  cameraCenter(): { x: number; y: number } | null {
    if (!this.impact) return null;
    const progress = Math.max(0, Math.min(1, (this.elapsed - IMPACT_HOLD) / CAMERA_PAN));
    const eased = progress * progress * (3 - 2 * progress);
    return {
      x: this.impact.x + (GHOST_SPAWN.x - this.impact.x) * eased,
      y: this.impact.y + (GHOST_SPAWN.y - this.impact.y) * eased,
    };
  }
}
