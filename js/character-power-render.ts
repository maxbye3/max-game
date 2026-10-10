import { withTimContradiction } from './tim-power-render.js';
import { withSamPinch } from './sam-power-render.js';
import { withReiPower } from './rei-power-render.js';
import { withOscarAppetite } from './oscar-power-render.js';
import { withNoelContract } from './noel-power-render.js';
import { withMikeJoy } from './mike-power-render.js';
import { withLucyPicnic } from './lucy-power-render.js';
import { withKatieBreak } from './katie-power-render.js';
import { withJulianSummoning } from './julian-power-render.js';
import { withJuVibes } from './ju-power-render.js';
import { withJoeHeat } from './joe-power-render.js';
import { withBochraDance } from './bochra-power-render.js';
import { withChrisPerformance } from './chris-power-render.js';
import { withDanRiot } from './dan-power-render.js';
import { withGeorgiaFlight } from './georgia-power-render.js';
import { withHelenExpansion } from './helen-power-render.js';

import { isSamPowerActive } from './sam-power.js';
import { isReiPowerActive } from './rei-power.js';
import { isOscarPowerActive } from './oscar-power.js';
import { isBochraPowerActive } from './bochra-power.js';
import { isChrisPowerActive } from './chris-power.js';
import { isDanPowerActive } from './dan-power.js';
import { isHelenPowerActive } from './helen-power.js';
import { isGeorgiaPowerActive } from './georgia-power.js';
import { isJoePowerActive } from './joe-power.js';
import { isJuPowerActive } from './ju-power.js';
import { isJulianPowerActive } from './julian-power.js';
import { isLucyPowerActive, isLucyCapEquipped } from './lucy-power.js';
import { isMikePowerActive } from './mike-power.js';
import { isNoelPowerActive } from './noel-power.js';
import { isKatiePowerActive } from './katie-power.js';
import { isTimInputPowerActive } from './tim-input-power.js';

type PowerWrapper = (context: CanvasRenderingContext2D, x: number, y: number, height: number, id: string, draw: () => void, now: number) => void;
const powers: readonly { active: (now: number) => boolean; wrap: PowerWrapper }[] = [
  { active: isSamPowerActive, wrap: (context, x, y, _height, id, draw, now) => withSamPinch(context, x, y, id, draw, now) },
  { active: isReiPowerActive, wrap: (context, x, y, height, id, draw, now) => withReiPower(context, x, y, height, id, draw, now) },
  { active: isOscarPowerActive, wrap: (context, x, y, _height, id, draw, now) => withOscarAppetite(context, x, y, id, draw, now) },
  { active: isBochraPowerActive, wrap: (context, x, y, height, id, draw, now) => withBochraDance(context, x, y, height, id, draw, now) },
  { active: isChrisPowerActive, wrap: (context, x, y, height, id, draw, now) => withChrisPerformance(context, x, y, height, id, draw, now) },
  { active: isDanPowerActive, wrap: (context, x, y, height, id, draw, now) => withDanRiot(context, x, y, height, id, draw, now) },
  { active: isHelenPowerActive, wrap: (context, x, y, height, id, draw, now) => withHelenExpansion(context, x, y, height, id, draw, now) },
  { active: isGeorgiaPowerActive, wrap: (context, x, y, height, id, draw, now) => withGeorgiaFlight(context, x, y, height, id, draw, now) },
  { active: isJoePowerActive, wrap: (context, x, y, _height, id, draw, now) => withJoeHeat(context, x, y, id, draw, now) },
  { active: isJuPowerActive, wrap: (context, x, y, height, id, draw, now) => withJuVibes(context, x, y, height, id, draw, now) },
  { active: isJulianPowerActive, wrap: (context, x, y, height, id, draw, now) => withJulianSummoning(context, x, y, height, id, draw, now) },
  { active: (now) => isLucyPowerActive(now) || isLucyCapEquipped(), wrap: (context, x, y, height, id, draw, now) => withLucyPicnic(context, x, y, height, id, draw, now) },
  { active: isMikePowerActive, wrap: (context, x, y, height, id, draw, now) => withMikeJoy(context, x, y, height, id, draw, now) },
  { active: isNoelPowerActive, wrap: (context, x, y, height, id, draw, now) => withNoelContract(context, x, y, height, id, draw, now) },
  { active: isKatiePowerActive, wrap: (context, x, y, height, id, draw, now) => withKatieBreak(context, x, y, height, id, draw, now) },
  { active: isTimInputPowerActive, wrap: (context, x, y, height, id, draw, now) => withTimContradiction(context, x, y, height, id, draw, now) },
];
let checkedAt = -1;
let activePowers: typeof powers = [];

/** Preserve effect order, with no wrapper allocations when powers are inactive. */
export function withCharacterPowers(context: CanvasRenderingContext2D, x: number, y: number, height: number, id: string, drawSprite: () => void, now = performance.now()): void {
  if (!powers.some((power) => power.active(now))) { drawSprite(); return; }
  if (now !== checkedAt) {
    checkedAt = now;
    activePowers = powers.filter((power) => power.active(now));
  }
  let draw = drawSprite;
  for (const power of activePowers) {
    const previous = draw;
    draw = () => power.wrap(context, x, y, height, id, previous, now);
  }
  draw();
}
