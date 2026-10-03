import { loadAssets } from './assets.js';
import { setupAudioMute } from './audio-mute.js';
import { setupBusIntro, updateBusIntro } from './bus-intro.js';
import {
  getCaveThief,
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
import { setupInventory, updatePowerups } from './inventory.js';
import { updateHole } from './hole.js';
import { isJumpMenuOpen, setupJump } from './jump.js';
import { setupMusicPlayer } from './music-player.js';
import { resetMusicLibrary } from './music-library.js';
import { loadMapCharacters } from './map-characters.js';
import { MAP_CHARACTER_DEFINITIONS } from './map-characters.js';
import { isNiallFollowing, niallState, updateNiallInteraction } from './niall.js';
import { restoreBuildingAmbience, updateBuildingAmbience } from './nightclub-audio.js';
import { resetTimRoute } from './tim-location.js';
import { removeGift, PORTABLE_WALKMAN } from './inventory-gifts.js';
import { hasMikeAftermath, resetMikeAftermath, resetNiallQuestState } from './world-state.js';
import { ADAM, ALEX_S, ED, KATY, MIKE, REI, isNpcDialogueOpen, resetNpcGiftProgress, setupNpcInteractions, updateNpcInteractions } from './npcs.js';
import { player, updatePlayer } from './player.js';
import { draw, drawLoadFailure } from './render.js';
import { updateSigns } from './signs.js';
import { maddyWorldDeltaTime } from './maddy-tea-power.js';
import { georgiaState } from './georgia.js';
import { samTargetId, type SamPowerTarget, updateSamPower } from './sam-power.js';

let previousTime = 0;
let worldAnimationTime = 0;
restoreBuildingAmbience(new URLSearchParams(window.location.search).get('door'));

const STATIC_SAM_TARGETS: readonly SamPowerTarget[] = [
  ...MAP_CHARACTER_DEFINITIONS.map((character) => ({
    id: samTargetId(character.name),
    x: character.x,
    y: character.y,
    height: character.height,
  })),
  { id: 'adam', x: ADAM.x, y: ADAM.y, height: ADAM.height },
  { id: 'alex-s', x: ALEX_S.x, y: ALEX_S.y, height: ALEX_S.height },
  { id: 'ed', x: ED.x, y: ED.y, height: ED.height },
  { id: 'katy', x: KATY.x, y: KATY.y, height: KATY.height },
  { id: 'rei', x: REI.x, y: REI.y, height: REI.height },
];

function currentSamTargets(): readonly SamPowerTarget[] {
  const thief = getCaveThief();
  const niallX = isNiallFollowing() ? player.x - 34 : niallState.x;
  const niallY = isNiallFollowing() ? player.y + 12 : niallState.y;
  const targets: SamPowerTarget[] = [
    ...STATIC_SAM_TARGETS,
    { id: 'niall', x: niallX, y: niallY, height: 40 },
    { id: 'georgia', x: georgiaState.x, y: georgiaState.y, height: 46 },
  ];
  if (!hasMikeAftermath()) targets.push({ id: 'mike', x: MIKE.x, y: MIKE.y, height: MIKE.height });
  if (thief) targets.push({ id: 'cave-thief', x: thief.x, y: thief.y, height: thief.size });
  return targets;
}

function gameLoop(time: number): void {
  const deltaTime = previousTime === 0 ? 0 : Math.min((time - previousTime) / 1000, 0.05);
  const worldDeltaTime = maddyWorldDeltaTime(deltaTime, time);
  worldAnimationTime = previousTime === 0 ? time : worldAnimationTime + worldDeltaTime * 1000;
  previousTime = time;
  updatePowerups(time);
  updateBusIntro(deltaTime, player);
  updatePlayer(deltaTime, 1);
  updateHole(deltaTime, player);
  updateBuildingAmbience(player.x, player.y);
  updateSamPower(time, player.x, player.y, currentSamTargets());
  if (isJumpMenuOpen()) {
    draw(time, worldAnimationTime);
    requestAnimationFrame(gameLoop);
    return;
  }
  updateCaveThief(worldDeltaTime, time, player.x, player.y, 1);
  updateGeorgia(worldDeltaTime);
  updateGymTimCutscene(worldDeltaTime, player);
  updateNpcInteractions(player.x, player.y);
  if (!isCaveThiefPursuitActive()) {
    updateNiallInteraction(worldDeltaTime, player.x, player.y);
  }
  if (!isNpcDialogueOpen()) {
    updateSigns(player.x, player.y);
  }
  updateDoors(player.x, player.y);
  draw(time, worldAnimationTime);
  requestAnimationFrame(gameLoop);
}

setupInput();
setupAudioMute();
setupBusIntro();
setupInventory();
setupJump();
setupMusicPlayer();
setupNpcInteractions();
setupCaveThief();
setupGymTimCutscene();
requireElement<HTMLButtonElement>('#reset-all').addEventListener('click', () => {
  resetTimRoute();
  resetNiallQuestState();
  resetMikeAftermath();
  resetNpcGiftProgress();
  resetMusicLibrary();
  removeGift(PORTABLE_WALKMAN);
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
