import { withCharacterPowers } from './character-power-render.js';
import { images } from './assets.js';
import { ADAM, ALEX_S, ED, KATY, MIKE, REI } from './npcs.js';
import { drawMapCharacters } from './map-characters.js';
import { drawGymTimCutscene } from './gym-tim-cutscene.js';
import { hasMikeAftermath } from './world-state.js';
import { samVictimOffset } from './sam-power.js';
import { isOscarEaten } from './oscar-power.js';

const REI_PAINT = { x: 438, y: 490, width: 15, height: 20 } as const;

function drawNpc(
  context: CanvasRenderingContext2D,
  id: string,
  image: HTMLImageElement,
  npc: { x: number; y: number; width: number; height: number },
  cameraX: number,
  cameraY: number,
): void {
  if (isOscarEaten(id)) return;
  const offset = samVictimOffset(id);
  withCharacterPowers(context, npc.x - cameraX, npc.y - cameraY, npc.height, id, () => context.drawImage(
    image,
    Math.round(npc.x - cameraX - npc.width / 2 + offset.x),
    Math.round(npc.y - cameraY - npc.height + offset.y),
    npc.width,
    npc.height,
  ));
}

export function drawOverworldNpcs(
  context: CanvasRenderingContext2D,
  cameraX: number,
  cameraY: number,
): void {
  context.save();
  context.imageSmoothingEnabled = false;
  drawMapCharacters(context, cameraX, cameraY);
  if (!hasMikeAftermath()) drawNpc(context, 'mike', images.mike, MIKE, cameraX, cameraY);
  drawNpc(context, 'rei', images.rei, REI, cameraX, cameraY);
  if (hasMikeAftermath()) drawNpc(context, 'rei', images.paint, REI_PAINT, cameraX, cameraY);
  drawNpc(context, 'adam', images.adam, ADAM, cameraX, cameraY);
  drawNpc(context, 'ed', images.ed, ED, cameraX, cameraY);
  drawNpc(context, 'alex-s', images.alexS, ALEX_S, cameraX, cameraY);
  drawNpc(context, 'katy', images.katy, KATY, cameraX, cameraY);
  drawGymTimCutscene(context, images.timMap, cameraX, cameraY);
  context.restore();
}
