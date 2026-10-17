import { timInputVector } from '../powers/tim/tim-input-power.js';
import { getPlayerBody } from '../core/player-body.js';
import { samMovementMultiplier } from '../powers/sam/sam-power.js';
import { reiMovementMultiplier } from '../powers/rei/rei-power.js';
import { noelMovementMultiplier } from '../powers/noel/noel-power.js';
import { aliceMovementMultiplier } from '../powers/alice/alice-power.js';
import { mikeMovementMultiplier } from '../powers/mike/mike-power.js';
import { lucyMovementMultiplier } from '../powers/lucy/lucy-power.js';
import { isKatiePowerActive } from '../powers/katie/katie-power.js';
import { julianMovementMultiplier } from '../powers/julian/julian-power.js';
import { juInputVector, juMovementMultiplier } from '../powers/ju/ju-power.js';
import { helenMovementMultiplier } from '../powers/helen/helen-power.js';
import { isGeorgiaPowerActive, moveGeorgiaFlight } from '../powers/georgia/georgia-power.js';
import { isDanPowerActive } from '../powers/dan/dan-power.js';
import { chrisMovementMultiplier } from '../powers/chris/chris-power.js';
import { bochraMovementMultiplier } from '../powers/bochra/bochra-power.js';
import { isAlexResurrectionUiBlocking } from '../powers/alex-s/alex-s-power-ui.js';
import { DirectionInputController } from '../core/input.js';
import { InteriorCollision } from './interior-collision.js';
import { niallSpeedMultiplier } from '../powers/niall/niall-speed-power.js';
import { adamAirStrideMultiplier } from '../powers/adam/adam-power.js';
import { isOscarTerrainEaten, oscarMovementMultiplier, settleOscarDigestion } from '../powers/oscar/oscar-power.js';
import { andyMovementMultiplier } from '../powers/andy/andy-power.js';
import { moveWithCollisions } from '../core/movement.js';
import type { Player } from '../core/types.js';
interface InteriorPlayerOptions {
  readonly player: Player;
  readonly input: DirectionInputController;
  readonly width: number;
  readonly height: number;
  readonly frameCount: number;
  readonly collision: InteriorCollision;
  readonly flightBounds: { minX: number; minY: number; maxX: number; maxY: number };
  readonly flightLandingBlocked: (x: number, y: number) => boolean;
  readonly isJournalOpen: () => boolean;
  readonly isCaveEntering: () => boolean;
}
export function createInteriorPlayerUpdater({ player, input, width: WORLD_WIDTH, height: WORLD_HEIGHT, frameCount: FRAME_COUNT, collision, flightBounds: FLIGHT_BOUNDS, flightLandingBlocked, isJournalOpen, isCaveEntering }: InteriorPlayerOptions): (deltaTime: number) => void {
  const SPEED = 145;
  return (deltaTime: number): void => {
    if (isJournalOpen()) { input.releaseAll(); return; }
    if (isAlexResurrectionUiBlocking()) { input.releaseAll(); player.animationTime = 0; player.frame = 0; return; }
    settleOscarDigestion(player, flightLandingBlocked);
    if (isDanPowerActive() || isKatiePowerActive()) { player.animationTime = 0; player.frame = 0; return; }
    if (isCaveEntering()) {
      player.animationTime = 0;
      player.frame = 0;
      return;
    }
    let dx = 0;
    let dy = 0;
    if (input.isHeld('left')) dx -= 1;
    if (input.isHeld('right')) dx += 1;
    if (input.isHeld('up')) dy -= 1;
    if (input.isHeld('down')) dy += 1;
    const juDirection = juInputVector(dx, dy);
    dx = juDirection.x; dy = juDirection.y;
    const timDirection = timInputVector(dx, dy); dx = timDirection.x; dy = timDirection.y;
    const flying = isGeorgiaPowerActive();
    const movementSpeed = SPEED * niallSpeedMultiplier() * adamAirStrideMultiplier() * aliceMovementMultiplier() * oscarMovementMultiplier() * andyMovementMultiplier() * bochraMovementMultiplier() * chrisMovementMultiplier() * helenMovementMultiplier() * juMovementMultiplier() * julianMovementMultiplier() * lucyMovementMultiplier() * mikeMovementMultiplier() * noelMovementMultiplier() * reiMovementMultiplier() * samMovementMultiplier();
    if (flying) moveGeorgiaFlight(player, dx, dy, movementSpeed, deltaTime, FLIGHT_BOUNDS);
    if (dx === 0 && dy === 0) {
      player.animationTime = 0;
      player.frame = 0;
      return;
    }
    const length = Math.hypot(dx, dy);
    if (!flying) moveWithCollisions(
      player,
      (dx / length) * movementSpeed * deltaTime,
      (dy / length) * movementSpeed * deltaTime,
      (x, y) => getPlayerBody() === 'ghost'
        ? x < 0 || y < 0 || x > WORLD_WIDTH || y > WORLD_HEIGHT
        : collision.playerIsBlocked(x, y) && !isOscarTerrainEaten(x, y),
    );
    if (dx < 0 && dy < 0) player.direction = 'upLeft';
    else if (dx > 0 && dy < 0) player.direction = 'upRight';
    else if (dx < 0 && dy > 0) player.direction = 'downLeft';
    else if (dx > 0 && dy > 0) player.direction = 'downRight';
    else if (dx < 0) player.direction = 'left';
    else if (dx > 0) player.direction = 'right';
    else if (dy < 0) player.direction = 'up';
    else player.direction = 'down';
    player.animationTime += deltaTime * aliceMovementMultiplier() * helenMovementMultiplier() * juMovementMultiplier() * julianMovementMultiplier() * lucyMovementMultiplier() * mikeMovementMultiplier() * noelMovementMultiplier() * reiMovementMultiplier() * samMovementMultiplier();
    player.frame = Math.floor(player.animationTime * 11) % FRAME_COUNT;
  };
}
