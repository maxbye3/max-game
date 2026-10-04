import { withKatieBreak } from './katie-power-render.js';
import { withJulianSummoning } from './julian-power-render.js';
import { withJuVibes } from './ju-power-render.js';
import { withJoeHeat } from './joe-power-render.js';
import { withBochraDance } from './bochra-power-render.js';
import { withChrisPerformance } from './chris-power-render.js';
import { withDanRiot } from './dan-power-render.js';
import { withGeorgiaFlight } from './georgia-power-render.js';
import { withHelenExpansion } from './helen-power-render.js';

/** Compose temporary poses around one foot anchor without changing collision positions. */
export function withCharacterPowers(context: CanvasRenderingContext2D, x: number, y: number, height: number, id: string, drawSprite: () => void, now = performance.now()): void {
  const dancedSprite = () => withBochraDance(context, x, y, height, id, drawSprite, now);
  const singingSprite = () => withChrisPerformance(context, x, y, height, id, dancedSprite, now);
  const riotingSprite = () => withDanRiot(context, x, y, height, id, singingSprite, now);
  const expandedSprite = () => withHelenExpansion(context, x, y, height, id, riotingSprite, now);
  const flyingSprite = () => withGeorgiaFlight(context, x, y, height, id, expandedSprite, now);
  const heatedSprite = () => withJoeHeat(context, x, y, id, flyingSprite, now);
  const vibingSprite = () => withJuVibes(context, x, y, height, id, heatedSprite, now);
  const summoningSprite = () => withJulianSummoning(context, x, y, height, id, vibingSprite, now);
  withKatieBreak(context, x, y, height, id, summoningSprite, now);
}
