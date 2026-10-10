import { drawTimPower, drawTimPowerGround, drawTimWorld } from './tim-power-render.js';
import { drawSamPower, drawSamVictimEffects, drawSamWorldOverlay, drawSamTerrain, drawSamGround } from './sam-power-render.js';
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
import { withCharacterPowers } from './character-power-render.js';
import { drawDanPlayer, drawDanWorld } from './dan-power-render.js';
import { drawChrisPlayer, drawChrisWorld } from './chris-power-render.js';
import { drawBochraFloor, drawBochraLights } from './bochra-power-render.js';
import { drawColander } from './colander.js';
import { CAVE_SIBLINGS, CAVE_SIBLINGS_IDLE_FRAME, CAVE_SIBLINGS_WALK_FRAMES, CaveSiblingsController } from './cave-siblings.js';
import { SHOW_COLLISION_SHAPES } from './config.js';
import { canvas, context } from './dom.js';
import { InteriorCollision } from './interior-collision.js';
import { InteriorDoorsController } from './interior-doors.js';
import { drawSceneryNpcs } from './interior-scenery-npcs.js';
import { drawMaddyTeaPower, drawMaddyTeaWorldOverlay } from './maddy-tea-power.js';
import { drawEdPower } from './ed-power.js';
import { adamJumpOffset, adamPowerSecondsLeft, drawAdamPower, drawAdamShadow } from './adam-power.js';
import { drawOscarPower, drawOscarWorldBites, drawOscarTerrain, drawOscarWorld } from './oscar-power-render.js';
import { isOscarEaten } from './oscar-power.js';
import { drawAlexResurrection } from './alex-s-power-render.js';
import { drawAndyPlayer, drawAndyWorld } from './andy-world-power.js';
import { LucyController } from './lucy.js';
import { getPlayerSpriteFrame } from './player-sprite.js';
import { ART_STUDIO_WALLS, CAVE_COLANDER, CAVE_WALLS, NOEL } from './interior-scenes.js';
import type { Direction } from './types.js';
import type { InteriorScene } from './interior-scenes.js';
import type { InteriorSceneryNpc } from './interior-scenery-npcs.js';

interface InteriorRenderOptions {
  scene: InteriorScene;
  player: { x: number; y: number; direction: Direction; frame: number };
  sealMode: boolean;
  collision: InteriorCollision;
  interior: HTMLImageElement; collisionMask: HTMLImageElement; doorOverlay: HTMLImageElement;
  spriteSheet: HTMLImageElement; noelSprite: HTMLImageElement; siblingsSprite: HTMLImageElement;
  musicDjMachine: HTMLImageElement; gymGloves: HTMLImageElement;
  bookshopNpcs: readonly InteriorSceneryNpc[]; musicHouseNpcs: readonly InteriorSceneryNpc[]; gymNpcs: readonly InteriorSceneryNpc[]; cinemaNpcs: readonly InteriorSceneryNpc[];
  caveSiblings: CaveSiblingsController | null;
  lucy: LucyController | null;
  interiorDoors: InteriorDoorsController;
  getCaveColanderHeld: () => boolean;
}

export function createInteriorRenderer(options: InteriorRenderOptions): (timeMs: number, worldTimeMs?: number) => void {
  const { scene, player, collision, interior, collisionMask, doorOverlay, spriteSheet, noelSprite, siblingsSprite, musicDjMachine, gymGloves, bookshopNpcs, musicHouseNpcs, gymNpcs, cinemaNpcs, caveSiblings, lucy, interiorDoors } = options;
  const SEAL_MODE = options.sealMode;
  const WORLD_WIDTH = scene.width; const WORLD_HEIGHT = scene.height;
  const VIEW_SCALE = 1; const PLAYER_SCALE = 2;
  const isCaveInterior = scene.kind === 'cave'; const isDiaryLabInterior = scene.kind === 'diaryLab';
  const isMansionInterior = scene.kind === 'mansion'; const isMusicShopInterior = scene.kind === 'musicShop';
  const isGymInterior = scene.kind === 'gym'; const isBookshopInterior = scene.kind === 'bookshop'; const isPlantRoomInterior = scene.kind === 'plantRoom';
  return function draw(timeMs = 0, worldTimeMs = timeMs): void {
    const caveColanderHeld = options.getCaveColanderHeld();
    // The cave is small enough to show in full with no camera panning at all;
    // every other interior is bigger than the canvas and keeps scrolling.
    const viewportWidth = isCaveInterior ? WORLD_WIDTH : Math.min(WORLD_WIDTH, canvas.width / VIEW_SCALE);
    const viewportHeight = isCaveInterior ? WORLD_HEIGHT : Math.min(WORLD_HEIGHT, canvas.height / VIEW_SCALE);
    const cameraX = Math.round(Math.max(0, Math.min(WORLD_WIDTH - viewportWidth, player.x - viewportWidth / 2)));
    const cameraY = Math.round(Math.max(0, Math.min(WORLD_HEIGHT - viewportHeight, player.y - viewportHeight / 2)));
    // Stretch the viewport to fill the canvas on both axes so a world smaller
    // than the canvas (the cave) shows in full with no letterboxed black bars.
    const scaleX = canvas.width / viewportWidth;
    const scaleY = canvas.height / viewportHeight;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#0b0d0d';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.save();
    const interiorSourceScale = scene.sourceScale;
    context.drawImage(
      interior,
      cameraX * interiorSourceScale,
      cameraY * interiorSourceScale,
      viewportWidth * interiorSourceScale,
      viewportHeight * interiorSourceScale,
      0,
      0,
      viewportWidth * scaleX,
      viewportHeight * scaleY,
    );
    drawOscarTerrain(context, cameraX, cameraY, timeMs, scaleX, scaleY);
    drawReiTerrain(context, timeMs);
    drawSamTerrain(context, cameraX, cameraY, timeMs, scaleX, scaleY);
    drawHelenTerrain(context, timeMs);
    drawJoeTerrain(context, timeMs);
    drawJuTerrain(context, timeMs);
    drawJulianTerrain(context, timeMs);
    drawKatieTerrain(context, timeMs);
    drawNoelTerrain(context, timeMs);
    drawNoelGround(context, cameraX, cameraY, timeMs, scaleX, scaleY);
    drawMikeTerrain(context, timeMs);
    drawMikeGround(context, cameraX, cameraY, timeMs, scaleX, scaleY);
    drawLucyGround(context, cameraX, cameraY, timeMs, scaleX, scaleY);
    drawKatieGround(context, cameraX, cameraY, timeMs, scaleX, scaleY);
    drawJulianGround(context, cameraX, cameraY, timeMs, scaleX, scaleY);
    drawJuGround(context, cameraX, cameraY, timeMs, scaleX, scaleY);
    drawJoeGround(context, cameraX, cameraY, timeMs, scaleX, scaleY);
    drawHelenGround(context, cameraX, cameraY, timeMs, scaleX, scaleY);
    drawReiGround(context, cameraX, cameraY, timeMs, scaleX, scaleY);
    drawSamGround(context, cameraX, cameraY, timeMs, scaleX, scaleY);
    drawTimPowerGround(context, cameraX, cameraY, timeMs, scaleX, scaleY);
    context.save();
    context.scale(scaleX, scaleY);
    drawOscarWorldBites(context, cameraX, cameraY, timeMs);
    drawBochraFloor(context, cameraX, cameraY, timeMs);
    drawGeorgiaGround(context, cameraX, cameraY, timeMs);
    context.restore();
    if (isCaveInterior && !isOscarEaten('siblings')) {
      // The background art bakes in a colander graphic that the darkness
      // overlay would otherwise dim; always erase it here and redraw it (below,
      // after the overlay) so it stays fully lit like the player.
      context.fillStyle = '#0b0d0d';
      context.fillRect(
        (CAVE_COLANDER.eraseX - cameraX) * scaleX,
        (CAVE_COLANDER.eraseY - cameraY) * scaleY,
        CAVE_COLANDER.eraseWidth * scaleX,
        CAVE_COLANDER.eraseHeight * scaleY,
      );
    }
    if (isCaveInterior && !isOscarEaten('siblings')) {
      const frame = caveSiblings?.isEntering
        ? CAVE_SIBLINGS_WALK_FRAMES[caveSiblings.walkFrame]
        : CAVE_SIBLINGS_IDLE_FRAME;
      if (frame) {
        const [sourceX, sourceY, sourceWidth, sourceHeight] = frame;
        withCharacterPowers(context, (CAVE_SIBLINGS.x - cameraX) * scaleX, ((caveSiblings?.y ?? CAVE_SIBLINGS.endY) - cameraY) * scaleY, CAVE_SIBLINGS.height * scaleY, 'siblings', () => context.drawImage(
          siblingsSprite,
          sourceX,
          sourceY,
          sourceWidth,
          sourceHeight,
          Math.round((CAVE_SIBLINGS.x - cameraX - CAVE_SIBLINGS.width / 2) * scaleX),
          Math.round(((caveSiblings?.y ?? CAVE_SIBLINGS.endY) - cameraY - CAVE_SIBLINGS.height) * scaleY),
          CAVE_SIBLINGS.width * scaleX,
          CAVE_SIBLINGS.height * scaleY,
        ), timeMs);
      }
    }
    if ((isDiaryLabInterior || isMansionInterior) && !isOscarEaten('noel')) {
      withCharacterPowers(context, (NOEL.x - cameraX) * scaleX, (NOEL.y - cameraY) * scaleY, NOEL.height * scaleY, 'noel', () => context.drawImage(
        noelSprite,
        Math.round((NOEL.x - cameraX - NOEL.width / 2) * scaleX),
        Math.round((NOEL.y - cameraY - NOEL.height) * scaleY),
        NOEL.width * scaleX,
        NOEL.height * scaleY,
      ), timeMs);
    }
    if (isMusicShopInterior) {
      drawSceneryNpcs(context, musicHouseNpcs, cameraX, cameraY, scaleX, scaleY, worldTimeMs);
    }
    if (isGymInterior) {
      context.drawImage(gymGloves, Math.round((292 - cameraX) * scaleX + 50), Math.round((270 - cameraY - 195) * scaleY), 50 * scaleX, 81 * scaleY);
      drawSceneryNpcs(context, gymNpcs, cameraX, cameraY, scaleX, scaleY, worldTimeMs);
    }
    if (isBookshopInterior) drawSceneryNpcs(context, bookshopNpcs, cameraX, cameraY, scaleX, scaleY);
    if (scene.kind === 'cinema') drawSceneryNpcs(context, cinemaNpcs, cameraX, cameraY, scaleX, scaleY, worldTimeMs);
    if (isPlantRoomInterior) drawSceneryNpcs(context, [{ id: 'lucy', x: 355, y: 350, width: 42, height: 75, image: lucy!.sprite }], cameraX, cameraY, scaleX, scaleY);
    if (SHOW_COLLISION_SHAPES) {
      context.save();
      context.globalAlpha = 0.55;
      if (isCaveInterior || scene.kind === 'artStudio') {
        context.fillStyle = '#005cff';
        for (const [wallX, wallY, wallWidth, wallHeight] of isCaveInterior ? CAVE_WALLS : ART_STUDIO_WALLS) {
          context.fillRect(
            (wallX - cameraX) * scaleX,
            (wallY - cameraY) * scaleY,
            wallWidth * scaleX,
            wallHeight * scaleY,
          );
        }
      } else if (isMusicShopInterior || isGymInterior || isBookshopInterior || scene.kind === 'mansion' || scene.kind === 'plantRoom') {
        context.fillStyle = '#005cff';
        const firstColumn = Math.max(0, Math.floor(cameraX / collision.cellSize));
        const lastColumn = Math.min(collision.columns - 1, Math.ceil((cameraX + viewportWidth) / collision.cellSize));
        const firstRow = Math.max(0, Math.floor(cameraY / collision.cellSize));
        const lastRow = Math.min(collision.rows - 1, Math.ceil((cameraY + viewportHeight) / collision.cellSize));
        for (let row = firstRow; row <= lastRow; row += 1) {
          for (let column = firstColumn; column <= lastColumn; column += 1) {
            const x = column * collision.cellSize;
            const y = row * collision.cellSize;
            if (!collision.isBlocked(x + collision.cellSize / 2, y + collision.cellSize / 2)) continue;
            context.fillRect(
              (x - cameraX) * scaleX,
              (y - cameraY) * scaleY,
              collision.cellSize * scaleX,
              collision.cellSize * scaleY,
            );
          }
        }
      } else {
        const collisionSourceScale = 1;
        context.drawImage(
          collisionMask,
          cameraX * collisionSourceScale,
          cameraY * collisionSourceScale,
          viewportWidth * collisionSourceScale,
          viewportHeight * collisionSourceScale,
          0,
          0,
          canvas.width,
          canvas.height,
        );
      }
      context.restore();
    }
    if (isCaveInterior) {
      // Darken the environment and the siblings but never the player, who
      // should stay fully visible regardless of how dark the cave gets.
      context.save();
      context.globalAlpha = caveSiblings?.darknessAlpha ?? 0.2;
      context.fillStyle = '#000';
      context.fillRect(0, 0, viewportWidth * scaleX, viewportHeight * scaleY);
      context.restore();
    }
    if (isCaveInterior && !caveColanderHeld) {
      drawColander(
        context,
        Math.round((CAVE_COLANDER.x - cameraX) * scaleX),
        Math.round((CAVE_COLANDER.eraseY + 12 - cameraY) * scaleY),
        Math.min(scaleX, scaleY),
      );
    }
    const spriteFrame = getPlayerSpriteFrame(SEAL_MODE, player.direction, player.frame, PLAYER_SCALE);
    const { sourceX, sourceY, sourceWidth, sourceHeight, width, height, baselineOffset } = spriteFrame;
    const adamActive = adamPowerSecondsLeft() > 0;
    const adamLift = adamJumpOffset();
    const adamHeight = adamActive ? Math.round(height * 1.14) : height;
    if (adamActive) drawAdamShadow(context, (player.x - cameraX) * scaleX, (player.y - cameraY) * scaleY);
    withCharacterPowers(context, (player.x - cameraX) * scaleX, (player.y - cameraY) * scaleY, adamHeight * scaleY, 'player', () => context.drawImage(
      spriteSheet,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      Math.round((player.x - cameraX - width / 2) * scaleX),
      Math.round((player.y - cameraY - adamHeight - adamLift + baselineOffset) * scaleY),
      width * scaleX,
      adamHeight * scaleY,
    ), timeMs);
    if (caveColanderHeld) {
      drawColander(
        context,
        Math.round((player.x - cameraX + 19) * scaleX),
        Math.round((player.y - cameraY - 30) * scaleY),
        Math.min(scaleX, scaleY),
      );
    }
    interiorDoors.drawOverlay(context, doorOverlay, cameraX, cameraY, scaleX);
    if (isMusicShopInterior) context.drawImage(
      musicDjMachine,
      Math.round((247 - cameraX) * scaleX),
      Math.round((254 - cameraY) * scaleY),
      48 * scaleX,
      30 * scaleY,
    );
    context.restore();
    drawMaddyTeaWorldOverlay(context, timeMs);
    drawAndyWorld(context, cameraX, cameraY, timeMs, scaleX, scaleY);
    drawBochraLights(context, cameraX, cameraY, timeMs, scaleX, scaleY);
    drawChrisWorld(context, cameraX, cameraY, timeMs, scaleX, scaleY);
    drawDanWorld(context, cameraX, cameraY, timeMs, scaleX, scaleY);
    drawGeorgiaSky(context, timeMs);
    drawHelenWorld(context, cameraX, cameraY, timeMs, scaleX, scaleY);
    drawJoeWorld(context, cameraX, cameraY, timeMs, scaleX, scaleY);
    drawJuWorld(context, cameraX, cameraY, timeMs, scaleX, scaleY);
    drawJulianWorld(context, cameraX, cameraY, timeMs, scaleX, scaleY);
    drawOscarWorld(context, cameraX, cameraY, timeMs, scaleX, scaleY);
    drawReiWorld(context, cameraX, cameraY, timeMs, scaleX, scaleY, adamHeight);
    drawSamVictimEffects(context, cameraX, cameraY, timeMs, scaleX, scaleY);
    drawSamWorldOverlay(context, timeMs);
    drawNoelWorld(context, cameraX, cameraY, timeMs, scaleX, scaleY, adamHeight);
    drawMikeWorld(context, cameraX, cameraY, timeMs, scaleX, scaleY, adamHeight);
    drawLucyWorld(context, cameraX, cameraY, timeMs, scaleX, scaleY, adamHeight, false);
    drawKatieWorld(context, cameraX, cameraY, timeMs, scaleX, scaleY, adamHeight);
    context.save();
    context.scale(scaleX, scaleY);
    drawMaddyTeaPower(context, player.x - cameraX, player.y - cameraY, height, timeMs);
    drawEdPower(context, player.x - cameraX, player.y - cameraY);
    drawAdamPower(context, player.x - cameraX, player.y - cameraY, adamHeight, SEAL_MODE);
    drawSamPower(context, player.x - cameraX, player.y - cameraY, adamHeight, timeMs);
    drawTimPower(context, player.x - cameraX, player.y - cameraY, timeMs, adamHeight);
    drawOscarPower(context, player.x - cameraX, player.y - cameraY, height, timeMs, player.direction.endsWith('Left') || player.direction === 'left');
    drawAndyPlayer(context, player.x - cameraX, player.y - cameraY, adamHeight, timeMs);
    drawChrisPlayer(context, player.x - cameraX, player.y - cameraY, adamHeight, timeMs, player.direction.endsWith('Left') || player.direction === 'left');
    drawDanPlayer(context, player.x - cameraX, player.y - cameraY, adamHeight, timeMs);
    context.restore();
    drawTimWorld(context, (player.x - cameraX) * scaleX, (player.y - cameraY) * scaleY, timeMs, adamHeight * scaleY);
    drawPlayerHealth(context, timeMs);
    drawAlexResurrection(context, (player.x - cameraX) * scaleX, (player.y - cameraY) * scaleY, timeMs, scaleX, scaleY);
  }
}
