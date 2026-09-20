import { loadAssets } from './assets.js';
import { setupBusIntro, updateBusIntro } from './bus-intro.js';
import {
  isCaveThiefPursuitActive,
  setupCaveThief,
  updateCaveThief,
} from './cave-thief.js';
import { COLLISION_SHAPES } from './collision-data.js';
import { canvas, requireElement } from './dom.js';
import { updateDoors } from './doors.js';
import { updateGeorgia } from './georgia.js';
import { setupGymTimCutscene, updateGymTimCutscene } from './gym-tim-cutscene.js';
import { setupInput } from './input.js';
import { getSpeedMultiplier, setupInventory, updatePowerups } from './inventory.js';
import { updateHole } from './hole.js';
import { isJumpMenuOpen, setupJump } from './jump.js';
import { setupMusicPlayer } from './music-player.js';
import { loadMapCharacters } from './map-characters.js';
import { updateNiallInteraction } from './niall.js';
import { resetTimRoute } from './tim-location.js';
import { isNpcDialogueOpen, setupNpcInteractions, updateNpcInteractions } from './npcs.js';
import { player, updatePlayer } from './player.js';
import { draw, drawLoadFailure } from './render.js';
import { updateSigns } from './signs.js';

let previousTime = 0;

function gameLoop(time: number): void {
  const deltaTime = previousTime === 0 ? 0 : Math.min((time - previousTime) / 1000, 0.05);
  previousTime = time;
  updatePowerups(time);
  const speedMultiplier = getSpeedMultiplier();
  updateBusIntro(deltaTime, player);
  updatePlayer(deltaTime, speedMultiplier);
  updateHole(deltaTime, player);
  if (isJumpMenuOpen()) {
    draw(time);
    requestAnimationFrame(gameLoop);
    return;
  }
  updateCaveThief(deltaTime, time, player.x, player.y, speedMultiplier);
  updateGeorgia(deltaTime);
  updateGymTimCutscene(deltaTime, player);
  updateNpcInteractions(player.x, player.y);
  if (!isCaveThiefPursuitActive()) {
    updateNiallInteraction(deltaTime, player.x, player.y);
  }
  if (!isNpcDialogueOpen()) {
    updateSigns(player.x, player.y);
  }
  updateDoors(player.x, player.y);
  draw(time);
  requestAnimationFrame(gameLoop);
}

setupInput();
setupBusIntro();
setupInventory();
setupJump();
setupMusicPlayer();
setupNpcInteractions();
setupCaveThief();
setupGymTimCutscene();
requireElement<HTMLButtonElement>('#tim-route-debug-reset').addEventListener('click', () => {
  resetTimRoute();
  window.location.assign('index.html');
});

Promise.all([loadAssets(), loadMapCharacters()])
  .then(() => {
    canvas.dataset.collisionShapes = String(COLLISION_SHAPES.length);
    requestAnimationFrame(gameLoop);
  })
  .catch((error: unknown) => {
    console.error(error);
    drawLoadFailure();
  });
