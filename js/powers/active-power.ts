import { adamPowerSecondsLeft } from './adam/adam-power.js';
import { alexSPowerSecondsLeft } from './alex-s/alex-s-power.js';
import { alicePowerSecondsLeft } from './alice/alice-power.js';
import { andyPowerSecondsLeft } from './andy/andy-power.js';
import { bochraPowerSecondsLeft } from './bochra/bochra-power.js';
import { chrisPowerSecondsLeft } from './chris/chris-power.js';
import { danPowerSecondsLeft } from './dan/dan-power.js';
import { georgiaPowerSecondsLeft } from './georgia/georgia-power.js';
import { helenPowerSecondsLeft } from './helen/helen-power.js';
import { joePowerSecondsLeft } from './joe/joe-power.js';
import { juPowerSecondsLeft } from './ju/ju-power.js';
import { julianPowerSecondsLeft } from './julian/julian-power.js';
import { katiePowerSecondsLeft } from './katie/katie-power.js';
import { katyPowerSecondsLeft } from './katy/katy-power.js';
import { lucyPowerSecondsLeft } from './lucy/lucy-power.js';
import { maddyTeaSecondsLeft } from './maddy/maddy-tea-power.js';
import { mikePowerSecondsLeft } from './mike/mike-power.js';
import { niallSpeedSecondsLeft } from './niall/niall-speed-power.js';
import { noelPowerSecondsLeft } from './noel/noel-power.js';
import { oscarPowerSecondsLeft } from './oscar/oscar-power.js';
import { samPowerSecondsLeft } from './sam/sam-power.js';
import { timInputPowerSecondsLeft } from './tim/tim-input-power.js';
import { reiPowerSecondsLeft } from './rei/rei-power.js';

/** Includes both frame-clock powers and powers persisted with a wall-clock deadline. */
export function isAnyPowerActive(now = performance.now()): boolean {
  return adamPowerSecondsLeft() > 0 ||
    alexSPowerSecondsLeft() > 0 ||
    alicePowerSecondsLeft(now) > 0 ||
    andyPowerSecondsLeft(now) > 0 ||
    bochraPowerSecondsLeft(now) > 0 ||
    chrisPowerSecondsLeft(now) > 0 ||
    danPowerSecondsLeft(now) > 0 ||
    georgiaPowerSecondsLeft(now) > 0 ||
    helenPowerSecondsLeft(now) > 0 ||
    joePowerSecondsLeft(now) > 0 ||
    juPowerSecondsLeft(now) > 0 ||
    julianPowerSecondsLeft(now) > 0 ||
    katiePowerSecondsLeft(now) > 0 ||
    katyPowerSecondsLeft(now) > 0 ||
    lucyPowerSecondsLeft(now) > 0 ||
    maddyTeaSecondsLeft(now) > 0 ||
    mikePowerSecondsLeft(now) > 0 ||
    niallSpeedSecondsLeft() > 0 ||
    noelPowerSecondsLeft(now) > 0 ||
    oscarPowerSecondsLeft(now) > 0 ||
    samPowerSecondsLeft(now) > 0 ||
    timInputPowerSecondsLeft(now) > 0 ||
    reiPowerSecondsLeft('gravity', now) > 0 ||
    reiPowerSecondsLeft('sparkle', now) > 0;
}
