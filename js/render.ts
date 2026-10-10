import { drawTimPower, drawTimPowerGround, drawTimWorld } from './tim-power-render.js';
import { drawReiTerrain, drawReiGround, drawReiWorld } from './rei-power-render.js';
import { drawNoelTerrain, drawNoelGround, drawNoelWorld } from './noel-power-render.js';
import { drawMikeTerrain, drawMikeGround, drawMikeWorld } from './mike-power-render.js';
import { drawLucyGround, drawLucyWorld } from './lucy-power-render.js';
import { drawKatieTerrain, drawKatieGround, drawKatieWorld } from './katie-power-render.js';
import { drawJulianTerrain, drawJulianGround, drawJulianWorld } from './julian-power-render.js';
import { drawJuTerrain, drawJuGround, drawJuWorld } from './ju-power-render.js';
import { drawJoeTerrain, drawJoeGround, drawJoeWorld, drawPlayerHealth } from './joe-power-render.js';
import { drawHelenGround, drawHelenTerrain, drawHelenWorld } from './helen-power-render.js';
import { drawGeorgiaGround, drawGeorgiaSky } from './georgia-power-render.js';
import { isGeorgiaPowerActive } from './georgia-power.js';
import { drawDanPlayer, drawDanWorld } from './dan-power-render.js';
import { withCharacterPowers } from './character-power-render.js';
import { drawChrisPlayer, drawChrisWorld } from './chris-power-render.js';
import { drawBochraFloor, drawBochraLights } from './bochra-power-render.js';
import { images } from './assets.js';
import { getBusIntroCameraCenter, isBusIntroPlayerVisible } from './bus-intro.js';
import { getCaveTheftCameraCenter, getCaveThief, getCaveThiefDialogue } from './cave-thief.js';
import { drawColander, hasCaveColander } from './colander.js';
import { SCALE, WORLD_HEIGHT, WORLD_WIDTH } from './config.js';
import { canvas, context } from './dom.js';
import { getGymTimCutsceneDialogue } from './gym-tim-cutscene.js';
import { getHolePlayerTransform } from './hole.js';
import { isPlayerTripping } from './katy-power.js';
import { isNiallAlertActive, isNiallFollowing, NIALL, niallState } from './niall.js';
import { drawOverworldNpcs } from './overworld-npcs-render.js';
import { player } from './player.js';
import { getPlayerSpriteFrame } from './player-sprite.js';
import { drawWorldBackground, drawWorldForeground } from './overworld-props-render.js';
import { drawMaddyTeaPower, drawMaddyTeaWorldOverlay } from './maddy-tea-power.js';
import { drawEdPower } from './ed-power.js';
import { adamJumpOffset, adamPowerSecondsLeft, drawAdamPower, drawAdamShadow } from './adam-power.js';
import { samCameraJolt } from './sam-power.js';
import { drawSamPower, drawSamVictimEffects, drawSamWorldOverlay, drawSamTerrain, drawSamGround } from './sam-power-render.js';
import { drawSpeechBubble } from './speech-bubble.js';
import { drawAlexResurrection } from './alex-s-power-render.js';
import { drawOscarPower, drawOscarWorldBites, drawOscarTerrain, drawOscarWorld } from './oscar-power-render.js';
import { drawAndyPlayer, drawAndyWorld } from './andy-world-power.js';
import { drawNiallAt, drawCaveThief, drawBusIntro, drawGeorgia, drawMikeAftermath } from './overworld-characters-render.js';


const searchParams = new URLSearchParams(window.location.search);
const SEAL_MODE = searchParams.has('seal');
const LOG_PLAYER_POSITION = searchParams.has('debug-position');
const NIALL_EXPLANATION_MARK_WIDTH = 26;
const NIALL_EXPLANATION_MARK_HEIGHT = 21;
function logPlayerPosition(): void {
  const playerX = player.x.toFixed(1);
  const playerY = player.y.toFixed(1);
  if (canvas.dataset.playerX === playerX && canvas.dataset.playerY === playerY) return;

  canvas.dataset.playerX = playerX;
  canvas.dataset.playerY = playerY;
  console.log('Player position', { x: Number(playerX), y: Number(playerY) });
}

export function draw(time: number, worldTime = time): void {
  context.clearRect(0, 0, canvas.width, canvas.height);
  if (canvas.dataset.playerVariant === undefined) canvas.dataset.playerVariant = SEAL_MODE ? 'seal' : 'default';
  if (LOG_PLAYER_POSITION) logPlayerPosition();

  // Rounded so the map is sampled on whole source pixels: a fractional source
  // rect snaps at a browser-defined threshold and makes the player jitter
  // against the tiles by a pixel on every step.
  const cameraCenter = getBusIntroCameraCenter() ?? getCaveTheftCameraCenter(player.x, player.y, time);
  const { x: joltX, y: joltY } = samCameraJolt(time);
  const cameraX = Math.round(Math.max(0, Math.min(WORLD_WIDTH - canvas.width, cameraCenter.x - canvas.width / 2 + joltX)));
  const cameraY = Math.round(Math.max(0, Math.min(WORLD_HEIGHT - canvas.height, cameraCenter.y - canvas.height / 2 + joltY)));
  const worldDepth = drawWorldBackground(worldTime, cameraX, cameraY, player.y);
  drawOscarTerrain(context, cameraX, cameraY, time);
  drawReiTerrain(context, time);
  drawSamTerrain(context, cameraX, cameraY, time);
  drawTimPowerGround(context, cameraX, cameraY, time);
  drawHelenTerrain(context, time);
  drawJoeTerrain(context, time);
  drawJuTerrain(context, time);
  drawJulianTerrain(context, time);
  drawKatieTerrain(context, time);
  drawNoelTerrain(context, time);
  drawNoelGround(context, cameraX, cameraY, time);
  drawMikeTerrain(context, time);
  drawMikeGround(context, cameraX, cameraY, time);
  drawLucyGround(context, cameraX, cameraY, time);
  drawKatieGround(context, cameraX, cameraY, time);
  drawJulianGround(context, cameraX, cameraY, time);
  drawJuGround(context, cameraX, cameraY, time);
  drawJoeGround(context, cameraX, cameraY, time);
  drawHelenGround(context, cameraX, cameraY, time);
  drawOscarWorldBites(context, cameraX, cameraY, time);
  drawReiGround(context, cameraX, cameraY, time);
  drawSamGround(context, cameraX, cameraY, time);
  drawBochraFloor(context, cameraX, cameraY, time);
  drawGeorgiaGround(context, cameraX, cameraY, time);
  drawMikeAftermath(cameraX, cameraY);
  drawCaveThief(cameraX, cameraY);
  drawGeorgia(cameraX, cameraY);
  if (isNiallFollowing()) {
    drawNiallAt(cameraX, cameraY, player.x - 34, player.y + 12, player.direction, player.frame);
  } else {
    drawNiallAt(cameraX, cameraY, niallState.x, niallState.y, niallState.direction, niallState.frame);
  }
  if (isNiallAlertActive()) {
    context.drawImage(
      images.niallExplanationMark,
      Math.round(niallState.x - cameraX - NIALL_EXPLANATION_MARK_WIDTH / 2),
      Math.round(niallState.y - cameraY - NIALL.height - NIALL_EXPLANATION_MARK_HEIGHT - 4),
      NIALL_EXPLANATION_MARK_WIDTH,
      NIALL_EXPLANATION_MARK_HEIGHT,
    );
  }
  drawOverworldNpcs(context, cameraX, cameraY);
  drawMaddyTeaWorldOverlay(context, time);
  if (isGeorgiaPowerActive(time)) drawWorldForeground(cameraX, cameraY, worldDepth);

  const playerSpriteSheet = SEAL_MODE ? images.sealSpriteSheet : images.spriteSheet;
  const spriteFrame = getPlayerSpriteFrame(SEAL_MODE, player.direction, player.frame, SCALE);
  const { sourceX, sourceY, sourceWidth, sourceHeight, width, height, baselineOffset } = spriteFrame;
  const adamActive = adamPowerSecondsLeft() > 0;
  const adamLift = adamJumpOffset();
  const adamHeight = adamActive ? Math.round(height * 1.14) : height;
  const holeTransform = getHolePlayerTransform();
  const playerVisible = isBusIntroPlayerVisible();
  if (playerVisible && adamActive) drawAdamShadow(context, player.x - cameraX, player.y - cameraY);
  if (playerVisible && holeTransform) {
    context.save();
    context.globalAlpha = holeTransform.opacity;
    context.translate(
      Math.round(player.x - cameraX),
      Math.round(player.y - cameraY - height / 2 + baselineOffset + holeTransform.offsetY),
    );
    context.rotate(holeTransform.rotation);
    context.scale(holeTransform.scale, holeTransform.scale);
    context.drawImage(
      playerSpriteSheet,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      -width / 2,
      -height / 2,
      width,
      height,
    );
    context.restore();
  } else if (playerVisible && isPlayerTripping(time)) {
    context.save();
    context.translate(
      Math.round(player.x - cameraX),
      Math.round(player.y - cameraY - width / 2),
    );
    context.rotate(Math.PI / 2);
    context.drawImage(
      playerSpriteSheet,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      -width / 2,
      -height / 2,
      width,
      height,
    );
    context.restore();
  } else if (playerVisible) {
    withCharacterPowers(context, player.x - cameraX, player.y - cameraY, adamHeight, 'player', () => context.drawImage(
      playerSpriteSheet,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      Math.round(player.x - cameraX - width / 2),
      Math.round(player.y - cameraY - adamHeight - adamLift + baselineOffset),
      width,
      adamHeight,
    ), time);
  }
  if (playerVisible && hasCaveColander()) {
    drawColander(context, Math.round(player.x - cameraX + 12), Math.round(player.y - cameraY - 24));
  }
  if (!isGeorgiaPowerActive(time)) drawWorldForeground(cameraX, cameraY, worldDepth);
  drawSamWorldOverlay(context, time);
  drawSamVictimEffects(context, cameraX, cameraY, time);
  drawBusIntro(cameraX, cameraY);
  drawAndyWorld(context, cameraX, cameraY, time);
  drawBochraLights(context, cameraX, cameraY, time);
  drawChrisWorld(context, cameraX, cameraY, time);
  drawDanWorld(context, cameraX, cameraY, time);
  drawGeorgiaSky(context, time);
  drawHelenWorld(context, cameraX, cameraY, time);
  drawJoeWorld(context, cameraX, cameraY, time);
  drawJuWorld(context, cameraX, cameraY, time);
  drawJulianWorld(context, cameraX, cameraY, time);
  drawOscarWorld(context, cameraX, cameraY, time);
  drawReiWorld(context, cameraX, cameraY, time, 1, 1, adamHeight);
  drawNoelWorld(context, cameraX, cameraY, time, 1, 1, adamHeight);
  drawMikeWorld(context, cameraX, cameraY, time, 1, 1, adamHeight);
  drawLucyWorld(context, cameraX, cameraY, time, 1, 1, adamHeight);
  drawKatieWorld(context, cameraX, cameraY, time, 1, 1, adamHeight);
  if (playerVisible) {
    drawMaddyTeaPower(context, player.x - cameraX, player.y - cameraY, height, time);
    drawEdPower(context, player.x - cameraX, player.y - cameraY);
    drawAdamPower(context, player.x - cameraX, player.y - cameraY, adamHeight, SEAL_MODE);
    drawSamPower(context, player.x - cameraX, player.y - cameraY, adamHeight, time);
    drawTimPower(context, player.x - cameraX, player.y - cameraY, time, adamHeight);
    drawOscarPower(context, player.x - cameraX, player.y - cameraY, height, time, player.direction.endsWith('Left') || player.direction === 'left');
    drawAndyPlayer(context, player.x - cameraX, player.y - cameraY, adamHeight, time);
    drawChrisPlayer(context, player.x - cameraX, player.y - cameraY, adamHeight, time, player.direction.endsWith('Left') || player.direction === 'left');
    drawDanPlayer(context, player.x - cameraX, player.y - cameraY, adamHeight, time);
  }

  const thief = getCaveThief();
  const thiefDialogue = getCaveThiefDialogue();
  if (thief && thiefDialogue) {
    drawSpeechBubble(context, thiefDialogue, thief.x - cameraX, thief.y - cameraY - thief.size);
  }
  const gymTimDialogue = getGymTimCutsceneDialogue();
  if (gymTimDialogue) drawSpeechBubble(context, gymTimDialogue.text, gymTimDialogue.x - cameraX, gymTimDialogue.y - cameraY);
  drawTimWorld(context, player.x - cameraX, player.y - cameraY, time, adamHeight);
  drawPlayerHealth(context, time);
  drawAlexResurrection(context, player.x - cameraX, player.y - cameraY, time);
}

export function drawLoadFailure(): void {
  context.fillStyle = '#0b1c10';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#f5fff6';
  context.font = '13px monospace';
  context.textAlign = 'center';
  context.fillText('Could not load the game assets.', canvas.width / 2, canvas.height / 2);
}
