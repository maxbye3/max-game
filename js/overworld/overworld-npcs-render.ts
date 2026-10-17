import { withCharacterPowers } from '../powers/shared/character-power-render.js';
import { images } from '../core/assets.js';
import { ADAM, ALEX_S, ED, KATY, MIKE, REI } from './npcs.js';
import { drawMapCharacters } from './map-characters.js';
import { drawGymTimCutscene } from '../interiors/gym-tim-cutscene.js';
import { hasMikeAftermath } from '../core/world-state.js';
import { samVictimOffset } from '../powers/sam/sam-power.js';
import { isOscarEaten } from '../powers/oscar/oscar-power.js';
import { getPlayerBody } from '../core/player-body.js';

const REI_PAINT = { x: 438, y: 490, width: 15, height: 20 } as const;
const ALEX_S_RENDER_SCALE = 52 / ALEX_S.height;

function drawNpc(
  context: CanvasRenderingContext2D,
  id: string,
  image: HTMLImageElement,
  npc: { x: number; y: number; width: number; height: number },
  cameraX: number,
  cameraY: number,
  scale = 1,
): void {
  if (isOscarEaten(id)) return;
  const offset = samVictimOffset(id);
  const width = npc.width * scale;
  const height = npc.height * scale;
  withCharacterPowers(context, npc.x - cameraX, npc.y - cameraY, height, id, () => context.drawImage(
    image,
    Math.round(npc.x - cameraX - width / 2 + offset.x),
    Math.round(npc.y - cameraY - height + offset.y),
    width,
    height,
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
  if (getPlayerBody() !== 'alex-s') drawNpc(context, 'alex-s', images.alexS, ALEX_S, cameraX, cameraY, ALEX_S_RENDER_SCALE);
  drawNpc(context, 'katy', images.katy, KATY, cameraX, cameraY);
  drawGymTimCutscene(context, images.timWalk, cameraX, cameraY);
  context.restore();
}
