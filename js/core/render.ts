import { DOORWAYS } from './doors.js';
import { updateLucyPointerView } from '../powers/lucy/lucy-power-input.js';
import { drawTimPower, drawTimPowerGround, drawTimWorld } from '../powers/tim/tim-power-render.js';
import { drawReiTerrain, drawReiGround, drawReiWorld } from '../powers/rei/rei-power-render.js';
import { drawNoelTerrain, drawNoelGround, drawNoelWorld } from '../powers/noel/noel-power-render.js';
import { drawAliceWorld } from '../powers/alice/alice-power-render.js';
import { drawMikeTerrain, drawMikeGround, drawMikeWorld } from '../powers/mike/mike-power-render.js';
import { drawLucyGround, drawLucyWorld } from '../powers/lucy/lucy-power-render.js';
import { drawKatieTerrain, drawKatieGround, drawKatieWorld } from '../powers/katie/katie-power-render.js';
import { drawJulianTerrain, drawJulianGround, drawJulianWorld } from '../powers/julian/julian-power-render.js';
import { drawJuTerrain, drawJuGround, drawJuWorld } from '../powers/ju/ju-power-render.js';
import { drawJoeTerrain, drawJoeGround, drawJoeWorld } from '../powers/joe/joe-power-render.js';
import { drawHelenGround, drawHelenTerrain, drawHelenWorld } from '../powers/helen/helen-power-render.js';
import { drawGeorgiaGround, drawGeorgiaSky } from '../powers/georgia/georgia-power-render.js';
import { isGeorgiaPowerActive } from '../powers/georgia/georgia-power.js';
import { drawDanPlayer, drawDanWorld } from '../powers/dan/dan-power-render.js';
import { withCharacterPowers } from '../powers/shared/character-power-render.js';
import { drawChrisPlayer, drawChrisWorld } from '../powers/chris/chris-power-render.js';
import { drawBochraFloor, drawBochraLights } from '../powers/bochra/bochra-power-render.js';
import { images } from './assets.js';
import { getWheldonPlayerSpriteFrame, isWheldonPlayerSpriteEnabled } from './player-sprite-test.js';
import { getBusIntroCameraCenter, isBusIntroPlayerVisible } from '../overworld/bus-intro.js';
import { getCaveTheftCameraCenter, getCaveThief, getCaveThiefDialogue } from '../overworld/cave-thief.js';
import { drawColander, hasCaveColander } from './colander.js';
import { SCALE, WORLD_HEIGHT, WORLD_WIDTH } from './config.js';
import { canvas, context } from './dom.js';
import { getGymTimCutsceneDialogue } from '../interiors/gym-tim-cutscene.js';
import { getHolePlayerTransform } from './hole.js';
import { isPlayerTripping } from '../powers/katy/katy-power.js';
import { isNiallAlertActive, isNiallFollowing, NIALL, niallState } from '../characters/niall/niall.js';
import { drawOverworldNpcs } from '../overworld/overworld-npcs-render.js';
import { player } from './player.js';
import { getPlayerBody } from './player-body.js';
import { getGhostSpriteFrame, getGhostSpriteSheet } from './ghost-sprite.js';
import { roadAccident } from '../overworld/road-accident.js';
import { getPlayerSpriteFrame } from './player-sprite.js';
import { drawWorldBackground, drawWorldForeground } from '../overworld/overworld-props-render.js';
import { drawMaddyTeaPower, drawMaddyTeaWorldOverlay } from '../powers/maddy/maddy-tea-power.js';
import { adamJumpOffset, adamPowerSecondsLeft, drawAdamPower, drawAdamShadow } from '../powers/adam/adam-power.js';
import { samCameraJolt } from '../powers/sam/sam-power.js';
import { drawSamPower, drawSamVictimEffects, drawSamWorldOverlay, drawSamTerrain, drawSamGround } from '../powers/sam/sam-power-render.js';
import { drawSpeechBubble } from './speech-bubble.js';
import { drawAlexResurrection } from '../powers/alex-s/alex-s-power-render.js';
import { drawOscarPower, drawOscarWorldBites, drawOscarTerrain, drawOscarWorld } from '../powers/oscar/oscar-power-render.js';
import { drawAndyPlayer, drawAndyWorld } from '../powers/andy/andy-world-power.js';
import { drawNiallAt, drawCaveThief, drawBusIntro, drawGeorgia, drawMikeAftermath, drawRoadTraffic } from '../overworld/overworld-characters-render.js';


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
  const body = getPlayerBody();
  const ghostMode = body === 'ghost';
  const ghostWheldonMode = ghostMode && isWheldonPlayerSpriteEnabled();
  canvas.dataset.playerVariant = ghostWheldonMode ? 'ghost-wheldon' : ghostMode ? 'ghost' : body === 'player' ? (SEAL_MODE ? 'seal' : 'default') : body;
  if (LOG_PLAYER_POSITION) logPlayerPosition();

  // Rounded so the map is sampled on whole source pixels: a fractional source
  // rect snaps at a browser-defined threshold and makes the player jitter
  // against the tiles by a pixel on every step.
  const cameraCenter = roadAccident.cameraCenter() ?? getBusIntroCameraCenter() ?? getCaveTheftCameraCenter(player.x, player.y, time);
  const { x: joltX, y: joltY } = samCameraJolt(time);
  const cameraX = Math.round(Math.max(0, Math.min(WORLD_WIDTH - canvas.width, cameraCenter.x - canvas.width / 2 + joltX)));
  const cameraY = Math.round(Math.max(0, Math.min(WORLD_HEIGHT - canvas.height, cameraCenter.y - canvas.height / 2 + joltY)));
  updateLucyPointerView(cameraX, cameraY);
  const worldDepth = drawWorldBackground(worldTime, cameraX, cameraY, player.y);
  drawRoadTraffic(cameraX, cameraY);
  drawOscarTerrain(context, cameraX, cameraY, time);
  drawReiTerrain(context, time, cameraX, cameraY);
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
  drawLucyGround(context, cameraX, cameraY, time, 1, 1, DOORWAYS);
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
    drawNiallAt(cameraX, cameraY, player.x - 34, player.y + 12, player.direction, player.animationTime);
  } else {
    drawNiallAt(cameraX, cameraY, niallState.x, niallState.y, niallState.direction, niallState.animationTime);
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

  const wheldonMode = !ghostMode && (body === 'alex-s' || (body === 'player' && isWheldonPlayerSpriteEnabled()));
  const playerSpriteSheet = ghostWheldonMode ? images.ghostWheldonSprite : ghostMode ? getGhostSpriteSheet(images.ghostSpriteSheet) : wheldonMode ? images.wheldonSprite : SEAL_MODE ? images.sealSpriteSheet : images.spriteSheet;
  const spriteFrame = ghostWheldonMode
    ? getWheldonPlayerSpriteFrame(player.direction, player.animationTime, true)
    : ghostMode
    ? getGhostSpriteFrame(player.direction, player.frame, SCALE)
    : wheldonMode
    ? getWheldonPlayerSpriteFrame(player.direction, player.animationTime)
    : getPlayerSpriteFrame(body === 'player' && SEAL_MODE, player.direction, player.frame, SCALE);
  const { sourceX, sourceY, sourceWidth, sourceHeight, width, height, baselineOffset } = spriteFrame;
  const adamActive = adamPowerSecondsLeft() > 0;
  const adamLift = adamJumpOffset();
  const adamHeight = adamActive ? Math.round(height * 1.14) : height;
  const holeTransform = getHolePlayerTransform();
  const playerVisible = isBusIntroPlayerVisible() && roadAccident.playerVisible;
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
  drawRoadTraffic(cameraX, cameraY, true);
  if (roadAccident.dialogue) drawSpeechBubble(context, roadAccident.dialogue, player.x - cameraX, player.y - cameraY - height - 24);
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
  drawLucyWorld(context, cameraX, cameraY, time);
  drawKatieWorld(context, cameraX, cameraY, time, 1, 1, adamHeight);
  if (playerVisible) {
    drawMaddyTeaPower(context, player.x - cameraX, player.y - cameraY, height, time);
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
  drawAlexResurrection(context, player.x - cameraX, player.y - cameraY, time);
  drawAliceWorld(context, cameraX, cameraY, time);
}

export function drawLoadFailure(): void {
  context.fillStyle = '#0b1c10';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#f5fff6';
  context.font = '13px monospace';
  context.textAlign = 'center';
  context.fillText('Could not load the game assets.', canvas.width / 2, canvas.height / 2);
}
