import { images } from './assets.js';
import { ADAM, ALEX_S, ED, MIKE, REI } from './npcs.js';
import { drawMapCharacters } from './map-characters.js';
import { drawGymTimCutscene, shouldHideMapTim } from './gym-tim-cutscene.js';

function drawNpc(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  npc: { x: number; y: number; width: number; height: number },
  cameraX: number,
  cameraY: number,
): void {
  context.drawImage(
    image,
    Math.round(npc.x - cameraX - npc.width / 2),
    Math.round(npc.y - cameraY - npc.height),
    npc.width,
    npc.height,
  );
}

export function drawOverworldNpcs(
  context: CanvasRenderingContext2D,
  cameraX: number,
  cameraY: number,
): void {
  context.save();
  context.imageSmoothingEnabled = false;
  drawMapCharacters(context, cameraX, cameraY, (character) =>
    character.name !== 'Tim' || !shouldHideMapTim());
  drawNpc(context, images.mike, MIKE, cameraX, cameraY);
  drawNpc(context, images.rei, REI, cameraX, cameraY);
  drawNpc(context, images.adam, ADAM, cameraX, cameraY);
  drawNpc(context, images.ed, ED, cameraX, cameraY);
  drawNpc(context, images.alexS, ALEX_S, cameraX, cameraY);
  drawGymTimCutscene(context, images.timMap, cameraX, cameraY);
  context.restore();
}
