import { timInputVector } from '../powers/tim/tim-input-power.js';
import { reiMovementMultiplier } from '../powers/rei/rei-power.js';
import { noelMovementMultiplier } from '../powers/noel/noel-power.js';
import { aliceMovementMultiplier } from '../powers/alice/alice-power.js';
import { mikeMovementMultiplier } from '../powers/mike/mike-power.js';
import { lucyMovementMultiplier } from '../powers/lucy/lucy-power.js';
import { isKatiePowerActive } from '../powers/katie/katie-power.js';
import { julianMovementMultiplier } from '../powers/julian/julian-power.js';
import { juInputVector, juMovementMultiplier } from '../powers/ju/ju-power.js';
import { helenMovementMultiplier } from '../powers/helen/helen-power.js';
import { isGeorgiaPowerActive, moveGeorgiaFlight, settleGeorgiaFlight } from '../powers/georgia/georgia-power.js';
import { isDanPowerActive } from '../powers/dan/dan-power.js';
import { chrisMovementMultiplier } from '../powers/chris/chris-power.js';
import { bochraMovementMultiplier } from '../powers/bochra/bochra-power.js';
import {
  BUS_INTRO_PLAYER_START_Y,
  BUS_INTRO_STOP_X,
  FRAME_COUNT,
  HALF_WIDTH,
  SPEED,
  SPRITE_HEIGHT,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from './config.js';
import { isBusIntroActive } from '../overworld/bus-intro.js';
import { isCaveTheftCutsceneActive } from '../overworld/cave-thief.js';
import { playerCollidesAt } from './collision.js';
import { DOORWAYS } from './doors.js';
import { isHoleAnimationActive, isSafeLandingPoint } from './hole.js';
import { isHeld } from './input.js';
import { isJumpMenuOpen } from './jump.js';
import { isAlexResurrectionUiBlocking } from '../powers/alex-s/alex-s-power-ui.js';
import { isPlayerTripping } from '../powers/katy/katy-power.js';
import { isGymTimCutsceneBlockingPlayer } from '../interiors/gym-tim-cutscene.js';
import { niallSpeedMultiplier } from '../powers/niall/niall-speed-power.js';
import { adamAirStrideMultiplier } from '../powers/adam/adam-power.js';
import { samMovementMultiplier } from '../powers/sam/sam-power.js';
import { oscarMovementMultiplier, isOscarTerrainEaten, settleOscarDigestion } from '../powers/oscar/oscar-power.js';
import { andyMovementMultiplier } from '../powers/andy/andy-power.js';
import { isNiallBattleTransitionActive, isNiallEncounterBlockingPlayer, NIALL } from '../characters/niall/niall.js';
import { bumpSignAt } from './signs.js';
import type { Direction, Player } from './types.js';
import { getPlayerBody } from './player-body.js';

const clampX = (x: number) => Math.max(HALF_WIDTH, Math.min(WORLD_WIDTH - HALF_WIDTH, x));
const clampY = (y: number) => Math.max(SPRITE_HEIGHT, Math.min(WORLD_HEIGHT, y));
const FLIGHT_BOUNDS = { minX: HALF_WIDTH, minY: SPRITE_HEIGHT + 60, maxX: WORLD_WIDTH - HALF_WIDTH, maxY: WORLD_HEIGHT - 1 };

const searchParams = new URLSearchParams(window.location.search);
const returnDoorId = searchParams.get('door');
const returnDoor = DOORWAYS.find((doorway) => doorway.id === returnDoorId);
const DEFAULT_START_X = BUS_INTRO_STOP_X;
const DEFAULT_START_Y = BUS_INTRO_PLAYER_START_Y;
const fightReturn = searchParams.get('niall') === 'bus';
const DOOR_RETURN_OFFSET = 12;

export const player: Player = {
  x: fightReturn
    ? NIALL.x - 42
    : returnDoor
      ? returnDoor.x + returnDoor.width / 2
      : DEFAULT_START_X,
  y: fightReturn
    ? NIALL.y + 8
    : returnDoor
      ? returnDoor.y + returnDoor.height + DOOR_RETURN_OFFSET
      : DEFAULT_START_Y,
  direction: returnDoor || fightReturn ? 'down' : 'up',
  frame: 0,
  animationTime: 0,
};

export const directionRows: Record<Direction, number> = {
  down: 0,
  downRight: 1,
  right: 2,
  upRight: 3,
  up: 4,
  upLeft: 5,
  left: 6,
  downLeft: 7,
};

function movePlayerWithCollisions(movementX: number, movementY: number): void {
  const isGhost = getPlayerBody() === 'ghost';
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(movementX), Math.abs(movementY)) / 4));
  const stepX = movementX / steps;
  const stepY = movementY / steps;

  for (let step = 0; step < steps; step += 1) {
    const nextX = clampX(player.x + stepX);
    const canMoveX = isGhost || (!bumpSignAt(nextX, player.y) && (!playerCollidesAt(nextX, player.y) || isOscarTerrainEaten(nextX, player.y)));
    if (canMoveX) player.x = nextX;

    const nextY = clampY(player.y + stepY);
    const canMoveY = isGhost || (!bumpSignAt(player.x, nextY) && (!playerCollidesAt(player.x, nextY) || isOscarTerrainEaten(player.x, nextY)));
    if (canMoveY) player.y = nextY;
  }
}

export function updatePlayer(deltaTime: number, speedMultiplier: number): void {
  settleOscarDigestion(player, playerCollidesAt);
  if (isKatiePowerActive()) { player.animationTime = 0; player.frame = 0; return; }
  settleGeorgiaFlight(player, (x, y) => !isSafeLandingPoint(x, y), FLIGHT_BOUNDS);
  if (
    isDanPowerActive() ||
    isBusIntroActive() ||
    isHoleAnimationActive() ||
    isJumpMenuOpen() ||
    isAlexResurrectionUiBlocking() ||
    isGymTimCutsceneBlockingPlayer() ||
    isNiallEncounterBlockingPlayer() ||
    isNiallBattleTransitionActive() ||
    isCaveTheftCutsceneActive()
  ) {
    player.animationTime = 0;
    player.frame = 0;
    return;
  }

  if (isPlayerTripping()) {
    player.animationTime = 0;
    player.frame = 0;
    return;
  }

  let dx = 0;
  let dy = 0;
  if (isHeld('left')) dx -= 1;
  if (isHeld('right')) dx += 1;
  if (isHeld('up')) dy -= 1;
  if (isHeld('down')) dy += 1;
  const juDirection = juInputVector(dx, dy);
  dx = juDirection.x; dy = juDirection.y;
  const timDirection = timInputVector(dx, dy); dx = timDirection.x; dy = timDirection.y;

  const isMoving = dx !== 0 || dy !== 0;
  const movementSpeed = SPEED * speedMultiplier * niallSpeedMultiplier() * adamAirStrideMultiplier() * aliceMovementMultiplier() * samMovementMultiplier() * oscarMovementMultiplier() * andyMovementMultiplier() * bochraMovementMultiplier() * chrisMovementMultiplier() * helenMovementMultiplier() * juMovementMultiplier() * julianMovementMultiplier() * lucyMovementMultiplier() * mikeMovementMultiplier() * noelMovementMultiplier() * reiMovementMultiplier();
  const flying = isGeorgiaPowerActive();
  if (flying) moveGeorgiaFlight(player, dx, dy, movementSpeed, deltaTime, FLIGHT_BOUNDS);
  if (!isMoving) {
    player.animationTime = 0;
    player.frame = 0;
    return;
  }

  const length = Math.hypot(dx, dy);
  const movementX = (dx / length) * movementSpeed * deltaTime;
  const movementY = (dy / length) * movementSpeed * deltaTime;
  if (!flying) movePlayerWithCollisions(movementX, movementY);

  if (dx < 0 && dy < 0) player.direction = 'upLeft';
  else if (dx > 0 && dy < 0) player.direction = 'upRight';
  else if (dx < 0 && dy > 0) player.direction = 'downLeft';
  else if (dx > 0 && dy > 0) player.direction = 'downRight';
  else if (dx < 0) player.direction = 'left';
  else if (dx > 0) player.direction = 'right';
  else if (dy < 0) player.direction = 'up';
  else player.direction = 'down';

  player.animationTime += deltaTime * aliceMovementMultiplier() * helenMovementMultiplier() * juMovementMultiplier() * julianMovementMultiplier() * lucyMovementMultiplier() * mikeMovementMultiplier() * noelMovementMultiplier() * reiMovementMultiplier();
  player.frame = Math.floor(player.animationTime * 11) % FRAME_COUNT;
}
